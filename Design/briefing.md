# Briefing
**Generated:** 2026-09-22 05:00 local (03:00 UTC) · keep-work-flowing-cc

## The one thing

**The trap the last brief pointed at sprang an hour later. Three more pieces of unbuilt work were marked finished — and it was the second time in four hours.**

The ask has not changed and is still one toggle: in [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general), turn off auto-completing sub-issues when the parent completes.

What changed is that the prediction came true. At 04:00 the brief said the builder had just started [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) and that *the moment it closes, all three parts underneath are marked done*. At 04:15 THR-790 closed, and within a quarter of a second [THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the), [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) and [THR-1522](https://linear.app/threadbare/issue/THR-1522/traits-wave-2-slice-4-the-deferred-location-trait-consumers-merchant) were closed with nobody having built any of them.

**Nothing is lost.** The orchestrator checked each one four ways, confirmed none had ever been started, and put all three back within sixteen minutes. THR-1520 is queued and claimable again — this run's board scan sees it there.

**Why it is worth your minute now rather than tomorrow.** Five pieces of authored work have been erased in four hours across two incidents, and both were caught only because an hourly sweep happened to look. The guard we had — a hand-written warning on the parent ticket — was in place last night and did not stop it, because a note cannot stop a setting. This is the only item on your list that no agent can do for you.

## Also waiting (4)

- **Finish the sitting — two encounters left, screen clean** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)). Everything your four feedback batches produced is shipped and live; the deploy probe confirms again this run. [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan). A pass charters the hub map — say **"work the map"** in a chat.
- **May an unattended lane draft a design doc when the direction is already settled?** — *from tb-orchestrator*. Your 6 August rule rests on that lane running the cheaper Sonnet model; it runs Opus now, so the stated reason has expired. This is the hour it starts to bite: three tickets arrived overnight and all three are **questions, not work** — which mortals your attention should follow, whether a scene should be offered to people who will refuse it, whether a follow-up scene may appear on its own. The build queue is fine, but it is being fed by repairs rather than by design. Either answer unblocks it — a yes lets the lanes write, a no means the design sessions are yours to run.
- **Were the lane stops deliberate?** Four episodes, all ended; every lane has fired on schedule since Monday 17:41 local, re-verified this run. A marker at `~/.claude/threadbare-pause.json` keeps it off your list next time.
- **Fog or witness** — should an encounter's own consequences be exempt from the familiarity gate, because you were there, or does the stranger's sheet stay honestly blank? Silence leaves it as-is.

## Queue

**Healthy.** 3 Ready for Dev, 1 In Dev, 0 parked, nothing blocked or stale.

- [THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the) — traits wave 2, slice 2 · Medium · restored this hour after the auto-close above
- [THR-1519](https://linear.app/threadbare/issue/THR-1519/appointment-primitive-slice-3-the-undertaking-grid-a-work-whose-payoff) — appointment slice 3, the undertaking grid · Medium
- [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) — held town as faction position · Medium

In Dev: [THR-1527](https://linear.app/threadbare/issue/THR-1527/the-appointment-planter-writes-an-owes-favor-edge-without-its-two) — a repair to the promise edge that the slow test job caught. Claimed, PR open, see Health.

One thing worth knowing rather than deciding: of the three slices restored, **THR-1522 may no longer be worth building as written.** It would add three new consumers of the "places have traits" system, but last night's measurement shows the pool those consumers feed does not move when a place's traits change — the limit is *which* encounters are eligible, not how strongly they are weighted. The orchestrator recorded that on the ticket instead of acting on it, and a design session should start from the measurement rather than the original plan. That is ours to sort out, not yours.

## Health

**Two things are not green, and both are ours.**

The open repair PR [#1980](https://github.com/christianspliid-ui/threadbare/pull/1980) has a merge conflict and is also sitting with **no checks scheduled at all** — GitHub has not started a single one in 36 minutes. Both clear with the same move: a session resolves the conflict against `main` and pushes, which restarts the checks. Nothing unsafe can merge while it waits.

The slow post-merge job **Heavy simulation tests** is still red on `main` (about 4 h), which is what #1980 is fixing. It has failed three of its last five runs there, so it is flapping rather than cleanly broken; it is deliberately not a required check and blocks no merges.

Everything else is green. The live site serves the newest commit (`f04ea84c`); CI, all three scheduled background jobs and the other post-merge workflows pass. All 9 scheduled tasks are within schedule; the worktree reaper ran at 04:40. Engine tick cost is 67 ms/tick, **11% below** the seven-day median — no drift. No new Discord messages since the last brief.

The lane-silence probe's worst gap is again the Saturday→Sunday one, declined under your 8 August and 11 September rulings on overnight and weekend quiet. The weekday episodes it also found are the standing ask above.
