/**
 * Phase descriptor: clue_rumors (THR-1506).
 *
 * Order: after `secrets_favors`, before `clue_decay` — a rumour born this sweep
 * is aged by the same decay clock that will retire it, and the quest-hook
 * sweep that follows both reads it fresh.
 */
import type { EnginePhase } from '../phaseRegistry';
import { phaseClueRumors } from '../ruins/clueRumors';

export const clueRumorsPhase: EnginePhase = {
  id: 'clue_rumors',
  slot: 'post-economy',
  afterPhase: ['secrets_favors'],
  beforePhase: ['clue_decay'],
  run: (state) => phaseClueRumors(state),
};
