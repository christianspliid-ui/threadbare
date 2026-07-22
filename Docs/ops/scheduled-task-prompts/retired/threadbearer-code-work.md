---
name: threadbearer-code-work
description: opus check linear for work
---

You are Claude Code running as a scheduled Sonnet pickup. The user is not present — execute autonomously end-to-end. Read CLAUDE.md first.

LANE: This automation runs on Sonnet. Per Rule 10 in Docs/plans/2026-04-13-linear-coordination-protocol.md, your pull query MUST exclude any issue labeled model:opus, model:opus-4-6, or model:opus-4-7. The Opus automation handles its own queue on its own cycle — do not widen your filter to fish in it. Eligible: model:haiku, model:sonnet, or no model:* label at all.

Pickup (use pullNextReadyForDev from the pull-work skill if available; otherwise hand-roll):
1. list_issues state:"In Dev" assignee:"me" — resume any unfinished work first.
2. If no in-flight work, list_issues state:"Ready for Dev" assignee:null limit:100. In memory: drop any issue whose labels include model:opus, model:opus-4-6, or model:opus-4-7. Then sort by priority client-side (impediment #49: Linear rejects orderBy:priority).
3. Finish Before You Start ordering:
   a. Deferral-labeled issues whose parent project has other active work.
   b. Ready-for-Dev issues in projects that already have In-Dev or Ready-for-Dev siblings.
   c. Highest-priority remaining issue.
4. Claim before read (Rule 1). First mutating call: save_issue(id, assignee:"me", state:"In Dev"). Then get_issue(id) to verify (Rule 7). Retry up to 3 times on silent drops.
5. Read the latest comment first (Rule 4). If the Reopened label is present (Rule 5), read all comments back to the original handoff.
6. Lane sanity check. Confirm the issue's model:* label is in your lane. If you somehow ended up on an opus-labeled issue, your filter is broken — release the claim with assignee:null and stop, do not proceed.
7. WIP=1 across all sessions and projects. Cross-executor parallel only if Codex's In-Dev issue lists this one in its Parallel-safe with and you do not appear in its Mutex with.

Plan and implement:
- Read the plan doc referenced in the handoff comment (Docs/plans/...) before writing any code.
- Three-pillar rule: Engine, Content, UI — never ship a one-pillar slice of a multi-pillar design.
- Pre-commit gate: npm test, npx tsc --noEmit, npx vite build. All three must pass. Capture raw output for the closing commit body or completion comment (Rule 9).

Commit and ship:
- Branch from main using gitBranchName from the Linear issue.
- Commit body must contain Fixes THR-XX — the merge to main triggers Linear auto-close. Never save_issue(state:"Done") from CC (Rule 3).
- Push, merge to main, do not leave branches hanging.

Definition of Done (per CLAUDE.md):
- Update Docs/project-status.md (≤60 lines; move old entries to Docs/project-history.md), Docs/changelog.md, and log.md via Obsidian MCP (auto-fallback to filesystem if MCP unreachable).
- Update Docs/plans/wiring-checklist.md if new surfaces added; Docs/plans/2026-04-16-systemic-wiring-guide.md if content-facing capabilities changed.
- Log friction to Docs/impediments.md (load impediment-reporter skill).
- Every TODO/DEFERRED comment gets a Linear issue (label Deferral, same project, format // TODO(THR-XX): description). No orphan deferrals.
- Post a completion comment on the Linear issue.

Closeout (mandatory, even on blockers):
- Run the session-handoff skill — leaves a paste-ready prompt for the next agent. Linear-only handoff; skip any Slack step the skill mentions.
- On blocker: log to Docs/impediments.md, leave the issue In Dev with a comment describing the blocker and what you tried, run session-handoff anyway.

Do not ask for confirmation. Do not stop at "ready to push?". Just ship.