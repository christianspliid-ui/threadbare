/**
 * Moment card prose (THR-1299 slice 3).
 *
 * One title, one opening line and one consequence line per moment class — the
 * card the player sees when a followed mortal's undertaking says something. The
 * register is game-wide plain narrator (Prose Doctrine v2, `Docs/canon/prose.md`
 * § Narrator mode): report the event from outside the scene, state the fact,
 * never inhabit it. No second person except where the god's own act is named.
 * No numerals anywhere on the face (Law 13); the checkpoint interval is "within
 * the day", not "six turns".
 *
 * Placeholders: `{actor}` (the mortal's name), `{undertaking}` (the christened
 * name where one exists, else the display name), `{lost}` (the cast member a
 * complication lost — the binder ruling: the moment names them), `{band}` (the
 * plain-register word for the checkpoint band, from `stepOutcomeWord`).
 *
 * Card faces stay library-generic (the encounter format lock) — scene texture
 * lives in these two lines, chips claim only state.
 */

import type { UndertakingMomentClass } from '../types/strategicAction';

export interface MomentCardTemplate {
  /** The class word on the header — what kind of moment this is. */
  readonly title: string;
  /** What happened. */
  readonly opening: string;
  /** What it means for the work now. */
  readonly consequence: string;
}

export interface MomentCardVars {
  readonly actor: string;
  readonly undertaking: string;
  readonly band?: string;
  readonly lost?: string;
}

/** Complication with a named loss reads differently from a plain one — the name is the beat. */
export const MOMENT_COMPLICATION_WITH_LOSS: MomentCardTemplate = {
  title: 'Trouble',
  opening: '{actor} has lost {lost}. {undertaking} is thrown into disarray.',
  consequence: 'The work stands where it was. Whether it resumes depends on who can be found to take the place that was emptied.',
};

export const MOMENT_CARD_CONTENT: Readonly<Record<UndertakingMomentClass, MomentCardTemplate>> = {
  started: {
    title: 'A Work Begun',
    opening: '{actor} has begun {undertaking}.',
    consequence: 'Nothing stands yet. The first checkpoint comes within the day, and the work advances only when it goes well.',
  },
  // `{band}` is a verb in the past tense ("held", "faltered", "collapsed" —
  // `OUTCOME_BAND_WORDS`), so the checkpoint is the subject that does it.
  at_cost: {
    title: 'Pressing On at a Cost',
    opening: 'The checkpoint on {undertaking} {band}. {actor} pressed on, and it cost them.',
    consequence: 'The work advanced anyway. A second setback like this one will not be announced — only the first is news.',
  },
  complication: {
    title: 'Trouble',
    opening: 'The checkpoint on {undertaking} {band}. {actor} is in serious trouble with it.',
    consequence: 'The work halts. Enough halts force a choice the mortal makes alone: abandon it, or double down at higher stakes.',
  },
  fork: {
    title: 'Doubling Down',
    opening: '{undertaking} has stalled again and again. {actor} chose not to give it up.',
    consequence: 'The work resumes at higher stakes, with whatever cast can be found for it. Another run of halts ends it for good.',
  },
  abandoned: {
    title: 'Abandoned',
    opening: '{actor} has abandoned {undertaking}.',
    consequence: 'What was half-built stays half-built, under whatever name the ground gives it. The ambition behind it is not gone.',
  },
  completion: {
    title: 'A Work Finished',
    opening: '{actor} has completed {undertaking}.',
    consequence: 'It stands in the world now. Whoever it was aimed at will remember whose work it was.',
  },
  // The one class whose `{actor}` is the mortal it was done *to* (THR-1429). It is
  // badge-tier by construction, so this card is only ever reached by opening the badge
  // — never as an interrupt — and it says what is now on them rather than what they did.
  afflicted: {
    title: 'Something Is On Them',
    opening: '{actor} carries something they did not ask for.',
    consequence: 'It sits on them until it wears off or someone lifts it. Their sheet says what it is, and whether they know whose doing it was.',
  },
  // The plotter is never named (THR-1430): the god is told that harm is coming and
  // not from whom, because finding that out is what the god's own verbs are for.
  peril: {
    title: 'Someone Means Them Harm',
    opening: 'Someone means {actor} harm, and has gone past talking about it.',
    consequence: 'There is a little time and not much of it. Whatever is going to be done for them has to be done now.',
  },
};

/** Fill a template line. Unknown placeholders render as their bare key, never as `undefined`. */
export function renderMomentLine(line: string, vars: MomentCardVars): string {
  return line.replace(/\{(actor|undertaking|band|lost)\}/g, (_m, key: keyof MomentCardVars) => {
    const value = vars[key];
    return value && value.length > 0 ? value : key;
  });
}

/** The template for a record's class, honouring the named-loss complication. */
export function selectMomentCardTemplate(
  momentClass: UndertakingMomentClass,
  lostCastName?: string,
): MomentCardTemplate {
  if (momentClass === 'complication' && lostCastName) return MOMENT_COMPLICATION_WITH_LOSS;
  return MOMENT_CARD_CONTENT[momentClass];
}

// ─── The action slot ────────────────────────────────────────────────

/**
 * The two divine verbs the card hosts (review S5 — the god's v1 on-ramp), with
 * the two-beat labels Law 48 requires for an essence spend: stage, then commit.
 * Faces read like spells — imperative verb + noun — per Doctrine v2.
 */
export const MOMENT_DIVINE_ACTIONS = [
  { templateId: 'action.undertaking.inspire', verb: 'inspire', label: 'Inspire the Work', confirm: 'Let it be so' },
  { templateId: 'action.undertaking.sabotage', verb: 'sabotage', label: 'Sow Doubt', confirm: 'Let it be so' },
] as const;

export type MomentDivineVerb = (typeof MOMENT_DIVINE_ACTIONS)[number]['verb'];

/** The one line the card says about the sim while it is up (Law 52 — every auto-pause names its cause). */
export const MOMENT_CARD_PAUSE_NOTE = 'Time holds while you read this.';
