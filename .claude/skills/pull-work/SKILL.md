---
name: pull-work
description: Canonical Claude Code pickup workflow for claiming Linear work safely from Ready for Dev.
---

# Pull Work

## Purpose

Use this skill to run Claude Code's Linear pickup protocol as an explicit checklist instead of re-deriving it from prose each session.

Run as `/pull-work` (auto-pick top Ready for Dev issue) or `/pull-work THR-123` (target a specific issue).

## Scope

- Queue: `Ready for Dev` only
- Audience: Claude Code executor
- Outcome: either a verified `In Dev` claim, or a safe refusal with a bounce note

## Steps

### Step 1 - Query candidate issue

If no issue id was provided:
1. Query `list_issues state:"Ready for Dev" assignee:null`.
2. Sort in memory by priority, then oldest `createdAt` as tie-break.
3. Pick the top candidate.

Rationale: impediment #49 shows `orderBy:priority` is rejected at runtime, so priority sorting must happen client-side.

### Step 2 - Cross-executor parallel check

1. Query `list_issues state:"In Dev"` to detect active Codex work.
2. If a Codex issue is active, verify the candidate appears in that issue's `Parallel-safe with` line.
3. Confirm the candidate does not collide with that issue's `Mutex with` line.

If collision or uncertainty remains, refuse and ask for rerouting instead of claiming.

### Step 3 - Validate coordination block on latest comment

1. Read the latest comment on the candidate issue.
2. Confirm it includes all required lines: `Suggested model`, `Parallel-safe with`, `Mutex with`.
3. If missing, add a bounce note for Cowork and stop without claiming.

### Step 4 - Claim before deep read, then verify

1. First mutating call: `save_issue(id, assignee:"me", state:"In Dev")`.
2. Immediately call `get_issue(id)` and verify both `assignee` and `state` stuck.
3. Retry once if mismatch.
4. If still mismatched, refuse to proceed and surface the write failure.

Rationale: impediment #48 documents silent state-write drops; verify-after-write is mandatory.

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

- The latest handoff comment is missing any required coordination line (`Suggested model`, `Parallel-safe with`, `Mutex with`).
- Cross-executor mutex analysis indicates file-surface collision with active Codex work.
- `save_issue` claim cannot be verified by `get_issue` after one retry.

## Output Contract

On success: issue is claimed (`In Dev`, assigned to `me`), plan doc loaded, and pickup context is ready for implementation.

On refusal: leave the issue unclaimed when possible, post a concise bounce note, and stop.
