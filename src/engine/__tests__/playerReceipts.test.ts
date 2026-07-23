import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { WorldGraph } from '../graph';
import { clearTraces, enableTracing, disableTracing, getTraces } from '../traceBuffer';
import { processPlayerReceipts } from '../playerReceipts';
import { resolveAftermathContextForAgent } from '../encounterAftermath';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { RECEIPT_MODAL_RARITY_FLOOR, RECEIPT_QUEUE_MAX } from '../../data/receipt-content';
import { ASCENDANT_POOL_BEAT_TEMPLATES } from '../../data/ascendant-pool-beat-templates';
import type { GameState } from '../../types/gameState';
import type {
  UnifiedAction,
  EncounterAftermathReaction,
  EncounterAftermathChange,
  EncounterAftermathSummary,
} from '../../types/unifiedAction';

// A real 1-step, common (< modal rarity floor), ascendant-castable template — the toast tier.
const TOAST_TEMPLATE = UNIFIED_ACTION_TEMPLATES.find(
  (t) =>
    (t.steps?.length ?? 1) === 1 &&
    t.rarityTier < RECEIPT_MODAL_RARITY_FLOOR &&
    (t.actorAffinities?.includes('ascendant') ?? false),
);

const REACTION: EncounterAftermathReaction = {
  id: 'keep',
  label: 'Keep the thread alive',
  effects: [{ kind: 'reputation_tally', key: 'heart.positive', delta: 1 }],
};

function summary(overrides?: Partial<EncounterAftermathSummary>): EncounterAftermathSummary {
  return {
    encounterId: 'enc',
    outcome: 'success',
    overview: 'The working settled.',
    changes: [],
    ...overrides,
  };
}

function makeAction(
  templateId: string,
  overrides?: Partial<UnifiedAction>,
): UnifiedAction {
  return {
    actionId: 'ua-1',
    actorId: 'asc-1',
    templateId,
    targetId: 'mortal-1',
    scale: 'personal',
    source: 'player',
    startTick: 3,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 1,
    resolved: true,
    outcome: 'success',
    completedAtTick: 7,
    stepOutcomes: [],
    aftermathSummary: summary(),
    ...overrides,
  };
}

function makeState(actions: UnifiedAction[]): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'The Witness', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'mortal-1', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  return {
    tick: 7,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as never,
    tiles: [],
    clock: {} as never,
    ascendantId: 'asc-1',
    ascendantIdentity: null,
    essencePool: {} as never,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as never,
    doomClock: {} as never,
    doomIdentityMatrix: null,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as never,
    familiarityMap: {} as never,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: actions,
    archetypeDrift: [],
    regionalDetectionPressure: [],
    regionDetection: [],
    worldSoul: {} as never,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as never,
  } as unknown as GameState;
}

describe('phasePlayerReceipts', () => {
  beforeEach(() => { clearTraces(); enableTracing(); });
  afterEach(() => { clearTraces(); disableTracing(); });

  it('has a qualifying toast-tier template to test against', () => {
    expect(TOAST_TEMPLATE).toBeTruthy();
  });

  it('enqueues a toast-tier receipt for a plain single-step common cast', () => {
    const state = makeState([makeAction(TOAST_TEMPLATE!.id)]);
    const next = processPlayerReceipts(state, {}) as GameState;

    const receipts = next.playerActionReceipts ?? [];
    expect(receipts).toHaveLength(1);
    expect(receipts[0].presentation).toBe('toast');
    expect(receipts[0].acknowledged).toBe(false);
    expect(receipts[0].id).toBe('receipt_ua-1');

    // Toast-tier event carries a toast notification directive + band.
    const evt = next.tickEvents.find((e) => e.type === 'player_action_receipt');
    expect(evt).toBeTruthy();
    expect(evt!.notification?.channel).toBe('toast');
    expect(evt!.band).toBeTruthy();

    // Idempotency flag set on the action.
    expect(next.unifiedActions[0].playerReceiptEmitted).toBe(true);

    const enq = getTraces().find((t) => (t.category as string) === 'player_receipt');
    expect(enq).toBeTruthy();
  });

  it('promotes to the modal tier when the template authors aftermath reactions', () => {
    const state = makeState([makeAction(TOAST_TEMPLATE!.id, {
      aftermathSummary: summary({ reactions: [REACTION] }),
    })]);
    const next = processPlayerReceipts(state, {}) as GameState;

    const receipt = (next.playerActionReceipts ?? [])[0];
    expect(receipt.presentation).toBe('modal');
    expect(receipt.reactions).toHaveLength(1);

    // Modal-tier event has NO toast notification (the modal is the surface).
    const evt = next.tickEvents.find((e) => e.type === 'player_action_receipt');
    expect(evt!.notification).toBeUndefined();
  });

  it('promotes to the modal tier when a change kind is world-shifting', () => {
    const change: EncounterAftermathChange = {
      id: 'c1', kind: 'trait', title: 'A mark was left', detail: 'x', polarity: 'info',
    };
    const state = makeState([makeAction(TOAST_TEMPLATE!.id, {
      aftermathSummary: summary({ changes: [change] }),
    })]);
    const next = processPlayerReceipts(state, {}) as GameState;
    expect((next.playerActionReceipts ?? [])[0].presentation).toBe('modal');
  });

  it('is idempotent — a second run enqueues nothing more', () => {
    const first = processPlayerReceipts(makeState([makeAction(TOAST_TEMPLATE!.id)]), {}) as GameState;
    const second = processPlayerReceipts(first, {}) as GameState;
    // Second run sees playerReceiptEmitted=true → no candidates → returns {} (queue unchanged).
    expect(second.playerActionReceipts ?? first.playerActionReceipts).toHaveLength(1);
  });

  it('never produces a receipt for a non-player action', () => {
    const state = makeState([makeAction(TOAST_TEMPLATE!.id, { source: 'agent' })]);
    const next = processPlayerReceipts(state, {}) as GameState;
    expect(next.playerActionReceipts ?? []).toHaveLength(0);
  });

  it('excludes Ascendant Beat templates (they keep their own modal)', () => {
    const beatId = ASCENDANT_POOL_BEAT_TEMPLATES[0]?.id;
    expect(beatId).toBeTruthy();
    const state = makeState([makeAction(beatId!, { aftermathSummary: summary({ reactions: [REACTION] }) })]);
    const next = processPlayerReceipts(state, {}) as GameState;
    expect(next.playerActionReceipts ?? []).toHaveLength(0);
  });

  it('caps the queue at RECEIPT_QUEUE_MAX (drop oldest) and traces the cap', () => {
    // Pre-fill the queue to the cap, then resolve one more.
    const preloaded = Array.from({ length: RECEIPT_QUEUE_MAX }, (_v, i) => ({
      id: `receipt_old-${i}`,
      actionId: `old-${i}`,
      templateId: TOAST_TEMPLATE!.id,
      templateName: 'x',
      targetId: 'mortal-1',
      targetName: 'Kael',
      essencePaid: 0,
      startTick: 0,
      resolvedTick: 1,
      outcome: 'success' as const,
      outcomeBand: 'neutral' as const,
      overview: '',
      changes: [],
      presentation: 'toast' as const,
      acknowledged: false,
    }));
    const state = makeState([makeAction(TOAST_TEMPLATE!.id)]);
    state.playerActionReceipts = preloaded;
    const next = processPlayerReceipts(state, {}) as GameState;
    expect(next.playerActionReceipts).toHaveLength(RECEIPT_QUEUE_MAX);
    // Oldest dropped, newest present.
    expect((next.playerActionReceipts ?? []).some((r) => r.id === 'receipt_ua-1')).toBe(true);
    expect((next.playerActionReceipts ?? []).some((r) => r.id === 'receipt_old-0')).toBe(false);
    expect(getTraces().some((t) => (t as { event?: string }).event === 'queue_capped')).toBe(true);
  });

  it('builds a fallback receipt trace and no receipt when the template is unknown', () => {
    const state = makeState([makeAction('not.a.real.template')]);
    const next = processPlayerReceipts(state, {}) as GameState;
    expect(next.playerActionReceipts ?? []).toHaveLength(0);
    expect(next.unifiedActions[0].playerReceiptEmitted).toBe(true); // never rescanned
    expect(getTraces().some((t) => (t as { event?: string }).event === 'fallback_receipt')).toBe(true);
  });

  it('resolveAftermathContextForAgent finds a resolved player action for the ascendant (grey-zone verify)', () => {
    const state = makeState([makeAction(TOAST_TEMPLATE!.id, {
      aftermathSummary: summary({ reactions: [REACTION] }),
    })]);
    const ctx = resolveAftermathContextForAgent(state, 'asc-1', 'keep');
    expect('error' in ctx).toBe(false);
    if (!('error' in ctx)) {
      expect(ctx.action.actorId).toBe('asc-1');
      expect(ctx.reaction.id).toBe('keep');
    }
  });
});
