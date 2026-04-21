This folder contains The Fantasy World Simulator — a systemic god-game/rogue-lite narrative simulation built in React + TypeScript + Vite.

[![CI](https://github.com/christianspliid-ui/threadbare/actions/workflows/ci.yml/badge.svg)](https://github.com/christianspliid-ui/threadbare/actions/workflows/ci.yml)

## Cowork vs Claude Code — Read This First

**Three agents, two executor queues.** Cowork designs and plans. **Claude Code** and **Codex** are executor agents — both implement, both commit with `Fixes THR-XX`, both rely on the merge-to-main auto-close. They pull from separate Linear states so neither ever claims the other's work. Cowork picks which queue an issue lands in based on fit: mechanical / pattern-following work goes to **Ready for Codex**; judgment-heavy / prose / novel-system work goes to **Ready for Dev** (CC's queue). See "Choosing the executor" in `Docs/plans/2026-04-13-linear-coordination-protocol.md`.

**If you are running in Cowork mode:** You must NOT write code or run git commands. Your job is design, research, documentation (via MCP), and implementation plans. Use **Linear** (Threadbare team) for all issue tracking — query and update issue states via the Linear MCP. When a design is complete, move the issue to **Ready for Dev** (CC handoff) or **Ready for Codex** (Codex handoff) based on the work's fit, and add the corresponding handoff comment with the plan doc link and action items. **Every handoff must include a coordination block** — CC handoffs need `Suggested model` (with matching `model:haiku` / `model:sonnet` / `model:opus` label), `Parallel-safe with`, and `Mutex with` lines; Codex handoffs need `Parallel-safe with`, `Mutex with`, a `Files to touch` block, and a `Done when` checklist (no `Suggested model` — Codex's model is configured at the automation level). See the handoff templates in `Docs/plans/2026-04-13-linear-coordination-protocol.md`. **The state transition plus the handoff comment is the handoff.** Both executors poll Linear on an hourly cycle and pick up the top item from their respective queue; no Slack message, no out-of-band notification, nothing else required.

**If you are running in Claude Code:** Start pickup with `/pull-work` (see `.claude/skills/pull-work/SKILL.md`) as the canonical entrypoint, then follow the fallback prose protocol below if needed. You do the coding, testing, committing, and pushing for judgment-heavy work. Check **Linear** for issues in **"Ready for Dev"** state with `assignee:null` — the filter is required; it excludes issues another agent has already claimed. **Never query Ready for Codex** — that queue belongs to Codex. Expanding the filter across queues defeats the separation the two-queue design exists to provide. Sort by priority in memory (the API rejects `orderBy:priority` at runtime, impediment #49) and **pull from the top.** **Claim before you read:** first tool call after selecting an issue is `save_issue(id, assignee: "me", state: "In Dev")`, then `get_issue(id)` to confirm the write stuck (Linear can silently drop state writes — impediment #48). Only after the claim is verified do you read the plan doc. **Read the latest comment first** — it supersedes the original handoff when an issue has been reopened. **Issues with the `Reopened` label** require reading all comments back to the original handoff before acting. **Never `save_issue(state: "Done")` from CC** — commit with `Fixes THR-XX` in the body and let the merge-to-main auto-close fire. Manual Done transitions have caused premature closes of reopened issues and bypass the merge-gated invariant that Done means shipped. **Use the model suggested by the `model:*` label** (or the `Suggested model` line in the handover) unless you have a specific reason to override. **WIP limit: 1 In Dev issue at a time per executor**, across all sessions and worktrees — parallel work happens on *different* issues, never the same one. **Cross-executor parallel:** if Codex has an In Dev issue, verify your candidate appears in Codex's `Parallel-safe with` and does not collide with its `Mutex with` before claiming. Check `Docs/plans/` for design docs before starting work. See `Docs/plans/2026-04-13-linear-coordination-protocol.md` for the full protocol — the "Coordination Failure Modes — Hard Rules" section (Rules 1–8) explains why each of these is non-negotiable.

**If you are running in Codex:** Same discipline as CC — claim-before-read, verify-after-write, WIP=1, never `save_issue(state: "Done")`. Query **"Ready for Codex"** with `assignee:null`, never Ready for Dev. Commit with `Fixes THR-XX` in the body; the merge auto-close handles the state transition. See the "Codex Session Start", "Codex Pickup Protocol", and "Codex Closeout" sections in `Docs/plans/2026-04-13-linear-coordination-protocol.md`.

**The codex *reviewer* is read-only** (distinct from Codex-the-executor above). CC must never invoke codex slash-commands that modify code (e.g. `/codex:rescue`). The `/codex:*` review integration is a review tool only — review produces findings, CC, Cowork, or Codex-the-executor act on them. If a review stalls or produces ambiguous output, exit via `/codex:cancel` and bounce to Cowork with the partial findings, never `/codex:rescue`. See Rule 8 in the coordination protocol for the full doctrine — the disambiguation note clarifies that this rule governs the `/codex:*` reviewer, not Codex-the-executor pulling from Ready for Codex. **The replacement review surface** (heartbeat wrapper + PR-gated GitHub Action) is documented in `Docs/plans/2026-04-19-cc-review-replacement.md`; run in-session via `npm run review:run` or invoked automatically by `.github/workflows/claude-review.yml` on PRs.

### Prioritization: Finish Before You Start

**Deferrals and completions before new development.** When choosing what to work on, apply this priority order:

1. **Deferrals from in-progress projects** — issues labeled `Deferral` that belong to a project with active work. Finish what you started before moving on. Query: `list_issues label:"Deferral" state:"Ready for Dev"`.
2. **Remaining issues in active projects** — if a project has issues in Ready for Dev, complete them before pulling issues from a different project.
3. **New work by priority** — only start a fresh project's issues when active projects have no remaining Implementation Planning items.

This ensures projects get completed rather than accumulating half-finished work across many fronts. Check `list_projects` to see which projects have open issues.

**Every Linear issue must belong to a project.** No orphan issues — if work doesn't fit an existing project, ask the user which project it belongs to or whether a new project is needed. Deferrals inherit the project of the parent issue they were deferred from.

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
| `npm run rebuild-index` | Rebuild Obsidian vault Index.md from all vault pages |
| `npm run cli` | Interactive REPL for headless game testing (see below) |

**Dev Quick-Start URLs** (append to `http://localhost:5173`):

| URL Param | What it does |
|-----------|-------------|
| `?view=game&seeded` | **Primary dev view.** Full game with pre-seeded ascendant identity (Witness/mind+spirit) AND The First agent ("Kael Thornweaver") already bonded. Use this for all testing that needs a valid game state with threads. **Uses a `large` map** (hunger.witness → 48×36 hexes, ~1010 agents by tick 72) — see note below. |
| `?view=game&seeded&size=medium` | Same as above but forces **medium** map (32×24 hexes, ~414 agents). **Use this if the browser stalls** — `large` map causes a tick-loop performance issue (THR-162/163/164/165). |
| `?view=game` | Quick-start game view — ascendant archetype only, no identity, no First. Use when testing the MeetTheFirst flow itself or identity-less paths. |
| `?view=glow` | Magic glow tile preview |
| `?view=codex` | Game codex — browsable catalog of divine actions, possessions, conditions, agreements, mortal actions |
| `?view=styleguide` | **Visual component reference.** All shared primitives with sample data — see what components look like before building UI. |
| `?view=cms` | Content browser |
| `?nofog` | Disable fog of war (fog is ON by default). Combinable: `?view=game&seeded&nofog` |

**For all testing, use `?view=game&seeded`** — this skips the remembrance flow, ascendant selection, AND the Meet The First encounter, loading directly into a fully populated game with a bonded First agent. Only use bare `?view=game` when testing identity-less paths, and only test the worldgen/selection/remembrance screens when those screens are the subject of the test.

**`?seeded` ≠ `--seed 42` (intentional divergence):** The `?seeded` URL uses the `DEV_ASCENDANT_IDENTITY` (hunger.witness, large map, derived cosmology). The CLI `--seed 42` uses a balanced cosmology and medium map. They generate different worlds with the same numeric seed. For roughly equivalent worlds: use `?view=game&seeded&size=medium` in browser vs `npm run cli -- --seed 42 --map medium`. For large-map CLI testing: `npm run cli -- --seed 42 --map large` (still differs in cosmology).

**Note for Cowork/Claude sessions:** The sandbox VM has isolated networking. Use `npx tsc --noEmit`, `npx vite build`, and `npm test` to verify. The user must run `npm run dev` on their own machine.

### Headless CLI (`npm run cli`)

An interactive REPL for testing the game engine without a browser. **Use this for verifying engine behavior after changes** — it runs the real `initializeGameState` → `runTick` pipeline headlessly.

```bash
npm run cli                          # default seed 42, medium map
npm run cli -- --seed 99 --map small # custom seed + map size
```

Key commands at the `fws>` prompt: `tick [N]` (advance ticks), `run [N]` (auto-run at N ticks/sec), `pause`, `status` (game overview), `agents`, `agent <name>` (inspect one), `events [N]`, `doom`, `mandate`, `essence`, `encounters [agent]`, `spawn encounter <agent|@hero> <encounterId> [--courtPosition X]`, `spawn encounter-context <encounterId> [--agent <agent|@hero>] [--at <location|actor>] [--hex <col> <row>]`, `spawn attachment <agent|@hero> <templateId|name> [--tick N]`, `spawn location <subtype> --hex <col> <row> [--name "..."]`, `spawn sublocation <typeId> (--at <location|actor|@hero> | --hex <col> <row>)`, `spawn npc <role> (--at <location|actor|@hero> | --hex <col> <row>) [--name "..."] [--faction <factionDefId>]`, `move agent <agent|@hero> (--to <location|actor> | --hex <col> <row>)`, `factions`, `traces [N]`, `graph` (node counts), `fog` (toggle fog of war on/off), `fog on`, `fog off`, `eval <expr>` (JS with `state` in scope). Type `help` for the full list.

**When to use the CLI:**
- After modifying tick phases or orchestrator logic — run `tick 30` and check `status` + `events`
- After changing agent decision/movement — inspect with `agents` and `agent <name>`
- For pipeline throughput checks (NFP #7 in Pre-Commit Checklist) — `run 5` for 30+ ticks, then `encounters`, `factions`, `traces`
- Quick smoke test after engine changes when you can't run the browser

### Debug Bridge (`window.__DEBUG`)

Dev-only API exposed on `window.__DEBUG` (tree-shaken in prod). Use from `preview_eval`, `javascript_tool`, or browser console.

```javascript
// Debug panel control (opens panel + enables tracing automatically):
// Keyboard shortcuts in-game:
// - `F1` opens the Debug Panel directly to the CLI tab
// - backtick (`) toggles the Debug Panel normally
// The in-game CLI also supports pasted multi-line batches (one command per line).
window.__DEBUG.openDebugPanel()
window.__DEBUG.closeDebugPanel()
window.__DEBUG.toggleDebugPanel()

// Direct trace access:
await window.__DEBUG.enableTracing()
const traces = await window.__DEBUG.getTraces()
await window.__DEBUG.clearTraces()

// Health & diagnostics:
await window.__DEBUG.getHealthReport()
await window.__DEBUG.exportDiagnostics()
await window.__DEBUG.getCrashLog()

// Navigate to an agent — zoom camera to their hex and open their detail panel:
window.__DEBUG.gotoAgent('agent-id')        // exact id
window.__DEBUG.gotoAgent('abc123')          // partial id prefix
window.__DEBUG.gotoAgent('Serafina')        // partial name match (case-insensitive)
// Returns true if found, false if no match

// List action templates that can be fired on agents:
window.__DEBUG.listActions()               // all actor-targeting templates → [{id, name, sphere, reach, essenceCost, steps, scale}]
window.__DEBUG.listActions('Serafina')     // same list, but returns [] if agent not found (existence check)

// Fire an action on an agent immediately (bypasses UI animations, deducts essence):
window.__DEBUG.fireAction('Serafina', 'action.charm.heart')   // exact template id
window.__DEBUG.fireAction('abc123', 'charm')                   // partial template id/name match
// Returns {success, actionId, templateName, message}

// Fog of war control:
window.__DEBUG.toggleFog()                // toggle fog on/off, returns new enabled state
window.__DEBUG.setFog(true)               // explicitly enable fog
window.__DEBUG.setFog(false)              // explicitly disable fog

// Encounter log export (returns TSV strings):
const summary = await window.__DEBUG.getEncounterLogAll()   // { trackedAgentCount, totalEvents, agentIds }
const logs = await window.__DEBUG.exportEncounterLogAll()    // { allAgentsTsv, perAgent: [{ tsv, filename }] }
```

See `src/debug-bridge.ts` for the full API and `src/debug-bridge.d.ts` for types.

## Documentation Strategy

Three surfaces, each with a distinct purpose. Full ownership rules and duplication policy: **`Docs/documentation-ownership.md`**

- **Obsidian vault** — Domain model: systems, mechanics, terminology (wikilinks). Read `Index.md` first.
- **Repo `.planning/`** — Legacy milestone roadmap, phase history (backlog and handover retired — use Linear)
- **Repo `Docs/`** — Implementation rationale (`plans/`), changelog, UI patterns, project status

*Notion content migrated to Obsidian 2026-04-04. Dilemma templates remain in Notion pending TypeScript import.*

### Obsidian Vault as LLM Knowledge Base

The vault follows the Karpathy LLM Knowledge Base pattern — a persistent, compounding artifact where the LLM maintains the wiki and humans provide direction and raw sources.

**Three layers:**
- **`raw/`** — Immutable source materials (design docs, research, web clips). LLM reads but never modifies.
- **Wiki** (Systems/, Cosmology/, etc.) — LLM-compiled and maintained pages. The LLM owns this content.
- **`output/`** — Generated reports, query results, audit outputs filed back into the vault.

**Infrastructure files:**
- **`Index.md`** — Comprehensive catalog of ALL vault pages with one-line summaries. LLM-maintained. Read this first to navigate.
- **`log.md`** — Append-only chronological record of ingests, queries, lints, and updates.

**Core workflows** (via skills):
| Workflow | Skill | What it does |
|----------|-------|-------------|
| Ingest | `vault-ingest` | Compile raw sources into wiki pages, update index, log |
| Query | `vault-query` | Ask questions against the vault (3 depth tiers) |
| Lint | `vault-lint` | Audit vault health: orphans, broken links, stale content |
| Enrich | `vault-enrich` | Improve pages: add cross-refs, expand content, fix issues |

**Vault maintenance scripts:**
| Script | What it does |
|--------|-------------|
| `npm run generate-vault` | Regenerate graph-node pages from world-model.json (does NOT touch Index.md or Systems/) |
| `npm run rebuild-index` | One-time rebuild of Index.md from all vault files |
| `npm run enhance-frontmatter` | One-time bulk update of frontmatter on hand-curated files |

**Frontmatter conventions:**
```yaml
# Auto-generated files (from world-model.json):
tags: [<category>, generated]
aliases: [<node name>]
id: <node-id>
category: <category>
status: complete
last-generated: YYYY-MM-DD

# Hand-curated files (Systems/, Brainstorms/, etc.):
tags: [<category>, <subcategory>]
aliases: [<alternative names>]
status: stub | draft | complete | deprecated
created: YYYY-MM-DD
updated: YYYY-MM-DD
```

## Key Links

- **Backlog & issue tracking: [Linear (Threadbare team)](https://linear.app/threadbare)** — single source of truth for all issues, states, and dependencies
- Linear coordination protocol: `Docs/plans/2026-04-13-linear-coordination-protocol.md`
- **Roadmap milestones: [Linear Projects](https://linear.app/threadbare/projects)** — 8 projects (Linear Setup, UI/UX Design Infrastructure, Procedural Hex Vignettes, Content Architecture, Attention Tier Model, Thematic Pressure, Social Systems Expansion, Rarity Model) with lifecycle statuses (Idea → Next → Research → Discovery → Now → Done)
- Legacy milestone roadmap: `.planning/ROADMAP.md` (still maintained for high-level overview)
- Completed items archive: `.planning/BACKLOG_HISTORY.md` (pre-Linear history)
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

> **CI runs these automatically.** GitHub Actions runs tests, typecheck, and build on every push and PR to `main`. Vercel runs only `vite build` (no test gate). Branch protection (required before merge) is pending GitHub Pro — until then CI is a signal, not a hard gate. Still run locally before pushing to catch failures early. The structural review Action (`.github/workflows/claude-review.yml`) runs on every PR in advisory mode; it flips to blocking once GitHub Pro + branch protection lands (tracked: THR-183). See `Docs/plans/2026-04-19-cc-review-replacement.md`.

## Known Sandbox Limitations

The Cowork/Codex agent sandboxes have several quirks that recur often enough that agents waste time rediscovering them. **Read this before debugging environment failures.** (Carried from 2026-04-11 retro; first-class entry per 2026-04-18 retro.)

- **`rg.exe` (ripgrep) is blocked in the Codex sandbox** with `Access is denied` even on standard repo paths. Cowork's `Grep` tool works fine — it does not call `rg.exe` directly. **Workaround for Codex shell:** use PowerShell `Get-ChildItem -Recurse -Filter <pattern> | Select-String <regex>` instead of `rg`. Repeated occurrences: impediments #15, #28, #33, #37 (≈19 hits).
- **PowerShell variable scoping leaks across blocks.** Variables assigned inside `foreach`/`if` blocks remain visible at the surrounding scope, which can mask bugs in throwaway scripts. **Workaround:** prefer small checked `.ps1` files over inline one-liners when logic is non-trivial; for complex regex with mixed quoting (impediment #44), write to a script file rather than escaping inline.
- **`git add` and `git push` are blocked in Cowork.** Cowork's role per CLAUDE.md is design/docs/Linear only — it cannot commit or push. **Workaround:** stage handoff via Linear by moving the issue to "Ready for Dev" with the coordination-block handoff comment; Claude Code polls Linear hourly and performs the actual git operations. Repeated occurrences: impediments #23, #24.
- **`npm test` may time out at sandbox-default limits** on the full suite. **Workaround:** run scoped subsets via `npx vitest run <path>` for fast feedback; full-suite runs should be kicked off with explicit longer timeouts. The "test suite is red on main" baseline (impediment #22, recurring as #30, #31, #32, #34, #38, #39, #54) is a separate, real engineering problem — see TB-120.
- **`esbuild` / `npm install` may fail with `spawn EPERM`** in restricted sandboxes (impediment #21). **Workaround:** retry once, then fall back to running the failing step on the user's machine; do not loop indefinitely.
- **PDF and `yt-dlp` extraction tools are absent** from the Cowork environment (impediments #16, #18). **Workaround:** use `WebFetch` against the canonical URL, or ask the user to extract locally.
- **`web.open` ref IDs from earlier in a session can expire** mid-conversation (impediment #17). **Workaround:** reopen the page from its canonical URL rather than chaining from a stored ref.
- **Linear `save_issue` returns 200 but does not always update state** (impediment #48). **Workaround:** always verify-after-write by re-querying the issue; do not trust the success response alone.
- **Linear `list_issues orderBy: 'priority'` is rejected at runtime** even though the schema accepts it (impediment #49). **Workaround:** omit `orderBy` (or use `createdAt` / `updatedAt`) and sort by priority in memory.

If you discover a new sandbox limitation, log it via `impediment-reporter` and add it here in the next retro.

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

### Three-Pillar Rule

Every feature touches three pillars: **Engine** (systems, tick loop, graph), **Content** (encounters, prose, templates, data), and **UI** (components, modals, HexMap, player controls). Designs and plans that cover only one or two pillars produce incomplete features that CC rightfully defers. **Do not move an issue forward unless all three pillars are addressed or explicitly marked N/A with rationale.** See exit criteria in `Docs/plans/2026-04-13-linear-coordination-protocol.md`.

### Design workflow checklist

- [ ] **Draft** the system design — covering all three pillars (Engine, Content, UI)
- [ ] **Draft the Brainstorm companion** alongside the plan — same pass, not retrofit. Capture considered alternatives, tensions surfaced, Vision premises invoked.
- [ ] **Audit** against all 7 NFPs, load-bearing decisions, and rejected approaches
- [ ] **Revise** — integrate remediations inline (not in a separate appendix)
- [ ] **Summarize** — NFP Compliance table at the end (PASS / PASS with note per priority)
- [ ] **Three-pillar check** — Engine section present? Content section present? UI section present? Wiring section connecting them?
- [ ] **Vision audit** — does this plan contradict or update any Vision premise? If so, the Vision edit is part of this ticket's scope, not a follow-up.
- [ ] **Present** the finished, compliant design to the user

### Per-system required sections (inline, not appendix)

- [ ] **Engine pillar** — systems design, graph nodes/edges, tick phases, resolution logic, PRNG callouts
- [ ] **Content pillar** — encounter templates, prose tables, attachment content, data tables
- [ ] **UI pillar** — player-facing display, event notifications (alerts/toasts/chronicle), debug inspection (DebugPanel), visual presence (HexMapV2 signifiers/overlays). No UI pillar = incomplete design.
- [ ] **Wiring section** — for each module: orchestrator phase, UI component, GameState flow, traces, debug visibility, prose pipeline (`enrichProse()`?), player controls. Reference `Docs/plans/wiring-checklist.md`. Module only in test files = not integrated.
- [ ] **Constants table** — every tunable number named, with default and purpose (NFP #1)
- [ ] **Tracing** — trace types emitted, with TypeScript interface definitions (NFP #2)
- [ ] **Fail-soft table** — failure cases and fallback behavior (NFP #4)

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
- **Agent position is a three-tier model: hex → location → sublocation.** An agent is always on exactly one tier via a single `located_at` edge pointing to the most specific node they occupy. The tiers nest: sublocation sits inside a location, location sits on a hex. Resolution upward: sublocation → `parentLocationId` → parent location → `hexCol`/`hexRow` → hex. All systems that need spatial reasoning must resolve to the hex level.
- **Encounter awareness is hex-granular.** If an agent can see a hex, they can see everything on it — every location, every sublocation, every encounter. Within-hex visibility is automatic (distance 0). Cross-hex visibility is computed as hex coordinate distance vs. per-reach awareness hops. The distance matrix between locations is NOT used for encounter awareness — use hex distance (`encounterAwareness.ts`). This means an agent at a sublocation sees all encounters across all locations and sublocations on their hex, plus encounters on hexes within their awareness range.
- **The world graph is mutated in place — never depend on graph object identity for change detection.** `WorldGraph` methods and direct `node.properties` writes modify internal state without changing the object reference. Any `useMemo`, selector, or cache that keys on `gameState.graph` identity will silently serve stale data. Use explicit version counters (`worldVersion` for UI selectors, `structuralCacheVersion` for structural caches such as the distance matrix and encounter cache) via exported `touchWorld()` / `touchStructure()` calls. Property mutations like `locationSubtype` changes in settlement promotion affect encounter scoring via the fallback in `getLocationType()` — versioning only works if every meaningful mutation participates, including property edits. Both tick phases and UI hooks (e.g. `useAgentInteraction`) must use the same touch API. `worldVersion` will bump nearly every tick during active simulation — that's intentional; memos gate paused/idle states, not per-tick skipping. `structuralCacheVersion` intentionally over-invalidates for v1 (a subtype change triggers distance matrix rebuild even though only encounter scoring changed); split into finer-grained versions only if profiling shows unnecessary rebuilds are costly.
- **Engine caches must be owned per session, not stored at module scope.** Module-level singletons (encounter cache, distance matrix, etc.) persist across game sessions if the page isn't fully reloaded. A lightweight `SimulationRuntime` owned by `useSimulation` should hold caches, version counters, and lazy rebuild logic, scoped to the current playthrough.
- **The distance matrix caps indexed locations at `MAX_DISTANCE_MATRIX_SIZE`.** Raised to 1200 in TB-088 — now covers all supported presets (`large` ~584, `epic` ~805). If location count ever exceeds 1200, systems that depend on distance matrix lookups must handle unlisted locations — a `console.warn` fires when the cap is reached.

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
- ❌ Location-hop awareness (distance matrix BFS between location nodes via `adjacent` edges) — replaced by hex-distance awareness. Location hops were inconsistent (sublocations invisible, same-hex vs cross-hex ambiguous, irregular graph topology). Hex distance is geometric, predictable, and sublocation-agnostic.

## Change Audit Trail

When modifying Obsidian vault notes:

- **In the document:** Dated inline note near the change (date, what, why — one line).
- **In the changelog:** Append to `Docs/changelog.md` (format: `| date | where | what changed | why |`).
- **In the vault log:** Append to `log.md` via Obsidian MCP (format: `- **<type>** | <description>`).

## Debugging Protocol: Verify the Noun Before the Verb

When debugging "system X doesn't produce output for entity Y":

1. **Verify entity identity first.** Inspect the actual `actorId`, `templateId`, `locationId`, or `actionId` in state before modifying the producing system. Use the CLI (`eval state.unifiedActions[...]`) or debug bridge to confirm the entity is what you think it is.
2. **Check alias resolution.** If you used `@hero`, a partial name, or any fuzzy match, confirm what it resolved to. Debug spawn commands now print resolution notes — read them.
3. **Only then trace the system.** Once you've confirmed the input data is correct, trace why the system didn't process it.

This protocol exists because: a bug where `@hero` resolved to the wrong actor was misdiagnosed as a visibility system bug, resulting in two correct-but-non-causal fixes before the real cause (identity mismatch) was found. The wasted work was avoidable with a single `eval` command.

## Definition of Done

Work is not "done" until it is deployed and documented. Do all of these automatically — do not ask, do not stop at "ready to push?", just do it.

- [ ] **Commit** all changes — the closing commit's message body **must** include `Fixes THR-XX` (or `Closes THR-XX` / `Resolves THR-XX`). This triggers the Linear auto-close workflow on push to `main`. Example: `docs: update project-status for THR-8\n\nFixes THR-8`
- [ ] **Push** to GitHub (`git push`, with `-u origin <branch>` if needed)
- [ ] **Merge** feature branches into main immediately — don't leave branches waiting
- [ ] **Deploy** — Vercel auto-deploys from GitHub on push to `main`. Just ensure the push succeeded.
- [ ] **Update docs** — `project-status.md` (≤60 lines, move old entries to `project-history.md`), `project-history.md` (one-line `✅` entry), `changelog.md` (append rows). Add a completion comment to the Linear issue (the `Fixes THR-XX` keyword in the commit auto-closes it, but a human-readable comment is still expected).
- [ ] **Verify wiring** — Check every new module against `Docs/plans/wiring-checklist.md`. Engine modules called from orchestrator, modals rendered in GameView JSX, GameState fields consumed by UI, traces emitted, player controls connected. Update the checklist if new surfaces added.
- [ ] **Update systemic wiring guide** — If your change adds or modifies a content-facing engine capability (new effect type, new graph operation, new enrichment placeholder, new aftermath reaction kind, new template field, new scoring signal), update `Docs/plans/2026-04-16-systemic-wiring-guide.md`. This guide is the IKEA manual for content authors — if a capability isn't documented there, content agents won't use it and the game gets hardcoded prose instead of systemically alive content.
- [ ] **Log deferrals** — Every `// TODO`, `// DEFERRED`, or `// PHASE-X-DEFERRED` comment added in this session MUST have a corresponding Linear issue. Use format `// TODO(THR-XX): description`. No orphan deferrals — if you deferred it, track it. Label the issue `Deferral` and assign it to the same project as the parent work. A deferral without a Linear issue is invisible tech debt.
- [ ] **Log impediments** — Any blockers or workarounds → `Docs/impediments.md`. Load `impediment-reporter` skill for format. Mandatory — unlogged friction is invisible.
- [ ] **Close out** — Confirm the Linear issue is in the correct terminal state: Cowork hands off by moving to "Ready for Dev" with the coordination-block handoff comment posted and the plan doc committed; Claude Code lands the work with `Fixes THR-XX` in the merge commit and lets the auto-close fire. The Linear state transition IS the closeout — no Slack, no DM, nothing out of band. Claude Code polls Linear on an hourly cycle and picks up the top Ready-for-Dev item.

**Where to find completed work history:** Linear issues in "Done" state (current), `.planning/BACKLOG_HISTORY.md` (pre-Linear history), and `Docs/project-history.md` (one-line entries).

## Session Workflow

- [ ] Read this file for orientation
- [ ] **Check Linear for work** — query issues by state per the protocol in `Docs/plans/2026-04-13-linear-coordination-protocol.md`:
  - **Cowork:** `list_issues state:"In Design"` (resume design), `list_issues state:"Implementation Planning"` (resume planning), `list_issues state:"Ready for Dev"` and `list_issues state:"Ready for Codex"` (verify both executor queues), `list_issues state:"Todo"` (what's next)
  - **Claude Code:** `list_issues state:"Ready for Dev" assignee:null` (pick up handoffs — CC queue only, never Ready for Codex), `list_issues state:"In Dev" assignee:"me"` (resume active work)
  - **Codex:** `list_issues state:"Ready for Codex" assignee:null` (pick up handoffs — Codex queue only, never Ready for Dev), `list_issues state:"In Dev" assignee:"me"` (resume active work)
- [ ] Read Obsidian `Index.md` via MCP → follow links to the relevant system. Index.md is the comprehensive catalog — use it as the LLM's navigation system.
- [ ] **For design work**, read `Vision/` via Obsidian MCP before drafting plans.
- [ ] **Check Linear Projects for milestone context** — `list_projects` to see which milestones are in Now/Discovery/Research. Issues belong to projects; projects show the big picture.
- [ ] Check `.planning/ROADMAP.md` for legacy milestone overview
- [ ] Read relevant design doc in `Docs/plans/` before writing code
- [ ] **Upstream health check** — if the feature depends on upstream pipeline throughput, verify the pipeline is producing output before coding. A feature wired to a dead pipeline is wasted work.
- [ ] After completing work, follow the **Definition of Done** above
- [ ] **Update Linear** — move issue to appropriate state, add completion comment
- [ ] **Update vault log** — Append to `log.md` via Obsidian MCP what was changed in this session

## Skill Tree Layout

The repo has two skill directories; they serve different agents and do NOT have precedence between them — they are audience-separated.

| Directory | Read by | Canonical for |
|-----------|---------|---------------|
| `.claude/skills/` | Claude Code (hardcoded path in the CC binary) | Any skill CC needs to invoke |
| `.agents/skills/` | Non-CC agents: local Cowork (when running via local CLI), Gemini CLI, future agent runtimes. **Invisible to CC.** | Skills CC does not need |

**Shared skills (used by both audiences) exist in both trees.** Drift between copies is enforced by the THR-192 pre-commit hook that checks `.claude/skills/` ↔ `.agents/skills/` for any skill name present in both. `.claude/` is canonical for shared skills — edit there, then mirror `.agents/` by running `npm run check:skill-sync:sync`.

**Skills that only exist in `.agents/skills/`** are Cowork/Gemini-only by design (currently: `content-catalog-manager`, `defuddle`, `json-canvas`, `obsidian-bases`, `obsidian-cli`, `obsidian-markdown`). CC cannot load these — do not route CC to them.

**When adding a new skill:** decide its audience first. CC-needed → `.claude/skills/`. Cowork/Gemini-only → `.agents/skills/`. Both → `.claude/skills/` and let the hook mirror.

## Domain Skills

Context for specific problem types lives in on-demand skills. **Always load `state-of-game-design` first** — it provides the foundational cosmology, action system, and architectural context that all other skills depend on.

**For any prose, narrative, or content work** — first read the **systemic wiring guide** (`Docs/plans/2026-04-16-systemic-wiring-guide.md`), then choose the right prose skill: `prose-pipeline` for resolver architecture, `prose-content-systems` for encounter templates and day-to-day content, `prose-vignettes-and-enrichment` for enrichment placeholders and vignettes. The wiring guide ensures content uses the engine's dynamic capabilities instead of producing hardcoded fiction.

| Domain | Skill | When to load |
|--------|-------|-------------|
| **Foundational (load first)** | `state-of-game-design` | Always — before any other domain skill. Cosmology, reaches, spheres, action verbs, prerequisites, architectural decisions. |
| **Game design direction** | `game-design-direction` | During In Design phase for player-facing features. Loads `Vision/` (north-star, core-loop, non-negotiables, tensions), prompts Brainstorm-companion drafting alongside the plan, runs a Vision audit at plan finalization. Load alongside `state-of-game-design`. |
| **Systemic wiring guide** | `Docs/plans/2026-04-16-systemic-wiring-guide.md` | **Before any content authoring.** The 7 engine capabilities content authors must know: enrichment placeholders, encounter seeding, hidden marks, reputation flow, graph ops, intelligence, divine intervention. Read this before encounter-pipeline, attachment-pipeline, or prose-content-systems. If you don't know what the engine can do, you'll write hardcoded fiction. |
| Engine & code architecture | `engine-architecture` | Writing engine modules, tick loop work, tracing, resolution, PRNG |
| Encounter & actor systems | `encounter-actor-systems` | Analysing, debugging, tuning encounter pipeline, actor capability, resolution, awareness, scoring. Also maintains `encounters-agents-reference.html` and `tick-cycle-reference.html`. |
| Frontend & UI | `frontend-ui` | Building components, styling, accessibility, layout at 1920–3440px. Loads `Docs/design-system/` |
| Prose — resolver architecture | `prose-pipeline` | Implementing new resolvers, modifying the prose pipeline, understanding graph-walking prose generation. Includes Threadbare aesthetic and authoring checklist. |
| Prose — content authoring | `prose-content-systems` | Adding encounter templates, narrative event prose, faction content, spell flavor, content tables. High-volume daily work. |
| Prose — dynamic systems | `prose-vignettes-and-enrichment` | Enrichment placeholders `{name}/{artifact}/{ally}`, vignette authoring, backstory strata, encounter history → prose. |
| Encounter authoring pipeline | `encounter-pipeline` | Automated 4-pass encounter authoring: draft → editorial → systems audit → final merge. Run with `/encounter-pipeline <scale> <premise>`. |
| Attachment authoring pipeline | `attachment-pipeline` | Automated 4-pass attachment authoring: draft composable attachments using primitive vocabulary → editorial → systems audit → final merge. Run with `/attachment-pipeline <category> <premise>`. |
| Content systems & worldbuilding | `content-worldbuilding` | Content packages, graph data, constraint layers, world-model.json |
| Hex map — architecture | `hexmap-core` | Always before any HexMapV2 work. Coordinates, zoom, render layers, camera, Three.js color, performance, lessons learned. |
| Hex map — features | `hexmap-layers` | Building/modifying/testing/debugging signifiers, agents, fog, labels, click handlers, trails. Load alongside `hexmap-core`. |
| Hex map — quick reference | `hexmap-renderer` | Quick reference for settled renderer decisions and patterns. Lighter than `hexmap-core`. |
| Art direction & visual style | `art-direction` | Hex tiles, prompt construction, STYLE.md, Threadbare aesthetic |
| Blender → HexMap pipeline | `blender-to-hexmap` | Building 3D models in Blender MCP and importing GLB into HexMapV2. Palette, merge, bake rotation, export, Three.js wiring. |
| Creative fiction writing | `anthropic-skills:cw-*` *(platform — not in `.claude/skills/`)* | `anthropic-skills:cw-brainstorming` for story ideas, `anthropic-skills:cw-prose-writing` for narrative fiction drafts, `anthropic-skills:cw-official-docs` for lore wikis, `anthropic-skills:cw-story-critique` for review. Use *instead of* prose skills only for pure narrative fiction unrelated to the game engine. |
| Post-implementation docs | `gamedocumenter` | Obsidian/changelog/backlog updates after completing work |
| Vault — ingest sources | `vault-ingest` | Compile raw sources into wiki pages. `/kb-ingest` |
| Vault — query knowledge | `vault-query` | Ask questions against the vault. `/kb-query <question>` |
| Vault — health audit | `vault-lint` | Audit vault for orphans, broken links, stale content. `/kb-lint` |
| Vault — enrich pages | `vault-enrich` | Add cross-refs, expand content, fix issues. `/kb-enrich [page]` |
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

Repetitive workflows → propose a skill. Use `anthropic-skills:skill-creator` to build and eval 


# Codesight — Codebase Intelligence

Codesight is installed as both a **static analysis output** (`.codesight/`) and an **MCP server** (`codesight` in `.mcp.json`). A SessionStart hook regenerates the analysis each session.

**Use codesight actively:**
- Before touching unfamiliar code, check `.codesight/wiki/index.md` for orientation (WHERE things live), then read actual source files.
- Use `.codesight/CODESIGHT.md` for the full context map: components, libraries, config, middleware, dependency graph.
- Use `.codesight/components.md` for the component catalog with props (166 components).
- Use `.codesight/graph.md` for the import dependency graph and high-impact files.
- Use the codesight MCP tools when available for live queries (blast radius, dependency chains).
- To refresh mid-session after significant changes: `npx codesight --wiki`

**High-impact files** (changes here affect many other files):
- `src/engine/graph.ts` (imported by 370 files)
- `src/types/index.ts` (imported by 186 files)
- `src/types/gameState.ts` (imported by 176 files)
- `src/types/traits.ts` (imported by 156 files)
- `src/engine/traceBuffer.ts` (imported by 106 files)

Wiki articles are navigation aids, not implementation guides — always read source files before implementing.

