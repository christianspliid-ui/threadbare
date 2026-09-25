/**
 * THR-1541 (FB5) — fight events.
 *
 * Plan doc `Docs/plans/2026-09-23-fight-block.md` §9. Each `describe` is one clause
 * of the slice's Done-when. Bands are handed to `executeStepResult` directly (the
 * roll is FB1's), so each case is exact; the odds cases read the next step's inputs
 * through `resolveFightStepInputs` — the one function the roll and the forecast
 * both call — and through `resolveUncontestedStep`, which rolls on them.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { executeStepResult, resolveUncontestedStep } from '../../unifiedActionResolution';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { processEffectEvent } from '../../effects/effectEvents';
import { resolveFightStepInputs } from '../fightStepInputs';
import { fightResultIndex } from '../fightState';
import { FIGHT_END_BRANCHES, resetFightEndBranches } from '../fightOutcome';
import { markMortalDead } from '../../agentLifecycle';
import { FIGHT_STANDING_MODIFIER_NAME } from '../../../data/fight-constants';
import type { GameState } from '../../../types/gameState';
import type { AttachmentEffect, EffectRuntimeState } from '../../../types/effects';
import type { ReachDomain } from '../../../types/traits';
import type {
  ActionStep,
  StepOutcome,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import type { FightRole } from '../../../types/fight';

const TICK = 100;
const midRng = () => 0.5;

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

/** A courageous fighter (fights on after every wound) and a mortal opponent on one hex. */
function fightWorld(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Den', properties: { hexCol: 2, hexRow: 2 } });
  graph.addNode({ id: 'loc-far', type: 'location', name: 'Far', properties: { hexCol: 9, hexRow: 9 } });
  graph.addNode({
    id: 'hero', type: 'actor', name: 'Hero',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: 14, heart: 14, star: 14 },
      axiologicalProfile: { courage_prudence: 0.8 },
    },
  });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'loc-1', type: 'located_at', properties: {} });
  graph.addNode({
    id: 'beast', type: 'actor', name: 'Beast',
    properties: { actorType: 'individual', domainCapabilities: { iron: 10 } },
  });
  graph.addEdge({ id: 'e.beast.at', source: 'beast', target: 'loc-1', type: 'located_at', properties: {} });
  return graph;
}

function giveItem(graph: WorldGraph, ownerId: string, itemId: string, effects: AttachmentEffect[], tags?: string[]): void {
  graph.addNode({ id: itemId, type: 'artifact', name: itemId, properties: { effects, ...(tags ? { tags } : {}) } });
  graph.addEdge({ id: `e.${ownerId}.${itemId}`, source: ownerId, target: itemId, type: 'possesses', properties: {} });
}

function fightStep(role: FightRole, reach: ReachDomain = role === 'nerve' ? 'heart' : 'iron'): ActionStep {
  return {
    reach,
    duration: { min: 1, max: 1 },
    difficulty: 0.35,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    fightRole: role,
  } as ActionStep;
}

/** A terminal block: nerve + `clashes` clash steps. */
function fightTemplate(clashes = 2): UnifiedActionTemplate {
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

function action(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_fight', actorId: 'hero', templateId: 'fight.test', targetId: 'beast',
    scale: 'regional', source: 'agent',
    startTick: 90, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
    ...overrides,
  } as unknown as UnifiedAction;
}

/** Resolve the action's current step with a given band, optionally on a resolved reach. */
function runStep(
  state: GameState,
  a: UnifiedAction,
  tpl: UnifiedActionTemplate,
  outcome: StepOutcome,
  reach?: ReachDomain,
): UnifiedAction {
  return executeStepResult(
    a, tpl, outcome, [], state, midRng, state.tick,
    { capability: 0.5, probability: 0.5, roll: 50, ...(reach ? { reach } : {}) },
  ).updatedAction;
}

function runBands(state: GameState, tpl: UnifiedActionTemplate, bands: StepOutcome[]): UnifiedAction {
  let a = action();
  for (const band of bands) {
    expect(a.resolved).toBe(false);
    a = runStep(state, a, tpl, band);
  }
  return a;
}

/** `effect.event_raised` traces, optionally filtered by event and agent. */
function raised(event?: string, agentId?: string): Array<Record<string, any>> {
  return (getTraces() as unknown as Array<Record<string, any>>).filter((t) =>
    t.category === 'effect.event_raised'
    && (event === undefined || t.event === event)
    && (agentId === undefined || t.agentId === agentId));
}

function standing(state: GameState, a: UnifiedAction, tpl: UnifiedActionTemplate): number {
  const step = tpl.steps[a.currentStep] as ActionStep;
  const inputs = resolveFightStepInputs(state, a, step, tpl)!;
  return inputs.modifiers.find((m) => m.name === FIGHT_STANDING_MODIFIER_NAME)?.delta ?? 0;
}

/** A reactive that fires on `trigger` and does nothing visible (a tag nothing carries). */
const inertReactive = (trigger: string): AttachmentEffect => ({
  type: 'reactive', trigger, cooldown: 0,
  effect: { type: 'dispel', target: 'attachment', tags: ['tag.nothing.carries'] },
} as unknown as AttachmentEffect);

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); resetFightEndBranches(); });

// ─── attacked ───────────────────────────────────────────────────

describe('a reactive `attacked` trait on an opponent fires once per landing clash', () => {
  it('fires once for each clash that lands and not for one that misses', () => {
    const graph = fightWorld();
    giveItem(graph, 'beast', 'item.thorns', [inertReactive('attacked')]);
    const state = baseState(graph);
    const tpl = fightTemplate(3);
    // nerve, a landing success (+1), a failure (0), then the fight ends at the last clash.
    runBands(state, tpl, ['success', 'success', 'failure', 'failure']);
    const onBeast = raised('attacked', 'beast');
    expect(onBeast).toHaveLength(1);
    expect(onBeast[0].reactivesFired).toBe(1);
    expect(onBeast[0].site).toBe('fight_clash');
  });

  it('a traded blow (near miss, at cost) strikes the fighter too; a clean hit does not', () => {
    const graph = fightWorld();
    giveItem(graph, 'hero', 'item.hero-thorns', [inertReactive('attacked')]);
    const state = baseState(graph);
    runBands(state, fightTemplate(3), ['success', 'success']);
    expect(raised('attacked', 'hero')).toHaveLength(0);
    clearTraces();
    const state2 = baseState(fightWorld());
    giveItem(state2.graph, 'hero', 'item.hero-thorns', [inertReactive('attacked')]);
    runBands(state2, fightTemplate(3), ['success', 'near_miss']);
    const onHero = raised('attacked', 'hero');
    expect(onHero).toHaveLength(1);
    expect(onHero[0].reactivesFired).toBe(1);
  });

  it('the landing clash also raises `damaged` on the opponent for the clock it moved', () => {
    const graph = fightWorld();
    giveItem(graph, 'beast', 'item.hide', [{ type: 'stacking', reach: 'iron', valuePerStack: 0.01, maxStacks: 5, stackOn: 'on_damaged' } as AttachmentEffect]);
    const state = baseState(graph);
    runBands(state, fightTemplate(3), ['success', 'success']);
    expect(raised('damaged', 'beast')).toHaveLength(1);
    expect(state.effectStates!.get('item.hide')?.stacks).toBe(1);
  });

  it('a reactive receives the other side as its target (counterpartId → targetId)', () => {
    // The beast's thorns dispel the striker's ward: the target is the hero, not the beast.
    const graph = fightWorld();
    giveItem(graph, 'beast', 'item.thorns', [{
      type: 'reactive', trigger: 'attacked', cooldown: 0,
      effect: { type: 'dispel', target: 'attachment', tags: ['ward'] },
    } as unknown as AttachmentEffect]);
    giveItem(graph, 'hero', 'item.ward', [], ['ward']);
    giveItem(graph, 'beast', 'item.beast-ward', [], ['ward']);
    const state = baseState(graph);
    runBands(state, fightTemplate(3), ['success', 'success']);
    expect(graph.getNode('item.ward')).toBeUndefined();
    expect(graph.getNode('item.beast-ward')).toBeDefined();
  });
});

// ─── on_kill ────────────────────────────────────────────────────

describe('`on_kill` stacks on `overcome`', () => {
  const trophy = { type: 'stacking', reach: 'iron', valuePerStack: 0.02, maxStacks: 5, stackOn: 'on_kill' } as AttachmentEffect;

  it('a won fight adds one `on_kill` stack to the fighter', () => {
    const graph = fightWorld();
    giveItem(graph, 'hero', 'item.trophy', [trophy]);
    const state = baseState(graph);
    const a = runBands(state, fightTemplate(3), ['success', 'success', 'success']);
    expect(a.fightState!.result).toBe('overcome');
    expect(raised('opponent_overcome', 'hero')).toHaveLength(1);
    expect(state.effectStates!.get('item.trophy')?.stacks).toBe(1);
  });

  it('a fight that breaks off adds none', () => {
    const graph = fightWorld();
    giveItem(graph, 'hero', 'item.trophy', [trophy]);
    const state = baseState(graph);
    const a = runBands(state, fightTemplate(2), ['success', 'failure', 'failure']);
    expect(a.fightState!.result).toBe('broke_off');
    expect(raised('opponent_overcome')).toHaveLength(0);
    expect(state.effectStates!.get('item.trophy')?.stacks ?? 0).toBe(0);
  });
});

// ─── combat_started / combat_ended ──────────────────────────────

describe('`combat_started` expiry and `leave_combat` behave', () => {
  const untilEvent = (event: string): AttachmentEffect =>
    ({ type: 'until_event', event, reach: 'eye', value: 0.01, destroyOnEvent: true } as unknown as AttachmentEffect);

  it('an `enter_combat` attachment is spent when the nerve step resolves, on both sides', () => {
    const graph = fightWorld();
    giveItem(graph, 'hero', 'item.calm', [untilEvent('enter_combat')]);
    giveItem(graph, 'beast', 'item.sleep', [untilEvent('enter_combat')]);
    const state = baseState(graph);
    const a = runStep(state, action(), fightTemplate(2), 'success');
    expect(a.resolved).toBe(false);
    expect(graph.getNode('item.calm')).toBeUndefined();
    expect(graph.getNode('item.sleep')).toBeUndefined();
    const started = raised('combat_started');
    expect(started.map((t) => t.agentId).sort()).toEqual(['beast', 'hero']);
    // Raised before the step's outcome.
    const all = raised();
    expect(all.findIndex((t) => t.event === 'combat_started'))
      .toBeLessThan(all.findIndex((t) => t.event === 'encounter_outcome'));
  });

  it('a `leave_combat` attachment survives every exchange and is spent once the fight ends', () => {
    const graph = fightWorld();
    giveItem(graph, 'hero', 'item.battle-fury', [untilEvent('leave_combat')]);
    const state = baseState(graph);
    const tpl = fightTemplate(2);
    let a = runStep(state, action(), tpl, 'success');
    a = runStep(state, a, tpl, 'failure');
    expect(a.resolved).toBe(false);
    expect(graph.getNode('item.battle-fury')).toBeDefined();
    a = runStep(state, a, tpl, 'failure');
    expect(a.resolved).toBe(true);
    expect(graph.getNode('item.battle-fury')).toBeUndefined();
    expect(raised('combat_ended').map((t) => t.agentId).sort()).toEqual(['beast', 'hero']);
  });

  it('a routed fighter still leaves combat', () => {
    const graph = fightWorld();
    giveItem(graph, 'hero', 'item.battle-fury', [untilEvent('leave_combat')]);
    const state = baseState(graph);
    const a = runStep(state, action(), fightTemplate(2), 'critical_failure');
    expect(a.fightState!.result).toBe('routed');
    expect(graph.getNode('item.battle-fury')).toBeUndefined();
  });

  it('a fight that ends before any roll neither starts nor ends combat', () => {
    const graph = fightWorld();
    giveItem(graph, 'hero', 'item.battle-fury', [untilEvent('leave_combat')]);
    markMortalDead(graph, 'beast', TICK, { cause: 'fight', byActorId: 'hero', mode: 'retain' });
    const state = baseState(graph);
    const tpl = fightTemplate(2);
    const r = resolveUncontestedStep(action(), tpl, state, midRng);
    expect(r.fightEnd?.reason).toBe('opponent_gone');
    executeStepResult(action(), tpl, r.outcome, r.opsToExecute, state, midRng, state.tick,
      { capability: r.capability, probability: r.probability, roll: r.roll, fightEnd: r.fightEnd });
    expect(raised('combat_started')).toHaveLength(0);
    expect(raised('combat_ended')).toHaveLength(0);
    expect(graph.getNode('item.battle-fury')).toBeDefined();
  });

  it('a fight that separates mid-fight ends combat on the no-roll route, once', () => {
    const graph = fightWorld();
    const state = baseState(graph);
    const tpl = fightTemplate(2);
    const a = runStep(state, action(), tpl, 'success');
    graph.removeEdge('e.beast.at');
    graph.addEdge({ id: 'e.beast.far', source: 'beast', target: 'loc-far', type: 'located_at', properties: {} });
    const r = resolveUncontestedStep(a, tpl, state, midRng);
    expect(r.fightEnd?.reason).toBe('separated');
    executeStepResult(a, tpl, r.outcome, r.opsToExecute, state, midRng, state.tick,
      { capability: r.capability, probability: r.probability, roll: r.roll, fightEnd: r.fightEnd });
    expect(raised('combat_ended').map((t) => t.agentId).sort()).toEqual(['beast', 'hero']);
  });
});

// ─── the combat field ───────────────────────────────────────────

describe('a Soulfire-style reach-swapped exchange still stacks `combat_success`', () => {
  const soulfire = { type: 'stacking', reach: 'star', valuePerStack: 0.03, maxStacks: 5, stackOn: 'combat_success' } as AttachmentEffect;

  it('the event\'s `combat` field, not its reach, classifies it', () => {
    const graph = fightWorld();
    giveItem(graph, 'hero', 'item.soulfire', [soulfire]);
    const star = processEffectEvent(graph, 'hero', { type: 'encounter_outcome', reach: 'star', success: true }, new Map(), TICK);
    expect(star.updatedStates.get('item.soulfire')?.stacks).toBeUndefined();
    const fought = processEffectEvent(graph, 'hero', { type: 'encounter_outcome', reach: 'star', success: true, combat: true }, new Map(), TICK);
    expect(fought.updatedStates.get('item.soulfire')?.stacks).toBe(1);
  });

  it('a clash resolved on Star stacks it through the fight handler, on the resolved reach', () => {
    const graph = fightWorld();
    giveItem(graph, 'hero', 'item.soulfire', [soulfire]);
    const state = baseState(graph);
    const tpl = fightTemplate(3);
    let a = runStep(state, action(), tpl, 'failure'); // a failed nerve: no stack
    expect(state.effectStates!.get('item.soulfire')?.stacks ?? 0).toBe(0);
    a = runStep(state, a, tpl, 'success', 'star');
    expect(state.effectStates!.get('item.soulfire')?.stacks).toBe(1);
    const outcome = raised('encounter_outcome', 'hero').at(-1)!;
    expect(outcome.site).toBe('fight_step');
  });
});

// ─── timing and the odds ────────────────────────────────────────

describe('a reactive on `combat_started` moves the first clash, not the nerve roll', () => {
  function roarWorld(withRoar: boolean): { state: GameState; tpl: UnifiedActionTemplate } {
    const graph = fightWorld();
    // The hero's charm helps both the nerve (Heart) and the clash (Iron).
    giveItem(graph, 'hero', 'item.charm', [
      { type: 'passive', reach: 'heart', value: 0.05 } as AttachmentEffect,
      { type: 'passive', reach: 'iron', value: 0.05 } as AttachmentEffect,
    ], ['charm']);
    if (withRoar) {
      // The beast's roar strips the charm of whoever it is fighting.
      giveItem(graph, 'beast', 'item.roar', [{
        type: 'reactive', trigger: 'encounter_started', cooldown: 0,
        effect: { type: 'dispel', target: 'attachment', tags: ['charm'] },
      } as unknown as AttachmentEffect]);
    }
    return { state: baseState(graph), tpl: fightTemplate(2) };
  }

  it('the nerve roll carries the charm; the first clash does not', () => {
    const { state, tpl } = roarWorld(true);
    const nerve = action();
    expect(standing(state, nerve, tpl)).toBeCloseTo(0.05, 10);
    const pNerve = resolveUncontestedStep(nerve, tpl, state, midRng).probability;
    const afterNerve = runStep(state, nerve, tpl, 'success');
    expect(state.graph.getNode('item.charm')).toBeUndefined();
    expect(standing(state, afterNerve, tpl)).toBe(0);

    // Control: without the roar, the same first clash keeps the charm.
    const control = roarWorld(false);
    const pControlNerve = resolveUncontestedStep(action(), control.tpl, control.state, midRng).probability;
    expect(pNerve).toBe(pControlNerve);
    const controlAfter = runStep(control.state, action(), control.tpl, 'success');
    expect(standing(control.state, controlAfter, control.tpl)).toBeCloseTo(0.05, 10);
    expect(resolveUncontestedStep(afterNerve, tpl, state, midRng).probability)
      .toBeLessThan(resolveUncontestedStep(controlAfter, control.tpl, control.state, midRng).probability);
  });
});

describe('a stack earned on one exchange moves the next exchange\'s odds', () => {
  it('each won exchange adds its stack to the next clash\'s standing modifiers', () => {
    const graph = fightWorld();
    giveItem(graph, 'hero', 'item.blade', [
      { type: 'stacking', reach: 'iron', valuePerStack: 0.04, maxStacks: 3, stackOn: 'combat_success' } as AttachmentEffect,
    ]);
    const state = baseState(graph);
    const tpl = fightTemplate(3);
    let a = action();
    expect(standing(state, a, tpl)).toBe(0);
    a = runStep(state, a, tpl, 'success'); // the nerve step is a fight exchange too
    const first = standing(state, a, tpl);
    expect(first).toBeCloseTo(0.04, 10);
    const pFirst = resolveUncontestedStep(a, tpl, state, midRng).probability;
    a = runStep(state, a, tpl, 'success');
    expect(a.resolved).toBe(false);
    expect(standing(state, a, tpl)).toBeCloseTo(0.08, 10);
    expect(resolveUncontestedStep(a, tpl, state, midRng).probability).toBeGreaterThan(pFirst);
  });
});
