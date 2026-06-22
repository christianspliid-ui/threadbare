import type { ActionScale } from '../../types/unifiedAction';
import type { ReachDomain } from '../../types/traits';

/** Minimum entries for a cell to be considered "filled" */
export const CONTENT_CELL_MIN = 5;

/** Number of reach domains in the census (informational) */
export const CENSUS_REACHES = 8;

/** Number of scale tiers in the census (informational) */
export const CENSUS_SCALES = 4;

/**
 * Default desert-priority ranking lens.
 * 'uniform' = all cells weighted equally (per governing grill-me verdict).
 * 'weighted' = cells weighted by player exposure (SCALE_EXPOSURE_WEIGHTS).
 */
export const DESERT_PRIORITY_MODE: 'uniform' | 'weighted' = 'uniform';

/**
 * Applicable scales per content type.
 * Cells outside a type's applicable scales render N/A, never counted as deserts.
 */
export const SCALE_APPLICABILITY: Record<string, ActionScale[]> = {
  encounters: ['local', 'regional', 'cosmic', 'personal'],
  actions: ['local', 'regional', 'cosmic', 'personal'],
  sublocations: ['local'],
  attachments: ['local', 'regional', 'cosmic'],
  artifacts: ['local', 'regional', 'cosmic'],
  conditions: ['personal', 'local'],
  spells: ['local', 'regional', 'cosmic'],
  omens: ['regional', 'cosmic'],
};

/**
 * Relative player-exposure weight per scale.
 * local/personal = high exposure, regional = mid, cosmic = low.
 * Drives the weighted desert-priority column (DESERT_PRIORITY_MODE='weighted').
 */
export const SCALE_EXPOSURE_WEIGHTS: Record<ActionScale, number> = {
  local: 3,
  personal: 3,
  regional: 2,
  cosmic: 1,
};

export const CENSUS_REACH_DOMAINS: ReachDomain[] = [
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star',
];

export const CENSUS_SCALE_DOMAINS: ActionScale[] = [
  'cosmic', 'regional', 'local', 'personal',
];
