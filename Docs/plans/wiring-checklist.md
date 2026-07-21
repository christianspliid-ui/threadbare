# Integration Wiring Checklist

> **Living document.** Every design plan must include a wiring section that maps new modules to entries on this checklist. Every implementation must verify all listed connections before marking work complete. Maintaining this checklist is part of the Definition of Done for both design and implementation phases.
>
> **Last updated:** 2026-07-21 (THR-616 — Mortal Economy P2a cargo web + first divine verbs: additive `manifest` (`CargoManifest`) on `TradeRouteProperties` (`src/engine/tradeRoute.ts`) assigned at formation by `strategicGraphOps.ts::createTradeRoute` + `route_cargo_assigned` trace; **always read it via `readCargoManifest()`** (fail-soft: legacy `goodsType` → single-good manifest, neither → empty) so pre-P2 routes keep working. `computeRouteFormationBias()` (`strategicActionCandidates.ts`) folds `ROUTE_FORMATION_BALANCE_BIAS` 0.25 × `scoreRoutePairBalance()` into target-specific `worldImpact`, gated on `create_trade_route`, fail-soft on a missing source. New graph-executor cases `bless_harvest`/`blight_harvest` (`graphOpExecutor.ts`, routed via `graphOnlyOps` — no resolution change) shift every **staple** quantity ±`LOC_BLESS_HARVEST_STOCK_DELTA`/`LOC_BLIGHT_STOCK_DELTA` (25) clamped [0,100]; **deliberately no `touchWorld()`** — `resource_stock_tiers` already touches on a *tier* change, so the consequence lands one tick later. `loc.bless_harvest` gained its economic leg, `loc.blight` is new; both surfaced via `beat.milestone.the_wellspring_flows`'s `grantsActionIds`, **not `starter:true`**. Rulebook gained §10 "The World at Work" (former §10 → §11) + quick-reference block. No new GameState field / orchestrator phase / node / edge type. **No UI row** — cargo tooltips are deliberately THR-670. See "Mortal Economy — Cargo Web + First Divine Verbs P2a (THR-616)" section below. Previous: 2026-07-19 (THR-668 — Central interrupt auto-pause: new `useInterruptAutoPause` hook (`src/components/Game/hooks/useInterruptAutoPause.ts`) + single derived `interruptModalOpen` in `GameView` replace the five scattered per-modal pause effects. Every blocking interrupt surface (EncounterVeil, MeetTheFirstFlow, PremonitionModal, JourneyVignetteModal, StoryBeatModal, **AscendantBeatModal**, ChoiceSetModal, **EmergenceDilemmaModal** — the bolded two previously never paused) pauses the sim while open; resume fires only when ALL are closed and the pause was automatic (manual pause stays manual); `forceResumeAfterInterruptsRef` covers commit-and-continue / interrupt-opened flows. **New interrupt surfaces must be added to the `interruptModalOpen` OR-expression (mirroring their render condition) AND `getDebugOpenModals`.** `getDebugOpenModals` gains AscendantBeatModal/AscendantBeatOfferBanner/ChoiceSetModal/EmergenceDilemmaModal; `__DEBUG.getActiveUIState()` gains `simRunning`. See "Central Interrupt Auto-Pause (THR-668)" section below. Previous: 2026-07-18 (THR-613 Slice 3b-tail — Player Action Progression v1 Codex three-state grammar: new pure `codexEntryRunState`/`buildCodexRunContext` (`src/components/Codex/codexRunState.ts`) render the §5.B Held/Within-reach/Another-life grammar as Codex card badges — **not** the live drawer (design gate: flood-control + `getTargetActionSlots` blast radius). Reuses the shipped `SignaturePathState`+`SIGNATURE_STATE_COPY`; lock keys on `requiresReach` not the `reach` tag. Added `requiresReach`/`isAscendantAction` to `CodexEntry` + catalogued the eight `invest.*` signatures. `Codex` gained optional `runContext`/`initialStateFilter`/`embedded`/`onClose`; lazy in-game overlay in `GameView`; entry points on `AscendantSheet` + `SignaturesBlock`. No GameState field / phase / trace (read-only). See the "Player Action Progression — Slice 3b-tail Codex three-state grammar (THR-613)" section below. Previous: 2026-07-17 (THR-613 Slice 4 — Player Action Progression v1 Covenants: new `pendingControlReleases?: string[]` GameState field (mirrors `pendingChoiceCommits`), consumed by existing `phaseControlEffects` which lapses the effect `voluntarily_released` + emits `ControlReleaseTrace` + clears the queue (`CONTROL_RELEASE_EVENT_SIGNIFICANCE` tunable); UI `selectCovenantRows` + `CovenantsBlock` + folded `Covenants` `BarSection` in `AscendantBar`; `onReleaseControl` → `setGameState` in `GameView` (the bar's only player-mutating control); `__DEBUG.listControlEffects()`/`.releaseControl()`. See "Player Action Progression — Slice 4 Covenants (THR-613)" below. Previous: 2026-07-05 (THR-613 Slice 1 — Player Action Progression v1 engine substrate: new inline orchestrator phase `phaseAscendantProgression` (`src/engine/phaseAscendantProgression.ts`, called immediately before `phaseAscendantBeatDirector`, `phaseEventCounts['ascendant_progression']`) detects god-side Domain Capability tier crossings and sets `ascendantBeats.pending` to a Deepening beat (Director skips on `pending` → zero Director change, mutex-safe with THR-611); accrual helper `accruePlayerReachPractice` hooked in `unifiedActionResolution`; `computeRawScore` folds `reachPractice[reach]` into capability (one added additive term, same agent sigmoid); additive `AscendantProperties.reachPractice?`/`reachTierSnapshot?` (no new node/edge type); new `'deepening'` `BeatKind` (+ `AscendantBeatModal` presentation entry); constants `src/data/player-progression.ts` (+ CMS `player-progression-constants`); 3 progression trace categories (`ascendant.progression.practice`/`tier_up`/`deepening_enqueued` + declared `control_release`) in `TraceCategory`/`TRACE_CATEGORIES`/`TraceEntry`; `__DEBUG.getAscendantProgression()`. Engine + data + debug + one modal-presentation entry; Content (Slice 2) + UI legibility (Slices 3–4) are follow-on. See the "Player Action Progression — Slice 1 engine substrate (THR-613)" section below. Previous: 2026-07-05 (THR-611 Slice 5 — Divine Economy DebugPanel essence-sources tab: new `EssenceSourcesDebugTab` (`src/components/Game/debug/EssenceSourcesDebugTab.tsx`) registered in `DebugTabContent.tsx` (`ViewMode` `'essence-sources'` + `TABS` + render branch); reads live graph and lists every host with an `essenceSource` bag — latent/discovered/controlled, with kind/tier/sphere/sanctity + `computeSourceIncome`. Pure `useMemo` read; no GameState field / phase / trace. First UI-pillar slice; browser-verified @1920×1080. See the "Essence Sources — Divine Economy Substrate (THR-611)" section below. Previous: 2026-07-05 (THR-611 Slice 1 — Divine Economy essence-source substrate: new inline orchestrator phase `phaseEssenceSources` (`src/engine/phaseEssenceSources.ts`, called in `orchestrator.ts` immediately before `phaseEssence`, `phaseEventCounts['essence_sources']`); additive `essenceSource` property bag on host nodes (`src/types/essenceSource.ts` — `SourceKind`/`SourceTier`/`EssenceSource`/`EssenceSourcePhaseTrace`, no new node/edge type); constants + pure helpers `src/data/essence-sources.ts` (`deriveSourceTier`/`sourceTierMultiplier`/`sourceDepthMultiplier`/`BASE_SOURCE_INCOME` + thresholds); graph logic `src/engine/essenceSources.ts` (`computeSourceIncome`/`migrateControlledPlacesOfPower`/`recomputeControlledSourceTiers`/`readEssenceSource`); typed source income folded into `computeEssenceGeneration` (`influence.ts`) + `computeEssenceIncome` (`essenceIncome.ts`) — untyped/dormant migrated places of power stay on the legacy alignment-distributed place-of-power term (contract test guards bit-for-bit legacy income); one aggregate `essence_source_phase` trace/tick (emitted via cast, not a `TraceCategory` union member yet — follow-on will register it when the player-facing surfaces land); `__DEBUG.getEssenceSources()` inspection bridge (`debug-bridge.ts`). No new GameState top-level field (node-local property bag). Engine + dev-bridge only; player-facing find/claim/build/defend templates, discovery/consecration/defend encounters, portfolio panel + WebGL hex signifiers, and rulebook/manual-wiki are follow-on THR-611 slices. See "Essence Sources — Divine Economy Substrate (THR-611)" section below. Previous: 2026-07-05 (THR-615 — Mortal Economy P1 resource activation: new registered phase `resource_stock_tiers` (`src/engine/phases/resourceStockTiers.ts`, slot `pre-economy`, ordered after `reputation_decay`, before inline `phaseProsperity`); pure derivation `src/engine/resourceEconomy.ts`; 18-entry class table `src/data/resource-classes.ts` (constants + tier prose + economy IPK tooltips); additive `ResourceInstance.stockTier?` + location prop `resourceBalance` (`types/resource.ts`); prosperity balance term in `phaseProsperity.ts` (`EquilibriumBreakdown.resourceBalance`/`resourceBalanceBonus`); `resource_scarcity`/`resource_glut` chronicle triggers (`economicChronicle.ts` `formatChronicleTitle` + `economic-chronicle-content.ts` templates/significance); livelihood `ThreadTug` push onto `state.activeThreadTugs` (reuses `phaseAttention` machinery + `useAgentInteraction` attend path — no new field/UI surface); UI: prose-only Livelihood line (`LocationView.tsx` `LivelihoodLine`), economic IPK keywords Famine/Glut/Monopoly/Embargo (`ProseKeyword.tsx` `renderProseWithIPK` + `ECONOMY_KEYWORD_TOOLTIPS`), DebugPanel `economy` tab (`EconomyDebugTab.tsx` + `ViewMode`/`TABS`/render in `DebugTabContent.tsx`); `resource_stock_tier_change` trace (`trace.ts` category + `TRACE_CATEGORIES` + `ResourceStockTierChangeTrace`, emitted via the `satisfies…as Omit<TraceEntry,…>` cast); equivalence baseline updated (`phaseRegistry.equivalence.test.ts`); Manual wiki page `public/livelihoods-reference.html` + `wiki-manifest.json`. No new GameState top-level field (location-local props + existing `activeThreadTugs`). See "Mortal Economy — Resource Web P1 (THR-615)" section below. Previous: 2026-07-05 (THR-66 — Rival activation via multi-phase schemes: `phaseRivalActions` (`orchestrator.ts`) rewritten to launch/invest/advance/attribute schemes on the THR-225 phase runner + counter-play (stall→fail); pure `computeRivalEscalationTier`/`selectRivalScheme`/`buildRivalScheme`/`schemeFlags` (`src/engine/rival.ts`); families `src/data/rival-schemes/{types,corruptive,territorial,index}.ts`; constants `src/data/rival-scheme-config.ts`; additive `RivalState.{activeSchemeIds,lastSchemeLaunchTick,schemes}` + `ActiveComposition.{phases,sponsorRivalId,schemeFamily}` (`types/gameState.ts`, `types/rival.ts` `RivalSchemeSummary`) + `sponsors_scheme` EdgeType (`types/graph.ts` + `types/edgeSchema.ts`); 4 `rival.*` traces (`trace.ts`, emitted via local `emitRivalTrace` cast helper); UI: RivalPanel scheme cards + 4-phase chips (`RivalPanel.tsx` reads `RivalState.schemes`, no new prop), HexMapV2 overlay (`src/engine/rivalInfluenceMarkers.ts` → `src/components/HexMapV2/scene/RivalInfluenceMesh.ts`, `rivalInfluenceMarkers` prop memoized in `GameView.tsx`), launch/crack toasts + Chronicle (runner) + cool-failure beat; Debug: `__DEBUG.getRivalSchemes()`/`forceRivalScheme()` (`debug-bridge.ts`/`.d.ts`); 15 tests `src/engine/__tests__/rivalSchemes.test.ts`. No new orchestrator phase (existing Phase 3 slot reused); no `world-flag` runner change (already live). See "Rival Schemes (THR-66)" section below. Previous: 2026-07-04 (THR-603 — Encounter density & Chapter Ledger: new `ChapterRecord`/`ChapterStepRecord`/`ChapterParticipant` types (`src/types/chapterRecord.ts`, off `unifiedAction.ts` to keep blast radius small); new `src/engine/chapterArchive.ts` (`buildChapterRecord` snapshots resolved encounters post-`enrichProse()`; `appendChapters` cap-2000/batch-100 eviction, non-threaded-oldest-first; `isEncounterAction`/`getChapterTemplateName`; `emitChapterArchivedTrace`); wired at the orchestrator resolved-action cleanup **before** the retention prune (`RESOLVED_ACTION_RETENTION_TICKS` untouched); additive `chapterArchive?: readonly ChapterRecord[]` on `GameState`. Doom-phase ramp: `CURATION_PHASE_MULTIPLIERS` (`branchingConstants.ts`) × `BRANCHING_CURATOR_BIAS_WEIGHT` via `runtime.curationPhaseMultiplier` (set once/tick in `runTick` from `getJourneyPhase(doomClock.progress)`), read in `computeBranchingCuratorMultiplier`. UI: `ChapterLedger.tsx` (list merging active `unifiedActions` + archived, threaded/all filter, `CHAPTER_LEDGER_PAGE_SIZE`-paginated; reused embedded in AgentProfileModal Chapters tab) + `ChapterView.tsx` (per-step prose/afterimage in the narrative lexicon, "you whispered…" choices, complications, aftermath, clickable cast) mounted in `GameView` + sidebar open button; `game.chapter-ledger`/`game.chapter-view` IA surfaces + `game.agent-profile-modal` reads[]. Trace: `encounter.chapter_archived` in `TraceCategory`+`TRACE_CATEGORIES`+`ChapterArchivedTrace` (`trace.ts`); `curationPhaseMultiplier` added to `BranchingCuratorNudgeTrace`. Debug: `__DEBUG.getChapterArchive(filter?)` (`debug-bridge.ts`/`.d.ts`); CLI `chapters [agent|@hero]`. Consciously deferred: DebugPanel inline archive list (redundant with the wired `__DEBUG` bridge + CLI; not worth threading a prop through GameView's large tree). See "Encounter Density & Chapter Ledger (THR-603)" section below. Previous: 2026-07-01 (THR-490 — DebugPanel Prose QA tab: new pure `collectAuthoredProse()` (`src/engine/content-eval/collectAuthoredProse.ts`) sweeps the static authored tables into a deduped `EvalInput[]` corpus, fed to the shipped `scoreProseBatch`; new `prose-quality`/`Prose QA` tab (`ViewMode`+`TABS` append-only) → `ProseQualityView.tsx`; `__DEBUG.proseQualityReport()` + `scoreProseEntry(id)` (`debug-bridge.ts`/`.d.ts`); IA-manifest `game.debug-panel` notes updated. No GameState field / orchestrator phase / trace category (pure static read; inspectability via the `__DEBUG` return contract). See the "DebugPanel Prose QA Tab (THR-490)" section below. Previous: 2026-07-01 (THR-523 — Reach-gated bucket catalogue + signature acquisition beats: the 8 `invest.<reach>.<name>` signatures added to `ASCENDANT_ACTION_BUCKETS` (`ascendant-beat-content.ts`) as `{ bucket:'reach-gated', requiresReach }`, drift-guarded against new derived `REACH_SIGNATURE_ID_BY_REACH` (`reach-signature-content.ts`) + `REACH_SIGNATURE_CONTENT_TEMPLATES`. New per-run dynamic grant: `BeatDefinition.grantsReachSignature: 'primary'|'secondary'` (`types/ascendantBeat.ts`), resolved in `resolvePendingBeat` via new exported `resolveReachSignatureGrant(state, slot)` (`ascendantBeat.ts` — affinity-ranked reaches → `invest.*` id, orthogonal to `grantsActionIds`, fail-soft). Beat 4 `beat.spine.a_path_opens` gains `grantsReachSignature:'primary'`; new `beat.pool.invest.reach_signature` investment pool beat + its `ASCENDANT_POOL_BEAT_TEMPLATES` content template ("A Second Mastery") grant the secondary, gated by new `BeatEligibility` variant `unacquired_reach_signature` (`isBeatEligible`). No new orchestrator phase / GameState field / trace category (reuses `action.unlock.granted`). Previous: 2026-07-01 (THR-555 — Reach signatures, engine-backed content: 3 `UnifiedActionTemplate`s (`invest.iron.warhost`, `invest.veil.rend_the_gate`, `invest.stone.great_work`) in `src/data/reach-signature-content.ts` (spread into `UNIFIED_ACTION_TEMPLATES`), reach-gated via `requiresReach`, consuming the shipped `signature_warhost`/`sphere_influence_amplify`/`spawn_unique_location` aftermath effects (Iron also runs a step `anoint_faction` op → `chosen_status_grant`). New exported `bindReachSignatureTargets` (`encounterAftermath.ts`, called at the aftermath-dispatch loop head) binds content sentinels to the card target at fire time: `$target`→`action.targetId`, `$primary`→caster primary Creation Sphere, Stone `nearAgentId:'$target'`→target location hex; sentinels (`AFTERMATH_TARGET_SENTINEL`/`AFTERMATH_PRIMARY_SPHERE_SENTINEL`) + `GREAT_WORK_UNIQUE_TAG`/`SIGNATURE_BESPOKE_BASE_VALUE` live in the content module (one-way engine→content import). 3 bespoke `SIGNATURE_MATRIX` cells (iron×force/veil×mind/stone×matter). Not touching `ASCENDANT_ACTION_BUCKETS` (THR-523). Previous: 2026-07-01 (THR-552 — Reach signature Stone / The Great Work: new `spawn_unique_location` aftermath effect kind (`unifiedAction.ts` + `encounterAftermath.ts`) minting a one-of-a-kind `location` (unique flag + `controls` edge, dedup by `uniqueTag`); optional legendary-relic reuse of the `spawn_artifact` path; `GREAT_WORK_*` constants (`game-config.ts`); `'ascendant.signature.unique_location'` trace; `spawn_unique_location` in `KNOWN_AFTERMATH_EFFECT_KINDS`. Previous: 2026-07-01 (THR-551 — Reach signature Veil / Rend the Gate: new `sphere_influence_amplify` aftermath effect kind (`unifiedAction.ts` + `encounterAftermath.ts`) resolving into a `ControlEffect`; additive `perTickSphereInfluence`/`perTickLeak` on `ControlSpec`/`ControlEffect` (`controlEffect.ts`) processed by `phaseControlEffects.ts` (scaled sphere pressure + seeded chaos-pulse leak); `RIFT_*` constants (`game-config.ts`) + `RIFT_LEAK_SEED_OFFSET` (`phaseControlEffects.ts`); `'ascendant.signature.rift'`/`'.rift_leak'` traces; `sphere_influence_amplify` in `KNOWN_AFTERMATH_EFFECT_KINDS`. Previous: 2026-06-30 (THR-550 — Reach signature Iron / Warhost: new `signature_warhost` aftermath effect kind (`unifiedAction.ts` + `encounterAftermath.ts`); new `raiseWarhostForce` reusing the army node form (`armySpawning.ts`); `WARHOST_BASE_STRENGTH`/`WARHOST_FALLBACK_SENTIMENT_SHIFT` (`game-config.ts`); `'ascendant.signature.warhost'` trace + `signature_warhost` in `KNOWN_AFTERMATH_EFFECT_KINDS`. Previous: 2026-06-30 (THR-530 — Autonomous in-encounter choice: new pure `src/engine/encounters/reactionChooser.ts` (`computeAxisLeans`/`inferReactionLean`/`chooseAlignedReaction`); new registered phase `autonomous_aftermath` (`src/engine/phases/phaseAutonomousAftermath.ts`, slot `post-resolution`); `resolveAftermathContextForAgent` `reactions[0]` default → profile-aligned chooser; additive `UnifiedAction.autonomousAftermathApplied`; `'reaction_selected'` trace; constants `PERSONALITY_REACTION_WEIGHT`/`PERSONALITY_REACTION_DRIFT_DELTA`/`PERSONALITY_AUTONOMOUS_AFTERMATH_MAX_PER_TICK`. Previous: 2026-06-29 (THR-520 — Beat-driven graph seeding: `seedsGraph?: BeatGraphSeed` on `BeatDefinition`; `seedBeatGraph` in new `src/engine/ascendantBeatSeeding.ts`; `resolvePendingBeat` seeds on resolution + records `BeatRecord.seededNodeIds`; `ascendant.beat.seeded` trace + `BeatSeededTrace`. Previous: 2026-06-23 (THR-475 — Encounter surface foundation: new `src/engine/encounterSurface.ts` (`computeSurfaceKey`, `getSurfaceAxisValues`, surface-volume constants); `EncounterCacheEntry.targetAgentRole`; novelty record semantics re-keyed from `templateId` to `surfaceKey` at `encounterScoring.ts` + `phaseAgentDecision.ts`; `ScoringTrace.selectedSurfaceKey` / `selectedSurfaceAxes` / `selectedNoveltyMultiplier`; DebugPanel `DecisionBreakdown` surface-key rows; `window.__DEBUG.getEncounterNoveltyRecord()`; deterministic `scripts/encounter-volume-model.ts` + `npm run volume-model` dated md/json output. Previous: 2026-06-13 (THR-460 — Outcome-band prose integration: `OutcomeBand` type exported from `outcomeConsequences.ts`; `outcomeBand?: OutcomeBand` on `NarrativeContext`; `{outcome_phrase}` + `{q_flavor}` placeholders in `enrichProse`; `outcomeBandPhraseHistory` on `SimulationRuntime`; `OUTCOME_BAND_PROSE` + `OUTCOME_BAND_Q_FLAVOR` tables in `src/data/outcome-band-content.ts`; `outcome_band_prose_selected` trace; `runtime` wired into `buildUnifiedEncounterStageModel` via `GameView`; `__DEBUG.bandPhraseUsage`. Previous: 2026-06-11 (THR-453 — Template novelty pressure: `EncounterNoveltyRecord` on `GameState`, novelty multiplier in `scoreAndSelect`, bump site in `phaseAgentDecision`, `noveltyMultiplier`/`noveltyChangedSelection`/`preNoveltyWinnerId` on `ScoringTrace`. Previous: THR-440 — Named-mortals third sentence in `composeSurveyPeopleProse`: `rankHexMortals` + `composeNamedMortalsClause` helpers, 4 new data tables in `survey-prose-tables.ts`, `namedMortalCount` on `SurveyProseComposedTrace`. Previous: THR-439 — HexChronicle people-layer swaps to `survey_completed` band when available, falls back to static tables; `surveyPeopleProse` + `surveyPeopleProseTick` props added, `surveyPeopleEvent` useMemo in GameView. Previous: THR-415 — Survey people-layer prose composer: `composeSurveyPeopleProse` + `buildSurveyCompletedTickEvent` in new `src/engine/surveyProseComposer.ts`, wired into `unifiedActionResolution.ts` on `hex.survey` success, `survey_completed` added to TickEvent union + `uiColorPalette.ts` TICK_EVENT_COLORS + notificationRouter hex-nav + discovery category, `SurveyProseComposedTrace` added to `src/types/trace.ts`. Previous: 2026-05-14 (THR-433 — Kindle a Calling internal-pressure resolver: `kindle_a_calling` added to `FactionGovernanceVerbKind` union and dispatched through existing `faction_verb` GraphOp; new `applyKindleACalling` in `factionGovernanceVerbs.ts` reuses exported `scoreEligibleAmbitions` / `selectAmbitionType` / `mulberry32` / `hashString` from `factionAmbitions.ts`; four-signal `computeKindleBias` (member axiology, leader bias, doctrine pressure, dissent); `getArmyLockedAmbitionId` guard; `faction.encounter.calling_named` template in `faction-governance-encounters.ts` (2 steps + 2 aftermath reactions: commit / stall); FactionSheet ▲ glyph + "kindled" sublabel via new `FactionNetworkAmbition.kindled` field; new `FactionKindleCallingTrace` with bias-weighted candidate list. Previous: 2026-05-14 (THR-432 — Anoint Successor succession subsystem: `anoint_successor` GraphOp intercepted in `unifiedActionResolution.ts` (sibling pattern to `faction_verb` / `plant_schism`), new `phaseFactionSuccession` registered in `post-narrative` slot, `applyAnointSuccessor` in new `anointSuccessor.ts`, `getAnointedLeaderId` helper in `factionNetwork.ts` consulted by both `getFactionNetworkSummary` and `phaseFactionActions.getFactionLeader`, 2 new EdgeTypes (`will_succeed`, `leads`) + EDGE_SCHEMA entries, `faction.encounter.inheritance` template in `faction-governance-encounters.ts`, FactionSheet woven-thread glyph (`❧`) + "by inheritance" sublabel, 2 new trace categories with 5 succession outcome variants. Previous: 2026-05-14 (THR-430 — Schism deferred-resolution divine action: `plant_schism` GraphOp intercepted in `unifiedActionResolution.ts` (sibling pattern to `faction_verb`), new `phaseSchismResolution` registered after `faction_actions`, `performFactionSplit` + `performFactionReform` in new `factionTopology.ts`, splinter-naming table in `faction-schism-content.ts`, `SchismPendingBanner` + `SchismReformAfterimage` in `FactionDetailBody`, `__DEBUG.schism.list()`, 3 new trace categories with typed interfaces. Previous: 2026-05-14 (THR-12 — Hex Vignette Phase 4: LandmarkRaycaster, VignetteSelectionState, aSelectionMix GPU attribute, hover/selection easing, raycaster click detection, __TERRAIN_LAB selectLandmark/gotoLandmark/getSelectionState/clearSelection. Previous: 2026-05-12 (THR-11 — Hex Vignette Phase 3: ChunkedLandmarkLayer, VignetteClickRegistry, LandmarkExportValidator, window.__TERRAIN_LAB dev API. Previous: 2026-05-12 (THR-418 — Added Sustained Controls surface in ThreadsPanel: `getSustainedControlNodes` resolver, `championEffectId`/`championTemplateId` on `ThreadedAgent`, new Hexes/Sources sections + champion chip + location claim-status fold-in, DebugPanel `Sustained` inspector tab, `src/data/sustained-control-status-prose.ts` content tables, 3 new `ActivityIcon` kinds. Previous: 2026-05-09 (THR-389 — Added Encounter Foreshadowing: on-click resolver, per-session cache, `foreshadowing` field on `UnifiedActionTemplate`, Foreshadowing DebugPanel tab, debug-bridge methods. Previous: 2026-05-08 (THR-266 — Added UI Pillar Verification section). Previous: 2026-05-08 (THR-289 — Added UL Interactive Dashboard reference surface at `?view=ul`). Previous: 2026-05-07 (THR-326 — Added regional detection-pressure phase wiring + DebugPanel detection inspector surface). Previous: 2026-04-29 (THR-109 — Added branch-aware aftermath selection surface (`BranchAwareAftermathConfig` / `resolveAftermathVariant`). Previous: 2026-04-19 THR-174 viewport audit.)

---

## Central Interrupt Auto-Pause (THR-668)

One registry decides when the sim pauses for a modal. Any **blocking interrupt surface** (a modal the player must act on) pauses the tick loop while open; the sim resumes only when ALL such surfaces are closed and the pause was taken automatically — a manual pause survives modal churn.

| Wiring surface | Location | Notes |
|---|---|---|
| Hook | `src/components/Game/hooks/useInterruptAutoPause.ts` | Pause-on-open / resume-on-all-closed / manual-pause stickiness / re-pause if something resumes behind an open modal. `forceResumeRef` escape hatch for flows that must resume regardless (commit-and-continue, interrupt-opened encounters). |
| Registry | `GameView.tsx` `interruptModalOpen` | ORs the **render condition** of: EncounterVeil (`tieredEncounterState`), MeetTheFirstFlow, PremonitionModal, JourneyVignetteModal, StoryBeatModal, AscendantBeatModal (`pendingBeat && beatEntered` — the offer banner deliberately does NOT pause), ChoiceSetModal, EmergenceDilemmaModal. **When adding a new blocking modal, add its render condition here and to `getDebugOpenModals`.** Mirror the render condition exactly — pausing for a modal that cannot render soft-locks the run loop. |
| Not in the registry | `useNotifications` (event popups, own wasRunning pair), avatar-arrival pause, harvest pause, `useAgentInteraction` fire-pause | Popups keep their own pause/resume; if a popup resume races an open interrupt, the hook re-pauses on the next effect pass. |
| Debug | `__DEBUG.getOpenModals()` + `__DEBUG.getActiveUIState().simRunning` | Open-modal list now includes beat/choice/dilemma surfaces; `simRunning` lets playtest scripts assert pause state. |
| Tests | `src/components/Game/__tests__/useInterruptAutoPause.test.ts` | 8 tests incl. stacked-modal no-leak, manual-pause stickiness, force-resume consumption. Supersedes `encounterAutoPause.test.ts` (deleted — tested an inline replica of the old pattern). |

## Essence Sources — Divine Economy Substrate (THR-611, Slices 1–5)

Engine substrate + verb loop for the essence-source find→claim→build→defend loop. Slice 1 = income substrate; Slice 2 = build/defend verb ops; Slice 3 = beat surfacing; Slice 4 = find/claim + latent-source worldgen seeding; Slice 5 = DebugPanel essence-sources inspectability tab. Remaining follow-on slices (THR-611 stays In Dev): player-facing portfolio panel + WebGL hex signifiers + IPK/codex/chronicle + `source_*` trace categories; discovery/consecration/defend encounters; rulebook + manual-wiki.

| Wiring surface | Location | Notes |
|---|---|---|
| Types | `src/types/essenceSource.ts` | `SourceKind`, `SourceTier`, `EssenceSource` property bag, `EssenceSourcePhaseTrace`. No new node/edge type — a bag on existing host nodes; ascendant relationship stays the `controls` edge. |
| Constants + pure helpers | `src/data/essence-sources.ts` | `SANCTITY_FLOWERING_THRESHOLD`/`SOURCE_FLOWERING_MULTIPLIER`/`SOURCE_CONTESTED_PENALTY`/`SOURCE_DR_BASE`/`SOURCE_CONTROL_SUSTAIN`/`SANCTITY_BUILD_PER_ACTION`/`SANCTITY_DRAIN_PER_TICK_CONTESTED` + `BASE_SOURCE_INCOME` (placeOfPower keeps legacy 0.5); `deriveSourceTier`/`sourceTierMultiplier`/`sourceDepthMultiplier`. |
| Graph logic | `src/engine/essenceSources.ts` | `computeSourceIncome` (typed per-sphere income + portfolio DR), `migrateControlledPlacesOfPower` (idempotent, income-neutral), `recomputeControlledSourceTiers` (+ contested drain), `readEssenceSource`. O(controlled hosts). |
| Orchestrator phase | `src/engine/phaseEssenceSources.ts` → `orchestrator.ts` | Inline call immediately before `phaseEssence` (fresh tiers before income); `phaseEventCounts['essence_sources']`. One aggregate `essence_source_phase` trace/tick. |
| Income integration | `computeEssenceGeneration` (`src/engine/influence.ts`) + `computeEssenceIncome` (`src/engine/essenceIncome.ts`) | Typed source income added post-distribution to each source's own sphere; untyped/dormant migrated places of power skipped by the typed term and kept on the legacy place-of-power loop → legacy income provably unchanged. |
| Debug | `src/debug-bridge.ts` | `__DEBUG.getEssenceSources()` → `{ sources, sourceIncome }` (read-only). |
| Tests | `src/engine/__tests__/essenceSources.test.ts` | 15 tests: tier/DR helpers, typed routing, migration idempotency, contested drain, and the legacy-income-unchanged contract (bit-for-bit per sphere). |
| Build/Defend verb ops (Slice 2) | `src/types/graphOp.ts` + `src/engine/graphOpExecutor.ts` | `consecrate_source`/`sanctify_source`/`defend_source` executor cases (routed via `graphOnlyOps`→`executeGraphOps`, no resolution change). Templates `loc.consecrate_source`/`loc.sanctify_source`/`loc.defend_source`. |
| Find/Claim verb ops (Slice 4) | `src/types/graphOp.ts` + `src/engine/graphOpExecutor.ts` | `find_source` (reveal latent sources within `op.discoveryRangeHops ?? SOURCE_DISCOVERY_RANGE_HOPS` hexes of target; `findLatentSourcesInRange` in `essenceSources.ts`) + `claim_source` (ascendant→host `controls` edge; enforces Find→Claim prerequisite; idempotent). Templates `loc.find_source` (Eye/read) / `loc.claim_source` (Star/update). |
| Worldgen seeding (Slice 4) | `src/engine/essenceSourceSeeding.ts` → `gameInit.ts` | `seedLatentEssenceSources(graph, rng)` after location sphere-affinity seeding (`LATENT_SOURCE_SEED_OFFSET`); seeds `LATENT_SOURCE_SEED_COUNT` latent (`discoveredBy` undefined) `placeOfPower` bags on wild-interest subtypes, typed by locale dominant sphere. Deterministic; does not exclude mundane-controlled hosts. |
| Surfacing (Slices 3–4) | `src/data/ascendant-beat-content.ts` | `beat.pool.invest.the_wellspring` `grantsActionIds` now the whole 5-verb loop (find/claim/consecrate/sanctify/defend); all five `unlockable-generic` in `ASCENDANT_ACTION_BUCKETS`. Empty THR-501 starter floor left intact. |
| Tests (Slices 2/4) | `graphOpExecutor.essenceSources.test.ts`, `graphOpExecutor.findClaimSources.test.ts`, `essenceSourceSeeding.test.ts`, `ascendantBeatPool.test.ts` | 13 + 8 + 6 op/seeding tests; beat-pool grant asserts the five-verb loop. |
| DebugPanel tab (Slice 5) | `src/components/Game/debug/EssenceSourcesDebugTab.tsx` + `DebugTabContent.tsx` (`ViewMode` `'essence-sources'` + `TABS` "Essence Sources" + render branch) | Reads live graph: lists every host with an `essenceSource` bag (latent/discovered/controlled) — kind, colour-coded tier, sphere typing, sanctity, contested/desecrated — plus `computeSourceIncome` per-sphere. Pure `useMemo` over graph+tick; ascendant via `actorType==='ascendant'`. Numbers on the debug surface only (player prose stays coarse-tier). 5 render tests (`__tests__/EssenceSourcesDebugTab.test.tsx`). |
| Deferred (follow-on slices) | — | `essence_source_phase` + `source_*` `TraceCategory` registration; discovery/consecration/defend encounters; IPK/codex/chronicle prose; portfolio income-by-source panel + WebGL hex signifiers + DebugPanel essence-sources tab; rulebook + Game-Manual-Wiki essence page. |

## Mortal Economy — Resource Web P1 (THR-615)

Activates the location-property resource layer into coarse stock tiers, couples it to prosperity, and puts it in the player's turn loop via a livelihood thread tug. **Step 0 finding:** resources are `Record<string, ResourceInstance>` on location-node properties (not the schema's unused `resource` node type), seeded by terrain in `resourceSeeding.ts` — this superseded the plan's node/edge assumption.

| Wiring point | Where | Notes |
|---|---|---|
| Pure derivation | `src/engine/resourceEconomy.ts` (new) | `computeLocationDemand` (population proxy), `computeResourceBalance`, `tierFromBalance`, `deriveLocationStockTiers`, `readLocationResourceBalance`. No PRNG/graph/traces — deterministic. |
| Class table | `src/data/resource-classes.ts` (new) | 18-entry `RESOURCE_CLASSES` (category · primarySphere · baseValue · scarcitySensitivity); all thresholds/weights as named constants; per-(resource,tier) baseline-register prose; `ECONOMY_KEYWORD_TOOLTIPS`/`ECONOMY_KEYWORD_SET`. |
| Orchestrator phase | `resource_stock_tiers` (`src/engine/phases/resourceStockTiers.ts` new, registered in `phases/index.ts`) | Slot `pre-economy` so `phaseProsperity` reads a fresh `resourceBalance`. Spotlight-capped at `ECON_PHASE_SPOTLIGHT_CAP` 40 (coarse tier-only beyond); first-derivation silent (no trace/chronicle/burst); `touchWorld(ctx.runtime)` on any tier change. Returns `Partial<GameState>` appending `tickEvents`/`chronicleEntries`/`activeThreadTugs`. |
| GameState / props | `types/resource.ts` | Additive `ResourceInstance.stockTier?` + location-local `properties.resourceBalance` (number). No new GameState top-level field. |
| Prosperity coupling | `src/engine/phaseProsperity.ts` | `computeEquilibriumTarget` adds `readLocationResourceBalance(props) · RESOURCE_BALANCE_PROSPERITY_WEIGHT 0.15 · 100`; `resourceBalance`/`resourceBalanceBonus` added to `EquilibriumBreakdown` → spread into the `prosperity_tick` trace. |
| Chronicle | `src/engine/economicChronicle.ts` + `src/data/economic-chronicle-content.ts` | `resource_scarcity`/`resource_glut` triggers (union + `ECONOMIC_CHRONICLE_SIGNIFICANCE` + `ECONOMIC_CHRONICLE_TEMPLATES` + `formatChronicleTitle`); resolved by the phase for staple/strategic + baseValue≥`CHRONICLE_MIN_BASE_VALUE` on genuine crossings. |
| Livelihood tug | `src/engine/phases/resourceStockTiers.ts` | Pushes a `ThreadTug` (reach `gold`; threat hard/Famine, moderate/Glut) onto `state.activeThreadTugs` for a bonded non-dormant mortal whose home staple is scarce/surplus. Rides existing `phaseAttention` (preserves it) + `useAgentInteraction` (attends by `agentId`, no backing encounter). Residents grouped sublocation→parent; deduped by a `livelihoodKey` carried on the tug. |
| Trace | `src/types/trace.ts` | `resource_stock_tier_change` added to `TraceCategory` + `TRACE_CATEGORIES` + `ResourceStockTierChangeTrace` interface + `TraceEntry` union; emitted with `satisfies Omit<…> as Omit<TraceEntry,…>` (the union-collapse cast). |
| UI — Livelihood line | `src/components/Game/LocationView.tsx` | `LivelihoodLine` sub-component renders prose-only (scarce/surplus first, else dominant-resource steady prose) via `getResourceTierProse`; Famine/Glut woven as `**keyword**` and rendered through `renderProseWithIPK`. |
| UI — economic IPK | `src/components/ProseKeyword.tsx` | `renderProseWithIPK` gains an economy-keyword branch (`ECONOMY_KEYWORD_SET`) → `EconomyKeyword` tooltip component. Sphere keyword behaviour unchanged. |
| UI — DebugPanel tab | `src/components/Game/debug/EconomyDebugTab.tsx` (new) + `DebugTabContent.tsx` | `'economy'` added to `ViewMode` + `TABS` (label `Economy`) + render line; reads live graph (numbers shown here, debug-only). |
| Tests | `src/engine/__tests__/{resourceEconomy,phaseResourceStockTiers}.test.ts` (new) + `phaseRegistry.equivalence.test.ts` | Derivation unit tests + phase integration (tier storage, famine/glut tug, dedup); equivalence baseline `EXPECTED_PHASE_IDS` gains `resource_stock_tiers`. |
| Manual wiki | `public/livelihoods-reference.html` (new) + `public/wiki-manifest.json` | W18 dual-layer page; nav injected by `generate-design-wiki`. |
| Consciously deferred | P2–P4 | Trade cargo manifests, route-event encounters, faction control + monopoly resolution, local sphere-pressure drift, divine economic verbs — per the plan's phasing. Economic rival scheme family (THR-620) unblocked by this. |

---

## Mortal Economy — Cargo Web + First Divine Verbs P2a (THR-616)

Makes trade routes carry *specific* goods derived from the P1 stock tiers, biases route formation toward complementary partners, and gives the player the first two verbs that move the economy. Re-scoped from the full P2 after three checkpoints without a ship — the remaining seams split to THR-669 (route-event encounter seeds) and THR-670 (cargo-aware route tooltips, the WebGL/UI pillar), which is why this section has **no UI row**.

| Wiring point | Where | Notes |
|---|---|---|
| Cargo manifest type + derivation | `src/engine/tradeRoute.ts` | `CargoManifest` + additive `manifest` on `TradeRouteProperties`. `buildRouteManifest()` derives cargo from both endpoints' P1 stock tiers; `scoreRoutePairBalance()` is the 0..1 complementarity signal. `readCargoManifest()` is the **only** sanctioned read — fail-soft both ways (legacy `goodsType` → single-good manifest; neither → `EMPTY_CARGO_MANIFEST`). Constants `ROUTE_MANIFEST_MAX_GOODS` 4 / `ROUTE_EXPORT_QUANTITY_FLOOR` 60 / `ROUTE_WANT_QUANTITY_CEIL` 30 / `ROUTE_BALANCE_SCORE_DIVISOR` 3 / `ROUTE_FORMATION_BALANCE_BIAS` 0.25. |
| Manifest assignment | `src/engine/strategicGraphOps.ts::createTradeRoute` | Assigns `manifest` + `goodsType` at route formation (legacy field kept populated for old readers) and emits the `route_cargo_assigned` trace. |
| Route-formation scoring | `src/engine/strategicActionCandidates.ts` | New exported `computeRouteFormationBias(template, sourceLocation, target)`, gated on `mutationHint.type === 'create_trade_route'`, folded into the **target-specific `worldImpact`** component (clamped to 1). Source endpoint resolved via `getAgentLocationId()` — the same `located_at` node `createTradeRoute` uses. Fail-soft → 0 on a missing source node. |
| Harvest verb ops | `src/types/graphOp.ts` + `src/engine/graphOpExecutor.ts` | `bless_harvest` / `blight_harvest` executor cases (routed via `graphOnlyOps`→`executeGraphOps`, **no resolution change** — the essence-source pattern). Shared `adjustStapleQuantities` body shifts every *staple* resource's `quantity` by ±`LOC_BLESS_HARVEST_STOCK_DELTA`/`LOC_BLIGHT_STOCK_DELTA` (25), clamped [0,100]. **No `touchWorld()` in the op** — `resource_stock_tiers` already touches on a *tier* change (the `locationSubtype` precedent), so touching on the raw quantity write would over-invalidate; the tier re-derives next tick. Fail-soft: missing location → error result; no staples → success no-op. |
| Templates | `src/data/unified-action-templates.ts` | `loc.bless_harvest` (Gold reach / Life sphere) gains its economic leg alongside the existing prosperity/health `update_node`; `loc.blight` (Shadow / Entropy) is **new** — the missing inverse. Both `actorAffinities: ['ascendant']`, `essenceCost` 4, settlement-family `targetSubtypes`. |
| Constants | `src/data/location-action-constants.ts` | `LOC_BLESS_HARVEST_STOCK_DELTA` / `LOC_BLIGHT_STOCK_DELTA` = 25. |
| Effect prose + technical effect | `src/data/action-technical-effects.ts`, `src/data/actionEffectsProse.ts` | `technicalEffect` (THR-604) + effects-line prose (THR-639) entries for both ids — keeps the action-catalog badges at `wired · template`. |
| Card surfacing | `src/data/ascendant-beat-content.ts` + `src/data/ascendant-milestone-beats.ts` | Both ids added to `ASCENDANT_ACTION_BUCKETS` (`unlockable-generic`) and to `beat.milestone.the_wellspring_flows`'s `grantsActionIds` alongside `loc.open_markets`. **Not `starter: true`** — under the empty THR-501 starter floor an ungranted template is unreachable forever. |
| Trace | `src/types/trace.ts` | `route_cargo_assigned` in `TraceCategory` + `TRACE_CATEGORIES` + `RouteCargoAssignedTrace` in the `TraceEntry` union. |
| Edge schema doc | `src/types/edgeSchema.ts` | `trades_with` description documents the additive `manifest` property (no new edge type). |
| Rulebook | `Docs/canon/rulebook.md` + `rulebook-quick-reference.md` | New §10 "The World at Work" (former §10 → §11) with `[IMPL]`/`[DESIGN]` flags; matching quick-reference block (the plan ties the card update to the divine economic verbs landing). |
| Tests | `tradeRoute.test.ts`, `strategicActionCandidates.test.ts`, `graphOpExecutor.harvestVerbs.test.ts` | 16 + 6 + 7 tests: manifest derivation/fail-soft, bias helper units + one integration through `generateStrategicCandidates`, staple-only targeting + 0/100 clamps + tier lift + no-staples/missing-location fail-soft. |
| Consciously deferred | THR-669 / THR-670 / THR-617 / THR-626 | Route-event encounter seeds (banditry/embargo/toll — caravans stay route *state*, never simulated agents); cargo-aware route tooltips on HexMapV2 (the WebGL browser-verify pillar); faction economic power + monopoly resolution; army supply coupling to the trade web. |

---

## Rival Schemes (THR-66)

Rivals launch four-phase **schemes** (rumor → materialization → response → crack) on the shipped THR-225 composition phase runner. `phaseRivalActions` decides launch-vs-probe on a rival's action tick, invests world-flags each tick to arm the next phase, and executes each phase's concrete move when the runner activates it. Escalation tier (doom + player thread-tier) gates concurrency/speed/ambition. Counter-play (player presence at target) stalls then fails a scheme, leaving a cool-failure beat.

| Surface | Path | Notes |
|---|---|---|
| Constants | `src/data/rival-scheme-config.ts` | All pacing/escalation numbers: concurrency-by-tier, invest-ticks-by-tier, stall/counter/probe/pressure/hostility weights, escalation blend weights (NFP #1). |
| Content (families) | `src/data/rival-schemes/{types,corruptive,territorial,index}.ts` | `RivalSchemeFamily` = 4 beats × {move, voice, ≥3 prose variants w/ `{rival}`/`{location}`}; baseline register; `eligibleSchemeFamilies(behavior,tier)` gate. Economic family deferred → THR-620 (blocked-by THR-615). |
| Engine (pure) | `src/engine/rival.ts` | `computeRivalEscalationTier` (doom stage × thread `InfluenceTier`, fail-soft to doom-only), `selectRivalScheme` (capacity/cooldown/eligibility/probe gates), `buildRivalScheme` (constructs the `ActiveComposition` + phase-1 arm flags, seeded prose pick), `schemeFlags` (world-flag key helpers). All seeded — no `Math.random()`. |
| Orchestrator phase | `phaseRivalActions` (existing Phase 3 slot, `orchestrator.ts`) | Rewritten: maintain schemes every tick (execute activated-phase moves via `sponsors_scheme` edge / sphere pressure / hostility / crack toast; idempotent via `move-done` world-flags), counter-play detection (`detectSchemeCounter`), invest→arm, completion noting; launch/probe decision every ~10 ticks; rebuild `RivalState.schemes` summary. Runs **after** `phaseComposition` (readiness flags picked up next tick — deterministic 1-tick lag). |
| GameState fields | `types/gameState.ts`, `types/rival.ts` | Additive: `ActiveComposition.{phases?,sponsorRivalId?,schemeFamily?}`; `RivalState.{activeSchemeIds?,lastSchemeLaunchTick?,schemes?}`; new `RivalSchemeSummary` type. Investment counters + readiness/stall/counter flags live in `GameState.worldFlags` (no new scalar fields). |
| Graph edge | `types/graph.ts` + `types/edgeSchema.ts` | `sponsors_scheme` (rival actor → target location), bound at the materialize move, removed on fail. Registered in `EDGE_SCHEMA` (many-to-many). |
| Traces | `types/trace.ts` | `rival.scheme_launched` / `rival.scheme_phase_advanced` (carries `move`) / `rival.scheme_countered` (`stalled`|`failed`) / `rival.scheme_completed`; emitted via a local `emitRivalTrace` helper that casts past `emitTrace`'s `Omit<TraceEntry,…>` common-field collapse. Reuses the runner's `composition.*` traces for the phase-activation half. |
| UI — RivalPanel | `src/components/Game/RivalPanel.tsx` | Scheme cards per active/terminal scheme (family label, 4-phase chip row, Contested/Done badges, struck style on fail) read from `RivalState.schemes` — no new prop. |
| UI — Chronicle | (runner) | The composition runner emits a Chronicle entry per activated phase from the substituted `phase.rationale`; `phaseRivalActions` pushes a cool-failure Chronicle entry on fail. |
| UI — toasts | `phaseRivalActions` | Launch + crack emit an attributed `rival_action` toast; intermediate phases Chronicle-only (interrupt discipline). |
| UI — HexMap overlay | `src/engine/rivalInfluenceMarkers.ts` → `src/components/HexMapV2/scene/RivalInfluenceMesh.ts` | `buildRivalInfluenceMarkers(graph, rivals)` reads `sponsors_scheme` edges → sphere-tinted hex outlines; `rivalInfluenceMarkers` prop (memoized in `GameView.tsx` on graph+`worldVersion`) drives a rebuild-on-change layer in `HexMapV2.tsx` (mirrors `reachSignatureMarkers`; disposed on unmount). |
| Debug | `src/debug-bridge.ts` + `.d.ts` | `__DEBUG.getRivalSchemes()` (from `RivalState.schemes`); `__DEBUG.forceRivalScheme(rivalName, family)` (mutates live state, engine picks up next tick). |
| Player controls | — | None new. The player counters schemes through the existing encounter/divine-action UI (presence at the target). |
| Tests | `src/engine/__tests__/rivalSchemes.test.ts` | 15: escalation monotonicity + fail-soft + purity; eligibility gates; selection (probe/launch/capacity/cooldown); builder; 100-tick lifecycle (≥3 distinct moves, `sponsors_scheme` edge, completion); counter-play (stall→fail→cool-failure). |

---

## Encounter Density & Chapter Ledger (THR-603)

Settles encounter density as **player-authored** (never rationed, gentle doom lean) and builds the surface that makes many concurrent encounters manageable: a persistent, always-readable Chapter Ledger. Resolved encounters are distilled into compact `ChapterRecord`s at cleanup **before** the `RESOLVED_ACTION_RETENTION_TICKS` prune, decoupling readability from retention.

| Surface | Path | Notes |
|---|---|---|
| Types | `src/types/chapterRecord.ts` | `ChapterRecord`/`ChapterStepRecord`/`ChapterParticipant`. Off `unifiedAction.ts` (278 importers) — one-way import in. `outcome?`/`resolved` serve both archived (resolved) + live active chapters. |
| Engine module | `src/engine/chapterArchive.ts` | `buildChapterRecord` (snapshots prose post-`enrichProse()` via `gatherNarrativeContext`/`resolveStepDefinition`, per-step try/caught, fail-soft placeholders); `appendChapters` (cap 2000, batch 100, non-threaded-oldest evicted first); `isEncounterAction` (`getAnyEncounterById ‖ isBranchingTemplate`); `getChapterTemplateName`; `emitChapterArchivedTrace`. Constants `CHAPTER_ARCHIVE_CAP`/`CHAPTER_ARCHIVE_EVICT_BATCH`/`CHAPTER_LEDGER_PAGE_SIZE`. |
| Orchestrator wiring | resolved-action cleanup block in `runTick` (`orchestrator.ts`) | Builds + `appendChapters` for each newly-resolved encounter **before** the prune; one `encounter.chapter_archived` trace per archived chapter (bounded by resolution rate, not agent count). `RESOLVED_ACTION_RETENTION_TICKS` unchanged. |
| GameState field | `chapterArchive?: readonly ChapterRecord[]` in `src/types/gameState.ts` | Optional/additive; missing on old saves = empty ledger (fail-soft). |
| Doom-phase ramp | `CURATION_PHASE_MULTIPLIERS` (`src/engine/encounter/branchingConstants.ts`) | Multiplies `BRANCHING_CURATOR_BIAS_WEIGHT` via `runtime.curationPhaseMultiplier` (added to `SimulationRuntime`, set once/tick in `runTick` from `getJourneyPhase(doomClock.progress)`), read in `computeBranchingCuratorMultiplier`. Set all to 1.0 to disable. |
| UI | `src/components/Game/ChapterLedger.tsx`, `ChapterView.tsx` | Ledger merges active `unifiedActions` + `chapterArchive` (threaded/all filter, paginated); reused embedded in the AgentProfileModal **Chapters** tab (`filterAgentId`). View renders per-step narrative/afterimage in the narrative lexicon (no raw numbers), "you whispered…" choices, complications, aftermath, clickable cast. Mounted in `GameView` + right-sidebar open button; `onOpenEntity`→`openAgentProfileForId`. Memos key on array identity + `runtime.worldVersion`. |
| IA manifest | `src/data/ia-manifest.ts` | `game.chapter-ledger` + `game.chapter-view` (mount `drillin`); `game.agent-profile-modal` reads[] gains `chapterArchive`/`unifiedActions`. |
| Trace category | `src/types/trace.ts` | `encounter.chapter_archived` in `TraceCategory` + `TRACE_CATEGORIES` + typed `ChapterArchivedTrace` member of `TraceEntry`; `curationPhaseMultiplier?` added to `BranchingCuratorNudgeTrace`. |
| Debug | `src/debug-bridge.ts` + `.d.ts` | `__DEBUG.getChapterArchive(filter?)` → `{count, records}` (filter by actor id/name, template id, or participant). |
| CLI | `scripts/cli.ts` | `chapters [agent|@hero]` lists archived + active chapters. |
| Content/canon | manual pages + rulebook + Vision | "Three to six per session" retired as doctrine in `public/encounters-manual-reference.html`, `public/turn-structure-reference.html`, `public/run-lifecycle-reference.html`, `Docs/canon/rulebook.md` §3 + open-Q #4, `Vision/01-core-loop.md` (new Density section; density resolved, stopping-point signal stays open). |
| Tests | `src/engine/__tests__/chapterArchive.test.ts` | 6 tests: eviction policy, encounter-identity predicate, and the load-bearing integration (resolve → archived → readable past retention while the `UnifiedAction` is pruned). |
| Consciously deferred | DebugPanel inline archive list | Redundant with the wired `__DEBUG.getChapterArchive()` (the browser-verify inspection surface) + CLI `chapters`; not worth threading a `chapterArchive` prop through GameView's large prop tree. |
| Pre-existing (not this ticket) | `{actor}`/`{adj}`/`{verb}` placeholders | A few encounter templates use non-standard tokens `enrichProse` doesn't substitute; render literally in the live encounter stage too (identical `enrichProse` path). Content-authoring follow-up (prose-quality / THR-490 domain), out of scope here. |

---

## DebugPanel Prose QA Tab (THR-490)

Dev-only DebugPanel tab that audits the static authored-content library against the shipped THR-472 prose-quality scorer. Reads content tables, not GameState — a pure, deterministic, session-independent report.

| Surface | Path | Notes |
|---|---|---|
| Collector (engine) | `src/engine/content-eval/collectAuthoredProse.ts` (new) | Pure `collectAuthoredProse(): EvalInput[]` — per-table try/catch fail-soft (`::collect-error` synthetic entries), globally deduped entryIds (branching encounters live in two arrays), `mechanicalSummary` excluded. No GameState / tick phase / PRNG. |
| Scorer (reuse) | `src/engine/content-eval/proseQualityScore.ts` | Existing `scoreProseBatch` — no new scoring logic; rubric thresholds stay owned by `src/data/content-eval/proseQualityRubric.ts`. |
| DebugPanel tab | `src/components/Game/debug/DebugTabContent.tsx` | `'prose-quality'` added to `ViewMode` union + `TABS` array (label `Prose QA`, append-only); delegates to `<ProseQualityView>`. |
| Tab component | `src/components/Game/debug/ProseQualityView.tsx` (new) | Imports the pure collector + scorer directly (no `__DEBUG` dependency). Summary band, band/type/id filters, worst-first sortable table (capped `PROSE_TAB_ROW_LIMIT=200`), expandable per-entry flag breakdown with quoted evidence, worst-tail badges. Compute memoized on a refresh nonce (debounced). |
| Debug bridge | `src/debug-bridge.ts` + `src/debug-bridge.d.ts` | `window.__DEBUG.proseQualityReport()` → `ProseQualityBatchResult` and `scoreProseEntry(id)` → `ProseQualityResult \| { error }`. Pure reads, no state mutation. |
| GameState flow | None | v1 reads static content tables, not GameState. |
| Traces | None | Not a tick phase; inspectability delivered via the `__DEBUG` return contract. |
| Docs | `CLAUDE.md` §Debug Bridge, `src/data/ia-manifest.ts` `game.debug-panel` notes | Both list the new tab + `__DEBUG` methods. |
| Tests | `src/engine/content-eval/__tests__/collectAuthoredProse.test.ts` (new) | 7 tests: non-empty corpus, well-formed entries, unique entryIds, multi-type span, no collect-errors, determinism, scorer round-trip. |

---

## DebugPanel Orphaned Cards Tab (THR-659)

Dev-only DebugPanel tab that reports player-castable action templates no run can ever surface — neither a starter, a static beat grant (`collectGrantedActionIds()`), nor a dynamic reach-signature grant (`REACH_SIGNATURE_ID_BY_REACH`). Pure, deterministic, session-independent set arithmetic over static registries — never runs in the tick loop.

| Surface | Path | Notes |
|---|---|---|
| Report module (engine) | `src/engine/content-eval/unreachableActions.ts` (new) | Pure `reportUnreachableActions(): UnreachableActionReport`. `isPlayerReachableTemplate` = `actorAffinities.includes('ascendant')` (the drawer's player-vs-mortal boundary, cited to `targetActions.ts`/`useTargetActions`). Reachable = static beat grant ∪ starter (flag or `STARTER_ACTION_IDS`) ∪ dynamic reach-signature. Fail-soft: coalesces missing fields; a granted-set throw degrades to a loud `warning`, never crashes. No GameState / tick / PRNG. |
| DebugPanel tab | `src/components/Game/debug/DebugTabContent.tsx` | `'orphaned-cards'` added to `ViewMode` union + `TABS` array (label `Orphaned Cards`, append-only) + render branch + import; delegates to `<OrphanedCardsDebugTab>`. |
| Tab component | `src/components/Game/debug/OrphanedCardsDebugTab.tsx` (new) | Imports the pure module directly (no `__DEBUG` dependency). Summary band (unreachable / player-reachable / granted / signatures / starters), id/name filter, capped table (`ORPHANED_TAB_ROW_LIMIT=300`, `id·name·reach·crud`), empty-state + warning row. `data-testid="orphaned-cards-view"` / `"orphaned-cards-row"`. |
| Debug bridge | `src/debug-bridge.ts` + `src/debug-bridge.d.ts` | `window.__DEBUG.listUnreachableActions()` → `UnreachableActionReport` (async, lazy `import()`, mirrors `proseQualityReport`). Pure read, no state mutation. |
| GameState flow | None | Reads static registries (`UNIFIED_ACTION_TEMPLATES`, beat grants, reach signatures, starter ids), not GameState. |
| Traces | None | Not a tick phase; inspectability delivered via the `__DEBUG` return contract (the report object is the inspectable artifact). |
| Tests | `src/engine/content-eval/__tests__/unreachableActions.test.ts` (new) | 9 tests: determinism, sorted-by-id, summary consistency, excludes beat-granted (`divine.persuade`), includes ungranted residual (`loc.fortify`), ascendant-affinity-only entries, excludes dynamic reach-signatures, no happy-path warning. |

---

## Phase 6 — Reward & Attachment Economy Expansion, Slice A (THR-63)

Universal band differentiation for all action templates; `near_miss` as 6th StepOutcome band.

| Surface | Path | Notes |
|---|---|---|
| Types | `src/types/unifiedAction.ts` | `near_miss` added to `StepOutcome` union; `isStepSuccess` extended to include `near_miss`. |
| Types | `src/engine/outcomeConsequences.ts` | `AttachmentDropIntent` interface; `progressCounterDelta` + `attachmentDropIntent` fields on `OutcomeConsequence`; proving-slice gate removed — all 6 bands differentiated for all templates. |
| Constants (11) | `src/engine/outcomeConsequences.ts` | `NEAR_MISS_GROWTH_MULTIPLIER` (0.25), `NEAR_MISS_PROGRESS_COUNTER_DELTA` (0.5), `CRITICAL_SUCCESS_DROP_WEIGHT` (1.5), `SUCCESS_DROP_WEIGHT` (1.0), `SUCCESS_AT_COST_DROP_WEIGHT` (0.4), `NEAR_MISS_DROP_WEIGHT` (0.0), `LOOT_TIER_BY_BAND` record; previous constants retained. |
| Resolution | `src/engine/unifiedActionResolution.ts` | `mapResolverOutcomeToStep`: near-miss success → `near_miss` (was `success_at_cost`). `mapStepOutcomeToRewardOutcome`: `near_miss` case added. `describeStepOutcome`: `near_miss` → "nearly has it". Q delta suffix `(±0.00Q)` appended to `agent_action_resolved` message. `consequence_applied` trace emitted after `computeOutcomeConsequence`. |
| Lifecycle | `src/engine/unifiedActionLifecycle.ts` | `hasAnyCost` in `computeFinalActionOutcome` extended to include `near_miss`. |
| Trace category | `src/engine/traceBuffer.ts` | `consequence_applied` added to `TRACE_CATEGORIES`. |
| Content — narrative | `src/data/narrative-content.ts` | `OUTCOME_BAND_PROSE` record (6 narrative-tag keys: surge/neutral/strained/fortunate/setback/catastrophe). |
| Content — Q flavor | `src/data/quintessence-content.ts` | `OUTCOME_BAND_Q_FLAVOR` record (6 narrative-tag keys). |
| Debug bridge | `src/debug-bridge.ts` + `src/debug-bridge.d.ts` | `window.__DEBUG.consequencesFor(actorRef, last?)` returns last N `consequence_applied` traces for an actor. |
| Tests | `src/engine/__tests__/phase3-outcomeExpansion.test.ts` | 35 tests: updated near_miss/StepOutcome type assertions, advanceStep near_miss propagation, universal band differentiation, attachmentDropIntent shape. |

---

## Event Feed Hygiene — Phase 2.361 Aggregation + Prose Dedup (THR-456)

Same-hex same-tick `agent_encounter` colocation aggregation; phonetic name constraints; prose repetition guard.

| Surface | Path | Notes |
|---|---|---|
| Constants | `src/engine/eventAggregation.ts` | `EVENT_AGGREGATE_MIN_GROUP_SIZE` (3), `AGGREGATE_SIGNIFICANCE_BOOST` (0.1). |
| Types | `src/types/gameState.ts` | `aggregatedFromIds?: readonly string[]` on `TickEvent` — omitted on non-aggregated events. |
| Trace types | `src/types/trace.ts` | `EventAggregationTrace`, `AggregationSkippedTrace`, `PhoneticConstraintRejectTrace`, `WandererFallbackTrace`, `EliteNamingTrace` interfaces + union entries. |
| Phrase pool | `src/data/event-aggregation-content.ts` | `AGGREGATE_PHRASE_POOL_MIN` (15), `ALL_AGGREGATE_PHRASES` (19 entries across small/medium/large crowd-size pools), `getAggregatePhrasePool(size)`. |
| Aggregation module | `src/engine/eventAggregation.ts` | `aggregateColocationEvents(events, rng, tick, resolveLocationName)` — O(n) group-by-hex, collapses groups ≥ `MIN_GROUP_SIZE` into one synthesised event. Fail-soft: returns original array on any error. |
| Orchestrator wiring | `src/engine/orchestrator.ts` | Phase 2.361 registered immediately after Phase 2.36; aggregation RNG seeded from `state.tick * 59` (prime to avoid harmonic aliasing); hex-location index built once per tick; `aggregateColocationEvents` called on `tickEvents` before push. |
| Phonetic constraints | `src/engine/culturePhonetics.ts` | `NAME_MAX_SYLLABLES` (4), `NAME_MAX_CONSONANT_CLUSTER` (2), `NAME_MAX_VOWEL_RUN` (2). `countSyllables`, `hasConsonantClusterLongerThan`, `hasVowelRunLongerThan` guard functions; checks applied in `generatePhoneticName` before returning. |
| Name fallback | `src/data/culture-name-pools.ts` | `WANDERER_FALLBACK_BANNED_PATTERNS` regex, `FATAL_FALLBACK_NAMES` (5 safe names), `synthesizeFallbackName(sphere, rng)` replaces `Wanderer-N` last resort. `pickCulturalName` validates output against banned patterns. |
| Elite naming | `src/engine/lairEscalation.ts` | `createNamedElite` uses `pickCulturalName('chaos', sphere, mulberry32(hashStringSeed(lairId)), usedNames)` — deterministic per lair, never `Elite of Lair N`. `roleLabel: 'Elite'` added to node properties. |
| Prose repetition guard | `src/engine/proseSelection.ts` | `PhraseEntry { phraseId, text }` type; `PROSE_REPETITION_GUARD_WINDOW` (6); `pickWithRepetitionGuard(pool, rng, usedIds)` — prefers fresh entries, falls back to full pool when all used. |
| Dilemma prose | `src/data/narrative-content.ts` | `DilemmaProseEntry` type replaces `string[]`. 12 entries/sub-pool (was 2), unique `phraseId` per entry. Sentence-start casing bug fixed. |
| Orchestrator dilemma pick | `src/engine/orchestrator.ts` | `dilemmaProseUsed: Set<string>` created per `phaseDilemmaDetection` invocation; `pickWithRepetitionGuard` used instead of random index. |
| Tests | `src/engine/__tests__/eventAggregation.test.ts`, `culturePhonetics.constraints.test.ts`, `src/data/__tests__/culture-name-pools.fallback.test.ts`, `src/engine/__tests__/proseSelection.test.ts`, `src/testing/__tests__/narrativeContent.casing.test.ts`, `src/testing/__tests__/event-aggregation-content.lint.test.ts` | 8 + 10 + 6 + 8 + 1 + 4 = 37 tests. |

---

## Story-so-far Digest (THR-455)

"Story so far" narrative panel in ThreadDetailView, replacing RecentActivityLog when `STORY_SO_FAR_DIGEST_ENABLED`.

| Surface | Path | Notes |
|---|---|---|
| Constants (12) | `src/data/attention-constants.ts` | `STORY_DIGEST_LOOKBACK_TICKS`, `STORY_DIGEST_MAX_BEATS`, `STORY_DIGEST_MIN_BEATS`, `STORY_DIGEST_CACHE_SIZE`, 5 `BEAT_SIG_*` weights, `BEAT_SIG_PIVOT_MIN`, `TENSION_DEBT_AGE_TICKS`, `STORY_SO_FAR_DIGEST_ENABLED`. |
| Types | `src/types/attention.ts` | `TensionKind` union (6 values); `ThreadStoryComposedTrace` interface. |
| Engine module | `src/engine/threadDigest.ts` | `selectBeats`, `resolveCurrentTension`, `composeThreadStory`, `seededPickFromPool`. `BeatRole`, `SelectedBeat`, `CurrentTension`, `ThreadStoryComposition` types. |
| Content tables | `src/data/thread-digest-content.ts` | `BEAT_TEMPLATES` (192 templates), `TENSION_TEMPLATES` (18), `TRANSITION_PHRASES` (16), `EMPTY_THREAD_LINES` (3). |
| SimulationRuntime | `src/engine/simulationRuntime.ts` | `threadStoryCache: Map<string, ThreadStoryComposition>` — LRU keyed by `agentId\|worldVersion`. Not cleared by `touchStructure()` (worldVersion key auto-expires stale entries). |
| Hook | `src/components/Game/hooks/useThreadStorySoFar.ts` | `useThreadStorySoFar(graph, agentId, tick, digestBuffer, runtime?)` — useMemo on `[agentId, worldVersion, currentTick]`; reads/writes `runtime.threadStoryCache` with LRU eviction at `STORY_DIGEST_CACHE_SIZE`. |
| UI component | `src/components/Game/StorySoFarPanel.tsx` | Renders tension line + "Story so far" divider + beat rows. Empty state shown when `isEmpty`. |
| ThreadDetailView wiring | `src/components/Game/ThreadDetailView.tsx` | `useThreadStorySoFar` hook call after `recentEntries` memo; both `RecentActivityLog` mounts swapped to `StorySoFarPanel` behind `STORY_SO_FAR_DIGEST_ENABLED` flag. |
| Debug bridge | `src/debug-bridge.ts` + `src/debug-bridge.d.ts` | `window.__DEBUG.getThreadStory(agentRef)` + `_registerThreadStoryProvider`. |
| CMS tunable constants | `src/components/CMS/tunableConstants.ts` | All 12 constants registered in Attention group. |
| IA manifest | `src/data/ia-manifest.ts` | `game.thread-detail-view` reads[] extended with `digestBuffer` and `runtime.threadStoryCache`. |
| Tests | `src/engine/__tests__/threadDigest.test.ts`, `threadDigest-content.test.ts`, `src/components/Game/__tests__/StorySoFarPanel.test.tsx` | Engine unit tests, content integrity tests (192+18 templates), panel render tests. |

---

## Encounter Surface Foundation (THR-475)

Surface identity layer for encounter novelty: recency now tracks a template bound to context, not the template ID alone.

| Surface | Path | Notes |
|---|---|---|
| Constants + key derivation | `src/engine/encounterSurface.ts` | `SURFACE_KEY_AXES`, `SURFACES_PER_RUN_TARGET`, `RELEVANT_FRACTION`, `RUNS_BEFORE_REPETITION`; `computeSurfaceKey(entry)` canonical sorted serializer; `getSurfaceAxisValues(entry)` for trace/UI introspection. |
| Cache entry field | `src/engine/encounterCache.ts` | `targetAgentRole?: string \| null` on `EncounterCacheEntry` — social-role axis input, additive/fail-soft. |
| Social candidate wiring | `src/engine/socialEncounterGeneration.ts` | Pre-resolves `targetAgentRole` from NPC role during social candidate generation; null fallback when absent. |
| Novelty scoring | `src/engine/encounterScoring.ts` | `computeNoveltyMultiplier` call site now uses `surfaceKey`; `ScoredCandidate.surfaceKey`; trace payload adds `surfaceKey` per top candidate plus `selectedSurfaceKey`, `selectedSurfaceAxes`, `selectedNoveltyMultiplier`. |
| Novelty bump site | `src/engine/phaseAgentDecision.ts` | `agentNoveltyLastSelected` and `encounterNoveltyRecord.globalLastSelected` now write `surfaceKey` instead of `templateId`. Category quota bookkeeping stays reach-keyed. |
| Debug visibility | `src/components/Game/debug/DecisionBreakdown.tsx`, `src/debug-bridge.ts`, `src/debug-bridge.d.ts` | Debug panel shows selected `surfaceKey`, axis bindings, and selected novelty multiplier; `window.__DEBUG.getEncounterNoveltyRecord()` exposes the surface-keyed record. |
| Deterministic model script | `scripts/encounter-volume-model.ts`, `package.json`, `Docs/playtests/coverage/YYYY-MM-DD-encounter-volume-model.{md,json}` | `npm run volume-model` emits dated md+json output; two same-day runs must hash-identically. |
| Tests | `src/engine/__tests__/encounterSurface.test.ts`, `src/engine/__tests__/encounterScoring.novelty.test.ts`, `src/components/Game/debug/__tests__/DecisionBreakdown.test.tsx`, `src/engine/__tests__/regression/encounter-health.regression.test.ts` | Key determinism/order-stability/bounded-cardinality tests; novelty integration updated to surface-key semantics; debug panel surface metadata assertions; regression note updated for THR-475 crit-rate recalibration. |

## Template Novelty Pressure (THR-453)

Multiplicative novelty penalty applied in `scoreAndSelect` to break template-repetition monopolies. Transparent to content authors — no template fields added.

| Surface | Path | Notes |
|---|---|---|
| Constants | `src/data/agent-behavior-constants.ts` | 8 `NOVELTY_*` constants: `NOVELTY_GLOBAL_HALF_LIFE_TICKS`, `NOVELTY_GLOBAL_MAX_PENALTY`, `NOVELTY_AGENT_HALF_LIFE_TICKS`, `NOVELTY_AGENT_MAX_PENALTY`, `NOVELTY_COMBINED_CAP`, `NOVELTY_CATEGORY_SOFT_LIMIT`, `NOVELTY_CATEGORY_WINDOW_TICKS`, `NOVELTY_CATEGORY_RAMP_FACTOR`. |
| Interface | `EncounterNoveltyRecord` in `src/engine/encounterScoring.ts` | `globalLastSelected: Record<templateId, tick>`, `categoryWindowCounts: Record<reach, count>`, `categoryWindowTotal: number`, `categoryWindowStart: tick`. |
| GameState field | `encounterNoveltyRecord?: EncounterNoveltyRecord` in `src/types/gameState.ts` | Optional; missing = no penalties (fail-soft). |
| Scoring functions | `computeGlobalNoveltyPenalty`, `computeAgentNoveltyPenalty`, `computeNoveltyMultiplier` in `src/engine/encounterScoring.ts` | Pure, exported. `computeNoveltyMultiplier` combines both signals + category quota and floors at `1 − NOVELTY_COMBINED_CAP`. |
| `scoreAndSelect` wiring | `src/engine/encounterScoring.ts` | `noveltyMultiplier` applied after `curatorMultiplier`; `noveltyChangedSelection` / `preNoveltyWinnerId` computed via pre/post comparison for trace. |
| Bump site | `src/engine/phaseAgentDecision.ts` | Mutable `noveltyRecord` shallow-cloned from `state.encounterNoveltyRecord` at tick start; `globalLastSelected[templateId]`, `categoryWindowCounts[reachPrimary]`, `categoryWindowTotal` written at encounter commit alongside familiarity bump; `categoryWindowStart` rolled forward when age ≥ `NOVELTY_CATEGORY_WINDOW_TICKS`; `touchWorld(runtime)` called; `encounterNoveltyRecord: noveltyRecord` returned in `Partial<GameState>`. |
| Trace extensions | `src/types/trace.ts` | `noveltyMultiplier?: number` per top-candidate entry in `ScoringTrace`; `noveltyChangedSelection?: boolean` and `preNoveltyWinnerId?: string` on `ScoringTrace`. |
| Tests | `src/engine/__tests__/encounterScoring.novelty.test.ts` | 15 tests — `computeGlobalNoveltyPenalty` (5), `computeAgentNoveltyPenalty` (3), `computeNoveltyMultiplier` (4), `scoreAndSelect` integration (3). |

---

## Player Action Progression — Slice 2b milestone breadth beats (THR-613)

Axis B (palette **breadth**), the companion to Slice 1's Axis A (reach **depth**). When the god's holdings cross a named threshold, a **Milestone beat** fires — and unlike a Deepening it **grants a card**, because breadth is the axis where a new verb is the honest reward.

| Surface | Path | Notes |
|---|---|---|
| Source counter | `countControlledSources(graph, ascendantId)` in `src/engine/essenceSources.ts` | Pure read → `{ total, flowering }`; walks the ascendant's `controls` edges. Never writes tiers — `phaseEssenceSources` runs earlier in the tick and owns the recompute, so the tiers read here are fresh. Fail-soft: unknown ascendant / bagless host → not counted. |
| Orchestrator phase | Axis-B branch inside the existing `phaseAscendantProgression` (`src/engine/phaseAscendantProgression.ts`) | **No new phase.** Enqueues `beat.milestone.the_wellspring_flows` into `ascendantBeats.pending` at `MILESTONE_SOURCES_FOR_BEAT` sources **or** the first `flowering` source. Runs only when a Deepening did not take the slot this tick (Deepening wins; the milestone is threshold- not edge-based, so it re-detects next tick). Rides the `pending` slot → **Beat Director untouched**. |
| Node property bag | `AscendantProperties.milestoneBeatsFired?` in `src/types/influence.ts` | Additive `readonly string[]`; no new node/edge type. Recorded at **enqueue**, not on resolution — a beat that is offered but dismissed must not re-fire every tick, and a count that dips then recovers must not re-trigger. |
| Beat kind | `'milestone'` added to `BeatKind` (`src/types/ascendantBeat.ts`); presentation entry in `AscendantBeatModal.tsx` `KIND_PRESENTATION` (the record is exhaustive over `BeatKind`) | Slice 3 surfaces the authored `MILESTONE_BEAT_PRESENTATION` in place of the generic copy (same staging as Deepening). |
| Content catalogue | `src/data/ascendant-milestone-beats.ts` | `ASCENDANT_MILESTONE_BEATS` + `getMilestoneBeatById` + `MILESTONE_BEAT_PRESENTATION` + `milestoneChronicleProse`. Consulted by `findBeatDefinition` / `forceOfferBeatById` (`ascendantBeat.ts`) so an enqueued milestone **resolves** (records a `BeatRecord`) instead of skipping as `missing_template`. |
| Unlock catalogue | `ASCENDANT_ACTION_BUCKETS` + `collectGrantedActionIds()` (`src/data/ascendant-beat-content.ts`) | Grants `loc.open_markets` (`unlockable-generic`) — a shipped Gold economy card no beat previously granted, hence unreachable under the empty THR-501 starter floor. `collectGrantedActionIds` now includes the milestone catalogue so the existing bucket drift-guards cover it. **Rule:** a milestone grant must never duplicate another beat's (re-revealing a held card is a fake reveal) — contract-tested. |
| Constants | `src/data/player-progression.ts` | `MILESTONE_SOURCES_FOR_BEAT` (3), `MILESTONE_FLOWERING_FOR_BEAT` (1), `MILESTONE_SOURCE_BEAT_ID`. |
| Trace category | `src/types/trace.ts` | `ascendant.progression.milestone_enqueued` in `TraceCategory`, `TRACE_CATEGORIES`, and the `TraceEntry` union (`MilestoneEnqueueTrace`, carries `sourceCount`/`floweringCount` — the counts that fired it). |
| Debug | existing `__DEBUG.fireBeat(beatId)` | `fireBeat('beat.milestone.the_wellspring_flows')` force-offers the beat for browser-verify without farming three sources first. |
| Tests | `src/engine/__tests__/phaseAscendantMilestone.test.ts` | 16 tests: both thresholds, below-threshold silence, once-per-run dedup across ticks, Deepening priority, spine/pending gating, catalogue resolution, no-fake-reveal guard. |
| Deferred | THR-656 | Art for `loc.open_markets` (renders a placeholder icon; cosmetic only). |

---

## Player Action Progression — Slice 3b-tail Codex three-state grammar (THR-613)

The §5.B locked-state grammar (Held / Within-reach / Another-life), rendered in the **Codex** — not the live drawer (design gate 2026-07-18: flood-control + `getTargetActionSlots` blast radius). Read-only over live state; no GameState field, phase, or trace.

| Surface | Path | Notes |
|---|---|---|
| State logic | `codexEntryRunState` + `buildCodexRunContext` (`src/components/Codex/codexRunState.ts`, new) | Pure. Context = domains from `getAscendantProgress` (same read the Reaches/Signatures readouts use) + `unlockedActionIds`. State reuses the shipped `SignaturePathState` + `SIGNATURE_STATE_COPY`. **Lock keys on `requiresReach`, never the `reach` tag** → universal cards never mis-greyed. Returns `null` for non-ascendant entries. |
| Registry | `CodexEntry.requiresReach` + `isAscendantAction` (`codexRegistry.ts`); `invest.*` signatures folded into the `divine` category | The eight reach signatures were absent from the Codex — cataloguing them is what makes "Another life" legible. |
| UI | `Codex.tsx` optional `runContext`/`initialStateFilter`/`embedded`/`onClose`; per-card badge + dim in `CodexCard.tsx`; state-filter chip row | Standalone `?view=codex` (no runContext) is byte-unchanged. |
| In-game mount | Lazy `Codex` overlay in `GameView.tsx` (`codexOpen`/`openCodex`, `role="dialog"`, zIndex 60, own chunk) | Full-screen overlay; the game view stays mounted beneath. |
| Player control | Entry points: `AscendantSheet` ("Browse the path codex →", closes sheet first) + `SignaturesBlock` ("What you could still become →"), both → `onOpenCodex('acquirable')` | Threaded `onOpenCodex` through `AscendantBar`. |
| Manual | `public/divine-actions-reference.html` — player section + Designer Note | |
| Tests | `codexRunState.test.ts` (10) | Lock-on-requiresReach, universal-never-locked, held/acquirable partition, non-ascendant null, registry integration (signatures catalogued + partitioned). |

---

## Player Action Progression — Slice 4 Covenants (THR-613)

Axis C (**sustained commitment**): the god sees what it *holds* — its active sustained controls — and can release them. First player→tick-loop write path on the ascendant bar.

| Surface | Path | Notes |
|---|---|---|
| GameState field | `pendingControlReleases?: string[]` in `src/types/gameState.ts` | Additive, optional (missing = empty queue, fail-soft). Holds effectIds queued by the UI, mirroring `pendingChoiceCommits`. |
| Orchestrator phase | Release consumption inside existing `phaseControlEffects` (`src/engine/phaseControlEffects.ts`) | **No new phase.** At the top of the active-effect loop, a queued id lapses the effect `voluntarily_released` (pays nothing more, frees its slot), emits `ControlReleaseTrace`, pushes a `control_effect_lapsed` tick event; queue cleared in the return. Fail-soft: dangling ids with no effect clear the queue anyway (incl. the empty-`controlEffects` early-return). A contested effect (`encounterNodeId` set) is abandoned. |
| Constant | `CONTROL_RELEASE_EVENT_SIGNIFICANCE` (0.5) in `phaseControlEffects.ts` | Tick-event significance for a deliberate release (quieter than a 0.7 forced lapse). |
| Trace category | `ascendant.progression.control_release` (`src/types/trace.ts`) | Already declared as groundwork (`ControlReleaseTrace`, `{controlId, contested}`); emitted here for the first time. |
| UI selector | `selectCovenantRows(gameState)` in `src/components/Game/ascendant-bar/selectors.ts` | Pure; the god's own active controls, hiding ids already in `pendingControlReleases` (optimistic). Resolves target → node name (fail-soft to hex); prose-first upkeep (cost/income/free), never a raw float. |
| UI component | `CovenantsBlock.tsx` (new) + folded `Covenants` `BarSection` in `AscendantBar.tsx` (`covenants:false` default) | Lists each covenant (title = `narrativeTemplates.active`, target, upkeep, contested badge) + a **Release** button. Copy in `src/data/ascendant-bar-content.ts` (`COVENANT_*`). |
| Player control | `onReleaseControl(effectId)` → `setGameState` push to `pendingControlReleases` (`GameView.tsx`) | The bar's only player-mutating control; the tick loop applies it next tick. |
| Debug | `__DEBUG.listControlEffects()` + `.releaseControl(id)` (`debug-bridge.ts` + `.d.ts`) | Read the god's covenants + queue; headless enqueue for browser-verify. |
| Tests | `phaseControlEffects.test.ts` (5) + `covenantRows.test.ts` (11) | Release lapse/no-charge/queue-clear/isolation/empty-fail-soft; selector target-resolution, upkeep classification, contested, ownership, optimistic-hide. |

---

## Player Action Progression — Slice 1 engine substrate (THR-613)

God-side capability growth: the ascendant's Domain Capability tier rises in-run as it acts in its two permanent reaches, and crossing a tier fires a **Deepening beat** through the shipped Ascendant Beat Director. Slice 1 is the engine substrate only — the ActionDrawer three-state locked grammar, ascendant-bar tier readout, Deepening modal, and Covenants panel are Slices 3–4.

| Surface | Path | Notes |
|---|---|---|
| Accrual hook | `accruePlayerReachPractice()` in `src/engine/phaseAscendantProgression.ts`, called in the uncontested-completion loop of `phaseUnifiedActionProgress` (`src/engine/unifiedActionResolution.ts`) | Fires when `completing_action.actorId === state.ascendantId` and the action resolved; grows `ascendant.properties.reachPractice[reach]` only for an in-domain reach (gated on `domainAffinities`); fail-soft no-op otherwise. |
| Capability feed | `computeRawScore()` in `src/engine/domainCapability.ts` | One added additive term: `+ (node.properties.reachPractice?.[domain] ?? 0)`. Only the ascendant carries the bag → purely additive for every other node (same sigmoid, one source of truth). |
| Orchestrator phase | `phaseAscendantProgression(state)` in `src/engine/phaseAscendantProgression.ts`, called inline in `runTick` (`orchestrator.ts`) **immediately before** `phaseAscendantBeatDirector` | Pure `(state) → Partial<GameState>`; `phaseEventCounts['ascendant_progression']`. Detects upward tier crossings vs `reachTierSnapshot`; sets `ascendantBeats.pending` to a Deepening beat so the Director (which skips on `pending`) yields — **zero Director change** (mutex-safe with THR-611). Fail-soft `{}` when no ascendant / no affinities. |
| Node property bags | `AscendantProperties.reachPractice?` + `reachTierSnapshot?` in `src/types/influence.ts` | Additive; no new node/edge type. Snapshot seeds silently from the live tier on first phase run (no spurious beat). |
| Beat kind | `'deepening'` added to `BeatKind` (`src/types/ascendantBeat.ts`); presentation entry in `AscendantBeatModal.tsx` `KIND_PRESENTATION` | Beat id `beat.deepening.<reach>` (`deepeningBeatIdForReach`). Slice 2 authors the matching `UnifiedActionTemplate` content per reach. |
| Constants | `src/data/player-progression.ts` | `PLAYER_PRACTICE_PER_ACTION`, `PLAYER_DIMINISHING_RETURNS_FACTOR`, `SECONDARY_REACH_PRACTICE_MULT`, `DEEPENING_BEAT_MAX_PER_TICK`, `PLAYER_PRACTICE_ENCOUNTER_SHAPE`/`MILESTONE_SOURCES_FOR_BEAT` (reserved, Slice 2). Surfaced in the CMS constants registry (`registry.ts` `player-progression-constants`). |
| Trace categories | `src/types/trace.ts` | `ascendant.progression.practice` / `.tier_up` / `.deepening_enqueued` (emitted) + `.control_release` (declared, emitted by Slice 4) — in `TraceCategory`, `TRACE_CATEGORIES`, and `TraceEntry` union with typed interfaces. |
| Debug | `src/debug-bridge.ts` + `.d.ts` | `__DEBUG.getAscendantProgression()` → `{ reaches:[{reach,isPrimary,rawPractice,capability,tier,snapshotTier,pendingDeepening}], pendingBeatId }` (read-only). |
| Tests | `src/engine/__tests__/phaseAscendantProgression.test.ts` | 11 tests: snapshot seeding, tier crossing → exactly one enqueue (Done-when), one-per-tick cap when both cross, spine/pending gating, fail-soft, accrual growth + off-domain gate + secondary lag, debug readout. |
| Deferred (later slices) | Content + UI | Slice 2: 8 Deepening beat templates + milestone/discovery breadth beats (coord. THR-611). Slice 3: ActionDrawer three-state grammar + ascendant-bar tier readout + Deepening modal wiring. Slice 4: Covenants panel + `release_control` op. |

---

## Ascendant Beat Director (THR-500)

Foundation for *Ascendant Beats* — encounters addressed to the player-god. The Director decides which beat to **offer** each turn (spine-first, then cadence-gated seeded pool); it never resolves. Resolution flows through the existing encounter pipeline; the `unlock_action` aftermath effect turns a resolved beat into a revealed player action card.

| Surface | Path | Notes |
|---|---|---|
| Orchestrator phase | `phaseAscendantBeatDirector` in `src/engine/ascendantBeat.ts`, called inline in `runTick` (`orchestrator.ts`) after the `post-doom` slot, before `phaseComposition`/encounter resolution | Pure `(state, rng)` → `Partial<GameState>`; `beatRng = mulberry32(seed + tick*59 + 503)`. No-ops to `{}` when `ascendantBeats` is absent (fail-soft). |
| GameState field | `ascendantBeats?: AscendantBeatState` in `src/types/gameState.ts` | Optional/additive; init `createInitialAscendantBeatState()` in `gameInit.ts`. |
| Types | `src/types/ascendantBeat.ts` | `AscendantBeatState`, `PendingBeat`, `BeatRecord`, `BeatKind`, `BeatTrigger`, `BeatDefinition`. |
| Constants + catalogue | `src/data/ascendant-beat-content.ts` | `BEAT_BASE_INTERVAL`, `BEAT_INTERVAL_JITTER`, `BEAT_MIN_GAP`, `BEAT_MAX_PENDING`, `SPINE_TRIGGER_TURNS`, `BEAT_KIND_WEIGHTS`; `ASCENDANT_SPINE` (minimal turn-gated) + empty `ASCENDANT_BEAT_POOL` (foundation). |
| Aftermath effect | `unlock_action` in `EncounterAftermathReactionEffect` (`src/types/unifiedAction.ts`); resolved in `encounterAftermath.ts` | Grows the existing run-scoped `unlockedActionIds` (reused, **not** renamed); drawer reveals it via `isActionRevealed()` — no drawer change. Idempotent; fail-soft on unknown id. |
| Trace categories | `src/types/trace.ts` | `ascendant.beat.scheduled` / `.offered` / `.skipped` / `.resolved` / `.seeded` (THR-520) + `action.unlock.granted` — in `TraceCategory`, `TRACE_CATEGORIES`, and `TraceEntry` union with typed interfaces. |
| Resolution helper | `resolveAscendantBeat()` (exported) | Clears `pending`, appends `BeatRecord`, emits `ascendant.beat.resolved`. Called by the encounter/UI resolution path wired in follow-up issues. |
| Tests | `src/engine/__tests__/ascendantBeat.test.ts` | 11 tests: offer/skip/fail-soft/spine-hold, trigger eval, `drawFromPool`, `resolveAscendantBeat`, `unlock_action` grow + idempotency, trace registration. |
| Deferred (later child issues) | UI pillar | World-view beat notification, card-flight unlock reveal, selection picker, ~~DebugPanel beat tab~~ (delivered THR-507, below), hex throne signifier/pulse — not in this foundation. |

---

## Ascendant Beat debug controls + Beats tab (THR-507)

The inspection/test surface for the Director — headless `window.__DEBUG` controls plus a live DebugPanel tab. Delivers the deferred "DebugPanel beat tab" from THR-500. Self-contained: the tab reads via the four `__DEBUG` fns (mirrors `ActionUnlocksView`), so no GameState prop plumbing through `DebugPanel`/`DebugTabContent`.

| Surface | Path | Notes |
|---|---|---|
| Engine helper | `forceOfferBeatById(beats, beatId, turn)` in `src/engine/ascendantBeat.ts` | Reuses the Director's internal `offer()` (same scheduled/offered traces). Advances `spineCursor` only when firing the cursor's beat; pool beats fire with a `cadence` trigger. Returns `null` for unknown ids. |
| Debug bridge (read-only) | `__DEBUG.listBeats()` + `__DEBUG.beatSchedule()` (`src/debug-bridge.ts` + `.d.ts`) | `listBeats` = catalogue (spine+pool, kind/trigger/grants/weight). `beatSchedule` = live snapshot (turn, spineCursor/length, nextSpineBeatId, lastBeatTurn, pending, eligible pool, `runUnlockedActionIds`, history) via `_gameStateProvider` + dynamic `ascendant-beat-content` import. |
| Debug bridge (mutating) | `__DEBUG.fireBeat(beatId)` + `__DEBUG.grantUnlock(actionId)` → new `_beatBridge` registered by `GameView` (`_registerBeatBridge`) | `fireBeat` → `forceOfferBeatById` + `setGameState`. `grantUnlock` pushes into existing `unlockedActionIds` + emits `action.unlock.granted` (`via: 'debug'`). No-op fail-soft when game not loaded. |
| DebugPanel tab | `'beats'` added to `ViewMode` + `TABS` (label `Beats`) in `src/components/Game/debug/DebugTabContent.tsx`; component `src/components/Game/debug/BeatsDebugTab.tsx` | Renders Director state / pending beat / fire+grant controls / run-unlock list / spine catalogue (▶ cursor marker) / pool / history. Re-reads on `currentTick` change. `data-testid="beats-debug-tab"`. |
| Tests | `src/engine/__tests__/ascendantBeat.test.ts` | +3: force-offer + trace emission, cursor-advance-only-at-cursor, unknown-id → null. |

---

## Beat resolve path — offer→enter→resolve (THR-517)

Closes the loop the Director (THR-500) left open: the Director only *offers* (`pending`); this is what resolves it in the running sim — apply grants → `unlockedActionIds`, record `BeatRecord`, clear `pending`. Plus the player-facing enter surface + selection picker + a headless resolve control.

| Surface | Where | Notes |
|---|---|---|
| Engine resolve fn | `resolvePendingBeat(state, {chosenActionId?, outcome?}, templateResolver?)` in `src/engine/ascendantBeat.ts` | Looks pending beat up (spine∪pool∪delivery via new exported `getBeatDefinitionById`); applies grants into `unlockedActionIds` (dedup, `action.unlock.granted` via beat per id); records `BeatRecord` + clears `pending` via the existing pure `resolveAscendantBeat`. Selection → exactly one `chosenActionId`; else all grants. Returns `{state, resolved, beatId, grantedActionIds, outcome, message}`. Engine stays registry-free — `templateResolver` injected by the UI. |
| Fail-soft | `ascendant.beat.skipped` reason `'missing_template'` (union extended in `src/types/trace.ts`) | Unknown beat def / unresolvable `templateId` → clears `pending` gracefully (no wedge). Whole body try/caught → `engine_warning`, leaves pending on throw. |
| UI modal | `src/components/Game/AscendantBeatModal.tsx` (new) — `AscendantBeatModal` + `AscendantBeatOfferBanner` | Rendered in `GameView` JSX (near `StoryBeatModal`). Spine beats auto-open (`useEffect` on `pendingBeat?.beatId`, gated by `interruptsSuppressed`, non-dismissable); pool beats show the top-center offer banner (z-40) → click `setBeatEntered(true)`. Modal: kind-derived prose + Receive CTA (non-selection) or choose-1-of-N picker (selection). `data-testid`: `beat-resolve-button`, `beat-selection-picker`, `beat-offer-banner`. |
| GameState consumer | `gameState.ascendantBeats.pending` → `pendingBeat` in `GameView`; `handleResolveBeat(chosenActionId?)` → `resolvePendingBeat` → `setGameState` | Grants land in the drawer automatically (it already filters on `unlockedActionIds`). |
| Debug control | `__DEBUG.resolveBeat(chosenActionId?)` (`DebugResolveBeatResult` in `src/debug-bridge.{ts,d.ts}`, `BeatBridge` + `_registerBeatBridge` shapes) → GameView beat bridge | Headless resolve of the pending beat (same engine path). BeatsDebugTab adds an "Enter & Resolve" control (chosen-action input for selection beats). |
| Tests | `src/engine/__tests__/ascendantBeat.test.ts` | +7: grant-all + history + traces, selection needs-choice / grants-one / rejects-bad-choice, no-duplicate-grant, no-op-when-empty, fail-soft unknown-beat + templateId-resolver-false → `missing_template`. |
| Deferred | prose-rich encounter-screen handoff for template-backed beats (THR-514) | Today the modal renders kind-derived placeholder prose; delivery/template beats resolve as grant-only/acknowledge until the encounter-screen path lands. |

This delivers the THR-500 "Deferred (UI pillar)" items: world-view beat notification, selection picker, resolve path. Remaining deferred there: card-flight unlock reveal (the drawer simply updates today) + hex throne signifier/pulse (THR-502 shipped the seat signifier; beat-bound hex pulse is THR-514).

---

## Delivery-beat adapter (THR-506)

Hosts THR-452's normally-unreachable branching encounters as `delivery` beats — divine visions the Director offers directly, sidestepping the encounter's mortal-pathing prereqs. The adapter is the bridge from the registered branching catalogue to the Director's draw pool.

| Surface | Path | Notes |
|---|---|---|
| Adapter module | `src/engine/deliveryBeatAdapter.ts` | `branchingEncounterToDeliveryBeat()` maps a branching `UnifiedActionTemplate` → `delivery` `BeatDefinition` (`beat.delivery.<sourceId>`, `templateId`=source, cadence trigger, `DELIVERY_BEAT_WEIGHT`). `ALL_DELIVERY_BEATS` built from `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`. `eligibleDeliveryBeats(deliveredBeatIds)` = dedup-against-history gate. `deliveryBeatIdFor` / `sourceTemplateIdOf` / `getDeliveryBeatById` helpers. |
| Constant | `DELIVERY_BEAT_WEIGHT` (0.1) in `deliveryBeatAdapter.ts` | Per-beat draw weight (× `BEAT_KIND_WEIGHTS.delivery`); normalises the 23-entry group to ~10% of pool draws. |
| Director draw | `phaseAscendantBeatDirector` cadence branch (`src/engine/ascendantBeat.ts`) | Draws from `[...ASCENDANT_BEAT_POOL, ...eligibleDeliveryBeats(history.map(h=>h.beatId))]`. Base pool stays delivery-free (THR-505 tests unchanged). `forceOfferBeatById` extended to host delivery beats. |
| Trace field | optional `templateId` on `BeatScheduledTrace` / `BeatOfferedTrace` (`src/types/trace.ts`); emitted in `offer()` | Names the wrapped branching encounter so traces (and the future resolve path) identify the divine vision's source. |
| Debug bridge | `__DEBUG.listBeats()` adds `source: 'delivery'` + `templateId`; `beatSchedule().eligiblePool` includes eligible delivery beats (`src/debug-bridge.ts` + `.d.ts`) | Honest snapshot of the merged draw set. |
| CLI control | `beat` command in `scripts/cli.ts` (`status` / `list [delivery]` / `fire <beatId>`) | Headless equivalent of `__DEBUG.fireBeat`; `beat fire` prints the offered beat's source `templateId` + traces (the Done-when demonstration). |
| Tests | `src/engine/__tests__/deliveryBeatAdapter.test.ts` | 9: mapping, id round-trip, eligibility dedup, merged-pool reachability, force-offer trace carries source `templateId`. |
| Deferred | offer→enter→resolve path (THR-514) | Until THR-514, delivery beats fire via force-offer (CLI/`__DEBUG`); the merged-pool wiring means they fire naturally once resolution lands. Draw-time identity bias + per-beat eligibility predicates landed in THR-516 (below). |

---

## Director pool draw — eligibility predicates + identity bias (THR-516)

Closes the THR-505 deferral: the shipped `drawFromPool(pool, rng)` took no world state, so the Director could neither drop a beat with nothing to say nor weight toward the god's identity. The cadence branch now **filters by eligibility then draws weighted by ascendant identity**.

| Surface | Path | Notes |
|---|---|---|
| Type fields | `BeatEligibility`, `BeatIdentityBias`, + optional `eligibility?` / `identity?` on `BeatDefinition` (`src/types/ascendantBeat.ts`) | Serializable descriptors (NFP #3). Omitted = always eligible / unbiased — fully backward-compatible. |
| Eligibility eval | `isBeatEligible(beat, state)` (exported, `src/engine/ascendantBeat.ts`) | `unintroduced_group` = #culture/faction actors > #resolved introduction beats; `unthreaded_target` = #actor+location nodes > #ascendant `thread` edges; `always`/omitted = true. Fail-open on throw/unknown kind (NFP #4). |
| Identity bias | `computeIdentityBias(beat, state)` (exported) | reach: `BEAT_REACH_BIAS_BASE + BEAT_REACH_BIAS_SLOPE × domainAffinities[reach]`; sphere: `BEAT_SPHERE_BIAS_PRIMARY`/`_SECONDARY`/`_NONE` on `sphereAlignment` match. Reach×sphere multiplicative; 1 when no `identity` / no ascendant. |
| Draw | `drawFromPool(pool, rng, identityBias?)` (third arg optional) | weight = `BEAT_KIND_WEIGHTS[kind] × weight × bias`. Existing two-arg callers unaffected. |
| Director wiring | `phaseAscendantBeatDirector` cadence branch | `pool.filter(isBeatEligible)` → `drawFromPool(eligible, rng, b => computeIdentityBias(b, state))`; `poolSize` trace now reflects the **eligible** pool. |
| Constants | `BEAT_REACH_BIAS_BASE/SLOPE`, `BEAT_SPHERE_BIAS_PRIMARY/SECONDARY/NONE` (`src/data/ascendant-beat-content.ts`) | NFP #1. Pool beats tagged: introduction → `unintroduced_group`, investment → `unthreaded_target`. |
| Tests | `src/engine/__tests__/ascendantBeatIdentity.test.ts` (16) | eligibility per predicate + fail-open + "Director never offers ineligible beat"; identity multipliers + "draws aligned beat more often" (deterministic). |
| Deferred | per-beat `identity` reach/sphere tags on the shipping pool (content) → TODO(THR-514) | Mechanism is live; the starter pool ships untagged, so bias is neutral until THR-514 authors the tags. |

---

## Beat-driven graph seeding (THR-520)

Closes the THR-504 deferral: the THR-517 resolve contract only *grants cards*; the throne/artifact the onboarding narrates appeared only when the player manually fired them. A spine beat tagged `seedsGraph` now seeds the promised graph state on resolution.

| Surface | Path | Notes |
|---|---|---|
| Type field | `BeatGraphSeed` + optional `seedsGraph?` on `BeatDefinition` (`src/types/ascendantBeat.ts`) | Tagged descriptor (`home_seat` \| `threaded_artifact`), like `eligibility`/`identity`. Additive — beats without it seed nothing (the pre-THR-520 contract). |
| Seeding module | `seedBeatGraph(state, beat, turn)` in `src/engine/ascendantBeatSeeding.ts` (new) | `home_seat` → resolve The First → its `located_at` settlement (climb a sublocation to its parent), `setHomeSeat` (deterministic-default fallback). `threaded_artifact` → mint a sphere-flavored artifact (THR-509 `pickSphereFlavoredEffect`, seeded `mulberry32(seed+tick)`), `thread` ascendant→artifact + `possesses` First→artifact (skipped when no First). Returns `{seededNodeIds, seededEdgeIds}`; mutates `state.graph` in place. |
| Resolve wiring | `resolvePendingBeat` (`ascendantBeat.ts`) calls `seedBeatGraph` when `def.seedsGraph` is set; threads `seededNodeIds` into `resolveAscendantBeat` → `BeatRecord.seededNodeIds` | Grant behaviour unchanged (locked THR-517 tests untouched). Beat 0 deliberately carries no tag — `MeetingEncounter` already threads The First (no double-thread). |
| Content tags | Beat 1 `beat.spine.the_seat` → `{kind:'home_seat'}`; Beat 2 `beat.spine.thing_left_behind` → `{kind:'threaded_artifact'}` (`src/data/ascendant-beat-content.ts`) | The only two seeds the scripted spine promises (plan §4.1). |
| Trace | `ascendant.beat.seeded` + `BeatSeededTrace` (`src/types/trace.ts`) | One trace per seeding beat — the `add_node`/`add_edge` surface (node/edge ids); `failSoft` names a soft-skip reason. |
| Fail-soft | no ascendant/location/sphere → empty seed + `failSoft` trace; whole body try/caught → `engine_warning` | Beat still resolves + grants its cards; never throws/wedges (NFP #4). |
| Tests | `src/engine/__tests__/ascendantBeatSeeding.test.ts` (16) | both seeds, sublocation-climb, deterministic-default fallback, no-First/no-sphere/no-location fail-soft, deterministic artifact id, resolve-path integration. |

---

## Home Seat / Throne (THR-502)

The ascendant's seat of power — a location flagged on the god that yields a higher-yield place-of-power essence term and a hex signifier. The *setting* of the seat in normal play is the spine beat's job (#5); this is the field, income, signifier, and a debug/CLI setter.

| Surface | Path | Notes |
|---|---|---|
| Ascendant field | `AscendantProperties.homeSeatLocationId?: string` in `src/types/influence.ts` | Optional/additive; a run without a seat omits it. |
| Constant | `ESSENCE_PER_SEAT` (1.0) in `src/data/influence-content.ts` | Re-exported from `influence.ts`; registered in both CMS surfaces (`registry.ts`, `tunableConstants.ts`). |
| Income term | `computeEssenceGeneration` (`src/engine/influence.ts`) + `computeEssenceIncome` (`src/engine/essenceIncome.ts`) | Both add `ESSENCE_PER_SEAT` for the live `homeSeatLocationId` location and **exclude that location from the place-of-power loop** (named higher-yield place of power — replaces, not stacks). Fail-soft: missing location → 0. The HUD reflects it automatically via `essenceIncome`. |
| Throne model | `location` node + `controls` edge (ascendant → location) | **Not** a new node type. **No** `thread`-to-location edge (actor-targeting; deferred to spine beat #5). |
| Engine helper | `setHomeSeat(graph, ascendantId, locationRef?)` (`src/engine/influence.ts`) | Sets the property + ensures the controls edge (deterministic id, dup-guarded). Resolves ref by id/prefix/name; auto-picks capital→city→first when omitted. Returns `SetHomeSeatResult`. |
| Debug control | `__DEBUG.setHomeSeat(locationRef?)` (`src/debug-bridge.ts` + `.d.ts`) → encounter bridge `setHomeSeat` in `GameView` (calls `touchStructure`) | Until the spine beat sets the seat, this is the canonical way to establish one. |
| Signifier | `LocationNode.isHomeSeat` + `buildSeatMarkerTexture`/`addSeatMarker` in `src/components/HexMapV2/scene/LocationIconMesh.ts` | Gold ring + crown, above base icon and capital ring. `isHomeSeat` set in GameView's `locationNodes` memo (now also keyed on `gameState.ascendantId`; refreshed via `structuralCacheVersion`). |
| Tests | `src/engine/__tests__/{influence,essenceIncome}.test.ts`, `src/components/HexMapV2/scene/__tests__/LocationIconMesh.test.ts` | Seat income on both paths (exact-delta / no-stack / fail-soft), `setHomeSeat` (property+edge+default+no-locations), `LocationIconMesh` +1 seat sprite. |
| Deferred (spine beat #5) | seat assignment in normal play; whether to also add a `thread`-to-location edge | Out of scope here. |

---

## Ascendant Action Primitives (THR-509)

Four reusable building blocks the expression cards (THR-508) and future ascendant verbs sit on — built *before* the cards so they are cheap to author. The verb is universal; the magic is flavored by the ascendant's domain + sphere. All pure, fail-soft, traced (`ascendant_primitive`).

| Surface | Path | Notes |
|---|---|---|
| Resolvers | `src/engine/ascendantPrimitives.ts` | `getUpkeepStatus` (relic_upkeep_substitute), `applyCoLocatedThreadAura` (co_located_thread_aura), `applyChosenStatusGrant` + `CHOSEN_POWER_TABLE` (chosen_status_grant), `pickSphereFlavoredEffect` + `SPHERE_EFFECT_TABLE` (sphere_flavored_effect). Re-exports `CoLocatedThreadAuraSpec`, `CO_LOCATED_AURA_DEFAULT_FIELD`, `CONSECRATE_DEVOTION_PER_TICK`. |
| Spec types | `src/types/ascendantPrimitives.ts` | `CoLocatedThreadAuraSpec`; constants `CO_LOCATED_AURA_DEFAULT_FIELD`, `CONSECRATE_DEVOTION_PER_TICK` (kept in the types module to avoid an engine→types cycle from controlEffect.ts). |
| Control-effect fields | `src/types/controlEffect.ts` | Additive: `ControlSpec`/`ControlEffect` gain `upkeepArtifactId?` + `perTickThreadAuras?`; `LapseReason` gains `'upkeep_relic_destroyed'`. |
| Phase wiring | `src/engine/phaseControlEffects.ts` | Per tick: waive `perTickCost` while the upkeep relic exists; lapse (`upkeep_relic_destroyed`) when it's gone; apply each `perTickThreadAuras` spec against `targetNodeId`. |
| Constants | `src/engine/ascendantPrimitives.ts` + `src/types/ascendantPrimitives.ts` | `CONSECRATE_DEVOTION_PER_TICK`, `SPHERE_FLAVOR_PASSIVE_VALUE`; lookup tables `CHOSEN_POWER_TABLE`, `SPHERE_EFFECT_TABLE` are the authoring surface. |
| Trace category | `ascendant_primitive` (loose, via `as never`, like `control_effect`) | Each resolver emits one trace incl. fail-soft markers. |
| Tests | `src/engine/__tests__/ascendantPrimitives.test.ts` | 18 tests: each primitive in isolation + faith-spread→tier-promotion integration + relic waive/lapse through `phaseControlEffects`. |
| Content-facing docs | `Docs/plans/2026-04-16-systemic-wiring-guide.md` | New subsection under THR-500 documenting all four primitives for content authors. |
| First card consumer | THR-508 (`imbue`) | The imbue card ships against `sphere_flavored_effect`; see the Ascendant Expression Cards section below. consecrate/bestow/anoint split → THR-511/512/513. |

---

## Ascendant Expression Cards (THR-508)

The `imbue` expression card — the one §4.4 verb that composes the THR-509 primitives end-to-end with zero new consumer wiring. The other three verbs (consecrate/bestow/anoint) split to THR-511/512/513 (each needs a new consumer subsystem).

| Surface | Path | Notes |
|---|---|---|
| GraphOp verb | `src/types/graphOp.ts` | New `'imbue_item'` `GraphOpType`. |
| Dispatch | `src/engine/unifiedActionResolution.ts` | `imbue_item` filtered out of the `executeGraphOps` batch in `executeStepResult` and dispatched to `applyImbueItem` with a locally-derived seeded `mulberry32` PRNG (sibling block to `anoint_successor` / `faction_verb` / `plant_schism`). |
| Resolver | `src/engine/ascendantExpression.ts` | `applyImbueItem(graph, ascendantId, artifactId, rng, tick)` + `getAscendantPrimarySphere`. Reads the ascendant's primary sphere → `pickSphereFlavoredEffect` (THR-509) → appends the effect to the artifact's `properties.effects`. Fail-soft + traced. |
| Consumer (proof of wiring) | `src/engine/effects/effectWalker.ts` | `collectAttachmentEffects` reads `properties.effects` off `possesses`-edge artifacts → the imbued power applies to the holder. Asserted by an integration test. |
| Template | `src/data/unified-action-templates.ts` | `action.imbue` in `ATTACHMENT_ACTION_TEMPLATES` (`targetCategories:['artifact','artifact_legendary']`, `onSuccess:[{op:'imbue_item',nodeId:'$target'}]`). Hidden until unlocked (no `starter`). |
| Constant | `src/data/ascendant-expression-constants.ts` | `IMBUE_ESSENCE_COST` (4). |
| Trace category | `src/types/trace.ts` | `'ascendant_expression'` registered in the `TraceCategory` union + `TRACE_CATEGORIES` array (properly registered, unlike THR-509's loose `ascendant_primitive`). |
| Tests | `src/engine/__tests__/ascendantExpression.test.ts` | 10 tests: sphere-match, append-not-replace, determinism, 3 fail-soft cases, effect-walker integration. |
| Content-facing docs | `Docs/plans/2026-04-16-systemic-wiring-guide.md` | "Authoring an ascendant verb card (the imbue pattern)" subsection under the THR-509 primitives. |

---

## Anoint Expression Card + Chosen-Faction Consumer (THR-513)

The `anoint` expression card (per-graph-type verb for **factions**) + the consumer that makes the THR-509 `chosen` status mechanically live. Completes the four-card §4.4 toolkit. The card stamps the status; a new per-tick phase reads it and grants the faction's members a power-keyed reputation gain.

| Surface | Path | Notes |
|---|---|---|
| GraphOp verb | `src/types/graphOp.ts` | New `'anoint_faction'` `GraphOpType`. |
| Dispatch | `src/engine/unifiedActionResolution.ts` | `anoint_faction` filtered out of the `executeGraphOps` batch in `executeStepResult` and dispatched to `applyAnointFaction` (sibling block to `bestow_power` / `imbue_item`; deterministic — no PRNG). |
| Resolver | `src/engine/ascendantExpression.ts` | `applyAnointFaction(graph, ascendantId, factionId, tick)`. Validates `actor`+`actorType:'faction'`, reads the ascendant's primary reach (`getAscendantPrimaryReach`/`domainAffinities`, THR-503), stamps `chosen` via THR-509 `applyChosenStatusGrant`. Fail-soft (missing_faction / not_faction / missing_reach) + `ascendant_expression` trace. |
| **Consumer (the new phase)** | `src/engine/chosenFactionPowers.ts` | `phaseChosenFactionPowers(state)` — walks `getFactionNodes`, and for each non-dissolved faction with `chosen.power` grants every `member_of` member a per-tick reputation gain via `applyFactionReputationGain` (cause `'chosen_power'`). Per-power magnitude `CHOSEN_POWER_EFFECT_TABLE`, default `CHOSEN_FACTION_REPUTATION_PER_TICK`. This is what reads `node.properties.chosen` (closing the THR-509 dead-content gap). |
| Phase wiring | `src/engine/orchestrator.ts` | Phase **6.56**, registered immediately after `phaseFactionReputationDecay` (6.55) so chosen members net upward. |
| Power table | `src/engine/ascendantPrimitives.ts` | `CHOSEN_POWER_TABLE` extended from 4 → all 8 reaches (added veil/eye/stone/star faction powers). |
| Template | `src/data/unified-action-templates.ts` | `action.anoint` (`targetCategories:['faction']`, `onSuccess:[{op:'anoint_faction',nodeId:'$target'}]`, cost `ANOINT_COST`). Hidden until unlocked (no `starter`). |
| Constants | `src/data/ascendant-expression-constants.ts` | `ANOINT_COST` (6), `CHOSEN_FACTION_REPUTATION_PER_TICK` (0.003); per-power `CHOSEN_POWER_EFFECT_TABLE` in `chosenFactionPowers.ts`. |
| Reputation cause | `src/types/faction.ts` | `FactionReputationTrace['cause']` gains `'chosen_power'`. |
| Trace categories | `src/types/trace.ts` | `'chosen_faction_power'` (one summary trace per chosen faction per tick) + backfilled `'ascendant_primitive'` (THR-509) registered in the `TraceCategory` union + `TRACE_CATEGORIES` array. |
| Tests | `src/engine/__tests__/ascendantExpression.test.ts` (+8), `src/engine/__tests__/chosenFactionPowers.test.ts` (new, 8) | Resolver: power-by-reach, all-8-reaches, re-anoint, fail-soft. Consumer: gain applied, per-power magnitude, accumulation, clamp, default fallback, un-anointed no-op, dissolved skip, no-members. |
| Content-facing docs | `Docs/plans/2026-04-16-systemic-wiring-guide.md` | The anoint pattern (status stamp + per-tick consumer), distinct from imbue (GraphOp-intercept) / consecrate (sustained-control) / bestow (possessed-gift). |

---

## Emergent Personality Traits (THR-527)

The "who they currently are" layer of the personality stack. A new per-tick phase reads each mortal agent's standing axis position and grants/releases a `personality`-subcategory trait at the hysteresis thresholds, firing a "becoming" beat on crystallization.

| Surface | Path | Notes |
|---|---|---|
| **Registered phase** | `src/engine/phases/personalityTraitEmerge.ts` | `personalityTraitEmergePhase` (slot `post-economy`) + `processPersonalityTraitEmergence(state)`. Individual actors only (`actorType:'individual'`, non-deceased, not the ascendant). **THR-559:** reads the *unified live position* = `clamp(baseline + drift)` — baseline from `node.properties.axiologicalProfile[axis.valuePair]` (signed ±1) plus temporary drift via `driftDeltaFor(state.archetypeDrift, id, reachToAxisId(reach))` — the same accessor the reaction chooser uses (not baseline alone). Converts the signed live value to the canonical 0–1 scale via the registry's `signedToCanonical01` (the local `toLivePosition` duplicate was retired), and grants the virtue trait at ≥0.8 / vice at ≤0.2, releasing inside the `0.65`/`0.35` hysteresis band. Mutates `has_trait` edges in place via `assignTrait`/`removeTrait`; returns "becoming" `tickEvents`. |
| Trait definitions | `src/data/personality-trait-content.ts` | 16 trait nodes (8 axes × virtue/vice), `subcategory:'personality'`, **empty `domainContributions`** (capability invariant — personality steers selection, never competence) carrying per-reach `scoringModifiers`. Generated from `CANONICAL_AXES` so pole labels/reach bindings can't drift. Exports `PERSONALITY_TRAIT_DEFINITIONS` + `PERSONALITY_TRAIT_BY_AXIS`. |
| Behavior bias consumer | `src/engine/encounterScoring.ts` | `computeReputationScoringBonus` generalized to also read `subcategory:'personality'` traits' top-level `scoringModifiers` (alongside `reputation` traits' nested `reputationEffects.scoringModifiers`), scaled by `REPUTATION_SCORING_WEIGHT`. |
| Schema field | `src/types/traits.ts` | `'personality'` added to `TraitCategory`; new optional `scoringModifiers?: Partial<Record<ReachDomain, number>>` on `TraitDefinitionProperties`. |
| Player event | `src/types/gameState.ts` | `'personality_trait_emerged'` added to the `TickEvent` `type` union ("becoming" beat — `"<name> has become <Word>."`). |
| Trace category | `src/types/trace.ts` | `'personality_trait_emerged'` registered in `TraceCategory` + `TRACE_CATEGORIES` + a typed `PersonalityTraitEmergedTrace` member of `TraceEntry` (grant + release). |
| Constants (NFP #1) | `src/data/personality-trait-content.ts` | `PERSONALITY_TRAIT_VIRTUE_THRESHOLD` (0.8), `PERSONALITY_TRAIT_VICE_THRESHOLD` (0.2), `PERSONALITY_TRAIT_RELEASE_BAND` (0.15), derived `*_RELEASE` floors, `PERSONALITY_TRAIT_SCORING_MODIFIER` (0.15). |
| Tests | `src/engine/phases/__tests__/personalityTraitEmerge.test.ts` (10) | Grant/release at thresholds, hysteresis hold-then-release, idempotency, ascendant exclusion, missing-profile fail-soft, trace emission, opposite-pole release, **+ becoming-event notification directive (THR-562)**. Plus the `phaseRegistry.equivalence` baseline updated for the new phase. |
| **Notification (THR-562)** | `src/engine/phases/personalityTraitEmerge.ts` · `src/engine/notificationRouter.ts` | `becomingEvent()` sets `notification:{channel:'toast'}` — required or `routeNotifications` silently drops the event (no directive → not surfaced). A **toast** (not alert) so distinct same-tick becomings survive the alert icon+tick dedup; `actorId` gives the agent nav target. `eventTypeToCategory` maps `personality_trait_emerged → 'lifecycle'` (a character-defining milestone; enabled + permanent by default). |
| **Character-sheet row (THR-562)** | `src/engine/agentDetail.ts` · `src/components/Game/tabs/OverviewTab.tsx` | `AgentInfoCardData.personalityTraits: PersonalityTraitDisplay[]` populated at intimate+ by `getPersonalityTraitDisplays` (filters `subcategory:'personality'` has_trait edges; parses pole/reach from `trait.personality.<reach>.<pole>`), **excluded from `allTraits`** so they aren't double-shown. `OverviewTab` renders a distinguished **Personality** section (virtue=`var(--accent-gold)` / vice=`#c77b7b` chips, flavor via `title`). Live sheet is `AgentProfileModal`/`OverviewTab` — the orphaned `AgentDetailPanel` is dead code; `personality` added to that panel's + the CMS registry's `TRAIT_CATEGORY_COLORS`/`LABELS` for completeness. Browser-verified @1920×1080. |
| Tests (THR-562) | `src/engine/__tests__/notificationRouter.test.ts` · `src/engine/__tests__/agentDetail.test.ts` · `src/components/Game/__tests__/AgentProfileModal.test.tsx` | `eventTypeToCategory` + toast routing to `lifecycle`; `card.personalityTraits` populated (pole/reach/flavor) and excluded from `allTraits`; `OverviewTab` renders the Personality section + chips. |
| **Layered contributors + axis bars (THR-567)** | `src/engine/agentDetail.ts` · `src/data/origin-vignettes.ts` · `src/components/Game/tabs/OverviewTab.tsx` | Extends the Personality section to the full born→marked→becoming→now story. New read-only `getPersonalityContributorDisplays` + `PersonalityContributorDisplay` interface + `AgentInfoCardData.personalityContributors`, populated at the **same intimate+ gate** as `personalityTraits`. Sources keyed to canonical axis: origin vignettes from `node.originVignettes` via a new `getOriginVignetteById` export (module-load `Map`), **and** permanent (`ticksRemaining` null/undefined) traits carrying `axisContributions` (one row per trait×axis). `OverviewTab` adds `MoralAxisRow` (a `CoreContinuumRow`-style bar reading `card.axiologicalProfile` via `signedToCanonical01`; virtue=gold / vice=rose) per axis *with signal* (`AXIS_SIGNAL_EPSILON=0.1`), with the `◦` origin / `✦` mark contributor rows grouped beneath. **Emergent `personalityTraits` path + becoming beat untouched.** Note: the THR-529 `axiological_mark_apply` effect shifts the baseline in place (no trait), so its provenance is not enumerable — only the live axis bar reflects it. Browser-verified @1920×1080. |
| Tests (THR-567) | `src/engine/__tests__/agentDetail.test.ts` · `src/components/Game/__tests__/AgentProfileModal.test.tsx` | Builder exposes `personalityContributors` from origin vignettes + axis-contributing traits (source/axisId/reach/pole/text/detail); not populated below intimate; `OverviewTab` renders axis bars (virtue/vice words) + `personality-contributor` rows. |

UI note: THR-562 shipped the **emergent-trait row + becoming notification** (the "who they are now / becoming" layer). **THR-567** completed the fuller layered section — "born as" (origin vignettes) + "marked by" (permanent axis-contributing traits) as their own tooltip-rich rows grouped under a live per-axis position bar. (This was the genuine remaining delta after **THR-532** was bounced for targeting the orphaned `AgentDetailPanel` — the live surface is `AgentProfileModal`/`OverviewTab`.)

---

## Origin-Vignette Birth Seeding (THR-561)

The "who they were born as" layer — the consumer the origin-vignette content library (THR-539) was authored for (it previously had none). A new per-tick phase draws pre-history vignettes for each unseeded mortal individual and lays their signed axis contributions — plus any permanent-trait `axisContributions` — onto the reach-axis **baseline** (`AxiologicalProfile`).

| Surface | Path | Notes |
|---|---|---|
| **Registered phase** | `src/engine/phases/personalityOriginSeed.ts` | `personalityOriginSeedPhase` (slot `post-economy`, `beforePhase: ['personality_trait_emerge']` so the seeded baseline is visible the tick it's drawn) + `processPersonalityOriginSeed(state)`. Individual actors only (non-deceased, not the ascendant). Idempotent via `node.properties.originVignettesSeeded`. Per-agent `mulberry32(hash(worldSeed, agentId))` so seeding is reproducible regardless of *when* an agent is first seen. |
| **Baseline computation** | `src/engine/personality/originBaseline.ts` | Pure functions: `drawOriginVignettes` (distinct, seeded), `vignetteAxisContribution` (reach→axisId + pole→sign), `sumAxisContributions` (folds contribution maps, skips+counts unknown axis ids), `computeOriginBaseline` (draws + folds trait `axisContributions`, lays the summed canonical delta onto the existing signed baseline via `signedToCanonical01`/`canonical01ToSigned`). **Additive, not destructive** — vignettes nudge the generated baseline, mirroring the Core layer's "authored character over the generated spread" (`coreMechanics.ts`). |
| **`axisContributions` schema field** | `src/types/traits.ts` | New optional `axisContributions?: Partial<Record<string, number>>` on `TraitDefinitionProperties` — per-axis signed **canonical 0–1 delta** keyed by canonical axis id, kept entirely separate from `domainContributions` (capability). **Consumed only by the baseline computation** — nothing reads it for prerequisites/resolution. Forward-compatible carrier for permanent formative-mark traits. |
| Provenance (inspectability) | node property | `node.properties.originVignettes` = the drawn vignette ids (per-agent, for the character sheet + prose); `originVignettesSeeded` = idempotency marker. |
| Content library (pre-existing) | `src/data/origin-vignettes.ts` | 144 vignettes (18/reach × 8 reaches, 72 virtue / 72 vice), keyed on `(reach, pole, magnitude∈{0.05,0.1,0.15,0.2})`. Authored THR-539; this slice is its consumer. |
| Trace category | `src/types/trace.ts` | `'personality_origin_seeded'` registered in `TraceCategory` + `TRACE_CATEGORIES` + typed `PersonalityOriginSeededTrace` member of `TraceEntry`. **ONE aggregate trace per tick** (`details.kind`: `seeded` \| `unknown_axis`) — never one-per-agent (tick-1 bulk-seed burst would wrap the trace ring buffer). Auto-surfaces as a DebugPanel filter checkbox (default-enabled) via `TRACE_CATEGORIES`. |
| Constants (NFP #1) | `src/engine/personality/originConstants.ts` | `ORIGIN_VIGNETTES_PER_AGENT` (5) — draw count / baseline spread. |
| Tests | `src/engine/personality/__tests__/originBaseline.test.ts` (11) + `src/engine/phases/__tests__/personalityOriginSeed.test.ts` (10) | Distinct+deterministic draws, sign/scale, unknown-axis skip, additive layering, clamp; phase idempotency, ascendant/deceased exclusion, aggregate-trace-not-per-agent, `axisContributions` folding + unknown-axis trace. Plus the `phaseRegistry.equivalence` baseline updated for the new phase. |

Fail-soft: empty pool → mark seeded, baseline unchanged; unknown axis id → skip contribution + count `unknown_axis`; no vignettes for an axis → that axis's generated baseline untouched.

---

## Canonical Axis Registry — keying + scale unification (THR-559)

Foundation of the Agent Personality & Moral Drift project — the scalar-unification pass. Makes the axis registry the single source of truth for the moral-axis **key** and the **canonical scale**, and unifies the two previously-divergent live-position computations onto one accessor.

| Surface | Path | Notes |
|---|---|---|
| **Registry keying helpers** | `src/types/axisRegistry.ts` | `reachToAxisId(reach)` → canonical `${reach}_axis` id for the 8 moral reaches (non-moral reaches like `quintessence` pass through unchanged); `axisIdToReach(axisId)` reverses it; `getAxisByValuePair(valuePair)` reverses the legacy ValuePair bridge. Single naming site for the `ArchetypeDrift.axisId`. |
| **Canonical scale conversion** | `src/types/axisRegistry.ts` | `signedToCanonical01(signed)` / `canonical01ToSigned(v)` — the one bridge between signed ±1 *internal storage* and the canonical 0–1 *author/UI* scale (0.5 neutral, virtue 1.0, vice 0.0). Internal storage stays signed by design (personality-plan grey-zone); the 0–1 view is obtained here. Retires the duplicated `0.5 + 0.5·v` that lived in `personalityTraitEmerge`. |
| **Drift keying reconciled** | `src/engine/orchestrator/phaseChoiceResolution.ts`, `src/engine/phases/phaseAutonomousAftermath.ts`, `src/engine/encounters/reactionChooser.ts` | `applyDriftMagnitude` / `driftDeltaFor` production call sites now key `ArchetypeDrift.axisId` by the canonical `reachToAxisId(reach)` (`iron_axis`), not a bare reach. Writers + readers move together, so live behavior is unchanged; the stored key is now honest to the field name. No content authors `archetype_drift_register`, so no content migration. |
| **Unified live-position read** | `src/engine/phases/personalityTraitEmerge.ts` | Emergence now reads `clamp(baseline + drift)` via the shared `liveAxisPosition` + `driftDeltaFor` accessor — the same one the reaction chooser uses — retiring the parallel baseline-only computation (the "duplicated standing representation"). |
| Scale decision (documented, NFP) | — | Internal storage (`AxiologicalProfile`, `ArchetypeDrift`) and engine thresholds remain on the signed ±1 scale; the canonical 0–1 conversion is centralized in the registry for the author/UI layers (character sheet is THR-532). A full ±1→0–1 *storage* migration and the EncounterArchetypePole/ARCHETYPE_NAMES *content-vocabulary* rename are optional destructive follow-ups (not required for this foundation). |
| Reconciliation guard (tests) | `src/types/__tests__/axisRegistry.test.ts` | Asserts the legacy naming sites agree with the registry: `REACH_VALUE_PAIR` == registry `valuePair` bridge; `MORAL_AXIS_POLES_BY_REACH` (EncounterArchetypePole) covers exactly the 8 registry reaches with two distinct poles each; `reachToAxisId`/`axisIdToReach` round-trip; `signedToCanonical01`/`canonical01ToSigned` anchors, clamping, and round-trip. |

---

## Autonomous In-Encounter Choice (THR-530)

The one genuinely new subsystem of the personality project. Non-hero agents resolve encounter steps mechanically, but their authored aftermath reactions were never applied — this adds a tick-loop caller that picks the in-character reaction by profile alignment and applies it.

| Surface | Path | Notes |
|---|---|---|
| **Chooser (pure)** | `src/engine/encounters/reactionChooser.ts` (new) | `computeAxisLeans(graph, drift, agentId)` → live ±1 axis position per reach (`axiologicalProfile` baseline + `driftDeltaFor`), null when no profile. `inferReactionLean(reaction, primaryReach)` → signed reach-pole from effects (valid `${reach}.positive/.negative` `reputation_tally` → ±1; actor-self `reputation_score` delta → primary reach; off-axis/faction/other-agent effects ignored). `chooseAlignedReaction(reactions, leans, primaryReach, weight)` → deterministic argmax `Σ lean·agentLean·weight`, lowest-index tie-break, `aligned:false` → caller uses `reactions[0]`. |
| **Registered phase** | `src/engine/phases/phaseAutonomousAftermath.ts` (new) | `autonomousAftermathPhase` (slot `post-resolution`) + `processAutonomousAftermath(state, ctx)`. Scans resolved actions with authored reactions for **non-player, non-threaded** agents (excludes `getThreadedAgents`/`getAvatarsOf` of `ascendantId`), applies the chosen reaction via `applyEncounterAftermathReaction`, nudges drift toward the chosen pole (`applyDriftMagnitude`, THR-528), `touchWorld`/`touchStructure`. No-op without `ctx.runtime`. |
| Default-reaction replacement | `src/engine/encounterAftermath.ts` | `resolveAftermathContextForAgent`'s two `reactions[0]` defaults replaced with `selectAutonomousDefaultReaction` (profile-aligned, fail-soft to `reactions[0]`) — so CLI auto-aftermath + debug-bridge also pick in character. |
| Registry | `src/engine/phases/index.ts` | `autonomousAftermathPhase` added to `ENGINE_PHASES` (post-resolution). |
| Idempotency field | `src/types/unifiedAction.ts` | additive `autonomousAftermathApplied?: boolean` on `UnifiedAction` — non-hero agents get no notification to mark resolved, so the phase flags the action once consumed. |
| Trace category | `src/types/trace.ts` | `'reaction_selected'` registered in `TraceCategory` + `TRACE_CATEGORIES` (per-option `scores`, `chosenIndex`, `aligned`, `optionCount`). |
| Constants (NFP #1) | `src/data/agent-behavior-constants.ts` | `PERSONALITY_REACTION_WEIGHT` (2.0 — kill-criteria lever; →0 reverts to `reactions[0]`), `PERSONALITY_REACTION_DRIFT_DELTA` (0.05), `PERSONALITY_AUTONOMOUS_AFTERMATH_MAX_PER_TICK` (12). |
| Tests | `src/engine/encounters/__tests__/reactionChooser.test.ts` (new, 15) + `src/engine/phases/__tests__/phaseAutonomousAftermath.test.ts` (new, 6) | Chooser: lean inference, scoring, non-index-0 selection, neutral/no-signal/weight-0 fallback, tie-break, determinism. Phase: aligned application, drift, idempotency, profile-less fallback, hero exclusion, no-runtime no-op. Plus `phaseRegistry.equivalence` baseline updated. |

Content note: broad in-world choice variety scales with **authored reaction poles** (reactions carrying `${reach}.positive/.negative` tally or actor-self `reputation_score`). Where reactions carry no moral signal the chooser fails soft to `reactions[0]`. UI: autonomous behavior surfaces via the existing chronicle/event feed; the character sheet is THR-532.

---

## Formative-Mark Primitive (THR-529)

Permanent, author-gated aftermath effect that moves an agent's moral **baseline** on one axis — the standing `AxiologicalProfile` value origin vignettes seed at birth — rather than the decaying drift layer (THR-528).

| Surface | Path | Notes |
|---|---|---|
| Aftermath effect kind | `axiological_mark_apply` in `EncounterAftermathReactionEffect` (`src/types/unifiedAction.ts`); handled in `applyEncounterAftermathReaction` (`src/engine/encounterAftermath.ts`) | Resolves agent (defaults to actor), clamps `signedMagnitude` to ±`FORMATIVE_MARK_MAX_MAGNITUDE`, shifts `node.properties.axiologicalProfile[valuePair]` in place (inits a profile for born-neutral agents), clamps baseline to [−1,+1], `mutationSummary.touchedWorld = true`. Reach→ValuePair via `getAxisByReach`. |
| Trace category | `src/types/trace.ts` | `'axiological_mark_applied'` registered in `TraceCategory` + `TRACE_CATEGORIES` + typed `AxiologicalMarkAppliedTrace` member of `TraceEntry` (reach, valuePair, signedMagnitude, previous/new baseline). |
| Constant (NFP #1) | `src/data/agent-behavior-constants.ts` | `FORMATIVE_MARK_MAX_MAGNITUDE` (0.15) + `FORMATIVE_MARK_EVENT_SIGNIFICANCE` (0.75, in `encounterAftermath.ts`). |
| UI surfacing | chronicle/event feed | "Becoming" `narrative` `TickEvent` ("A defining moment marks {name}: lastingly more {poleWord}.") appended to `recentEvents`/`tickEvents`. Rich character-sheet "mark rows" are THR-532. |
| Content allowlist | `src/testing/contentInvariants.ts` | `'axiological_mark_apply'` added to `KNOWN_AFTERMATH_EFFECT_KINDS`. |
| Content (starter set) | `the-executioners-commission.ts` (Iron, both poles), `the-granaries-in-the-famine-year.ts` (Gold, both poles) | One mark on the most-committed reaction per branch — rare by design. |
| Tests | `src/engine/__tests__/encounterAftermath-axiological_mark_apply.test.ts` (new, 7) | virtue/vice shift, magnitude clamp, baseline clamp, born-neutral init, explicit target, missing-target fail-soft. |

---

## Reach Signature: Iron / Warhost (THR-550)

Iron's reach-signature aftermath effect — a divine "Call to Arms" that mobilizes a faction and raises a force on the existing army node form. Part of the Ascendant Beats — Divine Cadence reach-signature push (THR-548/549/550). Blocked-by THR-548 (shipped).

| Surface | Path | Notes |
|---|---|---|
| Aftermath effect kind | `signature_warhost` in `EncounterAftermathReactionEffect` (`src/types/unifiedAction.ts`); handled in `applyEncounterAftermathReaction` (`src/engine/encounterAftermath.ts`) | Marks faction `mobilized`/`mobilizedTick`/`mobilizedStrength`; raises a force via `raiseWarhostForce` or falls back to a rival-sentiment shift. `mutationSummary.touchedWorld`/`touchedStructure = true`. Fail-soft no-op on missing/dissolved/non-faction target + resolver-boundary try/catch. |
| Force node form (reused) | `raiseWarhostForce` (new, exported) in `src/engine/armySpawning.ts` | Reuses the existing army node form (`actor`/`group` + `armyState` + `commanded_by`/`member_of`/`located_at`) — NOT a new node type. Divinely-commanded variant of `spawnArmy` (no ambition/eligibility coupling; cohesion from warhost strength; `objective: null`; `warhost: true` marker). |
| Strength scaling | `spherePowerMultiplier`/`scaledEffect` (`src/engine/sphereScaling.ts`, THR-548); `getAscendantPrimarySphere` (`ascendantExpression.ts`) | `scaledEffect(baseStrength ?? WARHOST_BASE_STRENGTH, spherePowerMultiplier(actor primary-sphere score))`. |
| Trace category | `src/types/trace.ts` | `'ascendant.signature.warhost'` in `TraceCategory` + `TRACE_CATEGORIES`; `signature_warhost` added to `EncounterAftermathEffectTrace.effectKind`. Dual trace (specific + `encounter_aftermath_effect`) on every path (loose-emitted like the faction effects). |
| Constants (NFP #1) | `src/data/game-config.ts` | `WARHOST_BASE_STRENGTH` (30) + `WARHOST_FALLBACK_SENTIMENT_SHIFT` (−0.15). |
| Content allowlist | `src/testing/contentInvariants.ts` | `'signature_warhost'` added to `KNOWN_AFTERMATH_EFFECT_KINDS`. |
| Authoring docs | `Docs/plans/2026-04-16-systemic-wiring-guide.md` | Faction-effects code block + Part 5 effect-types table (20→21 kinds). |
| UI | N/A | Engine effect; player-facing surface is the future Iron signature card. Cost-via-`scaledCost` is card-level, out of scope here. |
| Tests | `src/engine/__tests__/encounterAftermath-signature_warhost.test.ts` (new, 6) | army path, strength floor/ceil scaling, authored override, sentiment fallback, dissolved + missing no-ops. |

---

## Reach Signature: Veil / Rend the Gate (THR-551)

Veil's reach-signature aftermath effect — a sustained "rift" that amplifies a Creation Sphere's local influence at a per-tick essence cost, with a seeded per-tick chaos-pulse downside. Part of the Ascendant Beats — Divine Cadence reach-signature push (THR-548/549/550/551). Blocked-by THR-548 (shipped). Unlike `signature_warhost` (one-shot), this resolves into a `ControlEffect` ticked by `phaseControlEffects`.

| Surface | Path | Notes |
|---|---|---|
| Aftermath effect kind | `sphere_influence_amplify` in `EncounterAftermathReactionEffect` (`src/types/unifiedAction.ts`); handled in `applyEncounterAftermathReaction` (`src/engine/encounterAftermath.ts`) | Builds a `ControlEffect` and appends it to `GameState.controlEffects[]` via new `nextControlEffects` accumulator. `mutationSummary.touchedWorld`/`touchedStructure = true`. Fail-soft no-op on missing/non-location target, location-without-hex, or no acting ascendant + resolver-boundary try/catch. |
| ControlEffect fields (additive) | `src/types/controlEffect.ts` | `ControlSpec`/`ControlEffect` gain `perTickSphereInfluence?: SphereInfluenceSpec` + `perTickLeak?: ControlLeakSpec`. Carried through `spawnControlEffect` (`controlEffectSpawn.ts`) for any future sustained template. |
| Per-tick processing | `src/engine/phaseControlEffects.ts` | Step 3d″ pushes scaled sphere pressure (additive to generic `CONTROL_PRESSURE_PER_TICK`) onto `targetNodeId` while score < cap. Step 3i rolls a seeded leak (`mulberry32(seed + tick·RIFT_LEAK_SEED_OFFSET + hashString(effectId))`) → hex `corruption` mutation + `entropy` pressure + trace + tick event. Deterministic; leak trace/event fire only on hit (no per-tick no-op flood). |
| Scaling | `spherePowerMultiplier`/`scaledEffect`/`scaledCost` (`src/engine/sphereScaling.ts`, THR-548); `getAscendantPrimarySphere` (`ascendantExpression.ts`) | Magnitude `scaledEffect(perTick ?? RIFT_INFLUENCE_PER_TICK, mult)`, cost `scaledCost(RIFT_PERTICK_COST, mult)`, leak `min(1, RIFT_LEAK_CHANCE × mult)` — all from actor primary-sphere score. |
| Trace categories | `src/types/trace.ts` | `'ascendant.signature.rift'` (establishment) + `'ascendant.signature.rift_leak'` (per-tick leak) in `TraceCategory` + `TRACE_CATEGORIES`; `sphere_influence_amplify` added to `EncounterAftermathEffectTrace.effectKind`. |
| Constants (NFP #1) | `src/data/game-config.ts` + `phaseControlEffects.ts` | `RIFT_INFLUENCE_PER_TICK` (2), `RIFT_INFLUENCE_CAP` (10), `RIFT_PERTICK_COST` (0.4), `RIFT_LEAK_CHANCE` (0.08), `RIFT_LEAK_CORRUPTION` (6), `RIFT_LEAK_ENTROPY_PRESSURE` (2), `RIFT_LEAK_SIGNIFICANCE` (0.6), `RIFT_ESTABLISHED_SIGNIFICANCE` (0.7); `RIFT_LEAK_SEED_OFFSET` (53, in phase). |
| Content allowlist | `src/testing/contentInvariants.ts` | `'sphere_influence_amplify'` added to `KNOWN_AFTERMATH_EFFECT_KINDS`. |
| Authoring docs | `Docs/plans/2026-04-16-systemic-wiring-guide.md` | Faction-effects code block + Part 5 effect-types table (21→22 kinds). |
| UI | N/A (existing surfaces) | Rift establishment + leak emit `narrative` TickEvents → chronicle/event log; both trace categories appear in the DebugPanel. Sustained controls already surface in ThreadsPanel `getSustainedControlNodes` (THR-418). Player-facing card is the future Veil signature card (separate content issue). |
| Tests | `src/engine/__tests__/encounterAftermath-sphere_influence_amplify.test.ts` (new, 6) + `src/engine/__tests__/phaseControlEffects-rift.test.ts` (new, 5) | Establishment + floor/ceil scaling + perTick override + 3 fail-soft no-ops; per-tick influence/cap + leak fire/no-fire/determinism. |

---

## Reach Signature: Stone / The Great Work (THR-552)

Stone's reach-signature aftermath effect — mints a one-of-a-kind wonder (a legendary forge / deep mine) that persists as a real `location` in the world graph. Part of the Ascendant Beats — Divine Cadence reach-signature push (THR-548/549/550/551/552). Blocked-by THR-548 (shipped). Unlike the sustained `sphere_influence_amplify`, this is a one-shot mint (no per-tick cost — a Great Work is built, not held).

| Surface | Path | Notes |
|---|---|---|
| Aftermath effect kind | `spawn_unique_location` in `EncounterAftermathReactionEffect` (`src/types/unifiedAction.ts`); handled in `applyEncounterAftermathReaction` (`src/engine/encounterAftermath.ts`) | Mints a `location` node flagged `unique` with a `uniqueTag`, owned via a `controls` **edge** from the actor (NOT a new node type). Dedup by `uniqueTag` (`getNodesByType('location')` scan → no-op on collision). `mutationSummary.touchedWorld`/`touchedStructure = true`. Fail-soft no-op on duplicate tag / unresolvable hex + resolver-boundary try/catch. |
| Hex placement | `resolveLocationToHex` (`src/engine/encounterAwareness.ts`) + `located_at` edge | Precedence: explicit `hex` → `nearAgentId`'s hex → the actor's hex. `no_hex` fail-soft skip when none resolves. |
| Artifact reuse | `spawn_artifact` node/edge shape (inline) | Optional `artifactForgeTier` mints `artifact_legendary` + `bonded_to` the maker (legendary) or `artifact` + `possesses` (else) — no new artifact code. |
| Trace category | `src/types/trace.ts` | `'ascendant.signature.unique_location'` in `TraceCategory` + `TRACE_CATEGORIES`; dual trace (specific + `encounter_aftermath_effect`). |
| Constants (NFP #1) | `src/data/game-config.ts` | `GREAT_WORK_ARTIFACT_TIER` (`'legendary'`), `GREAT_WORK_ESTABLISHED_SIGNIFICANCE` (0.85), `GREAT_WORK_DEFAULT_SUBTYPE` (`'monument'`). |
| Content allowlist | `src/testing/contentInvariants.ts` | `'spawn_unique_location'` added to `KNOWN_AFTERMATH_EFFECT_KINDS`. |
| Authoring docs | `Docs/plans/2026-04-16-systemic-wiring-guide.md` | Reach-signature code block + Part 5 effect-types table (22→23 kinds). |
| UI | N/A (existing surfaces) | The minted location renders on the hex map through existing location surfaces; the chronicle beat surfaces via the event log; the trace appears in the DebugPanel. Player-facing card is the future Stone signature card (separate content issue). Sphere twist supplied by the THR-549 individualization matrix. |
| Tests | `src/engine/__tests__/encounterAftermath-spawn_unique_location.test.ts` (new, 7) | mint + `controls` edge + unique flags, dedup no-op, explicit-hex, nearAgent-hex, legendary-relic bond, no-artifact, no-hex fail-soft. |

---

## Reach-Signature Hex Signifiers + DebugPanel Surfacing (THR-554)

The UI pillar for the engine-backed reach-signature trio (THR-550/551/552 effects, THR-555 templates). A HexMapV2 signifier layer marks each signature's on-map footprint, plus `__DEBUG`/DebugPanel inspection. Blocked-by THR-550/551/552 (all shipped). Parent epic THR-499.

| Surface | Path | Notes |
|---|---|---|
| Marker selector (engine) | `buildReachSignatureMarkers(graph, controlEffects)` in `src/engine/reachSignatureMarkers.ts` (new) | Pure, deterministic (id-sorted), fail-soft. Detects warhost (`actor.properties.warhost===true` → hex via `located_at`), rift (`ControlEffect.perTickSphereInfluence` at `targetHexCol/Row`, carries `sphere`), wonder (`location.generatedBy==='spawn_unique_location'`). Exports `ReachSignatureMarker` + the detection-contract constants (`WARHOST_MARKER_PROP`, `UNIQUE_LOCATION_GENERATOR`). |
| Render layer | `RENDER_ORDER.REACH_SIGNATURE_SIGNIFIER` (8.8) + `LAYER_Z` (0.078) in `scene/RenderLayers.ts` | Between the rarity ring (8.7) and locations (9) — a ground-level footprint under the entity, like the rarity halo. |
| Mesh factory | `createReachSignatureSignifierLayer(markers)` + `tickReachSignatureSignifiers(layer, elapsedS)` in `scene/ReachSignatureSignifierMesh.ts` (new) | Mirrors `LocationRaritySignifierMesh`: one canvas-drawn glyph sprite per marker (Iron muster-ring+crossed-blades red / Veil vesica tinted to the amplified sphere, pulsing / Stone monument tan), cached CanvasTexture, additive blending, `dispose()`. Colours from `SPHERE_COLORS` + `reachSignatureVisualConstants.ts`. |
| Constants (NFP #1) | `scene/reachSignatureVisualConstants.ts` (new) | Colours, texture size, per-kind sprite scales, static opacity, rift pulse bounds/period, zoom threshold. |
| HexMapV2 lifecycle | `src/components/HexMapV2/HexMapV2.tsx` | New `reachSignatureMarkers?` prop + `reachSignatureSignifierLayerRef`; dedicated marker-keyed rebuild `useEffect` (against `sceneRef.current`, mirrors the army layer); render-loop pulse tick; `[zoomTier]` visibility sync (gated on the location group, regional+); unmount disposal. |
| GameState → renderer | `GameView.tsx` memo `reachSignatureMarkers` (keyed on `graph`/`controlEffects`/`worldVersion`) → `<HexMapV2 reachSignatureMarkers=…>` | Projects live state via `buildReachSignatureMarkers`; no `LocationNode` extension needed (wonder detected from graph nodes directly). |
| Debug bridge (read) | `__DEBUG.listSignatures()` (`src/debug-bridge.ts` + `.d.ts`, `DebugListSignaturesResult`) | The 8 reach signatures × run-unlock status + the ascendant's primary Creation Sphere, score, and `spherePowerMultiplier`. |
| Debug bridge (mutating) | `__DEBUG.fireSignature(reach)` (`DebugFireSignatureResult`) | Grants the signature unlock via `_beatBridge.grantUnlock` (→ `runUnlockedActionIds`), materializes a minimal DEV footprint for the 3 engine-backed reaches (warhost actor / rift `ControlEffect` / unique location — matching the selector's detection contract), returns the sphere-scaled magnitude. `touchWorld`/`touchStructure` so the memo recomputes. |
| Debug UI | `src/components/Game/debug/BeatsDebugTab.tsx` | New **Reach Signatures** block: primary sphere + score + power multiplier, the 8 signatures with lock/unlock (⚙ = engine-backed), and a `fireSignature` control. `runUnlockedActionIds` already surfaced by the existing Run-Unlocked block. |
| Tests | `src/engine/__tests__/reachSignatureMarkers.test.ts` (new, 10) + `scene/__tests__/ReachSignatureSignifierMesh.test.ts` (new, 7) | Selector detection/fail-soft/determinism; mesh build/positions/pulse/dispose. |

---

## Gameplay KPI Harness (THR-457)

Pure telemetry layer: KPI report + eligibility funnel counters + debug surfaces.

| Surface | Path | Notes |
|---|---|---|
| KPI constants | `src/engine/kpi/kpiConstants.ts` | 11 tunable constants — thresholds, amber band, seed list, report tick count. |
| KPI module | `src/engine/kpi/gameplayKpi.ts` | `computeGameplayKpiReport(state, runtime?)` — pure, no PRNG, fail-soft by section. Exports `EligibilityFunnelCounters`, `createEligibilityFunnelCounters`, `KpiRuntimeView`. |
| Trace category | `src/types/trace.ts` | `'kpi'` added to `TraceCategory` union + `TRACE_CATEGORIES` array. `KpiSnapshotTrace` interface appended. |
| SimulationRuntime | `src/engine/simulationRuntime.ts` | `eligibilityFunnel: EligibilityFunnelCounters | null` field; initialized via `createEligibilityFunnelCounters(0)` in `createSimulationRuntime()`. |
| Filter pipeline hooks | `src/engine/encounterFilterPipeline.ts` | `FilterPipelineRuntime` duck-type; `runFilterPipeline` accepts `runtime?` as 8th param; stage-snapshot diff populates `gatedBy` per template when funnel active. |
| Scoring hooks | `src/engine/encounterScoring.ts` | `ScoringRuntime` duck-type; `scoreAndSelect` accepts `runtime?` as 12th param; increments `scored` and `selected` funnel counters. |
| Phase wiring | `src/engine/phaseAgentDecision.ts` | Passes `runtime` to both `runFilterPipeline` (arg 8) and `scoreAndSelect` (arg 12). |
| CLI command | `scripts/cli.ts` | `kpi [--json]` command; `printKpi(isJson)` function. `help` updated. |
| Debug bridge | `src/debug-bridge.ts` + `src/debug-bridge.d.ts` | `window.__DEBUG.getKpiReport()` — async, returns `GameplayKpiReport | null`. |
| DebugPanel tab | `src/components/Game/debug/DebugTabContent.tsx` | `'kpi'` added to `ViewMode` union + `TABS` array; delegates to `<KpiDebugTab>`. |
| KPI tab component | `src/components/Game/debug/KpiDebugTab.tsx` | On-demand compute via `__DEBUG.getKpiReport()`. Refresh button. |
| Batch script | `scripts/gameplay-report.ts` | `npm run gameplay-report` — esbuild-bundled; seeds/ticks/map flags; outputs JSON to `Docs/playtests/kpi/`. |
| Tests | `src/testing/__tests__/gameplayKpi.test.ts`, `eligibilityFunnel.test.ts` | 10 + 7 = 17 tests. |

---

## HexChronicle Dynamic People-Layer Swap (THR-439)

HexChronicle "THE PEOPLE" prose paragraph swaps to the most-recent `survey_completed` event band for the displayed hex, with an attribution caption ("— surveyed, turn N"). Falls back to static culture/faction prose for un-surveyed hexes.

| Surface | Path | Notes |
|---|---|---|
| Props | `HexChronicleProps` in `src/components/Game/HexChronicle.tsx` | `surveyPeopleProse?: string` and `surveyPeopleProseTick?: number` added after `hexRevelation`. |
| Render swap | `HexChronicle.tsx` (The People layer) | Conditional: if `surveyPeopleProse` truthy, renders dynamic band + attribution caption; else renders static culture/faction prose (no structural change to surrounding lists). `cultureMoresProse` rendered outside the conditional (always shown). |
| Attribution style | `surveyAttributionStyle` constant in `HexChronicle.tsx` | `font-size: var(--text-xs)`, muted italic, right-aligned. Rendered only when `surveyPeopleProseTick != null`. |
| GameView derivation | `surveyPeopleEvent` useMemo in `src/components/Game/GameView.tsx` | O(≤`MAX_RECENT_EVENTS`) scan of `gameState.recentEvents` filtered to `type === 'survey_completed'` + `hexCoords` matching `focusedHex`. Returns stable event reference or `undefined`. Dep array: `[gameState.recentEvents, focusedHex]`. |
| Source event | `survey_completed` TickEvent produced by `buildSurveyCompletedTickEvent` in `src/engine/surveyProseComposer.ts` | `message` field carries the prose band; `hexCoords.{col,row}` carries hex identity; `tick` carries survey tick. Flows via `tickEvents` → `recentEvents` merge in orchestrator. |
| Tests | `src/components/Game/__tests__/HexChronicle.test.tsx` | 5 new tests: dynamic band renders, attribution caption with tick, static fallback when absent, static fallback on empty string, both branches render structured lists. |

---

## Survey People-Layer Prose Composer (THR-415)

Hex-scoped prose band emitted on `hex.survey` success. Pure generator — does not touch `proseEnrichment.ts`. First consumer of `survey-prose-tables.ts`.

| Surface | Path | Notes |
|---|---|---|
| Prose composer | `src/engine/surveyProseComposer.ts` | Pure function over graph snapshot + seeded RNG. Exports `composeSurveyPeopleProse`, `buildSurveyCompletedTickEvent`, `deriveMoodBucket`, `deriveFactionPresenceTier`, `resetSurveyEventCounter`. |
| Resolution wiring | `src/engine/unifiedActionResolution.ts` | Calls `composeSurveyPeopleProse` when `completing_action.templateId === 'hex.survey' && finalOutcome === 'success'`. Wrapped in try/catch for fail-soft. |
| TickEvent type | `src/types/gameState.ts` | `'survey_completed'` added to TickEvent union under Revelation events. |
| Color palette | `src/data/uiColorPalette.ts` | `survey_completed: '#a78bfa'` added to exhaustive `TICK_EVENT_COLORS` record. |
| Notification router | `src/engine/notificationRouter.ts` | `survey_completed` added to hex-nav block in `deriveNavigationTarget`; routed to `'discovery'` category in `eventTypeToCategory`. |
| Trace type | `src/types/trace.ts` | `SurveyProseComposedTrace` interface + `'survey_prose_composed'` in TraceType union + TRACE_CATEGORIES. |
| Data tables (consumed) | `src/data/survey-prose-tables.ts` | First consumer. Added 6 new exports: `UNREST_SCALE_MAX`, `FACTION_PRESENCE_DOMINANT_MIN`, `FACTION_PRESENCE_ACTIVE_MIN`, `SURVEY_FACTIONS_LISTED_CAP`, `SURVEY_EVENT_SIGNIFICANCE`, `SURVEY_PEOPLE_CONNECTIVES`. THR-440 adds 4 more: `SURVEY_NAMED_MORTALS_FRAMING`, `SURVEY_BONDED_MORTAL_MARKERS`, `SURVEY_NAMED_MORTALS_CONNECTIVES`, `SURVEY_NO_NAMED_MORTALS_FALLBACK`. |
| Named-mortals band (THR-440) | `src/engine/surveyProseComposer.ts` | Third sentence appended to `composeSurveyPeopleProse` via `rankHexMortals` + `composeNamedMortalsClause`. Bonded-first hard partition, rarityTier prominence, cap 4, real-prose fallback. `SurveyProseComposedTrace` gains `namedMortalCount`. |
| Tests | `src/engine/__tests__/surveyProseComposer.test.ts` | 41 tests: mood-bucket thresholds, faction-tier mapping, named-mortals ranking + clause assembly, bonded-first ordering, cap enforcement, fallback prose, determinism, grammatical assembly, TickEvent builder shape. |

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

### Runtime-owned render caches (THR-577 — detail page + entity prose)

| Piece | Where | Notes |
|---|---|---|
| Session cache | `SimulationRuntime.detailPageCache: Map<string, DetailPage>` + `detailPageCacheTick` (`src/engine/simulationRuntime.ts`) | Owned by runtime (not module-scope). Key: `${pageKind}:${nodeId}:${tick}`. TTL-evicts on tick advance by `DETAIL_PROSE_CACHE_TTL_TICKS`. Cleared by `resetRuntimeCaches()`. |
| Session cache | `SimulationRuntime.proseCache: Map<string, string>` + `proseCacheTick` (`src/engine/simulationRuntime.ts`) | Owned by runtime. Key: `${nodeId}:${tick}:${mode}`. Evicts all entries on tick advance. Cleared by `resetRuntimeCaches()`. |
| Accessor | `generateDetailPage(input)` (`src/engine/detailPageGenerator.ts`) | Optional `input.runtime` — present ⇒ uses `runtime.detailPageCache`; absent ⇒ composes fresh (no module cache). |
| Accessor | `generateEntityProse(nodeId, graph, seed, mode, tick, runtime?)` (`src/engine/proseGenerator.ts`) | Optional trailing `runtime` — present ⇒ uses `runtime.proseCache`; absent ⇒ composes fresh. |
| GameView wiring | `runtime` prop threaded to `<LocationView>` (+ `SublocationDetailView`), `<HexChronicle>`, `<AgentInfoCard>` (`src/components/Game/GameView.tsx`) | Passed into their `generateEntityProse` calls + useMemo deps. |
| Intentional exception | `BRANCHING_TEMPLATE_CACHE` / `RICH_TEMPLATE_CACHE` (`src/engine/kpi/gameplayKpi.ts`) | Kept module-scope with a justification comment — provably static across sessions (pure function of the compile-time template registry; no cross-session bleed). |
| Tests | `proseGenerator.test.ts`, `detailPageGenerator.test.ts`, `TypedDetailPages.test.tsx` | Assert cache population + hit on a per-test `createSimulationRuntime()`, `resetRuntimeCaches()` clears, and no-runtime ⇒ uncached-but-deterministic. |

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
| `post-economy` | `personality_trait_emerge` (THR-527) | `src/engine/phases/personalityTraitEmerge.ts` | (same file — `processPersonalityTraitEmergence`) |
| `post-narrative` | `mandate` | `src/engine/phases/mandate.ts` | `src/engine/phaseMandate.ts` |

Slot anchor positions in `runTick`: `pre-doom`, `post-doom`, `post-resolution`, `post-decision`, `pre-economy`, `post-economy`, `pre-lifecycle`, `post-narrative`. See `src/engine/phaseRegistry.ts` for slot semantics.

#### Inline orchestrator phases — current order:

| Phase | Function | What it does |
|-------|----------|-------------|
| 1.5 | `phaseJourneyBeat` | Journey beat progression |
| 1.75 | `phaseAscendantBeatDirector` | Offer ascendant beats (spine-first → cadence-gated pool); only offers, never resolves (THR-500) |
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
| 2.32 | `phaseInitiativeProgress` | Advance active agent initiatives (THR-51) |
| 2.33 | `phaseMentorship` | Mentor/apprentice edge lifecycle, milestone seeds, terminal arc (THR-75) |
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
| end | `phaseDriftDecay` | Per-tick passive personality-drift decay (`PERSONALITY_DRIFT_DECAY_PER_TICK`, formerly `DRIFT_DECAY_RATE_PER_TICK`). Drift is a temporary delta decaying to zero → the live position (`liveAxisPosition(baseline, drift)`) rests at the agent's baseline, not neutral. Consumes `state.archetypeDrift`. (THR-323 / THR-528) |

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
| Aspect apex (THR-479) | Phase 2a.78 `seedApotheosisEncounters` (eligibility → seed `encounter.apotheosis.ascension`) → Phase 2a.8 spawn → accept-branch aftermath `grant_aspect` effect (`aspects.ts grantAspect`); death→echo in `phaseAgentLifecycle` via `markAspectEchoOnDeath` | `aspect_of` edge (ascendant→mortal, never GC'd; props: attainedTick/originEncounterId/sourceTier/survivesDeath/mythicEcho?/echoedTick?). Essence trickle in `computeEssenceGeneration` + `computeEssenceIncome` | `aspect_attained`, `aspect_echoed` | `window.__DEBUG.getAspects()` / `grantAspectDebug()` | ThreadsPanel "❂ Aspect" badge (`isAspect` on RetinueAgent/ThreadedAgent) |

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

**Placeholder vocabulary:** `{intel:<category>}` (label), `{intel:<category>.detail}`, `{intel:<category>.reliability}` (descriptor: reliable/uncertain/dubious), `{intel:<category>.acquiredTicksAgo}` (raw tick delta since acquired, clamped ≥ 0), `{intel:<category>.acquiredDaysAgo}` (tick delta ÷ `TICKS_PER_DAY`, floored — game days), `{?knows_<category>}…{/knows_<category>}`, `{?no_<category>}…{/no_<category>}`. All intel placeholders silent-strip on missing record (NFP #4). Age placeholders resolve to `'0'` (not `''`) when the record exists but was acquired this tick.

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
| `doomIdentityMatrix.identityMilestones[].triggered` | `evaluateIdentityMilestones` (called from `phaseDoom` each tick, post-advance) | `DebugTabContent` (milestone triggered badges) | ✅ Connected (THR-293) |
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

**THR-75 (2026-05-15):** Six new `mentorship_*` trace categories registered in `TRACE_CATEGORIES` and in the strongly-typed union in `src/types/traces/mentorship-traces.ts`: `mentorship_offered`, `mentorship_started`, `mentorship_lesson`, `mentorship_graduated`, `mentorship_surpassed`, `mentorship_severed`. Emitters: `phaseMentorship` (offered/started/lesson) and `mentorshipOutcomes.resolveMentorship` (graduated/surpassed/severed).

**THR-479 (2026-06-23):** Two new Aspect-apex trace categories in `src/types/trace.ts` (union + `TRACE_CATEGORIES` array) with typed `AspectAttainedTrace` / `AspectEchoedTrace` interfaces: `aspect_attained` (emitter: `aspects.ts grantAspect`), `aspect_echoed` (emitter: `aspects.ts markAspectEchoOnDeath`).

**THR-580 (2026-07-03):** Two new tick-loop-observability trace categories in `src/types/trace.ts` (`TraceCategory` union + `TRACE_CATEGORIES` array + `TraceEntry` union) with typed `TickProfileTrace` / `DistanceMatrixRebuildTrace` interfaces: `tick_profile` (per-tick rollup; emitter: `orchestrator.ts runTick` end, profiling-gated) and `distance_matrix_rebuild` (emitter: `simulationRuntime.ts ensureDistanceMatrix`). **These + `tick_phase_profile` route to a dedicated timing ring** (`traceBuffer.ts` `timingBuffer`, `TIMING_BUFFER_SIZE=4000`) via `emitTiming`/`emitPhaseTiming` — NOT the shared `getTraces()` buffer — read via `getTimingTraces()`, gated by `enableProfiling()`/`isProfilingEnabled()` (independent of `enableTracing()`, off by default). Consumers: `aggregatePhaseTimings()` (pure aggregator), PhasesDebugTab (reads `getTimingTraces()` + `currentTick` prop), CLI `profile` command, `__DEBUG.getPhaseTimings/enableProfiling/disableProfiling`. Note for future trace work: a trace whose category is in `TIMING_CATEGORIES` will only appear in `getTimingTraces()` (profiling on), not `getTraces()`.

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

## Agent-invocation surfaces

Process steps that spawn subagents as part of the Cowork design workflow. When adding a new agent-invocation step: (a) document it in CLAUDE.md § Design Governance, (b) document it in `game-design-direction/SKILL.md` § Finalization or the relevant skill, (c) add a row here.

| Agent step | Skill | Trigger | Sequencing | Notes |
|---|---|---|---|---|
| intent-judge | `.claude/skills/intent-judge/SKILL.md` | Auto at plan-doc finalization; manual `/intent-judge <path>` | After summarize + three-pillar check, before presenting | Gates the handoff: Allow → proceed; Revise/Block/Escalate → fix and re-run |
| design-audit-pipeline | `.claude/skills/design-audit-pipeline/SKILL.md` | Auto after intent-judge Allow; manual `/design-audit <path>` | After intent-judge Allow, before `plan-pending-commit` | Three parallel subagents (NFP / pillar / vision); verdicts merged into plan-doc tail under `## Forked-audit verdicts` |

---

## GameView decomposition (THR-572 → phase 2)

Leaf-first extraction of `GameView.tsx` (god-component) into presentational subcomponents under `src/components/Game/GameView/`. Pure props-down — no `gameState` reshape, all state stays owned by `GameView.tsx`, zero behavior change per step. New subcomponents register in the table below as each step lands.

| Surface | File | Wiring |
|---|---|---|
| Top-bar / HUD strip (THR-579) | `src/components/Game/GameView/GameViewTopBar.tsx` (new) | Extracted the header cluster (SimulationControls, WorldSoulIndicator, AttentionPoolIndicator, DoomBar, OmenIndicator, RivalsButton, Read-the-Threads `IconButton`, Settings gear + `SettingsPanel`) verbatim. `GameView.tsx` renders `<GameViewTopBar … />` at the top of its return, passing `gameState` + discrete values/setters as props (`GameViewTopBarProps`). The 8 top-bar-only component imports moved from `GameView.tsx` into the leaf. Browser-verified at 1920×1080: full-width bar renders (1920×94), settings-toggle opens `SettingsPanel`, 0 console errors. |

---

## Cool-failure story-artifact guarantee (THR-571 C1)

Every resolved `failure` / `critical_failure` action must leave ≥1 persistent story artifact so no failure reads as dead air. A post-pass detects an already-present artifact (step complication, aftermath-planted hidden mark, or `future_hook` encounter seed) and, when none exists, plants a scale-appropriate fallback hidden mark. Two lifetime counters back the KPI `failure_story_rate`.

| Module | Orchestrator phase | UI / read site | GameState flow | Trace categories | Debug visibility |
|---|---|---|---|---|---|
| `src/engine/failureStoryArtifact.ts` (`guaranteeFailureStoryArtifact`) | Called in the resolved-action cleanup at the newly-resolved transition (same site as `branchingFiresTotal`), before the prune — `orchestrator.ts` | Fallback marks are discoverable by future encounters via the existing hidden-mark reveal loop (`consumeMatchingMarks`); the `failure_story_rate` row surfaces in `gameplay-report` / CLI KPI | Appends to `GameState.hiddenMarks` + a low-significance `TickEvent`; increments `SimulationRuntime.failureOutcomesTotal` / `failureStoryArtifactsTotal` (flow through `KpiRuntimeView` into `computeGameplayKpiReport`) | `outcome_story_artifact` (new — `source: existing\|fallback`, `artifactKind: complication\|seed\|mark\|none`) + reuses `hidden_mark_placed` for fallbacks | `failure_story_rate` KPI threshold (live once counters exist); `outcome_story_artifact` traces in the trace buffer |

**Trace registry:** `outcome_story_artifact` added to `TraceCategory` union, `TRACE_CATEGORIES` array, and `TraceEntry` union with a typed `OutcomeStoryArtifactTrace` interface in `src/types/trace.ts`.

---

## Outcome-ladder distribution surfacing + KPI re-band (THR-571 U1)

The outcome ladder made observable: a live histogram of the resolution split plus each KPI band's green/amber/red verdict, so the world's texture (at-cost-dominant, clean/crit rare) reads at a glance. Pure surfacing over `computeGameplayKpiReport` — no new outcome logic. The **re-band** (design gate 2026-07-04, "accept the capability-poor world") re-fits the bands so scrape-through owns the success mass and clean/crit are rare signals: at-cost ceiling 0.45→0.70, total-success floor 0.55→0.50, clean floor 0.20→0.03, crit-failure ceiling 0.05→0.15, failure ceiling 0.40→0.50. Clean/crit-success now read from **lifetime counters** (`resolvedActionsTotal` / `cleanSuccessTotal` / `critSuccessTotal` on `SimulationRuntime` + `KpiRuntimeView`, incremented at the newly-resolved transition) instead of the windowed snapshot — a windowed ≥N% tail over ~72 resolved/window is 1–2 events, too noisy to gate. Crit-success is **advisory** (`KpiThresholdEvaluation.advisory`, report-but-don't-gate): too rare (0.7–1.6% lifetime) to gate with margin.

| Module | Orchestrator phase | UI / read site | GameState flow | Trace categories | Debug visibility |
|---|---|---|---|---|---|
| `computeGameplayKpiReport` (existing) | Lifetime counters incremented in resolved-action cleanup at the newly-resolved transition (same site as `branchingFiresTotal`) — `orchestrator.ts` | CLI `status` outcome line (`scripts/cli.ts` `printStatus`); **DebugPanel KPI tab** (`KpiDebugTab.tsx`) — full Outcome Ladder section (total/clean/at-cost/crit-succ/crit-fail/story) + advisory rows dimmed with `(adv)`; **chronicle band** (`ChapterView.tsx`) — final outcome rendered as a lexicon band ("won, at a price" / rare-tier gold-red for crits), never the raw enum | `SimulationRuntime.resolvedActionsTotal` / `cleanSuccessTotal` / `critSuccessTotal` → `KpiRuntimeView` → `computeGameplayKpiReport` | none new | `__DEBUG.getOutcomeDistribution(windowTicks?)` → `{ tick, seed, outcomes, thresholds }` (`src/debug-bridge.ts` + `.d.ts`); `windowTicks` filters the histogram by `completedAtTick`, cumulative rows stay lifetime |

---

## Notification threading gate + entity notice badge (THR-666)

Threading is the attention contract: an agent the ascendant holds no thread to is not the player's business. `routeNotifications` previously filtered by category preference and fog-of-war only, so any producer attaching `notification: { channel: 'toast' }` to a per-agent event toasted globally — strangers announced their becomings and misfortunes to a god who had never met them.

| Module | Orchestrator phase | UI / read site | GameState flow | Trace categories | Debug visibility |
|---|---|---|---|---|---|
| `src/engine/notificationThreadingGate.ts` (new) — `resolveEventRouting` / `buildThreadingGate` / `isMortalAgentNode` | None (UI-side routing, not a tick phase) | `useNotifications` builds the gate per routing pass and passes it to `routeNotifications` | Reads `gameState.graph` + `gameState.ascendantId`; writes `NotificationState.entityNotices` | None (pure routing decision; the underlying TickEvents already trace) | `[data-testid="thread-entity-notice-badge"]` + `data-notice-badge-category` / `-count` attributes |
| `src/components/Game/entityNoticeBadgeModel.ts` (new) — `selectEntityNoticeBadges` | — | `GameView` `noticeBadges` memo → `ThreadsPanel` → `CompactThreadRow` → `EntityNoticeBadge` | Pure selector over `notificationState.entityNotices` | — | — |

**Routing contract:** `resolveEventRouting` returns one of three outcomes per event.

| Outcome | When | Effect |
|---|---|---|
| `global` | No `actorId`; or the event type is in `ALWAYS_GLOBAL_EVENT_TYPES`; or the actor is not a mortal agent | Toasts/alerts/popups exactly as before |
| `entity` | Actor is a mortal with a live (non-dormant) thread | `toast` channel only diverts to the agent's row; `alert` and `popup` still escalate globally |
| `suppress` | Actor is a mortal the player holds no live thread to | No player-facing notification at all. **The TickEvent is untouched** — it still reaches the tick event log and the chronicle |

**Constants (NFP #1):** `ALWAYS_GLOBAL_EVENT_TYPES` (doom, omens, settlement/economy, discovery, faction, army, divine feedback), `ENTITY_DIVERTED_CHANNELS` (`toast` only), `ENTITY_NOTICE_MAX_RETAINED` (60), `NOTICE_CATEGORY_ACCENT` / `NOTICE_CATEGORY_LABEL` / `NOTICE_BADGE_COUNT_DISPLAY_MAX`.

**Shared threading definition:** `collectThreadedAgents(graph, ascendantId)` was extracted from `phaseEncounterVisibility` (`src/engine/encounterVisibility.ts`) and is now the single source of truth for "who is threaded" — the gate and the encounter-visibility phase read the same map, so the two surfaces cannot disagree.

**Mortal-agent predicate — read this before touching the gate:** a mortal is `node.type === 'actor' && node.properties.actorType === 'individual'`, matching the lifecycle/ambition/expression phases. `GraphNode` has **no `category` field** (that belongs to `ThreadedNode` in the UI layer); an early draft keyed on `node.category === 'agent'`, which would have made the gate silently no-op. Graph-backed tests in `notificationThreadingGate.test.ts` cover this — the injected-predicate unit tests pass either way.

**Badge family:** third sibling of `EncounterBadge` (THR-664) and `ThreadTugBadge` (THR-665), same `IconButton` + `Tooltip` primitives, category-tinted through existing tokens. The row now reads as one vocabulary in three tenses — the tug says "about to happen", the encounter badge "happening", the notice badge "happened to them".
