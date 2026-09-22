# Briefing
**Generated:** 2026-09-22 06:00 local (04:00 UTC) · keep-work-flowing-cc

## The one thing

**The build queue is down to two items, and everything arriving to refill it is a question rather than a job. One yes or no from you turns that around.**

Your 6 August rule says the hourly planning lane may *stage* design work but never *write* it. The reason recorded at the time was that the lane ran the cheaper Sonnet model. **It runs Opus now — the same model an attended design session uses — so the stated reason has expired.** Nobody changed the rule; the ground under it moved.

The rule may still be right for a reason never written down: an unattended lane writing designs skips the back-and-forth of a real design conversation, and you may want a person in the room when the game's shape is decided. That is the actual question.

**Why this hour.** Three tickets arrived overnight and the planning lane declined all three for the same reason — each is a question, not a job:

- which mortals your attention should follow ([THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less)),
- whether a scene should be offered to the people who will refuse it ([THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants)),
- whether a follow-up scene may appear on its own ([THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live)).

Each names its options and has a measurement behind it. None can be handed to a builder as written. Meanwhile the queue that *is* moving is being fed by repairs, and it is now two items deep.

- **Yes** → the lane drafts a first pass, runs the same audits an attended session runs, and you review a draft instead of starting from a blank page.
- **No** → nothing changes, and the design sessions stay yours to run. Worth saying plainly: that is a real answer, not a deferral — it just means the three above wait for you.

## Also waiting (4)

- **Turn off Linear's auto-complete for sub-issues** — [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). Still one click, still unfixed, and it erased five pieces of unbuilt work in two incidents last night. **It cannot fire this hour** — I checked, and no parent with unfinished children is being worked — which is the only reason it is not leading the brief. It fires again the next time one is.
- **Finish the sitting — two encounters left, screen clean** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)). Everything your four feedback batches produced is shipped and live; the deploy probe confirms again this run. [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan). A pass charters the hub map — say **"work the map"** in a chat.
- **Were the lane stops deliberate?** Four episodes, all ended; every lane has fired on schedule since Monday 17:41 local, re-verified this run. A marker at `~/.claude/threadbare-pause.json` keeps it off your list next time.
- **Fog or witness** — should an encounter's own consequences be exempt from the familiarity gate, because you were there, or does the stranger's sheet stay honestly blank? Silence leaves it as-is.

## Queue

**Healthy but thin.** 2 Ready for Dev, 1 In Dev, 0 parked, nothing blocked or stale.

- [THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the) — traits wave 2, slice 2 · Medium
- [THR-1519](https://linear.app/threadbare/issue/THR-1519/appointment-primitive-slice-3-the-undertaking-grid-a-work-whose-payoff) — appointment slice 3, the undertaking grid · Medium · its blocker shipped, so it is genuinely claimable

In Dev: [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) — a held town becomes a faction position. Claimed this hour, has no sub-issues.

## Health

**One thing is not green, and it is ours.**

The slow post-merge job **Heavy simulation tests** is still red on `main` — but it is no longer the failure it was an hour ago. The repair you were told was fixing it ([#1980](https://github.com/christianspliid-ui/threadbare/pull/1980)) merged at 05:24 local and its own check passes. What is left is a **different** test timing out: one generated-world case about a mortal being offered the harvest of a town they hold, which exceeded its five-second limit. 213 of 214 tests pass. A timeout on a slow machine is not the same thing as a broken rule, and a session needs to look at which it is. The job is deliberately not required and blocks no merges.

Everything else is green. The live site serves the newest commit (`25cb19d5`); CI, all three scheduled background jobs and the other post-merge workflows pass. No PRs are waiting to merge. All 9 scheduled tasks are within schedule; the worktree reaper ran at 05:40. Engine tick cost is 68 ms/tick, **8% below** the seven-day median — no drift. No new Discord messages since the last brief.

The lane-silence probe's worst gap is again the Saturday→Sunday one, declined under your 8 August and 11 September rulings on overnight and weekend quiet. The weekday episodes it also found are the standing ask above.
