/**
 * Reach-axis personality **baseline** computation from origin vignettes (THR-561).
 *
 * The origin-vignette content library (`data/origin-vignettes.ts`, THR-539) is a
 * flat pool of one-line pre-history vignettes, each tagged `(reach, pole, magnitude)`.
 * This module is the consumer the library was authored for: at birth it draws a
 * handful of vignettes and folds their signed axis contributions — together with
 * any `axisContributions` carried by the agent's permanent traits — onto the agent's
 * moral baseline.
 *
 * ─── The baseline computation (what `axisContributions` feeds) ───
 * A *contribution* is a signed delta on the canonical 0–1 axis scale (0.5 neutral,
 * virtue 1.0, vice 0.0), keyed by canonical axis id (`${reach}_axis`). Contributions
 * come from two sources, summed identically:
 *   1. drawn origin vignettes  — `pole==='virtue' ? +magnitude : −magnitude`
 *   2. permanent trait defs    — their `TraitDefinitionProperties.axisContributions`
 * Per axis the summed canonical delta is laid onto the agent's *existing* generated
 * baseline (converted to canonical), clamped to [0,1], and converted back to the
 * signed ±1 storage scale the `AxiologicalProfile` uses. This mirrors the Core
 * layer's "authored character over the generated spread, never replacing it"
 * principle (`core/coreMechanics.ts`) — the vignettes nudge the baseline, they do
 * not wipe worldgen's draw.
 *
 * ─── Scale (LOAD-BEARING) ────────────────────────────────────────
 * Authoring / contribution scale is the canonical **0–1 delta** (a +0.10 pushes the
 * position 0.10 toward virtue). Storage stays **signed ±1** on `AxiologicalProfile`
 * (THR-559 grey-zone). The two registry bridges (`signedToCanonical01` /
 * `canonical01ToSigned`) are the only conversion path — never open-coded here.
 *
 * ─── Determinism (NFP #3) ────────────────────────────────────────
 * Every function is pure in its `rng`/inputs. The caller supplies a per-agent seeded
 * PRNG so the same world seed reproduces the same baseline regardless of *when* the
 * agent is first seeded.
 *
 * ─── Fail-soft (NFP #4) ──────────────────────────────────────────
 * | Failure case                     | Fallback                                    |
 * |----------------------------------|---------------------------------------------|
 * | Empty vignette pool              | No contributions → baseline unchanged       |
 * | Duplicate vignette drawn         | Skipped (distinct draws only)               |
 * | Axis id absent from the registry | Contribution skipped, counted `unknownAxes` |
 * | No contribution for an axis      | That axis's baseline is left untouched      |
 */
import type { ValuePair } from '../../types/agent';
import type { OriginVignette } from '../../data/origin-vignettes';
import { ORIGIN_VIGNETTES } from '../../data/origin-vignettes';
import {
  getAxisByReach,
  getAxisById,
  signedToCanonical01,
  canonical01ToSigned,
} from '../../types/axisRegistry';
import { ORIGIN_VIGNETTES_PER_AGENT } from './originConstants';

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Draw up to `count` **distinct** origin vignettes from the pool using `rng`.
 * Mirrors `seedCoreProfileWithVignettes`' bounded-attempt distinct draw so a small
 * pool or unlucky repeats can't loop. Returns fewer than `count` only if the pool
 * is smaller than `count`.
 */
export function drawOriginVignettes(
  rng: () => number,
  count: number = ORIGIN_VIGNETTES_PER_AGENT,
  pool: readonly OriginVignette[] = ORIGIN_VIGNETTES,
): OriginVignette[] {
  if (pool.length === 0 || count <= 0) return [];
  const target = Math.min(count, pool.length);
  const drawn = new Set<string>();
  const out: OriginVignette[] = [];
  const maxAttempts = target * 4;
  for (let attempt = 0; out.length < target && attempt < maxAttempts; attempt++) {
    const v = pool[Math.floor(rng() * pool.length)];
    if (!v || drawn.has(v.id)) continue;
    drawn.add(v.id);
    out.push(v);
  }
  return out;
}

/**
 * The signed canonical-scale contribution a single vignette makes to its axis.
 * `reach` → canonical axis id via the registry (total over reaches); the sign comes
 * from `pole` (virtue +, vice −). Never returns undefined — every reach has an axis.
 */
export function vignetteAxisContribution(v: OriginVignette): { axisId: string; delta: number } {
  const axis = getAxisByReach(v.reach);
  const delta = v.pole === 'virtue' ? v.magnitude : -v.magnitude;
  return { axisId: axis.axisId, delta };
}

/** A signed per-axis contribution map: canonical 0–1 delta keyed by canonical axis id. */
export type AxisContributionMap = Partial<Record<string, number>>;

export interface BaselineComputation {
  /** Per-`ValuePair` signed ±1 baseline updates to merge onto the profile. */
  profileUpdates: Partial<Record<ValuePair, number>>;
  /** Ids of the vignettes that were drawn and applied (provenance for the sheet/prose). */
  vignetteIds: string[];
  /** Total vignettes applied (== `vignetteIds.length`; surfaced for the aggregate trace). */
  vignettesApplied: number;
  /** Count of contributions whose axis id was not in the registry (fail-soft skips). */
  unknownAxes: number;
}

/**
 * Sum a list of contribution maps per axis id, skipping (and counting) any axis id
 * absent from the registry. Pure — the single place `axisContributions` is folded
 * into a baseline, shared by origin vignettes and permanent trait contributions.
 */
export function sumAxisContributions(
  maps: readonly AxisContributionMap[],
): { totals: Map<string, number>; unknownAxes: number } {
  const totals = new Map<string, number>();
  let unknownAxes = 0;
  for (const map of maps) {
    for (const [axisId, delta] of Object.entries(map)) {
      if (typeof delta !== 'number' || delta === 0) continue;
      if (!getAxisById(axisId)) {
        unknownAxes++;
        continue;
      }
      totals.set(axisId, (totals.get(axisId) ?? 0) + delta);
    }
  }
  return { totals, unknownAxes };
}

/**
 * Compute the personality baseline for one agent: draw origin vignettes, fold their
 * contributions together with any permanent-trait `axisContributions`, and lay the
 * summed canonical deltas onto the agent's existing signed baseline.
 *
 * @param rng                per-agent seeded PRNG (caller owns the seed derivation)
 * @param existingProfile    the agent's current `AxiologicalProfile` (signed ±1), read-only
 * @param traitContributions `axisContributions` maps from the agent's permanent traits
 */
export function computeOriginBaseline(
  rng: () => number,
  existingProfile: Partial<Record<ValuePair, number>>,
  traitContributions: readonly AxisContributionMap[] = [],
): BaselineComputation {
  const vignettes = drawOriginVignettes(rng);
  const vignetteMaps: AxisContributionMap[] = vignettes.map((v) => {
    const { axisId, delta } = vignetteAxisContribution(v);
    return { [axisId]: delta };
  });

  const { totals, unknownAxes } = sumAxisContributions([...vignetteMaps, ...traitContributions]);

  const profileUpdates: Partial<Record<ValuePair, number>> = {};
  for (const [axisId, delta] of totals) {
    const axis = getAxisById(axisId);
    if (!axis) continue; // already counted in unknownAxes; defensive.
    const existingSigned = existingProfile[axis.valuePair] ?? 0;
    const nextCanonical = clamp01(signedToCanonical01(existingSigned) + delta);
    profileUpdates[axis.valuePair] = canonical01ToSigned(nextCanonical);
  }

  return {
    profileUpdates,
    vignetteIds: vignettes.map((v) => v.id),
    vignettesApplied: vignettes.length,
    unknownAxes,
  };
}
