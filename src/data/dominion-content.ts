/**
 * Dominion — content and tuning (THR-1748).
 *
 * Every number the Dominion read and its consumers use, with the decision ticket
 * that settled it, plus the band words, the band lines (THR-1766, fixed) and the
 * chronicle templates. Engine code imports from here; nothing in this file runs.
 *
 * Plan: Docs/plans/2026-10-11-thr-1748-dominion-core.md § Constants table.
 */

import type { SphereName } from '../types/index';

// ─── Bands ───────────────────────────────────────────────────────────

/** How much a world object is the god's, worst to best. */
export const DOMINION_BANDS = ['hostile', 'foreign', 'touched', 'held', 'sovereign'] as const;
export type DominionBand = typeof DOMINION_BANDS[number];

/** Band order index (hostile 0 … sovereign 4) — for "at least Touched" tests. */
export const DOMINION_BAND_RANK: Readonly<Record<DominionBand, number>> = {
  hostile: 0, foreign: 1, touched: 2, held: 3, sovereign: 4,
};

/** Hostile below this value (THR-1760). */
export const DOMINION_BAND_FOREIGN_MIN = -1.5;
/** THR-1760. */
export const DOMINION_BAND_TOUCHED_MIN = 0.5;
/** THR-1760. */
export const DOMINION_BAND_HELD_MIN = 1.5;
/** THR-1760. */
export const DOMINION_BAND_SOVEREIGN_MIN = 3.0;

/** The band a read falls back to when an input is missing — par for every consumer. */
export const DOMINION_PAR_BAND: DominionBand = 'foreign';

// ─── The match ───────────────────────────────────────────────────────

/**
 * How hard a sphere's opposite counts against it in the match (THR-1760; the pair
 * strengths 5/5, 4/5, 3/5, 2/5 from the comment at `cosmology.ts` SPHERE_OPPOSITES,
 * § Decided 11 — `cosmology.ts` is not edited).
 */
export const DOMINION_OPPOSITION_WEIGHT: Readonly<Record<SphereName, number>> = {
  chaos: 1.0, order: 1.0,
  light: 1.0, darkness: 1.0,
  life: 0.8, entropy: 0.8,
  force: 0.6, mind: 0.6,
  energy: 0.4, spirit: 0.4,
  matter: 0.4, time: 0.4,
};

/** The god's power factor is clamped here, on the band read only (THR-1765). */
export const DOMINION_POWER_CAP = 2.0;
/** Power baseline when `dominionPowerBaseline` is missing or 0 (primary 2 + secondary 1). */
export const DOMINION_POWER_BASELINE_FALLBACK = 3;

// ─── What the band buys (THR-1761) ───────────────────────────────────

/** God-card price multiplier on the tier-scaled cost. */
export const DOMINION_COST_MULTIPLIER: Readonly<Record<DominionBand, number>> = {
  hostile: 1.5, foreign: 1, touched: 0.9, held: 0.8, sovereign: 0.75,
};
/** The price never drops below this share of the tier-scaled cost (§ Decided 10). */
export const DOMINION_COST_FLOOR_SHARE = 0.5;

/** Additive resolution `sphereFactor` for a player cast on a target in this band. */
export const DOMINION_SPHERE_FACTOR: Readonly<Record<DominionBand, number>> = {
  hostile: -0.10, foreign: 0, touched: 0.03, held: 0.06, sovereign: 0.10,
};
/** The documented `ResolutionInput.sphereFactor` range a band factor is clamped to. */
export const DOMINION_SPHERE_FACTOR_MIN = -0.10;
export const DOMINION_SPHERE_FACTOR_MAX = 0.2;

/**
 * Essence a thread yields a tick, by influence tier 0–4. Tiers 1–4 are THR-1761
 * (Model B); tier 0 keeps today's flat 0.1 (§ Decided 12).
 */
export const ESSENCE_PER_THREAD_BY_TIER: readonly number[] = [0.1, 0.15, 0.30, 0.45, 0.60];
/** Thread yield multiplier by the band of the mortal (or place) the thread binds. */
export const DOMINION_THREAD_YIELD_MULTIPLIER: Readonly<Record<DominionBand, number>> = {
  hostile: 0.5, foreign: 1, touched: 1.1, held: 1.25, sovereign: 1.5,
};
/** Typed-source income multiplier by the band of the host place. */
export const DOMINION_SOURCE_INCOME_MULTIPLIER: Readonly<Record<DominionBand, number>> = {
  hostile: 0, foreign: 1, touched: 1.1, held: 1.25, sovereign: 1.5,
};

/**
 * Cost and odds read the band only when true. THR-1750 flips it in the PR that
 * ships the card chip that explains the price (§ Decided 13). Yield and income are
 * live regardless.
 */
export const DOMINION_PRICES_LIVE = false;

// ─── How the frontier moves (THR-1762, THR-1764) ─────────────────────

/** The card that holds a place for the god — its id keeps the `hex.` name (§ Decided 15). */
export const DOMINION_CLAIM_TEMPLATE_ID = 'hex.claim_dominion';
/** The card that breaks the opposing pole of a place. */
export const DOMINION_SHIFT_TEMPLATE_ID = 'hex.shift_dominion';

/** Total pressure a Claim pushes a tick, split across the bought vector by points. */
export const DOMINION_CLAIM_PRESSURE_PER_TICK = 0.03;
/** Claim upkeep a tick, charged from the god's primary sphere. */
export const DOMINION_CLAIM_UPKEEP_PER_TICK = 0.3;
/** Shift Dominion's one-shot push of the bought sphere whose opposite weighs most there. */
export const DOMINION_BREAK_PRESSURE = 6;
/** The seat's free push a tick, split by points. */
export const DOMINION_SEAT_PRESSURE_PER_TICK = 0.03;
/** A threaded mortal's push a tick where they stand, by influence tier 0–4 (tier 0 carries nothing). */
export const DOMINION_THREAD_CARRY_PER_TICK: readonly number[] = [0, 0.005, 0.01, 0.015, 0.02];
/** All carriers in one place together push at most this a tick. */
export const DOMINION_CARRY_CAP_PER_PLACE = 0.03;
/** A mortal bearing a bestowed gift carries as if one tier higher (THR-1764). */
export const DOMINION_BESTOW_CARRY_TIER_STEP = 1;
/** An anointed faction's held towns tend the god's ground at this band or better (THR-1764). */
export const DOMINION_ANOINTED_TENDS_MIN_BAND: DominionBand = 'touched';

// ─── The opposing dominion (THR-1763) ────────────────────────────────

/** Progress an untended place loses a tick in each bought sphere above its seeded score. */
export const DOMINION_UNTENDED_DECAY_PER_TICK = 0.01;
/** One raid landing a day per this many of the god's Touched-or-better places. */
export const DOMINION_RAID_PLACES_PER_DAILY_BURST = 10;
/** Untended turf is drawn this many times as often as tended turf when a raid picks a place. */
export const DOMINION_RAID_UNTENDED_WEIGHT = 3;
/** A rival push on a tended place is reduced by this much — one raid burst (§ Decided 3). */
export const DOMINION_TENDED_RAID_ABSORB = 4;
/** The seat never reads below this band; the clamp restores it (expected never to fire). */
export const DOMINION_SEAT_FLOOR_BAND: DominionBand = 'touched';

// ─── The god's own power (THR-1765) ──────────────────────────────────

/** Essence earned through a bought sphere: each mark crossed attunes the god to it. */
export const DOMINION_ATTUNEMENT_MARKS: readonly number[] = [20, 60, 150, 300, 600, 1000, 1500, 2100, 2800];
/** Progress pushed into the god's score in that sphere at each mark. */
export const ATTUNEMENT_SPHERE_PROGRESS = 1;

// ─── Words (Law 13: a word, never a number) ──────────────────────────

/** The band words the player reads (THR-1745). */
export const DOMINION_BAND_WORDS: Readonly<Record<DominionBand, string>> = {
  sovereign: 'Sovereign',
  held: 'Held',
  touched: 'Touched',
  foreign: 'Foreign',
  hostile: 'Hostile',
};

/** One line per band for sheets and the place line (THR-1766, fixed). */
export const DOMINION_BAND_LINES: Readonly<Record<DominionBand, string>> = {
  sovereign: 'Wholly yours. Your works come easiest here.',
  held: 'Yours, and holding. Cheaper works, richer threads.',
  touched: 'Your mark is on it. A little cheaper.',
  foreign: 'Neither yours nor set against you.',
  hostile: 'Turned against you. Your works cost dearly.',
};

// ─── Chronicle (coalesced to one drop line a day, Law 49) ────────────

/** Names listed in the coalesced drop line before "and others". */
export const DOMINION_CHRONICLE_MAX_NAMES = 3;
/** Chronicle significance — a quiet feed line, never a toast or an interrupt. */
export const DOMINION_CHRONICLE_SIGNIFICANCE = 0.4;

export const DOMINION_CHRONICLE_TEMPLATES = {
  dropUntended: '{place} has slipped from {from} to {to}. No one tends it.',
  dropRaid: "{rival}'s hand has pressed on {place}. It is {to} now.",
  dropMany: '{n} of your places slipped today: {list}.',
  rise: '{place} is {to} now.',
  power: 'Your hold on the {sphereWords} deepens.',
} as const;

/** Bands whose rise earns a chronicle line — Touched churn stays silent (PC-5). */
export const DOMINION_RISE_LINE_BANDS: readonly DominionBand[] = ['held', 'sovereign'];

/**
 * Plain sphere words for the power line ("Your hold on the green deepens."). Short
 * nouns in the register of the sphere vocabulary; no new lexicon.
 */
export const DOMINION_SPHERE_WORDS: Readonly<Record<SphereName, string>> = {
  force: 'clash of strength',
  matter: 'stone and the made thing',
  energy: 'quickening fire',
  life: 'green',
  mind: 'thought',
  spirit: 'unseen',
  time: 'long years',
  entropy: 'falling-away',
  chaos: 'wild',
  order: 'ordered world',
  light: 'light',
  darkness: 'dark',
};
