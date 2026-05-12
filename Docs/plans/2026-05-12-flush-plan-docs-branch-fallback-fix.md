# flush-plan-docs branch-fallback + stale-label sweep

**Date:** 2026-05-12
**Linear:** THR-423
**Project:** Continuous Improvement
**Author:** Cowork
**Suggested executor:** CC sonnet
**Status:** Ready for Dev

## Why

Impediment #112 (2026-05-04): the `flush-plan-docs` scheduled task tried to commit the THR-300 plan doc directly to `main`, was rejected by branch protection (impediment #110), and fell through to the branch-fallback path. The fallback created a local branch `docs/plan-flush-thr-300` and committed the file there, but **never pushed the branch and never opened a PR.** The branch sat local-only for over an hour until the next CC pickup session noticed the orphan branch and pushed it manually. While the THR-300 doc was stranded, the same flush pass also left stale `plan-pending-commit` labels on THR-296 / THR-297 / THR-298 — unrelated issues whose labels weren't cleaned up.

The current `.claude/skills/flush-plan-docs/SKILL.md` (last validated 2026-05-08) *does* list `git push -u origin <branch>` and `gh pr create` as numbered substeps inside Step 2f. The substeps are not the problem in the abstract — the failure mode is that they are:

1. **Buried as sub-list items** under a single "If push is rejected" conditional, easy for the executor to read as "create a branch and commit" and then return to the loop.
2. **Not followed by any verify-after-write step** — there is no check that `git push origin <branch>` actually published the ref, nor that `gh pr create` returned a PR URL.
3. **Not protected against partial failure** — if the branch push succeeds but `gh pr create` fails (auth, rate limit, network), the skill currently has no defined recovery. The branch is on remote but no PR exists, and the issue's `plan-pending-commit` label has already been cleared in Step 3 because Step 2e committed successfully.
4. **Paired with a Step-3 cleanup pass that only touches the issues the loop processed in this run.** Stale labels on unrelated issues — including issues already in Done state — never get reaped.

This plan doc fixes both halves of impediment #112: branch-fallback robustness and stale-label hygiene.

## Three-pillar check

* **Engine:** N/A — workflow tooling, no game state, no tick loop, no graph.
* **Content:** N/A — no encounters, templates, prose, or data tables.
* **UI:** N/A — no player surface. Skill output is terminal log + Linear comments; both already exist.
* **Wiring:** Two skill files (`.claude/`, `.agents/` mirror) + CLAUDE.md § Scheduled Tasks docs.

This is pure infrastructure; the three-pillar rule is satisfied by explicit N/A marking with rationale.

## Files to touch

* `.claude/skills/flush-plan-docs/SKILL.md` — canonical for shared skills (CC reads this path).
* `.agents/skills/flush-plan-docs/SKILL.md` — mirror; produced by `npm run check:skill-sync:sync` after `.claude/` is edited.
* `CLAUDE.md` — § Scheduled Tasks row for `flush-plan-docs`, and the two prose mentions (lines 9, 412) to clarify the PR-flow outcome.
* `Docs/impediments.md` — append a brief "permanent fix landed" note to row #112 referencing THR-423 + this plan doc.

No production-code files. No tests beyond a documented rehearsal (Done When §3).

## What changes

### Change A — Restructure Step 2f as required steps, not a fallback substep tree

Replace the existing Step 2f with the structure below. Every numbered step is a hard requirement; the `if` is only about *which* branch we end up on, not about whether the push/PR happens.

```
### 2f. Publish

Decide the publish target:
  - If `git push origin main` succeeds: target is main. Done — proceed to Step 3.
  - If `git push origin main` is rejected (non-fast-forward / GH013 per impediments #83/84/110):
    target is a flush branch. Continue below.

For the flush-branch target:

1. Create branch:
     git checkout -b docs/plan-flush-<issue-identifier-lowercase>

2. Push branch (REQUIRED — do not skip):
     git push -u origin docs/plan-flush-<issue-identifier-lowercase>

3. Verify push (REQUIRED):
     git ls-remote --heads origin docs/plan-flush-<issue-identifier-lowercase>
   The remote head must equal the local commit SHA captured in Step 2e.
   If empty or mismatched: bounce — see Failure handling below.

4. Open PR (REQUIRED — do not skip):
     gh pr create \
       --title "docs(plan): batch flush <YYYY-MM-DD>" \
       --body  "Auto-flush of plan-pending-commit labeled issues. Closes <issue-url>." \
       --label docs-only  (omit --label if the label does not exist)
   Capture the PR URL from the output.

5. Verify PR exists (REQUIRED):
     gh pr view <pr-number> --json url,state
   The `state` must be OPEN (or MERGED if auto-merge fired immediately).
   If `gh pr view` returns "not found" or errors: bounce — see Failure handling.

6. Enable auto-merge (best-effort, not gating):
     gh pr merge <pr-number> --auto --squash
   Capture the exit code. A non-zero exit is logged but does not block Step 3 —
   auto-merge may not be enabled at the repo level (Ask-of-user from 2026-05-11 retro).

7. Record the PR URL on the Linear issue confirmation comment (Step 3) so a human
   can find it without grepping git remotes.
```

Three things to note:

* The title moved from `docs(plan): <issue-identifier> <issue-title>` to `docs(plan): batch flush <date>` per impediment #103 (Linear's GitHub integration auto-closes issues when the PR title contains the issue ID). The body still references the issue URL so the integration's body-match path still works for closure; the title is now safe even if the closure pattern races.
* Step 4 names the label `docs-only` exactly. If that label does not exist in the repo, the executor must check once and either (a) drop the `--label` flag or (b) create the label before `gh pr create`. Decision: drop the flag, log a one-line warning, continue. Do not create labels from this skill.
* Step 6's auto-merge is explicitly non-gating because impediment #110's retro action #3 ("Consider whether auto-merge on green CI can be enabled for scheduled tasks") is still an Ask-of-user — see §Open questions.

### Change B — Failure handling for partial publishes

Add a new sub-block under Step 2f:

```
### 2f.fail — Partial-publish recovery

If Step 2 (branch push) fails:
  - Leave the local commit in place.
  - Do NOT remove the plan-pending-commit label.
  - Do NOT post a "committed" confirmation.
  - Post bounce comment on the issue:
      "flush-plan-docs: commit <sha> made locally on branch
       docs/plan-flush-<id>, but branch push to origin failed.
       Label retained. Next flush pass will retry; if it persists,
       a human can push the branch manually."
  - Continue to the next issue.

If Step 3 (push verify) fails — local SHA does not match remote head:
  - Same recovery as Step 2 failure. Treat as if push didn't happen.

If Step 4 (gh pr create) fails:
  - The branch is on origin but no PR exists.
  - Do NOT remove the plan-pending-commit label.
  - Post bounce comment on the issue:
      "flush-plan-docs: branch docs/plan-flush-<id> pushed at <sha>,
       but PR creation failed with: <error>. Label retained.
       A human can open the PR manually with:
       gh pr create --head docs/plan-flush-<id> --title 'docs(plan): batch flush <date>'"
  - Continue to the next issue.

If Step 5 (PR verify) fails — PR was created but cannot be re-read:
  - Treat as Step 4 failure. Bounce with the same comment plus the PR
    URL captured in Step 4 in case it materializes later.
```

The invariant the failure block enforces: **the `plan-pending-commit` label is removed only after Step 5 succeeds.** Today the label can be removed even when the PR fails to materialize, because Step 3 (cleanup) runs unconditionally after Step 2e (commit). This invariant change is what closes impediment #112 — partial state no longer looks like success.

### Change C — New Step 4: stale-label sweep

Append a new Step 4 to the skill, between current Step 3 and the Hard Rules block:

```
## Step 4 — Stale-label sweep

After all issues from Step 1 have been processed, run an independent cleanup pass:

1. Re-query: list_issues(label: "plan-pending-commit"). This catches issues that
   carried the label before this flush pass started, including any not on the
   Step 1 list because they were added in the past hour.

2. For each issue in the result:

   a. If status is Done or Canceled:
        - Remove the plan-pending-commit label.
        - Post comment:
            "Stale plan-pending-commit label cleared by flush-plan-docs
             sweep — issue is in <status> state, plan doc is presumed
             already on main. No commit performed."
        - Verify-after-write per impediment #48.

   b. If status is anything else, check whether the plan doc referenced in
      the description is already in git history:
        git log --oneline -1 -- <plan-doc-path>
      If output is non-empty (doc already on main):
        - Remove the plan-pending-commit label.
        - Post comment:
            "Stale plan-pending-commit label cleared by flush-plan-docs
             sweep — plan doc <path> is already at <sha> on main. No
             commit performed."
        - Verify-after-write.

   c. Otherwise: leave the label intact. The issue will be reprocessed on
      the next flush pass.

3. Output one line per cleaned issue:
    [flush-plan-docs] sweep cleared THR-XXX: <reason>
```

This sweep is idempotent and safe to run every pass. It's what fixes the THR-296/297/298 half of impediment #112.

### Change D — CLAUDE.md doc updates

Three small edits in CLAUDE.md:

1. Line ~9 (Cowork mode prose): change
     > "The hourly `flush-plan-docs` scheduled task commits the file to `origin/main` and removes the label, typically within 1 hour."
   to
     > "The hourly `flush-plan-docs` scheduled task commits the file — directly to `origin/main` when possible, or via an auto-flush PR if branch protection rejects the direct push — and removes the label, typically within 1 hour (longer when CI gates the PR)."

2. Line ~412 (Session Workflow prose): same substantive substitution — make clear the commit may go via PR.

3. Line 445 (Scheduled Tasks table row for `flush-plan-docs`): change the Purpose column to
     > "Commit `plan-pending-commit`-labeled plan docs to `origin/main` (direct push or auto-flush PR) and sweep stale labels off Done/already-merged issues"

### Change E — Impediments log note

Append to the Action column of row #112 in `Docs/impediments.md`:

> "**Resolved 2026-05-12 (THR-423):** flush-plan-docs skill restructured to make push + PR creation required steps with verify-after-write; new stale-label sweep added; partial-publish recovery posts bounce comments and retains the label until the PR is actually open. See `Docs/plans/2026-05-12-flush-plan-docs-branch-fallback-fix.md`."

Do not edit row #110 — it remains the historical record of when branch protection became enforced; the workflow fix lives under #112.

## Done when

1. `.claude/skills/flush-plan-docs/SKILL.md` reflects Changes A, B, C above; `last_validated_against` bumped to 2026-05-12.
2. `.agents/skills/flush-plan-docs/SKILL.md` is in sync with `.claude/` (run `npm run check:skill-sync:sync`).
3. **Rehearsal (REQUIRED before commit):** dry-run the branch-fallback path against a test scratch branch. Procedure:
   * Create a throwaway plan doc at `Docs/plans/2026-05-12-rehearsal-thr-423.md` containing a single line of placeholder text.
   * Create a throwaway Linear issue (title prefix `[REHEARSAL]`) in Continuous Improvement, add the `plan-pending-commit` label, and put the path in its description so the parser picks it up.
   * Locally simulate Step 2f failing the `git push origin main` step (`git push origin main:refs/heads/no-such-target` or similar contrived rejection) so the branch-fallback path triggers.
   * Walk the steps manually and confirm: branch pushes, PR opens, PR verify passes, confirmation comment posts with the PR URL, label is removed only after Step 5 succeeds.
   * Tear down: close the rehearsal PR and Linear issue, delete the rehearsal branch, delete the rehearsal plan doc. (Do not let rehearsal artifacts merge.)
   * Paste the terminal output of the walk into the closing commit body as evidence.
   * **If full rehearsal is infeasible** (sandbox restriction, missing gh auth, etc.), document precisely which steps were exercised vs. only read-walked, and which were validated in a follow-up real flush run.
4. CLAUDE.md is updated per Change D.
5. `Docs/impediments.md` row #112 carries the THR-423 resolution note per Change E.
6. Pre-commit checklist: `npm test`, `npx tsc --noEmit`, `npx vite build`, `npm run check:process`. None of these touch the changed files directly, but the skill-sync hook will fire and block if the mirror is out of date.
7. Closing commit body includes `Fixes THR-423` plus the rehearsal output (or the documented-infeasibility note from §3).
8. Browser-verify exempt: skill-content + docs only, no UI or runtime code touched.

## Open questions (do not block this ticket)

* **Auto-merge enablement** — Step 6 of Change A leaves auto-merge as best-effort. Whether to enable auto-merge on `docs-only`-labeled PRs at the repo level is a separate Ask-of-user from the 2026-04-23 and 2026-05-11 retros. If the answer is yes, a follow-up issue can flip auto-merge from best-effort to required and remove the "may not be enabled" caveat from the skill.
* **Outside-repo scheduled-task SKILL.md** — the actual scheduled-task prompt for `flush-plan-docs` lives outside the repo in the user's Claude Code config. If that file diverges from `.claude/skills/flush-plan-docs/SKILL.md`, the in-repo fix doesn't propagate. Asking the user to re-paste the in-repo skill into the scheduled-task SKILL.md after this lands is the proper close-out step; track as a follow-up ask, not a blocker.
* **PR title and Linear auto-close** — Change A moves to a date-based title to dodge the issue-ID match path from impediment #103. The PR body still references issue URLs. If Linear's URL-based body match also auto-closes issues (it does for `Closes <url>` patterns in some configurations), the skill may need to use a non-keyword phrasing like "Auto-flush ref: <url>" instead. Verify behavior on the first real branch-fallback run after this lands; if auto-close fires inappropriately, file a follow-up.

## Constants / tunables

None. This is procedural; no thresholds, retry counts, or magic numbers are introduced. If the partial-publish recovery ever needs a retry loop, *that's* the moment to add a constant — not now. Today's design: one attempt per step, bounce on failure.

## Tracing

The skill already produces a terminal log line per processed issue. Change C adds one new line type:

```
[flush-plan-docs] sweep cleared THR-XXX: <reason>
```

The final summary line gains an extra count:

```
[flush-plan-docs] Done. X processed, Y bounced, Z swept.
```

No new TypeScript interfaces; this is shell output for a scheduled task.

## Fail-soft table

| Failure | Behavior |
| --- | --- |
| `git push origin main` rejected | Fall to flush-branch path (designed behavior, not a failure). |
| `git push -u origin <branch>` fails | Bounce on the issue, retain label, log to terminal, continue to next issue. |
| Branch push verify mismatch | Same as branch push failure. |
| `gh pr create` fails (auth/network/rate) | Bounce on the issue, retain label, branch left on remote so a human can open the PR manually, continue to next issue. |
| PR verify fails | Same as `gh pr create` failure. |
| `gh pr merge --auto` fails | Log warning, continue to Step 3. Auto-merge is best-effort. |
| Sweep Step 4.2.a label removal fails | Verify-after-write retries once; if still stuck, second comment "WARNING: stale label removal failed; manual removal required". Same as existing Step 3 behavior. |

The invariant in every row: `plan-pending-commit` label is only removed after the corresponding doc is actually published on a real ref (main or open PR head).

## Coordination block

* **Suggested model:** sonnet (skill text edits + impediment log append + CLAUDE.md doc touch + rehearsal walk; no engine code).
* **Parallel-safe with:** none currently In Dev for `.claude/skills/flush-plan-docs/`, CLAUDE.md, or `Docs/impediments.md`. Safe alongside content / engine / UI work that doesn't touch these paths.
* **Mutex with:** any other Continuous Improvement issue editing `.claude/skills/flush-plan-docs/SKILL.md`, `.agents/skills/flush-plan-docs/SKILL.md`, CLAUDE.md § Scheduled Tasks, or `Docs/impediments.md` row #110 / #112.
* **Codex review:** no — pure workflow tooling, no runtime risk, structural change is small.
