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
- Current phase: **Layer 2 planning** — Divine Toolkit UI (intervention confirmations, essence costs, detection feedback)
- Engine stats: ~39 modules, ~5,500 lines, ~650 tests across 43 test files
- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 199 generated Obsidian vault notes

