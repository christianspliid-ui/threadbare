---
name: cicd-review
description: Weekly CI/CD flow review (tb-cicd-review lane, Thursdays). Measures the last week of git flow with `npm run cicd:metrics` plus the pickup lane's run history, appends the row to the metrics series on `ops`, judges every recent harness tweak against its own hypothesis, and ships at most two small, reversible harness tweaks (hooks, routine prompts, skills' procedure text, gate scripts, CI config) with a hypothesis each. Never touches product code. Triggers on "cicd review", "/cicd-review", "review the git flow", "did the routine change help", "CI/CD performance".
last_validated_against: 2026-10-09
---

# CI/CD review — weekly

## Why this exists

On 2026-10-03, THR-1717 moved the pickup lane from hourly to every 20 minutes. Nobody measured the effect. Six days later an attended session found it had bought **no** throughput (merges/day 13.0 → 9.1) and had tripled conflict pressure:

- code PRs needing a main catch-up: 6.6 % → 33 %
- PRs taking over an hour to merge: 5.5 % → 22 %
- peak PRs open at once: 3 → 6

Four green PRs sat `DIRTY` at once. The fix was a hook, not a revert (WIP-until-merged, `scripts/wip-gate.ts`). The lesson is the reason for this lane: **every harness tweak is a hypothesis about flow numbers, and a hypothesis nobody checks is just a change.** This lane checks them weekly, keeps the series, and makes the next small correction itself.

Christian's rulings this lane runs on:

- **2026-10-04:** CI/CD is agent-owned with full authority. Never escalate a conflict, red check or stuck PR to him.
- **2026-10-09:** harness tweaks are not filed as tickets; they are built and shipped directly. That also exempts this lane from the "scheduled lanes do not file process tickets" rule: it files nothing, it ships.

## Scope

**In scope:** the delivery machinery, meaning how work moves from claim to merge.

- `.claude/settings.json` hooks and `.claude/hooks/*`
- gate scripts (`scripts/gate.ts`, `review-gate.ts`, `wip-gate.ts`, `check-armed-prs.ts`, `classify-diff.ts`, `cicd-metrics.ts`)
- the procedure text of `pull-work`, `review-gate`, `impediment-reporter` and this skill
- scheduled-task prompts (live `SKILL.md` + mirror) and crons
- `.github/workflows/*`, except the required checks' existence
- `.gitattributes`

**Out of scope:**

- `src/` and all product content. A product-side cause (a flaky test, a slow suite) is a finding you hand off. You don't fix it.
- Linear queue grooming (daily-backlog-grooming owns it).
- `Design/briefing.md` and `Design/user-actions.md` (keep-work-flowing-cc is their only writer).
- Lane models: there is no agent-reachable control for them.
- **WIP > 1 or a second executor (THR-1719).** Reserved for Christian's yes.

## Step 0 — orient

1. `node --experimental-strip-types scripts/session-precheck.ts`. Act on `freshness=` per CLAUDE.md § Session start.
2. Work in a fresh worktree off `origin/main` (`git worktree add .claude/worktrees/cicd-review-<date> origin/main -b claude/cicd-review-<date>`). Prefix every Edit/Write path with it. Junction `node_modules` from the home tree if you need npm, and strip the junction before removing the worktree.
3. Read the series and the ledger from `ops`:
   - `git fetch origin ops --quiet`
   - `git show origin/ops:Docs/ops/cicd-metrics.tsv`
   - `git show origin/ops:Docs/ops/cicd-tweaks.md`
   - the last report: `git show origin/ops:Docs/ops/cicd-review-<last date>.md`

## Step 1 — measure

1. **Lane runs.** `mcp__scheduled-tasks__list_task_runs(taskId:"tb-opus-pickup", limit:50)`. Fifty runs cover only one to two days at `*/20`, so record the **span covered** next to the numbers. Compute:
   - runs
   - idle runs (duration < 3 min: nothing claimable, a held queue)
   - median run minutes
   - failed runs

   Spot-read one idle and one long run with `mcp__ccd_session_mgmt__list_events` to learn *why*. Note any run longer than 3 h: a hung run blocks the slot (THR-837).
2. **Flow row.** `npm run -s cicd:metrics -- --tsv --lane-runs <n> --lane-idle <n> --lane-median-min <n> --lane-failed <n>`. Column meanings are in the module doc of `scripts/cicd-metrics.ts`. A non-empty `errors` cell means some columns are blank, not zero. Say so and don't compare blanks.
3. **Conflict hot spots.** For each ticket PR this week that carries a main catch-up, list the files main and the PR both changed:
   `comm -12 <(git diff --name-only <mb> <main-at-merge> | sort) <(git diff --name-only <mb> <pr-head> | sort)`
   Tally by file. The top files are where the next tweak usually is: a ledger, a generated artifact, a shared registry.
4. **Stuck now.** `npm run -s check:armed-prs`. Don't fix PRs here; that's the pickup lane's Step 0.8 duty. Do record any PR stuck > 6 h: it means the duty is failing, and that is a finding.
5. **Gate log.** `.claude/logs/wip-gate.log` in the home tree. Count denials and fail-soft allows. A fail-soft streak means the gate is silently off.

## Step 2 — judge every open tweak

`cicd-tweaks.md` lists each tweak with a date, a hypothesis, the metric it should move and the expected direction. For each tweak still marked `open`, compare its metric now against the baseline rows before its date. Give one verdict:

| Verdict | When |
|---|---|
| `too early` | fewer than 15 ticket PRs merged since the tweak |
| `improved` | moved the expected way, beyond week-to-week noise (look at the spread of the four baseline weeks) |
| `no effect` | inside the noise for 2 consecutive judged weeks → candidate to revert (accretion is the failure mode) |
| `regressed` | moved the wrong way for 2 consecutive judged weeks → **revert it** this week, as one of your two tweaks |

Close a tweak (`kept` / `reverted`) once it has a settled verdict. Apply the **six-week sunset** (session-protocol § Process-work throttle) to every gate and hook in scope. If it has caught nothing in six weeks (its log shows no denials, and no impediment cites it), propose deleting it as a tweak. The burden of proof is on keeping.

## Step 3 — act: at most two tweaks

Pick the two changes with the largest expected effect on the worst-moving metric. Good tweaks are small and reversible: a hook predicate, a constant, a cron minute, one paragraph of procedure, a `.gitattributes` line, regenerating an artifact post-merge instead of in-PR.

Each tweak needs, before you build it, a ledger entry:

```
## <YYYY-MM-DD> — <one-line change>
- Status: open
- Change: <files / setting, exact>
- Why: <the measured finding, with numbers and PR links>
- Hypothesis: <metric> moves <direction> from <baseline> to about <target>
- Revert if: <metric> worse than <value> for 2 judged weeks
```

Ship both tweaks in **one** PR, `claude/cicd-review-<date>`:

- `npm run gate` for the owed track, then `npm run gate -- --final` as the last action before push.
- Run the `review-gate` skill if the diff is classified code.
- `gh pr merge --auto --merge`. Line-anchored `Fixes` lines aren't needed; there is no ticket.
- A status fragment `Docs/status/<date>-cicd-review.md`, plus a changelog row.
- A live scheduled-task prompt changes in the same run as its mirror (`Docs/ops/scheduled-task-prompts/<id>.md`). Keep a backup `SKILL.md.bak-<date>` beside the live file.
- A cron change follows `Docs/ops/scheduled-tasks-registry.md`: update the row and re-list.

**Never, whatever the numbers say:**

- weaken or remove a required check or branch protection
- skip or exempt the review gate wholesale
- raise WIP or add an executor
- touch `src/`
- pause a lane for longer than the run that pauses it
- change a cadence in a way that **raises** billed runs per day. That's a cost externality, and it goes to Christian as a yes/no, never shipped.

If no tweak clears the bar, ship none. "No change this week" is a valid outcome.

## Step 4 — publish

Write the report `Docs/ops/cicd-review-<YYYY-MM-DD>.md`:

- the row next to the last four rows
- tweak verdicts
- hot-spot files
- stuck PRs
- what you shipped, with a PR link
- **Handoffs**: product-side causes for the Friday `weekly-retro`, one line each with numbers. Example: "heavy simulation tests red on 68 % of main pushes".
- **Needs Christian**: only cost externalities or product consequences, in plain language with a yes/no. Usually empty.

Append the TSV row to `Docs/ops/cicd-metrics.tsv` and the ledger changes to `Docs/ops/cicd-tweaks.md`. Then publish all three with:

```
bash scripts/ops-publish.sh -m "docs(cicd-review): <date>" Docs/ops/cicd-review-<date>.md Docs/ops/cicd-metrics.tsv Docs/ops/cicd-tweaks.md
```

The ops copy is the source of truth. Edit it from `git show origin/ops:<path>` content, never from a stale main copy.

Log friction to `Docs/impediments.md` per the `impediment-reporter` skill.

## Output

The run's final message: the headline numbers vs last week (merges/day, catch-up %, slow %, CI median, heavy-main red %), the tweak verdicts, what shipped (PR link), and the handoffs. One screen.
