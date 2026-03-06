This folder contains The Fantasy World Simulator — a systemic god-game/rogue-lite narrative simulation built in React + TypeScript + Vite.

## Documentation Strategy (decided 2026-03-04)

Three documentation layers, each with a distinct purpose. Do not duplicate content across them.

| Layer | Tool | Purpose | When to use |
|-------|------|---------|-------------|
| **Graph model** | Obsidian vault (`TheFantasyWorldSimulator/`) | System specs and relationships — concise notes with wikilinks showing what connects to what | Primary context when implementing a system. Read the Index.md first, then follow links to relevant systems. |
| **Project tracking** | Notion backlog | Sprint progress, implementation phase status, task assignment | Check what to build next, update progress after completing work. |
| **Design rationale** | Repo (`Docs/plans/`) | Full decision documents with tradeoffs, worked examples, and "why we chose X over Y" | Deep reference when you need to understand the reasoning behind a design choice. |

- **Obsidian** says *what the system is* (specs, connections, formulas)
- **Repo docs** say *why we chose it* (decision rationale, tradeoffs)
- **Notion** says *what to build next* (backlog, phases, progress)

## Key Links

- Notion backlog: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf
- Consolidated discovery design: `Docs/plans/2026-03-04-high-level-discovery-pass.md`
- Obsidian vault index: read via Obsidian MCP → `TheFantasyWorldSimulator/Index.md`
- Visual style guide (source of truth): `STYLE.md`
- Visual style tile (HTML reference): `Design/style-tile.html`

## Visual Style

The game's visual identity is called **Threadbare** — dark world, hidden magic, threads that break through. All visual direction lives in two coupled files:

- **`STYLE.md`** — the authoritative source of truth for all visual style decisions: colors, sphere form language, art direction, lighting rules, prompt construction, exclusions.
- **`Design/style-tile.html`** — an HTML visualization of STYLE.md, used as a quick visual reference for colors, swatches, gradients, and UI chrome.

**The style tile must always reflect STYLE.md.** Whenever STYLE.md is modified — colors changed, spheres renamed, sections added or removed — the style tile must be updated in the same session to stay in sync. Never leave them diverged.

## Cosmology Quick Reference

Three orthogonal dimensions define the world:

- **Foundation Spheres** (2 opposed pairs): Chaos ↔ Order, Light ↔ Darkness. These set the cosmic tone and bias the World-Soul.
- **Creation Spheres** (8 independent): Force, Matter, Energy, Life, Mind, Spirit, Time, Entropy. Context determines expression — no inherent alignment.
- **Nine Reaches** (action domains): Iron (warfare), Gold (trade), Shadow (stealth), Veil (magic), Heart (social), Eye (knowledge), Stone (construction), Star (navigation/fate), Flesh (biology). Every CRUD action template maps to a Reach.

## Non-Functional Priorities (in order)

These guide every code architecture decision. When in tension, higher priorities win.

1. **Tunability** — Every magic number is a named constant. Changing game feel should mean changing a number, not rewriting logic. Group constants at the top of each module or in the type file.
2. **Inspectability** — You must be able to trace *why* something happened. Flat state objects (loggable, diffable), pure functions (testable in isolation), causal event trails. No hidden state in closures or singletons.
3. **Determinism** — Seeded PRNG everywhere. Same seed + same inputs = same outputs. Essential for debugging ("broke on seed 42 tick 300") and replay ("I liked seed 7, let me tweak doom speed and replay").
4. **Fail-soft** — The tick loop must never crash. Missing data → graceful fallback (idle, placeholder prose, skip), never thrown exceptions that kill the game. Validate inputs at boundaries, trust within.
5. **Narrative over mechanical perfection** — When mechanical correctness and interesting narrative diverge, lean toward the story. This is a god-game, not a spreadsheet. Slightly unfair outcomes that create drama > perfectly balanced boredom.
6. **Additive over destructive changes** — Prefer adding new fields/functions over modifying existing ones. Old tests keep passing, rollback is easy, experimentation is safe. Only refactor when the old shape actively blocks progress.
7. **Performance budget, not premature optimization** — Each tick must be fast enough for real-time play with 100+ agents. But profile before optimizing. The spotlight tier system handles fidelity scaling architecturally — lean on it rather than micro-optimizing individual functions.

## Load-Bearing Architectural Decisions

These are settled and must not be revisited:

- **Everything is a graph node/edge.** All entities (actors, locations, objects, traits) are nodes. All relationships are typed edges. No separate relational tables.
- **Resolution uses a unified sigmoid pool → d100.** Domain capability scores feed a sigmoid curve to produce a probability, rolled against d100. No alternative dice systems.
- **Content is generated-within-constraints.** Four constraint layers (schema → tonal → balance → coherence) govern all procedural content. Players can iterate (regenerate, lock+regenerate, edit, parameter nudge) but cannot change mechanical values.
- **Agents use a Maslow-inspired action selection pipeline.** Six layers from survival to self-actualization. No utility-function AI or behaviour trees.
- **Metaprogression flows through the World-Soul.** Fundament (coefficient ledger) + Resonance (memory fragments) persist across cycles. Echoes are the player-facing selection mechanism.
- **Rival gods are generated, not fixed.** 2-4 per run, derived from World-Soul state and player's sphere choices.
- **The Unmaking is a playable Twilight Phase** (5-10 ticks), not a cutscene.

## Rejected Approaches (do not reintroduce)

- ❌ Classical stats (STR/DEX/INT) — replaced by Domain Capability across Nine Reaches
- ❌ Fixed rival pantheon — replaced by generated rivals from World-Soul
- ❌ Old 5-force cosmology (Law, Chaos, Life, Death + elements) — replaced by Foundation + Creation Sphere model
- ❌ Behaviour trees or utility-function AI — replaced by Maslow pipeline
- ❌ Pure template-based prose — replaced by hybrid layered engine (template → enhanced → LLM)
- ❌ Pure LLM-generated content — replaced by generated-within-constraints with player iteration

## Change Audit Trail

Whenever you modify Notion pages or Obsidian vault notes, leave a lightweight audit trail:

- **In the changed document itself:** Add a dated inline note near the changed content (e.g., "*(updated 2026-03-05 — changed Time sphere color from red to orange to avoid collision with Force)*"). Keep it brief — date, what changed, why.
- **In this file (below):** Append a one-line entry to the changelog at the bottom of this section so there's a single place to scan for recent changes across all docs.

The goal is traceability without overhead. If you changed it, note when and why.

### Recent Changes

| Date | Where | What changed | Why |
|------|-------|-------------|-----|
| 2026-03-05 | Notion: Visual Style Tile | Updated color palette, core visual principle, color behavior sections | Synced with STYLE.md rewrite — dark world direction, Time→orange, form language system |
| 2026-03-05 | STYLE.md | Full rewrite — dark world direction, sphere form language, Time `#ff9933` | Previous style too bright/diffuse; needed concentrated threadlike magic and unique sphere silhouettes |
| 2026-03-05 | Repo: src/engine/ | Added retinue.ts, wheel.ts, strands.ts — 3 new engine modules | Layer 1 Core Interaction: data helpers for retinue queries, wheel slot generation, 6 psyche strand extractors |
| 2026-03-05 | Repo: src/components/Game/ | Added RetinuePanel, AgentWheel, StrandView — 3 new UI components | Layer 1 Core Interaction: right sidebar, radial action menu, agent deep-dive overlay |
| 2026-03-05 | Repo: GameView.tsx | Wired Layer 1 components — 3-column layout, selection state, wheel/strand overlays | Connects retinue→wheel→scry→strands interaction flow |
| 2026-03-05 | CLAUDE.md | Updated session workflow, project status, engine stats | Layer 1 complete; made doc-updates-after-implementation mandatory |
| 2026-03-05 | Obsidian: Index.md | Added 3 new links: Retinue Panel, Agent Wheel, Psyche Strands | Layer 1 systems now in vault |
| 2026-03-05 | Obsidian: Systems/ | Created Retinue Panel.md, Agent Wheel.md, Psyche Strands.md | New system notes for Layer 1 interaction components |
| 2026-03-05 | Notion: Backlog | Split Phase 6 into 6A-6D, marked 6A complete, added reference docs | Layer 1 done; Layer 2-4 tasks visible in backlog |
| 2026-03-05 | Repo: Docs/plans/ | Created 2026-03-05-intervention-delivery-mechanics.md | Design doc for spatial delivery modes (Astral/Regional/Remote/Local), local encounter sub-modes, range constants |
| 2026-03-05 | Obsidian: Systems/ | Created Intervention Delivery.md | System note for delivery modes with wikilinks to connected systems |
| 2026-03-05 | Obsidian: Index.md | Added Intervention Delivery link to Player Systems | New system now discoverable from vault hub |
| 2026-03-05 | Repo: src/data/ | Created world-model.json — 198 nodes, 290 edges, 18 categories | Unified graph: single source of truth replacing 6 separate taxonomy JSONs |
| 2026-03-05 | Repo: src/engine/ | Refactored taxonomy.ts to import from world-model.json | Old per-file imports replaced with single consolidated import |
| 2026-03-05 | Repo: scripts/ | Created validate-world-model.ts, generate-vault.ts, consolidate-taxonomy.ts | Content pipeline tooling: validation (7 checks), vault generation (199 notes), migration helper |
| 2026-03-05 | Repo: tests | Added worldModel.test.ts (51), validate.test.ts (10), generateVault.test.ts (37) — 98 tests | Full coverage for graph integrity, validation rules, and vault generation |
| 2026-03-05 | Repo: package.json | Added generate-vault, generate-vault:dry, validate-model npm scripts | CLI convenience for vault regeneration via esbuild bundling |
| 2026-03-05 | Obsidian vault | Generated 199 notes across 11 folders (Actions, Actors, Cosmology, Cultures, Domains, Locations, Magic, Relationships, Terrain, Traits + Index) | Vault now generated from JSON — wikilinks, YAML frontmatter, connection sections |
| 2026-03-05 | Repo: src/data/taxonomy/ | Deleted 6 old taxonomy JSON files + README | Replaced by unified world-model.json; taxonomy.ts no longer imports them |
| 2026-03-05 | Repo: Docs/plans/ | Created 2026-03-05-content-pipeline-design.md, 2026-03-05-content-pipeline-implementation.md | Design rationale + 9-task implementation plan for content pipeline |
| 2026-03-05 | CLAUDE.md | Updated project status, engine stats, content stats, changelog | Content pipeline complete |
| 2026-03-06 | Repo: src/types/dream.ts | Added DeliveryMode, LocalEncounterMode types, deliveryMode field, DELIVERY_RANGE + LOCAL_ENCOUNTER constants | Layer 2 Task 1: spatial delivery type system |
| 2026-03-06 | Repo: src/engine/delivery.ts | Created delivery.ts — hexDistance, isInRange, getDeliveryInfo | Layer 2 Task 2: range-checking engine for hex grid |
| 2026-03-06 | Repo: src/engine/wheel.ts | Added rangeStatus + hexDistance to WheelSlot, optional avatarPos/targetPos params | Layer 2 Task 3: wheel slots gate by delivery range |
| 2026-03-06 | Repo: src/components/Game/ | Created InterventionConfirm.tsx — popover with cost, risk, range, local encounter choice | Layer 2 Task 4: confirmation UI before intervention execution |
| 2026-03-06 | Repo: src/components/Game/GameView.tsx | Wired intervention flow: wheel click → confirm → execute → spend essence → narrative event | Layer 2 Task 5: end-to-end intervention interaction |
| 2026-03-06 | Repo: tests | Added delivery.test.ts (17), delivery-integration.test.ts (3), InterventionConfirm.test.tsx (7), extended wheel.test.ts (+5) — 54 new tests | Layer 2 test coverage across all new modules |
| 2026-03-06 | Obsidian: Systems/ | Updated Agent Wheel.md (range gating, confirmation flow), Intervention Delivery.md (implementation details) | Layer 2 systems documented in vault |
| 2026-03-06 | CLAUDE.md | Updated project status (Phase 6B complete), engine stats, changelog | Layer 2 Divine Toolkit UI complete |
| 2026-03-06 | STYLE.md | Rewrote Prompt Construction Guide — narrative-first, NB2-optimized ordering, magic spectrum, camera/lighting defaults, 4 new examples | Research-driven prompt improvement; content-type art direction |
| 2026-03-06 | STYLE.md | Added Content-Type Art Direction section — dual-image variants, camera & lighting defaults table, terrain-neutral framing, aspect ratios | Unified art direction across all content types |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-nano-banana-prompt-research.md | NB2 prompting research: 8 findings, before/after examples, camera/lighting defaults |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-art-prompt-model-design.md | Design rationale: 7 decisions (magic spectrum, 3-layer separation, terrain-neutral, single-hex zoom, dual images, heraldry, doom-as-event) |
| 2026-03-06 | Obsidian: Systems/ | Rewrote View Levels.md — Region Level → Hex Zoom Level (single-hex, not multi-hex groups) | Design change: click one hex to see all locations inside it; simplifies art, interaction, and region management |
| 2026-03-06 | STYLE.md | Rewrote Prompt Construction Guide — narrative-first, NB2-optimized ordering, magic spectrum, camera/lighting defaults, 4 new examples | Research-driven prompt improvement; content-type art direction |
| 2026-03-06 | STYLE.md | Added Content-Type Art Direction section — dual-image variants, camera & lighting defaults table, terrain-neutral framing, aspect ratios | Unified art direction across all content types |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-nano-banana-prompt-research.md | NB2 prompting research: 8 findings, before/after examples, camera/lighting defaults |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-art-prompt-model-design.md | Design rationale: 7 decisions (magic spectrum, 3-layer separation, terrain-neutral, single-hex zoom, dual images, heraldry, doom-as-event) |
| 2026-03-06 | image-generation.skill | Updated skill — content-type identification, narrative prompting, magic spectrum, camera/lighting, iterative refinement workflow | Skill now matches NB2 best practices and content-type art direction |
| 2026-03-06 | STYLE.md | Rewrote Hex Tile System section — centered features, no rivers/paths, outer 20% clear, pipeline reference, updated prompt template | Hex tiling fix: features must not touch edges for clean hex masking |
| 2026-03-06 | Repo: scripts/ | Created generate-hex-tile.py — full pipeline: Imagen API → hex mask → save PNG. 9 built-in biome presets | Automated hex tile generation with hexagonal alpha masking |
| 2026-03-06 | Repo: package.json | Added `generate-hex` npm script | CLI convenience for hex tile pipeline |
| 2026-03-06 | image-generation.skill | Updated skill v2 — hex pipeline integration, centered-feature tiling rules, pipeline exception for direct API | Skill now covers automated hex masking workflow |
| 2026-03-06 | Repo: src/lib/ | Created polygonLayout.ts — regular polygon vertex computation | Phase 6C Task 1: hex zoom location positioning |
| 2026-03-06 | Repo: src/engine/ | Created hexZoom.ts — 5 pure query functions for hex zoom data | Phase 6C Task 2: locations, agents, sphere influence, line of sight, connections |
| 2026-03-06 | Repo: src/components/Game/ | Modified GameView.tsx — ViewLevel type, state machine, 4 navigation handlers | Phase 6C Task 3: view state machine for world/hex-zoom/location |
| 2026-03-06 | Repo: src/components/Game/ | Created HexBreadcrumb.tsx — header bar with terrain, sphere dots, line of sight | Phase 6C Task 4: navigation breadcrumb for hex zoom |
| 2026-03-06 | Repo: src/components/Game/ | Created HexZoomView.tsx — SVG polygon layout with locations, agents, travel lines | Phase 6C Task 5: main hex zoom visualization |
| 2026-03-06 | Repo: src/components/Game/ | Created LocationView.tsx — detail view with agents list, establishing shot placeholder | Phase 6C Task 6: location detail panel |
| 2026-03-06 | Repo: src/components/Game/ | Wired HexZoomView, LocationView, HexBreadcrumb into GameView with 8 derived data blocks | Phase 6C Task 7: replaced placeholders with real components |
| 2026-03-06 | Repo: src/engine/__tests__/ | Created hexZoom-integration.test.ts — full data flow verification | Phase 6C Task 8: integration test |
| 2026-03-06 | Obsidian: Systems/ | Created Hex Zoom View.md, Location View.md; updated View Levels.md | Phase 6C documentation: new system notes + implementation status |
| 2026-03-06 | Notion: Backlog | Added Phase 6C as complete, renumbered 6D/6E, added reference docs | Phase 6C backlog update |
| 2026-03-06 | CLAUDE.md | Updated project status (Phase 6C complete), engine stats, changelog | Phase 6C documentation |
| 2026-03-06 | Repo: src/types/ | Created scry.ts — ScryState, Position, Title, TitleEffect, CourtStructureDefinition + constants | Phase 6D Task 1: scry type system |
| 2026-03-06 | Repo: src/data/ | Created scry-content.ts — 4 court structures, archetypes, title fragments/templates, bonus rules, weakness pool | Phase 6D Task 2: scry content package |
| 2026-03-06 | Repo: src/engine/ | Created scry.ts — createScryState, initializeCourt, generateTitleProposals, assignAgentToPosition, demoteAgent | Phase 6D Tasks 3-5: scry engine (531 lines, 37 tests) |
| 2026-03-06 | Repo: src/components/Game/ | Created ScryOverlay.tsx — full-screen court overlay with position slots, agent picker, title proposals | Phase 6D Task 6: ScryOverlay component (566 lines, 20 tests) |
| 2026-03-06 | Repo: src/components/Game/ | Modified GameView.tsx — scry state, handlers, wheel scry slot → ScryOverlay, overlay rendering | Phase 6D Task 7: GameView wiring |
| 2026-03-06 | Repo: src/engine/__tests__/ | Created scry-integration.test.ts — full court flow: init → assign → demote → escalation, 4 structures | Phase 6D Task 8: integration test |
| 2026-03-06 | Obsidian: Systems/ | Created Ascendant Scry.md; updated Index.md with Ascendant Scry link | Phase 6D vault documentation |
| 2026-03-06 | CLAUDE.md | Updated project status (Phase 6D Scry complete), engine stats, changelog | Phase 6D documentation |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-mandate-tracker-design.md | Design doc: 5 decisions (curated pool, graph-verifiable, minimal tracker, sphere-weighted, real evaluation) |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-mandate-tracker-implementation.md | 9-task implementation plan for mandate tracker system |
| 2026-03-06 | Repo: src/data/ | Created mandate-content.ts — 9 curated mandate templates with sphere affinities | Phase 6D Mandate: content data (30 tests) |
| 2026-03-06 | Repo: src/engine/ | Created mandateGenerator.ts — sphere-weighted PRNG selection | Phase 6D Mandate: generator (8 tests) |
| 2026-03-06 | Repo: src/engine/ | Modified mandate.ts — real sphere_weight + actor_tier evaluation; orchestrator.ts — real evaluateMandate | Phase 6D Mandate: condition evaluation + orchestrator wiring (12+15 tests) |
| 2026-03-06 | Repo: src/components/Game/ | Created MandateTracker.tsx — compact bar + expanded popover with type colors | Phase 6D Mandate: tracker component (10 tests) |
| 2026-03-06 | Repo: src/components/Game/ | Modified GameView.tsx — mandate generation in init, shared DoomBar+MandateTracker container | Phase 6D Mandate: GameView wiring |
| 2026-03-06 | Repo: src/components/Game/ | Modified DoomBar.tsx — moved chrome to shared parent container (flex-1 min-w-0) | Phase 6D Mandate: DoomBar refactor for shared layout |
| 2026-03-06 | Repo: src/engine/__tests__/ | Created mandate-integration.test.ts — full lifecycle, actor_tier cycle, all templates evaluable | Phase 6D Mandate: integration tests (3 tests) |
| 2026-03-06 | Obsidian: Systems/ | Created Mandate Tracker.md; updated Index.md with Mandate Tracker link | Phase 6D Mandate vault documentation |
| 2026-03-06 | CLAUDE.md | Updated project status (Phase 6D Mandate complete), engine stats, changelog | Phase 6D Mandate documentation |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-agent-detail-panel-design.md | Design doc: 6 decisions (sidebar replacement, full character sheet, archetype integration, data sources, section layout, single aggregator) |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-agent-detail-panel-implementation.md | 8-task implementation plan for agent detail panel |
| 2026-03-06 | Repo: src/data/ | Created archetype-content.ts — 19 narrative archetypes with story shape, prose tone, reach affinities | Phase 6E Task 1: archetype content package (6 tests) |
| 2026-03-06 | Repo: src/engine/ | Created agentDetail.ts — getAgentDetail aggregator: tier, archetype, top values, top bonds, location, faction | Phase 6E Task 2: agent detail aggregator (6 tests) |
| 2026-03-06 | Repo: src/components/Game/ | Created AgentDetailPanel.tsx — full character sheet: header, archetype banner, 3×3 domain grid, values compass, bonds list | Phase 6E Task 3: detail panel component (12 tests) |
| 2026-03-06 | Repo: src/engine/ | Modified worldSeed.ts — assigns random narrativeArchetype to each individual agent | Phase 6E Task 4: archetype assignment in world seeding (1 test) |
| 2026-03-06 | Repo: src/components/Game/ | Modified GameView.tsx — conditional right sidebar: AgentDetailPanel when agent selected, RetinuePanel otherwise | Phase 6E Task 5: GameView wiring |
| 2026-03-06 | Repo: src/engine/__tests__/ | Created agentDetail-integration.test.ts — full flow + all 19 archetypes resolvable | Phase 6E Task 6: integration tests (2 tests) |
| 2026-03-06 | Obsidian: Systems/ | Created Agent Detail Panel.md; updated Index.md with Agent Detail Panel link | Phase 6E vault documentation |
| 2026-03-06 | CLAUDE.md | Updated project status (Phase 6E complete), engine stats, changelog | Phase 6E documentation |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-content-package-architecture.md | 7-task plan to extract ~350 lines of content from engine/type files into 5 new `*-content.ts` packages |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-content-strategy.md | Content strategy: 3 prose modes, 19 archetypes, cultural palettes, thematic rules, exclusions |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-narrative-context-pipeline.md | Narrative context pipeline: harvest-rank-select-feed, opposition tension scoring, narrative spawning |
| 2026-03-06 | Obsidian: Systems/ | Created Content Strategy.md, Narrative Archetypes.md, Narrative Context Pipeline.md, Content Packages.md | 4 new system notes for content strategy and architecture |
| 2026-03-06 | Notion: Backlog | Added Content Strategy & Architecture section with 3 completed design items + 5 pending implementation items | Content strategy design phase complete |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-content-extraction-design.md | Design doc: 5 new packages, boundary decisions, pattern rules, sequencing roadmap |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-content-extraction-implementation.md | 7-task TDD implementation plan for content package extraction |
| 2026-03-06 | Repo: src/data/ | Created narrative-content.ts (171 lines) | Sphere vocabulary, routine/notable templates, value flavors — extracted from types/narrative.ts + engine/narrative.ts |
| 2026-03-06 | Repo: src/data/ | Created dream-content.ts (204 lines) | Manipulation/intervention definitions, tier modifiers, delivery/encounter constants — extracted from types/dream.ts |
| 2026-03-06 | Repo: src/data/ | Created doom-content.ts | Stage names, default thresholds — extracted from engine/doomClock.ts |
| 2026-03-06 | Repo: src/data/ | Created rival-content.ts (104 lines) | Name fragments, behavior weights, action types — extracted from types/rival.ts + engine/rival.ts |
| 2026-03-06 | Repo: src/data/ | Created influence-content.ts (66 lines) | Tier names, economy constants, action costs — extracted from types/influence.ts |
| 2026-03-06 | Repo: src/types/ | Moved RivalAction interface from engine/rival.ts to types/rival.ts | Prevented circular import between rival-content.ts and engine/rival.ts |
| 2026-03-06 | Obsidian: Systems/ | Updated Content Packages.md — all 8 packages marked complete | Content extraction status reflected in vault |
| 2026-03-06 | Notion: Backlog | Marked Content Package Migration complete | 5 new packages, 28 tests, ~350 lines extracted |
| 2026-03-06 | CLAUDE.md | Updated project status, engine stats, changelog | Content extraction complete |

## Session Workflow

When starting implementation work:

1. Read this file for orientation
2. Read Obsidian `Index.md` via MCP, then follow links to the relevant system notes
3. Check the Notion backlog for current phase and next tasks
4. Read the relevant design doc in `Docs/plans/` before writing code
5. After completing work, **always do these documentation updates before moving on**:
   - Update the Notion backlog (mark tasks done, add new tasks discovered)
   - Update affected Obsidian vault notes (add new system notes, update existing ones with new concepts)
   - Append entries to the changelog below
   - Update the Project Status section in this file (phase status, engine stats)

**This is non-negotiable.** Documentation updates happen immediately after integration and testing, in the same session, not "later."

## Project Status

- Discovery phase: ✅ Complete (all 22 DISC items resolved)
- Phase 1 (Core Logic): ✅ Complete — graph, traits, resolution, temporal, agents, view levels, simulation
- Phase 2A (Influence & Ascendant): ✅ Complete — influence essence, ascendant creation
- Phase 2B (Dream & Divine Toolkit): ✅ Complete — dream interface, divine interventions
- Phase 2C (Stealth & Mandates): ✅ Complete — stealth/detection, victory mandates
- Phase 3A (Rivals & Doom): ✅ Complete — rival god generator, doom clock
- Phase 3B (Narrative & Content): ✅ Complete — narrative prose engine, content pipeline
- Phase 4A (World-Soul & Unmaking): ✅ Complete — fundament, resonance, twilight phase, harvest, cycle transitions
- Phase 4B (Echoes & Chronicle): ✅ Complete — echo system, great chronicle assembly
- Phase 5A (Game Loop Engine): ✅ Complete — GameState type, world seeding, tick orchestrator, cycle-end flow
- Phase 5B (UI Components): ✅ Complete — DoomBar, NarrativeFeed, RivalPanel, HarvestScreen, GameView rewrite
- Phase 6A (Layer 1 — Core Interaction): ✅ Complete — retinue panel, agent wheel, psyche strands, GameView wiring
- Content Pipeline: ✅ Complete — unified world-model.json (198 nodes, 290 edges, 18 categories), vault generator, validation script, 98 content pipeline tests
- Phase 6B (Layer 2 — Divine Toolkit UI): ✅ Complete — delivery types, range checking, wheel range gating, InterventionConfirm popover, GameView intervention flow
- Phase 6C (Hex Zoom Level): ✅ Complete — polygon layout, hex zoom engine queries, view state machine, HexBreadcrumb, HexZoomView, LocationView, GameView wiring, integration test
- Content Pipeline: ✅ Complete — unified world-model.json (198 nodes, 290 edges, 18 categories), vault generator, validation script, 98 content pipeline tests
- Phase 6D (Ascendant Scry): ✅ Complete — scry types, content data, scry engine, ScryOverlay component, GameView wiring, integration tests
- Phase 6D (Mandate Tracker): ✅ Complete — 9 mandate templates, sphere-weighted generator, real condition evaluation, MandateTracker component, GameView wiring, 63 mandate tests
- Phase 6E (Agent Detail Panel): ✅ Complete — 19 narrative archetypes, agent detail aggregator, AgentDetailPanel character sheet, GameView sidebar wiring, 36 new tests
- Content Package Extraction: ✅ Complete — 5 new content packages (narrative, dream, doom, rival, influence), 28 new content tests, ~350 lines extracted from engine/type files
- Current phase: **Content extraction complete** — 8 content packages total, content writer data containers ready
- Engine stats: ~61 modules, ~9,200 lines, ~933 tests across 73 test files
- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 203 generated Obsidian vault notes, 8 content packages

