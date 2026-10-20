/**
 * Phase Unrest — tick unrest for all settlement locations.
 *
 * Unrest represents political instability.
 *
 * **THR-1934 — pressure, not a spike.** With `UNREST_PRESSURE_ENABLED` (the default)
 * this phase hands off to `runUnrestPressure` (`unrestPressure.ts`): once a day each
 * settlement's target is summed from hunger, poverty, a siege, sickness and its recent
 * dead, less its contentment, and every tick unrest drifts toward it by at most
 * `UNREST_DRIFT_PER_DAY` a day. Restless towns lose people; a town that turns Lawless
 * while hungry riots. S2 (THR-1957): a held town On the edge (70) may turn to a better
 * lord, and a town at 90 rises against its holder (or, unheld, empties).
 *
 * With the flag off, the legacy model below runs unchanged:
 *   - Driven UP by player actions (Incite Unrest), agent betrayals, low prosperity
 *   - Driven DOWN by natural decay each tick; prosperity acts as a damper
 *
 * NFP compliance:
 *   #1 Tunability: all rates and thresholds are named constants
 *   #2 Inspectability: UnrestTickTrace emitted per changed location
 *   #3 Determinism: arithmetic only
 *   #4 Fail-soft: missing unrest defaults to 0; clamp applied
 */
import type { GameState } from '../types/gameState';
import { emitTrace } from './traceBuffer';
import {
  LOC_HEALTH_DAMPENER_THRESHOLD,
  LOC_HEALTH_UNREST_BLEED,
  LOC_HEALTH_DEFAULT_BASELINE,
} from '../data/location-action-constants';
import { UNREST_PRESSURE_ENABLED } from '../data/unrest-pressure-constants';
import { runUnrestPressure } from './unrestPressure';
import type { TurnHooks } from './unrestPressure/turns';

// ─── Constants ────────────────────────────────────────────────────────────────

export const UNREST_DECAY_RATE = 1;
export const UNREST_PROSPERITY_DAMPER = 0.5;
export const UNREST_DEFECTION_THRESHOLD = 70;
export const UNREST_SACK_THRESHOLD = 90;

// ─── Phase function ───────────────────────────────────────────────────────────

/**
 * Tick unrest for all settlement locations.
 *
 * Returns empty object — this phase mutates graph node properties in-place
 * (same pattern as phaseReputationDecay in the orchestrator).
 */
export function phaseUnrest(
  state: GameState,
  opts: { pressure?: boolean } & TurnHooks = {},
): Partial<GameState> {
  if (opts.pressure ?? UNREST_PRESSURE_ENABLED) {
    const { seeds, chronicleEntries, events } = runUnrestPressure(state, {
      getProjection: opts.getProjection,
      onStructure: opts.onStructure,
    });
    const out: Partial<GameState> = {};
    if (seeds.length > 0) out.pendingEncounterSeeds = [...(state.pendingEncounterSeeds ?? []), ...seeds];
    if (chronicleEntries.length > 0) out.chronicleEntries = [...(state.chronicleEntries ?? []), ...chronicleEntries];
    if (events.length > 0) out.tickEvents = [...(state.tickEvents ?? []), ...events];
    return out;
  }
  const graph = state.graph;
  const tick = state.tick;

  const settlements = graph.getNodesByType('location').filter(
    node =>
      node.properties?.locationType === 'settlement' ||
      ['hamlet', 'town', 'city', 'capital'].includes(
        node.properties?.locationSubtype as string,
      ),
  );

  for (const location of settlements) {
    const prevUnrest = typeof location.properties.unrest === 'number'
      ? location.properties.unrest
      : 0;

    const populationHealth = typeof location.properties.populationHealth === 'number'
      ? location.properties.populationHealth
      : LOC_HEALTH_DEFAULT_BASELINE;
    const healthBleed = populationHealth < LOC_HEALTH_DAMPENER_THRESHOLD
      ? LOC_HEALTH_UNREST_BLEED
      : 0;

    // Nothing to do if unrest is at 0 and health is healthy
    if (prevUnrest === 0 && healthBleed === 0) continue;

    const prosperity = typeof location.properties.prosperity === 'number'
      ? location.properties.prosperity
      : 0;

    // Natural decay
    let decay = UNREST_DECAY_RATE;
    // Extra damper if prosperity is high
    const prosperityDamper = prosperity > 60 ? UNREST_PROSPERITY_DAMPER : 0;
    decay += prosperityDamper;

    // THR-401: low population health bleeds unrest upward, partially or fully
    // counteracting natural decay
    const newUnrest = Math.max(0, Math.min(100, prevUnrest - decay + healthBleed));

    // Check threshold crossings (downward — unrest is decaying, so we check if
    // it dropped below a threshold from above, not rose above)
    const thresholdsCrossed: string[] = [];
    if (prevUnrest >= UNREST_DEFECTION_THRESHOLD && newUnrest < UNREST_DEFECTION_THRESHOLD) {
      thresholdsCrossed.push('defection_cleared');
    }
    if (prevUnrest >= UNREST_SACK_THRESHOLD && newUnrest < UNREST_SACK_THRESHOLD) {
      thresholdsCrossed.push('sack_risk_cleared');
    }

    location.properties.unrest = newUnrest;

    emitTrace({
      tick,
      category: 'unrest_tick',
      summary: `Unrest at ${location.name}: ${prevUnrest.toFixed(1)} → ${newUnrest.toFixed(1)}`,
      locationId: location.id,
      locationName: location.name,
      prevUnrest,
      newUnrest,
      decayApplied: decay,
      prosperityDamper,
      thresholdsCrossed,
    } as any);
  }

  return {};
}
