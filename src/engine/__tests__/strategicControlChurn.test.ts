/**
 * THR-1286 — control claim→decay→re-claim churn.
 *
 * Before this fix a collapsed control stance was re-proposed every tick forever:
 * the dead record stayed in `strategicState.controls` pinning `controlPressure` at its
 * maximum, `claim_control` wrote no history so the recent-duplicate variety guard never
 * saw it, and the stale `controls` edge made every re-claim fail `already_controls`.
 * Measured on seed 42 / medium at tick 150: 811 of 2053 spotlight decisions (39.5%)
 * were `strategic_control`, and they produced 17 successful claims — the rest were
 * decisions spent on a guaranteed no-op.
 *
 * These tests pin the behaviours that close the loop: collapse retires the record and
 * its edge into history, a retired target is refused for the re-claim window, and a
 * target the actor still holds is never proposed.
 *
 * THR-1303 deleted the dedicated `evaluateControlClaimGate` that used to enforce the
 * last two — correctly, because its first line was `template.verb !== 'control'` and no
 * template has carried that verb since the six ambition-driven control templates were
 * retired. THR-1442 measured what survives it, and the last two describe the same
 * behaviours reached through different machinery:
 *
 * - **held targets** — the grid's `control:claim` cell carries ownership rule `unowned`
 *   and the candidate walk skips `control` on anything reading `own`; `claimControl`
 *   writes a `controls` edge and `LOCATION.ownedVia` includes `controls`, so a held
 *   stance reads `own`. Unreachable by construction, not by a gate.
 * - **retired targets** — the generic `recent_duplicate` variety guard matches the
 *   collapse record `retireControl` writes, at
 *   `STRATEGIC_RECENT_DUPLICATE_WINDOW_TICKS`.
 *
 * Both are pinned below so the deletion of either mechanism is a red test rather than a
 * silent return of the churn.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import { advanceStrategicProjects } from '../strategicActionLifecycle';
import { releaseControl } from '../strategicGraphOps';
import { generateStrategicCandidates } from '../strategicActionCandidates';
import {
  STRATEGIC_RECENT_DUPLICATE_WINDOW_TICKS,
  STRATEGIC_HISTORY_WINDOW_TICKS,
} from '../../data/strategic-action-constants';
import type { GameState } from '../../types/gameState';
import type { StrategicControlState, StrategicRuntimeState } from '../../types/strategicAction';
import { mulberry32 } from '../../lib/prng';

const CONTROL_TEMPLATE = 'strategic_maintain_monopoly';

function buildMerchantWorld() {
  const graph = new WorldGraph();

  graph.addNode({
    id: 'merchant_a',
    name: 'Sera Goldvein',
    type: 'actor',
    properties: {
      actorType: 'individual',
      spotlightTier: 'spotlight',
      // Tuned so the control template is reachable at all. `strategic_maintain_monopoly`
      // is the 6th of `ambition_dominate_trade`'s 6 templateIds, and generation stops at
      // STRATEGIC_MAX_CANDIDATES_PER_AMBITION (5) — so with every earlier template
      // eligible it is never reached. These reaches clear the control template's own
      // floor (gold 0.5) while failing the eye/stone/heart floors of survey_market,
      // build_warehouse and found_guild_chapter, leaving cap room for it. That is also
      // how it is reached in a live world: earlier templates get rejected first.
      domainCapabilities: { gold: 0.55, eye: 0.1, heart: 0.1, shadow: 0.15, iron: 0.2, stone: 0.1, star: 0.1, veil: 0.1 },
    },
  });

  // THR-1394: no Location carries `market`, `port` or `trading_post` — the world-object
  // registry rejects them at write time and the packs no longer target them. The
  // fixture uses subtypes the world mints (a capital is the market town).
  graph.addNode({ id: 'loc_market_central', name: 'Central Market', type: 'location', properties: { locationSubtype: 'capital', hexCol: 5, hexRow: 5 } });
  graph.addNode({ id: 'loc_town_east', name: 'Eastwatch', type: 'location', properties: { locationSubtype: 'town', hexCol: 8, hexRow: 5 } });
  graph.addNode({ id: 'loc_city_south', name: 'Southgate', type: 'location', properties: { locationSubtype: 'city', hexCol: 5, hexRow: 9 } });
  graph.addNode({ id: 'loc_port_west', name: 'Harborside', type: 'location', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 5 } });
  graph.addNode({ id: 'loc_trading_post', name: 'Crossroads Post', type: 'location', properties: { locationSubtype: 'city', hexCol: 5, hexRow: 3 } });

  graph.addEdge({ id: 'loc_merchant_a', source: 'merchant_a', target: 'loc_market_central', type: 'located_at', properties: {} });

  graph.addNode({ id: 'amb_trade_node', name: 'Dominate Regional Trade', type: 'event', properties: { templateId: 'ambition_dominate_trade' } });
  graph.addEdge({ id: 'pursues_merchant_a', source: 'merchant_a', target: 'amb_trade_node', type: 'pursues', properties: { status: 'active', priority: 'primary', assignedTick: 1 } });

  return graph;
}

function buildMinimalState(graph: WorldGraph, tick = 10): GameState {
  return {
    cycle: 1, tick, phase: 'playing', seed: 42, graph,
    cosmology: { spheres: {} } as any, tiles: [],
    clock: { currentTick: tick } as any,
    ascendantId: 'ascendant', ascendantIdentity: null,
    essencePool: {} as any, mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as any, doomClock: {} as any,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map() as any, familiarityMap: new Map() as any,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as any, echoDefinitions: [], echoStates: [], chronicle: {} as any,
    // Present so this fixture satisfies GameState outright. The sibling strategic
    // fixtures this one is modelled on omit them and carry a type error apiece; copying
    // that would have imported the error along with the shape.
    doomIdentityMatrix: null, archetypeDrift: [],
    regionalDetectionPressure: [], regionDetection: [],
  };
}

function makeControl(overrides: Partial<StrategicControlState> = {}): StrategicControlState {
  return {
    controlId: 'ctrl_test',
    actorId: 'merchant_a',
    templateId: CONTROL_TEMPLATE,
    ambitionId: 'ambition_dominate_trade',
    targetNodeId: 'loc_market_central',
    verb: 'control',
    behaviorFamily: 'merchant-expansion',
    establishedTick: 1,
    neglectTicks: 11, // past the grace period of 10
    active: true,
    degradation: 0.99, // one degradation step from collapse
    ...overrides,
  };
}

function addStrategicControlEdge(graph: WorldGraph, actorId: string, targetId: string, tick = 1) {
  graph.addEdge({
    id: `controls_${actorId}_${targetId}_${tick}`,
    source: actorId,
    target: targetId,
    type: 'controls',
    properties: { establishedTick: tick, controlType: 'strategic' },
  });
}

function strategicControlEdges(graph: WorldGraph, actorId: string) {
  return graph.getOutgoingEdges(actorId, 'controls')
    .filter(e => e.properties?.controlType === 'strategic');
}

function stateWith(controls: StrategicControlState[], history: StrategicRuntimeState['history'] = []): StrategicRuntimeState {
  return { projects: [], controls, history };
}

describe('THR-1286 — control stance retirement', () => {
  it('retires the record and its edge on collapse, writing the collapse to history', () => {
    const graph = buildMerchantWorld();
    addStrategicControlEdge(graph, 'merchant_a', 'loc_market_central');
    const state = buildMinimalState(graph, 50);
    state.strategicState = stateWith([makeControl()]);

    // Guard: the stance and its edge exist before the tick that collapses it, so a
    // later "zero records" assertion cannot pass vacuously.
    expect(state.strategicState.controls).toHaveLength(1);
    expect(strategicControlEdges(graph, 'merchant_a')).toHaveLength(1);

    const result = advanceStrategicProjects(state, graph, 50, mulberry32(42));

    expect(result.strategicState.controls).toHaveLength(0);
    expect(strategicControlEdges(graph, 'merchant_a')).toHaveLength(0);

    const collapse = result.strategicState.history.filter(h => h.verb === 'control');
    expect(collapse).toHaveLength(1);
    expect(collapse[0]).toMatchObject({
      tick: 50,
      actorId: 'merchant_a',
      targetNodeId: 'loc_market_central',
      outcome: 'failed',
    });
  });

  it('does not collapse a stance that is still inside its grace period', () => {
    const graph = buildMerchantWorld();
    addStrategicControlEdge(graph, 'merchant_a', 'loc_market_central');
    const state = buildMinimalState(graph, 50);
    state.strategicState = stateWith([makeControl({ neglectTicks: 2, degradation: 0 })]);

    const result = advanceStrategicProjects(state, graph, 50, mulberry32(42));

    expect(result.strategicState.controls).toHaveLength(1);
    expect(result.strategicState.controls[0].active).toBe(true);
    expect(strategicControlEdges(graph, 'merchant_a')).toHaveLength(1);
    expect(result.strategicState.history.filter(h => h.verb === 'control')).toHaveLength(0);
  });

  it('drains a dead record carried by a world saved before this fix', () => {
    const graph = buildMerchantWorld();
    addStrategicControlEdge(graph, 'merchant_a', 'loc_market_central');
    const state = buildMinimalState(graph, 50);
    state.strategicState = stateWith([makeControl({ active: false, degradation: 1, neglectTicks: 40 })]);

    const result = advanceStrategicProjects(state, graph, 50, mulberry32(42));

    expect(result.strategicState.controls).toHaveLength(0);
    expect(strategicControlEdges(graph, 'merchant_a')).toHaveLength(0);
  });

  it('retires a stance whose target node was deleted, without waiting out neglect', () => {
    const graph = buildMerchantWorld();
    addStrategicControlEdge(graph, 'merchant_a', 'loc_town_east');
    const state = buildMinimalState(graph, 50);
    // Healthy stance — nowhere near collapse on neglect alone.
    state.strategicState = stateWith([makeControl({
      targetNodeId: 'loc_town_east', neglectTicks: 0, degradation: 0,
    })]);

    graph.removeNode('loc_town_east');

    const result = advanceStrategicProjects(state, graph, 50, mulberry32(42));

    expect(result.strategicState.controls).toHaveLength(0);
    expect(result.strategicState.history.filter(h => h.verb === 'control')).toHaveLength(1);
  });

  it('releaseControl leaves worldgen controls edges alone', () => {
    const graph = buildMerchantWorld();
    // Worldgen mints `controls` edges carrying `influence` and no `controlType` —
    // standing political control, not this pack's business.
    graph.addEdge({
      id: 'edge_controls_worldgen',
      source: 'merchant_a',
      target: 'loc_market_central',
      type: 'controls',
      properties: { influence: 0.7 },
    });
    addStrategicControlEdge(graph, 'merchant_a', 'loc_market_central');

    expect(graph.getOutgoingEdges('merchant_a', 'controls')).toHaveLength(2);

    const result = releaseControl(graph, 'merchant_a', 'loc_market_central');

    expect(result.success).toBe(true);
    const remaining = graph.getOutgoingEdges('merchant_a', 'controls');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('edge_controls_worldgen');
  });

  it('releaseControl is fail-soft when no strategic edge exists', () => {
    const graph = buildMerchantWorld();
    const result = releaseControl(graph, 'merchant_a', 'loc_market_central');
    expect(result.success).toBe(true);
    expect(result.createdId).toBeUndefined();
  });
});

/**
 * THR-1442 — what actually protects the grid's `control:claim` cell now that the
 * dedicated gate is gone. Each test perturbs one arm and shows the behaviour flips, so
 * neither can pass on an empty candidate set.
 *
 * Falsified on the closeout, so the red condition of each is known rather than assumed:
 *
 * | perturbation                                               | result |
 * |------------------------------------------------------------|--------|
 * | neuter the `recentDuplicate` predicate                      | boundary test RED |
 * | `STRATEGIC_RECENT_DUPLICATE_WINDOW_TICKS` 24 → 20           | value pin RED |
 * | drop the `undertakingVerb === 'control' && own` skip alone  | still green |
 * | ...and widen `control:claim` ownership to `any`             | held-target test RED |
 *
 * Two of these are worth keeping in mind when editing:
 *
 * - The boundary test builds its fixture *from* the window constant, so it holds for any
 *   value — retuning 24 → 0 leaves it green. That is why the value has its own pin. A
 *   threshold that sits on both sides of its own comparison tests nothing about the
 *   threshold.
 * - The two Q1 guards are genuinely redundant, and the cell's `unowned` ownership rule is
 *   the load-bearing half. The candidate-walk skip is belt-and-braces for a type that
 *   overrides its ownership rule (`claim × Faction` reads `any`), which is why removing
 *   it alone changes nothing here.
 */
describe('THR-1442 — control churn protection after the gate deletion', () => {
  const ME = 'actor_claimant';
  const RECLAIM = 'ambition_reclaim_homeland';
  const CELL = 'cell.control_claim.location';
  const KEEP = 'loc_keep';

  function claimantWorld(): WorldGraph {
    const g = new WorldGraph();
    const full = { iron: 0.9, shadow: 0.9, eye: 0.9, heart: 0.9, gold: 0.9, stone: 0.9, star: 0.9, veil: 0.9 };
    g.addNode({ id: ME, name: 'Ered', type: 'actor', properties: { actorType: 'individual', spotlightTier: 'spotlight', domainCapabilities: full } });
    g.addNode({ id: 'loc_home', name: 'Ashfold', type: 'location', properties: { locationSubtype: 'town', hexCol: 5, hexRow: 5 } });
    g.addNode({ id: KEEP, name: 'Blackmere Keep', type: 'location', properties: { locationSubtype: 'town', hexCol: 6, hexRow: 5 } });
    g.addEdge({ id: 'l1', source: ME, target: 'loc_home', type: 'located_at', properties: {} });
    return g;
  }

  const claimTargets = (g: WorldGraph, strategicState: StrategicRuntimeState | undefined, tick: number) =>
    generateStrategicCandidates(g, ME, [RECLAIM], strategicState, tick, mulberry32(1), undefined, 'cells')
      .candidates.filter(c => c.templateId === CELL).map(c => c.targetNodeId);

  it('never proposes a claim on a target the actor already holds — by the ownership rule, not a gate', () => {
    const g = claimantWorld();

    // THR-1403 rotates the cell spread by tick, so the per-actor cap admits this cell
    // only on some ticks. Both arms must be read at the *same* tick, and it must be one
    // where the cell fires — otherwise the absence below proves only that the rotation
    // moved on. Find that tick first, and fail loudly if the cell never fires at all.
    const liveTick = [...Array(40).keys()].find(t => claimTargets(g, undefined, t).includes(KEEP));
    expect(liveTick, 'control:claim never offered the keep on any tick — the arm is dead').toBeDefined();

    // Controlled arm: unheld, the keep is on the board.
    expect(claimTargets(g, undefined, liveTick!)).toContain(KEEP);

    addStrategicControlEdge(g, ME, KEEP);
    // The perturbation applied: ownership now reads `own` through `LOCATION.ownedVia`.
    expect(strategicControlEdges(g, ME)).toHaveLength(1);

    const held = claimTargets(g, undefined, liveTick!);
    expect(held).not.toContain(KEEP);
    // The other location is still offered at the same tick, so this excluded the held
    // target rather than emptying the board.
    expect(held).toContain('loc_home');
  });

  it('refuses a re-claim inside the recent-duplicate window and admits it on the far side', () => {
    const g = claimantWorld();

    // Both arms are read at the SAME tick, varying only how old the collapse is. Reading
    // them at two different ticks made this test brittle against the THR-1403 rotation:
    // it went red when THR-1439 added cells and the spread shifted under the per-actor
    // cap, which is a fact about rotation, not about the guard under test.
    const liveTick = [...Array(60).keys()]
      .map(t => t + STRATEGIC_RECENT_DUPLICATE_WINDOW_TICKS)
      .find(t => claimTargets(g, undefined, t).includes(KEEP));
    expect(liveTick, 'control:claim never offered the keep on any tick — the arm is dead').toBeDefined();

    const collapseAt = (tick: number): StrategicRuntimeState => stateWith([], [{
      tick,
      actorId: ME,
      templateId: CELL,
      ambitionId: RECLAIM,
      verb: 'control',
      behaviorFamily: 'wanderer-explorer',
      displayName: 'Blackmere Keep',
      targetNodeId: KEEP,
      outcome: 'failed',
      graphOps: ['release_control'],
      catalystSeeded: false,
    }]);

    // One tick short of the window: refused...
    const inside = collapseAt(liveTick! - (STRATEGIC_RECENT_DUPLICATE_WINDOW_TICKS - 1));
    expect(claimTargets(g, inside, liveTick!)).not.toContain(KEEP);
    // ...and it is this guard doing it, named on the board.
    const { rejections } = generateStrategicCandidates(g, ME, [RECLAIM], inside, liveTick!, mulberry32(1), undefined, 'cells');
    expect(rejections.map(r => r.reason)).toContain(`recent_duplicate:${KEEP}`);

    // Exactly the window old, same tick, same rotation: admitted.
    const outside = collapseAt(liveTick! - STRATEGIC_RECENT_DUPLICATE_WINDOW_TICKS);
    expect(claimTargets(g, outside, liveTick!)).toContain(KEEP);
  });

  it('keeps the re-claim window inside the history window it reads from', () => {
    // The collapse record the guard matches on is pruned with the history window; a
    // window longer than it would refuse nothing at its far end.
    expect(STRATEGIC_RECENT_DUPLICATE_WINDOW_TICKS).toBeLessThan(STRATEGIC_HISTORY_WINDOW_TICKS);
  });

  it('pins the window at the measured value, not merely at whatever it is set to', () => {
    // The boundary test above builds its fixture *from* this constant, so it holds for
    // any value and cannot notice a retune — the constant sits on both sides of the
    // comparison. This is the assertion that does notice.
    //
    // 24 is not free: it is the observed floor. Across seeds 42/99/7 at 300 ticks, no
    // collapsed stance was re-claimed inside 24 ticks in 102 collapses, and seed 7's
    // minimum gap is exactly 24 — this constant releasing. Lowering it re-opens the
    // churn THR-1286 measured at 39.5% of seed-42 decisions, so a change here is a
    // deliberate re-measurement, never a passing tune.
    expect(STRATEGIC_RECENT_DUPLICATE_WINDOW_TICKS).toBe(24);
  });
});
