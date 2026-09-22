# Briefing
**Generated:** 2026-09-22 07:00 local (05:00 UTC) · keep-work-flowing-cc

## The one thing

**The build queue is down to one item, and everything arriving to refill it is a question rather than a job. One yes or no from you turns that around.**

Your 6 August rule says the hourly planning lane may *stage* design work but never *write* it. The reason recorded at the time was that the lane ran the cheaper Sonnet model. **It runs Opus now — the same model an attended design session uses — so the stated reason has expired.** Nobody changed the rule; the ground under it moved.

The rule may still be right for a reason never written down: an unattended lane writing designs skips the back-and-forth of a real design conversation, and you may want a person in the room when the game's shape is decided. That is the actual question.

**Why this hour, more sharply than last.** The appointment feature finished overnight — all three parts merged, the last at 06:52 local — and nothing replaced it. One job is left waiting. The three tickets that arrived in the night are still sitting where work should be, because each is a question a builder cannot be handed:

- which mortals your attention should follow ([THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less)),
- whether a scene should be offered to the people who will refuse it ([THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants)),
- whether a follow-up scene may appear on its own ([THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live)).

- **Yes** → the lane drafts a first pass, runs the same audits an attended session runs, and you review a draft instead of starting from a blank page.
- **No** → nothing changes, and the design sessions stay yours to run. Worth saying plainly: that is a real answer, not a deferral — it just means the three above wait for you, starting with the one below.

## Also waiting (5)

- **One design hour, on one question: are scenes being offered to exactly the people who will refuse them?** ([THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants)) When the world picks *which mortal* gets a scene, it favours mortals who lean one way on the scene's named value — but when that scene's choice forks on the same value, the arm that matters is usually the other one. Measured, not suspected: a Bargain at the Crossroads fired once in a thousand ticks and was refused. Either the rule was always meant to draw both kinds of mortal, or the lopsidedness *is* the design and the house guide must stop telling authors to reuse that axis. Both are defensible, which is why it is yours. Say you want to work THR-1525 in a chat. *— from tb-orchestrator*
- **Turn off Linear's auto-complete for sub-issues** — [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). Still one click, still unfixed; it erased five pieces of unbuilt work in two incidents on Sunday night. **It cannot fire this hour** — no parent with unfinished children is being worked — which is the only reason it is not leading.
- **Finish the sitting — two encounters left, screen clean** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)). Everything your four feedback batches produced is shipped and live; the deploy probe confirms again this run. [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan). A pass charters the hub map — say **"work the map"** in a chat.
- **Were the lane stops deliberate?** Four episodes, all ended; every lane has fired on schedule since Monday 17:41 local, re-verified this run. A marker at `~/.claude/threadbare-pause.json` keeps it off your list next time.
- **Fog or witness** — should an encounter's own consequences be exempt from the familiarity gate, because you were there, or does the stranger's sheet stay honestly blank? Silence leaves it as-is.

## Queue

**Starved.** 1 Ready for Dev, 1 In Dev, 1 In Design, 0 parked, nothing blocked or stale.

- [THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the) — traits wave 2, slice 2 · Medium · unclaimed for 7½ hours, the only job on the shelf.

In Dev: [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) — a held town becomes a faction position; its pull request is stuck (below). In Design: [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants), staged for the design hour above.

The appointment feature closed out overnight: its third and last part, [THR-1519](https://linear.app/threadbare/issue/THR-1519/appointment-primitive-slice-3-the-undertaking-grid-a-work-whose-payoff), merged at 06:52 local. That is what emptied the shelf.

## Health

**One thing is not green, and it is ours.**

The pull request for the held-town work, [#1981](https://github.com/christianspliid-ui/threadbare/pull/1981), cannot merge: it has both a file clash with `main` (in the authoring guide) **and** a failing required check. Neither fixes the other, so a session has to sit with it — the same session that is already working the ticket. Nothing else is queued behind it.

**The slow post-merge test job recovered on its own.** It had been red for five hours; the latest run against the newest commit (`20ee315a`, 06:51 local) passed. The repair that landed at 05:24 did the job after all.

Everything else is green. The live site serves that same newest commit; CI, all three scheduled background jobs and the other post-merge workflows pass. All 9 scheduled tasks are within schedule; the worktree reaper ran at 06:40. Engine tick cost is 71 ms/tick, **5% below** the seven-day median — no drift. No new Discord messages since the last brief.

The lane-silence probe's worst gap is again the Saturday→Sunday one, declined under your 8 August and 11 September rulings on overnight and weekend quiet. The weekday episodes it also found are the standing ask above. The read-only home checkout is three commits behind `main` — ordinary lag between autosync pulls, no work happens there.
