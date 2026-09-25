// @vitest-environment jsdom
/**
 * THR-1551 — the fight on screen, slice F2: the opponent header
 * (plan doc `Docs/plans/2026-09-23-fight-on-screen.md` § UI pillar 1).
 *
 * Each block pins one Done-when clause: the header names the opponent (and the
 * cast beast on a hunt's nerve step), the threat whisper stands down on fight
 * steps in both the full veil and the watched view, the step titles, the clock
 * word carried across the nerve step with a pending recovery, the square pips at
 * the glyph floor with an aria-label, no key:value strip, and a duel's two clocks.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EncounterVeil } from '../../EncounterVeil';
import { OpponentHeader } from '../OpponentHeader';
import {
  buildOpponentHeaderModel,
  fightStepLabel,
} from '../adapters/buildOpponentHeaderModel';
import { buildUnifiedEncounterStageModel } from '../adapters/buildUnifiedEncounterStageModel';
import { buildSimpleEncounterStageModel } from '../adapters/buildSimpleEncounterStageModel';
import { WorldGraph } from '../../../../engine/graph';
import { executeStepResult } from '../../../../engine/unifiedActionResolution';
import { disableTracing } from '../../../../engine/traceBuffer';
import { readOpponentCard } from '../../../../engine/fights/opponentCard';
import { resolveTooltip, tooltipResolves } from '../../../../engine/tooltipResolver';
import { FIGHT_LAIR_CONFRONT, FIGHT_LAIR_CONFRONT_ID } from '../../../../data/encounters/fight-lair-confront';
import { MONSTER_HUNT_NAMED_ELITE } from '../../../../data/monster-encounter-content';
import { FIGHT_CLOCK_RECOVERY_TICKS } from '../../../../data/fight-constants';
import {
  CLOCK_STATE_WORDS,
  FIGHT_CLOCK_PIP_SIZE,
  FIGHT_STEP_LABELS,
  FIGHT_TOOLTIP_IDS,
  UNKNOWN_FOE_NAME,
  clockStateWord,
} from '../../../../data/fight-screen-content';
import type { GameState } from '../../../../types/gameState';
import type { FightState } from '../../../../types/fight';
import type { EncounterNotification } from '../../../../types/encounterVisibility';
import type { ActiveEncounterDisplay } from '../../encounterNotificationRuntime';
import type {
  StepOutcome,
  UnifiedAction,
  UnifiedActionTemplate,
} from '../../../../types/unifiedAction';

vi.mock('../../../../services/narration/useNarration', () => ({
  useNarration: () => ({
    enabled: false, status: 'idle' as const, backendType: null, loadProgress: 0, error: null,
    isSpeaking: false, isLoading: false, isAvailable: false,
    init: vi.fn(), initWorker: vi.fn(), speak: vi.fn(), speakSections: vi.fn(), stop: vi.fn(),
    narrateChronicle: vi.fn(),
  }),
}));

const TICK = 200;
const midRng = () => 0.5;

beforeEach(() => disableTracing());
afterEach(() => {
  cleanup();
  disableTracing();
});

// ─── Fixture ────────────────────────────────────────────────────

interface WorldOpts {
  readonly opponent?: 'monster' | 'mortal';
  readonly monsterCard?: Record<string, unknown>;
}

function world(opts: WorldOpts = {}): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({ id: 'den', type: 'location', name: 'The Den', properties: { hexCol: 2, hexRow: 2, locationSubtype: 'lair' } });
  graph.addNode({
    id: 'hero', type: 'actor', name: 'Kael Thornweaver',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: 10, heart: 10, eye: 10, veil: 10 },
      axiologicalProfile: { courage_prudence: 0.35 },
    },
  });
  graph.addEdge({ id: 'e.hero.at', source: 'hero', target: 'den', type: 'located_at', properties: {} });
  const monster = (opts.opponent ?? 'monster') === 'monster';
  graph.addNode({
    id: 'beast', type: 'actor', name: 'Grothmaw the Hollow',
    properties: {
      actorType: 'individual',
      domainCapabilities: { iron: 10 },
      ...(monster
        ? {
          isMonsterElite: true,
          monsterState: {
            family: 'beast', dread: 'steep', might: 'steep', clockSize: 4, clockFilled: 0,
            clockUpdatedTick: TICK, temperShown: false, ...opts.monsterCard,
          },
        }
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

function fightAction(overrides: Partial<UnifiedAction> = {}, templateId = FIGHT_LAIR_CONFRONT_ID): UnifiedAction {
  return {
    actionId: 'ua_f2', actorId: 'hero', templateId, targetId: 'beast',
    scale: 'regional', source: 'agent',
    startTick: TICK - 5, currentStep: nerveIndex(FIGHT_LAIR_CONFRONT), stepProgress: 1, stepDuration: 1,
    resolved: false, stepOutcomes: [], choiceHistory: [],
    ...overrides,
  } as unknown as UnifiedAction;
}

function nerveIndex(template: UnifiedActionTemplate): number {
  return template.steps.findIndex((s) => (s as { fightRole?: string }).fightRole === 'nerve');
}

function runBand(state: GameState, a: UnifiedAction, band: StepOutcome): UnifiedAction {
  return executeStepResult(a, FIGHT_LAIR_CONFRONT, band, [], state, midRng, state.tick, {
    capability: 0.5, probability: 0.5, roll: 50,
  }).updatedAction;
}

function notification(threadTier: 'strong' | 'watched'): EncounterNotification {
  return {
    id: 'notif-f2', agentId: 'hero', agentName: 'Kael Thornweaver', courtPosition: 'the_first',
    encounterId: FIGHT_LAIR_CONFRONT_ID, encounterName: FIGHT_LAIR_CONFRONT.name,
    prose: 'The den is quiet.', choices: [], tick: TICK, threadTier,
  } as unknown as EncounterNotification;
}

function unifiedModel(state: GameState, action: UnifiedAction) {
  return buildUnifiedEncounterStageModel({
    template: FIGHT_LAIR_CONFRONT,
    activeAction: action,
    notification: notification('strong'),
    agentName: 'Kael Thornweaver',
    threadTier: 'strong',
    graph: state.graph,
    essence: 10,
    gameState: state,
    tick: state.tick,
  });
}

/**
 * The watched view's model, built the way the tier routing builds it: a
 * `watched` encounter never reaches the unified adapter (`GameView`'s
 * `unifiedTemplateForStage` returns null for it) and falls back to
 * `buildSimpleEncounterStageModel`, handed the live unified action.
 */
function watchedModel(state: GameState, action: UnifiedAction) {
  return buildSimpleEncounterStageModel({
    notification: notification('watched'),
    encounter: {
      encounterId: FIGHT_LAIR_CONFRONT_ID, actorId: 'hero', currentStepIndex: action.currentStep,
      status: 'awaiting_choice', history: [], resolutionHistory: [], startedTick: TICK,
      sourceSystem: 'unified_action',
    } as unknown as ActiveEncounterDisplay,
    template: FIGHT_LAIR_CONFRONT,
    agentName: 'Kael Thornweaver',
    agentId: 'hero',
    graph: state.graph,
    threadTier: 'watched',
    essence: 10,
    tick: state.tick,
    gameState: state,
    activeAction: action,
  });
}

const veilProps = {
  open: true,
  essence: 12,
  tick: TICK,
  autoResolveTick: null as number | null,
  onIntervene: vi.fn(),
  onBoost: vi.fn(),
  onPeek: vi.fn(),
  onDisregard: vi.fn(),
  onAcknowledgeAftermath: vi.fn(),
  onAftermathReaction: vi.fn(),
};

// ─── The words ──────────────────────────────────────────────────

describe('clock-state words (plan § Prose tables)', () => {
  it('follow the fill table, never a numeral', () => {
    expect(clockStateWord(0, 4)).toBe('untouched');
    expect(clockStateWord(1, 4)).toBe('bloodied');
    expect(clockStateWord(2, 4)).toBe('half-broken');
    expect(clockStateWord(3, 4)).toBe('failing');
    expect(clockStateWord(4, 4)).toBe('failing'); // a ward or an echo: full but alive
    expect(clockStateWord(4, 4, true)).toBe('slain');
    expect(clockStateWord(1, 2)).toBe('failing'); // a mortal's two-segment clock
    for (const word of CLOCK_STATE_WORDS) expect(word).not.toMatch(/\d/);
  });

  it('every fight.* id resolves in the one registry, and every sentence clause carries a live one (Law 17/21)', () => {
    for (const { tooltipId } of Object.values(FIGHT_TOOLTIP_IDS)) {
      expect(tooltipResolves(tooltipId), tooltipId).toBe(true);
    }
    const shown = buildOpponentHeaderModel(
      stateOf(world({ monsterCard: { temperShown: true, temper: 'berserk' } })), fightAction(), FIGHT_LAIR_CONFRONT,
    )!;
    const ids = shown.sentence.flatMap((s) => (s.tooltipId ? [s.tooltipId] : []));
    expect(ids).toEqual(['fight.dread', 'fight.might', 'fight.temper']);
    for (const id of ids) expect(tooltipResolves(id), id).toBe(true);
    expect(resolveTooltip('fight.clock')?.desc).toMatch(/a blow, a spell, a trick/);
  });
});

// ─── Who the header names ───────────────────────────────────────

describe('the header names the opponent', () => {
  it('names the monster on a fight step, never "an unknown foe", and builds nothing off one', () => {
    const state = stateOf(world());
    const header = buildOpponentHeaderModel(state, fightAction(), FIGHT_LAIR_CONFRONT)!;
    expect(header.name).toBe('Grothmaw the Hollow');
    expect(header.name).not.toBe(UNKNOWN_FOE_NAME);
    expect(header.linkable).toBe(true);
    expect(header.visualKind).toBe('monster');
    expect(header.sentenceText).toBe('A beast of claw and hunger. Fearsome to face, dangerous to fight.');

    // A non-fight step of any template builds no header.
    const plain = { ...FIGHT_LAIR_CONFRONT, steps: [{ ...(FIGHT_LAIR_CONFRONT.steps[0] as object), fightRole: undefined }] } as unknown as UnifiedActionTemplate;
    expect(buildOpponentHeaderModel(state, fightAction({ currentStep: 0 }), plain)).toBeNull();
  });

  it('on monster.hunt.named_elite (target: the lair) names the cast beast on the nerve step', () => {
    const state = stateOf(world());
    const tpl = MONSTER_HUNT_NAMED_ELITE;
    const action = fightAction({
      templateId: tpl.id,
      targetId: 'den',
      currentStep: nerveIndex(tpl),
      supportBindings: [{ key: 'beast', kind: 'actor', nodeId: 'beast' }] as never,
    });
    expect(nerveIndex(tpl)).toBeGreaterThan(0);
    const header = buildOpponentHeaderModel(state, action, tpl)!;
    expect(header.role).toBe('nerve');
    expect(header.name).toBe('Grothmaw the Hollow');
    expect(header.opponentId).toBe('beast');
  });

  it('an unresolvable opponent renders as "an unknown foe", with no link (fail-soft)', () => {
    const state = stateOf(world());
    const header = buildOpponentHeaderModel(state, fightAction({ targetId: 'nobody' }), FIGHT_LAIR_CONFRONT)!;
    expect(header.name).toBe(UNKNOWN_FOE_NAME);
    expect(header.linkable).toBe(false);
  });

  it('shows the temper clause only once the temper has shown', () => {
    const hidden = buildOpponentHeaderModel(stateOf(world()), fightAction(), FIGHT_LAIR_CONFRONT)!;
    expect(hidden.sentenceText).not.toMatch(/berserk/);
    const shown = buildOpponentHeaderModel(
      stateOf(world({ monsterCard: { temperShown: true, temper: 'berserk' } })), fightAction(), FIGHT_LAIR_CONFRONT,
    )!;
    expect(shown.sentenceText).toMatch(/It fights on berserk\.$/);
  });
});

// ─── Step titles ────────────────────────────────────────────────

describe('fight step titles', () => {
  it('read "Facing it", "First exchange" … in the model history and the header', () => {
    const state = stateOf(world());
    const model = unifiedModel(state, fightAction());
    const nerve = nerveIndex(FIGHT_LAIR_CONFRONT);
    const fightTitles = model.history.slice(nerve).map((h) => h.stepTitle);
    expect(fightTitles).toEqual(FIGHT_STEP_LABELS.slice(0, fightTitles.length));
    expect(fightTitles.slice(0, 2)).toEqual(['Facing it', 'First exchange']);
    expect(model.history[nerve].stepLabel).toBe('Facing it');
    expect(model.opponentHeader?.stepLabel).toBe('Facing it');
    expect(fightStepLabel(FIGHT_LAIR_CONFRONT, nerve + 1)).toBe('First exchange');
  });
});

// ─── The clock ──────────────────────────────────────────────────

describe('the clock', () => {
  it('the nerve step shows the same word the first exchange starts from, with a pending recovery', () => {
    // Three segments stored two recovery periods ago: one segment is really left.
    const state = stateOf(world({
      monsterCard: { clockFilled: 3, clockUpdatedTick: TICK - 2 * FIGHT_CLOCK_RECOVERY_TICKS },
    }));
    const nerveAction = fightAction();
    const onNerve = buildOpponentHeaderModel(state, nerveAction, FIGHT_LAIR_CONFRONT)!;
    expect(readOpponentCard(state.graph, 'beast', TICK).clockFilled).toBe(1);
    expect(onNerve.clock.word).toBe('bloodied'); // not "failing" — the raw stored value

    const afterNerve = runBand(state, nerveAction, 'success');
    expect(afterNerve.fightState).toBeDefined();
    expect(afterNerve.fightState!.clockAtStart).toBe(1);
    const onFirstExchange = buildOpponentHeaderModel(state, afterNerve, FIGHT_LAIR_CONFRONT)!;
    expect(onFirstExchange.stepLabel).toBe('First exchange');
    expect(onFirstExchange.clock.word).toBe(onNerve.clock.word);
  });

  it('once the fight exists, the word reads fightState.clockNow (what getFightState reports)', () => {
    const state = stateOf(world());
    const fightState = {
      opponentId: 'beast', clockSize: 4, clockAtStart: 0, clockNow: 2, persistent: true,
      exchanges: 1, harmTaken: 0, wounds: 0, blowsLanded: 1, momentum: 0,
      temperFired: false, berserk: false, advantages: [], forks: [],
      conditionsApplied: [], storiedClimbs: [],
    } as FightState;
    const header = buildOpponentHeaderModel(
      state, fightAction({ currentStep: nerveIndex(FIGHT_LAIR_CONFRONT) + 2, fightState }), FIGHT_LAIR_CONFRONT,
    )!;
    expect(header.clock).toMatchObject({ size: 4, filled: 2, word: clockStateWord(fightState.clockNow, fightState.clockSize) });
    expect(header.clock.word).toBe('half-broken');
  });

  it('agent mode: the view-model carries both clocks and both words', () => {
    const state = stateOf(world({ opponent: 'mortal' }));
    const fightState = {
      opponentId: 'beast', clockSize: 2, clockAtStart: 0, clockNow: 1, persistent: false,
      exchanges: 1, harmTaken: 0, wounds: 0, blowsLanded: 1, momentum: 0,
      temperFired: false, berserk: false, advantages: [], forks: [],
      conditionsApplied: [], storiedClimbs: [],
      fightMode: 'agent', fighterClockSize: 2, fighterClockNow: 0,
    } as FightState;
    const header = buildOpponentHeaderModel(
      state, fightAction({ currentStep: nerveIndex(FIGHT_LAIR_CONFRONT) + 1, fightState }), FIGHT_LAIR_CONFRONT,
    )!;
    expect(header.visualKind).toBe('agent');
    expect(header.clock.word).toBe('failing');
    expect(header.fighterClock).toMatchObject({ size: 2, filled: 0, word: 'untouched', name: 'Kael Thornweaver' });

    // NPC mode (no fighter clock fields) renders one clock only.
    const npc = buildOpponentHeaderModel(stateOf(world()), fightAction(), FIGHT_LAIR_CONFRONT)!;
    expect(npc.fighterClock).toBeUndefined();
  });
});

// ─── The rendered header ────────────────────────────────────────

describe('OpponentHeader renders the Laws', () => {
  it('square pips at FIGHT_CLOCK_PIP_SIZE with an aria-label, a linked name, no key:value strip', () => {
    const state = stateOf(world({ monsterCard: { clockFilled: 2 } }));
    const model = buildOpponentHeaderModel(state, fightAction(), FIGHT_LAIR_CONFRONT)!;
    const onSelect = vi.fn();
    render(<OpponentHeader model={model} onSelectOpponent={onSelect} />);

    const row = screen.getByRole('img', { name: 'half-broken' });
    expect(row.getAttribute('data-shape')).toBe('square');
    const pips = [...row.children] as HTMLElement[];
    expect(pips).toHaveLength(4);
    for (const pip of pips) {
      expect(pip.style.width).toBe(`${FIGHT_CLOCK_PIP_SIZE}px`);
      expect(pip.style.borderRadius).not.toBe('50%');
    }
    expect(pips.filter((p) => p.getAttribute('data-filled') === 'true')).toHaveLength(2);
    expect(screen.getByTestId('opponent-clock-word').textContent).toBe('half-broken');

    screen.getByTestId('opponent-name').click();
    expect(onSelect).toHaveBeenCalledWith('beast');

    const text = screen.getByTestId('opponent-header').textContent ?? '';
    expect(text).not.toMatch(/\d/); // Law 13: no digit, fraction or percentage
    expect(text).not.toMatch(/\b(dread|might|clock)\s*:/i); // Law 16: no key:value strip
    expect(text).not.toMatch(/\w+:\s*\w+/);
  });

  it('a duel renders two clock rows, each with its word', () => {
    const state = stateOf(world({ opponent: 'mortal' }));
    const fightState = {
      opponentId: 'beast', clockSize: 2, clockAtStart: 0, clockNow: 1, persistent: false,
      exchanges: 1, harmTaken: 0, wounds: 0, blowsLanded: 1, momentum: 0,
      temperFired: false, berserk: false, advantages: [], forks: [],
      conditionsApplied: [], storiedClimbs: [],
      fightMode: 'agent', fighterClockSize: 2, fighterClockNow: 0,
    } as FightState;
    const model = buildOpponentHeaderModel(
      state, fightAction({ currentStep: nerveIndex(FIGHT_LAIR_CONFRONT) + 1, fightState }), FIGHT_LAIR_CONFRONT,
    )!;
    render(<OpponentHeader model={model} />);
    expect(screen.getAllByTestId('opponent-clock-row')).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'failing' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'untouched' })).toBeTruthy();
  });
});

// ─── The veil: one magnitude language on a fight step ───────────

describe('the threat whisper stands down on fight steps (Law 10)', () => {
  it('full veil: no threat word, and the opponent header renders under the context strip', () => {
    const state = stateOf(world());
    const model = unifiedModel(state, fightAction());
    expect(model.header.threatLabel).toBeUndefined();
    expect(model.opponentHeader?.name).toBe('Grothmaw the Hollow');

    render(<EncounterVeil {...veilProps} model={model} threadTier="strong" onSelectAgent={vi.fn()} />);
    expect(screen.queryByTestId('veil-threat-whisper')).toBeNull();
    expect(document.body.textContent).not.toMatch(/threat/i);
    expect(screen.getByTestId('opponent-header')).toBeTruthy();
    const context = screen.getByTestId('encounter-context-block');
    const header = screen.getByTestId('opponent-header');
    expect(context.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('full veil off a fight step keeps its threat word and draws no opponent header', () => {
    const state = stateOf(world());
    const plain = { ...FIGHT_LAIR_CONFRONT, steps: [{ ...(FIGHT_LAIR_CONFRONT.steps[0] as object), fightRole: undefined }] } as unknown as UnifiedActionTemplate;
    const model = buildUnifiedEncounterStageModel({
      template: plain,
      activeAction: fightAction({ currentStep: 0 }),
      notification: notification('strong'),
      agentName: 'Kael Thornweaver', threadTier: 'strong', graph: state.graph, essence: 10,
      gameState: state, tick: state.tick,
    });
    expect(model.header.threatLabel).toBeTruthy();
    expect(model.opponentHeader).toBeUndefined();
    render(<EncounterVeil {...veilProps} model={model} threadTier="strong" />);
    expect(screen.getByTestId('veil-threat-whisper').textContent).toMatch(/threat$/);
  });

  it('watched view (built through the tier routing): no threat word, the opponent name and clock word instead', () => {
    const state = stateOf(world({ monsterCard: { clockFilled: 1 } }));
    const model = watchedModel(state, fightAction());
    expect(model.header.threatLabel).toBeUndefined();
    expect(model.header.opponentLine).toMatchObject({ name: 'Grothmaw the Hollow', clockWord: 'bloodied', opponentId: 'beast' });

    const onSelectAgent = vi.fn();
    render(<EncounterVeil {...veilProps} model={model} threadTier="watched" onSelectAgent={onSelectAgent} />);
    const line = screen.getByTestId('watched-opponent-line');
    expect(line.textContent).toBe('Facing Grothmaw the Hollow — bloodied');
    expect(document.body.textContent).not.toMatch(/threat/i);
    screen.getByRole('button', { name: 'View Grothmaw the Hollow' }).click();
    expect(onSelectAgent).toHaveBeenCalledWith('beast');
  });

  it('GameView hands the watched fallback the live unified action (the routing the watched test mirrors)', () => {
    const here = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(resolve(here, '../../GameView.tsx'), 'utf8');
    const fallback = source.slice(source.indexOf('return buildSimpleEncounterStageModel({'));
    expect(fallback.slice(0, 1200)).toMatch(/activeAction:\s*\(tieredEncounterState\.activeActionId/);
    // …and the unified path never takes a watched encounter.
    expect(source).toMatch(/if \(tieredEncounterState\.threadTier === 'watched'\) return null;/);
  });
});
