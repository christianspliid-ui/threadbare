/**
 * The debug tools reach the scored board — THR-1305.
 *
 * Slice 6 (THR-1296) shipped the `useScoredBinder` opt-in but wired only the live
 * decision path. `debugEncounterTools` supplied no binder context at either of its call
 * sites, so `?spawn=`, `?forceencounters` and the CLI cast a migrated template through
 * the *legacy* first-role-match resolver and wrote no ledger row — meaning content
 * review of a migrated encounter reviewed a different casting than players get.
 *
 * Three claims are worth testing, and each is paired with its control arm, because a
 * "the row is there" assertion passes trivially against a route that always ran:
 *
 *  1. The assembler refuses to build a context this session cannot ledger with. The
 *     `strategicState` arm is the load-bearing one — see its test.
 *  2. A binder supplied to the debug tools reaches the board (ledger row appears), and
 *     omitting it still resolves (fail-soft, no row).
 *  3. The tool stamps the *resolved* agent id on the context, not the caller's query.
 */
import { describe, expect, it } from 'vitest';
import type { GameState } from '../../../types/gameState';
import { WorldGraph } from '../../graph';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import { prepareDebugEncounterContext, prepareDebugEncounterSpawn } from '../../debugEncounterTools';
import { buildEncounterBinderContext } from '../encounterBinderContext';
import { createSimulationRuntime } from '../../simulationRuntime';

const EXEMPLAR = 'encounter.border.one_body_short';

// ─── Fixtures ───────────────────────────────────────────────────────

function makeState(graph: WorldGraph, withStrategicState = true): GameState {
  return {
    tick: 9,
    cycle: 0,
    seed: 77,
    graph,
    phase: 'playing',
    cosmology: { reachDomains: [], spheres: [] },
    tiles: [],
    clock: { dayOfCycle: 0, ticksOfDay: 0 },
    ascendantId: 'asc_1',
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map(),
    familiarityMap: new Map(),
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    clearanceGateStates: new Map(),
    echoDefinitions: [],
    echoStates: [],
    ...(withStrategicState ? { strategicState: { projects: [], controls: [], history: [], bindings: [] } } : {}),
  } as unknown as GameState;
}

/**
 * A settlement, an ascendant, and a spotlight agent standing in it.
 *
 * `extraLocals` are additional role-matching bodies — the candidates the board can reuse
 * instead of minting. Supplying none is what makes the self-cast test in group 3 sharp:
 * the only role-matching individual at the stage is then the agent themselves.
 */
function makeWorld(
  agentRole: string,
  extraLocals: ReadonlyArray<{ id: string; role: string }> = [],
): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'asc_1', type: 'actor', name: 'The Ascendant',
    properties: { actorType: 'ascendant' },
  });
  graph.addNode({
    id: 'loc_town', type: 'location', name: 'Marrowford',
    properties: { locationSubtype: 'town', hexCol: 3, hexRow: 4 },
  });
  graph.addNode({
    id: 'agent_1', type: 'actor', name: 'Recruit',
    properties: {
      actorType: 'individual', spotlightTier: 'spotlight',
      npcRole: agentRole, importance: 0, sphereAffinity: null,
    },
  });
  graph.addEdge({
    id: 'agent_1_at_town', source: 'agent_1', target: 'loc_town',
    type: 'located_at', properties: {},
  });
  for (const local of extraLocals) {
    graph.addNode({
      id: local.id, type: 'actor', name: local.id,
      properties: {
        actorType: 'individual', spotlightTier: 'ambient',
        npcRole: local.role, importance: 0, sphereAffinity: null,
      },
    });
    graph.addEdge({
      id: `${local.id}_at_town`, source: local.id, target: 'loc_town',
      type: 'located_at', properties: {},
    });
  }
  return graph;
}

function ledgerOf(state: GameState) {
  return state.strategicState?.bindings ?? [];
}

// ─── 1. The assembler's guard ───────────────────────────────────────

describe('buildEncounterBinderContext', () => {
  it('returns undefined when there is no runtime', () => {
    const state = makeState(makeWorld('scout'));
    expect(buildEncounterBinderContext(null, state)).toBeUndefined();
    expect(buildEncounterBinderContext(undefined, state)).toBeUndefined();
  });

  it('returns undefined when the state has no strategicState', () => {
    // The load-bearing arm. `getBindings` tolerates an absent strategic state by
    // returning `[]`, so an assembler that skipped this check would still produce a
    // well-typed context — one whose ledger is a fresh local array that nothing owns.
    // Rows would be written to it and dropped on return, while the call reported a
    // successful bind. Refusing to build the context routes to the legacy path instead.
    const state = makeState(makeWorld('scout'), false);
    expect(state.strategicState).toBeUndefined();
    expect(buildEncounterBinderContext(createSimulationRuntime(), state)).toBeUndefined();
  });

  it('wires the context to the runtime index and the state ledger, by identity', () => {
    const runtime = createSimulationRuntime();
    const state = makeState(makeWorld('scout'));
    const ctx = buildEncounterBinderContext(runtime, state, 'agent_1');

    expect(ctx).toBeDefined();
    expect(ctx!.index).toBe(runtime.bindingIndex);
    // Identity, not equality: a copied array would take the writes and lose them.
    expect(ctx!.bindings).toBe(state.strategicState!.bindings);
    expect(ctx!.actorId).toBe('agent_1');
    expect(ctx!.census).not.toBeNull();
  });
});

// ─── 2. The binder reaches the debug tools ──────────────────────────

describe('prepareDebugEncounterSpawn routes through the board when given a binder', () => {
  it('registers the exemplar\'s must-persist binding in the ledger', () => {
    // Reads the shipped template out of the registry rather than building a synthetic
    // one — the only arm that fails if the exemplar migration is reverted.
    const template = getUnifiedTemplateById(EXEMPLAR);
    expect(template?.useScoredBinder).toBe(true);

    const runtime = createSimulationRuntime();
    const state = makeState(makeWorld('ranger', [{ id: 'npc_scout', role: 'scout' }]));

    const result = prepareDebugEncounterSpawn(state, 'Recruit', EXEMPLAR, {
      binder: buildEncounterBinderContext(runtime, state),
    });

    expect(result.success).toBe(true);
    expect(result.unifiedAction?.supportBindings?.map(b => b.key)).toContain('survivor');

    const row = ledgerOf(state).find(b => b.castKey === 'survivor');
    expect(row).toMatchObject({ persistence: 'must-persist', status: 'live' });
    expect(row!.projectId.startsWith('enc_')).toBe(true);
  });

  it('still resolves, and writes no ledger row, when no binder is supplied', () => {
    // The control arm. Without it the test above passes trivially against a route that
    // always ran — and this is also the fail-soft contract (NFP #4): the debug tools
    // must keep working in a session that has no runtime to offer.
    const state = makeState(makeWorld('ranger', [{ id: 'npc_scout', role: 'scout' }]));

    const result = prepareDebugEncounterSpawn(state, 'Recruit', EXEMPLAR);

    expect(result.success).toBe(true);
    expect(result.unifiedAction?.supportBindings?.map(b => b.key)).toContain('survivor');
    expect(ledgerOf(state)).toHaveLength(0);
  });
});

describe('prepareDebugEncounterContext routes through the board when given a binder', () => {
  it('registers the must-persist binding, and writes none without a binder', () => {
    const runtime = createSimulationRuntime();

    const bound = makeState(makeWorld('ranger', [{ id: 'npc_scout', role: 'scout' }]));
    const withBinder = prepareDebugEncounterContext(bound, EXEMPLAR, {
      locationQuery: 'loc_town',
      binder: buildEncounterBinderContext(runtime, bound),
    });
    expect(withBinder.success).toBe(true);
    expect(ledgerOf(bound).some(b => b.castKey === 'survivor')).toBe(true);

    // Its own world: sharing one would let the first arm's materialized survivor be
    // reused by the second, which changes what the second arm is measuring.
    const unbound = makeState(makeWorld('ranger', [{ id: 'npc_scout', role: 'scout' }]));
    const noBinder = prepareDebugEncounterContext(unbound, EXEMPLAR, {
      locationQuery: 'loc_town',
    });
    expect(noBinder.success).toBe(true);
    expect(ledgerOf(unbound)).toHaveLength(0);
  });
});

// ─── 3. The resolved id, not the caller's query ─────────────────────

describe('the spawn stamps the resolved agent id on the binder context', () => {
  it('never casts the spawning agent as their own support', () => {
    // The caller holds a *query* ('@hero', a partial name), not a node id, so the tool
    // resolves it and stamps `agent.id`. Passing the query through instead would be
    // silently wrong rather than an error: `binder.ts` skips the candidate whose node id
    // equals `request.actorId`, so a query string matches nobody and the self-exclusion
    // stops working.
    //
    // This world gives the board exactly one role-matching individual at the stage — the
    // agent themselves. Correctly stamped, they are excluded and the spec materializes
    // somebody new; stamped with the query, they would be the top candidate and get cast
    // as their own fellow survivor.
    const runtime = createSimulationRuntime();
    const state = makeState(makeWorld('scout'));

    const result = prepareDebugEncounterSpawn(state, 'Recruit', EXEMPLAR, {
      binder: buildEncounterBinderContext(runtime, state),
    });

    expect(result.success).toBe(true);
    expect(result.agent?.id).toBe('agent_1');
    const survivor = result.unifiedAction?.supportBindings?.find(b => b.key === 'survivor');
    expect(survivor).toBeDefined();
    expect(survivor!.nodeId).not.toBe('agent_1');
  });
});
