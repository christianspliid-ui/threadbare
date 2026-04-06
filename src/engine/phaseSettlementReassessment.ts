/**
 * Phase: Settlement Genome Reassessment
 *
 * After a settlement is promoted or demoted (or any other trigger sets
 * `pendingReassessment`), we re-run the settlement genome to update its
 * archetype, sublocation menu, and NPC budget. A delay constant prevents
 * re-evaluation on the same tick as the tier change.
 *
 * Actual sublocation creation/destruction from the genome result is handled
 * by a separate materializeGenome() call (Task 10).
 *
 * Design doc: Docs/plans/2026-04-05-attention-tier-implementation-plan.md
 * NFP priorities: Tunability, Inspectability, Fail-soft
 */

import type { GameState, TickEvent } from '../types/gameState';
import { runSettlementGenome } from './settlementGenome';
import { PROMOTION_REASSESSMENT_DELAY } from './settlementGenome/constants';
import { emitTrace } from './traceBuffer';

// ─── Constants ─────────────────────────────────────────────────────────────

/** Settlement subtypes that participate in genome reassessment */
const SETTLEMENT_SUBTYPES = new Set(['hamlet', 'town', 'city', 'capital']);

// ─── Phase Function ─────────────────────────────────────────────────────────

/**
 * phaseSettlementReassessment — for each settlement with a pending reassessment
 * flag, re-run the settlement genome to update archetype and sublocation config.
 *
 * Called once per tick, AFTER phaseSettlementPromotion (Phase 6.636).
 * Mutates graph node properties in place.
 */
export function phaseSettlementReassessment(state: GameState): Partial<GameState> {
  const { graph, tick, seed } = state;
  const events: TickEvent[] = [];
  const locations = graph.getNodesByType('location');

  for (const loc of locations) {
    const subtype = loc.properties.locationSubtype as string;
    if (!SETTLEMENT_SUBTYPES.has(subtype)) continue;
    if (!loc.properties.pendingReassessment) continue;

    const reassessmentTick = (loc.properties.reassessmentTick as number) ?? 0;
    if (tick - reassessmentTick < PROMOTION_REASSESSMENT_DELAY) continue;

    // Run genome reassessment — fail-soft: if runSettlementGenome throws,
    // skip this settlement and leave pendingReassessment set for retry next tick
    try {
      const sphereInfluence = (loc.properties.sphereInfluence ?? {}) as Record<string, number>;
      const position = (loc.properties.position ?? 'heartland') as 'heartland' | 'borderland';
      const cultureEdge = graph.getOutgoingEdges(loc.id, 'belongs_to')
        .find(e => (e.properties as Record<string, unknown>)?.cultureLayer === 'current');
      const cultureId = cultureEdge?.target ?? null;

      const result = runSettlementGenome(graph, loc.id, {
        tier: subtype as 'hamlet' | 'town' | 'city' | 'capital',
        sphereInfluence,
        position,
        cultureId,
        seed: seed + tick,
      });

      // Store genome result on location properties for UI consumption
      loc.properties.genomeResult = result;
      loc.properties.archetypeId = result.archetypeId;
      loc.properties.archetypeName = result.archetypeName;
      loc.properties.archetypeProseFlavor = result.archetypeProseFlavor;
      loc.properties.pendingReassessment = false;

      // Note: actual sublocation creation/destruction from genome result
      // is handled by a separate materializeGenome() function (Task 10)

      emitTrace({
        tick,
        category: 'settlement_reassessment',
        summary: `Reassessed ${loc.name} (${subtype})${result.archetypeName ? ` → ${result.archetypeName}` : ''}`,
        locationId: loc.id,
        trigger: (loc.properties.reassessmentTrigger as string) ?? 'promotion',
      } as Parameters<typeof emitTrace>[0]);
    } catch (err) {
      // Fail-soft: log warning but do not crash the tick loop
      emitTrace({
        tick,
        category: 'settlement_reassessment',
        summary: `Reassessment failed for ${loc.name} (${subtype}): ${String(err)}`,
        locationId: loc.id,
        trigger: 'error',
      } as Parameters<typeof emitTrace>[0]);
    }
  }

  return { tickEvents: [...(state.tickEvents ?? []), ...events] };
}
