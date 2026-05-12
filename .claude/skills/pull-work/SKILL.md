---
name: pull-work
description: Canonical Claude Code pickup workflow for claiming Linear work safely from Ready for Dev.
last_validated_against: 2026-05-12
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

1. **Board scan** — consume the Step 1 board-scan (already built): one `list_issues(team:"Threadbare", limit:250, orderBy:"updatedAt", includeArchived:false)` call, bucket in memory by `status`. Sort Ready-for-Dev candidates by priority (1=Urgent first), then oldest `createdAt` as tie-break. Pick the top unassigned candidate.
1.5. **WIP gate** — if the "In Dev" slice filtered to `assignee:"me"` is empty, continue to step 2. If exactly one entry, route to Step 1.7 (resume-from-In-Dev upstream-shipped check) instead of exiting clean. If more than one entry, this is a Rule 6 violation — output the cross-session-leak trace line and exit 1.
2. **Claim** — `save_issue(id, assignee:"me", state:"In Dev")`.
3. **Verify** — `get_issue(id)`. Confirm both `assignee` and `state` match.
   - On mismatch (silent drop, impediment #48): release claim with `save_issue(id, assignee:null)`. Output trace line (see below). Move to the next candidate. Retry up to `MAX_CLAIM_RETRIES` total attempts.
   - On all retries exhausted: output final trace line and exit the wrapper — fall back to the hand-rolled Step 1–4 path below.
3.5. **Upstream-shipped check (Rule 11: don't re-do shipped work)** — run:

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

**Scope:** only worktrees whose path matches `../tfws-pickup-` or `../tfws-resume-` (created by Step 4.5). Never touch `.claude/worktrees/*` entries — those are CC-managed.

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

### Step 1 — Single board scan

If no issue id was provided, fire one call: `list_issues(team:"Threadbare", limit:250, orderBy:"updatedAt", includeArchived:false)`. In memory, bucket the response by `status` to produce:
- The "In Dev" slice filtered to `assignee:"me"` — for WIP check
- The "Ready for Dev" slice filtered to `assignee:null` — for pickup candidates
- The "In Dev" slice across all assignees — for cross-executor parallel check (Step 2)

Sort the Ready-for-Dev candidates by priority in memory (impediment #49 rejects `orderBy:priority` at runtime); oldest `createdAt` is tie-break. Pick the top.

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

**If the result is empty:** the work is genuinely still in flight. Continue from Step 5 (Reopened safety check) — skip Steps 2–4 (cross-executor parallel, coordination block, claim) because the claim already exists.

**If the result is non-empty:** the commit landed but the auto-close did not fire.
1. Post a comment on the issue: `Upstream-shipped check during resume found commit {sha} "{first-line}". Auto-close did not fire — please verify the merge keyword in the commit body and close manually if appropriate.`
2. Do NOT release the claim (leaving the issue In Dev preserves the audit trail; the human reviewer can close it manually after verifying the commit). Do NOT call `save_issue(state: "Done")` — Rule 3 forbids it.
3. Exit cleanly.

**Trace lines** (NFP #2):

```
[pull-work] Step 1.7: resume THR-247 — upstream-clean. Continuing to Step 5.
[pull-work] Step 1.7: resume THR-247 — upstream-shipped, commit a1b2c3d. Posting comment, exit.
```

**Fail-soft:** if `git fetch origin main` errors (network down, auth issue, sandbox limitation), log a warning and proceed to Step 5 (resume in flight). The check is best-effort and must not strand a real in-flight issue when the network is unavailable.

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `UPSTREAM_GREP_KEYWORDS` | `Fixes\|Closes\|Resolves` | Auto-close keywords accepted by Linear |
| `RESUME_UPSTREAM_FAIL_SOFT` | `true` | If `git fetch` fails, proceed to Step 5 rather than refusing resume |

### Step 2 - Cross-executor parallel check

1. From the Step 1 board scan's "In Dev" slice (all assignees), detect active Codex work.
2. If a Codex issue is active, verify the candidate appears in that issue's `Parallel-safe with` line.
3. Confirm the candidate does not collide with that issue's `Mutex with` line.

If collision or uncertainty remains, refuse and ask for rerouting instead of claiming.

### Step 3 - Validate coordination block on latest comment

1. Read the latest comment on the candidate issue.
2. Confirm it includes all required lines: `Suggested model`, `Parallel-safe with`, `Mutex with`.
3. If missing, add a bounce note for Cowork and stop without claiming.

### Step 4 - Claim before deep read, then verify

> **Preferred:** use `pullNextReadyForDev` (§ above) — it bundles Steps 1–4 with retry-on-silent-drop. This step-by-step is the documented fallback.

1. First mutating call: `save_issue(id, assignee:"me", state:"In Dev")`.
2. Immediately call `get_issue(id)` and verify both `assignee` and `state` stuck.
3. On mismatch: release claim (`save_issue(id, assignee:null)`), move to the next candidate, retry up to `MAX_CLAIM_RETRIES = 3` total attempts.
4. On all retries exhausted: refuse to proceed, surface the write failure, log impediment.

Rationale: impediment #48 documents silent state-write drops; verify-after-write is mandatory.

### Step 4.4 — Upstream-shipped check (Rule 11)

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

### Step 7 - Surface model suggestion

1. Read `model:*` labels and `Suggested model:` from the handoff block.
2. Use that model unless there is a concrete reason to override.
3. If overriding, note the rationale in the session.

## Refuses To Proceed When

- The "In Dev" slice for the executor's own assignee (computed in Step 1) is non-empty (Rule 6: WIP=1 across all sessions).
- The latest handoff comment is missing any required coordination line (`Suggested model`, `Parallel-safe with`, `Mutex with`).
- Cross-executor mutex analysis indicates file-surface collision with active Codex work.
- `save_issue` claim cannot be verified by `get_issue` after one retry.
- The upstream-shipped check (Step 4.4 fresh-claim or Step 1.7 resume) finds a `Fixes <issue-id>` / `Closes <issue-id>` / `Resolves <issue-id>` commit on `origin/main`. Pickup exits with a comment noting the upstream commit hash; the human reviewer closes the issue manually if appropriate.

## Output Contract

On success: issue is claimed (`In Dev`, assigned to `me`), plan doc loaded, and pickup context is ready for implementation.

On refusal: leave the issue unclaimed when possible, post a concise bounce note, and stop.

## Closeout — remove the temporary worktree

**Attempt cleanup immediately after push** — do not wait for the merge-to-main auto-close, because that fires on GitHub after the CC session ends and no session will be active to run the cleanup. Run cleanup from the home worktree (`$REPO_ROOT`) right after `git push` succeeds:

```bash
cd "$REPO_ROOT"
git worktree remove --force "$WORKTREE_DIR" 2>/dev/null || true
git branch -D "$WORKTREE_BRANCH" 2>/dev/null || true
```

Both commands are non-fatal: if the worktree directory is still in use (e.g., we can't remove the directory we're running from), the error is swallowed and Step 0 of the next session will collect it via `git worktree prune` or the age-based sweep.

**Why immediate cleanup matters:** the old "after merge-to-main fires" timing was never reliable. The CC session ends before the PR merges; the auto-close fires on GitHub with no session alive to run cleanup. Step 0 of the next pickup is the backstop — but immediate post-push cleanup reduces the graveyard before it accumulates.
