/**
 * THR-1540 (FB4) — the forks, decided at runtime.
 *
 * Plan doc `Docs/plans/2026-09-23-fight-block.md` §8 (concession, temper), §5
 * (precedence within one clash) and §12 (`fight_offer_quarter`'s side rule). Each
 * `describe` is one clause of the slice's Done-when. Bands are handed to
 * `executeStepResult` directly (the roll is FB1's), so each case is exact; the
 * forks run inside it on the step rng passed in, as in play.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { executeStepResult } from '../../unifiedActionResolution';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { fightResultIndex, createFightState } from '../fightState';
import { isFighterBehind, resolveQuarterOffer, temperCheckpoint } from '../fightForks';
import { readOpponentCard } from '../opponentCard';
import { FIGHT_BERSERK_MIGHT_DELTA, FIGHT_RESULT_ACTION_OUTCOME } from '../../../data/fight-constants';
import { resolveFightStepInputs } from '../fightStepInputs';
import type { GameState } from '../../../types/gameState';
import type { ReachDomain } from '../../../types/traits';
import type {
  ActionStep,
  StepNudge,
  StepOutcome,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import type { FightRole, FightState, FightTemper } from '../../../types/fight';

const TICK = 100;
/** Sits on the coin's negative side (`rng() < 0.5` is the positive pole). */
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
    effectStates: new Map(),
  } as unknown as GameState;
}

interface WorldOpts {
  /** The fighter's values: `courage_prudence`, `mercy_ruthlessness`. */
  readonly profile?: Record<string, number>;
  readonly temper?: FightTemper;
  readonly monsterState?: Record<string, unknown>;
}

function fightWorld(opts: WorldOpts = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Den', properties: { hexCol: 2, hexRow: 2 } });
  graph.addNode({
    id: 'hero', type: 'actor', name: 'Hero',
    properties: {
      actorType: 'individual', domainCapabilities: { iron: 14, heart: 14 },
      ...(opts.profile ? { axiologicalProfile: opts.profile } : {}),
    },
  });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'loc-1', type: 'located_at', properties: {} });
  graph.addNode({
    id: 'beast', type: 'actor', name: 'Beast',
    properties: {
      actorType: 'individual', domainCapabilities: { iron: 10 },
      ...(opts.monsterState ? { monsterState: opts.monsterState } : {}),
    },
  });
  graph.addEdge({ id: 'e.beast.at', source: 'beast', target: 'loc-1', type: 'located_at', properties: {} });
  if (opts.temper) {
    const traitId = `trait.temper.${opts.temper}`;
    graph.addNode({ id: traitId, type: 'trait', name: opts.temper, properties: {} });
    graph.addEdge({ id: 'e.beast.temper', source: 'beast', target: traitId, type: 'has_trait', properties: {} });
  }
  return graph;
}

/** A card arguing one pole of `courage_prudence`. */
function courageCard(toward: 'positive' | 'negative', weight = 0.3): StepNudge {
  return {
    id: `card_${toward}`, name: toward === 'positive' ? 'Stand' : 'Fall back',
    essenceCost: 0, forecastDelta: 0,
    poleLean: { axis: 'courage_prudence', toward, weight },
  } as StepNudge;
}

function fightStep(role: FightRole, nudges?: StepNudge[]): ActionStep {
  const reach: ReachDomain = role === 'nerve' ? 'heart' : 'iron';
  return {
    reach,
    duration: { min: 1, max: 1 },
    difficulty: 0.35,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    fightRole: role,
    ...(nudges ? { nudges } : {}),
  } as ActionStep;
}

function fightTemplate(clashes = 3, nudges?: StepNudge[]): UnifiedActionTemplate {
  const steps = [fightStep('nerve'), ...Array.from({ length: clashes }, () => fightStep('clash', nudges))];
  const variant = (overview: string) => ({ overview, changes: [] });
  return {
    id: 'fight.forks',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Fork Test',
    reach: 'iron',
    crudType: 'update',
    steps,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
    aftermathConfig: {
      branchOnStep: fightResultIndex(steps),
      variants: {
        'fight:overcome': variant('The beast is down.'),
        'fight:yielded': variant('They yielded.'),
        'fight:driven_off': variant('It fled.'),
        'fight:bargained': variant('Terms were struck.'),
        'fight:broke_off': variant('The fight broke off.'),
      },
      fallback: variant('Fallback.'),
    },
  } as unknown as UnifiedActionTemplate;
}

function action(templateId: string, overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_fork', actorId: 'hero', templateId, targetId: 'beast',
    scale: 'regional', source: 'agent',
    startTick: 90, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
    ...overrides,
  } as unknown as UnifiedAction;
}

function runStep(
  state: GameState, a: UnifiedAction, tpl: UnifiedActionTemplate, outcome: StepOutcome, rng = midRng,
): UnifiedAction {
  return executeStepResult(
    a, tpl, outcome, [], state, rng, state.tick, { capability: 0.5, probability: 0.5, roll: 50 },
  ).updatedAction;
}

function runBands(
  state: GameState, tpl: UnifiedActionTemplate, bands: StepOutcome[], a0?: UnifiedAction, rng = midRng,
): UnifiedAction {
  let a = a0 ?? action(tpl.id);
  for (const band of bands) {
    if (a.resolved) break;
    a = runStep(state, a, tpl, band, rng);
  }
  return a;
}

/** A small seeded PRNG, so determinism is tested against a real stream. */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const forkTraces = () =>
  getTraces().filter((t) => t.category === 'fight.fork') as unknown as Array<Record<string, any>>;

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); });

// ─── Concession ─────────────────────────────────────────────────

describe('concession after a wounding clash', () => {
  it('a prudent profile yields: the fight ends yielded, and the action reads failure', () => {
    const state = baseState(fightWorld({ profile: { courage_prudence: -0.8 } }));
    const tpl = fightTemplate(3);
    const a = runBands(state, tpl, ['success', 'failure']);
    expect(a.resolved).toBe(true);
    expect(a.fightState).toMatchObject({ result: 'yielded', wounds: 1 });
    expect(a.outcome).toBe(FIGHT_RESULT_ACTION_OUTCOME.yielded);
    expect(a.fightState!.forks).toEqual([
      { stepIndex: 1, kind: 'concession', side: 'fighter', choice: 'yield', decidedBy: 'conviction' },
    ]);
    expect(a.aftermathSummary?.overview).toBe('They yielded.');
  });

  it('a courageous profile fights on: the fork is recorded and the fight continues', () => {
    const state = baseState(fightWorld({ profile: { courage_prudence: 0.8 } }));
    const tpl = fightTemplate(3);
    const a = runBands(state, tpl, ['success', 'success_at_cost']);
    expect(a.resolved).toBe(false);
    expect(a.fightState!.result).toBeUndefined();
    expect(a.fightState!.forks.at(-1)).toMatchObject({ kind: 'concession', choice: 'fight_on', decidedBy: 'conviction' });
  });

  it('only a wounding clash asks: a clean blow or a near miss takes no concession fork', () => {
    const state = baseState(fightWorld({ profile: { courage_prudence: -0.8 } }));
    const tpl = fightTemplate(3);
    // Clock 2 (mortal): the near miss lands, so the temper checkpoint (stubborn) fires; no concession.
    const a = runBands(state, tpl, ['success', 'near_miss']);
    expect(a.fightState!.forks.filter((f) => f.kind === 'concession')).toEqual([]);
  });

  it('never after the last clash: a wound there ends broke_off, not yielded', () => {
    const state = baseState(fightWorld({ profile: { courage_prudence: -0.8 } }));
    const tpl = fightTemplate(1);
    const a = runBands(state, tpl, ['success', 'failure']);
    expect(a.fightState).toMatchObject({ result: 'broke_off' });
    expect(a.fightState!.forks.filter((f) => f.kind === 'concession')).toEqual([]);
  });

  it('a pole-lean card flips a mildly prudent mortal', () => {
    const mild = { courage_prudence: -0.1 };
    const card = courageCard('positive');
    // Without the card: the mild prudence carries it, and they yield.
    const bare = runBands(baseState(fightWorld({ profile: mild })), fightTemplate(3, [card]), ['success', 'failure']);
    expect(bare.fightState!.result).toBe('yielded');
    // With the card committed on the wounding clash: the hand's lean outweighs it.
    const state = baseState(fightWorld({ profile: mild }));
    const tpl = fightTemplate(3, [card]);
    let a = runStep(state, action(tpl.id), tpl, 'success');
    a = runStep(state, { ...a, activeNudges: [card.id] }, tpl, 'failure');
    expect(a.fightState!.result).toBeUndefined();
    const fork = forkTraces().at(-1)!;
    expect(fork).toMatchObject({ fork: 'concession', choice: 'fight_on', axis: 'courage_prudence', decidedBy: 'conviction' });
    expect(fork.cardLean).toBeCloseTo(0.3);
    expect(fork.profileLean).toBeCloseTo(-0.1);
  });

  it('unattended determinism: the same seed takes the same decision, by the coin', () => {
    const decide = (seed: number) => {
      const state = baseState(fightWorld({ profile: { courage_prudence: 0 } }));
      const tpl = fightTemplate(3);
      return runBands(state, tpl, ['success', 'failure'], undefined, seededRng(seed)).fightState!.forks;
    };
    const first = decide(7);
    expect(first).toEqual(decide(7));
    expect(first.find((f) => f.kind === 'concession')?.decidedBy).toBe('coin');
    // Across seeds the coin lands both ways — it is a real coin, not a constant.
    const choices = new Set(Array.from({ length: 16 }, (_, s) => decide(s).find((f) => f.kind === 'concession')?.choice));
    expect(choices).toEqual(new Set(['yield', 'fight_on']));
  });

  it('forks are never choice memories: only the result memory and card records sit in choiceHistory', () => {
    const state = baseState(fightWorld({ profile: { courage_prudence: -0.8 } }));
    const tpl = fightTemplate(3);
    const a = runBands(state, tpl, ['success', 'failure']);
    expect(a.choiceHistory!.map((m) => m.choiceId)).toEqual(['fight:yielded']);
  });
});

// ─── Temper ─────────────────────────────────────────────────────

describe('the temper checkpoint at half clock', () => {
  it('sits at ceil(clockSize × 0.5), never below 1', () => {
    expect(temperCheckpoint(2)).toBe(1);
    expect(temperCheckpoint(3)).toBe(2);
    expect(temperCheckpoint(4)).toBe(2);
    expect(temperCheckpoint(1)).toBe(1);
  });

  it('skittish: driven off at the checkpoint — the action reads success', () => {
    const state = baseState(fightWorld({ temper: 'skittish', profile: { courage_prudence: 0.8 } }));
    const a = runBands(state, fightTemplate(3), ['success', 'success']);
    expect(a.fightState).toMatchObject({ result: 'driven_off', temperFired: true });
    expect(a.outcome).toBe(FIGHT_RESULT_ACTION_OUTCOME.driven_off);
    expect(a.fightState!.forks).toEqual([
      { stepIndex: 1, kind: 'temper', side: 'opponent', choice: 'fled', decidedBy: 'temper' },
    ]);
    expect(a.aftermathSummary?.overview).toBe('It fled.');
  });

  it('berserk: turns berserk — the next clash is harder by FIGHT_BERSERK_MIGHT_DELTA', () => {
    const world = () => baseState(fightWorld({ temper: 'berserk', profile: { courage_prudence: 0.8 } }));
    const tpl = fightTemplate(3);
    const baseline = world();
    const before = runBands(baseline, tpl, ['success']);
    const plainClash = resolveFightStepInputs(baseline, before, tpl.steps[1] as ActionStep, tpl)!.difficulty;
    const state = world();
    const a = runBands(state, tpl, ['success', 'near_miss']);
    expect(a.fightState).toMatchObject({ berserk: true, temperFired: true });
    expect(a.fightState!.result).toBeUndefined();
    expect(a.fightState!.forks.at(-1)).toMatchObject({ kind: 'temper', choice: 'berserk' });
    const berserkClash = resolveFightStepInputs(state, a, tpl.steps[2] as ActionStep, tpl)!.difficulty;
    expect(berserkClash).toBeCloseTo(plainClash + FIGHT_BERSERK_MIGHT_DELTA);
  });

  it('bargainer, merciful fighter: terms are taken — bargained, read as success_at_cost', () => {
    const state = baseState(fightWorld({
      temper: 'bargainer', profile: { courage_prudence: 0.8, mercy_ruthlessness: 0.7 },
    }));
    const a = runBands(state, fightTemplate(3), ['success', 'success']);
    expect(a.fightState).toMatchObject({ result: 'bargained' });
    expect(a.outcome).toBe(FIGHT_RESULT_ACTION_OUTCOME.bargained);
    expect(a.fightState!.forks.at(-1)).toMatchObject({ kind: 'temper', choice: 'bargain', decidedBy: 'conviction' });
    expect(forkTraces().at(-1)).toMatchObject({ axis: 'mercy_ruthlessness', temper: 'bargainer' });
  });

  it('bargainer, ruthless fighter: terms refused — the fight goes on', () => {
    const state = baseState(fightWorld({
      temper: 'bargainer', profile: { courage_prudence: 0.8, mercy_ruthlessness: -0.7 },
    }));
    const a = runBands(state, fightTemplate(3), ['success', 'success']);
    expect(a.resolved).toBe(false);
    expect(a.fightState!.forks.at(-1)).toMatchObject({ kind: 'temper', choice: 'refuse' });
  });

  it('stubborn (the default, no temper tag): nothing — the fork is still recorded, once', () => {
    const state = baseState(fightWorld({ profile: { courage_prudence: 0.8 } }));
    const a = runBands(state, fightTemplate(3), ['success', 'success', 'near_miss']);
    // Clock 2: the first blow reaches the checkpoint, the second fills it.
    expect(a.fightState).toMatchObject({ result: 'overcome', temperFired: true });
    expect(a.fightState!.forks).toEqual([
      { stepIndex: 1, kind: 'temper', side: 'opponent', choice: 'none', decidedBy: 'temper' },
    ]);
  });

  it('a persistent clock starting past the checkpoint fires temper at the first clash, even on a miss', () => {
    const monsterState = { clockSize: 4, clockFilled: 2, clockUpdatedTick: TICK, temper: 'skittish' };
    const graph = fightWorld({ monsterState, profile: { courage_prudence: 0.8 } });
    const state = baseState(graph);
    const a = runBands(state, fightTemplate(3), ['success', 'failure']);
    expect(a.fightState).toMatchObject({ result: 'driven_off', exchanges: 1 });
    expect(forkTraces()[0]).toMatchObject({ fork: 'temper', choice: 'fled', temperAtStart: true });
    // The lair card may name the temper once it has been seen.
    expect((graph.getNode('beast')!.properties.monsterState as Record<string, unknown>).temperShown).toBe(true);
  });

  it('temperShown is written only when the opponent carries monsterState', () => {
    const graph = fightWorld({ temper: 'stubborn', profile: { courage_prudence: 0.8 } });
    runBands(baseState(graph), fightTemplate(3), ['success', 'success']);
    expect(graph.getNode('beast')!.properties.monsterState).toBeUndefined();
    expect(graph.getNode('beast')!.properties.temperShown).toBeUndefined();
  });

  it('on the last clash, the opponent still answers: a flight there ends driven_off, not broke_off', () => {
    const state = baseState(fightWorld({ temper: 'skittish', profile: { courage_prudence: 0.8 } }));
    const a = runBands(state, fightTemplate(1), ['success', 'near_miss']);
    expect(a.fightState!.result).toBe('driven_off');
  });
});

// ─── Precedence ─────────────────────────────────────────────────

describe('precedence within one clash: overcome, then temper, then concession', () => {
  it('a clash that both fills the clock and wounds ends overcome, with no concession fork', () => {
    const monsterState = { clockSize: 3, clockFilled: 2, clockUpdatedTick: TICK };
    const state = baseState(fightWorld({ monsterState, profile: { courage_prudence: -0.8 } }));
    const a = runBands(state, fightTemplate(3), ['success', 'success_at_cost']);
    expect(a.fightState).toMatchObject({ result: 'overcome', wounds: 1 });
    expect(a.fightState!.forks).toEqual([]);
    expect(forkTraces()).toEqual([]);
  });

  it('a critical that crosses half and fills the clock ends overcome, with no temper fork', () => {
    const state = baseState(fightWorld({ temper: 'skittish', profile: { courage_prudence: 0.8 } }));
    const a = runBands(state, fightTemplate(3), ['success', 'critical_success']);
    expect(a.fightState).toMatchObject({ result: 'overcome', temperFired: false });
    expect(a.fightState!.forks).toEqual([]);
  });

  it('temper that ends the fight pre-empts the concession fork on the same wounding clash', () => {
    const monsterState = { clockSize: 4, clockFilled: 2, clockUpdatedTick: TICK, temper: 'skittish' };
    const state = baseState(fightWorld({ monsterState, profile: { courage_prudence: -0.8 } }));
    const a = runBands(state, fightTemplate(3), ['success', 'success_at_cost']);
    expect(a.fightState!.result).toBe('driven_off');
    expect(a.fightState!.forks.map((f) => f.kind)).toEqual(['temper']);
  });

  it('with a fight_on fork recorded, an aftermath variant keyed on fight:overcome still resolves', () => {
    const state = baseState(fightWorld({ profile: { courage_prudence: 0.8 } }));
    const tpl = fightTemplate(3);
    const a = runBands(state, tpl, ['success', 'failure', 'success', 'success']);
    expect(a.fightState!.forks).toContainEqual(
      { stepIndex: 1, kind: 'concession', side: 'fighter', choice: 'fight_on', decidedBy: 'conviction' },
    );
    expect(a.fightState!.result).toBe('overcome');
    expect(a.choiceHistory!.find((m) => m.stepIndex === fightResultIndex(tpl.steps))?.choiceId).toBe('fight:overcome');
    expect(a.aftermathSummary?.overview).toBe('The beast is down.');
  });
});

// ─── Quarter offered ────────────────────────────────────────────

describe("fight_offer_quarter's side rule", () => {
  function quarterCtx(state: GameState, fight: FightState, opts: { isLast?: boolean; profile?: number } = {}) {
    return {
      state,
      action: action('fight.forks', { currentStep: 2, fightState: fight }),
      templateId: 'fight.forks',
      stepIndex: 2,
      outcome: 'failure' as StepOutcome,
      isLast: opts.isLast ?? false,
      rng: midRng,
      tick: TICK,
    };
  }
  const fightWith = (state: GameState, patch: Partial<FightState>): FightState => ({
    ...createFightState(readOpponentCard(state.graph, 'beast', TICK)), ...patch,
  });

  it('a fighter who is behind is offered quarter: their concession fork runs now', () => {
    const state = baseState(fightWorld({ profile: { courage_prudence: -0.8 } }));
    const fight = fightWith(state, { wounds: 2, blowsLanded: 1, exchanges: 2 });
    expect(isFighterBehind(fight)).toBe(true);
    const out = resolveQuarterOffer(quarterCtx(state, fight))!;
    expect(out.result).toBe('yielded');
    expect(forkTraces().at(-1)).toMatchObject({ fork: 'concession', trigger: 'quarter', choice: 'yield' });
  });

  it('on the last clash a behind fighter\'s offer lapses — traced with choice none', () => {
    const state = baseState(fightWorld({ profile: { courage_prudence: -0.8 } }));
    const fight = fightWith(state, { wounds: 2, blowsLanded: 0, exchanges: 2 });
    const out = resolveQuarterOffer(quarterCtx(state, fight, { isLast: true }))!;
    expect(out.result).toBeUndefined();
    expect(out.forks.at(-1)).toMatchObject({ kind: 'concession', choice: 'none' });
  });

  it('otherwise the opponent is offered quarter: its temper shows now (skittish flees)', () => {
    const state = baseState(fightWorld({ temper: 'skittish' }));
    const fight = fightWith(state, { wounds: 0, blowsLanded: 0, exchanges: 1 });
    const out = resolveQuarterOffer(quarterCtx(state, fight, { isLast: true }))!;
    expect(out).toMatchObject({ result: 'driven_off', temperFired: true });
    expect(forkTraces().at(-1)).toMatchObject({ fork: 'temper', side: 'opponent', trigger: 'quarter' });
  });

  it('a stubborn opponent offered quarter refuses', () => {
    const state = baseState(fightWorld());
    const out = resolveQuarterOffer(quarterCtx(state, fightWith(state, {})))!;
    expect(out.result).toBeUndefined();
    expect(out.forks.at(-1)).toMatchObject({ kind: 'temper', choice: 'refuse', decidedBy: 'temper' });
  });

  it('a temper already shown refuses; a decided fight is left alone', () => {
    const state = baseState(fightWorld({ temper: 'skittish' }));
    const shown = resolveQuarterOffer(quarterCtx(state, fightWith(state, { temperFired: true })))!;
    expect(shown.result).toBeUndefined();
    expect(shown.forks.at(-1)).toMatchObject({ choice: 'refuse' });
    const decided = fightWith(state, { result: 'overcome' });
    expect(resolveQuarterOffer(quarterCtx(state, decided))).toBe(decided);
  });
});
