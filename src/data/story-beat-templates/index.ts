import type { CompositionStoryBeatTemplate } from './chain-weakens';
import { CHAIN_WEAKENS_STORY_BEAT_MAP } from './chain-weakens';

/**
 * Global story-beat template registry.
 * Keyed by canonical id (e.g. 'story-beat.chain-weakens-rumor').
 * Readers: phaseComposition.ts, content audits, codex builds.
 */
export const STORY_BEAT_TEMPLATE_REGISTRY: ReadonlyMap<string, CompositionStoryBeatTemplate> =
  new Map<string, CompositionStoryBeatTemplate>([
    ...CHAIN_WEAKENS_STORY_BEAT_MAP,
  ]);

export function lookupStoryBeatTemplate(
  id: string
): CompositionStoryBeatTemplate | undefined {
  return STORY_BEAT_TEMPLATE_REGISTRY.get(id);
}

export type { CompositionStoryBeatTemplate };
