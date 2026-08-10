/**
 * Army words (THR-1023) — the player-facing vocabulary for an army's condition.
 *
 * `ArmyState` is almost entirely raw magnitudes: `headcount: 10000`,
 * `cohesion: 94.15`, `maintenanceCost`, `supply`, `estimatedAttrition`. UI Law 13
 * bars every one of them from a mortal-facing surface, so a surface that wants
 * to say how an army is *doing* reads it through here and renders the word. The
 * numbers stay in the data, the debug Armies tab, and the traces.
 *
 * This follows the precedent `types/army.ts` already set for supply: "the larder
 * scalar behind this is private and never rendered — every surface reads the
 * tier". These tables extend that commitment to size, cohesion and objective.
 *
 * NFP #1 (tunability): plain tables and one threshold list — retune the felt
 *   scale by editing numbers here, not logic.
 * NFP #3 (determinism): pure functions of their inputs; no PRNG, no clock.
 * NFP #4 (fail-soft): every helper takes `unknown` and returns `null` on a
 *   shape it does not recognise, so a malformed army still renders a body.
 */

import type { ArmySizeCategory, ArmySupplyTier } from '../types/army';

/** Player-facing name for an army's size band. */
export const ARMY_SIZE_NAMES: Record<ArmySizeCategory, string> = {
  warband: 'Warband',
  regiment: 'Regiment',
  host: 'Host',
};

/**
 * Player-facing name for the provisioning tier. The engine's own keys
 * (`supplied` / `strained` / `starving`) are already close to English, but they
 * are still internal keys — naming them here keeps Law 14 held at the surface
 * and leaves the wording tunable without touching the engine's vocabulary.
 */
export const ARMY_SUPPLY_WORDS: Record<ArmySupplyTier, string> = {
  supplied: 'Well provisioned',
  strained: 'Short of supply',
  starving: 'Starving',
};

/**
 * Cohesion bands, worst → best, as a share of the army's own ceiling. Each entry
 * is the exclusive upper bound of its band and the word for it; the last band
 * catches everything above the previous bound.
 *
 * Shares rather than absolutes because `cohesionMax` varies by size (a warband
 * peaks at 30, a host at 100) — an absolute 30 is a broken host and a perfect
 * warband, so an absolute scale would describe both wrongly.
 */
export const ARMY_COHESION_BANDS: ReadonlyArray<{ below: number; word: string }> = [
  { below: 0.2, word: 'Coming apart' },
  { below: 0.45, word: 'Badly frayed' },
  { below: 0.7, word: 'Holding together' },
  { below: 0.9, word: 'In good order' },
  { below: Infinity, word: 'Ironbound' },
];

/** Phrasing for each objective type, as a verb phrase completed by the target's name. */
export const ARMY_OBJECTIVE_VERBS: Record<string, string> = {
  raid: 'Raiding',
  conquer: 'Marching to take',
  defend: 'Holding',
  intercept: 'Moving to intercept',
  reinforce_siege: 'Marching to reinforce the siege at',
};

/** Copy for an army with no objective — a supported idle state, not an error. */
export const ARMY_NO_OBJECTIVE_COPY = 'Mustered, with no march ordered yet.';

/**
 * The word for an army's cohesion, or `null` when either figure is missing or
 * the ceiling is not a usable divisor. Never returns a number (Law 13).
 */
export function getArmyCohesionWord(cohesion: unknown, cohesionMax: unknown): string | null {
  if (typeof cohesion !== 'number' || !Number.isFinite(cohesion)) return null;
  if (typeof cohesionMax !== 'number' || !Number.isFinite(cohesionMax) || cohesionMax <= 0) return null;
  const share = cohesion / cohesionMax;
  for (const band of ARMY_COHESION_BANDS) {
    if (share < band.below) return band.word;
  }
  // Unreachable — the last band's bound is Infinity. Kept as a fail-soft floor.
  return ARMY_COHESION_BANDS[ARMY_COHESION_BANDS.length - 1]?.word ?? null;
}

/** The player-facing name for a size value, or `null` if unrecognised. */
export function getArmySizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  return ARMY_SIZE_NAMES[raw as ArmySizeCategory] ?? null;
}

/** The player-facing name for a supply tier, or `null` if unset/unrecognised. */
export function getArmySupplyWord(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  return ARMY_SUPPLY_WORDS[raw as ArmySupplyTier] ?? null;
}

/**
 * A full sentence for what the army is doing, given its objective type and the
 * resolved *name* of its target. Returns `null` for an objective type we have no
 * phrasing for, so the caller falls back rather than printing `reinforce_siege`.
 *
 * The caller resolves `targetNodeId` → name; this stays graph-free and testable.
 */
export function armyObjectiveSentence(
  objectiveType: unknown,
  targetName: string | null,
): string | null {
  if (typeof objectiveType !== 'string') return null;
  const verb = ARMY_OBJECTIVE_VERBS[objectiveType];
  if (!verb) return null;
  // Without a resolvable target the verb phrase would dangle ("Marching to take .")
  return targetName ? `${verb} ${targetName}.` : null;
}
