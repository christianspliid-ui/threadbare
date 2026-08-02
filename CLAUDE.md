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

**User review interface — Christian is chat-only, plain-language-only (THR-608).** He does not review code diffs, PRs, or Linear. A Done-when like "diff-reviewed by Christian" is invalid. When a change genuinely needs human sign-off, present a plain-language chat summary (what changed, why, what could be lost, your recommendation) and ask one yes/no question; chat approval satisfies the gate — record `human gate satisfied via chat review <date>` as a Linear comment so the executor may merge. Christian's attention is surfaced in `Design/briefing.md` and `Design/user-actions.md` (refreshed hourly by `keep-work-flowing-cc`) and reviewed in an interactive chat session, never a Linear comment addressed to him. **Both files live on the `ops` branch, not `main`** (THR-947) — read them with `git fetch origin ops --quiet && git show origin/ops:Design/briefing.md`; the `main` copies are pointer stubs. Technical verdicts — CI/CD state, git forensics, merge mechanics, not-a-defect calls — are the agent's to make; only creative/design-vision decisions go to Christian, framed in game terms. See `Docs/plans/2026-07-04-user-review-interface.md`.

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
| `?view=game&firstunmet&size=medium` | **The Meet-The-First route (THR-874).** Seeded ascendant identity **without** a pre-bonded First, so `isMeetTheFirstAvailable` stays true and the beat auto-triggers once the avatar reaches a settlement (tick ≥ 2). Drive with `window.__DEBUG.tick(n)`, then read `window.__DEBUG.getMeetingState()`. Combinable with `&seeded` (`firstunmet` wins on the First). Prefer `&size=medium` — the identity derives a `large` map (THR-162). |
| `?view=game` | Quick-start game view — ascendant archetype only, **no identity**, no First. Identity-less paths only. **Not** a route to the MeetTheFirst flow: `GameView` mounts that only on `meetingState && ascendantIdentity`, and this URL supplies no identity, so the beat can never render (THR-874). Use `?view=game&firstunmet` instead. |
| `?view=glow` | Magic glow tile preview |
| `?view=codex` | Game codex — browsable catalog of divine actions, possessions, conditions, agreements, mortal actions |
| `?view=styleguide` | **Visual component reference.** All shared primitives with sample data — see what components look like before building UI. |
| `?view=cms` | Content browser |
| `?view=cms#ia-surfaces` | **IA manifest viewer.** Browsable Information Architecture commitment doc — all surfaces with view/mount badges, reads[] tables, and "Open this surface" links. |
| `?view=ul` | **Ubiquitous Language dashboard.** Browseable + searchable glossary across all 7 UL shards with cross-shard search, See-Also navigation, and drift badges. Reads `src/data/ul-dashboard.generated.json` (refreshed via `npm run generate-ul-dashboard`; auto-rebuilt on `npm run build`). |
| `?nofog` | Disable fog of war (fog is ON by default). Combinable: `?view=game&seeded&nofog` |
| `?forceencounters` | **Testing lever (THR-878).** Forces every threaded (non-dormant court position) agent's encounter to render and pop up as if the agent were The First — full prose, full choice set, immediate interrupt instead of silent background/shaping resolution. For reviewing new encounter content (e.g. Nudge Model WS5 batches) without hunting for a rare tug badge. Works on the deployed build too (URL flag, not `window.__DEBUG`). Unthreaded/dormant agents stay invisible — this widens what a threaded agent shows, it does not surface the whole world. Combinable: `?view=game&seeded&forceencounters` |
| `?spawn=<templateId>` | **Direct-URL encounter spawn (THR-883).** Stages the named encounter template on `@hero` at the attended tier and opens it as soon as the world can resolve an agent — a shareable one-click review link for a specific encounter. **First stamps the target as the balanced test avatar** (equal mid-competent capability in all 8 reaches — `DEV_TEST_AVATAR_REACH_RAW`, tuned so a `fair` step forecasts `uncertain` — neutral value axes so THR-894 forks stay reachable both ways, essence floor in all 12 spheres), so review is never skewed by the seeded identity's reach spread. Works on the deployed build (URL flag, the `?forceencounters` pattern). Fail-soft: an unknown id retries briefly, warns once, and the game proceeds. Example: `?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge` |
| `?testavatar` | **Balanced test avatar without a spawn (THR-883).** Applies the same balanced stamp to `@hero` for free play — balanced encounter testing across all reaches and spheres wherever the simulation goes. Combinable: `?view=game&seeded&size=medium&testavatar&forceencounters` |

**For all testing, use `?view=game&seeded`** — this skips the remembrance flow, ascendant selection, AND the Meet The First encounter, loading directly into a fully populated game with a bonded First agent. Only use bare `?view=game` when testing identity-less paths, and only test the worldgen/selection/remembrance screens when those screens are the subject of the test. **When the Meet-The-First beat *is* the subject, use `?view=game&firstunmet&size=medium`** — `&seeded` pre-bonds The First and makes the beat unreachable by construction (THR-874).

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

```

**`src/debug-bridge.d.ts` is the API reference** — every method carries JSDoc with its match semantics and return shape; `src/debug-bridge.ts` is the implementation. Read the `.d.ts` rather than asking for a list. Capability areas available there: debug-panel control (`F1` opens straight to the CLI tab; backtick toggles; the in-game CLI accepts pasted multi-line batches), tracing, profiling, health/crash diagnostics, agent navigation, action listing + firing, aftermath reactions, reach signatures, fog of war, encounter-log TSV export, prose-quality audit, orphaned action cards, outcome-ladder distribution + KPI verdicts, ascendant progression, entity-visual resolution, and the war readout (armies/battles).

## Documentation Strategy

Four surfaces, each with a distinct purpose. Full ownership rules and duplication policy: **`Docs/documentation-ownership.md`**

- **Obsidian vault** — Two roles. (a) Domain model: systems, mechanics, terminology (wikilinks) — read `Index.md` first. (b) **Exploratory design drafts** (`Brainstorms/YYYY-MM-DD-<topic>.md`): brainstorming and rapid-prototyping thinking lives here, not in the repo — no git, no PR, no CI, no lint, rewrite freely. It is promoted into `Docs/plans/` **only when its issue moves toward Ready for Dev**, and governance applies from that moment (THR-918). The vault is not git-backed, so an unpromoted draft has no history — that is the accepted price of zero ceremony. See `Docs/canon/process.md` § Plan-doc lifecycle.
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

### Obsidian vault

Vault work goes through the **filesystem**, not the Obsidian MCP — set `OBSIDIAN_VAULT_PATH` (see § Known Sandbox Limitations). The vault's structure, maintenance scripts, and frontmatter conventions live in **`Docs/documentation-ownership.md` § Obsidian Vault as LLM Knowledge Base**; each `vault-*` skill documents its own workflow.

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

**First, classify the diff (THR-917).** The gate below has two tracks, and which one you owe depends on whether your change contains code. Run:

```bash
git diff --name-only origin/main...HEAD | grep -vE '(\.md$|^Docs/|^Design/|^\.planning/|^src/data/ul-dashboard\.generated\.json$|^public/system-interface-map-reference\.html$)'
```

Empty output means **docs-only**; any output means **code**. This is the same predicate CI uses — `ci.yml`'s `detect` job filters on `'**', '!**/*.md', '!Docs/**', '!.planning/**', '!Design/**'` plus the two exact paths above, and skips the entire `Test · Typecheck · Build` job when nothing survives it. Vercel skips too: `vercel.json`'s `ignoreCommand` only builds when `src`, `public`, `scripts`, `index.html`, or the build config change.

**Why those two paths are doc-excluded despite living in `src/` and `public/` (THR-922).** Both are generated *from* documentation — `src/data/ul-dashboard.generated.json` from the UL shards, `public/system-interface-map-reference.html` from `Docs/canon/interface-map.md` — but written outside the doc paths. Without the exclusion a UL-shard edit regenerates a `src/` file, the PR stops classifying as docs-only, and a pure documentation deliverable pays the full ~15-minute code gate (measured on commit `cc7a61ca`). Excluding the *artifact* cannot weaken detection: a code source is its own path and stays in the filter. Their freshness is still proven on every docs PR by `check:generated-freshness` in the `Docs gates` job. A third such artifact is now blocked at CI time by the coupling guard in `scripts/generated-artifact-sources.ts`, so this list cannot grow silently.

**Docs-only diffs owe steps 3b, 5, and `npm run check:impediment-ids` — and nothing else.** Do not run `npm test`, `check:typecheck`, `vite build`, or the engine smoke on a change with no code in it. They cannot fail on a markdown edit, they cost ~15 minutes of CI (or ~70s locally) to prove it, and no automated gate downstream asks for them. Until THR-917 this section read "always do these", which was stricter than every gate it existed to pre-empt and was in practice obeyed at random — of the ~18 most recent docs-only commits exactly one carried test evidence.

**Two cautions on the docs-only track.** First, the three doc-validating gates (`check:generated-freshness`, `check:impediment-ids`, `check:wiki-freshness:blocking`) now **do** run on a docs-only PR: THR-909 (shipped 2026-08-01, PR #1210) moved them into a dedicated `Docs gates` job fired on `docs == 'true' && code != 'true'`, so exactly one of the two jobs runs them and never neither. Run them locally anyway — they are seconds, and catching a duplicate id before the push beats catching it after. `Docs gates` became a **required status check** on `main` on 2026-08-01 (THR-931), so a red one blocks the merge on its own and its conclusion no longer needs reading by hand. **It landed in a ruleset, not the classic branch-protection rule** — `main` is governed by two surfaces, and this check lives only in ruleset `15479914` (enforcement `active`), so an auditor who inspects the classic rule alone will find `Docs gates` absent and reasonably conclude it was never done. Confirm with `gh api repos/christianspliid-ui/threadbare/rulesets/15479914 --jq '.enforcement, ([.rules[] | select(.type=="required_status_checks") | .parameters.required_status_checks[].context])'`. Second, if the diff turns out to contain a stray source file, you are on the code track: re-classify rather than trusting an earlier answer.

**Code diffs — the full gate (do all of these):**
1. `npm test` — all tests pass
2. **Typecheck — do NOT run `npx tsc --noEmit`.** It is a **no-op** in this repo: the root `tsconfig.json` sets `files: []`, so it exits 0 unconditionally no matter how broken the code is. Citing its exit 0 as evidence is gate theater (THR-686). The authoritative type gate is CI's `Test · Typecheck · Build`, whose Typecheck step runs `npm run check:typecheck` — a **ratchet** (THR-693): it runs `tsc -b --force`, compares the error count against the committed `typecheck-baseline.json`, and fails only on an **increase**. It does not require a green baseline, and the ~3529 pre-existing errors (THR-489) are not yours to fix. Locally, run the same command: `npm run check:typecheck`. It is the identical gate, so a local pass means CI passes. If you legitimately change the count, refresh with `npm run check:typecheck -- --update` and commit the baseline, saying why in the commit body. (Until THR-693 the step ran `npx tsc --noEmit`, which is a no-op here and could not fail — citing its exit 0 was gate theater, THR-686.)
3. `npx vite build` — production build succeeds (confirms Vercel will deploy). **Note this bypasses the npm `prebuild` hook**, so it does *not* refresh generated artifacts — that is what step 3b exists for.
3b. `npm run check:generated-freshness` — regenerates every committed generated artifact and fails if the commit carries a stale one. **Blocking in CI** (THR-690). Required whenever the change touches action templates, the UL shards, `Docs/impediments.md`, or a design-wiki page. Fix by running `npm run prebuild` and committing the result. **Run this step LAST — after every closeout edit, including the impediment-log and doc appends of the Definition of Done** (THR-755 row 6, impediment #201). It compares against `HEAD`, and `Docs/impediments.md` is a generated-artifact *source*: running it at its numbered position means the closeout impediment you are about to log is not yet in the tree, so the run passes and the commit still ships a stale dashboard. Numbered 3b because that is where it sits in the gate list, not where it runs.
3c. `npm run check:wiki-freshness:blocking` — **Blocking in CI** (THR-730). Fails if a changed file matches a wiki page's `sources` glob (`public/wiki-manifest.json`) without updating that page/payload. Required whenever the change touches a core game system documented by a wiki page. Fix by updating the page in the same PR, or — for a behavior-neutral change — add a `Wiki-freshness-exempt: <reason>` line to a commit body. (Local `npm run check:wiki-freshness` stays advisory.) **Run this step LAST as well, alongside 3b** (THR-896). It diffs the *working tree* against `origin/main`, so its verdict covers only the tree at the instant it runs — and `scripts/interface-contracts.ts` is one of its declared `sources`, edited by the **later** Definition-of-Done step *"Update the interface map"*. Following the checklist in written order therefore greens the gate, then edits a source, then pushes a tree the gate never inspected: exactly how THR-872's PR #1152 recorded `OK — 24 pages, no stale` in its closeout evidence and failed the same required check in CI (impediment #335).

> **The general rule, so a third such gate does not need a third bespoke note (THR-896).** Both 3b and 3c are scoped to the tree at the moment they run, and each has a `sources` file that a *later* closeout step edits — `Docs/impediments.md` ← "Log impediments" for 3b, `scripts/interface-contracts.ts` ← "Update the interface map" for 3c. So treat **every tree-diffing freshness gate the same way: run it as the last action before `git push`**, after the closeout edits, never at its numbered position. The numbers say where a gate sits in this list, not when it runs. A gate whose evidence you captured before your final edit is evidence about a tree you did not ship.
4. `npm run check:process` — advisory workflow/process lint (non-blocking while it stabilizes)
5. `npm run lint:plan-doc` — advisory plan-doc structure lint for `Docs/plans/*.md` (non-blocking while it stabilizes)
6. Verification evidence is mandatory at closeout: paste raw terminal output for steps 1-3 (and step 7 when applicable) in the closing commit body or Linear completion comment, or link to a green CI run for the same commit. **On the docs-only track, the evidence is the classification plus the gates you did run** — paste the `git diff --name-only … | grep -v …` output showing it was empty, and the output of steps 3b/5/`check:impediment-ids`. Do not paste test output you did not need to generate, and do not claim a gate you skipped.
7. **Engine smoke (engine changes only):** if the change touches anything under `src/engine/`, `src/types/gameState.ts`, `src/types/graph.ts`, or any tick-loop / orchestrator / phase / agent-decision file, run a 30-tick CLI smoke before commit. Invoke as: `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`. **Pass criterion:** the run reaches tick 30 without thrown exceptions, the `status` block prints a non-zero agent count, and at least one trace/event line appears in the output. Paste the last ~10 lines (the `status` output) into the closing comment as evidence. If the smoke fails or stalls, do not commit — investigate first.

> **CI runs these automatically — on code changes.** GitHub Actions runs tests, typecheck, and build on every push and PR to `main` **whose diff contains code**; a docs-only PR records `Test · Typecheck · Build` as `skipped` and merges in ~30–60 seconds (measured across PRs #1163, #1165, #1173, #1174 on 2026-07-31). That skip is by design and is why the local gate above has a docs-only track. Vercel runs only `vite build` (no test gate), and its check is **deliberately not required and must not be made required** — see the Deploy bullet under § Definition of Done for why, and for the command that actually confirms a deploy. **Branch protection is active on `main`** — `Test · Typecheck · Build` is a required status check, strict mode (branches must be up to date), no admin bypass on in-progress checks (THR-282 shipped 2026-04-30). Direct `git push origin main` is rejected — all changes must go through a PR. Still run locally before pushing to catch failures early. **Merge = Done (THR-487):** there is no separate review gate. A merged PR carrying `Fixes/Closes/Resolves THR-XX` **on its own line** in the **PR body** (as well as the commit body — impediment #140) auto-transitions the issue straight to **Done** via `.github/workflows/linear-autoclose.yml`; the required `Test · Typecheck · Build` check on `ci.yml` is the merge gate. **The workflow is line-anchored (THR-738)** — the keyword inside a prose sentence, a markdown bullet, or a branch/title token does not close; never quote `Fixes THR-XX` in prose for an issue you are not closing.

## Known Sandbox Limitations

The Claude Code automation sandbox has several quirks that recur often enough that agents waste time rediscovering them. **Read this before debugging environment failures.** (Carried from 2026-04-11 retro; first-class entry per 2026-04-18 retro.)

- **`rg.exe` (ripgrep) is blocked / absent in the agent sandbox** — direct `rg.exe` invocation fails with `Access is denied` or `ENOENT` even on standard repo paths. The `Grep` tool works fine — it does not call `rg.exe` directly. **Workaround for shell use:** use PowerShell `Get-ChildItem -Recurse -Filter <pattern> | Select-String <regex>` instead of `rg`. Repeated occurrences: impediments #15, #28, #33, #37 (≈19 hits).
- **PowerShell variable scoping leaks across blocks.** Variables assigned inside `foreach`/`if` blocks remain visible at the surrounding scope, which can mask bugs in throwaway scripts. **Workaround:** prefer small checked `.ps1` files over inline one-liners when logic is non-trivial; for complex regex with mixed quoting (impediment #44), write to a script file rather than escaping inline.
- **`npm test` may time out at sandbox-default limits** on the full suite. **Workaround:** run scoped subsets via `npx vitest run <path>` for fast feedback; full-suite runs should be kicked off with explicit longer timeouts. The "test suite is red on main" baseline (impediment #22, recurring as #30, #31, #32, #34, #38, #39, #54) is a separate, real engineering problem — see TB-120.
- **`esbuild` / `npm install` may fail with `spawn EPERM`** in restricted sandboxes (impediment #21). **Workaround:** retry once, then fall back to running the failing step on the user's machine; do not loop indefinitely.
- **Bash-tool heredocs silently corrupt file content** (impediments #211 ×2, #329, #352). A quoted heredoc (`cat > f << 'EOF'`) has eaten backslashes from regex literals and failed to parse with `unexpected EOF`; content piped through `node -e` / `python - <<PY` inside a double-quoted shell string corrupts twice over. **Workaround:** write files with the Write/Edit tools, never via shell heredocs; if a shell must produce a file, write the script to a `.ps1`/`.mjs` file first and run it.
- **Worktree `node_modules` is unreliable in every direction** (impediments #203, #207 ×2, #283 ×2, #287 ×2, #294 ×3, P95 — ~10 occurrences in one week): fresh worktrees arrive with none, reused pool worktrees carry an empty real directory holding only Vite caches, and the home tree's own `node_modules` has lost `.bin` while packages sat intact. **Workaround:** before trusting any npm script in a worktree, probe `[ -e node_modules/.bin/vitest ]` — not just `[ -d node_modules ]`; on failure run `npm install`, or junction to a *verified-healthy* home `node_modules` (PowerShell `cmd /c mklink /J` — Git Bash mangles the target path, impediment P69; `rmdir` any stub dir first).
- **Linear `save_issue` returns 200 but does not always update state** (impediment #48). **Workaround:** always verify-after-write by re-querying the issue; do not trust the success response alone.
- **Linear `list_issues orderBy: 'priority'` is rejected at runtime** even though the schema accepts it (impediment #49). **Workaround:** omit `orderBy` (or use `createdAt` / `updatedAt`) and sort by priority in memory.
- **Obsidian vault writes go through the filesystem, not the MCP** (structurally closed 2026-07-21, THR-654 — was impediments #66, #71, #75, #86, ~12 occurrences over 8 days of silently-dropped `log.md` appends). Vault skills write directly to `OBSIDIAN_VAULT_PATH`; if unset, they fail loud rather than dropping the entry. Add to `.claude/settings.local.json`: `{ "env": { "OBSIDIAN_VAULT_PATH": "C:\\Users\\chris\\Dev\\Obsidian" } }`.

- **The CC harness mutates the home tree's git state at session spawn** (THR-671/672, proven 2026-07-20) — two behaviors, neither attributable to any agent (no transcript across any project directory contains the commands, and agent shell commands always transcript): (a) an hourly empty-reflog-message update of `refs/heads/main` via plumbing, and (b) a bare `git checkout HEAD` that parks the home tree on a detached HEAD — observed three mornings running. Moving `main` under a checked-out tree manufactures phantom "staged" diffs that look like catastrophic damage but are not. **This is harness-level and cannot be fixed from the repo.** **Containment:** `threadbare-autosync.ps1` reattaches the provably loss-free park (detached ∧ 0 unique commits ∧ 0 tracked modifications → `git switch main`) within the hour; any other detached state is left untouched with one loud log line carrying the manual repair. Never read a behind-count off a detached HEAD — `HEAD..origin/main` on a parked HEAD is arithmetically true and semantically meaningless (see the freshness-signal table in § Session Workflow). Upstream bug report: [anthropics/claude-code#79713](https://github.com/anthropics/claude-code/issues/79713) (filed 2026-07-21; report body at `Docs/audits/2026-07-20-git-cicd-forensics/upstream-report.md`).
- **An untracked file in the home tree stops autosync permanently when `main` later commits the same path** (THR-937, measured 2026-08-01). A fast-forward that must *create* a file refuses to clobber an untracked one sitting there, and aborts the whole sync — so the tree stops updating and **never resumes on its own**, because every later hour re-hits the identical collision. Measured: 11 consecutive hourly skips, `24 → 88` commits behind. The producing pattern is a scheduled lane writing a report into `Docs/ops/` **in the home tree** and then committing the same bytes **from its own worktree** (impediment #269) — which is exactly why the rule below exists. Note "untracked files never block a fast-forward" is a **false** premise that lived in autosync's own comments; they block precisely when the incoming commits add that path. **Containment:** autosync step 5.5 now deletes such a file when `git hash-object` matches the incoming blob sha (loss-free by construction — identical bytes arrive in the same commit) and leaves anything that differs untouched with one loud log line. **Detection:** a repeating `skip:` / `MANUAL REPAIR NEEDED` line in `C:\Users\chris\bin\threadbare-autosync.log`. Do not diagnose this from a behind-count alone — a growing count with a *healthy* cadence is phase, not decay.
- **Scheduled sessions must never run git state ops with the home tree as CWD** (THR-672) — no `checkout`/`switch`/`commit`/`merge`/`rebase`/`reset` against `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator`. It is a read-only mirror of `main` owned by autosync; the since-retired `flush-plan-docs` (07-17) and `keep-work-flowing` (07-19) tasks each left it parked on a session branch, stalling autosync for days. **Workaround:** home-tree access is read-only `git -C` queries and file reads; all branch/commit/push work happens in the session's own worktree (branches are repo-global, push works from any worktree).
- **A reaped worktree silently retargets git at the home tree** (THR-797, evidenced 2026-07-26) — a third route into the THR-671/672 family, and the only one where a *live session can author commits onto `main`*. `.claude/worktrees/<name>` sits **inside** the home tree's working copy, so when the hourly reaper deletes a worktree's `.git` file, git's discovery walks *up* and finds the home tree's `.git`. The next `git checkout -b …` then creates and checks out that branch **in the home tree, with no error**: `pwd` still reads the worktree path while `git rev-parse --show-toplevel` has become the home tree. The tell is an `Edit` failing "File does not exist" on a file `grep` just matched — two commands resolving against different trees. **Detection (cheap, do it before any git state op late in a session):** `[ -e .git ] || echo "WORKTREE GONE"`, or compare `pwd` against `git rev-parse --show-toplevel`. **Repair** is the THR-671 park recipe: confirm `git -C "$HOME_TREE" rev-list --count origin/main..HEAD` is 0, then `git -C "$HOME_TREE" switch main && git branch -D <stray> && git pull --ff-only origin main`. **Containment shipped:** the reaper's liveness guard now also reads *working-tree* file mtimes, not only git-admin-dir mtimes — a session doing closeout (Linear, docs, impediments) writes files for hours without touching git, which is exactly how the 2026-07-26 worktree aged past `WORKTREE_MIN_IDLE_MINUTES` while still alive. It additionally holds a `WORKTREE_MERGE_GRACE_MINUTES` window after the merge, and refuses to delete a branch whose unregistered worktree corpse is still active. **Note the harness owns `.claude/worktrees/`,** so relocating it out from under the home tree — the other candidate fix — is not available to us.

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

**Authoritative home: [`Docs/canon/design-governance.md`](Docs/canon/design-governance.md).** Load it before any design pass — it carries the full workflow checklist (Steps 0–8.6), the Per-system required sections, and the maintenance rules. Two things stay here because they gate whether a design is allowed to exist at all:

- **Never present a non-compliant design.** Draft → audit → revise → summarize happen in a single internal pass, before the user sees anything. If an NFP conflict is structural (not just a missing constant), surface it as a trade-off rather than hiding it.
- **Three-Pillar Rule.** Every feature touches **Engine** (systems, tick loop, graph), **Content** (encounters, prose, templates, data), and **UI** (components, modals, HexMap, player controls). **Do not move an issue forward unless all three pillars are addressed or explicitly marked N/A with rationale** — one- and two-pillar plans produce incomplete features that the executor rightfully defers. Exit criteria: `Docs/plans/2026-04-13-linear-coordination-protocol.md`.

<details>
<summary>Relocated 2026-07-26 (THR-760) — what moved</summary>

The design-workflow checklist, Per-system required sections, and Maintenance-and-review bullets moved verbatim to `Docs/canon/design-governance.md`; no rule changed. `Docs/canon/process.md` points there.

</details>

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
  - **The keyword must stand ALONE on its own line (THR-738).** Our `linear-autoclose.yml` workflow is **line-anchored**: it closes only when a full line reads exactly `Fixes|Closes|Resolves THR-NNN` (trailing whitespace ok). The keyword buried in a prose sentence — `Fixes THR-74 still rides the final PR`, a markdown bullet `- Fixes THR-74 …`, or any line with content past the id — does **not** close. This kills the phantom-Done vector where prose that *documents* the discipline was itself a trigger (THR-74 swept to Done ×2 on 2026-07-24). **Corollary: never quote the keyword in a checkpoint comment, a PR body sentence, or a commit-body sentence.** If you must reference an issue you are *not* closing, write the bare id (`THR-74`) with no `Fixes/Closes/Resolves` in front of it. One issue per line; to close several, use one deliberate line each.
  - **Vectors 2 & 3 (branch name, bare `THR-XX` title token) are killed by a Linear-side settings change, not this workflow** (THR-738). Linear's native GitHub integration links + auto-closes from the branch name and title, which this repo cannot configure. The Christian-owned settings change that disables native auto-close (leaving this deterministic workflow the sole closer) is recorded in `Design/user-actions.md` (on the `ops` branch — `git show origin/ops:Design/user-actions.md`).
  - **Put `Fixes THR-XX` in the PR description body too, not only the commit body.** When the merge is a non-squash merge commit (`Merge pull request #N…`), GitHub's merge commit does **not** carry the feature commit's body, so Linear's integration never sees the keyword and the auto-close silently misses (impediment #140, THR-453). The keyword must appear in the PR body (on its own line) so the close fires regardless of merge strategy.
- [ ] **Push** to GitHub (`git push`, with `-u origin <branch>` if needed)
- [ ] **Merge** feature branches into main immediately — don't leave branches waiting. **Queue it with `gh pr merge --auto --merge` and move on; do not poll-wait on CI** (THR-675). GitHub holds the merge until the required `Test · Typecheck · Build` check is green and merges with no session present. Branch protection and the required check are unchanged — auto-merge removes the waiting, not the gate.
  - **The command is the same under GitHub's merge queue (THR-946), which is the decided fix for the `BEHIND` livelock.** `ci.yml` reports both required checks on `merge_group` events as of 2026-08-02, so the agent half is done; the queue itself is off until Christian enables it on `main` (`Design/user-actions.md`, on the `ops` branch). Once it is on, `--auto --merge` **enqueues** rather than merges: GitHub builds a merge group on latest `main`, tests that exact tree, and lands the group in order — so a green PR stops being knocked `BEHIND` by someone else's merge and `gh pr update-branch` stops being needed. `DIRTY` conflicts, the `SKIPPED`-required-check refusal, and the `Fixes THR-XX`-in-the-PR-body rule are all unaffected. Do not infer the queue is live from the trigger's presence — see `pull-work` Step 0.8 for the one-line liveness probe.
- [ ] **Deploy** — Vercel auto-deploys from GitHub on push to `main`. **A successful push is not proof of deployment** (THR-785): `main` can advance while the deployed artifact does not, and the only native signal is a red `Vercel` check that is deliberately *not* required, so the lane is trained to step past it. Confirm with one command: `npm run check:deploy` (verdicts `deployed` / `skipped` are healthy; `failed` / `stale` are not). **Do not use `gh api repos/christianspliid-ui/threadbare/commits/<sha>/status --jq .state` as the confirmation** — measured 2026-07-27 it returns `success` for a commit with *no deployment record at all*, because `vercel.json`'s `ignoreCommand` skipped the build and Vercel reports a skip as a successful status. The probe reads the deployments API instead and judges a skip benign only when nothing build-relevant changed. You do not have to block on this — the hourly `keep-work-flowing-cc` brief runs the same probe and surfaces `failed` / `stale` to Christian within the hour.
  - **Vercel is not a required check and must not become one.** It is not a correctness gate — `Test · Typecheck · Build` already proves the build compiles — and promoting it would couple every merge to a third-party service's availability. The fix for a silent deploy stoppage is a *notification* path (the hourly probe above), never a new merge gate.
- [ ] **Update docs** — `project-status.md` (≤60 lines, move old entries to `project-history.md`), `project-history.md` (one-line `✅` entry), `changelog.md` (append rows). Add a completion comment to the Linear issue (the `Fixes THR-XX` keyword in the commit auto-closes it, but a human-readable comment is still expected). These three append-only docs are marked `merge=union` in `.gitattributes` (THR-691), so a stale branch's table rows merge cleanly **locally** — GitHub's server-side merge ignores the attribute (measured), so a PR that idles into `CONFLICTING` is fixed with `git merge origin/main && git push`, not the web resolver. See `.claude/skills/pull-work/SKILL.md` § "Closeout — resolving a conflicted closeout-docs PR". `project-status.md` is excluded by design.
- [ ] **Verify wiring** — Check every new module against `Docs/plans/wiring-checklist.md`. Engine modules called from orchestrator, modals rendered in GameView JSX, GameState fields consumed by UI, traces emitted, player controls connected. Update the checklist if new surfaces added.
- [ ] **Browser-verify UI changes** — If the change touches the UI pillar (any file under `src/components/` — which contains every HexMapV2/Three.js surface and all component-local CSS — `src/hooks/`, `src/contexts/`, or `src/index.css`), the closing commit body or Linear completion comment MUST include:
  1. **At least one screenshot** of the changed surface at 1920×1080 (the contractual viewport — see `## Viewport Contract`). Use Playwright `browser_resize(1920, 1080)` then `browser_take_screenshot` for DOM surfaces; use Claude-in-Chrome `mcp__Claude_in_Chrome__computer` with `action: "screenshot"` for any HexMapV2 / Three.js / WebGL surface (Playwright cannot see canvas content — see CLAUDE.md viewport contract). Which capture satisfies this depends on the lane and the surface — see the sanctioned routes below.
  2. **Console output** captured via `mcp__playwright__browser_console_messages` or `mcp__Claude_in_Chrome__read_console_messages` (errors + warnings filter), pasted as a fenced block. Empty output is a valid result — embed `(no errors or warnings)` in that case.
  3. **State assertion via `__DEBUG`** — at least one query of `window.__DEBUG.*` proving the new state field, surface, or interaction is wired. Use the bridge documented in CLAUDE.md §Debug Bridge.

  **Re-deriving the trigger list (THR-889).** Check it against the tree with `ls -d src/*/ && git ls-files '*.css'` and keep the entries that hold React components, UI-behaviour hooks/contexts, or global CSS — never add a path without confirming it resolves. Four of the five paths this list named until 2026-08-02 (`src/views/`, `src/styles/`, `src/hooks/use*UI*`, and a root-level `index.css`) matched nothing at all, which is the failure mode to watch for: a trigger naming phantom paths reads as *narrower* than it is, and this is the clause deciding whether a change owes evidence at the moment someone is looking for a reason to skip it.

  **Sanctioned evidence routes for requirement 1 (THR-754).** The clause stays binary — what varies is *which* capture discharges it. Every deviation below is recorded in the commit body as `Browser-verify substitution: <route> — <reason>`, mirroring `Browser-verify exempt:`.
  - **Attended / interactive session:** unchanged — Playwright for DOM, Claude-in-Chrome for HexMapV2 / Three.js / WebGL. Subject to the Claude-in-Chrome viewport rule below.
  - **Unattended run (scheduled / headless):** the Browser pane cannot composite with no pane displayed, so the sanctioned capture is Playwright MCP — `browser_resize(1920, 1080)` → navigate → `browser_take_screenshot` with an **absolute** `filename` inside the session worktree (a bare filename writes outside the repo and is unrecoverable — impediment #199c).
  - **Playwright pre-capture ritual (2026-07-31 retro; impediments #257 ×3, #318 ×2, #319, #327 — the failures are silent and the capture looks like valid evidence).** The Playwright MCP server outlives sessions: it attaches to whichever browser page and worktree it already has open, its allowed write roots track the worktree it *started* in, and `browser_resize` does not survive `browser_navigate`. Before the contractual capture, always: (1) `mkdir -p .playwright-mcp` in the session worktree — Playwright does not create the parent dir, and a fresh worktree's first capture otherwise fails `ENOENT` (which is *not* the allowed-roots wall; read the error text before reaching for the copy workaround); (2) read the `Page URL:` line every Playwright call echoes and explicitly `browser_navigate` to the port *this session's* `preview_start` returned — otherwise the screenshot can capture another session's stale build on another port; (3) in the same `browser_evaluate` pass as the capture, probe a symbol that exists **only** in this change, so a wrong-tree capture is impossible rather than merely unlikely; (4) re-assert `browser_resize(1920, 1080)` and read `innerWidth`/`innerHeight` immediately before the screenshot — a resize verified earlier in the session silently reverts across navigations. If `File access denied … Allowed roots: <other worktree>` still appears, the roots are pinned to a stale worktree (#257): write into the root the error names, `cp` the file into the session worktree, and delete the original so the reaper does not misread the foreign tree as active.
  - **The Claude-in-Chrome viewport is not settable (THR-796).** `resize_window` is **inert** on that surface — it returns `Successfully resized window … to WxH` while the viewport does not move. Measured 2026-07-27 in *both* directions from a fresh session: requesting 1920×1080 and then 800×600 each reported success and each left `innerWidth`/`innerHeight` unchanged. The resting value is not a constant either (1430×989 on 2026-07-26, 1499×1231 on 2026-07-27) — it tracks whatever the window/side-panel layout happens to be, so it varies per session and cannot be predicted or requested. `outerWidth`/`outerHeight` read `0×0` from the extension context, so the tool cannot even self-check. **Never present a Claude-in-Chrome screenshot as a 1920×1080 capture**: measure `innerWidth`/`innerHeight` in the same pass and report those actual numbers. The success string is not evidence the viewport changed. (The Browser pane is the opposite — `resize_window` there sets the viewport exactly; it just cannot composite unattended.)
  - **Honest dimensions.** If the capture's real size differs from 1920×1080 — which for the Claude-in-Chrome route is *always*, per the rule above — state the actual dimensions — never imply the image matched the contract — and evidence the viewport contract separately by DOM assertion from the Browser pane, which resizes correctly even when it cannot composite: `innerWidth`/`innerHeight`, `document.documentElement.scrollWidth <= innerWidth`, and the target's `getBoundingClientRect()` proving it is in-viewport.
  - **Portal-rendered overlay** (shared `Dropdown`, anything portalled over the canvas): CDP omits the late-painted portal layer entirely, so an accessibility-tree capture (`read_page` on the open panel) is the accepted proof of visual content, paired with a closed-state screenshot of the trigger.
  - **Simulation advancement** for any "run N ticks, then observe" evidence: `window.__DEBUG.tick(n)` only — an automated tab reports `document.hidden`, which throttles the interval loop to ~1 tick/click. See §Debug Bridge.

  **Three reasons this is binary, not advisory:** (1) snapshot tests miss paint regressions; (2) TypeScript misses overflow/z-index/off-viewport rendering; (3) Playwright cannot see WebGL canvas content. Without a browser pass, those failure modes ship unseen. Pocock: "if you're building a front-end app and you're not giving the LLM access to the browser, that's crazy."

  **Exempt:** changes that touch only types/interfaces with no runtime UI (e.g. extending a prop type without changing render behaviour), pure refactors verified by snapshot+typecheck. The exemption is opt-in and must be stated in the commit body: `Browser-verify exempt: types-only refactor, snapshot tests cover render`.
- [ ] **Update the interface map** — if the change adds, retires, or reroutes any cross-system read/write named in `Docs/canon/interface-map.md`, update the row (and `scripts/interface-contracts.ts`) in the same PR. Retiring a contract **deletes or repoints the tests that assert its dead side** — green tests on a dead contract are the pathology this map exists to kill; a LEAKED-with-ticket contract's asserting tests carry the ticket reference in a comment. `npm run generate-interface-map` fails the build if a contract classifies LEAKED without a remediation ticket.
- [ ] **Update the Design Reference Wiki** — If your change touches a core game system documented by a wiki page (see the `sources` globs per page in `public/wiki-manifest.json`), update that page (or its declared `payloads`) in the same PR. This is a **blocking CI gate** (THR-730, user verdict 2026-07-23): the required `Test · Typecheck · Build` check runs `check:wiki-freshness:blocking` and **fails** a PR whose changed files match a page's `sources` without updating that page. For a genuinely behavior-neutral change (pure refactor, rename, type-only move) that matches a glob without altering documented behavior, add a `Wiki-freshness-exempt: <reason>` line to a commit body — an opt-in, auditable escape hatch (mirrors `Browser-verify exempt:`); the CI log prints `EXEMPT — <reason>` and the weekly hygiene routine audits it. A core-system change that ships without its page update is documentation drift by definition (user directive 2026-07-03; see `Docs/plans/2026-07-03-game-manual-wiki.md` and `Docs/plans/2026-07-23-wiki-freshness-blocking-gate.md`).
- [ ] **Update systemic wiring guide** — If your change adds or modifies a content-facing engine capability (new effect type, new graph operation, new enrichment placeholder, new aftermath reaction kind, new template field, new scoring signal), update `Docs/plans/2026-04-16-systemic-wiring-guide.md`. This guide is the IKEA manual for content authors — if a capability isn't documented there, content agents won't use it and the game gets hardcoded prose instead of systemically alive content.
- [ ] **Log deferrals** — Every `// TODO`, `// DEFERRED`, or `// PHASE-X-DEFERRED` comment added in this session MUST have a corresponding Linear issue. Use format `// TODO(THR-XX): description`. No orphan deferrals — if you deferred it, track it. Label the issue `Deferral` and assign it to the same project as the parent work. A deferral without a Linear issue is invisible tech debt.
  - **File it with its coordination block (THR-836).** An issue you create *directly* into `Ready for Dev` bypasses both authors of that block — the design-session handoff and the orchestrator's T1 promotion — so nothing else will ever write one. Post the three lines (`Suggested model`, `Parallel-safe with`, `Mutex with`, each with its reason per THR-688 rule B) as the new issue's **first comment**, in the same pass that files it. You are the only party who knows which files it touches, and you know them now; a later session would be guessing. A self-scoped ticket filed without one is still claimable — `pull-work` Step 3 derives the block at claim time rather than bouncing — but that shifts work onto every future pickup instead of spending one comment once.
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

### Scheduled Tasks

**Registry: [`Docs/ops/scheduled-tasks-registry.md`](Docs/ops/scheduled-tasks-registry.md)** — all four lanes (CC automation, GitHub Actions, Windows Task Scheduler, the Cowork lane pending disable), their cron *and observed fire time*, the reaper's guardrails, and the weekly continuous-improvement cycle. Slot name ≠ cron minute ≠ fire time; the registry's `Fires` column is the operational one.

Two rules stay here because they gate live session behavior:

- **Operational exhaust lives on the `ops` branch, not `main`** (THR-947, cutover 2026-08-02). The hourly briefing, the user-action list, and every scheduled lane's dated run report are published to an unprotected branch, so they cost no PR, no CI run, and — the point — no advance of `main`'s tip, which under strict branch protection knocks every in-flight PR to `BEHIND`. **Read:** `git fetch origin ops --quiet && git show origin/ops:Design/briefing.md`. **Write:** `bash scripts/ops-publish.sh -m "<msg>" <paths>` from a worktree's repo root. The membership predicate, what deliberately stayed on `main`, and where the frozen pre-cutover archive sits: [`Docs/ops/README.md`](Docs/ops/README.md).
- **`keep-work-flowing-cc` owns `Design/briefing.md` and `Design/user-actions.md`.** No other scheduled task writes either file — a second writer produces lost updates, since publishing to `ops` is last-writer-wins rather than a merge. Christian-facing items from any other task go in that task's own report under a `## Needs Christian` heading and reach him via the hourly briefing.
- **Registering a new task means recording it.** Pick a cron minute whose *jittered* fire time is clear of the existing ones, then record both the cron and the observed fire time in the registry file **in the same commit**. A live prompt lives outside version control at `C:\Users\chris\.claude\scheduled-tasks\<id>\SKILL.md` — when you edit one, update its mirror under `Docs/ops/scheduled-task-prompts/` in the same PR. The registry and the prompt mirrors are durable and stay on `main`; only the task's *output* goes to `ops`.

## Skill Tree Layout

**`.claude/skills/` is the only skill tree.** Claude Code reads it from a hardcoded path in the CC binary; every skill any Threadbare session can invoke lives there.

The repo used to carry a second tree at `.agents/skills/` for non-CC runtimes, kept in step by the THR-192 pre-commit hook and `npm run check:skill-sync`. Both were deleted 2026-07-21 (THR-654) along with the Cowork lane they existed to serve. The duplicate was the direct cause of the `check:skill-sync` false-positive commit blocks (62 mentions in `Docs/impediments.md`); that class is structurally closed. **Do not reintroduce a second skill tree** — add new skills to `.claude/skills/` only.

Six skills were retired rather than ported, because CC does Obsidian-vault work through the filesystem (`OBSIDIAN_VAULT_PATH`) instead: `content-catalog-manager`, `defuddle`, `json-canvas`, `obsidian-bases`, `obsidian-cli`, `obsidian-markdown`. `design-council` and `playtest-interface` were ported to `.claude/skills/` (THR-651, browser MCP verified from a CC session). Recover any retired skill from git history if it turns out to be wanted.

**When you edit a skill, bump `last_validated_against` to today's date** if you changed instructions, examples, or referenced systems. Skip bumps for typo-only/format-only edits. This field records an explicit correctness affirmation, not a file-modified timestamp. If you review a skill and confirm it is still accurate without content edits, you may still bump the date in a small one-line commit.

## Domain Skills

Every skill's own `description:` frontmatter carries its triggers, and the harness lists all of them each session — so there is no table here. Ask "which skill covers this?" and read that listing. What the listing cannot tell you is **load order**, which is what this section owns:

- **`state-of-game-design` router first**, before any other domain skill. It is a thin (~3 KB) orientation file that routes you to the one or two reference shards your task needs (`reference/cosmology.md` for content/cosmology, `reference/verbs-resolution.md` for engine, `reference/architectural-decisions.md` for plan/audit, `reference/deprecated.md` when proposing a pattern that might be rejected). Load the shards you need, not all four.
- **Prose/content work:** read the **systemic wiring guide** (`Docs/plans/2026-04-16-systemic-wiring-guide.md`) *before* picking a prose skill — it names the 7 engine capabilities (enrichment placeholders, encounter seeding, hidden marks, reputation flow, graph ops, intelligence, divine intervention). Skip it and you will write hardcoded fiction instead of systemic content. Then choose: `prose-pipeline` (resolver architecture), `prose-content-systems` (encounter templates, day-to-day content), `prose-vignettes-and-enrichment` (placeholders, vignettes).
- **Hex-map work:** `hexmap-core` before any layer work; `hexmap-layers` alongside it for signifiers/agents/fog/labels/trails.
- **Content authoring:** the relevant `Docs/canon/<domain>.md` is Step 0 — before any other reference material.
- **Always active:** `ubiquitous-language` (UL wins on every terminology disagreement; propose new terms via a Linear `UL-proposal`) and `impediment-reporter` (log friction as it happens — part of the Definition of Done). `Docs/canon/rulebook-quick-reference.md` is always-load; `Docs/canon/rulebook.md` for anything touching rules of play.
- **Pure narrative fiction unrelated to the game engine** uses the platform skills `anthropic-skills:cw-brainstorming` / `cw-prose-writing` / `cw-official-docs` / `cw-story-critique` *instead of* the prose skills above. These live on the platform, not in `.claude/skills/`, so they carry no repo-side description.

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
