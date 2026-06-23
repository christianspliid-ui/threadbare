# Ubiquitous Language — Coordination

Not content-adjacent. Terms covering the multi-agent coordination protocol: roles, Linear states, claim discipline, and handoff structure.

---

### Cowork

**Aliases:** Cowork Agent, Design Agent
**Also see:** `[[Claude Code]]`, `[[Handoff Comment]]`
**Status:** canonical

The design and planning agent. Cowork produces plans, manages Linear issues, updates documentation, and authors design docs. Cowork does not write code or run git commands. Its output is design artifacts and Linear state transitions. When a design is complete, Cowork posts a Handoff Comment and moves the issue to Ready for Dev.

---

### Claude Code (CC)

**Aliases:** CC, Claude Code Agent
**Also see:** `[[Cowork]]`, `[[Ready for Dev]]`
**Status:** canonical

The single executor agent. CC claims Ready for Dev issues, implements them, commits with `Fixes THR-XX`, and follows the full Definition of Done. CC's queue is Ready for Dev — the only executor queue. WIP limit: 1 In Dev issue per session.

---

### Codex

**Aliases:** Codex Agent, Codex Executor
**Also see:** `[[Claude Code]]`
**Status:** deprecated

*Retired 2026-06-23 (THR-486).* Codex was a secondary executor agent that pulled mechanical, pattern-following work from the `Ready for Codex` queue. The two-executor / two-queue model was collapsed to a single Claude Code executor; the queue and the agent were retired. The term is preserved here so it resolves when it appears in historical plan docs, retros, and changelog entries.

Note: The `/codex:*` code-review skill integration is a separate tool — distinct from Codex-the-executor — and is not part of the coordination workflow.

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

The protocol requiring `save_issue(state: "In Dev", assignee: "me")` as the first mutating action after selecting an issue — before reading the plan doc or any other implementation detail. Immediately followed by `get_issue(id)` to verify the write stuck. This prevents two sessions from working the same issue concurrently. Silent state drops (impediment #48) make the verify step mandatory.

---

### WIP Limit

**Aliases:** Work In Progress Limit, Single WIP
**Also see:** `[[Claim-before-read]]`, `[[In Dev]]`
**Status:** canonical

Maximum 1 In Dev issue at a time, across all sessions and worktrees. Parallel work happens on different issues — never two sessions on the same issue. Before claiming, verify no other In Dev issue is already assigned to you.

---

### Handoff Comment

**Aliases:** Coordination Comment, Handover Comment
**Also see:** `[[Cowork]]`, `[[Coordination Block]]`, `[[Ready for Dev]]`
**Status:** canonical

The final comment posted by Cowork when moving an issue to Ready for Dev. The Handoff Comment is the authoritative statement of what to build — it supersedes the original description when it diverges. Must contain the full Coordination Block. For reopened issues, read ALL comments back to the original handoff before acting.

---

### Ready for Dev

**Aliases:** RFD
**Also see:** `[[Claude Code]]`, `[[Handoff Comment]]`
**Status:** canonical

The Linear state indicating an issue is designed, planned, and ready for Claude Code to claim. CC polls for `state: "Ready for Dev", assignee: null` as its pickup queue. It is the only executor queue.

---

### Ready for Codex

**Aliases:** RFC
**Also see:** `[[Codex]]`
**Status:** deprecated

*Retired 2026-06-23 (THR-486).* The Linear state that fed the Codex executor queue. Retired with the single-executor consolidation — confirm the queue is empty, then archive the state in Linear team settings. The term is preserved here so it resolves when it appears in historical records.

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

The mandatory fields in every Handoff Comment: `Suggested model`, `Parallel-safe with`, `Mutex with`. The `Suggested model` line (and its matching `model:*` label) is advisory — the single CC automation runs Opus regardless. Missing coordination block = don't claim; post a bounce note and stop.

---

### Parallel-safe

**Aliases:** Parallel Safe With, Safe to Parallelize
**Also see:** `[[Coordination Block]]`, `[[Mutex]]`
**Status:** canonical

Issues that can be worked simultaneously in separate sessions or worktrees without file surface conflicts. Listed in the Coordination Block as `Parallel-safe with: THR-XXX`. Before running a second issue concurrently, verify your candidate appears in the other active issue's Parallel-safe list and does not appear in its Mutex list.

---

### Mutex

**Aliases:** Mutex With, Exclusive, Blocking
**Also see:** `[[Coordination Block]]`, `[[Parallel-safe]]`
**Status:** canonical

Issues that cannot be worked simultaneously because they share file surfaces and would produce merge conflicts. Listed in the Coordination Block as `Mutex with: THR-XXX`. If your candidate collides with another active issue's Mutex list, do not run them concurrently — work them serially.

---

### Fixes THR-XX

**Aliases:** Auto-close Keyword, Closing Keyword
**Also see:** `[[In Dev]]`, `[[Definition of Done]]`
**Status:** canonical

The keyword (`Fixes THR-XX`, `Closes THR-XX`, or `Resolves THR-XX`) that triggers Linear's auto-close workflow when the PR merges to main. Place it in **both** the commit body and the PR description body (impediment #140 — a squash/merge commit can drop the keyword from the commit body, but the PR body is always read). This is the only valid way to mark an issue Done — never call `save_issue(state: "Done")` manually. The merge-to-main auto-close transitions the issue straight to Done — the merge-gated invariant that Done means shipped.
