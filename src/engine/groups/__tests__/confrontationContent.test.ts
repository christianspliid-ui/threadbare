/**
 * The confrontation family and its two gates (THR-731 PR 3).
 *
 * PR 2 made a company that walks into a band fight it. This is what makes that
 * fight read as a confrontation rather than as whatever errand the company was on
 * — and it locks the three claims that separate authored conflict from content
 * that merely exists:
 *
 * 1. A confrontation is unreachable with nobody to confront (`requiresOpposingBand`).
 * 2. A seed that names its enemy still has that enemy when it spawns, or the
 *    encounter comes up uncontested rather than pointing at a corpse.
 * 3. The Standoff's non-lethal rung is structural, not a lucky roll.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { UnifiedAction, UnifiedActionTemplate } from '../../../types/unifiedAction';
import { hasOpposingBand, findColocatedOpposingBand, applyContestConsequences } from '../bandOpposition';
import { generateUnifiedCandidates } from '../../unifiedCandidates';
import { filterByPrerequisites } from '../../encounterFilterPipeline';
import { evaluateEncounterSeeds } from '../../encounterSeeding';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';

// ─── Fixture ────────────────────────────────────────────────────

/** The four templates this PR authors, by id. */
const CONFRONTATION_IDS = [
  'encounter.confront_ambush',
  'encounter.confront_den_assault',
  'encounter.confront_guild_falls',
  'encounter.confront_standoff',
] as const;

function makeState(graph: WorldGraph, tick = 40, overrides: Partial<GameState> = {}): GameState {
  return {
    graph, tick, seed: 42,
    tickEvents: [], recentEvents: [], unifiedActions: [], pendingEncounterSeeds: [],
    ...overrides,
  } as unknown as GameState;
}

function addLocation(graph: WorldGraph, id: string, col: number, row: number, subtype = 'town'): void {
  graph.addNode({
    id, type: 'location', name: id,
    properties: { locationType: 'settlement', locationSubtype: subtype, hexCol: col, hexRow: row },
  });
}

function addGroup(
  graph: WorldGraph,
  id: string,
  locationId: string,
  size: number,
  opts: { bandRole?: string; bandFactionId?: string; groupStatus?: string } = {},
): void {
  graph.addNode({
    id, type: 'actor', name: `Group ${id}`,
    properties: {
      actorType: 'group',
      groupType: opts.bandRole ? 'faction_band' : 'party',
      groupStatus: opts.groupStatus ?? 'active',
      cohesion: 0.6,
      ...(opts.bandRole ? { bandRole: opts.bandRole } : {}),
      ...(opts.bandFactionId ? { bandFactionId: opts.bandFactionId } : {}),
    },
  });
  for (let i = 0; i < size; i++) {
    const memberId = `${id}.m${i}`;
    graph.addNode({
      id: memberId, type: 'actor', name: `${id} member ${i}`,
      properties: { actorType: 'individual' },
    });
    graph.addEdge({
      id: `mem.${memberId}`, source: memberId, target: id, type: 'member_of',
      properties: { role: i === 0 ? 'leader' : 'member', rank: 0, joinedTick: 0 },
    });
    graph.addEdge({
      id: `at.${memberId}`, source: memberId, target: locationId,
      type: 'located_at', properties: {},
    });
  }
  graph.addEdge({
    id: `cmd.${id}`, source: id, target: `${id}.m0`, type: 'commanded_by', properties: {},
  });
  graph.updateNode(id, {
    properties: {
      ...graph.getNode(id)!.properties,
      roster: Array.from({ length: size }, (_, i) => `${id}.m${i}`),
    },
  });
}

/**
 * One company, and optionally a foreign band, on hex (3,3).
 *
 * `bandDead` marks every band member deceased rather than removing them — that is
 * how a wiped-out band actually looks in the graph (`applyCasualty` marks, it does
 * not delete), so it is what the liveness checks have to survive.
 */
function world(opts: { withBand?: boolean; bandStatus?: string; bandDead?: boolean } = {}): WorldGraph {
  const graph = new WorldGraph();
  addLocation(graph, 'loc.hall', 3, 3);
  addGroup(graph, 'co', 'loc.hall', 3);
  if (opts.withBand !== false) {
    addGroup(graph, 'band', 'loc.hall', 3, {
      bandRole: 'defender', bandFactionId: 'f.knives', groupStatus: opts.bandStatus,
    });
    if (opts.bandDead) {
      for (let i = 0; i < 3; i++) {
        const member = graph.getNode(`band.m${i}`)!;
        graph.updateNode(member.id, { properties: { ...member.properties, deceased: true } });
      }
    }
  }
  return graph;
}

function makeAction(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_1', actorId: 'co.m0', templateId: 'encounter.confront_standoff',
    targetId: 'loc.hall', scale: 'personal', source: 'agent', startTick: 30,
    currentStep: 0, stepProgress: 1, stepDuration: 1, resolved: false, stepOutcomes: [],
    ...overrides,
  } as UnifiedAction;
}

// ─── The authored family ────────────────────────────────────────

describe('confrontation family', () => {
  it('registers all four templates', () => {
    for (const id of CONFRONTATION_IDS) {
      expect(getUnifiedTemplateById(id), `${id} missing from the registry`).toBeDefined();
    }
  });

  it('is group-exclusive and band-gated on every member', () => {
    for (const id of CONFRONTATION_IDS) {
      const t = getUnifiedTemplateById(id)!;
      // `['group']` with no 'individual' — a lone agent never draws a confrontation.
      expect(t.actorAffinities, id).toEqual(['group']);
      expect(t.minGroupMembers, id).toBe(2);
      // The gate that makes the family *about* somebody.
      expect(t.requiresOpposingBand, id).toBe(true);
    }
  });

  it('rotates reaches across steps so a confrontation spotlights the whole company', () => {
    // Best-member substitution picks the member best suited to each step's Reach.
    // A template whose every step is `iron` puts the same companion in {actor}
    // three times, which is a fight scene with one person in it.
    for (const id of CONFRONTATION_IDS) {
      const steps = getUnifiedTemplateById(id)!.steps as ReadonlyArray<{ reach: string }>;
      expect(new Set(steps.map(s => s.reach)).size, `${id} repeats a reach`).toBe(steps.length);
    }
  });

  it('scope-protects exactly one non-lethal rung', () => {
    const nonLethal = CONFRONTATION_IDS.filter(id => getUnifiedTemplateById(id)!.contestNonLethal);
    expect(nonLethal).toEqual(['encounter.confront_standoff']);
  });
});

// ─── Gate 1: reachability requires an opponent ──────────────────

describe('hasOpposingBand', () => {
  it('is true for a company sharing a hex with a foreign band', () => {
    expect(hasOpposingBand(world(), 'co.m0')).toBe(true);
  });

  it('is false with no band present', () => {
    expect(hasOpposingBand(world({ withBand: false }), 'co.m0')).toBe(false);
  });

  it('is false for an ungrouped agent', () => {
    const graph = world();
    graph.addNode({ id: 'loner', type: 'actor', name: 'loner', properties: { actorType: 'individual' } });
    expect(hasOpposingBand(graph, 'loner')).toBe(false);
  });

  it('is false for a band — a band does not draw confrontations of its own', () => {
    expect(hasOpposingBand(world(), 'band.m0')).toBe(false);
  });

  it('answers no rather than throwing when the graph read fails (NFP #4)', () => {
    const broken = {
      getNode: () => { throw new Error('graph is gone'); },
      getOutgoingEdges: () => { throw new Error('graph is gone'); },
      getIncomingEdges: () => { throw new Error('graph is gone'); },
    } as unknown as WorldGraph;
    expect(hasOpposingBand(broken, 'co.m0')).toBe(false);
  });
});

describe('findColocatedOpposingBand', () => {
  it('skips a band that has emptied out', () => {
    const graph = world({ bandDead: true });
    expect(findColocatedOpposingBand(graph, 'co')).toBeUndefined();
  });

  it('skips a disbanded band', () => {
    const graph = world({ bandStatus: 'disbanded' });
    expect(findColocatedOpposingBand(graph, 'co')).toBeUndefined();
  });
});

describe('generateUnifiedCandidates — confrontation gate', () => {
  const confrontation = () => getUnifiedTemplateById('encounter.confront_standoff')!;

  it('offers a confrontation when a band is standing there', () => {
    const ids = generateUnifiedCandidates(world(), 'co.m0', 'loc.hall', [confrontation()])
      .map(c => c.templateId);
    expect(ids).toContain('encounter.confront_standoff');
  });

  it('withholds it when there is nobody to confront', () => {
    const ids = generateUnifiedCandidates(world({ withBand: false }), 'co.m0', 'loc.hall', [confrontation()])
      .map(c => c.templateId);
    expect(ids).toEqual([]);
  });

  it('leaves ungated group content alone', () => {
    // The gate must not become a general company filter: the delves THR-74 shipped
    // stay reachable on a hex with no band on it.
    const ungated = {
      ...confrontation(),
      id: 'encounter.test_ungated',
      requiresOpposingBand: undefined,
    } as UnifiedActionTemplate;
    const ids = generateUnifiedCandidates(world({ withBand: false }), 'co.m0', 'loc.hall', [ungated])
      .map(c => c.templateId);
    expect(ids).toEqual(['encounter.test_ungated']);
  });
});

// ─── Gate 1b: the same gate on the location-cache path ──────────

describe('filterByPrerequisites — actor eligibility', () => {
  const entry = (templateId: string) =>
    ({ templateId, locationId: 'loc.hall', encounterType: 'duel' } as never);

  it('withholds a confrontation from a company with no band present', () => {
    const graph = world({ withBand: false });
    const kept = filterByPrerequisites([entry('encounter.confront_standoff')], 'co.m0', graph);
    expect(kept).toEqual([]);
  });

  it('offers it once a band is standing there', () => {
    const kept = filterByPrerequisites([entry('encounter.confront_standoff')], 'co.m0', world());
    expect(kept).toHaveLength(1);
  });

  it('withholds group-exclusive content from a solo agent', () => {
    // The pre-existing hole this stage closes: `getEncountersByLocationType` hands
    // the cache every template matching the location, and until now no stage in
    // this pipeline read `actorAffinities` — so THR-74's party-exclusive delves
    // were reachable by agents with no company, contradicting their own authoring
    // contract. Locked here so it cannot silently reopen.
    const graph = world();
    graph.addNode({ id: 'loner', type: 'actor', name: 'loner', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'at.loner', source: 'loner', target: 'loc.hall', type: 'located_at', properties: {} });
    expect(filterByPrerequisites([entry('encounter.sunken_vault')], 'loner', graph)).toEqual([]);
  });

  it('still offers group-exclusive content to a company that can field it', () => {
    expect(filterByPrerequisites([entry('encounter.sunken_vault')], 'co.m0', world())).toHaveLength(1);
  });

  it('leaves ordinary individual content alone', () => {
    const graph = world();
    graph.addNode({ id: 'loner', type: 'actor', name: 'loner', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'at.loner', source: 'loner', target: 'loc.hall', type: 'located_at', properties: {} });
    expect(filterByPrerequisites([entry('encounter.barter_supplies')], 'loner', graph)).toHaveLength(1);
  });
});

// ─── Gate 2: the seeded opponent is re-validated at spawn ───────

describe('evaluateEncounterSeeds — opposingGroupId carry', () => {
  const seed = (overrides: Record<string, unknown> = {}) => ({
    seedId: 'seed.1',
    sourceEncounterId: 'encounter.confront_standoff',
    sourceReactionId: 'r1',
    templateId: 'encounter.confront_standoff',
    targetAgentId: 'co.m0',
    eligibleAfterTick: 10,
    priority: 1,
    seedLabel: 'unfinished business',
    plantedTick: 1,
    ...overrides,
  });

  function spawn(graph: WorldGraph, seedOverrides: Record<string, unknown> = {}): UnifiedAction | undefined {
    const state = makeState(graph, 40, { pendingEncounterSeeds: [seed(seedOverrides) as never] });
    const next = evaluateEncounterSeeds(state, 40, () => 0.5);
    return next.unifiedActions.find(a => a.templateId === 'encounter.confront_standoff');
  }

  it('carries a live named opponent onto the spawned action', () => {
    // The whole point of the seeded branch: the pairing is deliberate, not a
    // rediscovery of whoever happens to be standing nearby at resolution.
    expect(spawn(world(), { opposingGroupId: 'band' })?.opposingGroupId).toBe('band');
  });

  it('spawns uncontested when the named band dissolved in the meantime', () => {
    const action = spawn(world({ bandStatus: 'disbanded' }), { opposingGroupId: 'band' });
    expect(action).toBeDefined();
    expect(action?.opposingGroupId).toBeUndefined();
  });

  it('spawns uncontested when the named band emptied out', () => {
    const action = spawn(world({ bandDead: true }), { opposingGroupId: 'band' });
    expect(action?.opposingGroupId).toBeUndefined();
  });

  it('spawns uncontested when the named node is not a band at all', () => {
    // 'co' is an ordinary company — naming it must not manufacture a contest.
    expect(spawn(world(), { opposingGroupId: 'co' })?.opposingGroupId).toBeUndefined();
  });

  it('leaves ordinary seeds untouched', () => {
    expect(spawn(world())?.opposingGroupId).toBeUndefined();
  });
});

// ─── Gate 3: the non-lethal rung is structural ──────────────────

describe('applyContestConsequences — contestNonLethal', () => {
  const opposition = (templateId: string) => ({
    initiator: makeAction({ templateId }),
    counter: makeAction({ actionId: 'ua_2', actorId: 'band.m0', templateId: 'encounter.band_defend' }),
    initiatorGroupId: 'co',
    bandGroupId: 'band',
  });

  /** An rng that always rolls a casualty if one is allowed. */
  const alwaysCasualty = () => 0;

  it('never kills on a Standoff, however badly it goes', () => {
    const graph = world();
    const result = applyContestConsequences(
      makeState(graph), opposition('encounter.confront_standoff'), 'failure', 'success', alwaysCasualty,
    );
    expect(result?.loserGroupId).toBe('co');
    expect(result?.casualtyId).toBeUndefined();
    expect(graph.getNode('co.m1')?.properties.deceased).toBeUndefined();
  });

  it('still kills on a lethal confrontation with the same roll', () => {
    // Same fixture, same rng, different template — proving the Standoff's result
    // above is the flag and not a quirk of the fixture.
    const graph = world();
    const result = applyContestConsequences(
      makeState(graph), opposition('encounter.confront_ambush'), 'failure', 'success', alwaysCasualty,
    );
    expect(result?.casualtyId).toBeDefined();
  });

  it('treats an unknown template as lethal (fail-soft default)', () => {
    const graph = world();
    const result = applyContestConsequences(
      makeState(graph), opposition('encounter.does_not_exist'), 'failure', 'success', alwaysCasualty,
    );
    expect(result?.casualtyId).toBeDefined();
  });
});
