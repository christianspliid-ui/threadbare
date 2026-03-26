# Backlog

> Prioritized list of future work. Migrated from Notion 2026-03-22 — Notion backlog archived.
>
> **Rules:** One item per heading. Status is the emoji prefix. Move `✅` items to `Docs/project-history.md` periodically.
>
> **Kanban states:** `💡` idea · `📋` todo · `🎨` design · `📐` plan · `🏗️` dev · `✅` done
> Append `▶` when a phase is complete and ready for the next agent (e.g. `📐▶` = plan done, ready for Claude Code).
> Full protocol: `Docs/cowork-ways-of-working.md` → "Unified Kanban"
>
> **IDs:** Every item gets a `TB-XXX` prefix. IDs are permanent — never reused, even after deletion. Next ID: **TB-039**.

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

## 🧊 Ice Box

Ideas that need significant design work or aren't urgent.

- **TB-026** · OCEAN personality model for agents
- **TB-027** · Bonds/leverage system between agents
- **TB-028** · Resources system v2 (production chains, scarcity)
- **TB-029** · Ascendant Creation Experience — guided flow for the player to create and customize Ascendants (powerful former mortals). Domain capability selection, sphere alignment, visual identity, backstory generation within constraints.

---

## 🏗️ TB-035 · Meet The First — Agent Generation Encounter

The god's relationship system and hero's journey arc. 9 interconnected subsystems: **Divine Court & Thread Edge** (replaces `worships` with `thread`, flips direction god→mortal, defines court spectrum: The First / Retinue / Watched), **Court Slot** (The First with narrative cooldowns), **Meeting Encounter** (intent-driven 4-step choice encounter — declare destiny, observe dilemmas, reveal + invest, confirm spark), **Choice-Point Step Type** (new encounter step for player decisions), **Hero's Journey Arc** (doom-clock-scheduled branching story tree — beats fire on schedule, world state picks variants, no failure state), **Journey Vignettes & Universal Encounter Visibility** (auto-interrupt for First, clickable encounters for all threaded agents, two interaction modes: encounter interventions vs strategic actions), **The Return** (peak-end convergence with Founding Gates + Ripple Consequences, 6 divergent outcomes), **Unified Vignette Engine** (layered templates: structure + axis selector + dynamic enrichment + archetype tone), **Dynamic Prose Enrichment** (world-state queries inject titles, artifacts, allies into prose).

**Brainstorm:** Obsidian → `TheFantasyWorldSimulator/Brainstorms/brainstorm-meet-the-first.md`
**Design doc:** `Docs/plans/2026-03-26-meet-the-first-design.md` (v2 — post-review rewrite)
**Depends on:** Encounter system, Generalized Action Targeting (✅), Ambition system (needs assessment), Archetype content (exists), Cooperation strategy (exists), Axiological profile (exists)
**Implementation:** 7 phases — Phase 0: Thread Edge Migration ✅ → Phase 1: Foundation ✅ → Phase 2: Journey Engine ✅ → Phase 3: The Return → Phase 4: Universal Encounter Visibility → Phase 5: Dynamic Prose Enrichment → Phase 6: Content & Polish
**Phase 0 complete:** Thread edge migration (worships→thread, direction flip, 45+ files). Commit: e0f8824
**Phase 1 complete:** Meeting encounter types, engine (candidate gen, dilemma selection, agent creation), 81 archetype names, 16 dilemma templates, 4-step modal UI, LocationView integration. 35 new tests. Commit: 7477d2e
**Phase 2 complete:** Journey engine — doom-clock phase boundaries (5 Campbellian phases), beat scheduling, 4-axis state snapshot (power/influence/relationship/ambition), template variant selection, 9 structural templates with 15 variants across all phases, JourneyVignetteModal auto-interrupt UI, orchestrator phase integration, GameView vignette queue with auto-pause. Typed BeatOutcome/StateSnapshot replace loose Record types on thread edge. 49 new tests.

---

## 📋 TB-036 · Hex Actions Expansion & Control Mechanic

Expand from 4 hex action templates to full coverage across all 4 narrative layers (Land, Soul, People, Ruins) using 5 action verbs (Create, Find, Change, Destroy, Control). The Control verb is a new sustained-commitment mechanic — ongoing effects that tie up resources/attention, distinct from one-time Change actions. Control is the god-game signature: you don't just *do* things, you *hold* things.

**Brainstorm:** `brainstorm-hex-actions-and-control-mechanic.md`
**Depends on:** Generalized Action Targeting (✅)
**Needs design:** Yes — brainstorm has verb taxonomy and control mechanic sketched, needs full design doc

---

## 💡 TB-037 · Meet The First — Onboarding Auto-Trigger

Auto-trigger the Meet The First encounter on the player's first visit to a populated hex. Free re-rolls, tutorial affordances (tooltips explaining encounter flow, archetypes, values, reaches), and a guided first-time experience. Wraps the repeatable TB-035 action in an onboarding shell.

**Depends on:** TB-035 (Meet The First)
**Needs design:** Yes — deferred from TB-035 design session (2026-03-26)

---

## 💡 TB-038 · Dilemma Content Research & Authoring

Deep research into what kinds of origin-story dilemmas resonate across mythology, fantasy literature, and hero's journey traditions. Output: a complete dilemma content library for the Meet The First encounter system.

**Research brief:** `Docs/plans/2026-03-26-dilemma-research-brief.md`
**Depends on:** TB-035 design doc (for system integration spec)
**Needs:** Full creative attention — quality of these stories directly determines the emotional impact of the game's most important moment

---

## 💡 TB-034 · Browser-Side TTS Fallback (kokoro-js)

When deployed to Vercel (or any host without the local `tts-server.py`), narration silently fails because the TTS endpoint at `localhost:3001` is unreachable. Add a fallback path using the existing `kokoro-js` dependency and `NarrationWorker.ts` to run Kokoro TTS inference entirely in the browser via WebAssembly/WebGPU. The local server path remains preferred when available (lower latency, GPU-accelerated); the browser path activates automatically when the server health-check fails.

**Scope:** `NarrationService.ts`, `NarrationWorker.ts`, `narrationConstants.ts`
**Depends on:** TB-010 (✅ Kokoro TTS Narration)
**Trade-offs:** ~50 MB model download on first use; heavier client CPU/GPU; needs loading indicator