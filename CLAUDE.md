This folder contains **Threadbearer** ([threadbearer.co](https://threadbearer.co)) — a systemic god-game/rogue-lite narrative simulation built in React + TypeScript + Vite. ("Threadbare" is the repo/Linear codename; "The Fantasy World Simulator" is the retired working title that survives only in paths. UL: `Docs/ubiquitous-language/Process.md` → Threadbearer.)

[![CI](https://github.com/christianspliid-ui/threadbare/actions/workflows/ci.yml/badge.svg)](https://github.com/christianspliid-ui/threadbare/actions/workflows/ci.yml)

## Rule Zero — every reference Christian sees is a clickable link (Christian, 2026-08-09)

**Any document, PR, Linear issue, file, or game surface you mention in Christian-facing text carries a direct URL he can click.** That covers chat responses, `Design/briefing.md`, `Design/user-actions.md`, Linear comments he will read, and batch-review reports. He is chat-only (THR-608): a bare path like `Docs/plans/2026-08-08-encounter-factory-workflow.md`, a bare "PR #1363", or "the spec" forces him to search a repo and board he deliberately does not work in — and every unlinked reference stalls the exact approval it was asking for. His words: *"i don't want to search for data or documents you refer to. i want direct links."*

- Repo files → the GitHub blob URL, pinned to `main` once merged (e.g. `https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md`), the branch URL before.
- PRs / issues → the full `github.com/...` / `linear.app/threadbare/issue/THR-XXX/...` URL, never a bare number.
- Game surfaces → the deployed-build URL with its query params (`?view=game&seeded&spawn=...`).
- **When asking for an approval, the links to the exact artifacts under review come *with* the ask** — not on request, not "in the PR".

Agent-facing text (commit bodies, plan docs, code comments, this file's own internal pointers) may keep bare paths — agents have the repo. The rule binds anything written *for Christian*.

## Session Types: Design vs Execution — Read This First

**One runtime, one executor queue.** All Threadbare agent work runs in **Claude Code**. The design/execution split is a *session type*, not a runtime: a **design session** (`/design-session`) authors plan docs and hands off; an **execution session** (`/pull-work`) implements, commits with `Fixes THR-XX`, and lets the merge-to-main auto-close fire. One queue: **Ready for Dev**. (Codex and the `Ready for Codex` queue were retired 2026-06-23, THR-486; Cowork was retired from the Threadbare workflow 2026-07-21, THR-654.)

This is the reference card. The full protocol — and why each rule is non-negotiable — lives in three authoritative places; read them, don't re-derive from this card:

- **`Docs/canon/process.md`** — session Step 0; the pointer surface for every rule below.
- **`Docs/plans/2026-04-13-linear-coordination-protocol.md`** — canonical detail. The "Coordination Failure Modes — Hard Rules" section (Rules 1–10) explains why each rule exists.
- **`.claude/skills/pull-work/SKILL.md`** — the `/pull-work` pickup flow as an executable checklist.

**In a design session:** Track everything in **Linear** (Threadbare team). Write plan docs into `Docs/plans/` or `Docs/audits/` and commit them directly via a `docs/plan-*` PR — CI-gated, merged immediately. Put the `**Plan doc:** \`Docs/plans/…md\`` path in the issue **description** *and* the handoff comment. Hand off by moving the issue to **Ready for Dev** with a **coordination block** in the handoff comment — `Suggested model` (advisory; the `model:*` label is a work-type signal, not a queue filter — CC always runs Opus), `Parallel-safe with`, `Mutex with`. The Linear state transition *is* the handoff — there is no out-of-band signal. See `.claude/skills/design-session/SKILL.md`.

**Ticket-authoring rules (THR-688)** — three rules bind every ticket you write, full text + motivating examples in the protocol doc § *Ticket-authoring rules*: (A) **predicates, not counts** — a sweep ticket states its membership predicate, never a snapshot count that rots before pickup; (B) **mutex lines carry their reason** — `Mutex with: THR-XXX (both edit <file>)`, and an executor may reverse a mutex only when the stated reason is verifiably inapplicable, recorded in a comment; (C) **Done-whens match the pillar** — browser evidence for UI-pillar surfaces only, engine/content accepted via CLI/headless sweeps. A Done-when may require running N ticks in an automated browser tab **only via `window.__DEBUG.tick(n)`** (THR-689, shipped 2026-07-21): `document.hidden` throttles the interval loop to 1 tick/click, so a Done-when that depends on Play-button ticking is still unreachable by construction.

**In an execution session:** Start with `/pull-work`. Pull the top **Ready for Dev** / `assignee:null` issue (sort by priority in memory — `orderBy:priority` errors, impediment #49). **Claim before you read:** `save_issue(id, assignee:"me", state:"In Dev")`, then `get_issue(id)` to confirm the write stuck (silent drops, impediment #48); only then read the plan doc. **Read the latest comment first** — the `Reopened` label means read all comments back to the original handoff. **WIP = 1** In Dev across all sessions and worktrees — parallel work happens on *different* issues. **Never `save_issue(state:"Done")` from CC** — put `Fixes THR-XX` in the commit body *and* the PR body (impediment #140) and let the merge auto-close fire straight to Done. Check `Docs/plans/` for the design doc before writing code.

**User review interface — Christian is chat-only, plain-language-only (THR-608).** He does not review code diffs, PRs, or Linear. A Done-when like "diff-reviewed by Christian" is invalid. When a change genuinely needs human sign-off, present a plain-language chat summary (what changed, why, what could be lost, your recommendation) and ask one yes/no question; chat approval satisfies the gate — record `human gate satisfied via chat review <date>` as a Linear comment so the executor may merge. Christian's attention is surfaced in `Design/briefing.md` and `Design/user-actions.md` (refreshed hourly by `keep-work-flowing-cc`) and reviewed in an interactive chat session, never a Linear comment addressed to him. **Both files live on the `ops` branch, not `main`** (THR-947) — read them with `git fetch origin ops --quiet && git show origin/ops:Design/briefing.md`; the `main` copies are pointer stubs. Technical verdicts — CI/CD state, git forensics, merge mechanics, not-a-defect calls — are the agent's to make; **so are gate/test calibration and the *how* of implementing an already-agreed design** (Christian, 2026-08-12 — full rule: `Docs/canon/process.md` § User review interface, rule 4). Only genuine creative forks — what the game should *mean*, with no agreed outcome to test against — go to Christian, framed in game terms; when unsure, decide and invite a veto rather than block. **A gameplay-review ask reaches him only when the system under review is level — data, logic, content, and UI all shipped to the surface he will open** (rule 5, Christian 2026-08-13); a partially-landed system gets a status line naming the missing pieces, never a review invitation. See `Docs/plans/2026-07-04-user-review-interface.md`.

### Prioritization: Finish Before You Start

**Rule 0 — a flow impediment with demonstrated cost outranks everything below, including Urgent feature work** (director decision, 2026-08-02). Rules 1–3 order *feature* delivery; Rule 0 sits above all of them and is checked first.

**The membership predicate** (THR-688 rule A): a ticket qualifies when its body or comments record that the delivery machine **already lost work** — and the evidence must be in the ticket and quotable (a count, a duration, a commit SHA, a log line), else it sorts at rule 3. **Materiality bar** (Christian, 2026-08-08): the loss must clear ≥ ~1 hour lost, a shipped artifact corrupted, or ≥3 recurrences in a week — below the bar it is an **impediment-log row, not a ticket**, batched by the weekly retro; every process ticket carries one cost/benefit line (*"costs ~X to fix; not fixing costs ~Y per week"*). **Budget:** product work first; at most **one process ticket per three runs**; a process-only queue is a **starved shelf, not a license to binge** — the headline finding is "feature pipeline needs supply", never more tidying. **Explicitly not qualifying:** dead-code pruning, doc drift, naming/test tidying, and hardening against failures that have not happened — prevention sorts by priority, it does not jump the queue, and `Infrastructure`/`Improvement` labels are not qualifying signals. The incidents behind each clause (the 88-failure pileup THR-834, the April TB-120 stall, the 2026-08-08 measurement): `Docs/plans/2026-04-13-linear-coordination-protocol.md` and the director rulings recorded there.

Then, choose work in this order — finish projects before starting new ones:

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
| `?outcome=<band>` | **Review a specific ending (THR-1030).** Pins the resolved outcome of the `?spawn=`ed template, so any authored aftermath band is reachable from a URL instead of by replaying until the dice cooperate — the tails are the *rare* bands by design, so the endings that most need review were the hardest to reach. Bands: `critical_success`, `success`, `success_at_cost`, `near_miss`, `failure`, `critical_failure`. **Requires `?spawn=`** (the pin is scoped to one template, so the rest of the world resolves normally). Applied at the *tail* of step resolution — the roll, floors and riders all run and trace for real, only the band is substituted, so every downstream consequence fires as a real resolution's would. **Always read `await window.__DEBUG.getOutcomePinVerdict()`** (or the `[?outcome]` console line, which works on the deployed build) before trusting the ending: `unauthored_band` means the encounter ended where you asked but nobody wrote that band and the *base* ending is on screen; `outcome_diverged` means the action aggregated the pinned steps elsewhere (a pinned `near_miss` always does; a pinned `failure` does unless the step's `failBehavior` is `fail_action`). Only `band_rendered` means you are looking at the band. Example: `?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_failure` |

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

The three levers every verification run needs (full JSDoc in the API reference below):

- **`window.__DEBUG.tick(n)`** — advance the simulation headlessly (THR-689); the **only** sanctioned way to satisfy a "run N ticks" browser Done-when — an automated tab reports `document.hidden`, which throttles the interval loop to ~1 tick/click. Clamped to 200/call (`capped:true`, never an error); fail-soft on mid-batch throws; exactly one aggregate trace per call.
- **`await window.__DEBUG.dismissBeats()`** — clear narrative interrupts blocking a capture (THR-1019), resolved through the beat state machine, never DOM clicks; a `selection` beat resolves with its first grant; drains in bounded passes.
- **`window.__DEBUG.suppressBeats(true)`** — auto-resolve beats *as they arrive*; prefer it over repeated `dismissBeats()` when driving `tick(n)` batches. Scope is deliberately narrow: it never touches the encounter veil, Meet-The-First, choice sets, emergence dilemmas, or divine receipts — those are what a verification run is there to observe.

**`src/debug-bridge.d.ts` is the API reference** — every method carries JSDoc with its match semantics and return shape; `src/debug-bridge.ts` is the implementation. Read the `.d.ts` rather than asking for a list. **Most accessors return Promises — always `await` them** (impediments #405, #459, #436, #463): a forgotten `await` reads as an empty object or `evs.filter is not a function`, which looks like a wrong-shape result rather than a missing `await`; and `getEventsSince(0)` returns the 100-entry rolling `recentEvents` buffer, so a before/after diff by array position is meaningless once more than 100 events have fired. Capability areas available there: debug-panel control (`F1` opens straight to the CLI tab; backtick toggles; the in-game CLI accepts pasted multi-line batches), tracing, profiling, health/crash diagnostics, agent navigation, action listing + firing, aftermath reactions, reach signatures, fog of war, encounter-log TSV export, prose-quality audit, orphaned action cards, outcome-ladder distribution + KPI verdicts, ascendant progression, entity-visual resolution, and the war readout (armies/battles).

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
| Hex map | `Docs/canon/hex-map.md` | Before any HexMapV2 / Three.js / hex-renderer work — picks the right hex-map skill (`hexmap-core`, `hexmap-layers`), names the load-bearing decisions (raw Three.js / no R3F, three-tier position model, Y-flip, stencil clipping, hex-distance awareness), and lists current rejected approaches. |
| Rulebook (quick-reference) | `Docs/canon/rulebook-quick-reference.md` | **Always-load at session start** — board-game card, ~80 lines, current rules of play only. Companion to the full rulebook. |
| Rulebook (full synthesis) | `Docs/canon/rulebook.md` | Before any design or content work that touches **rules of play** — turn structure, action verbs, prerequisites, resources, encounters, clocks, win/loss. Each rule carries `[IMPL] / [DESIGN] / [OPEN]`. The single synthesis surface for how the systems combine into a game. |
| World objects | `Docs/canon/world-objects.md` | **Step 0 for any work that adds, names, targets or retires a kind of thing in the world** — an undertaking object, a chip anchor, a subtype, a content target rule. The catalogue of world objects in game words (Area · Hex · Location · Place · Route · Mortal · … · Event), the registry that derives the node schema (`src/data/world-objects.ts`), and the one-PR rule for adding a kind (registry row + UL term + canon row). Generated companion `world-objects.generated.md` (`npm run generate-world-objects`) carries the census badges and the drift verdict. |
| Systems inventory | `Docs/canon/systems-inventory.md` | **Required Step-0 load for any Engine-pillar design work.** Generated (`npm run generate-systems-inventory`) map of every subsystem wired into the engine — aliases (incl. legacy names like `TB-073`), the modules + tick phases that implement it, and an ACTIVE/DORMANT badge. Grep it for your premise nouns *before* drafting so you extend/activate an existing system instead of green-fielding a duplicate (the THR-614 failure). Cannot drift the way hand-written canon did. |

This table routes the common authoring domains; **the one full canon index — all 18 pages — is `Docs/canon/README.md`** (THR-1334).

**Why Canon pages exist:** agents triangulating canonical content from 6–12 files make silent errors (wrong reach count, stale formats, deprecated systems). A Canon page is a single ≤200-line entrypoint that answers "what is current?" and lists stale sources to avoid. The UL remains the terminology authority; Canon pages point to UL and add the navigation layer on top.

### Obsidian vault

Vault work goes through the **filesystem**, not the Obsidian MCP — set `OBSIDIAN_VAULT_PATH` (see § Known Sandbox Limitations). The vault's structure, maintenance scripts, and frontmatter conventions live in **`Docs/documentation-ownership.md` § Obsidian Vault as LLM Knowledge Base**; each `vault-*` skill documents its own workflow.

## Key Links

- **Backlog & issue tracking: [Linear (Threadbare team)](https://linear.app/threadbare)** — single source of truth for all issues, states, and dependencies
- Linear coordination protocol: `Docs/plans/2026-04-13-linear-coordination-protocol.md`
- **Roadmap milestones: [Linear Projects](https://linear.app/threadbare/projects)** — 8 projects (Linear Setup, UI/UX Design Infrastructure, Procedural Hex Vignettes, Content Architecture, Attention Tier Model, Thematic Pressure, Social Systems Expansion, Rarity Model) with lifecycle statuses (Idea → Next → Research → Discovery → Now → Done)
- Legacy milestone roadmap: `.planning/ROADMAP.md` (still maintained for high-level overview)
- Completed items archive: `.planning/BACKLOG_HISTORY.md` (pre-Linear history)
- Obsidian vault index: `TheFantasyWorldSimulator/Index.md`, read from the filesystem via `OBSIDIAN_VAULT_PATH` (no Obsidian MCP for vault work — THR-654)
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

Cross-boundary testing rules, contract test patterns, and anti-patterns live in the **`testing-patterns` skill** — load it when writing tests or before committing engine/HexMapV2 changes.

**The gate law lives in [`Docs/canon/verification-gates.md`](Docs/canon/verification-gates.md)** — authoritative since THR-1336 (the THR-760 pattern: this section moved there verbatim and became a summary, because ~8k always-loaded tokens of gate law and incident history belong behind a pointer). The shape you must know before touching anything:

- **Classify the diff first (THR-917):** `npm run classify:diff`. A **docs-only** diff owes `check:generated-freshness` + `lint:plan-doc -- --staged` + `check:impediment-ids` — and nothing else; do not run tests/typecheck/build on markdown. A **code** diff owes the full gate: `npm test`, `npm run check:typecheck` (the ratchet — never `npx tsc --noEmit`, which is a no-op in this repo), `npx vite build`, both freshness gates, evidence at closeout, and — when engine files are touched — a 30-tick CLI engine smoke **plus `npm run test:heavy` locally** (THR-1384: `npm test` runs the three fast vitest projects only; the world-simulation files carry a `// @vitest-lane heavy` tag and run post-merge in the non-required `Heavy simulation tests` workflow, so the executor's machine is the last place a heavy-only regression is caught before `main`).
- **Tree-diffing gates run LAST — after every closeout edit, immediately before `git push`.** `check:generated-freshness`, `check:wiki-freshness:blocking`, and a ratchet `--update` are scoped to the tree at the instant they run; any later edit (including a `git merge origin/main`) invalidates their evidence. Membership and the incidents behind it: verification-gates.md.
- **CI:** two required checks — `Test · Typecheck · Build` and `Docs gates` — enforced by ruleset `15479914` alone (the classic branch-protection API 404s by design); strict mode is dead; Vercel's check is deliberately not required. **Merge = Done (THR-487):** line-anchored `Fixes THR-XX` in the commit body AND the PR body; never quote the keyword in prose for an issue you are not closing (THR-738).

## Known Sandbox Limitations

The full catalog — every known quirk, its impediment history, and its workaround — lives in **[`Docs/ops/sandbox-limitations.md`](Docs/ops/sandbox-limitations.md)** (moved by THR-1336; read it before debugging any environment failure). The five rules that bite before you would think to look:

- **`rg.exe` is blocked** — the Grep tool works; for shell use, PowerShell `Select-String`. And never pipe a gate run: `npm test 2>&1 | tail` reports tail's exit code, not the suite's.
- **Vault work is filesystem-only** via `OBSIDIAN_VAULT_PATH` — there is no Obsidian MCP for vault work (THR-654).
- **Write files with the Write/Edit tools** — Bash heredocs corrupt content, and Python text-mode writes CRLF-convert tracked files silently while git reports them clean.
- **Worktree `node_modules` is unreliable** — probe `node_modules/.bin/vitest` (never just the directory), junction from a verified-healthy donor via `New-Item -ItemType Junction` as its own call, and strip the junction at closeout with `[System.IO.Directory]::Delete($path, $false)`. **Neither arrival shape is a wipe (THR-1326):** a fresh worktree has no `node_modules` because it is gitignored and nothing installs one, and the `.vite`-only stub is Vite's own cacheDir `mkdir` in a tree with no install — reproduced on demand. Repair and move on; **do not log either shape as an impediment.** The full seven-step repair sequence is in the catalog.
- **Verify-after-write on every Linear mutation** (#48); keep issue ids out of PRs not meant to close them (the assignee-restore hazard, #607). The home tree is autosync's read-only mirror — all branch/commit/push work happens in the session's own worktree (THR-672), and a stale worktree's disposition belongs to the hourly reaper alone (THR-674).

If you discover a new limitation, log it via `impediment-reporter` and add it to the catalog in the next retro.

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
  - **The sublocation tier is one node shape: `type: 'location'` carrying `parentLocationId` (THR-1183).** `parentLocationId` is the discriminator — not the node type, and not a subtype string. Ask through `src/engine/sublocationShape.ts` (`isSublocationNode` / `isPlaceTierLocation` / `getSublocationNodes` / `getPlaceTierLocations` / `resolveToParentLocation`); never hand-roll the test. **A bare `getNodesByType('location')` returns *both* tiers** — a sweep that means settlements must say `getPlaceTierLocations`. `'sublocation'` remains a registered `NodeType` (THR-1177) that readers still *accept* for saved worlds, but no sublocation producer writes it. Two spellings appear only in old test fixtures and in no writer — `properties.locationSubtype: 'sublocation'` and `properties.locationType: 'sublocation'`; both are deliberately rejected, because a fixture must not get to define the shape.
  - **Why it is `location` and not `sublocation`.** `src/types/sublocation.ts` has always documented it (*"The node itself has `type: 'location'`"*), and the canonical worldgen writer has always obeyed — 473 of 738 location nodes in a seeded medium world at tick 30. `strategicGraphOps.createSublocation` was the single drifted writer, and its nodes sat outside every location sweep while canonical ones sat outside every `getNodesByType('sublocation')` sweep: each shape half-visible, in complementary halves. Narrowing the one drifted writer is also the additive direction (NFP #6) over migrating the high-volume one.
- **Encounter awareness is hex-granular.** If an agent can see a hex, they can see everything on it — every location, every sublocation, every encounter. Within-hex visibility is automatic (distance 0). Cross-hex visibility is computed as hex coordinate distance vs. per-reach awareness hops. The distance matrix between locations is NOT used for encounter awareness — use hex distance (`encounterAwareness.ts`). This means an agent at a sublocation sees all encounters across all locations and sublocations on their hex, plus encounters on hexes within their awareness range.
- **The world graph is mutated in place — never depend on graph object identity for change detection.** `WorldGraph` methods and direct `node.properties` writes modify internal state without changing the object reference. Any `useMemo`, selector, or cache that keys on `gameState.graph` identity will silently serve stale data. Use explicit version counters (`worldVersion` for UI selectors, `structuralCacheVersion` for structural caches such as the distance matrix and encounter cache) via exported `touchWorld()` / `touchStructure()` calls. Property mutations like `locationSubtype` changes in settlement promotion affect encounter scoring via the fallback in `getLocationType()` — versioning only works if every meaningful mutation participates, including property edits. Both tick phases and UI hooks (e.g. `useAgentInteraction`) must use the same touch API. `worldVersion` will bump nearly every tick during active simulation — that's intentional; memos gate paused/idle states, not per-tick skipping. `structuralCacheVersion` intentionally over-invalidates for v1 (a subtype change triggers distance matrix rebuild even though only encounter scoring changed); split into finer-grained versions only if profiling shows unnecessary rebuilds are costly.
- **Engine caches must be owned per session, not stored at module scope.** Module-level singletons (encounter cache, distance matrix, etc.) persist across game sessions if the page isn't fully reloaded. A lightweight `SimulationRuntime` owned by `useSimulation` should hold caches, version counters, and lazy rebuild logic, scoped to the current playthrough.
- **The distance matrix indexes the place tier only, and caps at `MAX_DISTANCE_MATRIX_SIZE` (1200).** It is *not* dead code: `socialEncounterGeneration.findVisibleAgents` and `idleBehavior.deriveAmbitionTarget` both walk a matrix row directly on the per-tick path, so every agent-to-agent social encounter and every ambition drift target comes out of it. Neither calls the module's `getDistance` accessor — both want a whole row, not a point lookup — so grepping for `getDistance` callers will tell you the matrix is unused. It is not. **Measured place-tier counts (seed 42, tick 0): small 131, medium 214, large 542, epic 791** — comfortably under the cap on every preset. THR-1346 scoped the build to `getPlaceTierLocations`; before that it walked the bare `getNodesByType('location')`, which since THR-1183 also returns sublocations (~2:1 over place-tier), pushing `large` to 1628 and `epic` to 2549 and silently truncating **235 and 391 real settlements** out of the index. The earlier figures recorded here (`large ~584`, `epic ~805`) predated that unification and were never a measurement of what the matrix indexed. If place-tier count ever does exceed 1200, a `console.warn` fires and agents at unindexed locations degrade to "nothing is near me" — assert the headroom on a **generated** world, never a fixture (`distanceMatrix.test.ts`).

## Rejected Approaches (do not reintroduce)

- ❌ Classical stats (STR/DEX/INT) — replaced by Domain Capability across the Eight Reaches
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
- **In the vault log:** Append to `log.md` via the `vault-log` skill — a filesystem write to `OBSIDIAN_VAULT_PATH` (format: `- **<type>** | <description>`).

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
  - **The `BEHIND` livelock is gone and no merge queue is coming (THR-983):** strict mode was dropped, a green PR merges regardless of tip movement, and `BEHIND` is not a state anyone waits in — do not re-introduce probes or drain arms for it. A real `DIRTY` conflict is still yours to resolve (`git merge origin/main && git push`, never the web resolver).
- [ ] **Deploy** — Vercel auto-deploys on push to `main`, but **a successful push is not proof of deployment** (THR-785). Confirm with `npm run check:deploy` (`deployed`/`skipped` healthy, `failed`/`stale` not); never confirm via the commit-status API, which reports a skipped build as `success`. Non-blocking — the hourly `keep-work-flowing-cc` probe surfaces failures within the hour. **Vercel's check is deliberately not required and must not become one** — the fix for a silent deploy stoppage is notification, never a new merge gate.
- [ ] **Update docs** — write your Current-Focus narrative to a **new** `Docs/status/YYYY-MM-DD-thr-XXXX.md`; add a one-line `✅` entry to `project-history.md`; append rows to `changelog.md`. Add a completion comment to the Linear issue (the `Fixes THR-XX` keyword in the commit auto-closes it, but a human-readable comment is still expected). **`Docs/project-status.md` is generated and untracked since THR-1016** — `prebuild` assembles it from those fragments and holds the ≤60-line cap by rendering only the newest that fit, so never hand-edit it and never trim another entry to make room. Everything older stays in `Docs/status/`, uncapped and readable; run `npm run generate-project-status` for the assembled page.
  - **Why one file per entry:** shared-anchor writes made any two open closeout PRs conflict by construction (THR-1016's motivating measurement). **Merging:** `changelog.md`, `project-history.md` and `impediments.md` are `merge=union` **locally only** — GitHub's server-side merge ignores `.gitattributes`, so a `CONFLICTING` PR is fixed with `git merge origin/main && git push`, never the web resolver. Detail: `.claude/skills/pull-work/SKILL.md` § Closeout.
- [ ] **Verify wiring** — Check every new module against `Docs/plans/wiring-checklist.md`. Engine modules called from orchestrator, modals rendered in GameView JSX, GameState fields consumed by UI, traces emitted, player controls connected. Update the checklist if new surfaces added.
- [ ] **Browser-verify UI changes** — if the change touches the UI pillar (any file under `src/components/` — which contains every HexMapV2/Three.js surface — `src/hooks/`, `src/contexts/`, or `src/index.css`), the closing commit body or completion comment MUST carry the four-part evidence: **(1)** a screenshot of the changed surface at 1920×1080 — or a sanctioned substitution recorded as `Browser-verify substitution: <route> — <reason>`; **(2)** console output (empty is valid — embed `(no errors or warnings)`); **(3)** a `window.__DEBUG.*` state assertion proving the surface is wired; **(4)** a UI-Laws judgment line citing the law numbers checked (THR-1007; at minimum Laws 1, 13/14, 17, 21, 33, 37). **The full contract — sanctioned routes per lane and surface, the Playwright pre-capture ritual, the inert Claude-in-Chrome viewport, the jsdom fallback for unattended runs, and the opt-in `Browser-verify exempt:` escape — is [`Docs/canon/verification-gates.md` § Browser-verify](Docs/canon/verification-gates.md)** (moved by THR-1336). Three reasons this is binary, not advisory: snapshot tests miss paint regressions; TypeScript misses off-viewport rendering; Playwright cannot see WebGL canvas content.

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
- [ ] Read the vault's `Index.md` (filesystem via `OBSIDIAN_VAULT_PATH`) → follow links to the relevant system. Index.md is the comprehensive catalog — use it as the LLM's navigation system.
- [ ] **For design work**, load the rulebook synthesis first: `Docs/canon/rulebook-quick-reference.md` is always-load; `Docs/canon/rulebook.md` for any work touching rules of play (turn structure, action verbs, prerequisites, resources, encounters, clocks, win/loss). Then load `state-of-game-design` (mechanical foundation) and `game-design-direction` (experiential foundation), then descend into Vision/ (vault filesystem via `OBSIDIAN_VAULT_PATH`) and the relevant per-domain canon page.
- [ ] **Check Linear Projects for milestone context** — `list_projects` to see which milestones are in Now/Discovery/Research. Issues belong to projects; projects show the big picture.
- [ ] Check `.planning/ROADMAP.md` for legacy milestone overview
- [ ] Read relevant design doc in `Docs/plans/` before writing code
- [ ] **For content authoring tasks (encounters, attachments, prose, faction content):** load `Docs/canon/<domain>.md` **before any other reference material**. The Canon page is the agent's Step 0 entrypoint — it lists the current spec, canonical pointers, and stale sources to avoid. Start with `Docs/canon/encounters.md` for encounter work, `Docs/canon/cosmology.md` for anything that references Reaches or Spheres.
- [ ] **Upstream health check** — if the feature depends on upstream pipeline throughput, verify the pipeline is producing output before coding. A feature wired to a dead pipeline is wasted work.
- [ ] **Terminology authority check** — if sources disagree on term definitions, UL wins (`Docs/ubiquitous-language/README.md` + shard entries)
- [ ] After completing work, follow the **Definition of Done** above
- [ ] **Update Linear** — move issue to appropriate state, add completion comment
- [ ] **Update vault log** — Append what changed this session to `log.md` via the `vault-log` skill (filesystem write)

### Scheduled Tasks

**Registry: [`Docs/ops/scheduled-tasks-registry.md`](Docs/ops/scheduled-tasks-registry.md)** — all three lanes (CC automation, GitHub Actions, Windows Task Scheduler; the Cowork lane retired with THR-654), their cron *and observed fire time*, the reaper's guardrails, and the weekly continuous-improvement cycle. Slot name ≠ cron minute ≠ fire time; the registry's `Fires` column is the operational one.

Two rules stay here because they gate live session behavior:

- **Operational exhaust lives on the `ops` branch, not `main`** (THR-947, cutover 2026-08-02). The hourly briefing, the user-action list, and every scheduled lane's dated run report are published to an unprotected branch, so they cost no PR and no CI run. (The original third reason — that advancing `main`'s tip knocked every in-flight PR to `BEHIND` — died with strict mode on 2026-08-02, THR-983. The first two still hold, and the cutover stands on them.) **Read:** `git fetch origin ops --quiet && git show origin/ops:Design/briefing.md`. **Write:** `bash scripts/ops-publish.sh -m "<msg>" <paths>` from a worktree's repo root. The membership predicate, what deliberately stayed on `main`, and where the frozen pre-cutover archive sits: [`Docs/ops/README.md`](Docs/ops/README.md).
- **`keep-work-flowing-cc` owns `Design/briefing.md` and `Design/user-actions.md`.** No other scheduled task writes either file — a second writer produces lost updates, since publishing to `ops` is last-writer-wins rather than a merge. Christian-facing items from any other task go in that task's own report under a `## Needs Christian` heading and reach him via the hourly briefing.
- **Registering a new task means recording it.** Pick a cron minute whose *jittered* fire time is clear of the existing ones, then record both the cron and the observed fire time in the registry file **in the same commit**. A live prompt lives outside version control at `C:\Users\chris\.claude\scheduled-tasks\<id>\SKILL.md` — when you edit one, update its mirror under `Docs/ops/scheduled-task-prompts/` in the same PR. The registry and the prompt mirrors are durable and stay on `main`; only the task's *output* goes to `ops`.

## Skill Tree Layout

**`.claude/skills/` is the only skill tree.** Claude Code reads it from a hardcoded path in the CC binary; every skill any Threadbare session can invoke lives there.

A second tree (`.agents/skills/`, with its `check:skill-sync` mirror) was deleted 2026-07-21 with the Cowork lane it served (THR-654) — **do not reintroduce a second skill tree**. Six vault skills retired with it (vault work is filesystem-only now); recover any from git history if wanted.

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

### Process-work throttle (Christian's direction, 2026-08-10)

Measured 2026-08-10: 32 of 35 Ready-for-Dev items were Low-priority process cleanup, zero were feature or content work, and the lanes were still filing more. The materiality bar (2026-08-08, § Prioritization) governed what *qualified*; nothing governed *who files*. Two rules close that:

- **Scheduled lanes do not file process/infrastructure tickets.** A lane that finds a defect in the delivery machinery logs it — an impediment-log row or a line in its own run report — and moves on. The **weekly retro is the single promotion point**: it batches the log and files the few tickets that clear the materiality bar, with the accumulated cost quoted. Sole exception: a loss actively corrupting work *right now* (a gate passing while broken, data being lost as it runs) may be filed immediately. A lane prompt that still says "file findings as tickets" is superseded by this rule.
- **Probes, gates, and standing rules sunset by default.** Anything that has not caught a real defect in **six weeks** is presumed deletable; the weekly retro either renews it by citing the catch or deletes it. Keeping a dead rule requires evidence, not caution — the delivery machine's failure mode is accretion, not gaps (this file is the proof), so the burden of proof sits on *keeping*, never on removing.


# Codesight — Codebase Intelligence

Codesight is installed as both a **static analysis output** (`.codesight/`) and an **MCP server** (`codesight` in `.mcp.json`). A SessionStart hook regenerates the analysis each session.

**Use codesight actively:**
- Before touching unfamiliar code, check `.codesight/wiki/index.md` for orientation (WHERE things live), then read actual source files.
- Use `.codesight/CODESIGHT.md` for the full context map: components, libraries, config, middleware, dependency graph.
- Use `.codesight/components.md` for the component catalog with props.
- Use `.codesight/graph.md` for the import dependency graph and high-impact files.
- Use the codesight MCP tools when available for live queries (blast radius, dependency chains).
- To refresh mid-session after significant changes: `npx codesight --wiki`

**High-impact files:** read the current list from **`.codesight/graph.md`** (regenerated by the SessionStart hook each session) — importer counts are too volatile to snapshot here (a 2026-07-03 snapshot was ~50% understated by 2026-08-29, THR-1362). The stable shape: `src/engine/graph.ts`, `src/types/gameState.ts`, `src/types/unifiedAction.ts`, `src/engine/traceBuffer.ts` and their `src/types/` siblings sit at the top with hundreds of importers each — treat any change to them as wide-blast and check `.codesight/graph.md` for the live numbers before sizing the change.

Wiki articles are navigation aids, not implementation guides — always read source files before implementing.
