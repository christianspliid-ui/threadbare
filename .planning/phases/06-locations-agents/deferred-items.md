# Deferred Items — Phase 06 Locations & Agents

## Pre-existing test failures (out of scope)

### CoastlineMesh.test.ts — 3 failing tests

**File:** `src/components/HexMapV2/scene/__tests__/CoastlineMesh.test.ts`
**Discovered:** During Plan 06-01 execution
**Status:** Pre-existing — `CoastlineMesh.ts` was modified before Plan 06-01 started
**Tests failing:**
- `shallow band mesh uses WATER_PALETTE.shallows color`
- Two related water color tests

**Root cause:** `CoastlineMesh.ts` has uncommitted changes from a prior session that broke
the water color assertions. The file is listed as modified in the git status at plan start.

**Action required:** Fix `CoastlineMesh.ts` or its test expectations in a future cleanup task.
This is not caused by Plan 06-01 changes.
