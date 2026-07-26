/**
 * Rekindle the Thread — the god's restore action.
 * THR-773 (WS0 engine substrate).
 *
 * The `quintessence_restore` effect primitive: raise a worn mortal back to
 * `REKINDLE_RESTORE_TO_RATIO`, clear the broken stamp, and leave a receipt so
 * the mortal knows *whose fire is in them now* — the Two-Way Thread made
 * concrete rather than asserted.
 *
 * ## Why this is not a graph-executor case
 *
 * Its siblings (fortify, attune, scry) need only `graph` + `ctx` and auto-route
 * through `graphOnlyOps`. This one must also append a `recent_event`, which
 * lives on `GameState`. So it rides the resolution-intercept path alongside
 * `plant_trap` and `reveal_secret` — the second of the two sanctioned wiring
 * paths for a custom ascendant graph op (THR-605).
 *
 * The rebuild road stays the *primary* recovery: this is the expensive,
 * unlock-gated exception, priced so it is never the routine answer.
 *
 * Plan: `Docs/plans/2026-07-26-nudge-model-ws0-engine-substrate.md`
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { SimulationRuntime } from './simulationRuntime';
import { touchWorld } from './simulationRuntime';
import { QUINTESSENCE_MAX_DEFAULT } from '../types/quintessence';
import { REKINDLE_RESTORE_TO_RATIO } from '../data/nudge-constants';
import { BROKEN_SINCE_PROPERTY } from './brokenState';
import { appendRecentEvent } from './encounterAftermath';

/** Property recording which ascendant last rekindled this mortal. */
export const REKINDLED_BY_PROPERTY = 'rekindledBy';
/** Property recording the tick of the last rekindle. */
export const REKINDLED_AT_PROPERTY = 'rekindledAtTick';

/** Significance of the rekindle receipt in the event feed. */
const REKINDLE_EVENT_SIGNIFICANCE = 0.8;

export interface RekindleResult {
  readonly applied: boolean;
  /** Quintessence before the restore, when it applied. */
  readonly before?: number;
  /** Quintessence after the restore, when it applied. */
  readonly after?: number;
  /** Why it did not apply, for the trace/debug surface. */
  readonly reason?: 'target_missing' | 'not_an_actor' | 'already_above_target';
}

/**
 * Apply `quintessence_restore` to a mortal.
 *
 * Raises quintessence to `REKINDLE_RESTORE_TO_RATIO × quintessenceMax`, clears
 * `brokenSince` so the broken predicate releases immediately (rather than
 * waiting for the next quintessence phase to reconcile), and appends the
 * receipt naming the ascendant.
 *
 * Fail-soft (NFP #4): a missing target, a non-actor target, or a mortal already
 * at or above the restore target is a no-op with a reason — never a throw, and
 * never a silent partial write.
 *
 * The graph is mutated in place, so `touchWorld()` is the only signal UI
 * selectors get that anything changed — hence the explicit call here, at the
 * mutation site, per the load-bearing versioning rule.
 */
export function applyQuintessenceRestore(
  state: GameState,
  ascendantId: string,
  targetId: string,
  tick: number,
  runtime?: SimulationRuntime,
): RekindleResult {
  const target = state.graph.getNode(targetId);
  if (!target) return { applied: false, reason: 'target_missing' };
  if (target.type !== 'actor') return { applied: false, reason: 'not_an_actor' };

  const max = (target.properties.quintessenceMax ?? QUINTESSENCE_MAX_DEFAULT) as number;
  const before = (target.properties.quintessence ?? max) as number;
  const restoreTo = REKINDLE_RESTORE_TO_RATIO * max;

  // Never a downgrade: rekindling someone already hale does nothing but waste
  // the essence, and the commit path should have dimmed the card long before.
  if (before >= restoreTo) return { applied: false, reason: 'already_above_target' };

  state.graph.updateNode(targetId, { properties: { quintessence: restoreTo } });

  // Clear the broken stamp directly rather than waiting a tick for
  // `reconcileBrokenState` — the restore is the player's action and its effect
  // should be true the moment it resolves.
  const fresh = state.graph.getNode(targetId);
  if (fresh && fresh.properties[BROKEN_SINCE_PROPERTY] !== undefined) {
    delete fresh.properties[BROKEN_SINCE_PROPERTY];
  }

  // The receipt. Durable provenance on the node (so any later system can ask
  // "who mended them?") plus the event-feed line the player and the mortal's
  // own story both read.
  if (fresh) {
    fresh.properties[REKINDLED_BY_PROPERTY] = ascendantId;
    fresh.properties[REKINDLED_AT_PROPERTY] = tick;
  }

  const targetName = (target.name ?? targetId) as string;
  const event: TickEvent = {
    id: `rekindle_${targetId}_t${tick}`,
    tick,
    type: 'ripple_consequence',
    message: `${targetName} draws breath again — something not their own burning steady behind the eyes.`,
    significance: REKINDLE_EVENT_SIGNIFICANCE,
    actorId: targetId,
  };
  state.recentEvents = appendRecentEvent(state.recentEvents, event);
  state.tickEvents = [...state.tickEvents, event];

  if (runtime) touchWorld(runtime);

  return { applied: true, before, after: restoreTo };
}
