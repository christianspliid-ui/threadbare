# Briefing
**Generated:** 2026-09-13 06:58 local (04:58 UTC) · keep-work-flowing-cc

## The one thing

**Still the sitting: two encounters left — and the second of the two named blemishes was repaired this hour.** [THR-1220](https://linear.app/threadbare/issue/THR-1220) — the integrated slice checkpoint, waiting whenever you next sit down.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

**The question: is the integrated encounter experience at an acceptable state?** A pass charters the hub map — factions, war, economy and divine actions all hang off this interface.

**Sixteen reward recipes that promised a prize and drew nothing are now fixed and live** ([THR-1496](https://linear.app/threadbare/issue/THR-1496), merged 06:32, serving [6fd7da22](https://github.com/christianspliid-ui/threadbare/commit/6fd7da22)). That was one of the two blemishes I told you about last hour. None of the sixteen was reachable from your two remaining screens, so this changes nothing you will see — but it is off the list, and it produced a question of its own, below.

**The other blemish is still open, and I should be sharper about it than I was.** [THR-1494](https://linear.app/threadbare/issue/THR-1494) is the factor line that is not a sentence — *"Vara is oracle in eye."* — found on The Swindled Family, which you have already played. I have been describing it as confined there. The ticket's own diagnosis says otherwise: the template is broken for **all eight** reaches, not one. So if either remaining screen shows a capability line above the prose, expect it to read the same way. It is a known grammar defect with an open fix, not something to report — but you should not meet it cold. The fix has been stuck for five and a half hours (see Health); it is the executor's to clear, not yours.

A raw `{cast:…}` token on either screen would still be new, and worth telling me.

## Also waiting (3)

- **Six words with nothing left to say.** *(— from tb-orchestrator)* Yesterday's reward repair left six descriptive words orphaned — `#military`, `#supply`, `#community`, `#stewardship`, `#contraband`, `#blackmail_evidence`. Nothing asks for them and nothing wears them. Two ways: **retire the six**, so the vocabulary shrinks to what the game uses — or **write the content they were always for**. The four army scenes behind them had real fictions (a resupply convoy, foraging under fair terms, a lifted siege, sheltering refugees) and all four now hand out generic gold and iron. Purpose-built army-logistics rewards would be better scenes than the generic draw they got. Nothing is broken either way. → [THR-1501](https://linear.app/threadbare/issue/THR-1501/six-family-tags-are-now-orphaned-no-bearer-no-reader-sunset-or-author)

- **Fog or witness?** A stranger's sheet shows you almost nothing, even about the encounter you just watched. Click a mortal you barely know and their sheet reads *"Vara carries no known possessions, conditions, powers, or agreements"* — at the moment the encounter has just wounded and exhausted her. The wound is real and on the world's books; the sheet withholds it because you have not earned knowledge of her. **Should an encounter's own consequences be exempt from the familiarity gate — because you were there and watched it happen — or does the fog stay honest?** Either answer is defensible. Silence leaves it as-is, which is also a real answer. You will likely meet it during the sitting. *(— from tb-orchestrator)*

- **What is a player allowed to leaf through?** Four questions about what the codex is *for* — all **557 encounters** browsable or only the ones already lived; whether **omens** lose something if you can look them up; whether an **ambition** and a **companion** are definition pages or only read off the person carrying them. Filed as [THR-1495](https://linear.app/threadbare/issue/THR-1495); nothing is broken while these sit. *(— from tb-orchestrator)*

## Queue

**Healthy — 13 ready, 1 in dev, nothing parked, nothing stale.**

- **The one job in flight has not moved in five and a half hours.** [THR-1494](https://linear.app/threadbare/issue/THR-1494) — the factor line above — still has an open fix that is both failing its checks and conflicted against main. See Health.
- **The design-sitting backlog is now seven, up two.** *(— from tb-orchestrator)* The five you know — [how often encounters should fire](https://linear.app/threadbare/issue/THR-1218) (yours by authorship), [ambitions nothing can act on](https://linear.app/threadbare/issue/THR-1348), [beasts that cannot be cast in a scene](https://linear.app/threadbare/issue/THR-1274), [six content kinds with no reference page](https://linear.app/threadbare/issue/THR-1495), [which work stirs which trouble](https://linear.app/threadbare/issue/THR-1497) — plus the six orphaned words above, plus one correction: [traits wave 2](https://linear.app/threadbare/issue/THR-790) (locations and artifacts carrying traits) has been recorded for weeks as blocked behind another ticket. That ticket finished **49 days ago**. Wave 2 was never blocked since July; it has been waiting on a design pass and the record said otherwise. Not lost work — mislabelled. The lane has logged the method defect for its own weekly review. None of the seven is urgent alone; all seven want one afternoon, and none is an ask on top of the sitting.
- **All three design maps are still finished waiting.** Twenty-one research tickets and five agent-doable tasks closed; twelve questions remain across [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) (ten), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) (one) and [Item Generator](https://linear.app/threadbare/issue/THR-1227) (one), each one only you can answer. Deliberately not chased while the sitting is live — say **"work the map"** in a chat when it is done. *(— from tb-orchestrator)*

## Health

- **The one open PR is unchanged and still untouched — sixth hour.** [#1927](https://github.com/christianspliid-ui/threadbare/pull/1927) (the THR-1494 fix) carries *both* a failing `Test · Typecheck · Build` and a merge conflict against main, and has been armed since 01:17 local with no push since 01:18 — now 5h 38m. The owning session has to resolve the conflict *and* read the failure, because clearing one leaves it unmergeable on the other. Nothing here is yours, but it is the reason the factor-line blemish is still on the screen you will read.
- **Everything else is green.** CI and all three post-merge jobs green on the newest main, all three scheduled background jobs healthy, all nine lanes on schedule, reaper ran at 06:40. The site is serving the newest commit ([6fd7da22](https://github.com/christianspliid-ui/threadbare/commit/6fd7da22)). Engine speed is 64 ms/tick — **18% faster** than the seven-day median across 101 measurements.
- **The lane-silence probe still reports the same three old gaps, and still is not being carried to you.** The newest ended Friday morning and the other two are four and six days past — all self-resolved, the pattern you ruled normal on 8 August and extended to weekends on 11 September. The probe's window is long enough that resolved gaps never age out of it, which is why this line repeats — a calibration matter for the lane, logged for the weekly review rather than raised with you.
