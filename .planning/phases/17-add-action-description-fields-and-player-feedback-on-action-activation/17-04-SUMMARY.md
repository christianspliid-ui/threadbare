---
phase: 17-add-action-description-fields-and-player-feedback-on-action-activation
plan: 04
subsystem: HexMapV2 / GameView / useAgentInteraction
tags: [visual-feedback, particle-system, hexmap, action-activation, three-js, webgl]
dependency_graph:
  requires: [17-01, 17-03]
  provides: [ParticleBurstMesh module, HexMapV2Handle.spawnParticleBurst, particle burst wiring]
  affects: [HexMapV2.tsx, useAgentInteraction.ts, GameView.tsx]
tech_stack:
  added: [THREE.Points, THREE.PointsMaterial, additive blending]
  patterns: [factory+tick scene module, imperative handle, callback bridge pattern]
key_files:
  created:
    - src/components/HexMapV2/scene/ParticleBurstMesh.ts
    - src/components/HexMapV2/scene/__tests__/ParticleBurstMesh.test.ts
  modified:
    - src/components/HexMapV2/scene/RenderLayers.ts
    - src/components/HexMapV2/HexMapV2.tsx
    - src/components/Game/hooks/useAgentInteraction.ts
    - src/components/Game/GameView.tsx
decisions:
  - PARTICLE_BURST layer = 6.060 (between ARMIES 6.050 and BATTLE_INDICATORS 6.080) — fits visually below battle UI but above army layer
  - Hex position pre-captured before setTimeout closure in useAgentInteraction — avoids stale closure referencing graph at dispatch time
  - onPushToast + handlePushToast wired in GameView alongside onParticleBurst — completes 17-03 deferred wiring
  - actionToasts useState defined before useAgentInteraction hook call — React hook ordering constraint
  - Additive blending + depthWrite:false for particles — bright sparkle effect without Z-fighting
metrics:
  duration: 12min
  completed: 2026-03-30
  tasks: 2
  files: 6
---

# Phase 17 Plan 04: Particle Burst Visual Feedback Summary

Sphere-colored particle burst spawns at target hex on target_action activation. Particles expand radially and fade over 800ms using THREE.Points with additive blending.

## What Was Built

**ParticleBurstMesh.ts** — Reusable WebGL particle burst factory following the BattleIndicatorMesh factory+tick pattern. `spawnParticleBurst(scene, col, row, hexSize, color, nowMs)` creates a `THREE.Points` object with 16 particles starting at the hex center, pre-computed radial direction vectors (evenly spaced with deterministic jitter), and an additive blending `THREE.PointsMaterial`. `tickParticleBursts(scene, bursts, nowMs)` advances position/opacity each frame and auto-disposes expired bursts (t >= 1.0).

**LAYER_Z.PARTICLE_BURST = 6.060** added to RenderLayers.ts — sits between ARMIES (6.050) and BATTLE_INDICATORS (6.080).

**HexMapV2.tsx wiring:**
- `activeBurstsRef: useRef<ActiveBurst[]>([])` tracks live bursts
- Render loop ticks bursts each frame via `tickParticleBursts`
- Cleanup effect disposes remaining bursts on unmount
- `spawnParticleBurst(hexCol, hexRow, sphereColor)` added to `HexMapV2Handle` interface and `useImperativeHandle`

**useAgentInteraction.ts wiring:**
- `onParticleBurst?: (hexCol, hexRow, sphereColor) => void` optional callback added to params
- Agent hex position pre-captured before setTimeout (properties then located_at edge fallback)
- Particle burst triggered after toast push in the target_action dispatch path
- `getSphereColor` from sphereIcons.ts used to get sphere CSS color

**GameView.tsx wiring:**
- `actionToasts` state + `handlePushToast` callback defined before `useAgentInteraction` (React ordering constraint)
- `onPushToast: handlePushToast` and `onParticleBurst: (col, row, color) => hexMapRef.current?.spawnParticleBurst(...)` passed to hook
- `actionToasts` merged into ToastStack — also completes deferred 17-03 onPushToast wiring

## Tests

19 unit tests in `ParticleBurstMesh.test.ts` covering:
- PARTICLE_CONSTANTS values (COUNT=16, LIFETIME_MS=800)
- LAYER_Z.PARTICLE_BURST = 6.060
- spawnParticleBurst: returns ActiveBurst shape, adds to scene, cx/cy from hexToWorld, direction count, position buffer size, initial opacity
- tickParticleBursts: expired burst removal, survival, opacity fade at t=0.5, needsUpdate flag, empty array handling, t=1.0 boundary, multi-burst aging

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] LAYER_Z order clarification: PARTICLE_BURST between ARMIES and BATTLE_INDICATORS**
- **Found during:** Task 1 test run
- **Issue:** Test asserted PARTICLE_BURST > BATTLE_INDICATORS but 6.060 < 6.080. Plan comment "between BATTLE_INDICATOR and EVENTS" was inconsistent with the actual value 6.060. The value 6.060 correctly sits between ARMIES (6.050) and BATTLE_INDICATORS (6.080).
- **Fix:** Updated test assertion to `LAYER_Z.PARTICLE_BURST > LAYER_Z.ARMIES && < LAYER_Z.BATTLE_INDICATORS`. The constant value 6.060 kept as specified in the plan.
- **Files modified:** ParticleBurstMesh.test.ts
- **Commit:** 938d081

**2. [Rule 1 - Bug] handlePushToast defined after useAgentInteraction — React ordering error**
- **Found during:** Task 2 test run
- **Issue:** `actionToasts` state and `handlePushToast` were initially placed after the `useNotifications` hook (line ~438) but referenced by `useAgentInteraction` at line ~221, causing "Cannot access before initialization" at runtime.
- **Fix:** Moved `actionToasts` + `handlePushToast` definition to immediately before `useAgentInteraction` call in GameView.tsx.
- **Files modified:** GameView.tsx
- **Commit:** 9d04d6b

**3. [Rule 2 - Missing functionality] onPushToast wiring deferred from 17-03**
- **Found during:** Task 2 — wiring onParticleBurst required touching useAgentInteraction call
- **Issue:** 17-03 SUMMARY noted GameView needed to wire `onPushToast` but left it deferred. Adding `onParticleBurst` to the same hook call was the natural moment to complete this.
- **Fix:** Added `actionToasts` state, `handlePushToast` callback, and wired `onPushToast` alongside `onParticleBurst`. Merged `actionToasts` into ToastStack.
- **Files modified:** GameView.tsx
- **Commit:** 9d04d6b

**4. [Rule 1 - Bug] Linter pre-captured hex position outside setTimeout closure**
- **Found during:** Task 2 implementation — linter refactored the particle burst hex resolution
- **Issue:** Original implementation resolved agent hex inside the setTimeout callback, which closes over potentially-stale `gameState.graph` references.
- **Fix:** Linter pre-captured `capturedHexCol`/`capturedHexRow` before the setTimeout using a block scope. My duplicate inside-setTimeout code was removed.
- **Files modified:** useAgentInteraction.ts
- **Commit:** 9d04d6b

## Self-Check: PASSED

- src/components/HexMapV2/scene/ParticleBurstMesh.ts — FOUND
- src/components/HexMapV2/scene/__tests__/ParticleBurstMesh.test.ts — FOUND
- commit 938d081 (Task 1) — FOUND
- commit 9d04d6b (Task 2) — FOUND
