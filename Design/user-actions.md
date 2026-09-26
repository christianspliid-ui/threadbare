# User Action Required

**Last updated:** 2026-09-26 14:58 local (12:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the sitting — two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass unlocks the next stage: encounters reaching into factions, war, economy and divine actions. Say **"work the map"** in a chat when done.

### How much history should a new world start with? ([THR-1591](https://linear.app/threadbare/issue/THR-1591))

Samples to react to: [seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-42.md) and [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1591-world-with-a-past/Docs/audits/2026-09-25-living-world-data/proto-thr-1591/sample-seed-99.md) — each has a "Before you woke" chronicle page, two place-sheet lines and the dead.

- **A (recommended), explain the map.** The world already hides three dead empires and 103 ruins that nothing explains. Every town gets a founding; add one ancient war, 2–3 recent wars, 5–10 named dead.
- **B,** flavor text only. **C,** a deep simulated history.
- Two smaller calls: past shown on the first screen or found by visiting? (Lean: outline shown, details found.) Did the rival gods have a hand in it? (Lean: no.)

[Faith and politics at game start](https://linear.app/threadbare/issue/THR-1596) is also yours on [the living-world map](https://linear.app/threadbare/issue/THR-1589). The orchestrator reports it is the map's last open question: one religious order per world, rare holy places, many towns answering to no one, and monster-lair bands counted as factions. Three options, (a) to (c), are in the ticket. Say "work the map" when ready. *— from tb-design-lane and tb-orchestrator*

### Turn off Linear's auto-complete for sub-issues — it closes unbuilt work

When a parent issue closes, Linear marks its unfinished children finished too. **It happened twice in four hours on Sunday night, erasing five pieces of authored work**: two parts of the appointment feature at 00:12 local, then all three parts under [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at 04:15. All five were restored, each checked first to confirm nothing had been built. No builder did anything wrong.

**The fix:** [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general) → turn off auto-completing sub-issues on parent completion. It fires again the next time a parent with unfinished children is completed. *— from tb-orchestrator*

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) read the computer's power log. **The 17 and 18 September stops are explained: the computer was asleep**, and lanes cannot run on a sleeping machine. But on **14 and 15 September the computer was awake all day, and no lane started at all**. So either the Claude app was closed, or the lanes were switched off.

**If you were away or had the app closed:** nothing to do. A marker at `~/.claude/threadbare-pause.json` keeps this off your list next time. **If you weren't:** say so, and it becomes a fault to chase.

### Fog or witness — does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-09-26 — culture and Realm names never show a raw terrain code** ([THR-1622](https://linear.app/threadbare/issue/THR-1622)). Merged via [#2070](https://github.com/christianspliid-ui/threadbare/pull/2070), and live on the site.
- **2026-09-26 — a new trade route never ends at the town it starts from** ([THR-1619](https://linear.app/threadbare/issue/THR-1619)). Merged via [#2069](https://github.com/christianspliid-ui/threadbare/pull/2069), and live on the site.
- **2026-09-26 — you answered the dice question: "1 in 6 is fine"** ([THR-1581](https://linear.app/threadbare/issue/THR-1581)). Your words: *"follow the newer decisions, we learn and grow and evolve. 1 in 6 is fine."* and *"it doesnt have to be a rule, it is a constant we tweak as we search for a good game."* I recorded the ruling on the ticket. The builder resumed, then hit the plan's last safety check, and the change went back to the design lane at 10:30 local. That call is the lane's, not yours.
- **2026-09-26 — The Builder's Legacy now counts only what was built after the mandate began** ([THR-1618](https://linear.app/threadbare/issue/THR-1618)), not every road and building the world started with. Merged 11:30 local via [#2068](https://github.com/christianspliid-ui/threadbare/pull/2068), and live on the site.
- **2026-09-26 — non-casters are no longer offered "create a power"** ([THR-1617](https://linear.app/threadbare/issue/THR-1617)). Merged via [#2066](https://github.com/christianspliid-ui/threadbare/pull/2066), and live on the site.
- **2026-09-26 — a dissolved trade route now removes its road and its shock lands** ([THR-1615](https://linear.app/threadbare/issue/THR-1615)), instead of staying claimable. Merged via [#2064](https://github.com/christianspliid-ui/threadbare/pull/2064), and live on the site.
- **2026-09-26 — five small interface faults found by the cold playtest are fixed** ([THR-1604](https://linear.app/threadbare/issue/THR-1604)). Merged via [#2063](https://github.com/christianspliid-ui/threadbare/pull/2063), and live on the site.
- **2026-09-26 — a notable's agenda phase now carries a chronicle title** ([THR-1585](https://linear.app/threadbare/issue/THR-1585)) instead of an internal id. Merged via [#2061](https://github.com/christianspliid-ui/threadbare/pull/2061), and live on the site.
- **2026-09-26 — wards and cures now reach Terrified, Wounded and Cursed** ([THR-1569](https://linear.app/threadbare/issue/THR-1569)). Merged 04:33 local via [#2060](https://github.com/christianspliid-ui/threadbare/pull/2060), and live on the site.
- **2026-09-26 — items that promise a burst when struck now give it** ([THR-1568](https://linear.app/threadbare/issue/THR-1568)): before, a "when attacked, +Iron for a few turns" item fired and gave nothing. Merged 02:33 local via [#2058](https://github.com/christianspliid-ui/threadbare/pull/2058), and live on the site.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
