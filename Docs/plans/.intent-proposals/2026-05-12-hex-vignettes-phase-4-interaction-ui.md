# Intent Proposal: Hex Vignettes Phase 4 — Interaction & UI Validation

## intent_quote

> Triggered by the automated Cowork scheduled task `keep-work-flowing` with the standing instruction set:
>
> > Check Linear for the highest-priority work … Do the design work — cover all three pillars: Engine, Content, UI. If too many grey areas, ping christian (the human) with questions. Move the issue to "Ready for Dev" with a full coordination block.
>
> The user (Christian) issued the original THR-12 ask via Linear at issue creation 2026-04-13:
>
> > TB-126 · Procedural Hex Vignettes — Phase 4: Interaction & UI Validation. Hover/selection feedback on vignette models in the terrain lab. Prove click behavior works on instanced landmarks before game integration. Hover highlight, selection ring, raycaster click, terrain lab selection panel, debug toggles. Design doc: `Docs/plans/2026-04-08-procedural-hex-vignettes.md` § Phase 4.

The parent architecture doc 2026-04-08 (730 lines) is shipped; Phases 1 and 2 are merged to `main`; Phase 3 was just handed off this same morning by the predecessor Cowork run (`Docs/plans/2026-05-12-hex-vignettes-phase-3-landmark-batches.md`, THR-11). This plan is the implementation walkthrough for Phase 4 specifically and is **mutex with** Phase 3 — Phase 4 cannot start until Phase 3 merges.

## scope (what this plan does)

Author the Phase 4 implementation walkthrough that takes the parent architecture doc 2026-04-08 (§6 click and selection architecture, §9 Phase 4 outline) and the predecessor Phase 3 plan (THR-11, ships click registry + `aHoverMix`/`aSelectionMix` plumbing in inert state) and lands the **interaction layer** as a CC-pickup-ready Linear handoff. The walkthrough specifies two new lab modules (`LandmarkRaycaster`, `VignetteSelectionState`), replaces the screen-space click-distance matching block in `TerrainTextureLabCanvas.tsx` with proper `THREE.Raycaster.intersectObject` against Phase 3's landmark batches, wires hover and selection state into the per-instance shader attribute path, ships a polished selection callback panel, adds cursor + keyboard affordances, and exposes `window.__TERRAIN_LAB.selectLandmark(id)` / `gotoLandmark(id)` / `getSelectionState()` / `clearSelection()` for programmatic and browser-verify testing. All file touches are confined to `src/components/HexMapV2/lab/**`, `Docs/`, and one conditional `src/data/ia-manifest.ts` edit.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT extend interaction to the live game renderer (`HexMapV2.tsx`). That is Phase 6 and is gated on Phase 5 profiling.
- Does NOT reassemble the full agent→army→landmark→hex click-priority chain. The lab has no agents/armies; Phase 4 only ships the landmark→hex segment. Phase 6 reassembles the chain in `HexRaycaster.ts`.
- Does NOT touch fog/remembered-state interplay with hover. Phase 5 owns context-loss + LOD + fog-state-aware hover.
- Does NOT add a Codex entry for landmark archetypes. That belongs to the Codex project, not this prototype phase.
- Does NOT add accessibility (WCAG) audit. The lab is dev-only (`?view=terrain-lab`) and is excluded from the accessibility sweep.
- Does NOT modify any rules of play (rulebook). Pure interaction infrastructure.
- Does NOT touch the narrative `hexVignette` engine (`src/engine/hexVignette.ts`, `src/engine/vignetteProse.ts`). Different namespace.
- Does NOT modify Phase 3's click registry or shader path. Phase 4 consumes them; if a `setInstanceAttribute(batchKey, instanceIndex, attrName, value)` accessor is missing from Phase 3's output, Phase 4 adds it (≤20 LOC) in the same PR — but the data model and attribute names are unchanged.
- Does NOT pre-empt Phase 5 throttling. Pointermove raycaster runs unthrottled in the lab; lab scenes have ≤20 landmark batches so the budget is comfortable. Phase 5 / Phase 6 are the right places to add throttling for the live game renderer.

## impact_class

**Reversible.** Lab-only code (`src/components/HexMapV2/lab/**`) plus 2 doc edits and 1 conditional `ia-manifest.ts` edit. No game-renderer wiring, no engine touches, no high-impact files. If Phase 4 regresses the terrain lab, the fix is to revert the PR — no migrations, no state changes, no live-user surface. The terrain lab is a developer-only `?view=terrain-lab` surface, not in the player flow.

The new `__TERRAIN_LAB` accessors are dev-only (`import.meta.env.DEV`-guarded) and tree-shaken from production. The selection panel and shader-driven hover/select tints are visible only on the lab surface.

## evidence cited

- **Linear issue:** THR-12
- **Vision premises invoked:** none — purely interaction infrastructure on a dev-only lab surface. Vision audit performed and recorded as "none" in the plan doc's NFP summary section.
- **UL terms touched:** none. Existing terms `landmark`, `hex`, `slot`, `vignette`, `click target` are used as already defined in the parent doc and Phase 3 plan.
- **Canon pages consulted:** `Docs/canon/hex-map.md` (referenced via the parent doc's authority); `Docs/canon/process.md` (NFP, three-pillar rule, definition of done).
- **Prior plan docs this builds on:**
  - `Docs/plans/2026-04-08-procedural-hex-vignettes.md` (parent architecture doc — authoritative on click-priority chain, slot composition, custom unlit instance material, fail-soft expectations).
  - `Docs/plans/2026-05-12-hex-vignettes-phase-3-landmark-batches.md` (Phase 3 — ships click registry + `aHoverMix`/`aSelectionMix` attribute path; Phase 4 is the consumer).
- **Rejected approaches considered and dismissed:**
  - Keep the existing screen-space click-distance matching block and just add hover state on top → rejected, the whole point of Phase 4 is to validate that Phase 3's `InstancedMesh` batches are pickable via Three.js raycaster. Validating that is the prototype-gate for Phase 6 game integration.
  - Use a uniform-with-hovered-index path in the shader instead of per-instance `aHoverMix` attribute updates → rejected by default, since the per-instance attribute path is what Phase 2/3 already ship. Kept in Kill Criteria §2 as a fallback if per-instance attribute updates cause GPU stalls.
  - Add a hover ring overlay (extra `LineLoop` per landmark) instead of shader tint → rejected, the shader path is cheaper and consistent with the architecture. Kept in Kill Criteria §3 as a fallback if shader differentiation between hover and select reads too subtle.
  - Build a separate `HoverRaycaster` and `SelectRaycaster` → rejected, one `LandmarkRaycaster.pick()` returning a target serves both states; the caller decides which state to update.
  - Throttle pointermove → rejected for Phase 4 (lab scales are tiny). Noted as a Phase 5 / Phase 6 concern when game-renderer scale arrives.

## load-bearing decisions touched

From CLAUDE.md "Load-Bearing Architectural Decisions":

- **Three-pillar rule** — addressed. Engine (raycaster + selection state + attribute mutation), Content (N/A by design — no new authoring), UI (cursor, hover/select shader tints, selection panel, debug overlay, `__TERRAIN_LAB` accessors, keyboard, browser-verify) all explicit.
- **Module only in test files = not integrated** — addressed by §7 wiring: `LandmarkRaycaster` and `VignetteSelectionState` are imported by `TerrainTextureLabCanvas.tsx` (production lab surface), not only by tests.
- **Engine caches must be owned per session** — N/A; the lab is dev-only and rebuilds selection state on every canvas mount.
- **No inventing node types without verification** — N/A; Phase 4 introduces no graph node types.

From the parent architecture doc:

- **Click priority: agents → armies → landmarks → hex fallback** — upheld. The lab has no agents/armies, so the chain collapses to landmark → hex. Phase 6 reassembles the full chain in the game renderer.
- **Chunked batching** — upheld. `LandmarkRaycaster` iterates batches and takes the nearest hit across all of them.
- **Slot-based composition** — upheld. The selection panel surfaces slot anchor name from existing click-target metadata.
- **Custom unlit instance material with per-instance attributes** — upheld. Phase 4 mutates `aHoverMix` and `aSelectionMix` per instance; no shader code changes.

No load-bearing decision is being changed. All decisions are upheld as defined.

## high-impact files touched (from Codesight)

None. All file touches confined to:

- `src/components/HexMapV2/lab/**` (2 new modules, 2 new test files, 4 existing files edited)
- `Docs/plans/wiring-checklist.md` (edit)
- `Docs/changelog.md` (edit)
- `src/data/ia-manifest.ts` (conditional edit — only if `terrain-lab` is currently declared in the manifest with a `reads[]` field)

The high-impact files from CLAUDE.md (`src/engine/graph.ts` 370 importers, `src/types/index.ts` 186, `src/types/gameState.ts` 176, `src/types/traits.ts` 156, `src/engine/traceBuffer.ts` 106) are NOT touched. No Blast Radius section is required and the plan doc omits it per the per-system required-sections policy.

`src/data/ia-manifest.ts` importer count is not on the high-impact list. The Phase 4 edit there is a single-line addition to a `reads[]` array conditional on the manifest already declaring the terrain-lab surface; if the manifest doesn't declare it, no edit is made.

## kill criteria

This Phase 4 plan was wrong if any of the following happen during implementation:

1. **Raycaster cannot hit landmark InstancedMesh batches reliably.** Three.js's built-in raycaster supports InstancedMesh, but if Phase 3's batches turn out to be unpickable (e.g. mesh disposed before raycast, hidden materials, raycast-disabled flag), the assumption that the prototype is ready for raycaster picking was wrong. File impediment, revert to the existing screen-space distance matching, and revisit picking strategy in Phase 5.
2. **Per-instance attribute updates cause visible GPU stalls on hover-move.** If pointermove updates of `aHoverMix` cause frame-rate drops on integrated GPU, the per-frame attribute path is wrong at this scale — swap to a uniform-with-hovered-instance-index path in the shader. Plan revision required; revert this PR; new plan doc.
3. **Shader tint via `aHoverMix` is invisible or visually indistinguishable from `aSelectionMix`.** The Phase 2/3 shader path assumed differentiable hover and select states. If the visual difference between `0.45` mix and `0.75` mix is too subtle to read, retune the constants — but if the *shader path itself* doesn't distinguish them, file impediment and add a hover ring overlay (`LineLoop`) as fallback. Plan revision required only if both retune-constants and add-LineLoop fail.
4. **Selection panel layout collides with existing lab controls.** If the top-right placement collides with another panel and no other corner has room, redesign the panel as a slide-in from the right edge instead of an absolute overlay. Same-PR fix, not a kill.
5. **Test coverage cannot reach the per-instance attribute mutation path** (e.g. mocking `InstancedMesh` and its `geometry.attributes` is too brittle). Then introduce a `LandmarkLayerSurface` interface that `ChunkedLandmarkLayer` implements and that tests can stub with a plain object. Same-PR refactor; not a revert.

Recovery in any case is `git revert` plus a follow-up issue. No data migrations to unwind. Lab is dev-only (`?view=terrain-lab`); zero user impact.

## explicit user sign-off

Not required (Reversible impact class). The user has standing approval for Phase 4 via:

1. The original THR-12 issue body (2026-04-13), which explicitly references `Docs/plans/2026-04-08-procedural-hex-vignettes.md` § Phase 4.
2. The parent architecture doc 2026-04-08 (Christian-reviewed, shipped).
3. The scheduled `keep-work-flowing` task's standing instruction to advance the highest-priority work in active projects when no human is present.

No new load-bearing decisions are introduced.

## author notes for the judge

Five things the judge should pay attention to:

1. **The cut between Phase 4 and Phase 5 is deliberate.** Phase 4 ships interaction (hover/select/click/panel/keyboard); Phase 5 owns context-loss recovery, priority-aware cap dropping, zoom-driven LOD, and Chrome profiling. The parent doc supports this split. If the judge thinks Phase 4 should include context-loss handling or LOD, the judge is reading against the parent doc's intent — Phase 5 owns those.

2. **Browser-verify is Claude-in-Chrome, not Playwright.** This is a HexMapV2/lab/WebGL surface. Per CLAUDE.md viewport contract: Playwright cannot see canvas content. The plan doc names the tool explicitly in §6.7 and §15. The hover/select tints are visible only through WebGL; an automated screenshot at 1920×1080 via Claude-in-Chrome is mandatory.

3. **Three-pillar Content is honestly N/A.** Phase 4 is interaction infrastructure; the selection panel reads existing `LocationClickTarget` metadata without adding new content tables, prose, or templates. The plan doc explicitly notes Content as N/A in §2 and §11. This is not a missing pillar; it is the correct classification for a UI/interaction phase.

4. **The Tab-cycles-selection feature is explicitly Stretch.** It is listed in §6.6 and §12 as optional polish. If the implementer skips it, no downstream Phase is blocked. This is correct scope discipline, not unfinished design.

5. **The plan depends on Phase 3 shipping a `setInstanceAttribute` accessor on `ChunkedLandmarkLayer`.** Phase 3 may or may not have shipped this method by exact name. The plan notes (§4.2) that if Phase 3 didn't expose it, Phase 4 adds it in the same PR (≤20 LOC). This is a documented soft-dependency, not a gap.

The reason Cowork is running THR-12 design now while THR-11 has not yet landed: THR-11 was just handed off to CC this same morning. Phase 4 design work is mutex-blocked from implementation but not from design — the design work can be pre-staged so CC picks up THR-12 immediately after THR-11 merges. This is forward-loading, not parallel execution, and is explicitly allowed by the coordination protocol (mutex applies to In Dev, not to In Design → Ready for Dev pipeline).
