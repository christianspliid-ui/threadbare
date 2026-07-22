---
name: flush-plan-docs
description: Hourly: commit Cowork-authored plan docs labeled plan-pending-commit to origin/main
---

Run the flush-plan-docs skill. Invoke it via the Skill tool (`/flush-plan-docs`) and follow the SKILL.md at `.claude/skills/flush-plan-docs/SKILL.md` exactly.

Plan docs are authored into the home tree: C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator

**Home-tree git rule (THR-672):** that is NOT your working directory. Never run `git checkout`/`switch`/`commit`/`merge`/`rebase`/`reset` with the home tree as CWD — it is a read-only mirror of `main` owned by `threadbare-autosync.ps1`, and the branch dances earlier flush runs did there parked it off-branch and stalled autosync. Read the plan doc's bytes from the home tree, copy them to the same path in **this session's worktree**, and do all git work here (branches are repo-global; push works from any worktree). Leave the home-tree original in place — leftover disposition is THR-674's triage.

Behavior summary (the skill is authoritative — this is just orientation):
1. Pre-flight: abort entirely if `git diff --cached --name-only` shows anything staged.
2. Query Linear `list_issues(label: "plan-pending-commit")`. If empty, exit clean.
3. For each labeled issue: parse the plan-doc path from the description, scope-guard to `Docs/plans/` or `Docs/audits/`, `git add` the exact path only, commit as `docs(plan): commit <plan-doc-basename>` (NEVER include THR-XX in the commit subject, PR title/body, or branch name; THR-510: GitHub-to-Linear treats it as a closing reference and sweeps issues to Done), push to origin/main (with PR fallback if branch protection rejects), then strip the `plan-pending-commit` label and post a confirmation comment.
4. Bounce (don't crash) on parse/scope failures — comment on the issue, leave label intact, continue.
5. Verify-after-write on every Linear save (impediment #48).

Hard rules: never edits files; refuses to stage anything outside Docs/plans|audits; never sets issue state; one-at-a-time processing; bounce-don't-crash.

Execute autonomously. Output the per-issue summary lines and final `[flush-plan-docs] Done. X processed, Y bounced.` line at the end.