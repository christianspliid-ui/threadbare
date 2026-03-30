/**
 * Control Effect Spawning — create ControlEffect instances from successful
 * sustained unified actions.
 *
 * Two-object lifecycle bridge:
 *   Phase 1 (Establishment): UnifiedAction resolves successfully
 *   Phase 2 (Persistence): ControlEffect spawned here, ticked by phaseControlEffects
 *
 * NFP compliance:
 *   #1 Tunability: no magic numbers — all values come from ControlSpec
 *   #2 Inspectability: emits ControlEffectEstablishedTrace
 *   #3 Determinism: pure function, no PRNG
 *   #4 Fail-soft: returns null if template lacks controlSpec
 */

import type { UnifiedAction, UnifiedActionTemplate } from '../types/unifiedAction';
import type { ControlEffect, ControlSpec } from '../types/controlEffect';
import type { TickEvent } from '../types/gameState';
import { emitTrace } from './traceBuffer';
import { isHexTargetId, parseHexTargetId } from './hexActionBridge';

// ─── Counter ────────────────────────────────────────────────────────────────

let effectCounter = 0;

/** Reset counter for deterministic testing. */
export function resetEffectCounter(): void {
  effectCounter = 0;
}

// ─── Spawn ──────────────────────────────────────────────────────────────────

/**
 * Spawn a ControlEffect from a successfully resolved sustained action.
 *
 * Returns null if:
 * - template.durationMode is not 'sustained'
 * - template.controlSpec is missing
 * - target is not a hex (control effects require hex targets)
 *
 * The caller is responsible for pushing the result onto GameState.controlEffects[].
 */
export function spawnControlEffect(
  action: UnifiedAction,
  template: UnifiedActionTemplate,
  tick: number,
): { effect: ControlEffect; event: TickEvent } | null {
  // Guard: only sustained actions with a controlSpec spawn effects
  if (template.durationMode !== 'sustained' || !template.controlSpec) {
    return null;
  }

  // Guard: control effects require a hex target
  if (!action.targetId || !isHexTargetId(action.targetId)) {
    return null;
  }

  const coords = parseHexTargetId(action.targetId);
  if (!coords) return null;

  const spec: ControlSpec = template.controlSpec;
  const effectId = `ctrl_${++effectCounter}`;

  const effect: ControlEffect = {
    effectId,
    templateId: action.templateId,
    ownerId: action.actorId,
    targetHexCol: coords.col,
    targetHexRow: coords.row,

    // Establishment
    establishedTick: tick,
    ritualEssenceInvested: action.essencePaid ?? 0,

    // Sustain (copied from ControlSpec)
    perTickCost: spec.perTickCost,
    perTickIncome: spec.perTickIncome,
    sustainThreshold: spec.sustainThreshold,

    // Ongoing effects
    perTickMutations: spec.perTickMutations ?? [],
    perTickGraphOps: spec.perTickGraphOps ?? [],

    // State — starts active
    active: true,
    ticksActive: 0,

    // Contestation
    contestPrerequisites: spec.contestPrerequisites,

    // Narrative
    narrativeTemplates: spec.narrativeTemplates,
  };

  // Emit trace
  emitTrace({
    id: 0,
    category: 'control_effect',
    tick,
    timestamp: tick,
    summary: `${template.name} established on hex (${coords.col},${coords.row})`,
    type: 'control_effect_established',
    effectId,
    templateId: action.templateId,
    ownerId: action.actorId,
    targetHex: { col: coords.col, row: coords.row },
    ritualEssenceInvested: action.essencePaid ?? 0,
  } as any);

  // Tick event
  const event: TickEvent = {
    id: `ctrl_established_${effectId}`,
    tick,
    type: 'control_effect_established',
    message: `${template.name} established — sustained divine presence on hex (${coords.col},${coords.row}).`,
    significance: 0.7,
  };

  return { effect, event };
}
