/**
 * THR-1381 — the words of the end of the age (plan
 * `Docs/plans/2026-10-17-thr-1381-the-end-of-the-age.md` § Content pillar).
 *
 * The split the plan states once: these tables are the authored half (one opening
 * per way an age can end, one line per fate of the First, one line per kind of
 * memory); who and what they name is read from the run's state by
 * `src/engine/twilight.ts`. Nothing here is rolled.
 *
 * Register: game-master narration, facts stated plainly. The screen says "the age
 * ends", "World-Soul" and "remember"; it never puts Twilight, Resonance or Unmaking
 * in a heading (UL Cosmology, the Harvest collision note).
 */
import type { DoomClockArchetype } from '../types/doomClock';
import type { EchoType } from '../types/echo';

// ─── Beat 1 — how the age ended ──────────────────────────────────────

/**
 * One line per doom kind. The title is the kind's last stage name, read from its
 * `src/data/doom/<kind>.json` (`stageNames[4]`), so the two never disagree.
 * `twilightContent.test.ts` fails when a doom file has no row here.
 */
export const DOOM_ENDING_LINES: Readonly<Record<DoomClockArchetype, string>> = {
  ascension: 'Something below the gods climbed to godhood, and the world bent to it.',
  breach: 'A force from outside the world broke through its walls.',
  changing: 'A new order of the heavens replaced the old one.',
  convergence: 'Every power in the world was drawn to one point, and that point gave way.',
  failing: 'One of the forces that made the world gave out.',
  reckoning: 'Every old debt came due at once.',
  sundering: 'The world broke apart along its oldest seams.',
};

/** The doom title when the kind's data is missing (fail-soft row). */
export const DOOM_ENDING_FALLBACK_TITLE = 'The Unmaking';
/** The Mandate's name when its definition is missing (fail-soft row). */
export const MANDATE_FALLBACK_NAME = 'the Mandate';

export const TWILIGHT_WORDS = {
  mandateTitle: (mandateName: string) => `${capitalizeFirst(mandateName)}, fulfilled`,
  mandateLine: (god: string) => `${god} did all the Mandate asked before the end came.`,
  doomClose: (god: string) => `The age of ${god} ends. From here you watch; you cannot act.`,
  mandateClose: (god: string) => `The age of ${god} ends in triumph. From here you watch; you cannot act.`,

  // ─── Beat 2 — the First ───────────────────────────────────────────
  firstAspect: (first: string) => `${first}, your First, stands at the end of the age as your Aspect.`,
  firstLived: (first: string, calling?: string) => calling
    ? `${first}, your First, lived to see the age end, ${article(calling)} ${calling} to the last.`
    : `${first}, your First, lived to see the age end.`,
  firstDied: (first: string) => `${first}, your First, died before the age ended.`,

  // ─── Beat 3 — what the world will remember ────────────────────────
  memoryHeading: 'What the world will remember',
  memorySubline: 'The World-Soul keeps these.',
  /** Shown on the same paths the harvest says the next world will not remember this one. */
  memoryUnkept: "This world's memory will not be kept.",
  continueButton: 'See what the age leaves',
  /** The ceremony's accessible label. */
  label: 'The age ends',

  // ─── Memory lines (beat 3, and the stored `summary`) ──────────────
  memoryDoomScar: (finalStage: string, god: string) => `${finalStage} ended the age of ${god}.`,
  memoryMandateTriumph: (god: string, mandateName: string) => `${god} fulfilled ${mandateName} before the end.`,
  memorySphereDominance: (god: string, sphere: string) => `When the age of ${god} ended, the world leaned most to ${sphere}.`,
  memoryDivine: (god: string, echoType: EchoType, echoName: string): string => {
    if (echoType === 'legacy') return `${god} raised ${echoName} above every other mortal.`;
    if (echoType === 'relic') return `${god}'s chosen carried ${echoName}.`;
    return `${god} held ${echoName} above every other place.`;
  },

  // ─── Chronicle lines (the two retired popups) ─────────────────────
  chronicleDoom: (finalStage: string) => `${finalStage}: the Unmaking begins.`,
  chronicleMandate: (mandateName: string) => `${capitalizeFirst(mandateName)} is fulfilled.`,
} as const;

// ─── THR-2229 — what the god did with its First ──────────────────────
//
// Plan `Docs/plans/2026-11-14-thr-2204-put-the-god-in-the-climax.md` slice 4. Plain
// facts from the thread edge, never a roll: beat 2 adds the Apotheosis line, then the
// Ordeal line, each only when its fact exists; the harvest summary leads with the
// First's ending; the Threads row reads the Return ending's word.

/** The pronouns a line needs, as the mortal's own (`ambitionPronounsFor`). */
export interface FirstPronouns {
  readonly they: string;
  readonly them: string;
  readonly their: string;
}

/** How an Apotheosis read at its end. `turned_away` is the withdrawal pole's success. */
export type ApotheosisResultClass = 'aspect' | 'aspect_at_cost' | 'turned_away' | 'turned_away_at_cost' | 'fell_back';
/** How hard the god leaned on the Ordeal (from the choice's lean). */
export type OrdealHand = 'pour' | 'steady' | 'alone';
export type OrdealOutcomeWord = 'triumph' | 'scraped_through' | 'broken';

export const APOTHEOSIS_RESULT_WORDS: Readonly<Record<ApotheosisResultClass, string>> = {
  aspect: 'became your Aspect',
  aspect_at_cost: 'became your Aspect, at a cost',
  turned_away: 'turned away',
  turned_away_at_cost: 'turned away, at a cost',
  fell_back: 'fell back',
};

export const ORDEAL_OUTCOME_VERBS: Readonly<Record<OrdealOutcomeWord, string>> = {
  triumph: 'triumphed',
  scraped_through: 'scraped through',
  broken: 'broke',
};

/** The Return ending's clause in the harvest summary ("…'s story ended {fact}"). */
export const RETURN_ENDING_FACTS: Readonly<Record<string, (p: FirstPronouns) => string>> = {
  loyal_ascension: () => 'at your side',
  sacrifice: (p) => `in ${p.their} sacrifice`,
  vanishing: (p) => `when ${p.they} ${p.they === 'they' ? 'were' : 'was'} simply gone`,
  transcendence: (p) => `when ${p.they} became one with the land`,
  usurper: (p) => `when ${p.they} turned against you`,
  monster: (p) => `when ${p.they} became a terror`,
};

/**
 * The Threads row's word for a First whose Return ending took them out of the god's
 * hand while the thread stays. Other endings keep the tier word.
 */
export const RETURN_ENDING_THREAD_WORDS: Readonly<Partial<Record<string, string>>> = {
  vanishing: 'Gone',
  transcendence: 'Transcended',
};

export const FIRST_ENDING_WORDS = {
  /** The First's name when the node has none. */
  firstFallback: 'your First',
  apotheosisWithHand: (p: FirstPronouns, result: ApotheosisResultClass) =>
    `At the threshold you spent on ${p.them}, and ${p.they} ${APOTHEOSIS_RESULT_WORDS[result]}.`,
  apotheosisAlone: (first: string, p: FirstPronouns, result: ApotheosisResultClass) =>
    `At the threshold ${first} stood alone, and ${p.they} ${APOTHEOSIS_RESULT_WORDS[result]}.`,
  ordeal: (first: string, p: FirstPronouns, hand: OrdealHand, outcome: OrdealOutcomeWord) => {
    const verb = ORDEAL_OUTCOME_VERBS[outcome];
    if (hand === 'alone') return `At the Ordeal you stepped back, and ${first} ${verb}.`;
    const what = hand === 'pour' ? 'poured yourself into the thread' : 'steadied the thread';
    // The god's hand shows at every band (Law 23): a broken First after a lean is "still".
    return `At the Ordeal you ${what}, and ${outcome === 'broken' ? `still ${p.they}` : first} ${verb}.`;
  },
  /** The harvest's clause when no Return closed the story. */
  endingAspect: () => 'as your Aspect',
  endingDied: (p: FirstPronouns) => `with ${p.their} death`,
  endingUnfinished: () => "in the age's last days",
} as const;

/**
 * The harvest summary (`computeHarvest`). With a First, it leads with the First's
 * ending and keeps the most remembered name second (dropped when it is the First).
 */
export const HARVEST_SUMMARY_WORDS = {
  opening: { triumphant: 'A triumphant age.', somber: 'A somber age.', bittersweet: 'A bittersweet age.' },
  topClause: {
    triumphant: (top: string) => `${top} shone brightest among the echoes`,
    somber: (top: string) => `${top} faded into memory`,
    bittersweet: (top: string) => `${top} left a lasting mark`,
  },
  firstStory: (first: string, fact: string) => `${first}'s story ended ${fact}`,
} as const;

/** The god's name when the identity is unreadable. */
export const TWILIGHT_GOD_FALLBACK = 'the god';

function capitalizeFirst(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

function article(word: string): 'a' | 'an' {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}
