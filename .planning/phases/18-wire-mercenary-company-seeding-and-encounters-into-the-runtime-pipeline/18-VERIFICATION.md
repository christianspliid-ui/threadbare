---
phase: 18-wire-mercenary-company-seeding-and-encounters-into-the-runtime-pipeline
verified: 2026-03-30T14:52:00Z
status: human_needed
score: 9/9 must-haves verified
re_verification: false
human_verification:
  - test: "Load game at ?view=game and inspect the hex map for two visible army markers at distant settlements"
    expected: "Two distinct army markers appear on the map at geographically distant settlements (Iron Wolves and Scarlet Company locations)"
    why_human: "WebGL canvas not inspectable by automated tests; army signifiers rendered by Three.js InstancedMesh cannot be verified programmatically"
  - test: "Move avatar to a settlement containing a mercenary company hall. Check the encounter drawer."
    expected: "mc.join encounter candidate appears in the encounter drawer for an agent without an existing member_of edge to that company"
    why_human: "Requires full game UI flow — encounter candidate presentation in ActionDrawer not covered by unit tests"
---

# Phase 18: Wire Mercenary Company Seeding and Encounters Verification Report

**Phase Goal:** Wire mercenary company seeding and encounters into the runtime pipeline — connect authored content to live pipeline: seed 2 opposing companies at distant settlements, populate encounter cache with mc.* templates, wire rank-gated encounter filtering, reputation tracking through existing factionReputation, auto-triggered promotion encounters, and spawning 1 army per company.

**Verified:** 2026-03-30T14:52:00Z
**Status:** human_needed (all automated checks pass; 2 items require human verification)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Two distinct mercenary company faction nodes exist in the graph after world seeding | VERIFIED | `seedAllFactions` handles `instanceCount: 2` in `factionSeeding.ts` lines 350-395; worldSeed.ts filters `faction_def_mercenary_company_*` results at line 869; factionSeeding.test.ts test "seedAllFactions creates two instances" passes |
| 2 | The two companies are placed at maximum-distance qualifying settlements | VERIFIED | `findMaxDistancePair` exported at line 134 of factionSeeding.ts; `distanceConstrained: true` + `instanceCount: 2` set on `MERCENARY_COMPANY_DEFINITION` lines 48-49; test "findMaxDistancePair selects the most distant pair" passes |
| 3 | Each company has a resource_acquisition ambition node connected via pursues edge | VERIFIED | worldSeed.ts lines 879-898 create ambition node + pursues edge per company; factionSeeding.test.ts "post-seeding pattern" test verifies ambition creation |
| 4 | Each company has one army node at its primary hall location | VERIFIED | worldSeed.ts lines 958-965 call `spawnArmy(seedTimeState, result.factionId, commanderId, ambitionId)` per company; commander's `located_at` edge wired at lines 934-941 so spawnArmy can resolve spawn point |
| 5 | factionAmbitions phase processes seeded factions (factionDefId key mismatch fixed) | VERIFIED | factionAmbitions.ts line 149 reads `faction.properties.factionDefId ?? faction.properties.factionDefinitionId`; factionAmbitions.test.ts updated to use `factionDefId`; 54/54 tests pass |
| 6 | Agent with mc member_of edge receives mc.quest.* encounter candidates | VERIFIED | `getAccessibleTemplates` in factionQuestGeneration.ts lines 127-141 uses `[...FACTION_ENCOUNTER_META.entries()].filter(...)` covering both ag.* and mc.* templates; factionQuestGeneration.test.ts "sellsword rank gets mc.quest.* only" passes |
| 7 | Rank-gated filtering prevents sellsword-rank agents from seeing mc.senior.* templates | VERIFIED | `encounterAccess` prefix matching in `getAccessibleTemplates` lines 136-141; factionQuestGeneration.test.ts "sergeant_at_arms rank gets mc.quest.* AND mc.senior.*" and "non-member gets no mc.quest.*" tests pass |
| 8 | Agent whose reputation crosses a rank threshold gets mc.promotion at elevated priority 9.0 | VERIFIED | factionReputation.ts lines 75-76 set `promotionPending: true` on rank increase; factionQuestGeneration.ts lines 229-244 inject mc.promotion at `questPriority: 9.0` when `promotionPending=true`; test "promotionPending=true injects at priority 9.0" passes |
| 9 | Completing mc.quest.* encounter step increments reputation on member_of edge | VERIFIED | factionReputation.ts `processFactionEncounterReputation` applies `reputationReward` from FACTION_ENCOUNTER_META; factionQuestGeneration.test.ts "mc.quest.* step increments reputation" and "mc.promotion completion clears promotionPending" tests pass |

**Score:** 9/9 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/engine/factionSeeding.ts` | `instanceSuffix`, `findMaxDistancePair`, multi-instance `seedAllFactions` | VERIFIED | `instanceSuffix` at line 189, `findMaxDistancePair` exported at line 134, multi-instance loop at lines 350-395 |
| `src/engine/worldSeed.ts` | Post-seeding wiring: distance placement, static ambition, army spawn | VERIFIED | `spawnArmy` import at line 40, `MC_COMPANY_NAMES` import at line 39, post-seeding block at lines 859-966 with `findMaxDistancePair` visible via `distanceConstrained` path in factionSeeding |
| `src/engine/factionAmbitions.ts` | Fixed property key lookup using `factionDefId` | VERIFIED | Line 149 reads `factionDefId` with `factionDefinitionId` as legacy fallback |
| `src/data/mercenary-company-definition.ts` | `MC_COMPANY_NAMES` constant, `instanceCount: 2`, `distanceConstrained: true`, no `flesh` reach | VERIFIED | `MC_COMPANY_NAMES` at line 24, `instanceCount: 2` at line 48, `distanceConstrained: true` at line 49, no `flesh` in `reachWeights` (lines 38-47) |
| `src/engine/factionQuestGeneration.ts` | `FACTION_ENCOUNTER_META.entries()` search, `sublocationTypeId` detection, per-faction template resolution | VERIFIED | `FACTION_ENCOUNTER_META` import at line 25, entries search at lines 136-141, `sublocationTypeId` check at line 171, `joinEncounterTemplateId` / `promotionEncounterTemplateId` resolution at lines 201, 221 |
| `src/engine/factionReputation.ts` | `promotionPending: true` on rank increase, `promotionPending: false` on promotion completion | VERIFIED | Lines 75-76 set flag on rank increase; lines 203-209 clear flag on promotion completion |
| `src/types/disposition.ts` | `promotionPending?: boolean` on `MemberOfEdgeProperties` | VERIFIED | Line 112 `promotionPending?: boolean` |
| `src/engine/__tests__/factionQuestGeneration.test.ts` | 17 tests for mc.* quest generation, rank gating, join/promotion lifecycle, reputation-via-encounter | VERIFIED | File exists, 360 lines, 17 `it()` blocks confirmed |
| `src/engine/__tests__/mercenaryPipeline.test.ts` | 5 integration tests for join-quest-promote pipeline | VERIFIED | File exists, 205 lines, 5 `it()` blocks confirmed |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/engine/factionSeeding.ts` | `src/engine/worldSeed.ts` | `seedAllFactions` returns multiple instances for `instanceCount > 1` | WIRED | worldSeed.ts imports and calls `seedAllFactions` at line 851; result filtered for merc instances at line 869 |
| `src/engine/worldSeed.ts` | `src/engine/armySpawning.ts` | Direct `spawnArmy` call at seed time per merc company | WIRED | `spawnArmy` imported at line 40, called at line 964 within merc post-seeding block |
| `src/engine/factionQuestGeneration.ts` | `src/data/faction-encounter-content.ts` | `FACTION_ENCOUNTER_META` + `getFactionEncounterById` | WIRED | Both imported at lines 25 and 28; `FACTION_ENCOUNTER_META.entries()` used in `getAccessibleTemplates` line 136; `getFactionEncounterById` used at lines 140, 201, 221 |
| `src/engine/factionQuestGeneration.ts` | `src/data/mercenary-encounter-content.ts` | mc.* templates included through unified meta registry | WIRED | `FACTION_ENCOUNTER_META` in `faction-encounter-content.ts` spreads `MERCENARY_ENCOUNTER_META` at line 58; `getFactionEncounterById` delegates to `getMercenaryEncounterById` at line 768 |
| `src/engine/factionReputation.ts` | `member_of` edge | Reputation increment + `promotionPending` flag on rank change | WIRED | `graph.updateEdge` with `promotionPending: true` at lines 74-76; flag cleared at lines 207-209 |

---

### Requirements Coverage

MERC-01 through MERC-09 are phase-internal requirement IDs. They are not registered in `.planning/REQUIREMENTS.md` (which tracks only hex map V2 requirements — RNDR, WGEN, WATR, TERR, REGN, COMP, LOCN, AGNT, UI). No orphaned requirements exist in REQUIREMENTS.md for this phase.

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MERC-01 | 18-01-PLAN | Two-company seeding via generic seedAllFactions path | SATISFIED | `instanceCount: 2` + `distanceConstrained: true` on definition; multi-instance loop in `seedAllFactions` |
| MERC-02 | 18-01-PLAN | Maximum-distance placement between the two companies | SATISFIED | `findMaxDistancePair` exported and called when `distanceConstrained: true` |
| MERC-03 | 18-01-PLAN | factionDefId property key mismatch fixed in factionAmbitions | SATISFIED | Dual-key read at factionAmbitions.ts line 149 |
| MERC-04 | 18-01-PLAN | Static resource_acquisition ambition + pursues edge per company | SATISFIED | worldSeed.ts lines 879-898 |
| MERC-05 | 18-01-PLAN | One army per company at primary hall location | SATISFIED | `spawnArmy` called per company at worldSeed.ts line 964 |
| MERC-06 | 18-02-PLAN | mc.* quest candidates accessible to mc members | SATISFIED | `FACTION_ENCOUNTER_META.entries()` search in `getAccessibleTemplates` |
| MERC-07 | 18-02-PLAN | Rank-gated filtering via encounterAccess prefix patterns | SATISFIED | Prefix filter in `getAccessibleTemplates` lines 136-141 |
| MERC-08 | 18-02-PLAN | Auto-triggered promotion encounter with elevated priority | SATISFIED | `promotionPending` flag + 9.0 priority injection in factionQuestGeneration |
| MERC-09 | 18-02-PLAN | Reputation tracking through existing factionReputation on mc encounter completion | SATISFIED | `processFactionEncounterReputation` applies `reputationReward` from FACTION_ENCOUNTER_META |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/engine/worldSeed.ts` | 859, 865-866, 901 | "placeholder" in comments | Info | Intentional design decision — commanders are explicitly seeded as capability-bare placeholders pending full agent generation. Not a stub; documented in SUMMARY.md under decisions. No action required. |

No blockers or warnings found.

---

### Human Verification Required

#### 1. Army markers on hex map

**Test:** Start the game at `?view=game`. Pan the map to locate settlements. Check for two distinct army markers at geographically distant settlement locations.
**Expected:** Two army markers visible — one for "The Iron Wolves" and one for "The Scarlet Company" — at settlements that are far apart on the map.
**Why human:** WebGL canvas content (Three.js InstancedMesh army signifiers) is not inspectable by automated tools. Playwright `preview_snapshot` cannot see canvas content. Use Claude in Chrome or manual browser inspection.

#### 2. mc.join candidate in encounter drawer

**Test:** Move the avatar to a settlement containing a mercenary company guild hall. Open the action drawer or check available encounters.
**Expected:** An mc.join encounter candidate appears for the agent if they are not already a member of that company.
**Why human:** Requires live game UI flow — encounter candidate presentation depends on avatar location, hall detection, and ActionDrawer rendering. The unit tests verify the logic; this confirms the full UI wiring.

---

### Gaps Summary

No gaps. All 9 must-have truths are verified. All required artifacts exist at all three levels (exist, substantive, wired). All key links confirmed. All 9 MERC requirements satisfied. The 3 failing tests in the full suite (`tickHealth-integration`, `traceBuffer-integration`, `contracts/encounter-liveness`) are pre-existing failures from the magical-lederberg branch merge documented in 18-01-SUMMARY.md — they predate Phase 18 and are out of scope.

Phase goal is achieved. Two human-only verification items remain for visual confirmation of the hex map army markers and in-game encounter flow.

---

_Verified: 2026-03-30T14:52:00Z_
_Verifier: Claude (gsd-verifier)_
