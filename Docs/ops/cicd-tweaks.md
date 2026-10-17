# CI/CD tweak ledger

Append-only. Every harness change that is meant to move a flow number gets an entry here **before** it ships: what changed, the measured reason, the hypothesis (metric, direction, target) and the revert condition. The weekly `tb-cicd-review` lane (`cicd-review` skill) judges each `open` entry against `Docs/ops/cicd-metrics.tsv` and closes it as `kept` or `reverted`. Verdicts: `too early` (< 15 ticket PRs merged since), `improved`, `no effect` (2 judged weeks inside the noise, so it's a revert candidate), `regressed` (2 judged weeks the wrong way, so revert).

Baseline noise (4 weeks 09-12 → 10-03, before either entry below): merges/day 7.7–13.0, catch-up 6.6–13.3 %, slow > 60 min 3.7–10 %, peak concurrent 2–3.

## 2026-10-03 — pickup cron hourly → `*/20` (THR-1717)
- Status: **judged 2026-10-09: regressed, superseded** (not reverted; the cause was fixed instead, see the next entry)
- Change: `tb-opus-pickup` cron `0 * * * *` → `*/20 * * * *`, so runs go back to back.
- Why: runs took ~31 min and the lane sat idle the rest of each hour (THR-1717 measurement).
- Hypothesis (implicit, never written down; the reason this ledger exists): merges/day up.
- Measured (week 10-03 → 10-09):

| Metric | Before | After |
|---|---|---|
| merges/day | 13.0 | 9.3 |
| catch-up | 6.6 % | 33.3 % |
| slow > 60 min | 5.5 % | 23.1 % |
| p90 open → merge | 15 min | 330 min |
| peak concurrent | 3 | 6 |

  Throughput was shelf-bound: on 10-06, ~40 one-minute runs found only veto-held tickets. The faster cadence let each run branch beside the previous unmerged PR.

## 2026-10-09 — WIP-until-merged claim gate (hook)
- Status: **kept — judged 2026-10-17 (week 2 of 2): improved.** Window 10-10 → 10-17, 70 ticket PRs merged (10.0/day):
  - catch-up **6.9 %** (target ≤ 10 %): met.
  - slow > 60 min **8.6 %** (target ≤ 8 %): one PR short over 7 days; met in the non-overlapping 10-15 → 10-17 slice (7.5 %).
  - peak concurrent **3** over 7 days (target ≤ 2): not met; **2** in the slice.
  - fail-soft 0 both weeks; merges/day well above the revert line of 7.

  The two slow PRs added this week did not come from conflicts: #2444 (101 min, four review-gate rounds) and #2419 (112 min, red CI). Closed.

  The hook's six-week sunset falls on 2026-11-20. It has logged one deny ever (10-09, during the drain), because the Step 1.5 procedure text holds the slot before the hook is reached. The sunset pass must weigh that text, not the hook's log.
- Earlier verdict — **judged 2026-10-15 (week 1 of 2): improved.** Post-gate window 10-10 → 10-15 (43 ticket PRs merged): catch-up 33.3 % → **8.9 %** (target met), slow > 60 min 23.1 % → **11.6 %** (better, target ≤ 8 % not met), peak concurrent 6 → **3** (target ≤ 2 not met), merges/day 8.6 with 24 of 49 lane runs idle (supply- and CI-wait-bound, not gate-starved), fail-soft 0, 1 denial. Of the 5 slow PRs, only #2382 and #2397 were conflict catch-ups; #2410 was a deliberate draft park, #2419 a red CI, #2387 an attended branch. Peak 3 includes drafts and attended PRs, which the gate does not count by design. Keep open one more week to confirm slow %.
- Change: `scripts/wip-gate.ts`, a PreToolUse hook on `mcp__.*__save_issue`. It refuses a claim (In Dev + assignee) while a non-draft, unheld, < 24 h-idle open PR closes a different ticket. Also the `pull-work` Step 1.5 + drain text and the `tb-opus-pickup` prompt. Cron stays `*/20`.
- Why: see the entry above. GitHub ignores `merge=union`, so overlapping ticket PRs conflict on the shared ledgers and generated artifacts by construction. On 2026-10-09, five green PRs were DIRTY at once.
- Hypothesis: `pct_main_catchup` back to ≤ 10 % and `pct_slow_gt60m` ≤ 8 %, with `peak_concurrent_ticket_prs` ≤ 2. `merges_per_day` no lower than the shelf allows: compare against `lane_idle_runs`. If idle runs dominate, supply is the limit, not the gate.
- Revert if: merges/day falls below 7 for 2 judged weeks **while** idle runs are few (the gate is starving a stocked shelf), or `wip_gate_failsoft` > 0 two weeks running (the gate is silently off; fix it, don't revert).

## 2026-10-15 — sunset the inert `Stop` hook (`session-stop-gate.sh`)
- Status: **kept — judged 2026-10-17.** 40 ticket PRs merged since. No flow metric moved, as predicted. No impediment since 10-15 logs work lost at a session end that a working stop check would have caught. The one near-loss, #1198 (a 23k-line batch left unpushed), happened mid-run, not at Stop, and the 10-16 retro fixed it in pull-work. Closed.
- Change: removed the `Stop` registration from `.claude/settings.json`; deleted `.claude/hooks/session-stop-gate.sh`, the never-registered `.claude/hooks/stop-retro.sh`, and `.claude/hooks/lib/json-get.js` (used only by those two). PR https://github.com/christianspliid-ui/threadbare/pull/2426.
- Why: six-week sunset. Shipped 2026-04-13 (DoD hooks plan); no log, no impediment cites it, and its output `{"hookSpecificOutput":{"continue":true,...}}` is a shape Stop hooks don't read, so it never forced a continuation. THR-1717 already dropped its never-firing pre-commit/pre-push siblings on 2026-10-03; this one was missed. It cost a bash + node spawn at every turn end in every session.
- Hypothesis: no flow metric moves (it never acted). Expected effect: zero behaviour change, slightly less per-turn overhead.
- Revert if: an impediment logs lost uncommitted or unpushed work at session end that a *working* stop check would have caught. Even then, revert to a hook with a valid `decision: "block"` contract, not this script.

## 2026-10-17 — pickup runs keep every command in the foreground
- Status: open
- Change: the `tb-opus-pickup` prompt and `pull-work` Step 1.6. The prompt is updated live (`~/.claude/scheduled-tasks/tb-opus-pickup/SKILL.md`, backup `SKILL.md.bak-2026-10-17`) and in its mirror (`Docs/ops/scheduled-task-prompts/tb-opus-pickup.md`). Both now say: run the gate, review gate, CLI smoke and Vite in the foreground with a Bash `timeout` of 600000, never `run_in_background`. PR https://github.com/christianspliid-ui/threadbare/pull/2466. Freeze exception: this repairs machinery that broke a cited run.
- Why: a turn that ends while a background command runs is marked `succeeded` in the run list. The scheduler then starts the next run, and Step 1.6 (THR-1887) sees only one active row.
  - On 2026-10-17 the 13:31Z run backgrounded its gate and ended its turn at 13:45:06Z. The 13:45:14Z run committed that live worktree as "stranded" work and built THR-1919 a second time (#2459). The 13:31Z run stood down only after its own gate finished.
  - Four overlaps were seen from 10-14 to 10-17 (10-14 20:11Z and 23:31Z; 10-17 12:11Z and 13:31Z). In every one, the overlapped run had backgrounded commands and was resumed by their notifications.
  - Last week's report credited THR-1887 ([#2418](https://github.com/christianspliid-ui/threadbare/pull/2418)) with ending overlaps. It could not, because its check reads the same run list.
  - Since 10-10, 78 of 298 pickup gate calls were backgrounded. The 219 timed foreground gate runs took 1.7 min median and 5.8 min at most.
- Hypothesis: overlapping pickup runs (two rows in `list_task_runs` whose start/end intersect) fall from 2 per 49 runs to 0, and no pickup transcript after the merge contains a `<task-notification>` resume. There is no TSV column for this; count it from the run list and the transcripts.
- Revert if, over 2 judged weeks: a foreground gate in a pickup run hits the 10-min Bash cap and is killed mid-run; or overlaps continue with no background use, which means the cause is elsewhere (fix that first, then revert this text).
