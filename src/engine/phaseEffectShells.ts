/**
 * Phase: Effect Shells
 *
 * Runs after phaseUnifiedActionProgress (Phase 2a) in the orchestrator.
 * Handles non-step-outcome flip_table triggers (attachment_gained, manual).
 *
 * Note: step_outcome triggers are wired directly inside executeStepResult
 * where the current step index and outcome are known precisely. This phase
 * handles the remaining trigger kinds only.
 *
 * Design doc: Docs/plans/2026-04-19-content-architecture-phase-2-stateful-shells.md
 * Linear: THR-53
 */

import type { GameState } from '../types/gameState';
import type { FlipTableConfig } from '../types/contentShells';
import { getUnifiedTemplateById } from '../data/unified-action-templates';

/**
 * Process non-step-outcome flip_table triggers for all active unified actions.
 *
 * For each active action whose template declares flipTables with attachment_gained
 * or manual triggers, apply the appropriate state transition.
 * (Step_outcome triggers are handled inside executeStepResult — THR-53.)
 */
export function phaseEffectShells(state: GameState): Partial<GameState> {
  if (!state.unifiedActions || state.unifiedActions.length === 0) return {};

  for (const action of state.unifiedActions) {
    if (action.resolved) continue;
    const template = getUnifiedTemplateById(action.templateId);
    if (!template?.flipTables || template.flipTables.length === 0) continue;

    for (const config of template.flipTables as FlipTableConfig[]) {
      // step_outcome triggers are handled inline in executeStepResult
      if (config.flipTrigger.kind === 'step_outcome') continue;
      // attachment_gained and manual triggers are not yet authored in the proof pack
      // but the structural hook is here for future content
    }
  }

  return {};
}
