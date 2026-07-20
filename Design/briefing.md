# Briefing

**Generated:** 2026-07-21 01:54 local (23:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**The same two questions. Both re-checked against the live board this hour, not copied forward.**

> **1. Is the notification rework the next stretch, with war deferred until it's done — or do you want both moving in parallel?**

Three war follow-ons sit written and waiting: **deeper battles**, **sieges that tighten as they drag**, and **what a war leaves behind**. Two of the three are high priority.

Re-verified by reading each one this run: all three still carry text saying they're blocked by the war-activation ticket — and that ticket **finished on 2026-07-18**. The blocker line is stale on all three. They also describe building things that partly already exist; the war system turned out to be dormant rather than missing.

They sit in the planning column, which the executor never pulls from, so **they aren't starving anything.** Answer this when you next think about direction, not because this file asked. If war is later, they sit safely as-is. If it's both, someone re-scopes them against the real code first — so you're choosing against what's actually built rather than a stale plan.

> **2. The old Cowork jobs still need switching off — and one of them needs a preference from you.**

Unchanged; full detail is item 1 in [`user-actions.md`](user-actions.md). Short version: the move off Cowork is done on this side, but nothing here can reach into Cowork to disable its old copies, so a few jobs run twice. One of the four is safe to switch off immediately. The other three have no replacement yet, and the question is whether you'd rather **paste their instructions out of Cowork** so they can be copied faithfully, or have **fresh versions written and shown to you on a trial run** before switching on. Either answer unblocks the last migration ticket.

Nothing else needs you. The working-copy item below reads like a chore, but any session can do it — it isn't yours.

## Queue

**Healthy — eight waiting, nothing in development right now.** The executor is between turns; next pickup is in about five minutes.

- **Six of the eight are the git/CI cleanup set** written yesterday morning. That concentration is why the count fell from ten without anything going wrong.
- **One is blocked, and it isn't urgent.** The economy item still names a predecessor that finished on 2026-07-05. Cosmetic staleness, mid-priority, not top of queue.
- **The two oldest are properly stale** — a documentation tidy-up and a console warning, both untouched since 2026-07-05, now **sixteen days** old. Both lowest priority. Naming them rather than counting them as real depth.

## Freshness

**Your working copy is 24 commits behind, and this hour we found exactly why. It has been the same cause every hour since 21:56 yesterday.**

The automatic sync has been refusing to run, hourly, with the same message: *"you have uncommitted changes that would be overwritten."* The files it is protecting are **`Design/briefing.md` and `Design/user-actions.md`** — the two files this very briefing task writes.

I checked whether anything of yours is inside them. **Nothing is.** Both are byte-for-byte identical to versions already merged and safely in history — they are simply *older briefings*, superseded by newer ones that already landed. The sync has been dutifully guarding a stale copy of itself.

**So this task was quietly blocking its own repair.** That should now be self-limiting: last night's "leave the home tree alone" change landed at 01:11, and from this run onward the briefing is written in a scratch copy and never in your working tree. This is leftover residue, not an ongoing leak.

**To clear it — safe, loses nothing, and not a Christian-only job:**

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git checkout -- Design/briefing.md Design/user-actions.md
git pull --ff-only
```

Both files come straight back from the pull, identical. The remaining residue is 15 untracked design drafts, owned by a queued ticket rather than sitting unassigned.

**One gap worth a ticket:** last night's fix taught the sync to heal itself when the tree gets *parked on the wrong branch*, but not when it's *held up by leftover files* — which is the case that actually bit. Worth extending the same fix to cover it. Flagged here rather than filed, since this task doesn't create work.

## What's moving

**A productive night — the git/CI work is landing on itself.** Since the last brief:

- **The home tree became an "inert, self-healing mirror"** — the biggest of the six git tickets. It stops scheduled jobs from touching your working copy at all, and teaches the sync to recover on its own from the parked-branch fault that recurred four mornings running.
- **The freshness alarm stopped lying.** The "N commits behind and climbing" number that ran to 79 last week was measuring a frozen snapshot against a moving target. It now distinguishes *parked* from *actually behind*.

Two of the six git tickets done within a day of being written, both by the executor unaided.

**One backlog worth naming, not acting on:** fourteen documentation pull requests remain open, oldest from 2026-06-12. The cause is understood and unchanged — the rule that a change must be level with the shared copy before it can go in means each one falls behind the moment anything else lands, and nothing re-freshens them. The fix ("merge it automatically once checks pass") is queued and correctly aimed.

Mildly absurd twist, unchanged: **this briefing lands every hour, and each landing is what pushes the rest further behind.**

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
