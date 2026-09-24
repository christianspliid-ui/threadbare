# User Action Required

**Last updated:** 2026-09-25 00:58 local (22:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

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

- **2026-09-25 — the odds shown are now the odds rolled**: the dice honour items, conditions and standing ([THR-1535](https://linear.app/threadbare/issue/THR-1535/the-odds-shown-are-not-the-odds-rolled-the-unified-road-never-reads-a)). Merged 00:44 local via [#2023](https://github.com/christianspliid-ui/threadbare/pull/2023), and live on the site.
- **2026-09-24 — mortals now plan with the same odds the dice use** ([THR-1579](https://linear.app/threadbare/issue/THR-1579/forecast-window-s2-the-forecast-is-the-roll-mortals-plan-with-the-odds), forecast window S2). Merged 22:49 local via [#2022](https://github.com/christianspliid-ui/threadbare/pull/2022), and live on the site. S3 is next in the build queue.
- **2026-09-24 — the game now measures the odds mortals face, by skill level** ([THR-1578](https://linear.app/threadbare/issue/THR-1578/forecast-window-s1-the-gauge-measure-the-odds-per-proficiency-kpis-and), forecast window S1). This changes no gameplay yet. Merged 21:44 local via [#2021](https://github.com/christianspliid-ui/threadbare/pull/2021), and live on the site.
- **2026-09-24 — when two mortals fight, both now roll** ([THR-1556](https://linear.app/threadbare/issue/THR-1556/duels-e1-opposed-exchanges), duels E1). Merged 20:45 local via [#2019](https://github.com/christianspliid-ui/threadbare/pull/2019), and live on the site. Not a review ask yet: monsters in scenes and the fight screen are still to come.
- **2026-09-24 — you answered "yes to THR-1535"**: the dice will now honour items, conditions and standing ([THR-1535](https://linear.app/threadbare/issue/THR-1535/the-odds-shown-are-not-the-odds-rolled-the-unified-road-never-reads-a)). It is in the build queue.
- **2026-09-24 — you ruled on how much who a mortal is should weigh** ([THR-1575](https://linear.app/threadbare/issue/THR-1575/the-dice-read-every-protagonist-as-a-master-capabilitys-curve)): mortals take on tasks at 50–65% odds, skill decides which ones. The plan merged via [#2018](https://github.com/christianspliid-ui/threadbare/pull/2018) and [#2020](https://github.com/christianspliid-ui/threadbare/pull/2020); the first two slices ([S1](https://linear.app/threadbare/issue/THR-1578), [S2](https://linear.app/threadbare/issue/THR-1579)) are in the build queue.
- **2026-09-24 — every lair beast now has a fighting card and a temper** ([THR-1544](https://linear.app/threadbare/issue/THR-1544/monsters-m1-the-monster-card), monsters M1). Merged 19:40 local via [#2017](https://github.com/christianspliid-ui/threadbare/pull/2017), and live on the site.
- **2026-09-24 — war news now reaches the chronicle in normal play** ([THR-1564](https://linear.app/threadbare/issue/THR-1564/war-news-never-reaches-the-player-in-normal-play-armies-battles-and)). Merged 18:34 local via [#2016](https://github.com/christianspliid-ui/threadbare/pull/2016), and live on the site.
- **2026-09-24 — the fight block is finished: the first playable fight, a monster in its lair** ([THR-1543](https://linear.app/threadbare/issue/THR-1543/fight-block-fb7-the-block-the-template-advantages-allies-events), FB7). Merged 18:13 local via [#2015](https://github.com/christianspliid-ui/threadbare/pull/2015).
- **2026-09-24 — skill floors on ambitions, milestones and spells now actually gate** ([THR-1562](https://linear.app/threadbare/issue/THR-1562/ambition-reach-floors-and-reach-milestones-compare-raw-capability-10)). Merged 16:22 local via [#2013](https://github.com/christianspliid-ui/threadbare/pull/2013), and live on the site.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
