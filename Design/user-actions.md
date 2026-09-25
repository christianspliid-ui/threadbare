# User Action Required

**Last updated:** 2026-09-25 15:58 local (13:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the sitting — two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass unlocks the next stage: encounters reaching into factions, war, economy and divine actions. Say **"work the map"** in a chat when done.

### Turn off Linear's auto-complete for sub-issues — it closes unbuilt work

When a parent issue closes, Linear marks its unfinished children finished too. **It happened twice in four hours on Sunday night, erasing five pieces of authored work**: two parts of the appointment feature at 00:12 local, then all three parts under [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at 04:15. All five were restored, each checked first to confirm nothing had been built. No builder did anything wrong.

**The fix:** [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general) → turn off auto-completing sub-issues on parent completion. It fires again the next time a parent with unfinished children is completed. *— from tb-orchestrator*

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) read the computer's power log. **The 17 and 18 September stops are explained: the computer was asleep**, and lanes cannot run on a sleeping machine. But on **14 and 15 September the computer was awake all day, and no lane started at all**. So either the Claude app was closed, or the lanes were switched off.

**If you were away or had the app closed:** nothing to do. A marker at `~/.claude/threadbare-pause.json` keeps this off your list next time. **If you weren't:** say so, and it becomes a fault to chase.

### Fog or witness — does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-09-25 — six kinds of planted seed no longer wither the moment they are planted** ([THR-1613](https://linear.app/threadbare/issue/THR-1613)). Merged 15:32 local via [#2046](https://github.com/christianspliid-ui/threadbare/pull/2046), and live on the site.
- **2026-09-25 — Mercenary Company encounters can now be drawn** ([THR-1612](https://linear.app/threadbare/issue/THR-1612)). Merged 14:32 local via [#2045](https://github.com/christianspliid-ui/threadbare/pull/2045), and live on the site.
- **2026-09-25 — internal ids no longer reach the chronicle** ([THR-1602](https://linear.app/threadbare/issue/THR-1602), from the cold playtest). Merged via [#2044](https://github.com/christianspliid-ui/threadbare/pull/2044), and live on the site.
- **2026-09-25 — the title menu no longer shows developer screens** ([THR-1601](https://linear.app/threadbare/issue/THR-1601), from the cold playtest). Merged via [#2043](https://github.com/christianspliid-ui/threadbare/pull/2043), and live on the site.
- **2026-09-25 — "Story so far" no longer shows a raw `{name}` where a thread's name belongs** ([THR-1600](https://linear.app/threadbare/issue/THR-1600), from the cold playtest). Merged via [#2039](https://github.com/christianspliid-ui/threadbare/pull/2039).
- **2026-09-25 — living-world seeding drift fixed**: freeholds with no Realm nearby now attach to the nearest settlement ([THR-1588](https://linear.app/threadbare/issue/THR-1588)). Merged 10:46 local via [#2037](https://github.com/christianspliid-ui/threadbare/pull/2037), and live on the site.
- **2026-09-25 — “May a lane draft a design doc on its own?” answered: yes, within agreed work.** You ruled it in chat, and the design lane now runs four times a day ([THR-1611](https://linear.app/threadbare/issue/THR-1611)). Its decisions reach you as “Decided for you” lines you can veto. The ask is closed.
- **2026-09-25 — mortals who walk into a lair now have to fight its monster** ([THR-1547](https://linear.app/threadbare/issue/THR-1547/monsters-m4-walking-into-the-lair), monsters M4). Merged 09:39 local via [#2033](https://github.com/christianspliid-ui/threadbare/pull/2033), and live on the site. Not a review ask yet: the fight chips and the duel winner’s choice are still to come.
- **2026-09-25 — the action drawer’s cards now have a solid face, so the page no longer shows through them** ([THR-1587](https://linear.app/threadbare/issue/THR-1587)). Merged 08:28 local via [#2031](https://github.com/christianspliid-ui/threadbare/pull/2031), and live on the site.
- **2026-09-25 — a monster’s lair now shows its beast in a sentence, a clock, and a “slain” reading once it falls** ([THR-1552](https://linear.app/threadbare/issue/THR-1552/fight-on-screen-f4-the-lair-card), fight on screen F4). Merged 07:37 local via [#2030](https://github.com/christianspliid-ui/threadbare/pull/2030), and live on the site. Not a review ask yet: the fight chips and the duel winner’s choice are still to come.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
