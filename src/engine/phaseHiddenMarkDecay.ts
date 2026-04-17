/**
 * Phase 7.3: Hidden Mark Decay
 *
 * After the grace period, marks lose severity each tick via exponential decay.
 * When severity falls below the floor, the mark is dropped with an observable
 * hidden_mark_revealed trace (revealedBy: 'decay:severity_floor') and a
 * low-significance chronicle event (THR-132) so the fade is not invisible
 * to the player.
 *
 * This phase runs after phaseDivineInfluenceDecay (6.6).
 * Deterministic arithmetic; the THR-132 template pick uses a local seed mix
 * derived from (state.seed, tick, markId) and does not touch any PRNG stream.
 */

import type { GameState, TickEvent } from '../types/gameState';
import { MAX_RECENT_EVENTS } from '../types/gameState';
import type { HiddenMark } from '../types/unifiedAction';
import { emitTrace } from './traceBuffer';
import {
  MARK_DECAY_GRACE_TICKS,
  MARK_DECAY_PER_TICK,
  MARK_DECAY_FLOOR,
  DECAY_EVENT_SIGNIFICANCE,
} from './hiddenMarks';
import { generateMarkRevealMessage } from './hiddenMarkProse';

export function phaseHiddenMarkDecay(state: GameState): Partial<GameState> {
  const marks = state.hiddenMarks;
  if (!marks || marks.length === 0) return {};

  const tick = state.tick;
  const nextMarks: HiddenMark[] = [];
  const decayEvents: TickEvent[] = [];
  let changed = false;

  for (const mark of marks) {
    const age = tick - mark.placedTick;

    if (age < MARK_DECAY_GRACE_TICKS) {
      nextMarks.push(mark);
      continue;
    }

    const decayedSeverity = mark.severity * (1 - MARK_DECAY_PER_TICK);

    if (decayedSeverity < MARK_DECAY_FLOOR) {
      // Drop mark — emit observable trace so decay is never silent
      changed = true;
      emitTrace({
        tick,
        category: 'hidden_mark_revealed',
        agentId: mark.targetAgentId,
        markId: mark.markId,
        actorId: mark.targetAgentId,
        revealedBy: 'decay:severity_floor',
        ticksSincePlacement: age,
        summary: `Hidden mark decayed: "${mark.label}" on ${mark.targetAgentId} (severity ${mark.severity.toFixed(3)} → below floor)`,
      });

      // Chronicle event — low significance so it logs to NarrativeLog without toasting (THR-132)
      decayEvents.push({
        id: `mark_decay_${mark.markId}_${tick}`,
        tick,
        type: 'ripple_consequence',
        message: generateMarkRevealMessage(state, mark, 'decay:severity_floor', tick),
        significance: DECAY_EVENT_SIGNIFICANCE,
        actorId: mark.targetAgentId,
      });
      // Mark is not pushed — dropped from state
    } else {
      // Severity decreased but above floor — keep with updated severity
      nextMarks.push({ ...mark, severity: decayedSeverity });
      changed = true;
    }
  }

  if (!changed) return {};
  if (decayEvents.length === 0) return { hiddenMarks: nextMarks };
  return {
    hiddenMarks: nextMarks,
    tickEvents: [...state.tickEvents, ...decayEvents],
    recentEvents: [...state.recentEvents, ...decayEvents].slice(-MAX_RECENT_EVENTS),
  };
}
