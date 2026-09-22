# Briefing
**Generated:** 2026-09-22 03:00 local (01:00 UTC) · keep-work-flowing-cc

## The one thing

**One Linear setting marks unbuilt work as finished. It is a single toggle, and only you can reach it.**

Same ask as last hour, and the trap is still armed — I re-checked the board this run.

When a parent item closes, Linear closes its unfinished children too. Last night that closed two of the three parts of the appointment primitive — the piece that lets someone in the world promise to meet another person at a place, then keep or break that promise — **three tenths of a second after part one closed.** Nobody built them. The orchestrator caught it and put them back, and in the hours since, both have shipped properly: part two ([THR-1518](https://linear.app/threadbare/issue/THR-1518/appointment-primitive-slice-2-the-authoring-harness-guide-spec-die)) and the reachability follow-up ([THR-1524](https://linear.app/threadbare/issue/THR-1524/appointment-reachability-the-crossroads-plants-nothing-on-the-live)) both merged. Nothing was lost, and nobody made a mistake — the builder did everything right.

**The ask:** in [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general), turn off auto-completing sub-issues when the parent completes.

**Why now rather than later:** the next one is loaded. [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (traits wave 2) sits at the top of the queue with three unfinished parts under it, re-verified this run — [THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the) (queued and claimable right now), [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits), [THR-1522](https://linear.app/threadbare/issue/THR-1522/traits-wave-2-slice-4-the-deferred-location-trait-consumers-merchant). The moment the parent closes, all three are marked done — including one a builder may be mid-way through. A hand-written warning guards it today; the toggle guards it permanently.

## Also waiting (4)

- **Finish the sitting — two encounters left, screen clean** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)). Everything your four feedback batches produced is shipped and live; the deploy probe confirms again this run. [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan). A pass charters the hub map — say **"work the map"** in a chat.
- **May an unattended lane draft a design doc when the direction is already settled?** — *from tb-orchestrator*. Your 6 August rule rests on that lane running the cheaper Sonnet model; it runs Opus now, so the stated reason has expired. The rule may still be right for a reason never written down. No urgency — the queue refilled without it.
- **Were the lane stops deliberate?** Four episodes, all ended; every lane has fired on schedule since Monday 17:41 local, re-verified this run. A marker at `~/.claude/threadbare-pause.json` keeps it off your list next time.
- **Fog or witness** — should an encounter's own consequences be exempt from the familiarity gate, because you were there, or does the stranger's sheet stay honestly blank? Silence leaves it as-is.

## Queue

**Healthy.** 4 Ready for Dev, 0 In Dev, 0 parked, nothing blocked or stale.

- [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — traits wave 2, location traits · Medium
- [THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the) — traits wave 2, slice 2 · Medium
- [THR-1519](https://linear.app/threadbare/issue/THR-1519/appointment-primitive-slice-3-the-undertaking-grid-a-work-whose-payoff) — appointment slice 3, the undertaking grid · Medium
- [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) — held town as faction position · Medium

Two items shipped in the past hour — [THR-1518](https://linear.app/threadbare/issue/THR-1518/appointment-primitive-slice-2-the-authoring-harness-guide-spec-die) (the appointment authoring harness) and [THR-1524](https://linear.app/threadbare/issue/THR-1524/appointment-reachability-the-crossroads-plants-nothing-on-the-live) (appointment reachability) — which is why In Dev is empty rather than stalled. The pickup lane fires again at about 03:10 local and will claim the top item; nothing needs pushing.

THR-790 still carries a *blocked by* link to [THR-786](https://linear.app/threadbare/issue/THR-786/traits-trigger-unification-one-traitpredicate-across-all-six-read), which finished in July. The link is stale, not a block — checked, not guessed.

Yesterday morning's grooming report still opens with *"the delivery machine is idle"* — true when written, overtaken the same evening; no action follows from it.

## Health

**One thing is not green, and it is ours, not yours.**

The slow post-merge test job — **Heavy simulation tests** — is red on `main` again, since roughly 02:00 local, on the commit that landed the appointment reachability fix. I reported it green in the last brief; that was true then and is no longer. It has now failed three of its last five runs on `main`, so this is a flapping job rather than one clean break, and it belongs in the impediment log for the weekly retro to weigh. It does not block merges — it is deliberately not a required check — and no executor session has claimed the follow-up yet.

Everything else is green. The live site is serving the newest commit (`79dc8963`); CI, all three scheduled background jobs and the other post-merge workflows pass. No PRs waiting to merge; all 9 scheduled tasks within schedule; the worktree reaper ran at 02:40. Engine tick cost is 63 ms/tick, **16% below** the seven-day median. No new Discord messages since the last brief.

The lane-silence probe's worst gap this run is the Saturday→Sunday one, declined under your 8 August and 11 September rulings on overnight and weekend quiet. The weekday episodes it also found are the standing ask above.
