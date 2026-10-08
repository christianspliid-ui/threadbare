/**
 * Buy your spheres — the god's bought sphere vector (THR-1749).
 *
 * Pure module: no graph writes, no PRNG. At Remembrance the player pours
 * `SPHERE_POINT_BUDGET` points across the eight Creation spheres; the vector is
 * stored as `AscendantProperties.spherePoints` and fixed for the run.
 * `sphereAlignment` survives as a derived field — the two largest buys — so the
 * ~95 existing readers of "primary / secondary" keep working.
 *
 * Every consumer reads the vector through `getSpherePoints`, whose fallback
 * (the preset built from `sphereAlignment`) covers the bare `?view=game`
 * archetype, hand-built fixtures and states created before this shipped.
 *
 * Plan: Docs/plans/2026-10-06-thr-1749-buy-your-spheres.md
 */

import { CREATION_SPHERE_NAMES, SPHERE_NAMES, type SphereName } from '../types/index';
import type { SphereAlignment } from '../types/influence';
import type { SpherePointsInvalidReason } from '../types/traces/sphere-traces';
import { SPHERE_OPPOSITES } from './cosmology';
import {
  HUNGER_PRESET_PRIMARY_POINTS,
  HUNGER_PRESET_SECONDARY_POINTS,
  SPHERE_POINT_BUDGET,
  SPHERE_POINT_CAP,
  UNBOUGHT_SPHERE_INCOME_SHARE,
} from '../data/sphere-points-content';

export type { SpherePointsInvalidReason } from '../types/traces/sphere-traces';

/** A bought (or fallback) sphere vector — points per sphere, absent = 0. */
export type SpherePoints = Partial<Record<SphereName, number>>;

const CREATION_SET: ReadonlySet<string> = new Set(CREATION_SPHERE_NAMES);

/** A hunger's preset buy: three points in its first sphere, two in its second. */
export function presetFromAlignment(a: SphereAlignment): SpherePoints {
  if (a.primary === a.secondary) {
    return { [a.primary]: HUNGER_PRESET_PRIMARY_POINTS + HUNGER_PRESET_SECONDARY_POINTS };
  }
  return {
    [a.primary]: HUNGER_PRESET_PRIMARY_POINTS,
    [a.secondary]: HUNGER_PRESET_SECONDARY_POINTS,
  };
}

/**
 * Validate a bought vector: Creation spheres only, whole numbers 0..cap,
 * summing to the budget, never both poles of an opposed pair.
 */
export function validateSpherePoints(
  p: SpherePoints | null | undefined,
): { ok: true } | { ok: false; reason: SpherePointsInvalidReason } {
  if (!p) return { ok: false, reason: 'wrong_total' };
  let total = 0;
  for (const [sphere, raw] of Object.entries(p)) {
    const value = raw ?? 0;
    if (value === 0) continue;
    if (!CREATION_SET.has(sphere)) return { ok: false, reason: 'foundation_sphere' };
    if (!Number.isInteger(value) || value < 0) return { ok: false, reason: 'not_whole' };
    if (value > SPHERE_POINT_CAP) return { ok: false, reason: 'over_cap' };
    total += value;
  }
  if (total !== SPHERE_POINT_BUDGET) return { ok: false, reason: 'wrong_total' };
  for (const sphere of CREATION_SPHERE_NAMES) {
    const opposite = SPHERE_OPPOSITES[sphere];
    if (opposite && (p[sphere] ?? 0) > 0 && (p[opposite] ?? 0) > 0) {
      return { ok: false, reason: 'both_poles' };
    }
  }
  return { ok: true };
}

function hasAnyPoints(p: unknown): p is SpherePoints {
  if (!p || typeof p !== 'object') return false;
  return Object.values(p as Record<string, unknown>).some(v => typeof v === 'number' && v > 0);
}

function isAlignment(a: unknown): a is SphereAlignment {
  return !!a && typeof a === 'object'
    && typeof (a as SphereAlignment).primary === 'string'
    && typeof (a as SphereAlignment).secondary === 'string';
}

/**
 * The one read every consumer uses. Stored `spherePoints` when present and
 * non-empty; otherwise the preset from `sphereAlignment`; otherwise `{}`.
 */
export function getSpherePoints(props: { spherePoints?: unknown; sphereAlignment?: unknown } | null | undefined): SpherePoints {
  if (!props) return {};
  if (hasAnyPoints(props.spherePoints)) return props.spherePoints;
  if (isAlignment(props.sphereAlignment)) return presetFromAlignment(props.sphereAlignment);
  return {};
}

/** Whether the vector `getSpherePoints` returns was bought or is the preset fallback. */
export function getSpherePointsSource(props: { spherePoints?: unknown } | null | undefined): 'bought' | 'fallback' {
  return props && hasAnyPoints(props.spherePoints) ? 'bought' : 'fallback';
}

/**
 * Non-zero entries ordered largest first, ties broken by canonical
 * `SPHERE_NAMES` order (Foundation first, then Creation order).
 */
export function rankSpherePoints(p: SpherePoints): SphereName[] {
  return SPHERE_NAMES
    .filter(s => (p[s] ?? 0) > 0)
    .map((s, i) => ({ s, i, v: p[s] ?? 0 }))
    .sort((a, b) => b.v - a.v || a.i - b.i)
    .map(e => e.s);
}

/** The two largest buys as primary / secondary; `null` for fewer than two non-zero entries. */
export function deriveAlignmentFromPoints(p: SpherePoints): SphereAlignment | null {
  const ranked = rankSpherePoints(p);
  if (ranked.length < 2) return null;
  return { primary: ranked[0], secondary: ranked[1] };
}

/**
 * Split `total` essence across the twelve spheres: every sphere keeps
 * `UNBOUGHT_SPHERE_INCOME_SHARE` of it (the "never zero" floor), the remainder
 * is shared in proportion to the points. With no points the remainder is shared
 * equally, so income is never lost. The parts always sum to `total`.
 */
export function distributeBySpherePoints(total: number, p: SpherePoints): Record<SphereName, number> {
  const floor = total * UNBOUGHT_SPHERE_INCOME_SHARE;
  const remainder = total - floor * SPHERE_NAMES.length;
  let sum = 0;
  for (const s of SPHERE_NAMES) sum += Math.max(0, p[s] ?? 0);
  const out = {} as Record<SphereName, number>;
  for (const s of SPHERE_NAMES) {
    const weight = sum > 0 ? Math.max(0, p[s] ?? 0) / sum : 1 / SPHERE_NAMES.length;
    out[s] = floor + remainder * weight;
  }
  return out;
}
