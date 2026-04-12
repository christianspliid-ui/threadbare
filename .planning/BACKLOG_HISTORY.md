# Backlog History

> Archive of completed backlog items. Active items are in `BACKLOG.md`.
>
> Archived: 2026-03-31

---

## ✅ TB-097 · Social Expansion B: Ambition-Driven Strategic Actions — Merchant Proving Slice (2026-04-12)

**Milestone: v1.2 Social Systems Expansion — Phase B**

Merchant proving slice delivered and verified. Enabled `ENABLE_STRATEGIC_ACTIONS` feature gate and fixed two blocking bugs: (1) `phaseAgentDecision` never returned `strategicState` to the orchestrator (dead local variable reassignment discarded on `continue`), (2) property name typo `domainCapability` vs `domainCapabilities` caused all reach floor checks to reject every candidate. CLI verification with seed 42 confirmed: merchants with `ambition_dominate_trade` generate 4+ candidates, strategic actions win over encounters when scored higher (bestStrat=0.462 > bestEnc=0.442), multi-tick projects complete (Build Warehouse tick 9, Found Guild Chapter tick 12), and control claims create graph edges. 29 tests across 4 files pass.

**Creates:** Strategic candidate generator (6 merchant templates), family-aware chooser scoring bridged into unified decision pipeline, multi-tick project lifecycle (active/completed/failed), control-state claims, graph mutations (sublocations, trade routes, intelligence), strategic telemetry via debug bridge.
**Design doc:** `Docs/plans/2026-04-09-ambition-driven-strategic-actions-design.md`
**Implementation plan:** `Docs/plans/2026-04-09-ambition-driven-strategic-actions-implementation-plan.md`
**Commits:** `4f79098f` (implementation), `8706a8db` (enable + bugfix)
**Next:** Phase 8 — behavior family expansion (builder, scholar, zealot, etc.), UI/Threads visibility, HexMap strategic overlays.

---

## ✅ TB-119 · Faction Network Visibility & Governance Pass (2026-04-08)

Reframed factions as visible institutions instead of hidden metadata. The faction sheet now renders a live network view with leadership, officers, member roster, reputation bars, dominant reaches/domain capabilities, active ambition, halls, governing seats, controlled holdings, relations, and a simple faction network graph. Character and thread surfaces now expose faction standing directly, including rank and reputation, so the player can see who belongs where without opening debug-only tooling.

The systemic loop was hardened too: faction reputation decay now waits for an inactivity grace window and decays more slowly, faction members get stronger urgency to maintain standing and pursue promotion, faction-flavored social encounters reserve space in the social pipeline, and faction-linked NPCs can participate even when they are not spotlight actors. Data-driven factions now also claim home locations and recruit/affiliate nearby NPCs in capitals, castles, forts, and settlements, giving civic and military institutions a real in-world footprint. Faction sheets can now launch faction-targeted ascendant actions directly.

**Files:** `src/components/Game/FactionSheet.tsx`, `src/components/Game/GameView.tsx`, `src/components/Game/ThreadDetailView.tsx`, `src/components/Game/AgentDetailPanel.tsx`, `src/components/Game/tabs/OverviewTab.tsx`, `src/components/Game/tabs/BondsTab.tsx`, `src/engine/factionNetwork.ts`, `src/engine/graphQueries.ts`, `src/engine/agentDetail.ts`, `src/engine/retinue.ts`, `src/engine/factionReputation.ts`, `src/engine/factionQuestGeneration.ts`, `src/engine/socialEncounterGeneration.ts`, `src/engine/npcSeeding.ts`, `src/engine/worldSeed.ts`, `src/data/faction-constants.ts`, `src/data/civic-guard-definition.ts`, `src/data/mercenary-company-definition.ts`.

---

## ✅ TB-118 · Objective Triangle Sync — Doom, Journey, Mandate (2026-04-08)

Reworked the three long-term objective systems into one synchronized loop. The Doom Clock now escalates through authored doom-card beats and saves chapter five as a climax window. The First's journey cadence is aligned to those same doom thresholds so the return resolves before the final act. Mandates are now generated from ascendant remembrance identity (primary/secondary spheres + court shape), track global sphere-strength growth from run-start baselines, and feed missed/exceeded checkpoint results back into future doom severity through doom debt and counter-omens. The top-bar and detail surfaces now show that shared state directly so the player can read the race between world pressure, The First, and divine intent.

**Files:** `src/data/game-config.ts`, `src/engine/doomClock.ts`, `src/engine/gameInit.ts`, `src/engine/mandateGenerator.ts`, `src/engine/phaseDoom.ts`, `src/engine/phaseMandate.ts`, `src/components/Game/DoomBar.tsx`, `src/components/Game/DoomClockDetail.tsx`, `src/components/Game/MandateTracker.tsx`, `src/components/Game/MandateDetail.tsx`, `Docs/plans/2026-04-08-objective-triangle-sync-design.md`.

---

## ✅ TB-117 · Terrain Texture Lab POC (2026-04-08)

Standalone WebGL playground for terrain material experiments before touching HexMapV2 production rendering. Added dev route `?view=terrain-lab` with a separate Three.js scene, instanced shader preview, six starter recipes (grassland, forest, mountains, dunes, coast, swamp), live controls for color/noise/warp/banding/animation plus perspective camera tilt/bearing/zoom, built-in and imported GLB placement on preview hexes, localStorage persistence, and JSON export. Includes implementation/research note: `Docs/plans/2026-04-08-terrain-texture-lab-poc.md`.

**Files:** `src/App.tsx`, `src/components/HexMapV2/lab/TerrainTextureLab.tsx`, `src/components/HexMapV2/lab/TerrainTextureLabCanvas.tsx`, `src/components/HexMapV2/lab/terrainTextureLabPresets.ts`, `src/components/HexMapV2/lab/terrainTextureLabShader.ts`, `src/components/HexMapV2/lab/__tests__/terrainTextureLabShader.test.ts`, `Docs/plans/2026-04-08-terrain-texture-lab-poc.md`.

---

## ✅ TB-116 · Encounter Veil (2026-04-07)

Full-screen encounter overlay replacing TieredEncounterModal (973 lines) and EncounterStage (925 lines) with a single `EncounterVeil` component using the dissolved-art Remembrance aesthetic. All three thread tiers supported: strongly_threaded (full art, full prose, 3 choices, paused sim), lightly_threaded (reduced art, auto-resolve timer, 2 choices), watched (peek gate, boost slider, desaturated art). Aftermath mode with actor moments, changes, highlights, and reactions. Wired into GameView as the single rendering path for all encounters. Deleted both legacy modals. Net: ~2644 lines added, ~2457 removed.

**Files:** `src/components/Game/EncounterVeil.tsx` (new, 1593 lines), `src/components/Game/buildSimpleEncounterStageModel.ts` (new), `src/components/Game/encounter-stage/types.ts` (ThreadTier/courtPositionToThreadTier relocated here), `src/types/encounter.ts` (illustrationUrl/illustrationAlt added), `src/types/unifiedAction.ts` (EncounterStageChoiceModel extended: interventionType, godVoice, probabilityBoost), `src/components/Game/GameView.tsx`, `TieredEncounterModal.tsx` (deleted), `EncounterStage.tsx` (deleted).

---

## ✅ TB-114 · Ambient Sound System (2026-04-06)

Three independent audio channels (Music, Background, UI) with context-sensitive ambient sound. BackgroundChannel has 4-priority stack driven by terrain/location/encounter state. MusicChannel replaces themeAudio.ts with encounter track swap. Volume sliders + master mute in SettingsPanel. 5 new test files. HexMapV2 gains `onCameraCenterHex` prop feeding camera center to ambient context hook `useAmbientContext`. EncounterTemplate gains `backgroundTrack?` and `musicTrack?` for per-encounter audio overrides.

---

## ✅ TB-031 · Culture Seeding — Territory-Aware Placement Phase 1 (2026-03-25, complete 2026-03-31)

Cultures now get geographic homelands via the province flood-fill system. Pipeline reordered: cultures generated before worldgen, passed to province seeder, then locations and actors inherit culture from their province. Fixed preferredBiomes/toleratedBiomes bug in composeCultureIdentity. Added homeland/border strength differentiation, diaspora mechanics (~10%), borderland dual-culture chance (40%). All backward-compatible via optional params.

**Files:** cultureGenerator.ts (split into generateCultureIdentities + registerPregenCultures), hexGrid.ts (preserve provinceIds/provinces), worldSeed.ts (territory-aware assignment), gameInit.ts (reordered pipeline), culture.ts (new constants).

---

## ✅ TB-088 · Distance Matrix — Remove Silent Truncation (2026-03-31, complete 2026-03-31)

`MAX_DISTANCE_MATRIX_SIZE` raised from 500 to 1200, dev-mode warning on cap. See commit `ae428c8`.

---

## ✅ TB-087 · Per-Session SimulationRuntime — Move Caches Out of Module Scope (2026-03-31, complete 2026-03-31)

`SimulationRuntime` owned by `useSimulation`, caches rebuild lazily from `structuralCacheVersion`. Legacy fallback for tests. See commit `ae428c8`.

---

## ✅ TB-086 · Mutation Observability — `worldVersion` / `structuralCacheVersion` + Touch API (2026-03-31, complete 2026-03-31)

`SimulationRuntime` with `touchWorld()`/`touchStructure()` API, version-keyed `useMemo` deps, 9 contract tests. See commit `ae428c8`.

---

## ✅ TB-085 · CLI Stale Field References + Test Timeout (2026-03-30, complete 2026-03-30)

CLI `printDoom()` now uses correct `currentTick`/`totalTicks` fields. Multi-seed encounter liveness test gets 20s timeout. See commit `dd4907b`.

---

## ✅ TB-084 · Graph Schema Gaps — `constructed_by` Edge + `bonded_to` Target Mismatch (2026-03-30, complete 2026-03-30)

`constructed_by` added to EdgeType + EDGE_SCHEMA, `starter_ashenmane_fang` type corrected to `artifact_legendary`. See commit `cebcfa5`.

---

## ✅ TB-083 · Duplicate React Key Errors — Event ID Collisions (2026-03-30, complete 2026-03-30)

All event ID generators now include tick in their format string to prevent cross-tick collisions. Fixed 6 modules: orchestrator, phaseMovement, phaseColocationDetection, journeyEngine, returnEngine, narrative. Eliminates 284+ duplicate React key errors per page load.

---

## ✅ TB-081 · Hex Action Remaining Effects (2026-03-30, complete 2026-03-30)

All 8 remaining hex action effects wired via dynamic GraphOp generators. Tier 1 (full effects): amplify_flow, shift_dominion, spark_encounter. Tier 2 (lightweight apply_influence with behaviorTags for future TB-069): stir_people, summon_congregation, bestow_vision, incite_exodus, plant_dream. 9 tunable constants, 23 tests.

---

## ✅ TB-080 · Mercenary Company Runtime Wiring (2026-03-30, complete 2026-03-30)

Phase 18: Wired existing merc company definition + encounter templates into runtime. Multi-instance faction seeding, factionDefId key, mc.* encounter pipeline (accessible templates, sublocation detection, promotionPending), rank gating, reputation tracking, auto-triggered promotions. 2 plans.

**Phase:** `.planning/phases/18-wire-mercenary-company-seeding-and-encounters-into-the-runtime-pipeline/`

---

## ✅ TB-079 · Action Description Fields & Activation Feedback (2026-03-30, complete 2026-03-30)

Phase 17: MTG-style ActionCard redesign (art frame + spell name + technical description + flavor text), evocative spell-like names, activation feedback (glow burst + audio + particle burst on hex map + consequence toast). Card art generation deferred. 4 plans across 3 waves.

**Phase:** `.planning/phases/17-add-action-description-fields-and-player-feedback-on-action-activation/`

---

## ✅ TB-077 · Graph-Native Encounter Lifecycle — Layer 1 (2026-03-30, complete 2026-03-30)

Encounter outcomes create durable `event` nodes in world graph with `participated_in` (agent → event) and `occurred_at` (event → location) edges. Graph query utilities + prose resolvers for location history and agent biography. 14 tests. Layers 2 (goal edges) and 3 (active encounter projection) remain deferred.

**Design doc:** `Docs/plans/2026-03-29-graph-native-encounter-lifecycle-design.md`

---

## ✅ TB-078 · Ascendant Sheet QA Fixes (2026-03-29, complete 2026-03-29)

Tooltip z-index fix (systemic — base z-index 50→70 in Tooltip.tsx, fixes all in-modal tooltips), foundation.order world-model node, ProseKeyword SPHERE_NAMES_SET foundation sphere addition, IconButton close button parity, a11y (aria-labelledby, semantic lists), Creation/Foundation essence split in AscendantSheet. Polish: essence visual bars, staggered fade-in.

**Handover:** `.planning/HANDOVER.md` → 2026-03-29 entry

---

## ✅ TB-074 · Encounter Tuning & Agent Variety — Full Tuning Pass (2026-03-29, complete 2026-03-29)

Fixed 7 root causes from encounter log analysis (seed 42): content deserts, zero movement, small pools, no difficulty escalation, born-later starvation, undifferentiated capability, score display bug. All 4 sessions complete. Phase A: template coverage ≥8 per location type. Phase E: score display fix + dynamic cooldowns. Phase B: familiarity discount, exploration bonus, travel cost dampening, personality amplification. Phase D: born-later spawn at content locations + difficulty tier escalation. Phase C: encounter chains (3 starter chains).

**Design doc:** `Docs/plans/2026-03-29-encounter-tuning-and-agent-variety-design.md`
**Analysis source:** `Docs/analysis/2026-03-29-encounter-log-analysis-seed42.md`

---

## ✅ TB-075 · Born-Later Spawn & Difficulty Escalation (2026-03-29, complete 2026-03-29)

Part of TB-074 Session 3. `selectSpawnLocation()` prefers content locations. `selectDifficultyTier()` applies early/mid/late scaling.

**Parent:** TB-074

---

## ✅ TB-076 · Encounter Chains (2026-03-29, complete 2026-03-29)

Part of TB-074 Session 4. `EncounterChain` data type, `ChainProgress` agent property, 3 starter chains (Scholar's Path, Rise Through the Ranks, Merchant's Gambit).

**Parent:** TB-074

---

## ✅ TB-073 · Conflict & Destruction — Armies, Sieges, Battles (2026-03-27, complete 2026-03-29)

Phase 12 (Conflict & Destruction) delivered the M2 conflict engine: mercenary company faction (4 ranks, 10 encounters, military reach weights), faction ambition system (evaluation every 5 ticks, ambition graph nodes, revenge decay), army types (warband/regiment/host with Quintessence vitality), army spawning (Iron Tier 4+ commander, Gold Tier 3+ faction, MAX_ARMIES_PER_FACTION=1), army movement costs (terrain multipliers, 40% road discount), Quintessence attrition (base+terrain+offRoad+underfunded, threshold encounters at 70/50/30/10%), battle detection (hostile colocation → battle node), momentum-based field battle resolution (log2 size ratio × 1.5, spotlight shifts, ±8 threshold, 5-tick max), siege resolution (accelerating pacing 5→1, fortification 3x/10x/30x, starvation at tick 15, ±12 threshold, 40-tick max), destruction aftermath (minor/major/total severity, prosperity loss, settlement downgrade/ruins, sublocation destruction, trade route severance, commander capture/kill), Armies debug tab. 102 new tests across 7 plans.

**Design doc:** `Docs/plans/2026-03-29-conflict-and-destruction-design.md`
**Plans:** `.planning/phases/12-conflict-destruction/` (12-01 through 12-07)

---

## ✅ TB-072 · World-Soul Connection — Cosmic Metabolism (2026-03-27, complete 2026-03-29)

Phase 10 (Sphere Affinity) delivered the full World-Soul connection: per-entity sphere affinity data model (triangle number scale), pressure resolution engine, 6 upstream pressure sources, downstream modifiers (prosperity, encounters, agent decisions), magic as sphere fluency, full UI layer (WorldSoulIndicator, ProseKeyword IPK, HexChronicle Soul, DebugPanel Sphere State tab), TERRAIN_SPHERE_TABLE + LOCATION_SPHERE_TABLE. M1.2 encounter wiring complete (computeEncounterResonance + computeWorldSoulValueDrift). 109 sphere tests.

**Remaining M1 items (not blocking):** prosperity harmonic (M1.3), terrain drift (stretch goal)
**Design doc:** `Docs/plans/2026-03-28-world-soul-connection-design.md`

---

## ✅ TB-070 · Agent Character Sheet Overhaul — Tabbed Layout & Narrative Revelation (2026-03-29)

5-tab AgentProfileModal (Overview, Prowess, Bonds, Journey, Chronicle), multi-faceted AgentKnowledge revelation system with interactionDepth accumulator, 4 divine action cards (Observe/Scry/Whisper Insight/Dream Sending), debug panel Revelation Log + Knowledge Comparison tabs. Phase 11: 6 plans (4 core + 2 gap closure), verified 13/13 must-haves.

**Design doc:** `Docs/plans/2026-03-27-agent-character-sheet-overhaul-design.md`
**Phase:** `.planning/phases/11-agent-character-sheet/`

---

## ✅ TB-067 · Notification Expansion — Clickable Nav, Right-Click Dismiss, Preferences Panel (2026-03-27)

Three features expanding the notification system: (1) clickable notifications that navigate to the relevant game entity (encounter modal, hex, location, faction, journey), with channel-specific behavior (toast: navigate+dismiss, alert: navigate only); (2) right-click instant dismiss on toasts and alerts; (3) notifications section in SettingsPanel with per-category on/off and permanent/temporary toggles, persisting across sessions via localStorage with per-game overrides. Three implementation phases: A (right-click dismiss), B (navigation targets), C (preferences panel).

**Design doc:** `Docs/plans/2026-03-27-notification-expansion-design.md`
**Handover:** `.planning/HANDOVER.md` → 2026-03-27 entry
**Depends on:** SettingsPanel (TB-064, ✅)

---

## ✅ TB-066 · Palette Theme System — Feature-Flagged Color Scheme (2026-03-27)

Feature-flagged color scheme for HexMapV2 with two shipped themes: Golden Hour (warm default) and Dark Parchment (cool/dark alt). PaletteTheme interface with 17 color slots covering scene, roads, borders, capitals, grid, elevation, fog, and labels. activePalette singleton with URL param (`?palette=dark-parchment`) and change listener API. Settings panel dropdown for runtime palette switching. 11 scene/overlay files refactored from hardcoded colors to `getActivePalette()`. 51 new tests.

---

## ✅ TB-065 · Encounter Modal Prose Variables Unresolved — bug (2026-03-27)

TieredEncounterModal renders raw `{actor}`, `{adj}`, `{verb}`, `{noun}` placeholders. The modal calls `enrichProse()` but that function doesn't handle encounter-specific variables — only agent-narrative ones (`{name}`, `{location}`, etc.). Fix: extend `enrichProse()` with encounter variable resolution, extract shared word pools from orchestrator dilemma logic.

**Handover:** `.planning/HANDOVER.md` → 2026-03-27 entry
**Severity:** Visible to player — prose reads as broken templates

---

## ✅ TB-058 · Faction Vertical Slice — Adventuring Guild (2026-03-27)

End-to-end faction system using a prototype Adventuring Guild. Proves the full loop: discover guild halls → join via encounter → do faction quests → build reputation → get promoted via encounter → access rank-gated content. Data-driven and generalizable for procedural faction generation. Four phases decomposed into TB-059–TB-062.

**Design doc:** `Docs/plans/2026-03-27-faction-vertical-slice-design.md`
**Brainstorm:** `brainstorm-faction-vertical-slice.md`
**Depends on:** Encounter system (✅), Social Fabric design (✅), Guild Seeding (✅), Tier Promotion (✅)

---

## ✅ TB-059 · Faction Definition Schema & Guild Seeding (Phase 1)

FactionDefinition type with rank tiers, reach weights, encounter access, expulsion consequences. member_of edge extension (reputation, factionDefId). Adventuring Guild definition data. Generic `seedFactionFromDefinition()` that places guild hall sublocations at qualifying towns. Test signal: guild halls visible on map, faction node with reachPreferences in graph.

**Design doc:** `Docs/plans/2026-03-27-faction-vertical-slice-design.md` → Phase 1
**Parent:** TB-058

---

## ✅ TB-060 · Quest Board & Reputation Tracking (Phase 2)

10 quest templates (explore ruins, hunt monsters, survey wilds, escort, recover artifacts + senior/elite variants). `generateFactionQuestCandidates()` in agent decision phase — rank-gated, reach-weighted. Reputation gain on quest completion, per-tick decay via new orchestrator phase 7.15. Rank auto-computed from reputation thresholds. Test signal: agents receive faction quests, reputation changes visible in traces, decay observable over time.

**Design doc:** `Docs/plans/2026-03-27-faction-vertical-slice-design.md` → Phase 2
**Parent:** TB-058
**Depends on:** TB-059

---

## ✅ TB-061 · Join & Promotion Encounters (Phase 3)

Join encounter at guild halls (creates member_of edge with starting reputation). Promotion encounter (threshold-triggered, narrative tension, partial success with complications). `factionOutcome.ts` for GraphOps on join/promote. `excludeIfMemberOf` filter for join encounter visibility. Test signal: agents organically join guild, promotions fire with varied outcomes, rank changes traced.

**Design doc:** `Docs/plans/2026-03-27-faction-vertical-slice-design.md` → Phase 3
**Parent:** TB-058
**Depends on:** TB-060

---

## ✅ TB-062 · Faction Social Encounters & Rank Bonuses (Phase 4)

6 faction-scoped social templates (sparring, tavern, mentorship, rivalry, guild politics, joint expedition). Shared-faction filter in social encounter generation. Rank bonus application at integration points (reward multiplier, reputation walk bonus, scoring boost). Test signal: guild members interact socially, higher ranks get tangible bonuses, full loop running.

**Design doc:** `Docs/plans/2026-03-27-faction-vertical-slice-design.md` → Phase 4
**Parent:** TB-058
**Depends on:** TB-059 (can run parallel with TB-061)

---

## ✅ TB-063 · Faction UI & Visibility (Phase 5)

Agent profile faction section (knowledge-gated: name → rank → reputation bar → full detail). HexChronicle faction events (joined, rank change, expelled, quest complete, promotion). AlertBar faction notifications (⚜ glyph, amber). DebugPanel factions tab (faction list, member table, reputation histogram, per-agent faction view). Guild hall signifier on HexMapV2. Test signal: player sees faction membership on agents, faction events in chronicle, developer can inspect full faction state.

**Design doc:** `Docs/plans/2026-03-27-faction-vertical-slice-design.md` → Phase 5
**Parent:** TB-058
**Depends on:** TB-059 (can start after Phase 1, expands as later phases land)

---

## ✅ TB-064 · In-Game Settings Panel (2026-03-27)

Single ⚙ gear icon in the top-right topbar opens a dropdown panel with categorized toggle settings. Replaces the separate fog + debug icon buttons. Sections: Display (Fog of War toggle), Debug (Debug Trace Panel, Organic Shore). Panel closes on Escape or click-outside. Extensible for future settings.

**Depends on:** None

---

## ✅ TB-057 · Tick Health Monitor & Crash Log (2026-03-26)

Tick loop has no try/catch — phase failures are silent. Several GameState arrays (`encounterNotifications`, `unifiedActions`) grow without bound. Add: (1) `validateTickOutput()` health checker with 12 structural checks run after every tick, (2) try/catch wrap around `runTick` body (crashed tick → return previous state unchanged), (3) crash log buffer + `exportDiagnostics()` on `window.__DEBUG`, (4) state cleanup for unbounded arrays. Also: restore truncated `orchestrator.ts` (VM corruption deleted 81 lines). Handover: `.planning/HANDOVER.md`.

---

## ✅ TB-056 · Agent Encounter Tuning — Idle Death Spiral Fix (2026-03-26)

Agents are 95%+ idle across 72 ticks. Three compounding bugs: (1) `domainCapabilities` generated at init but never read by `computeRawScore()` — agents start with ~2% capability, (2) floor-clamped probabilities (0.05) cascade into zero scores below `IDLE_SCORE_THRESHOLD`, (3) filter pipeline starves some locations of all candidates. Root cause fix: wire `domainCapabilities` into `computeRawScore()`. Tuning pass: lower `DIFFICULTY_BASE` 35→25, `IDLE_SCORE_THRESHOLD` 0.001→0.0001, `ENCOUNTER_ABANDON_COOLDOWN` 20→8, `IDLE_TRIVIAL_PREFERENCE` 0.8→0.5, `THREAT_FLOOR_FILTER` true→false. Handover: `.planning/HANDOVER.md`.

---

## ✅ TB-055 · Tiered Encounter Modal — Chronicle Narrator (2026-03-26)

Replace passive `EncounterVignetteModal` with tiered encounter modal: chronicle-style prose (drop-cap, no section labels), multi-step navigation, intervention choices per thread tier (Strongly/Lightly/Watched), action icons, TTS narrate button, peek gate, auto-resolve timer. Prototype: `encounter-modal-prototype.jsx`. Handover: `.planning/HANDOVER.md`.

---

## ✅ TB-054 · Avatar Portrait & Hex Map Visibility (2026-03-26)

Player's avatar is invisible on HexMapV2 — renders as indistinguishable faction dot. Three fixes: (1) generate 8 sphere-specific avatar portraits via mcp-image, (2) extend AgentRenderData with `isAvatar` + `avatarSphereColor`, (3) add pulsing sphere ring + scale boost in AgentSpriteMesh. Design: `Docs/plans/2026-03-26-avatar-portrait-and-hex-visibility-design.md`.

---

## ✅ TB-053 · Encounter Log Exporter — Debug Tool for Tuning (2026-03-26)

Per-tick, per-agent encounter lifecycle log exported from the debug panel as TSV. Shows decisions, movement, encounter tests, and outcomes in a format readable by humans and AI. Separate timeline accumulator (not trace buffer) to avoid ring-buffer eviction. Agent dropdown + export button in encounters debug tab.

**Plan:** `Docs/plans/2026-03-26-encounter-log-exporter-design.md`

---

## ✅ TB-052 · Encounter Reward Wiring — Items from Encounters (2026-03-26)

Reward pool engine and attachment types exist but nothing connects them to the live game. Zero encounters define rewards, orchestrator doesn't call pool assembly, no artifact instantiation, no UI. Design wires all four gaps: template-clone instantiation, orchestrator integration, artifact catalog expansion (~50 items), content pass on ~30 encounters, event message enrichment.

**Plan:** `Docs/plans/2026-03-26-encounter-reward-wiring-design.md`

---

## ✅ TB-050 · Retinue Panel Eye Icons — Wrong Behavior (2026-03-26)

Already fixed in committed code. Agent eye icon zooms camera to hex at z=20 (`handleCenterOnHex`), location eye icon navigates to location detail view (`handleZoomToLocation` → `handleLocationClick`). Cowork handover was stale.

---

## ✅ TB-001 · Hex Map V2 (2026-03-23)

All 9 phases complete (including inserted Phase 7.1 Stencil Coastline, behind feature flag). V1 SVG hex map deleted. HexMapV2 is sole renderer.

**Roadmap:** `.planning/ROADMAP.md`

---

## ✅ TB-002 · HexMapV2 Quick Wins — Consistency & Type Safety (2026-03-25)

---

## ✅ TB-013 · Agent Sprite Scale Bug + Zoom Threshold Unification (2026-03-25)

Agent sprites shrink to ~1 world unit after first movement because the settle animation resets scale to absolute 1.0 instead of the sprite's base size. Also, `AGENT_ZOOM_THRESHOLDS` disagrees with `ZOOM_TIER_THRESHOLDS` (hero-local at k=5 vs k=15), causing wrong sprite tiers to display. Continental group (retinue dots) is never shown.

**Plan:** `Docs/plans/2026-03-25-agent-sprite-scale-and-zoom-fix.md`

---

## ✅ TB-014 · Dynamic Kanban Board (2026-03-25)

`kanban.html` maintains a hardcoded `ITEMS` array that must be manually updated whenever BACKLOG.md changes. Replace with a parser that reads BACKLOG.md at load time via `fetch()`, extracts headings + emoji prefixes + metadata (dates, links, deps), and renders cards dynamically. Single source of truth, zero manual sync.

**Scope:** `kanban.html` only — self-contained, no build step, no dependencies.

---

## ✅ TB-030 · Agent Spawn Integrity Fixes (2026-03-25)

Six defects in agent creation and tick-loop handling. **Critical:** births are completely broken (wrong edge type query — `contains` instead of `located_at`). Also: born agents have empty axiological profiles, no fail-soft wrapping in `phaseMovement`, sublocation null-deref risk, and no centralized agent validation.

**Assessment:** `Docs/agent-spawn-assessment.md`
**Plan:** `Docs/plans/2026-03-25-agent-spawn-integrity-fixes.md`

---

## ✅ TB-033 · Graph Schema Enforcement (completed 2026-03-25)

Three-layer graph schema enforcement: (1) 30 canonical query functions in `graphQueries.ts`, (2) `EDGE_SCHEMA` registry with source/target type constraints for all 22 edge types, (3) dev-mode validated `addEdge` with warnings. Migrated 5 high-traffic files, schema-driven `validateAgentIntegrity`. 45 new tests.

**Design doc:** `Docs/plans/2026-03-25-graph-schema-enforcement-design.md`

---

## ✅ TB-015 · Rendering Module Resilience Refactor (2026-03-25)

Four-phase refactor: shared primitives (hexKey, worldPosition, hexGrouping), sprite abstraction layer (AgentAnimationTarget), zoom convenience (isLayerVisible), hook extraction (3/6 already done via TB-016, remaining 3 deferred — tightly coupled with scene init lifecycle).

**Design + plan:** `Docs/plans/2026-03-25-rendering-module-resilience-refactor.md`

---

## ✅ TB-016 · HexMapV2 Medium-Term Improvements (2026-03-25)

All three items complete:
1. ✅ Extract custom hooks (useAgentAnimations, useFogCulling, useZoomLayerVisibility) — HexMapV2.tsx 1256→1033 lines
2. ✅ Signifier InstancedMesh with texture atlas + custom GLSL shaders — ~4K draw calls → ~20
3. ✅ Single sprite per agent with material swap on zoom change — 67% draw call reduction

**Design doc:** `Docs/plans/2026-03-25-hexmapv2-medium-term-improvements.md`

---

## ✅ TB-003 · Intent Visibility — Agent Model & Character Sheet (2026-03-25)

Surface agent ambitions and priorities in the character sheet. IntentSection in AgentProfileModal/AgentDetailPanel, single-line summary in AgentInfoCard, knowledge-gated reveal structure, notification tap-through, pulse animation.

**Design doc:** `Docs/plans/2026-03-17-intent-visibility.md`

---

## ✅ TB-004 · Attachment Tier Advancement (2026-03-25)

Player actions promote item tiers (Mundane → Storied → Mythic → Legendary). Tier-transition logic, Enchant/Empower action templates, detail card UI, on-use triggers, tag system.

**Design doc:** `Docs/plans/2026-03-10-attachment-system-design.md`

---

## ✅ TB-005 · Agreement Creation as Player Action (2026-03-25)

Diplomacy as a direct player verb. Social encounter templates (CRUD), bond scoring, agreement node creation, colocation/remote constraints.

**Design doc:** `Docs/plans/2026-03-18-social-fabric-and-faction-formation-design.md`

---

## ✅ TB-006 · Cross-Boundary Contract Tests (2026-03-25)

Contract test infrastructure for movement/HexMapV2 boundaries. MovementTrailMesh tests, pathfinding-to-movement contract, orchestrator integration, movement-integration rewrite.

**Skill:** `.claude/skills/testing-patterns/SKILL.md`

---

## ✅ TB-007 · HexChronicle location list bug (2026-03-25)

Fixed type mismatch — `hexCol`/`hexRow` string vs number in `getLocationsInHex()`.

**Files:** `src/engine/hexZoom.ts`, `src/engine/worldSeed.ts`, `src/components/Game/GameView.tsx`

---

## ✅ TB-008 · Road-Aware Agent Movement (2026-03-25)

Road-aware Dijkstra, hex-by-hex traversal, gated re-evaluation, road animation mode.

**Design doc:** `Docs/plans/2026-03-25-road-aware-movement-design.md`

---

## ✅ TB-009 · Start Page (2026-03-23)

Title screen, lore fragment, main menu, theme music, settings/credits modals.

**Design doc:** `Docs/plans/2026-03-23-start-page-design.md`

---

## ✅ TB-010 · Kokoro TTS Narration (2026-03-23)

Client-side TTS via Web Worker, narrate button in HexChronicle.

---

## ✅ TB-011 · Fixed-Slot Hex Layout (2026-03-25)

Deterministic slot positions for agents and locations on hex tiles.

---

## ✅ TB-012 · Stencil Coastline (2026-03-23)

WebGL stencil-based organic coastline (Phase 7.1). Behind feature flag.

---

## ✅ TB-035 · Meet The First — Agent Generation Encounter (2026-03-26)

The god's relationship system and hero's journey arc. 9 interconnected subsystems: **Divine Court & Thread Edge** (replaces `worships` with `thread`, flips direction god→mortal, defines court spectrum: The First / Retinue / Watched), **Court Slot** (The First with narrative cooldowns), **Meeting Encounter** (intent-driven 4-step choice encounter — declare destiny, observe dilemmas, reveal + invest, confirm spark), **Choice-Point Step Type** (new encounter step for player decisions), **Hero's Journey Arc** (doom-clock-scheduled branching story tree — beats fire on schedule, world state picks variants, no failure state), **Journey Vignettes & Universal Encounter Visibility** (auto-interrupt for First, clickable encounters for all threaded agents, two interaction modes: encounter interventions vs strategic actions), **The Return** (peak-end convergence with Founding Gates + Ripple Consequences, 6 divergent outcomes), **Unified Vignette Engine** (layered templates: structure + axis selector + dynamic enrichment + archetype tone), **Dynamic Prose Enrichment** (world-state queries inject titles, artifacts, allies into prose).

**Brainstorm:** Obsidian → `TheFantasyWorldSimulator/Brainstorms/brainstorm-meet-the-first.md`
**Design doc:** `Docs/plans/2026-03-26-meet-the-first-design.md` (v2 — post-review rewrite)
**Depends on:** Encounter system, Generalized Action Targeting (✅), Ambition system (needs assessment), Archetype content (exists), Cooperation strategy (exists), Axiological profile (exists)
**Implementation:** 7 phases — Phase 0: Thread Edge Migration ✅ → Phase 1: Foundation ✅ → Phase 2: Journey Engine ✅ → Phase 3: The Return ✅ → Phase 4: Universal Encounter Visibility ✅ → Phase 5: Dynamic Prose Enrichment ✅ → Phase 6: Content & Polish ✅
**Phase 0 complete:** Thread edge migration (worships→thread, direction flip, 45+ files). Commit: e0f8824
**Phase 1 complete:** Meeting encounter types, engine (candidate gen, dilemma selection, agent creation), 81 archetype names, 16 dilemma templates, 4-step modal UI, LocationView integration. 35 new tests. Commit: 7477d2e
**Phase 2 complete:** Journey engine — doom-clock phase boundaries (5 Campbellian phases), beat scheduling, 4-axis state snapshot (power/influence/relationship/ambition), template variant selection, 9 structural templates with 15 variants across all phases, JourneyVignetteModal auto-interrupt UI, orchestrator phase integration, GameView vignette queue with auto-pause. Typed BeatOutcome/StateSnapshot replace loose Record types on thread edge. 49 new tests.

---

## ✅ TB-036 · Hex Actions Expansion & Control Mechanic (2026-03-26)

Expand from 5 hex action templates to 43 across all 4 narrative layers (Land, Soul, People, Ruins) using 5 action verbs (Create, Find, Change, Destroy, Control). The Control verb is a new sustained-commitment mechanic — ongoing effects with per-tick costs, economic constraints, and LIFO lapse ordering. No artificial slot caps — you can hold whatever you can afford.

**Design doc:** `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md`
**Brainstorm:** `brainstorm-hex-actions-and-control-mechanic.md`
**Open questions doc:** `Docs/plans/2026-03-26-meet-the-first-open-questions.md` (items #7, #8 touch TB-036 interface points)
**Depends on:** Generalized Action Targeting (✅), Mutable Hex State (✅)
**Design complete:** 2026-03-26 — decomposed into TB-041 through TB-049

**Key design decisions:**
- No control slots — pure economic constraint (essence income vs. drain)
- Creation spheres from character generation (tall vs. wide), elder magic discovered through ruins
- Layer revelation system: Find actions soft-gate Change/Control/Destroy
- Control effects spawn persistent encounter nodes for contestation (usurp inherits investment)
- Immediate lapse + notify (no grace period)
- Thread-based effects cheaper at higher tiers (15% discount per tier)
- Discovery timing depends on attention mode (pause = immediate, auto_resolve = queued)
- God doesn't enter ruins personally but can perceive/create/consecrate from outside

---

## ✅ TB-041 · ControlEffect Runtime & Tick Phase (completed 2026-03-26)

New `ControlEffect` type on `GameState.controlEffects[]`. New `phaseControlEffects` tick phase running after `phaseEssence`. Implements: threshold checking (hex + location), per-tick essence drain (oldest-first payment), LIFO lapse ordering, per-tick mutations/GraphOps application, income crediting for income-generating effects, owner validation (fail-soft). Extended `computeEssenceGeneration()` and `computeEssenceIncome()` to include control effect income. 3 trace types, 19 tests.

**Design doc:** `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md` → System 1
**Parent:** TB-036

---

## ✅ TB-042 · Layer Revelation System (completed 2026-03-26)

NarrativeLayer type (land/soul/people/ruins) with per-hex revelation state on `GameState.hexRevelation`. Gate 7 in `getTargetActionSlots()` filters templates by revealed layers. Create actions bypass revelation gate. revelationResolver maps Find action success to layer reveals. Auto-reveal land layer when fog of war lifts. 27 tests.

**Design doc:** `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md` → System 3
**Parent:** TB-036

---

## ✅ TB-043 · Hidden Sites & Discovery Seeding (completed 2026-03-26)

`hidden?: boolean` on SublocationProperties. Seeded during worldgen (60% ruins, 15% default). `getVisibleSubLocations()` filters hidden sites from UI. `resolveHiddenSiteReveals()` flips hidden→false on qualifying Find actions via hexActionBridge. HiddenSiteRevealedTrace emitted. 24 tests.

**Design doc:** `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md` → System 3 (Hidden Sites)
**Parent:** TB-036
**Depends on:** TB-042 (layer revelation)

---

## ✅ TB-044 · Control Template Extension & durationMode (2026-03-26)

Extend `UnifiedActionTemplate` with `durationMode: 'instant' | 'sustained'` and `controlSpec: ControlSpec`. Spawn `ControlEffect` on sustained action success. ActionCard control variant visual (recurring cost indicator). WheelSlot extension.

**Design doc:** `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md` → System 1 (Template Extension)
**Parent:** TB-036
**Depends on:** TB-041 (ControlEffect runtime)
**Completed:** 2026-03-26 — spawnControlEffect(), phaseUnifiedActionProgress wiring, WheelSlot durationMode/perTickCostLabel, ActionCard sustained badge. 12 tests.

---

## ✅ TB-045 · Control Effect Contestation (completed 2026-03-26)

Persistent encounter nodes for active control effects. Implement `filterByPrerequisites()` in encounter pipeline (currently no-op). Usurp (transfer ownership, inherit investment) and destroy resolution paths. Difficulty scales with effect age.

**Design doc:** `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md` → System 4
**Parent:** TB-036
**Depends on:** TB-041 + TB-044
**Needs design:** No

---

## ✅ TB-046 · One-Shot Templates: Land & Soul Layers (completed 2026-03-26)

Author ~13 one-shot templates for Land and Soul layers (Create/Find/Change/Destroy verbs). Wire Find actions to set layer revelation flags. Land: Raise Landmark, Dowse for Resources, Sense the Leylines, Shift Season, Scorch Earth, Rend the Earth. Soul: Attune Leyline, Forge Seer's Token, Read the Currents, Shift Dominion, Amplify the Flow, Sever the Flow, Dispel the Wild.

**Design doc:** `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md` → System 5
**Parent:** TB-036
**Depends on:** TB-042 (layer revelation)
**Needs design:** No — templates fully specified

---

## ✅ TB-047 · One-Shot Templates: People & Ruins Layers (completed 2026-03-26)

Author ~20 one-shot templates for People and Ruins. Includes artifact creation via GraphOp (Forge Seer's Token, Forge Divine Instrument), ambition assignment (Plant a Dream), agent spawning (Send a Herald). Ruins actions reflect "god doesn't enter personally" principle — most work through agents.

**Design doc:** `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md` → System 5
**Parent:** TB-036
**Depends on:** TB-042 + TB-043 (Ruins Find actions need hidden sites)
**Needs design:** No — templates fully specified. GraphOp artifact creation is new plumbing.

---

## ✅ TB-048 · Control Templates: All 4 Layers (completed 2026-03-26)

Author ~15 Control verb templates across all layers with full `ControlSpec` (sustain conditions, per-tick costs, income, contestation prerequisites). Includes thread-tier cost scaling (cheaper at high tier, 15% discount/tier). Land: Claim Dominion, Cultivate, Claim Resource. Soul: Anchor the Sphere, Tap the Source, Attune Thread, Channel the Current. People: Shepherd the Flock, Install a Champion, Strengthen Thread, Impose Decree. Ruins: Bind the Echoes, Compel Exploration, Seal the Tomb, Ward Against the Deep.

**Design doc:** `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md` → System 5 (Control rows)
**Parent:** TB-036
**Depends on:** TB-041 + TB-044 + TB-045
**Needs design:** No — templates fully specified

---

## ✅ TB-049 · Hex Control Panel UI & Active Effects Display (completed 2026-03-26)

UI for active control effects on hexes (section in HexChronicle or dedicated panel). Shows effect name, owner, per-tick cost, sustain status, ticks active, contestability. "Release" button for voluntary lapse. Extend EssencePanel with control effect drain/income breakdown. DebugPanel tabs for Control Effects and Revelation state.

**Design doc:** `Docs/plans/2026-03-26-hex-actions-expansion-and-control-mechanic-design.md` → Wiring
**Parent:** TB-036
**Depends on:** TB-041 + TB-044
**Needs design:** No

---

## ✅ TB-038 · Dilemma Content Research & Authoring (2026-03-26)

Deep research into what kinds of origin-story dilemmas resonate across mythology, fantasy literature, and hero's journey traditions. Output: a complete dilemma content library for the Meet The First encounter system.

**Research brief:** `Docs/plans/2026-03-26-dilemma-research-brief.md`
**Depends on:** TB-035 design doc (for system integration spec)

---

## ✅ TB-039 · Increase Max 
