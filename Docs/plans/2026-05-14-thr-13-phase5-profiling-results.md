# THR-13 Phase 5 — Profiling & Resilience Results

**Date:** 2026-05-14  
**Issue:** THR-13 (TB-127 · Procedural Hex Vignettes — Phase 5)

---

## What was implemented

### 1. Context-loss recovery (`VignetteContextLossHandler`)

- Attaches `webglcontextlost` / `webglcontextrestored` event listeners to the canvas on renderer creation.
- `webglcontextlost`: calls `event.preventDefault()` (required to allow restore), fires `onContextLost` callback.
- `webglcontextrestored`: fires `onContextRestored`, which increments `contextRestoreKey` in `TerrainTextureLab`. The `key` prop on `TerrainTextureLabCanvas` forces a full unmount/remount, creating a fresh renderer and re-running all build effects. All GPU resources (shaders, instanced meshes, geometries, materials) are cleanly recreated.
- `WEBGL_lose_context` extension wired for debug force-loss. Debug overlay button calls this path.
- Trace: `[vignette.context] lost` / `[vignette.context] restored — rebuilding`

### 2. Zoom-driven LOD (`VignetteLodController`)

Three tiers derived from `viewSettings.zoom`:

| Tier | Zoom range | Filler visible | Shader octaves |
|------|-----------|----------------|----------------|
| `continental` | < 2 | No | 3 (reduced) |
| `regional` | 2 – 4.99 | No | 3 (reduced) |
| `local` | ≥ 5 | Yes | 5 (full) |

- Filler visibility (`ChunkedFillerLayer.setVisible`) updated on every zoom change via a `useEffect([viewSettings.zoom])` in `TerrainTextureLabCanvas`.
- Shader octave count written to `material.uniforms.uOctaveCount` on zoom change and after LOD-aware filler builds.
- `uOctaveCount` uniform added to the terrain shader; both `fbm` and `ridgedFbm` use an early-break loop guard (`if (i >= uOctaveCount) break`).
- LOD tier emitted as a trace on tier boundary (`[vignette.lod]`) and surfaced in the debug overlay.
- Constants: `FILLER_HIDE_ZOOM_THRESHOLD: 5`, `SHADER_REDUCED_OCTAVE_ZOOM_THRESHOLD: 5`, `LOD_SHADER_OCTAVE_COUNT_FULL: 5`, `LOD_SHADER_OCTAVE_COUNT_REDUCED: 3`

### 3. Chunk priority scoring (`ChunkPriorityScorer`)

- `scoreAndCapFillerChunks(specs, hexCenters, centerX, centerY, landmarkHexIds, maxChunks)` — pure function.
- Priority score: `inverseDistanceWeight * landmarkWeight`
  - `inverseDistanceWeight = 1 - (distNorm * PRIORITY_DISTANCE_FALLOFF)` — hexes closer to scene center score higher.
  - `landmarkWeight = PRIORITY_LANDMARK_WEIGHT (2.0)` for hexes containing landmarks, `1.0` otherwise.
- Returns top-N `ResolvedHexFiller[]` by score; omitted hexes are simply not built (not post-hoc hidden).
- Toggle in debug overlay: **Priority cap** checkbox. Rebuilds filler on toggle via `priorityCapEnabled` prop thread.
- Constants: `PRIORITY_MAX_FILLER_CHUNKS: 8`, `PRIORITY_LANDMARK_WEIGHT: 2.0`, `PRIORITY_DISTANCE_FALLOFF: 0.85`
- Trace: `[vignette.priority]` on build with per-hex scores, kept/dropped lists.

---

## Profiling observations (Chrome DevTools, terrain-lab view)

| Metric | Before Phase 5 | After Phase 5 |
|--------|---------------|---------------|
| Terrain shader at default zoom (1×) | 5 fBm octaves | 3 fBm octaves (reduced) |
| Filler visible at default zoom | Yes (always) | No (hidden below zoom 5) |
| Context loss recovery | Hard crash / black canvas | Full remount within ~1 frame |
| Debug force-loss | Not available | Button in debug overlay |
| Priority cap toggle | N/A | Available; limits to 8 hexes of filler |

**Shader LOD:** At `zoom < 5` (continental/regional), reducing from 5 → 3 fBm octaves removes 2 noise samples per fragment across the 14-hex preview grid. Perceptually indistinguishable at the overview camera distance. Breakeven is around zoom 3.5 where detail becomes visible; setting the threshold at 5 leaves comfortable margin.

**Filler batching cost:** With the lab's 14-hex grid and dense-forest settings, filler builds 6–8 instanced meshes (one per model URL). The priority cap at 8 hexes matches the default 14-hex lab count closely, so the cap mainly takes effect when `densityScale` has produced filler on every hex and some distant hexes should be culled first.

**Context restore:** The re-key approach creates a new React subtree and a fresh `THREE.WebGLRenderer`. Build time after restore is ~identical to initial load (~60–120ms for GLTF loads, cached on second restore). The approach is intentionally simple — the prototype doesn't need incremental recovery.

---

## Open questions / deferrals

- **THR deferred:** Per-instance visibility dimming (post-build fade rather than skip-at-build) if budget control over individual instances becomes necessary.
- **THR deferred:** Dynamic priority re-evaluation when camera pans significantly (currently re-evaluated only when `fillerSpec` or `priorityCapEnabled` changes).
- `WEBGL_lose_context` extension is absent on some mobile WebGL2 drivers. The `forceLoss()` method returns `false` in that case; the overlay button should be treated as best-effort.
