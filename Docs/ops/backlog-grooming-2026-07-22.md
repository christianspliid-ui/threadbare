# Backlog Grooming — 2026-07-22

> **THR-677 attended trial run** of the `daily-backlog-grooming` CC task, executed manually in the marathon session before enabling the schedule.

## Needs Christian
- Nothing needs you today. (The THR-677 trial approvals are being asked in the live chat session directly.)

## Work in flight
- THR-677 (Cowork-port trials) — this run *is* its remaining work; approval gates pending in chat.
- THR-699 (Scene Slice F) — shipped, PR #710 armed, auto-closes on merge. Scene Integration chain A–F complete.

## Technical gates resolved this run
- None needed — no stale In Dev, no upstream-shipped orphans, no parked technical decisions.

## Counts by state
Todo 22 · In Design 0 · Implementation Planning 0 · Ready for Dev 0 · In Dev 2 (1 active, 1 auto-close pending) · Idea 48 · Deferral-labeled 18 (all in compliant states).

## Problems found and fixed
- **Found, flagged (not fixed):** THR-417 is **Done** ("Create monthly-rulebook-review scheduled task") but no such task exists in `list_scheduled_tasks` — phantom-Done of the THR-687 class. CLAUDE.md's own table still says "Never registered". Needs either a real registration or an honest reopen.
- No orphan issues (every open issue carries a project). No stale In Design/Planning (both empty). No Deferral-state violations. No completed-project cleanup due.

## Pipeline status
- **Ready for Dev is EMPTY — the executor lane has nothing to pick up.** Closest to ready: the five 2026-07-21 triage items (THR-678 flush-plan-docs home-tree copy, THR-679 intrinsicTier discard, THR-682 duplicate React keys, THR-683 drift-scan crash, THR-684 attachment-pipeline prompt files) plus THR-701 (design-audit-pipeline input drift, Todo). THR-683 is the most urgent of these — the dead drift-scan starves Friday's retro of its first input.
- Recommended next pickup: groom THR-683 → Ready for Dev first, then THR-678/679/682/684 with predicate-based scopes (THR-688 rules).
