/**
 * Secrets & Favors Activation Tests — THR-724
 *
 * The THR-30 system was fully built and produced nothing. These tests cover the
 * four repairs, so a regression shows up as a red test rather than as a world that
 * quietly stops having secrets in it:
 *
 *   - pickSecretSubject(): co-located subject selection (break 1's missing half)
 *   - applySecretsFavorsFromResolvedAction(): template metadata read at the live seam
 *   - applySecretRevelationConsequences(): confession betrayal stacks, both sentiment
 *     directions move (the effects migrated from the retired duplicate module)
 *   - revealBestSecret(): picks the heaviest secret and applies real consequences
 *   - buildIntelligenceDisplay(): secrets surface as intelligence records
 *   - the two player verbs are granted by a beat (no longer unreachable)
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { pickSecretSubject, createSecretEdge } from '../secretGeneration';
import { applySecretsFavorsFromResolvedAction } from '../secretsFromResolution';
import { applySecretRevelationConsequences, revealBestSecret } from '../secretsFavorsConsequences';
import { buildIntelligenceDisplay } from '../intelligence';
import { collectGrantedActionIds } from '../../data/ascendant-beat-content';
import {
  SECRET_REVELATION_TRUST_PENALTY,
  SECRET_CONFESSION_BETRAYAL_PENALTY,
} from '../../types/secretsFavors';
import { mulberry32 } from '../../lib/prng';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction } from '../../types/unifiedAction';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeActor(graph: WorldGraph, id: string, name = id) {
  graph.addNode({ id, type: 'actor', name, properties: {} });
  return graph.getNode(id)!;
}

/** Place `actorId` at `locationId` via a `located_at` edge. */
function place(graph: WorldGraph, actorId: string, locationId: string) {
  graph.addEdge({
    id: `at_${actorId}`, type: 'located_at', source: actorId, target: locationId, properties: {},
  });
}

function relate(graph: WorldGraph, from: string, to: string, trust = 0.5, sentiment = 0.5) {
  graph.addEdge({
    id: `rel_${from}_${to}`, type: 'relates_to', source: from, target: to,
    properties: { trust, sentiment },
  });
}

function makeState(graph: WorldGraph, tick = 10): GameState {
  return {
    graph, tick, seed: 42, tickEvents: [], recentEvents: [],
  } as unknown as GameState;
}

function makeAction(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_1',
    actorId: 'agent_a',
    templateId: 'encounter.local_gossip',
    targetId: 'loc_0',
    outcome: 'success',
    resolved: true,
    ...overrides,
  } as unknown as UnifiedAction;
}

// ─── pickSecretSubject ───────────────────────────────────────────────────────

describe('pickSecretSubject', () => {
  it('picks a co-located actor other than the discoverer', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_0', type: 'location', name: 'Town', properties: {} });
    makeActor(graph, 'agent_a');
    makeActor(graph, 'agent_b');
    place(graph, 'agent_a', 'loc_0');
    place(graph, 'agent_b', 'loc_0');

    expect(pickSecretSubject('agent_a', graph, mulberry32(1))).toBe('agent_b');
  });

  it('returns undefined when the discoverer stands alone', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_0', type: 'location', name: 'Town', properties: {} });
    makeActor(graph, 'agent_a');
    place(graph, 'agent_a', 'loc_0');

    expect(pickSecretSubject('agent_a', graph, mulberry32(1))).toBeUndefined();
  });

  it('returns undefined when the discoverer has no placement (fail-soft)', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'agent_a');
    expect(pickSecretSubject('agent_a', graph, mulberry32(1))).toBeUndefined();
  });
});

// ─── Birth at the resolution seam ────────────────────────────────────────────

describe('applySecretsFavorsFromResolvedAction', () => {
  function seededWorld() {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_0', type: 'location', name: 'Town', properties: {} });
    makeActor(graph, 'agent_a');
    makeActor(graph, 'agent_b');
    place(graph, 'agent_a', 'loc_0');
    place(graph, 'agent_b', 'loc_0');
    return graph;
  }

  it('births a knows_secret_of edge from a template carrying secretDiscovery', () => {
    const graph = seededWorld();
    // encounter.local_gossip carries `secretDiscovery` and targets a *location*,
    // which is exactly the case the legacy read site could never handle.
    applySecretsFavorsFromResolvedAction(makeState(graph), makeAction());

    const secrets = graph.getOutgoingEdges('agent_a', 'knows_secret_of');
    expect(secrets).toHaveLength(1);
    expect(secrets[0].target).toBe('agent_b');
    expect(secrets[0].properties.source).toBe('tavern_gossip');
  });

  it('is deterministic — same seed and tick produce the same secret', () => {
    const runOnce = () => {
      const graph = seededWorld();
      applySecretsFavorsFromResolvedAction(makeState(graph), makeAction());
      const e = graph.getOutgoingEdges('agent_a', 'knows_secret_of')[0];
      return `${e.target}:${e.properties.secretType}:${e.properties.magnitude}`;
    };
    expect(runOnce()).toBe(runOnce());
  });

  it('does nothing on a failed outcome', () => {
    const graph = seededWorld();
    applySecretsFavorsFromResolvedAction(makeState(graph), makeAction({ outcome: 'failure' }));
    expect(graph.getOutgoingEdges('agent_a', 'knows_secret_of')).toHaveLength(0);
  });

  it('does nothing for a template with no secrets/favors metadata', () => {
    const graph = seededWorld();
    applySecretsFavorsFromResolvedAction(
      makeState(graph), makeAction({ templateId: 'encounter.deep_descent' }),
    );
    expect(graph.getOutgoingEdges('agent_a', 'knows_secret_of')).toHaveLength(0);
  });

  it('fails soft when the actor stands alone — no subject, no secret, no throw', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc_0', type: 'location', name: 'Town', properties: {} });
    makeActor(graph, 'agent_a');
    place(graph, 'agent_a', 'loc_0');

    expect(() =>
      applySecretsFavorsFromResolvedAction(makeState(graph), makeAction()),
    ).not.toThrow();
    expect(graph.getOutgoingEdges('agent_a', 'knows_secret_of')).toHaveLength(0);
  });
});

// ─── Consequences (migrated from the retired fork) ───────────────────────────

describe('applySecretRevelationConsequences', () => {
  function revealWorld(source: 'confession' | 'observation') {
    const graph = new WorldGraph();
    makeActor(graph, 'holder');
    makeActor(graph, 'subject');
    makeActor(graph, 'audience');
    relate(graph, 'subject', 'holder', 0.8, 0.8);
    relate(graph, 'subject', 'audience', 0.5, 0.5);
    const props = createSecretEdge(
      'holder', 'subject',
      { secretType: 'hidden_weakness', magnitude: 0.5, detail: 'a private vulnerability' },
      source, 1, graph,
    )!;
    const edgeId = graph.getOutgoingEdges('holder', 'knows_secret_of')[0].id;
    return { graph, props, edgeId };
  }

  it('stacks the betrayal penalty on top of the base penalty for a confessed secret', () => {
    const { graph, props, edgeId } = revealWorld('confession');
    const before = graph.getOutgoingEdges('subject', 'relates_to')[0].properties.trust as number;

    applySecretRevelationConsequences(props, edgeId, 'holder', 'subject', 'audience', makeState(graph));

    const after = graph.getOutgoingEdges('subject', 'relates_to')
      .filter(e => e.target === 'holder')[0].properties.trust as number;
    expect(after).toBeCloseTo(
      before + SECRET_REVELATION_TRUST_PENALTY + SECRET_CONFESSION_BETRAYAL_PENALTY, 5,
    );
  });

  it('applies only the base penalty when the secret was merely observed', () => {
    const { graph, props, edgeId } = revealWorld('observation');
    const before = graph.getOutgoingEdges('subject', 'relates_to')[0].properties.trust as number;

    applySecretRevelationConsequences(props, edgeId, 'holder', 'subject', 'audience', makeState(graph));

    const after = graph.getOutgoingEdges('subject', 'relates_to')
      .filter(e => e.target === 'holder')[0].properties.trust as number;
    expect(after).toBeCloseTo(before + SECRET_REVELATION_TRUST_PENALTY, 5);
  });

  it('turns the subject against whoever now knows, and marks the edge revealed', () => {
    const { graph, props, edgeId } = revealWorld('observation');
    const before = graph.getOutgoingEdges('subject', 'relates_to')
      .filter(e => e.target === 'audience')[0].properties.sentiment as number;

    const patch = applySecretRevelationConsequences(
      props, edgeId, 'holder', 'subject', 'audience', makeState(graph),
    );

    const after = graph.getOutgoingEdges('subject', 'relates_to')
      .filter(e => e.target === 'audience')[0].properties.sentiment as number;
    expect(after).toBeLessThan(before);
    expect(graph.getEdge(edgeId)!.properties.revealed).toBe(true);
    expect(patch.tickEvents).toHaveLength(1);
  });
});

// ─── revealBestSecret (the player's Divine Whisper seam) ─────────────────────

describe('revealBestSecret', () => {
  it('reveals the heaviest unrevealed secret and applies consequences', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'holder');
    makeActor(graph, 'subject');
    relate(graph, 'subject', 'holder', 0.9, 0.9);
    createSecretEdge('holder', 'subject',
      { secretType: 'hidden_weakness', magnitude: 0.2, detail: 'minor' }, 'observation', 1, graph);
    createSecretEdge('holder', 'subject',
      { secretType: 'past_crime', magnitude: 0.9, detail: 'major' }, 'observation', 2, graph);

    const patch = revealBestSecret(makeState(graph), 'holder', 'subject');

    const revealed = graph.getOutgoingEdges('holder', 'knows_secret_of')
      .filter(e => e.properties.revealed);
    expect(revealed).toHaveLength(1);
    expect(revealed[0].properties.secretType).toBe('past_crime');
    expect(patch.tickEvents).toHaveLength(1);
  });

  it('is a no-op when the revealer holds nothing about the subject', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'holder');
    makeActor(graph, 'subject');
    expect(revealBestSecret(makeState(graph), 'holder', 'subject')).toEqual({});
  });
});

// ─── Secrets as intelligence (UI pillar) ─────────────────────────────────────

describe('buildIntelligenceDisplay — secrets projection', () => {
  it('renders an unrevealed secret as a political_secret record', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'holder');
    makeActor(graph, 'subject', 'Serafina');
    createSecretEdge('holder', 'subject',
      { secretType: 'past_crime', magnitude: 0.6, detail: 'Serafina keeps a past hidden.' },
      'confession', 4, graph);

    const entries = buildIntelligenceDisplay([], 'holder', graph, 10);
    expect(entries).toHaveLength(1);
    expect(entries[0].category).toBe('political_secret');
    expect(entries[0].targetDisplayName).toBe('Serafina');
    expect(entries[0].reliabilityDescriptor).toBe('reliable');
  });

  it('omits a revealed secret — once told it is no longer leverage', () => {
    const graph = new WorldGraph();
    makeActor(graph, 'holder');
    makeActor(graph, 'subject');
    createSecretEdge('holder', 'subject',
      { secretType: 'past_crime', magnitude: 0.6, detail: 'x' }, 'confession', 4, graph);
    const edge = graph.getOutgoingEdges('holder', 'knows_secret_of')[0];
    graph.updateEdge(edge.id, { properties: { ...edge.properties, revealed: true } });

    expect(buildIntelligenceDisplay([], 'holder', graph, 10)).toHaveLength(0);
  });
});

// ─── Player verbs are reachable ──────────────────────────────────────────────

describe('secret player verbs', () => {
  it('are granted by a beat, so they are no longer unreachable by construction', () => {
    const granted = collectGrantedActionIds();
    expect(granted).toContain('action.secrets.reveal_secret');
    expect(granted).toContain('action.secrets.plant_secret');
  });
});
