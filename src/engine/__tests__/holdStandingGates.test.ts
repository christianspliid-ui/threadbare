/**
 * THR-1448 — the two doors the town-keeper content passes through, falsified.
 *
 * **Supply** (`generateFactionQuestCandidates`): a member is offered a Realm's content
 * through the rank's `encounterAccess` allowlist, which is `[]` at *stranger*. The
 * `requiresHold` arm offers a keeper the town-keeper templates past that allowlist.
 * The decayed-*stranger* arm is the one the plan's story dead-ends on without it: a
 * keeper whose seeded reputation has faded is still supplied their own content, and
 * the court's general rows stop.
 *
 * **Gate** (`filterByPrerequisites`): `requiresHold` hides the template from a
 * non-keeper and from a keeper of the wrong Realm, and fails *open* — no reader, an
 * unresolvable template, a location the map cannot place — because a gate that can
 * only hide content must never empty a pool on a lookup miss.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WorldGraph } from '../graph';
import { createHoldReader } from '../holdStanding';
import { generateFactionQuestCandidates, getHoldTemplates } from '../factionQuestGeneration';
import { filterByPrerequisites } from '../encounterFilterPipeline';
import { buildRealmDefinition } from '../../data/realm-content';
import {
  registerDynamicFactionDefinition,
  unregisterDynamicFactionDefinition,
  getFactionDefinition,
} from '../../data/faction-definition-lookup';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import type { RealmProjection } from '../realmProjection';
import type { StrategicControlState } from '../../types/strategicAction';
import type { EncounterCacheEntry } from '../encounterCache';
import type { ReachDomain } from '../../types/traits';

const KEEPER = 'actor_keeper';
const STRANGER = 'actor_stranger';
const REALM_A = 'faction_realm_a';
const REALM_B = 'faction_realm_b';
const DEF_A = 'realm.aldmark';
const DEF_B = 'realm.brenn';
const TOWN_A = 'loc_a';   // Realm A's ground — the keeper's town
const TOWN_B = 'loc_b';   // Realm B's ground
const NOWHERE = 'loc_nohex';

const PETITION = 'encounter.realm.keepers_petition';
const RECKONING = 'encounter.realm.crowns_reckoning';
const COURT = ['encounter.realm.court_summons', 'encounter.realm.border_levy', 'encounter.realm.tithe_demanded'];

function buildWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: KEEPER, name: 'Keeper', type: 'actor', properties: { actorType: 'individual' } });
  graph.addNode({ id: STRANGER, name: 'Stranger', type: 'actor', properties: { actorType: 'individual' } });
  graph.addNode({ id: REALM_A, name: 'Aldmark', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', factionDefId: DEF_A } });
  graph.addNode({ id: REALM_B, name: 'Brenn', type: 'actor', properties: { actorType: 'faction', factionClass: 'realm', factionDefId: DEF_B } });
  graph.addNode({ id: TOWN_A, name: 'Aldford', type: 'location', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 2 } });
  graph.addNode({ id: TOWN_B, name: 'Brennhaven', type: 'location', properties: { locationSubtype: 'town', hexCol: 9, hexRow: 9 } });
  graph.addNode({ id: NOWHERE, name: 'Unplaced', type: 'location', properties: { locationSubtype: 'town' } });
  for (const id of [KEEPER, STRANGER]) {
    graph.addEdge({ id: `at_${id}`, source: id, target: TOWN_A, type: 'located_at', properties: {} });
  }
  return graph;
}

function projection(): RealmProjection {
  return {
    realms: [
      { id: REALM_A, name: 'Aldmark', seatHex: undefined, seatLocationId: null, heldLocationIds: [], hexes: [{ col: 2, row: 2 }] },
      { id: REALM_B, name: 'Brenn', seatHex: undefined, seatLocationId: null, heldLocationIds: [], hexes: [{ col: 9, row: 9 }] },
    ],
    hexRealmId: new Map([['2,2', REALM_A], ['9,9', REALM_B]]),
    unclaimedHexes: 0,
  };
}

function stanceOn(actorId: string, targetNodeId: string): StrategicControlState {
  return {
    controlId: `ctrl_${actorId}`, actorId, templateId: 'cell.control_claim.location', ambitionId: 'a',
    targetNodeId, verb: 'control', behaviorFamily: 'merchant-expansion', establishedTick: 1,
    neglectTicks: 0, active: true, degradation: 0,
  };
}

function member(graph: WorldGraph, agentId: string, realmId: string, defId: string, reputation: number): void {
  graph.addEdge({
    id: `member_${agentId}_${realmId}`, source: agentId, target: realmId, type: 'member_of',
    properties: { role: 'stranger', rank: 0, joinedTick: 0, reputation, factionDefId: defId },
  });
}

function entry(templateId: string, locationId: string): EncounterCacheEntry {
  return {
    templateId, locationId, sublocationId: null, sublocationTypeId: null,
    reachPrimary: 'heart' as ReachDomain, reachSecondary: 'gold' as ReachDomain,
    threatRating: 'trivial', encounterType: 'explore', motivations: [], requiresPresence: false,
    remotePenalty: 0, questPriority: 3, isQuestEncounter: false, totalTickCost: 2,
    successRewardEstimate: 0.04, stepCount: 2, stepDifficulties: [0.35, 0.4],
    stepReaches: ['heart' as ReachDomain, 'gold' as ReachDomain],
  };
}

beforeAll(() => {
  registerDynamicFactionDefinition(buildRealmDefinition({ cultureId: 'aldmark', name: 'Aldmark' }));
  registerDynamicFactionDefinition(buildRealmDefinition({ cultureId: 'brenn', name: 'Brenn' }));
});
afterAll(() => {
  unregisterDynamicFactionDefinition(DEF_A);
  unregisterDynamicFactionDefinition(DEF_B);
});

describe('the templates carry the field the doors read', () => {
  it('both town-keeper templates declare requiresHold and resolve through the unified lookup', () => {
    for (const id of [PETITION, RECKONING]) {
      const t = getUnifiedTemplateById(id);
      expect(t, id).toBeDefined();
      expect(t!.requiresHold).toEqual({ ofRealm: true });
      expect(t!.tags).toContain('#town_keeper');
    }
    for (const id of COURT) expect(getUnifiedTemplateById(id)!.requiresHold).toBeUndefined();
  });

  it('getHoldTemplates lists exactly the requiresHold templates of the Realm class', () => {
    const ids = getHoldTemplates(getFactionDefinition(DEF_A)!).map(t => t.id).sort();
    expect(ids).toEqual([RECKONING, PETITION].sort());
  });
});

describe('supply — the requiresHold arm past encounterAccess', () => {
  it('a keeper at *stranger* is supplied the town-keeper rows and none of the court’s (the decayed arm)', () => {
    const graph = buildWorld();
    member(graph, KEEPER, REALM_A, DEF_A, 0.05); // below subject (0.15): encounterAccess is []
    const reader = createHoldReader(graph, [stanceOn(KEEPER, TOWN_A)], projection());

    const ids = generateFactionQuestCandidates(graph, KEEPER, TOWN_A, 10, reader).map(c => c.templateId);

    expect(ids).toContain(PETITION);
    expect(ids).toContain(RECKONING);
    for (const court of COURT) expect(ids).not.toContain(court);
  });

  it('a non-keeper member at *stranger* is supplied neither — the pre-fix arm', () => {
    const graph = buildWorld();
    member(graph, STRANGER, REALM_A, DEF_A, 0.05);
    const reader = createHoldReader(graph, [stanceOn(KEEPER, TOWN_A)], projection());

    const ids = generateFactionQuestCandidates(graph, STRANGER, TOWN_A, 10, reader).map(c => c.templateId);

    expect(ids).toHaveLength(0);
  });

  it('a keeper at *subject* gets the court’s rows through the allowlist and the keeper rows once, not twice', () => {
    const graph = buildWorld();
    member(graph, KEEPER, REALM_A, DEF_A, 0.2);
    const reader = createHoldReader(graph, [stanceOn(KEEPER, TOWN_A)], projection());

    const ids = generateFactionQuestCandidates(graph, KEEPER, TOWN_A, 10, reader).map(c => c.templateId);

    for (const court of COURT) expect(ids).toContain(court);
    expect(ids.filter(id => id === PETITION)).toHaveLength(1);
    expect(ids.filter(id => id === RECKONING)).toHaveLength(1);
  });

  it('the arm is keyed on the Realm the standing names: a member of Brenn keeping a town on Aldmark’s ground gets nothing from Brenn', () => {
    const graph = buildWorld();
    member(graph, KEEPER, REALM_B, DEF_B, 0.05);
    const reader = createHoldReader(graph, [stanceOn(KEEPER, TOWN_A)], projection());

    const ids = generateFactionQuestCandidates(graph, KEEPER, TOWN_A, 10, reader).map(c => c.templateId);

    expect(ids).toHaveLength(0);
  });

  it('without a reader the supply path is exactly what it was — no arm, no throw', () => {
    const graph = buildWorld();
    member(graph, KEEPER, REALM_A, DEF_A, 0.05);
    expect(generateFactionQuestCandidates(graph, KEEPER, TOWN_A, 10)).toHaveLength(0);
  });
});

describe('gate — requiresHold in filterByPrerequisites', () => {
  it('admits the keeper of the encounter’s Realm and hides it from a stranger standing in the same town', () => {
    const graph = buildWorld();
    const reader = createHoldReader(graph, [stanceOn(KEEPER, TOWN_A)], projection());
    const entries = [entry(PETITION, TOWN_A), entry(RECKONING, TOWN_A)];

    expect(filterByPrerequisites(entries, KEEPER, graph, reader).map(e => e.templateId)).toEqual([PETITION, RECKONING]);
    expect(filterByPrerequisites(entries, STRANGER, graph, reader)).toHaveLength(0);
  });

  it('hides it from a keeper of a different Realm — the encounter’s ground decides', () => {
    const graph = buildWorld();
    const reader = createHoldReader(graph, [stanceOn(KEEPER, TOWN_A)], projection());
    expect(filterByPrerequisites([entry(PETITION, TOWN_B)], KEEPER, graph, reader)).toHaveLength(0);
  });

  it('hides it from a keeper whose town is in the wilds — no Realm, no standing', () => {
    const graph = buildWorld();
    const reader = createHoldReader(graph, [stanceOn(KEEPER, NOWHERE)], projection());
    expect(filterByPrerequisites([entry(PETITION, TOWN_A)], KEEPER, graph, reader)).toHaveLength(0);
  });

  it('fails open: no reader, an unresolvable template, or a location the map cannot place', () => {
    const graph = buildWorld();
    const reader = createHoldReader(graph, [stanceOn(KEEPER, TOWN_A)], projection());
    // No reader at all — the codex, a test harness: the gate is skipped.
    expect(filterByPrerequisites([entry(PETITION, TOWN_A)], STRANGER, graph)).toHaveLength(1);
    // A template nobody can resolve carries no field to read.
    expect(filterByPrerequisites([entry('tmpl.no_such', TOWN_A)], STRANGER, graph, reader)).toHaveLength(1);
    // A location with no hex falls back to the keeper's own Realm — open for the keeper…
    expect(filterByPrerequisites([entry(PETITION, NOWHERE)], KEEPER, graph, reader)).toHaveLength(1);
    // …and still closed for a stranger: the keeper test itself never fails open.
    expect(filterByPrerequisites([entry(PETITION, NOWHERE)], STRANGER, graph, reader)).toHaveLength(0);
  });

  it('leaves the court’s own rows alone — they gate on rank, not on the hold', () => {
    const graph = buildWorld();
    const reader = createHoldReader(graph, [stanceOn(KEEPER, TOWN_A)], projection());
    const entries = COURT.map(id => entry(id, TOWN_A));
    expect(filterByPrerequisites(entries, STRANGER, graph, reader)).toHaveLength(COURT.length);
  });
});
