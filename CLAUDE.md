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

**Note for Cowork/Claude sessions:** The sandbox VM has isolated networking. Use `npx tsc --noEmit`, `npx vite build`, and `npm test` to verify. The user must run `npm run dev` on their own machine.

## Documentation Strategy

Four surfaces, each with a distinct purpose. Full ownership rules and duplication policy: **`Docs/documentation-ownership.md`**

| Surface | Owns |
|---------|------|
| **Obsidian vault** | Domain model: systems, mechanics, terminology (wikilinks). Read `Index.md` first. |
| **Notion** | Sprint tasks, phase status, backlog, audit follow-ups |
| **Repo `Docs/`** | Implementation rationale (`plans/`), changelog, UI patterns, this ownership map |
| **Paper** | Visual documentation: component anatomy, style, asset registry, player journey maps |

## Key Links

- Notion backlog: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf
- Obsidian vault index: read via Obsidian MCP → `TheFantasyWorldSimulator/Index.md`
- Documentation ownership: `Docs/documentation-ownership.md`
- Visual style guide: `STYLE.md`
- Visual style tile: `Design/style-tile.html`
- UI patterns: `Docs/ui-patterns.md`
- Consolidated discovery design: `Docs/plans/2026-03-04-high-level-discovery-pass.md`

## Non-Functional Priorities (in order)

When in tension, higher priorities win.

1. **Tunability** — Every magic number is a named constant. Changing game feel = changing a number, not rewriting logic.
2. **Inspectability** — Trace *why* something happened. Flat state, pure functions, causal event trails.
3. **Determinism** — Seeded PRNG everywhere. Same seed + same inputs = same outputs.
4. **Fail-soft** — The tick loop must never crash. Missing data → graceful fallback, never thrown exceptions.
5. **Narrative over mechanical perfection** — When mechanics and story diverge, lean toward the story.
6. **Additive over destructive changes** — Add new fields/functions; only refactor when old shape blocks progress.
7. **Performance budget, not premature optimization** — Profile before optimizing. Lean on the spotlight tier system.

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




## Rejected Approaches (do not reintroduce)

- ❌ Classical stats (STR/DEX/INT) — replaced by Domain Capability across Nine Reaches
- ❌ Fixed rival pantheon — replaced by generated rivals from World-Soul
- ❌ Old 5-force cosmology — replaced by Foundation + Creation Sphere model
- ❌ Pure template-based prose — replaced by hybrid layered engine
- ❌ Pure LLM-generated content — replaced by generated-within-constraints with player iteration

## Change Audit Trail

When modifying Notion pages or Obsidian vault notes:

- **In the document:** Dated inline note near the change (date, what, why — one line).
- **In the changelog:** Append to `Docs/changelog.md` (format: `| date | where | what changed | why |`).

## Definition of Done

When implementation is complete and tests pass, **do all of these automatically — do not ask which option the user wants:**

1. **Commit** all changes
2. **Push** to GitHub (`git push`, with `-u origin <branch>` if needed)
3. **Merge** feature branches into main immediately — don't leave branches waiting
4. **Deploy** to Vercel production
5. **Document** — use the `gamedocumenter` skill for Notion/Obsidian/changelog/project-status updates

This is non-negotiable. Work is not "done" until it is deployed and documented. Do not present options, do not ask for confirmation on these steps, do not stop at "ready to push?" — just do it.

6. **Close out** — When all steps above are complete, explicitly tell the user: *"Session ready to archive — all work is tested, deployed, and documented. No loose ends."* This is the signal that the session can be safely closed.

## Session Workflow

1. Read this file for orientation
2. Read Obsidian `Index.md` via MCP, follow links to the relevant system
3. Check Notion backlog for current phase and next tasks
4. Read relevant design doc in `Docs/plans/` before writing code
5. After completing work, follow the **Definition of Done** above

## Domain Skills

Context for specific problem types lives in on-demand skills, not in this file. Load the relevant skill before starting domain-specific work.

| Domain | Skill | When to load |
|--------|-------|-------------|
| Engine & code architecture | `engine-architecture` | Writing engine modules, tick loop work, tracing, resolution, PRNG |
| Frontend & UI | `frontend-ui` | Building components, styling, accessibility, layout at 1920–3440px. Loads `Docs/design-system/` |
| Content systems & worldbuilding | `content-worldbuilding` | Cosmology, spheres, reaches, content packages, graph data |
| Art direction & visual style | `art-direction` | Hex tiles, prompt construction, STYLE.md, Threadbare aesthetic |
| Creative prose | `prose-resolver` (platform) | Writing prose content, implementing resolvers |
| Attachment content | `content-authoring` (project) | Creating items, conditions, spells, powers, agreements, retainers |
| Post-implementation docs | `gamedocumenter` | Notion/Obsidian/changelog updates after completing work |
| Image manipulation | `image-manipulation` | Geometric clipping, alpha masks, hex tile pipeline |
| QA sweeps | `qa-orchestrator` | Systematic UI/UX/frontend QA |

## Continuous Improvement

Repetitive workflows → propose a skill. Use `skill-creator` to build and eval new skills.

## Project Status

Current focus: **`Docs/project-status.md`** · Completed milestones: **`Docs/project-history.md`**

- Current phase: **Attachment System complete** — check Notion backlog for next priority
- Engine: ~214 modules, ~49,200+ lines, ~2,680+ tests across 239+ test files
- Content: 244 graph nodes, 371 typed edges, 18 categories, 19 content packages, 975+ data tests
