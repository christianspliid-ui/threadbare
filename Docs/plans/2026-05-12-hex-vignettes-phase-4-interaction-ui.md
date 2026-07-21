# Procedural Hex Vignettes — Phase 4 Implementation Plan: Interaction & UI Validation

**Linear issue:** THR-12 (TB-126)
**Date:** 2026-05-12
**Author:** Cowork (scheduled `keep-work-flowing` run)
**Status:** Ready for Dev
**Parent architecture doc:** `Docs/plans/2026-04-08-procedural-hex-vignettes.md` (authoritative — read first)
**Predecessor:** `Docs/plans/2026-05-12-hex-vignettes-phase-3-landmark-batches.md` (THR-11)
**Build target:** Terrain Texture Lab prototype (`?view=terrain-lab`) only. No live `HexMapV2` wiring in this phase.

---

## 1. Summary

Phase 3 (THR-11) ships chunked `InstancedMesh` landmark batches, a `VignetteClickRegistry` keyed on `{ batchKey, instanceIndex }`, and an `aHoverMix`/`aSelectionMix` per-instance attribute path on the shared `VignetteInstanceMaterial`. **All of that data plumbing is rendered inert** — Phase 3 deliberately defers every interaction surface.

Phase 4 turns it on. It replaces the existing screen-space-distance click matching (`TerrainTextureLabCanvas.tsx` ~L530–550) with a proper `THREE.Raycaster.intersectObject` pass against the landmark `InstancedMesh` batches that Phase 3 ships, wires hover and selection state into the per-instance shader attributes, surfaces a polished selection callback panel, adds cursor + keyboard affordances, and exposes `window.__TERRAIN_LAB.selectLandmark(id)` / `__TERRAIN_LAB.gotoLandmark(id)` for programmatic and browser-verify testing.

Phase 4 ships **no engine changes outside `src/components/HexMapV2/lab/**`**. The hover/selection state is a lab-local concern; the game renderer integration is deferred to Phase 6.

## 2. Three-Pillar Scope

| Pillar | In scope | Out of scope (deferred) |
|---|---|---|
| **Engine** | `LandmarkRaycaster.ts` (thin wrapper around `THREE.Raycaster` + click-registry lookup), `VignetteSelectionState.ts` (hover + select refs + animation easing), `aHoverMix` / `aSelectionMix` per-instance attribute mutation path on `ChunkedLandmarkLayer` | Game-renderer raycaster extension (Phase 6); fog/remembered-state interplay with hover (Phase 5); priority-aware cap dropping behaviour under hover (Phase 5) |
| **Content** | None — Phase 4 reads existing landmark metadata produced by `terrainTextureLabVignettePrototype`. No new prose, no new templates, no new Blender contracts. | Codex entries for landmark archetypes (separate Codex project); selection-panel-derived lore prose (post-prototype) |
| **UI** | Cursor flip to `pointer` over landmarks, hover ring via shader, selection ring via shader + existing `landmarkSelectionRing` outline, **Selection Callback Panel** overlay (slot, model, hex, screen position, click radius), **Click registry inspector toggle** in `VignetteDebugOverlay`, Escape-clears-selection, `window.__TERRAIN_LAB.selectLandmark(id)` + `gotoLandmark(id)` accessors. Lab-only browser-verify artefact at 1920×1080 via Claude-in-Chrome (mandatory per Definition of Done). | Live `HexMapV2` hover/selection ports; agent-priority chain integration (lab has no agents); accessibility audit (lab is dev-only and excluded from WCAG sweep) |

All three pillars present. The Content pillar is correctly `N/A` for active authoring; Engine and UI carry the weight.

## 3. Codesight / Blast Radius

All file touches are lab-scoped (`src/components/HexMapV2/lab/**`). None of the high-impact files (`src/engine/graph.ts`, `src/types/index.ts`, `src/types/gameState.ts`, `src/types/traits.ts`, `src/engine/traceBuffer.ts`) are touched. Trace types reuse the `vignette.*` namespace already established by Phase 1/2/3.

No Blast Radius section required (no file with ≥100 importers in scope).

## 4. Engine Pillar

### 4.1 New modules

| Module | Responsibility |
|---|---|
| `src/components/HexMapV2/lab/vignette/LandmarkRaycaster.ts` | `pick(pointerNDC, camera, layer, registry) → LocationClickTarget \| null`. Wraps `THREE.Raycaster.intersectObject(landmarkBatch, false)` per batch in the `ChunkedLandmarkLayer`, takes the nearest hit, reads `intersection.instanceId`, looks up `{ batchKey, instanceIndex }` in `VignetteClickRegistry`, returns the click target or null. |
| `src/components/HexMapV2/lab/vignette/VignetteSelectionState.ts` | Holds `hoveredTarget: LocationClickTarget \| null` and `selectedTarget: LocationClickTarget \| null`. Exposes `setHovered`, `setSelected`, `clear`, and `tickEasing(deltaMs, layer)` which advances per-instance `aHoverMix`/`aSelectionMix` toward target values. Emits selection events through a callback. |
| `src/components/HexMapV2/lab/vignette/__tests__/landmarkRaycaster.test.ts` | Unit tests for raycaster + selection state (no WebGL required; the raycaster module is parameterised on a layer interface that tests stub). |

### 4.2 Mutation on `ChunkedLandmarkLayer`

Phase 3 ships `ChunkedLandmarkLayer.setInstanceAttribute(batchKey, instanceIndex, attrName, value)` (or equivalent — the exact API name is the implementer's call; this plan asserts the capability must exist). Phase 4 calls into it from `VignetteSelectionState.tickEasing` to update `aHoverMix` and `aSelectionMix` per frame. If Phase 3 didn't expose this method, Phase 4 adds it in the same PR (≤20 lines).

**Buffer lifecycle:** the per-instance attribute arrays (`Float32Array`) are allocated once at build time in Phase 3. Phase 4 mutates in place; no reallocation. Each per-frame update marks `attribute.needsUpdate = true` and uses `attribute.updateRange` to constrain the GPU upload to just the changed instance index (single-instance range), avoiding full-buffer re-uploads on hover-move.

### 4.3 Pick order

`LandmarkRaycaster.pick()` iterates batches in deterministic order (sorted by `batchKey` string). It returns the **nearest** intersection across all batches by `intersection.distance`, not the first hit. This matches the parent doc §6.1 priority chain conceptually (landmarks before hex fallback) while staying agnostic to within-landmark ordering.

In the lab there are no agents or armies, so the chain collapses to: **landmark → hex**. Phase 6 (game integration) is where the full chain (agent → army → landmark → hex) gets reassembled in `HexRaycaster.ts`; Phase 4 does not pre-empt that.

### 4.4 Easing

Hover and selection mixes ease toward their targets to avoid jitter when the pointer skims across instance boundaries.

```typescript
// Per-frame in VignetteSelectionState.tickEasing(deltaMs, layer):
for (const target of allKnownTargets) {
  const wantHover = target.id === hoveredTarget?.id ? HOVER_MIX_TARGET : 0;
  const wantSelect = target.id === selectedTarget?.id ? SELECTION_MIX_TARGET : 0;
  const hoverStep = (HOVER_MIX_TARGET / HOVER_MIX_EASE_MS) * deltaMs;
  const selectStep = (SELECTION_MIX_TARGET / SELECTION_MIX_EASE_MS) * deltaMs;
  currentHover[target.id] = stepToward(currentHover[target.id] ?? 0, wantHover, hoverStep);
  currentSelect[target.id] = stepToward(currentSelect[target.id] ?? 0, wantSelect, selectStep);
  if (currentHover[target.id] changed) layer.setInstanceAttribute(target.batchKey, target.instanceIndex, 'aHoverMix', currentHover[target.id]);
  if (currentSelect[target.id] changed) layer.setInstanceAttribute(target.batchKey, target.instanceIndex, 'aSelectionMix', currentSelect[target.id]);
}
```

The "all known targets" set comes from `VignetteClickRegistry.list()`. With Phase 3's `LANDMARK_MAX_INSTANCES_PER_BATCH = 256` and typical lab scenes of 1–20 landmarks, the inner loop is trivial. If a future scale needs it, swap to a delta-set (only the instances that changed last frame).

### 4.5 PRNG / Determinism

**No new randomness in Phase 4.** Hover and selection are pointer-driven; easing is deltaMs-driven. Tests run with a fixed `deltaMs` per tick and assert exact attribute progression.

## 5. Content Pillar

**N/A.** Phase 4 reads `LocationClickTarget` metadata that the prototype already produces. No new content tables, no prose, no Blender contracts.

If the selection panel surfaces fields that don't exist yet on `LocationClickTarget` (e.g. landmark display name in a friendly format), the field is computed in the panel from existing data (`modelId` + slot + hexId). No schema additions.

## 6. UI Pillar

### 6.1 Cursor flip

`canvas.style.cursor = hoveredTarget ? 'pointer' : 'default'` on the canvas element. Reset to default on canvas unmount.

### 6.2 Selection Callback Panel

An overlay panel rendered by `TerrainTextureLab.tsx` (not `TerrainTextureLabCanvas.tsx` — keep canvas concerns rendering-only). Visible only when `selectedClickTarget` is non-null. Shows:

- Landmark display name (derived: model name + slot e.g. "Village (CENTER)")
- `modelId`
- `hexId` and `{ col, row }`
- World position `{ x, y, z }` (3-decimal)
- Slot anchor name (`CENTER` / `N` / …)
- Click radius in px
- Batch identity (`batchKey`, `instanceIndex`) — dev info, monospace
- "Center camera on this landmark" button → calls `__TERRAIN_LAB.gotoLandmark(id)`
- "Clear selection" button → calls `setSelectedClickTargetId(null)`

The panel is keyboard-dismissible (Escape clears selection). It is **non-modal**: the rest of the lab UI remains interactive.

Placement: top-right of the lab viewport, `position: absolute; top: 16px; right: 16px; max-width: 320px; max-height: 60vh; overflow-y: auto`. Uses existing `Docs/design-system` Card primitive if available; otherwise inlines a minimal styled `<div>` matching the existing terrain-lab panel style.

### 6.3 Hover and selection shader feedback

The shader output is the visible truth — Phase 4 just turns it on. Hover and selection are rendered through the per-instance `aHoverMix` and `aSelectionMix` attributes already declared by `VignetteInstanceMaterial.ts`. No shader code changes.

Visual targets (tunable):

- `HOVER_MIX_TARGET = 0.45` — subtle warm tint over the landmark
- `SELECTION_MIX_TARGET = 0.75` — stronger, clearly distinguishable from hover
- Hover overrides nothing — both attributes can be non-zero on the same instance (selected and hovered)

The existing `landmarkSelectionRing` outline in `TerrainTextureLabCanvas.tsx` (line ~330 of the file per the Phase 3 plan's references) is **retained** as a secondary cue (Z-fighting-resistant) for accessibility and to communicate selection at a glance from any angle. The outline updates position on selection change.

### 6.4 `VignetteDebugOverlay.tsx` extensions

Existing toggles (zone rules, chunk bounds, landmark bounds from Phase 3) plus two new ones:

- **Click target debug spheres** — render small wireframe spheres at each click target's world position, sized to `radiusPx` projected back to world units. Useful for diagnosing "why is my click missing this landmark?".
- **Selection state HUD** — small fixed-position readout showing `hovered: <id|none> · selected: <id|none>`. Already partially exists from Phase 3's instance-count HUD; Phase 4 appends the two fields.

### 6.5 `window.__TERRAIN_LAB` extensions

| Accessor | Purpose |
|---|---|
| `selectLandmark(id: string): boolean` | Programmatically select a landmark by `LocationClickTarget.id`. Returns `true` if found, `false` otherwise. Triggers the same selection path as a click. Used by browser-verify and as a debugging shortcut. |
| `gotoLandmark(id: string): boolean` | Pan the camera to centre on the landmark's world position. Returns `true` if found. |
| `getSelectionState(): { hovered: string \| null; selected: string \| null }` | Inspector for browser-verify assertions. |
| `clearSelection(): void` | Programmatic Escape equivalent. |

All dev-only — wrapped in `import.meta.env.DEV` and tree-shaken from production builds. Existing `__TERRAIN_LAB` console API help text (line ~350 of `TerrainTextureLab.tsx`) is extended to list these.

### 6.6 Keyboard

- `Escape` clears selection (when the lab canvas or panel has focus)
- `Tab` cycles through landmarks in `VignetteClickRegistry.list()` order (selection moves) — **optional polish**, gated behind a `Phase 4 stretch` checkbox in §12. If implementer skips it, no Phase 5 dependency.

### 6.7 Browser-verify artefact

Per Definition of Done §Browser-verify UI changes, closing commit MUST include:

1. **Screenshot at 1920×1080** of `?view=terrain-lab` with a forest hex landmark **selected** (panel visible, selection ring rendered, shader tint visible). Use **Claude-in-Chrome** (`mcp__Claude_in_Chrome__computer` action: `screenshot`) — Playwright cannot see WebGL.
2. **Console output** captured via `mcp__Claude_in_Chrome__read_console_messages` filtered to errors+warnings. Embed `(no errors)` if none.
3. **State assertions** via `mcp__Claude_in_Chrome__javascript_tool`:
   - `window.__TERRAIN_LAB.selectLandmark('<known-id>')` returns `true`
   - `window.__TERRAIN_LAB.getSelectionState().selected === '<known-id>'`
   - `window.__TERRAIN_LAB.clearSelection()` followed by `getSelectionState().selected === null`

Paste outputs as fenced blocks in the closing commit body.

## 7. Wiring Section

| Touch point | How |
|---|---|
| `TerrainTextureLabCanvas.tsx` | Replace the screen-space-distance click matching block (~L520–550) with a `LandmarkRaycaster.pick()` call. Add `pointermove` handler that updates `VignetteSelectionState.setHovered(picked)`. Add cursor flip. Per-frame in render loop, call `selectionState.tickEasing(deltaMs, landmarkLayer)`. Add canvas-level `keydown` listener for `Escape`. |
| `TerrainTextureLab.tsx` | Render `<LandmarkSelectionPanel>` when `selectedClickTarget` is non-null. Wire `__TERRAIN_LAB.selectLandmark` / `gotoLandmark` / `getSelectionState` / `clearSelection` into the existing console API object. |
| `VignetteDebugOverlay.tsx` | Add "Click target debug spheres" toggle. Extend HUD to include hover + select state. |
| `ChunkedLandmarkLayer.ts` | If Phase 3 didn't expose `setInstanceAttribute(batchKey, instanceIndex, attrName, value)`, add it (≤20 LOC). Confirm during pickup by reading the Phase 3 output. |
| `terrainTextureLabPresets.ts` | Add Phase 4 constants under `TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS`. |
| `src/data/ia-manifest.ts` | If the terrain lab surface is in the IA manifest, ensure its `reads[]` includes `__TERRAIN_LAB.getSelectionState`. Verify by grepping `ia-manifest.ts` for `terrain-lab`; update only if already declared. |
| `Docs/plans/wiring-checklist.md` | Append entries for `LandmarkRaycaster`, `VignetteSelectionState`, and the new `__TERRAIN_LAB` accessors under "Lab modules". |
| `Docs/changelog.md` | Append row. |

Module-only-in-test-files check: `LandmarkRaycaster` and `VignetteSelectionState` are imported by `TerrainTextureLabCanvas.tsx` (production lab surface), not just tests. **Wired.**

## 8. Constants Table

Added to `terrainTextureLabPresets.ts` under `TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS`:

| Constant | Default | Purpose |
|---|---|---|
| `HOVER_MIX_TARGET` | 0.45 | `aHoverMix` value applied to the hovered instance when at rest |
| `SELECTION_MIX_TARGET` | 0.75 | `aSelectionMix` value applied to the selected instance when at rest |
| `HOVER_MIX_EASE_MS` | 90 | Linear ease-in/out duration for hover transitions (ms) |
| `SELECTION_MIX_EASE_MS` | 140 | Linear ease-in/out duration for selection transitions (ms) |
| `CLICK_DEBUG_SPHERE_OPACITY` | 0.4 | Wireframe opacity for the debug-toggled click-target spheres |
| `RAYCASTER_LANDMARK_RECURSIVE` | `false` | `THREE.Raycaster.intersectObject` recursive arg for landmark batches (false — instanced meshes are picked directly) |
| `LANDMARK_HOVER_CURSOR` | `'pointer'` | CSS cursor when over a landmark (constant so future themes can override) |

Existing `LOCATION_CLICK_RADIUS_PX = 24` (Phase 3) governs the minimum hit-radius; Phase 4 honours it via raycaster precision (Three.js's mesh raycaster threshold is geometry-driven, not pixel-driven, so the constant becomes informational here, used by the click-debug-sphere sizing).

## 9. Tracing

```typescript
interface VignetteLandmarkHoverTrace {
  type: 'vignette.landmark.hover';
  entityId: string | null;     // null on hover-clear
  previousEntityId: string | null;
  hexId: string | null;
  pickedFromBatchKey: string | null;
}

interface VignetteLandmarkSelectTrace {
  type: 'vignette.landmark.select';
  entityId: string | null;     // null on clear
  previousEntityId: string | null;
  source: 'click' | 'programmatic' | 'keyboard';
}

interface VignetteRaycasterTrace {
  type: 'vignette.raycaster.pick';
  pointerNdcX: number;
  pointerNdcY: number;
  candidatesChecked: number;   // batch count
  hitsFound: number;
  pickedEntityId: string | null;
  durationMs: number;
}
```

All three emit through `console.debug` in DEV; they are **not** persisted to a ring buffer (high-frequency on pointermove). The select trace is the only one a user might want to scroll back through; if log spam becomes annoying, gate the hover and raycaster traces behind a `VignetteDebugOverlay` "verbose raycaster traces" toggle.

## 10. Fail-Soft Table

| Failure | Fallback |
|---|---|
| Raycaster intersection misses all batches | Clear hover state; fall through to terrain hex raycast for click. No error. |
| `intersection.instanceId` is null/undefined | Treat as no-hit. Log `console.warn` once per session (instance ID null is unexpected). |
| `clickRegistry.findByBatchInstance(batchKey, instanceId)` returns null | Click registry is stale (batches rebuilt mid-frame). Fall through to terrain hex; trigger a console-debug trace; do not crash. |
| `layer.setInstanceAttribute` throws (attribute name typo, batch disposed) | Catch + `console.warn` once per attribute name per session. Skip easing for that target this frame. Selection state still updates internally. |
| `__TERRAIN_LAB.selectLandmark(id)` called with unknown id | Return `false`. Do not modify state. |
| `__TERRAIN_LAB.gotoLandmark(id)` called with unknown id | Return `false`. Do not move camera. |
| Keyboard `Escape` fired with no selection | No-op. |
| Selection panel renders with target whose batch was disposed between select and render | Panel shows the metadata fields it can read; the "Center camera" button still works (uses `worldPosition` snapshot taken at select-time). Shader feedback fades to 0 via easing as the disposed batch's attribute array is GC'd. |
| Pointer event fires before scene is ready (canvas mounted but `sceneRef.current` null) | Early-return from handler. No raycaster call. |

## 11. NFP Compliance

| NFP | Status | Notes |
|---|---|---|
| 1. Tunability | PASS | All thresholds, ease durations, and cursor strings are named constants in `terrainTextureLabPresets.ts` |
| 2. Inspectability | PASS | Three trace types; `__TERRAIN_LAB.getSelectionState()` accessor; debug-toggle for click-target spheres; verbose-trace toggle for raycaster spam |
| 3. Determinism | PASS | No randomness; pointer-driven; tests use fixed `deltaMs` and assert exact attribute progression |
| 4. Fail-soft | PASS | Nine explicit fallbacks; lab degrades gracefully through every interaction surface |
| 5. Narrative > mechanical | N/A | Pure UI/interaction layer; no narrative surface |
| 6. Additive | PASS | New modules + constants; existing screen-space click matching is **replaced** in the same PR (the only deletion). All other touch points are append-only. |
| 7. Performance budget | PASS with note | Raycaster runs on every `pointermove`. Lab scenes have ≤20 landmark batches; budget is comfortable. If extended to game integration in Phase 6, add `pointermove` throttling. |

## 12. Done When

- [ ] `LandmarkRaycaster.ts` and `VignetteSelectionState.ts` exist under `src/components/HexMapV2/lab/vignette/` and are imported by `TerrainTextureLabCanvas.tsx`.
- [ ] Screen-space-distance click matching block in `TerrainTextureLabCanvas.tsx` is **removed**; raycaster-based picking is the only landmark click path in the lab.
- [ ] Hover over a landmark flips the cursor to `pointer` and renders a shader-driven hover tint that eases in over `HOVER_MIX_EASE_MS`.
- [ ] Clicking a landmark selects it; shader-driven selection tint and outline ring are both visible.
- [ ] Escape clears the selection (when canvas or panel has focus); shader tints ease back to 0.
- [ ] `<LandmarkSelectionPanel>` overlay is visible when `selectedClickTarget` is non-null and shows all fields enumerated in §6.2.
- [ ] `window.__TERRAIN_LAB.selectLandmark(id)`, `gotoLandmark(id)`, `getSelectionState()`, `clearSelection()` work and are listed in the `__TERRAIN_LAB` console help text.
- [ ] `VignetteDebugOverlay` exposes the click-target-debug-spheres toggle and the hover/select state HUD.
- [ ] Phase 4 constants added to `TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS`.
- [ ] Three trace types emitted as documented in §9.
- [ ] `Docs/plans/wiring-checklist.md` updated.
- [ ] Tests added: `landmarkRaycaster.test.ts` covering pick-hit, pick-miss, registry-stale-fallback; `vignetteSelectionState.test.ts` covering set/clear hover, set/clear select, easing progression with fixed `deltaMs`, attribute-update failure fallback.
- [ ] Pre-commit minimum passes: `npm test`, `npx tsc --noEmit`, `npx vite build`. Verification evidence pasted in closing commit body.
- [ ] Browser-verify artefact at 1920×1080 in `?view=terrain-lab` via Claude-in-Chrome (screenshot + console output + three state assertions from §6.7).
- [ ] Closing commit body includes `Fixes THR-12`.
- [ ] **Stretch (optional):** `Tab` cycles selection through `VignetteClickRegistry.list()`. If skipped, mark as Phase-5-or-later — no upstream impact.

## 13. Files to Touch

```
src/components/HexMapV2/lab/vignette/LandmarkRaycaster.ts             (new)
src/components/HexMapV2/lab/vignette/VignetteSelectionState.ts         (new)
src/components/HexMapV2/lab/vignette/__tests__/landmarkRaycaster.test.ts     (new)
src/components/HexMapV2/lab/vignette/__tests__/vignetteSelectionState.test.ts (new)
src/components/HexMapV2/lab/TerrainTextureLabCanvas.tsx                (edit — swap screen-space match for raycaster, add hover/keydown handlers, tickEasing in render loop)
src/components/HexMapV2/lab/TerrainTextureLab.tsx                       (edit — selection panel, __TERRAIN_LAB accessor additions)
src/components/HexMapV2/lab/vignette/VignetteDebugOverlay.tsx           (edit — click-target debug spheres toggle, HUD extension)
src/components/HexMapV2/lab/vignette/ChunkedLandmarkLayer.ts            (edit — confirm or add setInstanceAttribute method; ≤20 LOC if not already present from Phase 3)
src/components/HexMapV2/lab/terrainTextureLabPresets.ts                 (edit — add Phase 4 constants)
src/data/ia-manifest.ts                                                 (edit — conditional, only if terrain-lab is declared)
Docs/plans/wiring-checklist.md                                          (edit)
Docs/changelog.md                                                       (edit)
```

Tree depth: 2 new vignette modules, 2 new test files, 4 existing lab files edited, 1 conditional non-lab edit (`ia-manifest.ts`), 2 doc edits. No engine, no game-renderer, no tick-loop touches.

## 14. Kill Criteria

Phase 4 was wrong, and we revert + replan, if any of the following hold after a serious implementation attempt:

1. **Raycaster cannot hit landmark InstancedMesh batches reliably.** Three.js's built-in raycaster supports InstancedMesh — if it doesn't, the assumption that Phase 3's batches are pickable was wrong. File impediment, fall back to screen-space distance matching (the current implementation) and revisit picking strategy in Phase 5.
2. **Per-instance attribute updates cause visible GPU stalls on hover-move.** If pointermove updates of `aHoverMix` cause frame-rate drops on integrated GPU, the per-frame update strategy is wrong — switch to a single uniform-with-hovered-instance-index path in the shader. Plan revision required.
3. **Shader tint via `aHoverMix` is invisible or visually identical to selection.** The Phase 2/3 shader path assumed differentiable hover and select states. If the visual difference between `0.45` and `0.75` mix is too subtle to read, retune the constants — but if the *shader path itself* doesn't distinguish them, file impediment and add a hover ring overlay as fallback. Plan revision required only if both approaches fail.
4. **Selection panel layout conflicts with existing lab controls.** If the top-right placement collides with another panel and no other corner has room, redesign the panel as a slide-in from the right edge instead of an absolute overlay. Same-PR fix, not a kill.

Recovery in any case: `git revert` + follow-up issue. No data migrations to unwind. Lab is dev-only (`?view=terrain-lab`); zero user impact.

## 15. Verification Plan

1. **Unit:**
   - `landmarkRaycaster.test.ts` — stub layer with two batches, two instances each, assert pick hits the nearest instance, asserts null on miss, asserts null when registry doesn't have a hit's `{batchKey, instanceIndex}`.
   - `vignetteSelectionState.test.ts` — set hovered → tick 90ms → assert `aHoverMix ≈ 0.45`; clear hover → tick 90ms → assert `≈ 0`; same for selection; assert `setInstanceAttribute` throw is caught and logged.
2. **Type:** `npx tsc --noEmit` clean.
3. **Build:** `npx vite build` succeeds (Vercel deploy gate).
4. **Smoke (browser):** Open `?view=terrain-lab` in Chrome → hover a landmark (cursor flips, shader tint visible) → click (selection panel appears, ring outline appears, shader stronger tint) → press Escape (selection clears) → run `__TERRAIN_LAB.selectLandmark('<id>')` from console → confirm panel reappears.
5. **Performance:** Capture `renderer.info.render.calls` on hover-move. Confirm draw call count is stable (Phase 4 should not introduce new draw calls; only per-instance attribute updates). Document the observed value in the closing commit.

No engine smoke required — Phase 4 does not touch `src/engine/**` or the tick loop.

## 16. Mutex / Parallel-Safe

**Mutex with:**
- THR-11 (Phase 3: Landmark Batch Layer) — Phase 4 consumes the click registry, landmark `InstancedMesh` batches, and `aHoverMix`/`aSelectionMix` attribute path. Phase 4 cannot start until Phase 3 is merged. Phase 4 should claim only after THR-11 is Done.
- THR-13 (Phase 5: Profiling & Resilience) — Phase 5 layers context-loss restore + cap-drop priority on top of Phase 4's hover/select state. Same merge-order dependency.

**Parallel-safe with:**
- Any non-lab work (engine, content, prose). All Phase 4 file touches are under `src/components/HexMapV2/lab/**` plus 3 doc edits and 1 conditional `ia-manifest.ts` edit. Nothing else in the repo imports from `lab/**`.
- THR-400 (Faction action expansion) — different file tree, no shared modules.
- THR-424 / THR-425 (Continuous Improvement infra tweaks) — process/automation only.

## 17. Suggested Model

**Sonnet.** Pattern-following interaction work with clear precedent:
- The raycaster pattern (`THREE.Raycaster.intersectObject` + `instanceId`) is well-trodden Three.js.
- The selection-state-with-easing pattern mirrors existing lab and HexMapV2 selection plumbing.
- The selection panel is a standard React overlay with no novel layout.
- Phase 3 is the architectural template; Phase 4 is the next step on the same track.

Not novel-system, not prose, not judgment-heavy. The only non-mechanical choices are the two visual mix constants (0.45 / 0.75) which the implementer should tune by eyeball during browser-verify and freeze into the constants table.

## 18. Codex review

**No.** Phase 4 ships test coverage of its own, the surface area is lab-only, and there is no engine or tick-loop risk. Three.js raycaster + per-instance attribute mutation are well-understood. A codex-reviewer pass adds latency without proportional value at this layer.

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

Three-pillar coverage: **Engine** (`LandmarkRaycaster`, `VignetteSelectionState`, per-instance attribute mutation path), **Content** (N/A by design — no new authoring), **UI** (cursor flip, hover/select shader tints, selection panel, debug overlay extensions, `__TERRAIN_LAB` accessors, keyboard, browser-verify artefact required). Wiring section explicit. Constants table, traces, fail-soft, NFP table all inline.

Rulebook impact: **none** — purely interaction infrastructure on a dev-only lab surface; no rules of play touched.

Vision audit: **none** — load-bearing decisions (chunked batching, custom unlit instance material, slot-based composition, click priority chain agent→army→landmark→hex) were settled in the parent architecture doc 2026-04-08 and remain unchanged. Phase 4 implements the "landmark" step of that chain in the lab harness only; the full chain reassembles in Phase 6 game integration.
