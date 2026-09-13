# Briefing
**Generated:** 2026-09-13 07:58 local (05:58 UTC) · keep-work-flowing-cc

## The one thing

**Still the sitting: two encounters left.** [THR-1220](https://linear.app/threadbare/issue/THR-1220) — the integrated slice checkpoint, waiting whenever you next sit down.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

**The question: is the integrated encounter experience at an acceptable state?** A pass charters the hub map — factions, war, economy and divine actions all hang off this interface.

**One change landed on a screen you will open, twenty minutes ago.** [THR-1492](https://linear.app/threadbare/issue/THR-1492) ([#1933](https://github.com/christianspliid-ui/threadbare/pull/1933), merged 07:35, live on [e7395328](https://github.com/christianspliid-ui/threadbare/commit/e7395328)) retired a duplicate version of the detail sheet, so every sheet you open from a chip now comes from one place instead of two. The visible part: that sheet used to show **two buttons that did nothing when clicked** — they are gone. Nothing else about it should look different. It was checked by test rather than by eye (the night lanes cannot open a browser), so if a sheet you open from a boon or a possession looks wrong, that is worth telling me.

**The one blemish I warned you about is unchanged.** [THR-1494](https://linear.app/threadbare/issue/THR-1494) — the factor line that is not a sentence, *"Vara is oracle in eye."* The template is broken for **all eight** reaches, so if either remaining screen shows a capability line above the prose, expect it to read that way. Known, fix open but still stuck (see Health); not something to report. A raw `{cast:…}` token would still be new.

## Also waiting (3)

- **Six words with nothing left to say.** Yesterday's reward repair left six descriptive words orphaned — `#military`, `#supply`, `#community`, `#stewardship`, `#contraband`, `#blackmail_evidence`. Nothing asks for them and nothing wears them. Two ways: **retire the six**, so the vocabulary shrinks to what the game uses — or **write the content they were always for**. The four army scenes behind them had real fictions (a resupply convoy, foraging under fair terms, a lifted siege, sheltering refugees) and all four now hand out generic gold and iron. Nothing is broken either way. → [THR-1501](https://linear.app/threadbare/issue/THR-1501/six-family-tags-are-now-orphaned-no-bearer-no-reader-sunset-or-author)

- **Fog or witness?** Click a mortal you barely know and their sheet reads *"Vara carries no known possessions, conditions, powers, or agreements"* — at the moment the encounter has just wounded and exhausted her. The wound is real and on the world's books; the sheet withholds it because you have not earned knowledge of her. **Should an encounter's own consequences be exempt from the familiarity gate — because you were there and watched it happen — or does the fog stay honest?** Either answer is defensible. Silence leaves it as-is, which is also a real answer. You will likely meet it during the sitting. *(Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461); no ticket of its own.)*

- **What is a player allowed to leaf through?** Four questions about what the codex is *for* — all **557 encounters** browsable or only the ones already lived; whether **omens** lose something if you can look them up; whether an **ambition** and a **companion** are definition pages or only read off the person carrying them. Filed as [THR-1495](https://linear.app/threadbare/issue/THR-1495); nothing is broken while these sit.

## Queue

**Healthy — 13 ready, 1 in dev, nothing parked, nothing stale.**

- **One job finished this hour and two joined the queue.** [THR-1492](https://linear.app/threadbare/issue/THR-1492) merged at 07:35 (above). The two new ones are small and neither is yours: four more places that open the wrong person's sheet ([THR-1500](https://linear.app/threadbare/issue/THR-1500) — the same defect that was fixed on the premonition at 03:27), and a leftover calculation with no reader ([THR-1502](https://linear.app/threadbare/issue/THR-1502)). The orchestrator has explicitly recorded that the second one is the builder's call, not yours.
- **The one job in flight has not moved in six and a half hours.** [THR-1494](https://linear.app/threadbare/issue/THR-1494) — the factor line above — still has an open fix that is both failing its checks and conflicted against main. See Health.
- **The design-sitting backlog is still seven, unchanged since 04:27.** [How often encounters should fire](https://linear.app/threadbare/issue/THR-1218) (yours by authorship), [ambitions nothing can act on](https://linear.app/threadbare/issue/THR-1348), [beasts that cannot be cast in a scene](https://linear.app/threadbare/issue/THR-1274), [six content kinds with no reference page](https://linear.app/threadbare/issue/THR-1495), [which work stirs which trouble](https://linear.app/threadbare/issue/THR-1497), the six orphaned words above, and [traits wave 2](https://linear.app/threadbare/issue/THR-790). None is urgent alone; all seven want one afternoon, and none is an ask on top of the sitting.
- **All three design maps are still finished waiting.** Twelve questions remain across [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) (ten), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) (one) and [Item Generator](https://linear.app/threadbare/issue/THR-1227) (one), each one only you can answer. Deliberately not chased while the sitting is live — say **"work the map"** in a chat when it is done.

## Health

- **The one open PR is unchanged and still untouched — seventh hour.** [#1927](https://github.com/christianspliid-ui/threadbare/pull/1927) (the THR-1494 fix) carries *both* a failing `Test · Typecheck · Build` and a merge conflict against main, with no push since 01:18 local — now 6h 40m. The owning session has to resolve the conflict *and* read the failure, because clearing one leaves it unmergeable on the other. Nothing here is yours, but it is the reason the factor-line blemish is still on the screen you will read.
- **Everything else is green.** CI and all three post-merge jobs green on the newest main, all three scheduled background jobs healthy, all nine lanes on schedule, reaper ran at 07:40. The site is serving the newest commit ([e7395328](https://github.com/christianspliid-ui/threadbare/commit/e7395328)). Engine speed is 64 ms/tick — **17% faster** than the seven-day median across 102 measurements.
- **The lane-silence probe still reports the same three old gaps, and still is not being carried to you.** The newest ended Saturday morning and the other two are four and six days past — all self-resolved, the pattern you ruled normal on 8 August and extended to weekends on 11 September. The probe's window is long enough that resolved gaps never age out of it, which is why this line repeats — a calibration matter for the lane, logged for the weekly review rather than raised with you.
