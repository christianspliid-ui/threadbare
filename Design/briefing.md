# Briefing

**Generated:** 2026-07-18 19:28 local (17:28 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs a decision from you right now.** No creative or design-vision call is waiting this cycle. The only note is the same housekeeping one: this machine's copy of the project has drifted a little further behind the shared line (now 29 commits) and still has the same uncommitted working files. It's a single git command, spelled out under **Freshness**, and your morning session's own freshness guard will catch it anyway. Nothing lost, nothing urgent.

## Queue

**Healthy** — 14 items ready for the executor, nothing urgent or high-priority among them. What's left is all medium/low: the last three game-manual pages (stealth & rivals, attention & story, twilight & world-soul), a batch of small motive-receipt clean-ups, the six "no-op" ascendant actions that still need real effects, and a few infrastructure tidy-ups. Most of these have sat since 2026-07-05 — backlog sediment waiting its turn, not stuck work. One economy ticket (THR-616) still *reads* "blocked," but that's stale text: I checked, and its blocker (THR-615) shipped on 2026-07-05, so it's actually free to pull. New in the ready line today: THR-660, which fixes the root cause of these very freshness nags — see below.

## Freshness

Home tree **needs a quick refresh** — it's on `main` but now **29 commits behind** `origin/main` (today's merges plus the last few hourly briefings all landed while this copy sat), and it still carries the same uncommitted working files. Before you start the morning session:

```
git fetch && git rebase origin/main
```

Then triage the leftover plan-doc drafts in the working tree (tracked as item #3 in [`Design/user-actions.md`](user-actions.md)). No detached-HEAD or data-loss situation — just ordinary catch-up. A ticket already exists to stop this recurring (THR-660, below).

## What's moving

- **The single-executor CLAUDE.md trim shipped (THR-575).** The opening coordination section got slimmed down and the impediment log updated — both landed today via PR #588. That was one of the items sitting in the ready line last hour.
- **A ticket now targets the chronic dirt.** THR-660 (filed today, ready for the executor) untracks the `.codesight/` files that keep this machine's copy dirty every hour — the direct cause of the "please refresh / please triage" notes you keep seeing here. When it lands, this section should quiet down on its own.
- **Player-action progression (THR-613)** is the active feature thread — multi-session, ships a slice at a time and stays "in dev" between slices; expected, not stuck.
- **The Pure Claude Code migration gate (THR-652, urgent)** is in progress. Its go/no-go check includes this briefing updating hourly for two straight days — which is happening as you read this.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
