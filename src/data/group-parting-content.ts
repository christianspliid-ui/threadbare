/**
 * The Parting — Company Dissolution Prose (THR-74)
 *
 * When a *threaded* company ends, its dissolution is not a silent line in the
 * ledger — it is an authored moment. Two variants, chosen by how the company
 * came apart (see `groupParting.ts`):
 *
 *  - **bittersweet** — they parted with the road behind them intact: a goal met,
 *    a fellowship that held to the last.
 *  - **bitter** — they came apart in acrimony: cohesion spent, trust turned.
 *  - **betrayed** — one of them was bought (THR-1174).
 *
 * Data only, no logic. The `{company}` token is substituted with the company's
 * generated proper name at fire time. The word "party" never appears here by
 * design (player-facing text says "company" or the generated name — THR-734).
 */

/** Which register a parting is told in. */
export type PartingVariant = 'bittersweet' | 'bitter' | 'betrayed';

/**
 * Bittersweet farewells — the company ends whole. Told with warmth and loss in
 * equal measure; nobody is the villain of it.
 */
export const GROUP_PARTING_BITTERSWEET: readonly string[] = [
  'The road that made {company} runs out, and they let it. Each rides on alone, the richer for the miles they shared.',
  '{company} keep their last promise, then keep the road no longer — a clasp of hands at the crossroads, and gone their separate ways.',
  'Nothing broke {company}; the errand simply ended. They part as friends part, slower than they mean to.',
  'The fire of {company} burns down to embers by choice, not spite. They scatter to the four winds, carrying the warmth of it.',
  'What {company} set out to do is done. They divide the quiet between them and walk out into their own stories again.',
];

/**
 * Bitter partings — the company comes apart in rancor. Told cold; the bond that
 * held them is the thing that failed.
 */
export const GROUP_PARTING_BITTER: readonly string[] = [
  'What was {company} ends in raised voices and turned backs. No one looks again at the fire they shared.',
  '{company} come apart at the seams — old grievances given their say at last, and the road too short to mend them.',
  'The bond that was {company} frays through and snaps. They ride off in different directions and do not wave.',
  'Trust was the whole of {company}, and trust is what ran out. They leave as strangers who happen to know each other too well.',
  '{company} scatter in acrimony, each certain the others were the ones who failed. The name will not be spoken fondly.',
];

/**
 * Betrayed partings — one of them was bought, and the company ends on it (THR-1174).
 *
 * Told apart from `bitter` because the two are not the same ending. A bitter
 * parting is an argument that finished: everyone knows what happened and who
 * they blame. This one runs on a `hidden_mark`, which is concealed by
 * construction — the company comes apart around a fact it does not have. So
 * these lines are about the *not knowing*: nobody is named, nobody is accused,
 * and the suspicion outlives the company. Routing a sale through the bitter pool
 * would put "old grievances given their say at last" over a scene where the
 * grievance was never said, which is a prose lie about the state that produced it.
 */
export const GROUP_PARTING_BETRAYED: readonly string[] = [
  'Somebody sold what {company} knew, and {company} never learned who. They part certain of the thing and sure of no one.',
  '{company} ends the way a company ends when it has been bought: quietly, with everyone still standing in the room.',
  'What {company} knew was worth coin, and one of them took it. The others divide the road and count each other out of it.',
  '{company} comes apart over a thing none of them can name. One of them can, and says nothing, and rides out with the rest.',
  'The road ahead of {company} was told to a stranger before they walked it. They scatter, each keeping a suspicion they will never settle.',
];

/** Fail-soft line used when a pool comes back empty. */
export const GROUP_PARTING_FALLBACK = '{company} goes its separate ways.';
