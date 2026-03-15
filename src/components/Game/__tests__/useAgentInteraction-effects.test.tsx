// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Dispatch, SetStateAction } from 'react';
import { useAgentInteraction } from '../hooks/useAgentInteraction';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';
import { WorldGraph } from '../../../engine/graph';

// ─── Mock helpers ────────────────────────────────────────────

const createMockArchetype = (): AscendantArchetype => ({
  id: 'archetype_ascendant',
  name: 'The Weaver',
  sphereAlignment: {
    primary: 'mind',
    secondary: 'spirit',
  },
  description: 'A god of thought and consciousness',
});

const createMockGameState = (): GameState => {
  const graph = new WorldGraph();

  // Add ascendant node
  graph.addNode({
    id: 'asc',
    type: 'actor',
    name: 'The Weaver',
    properties: { actorType: 'ascendant' },
  });

  return {
    graph,
    ascendantId: 'asc',
    tick: 1,
    seed: 42,
    cycle: 1,
    cyclePhase: 'midseason',
    essencePool: { mind: 10, spirit: 5, time: 3, life: 2, matter: 1, force: 0, energy: 0, entropy: 0 },
    recentEvents: [],
    doomClock: { stage: 0, ticks: 0 },
    mandate: {
      templateId: 'mandate_test',
      sphereWeight: 0.5,
      actor_tier: 'tier_1',
      progress: 0.2,
    },
    familiarityMap: {},
    visibilityMap: { visibleHexes: new Set(), rememberedHexes: new Set(), staleSnapshots: new Map() },
    avatarPosition: null,
  };
};

// ─── Tests ────────────────────────────────────────────────────

describe('useAgentInteraction - Effects Integration', () => {
  let mockGameState: GameState;
  let setGameState: Dispatch<SetStateAction<GameState>>;
  let mockArchetype: AscendantArchetype;

  beforeEach(() => {
    mockGameState = createMockGameState();
    setGameState = vi.fn((cb) => {
      if (typeof cb === 'function') {
        mockGameState = cb(mockGameState);
      } else {
        mockGameState = cb;
      }
    });
    mockArchetype = createMockArchetype();

    // Clear all timers
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('playingCardId state', () => {
    it('exposes playingCardId from the hook', () => {
      const { result } = renderHook(() =>
        useAgentInteraction({
          gameState: mockGameState,
          setGameState,
          archetype: mockArchetype,
          onOpenScry: vi.fn(),
        })
      );

      expect(result.current).toHaveProperty('playingCardId');
    });

    it('initializes playingCardId as null', () => {
      const { result } = renderHook(() =>
        useAgentInteraction({
          gameState: mockGameState,
          setGameState,
          archetype: mockArchetype,
          onOpenScry: vi.fn(),
        })
      );

      expect(result.current.playingCardId).toBeNull();
    });

    it('playingCardId is of type object (null)', () => {
      const { result } = renderHook(() =>
        useAgentInteraction({
          gameState: mockGameState,
          setGameState,
          archetype: mockArchetype,
          onOpenScry: vi.fn(),
        })
      );

      // The type of playingCardId should be string | null, but initially it's null (object type)
      expect(typeof result.current.playingCardId === 'object' || typeof result.current.playingCardId === 'string').toBe(true);
    });
  });
});
