/**
 * THR-1813 — the account record's constants and words (slice 1).
 *
 * Plan: `Docs/plans/2026-10-14-thr-1813-the-world-remembers.md` § Constants table
 * and § Player-facing text. Christian's ruling (THR-1773, chat 2026-10-11): the
 * world remembers and the choices widen; the god never grows stronger.
 */
import type { EchoDefinition } from '../types/echo';

// ─── Storage ─────────────────────────────────────────────────────────

/** The one storage key (Decided 9). */
export const ACCOUNT_STORAGE_KEY = 'threadbare.account.v1';
/** Where an unreadable record is kept rather than overwritten (fail-soft row). */
export const ACCOUNT_UNREADABLE_KEY = `${ACCOUNT_STORAGE_KEY}.unreadable`;
/** Record shape version; `migrateAccount` reads it. */
export const ACCOUNT_VERSION = 1;

// ─── The next world ──────────────────────────────────────────────────

/** Derives the next world's seed from the last (Decided 10). */
export const ACCOUNT_SEED_PRIME = 70001;
/** Live map echoes seeded into one world (THR-1773; slice 2 reads it). */
export const MAX_SEEDED_ECHOES = 6;
/** How far each run tilts the World-Soul toward the god's earned spheres (THR-1773). */
export const FUNDAMENT_BLEND_PER_RUN = 0.1;
/** How far it relaxes back toward even each run (THR-1773). */
export const FUNDAMENT_REVERT = 0.05;
/**
 * How strongly the account's tilt bends the next world's cosmology profile
 * (Decided 8): each sphere is multiplied by `1 + gain × (12 × weight − 1)`, so an
 * even fundament multiplies by 1.
 */
export const WORLD_TILT_GAIN = 1;

// ─── Echoes stand in the new world (THR-1843, slice 2) ───────────────

/**
 * Mean lift per echo sphere per imprint step (Decided 1). Sphere scores are whole
 * numbers (the triangle scale neglect walks down a point at a time), so a step
 * deals `step × sphere count` whole points round-robin to the least-lifted echo
 * sphere, primary first: two spheres take one point a step between them.
 */
export const MONUMENT_IMPRINT_STEP = 0.5;
/** Most mean lift a monument may add (measured: opposed → Hostile within 6 in 8 of 9 cells). */
export const MONUMENT_IMPRINT_MAX = 6;
/** Target band for a kin god by memory word (THR-1773); `almost gone` lifts nothing. */
export const MONUMENT_KIN_BANDS = { stillWarm: 'held', fading: 'touched' } as const;
/** Target band for an opposed god at any memory. */
export const MONUMENT_OPPOSED_BAND = 'hostile' as const;
/** Lift on the heir's echo-sphere scores, × the echo's strength (1 − degradation), rounded. */
export const LEGACY_SPHERE_LIFT = 2;
/** The Legacy hydration stream (`hydrateToTier`'s draws only). */
export const ECHO_SEEDING_PRIME = 70003;
/** What an echo-made node carries in `notableOrigin` / `origin` (the heir, the kin tie). */
export const ECHO_ORIGIN = 'echo';

/** The chronicle's group for the old worlds' marks (Before you woke). */
export const ECHO_CHRONICLE_TITLE = 'Earlier worlds';

/** One line per seeded echo (plan § Content › Words); `{name}` and the place or heir link. */
export const ECHO_CHRONICLE_LINES = {
  monument: ['', ' still stands near ', '.'],
  legacy: ['', ' lives on in ', '.'],
  relic: ['', ' lies somewhere near ', ', unclaimed.'],
} as const;

/** The heir's sheet line under their name. */
export const echoLineageLine = (name: string): string => `Of the line of ${name}`;

// ─── Unlocks ─────────────────────────────────────────────────────────

/** Run 1's awake hungers, one per court shape (THR-1773). */
export const RUN_ONE_AWAKE_HUNGERS: readonly string[] = ['gather', 'witness', 'reclaim', 'sever'];
/** Hungers offered to wake each run (THR-1773). */
export const STIRRING_HUNGER_COUNT = 2;
/** Cards unsealed per run (THR-1773; the draw lands with slice 3). */
export const ACCOUNT_CARD_UNLOCKS_PER_RUN = 2;
/** Unseal weight for the god's primary sphere (slice 3). */
export const ACCOUNT_UNSEAL_PRIMARY_WEIGHT = 3;
/** Unseal weight for the god's secondary sphere (slice 3). */
export const ACCOUNT_UNSEAL_SECONDARY_WEIGHT = 2;
/** The unseal draw's stream (slice 3). */
export const ACCOUNT_UNSEAL_PRIME = 70007;

// ─── Memory words ────────────────────────────────────────────────────

/** still warm / fading / almost gone (0.9 = `ECHO_FADE_THRESHOLD`). */
export const MEMORY_WORD_THRESHOLDS: readonly [number, number, number] = [0.3, 0.6, 0.9];

/** The memory word for an echo's degradation; `null` once it has faded. */
export function memoryWord(degradation: number): 'still warm' | 'fading' | 'almost gone' | null {
  const [warm, fading, gone] = MEMORY_WORD_THRESHOLDS;
  if (degradation < warm) return 'still warm';
  if (degradation < fading) return 'fading';
  if (degradation < gone) return 'almost gone';
  return null;
}

// ─── One name everywhere (PC-6) ──────────────────────────────────────

/**
 * The one formatter for an echo's name: *The Long Barrow*, *the line of Maren
 * Ashfold*, *the Hollow Bell*. Every surface that names an echo goes through it.
 */
export function echoDisplayName(def: Pick<EchoDefinition, 'echoType' | 'name'>): string {
  const name = def.name?.trim() || 'a nameless thing';
  if (def.echoType === 'legacy') return `the line of ${name}`;
  return name;
}

/** Joins names as prose: "A", "A and B", "A, B and C". */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// ─── Harvest words (slice 1) ─────────────────────────────────────────

export const ACCOUNT_WORDS = {
  harvestWakeButton: 'Wake in a new world',
  /** Leads the list of divine echoes; names follow from `echoDisplayName`. */
  harvestLeavesBehind: (names: readonly string[]) => `Your age leaves behind: ${joinNames(names)}.`,
  harvestLeavesLittle: 'Your age leaves little the next world will remember.',
  /** The Advanced path: its world was not shaped by the record, so its run is not carried. */
  harvestNotCarried: 'This world was set up by hand, so the next world will not remember it.',
  harvestSaveFailed:
    "This world's memory could not be kept on this device. The next world will wake as if for the first time.",
  remembranceUnreadable:
    'The memory of earlier worlds could not be read on this device. This world wakes as if for the first time.',
} as const;
