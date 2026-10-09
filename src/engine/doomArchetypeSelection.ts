/**
 * Which doom a world gets (THR-1774).
 *
 * Every world draws its doom when it is made, at even odds across the seven
 * archetypes, from the world's seed and the god's hunger. The god's identity is
 * only the RNG key — it gives no doom an edge, it reshuffles which one a seed lands
 * on — so a draw is deterministic per (seed, god) (NFP #3). The weights vector is
 * the seam a later World-Soul tilt edits (rulebook §1: the World-Soul "seeds the
 * next world's generation"); it is not decided here.
 *
 * Plan: `Docs/plans/2026-10-08-thr-1774-doom-archetype-draw.md`.
 */
import { DOOM_CLOCK_ARCHETYPES, type DoomClockArchetype } from '../types/doomClock';
import { hashString, mulberry32 } from '../lib/prng';

/** Separates the doom draw's PRNG stream from every other world-generation stream. */
export const DOOM_ARCHETYPE_DRAW_SEED_OFFSET = 194087;

/** Relative odds of each doom. Even by default — the seam a World-Soul tilt edits. */
export const DOOM_ARCHETYPE_DRAW_WEIGHTS: Readonly<Record<DoomClockArchetype, number>> = {
  breach: 1,
  convergence: 1,
  changing: 1,
  sundering: 1,
  failing: 1,
  ascension: 1,
  reckoning: 1,
};

/** Used only when every weight is ≤ 0 (a future tilt bug). */
export const DOOM_ARCHETYPE_FALLBACK: DoomClockArchetype = 'breach';

/** Pins the `?seeded` / `?firstunmet` evidence routes so their worlds stay comparable. */
export const DEV_SHOWCASE_DOOM_ARCHETYPE: DoomClockArchetype = 'breach';

export interface DoomArchetypeDraw {
  archetype: DoomClockArchetype;
  /** `'fallback'` when every weight was ≤ 0. */
  source: 'draw' | 'fallback';
  /** The uniform roll in [0, 1) the pick was made with. */
  roll: number;
  /** The clamped weights the pick was made over. */
  weights: Record<DoomClockArchetype, number>;
}

export function isDoomClockArchetype(value: unknown): value is DoomClockArchetype {
  return typeof value === 'string' && (DOOM_CLOCK_ARCHETYPES as string[]).includes(value);
}

/**
 * Draw a doom archetype for a world. Weighted pick in `DOOM_CLOCK_ARCHETYPES`
 * order; negative weights clamp to 0; all-zero weights fall back to
 * `DOOM_ARCHETYPE_FALLBACK`. An empty or missing key hashes to 0 — still
 * deterministic per seed.
 */
export function selectDoomArchetype(
  seed: number,
  identityKey: string,
  weights: Readonly<Record<DoomClockArchetype, number>> = DOOM_ARCHETYPE_DRAW_WEIGHTS,
): DoomArchetypeDraw {
  const rng = mulberry32(((seed + DOOM_ARCHETYPE_DRAW_SEED_OFFSET) ^ hashString(identityKey ?? '')) | 0);
  const roll = rng();
  const clamped = {} as Record<DoomClockArchetype, number>;
  let total = 0;
  for (const archetype of DOOM_CLOCK_ARCHETYPES) {
    const w = weights[archetype];
    const value = Number.isFinite(w) && w > 0 ? w : 0;
    clamped[archetype] = value;
    total += value;
  }
  if (total <= 0) {
    return { archetype: DOOM_ARCHETYPE_FALLBACK, source: 'fallback', roll, weights: clamped };
  }
  let cursor = roll * total;
  for (const archetype of DOOM_CLOCK_ARCHETYPES) {
    cursor -= clamped[archetype];
    if (cursor < 0) return { archetype, source: 'draw', roll, weights: clamped };
  }
  // Float edge: the roll landed on the total — the last weighted archetype takes it.
  const last = [...DOOM_CLOCK_ARCHETYPES].reverse().find(a => clamped[a] > 0) ?? DOOM_ARCHETYPE_FALLBACK;
  return { archetype: last, source: 'draw', roll, weights: clamped };
}

const warnedDoomParams = new Set<string>();

/**
 * Read the `?doom=<archetype>` review lever from a URL search string. Absent →
 * `undefined`. An invalid value is ignored with one `console.warn` per value (fail-soft) — the
 * App re-reads the URL on every render.
 */
export function parseDoomArchetypeParam(search: string): DoomClockArchetype | undefined {
  const raw = new URLSearchParams(search).get('doom');
  if (raw === null || raw === '') return undefined;
  const value = raw.toLowerCase();
  if (isDoomClockArchetype(value)) return value;
  if (warnedDoomParams.has(raw)) return undefined;
  warnedDoomParams.add(raw);
  console.warn(`[doom] ?doom=${raw} is not a doom archetype (${DOOM_CLOCK_ARCHETYPES.join(', ')}) — ignored`);
  return undefined;
}
