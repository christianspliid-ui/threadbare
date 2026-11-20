/**
 * THR-2255 — the line a doom-feeding complication shows, once its effects have run.
 *
 * - `held` (the god tends the place): one of the template's `heldProse`, picked by tick
 *   (no rng draw, so the complication stream is unchanged), replaces the fed line.
 * - `fed` while the god holds Rebuke: the fed line gains "Rebuke it at {place} and the
 *   doom finds nothing there."
 * - anything else: the complication's own prose, unchanged.
 *
 * Pure. Fail-soft: a template with no `heldProse` keeps its own line.
 */
import type { ComplicationResult } from '../types/complication';
import type { GameState } from '../types/gameState';
import type { ComplicationEffectsOutcome } from './complicationEffects';
import { DOOM_FEED_REBUKE_SENTENCE, fillDoomFeedLine } from '../data/doom-feed-content';
import { RIVAL_REBUKE_TEMPLATE_ID } from '../data/rival-rebuke-content';

export function doomFeedProse(
  complication: Pick<ComplicationResult, 'prose' | 'heldProse'>,
  outcome: ComplicationEffectsOutcome,
  state: Pick<GameState, 'unlockedActionIds'>,
  tick: number,
  actorName: string | undefined,
): string {
  const feed = outcome.doomFeed;
  if (!feed) return complication.prose;
  if (feed.kind === 'held') {
    const lines = complication.heldProse ?? [];
    if (lines.length === 0) return complication.prose;
    const line = lines[Math.abs(Math.floor(tick)) % lines.length];
    return fillDoomFeedLine(line, feed.placeName, actorName);
  }
  if ((state.unlockedActionIds ?? []).includes(RIVAL_REBUKE_TEMPLATE_ID)) {
    return `${complication.prose} ${fillDoomFeedLine(DOOM_FEED_REBUKE_SENTENCE, feed.placeName)}`;
  }
  return complication.prose;
}
