import type { GameState } from '../types/gameState';
import { emitTrace } from './traceBuffer';

/**
 * Walk the active doom identity matrix milestones and flip `triggered = true`
 * the first tick `progress` crosses a `progressThreshold`.
 *
 * Emits one `doom_milestone` trace per first crossing.
 * Fail-soft: trace emission failures are swallowed; the triggered flag persists.
 *
 * @param state  Current game state (mutates identityMilestones in place).
 * @param progress  Post-advance doom clock progress (0–1) from this tick.
 */
export function evaluateIdentityMilestones(state: GameState, progress: number): void {
  if (!state.doomIdentityMatrix) return;
  const milestones = state.doomIdentityMatrix.identityMilestones;
  if (!milestones?.length) return;

  for (const milestone of milestones) {
    if (milestone.triggered) continue;
    if (progress < milestone.progressThreshold) continue;
    milestone.triggered = true;
    try {
      emitTrace({
        category: 'doom_milestone',
        tick: state.tick,
        summary: `Doom milestone "${milestone.label}" triggered at ${(progress * 100).toFixed(1)}% progress`,
        archetype: state.doomIdentityMatrix.archetype,
        label: milestone.label,
        threshold: milestone.progressThreshold,
        progress,
      });
    } catch {
      // emitTrace failure is non-fatal — triggered flag already set
    }
  }
}
