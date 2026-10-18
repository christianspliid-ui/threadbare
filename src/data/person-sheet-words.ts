/**
 * The person page's words (THR-1909, Inspector S2a — plan
 * `Docs/plans/2026-10-14-thr-1876-the-inspector.md` § D7.1).
 *
 * Words at the source (UI Laws 13/14): every label, sentence and ladder the person
 * rows say lives here, and the retiring profile tabs read the same copies until S4
 * deletes them — one wording, two readers, no drift (Law 27).
 */
import type { CohesionState } from '../engine/groups/groupQueries';

/** Section labels of the person page, sentence case (THR-1833 label rule). */
export const PERSON_ROW_LABELS = {
  fate: 'Fate',
  storySoFar: 'The story so far',
  revealedNotices: 'Word of them',
  underYourHand: 'Under your hand',
  intention: 'On their mind',
  currentWork: 'Their work',
  leadingAmbition: 'What they want most',
  whoTheyAre: 'Who they are',
  allegiance: 'Allegiance',
  nature: 'Nature',
  core: 'Core',
  personality: 'Personality',
  reputation: 'Reputation',
  words: 'Words',
  origin: 'Origin',
  domains: 'Domains',
  conditions: 'Conditions',
  bestowedPowers: 'Bestowed powers',
  slots: 'What they carry',
  knows: 'Knows',
  inactive: 'Inactive',
  disposition: 'Disposition',
  theWork: 'The work',
  designs: 'Designs',
  ambitions: 'Ambitions',
  arcSoFar: 'The arc so far',
  theirStory: 'Their story',
  timeline: 'Timeline',
  fullAccount: 'Full account',
  interactionRecord: 'Interaction record',
  completedAmbitions: 'Completed ambitions',
  intelligence: 'Intelligence',
  chapters: 'Chapters',
} as const;

/** Facts-row left words (the `panel` shape's `left`). */
export const PERSON_FACT_WORDS = {
  archetype: 'Archetype',
  calling: 'Calling',
  means: 'Means',
  godMark: "The god's mark",
  rite: 'Rite',
  knowsTheWayTo: 'Knows the way to',
  keeps: 'Keeps',
  keepsFor: 'For',
  grip: 'Grip',
  rank: 'Rank',
  standingWith: 'Standing with {faction}',
  natureFirst: 'Most of all',
  natureNext: 'Also',
  reputation: 'Reputation',
  strategy: 'Strategy',
  becoming: 'Becoming',
  origin: 'Born to it',
  mark: 'Marked by',
  balanced: 'Balanced',
  primaryAmbition: 'Leading ambition',
  secondaryAmbition: 'Ambition',
  reach: 'Reach',
  work: 'Work',
  control: 'Holds',
  spellKind: 'Spell',
} as const;

/** The empty and gated lines a row says instead of going blank (Law 4). */
export const PERSON_EMPTY_LINES = {
  natureHidden: "You haven't observed {name} closely enough to read their character.",
  reputationUnheard: "No one has spoken of {name}'s reputation to you.",
  originHidden: "The story of {name}'s origins remains unknown to you.",
  storyTooThin: "You sense there is more to {name}'s story, but the threads between you are too thin to read it.",
  noWork: 'No long work under way.',
  ambitionsHidden: "You don't yet know what drives {name}.",
  arcEmpty: 'Nothing yet worth the telling.',
  completedNone: '{name} has yet to fulfill an ambition.',
  completedHidden: "You don't yet know what {name} has accomplished.",
  chaptersNone: 'No chapter has named them yet.',
} as const;

/**
 * Company cohesion as a sentence (THR-74) — never `Cohesion: 0.62` (the raw number
 * lives in the DebugPanel Companies tab). Moved from `OverviewTab.tsx`.
 */
export const COHESION_SENTENCE: Record<CohesionState, string> = {
  bound: 'Their bond holds fast — they move as one.',
  holding: 'They hold together, for now.',
  frayed: 'The bonds between them are beginning to fray.',
  breaking: 'They are on the verge of parting ways.',
};

/**
 * Standing rivalries as one sentence (THR-731). Never "Rivals: 2" and never the `since`
 * tick. Beyond two names the list stops naming and counts *in words*. Moved from
 * `OverviewTab.tsx`.
 */
export function rivalsSentence(rivals: readonly string[]): string {
  if (rivals.length === 1) return `There is blood between them and ${rivals[0]}.`;
  if (rivals.length === 2) return `There is blood between them and both ${rivals[0]} and ${rivals[1]}.`;
  return `There is blood between them and ${rivals[0]}, ${rivals[1]}, and others besides.`;
}

/** Cooperation strategy keys as the words the Bonds tab shows (moved from `BondsTab.tsx`). */
export const DISPOSITION_LABEL_MAP: Record<string, string> = {
  'tit-for-tat': 'Repays in kind',
  'grudger': 'Forgives slowly',
  'pavlov': 'Learns from pain',
  'always-cooperate': 'Trusting soul',
  'always-defect': 'Looks out for themselves',
};

/** Locked backstory strata (moved from `ChronicleTab.tsx`). */
export const LOCKED_STRATUM_TEXT: Record<2 | 3 | 4, string> = {
  2: 'There are stories {name} shares only with those who have proven their devotion.',
  3: 'The fears and contradictions within {name} are visible only to a true champion of the divine.',
  4: 'Only when {name} becomes an aspect of the divine can the full truth be read in their threads.',
};

/** A strategic history outcome, worded (the Designs row; was a ✓ / ✕ glyph). */
export const DESIGN_OUTCOME_WORD: Record<'completed' | 'failed' | 'stalled', string> = {
  completed: 'finished',
  failed: 'failed',
  stalled: 'stalled',
};

/** An intelligence record's reliability, worded. */
export const RELIABILITY_WORD: Record<'reliable' | 'uncertain' | 'dubious', string> = {
  reliable: 'Reliable',
  uncertain: 'Uncertain',
  dubious: 'Dubious',
};

/** A chapter still being told (was "active · step N"). */
export const CHAPTER_UNDER_WAY = 'under way';

/** `{name}` substitution for the lines above. */
export function personLine(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => values[key] ?? m);
}
