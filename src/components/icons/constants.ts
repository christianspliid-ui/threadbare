import type { FactionType } from '../../types/faction';
import type { ReachDomain } from '../../types/traits';
import type { SphereName, CreationSphereName, FoundationSphereName } from '../../types/index';

export const SPHERE_COLORS: Record<SphereName, string> = {
  force: '#ff6b6b', matter: '#d4a87a', energy: '#ffe44d', life: '#33ff77',
  mind: '#44aaff', spirit: '#cc66ff', time: '#ffb355', entropy: '#8fd4c0',
  chaos: '#d4d4d8', order: '#fbbf24', light: '#fef3c7', darkness: '#8b7fbf',
};

export const REACH_TO_SPHERE: Record<ReachDomain, CreationSphereName> = {
  iron: 'force', stone: 'matter', eye: 'energy', gold: 'life',
  veil: 'mind', heart: 'spirit', star: 'time', shadow: 'entropy',
};

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
