/**
 * Debt settle — a debt can end before its term (THR-2023).
 *
 * Agreements are `relates_to` edges (`agreementShape.ts`); until now a debt ended only when
 * its term ran out (`agreementExpiry.ts`) or a party died. The money encounters that are
 * *about* debt — Debt Collection — touched none. `settleDebt` is the second remover: it
 * picks the oldest live debt owed to a creditor and removes the edge, and on `paid` the
 * debtor pays `DEBT_REPAY_MEANS` through `applyMeansShift` (the poor-loss scale applies, so
 * no spiral). The creditor's gain is not written here — it is the template's own authored
 * `means` row, so the coin is counted once.
 *
 * Debts only: favours (`owes_favor`) are a different shape with their own verbs.
 *
 * Pure over graph state, deterministic (oldest by `acquiredTick`, ties by edge id), no PRNG.
 * Fail-soft: an unbound creditor or no debt owed returns `{ settled: false, reason }`.
 */

import type { WorldGraph } from './graph';
import type { GraphEdge } from '../types/graph';
import { readAgreement, agreementLapsed, type ReadAgreement } from './agreementShape';
import { applyMeansShift, type MeansShiftResult } from './mortalMeans';
import { DEBT_REPAY_MEANS, ENCOUNTER_DEBT_SETTLE_ENABLED } from '../data/mortal-means-constants';

export type DebtSettlement = 'paid' | 'written_off';

export type DebtSettleResult =
  | { settled: false; reason: 'no_debt_owed' | 'creditor_unbound' | 'disabled' }
  | {
    settled: true;
    edgeId: string;
    debtorId: string;
    creditorId: string;
    acquiredTick: number | undefined;
    /** The debtor's actual Means change — 0 when written off, Means is off, or the debtor is gone. */
    meansDelta: number;
    shift: MeansShiftResult | null;
  };

interface DebtCandidate {
  edge: GraphEdge;
  agreement: ReadAgreement;
  debtorId: string;
}

/**
 * The pick order: oldest debt first (`acquiredTick`, a missing tick sorts first — the nested
 * fixture shape carries none), ties by edge id ascending.
 */
export function compareDebtsOldestFirst(
  a: { edgeId: string; acquiredTick: number | undefined },
  b: { edgeId: string; acquiredTick: number | undefined },
): number {
  const ta = a.acquiredTick ?? Number.NEGATIVE_INFINITY;
  const tb = b.acquiredTick ?? Number.NEGATIVE_INFINITY;
  if (ta !== tb) return ta < tb ? -1 : 1;
  return a.edgeId < b.edgeId ? -1 : a.edgeId > b.edgeId ? 1 : 0;
}

/**
 * Live debts owed to `creditorId`, in pick order. Flat shape: the reward writer puts the debtor
 * at the edge's source and the creditor at its target. Nested shape: matched on either end, as
 * `countDebts` counts it, with the other end read as the debtor.
 */
export function listDebtsOwedTo(
  graph: WorldGraph,
  creditorId: string,
  tick: number,
  debtorId?: string,
): DebtCandidate[] {
  const out: DebtCandidate[] = [];
  const seen = new Set<string>();
  const consider = (edge: GraphEdge, otherEnd: string, nestedOnly: boolean): void => {
    if (seen.has(edge.id)) return;
    const agreement = readAgreement(edge.properties as Record<string, unknown> | undefined);
    if (!agreement || agreement.type !== 'debt' || agreementLapsed(agreement, tick)) return;
    if (nestedOnly && agreement.shape !== 'nested') return;
    if (debtorId !== undefined && otherEnd !== debtorId) return;
    seen.add(edge.id);
    out.push({ edge, agreement, debtorId: otherEnd });
  };
  for (const edge of graph.getIncomingEdges(creditorId, 'relates_to')) consider(edge, edge.source, false);
  for (const edge of graph.getOutgoingEdges(creditorId, 'relates_to')) consider(edge, edge.target, true);
  return out.sort((a, b) => compareDebtsOldestFirst(
    { edgeId: a.edge.id, acquiredTick: a.agreement.acquiredTick },
    { edgeId: b.edge.id, acquiredTick: b.agreement.acquiredTick },
  ));
}

/** Settle the oldest live debt owed to `creditorId` (optionally only one `debtorId` owes). */
export function settleDebt(
  graph: WorldGraph,
  args: { creditorId: string | undefined; debtorId?: string; settlement: DebtSettlement; tick: number },
): DebtSettleResult {
  if (!ENCOUNTER_DEBT_SETTLE_ENABLED) return { settled: false, reason: 'disabled' };
  const { creditorId, debtorId, settlement, tick } = args;
  if (!creditorId || creditorId.startsWith('$') || !graph.getNode(creditorId)) {
    return { settled: false, reason: 'creditor_unbound' };
  }
  const [pick] = listDebtsOwedTo(graph, creditorId, tick, debtorId);
  if (!pick) return { settled: false, reason: 'no_debt_owed' };

  graph.removeEdge(pick.edge.id);

  let shift: MeansShiftResult | null = null;
  if (settlement === 'paid') {
    const debtor = graph.getNode(pick.debtorId);
    if (debtor && debtor.type === 'actor') {
      shift = applyMeansShift(debtor.properties as Record<string, unknown>, -DEBT_REPAY_MEANS, 'debt_repaid');
    }
  }

  return {
    settled: true,
    edgeId: pick.edge.id,
    debtorId: pick.debtorId,
    creditorId,
    acquiredTick: pick.agreement.acquiredTick,
    meansDelta: shift?.amount ?? 0,
    shift,
  };
}
