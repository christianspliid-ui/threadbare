# Briefing

**Generated:** 2026-07-21 14:54 local (12:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Same three as last hour. Nothing new landed on your plate; one of them is now overdue.**

> **1. One click: switch off the old hourly `keep-work-flowing` in the Cowork app.**

You settled the sequencing this morning, and this is the part that's ready now. This task — the one writing what you're reading — is its replacement, and it has run cleanly all day. Until you flip the old one off, both run every hour and write the same brief twice.

The other three Cowork jobs stay switched **on**, exactly as you decided: each gets a fresh replacement written, and you approve a trial run before its old copy retires.

> **2. One command: clear a superseded leftover file, so your working copy starts updating again.**

**Third hour carrying this, and the drift keeps widening: 4 behind → 14 → now 18.** It will not stop on its own.

Nothing is at risk and the cause is still small. One file on your copy — this task's own standing-asks file — has an outdated edit sitting on it from a run that failed to save properly this morning. **That content is not lost:** a later run carried it forward and banked it. What's on your disk is a stale duplicate of work already saved. I re-checked that this hour rather than assuming it.

The automatic sync deliberately refuses to touch a working copy that has edits on it, in case those edits matter. This one doesn't. Scheduled tasks aren't allowed to clear it either — that rule exists because a task doing so once parked your copy for days.

**Fix — one command, any time:**

```
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- Design/user-actions.md
```

*Noted for the record: this has now met the bar the file itself set for turning it into a ticket — the sync could safely discard an edit it can prove is already banked. An agent can file and fix that; it doesn't need you.*

> **3. A steer: what's the next stretch of actual game?**

Carried, not urgent — the queue is fed and the executor won't idle. But **every one of the seven ready jobs is still plumbing**: build-pipeline fixes, ticket-writing rules, a board audit. Nothing on the list makes the game different to play.

The machine is fed, but it's feeding on itself. That's a fair place to be for a day — the tooling genuinely was unreliable and it's being fixed properly. It just shouldn't become the default by accident. The two nearest directions, both half-built rather than speculative:

- **War, deepened.** The war system came alive on the 18th. Designed but not built: **battles with real texture** (turning points, commanders in peril, last stands), **sieges that tighten as they drag** instead of resolving flat, and **what a war leaves behind** in a region afterward.
- **The economy, made visible.** Goods move along the roads now, but the player can't see any of it. Missing: **things going wrong on trade routes** — banditry, embargoes, tolls surfacing as encounters — and **the map showing what's actually travelling** a road when you look at it.

A rough word is enough — "war", "economy", or something else. **"Finish the plumbing first" is also a real answer** — say that and this stops being asked.

## Queue

**Healthy — seven jobs ready to start, nothing in progress.** Down one from last hour because one shipped, not because anything went wrong.

- **Nothing is stuck and nothing is stale.** No job waits on unfinished work; the oldest was written yesterday.
- **Nothing is mid-flight.** The lane is free rather than blocked — it finished what it picked up and hasn't reached the next hour yet.
- **All seven are infrastructure.** Six are self-maintenance, one is migration cleanup. That's the substance behind item 3 above.

## Freshness

**Your working copy is still drifting — 18 commits behind, up from 14 an hour ago.** See item 2 for the one-command fix.

It's on the right branch, nothing is stranded and nothing is lost. This is not decay: it's a sync that cannot run while the stray file sits there, so the gap simply widens each hour.

The automatic stale-branch cleanup is healthy — last run 14:40, fourteen minutes ago, tracking 21 work folders, 27 branches, no shelved work and nothing awaiting a decision.

## What's moving

**One thing closed this hour, cleanly.**

- **The upstream bug report ticket closed at 14:06.** The last step was a one-line cross-link in the project's own instructions, pointing at the public report you approved this morning. That ends the three-day investigation into why your working copy kept detaching itself — cause identified, contained locally, and now reported to the people who can fix it properly.

**Unchanged and still worth naming:** fourteen older pull requests remain open and unmerged, oldest from 12 June. Nine of them are orphans of a job that was deleted this morning and will never refresh themselves — worth a single bulk decision, which an agent can make.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
