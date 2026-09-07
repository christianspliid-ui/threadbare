import type { FactionType } from '../../types/faction';
import type { SphereName, CreationSphereName, FoundationSphereName } from '../../types/index';

/**
 * THR-1422: `SPHERE_COLORS` and `REACH_TO_SPHERE` are re-exported from
 * `src/data/premonition-constants.ts`, which owns both. This module used to
 * declare its own copy of each. The engine reads `REACH_TO_SPHERE`, so the data
 * layer has to own it; `SPHERE_COLORS` follows it to keep the cosmology's
 * colours and its reach→sphere mapping in one place. Every existing import of
 * these two names from this module keeps working.
 *
 * `SPHERE_COLORS_BASE` below is a distinct, more saturated map — not a
 * duplicate — and is declared here.
 */
import { SPHERE_COLORS, REACH_TO_SPHERE } from '../../data/premonition-constants';

export { SPHERE_COLORS, REACH_TO_SPHERE };

export const SPHERE_COLORS_BASE: Record<SphereName, string> = {
  force: '#ff4444', matter: '#a8886a', energy: '#ffd700', life: '#00cc55',
  mind: '#2288ff', spirit: '#aa44dd', time: '#ff9933', entropy: '#5a8a7a',
  chaos: '#8a8a8e', order: '#d4af37', light: '#ffeb99', darkness: '#4a3a8a',
};

export function sphereFromReach(reach: string | null | undefined): SphereName | null {
  if (!reach) return null;
  return (REACH_TO_SPHERE as Record<string, SphereName>)[reach] ?? null;
}

export const SPHERE_TO_FOUNDATION: Record<CreationSphereName, FoundationSphereName> = {
  force: 'chaos', entropy: 'chaos', matter: 'light', energy: 'light',
  life: 'order', mind: 'order', spirit: 'darkness', time: 'darkness',
};

export type DivisionType = 'per_pale' | 'per_fess' | 'per_chevron' | 'quarterly' | 'per_bend_sinister' | 'plain';

export const DIVISION_BY_FACTION_TYPE: Record<FactionType, DivisionType> = {
  military: 'per_pale', guild: 'per_fess', religious: 'per_chevron',
  political: 'quarterly', criminal: 'per_bend_sinister', monster: 'plain',
};

export const BORDER_THRESHOLDS = {
  established: { members: 5, territories: 2 },
  dominant: { members: 10, territories: 4 },
} as const;

export type ProminenceLevel = 'base' | 'established' | 'dominant';
export const SMALL_SIZE_THRESHOLD = 32;
