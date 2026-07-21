# Briefing

**Generated:** 2026-07-21 13:54 local (11:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Three things, all carried: one click, one small command, one steer. Nothing new landed on your plate this hour.**

> **1. One click: switch off the old hourly `keep-work-flowing` in the Cowork app.**

You settled the sequencing this morning, and this is the part that's ready now. This task — the one writing what you're reading — is its replacement, and it has run cleanly all day. Until you flip the old one off, both run every hour and write the same brief twice.

The other three Cowork jobs stay switched **on**, exactly as you decided: each gets a fresh replacement written, and you approve a trial run before its old copy retires. That work is queued and waiting.

> **2. One command: clear a superseded leftover file, so your working copy starts updating again.**

Carried from last hour, and **it is getting worse rather than holding steady** — your working copy was 4 commits behind then, and is 14 behind now. It will keep drifting each hour until this is cleared.

The cause is small and nothing is at risk. One file on your copy — this task's own standing-asks file — has an edit sitting on it from a run that failed to save properly at 10:54. **That content is not lost:** the 11:54 run carried it forward and saved it to the main copy. What's left on your disk is an outdated duplicate of work already banked.

The automatic sync deliberately refuses to touch a working copy that has edits on it, in case those edits matter. This one doesn't. Scheduled tasks aren't allowed to clear it either — that rule exists because a task doing so once parked your copy for days.

**Fix — one command, any time:**

```
git -C "C:/Users/chris/Dev/Projects/TheFantasyWorldSimulator" checkout -- Design/user-actions.md
```

> **3. A steer: what's the next stretch of actual game?**

Carried, and not urgent — the queue is fed, eight jobs ready, the executor won't idle. But **every one of them is plumbing**: build-pipeline fixes, ticket-writing rules, a board audit. Nothing on the list makes the game different to play.

So the machine is fed, but it is only feeding on itself. That's a legitimate place to be for a day — the tooling genuinely was unreliable and it's being fixed properly. It just shouldn't be the default by accident. The two nearest directions, both half-built rather than speculative:

- **War, deepened.** The war system came alive on the 18th. Designed but not built: **battles with real texture** (turning points, commanders in peril, last stands), **sieges that tighten as they drag** instead of resolving flat, and **what a war leaves behind** in a region afterward.
- **The economy, made visible.** Goods move along the roads now, but the player cannot see any of it. Missing: **things going wrong on trade routes** — banditry, embargoes, tolls surfacing as encounters — and **the map showing what is actually travelling** a road when you look at it.

A rough word is enough — "war", "economy", or something else. **"Finish the plumbing first" is also a real answer** — say that and this stops being asked.

## Queue

**Healthy — eight jobs ready to start, nothing in progress.** The executor lane will pull on the hour.

- **Nothing is stuck and nothing is stale.** No job waits on unfinished work; the oldest was written yesterday.
- **Nothing is mid-flight.** The lane is free rather than blocked — it finished what it had.
- **All eight are infrastructure.** Seven are self-maintenance, one is migration cleanup. That's the substance behind item 3 above.
- **Two planning-column jobs look obsolete now** — the stash triage and worktree disposition tickets were both overtaken by the cleanup that finished at 13:13. An agent can retire them; it doesn't need you.

## Freshness

**Your working copy is drifting — 14 commits behind, up from 4 an hour ago.** See item 2 above for the one-command fix.

It's on the right branch and nothing is stranded or lost. This is not decay; it's a sync that cannot run while the stray file sits there, so the gap simply widens each hour.

The automatic stale-branch cleanup is healthy — last run 13:40, fourteen minutes ago, tracking 22 work folders and 27 branches.

## What's moving

**A morning of closing things rather than starting them.**

- **The long-running git cleanup finished at 13:13.** The 38-deep pile of shelved work was triaged properly rather than discarded: four sets were genuinely valuable and are now saved to the main copy — including a batch of 21 plan documents from a failed job — with a written record of what was kept and what was let go. The six work folders flagged as needing a decision were settled at the same time. **I checked specifically that nothing was thrown away unexamined**, because the pile vanishing at the same hour could equally have meant loss. It didn't.
- **The bug report was filed at 09:10** after your yes — the last step of a three-day investigation into why your working copy kept detaching itself.
- **The gate fixes landed at 12:28.** One of the checks meant to catch broken code had been passing unconditionally — reporting success without ever looking. It, and three related weak spots, are fixed.

**Unchanged and still worth naming:** fourteen older pull requests remain open and unmerged, oldest from 12 June. Nine of them are orphans of a job that was deleted this morning and will never refresh themselves — worth a single bulk decision, which an agent can make.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
