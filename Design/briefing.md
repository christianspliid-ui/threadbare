# Briefing

**Generated:** 2026-07-19 10:30 local (08:30 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs a decision only you can make this cycle.** No creative or design-vision call is waiting — the whole ready queue is technical executor work.

Same standing heads-up as prior cycles, not a task: if you open an interactive session on this machine, **refresh first** (details under **Freshness**). There's genuine good news on that front this hour — the recurring cause of these nags just got fixed (see **What's moving**), so the note should start winding down once the one-time cleanup happens.

## Queue

**Healthy** — 5 items ready for the executor, down from 6 last cycle: the `.codesight` untrack chore (**THR-660**) got pulled in and **shipped this hour**, so it's off the line. What's left is five low-priority tidy-ups: art for one economy card (THR-656), retiring the last Codex remnants (THR-634), two small motive-receipt clean-ups (THR-642/643), and an economy-feed key warning (THR-644). The last four have sat since 2026-07-05 — backlog sediment waiting its turn behind the active feature threads, not stuck work. Nothing in the ready line is blocked, nothing urgent or high-priority.

## Freshness

Home tree is on `main` but now **54 commits behind** `origin/main` (46 last cycle) — **past the alarm threshold of 10**, and still creeping up each hour. Same standing cause: this copy carries **~85 uncommitted local edits** (a stack of `src/engine/army*`/`battle*` and Codex/AscendantBar/GameView component edits, plus staged plan-doc and script deletions), too dirty for the hourly auto-sync to fast-forward, so it slips a little further behind each cycle. Those local copies are almost certainly stale echoes of already-merged work, but at ~85 files they warrant a *careful* look before anything is discarded — not a blind wipe. Before an interactive session, triage the edit pile first (item #3 in [`Design/user-actions.md`](user-actions.md)), then:

```
git fetch && git rebase origin/main
```

**Note the improvement:** THR-660 (untrack `.codesight/`) landed this hour, which removes the *recurring* re-dirtying that reset this tree every session. It doesn't clear the ~85 files already sitting there — that one-time triage is still needed — but once the tree is cleaned and pulled, the hourly auto-sync should keep it current on its own from here.

## What's moving

- **THR-660 shipped this hour** — the `.codesight/` untrack chore that was the chronic-dirt root cause landed via PRs #616/#617 (merged ~08:22 UTC). This is the fix the last several freshness notes kept pointing at; going forward the home copy should stop silently re-dirtying itself each session.
- **Economy Phase 2 (THR-616)** stays active in In-Dev — multi-slice engine/content work; expect it to sit "in dev" between slices, not stuck.
- **Player-action progression (THR-613)** remains the other active multi-session feature thread — ships a slice at a time and stays "in dev" between slices; expected.
- **The Pure Claude Code migration gate (THR-652, urgent)** is in progress. Its go/no-go check includes this briefing updating hourly for two straight days — which is happening as you read this.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
