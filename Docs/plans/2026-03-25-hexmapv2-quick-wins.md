# HexMapV2 Quick Wins — Consistency & Type Safety

> Implementation plan from the [HexMapV2 Architectural Review](obsidian://open?vault=TheFantasyWorldSimulator&file=Systems%2FHexMapV2%20Architectural%20Review). Four small, zero-behavior-change cleanups that tighten the codebase.
>
> **Estimated scope:** ~60 lines changed across 8 files. No rendering behavior changes. All existing tests should continue to pass.

---

## 1. Centralize Z-position constants in RenderLayers.ts

**Problem:** Z-positions are scattered across individual mesh files and don't agree with renderOrder (rivers sit at higher Z than roads despite lower renderOrder). Works today because `depthTest: false`, but a future mesh with `depthTest: true` will hit z-fighting.

**Change:**

In `src/components/HexMapV2/scene/RenderLayers.ts`, add a `LAYER_Z` constant block alongside the existing `RENDER_ORDER`:

```typescript
/** Z-positions for each layer. Monotonic with RENDER_ORDER.
 *  All meshes MUST use these values instead of local Z constants. */
export const LAYER_Z = {
  HEX_FILL: 0.000,
  COASTLINE: 0.010,
  GRID: 0.015,
  ELEVATION_TICKS: 0.020,
  RIVERS: 0.025,
  ROADS: 0.030,
  BORDERS: 0.035,
  SIGNIFIERS: 0.070,
  LOCATIONS: 0.080,
  TRAILS: 0.085,
  AGENTS: 0.090,
  EVENTS: 0.100,
} as const;
```

Then update each mesh file to import from `LAYER_Z` instead of its local constant:

| File | Current local constant | Replace with |
|------|----------------------|-------------|
| `HexGridLines.ts` | `GRID_LINE_Z = 0.025` | `LAYER_Z.GRID` |
| `ElevationTicks.ts` | inline Z in position | `LAYER_Z.ELEVATION_TICKS` |
| `RiverMesh.ts` | Z constant (check name) | `LAYER_Z.RIVERS` |
| `RoadMesh.ts` | Z constant (check name) | `LAYER_Z.ROADS` |
| `BorderMesh.ts` | `BORDER_Z = 0.035` | `LAYER_Z.BORDERS` |
| `MovementTrailMesh.ts` | `TRAIL_Z = 0.085` | `LAYER_Z.TRAILS` |
| `AgentSpriteMesh.ts` | `AGENT_SPRITE_Z` or similar | `LAYER_Z.AGENTS` |
| `LocationIconMesh.ts` | Z constant (check name) | `LAYER_Z.LOCATIONS` |

**Note:** The new Z values make rivers (0.025) and roads (0.030) monotonic with renderOrder. Previously roads were at 0.025 and rivers at 0.03 — swapped relative to their renderOrder. This is safe because both use `depthTest: false` and `transparent: true`, so Z has no visual effect. But the invariant is now documented and enforced.

**Verification:** `npm test` — all existing tests pass. No visual changes.

---

## 2. Add literal types for ZoomVisibilityMatrix layer keys

**Problem:** The visibility matrix uses untyped string keys. A typo like `'signfiers'` silently resolves to `undefined` and the layer doesn't respond to zoom changes. No compile error, no runtime warning.

**Change:**

In `src/components/HexMapV2/scene/ZoomVisibilityMatrix.ts`:

```typescript
// Add this near the top:
export const LAYER_NAMES = [
  'hex_fill', 'coastline', 'grid_lines', 'elevation_ticks',
  'rivers', 'roads', 'borders_kingdom', 'borders_barony',
  'signifiers', 'locations', 'agents_portrait', 'agents_dot',
  'agents_retinue', 'events', 'labels',
] as const;

export type LayerName = typeof LAYER_NAMES[number];

// Then type the matrix:
export const ZOOM_VISIBILITY_MATRIX: Record<LayerName, Record<ZoomTier, boolean>> = {
  // ... existing entries unchanged
};
```

Then update all consumers that index into the matrix to use `LayerName` instead of bare strings. The compiler will catch any typos.

**Files to check for string key usage:** `HexMapV2.tsx` (the main consumer — search for references to `ZOOM_VISIBILITY_MATRIX` or individual layer name strings).

**Verification:** `npx tsc --noEmit` — any typos become compile errors. `npm test` — all pass.

---

## 3. Move hardcoded constants in D3ZoomCamera.ts

**Problem:** Two magic numbers break the constants-culture pattern:
- `0.002` — wheel delta scaling (line ~113)
- `FIT_PADDING = 0.85` — initial view fitting (line ~180)

**Change:**

Add to the existing `CAMERA_CONSTANTS` object in `D3ZoomCamera.ts`:

```typescript
export const CAMERA_CONSTANTS = {
  // ... existing entries
  WHEEL_DELTA_SCALE: 0.002,
  FIT_PADDING: 0.85,
} as const;
```

Replace the inline usages. Search for `0.002` and `0.85` in the file to find all instances.

**Verification:** `npm test` — all pass. No visual changes.

---

## 4. Remove dead `WATER_TYPES` constant in ElevationTicks.ts

**Problem:** `WATER_TYPES` Set is defined (lines ~28–37) but never referenced. The actual water exclusion uses a different condition (`tile.terrain === 'plateau'`). Dead code from an incomplete refactor.

**Change:** Delete the `WATER_TYPES` constant and its comment. No other file imports it (verify with a repo-wide grep for `WATER_TYPES` first).

**Verification:** `npm test` — all pass. Grep confirms no other references.

---

## NFP Compliance

| Priority | Impact |
|----------|--------|
| #1 Tunability | ✅ Improves — Z constants centralized, two hardcoded values named |
| #2 Inspectability | ✅ Improves — layer Z ordering now documented in one place |
| #3 Determinism | No change |
| #4 Fail-soft | No change |
| #7 Performance | No change |

---

## Test strategy

All four changes are zero-behavior-change refactors. The existing test suite is the verification:
1. `npm test` — all ~5,800 tests pass
2. `npx tsc --noEmit` — type check clean (especially important for change #2)
3. Visual spot-check at `?view=game` — hex map looks identical
