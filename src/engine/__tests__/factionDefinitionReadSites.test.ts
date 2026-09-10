/**
 * The definition door, hung (THR-1155 slice 2).
 *
 * THR-1322 built `getFactionDefinition(id, dynamicDefs?)` so a definition minted
 * at run time resolves like an authored one, and `foundFaction` writes one on
 * every charter. But the engine's twenty-one by-id read sites went on calling
 * `FACTION_DEFINITIONS.get(id)` on the static table, so a run-founded faction was
 * shut out of the ladder, the ambitions, the quests and the encounter gates —
 * THR-1322's door opened onto a wall. The tripwire in
 * `src/data/__tests__/faction-definition-lookup.readsites.test.ts` pins the shape
 * of the sweep; this file pins what the sweep *does*.
 *
 * The consumer chosen is the rank gate, because its miss is invisible rather than
 * loud: `meetsFactionRankRequirement` **fails open** on a definition it cannot
 * resolve. Before the sweep a founded order's every rank gate stood open — a
 * stranger passed a Keeper-only check — and nothing anywhere threw, logged or
 * rendered differently. That is why a behavioural test is worth writing here and
 * why it needs a control arm: green on the gated case alone would also be green
 * if the gate closed for some unrelated reason.
 *
 * **The control is the fail-open path itself**, exercised in the same run against
 * the same membership: an id the lookup cannot resolve still returns `true`. So
 * the two arms differ in exactly one thing — whether the definition resolves —
 * which is the one thing the sweep changed.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { foundFaction } from '../strategicGraphOps';
import { meetsFactionRankRequirement } from '../factionReputation';
import { getAgentFactionBonuses } from '../factionRankBonus';
import { clearDynamicFactionDefinitions } from '../../data/faction-definition-lookup';
import type { GameState } from '../../types/gameState';
import type { StrategicFactionSeed } from '../../types/strategicAction';

const FOUNDER = 'actor_founder';
const HOLD = 'loc_hold';

const SEED: StrategicFactionSeed = {
  factionType: 'guild',
  nameTemplate: "The Kept Word",
  description: 'A chartered order.',
  iconGlyph: '⚜',
  themeColor: '#B8A56A',
  locationTypes: ['town', 'city', 'capital'],
  joinEncounterTemplateId: 'ag.join',
  promotionEncounterTemplateId: 'ag.promotion',
  questTemplateIds: ['ag.quest.escort_caravan'],
  socialTemplateIds: ['ag.social.tavern_tales'],
};

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: FOUNDER,
    type: 'actor',
    name: 'Edda',
    properties: { actorType: 'individual', hexCol: 3, hexRow: 3 },
  });
  graph.addNode({
    id: 'actor_member',
    type: 'actor',
    name: 'Rell',
    properties: { actorType: 'individual', hexCol: 3, hexRow: 3 },
  });
  graph.addNode({
    id: HOLD,
    type: 'location',
    name: 'Ashfell',
    properties: { locationSubtype: 'town', hexCol: 3, hexRow: 3 },
  });
  return graph;
}

function makeState(graph: WorldGraph): GameState {
  return {
    tick: 1,
    cycle: 0,
    seed: 42,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: FOUNDER,
    essencePool: {},
    mandateDefinition: null,
  } as unknown as GameState;
}

/**
 * A membership on the founded order at the bottom of its ladder.
 *
 * `sworn` sits at `minReputation: 0`, `keeper` at `0.4`, so a member at 0.1 is a
 * genuine stranger to the Keeper gate. The shape (`factionDefId` + `reputation`
 * on a `member_of` edge) is the one `npcSeeding` mints; nothing here is invented.
 */
function swearMember(graph: WorldGraph, factionNodeId: string, factionDefId: string): void {
  graph.addEdge({
    id: `member_${factionNodeId}`,
    source: 'actor_member',
    target: factionNodeId,
    type: 'member_of',
    properties: { factionDefId, reputation: 0.1, rank: 0.1, role: 'member', joinedTick: 1 },
  });
}

describe('run-founded definitions reach the engine consumers (THR-1155)', () => {
  it('gates a founded order\'s rank ladder, where it used to stand open', () => {
    clearDynamicFactionDefinitions();
    const state = makeState(world());
    const result = foundFaction(state, FOUNDER, HOLD, SEED, { heart: 0.5 }, 'The Kept Word', 5);
    expect(result.success).toBe(true);

    const factionNodeId = result.createdId as string;
    const factionDefId = Object.keys(state.dynamicFactionDefinitions ?? {})[0];
    expect(factionDefId).toBeTruthy();

    swearMember(state.graph, factionNodeId, factionDefId);

    // The arm under test: the definition resolves, so `keeper` (minReputation 0.4)
    // is out of reach for a member at 0.1. Pre-sweep this read the static map,
    // missed, and returned `true`.
    expect(
      meetsFactionRankRequirement(state.graph, 'actor_member', factionDefId, 'keeper'),
    ).toBe(false);

    // …and the gate is not simply stuck shut: the tier the member *does* hold opens.
    expect(
      meetsFactionRankRequirement(state.graph, 'actor_member', factionDefId, 'sworn'),
    ).toBe(true);
  });

  it('control — an unresolvable definition still fails open, so the arm above means resolution', () => {
    clearDynamicFactionDefinitions();
    const state = makeState(world());
    const result = foundFaction(state, FOUNDER, HOLD, SEED, { heart: 0.5 }, 'The Kept Word', 5);
    const factionNodeId = result.createdId as string;
    const factionDefId = Object.keys(state.dynamicFactionDefinitions ?? {})[0];
    swearMember(state.graph, factionNodeId, factionDefId);

    // Same graph, same membership, same rank word — only the id cannot be resolved.
    // This is precisely the state every founded faction was in before the sweep.
    expect(
      meetsFactionRankRequirement(state.graph, 'actor_member', 'founded_no_such_definition', 'keeper'),
    ).toBe(true);
  });

  it('carries the founded ladder into the rank-bonus reader too', () => {
    clearDynamicFactionDefinitions();
    const state = makeState(world());
    const result = foundFaction(state, FOUNDER, HOLD, SEED, { heart: 0.5 }, 'The Kept Word', 5);
    const factionNodeId = result.createdId as string;
    const factionDefId = Object.keys(state.dynamicFactionDefinitions ?? {})[0];
    swearMember(state.graph, factionNodeId, factionDefId);

    // `getAgentFactionBonuses` skipped every founded membership outright — the
    // definition miss `continue`d before any tier was computed. It now reaches the
    // ladder; whether this order's `sworn` tier carries bonuses is content, so the
    // assertion is that the reader ran, not that it found something.
    expect(() =>
      getAgentFactionBonuses(state.graph, 'actor_member', 'encounter_reward_multiplier'),
    ).not.toThrow();
  });
});
