# Briefing

**Generated:** 2026-07-19 07:29 local (05:29 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs a decision only you can make this cycle.** No creative or design-vision call is waiting — the whole ready queue is technical executor work.

Same standing heads-up as last cycle, not a task: if you open an interactive session on this machine, **refresh first**. The home copy has slipped another commit behind the shared line (**46 behind** now, was 45) and still carries the ~83 uncommitted local edits. `git fetch && git rebase origin/main` before you begin keeps you off old ground — but do the edit-pile triage first (item #3 in [`Design/user-actions.md`](user-actions.md)) so the rebase lands clean. That refresh + triage is executor/design-session work plus ticket THR-660, not a Christian chore.

## Queue

**Healthy** — 6 items ready for the executor, down from 7 last cycle: the economy ticket **THR-616** got pulled into active work this hour (it's now in dev, so it's no longer sitting in the ready line reading "blocked"). What's left is one medium — untrack `.codesight/` to stop the chronic dirt (**THR-660**) — and five low-priority tidy-ups: art for one economy card (THR-656), retiring the last Codex remnants (THR-634), two small motive-receipt clean-ups (THR-642/643), and an economy-feed key warning (THR-644). Those last four have sat since 2026-07-05 — backlog sediment waiting its turn behind the active feature threads, not stuck work. Nothing in the ready line is blocked.

## Freshness

Home tree is on `main` but now **46 commits behind** `origin/main` (45 last cycle) — **past the alarm threshold of 10**, and creeping up each hour. Same standing cause: this copy carries a **large set of uncommitted local edits** (~83 non-`.codesight` files — a stack of `src/engine/army*`/`battle*` and Codex/AscendantBar/GameView component edits, plus staged plan-doc and script deletions), too dirty for the hourly auto-sync to fast-forward, so it slips a little further behind each cycle. Those local copies are almost certainly stale echoes of already-merged work (the TB-073 war system and the orphaned-card inspector both shipped cleanly through the shared line), but at ~83 files they warrant a *careful* look before anything is discarded — not a blind wipe. That triage is item #3 in [`Design/user-actions.md`](user-actions.md), executor/design-session work. THR-660 (in the queue) attacks the recurring `.codesight/` cause and, once landed, lets the hourly auto-sync catch this copy up on its own.

## What's moving

- **Economy Phase 2 (THR-616)** just went active — pulled into In-Dev this hour after its blocker (THR-615) shipped 2026-07-05. Multi-slice engine/content work; expect it to stay "in dev" between slices.
- **Player-action progression (THR-613)** remains the other active multi-session feature thread — ships a slice at a time and stays "in dev" between slices; expected, not stuck.
- **The Pure Claude Code migration gate (THR-652, urgent)** is in progress. Its go/no-go check includes this briefing updating hourly for two straight days — which is happening as you read this.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
