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

/** The god's name when the identity is unreadable. */
export const TWILIGHT_GOD_FALLBACK = 'the god';

function capitalizeFirst(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

function article(word: string): 'a' | 'an' {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}
