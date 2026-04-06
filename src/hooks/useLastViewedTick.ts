import { useCallback, useRef } from 'react';

/**
 * Tracks the game tick at which each agent was last viewed by the player.
 * Used to determine "new" indicators on digest entries and capability changes.
 * UI-only state — not persisted in GameState.
 */
export function useLastViewedTick() {
  const lastViewed = useRef<Map<string, number>>(new Map());

  const markViewed = useCallback((agentId: string, currentTick: number) => {
    lastViewed.current.set(agentId, currentTick);
  }, []);

  const getLastViewedTick = useCallback((agentId: string): number => {
    return lastViewed.current.get(agentId) ?? 0;
  }, []);

  const hasNewEntries = useCallback((agentId: string, latestEntryTick: number): boolean => {
    const last = lastViewed.current.get(agentId) ?? 0;
    return latestEntryTick > last;
  }, []);

  return { markViewed, getLastViewedTick, hasNewEntries };
}
