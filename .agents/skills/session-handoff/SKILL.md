---
name: session-handoff
description: Final step of every session — send structured Slack DM with completion summary and next-agent prompt. Replaces the plain "Session ready to archive" closeout line.
---

# Session Handoff

## Purpose

At the end of every session, send a structured Slack DM that:
1. Confirms what shipped (issue, commit, deploy status)
2. Surfaces the next highest-priority work item from Linear
3. Provides a ready-to-paste prompt for the next agent

This closes the coordination loop without requiring you to manually check Linear or decide what comes next.

## When to Use

**Every session, every agent, every mode.** Run this as the very last step — after docs are updated, commits are pushed, and impediments are logged. It replaces the plain "Session ready to archive" line in Definition of Done.

Invoked as `/session-handoff` or called directly at session end.

---

## Steps

### Step 1 — Gather completion context

From the current session (already known at this point):
- Completed issue ID and title
- Short commit hash: `git log -1 --format=%h`
- One-line summary of what shipped

If this was a **Cowork session** (design/planning, no commit), note the Linear issue moved to "Ready for Dev" instead.

### Step 2 — Find the next work item

Query Linear for the next item using the prioritization order from CLAUDE.md:

```
Priority 1: list_issues label:"Deferral" state:"Ready for Dev"   ← finish what we started
Priority 2: list_issues state:"Ready for Dev"                     ← next in active projects
Priority 3: list_issues state:"Todo"                              ← fresh work
```

Take the top result. If multiple issues tie on priority, prefer the one in the same project as the just-completed work.

### Step 3 — Determine next agent type and prompt

| Next issue state | Agent | Suggested prompt |
|-----------------|-------|-----------------|
| Ready for Dev | **Claude Code** | `"pull [THR-XXX]"` |
| Implementation Planning | **Cowork** | `"review THR-XXX and create the implementation plan. Design doc: [path if known]. Cover all three pillars."` |
| Todo / In Design | **Cowork** | `"pick up THR-XXX — it's in [state]. Resume or start design, cover Engine + Content + UI pillars."` |

If the handover comment on the issue includes `Suggested model:`, include that in the message.

### Step 4 — Build the Slack message

```
✅ [AGENT_MODE] done — [COMPLETED_ISSUE_ID]: [COMPLETED_ISSUE_TITLE]

[One-line summary of what shipped]
Commit: [hash] | Vercel: auto-deploying from push to main

---
Next → [NEXT_ISSUE_ID]: [NEXT_ISSUE_TITLE]
State: [state] | Priority: [priority]
[If model label exists]: Model: [model]
[If mutex line exists]: Mutex with: [mutex]
[If parallel-safe line exists]: Parallel-safe with: [parallel-safe]

Suggested [Claude Code / Cowork] prompt:
"[prompt]"
```

**If no next issue found:**
```
✅ [AGENT_MODE] done — [COMPLETED_ISSUE_ID]: [COMPLETED_ISSUE_TITLE]

[One-line summary]
Commit: [hash] | Vercel: auto-deploying

No Ready for Dev issues found. Check Linear for what's next:
https://linear.app/threadbare
```

### Step 5 — Send the Slack message

Use `slack_send_message` to channel `C0AT5DYGJ8P` (the Threadbare dev channel).

**Important:** Use plain text only — no markdown bold (`**`), no italic (`_`), no backtick code spans. The Slack MCP rejects messages with those formatting characters. Asterisks for `*italic*` are fine.

### Step 6 — Fire the next remote trigger (local sessions only)

After sending the Slack message, fire the appropriate remote trigger immediately so the next agent starts without waiting for the hourly cron:

| Next agent | Trigger ID | Action |
|-----------|-----------|--------|
| Claude Code (next item is Ready for Dev) | `trig_012H3CEdTnrAqY4w81T4rLXz` | `RemoteTrigger(action: "run", trigger_id: "trig_012H3CEdTnrAqY4w81T4rLXz")` |
| Cowork PM (next item needs design) | `trig_01D4TCHhvnHAvWUGVVnrC9cH` | `RemoteTrigger(action: "run", trigger_id: "trig_01D4TCHhvnHAvWUGVVnrC9cH")` |

**Note:** `RemoteTrigger` is only available in local Claude Code sessions. Remote trigger sessions (running on claude.ai/scheduled) cannot call it — they rely on the hourly cron or the Slack notification for the next handoff. Skip this step if you are running as a remote session.

If `RemoteTrigger` is not available or returns an error, log the error and continue — the Slack message already covers the handoff.

---

## Example Output

```
✅ Claude Code done — THR-112: Hidden mark revelation pathway

Closes write-only gap in HiddenMark — scoring boost, probabilistic consumption,
Phase 6.7 decay, 37 new tests. Codex-reviewed. Commit: 82bf8cc5 | Vercel: auto-deploying

---
Next → THR-113: Intelligence consumption loop
State: Ready for Dev | Priority: Urgent | Model: sonnet
Mutex with: THR-112 (now done ✓)
Parallel-safe with: THR-114, THR-115

Suggested Claude Code prompt:
"pull thr 113"
```

---

## Notes

- **Don't fabricate Linear data.** If `list_issues` returns nothing useful, say so.
- **Don't include the full design doc** in the Slack message — just the issue ID and prompt. The agent receiving the prompt will load the doc themselves.
- **Cowork → CC handoffs** are the most common. The Cowork agent moves an issue to "Ready for Dev" and sends the CC prompt. CC picks it up next session.
- **CC → Cowork handoffs** happen when all Ready for Dev work is done and the next item needs design. Less common but follow the same pattern.
