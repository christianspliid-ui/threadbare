# Weekly Project Hygiene — 2026-07-22

> **THR-677 attended trial run** of the `weekly-project-hygiene` CC task, executed manually in the marathon session before enabling the schedule.

## Needs Christian

- Nothing needs a decision in this report. (The trial approvals are being asked in the live chat session; the Cowork-disable toggles remain on `Design/user-actions.md`.)

## Queue health

- Ready for Dev: 2 (THR-703, THR-704 — both filed today by the trials themselves; the queue had hit **zero** after the marathon drained it). In Dev: 2 (THR-677 active/approval-gated; THR-699 shipped, auto-close pending PR #710). In Design / Implementation Planning: 0.

## Findings filed

- **THR-704** — orphan scheduled-task dirs (8, incl. retired `flush-plan-docs`), skill-tree debris (`gamedocumenter-workspace/`, `image-manipulation-workspace/` with no `SKILL.md`), THR-417 phantom-Done (monthly-rulebook-review never registered).
- (Filed by the sibling retro trial: **THR-703** — unarmed open-PR stragglers.)

## Clean checks

- **Linear queue audit:** PASS beyond the zero-depth event (all issues have projects; coordination blocks present on this week's handoffs; no stale In Dev; Deferral states compliant).
- **Skill tree:** `.agents/skills/` has not returned (PASS); every skill dir except the two `-workspace` debris dirs carries `SKILL.md` with frontmatter.
- **Scheduled-task registry:** both directions checked — table↔registry consistent for the 8 registered tasks; the 8 orphan *directories* are THR-704. Note: `tb-opus-pickup` and `keep-work-flowing-cc` currently show no cron ("Manual only", disabled) — consistent with the marathon-session takeover, not filed as a defect; re-enable is the marathon's exit duty.
- **Docs staleness:** `project-status.md` exactly at the 60-line cap; history/changelog rows current through today's ships; no orphan root-level markdown; `AGENTS.md` has not reappeared. Obsidian vault spot-check skipped (trial ran in the session worktree; noted, not a failure).
- **Impediment log:** current through today (2 new entries logged this session: junction-wipe M, stale-`gh pr view` S). Chronic-class watch: the 1920×1080 screenshot two-surface trap (3+ recurrences) already carries a retro-decision ask in the log — not re-filed.
- **Retro follow-through:** Friday `weekly-retro` is registered and live; the workflow-retro baseline report now exists (sibling trial).
- **Sandbox limitations:** no promotion needed yet; junction-wipe becomes a promotion candidate on first recurrence.
- **Three-pillar compliance:** trivially PASS — no issues In Design / Implementation Planning.
- **Done-state smoke:** THR-694–698 + THR-702 all carry real landing commits and closeout doc rows (verified during this session's ships). THR-417 is the one phantom found → THR-704.

## Notes

- This trial reused board scans performed minutes earlier in the same session rather than re-querying every state — a scheduled run starts cold and must do its own scans.
- Non-Threadbare orphan task dirs (`daily-standup`, `keep-website-up-to-date`, etc.) deliberately left untouched per the Threadbare-only scope guard.
