/**
 * THR-1539 (FB3) — harm, conditions, momentum.
 *
 * Plan doc `Docs/plans/2026-09-23-fight-block.md` §7. Each `describe` is one
 * clause of the slice's Done-when. Bands are handed to `executeStepResult`
 * directly (the roll is FB1's), so each case is exact.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { executeStepResult } from '../../unifiedActionResolution';
import { phaseQuintessence } from '../../phaseQuintessence';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { applyConditionToActor } from '../../encounterAftermath';
import { computeFightErosion, fightMomentumAfter, pendingQuintessenceRatio } from '../fightHarm';
import { fightResultIndex } from '../fightState';
import { resolveFightStepInputs } from '../fightStepInputs';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import {
  FIGHT_BERSERK_HARM_MULT,
  FIGHT_BERSERK_MIGHT_DELTA,
  FIGHT_CLASH_HARM_MULT,
  FIGHT_CLASH_MOMENTUM,
  FIGHT_CONDITION_INTENSITY,
  FIGHT_CONDITION_INTENSITY_SEVERE,
  FIGHT_COURAGE_MODIFIER_NAME,
  FIGHT_HARM_BASE,
  FIGHT_HARM_SOURCE,
  FIGHT_MOMENTUM_MODIFIER_NAME,
  FIGHT_NERVE_CARRY,
  FIGHT_NERVE_COURAGE_WEIGHT,
  FIGHT_NERVE_HARM_MULT,
  FIGHT_RATING_DIFFICULTY,
} from '../../../data/fight-constants';
import {
  DIFFICULTY_EROSION_SCALE,
  EROSION_ATTENDED_MULT,
  QUINTESSENCE_RATIO_FLOOR,
} from '../../../data/nudge-constants';
import { QUINTESSENCE_PASSIVE_REGEN } from '../../../types/quintessence';
import { MEETING_QUINTESSENCE_FLOOR } from '../../../data/meeting-nudge-constants';
import { getUndertakingObjectType, type ObjectVerbContext } from '../../../data/undertaking-objects';
import { SPELL_TEMPLATES, allSpellDefinitionNodes, spellDefinitionNodeId } from '../../../data/spell-templates';
import type { GameState } from '../../../types/gameState';
import type { EffectRuntimeState } from '../../../types/effects';
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
const WOUNDED = 'trait.condition.wounded';
const TERRIFIED = 'trait.condition.terrified';
const SHAKEN = 'trait.condition.shaken';
const INSPIRED = 'trait.condition.inspired';

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

/** A fighter and a mortal opponent on one hex, plus the seeded condition vocabulary. */
function fightWorld(hero: Record<string, unknown> = {}): WorldGraph {
  const graph = new WorldGraph();
  for (const node of CONDITION_TRAIT_DEFINITIONS) graph.addNode(node);
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Den', properties: { hexCol: 2, hexRow: 2 } });
  graph.addNode({
    id: 'hero', type: 'actor', name: 'Hero',
    // Courageous, so FB4's concession fork (THR-1540) never yields mid-harm-chain.
    properties: {
      actorType: 'individual', domainCapabilities: { iron: 14, heart: 14 }, quintessence: 1,
      axiologicalProfile: { courage_prudence: 0.8 }, ...hero,
    },
  });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'loc-1', type: 'located_at', properties: {} });
  graph.addNode({
    id: 'foe', type: 'actor', name: 'Foe',
    properties: { actorType: 'individual', domainCapabilities: { iron: 10 } },
  });
  graph.addEdge({ id: 'e.foe.at', source: 'foe', target: 'loc-1', type: 'located_at', properties: {} });
  return graph;
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

function fightTemplate(clashes = 3, intrinsicTier = 'background'): UnifiedActionTemplate {
  const steps = [fightStep('nerve'), ...Array.from({ length: clashes }, () => fightStep('clash'))];
  return {
    id: 'fight.test',
    rarityTier: 1,
    intrinsicTier,
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
      variants: {},
      fallback: { overview: 'Fallback.', changes: [] },
    },
  } as unknown as UnifiedActionTemplate;
}

function action(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_fight', actorId: 'hero', templateId: 'fight.test', targetId: 'foe',
    scale: 'regional', source: 'agent', effectiveTier: 'background',
    startTick: 90, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
    ...overrides,
  } as unknown as UnifiedAction;
}

function runStep(
  state: GameState,
  a: UnifiedAction,
  tpl: UnifiedActionTemplate,
  outcome: StepOutcome,
  difficulty = 0.35,
): UnifiedAction {
  return executeStepResult(
    a, tpl, outcome, [], state, midRng, state.tick,
    { capability: 0.5, probability: 0.5, roll: 50, difficulty },
  ).updatedAction;
}

function runBands(state: GameState, tpl: UnifiedActionTemplate, bands: StepOutcome[], a0 = action()): UnifiedAction {
  let a = a0;
  for (const band of bands) {
    expect(a.resolved).toBe(false);
    a = runStep(state, a, tpl, band);
  }
  return a;
}

const harmEvents = (state: GameState) =>
  (state.pendingQuintessenceEvents ?? []).filter((e) => e.source === FIGHT_HARM_SOURCE);

const conditionEdges = (graph: WorldGraph, actorId: string, conditionId: string) =>
  graph.getOutgoingEdges(actorId, 'has_trait').filter((e) => e.target === conditionId);

/** Bond `actorId` as the ascendant's First. */
function bondFirst(graph: WorldGraph, actorId: string): void {
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  graph.addEdge({
    id: 'e.thread.first', source: 'asc-1', target: actorId, type: 'thread',
    properties: { courtPosition: 'the_first' },
  });
}

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); });

// ─── Harm ───────────────────────────────────────────────────────

describe('harm per band: computeFightErosion', () => {
  const d = 0.35;
  const scale = 1 + d * DIFFICULTY_EROSION_SCALE;
  const all: StepOutcome[] = ['critical_success', 'success', 'near_miss', 'success_at_cost', 'failure', 'critical_failure'];

  for (const band of all) {
    it(`clash ${band} costs FIGHT_HARM_BASE × ${FIGHT_CLASH_HARM_MULT[band] ?? 0} × the difficulty scale`, () => {
      expect(computeFightErosion({ role: 'clash', band, attended: false, difficulty: d }))
        .toBeCloseTo(FIGHT_HARM_BASE * (FIGHT_CLASH_HARM_MULT[band] ?? 0) * scale, 10);
    });
    it(`nerve ${band} costs FIGHT_HARM_BASE × ${FIGHT_NERVE_HARM_MULT[band] ?? 0} × the difficulty scale`, () => {
      expect(computeFightErosion({ role: 'nerve', band, attended: false, difficulty: d }))
        .toBeCloseTo(FIGHT_HARM_BASE * (FIGHT_NERVE_HARM_MULT[band] ?? 0) * scale, 10);
    });
  }

  it('winning an exchange costs nothing', () => {
    expect(computeFightErosion({ role: 'clash', band: 'success', attended: true, difficulty: 1 })).toBe(0);
    expect(computeFightErosion({ role: 'clash', band: 'critical_success', attended: true, difficulty: 1 })).toBe(0);
  });

  it('attended doubles it (EROSION_ATTENDED_MULT) and berserk multiplies it by 1.5', () => {
    const plain = computeFightErosion({ role: 'clash', band: 'failure', attended: false, difficulty: d });
    expect(computeFightErosion({ role: 'clash', band: 'failure', attended: true, difficulty: d }))
      .toBeCloseTo(plain * EROSION_ATTENDED_MULT, 10);
    expect(computeFightErosion({ role: 'clash', band: 'failure', attended: false, difficulty: d, berserk: true }))
      .toBeCloseTo(plain * FIGHT_BERSERK_HARM_MULT, 10);
  });

  it('the floor holds: harm never takes the ratio below it', () => {
    expect(computeFightErosion({ role: 'clash', band: 'critical_failure', attended: true, difficulty: 1, currentRatio: 0.05 }))
      .toBeCloseTo(0.05 - QUINTESSENCE_RATIO_FLOOR, 10);
    expect(computeFightErosion({ role: 'clash', band: 'failure', attended: false, difficulty: d, currentRatio: QUINTESSENCE_RATIO_FLOOR }))
      .toBe(0);
    expect(computeFightErosion({ role: 'clash', band: 'failure', attended: false, difficulty: d, currentRatio: 0.3, floor: 0.29 }))
      .toBeCloseTo(0.01, 10);
  });
});

describe('harm on the road: queued as fight_harm, attended only from effectiveTier', () => {
  it('a failed clash queues fight_harm on the resolved difficulty, and no generic band quintessence event', () => {
    const state = baseState(fightWorld());
    const tpl = fightTemplate(2);
    let a = runStep(state, action(), tpl, 'success');
    a = runStep(state, a, tpl, 'critical_failure', FIGHT_RATING_DIFFICULTY.severe);
    const harm = harmEvents(state);
    expect(harm).toHaveLength(1);
    expect(harm[0].delta).toBeCloseTo(
      -FIGHT_HARM_BASE * FIGHT_CLASH_HARM_MULT.critical_failure! * (1 + FIGHT_RATING_DIFFICULTY.severe * DIFFICULTY_EROSION_SCALE),
      10,
    );
    // One harm path: the generic `outcome_critical_failure` event is skipped on a fight step.
    expect((state.pendingQuintessenceEvents ?? []).filter((e) => e.source.startsWith('outcome_'))).toEqual([]);
    expect(a.fightState!.harmTaken).toBeCloseTo(-harm[0].delta, 10);
  });

  it("a story_beat template on a background action pays ×1 — the template's intrinsicTier is never read", () => {
    const state = baseState(fightWorld());
    const tpl = fightTemplate(2, 'story_beat');
    runBands(state, tpl, ['success', 'failure'], action({ effectiveTier: 'background' }));
    expect(harmEvents(state)[0].delta).toBeCloseTo(-FIGHT_HARM_BASE * (1 + 0.35 * DIFFICULTY_EROSION_SCALE), 10);
  });

  it('an attended action (effectiveTier story_beat) pays ×2', () => {
    const state = baseState(fightWorld());
    const tpl = fightTemplate(2, 'background');
    runBands(state, tpl, ['success', 'failure'], action({ effectiveTier: 'story_beat' }));
    expect(harmEvents(state)[0].delta)
      .toBeCloseTo(-FIGHT_HARM_BASE * EROSION_ATTENDED_MULT * (1 + 0.35 * DIFFICULTY_EROSION_SCALE), 10);
  });

  it('a berserk opponent makes the harm ×1.5 and the clash steeper by FIGHT_BERSERK_MIGHT_DELTA', () => {
    const state = baseState(fightWorld());
    const tpl = fightTemplate(2);
    let a = runStep(state, action(), tpl, 'success');
    a = { ...a, fightState: { ...a.fightState!, berserk: true } };
    const calm = resolveFightStepInputs(state, { ...a, fightState: { ...a.fightState!, berserk: false } }, tpl.steps[1] as ActionStep, tpl)!;
    const raging = resolveFightStepInputs(state, a, tpl.steps[1] as ActionStep, tpl)!;
    expect(raging.difficulty).toBeCloseTo(calm.difficulty + FIGHT_BERSERK_MIGHT_DELTA, 10);
    runStep(state, a, tpl, 'failure');
    expect(harmEvents(state)[0].delta)
      .toBeCloseTo(-FIGHT_HARM_BASE * FIGHT_BERSERK_HARM_MULT * (1 + 0.35 * DIFFICULTY_EROSION_SCALE), 10);
  });

  it('the floor holds across several queued steps in one tick, not per step', () => {
    const state = baseState(fightWorld({ quintessence: 0.06 }));
    const tpl = fightTemplate(3);
    runBands(state, tpl, ['failure', 'failure', 'failure', 'failure'], action({ effectiveTier: 'story_beat' }));
    expect(pendingQuintessenceRatio(state, 'hero')).toBeCloseTo(QUINTESSENCE_RATIO_FLOOR, 10);
  });
});

describe("The First's fight harm never takes quintessence below MEETING_QUINTESSENCE_FLOOR", () => {
  for (const [role, bands] of [
    ['nerve (routed)', ['critical_failure']],
    ['clash (struck down)', ['success', 'critical_failure']],
  ] as const) {
    it(`even at critical failure: ${role}, attended, severe`, () => {
      const graph = fightWorld({ quintessence: MEETING_QUINTESSENCE_FLOOR + 0.02 });
      bondFirst(graph, 'hero');
      const state = baseState(graph);
      const tpl = fightTemplate(2);
      let a = action({ effectiveTier: 'story_beat' });
      for (const band of bands) a = runStep(state, a, tpl, band, 1);
      expect(a.resolved).toBe(true);
      phaseQuintessence(state);
      expect(graph.getNode('hero')!.properties.quintessence as number)
        .toBeGreaterThanOrEqual(MEETING_QUINTESSENCE_FLOOR - 1e-9);
    });
  }

  it('an unbonded mortal in the same spot falls to the ordinary floor', () => {
    const graph = fightWorld({ quintessence: MEETING_QUINTESSENCE_FLOOR + 0.02 });
    const state = baseState(graph);
    runBands(state, fightTemplate(2), ['success', 'critical_failure'], action({ effectiveTier: 'story_beat' }));
    phaseQuintessence(state);
    expect(graph.getNode('hero')!.properties.quintessence as number).toBeLessThan(MEETING_QUINTESSENCE_FLOOR);
  });
});

// ─── Conditions ─────────────────────────────────────────────────

describe('band conditions land through applyConditionToActor', () => {
  const cases: Array<{ bands: StepOutcome[]; condition: string; intensity: number; label: string }> = [
    { label: 'nerve critical success → inspired', bands: ['critical_success'], condition: INSPIRED, intensity: FIGHT_CONDITION_INTENSITY },
    { label: 'nerve near miss → shaken', bands: ['near_miss'], condition: SHAKEN, intensity: FIGHT_CONDITION_INTENSITY },
    { label: 'nerve at cost → shaken', bands: ['success_at_cost'], condition: SHAKEN, intensity: FIGHT_CONDITION_INTENSITY },
    { label: 'nerve failure → terrified', bands: ['failure'], condition: TERRIFIED, intensity: FIGHT_CONDITION_INTENSITY },
    { label: 'clash at cost → wounded', bands: ['success', 'success_at_cost'], condition: WOUNDED, intensity: FIGHT_CONDITION_INTENSITY },
    { label: 'clash failure → wounded', bands: ['success', 'failure'], condition: WOUNDED, intensity: FIGHT_CONDITION_INTENSITY },
  ];
  for (const c of cases) {
    it(c.label, () => {
      const state = baseState(fightWorld());
      const a = runBands(state, fightTemplate(2), c.bands);
      const edges = conditionEdges(state.graph, 'hero', c.condition);
      expect(edges).toHaveLength(1);
      expect(edges[0].properties.intensity).toBe(c.intensity);
      expect(edges[0].properties.ticksRemaining).toBeGreaterThan(0);
      expect(a.fightState!.conditionsApplied).toContain(c.condition);
    });
  }

  it('a routed fighter carries terrified', () => {
    const state = baseState(fightWorld());
    const a = runBands(state, fightTemplate(2), ['critical_failure']);
    expect(a.fightState!.result).toBe('routed');
    expect(conditionEdges(state.graph, 'hero', TERRIFIED)).toHaveLength(1);
  });

  it('a struck-down fighter carries wounded at FIGHT_CONDITION_INTENSITY_SEVERE', () => {
    const state = baseState(fightWorld());
    const a = runBands(state, fightTemplate(2), ['success', 'critical_failure']);
    expect(a.fightState!.result).toBe('struck_down');
    const edges = conditionEdges(state.graph, 'hero', WOUNDED);
    expect(edges).toHaveLength(1);
    expect(edges[0].properties.intensity).toBe(FIGHT_CONDITION_INTENSITY_SEVERE);
    expect(a.fightState!.conditionsApplied).toEqual([WOUNDED]);
  });

  it('a clean exchange lands nothing', () => {
    const state = baseState(fightWorld());
    const a = runBands(state, fightTemplate(2), ['success', 'success']);
    const conditions = state.graph.getOutgoingEdges('hero', 'has_trait')
      .filter((e) => e.target.startsWith('trait.condition.'));
    expect(conditions).toEqual([]);
    expect(a.fightState!.conditionsApplied).toEqual([]);
  });

  it('the damaged proxy fires for a wound', () => {
    const state = baseState(fightWorld());
    runBands(state, fightTemplate(2), ['success', 'failure']);
    const raised = getTraces().filter((t) => t.category === 'effect.event_raised'
      && (t as unknown as { event?: string }).event === 'damaged');
    expect(raised.length).toBeGreaterThan(0);
  });

  it('tag immunity refuses it — the same gate as every other condition', () => {
    const graph = fightWorld();
    graph.addNode({
      id: 'charm', type: 'artifact', name: 'Steel Nerve',
      properties: { effects: [{ type: 'tag_immunity', tags: ['#combat'] }] },
    });
    graph.addEdge({ id: 'e.charm', source: 'hero', target: 'charm', type: 'possesses', properties: {} });
    const state = baseState(graph);
    const a = runBands(state, fightTemplate(2), ['success', 'failure']);
    expect(conditionEdges(graph, 'hero', WOUNDED)).toEqual([]);
    expect(a.fightState!.conditionsApplied).toEqual([]);
  });
});

describe('applyConditionToActor: the extracted writer', () => {
  it('writes the edge, honours edgeProperties, and reports each refusal', () => {
    const state = baseState(fightWorld());
    const ok = applyConditionToActor(state, 'hero', WOUNDED, {
      tick: 7, intensity: 0.9, durationTicks: 12, edgeProperties: { inflictedBy: 'foe', scarredTick: 7 },
    });
    expect(ok).toEqual({ applied: true, edgeId: `has_trait_hero_${WOUNDED}_7`, intensity: 0.9, durationTicks: 12 });
    const edge = state.graph.getOutgoingEdges('hero', 'has_trait')[0];
    expect(edge.properties).toMatchObject({ appliedAt: 7, durationTicks: 12, ticksRemaining: 12, intensity: 0.9, inflictedBy: 'foe', scarredTick: 7 });

    expect(applyConditionToActor(state, 'ghost', WOUNDED, { tick: 7 })).toMatchObject({ applied: false, reason: 'target_node_missing' });
    expect(applyConditionToActor(state, 'hero', 'trait.condition.nope', { tick: 7 })).toMatchObject({ applied: false, reason: 'condition_template_missing' });
  });

  it('an indefinite condition carries no ticksRemaining counter', () => {
    const state = baseState(fightWorld());
    applyConditionToActor(state, 'hero', SHAKEN, { tick: 3 });
    expect(state.graph.getOutgoingEdges('hero', 'has_trait')[0].properties.ticksRemaining).toBeUndefined();
  });
});

// ─── The ward and the spell's price ─────────────────────────────

function wardedCaster(graph: WorldGraph, id: string): void {
  graph.addNode({
    id: 'ward', type: 'artifact', name: 'Hearthglass Ward',
    properties: { effects: [{ type: 'prevent_loss', channel: 'quintessence', amount: 0.5, consumeOnPrevent: false }] },
  });
  graph.addEdge({ id: 'e.ward', source: id, target: 'ward', type: 'possesses', properties: {} });
}

describe('a ward covers harm but not spell_price (THR-1530 §3)', () => {
  it('a warded fighter takes no fight_harm, but pays a spell price in full', () => {
    const graph = fightWorld();
    wardedCaster(graph, 'hero');
    const state = baseState(graph);
    state.pendingQuintessenceEvents = [
      { targetNodeId: 'hero', delta: -0.1, source: FIGHT_HARM_SOURCE, tick: TICK },
      { targetNodeId: 'hero', delta: -0.2, source: 'spell_price', tick: TICK },
    ];
    phaseQuintessence(state);
    // Passive regen runs in the same phase; it is not what is under test.
    expect(graph.getNode('hero')!.properties.quintessence as number).toBeCloseTo(0.8 + QUINTESSENCE_PASSIVE_REGEN, 10);
  });

  it('an unwarded mortal pays both', () => {
    const graph = fightWorld();
    const state = baseState(graph);
    state.pendingQuintessenceEvents = [
      { targetNodeId: 'hero', delta: -0.1, source: FIGHT_HARM_SOURCE, tick: TICK },
      { targetNodeId: 'hero', delta: -0.2, source: 'spell_price', tick: TICK },
    ];
    phaseQuintessence(state);
    expect(graph.getNode('hero')!.properties.quintessence as number).toBeCloseTo(0.7 + QUINTESSENCE_PASSIVE_REGEN, 10);
  });
});

describe('regression: a warded caster on the use × Power cell now pays the price', () => {
  it('casting through the cell queues spell_price, and the ward no longer swallows it', () => {
    const POWER = getUndertakingObjectType('power')!;
    const use = POWER.verbs.use as (c: ObjectVerbContext) => { success: boolean };
    let paid: { spent: number; price: number } | undefined;
    // Find a shipped spell the cell will cast (its prerequisites met, its roll clean)
    // and whose price is real; the fixture stays the real cell and the real spell.
    outer: for (const spell of SPELL_TEMPLATES) {
      for (let tick = 1; tick <= 40; tick++) {
        const graph = new WorldGraph();
        for (const node of allSpellDefinitionNodes()) graph.addNode(node);
        const all = { iron: 99, heart: 99, veil: 99, star: 99, eye: 99, stone: 99, shadow: 99, weave: 99 };
        graph.addNode({
          id: 'caster', type: 'actor', name: 'Caster',
          properties: {
            actorType: 'individual', quintessence: 1, doom: 0,
            domainCapabilities: all,
            essence: 999, essenceBySphere: {},
          },
        });
        const powerId = spellDefinitionNodeId(spell.id);
        graph.addEdge({ id: 'e.knows', source: 'caster', target: powerId, type: 'has_trait', properties: {} });
        wardedCaster(graph, 'caster');
        const state = baseState(graph);
        const result = use({
          state, graph, actorId: 'caster', handle: { kind: 'node', nodeId: powerId }, tick,
        } as ObjectVerbContext);
        const price = (state.pendingQuintessenceEvents ?? [])
          .filter((e) => e.source === 'spell_price')
          .reduce((s, e) => s + e.delta, 0);
        if (!result.success || price >= 0) continue;
        phaseQuintessence(state);
        paid = { spent: 1 - (graph.getNode('caster')!.properties.quintessence as number), price: -price };
        break outer;
      }
    }
    expect(paid, 'some shipped spell casts through the cell with a price').toBeDefined();
    // Before FB3 the ward swallowed this whole; now the caster pays it.
    expect(paid!.spent + QUINTESSENCE_PASSIVE_REGEN).toBeCloseTo(paid!.price, 10);
    expect(paid!.spent).toBeGreaterThan(0);
  });
});

// ─── Courage and momentum ───────────────────────────────────────

describe('courage on the nerve step and momentum between steps, as named terms', () => {
  it('courage: FIGHT_NERVE_COURAGE_WEIGHT × the live courage_prudence lean, nerve step only', () => {
    const state = baseState(fightWorld({ axiologicalProfile: { courage_prudence: 0.4 } }));
    const tpl = fightTemplate(2);
    const nerve = resolveFightStepInputs(state, action(), tpl.steps[0] as ActionStep, tpl)!;
    const courage = nerve.modifiers.find((m) => m.name === FIGHT_COURAGE_MODIFIER_NAME);
    expect(courage?.delta).toBeCloseTo(FIGHT_NERVE_COURAGE_WEIGHT * 0.4, 10);

    const a = runStep(state, action(), tpl, 'success');
    const clash = resolveFightStepInputs(state, a, tpl.steps[1] as ActionStep, tpl)!;
    expect(clash.modifiers.find((m) => m.name === FIGHT_COURAGE_MODIFIER_NAME)).toBeUndefined();
  });

  it('the momentum chain across three clashes', () => {
    const state = baseState(fightWorld());
    const tpl = fightTemplate(3);
    const momentumOn = (a: UnifiedAction) =>
      resolveFightStepInputs(state, a, tpl.steps[a.currentStep] as ActionStep, tpl)!
        .modifiers.find((m) => m.name === FIGHT_MOMENTUM_MODIFIER_NAME)?.delta ?? 0;

    let a = runStep(state, action(), tpl, 'critical_success');       // nerve
    expect(a.fightState!.momentum).toBe(FIGHT_NERVE_CARRY.critical_success);
    expect(momentumOn(a)).toBeCloseTo(FIGHT_NERVE_CARRY.critical_success!, 10);

    a = runStep(state, a, tpl, 'success');                           // clash 1
    expect(a.fightState!.momentum).toBe(FIGHT_CLASH_MOMENTUM.success);
    expect(momentumOn(a)).toBeCloseTo(FIGHT_CLASH_MOMENTUM.success!, 10);

    // THR-1543 (FB7): a failing exchange draws a mid-fight event, and one that moves
    // momentum (the footing gives, mud and blood) adds to the band's carry. The chain
    // is the band's table plus whatever that event wrote — read off the event itself.
    const complicationsBefore = a.stepComplications?.length ?? 0;
    a = runStep(state, a, tpl, 'failure');                           // clash 2
    const drawn = (a.stepComplications?.length ?? 0) > complicationsBefore ? a.stepComplications!.at(-1) : undefined;
    // The slot type narrows the effects away; the runtime record carries them.
    const drawnEffects = (drawn as { effects?: readonly { type: string; delta?: number }[] } | undefined)?.effects ?? [];
    const eventMomentum = drawnEffects.reduce(
      (sum: number, e) => sum + (e.type === 'fight_momentum' ? e.delta ?? 0 : 0), 0,
    );
    expect(a.fightState!.momentum).toBeCloseTo(FIGHT_CLASH_MOMENTUM.failure! + eventMomentum, 10);
    expect(momentumOn(a)).toBeCloseTo(FIGHT_CLASH_MOMENTUM.failure! + eventMomentum, 10);

    a = runStep(state, a, tpl, 'near_miss');                         // clash 3 (last)
    expect(a.fightState!.momentum).toBe(0);
    expect(a.resolved).toBe(true);
  });

  it('fightMomentumAfter reads the two tables by role', () => {
    expect(fightMomentumAfter('nerve', 'failure')).toBe(FIGHT_NERVE_CARRY.failure);
    expect(fightMomentumAfter('clash', 'critical_success')).toBe(FIGHT_CLASH_MOMENTUM.critical_success);
    expect(fightMomentumAfter('clash', 'critical_failure')).toBe(0);
  });
});
