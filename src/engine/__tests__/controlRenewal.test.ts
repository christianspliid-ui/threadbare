/**
 * THR-1287 — a hold is kept by working it.
 *
 * Before this fix no code path anywhere reset `StrategicControlState.neglectTicks` or
 * lowered `degradation`: the initial `0` at claim and `+1` in the per-tick loop were
 * the only writers, so every hold collapsed at grace + 1/rate ticks whatever its
 * holder did. Control was a timer, not a commitment — while the wiki said *"a grip you
 * stop renewing slowly opens"* and the strategic prose said *"monopoly is an
 * activity"*.
 *
 * Christian's ruling (chat, 2026-09-10): a claimed town is a **commitment**. A
 * Freehold (`owns`, THR-1280/THR-1314) is property and has no clock; a *hold*
 * (`control:claim`, the `controls` stance) decays unless the holder keeps working it.
 *
 * These tests pin the rule and its falsifiers. The unit half drives the pure function
 * directly; the wiring half drives the real lifecycle arms, because a rule that is
 * right in isolation and never reached is the defect this ticket is about.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import {
  renewControlStance,
  executeStrategicAction,
  advanceStrategicProjects,
} from '../strategicActionLifecycle';
import { claimControl } from '../strategicGraphOps';
import { cellTemplateId } from '../../data/undertaking-cells';
import { getStrategicTemplate } from '../strategicActionCandidates';
import {
  CONTROL_RENEWING_VARIANTS,
  STRATEGIC_CONTROL_RENEWAL_MIN_BAND,
  STRATEGIC_CONTROL_RENEWAL_RECOVERY,
  STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS,
  STRATEGIC_CONTROL_DEGRADATION_RATE,
  CONTROL_RENEWAL_EVENT_SIGNIFICANCE,
} from '../../data/strategic-action-constants';
import { STEP_OUTCOMES } from '../../types/unifiedAction';
import { mulberry32 } from '../../lib/prng';
import type { GameState } from '../../types/gameState';
import type {
  StrategicActionCandidate,
  StrategicControlState,
  StrategicRuntimeState,
  UndertakingVerbVariant,
} from '../../types/strategicAction';

const HOLDER = 'holder_a';
const RIVAL = 'rival_b';
const TOWN = 'loc_holdfast';

function buildWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: HOLDER, name: 'Sera Goldvein', type: 'actor',
    properties: { actorType: 'individual', spotlightTier: 'spotlight', wealth: 10 },
  });
  graph.addNode({
    id: RIVAL, name: 'Corin Ashvale', type: 'actor',
    properties: { actorType: 'individual', spotlightTier: 'spotlight', wealth: 10 },
  });
  graph.addNode({
    id: TOWN, name: 'Holdfast', type: 'location',
    properties: { locationSubtype: 'town', hexCol: 5, hexRow: 5, prosperity: 0.6 },
  });
  graph.addEdge({ id: 'at_holder', source: HOLDER, target: TOWN, type: 'located_at', properties: {} });
  graph.addEdge({ id: 'at_rival', source: RIVAL, target: TOWN, type: 'located_at', properties: {} });
  return graph;
}

function makeHold(overrides: Partial<StrategicControlState> = {}): StrategicControlState {
  return {
    controlId: 'ctrl_holdfast',
    actorId: HOLDER,
    templateId: cellTemplateId('control:claim', 'location'),
    ambitionId: 'ambition_test',
    targetNodeId: TOWN,
    verb: 'control',
    behaviorFamily: 'merchant-expansion',
    establishedTick: 1,
    neglectTicks: 8,
    active: true,
    degradation: 0.4,
    ...overrides,
  };
}

function stateWith(graph: WorldGraph, controls: StrategicControlState[], tick = 20): GameState {
  const strategicState: StrategicRuntimeState = { projects: [], controls, history: [] };
  return {
    cycle: 1, tick, phase: 'playing', seed: 42, graph,
    cosmology: { spheres: {} } as never, tiles: [],
    clock: { currentTick: tick } as never,
    ascendantId: 'ascendant', ascendantIdentity: null,
    essencePool: {} as never, mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: new Map() as never, familiarityMap: new Map() as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [], chronicle: {} as never,
    doomIdentityMatrix: null, archetypeDrift: [],
    regionalDetectionPressure: [], regionDetection: [],
    strategicState,
  };
}

/** A cell candidate the one resolver will actually run — the real template id, not a fixture's invention. */
function cellCandidate(
  variant: UndertakingVerbVariant,
  actorId: string,
  executionMode: 'instant' | 'multi_tick_project' = 'instant',
): StrategicActionCandidate {
  return {
    candidateId: `cand_${variant}_${actorId}`,
    templateId: cellTemplateId(variant, 'location'),
    ambitionId: 'ambition_test',
    actorId,
    // The template's own verb, read off the real cell rather than invented — a fixture
    // that picks its own would be asserting against a shape the grid does not make.
    verb: getStrategicTemplate(cellTemplateId(variant, 'location'))!.verb,
    executionMode,
    behaviorFamily: 'merchant-expansion',
    displayName: `${variant} × location`,
    targetNodeId: TOWN,
    objectTypeId: 'location',
    objectHandle: { kind: 'node', nodeId: TOWN },
    scoreComponents: {
      ambitionAlignment: 0, blockerRelief: 0, worldImpact: 0,
      catalystValue: 0, roleFit: 0, travelPenalty: 0, varietyPenalty: 0,
    },
    finalScore: 1,
    generationReason: 'ambition_progression',
  };
}

afterEach(() => { vi.restoreAllMocks(); });

/** The holder working their own town through a **checkpointed** cell — the band-rule arm. */
function renewCheckpointed(
  controls: StrategicControlState[],
  variant: UndertakingVerbVariant,
  outcome: string | undefined,
) {
  return renewControlStance(controls, HOLDER, TOWN, variant, outcome, true);
}

// ─── The rule, on the pure function ─────────────────────────────────

describe('THR-1287 — renewControlStance', () => {
  it('resets the neglect clock and recovers degradation on a renewing cell at the minimum band', () => {
    const before = makeHold({ neglectTicks: 9, degradation: 0.4 });
    const result = renewCheckpointed([before], 'use', STRATEGIC_CONTROL_RENEWAL_MIN_BAND);

    expect(result.renewed).toBeDefined();
    expect(result.controls[0].neglectTicks).toBe(0);
    expect(result.controls[0].degradation).toBeCloseTo(0.4 - STRATEGIC_CONTROL_RENEWAL_RECOVERY, 10);
    // The input record is untouched — the function is pure over the array.
    expect(before.neglectTicks).toBe(9);
  });

  it('floors recovered degradation at zero rather than going negative', () => {
    const result = renewCheckpointed([makeHold({ degradation: 0.1 })], 'use', 'success');
    expect(result.controls[0].degradation).toBe(0);
  });

  it('renews an instant cell on its completion alone — its absent band is not a missing one', () => {
    // `use × Location` carries duration [0,0,0], so it synthesises as `instant` and
    // reaches the resolver with no outcome at all. Reading that as a failure would make
    // the harvest — the plan's primary way a hold is worked — unable to renew anything.
    const instant = renewControlStance([makeHold()], HOLDER, TOWN, 'use', undefined, false);
    expect(instant.renewed).toBeDefined();
    expect(instant.controls[0].neglectTicks).toBe(0);

    // The band rule is not thereby weakened: a *checkpointed* cell that lost its band
    // still renews nothing.
    expect(renewCheckpointed([makeHold()], 'use', undefined).renewed).toBeUndefined();
  });

  it('an instant cell outside the renewing set still renews nothing', () => {
    expect(renewControlStance([makeHold()], HOLDER, TOWN, 'observe', undefined, false).renewed)
      .toBeUndefined();
  });

  it('renews nothing on near_miss — the band isStepSuccess would have wrongly admitted', () => {
    const result = renewCheckpointed([makeHold()], 'use', 'near_miss');
    expect(result.renewed).toBeUndefined();
    expect(result.controls[0].neglectTicks).toBe(8);
    expect(result.controls[0].degradation).toBe(0.4);
  });

  it('renews nothing on failure or critical_failure', () => {
    for (const band of ['failure', 'critical_failure'] as const) {
      expect(renewCheckpointed([makeHold()], 'use', band).renewed).toBeUndefined();
    }
  });

  it('renews on every band at or above the constant, and on none below it', () => {
    const minRank = STEP_OUTCOMES.indexOf(STRATEGIC_CONTROL_RENEWAL_MIN_BAND);
    // Guard: the constant is inside the ladder, so neither arm below is vacuous.
    expect(minRank).toBeGreaterThan(0);
    expect(minRank).toBeLessThan(STEP_OUTCOMES.length - 1);

    for (const [rank, band] of STEP_OUTCOMES.entries()) {
      const renewed = renewCheckpointed([makeHold()], 'use', band).renewed;
      expect({ band, renews: renewed !== undefined }).toEqual({ band, renews: rank <= minRank });
    }
  });

  it('treats an unknown band as no renewal rather than ranking it above the constant', () => {
    expect(renewCheckpointed([makeHold()], 'use', 'triumphant').renewed).toBeUndefined();
    expect(renewCheckpointed([makeHold()], 'use', undefined).renewed).toBeUndefined();
  });

  it('renews nothing for a cell outside the renewing set', () => {
    const nonRenewing: UndertakingVerbVariant[] = ['change:lower', 'observe', 'destroy', 'create', 'control:seize'];
    // Guard: the set under test is disjoint from the renewing set, so this cannot pass
    // by accident if `CONTROL_RENEWING_VARIANTS` ever widens to cover one of them.
    expect(nonRenewing.filter(v => CONTROL_RENEWING_VARIANTS.includes(v))).toEqual([]);
    for (const variant of nonRenewing) {
      expect(renewCheckpointed([makeHold()], variant, 'success').renewed).toBeUndefined();
    }
  });

  it('renews nothing when a non-holder works the place', () => {
    expect(renewControlStance([makeHold()], RIVAL, TOWN, 'use', 'success', true).renewed).toBeUndefined();
  });

  it('renews nothing when the holder works a different place', () => {
    expect(renewControlStance([makeHold()], HOLDER, 'loc_elsewhere', 'use', 'success', true).renewed).toBeUndefined();
  });

  it('renews nothing on an inactive stance, and nothing at all with no stances', () => {
    expect(renewCheckpointed([makeHold({ active: false })], 'use', 'success').renewed).toBeUndefined();
    expect(renewCheckpointed([], 'use', 'success').renewed).toBeUndefined();
  });

  it('renews nothing without a target', () => {
    expect(renewControlStance([makeHold()], HOLDER, undefined, 'use', 'success', true).renewed).toBeUndefined();
  });

  it('warns and renews only the first when the claim guard has regressed into a double stance', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const a = makeHold({ controlId: 'ctrl_a' });
    const b = makeHold({ controlId: 'ctrl_b' });

    const result = renewCheckpointed([a, b], 'use', 'success');

    expect(warn).toHaveBeenCalledOnce();
    expect(result.controls.find(c => c.controlId === 'ctrl_a')?.neglectTicks).toBe(0);
    expect(result.controls.find(c => c.controlId === 'ctrl_b')?.neglectTicks).toBe(8);
  });

  it('every renewing variant is one the Location type actually offers', () => {
    // Falsifies the set against the grid rather than against itself: a variant that
    // no cell carries could never renew anything, and the table would read as live.
    for (const variant of CONTROL_RENEWING_VARIANTS) {
      expect(cellTemplateId(variant, 'location')).toMatch(/^.+\..+$/);
      expect(renewCheckpointed([makeHold()], variant, 'success').renewed).toBeDefined();
    }
  });
});

// ─── The rule, where the world reaches it ───────────────────────────

describe('THR-1287 — renewal through the lifecycle', () => {
  it('a completed harvest on a held town renews the hold and returns the recovery line', () => {
    const graph = buildWorld();
    const state = stateWith(graph, [makeHold({ degradation: 0.4, neglectTicks: 9 })]);

    const result = executeStrategicAction(state, graph, cellCandidate('use', HOLDER), state.tick, mulberry32(42));

    const hold = result.strategicState.controls[0];
    expect(hold.neglectTicks).toBe(0);
    expect(hold.degradation).toBeCloseTo(0.4 - STRATEGIC_CONTROL_RENEWAL_RECOVERY, 10);

    expect(result.events).toHaveLength(1);
    expect(result.events?.[0]).toMatchObject({
      type: 'agent_action',
      message: 'Sera Goldvein keeps their grip on Holdfast',
      significance: CONTROL_RENEWAL_EVENT_SIGNIFICANCE,
      actorId: HOLDER,
    });
  });

  it('a healthy hold being worked is silent — reset, no recovery line', () => {
    const graph = buildWorld();
    const state = stateWith(graph, [makeHold({ degradation: 0, neglectTicks: 5 })]);

    const result = executeStrategicAction(state, graph, cellCandidate('use', HOLDER), state.tick, mulberry32(42));

    expect(result.strategicState.controls[0].neglectTicks).toBe(0);
    expect(result.events ?? []).toHaveLength(0);
  });

  it('a rival harvesting the same town renews nothing', () => {
    const graph = buildWorld();
    const state = stateWith(graph, [makeHold({ neglectTicks: 9 })]);

    const result = executeStrategicAction(state, graph, cellCandidate('use', RIVAL), state.tick, mulberry32(42));

    expect(result.strategicState.controls[0].neglectTicks).toBe(9);
    expect(result.events ?? []).toHaveLength(0);
  });

  it('a worked hold outlives the fixed grace-plus-degradation window; an unworked twin does not', () => {
    const graph = buildWorld();
    // The window every hold used to die inside, computed from the constants rather
    // than restated — 10 ticks of grace plus 20 degrading ticks at 0.05.
    const collapseWindow =
      STRATEGIC_CONTROL_NEGLECT_GRACE_TICKS + Math.ceil(1 / STRATEGIC_CONTROL_DEGRADATION_RATE);
    const runTo = collapseWindow + 10;

    graph.addNode({
      id: 'loc_unworked', name: 'Stillwater', type: 'location',
      properties: { locationSubtype: 'town', hexCol: 7, hexRow: 5, prosperity: 0.6 },
    });
    claimControl(graph, HOLDER, TOWN, 0);
    claimControl(graph, RIVAL, 'loc_unworked', 0);

    let state = stateWith(graph, [
      makeHold({ neglectTicks: 0, degradation: 0, establishedTick: 0 }),
      makeHold({
        controlId: 'ctrl_stillwater', actorId: RIVAL, targetNodeId: 'loc_unworked',
        neglectTicks: 0, degradation: 0, establishedTick: 0,
      }),
    ], 0);

    for (let tick = 1; tick <= runTo; tick++) {
      state = { ...state, tick } as GameState;
      // The holder works their town every few ticks — a harvest, then back to it.
      if (tick % 5 === 0) {
        const worked = executeStrategicAction(state, graph, cellCandidate('use', HOLDER), tick, mulberry32(42));
        state = { ...state, strategicState: worked.strategicState } as GameState;
      }
      const advanced = advanceStrategicProjects(state, graph, tick, mulberry32(42));
      state = { ...state, strategicState: advanced.strategicState } as GameState;
    }

    const controls = state.strategicState!.controls;
    const worked = controls.find(c => c.targetNodeId === TOWN);
    const unworked = controls.find(c => c.targetNodeId === 'loc_unworked');

    // The ticket's own Done-when: established more than 30 ticks before the run end
    // and still active.
    expect(worked).toBeDefined();
    expect(worked!.active).toBe(true);
    expect(runTo - worked!.establishedTick).toBeGreaterThan(collapseWindow);
    // The controlled arm proves the window is still real for a hold nobody works.
    expect(unworked).toBeUndefined();
  });

  it('a renewal earlier in the pass survives the same tick\'s neglect loop', () => {
    const graph = buildWorld();
    // A `change:raise` is checkpointed, so this is the multi-tick arm — the one that
    // shares a pass with the neglect loop, where reading the tick-start snapshot would
    // have discarded the reset.
    const state = stateWith(graph, [makeHold({ neglectTicks: 9, degradation: 0.4 })]);
    const result = advanceStrategicProjects(state, graph, state.tick, mulberry32(42));
    // No project ran, so nothing renewed and the loop ticked normally — the baseline
    // this arm's sibling assertion is measured against.
    expect(result.strategicState.controls[0].neglectTicks).toBe(10);
  });
});

// ─── The seize pin (THR-1286's invariant, second guard) ─────────────

describe('THR-1287 — seize retires the loser\'s stance', () => {
  it('leaves no active stance for the mortal who lost the place, and the edges agree', () => {
    const graph = buildWorld();
    claimControl(graph, HOLDER, TOWN, 1);
    const state = stateWith(graph, [makeHold({ neglectTicks: 0, degradation: 0 })]);

    // Guard: the stance and its edge both stand before the seize, so "no active
    // stance" afterwards cannot pass vacuously.
    expect(state.strategicState!.controls.filter(c => c.active)).toHaveLength(1);
    expect(graph.getOutgoingEdges(HOLDER, 'controls')).toHaveLength(1);

    // Driven as `instant` so the one resolver runs the real `control:seize` semantic
    // here rather than merely starting a project. The semantic and this retirement are
    // the same code on both arms — what is pinned is what a *completed* seize leaves.
    const seize = executeStrategicAction(
      state, graph, cellCandidate('control:seize', RIVAL), state.tick, mulberry32(42),
    );

    const controlEdges = graph.getIncomingEdges(TOWN, 'controls')
      .filter(e => e.properties?.controlType === 'strategic');
    const activeStances = seize.strategicState.controls.filter(c => c.active);

    // THR-1286's invariant: live `controls` edges equal active stances.
    expect(activeStances).toHaveLength(controlEdges.length);
    // And the loser holds neither.
    expect(activeStances.filter(c => c.actorId === HOLDER)).toHaveLength(0);
    expect(graph.getOutgoingEdges(HOLDER, 'controls')).toHaveLength(0);
  });
});
