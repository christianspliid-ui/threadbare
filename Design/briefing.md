# Briefing

**Generated:** 2026-07-27 08:54 local (2026-07-27 06:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Nothing needs you right now — and the one question that has been sitting here for nine hours is now closed, by something you said yourself.**

The standing question was whether the ceremonial reveal screens — the Civ-style "you unlocked this" moment you asked for — should jump ahead of the crew's own found work. This morning a design session recorded a priority from you, dated today: *"the new encounter experience is still first priority."* That names something else as first, which settles the thing the question was holding open. The reveal screens stay in line, and the shelf now shows exactly that order.

**Worth checking my work, because this is an inference rather than a reply.** That sentence is a quote written into a work ticket by a design session — not something you sent me directly. If it doesn't match what you meant, and the reveal screens should jump the queue after all, say so and they move. Otherwise the question is retired and won't be put to you again.

Nothing else arrived for you this hour.

## Queue

**23 jobs ready — two urgent, seven middling, fourteen minor. One job sitting on the bench.**

Up three from last hour, and every part of that is healthy: one job shipped, two small finds were written down rather than swallowed, and the two urgent jobs are new — the design work for the new encounter experience finished this morning and put them on the shelf. Nothing has gone stale; the oldest job has been waiting under three days.

**Both urgent jobs are blocked, and it is the one thing on this page worth watching.** They are the two halves of the new encounter experience — the work you just named first priority — and neither can be picked up until their plan document is published. That document has been queued to publish since 06:30 and keeps slipping behind newer work landing ahead of it. **This exact stall has cleared itself within the hour three times out of three**, so the honest reading today is "wait one refresh", not "something is broken". But it is the top of your stated priority sitting idle, so: **if it is still stuck at the next brief, that is a real problem and I will say so in those words.**

The job on the bench is the guild-routing one from last night. Its own work merged hours ago and its follow-on has since finished too, so there is genuinely nothing left inside it — it wants a one-line tidy-up from a crew member with write access. Last hour I predicted it might make the next crew think the bench was occupied; it didn't, and it hasn't again.

## Freshness

**Home tree: on the right branch, nothing stranded, four commits behind the server — which is a job merging two minutes ago, not lag.** The same two small leftovers as the last eighteen hours: a permissions edit to the tool config, and Friday's retro write-up. Both are the crew's to land; neither blocks anything.

**Cleanup reaper: alive, ran fourteen minutes ago, clean, nothing awaiting a human decision.**

**The live site is serving the newest change** — last hour's "still publishing" resolved on its own, exactly as the twenty-minute grace window is meant to let it.

**Discord: nothing new in the channel this hour.** Genuinely empty rather than unread.

## What's moving

**Guild membership stopped handing every job to the same guild.**

Six guilds share a type, and the code that assigns people to guilds took the first match every single time — so one guild always won and the Builders' Fellowship was seeded with **zero members in every run**, its ten stories unreachable by construction. That is now a scored choice: the routing weighs how well a role fits a guild against how loaded that guild already is, built out of two tables that already existed rather than a new one.

Two things about the repair are worth naming. It was **composed from existing pieces instead of green-fielding a new scoring system** — the recurring temptation this project has a scar from. And the test that proves it asserts over the *mix* of roles across guilds, not a floor per guild, because a per-guild floor would have quietly re-encoded the same first-match assumption it exists to catch.

**Two finds filed rather than absorbed.** A guild-quest panel turns out to be hardcoded to one guild, so eleven of twelve factions can never surface quests through it — found by discharging this very ticket's instruction to go check whether any screen assumed a single guild. One does. Separately, a piece of the group code numbers things from a counter that survives between runs, so two identical worlds serialise differently; a determinism defect where only the label diverged, not the story.

**And the design work for the new encounter experience finished** — 06:15 to 06:30, fifteen minutes from opening to handing over two ready jobs.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
