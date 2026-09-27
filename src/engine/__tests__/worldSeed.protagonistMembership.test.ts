/**
 * Protagonist starting memberships carry standing — THR-1620.
 *
 * `worldSeed.ts` mints each spotlight protagonist's starting Realm membership as
 * `edge_member_<id>`. It used to write `{ role, rank: 0.3, joinedTick }` and nothing
 * else, so `generateFactionQuestCandidates` skipped it (no `factionDefId`) and
 * `meetsFactionRankRequirement` read it as closed — the deciders were the only
 * members in the world with no working faction standing.
 *
 * On a **generated world**, never a fixture: the defect was a property of the real
 * mint, and a fixture would have to invent the very fields under test.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { initializeGameState, MAP_SIZE_PRESETS } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';
import { generateFactionQuestCandidates } from '../factionQuestGeneration';
import { getDerivedMembershipRank } from '../factionReputation';
import { SEEDED_PROTAGONIST_MEMBERSHIP_REPUTATION } from '../../data/strategic-action-constants';
import type { GameState } from '../../types/gameState';
import type { GraphEdge } from '../../types/graph';

function build(seed: number): GameState {
  const preset = MAP_SIZE_PRESETS['medium'];
  const archetype = generateArchetypes(4, seed)[0];
  return initializeGameState(
    archetype, 'Protagonists', createBalancedCosmology(), seed, preset.cols, preset.rows,
  ).state;
}

function protagonistMemberships(state: GameState): GraphEdge[] {
  return state.graph.getAllEdges()
    .filter(e => e.type === 'member_of' && e.id.startsWith('edge_member_'));
}

describe.each([42, 99])('protagonist starting memberships, seed %i (THR-1620)', (seed) => {
  let state: GameState;
  let edges: GraphEdge[];

  beforeAll(() => {
    state = build(seed);
    edges = protagonistMemberships(state);
  });

  it('every protagonist membership carries factionDefId and reputation', () => {
    // Non-vacuity: seeds 42 · 99 measured 11 · 14 of these on medium.
    expect(edges.length).toBeGreaterThan(0);
    for (const edge of edges) {
      const target = state.graph.getNode(edge.target);
      expect(edge.properties.factionDefId).toBe(target?.properties.factionDefId);
      expect(typeof edge.properties.factionDefId).toBe('string');
      expect(edge.properties.reputation).toBe(SEEDED_PROTAGONIST_MEMBERSHIP_REPUTATION);
    }
  });

  it('the written rank agrees with the derived rank', () => {
    for (const edge of edges) {
      expect(edge.properties.rank).toBe(getDerivedMembershipRank(edge, -1));
    }
  });

  it('the court offers at least one protagonist a quest at t0', () => {
    const offered = edges.some(edge => {
      const locationId = state.graph.getNode(edge.source)?.properties.locationId as string;
      return generateFactionQuestCandidates(state.graph, edge.source, locationId, 0).length > 0;
    });
    expect(offered).toBe(true);
  });
});

describe('determinism (THR-1620)', () => {
  it('same seed, same protagonist memberships', () => {
    const snap = (s: GameState) => protagonistMemberships(s)
      .map(e => [e.id, e.target, e.properties.reputation, e.properties.rank]);
    expect(snap(build(42))).toEqual(snap(build(42)));
  });
});
