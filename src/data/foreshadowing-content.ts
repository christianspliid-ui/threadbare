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
 *  • `{subject}` / `{Subject}` appear ONLY in subject position. A pronoun in
 *    object position ("moves {object} closer", "this is {object} all over") uses
 *    `{object}` / `{Object}` (them/him/her) — the case axis the realizer resolves
 *    via `objectPronoun` (THR-640). Never route a subject slot into object position.
 *  • Possessive pronouns (their/his/her) are still avoided — use `{name}`'s form
 *    ("the grain of {name}") instead of a possessive slot.
 *  • Modals (can, will, would, may, might, must) are invariant across persons and
 *    are safe after any pronoun without a `{v:}` slot.
 *
 * Voice: plainspoken Malazan baseline (THR-609). Short declarative sentences,
 * mandatory hedges below the `briefed` tier (has heard, suspects, reckons), one
 * grounded detail, no exclamation marks, no digits.
 */

import type { ForeshadowingIntelligenceTier, MotiveContributionKind } from '../types/foreshadowing';
import type { ReachDomain } from '../types/traits';
import type { ForecastTier } from '../types/traces/encounter-traces';

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

// ─── Receipt-driven clauses (THR-631 Phase B) ───────────────────────────────
// When a Motive Receipt is present, the composed passage is driven by the real
// decision causality rather than a Reach guess:
//   S1 knowledge   — KNOWLEDGE_CLAUSES keyed by the receipt's real intel tier.
//   S2 pull/motive — MOTIVE_CLAUSES keyed by the top contribution KIND (why the
//                    scorer actually favoured this encounter).
//   S3 expectation — EXPECTATION_BY_FORECAST keyed by the real completionProb
//                    forecast tier, hedged with an em-dash tail below `briefed`.
//   S4 stake       — STAKE_CLAUSES keyed by the SECOND contribution kind, only
//                    when its weight clears STAKE_CLAUSE_MIN_WEIGHT.
// Same authoring rules as above: `{v:}` only after `{Subject}`/`{subject}`;
// non-pronoun subjects hardcode their verb; no possessive/object pronouns of the
// subject; no digits; no exclamation marks; plainspoken Malazan (THR-609).

/**
 * S2 pull — the motive that drew the agent, keyed by the top contribution kind
 * of its Motive Receipt. One kind per `MotiveContributionKind`; ≥4 variants each.
 */
export const MOTIVE_CLAUSES: Record<MotiveContributionKind, readonly string[]> = {
  ambition: [
    '{Subject} {v:want} this, and {subject} {v:mean} to take it while the taking is good.',
    '{Subject} {v:see} {matter} as a rung, and {subject} {v:intend} to climb it.',
    '{Subject} {v:reckon} {matter} moves {object} closer to what {subject} {v:want}.',
    'There is a thing {subject} {v:want}, and {matter} sits square on the way to it.',
  ],
  personality: [
    '{Subject} {v:go} because this is the kind of thing {subject} always {v:go} toward.',
    '{Subject} {v:take} {matter} on because it fits how {subject} {v:move} through the world.',
    'This is {object} all over — {subject} {v:mean} to meet {matter} head-on.',
    '{Subject} {v:answer} {matter} the way {subject} {v:answer} most things, plainly and soon.',
  ],
  intel: [
    '{Subject} {v:know} something about {matter} that few others {v:hold}, and {subject} {v:mean} to use it.',
    'What {subject} {v:know} of {matter} points one way, and {subject} {v:follow} it.',
    '{Subject} {v:have} the better account of {matter}, and {subject} {v:trust} it.',
    '{Subject} {v:move} on what {subject} {v:know}, not on what {subject} {v:hope}.',
  ],
  mark: [
    '{Subject} {v:carry} an old mark for this, and {matter} calls straight to it.',
    '{Subject} {v:bear} a hidden mark, and {matter} is the thing it wants.',
    '{Subject} could not say why {matter} pulls so hard — only that it does, and {subject} {v:go}.',
    'There is a mark on this for {name}, and {subject} {v:mean} to answer it.',
  ],
  divine: [
    '{Subject} {v:feel} a hand at the back, steering toward {matter}.',
    'Something {subject} {v:take} for a sign has settled on {matter}, and {subject} {v:heed} it.',
    '{Subject} {v:believe} a power beyond reckoning wants {matter} done, and {subject} {v:mean} to do it.',
    'The pull toward {matter} came from somewhere outside, and {subject} {v:choose} not to question it.',
  ],
  bond: [
    'Someone {subject} {v:trust} has a stake in {matter}, and that is reason enough.',
    '{Subject} {v:go} for the sake of another, more than for {matter} itself.',
    'There is a person tied to {matter} whom {subject} will not abandon.',
    '{Subject} {v:owe} someone in this, and {subject} {v:mean} to make it good.',
  ],
  reputation: [
    '{Subject} {v:know} how this will look, and {subject} {v:want} to be seen answering {matter}.',
    '{Subject} {v:go} partly for the name {subject} will earn in {matter}.',
    'There is standing to be won here, and {subject} {v:mean} to win it.',
    '{Subject} {v:reckon} {matter} will settle where {subject} {v:stand} with the rest.',
  ],
  resonance: [
    '{Subject} {v:feel} {matter} sit right, the way a true note sits right.',
    '{Matter} hums at a pitch {subject} {v:answer} to, and {subject} {v:follow} it.',
    'Something in {matter} matches the grain of {name}, and {subject} {v:lean} toward it.',
    '{Subject} {v:go} because {matter} rings true, and {subject} {v:trust} that over reasons.',
  ],
  rarity: [
    'A thing like {matter} comes once, if that, and {subject} will not let it pass.',
    '{Subject} {v:know} how seldom {matter} comes, and {subject} {v:mean} to be there for it.',
    'This will not come again soon, so {subject} {v:go} while it stands.',
    '{Subject} {v:reckon} {matter} is a rare turn, and rare turns do not wait.',
  ],
  hunch: [
    '{Subject} could not give a reason for {matter} — only a feeling {subject} {v:trust}.',
    '{Subject} {v:have} a hunch about {matter}, and {subject} {v:know} better than to argue with it.',
    'Something about {matter} sits wrong, or sits right; {subject} could not say which, only that {subject} {v:go}.',
    '{Subject} {v:go} on instinct here, and {subject} {v:reckon} instinct has earned its say.',
  ],
  doom_identity: [
    '{Subject} {v:feel} {matter} is part of what {subject} {v:become}, and {subject} will not turn from it.',
    'There is a shape to what {subject} {v:become}, and {matter} fits it.',
    '{Subject} {v:go} as if {matter} were already written for {name}.',
    '{Subject} {v:sense} {matter} pulling toward what {subject} {v:be} meant to be.',
  ],
  chain: [
    '{Matter} follows from what {subject} began, and {subject} {v:mean} to see it through.',
    '{Subject} started something, and {matter} is where it leads.',
    '{Subject} will not leave {matter} half-done, having come this far.',
    'One thing led to {matter}, and {subject} {v:follow} the thread to its end.',
  ],
  exploration: [
    'What {matter} holds, {subject} could not say — and that is the whole of the draw.',
    '{Subject} {v:go} to see {matter} plainly, for no reason but the seeing.',
    'New ground pulls hard, and {matter} is new ground; {subject} {v:go} to walk it.',
    '{Subject} {v:want} to know {matter} first-hand, not by another telling of it.',
  ],
  proximity: [
    '{Matter} lies close to hand, and {subject} {v:see} no reason to look past it.',
    '{Subject} {v:go} because {matter} is near, and near counts for much on a hard road.',
    'The road to {matter} is short, and {subject} {v:take} the short road.',
    '{Matter} is on the way, and {subject} will not waste the steps.',
  ],
};

/**
 * S2 reach-flavor sub-tables (THR-640) for the four most common contribution
 * kinds. When a receipt's top kind is one of these AND its dominantReach has a
 * sub-table below, the composer prefers these Reach-specific variants over the
 * base `MOTIVE_CLAUSES[kind]` pool — the same motive reads differently depending
 * on the cosmic energy behind it (iron martial, gold commerce, shadow stealth,
 * veil magic, heart social, eye knowledge, star faith). Only the *relevant*
 * Reaches per kind are flavored; any other Reach falls back to the base pool.
 * ≥3 variants per (kind, reach). Same authoring rules as MOTIVE_CLAUSES.
 */
export const MOTIVE_CLAUSES_BY_REACH: Partial<
  Record<MotiveContributionKind, Partial<Record<ReachDomain, readonly string[]>>>
> = {
  ambition: {
    iron: [
      '{Subject} {v:mean} to take {matter} by strength, and let the taking speak for itself.',
      '{Subject} {v:see} a hard climb in {matter}, and {subject} {v:mean} to fight up every foot of it.',
      '{Subject} {v:reckon} {matter} falls to whoever hits hardest, and {subject} {v:intend} to be that one.',
    ],
    gold: [
      '{Subject} {v:see} a fortune in {matter}, and {subject} {v:mean} to be the hand that banks it.',
      '{Subject} {v:reckon} {matter} is the making of a fortune, and {subject} will not let it walk.',
      'There is coin and standing both in {matter}, and {subject} {v:want} the whole of it.',
    ],
    star: [
      '{Subject} {v:believe} {matter} is a rung fate set out, and {subject} {v:mean} to climb it.',
      '{Subject} {v:feel} a greatness owed in {matter}, and {subject} {v:go} to claim what is owed.',
      '{Subject} {v:take} {matter} for a charge laid down from above, and {subject} will not set it aside.',
    ],
  },
  personality: {
    iron: [
      '{Subject} {v:go} at {matter} straight on, the only way {subject} {v:know} how.',
      '{Subject} {v:meet} {matter} head-on, the way {subject} {v:meet} everything.',
      'This is how {subject} always {v:move} — into {matter}, not around it.',
    ],
    heart: [
      '{Subject} {v:take} {matter} to heart, the way {subject} {v:take} most things.',
      '{Subject} {v:go} to {matter} because {subject} always {v:go} where people need answering.',
      '{Subject} {v:read} {matter} as a matter of people first, the way {subject} always {v:have}.',
    ],
    shadow: [
      '{Subject} {v:come} at {matter} quiet, the way {subject} {v:come} at most things.',
      '{Subject} {v:watch} {matter} first, as {subject} always {v:do}.',
      '{Subject} {v:keep} {matter} close and {v:say} little, the way {subject} always {v:have}.',
    ],
  },
  intel: {
    eye: [
      '{Subject} {v:know} more of {matter} than {subject} {v:let} on, and {subject} {v:mean} to use it.',
      'What {subject} {v:know} of {matter} points one way, and {subject} {v:trust} the knowing.',
      '{Subject} {v:have} read {matter} to its roots, and {subject} {v:move} on what {subject} {v:find}.',
    ],
    veil: [
      '{Subject} {v:see} a hidden turn in {matter} that others do not, and {subject} {v:mean} to take it.',
      '{Subject} {v:know} the sign laid over {matter}, and {subject} {v:read} it plainly.',
      '{Subject} already {v:hold} a secret to {matter}, and {subject} {v:go} to spend it.',
    ],
    shadow: [
      '{Subject} {v:hold} a secret about {matter} that few others do, and {subject} {v:mean} to use it.',
      '{Subject} {v:know} who moves behind {matter}, and {subject} {v:trust} that knowing over any rumor.',
      'What {subject} {v:know} of {matter} came the quiet way, and {subject} {v:reckon} it sound.',
    ],
  },
  divine: {
    star: [
      '{Subject} {v:take} {matter} for a charge from on high, and {subject} {v:mean} to answer it.',
      '{Subject} {v:feel} a hand at the back over {matter}, steady and sure, and {subject} {v:heed} it.',
      '{Subject} {v:believe} the powers above want {matter} done, and {subject} will not refuse them.',
    ],
    veil: [
      '{Subject} {v:read} a sign in {matter}, and {subject} {v:follow} where it points.',
      '{Subject} {v:feel} the unseen stir around {matter}, and {subject} {v:take} it for a call.',
      'Something past the plain world has settled on {matter}, and {subject} {v:mean} to heed it.',
    ],
    heart: [
      '{Subject} {v:feel} a higher will in {matter}, and it speaks to {name} in the tongue of mercy.',
      '{Subject} {v:take} {matter} for a charge of mercy laid on {name}, and {subject} {v:mean} to bear it.',
      '{Subject} {v:believe} a kindness beyond reckoning wants {matter} done, and {subject} {v:go} to do it.',
    ],
  },
};

/**
 * S3 expectation — what the agent thinks will happen, keyed by the real
 * completionProb forecast tier. ≥4 variants each. A low intel tier layers a
 * hedge on top (see LOW_INTEL_HEDGE_TAILS) — the prose commits to the agent's
 * read, not the truth, which is where the dramatic irony lives (THR-631).
 */
export const EXPECTATION_BY_FORECAST: Record<ForecastTier, readonly string[]> = {
  doomed: [
    '{Subject} {v:expect} it to go badly, and {v:go} anyway.',
    '{Subject} {v:reckon} the odds are poor and getting no better.',
    '{Subject} {v:think} this may cost more than {subject} can carry.',
    '{Subject} {v:go} braced for the worst, hoping {subject} {v:be} wrong.',
  ],
  perilous: [
    '{Subject} {v:expect} hard going, and {v:mean} to weather it.',
    '{Subject} {v:reckon} this will draw blood before it settles.',
    '{Subject} {v:know} the risk runs steep, and {v:go} in with eyes open.',
    '{Subject} {v:expect} to pay for this, one way or another.',
  ],
  uncertain: [
    '{Subject} could not call which way {matter} will fall.',
    '{Subject} {v:reckon} it a coin toss, and {v:go} to flip it.',
    '{Subject} {v:expect} the ground to shift, and {v:mean} to shift with it.',
    'Which way this turns, {subject} could not say — only that {subject} {v:go}.',
  ],
  favorable: [
    '{Subject} {v:reckon} the odds sit fair, if {subject} {v:play} it plain.',
    '{Subject} {v:expect} this to go the right way, more likely than not.',
    '{Subject} {v:like} the shape of it, and {v:expect} to come out ahead.',
    '{Subject} {v:judge} the footing good, and {v:mean} to keep it.',
  ],
  fated: [
    '{Subject} {v:know} how this ends, and {v:go} to meet it.',
    '{Subject} {v:see} the whole shape of it already, sure as sunrise.',
    'There is no real doubt left, and {matter} will go as {subject} {v:see} it.',
    '{Subject} {v:expect} to prevail; the outcome feels all but written.',
  ],
};

/**
 * Em-dash tail appended to S3 when the agent's intel tier is below `briefed`,
 * marking their read as a guess. Impersonal — no agreement axis — so it attaches
 * safely to any expectation clause.
 */
export const LOW_INTEL_HEDGE_TAILS: readonly string[] = [
  'though the knowing is thin',
  'if any of it holds',
  'for a guess dressed as a plan',
];

/**
 * S4 stake — an optional misgiving tied to the SECOND contribution kind. Curated
 * for the highest-drama kinds; every other kind falls back to DEFAULT_STAKE_CLAUSES
 * (fail-soft table). ≥3 variants each.
 */
export const STAKE_CLAUSES: Partial<Record<MotiveContributionKind, readonly string[]>> = {
  ambition: [
    '{Subject} {v:know} how much {subject} {v:stand} to lose if the reach falls short.',
    'Wanting this much has undone steadier hands than these.',
    '{Subject} {v:want} it badly enough that the wanting itself is a risk.',
  ],
  bond: [
    'If this goes wrong, someone {subject} {v:love} pays for it too.',
    '{Subject} {v:fear} for the one this touches more than for {name}.',
    'Another life rides on this, and {subject} {v:feel} the weight of it.',
  ],
  divine: [
    '{Subject} {v:wonder}, briefly, whose will {subject} truly {v:serve}.',
    '{Subject} {v:mistrust}, a little, the hand that points here.',
    '{Subject} {v:follow} the sign, and {v:try} not to ask what it wants in return.',
  ],
  mark: [
    '{Subject} {v:carry} a mark that has led others to ruin before now.',
    '{Subject} {v:fear} what answering it might wake.',
    'There is no putting the mark down, and {subject} {v:know} it.',
  ],
  doom_identity: [
    '{Subject} {v:wonder} if becoming this is a thing {subject} {v:want} at all.',
    'The shape {subject} {v:move} toward is not wholly a kind one.',
    '{Subject} {v:feel} the pull as much a warning as a call.',
  ],
  rarity: [
    'Miss this, and {subject} will not see its like again.',
    'The one chance cuts both ways, and {subject} {v:know} it.',
    '{Subject} {v:press} because waiting is its own kind of loss.',
  ],
};

/** Fallback S4 stake pool for kinds without a bespoke table. */
export const DEFAULT_STAKE_CLAUSES: readonly string[] = [
  'Still, {subject} {v:know} what a wrong step here could cost.',
  'There is a doubt {subject} {v:carry} even so.',
  '{Subject} {v:go} anyway, though not without a second thought.',
  'What {subject} {v:stand} to lose is not small, and {subject} {v:know} it.',
];
