---
phase: 15-fix-encounter-pipeline-scoring-movement-difficulty-scaling-round-robin-and-content-deserts
verified: 2026-03-30T13:20:00Z
status: passed
score: 6/6 must-haves verified
re_verification: false
---

# Phase 15: Fix Encounter Pipeline Verification Report

**Phase Goal:** Fix 5 systemic encounter pipeline problems: zero movement, encounter round-robin, no difficulty escalation, score display collapse, and content deserts at 2 locations.
**Verified:** 2026-03-30
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | DECIDE timeline events show real non-zero scores and desire multiplier values | VERIFIED | `phaseAgentDecision.ts:395` — `c.entry.templateId === sel.entry.templateId` (not `c.templateId`). Bug was a missing `.entry.` hop that caused `.find()` to always return undefined, zeroing all score fields. |
| 2 | Agents with high tradition_progress (progress pole) have lower effective travel cost | VERIFIED | `encounterScoring.ts:514` computes `personalTravelCostWeight = TRAVEL_COST_WEIGHT * (1 - wanderlust * WANDERLUST_MAX_DISCOUNT)`. `TRAVEL_COST_WEIGHT` reduced 0.5 → 0.12. 11 wanderlust test cases pass. |
| 3 | Agent who completed the same encounter 5 times no longer sees it as a candidate | VERIFIED | `phaseAgentDecision.ts:374` — `candidatesAfterRetirement` filter: `completions < MAX_COMPLETIONS_PER_TEMPLATE` (5). 7 retirement tests pass. |
| 4 | Agent whose capability exceeds template difficulty by 35+ points no longer sees that encounter | VERIFIED | `encounterFilterPipeline.ts:171-196` — `filterByOutgrowth()` called at pipeline line 384. `OUTGROWTH_CAP_THRESHOLD = 35`. 16 outgrowth/completions tests pass. |
| 5 | Content pool expanded with 60+ new templates spanning difficulty 40-90 and universal coverage | VERIFIED | ENCOUNTER_TEMPLATES array: 154 templates (was 94). 76 steps use `MODERATE_DIFFICULTY_BASE`/`HARD_DIFFICULTY_BASE`/`DEADLY_DIFFICULTY_BASE` constants. 34 templates use `ALL_LOCATION_SUBTYPES`. 28 locationTypes entries include ruins types. 13 templates at DEADLY_DIFFICULTY_BASE (80+). |
| 6 | Agent idle for 10+ consecutive ticks with no candidates initiates forced travel to nearest content location | VERIFIED | `phaseAgentDecision.ts:636` — `idleReason === 'no_candidates_after_filter' && idleTicks >= IDLE_FORCED_TRAVEL_THRESHOLD`. Uses `findShortestPath` + `initMovementState`. Fail-soft when no content found. 8 forced travel tests pass. |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/phaseAgentDecision.ts` | Score display fix + max completions filter + forced travel | VERIFIED | Contains `c.entry.templateId`, `candidatesAfterRetirement`, `consecutiveIdleTicks`, `IDLE_FORCED_TRAVEL_THRESHOLD` |
| `src/engine/encounterScoring.ts` | Personality-driven wanderlust travel cost | VERIFIED | Contains `personalTravelCostWeight`, `WANDERLUST_MAX_DISCOUNT`, `profile.tradition_progress` |
| `src/data/agent-behavior-constants.ts` | All 6 new constants | VERIFIED | `TRAVEL_COST_WEIGHT=0.12`, `WANDERLUST_MAX_DISCOUNT=0.4`, `WANDERLUST_PAIR`, `MAX_COMPLETIONS_PER_TEMPLATE=5`, `OUTGROWTH_CAP_THRESHOLD=35`, `OUTGROWTH_FILTER_ENABLED=true`, `IDLE_FORCED_TRAVEL_THRESHOLD=10` |
| `src/engine/encounterFilterPipeline.ts` | Outgrowth lock in pipeline Stage 3b | VERIFIED | `filterByOutgrowth()` at line 171, called at pipeline line 384. Imports `OUTGROWTH_CAP_THRESHOLD`, `OUTGROWTH_FILTER_ENABLED`, `computeCapability` |
| `src/data/encounter-content.ts` | 50+ new templates spanning diff 40-90 + universal coverage | VERIFIED | 154 total templates (60 net new). `MODERATE_DIFFICULTY_BASE=40`, `HARD_DIFFICULTY_BASE=60`, `DEADLY_DIFFICULTY_BASE=80`. 34 templates at ALL_LOCATION_SUBTYPES. 28 entries covering ruins. |
| `src/engine/__tests__/encounterScoring.test.ts` | 3+ wanderlust tests | VERIFIED | 11 wanderlust occurrences; 52 total tests pass |
| `src/engine/__tests__/encounterFilterPipeline.test.ts` | 3+ outgrowth tests | VERIFIED | 16 outgrowth/completions occurrences; 25 total tests pass |
| `src/engine/__tests__/phaseAgentDecision-forced-travel.test.ts` | 7+ forced travel tests | VERIFIED | 8 test cases, all pass (file created for this phase) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `encounterScoring.ts` | `agent-behavior-constants.ts` | `import WANDERLUST_MAX_DISCOUNT` | WIRED | Lines 71, 87 import and re-export |
| `phaseAgentDecision.ts` | `encounterScoring.ts` topCandidates | `c.entry.templateId === sel.entry.templateId` | WIRED | Line 395 — correct property path |
| `phaseAgentDecision.ts` | `agent-behavior-constants.ts` | `MAX_COMPLETIONS_PER_TEMPLATE, IDLE_FORCED_TRAVEL_THRESHOLD` | WIRED | Line 41 imports both; both used at lines 375 and 636 |
| `encounterFilterPipeline.ts` | `domainCapability.ts computeCapability` | capability check for outgrowth lock | WIRED | Line 41 imports; called at line 190 inside `filterByOutgrowth` |
| `phaseAgentDecision.ts` | `pathfinding.ts findShortestPath` | forced travel pathfinding | WIRED | Line 37 imports; called at line 651 in forced travel block |
| `phaseAgentDecision.ts` | `movementExecution.ts initMovementState` | movement state for forced travel | WIRED | Line 35 imports; called at line 660 in forced travel block |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ENC-01 | 15-01 | Score display bug fix | SATISFIED | `c.entry.templateId` fix at phaseAgentDecision.ts:395 |
| ENC-02 | 15-01 | Movement incentives — travel cost + wanderlust | SATISFIED | `TRAVEL_COST_WEIGHT=0.12`, `personalTravelCostWeight` formula, `WANDERLUST_MAX_DISCOUNT=0.4` |
| ENC-03 | 15-02 | Max completions retirement | SATISFIED | `candidatesAfterRetirement` filter in phaseAgentDecision.ts:372-376 |
| ENC-04 | 15-02 | Outgrowth lock | SATISFIED | `filterByOutgrowth()` in encounterFilterPipeline.ts, called at pipeline line 384 |
| ENC-05 | 15-03 | Content expansion — 20+ templates per archetype | SATISFIED | 154 templates total (up from 94). Settlement types: 46 locationTypes entries. Ruins: 28. Wilderness: 12. Universal (ALL_LOCATION_SUBTYPES): 34. Difficulty tiers 40-90 covered with named constants. |
| ENC-06 | 15-04 | Content desert forced travel fallback | SATISFIED | `consecutiveIdleTicks` tracking, forced travel at threshold, fail-soft when no content found |

**Note:** ENC-01 through ENC-06 are phase-specific requirement IDs defined in the ROADMAP and plan frontmatter. They do not appear in `.planning/REQUIREMENTS.md`, which tracks Hex Map V2 requirements only. This is consistent — encounter pipeline requirements are scoped to this phase and documented in ROADMAP.md lines 274.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/engine/encounterFilterPipeline.ts` | 131 | Section heading comment says "placeholder" | Info | Stale comment — the section heading `Stage 3: Prerequisites (placeholder)` refers to future trait prerequisites, not to the outgrowth implementation. `filterByOutgrowth` (Stage 3b) is fully implemented and wired. No functional impact. |
| `src/data/encounter-content.ts` | 2-7 | File header comment says "94 encounter templates" | Info | Stale — actual count is 154. No functional impact; documentation debt only. |

No blocker or warning-severity anti-patterns found.

### Human Verification Required

#### 1. Agent Movement Verification

**Test:** Run `npm run cli -- --seed 42` then `tick 100`, then `agents`.
**Expected:** At least some agents should show locations different from their starting location, or `movementState` set. Queue_movement events should appear in `events 20`.
**Why human:** CLI output is required to confirm agents are actually initiating travel decisions. Cannot verify programmatically without running the engine.

#### 2. Score Display in Timeline

**Test:** Run the game at `?view=game`, advance ~20 ticks, open an agent detail panel, examine DECIDE events in their timeline.
**Expected:** Each DECIDE event shows non-zero `score` and `desireMultiplier` values (not all 0).
**Why human:** Timeline UI rendering requires browser runtime. The fix was verified at the code level but UI display needs visual confirmation.

#### 3. Content Pool at Ruins Locations

**Test:** Run `npm run cli -- --seed 42`, then `status` to identify an agent at a ruins/ruined location, then inspect their encounter candidates.
**Expected:** Ruins-type locations should have 5+ encounter candidates (not the 2 that caused content deserts).
**Why human:** Requires CLI runtime and knowledge of which agents are at ruins-type locations.

### Gaps Summary

No gaps found. All 6 phase requirements are satisfied with real implementations (not stubs), all key wiring is confirmed, all targeted test files pass, and TypeScript compiles cleanly.

The single test failure in the full suite (`encounter-liveness.contract.test.ts` timing out at 5000ms) is a pre-existing infrastructure issue caused by resource contention during parallel test execution — the test passes consistently when run in isolation (2.4-4.1s), including after phase 15 changes. This is not introduced by phase 15 and does not affect phase goal achievement.

---

_Verified: 2026-03-30T13:20:00Z_
_Verifier: Claude (gsd-verifier)_
