/**
 * How each doom archetype is named and shown to the player (THR-1774).
 *
 * One table per fact, read by every surface that tells it:
 * - the name — the wake line, the stage pop-up, the doom bar label, the
 *   `doom.<archetype>` tooltip (the Chronicle volume title uses the same words);
 * - the sphere the doom presses — the doom bar sigil and the tooltip's last
 *   sentence. `doomArchetypePresentation.test.ts` holds it equal to the spheres the
 *   engine's doom cards actually carry (`getDoomCardSpheres`), so the sigil can
 *   never contradict the cards (complaint class PC-6).
 */
import type { DoomClockArchetype } from '../types/doomClock';
import type { SphereName } from '../types/index';

/** The rulebook §8 names, word for word. */
export const DOOM_ARCHETYPE_DISPLAY_NAMES: Readonly<Record<DoomClockArchetype, string>> = {
  breach: 'Breach',
  convergence: 'Convergence',
  changing: 'Changing',
  sundering: 'Sundering',
  failing: 'Failing',
  ascension: 'Ascension',
  reckoning: 'Reckoning',
};

/**
 * The sphere each doom's cards press. Breach, Sundering and Failing are systemic —
 * their cards carry no `sphere:` — so they have no entry and show a glyph instead.
 */
export const DOOM_ARCHETYPE_SPHERE: Readonly<Partial<Record<DoomClockArchetype, SphereName>>> = {
  convergence: 'force',
  changing: 'chaos',
  ascension: 'spirit',
  reckoning: 'mind',
};

/** Each doom's own glyph — shown only when it has no `DOOM_ARCHETYPE_SPHERE` entry. */
export const DOOM_ARCHETYPE_GLYPHS: Readonly<Record<DoomClockArchetype, string>> = {
  breach: '◈',
  convergence: '⬡',
  changing: '∿',
  sundering: '⚡',
  failing: '◇',
  ascension: '✦',
  reckoning: '⚔',
};

/** Glyph for an archetype missing from the table (fail-soft, Law 4). */
export const DOOM_ARCHETYPE_FALLBACK_GLYPH = '◈';

/**
 * `doom.<archetype>` tooltip bodies (Law 18: ≤ 200 characters). Each second clause
 * is backed by a value in that archetype's identity matrix
 * (`doom-identity-matrices.ts`) — re-check the clause if the matrix is retuned.
 * The last sentence explains the doom bar's sigil (or glyph).
 */
export const DOOM_ARCHETYPE_TOOLTIPS: Readonly<Record<DoomClockArchetype, string>> = {
  breach: 'An outside force breaking through reality. The edges of the world suffer first, and rivals grow bold. It presses no single sphere.',
  convergence: 'All forces drawn to a single point. The heart of the world prospers, and people are drawn together. It presses {{sphere.force}}.',
  changing: 'A new cosmic order replacing the old. Old loyalties are rewritten, and the world\'s edges flourish strangely. It presses {{sphere.chaos}}.',
  sundering: 'The world itself breaking apart. No ground is safe, and bonds shatter with the land. It presses no single sphere.',
  failing: 'A core force of creation weakening. Cities cannot sustain themselves, and none can spare strength for war. It presses no single sphere.',
  ascension: 'Something approaching godhood. People gather around a rising power, and fighting it no longer works. It presses {{sphere.spirit}}.',
  reckoning: 'Past debts coming due. Unrest grows where blood was spilt, and old debts and betrayals surface. It presses {{sphere.mind}}.',
};

/** The naming sentence appended to the authored wake line (`{name}` → display name). */
export const DOOM_WAKE_NAMING_TEMPLATE = 'The Age of the {name} has begun.';

const warnedMissing = new Set<string>();

/**
 * The player-facing name of a doom archetype. An unknown key falls back to the
 * key capitalised and warns once — never the raw lowercase key (Law 14).
 */
export function doomArchetypeDisplayName(archetype: string): string {
  const name = (DOOM_ARCHETYPE_DISPLAY_NAMES as Record<string, string>)[archetype];
  if (name) return name;
  if (!warnedMissing.has(archetype)) {
    warnedMissing.add(archetype);
    console.warn(`[doom-archetype-presentation] no display name for doom archetype "${archetype}"`);
  }
  return archetype.length > 0 ? archetype[0].toUpperCase() + archetype.slice(1) : 'Doom';
}

/** The glyph for an archetype, falling back to `DOOM_ARCHETYPE_FALLBACK_GLYPH`. */
export function doomArchetypeGlyph(archetype: string): string {
  return (DOOM_ARCHETYPE_GLYPHS as Record<string, string>)[archetype] ?? DOOM_ARCHETYPE_FALLBACK_GLYPH;
}

/** The sentence that names a doom when it wakes. */
export function doomWakeNamingSentence(archetype: string): string {
  return DOOM_WAKE_NAMING_TEMPLATE.replace('{name}', doomArchetypeDisplayName(archetype));
}
