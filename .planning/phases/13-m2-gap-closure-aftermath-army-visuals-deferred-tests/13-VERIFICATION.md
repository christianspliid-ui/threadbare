---
phase: 13-m2-gap-closure-aftermath-army-visuals-deferred-tests
verified: 2026-03-30T12:37:00Z
status: passed
score: 20/20 must-haves verified
re_verification: false
---

# Phase 13: M2 Gap Closure — Aftermath, Army Visuals, Deferred Tests Verification Report

**Phase Goal:** Close all M2 implementation gaps: implement aftermath sphere pressure and refugee generation in applyAftermath, complete 13 deferred .todo tests across battle/siege plans, and add HexMapV2 army visual layers (army sprites, battle indicators, siege indicators).

**Verified:** 2026-03-30T12:37:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Battle aftermath pushes sphere pressure event to pendingSpherePressures based on victor faction's dominant sphere | VERIFIED | `state.pendingSpherePressures.push(pressureEvent)` at line 295 of battleAftermath.ts; variable reads `factionAffinity.scores` to find dominant sphere |
| 2 | Sphere pressure magnitude scales by severity (minor 1.0, major 1.5, total 2.0) | VERIFIED | `AFTERMATH_PRESSURE_MULTIPLIERS: { minor: 1.0, major: 1.5, total: 2.0 }` exported at line 63; `AFTERMATH_BASE_PRESSURE * AFTERMATH_PRESSURE_MULTIPLIERS[severity]` at line 283 |
| 3 | Refugee generation is deferred — trace field refugeeEncountersGenerated is always 0 | VERIFIED | `refugeeEncountersGenerated: 0` at line 320 of battleAftermath.ts; test confirms it appears in trace |
| 4 | REFUGEE_GENERATION constants renamed to document deferred status | VERIFIED | `REFUGEE_GENERATION_MAJOR_DEFERRED` and `REFUGEE_GENERATION_TOTAL_DEFERRED` exist; grep for old name (without `_DEFERRED`) returns no matches |
| 5 | hasThreadToBattle returns true when ascendant has a thread edge to any battle participant | VERIFIED | Function traverses `thread` edges from ascendant, checks Set intersection with `[attackerArmyId, defenderArmyId, ...commanders]`; 7 tests pass |
| 6 | selectSpotlight returns a template ID deterministically for a given seed and battle state | VERIFIED | `selectSpotlight` uses seeded `rng()` index selection; determinism test in battleThreadVisibility.test.ts passes |
| 7 | selectSpotlight returns null when no templates are eligible | VERIFIED | Returns null when `hasThreadToBattle` returns false or `eligible.length === 0`; covered by 2 tests |
| 8 | All 7 .todo tests in battleThreadVisibility.test.ts converted to real tests | VERIFIED | `it.todo` count = 0; 7 `it(` calls confirmed; `npx vitest run` shows 7/7 passing |
| 9 | generateRegionalEncounters finds actors within SIEGE_REGIONAL_ENCOUNTER_RANGE hexes | VERIFIED | `hexDistance(siegePos, actorHexPos)` at line 392 of siegeResolution.ts; test for out-of-range passes |
| 10 | Allied faction actors get call_for_aid, Shadow-capable get smuggle_supplies, Heart-capable get negotiate_terms | VERIFIED | Priority order: faction allegiance → Shadow score → Heart score; 3 separate passing tests |
| 11 | No duplicate encounters per actor per siege; actors already in battles excluded | VERIFIED | `alreadyEncountered` Set checked; `battleState != null` skips actors; 2 passing tests confirm both |
| 12 | All 6 .todo tests in siegeRegionalEncounters.test.ts converted to real tests | VERIFIED | `it.todo` count = 0; 6 `it(` calls; 6/6 pass |
| 13 | Army shield icons visible at hero-local, regional, and continental zoom | VERIFIED | `ZoomVisibilityMatrix.ts armies: { 'hero-local': true, regional: true, continental: true, 'full-world': false }`; `useZoomLayerVisibility` reads matrix at lines 87-89 |
| 14 | Battle crossed-swords icon visible with pulsing animation on hexes with active battles | VERIFIED | `createBattleIndicatorMesh` creates Sprite per battle; `tickBattlePulse` exported with `BATTLE_PULSE_PERIOD_MS = 1200`; called in HexMapV2 animation loop at line 697-698 |
| 15 | Siege ring of shield icons visible around besieged settlements | VERIFIED | `createSiegeIndicatorMesh` places 6 icons at hex edge midpoints; `getSiegedHexKeys` for darkening |
| 16 | All army visual layers hidden at full-world zoom | VERIFIED | All three entries in ZOOM_VISIBILITY_MATRIX have `'full-world': false` |
| 17 | ArmySpriteMesh, BattleIndicatorMesh, SiegeIndicatorMesh wired into HexMapV2 | VERIFIED | HexMapV2.tsx imports from all three (lines 32, 34, 36); armyGroupRef/battleGroupRef/siegeGroupRef useRef declared; useEffect rebuilds on tick |
| 18 | RenderLayers.ts has ARMIES and BATTLE_INDICATOR Z constants | VERIFIED | `ARMIES: 0.090` at line 43; `BATTLE_INDICATOR: 6.050` at line 45 |
| 19 | All tests pass without regression | VERIFIED | `npm test`: 471 test files, 7033 tests passing, 0 failures |
| 20 | Production build succeeds | VERIFIED | `npx vite build` exits 0 in 7.96s (chunk size warning is pre-existing) |

**Score:** 20/20 truths verified

---

## Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `src/engine/battleAftermath.ts` | VERIFIED | Contains all required constants, sphere pressure push, and trace fields |
| `src/engine/__tests__/battleAftermath.test.ts` | VERIFIED | 26 tests (19 existing + 7 new), all passing |
| `src/engine/battleSpotlights.ts` | VERIFIED | Exports `hasThreadToBattle`, `selectSpotlight`, `SPOTLIGHT_TEMPLATES` (3 entries) |
| `src/engine/__tests__/battleThreadVisibility.test.ts` | VERIFIED | 7 real tests (was 7 `.todo`), all passing |
| `src/engine/siegeResolution.ts` | VERIFIED | Exports `generateRegionalEncounters`, `SiegeRegionalEncounter`, `SiegeRegionalEncounterType` |
| `src/engine/__tests__/siegeRegionalEncounters.test.ts` | VERIFIED | 6 real tests (was 6 `.todo`), all passing |
| `src/components/HexMapV2/scene/ArmySpriteMesh.ts` | VERIFIED | Exports `createArmySpriteMesh`, `ArmyRenderData`, `ARMY_SIZE_SMALL_MAX = 49` |
| `src/components/HexMapV2/scene/BattleIndicatorMesh.ts` | VERIFIED | Exports `createBattleIndicatorMesh`, `tickBattlePulse`, `BATTLE_PULSE_PERIOD_MS = 1200` |
| `src/components/HexMapV2/scene/SiegeIndicatorMesh.ts` | VERIFIED | Exports `createSiegeIndicatorMesh`, `getSiegedHexKeys`, `SIEGE_HEX_DARKEN_FACTOR` |
| `src/components/HexMapV2/scene/RenderLayers.ts` | VERIFIED | `ARMIES: 0.090` and `BATTLE_INDICATOR: 6.050` in `LAYER_Z` |
| `src/components/HexMapV2/scene/ZoomVisibilityMatrix.ts` | VERIFIED | `armies`, `battle_indicator`, `siege_ring` entries all present with correct boolean values |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `battleAftermath.ts` | `state.pendingSpherePressures` | `state.pendingSpherePressures.push(pressureEvent)` | WIRED | Line 295; only pushed when `settlementId` is set (fail-soft) |
| `battleSpotlights.ts` | `graph.getOutgoingEdges` | thread edge traversal (ascendant is source) | WIRED | `graph.getOutgoingEdges(ascendantId, 'thread')` at line 50 |
| `HexMapV2.tsx` | `ArmySpriteMesh.ts` | scene init + useEffect game state sync | WIRED | Import at line 32; `createArmySpriteMesh(armies!)` in useEffect at line 963 |
| `ZoomVisibilityMatrix.ts` | `HexMapV2.tsx` | `useZoomLayerVisibility` reads matrix | WIRED | `useZoomLayerVisibility.ts` reads `ZOOM_VISIBILITY_MATRIX.armies[tier]` at line 87; groups passed from HexMapV2.tsx lines 917-919 |
| `BattleIndicatorMesh.ts` | Animation loop | `tickBattlePulse` called each frame | WIRED | `tickBattlePulse(bGroup, clock.getElapsedTime() * 1000)` at HexMapV2.tsx lines 697-698 |
| `siegeResolution.ts` | `delivery.ts hexDistance` | range check for nearby actors | WIRED | `import { hexDistance } from './delivery'` at line 36; used at line 392 |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status |
|-------------|-------------|-------------|--------|
| GAP-01 | 13-01-PLAN.md | Aftermath sphere pressure injection | SATISFIED — `AFTERMATH_BASE_PRESSURE`, pressure multipliers, and push to `pendingSpherePressures` all present and tested |
| GAP-02 | 13-01-PLAN.md | Refugee trace stub (deferred) | SATISFIED — `REFUGEE_GENERATION_*_DEFERRED` constants; `refugeeEncountersGenerated: 0` in emitTrace; tested |
| GAP-03 | 13-02-PLAN.md | hasThreadToBattle implementation | SATISFIED — function implemented in `battleSpotlights.ts` with correct thread edge direction; 4 tests |
| GAP-04 | 13-02-PLAN.md | selectSpotlight implementation | SATISFIED — deterministic seeded selection from filtered template pool; 3 tests |
| GAP-05 | 13-03-PLAN.md | generateRegionalEncounters in siegeResolution.ts | SATISFIED — full implementation with range filter, faction/sphere priority, deduplication, battle exclusion; 6 tests |
| GAP-06 | 13-04-PLAN.md | Army visual layers (ArmySpriteMesh) | SATISFIED — InstancedMesh shield sprites with faction color and size scaling; wired into HexMapV2 |
| GAP-07 | 13-04-PLAN.md | Battle/siege indicators (BattleIndicatorMesh + SiegeIndicatorMesh) | SATISFIED — pulsing battle icon and 6-icon siege ring; both wired with zoom visibility gating |

All 7 requirements satisfied. No orphaned requirements found — all GAP IDs defined in ROADMAP.md line 251.

---

## Anti-Patterns Found

None. Scanned all modified/created files for TODO/FIXME/placeholder comments, empty implementations, and stub patterns. The `@deprecated` JSDoc on `REFUGEE_GENERATION_*_DEFERRED` constants is intentional documentation, not an anti-pattern.

---

## Human Verification Required

### 1. Army Visual Rendering on Live Map

**Test:** Start dev server at `http://localhost:5173/?view=game`, advance 30-50 ticks (via CLI `npm run cli` then `tick 50`), zoom to a hex with an army.
**Expected:** Faction-colored shield icon visible on the army hex; icon scales with army size (small/medium/large). At full-world zoom, icon disappears.
**Why human:** Three.js WebGL canvas content cannot be inspected by automated tools (Playwright sees blank canvas). Human visual confirmation already recorded as approved in 13-04-SUMMARY.md (Task 3 checkpoint).

_Note: The SUMMARY documents the human verify checkpoint as "approved by user" with no visual issues found._

---

## Summary

Phase 13 achieved its goal completely. All four plans delivered:

- **Plan 01 (GAP-01, GAP-02):** `applyAftermath` now pushes `SpherePressureEvent` to `state.pendingSpherePressures` with the victor faction's dominant sphere, scaled by severity (1.0/1.5/2.0). Refugee generation deferred cleanly with renamed `*_DEFERRED` constants and `refugeeEncountersGenerated: 0` trace field. 7 new passing tests.

- **Plan 02 (GAP-03, GAP-04):** `battleSpotlights.ts` created with `hasThreadToBattle` (thread edge traversal) and `selectSpotlight` (seeded deterministic template selection). All 7 previously-deferred `.todo` tests converted to passing real tests.

- **Plan 03 (GAP-05):** `generateRegionalEncounters` added to `siegeResolution.ts` — scans actors within `SIEGE_REGIONAL_ENCOUNTER_RANGE` hexes, assigns `call_for_aid` / `smuggle_supplies` / `negotiate_terms` encounters by faction allegiance and sphere capability. All 6 previously-deferred `.todo` tests converted to passing real tests.

- **Plan 04 (GAP-06, GAP-07):** Three new HexMapV2 scene modules (`ArmySpriteMesh`, `BattleIndicatorMesh`, `SiegeIndicatorMesh`) created and wired into HexMapV2.tsx. RenderLayers and ZoomVisibilityMatrix extended. All three layers respect zoom visibility (hidden at full-world). Battle pulse animation runs at 1200ms period. Human verification checkpoint approved.

Total test count: 471 test files, 7033 tests passing. Production build clean.

---

_Verified: 2026-03-30T12:37:00Z_
_Verifier: Claude (gsd-verifier)_
