import { describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import { getCallbackCandidates, type CallbackBeatContext } from '../callbackEligibility';

const AGENT_ID = 'actor.agent';
const CAST_ONE_ID = 'actor.cast.one';
const CAST_TWO_ID = 'actor.cast.two';
const FACTION_ALPHA_ID = 'faction.alpha';
const FACTION_BETA_ID = 'faction.beta';
const TOWN_LOCATION_ID = 'location.town';
const FOREST_LOCATION_ID = 'location.forest';

function buildGraph(): WorldGraph {
  const graph = new WorldGraph();

  graph.addNode({
    id: AGENT_ID,
    type: 'actor',
    name: 'Agent',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: CAST_ONE_ID,
    type: 'actor',
    name: 'Cast One',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: CAST_TWO_ID,
    type: 'actor',
    name: 'Cast Two',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: FACTION_ALPHA_ID,
    type: 'actor',
    name: 'Faction Alpha',
    properties: { actorType: 'faction' },
  });
  graph.addNode({
    id: FACTION_BETA_ID,
    type: 'actor',
    name: 'Faction Beta',
    properties: { actorType: 'faction' },
  });
  graph.addNode({
    id: TOWN_LOCATION_ID,
    type: 'location',
    name: 'Town',
    properties: { locationSubtype: 'town' },
  });
  graph.addNode({
    id: FOREST_LOCATION_ID,
    type: 'location',
    name: 'Forest',
    properties: { locationSubtype: 'forest' },
  });

  graph.addEdge({
    id: `${AGENT_ID}_member_of_${FACTION_ALPHA_ID}`,
    source: AGENT_ID,
    target: FACTION_ALPHA_ID,
    type: 'member_of',
    properties: { role: 'member', rank: 1, joinedTick: 0 },
  });
  graph.addEdge({
    id: `${CAST_ONE_ID}_member_of_${FACTION_ALPHA_ID}`,
    source: CAST_ONE_ID,
    target: FACTION_ALPHA_ID,
    type: 'member_of',
    properties: { role: 'member', rank: 1, joinedTick: 0 },
  });
  graph.addEdge({
    id: `${CAST_TWO_ID}_member_of_${FACTION_BETA_ID}`,
    source: CAST_TWO_ID,
    target: FACTION_BETA_ID,
    type: 'member_of',
    properties: { role: 'member', rank: 1, joinedTick: 0 },
  });

  return graph;
}

interface AddEventOptions {
  id: string;
  tick: number;
  participants?: readonly string[];
  locationId?: string;
  sphereAffinity?: string;
  outcome?: string;
  callbackWeight?: 'structural' | 'incidental';
}

function addEncounterEvent(graph: WorldGraph, options: AddEventOptions): void {
  graph.addNode({
    id: options.id,
    type: 'event',
    name: options.id,
    properties: {
      eventType: 'encounter_outcome',
      tick: options.tick,
      outcome: options.outcome ?? 'success',
      ...(options.sphereAffinity ? { sphereAffinity: options.sphereAffinity } : {}),
      ...(options.callbackWeight ? { callbackWeight: options.callbackWeight } : {}),
    },
  });

  const participants = options.participants ?? [AGENT_ID];
  for (const participantId of participants) {
    graph.addEdge({
      id: `${participantId}_participated_in_${options.id}`,
      source: participantId,
      target: options.id,
      type: 'participated_in',
      properties: {
        role: participantId === AGENT_ID ? 'primary' : 'target',
        outcome: options.outcome ?? 'success',
        tick: options.tick,
      },
    });
  }

  graph.addEdge({
    id: `${options.id}_occurred_at_${options.locationId ?? TOWN_LOCATION_ID}`,
    source: options.id,
    target: options.locationId ?? TOWN_LOCATION_ID,
    type: 'occurred_at',
    properties: { tick: options.tick },
  });
}

const CURRENT_BEAT: CallbackBeatContext = {
  castMemberIds: [CAST_ONE_ID],
  placeType: 'town',
  factionIds: [FACTION_ALPHA_ID],
  sphere: 'force',
};

describe('getCallbackCandidates', () => {
  it('prioritizes author-pinned callback candidates and fills remaining slots from derived ranking', () => {
    const graph = buildGraph();
    addEncounterEvent(graph, { id: 'event.pinned.old', tick: 10, locationId: FOREST_LOCATION_ID });
    addEncounterEvent(graph, { id: 'event.pinned.new', tick: 95, locationId: FOREST_LOCATION_ID });
    addEncounterEvent(graph, {
      id: 'event.derived.top',
      tick: 100,
      participants: [AGENT_ID, CAST_ONE_ID],
      locationId: TOWN_LOCATION_ID,
      sphereAffinity: 'force',
      callbackWeight: 'structural',
    });
    addEncounterEvent(graph, {
      id: 'event.derived.other',
      tick: 98,
      participants: [AGENT_ID],
      locationId: TOWN_LOCATION_ID,
      sphereAffinity: 'life',
    });

    const result = getCallbackCandidates({
      graph,
      agentId: AGENT_ID,
      currentTick: 120,
      currentBeat: CURRENT_BEAT,
      authorPinnedEventIds: ['event.pinned.old', 'event.pinned.new'],
    });

    expect(result.map(eventNode => eventNode.id)).toEqual([
      'event.pinned.old',
      'event.pinned.new',
      'event.derived.top',
    ]);
  });

  it('ranks graph-derived events by relevance, recency decay, and emotional weight', () => {
    const graph = buildGraph();
    addEncounterEvent(graph, {
      id: 'event.top',
      tick: 100,
      participants: [AGENT_ID, CAST_ONE_ID],
      locationId: TOWN_LOCATION_ID,
      sphereAffinity: 'force',
      callbackWeight: 'structural',
    });
    addEncounterEvent(graph, {
      id: 'event.mid',
      tick: 99,
      participants: [AGENT_ID],
      locationId: TOWN_LOCATION_ID,
      sphereAffinity: 'force',
      callbackWeight: 'incidental',
    });
    addEncounterEvent(graph, {
      id: 'event.low',
      tick: 20,
      participants: [AGENT_ID],
      locationId: TOWN_LOCATION_ID,
      sphereAffinity: 'force',
      callbackWeight: 'structural',
    });

    const result = getCallbackCandidates({
      graph,
      agentId: AGENT_ID,
      currentTick: 120,
      currentBeat: CURRENT_BEAT,
    });

    expect(result.map(eventNode => eventNode.id)).toEqual([
      'event.top',
      'event.mid',
      'event.low',
    ]);
  });

  it('uses deterministic tie-breaking by event id when scores are equal', () => {
    const graph = buildGraph();
    addEncounterEvent(graph, {
      id: 'event.beta',
      tick: 90,
      participants: [AGENT_ID],
      locationId: TOWN_LOCATION_ID,
      sphereAffinity: 'force',
      callbackWeight: 'incidental',
    });
    addEncounterEvent(graph, {
      id: 'event.alpha',
      tick: 90,
      participants: [AGENT_ID],
      locationId: TOWN_LOCATION_ID,
      sphereAffinity: 'force',
      callbackWeight: 'incidental',
    });

    const result = getCallbackCandidates({
      graph,
      agentId: AGENT_ID,
      currentTick: 120,
      currentBeat: {
        castMemberIds: [],
        placeType: 'town',
        factionIds: [FACTION_ALPHA_ID],
        sphere: 'force',
      },
      maxCandidates: 2,
    });

    expect(result.map(eventNode => eventNode.id)).toEqual(['event.alpha', 'event.beta']);
  });

  it('fails soft with empty output when the agent has no encounter history', () => {
    const graph = buildGraph();

    const result = getCallbackCandidates({
      graph,
      agentId: AGENT_ID,
      currentTick: 120,
      currentBeat: CURRENT_BEAT,
    });

    expect(result).toEqual([]);
  });

  it('preserves authored pin order even when newer derived events score higher', () => {
    const graph = buildGraph();
    addEncounterEvent(graph, { id: 'event.pinned.older', tick: 5, locationId: FOREST_LOCATION_ID });
    addEncounterEvent(graph, { id: 'event.pinned.newer', tick: 6, locationId: FOREST_LOCATION_ID });
    addEncounterEvent(graph, {
      id: 'event.high.score',
      tick: 120,
      participants: [AGENT_ID, CAST_ONE_ID],
      locationId: TOWN_LOCATION_ID,
      sphereAffinity: 'force',
      callbackWeight: 'structural',
    });

    const result = getCallbackCandidates({
      graph,
      agentId: AGENT_ID,
      currentTick: 125,
      currentBeat: CURRENT_BEAT,
      authorPinnedEventIds: ['event.pinned.newer', 'event.pinned.older'],
    });

    expect(result.map((eventNode) => eventNode.id)).toEqual([
      'event.pinned.newer',
      'event.pinned.older',
      'event.high.score',
    ]);
  });
});
