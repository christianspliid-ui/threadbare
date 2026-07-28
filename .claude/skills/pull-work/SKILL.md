---
name: pull-work
description: Canonical Claude Code pickup workflow for claiming Linear work safely from Ready for Dev.
last_validated_against: 2026-07-25
---

# Pull Work

## Purpose

Use this skill to run Claude Code's Linear pickup protocol as an explicit checklist instead of re-deriving it from prose each session.

Run as `/pull-work` (auto-pick top Ready for Dev issue) or `/pull-work THR-123` (target a specific issue).

## Scope

- Queue: `Ready for Dev` only
- Audience: Claude Code executor
- Outcome: either a verified `In Dev` claim, or a safe refusal with a bounce note

## pullNextReadyForDev — Atomic Pickup Procedure

**Canonical path for Rules 1, 4, and 7.** Execute this 6-step sequence as a single atomic unit instead of hand-rolling claim + verify + comment-read separately. Steps 1–4 below are the documented fallback for agents that bypass the wrapper. After verified claim, runs Step 4.5 worktree-isolation if home is dirty, then Step 4.6 stranded-commit zombie sweep.

**Constant:** `MAX_CLAIM_RETRIES = 3`

1. **Board scan** — consume the Step 1 board-scan (already built): **two state-filtered `list_issues` calls**, not one unfiltered 250-issue sweep. Sort Ready-for-Dev candidates by priority (1=Urgent first), then oldest `createdAt` as tie-break. Pick the top unassigned candidate.
1.5. **WIP gate** — if the "In Dev" slice filtered to `assignee:"me"` is empty, continue to step 2. If exactly one entry, route to Step 1.7 (resume-from-In-Dev upstream-shipped check) instead of exiting clean. If more than one entry, this is a Rule 6 violation — output the cross-session-leak trace line and exit 1.
2. **Claim** — `save_issue(id, assignee:"me", state:"In Dev")`.
3. **Verify** — `get_issue(id)`. Confirm both `assignee` and `state` match.
   - On mismatch (silent drop, impediment #48): release claim with `save_issue(id, assignee:null)`. Output trace line (see below). Move to the next candidate. Retry up to `MAX_CLAIM_RETRIES` total attempts.
   - On all retries exhausted: output final trace line and exit the wrapper — fall back to the hand-rolled Step 1–4 path below.
3.5. **Upstream-shipped check (Rule 9: don't re-do shipped work)** — run:

    git fetch origin main
    git log origin/main --grep="Fixes ${id}" --grep="Closes ${id}" --grep="Resolves ${id}" --regexp-ignore-case --extended-regexp --oneline

If the result is non-empty, the work has already landed but Linear's auto-close either lagged or failed. Do NOT proceed to read the plan doc or write code. Release the claim, post a one-line comment on the issue noting the upstream commit hash + first-line message, and exit cleanly.

    save_issue(id, assignee: null, state: "Ready for Dev")
    save_comment(issueId: id, body: "Upstream-shipped check found commit {sha} on origin/main: \"{first-line}\". Auto-close did not fire — please verify the keyword in the merge commit body and close manually if appropriate.")

**Fail-soft:** if `git fetch origin main` errors (network down, auth issue, sandbox limitation), log the error and continue to step 4 anyway. The upstream-shipped check is best-effort — a fetch failure must not block pickup of genuinely open work. Surface a one-line warning in the session log.

4. **Fetch latest comment** — `list_comments(id, orderBy:"createdAt", limit:5)`. Extract the most recent entry.
5. **Return bundle** — `{ issueId, state, assignee, latestComment }`. Continue from Step 5 (Reopened check) using this data.

**Trace output format** (documents retry behavior for inspectability — NFP #2):

Happy path:
```
[pullNextReadyForDev] Attempt 1/3: claiming THR-247... OK
[pullNextReadyForDev] Verify: assignee=Christian Spliid, state=In Dev ✓ — claim confirmed
[pullNextReadyForDev] Upstream check: clean — no matching commit on origin/main. Continuing to plan doc.
```

Upstream-shipped path:
```
[pullNextReadyForDev] Attempt 1/3: claiming THR-247... OK
[pullNextReadyForDev] Verify: assignee=Christian Spliid, state=In Dev ✓ — claim confirmed
[pullNextReadyForDev] Upstream check: found commit a1b2c3d "feat(thr-247): ..." — releasing claim, posting comment. Exiting clean.
```

Silent-drop retry:
```
[pullNextReadyForDev] Attempt 1/3: claiming THR-247... OK
[pullNextReadyForDev] Verify: assignee=null — silent drop (impediment #48). Releasing, trying next candidate.
[pullNextReadyForDev] Attempt 2/3: claiming THR-248... OK
[pullNextReadyForDev] Verify: assignee=Christian Spliid, state=In Dev ✓ — claim confirmed
```

All retries exhausted:
```
[pullNextReadyForDev] All 3/3 attempts failed — silent drops on all candidates. Surfacing error. Use hand-rolled Rule 1 path and log impediment via impediment-reporter.
```

---

## Steps

> **Prefer `pullNextReadyForDev` above** for the canonical one-call path. These steps are the documented fallback and expand exactly what the wrapper does internally.

### Step 0 — Session-start sweep

Before any pickup work, sweep for stale `tfws-pickup-*` and `tfws-resume-*` worktrees left by previous sessions. Prevents disk/grep pollution from accumulating across sessions.

**Constant:** `WORKTREE_STALE_DAYS = 14`

**Scope:** only worktrees whose path matches `../tfws-pickup-` or `../tfws-resume-` (created by Step 4.5).

**Ownership of `.claude/worktrees/` (settled THR-674).** The hourly reaper — `clean-stale-git.sh`, merge-gated and liveness-guarded per THR-673 — is the **single owner** of `.claude/worktrees/` cleanup. This sweep never touches that path, and neither does any other pull-work step. One folder, one policy: previously three separate policies claimed authority over `.claude/worktrees/` (this sweep's exclusion, the reaper's merge-gated reap, and ad-hoc ticket-driven cleanup), which is what let THR-674's worktree scope item stall — a stray worktree had no unambiguous owner to dispose of it. If a worktree under `.claude/worktrees/` needs disposition, that is a reaper concern; escalate via the reaper's `NEEDS-DISPOSITION` line rather than removing it here.

**Skip if:** the current session is already running inside a `tfws-pickup-*` or `tfws-resume-*` path (self-removal edge case).

**Procedure:**

1. Collect orphaned entries (registered but directory gone):
   ```bash
   git worktree prune
   ```
2. List all worktrees and filter for the `tfws-pickup-*` / `tfws-resume-*` pattern:
   ```bash
   git worktree list --porcelain
   ```
3. For each matching entry, evaluate two conditions:
   - **Clean:** `git -C <path> status --short -- ':!.codesight'` returns empty output. `.codesight/` modifications are auto-generated at session start and are not real uncommitted work.
   - **Stale:** the most recent commit timestamp on the branch HEAD is older than `WORKTREE_STALE_DAYS` days:
     ```bash
     git -C <path> log -1 --format="%ct"
     ```
4. If **both** conditions are true, remove the worktree and delete the local branch:
   ```bash
   git worktree remove --force <path>
   git branch -D <branch> 2>/dev/null || true  # branch may already be gone remotely
   ```
5. Log each action (one line per worktree):
   ```
   [pull-work] sweep: removed <path> (branch <branch>, <N>d old, clean)
   [pull-work] sweep: kept <path> — has uncommitted changes (non-codesight files dirty)
   [pull-work] sweep: kept <path> — <N>d old (< WORKTREE_STALE_DAYS threshold)
   [pull-work] sweep: pruned orphaned registry entry (directory gone)
   ```

**Fail-soft:** if `git worktree prune` or `git worktree list` errors, log a single warning and continue. Sweep failure must never block pickup.

---

### Step 0.5 — Rate-limit guard

If any Linear MCP call in this session returns a rate-limit error (HTTP 429 / MCP rate-limit response), pause 2 minutes, retry once, then if still limited log an impediment via `impediment-reporter` and exit cleanly without claiming. Do not retry in tight loops.

### Step 0.6 — Merge-gate health gate (THR-768)

**Do not claim new implementation work while the merge gate is vacuous.** This is a rule, not a judgment call each time — it has been re-litigated in four separate sessions and got it wrong at least once.

```bash
npm run check:actions --silent -- --json
```

- **`standDown: true`** (verdict `billing-block`) → **do not claim.** Post nothing to Linear (the outage is not a ticket's fault and a comment on an arbitrary issue is noise), log one line, and exit clean. `keep-work-flowing-cc` step 2.5b surfaces the `summary` to Christian within the hour; only he can clear it. A healthy queue loses nothing by waiting one hour — an unguarded `main` is not worth one hour of throughput.
- **any other verdict** (`healthy`, `recovered`, `transient`, `unknown`) → continue to Step 0.8.

**Why the gate can be vacuous while reading as enforced:** when Actions cannot start jobs, the required `Test · Typecheck · Build` check records as `skipped`, and **a skipped required check satisfies branch protection** (see the standing `reference_skipped_required_check_merges` finding). Reproduced end to end on PR #853 and again on PR #1022, which carried engine + content changes. The `Guard — change detection health` step in `ci.yml` now closes this at source for every cause *except* a full Actions outage — during which nothing runs at all, including the guard. This step covers that residue.

**Do not rely on `gh pr merge --auto` refusing to arm during an outage.** A 2026-07-25 note recorded that it returns *"Pull request is in unstable status"*, making armed auto-merge accidentally safer than a manual merge. On 2026-07-28 it armed without complaint and fired. That property is **not** dependable and must not be treated as mitigation.

**Fail-soft:** the probe degrades to `verdict: "unknown"` on any network/auth failure and never exits non-zero without `--strict`. An unreadable probe is not a reason to refuse work — `unknown` continues.

### Step 0.8 — Armed-PR reconciliation sweep (THR-702)

Auto-merge does **not** update a stale branch: under strict branch protection, an armed PR whose base moves sits at `mergeStateStatus: BEHIND` forever, green and silent (THR-702 found 9 such PRs, oldest 19 days). This sweep is the recurring surface that catches them.

**Constant:** `ARMED_SWEEP_MAX_UPDATES = 1` — update at most one PR per run. Updating several at once is a losing race: each merge re-stales the others and re-triggers their CI (O(N²) runs). The hourly cadence drains a queue one per cycle.

1. List armed-but-open PRs: `gh pr list --state open --json number,autoMergeRequest,mergeStateStatus,createdAt --jq '[.[] | select(.autoMergeRequest != null)]'`.
2. `mergeStateStatus` is computed lazily — a first read of `UNKNOWN` means "not computed yet", not "fine". Re-query that PR up to 3 times a few seconds apart before classifying.
3. For the **oldest** PR reading `BEHIND`: run `gh pr update-branch <N>` and stop (respect `ARMED_SWEEP_MAX_UPDATES`). CI re-runs on the updated branch and auto-merge fires on green — no polling.
4. A PR reading `DIRTY`/`CONFLICTING` is the closeout-docs union case — route to "Closeout — resolving a conflicted closeout-docs PR" below, or surface it if it isn't yours.
5. Log one line: `[pull-work] Step 0.8: <N> armed PRs, updated #<X> (BEHIND) / none BEHIND — continuing.`

**Fail-soft:** any `gh` error → log one warning and continue to Step 1. The sweep must never block pickup.

### Step 1 — Two state-filtered board scans

If no issue id was provided, fire **two** calls:

```
list_issues(team:"Threadbare", state:"In Dev",        limit:50,  includeArchived:false)
list_issues(team:"Threadbare", state:"Ready for Dev", assignee:null, limit:100, includeArchived:false)
```

The first response gives both In-Dev slices you need: filter to `assignee:"me"` for the WIP gate (Step 1.5), and read it across all assignees for the concurrent-session parallel check (Step 2). The second is the pickup-candidate list.

**Do not use a single unfiltered `limit:250` sweep.** That call returns roughly 390k characters and is rejected outright on response size, so the canonical path used to fail at step one and every run improvised its own scan (THR-686). State-filtering is what keeps the response inside budget — this now matches what `keep-work-flowing-cc` § 1 already does, so the two skills no longer contradict each other.

Sort the Ready-for-Dev candidates by priority **in memory** (impediment #49 — `orderBy:"priority"` is accepted by the schema but rejected at runtime; `orderBy` defaults to `updatedAt`, which is fine). Oldest `createdAt` is the tie-break. Pick the top.

If a specific issue id was provided, skip to Step 3.

### Step 1.5 — WIP=1 gate (Rule 6 enforcement) + resume routing

If the Step 1 board scan's "In Dev" slice filtered to `assignee:"me"` is empty, continue to Step 2.

If the slice has more than one entry, this is a Rule 6 violation (cross-session leak — Rule 6 says WIP=1 across all sessions). Output the surface message and exit 1 so the failure is visible in cron logs. Do not attempt to claim more.

```
[pull-work] Step 1.5: WIP=1 gate — multiple In Dev assigned to me ({issueIds}). Cross-session leak. Surface and stop.
```

If the slice has exactly one entry, route to Step 1.7 (resume-from-In-Dev upstream-shipped check) instead of exiting clean. The resumed issue may have shipped while the session was paused; the upstream-shipped check decides whether to resume work or stand down.

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `WIP_GATE_EXIT_CODE_SINGLE` | 0 | Single in-flight ticket routes to Step 1.7; exit clean only if shipped |
| `WIP_GATE_EXIT_CODE_MULTI` | 1 | Multiple in-flight is a leak; exit red |

**Fail-soft:** If the Linear API errors during the In Dev query, treat as gate-fired (refuse to pull when state is unknown). Log an impediment and exit 0.

### Step 1.7 — Resume-from-In-Dev — upstream-shipped check

When Step 1.5 detects exactly one In Dev issue assigned to the executor, run the upstream-shipped check on that issue before doing any other work (including reading comments or plan doc).

```bash
git fetch origin main
git log origin/main --grep="Fixes <resumed-issue-id>" --grep="Closes <resumed-issue-id>" --grep="Resolves <resumed-issue-id>" --regexp-ignore-case --extended-regexp --oneline
```

**If the result is empty:** the work is genuinely still in flight. Continue to Step 1.8 (checkpoint-resume), then Step 5 (Reopened safety check) — skip Steps 2–4 (concurrent-session parallel, coordination block, claim) because the claim already exists.

**If the result is non-empty:** the commit landed but the auto-close did not fire. Do not park the WIP=1 slot waiting on a review that never comes (THR-608: Christian doesn't read Linear, so the retired "human reviewer" never closes it).
1. Post a comment on the issue: `Upstream-shipped check during resume found commit {sha} "{first-line}". Auto-close did not fire.`
2. Unassign to free the WIP=1 slot: `save_issue(id, assignee: null)` — keep state In Dev, verify-after-write per impediment #48. Do NOT release to Ready for Dev, and do NOT call `save_issue(state: "Done")` — Rule 3 forbids CC closing. The hourly `keep-work-flowing` Cowork task triages unassigned In Dev issues: it verifies the SHA on origin/main and closes the issue as Done (Cowork owns state transitions; the merge-gated-Done rule binds CC, not Cowork cleanup of verified-shipped work).
3. Exit cleanly.

**Trace lines** (NFP #2):

```
[pull-work] Step 1.7: resume THR-247 — upstream-clean. Continuing to Step 1.8.
[pull-work] Step 1.7: resume THR-247 — upstream-shipped, commit a1b2c3d. Posting comment, unassigning, exit.
```

**Fail-soft:** if `git fetch origin main` errors (network down, auth issue, sandbox limitation), log a warning and proceed to Step 5 (resume in flight). The check is best-effort and must not strand a real in-flight issue when the network is unavailable.

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `UPSTREAM_GREP_KEYWORDS` | `Fixes\|Closes\|Resolves` | Auto-close keywords accepted by Linear |
| `RESUME_UPSTREAM_FAIL_SOFT` | `true` | If `git fetch` fails, proceed to Step 1.8 rather than refusing resume |

### Step 1.8 — Checkpoint-resume — read prior-run checkpoints before re-reading the plan doc

Reached only on the Step 1.7 upstream-clean path (work still in flight). Before re-reading the plan doc or writing any code, read the latest comments (`list_comments(id, orderBy:"createdAt", limit:5)`) for a **checkpoint comment** left by a prior unfinished run. The `tb-opus-pickup` prompt requires an unfinished pass to post one: what's done, what remains, branch/worktree name, next step.

> **Never quote the close keyword in a checkpoint comment (THR-738).** A checkpoint is explicitly *not* a handoff and must not close the issue — yet a comment saying "`Fixes THR-XX` still rides the final PR" once did exactly that (the merge that later carried the comment's prose swept the issue to Done). Since the workflow is now line-anchored, an in-prose keyword is inert on its own; but the safe habit is unconditional: reference the in-flight issue as a bare `THR-XX` token, with no `Fixes/Closes/Resolves` in front of it, in any checkpoint or non-closing comment.

- **If a checkpoint exists:** continue from it — do not re-implement from scratch. Resume on the named branch/worktree and pick up at the recorded next step, then proceed to Step 5.
- **If `MAX_CHECKPOINTS_BEFORE_SPLIT` (3) or more checkpoint comments exist without a ship:** the issue is churning and needs re-scoping. Post a recommend-split comment, unassign (`save_issue(id, assignee: null)` — keep state In Dev, verify-after-write per impediment #48), and exit clean. Cowork re-scopes.
- **If no checkpoint exists:** fall through to Step 5 and re-read the plan doc as normal.

**Constant:**

| Constant | Default | Purpose |
|---|---|---|
| `MAX_CHECKPOINTS_BEFORE_SPLIT` | 3 | Checkpoint comments without a ship that trigger the recommend-split escalation |

**Trace lines** (NFP #2 — exactly one fires):

```
[pull-work] Step 1.8: checkpoint found (branch pickup/thr-247, next: wire phase). Resuming from checkpoint.
[pull-work] Step 1.8: no checkpoint — falling through to Step 5 plan-doc re-read.
[pull-work] Step 1.8: 3 checkpoints without ship — recommend-split, unassign, exit.
```

**Fail-soft:** if `list_comments` errors, log a warning and fall through to Step 5 (re-read the plan doc). A comment-read failure must not strand a genuinely in-flight issue.

### Step 2 - Concurrent-session parallel check

Only relevant when another CC session (an interactive session, or a second worktree) already holds an In Dev issue and you are considering running this one alongside it.

1. From the Step 1 board scan's "In Dev" slice, detect any other active CC work.
2. If another issue is active, verify the candidate appears in that issue's `Parallel-safe with` line.
3. Confirm the candidate does not collide with that issue's `Mutex with` line.

If collision or uncertainty remains, run serially instead of claiming concurrently. (The hourly automation is WIP=1 per Step 1.5; this check matters only for hand-driven multi-worktree work.)

### Step 3 - Validate coordination block on latest comment

1. Read the latest comment on the candidate issue.
2. Confirm it includes all required lines: `Suggested model`, `Parallel-safe with`, `Mutex with`.
3. If missing, add a bounce note for Cowork and stop without claiming.

**Mutex reversal (THR-688 Rule B).** A `Mutex with` line should carry its reason — `Mutex with: THR-XXX (both edit <file>)`. You **may** claim past a mutex when the stated reason is *verifiably* inapplicable: the named partner issue has since merged, or the named surface is provably outside this ticket's scope. Verify it (`get_issue` on the partner; confirm `Done` + a merged PR), then record the reversal and its evidence in a Linear comment on the issue you claim. A mutex whose reason is a bare identifier with no stated surface cannot be cleared by inspection — bounce it for re-authoring rather than guessing (THR-673 precedent).

**Done-when reachability (THR-688 Rule C).** Before starting work, check that the ticket's Done-when is satisfiable through the pillar it touches. Browser evidence is required for UI-pillar surfaces only; engine/content acceptance runs through `npm run cli` / `__DEBUG` sweeps. If a Done-when demands N ticks in an automated browser tab, it is unreachable by construction (`document.hidden` throttles the rAF loop to 1 tick/click) until THR-689 lands — substitute a headless CLI sweep and say so in the completion comment.

### Step 4 - Claim before deep read, then verify

> **Preferred:** use `pullNextReadyForDev` (§ above) — it bundles Steps 1–4 with retry-on-silent-drop. This step-by-step is the documented fallback.

1. First mutating call: `save_issue(id, assignee:"me", state:"In Dev")`.
2. Immediately call `get_issue(id)` and verify both `assignee` and `state` stuck.
3. On mismatch: release claim (`save_issue(id, assignee:null)`), move to the next candidate, retry up to `MAX_CLAIM_RETRIES = 3` total attempts.
4. On all retries exhausted: refuse to proceed, surface the write failure, log impediment.

Rationale: impediment #48 documents silent state-write drops; verify-after-write is mandatory.

### Step 4.4 — Upstream-shipped check (Rule 9)

After the claim is verified (Step 4) and before worktree isolation (Step 4.5), run:

```bash
git fetch origin main
git log origin/main --grep="Fixes <issue-id>" --grep="Closes <issue-id>" --grep="Resolves <issue-id>" --regexp-ignore-case --extended-regexp --oneline
```

If the result is non-empty, the work has already landed. Do not proceed.

1. Release the claim: `save_issue(id, assignee: null, state: "Ready for Dev")`.
2. Post a one-line comment on the issue noting the upstream commit hash + first-line message and that the auto-close did not fire.
3. Exit cleanly.

**Trace lines** (NFP #2):

```
[pull-work] Step 4.4: upstream-clean. Continuing to worktree isolation.
[pull-work] Step 4.4: upstream-shipped — commit a1b2c3d "feat(thr-247): ..." on origin/main. Releasing claim, exit.
```

**Fail-soft:** if `git fetch origin main` errors (network down, auth issue, sandbox limitation), log the error and proceed to Step 4.5 anyway. The upstream-shipped check is best-effort — a fetch failure must not block pickup of genuinely open work. Surface a one-line warning in the session log.

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `FRESH_CLAIM_UPSTREAM_FAIL_SOFT` | `true` | If `git fetch` fails, proceed to Step 4.5 rather than blocking pickup |

### Step 4.5 — Worktree isolation when home is dirty

After the claim is verified (Step 4) and before any plan-doc read or implementation, gate
on `git status --porcelain` of the home worktree. If non-empty, isolate the rest of the
session in a fresh worktree rooted at `origin/main`. If empty, continue in place.

**Constants:** `WORKTREE_DIR_PREFIX="../tfws-pickup-"`, `WORKTREE_BRANCH_PREFIX="pickup/"`,
`WORKTREE_BASE="origin/main"`, `MAX_WORKTREE_RETRIES=1`.

```bash
cd "$REPO_ROOT"
if [ -n "$(git status --porcelain)" ]; then
  ISSUE_ID_LC=$(echo "$ISSUE_ID" | tr '[:upper:]' '[:lower:]')
  WORKTREE_DIR="${WORKTREE_DIR_PREFIX}${ISSUE_ID_LC}"
  WORKTREE_BRANCH="${WORKTREE_BRANCH_PREFIX}${ISSUE_ID_LC}"
  git fetch origin main
  if ! git worktree add -b "$WORKTREE_BRANCH" "$WORKTREE_DIR" "$WORKTREE_BASE" 2>/dev/null; then
    WORKTREE_DIR="${WORKTREE_DIR}-2"
    WORKTREE_BRANCH="${WORKTREE_BRANCH}-2"
    if ! git worktree add -b "$WORKTREE_BRANCH" "$WORKTREE_DIR" "$WORKTREE_BASE"; then
      echo "[pull-work] Step 4.5: worktree add failed twice. Releasing claim."
      # release claim via Linear MCP (save_issue id assignee:null) and exit
      exit 1
    fi
  fi
  cd "$WORKTREE_DIR"
  npm install
  echo "[pull-work] Step 4.5: home dirty. Isolated to $WORKTREE_DIR on origin/main."
else
  echo "[pull-work] Step 4.5: home clean. Continuing in-place."
fi
```

All subsequent steps run from `$WORKTREE_DIR` if isolation engaged, else from
`$REPO_ROOT`. The closing commit, push, and merge-keyword auto-close all happen
in the same location.

**Write-path discipline (mandatory whenever the session is in a worktree).** Echo the
session root once, and treat it as the required prefix for every `Edit`/`Write`
`file_path` for the rest of the session:

```bash
echo "[pull-work] Step 4.5: session write-root is $(git rev-parse --show-toplevel)"
```

A bare repo-root absolute path (`C:\...\TheFantasyWorldSimulator\src\...`) from a
worktree session lands in the **home** tree and **succeeds** — the two trees are
byte-identical at branch time, so `old_string` matches, the tool reports success,
and nothing surfaces until verification runs against unedited code. This fired in
4 of 12 hourly runs on 2026-07-20/21 (impediments #387, #417, #421). `Read` is
unaffected and may use either path.

The `worktree-write-guard.sh` PreToolUse hook (registered in `.claude/settings.json`)
now rejects this mechanically and prints the corrected path, so a slip costs one
blocked call rather than a wasted verification cycle. The hook gates on **CWD**, not
on the target alone — home-tree sessions are never blocked. Treat it as a backstop,
not a licence to stop prefixing paths: it only covers `Edit`/`Write`, so `Bash`
redirects and `cp` into the home tree remain your responsibility.

**Trace lines** (one of three appears per session, NFP #2):

```
[pull-work] Step 4.5: home clean. Continuing in-place.
[pull-work] Step 4.5: home dirty. Isolated to ../tfws-pickup-thr-XXX on origin/main.
[pull-work] Step 4.5: worktree add failed twice. Releasing claim.
```

**Failure recovery.** On `git worktree add` failure, retry once with a `-2` suffix on
both the path and branch name (handles a stale worktree from a prior aborted run).
On second failure, release the claim with `save_issue(id, assignee:null)` and exit
cleanly. Surfaced as a worktree-creation failure rather than a dirty-state failure.

### Step 4.6 — Stranded-commit zombie sweep

After worktree isolation (Step 4.5) and before any plan-doc read or implementation, detect local-only commits sitting ahead of `origin/main` whose content is already on `origin/main` under a different SHA ("zombie commits"). These arise when a closeout PR merges under a squash/rebase SHA, leaving the original local branch commit alive in a reused pool worktree. Step 4.5's `git status --porcelain` predicate does **not** see committed-but-unmerged state — this sweep fills that gap.

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `ZOMBIE_DETECTION_BASE` | `origin/main` | Branch to compare stranded commits against |
| `ZOMBIE_MAX_AGE_DAYS` | 14 | Bounds the `git log --since` window for Condition A; older zombies still classify via Condition B |
| `MAX_STRANDED_COMMITS_TO_INSPECT` | 20 | Safety cap; >20 stranded commits triggers fail-fast instead of inspect |
| `ZOMBIE_EXIT_CODE_FAIL_FAST` | 1 | Exit code when real WIP is detected |
| `ZOMBIE_EXIT_CODE_NO_OP` | 0 | Exit code when sweep no-ops or auto-resets |

**Algorithm:**

```bash
# Step 4.6 — Stranded-commit zombie sweep
git fetch origin main --quiet || {
  echo "[pull-work] Step 4.6: git fetch failed. Skipping sweep (fail-soft)."
  return 0  # log impediment via impediment-reporter, continue
}

STRANDED=$(git rev-list "origin/main..HEAD" 2>/dev/null || true)
if [ -z "$STRANDED" ]; then
  echo "[pull-work] Step 4.6: no stranded commits — continuing."
  return 0
fi

STRANDED_COUNT=$(echo "$STRANDED" | wc -l)
if [ "$STRANDED_COUNT" -gt 20 ]; then  # MAX_STRANDED_COMMITS_TO_INSPECT
  echo "[pull-work] Step 4.6: $STRANDED_COUNT stranded commits exceeds cap. Fail-fast."
  # release_linear_claim; exit 1
fi

ZOMBIES=0; NON_ZOMBIES=0; ZOMBIE_SHAS=(); NON_ZOMBIE_SHAS=()

for sha in $STRANDED; do
  if is_zombie "$sha"; then
    ZOMBIE_SHAS+=("$sha"); ZOMBIES=$((ZOMBIES+1))
  else
    NON_ZOMBIE_SHAS+=("$sha"); NON_ZOMBIES=$((NON_ZOMBIES+1))
  fi
done

if [ "$NON_ZOMBIES" -gt 0 ]; then
  echo "[pull-work] Step 4.6: $ZOMBIES zombies + $NON_ZOMBIES real WIP commits."
  echo "  Real WIP SHAs: ${NON_ZOMBIE_SHAS[*]}"
  echo "  Fail-fast — releasing claim and exiting. Run 'git log origin/main..HEAD' to inspect."
  # release_linear_claim; exit 1
fi

# All stranded commits are zombies — safe to reset
echo "[pull-work] Step 4.6: all $ZOMBIES stranded commits are zombies. Resetting to origin/main."
echo "  Zombie SHAs: ${ZOMBIE_SHAS[*]}"
git reset --hard origin/main
```

**`is_zombie <sha>` — classification heuristic.** Returns true if **either** condition holds:

**Condition A — Fixes-keyword match on main.** Extract the first `(Fixes|Closes|Resolves) THR-\d+` token from the stranded commit's full message body (`git log --format="%B" -1 <sha>`). If found, search `git log origin/main --grep="<token>" --since="14 days ago" --oneline | head -1`. A match means the issue is already closed on `main` → zombie.

**Condition B — Content match against main tip.** For each path in `git show --name-only --format= <sha>`, run `git diff --quiet <sha> origin/main -- <file>` for each changed file. If every changed file matches `origin/main`, the commit's payload is already there → zombie.

Either condition is sufficient to classify a commit as zombie. Both conditions must answer "no" for the commit to be treated as real WIP.

**Fail-soft table:**

| Failure mode | Behavior |
|---|---|
| `git fetch origin main` fails (network, auth) | Skip sweep; log impediment; continue |
| `git rev-list` returns non-zero | Skip sweep; log warning; continue |
| `is_zombie` errors on a single SHA | Treat as non-zombie (fail-safe: surface for human review) |
| Stranded count > `MAX_STRANDED_COMMITS_TO_INSPECT` | Fail-fast; release claim; exit 1 |
| Sweep would reset away an uncommitted working-tree edit | Cannot happen — Step 4.5 already isolated dirty trees |

**Trace lines** (NFP #2 — exactly one fires per session):

```
[pull-work] Step 4.6: no stranded commits — continuing.
[pull-work] Step 4.6: all <N> stranded commits are zombies. Resetting to origin/main.
  Zombie SHAs: <sha1> <sha2> ...
[pull-work] Step 4.6: <Z> zombies + <W> real WIP commits.
  Real WIP SHAs: <sha1> ...
  Fail-fast — releasing claim and exiting.
[pull-work] Step 4.6: <N> stranded commits exceeds cap. Fail-fast.
[pull-work] Step 4.6: git fetch failed. Skipping sweep (fail-soft).
```

**Interaction with adjacent steps.** Step 4.4 verifies the *currently-claimed* issue isn't already shipped on `main`. Step 4.6 handles *prior* issues' zombie commits surviving in a reused pool worktree — an orthogonal concern. Order: Step 4.4 → Step 4.5 → **Step 4.6** → Step 5. The sweep runs even in a fresh isolation worktree (cheap no-op there; the real work happens in the in-place case when Step 4.5 continued in-place because the home tree was working-tree-clean).

---

### Step 5 - Reopened safety check

If the issue has label `Reopened`, read all comments back to the original handoff before making implementation decisions.

### Step 6 - Load plan doc

1. Extract plan-doc path from the latest handoff comment.
2. If absent, search `Docs/plans/` for a likely match by issue/topic.
3. Read the plan doc before touching code.

### Step 7 - Surface model suggestion (advisory)

1. Read the `model:*` label and `Suggested model:` line from the handoff block.
2. They are advisory only — the scheduled CC automation always runs Opus, and the label does not gate pickup. Treat the suggestion as a signal of the work type Cowork sized the issue for.
3. An interactive session started by the user may run any model — the user's judgment supersedes the suggestion.

## Refuses To Proceed When

- The "In Dev" slice for the executor's own assignee (computed in Step 1) is non-empty (Rule 6: WIP=1 across all sessions).
- The latest handoff comment is missing any required coordination line (`Suggested model`, `Parallel-safe with`, `Mutex with`).
- `save_issue` claim cannot be verified by `get_issue` after one retry.
- The upstream-shipped check (Step 4.4 fresh-claim or Step 1.7 resume) finds a `Fixes <issue-id>` / `Closes <issue-id>` / `Resolves <issue-id>` commit on `origin/main`. Pickup exits with a comment noting the upstream commit hash. Step 4.4 releases the fresh claim back to Ready for Dev; Step 1.7 unassigns but keeps the issue In Dev so the hourly `keep-work-flowing` Cowork triage verifies the SHA and closes it as Done.

## Output Contract

On success: issue is claimed (`In Dev`, assigned to `me`), plan doc loaded, and pickup context is ready for implementation.

On refusal: leave the issue unclaimed when possible, post a concise bounce note, and stop.

## Closeout — home-tree cleanliness gate (run before `git commit`)

**Mandatory whenever the session is in a worktree.** Before the closing commit, prove
the session left no writes in the home tree:

```bash
HOME_TREE="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
if [ "$HOME_TREE" != "$(git rev-parse --show-toplevel)" ]; then
  git -C "$HOME_TREE" status --porcelain
fi
```

Expected output is **empty**, or only pre-existing debris you can name and did not
author this session. Any session-authored path is the two-tree edit-path trap: the
edit landed on `main` in a tree that is supposed to be an inert mirror (THR-672), and
your verification ran against unedited code.

**Recovery — patch-and-relocate** (full form in `Docs/impediments.md` #417/#387):

```bash
git -C "$HOME_TREE" diff -- <files> > /tmp/relocate.patch
git -C "$HOME_TREE" checkout -- <files>      # restore main
git apply /tmp/relocate.patch                # replay into the worktree
```

Copy any *new* files across and `rm` them from the home tree — `checkout --` does not
remove untracked additions. Then **re-run the verification gates**, because the
previous run tested the wrong tree.

**Trace line** (exactly one, NFP #2):

```
[pull-work] closeout: home tree clean — no session-authored paths.
[pull-work] closeout: home tree dirty (<N> session-authored paths). Patch-and-relocate before commit.
[pull-work] closeout: session is in the home tree — check N/A.
```

**Fail-soft:** if the `git -C` probe errors, log one warning and continue to the commit.
A broken probe must not block a ship — the PreToolUse guard is the primary defence and
this gate is the audit.

## Closeout — ship with auto-merge, don't poll CI

**Standard closeout is `gh pr merge --auto --merge`.** GitHub holds the merge until the required `Test · Typecheck · Build` check goes green, then merges without a session present. Do not sit in a poll loop waiting on CI — that burned 3–8 minutes of session wall-clock per ship for no added safety (THR-675).

```bash
gh pr create --title "<type>(thr-XXX): <summary>" --body "$(printf 'Summary line.\n\nFixes THR-XXX\n')"
gh pr merge --auto --merge
```

The gate is unchanged: branch protection stays on, the required check still has to pass, and a red check simply means the PR never merges. Auto-merge removes the *waiting*, not the *gate* — this is the H6 verdict from `Docs/plans/2026-07-20-git-cicd-clean-delivery.md`, which kept the PR gate precisely because it caught a phantom 3,379-line reversal before it reached `main`.

`Fixes THR-XXX` must still appear in **both** the commit body and the PR body — on a non-squash merge the merge commit drops the commit body and Linear's auto-close misses it (impediment #140). `--merge` (not `--squash`) keeps the feature commit's body in history.

**The keyword must stand ALONE on its own line (THR-738).** `linear-autoclose.yml` is line-anchored: it closes only when a full line reads exactly `Fixes|Closes|Resolves THR-XXX`. The keyword inside a prose sentence (`Fixes THR-74 still rides the final PR`), a markdown bullet, or the PR *title* does **not** close. **Corollary for checkpoint and any non-closing comment:** never write `Fixes/Closes/Resolves` in front of an issue id you are *not* closing — reference it as a bare `THR-XXX` token. The phantom-Done recurrences (THR-74 ×2 on 2026-07-24) were prose that quoted the keyword to *document* the discipline. Vectors 2/3 (branch name, bare title token) come from Linear's native integration and are killed by the Christian-owned settings change in `Design/user-actions.md`, not by this workflow.

**After arming, run one freshness check — `gh pr view <N> --json mergeStateStatus`.** Branch freshness at session start does not imply freshness at arm time: THR-696's PR went `BEHIND` seconds after opening because main had moved during the session. If it reads `BEHIND`, run `gh pr update-branch <N>` once and re-arm if needed; if `UNKNOWN`, re-query 2–3 times a few seconds apart (GitHub computes mergeability lazily — the first read only schedules it). This is one query, not a poll loop; a PR missed here is caught by the Step 0.8 sweep next hour.

**Read the check rollup once after arming, and never accept `SKIPPED` on the required check (THR-768).** This is the single step that sits between finished work and an unguarded `main`, and it is one `gh` call:

```bash
gh pr view <N> --json statusCheckRollup --jq '[.statusCheckRollup[] | select(.name == "Test · Typecheck · Build")] | .[0].conclusion'
```

`SUCCESS` is the only acceptable answer. `SKIPPED` means the required check never inspected the change — during an Actions outage that is *exactly* what a vacuous gate looks like, and it satisfies branch protection anyway. On `SKIPPED`, do not merge: leave the PR open, post a checkpoint comment, and exit clean; the next hourly run resumes it once the gate is real again. (A genuinely docs-only PR also reports `SKIPPED` by design — that case is legitimate, so confirm the diff really is docs-only before treating a skip as benign.)

**After queuing auto-merge, the session's shipping work is done.** Proceed to the worktree cleanup below and exit; do not block on the merge landing. If the check later fails, the PR stays open and the issue stays In Dev — the next hourly run resumes it via the Step 1.7 upstream-shipped check, which will find no `Fixes` commit on `main` and correctly treat the work as still in flight.

## Closeout — resolving a conflicted closeout-docs PR

Every ship appends rows to the same table heads (`Docs/changelog.md`, `Docs/project-history.md`, `Docs/impediments.md`), so a PR that idles — human-gated ones idle **by design** — reliably goes `CONFLICTING` in those files alone, with zero code conflicts. THR-668's PR sat ~31 h and rotted this way; a whole run was burned hand-resolving table rows.

`.gitattributes` marks those three files `merge=union`, which makes **local** merges of that shape resolve automatically, keeping both rows.

**GitHub does not honor it.** Measured 2026-07-21 (THR-691) with the attribute present on the base branch: the merges API returned `409 Merge conflict`, and a PR of the same shape read `mergeable: CONFLICTING` / `mergeStateStatus: DIRTY`. Union is a built-in driver, but GitHub's server-side merge does not consult `.gitattributes`. So the web "Resolve conflicts" button and auto-merge stay unable to settle these — **resolve locally and push**:

```bash
git fetch origin main
git merge origin/main        # union auto-resolves the three closeout docs
git push
```

The merge prints `Auto-merging Docs/changelog.md` and exits 0 with both sides' rows present and the table header intact. Auto-merge then proceeds normally once the PR is no longer conflicting.

**Check the result before pushing** — union keeps *both* sides of every conflicting hunk, which is right for appended rows and wrong for an edited one. If the same row was modified on both branches you get it twice, so skim `git diff origin/main -- Docs/` for duplicates rather than trusting the clean exit.

`Docs/project-status.md` is deliberately **excluded** from union: it has a 60-line cap and rewrite semantics, so union would duplicate rewritten lines instead of merging them. Conflicts there are still resolved by hand.

## Closeout — remove the temporary worktree

**Attempt cleanup immediately after push** — do not wait for the merge-to-main auto-close, because that fires on GitHub after the CC session ends and no session will be active to run the cleanup. Run cleanup from the home worktree (`$REPO_ROOT`) right after `git push` succeeds.

**⚠️ JUNCTION GUARD (mandatory, before any `git worktree remove`):** if the worktree's `node_modules` is a junction/reparse point to the home install (the standard fresh-worktree pattern), remove the reparse point FIRST. `git worktree remove --force` follows the junction and **empties the home tree's real `node_modules`** — this wiped the entire home install twice on 2026-07-22 (once manually, once via this very closeout step running in the hourly lane). `cmd /c rmdir` removes only the reparse point, never the target's contents:

```bash
cd "$REPO_ROOT"
cmd /c rmdir "$(cygpath -w "$WORKTREE_DIR/node_modules")" 2>/dev/null || true  # junction only; harmless if real dir or absent... see guard note
git worktree remove --force "$WORKTREE_DIR" 2>/dev/null || true
git branch -D "$WORKTREE_BRANCH" 2>/dev/null || true
```

(`rmdir` on a *real non-empty* directory fails without deleting anything, so the guard is safe to run unconditionally. Verify afterwards: `ls "$REPO_ROOT/node_modules/vitest" >/dev/null` — if that fails, STOP and run `npm install` in the home tree before anything else.)

Both commands are non-fatal: if the worktree directory is still in use (e.g., we can't remove the directory we're running from), the error is swallowed and Step 0 of the next session will collect it via `git worktree prune` or the age-based sweep.

**Why immediate cleanup matters:** the old "after merge-to-main fires" timing was never reliable. The CC session ends before the PR merges; the auto-close fires on GitHub with no session alive to run cleanup. Step 0 of the next pickup is the backstop — but immediate post-push cleanup reduces the graveyard before it accumulates.
