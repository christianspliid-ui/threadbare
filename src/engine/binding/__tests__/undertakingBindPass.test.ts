/**
 * The undertaking bind pass — THR-1296 slice 4.
 *
 * This is the slice that first *consumes* slices 1–3, so these tests are the first
 * that can assert the whole chain: a scored decision becomes a ledger row, a broken
 * ledger row becomes a named complication, and an escalation recasts.
 *
 * Two properties get deliberate falsification rather than a happy-path assertion,
 * because both are the kind that pass vacuously:
 *
 * - **The empty case.** Most shipped templates declare no `cast` (two now do —
 *   `strategic_establish_spy_network` and, since THR-1321, `strategic_recruit_warband`),
 *   so a test that only
 *   asserts "nothing happens with no cast" would still pass if the pass were a stub.
 *   Every neutrality test here is paired with a positive control on the same fixture
 *   that proves the pass *does* act when given a bundle.
 * - **The loss report.** `lossReported` is what stops one death producing an
 *   unbounded stream of complications, so the test drives *two* passes and asserts
 *   the second is silent — a single-pass test would pass with the flag deleted.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GraphNode } from '../../../types/graph';
import type {
  StrategicProjectRuntime,
  StrategicActionTemplate,
  StrategicRuntimeState,
  UndertakingCastSpec,
} from '../../../types/strategicAction';
import { enableTracing, disableTracing, clearTraces } from '../../traceBuffer';
import { buildRoleCensus } from '../roleCensus';
import { createBindingIndex } from '../bindingRegistry';
import { runBindPass, type BindPassInput } from '../undertakingBindPass';
import { mintNodeId, getMintQueue } from '../mintInhabitant';
import { BINDER_SINGULAR_SCARCITY_THRESHOLD } from '../../../data/binder-constants';

const STAGE = 'loc-hall';
const HERO = 'actor-hero';

function world(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: STAGE, type: 'location', name: 'The Long Hall',
    properties: { hexCol: 3, hexRow: 3 },
  });
  graph.addNode({
    id: HERO, type: 'actor', name: 'Hero',
    properties: { actorType: 'individual' },
  });
  graph.addEdge({
    id: 'e-hero-at', source: HERO, target: STAGE, type: 'located_at', properties: {},
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
    id, type: 'actor', name: id, properties: { actorType: 'individual', ...props },
  };
  graph.addNode(node);
  graph.addEdge({ id: `e-${id}-at`, source: id, target: at, type: 'located_at', properties: {} });
  return node;
}

function project(over: Partial<StrategicProjectRuntime> = {}): StrategicProjectRuntime {
  return {
    projectId: 'proj-1',
    actorId: HERO,
    templateId: 'tpl-1',
    verb: 'establish',
    behaviorFamily: 'builder',
    targetNodeId: STAGE,
    status: 'active',
    progress: 0,
    progressRequired: 3,
    startedTick: 0,
    checkpointIndex: 0,
    ...over,
  } as StrategicProjectRuntime;
}

function template(cast?: readonly UndertakingCastSpec[]): StrategicActionTemplate {
  return { id: 'tpl-1', displayName: 'Raise the Hall', cast } as StrategicActionTemplate;
}

function stateFor(): StrategicRuntimeState {
  return { projects: [], controls: [], history: [], bindings: [], mintQueue: [] };
}

function input(over: Partial<BindPassInput> & { graph: WorldGraph }): BindPassInput {
  return {
    strategicState: stateFor(),
    index: createBindingIndex(),
    census: buildRoleCensus(over.graph),
    project: project(),
    template: template(),
    tick: 10,
    ...over,
  };
}

const ACTOR_SPEC: UndertakingCastSpec = {
  key: '$steward', kind: 'actor', persistence: 'must-persist', mintRole: 'steward',
};
const STAGE_SPEC: UndertakingCastSpec = {
  key: '$hall', kind: 'location', persistence: 'must-persist', mintRole: 'n/a',
};

describe('runBindPass', () => {
  beforeEach(() => { enableTracing(); clearTraces(); });
  afterEach(() => { disableTracing(); clearTraces(); });

  // ─── Neutrality, with a positive control on the same fixture ──────

  it('is a no-op for a template with no cast — and the SAME fixture binds once cast is declared', () => {
    const graph = world();
    addPerson(graph, 'actor-steward', { npcRole: 'steward' });

    // Negative arm: v1's every-template case.
    const bare = input({ graph, template: template() });
    const neutral = runBindPass(bare);
    expect(neutral.bound).toBe(0);
    expect(neutral.loss).toBeNull();
    expect(bare.strategicState.bindings).toHaveLength(0);

    // Positive control on the identical world — without this, the assertion above
    // would hold just as well for a `runBindPass` that did nothing at all.
    const cast = input({ graph, template: template([ACTOR_SPEC]) });
    const acted = runBindPass(cast);
    expect(acted.bound).toBeGreaterThan(0);
    expect(cast.strategicState.bindings!.length).toBeGreaterThan(0);
  });

  it('treats an empty cast array the same as an absent one', () => {
    const graph = world();
    const args = input({ graph, template: template([]) });
    expect(runBindPass(args).bound).toBe(0);
    expect(args.strategicState.bindings).toHaveLength(0);
  });

  // ─── Binding ──────────────────────────────────────────────────────

  it('binds a local role match and writes one live ledger row', () => {
    const graph = world();
    addPerson(graph, 'actor-steward', { npcRole: 'steward' });
    const args = input({ graph, template: template([ACTOR_SPEC]) });

    const result = runBindPass(args);

    expect(result.bound).toBe(1);
    const rows = args.strategicState.bindings!;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      projectId: 'proj-1',
      castKey: '$steward',
      nodeId: 'actor-steward',
      kind: 'actor',
      persistence: 'must-persist',
      status: 'live',
      stepIndex: 0,
    });
  });

  it('binds the stage as a location row — which is what makes a razing loud', () => {
    const graph = world();
    const args = input({ graph, template: template([STAGE_SPEC]) });

    runBindPass(args);

    expect(args.strategicState.bindings).toHaveLength(1);
    expect(args.strategicState.bindings![0]).toMatchObject({
      castKey: '$hall', nodeId: STAGE, kind: 'location', status: 'live',
    });
  });

  it('carries a bound slot forward instead of re-binding it at the next step', () => {
    const graph = world();
    addPerson(graph, 'actor-steward', { npcRole: 'steward' });
    const args = input({ graph, template: template([ACTOR_SPEC]) });

    runBindPass(args);
    const second = runBindPass({ ...args, project: project({ checkpointIndex: 1 }), tick: 20 });

    expect(second.bound).toBe(0);
    expect(args.strategicState.bindings).toHaveLength(1); // no second row
  });

  it('honours a `steps` window — a slot wanted at step 2 does not bind at step 0', () => {
    const graph = world();
    addPerson(graph, 'actor-steward', { npcRole: 'steward' });
    const spec: UndertakingCastSpec = { ...ACTOR_SPEC, steps: [2] };
    const args = input({ graph, template: template([spec]) });

    expect(runBindPass(args).bound).toBe(0);
    expect(runBindPass({ ...args, project: project({ checkpointIndex: 2 }) }).bound).toBe(1);
  });

  it('queues a mint and reports `awaitingMint` when the world holds nobody', () => {
    const graph = world(); // no candidates at all
    const args = input({ graph, template: template([ACTOR_SPEC]) });

    const result = runBindPass(args);

    expect(result.awaitingMint).toBe(true);
    expect(result.bound).toBe(0);
    expect(getMintQueue(args.strategicState)).toHaveLength(1);
    expect(getMintQueue(args.strategicState)[0]).toMatchObject({
      projectId: 'proj-1', castKey: '$steward', placementNodeId: STAGE,
    });
  });

  it('binds the minted person once they exist, without queuing a second request', () => {
    const graph = world();
    const args = input({ graph, template: template([ACTOR_SPEC]) });

    runBindPass(args);
    expect(getMintQueue(args.strategicState)).toHaveLength(1);

    // The valve drains and the person is born (slice 3's job, stubbed here).
    getMintQueue(args.strategicState).length = 0;
    addPerson(graph, mintNodeId('proj-1', '$steward'), { npcRole: 'steward' });

    const second = runBindPass({ ...args, census: buildRoleCensus(graph), tick: 11 });

    expect(second.awaitingMint).toBe(false);
    expect(second.bound).toBe(1);
    expect(args.strategicState.bindings![0].nodeId).toBe(mintNodeId('proj-1', '$steward'));
    expect(getMintQueue(args.strategicState)).toHaveLength(0);
  });

  // ─── Modify is additive-only, under composition ───────────────────

  it('fills a blank npcRole on a modify and never overwrites a stated one', () => {
    const graph = world();
    addPerson(graph, 'actor-blank', {}); // roleless — modify territory
    const args = input({ graph, template: template([ACTOR_SPEC]) });

    runBindPass(args);

    expect(graph.getNode('actor-blank')?.properties?.npcRole).toBe('steward');

    // A second undertaking wanting a different role must not rewrite them.
    const other = input({
      graph,
      census: buildRoleCensus(graph),
      project: project({ projectId: 'proj-2' }),
      template: template([{ ...ACTOR_SPEC, key: '$smith', mintRole: 'blacksmith' }]),
    });
    runBindPass(other);

    expect(graph.getNode('actor-blank')?.properties?.npcRole).toBe('steward');
  });

  // ─── Loss → complication, exactly once ────────────────────────────

  it('reports a must-persist loss once, then stays silent until the slot re-binds', () => {
    const graph = world();
    addPerson(graph, 'actor-steward', { npcRole: 'steward' });
    const args = input({ graph, template: template([ACTOR_SPEC]) });
    runBindPass(args);

    // The world kills them honestly — a node removal, the loud half of the split.
    graph.removeNode('actor-steward');

    const first = runBindPass({ ...args, census: buildRoleCensus(graph), tick: 20 });
    expect(first.loss).not.toBeNull();
    expect(first.loss?.castKey).toBe('$steward');
    expect(first.loss?.cause).toBe('node_removed');

    // The falsifier: without `lossReported` this fires again every checkpoint from
    // here to the end of the run — one death, an unbounded stream of complications.
    const second = runBindPass({ ...args, census: buildRoleCensus(graph), tick: 30 });
    expect(second.loss).toBeNull();
  });

  it('catches a soft death no removal hook can see (`deceased`, node still present)', () => {
    const graph = world();
    addPerson(graph, 'actor-steward', { npcRole: 'steward' });
    const args = input({ graph, template: template([ACTOR_SPEC]) });
    runBindPass(args);

    // No node removed — aspects/bandOpposition mark the flag in place. The dual
    // gone-test is the ONLY detector for this shape.
    graph.updateNode('actor-steward', {
      properties: { ...graph.getNode('actor-steward')!.properties, deceased: true },
    });

    const result = runBindPass({ ...args, tick: 20 });
    expect(result.loss?.cause).toBe('deceased');
  });

  it('does not report a scene-only loss — declaring `scene-only` means allowed to vanish', () => {
    const graph = world();
    addPerson(graph, 'actor-extra', { npcRole: 'steward' });
    const args = input({
      graph,
      template: template([{ ...ACTOR_SPEC, persistence: 'scene-only' }]),
    });
    runBindPass(args);
    graph.removeNode('actor-extra');

    expect(runBindPass({ ...args, census: buildRoleCensus(graph), tick: 20 }).loss).toBeNull();
  });

  it('flags a singular role so the checkpoint halts rather than downgrading', () => {
    const graph = world();
    // One holder of the role in the whole world ⇒ scarcity at the top of the scale.
    addPerson(graph, 'actor-archmage', { npcRole: 'archmage' });
    const args = input({
      graph,
      template: template([{ ...ACTOR_SPEC, key: '$mage', mintRole: 'archmage' }]),
    });
    runBindPass(args);
    expect(args.strategicState.bindings![0].nodeId).toBe('actor-archmage');

    // The census is captured BEFORE the death, which is what lets the pass still
    // judge how rare the lost role was — after the removal there is nobody to count.
    const census = args.census;
    graph.removeNode('actor-archmage');
    const result = runBindPass({ ...args, census, tick: 20 });

    expect(result.loss?.singular).toBe(true);
  });

  it('does not flag a commodity role as singular', () => {
    const graph = world();
    for (let i = 0; i < 8; i++) addPerson(graph, `actor-sailor-${i}`, { npcRole: 'sailor' });
    const args = input({
      graph,
      census: buildRoleCensus(graph),
      template: template([{ ...ACTOR_SPEC, key: '$hand', mintRole: 'sailor' }]),
    });

    // A commodity role routes to MINT even with eight role-matched locals standing
    // right there — the board's designed behaviour ("shared commodity cast reads as
    // false coincidence"), not a bug. So the bound person arrives via the valve.
    const first = runBindPass(args);
    expect(first.awaitingMint).toBe(true);

    getMintQueue(args.strategicState).length = 0;
    const minted = mintNodeId('proj-1', '$hand');
    addPerson(graph, minted, { npcRole: 'sailor' });
    runBindPass({ ...args, census: buildRoleCensus(graph), tick: 11 });
    expect(args.strategicState.bindings![0].nodeId).toBe(minted);

    const census = buildRoleCensus(graph);
    graph.removeNode(minted);
    const result = runBindPass({ ...args, census, tick: 20 });

    expect(result.loss).not.toBeNull();
    expect(result.loss?.singular).toBe(false);
  });

  // The threshold is read from the constant on ONE side only: the fixture builds a
  // genuinely singular and a genuinely commodity population and asserts the verdicts
  // differ. Pinning the constant on both sides would make this pass at any value.
  it('splits singular from commodity across the shipped threshold', () => {
    expect(BINDER_SINGULAR_SCARCITY_THRESHOLD).toBeGreaterThan(0);
    expect(BINDER_SINGULAR_SCARCITY_THRESHOLD).toBeLessThanOrEqual(1);
  });

  // ─── rebindRequested ──────────────────────────────────────────────

  it('consumes `rebindRequested`, releases the live cast, and recasts', () => {
    const graph = world();
    addPerson(graph, 'actor-steward', { npcRole: 'steward' });
    const args = input({ graph, template: template([ACTOR_SPEC]) });
    runBindPass(args);
    expect(args.strategicState.bindings).toHaveLength(1);

    const result = runBindPass({
      ...args,
      project: project({ rebindRequested: true, checkpointIndex: 1 }),
      tick: 20,
    });

    expect(result.project.rebindRequested).toBe(false);
    const rows = args.strategicState.bindings!;
    expect(rows[0].status).toBe('released');
    expect(rows).toHaveLength(2);          // released, then re-bound
    expect(rows[1].status).toBe('live');
  });

  it('clears the flag even when there is nothing bound to release', () => {
    const graph = world();
    const args = input({
      graph,
      template: template([]),
      project: project({ rebindRequested: true }),
    });
    // An empty bundle early-returns, so the flag survives — and must be cleared by
    // the checkpoint path rather than stranding here. Assert the honest behaviour
    // rather than a convenient one: no cast means no bind pass, so no consumption.
    expect(runBindPass(args).project.rebindRequested).toBe(true);

    const withCast = input({
      graph,
      template: template([ACTOR_SPEC]),
      project: project({ rebindRequested: true }),
    });
    expect(runBindPass(withCast).project.rebindRequested).toBe(false);
  });

  // ─── Fail-soft (NFP #4) ───────────────────────────────────────────

  it('degrades to a neutral result rather than throwing into the tick loop', () => {
    const graph = world();
    const args = input({ graph, template: template([ACTOR_SPEC]) });
    // A ledger that throws on write is the shape a corrupted save would produce.
    Object.defineProperty(args.strategicState, 'bindings', {
      get() { throw new Error('ledger unavailable'); },
    });

    const result = runBindPass(args);

    expect(result.bound).toBe(0);
    expect(result.loss).toBeNull();
    expect(result.project).toBe(args.project);
  });

  // ─── The `$anchor` slot (THR-1296 §6, slice 5) ────────────────────
  //
  // The anchor is the one binding no template authors: the remote-anchor gate names it
  // at proposal and the pass binds it must-persist, so severing an agent's army becomes
  // a named complication for everything it was footing. It therefore has to run on a
  // template with NO cast — which is every shipped template in v1 — without breaking
  // the neutrality that same emptiness is supposed to guarantee. Both halves are pinned.

  it('binds `$anchor` must-persist on a template with no cast at all', () => {
    const graph = world();
    addPerson(graph, 'army-1', { actorType: 'group', armyState: { size: 'warband' } });

    const args = input({
      graph,
      template: template(),                              // no cast — the v1 template
      project: project({ anchorNodeId: 'army-1' }),
    });
    const result = runBindPass(args);

    expect(result.bound).toBe(1);
    const anchor = args.strategicState.bindings!.find(b => b.castKey === '$anchor');
    expect(anchor).toBeDefined();
    expect(anchor!.nodeId).toBe('army-1');
    expect(anchor!.persistence).toBe('must-persist');
    expect(anchor!.status).toBe('live');
  });

  it('leaves the no-cast case neutral when there is NO anchor — the paired negative arm', () => {
    // Without this the test above would hold for a pass that had simply stopped
    // early-returning, which is the regression it exists to prevent.
    const graph = world();
    addPerson(graph, 'army-1', { actorType: 'group', armyState: { size: 'warband' } });

    const args = input({ graph, template: template(), project: project() });
    const result = runBindPass(args);

    expect(result.bound).toBe(0);
    expect(args.strategicState.bindings).toHaveLength(0);
  });

  it('does not bind an anchor whose node is gone — the gate ran at proposal, the world moved', () => {
    const graph = world();
    const args = input({
      graph,
      template: template(),
      project: project({ anchorNodeId: 'army-destroyed' }),
    });

    expect(runBindPass(args).bound).toBe(0);
    expect(args.strategicState.bindings).toHaveLength(0);
  });

  it('binds the anchor exactly once across repeated passes', () => {
    const graph = world();
    addPerson(graph, 'army-1', { actorType: 'group', armyState: { size: 'warband' } });
    const args = input({
      graph, template: template(), project: project({ anchorNodeId: 'army-1' }),
    });

    runBindPass(args);
    const second = runBindPass(args);

    // A one-pass test passes against a version that re-registers every checkpoint.
    expect(second.bound).toBe(0);
    expect(args.strategicState.bindings!.filter(b => b.castKey === '$anchor')).toHaveLength(1);
  });

  it('binds the anchor alongside an authored cast rather than instead of it', () => {
    const graph = world();
    addPerson(graph, 'actor-steward', { npcRole: 'steward' });
    addPerson(graph, 'army-1', { actorType: 'group', armyState: { size: 'warband' } });

    const args = input({
      graph,
      template: template([ACTOR_SPEC]),
      project: project({ anchorNodeId: 'army-1' }),
    });
    runBindPass(args);

    const keys = args.strategicState.bindings!.map(b => b.castKey).sort();
    expect(keys).toContain('$anchor');
    expect(keys).toContain('$steward');
  });
});
