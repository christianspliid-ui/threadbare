# Briefing

**Generated:** 2026-07-21 02:54 local (00:54 UTC) · by `keep-work-flowing-cc`

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

**Healthy — seven waiting, nothing in development right now.** Three items cleared since the last brief. The executor is between turns.

- **Nothing is blocked.** All four git/CI tickets in the queue point at a spec that is now readable from anywhere, so any executor can pick one up cold.
- **The two oldest items are properly stale** — a documentation tidy-up and a console warning, both untouched since 2026-07-05, now **sixteen days** old. Both lowest priority. Naming them rather than counting them as real queue depth.

## Freshness

**Your working copy is stuck, and the cause is this task's own leftovers.** Same fault the 01:54 run identified; nothing has cleared it, and it is now measurably worse.

The tree is on `main` and **thirty-two commits behind** — up from 24 an hour ago, and 5 when the jam started at 21:56. The hourly auto-sync has refused to advance it on every run since, logging the same line each time: *uncommitted changes that would be overwritten*. The two files blocking it are **`Design/briefing.md` and `Design/user-actions.md`** — earlier copies of this very briefing, written into your working copy back when this task still did that.

**Nothing you wrote is at risk.** Both files match content already committed to the shared copy; they are superseded briefings, not edits. And the residue is no longer growing — since 01:54 this task writes its output in a scratch workspace and never touches your tree. What remains is a one-time cleanup that nothing will do on its own:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git checkout -- Design/briefing.md Design/user-actions.md
git pull --ff-only
```

Worth knowing: the fix that shipped overnight to stop your tree drifting **is installed and working** — it just doesn't cover this case. It deliberately refuses to touch a file that looks edited, which is right in general and unhelpful here. Extending it to recognise its own stale output is a real gap; it's written up in `user-actions.md` item 5 for a design session, not filed as a ticket, because this task doesn't create work.

Per the standing rule, this task doesn't repair your tree itself — a scheduled job touching your working copy is precisely what caused the mess it would be cleaning up.

## What's moving

**A productive stretch overnight.** Since the last brief:

- **The mortal economy grew a supply chain.** Trade caravans now carry an actual manifest of goods rather than an abstract value, route formation weighs whether a route balances what each end lacks, and two divine verbs landed on top of it — **Bless Harvest** and **Blight**, which push a settlement's stockpiles up or down. Documentation and the rulebook's economy section were updated in the same pass.
- **Both halves of the home-tree containment shipped** — the freshness signal now tells "parked on a different branch" apart from "genuinely behind," and the auto-sync re-attaches the harmless parked case by itself. Four of the six git/CI tickets remain queued.

**One backlog worth naming, not acting on:** fourteen pull requests are still open, oldest from 2026-06-12. Thirteen are documentation; **one is a real feature** — a milestone-beat change that has sat unmerged since 2026-07-05. The cause is understood: the rule that a change must be level with the shared copy before it can go in means each one falls behind the moment anything else lands, and nothing re-freshens them. The fix ("merge it automatically once checks pass") is queued and correctly aimed.

Mildly absurd twist, unchanged: **this briefing lands every hour, and each landing is what pushes the rest further behind.**

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
