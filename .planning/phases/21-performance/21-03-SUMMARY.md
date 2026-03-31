---
phase: 21-performance
plan: 03
subsystem: infra
tags: [vite, rollup, bundle-splitting, performance]

# Dependency graph
requires: []
provides:
  - "manualChunks Vite configuration splitting encounter-content, unified-action-templates, and culture-content into separate JS chunks"
  - "Main bundle reduced by 582 kB (17.8%)"
affects: [vercel-deploy, initial-load-performance]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Vite manualChunks for data-heavy module separation"]

key-files:
  created: []
  modified:
    - vite.config.ts

key-decisions:
  - "manualChunks used instead of dynamic imports — data files are needed at startup so async splitting would cause flicker; parallel HTTP download via separate static chunks is the right trade-off"
  - "Three chunks: data-encounter (377 kB), data-action-templates (141 kB), data-culture (64 kB) — totalling 582 kB removed from main bundle"

patterns-established:
  - "data-* chunk naming convention for future large static data files"

requirements-completed: [PERF-03]

# Metrics
duration: 10min
completed: 2026-03-31
---

# Phase 21 Plan 03: Vite manualChunks Data Bundle Split Summary

**vite.config.ts manualChunks splits encounter-content, unified-action-templates, and culture-content into parallel-loadable chunks, reducing main bundle from 3,277 kB to 2,695 kB (-582 kB, -17.8%)**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-31T11:44:00Z
- **Completed:** 2026-03-31T11:54:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Recorded baseline: `index-DKLpyGaa.js` = 3,276.63 kB (gzip: 924.95 kB)
- Added `build.rollupOptions.output.manualChunks` to `vite.config.ts` for three large data files
- After split: `index-D443NdXf.js` = 2,694.57 kB (gzip: 785.95 kB) — main bundle 582 kB smaller
- Three new parallel-loadable chunks: `data-encounter-D9BNNEHd.js` (377.28 kB), `data-action-templates-1odS3n7N.js` (140.65 kB), `data-culture-DJCz5WtF.js` (63.66 kB)
- ContentBrowser lazy chunk (`ContentBrowser-DfQALHh-.js`, 149.78 kB) unaffected

## Task Commits

Each task was committed atomically:

1. **Task 1: Record baseline bundle sizes** — no file changes, baseline documented (3,276.63 kB)
2. **Task 2: Add manualChunks to vite.config.ts and verify split** - `076a2d9` (feat)

**Plan metadata:** pending final commit (docs)

## Files Created/Modified

- `vite.config.ts` — Added `build.rollupOptions.output.manualChunks` with entries for `data-encounter`, `data-action-templates`, and `data-culture`

## Decisions Made

- Used `manualChunks` (static split) rather than dynamic `import()` (lazy load). The data files are needed on game start, not lazily — async splitting would cause runtime delays or flicker. Static chunks are fetched in parallel by the browser, achieving the same network efficiency benefit without async complexity.
- Chunk names follow `data-*` prefix convention for easy identification in build output and CDN caching rules.
- The `unified-action-templates.ts → encounter-content.ts` import chain is correctly handled by Rollup: it places the dependency in the `data-encounter` chunk and `data-action-templates` depends on it. No circular import issues.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing test failures (28 tests across 13 files) unrelated to this change. The failing tests cover encounter-content count mismatches, orchestrator regressions, and prose cache issues — all were present before this plan began and are tracked elsewhere.
- `npx tsc --noEmit` passes cleanly.

## Next Phase Readiness

- Bundle split complete. Vercel will auto-deploy from next `git push` to main.
- Gzip benefit: main bundle gzip reduced from 924.95 kB to 785.95 kB (-139 kB compressed).
- Future large data files should follow the `data-*` manualChunks pattern.

---
*Phase: 21-performance*
*Completed: 2026-03-31*
