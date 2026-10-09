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
- Status: open
- Change: `scripts/wip-gate.ts`, a PreToolUse hook on `mcp__.*__save_issue`. It refuses a claim (In Dev + assignee) while a non-draft, unheld, < 24 h-idle open PR closes a different ticket. Also the `pull-work` Step 1.5 + drain text and the `tb-opus-pickup` prompt. Cron stays `*/20`.
- Why: see the entry above. GitHub ignores `merge=union`, so overlapping ticket PRs conflict on the shared ledgers and generated artifacts by construction. On 2026-10-09, five green PRs were DIRTY at once.
- Hypothesis: `pct_main_catchup` back to ≤ 10 % and `pct_slow_gt60m` ≤ 8 %, with `peak_concurrent_ticket_prs` ≤ 2. `merges_per_day` no lower than the shelf allows: compare against `lane_idle_runs`. If idle runs dominate, supply is the limit, not the gate.
- Revert if: merges/day falls below 7 for 2 judged weeks **while** idle runs are few (the gate is starving a stocked shelf), or `wip_gate_failsoft` > 0 two weeks running (the gate is silently off; fix it, don't revert).
