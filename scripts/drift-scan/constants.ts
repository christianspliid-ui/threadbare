/**
 * Drift-scan thresholds — pure constants, no Node-only imports.
 *
 * Single source of truth: both the weekly drift-scan job (`scripts/drift-scan/index.ts`)
 * and the in-app UL dashboard (`src/components/UL/`) read from this module so badge
 * thresholds stay in sync with the scan that produces them.
 *
 * This file must remain free of `node:*` imports so it can be bundled by Vite for
 * the browser build.
 */

export const COUPLING_CREEP_PCT = 10; // S1: importer growth threshold
export const BROKEN_WINDOWS_PCT = 15; // S2: broken-windows growth threshold
export const TEST_RUNTIME_REGRESSION_PCT = 15; // S3: test runtime regression threshold
export const TEST_FLAKE_MIN_RUNS = 3; // S3: minimum observations before flake flag
export const UL_DRIFT_STALE_DAYS = 30; // S4: canonical term stale threshold
export const SKILL_FRESHNESS_STALE_DAYS = 60; // S5: skill validation stale threshold
export const SKILL_FRESHNESS_ARCHIVE_DAYS = 180; // S5: skill archive-candidate threshold
export const SKILL_FRESHNESS_BOOTSTRAP_GRACE_DAYS = 7; // S5: grace window for missing metadata
export const TOP_IMPORTERS_COUNT = 20; // S1: top importers window
export const UL_UNCANONICAL_MIN_OCCURRENCES = 4; // S4: used-uncanonical floor
export const SUITE_HISTORY_LIMIT = 8; // S3: retained per-suite history window
