---
name: flush-plan-docs
description: Commit Cowork-authored plan docs tagged with `plan-pending-commit` to origin/main via the scheduled flush workflow.
last_validated_against: 2026-06-29
---

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
git commit -m "docs(plan): commit <plan-doc-basename>"
```

Where `<plan-doc-basename>` is the plan-doc filename without the `.md` extension
(e.g. `2026-06-28-some-topic`). **Do NOT put the issue identifier in the commit subject**
(THR-510): committing a plan doc never resolves its issue, and a bare `THR-XXX` token in a
commit/PR/branch is treated by GitHub→Linear as a closing reference, sweeping the issue to Done.
The issue↔commit link is preserved by the Step 3 confirmation comment instead.

Capture the commit SHA from the output.

### 2f. Push

```bash
git push origin main
```

If push succeeds: proceed to Step 3.

If push is rejected (non-fast-forward / GH013 error per impediments #83/84/110):
fall back to flush-branch path. The following steps are all **REQUIRED** — do not
stop after the commit:

1. Create branch (**branch name MUST NOT contain the issue identifier** — THR-510):
   ```bash
   git checkout -b docs/plan-flush-<plan-doc-basename>
   ```
   Use the plan-doc basename (ID-free, e.g. `docs/plan-flush-2026-06-28-some-topic`). A
   `THR-XXX` token in the branch name links the issue to the PR and closes it on merge.

2. Push branch (**REQUIRED — do not skip**):
   ```bash
   git push -u origin docs/plan-flush-<plan-doc-basename>
   ```

3. Verify push (**REQUIRED**):
   ```bash
   git ls-remote --heads origin docs/plan-flush-<plan-doc-basename>
   ```
   The remote head must equal the local commit SHA captured in Step 2e.
   If empty or mismatched: invoke **2f.fail** — do not continue to Step 4.

4. Open PR (**REQUIRED — do not skip**):
   ```bash
   gh pr create \
     --title "docs(plan): batch flush <YYYY-MM-DD>" \
     --body  "Auto-flush of plan doc \`<plan-doc-path>\` (issue: <issue-title>). Commits a design doc only — does NOT resolve any Linear issue. Issue identifiers are intentionally omitted from this PR body/commit/branch to avoid GitHub→Linear auto-close (THR-510); the issue link lives in the Step 3 confirmation comment."
   ```
   **Never put `Fixes`/`Closes`/`Resolves`, a bare `THR-XXX`, or a `linear.app/.../issue/THR-XXX`
   URL in the title or body** (THR-510). GitHub's **native** Linear integration closes on the
   `Closes <linear-url>` form regardless of the `linear-autoclose.yml` guard — the guard only
   governs the custom `Fixes THR-NNN` merge=Done action, it cannot stop native URL-keyword closing.
   So scrubbing the body is the *only* effective defense; a single leaked `Closes <url>` line
   re-closed an unimplemented issue via this exact vector (THR-534, PR #428 → THR-525). The title
   must keep the literal `docs(plan): batch flush` prefix — the guard (`isDocsFlushContext`) relies on it.
   Do not add `--label docs-only` — do not create labels from this skill, and omit the
   flag if the label does not exist in the repo. Capture the PR URL from the output.

5. Verify PR exists (**REQUIRED**):
   ```bash
   gh pr view <pr-number> --json url,state
   ```
   The `state` must be OPEN (or MERGED if auto-merge fired immediately).
   If `gh pr view` returns "not found" or errors: invoke **2f.fail**.

6. Enable auto-merge (best-effort, not gating):
   ```bash
   gh pr merge <pr-number> --auto --squash
   ```
   Capture the exit code. Non-zero is logged but does not block Step 3 — auto-merge
   may not be enabled at the repo level.

7. Record the PR URL in the confirmation comment posted in Step 3.

**Invariant:** proceed to Step 3 (cleanup) only after Step 5 succeeds — the PR must be
verified OPEN or MERGED. If any of Steps 2–5 fail, invoke **2f.fail** and do not proceed to
Step 3 for this issue.

### 2f.fail — Partial-publish recovery

If branch push (Step 2f.2) fails:
- Leave the local commit in place.
- Do NOT proceed to Step 3 for this issue — label stays on.
- Post bounce comment on the issue:
  > "flush-plan-docs: commit `<sha>` made locally on branch `docs/plan-flush-<plan-doc-basename>`,
  > but branch push to origin failed. Label retained. Next flush pass will retry;
  > if it persists, a human can push the branch manually."
- Continue to the next issue.

If push verify (Step 2f.3) fails — remote head does not match local SHA:
- Same recovery as branch push failure.

If PR creation (Step 2f.4) fails:
- The branch is on remote but no PR exists.
- Do NOT proceed to Step 3 for this issue — label stays on.
- Post bounce comment:
  > "flush-plan-docs: branch `docs/plan-flush-<plan-doc-basename>` pushed at `<sha>`, but PR
  > creation failed with: `<error>`. Label retained. A human can open the PR manually:
  > `gh pr create --head docs/plan-flush-<plan-doc-basename> --title 'docs(plan): batch flush <date>'`"
- Continue to the next issue.

If PR verify (Step 2f.5) fails — PR was created but `gh pr view` errors:
- Treat as PR creation failure. Bounce with the same comment plus any PR URL captured in
  Step 2f.4 so the human has a starting point.

## Step 3 — Cleanup

For each issue where **Step 2f succeeded** (push to main OR PR verified OPEN/MERGED):

1. Remove the label:
   ```
   save_issue(id: <issue-id>, labels: <existing-labels minus "plan-pending-commit">)
   ```

2. Post confirmation comment:
   ```
   save_comment(issueId: <issue-id>, body: "Plan doc auto-committed at <sha> by flush-plan-docs. Label removed; ready for executor pickup if state is already Ready for Dev.")
   ```
   For branch-fallback path: include the PR URL in this comment.
   For already-committed: use the confirmation message from 2c instead.

3. Verify-after-write: call `get_issue(id)` and confirm `plan-pending-commit` is no longer in labels.
   If label still present (impediment #48 silent drop), retry `save_issue` once. If still stuck, post
   a second comment: `WARNING: label removal failed after two attempts. Manual removal required.`

**Note:** Issues that hit **2f.fail** do NOT get label removal in Step 3 — the label is intentionally
retained so the next flush pass retries them.

## Step 4 — Stale-label sweep

After all issues from Step 1 have been processed, run an independent cleanup pass:

1. Re-query: `list_issues(label: "plan-pending-commit")`. This catches issues that
   carried the label before this flush pass started, including any that weren't on
   the Step 1 list.

2. For each issue in the result:

   a. If status is Done or Canceled:
      - Remove the `plan-pending-commit` label.
      - Post comment:
        > "Stale plan-pending-commit label cleared by flush-plan-docs sweep —
        > issue is in `<status>` state, plan doc is presumed already on main.
        > No commit performed."
      - Verify-after-write per impediment #48.

   b. Otherwise, check whether the plan doc referenced in the description is already
      in git history:
      ```bash
      git log --oneline -1 -- <plan-doc-path>
      ```
      If output is non-empty (doc already on main):
      - Remove the `plan-pending-commit` label.
      - Post comment:
        > "Stale plan-pending-commit label cleared by flush-plan-docs sweep —
        > plan doc `<path>` is already at `<sha>` on main. No commit performed."
      - Verify-after-write.

   c. Otherwise: leave the label intact. The issue will be reprocessed on the next
      flush pass.

3. Output one line per cleaned issue:
   ```
   [flush-plan-docs] sweep cleared THR-XXX: <reason>
   ```

## Hard Rules

- **Never emits a closeable issue reference (THR-510).** A flush commit, PR title, PR body, and
  branch name MUST NOT contain a `Fixes`/`Closes`/`Resolves` keyword, a bare `THR-XXX` token, or a
  `linear.app/.../issue/THR-XXX` URL. Committing a plan doc never resolves its issue — emitting any
  of these makes GitHub→Linear sweep the referenced issue(s) to Done (the recurring bug this skill
  caused 3×). The only issue↔PR link is the Step 3 confirmation comment posted *on the issue*.
- **Never edits any file.** Only `git add` + `git commit` + `git push`. No `Write`, `Edit`, or file mutations.
- **Refuses to run if staging area is non-empty** at skill entry (Step 0).
- **Refuses to stage anything outside `Docs/plans/` or `Docs/audits/`** — scope guard exits before `git add`.
- **Never sets issue state.** Only removes the `plan-pending-commit` label. Cowork owns state transitions.
- **One-at-a-time processing.** If multiple issues are labeled, process sequentially. A bounce on one does not stop others.
- **Bounce, don't crash.** Parse failures, scope-guard failures, staging anomalies, partial-publish failures all produce a comment on the issue and continue — never throw or exit-1 mid-loop.
- **Label removed only after publish is verified.** For branch-fallback path: label removed only after Step 2f.5 (PR verify) succeeds. For direct-to-main path: label removed after push succeeds.

## Output Summary

After processing all issues, output one line per issue:

```
[flush-plan-docs] THR-280: committed docs/plans/2026-04-27-test-suite-stabilization-v2.md at abc1234. Label removed.
[flush-plan-docs] THR-281: bounce — multiple paths found: [path1, path2]. Label intact.
[flush-plan-docs] THR-282: already committed at def5678. Label removed.
[flush-plan-docs] sweep cleared THR-283: issue is Done, label was stale.
```

Then a final summary: `[flush-plan-docs] Done. X processed, Y bounced, Z swept.`

## Impediment Notes

- **Impediment #90:** `create_scheduled_task` cannot be invoked from inside a scheduled-task session.
  The initial task registration must happen in a regular (non-scheduled) CC session.
- **Impediment #48:** Linear `save_issue` state/label writes may silently drop. Always verify-after-write.
- **Impediment #83/84:** `git push origin main` may fail with GH013 when branch protection is active.
  Use the PR fallback path described in Step 2f.
- **Impediment #110:** Branch protection is enforced on `main` — direct push is always rejected.
  The branch-fallback path in Step 2f is the designed behavior, not an error condition.
- **Impediment #112:** Branch-fallback previously committed locally but never pushed or opened a PR.
  Fixed in THR-423 (2026-05-12): push + PR are now required steps with verify-after-write.
- **Impediment #140 family / THR-510:** flush commits/PRs/branches that carried a `THR-XXX` token
  (bare, as a `Closes <url>` line, or in the branch name) made GitHub→Linear auto-close every
  referenced issue on merge. Fixed in THR-510 (2026-06-28): issue identifiers are now scrubbed from
  the commit subject, PR title/body, and branch name (Steps 2e/2f). The `linear-autoclose.yml`
  action also exempts `docs(plan): batch flush` / `docs/plan-flush-*` PRs as a deterministic belt.
