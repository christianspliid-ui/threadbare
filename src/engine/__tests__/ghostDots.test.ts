import { describe, it, expect } from 'vitest';
import { updateGhostDots, ghostDotOpacity, type GhostDotEntry } from '../ghostDots';

describe('ghostDots', () => {
  describe('updateGhostDots', () => {
    it('creates ghost dot when agent leaves visible hex', () => {
      const previousAgentLocations = new Map<string, { hexCol: number; hexRow: number; agentName?: string }>();
      previousAgentLocations.set('agent1', { hexCol: 5, hexRow: 3 });

      const currentVisibleAgentIds = new Set<string>(); // agent1 no longer visible
      const existingGhosts: GhostDotEntry[] = [];

      const result = updateGhostDots(existingGhosts, previousAgentLocations, currentVisibleAgentIds, 10);
      expect(result.length).toBe(1);
      expect(result[0].agentId).toBe('agent1');
      expect(result[0].hexCol).toBe(5);
      expect(result[0].hexRow).toBe(3);
      expect(result[0].createdTick).toBe(10);
    });

    it('removes ghost dots that have fully decayed', () => {
      const existingGhosts: GhostDotEntry[] = [
        { agentId: 'agent1', agentName: 'Alice', hexCol: 5, hexRow: 3, createdTick: 0 },
      ];
      const previousAgentLocations = new Map<string, { hexCol: number; hexRow: number; agentName?: string }>();
      const currentVisibleAgentIds = new Set<string>();

      const result = updateGhostDots(existingGhosts, previousAgentLocations, currentVisibleAgentIds, 50);
      expect(result.length).toBe(0); // Decayed past GHOST_DOT_DECAY_TICKS (28)
    });

    it('removes ghost dot when agent becomes visible again', () => {
      const existingGhosts: GhostDotEntry[] = [
        { agentId: 'agent1', agentName: 'Alice', hexCol: 5, hexRow: 3, createdTick: 5 },
      ];
      const previousAgentLocations = new Map<string, { hexCol: number; hexRow: number; agentName?: string }>();
      const currentVisibleAgentIds = new Set(['agent1']); // agent1 visible again

      const result = updateGhostDots(existingGhosts, previousAgentLocations, currentVisibleAgentIds, 10);
      expect(result.length).toBe(0);
    });
  });

  describe('ghostDotOpacity', () => {
    it('returns initial opacity at creation tick', () => {
      expect(ghostDotOpacity(10, 10)).toBeCloseTo(0.3, 2);
    });

    it('returns zero when fully decayed', () => {
      expect(ghostDotOpacity(0, 28)).toBe(0);
      expect(ghostDotOpacity(0, 50)).toBe(0);
    });

    it('decays linearly', () => {
      const mid = ghostDotOpacity(0, 14); // halfway through 28 ticks
      expect(mid).toBeCloseTo(0.15, 2);
    });
  });
});
