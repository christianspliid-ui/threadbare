/**
 * THR-1670 (power runtime S2) — a caster casts in the scene.
 *
 * Done-when clauses pinned here:
 *  1. The forecast and the roll read the same `stepCasts` record: with a cast
 *     decided, the attended forecast (`buildNudgePhaseModel`) and the roll's own
 *     derivation (`previewStepProbability`) both carry the bonus; with a record
 *     already written, both read it rather than re-deciding.
 *  2. A courageous and a prudent mortal at the same pre-card odds decide differently.
 *  3. A declined cast adds no line.
 * Plus the outcome half: the step's band lands or fizzles the cast, and the record
 * freezes the cast line; and the chip builder mints one chip per write (Law 56).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorldGraph } from '../graph';
import {
  decideStepCast,
  executeStepResult,
  previewStepProbability,
  resolveUncontestedStep,
} from '../unifiedActionResolution';
import { resolveStepDefinition } from '../unifiedActionLifecycle';
import { disableTracing } from '../traceBuffer';
import { computeResolutionModifiers, stepCastContributions } from '../resolutionModifiers';
import { stepCastRecordFor } from '../stepCast';
import { getAnyEncounterById } from '../../data/encounter-content';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { getSpellTemplate, spellDefinitionNode, spellDefinitionNodeId } from '../../data/spell-templates';
import {
  CAST_STEP_BONUS_BY_TIER,
  CAST_THRESHOLD_MAX,
  CAST_THRESHOLD_MIN,
  castThresholdFor,
} from '../../data/spell-casting-constants';
import { buildNudgePhaseModel } from '../../components/Game/encounter-stage/adapters/buildNudgePhaseModel';
import { forecastWithNudges } from '../../components/Game/encounter-stage/useNudgeHand';
import { buildCastChanges, stepCastModelFor } from '../../components/Game/encounter-stage/adapters/buildStepCastModel';
import { buildFightChipWorld } from '../../components/Game/encounter-stage/adapters/chipCollaborators';
import type { GameState } from '../../types/gameState';
import type { ActionStep, StepCastRecord, UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import { REACH_DOMAINS } from '../../types/traits';

beforeEach(() => disableTracing());
afterEach(() => disableTracing());

const TICK = 50;
const TEMPLATE_ID = 'encounter.border.the_garrisons_price';
const HOLLOW = 'spell_hollow_crown';

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

/**
 * A caster who wields Hollow Crown (encounter arena, Gold), standing beside a
 * rival the spell can be aimed at. `raw` sets every reach; `courage` the lean.
 */
function world(raw: number, courage = 0, wield = true): WorldGraph {
  const graph = new WorldGraph();
  const caps: Record<string, number> = {};
  for (const r of REACH_DOMAINS) caps[r] = raw;
  graph.addNode({
    id: 'mortal', type: 'actor', name: 'Ilse',
    properties: { actorType: 'individual', domainCapabilities: caps, axiologicalProfile: { courage_prudence: courage } },
  });
  graph.addNode({ id: 'rival', type: 'actor', name: 'Doran', properties: { actorType: 'individual', domainCapabilities: caps } });
  graph.addNode({ id: 'loc.here', type: 'location', name: 'Here', properties: { hexCol: 4, hexRow: 4 } });
  graph.addEdge({ id: 'e.at', source: 'mortal', target: 'loc.here', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'e.rival.at', source: 'rival', target: 'loc.here', type: 'located_at', properties: {} });
  const spell = getSpellTemplate(HOLLOW)!;
  graph.addNode(spellDefinitionNode(spell));
  if (wield) {
    graph.addEdge({
      id: 'e.wield', source: 'mortal', target: spellDefinitionNodeId(HOLLOW), type: 'has_trait',
      properties: { level: 1, source: 'test' },
    });
  }
  return graph;
}

function template(): UnifiedActionTemplate {
  const t = (getUnifiedTemplateById(TEMPLATE_ID) ?? getAnyEncounterById(TEMPLATE_ID)) as UnifiedActionTemplate | undefined;
  if (!t) throw new Error(`missing template ${TEMPLATE_ID}`);
  return t;
}

function actionOf(extra: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'ua_cast', actorId: 'mortal', templateId: TEMPLATE_ID, targetId: 'loc.here',
    scale: 'local', source: 'agent',
    startTick: TICK - 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
    ...extra,
  } as unknown as UnifiedAction;
}

function stepOf(t: UnifiedActionTemplate): ActionStep {
  return resolveStepDefinition(t, 0, []) as ActionStep;
}

/** The forecast's probability before the hand's own deltas, and its factor lines. */
function forecastOf(state: GameState, t: UnifiedActionTemplate, action: UnifiedAction) {
  const phase = buildNudgePhaseModel({
    template: t, activeAction: action, step: stepOf(t), graph: state.graph, gameState: state, allowEmptyHand: true,
  });
  if (!phase) throw new Error('no phase');
  return { p: forecastWithNudges(phase, []).probability, factors: phase.testPanel.factors };
}

describe('THR-1670 — the cast threshold', () => {
  it('reads courage against prudence, clamped', () => {
    expect(castThresholdFor(0)).toBeCloseTo(0.45, 10);
    expect(castThresholdFor(1)).toBeCloseTo(CAST_THRESHOLD_MAX, 10);
    expect(castThresholdFor(-1)).toBeCloseTo(0.35, 10);
    expect(castThresholdFor(-5)).toBe(CAST_THRESHOLD_MIN);
    expect(castThresholdFor(Number.NaN)).toBeCloseTo(0.45, 10);
  });

  it('a courageous and a prudent mortal at the same pre-card odds decide differently', () => {
    const t = template();
    const site = { reach: stepOf(t).reach };
    const brave = stepCastRecordFor(stateOf(world(20, 1)), 'mortal', site, () => 0.40);
    const wary = stepCastRecordFor(stateOf(world(20, -1)), 'mortal', site, () => 0.40);
    expect(brave?.decision).toBe('cast');
    expect(wary?.decision).toBe('declined');
    expect(wary?.declinedReason).toBe('odds_good');
    expect(brave?.preCardProbability).toBe(0.40);
    expect(wary?.preCardProbability).toBe(0.40);
  });

  it('records nothing for a mortal who wields no deliberate spell', () => {
    expect(stepCastRecordFor(stateOf(world(20, 0, false)), 'mortal', { reach: 'gold' }, () => 0.1)).toBeNull();
  });

  it('declines a step whose reach no wielded spell fits', () => {
    const rec = stepCastRecordFor(stateOf(world(20)), 'mortal', { reach: 'iron' }, () => 0.1);
    expect(rec).toMatchObject({ decision: 'declined', declinedReason: 'no_fitting_spell' });
  });

  it('declines on cooldown before reading the odds', () => {
    const state = stateOf(world(20));
    state.castCooldowns = new Map([[`mortal::${HOLLOW}`, TICK - 1]]);
    let asked = false;
    const rec = stepCastRecordFor(state, 'mortal', { reach: 'gold' }, () => { asked = true; return 0.1; });
    expect(rec).toMatchObject({ decision: 'declined', declinedReason: 'cooldown' });
    expect(asked).toBe(false);
  });
});

describe('THR-1670 — the forecast and the roll read the same record', () => {
  it('the step is hard enough that the fixture mortal casts', () => {
    const t = template();
    expect(stepOf(t).reach).toBe('gold');
    const rec = decideStepCast(actionOf(), t, stateOf(world(12)));
    expect(rec?.decision).toBe('cast');
    expect(rec?.spellId).toBe(HOLLOW);
    expect(rec?.targetId).toBe('rival');
    expect(rec?.bonus).toBe(CAST_STEP_BONUS_BY_TIER[3]);
  });

  it('a cast moves the forecast and the roll by the same named line', () => {
    const t = template();
    const casting = stateOf(world(12));
    const bare = stateOf(world(12, 0, false));
    const action = actionOf();

    const rolledWith = previewStepProbability(action, t, casting)!;
    const rolledWithout = previewStepProbability(action, t, bare)!;
    const shownWith = forecastOf(casting, t, action);
    const shownWithout = forecastOf(bare, t, action);

    expect(rolledWith).toBeGreaterThan(rolledWithout);
    expect(Math.round(shownWith.p * 100)).toBe(Math.floor(rolledWith * 100 + 1e-9));
    expect(Math.round(shownWithout.p * 100)).toBe(Math.floor(rolledWithout * 100 + 1e-9));

    const line = shownWith.factors.find(f => f.source?.startsWith('spell:'));
    expect(line?.text).toBe('Ilse is casting Pact of the Hollow Crown.');
    expect(line?.delta).toBe(CAST_STEP_BONUS_BY_TIER[3]);
    expect(line?.link).toEqual({ text: 'Pact of the Hollow Crown', entityId: spellDefinitionNodeId(HOLLOW), kind: 'attachment' });
    expect(shownWithout.factors.some(f => f.source?.startsWith('spell:'))).toBe(false);
  });

  it('a written record wins over a fresh decision, for the forecast and the roll alike', () => {
    const t = template();
    const state = stateOf(world(12));
    // The world would cast; the record says the mortal declined. Both readers obey it.
    const declined: StepCastRecord = {
      decision: 'declined', casterId: 'mortal', spellId: HOLLOW, threshold: 0.45, preCardProbability: 0.6, declinedReason: 'odds_good',
    };
    const recorded = actionOf({ stepCasts: { 0: declined } });
    const bareState = stateOf(world(12, 0, false));
    expect(previewStepProbability(recorded, t, state)).toBeCloseTo(previewStepProbability(actionOf(), t, bareState)!, 10);
    expect(forecastOf(state, t, recorded).factors.some(f => f.source?.startsWith('spell:'))).toBe(false);
  });

  it('the roll returns the decision it rolled with', () => {
    const t = template();
    const state = stateOf(world(12));
    const decided = decideStepCast(actionOf(), t, state);
    const rolled = resolveUncontestedStep(actionOf(), t, state, () => 0.5);
    expect(rolled.stepCast).toEqual(decided);
  });
});

describe('THR-1670 — a declined cast adds no line', () => {
  it('no contribution, no total', () => {
    const graph = world(12);
    const declined: StepCastRecord = {
      decision: 'declined', casterId: 'mortal', spellId: HOLLOW, threshold: 0.45, preCardProbability: 0.6, declinedReason: 'odds_good',
    };
    expect(stepCastContributions(declined, 'mortal')).toEqual([]);
    const withDecline = computeResolutionModifiers(graph, 'mortal', 'loc.here', 'gold', undefined, undefined, undefined, undefined, declined);
    const without = computeResolutionModifiers(graph, 'mortal', 'loc.here', 'gold', undefined);
    expect(withDecline.totalModifier).toBe(without.totalModifier);
    expect(withDecline.contributions.some(c => c.kind === 'spell')).toBe(false);
  });

  it("a cast by someone else is not this roller's line", () => {
    const cast: StepCastRecord = { decision: 'cast', casterId: 'rival', spellId: HOLLOW, threshold: 0.45, preCardProbability: 0.3, bonus: 0.1 };
    expect(stepCastContributions(cast, 'mortal')).toEqual([]);
    expect(stepCastContributions(cast, 'rival')).toHaveLength(1);
  });
});

describe('THR-1670 — the band decides the cast, and the record freezes it', () => {
  function resolveOn(band: 'success' | 'failure') {
    const t = template();
    const state = stateOf(world(12));
    const action = actionOf();
    const rolled = resolveUncontestedStep(action, t, state, () => 0.5);
    const { updatedAction } = executeStepResult(
      action, t, band, [], state, () => 0.5, TICK,
      { capability: rolled.capability, probability: rolled.probability, roll: rolled.roll, stepCast: rolled.stepCast },
    );
    return { record: updatedAction.stepCasts?.[0], state, updatedAction };
  }

  it('a success lands it: the cast line, the price paid, a chip per write', () => {
    const { record, state, updatedAction } = resolveOn('success');
    expect(record).toMatchObject({ decision: 'cast', band: 'success', landed: true });
    expect(record?.prose).toBe("Ilse speaks with a borrowed crown's weight, and the room bends to it.");
    // Hollow Crown's price inflicts a condition on the caster — read back as a write.
    expect(record?.writes?.some(w => w.kind === 'condition' && w.fromPrice)).toBe(true);
    // The per-caster cooldown is set, so the next step declines.
    expect(state.castCooldowns?.get(`mortal::${HOLLOW}`)).toBe(TICK);

    const chips = buildCastChanges(updatedAction.stepCasts, buildFightChipWorld(state.graph));
    expect(chips.length).toBe(record!.writes!.length);
    expect(chips.every(c => c.category === 'scar')).toBe(true);
    const model = stepCastModelFor(state.graph, record);
    expect(model).toMatchObject({ spellName: 'Pact of the Hollow Crown', landed: true, casterName: 'Ilse' });
  });

  it('a failure fizzles it: the fizzled line, the price still paid', () => {
    const { record } = resolveOn('failure');
    expect(record).toMatchObject({ decision: 'cast', band: 'failure', landed: false });
    expect(record?.prose).toBe("Ilse reaches for the crown's weight and finds only their own voice.");
    expect(record?.writes?.some(w => w.fromPrice)).toBe(true);
  });

  it('is deterministic: the same world and band freeze the same record', () => {
    expect(resolveOn('failure').record).toEqual(resolveOn('failure').record);
  });
});
