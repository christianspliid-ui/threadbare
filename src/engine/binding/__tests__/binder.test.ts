/**
 * The binder's scored board — THR-1296 slice 2.
 *
 * Contract tests: nothing consumes `resolveBinding` yet (the bind pass is slice 4), so
 * these are the only thing holding the board's shape. They are written to catch the
 * two failure modes the plan's kill criteria name — a **degenerate board** where one
 * mode wins regardless of the world, and a scarcity term that does not actually steer.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GraphNode } from '../../../types/graph';
import type { BindingDecisionTrace } from '../../../types/trace';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../../traceBuffer';
import { buildRoleCensus } from '../roleCensus';
import { resolveBinding, type BindingRequest, type BinderContext } from '../binder';
import { BINDER_ROLE_COMMODITY_THRESHOLD } from '../../../data/binder-constants';

const STAGE = 'loc-tavern';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: STAGE, type: 'location', name: 'The Salt Hound',
    properties: { hexCol: 5, hexRow: 5 },
  });
  graph.addNode({
    id: 'actor-hero', type: 'actor', name: 'Hero',
    properties: { actorType: 'individual' },
  });
  graph.addEdge({
    id: 'e-hero-at', source: 'actor-hero', target: STAGE,
    type: 'located_at', properties: {},
  });
  return graph;
}

function addPerson(
  graph: WorldGraph,
  id: string,
  props: Record<string, unknown> = {},
  at: string = STAGE,
): GraphNode {
  const node: GraphNode = {
    id, type: 'actor', name: id,
    properties: { actorType: 'individual', ...props },
  };
  graph.addNode(node);
  graph.addEdge({ id: `e-${id}-at`, source: id, target: at, type: 'located_at', properties: {} });
  return node;
}

function ctxFor(graph: WorldGraph): BinderContext {
  return { graph, census: buildRoleCensus(graph), tick: 100 };
}

function request(over: Partial<BindingRequest> = {}): BindingRequest {
  return {
    projectId: 'proj-1',
    castKey: '$broker',
    stepIndex: 0,
    actorId: 'actor-hero',
    mintRole: 'innkeeper',
    stageNodeId: STAGE,
    ...over,
  };
}

function decisionTraces(): BindingDecisionTrace[] {
  return getTraces().filter(t => t.category === 'binding_decision') as BindingDecisionTrace[];
}

describe('resolveBinding', () => {
  beforeEach(() => {
    enableTracing();
    clearTraces();
  });
  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('mints when the world is empty — there is nobody to reuse', () => {
    const graph = world();
    const decision = resolveBinding(request(), ctxFor(graph));
    expect(decision.mode).toBe('mint');
  });

  it('reuses a scarce role-matched local over minting a stranger', () => {
    const graph = world();
    addPerson(graph, 'actor-inn', { npcRole: 'innkeeper' });

    const decision = resolveBinding(request(), ctxFor(graph));

    expect(decision.mode).toBe('reuse');
    if (decision.mode === 'reuse') expect(decision.nodeId).toBe('actor-inn');
  });

  it('scarcity steers: a commodity role trends to mint where a scarce one trends to reuse', () => {
    // The two arms differ ONLY in how many people hold the role — same stage, same
    // absence of ties, same distance. If the outcome does not flip, the scarcity term
    // is not steering and the board is degenerate (plan § Kill criteria).
    const scarceWorld = world();
    addPerson(scarceWorld, 'sole-archmage', { npcRole: 'archmage' });
    const scarceDecision = resolveBinding(
      request({ mintRole: 'archmage' }),
      ctxFor(scarceWorld),
    );

    const commodityWorld = world();
    for (let i = 0; i < BINDER_ROLE_COMMODITY_THRESHOLD; i++) {
      addPerson(commodityWorld, `sailor-${i}`, { npcRole: 'sailor' });
    }
    const commodityDecision = resolveBinding(
      request({ mintRole: 'sailor' }),
      ctxFor(commodityWorld),
    );

    expect(scarceDecision.mode).toBe('reuse');
    expect(commodityDecision.mode).toBe('mint');
  });

  it('a story tie overrides commodity scarcity — weights, not rules', () => {
    // Same commodity world as above, but one sailor already knows the hero. The
    // ruling is explicit that story ties may override scarcity in either direction;
    // this is that clause under test.
    const graph = world();
    for (let i = 0; i < BINDER_ROLE_COMMODITY_THRESHOLD; i++) {
      addPerson(graph, `sailor-${i}`, { npcRole: 'sailor' });
    }
    graph.addEdge({
      id: 'e-bond', source: 'actor-hero', target: 'sailor-3', type: 'relates_to',
      properties: { sentiment: -0.9, trust: -0.8 },
    });
    // Layered rather than a single edge at maximum: a tie built from several real
    // relationships is what the term is meant to reward, and it keeps the assertion
    // off a knife-edge margin where a small retune would flip it for the wrong reason.
    graph.addEdge({
      id: 'e-secret', source: 'actor-hero', target: 'sailor-3',
      type: 'knows_secret_of',
      // Schema-complete on purpose: an edge that trips EDGE_SCHEMA warnings is a
      // fixture inventing its own shape, and a board scored against invented data
      // proves nothing about the real one.
      properties: {
        secretType: 'debt', magnitude: 0.6, discoveredTick: 40,
        source: 'observation', revealed: false,
      },
    });

    const decision = resolveBinding(request({ mintRole: 'sailor' }), ctxFor(graph));

    // Hostility counts: a grudge is a reason for a scene, which is the whole point of
    // reading magnitude rather than sign.
    expect(decision.mode).toBe('reuse');
    if (decision.mode === 'reuse') expect(decision.nodeId).toBe('sailor-3');
  });

  it('offers modify for a roleless local — the born-later population joins the pool', () => {
    const graph = world();
    // No npcRole at all: invisible to today's first-match reuse scan by construction.
    addPerson(graph, 'actor-nameless', {});

    const decision = resolveBinding(request({ mintRole: 'archmage' }), ctxFor(graph));

    expect(decision.mode).toBe('modify');
    if (decision.mode === 'modify') {
      expect(decision.nodeId).toBe('actor-nameless');
      expect(decision.modifications).toContainEqual({ kind: 'set_npc_role', role: 'archmage' });
    }
  });

  it('fills a blank identity by modify, and never overwrites a stated one', () => {
    const graph = world();
    addPerson(graph, 'actor-blank', { npcRole: 'archmage' });

    const decision = resolveBinding(
      request({
        mintRole: 'archmage',
        identityRequirement: { axis: 'asceticism_extravagance', pole: 'virtue', minStrength: 0.2 },
      }),
      ctxFor(graph),
    );

    expect(decision.mode).toBe('modify');
    if (decision.mode === 'modify') {
      expect(decision.modifications).toContainEqual({
        kind: 'set_identity_axis', axis: 'asceticism_extravagance', signedValue: 1,
      });
    }
  });

  it('vetoes a contradicting identity outright — the greedy mage is not reforged', () => {
    const graph = world();
    // Stated, and pointing the other way. Modify is additive-only, so BOTH the as-is
    // and the modified row must be excluded and the mint must win by absence.
    addPerson(graph, 'actor-extravagant', {
      npcRole: 'archmage',
      axiologicalProfile: { asceticism_extravagance: -0.8 },
    });

    const decision = resolveBinding(
      request({
        mintRole: 'archmage',
        identityRequirement: { axis: 'asceticism_extravagance', pole: 'virtue', minStrength: 0.2 },
      }),
      ctxFor(graph),
    );

    expect(decision.mode).toBe('mint');

    const rows = decisionTraces()[0].rows;
    const contradictingRows = rows.filter(r => r.nodeId === 'actor-extravagant');
    expect(contradictingRows.length).toBeGreaterThan(0);
    expect(contradictingRows.every(r => r.vetoed === 'identity_contradiction')).toBe(true);
  });

  it('reuses a matching stated identity rather than minting', () => {
    const graph = world();
    addPerson(graph, 'actor-ascetic', {
      npcRole: 'archmage',
      axiologicalProfile: { asceticism_extravagance: 0.8 },
    });

    const decision = resolveBinding(
      request({
        mintRole: 'archmage',
        identityRequirement: { axis: 'asceticism_extravagance', pole: 'virtue', minStrength: 0.2 },
      }),
      ctxFor(graph),
    );

    expect(decision.mode).toBe('reuse');
  });

  it('never casts the undertaking\'s own actor as their supporting cast', () => {
    const graph = world();
    // Give the hero the very role being sought, standing on the stage.
    graph.updateNode('actor-hero', {
      properties: { actorType: 'individual', npcRole: 'innkeeper' },
    });

    const decision = resolveBinding(request(), ctxFor(graph));

    expect(decision.mode).toBe('mint');
    expect(decisionTraces()[0].rows.some(r => r.nodeId === 'actor-hero')).toBe(false);
  });

  it('excludes the dead from the board', () => {
    const graph = world();
    addPerson(graph, 'actor-ghost', { npcRole: 'innkeeper', deceased: true });

    const decision = resolveBinding(request(), ctxFor(graph));

    expect(decision.mode).toBe('mint');
    expect(decisionTraces()[0].rows.some(r => r.nodeId === 'actor-ghost')).toBe(false);
  });

  it('refuses — traced — when there are no candidates and no mint row', () => {
    const graph = world();
    const decision = resolveBinding(request(), { ...ctxFor(graph), mintAvailable: false });

    expect(decision.mode).toBe('refused');
    if (decision.mode === 'refused') expect(decision.reason).toBe('no_candidates');

    // Emitted on refusal too — a slot that bound nothing is exactly what a reader needs.
    const traces = decisionTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0].mode).toBe('refused');
    expect(traces[0].refusedReason).toBe('no_candidates');
  });

  it('is deterministic — the same world decides the same way, with no rng', () => {
    const build = (): WorldGraph => {
      const graph = world();
      for (let i = 0; i < 4; i++) addPerson(graph, `cand-${i}`, { npcRole: 'innkeeper' });
      return graph;
    };
    const a = resolveBinding(request(), ctxFor(build()));
    const b = resolveBinding(request(), ctxFor(build()));
    expect(a).toEqual(b);
  });

  it('traces every slot with the five-term breakdown a reader needs', () => {
    const graph = world();
    addPerson(graph, 'actor-inn', { npcRole: 'innkeeper' });
    resolveBinding(request(), ctxFor(graph));

    const trace = decisionTraces()[0];
    expect(trace.projectId).toBe('proj-1');
    expect(trace.castKey).toBe('$broker');
    expect(trace.rowsConsidered).toBeGreaterThan(0);
    const row = trace.rows.find(r => r.nodeId === 'actor-inn');
    expect(row).toBeDefined();
    for (const term of ['castRoleFit', 'scarcity', 'storyTies', 'distance', 'identity'] as const) {
      expect(typeof row![term]).toBe('number');
    }
  });

  it('prefers cast already bound at an earlier step — continuity beats novelty', () => {
    const graph = world();
    addPerson(graph, 'actor-a', { npcRole: 'innkeeper' });
    addPerson(graph, 'actor-b', { npcRole: 'innkeeper' });

    // Falsify it first: with no carry-forward the tie breaks on id sort, so 'actor-a'
    // wins. If the carry-forward arm also produced 'actor-a', the assertion would be
    // passing for the wrong reason.
    const without = resolveBinding(request(), ctxFor(graph));
    expect(without.mode === 'reuse' && without.nodeId).toBe('actor-a');

    const withCarry = resolveBinding(
      request({ carryForward: new Set(['actor-b']) }),
      ctxFor(graph),
    );
    expect(withCarry.mode === 'reuse' && withCarry.nodeId).toBe('actor-b');
  });
});
