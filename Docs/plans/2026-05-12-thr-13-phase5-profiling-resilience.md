# THR-13 · Procedural Hex Vignettes — Phase 5: Profiling & Resilience

**Date:** 2026-05-12
**Status:** Ready for Dev (CC pickup)
**Parent design:** `Docs/plans/2026-04-08-procedural-hex-vignettes.md` (§5.8 Context Loss, §7.3 Production Budget / Priority, §7.4 Zoom / LOD)
**Original ID:** TB-127
**Build target:** Terrain Texture Lab (`?view=terrain-lab`) only. Phase 6 (game integration) is out of scope.

---

## 1. Why this is a CC pickup, not a Cowork design

Every architectural decision needed for Phase 5 is already locked in the parent plan doc (2026-04-08): chunked batching is the substrate, custom unlit instance material is the shader, slot/zone resolution is deterministic, click-target registry is per-chunk. Phase 5 is the *hardening pass* on top of that architecture — observability, recovery behavior, and zoom-driven degradation that the lab needs before any game-integration work can begin.

There is no creative-direction call inside this ticket. The four deliverables (context-loss recovery, chunk-priority cap, zoom/LOD, profiling artifact) are all named and bounded in §5.8 / §7.3 / §7.4 of the parent doc. CC's job is to wire them into `TerrainTextureLabCanvas` and the vignette layers, instrument the traces, and run profiling at 1920×1080 on the integrated-GPU target.

## 2. Dependencies / Pickup Order

Phase 5 sits on top of Phases 3 and 4. **Both must land before Phase 5 work begins:**

- **THR-11 (Phase 3 · Landmark Batch Layer)** — provides `ChunkedLandmarkLayer` and the per-chunk landmark batch buffers that the priority-cap drop logic protects. Without Phase 3 there are no landmark batches to preserve.
- **THR-12 (Phase 4 · Interaction & UI Validation)** — provides the hover/selection feedback path and the debug toggles that Phase 5 reuses for profiling-overlay surfaces (zone, chunk, FPS, draw-call count).

If both are still in flight when Phase 5 is picked up, CC should mark this issue as blocked (assignee:me, In Dev, comment: "blocked on THR-11 / THR-12 — pausing until landmark batches and lab debug toggles ship"). Do not attempt to land Phase 5 in parallel — the diffs collide on `TerrainTextureLabCanvas.tsx` and `lab/vignette/*`.

**Mutex with:** THR-11, THR-12
**Parallel-safe with:** all non-`lab/` work

## 3. Scope (the four deliverables)

### 3.1 WebGL context-loss recovery in the terrain lab

The main HexMapV2 canvas already has `WebGLDiagnostics` (`src/components/HexMapV2/diagnostics/WebGLDiagnostics.ts`) that wires `webglcontextlost` / `webglcontextrestored` and tracks restore counts. The terrain lab canvas (`TerrainTextureLabCanvas.tsx`) does *not* — context loss in the lab is currently unhandled and would silently break the scene.

**Approach:** introduce a lab-scoped variant that wraps the same event pattern. Do not copy `WebGLDiagnostics` wholesale; the lab needs a lighter wrapper because it doesn't need the full FPS / triangle stats surface yet.

**New module:** `src/components/HexMapV2/lab/vignette/VignetteContextLossHandler.ts`

Responsibilities:
1. `attach(canvas, renderer)` — register `webglcontextlost` (call `e.preventDefault()` to allow restore) and `webglcontextrestored` listeners.
2. On loss: cancel the active RAF loop, clear chunk references in the resolver's chunk registry, set `state.contextLost = true` so renderers skip work, emit `vignette.contextLost` trace.
3. On restore: rebuild all chunks via the existing resolver pass (Resolver Passes from parent doc §3.4), re-upload instance buffers, increment `restoreCount`, emit `vignette.contextRestored` trace.
4. `detach()` — remove listeners (called on canvas unmount).

**Fail-soft contract:** if restore happens before the resolver has run the first pass (e.g. user causes a loss before any vignette resolves), the handler does nothing — the next normal resolve pass will populate empty chunks. Never throw from the listener body.

### 3.2 Chunk-priority cap behavior

Parent plan §7.3 declares the priority formula:

```
priorityScore = visibilityWeight × zoomWeight × inverseDistanceWeight × landmarkPresenceWeight
```

This currently exists as a field on `VignetteChunk` but no code reads or writes it. Phase 5 implements the producer and the consumer.

**New module:** `src/components/HexMapV2/lab/vignette/ChunkPriorityScorer.ts`

Producer (`computeChunkPriority(chunk, camera, hexCenter)`):
- `visibilityWeight`: `1.0` if chunk bounds intersect camera frustum, `0.0` otherwise (Three.js `Frustum.intersectsBox`).
- `zoomWeight`: linear from `0.5` at `MAX_CAMERA_ZOOM` to `1.0` at `MIN_CAMERA_ZOOM`. Far zoom = lower per-chunk weight (fewer instances per chunk needed at distance).
- `inverseDistanceWeight`: `1 / max(1, distance(camera, chunk.bounds.center))`. Closer = higher.
- `landmarkPresenceWeight`: `1.5` if the chunk contains any landmark batches, `1.0` otherwise. Landmark-heavy chunks beat empty ones.

Consumer (in `ChunkedFillerLayer`):
- Compute total filler instance count across all chunks each frame *or* on chunk-set change (don't recompute every frame at first — wire on chunk-set mutation and reuse last-known total).
- If total > `VIGNETTE_GLOBAL_FILLER_BUDGET`, sort chunks by `priorityScore` ascending, drop filler batches from the lowest-priority chunks until under budget. **Never drop landmark batches** (parent §7.3: "never drop landmark batches before filler").
- Dropped state is per-chunk: a chunk that has had filler dropped should re-eligible on the next priority pass when budget allows.

**New constant** (add to `terrainTextureLabPresets.ts`):
- `VIGNETTE_GLOBAL_FILLER_BUDGET: 12_000` — total filler instances across all active chunks before priority drop fires. Sized to fit the 12×12 chunk × 110 dense-forest density baseline but leave headroom for multi-chunk lab scenes.

### 3.3 Zoom-driven LOD

Parent plan §7.4 specifies the tier table. Phase 5 wires it into the lab's render loop.

**New module:** `src/components/HexMapV2/lab/vignette/VignetteLodController.ts`

Responsibilities:
1. `computeLodTier(zoom)` returns `'hero-local' | 'regional' | 'continental' | 'full-world'`. Thresholds come from existing constants:
   - `zoom < FILLER_HIDE_ZOOM_THRESHOLD` (default 5) → filler degraded
   - `zoom < SHADER_REDUCED_OCTAVE_ZOOM_THRESHOLD` (default 5) → shader octaves reduced
   - Add two more named thresholds (see Constants Table below) for `continental` vs `full-world`.
2. `applyTier(tier, chunks, shaderUniforms)`:
   - `hero-local` / `regional`: all filler visible, full shader.
   - `continental`: filler hidden (chunk batches' `visible = false`), landmark silhouettes shown (existing 2D icon fallback path from §12 fail-soft), shader octaves reduced via uniform.
   - `full-world`: filler hidden, landmark icons only, shader at flat color / lowest octave count.
3. Listen to lab's existing `viewSettings.zoom` change; debounce tier transitions to avoid thrash at threshold boundaries (160ms debounce should be fine — empirically tune).

**Shader hook:** `terrainTextureLabShader.ts` already accepts uniforms. Add a `uOctaveCount` (default 5, range 1–5) and gate the inner fBm/cellular octave loops on it.

### 3.4 Chrome profiling artifact on integrated GPU

Parent plan §7.2 sets the target: under 45 draw calls in the terrain lab. Phase 5 produces the evidence that the target is met, including under the new zoom-LOD and priority-cap pressure.

**Deliverable:** `Docs/plans/2026-05-XX-thr-13-phase5-profiling-results.md` (CC writes this at closeout). Contains:
- 1920×1080 screenshots of the lab at four zoom tiers (hero-local, regional, continental, full-world).
- Per-tier draw-call count from `renderer.info.render.calls` (existing Three.js stat) and frame time from `performance.now()` delta sampled over 120 frames.
- Profile under both `large` and `epic` map presets (parent §7.2: "Validate on large/epic map presets").
- Pass/fail call against the 4ms-at-1080p target from THR-13's summary.
- Console output excerpt showing `vignette.chunk` and `vignette.contextLost` traces firing as expected (toggle the lab debug overlay's "Force context loss" button — see §3.5).

If the target is missed, Phase 5 is *not* failed — the profiling doc lists the bottlenecks and either (a) names which constant to tune, or (b) files a follow-up Linear issue for the tuning work. The chunked-batching architecture is supposed to make this kind of tuning a constants change, not a re-architecture.

### 3.5 Lab debug overlay extensions

Phase 4 (THR-12) lands the base debug toggle UI. Phase 5 adds three buttons / displays to that surface:
- **Force context loss** — invokes `WEBGL_lose_context.loseContext()` extension so the recovery path is testable from the lab UI. Restore is triggered by `restoreContext()`.
- **Show chunk priority overlay** — colors chunk bounds by `priorityScore` (red = high, blue = low) so the drop ordering is legible.
- **LOD tier readout** — text strip showing the active tier and the zoom value that drives it.

## 4. Three-pillar coverage

### Engine pillar

- `VignetteContextLossHandler` — new module. Lab-scoped. Listens on canvas, mutates `VignetteChunkRegistry` state (clear on loss, rebuild on restore).
- `ChunkPriorityScorer` — new module. Pure function `(chunk, camera, hexCenter) → number`, called when chunk set mutates or camera moves past a threshold.
- `VignetteLodController` — new module. Pure tier function + side-effecting `applyTier` that mutates chunk `visible` flags and `terrainTextureLabShader` uniforms.
- `ChunkedFillerLayer` — extended: consumes priority scores, drops below-budget filler batches in order, exposes "currently dropped" set for the debug overlay.
- `terrainTextureLabShader.ts` — extended: `uOctaveCount` uniform.

### Content pillar

**N/A** — Phase 5 does not author new templates, prose, or data tables. It is engineering hardening on already-authored vignette content (forest, mountain, swamp profiles). The existing `FillerProfiles` and `VignetteResolver` outputs are the input to Phase 5 work; no new content surface.

Explicit N/A rationale: this prevents a future audit from flagging Phase 5 as "missing Content pillar" — it isn't missing, it's structurally absent because the deliverable is performance/recovery behavior over existing data.

### UI pillar

- `TerrainTextureLabCanvas.tsx` — extended: registers context-loss handler on attach, ticks priority/LOD on render loop, wires `WEBGL_lose_context` test extension behind dev-only flag.
- `VignetteDebugOverlay.tsx` — extended: three new affordances from §3.5 (force-loss button, priority overlay toggle, LOD tier readout).
- No new modal or full-screen surface. Phase 5 is observability inside the existing lab.

### Wiring

| Component | Engine touchpoint | UI touchpoint |
| --- | --- | --- |
| Context loss | `VignetteContextLossHandler.attach()` in canvas mount | "Force loss" button + restore trace toast in lab |
| Priority cap | `ChunkPriorityScorer` + drop logic in `ChunkedFillerLayer` | "Priority overlay" toggle in debug panel |
| Zoom LOD | `VignetteLodController.applyTier()` on zoom-debounced commit | "LOD tier" readout in debug panel |
| Profiling | `renderer.info.render` sampling helper | None — output is the markdown artifact |

Traces emitted (all routed through the existing lab trace channel, *not* the game's `traceBuffer`, since the lab is detached from the engine):
- `vignette.contextLost` `{ time, chunkCount, hadFiller, hadLandmarks }`
- `vignette.contextRestored` `{ time, restoreCount, rebuildMs }`
- `vignette.priorityCap` `{ totalInstances, budget, droppedChunks: number, droppedInstances: number }`
- `vignette.lodTier` `{ prevTier, nextTier, zoom, debouncedAtMs }`

## 5. Constants table

| Constant | Default | Purpose |
| --- | --- | --- |
| `VIGNETTE_GLOBAL_FILLER_BUDGET` | 12000 | Total filler instances across all chunks before priority cap drops the lowest-priority chunks |
| `VIGNETTE_PRIORITY_LANDMARK_BONUS` | 1.5 | Multiplier on `priorityScore` when a chunk contains landmarks |
| `VIGNETTE_PRIORITY_VISIBILITY_WEIGHT_OFF` | 0.0 | `visibilityWeight` for chunks outside the frustum |
| `VIGNETTE_PRIORITY_VISIBILITY_WEIGHT_ON` | 1.0 | `visibilityWeight` for chunks inside the frustum |
| `VIGNETTE_PRIORITY_ZOOM_WEIGHT_MIN` | 0.5 | Zoom-weight floor (at max zoom-out) |
| `VIGNETTE_PRIORITY_ZOOM_WEIGHT_MAX` | 1.0 | Zoom-weight ceiling (at max zoom-in) |
| `VIGNETTE_LOD_CONTINENTAL_ZOOM_THRESHOLD` | 3.0 | Below this zoom, drop into `continental` tier (filler hidden, landmark icons) |
| `VIGNETTE_LOD_FULLWORLD_ZOOM_THRESHOLD` | 1.5 | Below this zoom, drop into `full-world` tier (flat shader, icons only) |
| `VIGNETTE_LOD_TRANSITION_DEBOUNCE_MS` | 160 | Debounce on tier transitions to prevent threshold thrash |
| `VIGNETTE_SHADER_OCTAVE_COUNT_FULL` | 5 | Default fBm/cellular octave count |
| `VIGNETTE_SHADER_OCTAVE_COUNT_REDUCED` | 3 | Octave count at `continental` tier |
| `VIGNETTE_SHADER_OCTAVE_COUNT_MINIMUM` | 1 | Octave count at `full-world` tier |
| `VIGNETTE_PROFILING_FRAME_SAMPLE_COUNT` | 120 | Frames sampled for per-tier draw-call/timing capture |

All added to `TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS` in `terrainTextureLabPresets.ts`.

## 6. Tracing

```typescript
interface VignetteContextLossTrace {
  type: 'vignette.contextLost';
  time: number;
  chunkCount: number;
  hadFiller: boolean;
  hadLandmarks: boolean;
}

interface VignetteContextRestoredTrace {
  type: 'vignette.contextRestored';
  time: number;
  restoreCount: number;
  rebuildMs: number;
}

interface VignettePriorityCapTrace {
  type: 'vignette.priorityCap';
  totalInstances: number;
  budget: number;
  droppedChunks: number;
  droppedInstances: number;
}

interface VignetteLodTierTrace {
  type: 'vignette.lodTier';
  prevTier: 'hero-local' | 'regional' | 'continental' | 'full-world';
  nextTier: 'hero-local' | 'regional' | 'continental' | 'full-world';
  zoom: number;
  debouncedAtMs: number;
}
```

## 7. Fail-soft table

| Failure | Fallback |
| --- | --- |
| `WEBGL_lose_context` extension unavailable | Disable "Force loss" button in overlay; do not error |
| Context restore happens before first resolve pass | Handler no-ops; next normal resolve will populate chunks |
| Restore takes >2 seconds | Show "Restoring scene…" overlay; do not block input |
| Priority drop selects a chunk currently mid-rebuild | Skip that chunk in this pass; try again next frame |
| LOD tier transition fires while shader compile pending | Defer uniform write to next frame; do not crash |
| Profiling sample window underruns (renderer paused) | Mark sample inconclusive; do not log a misleading mean |
| `renderer.info.render.calls` missing (Three.js version skew) | Skip draw-call count in profiling artifact; log warn |

## 8. Determinism

Phase 5 introduces no new PRNG calls. Priority scoring is a pure function of camera state and chunk bounds. LOD tier is a pure function of zoom plus debounce time (real-time, not seeded — debounce is for human perception, not simulation state). Context-loss timing is non-deterministic by nature; restore *behavior* is deterministic given the same chunk registry contents.

## 9. Browser-verify artifact tooling

Per `## Definition of Done` § Browser-verify UI changes — Phase 5 touches the UI pillar (lab canvas + debug overlay). Closeout artifact requirements:

1. **Tool:** Claude-in-Chrome MCP (`mcp__Claude_in_Chrome__*`). Playwright cannot see WebGL canvas content per CLAUDE.md viewport contract; this entire ticket is WebGL.
2. **Screenshots required at 1920×1080:**
   - Lab loaded with vignettes, hero-local zoom — baseline.
   - "Force context loss" pressed, then restored — shows scene comes back identical.
   - Priority overlay enabled, scrolled past visible chunks — shows red→blue grade.
   - Continental and full-world zoom — shows filler hidden, landmark icons.
3. **Console output:** capture via `mcp__Claude_in_Chrome__read_console_messages` (warn+error filter). Empty output is valid — embed `(no errors or warnings)` if so.
4. **`__DEBUG` proof:** the lab is *not* on the main game's `__DEBUG` bridge. Instead, prove wiring via `window.__TERRAIN_LAB` console API (exists per parent plan §6.4). Capture one query that returns the active LOD tier and one that returns the latest `vignette.priorityCap` trace.

## 10. NFP compliance

| NFP | Status | Notes |
| --- | --- | --- |
| 1. Tunability | PASS | All new behaviors gated on named constants in §5 |
| 2. Inspectability | PASS | Four new trace types; debug overlay extended with priority + LOD readouts |
| 3. Determinism | PASS | No new PRNG; priority + LOD are pure functions of observable state |
| 4. Fail-soft | PASS | §7 covers context-loss edges, missing renderer stats, transition thrash |
| 5. Narrative > mechanical | PASS | Landmarks always preserved over filler in priority drop; matches design intent |
| 6. Additive | PASS | All changes are new modules + extensions to existing extension points; no refactor of Phase 2/3 batches |
| 7. Performance budget | PASS with note | This phase *is* the performance work; the §3.4 profiling artifact validates the budget |

## 11. Done when

- [ ] `VignetteContextLossHandler` wired into `TerrainTextureLabCanvas`; force-loss/restore button works end-to-end
- [ ] `ChunkPriorityScorer` produces deterministic scores; priority drop fires when total filler > `VIGNETTE_GLOBAL_FILLER_BUDGET` and preserves landmarks
- [ ] `VignetteLodController` transitions across all four tiers under `viewSettings.zoom` changes; shader octave count switches accordingly
- [ ] Four new trace types emitted on the lab's existing trace channel, visible in console with debug toggle on
- [ ] Lab debug overlay has "Force context loss", "Show priority overlay", "LOD tier readout"
- [ ] Constants added to `terrainTextureLabPresets.ts` (table in §5)
- [ ] Closeout profiling doc written at `Docs/plans/2026-05-XX-thr-13-phase5-profiling-results.md` per §3.4 — committed in the same PR as the implementation
- [ ] Browser-verify artifact per §9 in the closing commit body or Linear completion comment
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` clean; output pasted into closing comment
- [ ] Engine smoke not required (no `src/engine/` touched)
- [ ] `Fixes THR-13` in the merge commit body
