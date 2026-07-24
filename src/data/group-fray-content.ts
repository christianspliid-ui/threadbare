/**
 * The Shared Spoils / Old Wounds — Company Fray Prose (THR-74)
 *
 * When a *threaded* company's cohesion first slips below the fray line
 * (`GROUP_FRAY_THRESHOLD`, prose state `frayed`), the moment is not a silent
 * number — it is an authored beat, the sibling of The Parting. Two registers,
 * chosen by a seeded coin so a replay tells the same fraying (see `groupFray.ts`):
 *
 *  - **shared_spoils** — a trust test: something worth dividing lands between them
 *    and the arithmetic of who earned what leaves the table colder than it was.
 *  - **old_wounds** — a rivalry: a grievance two of them carried quietly comes back
 *    up, and the fellowship feels the miles between them.
 *
 * An untethered company's fray stays the silent systemic line — only a company the
 * player has a thread into earns the authored moment.
 *
 * Data only, no logic. The `{company}` token is substituted with the company's
 * generated proper name at fire time. The lines evoke the two-member tension the
 * plan describes without naming members, so they stay fail-soft. The word "party"
 * never appears here by design — player-facing text says "company" or the generated
 * name (THR-734).
 */

/** Which register a fray moment is told in. */
export type FrayMomentKind = 'shared_spoils' | 'old_wounds';

/**
 * The Shared Spoils — a trust test over division. Told with the chill of small
 * arithmetic done between friends; nobody is the villain, everybody keeps score.
 */
export const GROUP_FRAY_SHARED_SPOILS: readonly string[] = [
  'A haul comes to {company}, and with it the old arithmetic of who earned what. The reckoning leaves a colder table than the one they sat down to.',
  'There is treasure enough in {company} — and that is the trouble. Every share looks smaller held beside a comrade’s, and trust thins where the coin is counted.',
  'The spoils of {company} are divided, and everyone smiles, and no one is satisfied. The grievance goes away unspent, to be drawn on later.',
  'What {company} won together they cannot split evenly, and the seam of it shows. A hand rests a beat too long on a purse that is not its own.',
  'The wealth that should have bound {company} tighter does the opposite: each measures the others by what they reached for, and remembers it.',
];

/**
 * Old Wounds — a rivalry resurfacing. Told cold; a hurt two of them never healed
 * gets its say at last, and the whole company holds its breath around the edges.
 */
export const GROUP_FRAY_OLD_WOUNDS: readonly string[] = [
  'Two of {company} let an old grievance off its leash tonight, and the fire burns lower for the airing of it.',
  'A quarrel long swallowed comes back up between two of {company}. Nobody wins it; nobody meant to start it; the road just wore the patience through.',
  'Someone in {company} says the thing that should have stayed unsaid, and a wound that had scabbed over splits clean open again.',
  'The rivalry {company} carried quietly turns loud. Old names get called, old debts get counted, and the fellowship feels the miles between them.',
  'Two who ride with {company} circle a hurt they never mended, and the whole company holds its breath around the edges of it.',
];

/** Fail-soft line used when a pool comes back empty. */
export const GROUP_FRAY_FALLBACK = 'Something goes unspoken in {company}, and the silence sits heavier than words.';
