# Backlog

> Prioritized list of future work. Migrated from Notion 2026-03-22 — Notion backlog archived.
>
> **Rules:** One item per heading. Status is the emoji prefix. Move `✅` items to `Docs/project-history.md` periodically.
>
> **Kanban states:** `💡` idea · `📋` todo · `🎨` design · `📐` plan · `🏗️` dev · `✅` done
> Append `▶` when a phase is complete and ready for the next agent (e.g. `📐▶` = plan done, ready for Claude Code).
> Full protocol: `Docs/cowork-ways-of-working.md` → "Unified Kanban"
>
> **IDs:** Every item gets a `TB-XXX` prefix. IDs are permanent — never reused, even after deletion. Next ID: **TB-068**.

---

## ✅ TB-067 · Notification Expansion — Clickable Nav, Right-Click Dismiss, Preferences Panel (2026-03-27)

Three features expanding the notification system: (1) clickable notifications that navigate to the relevant game entity (encounter modal, hex, location, faction, journey), with channel-specific behavior (toast: navigate+dismiss, alert: navigate only); (2) right-click instant dismiss on toasts and alerts; (3) notifications section in SettingsPanel with per-category on/off and permanent/temporary toggles, persisting across sessions via localStorage with per-game overrides. Three implementation phases: A (right-click dismiss), B (navigation targets), C (preferences panel).

**Design doc:** `Docs/plans/2026-03-27-notification-expansion-design.md`
**Handover:** `.planning/HANDOVER.md` → 2026-03-27 entry
**Depends on:** SettingsPanel (TB-064, ✅)

---

## 📐▶ TB-066 · Palette Theme System — Feature-Flagged Color Schemes (2026-03-27)

Runtime-switchable hex map color palettes via Settings panel and URL param. Introduces "Dark Parchment" alternative (aged sepia/umber, 15–45% brightness) alongside existing "Golden Hour". Module-level palette singleton, no React context — consumed deep in Three.js mesh builders. Theme switch triggers full hex map rebuild. 13 files touched, no new tick phases.

**Design doc:** `Docs/plans/2026-03-27-palette-theme-system-design.md`
**Visual reference:** `Design/palette-experiment.html` (open in browser to compare 6 palettes side by side)
**Handover:** `.planning/HANDOVER.md` → 2026-03-27 entry

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

## 💡 TB-031 · Culture Seeding — Territory-Aware Placement

Cultures should have geographic coherence: homeland clusters, border zones, diaspora. Currently culture assignment ignores location entirely. Needs full design pass.

**Preliminary design:** `Docs/plans/2026-03-25-culture-and-agent-seeding-preliminary-design.md`

---

## 💡 TB-032 · Agent Seeding — Pre-Existing Relationships

Agents should start with bonds, faction hierarchy, and narrative hooks instead of spawning as isolated strangers. Seed `relates_to` edges, faction leadership ranks, and opening situations. Needs full design pass.

**Preliminary design:** `Docs/plans/2026-03-25-culture-and-agent-seeding-preliminary-design.md`

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

## 💡 TB-017 · Chain Reactions / Trigger System

Lightweight trigger system: "when cursed edge added at this location, also add unrest +10." Player actions cascade through world in visible, traceable ways. Must stay deterministic and traceable per NFPs.

**Depends on:** Location State Fields, Attachment Action Templates

---

## 💡 TB-018 · Cosmological Manipulation

Player targets foundation axes (chaos↔order, light↔darkness) directly. Globally modifies action difficulty, terrain stability, agent behavior. Very expensive essence cost, dramatic narrative payoff.

**Depends on:** Generalized Action Targeting (✅), Hex Terrain State
**Needs design:** Yes

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

## Implementation Prerequisites (from 2026-03-18 design session)

Several of these may already be done — verify before starting.

- [ ] Step tick duration backfill — Add `duration` to all 64 encounter template steps
- [ ] Attachment reachBonus backfill — Add `reachBonus` to existing attachments
- [ ] Trait resolutionBonus backfill — Add `resolutionBonus` to existing traits
- [ ] Promotion trait names — 45 entries (5 per reach × 9 reaches) for tier signifiers

*Items completed during March 18 sessions:* axiological vocabulary alignment ✅, sphere opposition table ✅, 14 social encounter templates ✅, shortest-path graph utility ✅, deprecated reputationScore migration ✅

---

## Deferred Items

### From Hex Chronicle Redesign (2026-03-15)

- **TB-019 · Exploration Hook Generation** — Design a system that generates hooks from ruin locations, unexplored POIs, encounter seeds, sphere anomalies, historical artifacts
- **TB-020 · Soul Layer Prose Enrichment** — Cross-sphere prose templates for how spheres interact in the same hex

### Content Backlog

- **TB-021** · SVG resource icons to replace emoji placeholders (🪵🪨⛏️💧🐟🌾🌽🟤)

### Frontend Polish

- **TB-022** · Responsive layout (currently viewport-locked to 1920×1080)
- **TB-023** · Onboarding / first-minute clarity pass

### Developer Tools

- **TB-024** · Content authoring UI (CMS at `?view=cms` exists but read-only)
- **TB-025** · Constants tuning panel with live editing

---

## 💡 TB-051 · Monster Encounters — Design Pass

Hostile creature encounters in the world. Monsters as graph entities with territorial behavior, threat levels, and encounter templates. Needs full design covering: monster archetypes and taxonomy (beasts, undead, elemental, corrupted), spawn rules (terrain-gated, sphere-influenced, ruin-adjacent), encounter resolution (agent capability checks vs monster threat tier), player intervention options during monster encounters, loot/consequence tables, and how monsters interact with existing systems (control effects, hex state, agent decision-making, social fabric).

**Existing infrastructure to leverage:**
- **Province roles already computed:** Every hex is classified as `capital` / `heartland` / `borderland` during worldgen Pass 01 (`provinceRoles` in `WorldGenContext`, types in `worldgen/types.ts`, assignment in `pass01-provinces.ts`). Proportional: bottom 15% capital, next 40% heartland, remaining ~45% borderland. Currently unused by any downstream system — monster encounters could be the first consumer.
- **Culture settlement distinction:** `cultureId` null = wilderness province (unclaimed), non-null = settled. Gives a second danger axis on top of province roles.
- **Political region types in world-model.json:** `region.wilderness`, `region.contested-zone`, `region.tribal-lands` etc. — narrative region flavors that could map to monster density or type pools.
- **Natural danger gradient:** capital (safe) → heartland (occasional threats) → borderland (frequent) → wilderness/unclaimed (dominant). This is ready-made infrastructure, not something that needs to be built from scratch.

**Key design questions:**
- Are monsters persistent graph nodes or transient encounter events?
- Do monsters have territory (hex presence) or roam via movement system?
- How do monsters interact with the layer revelation system (e.g., ruins monsters only after ruins layer revealed)?
- Can the player create/summon monsters via hex actions, or only encounter them?
- How does monster threat scale with world age / tick count?
- Relationship to the Nine Reaches — do monsters have domain capabilities, or a simpler threat model?
- How to wire province roles into GameState so the danger gradient is available at runtime (currently only in WorldGenContext)?

**Depends on:** Encounter system (✅), Layer Revelation (TB-042 ✅), Hex Actions (TB-036 ✅)
**Needs design:** Yes — full design pass required

---

## 🧊 Ice Box

Ideas that need significant design work or aren't urgent.

- **TB-026** · OCEAN personality model for agents
- **TB-027** · Bonds/leverage system between agents
- **TB-028** · Resources system v2 (production chains, scarcity)
- **TB-029** · Ascendant Creation Experience — guided flow for the player to create and customize Ascendants (powerful former mortals). Domain capability selection, sphere alignment, visual identity, backstory generation within constraints.

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

## 💡 TB-037 · Meet The First — Onboarding Auto-Trigger

Auto-trigger the Meet The First encounter on the player's first visit to a populated hex. Free re-rolls, tutorial affordances (tooltips explaining encounter flow, archetypes, values, reaches), and a guided first-time experience. Wraps the repeatable TB-035 action in an onboarding shell.

**Depends on:** TB-035 (Meet The First)
**Needs design:** Yes — deferred from TB-035 design session (2026-03-26)

---

## ✅ TB-038 · Dilemma Content Research & Authoring (2026-03-26)

Deep research into what kinds of origin-story dilemmas resonate across mythology, fantasy literature, and hero's journey traditions. Output: a complete dilemma content library for the Meet The First encounter system.

**Research brief:** `Docs/plans/2026-03-26-dilemma-research-brief.md`
**Depends on:** TB-035 design doc (for system integration spec)
**Needs:** Full creative attention — quality of these stories directly determines the e

---

## ✅ TB-039 · Increase Max Zoom from 15 to 20 (completed 2026-03-26)

Raise `MAX_ZOOM` from 15 → 20 (~600px/hex apparent) to allow deeper close-up inspection of hexes.

**Scope:**

- Bump `MAX_ZOOM` in `D3ZoomCamera.ts` (one constant)
- Keep four zoom tiers — hero-local threshold stays at k=15, giving a wider hero-local band (k=15–20) rather than adding a fifth tier
- Verify agent portrait textures don't pixelate unacceptably at k=20 (~33% larger than current max); add sprite scale soft-cap in `AgentSpriteMesh` if needed
- Verify signifier/location art resolution holds at ~600px/hex
- Visual check of label overlays (region/location) at k=15–20
- No performance concern — fewer hexes on screen at higher zoom means lower GPU load

**Key files:** `D3ZoomCamera.ts`, `ZoomVisibilityMatrix.ts` (no change expected), `AgentSpriteMesh.ts` (possible scale cap), `RegionLabelOverlay.tsx`, `LocationLabelOverlay.tsx`
**Needs design:** No — constants change + visual verification

---

## ✅ TB-040 · TB-035 Integration Sweep — Wire Engine to UI (completed 2026-03-26)

TB-035 engine modules are implemented and tested but multiple subsystems are not connected to the player-facing game. This ticket wires everything up so the features are actually playable.

**Disconnected systems (audit 2026-03-26):**

1. **MeetingEncounterModal** — Imported in GameView, state managed, but JSX never rendered. Modal cannot appear.
2. **JourneyVignetteModal** — Vignette queue populated by engine, auto-pause logic works, but modal never rendered. Vignettes fire invisibly.
3. **Encounter notifications** — Generated every tick by `phaseEncounterVisibility`, stored in `gameState.encounterNotifications`, but no component reads the array. Player never sees them.
4. **Prose enrichment** — `enrichProse()` fully implemented (placeholder resolution, conditionals, NarrativeContext gathering) but never imported outside tests. All encounter/vignette prose displayed without enrichment.
5. **Trace emission** — `return_resolution` and `ripple_consequence` categories defined in type system but never emitted. DebugPanel can't show what nothing produces.
6. **Attention mode toggle** — `toggleAttentionMode()` exists with essence cost calculation, but no UI control exposes it to the player.

**Scope:**

- Render `MeetingEncounterModal` in GameView JSX (it already has state + handler, just needs the `<MeetingEncounterModal ... />` element)
- Render `JourneyVignetteModal` in GameView JSX (same — state exists, JSX missing)
- Surface `encounterNotifications` in a player-facing component (ToastStack, NarrativeLog, or new notification widget)
- Call `enrichProse()` in vignette/encounter rendering paths before displaying text
- Emit `return_resolution` and `ripple_consequence` traces from returnEngine.ts where outcomes are computed
- Add attention mode toggle UI to agent thread panel or encounter notification (thread tier gated)
- Add DebugPanel support: new tab or entries for journey state, encounter notifications, prose enrichment context

**Wiring checklist:** `Docs/plans/wiring-checklist.md` (verify all integration points connected)
**Depends on:** TB-035 (✅                                                                                                                    