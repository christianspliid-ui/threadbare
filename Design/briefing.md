# Briefing

**Generated:** 2026-07-20 22:54 local (20:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Two things, both carried, both still keeping.**

> **1. Is the notification rework the next stretch, with war deferred until it's done — or do you want both moving in parallel?**

Three war follow-ons sit written and waiting: deeper battles, sieges that tighten as they drag, and what a war *leaves behind*. Two are high priority. Re-verified again this run: their stated blocker genuinely closed on Saturday, all three still carry text claiming they're blocked, and they describe building things that partly already exist — the war system turned out to be dormant rather than missing.

They sit in the planning column, which the executor never pulls from, so they aren't starving anything. **Answer this when you next think about direction, not because this file asked.** If war is later, they sit safely as-is. If it's both, someone re-scopes them against the real code first, so you're choosing against reality rather than a stale plan.

> **2. The old Cowork jobs still need switching off — and one of them needs a preference from you.**

Full detail is item 2 in [`user-actions.md`](user-actions.md). The short version: the move off Cowork is done on this side, but nothing here can reach into Cowork to disable its old copies, so a few jobs run twice. One of the four is safe to switch off immediately. The other three have no replacement yet, and the question is whether you'd rather **paste their instructions out of Cowork** so they can be copied faithfully, or have **fresh versions written and shown to you on a trial run** before switching on. Either answer unblocks the last migration ticket.

Nothing else needs you.

## Queue

**Healthy — eleven waiting, nothing in development right now.** The executor is between turns; its next pickup is in about five minutes.

- **Nothing is blocked.** Re-verified: the economy item's stated predecessor shipped on 2026-07-05.
- **The two oldest items are properly stale** — a documentation tidy-up and a console warning, both untouched since 2026-07-05, now **fifteen days** old. Both lowest priority. Naming them rather than counting them as real queue depth.
- **One high-priority item looks untouched but isn't.** The "pause the world when a card or dilemma is open" fix is written and its checks pass — it just collided with work that landed after it and needs re-basing before it can go in. Agent-side chore, not a decision for you.

## Freshness

**Slightly stale, harmless, and safe to fix.** Your working copy is on `main` but sits **nine commits behind** the shared version, with two files showing as modified — both are simply older copies of files that already landed upstream. Nothing you wrote is at risk.

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git checkout -- Design/user-actions.md
git pull
```

No repeat of the parking problem — this is ordinary lag, not the recurring fault. The other residue is 15 untracked design drafts, now covered by a queued ticket rather than sitting unowned.

## What's moving

**The load-bearing document landed.** Last night's brief flagged that six queued tickets — two of them high priority — pointed at a git/CI spec that existed only on this machine. It merged tonight. Those six tickets can now be picked up by anyone, from anywhere. That closes the one genuinely blocking-adjacent item on the standing list.

**Shipped since the last brief:** per-agent notifications now only fire for threads you're actually attending, and the scheduled-job registry finished its cutover to the Claude Code side.

**One backlog worth naming, not acting on:** thirteen documentation pull requests are open and unmerged, the oldest from 2026-07-03. The cause is understood — the rule that a change must be level with the shared copy before it can go in means each one falls behind the moment anything else lands, and nothing re-freshens them. The fix ("merge it automatically once checks pass") is already queued and correctly aimed. Mildly absurd twist, unchanged: **this briefing lands every hour, and each landing is what pushes the rest further behind.**

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
