/**
 * Phase: Settlement Tier Promotion / Demotion
 *
 * When a settlement sustains prosperity above SETTLEMENT_PROMOTION_PROSPERITY
 * for SETTLEMENT_PROMOTION_SUSTAIN_TICKS, it promotes one tier (hamlet→town→city).
 * When it sustains prosperity below SETTLEMENT_DEMOTION_PROSPERITY for the same
 * duration, it demotes one tier (city→town→hamlet).
 *
 * Capitals never change tier. The phase tracks sustain counters on location nodes
 * (prosperitySustainAboveTicks, prosperitySustainBelowTicks) and resets them
 * after a tier change.
 *
 * Each tier change:
 * - Mutates the node's locationSubtype in place
 * - Emits a settlement_tier_change trace
 * - Pushes a chronicle TickEvent (significance 0.9)
 *
 * **THR-1923 — the settlement economy drives the tier.** With `SETTLEMENT_ECONOMY_ENABLED`
 * and `SETTLEMENT_ECONOMY_DRIVES_TIER` on, a settlement carrying the economy's
 * `targetTier` (population plus seat) moves one step toward it after
 * SETTLEMENT_PROMOTION_SUSTAIN_TICKS ticks of disagreeing with it, in either direction —
 * **a capital included**: a capital that loses its realm seat drops to city or below. The
 * prosperity trigger below is the fallback for a settlement the economy has not reached
 * and for the flag off. Plan: Docs/plans/2026-10-14-thr-1923-settlement-economy.md.
 *
 * Design doc: Docs/plans/2026-03-17-gold-reach-economic-systems-design.md
 * Phase 4 item 10 — Settlement promotion/demotion
 * NFP priorities: Tunability, Inspectability, Fail-soft
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { ChronicleChapter } from '../types/chronicle';
import { emitTrace } from './traceBuffer';
import {
  SETTLEMENT_PROMOTION_PROSPERITY,
  SETTLEMENT_PROMOTION_SUSTAIN_TICKS,
  SETTLEMENT_DEMOTION_PROSPERITY,
} from './phaseProsperity';
import { resolveEconomicChronicle, chronicleSeed } from './economicChronicle';
import type { SimulationRuntime } from './simulationRuntime';
import { applyEncounterCacheUpdate } from './simulationRuntime';
import {
  LOC_HEALTH_DAMPENER_THRESHOLD,
  LOC_HEALTH_DEFAULT_BASELINE,
} from '../data/location-action-constants';
import {
  SETTLEMENT_ECONOMY_ENABLED,
  SETTLEMENT_ECONOMY_DRIVES_TIER,
  type SettlementTier,
} from '../data/settlement-economy-constants';
import { stepToward, tierRank } from './settlementEconomy/tier';
import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import { getFortificationModifier } from './siegeResolution';

/**
 * THR-2089: a stored `fortificationMultiplier` (written by `fortify_location` or a siege
 * breach) shadows the subtype base in siege resolution. On promotion, lift a stored value
 * below the new tier's base up to that base, so a town fortified by a god does not defend
 * below an unfortified city once it grows into one. Demotion keeps the stored value, and so
 * do breached walls (`fortificationBreached`): growth does not repair a breach (review gate).
 */
function liftStoredFortification(loc: GraphNode, to: string): void {
  const stored = loc.properties.fortificationMultiplier;
  if (typeof stored !== 'number' || loc.properties.fortificationBreached === true) return;
  const base = getFortificationModifier(to);
  if (stored < base) loc.properties.fortificationMultiplier = base;
}

/** Settlement counters for the economy-driven tier (THR-1923): ticks the tier has disagreed with `targetTier`. */
export const TIER_SUSTAIN_UP_PROP = 'tierSustainUpTicks';
export const TIER_SUSTAIN_DOWN_PROP = 'tierSustainDownTicks';

// ─── Constants ─────────────────────────────────────────────────────────────

/** Location subtypes that participate in promotion/demotion (capital excluded) */
const PROMOTION_ELIGIBLE: Record<string, string> = {
  hamlet: 'town',
  town: 'city',
};

/** Location subtypes that participate in demotion */
const DEMOTION_ELIGIBLE: Record<string, string> = {
  city: 'town',
  town: 'hamlet',
};

/** All settlement subtypes (including capital, which is never changed) */
const SETTLEMENT_SUBTYPES = new Set(['hamlet', 'town', 'city', 'capital']);

// ─── The economy-driven tier (THR-1923) ─────────────────────────────────────

/**
 * Advance the sustain counters toward `targetTier`; return the one-step change once the
 * tier has disagreed with it for SETTLEMENT_PROMOTION_SUSTAIN_TICKS, else null. A target
 * equal to the tier resets both counters.
 */
function economyTierStep(
  loc: GraphNode,
  current: SettlementTier,
  target: SettlementTier,
): { to: SettlementTier; direction: 'promotion' | 'demotion'; cause: 'population' | 'seat_lost' } | null {
  const p = loc.properties;
  let up = typeof p[TIER_SUSTAIN_UP_PROP] === 'number' ? (p[TIER_SUSTAIN_UP_PROP] as number) : 0;
  let down = typeof p[TIER_SUSTAIN_DOWN_PROP] === 'number' ? (p[TIER_SUSTAIN_DOWN_PROP] as number) : 0;
  const cmp = tierRank(target) - tierRank(current);
  if (cmp > 0) { up += 1; down = 0; } else if (cmp < 0) { down += 1; up = 0; } else { up = 0; down = 0; }
  p[TIER_SUSTAIN_UP_PROP] = up;
  p[TIER_SUSTAIN_DOWN_PROP] = down;
  if (up < SETTLEMENT_PROMOTION_SUSTAIN_TICKS && down < SETTLEMENT_PROMOTION_SUSTAIN_TICKS) return null;
  p[TIER_SUSTAIN_UP_PROP] = 0;
  p[TIER_SUSTAIN_DOWN_PROP] = 0;
  const direction = up >= SETTLEMENT_PROMOTION_SUSTAIN_TICKS ? 'promotion' : 'demotion';
  // A capital stands on its realm's seat; a city on a seat that pulls.
  const lostPower = current === 'capital'
    ? p.economyRealmSeat !== true
    : p.economyPulls !== true && p.economyRealmSeat !== true;
  const cause = direction === 'demotion' && lostPower && (current === 'city' || current === 'capital')
    ? 'seat_lost' as const
    : 'population' as const;
  return { to: stepToward(current, target), direction, cause };
}

/**
 * Perform a tier change: mutate the subtype, refresh the encounter cache, trace it, write
 * the chronicle line and flag the genome for reassessment. Shared by both triggers.
 */
function applyTierChange(
  graph: WorldGraph,
  loc: GraphNode,
  from: string,
  to: string,
  direction: 'promotion' | 'demotion',
  cause: 'population' | 'seat_lost' | 'seat_gained' | 'prosperity',
  tick: number,
  seed: number,
  events: TickEvent[],
  chapters: ChronicleChapter[],
  runtime?: SimulationRuntime,
): void {
  loc.properties.locationSubtype = to;
  if (direction === 'promotion') liftStoredFortification(loc, to);
  loc.properties.prosperitySustainAboveTicks = 0;
  loc.properties.prosperitySustainBelowTicks = 0;
  if (runtime) {
    const locId = loc.id;
    applyEncounterCacheUpdate(runtime, cache => cache.onLocationTypeChanged(graph, locId));
  }
  const prosperity = typeof loc.properties?.prosperity === 'number' ? loc.properties.prosperity : 0;
  emitTrace({
    category: 'settlement_tier_change',
    tick,
    agentId: loc.id,
    summary: `${loc.name} ${direction === 'promotion' ? 'promoted' : 'demoted'} ${from}→${to} (${cause})`,
    locationId: loc.id,
    locationName: loc.name,
    previousSubtype: from,
    newSubtype: to,
    direction,
    sustainedTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS,
    prosperity,
    cause,
  });
  const entry = resolveEconomicChronicle(
    direction === 'promotion' ? 'settlement_promotion' : 'settlement_demotion',
    {
      settlement: loc.name,
      oldType: from,
      newType: to,
      locationId: loc.id,
      hexCoords: typeof loc.properties?.hexCol === 'number' && typeof loc.properties?.hexRow === 'number'
        ? { col: loc.properties.hexCol as number, row: loc.properties.hexRow as number }
        : undefined,
    },
    tick,
    chronicleSeed(seed, loc.id),
  );
  if (entry) {
    events.push(entry.tickEvent);
    chapters.push(entry.chronicleChapter);
  } else {
    events.push({
      id: `evt_tier_${loc.id}_${tick}`,
      tick,
      type: 'settlement_tier_change',
      message: direction === 'promotion'
        ? `The ${from} of ${loc.name} has grown into a proper ${to}.`
        : `${loc.name} has fallen on hard times — the ${from} shrinks to a ${to}.`,
      significance: 0.9,
    });
  }
  loc.properties.pendingReassessment = true;
  loc.properties.reassessmentTick = tick;
  loc.properties.reassessmentTrigger = direction;
}

// ─── Phase Function ─────────────────────────────────────────────────────────

/**
 * phaseSettlementPromotion — check each settlement for sustained prosperity
 * thresholds and promote or demote as needed.
 *
 * Called once per tick, AFTER phaseProsperity.
 * Mutates graph node properties in place.
 */
export function phaseSettlementPromotion(state: GameState, runtime?: SimulationRuntime): Partial<GameState> {
  const { graph, tick, seed } = state;
  const events: TickEvent[] = [];
  const chapters: ChronicleChapter[] = [];
  const locations = graph.getNodesByType('location');

  const economyDrives = SETTLEMENT_ECONOMY_ENABLED && SETTLEMENT_ECONOMY_DRIVES_TIER;

  for (const loc of locations) {
    const subtype = loc.properties?.locationSubtype as string | undefined;

    // THR-1923 — the settlement economy's target tier, when it has reached this settlement.
    if (economyDrives && subtype && SETTLEMENT_SUBTYPES.has(subtype)
      && loc.properties?.parentLocationId === undefined
      && typeof loc.properties?.targetTier === 'string' && SETTLEMENT_SUBTYPES.has(loc.properties.targetTier as string)) {
      const change = economyTierStep(loc, subtype as SettlementTier, loc.properties.targetTier as SettlementTier);
      if (change) {
        applyTierChange(graph, loc, subtype, change.to, change.direction, change.cause, tick, seed, events, chapters, runtime);
      }
      continue;
    }

    // Skip non-settlement or capital (capital never changes)
    if (!subtype || !SETTLEMENT_SUBTYPES.has(subtype) || subtype === 'capital') continue;

    const prosperity = typeof loc.properties?.prosperity === 'number'
      ? loc.properties.prosperity
      : 0;

    // Read sustain counters (default 0 if not yet initialized)
    let aboveTicks = typeof loc.properties?.prosperitySustainAboveTicks === 'number'
      ? loc.properties.prosperitySustainAboveTicks
      : 0;
    let belowTicks = typeof loc.properties?.prosperitySustainBelowTicks === 'number'
      ? loc.properties.prosperitySustainBelowTicks
      : 0;

    // THR-401: sickened wells or low population health suppress promotion
    // (the settlement cannot grow while it is sick). Cleared automatically
    // when the property's tick countdown expires or health recovers.
    const sickenedUntil = loc.properties?.wellsSickenedUntilTick;
    const isSickened = typeof sickenedUntil === 'number' && tick < sickenedUntil;
    const populationHealth = typeof loc.properties?.populationHealth === 'number'
      ? loc.properties.populationHealth
      : LOC_HEALTH_DEFAULT_BASELINE;
    const isUnhealthy = populationHealth < LOC_HEALTH_DAMPENER_THRESHOLD;

    // Update counters based on current prosperity
    if (prosperity >= SETTLEMENT_PROMOTION_PROSPERITY && !isSickened && !isUnhealthy) {
      aboveTicks += 1;
      belowTicks = 0;
    } else if (prosperity <= SETTLEMENT_DEMOTION_PROSPERITY) {
      belowTicks += 1;
      aboveTicks = 0;
    } else if (isSickened || isUnhealthy) {
      // Sick settlements cannot accumulate promotion sustain; reset to be safe.
      aboveTicks = 0;
    } else {
      // Mid-range: both counters stop accumulating but aren't reset to avoid
      // temporary blips breaking sustained thresholds — only reset on the other direction
      // (no change to counters when prosperity is in the middle band)
    }

    // Check promotion
    const promotionTarget = PROMOTION_ELIGIBLE[subtype];
    if (promotionTarget && aboveTicks >= SETTLEMENT_PROMOTION_SUSTAIN_TICKS) {
      loc.properties.locationSubtype = promotionTarget;
      liftStoredFortification(loc, promotionTarget);
      loc.properties.prosperitySustainAboveTicks = 0;
      loc.properties.prosperitySustainBelowTicks = 0;

      if (runtime) {
        const locId = loc.id;
        applyEncounterCacheUpdate(runtime, cache => cache.onLocationTypeChanged(graph, locId));
      }

      emitTrace({
        category: 'settlement_tier_change',
        tick,
        agentId: loc.id,
        summary: `${loc.name} promoted ${subtype}→${promotionTarget} after ${SETTLEMENT_PROMOTION_SUSTAIN_TICKS} ticks above prosperity ${SETTLEMENT_PROMOTION_PROSPERITY}`,
        locationId: loc.id,
        locationName: loc.name,
        previousSubtype: subtype,
        newSubtype: promotionTarget,
        direction: 'promotion',
        sustainedTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS,
        prosperity,
      });

      const promotionEntry = resolveEconomicChronicle(
        'settlement_promotion',
        {
          settlement: loc.name,
          oldType: subtype,
          newType: promotionTarget,
          locationId: loc.id,
          hexCoords: typeof loc.properties?.hexCol === 'number' && typeof loc.properties?.hexRow === 'number'
            ? { col: loc.properties.hexCol as number, row: loc.properties.hexRow as number }
            : undefined,
        },
        tick,
        chronicleSeed(seed, loc.id),
      );

      if (promotionEntry) {
        events.push(promotionEntry.tickEvent);
        chapters.push(promotionEntry.chronicleChapter);
      } else {
        // Fail-soft fallback if template resolution fails
        events.push({
          id: `evt_tier_${loc.id}_${tick}`,
          tick,
          type: 'settlement_tier_change',
          message: `The ${subtype} of ${loc.name} has grown into a proper ${promotionTarget}.`,
          significance: 0.9,
        });
      }
      loc.properties.pendingReassessment = true;
      loc.properties.reassessmentTick = tick;
      loc.properties.reassessmentTrigger = 'promotion';
      continue;
    }

    // Check demotion
    const demotionTarget = DEMOTION_ELIGIBLE[subtype];
    if (demotionTarget && belowTicks >= SETTLEMENT_PROMOTION_SUSTAIN_TICKS) {
      loc.properties.locationSubtype = demotionTarget;
      loc.properties.prosperitySustainAboveTicks = 0;
      loc.properties.prosperitySustainBelowTicks = 0;

      if (runtime) {
        const locId = loc.id;
        applyEncounterCacheUpdate(runtime, cache => cache.onLocationTypeChanged(graph, locId));
      }

      emitTrace({
        category: 'settlement_tier_change',
        tick,
        agentId: loc.id,
        summary: `${loc.name} demoted ${subtype}→${demotionTarget} after ${SETTLEMENT_PROMOTION_SUSTAIN_TICKS} ticks below prosperity ${SETTLEMENT_DEMOTION_PROSPERITY}`,
        locationId: loc.id,
        locationName: loc.name,
        previousSubtype: subtype,
        newSubtype: demotionTarget,
        direction: 'demotion',
        sustainedTicks: SETTLEMENT_PROMOTION_SUSTAIN_TICKS,
        prosperity,
      });

      const demotionEntry = resolveEconomicChronicle(
        'settlement_demotion',
        {
          settlement: loc.name,
          oldType: subtype,
          newType: demotionTarget,
          locationId: loc.id,
          hexCoords: typeof loc.properties?.hexCol === 'number' && typeof loc.properties?.hexRow === 'number'
            ? { col: loc.properties.hexCol as number, row: loc.properties.hexRow as number }
            : undefined,
        },
        tick,
        chronicleSeed(seed, loc.id),
      );

      if (demotionEntry) {
        events.push(demotionEntry.tickEvent);
        chapters.push(demotionEntry.chronicleChapter);
      } else {
        events.push({
          id: `evt_tier_${loc.id}_${tick}`,
          tick,
          type: 'settlement_tier_change',
          message: `${loc.name} has fallen on hard times — the ${subtype} shrinks to a ${demotionTarget}.`,
          significance: 0.9,
        });
      }
      loc.properties.pendingReassessment = true;
      loc.properties.reassessmentTick = tick;
      loc.properties.reassessmentTrigger = 'demotion';
      continue;
    }

    // Persist updated counters
    loc.properties.prosperitySustainAboveTicks = aboveTicks;
    loc.properties.prosperitySustainBelowTicks = belowTicks;
  }

  return {
    tickEvents: [...state.tickEvents, ...events],
    chronicleEntries: chapters.length > 0
      ? [...state.chronicleEntries, ...chapters.map(ch => ({
          id: ch.id,
          tier: 'chronicle' as const,
          title: ch.title,
          prose: ch.prose,
          promptContext: {
            actors: ch.actorIds,
            location: '',
            sphere: (ch.spheres[0] ?? 'gold') as import('../types/index').SphereName,
            mood: 'economic',
          },
          tick: ch.tick,
        }))]
      : state.chronicleEntries,
  };
}
