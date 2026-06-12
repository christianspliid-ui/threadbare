/**
 * useThreadStorySoFar — compose and cache a story-so-far narrative for an agent.
 *
 * Uses SimulationRuntime.threadStoryCache (keyed by agentId|worldVersion)
 * with LRU eviction at STORY_DIGEST_CACHE_SIZE.
 */

import { useMemo } from 'react';
import type { WorldGraph } from '../../../engine/graph';
import type { DigestEntry } from '../../../types/attention';
import type { SimulationRuntime } from '../../../engine/simulationRuntime';
import type { ThreadStoryComposition } from '../../../engine/threadDigest';
import { composeThreadStory } from '../../../engine/threadDigest';
import { STORY_DIGEST_CACHE_SIZE } from '../../../data/attention-constants';

export function useThreadStorySoFar(
  graph: WorldGraph | undefined | null,
  agentId: string,
  currentTick: number,
  digestBuffer: DigestEntry[] | undefined | null,
  runtime?: SimulationRuntime | null,
): ThreadStoryComposition | null {
  const worldVersion = runtime?.worldVersion ?? 0;

  return useMemo(() => {
    if (!graph || !digestBuffer) return null;

    const cacheKey = `${agentId}|${worldVersion}`;

    if (runtime?.threadStoryCache) {
      const cached = runtime.threadStoryCache.get(cacheKey);
      if (cached) return cached;
    }

    const composition = composeThreadStory(graph, agentId, digestBuffer, currentTick);

    if (runtime?.threadStoryCache) {
      // LRU eviction: if at capacity, remove the oldest entry (Map preserves insertion order)
      if (runtime.threadStoryCache.size >= STORY_DIGEST_CACHE_SIZE) {
        const oldestKey = runtime.threadStoryCache.keys().next().value;
        if (oldestKey !== undefined) {
          runtime.threadStoryCache.delete(oldestKey);
        }
      }
      runtime.threadStoryCache.set(cacheKey, composition);
    }

    return composition;
  }, [graph, agentId, worldVersion, currentTick, digestBuffer, runtime]);
}
