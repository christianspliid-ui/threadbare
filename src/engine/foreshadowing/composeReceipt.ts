/**
 * Receipt-driven foreshadowing composition (THR-631, Phase B consumption).
 *
 * When an agent's encounter selection emitted a `MotiveReceipt`, this composes
 * the foreshadowing passage from the *real* decision causality the scorer
 * computed, instead of the Reach-guess used by the composed-generic path:
 *
 *   S1 knowledge   — keyed by the receipt's real intel tier (IntelligenceRecord).
 *   S2 pull/motive — keyed by the top contribution KIND (why the scorer favoured it).
 *   S3 expectation — keyed by the real completionProb forecast tier, with an
 *                    em-dash hedge tail below the `briefed` tier.
 *   S4 stake       — keyed by the SECOND contribution kind, only when its weight
 *                    clears STAKE_CLAUSE_MIN_WEIGHT (optional misgiving).
 *
 * Tooltip render = S2 only (one sentence). Panel render = S1–S3(+S4).
 *
 * Determinism: variant selection is seeded on (agentId, templateId) XOR the
 * receipt's decidedAtTick — the same decision yields the same prose; a new
 * decision (new tick) yields fresh variety (NFP #3). No `Math.random()`.
 * Fail-soft: a missing clause key falls back to the `personality` / default
 * pools; the composer never throws (NFP #4).
 */

import { mulberry32 } from '../../lib/prng';
import type { MotiveReceipt } from '../../types/foreshadowing';
import { realize, pronounNumber, objectPronoun } from './realizer';
import {
  KNOWLEDGE_CLAUSES,
  MOTIVE_CLAUSES,
  MOTIVE_CLAUSES_BY_REACH,
  EXPECTATION_BY_FORECAST,
  LOW_INTEL_HEDGE_TAILS,
  STAKE_CLAUSES,
  DEFAULT_STAKE_CLAUSES,
  MATTER_NO_PLACE,
  matterAtPlace,
} from '../../data/foreshadowing-content';
import { STAKE_CLAUSE_MIN_WEIGHT } from './constants';

export interface ComposeReceiptInput {
  agentId: string;
  /** Encounter template id (matches the receipt's templateId). */
  encounterId: string;
  /** Full agent name; the first word is used in prose. */
  agentName: string;
  /** Subject pronoun (he / she / they). */
  subjectPronoun: string;
  /** Location name when known (panel path); grounds the `{matter}` phrase. */
  locationName?: string;
}

export interface ComposedReceiptForeshadowing {
  /** Full panel passage: S1–S3(+S4). */
  prose: string;
  /** Tooltip render: the S2 pull sentence only. */
  tooltipProse: string;
  /** Provenance of each rendered clause, for tracing/debug (NFP #2). */
  compositionKeys: string[];
}

/** Deterministic seed from two strings — feeds the clause-selection PRNG. */
function stableHashSeed(a: string, b: string): number {
  let hash = 0x5b3d7a9f;
  for (const str of [a, b]) {
    for (let i = 0; i < str.length; i++) {
      hash = (Math.imul(hash, 31) + str.charCodeAt(i)) | 0;
    }
  }
  return hash >>> 0;
}

/** Drop a trailing sentence period so a hedge tail can attach with an em-dash. */
function attachHedgeTail(sentence: string, tail: string): string {
  const trimmed = sentence.replace(/[.]\s*$/, '');
  return `${trimmed} — ${tail}.`;
}

/**
 * Compose a receipt-driven foreshadowing passage. The receipt carries the real
 * causality (top contribution kinds, intel tier, forecast); the prose renders it
 * grammatically for he/she/they and never surfaces the encounter title.
 */
export function composeReceiptForeshadowing(
  input: ComposeReceiptInput,
  receipt: MotiveReceipt,
): ComposedReceiptForeshadowing {
  const { agentId, encounterId, agentName, subjectPronoun, locationName } = input;

  const firstName = agentName.split(' ')[0] || agentName;
  const subject = subjectPronoun.trim().toLowerCase() || 'they';
  const Subject = subject.charAt(0).toUpperCase() + subject.slice(1);
  const objectForm = objectPronoun(subject);
  const ObjectForm = objectForm.charAt(0).toUpperCase() + objectForm.slice(1);
  const number = pronounNumber(subject);

  const tier = receipt.intelTier in KNOWLEDGE_CLAUSES ? receipt.intelTier : 'unknown';
  const topKind = receipt.contributions[0]?.kind ?? 'personality';
  const forecast = receipt.expectation in EXPECTATION_BY_FORECAST ? receipt.expectation : 'uncertain';

  // Optional S4: the second contribution, only if it clears the stake floor.
  const second = receipt.contributions[1];
  const hasStake = !!second && second.weight >= STAKE_CLAUSE_MIN_WEIGHT;

  // Seed on (agent, encounter) XOR the decision tick — stable per decision,
  // fresh across decisions.
  const rng = mulberry32(stableHashSeed(agentId, encounterId) ^ (receipt.decidedAtTick | 0));
  const pick = <T>(pool: readonly T[]): T => pool[Math.floor(rng() * pool.length)];

  const matter = locationName ? matterAtPlace(locationName) : pick(MATTER_NO_PLACE);
  // Every matter phrase is lowercase by construction ("what stirs at Ashmarket"),
  // so a clause that opens on the matter needs the capitalized form (THR-1360).
  const Matter = matter.charAt(0).toUpperCase() + matter.slice(1);

  // Fixed pick order keeps the seed → prose mapping stable.
  const knowledgeTpl = pick(KNOWLEDGE_CLAUSES[tier]);
  // Reach-flavored S2 (THR-640): for the top-4 contribution kinds, a sub-table
  // keyed on the receipt's dominantReach adds Reach-specific flavour; other kinds
  // (or an unflavoured Reach) fall back to the base kind pool, then personality.
  const reachPool = MOTIVE_CLAUSES_BY_REACH[topKind]?.[receipt.dominantReach];
  const motivePool = reachPool ?? MOTIVE_CLAUSES[topKind] ?? MOTIVE_CLAUSES.personality;
  const motiveTpl = pick(motivePool);
  const expectationTpl = pick(EXPECTATION_BY_FORECAST[forecast]);
  const lowIntel = tier === 'unknown' || tier === 'rumor';
  const hedgeTail = lowIntel ? pick(LOW_INTEL_HEDGE_TAILS) : null;
  const stakeTpl = hasStake ? pick(STAKE_CLAUSES[second.kind] ?? DEFAULT_STAKE_CLAUSES) : null;

  const slots = {
    name: firstName,
    subject,
    Subject,
    object: objectForm,
    Object: ObjectForm,
    matter,
    Matter,
    place: locationName,
  };
  const ctx = { number, slots };

  const s1 = realize(knowledgeTpl, ctx);
  const s2 = realize(motiveTpl, ctx);
  let s3 = realize(expectationTpl, ctx);
  if (hedgeTail) s3 = attachHedgeTail(s3, hedgeTail);
  const s4 = stakeTpl ? realize(stakeTpl, ctx) : '';

  const prose = [s1, s2, s3, s4].filter(Boolean).join(' ');

  const compositionKeys = [
    `knowledge:${tier}`,
    reachPool ? `pull:${topKind}/${receipt.dominantReach}` : `pull:${topKind}`,
    `expect:${forecast}${lowIntel ? '/hedged' : ''}`,
    ...(hasStake ? [`stake:${second.kind}`] : []),
  ];

  return { prose, tooltipProse: s2, compositionKeys };
}
