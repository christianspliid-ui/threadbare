/**
 * THR-1542 (FB6) — the effect vocabulary for fights.
 *
 * Plan doc `Docs/plans/2026-09-23-fight-block.md` §10 (and §5, the clock). Each
 * `describe` is one clause of the slice's Done-when. Bands are handed to
 * `executeStepResult` directly (the roll is FB1's), so each case is exact.
 *
 * The three live `resource_manipulate` sites are each exercised through their
 * production caller: the executor through a reactive raised by a real fight step
 * (and through `applyExecutionResult` directly), the one-shot item path through
 * the fight step's own `encounter_outcome` raise, and the per-tick path through
 * `tickEffects`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { executeStepResult } from '../../unifiedActionResolution';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { executeEffect } from '../../effectExecutors';
import { applyExecutionResult } from '../../effects/effectEventDispatch';
import { buildPredicateContext, evaluatePredicate } from '../../effects/effectPredicates';
import { tickEffects } from '../../effectTick';
import { fightResultIndex } from '../fightState';
import { FIGHT_END_BRANCHES, resetFightEndBranches } from '../fightOutcome';
import {
  FIGHT_CLOCK_MAILBOX_PROP,
  FIGHT_CLOCK_RECOVERY_TICKS,
  FIGHT_MORTAL_CLOCK,
} from '../../../data/fight-constants';
import type { GameState } from '../../../types/gameState';
import type { AttachmentEffect, EffectRuntimeState } from '../../../types/effects';
import type {
  ActionStep,
  StepOutcome,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import type { FightRole } from '../../../types/fight';

const TICK = 100;
const midRng = () => 0.5;
const HEXED = 'trait.condition.hexed';

// ─── Fixture ────────────────────────────────────────────────────

function baseState(graph: WorldGraph): GameState {
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
    effectStates: new Map<string, EffectRuntimeState>(),
  } as unknown as GameState;
}

/**
 * A courageous fighter and an opponent on one hex. With `monsterState` the
 * opponent's clock is persistent (a monster); without it, per-fight (a mortal).
 */
function fightWorld(opts: { monsterState?: Record<string, unknown> } = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Den', properties: { hexCol: 2, hexRow: 2 } });
  graph.addNode({
    id: 'hero', type: 'actor', name: 'Hero',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: 14, heart: 14 },
      axiologicalProfile: { courage_prudence: 0.8 },
    },
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
  graph.addNode({
    id: HEXED, type: 'trait', name: 'Hexed',
    properties: { category: 'condition', tags: ['#curse', 'harm'] },
  });
  return graph;
}

function giveItem(graph: WorldGraph, ownerId: string, itemId: string, effects: AttachmentEffect[]): void {
  graph.addNode({ id: itemId, type: 'artifact', name: itemId, properties: { effects } });
  graph.addEdge({ id: `e.${ownerId}.${itemId}`, source: ownerId, target: itemId, type: 'possesses', properties: {} });
}

function fightStep(role: FightRole): ActionStep {
  return {
    reach: role === 'nerve' ? 'heart' : 'iron',
    duration: { min: 1, max: 1 },
    difficulty: 0.35,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    fightRole: role,
  } as ActionStep;
}

/** A terminal block: nerve + `clashes` clash steps. */
function fightTemplate(clashes = 3): UnifiedActionTemplate {
  const steps = [fightStep('nerve'), ...Array.from({ length: clashes }, () => fightStep('clash'))];
  const variant = (overview: string) => ({ overview, changes: [] });
  return {
    id: 'fight.test',
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
      variants: { 'fight:overcome': variant('Down.'), 'fight:broke_off': variant('Broke off.') },
      fallback: variant('Fallback.'),
    },
  } as unknown as UnifiedActionTemplate;
}

function action(): UnifiedAction {
  return {
    actionId: 'ua_fight', actorId: 'hero', templateId: 'fight.test', targetId: 'beast',
    scale: 'regional', source: 'agent',
    startTick: 90, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
  } as unknown as UnifiedAction;
}

function runStep(state: GameState, a: UnifiedAction, tpl: UnifiedActionTemplate, outcome: StepOutcome): UnifiedAction {
  return executeStepResult(
    a, tpl, outcome, [], state, midRng, state.tick,
    { capability: 0.5, probability: 0.5, roll: 50 },
  ).updatedAction;
}

/** An item that writes `amount` to the counterpart's fight clock, once, on the bearer's next encounter outcome. */
const clockCharm = (amount: number): AttachmentEffect => ({
  type: 'resource_manipulate', resource: 'fight_clock', target: 'other_agent', amount, mode: 'one_shot',
});

function monsterClock(graph: WorldGraph): number {
  return (graph.getNode('beast')!.properties.monsterState as Record<string, number>).clockFilled;
}

function clockTraces(): Array<Record<string, any>> {
  return (getTraces() as unknown as Array<Record<string, any>>).filter((t) => t.category === 'fight.clock');
}

function hasCondition(graph: WorldGraph, agentId: string, conditionId: string): boolean {
  return graph.getOutgoingEdges(agentId, 'has_trait').some((e) => e.target === conditionId);
}

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); resetFightEndBranches(); });

// ─── The mailbox at a new fight's start ─────────────────────────

describe('pendingFightClockDelta is cleared at a new fight\'s start, before the nerve step\'s raises', () => {
  it('a stale delta is cleared, and a write the nerve step\'s own raise makes survives', () => {
    const graph = fightWorld();
    graph.getNode('beast')!.properties[FIGHT_CLOCK_MAILBOX_PROP] = 2; // left by an earlier fight
    giveItem(graph, 'hero', 'item.charm', [clockCharm(1)]); // fires on the nerve step's encounter_outcome
    const state = baseState(graph);

    runStep(state, action(), fightTemplate(), 'success'); // the nerve step

    // Not 2 (stale kept) and not 0 (the nerve write wiped as stale): exactly this fight's write.
    expect(graph.getNode('beast')!.properties[FIGHT_CLOCK_MAILBOX_PROP]).toBe(1);
    const traces = clockTraces();
    const cleared = traces.findIndex((t) => t.cause === 'stale_cleared');
    const written = traces.findIndex((t) => t.cause === 'item:item.charm');
    expect(cleared).toBeGreaterThanOrEqual(0);
    expect(written).toBeGreaterThan(cleared);
  });

  it('the nerve step\'s write counts toward the clock at the first clash, but not as that clash\'s blow', () => {
    const graph = fightWorld();
    giveItem(graph, 'hero', 'item.charm', [clockCharm(1)]);
    const state = baseState(graph);
    const tpl = fightTemplate();
    let a = runStep(state, action(), tpl, 'success');
    a = runStep(state, a, tpl, 'failure'); // no band blow; the between-steps drain adds 1
    expect(a.fightState!.clockNow).toBe(1);
    expect(a.fightState!.blowsLanded).toBe(0);
  });
});

// ─── An item's fight_clock on a clash ───────────────────────────

describe('an item with resource_manipulate fight_clock +1 on encounter_outcome', () => {
  it('advances a monster\'s clock in the step it fires', () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clockSize: 4, clockFilled: 0, clockUpdatedTick: TICK } });
    const state = baseState(graph);
    const tpl = fightTemplate();
    let a = runStep(state, action(), tpl, 'success');
    giveItem(graph, 'hero', 'item.charm', [clockCharm(1)]); // attached after the nerve step
    a = runStep(state, a, tpl, 'failure'); // the band lands nothing; the item does

    expect(monsterClock(graph)).toBe(1);
    expect(a.fightState!.clockNow).toBe(1);
    expect(clockTraces().some((t) => t.cause === 'item:item.charm' && t.store === 'monsterState')).toBe(true);
  });

  it('advances a mortal opponent\'s per-fight clock in the same step: the mailbox is drained before the clock-full check', () => {
    const graph = fightWorld();
    const state = baseState(graph);
    const tpl = fightTemplate();
    let a = runStep(state, action(), tpl, 'success');
    giveItem(graph, 'hero', 'item.charm', [clockCharm(1)]);
    a = runStep(state, a, tpl, 'failure');

    expect(a.fightState!.clockNow).toBe(1);
    expect(FIGHT_CLOCK_MAILBOX_PROP in graph.getNode('beast')!.properties).toBe(false);
    expect(a.fightState!.blowsLanded).toBe(1);
  });
});

describe('the item\'s write that fills the clock ends the wielder\'s fight overcome', () => {
  it('a monster: a failed clash plus the item\'s +1 fills the clock → overcome', () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clockSize: 2, clockFilled: 1, clockUpdatedTick: TICK } });
    const state = baseState(graph);
    const tpl = fightTemplate();
    let a = runStep(state, action(), tpl, 'success');
    giveItem(graph, 'hero', 'item.charm', [clockCharm(1)]); // after the nerve step: it fires on the clash
    a = runStep(state, a, tpl, 'failure');

    expect(monsterClock(graph)).toBe(2);
    expect(a.fightState!.result).toBe('overcome');
    expect(a.resolved).toBe(true);
    expect(a.outcome).toBe('success');
  });

  it('a mortal: the item fills the per-fight clock through the mailbox → overcome in that clash', () => {
    const graph = fightWorld();
    const state = baseState(graph);
    const tpl = fightTemplate();
    let a = runStep(state, action(), tpl, 'success');
    a = runStep(state, a, tpl, 'success'); // +1: one short of FIGHT_MORTAL_CLOCK
    expect(a.fightState!.clockNow).toBe(FIGHT_MORTAL_CLOCK - 1);
    giveItem(graph, 'hero', 'item.charm', [clockCharm(1)]);
    a = runStep(state, a, tpl, 'failure');

    expect(a.fightState!.clockNow).toBe(FIGHT_MORTAL_CLOCK);
    expect(a.fightState!.result).toBe('overcome');
    expect(a.resolved).toBe(true);
  });

  it('without the item, the same failed clash leaves the fight running (the item is the cause)', () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clockSize: 2, clockFilled: 1, clockUpdatedTick: TICK } });
    const state = baseState(graph);
    const tpl = fightTemplate();
    let a = runStep(state, action(), tpl, 'success');
    a = runStep(state, a, tpl, 'failure');
    expect(a.fightState!.result).toBeUndefined();
    expect(a.resolved).toBe(false);
  });
});

// ─── The executor site: a reactive-nested fight_clock ───────────

describe('a reactive-nested fight_clock: a monster reactive on damaged that rewinds its own clock', () => {
  it('the clash lands +1, the monster\'s `damaged` reactive rewinds it, and the clock-full check reads the rewound clock', () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clockSize: 2, clockFilled: 1, clockUpdatedTick: TICK } });
    giveItem(graph, 'beast', 'trait.regrowth', [{
      type: 'reactive', trigger: 'damaged', cooldown: 0,
      effect: { type: 'resource_manipulate', resource: 'fight_clock', target: 'self', amount: -1, mode: 'one_shot' },
    } as AttachmentEffect]);
    const state = baseState(graph);
    const tpl = fightTemplate();
    let a = runStep(state, action(), tpl, 'success');
    a = runStep(state, a, tpl, 'success'); // +1 would fill a clock of 2 …

    // … but the beast knits back: 1 + 1 − 1.
    expect(monsterClock(graph)).toBe(1);
    expect(a.fightState!.clockNow).toBe(1);
    expect(a.fightState!.result).toBeUndefined();
    expect(clockTraces().some((t) => t.cause === 'effect:beast' && t.delta === -1)).toBe(true);
  });
});

// ─── The per-tick site ──────────────────────────────────────────

describe('a per-tick fight_clock bleeds an opponent\'s clock', () => {
  const bleed: AttachmentEffect = {
    type: 'resource_manipulate', resource: 'fight_clock', target: 'self', amount: 1, mode: 'per_tick',
  };

  it('a monster bearing a bleed loses a segment every tick', () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clockSize: 4, clockFilled: 0, clockUpdatedTick: TICK } });
    giveItem(graph, 'beast', 'trait.bleeding', [bleed]);
    tickEffects(graph, 'beast', TICK + 1, new Map());
    tickEffects(graph, 'beast', TICK + 2, new Map());
    expect(monsterClock(graph)).toBe(2);
  });

  it('a mortal bearing a bleed: each tick lands in the mailbox, and their fight\'s next step drains it', () => {
    const graph = fightWorld();
    const state = baseState(graph);
    const tpl = fightTemplate();
    let a = runStep(state, action(), tpl, 'success');
    giveItem(graph, 'beast', 'trait.bleeding', [bleed]);
    tickEffects(graph, 'beast', TICK + 1, new Map());
    expect(graph.getNode('beast')!.properties[FIGHT_CLOCK_MAILBOX_PROP]).toBe(1);
    a = runStep(state, a, tpl, 'failure');
    expect(a.fightState!.clockNow).toBe(1);
  });

  it('an essence per-tick drain is untouched by the new branch', () => {
    const graph = fightWorld();
    graph.getNode('beast')!.properties.essence = 5;
    giveItem(graph, 'beast', 'trait.leech', [{
      type: 'resource_manipulate', resource: 'essence', target: 'self', amount: -1, mode: 'per_tick',
    }]);
    tickEffects(graph, 'beast', TICK + 1, new Map());
    expect(graph.getNode('beast')!.properties.essence).toBe(4);
  });
});

// ─── Recovery before the write ──────────────────────────────────

describe('a write after a pending recovery applies the recovery first', () => {
  it('an effect-path write lands on the recovered clock, not on the stale stored value', () => {
    // Filled 3 at tick 0; by TICK two recovery windows have passed, so the clock stands at 1.
    const windows = Math.floor(TICK / FIGHT_CLOCK_RECOVERY_TICKS);
    expect(windows).toBe(2);
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clockSize: 4, clockFilled: 3, clockUpdatedTick: 0 } });
    const state = baseState(graph);
    const exec = executeEffect(
      { type: 'resource_manipulate', resource: 'fight_clock', target: 'other_agent', amount: 1, mode: 'one_shot' },
      { casterId: 'hero', targetId: 'beast', tick: TICK, graph },
    );
    expect(exec.success).toBe(true);
    applyExecutionResult(state, exec, TICK);

    const bag = graph.getNode('beast')!.properties.monsterState as Record<string, number>;
    expect(bag.clockFilled).toBe(3 - windows + 1); // 2, not a clamped 4
    expect(bag.clockUpdatedTick).toBe(TICK);
  });
});

// ─── inflict_condition ──────────────────────────────────────────

describe('inflict_condition on the counterpart applies with tag immunity honoured', () => {
  const hex: AttachmentEffect = { type: 'inflict_condition', conditionTraitId: HEXED, target: 'counterpart', durationTicks: 5 };

  it('a monster\'s reactive on being attacked hexes the fighter who struck it', () => {
    const graph = fightWorld();
    giveItem(graph, 'beast', 'trait.hexing-hide', [{ type: 'reactive', trigger: 'attacked', cooldown: 0, effect: hex } as AttachmentEffect]);
    const state = baseState(graph);
    const tpl = fightTemplate();
    let a = runStep(state, action(), tpl, 'success');
    a = runStep(state, a, tpl, 'success'); // lands → `attacked` on the beast
    expect(a.resolved).toBe(false);

    const edge = graph.getOutgoingEdges('hero', 'has_trait').find((e) => e.target === HEXED);
    expect(edge).toBeDefined();
    expect(edge!.properties.ticksRemaining).toBe(5);
    expect(edge!.properties.inflictedBy).toBe('beast');
  });

  it('a fighter warded against the condition\'s tag is not hexed', () => {
    const graph = fightWorld();
    giveItem(graph, 'beast', 'trait.hexing-hide', [{ type: 'reactive', trigger: 'attacked', cooldown: 0, effect: hex } as AttachmentEffect]);
    giveItem(graph, 'hero', 'item.ward', [{ type: 'tag_immunity', tags: ['#curse'] }]);
    const state = baseState(graph);
    const tpl = fightTemplate();
    let a = runStep(state, action(), tpl, 'success');
    a = runStep(state, a, tpl, 'success');

    expect(hasCondition(graph, 'hero', HEXED)).toBe(false);
  });

  it('target self lands on the caster; a missing counterpart skips without throwing', () => {
    const graph = fightWorld();
    const state = baseState(graph);
    const self = executeEffect({ ...hex, target: 'self' } as AttachmentEffect, { casterId: 'beast', tick: TICK, graph });
    applyExecutionResult(state, self, TICK);
    expect(hasCondition(graph, 'beast', HEXED)).toBe(true);

    const none = executeEffect(hex, { casterId: 'beast', tick: TICK, graph });
    expect(none.success).toBe(false);
    expect(none.conditionRequests).toBeUndefined();
  });

  it('a cascade carries its members\' clock and condition requests', () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clockSize: 4, clockFilled: 0, clockUpdatedTick: TICK } });
    const state = baseState(graph);
    const exec = executeEffect({
      type: 'cascade',
      triggerEffect: hex,
      then: [{ type: 'resource_manipulate', resource: 'fight_clock', target: 'other_agent', amount: 2, mode: 'one_shot' }],
    } as unknown as AttachmentEffect, { casterId: 'hero', targetId: 'beast', tick: TICK, graph });
    applyExecutionResult(state, exec, TICK);
    expect(hasCondition(graph, 'beast', HEXED)).toBe(true);
    expect(monsterClock(graph)).toBe(2);
  });
});

// ─── clock_above ────────────────────────────────────────────────

describe('clock_above: reads the bearer\'s own fight clock', () => {
  it('true above the threshold, false at or below it, and 0 for a mortal with no clock', () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clockSize: 4, clockFilled: 2, clockUpdatedTick: TICK } });
    const beast = buildPredicateContext(graph, 'beast');
    expect(beast.fightClockFilled).toBe(2);
    expect(evaluatePredicate('clock_above:1', beast)).toBe(true);
    expect(evaluatePredicate('clock_above:2', beast)).toBe(false);

    const hero = buildPredicateContext(graph, 'hero');
    expect(evaluatePredicate('clock_above:0', hero)).toBe(false);
    expect(evaluatePredicate('clock_above:nonsense', beast)).toBe(false);
  });

  it('gates a fight_clock effect: an enraged beast rewinds only once it is past half', () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clockSize: 4, clockFilled: 1, clockUpdatedTick: TICK } });
    const rewind: AttachmentEffect = {
      type: 'resource_manipulate', resource: 'fight_clock', target: 'self', amount: -1, mode: 'one_shot',
      condition: 'clock_above:2',
    };
    const low = executeEffect(rewind, { casterId: 'beast', tick: TICK, graph, predicateContext: buildPredicateContext(graph, 'beast') });
    expect(low.fightClockRequests).toBeUndefined();

    (graph.getNode('beast')!.properties.monsterState as Record<string, number>).clockFilled = 3;
    const high = executeEffect(rewind, { casterId: 'beast', tick: TICK, graph, predicateContext: buildPredicateContext(graph, 'beast') });
    expect(high.fightClockRequests).toEqual([{ opponentId: 'beast', delta: -1, cause: 'effect:beast' }]);
  });
});

// ─── Exhaustiveness ─────────────────────────────────────────────

describe('exhaustiveness guards compile, and the new members execute', () => {
  it('executeEffect handles both new vocabulary entries without an unknown-type warning', () => {
    const graph = fightWorld();
    const ctx = { casterId: 'hero', targetId: 'beast', tick: TICK, graph };
    for (const effect of [
      { type: 'inflict_condition', conditionTraitId: HEXED, target: 'counterpart' },
      { type: 'resource_manipulate', resource: 'fight_clock', target: 'other_agent', amount: 1, mode: 'one_shot' },
      { type: 'resource_manipulate', resource: 'essence', target: 'self', amount: 1, mode: 'per_tick' },
    ] as AttachmentEffect[]) {
      const exec = executeEffect(effect, ctx);
      expect(exec.success).toBe(true);
      expect(exec.warnings ?? []).not.toContainEqual(expect.stringContaining('Unknown effect type'));
    }
  });
});
