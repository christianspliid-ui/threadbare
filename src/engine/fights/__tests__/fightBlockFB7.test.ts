/**
 * THR-1543 (FB7) — the block, the template, advantages, allies, events.
 *
 * Plan doc `Docs/plans/2026-09-23-fight-block.md` §11–12 and § Content pillar. Each
 * `describe` is one clause of the slice's Done-when. Bands are handed to
 * `executeStepResult` directly where the clause is about what the handler does with
 * a band; the forecast clauses compare the stage's forecast against the resolver's
 * own probability (`previewStepProbability`, the roll's derivation run dry).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../../graph';
import { executeStepResult, previewStepProbability } from '../../unifiedActionResolution';
import { disableTracing } from '../../traceBuffer';
import { resolveFightStepInputs } from '../fightStepInputs';
import { readFightAdvantages } from '../fightAdvantages';
import { getCompanyMembersAtHex } from '../fightAllies';
import { applyFightStepResult } from '../fightState';
import { selectComplication } from '../../complicationSelection';
import { buildChapterRecord } from '../../chapterArchive';
import { buildNudgePhaseModel } from '../../../components/Game/encounter-stage/adapters/buildNudgePhaseModel';
import { forecastWithNudges } from '../../../components/Game/encounter-stage/useNudgeHand';
import { forecastAction } from '../../resolutionService';
import { MIN_PROBABILITY_BY_SCALE } from '../../resolutionScaleAdjust';
import { CONDITION_TRAIT_DEFINITIONS } from '../../../data/condition-trait-content';
import { FIGHT_LAIR_CONFRONT, FIGHT_LAIR_CONFRONT_ID } from '../../../data/encounters/fight-lair-confront';
import { fightBlock, fightResultIndex } from '../../../data/fights/fightBlock';
import { getAnyEncounterById } from '../../../data/encounter-content';
import {
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
} from '../../../data/unified-action-templates';
import { entriesOfKind } from '../../../data/contentCatalogs';
import {
  FIGHT_ADVANTAGE_BLESSED,
  FIGHT_ADVANTAGE_CURSED,
  FIGHT_ADVANTAGE_STORIED,
  FIGHT_ALLY_MAX,
  FIGHT_STEP_SCALE,
} from '../../../data/fight-constants';
import type { GameState } from '../../../types/gameState';
import type { ComplicationContext } from '../../../types/complication';
import type {
  StepNudge,
  StepOutcome,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../types/unifiedAction';

const TICK = 200;
const midRng = () => 0.5;

beforeEach(() => disableTracing());
afterEach(() => disableTracing());

// ─── Fixture ────────────────────────────────────────────────────

interface WorldOpts {
  /** Raw capability in every reach the fighter tests. */
  readonly heroRaw?: number;
  /** The opponent: a monster card, or a mortal. */
  readonly opponent?: 'monster' | 'mortal';
  readonly monsterCard?: Record<string, unknown>;
}

function world(opts: WorldOpts = {}): WorldGraph {
  const graph = new WorldGraph();
  for (const node of CONDITION_TRAIT_DEFINITIONS) graph.addNode(node);
  for (const id of ['trait.artifact.storied', 'trait.artifact.cursed']) {
    graph.addNode({ id, type: 'trait', name: id, properties: {} });
  }
  graph.addNode({ id: 'den', type: 'location', name: 'The Den', properties: { hexCol: 2, hexRow: 2 } });
  graph.addNode({ id: 'far', type: 'location', name: 'Far Off', properties: { hexCol: 9, hexRow: 9 } });
  const raw = opts.heroRaw ?? 10;
  graph.addNode({
    id: 'hero', type: 'actor', name: 'Hero',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: raw, heart: raw, eye: raw, veil: raw },
      axiologicalProfile: { courage_prudence: 0.35 },
    },
  });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'den', type: 'located_at', properties: {} });
  const monster = (opts.opponent ?? 'monster') === 'monster';
  graph.addNode({
    id: 'beast', type: 'actor', name: 'The Beast',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: 10 },
      ...(monster
        ? { monsterState: { dread: 'steep', might: 'steep', clockSize: 4, clockFilled: 0, clockUpdatedTick: TICK, temper: 'stubborn', ...opts.monsterCard } }
        : {}),
    },
  });
  graph.addEdge({ id: 'e.beast.at', source: 'beast', target: 'den', type: 'located_at', properties: {} });
  return graph;
}

function stateOf(graph: WorldGraph): GameState {
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

function fightAction(templateId = FIGHT_LAIR_CONFRONT_ID, overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_fb7', actorId: 'hero', templateId, targetId: 'beast',
    scale: 'regional', source: 'agent',
    startTick: TICK - 5, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
    ...overrides,
  } as unknown as UnifiedAction;
}

function runBand(
  state: GameState, a: UnifiedAction, band: StepOutcome, tpl: UnifiedActionTemplate = FIGHT_LAIR_CONFRONT,
): UnifiedAction {
  return executeStepResult(a, tpl, band, [], state, midRng, state.tick, {
    capability: 0.5, probability: 0.5, roll: 50,
  }).updatedAction;
}

function addMember(graph: WorldGraph, id: string, companyId: string, at = 'den', joinedTick = 0): void {
  if (!graph.getNode(id)) {
    graph.addNode({ id, type: 'actor', name: `Ally ${id}`, properties: { actorType: 'individual' } });
    graph.addEdge({ id: `e.${id}.at`, source: id, target: at, type: 'located_at', properties: {} });
  }
  graph.addEdge({
    id: `e.${id}.member.${companyId}`, source: id, target: companyId, type: 'member_of',
    properties: { joinedTick },
  });
}

function addCompany(graph: WorldGraph, id = 'company-1'): string {
  graph.addNode({
    id, type: 'actor', name: 'The Company',
    properties: { actorType: 'group', groupKind: 'company', groupStatus: 'active' },
  });
  addMember(graph, 'hero', id);
  return id;
}

function addFavour(graph: WorldGraph, debtorId: string, props: Record<string, unknown> = {}, at = 'den'): string {
  graph.addNode({ id: debtorId, type: 'actor', name: `Debtor ${debtorId}`, properties: { actorType: 'individual' } });
  graph.addEdge({ id: `e.${debtorId}.at`, source: debtorId, target: at, type: 'located_at', properties: {} });
  const edgeId = `e.favour.${debtorId}`;
  graph.addEdge({ id: edgeId, source: debtorId, target: 'hero', type: 'owes_favor', properties: { magnitude: 0.5, ...props } });
  return edgeId;
}

const keys = (graph: WorldGraph, opponentId: string | null = 'beast') =>
  readFightAdvantages({ graph }, 'hero', opponentId).map((a) => a.key);

// ─── Advantages: read ───────────────────────────────────────────

describe('advantages are read from the world at fight start', () => {
  it('an injury-class grudge is an old wound; friction is not', () => {
    const graph = world();
    graph.addEdge({ id: 'e.grudge', source: 'hero', target: 'beast', type: 'hostile_to', properties: { cause: 'old_quarrel' } });
    expect(keys(graph)).not.toContain('old_wound');
    graph.updateEdge('e.grudge', { properties: { cause: 'grievance_cooled' } });
    expect(keys(graph)).toContain('old_wound');
  });

  it('a live secret about the opponent is their secret; a revealed one is not', () => {
    const graph = world();
    graph.addEdge({ id: 'e.secret', source: 'hero', target: 'beast', type: 'knows_secret_of', properties: { magnitude: 0.5, revealed: false } });
    expect(keys(graph)).toContain('their_secret');
    graph.updateEdge('e.secret', { properties: { magnitude: 0.5, revealed: true } });
    expect(keys(graph)).not.toContain('their_secret');
  });

  it('a favour is callable only from a mortal on the hex, live, and never an appointment\'s promise', () => {
    const near = world();
    addFavour(near, 'debtor');
    expect(keys(near)).toContain('favour_called');

    const away = world();
    addFavour(away, 'debtor', {}, 'far');
    expect(keys(away)).not.toContain('favour_called');

    const redeemed = world();
    addFavour(redeemed, 'debtor', { redeemed: true });
    expect(keys(redeemed)).not.toContain('favour_called');

    const appointment = world();
    addFavour(appointment, 'debtor', { appointment: { dueTick: 300 } });
    expect(keys(appointment)).not.toContain('favour_called');
  });

  it('Storied arms (level ≥ 2) and Blessed steady the nerve; a cursed thing drags the clash', () => {
    const graph = world();
    graph.addNode({ id: 'blade', type: 'item', name: 'Old Blade', properties: {} });
    graph.addEdge({ id: 'e.hero.blade', source: 'hero', target: 'blade', type: 'possesses', properties: {} });
    graph.addEdge({ id: 'e.has_trait.blade.trait.artifact.storied', source: 'blade', target: 'trait.artifact.storied', type: 'has_trait', properties: { level: 1 } });
    expect(keys(graph)).not.toContain('storied_arms');
    graph.updateEdge('e.has_trait.blade.trait.artifact.storied', { properties: { level: 2 } });
    graph.addEdge({ id: 'e.hero.blessed', source: 'hero', target: 'trait.condition.blessed', type: 'has_trait', properties: {} });
    graph.addNode({ id: 'ring', type: 'item', name: 'Ring', properties: {} });
    graph.addEdge({ id: 'e.hero.ring', source: 'hero', target: 'ring', type: 'bonded_to', properties: {} });
    graph.addEdge({ id: 'e.has_trait.ring.trait.artifact.cursed', source: 'ring', target: 'trait.artifact.cursed', type: 'has_trait', properties: {} });
    const advantages = readFightAdvantages({ graph }, 'hero', 'beast');
    const by = Object.fromEntries(advantages.map((a) => [a.key, a]));
    expect(by.storied_arms).toMatchObject({ appliesTo: 'nerve', delta: FIGHT_ADVANTAGE_STORIED });
    expect(by.blessed).toMatchObject({ appliesTo: 'nerve', delta: FIGHT_ADVANTAGE_BLESSED });
    expect(by.cursed).toMatchObject({ appliesTo: 'clash', delta: FIGHT_ADVANTAGE_CURSED });
  });

  it('every advantage names itself in words (Law 13/14), never a key', () => {
    const graph = world();
    graph.addEdge({ id: 'e.secret', source: 'hero', target: 'beast', type: 'knows_secret_of', properties: { magnitude: 0.5 } });
    addFavour(graph, 'debtor');
    for (const adv of readFightAdvantages({ graph }, 'hero', 'beast')) {
      expect(adv.label).not.toMatch(/[{}_]/);
      expect(adv.label.length).toBeGreaterThan(8);
    }
  });
});

describe('allies: the company at the fighter\'s side', () => {
  it('counts living company members on the hex, capped at FIGHT_ALLY_MAX, never the opponent', () => {
    const graph = world();
    const company = addCompany(graph);
    for (let i = 0; i < FIGHT_ALLY_MAX + 2; i++) addMember(graph, `m${i}`, company, 'den', i + 1);
    addMember(graph, 'distant', company, 'far', 50);
    addMember(graph, 'beast', company, 'den', 60); // two of one company can fight
    expect(getCompanyMembersAtHex(graph, 'hero', ['beast']).map((n) => n.id)).not.toContain('beast');
    expect(getCompanyMembersAtHex(graph, 'hero', ['beast']).map((n) => n.id)).not.toContain('distant');
    const company_ = readFightAdvantages({ graph }, 'hero', 'beast').filter((a) => a.key === 'company');
    expect(company_).toHaveLength(FIGHT_ALLY_MAX);
    expect(company_.map((a) => a.sourceId)).toEqual(['m0', 'm1', 'm2']);
  });

  it('a group-affinity template embedding a block counts allies once — the group step is skipped', () => {
    const graph = world({ heroRaw: 6 });
    const company = addCompany(graph);
    addMember(graph, 'm0', company, 'den', 1);
    addMember(graph, 'm1', company, 'den', 2);
    const state = stateOf(graph);
    const groupTpl = {
      ...FIGHT_LAIR_CONFRONT, id: 'fight.test.group', actorAffinities: ['group', 'individual'],
    } as UnifiedActionTemplate;
    // Past the nerve step, so the clash reads the company advantage.
    const afterNerve = runBand(state, fightAction(groupTpl.id), 'success', groupTpl);
    const clashStep = groupTpl.steps[1] as never;
    const inputs = resolveFightStepInputs(state, afterNerve, clashStep, groupTpl)!;
    expect(inputs.modifiers.filter((m) => m.name === 'advantage:company')).toHaveLength(2);
    // The same fight on an individual-only template rolls against exactly the same odds.
    const individualAfterNerve = { ...afterNerve, templateId: FIGHT_LAIR_CONFRONT_ID };
    expect(previewStepProbability(afterNerve, groupTpl, state))
      .toBe(previewStepProbability(individualAfterNerve, FIGHT_LAIR_CONFRONT, state));
  });
});

// ─── Advantages: spent through the existing writers ─────────────

describe('advantages are spent through the existing writers, exactly once', () => {
  it('the forecast leaves the favour live; the fight redeems it once, and never removes it', () => {
    const graph = world();
    const edgeId = addFavour(graph, 'debtor');
    const state = stateOf(graph);
    const nerve = FIGHT_LAIR_CONFRONT.steps[0] as never;
    for (let i = 0; i < 10; i++) resolveFightStepInputs(state, fightAction(), nerve, FIGHT_LAIR_CONFRONT);
    expect(graph.getEdge(edgeId)!.properties.redeemed).not.toBe(true);

    let a = runBand(state, fightAction(), 'success');
    expect(graph.getEdge(edgeId)!.properties.redeemed).toBe(true);
    const redeemedTick = graph.getEdge(edgeId)!.properties.redeemedTick;
    expect(a.fightState!.advantages.find((x) => x.key === 'favour_called')!.spent).toBe(true);
    for (const band of ['success', 'success', 'success'] as StepOutcome[]) {
      state.tick += 1;
      if (!a.resolved) a = runBand(state, a, band);
    }
    expect(graph.getEdge(edgeId)).toBeDefined();
    expect(graph.getEdge(edgeId)!.properties.redeemedTick).toBe(redeemedTick);
  });

  it('an appointment\'s favour is never touched by a fight', () => {
    const graph = world();
    const edgeId = addFavour(graph, 'debtor', { appointment: { dueTick: 300 } });
    const state = stateOf(graph);
    let a = fightAction();
    for (const band of ['success', 'success', 'success', 'success'] as StepOutcome[]) {
      if (!a.resolved) a = runBand(state, a, band);
    }
    expect(graph.getEdge(edgeId)!.properties.redeemed).not.toBe(true);
  });

  it('the secret applies on the first clash where the fighter is behind, and is revealed — not removed — after it', () => {
    const graph = world({ opponent: 'mortal' });
    graph.addEdge({ id: 'e.secret', source: 'hero', target: 'beast', type: 'knows_secret_of', properties: { magnitude: 0.5, secretType: 'shame', source: 'observation', discoveredTick: 1 } });
    const state = stateOf(graph);
    let a = runBand(state, fightAction(), 'success'); // nerve
    const clash = FIGHT_LAIR_CONFRONT.steps[1] as never;
    // Not behind yet: the secret does not bear on the first clash.
    expect(resolveFightStepInputs(state, a, clash, FIGHT_LAIR_CONFRONT)!.modifiers.map((m) => m.name))
      .not.toContain('advantage:their_secret');
    a = runBand(state, a, 'failure'); // wounded, no blow landed → behind
    expect(a.resolved).toBe(false);
    expect(resolveFightStepInputs(state, a, clash, FIGHT_LAIR_CONFRONT)!.modifiers.map((m) => m.name))
      .toContain('advantage:their_secret');
    expect(graph.getEdge('e.secret')!.properties.revealed).not.toBe(true);
    a = runBand(state, a, 'success'); // the clash it applied to
    expect(graph.getEdge('e.secret')).toBeDefined();
    expect(graph.getEdge('e.secret')!.properties.revealed).toBe(true);
    expect(a.fightState!.advantages.find((x) => x.key === 'their_secret')!.spent).toBe(true);
  });
});

// ─── Storied arms and Blessed move the nerve roll and its forecast ──

function nervePhase(state: GameState, tpl: UnifiedActionTemplate = FIGHT_LAIR_CONFRONT, a = fightAction(tpl.id)) {
  return buildNudgePhaseModel({
    template: tpl, activeAction: a, step: tpl.steps[0] as never, graph: state.graph, gameState: state,
    allowEmptyHand: true,
  })!;
}

describe('Storied arms and Blessed move the nerve roll and its forecast', () => {
  it.each([
    ['Blessed', (g: WorldGraph) => g.addEdge({ id: 'e.hero.blessed', source: 'hero', target: 'trait.condition.blessed', type: 'has_trait', properties: {} })],
    ['Storied arms', (g: WorldGraph) => {
      g.addNode({ id: 'blade', type: 'item', name: 'Old Blade', properties: {} });
      g.addEdge({ id: 'e.hero.blade', source: 'hero', target: 'blade', type: 'possesses', properties: {} });
      g.addEdge({ id: 'e.has_trait.blade.trait.artifact.storied', source: 'blade', target: 'trait.artifact.storied', type: 'has_trait', properties: { level: 3 } });
    }],
  ])('%s', (label, grant) => {
    // A middling fighter against a gentle dread: the nerve odds sit clear of both
    // the floor and the ceiling, so a +0.05 term shows.
    const opts = { heroRaw: 12, monsterCard: { dread: 'gentle' } };
    const bare = stateOf(world(opts));
    const graph = world(opts);
    grant(graph);
    const lifted = stateOf(graph);
    const nerve = FIGHT_LAIR_CONFRONT.steps[0] as never;
    const term = resolveFightStepInputs(lifted, fightAction(), nerve, FIGHT_LAIR_CONFRONT)!.modifiers
      .find((m) => m.name === (label === 'Blessed' ? 'advantage:blessed' : 'advantage:storied_arms'));
    expect(term?.delta).toBe(label === 'Blessed' ? FIGHT_ADVANTAGE_BLESSED : FIGHT_ADVANTAGE_STORIED);
    const rollBefore = previewStepProbability(fightAction(), FIGHT_LAIR_CONFRONT, bare)!;
    const rollAfter = previewStepProbability(fightAction(), FIGHT_LAIR_CONFRONT, lifted)!;
    // The roll moves by the term (a condition's own decorative raw contribution may
    // nudge capability by well under a point, hence the band rather than equality).
    expect(rollAfter - rollBefore).toBeGreaterThan(0.04);
    expect(rollAfter - rollBefore).toBeLessThan(0.06);
    const shownBefore = forecastWithNudges(nervePhase(bare), []).probability;
    const shownAfter = forecastWithNudges(nervePhase(lifted), []).probability;
    expect(shownAfter).toBeGreaterThan(shownBefore);
    expect(Math.floor(shownBefore * 100)).toBe(Math.floor(rollBefore * 100));
    expect(Math.floor(shownAfter * 100)).toBe(Math.floor(rollAfter * 100));
  });
});

// ─── The odds shown are the odds rolled, four ways ──────────────

const CARD: StepNudge = {
  id: 'card_steady', name: 'Steady Hand', effectLine: 'Their hand stops shaking.', essenceCost: 0, forecastDelta: 0.1,
} as StepNudge;

function withCard(): UnifiedActionTemplate {
  const steps = fightBlock({ nerveNudges: [CARD], clashNudges: [CARD] });
  return { ...FIGHT_LAIR_CONFRONT, id: 'fight.test.card', steps, aftermathConfig: { ...FIGHT_LAIR_CONFRONT.aftermathConfig!, branchOnStep: fightResultIndex(steps) } };
}

function check(state: GameState, tpl: UnifiedActionTemplate, selected: string[] = []) {
  const a = fightAction(tpl.id);
  const phase = nervePhase(state, tpl, a);
  const shown = forecastWithNudges(phase, selected);
  const rolled = previewStepProbability(a, tpl, state, selected)!;
  return { phase, shown, rolled };
}

describe('the forecast equals the resolver for a fight step', () => {
  it('plain', () => {
    const { phase, shown, rolled } = check(stateOf(world({ heroRaw: 8 })), FIGHT_LAIR_CONFRONT);
    expect(phase.forecastScale).toBe(FIGHT_STEP_SCALE);
    expect(Math.floor(shown.probability * 100)).toBe(Math.floor(rolled * 100));
  });

  it('with a card selected', () => {
    const tpl = withCard();
    const state = stateOf(world({ heroRaw: 12, monsterCard: { dread: 'gentle' } }));
    const plain = check(state, tpl);
    const carded = check(state, tpl, [CARD.id]);
    expect(plain.phase.cards.map((c) => c.id)).toContain(CARD.id);
    expect(carded.rolled - plain.rolled).toBeCloseTo(0.1, 6);
    expect(Math.floor(carded.shown.probability * 100)).toBe(Math.floor(carded.rolled * 100));
  });

  it('on a step that hits the regional floor', () => {
    // Severe dread against a middling fighter: capability plus modifiers sits above
    // the floor, the difficulty does not — the scale step holds the odds at 0.20.
    const state = stateOf(world({ heroRaw: 8, monsterCard: { dread: 'severe' } }));
    const { phase, shown, rolled } = check(state, FIGHT_LAIR_CONFRONT);
    expect(rolled).toBeCloseTo(MIN_PROBABILITY_BY_SCALE.regional, 6);
    expect(Math.floor(shown.probability * 100)).toBe(Math.floor(rolled * 100));
    // Without the scale step the plain forecast would have quoted odds nobody rolls.
    expect(forecastAction(phase.forecastInput).successProbability).toBeLessThan(MIN_PROBABILITY_BY_SCALE.regional);
  });

  it('for a sub-floor fighter (low capability and terrified): the post-roll floor', () => {
    const graph = world({ heroRaw: -6, monsterCard: { dread: 'severe' } });
    graph.addEdge({ id: 'e.hero.terrified', source: 'hero', target: 'trait.condition.terrified', type: 'has_trait', properties: { intensity: 0.9 } });
    const state = stateOf(graph);
    const { phase, shown, rolled } = check(state, FIGHT_LAIR_CONFRONT);
    // Capability plus modifiers is under the floor, so the difficulty cap alone cannot
    // reach it — only the core's post-roll floor does, and the forecast mirrors it.
    expect(phase.forecastInput.capability + phase.forecastInput.actionModifiers)
      .toBeLessThan(MIN_PROBABILITY_BY_SCALE.regional);
    expect(rolled).toBeCloseTo(MIN_PROBABILITY_BY_SCALE.regional, 6);
    expect(Math.floor(shown.probability * 100)).toBe(Math.floor(rolled * 100));
  });
});

// ─── Mid-fight events ───────────────────────────────────────────

function complicationCtx(state: GameState, fight: ComplicationContext['fight'], seed: number): ComplicationContext {
  let s = seed >>> 0;
  const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
  return {
    action: fightAction(), template: FIGHT_LAIR_CONFRONT, stepIndex: 1,
    locationId: 'den', atSettlement: false, presentAgentIds: [], factionIds: [],
    activeOmenCategory: null, doomStage: 0, existingAttachments: [], locationUnrest: 0,
    rng, graph: state.graph, ...(fight ? { fight } : {}),
  };
}

describe('the complication pool is scoped to fights', () => {
  const state = stateOf(world());
  const draw = (fight: ComplicationContext['fight'], outcome: StepOutcome) =>
    Array.from({ length: 60 }, (_, i) => selectComplication(outcome, complicationCtx(state, fight, i + 1))?.templateId)
      .filter((id): id is string => !!id);

  it('a fight step draws only mid-fight events', () => {
    const ids = [...draw({ opponentId: 'beast', opponentKind: 'monster' }, 'failure'),
      ...draw({ opponentId: 'beast', opponentKind: 'monster' }, 'success_at_cost')];
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.every((id) => id.startsWith('complication.fight.'))).toBe(true);
  });

  it('an ordinary step never draws one', () => {
    const ids = draw(undefined, 'failure');
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.some((id) => id.startsWith('complication.fight.'))).toBe(false);
  });

  it('a mortal opponent never roars or calls its kin', () => {
    const ids = draw({ opponentId: 'beast', opponentKind: 'mortal' }, 'failure');
    expect(ids).not.toContain('complication.fight.it_roars');
    expect(ids).not.toContain('complication.fight.calls_its_kin');
  });

  it('a fight\'s authored events join its pool', () => {
    // A minor event on the fight's own reach, against a mortal with nobody watching:
    // it scores with the best of the shared minor pool, so it reaches the draw.
    const authored = {
      id: 'complication.fight.authored_only', category: 'scar', name: 'Authored', reachAffinity: ['iron'],
      severity: 'minor', requires: { inFight: true }, effects: [], proseTemplates: ['It happens to {opponent}.'],
      significanceBoost: 0,
    } as never;
    const ids = draw({ opponentId: 'beast', opponentKind: 'mortal', authored: [authored] }, 'success_at_cost');
    expect(ids).toContain('complication.fight.authored_only');
  });
});

describe('the handler applies a complication\'s fight effects through the fight\'s own writers', () => {
  it('fight_clock lands at step (4) and counts as a blow landed', () => {
    const state = stateOf(world());
    const afterNerve = runBand(state, fightAction(), 'success');
    const clash = FIGHT_LAIR_CONFRONT.steps[1] as never;
    const out = applyFightStepResult(state, { ...afterNerve, currentStep: 1 }, FIGHT_LAIR_CONFRONT, clash, 'failure', TICK, {
      rng: midRng, complicationEffects: [{ type: 'fight_clock', delta: 1 }],
    });
    expect(out.fightState!.clockNow).toBe(1);
    expect(out.fightState!.blowsLanded).toBe(1);
  });

  it('fight_momentum adds to the carried term; fight_condition lands through the applier', () => {
    const state = stateOf(world());
    const afterNerve = runBand(state, fightAction(), 'success');
    const clash = FIGHT_LAIR_CONFRONT.steps[1] as never;
    const out = applyFightStepResult(state, { ...afterNerve, currentStep: 1 }, FIGHT_LAIR_CONFRONT, clash, 'success', TICK, {
      rng: midRng,
      complicationEffects: [
        { type: 'fight_momentum', delta: -0.1 },
        { type: 'fight_condition', conditionTraitId: 'trait.condition.shaken', side: 'fighter' },
      ],
    });
    // A clean success carries +0.05; the footing giving takes 0.10 of it back.
    expect(out.fightState!.momentum).toBeCloseTo(-0.05, 6);
    expect(out.fightState!.conditionsApplied).toContain('trait.condition.shaken');
    expect(state.graph.getOutgoingEdges('hero', 'has_trait').some((e) => e.target === 'trait.condition.shaken')).toBe(true);
  });

  it('fight_offer_quarter asks the losing side: a stubborn beast refuses', () => {
    const state = stateOf(world());
    const afterNerve = runBand(state, fightAction(), 'success');
    const clash = FIGHT_LAIR_CONFRONT.steps[1] as never;
    const out = applyFightStepResult(state, { ...afterNerve, currentStep: 1 }, FIGHT_LAIR_CONFRONT, clash, 'success', TICK, {
      rng: midRng, complicationEffects: [{ type: 'fight_offer_quarter' }],
    });
    expect(out.fightState!.forks.at(-1)).toMatchObject({ kind: 'temper', side: 'opponent', choice: 'refuse' });
    expect(out.fightState!.result).toBeUndefined();
  });
});

// ─── The template ───────────────────────────────────────────────

describe('fight.lair.confront', () => {
  it('is found by getAnyEncounterById, and by an encounter-kind content query', () => {
    expect(getAnyEncounterById(FIGHT_LAIR_CONFRONT_ID)?.id).toBe(FIGHT_LAIR_CONFRONT_ID);
    expect(UNIFIED_ACTION_TEMPLATES.some((t) => t.id === FIGHT_LAIR_CONFRONT_ID)).toBe(true);
    expect(entriesOfKind('encounter_template').some((e) => e.id === FIGHT_LAIR_CONFRONT_ID)).toBe(true);
    expect(entriesOfKind('action_template').some((e) => e.id === FIGHT_LAIR_CONFRONT_ID)).toBe(false);
  });

  it('is never drawn: no location subtypes, and not in the location cache', () => {
    expect(FIGHT_LAIR_CONFRONT.locationSubtypes ?? []).toEqual([]);
    expect(LOCATION_BRANCHING_ENCOUNTER_TEMPLATES.some((t) => t.id === FIGHT_LAIR_CONFRONT_ID)).toBe(false);
  });

  it('declares its actor affinity, rides the attended tier, and is a terminal block', () => {
    expect(FIGHT_LAIR_CONFRONT.actorAffinities).toEqual(['individual']);
    expect(FIGHT_LAIR_CONFRONT.intrinsicTier).toBe('story_beat');
    expect(FIGHT_LAIR_CONFRONT.steps.every((s) => 'fightRole' in s && s.fightRole)).toBe(true);
    expect(FIGHT_LAIR_CONFRONT.aftermathConfig!.branchOnStep).toBe(fightResultIndex(FIGHT_LAIR_CONFRONT.steps));
    expect(Object.keys(FIGHT_LAIR_CONFRONT.aftermathConfig!.variants).every((k) => k.startsWith('fight:'))).toBe(true);
  });
});

// ─── The past-step labels read the reach the step tested ────────

describe('the chapter archive labels a step by the reach it tested', () => {
  it('reads StepProseRecord.reach, not the authored reach', () => {
    const state = stateOf(world());
    const action = fightAction(FIGHT_LAIR_CONFRONT_ID, {
      resolved: true, currentStep: 1, stepOutcomes: ['success', 'success'],
      stepProseHistory: [
        { index: 0, label: 'Step 1', narrativeProse: 'x', outcome: 'success', reach: 'heart', tick: TICK },
        { index: 1, label: 'Step 2', narrativeProse: 'y', outcome: 'success', reach: 'eye', tick: TICK },
      ],
    } as never);
    const record = buildChapterRecord(action, state)!;
    expect(record.steps[1].label).toBe('Step 2: eye');
    // The authored reach of that clash is iron: the label is the tested one.
    expect((FIGHT_LAIR_CONFRONT.steps[1] as { reach: string }).reach).toBe('iron');
  });
});
