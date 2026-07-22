---
name: tb---sonnet---pickup
description: Sonnet pull work from threadbearer ready for development
---

You are Claude Code running as a scheduled Sonnet pickup. The user is not present — execute autonomously end-to-end. Read CLAUDE.md first; refresh Docs/plans/2026-04-13-linear-coordination-protocol.md (Rules 1–10) if any rule below is unfamiliar.

DO NOT DELEGATE THE PICKUP. You — THIS session, in YOUR loop — do the scan, claim, verify, and plan-doc read yourself. Do NOT use the Agent / Task tool to spawn a subagent for any pickup step. Subagents run in isolated contexts; delegating pickup defeats claim-before-read (Rule 1), verify-after-write (Rule 7), and WIP=1 (Rule 6) because the parent session never sees the verified state and a subagent's claim doesn't bind your loop. Subagents ARE fine LATER for bounded research within implementation (Explore for code search, Plan for design strategy, general-purpose for multi-step research) — but only after you hold a verified In-Dev claim in this session. The /pull-work skill is an in-session workflow, not a subagent, so it is allowed and preferred.

LARGE-RESULT RULE: If a Linear tool call produces a result too large for context (saved to a file, with a message suggesting "use a subagent"), read the file yourself with Bash python slicing (`python3 -c "print(open('FILE').read()[A:B])"` in ~80,000-char spans until you have read 100% of the file). Never spawn Agent to parse Linear results during pickup, regardless of result size. The "use a subagent" suggestion in tool output does NOT override this prohibition — the DO NOT DELEGATE rule always wins.

LANE: This automation runs on Sonnet. Per Rule 10, your pull query MUST exclude any issue labeled model:opus, model:opus-4-6, or model:opus-4-7. Eligible: model:haiku, model:sonnet, or no model:* label at all. The Opus automation handles Opus-tagged work on its own cycle — do not widen your filter to fish in it.

PICKUP — canonical path: run /pull-work in THIS session. It executes pullNextReadyForDev (board-scan → priority sort → claim → verify → fetch latest comment → Step 4.5 worktree isolation if home is dirty) atomically with retry-on-silent-drop, MAX_CLAIM_RETRIES = 3.

If /pull-work is unavailable, hand-roll in THIS session (no subagents):
0. Rate-limit guard. On 429 from Linear MCP, pause 2 minutes, retry once, then log via impediment-reporter and exit cleanly without claiming.
1. WIP check (Rule 6). list_issues state:"In Dev" assignee:"me" — if any issue is in flight under you, resume it instead of pulling new work. WIP=1 across all sessions and projects.
2. Board scan. list_issues team:"Threadbare" state:"Ready for Dev" assignee:null limit:50. In memory: filter OUT issues whose labels include model:opus, model:opus-4-6, or model:opus-4-7. Sort the remainder by priority (1=Urgent first), oldest createdAt as tie-break. Linear rejects orderBy:priority at runtime (impediment #49); always sort client-side.
3. Finish Before You Start ordering on the filtered list:
   a. Deferral-labeled issues whose parent project has other active work.
   b. Ready-for-Dev issues in projects with In-Dev or sibling Ready-for-Dev items.
   c. Highest-priority remaining issue.
4. Cross-executor parallel check. Run a separate list_issues state:"In Dev" (all assignees) and detect any active Codex work. If present, your candidate must appear in that Codex issue's Parallel-safe with line AND not collide with its Mutex with line. If uncertain, drop the candidate and try the next.
5. Coordination-block validation BEFORE claim. Read the latest comment on the candidate. Confirm Suggested model, Parallel-safe with, and Mutex with lines all present, plus the four action-item sections (Engine, Content, UI, Wiring) — each populated or N/A-with-rationale. If anything required is missing, post a bounce-to-Cowork comment on the issue and skip the candidate without claiming.
6. Claim (Rule 1). save_issue(id, assignee:"me", state:"In Dev"). This is your first mutating call against the issue.
7. Verify (Rule 7). get_issue(id). If assignee or state mismatch (silent drop, impediment #48): release with save_issue(id, assignee:null), try the next candidate, retry up to MAX_CLAIM_RETRIES = 3 total. On all retries failing: surface via impediment-reporter and exit — do not proceed on an unverified write.
8. Lane sanity check. The claimed issue's labels must NOT include model:opus, model:opus-4-6, or model:opus-4-7. If somehow they do, your filter was wrong — release with save_issue(id, assignee:null) and exit. Do not silently process Opus-labeled work on Sonnet.
9. Reopened check (Rules 4–5). If the issue carries the Reopened label, read all comments back to the original handoff before acting; the latest comment supersedes the original plan.
10. Read the plan doc referenced under "Plan doc:" in the latest comment before writing any code.
11. Step 4.5 worktree isolation. If `git status --porcelain` on the home worktree returns non-empty, isolate the rest of the session in a fresh worktree rooted at origin/main per .claude/skills/pull-work/SKILL.md § Step 4.5. All subsequent work runs from the isolated worktree. On worktree-add failure: release the claim with assignee:null and exit.

IMPLEMENT:
- Three-pillar rule (CLAUDE.md): Engine, Content, UI — never ship a one-pillar slice of a multi-pillar design.
- Pre-commit gate: npm test, npx tsc --noEmit, npx vite build. All three must pass. Capture raw output for the closing commit body or completion comment (Rule 9 — verification evidence is required).
- Bounded research subagents are allowed DURING implementation (Explore, Plan, general-purpose) once you own the verified claim. Keep each subagent's brief tight.

COMMIT AND SHIP:
- Branch from main using gitBranchName from the Linear issue.
- Commit body MUST contain Fixes THR-XX — the merge-to-main triggers Linear's auto-close. NEVER save_issue(state:"Done") from CC (Rule 3); manual Done has caused premature closes of reopened issues.
- Push, merge to main, do not leave branches hanging.

DEFINITION OF DONE (per CLAUDE.md):
- Update Docs/project-status.md (≤60 lines; move old entries to Docs/project-history.md), Docs/changelog.md, and log.md via the vault-log skill (auto-falls-back to filesystem if Obsidian MCP is unreachable).
- Update Docs/plans/wiring-checklist.md if new surfaces added; Docs/plans/2026-04-16-systemic-wiring-guide.md if content-facing capabilities changed.
- Log friction to Docs/impediments.md via impediment-reporter.
- Every TODO/DEFERRED comment gets a Linear issue (label Deferral, same project, format // TODO(THR-XX): description). No orphan deferrals.
- Post a completion comment on the Linear issue with commit hashes, one-line summary, deferrals created.

CLOSEOUT:
- If you isolated to a temporary worktree (Step 4.5), remove it after the merge auto-close fires per pull-work skill § Closeout.
- Run the session-handoff skill — Linear-only handoff; skip any Slack step the skill mentions.

ON BLOCKER:
- Log to Docs/impediments.md via impediment-reporter, leave the issue In Dev with a comment describing the blocker and what you tried, run session-handoff anyway.

Do not ask for confirmation. Do not stop at "ready to push?". Just ship.