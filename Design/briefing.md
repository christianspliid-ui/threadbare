# Briefing
**Generated:** 2026-10-27 19:56 local (18:56 UTC) · keep-work-flowing-cc

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

- [The seeded world ends after 41 ticks](https://linear.app/threadbare/issue/THR-2080) — **this is a bug, not Mandate pacing.** The Mandate measures how much the god's spheres have grown since the world began. It took that starting point before the world's first tick, and tick 1 builds about 69 new places (caravan rests, mines, smugglers' dens). Their arrival counted as growth: more than half the Mandate filled on tick 2, and the age ended in "fulfilled" by tick 58–77 with the god doing nothing. The fix takes the starting point once the world has settled. In the measurement, the seeded world then plays on past tick 600. *Veto:* "growth from the world's own new buildings should count toward the Mandate". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-27c.md)*
- [A sealed mill lease gives the town's mill to a guild](https://linear.app/threadbare/issue/THR-2077): five calls in [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-27-thr-2077-mill-lease-guild.md#decisions). Each can be vetoed on its own until Tuesday 27 Oct 20:56 UTC. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-27b.md)*
  - **The "fellowship" that wins the mill is the town's own guild.** When the lease is sealed, the craft guild in town holds the mill (failing that the merchants, then the miners or bankers). The temple is left out because the abbey is the landlord. *Veto:* "the abbey should keep the mill" or "the mortal's own faction should hold it".
  - **No guild in town, no holder.** About half of towns have none. There the lease is sealed and the fee paid as today, and nobody holds the mill. *Veto:* "always find someone to hold it".
  - **The mill stands afterwards.** If the town has no mill and has room for a building, one is raised, and the town's harvest feeds more mouths. If there is no room, nothing is raised. *Veto:* "a lease should never raise a building".
  - **A scene never takes a mill from a guild that already holds it.**
  - **A held mill pays its guild a little each pay day**, about a quarter of what a middling town pays in tax. More in a rich town, nothing in a ruined one. *Veto:* "the mill should pay nothing".

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — the twelve screens of the fixed journey](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-10-27/contact-sheet.jpg) — first week, so there is nothing to compare yet. The opening holds up. Opening a page brings two visible faults, and the mid-game cannot be reached because the seeded world ends after 41 ticks.

## Queue

**Healthy: 4 ready, 1 being built.** The builder has claimed salt ([THR-2069](https://linear.app/threadbare/issue/THR-2069/plan-doc-salt-the-good-the-smugglers-carry-the-monopoly-scene-prices)) and is working on it now. Next in line: the town economy reaching the live board ([THR-2071](https://linear.app/threadbare/issue/THR-2071)), the bounty duel ([THR-2072](https://linear.app/threadbare/issue/THR-2072)), Attention's price ([THR-2062](https://linear.app/threadbare/issue/THR-2062)) and the mill lease ([THR-2077](https://linear.app/threadbare/issue/THR-2077), after its veto window closes at 20:56 UTC).

- **The paperwork-cut question stays off your list.** [THR-1947](https://linear.app/threadbare/issue/THR-1947) has been parked with no owner since 15 Oct (12 days). Agents can un-park it.
- Warm playtest round 3 cannot start yet. Its gate waits on two round-2 tickets ([THR-1859](https://linear.app/threadbare/issue/THR-1859), [THR-1860](https://linear.app/threadbare/issue/THR-1860)). The playtest lane owns that gate.

## Health

All green. The heavy simulation tests pass on main again ([the run on the fix's merge](https://github.com/christianspliid-ui/threadbare/actions/runs/40551208332) succeeded), the live site serves the latest main (5faaf4c3), the scheduled lanes and the worktree reaper (last run 18:40 UTC) are healthy, and the engine runs at 181 ms/tick, 4% over the 7-day median.
