# User Action Required

**Last updated:** 2026-09-25 08:56 local (06:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the sitting — two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass unlocks the next stage: encounters reaching into factions, war, economy and divine actions. Say **"work the map"** in a chat when done.

### Turn off Linear's auto-complete for sub-issues — it closes unbuilt work

When a parent issue closes, Linear marks its unfinished children finished too. **It happened twice in four hours on Sunday night, erasing five pieces of authored work**: two parts of the appointment feature at 00:12 local, then all three parts under [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at 04:15. All five were restored, each checked first to confirm nothing had been built. No builder did anything wrong.

**The fix:** [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general) → turn off auto-completing sub-issues on parent completion. It fires again the next time a parent with unfinished children is completed. *— from tb-orchestrator*

### May a lane draft a design doc on its own? — *from tb-orchestrator*

Your 6 August rule: the hourly planning lane stages design work but never authors it. **The recorded reason is that the lane ran the cheaper Sonnet model.** It runs Opus now, the same model an attended design session uses, so the stated reason has quietly expired. ([The rule, in the process canon](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md).) The rule may still be right for a reason never written down: an unattended lane writing designs skips the back-and-forth of a real design chat.

- **Yes** → it drafts the first pass, runs the same audits an attended session uses, and you review a draft instead of starting from nothing.
- **No** → nothing changes, and the design sessions are yours to run.

**Three design jobs are waiting for a design session now:** [items](https://linear.app/threadbare/issue/THR-1570), [power runtime](https://linear.app/threadbare/issue/THR-1571) and [spells](https://linear.app/threadbare/issue/THR-1572). With a yes, the lane could draft first passes of these.

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) read the computer's power log. **The 17 and 18 September stops are explained: the computer was asleep**, and lanes cannot run on a sleeping machine. But on **14 and 15 September the computer was awake all day, and no lane started at all**. So either the Claude app was closed, or the lanes were switched off.

**If you were away or had the app closed:** nothing to do. A marker at `~/.claude/threadbare-pause.json` keeps this off your list next time. **If you weren't:** say so, and it becomes a fault to chase.

### Fog or witness — does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-09-25 — the action drawer’s cards now have a solid face, so the page no longer shows through them** ([THR-1587](https://linear.app/threadbare/issue/THR-1587)). Merged 08:28 local via [#2031](https://github.com/christianspliid-ui/threadbare/pull/2031), and live on the site.
- **2026-09-25 — a monster’s lair now shows its beast in a sentence, a clock, and a “slain” reading once it falls** ([THR-1552](https://linear.app/threadbare/issue/THR-1552/fight-on-screen-f4-the-lair-card), fight on screen F4). Merged 07:37 local via [#2030](https://github.com/christianspliid-ui/threadbare/pull/2030), and live on the site. Not a review ask yet: the fight chips and the duel winner’s choice are still to come.
- **2026-09-25 — winning a fight now pays out, and notable fights get a chronicle line** ([THR-1549](https://linear.app/threadbare/issue/THR-1549/fight-endings-d2-victory-yields-and-the-chronicle), fight endings D2). Merged 06:35 local via [#2029](https://github.com/christianspliid-ui/threadbare/pull/2029), and live on the site. Not a review ask yet: the lair card is still to come.
- **2026-09-25 — the fight screen now shows who the mortal faces, and how close it is to falling** ([THR-1551](https://linear.app/threadbare/issue/THR-1551/fight-on-screen-f2-the-opponent-header), fight on screen F2). Merged 05:43 local via [#2028](https://github.com/christianspliid-ui/threadbare/pull/2028), and live on the site. Not a review ask yet: the lair card and what the winner takes home are still to come.
- **2026-09-25 — a lost fight now leaves its mark on the fighter**: defeat, scars, and a gate on when a fight can kill ([THR-1548](https://linear.app/threadbare/issue/THR-1548/fight-endings-d1-endings-and-the-death-gate), fight endings D1). Merged 04:44 local via [#2027](https://github.com/christianspliid-ui/threadbare/pull/2027), and live on the site. Not a review ask yet: the opponent header and the lair card are still to come.
- **2026-09-25 — felling a lair’s beast in a fight now takes the den** ([THR-1546](https://linear.app/threadbare/issue/THR-1546/monsters-m3-what-felling-it-does), monsters M3). Merged 03:36 local via [#2026](https://github.com/christianspliid-ui/threadbare/pull/2026), and live on the site. Not a review ask yet: fight endings and the opponent header are still to come.
- **2026-09-25 — monsters are now named and counted right on the fight screen** ([THR-1550](https://linear.app/threadbare/issue/THR-1550/fight-on-screen-f1-monsters-named-and-counted-right), fight on screen F1). Merged 02:36 local via [#2025](https://github.com/christianspliid-ui/threadbare/pull/2025), and live on the site. Not a review ask yet: fight endings and felling a monster are still to come.
- **2026-09-25 — the named-beast hunt now fights the lair's own monster** ([THR-1545](https://linear.app/threadbare/issue/THR-1545/monsters-m2-monsters-in-scenes), monsters M2). Merged 01:43 local via [#2024](https://github.com/christianspliid-ui/threadbare/pull/2024), and live on the site. Not a review ask yet: the fight screen is still to come.
- **2026-09-25 — the odds shown are now the odds rolled**: the dice honour items, conditions and standing ([THR-1535](https://linear.app/threadbare/issue/THR-1535/the-odds-shown-are-not-the-odds-rolled-the-unified-road-never-reads-a)). Merged 00:44 local via [#2023](https://github.com/christianspliid-ui/threadbare/pull/2023), and live on the site.
- **2026-09-24 — mortals now plan with the same odds the dice use** ([THR-1579](https://linear.app/threadbare/issue/THR-1579/forecast-window-s2-the-forecast-is-the-roll-mortals-plan-with-the-odds), forecast window S2). Merged 22:49 local via [#2022](https://github.com/christianspliid-ui/threadbare/pull/2022), and live on the site. S3 is next in the build queue.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
