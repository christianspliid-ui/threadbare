/**
 * THR-1538 (FB2) — fightState, the clock, early end.
 *
 * Plan doc `Docs/plans/2026-09-23-fight-block.md` §4–6. Each `describe` is one
 * clause of the slice's Done-when. Bands are handed to `executeStepResult`
 * directly (the roll is FB1's, already covered), so each case is exact; the
 * no-roll ends go through `resolveUncontestedStep` first, and one case drives the
 * whole loop (`phaseUnifiedActionProgress`) to prove the pass-through.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import {
  executeStepResult,
  phaseUnifiedActionProgress,
  resolveUncontestedStep,
} from '../../unifiedActionResolution';
import { advanceStep } from '../../unifiedActionLifecycle';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { createSimulationRuntime } from '../../simulationRuntime';
import { recordUnifiedActionNudgeMemory } from '../../encounterChoiceMemory';
import { markMortalDead } from '../../agentLifecycle';
import { getAgentInfoCard } from '../../agentDetail';
import { advanceFightClock, drainFightClockMailbox } from '../fightClock';
import { FIGHT_END_BRANCHES, onFightEnded, type FightEndBranch, type FightEndContext } from '../fightOutcome';
import { fightResultIndex } from '../fightState';
import { readOpponentCard } from '../opponentCard';
import {
  FIGHT_CLOCK_BY_BAND,
  FIGHT_CLOCK_MAILBOX_PROP,
  FIGHT_CLOCK_RECOVERY_TICKS,
  FIGHT_RESULT_ACTION_OUTCOME,
} from '../../../data/fight-constants';
import type { GameState } from '../../../types/gameState';
import type { ActionTriggerEffect, EffectRuntimeState } from '../../../types/effects';
import type { ReachDomain } from '../../../types/traits';
import type {
  ActionStep,
  StepOutcome,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import type { FightResult, FightRole, FightState } from '../../../types/fight';
import type { SimulationRuntime } from '../../simulationRuntime';

const TICK = 100;
const midRng = () => 0.5;

// ─── Fixture ────────────────────────────────────────────────────

function baseState(graph: WorldGraph, effectStates = new Map<string, EffectRuntimeState>()): GameState {
  return {
    tick: TICK, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
    pendingQuintessenceEvents: [],
    effectStates,
  } as unknown as GameState;
}

/** A fighter and an opponent on one hex; a second location on another hex. */
function fightWorld(opts: { monsterState?: Record<string, unknown> } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Den', properties: { hexCol: 2, hexRow: 2 } });
  graph.addNode({ id: 'loc-far', type: 'location', name: 'Far', properties: { hexCol: 9, hexRow: 9 } });
  graph.addNode({
    id: 'hero', type: 'actor', name: 'Hero',
    properties: { actorType: 'individual', domainCapabilities: { iron: 14, heart: 14 } },
  });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'loc-1', type: 'located_at', properties: {} });
  graph.addNode({
    id: 'beast', type: 'actor', name: 'Beast',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: 10 },
      ...(opts.monsterState ? { monsterState: opts.monsterState } : {}),
    },
  });
  graph.addEdge({ id: 'e.beast.at', source: 'beast', target: 'loc-1', type: 'located_at', properties: {} });
  return graph;
}

function fightStep(role: FightRole, reach: ReachDomain = role === 'nerve' ? 'heart' : 'iron', opponentRef?: string): ActionStep {
  return {
    reach,
    duration: { min: 1, max: 1 },
    difficulty: 0.35,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    fightRole: role,
    ...(opponentRef ? { opponentRef } : {}),
  } as ActionStep;
}

/** A terminal block: nerve + `clashes` clash steps, with an aftermath keyed on the result. */
function fightTemplate(clashes = 2, opts: { opponentRef?: string; id?: string } = {}): UnifiedActionTemplate {
  const steps = [
    fightStep('nerve', 'heart', opts.opponentRef),
    ...Array.from({ length: clashes }, () => fightStep('clash', 'iron', opts.opponentRef)),
  ];
  const variant = (overview: string) => ({ overview, changes: [] });
  return {
    id: opts.id ?? 'fight.test',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Fight Test',
    reach: 'iron',
    crudType: 'update',
    scale: 'regional',
    steps,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
    aftermathConfig: {
      branchOnStep: fightResultIndex(steps),
      variants: {
        'fight:overcome': variant('The beast is down.'),
        'fight:broke_off': variant('The fight broke off.'),
        'fight:yielded': variant('They yielded.'),
      },
      fallback: variant('Fallback.'),
    },
  } as unknown as UnifiedActionTemplate;
}

function action(templateId: string, overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_fight', actorId: 'hero', templateId, targetId: 'beast',
    scale: 'regional', source: 'agent',
    startTick: 90, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
    ...overrides,
  } as unknown as UnifiedAction;
}

/** Resolve the action's current step with a given band (the roll is FB1's). */
function runStep(
  state: GameState,
  a: UnifiedAction,
  tpl: UnifiedActionTemplate,
  outcome: StepOutcome,
  runtime?: SimulationRuntime,
): UnifiedAction {
  return executeStepResult(
    a, tpl, outcome, [], state, midRng, state.tick,
    { capability: 0.5, probability: 0.5, roll: 50 }, runtime,
  ).updatedAction;
}

/** Take the no-roll route the way the loop does: resolve, then pass `fightEnd` on. */
function runNoRoll(state: GameState, a: UnifiedAction, tpl: UnifiedActionTemplate): UnifiedAction {
  const r = resolveUncontestedStep(a, tpl, state, midRng);
  expect(r.fightEnd).toBeDefined();
  return executeStepResult(
    a, tpl, r.outcome, r.opsToExecute, state, midRng, state.tick,
    { capability: r.capability, probability: r.probability, roll: r.roll, fightEnd: r.fightEnd },
  ).updatedAction;
}

function runBands(state: GameState, tpl: UnifiedActionTemplate, bands: StepOutcome[], a0?: UnifiedAction): UnifiedAction {
  let a = a0 ?? action(tpl.id);
  for (const band of bands) {
    expect(a.resolved).toBe(false);
    a = runStep(state, a, tpl, band);
  }
  return a;
}

const tracesOf = (category: string) =>
  getTraces().filter((t) => t.category === category) as unknown as Array<Record<string, any>>;

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); FIGHT_END_BRANCHES.length = 0; });

// ─── The clock ──────────────────────────────────────────────────

describe('each clash band moves the clock by FIGHT_CLOCK_BY_BAND', () => {
  const bands: StepOutcome[] = ['critical_success', 'success', 'near_miss', 'success_at_cost', 'failure'];

  for (const band of bands) {
    it(`${band}: a per-fight (mortal) clock moves by ${FIGHT_CLOCK_BY_BAND[band]}`, () => {
      const state = baseState(fightWorld());
      const tpl = fightTemplate(2);
      const a = runBands(state, tpl, ['success', band]);
      expect(a.fightState!.clockNow).toBe(Math.min(2, FIGHT_CLOCK_BY_BAND[band]));
      expect(a.fightState!.exchanges).toBe(1);
    });

    it(`${band}: a persistent (monster) clock moves by ${FIGHT_CLOCK_BY_BAND[band]} on the node`, () => {
      const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clockSize: 5, clockFilled: 0, clockUpdatedTick: TICK } });
      const state = baseState(graph);
      const a = runBands(state, fightTemplate(2), ['success', band]);
      const bag = graph.getNode('beast')!.properties.monsterState as Record<string, number>;
      expect(bag.clockFilled).toBe(FIGHT_CLOCK_BY_BAND[band]);
      expect(a.fightState!.clockNow).toBe(FIGHT_CLOCK_BY_BAND[band]);
    });
  }

  it('a critical failure on a clash moves nothing and ends the fight struck_down', () => {
    const state = baseState(fightWorld());
    const a = runBands(state, fightTemplate(2), ['success', 'critical_failure']);
    expect(a.fightState).toMatchObject({ result: 'struck_down', clockNow: 0 });
    expect(a).toMatchObject({ resolved: true, outcome: 'critical_failure' });
  });

  it('every clock write is traced; fight.clock reports filledByThisWrite', () => {
    const graph = fightWorld({ monsterState: { clockSize: 2, clockFilled: 1, clockUpdatedTick: TICK } });
    const write = advanceFightClock(graph, 'beast', 1, 'test', TICK);
    expect(write).toMatchObject({ before: 1, after: 2, filledByThisWrite: true, store: 'monsterState' });
    const again = advanceFightClock(graph, 'beast', 1, 'test', TICK);
    expect(again).toMatchObject({ before: 2, after: 2, filledByThisWrite: false });
    expect(tracesOf('fight.clock').map((t) => t.filledByThisWrite)).toEqual([true, false]);
  });
});

describe('lazy recovery: the writer applies pending recovery before its own delta', () => {
  it('recovery math', () => {
    const graph = fightWorld({
      monsterState: { clockSize: 5, clockFilled: 4, clockUpdatedTick: TICK - 2 * FIGHT_CLOCK_RECOVERY_TICKS - 1 },
    });
    // Two segments recovered since the last write …
    expect(readOpponentCard(graph, 'beast', TICK).clockFilled).toBe(2);
    // … and a +1 lands on the recovered clock, not the stored one.
    expect(advanceFightClock(graph, 'beast', 1, 'test', TICK)).toMatchObject({ before: 2, after: 3 });
    const bag = graph.getNode('beast')!.properties.monsterState as Record<string, number>;
    expect(bag).toMatchObject({ clockFilled: 3, clockUpdatedTick: TICK });
    // Stamped: nothing more recovers until another full period passes.
    expect(readOpponentCard(graph, 'beast', TICK + FIGHT_CLOCK_RECOVERY_TICKS - 1).clockFilled).toBe(3);
    expect(readOpponentCard(graph, 'beast', TICK + FIGHT_CLOCK_RECOVERY_TICKS).clockFilled).toBe(2);
  });

  it('the fight starts from the recovered clock (clockAtStart)', () => {
    const graph = fightWorld({
      monsterState: { clockSize: 4, clockFilled: 3, clockUpdatedTick: TICK - FIGHT_CLOCK_RECOVERY_TICKS },
    });
    const a = runBands(baseState(graph), fightTemplate(2), ['success']);
    expect(a.fightState).toMatchObject({ clockAtStart: 2, clockNow: 2, persistent: true, clockSize: 4 });
  });

  it('a per-fight clock writes through the mailbox; the handler drains it', () => {
    const graph = fightWorld();
    advanceFightClock(graph, 'beast', 1, 'item', TICK);
    expect(graph.getNode('beast')!.properties[FIGHT_CLOCK_MAILBOX_PROP]).toBe(1);
    expect(drainFightClockMailbox(graph, 'beast')).toBe(1);
    expect(FIGHT_CLOCK_MAILBOX_PROP in graph.getNode('beast')!.properties).toBe(false);
  });

  it('a stale mailbox is cleared at a new fight\'s start, traced stale_cleared', () => {
    const graph = fightWorld();
    graph.getNode('beast')!.properties[FIGHT_CLOCK_MAILBOX_PROP] = 2;
    const a = runBands(baseState(graph), fightTemplate(2), ['success']);
    expect(a.fightState!.clockNow).toBe(0);
    expect(FIGHT_CLOCK_MAILBOX_PROP in graph.getNode('beast')!.properties).toBe(false);
    expect(tracesOf('fight.clock').some((t) => t.cause === 'stale_cleared')).toBe(true);
  });

  it('a mailbox write between steps counts toward the clock but is not this step\'s blow', () => {
    const graph = fightWorld();
    const state = baseState(graph);
    const tpl = fightTemplate(2);
    let a = runBands(state, tpl, ['success', 'success']); // per-fight clock 1/2
    expect(a.fightState!.clockNow).toBe(1);
    // A third party's write lands between steps (FB6 wires the real effect path;
    // this is its write). It fills the clock, but the missed clash landed nothing,
    // so the full clock waits — and with no later clash, the fight breaks off.
    advanceFightClock(graph, 'beast', 1, 'item', TICK);
    a = runStep(state, a, tpl, 'failure');
    expect(a.fightState).toMatchObject({ clockNow: 2, result: 'broke_off', blowsLanded: 1 });
  });
});

// ─── The result and the action ─────────────────────────────────

describe('each FightResult resolves the action with FIGHT_RESULT_ACTION_OUTCOME[result]', () => {
  const results: FightResult[] = ['overcome', 'driven_off', 'bargained', 'yielded', 'broke_off', 'routed', 'struck_down'];
  for (const result of results) {
    it(`${result} → ${FIGHT_RESULT_ACTION_OUTCOME[result]}`, () => {
      const tpl = fightTemplate(2);
      const a = action(tpl.id, { currentStep: 1, fightState: { result } as FightState });
      const band: StepOutcome = result === 'routed' || result === 'struck_down' ? 'critical_failure' : 'failure';
      const next = advanceStep(a, band, tpl, midRng);
      expect(next).toMatchObject({ resolved: true, outcome: FIGHT_RESULT_ACTION_OUTCOME[result] });
      // stepOutcomes stays append-only.
      expect(next.stepOutcomes).toEqual([band]);
    });
  }

  it('overcome after a wounding exchange → success (not computeFinalActionOutcome\'s success_at_cost)', () => {
    const state = baseState(fightWorld());
    const a = runBands(state, fightTemplate(3), ['success', 'failure', 'success', 'success']);
    expect(a.fightState).toMatchObject({ result: 'overcome', wounds: 1, blowsLanded: 2, clockNow: 2 });
    expect(a).toMatchObject({ resolved: true, outcome: 'success' });
  });

  it('a routed nerve step → critical_failure; the rout is recorded on fightState', () => {
    const state = baseState(fightWorld());
    const a = runBands(state, fightTemplate(2), ['critical_failure']);
    expect(a.fightState!.result).toBe('routed');
    expect(a).toMatchObject({ resolved: true, outcome: 'critical_failure' });
  });

  it('a won fight ends early: later clashes never run', () => {
    const state = baseState(fightWorld());
    const a = runBands(state, fightTemplate(3), ['success', 'critical_success']);
    expect(a).toMatchObject({ resolved: true, outcome: 'success' });
    expect(a.stepOutcomes).toEqual(['success', 'critical_success']);
  });
});

describe('the clock-full check: a full clock falls to a landing blow, never by itself', () => {
  it('a clock already full at fight start falls on the first landing blow', () => {
    const graph = fightWorld({ monsterState: { clockSize: 3, clockFilled: 3, clockUpdatedTick: TICK } });
    const a = runBands(baseState(graph), fightTemplate(2), ['success', 'failure', 'near_miss']);
    expect(a.fightState).toMatchObject({ result: 'overcome', exchanges: 2 });
  });

  it('a full clock with no blow landed by the last clash ends broke_off', () => {
    const graph = fightWorld({ monsterState: { clockSize: 3, clockFilled: 3, clockUpdatedTick: TICK } });
    const a = runBands(baseState(graph), fightTemplate(2), ['success', 'failure', 'failure']);
    expect(a.fightState).toMatchObject({ result: 'broke_off', blowsLanded: 0, clockNow: 3 });
    expect(a).toMatchObject({ resolved: true, outcome: 'success_at_cost' });
  });
});

// ─── The no-roll ends ───────────────────────────────────────────

describe('no-roll ends: no_opponent, opponent_gone and separated', () => {
  it('an unbound opponentRef ends the block no_opponent with no roll', () => {
    const state = baseState(fightWorld());
    const tpl = fightTemplate(2, { opponentRef: 'beast_cast' });
    const r = resolveUncontestedStep(action(tpl.id), tpl, state, () => { throw new Error('rolled'); });
    expect(r.fightEnd).toEqual({ reason: 'no_opponent' });
    expect(tracesOf('resolution.input')).toHaveLength(0);
    expect(tracesOf('fight.step')).toHaveLength(0);
  });

  it('a no_opponent fight leaves stepOutcomes unchanged, writes no consequence_applied, grants no growth', () => {
    const graph = fightWorld();
    const state = baseState(graph);
    const tpl = fightTemplate(2, { opponentRef: 'beast_cast' });
    const capsBefore = JSON.stringify(graph.getNode('hero')!.properties.domainCapabilities);
    const a = runNoRoll(state, action(tpl.id), tpl);
    expect(a).toMatchObject({ resolved: true, outcome: 'success_at_cost', stepOutcomes: [] });
    expect(a.fightState).toMatchObject({ result: 'broke_off', endReason: 'no_opponent' });
    expect(tracesOf('consequence_applied')).toHaveLength(0);
    expect(JSON.stringify(graph.getNode('hero')!.properties.domainCapabilities)).toBe(capsBefore);
    expect(a.stepProseHistory ?? []).toHaveLength(0);
  });

  it('a self-target ends no_opponent; a deceased first opponent ends opponent_gone', () => {
    const state = baseState(fightWorld());
    const tpl = fightTemplate(2);
    expect(resolveUncontestedStep(action(tpl.id, { targetId: 'hero' }), tpl, state, midRng).fightEnd)
      .toEqual({ reason: 'no_opponent' });
    state.graph.getNode('beast')!.properties.deceased = true;
    expect(resolveUncontestedStep(action(tpl.id), tpl, state, midRng).fightEnd)
      .toEqual({ reason: 'opponent_gone' });
  });

  const cases: Array<{ name: string; reason: 'no_opponent' | 'opponent_gone' | 'separated'; setup: (g: WorldGraph) => void; midFight: boolean }> = [
    { name: 'no_opponent', reason: 'no_opponent', setup: () => {}, midFight: false },
    { name: 'mid-fight opponent_gone', reason: 'opponent_gone', setup: (g) => { g.getNode('beast')!.properties.deceased = true; }, midFight: true },
    {
      name: 'separated',
      reason: 'separated',
      setup: (g) => {
        g.removeEdge('e.hero.at');
        g.addEdge({ id: 'e.hero.far', source: 'hero', target: 'loc-far', type: 'located_at', properties: {} });
      },
      midFight: true,
    },
  ];

  for (const c of cases) {
    it(`${c.name}: the fight:broke_off aftermath, one fight.end, one dispatch${c.midFight ? ', and combat_ended' : ''}`, () => {
      const graph = fightWorld();
      const state = baseState(graph);
      const tpl = fightTemplate(2, c.midFight ? {} : { opponentRef: 'beast_cast' });
      let dispatches = 0;
      FIGHT_END_BRANCHES.push(() => { dispatches++; });
      let a = action(tpl.id);
      if (c.midFight) a = runStep(state, a, tpl, 'success'); // the nerve step: the fight is under way
      c.setup(graph);
      a = runNoRoll(state, a, tpl);

      expect(a.fightState).toMatchObject({ result: 'broke_off', endReason: c.reason });
      expect(a.aftermathSummary?.overview).toBe('The fight broke off.');
      const ends = tracesOf('fight.end');
      expect(ends).toHaveLength(1);
      expect(ends[0]).toMatchObject({ result: 'broke_off', endReason: c.reason, rolled: false });
      expect(dispatches).toBe(1);
      const combatEnded = tracesOf('effect.event_raised').filter((t) => t.event === 'combat_ended');
      expect(combatEnded.length > 0).toBe(c.midFight);
      // Still an encounter resolved: the event node and the resolved tick event exist.
      expect(a.eventNodeId).toBeDefined();
    });
  }

  it('a fighter moved off the opponent\'s hex ends broke_off / separated through the loop', () => {
    const graph = fightWorld();
    const state = baseState(graph);
    const tpl = fightTemplate(2);
    const a = runStep(state, action(tpl.id), tpl, 'success');
    graph.removeEdge('e.hero.at');
    graph.addEdge({ id: 'e.hero.far', source: 'hero', target: 'loc-far', type: 'located_at', properties: {} });
    (state as { unifiedActions: UnifiedAction[] }).unifiedActions = [{ ...a, stepProgress: 0, stepDuration: 1 }];
    const patch = phaseUnifiedActionProgress(state, [tpl], midRng, createSimulationRuntime());
    const done = patch.unifiedActions!.find((x) => x.actionId === a.actionId)!;
    expect(done).toMatchObject({ resolved: true, outcome: 'success_at_cost' });
    expect(done.fightState).toMatchObject({ result: 'broke_off', endReason: 'separated' });
    expect(done.stepOutcomes).toEqual(['success']);
  });
});

// ─── The trigger ladder ─────────────────────────────────────────

describe('the action-trigger ladder is fed the fight result', () => {
  function withTriggerItems(graph: WorldGraph): void {
    const item = (id: string, on: ActionTriggerEffect['on']) => {
      const trigger: ActionTriggerEffect = { type: 'action_trigger', on, payload: { kind: 'trace_only', message: id } };
      graph.addNode({ id, type: 'artifact', name: id, properties: { effects: [trigger] } });
      graph.addEdge({ id: `e.hero.${id}`, source: 'hero', target: id, type: 'possesses', properties: {} });
    };
    item('item.success', 'encounter_success');
    item('item.failure', 'encounter_failure');
  }
  const fired = () => new Set(tracesOf('effect_reaction').map((t) => t.attachmentId));

  it('after a yield that followed an at-cost wound, encounter_success does not fire and encounter_failure does', () => {
    const graph = fightWorld();
    withTriggerItems(graph);
    const state = baseState(graph);
    const tpl = fightTemplate(3);
    let a = runStep(state, action(tpl.id), tpl, 'success');
    // The concession fork is FB4's (THR-1540); its decision is the result it sets.
    a = { ...a, fightState: { ...a.fightState!, result: 'yielded' } };
    a = runStep(state, a, tpl, 'success_at_cost');
    expect(a).toMatchObject({ resolved: true, outcome: 'failure' });
    const ids = fired();
    expect(ids.has('item.success')).toBe(false);
    expect(ids.has('item.failure')).toBe(true);
    expect(a.aftermathSummary?.overview).toBe('They yielded.');
  });

  it('control: the same at-cost band on an ordinary last step fires encounter_success', () => {
    const graph = fightWorld();
    withTriggerItems(graph);
    const state = baseState(graph);
    const tpl = fightTemplate(1);
    const a = runBands(state, tpl, ['success', 'success_at_cost']);
    // A landed at-cost blow on a 2-segment clock: broke_off → success_at_cost.
    expect(a).toMatchObject({ resolved: true, outcome: 'success_at_cost' });
    expect(fired().has('item.success')).toBe(true);
  });
});

// ─── The dispatcher ─────────────────────────────────────────────

describe('onFightEnded — the post-fight dispatcher', () => {
  it('a branch\'s patch lands on the resolved action\'s fightState; it receives runtime and overrideCtx', () => {
    const state = baseState(fightWorld());
    const runtime = createSimulationRuntime();
    const seen: FightEndContext[] = [];
    FIGHT_END_BRANCHES.push((_s, _a, ctx) => {
      seen.push(ctx);
      return { patch: { ending: { face: 'overcome_mortal', scarWritten: false, grudgeWritten: false } } };
    });
    const tpl = fightTemplate(2);
    let a = runStep(state, action(tpl.id), tpl, 'success', runtime);
    a = runStep(state, a, tpl, 'success', runtime);
    a = runStep(state, a, tpl, 'success', runtime);
    expect(a.fightState).toMatchObject({ result: 'overcome', ending: { face: 'overcome_mortal' } });
    expect(seen).toHaveLength(1);
    expect(seen[0].runtime).toBe(runtime);
    expect(seen[0].overrideCtx).toMatchObject({ graph: state.graph, tick: TICK });
    expect(tracesOf('fight.end')).toHaveLength(1);
  });

  it('patches merge in branch order', () => {
    const state = baseState(fightWorld());
    const a = action('fight.test', { fightState: { result: 'overcome' } as FightState });
    const branches: FightEndBranch[] = [
      () => ({ patch: { lairOutcome: { lairId: 'l1', felled: true, lairCleared: false } } }),
      () => ({ patch: { lairOutcome: { lairId: 'l1', felled: true, lairCleared: true } } }),
    ];
    const out = onFightEnded(state, a, { tick: TICK, rng: midRng, overrideCtx: {} as never }, branches);
    expect(out.fightState.lairOutcome).toMatchObject({ lairCleared: true });
  });

  it('a branch that throws: the action stays resolved and fight.end carries dispatchError', () => {
    const state = baseState(fightWorld());
    FIGHT_END_BRANCHES.push(() => { throw new Error('lair write failed'); });
    const tpl = fightTemplate(1);
    const a = runBands(state, tpl, ['success', 'critical_success']);
    expect(a).toMatchObject({ resolved: true, outcome: 'success' });
    expect(tracesOf('fight.end')).toEqual([expect.objectContaining({ dispatchError: 'lair write failed' })]);
  });

  it('exactly one fight.end per fight, whatever the route', () => {
    const state = baseState(fightWorld());
    const tpl = fightTemplate(3);
    runBands(state, tpl, ['success', 'failure', 'failure', 'failure']);
    expect(tracesOf('fight.end')).toHaveLength(1);
  });
});

// ─── The memory rule ────────────────────────────────────────────

describe('the result memory sits at fightResultIndex — no step owns it', () => {
  it('written at fightResultIndex; an aftermath variant keyed on fight:overcome resolves', () => {
    const state = baseState(fightWorld());
    const tpl = fightTemplate(2);
    const a = runBands(state, tpl, ['success', 'success', 'success']);
    const memory = a.choiceHistory!.find((m) => m.stepIndex === fightResultIndex(tpl.steps));
    expect(memory).toMatchObject({ stepIndex: 3, stepId: 'fight', choiceId: 'fight:overcome', interventionType: 'fight' });
    expect(a.aftermathSummary?.overview).toBe('The beast is down.');
  });

  it('step-index safety: a branchOnStep fixture on a step index is untouched by the result memory', () => {
    const state = baseState(fightWorld());
    const base = fightTemplate(2);
    const tpl = {
      ...base,
      aftermathConfig: { ...base.aftermathConfig!, branchOnStep: 0, variants: { card_a: { overview: 'Card A.', changes: [] } } },
    } as UnifiedActionTemplate;
    let a = recordUnifiedActionNudgeMemory(action(tpl.id), 0, 's0', ['card_a'], 'Card A', TICK, 1);
    a = runBands(state, tpl, ['success', 'success', 'success'], a);
    expect(a.aftermathSummary?.overview).toBe('Card A.');
    expect(a.choiceHistory!.map((m) => m.stepIndex)).toEqual([0, 3]);
  });

  it('attended: cards committed on the nerve step and on a wounding clash survive, and fight:overcome still resolves', () => {
    const state = baseState(fightWorld());
    const tpl = fightTemplate(3);
    let a = recordUnifiedActionNudgeMemory(action(tpl.id), 0, 'nerve', ['steady_hand'], 'Steady hand', TICK, 1);
    a = runStep(state, a, tpl, 'success');
    a = recordUnifiedActionNudgeMemory(a, 1, 'clash1', ['press_on'], 'Press on', TICK, 1);
    a = runStep(state, a, tpl, 'success_at_cost'); // lands one, takes one: wounding
    a = runStep(state, a, tpl, 'success');
    expect(a.fightState).toMatchObject({ result: 'overcome', wounds: 1 });
    // `stepProseHistory` is typed `readonly unknown[]` on the action; the records carry index + choiceId.
    const records = (a.stepProseHistory ?? []) as ReadonlyArray<{ index?: number; choiceId?: string }>;
    expect(records.find((r) => r.index === 0)?.choiceId).toBe('steady_hand');
    expect(records.find((r) => r.index === 1)?.choiceId).toBe('press_on');
    expect(a.choiceHistory!.map((m) => m.choiceId)).toEqual(['steady_hand', 'press_on', 'fight:overcome']);
    expect(a.aftermathSummary?.overview).toBe('The beast is down.');
  });
});

// ─── One monster, two fights ────────────────────────────────────

describe('two fights against one monster in one tick', () => {
  it('the first to land on a full clock records overcome; the other ends opponent_gone', () => {
    const graph = fightWorld({ monsterState: { clockSize: 2, clockFilled: 1, clockUpdatedTick: TICK } });
    graph.addNode({ id: 'hero2', type: 'actor', name: 'Second', properties: { actorType: 'individual' } });
    graph.addEdge({ id: 'e.hero2.at', source: 'hero2', target: 'loc-1', type: 'located_at', properties: {} });
    const state = baseState(graph);
    const tpl = fightTemplate(2);
    // The kill is plan doc 1/3's dispatcher write; this stand-in branch claims it.
    FIGHT_END_BRANCHES.push((s, a, ctx) => {
      if (a.fightState?.result === 'overcome' && a.fightState.opponentId) {
        markMortalDead(s.graph, a.fightState.opponentId, ctx.tick, { cause: 'fight', byActorId: a.actorId, mode: 'retain' }, ctx.runtime, ctx.overrideCtx);
      }
    });

    // Both fighters are past their nerve step, clashing this tick.
    let first = runStep(state, action(tpl.id, { actionId: 'ua_1' }), tpl, 'success');
    let second = runStep(state, action(tpl.id, { actionId: 'ua_2', actorId: 'hero2' }), tpl, 'success');

    first = runStep(state, first, tpl, 'success'); // lands on 1/2 → full
    expect(first.fightState).toMatchObject({ result: 'overcome' });
    expect(graph.getNode('beast')!.properties).toMatchObject({ deceased: true, deathCause: 'fight', slainBy: 'hero' });

    second = runNoRoll(state, second, tpl);
    expect(second.fightState).toMatchObject({ result: 'broke_off', endReason: 'opponent_gone' });
    expect(tracesOf('fight.end').map((t) => t.result)).toEqual(['overcome', 'broke_off']);
  });
});

// ─── The death cause ────────────────────────────────────────────

describe("the 'fight' death cause", () => {
  it('reads "slain" on the sheet, and death.by names the victor', () => {
    const graph = fightWorld();
    markMortalDead(graph, 'beast', TICK, { cause: 'fight', byActorId: 'hero', mode: 'retain' });
    const card = getAgentInfoCard(graph, 'beast', 'asc-1', 'stranger');
    expect(card?.death).toEqual({ causeWord: 'slain', by: 'Hero' });
  });

  it('control: a commissioned killing with no witness names nobody', () => {
    const graph = fightWorld();
    markMortalDead(graph, 'beast', TICK, { cause: 'commission', byActorId: 'hero', mode: 'retain' });
    const card = getAgentInfoCard(graph, 'beast', 'asc-1', 'stranger');
    expect(card?.death).toEqual({ causeWord: 'slain' });
  });
});
