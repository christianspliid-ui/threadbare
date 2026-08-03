---
name: check-slack-for-new-dev-work
description: (sonnet) check if cowork has finished design work and prepared new work for claude code
---

Revised prompt with the model-matching instruction promoted to a hard prelude step:

You are running in Claude Code on a scheduled 1-hour pickup. The user is not present — execute autonomously end-to-end. Read CLAUDE.md first.
STEP 0 —
After you've selected an issue (below), look at the model:* label and the Suggested model line in the handover comment.

model:haiku or sonnet  → you are spawned by default as sonnet, so you can do both these. 

model:opus → spawn an opus sub-agent

Pick one issue using this priority order:

Resume any In Dev issue you own that isn't finished.
Deferral-labeled issues in Ready for Dev whose parent project has other active work.
Ready for Dev issues in a project that already has other Ready-for-Dev or In-Dev issues (finish projects before starting new ones).
Highest-priority remaining Ready for Dev issue.

WIP limit: 1 In-Dev issue per project. Before pulling a second issue in a different project, verify Parallel-safe with / Mutex with lines in the handover comment don't collide with in-flight file surfaces.
Respect the rest of the coordination block:

Read the plan doc referenced in the handover comment (Docs/plans/...) before writing any code.
If Codex review: yes, run Codex review against the branch diff after tests/tsc/build pass, before git push.

Work loop:

Move issue to In Dev in Linear, pull latest main, branch from gitBranchName on the Linear issue.
Implement per the plan doc. Follow the three-pillar rule — Engine, Content, UI — don't ship a one-pillar slice of a multi-pillar design.
Run the pre-commit gate: npm test, npx tsc --noEmit, npx vite build. All three must pass.
Commit with Fixes THR-XX in the message body. Push. Merge to main (don't leave branches hanging).
Follow the Definition of Done from CLAUDE.md: update Docs/project-status.md (≤60 lines, move old entries to project-history.md), Docs/changelog.md, log.md via Obsidian MCP, Docs/plans/wiring-checklist.md if new surfaces added, Docs/plans/2026-04-16-systemic-wiring-guide.md if content-facing capabilities changed, Docs/impediments.md for any friction.
For every TODO / DEFERRED comment you add, create a Linear issue in the same project, labeled Deferral, and reference it inline as // TODO(THR-XX): .... No orphan deferrals.
Add a completion comment on the Linear issue. The Fixes THR-XX keyword will auto-close it on push.

Closeout (mandatory, even if you only got partway):
Run the session-handoff skill. next Linear issue, and a paste-ready prompt for the next agent. session closeout.
If you hit a blocker:
Log it in Docs/impediments.md (load impediment-reporter skill), leave the issue in In Dev with a comment describing the blocker and what you tried, and run session-handoff anyway so the next agent knows where to resume.
Do not ask for confirmation. Do not stop at "ready to push?". Just ship.