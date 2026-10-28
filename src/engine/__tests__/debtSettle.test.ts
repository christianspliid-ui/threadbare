/**
 * THR-2023 — debts in the money encounters.
 *
 * `settleDebt` is the second remover of a debt (expiry is the first). The template cases drive
 * the real shipped band tables — read off the converted runtime template, so the converter
 * allowlist is proven to carry `outcomeEffects` and `supportBundle` — through
 * `applyEncounterAftermathReaction`, and assert the graph afterwards.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorldGraph } from '../graph';
import { applyEncounterAftermathReaction } from '../encounterAftermath';
import { createSimulationRuntime } from '../simulationRuntime';
import { compareDebtsOldestFirst, listDebtsOwedTo, settleDebt } from '../debtSettle';
import { countDebts, phaseEconomicTraits } from '../phaseEconomicTraits';
import { getAgentAttachments, agreementLine } from '../agentAttachments';
import { readAgreement } from '../agreementShape';
import { clearTraces, enableTracing, getTraces } from '../traceBuffer';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { DEBT_REPAY_MEANS, LOAN_COLLECTION_SEED_DELAY_TICKS, LOAN_PRINCIPAL_MEANS, MEANS_STEP, MEANS_STEP_BIG, MEANS_STEP_SMALL } from '../../data/mortal-means-constants';
import { AGREEMENT_REWARD_TEMPLATES } from '../../data/agreement-reward-catalog';
import { instantiateAgreementReward } from '../rewardPool';
import type { GameState } from '../../types/gameState';
import type { EncounterSupportBinding } from '../../types/encounter';
import type {
  AftermathVariant,
  UnifiedAction,
  UnifiedActionOutcome,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';

const LENDER = 'actor-lender';
const BORROWER = 'actor-borrower';
const OTHER = 'actor-other';
const DEBT_TEMPLATE = AGREEMENT_REWARD_TEMPLATES.find(t => t.id === 'agreement.debt.minor')!;
const START_WEALTH = 50;

function buildState(tick = 10): GameState {
  const graph = new WorldGraph();
  for (const [id, name] of [[LENDER, 'Maren'], [BORROWER, 'Wenna Tull'], [OTHER, 'Odile Marrow']] as const) {
    graph.addNode({ id, type: 'actor', name, properties: { actorType: 'individual', wealth: START_WEALTH, reputationScore: 0.5 } });
  }
  return {
    tick, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: 'asc-1', essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    hiddenMarks: [], intelligenceRecords: [], pendingEncounterSeeds: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never, encounterNotifications: [],
    clearanceGateStates: new Map(),
  } as unknown as GameState;
}

function bind(key: string, nodeId: string): EncounterSupportBinding {
  return {
    key, nodeId, kind: 'actor',
    delivery: 'lazy-materialize-on-trigger', persistence: 'must-persist', reused: false,
  } as unknown as EncounterSupportBinding;
}

function makeAction(templateId: string, outcome: UnifiedActionOutcome, bindings: EncounterSupportBinding[] = []): UnifiedAction {
  return {
    actionId: `ua_${templateId}_${outcome}`, actorId: LENDER, templateId, targetId: LENDER,
    scale: 'personal', source: 'agent',
    startTick: 1, currentStep: 0, stepProgress: 1, stepDuration: 1,
    resolved: true, outcome, stepOutcomes: [],
    supportBindings: bindings,
  } as unknown as UnifiedAction;
}

function template(id: string): UnifiedActionTemplate {
  const t = getUnifiedTemplateById(id) as UnifiedActionTemplate | undefined;
  if (!t) throw new Error(`template ${id} missing`);
  return t;
}

/** The band's effects exactly as `applyOutcomeEffectsTable` selects them. */
function bandEffects(t: UnifiedActionTemplate, outcome: UnifiedActionOutcome, variant?: AftermathVariant) {
  return (variant?.outcomeEffects ?? t.outcomeEffects)?.[outcome] ?? [];
}

function runBand(
  state: GameState,
  templateId: string,
  outcome: UnifiedActionOutcome,
  opts: { bindings?: EncounterSupportBinding[]; variant?: (t: UnifiedActionTemplate) => AftermathVariant | undefined } = {},
): GameState {
  const t = template(templateId);
  const effects = bandEffects(t, outcome, opts.variant?.(t));
  const action = makeAction(templateId, outcome, opts.bindings ?? []);
  const { state: next } = applyEncounterAftermathReaction(
    state, action,
    { id: `${templateId}:outcome:${outcome}`, label: 'Outcome', effects, actionOutcome: outcome },
    state.tick, createSimulationRuntime(), { outcomeBand: outcome },
  );
  return next;
}

function debtEdges(graph: WorldGraph) {
  return graph.getEdgesByType('relates_to').filter(e => readAgreement(e.properties as Record<string, unknown>)?.type === 'debt');
}

function wealth(graph: WorldGraph, id: string): number {
  return graph.getNode(id)!.properties.wealth as number;
}

function tracesOf(category: string) {
  return getTraces().filter(t => t.category === category) as unknown as Record<string, unknown>[];
}

function writeDebt(graph: WorldGraph, debtor: string, creditor: string, tick: number): string {
  return instantiateAgreementReward(graph, debtor, creditor, DEBT_TEMPLATE, tick)!.edgeId;
}

beforeEach(() => {
  enableTracing();
  clearTraces();
});

describe('THR-2023 settleDebt', () => {
  it('settles the oldest live debt owed to the creditor first', () => {
    const state = buildState(30);
    const newer = writeDebt(state.graph, OTHER, LENDER, 20);
    const older = writeDebt(state.graph, BORROWER, LENDER, 5);
    expect(listDebtsOwedTo(state.graph, LENDER, 30).map(d => d.edge.id)).toEqual([older, newer]);
    const result = settleDebt(state.graph, { creditorId: LENDER, settlement: 'written_off', tick: 30 });
    expect(result).toMatchObject({ settled: true, edgeId: older, debtorId: BORROWER, meansDelta: 0 });
    expect(state.graph.getEdge(older)).toBeUndefined();
    expect(state.graph.getEdge(newer)).toBeDefined();
  });

  it('ties on acquiredTick break by edge id ascending', () => {
    expect(compareDebtsOldestFirst({ edgeId: 'a', acquiredTick: 3 }, { edgeId: 'b', acquiredTick: 3 })).toBeLessThan(0);
    expect(compareDebtsOldestFirst({ edgeId: 'z', acquiredTick: 1 }, { edgeId: 'a', acquiredTick: 2 })).toBeLessThan(0);
  });

  it('a debt the creditor owes, a favour, or a lapsed debt is never settled', () => {
    const state = buildState(100);
    writeDebt(state.graph, LENDER, BORROWER, 90); // the lender owes — not owed to them
    writeDebt(state.graph, OTHER, LENDER, 10); // term 48: lapsed at 100
    const favour = AGREEMENT_REWARD_TEMPLATES.find(t => t.agreementType === 'favour');
    if (favour) instantiateAgreementReward(state.graph, BORROWER, LENDER, favour, 95);
    const before = state.graph.getEdgesByType('relates_to').length;
    expect(settleDebt(state.graph, { creditorId: LENDER, settlement: 'paid', tick: 100 }))
      .toEqual({ settled: false, reason: 'no_debt_owed' });
    expect(state.graph.getEdgesByType('relates_to').length).toBe(before);
  });

  it('a dead debtor is skipped: the oldest living debtor pays (review-gate cycle 2)', () => {
    const state = buildState(30);
    const dead = writeDebt(state.graph, BORROWER, LENDER, 5);
    const living = writeDebt(state.graph, OTHER, LENDER, 20);
    state.graph.getNode(BORROWER)!.properties.deceased = true; // killed in `retain` mode: edges stay
    expect(settleDebt(state.graph, { creditorId: LENDER, settlement: 'paid', tick: 30 }))
      .toMatchObject({ settled: true, edgeId: living, debtorId: OTHER });
    expect(state.graph.getEdge(dead)).toBeDefined();
    expect(wealth(state.graph, BORROWER)).toBe(START_WEALTH);
  });

  it('debtorAgentId narrows the pick; an unbound creditor no-ops', () => {
    const state = buildState(30);
    writeDebt(state.graph, BORROWER, LENDER, 5);
    const other = writeDebt(state.graph, OTHER, LENDER, 20);
    expect(settleDebt(state.graph, { creditorId: LENDER, debtorId: OTHER, settlement: 'written_off', tick: 30 }))
      .toMatchObject({ settled: true, edgeId: other });
    expect(settleDebt(state.graph, { creditorId: '$actor', settlement: 'paid', tick: 30 }))
      .toEqual({ settled: false, reason: 'creditor_unbound' });
  });

  it('a nested fixture-shape debt is matched on either end, as countDebts counts it', () => {
    const state = buildState(30);
    state.graph.addEdge({
      id: 'nested-debt', source: LENDER, target: BORROWER, type: 'relates_to',
      properties: { agreement: { type: 'debt', tier: 1, tags: [], terms: '', ticksRemaining: null } },
    });
    expect(settleDebt(state.graph, { creditorId: LENDER, settlement: 'paid', tick: 30 }))
      .toMatchObject({ settled: true, edgeId: 'nested-debt', debtorId: BORROWER, meansDelta: -DEBT_REPAY_MEANS });
  });
});

describe('THR-2023 The Loan → Debt Collection (the loop)', () => {
  it('a loan makes a named debt; collecting it at success pays it off', () => {
    let state = buildState(10);
    const borrower = [bind('borrower', BORROWER)];
    state = runBand(state, 'encounter.the_loan', 'success', { bindings: borrower });

    const [debt] = debtEdges(state.graph);
    expect(debt).toMatchObject({ source: BORROWER, target: LENDER });
    expect(wealth(state.graph, LENDER)).toBe(START_WEALTH - LOAN_PRINCIPAL_MEANS);
    expect(wealth(state.graph, BORROWER)).toBe(START_WEALTH + LOAN_PRINCIPAL_MEANS);

    const borrowerRow = getAgentAttachments(state.graph, BORROWER, 10).agreements[0];
    const lenderRow = getAgentAttachments(state.graph, LENDER, 10).agreements[0];
    expect(agreementLine(borrowerRow, borrowerRow.counterpartyName!)).toBe('Owes Maren');
    expect(agreementLine(lenderRow, lenderRow.counterpartyName!)).toBe('Is owed by Wenna Tull');

    clearTraces();
    state = runBand(state, 'encounter.debt_collection', 'success');
    expect(debtEdges(state.graph)).toHaveLength(0);
    expect(wealth(state.graph, BORROWER)).toBe(START_WEALTH + LOAN_PRINCIPAL_MEANS - DEBT_REPAY_MEANS);
    expect(wealth(state.graph, LENDER)).toBe(START_WEALTH - LOAN_PRINCIPAL_MEANS + MEANS_STEP);
    const [settled] = tracesOf('agreement_settled');
    expect(settled).toMatchObject({ settlement: 'paid', debtorId: BORROWER, creditorId: LENDER, meansDelta: -DEBT_REPAY_MEANS });
  });

  it("the loan's failure still makes the debt, and the borrower resents the lender — on a bond, not the debt edge", () => {
    let state = buildState(10);
    state = runBand(state, 'encounter.the_loan', 'failure', { bindings: [bind('borrower', BORROWER)] });
    expect(debtEdges(state.graph)).toHaveLength(1);
    const bond = state.graph.getOutgoingEdges(BORROWER, 'relates_to')
      .find(e => e.target === LENDER && !(e.properties as Record<string, unknown>).agreement);
    expect(bond?.properties.sentiment).toBeLessThan(0.5);
    expect((debtEdges(state.graph)[0].properties as Record<string, unknown>).sentiment).toBeUndefined();
    // Only the borrower resents: the lender's own edge toward the borrower is untouched (review-gate cycle 3).
    expect(state.graph.getOutgoingEdges(LENDER, 'relates_to').some(e => e.target === BORROWER)).toBe(false);
    // The first-edge relationship reader sees the bond, not the debt (review-gate round 1).
    const before = relSentiment(state.graph);
    expect(before).toBe(bond?.properties.sentiment);
    // And settling the debt leaves the resentment standing.
    settleDebt(state.graph, { creditorId: LENDER, settlement: 'written_off', tick: 10 });
    expect(relSentiment(state.graph)).toBe(before);
  });

  it('a repeat borrower: resentment written onto the first debt survives settling it (review-gate round 2)', () => {
    let state = buildState(10);
    const borrower = [bind('borrower', BORROWER)];
    state = runBand(state, 'encounter.the_loan', 'success', { bindings: borrower });
    state = { ...state, tick: 11 } as GameState;
    state = runBand(state, 'encounter.the_loan', 'failure', { bindings: borrower });
    // The second loan's bond landed on the first debt edge (the only B→L edge then).
    const sentiment = relSentiment(state.graph);
    expect(sentiment).toBeLessThan(0);
    state = runBand(state, 'encounter.debt_collection', 'success');
    expect(debtEdges(state.graph)).toHaveLength(1);
    // The first-edge readers see the resentment while the younger debt is still live (review-gate cycle 2) …
    expect(relSentiment(state.graph)).toBe(sentiment);
    // … and it survives that debt being settled too.
    state = runBand(state, 'encounter.debt_collection', 'success');
    expect(debtEdges(state.graph)).toHaveLength(0);
    expect(relSentiment(state.graph)).toBe(sentiment);
  });

  it('without a bound borrower the loan writes no debt (the cast is load-bearing)', () => {
    let state = buildState(10);
    state = runBand(state, 'encounter.the_loan', 'success');
    expect(debtEdges(state.graph)).toHaveLength(0);
  });

  it('the converted template carries the borrower cast', () => {
    expect(template('encounter.the_loan').supportBundle?.map(s => s.key)).toEqual(['borrower']);
  });

  it('collection failure writes the debt off — no debtor Means moves — and Debt-Laden lifts', () => {
    let state = buildState(10);
    writeDebt(state.graph, BORROWER, LENDER, 2);
    writeDebt(state.graph, BORROWER, OTHER, 3);
    phaseEconomicTraits(state);
    const hasDebtLaden = () => state.graph.getOutgoingEdges(BORROWER, 'has_trait')
      .some(e => e.target === 'trait.condition.debt-laden');
    expect(hasDebtLaden()).toBe(true);

    state = runBand(state, 'encounter.debt_collection', 'failure');
    expect(wealth(state.graph, BORROWER)).toBe(START_WEALTH);
    expect(tracesOf('agreement_settled')[0]).toMatchObject({ settlement: 'written_off', meansDelta: 0 });
    expect(countDebts(state.graph, BORROWER, 10)).toBe(1);

    // The other creditor's book closes too; at zero debts Debt-Laden lifts on the next pass.
    settleDebt(state.graph, { creditorId: OTHER, settlement: 'written_off', tick: 10 });
    phaseEconomicTraits(state);
    expect(hasDebtLaden()).toBe(false);
  });

  it('collection owed nothing emits no_debt_owed and still pays its success row', () => {
    let state = buildState(10);
    state = runBand(state, 'encounter.debt_collection', 'success');
    expect(tracesOf('debt_settle_noop')[0]).toMatchObject({ reason: 'no_debt_owed', creditorId: LENDER });
    expect(wealth(state.graph, LENDER)).toBe(START_WEALTH + MEANS_STEP);
  });

  it('every Debt Collection band settles; the bad bands write off', () => {
    const t = template('encounter.debt_collection');
    const settles = (o: UnifiedActionOutcome) => bandEffects(t, o).find(e => e.kind === 'debt_settle');
    for (const o of ['critical_success', 'success', 'success_at_cost'] as const) expect(settles(o)).toMatchObject({ settlement: 'paid' });
    for (const o of ['failure', 'critical_failure'] as const) expect(settles(o)).toMatchObject({ settlement: 'written_off' });
  });
});

describe('THR-2023 the branching scenes write their debts', () => {
  const MASTER = OTHER;

  it("debt arbitration: the taken third's failure leaves the master's note; critical failure none (both paths)", () => {
    for (const variant of [
      (t: UnifiedActionTemplate) => t.aftermathConfig!.variants.negative,
      (t: UnifiedActionTemplate) => t.aftermathConfig!.fallback,
    ]) {
      let state = buildState(10);
      state = runBand(state, 'encounter.town.debt_arbitration', 'failure', { bindings: [bind('master', MASTER)], variant });
      expect(debtEdges(state.graph).map(e => [e.source, e.target])).toEqual([[MASTER, LENDER]]);

      let crit = buildState(10);
      crit = runBand(crit, 'encounter.town.debt_arbitration', 'critical_failure', { bindings: [bind('master', MASTER)], variant });
      expect(debtEdges(crit.graph)).toHaveLength(0);
    }
  });

  it("toll-gate writ: success at a cost puts the mortal in the toll-master's book", () => {
    const negative = (t: UnifiedActionTemplate) => t.aftermathConfig!.variants.negative;
    let state = buildState(10);
    state = runBand(state, 'encounter.town.toll_gate_writ', 'success_at_cost', { bindings: [bind('tollmaster', OTHER)], variant: negative });
    expect(debtEdges(state.graph).map(e => [e.source, e.target])).toEqual([[LENDER, OTHER]]);
    for (const o of ['critical_success', 'success', 'failure', 'critical_failure'] as const) {
      let s = buildState(10);
      s = runBand(s, 'encounter.town.toll_gate_writ', o, { bindings: [bind('tollmaster', OTHER)], variant: negative });
      expect(debtEdges(s.graph)).toHaveLength(0);
    }
  });

  it("cathedral loan: each band moves the chapter's coin one way", () => {
    const DEAN = BORROWER;
    const FACTOR = OTHER;
    const fallback = (t: UnifiedActionTemplate) => t.aftermathConfig!.fallback;
    const cast = [bind('dean', DEAN), bind('factor', FACTOR)];
    const run = (o: UnifiedActionOutcome) => runBand(buildState(10), 'encounter.town.cathedral_loan', o, { bindings: cast, variant: fallback });

    const cs = run('critical_success');
    expect([wealth(cs.graph, FACTOR), wealth(cs.graph, DEAN)]).toEqual([START_WEALTH - MEANS_STEP, START_WEALTH + MEANS_STEP]);
    expect(debtEdges(cs.graph)).toHaveLength(0);

    for (const o of ['success', 'success_at_cost'] as const) {
      const s = run(o);
      expect(debtEdges(s.graph).map(e => [e.source, e.target])).toEqual([[DEAN, FACTOR]]);
      expect([wealth(s.graph, FACTOR), wealth(s.graph, DEAN)]).toEqual([START_WEALTH, START_WEALTH]);
    }

    const f = run('failure');
    expect([wealth(f.graph, FACTOR), wealth(f.graph, DEAN)]).toEqual([START_WEALTH + MEANS_STEP, START_WEALTH - MEANS_STEP]);
    const cf = run('critical_failure');
    expect([wealth(cf.graph, FACTOR), wealth(cf.graph, DEAN)]).toEqual([START_WEALTH + MEANS_STEP_BIG, START_WEALTH - MEANS_STEP_BIG]);
    // No band pays the acting mortal.
    for (const s of [cs, f, cf]) expect(wealth(s.graph, LENDER)).toBe(START_WEALTH);
  });

  it('the success-at-cost Debt Collection pays short', () => {
    const t = template('encounter.debt_collection');
    expect(bandEffects(t, 'success_at_cost')).toContainEqual({ kind: 'economy_shift', quantity: 'means', amount: MEANS_STEP_SMALL });
  });
});

describe('THR-2023 chips are state-backed (UI Law 56)', () => {
  // Each new chip sits only in a band whose own table writes the state it names.
  const cases: [string, 'negative' | 'fallback', UnifiedActionOutcome, string, string][] = [
    ['encounter.town.debt_arbitration', 'negative', 'failure', 'debt.neg.fail.note', 'attachment_grant'],
    ['encounter.town.debt_arbitration', 'fallback', 'failure', 'debt.fb.fail.note', 'attachment_grant'],
    ['encounter.town.toll_gate_writ', 'negative', 'success_at_cost', 'writ.sent.cost.toll_book', 'attachment_grant'],
    ['encounter.town.cathedral_loan', 'fallback', 'success', 'cathedral.s.debt', 'attachment_grant'],
    ['encounter.town.cathedral_loan', 'fallback', 'success_at_cost', 'cathedral.sac.debt', 'attachment_grant'],
    ['encounter.town.cathedral_loan', 'fallback', 'failure', 'cathedral.f.plate', 'economy_shift'],
    ['encounter.town.cathedral_loan', 'fallback', 'critical_failure', 'cathedral.cf.plate', 'economy_shift'],
  ];
  it.each(cases)('%s %s %s: chip %s is backed by %s', (id, which, band, chipId, kind) => {
    const t = template(id);
    const variant = which === 'fallback' ? t.aftermathConfig!.fallback : t.aftermathConfig!.variants.negative;
    const byOutcome = (variant as unknown as { byOutcome: Record<string, { changes: { id: string }[] }> }).byOutcome;
    expect(byOutcome[band].changes.map(c => c.id)).toContain(chipId);
    expect(bandEffects(t, band, variant).some(e => e.kind === kind)).toBe(true);
    // And the chip is in no other band of that path.
    for (const [other, entry] of Object.entries(byOutcome)) {
      if (other !== band) expect(entry.changes.map(c => c.id)).not.toContain(chipId);
    }
  });
});

describe('THR-2023 sheet words', () => {
  it('a debt says which way it runs; other agreements keep Bound to', () => {
    expect(agreementLine({ agreementType: 'debt', agreementDirection: 'owes' }, 'Odile Marrow')).toBe('Owes Odile Marrow');
    expect(agreementLine({ agreementType: 'debt', agreementDirection: 'owed' }, 'Wenna Tull')).toBe('Is owed by Wenna Tull');
    expect(agreementLine({ agreementType: 'pact', agreementDirection: 'owes' }, 'X')).toBe('Bound to X');
    expect(agreementLine({}, 'X')).toBe('With X');
  });
});

/**
 * The first-edge sentiment between borrower and lender (undefined when no edge): the first
 * `relates_to` edge borrower → lender, else lender → borrower, read the way the bond readers do.
 */
function relSentiment(graph: WorldGraph): number | undefined {
  const edge = graph.getOutgoingEdges(BORROWER, 'relates_to').find(e => e.target === LENDER)
    ?? graph.getIncomingEdges(BORROWER, 'relates_to').find(e => e.source === LENDER);
  if (!edge) return undefined;
  return (edge.properties.sentiment as number | undefined) ?? 0;
}

describe("THR-2044 The Loan plants its lender's collection", () => {
  it('a resolved loan plants one Debt Collection seed on the lender at tick + delay', () => {
    let state = buildState(10);
    state = runBand(state, 'encounter.the_loan', 'success', { bindings: [bind('borrower', BORROWER)] });
    const seeds = (state.pendingEncounterSeeds ?? []).filter(s => s.sourceEncounterId === 'encounter.the_loan');
    expect(seeds).toHaveLength(1);
    expect(seeds[0]).toMatchObject({
      templateId: 'encounter.debt_collection',
      targetAgentId: LENDER,
      plantedTick: 10,
      eligibleAfterTick: 10 + LOAN_COLLECTION_SEED_DELAY_TICKS,
      seedLabel: 'The loan falls due',
    });
  });

  it('with LOAN_COLLECTION_SEED_ENABLED false the loan plants none', async () => {
    vi.resetModules();
    vi.doMock('../../data/mortal-means-constants', async importOriginal => ({
      ...(await importOriginal<typeof import('../../data/mortal-means-constants')>()),
      LOAN_COLLECTION_SEED_ENABLED: false,
    }));
    try {
      const fresh = await import('../../data/unified-action-templates');
      const loan = fresh.getUnifiedTemplateById('encounter.the_loan') as UnifiedActionTemplate;
      const effects = Object.values(loan.outcomeEffects ?? {}).flatMap(rows => rows ?? []);
      expect(effects.length).toBeGreaterThan(0);
      expect(effects.filter(e => e.kind === 'encounter_seed')).toEqual([]);
    } finally {
      vi.doUnmock('../../data/mortal-means-constants');
      vi.resetModules();
    }
  });
});
