/**
 * Core personality mechanics (THR-542, slice 1 — Engine foundation).
 *
 * Pure functions implementing the three Core mechanics named in the spec:
 *
 *  - **seed**   — `seedCoreProfile`: draw a per-agent Core baseline at birth.
 *  - **colour** — `colourReachExpression`: tint how a reach act *reads* given
 *                 the agent's Core (same Brave act = courage on a True self,
 *                 swagger on a Proud/False one). Does NOT change competence.
 *  - **bend**   — `coreBendContributions`: under low Quintessence, the Core
 *                 nudges coupled reach axes toward a pole. A nudge, never a cap.
 *
 * Plus `coreEmergentSignal`, a pure threshold read used by the Core tick phase
 * to emit emergence traces.
 *
 * Determinism (NFP #3): `seedCoreProfile` takes a seeded PRNG; everything else
 * is a pure function of its inputs. No `Math.random`.
 *
 * Core ≠ reach ≠ capability: this module reads/produces only `CoreProfile`
 * values and reach *directions*; it never reads or writes capability, and never
 * caps a reach axis (see `coreRegistry.ts`).
 */
import type { ReachDomain } from '../../types/traits';
import type { CoreProfile } from '../../types/coreRegistry';
import { CORE_CONTINUA, CORE_NEUTRAL } from '../../types/coreRegistry';
import { CORE_ORIGIN_VIGNETTES } from '../../data/core-origin-vignettes';
import {
  CORE_SEED_DRAW_COUNT,
  CORE_SEED_DRAW_MAGNITUDE,
  CORE_ORIGIN_VIGNETTE_DRAW_COUNT,
  CORE_EMERGENCE_VIRTUE_THRESHOLD,
  CORE_EMERGENCE_VICE_THRESHOLD,
  CORE_BEND_QUINTESSENCE_THRESHOLD,
  CORE_BEND_MAGNITUDE,
  CORE_COLOUR_SINCERE_THRESHOLD,
  CORE_COLOUR_PROUD_THRESHOLD,
} from './coreConstants';

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Read a continuum's live position, treating absent continuums as neutral. */
export function coreValue(core: CoreProfile | undefined, continuumId: string): number {
  const v = core?.[continuumId];
  return typeof v === 'number' ? clamp01(v) : CORE_NEUTRAL;
}

// ─── Seed ───────────────────────────────────────────────────────────────────

/**
 * Draw a fresh Core baseline. Each continuum is the sum of
 * `CORE_SEED_DRAW_COUNT` uniform draws in `±CORE_SEED_DRAW_MAGNITUDE`, centered
 * on neutral and clamped to [0,1] — a roughly normal spread clustered near 0.5.
 * The clamp is a range clamp, NOT a personality cap.
 */
export function seedCoreProfile(rng: () => number): CoreProfile {
  const profile: CoreProfile = {};
  for (const continuum of CORE_CONTINUA) {
    let sum = 0;
    for (let i = 0; i < CORE_SEED_DRAW_COUNT; i++) {
      sum += (rng() * 2 - 1) * CORE_SEED_DRAW_MAGNITUDE;
    }
    profile[continuum.continuumId] = clamp01(CORE_NEUTRAL + sum);
  }
  return profile;
}

/** A seeded Core baseline plus the authored origin-vignettes that shaped it. */
export interface SeededCore {
  readonly profile: CoreProfile;
  /** Ids of the authored Core origin-vignettes applied, for inspectability/prose. */
  readonly vignetteIds: string[];
}

/**
 * Draw a Core baseline (the central-limit PRNG spread from `seedCoreProfile`)
 * and lay `CORE_ORIGIN_VIGNETTE_DRAW_COUNT` authored origin-vignettes on top:
 * each drawn vignette adds its *signed* magnitude (virtue +, vice −) to its
 * continuum, then the result is re-clamped to [0,1]. This is the THR-544 wiring
 * the slice-1 constants doc anticipated — authored character over the random
 * spread, never replacing it.
 *
 * Determinism (NFP #3): consumes `rng` first for the baseline (an identical
 * sequence to bare `seedCoreProfile`), then for vignette selection — so the
 * baseline is unchanged from slice 1 and the vignettes layer on deterministically.
 *
 * Fail-soft (NFP #4): if the vignette pool is empty, returns the pure baseline.
 * Distinct vignettes only (a duplicate draw is skipped, not double-applied).
 */
export function seedCoreProfileWithVignettes(rng: () => number): SeededCore {
  const profile = seedCoreProfile(rng);
  const vignetteIds: string[] = [];
  const pool = CORE_ORIGIN_VIGNETTES;
  if (pool.length === 0) return { profile, vignetteIds };

  const drawn = new Set<string>();
  const maxAttempts = CORE_ORIGIN_VIGNETTE_DRAW_COUNT * 4;
  for (let attempt = 0; drawn.size < CORE_ORIGIN_VIGNETTE_DRAW_COUNT && attempt < maxAttempts; attempt++) {
    const v = pool[Math.floor(rng() * pool.length)];
    if (!v || drawn.has(v.id)) continue;
    drawn.add(v.id);
    vignetteIds.push(v.id);
    const signed = v.pole === 'virtue' ? v.magnitude : -v.magnitude;
    const current = profile[v.continuumId] ?? CORE_NEUTRAL;
    profile[v.continuumId] = clamp01(current + signed);
  }
  return { profile, vignetteIds };
}

// ─── Colour ───────────────────────────────────────────────────────────────────

/** How a reach act reads, given the agent's Core. Tone never changes competence. */
export type CoreTone = 'sincere' | 'performative' | 'plain';

export interface CoreColouring {
  /** The pole word the act expresses (passed through unchanged). */
  readonly word: string;
  /** How that word *reads* in prose given the Core. */
  readonly tone: CoreTone;
}

/**
 * Colour the expression of a reach act. `word` is the reach pole word the act
 * already expresses (e.g. 'Brave'); the Core only changes the *tone* it reads
 * with: a True/Humble self reads sincere, a False or Proud self reads
 * performative, otherwise plain. Pure read — applies no mechanical effect.
 */
export function colourReachExpression(core: CoreProfile | undefined, word: string): CoreColouring {
  const integrity = coreValue(core, 'core_integrity'); // True (1) ↔ False (0)
  const humility = coreValue(core, 'core_humility'); // Humble (1) ↔ Proud (0)

  let tone: CoreTone = 'plain';
  if (humility <= CORE_COLOUR_PROUD_THRESHOLD || integrity < CORE_NEUTRAL) {
    tone = 'performative';
  } else if (integrity >= CORE_COLOUR_SINCERE_THRESHOLD) {
    tone = 'sincere';
  }
  return { word, tone };
}

// ─── Bend ───────────────────────────────────────────────────────────────────

/** A single Core→reach bend nudge produced under low Quintessence. */
export interface CoreBendContribution {
  readonly reach: ReachDomain;
  readonly continuumId: string;
  /**
   * Signed nudge to ADD to the reach axis drift (virtue +, vice −). Magnitude
   * scales with how far the continuum sits from neutral. Never a cap.
   */
  readonly nudge: number;
}

/**
 * Compute the Core's bend nudges on reach axes for an agent whose normalized
 * Quintessence is `quintessenceNorm` (0–1, low = bendable). At/above
 * `CORE_BEND_QUINTESSENCE_THRESHOLD` the agent holds their standing self and
 * this returns `[]`. Below it, each continuum nudges its coupled reach axes
 * toward the pole the continuum leans, scaled by its deviation from neutral and
 * by how far below the threshold the agent has sunk.
 */
export function coreBendContributions(
  core: CoreProfile | undefined,
  quintessenceNorm: number,
): CoreBendContribution[] {
  if (quintessenceNorm >= CORE_BEND_QUINTESSENCE_THRESHOLD) return [];
  // How fully the agent is bending: 0 at the threshold, 1 at zero Quintessence.
  const bendFactor = clamp01(
    (CORE_BEND_QUINTESSENCE_THRESHOLD - quintessenceNorm) / CORE_BEND_QUINTESSENCE_THRESHOLD,
  );
  if (bendFactor <= 0) return [];

  const out: CoreBendContribution[] = [];
  for (const continuum of CORE_CONTINUA) {
    if (continuum.reachCouplings.length === 0) continue;
    const pos = coreValue(core, continuum.continuumId);
    const deviation = (pos - CORE_NEUTRAL) * 2; // −1 (vice) … +1 (virtue)
    if (deviation === 0) continue;
    for (const coupling of continuum.reachCouplings) {
      const nudge = coupling.sign * deviation * CORE_BEND_MAGNITUDE * bendFactor;
      if (nudge === 0) continue;
      out.push({ reach: coupling.reach, continuumId: continuum.continuumId, nudge });
    }
  }
  return out;
}

// ─── Emergence (pure threshold read) ─────────────────────────────────────────

/** A continuum that has crossed an emergence threshold. */
export interface CoreEmergence {
  readonly continuumId: string;
  readonly side: 'virtue' | 'vice';
  readonly word: string;
  readonly position: number;
}

/**
 * Pure threshold read: which continuums currently sit past an emergence
 * threshold. The Core tick phase owns the held-state/hysteresis and uses this to
 * decide when to emit emergence traces — this function itself is stateless.
 */
export function coreEmergentSignal(core: CoreProfile | undefined): CoreEmergence[] {
  const out: CoreEmergence[] = [];
  for (const continuum of CORE_CONTINUA) {
    const pos = coreValue(core, continuum.continuumId);
    if (pos >= CORE_EMERGENCE_VIRTUE_THRESHOLD) {
      out.push({ continuumId: continuum.continuumId, side: 'virtue', word: continuum.virtue.word, position: pos });
    } else if (pos <= CORE_EMERGENCE_VICE_THRESHOLD) {
      out.push({ continuumId: continuum.continuumId, side: 'vice', word: continuum.vice.word, position: pos });
    }
  }
  return out;
}
