---
phase: 10-sphere-affinity
verified: 2026-03-28T21:12:00Z
status: passed
score: 14/15 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 12/15
  gaps_closed:
    - "HexChronicle Soul layer bridge: getHexSphereInfluence now reads sphereAffinity.scores and normalizes to 0-1 float"
    - "ProseKeyword tooltips unblocked: Soul layer now receives non-zero sphere influence data for seeded hexes"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Navigate to localhost:5173/?view=game, click a hex, open HexChronicle"
    expected: "Soul paragraph with colored sphere keywords should appear describing the hex's sphere character"
    why_human: "Visual confirmation that Soul layer now displays prose with non-zero sphere influence data after the bridge fix"
  - test: "Hover over a sphere keyword in the Soul paragraph"
    expected: "Tooltip appears with narrative sphere description"
    why_human: "Dependent on Soul layer having rendered content (unblocked by gap closure)"
  - test: "Open DebugPanel, navigate to Sphere State tab, verify it shows sphere scores with colored bars"
    expected: "8 sphere scores listed per entity with colored progress bars"
    why_human: "Tab location and visual rendering requires human confirmation"
---

# Phase 10: Sphere Affinity Verification Report

**Phase Goal:** Per-entity sphere affinity data model + pressure resolution — the connective tissue that makes every hex, agent, artifact, and location unique via sphere character. Infrastructure that armies, economy, doom effects, and magic all plug into.
**Verified:** 2026-03-28T21:12:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (Plan 10-08)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every hex graph node has a sphereAffinity property after initialization | PARTIAL | No hex-type graph nodes exist; hex affinities stored in Map during init; location and actor nodes seeded correctly (architectural note — see below) |
| 2 | Every agent (actor) graph node has sphereAffinity seeded from archetype | VERIFIED | gameInit.ts seeds all actor nodes at lines 156-173 |
| 3 | Every location graph node has sphereAffinity inheriting from hex + type bias | VERIFIED | gameInit.ts seeds all location nodes at lines 139-154 |
| 4 | Triangle cost math correct: triangleCost(N)=N, triangleTotal(N)=N*(N+1)/2 | VERIFIED | 36 tests in sphereAffinity.test.ts pass |
| 5 | Sphere pressure events consumed and resolved each tick by phaseSpherePressure | VERIFIED | orchestrator.ts lines 1139-1144; pendingSpherePressures cleared after phase |
| 6 | Opposition pairs cancel before threshold comparison | VERIFIED | cancelOppositions() exported and tested (28 tests pass) |
| 7 | Erosion, construction, and allied defense all implemented | VERIFIED | resolveSpherePressure() implements all 4 outcomes; tested |
| 8 | Global aggregate computed from all entity sphere scores | VERIFIED | phaseSphereAggregation wired at orchestrator line 1144; 17 tests pass |
| 9 | FundamentState.sphereWeights populated from aggregate | VERIFIED | phaseSphereAggregation updates worldSoul.fundament.sphereWeights |
| 10 | All 6 upstream sources push SpherePressureEvents | VERIFIED | control, doom, mandate (phase files); actions (unifiedActionResolution.ts); encounter + rival (orchestrator.ts lines 423, 709) |
| 11 | Prosperity and encounter scoring modified by sphere scores | VERIFIED | phaseProsperity.ts has PROSPERITY_LIFE_BONUS/CAP; encounterScoring.ts has ENCOUNTER_RESONANCE_MULTIPLIER; 23 tests pass |
| 12 | Agent axiological profile shifts based on dominant sphere | VERIFIED | encounterScoring.ts resolveProfile() calls getDominantSphere + applyAxiologicalShift |
| 13 | magicPower pure functions implemented (computeEffectivePower, resolveOverchannel, shouldAgentOverchannel) | VERIFIED | magicPower.ts 144 lines; 32 tests pass; wiring to phaseUnifiedActionProgress explicitly deferred per plan note |
| 14 | HexChronicle has a Soul layer paragraph describing hex sphere character | VERIFIED | getHexSphereInfluence() updated (Plan 08) to read sphereAffinity.scores / MAX_SPHERE_SCORE; 22 hexZoom tests pass including 9 new normalization/clamping/legacy-fallback cases |
| 15 | ProseKeyword tooltips appear on hover/focus | VERIFIED (human needed) | ProseKeyword component correctly implemented; Soul layer now receives non-zero data; visual tooltip behavior requires human confirmation |

**Score:** 14/15 truths verified (1 architectural partial, all blocker gaps closed)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types/sphereAffinity.ts` | SphereAffinity interface, all constants, triangle math | VERIFIED | 249 lines; all required exports present |
| `src/engine/sphereAffinity.ts` | Seeding functions, getDominantSphere, axiological map | VERIFIED | 166 lines; all required exports present |
| `src/engine/__tests__/sphereAffinity.test.ts` | 36 unit tests | VERIFIED | 36/36 passing |
| `src/engine/phaseSpherePressure.ts` | Pressure resolution engine + orchestrator phase | VERIFIED | 441 lines; all required exports present |
| `src/engine/phaseSphereAggregation.ts` | Aggregation phase + ENTITY_AGGREGATE_WEIGHT | VERIFIED | 225 lines; all required exports present |
| `src/__tests__/engine/phaseSpherePressure.test.ts` | Pressure resolution algebra tests | VERIFIED | 28/28 passing |
| `src/__tests__/engine/phaseSphereAggregation.test.ts` | Aggregation and backward compat tests | VERIFIED | 17/17 passing |
| `src/__tests__/engine/sphereModifiers.test.ts` | Downstream modifier tests | VERIFIED | 23/23 passing |
| `src/__tests__/engine/spherePressureWiring.test.ts` | Contract tests for upstream phases | VERIFIED | 7/7 passing |
| `src/engine/magicPower.ts` | Magic power pure functions | VERIFIED | 144 lines; computeEffectivePower, resolveOverchannel, shouldAgentOverchannel all exported |
| `src/__tests__/engine/magicPower.test.ts` | Magic power tests | VERIFIED | 32/32 passing |
| `src/components/ProseKeyword.tsx` | IPK component with sphere-colored tooltips | VERIFIED | 162 lines; role="term", tabIndex=0, SPHERE_TOOLTIPS integrated |
| `src/components/WorldSoulIndicator.tsx` | Prose status line from aggregate | VERIFIED | 74 lines; reads aggregate.dominantSphere |
| `src/data/sphereTooltips.ts` | SPHERE_TOOLTIPS + FOUNDATION_TOOLTIPS | VERIFIED | All 8 spheres; FOUNDATION_TOOLTIPS present |
| `src/data/worldSoulProse.ts` | 32 prose entries (8 spheres x 4 intensities) | VERIFIED | whisper/murmur/pulse/storm for all 8 spheres |
| `src/data/hexSoulProse.ts` | SOUL_PROSE, SOUL_SECONDARY_PROSE, SOUL_THREAT_PROSE | VERIFIED | 136 lines; all three registries present |
| `src/engine/hexZoom.ts` | getHexSphereInfluence reads sphereAffinity.scores | VERIFIED | Lines 64-77: Phase 10 path reads scores[s] / MAX_SPHERE_SCORE; legacy fallback retained; aggregated values clamped to 1.0 |
| `src/engine/__tests__/hexZoom.test.ts` | 22 tests including 9 new normalization cases | VERIFIED | 22/22 passing — normalization, max-score, aggregation, fail-soft, all-zeros, clamping, legacy-fallback |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/engine/orchestrator.ts` | `phaseSpherePressure` | Import + call at line 1139 | WIRED | Confirmed present |
| `src/engine/orchestrator.ts` | `phaseSphereAggregation` | Import + call at line 1144 | WIRED | Confirmed present |
| `src/engine/sphereAffinity.ts` | `src/engine/gameInit.ts` | seedHexSphereAffinity, seedAgentSphereAffinity, seedLocationSphereAffinity called | WIRED | Lines 124-173 in gameInit.ts |
| `src/engine/phaseControlEffects.ts` | `pendingSpherePressures` | SpherePressureEvent pushed | WIRED | Lines 108, 326 |
| `src/engine/phaseDoom.ts` | `pendingSpherePressures` | SpherePressureEvent pushed on tier change | WIRED | Lines 38, 75 |
| `src/engine/phaseMandate.ts` | `pendingSpherePressures` | SpherePressureEvent pushed on milestone | WIRED | Lines 61, 107 |
| `src/engine/unifiedActionResolution.ts` | `pendingSpherePressures` | SpherePressureEvent on action resolution | WIRED | Line 445 |
| `src/engine/orchestrator.ts` (encounter) | `pendingSpherePressures` | SpherePressureEvent on encounter step | WIRED | Line 423 |
| `src/engine/orchestrator.ts` (rival) | `pendingSpherePressures` | SpherePressureEvent on rival action | WIRED | Line 709 |
| `src/components/Game/GameView.tsx` | `WorldSoulIndicator` | Rendered at line 873 | WIRED | `<WorldSoulIndicator aggregate={gameState.worldSoul.aggregate} />` |
| `src/components/WorldSoulIndicator.tsx` | `state.worldSoul.aggregate` | reads aggregate.dominantSphere | WIRED | Confirmed |
| `src/engine/hexZoom.ts:getHexSphereInfluence` | `sphereAffinity.scores` | Reads node.properties.sphereAffinity.scores / MAX_SPHERE_SCORE | WIRED | Fixed in Plan 08; legacy fallback preserved for sphereInfluence/sphereBiases |
| `src/components/Game/hooks/useHexZoomData.ts` | `getHexSphereInfluence` | Called at line 71; returned as hexSphereInfluence | WIRED | Confirmed — feeds into GameView.tsx sphereInfluence prop |
| `src/components/Game/GameView.tsx` | `HexChronicle` | sphereInfluence={hexSphereInfluence} at line 1069 | WIRED | Full data path confirmed: hexZoom.ts -> useHexZoomData -> GameView -> HexChronicle |

### Requirements Coverage

No SPHR-* requirements were found in `.planning/REQUIREMENTS.md` (that file covers Hex Map V2 only). Requirements were declared in plan frontmatter only.

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SPHR-01 to 03, 08 | 10-01 | SphereAffinity data model, types, entity seeding | SATISFIED | sphereAffinity.ts, gameInit.ts, 36 passing tests |
| SPHR-04 to 10, 15, 16, 26, 27 | 10-02 | Pressure resolution, aggregation, orchestrator wiring | SATISFIED | phaseSpherePressure.ts, phaseSphereAggregation.ts, orchestrator wiring confirmed |
| SPHR-11 | 10-03, 10-03b | All 6 upstream phases push pressure events | SATISFIED | All 6 sources verified in codebase |
| SPHR-12 to 14 | 10-04 | Downstream modifiers (prosperity, encounter, agent) | SATISFIED | phaseProsperity.ts, encounterScoring.ts, sphereAffinity.ts |
| SPHR-23 to 25 | 10-05 | Magic power as sphere fluency (pure functions) | SATISFIED (wiring deferred) | magicPower.ts pure functions implemented; wiring to action phase explicitly deferred per plan note |
| SPHR-17, 19 | 10-08 | HexChronicle Soul bridge + ProseKeyword unblock | SATISFIED | getHexSphereInfluence reads sphereAffinity.scores; full data path wired; 22 tests pass |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/engine/magicPower.ts` | 15 | `Wiring into phaseUnifiedActionProgress is deferred` | Info | Intentional and documented in plan 05 frontmatter; pure functions ready for future wiring |

### Human Verification Required

### 1. HexChronicle Soul Layer Content

**Test:** Start dev server (`npm run dev`), open `?view=game`, click any non-ocean hex
**Expected:** Soul paragraph appears under "The Soul" section with bold, sphere-colored keywords (e.g., "The currents of **Life** run through this land.")
**Why human:** The bridge fix is verified programmatically (22 tests pass, data path confirmed end-to-end); visual rendering of the prose in the actual game UI requires human confirmation

### 2. ProseKeyword Tooltip Behavior

**Test:** If Soul paragraph has sphere keywords, hover over one
**Expected:** Tooltip appears with narrative description (e.g., "The sphere of growth, healing, and abundance...")
**Why human:** Component is correctly implemented and data path is now wired; tooltip interaction behavior requires human confirmation

### 3. DebugPanel Sphere State Tab

**Test:** Open DebugPanel (find the toggle in the game chrome), navigate to "Sphere State" tab
**Expected:** 8 sphere scores listed with colored progress bars, dominant sphere highlighted, global aggregate stats shown
**Why human:** Tab is last in the debug panel; user may need to locate the debug panel toggle

## Gap Closure Summary

**Both gaps identified in initial verification are closed.**

**Gap 1 — HexChronicle Soul bridge (SPHR-17):** `getHexSphereInfluence()` in `src/engine/hexZoom.ts` was rewritten in Plan 08. The function now reads `node.properties.sphereAffinity.scores` and normalizes by dividing by `MAX_SPHERE_SCORE=10`, producing 0-1 floats that the HexChronicle Soul layer expects. Legacy `sphereInfluence`/`sphereBiases` properties are preserved as a fail-soft fallback for any pre-Phase-10 nodes. Aggregated values are clamped to 1.0. The fix is covered by 9 new dedicated test cases (22 total in hexZoom.test.ts, all passing). The full data path `hexZoom.ts -> useHexZoomData.ts -> GameView.tsx -> HexChronicle.tsx` is confirmed wired end-to-end.

**Gap 2 — ProseKeyword tooltips (SPHR-19):** These were blocked by Gap 1. The ProseKeyword component itself was always correctly implemented (role="term", tabIndex=0, SPHERE_TOOLTIPS wired). With the Soul layer now receiving non-zero sphere influence data, ProseKeyword tooltips are unblocked. Visual confirmation requires human testing.

**Architectural note — hex graph nodes (Truth #1):** This partial truth remains unchanged. The plan stated "every hex graph node has a sphereAffinity property" but hex tiles are not graph nodes in this codebase. The implementation correctly adapted to the actual architecture: hex sphere affinities are computed during init and propagated to location nodes (which are graph nodes) via inheritance. This is a truth mismatch against the literal plan wording, but the underlying goal — hex character encoded as sphere scores accessible through graph nodes — is achieved through location nodes. This is not a blocker; it is an architectural clarification.

---

_Initial verification: 2026-03-28T20:55:00Z_
_Re-verified: 2026-03-28T21:12:00Z_
_Verifier: Claude (gsd-verifier)_
