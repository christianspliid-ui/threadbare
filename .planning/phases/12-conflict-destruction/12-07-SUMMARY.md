---
phase: 12-conflict-destruction
plan: "07"
subsystem: hexmap-visual-presence
tags: [armies, battles, hexmap, debug, notifications, three-js, sprites]
dependency_graph:
  requires: [12-04, 12-05, 12-06]
  provides: [army-sprites-on-map, battle-indicators-on-map, army-notifications]
  affects: [HexMapV2, DebugPanel, orchestrator, NarrativeLog]
tech_stack:
  added: [ArmyLayer.ts, BattleIndicatorLayer.ts, armyNotifications.ts, armyVisibility.test.ts]
  patterns: [Three.js Sprite per entity, canvas texture cache, trace-to-TickEvent bridge]
key_files:
  created:
    - src/components/HexMapV2/scene/ArmyLayer.ts
    - src/components/HexMapV2/scene/BattleIndicatorLayer.ts
    - src/engine/armyNotifications.ts
    - src/engine/__tests__/armyVisibility.test.ts
  modified:
    - src/components/HexMapV2/scene/RenderLayers.ts
    - src/components/HexMapV2/HexMapV2.tsx
    - src/engine/orchestrator.ts
    - src/types/gameState.ts
decisions:
  - "ArmyLayer uses THREE.Sprite per army with canvas texture showing faction color dot + size pips"
  - "BattleIndicatorLayer uses separate textures for field battle (crossed swords) vs siege (dashed encirclement ring)"
  - "Battle indicators pulse using sine wave on elapsed clock time — no PRNG"
  - "Faction color derived from stable hash of faction ID string — deterministic, no PRNG"
  - "armies and battles passed as pre-computed props to HexMapV2, not queried inside — follows agents pattern"
  - "phaseArmyNotifications reads current-tick faction_ambition traces by tick filter — bridging trace-to-TickEvent"
  - "Thread-based significance: threaded agent → 0.85 (Tier 1 modal), unthreaded → 0.2 (Tier 3 chronicle)"
  - "ArmiesTab already existed from plan 06 — plan 07 adds map layers and notifications only"
metrics:
  duration: 45
  completed: 2026-03-29
  tasks_completed: 9
  files_changed: 8
---

# Phase 12 Plan 07: Army Visual Presence Summary

Army sprites rendered on HexMapV2 as faction-colored indicators with size pips, battle/siege indicators with pulse animation, tiered notifications via trace-to-TickEvent bridge.

## What Was Built

### Task 1 — RenderLayers.ts updated
Added `ARMIES: 10.5` and `BATTLE_INDICATORS: 10.8` render order entries and `ARMIES: 6.050`, `BATTLE_INDICATORS: 6.080` Z positions. Armies render above agents (10), battle indicators above armies, both below events (11).

### Tasks 2-3 — ArmyLayer.ts and BattleIndicatorLayer.ts
**ArmyLayer.ts**: Queries actor nodes with `armyState`, resolves hex position via `located_at` edge, derives faction color via stable string hash of faction ID. Renders THREE.Sprite per army. Size pips: warband=1 chevron, regiment=2, host=3. Canvas textures cached by `${color}:${size}` key — no per-frame canvas work.

**BattleIndicatorLayer.ts**: Field battles → crossed-swords icon (red). Sieges → dashed encirclement ring (orange) with inward arrows. Both pulse via `tickBattleIndicators(elapsedS)` — sine wave between 0.5–1.0 opacity.

### Task 4 — HexMapV2 wiring
Added `armies?: ArmyRenderData[]` and `battles?: BattleIndicatorData[]` props to HexMapV2Props. Layers added to scene after agent sprites. Battle indicator pulse called each render frame. Layers disposed in cleanup.

### Task 5-6 — DebugPanel Armies tab
Already complete from plan 06 — `ArmiesTabContent` function and tab button were confirmed present.

### Task 7 — Army notifications
New `armyNotifications.ts` with `phaseArmyNotifications()`:
- Reads current-tick `faction_ambition` traces by tick filter
- Maps trace events to TickEvent types:
  - `army_raised` → `army_mobilization`
  - `army_disbanded` → `army_disbanded`
  - `started` (field battle) → `battle_started`
  - `resolved` → `battle_resolved`
  - `siege_established` → `siege_established`
  - `attrition` + `thresholdCrossed` → `army_attrition`
- Thread-based significance: threaded commander → 0.85, unthreaded → 0.2
- Wired at orchestrator phase 2.358 after battle phases

Added 6 new TickEvent types to `gameState.ts`: `army_mobilization`, `army_disbanded`, `battle_started`, `battle_resolved`, `siege_established`, `army_attrition`.

### Task 8 — Tests (armyVisibility.test.ts)
474 lines of tests covering:
- `buildArmyRenderData`: query, skipping missing edges, fallback color, size categories
- `buildBattleIndicatorData`: hex positioning, siege vs field, missing edge skip
- `factionColorFromId`: determinism, hex color format
- `phaseArmyNotifications`: threaded=high significance, unthreaded=low, tick filtering

### Task 9 — Pre-commit verification
- `npm test`: 469 test files, 7042 tests — all pass
- `npx tsc --noEmit`: exit 0
- `npx vite build`: clean build in 7.67s

## Deviations from Plan

None — plan executed exactly as written, with one discovery documented:

**[Rule 0 - Observation] ArmiesTab already existed from plan 06:**
Tasks 5-6 described creating the ArmiesTab and wiring it. Both were confirmed present in DebugPanel.tsx from plan 06 execution. No duplication needed — tasks skipped cleanly.

## Self-Check: PASSED

All 4 created files confirmed present. All 4 per-task commits confirmed in git history.
