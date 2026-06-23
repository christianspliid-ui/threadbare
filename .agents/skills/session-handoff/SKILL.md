---
name: session-handoff
description: End-of-session closeout summary aligned with Linear handoff protocol (no Slack trigger flow).
last_validated_against: 2026-06-12
---

# Session Handoff

## Purpose

Use this skill at the very end of a session to produce a concise handoff summary that matches the current protocol:
- Linear state transition + issue comment is the canonical handoff.
- No Slack DM step.
- No remote-trigger step.

This skill exists to prevent `/session-handoff` from failing with "Unknown skill" and to keep closeout behavior consistent with `CLAUDE.md` and the Linear coordination protocol.

## When to Use

Run only after implementation is complete and closeout work is done:
- verification commands completed
- commit created and pushed
- PR opened/merged path initiated
- Linear completion comment posted (or handoff comment posted for design sessions)
- required repo docs updated per current Definition of Done

## Session-End Checklist

1. Confirm the issue state reflects reality:
- Executor sessions: issue is `In Dev` until merge-to-main auto-close fires from a commit body containing `Fixes THR-XX` (or `Closes` / `Resolves`).
- Planning sessions: issue moved to `Ready for Dev` with the coordination block in the latest comment.

2. Confirm closeout artifacts:
- Completion or handoff comment exists on the Linear issue.
- Repo audit docs were updated if required by the session's Definition of Done.
- Any deferrals are tracked as Linear issues with `THR-XX` references in code comments.
- Any friction/workarounds are logged in `Docs/impediments.md`.

3. Emit a concise handoff summary in-session using this template:

```
Session handoff summary
- Mode: <Cowork planning | Claude Code executor>
- Issue: <THR-XXX title>
- State now: <In Dev | Ready for Dev | Done (if auto-closed already)>
- Shipped/Handoff: <one line>
- Verification: <commands run or N/A>
- Commit/PR: <sha and/or PR link, or N/A for planning>
- Next action: <what the next agent/human should do>
```

## Guardrails

- Do not treat this skill as a substitute for writing the real Linear comment.
- Do not manually force `Done` from executor sessions.
- Do not send Slack messages from this skill.
- Do not fire remote triggers from this skill.
- When invoked from the scheduled `keep-work-flowing` task, post the produced summary to Linear as a comment on the handed-off issue (or the active project when no issue was handed off).

## Notes

- If no next issue is ready in the relevant queue, explicitly state: `No ready work in queue this cycle`.
- If merge/auto-close is pending, state: `Awaiting merge-to-main auto-close`.
