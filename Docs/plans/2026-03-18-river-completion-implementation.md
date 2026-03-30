# River Completion — Implementation Plan

**Date:** 2026-03-18
**Design:** `2026-03-18-river-completion-design.md`
**Approach:** TDD — write tests first, implement to pass, wire into pipeline last.

## Pre-flight

Before starting, read and understand:
- `src/engine/worldGenData.ts` — `WorldGenData` interface, `createWorldGenData`, constants
- `src/engine/riverGeneration.ts` — current steepest-descent routing
- `src/engine/lakeGeneration.ts` — `getNeighborIndices` helper, lake flood-fill pattern
- `src/components/HexMap/useRivers.ts` — pipeline orchestration
- `src/engine/__tests__/riverGeneration.test.ts` — existing test patterns
- `src/engine/__tests__/lakeGeneration.test.ts` — existing test patterns

## Step 1: Extend WorldGenData

**File:** `src/engine/worldGenData.ts`

1. Add 4 new constants after the existing lake constants:

```typescript
export const DRAIN_EPSILON = 0.0001;
export const DEPRESSION_LAKE_MIN_SIZE = 2;
export const RIVER_COASTAL_MAX_STEPS = 6;
export const LAKE_OUTFLOW_MIN_LENGTH = 2;
```

2. Add two new fields to `WorldGenData` interface:

```typescript
drainageElevation: Float32Array;
filledDepth: Float32Array;
```

3. In `createWorldGenData`, initialize both as zero-filled arrays alongside existing fields:

```typescript
const drainageElevation = new Float32Array(total);
const filledDepth = new Float32Array(total);
```

Include them in the returned object.

**Test:** Run `npm test` — all existing tests must still pass. The new fields are zero-filled and unused until later steps.

## Step 2: Depression Filling (Part 1)

**New file:** `src/engine/depressionFilling.ts`
**New test file:** `src/engine/__tests__/depressionFilling.test.ts`

### 2a. Write tests first

Use hand-crafted `WorldGenData` objects (not `createWorldGenData`) to control elevation exactly. Reuse the `getNeighborIndices` pattern from `lakeGeneration.ts` for neighbor lookup in tests.

Tests:
- **Known depression:** 5×5 grid. Set a ring of hexes at elevation 0.5 surrounding a center hex at 0.2. Edges at 0.3. After `fillDepressions`, assert `drainageElevation` at center is raised above its neighbors' level (≈ 0.3 + epsilon). Assert `filledDepth` at center > 0.
- **No depression (gentle slope):** 5×5 grid with monotonically decreasing elevation from top-left to bottom-right. Assert `drainageElevation` equals `elevation` everywhere. Assert all `filledDepth` values are 0.
- **Ocean hexes as sinks:** 5×5 grid with ocean hexes on one edge. Set a depression inland. Assert it fills to the pour-point toward the ocean edge.
- **Lake hexes treated as resolved:** Place a lake hex (set `terrain[idx] = 'lake'` and `lakeIds[idx] = 0`) in the grid. Assert it's treated as a sink (resolved at its true elevation), not filled.
- **Determinism:** Run twice with same input, assert identical `drainageElevation` and `filledDepth` output.
- **Flat grid (all same elevation):** Assert no fills — no hex is lower than neighbors.

### 2b. Implement `fillDepressions`

```typescript
export function fillDepressions(data: WorldGenData): void
```

Algorithm (priority-flood):
1. Copy `elevation` into `drainageElevation`.
2. Create a `resolved: Uint8Array` (0/1).
3. Build a min-heap seeded with edge hexes, ocean hexes (`isOcean[idx] === 1`), and lake hexes (`terrain[idx] === 'lake'`), all at their true elevation. Mark resolved.
4. While heap is not empty:
   - Pop lowest-elevation resolved hex.
   - For each unresolved neighbor (use `getNeighborIndices` from `lakeGeneration.ts` — **extract this to a shared utility first**, see Step 2c):
     - If `elevation[neighbor] >= drainageElevation[current]`: natural drain. Set `drainageElevation[neighbor] = elevation[neighbor]`.
     - Else: depression. Set `drainageElevation[neighbor] = drainageElevation[current] + DRAIN_EPSILON`.
     - Mark resolved, push to heap.
5. Compute `filledDepth[idx] = drainageElevation[idx] - elevation[idx]` for all hexes.

**Min-heap:** Implement a simple binary min-heap (array-based) in a local helper or a small `src/engine/minHeap.ts` utility. No external dependencies. Alternatively, since the grid is tiny (300 hexes), a sorted array with `splice` is acceptable for Phase 1 — but a heap is cleaner.

### 2c. Extract shared neighbor helper

`lakeGeneration.ts` has `getNeighborIndices` as a private function. `depressionFilling.ts` needs the same logic. **Extract** `getNeighborIndices` into `src/engine/hexGridUtils.ts` (or similar) and import it from both files. Update `lakeGeneration.ts` imports — no behavioral change.

**Test:** Run all existing lake and river tests — must still pass after the extraction.

## Step 3: Modify River Generation (Part 2 — Coastal Continuation)

**File:** `src/engine/riverGeneration.ts`
**Test file:** `src/engine/__tests__/riverGeneration.test.ts`

### 3a. Update tests first

- **Update existing termination test** — currently asserts rivers end at `ocean`, `coastal_shallows`, `lake`, or confluence. Update to assert rivers end at `ocean`, `deep_ocean`, `tropical_ocean`, grid edge, `lake`, or confluence. Remove `coastal_shallows` from valid terminal terrains (rivers should pass through it now).
- **Add test: rivers use drainageElevation** — Hand-craft a `WorldGenData` with a known depression. Run `fillDepressions` then `generateRivers`. Assert the river routes through the filled depression instead of dying there.
- **Add test: coastal continuation** — Hand-craft a grid where a high-elevation source slopes down to `coastal_shallows` then `ocean`. Assert the river path includes shallows hexes and terminates at `ocean`.
- **Add test: edge termination** — Hand-craft a grid where the slope leads to a map edge with no ocean. Assert river terminates at the edge hex.
- **Add test: coastal safety cap** — Hand-craft a wide band of `coastal_shallows` (> `RIVER_COASTAL_MAX_STEPS` wide). Assert river stops within the cap even if it hasn't reached open ocean.
- **Downhill test update** — Rivers now route on `drainageElevation`, not `elevation`. Update the downhill assertion to check against `drainageElevation` rather than `elevation`, since the river may "climb" over filled depressions in the original elevation but always descends in `drainageElevation`.

### 3b. Implement changes to `generateRivers`

1. **Use `drainageElevation` for routing.** At the top of `generateRivers`, determine the routing surface:
   ```typescript
   const routeElev = data.drainageElevation.some(v => v > 0) ? data.drainageElevation : data.elevation;
   ```
   This is the fail-soft fallback — if `fillDepressions` never ran, `drainageElevation` is all zeros and we fall back to `elevation`.

2. **Replace all `elevation[...]` references** in the neighbor-comparison loop (lines 58, 67-74, 78-87) with `routeElev[...]`.

3. **Update termination logic** (replace line 101):
   ```typescript
   // Continue through shallows — only terminate at open ocean, grid edge, or lake
   if (nTerrain === 'ocean' || nTerrain === 'deep_ocean' || nTerrain === 'tropical_ocean') break;
   if (isEdgeHex(currentCol, currentRow, cols, rows)) break;
   if (nTerrain === 'lake') break;
   if (hasRiver[nIdx] === 1) break; // confluence
   ```

4. **Add `isEdgeHex` helper** (local to file or in `hexGridUtils.ts`):
   ```typescript
   function isEdgeHex(col: number, row: number, cols: number, rows: number): boolean {
     return col === 0 || col === cols - 1 || row === 0 || row === rows - 1;
   }
   ```

5. **Add coastal step counter** — track how many `coastal_shallows`/`coast` hexes the river has crossed. If it exceeds `RIVER_COASTAL_MAX_STEPS`, break.

6. **Remove the flat-terrain workaround** (lines 77-88). With `drainageElevation`, there are no flat spots that need special handling — the epsilon bumps ensure strict downhill ordering through filled areas.

**Test:** Run all river tests. The updated termination test should pass. The downhill test should pass against `drainageElevation`.

## Step 4: Depression Lakes (Part 4)

**New file:** `src/engine/depressionLakes.ts`
**New test file:** `src/engine/__tests__/depressionLakes.test.ts`

### 4a. Write tests first

Use hand-crafted `WorldGenData` with pre-set `filledDepth`, `hasRiver`, `terrain`, and `lakeIds`.

Tests:
- **3-hex river-fed depression → lake:** Set 3 contiguous hexes with `filledDepth > 0` and `hasRiver === 1` on at least one. Assert all 3 get `terrain = 'lake'` and valid `lakeIds`.
- **1-hex depression → stays unchanged:** Set 1 hex with `filledDepth > 0` and `hasRiver === 1`. Assert terrain unchanged (below `DEPRESSION_LAKE_MIN_SIZE`).
- **Unfed depression → stays unchanged:** Set 3 contiguous hexes with `filledDepth > 0` but no `hasRiver`. Assert terrain unchanged.
- **No overlap with existing lakes:** Set a hex with `lakeIds >= 0` already. Assert `filledDepth` is 0 at that hex (from depression-filling design) and it's not touched.
- **Lake IDs don't collide:** If `lakeIds` already has IDs 0-2 from `generateLakes`, assert new depression lakes get IDs starting at 3+. Find the current max lakeId before assigning new ones.
- **Determinism:** Same input → same output.

### 4b. Implement `promoteDepressionLakes`

```typescript
export function promoteDepressionLakes(data: WorldGenData): void
```

1. Find the current max `lakeId` in `data.lakeIds` (so new IDs don't collide).
2. Create a `visited: Uint8Array` for flood-fill.
3. For each hex where `filledDepth[idx] > 0` and not visited:
   - Flood-fill contiguous hexes with `filledDepth > 0` using `getNeighborIndices`.
   - Check if any hex in the cluster has `hasRiver[idx] === 1`.
   - If cluster size >= `DEPRESSION_LAKE_MIN_SIZE` AND river-fed:
     - Assign new `lakeId`, set `terrain[idx] = 'lake'` for all hexes in cluster.
   - Mark all cluster hexes as visited regardless.

## Step 5: Lake Outflow (Part 3)

**New file:** `src/engine/lakeOutflow.ts`
**New test file:** `src/engine/__tests__/lakeOutflow.test.ts`

### 5a. Write tests first

Tests:
- **Lake with inflow → outflow spawned:** Hand-craft a lake cluster with `hasRiver` on one hex. Set surrounding elevations so there's a clear downhill path from the pour-point to an ocean hex. Assert an outflow `RiverPath` is added to `data.riverPaths` and `hasRiver` is marked on outflow hexes.
- **Lake without inflow → no outflow:** Lake cluster with no `hasRiver` hexes. Assert no new river path added.
- **Lake adjacent to ocean → no outflow:** All non-lake neighbors are ocean. Assert no outflow (lake drains directly).
- **Outflow reaches ocean:** Assert the last hex of the outflow path is at ocean, deep_ocean, tropical_ocean, edge, or confluence.
- **Outflow too short → discarded:** Pour-point is 1 hex from ocean. Outflow path would be length 1, below `LAKE_OUTFLOW_MIN_LENGTH`. Assert it's discarded.
- **Lake chain:** Two lakes at different elevations, upper lake feeds lower. Assert upper lake gets outflow to lower, lower lake gets outflow toward ocean.
- **Determinism:** Same input → same output.

### 5b. Implement `generateLakeOutflows`

```typescript
export function generateLakeOutflows(data: WorldGenData): void
```

1. Collect all lake clusters from `lakeIds`. Group hex indices by lake ID.
2. Sort lakes by average elevation (lowest first) — ensures downstream lakes are processed before upstream ones check for outflows.

   Wait — the design says "Process lakes in elevation order (lowest first) so downstream lakes receive their inflows before we check whether they have outflows." But actually we want to process **highest first** so that when we route an outflow from a high lake and it reaches a low lake, the low lake then has an inflow when we process it. Re-read the design... it says lowest first. Think about this:
   - Lake A (high) has inflow river. We want to spawn its outflow.
   - Lake A's outflow flows down to Lake B (low).
   - Lake B now has an inflow (from Lake A's outflow).
   - Lake B spawns its own outflow toward ocean.

   If we process **highest first**, Lake A's outflow marks `hasRiver` on Lake B's hexes. Then when we reach Lake B, it has an inflow and we spawn its outflow. This is correct.

   **Process highest elevation first, not lowest.** This contradicts the design doc — flag this as a design correction.

3. For each lake cluster (highest elevation first):
   a. Check if any hex has `hasRiver === 1`. If not, skip.
   b. Find pour-point: for every hex in the cluster, check non-lake non-ocean neighbors. Pick the one with lowest `drainageElevation`.
   c. Route outflow from pour-point using steepest-descent on `drainageElevation` (same logic as `generateRivers` core loop). Include the same coastal continuation and edge termination logic.
   d. Prepend one lake-edge hex to the path (the lake hex adjacent to the pour-point) so the river visually exits the lake.
   e. If path length >= `LAKE_OUTFLOW_MIN_LENGTH`, mark `hasRiver`, push to `riverPaths`.

**Shared routing logic:** The steepest-descent core loop is duplicated between `generateRivers` and `generateLakeOutflows`. **Extract** a shared `routeDownhill(data, startCol, startRow, visited?): HexCoord[]` function into `src/engine/riverRouting.ts` that both callers use. This function:
- Takes a start hex and routes downhill on `drainageElevation`
- Handles coastal continuation, edge termination, lake termination, confluence detection
- Returns the path
- Accepts an optional pre-populated `visited` set (so outflow routing can exclude lake hexes from revisiting)

This avoids duplicating the routing + termination logic.

## Step 6: Wire Pipeline

**File:** `src/components/HexMap/useRivers.ts`

Update the pipeline:

```typescript
import { fillDepressions } from '../../engine/depressionFilling';
import { promoteDepressionLakes } from '../../engine/depressionLakes';
import { generateLakeOutflows } from '../../engine/lakeOutflow';

export function useRivers(cols: number, rows: number, seed: number): RiverPath[] {
  return useMemo(() => {
    const data = createWorldGenData(cols, rows, seed);
    generateLakes(data);
    fillDepressions(data);
    generateRivers(data);
    promoteDepressionLakes(data);
    generateLakeOutflows(data);
    return data.riverPaths;
  }, [cols, rows, seed]);
}
```

**Test:** Run full test suite (`npm test`). All old and new tests pass.

## Step 7: Integration Tests

**File:** `src/engine/__tests__/worldGen-integration.test.ts` (extend existing)

Add:
- **No river ends on land:** Generate worlds from seeds 1–5. For every river path, assert the last hex is ocean/deep_ocean/tropical_ocean terrain, or a grid edge, or has `hasRiver` (confluence). Assert it is **not** grassland, desert, hills, etc. This is the primary regression test.
- **Depression lakes have coastline:** For seeds 1–5, any hex with `terrain === 'lake'` and `filledDepth > 0` should have at least one non-lake neighbor (coastline needs a land-water boundary to render).
- **Performance:** Full pipeline completes in < 500ms for 20×15 grid.

## Step 8: Visual Verification

After all tests pass:
1. Run `npx vite build` — must succeed with no type errors.
2. User runs `npm run dev` on their machine.
3. Generate several worlds with different seeds. Visually confirm:
   - Rivers reach the ocean (or grid edge) — no grassland dead-ends
   - Lakes along river courses render with coastline
   - Lake outflow rivers are visible exiting lakes
   - No visual regressions in coastline or fog-of-war

## Step 9: Definition of Done

Per CLAUDE.md, once tests pass and visual verification is complete:
1. Commit all changes
2. Push to GitHub
3. Merge to main
4. Vercel auto-deploys
5. Update `Docs/project-status.md`, `Docs/project-history.md`, `Docs/changelog.md`
6. Update Notion backlog

## Design Correction Log

- **Lake outflow processing order:** Design says "lowest first." Implementation should be **highest first** — high-elevation lakes need to route their outflows first so that downstream lakes register inflows before being processed. Flag to user for design doc update.

## File Summary

| File | Action |
|------|--------|
| `src/engine/worldGenData.ts` | Modify — add fields + constants |
| `src/engine/hexGridUtils.ts` | **New** — extract `getNeighborIndices` + `isEdgeHex` |
| `src/engine/minHeap.ts` | **New** — simple binary min-heap for priority-flood |
| `src/engine/depressionFilling.ts` | **New** — `fillDepressions` |
| `src/engine/depressionLakes.ts` | **New** — `promoteDepressionLakes` |
| `src/engine/riverRouting.ts` | **New** — shared `routeDownhill` extracted from river logic |
| `src/engine/riverGeneration.ts` | Modify — use `drainageElevation`, coastal continuation, use shared routing |
| `src/engine/lakeGeneration.ts` | Modify — import `getNeighborIndices` from `hexGridUtils` |
| `src/engine/lakeOutflow.ts` | **New** — `generateLakeOutflows` |
| `src/components/HexMap/useRivers.ts` | Modify — add 3 pipeline calls |
| `src/engine/__tests__/depressionFilling.test.ts` | **New** |
| `src/engine/__tests__/depressionLakes.test.ts` | **New** |
| `src/engine/__tests__/lakeOutflow.test.ts` | **New** |
| `src/engine/__tests__/riverGeneration.test.ts` | Modify — update termination + downhill tests |
| `src/engine/__tests__/worldGen-integration.test.ts` | Modify — add regression tests |
