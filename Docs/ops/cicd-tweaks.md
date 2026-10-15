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
- Status: open — **judged 2026-10-15 (week 1 of 2): improved.** Post-gate window 10-10 → 10-15 (43 ticket PRs merged): catch-up 33.3 % → **8.9 %** (target met), slow > 60 min 23.1 % → **11.6 %** (better, target ≤ 8 % not met), peak concurrent 6 → **3** (target ≤ 2 not met), merges/day 8.6 with 24 of 49 lane runs idle (supply- and CI-wait-bound, not gate-starved), fail-soft 0, 1 denial. Of the 5 slow PRs, only #2382 and #2397 were conflict catch-ups; #2410 was a deliberate draft park, #2419 a red CI, #2387 an attended branch. Peak 3 includes drafts and attended PRs, which the gate does not count by design. Keep open one more week to confirm slow %.
- Change: `scripts/wip-gate.ts`, a PreToolUse hook on `mcp__.*__save_issue`. It refuses a claim (In Dev + assignee) while a non-draft, unheld, < 24 h-idle open PR closes a different ticket. Also the `pull-work` Step 1.5 + drain text and the `tb-opus-pickup` prompt. Cron stays `*/20`.
- Why: see the entry above. GitHub ignores `merge=union`, so overlapping ticket PRs conflict on the shared ledgers and generated artifacts by construction. On 2026-10-09, five green PRs were DIRTY at once.
- Hypothesis: `pct_main_catchup` back to ≤ 10 % and `pct_slow_gt60m` ≤ 8 %, with `peak_concurrent_ticket_prs` ≤ 2. `merges_per_day` no lower than the shelf allows: compare against `lane_idle_runs`. If idle runs dominate, supply is the limit, not the gate.
- Revert if: merges/day falls below 7 for 2 judged weeks **while** idle runs are few (the gate is starving a stocked shelf), or `wip_gate_failsoft` > 0 two weeks running (the gate is silently off; fix it, don't revert).

## 2026-10-15 — sunset the inert `Stop` hook (`session-stop-gate.sh`)
- Status: open
- Change: removed the `Stop` registration from `.claude/settings.json`; deleted `.claude/hooks/session-stop-gate.sh`, the never-registered `.claude/hooks/stop-retro.sh`, and `.claude/hooks/lib/json-get.js` (used only by those two). PR https://github.com/christianspliid-ui/threadbare/pull/2426.
- Why: six-week sunset. Shipped 2026-04-13 (DoD hooks plan); no log, no impediment cites it, and its output `{"hookSpecificOutput":{"continue":true,...}}` is a shape Stop hooks don't read, so it never forced a continuation. THR-1717 already dropped its never-firing pre-commit/pre-push siblings on 2026-10-03; this one was missed. It cost a bash + node spawn at every turn end in every session.
- Hypothesis: no flow metric moves (it never acted). Expected effect: zero behaviour change, slightly less per-turn overhead.
- Revert if: an impediment logs lost uncommitted or unpushed work at session end that a *working* stop check would have caught. Even then, revert to a hook with a valid `decision: "block"` contract, not this script.
