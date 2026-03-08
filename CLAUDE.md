This folder contains The Fantasy World Simulator — a systemic god-game/rogue-lite narrative simulation built in React + TypeScript + Vite.

## Running the Prototype

**Prerequisites:** Node.js 22+ and npm 10+.

```bash
# First time (or after pulling new dependencies)
npm install

# Start the dev server
npm run dev
```

Then open `http://localhost:5173` in your browser. The game should load immediately.

**Other useful commands:**

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Type-check + production build (outputs to `dist/`) |
| `npm test` | Run all ~1,027 tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run validate-model` | Validate world-model.json integrity (7 checks) |
| `npm run generate-vault` | Regenerate Obsidian vault from world-model.json |
| `npm run generate-hex` | Generate a hex tile image (requires Python + API key) |

**Note for Cowork/Claude sessions:** The sandbox VM has isolated networking, so `npm run dev` inside the VM won't be visible in the host browser. To verify the app in a Claude session, use `npx tsc --noEmit` (type-check), `npx vite build` (production build), and `npm test` (run tests) instead. The user must run `npm run dev` on their own machine to see the prototype.

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
- **`Design/style-tile.html`** — an HTML visualization of STYLE.md, used as a quick visual reference for colors, swatches, gradients, and UI chrome. **Also the master registry of all hex tile assets** — terrain tiles, clear fills, overlay icons, size tiers, and active/reserve status. If an asset isn't in the style tile's "Hex Asset Legend" section, it's not in the game.

**The style tile must always reflect STYLE.md.** Whenever STYLE.md is modified — colors changed, spheres renamed, sections added or removed — the style tile must be updated in the same session to stay in sync. Never leave them diverged.

## Cosmology Quick Reference

Three orthogonal dimensions define the world:

- **Foundation Spheres** (2 opposed pairs): Chaos ↔ Order, Light ↔ Darkness. These set the cosmic tone and bias the World-Soul.
- **Creation Spheres** (8 independent): Force, Matter, Energy, Life, Mind, Spirit, Time, Entropy. Context determines expression — no inherent alignment.
- **Nine Reaches** (action domains): Iron (warfare), Gold (trade), Shadow (stealth), Veil (magic), Heart (social), Eye (knowledge), Stone (construction), Star (navigation/fate), Flesh (biology). Every CRUD action template maps to a Reach.

## Non-Functional Priorities (in order)

These guide every code architecture decision. When in tension, higher priorities win.

1. **Tunability** — Every magic number is a named constant. Changing game feel should mean changing a number, not rewriting logic. Group constants at the top of each module or in the type file.
2. **Inspectability** — You must be able to trace *why* something happened. Flat state objects (loggable, diffable), pure functions (testable in isolation), causal event trails. No hidden state in closures or singletons. All engine modules must emit structured traces via `emitTrace()` from `src/engine/traceBuffer.ts`. The debug panel (backtick key in-game) is the primary inspectability tool — if you can't see a decision or outcome in the panel, it's not inspectable. New trace categories follow a 3-step recipe: define interface, add to union, call emitTrace.
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
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-archetype-enrichment-design.md | Design doc: enrich-in-place approach, enriched interface, beat pattern coverage, lookup functions |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-archetype-enrichment-implementation.md | 8-task TDD implementation plan for archetype enrichment |
| 2026-03-06 | Repo: src/data/ | Enriched archetype-content.ts (894 lines) — 19 archetypes with toneKeywords, beatPatterns, vignetteSeeds, narrativeRequirements + 3 lookup functions | All 4 content layers from content strategy populated |
| 2026-03-06 | Repo: src/data/__tests__/ | Rewrote archetype-content.test.ts (357 lines, 53 tests) — structural, content quality, lookup functions, per-archetype validation | Full test coverage for enriched archetypes |
| 2026-03-06 | Obsidian: Systems/ | Updated Narrative Archetypes.md — implementation status, lookup functions, beat pattern structure | Enrichment complete, vault reflects current state |
| 2026-03-06 | Obsidian: Systems/ | Updated Content Packages.md — archetype-content.ts marked as enriched (894 lines, 53 tests) | Content package status updated |
| 2026-03-06 | Notion: Backlog | Marked Archetype Content Data implementation complete | 894 lines, 53 tests, design + plan docs linked |
| 2026-03-06 | CLAUDE.md | Updated project status, engine stats, changelog | Archetype enrichment complete |
| 2026-03-06 | Repo: Docs/plans/ | Created 2026-03-06-culture-bounded-context-design.md | 9-section design doc: budget model, traits, locations, artifacts, beats, composite modifiers, content manifest, narrative integration, cultural drift |
| 2026-03-06 | Repo: Docs/plans/ | Updated 2026-03-06-content-strategy.md — added §4a Content Production Manifest, updated §4 palette generation, updated §7 culture-content.ts scope, added 3 decisions | Culture system content production requirements integrated into content strategy |
| 2026-03-06 | Obsidian: Systems/ | Created Culture Bounded Context.md | New system note for culture system with connections to World-Soul, Trait System, Narrative Engine, Content Pipeline |
| 2026-03-06 | Obsidian: Actors/ | Updated Culture.md — appended Culture Bounded Context section | Actor note now links to full system design |
| 2026-03-06 | Obsidian: Systems/ | Updated Content Strategy.md, Content Packages.md — culture palette generation, content scope | Culture design references added to existing system notes |
| 2026-03-06 | Obsidian: Index.md | Added Culture Bounded Context link to Content Strategy & Architecture section | New system discoverable from vault hub |
| 2026-03-06 | Notion: Backlog | Added Culture Bounded Context design as complete, added to reference documents | Culture design phase tracked in backlog |
| 2026-03-06 | CLAUDE.md | Updated project status (culture design complete), content stats, changelog | Culture bounded context documentation |
| 2026-03-06 | CLAUDE.md | Added "Running the Prototype" section with commands, prerequisites, Cowork networking note | User confirmed prototype runs; documenting how to launch it |
| 2026-03-06 | Repo: src/types/ | Created visibility.ts — HexVisibility, StaleSnapshot, VisibilityMap, LOSSource types + 5 constants | Phase 6F Task 1: fog of war type foundation |
| 2026-03-06 | Repo: src/engine/ | Created visibility.ts — getAvatarHexPosition, collectLOSSources, recalcVisibility (232 lines, 10 tests) | Phase 6F Task 2: fog of war engine |
| 2026-03-06 | Repo: src/types/ + src/engine/ | Added visibilityMap to GameState, wired into orchestrator tick loop + GameView init | Phase 6F Task 3: visibility state integration |
| 2026-03-06 | Repo: src/components/HexMap/ | Modified HexTile.tsx — three-state fog rendering (unexplored=black, remembered=dimmed, visible=normal) | Phase 6F Task 4: fog rendering |
| 2026-03-06 | Repo: src/components/HexMap/ | Modified HexTile.tsx + HexMap.tsx — sphere-colored pulsing avatar hex overlay with CSS breathe animation | Phase 6F Task 5: avatar hex overlay |
| 2026-03-06 | Repo: src/components/HexMap/ | Modified HexMap.tsx — d3-zoom (scroll-wheel + drag-pan), forwardRef with centerOn(), scale 1.0-4.0 | Phase 6F Task 6: zoom/pan |
| 2026-03-06 | Repo: src/components/Game/ | Created AvatarHUD.tsx — top-left panel with name, Move/Wheel/Scry buttons, sphere accent (9 tests) | Phase 6F Task 7: avatar HUD |
| 2026-03-06 | Repo: src/engine/ | Created avatarMove.ts — moveAvatarToHex with transient location creation (3 tests) | Phase 6F Task 8: avatar movement |
| 2026-03-06 | Repo: src/components/Game/ | Modified GameView.tsx — wired visibility, zoom, AvatarHUD, move mode, initial camera centering | Phase 6F Task 9: full integration |
| 2026-03-06 | CLAUDE.md | Updated project status (Phase 6F complete), engine stats, changelog | Phase 6F documentation |
| 2026-03-07 | skills/qa-orchestrator/ | Created QA orchestrator skill — 4 specialist agents (visual, info-arch, interaction, react-code), finding schema, 14-step orchestrator checklist, Notion integration | Repeatable QA flow for UI/UX/frontend |
| 2026-03-07 | Docs/plans/ | Created 2026-03-07-qa-orchestrator-design.md, 2026-03-07-qa-orchestrator-implementation.md | Design rationale (7 decisions) + 12-task TDD implementation plan |
| 2026-03-07 | Docs/qa/ | Created skill test results (RED-GREEN comparison) | Baseline vs with-skill: structured JSON output, per-finding effort/severity, Notion-ready |
| 2026-03-07 | Repo: Docs/plans/ | Created 2026-03-07-game-theory-disposition-design.md, 2026-03-07-game-theory-disposition-implementation.md | Design doc (9 sections) + 16-task TDD implementation plan (1,063 lines) |
| 2026-03-07 | Repo: src/types/ | Created disposition.ts (112 lines) — CooperationStrategy, InteractionRecord, DilemmaEvent, DilemmaOutcome, StakesLevel + 12 tunable constants | Game theory type foundation |
| 2026-03-07 | Repo: src/engine/ | Created disposition.ts (400+ lines) — evaluateStrategy, applyDispositionModifier, logInteraction, updateReputation, decayReputation, computeStakes, resolveDilemma, applyDilemmaEffects | Core disposition engine with 5 strategies and dilemma resolution |
| 2026-03-07 | Repo: src/engine/ | Modified worldSeed.ts — assigns random cooperationStrategy + default reputation to seeded agents | Disposition data seeded into world graph |
| 2026-03-07 | Repo: src/engine/ | Modified agentActions.ts — applyDispositionModifier as stage 2 in action selection pipeline | Disposition modifier wired into agent behavior |
| 2026-03-07 | Repo: src/engine/ | Modified orchestrator.ts — added phaseDilemmaDetection + phaseReputationDecay tick phases | Dilemma detection and reputation decay in tick loop |
| 2026-03-07 | Repo: src/engine/ | Modified narrative.ts — added 4 dilemma beat templates (mutual_trust, betrayed, exploitation, mutual_distrust) | Narrative beats for all dilemma outcomes |
| 2026-03-07 | Repo: src/engine/ | Modified agentDetail.ts — added cooperationStrategy, reputationScore, recentInteractions to AgentDetail | Agent detail aggregator surfaces disposition data |
| 2026-03-07 | Repo: src/components/Game/ | Modified AgentDetailPanel.tsx — added Disposition section with strategy name, reputation bar, interaction history | UI surfaces agent cooperation strategy and history |
| 2026-03-07 | Repo: tests | Created 6 test files: disposition.test.ts (61), disposition-integration.test.ts (6), disposition-dilemma-integration.test.ts (4), extended agentDetail.test.ts (+5), AgentDetailPanel.test.tsx (+3) — 98 new tests | Full test coverage for disposition system |
| 2026-03-07 | CLAUDE.md | Updated project status (disposition system complete), engine stats (~70 modules, ~11,500 lines, ~1,106 tests), changelog | Game theory disposition system documentation |
| 2026-03-07 | Repo: src/components/HexMap/ | Modified HexMap.tsx + HexTile.tsx — `HEX_MAP_BACKGROUND` and `UNEXPLORED_HEX_COLOR` constants (#1e1b2e) | QA fix VS-001: hex map background too bright for Threadbare aesthetic |
| 2026-03-07 | Repo: src/components/Game/ | Modified GameView.tsx — wheelFeedback state, agent null-check before wheel; StrandView.tsx + ScryOverlay.tsx — pointerEvents: 'auto' | QA fixes IX-001/002/004: wheel interaction feedback and overlay pointer events |
| 2026-03-07 | Repo: src/components/Game/ | Modified RivalPanel, EssencePanel, SimulationControls — h2 headings; AvatarHUD — "Avatar" button text; MandateTracker — Escape key handler | QA fixes IA-001/003/005, IX-003: heading hierarchy, accessible labels, keyboard interaction |
| 2026-03-07 | Repo: src/components/Game/ | Added React.memo to RetinuePanel, RivalPanel, AgentDetailPanel; extracted WHEEL_CONFIG (9 constants) in AgentWheel, LAYOUT_CONFIG (7 constants) in HexZoomView | QA fixes RC-001/002: unnecessary re-renders and magic numbers |
| 2026-03-07 | Repo: src/components/Game/ | Modified NarrativeFeed.tsx — useMemo log aggregation grouping consecutive identical messages with ×N badge | QA fix IA-004: repetitive log entries |
| 2026-03-07 | Repo: src/data/ + src/engine/ | Added RIVAL_ACTION_TEMPLATES to rival-content.ts (3-4 variants per action type); orchestrator.ts uses seeded PRNG template selection | QA fix IA-008: repetitive rival action text |
| 2026-03-07 | Repo: src/components/Game/ | Modified MandateTracker.tsx — z-50 on compact bar for toggle-close, "NEW" display for 0% progress | QA fixes IX-005/IA-010: mandate toggle and empty progress display |
| 2026-03-07 | Repo: src/components/Game/ | Modified AvatarHUD.tsx — module-level BUTTON_BASE_STYLE/CONTAINER_STYLE constants, useMemo for dynamic styles, useCallback for handlers | QA fix RC-003: inline object creation on every render |
| 2026-03-07 | Repo: src/components/Game/ | Modified GameView.tsx — 5 useCallback handlers (handleToggleRunning, handleBackFromAgentDetail, etc.), removed gameState.tick from 6 useMemo deps | QA fixes RC-007/017: inline event handlers and over-broad memo deps |
| 2026-03-07 | CLAUDE.md | Updated project status (QA sweep complete), engine stats (~106 modules, ~17,949 lines), changelog | QA fix sprint documentation |
| 2026-03-07 | Repo: src/data/ | Created culture-content.ts (1,789 lines) — 4 foundation modifiers, 8 creation sphere modifiers, 22 biome modifiers, 35 formative trait seeds, 45 behavioral trait seeds, 25 insider beats, 18 sub-location templates, 6 artifact lore patterns, 9 lookup functions | Culture content data implementation |
| 2026-03-07 | Repo: src/data/__tests__/ | Created culture-content.test.ts (822 lines, 577 tests) — structural validation, uniqueness, cross-references, lookup functions, per-entry quality validation | Culture content test coverage |
| 2026-03-07 | Repo: Docs/plans/ | Created 2026-03-07-culture-content-implementation.md | 10-task TDD implementation plan for culture content data package |
| 2026-03-07 | Repo: Docs/plans/ | Created 2026-03-07-narrative-context-builder-design.md, 2026-03-07-narrative-context-builder-implementation.md | Pass 1 design doc (146 lines) + 9-task TDD implementation plan (1,697 lines) |
| 2026-03-07 | Repo: src/data/ | Created opposition-content.ts (112 lines) — foundation sphere opposition matrix, creation sphere tensions, archetype friction pairs, PROXIMITY/INVOLVEMENT/HARVEST/SELECTION scoring constants, 3 lookup functions | Opposition tension scoring content package |
| 2026-03-07 | Repo: src/types/ | Modified narrative.ts — added ContextCategory, ContextObject, OpposingPair, OppositionSummary, NarrativeContext types; extended ProseContext with contextObjects, historicalFragments, oppositionSummary | Context builder type foundation |
| 2026-03-07 | Repo: src/engine/ | Created contextBuilder.ts (443 lines) — harvestContext (BFS graph traversal), rankObjects (proximity+involvement+opposition scoring), selectObjects (greedy with category cap), buildNarrativeContext (full pipeline) | Narrative context builder harvest→rank→select→build pipeline |
| 2026-03-07 | Repo: src/engine/ | Modified orchestrator.ts — phaseNarrative now converts TickEvent→NarrativeEvent, calls buildNarrativeContext, populates promptContext with real actors/location/mood/previousEvents | Chronicle entries now world-aware with ranked context objects |
| 2026-03-07 | Repo: tests | Created contextBuilder.test.ts (540 lines, 20 tests), orchestrator-narrative.test.ts (246 lines, 10 tests), contextBuilder-integration.test.ts (110 lines, 4 tests), opposition-content.test.ts (22 tests), narrativeContext.test.ts (4 tests) — 60 new tests | Full test coverage for narrative context builder |
| 2026-03-07 | CLAUDE.md | Updated project status (narrative context builder Pass 1 complete), engine stats (~110 modules, ~21,077 lines, ~1,743 tests), changelog | Narrative context builder documentation |
| 2026-03-07 | Repo: Docs/plans/ | Created 2026-03-07-culture-generator-design.md, 2026-03-07-culture-generator-implementation.md | Design doc + 11-task TDD implementation plan for culture generator Pass 1 |
| 2026-03-07 | Repo: src/types/ | Created culture.ts — CultureIdentity, CultureEdgeProperties, 5 tunable constants; modified graph.ts — added belongs_to EdgeType | Culture generator type foundation |
| 2026-03-07 | Repo: src/engine/ | Created cultureGenerator.ts (314 lines) — composeCultureIdentity, generateCultureName, generateCultures, assignCultureToActor, assignCultureToLocation, assignCulturesToActors | Culture generator engine with foundation × sphere × biome composition |
| 2026-03-07 | Repo: src/data/ | Extended culture-content.ts — added CULTURE_NAME_FRAGMENTS (foundation/sphere/biome fragments + 6 pattern templates) | Culture name generation data |
| 2026-03-07 | Repo: src/engine/ | Modified worldSeed.ts — optional FoundationBalances param, cultureIds in SeedResult, culture generation + assignment phases | Culture generator wired into world seeding pipeline |
| 2026-03-07 | Repo: tests | Created cultureGenerator.test.ts (19 tests), culture-integration.test.ts (4 tests), extended worldSeed.test.ts (+6 tests), culture-content.test.ts (+4 tests) — 33 new culture tests | Full culture generator test coverage |
| 2026-03-07 | CLAUDE.md | Updated project status (culture generator Pass 1 complete), engine stats (~111 modules, ~20,971 lines), changelog | Culture generator documentation |
| 2026-03-07 | Repo: Docs/plans/ | Created 2026-03-07-debug-trace-panel-design.md, 2026-03-07-debug-trace-panel-implementation.md | Design doc (6 decisions, full UI spec) + 11-task TDD implementation plan for debug trace panel |
| 2026-03-07 | Repo: src/types/ | Created trace.ts (96 lines) — TraceBase, PipelineStageSnapshot, 5 trace category interfaces, TraceEntry discriminated union, TRACE_CATEGORIES | Trace type foundation |
| 2026-03-07 | Repo: src/engine/ | Created traceBuffer.ts (75 lines) — ring buffer (500 entries), emitTrace, getTraces, getTracesForAgent, enable/disable/clear, zero-cost boolean toggle | Trace buffer engine |
| 2026-03-07 | Repo: src/engine/ | Modified orchestrator.ts — tick_summary trace at end of runTick() | Tick-level tracing |
| 2026-03-07 | Repo: src/engine/ | Modified agentSelection.ts — action_selection trace with 5-stage pipeline snapshots | Action selection tracing |
| 2026-03-07 | Repo: src/engine/ | Modified narrative.ts — narrative_generation trace in generateRoutineProse/generateNotableProse | Narrative generation tracing |
| 2026-03-07 | Repo: src/engine/ | Modified contextBuilder.ts — context_harvest trace with harvestedCount, rankedTop, oppositionTension | Context harvest tracing |
| 2026-03-07 | Repo: src/engine/ | Modified disposition.ts — dilemma_resolution trace with strategies, moves, outcome, stakes, deltas | Dilemma resolution tracing |
| 2026-03-07 | Repo: src/components/Game/ | Created DebugPanel.tsx (510 lines) — 480px right-side drawer, 3 modes (Feed/Agent Follow/Tick Inspector), 5 category-specific renderers, Threadbare styling | Debug trace panel UI |
| 2026-03-07 | Repo: src/components/Game/ | Modified GameView.tsx — backtick toggle, Debug pill button, right sidebar replacement with DebugPanel | Debug panel GameView wiring |
| 2026-03-07 | Repo: tests | Created 10 test files for trace system: trace.test.ts (7), traceBuffer.test.ts (8), traceBuffer-orchestrator (5), traceBuffer-actions (6), traceBuffer-narrative (14), traceBuffer-context (7), traceBuffer-dilemma (11), traceBuffer-integration (10), DebugPanel.test.tsx (14), GameView-debug.test.tsx (6) — 88 new tests | Full trace system test coverage |
| 2026-03-07 | CLAUDE.md | Updated §2 Inspectability (tracing requirement), §Session Workflow (tracing step), project status, changelog | Debug trace panel documentation |
| 2026-03-07 | Repo: src/types/ | Extended culture.ts — CultureIdentity interface, CULTURE_COUNT/CULTURAL_STRENGTH constants; extended narrative.ts — InsiderBeatSummary type, availableInsiderBeats field on NarrativeContext | Culture Pass 2 type foundation |
| 2026-03-07 | Repo: src/engine/ | Created culturalTension.ts (204 lines) — 4 tension detectors (mismatch, conquest, dual, fanaticism) + aggregate scorer with CULTURAL_TENSION_SCORES constants | Cultural tension detection module |
| 2026-03-07 | Repo: src/engine/ | Created insiderBeatDetection.ts (76 lines) — getAvailableInsiderBeats walks belongs_to edges, extracts culture tags, matches insider beats by strength threshold | Insider beat detection module |
| 2026-03-07 | Repo: src/engine/ | Modified contextBuilder.ts — imports culturalTension + insiderBeatDetection, computes culturalStrength/culturalTension/availableInsiderBeats in buildNarrativeContext | NarrativeContext cultural enrichment |
| 2026-03-07 | Repo: src/engine/ | Modified worldSeed.ts — cultural trait instantiation (formative + behavioral) from culture-content seeds, grants to actors via has_trait edges | Cultural traits granted at world seeding |
| 2026-03-07 | Repo: tests | Created culturalTension.test.ts (10 tests), insiderBeatDetection.test.ts (4 tests), culture-pass2-integration.test.ts (3 tests); extended narrativeContext.test.ts (+1), contextBuilder tests pass with new fields | ~30 new culture Pass 2 tests |
| 2026-03-07 | CLAUDE.md | Updated project status (Culture Pass 2 complete), engine stats, changelog | Culture Pass 2 documentation |
| 2026-03-08 | Repo: src/engine/ | Created gameInit.ts — extracted initializeGameState from GameView.tsx (17 tests) | Playtest Capture Task 1: reusable game initialization |
| 2026-03-08 | Repo: scripts/ | Created playtest-format.ts — formatFullReport with 3-section markdown (dashboard, narrative log, trace deep-dive) | Playtest Capture Task 2: report formatter |
| 2026-03-08 | Repo: scripts/ | Created playtest.ts — headless runner with multi-seed, configurable ticks/interval/significance, esbuild bundling | Playtest Capture Task 3: playtest runner |
| 2026-03-08 | Repo: Docs/playtests/ | First batch: 9 seed reports (42, 7, 100, 1, 2, 8, 9, 123, 999) + review-summary.md with 7 findings | Playtest Capture Task 4: first real playtest run |
| 2026-03-08 | Repo: Docs/plans/ | Created 2026-03-08-playtest-capture-design.md, 2026-03-08-playtest-capture-implementation.md | Playtest capture design rationale + 5-task implementation plan |
| 2026-03-08 | CLAUDE.md | Updated project status (Playtest Capture complete), engine stats, changelog | Playtest Capture Task 5: documentation |
| 2026-03-08 | Repo: Docs/plans/ | Created 2026-03-08-golden-path-polish-design.md, 2026-03-08-golden-path-polish-implementation.md | Design doc (5 fixes) + 8-task TDD implementation plan for playtest findings |
| 2026-03-08 | Repo: src/types/ | Modified disposition.ts — DILEMMA_STAKES_THRESHOLD 0.6→0.3, added STAKES_BASE = 0.15 | Fix 3: dilemma detection tuning |
| 2026-03-08 | Repo: src/engine/ | Modified disposition.ts — computeStakes starts at STAKES_BASE instead of 0 | Fix 3: stakes floor for non-gold/iron spheres |
| 2026-03-08 | Repo: src/engine/ | Modified orchestrator.ts — phaseAgentActions rewrite (routine/notable prose, significance 0.3-0.9, sphere influence +0.02, notable events every 5 ticks), phaseDilemmaDetection actor selection fix, phaseAgentLifecycle wired into runTick | Fixes 2-5: narrative differentiation, dilemma detection, mandate progress, lifecycle phase |
| 2026-03-08 | Repo: src/engine/ | Modified worldSeed.ts — sphereInfluence initialization on locations, constructed_by + controls edges seeded after faction creation | Fix 4: mandate progress graph structures |
| 2026-03-08 | Repo: src/engine/ | Created agentLifecycle.ts (~240 lines) — phaseAgentLifecycle with death (rep<0.1→2%, age>200→1%), birth (density≥3→1%), migration (2%) | Fix 5: agent population evolves |
| 2026-03-08 | Repo: src/engine/__tests__/ | Created orchestrator-dilemma.test.ts, orchestrator-prose.test.ts — dilemma stakes + prose differentiation tests | Golden Path test coverage |
| 2026-03-08 | Repo: Docs/playtests/ | Updated seed 42/7/100 reports — 100-tick verification runs confirming all 5 fixes | Verification playtest results |
| 2026-03-08 | CLAUDE.md | Updated project status (Golden Path Polish Sprint complete), engine stats, changelog | Golden Path documentation |
| 2026-03-08 | Repo: Docs/plans/ | Created 2026-03-08-gameview-decomposition-design.md, 2026-03-08-gameview-decomposition-implementation.md | Design doc (5 sections) + 8-task implementation plan for GameView decomposition |
| 2026-03-08 | Repo: src/components/Game/hooks/ | Created useSimulation.ts (130 lines), useHexZoomData.ts (90 lines), useAvatarData.ts (113 lines), useAgentInteraction.ts (219 lines), useScry.ts (66 lines), useViewNavigation.ts (120 lines) | 6 custom hooks extracted from GameView — total 738 lines of hook code |
| 2026-03-08 | Repo: src/components/Game/ | Modified GameView.tsx — 791→384 lines, zero state/handlers/effects, purely hook calls + JSX layout | GameView decomposition: all logic delegated to hooks |
| 2026-03-08 | CLAUDE.md | Updated project status (GameView Decomposition complete), engine stats, changelog | GameView decomposition documentation |
| 2026-03-08 | Repo: Docs/plans/ | Created 2026-03-08-batch-art-pipeline-design.md, 2026-03-08-batch-art-pipeline-implementation.md | Design doc (7 decisions) + 10-task TDD implementation plan for batch art pipeline |
| 2026-03-08 | Repo: scripts/generate-hex-tile.py | Added MAGIC_REGISTRY (12 spheres), build_magic_prompt, black_to_transparent, generate_magic_tile, audit_assets, enhanced CLI (--category, --sphere, --audit, --batch-all) | Batch art generation pipeline: magic overlay support, asset auditing, CLI consolidation |
| 2026-03-08 | Repo: scripts/generate-hex-tile.py | Changed default terrain output from Assets/biomes/ to public/hex-tiles/ | Output consolidation — all hex art goes to web-servable directory |
| 2026-03-08 | Repo: scripts/tests/ | Created test_pipeline.py (13 tests), __init__.py | Python pipeline test coverage: registry, prompts, transparency, audit, CLI |
| 2026-03-08 | Repo: package.json | Replaced generate-hex:batch with generate-hex:terrain, generate-hex:magic, generate-hex:audit, generate-hex:all | npm script aliases for new pipeline categories |
| 2026-03-08 | Repo: src/data/hex-tile-assets.ts | Added AllSphereName type, MAGIC_OVERLAY_MAP (12 entries), getMagicOverlayUrl helper | TypeScript magic overlay map for runtime sphere→PNG lookup |
| 2026-03-08 | Repo: src/data/__tests__/hex-tile-assets.test.ts | Extended with 6 new tests for MAGIC_OVERLAY_MAP and getMagicOverlayUrl | Magic overlay test coverage |
| 2026-03-08 | CLAUDE.md | Updated project status (Batch Art Pipeline complete), engine stats, changelog | Batch art pipeline documentation |

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
6. **Tracing**: Any new engine module that makes decisions or generates content must call `emitTrace()` with a structured trace entry. Verify new traces appear in the debug panel (backtick key) before considering the feature complete.

**This is non-negotiable.** Documentation updates happen immediately after integration and testing, in the same session, not "later."

**Use the `gamedocumenter` skill** (in `skills/gamedocumenter/SKILL.md`) for Step 5. It encodes the exact tool calls, API workarounds, and templates for all three documentation layers. Do not improvise the documentation workflow — the skill exists because the Obsidian and Notion APIs have specific quirks that waste time if you don't know about them.

## Continuous Improvement & Skill Creation

Repetitive workflows are a signal to invest in a reusable skill. If you notice yourself (or the user) doing the same multi-step process across sessions — documentation updates, content generation pipelines, testing patterns, art prompt construction — propose creating or refining a skill for it. The upfront cost of skill creation pays for itself quickly in consistency and speed.

**When to propose a skill:**
- You've done the same workflow 2+ times and it has non-obvious steps or workarounds
- API quirks or tool-specific patterns need to be remembered across sessions
- The workflow has a checklist-like structure that benefits from rigid enforcement

**Existing project skills:**
- `gamedocumenter` — post-implementation documentation across CLAUDE.md, Obsidian, Notion
- `image-generation` — art prompt construction for Nano Banana / Imagen with hex pipeline
- `qa-orchestrator` — dispatches 4 specialist sub-agents for systematic UI/UX/frontend QA sweeps

**How to create:** Use the `skill-creator` skill, which includes a TDD-like eval framework for measuring skill quality against baselines.

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
- Archetype Content Enrichment: ✅ Complete — 19 archetypes enriched with tone keywords, beat patterns, vignette seeds, narrative requirements (894 lines, 53 tests)
- Culture Bounded Context Design: ✅ Complete — 9-section design doc covering budget model, cultural traits, locations, artifacts, narrative beats, composite modifiers (~32 sets), content production manifest, narrative engine integration, cultural drift mechanics
- Phase 6F (Playable Map): ✅ Complete — three-state fog of war, avatar overlay + movement, d3-zoom/pan, AvatarHUD, GameView wiring
- Game Theory Disposition System: ✅ Complete — 5 cooperation strategies, disposition modifier in action pipeline, dilemma detection/resolution (2×2 matrix), reputation system with decay, narrative beat integration, agent detail panel strategy section, 98 disposition tests across 6 test files
- QA Sweep: ✅ Complete — 19 findings fixed across ~20 files (VS-001, IX-001/002/003/004/005, IA-001/003/004/005/008/010, RC-001/002/003/007/017): Threadbare hex colors, React.memo wrappers, magic number extraction, useCallback/useMemo optimization, log aggregation, rival text variation, mandate UX improvements
- Culture Content Data: ✅ Complete — 1,789-line content package with 163 entries (4 foundation + 8 creation sphere + 22 biome modifiers, 35 formative + 45 behavioral trait seeds, 25 insider beats, 18 sub-location templates, 6 artifact lore patterns), 9 lookup functions, 577 tests
- Narrative Context Builder (Pass 1): ✅ Complete — harvest→rank→select→build pipeline with opposition tension scoring, wired into phaseNarrative, chronicle entries now world-aware with ranked context objects. 4 new files (contextBuilder.ts 443 lines, opposition-content.ts 112 lines, 3 test files), 60 new tests across 5 test files
- Culture Generator (Pass 1): ✅ Complete — belongs_to edge type, CultureIdentity types + 5 constants, composeCultureIdentity (foundation × sphere × biome merger), generateCultureName (pattern-based), generateCultures (2-4 per world), assignCulturesToActors (70/20/10 budget model), wired into seedWorld with optional FoundationBalances param. 3 new files (culture.ts types, cultureGenerator.ts 314 lines, culture-integration.test.ts), name fragments added to culture-content.ts, 29 new culture tests + 6 seedWorld integration tests + 4 culture integration tests
- Debug Trace Panel: ✅ Complete — 5 trace categories (action_selection, narrative_generation, context_harvest, dilemma_resolution, tick_summary), ring buffer (500 entries), zero-cost toggle, 480px right-side drawer with 3 modes (Feed/Agent Follow/Tick Inspector), 5 category-specific renderers, backtick keyboard shortcut, Threadbare styling. 13 new files (2 types, 1 engine, 1 component, 10 test files), 88 new tests, 5 existing engine files instrumented
- Culture Pass 2 (Cultural Traits + Narrative Integration): ✅ Complete — cultural trait category with strengthThresholds, trait instantiation from culture-content seeds (formative + behavioral), strength-gated domain contributions, cultural tension detection (4 types: mismatch/conquest/dual/fanaticism), NarrativeContext enrichment (culturalStrength + culturalTension + availableInsiderBeats), insider beat detection from culture tags. 5 new files (culturalTension.ts 204 lines, insiderBeatDetection.ts 76 lines, culture-pass2-integration.test.ts, culturalTension.test.ts, insiderBeatDetection.test.ts), extended contextBuilder.ts + narrative.ts + worldSeed.ts, ~30 new tests across 5 test files
- Playtest Capture System: ✅ Complete — extracted initializeGameState from GameView, playtest report formatter (dashboard + narrative log + trace deep-dive), headless playtest runner (multi-seed, configurable ticks/interval/significance). First batch: seeds 42, 7, 100 at 50 ticks. Review summary: 7 findings (doom clock frozen, monotonous prose, zero dilemmas, mandate stuck, reputation static, linear essence, static population). 4 new files (gameInit.ts, playtest.ts, playtest-format.ts, review-summary.md), 17 gameInit tests, 9 seed reports
- Golden Path Polish Sprint: ✅ Complete — 5 fixes verified across 3 seeds × 100 ticks: (1) doom clock DEFAULT_DOOM_TICKS 360→120, (2) varied narrative prose via generateRoutineProse/generateNotableProse + significance 0.3-0.9, (3) dilemma detection with STAKES_BASE 0.15 + threshold 0.3 + actor selection fix, (4) mandate progress via sphere influence +0.02/action + seeded graph structures, (5) agent lifecycle phase (death/birth/migration) in agentLifecycle.ts. New files: agentLifecycle.ts (~240 lines), orchestrator-dilemma.test.ts, orchestrator-prose.test.ts. Modified: orchestrator.ts, disposition.ts, worldSeed.ts, disposition types
- GameView Decomposition: ✅ Complete — extracted 6 custom hooks from 791-line monolithic GameView: useSimulation (130 lines), useAvatarData (113 lines), useViewNavigation (120 lines), useScry (66 lines), useAgentInteraction (219 lines), useHexZoomData (90 lines). GameView reduced to 384 lines of pure hook calls + JSX layout (zero useState/useCallback/useMemo/useEffect/useRef). All 11 existing tests pass unchanged. Design doc + implementation plan in Docs/plans/
- Batch Art Generation Pipeline: ✅ Complete — MAGIC_REGISTRY (12 spheres with color/form_language/desc), build_magic_prompt (narrative-first Imagen prompts), black_to_transparent post-processing (brightness < 15 → alpha 0), generate_magic_tile pipeline, audit_assets (missing/orphaned/size-mismatch detection), enhanced CLI (--category terrain|magic, --sphere, --audit, --batch-all), output redirected to public/hex-tiles/, MAGIC_OVERLAY_MAP + getMagicOverlayUrl in hex-tile-assets.ts, 5 npm script aliases. 13 Python pipeline tests, 6 new TypeScript tests, 10 git commits
- Current phase: **Batch Art Pipeline complete** — next up: check Notion backlog for next priority
- Engine stats: ~129 modules, ~24,500+ lines, ~1,646+ engine/data tests across 113+ test files
- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 203 generated Obsidian vault notes, 11 content packages (archetype-content.ts fully enriched, culture-content.ts = 1,789+ lines / 581+ tests, opposition-content.ts = 112 lines / 22 tests)

