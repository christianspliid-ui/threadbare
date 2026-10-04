This folder contains **Threadbearer** ([threadbearer.co](https://threadbearer.co)) — a systemic god-game/rogue-lite narrative simulation built in React + TypeScript + Vite. ("Threadbare" is the repo/Linear codename; "The Fantasy World Simulator" is the retired working title that survives only in paths. UL: `Docs/ubiquitous-language/Process.md` → Threadbearer.)

[![CI](https://github.com/christianspliid-ui/threadbare/actions/workflows/ci.yml/badge.svg)](https://github.com/christianspliid-ui/threadbare/actions/workflows/ci.yml)

## Rule Zero — every reference Christian sees is a clickable link (Christian, 2026-08-09)

**Any document, PR, Linear issue, file, or game surface you mention in Christian-facing text carries a direct URL he can click.** That covers chat responses, `Design/briefing.md`, `Design/user-actions.md`, Linear comments he will read, and batch-review reports. He is chat-only (THR-608): a bare path like `Docs/plans/2026-08-08-encounter-factory-workflow.md`, a bare "PR #1363", or "the spec" forces him to search a repo and board he deliberately does not work in — and every unlinked reference stalls the exact approval it was asking for. His words: *"i don't want to search for data or documents you refer to. i want direct links."*

- Repo files → the GitHub blob URL, pinned to `main` once merged (e.g. `https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md`), the branch URL before.
- PRs / issues → the full `github.com/...` / `linear.app/threadbare/issue/THR-XXX/...` URL, never a bare number.
- Game surfaces → the deployed-build URL with its query params (`?view=game&seeded&spawn=...`).
- **When asking for an approval, the links to the exact artifacts under review come *with* the ask** — not on request, not "in the PR".

Agent-facing text (commit bodies, plan docs, code comments, this file's own internal pointers) may keep bare paths — agents have the repo. The rule binds anything written *for Christian*.

## How to use this card (THR-1718)

This file is re-read on every model turn, so it carries only the rules that bind **before** an agent would think to look, plus one-line pointers. Everything else moved **verbatim** to its canon home (the THR-760 / THR-1336 pattern — moved, never deleted):

| Topic | Authoritative home |
|---|---|
| Session types, Rule 0 + prioritization, session-start workflow (`freshness=` / `linear=` tables), scheduled tasks, skill tree, domain-skill load order, continuous improvement + process-work throttle | [`Docs/canon/session-protocol.md`](Docs/canon/session-protocol.md) |
| Definition of Done (full checklist + rationale) | [`Docs/canon/definition-of-done.md`](Docs/canon/definition-of-done.md) |
| Gate law, CI, browser-verify contract | [`Docs/canon/verification-gates.md`](Docs/canon/verification-gates.md) |
| Dev server, dev quick-start URL table, headless CLI, debug bridge, viewport contract | [`Docs/ops/dev-quickstart.md`](Docs/ops/dev-quickstart.md) |
| Sandbox quirks + workarounds | [`Docs/ops/sandbox-limitations.md`](Docs/ops/sandbox-limitations.md) |
| Design governance (Steps 0–8.6, per-system sections) | [`Docs/canon/design-governance.md`](Docs/canon/design-governance.md) |
| Architectural decisions (full text + measurements), debugging protocol | [`Docs/canon/engine.md`](Docs/canon/engine.md) § Relocated from CLAUDE.md |
| Documentation strategy, canon routing table, key links, audit trail, codesight | [`Docs/documentation-ownership.md`](Docs/documentation-ownership.md) § Relocated from CLAUDE.md · full canon index: [`Docs/canon/README.md`](Docs/canon/README.md) |
| Process meta-canon (pointer surface) | [`Docs/canon/process.md`](Docs/canon/process.md) |

## Session types — one runtime, one queue

All agent work runs in **Claude Code**; the split is a *session type*. A **design session** (`/design-session`) authors plan docs into `Docs/plans/` / `Docs/audits/`, commits them via a `docs/plan-*` PR, puts `**Plan doc:** \`Docs/plans/…md\`` in the issue description *and* the handoff comment, and hands off by moving the issue to **Ready for Dev** with a coordination block (`Suggested model`, `Parallel-safe with`, `Mutex with` — each with its reason). An **execution session** (`/pull-work`) implements, commits with `Fixes THR-XX`, and lets the merge-to-main auto-close fire. Codex and Cowork are retired. Protocol detail: `Docs/plans/2026-04-13-linear-coordination-protocol.md` (Hard Rules 1–10) and `.claude/skills/pull-work/SKILL.md`.

- **Ticket-authoring rules (THR-688):** (A) predicates, not counts; (B) mutex lines carry their reason; (C) Done-whens match the pillar — browser evidence for UI only; "run N ticks in a browser" only via `window.__DEBUG.tick(n)`.
- **Claim before you read:** `save_issue(id, assignee:"me", state:"In Dev")`, then `get_issue(id)` to confirm it stuck (silent drops, impediment #48). Sort by priority in memory (`orderBy:priority` errors). Read the latest comment first; `Reopened` ⇒ read back to the handoff. **WIP = 1** In Dev. **Never `save_issue(state:"Done")` from CC.**
- **Christian is chat-only, plain-language-only (THR-608).** He does not review diffs, PRs or Linear. A genuine human gate = one plain-language chat summary + one yes/no; record `human gate satisfied via chat review <date>` on the issue. Technical verdicts, gate calibration and the *how* of an agreed design are the agent's; only genuine creative forks go to him, framed in game terms — when unsure, decide and invite a veto. No gameplay-review ask until the system is level (data, logic, content, UI all shipped). His briefing files live on the `ops` branch: `git fetch origin ops --quiet && git show origin/ops:Design/briefing.md`.
- **Rule 0:** a flow impediment with demonstrated, quotable cost (≥ ~1 h lost, a shipped artifact corrupted, or ≥3 recurrences/week) outranks everything; below the bar it is an impediment-log row. Otherwise finish active projects before starting new ones; every issue belongs to a project. Product work first — at most one process ticket per three runs. Scheduled lanes do not file process tickets (the weekly retro promotes); probes/gates/rules sunset after six weeks without a catch. Full text: session-protocol.md.

## Running the prototype

Node 22+, npm 10+. `npm install` · `npm run dev` · `npm test` · `npm run build` · `npm run cli` (headless REPL: `npm run cli -- --seed 42 --map medium`). **Primary dev view: `?view=game&seeded&size=medium`** (pre-bonded First; `large` stalls). Meet-The-First: `?view=game&firstunmet&size=medium`. Review levers: `?forceencounters`, `?spawn=<templateId>`, `?testavatar`, `?outcome=<band>` (always read `await window.__DEBUG.getOutcomePinVerdict()`). Debug bridge: `window.__DEBUG.tick(n)` (the only sanctioned way to run N ticks in an automated tab), `await window.__DEBUG.dismissBeats()`, `window.__DEBUG.suppressBeats(true)`; API reference `src/debug-bridge.d.ts` — most accessors return Promises, **always `await`**. `?seeded` ≠ `--seed 42` (different cosmology/map). Full URL table, CLI commands and traps: [`Docs/ops/dev-quickstart.md`](Docs/ops/dev-quickstart.md).

**Viewport contract (1920×1080):** the game fills one viewport — nothing scrolls, nothing renders below the fold (`html, body, #root` keep `100dvh; overflow: hidden`; full-screen layouts `h-screen flex flex-col overflow-hidden`; modals `max-height: 75vh`). Resize to 1920×1080 before screenshots; Playwright snapshots cannot see WebGL. Off-screen rendering is a bug.

## Canon is Step 0

Before any authoring or design task, load the relevant `Docs/canon/<domain>.md` **before any other reference material** (encounters, cosmology, prose, hex-map, world-objects, content-objects, undertakings…; full index [`Docs/canon/README.md`](Docs/canon/README.md)). **Always-load:** `Docs/ubiquitous-language/README.md` (UL wins every terminology disagreement — propose changes via a `UL-proposal` issue) and `Docs/canon/rulebook-quick-reference.md`. `Docs/canon/rulebook.md` for anything touching rules of play; `Docs/canon/systems-inventory.md` is required Step 0 for Engine-pillar design (extend before you green-field). Load the `state-of-game-design` router before other domain skills; prose work reads `Docs/plans/2026-04-16-systemic-wiring-guide.md` first. Vault work is filesystem-only via `OBSIDIAN_VAULT_PATH` (exploratory drafts in the vault's `Brainstorms/`, promoted to `Docs/plans/` only when the issue moves toward Ready for Dev). Backlog: [Linear (Threadbare team)](https://linear.app/threadbare). Plans: `Docs/plans/YYYY-MM-DD-topic.md` from `_template.md`.

## Non-Functional Priorities (in order)

When in tension, higher priorities win.

1. **Tunability** — Every magic number is a named constant. Changing game feel = changing a number, not rewriting logic.
2. **Inspectability** — Trace *why* something happened. Flat state, pure functions, causal event trails.
3. **Determinism** — Seeded PRNG everywhere. Same seed + same inputs = same outputs.
4. **Fail-soft** — The tick loop must never crash. Missing data → graceful fallback, never thrown exceptions.
5. **Narrative over mechanical perfection** — When mechanics and story diverge, lean toward the story.
6. **Additive over destructive changes** — Add new fields/functions; only refactor when old shape blocks progress.
7. **Performance budget, not premature optimization** — Profile before optimizing. Lean on the spotlight tier system.

## Gates — `npm run gate`

Authority: [`Docs/canon/verification-gates.md`](Docs/canon/verification-gates.md). Load the `testing-patterns` skill when writing tests.

- **One command (THR-1717):** `npm run gate` classifies the diff and runs the owed track in parallel; `npm run gate -- --final` runs the tree-diffing gates as the **last action before `git push`**. Paste the verdict block as evidence.
- **Classify first:** `npm run classify:diff`. **Docs-only** owes `check:generated-freshness` + `lint:plan-doc -- --staged` + `check:impediment-ids` and nothing else. **Code** owes `npm test`, `npm run check:typecheck` (the ratchet — **never `npx tsc --noEmit`**, a no-op here), `npx vite build`, both freshness gates, evidence at closeout; engine files add a 30-tick CLI smoke **and `npm run test:heavy`**.
- **Tree-diffing gates run LAST** (`check:generated-freshness`, `check:wiki-freshness:blocking`, a ratchet `--update`) — any later edit, including a `git merge origin/main`, invalidates them.
- **CI:** required checks `Test · Typecheck · Build` and `Docs gates` (ruleset `15479914`); strict mode is dead; Vercel's check is deliberately not required. **Merge = Done:** line-anchored `Fixes THR-XX` in the commit body **and** the PR body.

## Sandbox — the five that bite first

Full catalog: [`Docs/ops/sandbox-limitations.md`](Docs/ops/sandbox-limitations.md).

- `rg.exe` is blocked — use the Grep tool, or PowerShell `Select-String`. Never pipe a gate run (`npm test 2>&1 | tail` reports tail's exit code).
- Write files with the Write/Edit tools — Bash heredocs corrupt content; Python text-mode writes CRLF-convert silently.
- Worktree `node_modules` is unreliable — probe `node_modules/.bin/vitest`, junction from a healthy donor (`New-Item -ItemType Junction`, its own call), strip the junction at closeout with `[System.IO.Directory]::Delete($path, $false)`. A fresh worktree with no install, or a `.vite`-only stub, is **not** a wipe — repair and move on, do not log it.
- In a worktree, prefix every Edit/Write path with `git rev-parse --show-toplevel` (a bare home-tree path succeeds silently). The home tree is autosync's read-only mirror (THR-672); stale worktrees belong to the hourly reaper (THR-674).
- Verify-after-write on every Linear mutation (#48); keep issue ids out of PRs not meant to close them (#607).

## Design governance

Authority: [`Docs/canon/design-governance.md`](Docs/canon/design-governance.md) — load it before any design pass. **Never present a non-compliant design** (draft → audit → revise → summarize in one internal pass; structural NFP conflicts surface as trade-offs). **Three-Pillar Rule:** every feature addresses **Engine**, **Content** and **UI**, or marks each N/A with rationale — one- and two-pillar plans do not move forward.

## Load-Bearing Architectural Decisions

Settled. Do not revisit. Full statements, rationale and measurements: [`Docs/canon/engine.md`](Docs/canon/engine.md) § Relocated from CLAUDE.md.

- **Everything is a graph node/edge.** No separate relational tables.
- **Reaches and Spheres are orthogonal axes.** Reaches = what you do; Spheres = what fuels it. Neither subsumes the other.
- **Ascendants use the same prerequisite system as agents** — powerful former mortals, not a special-cased entity type.
- **No inventing node types without verification** — check `src/types/graph.ts` and `world-model.json`; if it is genuinely new, **stop and ask the human**, then design it fully (category, properties, edges, tick participation, traces) before code.
- **Relationships between entities are graph edges, not property fields.** Check `src/types/graph.ts` for an existing edge first.
- **Agent position is three-tier: hex → location → sublocation**, via a single `located_at` edge to the most specific node. **The sublocation tier is `type: 'location'` carrying `parentLocationId`** (THR-1183) — ask through `src/engine/sublocationShape.ts` (`isPlaceNode` / `isLocationNode` / `getPlaceNodes` / `getLocationNodes` / `resolveToParentLocation`); a bare `getNodesByType('location')` returns **both** tiers.
- **Encounter awareness is hex-granular** (`encounterAwareness.ts`) — everything on a visible hex is visible; cross-hex is hex distance vs per-reach awareness hops. The location distance matrix is not used for awareness.
- **The world graph is mutated in place — never key change detection on graph identity.** Use `worldVersion` / `structuralCacheVersion` via `touchWorld()` / `touchStructure()`, including for property edits.
- **Engine caches are owned per session** (`SimulationRuntime` in `useSimulation`), never module-scope singletons.
- **The distance matrix indexes the place tier only** (`getLocationNodes`), caps at `MAX_DISTANCE_MATRIX_SIZE` (1200), and is live on the per-tick path (`socialEncounterGeneration`, `idleBehavior`) even though nothing calls `getDistance` — assert headroom on a generated world, never a fixture.

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

## Debugging: verify the noun before the verb

When "system X doesn't produce output for entity Y": first confirm the entity's identity in state (`actorId`, `templateId`, `locationId` via CLI `eval` or the debug bridge), then check what any alias (`@hero`, partial names) resolved to, and only then trace the system. Full protocol: `Docs/canon/engine.md`.

## Definition of Done

Authority: [`Docs/canon/definition-of-done.md`](Docs/canon/definition-of-done.md) — read it at closeout. Do all of it automatically; do not stop at "ready to push?".

- **Commit** with `Fixes THR-XX` **alone on its own line** in the commit body **and** the PR body (line-anchored closer, THR-738; non-squash merges drop the commit body, #140). Never write a close keyword in prose, a checkpoint, or for an issue another session holds `In Dev`.
- **Push, then queue the merge** with `gh pr merge --auto --merge` and move on — no CI poll-waiting (THR-675). Code PRs pass the `review-gate` skill first (THR-1691). A `DIRTY` conflict is yours: `git merge origin/main && git push`, never the web resolver.
- **Deploy** is confirmed with `npm run check:deploy`, never the commit-status API.
- **Docs:** a **new** `Docs/status/YYYY-MM-DD-thr-XXXX.md` fragment, a `✅` line in `Docs/project-history.md`, rows in `Docs/changelog.md`, a Linear completion comment. `Docs/project-status.md` is generated and untracked — never hand-edit it.
- **Wiring:** check new modules against `Docs/plans/wiring-checklist.md`; update `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts` for any cross-system read/write change; update the Design Reference Wiki page whose `sources` match (blocking gate; `Wiki-freshness-exempt: <reason>` only for behavior-neutral changes); update the systemic wiring guide for any new content-facing engine capability.
- **UI pillar** (`src/components/`, `src/hooks/`, `src/contexts/`, `src/index.css`): four-part browser evidence — 1920×1080 screenshot, console output, a `window.__DEBUG.*` assertion, a UI-Laws judgment line (at minimum Laws 1, 13/14, 17, 21, 33, 37). Contract: verification-gates.md § Browser-verify.
- **Deferrals:** every `// TODO` / `// DEFERRED` gets a Linear issue (`// TODO(THR-XX): …`), labeled `Deferral`, same project, with its coordination block as the first comment.
- **Impediments:** log blockers and workarounds to `Docs/impediments.md` via the `impediment-reporter` skill — mandatory.

## Session start

1. **First tool call:** `node --experimental-strip-types scripts/session-precheck.ts`; read its `fingerprint` line.
2. **`freshness=`:** `current` / `ahead:N` proceed. `behind:N`, `stale-branch:Xh`, `unknown` — surface first, before design work. `parked-at-ancestor` — repair yourself (`git stash push -m home-tree-recovery` → `git switch main` → `git pull --ff-only origin main`) and continue. `parked-with-unique-commits:N` — **stop**, do not reset, surface `git log origin/main..HEAD --oneline`.
3. **`linear=`:** `ok` and `nokey` proceed (`nokey` is the normal home-machine state and never gates a run). `noauth` / `unreachable` — confirm with one board read; if dark, report the outage and **do not claim**.
4. **Board:** design sessions run the state-filtered fan-out (never an unfiltered `list_issues`); execution sessions run `/pull-work`. Read the plan doc before code.

Full tables and rationale: [`Docs/canon/session-protocol.md`](Docs/canon/session-protocol.md).

## Operations, skills, improvement

- **Operational exhaust lives on the `ops` branch** (THR-947): read with `git show origin/ops:<path>`, write with `bash scripts/ops-publish.sh -m "<msg>" <paths>`. Only `keep-work-flowing-cc` writes `Design/briefing.md` / `Design/user-actions.md`. Scheduled-task registry: [`Docs/ops/scheduled-tasks-registry.md`](Docs/ops/scheduled-tasks-registry.md) — a new task records its cron and observed fire time there in the same commit, and an edited live prompt updates its mirror under `Docs/ops/scheduled-task-prompts/`.
- **`.claude/skills/` is the only skill tree** — never reintroduce a second. When you change a skill's instructions, bump its `last_validated_against`.
- **Continuous improvement:** `impediment-reporter` logs friction as it happens → `Docs/impediments.md`; the `retrospective` skill analyses it → `Design/retros/`.
- **Codesight:** `.codesight/wiki/index.md` for orientation, `.codesight/graph.md` for live high-impact files (graph.ts, gameState.ts, unifiedAction.ts, traceBuffer.ts are wide-blast). Navigation aids, not implementation guides — read source.
