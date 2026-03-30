---
phase: 18-wire-mercenary-company-seeding-and-encounters-into-the-runtime-pipeline
plan: "02"
subsystem: faction-encounter-pipeline
tags: [faction, mercenary, encounter, quest-generation, rank-gating, reputation]
dependency_graph:
  requires: [mercenary-company-faction-nodes]
  provides: [mc-quest-candidates, mc-join-candidate, mc-promotion-candidate, promotionPending-flag]
  affects: [factionQuestGeneration, factionReputation, encounterPipeline]
tech_stack:
  added: []
  patterns: [unified-meta-registry, per-faction-template-ids, promotionPending-auto-inject]
key_files:
  created:
    - src/engine/__tests__/factionQuestGeneration.test.ts
    - src/engine/__tests__/mercenaryPipeline.test.ts
  modified:
    - src/engine/factionQuestGeneration.ts
    - src/engine/factionReputation.ts
    - src/types/disposition.ts
decisions:
  - getAccessibleTemplates uses unified FACTION_ENCOUNTER_META registry (not just FACTION_ENCOUNTER_TEMPLATES) so mc.* templates are included
  - Sublocation detection supports both sublocationTypeId=faction-hall (factionSeeding) and locationSubtype=guild-hall (test mocks) for backward compat
  - Join/promotion templates resolved via definition.joinEncounterTemplateId / definition.promotionEncounterTemplateId with ag.* fallback
  - promotionPending flag takes priority over partial-success-margin path — always injects at 9.0 even when gap < margin
  - promotionPending cleared on mc.promotion encounter completion via processFactionEncounterReputation
metrics:
  duration: ~25min
  completed: "2026-03-30"
  tasks: 2
  files: 5
---

# Phase 18 Plan 02: MC.* Encounter Pipeline Fix Summary

Fixed the encounter pipeline so mc.* templates are accessible to mercenary company members: unified registry lookup in `getAccessibleTemplates`, sublocation type detection fix, per-faction template resolution for join/promotion, and `promotionPending` flag for auto-triggered promotion at elevated priority.

## What Was Built

**Task 1: Fix getAccessibleTemplates, sublocation detection, and promotionPending**

- **Fixed `getAccessibleTemplates`** in `factionQuestGeneration.ts`: replaced `FACTION_ENCOUNTER_TEMPLATES.filter(...)` (ag.* only) with `[...FACTION_ENCOUNTER_META.entries()].filter(...).map(id => getFactionEncounterById(id))` — now searches the unified registry covering both ag.* and mc.* templates
- **Fixed sublocation detection** in `generateFactionLifecycleCandidates`: changed from checking only `locationSubtype === 'guild-hall'` to also checking `sublocationTypeId === 'sublocation-type.faction-hall'` (what `factionSeeding.ts` writes), with backward compat for existing test mocks
- **Fixed join/promotion template resolution**: both `isMember=false` (join) and `isMember=true` (promotion) paths now use `definition.joinEncounterTemplateId` / `definition.promotionEncounterTemplateId` with fallback to `FACTION_JOIN_TEMPLATE` / `FACTION_PROMOTION_TEMPLATE` — enables `mc.join` and `mc.promotion` templates to be resolved correctly
- **Added `promotionPending` to `MemberOfEdgeProperties` type** in `src/types/disposition.ts`
- **Added `promotionPending` flag setting** in `applyFactionReputationGain` (`factionReputation.ts`): when rank increases (`rankChanged && amount > 0`), sets `promotionPending: true` on the member_of edge
- **Added `promotionPending` clearing** in `processFactionEncounterReputation`: when the completed encounter matches `definition.promotionEncounterTemplateId`, sets `promotionPending: false`
- **Fixed promotionPending priority precedence**: `promotionPending=true` takes the early-return path at priority 9.0, bypassing the partial-success-margin check (which would fire at 7.0 when gap is small)

**Task 2: Tests — 22 tests covering mc.* quest generation, rank gating, join/promotion lifecycle, reputation-via-encounter, and integration pipeline**

`src/engine/__tests__/factionQuestGeneration.test.ts` (17 tests):

| Test | What It Covers |
|------|----------------|
| sellsword rank gets mc.quest.* only | Rank gating — lowest tier |
| sergeant_at_arms gets mc.quest.* + mc.senior.* | Rank gating — mid tier |
| captain gets all three prefix groups | Rank gating — upper tier |
| non-member gets no mc.quest.* | Non-member exclusion |
| mc.join candidate has not_faction filter | Visibility filter contract |
| mc.join has correct template ID | Join template resolution |
| promotionPending=true injects at priority 9.0 | Auto-promote at elevated priority |
| promotionPending=false far from threshold — no promotion | Correct absence |
| quest candidates have questPriority set | Candidate completeness |
| mc.quest.* step increments reputation | Reputation via encounter |
| full completion applies bonus | Completion bonus |
| failed step does not increment | Failure behavior |
| mc.promotion completion clears promotionPending | Flag lifecycle |
| non-promotion encounter does not clear flag | Flag isolation |

`src/engine/__tests__/mercenaryPipeline.test.ts` (5 integration tests):

| Test | What It Covers |
|------|----------------|
| Full join → quest → promote cycle | End-to-end pipeline integration |
| Below sergeant threshold — mc.quest.* only | Threshold boundary |
| Quest candidates have correct successRewardEstimate | Meta registry wiring |
| War Chief rank gets all tier groups | Top rank access |
| Member not offered mc.join at own hall | Join exclusion for existing members |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] promotionPending priority precedence**
- **Found during:** Task 2 test writing
- **Issue:** When rep was high enough that gap < PROMOTION_PARTIAL_SUCCESS_MARGIN, the normal promotion path fired at priority 7.0, then `alreadyAdded = true` blocked the `promotionPending` inject at 9.0
- **Root cause:** The rewardMultiplier from rank bonuses (1.20x at sergeant, 1.35x at captain) accelerates rep enough during test that gap shrinks below margin before `promotionPending` path runs
- **Fix:** Restructured logic so `promotionPending=true` takes the early-return path at 9.0, bypassing the partial-success-margin branch entirely (correct semantics: an explicitly flagged promotion should always fire at high priority)
- **Files modified:** `src/engine/factionQuestGeneration.ts`
- **Commit:** 42ef21d

### Out-of-Scope Pre-Existing Failures (unchanged from 18-01)

The following test failures existed before Plan 18-02 and remain out of scope:
- `tickHealth-integration.test.ts` — performance test exceeds threshold
- `traceBuffer-integration.test.ts` — buffer size assertion
- `contracts/encounter-liveness.contract.test.ts` — pipeline liveness timeout

## Self-Check: PASSED

- SUMMARY.md: FOUND
- Commit 8cc48c0 (Task 1): FOUND
- Commit 42ef21d (Task 2): FOUND
- `src/engine/factionQuestGeneration.ts`: FACTION_ENCOUNTER_META registry search present, sublocationTypeId check present, per-faction joinEncounterTemplateId/promotionEncounterTemplateId usage present
- `src/engine/factionReputation.ts`: promotionPending=true on rank increase present, promotionPending=false on promotion completion present
- `src/types/disposition.ts`: promotionPending?: boolean in MemberOfEdgeProperties present
- `src/engine/__tests__/factionQuestGeneration.test.ts`: CREATED (17 tests)
- `src/engine/__tests__/mercenaryPipeline.test.ts`: CREATED (5 tests)
- TypeScript: PASS (npx tsc --noEmit clean)
- Plan-specific tests: 82/82 pass (factionQuestGeneration + mercenaryPipeline + factionJoinPromotion + factionQuestAndReputation)
- Full suite: 7264 passed, 3 failed (all pre-existing from magical-lederberg)
- Vite build: PASS (built in 7.93s)
