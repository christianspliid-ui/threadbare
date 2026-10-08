/**
 * Buy your spheres — tunables (THR-1749).
 *
 * At Remembrance the god pours SPHERE_POINT_BUDGET points across the eight
 * Creation spheres (never more than SPHERE_POINT_CAP in one, never both poles
 * of an opposed pair). The bought vector is the god's identity for the run;
 * the two largest buys are its derived primary / secondary.
 *
 * Plan: Docs/plans/2026-10-06-thr-1749-buy-your-spheres.md
 */

/** Points every god buys at Remembrance. */
export const SPHERE_POINT_BUDGET = 5;

/** Most points in one sphere — with a budget of 5 this forces at least two spheres. */
export const SPHERE_POINT_CAP = 3;

/** A hunger's first sphere in its preset buy. */
export const HUNGER_PRESET_PRIMARY_POINTS = 3;

/** A hunger's second sphere in its preset buy. */
export const HUNGER_PRESET_SECONDARY_POINTS = 2;

/**
 * Income share every one of the twelve spheres keeps regardless of points —
 * the "never zero" floor. The remainder (1 − 12 × share) is shared in
 * proportion to the bought points. 12 × share must stay < 1 (guarded by a test).
 * 0.04 matches the pre-THR-1749 share of an unchosen sphere.
 */
export const UNBOUGHT_SPHERE_INCOME_SHARE = 0.04;

/**
 * Shows the spheres sub-step in the Remembrance Transformation beat. `false`
 * passes the hunger's preset straight through (the plan's kill-criteria lever).
 */
export const REMEMBRANCE_SPHERE_BUY_ENABLED = true;

// ─── Buy-screen copy (plain register; no numbers, no raw keys — Laws 13/14) ──

/** One line per Creation sphere, shown under each pole on the buy rows. */
export const SPHERE_BUY_LINES: Record<
  'force' | 'matter' | 'energy' | 'life' | 'mind' | 'spirit' | 'time' | 'entropy',
  string
> = {
  force: 'Strength, struggle, the push that moves the world',
  matter: 'Stone and craft, the things that last',
  energy: 'Fire, storm and swiftness',
  life: 'Growth, healing and the hunger to live',
  mind: 'Thought, knowing and the will to command',
  spirit: 'Faith, dreams and what lingers after death',
  time: 'Memory, patience and what is fated',
  entropy: 'Decay, endings and the bargains made with them',
};

/** Level words for 1–3 points in one sphere, read as "a current of Mind". */
export const SPHERE_LEVEL_WORDS: readonly string[] = ['', 'a trace of', 'a current of', 'a flood of'];

/** Band for the points not yet poured, read as "Left to pour: some". */
export function sphereLeftToPourWord(remaining: number): string {
  if (remaining >= 5) return 'all of you';
  if (remaining >= 3) return 'most of you';
  if (remaining === 2) return 'some';
  if (remaining === 1) return 'a little';
  return 'nothing';
}

/** The spheres sub-step's words. */
export const REMEMBRANCE_SPHERE_COPY = {
  prompt: 'What are you made of? Pour yourself into the spheres.',
  leftToPour: 'Left to pour:',
  neither: 'neither',
  continue: 'Continue',
  continueBlocked: 'Pour all of yourself before you go on.',
  overspend: 'Not enough of you left. Take some back from another sphere.',
  /** `{left}` / `{right}` are sphere display names. */
  pairCaption: '{left} and {right} pull against each other. You can hold only one.',
  preset: 'As my hunger shaped me',
} as const;

/** Reveal clause for a third / fourth bought sphere: "Life stirs beneath." / "Life and Time stir beneath." */
export const SPHERE_REVEAL_STIR_CLAUSE = { one: '{spheres} stirs beneath.', many: '{spheres} stir beneath.' } as const;
