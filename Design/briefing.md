# Briefing
**Generated:** 2026-09-26 03:56 local (01:56 UTC) · keep-work-flowing-cc

## The one thing

**The dice change stopped on a rule you set in July. Keep the rule, or let it go?** ([THR-1581](https://linear.app/threadbare/issue/THR-1581/forecast-window-s3-re-fit-the-dice-skill-separates-an-even-match-is-a))

The new dice and the new "take on what you can win about half the time" rule are both built ([branch](https://github.com/christianspliid-ui/threadbare/tree/thr-1581-dice-refit)). Nothing is merged. Skill now matters: an even match is a real gamble, and the floor that decided 44% of all rolls is gone.

The catch: mortals now either win cleanly or fail. **"Succeeded, but at a cost" happens in about 1 win in 6.** In July you asked for 3 to 7 wins in 10.

- **Keep the July band.** The builder cannot reach it by changing numbers. The design lane has to work out a new way for a win to cost something under the new dice. The dice wait until then.
- **Accept about 1 in 6.** Wins that come at a cost become rarer and more notable. The change can then be finished and shipped.

Answer with "keep the band" or "1 in 6 is fine". The builder's full numbers are [in the ticket's latest comment](https://linear.app/threadbare/issue/THR-1581/forecast-window-s3-re-fit-the-dice-skill-separates-an-even-match-is-a).

## Also waiting (5)

- **Finish the playthrough: two encounters left, and the screen is clean** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)): [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge), [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan). Then say "work the map".
- **How much history should a new world start with?** ([THR-1591](https://linear.app/threadbare/issue/THR-1591)) Samples: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-42.md), [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-99.md). Recommended: **A, explain the map**. *— from tb-design-lane*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It closes unbuilt work. *— from tb-orchestrator*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Decided for you

- [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1599): culture and a place's sphere show in an encounter as **one extra sentence stating a local fact that bears on the test**. Samples: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-42.md) · [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1599-culture-sphere-layer/Docs/audits/2026-09-25-living-world-data/proto-thr-1599/sample-seed-99.md). *— from tb-design-lane*
- [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581) and [mortals take on challenges they can win about half the time](https://linear.app/threadbare/issue/THR-1582) **ship together as one change**. Plan: [forecast window § Amendment 2026-09-26](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md). *— from tb-design-lane.* The at-cost stop it named has now fired; that is the lead ask above.

Say "veto <title>" to reverse any of these.

## Queue

**Backed up: 19 jobs are ready, and nothing is being built right now.** The pickup lane takes the next one at its next hourly slot.

- **Parked, waiting on you:** [the dice re-fit](https://linear.app/threadbare/issue/THR-1581) (High). Parked for about 30 minutes. Everything is pushed to its branch, so nothing is at risk. Its local worktree is clean.
- **Fight system: nearly ready, not yet a review ask.** Everything is live except [the lair elites' portraits](https://linear.app/threadbare/issue/THR-1554), which are queued.
- **New this hour:** [blessing and curse reactions never fire](https://linear.app/threadbare/issue/THR-1624). It was queued by the orchestrator.
- [Heroes' starting faction membership carries no standing](https://linear.app/threadbare/issue/THR-1620). It still has no priority set.
- Also queued: [place pages never describe culture](https://linear.app/threadbare/issue/THR-1623), [culture names show raw map words](https://linear.app/threadbare/issue/THR-1622), [five small interface faults](https://linear.app/threadbare/issue/THR-1604), [the cast receipt with no subject](https://linear.app/threadbare/issue/THR-1603), [hex lore repeats one sentence](https://linear.app/threadbare/issue/THR-1621), [chronicle headline id](https://linear.app/threadbare/issue/THR-1585), [dead trade route still claimable](https://linear.app/threadbare/issue/THR-1615), [non-casters try to learn spells](https://linear.app/threadbare/issue/THR-1617), [Builder's Legacy complete at start](https://linear.app/threadbare/issue/THR-1618), [route-building aims at home](https://linear.app/threadbare/issue/THR-1619), [waypoint clutter](https://linear.app/threadbare/issue/THR-1616), [wards](https://linear.app/threadbare/issue/THR-1569), [colocation chance](https://linear.app/threadbare/issue/THR-1576), [blood-soaked ground](https://linear.app/threadbare/issue/THR-1528), [seed targets](https://linear.app/threadbare/issue/THR-1565), [the Follow button's wording](https://linear.app/threadbare/issue/THR-1573).

## Health

- **Heavy simulation tests are still red on main.** That is the builder's job, not yours, and this check does not block merges.
- **Lane silence:** the worst recent gap was 25 hours, from Saturday 19 into Sunday 20 September. It fell on a weekend, so your 11 September ruling declines it.
- **Worktree reaper:** last ran at 03:40 local. 5 worktrees are waiting to be sorted, which is routine.
- **Everything else is green.**
  - The live site is serving the latest build (b9803408).
  - All ten scheduled lanes are on time.
  - No pull requests are waiting.
  - Tick cost is 78 ms/tick, 7% above the weekly median.
  - The home tree is on `main` and current.
