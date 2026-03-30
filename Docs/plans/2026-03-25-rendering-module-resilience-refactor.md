# Rendering Module Resilience Refactor

> **Date:** 2026-03-25
> **Status:** 📐▶ Plan complete, ready for Claude Code
> **Backlog:** TB-015
> **Motivation:** Agent sprite scale bug exposed systemic fragility: modules that share data break silently when one changes. This proposal addresses the root architectural patterns that enable that class of bug.
> **Overlap:** Phase 4 (hook extraction) is the same work as TB-016 item 1. When Phase 4 ships, mark TB-016 item 1 as complete.

---

## Problem Statement

The agent sprite scale bug wasn't a one-off. It's a symptom of an architecture where modules communicate through shared mutable state with no contracts, shared computations are duplicated instead of centralized, and a 1,257-line monolith component orchestrates everything. The result: changes in one system silently break others, and breakage is difficult to diagnose because there's no contract layer to catch it.

This document proposes a phased refactor that moves the rendering architecture toward **module independence** — where each module has a clear contract, owns its own state, and can be changed without ripple effects.

---

## Audit Findings

### 1. Duplicated Logic (No Shared Primitives)

**Hex key string building** — The pattern `` `${col},${row}` `` appears in 16+ files across engine and UI. There is no shared `hexKey()` utility. If the key format ever changes (e.g., to support multi-map), every file needs manual editing.

**Y-flip transformation** — SVG-to-Three.js coordinate conversion (`y: -svgY`) is implemented manually in 12 files. A helper exists in `regionLabels.ts` (`hexToWorldPosition`) but no rendering module uses it. Each mesh file independently flips coordinates, creating 12 places where the same bug can be introduced.

**Hex grouping** — The "group entities by hex key into a Map" pattern is independently implemented in AgentSpriteMesh, HexMapV2.tsx (agent update effect), BorderMesh, ElevationTicks, and multiple engine modules. Same loop, same sorting, same slicing — repeated each time.

### 2. Tight Coupling (Modules Know Each Other's Internals)

**Animation ↔ Sprite structure** — `agentAnimationState.ts` directly reaches into the sprite group and mutates `.position` and `.scale` on `{ portrait, dot, continental }`. This means:
- Adding or removing a sprite tier requires editing the animation module
- The animation module must know each sprite's base scale (which it currently doesn't — hence the bug)
- No interface boundary exists between "what to animate" and "how to render"

**HexMapV2 ↔ Everything** — The component directly manages 38 refs, 47 imports, and 12 distinct concerns. Any change to agent rendering, fog, zoom, trails, labels, or interaction touches this single file.

### 3. Missing Contract Tests

The CLAUDE.md specifies 6 required contract test pairs. The audit found only 1 exists (`pathfinding-to-movement`). Critical missing contracts:

- AgentSpriteMesh → agentAnimationState (sprite structure matches animation expectations)
- MovementState → HexMapV2 agent props (movement data flows correctly to rendering)
- ZoomVisibilityMatrix → updateZoomVisibility (threshold definitions agree)
- movementHistory → MovementTrailMesh (trail data format matches renderer)

---

## Proposed Refactor — Four Phases

Each phase is independently valuable and can ship on its own. Later phases build on earlier ones but aren't blocked by them.

### Phase 1: Shared Primitives Library (Low risk, high leverage)

**Goal:** Eliminate duplicated computations by creating shared utility modules.

**New modules:**

1. **`src/lib/hexKey.ts`** — Hex coordinate key generation
   ```typescript
   export function hexKey(col: number, row: number): string;
   export function hexKeyFromCoord(coord: HexCoord): string;
   export function parseHexKey(key: string): { col: number; row: number };
   ```
   Replaces 376+ manual string concatenations across 16+ files.

2. **`src/lib/worldPosition.ts`** — Coordinate system conversion
   ```typescript
   export interface WorldPosition { x: number; y: number; }
   export function hexToWorld(hex: HexCoord, hexSize?: number): WorldPosition;
   export function hexToWorldWithOffset(hex: HexCoord, offset: Point, hexSize?: number): WorldPosition;
   ```
   Centralizes the hexToPixel + Y-flip pattern used in 12 files. Every mesh module and the animation system imports this instead of doing inline flips.

3. **`src/lib/hexGrouping.ts`** — Entity-to-hex grouping utility
   ```typescript
   export function groupByHex<T extends { hexCol: number; hexRow: number }>(
     items: T[],
     sortKey?: (a: T, b: T) => number,
     maxPerHex?: number,
   ): Map<string, T[]>;
   ```
   Replaces the repeated "build Map, push, sort, slice" pattern in 6+ files.

**Estimated scope:** ~3 new files, ~15 files updated to use them. All changes are mechanical (replace inline code with import). Low risk of behavioral change.

**Testing:** Each utility gets its own unit test. Existing tests continue to pass unchanged.

### Phase 2: Sprite Abstraction Layer (Medium risk, fixes the bug class)

**Goal:** Decouple animation from sprite internals so the animation system doesn't need to know about sprite structure or scale values.

**New interface:**

```typescript
// src/components/HexMapV2/agents/agentSpriteTarget.ts

/**
 * Animation target interface — what the animation system can do to a renderable agent.
 * Decouples animation logic from Three.js sprite internals.
 */
export interface AgentAnimationTarget {
  /** Move all representations to a world position */
  setPosition(x: number, y: number, z: number): void;
  /** Apply a scale multiplier relative to base size (1.0 = normal) */
  setScaleMultiplier(multiplier: number): void;
  /** Reset scale to base size */
  resetScale(): void;
}
```

**Implementation:** `AgentSpriteMesh.ts` creates targets that wrap the concrete sprites:

```typescript
function createAnimationTarget(sprites: { portrait: THREE.Sprite; dot: THREE.Sprite; continental?: THREE.Sprite }): AgentAnimationTarget {
  return {
    setPosition(x, y, z) {
      sprites.portrait.position.set(x, y, z);
      sprites.dot.position.set(x, y, z);
      sprites.continental?.position.set(x, y, z);
    },
    setScaleMultiplier(m) {
      const bp = sprites.portrait.userData.baseScale ?? 1;
      const bd = sprites.dot.userData.baseScale ?? 1;
      sprites.portrait.scale.set(bp * m, bp * m, 1);
      sprites.dot.scale.set(bd * m, bd * m, 1);
      if (sprites.continental) {
        const bc = sprites.continental.userData.baseScale ?? 1;
        sprites.continental.scale.set(bc * m, bc * m, 1);
      }
    },
    resetScale() { this.setScaleMultiplier(1.0); },
  };
}
```

**Changes to animation system:** `tickAgentAnimations` operates on `Map<string, AgentAnimationTarget>` instead of `Map<string, { portrait, dot, continental }>`. It calls `target.setPosition()` and `target.setScaleMultiplier()` — never touches sprites directly.

**Why this matters:** The settle-scale bug becomes impossible. The animation system literally cannot set an absolute scale — it can only apply a multiplier. Adding a fourth sprite tier (e.g., activity indicators) requires zero changes to the animation module.

**Estimated scope:** 1 new interface file, 2 files refactored (AgentSpriteMesh, agentAnimationState). Moderate risk — animation behavior must be verified.

**Testing:** Contract test between AgentSpriteMesh and agentAnimationState verifying the interface is satisfied.

### Phase 3: Unified Zoom Tier Module (Low risk, eliminates threshold drift)

**Goal:** Single source of truth for zoom tier definitions, thresholds, and visibility decisions.

**Changes:**

1. **Delete `AGENT_ZOOM_THRESHOLDS`** from `agentSpriteTypes.ts`
2. **Move all zoom tier logic** into `ZoomVisibilityMatrix.ts` (already mostly there)
3. **Export a single API:**
   ```typescript
   export function getZoomTier(k: number): ZoomTier;
   export function isLayerVisible(layer: LayerName, tier: ZoomTier): boolean;
   export function isLayerVisible(layer: LayerName, k: number): boolean; // convenience overload
   ```
4. **Update all consumers** to import from one place

**Estimated scope:** 1 file deleted (partially), 4-5 files updated. Very low risk.

### Phase 4: HexMapV2 Hook Extraction (Medium risk, improves maintainability)

**Goal:** Break the 1,257-line monolith into focused custom hooks, each owning one concern.

This is already identified in the backlog under "HexMapV2 Medium-Term Improvements" item 1. The audit confirms the breakdown:

| Hook | Lines | Responsibility |
|------|-------|---------------|
| `useAgentSprites` | ~150 | Agent sprite lifecycle: create, update positions, dispose |
| `useAgentAnimations` | ~100 | Animation state machine: detect moves, start animations, tick |
| `useZoomVisibility` | ~80 | D3 zoom event → layer visibility matrix application |
| `useFogCulling` | ~100 | Fog of war visibility map → hex color override |
| `useHexInteraction` | ~150 | Mouse events, raycasting, selection, tooltips |
| `useMovementTrails` | ~80 | Trail segment creation and fade management |

HexMapV2.tsx becomes a ~400-line shell that composes these hooks and manages the scene lifecycle.

**Estimated scope:** 6 new files, 1 large file refactored. Medium risk — integration points between hooks need careful design.

**Testing:** Each hook gets its own test file. HexMapV2 integration tests verify composition.

---

## Implementation Order

```
Phase 1 (Shared Primitives) ──► can ship independently, unblocks Phase 2-4
Phase 2 (Sprite Abstraction) ──► fixes the bug class permanently
Phase 3 (Zoom Unification) ──► can ship independently
Phase 4 (Hook Extraction) ──► benefits from Phases 1-3 but not strictly blocked
```

**Recommended approach:** Phase 1 and Phase 3 are small and safe — do them together as a single PR. Phase 2 is the most important for resilience — do it next. Phase 4 is the largest and can wait until the next time HexMapV2 needs significant changes.

---

## What This Enables

After all four phases:

- **Adding a new sprite tier** (e.g., activity indicators) requires changes in exactly 1 file (AgentSpriteMesh) — no animation changes, no HexMapV2 changes
- **Changing zoom thresholds** requires editing 1 constant in 1 file — all layers automatically update
- **Changing hex key format** requires editing 1 function — all 16+ consumers get the change for free
- **Testing a hook in isolation** is possible without rendering the full HexMapV2 scene
- **Contract tests catch breakage** at module boundaries before it reaches the user

---

## NFP Compliance Summary

| Priority | Status |
|----------|--------|
| 1. Tunability | PASS — shared primitives make constants easier to tune from one place |
| 2. Inspectability | PASS — cleaner module boundaries make tracing easier |
| 3. Determinism | PASS — no changes to PRNG usage |
| 4. Fail-soft | PASS — abstraction layer adds fail-soft defaults (baseScale ?? 1) |
| 5. Narrative over mechanical | N/A |
| 6. Additive over destructive | PASS with note — Phase 1-3 are additive; Phase 4 is a restructure but preserves all behavior |
| 7. Performance | PASS — one extra function call per animation frame (interface method vs direct property set) |

---

## Implementation Plan

### Graph Changes

None — this refactor does not create, read, or modify graph edges or nodes. All changes are in the rendering/UI layer.

### Task 1: Shared Primitives (Phase 1)

**1a. Create `src/lib/hexKey.ts`**
```typescript
export function hexKey(col: number, row: number): string;
export function hexKeyFromCoord(coord: HexCoord): string;
export function parseHexKey(key: string): { col: number; row: number };
```
- Replace all `` `${col},${row}` `` patterns in `src/components/HexMapV2/` and `src/engine/` with `hexKey()` imports
- Grep for the pattern to find all sites: `` `${.*col.*},${.*row}` `` and `col + ',' + row`
- Tests: round-trip (hexKey → parseHexKey), edge cases (negative coords, zero)

**1b. Create `src/lib/worldPosition.ts`**
```typescript
export function hexToWorld(hex: HexCoord, hexSize?: number): WorldPosition;
```
- Wraps existing `hexToPixel()` from `hexMath.ts` with the Y-flip: `{ x: pixel.x, y: -pixel.y }`
- Replace all manual `hexToPixel` + Y-flip patterns in mesh files
- Grep for `y: -` and `-svgY` and `* -1` near hex coordinates to find sites
- `hexMath.ts` already provides `hexToPixel` — this is a thin wrapper, not a rewrite
- Tests: output matches existing `hexToPixel` with negated Y

**1c. Create `src/lib/hexGrouping.ts`**
```typescript
export function groupByHex<T extends { hexCol: number; hexRow: number }>(
  items: T[], sortKey?: (a: T, b: T) => number, maxPerHex?: number
): Map<string, T[]>;
```
- Replace repeated Map+push+sort+slice patterns in AgentSpriteMesh, HexMapV2.tsx, BorderMesh, ElevationTicks
- Tests: grouping, sorting, max-per-hex capping, empty input

**Files:** 3 new in `src/lib/`, ~15 updated across `src/components/HexMapV2/` and `src/engine/`

---

### Task 2: Unified Zoom Tier (Phase 3 — ship alongside Phase 1)

**2a. Delete `AGENT_ZOOM_THRESHOLDS`** from `agentSpriteTypes.ts` (if not already deleted by TB-013)

**2b. Consolidate into `ZoomVisibilityMatrix.ts`:**
```typescript
export function getZoomTier(k: number): ZoomTier;
export function isLayerVisible(layer: LayerName, tier: ZoomTier): boolean;
```

**2c. Update all consumers** to import from `ZoomVisibilityMatrix.ts` — grep for any remaining direct threshold comparisons against zoom `k` values

**Files:** 1 file cleaned up, 4-5 updated to use new API

---

### Task 3: Sprite Abstraction Layer (Phase 2)

**3a. Create `src/components/HexMapV2/agents/agentSpriteTarget.ts`** with `AgentAnimationTarget` interface (as specified in design doc)

**3b. Implement `createAnimationTarget()`** in `AgentSpriteMesh.ts` — wraps concrete sprites behind the interface, stores `baseScale` in `userData`

**3c. Refactor `agentAnimationState.ts`** — replace all direct sprite property access with `AgentAnimationTarget` method calls. The animation system receives `Map<string, AgentAnimationTarget>` instead of raw sprite groups.

**3d. Update `HexMapV2.tsx`** (or `useAgentAnimations` if TB-016 item 1 landed) — wire the new target map into the animation tick

**3e. Contract test:** AgentSpriteMesh output → agentAnimationState input. Verify that a full hop + settle cycle uses `setScaleMultiplier` (never absolute scale), and that final scale equals base scale.

**Files:** 1 new, 2-3 refactored

---

### Task 4: Hook Extraction (Phase 4)

**Note:** This is the same work as TB-016 item 1. When this ships, mark TB-016 item 1 complete.

**4a. Create hooks** (one per file in `src/components/HexMapV2/hooks/`):

| Hook | Extracts from HexMapV2.tsx | Inputs (refs/props) | Outputs (state/callbacks) |
|------|--------------------------|---------------------|--------------------------|
| `useAgentSprites` | Agent sprite create/update/dispose | sceneRef, agentsData, spriteMapRef | — |
| `useAgentAnimations` | Animation state machine | spriteMapRef, agentsData, tick | animationStateRef |
| `useZoomVisibility` | D3 zoom → layer visibility | sceneRef, zoomTransformRef | currentZoomTier |
| `useFogCulling` | Fog map → hex color override | meshRefs, fogData | — |
| `useHexInteraction` | Mouse events, raycasting, selection | canvasRef, sceneRef, cameraRef | selectedHexId, hoveredHexId |
| `useMovementTrails` | Trail segment lifecycle | sceneRef, movementHistory | — |

**4b. Reduce HexMapV2.tsx** to ~400-line shell that composes hooks and manages scene lifecycle

**4c. Tests:** Unit test per hook (mock refs, verify effect runs). Integration test for hook composition.

**4d. Visual verification** at `?view=game` across all three zoom tiers with agents in motion

**Files:** 6 new hooks, 1 large file refactored

---

### Execution Order

1. **Tasks 1 + 2 together** (shared primitives + zoom unification) — low risk, ship as one PR
2. **Task 3** (sprite abstraction) — medium risk, ship separately, verify animations carefully
3. **Task 4** (hook extraction) — largest scope, ship last. Benefits from Tasks 1-3 being in place.

### Pre-Commit Verification

Per phase:
- `npm test` — all tests pass
- `npx tsc --noEmit` — type-check clean
- Visual verification at `?view=game` at world, continental, and hero-local zoom
- Grep for removed patterns (manual hex key strings, manual Y-flips, direct sprite scale sets) — should be zero
- If Phase 2 shipped → verify agent hop + settle animation preserves correct sprite sizes across all zoom tiers
