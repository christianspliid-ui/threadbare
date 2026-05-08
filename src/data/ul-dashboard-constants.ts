/**
 * Tunable constants for the Ubiquitous Language dashboard (`?view=ul`).
 *
 * Per NFP #1: every magic number named with a default and purpose. The drift
 * thresholds re-export from `scripts/drift-scan/index.ts` so there is exactly
 * one source of truth — UI badges and the weekly scan must agree.
 */

import {
  UL_DRIFT_STALE_DAYS,
  UL_UNCANONICAL_MIN_OCCURRENCES,
} from '../../scripts/drift-scan/constants';

export const SEARCH_DEBOUNCE_MS = 150;
export const MAX_RESULTS_PER_SHARD = 200;
export const DEFINITION_PREVIEW_CHAR_LIMIT = 220;
export const STALE_CANONICAL_BADGE_DAYS = UL_DRIFT_STALE_DAYS;
export const USED_UNCANONICAL_MIN_OCCURRENCES = UL_UNCANONICAL_MIN_OCCURRENCES;
export const DRIFT_STATUS_FRESHNESS_WARN_DAYS = 14;
export const DETAIL_PANE_WIDTH_PX = 480;
export const SIDEBAR_WIDTH_PX = 240;
export const TOPBAR_HEIGHT_PX = 48;

export const EMPTY_TABLE_HINT =
  'No terms match the current filter. Clear search or pick a different shard.';
export const EMPTY_DETAIL_HINT = 'Pick a term to read its definition.';
export const DRIFT_UNAVAILABLE_HINT =
  'Drift signal unavailable — open the GitHub Action page for the latest scan.';
