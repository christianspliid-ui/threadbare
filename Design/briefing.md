# Briefing
**Generated:** 2026-09-22 04:00 local (02:00 UTC) · keep-work-flowing-cc

## The one thing

**One Linear setting marks unbuilt work as finished — and as of this hour the next victim is on the workbench.**

Same ask as the last two hours. What changed: the builder has now *started* the work that springs the trap.

When a parent item closes, Linear closes its unfinished children too. Last night that closed two of the three parts of the appointment primitive — the piece that lets someone in the world promise to meet another person at a place, then keep or break that promise — **three tenths of a second after part one closed.** Nobody had built them. The orchestrator caught it and put them back, and both have since shipped properly. Nothing was lost, and the builder did nothing wrong.

**The ask:** in [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general), turn off auto-completing sub-issues when the parent completes.

**Why this hour rather than the next:** at 03:11 local the builder claimed [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (traits wave 2) and is working it now. It has three unfinished parts underneath — [THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the) (queued, claimable), [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) and [THR-1522](https://linear.app/threadbare/issue/THR-1522/traits-wave-2-slice-4-the-deferred-location-trait-consumers-merchant) — all three verified unstarted this run. The moment THR-790 closes, all three are marked done. A hand-written warning on the parent guards it today; the toggle guards it permanently.

## Also waiting (4)

- **Finish the sitting — two encounters left, screen clean** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)). Everything your four feedback batches produced is shipped and live; the deploy probe confirms again this run. [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan). A pass charters the hub map — say **"work the map"** in a chat.
- **May an unattended lane draft a design doc when the direction is already settled?** — *from tb-orchestrator*. Your 6 August rule rests on that lane running the cheaper Sonnet model; it runs Opus now, so the stated reason has expired. The rule may still be right for a reason never written down. No urgency — the queue refilled without it.
- **Were the lane stops deliberate?** Four episodes, all ended; every lane has fired on schedule since Monday 17:41 local, re-verified this run. A marker at `~/.claude/threadbare-pause.json` keeps it off your list next time.
- **Fog or witness** — should an encounter's own consequences be exempt from the familiarity gate, because you were there, or does the stranger's sheet stay honestly blank? Silence leaves it as-is.

## Queue

**Healthy.** 3 Ready for Dev, 1 In Dev, 0 parked, nothing blocked or stale.

- [THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the) — traits wave 2, slice 2 · Medium
- [THR-1519](https://linear.app/threadbare/issue/THR-1519/appointment-primitive-slice-3-the-undertaking-grid-a-work-whose-payoff) — appointment slice 3, the undertaking grid · Medium
- [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) — held town as faction position · Medium

In Dev: [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools), claimed at 03:11 local and being built now. The queue shrank from four because a builder took the top item, not because anything stalled.

THR-790's *blocked by* link to [THR-786](https://linear.app/threadbare/issue/THR-786/traits-trigger-unification-one-traitpredicate-across-all-six-read) is stale, not a block — THR-786 finished in July, re-checked this run.

## Health

**One thing is not green, and it is ours, not yours.**

The slow post-merge test job — **Heavy simulation tests** — is still red on `main`, unchanged since about 02:00 local, on the commit that landed the appointment reachability fix. It has failed three of its last five runs there, so this is a flapping job rather than one clean break; it belongs in the impediment log for the weekly retro to weigh. It does not block merges — it is deliberately not a required check — and no executor session has claimed the follow-up yet.

Everything else is green. The live site is serving the newest commit (`79dc8963`); CI, all three scheduled background jobs and the other post-merge workflows pass. No PRs waiting to merge; all 9 scheduled tasks within schedule; the worktree reaper ran at 03:40. Engine tick cost is 65 ms/tick, **13% below** the seven-day median. No new Discord messages since the last brief.

The lane-silence probe's worst gap this run is again the Saturday→Sunday one, declined under your 8 August and 11 September rulings on overnight and weekend quiet. The weekday episodes it also found are the standing ask above.

Yesterday morning's grooming report still opens with *"the delivery machine is idle"* — true when written, overtaken the same evening. No action follows from it.
