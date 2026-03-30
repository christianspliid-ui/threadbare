This folder contains The Fantasy World Simulator — a systemic god-game/rogue-lite narrative simulation built in React + TypeScript + Vite.

## Cowork vs Claude Code — Read This First

**If you are running in Cowork mode:** You must NOT write code or run git commands. You CAN write to `.planning/` coordination files (BACKLOG.md, HANDOVER.md, ROADMAP.md) — **snapshot before every write** (see `Docs/cowork-ways-of-working.md` → "Coordination File Versioning"). Your job is design, research, documentation (via MCP), and implementation plans. Hand coding tasks to Claude Code with a plan link.

**If you are running in Claude Code:** You do the coding, testing, committing, and pushing. Check for implementation plans in `Docs/plans/` before starting work.

## Running the Prototype

**Prerequisites:** Node.js 22+ and npm 10+.

```bash
npm install    # first time or after pulling new dependencies
npm run dev    # start Vite dev server with hot reload
```

| Command | What it does |
|---------|-------------|
| `npm run build` | Type-check + production build (outputs to `dist/`) |
| `npm test` | Run all tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run validate-model` | Validate world-model.json integrity |
| `npm run generate-vault` | Regenerate Obsidian vault from world-model.json |
| `npm run generate-hex` | Generate a hex tile image (requires Python + API key) |
| `npm run cli` | Interactive REPL for headless game testing (see below) |

**Dev Quick-Start URLs** (append to `http://localhost:5173`):

| URL Param | What it does |
|-----------|-------------|
| `?view=game` | **Primary dev view.** Full game view with Three.js hex map (HexMapV2) and all game chrome. Use this for all hex map and gameplay testing. |
| `?view=glow` | Magic glow tile preview |
| `?view=cms` | Content browser |
| `?fog` | Enable fog of war on load (fog is off by default). Combinable: `?view=game&fog` |

**For all testing, use `?view=game`** — this skips the multi-click entry flow and loads the full game with HexMapV2. Only test the worldgen/selection screens when those screens are the subject of the test.

**Note for Cowork/Claude sessions:** The sandbox VM has isolated networking. Use `npx tsc --noEmit`, `npx vite build`, and `npm test` to verify. The user must run `npm run dev` on their own machine.

### Headless CLI (`npm run cli`)

An interactive REPL for testing the game engine without a browser. **Use this for verifying engine behavior after changes** — it runs the real `initializeGameState` → `runTick` pipeline headlessly.

```bash
npm run cli                          # default seed 42, medium map
npm run cli -- --seed 99 --map small # custom seed + map size
```

Key commands at the `fws>` prompt: `tick [N]` (advance ticks), `run [N]` (auto-run at N ticks/sec), `pause`, `status` (game overview), `agents`, `agent <name>` (inspect one), `events [N]`, `doom`, `mandate`, `essence`, `encounters`, `factions`, `traces [N]`, `graph` (node counts), `eval <expr>` (JS with `state` in scope). Type `help` for the full list.

**When to use the CLI:**
- After modifying tick phases or orchestrator logic — run `tick 30` and check `status` + `events`
- After changing agent decision/movement — inspect with `agents` and `agent <name>`
- For pipeline throughput checks (NFP #7 in Pre-Commit Checklist) — `run 5` for 30+ ticks, then `encounters`, `factions`, `traces`
- Quick smoke test after engine changes when you can't run the browser

## Documentation Strategy

Three surfaces, each with a distinct purpose. Full ownership rules and duplication policy: **`Docs/documentation-ownership.md`**

- **Obsidian vault** — Domain model: systems, mechanics, terminology (wikilinks). Read `Index.md` first.
- **Repo `.planning/`** — Backlog, milestone roadmap, handover notes, coordination files
- **Repo `Docs/`** — Implementation rationale (`plans/`), changelog, UI patterns, project status

*Notion has some unmigrated content but is not used for active tracking.*

## Key Links

- Backlog: `.planning/BACKLOG.md` · Completed items: `.planning/BACKLOG_HISTORY.md`
- Active milestone roadmap: `.planning/ROADMAP.md`
- Obsidian vault index: read via Obsidian MCP → `TheFantasyWorldSimulator/Index.md`
- Documentation ownership: `Docs/documentation-ownership.md`
- Integration wiring checklist: `Docs/plans/wiring-checklist.md`
- Impediment log: `Docs/impediments.md` · Retrospectives: `Docs/retrospectives/`

Design docs live in `Docs/plans/` (named `YYYY-MM-DD-topic.md`). Find them by browsing the directory or loading the relevant domain skill.

## Non-Functional Priorities (in order)

When in tension, higher priorities win.

1. **Tunability** — Every magic number is a named constant. Changing game feel = changing a number, not rewriting logic.
2. **Inspectability** — Trace *why* something happened. Flat state, pure functions, causal event trails.
3. **Determinism** — Seeded PRNG everywhere. Same seed + same inputs = same outputs.
4. **Fail-soft** — The tick loop must never crash. Missing data → graceful fallback, never thrown exceptions.
5. **Narrative over mechanical perfection** — When mechanics and story diverge, lean toward the story.
6. **Additive over destructive changes** — Add new fields/functions; only refactor when old shape blocks progress.
7. **Performance budget, not premature optimization** — Profile before optimizing. Lean on the spotlight tier system.

## Testing

Cross-boundary testing rules, contract test patterns, pre-commit verification checklist, and anti-patterns are all in the **`testing-patterns` skill**. Load it when writing tests or before committing engine/HexMapV2 changes.

**Pre-commit minimum (always do these):**
1. `npm test` — all tests pass
2. `npx tsc --noEmit` — type check clean
3. `npx vite build` — production build succeeds (confirms Vercel will deploy)

## Viewport Contract (1920×1080)

The game fills exactly one viewport. **Nothing scrolls. Nothing renders below the fold.**

- **CSS enforcement:** `html, body, #root` have `height: 100dvh; overflow: hidden` in `index.css`. Never remove this.
- **Layout rule:** Every full-screen layout must use `h-screen flex flex-col overflow-hidden`. Child panels use `flex-1 overflow-y-auto` for internal scroll.
- **Preview verification:** Always run `preview_resize` to 1920×1080 (or the user's specified resolution) **before** taking screenshots. The default Playwright/preview viewport is not 1920×1080 — it can be any size.
- **WebGL/Three.js verification:** Playwright `preview_snapshot` and `preview_inspect` cannot see WebGL canvas content — they only see a blank `<canvas>` element. For visual verification of the hex map (HexMapV2) or any Three.js/WebGL content, use **Claude in Chrome** (`mcp__Claude_in_Chrome__*` tools): `tabs_context_mcp` → `navigate` → `computer` with `action: "screenshot"` or `action: "zoom"`. Playwright is still useful for console errors, network requests, and DOM-based UI around the canvas.
- **Modal/overlay rule:** Modals use `max-height: 85vh` (already in Modal primitive). Absolute-positioned overlays (InterventionConfirm, AgendaPicker) must use `inset: 0` within their parent, never exceed the parent's bounds.
- **Test for it:** If a component renders off-screen at 1920×1080, that's a bug — same severity as a broken interaction.

## Design Governance

Every design proposal **must be architecturally compliant before the user ever sees it.** Steps 1–4 happen in a single internal pass — never present a non-compliant design. If an NFP conflict is structural (not just a missing constant), flag it as a trade-off for the user.

### Design workflow checklist

- [ ] **Draft** the system design
- [ ] **Audit** against all 7 NFPs, load-bearing decisions, and rejected approaches
- [ ] **Revise** — integrate remediations inline (not in a separate appendix)
- [ ] **Summarize** — NFP Compliance table at the end (PASS / PASS with note per priority)
- [ ] **Present** the finished, compliant design to the user

### Per-system required sections (inline, not appendix)

- [ ] **Constants table** — every tunable number named, with default and purpose (NFP #1)
- [ ] **Tracing** — trace types emitted, with TypeScript interface definitions (NFP #2)
- [ ] **PRNG callouts** — where seeded randomness is needed, at point of use (NFP #3)
- [ ] **Fail-soft table** — failure cases and fallback behavior (NFP #4)
- [ ] **UI/visibility phase** — player-facing display, event notifications (alerts/toasts/chronicle), debug inspection (DebugPanel), visual presence (HexMapV2 signifiers/overlays). No UI phase = incomplete design.
- [ ] **Wiring section** — for each module: orchestrator phase, UI component, GameState flow, traces, debug visibility, prose pipeline (`enrichProse()`?), player controls. Reference `Docs/plans/wiring-checklist.md`. Module only in test files = not integrated.

### Maintenance and review

- [ ] **Update `Docs/plans/wiring-checklist.md`** when adding orchestrator phases, modals, GameState fields, trace categories, or player controls
- [ ] **Backfill older plans** — if a plan in `Docs/plans/` lacks NFP compliance or wiring, add them before implementing from it

## Load-Bearing Architectural Decisions

Settled. Do not revisit.

- **Everything is a graph node/edge.** No separate relational tables.
- **Reaches and Spheres are orthogonal axes.** Reaches = what you do (activity categories). Spheres = what fuels it (cosmic energies). They combine freely — same Reach at different Sphere alignments produces different action flavors. Neither subsumes the other.
- **Ascendants use the same prerequisite system as agents.** Domain Capability tiers + sphere alignment checks apply equally. Ascendants are powerful former mortals, not a special-cased entity type. Power level is tunable, not structurally different.
- **No inventing node types without verification.** If a conversation references a node type that doesn't exist in the current graph schema, **stop and ask the human** before creating it. First confirm it isn't an existing node under a different name. Check `src/types/graph.ts` and `world-model.json` for the canonical list.
- **New node types require full design before code.** If a genuinely new node type is confirmed, design it before implementing: define its category, required/optional properties, which edge types connect it to existing nodes, how it participates in the tick loop, and what traces it emits. No stub-it-and-figure-it-out-later.
- **Relationships between entities are graph edges, not property fields.** If two entities have a meaningful relationship (commands, owns, defends, trades with, etc.), model it as an edge type — never as a string ID field in a property bag. Properties are for data internal to a node (scores, statuses, flags). Before adding a new edge type, check `src/types/graph.ts` for existing edges that could serve the same purpose. Before encoding a relationship as a property, justify why graph traversal isn't needed — the default answer is "it is needed."


## Rejected Approaches (do not reintroduce)

- ❌ Classical stats (STR/DEX/INT) — replaced by Domain Capability across Nine Reaches
- ❌ Fixed rival pantheon — replaced by generated rivals from World-Soul
- ❌ Old 5-force cosmology — replaced by Foundation + Creation Sphere model
- ❌ Pure template-based prose — replaced by hybrid layered engine
- ❌ Pure LLM-generated content — replaced by generated-within-constraints with player iteration
- ❌ Intervention wheel (AgentWheel) — replaced by ActionDrawer with context-filtered cards via Generalized Action Targeting
- ❌ Fixed action count / capped action slots — replaced by open-ended, data-driven template pool filtered per target context
- ❌ React Three Fiber (R3F) — use raw Three.js with canvas ref instead. Direct Three.js gives full control over InstancedMesh, render loop, and d3-zoom integration without R3F abstraction overhead.
- ❌ KayKit GLTF 3D models — replaced by flat hex grid with 2D signifier art composited per-hex
- ❌ V1 SVG hex map (HexMap.tsx, HexTile.tsx, AgentDots.tsx, MovementTrails.tsx) — deleted in Phase 8. Replaced by HexMapV2 (Three.js InstancedMesh).

## Change Audit Trail

When modifying Obsidian vault notes:

- **In the document:** Dated inline note near the change (date, what, why — one line).
- **In the changelog:** Append to `Docs/changelog.md` (format: `| date | where | what changed | why |`).

## Definition of Done

Work is not "done" until it is deployed and documented. Do all of these automatically — do not ask, do not stop at "ready to push?", just do it.

- [ ] **Commit** all changes
- [ ] **Push** to GitHub (`git push`, with `-u origin <branch>` if needed)
- [ ] **Merge** feature branches into main immediately — don't leave branches waiting
- [ ] **Deploy** — Vercel auto-deploys from GitHub on push to `main`. Just ensure the push succeeded.
- [ ] **Update docs** — `BACKLOG.md` (mark `✅`, archive to `BACKLOG_HISTORY.md`), `project-status.md` (≤60 lines, move old entries to `project-history.md`), `project-history.md` (one-line `✅` entry), `changelog.md` (append rows)
- [ ] **Verify wiring** — Check every new module against `Docs/plans/wiring-checklist.md`. Engine modules called from orchestrator, modals rendered in GameView JSX, GameState fields consumed by UI, traces emitted, player controls connected. Update the checklist if new surfaces added.
- [ ] **Log impediments** — Any blockers or workarounds → `Docs/impediments.md`. Load `impediment-reporter` skill for format. Mandatory — unlogged friction is invisible.
- [ ] **Close out** — Tell the user: *"Session ready to archive — all work is tested, deployed, and documented. No loose ends."*

**Where to find completed work history:** `.planning/BACKLOG_HISTORY.md` (full descriptions) and `Docs/project-history.md` (one-line entries).

## Session Workflow

- [ ] Read this file for orientation
- [ ] **Check `.planning/HANDOVER.md`** — act on pending Cowork handovers before starting new work
- [ ] Read Obsidian `Index.md` via MCP → follow links to the relevant system
- [ ] Check `.planning/BACKLOG.md` + `.planning/ROADMAP.md` for priorities
- [ ] Read relevant design doc in `Docs/plans/` before writing code
- [ ] **Upstream health check** — if the feature depends on upstream pipeline throughput, verify the pipeline is producing output before coding. A feature wired to a dead pipeline is wasted work.
- [ ] After completing work, follow the **Definition of Done** above

## Domain Skills

Context for specific problem types lives in on-demand skills. **Always load `state-of-game-design` first** — it provides the foundational cosmology, action system, and architectural context that all other skills depend on.

| Domain | Skill | When to load |
|--------|-------|-------------|
| **Foundational (load first)** | `state-of-game-design` | Always — before any other domain skill. Cosmology, reaches, spheres, action verbs, prerequisites, architectural decisions. |
| Engine & code architecture | `engine-architecture` | Writing engine modules, tick loop work, tracing, resolution, PRNG |
| Frontend & UI | `frontend-ui` | Building components, styling, accessibility, layout at 1920–3440px. Loads `Docs/design-system/` |
| Content systems & worldbuilding | `content-worldbuilding` | Content packages, graph data, constraint layers, world-model.json |
| Hex map renderer | `hexmap-developer` | Writing any code in `src/components/HexMapV2/` or hex-related engine code. Architecture, coordinates, scene layers, zoom, coastline, stencil, signifiers, testing, debugging. Comprehensive developer onboarding guide. |
| Hex map decisions | `hexmap-renderer` | Quick reference for settled renderer decisions and patterns from Phases 1-8. Lighter than `hexmap-developer`. |
| Art direction & visual style | `art-direction` | Hex tiles, prompt construction, STYLE.md, Threadbare aesthetic |
| Blender → HexMap pipeline | `blender-to-hexmap` | Building 3D models in Blender MCP and importing GLB into HexMapV2. Palette, merge, bake rotation, export, Three.js wiring. |
| Creative prose & content | `cw-*` (platform) | `cw-brainstorming` for ideas, `cw-prose-writing` for drafts, `cw-official-docs` for wiki, `cw-story-critique` for review |
| Post-implementation docs | `gamedocumenter` | Obsidian/changelog/backlog updates after completing work |
| Image manipulation | `image-manipulation` | Geometric clipping, alpha masks, hex tile pipeline |
| QA sweeps | `qa-orchestrator` | Systematic UI/UX/frontend QA |
| Testing & contracts | `testing-patterns` | Writing tests for engine or HexMapV2 changes. Contract test patterns, dependency maps, anti-patterns, coverage gap reference. |
| Encounter tuning & analysis | `agent-analyser` | Analysing encounter log TSV exports for agent behavior, balance, variety, movement, capability growth, idle rates. Upload logs and ask for analysis. |
| **Impediment reporting (always active)** | `impediment-reporter` | **Every session, every agent.** Log blockers and workarounds to `Docs/impediments.md` as they occur. Part of Definition of Done. |
| Continuous improvement | `retrospective` | Review impediment log, analyze patterns, implement quick-fix improvements, backlog larger ones. Run with `/retrospective`. |

## Continuous Improvement

Two skills form a feedback loop:

1. **`impediment-reporter`** — Every agent logs friction as it happens → `Docs/impediments.md`
2. **`retrospective`** — Periodically analyze the log, implement quick wins, backlog bigger fixes → `Docs/retrospectives/`

Repetitive workflows → propose a skill. Use `skill-creator` to build and eval 