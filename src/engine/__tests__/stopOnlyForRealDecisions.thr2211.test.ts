/**
 * THR-2211 (plan THR-2203, slice A) — stop the world only for real decisions.
 *
 * - An ending the god took no part in is posted `badgeOnly` and never auto-opens;
 *   a touched ending (a committed card, or an empty committed hand) still does.
 * - A pause-thread step with a deal, no authored nudges and a base tier of
 *   `fated` is posted on the fuse; one authored nudge, or a tier below Fated, is not.
 * - The badge and ending lines agree with the chapter word (THR-2174).
 * - The Stage and the poster read one forecast call (Law 18).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';
import type { EncounterNotification } from '../../types/encounterVisibility';
import type { ThreadEdgeProperties } from '../../types/influence';
import type { ForecastTier } from '../../types/traces/encounter-traces';
import type {
  ActionStep,
  StepNudge,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import { registerDebugTemplate } from '../../data/unified-action-templates';
import { FATED_STEP_FUSE_TICKS } from '../../data/encounter-experience-constants';
import {
  BADGE_FATED_FUSE_META,
  BADGE_UNTOUCHED_ENDING_META,
  CHAPTER_ALONE_AFTERMATH_LINE,
  CHAPTER_UNPLAYED_AFTERMATH_LINE,
  FATED_FUSE_FAILED_AFTERMATH_LINE,
  getUITooltip,
} from '../../data/ui-content';
import { holdStepsForPostedBeats } from '../playerStepHold';
import { shouldAutoOpenEncounterNotification } from '../views/stage/encounterNotificationRuntime';
import { aloneLineFor } from '../views/stage/buildUnifiedEncounterStageModel';
import {
  BADGE_FATED_FUSE_TOOLTIP_ID,
  selectEncounterBadges,
  untouchedEndingMeta,
} from '../../components/Game/encounterBadgeModel';

// The poster's forecast call is pinned here so each case names its own tier; the
// helper itself is exercised against the Stage in the last block.
const forecastTier: { value: ForecastTier | undefined } = { value: 'fated' };
vi.mock('../views/stage/baseStepForecast', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../views/stage/baseStepForecast')>();
  return {
    ...actual,
    baseStepForecastTier: vi.fn(() => forecastTier.value),
  };
});

// Imported after the mock is declared (vitest hoists `vi.mock`).
const { phaseEncounterVisibility } = await import('../encounterVisibility');
const actualForecast = await vi.importActual<typeof import('../views/stage/baseStepForecast')>('../views/stage/baseStepForecast');
const { buildNudgePhaseModel } = await import('../views/stage/buildNudgePhaseModel');

const ACTOR = 'agent_1';

const NUDGE: StepNudge = {
  id: 'n1',
  name: 'Steady Hand',
  essenceCost: 1,
  forecastDelta: 0.1,
  effectLine: 'Leans the odds their way.',
};

function step(overrides: Partial<ActionStep> = {}): ActionStep {
  return {
    reach: 'iron',
    duration: { min: 1, max: 2 },
    difficulty: 0.2,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'continue_weakened',
    narrativeTemplate: 'The ford is low.',
    deal: {},
    ...overrides,
  } as ActionStep;
}

function template(id: string, steps: ActionStep[]): UnifiedActionTemplate {
  const tpl = {
    id,
    rarityTier: 1,
    intrinsicTier: 'shaping',
    name: 'The Low Ford',
    reach: 'iron',
    crudType: 'read',
    scale: 'local',
    steps,
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'The ford is low.', success: 'Across.', failure: 'Back.' },
  } as unknown as UnifiedActionTemplate;
  registerDebugTemplate(tpl);
  return tpl;
}

const DEALT = template('test.thr2211.dealt', [step(), step()]);
const AUTHORED = template('test.thr2211.authored', [step({ nudges: [NUDGE] }), step()]);
const NO_MOVE = template('test.thr2211.no_move', [step({ deal: undefined })]);

function makeGraph(attentionMode: 'pause' | 'auto_resolve' = 'pause'): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'asc_1', name: 'The God', type: 'actor', category: 'ascendant', properties: { actorType: 'ascendant' } });
  g.addNode({ id: ACTOR, name: 'Kael Thornweaver', type: 'actor', category: 'individual', properties: { actorType: 'individual' } });
  g.addNode({ id: 'loc_1', name: 'The Ford', type: 'location', category: 'wilds', properties: {} });
  g.addEdge({ id: 'loc_edge_1', source: ACTOR, target: 'loc_1', type: 'located_at', properties: {} });
  g.addEdge({
    id: 'thread_1', source: 'asc_1', target: ACTOR, type: 'thread',
    properties: {
      courtPosition: 'the_first',
      tier: 2,
      attentionMode,
      ticksAtCurrentTier: 5,
      establishedTick: 1,
      totalEssenceSpent: 0,
      maintenanceCurrent: true,
      readBackstoryTier: 0,
    } as ThreadEdgeProperties,
  });
  return g;
}

function action(templateId: string, overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: `ua_${templateId}`,
    actorId: ACTOR,
    templateId,
    targetId: 'loc_1',
    scale: 'local',
    source: 'agent',
    startTick: 1,
    resolved: false,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 2,
    stepOutcomes: [],
    choiceHistory: [],
    ...overrides,
  } as unknown as UnifiedAction;
}

function stateWith(actions: UnifiedAction[], attentionMode: 'pause' | 'auto_resolve' = 'pause'): GameState {
  return {
    graph: makeGraph(attentionMode),
    ascendantId: 'asc_1',
    tick: 10,
    encounterProgress: [],
    encounterNotifications: [],
    unifiedActions: actions,
  } as unknown as GameState;
}

const ENDED = { overview: 'The ford was crossed.', narrativeTag: 'held', changes: [] };

beforeEach(() => {
  forecastTier.value = 'fated';
});
afterEach(() => {
  vi.clearAllMocks();
});

describe('THR-2211 — a Fated step with only dealt cards plays out on a fuse', () => {
  it('posts the step with fatedFuse and a deadline FATED_STEP_FUSE_TICKS out; it never opens or holds', () => {
    const state = stateWith([action(DEALT.id)]);
    const { notifications } = phaseEncounterVisibility(state);
    const [beat] = notifications.filter((n) => n.kind !== 'aftermath');
    expect(beat.fatedFuse).toBe(true);
    expect(beat.autoResolveTick).toBe(10 + FATED_STEP_FUSE_TICKS);
    expect(shouldAutoOpenEncounterNotification(beat)).toBe(false);
    const actions = state.unifiedActions ?? [];
    expect(holdStepsForPostedBeats(actions, [beat], state.graph, 10)).toBe(actions);
  });

  it('does not fuse a step with one authored nudge — authored hands always stop', () => {
    const { notifications } = phaseEncounterVisibility(stateWith([action(AUTHORED.id)]));
    const [beat] = notifications;
    expect(beat.fatedFuse).toBeUndefined();
    expect(beat.autoResolveTick).toBeNull();
    expect(shouldAutoOpenEncounterNotification(beat)).toBe(true);
  });

  it('does not fuse a step below Fated', () => {
    forecastTier.value = 'favorable';
    const [beat] = phaseEncounterVisibility(stateWith([action(DEALT.id)])).notifications;
    expect(beat.fatedFuse).toBeUndefined();
    expect(beat.autoResolveTick).toBeNull();
  });

  it('does not fuse when the forecast cannot be read (fail-soft: the step stops)', () => {
    forecastTier.value = undefined;
    const [beat] = phaseEncounterVisibility(stateWith([action(DEALT.id)])).notifications;
    expect(beat.fatedFuse).toBeUndefined();
    expect(shouldAutoOpenEncounterNotification(beat)).toBe(true);
  });

  it('leaves a "Lives on" thread on its own deadline, unmarked', () => {
    const [beat] = phaseEncounterVisibility(stateWith([action(DEALT.id)], 'auto_resolve')).notifications;
    expect(beat.fatedFuse).toBeUndefined();
    expect(beat.autoResolveTick).not.toBeNull();
  });

  it('a step with no move stays a resolved record, never a fuse (THR-2140)', () => {
    const [beat] = phaseEncounterVisibility(stateWith([action(NO_MOVE.id)])).notifications;
    expect(beat.noPlayerMove).toBe(true);
    expect(beat.fatedFuse).toBeUndefined();
  });
});

describe('THR-2211 — an ending the god had no part in waits on its badge', () => {
  function ending(templateId: string, overrides: Partial<UnifiedAction> = {}): EncounterNotification {
    const resolved = action(templateId, {
      resolved: true,
      currentStep: 1,
      stepOutcomes: ['success', 'success'],
      aftermathSummary: ENDED,
      ...overrides,
    } as Partial<UnifiedAction>);
    const { notifications } = phaseEncounterVisibility(stateWith([resolved]));
    const found = notifications.find((n) => n.kind === 'aftermath');
    if (!found) throw new Error('no aftermath posted');
    return found;
  }

  it('posts an untouched ending badgeOnly with its chapter word, and it does not auto-open', () => {
    const n = ending(DEALT.id);
    expect(n.badgeOnly).toBe('untouched_ending');
    expect(n.waitWord).toBe('waits');
    expect(shouldAutoOpenEncounterNotification(n)).toBe(false);
  });

  it('a chapter that offered no move carries the theirs_alone word', () => {
    expect(ending(NO_MOVE.id, { currentStep: 0, stepOutcomes: ['success'] } as Partial<UnifiedAction>).waitWord).toBe('theirs_alone');
  });

  it('a touched ending still auto-opens: one committed card', () => {
    const n = ending(DEALT.id, { activeNudges: ['n1'] } as unknown as Partial<UnifiedAction>);
    expect(n.badgeOnly).toBeUndefined();
    expect(shouldAutoOpenEncounterNotification(n)).toBe(true);
  });

  it('a touched ending still auto-opens: an empty committed hand', () => {
    const n = ending(DEALT.id, {
      choiceHistory: [{ stepIndex: 0, stepId: 's0', choiceId: 'hand', choiceText: '', tick: 4, essenceSpent: 0, handCommitted: true }],
    } as unknown as Partial<UnifiedAction>);
    expect(n.badgeOnly).toBeUndefined();
    expect(shouldAutoOpenEncounterNotification(n)).toBe(true);
  });
});

describe('THR-2211 — badge lines agree with the chapter word', () => {
  function notif(overrides: Partial<EncounterNotification>): EncounterNotification {
    return {
      id: 'n', agentId: ACTOR, agentName: 'Kael Thornweaver', courtPosition: 'the_first',
      encounterId: 'x', encounterName: 'Tend the Shrine', kind: 'aftermath', sourceSystem: 'unified_action',
      actionId: 'ua', stepIndex: 1, prose: '', choices: [], createdTick: 10, autoResolveTick: null,
      viewed: false, resolved: false, ...overrides,
    } as EncounterNotification;
  }

  it('"theirs alone" on a theirs_alone chapter, "played out without your hand" on a waits chapter', () => {
    expect(untouchedEndingMeta({ waitWord: 'theirs_alone', outcomeBand: 'neutral' })).toBe(BADGE_UNTOUCHED_ENDING_META.alone);
    expect(untouchedEndingMeta({ waitWord: 'waits', outcomeBand: 'neutral' })).toBe(BADGE_UNTOUCHED_ENDING_META.unplayed);
  });

  it('"went badly" on a near-miss or worse, whatever the word, in the band accent', () => {
    for (const band of ['fortunate', 'setback', 'catastrophe']) {
      expect(untouchedEndingMeta({ waitWord: 'theirs_alone', outcomeBand: band })).toBe(BADGE_UNTOUCHED_ENDING_META.bad);
    }
    expect(untouchedEndingMeta({ waitWord: 'waits', outcomeBand: 'strained' })).toBe(BADGE_UNTOUCHED_ENDING_META.unplayed);
    const badge = selectEncounterBadges([notif({ badgeOnly: 'untouched_ending', waitWord: 'waits', outcomeBand: 'setback' })]).get(ACTOR)!;
    expect(badge.meta).toBe(BADGE_UNTOUCHED_ENDING_META.bad);
    expect(badge.accentColor).not.toBe('var(--accent-gold)');
    expect(badge.ariaLabel).toBe(`Tend the Shrine, ${BADGE_UNTOUCHED_ENDING_META.bad}`);
    expect(badge.stopSkipped).toBe('untouched_ending');
  });

  it('a fused step badges "Fated — plays out soon unless you step in" with its tooltip', () => {
    const badge = selectEncounterBadges([notif({ kind: 'encounter', fatedFuse: true, autoResolveTick: 18, encounterName: 'The Refugee Aid' })]).get(ACTOR)!;
    expect(badge.meta).toBe(BADGE_FATED_FUSE_META);
    expect(badge.ariaLabel).toBe('The Refugee Aid, Fated — plays out soon unless you step in');
    expect(badge.tooltipId).toBe(BADGE_FATED_FUSE_TOOLTIP_ID);
    const tooltip = getUITooltip(BADGE_FATED_FUSE_TOOLTIP_ID)?.desc ?? '';
    expect(tooltip).toContain('within the day');
    expect(tooltip).not.toMatch(/\d/); // Law 7: no probability
  });

  it('an empty chapter slot reads "A chapter"', () => {
    const fused = selectEncounterBadges([notif({ kind: 'encounter', fatedFuse: true, encounterName: '' })]).get(ACTOR)!;
    expect(fused.ariaLabel).toBe('A chapter, Fated — plays out soon unless you step in');
    const ended = selectEncounterBadges([notif({ badgeOnly: 'untouched_ending', encounterName: '' })]).get(ACTOR)!;
    expect(ended.label).toBe('A chapter');
    expect(ended.ariaLabel.startsWith('A chapter, ')).toBe(true);
  });

  it('a held step keeps its "waiting for you" line; an ordinary ending keeps "open aftermath"', () => {
    const plain = selectEncounterBadges([notif({})]).get(ACTOR)!;
    expect(plain.ariaLabel).toBe('Tend the Shrine concluded — open aftermath');
    expect(plain.stopSkipped).toBeUndefined();
  });
});

describe('THR-2211 — the ending line', () => {
  function lineFor(templateId: string, overrides: Partial<UnifiedAction>, notifications: EncounterNotification[] = [], agentName = 'Kael Thornweaver'): string | undefined {
    const graph = makeGraph('pause');
    const tpl = templateId === DEALT.id ? DEALT : NO_MOVE;
    return aloneLineFor({
      template: tpl,
      activeAction: action(templateId, { resolved: true, ...overrides }),
      graph,
      agentName,
      gameState: { encounterNotifications: notifications } as unknown as GameState,
    } as unknown as Parameters<typeof aloneLineFor>[0]);
  }

  it('a waits chapter left untouched shows the unplayed line, never the alone line', () => {
    const line = lineFor(DEALT.id, { stepOutcomes: ['success', 'success'] });
    expect(line).toBe(CHAPTER_UNPLAYED_AFTERMATH_LINE.replace('{name}', 'Kael Thornweaver'));
    expect(line).not.toBe(CHAPTER_ALONE_AFTERMATH_LINE.replace('{name}', 'Kael Thornweaver'));
  });

  it('a theirs_alone chapter keeps the alone line', () => {
    expect(lineFor(NO_MOVE.id, { stepOutcomes: ['success'] })).toBe(CHAPTER_ALONE_AFTERMATH_LINE.replace('{name}', 'Kael Thornweaver'));
  });

  it('a touched waits chapter has no line', () => {
    expect(lineFor(DEALT.id, { stepOutcomes: ['success', 'success'], activeNudges: ['n1'] } as unknown as Partial<UnifiedAction>)).toBeUndefined();
  });

  it('a fused step that landed below success shows the failed-fuse line', () => {
    const fused = { fatedFuse: true, actionId: `ua_${DEALT.id}`, stepIndex: 0, kind: 'encounter' } as EncounterNotification;
    expect(lineFor(DEALT.id, { stepOutcomes: ['failure', 'success'] }, [fused]))
      .toBe(FATED_FUSE_FAILED_AFTERMATH_LINE.replace('{name}', 'Kael Thornweaver'));
    // A fused step that succeeded ends on the unplayed line.
    expect(lineFor(DEALT.id, { stepOutcomes: ['success', 'success'] }, [fused]))
      .toBe(CHAPTER_UNPLAYED_AFTERMATH_LINE.replace('{name}', 'Kael Thornweaver'));
  });

  it('every line fills its name slot (no raw token, PC-3)', () => {
    for (const line of [CHAPTER_UNPLAYED_AFTERMATH_LINE, FATED_FUSE_FAILED_AFTERMATH_LINE]) {
      expect(line).toContain('{name}');
      expect(line.replace(/{name}/g, 'Kael')).not.toContain('{');
    }
    // An empty actor name falls back to the agent name on the args.
    const graph = makeGraph('pause');
    graph.getNode(ACTOR)!.name = '';
    const line = aloneLineFor({
      template: DEALT, activeAction: action(DEALT.id, { resolved: true, stepOutcomes: ['success', 'success'] }),
      graph, agentName: 'Kael', gameState: { encounterNotifications: [] } as unknown as GameState,
    } as unknown as Parameters<typeof aloneLineFor>[0]);
    expect(line).toBe(CHAPTER_UNPLAYED_AFTERMATH_LINE.replace('{name}', 'Kael'));
  });
});

describe('THR-2211 — Stage tier = poster tier (Law 18, one call)', () => {
  const cases: Array<[string, number, NonNullable<UnifiedActionTemplate['scale']>]> = [
    ['easy local', 0.05, 'local'],
    ['middle regional', 0.45, 'regional'],
    ['hard regional', 0.9, 'regional'],
  ];
  for (const [label, difficulty, scale] of cases) {
    it(`agrees on a ${label} step`, () => {
      const s = step({ difficulty, deal: undefined, nudges: [NUDGE] });
      const tpl = { ...DEALT, id: `test.thr2211.tier.${label}`, scale, steps: [s] } as UnifiedActionTemplate;
      const graph = makeGraph('pause');
      const act = action(tpl.id);
      const gameState = { essencePool: {}, unlockedActionIds: [] } as unknown as GameState;
      const phase = buildNudgePhaseModel({ template: tpl, activeAction: act, step: s, graph, gameState })!;
      const posterTier = actualForecast.baseStepForecastTier(graph, gameState, act, tpl, 0);
      expect(posterTier).toBeDefined();
      expect(phase.baseForecast.tier).toBe(posterTier);
    });
  }
});
