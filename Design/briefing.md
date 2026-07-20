# Briefing

**Generated:** 2026-07-20 11:05 local (09:05 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Still one item, and it's the same one. Day four.**

Three war follow-ons sit written and waiting: deeper battles, sieges that tighten as they drag, and what a war *leaves behind*. Their blocker cleared on Saturday. Nobody has moved them, because the choice is yours:

> **Is the notification rework the next stretch, with war deferred until it's done — or do you want both moving in parallel?**

Two of the three are high priority. All three still carry text saying they're blocked by work that finished two days ago, and all three describe building things that turned out to already exist — the war system was dormant, not missing.

Either answer ends it. Say "war is later" and they sit safely as they are. Say "both" and someone re-scopes them against the actual code first, so you're choosing against reality rather than a stale plan.

Nothing else needs you.

## Queue

**Healthy — twelve waiting, one in development.** The queue grew by five overnight: the git/CI investigation turned its findings into six concrete tickets.

Being worked on right now: the final step of moving off Cowork.

**One thing worth flagging, and it isn't yours to fix.** Six of the twelve waiting tickets — including both top-priority ones — open with "read the plan doc first." **That plan doc exists only on this machine and has never been saved to the shared repository.** An agent that picks up one of those tickets from a fresh copy will not find it. The hourly doc-committing task is supposed to catch exactly this and hasn't yet. If it misses again next hour, that's a real fault worth naming rather than a hiccup.

Two smaller notes:

- **Nothing is blocked.** Last hour's economy item confirmed clear — its predecessor shipped on 2026-07-05.
- **The two oldest items are still properly stale** — a documentation tidy-up and a console warning, both sitting since 2026-07-05, now **fifteen days** old. Neither matters; naming them rather than counting them as queue depth.

## Freshness

**Fine, but it happened again.** Your working copy was moved off `main` onto a scratch branch at the top of this hour — the fourth time in four days.

**Nothing is behind, and nothing is at risk.** The branch it landed on is byte-for-byte identical to the shared `main`, so unlike the earlier events there is no drift to repair and no alarming number to report. This is exactly the fault the investigation ticketed yesterday, now caught on the hour it happened instead of days later. The containment fix is queued and high priority.

The only residue is 16 untracked design drafts in the tree. Not urgent, not yours; a design session can do the keep-or-delete pass.

## What's moving

- **The migration off Cowork is on its last step**, in development now. When it lands, Cowork leaves the loop and this file becomes the only place work surfaces to you.
- **The git/CI friction investigation converted into work.** Six tickets, two high priority: stop the working copy being moved off `main`, and stop the freshness check crying wolf about it. One of the six is a bug report to send upstream — the fault appears to be in the Claude Code app itself, not in anything we wrote.
- **Housekeeping is drifting.** 28 working copies and 38 stashed change-sets have accumulated on this machine; a cleanup script that should be pruning them has been failing silently. Ticketed, medium priority. Nothing at risk — it's clutter, not damage.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
