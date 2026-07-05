/**
 * Composed-generic foreshadowing clause pools (THR-631, Phase A).
 *
 * These are the *fail-soft floor* for encounter-motivation prose: when an
 * encounter has no authored `foreshadowing` variant (the ~99% case today), the
 * resolver composes a short, grammatical, varied passage from these clauses
 * instead of emitting the old buggy single-string fallback. This is the
 * permanent composed-generic path in the THR-631 design, not throwaway scaffolding.
 *
 * A composed passage is three clauses:
 *   S1 knowledge  — how the agent came to know (keyed by intel tier)
 *   S2 pull       — the draw of the encounter's domain (keyed by Reach)
 *   S3 expectation — what they think will happen (keyed by intel tier, hedged low)
 *
 * ── Authoring rules (agreement safety — see realizer.ts) ────────────────────
 *  • A verb slot `{v:lemma}` may ONLY follow the pronoun subject `{Subject}` /
 *    `{subject}`. The realizer conjugates it to the pronoun's number, so this is
 *    the only place variable agreement is correct.
 *  • Verbs whose subject is `{name}` (a proper name, always 3rd-person singular)
 *    or `{matter}` (always singular) are written out directly — never `{v:}`.
 *  • `{subject}` / `{Subject}` appear ONLY in subject position. No possessive or
 *    object pronouns (their/them/him) — those carry a second agreement axis and
 *    are avoided entirely in Phase A.
 *  • Modals (can, will, would, may, might, must) are invariant across persons and
 *    are safe after any pronoun without a `{v:}` slot.
 *
 * Voice: plainspoken Malazan baseline (THR-609). Short declarative sentences,
 * mandatory hedges below the `briefed` tier (has heard, suspects, reckons), one
 * grounded detail, no exclamation marks, no digits.
 */

import type { ForeshadowingIntelligenceTier } from '../types/foreshadowing';
import type { ReachDomain } from '../types/traits';

/** How the agent came to know — subject is `{name}`; verbs hardcoded singular. */
export const KNOWLEDGE_CLAUSES: Record<ForeshadowingIntelligenceTier, readonly string[]> = {
  unknown: [
    '{name} has caught only a thread of this — a name, a direction, little else.',
    'The word that reached {name} was thin, and half of it was likely wrong.',
    '{name} goes on not much more than a pull toward {matter}.',
    'No one told {name} plainly; {subject} gathered it from scraps.',
  ],
  rumor: [
    '{name} has heard the talk — market rumor, passed hand to hand.',
    "A traveller's account brought {name} this much, and no more.",
    '{name} trusts the rumor enough to move on it, not enough to be sure.',
    'The story reached {name} thirdhand, worn smooth by every mouth it crossed.',
  ],
  briefed: [
    '{name} has a clear account of {matter}, from someone who was there.',
    '{name} knows the shape of this — who, where, and roughly why.',
    'A reliable word reached {name}, and it held together under weight.',
    '{name} has been told enough to plan, if not quite enough to be certain.',
  ],
  expert: [
    'There is little about {matter} that {name} has not already weighed.',
    '{name} has walked ground like this before, and remembers every cost.',
    '{name} reads this plainly; the account leaves no real doubt.',
    '{name} knows {matter} the way a smith knows cold iron — by long handling.',
  ],
};

/**
 * The draw of the encounter's domain — subject is `{Subject}`, present verbs use
 * `{v:}`. Reach-flavored per the canonical meanings (UL Cosmology): iron
 * martial, gold commerce, shadow stealth, veil magic, heart social, eye
 * knowledge, stone endurance, star faith.
 */
export const PULL_CLAUSES: Record<ReachDomain, readonly string[]> = {
  iron: [
    '{Subject} {v:mean} to meet {matter} head-on, with a straight back.',
    '{Subject} {v:go} toward the hard work, not around it.',
    '{Subject} {v:trust} a strong arm to see {matter} through.',
  ],
  gold: [
    '{Subject} {v:see} a fair return in {matter}, and {subject} {v:mean} to collect it.',
    '{Subject} {v:reckon} {matter} can be turned to profit.',
    '{Subject} {v:want} the coin that {matter} might shake loose.',
  ],
  shadow: [
    '{Subject} {v:mean} to reach {matter} quietly, before anyone marks the move.',
    '{Subject} {v:prefer} to work {matter} from the unlit side.',
    '{Subject} {v:trust} a soft step and a closed mouth to carry {matter}.',
  ],
  veil: [
    '{Subject} {v:feel} a thin place in {matter}, where the ordinary rules bend.',
    '{Subject} {v:sense} more to {matter} than its plain surface.',
    '{Subject} {v:mean} to read the signs laid over {matter}.',
  ],
  heart: [
    '{Subject} {v:mean} to reach {matter} with a word rather than a blade.',
    '{Subject} {v:trust} a steady voice to steer {matter}.',
    '{Subject} {v:feel} the human weight of {matter}, and {subject} {v:mean} to answer it.',
  ],
  eye: [
    '{Subject} {v:want} the truth of {matter}, plainly and first.',
    '{Subject} {v:mean} to get to the bottom of {matter}.',
    '{Subject} {v:read} {matter} closely, hunting the pattern in it.',
  ],
  stone: [
    '{Subject} {v:mean} to outlast {matter}, however long it holds.',
    '{Subject} {v:trust} patience and a firm footing to carry {matter}.',
    '{Subject} {v:build} toward {matter} the slow way, stone on stone.',
  ],
  star: [
    '{Subject} {v:feel} {matter} as something owed — a duty more than a choice.',
    '{Subject} {v:believe} {matter} is part of a larger design.',
    '{Subject} {v:carry} {matter} like a charge laid down from above.',
  ],
};

/** What they expect — subject is `{Subject}`, hedged hard at low intel. */
export const EXPECTATION_CLAUSES: Record<ForeshadowingIntelligenceTier, readonly string[]> = {
  unknown: [
    '{Subject} {v:suspect} it will not go easily, though {subject} cannot yet say why.',
    '{Subject} {v:go} half-blind into it, and {subject} {v:know} as much.',
    '{Subject} {v:expect} the ground to shift, and {v:mean} to shift with it.',
  ],
  rumor: [
    '{Subject} {v:reckon} the odds sit near even, if the talk holds at all.',
    '{Subject} {v:expect} trouble, though the rumor may have swollen in the telling.',
    '{Subject} {v:expect} it to run roughly as told — no better, and likely worse.',
  ],
  briefed: [
    '{Subject} {v:expect} a hard hour, and {v:think} the cost worth paying.',
    '{Subject} {v:judge} the odds fair, with room for it to turn.',
    '{Subject} {v:mean} to see it through, and {v:believe} {subject} can.',
  ],
  expert: [
    '{Subject} {v:know} how this ends if it is played right, and {v:mean} to play it right.',
    '{Subject} {v:expect} to prevail; the account leaves no real doubt.',
    '{Subject} {v:see} the whole shape of it, and {v:like} what {subject} {v:see}.',
  ],
};

/** Fallback pull pool when a template's Reach is unknown (e.g. legacy `wilderness`). */
export const DEFAULT_PULL_CLAUSES: readonly string[] = [
  '{Subject} {v:mean} to answer {matter}, whatever it turns out to ask.',
  '{Subject} {v:feel} the pull of {matter} and {v:go} to meet it.',
  '{Subject} {v:trust} plain reasons to carry {matter} through.',
];

/**
 * Noun-phrase used to name the encounter's subject in prose. When the agent's
 * location is known the matter is grounded there ("what stirs at Ashmarket");
 * otherwise a neutral phrase is used. The encounter *title* is deliberately
 * never surfaced here — it is an action label, not a place or a noun phrase, and
 * routing it into a `{place}`/`{matter}` slot is the original THR-631 bug.
 */
export const MATTER_NO_PLACE: readonly string[] = [
  'what waits on the road ahead',
  'the trouble said to be waiting',
  'what lies at the end of this road',
];

/** Grounded matter phrase built from a known location name. */
export function matterAtPlace(locationName: string): string {
  return `what stirs at ${locationName}`;
}
