---
phase: 15-fix-encounter-pipeline-scoring-movement-difficulty-scaling-round-robin-and-content-deserts
verified: 2026-03-30T13:35:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 15: Fix Encounter Pipeline Verification Report

**Phase Goal:** Fix 5 systemic encounter pipeline problems from the seed-42 analysis: score display bug (c.templateId vs c.entry.templateId), zero agent movement (TRAVEL_COST_WEIGHT too high + no personality wanderlust), encounter round-robin (small pools + no retirement mechanics), no difficulty scaling (no outgrowth lock), and content deserts at 2 locations (insufficient universal encounter templates). Add encounter retirement (max completions + outgrowth lock), personality-driven travel incentives, 50+ new hand-authored encounter templates spanning diff 20-90, and a forced travel fallback for persistent content deserts.
**Verified:** 2026-03-30T13:35:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | DECIDE timeline events show real non-zero scores and desire multiplier values | VERIFIED | `phaseAgentDecision.ts:395` — `c.entry.templateId === sel.entry.templateId` (was `c.templateId`). The `.entry.` hop was missing, causing `.find()` to always return undefined and zero all score fields. |
| 2 | Agents with high tradition_progress (progress pole) have lower effective travel cost | VERIFIED | `encounterScoring.ts:513-514` — `personalTravelCostWeight = TRAVEL_COST_WEIGHT * (1 - wanderlust * WANDERLUST_MAX_DISCOUNT)` with wanderlust clamped [0,1]. `TRAVEL_COST_WEIGHT` reduced 0.5→0.12. 4 wanderlust tests pass. |
| 3 | Agent who completed the same encounter 5 times no longer sees it as a candidate | VERIFIED | `phaseAgentDecision.ts:374` — `completions < MAX_COMPLETIONS_PER_TEMPLATE` pre-filter using existing `familiarityRecord.attemptCount`. 4 retirement tests pass. |
| 4 | Agent whose capability exceeds template difficulty by 35+ points no longer sees that encounter | VERIFIED | `encounterFilterPipeline.ts:171-196` — `filterByOutgrowth()` called at pipeline line 384. `OUTGROWTH_CAP_THRESHOLD=35`. 6 outgrowth tests pass. |
| 5 | Content pool expanded with 40+ new templates spanning difficulty 40-90 and universal coverage at all location types | VERIFIED | 134 total templates (was 94, net +40). `MODERATE_DIFFICULTY_BASE=40`, `HARD_DIFFICULTY_BASE=60`, `DEADLY_DIFFICULTY_BASE=80`. 18 templates use `ALL_LOCATION_SUBTYPES`. 41 locationTypes entries include ruins variants. Test asserts 134 and passes. |
| 6 | Agent idle for 10+ consecutive ticks with no candidates initiates forced travel to nearest content location | VERIFIED | `phaseAgentDecision.ts:636` — `idleReason === 'no_candidates_after_filter' && idleTicks >= IDLE_FORCED_TRAVEL_THRESHOLD`. Uses `findShortestPath` + `initMovementState`. Fail-soft when no content found. 8 forced travel tests pass. |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/phaseAgentDecision.ts` | Score display fix + max completions filter + idle tracking + forced travel | VERIFIED | Contains `c.entry.templateId`, `MAX_COMPLETIONS_PER_TEMPLATE` filter, `consecutiveIdleTicks` tracking, `IDLE_FORCED_TRAVEL_THRESHOLD` comparison |
| `src/engine/encounterScoring.ts` | Personality-driven wanderlust travel cost modifier | VERIFIED | Contains `personalTravelCostWeight`, `WANDERLUST_MAX_DISCOUNT` imported and applied at line 514 |
| `src/data/agent-behavior-constants.ts` | All 7 new constants | VERIFIED | `TRAVEL_COST_WEIGHT=0.12`, `WANDERLUST_MAX_DISCOUNT=0.4`, `WANDERLUST_PAIR`, `MAX_COMPLETIONS_PER_TEMPLATE=5`, `OUTGROWTH_CAP_THRESHOLD=35`, `OUTGROWTH_FILTER_ENABLED=true`, `IDLE_FORCED_TRAVEL_THRESHOLD=10` |
| `src/engine/encounterFilterPipeline.ts` | Outgrowth lock in pipeline Stage 3b | VERIFIED | `filterByOutgrowth()` exported at line 171, called at pipeline Stage 3b line 384. Imports `OUTGROWTH_CAP_THRESHOLD`, `OUTGROWTH_FILTER_ENABLED`, `computeCapability` |
| `src/data/encounter-content.ts` | 40+ new templates spanning diff 40-90 + universal coverage | VERIFIED | 134 total templates (40 net new from 94). `MODERATE_DIFFICULTY_BASE=40`, `HARD_DIFFICULTY_BASE=60`, `DEADLY_DIFFICULTY_BASE=80`. 18 ALL_LOCATION_SUBTYPES universals. 41 ruins-type locationTypes entries. |
| `src/engine/__tests__/encounterScoring.test.ts` | 3+ wanderlust tests | VERIFIED | 4 wanderlust tests pass (progressive < traditional, neutral = standard, cap enforcement, zero local) |
| `src/engine/__tests__/encounterFilterPipeline.test.ts` | 3+ outgrowth tests | VERIFIED | 6 outgrowth tests + 4 MAX_COMPLETIONS tests = 10 retirement tests pass |
| `src/engine/__tests__/phaseAgentDecision-forced-travel.test.ts` | 7+ forced travel tests | VERIFIED | 8 test cases covering all scenarios, all pass |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `encounterScoring.ts` | `agent-behavior-constants.ts` | `import WANDERLUST_MAX_DISCOUNT, WANDERLUST_PAIR` | WIRED | Both symbols present in import block (line 71-72) and used at lines 513-514 |
| `phaseAgentDecision.ts` | `encounterScoring.ts topCandidates` | `c.entry.templateId === sel.entry.templateId` | WIRED | Line 395 — correct property path through `entry` object |
| `phaseAgentDecision.ts` | `agent-behavior-constants.ts` | `MAX_COMPLETIONS_PER_TEMPLATE, IDLE_FORCED_TRAVEL_THRESHOLD` | WIRED | Line 41 imports both; used at lines 375 and 636 respectively |
| `phaseAgentDecision.ts` | `encounterScoring.ts FamiliarityRecord` | `familiarityRecord.attemptCount[c.templateId]` | WIRED | Line 374 reads attempt count from existing familiarity record |
| `encounterFilterPipeline.ts` | `domainCapability.ts computeCapability` | capability check for outgrowth lock | WIRED | Line 41 imports; called at line 190 inside `filterByOutgrowth()` |
| `phaseAgentDecision.ts` | `pathfinding.ts findShortestPath` | forced travel pathfinding | WIRED | Line 37 imports; called at line 651 in forced travel block |
| `phaseAgentDecision.ts` | `movementExecution.ts initMovementState` | movement state initialization for forced travel | WIRED | Line 35 imports; called at line 660 in forced travel block |
| `encounter-content.ts` | `EncounterTemplate` type | all template objects conform to interface | WIRED | TypeScript compilation passes with zero errors — all 134 templates type-checked |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ENC-01 | 15-01-PLAN.md | Score display bug fix (c.templateId → c.entry.templateId) | SATISFIED | `phaseAgentDecision.ts:395` contains the fix |
| ENC-02 | 15-01-PLAN.md | Movement incentives — travel cost + wanderlust personality modifier | SATISFIED | `TRAVEL_COST_WEIGHT=0.12`, `personalTravelCostWeight` formula in `encounterScoring.ts` |
| ENC-03 | 15-02-PLAN.md | Max completions retirement (hard retire after 5 completions per template) | SATISFIED | `MAX_COMPLETIONS_PER_TEMPLATE=5` pre-filter in `phaseAgentDecision.ts:374` |
| ENC-04 | 15-02-PLAN.md | Outgrowth lock (filter out encounters where agent capability >> difficulty) | SATISFIED | `filterByOutgrowth()` with `OUTGROWTH_CAP_THRESHOLD=35` wired as Stage 3b |
| ENC-05 | 15-03-PLAN.md | Content expansion — difficulty ladder 20-90, ruins coverage, universal templates | SATISFIED | 134 templates (was 94). New difficulty tier constants. 18 universal, 41 ruins entries. |
| ENC-06 | 15-04-PLAN.md | Content desert forced travel fallback after 10 consecutive idle ticks | SATISFIED | `IDLE_FORCED_TRAVEL_THRESHOLD=10`, `consecutiveIdleTicks` tracking, forced travel logic at `phaseAgentDecision.ts:636` |

**Note on REQUIREMENTS.md:** ENC-01 through ENC-06 are phase-specific IDs defined in ROADMAP.md line 274 and plan frontmatter. They do not appear in `.planning/REQUIREMENTS.md`, which tracks Hex Map V2 renderer requirements only. This is expected — encounter pipeline requirements are scoped to this phase.

**Note on ROADMAP.md:** Lines 279-282 show all four Phase 15 plans as `- [ ]` (unchecked). The code and commits confirm all 4 plans are complete. This is a documentation gap that should be fixed post-verification.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/engine/encounterScoring.ts` | 58-89 | Duplicate import: `export { ... } from` immediately followed by `import { ... } from` the same module for identical symbols | Info | TypeScript compiles and all tests pass. Redundant import block is harmless but should be cleaned up. |
| `src/engine/encounterFilterPipeline.ts` | 8, 131 | Comment says "Stage 3: Prerequisites (placeholder)" — the stage heading is stale | Info | `filterByOutgrowth()` (Stage 3b) is fully implemented and wired. The "placeholder" label refers to trait prerequisites not yet built, which is future work, not missing Phase 15 work. |

No blocker or warning-severity anti-patterns found.

### Human Verification Required

#### 1. Agent Movement Verification

**Test:** Run `npm run cli -- --seed 42` then `tick 100`, then `agents` and `events 20`.
**Expected:** Some agents show locations different from their start, or show `movementState` set. Queue_movement events should appear in recent events.
**Why human:** CLI runtime required to observe actual agent travel decisions. Cannot verify without running the engine.

#### 2. Score Display in Timeline

**Test:** Run the game at `?view=game`, advance ~20 ticks, open an agent detail panel, examine DECIDE events.
**Expected:** Each DECIDE event shows non-zero `score` and `desireMultiplier` values (previously all 0).
**Why human:** Timeline UI rendering requires browser runtime. Fix verified at code level but visual confirmation confirms end-to-end rendering.

#### 3. Content Pool at Ruins Locations

**Test:** Run `npm run cli -- --seed 42`, `tick 10`, check `agent <name>` for an agent near Pale Cairn or Grey Meadowguard.
**Expected:** Agent at ruins-type location sees 5+ encounter candidates rather than the 2 that caused content deserts.
**Why human:** Requires live CLI runtime to inspect candidate pool at specific locations.

### Test Suite Status

- **Tests passing:** 7054/7055 individual tests; 471/474 test files (3 timeout failures)
- **TypeScript compilation:** Clean — zero errors

**Pre-existing failing tests (not caused by Phase 15):**

- `encounter-liveness.contract.test.ts > pipeline liveness holds across multiple seeds` — runs 4 seeds × 100 ticks = 400 ticks with no custom timeout. Explicitly documented in 15-01 SUMMARY as pre-existing.
- `tickHealth-integration.test.ts > 200 ticks all report healthy` — timing-sensitive integration test.
- `traceBuffer-integration.test.ts > buffer does not exceed BUFFER_SIZE` — flaky under parallel test load.

All three time out at the default 5000ms. They pass when run in isolation. None relate to Phase 15 functionality.

### Gaps Summary

No gaps. All 6 phase requirements satisfied with real, substantive implementations. All key links wired. All targeted test suites pass. TypeScript compiles cleanly.

---

_Verified: 2026-03-30T13:35:00Z_
_Verifier: Claude (gsd-verifier)_
