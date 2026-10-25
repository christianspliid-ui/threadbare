---
name: tb-weekly-review
description: Weekly process review for Threadbare (Fridays) — one pass, one report on ops. Impediments + drift-scan issues, the CI/CD metrics row, queue health. Replaced five separate process lanes (THR-1950).
---

Run the weekly process review for Threadbearer (repo codename Threadbare).

Repo: C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
GitHub: christianspliid-ui/threadbare
Linear team: Threadbare

This is an automated run of a scheduled task. Christian isn't present. Execute autonomously and record judgment calls in the report.

This one lane replaces five that reviewed the process separately (`weekly-retro`, `weekly-workflow-retro`, `tb-cicd-review`, `weekly-project-hygiene`, `daily-backlog-grooming` — all disabled 2026-10-25, THR-1950; their prompts stay restorable under `Docs/ops/scheduled-task-prompts/`). One pass, one report. Keep it short: the point of the fold is less pipeline, not the same pipeline in one file.

## 0. Orient

- First call: `node --experimental-strip-types scripts/session-precheck.ts`. Work in a fresh worktree off `origin/main`; never run git state operations in the home tree (THR-672).
- `git fetch origin ops --quiet`. Read last week's report from `ops` (`git show origin/ops:Docs/ops/weekly-review-<last-friday>.md`), plus `Docs/ops/cicd-metrics.tsv` and `Docs/ops/cicd-tweaks.md` from `ops`.

## 1. Impediments + drift-scan issues (retrospective skill)

Load the `retrospective` skill and run its analysis: this week's `drift-scan`-labeled issues first, then `Docs/impediments.md`. It is the single promotion point for process tickets (`Docs/canon/session-protocol.md`): file only what clears the materiality bar, each with its cost/benefit line.

**Override of the skill's report step:** do not open a `docs/retro-*` PR to `main`. The retro section goes into this run's one report, published to `ops` in step 5 *before* any ticket cites it (the THR-798 rule still binds; a ticket cites the `ops` blob URL, and only after `git show origin/ops:<path>` succeeds).

## 2. CI/CD metrics row (cicd-review skill)

Load the `cicd-review` skill and run its Measure and Judge steps: lane runs, `npm run cicd:metrics -- --tsv …`, conflict hot spots, stuck PRs, gate log; a verdict on every open tweak in the ledger. Append the TSV row and update the ledger.

It may ship at most two small, reversible harness tweaks in one PR, each with a ledger hypothesis. **Until 2026-11-13 (the pipeline freeze, THR-1946) a tweak may only remove or loosen machinery** — no new gate, hook, check, rule or lane.

## 3. Queue health (backlog-grooming core checks)

Board scans state-filtered only (never one unfiltered `list_issues`; sort priority in memory, `orderBy:priority` errors).

- **In Dev:** any issue silent 24 h+ — read its latest comment and route it (healthy checkpoint → one line; upstream-shipped → note it for Christian, never write `Done`; 3+ checkpoints without a ship → flag for re-scoping).
- **Ready for Dev:** count it, split product vs process. An empty or held-only product shelf is a supply problem to say plainly, not a backlog to prune.
- **Materiality sweep:** on `Ready for Dev` / `Todo` tickets that are process work (labels `Infrastructure` / `Improvement`, or project Continuous Improvement), cancel ones whose quoted cost is below the bar, smaller than a ticket, or paperwork about another ticket. Comment the reason before the state write; `get_issue` after every write (impediment #48). `0 canceled` is a valid result. Never touch product tickets.
- **Orphans:** every issue belongs to a project; assign the obvious ones.

## 4. Hygiene — only where it blocks work

Check the scheduled-task registry against `list_scheduled_tasks` (crons can be wiped by any state toggle — impediment #359; restore from `Docs/ops/scheduled-tasks-registry.md`). Anything else from the old hygiene sweep (skill tree, doc staleness, wiki escape-net, content census) only when it is actively blocking a lane or a ticket this week. No sweep for its own sake.

## 5. Report and publish

Write `Docs/ops/weekly-review-YYYY-MM-DD.md`, under 60 lines:

```
---
lane: tb-weekly-review
run: YYYY-MM-DD
filed: <n>
canceled: <n>
tweaksShipped: <n>
needsChristian: <true | false>
---
# Weekly review — YYYY-MM-DD

## Needs Christian
(plain-language decision + recommendation, one per item, in game terms — or "nothing needs you")

## Headline numbers
(merges/day, catch-up %, slow-merge %, CI median minutes, heavy-tests red % on main — vs last week)

## Impediments and drift
(patterns, what was filed with its cost line, what stayed a log row)

## Tweaks
(verdict per open tweak; what shipped, with the PR URL)

## Queue
(counts; product vs process; stalled work; sweep result)

## Blocking hygiene
(only items that blocked work, or "none")
```

Publish from the worktree root: `bash scripts/ops-publish.sh -m "docs(ops): weekly review <date>" Docs/ops/weekly-review-<date>.md` (plus the TSV and ledger if changed). On a successful publish delete the local copies; on failure keep them and note one line.

## Hard limits

- Never touch `src/` or product content. Never claim an issue or move one to In Dev.
- Never weaken a required check, branch protection or the review gate. Never raise WIP or add an executor.
- Never change a cadence in a way that raises billed runs per day; that is a yes/no for Christian.
- Never write `Design/briefing.md` or `Design/user-actions.md` — `keep-work-flowing-cc` owns them and reads `## Needs Christian` from this report.
- Never write `Done` on a Linear issue. No `Fixes`/`Closes`/`Resolves THR-XX` keyword in any ops commit.
- Harness tweaks ship directly, never as tickets (Christian, 2026-10-09). CI/CD problems are agent-owned — never on Christian's ask list.
- Every PR, file or report you mention gets its full URL (`github.com/christianspliid-ui/threadbare/...`; ops files as `blob/ops/<path>`).

Finish with a one-screen summary: headline numbers, what was filed or canceled, tweak verdicts and shipped PR, and the `ops` URL of the report.
