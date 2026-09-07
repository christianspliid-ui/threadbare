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
import { isUndertakingOutcomeEventId } from '../grievance/undertakingOutcomeNode';
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
  ambitionProvenance?: string | MintedAmbitionOrigin,
): RawTerm[] {
  const rarityDelta = (candidate.rarityMultiplier - 1) * MULTIPLIER_DELTA_SCALE;
  const bondDelta = candidate.bondBonus * MULTIPLIER_DELTA_SCALE;
  const resonanceTotal = candidate.resonance + candidate.globalResonance;
  const proximityTerm = Number.isFinite(candidate.hexDistanceToEntry)
    ? PROXIMITY_RECEIPT_SCALE / (1 + candidate.hexDistanceToEntry)
    : 0;

  // A minted want names its origin ("the bloodshed at Thornhaven"); otherwise the
  // ambition term is attributed to its dominant reach as before (THR-726).
  const origin = typeof ambitionProvenance === 'string' ? { label: ambitionProvenance } : ambitionProvenance;
  const ambitionDetail = origin?.label ?? candidate.entry.reachPrimary;
  // A want minted by an undertaking outcome — a harm done to this mortal, or their own
  // work collapsing — is its own kind (THR-1432): the receipt says *what was done*,
  // and the outcome node rides along so a surface can walk back to it.
  const fromUndertaking = isUndertakingOutcomeEventId(origin?.eventId);
  const ambitionTerm: RawTerm = fromUndertaking
    ? { kind: 'undertaking', term: candidate.ambitionBoost, provenance: { nodeId: origin!.eventId, detail: ambitionDetail } }
    : { kind: 'ambition', term: candidate.ambitionBoost, provenance: { detail: ambitionDetail } };

  const terms: RawTerm[] = [
    ambitionTerm,
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
 * @param ambitionProvenance The minted want's origin — its label alone (THR-726), or
 *   the label with the event node behind it (THR-1432), which turns the ambition
 *   term into an `undertaking` one when that node is an undertaking outcome.
 */
export function buildMotiveReceipt(
  candidate: ScoredCandidate,
  intelReliability: number | null,
  intelRecordId: string | null,
  decidedAtTick: number,
  ambitionProvenance?: string | MintedAmbitionOrigin,
): MotiveReceipt {
  const raw = extractRawTerms(candidate, intelRecordId, ambitionProvenance);

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
  return resolveMintedAmbitionOrigin(graph, actorId, dominantReach)?.label;
}

/** Where a minted want came from: the label the receipt shows and the event node behind it. */
export interface MintedAmbitionOrigin {
  readonly label: string;
  /** The `mintedByEventId` on the `pursues` edge — an encounter event or an undertaking outcome (`evt_und_…`). */
  readonly eventId?: string;
}

/**
 * The same walk as `resolveMintedAmbitionProvenance`, keeping the event node beside
 * the label (THR-1432) so the receipt can tell a want minted by a harm from one
 * minted by an encounter. Read-only + fail-soft; undefined when nothing was minted.
 */
export function resolveMintedAmbitionOrigin(
  graph: WorldGraph,
  actorId: string,
  dominantReach: string,
): MintedAmbitionOrigin | undefined {
  let fallback: MintedAmbitionOrigin | undefined;
  for (const edge of graph.getOutgoingEdges(actorId, 'pursues')) {
    if (edge.properties?.status !== 'active') continue;
    const mintedByEventId = edge.properties?.mintedByEventId as string | undefined;
    const mintedByLabel = edge.properties?.mintedByLabel as string | undefined;
    if (!mintedByEventId || !mintedByLabel) continue;
    const origin: MintedAmbitionOrigin = { label: mintedByLabel, eventId: mintedByEventId };
    fallback ??= origin;
    const node = graph.getNode(edge.target);
    const affinity = node?.properties?.reachAffinity as Record<string, number> | undefined;
    if (affinity && (affinity[dominantReach] ?? 0) > 0) return origin;
  }
  return fallback;
}
