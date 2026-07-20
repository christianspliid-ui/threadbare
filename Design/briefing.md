# Briefing

**Generated:** 2026-07-20 23:54 local (21:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Two things, both carried, both still keeping.** Nothing new arrived this hour.

> **1. Is the notification rework the next stretch, with war deferred until it's done — or do you want both moving in parallel?**

Three war follow-ons sit written and waiting: deeper battles, sieges that tighten as they drag, and what a war *leaves behind*. Two are high priority. Re-verified again this run: their stated blocker closed on Saturday, all three still carry text claiming they're blocked, and they describe building things that partly already exist — the war system turned out to be dormant rather than missing.

They sit in the planning column, which the executor never pulls from, so they aren't starving anything. **Answer this when you next think about direction, not because this file asked.** If war is later, they sit safely as-is. If it's both, someone re-scopes them against the real code first, so you're choosing against reality rather than a stale plan.

> **2. The old Cowork jobs still need switching off — and one of them needs a preference from you.**

Full detail is item 1 in [`user-actions.md`](user-actions.md). The short version: the move off Cowork is done on this side, but nothing here can reach into Cowork to disable its old copies, so a few jobs run twice. One of the four is safe to switch off immediately. The other three have no replacement yet, and the question is whether you'd rather **paste their instructions out of Cowork** so they can be copied faithfully, or have **fresh versions written and shown to you on a trial run** before switching on. Either answer unblocks the last migration ticket.

Nothing else needs you.

## Queue

**Healthy — ten waiting, nothing in development right now.** The executor is between turns; its next pickup is in about five minutes.

- **Nothing is blocked.** Re-verified this run: the economy item's stated predecessor finished on 2026-07-05. Its description still claims otherwise — cosmetic, and it isn't top of queue.
- **The two oldest items are properly stale** — a documentation tidy-up and a console warning, both untouched since 2026-07-05, now **fifteen days** old. Both lowest priority. Naming them rather than counting them as real queue depth.
- **Last night's "high-priority item that looks untouched" is resolved.** The "pause the world when a card or dilemma is open" fix needed re-basing before it could go in; that happened and it landed at 23:20. No longer a queue concern.

## Freshness

**Your working copy looks dirty. It isn't — and this is worth one paragraph, because it's the fault we've been chasing all week.**

The tree is on `main`, **sixteen commits behind**, and shows three files as changed. I compared all three against the shared copy byte for byte: **they are identical to it.** Nothing was edited here. They read as "changed" only because the pointer marking where you are sits at this morning's commit while the files themselves already hold tonight's content. That's the phantom-staleness pattern — the same one that, on 2026-07-18, presented as 68 "staged" files that would have reverted shipped work if anyone had committed them.

**Nothing you wrote is at risk, and nothing is decaying.** To bring it level:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git reset
git checkout -- Design/briefing.md Design/user-actions.md
rm Docs/plans/2026-07-20-git-cicd-clean-delivery.md
git pull --ff-only
```

All three files are already on the shared copy, so discarding the local ones loses nothing — the pull brings back the same bytes. The remaining residue is 15 untracked design drafts, owned by a queued ticket rather than sitting unassigned.

Per the standing rule, this task doesn't repair the tree itself — a scheduled job touching your working copy is precisely what caused the mess it would be cleaning up.

## What's moving

**A good night.** Four things landed since the last brief:

- **Per-agent notifications now respect threading** — you only get pinged for threads you're actually attending.
- **The "pause the world" fix landed** — the simulation now holds whenever a blocking card or dilemma is open, centrally, rather than each screen remembering to do it.
- **The scheduled-job registry finished its cutover** to the Claude Code side.
- **Six git/CI tickets became pickable** — their shared spec merged earlier tonight, so an executor can read it from anywhere rather than only from this machine.

**One backlog worth naming, not acting on:** thirteen documentation pull requests are still open, the oldest from 2026-06-12. The cause is understood — the rule that a change must be level with the shared copy before it can go in means each one falls behind the moment anything else lands, and nothing re-freshens them. Four *did* merge tonight, so the path works; it just needs a nudge each time. The fix ("merge it automatically once checks pass") is queued and correctly aimed, and the conflict-rot pattern got written into the impediment log tonight so it stops being rediscovered.

Mildly absurd twist, unchanged: **this briefing lands every hour, and each landing is what pushes the rest further behind.**

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
