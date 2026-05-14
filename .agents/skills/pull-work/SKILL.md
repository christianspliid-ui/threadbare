---
name: pull-work
description: Canonical Claude Code pickup workflow for claiming Linear work safely from Ready for Dev.
last_validated_against: 2026-05-14
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

**Canonical path for Rules 1, 4, and 7.** Execute this 6-step sequence as a single atomic unit instead of hand-rolling claim + verify + comment-read separately. Steps 1–4 below are the documented fallback for agents that bypass the wrapper. After verified claim, runs Step 4.5 worktree-isolation if home is dirty.

**Constant:** `MAX_CLAIM_RETRIES = 3`

**Large-result guard:** If any Linear call produces a result too large for context (saved to a file with a "use a subagent" suggestion in the output), read it yourself with Bash python slicing — never spawn Agent to parse it. Pickup delegation is prohibited regardless of result size. Using three targeted queries below makes overflow unlikely, but this guard applies unconditionally.

1. **Board scan** — three targeted queries (never a single 250-issue dump — that overflows context and the resulting "use a subagent" tool message defeats the DO NOT DELEGATE rule):
   - `list_issues(team:"Threadbare", state:"In Dev", assignee:"me", limit:10)` → WIP slice
   - `list_issues(team:"Threadbare", state:"In Dev", limit:50)` → cross-executor slice
   - `list_issues(team:"Threadbare", state:"Ready for Dev", assignee:null, limit:50)` → candidate slice

   Sort the candidate slice by priority in memory (1=Urgent first), oldest `createdAt` as tie-break. Pick the top unassigned candidate.
1.5. **WIP gate** — if the WIP slice (query 1) is non-empty, exit cleanly per Step 1.5 (Rule 6: WIP=1). Do not claim.
2. **Claim** — `save_issue(id, assignee:"me", state:"In Dev")`.
3. **Verify** — `get_issue(id)`. Confirm both `assignee` and `state` match.
   - On mismatch (silent drop, impediment #48): release claim with `save_issue(id, assignee:null)`. Output trace line (see below). Move to the next candidate. Retry up to `MAX_CLAIM_RETRIES` total attempts.
   - On all retries exhausted: output final trace line and exit the wrapper — fall back to the hand-rolled Step 1–4 path below.
4. **Fetch latest comment** — `list_comments(id, orderBy:"createdAt", limit:5)`. Extract the most recent entry.
5. **Return bundle** — `{ issueId, state, assignee, latestComment }`. Continue from Step 5 (Reopened check) using this data.

**Trace output format** (documents retry behavior for inspectability — NFP #2):

Happy path:
```
[pullNextReadyForDev] Attempt 1/3: claiming THR-247... OK
[pullNextReadyForDev] Verify: assignee=Christian Spliid, state=In Dev ✓ — claim confirmed
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

### Step 0 — Rate-limit guard

If any Linear MCP call in this session returns a rate-limit error (HTTP 429 / MCP rate-limit response), pause 2 minutes, retry once, then if still limited log an impediment via `impediment-reporter` and exit cleanly without claiming. Do not retry in tight loops.

### Step 1 — Three targeted queries

**Never use a single 250-issue dump** — it produces ~290k chars, overflows the context window, and causes the tool output to suggest using a subagent, which violates the DO NOT DELEGATE rule.

If no issue id was provided, fire three small targeted calls:
1. `list_issues(team:"Threadbare", state:"In Dev", assignee:"me", limit:10)` → WIP check slice
2. `list_issues(team:"Threadbare", state:"In Dev", limit:50)` → cross-executor slice (all assignees)
3. `list_issues(team:"Threadbare", state:"Ready for Dev", assignee:null, limit:50)` → candidate slice

Sort the candidate slice by priority in memory (impediment #49 rejects `orderBy:priority` at runtime); oldest `createdAt` is tie-break. Pick the top.

If a specific issue id was provided, skip to Step 3.

### Step 1.5 — WIP=1 gate (Rule 6 enforcement)

If the WIP check query result (Step 1.1, `assignee:"me"`) is non-empty, refuse pickup and exit cleanly. Output one of:

```
[pull-work] Step 1.5: WIP=1 gate — already holding {issueId} (claimed at {claimedAt}, branch {gitBranchName}). Skipping pickup.

[pull-work] Step 1.5: WIP=1 gate — multiple In Dev assigned to me ({issueIds}). Cross-session leak. Surface and stop.
```

If the slice has exactly one entry: this is a normal in-flight ticket; either CI is still running or the merge auto-close hasn't fired yet. Exit 0 — the next cron tick will check again.

If the slice has more than one entry: this indicates a Rule 6 violation (cross-session leak — Rule 6 says WIP=1 across all sessions). Output the surface message and exit 1 so the failure is visible in cron logs. Do not attempt to claim more.

**Constants:**

| Constant | Default | Purpose |
|---|---|---|
| `WIP_GATE_EXIT_CODE_SINGLE` | 0 | Single in-flight ticket is normal; exit clean |
| `WIP_GATE_EXIT_CODE_MULTI` | 1 | Multiple in-flight is a leak; exit red |

**Fail-soft:** If the Linear API errors during the In Dev query, treat as gate-fired (refuse to pull when state is unknown). Log an impediment and exit 0.

### Step 2 - Cross-executor parallel check

1. From the cross-executor query result (Step 1.2, all assignees), detect active Codex work.
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

- The WIP check query (Step 1.1, `assignee:"me"`) returns non-empty (Rule 6: WIP=1 across all sessions).
- The latest handoff comment is missing any required coordination line (`Suggested model`, `Parallel-safe with`, `Mutex with`).
- Cross-executor mutex analysis indicates file-surface collision with active Codex work.
- `save_issue` claim cannot be verified by `get_issue` after one retry.

## Output Contract

On success: issue is claimed (`In Dev`, assigned to `me`), plan doc loaded, and pickup context is ready for implementation.

On refusal: leave the issue unclaimed when possible, post a concise bounce note, and stop.

## Closeout — remove the temporary worktree

After the merge-to-main auto-close fires (or after a clean push if auto-close is
unavailable per THR-276), remove the worktree from the home worktree:

```bash
cd "$REPO_ROOT"
git worktree remove "$WORKTREE_DIR"
git branch -D "$WORKTREE_BRANCH"
```

If `git worktree remove` fails (worktree not fully clean), use `--force`. Failure
to remove is non-fatal — the merge has already landed and a future
`git worktree prune` will collect the orphan.
