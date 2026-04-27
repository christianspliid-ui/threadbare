# flush-plan-docs

## Purpose

Commit Cowork-authored plan docs that are sitting uncommitted in the main worktree to `origin/main`.
Triggered by the `plan-pending-commit` Linear label. Runs hourly via scheduled task.

Invoke this skill via the Skill tool: `/flush-plan-docs`

## When This Runs

A scheduled CC task fires this skill every hour at :15. Cowork applies the `plan-pending-commit`
label to a Linear issue whenever it writes a plan doc into `Docs/plans/` or `Docs/audits/`.
This skill detects those labels, commits the referenced files, removes the label, and posts a
confirmation comment. It never edits files — only stages and commits.

## Step 0 — Pre-flight: verify clean staging area

```bash
git diff --cached --name-only
```

If any files are staged, **abort entirely**: log a warning and exit. Do not process any issues.
The skill only runs from a clean staging area to prevent bundling unrelated work.

## Step 1 — Scan for labeled issues

Call `list_issues(label: "plan-pending-commit")` to get all candidates.

If the list is empty: output `[flush-plan-docs] No plan-pending-commit issues found. Exiting clean.` and stop.

## Step 2 — Process each issue sequentially

For each labeled issue, run this sub-procedure:

### 2a. Fetch full issue

Call `get_issue(id)` to get the full description and issue identifier (e.g. `THR-280`).

### 2b. Parse plan-doc path

Extract the plan-doc path from the description using these patterns (try in order):

1. Backtick-quoted: `` `Docs/plans/[a-z0-9-]+\.md` `` or `` `Docs/audits/[a-z0-9-]+\.md` ``
2. Plain mention: `Docs/plans/[a-z0-9-]+\.md` or `Docs/audits/[a-z0-9-]+\.md`
3. Explicit label: `Plan doc:\s*\`?(Docs/(?:plans|audits)/[a-z0-9-]+\.md)\`?`

If **zero paths found**: bounce — post comment explaining the parse failure, leave label intact,
continue to next issue. Do not commit.

If **multiple distinct paths found**: bounce — post comment listing the ambiguous paths, leave
label intact, continue to next issue.

If **exactly one path found**: proceed to 2c.

### 2c. Scope guard

Verify all of these. If any check fails, bounce with a specific comment and continue to next issue.

1. **Prefix check:** path must start with `Docs/plans/` or `Docs/audits/`. No other directories.
2. **File exists:** check with `git ls-files --others --exclude-standard <path>` (untracked) or
   `git status --porcelain <path>` (modified tracked). Also accept if file exists in the tree via
   direct filesystem check.
3. **Already committed check:** run `git log --oneline -1 -- <path>`. If output is non-empty,
   the file is already in git history — skip the commit, just remove the label and post:
   `Plan doc already committed at <sha> (not by this skill). Label removed.`
4. **Uncommitted check:** `git status --porcelain <path>` must show the file as untracked (`??`)
   or modified (`M`). If it shows nothing and also has no git history, bounce:
   `File not found in working tree and not in git history. Nothing to commit.`

### 2d. Stage and verify

```bash
git add <exact-path>            # exact path, never glob or '.'
git diff --cached --name-only   # verify output = exactly <path>
```

If `git diff --cached --name-only` shows anything other than the exact expected path:
abort, unstage (`git reset HEAD`), bounce with comment. This is the final safety net.

### 2e. Commit

```bash
git commit -m "docs(plan): <issue-identifier> <issue-title>"
```

Where `<issue-identifier>` is e.g. `THR-280` and `<issue-title>` is the full title from `get_issue`.

Capture the commit SHA from the output.

### 2f. Push

```bash
git push origin main
```

If push succeeds: proceed to Step 3.

If push is rejected (non-fast-forward / GH013 error per impediments #83/84): fall back to branch path:
1. Create branch: `git checkout -b docs/plan-flush-<issue-identifier-lowercase>`
2. Push branch: `git push origin docs/plan-flush-<issue-identifier-lowercase>`
3. Open PR via `gh pr create` with title `docs(plan): <issue-identifier> <issue-title>` and
   body `Auto-created by flush-plan-docs for plan-pending-commit label. Closes <issue-url>.`
   Add label `docs-only` if it exists in the repo.
4. Attempt auto-merge: `gh pr merge --auto --squash`

## Step 3 — Cleanup

For each successfully committed (or already-committed) issue:

1. Remove the label:
   ```
   save_issue(id: <issue-id>, labels: <existing-labels minus "plan-pending-commit">)
   ```

2. Post confirmation comment:
   ```
   save_comment(issueId: <issue-id>, body: "Plan doc auto-committed at <sha> by flush-plan-docs. Label removed; ready for executor pickup if state is already Ready for Dev.")
   ```
   For already-committed: use the confirmation message from 2c instead.

3. Verify-after-write: call `get_issue(id)` and confirm `plan-pending-commit` is no longer in labels.
   If label still present (impediment #48 silent drop), retry `save_issue` once. If still stuck, post
   a second comment: `WARNING: label removal failed after two attempts. Manual removal required.`

## Hard Rules

- **Never edits any file.** Only `git add` + `git commit` + `git push`. No `Write`, `Edit`, or file mutations.
- **Refuses to run if staging area is non-empty** at skill entry (Step 0).
- **Refuses to stage anything outside `Docs/plans/` or `Docs/audits/`** — scope guard exits before `git add`.
- **Never sets issue state.** Only removes the `plan-pending-commit` label. Cowork owns state transitions.
- **One-at-a-time processing.** If multiple issues are labeled, process sequentially. A bounce on one does not stop others.
- **Bounce, don't crash.** Parse failures, scope-guard failures, staging anomalies all produce a comment on the issue and continue — never throw or exit-1 mid-loop.

## Output Summary

After processing all issues, output one line per issue:

```
[flush-plan-docs] THR-280: committed docs/plan/2026-04-27-test-suite-stabilization-v2.md at abc1234. Label removed.
[flush-plan-docs] THR-281: bounce — multiple paths found: [path1, path2]. Label intact.
[flush-plan-docs] THR-282: already committed at def5678. Label removed.
```

Then a final summary: `[flush-plan-docs] Done. X processed, Y bounced.`

## Impediment Notes

- **Impediment #90:** `create_scheduled_task` cannot be invoked from inside a scheduled-task session.
  The initial task registration must happen in a regular (non-scheduled) CC session.
- **Impediment #48:** Linear `save_issue` state/label writes may silently drop. Always verify-after-write.
- **Impediment #83/84:** `git push origin main` may fail with GH013 when branch protection is active.
  Use the PR fallback path described in Step 2f.
