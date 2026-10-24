/**
 * Agreement Expiry — tick-based removal of agreements whose term has run out (THR-1999).
 *
 * Agreements are `relates_to` edges (`agreementShape.ts`). The reward writer
 * (`instantiateAgreementReward`, `rewardPool.ts`) stamps `acquiredTick` and the full term as
 * `ticksRemaining`, and nothing else on the graph counts that term down — `decayConditions`
 * walks only `has_trait`. So an encounter debt stayed on the sheet, on the ascendant bar's
 * vows row and in `effectWalker` for ever. This pass removes the edge once
 * `agreementTermEnded` reads true, so every reader stops seeing it at once.
 *
 * The stored term is left alone rather than counted down: `acquiredTick + ticksRemaining` is
 * the end tick every reader already computes, and saves of either shape keep reading (NFP 6).
 * Agreements with a null term, and the nested fixture shape (no acquisition tick), never
 * expire here. An `active: false` edge is not removed for being inactive — only its term ends it.
 *
 * Runs in the condition-expiry beat (orchestrator Phase 6.625c). Pure over graph state;
 * emits an `agreement_expired` trace per removal (the causal record of why a debt left the
 * sheet) and returns what it removed. Fail-soft: a malformed edge is skipped, never thrown on.
 */

import type { WorldGraph } from './graph';
import { readAgreement, agreementTermEnded } from './agreementShape';
import { emitTrace } from './traceBuffer';
import type { TraceEntry } from '../types/trace';

export interface ExpiredAgreement {
  edgeId: string;
  /** The edge's two parties, as written (`source` is the recipient on the reward path). */
  sourceId: string;
  targetId: string;
  agreementType: string | undefined;
  agreementName: string | undefined;
  tick: number;
}

/** Remove every agreement edge whose term has ended at `tick`. */
export function expireAgreements(graph: WorldGraph, tick: number): ExpiredAgreement[] {
  const expired: ExpiredAgreement[] = [];

  for (const edge of [...graph.getEdgesByType('relates_to')]) {
    const props = edge.properties as Record<string, unknown> | undefined;
    const agreement = readAgreement(props);
    if (!agreement || !agreementTermEnded(agreement, tick)) continue;

    expired.push({
      edgeId: edge.id,
      sourceId: edge.source,
      targetId: edge.target,
      agreementType: agreement.type,
      agreementName: typeof props?.agreementName === 'string' ? props.agreementName : undefined,
      tick,
    });
    graph.removeEdge(edge.id);

    const removed = expired[expired.length - 1];
    emitTrace({
      tick,
      category: 'agreement_expired',
      edgeId: edge.id,
      sourceId: edge.source,
      targetId: edge.target,
      agreementType: removed.agreementType,
      acquiredTick: agreement.acquiredTick,
      term: agreement.ticksRemaining,
      summary: `${removed.agreementName ?? removed.agreementType ?? 'agreement'} between ${edge.source} and ${edge.target} ended (term ran out)`,
    } as unknown as TraceEntry);
  }

  return expired;
}
