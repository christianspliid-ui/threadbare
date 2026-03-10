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

Four documentation layers, each with a distinct purpose. Do not duplicate content across them.

| Layer | Tool | Purpose | When to use |
|-------|------|---------|-------------|
| **Graph model** | Obsidian vault (`TheFantasyWorldSimulator/`) | System specs and relationships — concise notes with wikilinks showing what connects to what | Primary context when implementing a system. Read the Index.md first, then follow links to relevant systems. |
| **Project tracking** | Notion backlog | Sprint progress, implementation phase status, task assignment | Check what to build next, update progress after completing work. |
| **Design rationale** | Repo (`Docs/plans/`) | Full decision documents with tradeoffs, worked examples, and "why we chose X over Y" | Deep reference when you need to understand the reasoning behind a design choice. |
| **UI patterns** | Repo (`Docs/ui-patterns.md`) | Established frontend interaction conventions — component patterns, accessibility rules, prop shapes, styling norms | Before building any new UI component. Follow existing patterns; add new ones here in the same session. |

- **Obsidian** says *what the system is* (specs, connections, formulas)
- **Repo docs** say *why we chose it* (decision rationale, tradeoffs)
- **Notion** says *what to build next* (backlog, phases, progress)
- **UI patterns** say *how we build the frontend* (interaction conventions, accessibility, performance)

## Key Links

- Notion backlog: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf
- Consolidated discovery design: `Docs/plans/2026-03-04-high-level-discovery-pass.md`
- Obsidian vault index: read via Obsidian MCP → `TheFantasyWorldSimulator/Index.md`
- Visual style guide (source of truth): `STYLE.md`
- Visual style tile (HTML reference): `Design/style-tile.html`
- UI patterns (frontend conventions): `Docs/ui-patterns.md`

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
- **In the changelog:** Append a one-line entry to `Docs/changelog.md` so there's a single place to scan for recent changes across all docs.

The goal is traceability without overhead. If you changed it, note when and why.

Full changelog: **`Docs/changelog.md`** (format: `| date | where | what changed | why |`)

## Session Workflow

When starting implementation work:

1. Read this file for orientation
2. Read Obsidian `Index.md` via MCP, then follow links to the relevant system notes
3. Check the Notion backlog for current phase and next tasks
4. Read the relevant design doc in `Docs/plans/` before writing code
5. After completing work, **always do these documentation updates before moving on**:
   - Update the Notion backlog (mark tasks done, add new tasks discovered)
   - Update affected Obsidian vault notes (add new system notes, update existing ones with new concepts)
   - Append entries to `Docs/changelog.md`
   - Update `Docs/project-status.md` (phase status, engine stats)
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

Full phase-by-phase status: **`Docs/project-status.md`**

- CRUD Action Unification: 🔧 In Progress — design + plan complete, 10-task TDD implementation starting
- Current phase: **CRUD Action Unification** — bridging selection pipeline to graph outcomes via Three Connective Pieces
- Engine stats: ~175 modules, ~36,500+ lines, ~2,315+ tests across 185+ test files
- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 17 content packages, 975+ data tests

