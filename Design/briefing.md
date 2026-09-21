# Briefing
**Generated:** 2026-09-21 23:55 local (21:55 UTC) · keep-work-flowing-cc

## The one thing

**Play the last two encounters and say whether the integrated experience is acceptable** — [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with).

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish — the raw `{sphere_flavor}` placeholder that was printing in conversation scenes ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)). The deploy probe confirms again this run that the live site is serving that commit.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass charters the hub map — encounters reaching into factions, war, economy and divine actions. Say **"work the map"** in a chat when you're done.

## Also waiting (3)

- **May an unattended lane draft a design doc when the direction is already settled?** — *from tb-orchestrator*. Your 6 August rule says this lane stages design work but never authors it, on the recorded grounds that it ran the cheaper Sonnet model. It runs Opus now, so that reason has expired; the rule may still be right for a reason never written down — that you want a person in the room when the game's shape is decided. The orchestrator confirms this run that the urgency is gone.
- **Were the lane stops deliberate?** — four episodes, all ended; every lane has fired on schedule since Monday 17:41 local, re-verified this run. A marker at `~/.claude/threadbare-pause.json` keeps it off your list next time.
- **Fog or witness** — should an encounter's own consequences be exempt from the familiarity gate, because you were there, or does the stranger's sheet stay honestly blank? Silence leaves it as-is.

## Queue

**Healthy, and still filling.** 4 Ready for Dev, 1 In Dev, 0 parked, nothing blocked or stale.

The executor claimed [THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) (appointment primitive, High) at 23:11 local and is working it now — the first claim in three days. Behind it:

- [THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the) — traits wave 2, slice 2 · Medium · filed this hour
- [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — traits wave 2 · Medium
- [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) — held town as faction position · Medium · promoted to Ready for Dev since the last brief
- [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) — attention follows ambition · Medium

Today's 17:41 grooming report still leads with "the delivery machine is idle, and no automated lane can restart it." That was true when it was written and was overtaken three hours later; no action follows from it.

## Health

All green. Deploy up to date (live at `df1cf66c`; commits since are docs-only, so no rebuild was needed). CI, the three scheduled jobs and the three post-merge workflows are all passing. No PRs waiting to merge. All 9 enabled scheduled tasks within schedule; the worktree reaper ran at 23:40. Tick cost 59 ms/tick steady, 22% *below* the 7-day median of 76.

The lane-silence probe's worst gap this run is the Saturday→Sunday one, declined under your 8 August and 11 September rulings on overnight and weekend quiet. The weekday episodes it also found are the standing ask above.
