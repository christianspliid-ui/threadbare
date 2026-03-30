/**
 * Phase Mandate — evaluate mandate progress and push sphere pressure on milestones/completion.
 *
 * Algorithm:
 *   1. Early-out if no active mandate or already completed/failed.
 *   2. Evaluate mandate conditions against current graph state.
 *   3. If progress >= 1.0, attempt to advance the mandate stage.
 *   4. On stage advance (milestone) or completion:
 *      - Push SpherePressureEvent on the ascendant node.
 *      - Magnitude: MANDATE_PRESSURE_MILESTONE on stage advance, MANDATE_PRESSURE_COMPLETION on completion.
 *      - Sphere: mandateDefinition.targetSphere if defined; else skip (fail-soft: no sphere = no pressure).
 *   5. On completion, emit a mandate_progress TickEvent.
 *   6. Return updated { mandateState, tickEvents, pendingSpherePressures }.
 *
 * NFP compliance:
 *   #1 Tunability: MANDATE_PRESSURE_MILESTONE, MANDATE_PRESSURE_COMPLETION from sphereAffinity.ts
 *   #2 Inspectability: mandate_progress TickEvent; pressure events traced by phaseSpherePressure
 *   #3 Determinism: arithmetic only, no PRNG
 *   #4 Fail-soft: no targetSphere → no pressure pushed; no mandate → empty return
 */

import type { GameState, TickEvent } from '../types/gameState';
import type { MandateState } from '../types/mandate';
import type { SpherePressureEvent } from '../types/sphereAffinity';
import { MANDATE_PRESSURE_MILESTONE, MANDATE_PRESSURE_COMPLETION } from '../types/sphereAffinity';
import { evaluateMandate, advanceMandateStage } from './mandate';

// ─── Helpers ──────────────────────────────────────────────────────

let eventCounter = 0;
/** Reset per-tick mandate event counter. Called by orchestrator.resetEventCounters() at tick start. */
export function resetMandateCounter(): void {
  eventCounter = 0;
}
function nextEventId(tick: number): string {
  return `mandate_evt_${tick}_${eventCounter++}`;
}

// ─── Phase function ───────────────────────────────────────────────

export function phaseMandate(state: GameState): Partial<GameState> {
  if (
    !state.mandateState ||
    !state.mandateDefinition ||
    state.mandateState.completed ||
    state.mandateState.failed
  ) {
    return {};
  }

  const evaluated: MandateState = evaluateMandate(
    state.graph,
    state.mandateDefinition as any,
    state.mandateState,
    state.ascendantId,
    state.tick,
  );

  const wasStageAdvanced = evaluated.progress >= 1.0 && !state.mandateState.completed;
  const advanced: MandateState = wasStageAdvanced
    ? advanceMandateStage(evaluated, state.tick)
    : evaluated;

  const events: TickEvent[] = [];
  const pressures: SpherePressureEvent[] = [...(state.pendingSpherePressures ?? [])];

  // Determine sphere for pressure: use mandateDefinition.targetSphere if defined.
  // Fail-soft: if no sphere defined, skip pressure (e.g., narrative/graph_state mandates).
  const mandateSphere = state.mandateDefinition.targetSphere;

  if (wasStageAdvanced && mandateSphere) {
    if (advanced.completed) {
      // Mandate completion — full pressure burst
      pressures.push({
        targetEntityId: state.ascendantId,
        sphere: mandateSphere,
        magnitude: MANDATE_PRESSURE_COMPLETION,
        source: 'mandate',
        sourceId: state.mandateDefinition.id,
      });
    } else {
      // Stage milestone advance (not yet complete)
      pressures.push({
        targetEntityId: state.ascendantId,
        sphere: mandateSphere,
        magnitude: MANDATE_PRESSURE_MILESTONE,
        source: 'mandate',
        sourceId: state.mandateDefinition.id,
      });
    }
  }

  // Emit visible narrative event only when mandate is fully fulfilled
  if (advanced.completed && !state.mandateState.completed) {
    events.push({
      id: nextEventId(state.tick),
      tick: state.tick,
      type: 'mandate_progress',
      message: `Victory! Mandate "${state.mandateDefinition.name}" fulfilled!`,
      significance: 1.0,
      notification: {
        channel: 'alert',
        icon: 'mandate',
      },
    });
  }

  return {
    mandateState: advanced,
    tickEvents: [...state.tickEvents, ...events],
    pendingSpherePressures: pressures,
  };
}
