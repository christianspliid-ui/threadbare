/**
 * THR-1644 S1 — golden pin on the meeting writer.
 *
 * `createAgentFromMeeting` became create-then-apply: it still writes the node,
 * the `located_at` edge and the `the_first` thread, then hands the rite's
 * remaining steps to `applyThreadingRite` (the one writer, D1). The meeting's
 * output must not move. This snapshot was recorded on the pre-refactor writer
 * (origin/main 84894af3) for seeds 42 / 99 / 2 through the real generators and
 * resolvers, and the refactor is held to it.
 *
 * The rite adds inspect-only bookkeeping that did not exist before — the
 * thread's `riteShape`, and on the ascendant (not snapshotted) `threadsBoundCount`
 * and `lastRite`. `riteHistory` is stripped too, ahead of S2 adding it to the
 * node. They are new, not changed.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  applyMeetingOutcomes,
  bindSparkVisionsToCandidate,
  buildNarrativeResult,
  createAgentFromMeeting,
  generateNarrativeCandidates,
  generateSparkVisions,
  resetMeetingCounter,
  resolveBondTest,
  resolveFormativeTest,
} from '../meetingEncounter';
import { ENRICHED_DILEMMA_LIBRARY } from '../../data/meeting-dilemma-library';
import { MEETING_BOND_TEST } from '../../data/meeting-bond-test';

/** Keys the rite adds that the pre-refactor writer never wrote. */
const RITE_ONLY_KEYS = new Set(['riteHistory', 'riteShape']);

function strip(props: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(props).filter(([k]) => !RITE_ONLY_KEYS.has(k)));
}

function bondThroughMeeting(seed: number) {
  const candidates = generateNarrativeCandidates('hunger.golden', 'culture.golden', seed, undefined, 'life');
  const candidate = candidates[seed % candidates.length];
  const visions = bindSparkVisionsToCandidate(
    generateSparkVisions(candidate.primaryReach, 'life', seed),
    candidate,
  );
  const base = buildNarrativeResult({
    candidate,
    vision: visions[0],
    dilemmaChoices: [],
    editedName: undefined,
    locationId: 'loc_village',
    ascendantSphere: 'life',
    tick: 10,
  });

  const converted = ENRICHED_DILEMMA_LIBRARY.filter(t => t.test);
  const picks = [converted[seed % converted.length], converted[(seed * 7 + 3) % converted.length]];
  const outcomes = picks.map((t, i) =>
    resolveFormativeTest(t.test!, i, t.id, t.test!.nudges.slice(0, 1).map(n => n.id), seed + i),
  );
  const bond = resolveBondTest(MEETING_BOND_TEST, [], seed);
  const result = applyMeetingOutcomes(base, outcomes, bond);

  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'loc_village', type: 'location', name: 'Ashenmoor', properties: {} });
  resetMeetingCounter();
  const agentId = createAgentFromMeeting(graph, result, 'asc', 10);

  const node = graph.getNode(agentId)!;
  const thread = graph.getOutgoingEdges('asc', 'thread').find(e => e.target === agentId)!;
  const located = graph.getOutgoingEdges(agentId, 'located_at');
  return {
    agentId,
    node: { name: node.name, type: node.type, properties: strip(node.properties) },
    thread: { id: thread.id, properties: strip(thread.properties) },
    located: located.map(e => ({ id: e.id, target: e.target })),
  };
}

describe('THR-1644 S1 — createAgentFromMeeting output is pinned across the refactor', () => {
  it.each([42, 99, 2])('seed %i bonds the same First as before', (seed) => {
    expect(bondThroughMeeting(seed)).toMatchSnapshot();
  });
});
