/**
 * The Compulsion — per-agent decision urges. THR-886.
 *
 * This module owns the *read* and *expiry* halves of the card. The write half
 * lives in the aftermath applier (`encounterAftermath.ts`, `case 'plant_compulsion'`),
 * where every other card grant is applied, so a compulsion enters the world
 * through the same door as an omen or a hidden mark rather than through a second
 * one built for it.
 *
 * **Why this is not the omen path.** `deriveEmittedOmenEncounterBias` asks "which
 * omens stain the hex this agent is standing on?" — a question about a *place*.
 * A compulsion is addressed to a *person*: it travels with them, and two mortals
 * on the same hex can hold different urges or none. That is the difference the
 * card is about ("steer them, not the world"), so the two carriers stay separate
 * and this module keys on `targetAgentId` where that one keys on hex distance.
 *
 * **Why expiry rather than consume-on-use.** The card reads "shaping the mortal's
 * next decision", which invites burning the urge the moment it is felt. But
 * `phaseAgentDecision` is a scoring path — a read — and making it write state
 * would both add a mutation to a pure seam and burn the urge on selections the
 * strategic-candidate override can still overturn further down the same phase.
 * A short `expiresTick` says "next decision" without either hazard, and matches
 * how emitted omens already age out.
 *
 * Ticket: THR-886. Decided by Christian in chat 2026-08-09 (Option 1 — "a whisper
 * that tilts them"; options 2 and 3 rejected, not deferred).
 */

import type { GameState } from '../types/gameState';
import type { PlantedCompulsion } from '../types/unifiedAction';
import { COMPULSION_BIAS_CAP, COMPULSION_BIAS_WEIGHT } from '../data/game-config';
import { emitTrace } from './traceBuffer';
import type { CompulsionDecayedTrace } from '../types/trace';

/**
 * Emit a compulsion trace.
 *
 * The cast is load-bearing, not laziness — the same one `nudgeDispatch`'s
 * `emitNudgeTrace` documents. `emitTrace` takes `Omit<TraceEntry, 'id' | 'timestamp'>`,
 * and `Omit` over a **discriminated union** distributes into a single object type
 * carrying only the keys every member shares, so every category-specific field
 * becomes an excess property and is rejected however correctly the trace interface
 * is declared. Typing the parameter as the real trace interface here keeps the
 * payload checked at the call site; the cast only crosses the collapsed boundary.
 */
function emitCompulsionTrace(entry: Omit<CompulsionDecayedTrace, 'id' | 'timestamp'>): void {
  emitTrace(entry as Parameters<typeof emitTrace>[0]);
}

/**
 * Encounter-type bias contributed by every live compulsion planted on one agent.
 *
 * Pure. Returns `{}` for an agent carrying nothing, which is the overwhelmingly
 * common case and costs one length check.
 *
 * Fail-soft (NFP #4): a non-finite authored weight is skipped rather than
 * poisoning the whole bias map with `NaN` — one bad content row must not make an
 * agent undecidable.
 */
export function derivePlantedCompulsionEncounterBias(
  plantedCompulsions: readonly PlantedCompulsion[] | undefined,
  agentId: string,
  tick: number,
): Partial<Record<string, number>> {
  if (!plantedCompulsions || plantedCompulsions.length === 0) return {};

  const bias: Record<string, number> = {};

  for (const compulsion of plantedCompulsions) {
    if (compulsion.targetAgentId !== agentId) continue;
    // Expired but not yet swept — the decay phase runs earlier in the tick, but a
    // caller reading mid-tick must not feel an urge that has already lapsed.
    if (tick > compulsion.expiresTick) continue;

    for (const [encounterType, weight] of Object.entries(compulsion.encounterBias)) {
      if (typeof weight !== 'number' || !Number.isFinite(weight)) continue;
      bias[encounterType] = (bias[encounterType] ?? 0) + weight * COMPULSION_BIAS_WEIGHT;
    }
  }

  // Clamp per type so stacked cards accumulate without swamping the identity and
  // omen terms this is summed with.
  for (const encounterType of Object.keys(bias)) {
    bias[encounterType] = Math.max(
      -COMPULSION_BIAS_CAP,
      Math.min(COMPULSION_BIAS_CAP, bias[encounterType]),
    );
  }

  return bias;
}

/**
 * Drop lapsed compulsions from GameState.
 *
 * Mirrors `phaseEmittedOmenDecay` deliberately, including the "return `{}` when
 * nothing changed" contract that lets the orchestrator skip a state copy.
 * O(n) with n ≤ COMPULSION_MAX_ACTIVE.
 */
export function phasePlantedCompulsionDecay(state: GameState): Partial<GameState> {
  const compulsions = state.plantedCompulsions;
  if (!compulsions || compulsions.length === 0) return {};

  const tick = state.tick;
  const remaining: PlantedCompulsion[] = [];

  for (const compulsion of compulsions) {
    if (tick > compulsion.expiresTick) {
      emitCompulsionTrace({
        tick,
        category: 'compulsion_decayed',
        agentId: compulsion.targetAgentId,
        compulsionId: compulsion.compulsionId,
        livedTicks: tick - compulsion.plantedTick,
        summary: `compulsion_decayed: ${compulsion.compulsionId} lapsed (lived ${tick - compulsion.plantedTick} ticks)`,
      });
    } else {
      remaining.push(compulsion);
    }
  }

  if (remaining.length === compulsions.length) return {};
  return { plantedCompulsions: remaining };
}
