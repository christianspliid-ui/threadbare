This folder contains The Fantasy World Simulator — a systemic god-game/rogue-lite narrative simulation built in React + TypeScript + Vite.

## Cowork vs Claude Code — Read This First

**If you are running in Cowork mode:** You must NOT write code, modify tracked files, or run git commands. Read `Docs/cowork-ways-of-working.md` for the full rules. Your job is design, research, documentation (via MCP), and implementation plans. Hand coding tasks to Claude Code with a plan link.

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

**Dev Quick-Start URLs** (append to `http://localhost:5173`):

| URL Param | What it does |
|-----------|-------------|
| `?view=game` | Skip worldgen + ascendant selection, jump straight to game view (seed 42, random archetype, "The Dev Oracle") |
| `?view=glow` | Magic glow tile preview |
| `?view=cms` | Content browser |
| `?fog` | Enable fog of war on load (fog is off by default). Combinable: `?view=game&fog` |

**When testing with Playwright or preview tools, always use `?view=game`** to skip the multi-click entry flow. Only test the worldgen/selection screens when those screens are the subject of the test.

**Note for Cowork/Claude sessions:** The sandbox VM has isolated networking. Use `npx tsc --noEmit`, `npx vite build`, and `npm test` to verify. The user must run `npm run dev` on their own machine.

## Documentation Strategy

Four surfaces, each with a distinct purpose. Full ownership rules and duplication policy: **`Docs/documentation-ownership.md`**

| Surface | Owns |
|---------|------|
| **Obsidian vault** | Domain model: systems, mechanics, terminology (wikilinks). Read `Index.md` first. |
| **Repo `.planning/`** | Backlog (`BACKLOG.md`), active milestone roadmap, requirements, session state |
| **Repo `Docs/`** | Implementation rationale (`plans/`), changelog, UI patterns, project status, this ownership map |
| **Paper** | Visual documentation: component anatomy, style, asset registry, player journey maps |

*Notion backlog archived 2026-03-22 — all tracking now in repo markdown files.*

## Key Links

- Backlog: `.planning/BACKLOG.md`
- Active milestone roadmap: `.planning/ROADMAP.md`
- Obsidian vault index: read via Obsidian MCP → `TheFantasyWorldSimulator/Index.md`
- Documentation ownership: `Docs/documentation-ownership.md`
- Visual style guide: `STYLE.md`
- Visual style tile: `Design/style-tile.html`
- UI patterns: `Docs/ui-patterns.md`
- Consolidated discovery design: `Docs/plans/2026-03-04-high-level-discovery-pass.md`
- Spheres and Reaches relationship: Obsidian MCP → `TheFantasyWorldSimulator/Cosmology/Spheres and Reaches.md`
- Generalized Action Targeting: `Docs/plans/2026-03-17-generalized-action-targeting-design.md`
- Mutable hex state + hex actions: `Docs/plans/2026-03-17-world-state-and-hex-actions-design.md`
- Hex action brainstorm (control mechanic, prerequisites): `brainstorm-hex-actions-and-control-mechanic.md`
- Agent Decision & Encounter Awareness: `Docs/plans/2026-03-18-agent-decision-and-encounter-awareness-design.md`
- Encounter Resolution & Divine Intervention: `Docs/plans/2026-03-18-encounter-resolution-and-divine-intervention-design.md`
- Tier Promotion & Capability Growth: `Docs/plans/2026-03-18-tier-promotion-and-capability-growth-design.md`
- Axiological Pairs (canonical): Obsidian MCP → `TheFantasyWorldSimulator/Domains/Axiological Pairs.md`
- Meet The First brainstorm: Obsidian MCP → `TheFantasyWorldSimulator/Brainstorms/brainstorm-meet-the-first.md`
- Social Fabric & Faction Formation: `Docs/plans/2026-03-18-social-fabric-and-faction-formation-design.md`
- Social Fabric Visibility Spec: `Docs/plans/2026-03-18-social-fabric-visibility-spec.md`
- Implementation Ordering Guide: `Docs/plans/2026-03-18-implementation-ordering-guide.md`
- Impediment log: `Docs/impediments.md`
- Retrospective reports: `Docs/retrospectives/`

## Non-Functional Priorities (in order)

When in tension, higher priorities win.

1. **Tunability** — Every magic number is a named constant. Changing game feel = changing a number, not rewriting logic.
2. **Inspectability** — Trace *why* something happened. Flat state, pure functions, causal event trails.
3. **Determinism** — Seeded PRNG everywhere. Same seed + same inputs = same outputs.
4. **Fail-soft** — The tick loop must never crash. Missing data → graceful fallback, never thrown exceptions.
5. **Narrative over mechanical perfection** — When mechanics and story diverge, lean toward the story.
6. **Additive over destructive changes** — Add new fields/functions; only refactor when old shape blocks progress.
7. **Performance budget, not premature optimization** — Profile before optimizing. Lean on the spotlight tier system.

## Viewport Contract (1920×1080)

The game fills exactly one viewport. **Nothing scrolls. Nothing renders below the fold.**

- **CSS enforcement:** `html, body, #root` have `height: 100dvh; overflow: hidden` in `index.css`. Never remove this.
- **Layout rule:** Every full-screen layout must use `h-screen flex flex-col overflow-hidden`. Child panels use `flex-1 overflow-y-auto` for internal scroll.
- **Preview verification:** Always run `preview_resize` to 1920×1080 (or the user's specified resolution) **before** taking screenshots. The default Playwright/preview viewport is not 1920×1080 — it can be any size.
- **Modal/overlay rule:** Modals use `max-height: 85vh` (already in Modal primitive). Absolute-positioned overlays (InterventionConfirm, AgendaPicker) must use `inset: 0` within their parent, never exceed the parent's bounds.
- **Test for it:** If a component renders off-screen at 1920×1080, that's a bug — same severity as a broken interaction.

## Design Governance

Every design proposal — whether a new system, a significant extension to an existing system, or a new content pipeline — **must be architecturally compliant before the user ever sees it.**

### The design workflow (internal, not user-facing)

1. **Draft** the system design
2. **Audit** the draft against all 7 NFPs, load-bearing decisions, and the rejected approaches list
3. **Revise** the design to integrate every remediation directly into the system descriptions — constants tables, trace schemas, fail-soft tables, PRNG callouts all go inline where the system is described, not in a separate appendix
4. **Summarize** the NFP compliance as a verdict table at the end (PASS / PASS with note per priority)
5. **Present** the finished, compliant design to the user

Steps 1–4 happen in a single pass. The user should never see a design that hasn't been through this cycle. If the audit reveals a fundamental conflict with an NFP (not just a missing constant, but a structural problem), flag it as a trade-off for the user to weigh in on — don't silently ship a non-compliant design.

### Required sections in every system description

Each system within a design document must include these inline (not as a separate audit section):

- **Constants table** — every tunable number named, with default and purpose (NFP #1)
- **Tracing** — what trace types the system emits, with TypeScript interface definitions (NFP #2)
- **Fail-soft** — table of failure cases and fallback behavior (NFP #4)
- **PRNG callouts** — where seeded randomness is needed, called out at the point of use (NFP #3)

### Required summary at end of design document

An NFP Compliance Summary table with one row per priority showing PASS / PASS with note. If any row shows a genuine trade-off (not just "needs tuning"), explain it so the user can make the call.

### When reviewing an existing design

If an older plan in `Docs/plans/` lacks inline NFP compliance, add it before building from it.

## Load-Bearing Architectural Decisions

Settled. Do not revisit.

- **Everything is a graph node/edge.** No separate relational tables.
- **Reaches and Spheres are orthogonal axes.** Reaches = what you do (activity categories). Spheres = what fuels it (cosmic energies). They combine freely — same Reach at different Sphere alignments produces different action flavors. Neither subsumes the other.
- **Ascendants use the same prerequisite system as agents.** Domain Capability tiers + sphere alignment checks apply equally. Ascendants are powerful former mortals, not a special-cased entity type. Power level is tunable, not structurally different.


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

## Change Audit Trail

When modifying Notion pages or Obsidian vault notes:

- **In the document:** Dated inline note near the change (date, what, why — one line).
- **In the changelog:** Append to `Docs/changelog.md` (format: `| date | where | what changed | why |`).

## Definition of Done

When implementation is complete and tests pass, **do all of these automatically — do not ask which option the user wants:**

1. **Commit** all changes
2. **Push** to GitHub (`git push`, with `-u origin <branch>` if needed)
3. **Merge** feature branches into main immediately — don't leave branches waiting
4. **Deploy** to Vercel production — Vercel auto-deploys from GitHub on push to `main`. No manual deploy step needed; just ensure the push succeeded.
5. **Document** — update `.planning/BACKLOG.md` (mark items complete, add new ones), update `Docs/project-status.md` and `Docs/changelog.md` and `Docs/project-history.md`
   - `project-history.md`: Append a one-line `✅ Complete` entry for each completed feature/system
   - `project-status.md`: Keep this file compact (current focus + recent completions only). Move any "Previous:" entries older than the current session into `project-history.md`. This file should never exceed ~60 lines.
   - `changelog.md`: Append row(s) as usual

This is non-negotiable. Work is not "done" until it is deployed and documented. Do not present options, do not ask for confirmation on these steps, do not stop at "ready to push?" — just do it.

6. **Log impediments** — If you encountered *any* blockers, workarounds, or friction during the session, verify they are all logged in `Docs/impediments.md`. Load the `impediment-reporter` skill for format details. This is mandatory — unlogged friction is invisible friction.
7. **Close out** — When all steps above are complete, explicitly tell the user: *"Session ready to archive — all work is tested, deployed, and documented. No loose ends."* This is the signal that the session can be safely closed.

## Session Workflow

1. Read this file for orientation
2. **Check `.planning/HANDOVER.md` for pending actions from Cowork sessions** — act on any open items before starting new work
3. Read Obsidian `Index.md` via MCP, follow links to the relevant system
4. Check `.planning/BACKLOG.md` for backlog and `.planning/ROADMAP.md` for active milestone
5. Read relevant design doc in `Docs/plans/` before writing code
6. After completing work, follow the **Definition of Done** above

## Domain Skills

Context for specific problem types lives in on-demand skills. **Always load `state-of-game-design` first** — it provides the foundational cosmology, action system, and architectural context that all other skills depend on.

| Domain | Skill | When to load |
|--------|-------|-------------|
| **Foundational (load first)** | `state-of-game-design` | Always — before any other domain skill. Cosmology, reaches, spheres, action verbs, prerequisites, architectural decisions. |
| Engine & code architecture | `engine-architecture` | Writing engine modules, tick loop work, tracing, resolution, PRNG |
| Frontend & UI | `frontend-ui` | Building components, styling, accessibility, layout at 1920–3440px. Loads `Docs/design-system/` |
| Content systems & worldbuilding | `content-worldbuilding` | Content packages, graph data, constraint layers, world-model.json |
| Art direction & visual style | `art-direction` | Hex tiles, prompt construction, STYLE.md, Threadbare aesthetic |
| Creative prose & content | `cw-*` (platform) | `cw-brainstorming` for ideas, `cw-prose-writing` for drafts, `cw-official-docs` for wiki, `cw-story-critique` for review |
| Post-implementation docs | `gamedocumenter` | Notion/Obsidian/changelog updates after completing work |
| Image manipulation | `image-manipulation` | Geometric clipping, alpha masks, hex tile pipeline |
| QA sweeps | `qa-orchestrator` | Systematic UI/UX/frontend QA |
| **Impediment reporting (always active)** | `impediment-reporter` | **Every session, every agent.** Log blockers and workarounds to `Docs/impediments.md` as they occur. Part of Definition of Done. |
| Continuous improvement | `retrospective` | Review impediment log, analyze patterns, implement quick-fix improvements, backlog larger ones. Run with `/retrospective`. |

## Continuous Improvement

Two skills form a feedback loop:

1. **`impediment-reporter`** — Every agent logs friction as it happens → `Docs/impediments.md`
2. **`retrospective`** — Periodically analyze the log, implement quick wins, backlog bigger fixes → `Docs/retrospectives/`

Repetitive workflows → propose a skill. Use `skill-creator` to build and eval new skills.

## Project Status

Current focus: **`Docs/project-status.md`** · Completed milestones: **`Docs/project-history.md`**

- Current phase: **Hex Map V2** (Phase 3 of 8) — see `.planning/ROADMAP.md` for phase details, `.planning/BACKLOG.md` for future work
- Engine: ~323 modules, ~70,600+ lines, ~5,111+ tests across 351+ test files
- Content: 244 graph nodes, 371 typed edges, 18 categories, 19 content packages, 975+ data tests
