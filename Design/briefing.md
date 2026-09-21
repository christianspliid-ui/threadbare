# Briefing
**Generated:** 2026-09-22 01:56 local (23:56 UTC) · keep-work-flowing-cc

## The one thing

**One Linear setting is quietly marking unbuilt work as finished. Turning it off is a single toggle, and only you can reach it.**

Last night the builder finished the appointment primitive — the piece that lets someone in the world promise to meet another person at a place, then keep or break that promise. It was designed as three parts. When part one closed at 22:12, **Linear closed parts two and three three tenths of a second later.** Nobody built them. Nobody started them. The board simply said they were done.

Those two parts are the half that makes the feature *get used*: the tooling that teaches the encounter-writing agents the new promise exists, and the counter that proves anyone ever used it. That is what you named on 12 September — *"without that connectivity it is a dead feature."* Unnoticed, it would have shipped dead with the board reporting it complete.

The orchestrator caught it twenty minutes later and put both back. **Nothing was lost, and nobody made a mistake** — the builder did everything correctly; it is Linear closing unfinished children when their parent closes. One of the two restored pieces ([THR-1518](https://linear.app/threadbare/issue/THR-1518/appointment-primitive-slice-2-the-authoring-harness-guide-spec-die)) is being built right now, which is exactly what should have happened instead of it being marked done.

**The ask:** in [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general), turn off auto-completing sub-issues when the parent completes.

**Why now rather than later:** the same thing is still loaded. [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (traits wave 2) sits in the queue with three unfinished parts under it — [THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the), [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits), [THR-1522](https://linear.app/threadbare/issue/THR-1522/traits-wave-2-slice-4-the-deferred-location-trait-consumers-merchant) — re-verified on the board this run. The moment the parent closes, all three are marked done the same way, including one a builder may be working on at that moment. A warning is left on the parent, but hand-checking every close is a guard that eventually gets forgotten.

## Also waiting (4)

- **Finish the sitting — two encounters left, screen clean** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)). Everything your four feedback batches produced is shipped and live; the deploy probe confirms again this run. [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan). A pass charters the hub map — say **"work the map"** in a chat.
- **May an unattended lane draft a design doc when the direction is already settled?** — *from tb-orchestrator*. Your 6 August rule rests on that lane running the cheaper Sonnet model; it runs Opus now, so the stated reason has expired. The rule may still be right for a reason never written down. No urgency — the queue refilled without it.
- **Were the lane stops deliberate?** Four episodes, all ended; every lane has fired on schedule since Monday 17:41 local, re-verified this run. A marker at `~/.claude/threadbare-pause.json` keeps it off your list next time.
- **Fog or witness** — should an encounter's own consequences be exempt from the familiarity gate, because you were there, or does the stranger's sheet stay honestly blank? Silence leaves it as-is.

## Queue

**Healthy.** 5 Ready for Dev, 1 In Dev, 0 parked, nothing blocked or stale.

- [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — traits wave 2 · Medium
- [THR-1519](https://linear.app/threadbare/issue/THR-1519/appointment-primitive-slice-3-the-undertaking-grid-a-work-whose-payoff) — appointment slice 3, the undertaking grid · Medium · restored from the silent close
- [THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the) — traits wave 2, slice 2 · Medium
- [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) — held town as faction position · Medium
- [THR-1524](https://linear.app/threadbare/issue/THR-1524/appointment-reachability-the-crossroads-plants-nothing-on-the-live) — appointment reachability · Medium · deferral from slice 1

In Dev: [THR-1518](https://linear.app/threadbare/issue/THR-1518/appointment-primitive-slice-2-the-authoring-harness-guide-spec-die) (appointment slice 2, the authoring harness) — claimed since the last brief, and the piece the toggle above nearly erased. [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) (attention follows ambition) merged in the meantime.

Yesterday morning's grooming report still opens with *"the delivery machine is idle"* — true when written, overtaken the same evening; no action follows from it.

## Health

**All green.**

The live site is serving the newest commit (`80f6e83e`); CI, the three scheduled jobs and every post-merge workflow are passing — including **Heavy simulation tests**, which was red on `main` at the last brief and has since gone green on its own. No PRs waiting to merge; all 9 scheduled tasks within schedule; the worktree reaper ran at 01:40. Engine tick cost is 69 ms/tick, 9% *below* the seven-day median.

The lane-silence probe's worst gap this run is the Saturday→Sunday one, declined under your 8 August and 11 September rulings on overnight and weekend quiet. The weekday episodes it also found are the standing ask above.
