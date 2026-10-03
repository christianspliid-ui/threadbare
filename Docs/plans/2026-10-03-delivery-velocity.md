> **title:** `Delivery velocity — leaner sessions, one-shot gate, back-to-back pickup, then a second executor — THR-1717`
> **linear_issue:** THR-1717
> **author:** `Claude Code`
> **created:** 2026-10-03
> **three_pillars:** Engine `N/A — delivery tooling, no simulation change` · Content `N/A — no authored content` · UI `N/A — no player surface`

# Delivery velocity — THR-1717

*The executor lane ships one ticket per hour at ~31 minutes of work; the rest of every hour, and roughly a fifth of every model turn, is spent on things that are not the ticket.*

## Why this is load-bearing

Christian, 2026-10-03: *"we are spending a lot of tokens and time on running the test suites and we are only running one executor at a time … how do we reach the next level here, as we have lots of work to do."* The measurements below say the test suites are a minor share of the cost. The binding constraints are (a) the hourly cadence — one ~31-minute run per 60-minute slot, (b) a ~150k-token session baseline that every one of ~100 turns re-reads, and (c) a commit hook that re-runs the full suite on every commit. Fixing those roughly doubles tickets per day on the existing single lane; only then is a second executor worth its coordination cost.

## Measurements (2026-10-03)

Sources: the last 25 `tb-opus-pickup` transcripts (3 outliers excluded — they were stale transcripts from other lanes), `list_task_runs(tb-opus-pickup)`, 253 `git commit` calls across 4 days of transcripts, and headless `claude -p --output-format stream-json` probes in this repo.

| Quantity | Value |
|---|---|
| Pickup run wall-clock (22 runs) | ~31 min mean; lane idle for the rest of the hour |
| Model turns per run | ~100 |
| Cache-read tokens per run | ~25M |
| Turn-1 context, desktop app | ~147–154k tokens |
| Turn-1 context, headless | 112k |
| Local gates per run (test, ratchet, build, freshness) | ~8 min ≈ 25% of wall |
| `npm test` full suite | 73 s (1,434 files, 22,724 tests) |
| `check:typecheck` / `vite build` / `check:generated-freshness` / `test:heavy` | 42 s / 20 s / 87 s / 138 s |
| test ∥ typecheck ∥ build, run concurrently (32 cores) | **74 s wall vs 135 s serial** |
| `git commit` median / p90 | **48 s / 85 s**, vs 5 s with `--no-verify` |
| Merges per day (last 6 days) | 5–19 |
| Ready for Dev on 2026-10-01 | empty all day — every run exited in ~1 min |

### Where the turn-1 context goes (headless probes)

| Configuration | Turn-1 tokens | Tools |
|---|---|---|
| Everything on | 112k | 1,195 |
| Unused plugins disabled (`enabledPlugins: false`) | 109k | 1,195 |
| …plus irrelevant connectors denied (`deniedMcpServers`) | **84k** | 192 |
| …all MCP off (`--strict-mcp-config`) | 80k | 31 |
| …and no `CLAUDE.md` | 63k | 31 |

`disabledMcpServers` in a settings layer is **not** honoured for user-scope or claude.ai servers (probe-verified); `deniedMcpServers` is, and keeps the named exceptions (Linear, GitHub, codesight, Playwright, Discord). The desktop app adds ~35k of its own tools on top, which no project setting reaches.

### The commit hook

`.claude/hooks/pre-commit-gate.sh` (April 2026, `2026-04-13-definition-of-done-hooks-design.md`) runs `npx tsc --noEmit` — a no-op here since the root `tsconfig.json` has `files: []` (THR-686) — and the full `npm test` on **every** `git commit`, including THR-1529's WIP checkpoint commits (taken *before* verification, so the hook either blocks the checkpoint or re-verifies code nobody claimed was ready) and docs-only closeout commits. A typical run commits 2–4 times. The pre-push hook's `Docs/project-status.md` check has been unsatisfiable since THR-1016 made that file generated and untracked.

### The scheduler

`list_task_runs` shows the scheduler never runs two `tb-opus-pickup` runs at once, and a slot missed while a run is alive fires the moment it ends (04:11→05:41 run; next run 05:42). A denser cron therefore produces back-to-back runs with no double-claim risk — the existing WIP=1 resume logic is never exercised by two live runs.

## Step 1 — THR-1717 (this ticket)

### 1a. Context diet — `.claude/settings.json`

- `enabledPlugins: false` for plugins with no Threadbare use: `playground`, `webgpu-threejs-tsl` (the map is raw Three.js WebGL), `vercel` (deploy checks go through `npm run check:deploy`; its SessionStart hooks inject ~2k tokens), `miro`, and the synced `productivity`, `design`, `engineering`, `product-management`, `data`, `finance`, `cowork-plugin-management`. Kept: `code-review`, `github`, `playwright`, `commit-commands`, `discord` (`keep-work-flowing-cc` reads Christian's Discord replies).
- `deniedMcpServers` for `ms365`, `dk-bogfoerer`, `billy` and the claude.ai connectors Claude Docs, Higgsfield, outlook mcp home made, Microsoft 365, nanobanana, Google Drive, Vercel, Gmail, Google Calendar, Notion, Miro, Slack. Kept: claude.ai **Linear** (every pickup invariant runs through it), `github`, `codesight`, Playwright, Discord.
- Project-scoped and checked in, so it applies in every worktree and to scheduled runs, and touches no other project on the machine.

### 1b. `CLAUDE.md` slimming — THR-1718 (follow-up, docs-only)

~17k tokens re-read every turn. Move rationale and incident history verbatim to canon homes (the THR-760 / THR-1336 pattern), keep a ≤ 25 KB card. Separate ticket because it is governed prose with its own review surface.

### 1c. `npm run gate` — one command, parallel, one-line verdicts

`scripts/gate.ts`:

1. Classifies the working tree against `origin/main` with `scripts/docs-only-predicate.ts` (the same predicate CI's `detect` job uses — no new copy).
2. **Code track:** runs `npm test`, `check:typecheck` and `vite build` concurrently; adds `test:heavy` and the 30-tick CLI smoke when an engine path is touched (`src/engine/`, `src/types/gameState.ts`, `src/types/graph.ts`), or always with `--heavy`.
3. **Docs track:** `check:impediment-ids` and `lint:plan-doc` on changed plan docs.
4. **Final phase** (`--final`, or included with `--all`): the tree-diffing gates `check:generated-freshness` and `check:wiki-freshness:blocking`, which must run after every closeout edit (verification-gates.md).
5. Prints one line per gate (`PASS`/`FAIL`, seconds) and, for a failure only, the last 40 lines of its log. Full logs go to `.cache/gate/<gate>.log`.
6. Writes `.cache/gate/receipt.json`: `{ codeKey, track, results, at }`. `codeKey` is a SHA-256 over the `git ls-files -s` lines of every **non-docs** path in the working tree (tracked and untracked, via a temporary index), so closeout doc edits after the gate do not invalidate it and any code edit does.

The session's gate sequence becomes: implement → `npm run gate` → closeout docs → commit → `npm run gate -- --final` → push.

### 1d. A cheap commit hook

`.claude/hooks/pre-commit-gate.sh` delegates to `scripts/gate.ts --pre-commit`, which passes immediately when:

- the commit message starts `wip(` (THR-1529 checkpoint — taken before verification by design), or
- the working tree's code diff is empty (docs-only commit), or
- `.cache/gate/receipt.json` carries a passing code track whose `codeKey` matches the current tree.

Otherwise it runs `vitest related --run` on the changed code files only (three fast projects) and the existing untracked-import check. The no-op `tsc --noEmit` is removed. CI's required `Test · Typecheck · Build` check remains the authoritative full gate; nothing about it changes.

`.claude/hooks/pre-push-gate.sh`: drop the `Docs/project-status.md` requirement (untracked since THR-1016), skip the doc checks on a `wip(`-headed branch tip, and skip the `vite build` when the receipt already records a passing build for the current `codeKey`.

### 1e. Back-to-back pickup

After 1a–1d land: `tb-opus-pickup` cron `0 * * * *` → `*/20 * * * *`. A run that is still alive at a slot simply has its next run start the moment it ends; an idle lane waits at most 20 minutes. Registry row, prompt mirror and the live prompt updated in the same change; crons re-listed after the update (impediment #359).

**Usage-limit caution.** The lane runs on Fable and has died on Fable usage limits before (2026-09-22). More runs per day spend more of that budget; 1a–1d are what pay for 1e. If the lane starts dying on limits, the lever is the cron (back to `*/30` or hourly), not the gate.

## Step 2 — a second executor (THR-1719, director decision)

Only after one week of step 1 data, and only if Ready for Dev never sits empty for more than two hours in that week. Shape: a second task `tb-pickup-b` offset 10 minutes; the WIP predicate becomes per-lane (each lane tags its claim and resumes only its own claims — today a second lane would "resume" the first lane's live claim); `Mutex with` honoured against In Dev partners. WIP = 1 is Christian's standing rule, so THR-1719 is reserved for his yes.

## Substrate inventory

N/A — no Engine pillar. Delivery-tooling surfaces touched: `.claude/hooks/pre-commit-gate.sh`, `.claude/hooks/pre-push-gate.sh` (extends), `scripts/docs-only-predicate.ts` (consumed, unchanged), `scripts/classify-diff.ts` (unchanged), the `tb-opus-pickup` prompt (extends), `.claude/settings.json` (extends).

## Engine pillar

Engine: N/A — no simulation, tick-loop or graph change.

## Content pillar

Content: N/A — no authored content.

## UI pillar

UI: N/A — no player surface. Browser-verify exempt: tooling/hooks only.

## Wiring

No runtime modules — nothing is called from the orchestrator or rendered in GameView, so `Docs/plans/wiring-checklist.md` gains no row. The delivery wiring:

| Module | Called by | Reads | Writes | Debug visibility |
|---|---|---|---|---|
| `scripts/gate.ts` (`npm run gate`) | executor sessions (pickup prompt step 4, pull-work, verification-gates.md) | working tree, `origin/main`, `docs-only-predicate.ts` | `.cache/gate/*.log`, `.cache/gate/receipt.json` | one verdict line per gate; logs on disk |
| `scripts/gate.ts --pre-commit` | `.claude/hooks/pre-commit-gate.sh` | the hook's tool input (commit command), receipt | nothing | hook stderr on failure |
| `.claude/hooks/pre-push-gate.sh` | Claude `PreToolUse` on `git push` | branch diff, receipt | nothing | hook stderr on failure |
| `.claude/settings.json` | every Claude Code session in the repo | — | — | the session's tool list |

## Tracing

N/A — no simulation traces. Inspectability is carried by the per-gate logs under `.cache/gate/` and the receipt's `results` array (`{ gate, ok, seconds, log }`).

## Interface impact

None. No contract in `Docs/canon/interface-map.md` is added, retired or rerouted; the plan names engine paths only as a classifier pattern.

## Blast Radius

No high-impact file is modified. `src/types/gameState.ts` and `src/types/graph.ts` appear only as entries in `ENGINE_PATH_PATTERNS` (a path test), not as edits.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `GATE_FAIL_TAIL_LINES` | 40 | Log lines printed for a failing gate |
| `GATE_LOG_DIR` | `.cache/gate` | Where full gate logs and the receipt live |
| `ENGINE_PATH_PATTERNS` | `src/engine/`, `src/types/gameState.ts`, `src/types/graph.ts` | Paths that add `test:heavy` + CLI smoke |
| `WIP_COMMIT_PREFIX` | `wip(` | Commit-message prefix the pre-commit hook passes through |
| Pickup cron | `*/20 * * * *` | Maximum idle gap between pickup runs |

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Receipt missing, unreadable or for another tree | Pre-commit falls back to `vitest related` on changed code |
| `git` fails while computing `codeKey` | No receipt match → related tests run; never a false pass |
| Classifier cannot reach `origin/main` | Treat as code track (the expensive, safe direction) |
| A gate process crashes | Reported `FAIL` with its log tail; `npm run gate` exits non-zero |
| Fable usage limits after the cron change | Revert cron to `*/30`; recorded in the registry |

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Constants above are named in `scripts/gate.ts`; cron in the registry |
| 2. Inspectability | PASS | Per-gate logs and a receipt on disk; one-line verdicts |
| 3. Determinism | PASS | No randomness; `codeKey` is a content hash |
| 4. Fail-soft | PASS | Every unknown state falls back to running more checks, never fewer |
| 5. Narrative over mechanical perfection | N/A | Tooling |
| 6. Additive over destructive | PASS with note | Removes one no-op typecheck and one unsatisfiable doc check; CI unchanged |
| 7. Performance budget | PASS | 135 s → 74 s for the code track; commit with receipt ≈ seconds |

## Three-pillar check

- [x] Engine pillar N/A with rationale
- [x] Content pillar N/A with rationale
- [x] UI pillar N/A with rationale
- [x] Wiring section — N/A, no runtime modules

## Vision audit

- [x] This plan does not contradict any Vision premise
- [x] No Vision edit is needed — delivery tooling only

## Rulebook impact

- [x] This plan does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss)
- [x] No `Docs/canon/rulebook.md` update is needed

## Notes for the executor

- **CI is unchanged and stays authoritative.** The local gate gets faster; the required `Test · Typecheck · Build` check still runs the full suite on every code PR. Do not touch `ci.yml`.
- **Reuse the predicate, never copy it.** `scripts/gate.ts` imports `isDocsOnlyPath` from `scripts/docs-only-predicate.ts`; a new hand-written copy would need registering with `check:predicate-copies`.
- **The hook must fail toward running checks.** Any unknown (no receipt, git error, classifier error) runs `vitest related`; only the three named pass-throughs skip.
- **`PreToolUse` fires before the whole Bash command**, so in `git add -A && git commit …` the index is not yet updated when the hook runs. Key the receipt on the working tree (temporary index), not the real index.
- **Re-list crons after any scheduled-task update** and diff against the registry (impediment #359 — any toggle may drop a cron).
- Edit the live prompt at `C:\Users\chris\.claude\scheduled-tasks\tb-opus-pickup\SKILL.md` **and** its mirror `Docs/ops/scheduled-task-prompts/tb-opus-pickup.md` in the same change.

## Forked-audit verdicts

Not run. Director-directed tooling plan (Christian, attended chat 2026-10-03); all three pillars are N/A, so the pillar and Vision auditors have nothing to score, and the NFP table above is filled. The implementation PR still passes the THR-1691 review gate (cold reviewer + refuting verifier) before arming.

## Done when

- [ ] Headless probe from a worktree shows the denied servers absent and Linear present; turn-1 context recorded before/after
- [ ] `npm run gate` passes on the branch; docs-only and code fixtures each pick the right track (unit tests)
- [ ] A commit with a matching receipt completes in < 10 s (timed); a `wip(` commit and a docs-only commit skip tests
- [ ] `tb-opus-pickup` cron re-listed after the update and matching the registry
- [ ] `npm test`, ratchet, `vite build`, freshness gates green; closing commit carries the close line for THR-1717

## Coordination block

- **Suggested model:** Opus — edits the hooks every lane commits through.
- **Parallel-safe with:** product tickets (no `src/` change).
- **Mutex with:** THR-1718 (both edit `CLAUDE.md` gate wording); THR-1719 (both edit the pickup prompt and registry).
- **Files to touch:** `.claude/settings.json`, `.claude/hooks/pre-commit-gate.sh`, `.claude/hooks/pre-push-gate.sh`, `scripts/gate.ts` (new), `scripts/__tests__/gate.test.ts` (new), `package.json`, `Docs/canon/verification-gates.md`, `.claude/skills/pull-work/SKILL.md`, `Docs/ops/scheduled-task-prompts/tb-opus-pickup.md`, `Docs/ops/scheduled-tasks-registry.md`, `CLAUDE.md` (gate pointer line only).
