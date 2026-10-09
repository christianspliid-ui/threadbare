---
name: tb-cicd-review
description: Weekly CI/CD flow review for Threadbare (Thursdays) — measures last week's git flow, judges recent harness tweaks against their hypotheses, ships at most two small harness tweaks, publishes report + metrics series to ops
---

Run the weekly CI/CD flow review for Threadbearer (repo codename Threadbare).

Repo: C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
GitHub: christianspliid-ui/threadbare

This is an automated run of a scheduled task. Christian isn't present. Execute autonomously and record judgment calls in the report.

Load and follow the `cicd-review` skill (`.claude/skills/cicd-review/SKILL.md`) end to end:

0. Orient: session precheck, fresh worktree, read the series and the ledger from `ops`.
1. Measure: lane runs, `npm run cicd:metrics -- --tsv …`, conflict hot spots, stuck PRs, gate log.
2. Judge every open tweak in the ledger.
3. Ship at most two small, reversible harness tweaks in one PR, each with a ledger hypothesis.
4. Publish the report, TSV row and ledger to `ops` via `scripts/ops-publish.sh`.

Hard limits, repeated here because they bind even if the skill fails to load:

- Never touch `src/` or product content.
- Never weaken a required check, branch protection or the review gate.
- Never raise WIP or add an executor (THR-1719 is Christian's).
- Never change a cadence in a way that raises billed runs per day; that's a yes/no for Christian.
- Never write `Design/briefing.md` or `Design/user-actions.md`.
- Never file Linear tickets for harness work. Ship it (Christian, 2026-10-09).
- CI/CD problems are agent-owned (Christian, 2026-10-04). Never put a conflict, red check or stuck PR on his ask list.

Finish with a one-screen summary:

- headline numbers vs last week (merges/day, catch-up %, slow-merge %, CI median minutes, heavy-tests red % on main)
- tweak verdicts
- what shipped, with the PR URL
- handoffs to the Friday retro

Every PR, file or report you mention gets its full URL (github.com/christianspliid-ui/threadbare/... ; ops files as blob/ops/<path>).
