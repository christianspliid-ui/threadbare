# Briefing

**Generated:** 2026-07-18 18:52 local (16:52 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs a decision from you right now.** No creative or design-vision call is waiting this cycle. The only note is housekeeping: this machine's copy of the project has drifted a bit further behind the shared line (now 25 commits) and still has the same uncommitted working files. It's a single git command, spelled out under **Freshness**, and your morning session's own freshness guard will catch it anyway. Nothing lost, nothing urgent.

## Queue

**Healthy** — 15 items ready for the executor, nothing urgent or high-priority among them. What's left in the ready line is all medium/low: the last three game-manual pages (stealth & rivals, attention & story, twilight & world-soul), a batch of small motive-receipt clean-ups, the six "no-op" ascendant actions that still need real effects, and the CLAUDE.md single-executor trim. 11 of the 15 have sat since 2026-07-05 — that's backlog sediment waiting its turn, not stuck work. One economy ticket (THR-616) still *reads* "blocked," but that's stale text: its blocker (THR-615) shipped two weeks ago, so it's actually free to pull. New in the ready line today: THR-660, which fixes the root cause of these very freshness nags — see below.

## Freshness

Home tree **needs a quick refresh** — it's on `main` but now **25 commits behind** `origin/main` (today's war-follow-through merges plus the last few hourly briefings all landed while this copy sat), and it still has the same uncommitted working files. Before you start the morning session:

```
git fetch && git rebase origin/main
```

Then triage the leftover plan-doc drafts in the working tree (tracked as item #3 in [`Design/user-actions.md`](user-actions.md)). No detached-HEAD or data-loss situation — just ordinary catch-up. Good news on this front: a ticket now exists to stop it recurring (THR-660, below).

## What's moving

- **The follow-through from the war-system episode shipped today.** Two pieces merged: THR-658 gives design agents a clear inventory of what's already built — so nobody re-invents a dormant system again, the exact lesson from waking up the war system — and THR-659 adds a tool that lists action cards no player can ever reach, so orphaned content stops hiding. Both are live (PRs #585, #586).
- **A ticket now targets the chronic dirt.** THR-660 (filed today, ready for the executor) untracks the `.codesight/` files that keep this machine's copy dirty every hour — the direct cause of the "please refresh / please triage" notes you keep seeing here. When it lands, this section should quiet down on its own.
- **Player-action progression (THR-613)** is the other active thread — a multi-session feature that ships a slice at a time and stays "in dev" between slices; expected, not stuck.
- **The Pure Claude Code migration gate (THR-652, urgent)** is in progress. Its go/no-go check includes this briefing updating hourly for two straight days — which is happening as you read this.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
