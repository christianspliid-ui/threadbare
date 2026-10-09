### 2026-10-09 — WIP-until-merged gate + weekly CI/CD review lane (harness, no ticket)

**The finding.** Christian asked whether moving the pickup lane from hourly to every 20 minutes (THR-1717, 2026-10-03) had helped, since merge conflicts had become frequent.

It hadn't. Ticket-PR merges/day fell from 13.0 to 9.1, because throughput was bound by the shelf: on 2026-10-06 the lane ran about 40 one-minute runs against veto-held tickets. Conflict pressure tripled:

| Metric | Week before | Week after |
|---|---|---|
| PRs needing a main catch-up | 6.6 % | 33 % |
| PRs taking over an hour to merge | 5.5 % | 22 % |
| p90 open → merge | 15 min | 247 min |
| Peak PRs open at once | 3 | 6 |

The mechanism has three parts:

- WIP = 1 counted In Dev claims only, and an armed PR was "discharged". Under the hourly cron the ~30 min idle gap let that PR's ~13 min CI land before the next branch was cut. At `*/20` the next run branched beside it.
- Every ticket PR appends the same ledgers and regenerates the same artifacts.
- GitHub's mergeability ignores `.gitattributes merge=union`. #2275 and #2277 were `DIRTY` on GitHub while `git merge-tree` merged them cleanly.

On 2026-10-09, five green PRs (#2271, #2272, #2273, #2275, #2277) sat conflicted, and each unstick re-broke the rest: #2271 was fixed at 04:53 and dirty again at 04:58.

**The change** (Christian: harness tweaks ship directly, no ticket):

- **`scripts/wip-gate.ts`, a PreToolUse hook on `mcp__.*__save_issue`.** It refuses a move to In Dev while a non-draft, unheld open PR closes a different ticket.
  - Allowed: a resume of the PR's own ticket.
  - Never blocking: PRs idle more than 24 h.
  - Fail-soft when `gh` errors.
  - Every decision is logged to `.claude/logs/wip-gate.log` in the home tree.
  - Probed live with `claude -p` from the worktree: the hook fired on `mcp__claude_ai_Linear__save_issue`, denied the claim and named all five PRs.
- **`pull-work` Step 1.5 and the docs-only drain** now teach the rule: when refused, unstick or end the run. The drain waits at most 5 min for each docs PR to merge before its next claim. The `tb-opus-pickup` prompt changed in the live file and the mirror.
- **`scripts/cicd-metrics.ts` (`npm run cicd:metrics`)** computes one TSV row per week: throughput, flow time, catch-up share, peak concurrency, open/dirty now, CI wall time and failure rate, heavy-tests red rate on main, gate denials, and lane-run columns. The series is backfilled from 2026-09-12 on `ops` (`Docs/ops/cicd-metrics.tsv`).
- **The `cicd-review` skill and the `tb-cicd-review` lane** (Thursdays 15:17, `17 15 * * 4`) measure, judge each tweak in `Docs/ops/cicd-tweaks.md` against its hypothesis, and ship at most two small harness tweaks a week. The lane never touches `src/`, never weakens a required check, and never raises WIP or billed cadence.
- **`session-protocol.md`** records the harness exception to "lanes don't file process tickets".

**Also surfaced:** `Heavy simulation tests` is red on 55–68 % of `main` pushes since the week of 2026-09-19 (1.7 % before). It's not a required check, so nothing noticed. This was handed to the Friday retro.

**Evidence:** `scripts/__tests__/{wip-gate,cicd-metrics}.test.ts` (21 tests), the live hook probe, `npm run gate` and the review-gate receipt on the PR.
