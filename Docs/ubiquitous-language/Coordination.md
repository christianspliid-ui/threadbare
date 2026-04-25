# Ubiquitous Language — Coordination

Not content-adjacent. Terms covering the multi-agent coordination protocol: roles, Linear states, claim discipline, and handoff structure.

---

### Cowork

**Aliases:** Cowork Agent, Design Agent
**Also see:** `[[Claude Code]]`, `[[Codex]]`, `[[Handoff Comment]]`
**Status:** canonical

The design and planning agent. Cowork produces plans, manages Linear issues, updates documentation, and authors design docs. Cowork does not write code or run git commands. Its output is design artifacts and Linear state transitions. When a design is complete, Cowork posts a Handoff Comment and moves the issue to Ready for Dev or Ready for Codex.

---

### Claude Code (CC)

**Aliases:** CC, Claude Code Agent
**Also see:** `[[Cowork]]`, `[[Codex]]`, `[[Ready for Dev]]`
**Status:** canonical

The primary executor agent. CC claims Ready for Dev issues, implements them, commits with `Fixes THR-XX`, and follows the full Definition of Done. CC's queue is Ready for Dev exclusively — never Ready for Codex. CC handles judgment-heavy, prose, and novel-system work. WIP limit: 1 In Dev issue per session.

---

### Codex

**Aliases:** Codex Agent, Codex Executor
**Also see:** `[[Claude Code]]`, `[[Ready for Codex]]`
**Status:** canonical

The secondary executor agent. Codex claims Ready for Codex issues — mechanical, pattern-following work. Codex's queue is Ready for Codex exclusively — never Ready for Dev. The separation exists to prevent queue conflicts between executors. Codex and CC are parallel-safe when their active issues don't share Mutex files.

Note: The `/codex:*` skill integration is a code review tool only, distinct from Codex-the-executor.

---

### Linear

**Aliases:** Linear App, Issue Tracker
**Also see:** `[[Ready for Dev]]`, `[[In Dev]]`, `[[Coordination Block]]`
**Status:** canonical

The single source of truth for all issues, states, and dependencies in the Threadbare team workspace. All issue tracking, state transitions, and coordination happens through Linear. The backlog file (BACKLOG.md) and Notion were deprecated when Linear was adopted on 2026-04-13.

---

### Claim-before-read

**Aliases:** Claim First, Atomic Claim
**Also see:** `[[Claude Code]]`, `[[In Dev]]`, `[[WIP Limit]]`
**Status:** canonical

The protocol requiring `save_issue(state: "In Dev", assignee: "me")` as the first mutating action after selecting an issue — before reading the plan doc or any other implementation detail. Immediately followed by `get_issue(id)` to verify the write stuck. This prevents two executors from working the same issue concurrently. Silent state drops (impediment #48) make the verify step mandatory.

---

### WIP Limit

**Aliases:** Work In Progress Limit, Single WIP
**Also see:** `[[Claim-before-read]]`, `[[In Dev]]`
**Status:** canonical

Maximum 1 In Dev issue per executor at a time, across all sessions and worktrees. Parallel work happens on different issues by different executors — never two executors on the same issue. Before claiming, verify no other In Dev issue is already assigned to you.

---

### Handoff Comment

**Aliases:** Coordination Comment, Handover Comment
**Also see:** `[[Cowork]]`, `[[Coordination Block]]`, `[[Ready for Dev]]`
**Status:** canonical

The final comment posted by Cowork when moving an issue to Ready for Dev or Ready for Codex. The Handoff Comment is the authoritative statement of what to build — it supersedes the original description when it diverges. Must contain the full Coordination Block. For reopened issues, read ALL comments back to the original handoff before acting.

---

### Ready for Dev

**Aliases:** RFD
**Also see:** `[[Claude Code]]`, `[[Handoff Comment]]`
**Status:** canonical

The Linear state indicating an issue is designed, planned, and ready for Claude Code to claim. CC polls for `state: "Ready for Dev", assignee: null` as its pickup queue. Never query Ready for Codex — that queue belongs to Codex.

---

### Ready for Codex

**Aliases:** RFC
**Also see:** `[[Codex]]`, `[[Handoff Comment]]`
**Status:** canonical

The Linear state indicating an issue is ready for Codex to claim. Codex polls for `state: "Ready for Codex", assignee: null`. Never query Ready for Dev — that queue belongs to CC.

---

### In Dev

**Aliases:** In Progress, Active
**Also see:** `[[Claim-before-read]]`, `[[WIP Limit]]`
**Status:** canonical

The Linear state indicating an issue has been claimed and is being implemented. Set by the executor via `save_issue(state: "In Dev")` as part of Claim-before-read. Issues stay In Dev until the merge commit fires the auto-close via `Fixes THR-XX`. Never call `save_issue(state: "Done")` manually — the merge-to-main auto-close is the only valid Done transition.

---

### Coordination Block

**Aliases:** Coordination Lines, Handoff Block
**Also see:** `[[Handoff Comment]]`, `[[Parallel-safe]]`, `[[Mutex]]`
**Status:** canonical

The mandatory fields in every Handoff Comment: `Suggested model`, `Parallel-safe with`, `Mutex with`. CC's coordination block also requires `model:*` label. Codex's block additionally requires `Files to touch` and `Done when` checklist. Missing coordination block = don't claim; post a bounce note and stop.

---

### Parallel-safe

**Aliases:** Parallel Safe With, Safe to Parallelize
**Also see:** `[[Coordination Block]]`, `[[Mutex]]`
**Status:** canonical

Issues that can be worked simultaneously by different executors without file surface conflicts. Listed in the Coordination Block as `Parallel-safe with: THR-XXX`. Before claiming, verify your candidate appears in the active Codex issue's Parallel-safe list and does not appear in its Mutex list.

---

### Mutex

**Aliases:** Mutex With, Exclusive, Blocking
**Also see:** `[[Coordination Block]]`, `[[Parallel-safe]]`
**Status:** canonical

Issues that cannot be worked simultaneously because they share file surfaces and would produce merge conflicts. Listed in the Coordination Block as `Mutex with: THR-XXX`. If your candidate collides with an active Codex issue's Mutex list, do not claim — pick a different issue.

---

### Fixes THR-XX

**Aliases:** Auto-close Keyword, Closing Keyword
**Also see:** `[[In Dev]]`, `[[Definition of Done]]`
**Status:** canonical

The commit body keyword (`Fixes THR-XX`, `Closes THR-XX`, or `Resolves THR-XX`) that triggers Linear's auto-close workflow when the commit merges to main. This is the only valid way to mark an issue Done — never call `save_issue(state: "Done")` manually. The merge-to-main auto-close is the merge-gated invariant that Done means shipped.
