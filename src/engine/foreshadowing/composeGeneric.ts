/**
 * Composed-generic foreshadowing (THR-631, Phase A).
 *
 * Assembles a short, grammatical, deterministic foreshadowing passage from the
 * clause pools in `foreshadowing-content.ts` when an encounter has no authored
 * `foreshadowing` variant. This replaces the old buggy single-string fallbacks
 * (`GENERIC_FORESHADOWING_FALLBACK`, `GLOBAL_FORESHADOWING_FALLBACK_TEMPLATE`)
 * that produced "trouble in Weave a Political Alliance" and "They believes".
 *
 * Determinism: variant selection is seeded on (agentId, encounterId) so the same
 * decision always yields the same prose; different decisions vary (NFP #3). No
 * `Math.random()`.
 */

import { mulberry32 } from '../../lib/prng';
import type { ForeshadowingIntelligenceTier } from '../../types/foreshadowing';
import { REACH_DOMAINS, type ReachDomain } from '../../types/traits';
import { realize, pronounNumber, objectPronoun } from './realizer';
import {
  KNOWLEDGE_CLAUSES,
  PULL_CLAUSES,
  EXPECTATION_CLAUSES,
  DEFAULT_PULL_CLAUSES,
  MATTER_NO_PLACE,
  matterAtPlace,
} from '../../data/foreshadowing-content';

export interface ComposeGenericInput {
  agentId: string;
  encounterId: string;
  /** Full agent name; the first word is used in prose. */
  agentName: string;
  /** Subject pronoun (he / she / they). */
  subjectPronoun: string;
  /** Encounter's dominant Reach; unknown values fall to the default pull pool. */
  dominantReach: string;
  intelTier: ForeshadowingIntelligenceTier;
  /** Location name when known (panel path); grounds the `{matter}` phrase. */
  locationName?: string;
}

export interface ComposedGenericForeshadowing {
  prose: string;
  /** Provenance of each rendered sentence, for tracing/debug (NFP #2). */
  compositionKeys: string[];
}

function isReachDomain(value: string): value is ReachDomain {
  return (REACH_DOMAINS as readonly string[]).includes(value);
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

/**
 * Compose a three-clause foreshadowing passage: knowledge → pull → expectation.
 * Always grammatical for he/she/they; always varied; never surfaces the encounter
 * title in a place or matter slot.
 */
export function composeGenericForeshadowing(
  input: ComposeGenericInput,
): ComposedGenericForeshadowing {
  const { agentId, encounterId, agentName, subjectPronoun, dominantReach, locationName } = input;

  const tier: ForeshadowingIntelligenceTier =
    input.intelTier in KNOWLEDGE_CLAUSES ? input.intelTier : 'unknown';
  const firstName = agentName.split(' ')[0] || agentName;
  const subject = subjectPronoun.trim().toLowerCase() || 'they';
  const Subject = subject.charAt(0).toUpperCase() + subject.slice(1);
  const objectForm = objectPronoun(subject);
  const ObjectForm = objectForm.charAt(0).toUpperCase() + objectForm.slice(1);
  const number = pronounNumber(subject);

  const reach = isReachDomain(dominantReach) ? dominantReach : null;
  const pullPool = reach ? PULL_CLAUSES[reach] : DEFAULT_PULL_CLAUSES;

  const rng = mulberry32(stableHashSeed(agentId, encounterId));
  const pick = <T>(pool: readonly T[]): T => pool[Math.floor(rng() * pool.length)];

  // Fixed pick order keeps the seed → prose mapping stable.
  const matter = locationName ? matterAtPlace(locationName) : pick(MATTER_NO_PLACE);
  const knowledgeTpl = pick(KNOWLEDGE_CLAUSES[tier]);
  const pullTpl = pick(pullPool);
  const expectationTpl = pick(EXPECTATION_CLAUSES[tier]);

  const slots = {
    name: firstName,
    subject,
    Subject,
    object: objectForm,
    Object: ObjectForm,
    matter,
    place: locationName,
  };
  const ctx = { number, slots };

  const prose = [
    realize(knowledgeTpl, ctx),
    realize(pullTpl, ctx),
    realize(expectationTpl, ctx),
  ]
    .filter(Boolean)
    .join(' ');

  return {
    prose,
    compositionKeys: [
      `knowledge:${tier}`,
      `pull:${reach ?? 'default'}`,
      `expect:${tier}`,
    ],
  };
}
