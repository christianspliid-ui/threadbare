# Integration Wiring Checklist

> **Living document.** Every design plan must include a wiring section that maps new modules to entries on this checklist. Every implementation must verify all listed connections before marking work complete. Maintaining this checklist is part of the Definition of Done for both design and implementation phases.
>
> **Last updated:** 2026-05-14 (THR-433 — Kindle a Calling internal-pressure resolver: `kindle_a_calling` added to `FactionGovernanceVerbKind` union and dispatched through existing `faction_verb` GraphOp; new `applyKindleACalling` in `factionGovernanceVerbs.ts` reuses exported `scoreEligibleAmbitions` / `selectAmbitionType` / `mulberry32` / `hashString` from `factionAmbitions.ts`; four-signal `computeKindleBias` (member axiology, leader bias, doctrine pressure, dissent); `getArmyLockedAmbitionId` guard; `faction.encounter.calling_named` template in `faction-governance-encounters.ts` (2 steps + 2 aftermath reactions: commit / stall); FactionSheet ▲ glyph + "kindled" sublabel via new `FactionNetworkAmbition.kindled` field; new `FactionKindleCallingTrace` with bias-weighted candidate list. Previous: 2026-05-14 (THR-432 — Anoint Successor succession subsystem: `anoint_successor` GraphOp intercepted in `unifiedActionResolution.ts` (sibling pattern to `faction_verb` / `plant_schism`), new `phaseFactionSuccession` registered in `post-narrative` slot, `applyAnointSuccessor` in new `anointSuccessor.ts`, `getAnointedLeaderId` helper in `factionNetwork.ts` consulted by both `getFactionNetworkSummary` and `phaseFactionActions.getFactionLeader`, 2 new EdgeTypes (`will_succeed`, `leads`) + EDGE_SCHEMA entries, `faction.encounter.inheritance` template in `faction-governance-encounters.ts`, FactionSheet woven-thread glyph (`❧`) + "by inheritance" sublabel, 2 new trace categories with 5 succession outcome variants. Previous: 2026-05-14 (THR-430 — Schism deferred-resolution divine action: `plant_schism` GraphOp intercepted in `unifiedActionResolution.ts` (sibling pattern to `faction_verb`), new `phaseSchismResolution` registered after `faction_actions`, `performFactionSplit` + `performFactionReform` in new `factionTopology.ts`, splinter-naming table in `faction-schism-content.ts`, `SchismPendingBanner` + `SchismReformAfterimage` in `FactionDetailBody`, `__DEBUG.schism.list()`, 3 new trace categories with typed interfaces. Previous: 2026-05-14 (THR-12 — Hex Vignette Phase 4: LandmarkRaycaster, VignetteSelectionState, aSelectionMix GPU attribute, hover/selection easing, raycaster click detection, __TERRAIN_LAB selectLandmark/gotoLandmark/getSelectionState/clearSelection. Previous: 2026-05-12 (THR-11 — Hex Vignette Phase 3: ChunkedLandmarkLayer, VignetteClickRegistry, LandmarkExportValidator, window.__TERRAIN_LAB dev API. Previous: 2026-05-12 (THR-418 — Added Sustained Controls surface in ThreadsPanel: `getSustainedControlNodes` resolver, `championEffectId`/`championTemplateId` on `ThreadedAgent`, new Hexes/Sources sections + champion chip + location claim-status fold-in, DebugPanel `Sustained` inspector tab, `src/data/sustained-control-status-prose.ts` content tables, 3 new `ActivityIcon` kinds. Previous: 2026-05-09 (THR-389 — Added Encounter Foreshadowing: on-click resolver, per-session cache, `foreshadowing` field on `UnifiedActionTemplate`, Foreshadowing DebugPanel tab, debug-bridge methods. Previous: 2026-05-08 (THR-266 — Added UI Pillar Verification section). Previous: 2026-05-08 (THR-289 — Added UL Interactive Dashboard reference surface at `?view=ul`). Previous: 2026-05-07 (THR-326 — Added regional detection-pressure phase wiring + DebugPanel detection inspector surface). Previous: 2026-04-29 (THR-109 — Added branch-aware aftermath selection surface (`BranchAwareAftermathConfig` / `resolveAftermathVariant`). Previous: 2026-04-19 THR-174 viewport audit.)

---

## Sustained Controls in ThreadsPanel (THR-418)

The right-bar `ThreadsPanel` already surfaces the five existing thread categories. THR-418 adds two new section types (Hexes / Sources) for sustained `ControlEffect`s, plus a champion-chip overlay on agent rows and a folded-in claim-status line on threaded location rows.

| Surface | Path | Notes |
|---|---|---|
| Engine resolver | `getSustainedControlNodes(graph, ascendantId, controlEffects, essenceReserves, currentTick?)` in `src/engine/retinue.ts` | Pure function, deterministic sort, fail-soft on missing target/reserves/undefined effects. Returns `SustainedControlNode[]` with category, runway, lapse-risk, prose-friendly net-flow totals, primary sphere. |
| Engine types | `SustainedControlNode`, `SustainedControlCategory`, `LapseRisk` in `src/engine/retinue.ts` | Discriminated category union: `'hex' | 'source' | 'location'`. |
| Champion wiring | `ThreadedAgent.championEffectId` + `championTemplateId` populated by `getThreadedNodes` (allowlist: `CHAMPION_TEMPLATE_IDS = ['action.anoint-champion', 'hex.install_champion']`) | First-write-wins on the controlEffects array (deterministic since `phaseControlEffects` appends in establishment order). |
| Tunable constants | `SUSTAIN_LAPSE_RISK_CRITICAL_TICKS=3`, `SUSTAIN_LAPSE_RISK_TIGHTENING_TICKS=8`, `SUSTAIN_BAR_FULL_FRACTION=1.0`, `SUSTAIN_BAR_MIN_VISIBLE_FRACTION=0.08`, `CHAMPION_TEMPLATE_IDS` | All exported from `src/engine/retinue.ts`. |
| Trace types | None new — reuses existing `ControlEffectTickTrace` / `ControlEffectLapseTrace` / `ControlEffectEstablishedTrace`. | The view layer adds no traces; resolution and lapse already emit. |
| Orchestrator phase | None new — `phaseControlEffects` already handles the lifecycle. |
| Content tables | `src/data/sustained-control-status-prose.ts` exports `SUSTAINED_STATUS_LABELS` (11 templates × 3 risk tiers + `__default__`), `CHAMPION_BADGE_LABELS` (2 entries), `LAPSE_WARNING_TOOLTIPS` (3 entries), plus helpers `getSustainedStatusLabel(templateId, risk)` and `getChampionBadgeLabel(templateId)`. | Threadbare voice; numbers only in sustain-bar hover tooltip. |
| UI sections | `ThreadsPanel.tsx` — `SECTION_ORDER` includes `'hex'` and `'source'` keys (via new `ThreadSectionKey` union = `ThreadCategory \| 'hex' \| 'source'`). Sections auto-expand when any row has `lapseRisk !== 'safe'`, else collapsed. | `data-testid="threads-section-header-hex"` / `-source` for tests. |
| Row component | `SustainedControlRow` inside `ThreadsPanel.tsx` — sphere-tinted left border, status label, ⤓/⤒ flow chips, zoom button, animated 2px sustain bar with safe/tightening/critical tinting + runway tooltip. | `data-testid="sustained-control-row"`; sustain bar at `data-testid="sustain-bar-fill"`. |
| Location fold-in | `CompactThreadRow` agent/location branch receives `locationClaimStatus?: string \| null` from a `sustainedControlsByLocationId` map built in `ThreadsPanel` from `sustainedControls.filter(c => c.category === 'location')`. | `data-testid="location-claim-status"`. |
| Champion chip | `CompactThreadRow` agent branch renders a clickable chip when `node.championTemplateId !== null`; click invokes `onChampionChipClick(agentId)`. Wired to existing `openAgentProfileForId` in GameView. | `data-testid="champion-chip"` + `data-champion-template-id`. No new modal. |
| Activity icons | 3 new `ActivityKind` entries — `'hex-claim'` (hex outline + dot), `'source-bound'` (wellspring), `'claim-flag'` (pennant) in `src/components/shared/ActivityIcon.tsx`. | Mapped per category in `SUSTAINED_CATEGORY_ICON`. |
| GameView consumer | `sustainedControls` useMemo in `src/components/Game/GameView.tsx` keyed on `[graph, ascendantId, controlEffects, essencePool, tick, worldVersion]`. Passed to `ThreadsPanel` as `sustainedControls`; `onChampionChipClick={openAgentProfileForId}`. | Also passes `controlEffects` + `essenceReserves` to `DebugPanel`. |
| useAgentInteraction wiring | `threadedNodes` useMemo in `src/components/Game/hooks/useAgentInteraction.ts` now passes `gameState.controlEffects` to `getThreadedNodes` so `championEffectId` populates live. Dep array extended. | |
| DebugPanel tab | New `'sustained-controls'` view in `src/components/Game/debug/DebugTabContent.tsx` — read-only inspection table (template, target, ticksActive, cost, income, runway, threshold marker, lapse reason). Tab label `'Sustained'`. | `data-testid="sustained-debug-row"` per row. |
| Empty-state behavior | "No Threads" copy still shows only when both `threadedNodes` and `sustainedControls` are empty. New count: `totalCount = threadedNodes.length + sustainedControls.length`. | |
| Verification coverage | `src/engine/__tests__/retinue.test.ts` (23 new tests covering champion-wiring + getSustainedControlNodes + pickPrimarySphere). `src/components/Game/__tests__/ThreadsPanel.test.tsx` (11 new tests covering sections, prose fallbacks, champion chip click, empty-state). | |

---

## How to Use This Checklist

**During design (Cowork):** For each new engine module or UI component in your plan, list which integration surfaces it must connect to. Reference the specific checklist items below. If a surface doesn't exist yet, note that the surface itself must be created.

**During implementation (Claude Code):** Before marking a feature complete, verify every connection listed in the plan's wiring section. Use this checklist as the canonical list of integration surfaces. If you discover a new surface, add it here.

**Rule:** An engine module that is only imported by test files is not integrated. A UI component that is imported but not rendered in JSX is not integrated. Both count as incomplete work.

---

## Integration Surfaces

### Hex Vignette Phase 3 — Chunked Landmark Layer (THR-11)

Replaces clone-based landmark placement with `InstancedMesh` batching. Each GLB is loaded once, split into submeshes, and rendered as a single `InstancedMesh` per submesh with a custom unlit shader (`VignetteInstanceMaterial`).

| Surface | Path | Notes |
|---|---|---|
| Core layer | `src/components/HexMapV2/lab/vignette/ChunkedLandmarkLayer.ts` | Groups placements by `modelId`, loads GLTFs (cached), extracts ≤3 submeshes, builds `InstancedMesh` batches. Exposes `build()`, `batchCount`, `validationReports`, `setVisible()`, `setChunkBoundsVisible()`, `dispose()`. |
| Validation | `src/components/HexMapV2/lab/vignette/LandmarkExportValidator.ts` | Checks submesh count against `LANDMARK_MAX_MATERIAL_SLOTS`; emits `warn` severity when truncated. Report type `vignette.landmark.validation`. |
| Click registry | `src/components/HexMapV2/lab/vignette/VignetteClickRegistry.ts` | Stores `LandmarkClickEntry[]` (click target + `batchKey` + `instanceIndex`). Populated by `ChunkedLandmarkLayer.build()`, consumed by Phase 4 raycaster. |
| Constants | `TERRAIN_TEXTURE_LAB_VIGNETTE_CONSTANTS` in `terrainTextureLabPresets.ts` | `LANDMARK_MAX_INSTANCES_PER_BATCH=256`, `LANDMARK_DEFAULT_VISIBILITY_STATE=2`, `LANDMARK_LAYER_Z_OFFSET=0.02` |
| Canvas wiring | `src/components/HexMapV2/lab/TerrainTextureLabCanvas.tsx` | Removed `modelGroup` / `syncPlacements`. Added `landmarkLayerRef`, `clickRegistryRef`, `ChunkedLandmarkLayer` build useEffect, `showLandmarkBounds` prop, `onLandmarkLayerBuilt` callback, `window.__TERRAIN_LAB` dev API. |
| Overlay | `src/components/HexMapV2/lab/vignette/VignetteDebugOverlay.tsx` | Added `showLandmarkBounds` toggle, filler/landmark/batch count HUD. |
| Parent wiring | `src/components/HexMapV2/lab/TerrainTextureLab.tsx` | Added `landmarkBatchCount` state, `fillerInstanceCount` memo, new props to canvas and overlay. |
| Art contract | `Docs/art-pipeline/blender-export-contract.md` | ≤3 submeshes, Y-up, apply transforms before export, scale reference table. |
| Dev API | `window.__TERRAIN_LAB.clickRegistry` / `window.__TERRAIN_LAB.landmarkBatchCount` | DEV-only; tree-shaken in prod. |
| Traces | `vignette.landmark.build`, `vignette.landmark.registry`, `vignette.landmark.validation` | DEV-only console.debug. |
| Tests | `src/components/HexMapV2/lab/__tests__/vignetteChunkedLandmark.test.ts` | Covers: constants, `validateLandmarkExport` (severity, truncation, nested meshes, type, url), `VignetteClickRegistry` (replace, overwrite, clear, readonly list). |
| Settings field | `TerrainTextureLabVignetteSettings.showLandmarkBounds` | Persisted to `TERRAIN_TEXTURE_LAB_VIGNETTE_STORAGE_KEY`. |

---

### Reference Surfaces — UL Interactive Dashboard (THR-289)

| Surface | Path | Notes |
|---|---|---|
| Route | `src/App.tsx` (`?view=ul`) | Lazy-loaded `UbiquitousLanguageDashboard` mirroring the Codex/StyleGuide/CMS pattern. |
| IA manifest entries | `src/data/ia-manifest.ts` | Three new surfaces — `ul.dashboard`, `ul.sidebar`, `ul.detail-pane` — under `view: 'ul'`. `'ul'` added to `SurfaceView` union. |
| StartPage menu item | `src/components/StartPage/StartPage.tsx` | "Ubiquitous Language" entry that navigates to `?view=ul`. |
| Build-time generator | `scripts/generate-ul-dashboard-data.ts` → `src/data/ul-dashboard.generated.json` | Parses the seven UL shards into a typed JSON snapshot. Wired as `npm run generate-ul-dashboard` and the `prebuild` hook so vite-build always emits a current snapshot. |
| Drift status placeholder | `src/data/drift-scan-status.json` | Empty v1 contract; live data wired in deferral (drift-scan emits + GH Action commits). |
| Drift constants single-source | `scripts/drift-scan/constants.ts` | Browser-safe re-export consumed by both the weekly drift-scan job and `src/data/ul-dashboard-constants.ts`. |
| Components | `src/components/UL/` | `UbiquitousLanguageDashboard`, `ULSidebar`, `ULTermTable`, `ULDetailPane`, `ULSearchBox`, `ULDriftBadge`, `ulDashboardData`, `ulSearch`, `ulMarkdown`. |
| Verification coverage | `scripts/__tests__/generate-ul-dashboard-data.test.ts`, `src/components/UL/__tests__/UbiquitousLanguageDashboard.test.tsx`, `src/components/UL/__tests__/ulSearch.test.ts` | Generator parse + warning shape, dashboard smoke render, search ranking ordering. |

### Encounter Foreshadowing (THR-389)

On-click resolver — never per-tick. Resolves once per `(agentId, encounterId, intelligenceVersion, interventionVersion)` tuple and caches the result for the session.

| Surface | Path | Notes |
|---|---|---|
| Resolver | `src/engine/foreshadowing/getEncounterForeshadowing.ts` | On-click resolver. Reads signals → selects variant by specificity + PRNG → resolves placeholders → caches. Fail-soft: returns `prose: '...'` on any exception. |
| Types | `src/engine/foreshadowing/types.ts` | `ForeshadowingResult`, `ForeshadowingSignals`, `ForeshadowingVariant`, `ForeshadowingAttribution` |
| Generic fallback | `src/engine/foreshadowing/genericFallback.ts` | `GENERIC_FORESHADOWING_FALLBACK` template + `resolveForeshadowingPlaceholders()` |
| Attribution stub | `src/engine/foreshadowing/attributeRecentInterventions.ts` | Returns `null` in Phase 1; Phase 3 wires real attribution |
| Constants | `src/engine/foreshadowing/constants.ts` | `FORESHADOWING_CACHE_MAX_ENTRIES` |
| Content field | `foreshadowing?: EncounterForeshadowing` on `UnifiedActionTemplate` (`src/types/unifiedAction.ts`) | Optional variants array + fallback string. Threaded through `toUnifiedTemplate` in `encounter-content.ts`. |
| Session cache | `SimulationRuntime.foreshadowingCache: Map<string, ForeshadowingResult>` | Owned by runtime (not module-scope). Key: `${agentId}\|${encounterId}\|${intelVersion}\|${interventionVersion}`. Cleared by `resetRuntimeCaches()`. |
| Trace type | `ForeshadowingResolutionTrace` / `category: 'foreshadowing'` in `src/types/trace.ts` | Fields: `agentId`, `encounterId`, `variantsConsidered[]`, `variantPicked`, `signals`, `interventionAttributionId`, `cacheHit`, `error?`, `summary` |
| UI surface | `EncounterDecisionPanel` in `src/components/Game/ThreadDetailView.tsx` | Clickable chevron rows for pool candidates. Prose lazy-loaded on first expand. Gold-bordered italic block when expanded. |
| GameView wiring | `graph`, `runtime`, `tick` props on `ThreadDetailView` in `src/components/Game/GameView.tsx` | Pre-computed `foreshadowingByCandidate` map via `useMemo` in `ThreadDetailView`; resolver called lazily on first `<details>` expand. |
| DebugPanel tab | `'foreshadowing'` view in `src/components/Game/debug/DebugTabContent.tsx` | Renders foreshadowing traces from `allTraces`. Color: gold = new resolution, muted = cache hit, red = error. |
| Debug bridge | `getForeshadowing` + `listForeshadowingTraces` in `src/debug-bridge.ts` / `src/debug-bridge.d.ts` | Async bridge methods. `listForeshadowingTraces(agentId?)` filters by category + optional agentId. |
| Tests | `src/engine/foreshadowing/__tests__/getEncounterForeshadowing.test.ts` | Covers: placeholder resolution, `attributeRecentInterventions` stub, cache hit/miss/clear, tracing, signal defaults, variant specificity selection, generic fallback template token check. |

**Phase 1 deferred signals:** `dominantReach = template.reach ?? 'wilderness'` (encounter's reach, not agent's). `intelligenceTier = 'unknown'`, `topMotive = 'awareness'` (Phase 1 stubs). Phase 3 will derive these from actual intelligence records and encounter-pool funnel scores.

---

### Encounter Experience Foundation (THR-321, Phase A2)

| Surface | Path | Notes |
|---|---|---|
| Constants table | `src/data/encounter-experience-constants.ts` | Named defaults for choice tilts, drift thresholds, detection thresholds, forecast boundaries, cast/hand caps, and animation timings. |
| Trace interfaces | `src/types/traces/encounter-traces.ts` | Defines `ChoiceResolvedTrace`, `ForecastComputedTrace`, `HandFilteredTrace`, `DriftThresholdCrossedTrace`, `DetectionThresholdCrossedTrace`, `ItemConsumedByChoiceTrace`, `SpotlightChangedTrace`. |
| Trace category registration | `src/engine/traceBuffer.ts` | Adds `TRACE_CATEGORIES` entries for the encounter experience traces. |
| GameState scaffolding | `src/types/gameState.ts` / `src/engine/gameInit.ts` | Adds and initializes `archetypeDrift`, `regionalDetectionPressure`, and optional `encounterSpotlight` (legacy aliases `regionDetection` / `spotlightedAgent` retained for compatibility). |
| Detection pressure phase | `src/engine/encounters/detectionPressure.ts`, `src/engine/orchestrator/phaseDetectionPressure.ts`, `src/engine/orchestrator.ts` | Computes per-region pressure gain from committed choice AP cost, applies per-tick decay, emits `detection_threshold_crossed`, and enqueues rival encounter seeds on encounter-threshold crossing. |
| Ascendant hand filter cascade | `src/engine/encounters/handFilter.ts`, `src/engine/encounters/placeGating.ts`, `src/engine/orchestrator/phaseAscendantHandFilter.ts` | Computes playable/dimmed/hidden partition for encounter-scoped ascendant hand, including author-pinned eligibility override and `hand_filtered` trace partition telemetry. |
| Encounter handoff orchestration (THR-340 / Phase F2) | `src/components/Game/encounterHandoff.ts`, `src/components/Game/GameView.tsx` (`handleEncounterClick` + `closeEncounterModalAndResume`) | `prepareEncounterHandoff` emits a `spotlight_changed` trace and surfaces `ENCOUNTER_HANDOFF_TRANSITION_MS` (400ms) plus a silent `EncounterHandoffAudioHook` (post-v1 H1). GameView writes the next `gameState.spotlightedAgent` and clears it on modal dismiss. World-freeze inherits the existing `encounterModalOpen` effect. |
| Agent pulse overlay (THR-340 / Phase F2) | `src/components/HexMapV2/overlay/AgentPulseOverlay.tsx`, `src/components/HexMapV2/HexMapV2.tsx` (`spotlightedAgentId`, `spotlightThreadColor` props), `src/index.css` (`@keyframes agent-pulse`, `@keyframes encounter-handoff-fade-up`) | Camera-projected hex flare on the spotlit agent (rAF, named tunable constants `PULSE_DIAMETER_PX`/`PULSE_PERIOD_S`/`PULSE_OPACITY_RANGE`). Mounted alongside RegionLabelOverlay/LocationLabelOverlay; rendered only when spotlit agent is in viewport. |
| Retinue priority pip (THR-340 / Phase F2) | `src/components/Game/ThreadsPanel.tsx` (`CompactThreadRow`), `src/components/Game/RetinuePanel.tsx` | Small pulsing gold pip rendered next to the agent name when an active encounter exists for that thread. ThreadsPanel is the actively-rendered surface; RetinuePanel kept in sync for tests/legacy mounts. |

### Encounter UI Shell (THR-330, Phase C1)

| Surface | Path | Notes |
|---|---|---|
| Layout shell | `src/components/Game/Encounter/EncounterScreen.tsx` | Three-zone grid (440px hero rail + flex-1 center + 540px right rail) + 100px bottom strip. Exports `ENCOUNTER_SCREEN_LAYOUT` constants. **Not yet wired to GameView — C1 scope. Full data wiring in Phase F2 (THR-TBD).** |
| Hero panel | `src/components/Game/Encounter/EiraHeroPanel.tsx` | Left-rail protagonist panel: portrait fallback, name/subtitle/status, capability strips, items, active vow, recent moments, registration slot for aftermath UI. |
| Capability strip | `src/components/Game/Encounter/CapabilityStrip.tsx` | Single-row reach display: sphere label, dot pips (filled/empty), narrative hint. |
| Verification coverage | `src/components/Game/Encounter/__tests__/EncounterScreen.test.tsx` | Shell zones data-testid presence, `BOTTOM_STRIP_HEIGHT_PX` constraint, protagonist panel sections. |

### Detail Pages (THR-337, Phase E1)

| Surface | Path | Notes |
|---|---|---|
| Detail page type contract + tunables | `src/types/detailPage.ts` | Defines `DetailPage`, `Section` discriminated union, stack/size/pause constants, and fail-soft accent defaults. |
| Stack context + navigation | `src/contexts/DetailModalStackContext.tsx` | Stack state (`push`, `pop`, `popTo`, `replace`) and global ESC/ArrowLeft handling for topmost modal behavior. |
| Encounter pause bridge hook | `src/hooks/useDetailModal.ts` | Exposes `isOpen` + pause contract outputs (`pausedBeatIndicatorOpacity`, `ambientDuckDb`) for encounter-shell wiring. |
| Detail shell + composable primitives | `src/components/shared/DetailModal.tsx`, `src/components/shared/DetailBreadcrumb.tsx`, `src/components/shared/Section.tsx` | Portal-stacked modal shell with breadcrumb collapse, 28% per-layer dimming, section dispatcher placeholders for all five section kinds. |
| Verification coverage | `src/components/shared/__tests__/DetailModal.test.tsx`, `src/hooks/__tests__/useDetailModal.test.tsx` | Snapshot coverage at depths 1/2/4/5, stack controls, section rendering, size constants, and pause-state hook contract. |

### Detail Pages (THR-338, Phase E2 — typed instances)

| Surface | Path | Notes |
|---|---|---|
| Section resolver registry | `src/data/detailPageTemplates.ts` | Per-kind schema entries (Actor / Item / Faction / Place / Event) wiring `defaultResolver`, `fallbackResolver`, `mandatory` floor, and `showcaseOverridable` flag. Adding a section row here is the only way to change a page's shape. |
| Section resolvers | `src/engine/detailPageResolvers.ts` | Graph-walking resolvers per `(pageKind, typeId)` row. Each takes `SectionResolverContext`, returns `Section | null`. Includes `actorPortraitFallback`, `itemIconFallback`, `factionRepFallback`, `placeWantsFallback`, `eventSkeletalFallback` for the mandatory floor. |
| Detail page generator | `src/engine/detailPageGenerator.ts` | `generateDetailPage(input)` entry point. Pure read of graph + encounter context. Per-tick cache (auto-evicts on tick advance), unknown-entity stub for missing/mismatched nodes, authored-showcase override path. |
| Fallback prose templates | `src/data/detail-page-fallback-templates.ts` | Per-kind template pools (≥5 variants per slot per `DETAIL_FALLBACK_PROSE_VARIANTS`). Used by mandatory-floor fallback resolvers when graph data is sparse. |
| Showcase authoring contract | `src/data/detail-page-showcase.ts` | Empty `SHOWCASE_AUTHORING` map for THR-318 Stream 2 to fill. `getShowcaseAuthoring(nodeId, templateId)` is the engine read path. |
| Click-through opener context | `src/contexts/DetailPageOpenerContext.tsx` | Provides `openByRef(ref)` to all descendants of the encounter shell so chips / event-cards / `data-term` prose spans navigate without re-wiring `graph + tick + seed + push`. Section dispatcher consumes via `useDetailPageOpener()`. |
| Typed open hooks | `src/components/Game/Encounter/DetailPage/openDetailPage.ts` | `useOpenDetailPage(gameState)` returns `{ openActor, openItem, openFaction, openPlace, openEvent, openRef }` for click handlers on cast tiles, items rail, faction chips, place captions, callback notes. Wire the encounter shell's `DetailPageOpenerProvider` value to `openRef` from this hook. |
| Verification coverage | `src/engine/__tests__/detailPageGenerator.test.ts`, `src/components/Game/Encounter/DetailPage/__tests__/TypedDetailPages.test.tsx` | Generator unit tests across 5 kinds + fail-soft + cache invalidation. Integration snapshots at 1920×1080 for each typed instance, modal stacking 4-deep, chip-click → opener invocation. |

### 1. Orchestrator Tick Loop (`src/engine/orchestrator.ts`)

Every engine module that produces per-tick state changes must be called from a phase in the orchestrator. Phases come in two flavours:

1. **Registered phases (declarative — THR-238).** Authored as descriptors in `src/engine/phases/<id>.ts` and wired by adding to `ENGINE_PHASES` in `src/engine/phases/index.ts`. The orchestrator imports `PHASE_PLAN`, topo-sorts at module-load time, and runs each slot via `runRegisteredPhases(state, ctx, slot, PHASE_PLAN)`. Adding a new phase = create the descriptor file + register it. No `orchestrator.ts` edit required. Missing dependencies, cycles, and id collisions throw at boot.
2. **Inline orchestrator phases.** Direct `s = { ...s, ...phaseFoo(s) };` calls in `runTick`. Used for phases that need orchestrator-shared state (`uaRng`, `prevActions`, `effectStates` accumulators) the registry context doesn't yet expose. These remain inline by design — see THR-238 plan § *Phases explicitly out of scope*.

#### Registered phases (declarative — THR-238)

Phases below ship as descriptors and are picked up automatically by `runRegisteredPhases` from the slot anchor in `runTick`. Land 3 will continue migrating phases from the inline table into this one.

| Slot | Phase id | Source descriptor | Implementation file |
|------|----------|-------------------|---------------------|
| `pre-doom` | `doom` | `src/engine/phases/doom.ts` | `src/engine/phaseDoom.ts` |
| `post-doom` | `emitted_omen_decay` | `src/engine/phases/emittedOmenDecay.ts` | `src/engine/phaseOmenAgenda.ts` |
| `pre-economy` | `reputation_decay` | `src/engine/phases/reputationDecay.ts` | `src/engine/phaseReputationDecay.ts` |
| `post-economy` | `ambition_progress` | `src/engine/phases/ambitionProgress.ts` | `src/engine/ambitionTick.ts` |
| `post-economy` | `faction_ambitions` (after `ambition_progress`) | `src/engine/phases/factionAmbitions.ts` | `src/engine/factionAmbitions.ts` |
| `post-economy` | `faction_actions` (after `faction_ambitions`) | `src/engine/phases/factionActions.ts` | `src/engine/phaseFactionActions.ts` |
| `post-economy` | `secrets_favors` (after `faction_actions`) | `src/engine/phases/secretsFavors.ts` | `src/engine/phaseSecretsFavors.ts` |
| `post-economy` | `clue_decay` (after `secrets_favors`) | `src/engine/phases/clueDecay.ts` | `src/engine/ruins/clueLifecycle.ts` |
| `post-economy` | `ruin_quest_hooks` (after `clue_decay`) | `src/engine/phases/ruinQuestHooks.ts` | `src/engine/ruins/questHooks.ts` |
| `post-economy` | `delve_admission` (after `ruin_quest_hooks`) | `src/engine/phases/delveAdmission.ts` | `src/engine/ruins/delveVariant.ts` |
| `post-economy` | `delve_progression` (after `delve_admission`) | `src/engine/phases/delveProgression.ts` | `src/engine/ruins/delveVariant.ts` |
| `post-economy` | `delve_emergence` (after `delve_progression`, reads `ctx.runtime`) | `src/engine/phases/delveEmergence.ts` | `src/engine/ruins/delveVariant.ts` |
| `post-economy` | `pop_streams` (after `delve_emergence`) | `src/engine/phases/popStreams.ts` | `src/engine/ruins/placeOfPowerStreams.ts` |
| `post-narrative` | `mandate` | `src/engine/phases/mandate.ts` | `src/engine/phaseMandate.ts` |

Slot anchor positions in `runTick`: `pre-doom`, `post-doom`, `post-resolution`, `post-decision`, `pre-economy`, `post-economy`, `pre-lifecycle`, `post-narrative`. See `src/engine/phaseRegistry.ts` for slot semantics.

#### Inline orchestrator phases — current order:

| Phase | Function | What it does |
|-------|----------|-------------|
| 1.5 | `phaseJourneyBeat` | Journey beat progression |
| 2a | `phaseUnifiedActionProgress` | Action execution & resolution |
| 2a.3 | `phaseEncounterProgressionV2` | Encounter step advancement |
| 2a.52 | `phaseEffectShells` | Non-step-outcome flip_table triggers (attachment_gained, manual); step_outcome triggers fire inline in executeStepResult (THR-53) |
| 2a.4 | `tickEffects` (inline orchestrator block) | Generic effect runtime bookkeeping: duration, cooldown, decay, stacking, attachment removal |
| 2a.6 | `phaseEncounterVisibility` | Encounter notifications |
| 2a.605 | `phaseDetectionPressure` | Regional detection pressure accumulation/decay, threshold traces, and rival encounter-seed enqueue |
| 2a.61 | `phaseChoiceResolution` | Process pending player choice commits → d100 roll, drift accumulation, item consumption, `choice_resolved` + `drift_threshold_crossed` + `item_consumed_by_choice` traces (THR-323) |
| 2a.62 | `phaseAscendantHandFilter` | Encounter-scoped ascendant hand partition + `hand_filtered` traces |
| 2a.55 | `phaseStrategicProjects` | Strategic project progression + control degradation |
| 2a.85 | `phaseSlotCaps` + `phaseDisposalTimeout` | Attachment slot cap enforcement + disposal timeout |
| 2b | `phaseAgentDecision` | Goal selection & movement initiation (+ strategic candidate merge) |
| 3 | `phaseMovement` | Pathfinding & hex traversal |
| 3.5 | `phaseColocationDetection` | Agent proximity events |
| 4 | `phaseDilemmaDetection` | Moral choice generation |
| 4.5 | `phaseFamiliarityGain` | Proximity-based familiarity |
| 5 | `phaseRivalActions` | Rival behavior |
| 5.5 | `phaseStealth` | Exposure detection |
| 6 | `phaseNarrative` | Vignette & prose generation |
| 7 | `phaseEssence` | Pool regeneration & decay |
| 6.7 | `phaseHiddenMarkDecay` | Hidden mark severity decay + floor-drop trace |
| 6.71 | `phaseIntelligenceDecay` | Intelligence reliability decay + threshold-cross chronicle event (THR-137) |
| 6.715 | `runDivineProximityPhase` | Divine proximity importance accumulation around ascendant hex (THR-25) |
| 7.2 | `phaseDivineInfluenceDecay` | Divine presence fade |
| 7.5 | `phaseTradeRouteDecay` | Route dissolution |
| 8 | `phaseProsperity` | Settlement economic pulse |
| 8.1 | `phaseEconomicTraits` | Traits from economic activity |
| 8.15 | `phaseReputationTraits` | Reach-polarity reputation tally decay + trait assignment |
| 8.2 | `phaseSettlementPromotion` | Hamlet/town/city tier changes |
| 9 | `phaseHexState` | Corruption/influence decay, terrain mutations |
| 9.1 | `phaseUnrest` | Social stability |
| 9.2 | `phaseMagicalSaturation` | Magical energy decay |
| 10 | `phaseInfluenceTierPromotion` | Backstory unlocks |
| 10.1 | `phaseSublocations` | Sublocation spawn/dissolve |
| 10.5 | `phaseEconomicChronicle` | Economic state records |
| 12 | `phaseAgentLifecycle` | Birth, death, migration |
| 13 | `phaseDoomExpiry` | Doom conclusion (kept inline — depends on module-local `nextEventId`) |
| end | `phaseDriftDecay` | Per-tick passive archetype drift decay toward zero (`DRIFT_DECAY_RATE_PER_TICK`). Consumes `state.archetypeDrift`. (THR-323) |

| 6.6396 | `phaseQuintessence` | Quintessence event processing, regen, dissolution |

**Phase 2 resolution wiring (2026-04-02):**

| Caller | Uses shared resolver? | Difficulty normalization |
|--------|----------------------|------------------------|
| `unifiedActionResolution.ts` | ✅ `resolveActionShared()` | Already `0..1` — pass through |
| `encounter.ts` | ✅ `resolveActionShared()` | `normalizeLegacyDifficulty()` at boundary |
| `encounterScoring.ts` | ✅ `computeResolutionThreshold()` | `normalizeLegacyDifficulty()` at boundary |
| `contestation.ts` | ⚠️ Still uses `resolution.ts` directly | Legacy — port in future cleanup |

**Phase 2 quintessence telemetry wiring (2026-04-02):**

| Source | Event kind | Threat band? |
|--------|-----------|-------------|
| `phaseQuintessence` (pending events) | `quintessence_changed` / `reason: pending_event` | No |
| `phaseQuintessence` (passive regen) | `quintessence_changed` / `reason: passive_regen` | No |
| `phaseQuintessence` (threshold crossing) | `state_transition` / `threshold_X_to_Y` | No |
| `orchestrator` (encounter failure) | `quintessence_changed` / `reason: encounter_failure_by_band` | ✅ Yes |

**Hidden mark reveal wiring (THR-112, 2026-04-17):**

| Source | Trace category | revealedBy value | Triggered by |
|--------|---------------|-----------------|-------------|
| `phaseHiddenMarkDecay` (floor drop) | `hidden_mark_revealed` | `decay:severity_floor` | Phase 6.7 per tick |
| `consumeMatchingMarks` (encounter resolution) | `hidden_mark_revealed` | templateId | `GameView.tsx` aftermath call |
| `revealHiddenMark` (direct) | `hidden_mark_revealed` | caller-supplied | Any explicit reveal |
| `scoreAndSelect` (scoring boost) | — (no trace; scoring signal only) | — | `phaseAgentDecision` |

Mark reveal scoring: `MARK_REVEAL_SCORING_BONUS=0.3`, cap `MARK_REVEAL_SCORING_CAP=0.9` in `agent-behavior-constants.ts`. Decay constants in `hiddenMarks.ts`.

**Authored aftermath surfaces — hidden_mark + encounter_seed (THR-135, 2026-04-17):**

Per-surface coverage for the two authored aftermath effect kinds introduced by the unified encounter template format. Both kinds are **planted** from `applyEncounterAftermathReaction()` in `src/engine/encounterAftermath.ts` — called from `GameView.tsx:1920` on player-side encounter resolution (not from an orchestrator phase). Their **runtime** lives in the tick loop.

| Surface | Orchestrator phase | GameState field | Trace category | Debug visibility | UI surfacing |
|---------|-------------------|-----------------|----------------|-----------------|-------------|
| `hidden_mark` effect | Plant: `applyEncounterAftermathReaction` (called from `GameView.tsx:1920`, not a phase). Decay: Phase 6.7 `phaseHiddenMarkDecay`. Consume at resolution: `consumeMatchingMarks` (`GameView.tsx:1921`). Scoring boost: Phase 2b `phaseAgentDecision` via `scoreAndSelect` (`MARK_REVEAL_SCORING_BONUS`). | `state.hiddenMarks?: HiddenMark[]` (`src/types/gameState.ts:208`) | `hidden_mark_placed` (on aftermath), `hidden_mark_revealed` (on consume / decay floor drop) | DebugPanel → Marks tab (filtered by followed agent when set). Source: `HiddenMarksTab.tsx`. | `ripple_consequence` `TickEvent` (`"A buried truth surfaces: {label}"`, significance 0.7) → `NarrativeLog` + `ToastStack`. Low-significance place event (0.3) also filed to chronicle. Prose upgrade tracked in THR-132. |
| `encounter_seed` effect | Plant: `applyEncounterAftermathReaction` (called from `GameView.tsx:1920`). Evaluate: Phase 2a.8 `evaluateEncounterSeeds` (`orchestrator.ts:1802`) — templateId spawn, family-only narrative, or fail-soft expire. | `state.pendingEncounterSeeds?: PendingEncounterSeed[]` (`src/types/gameState.ts:205`) | `encounter_seed_planted` (on aftermath), `encounter_seed_triggered` (on evaluation; `outcome: 'fired' \| 'discarded'`, `discardReason` when discarded) | DebugPanel → Seeds tab (full queue with ready/waiting filter). Source: `EncounterSeedsTab.tsx`. | `narrative` `TickEvent`s → `NarrativeLog`: planted ("A thread has been planted", sig 0.5), spawned ("A planted thread bears fruit", sig 0.65), family-ready ("may surface soon", sig 0.55), expired ("withered before it could take root", sig 0.3). Spawned template enters the agent's `unifiedActions` queue and surfaces through the normal encounter notification pipeline. |

**Verification pointers:**

* Placement + trace emission: `src/engine/encounterAftermath.ts` (hidden_mark at ~line 242; encounter_seed at ~line 180)
* Hidden mark reveal / decay: `src/engine/hiddenMarks.ts`, `src/engine/phaseHiddenMarkDecay.ts`
* Seed evaluation: `src/engine/encounterSeeding.ts`
* Trace type definitions: `src/types/trace.ts` (categories `hidden_mark_placed`, `hidden_mark_revealed`, `encounter_seed_planted`, `encounter_seed_triggered`)

**Secrets & Favors graph layer (THR-30, 2026-04-18):**

`knows_secret_of` (discoverer→subject) and `owes_favor` (debtor→creditor) edges form a persistent social leverage layer. Both feed `computeInitialLeverage()` which is called at the start of every social encounter resolution.

| Surface | Orchestrator phase | Data / Graph surface | Trace categories | Debug visibility | Player visibility |
|---------|-------------------|---------------------|-----------------|-----------------|------------------|
| Secret accumulation | Phase 2a encounter resolution — `secretDiscovery` metadata in template step; `secret_discovery` aftermath effect kind | `knows_secret_of` edges (source=discoverer, target=subject, props: secretType/magnitude/revealed/source/discoveredTick) | `secret_discovered` | DebugPanel → Secrets & Favors tab | AgentDetailPanel → LeverageSection ("Secrets held / Exposed") |
| Favor accumulation | Phase 2a encounter resolution — `favorGeneration` metadata in template; `favor_creation` aftermath effect kind | `owes_favor` edges (source=debtor, target=creditor, props: magnitude/context/redeemed/broken/grantedTick) | `favor_created` | DebugPanel → Secrets & Favors tab | AgentDetailPanel → LeverageSection ("Favors owed / Owes favors") |
| Phase maintenance | Phase 6.653 `phaseSecretsFavors` | Both edge types; reads graph, writes `revealed`/`broken` flags | `secret_tension_escalated`, `secret_expired`, `favor_expired` | Trace feed | None (background) |
| Leverage calculation | `computeInitialLeverage()` (called at social encounter start, from `socialLeverage.ts`) | Reads outgoing `knows_secret_of` + incoming `owes_favor` edges | (returns LeverageResult, no trace) | AgentDetailPanel LeverageSection | LeverageSection (with magnitude labels) |
| Divine ops | GraphOpExecutor: `reveal_secret`, `call_in_favor`, `plant_secret` | Mutates `revealed`/`redeemed` flags or creates new edge | (inline in op result) | DebugPanel trace feed | ActionDrawer (3 divine templates) |

**Tunables:** `SECRET_LEVERAGE_MULTIPLIER` (0.30), `FAVOR_LEVERAGE_MULTIPLIER` (0.25), `MAX_SECRETS_PER_AGENT` (8), `MAX_FAVORS_PER_AGENT` (6) — all in `src/types/secretsFavors.ts`.

**Verification pointers:**
* Graph edge types: `src/types/edgeSchema.ts` (`knows_secret_of`, `owes_favor`)
* Generation helpers: `src/engine/secretGeneration.ts` (`generateSecret`, `createSecretEdge`, `createFavorEdge`)
* Phase: `src/engine/phaseSecretsFavors.ts` — Phase 6.653 in orchestrator
* Aftermath cases: `src/engine/encounterAftermath.ts` (`case 'secret_discovery'`, `case 'favor_creation'`)
* Template wiring: `src/engine/orchestrator.ts` (~line 552: `secretDiscovery`; ~line 595: `favorGeneration`)
* Leverage: `src/engine/socialLeverage.ts` — `secret_bonus` + `favor_bonus` in `computeInitialLeverage()`
* UI: `src/engine/agentDetail.ts` (`LeverageSummary`), `src/components/Game/AgentDetailPanel.tsx` (`LeverageSection`)
* Debug: `src/components/Game/debug/DebugTabContent.tsx` (`SecretsFavorsDebugTab`)
* Divine ops: `src/engine/graphOpExecutor.ts` + `src/data/unified-action-templates.ts`
* Tests: `src/engine/__tests__/secretsFavors.test.ts` (17 tests)

**Perceive/Relay divine action resolution hook (THR-151, 2026-04-19):**

7 divine action templates that bypass the standard `apply_influence` GraphOp path and instead dispatch to a dedicated resolver after action success. Hook is wired in `unifiedActionResolution.ts` alongside the `revelationAction` hook.

| Template | Handler | Clue/Edge created | Adjacency gate |
|----------|---------|------------------|---------------|
| `divine.perceive.cast_attention` | `resolveCastAttention` | `knows_clue_of` (precision:vague, source:divine_whisper) via `produceClueConsequence` | ✅ bonded agent within 1 hex |
| `divine.perceive.refine_the_hush` | `resolveRefineTheHush` | Upgrades existing vague→narrowed, or spawns new narrowed | ✅ bonded agent within 1 hex |
| `divine.perceive.listen_for_a_name` | `resolveListenForAName` | `knows_clue_of` (narrowed + originCultureId detail) | ✅ bonded agent within 1 hex |
| `divine.perceive.read_the_threads` | `resolveReadTheThreads` | `knows_clue_of` (vague) for PoP nodes at hex | ❌ no gate — uses all threaded agents |
| `divine.perceive.taste_the_wake` | `resolveTasteTheWake` | Emits `ruins.divine_mark_discovered` traces for `knows_secret_of` (divine_mark) edges | ✅ bonded agent within 1 hex |
| `divine.relay.compose_a_clue` | `resolveComposeAClue` | Direct `knows_clue_of` + `knows_secret_of` (divine_mark on agent) | Agent must be bonded |
| `divine.relay.whisper_the_direction` | `resolveWhisperTheDirection` | Sets `movementState.destinationId` to nearest ruin | Agent must be bonded |

**Verification pointers:**
* Resolver: `src/engine/ruins/perceiveRelay.ts` — `resolvePerceiveRelayAction`, `PERCEIVE_RELAY_TEMPLATE_IDS`
* Hook: `src/engine/unifiedActionResolution.ts` (after `revelationAction` hook)
* Templates: `src/data/unified-action-templates.ts` (`divine.perceive.*`, `divine.relay.*`)
* Constants: `src/engine/ruins/constants.ts` (`PERCEIVE_*`, `RELAY_*`, `ADJACENCY_GATE_HEX_RADIUS`)
* Traces: `ruins.divine_mark_discovered` (category in `src/types/trace.ts`)
* Tests: `src/engine/ruins/__tests__/perceiveRelay.test.ts` (20 tests)

**Ruins Quest Hooks — Phase 6.655 (THR-156):**

Channel 6 of Narrative Gravity: when a ruin accumulates `evidenceStrength ≥ CLUE_QUEST_THRESHOLD` (sum of non-consumed `knows_clue_of` edge magnitudes) AND an Adventurer's Guild hall is within `GUILD_QUEST_RADIUS` hexes, the Guild issues a quest hook toast and boosts matching encounter template priority for eligible members.

| Surface | Wiring |
|---------|--------|
| Orchestrator phase | Phase 6.655 `phaseRuinQuestHooks` — runs every `RUIN_QUEST_GENERATION_INTERVAL_TICKS` ticks (every 12 ticks by default) |
| Graph mutations | `graph.updateNode(ruinId, { properties: { ...props, questHookPostedTick: tick, questHookTemplateId } })` — stamped directly on the ruin location node |
| Priority boost consumer | `generateFactionQuestCandidates` in `factionQuestGeneration.ts` — `getActiveRuinQuestTemplateIds()` reads `questHookPostedTick` within cooldown window and adds `QUEST_HOOK_PRIORITY_BOOST = 4.0` for Adventurer's Guild members |
| Player UI | `quest_hook_issued` `TickEvent` with `notification: { channel: 'toast' }` → `ToastStack` (prose from `buildQuestHookMessage`, 5 sphere archetypes). No Guild quest panel — deferred to THR-180. |
| Trace categories | `ruins.quest_hook_issued` (on successful issue), `ruins.quest_hook_suppressed` (on no-guild-in-radius skip) |
| Debug visibility | Trace feed; ruin node properties `questHookPostedTick` + `questHookTemplateId` visible in RuinsDebugTab |
| Duplicate prevention | `QUEST_HOOK_COOLDOWN_TICKS = 60` — ruin skipped if `tick - questHookPostedTick < 60` |

**Constants** (all in `src/engine/ruins/constants.ts`): `CLUE_QUEST_THRESHOLD` (0.5), `GUILD_QUEST_RADIUS` (5 hexes), `QUEST_HOOK_COOLDOWN_TICKS` (60), `QUEST_HOOK_PRIORITY_BOOST` (4.0).

**Verification pointers:**
* Phase: `src/engine/ruins/questHooks.ts` — `phaseRuinQuestHooks`, `getEvidenceStrength`, `selectQuestTemplateForRuin`, `buildQuestHookMessage`
* Priority boost: `src/engine/factionQuestGeneration.ts` — `getActiveRuinQuestTemplateIds`, `questHookBoost` in `generateFactionQuestCandidates`
* Traces: `ruins.quest_hook_issued`, `ruins.quest_hook_suppressed` in `src/types/trace.ts`
* Tests: `src/engine/ruins/__tests__/questHooks.test.ts` (20 tests)
* Deferral: THR-180 (Guild quest panel in LocationDetail view)

---

## Faction Agency — Phase 6.652 (THR-29)

> **Last updated:** 2026-04-19 (THR-29 — Faction Agency complete)

| Capability | Orchestrator wiring | Graph mutations | Traces emitted | Debug visibility | Player-facing UI |
|---|---|---|---|---|---|
| Action evaluation | Phase 6.652 `phaseFactionActions` — runs every `FACTION_ACTION_INTERVAL=8` ticks | `factionActionHistory` + `lastActionTick` on faction node | `faction_action` category per action + `skipped_no_eligible` | Trace feed | None (background) |
| Commission Quest | `executeCommissionQuest` | Creates `event` node (nodeSubtype:`faction_quest`) + `commissions` edge | `faction_action` (executed) | Trace feed | FactionSheet → Recent Actions |
| Declare Rivalry | `executeDeclareRivalry` | Creates/updates `relates_to` edge (isRival:true, sentiment:-0.8) | `faction_action` (executed) | Trace feed | FactionSheet → Relations (Rival badge) |
| Propose Alliance | `executeProposeAlliance` | Creates/updates `relates_to` edge (isAlliance:true, sentiment:0.8) | `faction_action` (executed) | Trace feed | FactionSheet → Relations (Allied badge) |
| Excommunicate | `executeExcommunicate` | Removes `member_of` edge; creates `hostile_to` edge; adds `cast_out` condition; splashes reputation to other memberships | `faction_action` (executed) | Trace feed | FactionSheet → Recent Actions |
| Hold Conclave | `executeHoldConclave` | Sets `activeConclave` property on faction node; resolves after 3 ticks → `dissenting`/`vindicated` conditions on participants | `faction_action` (executed) + conclave resolution | Trace feed | FactionSheet → Current Agenda (conclave block) |
| Issue Bounty | `executeIssueBounty` | Creates `event` node (nodeSubtype:`bounty`) + `issues` edge; adds `hunted` condition to target | `faction_action` (executed) | Trace feed | FactionSheet → Recent Actions |
| Conclave advancement | Every tick (off-interval) via `advanceAllConclaves` | Decrements `ticksRemaining`; clears on resolution | `faction_action` on resolution | Trace feed | FactionSheet → Current Agenda |
| Divine Edict | `action.divine-edict` — ascendant targets faction node | Sets `conclaveLeverageShift: 0.3` on faction | None (via GraphOp) | ActionDrawer | ActionDrawer (star reach, 18 essence) |
| Anoint Champion | `action.anoint-champion` — ascendant targets agent | Sets `championBlessing` property (15 ticks, 2× rep multiplier, 0.2 score boost) | None (via GraphOp) | ActionDrawer | ActionDrawer (iron reach, 14 essence) |
| **Stir Dissent (THR-400)** | `action.faction.stir_dissent` — ascendant targets faction; intercepted as `'faction_verb'` GraphOp in `unifiedActionResolution.ts`, dispatched to `applyStirDissent` in `factionGovernanceVerbs.ts` | Bumps `dissentLevel` (+0.25, clamped to 1.0) on faction node | `faction_stir_dissent` | DebugPanel `FactionDebugContent` shows `dissentLevel` | ActionDrawer (shadow reach, 8 essence). FactionSheet: ambient dissent shadow under CoatOfArms scales with `dissentLevel` (0..1 → 0..22 px alpha) |
| **Whisper to Leader (THR-400)** | `action.faction.whisper_leader` — `applyWhisperLeader` resolves leader via `getFactionLeaderId`; gated on `hasLeader: true` (drawer hidden when no leader) | Applies `divine_whisper_pending` condition to leader, sets `divineWhisperPreferredPole` + `divineWhisperExpiresTick`. Plants `faction.encounter.leader_at_a_crossroads` seed | `faction_whisper_leader` | DebugPanel exposes `hasLeader` flag | ActionDrawer (heart reach, 6 essence) |
| **Recover Doctrine (THR-400)** | `action.faction.recover_doctrine` — `applyRecoverDoctrine` consumes a `clueType: 'recovered_doctrine'` clue node tagged for the faction's `factionDefId`; gated on `hasRecoverableDoctrine: true` | Removes clue node; sets `recoveredDoctrineId` + `recoveredDoctrineExpiresTick` on faction; optionally merges clue's `realignment` into `reputationAlignment`. Plants `faction.encounter.doctrine_surfaces` seed on champion (or leader) | `faction_recover_doctrine` | DebugPanel exposes `recoveredDoctrineId` + `hasRecoverableDoctrine` | ActionDrawer (star reach, 8 essence). FactionSheet: ✦ glyph next to faction name when `recoveredDoctrineId` set |
| **Surface a Doubter (THR-400)** | `action.faction.surface_doubter` — `applySurfaceDoubter` resolves doubter via `getDoubterCandidate` (axiological-misalignment vs faction `reputationAlignment` ≥ 0.35); gated on `hasDoubter: true` | Applies `surfaced_by_divine_attention` condition to doubter; bumps faction `dissentLevel` by +0.10. Plants `faction.encounter.doubter_chooses` seed | `faction_surface_doubter` | DebugPanel exposes `hasDoubter` + `doubterId` + surfaced doubters list | ActionDrawer (eye reach, 8 essence) |
| **Kindle a Calling (THR-433)** | `action.faction.kindle_a_calling` — ascendant targets faction; gated on `hasLeader: true`. Intercepted as `faction_verb` GraphOp, dispatched to `applyKindleACalling` in `factionGovernanceVerbs.ts`. Four-signal bias resolver (`computeKindleBias`): member axiological pulls (normalized), leader bias (2× weight), doctrine pressure (`recoveredDoctrineId` → cultural/divine), recent dissent (>=0.35 → defensive). Bias added to `scoreEligibleAmbitions` weights; `KINDLE_CALLING_ESSENCE_SHARPENING=1.4` scales; seeded PRNG draws one weighted candidate. `getArmyLockedAmbitionId` refuses overwrite when any army member `pursues` the active ambition (`lockedByArmy` trace branch). | Replaces faction's `pursues` edge + ambition node (new `amb_${factionId}_${tick}_kindled` with `kindled: true`). Plants `faction.encounter.calling_named` (2 steps, 2 aftermath reactions: commit/stall) on leader. Sets `kindled_calling_pending` condition on leader for 18 ticks + `kindledCallingAmbitionType` property | `faction_kindle_calling` | DebugPanel trace stream shows category + bias-weighted candidate list. `FactionNetworkAmbition.kindled` flag exposed | ActionDrawer (heart reach, 10 essence). FactionSheet: ▲ glyph + "kindled" sublabel next to ambition name when `summary.activeAmbition.kindled` is true |
| **Dissent decay + threshold (THR-400)** | Top of `phaseFactionActions` — runs every tick, before the FACTION_ACTION_INTERVAL gate. Helper: `tickFactionGovernance` | Per faction: decays `dissentLevel` by `DISSENT_DECAY_PER_TICK = 0.005`; when `dissentLevel >= 0.6`, plants `faction.encounter.dissent_surfaces` seed on most-threaded non-leader member (fall through to leader, then highest-rank misaligned member) and resets to 0. Also ticks down expired `divine_whisper_pending` conditions, and calls `refreshFactionDerivedFlags` to set `hasLeader`/`hasDoubter`/`doubterId`/`hasRecoverableDoctrine` for drawer gating | `faction_stir_dissent` (on threshold cross) | DebugPanel `dissentLevel` + flags | None (background; ambient indicator on FactionSheet reflects state) |

**Tunables** (all in `src/types/factionAction.ts`): `FACTION_ACTION_INTERVAL` (8), `FACTION_ACTION_COOLDOWN` (5), `COMMISSION_QUEST_COST` (5), `RIVALRY_SENTIMENT_THRESHOLD` (-0.3), `ALLIANCE_SENTIMENT_THRESHOLD` (0.3), `BOUNTY_COST` (12), `CONCLAVE_BASE_FREQUENCY_TICKS` (180), `EXCOMMUNICATION_REPUTATION_SPLASH` (0.1), `DIVINE_EDICT_ESSENCE_COST` (18), `ANOINT_CHAMPION_ESSENCE_COST` (14).

**Verification pointers:**
* Types + constants: `src/types/factionAction.ts`
* Phase: `src/engine/phaseFactionActions.ts` — Phase 6.652 in orchestrator
* Encounter templates: `src/data/faction-action-encounters.ts` (8 templates registered in `unified-action-templates.ts`)
* Divine actions: `src/data/unified-action-templates.ts` — `action.divine-edict`, `action.anoint-champion`
* UI: `src/components/Game/FactionSheet.tsx` — Recent Actions, conclave indicator, rival/alliance badges
* `factionNetwork.ts` — `FactionNetworkRelation.isRival/isAlliance`
* Tests: `src/engine/__tests__/phaseFactionActions.test.ts` (10 tests)

**Intelligence consumption pathway (THR-113, 2026-04-17):**

Intelligence records are **granted** by aftermath reactions (`kind: 'intelligence'`, trace: `intelligence_granted`). THR-113 closes the loop by **consuming** them in three sites. All three emit `intelligence_referenced` with a `referencedBy` discriminator.

| Consumption hook | Module | Fires from | `referencedBy` | Effect on state |
|------------------|--------|-----------|---------------|-----------------|
| Scoring boost | `findActionableIntelligence` + `emitIntelligenceReferenced` | `scoreAndSelect` in `encounterScoring.ts`; called from Phase 2b `phaseAgentDecision` | `scoring_boost` | `finalScore` += `INTEL_SCORING_BONUS` (0.25); exposed as `ScoredCandidate.intelBonus` |
| Prose enrichment | `enrichProse` (intel placeholder loop) | `proseEnrichment.ts`; called from encounter stage adapters | `prose_enrichment` | None — prose text only; dedup Set ensures one trace per unique recordId per call |
| Resolution match | `observeResolutionIntelligence` | `GameView.tsx:1935` — after `consumeMatchingMarks` on encounter/action resolution | `resolution_match` | None — passive observation; audit trace only |
| Difficulty modifier | `findActionableIntelligence` + `emitIntelligenceReferenced` | `unifiedActionResolution.ts` — per `intel_sensitive` step | `difficulty_modifier` | Effective difficulty − `INTEL_DIFFICULTY_BONUS` (−0.10) scaled by reliability (THR-140) |
| **Aftermath prose (THR-139)** | `applyEncounterAftermathReaction` case `'intel_referenced_prose'` (uses `findIntelReferencedProseMatch` + `pickIntelReferencedProseLine`) | `encounterAftermath.ts`; called from `GameView.tsx:1920` on encounter resolution | `aftermath_prose` | Appends a `narrative` `TickEvent` to `recentEvents` and `tickEvents`; significance picked by reliability band |

**Placeholder vocabulary:** `{intel:<category>}` (label), `{intel:<category>.detail}`, `{intel:<category>.reliability}` (descriptor: reliable/uncertain/dubious), `{?knows_<category>}…{/knows_<category>}`, `{?no_<category>}…{/no_<category>}`. Silent strip on missing record (NFP #4).

**Tunables:** `INTEL_SCORING_BONUS` (`agent-behavior-constants.ts`, default 0.25); `RELIABILITY_THRESHOLD_RELIABLE` (0.7), `RELIABILITY_THRESHOLD_UNCERTAIN` (0.4), `INTEL_RESOLUTION_MATCH_REGIONS` (true), `INTEL_CATEGORIES`, `TEMPLATE_CATEGORY_MATCHERS` (all in `intelligence.ts`); decay: `INTEL_RELIABILITY_DECAY_PER_TICK` (0.001, ~12%/game day), `INTEL_RELIABILITY_FLOOR` (0.0), `INTEL_RELIABILITY_GRACE_TICKS` (20), `INTEL_DECAY_EVENT_SIGNIFICANCE` (0.25) (all in `intelligence.ts`, THR-137); aftermath prose: `INTEL_REFERENCED_PROSE_SIGNIFICANCE_RELIABLE` (0.6) / `_UNCERTAIN` (0.45) / `_DUBIOUS` (0.3), `INTEL_REFERENCED_PROSE_DUBIOUS_FIRES` (true) (all in `agent-behavior-constants.ts`, THR-139).

**Aftermath prose (THR-139, 2026-05-08):** Adds an authored `intel_referenced_prose` aftermath-reaction effect kind. When the actor (or `targetAgentId`) holds an `IntelligenceRecord` matching the effect's `category` AND the action's encounter context (locationId / region / templateId), the matched record's reliability band picks one of three authored prose variants and appends a `TickEvent` of `type: 'narrative'` to `recentEvents` / `tickEvents`. Helpers `findIntelReferencedProseMatch` + `pickIntelReferencedProseLine` exported from `intelligence.ts`. The 72-line shared prose pack is in `src/data/intelligence-referenced-prose.ts` (6 categories × 3 bands × 4 lines). 3 pilot reactions wired in `arcane-circle-encounter-content.ts` (`agent_network`), `builders-fellowship-encounter-content.ts` (`political_secret`), and `encounter-anomaly-content.ts` (`cultural_knowledge`). Records are read, never consumed; effect is fail-soft (no_target_agent / no_matching_record / skipped_dubious / skipped_empty_prose all emit a single `encounter_aftermath_effect` skip trace and continue).

**Intelligence decay (THR-137, 2026-04-18):** Records persist indefinitely but `reliability` decays linearly after `INTEL_RELIABILITY_GRACE_TICKS` ticks. Floor is `INTEL_RELIABILITY_FLOOR` (0.0) — records remain queryable at floor (dubious-band intel is still knowledge). When reliability crosses a descriptor threshold (`reliable→uncertain` or `uncertain→dubious`), a low-significance `intelligence_decay` `TickEvent` is emitted with prose from `src/data/intelligence-staleness-prose.ts`. Trace: `intelligence_decayed` with before/after/delta/crossedThreshold fields. Decay prose references `{agent.name}` and `{intel.label}` resolved at emission. Shared `reliabilityBand()` helper exported from `intelligence.ts` — used by decay phase, `reliabilityDescriptor()`, and any UI component displaying per-record bands.

**Player-facing display (THR-141, 2026-04-17):**

`AgentIntelligencePanel` surfaces `IntelligenceRecord[]` inside the agent detail view (`ThreadDetailView`). Fog-of-war gate: only renders for `node.tier >= INTEL_PANEL_FOG_MIN_TIER` (1). Sort: reliable → uncertain → dubious; within tier, most recent first. Truncates at `INTEL_PANEL_MAX_RECORDS = 24`. Empty state: "Knows nothing of consequence."

| Surface | Module | Data source | Gate | Debug visibility |
|---------|--------|------------|------|-----------------|
| `AgentIntelligencePanel` | `src/components/Game/AgentIntelligencePanel.tsx` | `gameState.intelligenceRecords` via `ThreadDetailView.intelligenceRecords?` | `node.tier >= 1` | Developer trace feed (`intelligence_granted` / `intelligence_referenced`) is the parallel debug surface |
| `buildIntelligenceDisplay` helper | `src/engine/intelligence.ts` | `readonly IntelligenceRecord[]` + `WorldGraph` + `currentTick` | — | Pure function; tested in `intelligenceDisplay.test.ts` |
| GameView wire | `src/components/Game/GameView.tsx:3061` | `gameState.intelligenceRecords ?? []` | `selectedThreadNode.category === 'agent'` | — |

**Verification pointers:**

* Consumption helpers: `src/engine/intelligence.ts` (`buildIntelligenceView`, `findActionableIntelligence`, `reliabilityDescriptor`, `emitIntelligenceReferenced`, `observeResolutionIntelligence`, `buildIntelligenceDisplay`)
* Scoring site: `src/engine/encounterScoring.ts` — `intelligenceRecords` as 11th arg; `ScoredCandidate.intelBonus`
* Prose site: `src/engine/proseEnrichment.ts` — `NarrativeContext.intelligence?: IntelligenceView`, intel placeholder loop, `{?knows_*}` / `{?no_*}` conditionals in `resolveConditionals`
* Resolution site: `src/components/Game/GameView.tsx` — `observeResolutionIntelligence(afterMarks, activeAction, reaction, prev.tick)` after `consumeMatchingMarks`
* Player display site: `src/components/Game/AgentIntelligencePanel.tsx` — rendered inside `ThreadDetailView` agent body; fog-gated by `node.tier`
* Adapter wiring: `buildUnifiedEncounterStageModel.ts` and `buildSimpleEncounterStageModel.ts` both thread `gameState` and `tick` into `gatherNarrativeContext` so enrichment has access to the agent's records
* Tests: `src/engine/__tests__/intelligenceView.test.ts` (18), `src/engine/__tests__/intelligenceConsumption.test.ts` (5), `src/engine/__tests__/contracts/intel-consumption-liveness.contract.test.ts` (4), `src/engine/__tests__/intelligenceDisplay.test.ts` (22), `src/components/Game/__tests__/AgentIntelligencePanel.test.tsx` (9), 3 new cases in `ThreadDetailView.test.tsx`, plus 9 new cases in `proseEnrichment.test.ts`; decay: `src/engine/__tests__/phaseIntelligenceDecay.test.ts` (8 unit), `src/engine/__tests__/contracts/intel-decay-band-agreement.contract.test.ts` (1 contract), + integration extension to `intelligenceConsumption.test.ts` (THR-137)

**Multi-target aftermath effects (THR-114, 2026-04-17):**

`applyEncounterAftermathReaction` now accepts effects directed at agents, factions, or sublocations (not just the action actor). Called from `GameView.tsx` on player-side encounter resolution — same call site as before.

| New effect kind | Target kinds | Graph mutation | `mutationSummary` flag |
|----------------|-------------|---------------|----------------------|
| `reputation_set` | `agent`, `faction` | `node.properties.reputationScore = clamped(value)` | `touchedWorld` |
| `apply_condition` | `agent`, `faction`, `sublocation` | `graph.addEdge(has_trait)` with appliedAt/durationTicks/intensity | `touchedStructure` |
| `remove_condition` | `agent`, `faction`, `sublocation` | `graph.removeEdge(has_trait)` oldest or all | `touchedStructure` |
| `recent_event` + `witnessAgentIds` | — (fan-out) | `TickEvent.witnessAgentIds` set | — |

**Condition attachment + wound promotion (THR-117, 2026-04-17):**

`condition_attachment` aftermath effect kind — applies any condition trait (wound, disease, curse, blessing, bestowed) by template ID with automatic default-duration lookup. When the template is `trait.condition.wounded` and the target is the action actor, surfaces a `woundApplied` signal that drives mid-encounter tier promotion.

| Effect kind | Orchestrator phase | UI surface | GameState field | Traces | Debug visibility | Prose pipeline |
|---|---|---|---|---|---|---|
| `condition_attachment` | Plant: `applyEncounterAftermathReaction` (called from `GameView.tsx` on player-side resolution). Overflow: Phase 2a.85 `phaseSlotCaps`. Promotion: `checkMidEncounterPromotion` in `GameView.tsx` (same tick). | ProwessTab, AttachmentsTab, AgentDetailPanel — existing views; no new UI. | `state.graph` `has_trait` edges (same as `apply_condition`) | `encounter_aftermath_effect` (`effectKind: 'condition_attachment'`); `condition_applied` (downstream per stack). Overflow pipeline: `condition_overflow`. | Existing DebugPanel trace feed — `encounter_aftermath_effect` + `condition_applied` visible. | N/A — prose authors compose `recent_event` aftermath effects for narrative; the condition itself surfaces via ProwessTab/AttachmentsTab, not inline prose. |

**Verification pointers:**
* Effect executor: `src/engine/encounterAftermath.ts` — `condition_attachment` case in `applyEncounterAftermathReaction`
* Promotion wiring: `src/components/Game/GameView.tsx` — `reactionMutations.woundApplied` → `checkMidEncounterPromotion`
* Overflow pipeline: `src/engine/conditionOverflow.ts` → `phaseSlotCaps` in `orchestrator.ts`
* Tests: `src/engine/__tests__/conditionAttachment.test.ts` (11 tests: fail-soft, woundApplied signal, edge creation, traces)

**StrictMode-safe mutation pattern:** `applyEncounterAftermathReaction` returns `{ state, mutationSummary }`. Caller (`GameView.tsx`) calls `touchStructure(runtime)` / `touchWorld(runtime)` AFTER `setGameState` resolves — never inside the updater — to avoid double-increment in React StrictMode.

**World-shaping aftermath effects (THR-115, 2026-04-17):**

Eight new `EncounterAftermathReactionEffect` kinds that change world topology from encounter aftermath. All handled in `applyEncounterAftermathReaction` (`src/engine/encounterAftermath.ts`). All fail-soft: missing nodes/edges emit a failure trace and break without throwing.

| Effect kind | What it mutates | `touchWorld` | `touchStructure` | Trace category |
|---|---|---|---|---|
| `spawn_artifact` | Creates `artifact` graph node; adds `possesses`, `bonded_to`, and/or `contains` edges; chronicles creation event | ✅ | ✅ | `artifact_spawned` |
| `emit_omen` | Appends `EmittedOmen` to `GameState.emittedOmens`; enforces `MAX_EMITTED_OMENS_CAP=10` (oldest evicted) | — | — | `omen_emitted` |
| `faction_splinter` | Creates new faction node; migrates selected members (6 strategies); adds `resentful` edge | ✅ | ✅ | `faction_splintered` |
| `faction_absorb` | Migrates members to absorbing faction (3 rep-merge strategies); marks source faction dissolved | ✅ | ✅ | `faction_absorbed` |
| `faction_dissolve` | Marks faction node dissolved; disperses members to independent or `drift_to_rival` | ✅ | ✅ | `faction_dissolved` |
| `faction_declare_war` | Creates bidirectional `war_sentiment` edges between two factions | ✅ | ✅ | `faction_war_declared` |
| `faction_force_peace` | Creates bidirectional `treaty` edges (sentiment clamped above floor) | ✅ | ✅ | `faction_peace_forced` |

**Emitted omen lifecycle:**
- **Plant:** `emit_omen` effect in `applyEncounterAftermathReaction` → appended to `state.emittedOmens`
- **Consume (bias):** `deriveEmittedOmenEncounterBias(state.emittedOmens, hexCol, hexRow)` called from Phase 2b `phaseAgentDecision` — adds to `combinedBias[encounterType]`
- **Decay:** Phase 1.7a `phaseEmittedOmenDecay` — removes omens where `tick > expiresTick`, emits `omen_decayed` trace

**EmittedOmen scope kinds:** `global` (all hexes), `regional` (named region, currently treated as global pending THR-116), `local` (radius in hex distance — uses canonical `hexDistance()` from `src/lib/hexMath.ts`).

**Member selection strategies (faction_splinter / faction_absorb):** `all_matching_trait`, `within_radius`, `by_reputation_below`, `by_reputation_above`, `explicit_ids`, `random_sample`. All use `mulberry32` seeded from `state.seed + tick * 31337 + encounterId.charCodeAt(0)`.

**Reputation merge strategies (faction_absorb):** `max`, `sum_clamped`, `weighted_avg`.

**Key constants** (all in `src/engine/encounterAftermath.ts` or `src/engine/phaseOmenAgenda.ts`):
- `EMITTED_OMEN_DEFAULT_DURATION_TICKS = 48` (4 game days)
- `MAX_EMITTED_OMENS_CAP = 10` (oldest evicted when cap exceeded)
- `EMITTED_OMEN_ENCOUNTER_BIAS_MAX = 0.4` (per-type bias cap)

**No dedicated player UI** — emitted omens are engine-only. DebugPanel feed shows `omen_emitted` / `omen_decayed` traces. Faction topology changes are visible in FactionSheet. Spawned artifacts appear in agent attachment views.

**Tests:** `src/engine/__tests__/encounterAftermath.worldShaping.test.ts` (40 tests across all 8 effects + decay + bias + fail-soft).

**Verification pointers:**
* Target resolution: `src/engine/encounterAftermath.ts` — `resolveAftermathTarget()`
* New effect handlers: `apply_condition` (~line 606), `remove_condition` (~line 702), `reputation_set` (~line 262)
* Call site: `src/components/Game/GameView.tsx` — `pendingAftermathMutations` + post-`setGameState` touch calls
* Trace definitions: `src/types/trace.ts` — `aftermath_target_resolved`, `aftermath_target_invalid`, `faction_reputation_changed`, `reputation_set_applied`, `condition_applied`, `condition_removed`
* Example content: `src/data/encounters/examples/` — `example.betrayal_multi_target.ts`, `example.council_disowns.ts`, `example.shrine_consecration.ts`
* Tests: `src/engine/__tests__/encounterAftermath-multi-target.test.ts` (35+ tests)

**Branch-aware aftermath selection (THR-108, 2026-04-29):**

`resolveAftermathVariant()` in `unifiedActionResolution.ts` selects the authored `AftermathVariant` for a `UnifiedActionTemplate` encounter based on the player's choice at `aftermathConfig.branchOnStep`. Called at the end of encounter resolution (Phase 2a), before `aftermathSummary` is assembled.

| Surface | Wiring |
|---------|--------|
| Variant selection | `resolveAftermathVariant(template, action.choiceHistory)` reads `config.branchOnStep`, finds the matching `EncounterChoiceMemory` entry, returns `config.variants[choiceId]` or `config.fallback` |
| Aftermath assembly | Result folded into `EncounterAftermathSummary` at `unifiedActionResolution.ts:~1422`: authored `overview` replaces computed summary; `variant.changes` appended to mechanical changes; `variant.reactions` replaces default reaction set; `variant.reactionPrompt` used when present |
| `aftermathSummary` consumer | `buildUnifiedEncounterStageModel.ts:353` reads `activeAction.aftermathSummary` to build the aftermath stage for `EncounterVeil` |
| Player reactions UI | `EncounterVeil` aftermath stage renders `reactions[]` from `aftermathSummary` — player selects one, `GameView.tsx` calls `applyEncounterAftermathReaction` on pick |
| No `aftermathConfig` path | If `template.aftermathConfig` is absent (linear/simple encounters), `resolveAftermathVariant` returns `undefined` and overview + reactions are computed from mechanical changes |

**Key invariant:** `branchOnStep` must reference a step index containing an `ActionStepBranch`. A wrong index falls through to `config.fallback` silently.

**Types:** `BranchAwareAftermathConfig` / `AftermathVariant` — `src/types/unifiedAction.ts:545`. Resolver — `src/engine/unifiedActionResolution.ts:400`. Tests — `src/engine/__tests__/actionStepBranch.test.ts`.

---

**Causation edges + conditional aftermath (THR-116, 2026-04-18):**

| Surface | Wiring |
|---------|--------|
| `when` gate | `encounterAftermath.ts` evaluates `effect.when` via `evaluatePredicate(buildPredicateContext(...))` before every effect dispatch. Emits `aftermath_effect_skipped_by_when` / `aftermath_effect_when_passed` traces. |
| Thread mutations | `thread_strengthen/weaken/break/branch` cases in `applyEncounterAftermathReaction`. Strength clamped [0,1] via `THREAD_STRENGTH_MAX/MIN`. `thread_break` emits `TickEvent`. `thread_branch` wraps `addEdge` in try/catch for duplicate-edge safety. |
| ThreadsPanel UI | `threadStrength` field on `ThreadedNodeBase` (from `edge.properties.strength`). CSS-transitioned bar renders when `threadStrength < 1.0`. |
| Causation edges | THR-143: `createUnifiedActionEventNode()` in `encounterEventNode.ts` creates `event` nodes for unified-action steps. `executeStepResult` in `unifiedActionResolution.ts` emits `caused_by` edge on first step when `pendingCausationSourceEventId` is set. `applyEncounterAftermathReaction` threads `action.eventNodeId` into seeds as `sourceEventNodeId`. `evaluateEncounterSeeds` propagates to spawned action as `pendingCausationSourceEventId`. |
| Prose placeholders | `{cause:label}` / `{cause:ticksAgo}` resolved in `enrichProse` from `ctx.cause`. |
| Trace categories | `causation_edge_created`, `causation_edge_creation_skipped`, `aftermath_effect_skipped_by_when`, `aftermath_effect_when_passed`, `thread_mutation_applied`, `thread_mutation_skipped` |
| Tests | `encounterAftermath.test.ts` (tests 3-10), `encounterSeeding.test.ts` (THR-143 causation contract tests 1-4), `encounterEventNode.test.ts` (`createUnifiedActionEventNode` tests 1-4) |

**Component-library foundation seams (2026-04-03):**

| Primitive / shell | Runtime seam | Current callers |
|------------------|-------------|-----------------|
| `test_shaper` | `effectResolver.collectTestShapers()` → `ResolutionInput.testShapers` → `resolutionService.resolveAction()` | `encounter.ts`, `unifiedActionResolution.ts` |
| `prevent_loss` (`quintessence`) | `effectResolver.collectPreventLossEffects()` → quintessence delta adjustment before clamp/regen | `phaseQuintessence.ts` |
| `content_grant` | reward-time template grant selection and recursive instantiation | `rewardPool.ts` |
| immediate `service` reward shell | `rewardMode: 'service'` resolves authored effects on acquisition instead of persisting a shell item | `rewardPool.ts`, `orchestrator.ts`, `unifiedActionResolution.ts` |

**Verification:** `grep -c 'phase[A-Z]' src/engine/orchestrator.ts` — count should match this table.

**Ambient sound wiring (2026-04-06):**

| Module | Integration surface | Notes |
|--------|-------------------|-------|
| `BackgroundChannel` | `useAmbientContext` hook mounted in `GameView.tsx` | Not orchestrator-driven; driven by React state (camera hex, active encounter, active location) |
| `MusicChannel` | `useAmbientContext` hook mounted in `GameView.tsx` | Encounter track swap triggered by encounter notification state |
| `UiChannel` | Fire-and-forget; called at SFX trigger sites | No persistent state; no orchestrator phase |
| `AudioMaster` | `useAmbientContext` — exposes global mute/unmute | Consumed by SettingsPanel master mute toggle |
| `useAmbientContext` | Mounted in `GameView.tsx`; receives `centerHex`, `activeEncounter`, `activeLocation` | Drives all three channel instances |

---

### 2. GameView Modal & Overlay Rendering (`src/components/Game/GameView.tsx`)

Every player-facing modal or overlay must appear in the GameView JSX return block. An import without a `<Component />` element means the feature is invisible.

**Currently rendered:**

| Component | Purpose |
|-----------|---------|
| `NarrativeLog` | Event feed overlay |
| `ToastStack` | Transient notifications |
| `HexMapV2` | Main Three.js hex canvas |
| `AscendantBar` | Persistent 360px left rail — identity+quintessence, essence, actions, mandate, hooks (THR-184). Supersedes IdentityChip, AvatarHUD, EssencePanel, MandateTracker. |
| `AvatarHUD` | Move/action/scry buttons — superseded by AscendantBar (THR-184) |
| `AgendaPicker` | Action selection overlay |
| `InterventionConfirm` | Intervention confirmation popover |
| `HexBreadcrumb` | Hex zoom breadcrumb |
| `HexSidebar` | Hex detail sidebar |
| `HexChronicle` | Hex event chronicle |
| `ChroniclePanel` | Dual-voice chronicle display with Poet/Witness/Both toggle; wired in right sidebar when `chronicleEntries.length > 0` (THR-155) |
| `ChronicleEntryCard` | Per-entry render of `poetProse` + `witnessFacts`; migration shim treats legacy `prose` as witness bullet (THR-155) |
| `LocationView` | Location detail view |
| `FactionSheet` | Faction network, leadership, holdings, and faction-targeted action surface |
| `ActionDrawer` (×2) | Agent & non-agent intervention |
| `DoomClockDetail` | Doom chapter timeline and resolved doom-card fallout |
| `MandateDetail` | Mandate sphere-growth detail and omen checkpoints |
| `DebugPanel` | Debug trace sidebar |

**All modals connected (TB-040, 2026-03-26):**

| Component | Status |
|-----------|--------|
| `MeetingEncounterModal` | ✅ Rendered in JSX (TB-035 Phase 1) |
| `JourneyVignetteModal` | ✅ Rendered in JSX (TB-035 Phase 2) |
| `EncounterVignetteModal` | ✅ Rendered in JSX (TB-035 Phase 4) |

**Verification:** For each modal/overlay in your feature, confirm `<ComponentName` appears in the JSX return block of GameView (not just in the imports).

## UI Pillar Verification (THR-266, 2026-05-08)

A UI surface that compiles + passes snapshot tests can still ship invisibly broken — off-viewport at 1920×1080, z-index buried, console-error spammy, or rendering nothing on a WebGL canvas Playwright cannot see. This section names the tool-of-record per surface category and the closeout artifact required for sign-off.

### Tool-of-record by surface category

| Surface category | Verification tool | Why |
|------------------|-------------------|-----|
| DOM components (panels, modals, lists, forms) | Playwright (`mcp__playwright__*`) | Fast, scriptable, reads accessibility tree; sees DOM truth. |
| HexMapV2 / Three.js / any `<canvas>` content | Claude-in-Chrome (`mcp__Claude_in_Chrome__*`) | Playwright snapshots render `<canvas>` as a blank box. Chrome MCP `computer` `action: "screenshot"` captures actual pixels. |
| Mixed (DOM + canvas) | Both, in this order: Chrome MCP for canvas pixels, Playwright for console + DOM-side state | Don't paper over a canvas regression by only checking the surrounding DOM. |
| State introspection / agent-driven flows | `window.__DEBUG.*` (see CLAUDE.md §Debug Bridge) | Direct read of game state without UI traversal. Required to assert "the wiring works", not just "the page renders". |

### Closeout artifact contract

Every UI-pillar PR (or completion Linear comment) embeds the following three pieces, in this order:

1. **Screenshot** — at 1920×1080 (preview_resize(1920, 1080) for Playwright; `mcp__Claude_in_Chrome__resize_window` for Chrome MCP). Pass `save_to_disk: true` and link the resulting file, or paste the inline image.
2. **Console output** — errors + warnings, filtered. Empty output is valid; state `(no errors or warnings)`.
3. **`__DEBUG` assertion** — one or more queries proving the new state field, derived value, or trace category is reachable.

The artifact lives in either the closing commit body or the Linear completion comment. Snapshot test coverage *complements* the artifact; it does not replace it.

### Exemption clause

Types-only refactors or render-pure pruning verified by snapshot + typecheck may opt out by stating `Browser-verify exempt: <reason>` in the commit body. The reviewer is responsible for confirming the exemption holds.

### Examples

- **DOM-only example (encounter choice card prop change).** Run `preview_resize(1920, 1080)` → `preview_screenshot` of EncounterScreen. `browser_console_messages` filtered to errors. `window.__DEBUG.gotoAgent('Eira')` to confirm the choice card mounts on the threaded agent. Three artifacts in commit body.
- **Canvas example (HexMapV2 signifier change).** `mcp__Claude_in_Chrome__resize_window(1920, 1080)` → `tabs_create_mcp` → `navigate('http://localhost:5173/?view=game&seeded&size=medium')` → `computer({ action: 'screenshot', save_to_disk: true })`. `read_console_messages` filtered. `window.__DEBUG.gotoAgent(...)` to confirm camera move. Playwright is *not* used because canvas content would render blank.
- **Mixed example (encounter UI Phase D1 ThreadOverlay).** Chrome MCP screenshot for the SVG overlay over the canvas + Playwright `browser_console_messages` for state. `window.__DEBUG.fireAction(...)` to confirm trigger.

### 3. GameState Consumption (`src/types/gameState.ts` → UI components)

Engine phases write to GameState fields. UI components must read them. An engine output that no component reads is invisible to the player.

**Fields requiring UI consumers:**

| GameState field | Producing phase | Current UI consumer | Status |
|----------------|----------------|-------------------|--------|
| `recentEvents` | Multiple phases | `NarrativeLog` | ✅ Connected |
| `pendingVignettes` | `phaseJourneyBeat` | `JourneyVignetteModal` | ✅ Connected |
| `encounterNotifications` | `phaseEncounterVisibility` | `useEncounterNotifications` → `ToastStack` | ✅ Connected (TB-040) |
| `doomClock.resolvedEvents` | `phaseDoom` | `DoomClockDetail` | ✅ Connected |
| `doomClock.counterOmens` / `doomClock.nextEscalationSeverityModifier` | `phaseMandate` + `phaseDoom` | `DoomBar`, `DoomClockDetail`, `MandateTracker`, `MandateDetail` | ✅ Connected |
| `doomIdentityMatrix` | `gameInit` (once) | `DebugTabContent` (milestone display), `buildUnifiedEncounterStageModel` (prose), `GameView` (pass-through) | ✅ Connected (THR-21) |
| `mandateState.primaryDelta` / `secondaryDelta` / `checkpointResults` / `secondaryObjectiveCurrent` | `phaseMandate` | `MandateTracker`, `MandateDetail` | ✅ Connected |
| `pendingHexMutations` | `phaseHexState` | Cleared after use (internal) | ✅ Internal |
| `prosperityShocks` | `phaseProsperity` | Cleared after use (internal) | ✅ Internal |
| `effectStates` | Orchestrator Phase 2a.4 (`tickEffects`) | No dedicated player UI; currently engine/runtime only | ⚠️ Debug visibility should improve before shell-heavy effect features land |
| `UnifiedActionTemplate.narrativeTemplates` / `aftermathConfig` / `illustrationUrl` / `backgroundTrack` / `musicTrack` | Authored encounter templates (single unified format) | Encounter stage adapters + `useAmbientContext` consume unified template fields for prose, aftermath, concept-art, and audio overrides | ✅ (2026-04-29, THR-109 format baseline) |
| `emittedOmens?: EmittedOmen[]` | `applyEncounterAftermathReaction` (`emit_omen` effect) + Phase 1.7a `phaseEmittedOmenDecay` | No dedicated player UI — omens influence encounter bias in `phaseAgentDecision` (invisible to player) + decay trace visible in DebugPanel feed. ⚠️ No UI readout for active emitted omens (tracked as THR-136 scope). | ⚠️ Engine-only (THR-115) |
| `archetypeDrift: ArchetypeDrift[]` | `phaseChoiceResolution` (write), `phaseDriftDecay` (decay) | `DebugPanel` → `DriftVisualiser` (THR-339 inspector); player-facing scene-state indicators land in C4 (THR-333) | ✅ Engine + Debug (THR-339) |
| `regionalDetectionPressure: RegionDetectionState[]` | `phaseDetectionPressure` (write + decay) | `DebugPanel` → `EncounterSeedsTab` and `DetectionStateInspector` (THR-339) | ✅ Engine + Debug (THR-339) |

**Verification:** For each new GameState field in your feature, name the component that reads it and how the data reaches the player.

**Location activity derivation (THR-22, 2026-04-17):**

| Surface | Integration | Notes |
|---------|-------------|-------|
| `deriveLocationActivities()` | NOT an orchestrator phase — pure UI-side derivation. Called from `useLocationActivities` hook in GameView. | O(edges) one-pass index; pure function; no game-state writes |
| `useLocationActivities` | Mounted in `GameView.tsx`; provides `locationActivitySummaries` + `hexPulses` | worldVersion-gated useMemo; fog-aware visible hex set (Proxy sentinel when fog disabled) |
| `locationActivityByHex: Map<string, LocationActivitySummary>` | Derived in GameView from `locationActivitySummaries`; keyed by `"col,row"` | Passed as `locationActivityMap` prop to HexMapV2 |
| `HexMapV2.locationActivityMap` | Prop consumed in HexMapV2 render block; read by inline tooltip IIFE | No Three.js layer — data flows to HTML overlay only |
| `HexTooltip` | Rendered in HexMapV2 JSX when `hoveredHex` is set; receives `locationActivity` prop | Tooltip positioned via `hexToWorld → worldToScreen` (anchors to hex center, not cursor) |

**Telemetry-fed thread inspection (2026-04-09):**

| Source | Producer | UI consumer | Status |
|--------|----------|-------------|--------|
| Latest `encounter_decision.rankedEncounterPool` in `runtime.balanceTelemetry.recentEvents` | `phaseAgentDecision` via `recordBalanceEvent()` | `GameView` → `getLatestEncounterDecisionsByAgent()` → `ThreadsPanel` pool button → `EncounterPoolModal` | ✅ Connected |

### 4. Trace Emission & Debug Visibility (`src/types/trace.ts` → `src/engine/traceBuffer.ts` → DebugPanel)

Every system should emit traces for inspectability (NFP #2). A trace category that exists in the type system but is never emitted is dead code.

**Current trace categories (85+):** action_selection, narrative_generation, context_harvest, dilemma_resolution, tick_summary, encounter_resolution, familiarity_change, movement, intervention_effect, action_execution, modifier_resolution, prosperity_tick, wealth_delta, trade_route_volume_change, trade_route_dissolved, settlement_tier_change, target_action_filter, hex_state, unrest_tick, saturation_tick, economic_chronicle, encounter_awareness, faction_awareness, encounter_cache, encounter_filter, idle_decision, encounter_scoring, road_hex_transition, agent_reroute, return_resolution, ripple_consequence, control_effect, doom_card, mandate_checkpoint, revelation, tick_health, tick_crash, agent_revelation, interaction_depth, faction_ambition, reputation_trait, rarity_graduation, rarity_importance, encounter_promotion, curator_decision, attention_pool, story_beat_queue, slot_overflow, slot_disposal, condition_overflow, slot_expansion, meeting_sensing, meeting_testing, meeting_spark, meeting_bond, settlement_genome, settlement_reassessment, culture_generation, culture_sublocation, graph_op_execution, choice_set_player_resolved, choice_set_player_dismissed, authored_attachment_created, **cli_auto_aftermath** (THR-257), encounter_aftermath_applied, encounter_aftermath_effect, encounter_seed_planted, encounter_seed_triggered, hidden_mark_placed, hidden_mark_revealed, intelligence_granted, **intelligence_referenced** (THR-113), **complication_selection** (THR-20), **aftermath_target_resolved**, **aftermath_target_invalid**, **faction_reputation_changed**, **reputation_set_applied**, **condition_applied**, **condition_removed** (all THR-114), **artifact_spawned**, **omen_emitted**, **omen_decayed**, **faction_splintered**, **faction_absorbed**, **faction_dissolved**, **faction_war_declared**, **faction_peace_forced** (all THR-115), **tick_phase_profile** (THR-186), **encounter_cache_rebuild** (THR-187), **choice_resolved**, **forecast_computed**, **hand_filtered**, **drift_threshold_crossed**, **detection_threshold_crossed**, **item_consumed_by_choice**, **spotlight_changed**, **callback_eligibility_computed** (all THR-339, registered in `TRACE_CATEGORIES`; emitters in Phase B modules)

**THR-16 (2026-04-18):** `curator_decision` trace extended — `CuratorDecisionTrace` now carries `isChainStage: boolean`, `isFinalChainStage: boolean`, `factionThreadCount: number`, `matchesAmbition: boolean`. These fields are computed in `phaseAttention.ts` and flow through to every `curator_decision` emission (both `kept` and `curated_out`). Not new categories — extensions to the existing interface.

**All categories emitted (TB-057, 2026-03-26).** `tick_health` and `tick_crash` emitted from `orchestrator.ts` (health check failures and unhandled exceptions respectively). `control_effect` emitted from `phaseControlEffects.ts`. `revelation` emitted from `revelationResolver.ts`.

**Review wrapper traces (THR-182, 2026-04-19):** Two new trace shapes written by the CC review surface — *not* engine traces, but structured logs persisted under `.cowork/review-traces/`:

| Trace type | Written by | Location | Consumed by |
|---|---|---|---|
| `review-wrapper` (`ReviewWrapperTrace`) | `scripts/review/wrapper.ts` on every wrapper exit | `.cowork/review-traces/<timestamp>.json` | CC session reads the trace JSON line on wrapper stdout; commit trailer (`review:ok` / `review:skipped:*`) written to closing commit body |
| `review-action` (`ReviewActionTrace`) | `.github/workflows/claude-review.yml` Action | GitHub Actions artifact (90-day retention) | GitHub PR check run + PR review comment |

These are not `TraceCategory` entries in `src/types/trace.ts` — they are out-of-band infrastructure logs. No DebugPanel tab needed.

**Verification:** For each trace category your feature defines, `grep 'category: "your_category"' src/engine/` must have at least one non-test hit.

### 5. DebugPanel Tabs (`src/components/Game/DebugPanel.tsx`)

Current ViewMode values: `feed`, `agent-follow`, `tick-inspector`, `social`, `encounters`, `encounter-seeds`, `hidden-marks`, `journey`, `webgl`, `factions`, `spheres`, `revelation-log`, `knowledge-gaps`, `armies`, `cli`, `strategic`, `omens`, `cultures`, `secrets-favors`, `clues`, `ruins`, `recent-events`, `shells`, `compositions`, `phases`, `choices`, `drift`, `hand`, `detection`, `forecast`

Sub-components: `DecisionBreakdown`, `RelationshipGraph`, `EncounterCacheView`, `WebGLDebugTab`, `HiddenMarksTab`, `EncounterSeedsTab`, `CulturePhoneticsInspector`, `CluesDebugTab` (THR-150), `RuinsDebugTab` (THR-154), `EncounterChoiceInspector`, `DriftVisualiser`, `HandStateInspector`, `DetectionStateInspector`, `ForecastFactorsInspector` (all THR-339 — wire DebugPanel inspectors for Phase B encounter modules)

**Debug bridge aftermath surface (THR-257):**

| Surface | Registration point | Consumer API | Trace coupling |
|--------|---------------------|--------------|----------------|
| Headless aftermath bridge | `window.__DEBUG._registerAftermathBridge(...)` in `GameView.tsx` | `window.__DEBUG.listAftermathReactions()` + `window.__DEBUG.pickAftermathReaction()` | `cli_auto_aftermath` (source=`debug-bridge`) + existing `encounter_aftermath_applied` |

**Verification:** If your feature adds significant inspectable state (journey progress, encounter notifications, prose enrichment context), decide whether it warrants a new DebugPanel tab or extension to an existing one.

### 6. Prose Enrichment Pipeline (`src/engine/proseEnrichment.ts`)

Any system that displays narrative text to the player should call `enrichProse()` with a `NarrativeContext` before rendering. Without enrichment, prose templates display raw placeholders.

**Current callers:** `returnEngine.ts` (Return prose + ripple consequence prose, TB-040); `buildUnifiedEncounterStageModel.ts` + `buildSimpleEncounterStageModel.ts` (encounter stage narrative context, now threads `gameState` + `tick` for intelligence enrichment — THR-113).

**Should be called by:** MeetingEncounterModal, JourneyVignetteModal, EncounterVignetteModal, any future vignette/prose display component.

**Verification:** If your feature displays prose from templates with `{placeholders}`, verify `enrichProse` is called in the rendering path.

### 7. Player Controls for Engine Features

Engine capabilities that are player-toggleable need UI controls. An engine function with no UI entry point is inaccessible.

| Engine capability | UI control | Status |
|------------------|-----------|--------|
| Fog of war toggle | URL param `?fog` | ✅ |
| Organic shore toggle | DebugPanel checkbox | ✅ |
| Bond overlay | DebugPanel checkbox | ✅ |
| Decision vector overlay | DebugPanel checkbox | ✅ |
| Attention mode toggle | `toggleAttentionMode()` in encounterVisibility.ts | ✅ RetinuePanel per-agent toggle (TB-040) |
| Faction-targeted ascendant actions | `FactionSheet` "Ascendant Actions" button → non-agent `ActionDrawer` | ✅ (2026-04-08) |
| Meet The First action | `handleStartMeeting()` in GameView | ✅ Rendered in JSX (TB-035 Phase 1) |
| Music volume | SettingsPanel Music slider | ✅ (2026-04-06) |
| Background/ambient volume | SettingsPanel Ambient slider | ✅ (2026-04-06) |
| UI SFX volume | SettingsPanel UI slider | ✅ (2026-04-06) |
| Master mute | SettingsPanel master mute toggle | ✅ (2026-04-06) |

**Verification:** For each player-facing toggle or action in your feature, name the UI element that triggers it.

---

## Checklist for Design Documents

Every design document in `Docs/plans/` must include a **Wiring** section that answers:

1. **Orchestrator:** Which existing phase(s) call this module? Or does it need a new phase? At what position in the loop?
2. **UI rendering:** Which component(s) display this feature's output? Are they already rendered in GameView, or do they need to be added?
3. **GameState flow:** What fields does this feature write to GameState? What component reads each field?
4. **Traces:** What trace categories does this feature emit? From which functions?
5. **Debug visibility:** How does a developer inspect this feature's state? Existing DebugPanel tab or new one?
6. **Prose pipeline:** Does this feature display narrative text? If yes, does it go through `enrichProse()`?
7. **Player controls:** Does the player need to trigger, toggle, or configure anything? What UI element provides that?
8. **Prerequisite health:** What upstream systems must be producing output for this feature to fire? List each dependency and how to verify it's alive (e.g., "encounters must complete → check encounterProgress has status:'completed' entries within 50 ticks"). If the upstream is known to be broken or untested at scale, flag it as a blocker.

### Throughput Gate

Features that depend on upstream pipeline throughput (not just correct wiring) must declare a **throughput expectation** in their design doc:

| What to declare | Example |
|-----------------|---------|
| **Upstream dependency** | "Requires agents to arrive at locations with encounter cache entries" |
| **Expected throughput** | "At least 1 encounter completion per 50 ticks on a seeded world" |
| **Verification method** | "Pipeline liveness integration test (`encounter-liveness.contract.test.ts`)" |

A feature that is correctly wired but receives zero upstream input is functionally dead. The throughput gate catches this before implementation is marked complete.

---

## Checklist for Implementation (Pre-Commit)

Before marking implementation complete, verify:

- [ ] Every new engine module is imported and called from the orchestrator (not just from tests)
- [ ] Every new modal/overlay component has a `<Component />` element in GameView JSX (not just an import)
- [ ] Every new GameState field has at least one UI component that reads and displays it
- [ ] Every new trace category is emitted by at least one non-test function (`grep` verification)
- [ ] Every new player-facing action has a UI trigger (button, menu item, click handler)
- [ ] Every prose display path calls `enrichProse()` if using templates with placeholders
- [ ] DebugPanel can inspect new feature state (existing tab or new tab)
