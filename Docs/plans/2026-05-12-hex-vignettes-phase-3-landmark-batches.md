# Procedural Hex Vignettes — Phase 3 Implementation Plan: Landmark Batch Layer

**Linear issue:** THR-11 (TB-125)
**Date:** 2026-05-12
**Author:** Cowork
**Status:** Ready for Dev
**Parent architecture doc:** `Docs/plans/2026-04-08-procedural-hex-vignettes.md` (authoritative — read first)
**Build target:** Terrain Texture Lab prototype (`?view=terrain-lab`) only. No live `HexMapV2` wiring in this phase.

---

## 1. Summary

Phase 1 (slot/zone resolution) and Phase 2 (chunked filler with custom unlit instance shader) are on `main` under `src/components/HexMapV2/lab/vignette/`. Landmarks in the terrain lab still render as cloned `THREE.Group` instances per `terrainTextureLabVignettePrototype` — one draw call per submesh per landmark.

Phase 3 replaces clone-based landmark rendering with **chunked `InstancedMesh` batches** that reuse the same shader path Phase 2 already validated. It also formalises the **Blender export contract** for landmark GLBs (≤3 material slots, merge-by-material in Blender) and stands up a **landmark click registry** keyed on slot anchors so Phase 4 can wire hover/selection and Phase 6 can lift the work into the game renderer.

Phase 3 does **not** ship interaction. The click registry is populated and queryable, but hover/selection feedback, raycaster integration, and the lab selection panel are deferred to Phase 4 (THR-12). Phase 3 is a draw-call refactor plus the click-target data plumb.

## 2. Three-Pillar Scope

| Pillar | In scope | Out of scope (deferred) |
|---|---|---|
| **Engine** | `ChunkedLandmarkLayer`, `VignetteClickRegistry`, landmark-instance material reuse, Blender export validator | Game-renderer wiring (Phase 6); LOD swap to icons (Phase 5); priority-aware cap dropping (Phase 5) |
| **Content** | Blender export contract documented in `Docs/art-pipeline/`; validator-emitted warnings for non-conforming assets | Re-exporting current landmark GLBs is the asset team's job, not CC's — validator surfaces work, doesn't perform it |
| **UI** | Terrain lab debug overlay extensions (landmark batch bounds toggle, instance count HUD); click registry inspector in lab dev console (`window.__TERRAIN_LAB.clickRegistry`) | Hover ring, selection callback panel, real raycaster click (all Phase 4) |

All three pillars present. Phase 4 (THR-12) explicitly picks up the UI interaction work.

## 3. Codesight / Blast Radius

**Files touched are all lab-scoped** — `src/components/HexMapV2/lab/**`. None of the high-impact files (`src/engine/graph.ts`, `src/types/index.ts`, `src/types/gameState.ts`, `src/types/traits.ts`, `src/engine/traceBuffer.ts`) are touched. Trace types use the existing `vignette.*` namespace already established by Phase 1/2.

No Blast Radius section required (no file with ≥100 importers in scope).

## 4. Engine Pillar

### 4.1 New modules

| Module | Responsibility |
|---|---|
| `src/components/HexMapV2/lab/vignette/ChunkedLandmarkLayer.ts` | Build chunked instanced landmark batches grouped by `modelId × materialSlot`. Mirror the `ChunkedFillerLayer` shape so the two can share lifecycle (build/clear/setVisible/dispose). |
| `src/components/HexMapV2/lab/vignette/VignetteClickRegistry.ts` | Populated from resolved landmark placements. Stores click targets keyed on `instanceIndex × batchKey`. Exposes `query(worldXY) → LocationClickTarget \| null` for Phase 4. |
| `src/components/HexMapV2/lab/vignette/LandmarkExportValidator.ts` | One-shot validator at GLB load time. Counts unique materials in the GLB; warns if >3. Returns a `LandmarkValidationReport` consumed by the layer. |

### 4.2 Data flow

```
terrainTextureLabVignettePrototype
  ├─ autoPlacements  ─┐                                 (existing)
  │                   │
  │                   ▼
  │            ChunkedLandmarkLayer.build(autoPlacements)
  │                   │
  │                   ├─→ load GLB per modelId          (cached)
  │                   ├─→ LandmarkExportValidator.run() (warns if >3 mats)
  │                   ├─→ extractSubmeshes()            (reused from filler)
  │                   ├─→ build InstancedMesh per (modelId × materialSlot)
  │                   ├─→ setMatrixAt for each placement
  │                   └─→ register click target per placement → registry
  │
  └─ clickTargets ────→ VignetteClickRegistry.replace(clickTargets)
                              │
                              └─→ Phase 4 raycaster reads from here
```

The prototype already emits `clickTargets: TerrainTextureLabVignetteClickTarget[]` (see `terrainTextureLabVignettePrototype.ts` line 45–53). Phase 3 wires that array into `VignetteClickRegistry` and augments each entry with the batch-instance identity (`{ batchKey, instanceIndex }`) so Phase 4 can flip a per-instance `aHoverMix` attribute later without re-querying the prototype.

### 4.3 Reuse Phase 2 shader

`createVignetteInstanceMaterial(color)` (from `VignetteInstanceMaterial.ts`) already supports per-instance `aVisibilityState` and `aHoverMix`. Landmark batches use the same material; the only differences vs. filler are:
- Landmarks default `visibilityState = 2` (visible) without remembered-state for now (Phase 5 wires fog).
- Landmark batches set `aHoverMix = 0` on build; Phase 4 will mutate it.

No shader changes in Phase 3.

### 4.4 PRNG / Determinism

Landmark placements are **already deterministic** — they come from `terrainTextureLabVignettePrototype` which uses `mulberry32(seed + hex.col * 101 + hex.row * 211)`. Phase 3 introduces no new randomness. The only PRNG callout is yaw variation per landmark instance, which is consumed from the existing prototype output. Phase 3's InstancedMesh build is a pure transformation of an already-seeded placement list.

### 4.5 Buffer lifecycle

`InstancedMesh.count` is fixed at build. If landmark count changes (re-resolve), call `ChunkedLandmarkLayer.build(...)` again — it disposes prior batches and registry entries via the same pattern as `ChunkedFillerLayer.clearBatches()`. No in-place buffer growth in Phase 3 (deferred to Phase 5 if profiling demands it).

## 5. Content Pillar

### 5.1 Blender export contract

Authoritative location: `Docs/art-pipeline/blender-export-contract.md` (new file — to be created in this phase, ~30 lines).

Contract (mirrors parent doc §5.5):

- **Landmarks:** ≤3 material slots. Merge-by-material in Blender before export.
- **Filler:** ≤2 material slots. Same merge rule.
- **Exceptional hero assets:** no hard rule (not in prototype scope).

The validator in `LandmarkExportValidator.ts` reports violations as `console.warn` and pushes a `LandmarkValidationReport` into a dev-only ring buffer queryable via `window.__TERRAIN_LAB.validationReports`. Non-blocking — the layer still renders the asset (truncating to first 3 materials), but the warning is loud enough that the asset team will notice on the next pass.

No re-export of current landmark assets is required for Phase 3 to ship. If the validator surfaces violations against existing assets in the lab catalogue, that becomes a follow-up content ticket — not a Phase 3 blocker.

### 5.2 No new prose, no new templates

This phase touches rendering only. The narrative `hexVignette` engine (`src/engine/hexVignette.ts`, `src/engine/vignetteProse.ts`) is a separate namespace and is **untouched**.

## 6. UI Pillar

### 6.1 Terrain lab debug overlay extensions

Existing `VignetteDebugOverlay.tsx` already has zone-rule visualisation. Phase 3 adds:

- **Landmark batch bounds toggle** — analogous to chunk-bounds toggle from Phase 2.
- **Instance count HUD** — small fixed-position readout showing `filler instances: N · landmark instances: M · landmark batches: K`.
- **Click registry inspector** — `console.table(window.__TERRAIN_LAB.clickRegistry.list())` for dev-only inspection. No on-screen panel until Phase 4.

### 6.2 What Phase 3 does **not** ship in UI

Deferred to Phase 4 (THR-12):
- Hover ring on landmarks
- Cursor change to pointer over a landmark
- Selection callback panel
- Raycaster integration with click registry
- `__DEBUG.gotoAgent`-style helper for landmarks

### 6.3 Browser-verify artefact

Per Definition of Done §Browser-verify UI changes, closing commit MUST include:

1. **Screenshot at 1920×1080** of `?view=terrain-lab` showing a populated lab chunk with landmark instances rendered. Use **Claude-in-Chrome** (`mcp__Claude_in_Chrome__computer` action: `screenshot`) — Playwright cannot see WebGL content.
2. **Console output** captured via `mcp__Claude_in_Chrome__read_console_messages` filtered to errors+warnings. Validator warnings for any non-conforming assets are expected and acceptable. Embed `(no errors)` if none.
3. **State assertion** — `window.__TERRAIN_LAB.clickRegistry.list().length > 0` and `window.__TERRAIN_LAB.landmarkBatchCount > 0` queried via `mcp__Claude_in_Chrome__javascript_tool`. Paste output as fenced block.

## 7. Wiring Section

| Touch point | How |
|---|---|
| `TerrainTextureLabCanvas.tsx` | Add `ChunkedLandmarkLayer` instance alongside `ChunkedFillerLayer`. Build both on resolver output; dispose on canvas unmount. |
| `terrainTextureLabVignettePrototype` | No source change — its existing `autoPlacements` and `clickTargets` outputs are consumed by the new layer. |
| `VignetteDebugOverlay.tsx` | Add landmark-bounds toggle + instance-count HUD. Wire to `ChunkedLandmarkLayer.setChunkBoundsVisible`. |
| `window.__TERRAIN_LAB` dev API | Add `clickRegistry`, `landmarkBatchCount`, `validationReports` accessors (dev-only, tree-shaken from prod via `import.meta.env.DEV`). |
| `src/data/ia-manifest.ts` | If the terrain lab surface is in the IA manifest, ensure its `reads[]` includes the new dev-API fields. (Verify by grepping for `terrain-lab` in `ia-manifest.ts`; update only if it already declares dev-API reads.) |
| `Docs/plans/wiring-checklist.md` | Append entry for `ChunkedLandmarkLayer` and `VignetteClickRegistry` under "Lab modules". |

Module-only-in-test-files check: both new modules are consumed by `TerrainTextureLabCanvas.tsx` (production lab surface), not just tests. **Wired.**

## 8. Constants Table

Added to `terrainTextureLabPresets.ts` under `TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS`:

| Constant | Default | Purpose |
|---|---|---|
| `LANDMARK_MAX_MATERIAL_SLOTS` | 3 | Validator threshold; >3 triggers warning |
| `LANDMARK_MAX_INSTANCES_PER_BATCH` | 256 | Safety cap per landmark batch (lower than filler — landmark count is much smaller) |
| `LANDMARK_DEFAULT_VISIBILITY_STATE` | 2 | All landmarks fully visible in Phase 3 (fog wiring deferred to Phase 5) |
| `LOCATION_CLICK_RADIUS_PX` | 24 | Minimum screen-space click radius for registry entries |
| `LANDMARK_LAYER_Z_OFFSET` | 0.02 | Z offset above filler layer to avoid Z-fighting (filler uses `MODEL_LAYER_Z`; landmarks render slightly above) |

Existing `SCATTER_MAX_INSTANCES_PER_BATCH = 3072` (parent doc) governs filler. The new `LANDMARK_MAX_INSTANCES_PER_BATCH = 256` is separate because landmark counts are tiny and we want a clear ceiling for cap-dropping logic in Phase 5.

## 9. Tracing

```typescript
interface VignetteLandmarkBuildTrace {
  type: 'vignette.landmark.build';
  totalLandmarkCount: number;
  batchCount: number;
  uniqueModelCount: number;
  buildTimeMs: number;
  validationWarningCount: number;
}

interface VignetteClickRegistryTrace {
  type: 'vignette.landmark.registry';
  entryCount: number;
  uniqueHexCount: number;
}

interface LandmarkValidationReport {
  type: 'vignette.landmark.validation';
  modelUrl: string;
  declaredMaterialCount: number;
  truncatedToMaterialCount: number;
  severity: 'warn' | 'info';
}
```

All three emit through `console.debug`/`console.warn` in DEV and are appended to `window.__TERRAIN_LAB.validationReports` (ring buffer, cap 64).

## 10. Fail-Soft Table

| Failure | Fallback |
|---|---|
| Landmark GLB load fails | Fall back to existing 2D icon overlay for that landmark (already supported by `terrainTextureLabVignettePrototype` — the layer skips building a batch for that model and logs `console.warn`). |
| Validator finds >3 materials | Render first 3 materials only; emit `LandmarkValidationReport` with `severity: 'warn'`. Asset still appears in lab. |
| `extractSubmeshes` returns empty | Skip the model. Log `console.warn`. No batch built. Click registry skips entries pointing at this model. |
| Custom instance material compile fails | Reuse Phase 2's fallback: hide vignette batches, render terrain-only. (Material is shared between filler and landmarks — Phase 2 already handles this case.) |
| Click registry stale (resolver rebuilt mid-frame) | `registry.replace()` is atomic — readers see either the old or the new full set, never a half-update. |
| WebGL context lost | Defer to Phase 5; existing `ChunkedFillerLayer` doesn't yet have explicit context-loss handling either. (Cross-reference Phase 5 plan to confirm both layers get the same restore path.) |

## 11. NFP Compliance

| NFP | Status | Notes |
|---|---|---|
| 1. Tunability | PASS | All thresholds, z-offsets, and caps are named constants in `terrainTextureLabPresets.ts` |
| 2. Inspectability | PASS | Three explicit trace types; ring buffer for validation reports; dev-only `window.__TERRAIN_LAB` accessors |
| 3. Determinism | PASS | No new randomness; consumes already-seeded prototype output. Build order is fixed: validate → extract → instance → register click target. |
| 4. Fail-soft | PASS | Six explicit fallbacks; tile renders even with missing GLBs or bad exports |
| 5. Narrative > mechanical | N/A | Pure rendering refactor; no narrative surface |
| 6. Additive | PASS | New modules + new constants; no existing module deleted or restructured. Clone-based fallback path remains until Phase 3 is wired in `TerrainTextureLabCanvas`, then removed in the same PR. |
| 7. Performance budget | PASS with note | Draw-call ceiling for landmarks ≤12 (parent doc §7.2). Validator must run; if a dense lab scene blows the ceiling, tune `LANDMARK_MAX_INSTANCES_PER_BATCH` or restrict the lab's active landmark archetype count. |

## 12. Done When

- [ ] `ChunkedLandmarkLayer.ts`, `VignetteClickRegistry.ts`, `LandmarkExportValidator.ts` exist under `src/components/HexMapV2/lab/vignette/` and are imported by `TerrainTextureLabCanvas.tsx`.
- [ ] Clone-based landmark rendering is removed from `TerrainTextureLabCanvas` in the same PR.
- [ ] `?view=terrain-lab` renders landmarks via `InstancedMesh`. Visual parity with prior clone-based output verified by screenshot diff (eyeball-grade; no automated golden).
- [ ] `window.__TERRAIN_LAB.clickRegistry.list()` returns entries when a hex has landmarks; entries include `{id, hexId, label, slot, modelId, position, radiusPx, batchKey, instanceIndex}`.
- [ ] Blender export contract doc lives at `Docs/art-pipeline/blender-export-contract.md`.
- [ ] Constants added to `TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS`.
- [ ] Three trace types emitted as documented in §9.
- [ ] `Docs/plans/wiring-checklist.md` updated.
- [ ] Tests added: `vignetteChunkedLandmark.test.ts` (mirrors `vignetteChunkedFiller.test.ts`) covering build, dispose, validator warnings, click registry population.
- [ ] Pre-commit minimum passes: `npm test`, `npx tsc --noEmit`, `npx vite build`. Verification evidence pasted in closing commit body.
- [ ] Browser-verify artefact at 1920×1080 in `?view=terrain-lab` via Claude-in-Chrome (screenshot + console output + `__TERRAIN_LAB` state query).
- [ ] Closing commit body includes `Fixes THR-11`.

## 13. Files to Touch

```
src/components/HexMapV2/lab/vignette/ChunkedLandmarkLayer.ts        (new)
src/components/HexMapV2/lab/vignette/VignetteClickRegistry.ts        (new)
src/components/HexMapV2/lab/vignette/LandmarkExportValidator.ts      (new)
src/components/HexMapV2/lab/__tests__/vignetteChunkedLandmark.test.ts (new)
src/components/HexMapV2/lab/TerrainTextureLabCanvas.tsx              (edit — swap clones for InstancedMesh)
src/components/HexMapV2/lab/terrainTextureLabPresets.ts              (edit — add constants)
src/components/HexMapV2/lab/vignette/VignetteDebugOverlay.tsx        (edit — add landmark bounds toggle, instance count HUD)
Docs/art-pipeline/blender-export-contract.md                          (new)
Docs/plans/wiring-checklist.md                                        (edit)
Docs/changelog.md                                                      (edit — append row)
```

Tree depth: 3 new vignette modules, 1 test file, 3 existing files edited, 3 doc files (1 new, 2 edits). No engine, no game-renderer, no tick-loop touches.

## 14. Kill Criteria

Phase 3 was wrong, and we revert + replan, if any of the following hold after a serious implementation attempt:

1. **Draw-call ceiling cannot be held.** Landmark batches exceed 12 draw calls in a typical lab scene even after tuning `LANDMARK_MAX_INSTANCES_PER_BATCH`. Chunking dimension or active-archetype count was misjudged — file impediment + Phase-5 blocker ticket.
2. **Visual parity with clone-based output cannot be achieved.** Lighting, colour, or layering looks materially different. Assumption that `VignetteInstanceMaterial` can cover landmarks without per-asset tuning was wrong — revert the cut-over within the same PR, keep clones, refactor in a follow-up.
3. **Validator flags >50% of current landmark assets.** Export contract was set at the wrong threshold or current library was authored against different assumptions — escalate to user, do not silently truncate half the catalogue.
4. **Test coverage cannot reach build / dispose / registry behaviour** (e.g. mocking `InstancedMesh` without WebGL proves too hard). Either lower the bar to a smaller scoped test or bring in a thin abstraction — do not ship without coverage of the three new modules.

Recovery in any case: `git revert` + follow-up issue. No data migrations to unwind, no live-user surface affected (lab is dev-only `?view=terrain-lab`).

## 15. Verification Plan

1. **Unit:** `vignetteChunkedLandmark.test.ts` — synthesised landmark placement array → assert batch count, instance count, click registry size, validator behaviour with synthesised oversized-material GLB stub.
2. **Type:** `npx tsc --noEmit` clean.
3. **Build:** `npx vite build` succeeds (Vercel deploy gate).
4. **Smoke (browser):** Open `?view=terrain-lab` in Chrome → claim a forest hex → verify landmark renders + `window.__TERRAIN_LAB.clickRegistry.list().length > 0` → toggle landmark-bounds debug → verify HUD counts.
5. **Performance:** Capture draw-call count via Chrome DevTools (or `renderer.info.render.calls` log in `window.__TERRAIN_LAB.rendererInfo()` if available); confirm landmark batches ≤ 12. If over, tune `LANDMARK_MAX_INSTANCES_PER_BATCH` or restrict the lab's active archetype count and document the chosen value in the closing commit.

No engine smoke required — Phase 3 does not touch `src/engine/**` or the tick loop.

## 16. Mutex / Parallel-Safe

**Mutex with:**
- THR-12 (Phase 4: Interaction & UI Validation) — Phase 4 consumes the click registry and hover-mix attribute that Phase 3 ships. Phase 4 cannot start until Phase 3 is merged. Phase 4 should claim only after this issue moves to Done.
- THR-13 (Phase 5: Profiling & Resilience) — Phase 5 layers context-loss recovery and priority-aware cap dropping on top of Phase 3 layers. Same merge-order dependency.

**Parallel-safe with:**
- Any non-lab work (engine, content, prose). All Phase 3 file touches are under `src/components/HexMapV2/lab/**` and `Docs/`. Nothing else in the repo imports from `lab/**`.
- THR-400 (Faction action expansion) — different file tree, no shared modules.
- THR-424 / THR-425 (Continuous Improvement infra tweaks) — process/automation only.

## 17. Suggested Model

**Sonnet.** Pattern-following rendering work with a clear architectural prior (`ChunkedFillerLayer` is the template). Three new files + edits across known surfaces, with tight test scaffolding already in place. Not novel-system, not prose, not judgment-heavy.

## 18. Codex review

**No.** Phase 3 ships test coverage of its own, the surface area is lab-only, and there is no engine or tick-loop risk. A codex-reviewer pass adds latency without proportional value at this layer.

---

## NFP Compliance Summary

| NFP | Status |
|---|---|
| 1. Tunability | PASS |
| 2. Inspectability | PASS |
| 3. Determinism | PASS |
| 4. Fail-soft | PASS |
| 5. Narrative > mechanical | N/A |
| 6. Additive | PASS |
| 7. Performance budget | PASS with note |

Three-pillar coverage: **Engine** (`ChunkedLandmarkLayer`, `VignetteClickRegistry`, validator), **Content** (Blender export contract doc, validator surfaces non-conforming assets), **UI** (debug overlay extensions, lab dev-API surfaces, browser-verify artefact required). Wiring section explicit. Constants table, traces, fail-soft, NFP table all inline.

Rulebook impact: **none** — purely rendering infrastructure, no rules of play touched.
Vision audit: **none** — load-bearing decisions (chunked batching, custom unlit instance material, slot-based composition) were settled in the parent architecture doc 2026-04-08 and remain unchanged.
