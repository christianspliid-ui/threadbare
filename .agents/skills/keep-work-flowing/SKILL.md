---
name: keep-work-flowing
description: Scheduled Cowork PM run that scans Linear, advances one high-leverage planning item, and leaves the next executor handoff in Linear comments instead of Slack.
last_validated_against: 2026-06-12
---

# Keep Work Flowing

## Purpose

Use this skill for the scheduled `keep-work-flowing` Cowork run that keeps the implementation queues moving.

Linear is the only coordination surface. Do not send Slack messages from this skill.

## Your Job This Session

1. Scan the board using the current Linear coordination protocol and pick the highest-leverage planning move available.
2. Do the planning work: design, research, or implementation-plan authoring only. Do not write product code or run git commands in Cowork mode.
3. If work is ready to hand off, move the issue to `Ready for Dev` or `Ready for Codex` and post the full coordination-block handoff comment on that issue.
4. Run `/session-handoff` to produce the concise end-of-session summary.
5. Post that summary as a Linear comment:
   - If this run handed off an issue, post it on the issue you just moved to `Ready for Dev` or `Ready for Codex`.
   - If no issue was handed off this cycle, post it on the most relevant active project as a coordination note.

## Linear Comment Template

Post the `/session-handoff` output in this shape:

```md
## Session handoff summary

- **Mode:** Cowork planning
- **Issue:** THR-XXX — <title>
- **State now:** <Ready for Dev | Ready for Codex | In Design | Implementation Planning>
- **Handoff:** <one-line summary>
- **Verification:** <N/A or what was verified>
- **Commit/PR:** N/A — planning session
- **Next action:** <what CC, Codex, or Christian should do next>
```

## Guardrails

- Do not reference Slack channels, Slack message formats, or Slack delivery steps.
- Do not rely on in-session output alone when a Linear comment should exist.
- Do not hand off without the required coordination block (`Parallel-safe with`, `Mutex with`, and any executor-specific fields).
- Do not treat "no issue handed off" as a silent success; leave a discoverable coordination note in Linear.

## Fail-Soft

- If `save_comment` fails, emit the exact comment body in-session prefixed with `LINEAR COMMENT UNAVAILABLE — paste manually`.
- If no issue is ready to hand off, post the idle-cycle summary on the active project instead of failing the run.
- If `/session-handoff` is unavailable, compose the same summary inline and post that body to Linear.
