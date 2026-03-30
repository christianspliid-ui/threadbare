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

### signifierRegistry.test.ts — 2 failing tests (discovered Plan 06-04)

**File:** `src/components/HexMapV2/signifiers/__tests__/signifierRegistry.test.ts`
**Discovered:** During Plan 06-04 execution
**Status:** Pre-existing — test expectations don't match registry after commit 306a4df absorbed hardened_clay into badlands
**Tests failing:**
- `registry has entries for all 28 direct terrain types` — hardened_clay no longer a direct entry
- `each registry entry has the correct number of variants` — light_forest has 4 variants, test expects 1

**Root cause:** Test file was not updated when signifier Plan 03/04 absorbed hardened_clay into badlands and added light_forest variants.

**Action required:** Update test expectations to match current registry entries.

### SignifierMesh.test.ts — 9 failing tests (discovered Plan 06-04)

**File:** `src/components/HexMapV2/scene/__tests__/SignifierMesh.test.ts`
**Status:** Cascade failure — imports signifierRegistry which has a transform error in test context
**Action required:** Resolve signifierRegistry test context issue (likely the same root cause as above).

### Engine/integration tests — ~8 failing tests (discovered Plan 06-04)

**Files:** Various in `src/engine/__tests__/` and `src/components/`
**Status:** Pre-existing failures unrelated to Plan 06 changes
**Tests:** familiarity-integration, movement-p2-integration, movementExecution, traceBuffer-integration, MovementTrails, MandateTracker
**Action required:** Investigate in a future cleanup session.
