# Briefing

**Generated:** 2026-07-18 23:29 local (21:29 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**No creative or design-vision call is waiting this cycle.** Nothing in the queue needs a decision only you can make.

One heads-up, not a task: if you start an interactive session on this machine, **refresh first** — the home copy has now drifted past the safety line (17 commits behind, details below), so a morning session would otherwise start on stale state. The refresh + the pile of local edits it's tangled with are executor/design-session work (item #3 in [`Design/user-actions.md`](user-actions.md) + ticket THR-660), not a Christian-only chore — but the one-line habit of `git fetch && git rebase origin/main` before you begin saves you from building on old ground.

## Queue

**Healthy** — 10 items ready for the executor (down one from last hour). Nothing urgent or high-priority among them: the top of the stack is a cluster of mediums — the six "no-op" ascendant actions that still need real effects (THR-605), a batch of small motive-receipt clean-ups (THR-641), a UL proposal (THR-607) — trailing into low-priority tidy-ups (untrack `.codesight/` THR-660, art for one economy card, retiring Codex remnants). Most have sat since 2026-07-05 — backlog sediment waiting its turn, not stuck work. One economy ticket (THR-616) still *reads* "blocked," but that text is stale: its blocker (THR-615) shipped on 2026-07-05, so it's free to pull.

## Freshness

Home tree is on `main` but has now **drifted 17 commits behind** the shared line — **past the alarm threshold of 10** (it was 8 behind last hour, 3 the hour before). It's climbing steadily, and the cause is the standing one: this copy carries a **large set of uncommitted local edits** (~85 files), which is too dirty for the automatic hourly sync to fast-forward, so it slips further behind each cycle. Those local copies are almost certainly stale echoes of already-merged work (the war system and card-inspector both shipped cleanly through the shared line), but at ~85 files they deserve a *careful* look before anything is discarded, not a blind wipe. That triage is tracked as item #3 in [`Design/user-actions.md`](user-actions.md) and is executor/design-session work. THR-660 (in the queue) attacks the recurring cause and, once landed, lets the hourly auto-sync catch this copy up on its own.

## What's moving

- **The game manual looks finished.** "Twilight, Echoes & the World-Soul" (THR-602) — flagged as the last page being written last hour — has left both active lanes, i.e. it merged. That completes the manual (W1–W17).
- **Player-action progression (THR-613)** is the active feature thread — multi-session, ships a slice at a time and stays "in dev" between slices; expected, not stuck.
- **The Pure Claude Code migration gate (THR-652, urgent)** is in progress. Its go/no-go check includes this briefing updating hourly for two straight days — which is happening as you read this.
- **A ticket targets the chronic dirt.** THR-660 (ready for the executor) stops the auto-generated `.codesight/` files from keeping this machine's copy perpetually "dirty" — the direct cause of the drift above. When it lands, the Freshness section should quiet down on its own.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
