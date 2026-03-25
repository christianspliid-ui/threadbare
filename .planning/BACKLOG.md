# Backlog

> Prioritized list of future work. Migrated from Notion 2026-03-22 — Notion backlog archived.
>
> **Rules:** One item per heading. Status is the emoji prefix. Move `✅` items to `Docs/project-history.md` periodically.
>
> **Kanban states:** `💡` idea · `📋` todo · `🎨` design · `📐` plan · `🏗️` dev · `✅` done
> Append `▶` when a phase is complete and ready for the next agent (e.g. `📐▶` = plan done, ready for Claude Code).
> Full protocol: `Docs/cowork-ways-of-working.md` → "Unified Kanban"
>
> **IDs:** Every item gets a `TB-XXX` prefix. IDs are permanent — never reused, even after deletion. Next ID: **TB-034**.

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

## 📐▶ TB-033 · Graph Schema Enforcement

The graph model has no schema enforcement. Edge types are unguarded strings, there are no canonical query functions, and semantic duplicates (`located_at`/`located_in`, `relates_to`/`relationship`) cause recurring integration bugs. Three-layer fix: (1) canonical query functions in `graphQueries.ts`, (2) edge schema registry with source/target type constraints, (3) dev-mode validated `addEdge`. Also cleans up 4 variant edge bugs and 4 dead edge types.

**Design doc:** `Docs/plans/2026-03-25-graph-schema-enforcement-design.md`
**Depends on:** TB-030 (agent validation utility provides the first consumer of the schema)

---

## 📐▶ TB-015 · Rendering Module Resilience Refactor

Four-phase refactor to improve module independence and eliminate silent cross-module breakage. Phase 1: shared primitives (hexKey, worldPosition, hexGrouping). Phase 2: sprite abstraction layer (decouple animation from sprite internals). Phase 3: unified zoom tier module. Phase 4: HexMapV2 hook extraction.

Phase 4 overlaps with TB-016 item 1 — when Phase 4 ships, mark TB-016 item 1 complete.

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
- **TB-029** · Ascendant Creation Ex