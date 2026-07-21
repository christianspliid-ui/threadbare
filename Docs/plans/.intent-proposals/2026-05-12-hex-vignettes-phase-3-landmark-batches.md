# Intent Proposal: Hex Vignettes Phase 3 — Landmark Batch Layer

## intent_quote

> Triggered by an automated Cowork scheduled task ("keep-work-flowing") with the standing instruction set:
>
> > Check Linear for the highest-priority work … Do the design work — cover all three pillars: Engine, Content, UI. If too many grey areas, ping christian (the human) with questions. Move the issue to "Ready for Dev" with a full coordination block.
>
> The user (Christian) issued the original THR-11 ask via Linear at issue creation 2026-04-13:
>
> > TB-125 · Procedural Hex Vignettes — Phase 3: Landmark Batch Layer. Convert repeated landmark archetypes (village, city, temple, etc.) from clone-based to chunked instanced landmark batches. Enforce Blender export contracts, register click targets from slot anchors. Design doc: `Docs/plans/2026-04-08-procedural-hex-vignettes.md` § Phase 3.

The user has already shipped the parent architecture doc 2026-04-08 (730 lines) and Phases 1–2 are merged to `main`. This plan is the implementation walkthrough for Phase 3 specifically.

## scope (what this plan does)

Author the Phase 3 implementation walkthrough that takes the parent architecture doc 2026-04-08 (the authoritative source on chunked instancing, slot composition, custom unlit instance material, click registry, fail-soft, NFP compliance) and lands it as a CC-pickup-ready Linear handoff. The walkthrough specifies the three new lab modules (`ChunkedLandmarkLayer`, `VignetteClickRegistry`, `LandmarkExportValidator`), file-level wiring into the existing terrain lab canvas, Phase 3-specific constants, traces, fail-soft cases, and the verification plan including Claude-in-Chrome browser-verify artefact. All file touches are confined to `src/components/HexMapV2/lab/**` and `Docs/`.

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT ship interaction (hover ring, selection ring, raycaster wiring, lab selection panel) — that is Phase 4 (THR-12) and was already deferred at the architecture level.
- Does NOT touch the live game renderer (`HexMapV2.tsx`), tick loop, engine, or any high-impact `src/` file. Phase 6 picks up game-renderer wiring after Phase 5 profiling proves the prototype.
- Does NOT re-export any landmark GLB. The validator surfaces non-conforming assets as warnings; re-export is asset-team follow-up.
- Does NOT add WebGL context-loss handling beyond what Phase 2 already does — Phase 5 (THR-13) owns context-loss resilience for both filler and landmark layers.
- Does NOT change the parent architecture decisions: chunked batching, custom unlit instance material, slot-based composition, click-priority order, Blender export contract — all are settled in the parent doc and untouched.
- Does NOT modify any rules of play (rulebook) — purely rendering infrastructure.
- Does NOT touch the narrative `hexVignette` engine (`src/engine/hexVignette.ts`, `src/engine/vignetteProse.ts`) — different namespace, different concern.

## impact_class

**Reversible.** Lab-only code (`src/components/HexMapV2/lab/**`) with no game-renderer wiring, no engine touches, no high-impact files. If Phase 3 regresses the terrain lab, the fix is to revert the PR — no migrations, no state changes, no live-user surface. The terrain lab is a developer-only `?view=terrain-lab` surface, not in the player flow.

The Blender export contract doc is additive (new file). The validator warnings are non-blocking. The new constants are namespaced under `TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS`.

## evidence cited

- **Linear issue:** THR-11
- **Vision premises invoked:** none — purely rendering infrastructure. Vision audit performed and recorded as "none" in §17 of the plan doc.
- **UL terms touched:** none (no new gameplay terminology). Existing terms `landmark`, `hex`, `slot`, `vignette` are used as already defined in the parent doc.
- **Canon pages consulted:** `Docs/canon/hex-map.md` (referenced via the parent doc's authority); `Docs/canon/process.md` (NFP, three-pillar rule, definition of done).
- **Prior plan docs this builds on:** `Docs/plans/2026-04-08-procedural-hex-vignettes.md` (authoritative parent architecture doc — every load-bearing decision, the constants table for the parent levels, the wiring section's planned modules, and the fail-soft table were defined there).
- **Rejected approaches considered and dismissed:**
  - Skip the validator, hope assets are conforming → rejected, validator is cheap and gives the asset team a signal.
  - Build interaction into Phase 3 → rejected, Phase 4 owns it, keeping the cut clean reduces blast radius and makes Phase 3 a pure refactor.
  - Build a separate landmark shader → rejected, Phase 2's `VignetteInstanceMaterial` already supports per-instance `aVisibilityState` and `aHoverMix` — reuse is the right call.
  - Use a higher `LANDMARK_MAX_INSTANCES_PER_BATCH` matching the filler 3072 → rejected, landmark counts are tiny and a tight ceiling lets Phase 5's cap-dropping logic differentiate landmarks from filler.

## load-bearing decisions touched

From CLAUDE.md "Load-Bearing Architectural Decisions":

- **Three-pillar rule** — addressed. Engine, Content, UI sections all explicit, with deferrals to Phase 4 named for the UI items that are out of scope.
- **Module only in test files = not integrated** — addressed by wiring section: `ChunkedLandmarkLayer` and `VignetteClickRegistry` are consumed by `TerrainTextureLabCanvas.tsx`, not just tests.
- **Engine caches must be owned per session** — N/A; the lab is dev-only and rebuilds on every canvas mount.

No load-bearing decision is being changed. All decisions are upheld as defined in the parent doc.

From the parent architecture doc:

- **Chunked batching, not global batching** — upheld. Phase 3 grouping is `modelId × materialSlot`, matching the filler pattern.
- **Custom unlit instance material** — upheld. Reused, not duplicated.
- **Slot-based composition** — upheld. Click registry is keyed on slot anchors, mirroring the data shape `terrainTextureLabVignettePrototype` already emits.
- **Blender export contract (filler ≤2, landmarks ≤3 material slots)** — upheld and formalised. Phase 3 ships the validator and the contract doc.

## high-impact files touched (from Codesight)

None. All file touches confined to `src/components/HexMapV2/lab/**`, `Docs/art-pipeline/`, `Docs/plans/`, `Docs/changelog.md`. The high-impact files (`src/engine/graph.ts` 370 importers, `src/types/index.ts` 186, `src/types/gameState.ts` 176, `src/types/traits.ts` 156, `src/engine/traceBuffer.ts` 106) are not touched. No Blast Radius section is required and the plan doc explicitly omits it per the per-system required-sections policy.

## kill criteria

This Phase 3 plan was wrong if any of the following happen during implementation:

1. **Draw-call ceiling cannot be held.** Landmark batches exceed 12 draw calls in a typical lab scene even after tuning `LANDMARK_MAX_INSTANCES_PER_BATCH`. Then the chunking dimension or the active-archetype count was misjudged — file an impediment and a Phase-5-blocker ticket.
2. **Visual parity with clone-based output cannot be achieved.** If lighting, color, or layering looks materially different, the assumption that `VignetteInstanceMaterial` can cover landmarks without per-asset tuning was wrong — revert the cut-over within the same PR, keep clones, refactor in a follow-up.
3. **Validator flags >50% of current landmark assets.** Then the export contract was set at the wrong threshold or the current asset library was authored against different assumptions — escalate to user, do not silently truncate half the catalogue.
4. **Test coverage cannot reach build/dispose/registry behavior** (e.g. because mocking InstancedMesh without WebGL is too hard). Then either lower the bar to a smaller scoped test or bring in a thin abstraction — but do not ship without coverage of the new modules.

Recovery in any case is `git revert` plus a follow-up issue. No data migrations to unwind.

## explicit user sign-off

Not required (Reversible impact class). The user has standing approval for Phase 3 via the original THR-11 issue body and the parent architecture doc. No new load-bearing decisions are introduced.

## author notes for the judge

Three things the judge should pay attention to:

1. **The cut between Phase 3 and Phase 4 is deliberate.** I explicitly defer hover/selection feedback, raycaster integration, and the lab selection panel to Phase 4 (THR-12), and marked THR-12 as Mutex with THR-11 in the coordination block. The parent doc supports this split (Phase 4 is its own listed phase). If the judge thinks Phase 3 should include interaction, the judge is reading against the parent doc's intent — the parent already drew this line.

2. **Browser-verify is Claude-in-Chrome, not Playwright.** This is a HexMapV2/lab/WebGL surface. Per CLAUDE.md viewport contract: Playwright cannot see canvas content. I called out Claude-in-Chrome by name in §6.3 and §14 of the plan doc. Sonnet-tier CC may not internalise this distinction by default; the plan doc names the tool explicitly so the verification step doesn't go wrong.

3. **Three-pillar coverage may look thin for Content.** Content is "Blender export contract doc + validator surfaces non-conforming assets". This is honest — Phase 3 is a rendering refactor. The validator IS the content-pillar surface. Calling Content N/A would be wrong because the export contract is a content-facing artefact the asset team will use. Calling Content extensive would be padding. The middle ground is what's in the plan.

The reason I'm running Cowork autonomously on THR-11 instead of THR-414 (P2 High) or THR-390 (P3 Medium): both In Design issues explicitly require user verdicts and the scheduled task says "don't push through work without at least one project-level brainstorming session with your human". The Procedural Hex Vignettes project has a complete project-level brainstorm at 2026-04-08, Phases 1–2 are merged, Phase 3 is the next sequential phase with clear architectural authority. This is exactly the kind of "within-scope decisions based on existing direction" the scheduled task authorises.
