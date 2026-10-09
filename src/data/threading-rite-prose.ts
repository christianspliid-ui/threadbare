/**
 * The Rite of the Thread — player-facing words (THR-1754, threading rite S2).
 *
 * Plan: `Docs/plans/2026-10-06-thr-1644-threading-ceremony.md` § Content pillar
 * and § Player-facing text. Plain register, the meeting's quality bar: real
 * names, real places, and never an empty slot (PC-3) — every `{…}` here has a
 * fallback in the renderer below.
 *
 * Pure: the renderers take plain strings, so the modal, the chronicle and the
 * agent sheet all print the same sentence for the same fact (PC-6).
 */

import type { ReachDomain } from '../types/traits';
import type { BondReception } from './meeting-nudge-constants';

// ─── Pronouns ─────────────────────────────────────────────────────

/** The three pronoun forms the rite's lines use. Unknown gender reads "they". */
export interface RitePronouns {
  readonly they: string;
  readonly They: string;
  readonly them: string;
  /** Verb agreement for "they": "does"/"do", "feels"/"feel" — the `s` suffix or nothing. */
  readonly s: string;
  readonly does: string;
}

export function ritePronouns(gender: unknown): RitePronouns {
  if (gender === 'female') return { they: 'she', They: 'She', them: 'her', s: 's', does: 'does' };
  if (gender === 'male') return { they: 'he', They: 'He', them: 'him', s: 's', does: 'does' };
  return { they: 'they', They: 'They', them: 'them', s: '', does: 'do' };
}

function fill(text: string, name: string, p: RitePronouns, extra: Record<string, string> = {}): string {
  return text
    .replace(/\{name\}/g, name)
    .replace(/\{they\}/g, p.they)
    .replace(/\{They\}/g, p.They)
    .replace(/\{them\}/g, p.them)
    .replace(/\{s\}/g, p.s)
    .replace(/\{does\}/g, p.does)
    .replace(/\{(\w+)\}/g, (match, key: string) => extra[key] ?? match);
}

// ─── Header ───────────────────────────────────────────────────────

export const RITE_HEADER = 'The Rite of the Thread';

const ORDINAL_WORDS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

/** "Your second thread" — past ten, "Your 11th thread". */
export function riteSubtitle(ordinal: number | null | undefined): string {
  if (typeof ordinal !== 'number' || !Number.isFinite(ordinal) || ordinal < 1) return 'Your thread';
  const n = Math.floor(ordinal);
  const word = ORDINAL_WORDS[n - 1];
  if (word) return `Your ${word} thread`;
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
  return `Your ${n}${suffix} thread`;
}

// ─── Openings — one per reach ─────────────────────────────────────

/**
 * The second sentence of the opening, by the mortal's primary reach. The first
 * sentence is always "Your thread finds {name} {where}." — the mortal's real
 * name and real place.
 */
export const RITE_OPENING_BY_REACH: Readonly<Record<ReachDomain, string>> = {
  iron: '{They} {does} not look up from the work. {They} feel{s} it all the same.',
  gold: '{They} stop{s} counting halfway through a sum and cannot find the number again.',
  shadow: '{They} go{es} still, the way a person does who is used to being the one who watches.',
  veil: '{They} feel{s} it before anything happens, the way {they} feel{s} weather in a joint.',
  heart: '{They} look{s} round for whoever just said {their} name. Nobody did.',
  eye: '{They} {does} not startle. {They} stop{s} and wait{s}, the way {they} wait{s} for a witness to finish.',
  stone: '{They} set{s} down what {they} {are} carrying and stand{s} very straight.',
  star: '{They} look{s} up, which is the wrong way, and then down at {their} own hands.',
};

/** Used when the reach is missing or unknown. */
export const RITE_OPENING_FALLBACK = '{They} stop{s} what {they} {are} doing. {They} can tell something has found {them}.';

/** "where they stand" — never an empty slot when the location has no name. */
export const RITE_WHERE_FALLBACK = 'where {they} stand{s}';

/** "Your thread finds Hadrel Vosk in Ketterwell. He does not look up from the work. He feels it all the same." */
export function riteOpeningLine(
  name: string,
  gender: unknown,
  reach: ReachDomain | string | undefined,
  locationName: string | null | undefined,
): string {
  const p = ritePronouns(gender);
  const where = riteWhere(locationName) ?? fill(RITE_WHERE_FALLBACK, name, p, verbExtras(p));
  const second = (reach && RITE_OPENING_BY_REACH[reach as ReachDomain]) || RITE_OPENING_FALLBACK;
  return `Your thread finds ${name} ${where}. ${fill(second, name, p, verbExtras(p))}`;
}

/**
 * "in Ketterwell". A generated wilderness place is named with its hex
 * ("Wilderness (30, 22)") — a coordinate never reaches the player (PC-3), so it
 * reads "out in the wilderness"; any other coordinate-only name falls back.
 */
function riteWhere(locationName: string | null | undefined): string | null {
  const raw = locationName?.trim();
  if (!raw) return null;
  if (/^wilderness\b/i.test(raw)) return 'out in the wilderness';
  if (/\(\s*-?\d+\s*,\s*-?\d+\s*\)/.test(raw)) return null;
  return `in ${raw}`;
}

/**
 * The place word the rite's test prose fills `{agent.location}` with ("Raiders
 * hit {agent.location}…"): the real name, or "the wilderness" for a generated
 * coordinate name or none at all.
 */
export function ritePlaceName(locationName: string | null | undefined): string {
  const raw = locationName?.trim();
  if (!raw || /^wilderness\b/i.test(raw) || /\(\s*-?\d+\s*,\s*-?\d+\s*\)/.test(raw)) return 'the wilderness';
  return raw;
}

/** Agreement for the irregular verbs the openings use ("is"/"are", "goes"/"go", "his"/"their"). */
function verbExtras(p: RitePronouns): Record<string, string> {
  const plural = p.s === '';
  return {
    es: plural ? '' : 'es',
    are: plural ? 'are' : 'is',
    their: p.they === 'she' ? 'her' : p.they === 'he' ? 'his' : 'their',
  };
}

/**
 * The bond test's god voice in a rite. The meeting's per-Hunger lines speak of
 * the *first* soul the god wants to be seen by — false on any later thread — so
 * every rite reads this one instead.
 */
export const RITE_BOND_GOD_VOICE = 'Your thread holds. Now you learn how they take it.';

// ─── The First (D3) ───────────────────────────────────────────────

/** The card route's First line — shown in the rite when the thread names a new First. */
export function riteFirstLine(name: string): string {
  return `No mortal has carried your thread before. ${name} is your First.`;
}

/**
 * The chronicle line when a mortal becomes The First — the meeting's own event
 * text (`GameView` meeting completion), shared so the card route prints it word
 * for word.
 */
export function firstClaimedMessage(name: string): string {
  return `The thread of fate is woven. ${name} has been claimed as The First.`;
}

// ─── The bond result — one per reception ──────────────────────────

/** "Hadrel takes your thread in doubt. He will carry it, and question it." */
export const RITE_RECEPTION_LINES: Readonly<Record<BondReception, string>> = {
  awe: '{name} takes your thread in awe. {They} will carry it as if it might break.',
  devotion: '{name} takes your thread as a gift. {They} will carry it gladly.',
  bargain: '{name} takes your thread as a bargain. {They} will carry it, and expect something back.',
  doubt: '{name} takes your thread in doubt. {They} will carry it, and question it.',
  defiance: '{name} takes your thread in defiance. {They} will carry it, and fight it.',
};

export function riteReceptionLine(name: string, gender: unknown, reception: BondReception): string {
  const p = ritePronouns(gender);
  return fill(RITE_RECEPTION_LINES[reception] ?? RITE_RECEPTION_LINES.bargain, name, p, verbExtras(p));
}

// ─── Buttons ──────────────────────────────────────────────────────

/** D6 — every rite can be waved through. Avoids "Let fate decide" (read as skip, THR-1714). */
export const RITE_BOND_WITHOUT_HAND_LABEL = 'Bond without a hand';
export const RITE_BOND_WITHOUT_HAND_TOOLTIP = 'The bond still forms. Fate alone decides how they take it.';

/** The opening's one primary action, and the result's. */
export const RITE_BEGIN_LABEL = 'Reach for them';
export const RITE_RETURN_LABEL = 'Return to the world';

// ─── Chronicle — one line per rite ────────────────────────────────

/** A rite the player played to the end. */
export function riteChronicleLine(name: string, reception: BondReception): string {
  return `${name} took your thread (${reception}).`;
}

/** *Bond without a hand*, Escape, or a closed window. */
export function riteChronicleNoHandLine(name: string, reception: BondReception): string {
  return `${name} took your thread (${reception}). You bonded without a hand.`;
}

/** More threads at once than the queue holds. */
export function riteChronicleOverflowLine(name: string, reception: BondReception): string {
  return `Too many threads at once: ${name} took your thread without a rite — in ${reception}.`;
}

/** The mortal died or vanished before the rite opened. */
export function riteChronicleMissingLine(name: string): string {
  return `Your thread reached ${name} too late for a rite.`;
}

// ─── The sheet's rite line ────────────────────────────────────────

const SEASON_WORDS = ['spring', 'summer', 'autumn', 'winter'] as const;

/** "Bound in spring, Year 1 — took your thread in doubt." Season and year are 0-based in. */
export function riteSheetLine(season: number, year: number, reception: BondReception | null | undefined): string {
  const seasonWord = SEASON_WORDS[season] ?? 'spring';
  const head = `Bound in ${seasonWord}, Year ${Math.max(0, Math.floor(year)) + 1}`;
  return reception ? `${head} — took your thread in ${reception}.` : `${head}.`;
}
