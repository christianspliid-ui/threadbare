# Briefing
**Generated:** 2026-10-27 12:57 local (11:57 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every recent silence began when the computer started or woke and the app did not come back by itself. The longest was two days, Wednesday 21 to Friday 23 Oct, with 20 jobs ready. Turning on "open at login" for the Claude app closes these gaps. Only you can change that setting. Say "done" and the next silence check confirms it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (6)

- **Wednesday night to Friday night (21–23 Oct):** "The scheduled lanes went silent for 48.1h (2026-10-21T21:07:01.000Z → 2026-10-23T21:15:17.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours and no pause was recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [The seeded world ends after 41 ticks](https://linear.app/threadbare/issue/THR-2080) — **this is a bug, not Mandate pacing.** The Mandate measures how much the god's spheres have grown since the world began. It took that starting point before the world's first tick, and tick 1 builds about 69 new places (caravan rests, mines, smugglers' dens). Their arrival counted as growth: more than half the Mandate filled on tick 2, and the age ended in "fulfilled" by tick 58–77 with the god doing nothing. The fix takes the starting point once the world has settled. In the measurement, the seeded world then plays on past tick 600. *Veto:* "growth from the world's own new buildings should count toward the Mandate". Open until about 23:43 UTC today. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-27c.md)*
- [A sealed mill lease gives the town's mill to a guild](https://linear.app/threadbare/issue/THR-2077): five calls in [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-27-thr-2077-mill-lease-guild.md#decisions). Each can be vetoed on its own until Tuesday 27 Oct 20:56 UTC. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-27b.md)*
  - **The "fellowship" that wins the mill is the town's own guild.** When the lease is sealed, the craft guild in town holds the mill (failing that the merchants, then the miners or bankers). The temple is left out because the abbey is the landlord. *Veto:* "the abbey should keep the mill" or "the mortal's own faction should hold it".
  - **No guild in town, no holder.** About half of towns have none. There the lease is sealed and the fee paid as today, and nobody holds the mill. *Veto:* "always find someone to hold it".
  - **The mill stands afterwards.** If the town has no mill and has room for a building, one is raised, and the town's harvest feeds more mouths. If there is no room, nothing is raised. *Veto:* "a lease should never raise a building".
  - **A scene never takes a mill from a guild that already holds it.**
  - **A held mill pays its guild a little each pay day**, about a quarter of what a middling town pays in tax. More in a rich town, nothing in a ruined one. *Veto:* "the mill should pay nothing".
- [Attention is never spent](https://linear.app/threadbare/issue/THR-2062/attention-is-never-spent-spendattention-has-no-production-caller-so): five calls inside [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-27-thr-2062-attention-has-a-price.md#decisions). Each can be vetoed on its own until Wednesday 28 Oct 03:01 UTC (the build may start at **15:01 UTC today**). *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-27a.md)*
  - **Attention stays, and it becomes the price of looking in on a mortal who lives on without you.** Answering "the thread pulls" on such a mortal lets you see their chapter, and that costs Attention. *Veto:* "retire Attention".
  - **A mortal who asks you never costs Attention.** The First's chapters already stop the world for free. Until now she still raised pulls that charged for them. *Veto:* "The First's chapters should cost Attention too".
  - **News of a mortal's home is free, and comes once.** When their town runs short of, or has spare, grain, fish, grazing land or fresh water, you hear it once, and answering costs nothing. Today it repeats every few hours and charges each time. These pulls were two thirds of all pulls. *Veto:* "home news should cost Attention".
  - **No chapter is charged for stopping the world.** *Veto:* "every chapter should cost Attention".
  - **The Attention gauge comes back once you have a mortal on *Lives on*.** With only The First it stays hidden, because nothing could make it move. It speaks in words (Busy, Strained), never numbers. *Veto:* "always show the gauge".

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — the twelve screens of the fixed journey](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-10-27/contact-sheet.jpg) — first week, so there is nothing to compare yet. The opening holds up. Opening a page brings two visible faults, and the mid-game cannot be reached because the seeded world ends after 41 ticks.

## Queue

**Healthy: 5 ready, 3 of them buildable now, one job being built.** Since the last brief two fixes from this morning's screen review merged and are live: [the Doom and Omen hints no longer float over the Inspector](https://linear.app/threadbare/issue/THR-2078) ([#2629](https://github.com/christianspliid-ui/threadbare/pull/2629)) and [The First's page no longer shows an empty portrait box](https://linear.app/threadbare/issue/THR-2079) ([#2630](https://github.com/christianspliid-ui/threadbare/pull/2630)). The builder run that started 11:52 UTC holds [the seeded world ending after 41 ticks](https://linear.app/threadbare/issue/THR-2080). Buildable now: [the board reads the place](https://linear.app/threadbare/issue/THR-2071) (its veto window closed at 11:45 UTC), [salt](https://linear.app/threadbare/issue/THR-2069) and [the bounty duel](https://linear.app/threadbare/issue/THR-2072). Then attention has a price ([THR-2062](https://linear.app/threadbare/issue/THR-2062)) at 15:01 UTC and the mill lease ([THR-2077](https://linear.app/threadbare/issue/THR-2077)) at 20:56 UTC.

- **The paperwork-cut question stays off your list.** [THR-1947](https://linear.app/threadbare/issue/THR-1947) has been parked with no owner since 15 Oct (12 days). No pushed branch or local worktree holds work for it. Agents can un-park it.
- Warm playtest round 3 cannot start yet. Its gate waits on two round-2 tickets ([THR-1859](https://linear.app/threadbare/issue/THR-1859), [THR-1860](https://linear.app/threadbare/issue/THR-1860)). The playtest lane owns that gate.

## Health

All green. Last hour's engine-speed alarm was machine load: this hour reads 152 ms/tick, 13% under the 7-day median. The live site is up to date (commits since the last publish touched only docs). Main's CI, the three scheduled background jobs, the scheduled lanes and the worktree reaper (last run 11:40 UTC) are healthy. No PRs are waiting to merge.
