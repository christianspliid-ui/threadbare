/**
 * Binding registry + removeNode hook — THR-1296 slice 1.
 *
 * The thing under test is *loudness*: before this, `persistence` was written 60+ times
 * in the shipped corpus and read by zero consumers, so a reaper could take a
 * must-persist cast member in total silence. Each test below therefore asserts on the
 * severance being **observed**, not merely on a boolean flipping.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GraphNode } from '../../../types/graph';
import type { UndertakingBindingRecord } from '../../../types/strategicAction';
import type { BindingSeveredTrace } from '../../../types/trace';
import { enableTracing, disableTracing, clearTraces, getTraces } from '../../traceBuffer';
import {
  createBindingIndex,
  registerBinding,
  isNodeBound,
  markBindingsBroken,
  validateBindings,
  releaseBindingsForProject,
  installBindingRemovalHook,
  makeDissolutionHold,
} from '../bindingRegistry';

function actor(id: string, props: Record<string, unknown> = {}): GraphNode {
  return { id, type: 'actor', name: id, properties: { actorType: 'individual', ...props } };
}

function record(over: Partial<UndertakingBindingRecord> = {}): UndertakingBindingRecord {
  return {
    projectId: 'proj-1',
    castKey: '$rival',
    nodeId: 'actor-1',
    kind: 'actor',
    persistence: 'must-persist',
    boundAtTick: 10,
    stepIndex: 0,
    status: 'live',
    ...over,
  };
}

function severedTraces(): BindingSeveredTrace[] {
  return getTraces().filter(t => t.category === 'binding_severed') as BindingSeveredTrace[];
}

describe('binding registry', () => {
  let graph: WorldGraph;

  beforeEach(() => {
    graph = new WorldGraph();
    enableTracing();
    clearTraces();
  });

  afterEach(() => {
    disableTracing();
    clearTraces();
  });

  it('reports a live binding as bound and an unbound node as not', () => {
    const index = createBindingIndex();
    const bindings: UndertakingBindingRecord[] = [];
    registerBinding(index, bindings, record({ nodeId: 'actor-1' }));

    // Both arms, so the predicate is falsifiable rather than a constant `true`.
    expect(isNodeBound(index, bindings, 'actor-1')).toBe(true);
    expect(isNodeBound(index, bindings, 'actor-2')).toBe(false);
  });

  it('stops reporting bound once the record is broken or released — history is not a hold', () => {
    const index = createBindingIndex();
    const bindings: UndertakingBindingRecord[] = [];
    registerBinding(index, bindings, record({ nodeId: 'actor-1' }));
    registerBinding(index, bindings, record({ nodeId: 'actor-2', castKey: '$patron' }));

    markBindingsBroken(index, bindings, 'actor-1', 'severed', 12);
    releaseBindingsForProject(bindings, 'proj-1', 13);

    // A node whose binding is over must be reapable again, or the ledger makes the
    // world immortal one dead record at a time (THR-1286).
    expect(isNodeBound(index, bindings, 'actor-1')).toBe(false);
    expect(isNodeBound(index, bindings, 'actor-2')).toBe(false);
  });

  it('marks broken and traces the severance, naming the cause and persistence', () => {
    const index = createBindingIndex();
    const bindings: UndertakingBindingRecord[] = [];
    registerBinding(index, bindings, record({ nodeId: 'actor-1' }));

    const affected = markBindingsBroken(index, bindings, 'actor-1', 'deceased', 42);

    expect(affected).toHaveLength(1);
    expect(bindings[0].status).toBe('broken');
    expect(bindings[0].brokenCause).toBe('deceased');
    expect(bindings[0].endedAtTick).toBe(42);

    const traces = severedTraces();
    expect(traces).toHaveLength(1);
    expect(traces[0].cause).toBe('deceased');
    expect(traces[0].nodeId).toBe('actor-1');
    expect(traces[0].castKey).toBe('$rival');
    expect(traces[0].persistence).toBe('must-persist');
  });

  it('is a no-op for an unbound node — removals of unbound nodes must stay free', () => {
    const index = createBindingIndex();
    const bindings: UndertakingBindingRecord[] = [];
    registerBinding(index, bindings, record({ nodeId: 'actor-1' }));

    expect(markBindingsBroken(index, bindings, 'actor-999', 'node_removed', 5)).toHaveLength(0);
    expect(severedTraces()).toHaveLength(0);
  });

  describe('WorldGraph.removeNode hook', () => {
    it('is silent when unset — the default costs nothing and changes nothing', () => {
      graph.addNode(actor('actor-1'));
      expect(() => graph.removeNode('actor-1')).not.toThrow();
      expect(graph.getNode('actor-1')).toBeUndefined();
      expect(severedTraces()).toHaveLength(0);
    });

    it('breaks a binding when ANY reaper removes the node', () => {
      const index = createBindingIndex();
      const bindings: UndertakingBindingRecord[] = [];
      const strategicState = { projects: [], controls: [], history: [], bindings };
      registerBinding(index, bindings, record({ nodeId: 'actor-1' }));

      graph.addNode(actor('actor-1'));
      installBindingRemovalHook(graph, index, () => strategicState, () => 77);

      // No reaper is named here on purpose: the point of hooking the sole funnel is
      // that it covers reapers this test does not know about, including ones not
      // yet written.
      graph.removeNode('actor-1');

      expect(bindings[0].status).toBe('broken');
      expect(bindings[0].brokenCause).toBe('node_removed');
      expect(severedTraces()).toHaveLength(1);
      expect(severedTraces()[0].tick).toBe(77);
    });

    it('does not fire for a node that was not there — a no-op delete is not a severance', () => {
      const index = createBindingIndex();
      const bindings: UndertakingBindingRecord[] = [];
      const strategicState = { projects: [], controls: [], history: [], bindings };
      registerBinding(index, bindings, record({ nodeId: 'ghost' }));
      installBindingRemovalHook(graph, index, () => strategicState, () => 1);

      graph.removeNode('ghost'); // never added

      expect(bindings[0].status).toBe('live');
      expect(severedTraces()).toHaveLength(0);
    });

    it('survives a throwing observer — the tick loop must never crash (NFP #4)', () => {
      graph.addNode(actor('actor-1'));
      graph.onNodeRemoved = () => {
        throw new Error('observer exploded');
      };

      expect(() => graph.removeNode('actor-1')).not.toThrow();
      // And the removal still completed — fail-soft means degraded, not abandoned.
      expect(graph.getNode('actor-1')).toBeUndefined();
    });
  });

  describe('lazy validation — the dual gone-test', () => {
    it('catches a soft death that removes no node, which no hook can see', () => {
      const index = createBindingIndex();
      const bindings: UndertakingBindingRecord[] = [];
      registerBinding(index, bindings, record({ nodeId: 'actor-1' }));

      // `deceased: true` with the node retained is THR-479's mythic echo, and it is
      // precisely what the checkpoint's node-absence-only check waves through.
      graph.addNode(actor('actor-1', { deceased: true }));

      const broken = validateBindings(graph, index, bindings, 30);

      expect(broken).toHaveLength(1);
      expect(bindings[0].status).toBe('broken');
      expect(bindings[0].brokenCause).toBe('deceased');
    });

    it('catches an outright removal when the hook was never installed', () => {
      const index = createBindingIndex();
      const bindings: UndertakingBindingRecord[] = [];
      registerBinding(index, bindings, record({ nodeId: 'actor-1' }));
      // Node never added — stands in for a removal that happened with no hook set.

      validateBindings(graph, index, bindings, 30);

      expect(bindings[0].status).toBe('broken');
      expect(bindings[0].brokenCause).toBe('node_removed');
    });

    it('leaves a living bound actor alone', () => {
      const index = createBindingIndex();
      const bindings: UndertakingBindingRecord[] = [];
      registerBinding(index, bindings, record({ nodeId: 'actor-1' }));
      graph.addNode(actor('actor-1'));

      expect(validateBindings(graph, index, bindings, 30)).toHaveLength(0);
      expect(bindings[0].status).toBe('live');
    });

    it('does not ask a location whether it is deceased — that is a category error', () => {
      const index = createBindingIndex();
      const bindings: UndertakingBindingRecord[] = [];
      registerBinding(index, bindings, record({ nodeId: 'loc-1', kind: 'location' }));
      // A location carrying a stray `deceased` flag must not read as a dead actor.
      graph.addNode({
        id: 'loc-1', type: 'location', name: 'The Sunken Hall',
        properties: { deceased: true },
      });

      expect(validateBindings(graph, index, bindings, 30)).toHaveLength(0);
      expect(bindings[0].status).toBe('live');
    });
  });

  describe('dissolution hold', () => {
    it('holds a bound stage and traces the deferral', () => {
      const index = createBindingIndex();
      const bindings: UndertakingBindingRecord[] = [];
      registerBinding(index, bindings, record({ nodeId: 'sub-1', kind: 'location', castKey: '$stage' }));

      const hold = makeDissolutionHold(index, () => bindings, () => 50);

      expect(hold('sub-1')).toBe(true);
      const traces = severedTraces();
      expect(traces).toHaveLength(1);
      expect(traces[0].cause).toBe('dissolution_deferred');
      expect(traces[0].nodeId).toBe('sub-1');
    });

    it('does not hold an unbound stage, and traces nothing for it', () => {
      const index = createBindingIndex();
      const bindings: UndertakingBindingRecord[] = [];
      registerBinding(index, bindings, record({ nodeId: 'sub-1', kind: 'location' }));

      const hold = makeDissolutionHold(index, () => bindings, () => 50);

      expect(hold('sub-2')).toBe(false);
      expect(severedTraces()).toHaveLength(0);
    });
  });
});
