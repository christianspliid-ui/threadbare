/**
 * Buy your spheres — pure helpers for the Remembrance spheres sub-step (THR-1749).
 *
 * The buy is four opposed-pair rows; each row is one track with a pole at each
 * end, so the one-pole rule is the shape of the control. A row's position runs
 * −cap..+cap: negative pours into the left pole, positive into the right.
 */

import type { CreationSphereName, SphereName } from '../../types';
import { SPHERE_POINT_BUDGET, SPHERE_POINT_CAP, SPHERE_LEVEL_WORDS, SPHERE_REVEAL_STIR_CLAUSE } from '../../data/sphere-points-content';
import { rankSpherePoints, type SpherePoints } from '../../engine/spherePoints';

/** The four Creation opposed pairs, in `SPHERE_OPPOSITES` order. */
export const SPHERE_BUY_PAIRS: ReadonlyArray<readonly [CreationSphereName, CreationSphereName]> = [
  ['force', 'mind'],
  ['matter', 'time'],
  ['energy', 'spirit'],
  ['life', 'entropy'],
];

/** Display word for a sphere — never the raw key (Law 14). */
export function sphereWord(s: SphereName | string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Row positions (−cap..+cap) from a points vector. */
export function positionsFromPoints(p: SpherePoints): number[] {
  return SPHERE_BUY_PAIRS.map(([left, right]) => {
    const l = p[left] ?? 0;
    const r = p[right] ?? 0;
    return l > 0 ? -l : r;
  });
}

/** Points vector (non-zero entries only) from row positions. */
export function pointsFromPositions(positions: readonly number[]): SpherePoints {
  const out: SpherePoints = {};
  SPHERE_BUY_PAIRS.forEach(([left, right], i) => {
    const v = positions[i] ?? 0;
    if (v < 0) out[left] = -v;
    else if (v > 0) out[right] = v;
  });
  return out;
}

export function spentOf(positions: readonly number[]): number {
  return positions.reduce((sum, v) => sum + Math.abs(v), 0);
}

/** Whether row `row` can move to `position` without overspending the budget. */
export function isPositionAffordable(positions: readonly number[], row: number, position: number): boolean {
  if (Math.abs(position) > SPHERE_POINT_CAP) return false;
  const others = spentOf(positions) - Math.abs(positions[row] ?? 0);
  return others + Math.abs(position) <= SPHERE_POINT_BUDGET;
}

/** A row's reading in words: "a current of Mind", or "neither". */
export function rowReading(row: number, position: number, neither: string): string {
  const [left, right] = SPHERE_BUY_PAIRS[row];
  if (position === 0) return neither;
  const sphere = position < 0 ? left : right;
  return `${SPHERE_LEVEL_WORDS[Math.abs(position)] ?? ''} ${sphereWord(sphere)}`.trim();
}

function joinAnd(words: string[]): string {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/**
 * The reveal words for a bought vector: the two largest pour through, a third
 * and fourth "stir beneath". Canonical-order tie-break (via `rankSpherePoints`).
 */
export function describeSpherePour(p: SpherePoints): { pour: string; stir: string | null } {
  const ranked = rankSpherePoints(p).map(sphereWord);
  const pour = `${joinAnd(ranked.slice(0, 2))} pour through you.`;
  const rest = ranked.slice(2);
  const stir = rest.length > 0 ? SPHERE_REVEAL_STIR_CLAUSE[rest.length === 1 ? 'one' : 'many'].replace('{spheres}', joinAnd(rest)) : null;
  return { pour, stir };
}
