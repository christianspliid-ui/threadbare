/**
 * THR-1448 — the held-town term on `computeTemperamentWeight`, and its passage
 * through `scoreUnifiedBoard` onto the entry the census reads.
 *
 * The term's three values are `heldTownAffinity`'s to prove (`holdStanding.test.ts`);
 * this file proves the *weight* is real and the *plumbing* carries it: a candidate
 * on the held town outscores an identical one elsewhere by exactly the constant, the
 * entry records the input, and a board with no standing is byte-for-byte the board
 * before this term existed.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { computeTemperamentWeight, scoreUnifiedBoard } from '../decisionBoard';
import { holdStanding } from '../holdStanding';
import { cellTemplateId } from '../../data/undertaking-cells';
import { getStrategicTemplate } from '../strategicActionCandidates';
import { HELD_TOWN_AFFINITY_WEIGHT, HELD_REALM_AFFINITY_SHARE } from '../../data/strategic-action-constants';
import type { RealmProjection } from '../realmProjection';
import type { StrategicControlState } from '../../types/strategicAction';
import type { ScoredStrategicCandidate } from '../strategicActionScoring';

const KEEPER = 'actor_keeper';
const REALM = 'faction_realm';
const HELD = 'loc_held';
const REALM_TOWN = 'loc_realm_town';
const ELSEWHERE = 'loc_elsewhere';

function buildWorld(): WorldGraph {
  const graph = new WorldGraph();
  // THR-1582: a capable keeper (raw 40 ≈ capability 0.69 in every reach), so the
  // forecast window does not refuse the cells and zero every score alike.
  graph.addNode({ id: KEEPER, name: 'Keeper', type: 'actor', properties: {
    actorType: 'individual', spotlightTier: 'spotlight',
    domainCapabilities: { iron: 40, gold: 40, shadow: 40, veil: 40, heart: 40, eye: 40, stone: 40, star: 40 },
  } });
  graph.addNode({ id: REALM, name: 'The Realm', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', factionDefId: 'realm.x' } });
  graph.addNode({ id: HELD, name: 'Held', type: 'location', properties: { locationSubtype: 'town', hexCol: 1, hexRow: 1, prosperity: 0.5 } });
  graph.addNode({ id: REALM_TOWN, name: 'Realm Town', type: 'location', properties: { locationSubtype: 'town', hexCol: 3, hexRow: 1, prosperity: 0.5 } });
  graph.addNode({ id: ELSEWHERE, name: 'Elsewhere', type: 'location', properties: { locationSubtype: 'town', hexCol: 9, hexRow: 9, prosperity: 0.5 } });
  graph.addEdge({ id: 'at', source: KEEPER, target: HELD, type: 'located_at', properties: {} });
  return graph;
}

const projection: RealmProjection = {
  realms: [{ id: REALM, name: 'The Realm', seatHex: undefined, seatLocationId: null, heldLocationIds: [REALM_TOWN], hexes: [{ col: 1, row: 1 }, { col: 3, row: 1 }] }],
  hexRealmId: new Map([['1,1', REALM], ['3,1', REALM]]),
  unclaimedHexes: 0,
};

const stance: StrategicControlState = {
  controlId: 'ctrl', actorId: KEEPER, templateId: cellTemplateId('control:claim', 'location'), ambitionId: 'a',
  targetNodeId: HELD, verb: 'control', behaviorFamily: 'merchant-expansion', establishedTick: 1,
  neglectTicks: 0, active: true, degradation: 0,
};

/** A real cell, aimed at a target — the shape the board actually scores. */
function useCell(targetNodeId: string, index: number): ScoredStrategicCandidate {
  const templateId = cellTemplateId('use', 'location');
  return {
    candidateId: `cand_${index}`,
    templateId,
    ambitionId: 'ambition_none',
    actorId: KEEPER,
    verb: getStrategicTemplate(templateId)!.verb,
    executionMode: 'instant',
    behaviorFamily: 'merchant-expansion',
    displayName: 'hold court',
    targetNodeId,
    objectTypeId: 'location',
    objectHandle: { kind: 'node', nodeId: targetNodeId },
    scoreComponents: { ambitionAlignment: 0, blockerRelief: 0, worldImpact: 0, catalystValue: 0, roleFit: 0, travelPenalty: 0, varietyPenalty: 0 },
    finalScore: 1,
    generationReason: 'ambition_progression',
  };
}

describe('computeTemperamentWeight — the fourth weight', () => {
  it('adds exactly HELD_TOWN_AFFINITY_WEIGHT × affinity, defaulting to nothing', () => {
    const base = computeTemperamentWeight(undefined, 'gold', false, 0);
    expect(computeTemperamentWeight(undefined, 'gold', false, 0, 0)).toBe(base);
    expect(computeTemperamentWeight(undefined, 'gold', false, 0, 1)).toBeCloseTo(base + HELD_TOWN_AFFINITY_WEIGHT, 10);
    expect(computeTemperamentWeight(undefined, 'gold', false, 0, HELD_REALM_AFFINITY_SHARE))
      .toBeCloseTo(base + HELD_TOWN_AFFINITY_WEIGHT * HELD_REALM_AFFINITY_SHARE, 10);
    // Clamped like every other input: a stray 2 is not a double weight.
    expect(computeTemperamentWeight(undefined, 'gold', false, 0, 2)).toBeCloseTo(base + HELD_TOWN_AFFINITY_WEIGHT, 10);
  });
});

describe('scoreUnifiedBoard — the term reaches the entry and discriminates by object', () => {
  it('a keeper’s board scores the held town over the same cell elsewhere, and records the input', () => {
    const graph = buildWorld();
    const standing = holdStanding(graph, [stance], projection, KEEPER);
    const board = scoreUnifiedBoard({
      graph, agentId: KEEPER, tick: 10, encounterCandidates: [],
      strategicCandidates: [useCell(HELD, 0), useCell(REALM_TOWN, 1), useCell(ELSEWHERE, 2)],
      holdStanding: standing,
    });

    const byTarget = new Map(board.entries.map(e => [e.candidateIndex, e]));
    const held = byTarget.get(0)!;
    const realmTown = byTarget.get(1)!;
    const elsewhere = byTarget.get(2)!;

    expect(held.heldTownAffinity).toBe(1);
    expect(realmTown.heldTownAffinity).toBe(HELD_REALM_AFFINITY_SHARE);
    expect(elsewhere.heldTownAffinity).toBe(0);
    // Same cell, same EVT, same desire — the temperament weight is the only mover.
    expect(held.evt).toBe(elsewhere.evt);
    expect(held.desireMultiplier).toBe(elsewhere.desireMultiplier);
    expect(held.temperamentWeight - elsewhere.temperamentWeight).toBeCloseTo(HELD_TOWN_AFFINITY_WEIGHT, 10);
    expect(held.score).toBeGreaterThan(realmTown.score);
    expect(realmTown.score).toBeGreaterThan(elsewhere.score);
    expect(board.winner?.candidateIndex).toBe(0);

    // The spread the Done-when asks the census to see: three distinct values on one board.
    const distinct = new Set(board.entries.map(e => e.heldTownAffinity));
    expect(distinct.size).toBe(3);
  });

  it('with no standing the board is the board before the term existed — every entry reads 0', () => {
    const graph = buildWorld();
    const without = scoreUnifiedBoard({
      graph, agentId: KEEPER, tick: 10, encounterCandidates: [],
      strategicCandidates: [useCell(HELD, 0), useCell(ELSEWHERE, 1)],
    });
    const withNull = scoreUnifiedBoard({
      graph, agentId: KEEPER, tick: 10, encounterCandidates: [],
      strategicCandidates: [useCell(HELD, 0), useCell(ELSEWHERE, 1)],
      holdStanding: null,
    });
    expect(without.entries.map(e => e.score)).toEqual(withNull.entries.map(e => e.score));
    expect(without.entries.every(e => e.heldTownAffinity === 0)).toBe(true);
    expect(without.entries[0].temperamentWeight).toBe(without.entries[1].temperamentWeight);
  });
});
