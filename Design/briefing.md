# Briefing

**Generated:** 2026-07-21 00:54 local (22:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**The same two questions as last hour. Nothing new arrived.**

> **1. Is the notification rework the next stretch, with war deferred until it's done — or do you want both moving in parallel?**

Three war follow-ons sit written and waiting: deeper battles, sieges that tighten as they drag, and what a war *leaves behind*. Two are high priority. Re-checked this run: all three still carry text saying they're blocked by a ticket that finished on 2026-07-18, and all three describe building things that partly already exist — the war system turned out to be dormant rather than missing.

They sit in the planning column, which the executor never pulls from, so they aren't starving anything. **Answer this when you next think about direction, not because this file asked.** If war is later, they sit safely as-is. If it's both, someone re-scopes them against the real code first, so you're choosing against reality rather than a stale plan.

> **2. The old Cowork jobs still need switching off — and one of them needs a preference from you.**

Full detail is item 1 in [`user-actions.md`](user-actions.md). The short version: the move off Cowork is done on this side, but nothing here can reach into Cowork to disable its old copies, so a few jobs run twice. One of the four is safe to switch off immediately. The other three have no replacement yet, and the question is whether you'd rather **paste their instructions out of Cowork** so they can be copied faithfully, or have **fresh versions written and shown to you on a trial run** before switching on. Either answer unblocks the last migration ticket.

Nothing else needs you.

## Queue

**Healthy — nine waiting, nothing in development right now.** The executor is between turns; its next pickup is in about five minutes.

- **Nothing is blocked.** The economy item still carries text naming a predecessor that finished on 2026-07-05 — cosmetic, and it isn't top of queue.
- **The two oldest items are properly stale** — a documentation tidy-up and a console warning, both untouched since 2026-07-05, now **sixteen days** old. Both lowest priority. Naming them rather than counting them as real queue depth.
- Top of queue is the "stop the machinery from disturbing your working copy" fix — the one high-priority item waiting.

## Freshness

**Your working copy reads dirty. It isn't — same phantom as the last few nights, verified again rather than assumed.**

The tree is on `main`, **twenty commits behind**, and shows three files as changed. I compared all three against the shared copy byte for byte: **they are identical to it.** Nothing was edited here. They read as "changed" only because the pointer marking where you are sits at this morning's commit while the files themselves already hold tonight's content.

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

**One thing landed since the last brief, and it's a small piece of self-repair:** the freshness check that writes this very section can now tell "parked on a differently-named branch" apart from "genuinely behind." That distinction is what made this file report an escalating, alarming-looking behind-count for several days when nothing was actually wrong. Five sibling tickets from the same investigation remain queued.

**One backlog worth naming, not acting on:** fourteen documentation pull requests are still open, the oldest from 2026-06-12. The cause is understood — the rule that a change must be level with the shared copy before it can go in means each one falls behind the moment anything else lands, and nothing re-freshens them. The fix ("merge it automatically once checks pass") is queued and correctly aimed.

Mildly absurd twist, unchanged: **this briefing lands every hour, and each landing is what pushes the rest further behind.**

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
