This folder contains The Fantasy World Simulator — a systemic god-game/rogue-lite narrative simulation built in React + TypeScript + Vite.

[![CI](https://github.com/christianspliid-ui/threadbare/actions/workflows/ci.yml/badge.svg)](https://github.com/christianspliid-ui/threadbare/actions/workflows/ci.yml)

## Session Types: Design vs Execution — Read This First

**One runtime, one executor queue.** All Threadbare agent work runs in **Claude Code**. The design/execution split is a *session type*, not a runtime: a **design session** (`/design-session`) authors plan docs and hands off; an **execution session** (`/pull-work`) implements, commits with `Fixes THR-XX`, and lets the merge-to-main auto-close fire. One queue: **Ready for Dev**. (Codex and the `Ready for Codex` queue were retired 2026-06-23, THR-486; Cowork was retired from the Threadbare workflow 2026-07-21, THR-654.)

This is the reference card. The full protocol — and why each rule is non-negotiable — lives in three authoritative places; read them, don't re-derive from this card:

- **`Docs/canon/process.md`** — session Step 0; the pointer surface for every rule below.
- **`Docs/plans/2026-04-13-linear-coordination-protocol.md`** — canonical detail. The "Coordination Failure Modes — Hard Rules" section (Rules 1–10) explains why each rule exists.
- **`.claude/skills/pull-work/SKILL.md`** — the `/pull-work` pickup flow as an executable checklist.

**In a design session:** Track everything in **Linear** (Threadbare team). Write plan docs into `Docs/plans/` or `Docs/audits/` and commit them directly via a `docs/plan-*` PR — CI-gated, merged immediately. Put the `**Plan doc:** \`Docs/plans/…md\`` path in the issue **description** *and* the handoff comment. Hand off by moving the issue to **Ready for Dev** with a **coordination block** in the handoff comment — `Suggested model` (advisory; the `model:*` label is a work-type signal, not a queue filter — CC always runs Opus), `Parallel-safe with`, `Mutex with`. The Linear state transition *is* the handoff — there is no out-of-band signal. See `.claude/skills/design-session/SKILL.md`.

**Ticket-authoring rules (THR-688)** — three rules bind every ticket you write, full text + motivating examples in the protocol doc § *Ticket-authoring rules*: (A) **predicates, not counts** — a sweep ticket states its membership predicate, never a snapshot count that rots before pickup; (B) **mutex lines carry their reason** — `Mutex with: THR-XXX (both edit <file>)`, and an executor may reverse a mutex only when the stated reason is verifiably inapplicable, recorded in a comment; (C) **Done-whens match the pillar** — browser evidence for UI-pillar surfaces only, engine/content accepted via CLI/headless sweeps. A Done-when may require running N ticks in an automated browser tab **only via `window.__DEBUG.tick(n)`** (THR-689, shipped 2026-07-21): `document.hidden` throttles the interval loop to 1 tick/click, so a Done-when that depends on Play-button ticking is still unreachable by construction.

**In an execution session:** Start with `/pull-work`. Pull the top **Ready for Dev** / `assignee:null` issue (sort by priority in memory — `orderBy:priority` errors, impediment #49). **Claim before you read:** `save_issue(id, assignee:"me", state:"In Dev")`, then `get_issue(id)` to confirm the write stuck (silent drops, impediment #48); only then read the plan doc. **Read the latest comment first** — the `Reopened` label means read all comments back to the original handoff. **WIP = 1** In Dev across all sessions and worktrees — parallel work happens on *different* issues. **Never `save_issue(state:"Done")` from CC** — put `Fixes THR-XX` in the commit body *and* the PR body (impediment #140) and let the merge auto-close fire straight to Done. Check `Docs/plans/` for the design doc before writing code.

**User review interface — Christian is chat-only, plain-language-only (THR-608).** He does not review code diffs, PRs, or Linear. A Done-when like "diff-reviewed by Christian" is invalid. When a change genuinely needs human sign-off, present a plain-language chat summary (what changed, why, what could be lost, your recommendation) and ask one yes/no question; chat approval satisfies the gate — record `human gate satisfied via chat review <date>` as a Linear comment so the executor may merge. Christian's attention is surfaced in `Design/briefing.md` and `Design/user-actions.md` (refreshed hourly by `keep-work-flowing-cc`) and reviewed in an interactive chat session, never a Linear comment addressed to him. Technical verdicts — CI/CD state, git forensics, merge mechanics, not-a-defect calls — are the agent's to make; only creative/design-vision decisions go to Christian, framed in game terms. See `Docs/plans/2026-07-04-user-review-interface.md`.

### Prioritization: Finish Before You Start

Choose work in this order — finish projects before starting new ones:

1. **Deferrals in active projects** — `Deferral`-labeled issues belonging to a project with active work (`list_issues label:"Deferral" state:"Ready for Dev"`).
2. **Remaining issues in active projects** — clear a project's Ready-for-Dev backlog before pulling from a different project.
3. **New work by priority** — only start a fresh project once active ones have no remaining items.

**Every Linear issue belongs to a project** — no orphans. Deferrals inherit their parent issue's project.

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
| `npm run generate-ul-dashboard` | Regenerate UL dashboard JSON snapshot (auto-runs on `npm run build`) |
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
| `?view=cms#ia-surfaces` | **IA manifest viewer.** Browsable Information Architecture commitment doc — all surfaces with view/mount badges, reads[] tables, and "Open this surface" links. |
| `?view=ul` | **Ubiquitous Language dashboard.** Browseable + searchable glossary across all 7 UL shards with cross-shard search, See-Also navigation, and drift badges. Reads `src/data/ul-dashboard.generated.json` (refreshed via `npm run generate-ul-dashboard`; auto-rebuilt on `npm run build`). |
| `?nofog` | Disable fog of war (fog is ON by default). Combinable: `?view=game&seeded&nofog` |

**For all testing, use `?view=game&seeded`** — this skips the remembrance flow, ascendant selection, AND the Meet The First encounter, loading directly into a fully populated game with a bonded First agent. Only use bare `?view=game` when testing identity-less paths, and only test the worldgen/selection/remembrance screens when those screens are the subject of the test.

**`?seeded` ≠ `--seed 42` (intentional divergence):** The `?seeded` URL uses the `DEV_ASCENDANT_IDENTITY` (hunger.witness, large map, derived cosmology). The CLI `--seed 42` uses a balanced cosmology and medium map. They generate different worlds with the same numeric seed. For roughly equivalent worlds: use `?view=game&seeded&size=medium` in browser vs `npm run cli -- --seed 42 --map medium`. For large-map CLI testing: `npm run cli -- --seed 42 --map large` (still differs in cosmology).

**Note for automated sessions:** The sandbox VM has isolated networking. Use `npm test` and `npx vite build` to verify (for types, see the Pre-commit note on `tsc -b` — `tsc --noEmit` proves nothing here). The user must run `npm run dev` on their own machine.

### Headless CLI (`npm run cli`)

An interactive REPL for testing the game engine without a browser. **Use this for verifying engine behavior after changes** — it runs the real `initializeGameState` → `runTick` pipeline headlessly.

```bash
npm run cli                          # default seed 42, medium map
npm run cli -- --seed 99 --map small # custom seed + map size
npm run cli -- --seed 42 --map medium --auto-aftermath # default auto-pick enabled for run command
```

Key commands at the `fws>` prompt: `tick [N]` (advance ticks), `run [N] [--auto-aftermath]` (auto-run at N ticks/sec, optional headless aftermath auto-pick), `pause`, `status` (game overview), `agents`, `agent <name>` (inspect one), `events [N]`, `doom`, `mandate`, `essence`, `encounters [agent]`, `aftermath list <agent|@hero>`, `aftermath pick <agent|@hero> [reactionId]`, `spawn encounter <agent|@hero> <encounterId> [--courtPosition X]`, `spawn encounter-context <encounterId> [--agent <agent|@hero>] [--at <location|actor>] [--hex <col> <row>]`, `spawn attachment <agent|@hero> <templateId|name> [--tick N]`, `spawn location <subtype> --hex <col> <row> [--name "..."]`, `spawn sublocation <typeId> (--at <location|actor|@hero> | --hex <col> <row>)`, `spawn npc <role> (--at <location|actor|@hero> | --hex <col> <row>) [--name "..."] [--faction <factionDefId>]`, `move agent <agent|@hero> (--to <location|actor> | --hex <col> <row>)`, `factions`, `traces [N]`, `graph` (node counts), `fog` (toggle fog of war on/off), `fog on`, `fog off`, `eval <expr>` (JS with `state` in scope). Type `help` for the full list.

**When to use the CLI:**
- After modifying tick phases or orchestrator logic — run `tick 30` and check `status` + `events`
- After changing agent decision/movement — inspect with `agents` and `agent <name>`
- For pipeline throughput checks (NFP #7 in Pre-Commit Checklist) — `run 5` for 30+ ticks, then `encounters`, `factions`, `traces`
- Quick smoke test after engine changes when you can't run the browser

### Debug Bridge (`window.__DEBUG`)

Dev-only API exposed on `window.__DEBUG` (tree-shaken in prod). Use from `preview_eval`, `javascript_tool`, or browser console.

```javascript
// Advance the simulation headlessly (THR-689) — the sanctioned way to satisfy any
// "run N ticks and observe X" browser Done-when. An automated tab reports
// `document.hidden`, which throttles the interval tick loop to ~1 tick per click;
// this drives the same runTick pipeline synchronously instead. Auto-pauses the run loop.
window.__DEBUG.tick()        // 1 tick
window.__DEBUG.tick(40)      // 40 ticks
// -> { ticksRun, tick, durationMs, requested, capped, stoppedReason }
// Clamped to DEBUG_TICK_MAX (200) per call — a larger request returns capped:true
// rather than an error. stoppedReason is 'completed' | 'capped' | 'phase_left_playing'
// | 'error'; a mid-batch throw returns partial progress, never propagates (fail-soft).
// Emits exactly ONE aggregate `debug_tick_batch` trace per call, never one per tick.

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

// List/apply pending encounter aftermath reactions headlessly:
window.__DEBUG.listAftermathReactions('Serafina')              // -> { reactions: [{id, label}] } or { error }
window.__DEBUG.pickAftermathReaction('Serafina', 'reaction-id') // reactionId optional; defaults to first reaction
// Returns {success, reactionId, touchedWorld, touchedStructure, message}

// Fog of war control:
window.__DEBUG.toggleFog()                // toggle fog on/off, returns new enabled state
window.__DEBUG.setFog(true)               // explicitly enable fog
window.__DEBUG.setFog(false)              // explicitly disable fog

// Encounter log export (returns TSV strings):
const summary = await window.__DEBUG.getEncounterLogAll()   // { trackedAgentCount, totalEvents, agentIds }
const logs = await window.__DEBUG.exportEncounterLogAll()    // { allAgentsTsv, perAgent: [{ tsv, filename }] }

// Prose-quality audit over the static authored-content library (THR-490).
// Pure + deterministic; independent of any live session. Mirrors the DebugPanel "Prose QA" tab.
const report = await window.__DEBUG.proseQualityReport()     // { entries, summary{total,pass,warn,fail,error}, bottomTail, marqueeEntries }
const one = await window.__DEBUG.scoreProseEntry('divine.coincidence')  // ProseQualityResult, or { error } if no id match (exact or partial)

// Orphaned action-card inspector (THR-659) — player-castable templates no run can surface.
// Pure + deterministic over static registries; mirrors the DebugPanel "Orphaned Cards" tab.
const orphans = await window.__DEBUG.listUnreachableActions()  // { entries:[{id,name,reach,crudType,reason}], summary{playerReachableTemplates,granted,starter,dynamicSignature,unreachable}, warning? }

// Outcome-ladder distribution + KPI threshold verdicts (THR-571 U1):
const dist = await window.__DEBUG.getOutcomeDistribution()   // { tick, seed, outcomes, thresholds } — live resolution split + green/amber/red bands
const windowed = await window.__DEBUG.getOutcomeDistribution(30)  // histogram restricted to actions completed in the last 30 ticks

// Entity Visual resolver readout (THR-637) — "why is this showing a fallback?":
const ev = await window.__DEBUG.resolveEntityVisual('Serafina')  // node id/name (exact→partial-id→partial-name)
// -> { matchedId, matchedName, descriptor: { tier:'art'|'fallback', src?, glyph, gradientIndex, alt, kind } } or { error }

// War readout (THR-614 seam 3) — headless "did war actually fire?" check, no browser needed:
const armies = window.__DEBUG.getArmies()    // [{ name, faction, commander, location, size, cohesion, objective:{type,targetName}, ticksActive, ... }]
const battles = window.__DEBUG.getBattles()  // [{ name, battleType, momentum, resolutionThreshold, leader, ticksElapsed, spotlightCount, ... }]
// Ground-truth graph read (no monster-faction filter). The DebugPanel "Armies" tab renders the same state visually.
```

See `src/debug-bridge.ts` for the full API and `src/debug-bridge.d.ts` for types.

## Documentation Strategy

Four surfaces, each with a distinct purpose. Full ownership rules and duplication policy: **`Docs/documentation-ownership.md`**

- **Obsidian vault** — Domain model: systems, mechanics, terminology (wikilinks). Read `Index.md` first.
- **Repo `.planning/`** — Legacy milestone roadmap, phase history (backlog and handover retired — use Linear)
- **Repo `Docs/`** — Implementation rationale (`plans/`), changelog, UI patterns, project status
- **Canon pages** (`Docs/canon/`) — Per-domain navigation layer (current spec pointers, rejected approaches, open questions). **Agent Step 0 for authoring tasks.** See `Docs/canon/README.md` for the schema.

### Canon Pages (agent Step 0 for authoring)

When starting any encounter, prose, attachment, or other content authoring task, load the relevant Canon page **before any other reference material**:

| Domain | Canon page | When to load |
|--------|-----------|-------------|
| Encounters | `Docs/canon/encounters.md` | Before running `encounter-pipeline`, `template-encounter-rewrite`, or any encounter content work |
| Cosmology | `Docs/canon/cosmology.md` | Before any content that references Reaches, Spheres, or Quintessence — includes encounters, agents, and faction content |
| Process | `Docs/canon/process.md` | At session start, instead of re-reading CLAUDE.md sections on NFPs, three-pillar rule, definition of done, design governance, coordination protocol, drift scan, retrospectives, and UL-proposal flow. Meta-canon for every design session. |
| Prose | `Docs/canon/prose.md` | Before any prose, vignette, enrichment, or content-table work — picks the right prose skill (`prose-pipeline`, `prose-content-systems`, `prose-vignettes-and-enrichment`), names the four pipelines, and asserts Threadbare voice + player-as-god framing. |
| Hex map | `Docs/canon/hex-map.md` | Before any HexMapV2 / Three.js / hex-renderer work — picks the right hex-map skill (`hexmap-core`, `hexmap-layers`, `hexmap-renderer`), names the load-bearing decisions (raw Three.js / no R3F, three-tier position model, Y-flip, stencil clipping, hex-distance awareness), and lists current rejected approaches. |
| Rulebook (quick-reference) | `Docs/canon/rulebook-quick-reference.md` | **Always-load at session start** — board-game card, ~80 lines, current rules of play only. Companion to the full rulebook. |
| Rulebook (full synthesis) | `Docs/canon/rulebook.md` | Before any design or content work that touches **rules of play** — turn structure, action verbs, prerequisites, resources, encounters, clocks, win/loss. Each rule carries `[IMPL] / [DESIGN] / [OPEN]`. The single synthesis surface for how the systems combine into a game. |
| Systems inventory | `Docs/canon/systems-inventory.md` | **Required Step-0 load for any Engine-pillar design work.** Generated (`npm run generate-systems-inventory`) map of every subsystem wired into the engine — aliases (incl. legacy names like `TB-073`), the modules + tick phases that implement it, and an ACTIVE/DORMANT badge. Grep it for your premise nouns *before* drafting so you extend/activate an existing system instead of green-fielding a duplicate (the THR-614 failure). Cannot drift the way hand-written canon did. |

**Why Canon pages exist:** agents triangulating canonical content from 6–12 files make silent errors (wrong reach count, stale formats, deprecated systems). A Canon page is a single ≤200-line entrypoint that answers "what is current?" and lists stale sources to avoid. The UL remains the terminology authority; Canon pages point to UL and add the navigation layer on top.

*Notion content migrated to Obsidian 2026-04-04. Dilemma templates remain in Notion pending TypeScript import.*

### Obsidian Vault as LLM Knowledge Base

The vault follows the Karpathy LLM Knowledge Base pattern — a persistent, compounding artifact where the LLM maintains the wiki and humans provide direction and raw sources.

**Three layers:**
- **`raw/`** — Immutable source materials (design docs, research, web clips). LLM reads but never modifies.
- **Wiki** (Systems/, Cosmology/, etc.) — LLM-compiled and maintained pages. The LLM owns this content.
- **`output/`** — Generated reports, query results, audit outputs filed back into the vault.
- **`Ubiquitous-Language/`** — Auto-mirrored glossary shard pages generated from `Docs/ubiquitous-language/` via `npm run mirror-ul`.

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
| `npm run mirror-ul` | Mirror UL shard docs into `Ubiquitous-Language/` in the Obsidian vault and append a vault log entry |
| `npm run mirror-ul:dry` | Print planned UL mirror writes without touching the vault |
| `npm run sync-vault` | Run `generate-vault` then `mirror-ul` in sequence |
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
- Design Reference Wiki (self-maintaining served HTML pages): `Docs/design-reference-wiki.md` — register a new served reference page in `public/wiki-manifest.json`; `npm run build` regenerates the hub + nav.
- Impediment log: `Docs/impediments.md` · Retrospectives: `Design/retros/`

Design docs live in `Docs/plans/` (named `YYYY-MM-DD-topic.md`). New plans copy `Docs/plans/_template.md` as a skeleton. Find existing plans by browsing the directory or loading the relevant domain skill.

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
2. **Typecheck — do NOT run `npx tsc --noEmit`.** It is a **no-op** in this repo: the root `tsconfig.json` sets `files: []`, so it exits 0 unconditionally no matter how broken the code is. Citing its exit 0 as evidence is gate theater (THR-686). The authoritative type gate is CI's `Test · Typecheck · Build` (which runs `tsc -b`). For *local* evidence, run `npx tsc -b --force` and show **zero net-new** errors — the baseline is heavily red (~3.5k, THR-489), so the only meaningful local check is a diff of the error set with and without your change, not an absolute count.
3. `npx vite build` — production build succeeds (confirms Vercel will deploy)
4. `npm run check:process` — advisory workflow/process lint (non-blocking while it stabilizes)
5. `npm run lint:plan-doc` — advisory plan-doc structure lint for `Docs/plans/*.md` (non-blocking while it stabilizes)
6. Verification evidence is mandatory at closeout: paste raw terminal output for steps 1-3 (and step 7 when applicable) in the closing commit body or Linear completion comment, or link to a green CI run for the same commit.
7. **Engine smoke (engine changes only):** if the change touches anything under `src/engine/`, `src/types/gameState.ts`, `src/types/graph.ts`, or any tick-loop / orchestrator / phase / agent-decision file, run a 30-tick CLI smoke before commit. Invoke as: `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`. **Pass criterion:** the run reaches tick 30 without thrown exceptions, the `status` block prints a non-zero agent count, and at least one trace/event line appears in the output. Paste the last ~10 lines (the `status` output) into the closing comment as evidence. If the smoke fails or stalls, do not commit — investigate first.

> **CI runs these automatically.** GitHub Actions runs tests, typecheck, and build on every push and PR to `main`. Vercel runs only `vite build` (no test gate). **Branch protection is active on `main`** — `Test · Typecheck · Build` is a required status check, strict mode (branches must be up to date), no admin bypass on in-progress checks (THR-282 shipped 2026-04-30). Direct `git push origin main` is rejected — all changes must go through a PR. Still run locally before pushing to catch failures early. **Merge = Done (THR-487):** there is no separate review gate. A merged PR carrying `Fixes/Closes/Resolves THR-XX` in the **PR body** (as well as the commit body — impediment #140) auto-transitions the issue straight to **Done** via `.github/workflows/linear-autoclose.yml`; the required `Test · Typecheck · Build` check on `ci.yml` is the merge gate.

## Known Sandbox Limitations

The Claude Code automation sandbox has several quirks that recur often enough that agents waste time rediscovering them. **Read this before debugging environment failures.** (Carried from 2026-04-11 retro; first-class entry per 2026-04-18 retro.)

- **`rg.exe` (ripgrep) is blocked / absent in the agent sandbox** — direct `rg.exe` invocation fails with `Access is denied` or `ENOENT` even on standard repo paths. The `Grep` tool works fine — it does not call `rg.exe` directly. **Workaround for shell use:** use PowerShell `Get-ChildItem -Recurse -Filter <pattern> | Select-String <regex>` instead of `rg`. Repeated occurrences: impediments #15, #28, #33, #37 (≈19 hits).
- **PowerShell variable scoping leaks across blocks.** Variables assigned inside `foreach`/`if` blocks remain visible at the surrounding scope, which can mask bugs in throwaway scripts. **Workaround:** prefer small checked `.ps1` files over inline one-liners when logic is non-trivial; for complex regex with mixed quoting (impediment #44), write to a script file rather than escaping inline.
- **`npm test` may time out at sandbox-default limits** on the full suite. **Workaround:** run scoped subsets via `npx vitest run <path>` for fast feedback; full-suite runs should be kicked off with explicit longer timeouts. The "test suite is red on main" baseline (impediment #22, recurring as #30, #31, #32, #34, #38, #39, #54) is a separate, real engineering problem — see TB-120.
- **`esbuild` / `npm install` may fail with `spawn EPERM`** in restricted sandboxes (impediment #21). **Workaround:** retry once, then fall back to running the failing step on the user's machine; do not loop indefinitely.
- **Linear `save_issue` returns 200 but does not always update state** (impediment #48). **Workaround:** always verify-after-write by re-querying the issue; do not trust the success response alone.
- **Linear `list_issues orderBy: 'priority'` is rejected at runtime** even though the schema accepts it (impediment #49). **Workaround:** omit `orderBy` (or use `createdAt` / `updatedAt`) and sort by priority in memory.
- **Obsidian vault writes go through the filesystem, not the MCP** (structurally closed 2026-07-21, THR-654 — was impediments #66, #71, #75, #86, ~12 occurrences over 8 days of silently-dropped `log.md` appends). Vault skills write directly to `OBSIDIAN_VAULT_PATH`; if unset, they fail loud rather than dropping the entry. Add to `.claude/settings.local.json`: `{ "env": { "OBSIDIAN_VAULT_PATH": "C:\\Users\\chris\\Dev\\Obsidian" } }`.

- **The CC harness mutates the home tree's git state at session spawn** (THR-671/672, proven 2026-07-20) — two behaviors, neither attributable to any agent (no transcript across any project directory contains the commands, and agent shell commands always transcript): (a) an hourly empty-reflog-message update of `refs/heads/main` via plumbing, and (b) a bare `git checkout HEAD` that parks the home tree on a detached HEAD — observed three mornings running. Moving `main` under a checked-out tree manufactures phantom "staged" diffs that look like catastrophic damage but are not. **This is harness-level and cannot be fixed from the repo.** **Containment:** `threadbare-autosync.ps1` reattaches the provably loss-free park (detached ∧ 0 unique commits ∧ 0 tracked modifications → `git switch main`) within the hour; any other detached state is left untouched with one loud log line carrying the manual repair. Never read a behind-count off a detached HEAD — `HEAD..origin/main` on a parked HEAD is arithmetically true and semantically meaningless (see the freshness-signal table in § Session Workflow). Upstream bug report: [anthropics/claude-code#79713](https://github.com/anthropics/claude-code/issues/79713) (filed 2026-07-21; report body at `Docs/audits/2026-07-20-git-cicd-forensics/upstream-report.md`).
- **Scheduled sessions must never run git state ops with the home tree as CWD** (THR-672) — no `checkout`/`switch`/`commit`/`merge`/`rebase`/`reset` against `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator`. It is a read-only mirror of `main` owned by autosync; the since-retired `flush-plan-docs` (07-17) and `keep-work-flowing` (07-19) tasks each left it parked on a session branch, stalling autosync for days. **Workaround:** home-tree access is read-only `git -C` queries and file reads; all branch/commit/push work happens in the session's own worktree (branches are repo-global, push works from any worktree).

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

- [ ] **Step 0 - grill-me pre-pass (if non-trivial)** — run `grill-me` before drafting when scope is large, multi-pillar, ambiguous, or explicitly requested. Auto-trigger asks permission first; synthesis lands in `Docs/plans/YYYY-MM-DD-<topic>-grill-me.md`.
- [ ] **Step 0.5 - Codesight pre-flight (if change touches `src/`)** — before drafting, query Codesight for blast radius (who imports the affected files?) and dependency chain (what do they import?). Use `.codesight/graph.md` for the dependency graph and the codesight MCP for live queries when available. If any file in scope has **≥100 importers**, the plan doc must include a **Blast Radius** section up front (see Per-system required sections below). Skip this step entirely for process / doc-only / skill-only changes that don't touch `src/`. If `npx codesight` / `.codesight/` is unavailable in the sandbox, fall back to manual `grep -rn "from.*<path>" src/` to count importers and log the missing-tool case as an impediment.
- [ ] **Step 0.6 - Substrate-existence check (mandatory for any Engine-pillar plan)** — Step 0.5 asks "who imports the files I'm changing"; a green-field plan names no files, so it answers nothing. This step asks the opposite question: **does what I'm designing already exist?** Before drafting, (a) load `Docs/canon/systems-inventory.md` and grep it for your premise's domain nouns *and their synonyms* (e.g. war → army, battle, siege, cohesion, TB-073), and (b) `grep -ri` those nouns across `src/engine/`. The plan doc **must open with a `## Substrate inventory` section** stating what already exists and whether the plan **extends / activates / replaces** it. A green-field claim ("this is new") is only valid with the grep evidence in that section — literally "0 hits for X / Y / Z across the inventory and `src/engine/`". A DORMANT badge in the inventory means the system is *built but silent* — you activate or tune it, you do not rebuild it. This exists because THR-614 planned a green-field war system while ~3,300 lines of it sat wired and dormant in `orchestrator.ts`.
- [ ] **Draft** the system design — covering all three pillars (Engine, Content, UI)
- [ ] **Draft the Brainstorm companion** alongside the plan — same pass, not retrofit. Capture considered alternatives, tensions surfaced, Vision premises invoked.
- [ ] **Audit** against all 7 NFPs, load-bearing decisions, and rejected approaches
- [ ] **Revise** — integrate remediations inline (not in a separate appendix)
- [ ] **Summarize** — NFP Compliance table at the end (PASS / PASS with note per priority)
- [ ] **Three-pillar check** — Engine section present? Content section present? UI section present? Wiring section connecting them?
- [ ] **Step 8.5 - Intent-judge verdict** — after summarize and three-pillar check, before presenting. Spawn `intent-judge` as a Task subagent (`model: "opus"`). Author must first produce an action proposal at `Docs/plans/.intent-proposals/<slug>.md` (template at `.claude/skills/intent-judge/proposal-template.md`). Verdict gates the handoff: Allow → proceed; Revise → fix and re-run; Block → rewrite; Escalate → ping user with verbatim finding.
- [ ] **Step 8.6 - Forked structural audit (design-audit-pipeline)** — after intent-judge Allow, before opening the plan-doc PR. Spawn three subagents in one message (NFP / three-pillar / Vision) via `.claude/skills/design-audit-pipeline/SKILL.md`. Each returns ≤300-word verdict. Orchestrator writes verdicts into the plan-doc tail under `## Forked-audit verdicts`. If any FAIL or REVISE, surface to author before transitioning Linear state. Manual invocation: `/design-audit <plan-doc-path>`.
- [ ] **Vision audit** — does this plan contradict or update any Vision premise? If so, the Vision edit is part of this ticket's scope, not a follow-up.
- [ ] **Rulebook impact?** — does this plan change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss)? If yes, the rulebook update is part of this ticket's scope, not a follow-up. Update `Docs/canon/rulebook.md` in the same PR and re-verdict the affected section.
- [ ] **Present** the finished, compliant design to the user

### Per-system required sections (inline, not appendix)

- [ ] **Engine pillar** — systems design, graph nodes/edges, tick phases, resolution logic, PRNG callouts
- [ ] **Content pillar** — encounter templates, prose tables, attachment content, data tables
- [ ] **UI pillar** — player-facing display, event notifications (alerts/toasts/chronicle), debug inspection (DebugPanel), visual presence (HexMapV2 signifiers/overlays). No UI pillar = incomplete design. **Closeout produces a screenshot + console artifact at 1920×1080 (Definition of Done §Browser-verify UI changes).** Design plans for new UI surfaces must name *which tool* will produce that artifact: Playwright (DOM), Claude-in-Chrome (Three.js / WebGL), or both.
- [ ] **Wiring section** — for each module: orchestrator phase, UI component, GameState flow, traces, debug visibility, prose pipeline (`enrichProse()`?), player controls. Reference `Docs/plans/wiring-checklist.md`. Module only in test files = not integrated.
- [ ] **Constants table** — every tunable number named, with default and purpose (NFP #1)
- [ ] **Tracing** — trace types emitted, with TypeScript interface definitions (NFP #2)
- [ ] **Fail-soft table** — failure cases and fallback behavior (NFP #4)
- [ ] **Blast Radius (only when high-impact files touched)** — required when the change touches any file with ≥100 importers (see the named list under `# Codesight — Codebase Intelligence` near the bottom of this file). For each high-impact file, list the importer count and a one-line cascade-risk note (e.g., "graph.ts — 531 importers; schema additions ripple through every node-creation site"). Surface up front in the plan doc, not in an appendix. Omit this section entirely when no high-impact file is touched.

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

- [ ] **Commit** all changes — the closing commit's message body **must** include `Fixes THR-XX` (or `Closes THR-XX` / `Resolves THR-XX`). This triggers the Linear auto-close workflow on push to `main`. Include verification evidence either in the commit body or closing Linear comment: raw terminal output for `npm test` and `npx vite build` (plus a `tsc -b` net-new diff when the change touches TypeScript — never `tsc --noEmit`, which is a no-op here), or a link to a green CI run for the same commit. Example: `docs: update project-status for THR-8\n\nFixes THR-8`
  - **Put `Fixes THR-XX` in the PR description body too, not only the commit body.** When the merge is a non-squash merge commit (`Merge pull request #N…`), GitHub's merge commit does **not** carry the feature commit's body, so Linear's integration never sees the keyword and the auto-close silently misses (impediment #140, THR-453). The keyword must appear in the PR body so the close fires regardless of merge strategy.
- [ ] **Push** to GitHub (`git push`, with `-u origin <branch>` if needed)
- [ ] **Merge** feature branches into main immediately — don't leave branches waiting. **Queue it with `gh pr merge --auto --merge` and move on; do not poll-wait on CI** (THR-675). GitHub holds the merge until the required `Test · Typecheck · Build` check is green and merges with no session present. Branch protection and the required check are unchanged — auto-merge removes the waiting, not the gate.
- [ ] **Deploy** — Vercel auto-deploys from GitHub on push to `main`. Just ensure the push succeeded.
- [ ] **Update docs** — `project-status.md` (≤60 lines, move old entries to `project-history.md`), `project-history.md` (one-line `✅` entry), `changelog.md` (append rows). Add a completion comment to the Linear issue (the `Fixes THR-XX` keyword in the commit auto-closes it, but a human-readable comment is still expected).
- [ ] **Verify wiring** — Check every new module against `Docs/plans/wiring-checklist.md`. Engine modules called from orchestrator, modals rendered in GameView JSX, GameState fields consumed by UI, traces emitted, player controls connected. Update the checklist if new surfaces added.
- [ ] **Browser-verify UI changes** — If the change touches the UI pillar (any file under `src/components/`, `src/views/`, `src/hooks/use*UI*`, `src/styles/`, `index.css`, or HexMapV2/Three.js surfaces), the closing commit body or Linear completion comment MUST include:
  1. **At least one screenshot** of the changed surface at 1920×1080 (the contractual viewport — see `## Viewport Contract`). Use Playwright `preview_resize(1920, 1080)` then `preview_screenshot` for DOM surfaces; use Claude-in-Chrome `mcp__Claude_in_Chrome__computer` with `action: "screenshot"` for any HexMapV2 / Three.js / WebGL surface (Playwright cannot see canvas content — see CLAUDE.md viewport contract).
  2. **Console output** captured via `mcp__playwright__browser_console_messages` or `mcp__Claude_in_Chrome__read_console_messages` (errors + warnings filter), pasted as a fenced block. Empty output is a valid result — embed `(no errors or warnings)` in that case.
  3. **State assertion via `__DEBUG`** — at least one query of `window.__DEBUG.*` proving the new state field, surface, or interaction is wired. Use the bridge documented in CLAUDE.md §Debug Bridge.

  **Three reasons this is binary, not advisory:** (1) snapshot tests miss paint regressions; (2) TypeScript misses overflow/z-index/off-viewport rendering; (3) Playwright cannot see WebGL canvas content. Without a browser pass, those failure modes ship unseen. Pocock: "if you're building a front-end app and you're not giving the LLM access to the browser, that's crazy."

  **Exempt:** changes that touch only types/interfaces with no runtime UI (e.g. extending a prop type without changing render behaviour), pure refactors verified by snapshot+typecheck. The exemption is opt-in and must be stated in the commit body: `Browser-verify exempt: types-only refactor, snapshot tests cover render`.
- [ ] **Update the Design Reference Wiki** — If your change touches a core game system documented by a wiki page (see the `sources` globs per page in `public/wiki-manifest.json`), update that page in the same PR. The advisory `npm run check:wiki-freshness` lint flags misses. A core-system change that ships without its manual-page update is documentation drift by definition (user directive 2026-07-03; see `Docs/plans/2026-07-03-game-manual-wiki.md`).
- [ ] **Update systemic wiring guide** — If your change adds or modifies a content-facing engine capability (new effect type, new graph operation, new enrichment placeholder, new aftermath reaction kind, new template field, new scoring signal), update `Docs/plans/2026-04-16-systemic-wiring-guide.md`. This guide is the IKEA manual for content authors — if a capability isn't documented there, content agents won't use it and the game gets hardcoded prose instead of systemically alive content.
- [ ] **Log deferrals** — Every `// TODO`, `// DEFERRED`, or `// PHASE-X-DEFERRED` comment added in this session MUST have a corresponding Linear issue. Use format `// TODO(THR-XX): description`. No orphan deferrals — if you deferred it, track it. Label the issue `Deferral` and assign it to the same project as the parent work. A deferral without a Linear issue is invisible tech debt.
- [ ] **Log impediments** — Any blockers or workarounds → `Docs/impediments.md`. Load `impediment-reporter` skill for format. Mandatory — unlogged friction is invisible.
- [ ] **Close out** — Confirm the Linear issue is in the correct terminal state: a design session hands off by moving to "Ready for Dev" with the coordination-block handoff comment posted and the plan doc already committed via its own `docs/plan-*` PR; an execution session lands the work with `Fixes THR-XX` in the merge commit and lets the auto-close fire. The Linear state transition IS the closeout — no out-of-band notification of any kind. The hourly pickup lane polls Linear and picks up the top Ready-for-Dev item.

**Where to find completed work history:** Linear issues in "Done" state (current), `.planning/BACKLOG_HISTORY.md` (pre-Linear history), and `Docs/project-history.md` (one-line entries).

## Session Workflow

- [ ] Read this file for orientation
- [ ] **Read the Ubiquitous Language index** — `Docs/ubiquitous-language/README.md` (always-load, ~3k tokens). Load individual shard files on demand when the task touches their domain. **UL wins on terminology disagreements** — when this file, Obsidian, plan docs, or code comments conflict with the UL, the UL definition is correct and the conflicting source needs reconciliation (open a `UL-proposal` Linear issue).
- [ ] **First tool call of any coding session:** run `node --experimental-strip-types scripts/session-precheck.ts` and compare its `fingerprint ...` line against expected sandbox capabilities before starting feature work
- [ ] **Read the freshness signal.** The precheck output line `fingerprint ... freshness=<value>` reports working-tree state vs `origin/main`. The value is one of seven keys, each with its own action:

  | `freshness=` | Meaning | Action |
  |---|---|---|
  | `current` | On a branch, up to date | Proceed |
  | `ahead:N` | Local commits not pushed | Proceed; push at closeout |
  | `behind:N` | Branch genuinely trails `origin/main` | Surface first; `git fetch && git pull` on main, `git fetch && git rebase origin/main` elsewhere |
  | `stale-branch:Xh` | Old closeout branch still checked out | Surface first; close it out or switch to main |
  | `parked-at-ancestor` | Detached at an older snapshot, **nothing unique stranded** | **Run the repair yourself, then continue** (see below) |
  | `parked-with-unique-commits:N` | Detached with commits that exist nowhere else | **Stop.** Do not reset. Run `git log origin/main..HEAD --oneline` and surface the SHAs |
  | `unknown` | Probe could not determine state | Surface it; ask the user to confirm the tree is current |

  For `behind:*` / `stale-branch:*` / `unknown`, surface it as the **first thing in the response** and do not begin design work until the user has resolved or explicitly acknowledged it.

  **`parked-at-ancestor` is the one case an agent may fix without asking.** The precheck has already proven `git rev-list --count origin/main..HEAD == 0`, so nothing authored can be lost — untracked files survive and the stash is recoverable. Run the repair, note it in one line, and carry on:

  ```bash
  git stash push -m home-tree-recovery   # harmless no-op if the tree is clean
  git switch main
  git pull --ff-only origin main
  ```

  Never read a behind-count off a detached HEAD. `HEAD..origin/main` on a parked HEAD is arithmetically true and semantically false; treating it as decay is what turned a two-command repair into a multi-day escalation (THR-671).
- [ ] **Check Linear for work** — query issues by state per the protocol in `Docs/plans/2026-04-13-linear-coordination-protocol.md`:
  - **Design session:** Run the board scan from `Docs/plans/2026-04-13-linear-coordination-protocol.md` § Design Session Start — a state-filtered fan-out across In Design, Implementation Planning, Ready for Dev, In Dev, and Todo, bucketed in memory by `status` (never an unfiltered `list_issues` — it overflows the response budget; see Limitations §).
  - **Execution session:** `list_issues state:"Ready for Dev" assignee:null` (pick up handoffs), `list_issues state:"In Dev" assignee:"me"` (resume active work)
- [ ] **Design session — plan doc authoring:** After writing a plan doc to `Docs/plans/` or `Docs/audits/`, commit it directly via its own `docs/plan-*` PR (CI-gated, merged immediately). **Put the `Plan doc:` path in the issue *description* as well as the handoff comment** — a `**Plan doc:** \`Docs/plans/…md\`` line in both, so neither is a single point of failure. Then move the issue to the appropriate state (e.g. Ready for Dev) with the coordination block.
- [ ] Read Obsidian `Index.md` via MCP → follow links to the relevant system. Index.md is the comprehensive catalog — use it as the LLM's navigation system.
- [ ] **For design work**, load the rulebook synthesis first: `Docs/canon/rulebook-quick-reference.md` is always-load; `Docs/canon/rulebook.md` for any work touching rules of play (turn structure, action verbs, prerequisites, resources, encounters, clocks, win/loss). Then load `state-of-game-design` (mechanical foundation) and `game-design-direction` (experiential foundation), then descend into Vision/ via Obsidian MCP and the relevant per-domain canon page.
- [ ] **Check Linear Projects for milestone context** — `list_projects` to see which milestones are in Now/Discovery/Research. Issues belong to projects; projects show the big picture.
- [ ] Check `.planning/ROADMAP.md` for legacy milestone overview
- [ ] Read relevant design doc in `Docs/plans/` before writing code
- [ ] **For content authoring tasks (encounters, attachments, prose, faction content):** load `Docs/canon/<domain>.md` **before any other reference material**. The Canon page is the agent's Step 0 entrypoint — it lists the current spec, canonical pointers, and stale sources to avoid. Start with `Docs/canon/encounters.md` for encounter work, `Docs/canon/cosmology.md` for anything that references Reaches or Spheres.
- [ ] **Upstream health check** — if the feature depends on upstream pipeline throughput, verify the pipeline is producing output before coding. A feature wired to a dead pipeline is wasted work.
- [ ] **Terminology authority check** — if sources disagree on term definitions, UL wins (`Docs/ubiquitous-language/README.md` + shard entries)
- [ ] After completing work, follow the **Definition of Done** above
- [ ] **Update Linear** — move issue to appropriate state, add completion comment
- [ ] **Update vault log** — Append to `log.md` via Obsidian MCP what was changed in this session

**Weekly continuous-improvement cycle (Fridays):**
1. 14:00 UTC — GitHub Action drift scan runs and posts per-signal Linear issues (label: `drift-scan`) in Continuous Improvement.
2. ~15:00 UTC — Weekly retrospective (via `retrospective` skill) reads that week's `drift-scan`-labeled issues as its **first input** before the impediment log. Run via the `weekly-retro` scheduled task or manually with `/retrospective`.

The `weekly-retro` scheduled task is **registered and live** in the CC lane (created 2026-07-20, THR-653) — `0 17 * * 5`, fires ~17:09 local. It had been documented here as a task-to-create since the cycle was written, but had never actually been registered with the scheduler. Prompt: `C:\Users\chris\.claude\scheduled-tasks\weekly-retro\SKILL.md`.

### Scheduled Tasks

Current recurring task registry. **Verified against `list_scheduled_tasks` on 2026-07-21 (THR-677 port); `flush-plan-docs` removed 2026-07-21 (THR-654 demolition).** The scheduler adds a deterministic per-task jitter of a few minutes to the cron minute, so **the slot name, the cron minute, and the actual fire time are three different things** — the `Fires` column is the one that matters operationally.

**CC automation lane — registered and live:**

| Slot | Cadence | Task | Cron | Fires |
|------|---------|------|------|-------|
| **:00** | Hourly | CC pickup (`tb-opus-pickup` — single Opus executor lane) | `0 * * * *` | ~:00:53 |
| **:45** | Hourly | `keep-work-flowing-cc` (CC PM brief — refreshes `Design/briefing.md` + `Design/user-actions.md`) | `45 * * * *` | ~:53:13 |
| **Fri 17:00** | Weekly | `weekly-retro` | `0 17 * * 5` | ~17:09 |
| **Sun 16:03** | Weekly | `weekly-memory-grooming` | `3 16 * * 0` | ~16:10 |

**CC automation lane — registered but DISABLED, pending trial approval (THR-677).** All three are ported and on disk with correct cron slots; `enabled: false` until each has run once attended and Christian has approved its output in chat. That trial gate is Christian's decision (chat, 2026-07-21), not an oversight — these replace Cowork tasks that are still running, so enabling them before trial would double-run the job. **Flip each to enabled only after its trial passes**, and disable the Cowork counterpart in the same step.

| Slot | Cadence | Task | Cron | Fires | Writes |
|------|---------|------|------|-------|--------|
| **09:07** | Daily | `daily-backlog-grooming` | `7 9 * * *` | ~09:16 | `Docs/ops/backlog-grooming-<date>.md` + Linear queue fixes |
| **Wed 11:09** | Weekly | `weekly-workflow-retro` | `9 11 * * 3` | ~Wed 11:13 | `Design/retros/workflow-retro-<date>.md` |
| **Sun 10:06** | Weekly | `weekly-project-hygiene` | `6 10 * * 0` | ~Sun 10:10 | `Docs/ops/weekly-hygiene-<date>.md` + filed findings |

**Output-surface rule for all three:** none of them writes `Design/briefing.md` or `Design/user-actions.md` — `keep-work-flowing-cc` owns those two files, and a second writer produces merge conflicts. Christian-facing items go in each task's own report under a `## Needs Christian` heading, and reach him via the hourly briefing picking up the underlying Linear state.

**GitHub Actions:**

| Slot | Cadence | Task | Cron |
|------|---------|------|------|
| **Fri 14:00 UTC** | Weekly | Drift scan — posts `drift-scan` Linear issues to Continuous Improvement | n/a (Actions cron) |

**Windows Task Scheduler lane** (host-machine tasks; invisible to `list_scheduled_tasks`):

| Slot | Cadence | Task | Trigger | Fires |
|------|---------|------|---------|-------|
| **:40** | Hourly | `Threadbare Git Cleanup` — runs `C:/Users/chris/Dev/Projects/clean-stale-git.sh` (prunes merged worktrees/branches, escalates stale unmerged ones) | Once at 00:40, repeat every 1h | :40 (no jitter) |

The reaper was daily until THR-673 moved it to hourly at the free `:40` offset. Two things about it are load-bearing:

- **It runs only while Christian is logged on** (`Logon Mode: Interactive only`). Making it run headless requires storing a password, which agents must not do — so a machine that is off or logged out simply misses runs. `StartWhenAvailable` catches up on the next opportunity; that is the intended containment, not a bug.
- **It never deletes a live session's worktree.** `WORKTREE_MIN_IDLE_MINUTES` (180) skips any worktree whose git admin dir shows recent activity, and the orphan-dir sweep skips directories with recent file activity. Removing this guard re-opens the THR-673 failure: a rebased, uncommitted session worktree looks exactly like merged debris, and reaping it mid-session unregisters it, which lets the *next* run delete that session's branch.

**Cowork lane — still enabled, pending Christian's disable (THR-653).** CC cannot read or disable these: they live in Cowork app state, are invisible to `list_scheduled_tasks`, and have no `SKILL.md` on CC disk. The disable is a Christian-owned switch tracked in `Design/user-actions.md`.

| Slot | Cadence | Task | Disposition |
|------|---------|------|-------------|
| **:45** | Hourly | `keep-work-flowing` | Superseded by `keep-work-flowing-cc` (THR-650) — **disable** |
| **09:06** | Daily | `daily-backlog-grooming` | CC port registered (disabled) — **keep ON until its trial passes**, THR-677 |
| **Wed 09:04** | Weekly | `weekly-workflow-retro` | CC port registered (disabled) — **keep ON until its trial passes**, THR-677 |
| **Sun 10:04** | Weekly | `weekly-project-hygiene` | CC port registered (disabled) — **keep ON until its trial passes**, THR-677 |
| **Sun 10:06** | Weekly | `weekly-invoice-check` | **Out of scope — personal, not Threadbare. Do not touch.** |

**Not created:**

| Slot | Cadence | Task | Status |
|------|---------|------|--------|
| **1st 09:00** | Monthly | `monthly-rulebook-review` | Never registered — THR-417 |

**Slot allocation.** Hourly Linear-MCP-using tasks are spaced so their *fire times* don't overlap: `tb-opus-pickup` at ~:00:53, `keep-work-flowing-cc` at ~:53:13 (deliberately late in the hour so the brief reflects post-pickup state; it moved from the :20 slot to :45 in the THR-653 cutover, taking over the slot the Cowork PM task vacates). Daily and weekly tasks pick non-quarter-hour minutes (e.g., :04, :06, :09). When registering a new hourly task, pick a cron minute whose *jittered* fire time leaves a clear gap from the ones above, then record both the cron and the observed fire time here in the same commit.

The THR-677 ports were slotted against that rule: `daily-backlog-grooming` fires ~09:16 (clear of the `:00`/`:40`/`:53` hourly traffic), `weekly-project-hygiene` ~Sun 10:10 (clear of Sunday's 09:16 grooming and 16:10 memory grooming), and `weekly-workflow-retro` ~Wed 11:13 — deliberately moved off its old Cowork slot of Wed 09:04, which would have landed on top of the daily grooming run.

**Prompt sources are mirrored into the repo.** Scheduled-task prompts live at `C:\Users\chris\.claude\scheduled-tasks\<id>\SKILL.md`, which is **outside** version control — merging a repo change does not deploy them, and a disk loss takes them with it. Copies are kept under `Docs/ops/scheduled-task-prompts/` so the prompts are reviewable and recoverable. **When you edit a live prompt, update its mirror in the same PR**; the mirror is a copy, not the source of truth.

## Skill Tree Layout

**`.claude/skills/` is the only skill tree.** Claude Code reads it from a hardcoded path in the CC binary; every skill any Threadbare session can invoke lives there.

The repo used to carry a second tree at `.agents/skills/` for non-CC runtimes, kept in step by the THR-192 pre-commit hook and `npm run check:skill-sync`. Both were deleted 2026-07-21 (THR-654) along with the Cowork lane they existed to serve. The duplicate was the direct cause of the `check:skill-sync` false-positive commit blocks (62 mentions in `Docs/impediments.md`); that class is structurally closed. **Do not reintroduce a second skill tree** — add new skills to `.claude/skills/` only.

Six skills were retired rather than ported, because CC does Obsidian-vault work through the filesystem (`OBSIDIAN_VAULT_PATH`) instead: `content-catalog-manager`, `defuddle`, `json-canvas`, `obsidian-bases`, `obsidian-cli`, `obsidian-markdown`. `design-council` and `playtest-interface` were ported to `.claude/skills/` (THR-651, browser MCP verified from a CC session). Recover any retired skill from git history if it turns out to be wanted.

**When you edit a skill, bump `last_validated_against` to today's date** if you changed instructions, examples, or referenced systems. Skip bumps for typo-only/format-only edits. This field records an explicit correctness affirmation, not a file-modified timestamp. If you review a skill and confirm it is still accurate without content edits, you may still bump the date in a small one-line commit.

## Domain Skills

Context for specific problem types lives in on-demand skills. **Always load the `state-of-game-design` router first** — it is a thin orientation file (~3 KB) that routes you to the reference shard your task needs (`reference/cosmology.md` for content/cosmology, `reference/verbs-resolution.md` for engine, `reference/architectural-decisions.md` for plan/audit, `reference/deprecated.md` when proposing a pattern that might be rejected). Load only the shard(s) you need, not all four.

**For any prose, narrative, or content work** — first read the **systemic wiring guide** (`Docs/plans/2026-04-16-systemic-wiring-guide.md`), then choose the right prose skill: `prose-pipeline` for resolver architecture, `prose-content-systems` for encounter templates and day-to-day content, `prose-vignettes-and-enrichment` for enrichment placeholders and vignettes. The wiring guide ensures content uses the engine's dynamic capabilities instead of producing hardcoded fiction.

| Domain | Skill | When to load |
|--------|-------|-------------|
| **Terminology (always active)** | `ubiquitous-language` | Session start — load `Docs/ubiquitous-language/README.md` as orientation. Load specific shards on demand. Propose new terms via Linear `UL-proposal` when encountering undeclared concepts. UL wins on all terminology disagreements. |
| **Rulebook (synthesis, always active)** | `Docs/canon/rulebook-quick-reference.md` (always) + `Docs/canon/rulebook.md` (rules-of-play work) | Quick-reference is always-load — board-game card, ~80 lines. Full rulebook for any work touching rules of play (turn structure, action verbs, prerequisites, resources, encounters, clocks, win/loss). Each rule carries `[IMPL] / [DESIGN] / [OPEN]`. The single synthesis surface for how the systems combine into a game. |
| **Foundational (load first — router)** | `state-of-game-design` | Always — before any other domain skill. Thin router (~3 KB); follow routing table to load the specific shard(s) you need. |
| **Game design direction** | `game-design-direction` | During In Design phase for player-facing features. Loads Vision/ + taste profile, runs pre-design debate when direction is contested, runs Vision audit at finalization. Load alongside `state-of-game-design` router + `reference/cosmology.md` + `reference/architectural-decisions.md`. |
| **Systemic wiring guide** | `Docs/plans/2026-04-16-systemic-wiring-guide.md` | **Before any content authoring.** The 7 engine capabilities content authors must know: enrichment placeholders, encounter seeding, hidden marks, reputation flow, graph ops, intelligence, divine intervention. Read this before encounter-pipeline, attachment-pipeline, or prose-content-systems. If you don't know what the engine can do, you'll write hardcoded fiction. |
| Engine & code architecture | `engine-architecture` | Writing engine modules, tick loop work, tracing, resolution, PRNG |
| Encounter & actor systems | `encounter-actor-systems` | Analysing, debugging, tuning encounter pipeline, actor capability, resolution, awareness, scoring. Also maintains `encounters-agents-reference.html` and `tick-cycle-reference.html`. |
| Frontend & UI | `frontend-ui` | Building components, styling, accessibility, layout at 1920–3440px. Loads `Docs/design-system/` |
| Prose — resolver architecture | `prose-pipeline` | Implementing new resolvers, modifying the prose pipeline, understanding graph-walking prose generation. Includes Threadbare aesthetic and authoring checklist. |
| Prose — content authoring | `prose-content-systems` | Adding encounter templates, narrative event prose, faction content, spell flavor, content tables. High-volume daily work. |
| Prose — dynamic systems | `prose-vignettes-and-enrichment` | Enrichment placeholders `{name}/{artifact}/{ally}`, vignette authoring, backstory strata, encounter history → prose. |
| Encounter authoring pipeline | `encounter-pipeline` | Automated 4-pass encounter authoring: draft → editorial → systems audit → final merge. Run with `/encounter-pipeline <scale> <premise>`. |
| Template encounter rewrite | `template-encounter-rewrite` | Rewriting guild/social/tavern/combat `EncounterTemplate`-format files to meet prose quality bar + systemic wiring. NOT for branching encounters — those use `encounter-pipeline`. |
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
| Interface regression sweep | `playtest-interface` | Interface playtest — drives a browser MCP session through the game, asserts every IA manifest surface via `__DEBUG`, produces structured PASS/FAIL/SURPRISE report. `/playtest-interface [url]` |
| Testing & contracts | `testing-patterns` | Writing tests for engine or HexMapV2 changes. Contract test patterns, dependency maps, anti-patterns, coverage gap reference. |
| Encounter tuning & analysis | `agent-analyser` | Analysing encounter log TSV exports for agent behavior, balance, variety, movement, capability growth, idle rates. Upload logs and ask for analysis. |
| **Impediment reporting (always active)** | `impediment-reporter` | **Every session, every agent.** Log blockers and workarounds to `Docs/impediments.md` as they occur. Part of Definition of Done. |
| Continuous improvement | `retrospective` | Review impediment log, analyze patterns, implement quick-fix improvements, backlog larger ones. Run with `/retrospective`. |
| Multi-perspective design | `design-council` | Run a sociocratic, consent-based design discussion with multiple perspectives (content, engine, coordination, etc.). Forward-looking counterpart to `retrospective`. Trigger with `/design-council` or "let's get multiple perspectives on this". |
| Pre-handoff intent check | `intent-judge` | Before opening the PR for any plan doc. Auto-spawned subagent that scores the plan against the user's verbatim ask. Returns Allow / Revise / Block / Escalate. `/intent-judge <path>` for manual runs. |
| Pickup entrypoint (CC) | `pull-work` | Canonical CC pickup flow: safe-claim, verify-after-write, dirty-worktree fallback. Run with `/pull-work`. |
| Pre-design grilling | `grill-me` | Optional Step 0 of the design workflow when scope is large, multi-pillar, or ambiguous. Synthesizes into `Docs/plans/YYYY-MM-DD-<topic>-grill-me.md`. |
| Vault log append | `vault-log` | Append a `- **<type>** | <description>` entry to the Obsidian vault `log.md`. Auto-falls-back to filesystem write when Obsidian MCP is unreachable; requires `OBSIDIAN_VAULT_PATH`. |

## Continuous Improvement

Two skills form a feedback loop:

1. **`impediment-reporter`** — Every agent logs friction as it happens → `Docs/impediments.md`
2. **`retrospective`** — Periodically analyze the log, implement quick wins, backlog bigger fixes → `Design/retros/`

Repetitive workflows → propose a skill. Use `anthropic-skills:skill-creator` to build and eval 


# Codesight — Codebase Intelligence

Codesight is installed as both a **static analysis output** (`.codesight/`) and an **MCP server** (`codesight` in `.mcp.json`). A SessionStart hook regenerates the analysis each session.

**Use codesight actively:**
- Before touching unfamiliar code, check `.codesight/wiki/index.md` for orientation (WHERE things live), then read actual source files.
- Use `.codesight/CODESIGHT.md` for the full context map: components, libraries, config, middleware, dependency graph.
- Use `.codesight/components.md` for the component catalog with props (264 components).
- Use `.codesight/graph.md` for the import dependency graph and high-impact files.
- Use the codesight MCP tools when available for live queries (blast radius, dependency chains).
- To refresh mid-session after significant changes: `npx codesight --wiki`

**High-impact files** (changes here affect many other files — all ≥100 importers; counts refreshed via codesight 2026-07-03):
- `src/engine/graph.ts` (imported by 531 files)
- `src/types/gameState.ts` (imported by 345 files)
- `src/types/unifiedAction.ts` (imported by 278 files)
- `src/types/traits.ts` (imported by 250 files)
- `src/engine/traceBuffer.ts` (imported by 232 files)
- `src/types/index.ts` (imported by 225 files)
- `src/types/agent.ts` (imported by 129 files)
- `src/types/graph.ts` (imported by 125 files)
- `src/types/influence.ts` (imported by 107 files)
- `src/engine/simulationRuntime.ts` (imported by 106 files)

Wiki articles are navigation aids, not implementation guides — always read source files before implementing.
