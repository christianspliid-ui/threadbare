/**
 * Motive Receipt builder (THR-631 Phase B).
 *
 * Turns the winning `ScoredCandidate` — the labeled contribution terms the
 * scorer computes every tick and normally discards — into a `MotiveReceipt`:
 * the real, inspectable causality behind an agent's encounter choice. The
 * receipt is stored on the agent node and later rendered into foreshadowing
 * prose, the trace, and DebugPanel so "why did this agent choose this?" has one
 * answer everywhere.
 *
 * Pure and deterministic — no PRNG, no graph mutation, never throws.
 */

import type { ScoredCandidate } from '../encounterScoring';
import type { WorldGraph } from '../graph';
import type {
  ForeshadowingIntelligenceTier,
  MotiveContribution,
  MotiveContributionKind,
  MotiveReceipt,
} from '../../types/foreshadowing';
import { classifyForecastTier } from '../encounters/outcomeForecast';
import {
  INTEL_TIER_BRIEFED_BELOW,
  INTEL_TIER_RUMOR_BELOW,
  INTEL_TIER_UNKNOWN_BELOW,
  MULTIPLIER_DELTA_SCALE,
  PROXIMITY_RECEIPT_SCALE,
  RECEIPT_MIN_WEIGHT,
  RECEIPT_TOP_CONTRIBUTIONS,
} from './constants';

/**
 * Map an IntelligenceRecord reliability (0..1) to a foreshadowing intel tier.
 * Null/absent record → 'unknown'. Reliability is scaled to the 0-100 tier
 * thresholds so the existing INTEL_TIER_* constants are re-pointed at real
 * intelligence confidence instead of completionProb (THR-631).
 */
export function intelTierFromReliability(
  reliability: number | null | undefined,
): ForeshadowingIntelligenceTier {
  if (reliability == null || !Number.isFinite(reliability)) return 'unknown';
  const score = Math.max(0, Math.min(1, reliability)) * 100;
  if (score < INTEL_TIER_UNKNOWN_BELOW) return 'unknown';
  if (score < INTEL_TIER_RUMOR_BELOW) return 'rumor';
  if (score < INTEL_TIER_BRIEFED_BELOW) return 'briefed';
  return 'expert';
}

/** A raw, pre-normalization contribution term extracted from a candidate. */
interface RawTerm {
  kind: MotiveContributionKind;
  /** Additive contribution to the positive score mass (may be 0 or negative before clamping). */
  term: number;
  provenance?: MotiveContribution['provenance'];
}

/**
 * Extract the labeled additive contribution terms this slice captures.
 *
 * Captured (1:1 to a `MotiveContributionKind`): ambition, personality, intel,
 * mark, resonance, hunch, doom_identity, chain, exploration, rarity, and — since
 * THR-641 surfaced the scorer's previously-folded terms — divine, bond,
 * reputation, proximity. All 14 receipt kinds are now reachable.
 *
 * Presentation scaling lives here (not the scorer) so `ScoredCandidate` carries
 * raw mechanical facts: `rarity`/`bond` convert their multiplier to an additive
 * delta via `MULTIPLIER_DELTA_SCALE`; `proximity` is `PROXIMITY_RECEIPT_SCALE`
 * over `1 + hexDistance` (0 when unreachable). Still unmapped by the fixed kind
 * vocabulary: ruins/attraction/anomaly bonuses (a follow-up if the vocabulary grows).
 */
function extractRawTerms(
  candidate: ScoredCandidate,
  intelRecordId: string | null,
  ambitionProvenanceDetail?: string,
): RawTerm[] {
  const rarityDelta = (candidate.rarityMultiplier - 1) * MULTIPLIER_DELTA_SCALE;
  const bondDelta = candidate.bondBonus * MULTIPLIER_DELTA_SCALE;
  const resonanceTotal = candidate.resonance + candidate.globalResonance;
  const proximityTerm = Number.isFinite(candidate.hexDistanceToEntry)
    ? PROXIMITY_RECEIPT_SCALE / (1 + candidate.hexDistanceToEntry)
    : 0;

  // A minted want names its origin ("the bloodshed at Thornhaven"); otherwise the
  // ambition term is attributed to its dominant reach as before (THR-726).
  const ambitionDetail = ambitionProvenanceDetail ?? candidate.entry.reachPrimary;

  const terms: RawTerm[] = [
    { kind: 'ambition', term: candidate.ambitionBoost, provenance: { detail: ambitionDetail } },
    { kind: 'personality', term: candidate.personalityBias },
    { kind: 'intel', term: candidate.intelBonus, provenance: intelRecordId ? { detail: intelRecordId } : undefined },
    { kind: 'mark', term: candidate.markRevealBonus },
    { kind: 'divine', term: candidate.divineOverlayBonus },
    { kind: 'bond', term: bondDelta, provenance: candidate.entry.targetAgentId ? { nodeId: candidate.entry.targetAgentId } : undefined },
    { kind: 'reputation', term: candidate.reputationBonus, provenance: { detail: candidate.entry.reachPrimary } },
    { kind: 'resonance', term: resonanceTotal, provenance: candidate.entry.sphereAffinity ? { detail: candidate.entry.sphereAffinity } : undefined },
    { kind: 'hunch', term: candidate.hunchBonus },
    { kind: 'doom_identity', term: candidate.identityBiasBonus },
    { kind: 'chain', term: candidate.chainBonus },
    { kind: 'exploration', term: candidate.explorationBonus },
    { kind: 'rarity', term: rarityDelta },
    { kind: 'proximity', term: proximityTerm },
  ];

  return terms;
}

/**
 * Build a MotiveReceipt from the winning candidate.
 *
 * @param candidate      The selected ScoredCandidate.
 * @param intelReliability Reliability (0..1) of the matched IntelligenceRecord, or null if none.
 * @param intelRecordId  Record id of the matched intelligence, for provenance, or null.
 * @param decidedAtTick  The tick the selection committed.
 */
export function buildMotiveReceipt(
  candidate: ScoredCandidate,
  intelReliability: number | null,
  intelRecordId: string | null,
  decidedAtTick: number,
  ambitionProvenanceDetail?: string,
): MotiveReceipt {
  const raw = extractRawTerms(candidate, intelRecordId, ambitionProvenanceDetail);

  // Positive score mass only (NFP #2 — receipt describes what pulled the agent in).
  const positive = raw
    .map(r => ({ ...r, term: Math.max(0, r.term) }))
    .filter(r => r.term > 0);

  const total = positive.reduce((sum, r) => sum + r.term, 0);

  let contributions: MotiveContribution[];
  if (positive.length === 0 || total <= 0) {
    // Fail-soft: nothing positive pulled — attribute to personality with full weight.
    contributions = [{ kind: 'personality', weight: 1 }];
  } else {
    const normalized: MotiveContribution[] = positive
      .map(r => ({
        kind: r.kind,
        weight: r.term / total,
        ...(r.provenance ? { provenance: r.provenance } : {}),
      }))
      .sort((a, b) => b.weight - a.weight);

    // Keep contributions at or above the min-weight floor, capped at top-N.
    const kept = normalized.filter(c => c.weight >= RECEIPT_MIN_WEIGHT).slice(0, RECEIPT_TOP_CONTRIBUTIONS);
    // Fail-soft: if the floor eliminated everything, keep the single strongest.
    contributions = kept.length > 0 ? kept : [normalized[0]];
  }

  return {
    templateId: candidate.entry.templateId,
    locationId: candidate.entry.locationId,
    contributions,
    intelTier: intelTierFromReliability(intelReliability),
    expectation: classifyForecastTier(candidate.completionProb),
    dominantReach: candidate.entry.reachPrimary,
    decidedAtTick,
  };
}

/**
 * Provenance label for a minted want, if this agent holds one relevant to the
 * chosen scene (THR-726). Prefers a minted ambition whose reach affinity includes
 * the scene's dominant reach — the want most plausibly pulling the choice — and
 * falls back to any minted ambition the agent carries. Read-only + fail-soft;
 * returns undefined when the agent has no minted ambition.
 */
export function resolveMintedAmbitionProvenance(
  graph: WorldGraph,
  actorId: string,
  dominantReach: string,
): string | undefined {
  let fallback: string | undefined;
  for (const edge of graph.getOutgoingEdges(actorId, 'pursues')) {
    if (edge.properties?.status !== 'active') continue;
    const mintedByEventId = edge.properties?.mintedByEventId as string | undefined;
    const mintedByLabel = edge.properties?.mintedByLabel as string | undefined;
    if (!mintedByEventId || !mintedByLabel) continue;
    fallback ??= mintedByLabel;
    const node = graph.getNode(edge.target);
    const affinity = node?.properties?.reachAffinity as Record<string, number> | undefined;
    if (affinity && (affinity[dominantReach] ?? 0) > 0) return mintedByLabel;
  }
  return fallback;
}
