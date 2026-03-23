---
phase: 06-locations-agents
verified: 2026-03-22T15:42:00Z
status: gaps_found
score: 3/5 success criteria verified
gaps:
  - truth: "Major locations suppress terrain signifiers on their hex (a city replaces tree icons)"
    status: failed
    reason: "resolveHexComposition is never called from the rendering pipeline. LocationIconMesh and SignifierMesh operate as independent sprite groups — suppression logic in compositionResolver.ts is isolated to test coverage only."
    artifacts:
      - path: "src/components/HexMapV2/signifiers/compositionResolver.ts"
        issue: "Function exists and is correct but has zero non-test callers"
      - path: "src/components/HexMapV2/scene/LocationIconMesh.ts"
        issue: "Does not call resolveHexComposition — renders independently of signifier layer"
      - path: "src/components/HexMapV2/scene/SignifierMesh.ts"
        issue: "Does not call resolveHexComposition — no awareness of location occupancy"
    missing:
      - "A per-hex composition pass in HexMapV2 or in SignifierMesh that queries which hexes have major locations and suppresses their signifiers"
      - "LocationIconMesh must register a HexVisualManifest with suppresses=[{target:'terrain-signifier',when:'always'}] for major (full/medium) size classes"
  - truth: "Activity indicator icons render below agent portraits at hero-local zoom"
    status: failed
    reason: "activityIndicatorRegistry.ts and buildActivityIconTextureCache exist but are never imported or called from HexMapV2.tsx — no activity sprites are added to the scene."
    artifacts:
      - path: "src/components/HexMapV2/agents/activityIndicatorRegistry.ts"
        issue: "ACTIVITY_ICON_REGISTRY and buildActivityIconTextureCache are orphaned — no callers outside tests"
    missing:
      - "Import buildActivityIconTextureCache in HexMapV2.tsx"
      - "Create activityGroup (THREE.Group at RENDER_ORDER.AGENTS) with sprites positioned below agent portraits"
      - "Wire activityGroup.visible = k >= AGENT_ZOOM_THRESHOLDS.HERO_LOCAL in zoom handler"
  - truth: "Event indicators render at RENDER_ORDER.EVENTS (10) with fade-in/fade-out"
    status: failed
    reason: "eventIndicatorRegistry.ts and buildEventIconTextureCache exist but are never imported or called from HexMapV2.tsx — no event sprites are added to the scene."
    artifacts:
      - path: "src/components/HexMapV2/agents/eventIndicatorRegistry.ts"
        issue: "EVENT_ICON_REGISTRY, EVENT_ANIMATION_PARAMS, and buildEventIconTextureCache are orphaned — no callers outside tests"
    missing:
      - "Import buildEventIconTextureCache in HexMapV2.tsx"
      - "Add events?: HexEventData[] prop to HexMapV2Props and HexV2ViewProps"
      - "Create eventGroup (THREE.Group at RENDER_ORDER.EVENTS) with per-hex sprites and fade animation state"
      - "Wire EVENT_ANIMATION_PARAMS fade-in/fade-out into render loop (tickAgentAnimations or a new tickEventAnimations)"
human_verification:
  - test: "Inspect location icons at regional zoom"
    expected: "Black silhouette icons appear at city/town/castle positions with name labels below"
    why_human: "Requires visual inspection of SVG path quality — are icons recognizable as their type at assigned size class?"
  - test: "Zoom to hero-local (k >= 15) with agents on the map"
    expected: "Agents show as circular portrait thumbnails with colored rings; retinue agent shows gold ring"
    why_human: "Portrait loading is async — need to verify the async load and texture swap actually renders correctly"
  - test: "Watch an agent move between hexes"
    expected: "Agent visibly hops along a curved bezier path over 800ms with a settle bounce, leaving a 2-second fading trail"
    why_human: "Animation is render-loop based — can only verify with live scene"
---

# Phase 6: Locations & Agents Verification Report

**Phase Goal:** Settlements, POIs, and agents are visible on the map with faction colors, status indicators, and movement animation
**Verified:** 2026-03-22T15:42:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Cities, temples, ruins, and other locations display as recognizable black silhouette icons with name labels | VERIFIED | LocationIconMesh creates sprites at renderOrder=8; LocationLabelOverlay with importance-based fonts; 17 production SVG paths in registry; 7 LocationIconMesh tests pass |
| 2 | Agents appear as circular portrait thumbnails at hero-local zoom and colored dots at regional zoom | VERIFIED | AgentSpriteMesh creates 3-tier groups (portrait k>=15, dot k>=5, continental k>=1.5); updateZoomVisibility toggles correctly; 18 AgentSpriteMesh tests pass |
| 3 | Retinue agents are instantly distinguishable from other agents by their gold/white border | VERIFIED | RETINUE_BORDER_COLOR='#d4a040', RETINUE_BORDER_ALT_COLOR='rgba(255,255,255,0.9)'; buildRetinueDotTexture draws gold ring; agentSpriteTypes tests verify constants |
| 4 | When an agent moves, it visually hops along a bezier curve from source to destination hex | VERIFIED | tickAgentAnimations+updateTrails called every frame in render loop; startMoveAnimation+addTrailSegment called in agents useEffect diff; 16 agentAnimationState tests pass; TRAIL_FADE_DURATION=2000 confirmed |
| 5 | Major locations suppress terrain signifiers on their hex (a city replaces tree icons) | FAILED | compositionResolver.ts has correct suppression logic but resolveHexComposition has zero non-test callers. LocationIconMesh and SignifierMesh are fully independent — suppression never executes at runtime |

**Score: 3/5 success criteria verified**

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/HexMapV2/locations/locationIconRegistry.ts` | 17 LocationType entries with production SVG paths | VERIFIED | 17 types defined; CAPITAL_PATHS through UNEXPLORED_POI_PATHS all reference named path variables; no placeholder comments |
| `src/components/HexMapV2/locations/locationIconTextures.ts` | buildLocationIconTexture, buildLocationIconTextureCache | VERIFIED | Exports confirmed; follows signifierTextures pattern |
| `src/components/HexMapV2/scene/LocationIconMesh.ts` | createLocationIconMesh, LOCATION_ICON_Z=0.08 | VERIFIED | Exports confirmed; renders at RENDER_ORDER.LOCATIONS (8); capital ring at z+0.001; fail-soft skip for unknown types |
| `src/components/HexMapV2/overlay/LocationLabelOverlay.tsx` | LocationLabelOverlay with importance font hierarchy | VERIFIED | Importance-based font sizes; pointer-events: none; zoom visibility rules |
| `src/components/HexMapV2/agents/agentSpriteTypes.ts` | AgentRenderData, FACTION_HERALDIC_COLORS[6], RETINUE_BORDER_COLOR | VERIFIED | All exports present with correct values; 13 tests pass |
| `src/components/HexMapV2/agents/agentPortraitTextures.ts` | loadPortraitTexture, buildFactionDotTexture, buildRetinueDotTexture | VERIFIED | All exports present; fail-soft portrait fallback; 10 tests pass |
| `src/components/HexMapV2/scene/AgentSpriteMesh.ts` | createAgentSpriteMesh, AgentSpriteGroup, updateZoomVisibility | VERIFIED | 3-tier groups at renderOrder=9; RING layout via getRingSlotOffset; async portrait loading; 18 tests pass |
| `src/components/HexMapV2/agents/agentAnimationState.ts` | AgentAnimState, startMoveAnimation, tickAgentAnimations | VERIFIED | Bezier hop 800ms + 150ms settle bounce; 16 tests pass |
| `src/components/HexMapV2/agents/activityIndicatorRegistry.ts` | 6 activity icons, buildActivityIconTextureCache | ORPHANED | Exists with 6 icons (boot, swords, hourglass, coin, hammer, bandage) but never imported by HexMapV2.tsx |
| `src/components/HexMapV2/agents/eventIndicatorRegistry.ts` | 5 event icons, EVENT_ANIMATION_PARAMS, buildEventIconTextureCache | ORPHANED | Exists with 5 types and correct fade params but never imported by HexMapV2.tsx |
| `src/components/HexMapV2/scene/MovementTrailMesh.ts` | createMovementTrailMesh, addTrailSegment, updateTrails, TRAIL_FADE_DURATION=2000 | VERIFIED | All exports present; TRAIL_FADE_DURATION=2000 confirmed; wired into render loop |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| LocationIconMesh.ts | locationIconRegistry.ts | LOCATION_ICON_REGISTRY | WIRED | Import confirmed at line 20-22 |
| LocationIconMesh.ts | locationIconTextures.ts | buildLocationIconTextureCache | WIRED | Import confirmed at line 23 |
| HexMapV2.tsx | LocationIconMesh.ts | createLocationIconMesh | WIRED | Import at line 22; called at line 302-303 |
| HexMapV2.tsx | AgentSpriteMesh.ts | createAgentSpriteMesh | WIRED | Import at line 24; called at line 322 |
| HexMapV2.tsx | agentAnimationState.ts | tickAgentAnimations | WIRED | Import at line 28; called in render loop at line 410 |
| HexMapV2.tsx | MovementTrailMesh.ts | updateTrails | WIRED | Import at line 30; called in render loop at line 412 |
| agentAnimationState.ts | movementPath.ts | getSegmentBezier, evalBezierAtArcLength | WIRED | Import at line 19 |
| AgentSpriteMesh.ts | movementPath.ts | getRingSlotOffset | WIRED | Import at line 36 |
| compositionResolver.ts | (rendering pipeline) | resolveHexComposition | NOT_WIRED | Zero non-test callers — function exists but is never called at runtime |
| activityIndicatorRegistry.ts | HexMapV2.tsx | buildActivityIconTextureCache | NOT_WIRED | Never imported; no activityGroup in scene |
| eventIndicatorRegistry.ts | HexMapV2.tsx | buildEventIconTextureCache | NOT_WIRED | Never imported; no eventGroup in scene |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| LOCI-01 | 06-01 | Location icons rendered as black silhouettes on hex via composition system slots | SATISFIED | LocationIconMesh sprites at renderOrder=8; 7 tests |
| LOCI-02 | 06-01 | Location icon catalog covers all 17 types | SATISFIED | All 17 LocationType values in registry with production SVG paths |
| LOCI-03 | 06-01 | Location name labels with font size scaling by importance | SATISFIED | LocationLabelOverlay: capital=13px/700, city/town=11px/400, small=9px/400 |
| LOCI-04 | 06-01 | Black text with white halo | SATISFIED | text-shadow halo applied, text color #1a1a1a |
| LOCI-05 | 06-01 | Capital markers with red ring | SATISFIED | CAPITAL_RING_COLOR='#cc3333' ring sprite at z+0.001 per capital |
| LIART-01 | 06-02 | SVG icon for capital | SATISFIED | CAPITAL_PATHS with 4-layer opacity in registry |
| LIART-02 | 06-02 | SVG icon for city | SATISFIED | CITY_PATHS in registry |
| LIART-03 | 06-02 | SVG icon for town | SATISFIED | TOWN_PATHS in registry |
| LIART-04 | 06-02 | SVG icon for hamlet | SATISFIED | HAMLET_PATHS in registry |
| LIART-05 | 06-02 | SVG icon for castle | SATISFIED | CASTLE_PATHS in registry |
| LIART-06 | 06-02 | SVG icon for fort | SATISFIED | FORT_PATHS in registry |
| LIART-07 | 06-02 | SVG icon for tower | SATISFIED | TOWER_PATHS in registry |
| LIART-08 | 06-02 | SVG icon for temple | SATISFIED | TEMPLE_PATHS in registry |
| LIART-09 | 06-02 | SVG icon for shrine | SATISFIED | SHRINE_PATHS in registry |
| LIART-10 | 06-02 | SVG icon for ruins | SATISFIED | RUINS_PATHS in registry |
| LIART-11 | 06-02 | SVG icon for ruined_city | SATISFIED | RUINED_CITY_PATHS in registry |
| LIART-12 | 06-02 | SVG icon for ruined_tower | SATISFIED | RUINED_TOWER_PATHS in registry |
| LIART-13 | 06-02 | SVG icon for ruined_village | SATISFIED | RUINED_VILLAGE_PATHS in registry |
| LIART-14 | 06-02 | SVG icon for mining | SATISFIED | MINING_PATHS in registry |
| LIART-15 | 06-02 | SVG icon for camp | SATISFIED | CAMP_PATHS in registry |
| LIART-16 | 06-02 | SVG icon for battleground | SATISFIED | BATTLEGROUND_PATHS in registry |
| LIART-17 | 06-02 | SVG icon for unexplored_poi | SATISFIED | UNEXPLORED_POI_PATHS in registry |
| COMP-05 | 06-01 | Agent RING layout distributes agents around hex edge, stable by ID | SATISFIED | ringCounter in compositionResolver; getRingSlotOffset used in AgentSpriteMesh; agents sorted by id |
| AGNT-01 | 06-03 | Agent portraits as circular thumbnails with colored ring at hero-local | SATISFIED | loadPortraitTexture clips to circle + faction ring; portrait sprites in portraitGroup |
| AGNT-02 | 06-03 | Agents as colored dots at regional zoom; count badge if >4 per hex | PARTIAL | Faction dots at regional zoom: SATISFIED. Count badge: capped at MAX_RING_AGENTS=6 but "overflow badge handled separately" — no badge HTML overlay exists |
| AGNT-03 | 06-03 | Agents hidden at continental/full-world; retinue only at continental | SATISFIED | updateZoomVisibility toggles all 3 groups correctly; continentalGroup contains only retinue sprites |
| AGNT-04 | 06-03 | Faction heraldic colors distinct from terrain palette | SATISFIED | FACTION_HERALDIC_COLORS=[#e53e3e,#3182ce,#805ad5,#d53f8c,#00b5d8,#dd6b20] — saturated, distinct |
| AGNT-05 | 06-03 | Retinue gold/white border | SATISFIED | RETINUE_BORDER_COLOR='#d4a040'; buildRetinueDotTexture adds gold ring + white highlight |
| AGNT-06 | 06-04 | Movement animation bezier hop ~800ms, 150ms settle | SATISFIED | tickAgentAnimations in render loop; AGENT_MOVE_TRANSITION_MS=800, SETTLE_DURATION_MS=150 |
| AGNT-07 | 06-04 | Activity indicator icons below agent at hero-local zoom | BLOCKED | activityIndicatorRegistry.ts exists with 6 icons and texture cache, but is never imported or called from HexMapV2.tsx — no sprites added to scene |
| AGNT-08 | 06-04 | Event indicators on hexes with fade-in/fade-out | BLOCKED | eventIndicatorRegistry.ts exists with 5 types and EVENT_ANIMATION_PARAMS, but is never imported or called from HexMapV2.tsx — no event sprites added to scene |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/HexMapV2/scene/AgentSpriteMesh.ts` | 131-132 | `// Cap at MAX_RING_AGENTS — extras are hidden (overflow badge handled separately)` | Warning | Count badge for >4 agents never built — AGNT-02 partially blocked |
| `src/components/HexMapV2/signifiers/compositionResolver.ts` | 102 | `// Phase 6: use footprint geometry` comment on footprint-overlap rule | Info | Reserved for future — not a blocker |

### Pre-Existing Test Failures (not caused by Phase 6)

2 failures in `src/components/HexMapV2/signifiers/__tests__/signifierRegistry.test.ts`:
- Test 1: expects `hardened_clay` registry entry (absorbed into `badlands` in Phase 05)
- Test 2: expects 1 variant for `light_forest` (now has 4 after Phase 05 art expansion)

These are pre-existing test drift from Phase 5 changes, documented in `deferred-items.md`.

### Human Verification Required

#### 1. Location Icon Visual Quality

**Test:** Open `?view=game` (or a test route that passes location data), zoom to regional zoom (k >= 5).
**Expected:** Black silhouette icons visible on location hexes — capital should look like a large castle with banner; city like a walled settlement; ruins like broken buildings. Name labels appear below each icon.
**Why human:** SVG path quality, readability at size, and visual distinctiveness between types can only be judged visually.

#### 2. Retinue Agent Distinction at Hero-Local Zoom

**Test:** Zoom to hero-local (k >= 15) with multiple agents including the player's retinue.
**Expected:** Retinue agent shows a distinct gold ring, all others show faction-colored rings. Portrait images load asynchronously and replace the initial dot texture.
**Why human:** Async portrait texture swap and visual distinctiveness of gold-vs-faction-color require live rendering to verify.

#### 3. Agent Bezier Hop Animation

**Test:** Trigger an agent to move between hexes (advance game tick).
**Expected:** Agent slides along a curved bezier path over ~800ms, then briefly bounces (scale 1.05 → 1.0 over 150ms). A faction-colored trail line fades out over 2 seconds after the move.
**Why human:** Render-loop animation cannot be verified statically — requires live scene.

### Gaps Summary

Phase 6 built all required rendering infrastructure and the core visible features are functional. Three gaps prevent full goal achievement:

**Gap 1 — Suppression not wired (Success Criterion 5).** The composition resolver has correct suppression logic and tests demonstrate it works, but neither `SignifierMesh.ts` nor `LocationIconMesh.ts` call `resolveHexComposition`. The two rendering layers are independent. At runtime, a city hex shows both tree signifiers AND the city icon stacked on top — the city does not replace the trees.

**Gap 2 — Activity indicators orphaned (AGNT-07).** `activityIndicatorRegistry.ts` defines 6 icons with texture cache but `HexMapV2.tsx` never imports it. No activity sprites appear below agent portraits at hero-local zoom.

**Gap 3 — Event indicators orphaned (AGNT-08).** `eventIndicatorRegistry.ts` defines 5 event types with fade params and texture cache but `HexMapV2.tsx` never imports it. No event indicators appear on hexes.

Gaps 1, 2, and 3 have a common root: Plan 04 Task 2 described wiring these systems into `HexMapV2.tsx` but the implementation only wired agent sprites and animation — it did not complete the activity indicator sprites, event indicator sprites, or the composition-based suppression pass.

---

_Verified: 2026-03-22T15:42:00Z_
_Verifier: Claude (gsd-verifier)_
