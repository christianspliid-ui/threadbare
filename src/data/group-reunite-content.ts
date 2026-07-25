/**
 * The Reunion / The Road Not Taken — Reunite Prose (THR-732)
 *
 * Reunite is cast on a company that already ended. It opens a window
 * (`reuniteUntilTick`) during which the scattered survivors feel a pull back toward
 * one another; what happens next is theirs, not the god's. So the verb has exactly
 * two endings, and both are authored here:
 *
 *  - **reunion** — enough of them found each other again and the formation scan bound
 *    them. Fired when a company forms with `formationContext.cause === 'reunite'`, the
 *    sibling of Seeking Companions.
 *  - **lapse** — the window closed with the company still scattered. Fired once, when
 *    the window expires unanswered. This is not a failure state to be hidden: a god
 *    who calls and is not answered is the premise working correctly, and the chronicle
 *    should say so.
 *
 * There is deliberately **no Sunder pool here.** Sunder's drama is told entirely
 * through moments that already shipped — the fray pool (The Shared Spoils / Old
 * Wounds, which its window forces open) and The Parting on the dissolution it
 * hastens. Authoring a parallel Sunder pool would put a second narrator on the same
 * events; its cast prose lives on the action template's `narrativeTemplates`, which
 * the Divine Receipt renders like every other card.
 *
 * Data only, no logic. `{company}` is substituted with the company's proper name at
 * fire time. The word "party" never appears here by design — player-facing text says
 * "company" or the generated name (THR-734).
 */

/** Which ending a Reunite window reached. */
export type ReunionMomentKind = 'reunion' | 'lapse';

/**
 * The Reunion — they came back. Told without triumph: these people already failed to
 * hold together once, and everyone standing there knows it. The warmth is real and
 * it is guarded, which is the only kind a second attempt gets.
 */
export const GROUP_REUNION_FORMED: readonly string[] = [
  'They find each other on a road none of them meant to walk, and {company} stands again — thinner, warier, and unmistakably itself.',
  'Nobody makes a speech. {company} simply re-forms around the fire, as though the intervening months were a thing that happened to other people.',
  'The old company comes back together as {company}, and the first hour is all silence and stolen glances, each of them waiting to see who will leave first this time.',
  '{company} rides again. Not one of them says the name aloud yet, as if saying it might frighten the thing off.',
  'What ended is standing up again as {company}, carrying every reason it ended the first time, and going anyway.',
  'They had all agreed, separately and privately, that it was over. {company} re-forms regardless, and the agreement goes unmentioned.',
];

/**
 * The Road Not Taken — the window closed unanswered. Told as an absence rather than a
 * defeat; the pull was real, the mortals simply had lives that did not bend to it.
 */
export const GROUP_REUNION_LAPSED: readonly string[] = [
  'The pull toward {company} thins and finally lets go. Whatever they each turned toward instead, they turn toward it now for good.',
  'For a while the survivors of {company} each felt something like a hand at the shoulder. It fades, unanswered, and the road they were on closes over it.',
  'They dreamt of {company} for a season, and then stopped. Some companies get a second telling; this one gets a first, and an ending.',
  'The scattered of {company} never quite converge. The distance wins — not dramatically, just steadily, the way distance usually does.',
  'What was left of {company} does not gather. The call goes out, and out, and finds only people who have already become someone else.',
];

/** Fail-soft line used when a pool comes back empty. */
export const GROUP_REUNION_FALLBACK = 'Something that was {company} stirs, and settles again.';
