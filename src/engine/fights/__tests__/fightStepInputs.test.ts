/**
 * THR-1537 (FB1) — fight steps read their opponent.
 *
 * Plan doc `Docs/plans/2026-09-23-fight-block.md` §1–3c. Each `describe` below is
 * one clause of the slice's Done-when. They drive the real road —
 * `resolveUncontestedStep`, `executeStepResult`, `phaseUnifiedActionProgress` —
 * because "the input is derived but nothing reads it" is exactly the failure a
 * unit test of `resolveFightStepInputs` alone could not catch.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../../graph';
import {
  executeStepResult,
  phaseUnifiedActionProgress,
  resolveUncontestedStep,
} from '../../unifiedActionResolution';
import { collectBandOppositions } from '../../groups/bandOpposition';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../../traceBuffer';
import { computeRawScore } from '../../domainCapability';
import { createSimulationRuntime } from '../../simulationRuntime';
import { readOpponentCard, deriveMightWord } from '../opponentCard';
import { isActionOnFightStep, resolveFightStepInputs } from '../fightStepInputs';
import {
  FIGHT_CLOCK_RECOVERY_TICKS,
  FIGHT_RATING_DIFFICULTY,
  FIGHT_RATING_WORDS,
  FIGHT_STEP_SCALE,
} from '../../../data/fight-constants';
import type { GameState } from '../../../types/gameState';
import type { AttachmentEffect, EffectRuntimeState } from '../../../types/effects';
import type { ReachDomain } from '../../../types/traits';
import type {
  ActionScale,
  ActionStep,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';
import type { FightRatingWord, FightRole } from '../../../types/fight';

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

/** A fighter and an opponent on one location. */
function fightWorld(opts: {
  fighterCaps?: Partial<Record<ReachDomain, number>>;
  monsterState?: Record<string, unknown>;
  opponentCaps?: Partial<Record<ReachDomain, number>>;
} = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'loc-1', type: 'location', name: 'Den', properties: { hexCol: 2, hexRow: 2 } });
  graph.addNode({
    id: 'hero', type: 'actor', name: 'Hero',
    properties: { actorType: 'individual', domainCapabilities: opts.fighterCaps ?? { iron: 14, eye: 14, heart: 14, star: 14 } },
  });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'loc-1', type: 'located_at', properties: {} });
  graph.addNode({
    id: 'beast', type: 'actor', name: 'Beast',
    properties: {
      actorType: 'individual',
      domainCapabilities: opts.opponentCaps ?? { iron: 10 },
      ...(opts.monsterState ? { monsterState: opts.monsterState } : {}),
    },
  });
  graph.addEdge({ id: 'e.beast.at', source: 'beast', target: 'loc-1', type: 'located_at', properties: {} });
  return graph;
}

function giveItem(graph: WorldGraph, ownerId: string, itemId: string, effects: AttachmentEffect[]): void {
  graph.addNode({ id: itemId, type: 'artifact', name: itemId, properties: { effects } });
  graph.addEdge({ id: `e.${ownerId}.${itemId}`, source: ownerId, target: itemId, type: 'possesses', properties: {} });
}

function fightStep(role: FightRole | undefined, reach: ReachDomain = 'iron', difficulty = 0.35): ActionStep {
  return {
    reach,
    duration: { min: 1, max: 1 },
    difficulty,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    ...(role ? { fightRole: role } : {}),
  } as ActionStep;
}

function template(step: ActionStep, scale: ActionScale = 'regional', id = 'fight.test'): UnifiedActionTemplate {
  return {
    id,
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Fight Test',
    reach: step.reach,
    crudType: 'update',
    scale,
    steps: [step],
    apCost: 1,
    actorAffinities: ['individual', 'group'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
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

function fightTraces() {
  return getTraces().filter((t) => t.category === 'fight.step') as unknown as Array<Record<string, any>>;
}

beforeEach(() => { clearTraces(); enableTracing(); });
afterEach(() => { clearTraces(); disableTracing(); });

// ─── The card ───────────────────────────────────────────────────

describe('readOpponentCard — all three sources', () => {
  it('reads a monster card, with lazy recovery at read time', () => {
    const graph = fightWorld({
      monsterState: {
        dread: 'steep', might: 'severe', clashReach: 'eye',
        clockSize: 4, clockFilled: 3, clockUpdatedTick: TICK - 2 * FIGHT_CLOCK_RECOVERY_TICKS,
        temper: 'bargainer',
      },
    });
    const card = readOpponentCard(graph, 'beast', TICK);
    expect(card).toMatchObject({
      source: 'monsterState', dread: 'steep', might: 'severe', clashReach: 'eye',
      clockSize: 4, clockFilled: 1, persistent: true, temper: 'bargainer', opponentId: 'beast',
    });
  });

  it('reads a malformed monster card fail-soft: unknown word → fair, NaN → 0, clamped clock', () => {
    const graph = fightWorld({ monsterState: { dread: 'huge', might: 42, clockSize: 3, clockFilled: Number.NaN } });
    expect(readOpponentCard(graph, 'beast', TICK)).toMatchObject({ dread: 'fair', might: 'fair', clockFilled: 0 });
    const overfull = fightWorld({ monsterState: { dread: 'gentle', might: 'gentle', clockSize: 3, clockFilled: 99 } });
    expect(readOpponentCard(overfull, 'beast', TICK).clockFilled).toBe(3);
  });

  it('derives a mortal card from the raw clash-reach score; Dread one word below Might', () => {
    const graph = fightWorld({ opponentCaps: { iron: 25 } });
    expect(readOpponentCard(graph, 'beast', TICK)).toMatchObject({
      source: 'derived', might: 'steep', dread: 'fair', persistent: false, clockSize: 2, temper: 'stubborn',
    });
    expect([deriveMightWord(31), deriveMightWord(22), deriveMightWord(15), deriveMightWord(3)])
      .toEqual(['severe', 'steep', 'fair', 'gentle']);
  });

  it('a famous mortal is one Dread word harder, and a temper trait is read', () => {
    const graph = fightWorld({ opponentCaps: { iron: 25 } });
    graph.updateNode('beast', { properties: { ...graph.getNode('beast')!.properties, reputationScore: 0.9 } });
    graph.addNode({ id: 'trait.temper.berserk', type: 'trait', name: 'Berserk', properties: {} });
    graph.addEdge({ id: 'e.beast.temper', source: 'beast', target: 'trait.temper.berserk', type: 'has_trait', properties: {} });
    expect(readOpponentCard(graph, 'beast', TICK)).toMatchObject({ dread: 'steep', temper: 'berserk' });
  });

  it('falls back to the default card for a missing node', () => {
    expect(readOpponentCard(new WorldGraph(), 'ghost', TICK)).toMatchObject({
      source: 'default', dread: 'fair', might: 'fair', clockSize: 3, clockFilled: 0,
    });
  });

  it('is pure: reading changes nothing on the node', () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clockSize: 3, clockFilled: 2, clockUpdatedTick: 0 } });
    const before = JSON.stringify(graph.getNode('beast')!.properties);
    readOpponentCard(graph, 'beast', TICK);
    readOpponentCard(graph, 'beast', TICK);
    expect(JSON.stringify(graph.getNode('beast')!.properties)).toBe(before);
  });
});

// ─── Difficulty ─────────────────────────────────────────────────

describe('difficulty per word', () => {
  it.each(FIGHT_RATING_WORDS)('a %s card prices clash by Might and nerve by Dread', (word: FightRatingWord) => {
    const graph = fightWorld({ monsterState: { dread: word, might: word, clockSize: 3, clockFilled: 0 } });
    const state = baseState(graph);
    for (const role of ['nerve', 'clash'] as const) {
      const step = fightStep(role);
      const inputs = resolveFightStepInputs(state, action('fight.test'), step, template(step))!;
      expect(inputs.difficulty).toBeCloseTo(FIGHT_RATING_DIFFICULTY[word], 10);
    }
  });

  it('nerve reads Dread and clash reads Might when they differ', () => {
    const graph = fightWorld({ monsterState: { dread: 'gentle', might: 'severe', clockSize: 3, clockFilled: 0 } });
    const state = baseState(graph);
    const nerve = resolveFightStepInputs(state, action('t'), fightStep('nerve', 'heart'), template(fightStep('nerve')))!;
    const clash = resolveFightStepInputs(state, action('t'), fightStep('clash'), template(fightStep('clash')))!;
    expect(nerve.difficulty).toBe(FIGHT_RATING_DIFFICULTY.gentle);
    expect(clash.difficulty).toBe(FIGHT_RATING_DIFFICULTY.severe);
  });

  it("the opponent's own modifiers for the reach price the step", () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clockSize: 3, clockFilled: 0 } });
    giveItem(graph, 'beast', 'item.claws', [{ type: 'passive', reach: 'iron', value: 0.05 } as AttachmentEffect]);
    const step = fightStep('clash');
    const inputs = resolveFightStepInputs(baseState(graph), action('t'), step, template(step))!;
    expect(inputs.opponentModifierDelta).toBeCloseTo(0.05, 10);
    expect(inputs.difficulty).toBeCloseTo(FIGHT_RATING_DIFFICULTY.fair + 0.05, 10);
  });

  it('the roll reads the card, never the placeholder difficulty', () => {
    const easy = fightWorld({ monsterState: { dread: 'gentle', might: 'gentle', clockSize: 3, clockFilled: 0 } });
    const hard = fightWorld({ monsterState: { dread: 'severe', might: 'severe', clockSize: 3, clockFilled: 0 } });
    const step = fightStep('clash');
    const pEasy = resolveUncontestedStep(action('fight.test'), template(step), baseState(easy), midRng).probability;
    const pHard = resolveUncontestedStep(action('fight.test'), template(step), baseState(hard), midRng).probability;
    expect(pEasy).toBeGreaterThan(pHard);
  });

  it('an ordinary step is untouched: no fight inputs, no fight.step trace', () => {
    const graph = fightWorld();
    const step = fightStep(undefined);
    expect(resolveFightStepInputs(baseState(graph), action('t'), step, template(step))).toBeUndefined();
    resolveUncontestedStep(action('fight.test'), template(step), baseState(graph), midRng);
    expect(fightTraces()).toHaveLength(0);
  });
});

// ─── Scale ──────────────────────────────────────────────────────

describe('a local template’s fight step resolves at regional', () => {
  it('the fight.step and resolution.input traces both show the regional scale', () => {
    const step = fightStep('clash');
    resolveUncontestedStep(action('fight.test'), template(step, 'local'), baseState(fightWorld()), midRng);
    const [fight] = fightTraces();
    expect(fight.scale).toBe(FIGHT_STEP_SCALE);
    const input = getTraces().find((t) => t.category === 'resolution.input') as unknown as Record<string, unknown>;
    expect(input.scale).toBe('regional');
  });

  it('an ordinary step on a local template still resolves at local', () => {
    const step = fightStep(undefined);
    resolveUncontestedStep(action('fight.test'), template(step, 'local'), baseState(fightWorld()), midRng);
    const input = getTraces().find((t) => t.category === 'resolution.input') as unknown as Record<string, unknown>;
    expect(input.scale).toBe('local');
  });

  it('a local template’s critical failure on a fight step takes regional severity', () => {
    const severityFor = (role: FightRole | undefined): unknown => {
      clearTraces();
      const step = fightStep(role);
      executeStepResult(
        action('fight.test'), template(step, 'local'), 'critical_failure', [], baseState(fightWorld()), () => 0, TICK,
      );
      const sel = getTraces().find((t) => t.category === 'complication_selection') as unknown as Record<string, unknown>;
      return sel?.severity;
    };
    expect(severityFor('clash')).toBe('standard');
    expect(severityFor(undefined)).toBe('minor');
  });
});

// ─── Reach ──────────────────────────────────────────────────────

describe('reach precedence', () => {
  it('the card overrides the authored reach', () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clashReach: 'eye', nerveReach: 'veil', clockSize: 3, clockFilled: 0 } });
    const state = baseState(graph);
    const clash = fightStep('clash', 'iron');
    const nerve = fightStep('nerve', 'heart');
    expect(resolveFightStepInputs(state, action('t'), clash, template(clash))!.reach).toBe('eye');
    expect(resolveFightStepInputs(state, action('t'), nerve, template(nerve))!.reach).toBe('veil');
  });

  it("the fighter's own reach override applies after the card's", () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clashReach: 'eye', clockSize: 3, clockFilled: 0 } });
    giveItem(graph, 'hero', 'item.amulet', [{
      type: 'modify_rules', scope: 'self', rule: 'encounter_reach_override',
      value: { from: 'eye', to: 'star' }, ticks: 'permanent',
    } as unknown as AttachmentEffect]);
    const step = fightStep('clash', 'iron');
    const inputs = resolveFightStepInputs(baseState(graph), action('t'), step, template(step))!;
    expect(inputs.authoredReach).toBe('iron');
    expect(inputs.reach).toBe('star');
  });

  it('capability is read on the resolved reach', () => {
    const strongEye = fightWorld({ fighterCaps: { iron: 0, eye: 40 }, monsterState: { dread: 'fair', might: 'fair', clashReach: 'eye', clockSize: 3, clockFilled: 0 } });
    const r = resolveUncontestedStep(action('fight.test'), template(fightStep('clash', 'iron')), baseState(strongEye), midRng);
    const weakEye = fightWorld({ fighterCaps: { iron: 40, eye: 0 }, monsterState: { dread: 'fair', might: 'fair', clashReach: 'eye', clockSize: 3, clockFilled: 0 } });
    const w = resolveUncontestedStep(action('fight.test'), template(fightStep('clash', 'iron')), baseState(weakEye), midRng);
    expect(r.reach).toBe('eye');
    expect(r.capability).toBeGreaterThan(w.capability);
  });
});

// ─── Standing modifiers in a combat context ─────────────────────

describe("an in_combat item on the fighter moves a fight step's odds, as a named term", () => {
  function probabilityWith(reach: ReachDomain, cardReach: ReachDomain | undefined, withItem: boolean) {
    clearTraces();
    const graph = fightWorld({
      fighterCaps: { iron: 14, eye: 14 },
      monsterState: { dread: 'fair', might: 'fair', clockSize: 3, clockFilled: 0, ...(cardReach ? { clashReach: cardReach } : {}) },
    });
    if (withItem) {
      giveItem(graph, 'hero', 'item.charm', [{ type: 'conditional', condition: 'in_combat', reach, value: 0.08 } as AttachmentEffect]);
    }
    const p = resolveUncontestedStep(action('fight.test'), template(fightStep('clash', 'iron')), baseState(graph), midRng).probability;
    return { p, trace: fightTraces()[0] };
  }

  it('on an iron clash', () => {
    const without = probabilityWith('iron', undefined, false);
    const withCharm = probabilityWith('iron', undefined, true);
    expect(withCharm.p).toBeGreaterThan(without.p);
    expect(withCharm.trace.modifiers).toEqual([{ name: 'standing', delta: expect.closeTo(0.08, 10) }]);
    expect(without.trace.modifiers).toEqual([]);
  });

  it('on a clash whose reach the card overrides to eye', () => {
    const without = probabilityWith('eye', 'eye', false);
    const withCharm = probabilityWith('eye', 'eye', true);
    expect(withCharm.trace.card.reach).toBe('eye');
    expect(withCharm.p).toBeGreaterThan(without.p);
    expect(withCharm.trace.modifiers).toEqual([{ name: 'standing', delta: expect.closeTo(0.08, 10) }]);
  });

  it('the same charm does nothing on an ordinary eye step (no combat context)', () => {
    const graph = fightWorld({ fighterCaps: { eye: 14 } });
    const step = fightStep(undefined, 'eye');
    const plain = resolveUncontestedStep(action('t'), template(step), baseState(graph), midRng).probability;
    giveItem(graph, 'hero', 'item.charm', [{ type: 'conditional', condition: 'in_combat', reach: 'eye', value: 0.08 } as AttachmentEffect]);
    const charmed = resolveUncontestedStep(action('t'), template(step), baseState(graph), midRng).probability;
    expect(charmed).toBe(plain);
  });
});

// ─── The resolved inputs outlive the roll (§3c) ─────────────────

/** Resolve one step through the real road and execute it with the stats the loop passes. */
function resolveAndExecute(graph: WorldGraph, step: ActionStep, effectStates?: Map<string, EffectRuntimeState>) {
  const state = baseState(graph, effectStates);
  const tpl = template(step);
  const act = action(tpl.id);
  const r = resolveUncontestedStep(act, tpl, state, midRng);
  executeStepResult(
    act, tpl, 'success', [], state, midRng, TICK,
    { capability: r.capability, probability: r.probability, roll: r.roll, reach: r.reach, difficulty: r.difficulty },
    createSimulationRuntime(),
  );
  return state;
}

describe('growth after a severe clash is a severe step’s growth', () => {
  it('matches an ordinary step authored at the severe difficulty, not the placeholder', () => {
    const severeCard = { dread: 'severe', might: 'severe', clockSize: 3, clockFilled: 0 };
    const fought = resolveAndExecute(fightWorld({ monsterState: severeCard }), fightStep('clash', 'iron'));
    const severeStep = resolveAndExecute(fightWorld(), fightStep(undefined, 'iron', FIGHT_RATING_DIFFICULTY.severe));
    const placeholderStep = resolveAndExecute(fightWorld(), fightStep(undefined, 'iron', 0.35));

    const iron = (s: GameState) => computeRawScore(s.graph, 'hero', 'iron');
    expect(iron(fought)).toBeCloseTo(iron(severeStep), 10);
    expect(iron(severeStep)).toBeGreaterThan(iron(placeholderStep));
  });
});

describe('a clash the card overrides to Eye is an Eye step after the roll', () => {
  it('grows Eye not Iron, spends an Eye charge, and records Eye as reachTested', () => {
    const graph = fightWorld({ monsterState: { dread: 'fair', might: 'fair', clashReach: 'eye', clockSize: 3, clockFilled: 0 } });
    giveItem(graph, 'hero', 'item.lens', [
      { type: 'consumable_charge', charges: 3, onUse: { reach: 'eye', value: 0.05 }, destroyOnEmpty: false } as unknown as AttachmentEffect,
    ]);
    const ironBefore = computeRawScore(graph, 'hero', 'iron');
    const eyeBefore = computeRawScore(graph, 'hero', 'eye');
    const effectStates = new Map<string, EffectRuntimeState>([['item.lens', { chargesRemaining: 3 }]]);

    const state = resolveAndExecute(graph, fightStep('clash', 'iron'), effectStates);

    expect(computeRawScore(state.graph, 'hero', 'eye')).toBeGreaterThan(eyeBefore);
    expect(computeRawScore(state.graph, 'hero', 'iron')).toBe(ironBefore);
    expect(state.effectStates?.get('item.lens')?.chargesRemaining).toBe(2);
    const eventNodes = state.graph.getAllNodes().filter((n) => n.properties.reachTested !== undefined);
    expect(eventNodes.map((n) => n.properties.reachTested)).toEqual(['eye']);
  });
});

// ─── Band opposition skips fight steps ──────────────────────────

describe('a company member fighting beside a foreign band', () => {
  /** The band-opposition fixture: a company and a foreign band on one hex. */
  function confrontation(step: ActionStep) {
    const graph = fightWorld();
    graph.addNode({ id: 'loc.hall', type: 'location', name: 'Hall', properties: { locationType: 'settlement', hexCol: 3, hexRow: 3 } });
    graph.removeEdge('e.hero.at');
    graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'loc.hall', type: 'located_at', properties: {} });
    graph.removeEdge('e.beast.at');
    graph.addEdge({ id: 'e.beast.at', source: 'beast', target: 'loc.hall', type: 'located_at', properties: {} });
    for (const [id, band] of [['co', false], ['band', true]] as const) {
      graph.addNode({
        id, type: 'actor', name: id,
        properties: {
          actorType: 'group', groupType: band ? 'faction_band' : 'party', groupStatus: 'active', cohesion: 0.6,
          ...(band ? { bandRole: 'defender', bandFactionId: 'f.knives' } : {}),
        },
      });
      const members = band ? ['band.m0', 'band.m1'] : ['hero', 'co.m1'];
      for (const m of members) {
        if (!graph.getNode(m)) {
          graph.addNode({ id: m, type: 'actor', name: m, properties: { actorType: 'individual' } });
          graph.addEdge({ id: `at.${m}`, source: m, target: 'loc.hall', type: 'located_at', properties: {} });
        }
        graph.addEdge({ id: `mem.${m}`, source: m, target: id, type: 'member_of', properties: { role: m === members[0] ? 'leader' : 'member', rank: 0, joinedTick: 0 } });
      }
      graph.addEdge({ id: `cmd.${id}`, source: id, target: members[0], type: 'commanded_by', properties: {} });
      graph.updateNode(id, { properties: { ...graph.getNode(id)!.properties, roster: members } });
    }
    const tpl = template(step, 'regional', 'fight.band_test');
    const state = baseState(graph);
    (state as { unifiedActions: UnifiedAction[] }).unifiedActions = [action(tpl.id, { stepProgress: 0 })];
    return { state, tpl };
  }

  it('the fight step resolves as a fight: one fight.step trace, no contested pair', () => {
    const { state, tpl } = confrontation(fightStep('clash'));
    expect(isActionOnFightStep(state.unifiedActions![0], tpl)).toBe(true);
    expect(collectBandOppositions(state.unifiedActions!, state, (a) => isActionOnFightStep(a, tpl))).toHaveLength(0);

    phaseUnifiedActionProgress(state, [tpl], midRng, createSimulationRuntime());
    expect(fightTraces()).toHaveLength(1);
    expect(getTraces().filter((t) => t.category === 'group_contested')).toHaveLength(0);
  });

  it('control: the same scene on an ordinary step is contested by the band', () => {
    const { state, tpl } = confrontation(fightStep(undefined));
    const completing = state.unifiedActions!.map((a) => ({ ...a, stepProgress: 1 }));
    expect(collectBandOppositions(completing, state, (a) => isActionOnFightStep(a, tpl))).toHaveLength(1);
  });
});
