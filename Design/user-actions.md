# User Action Required

**Last updated:** 2026-11-07 09:58 local (08:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

Recent gaps: 12–13 Oct overnight (03:57–13:57), Thursday 15 Oct (14:50–20:44), Friday 16 into Saturday 17 Oct (18:31–11:34, 21 jobs ready), Sunday 18 into Monday 19 Oct (20:26 Sunday – about 19:42 Monday, 25 jobs ready), **Wednesday 21 into Friday 23 Oct (about 23:07 Wednesday – 23:11 Friday, 48 hours, 20 jobs ready)**, and **Thursday 29 into Friday 30 Oct (about 02:57 Thursday – 19:12 Friday, 40 hours)**.

### Your writing-checks conversation can start (new 31 Oct)

[The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) reviewed every writing check against real lines, which is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. In short: the checks never see most of what players read (three in four encounters come from the old board, which the doctrine checks skip); the prose score takes points off plain stated facts; two word lists ("rather than", "on the way out") get in the way; one doctrine rule (a card's effect line never repeats a word from its name) has no check; the chip-length check is the most useful warning. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-31b.md)*

### Thursday 29 – Friday 30 Oct: was the computer off or the app closed, or was this a pause? (new 30 Oct)

The silence check says: "The scheduled lanes went silent for 40.3h (2026-10-29T01:56:50.000Z → 2026-10-30T18:17:35.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Every lane restarted in the same minute at 19:12 Friday, and the worktree reaper (a separate Windows timer) stopped at the same time, so it looks like the computer or app was off. **If so:** just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### Wednesday 21 – Friday 23 Oct: was the app closed or the computer off, or was this a pause? (new 23 Oct)

The silence check says: "The scheduled lanes went silent for 48.1h (2026-10-21T21:07:01.000Z → 2026-10-23T21:15:17.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." The lanes all restarted in the same second at 23:11 Friday, and the worktree reaper (a separate Windows scheduler) stopped at the same time, so it looks like the computer or app was off. **If so:** just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### Sunday 18 – Monday 19 Oct: was the app closed, or was this a pause? (new 19 Oct)

The silence check says: "The scheduled lanes went silent for 23.3h (2026-10-18T18:26:51.000Z → 2026-10-19T17:42:15.000Z) and have since resumed, with no pause marker covering that window." **If the app was closed or the computer was off:** just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### Should "Fated" be gold instead of grey? (18 Oct)

On 4 October you set the odds pill to quest-difficulty colours with Fated grey ("a sure thing needs no god"). The card's own Fated pip is gold, and a round-4 tester read grey Fated as the *worst* word. [The plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided) keeps your grey and fixes the reading with words: the legend lists the words worst to best, ending on Fated.

**Keep grey** (what happens if you say nothing), **make it gold** like its pip, or **turn the pip grey too** so both match. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-18d.md)*

### Was the Claude app closed on Thursday 1 Oct afternoon and Friday 2 Oct morning? (lane silence, ended)

The power log shows the computer **was on**: lanes stopped about 16:30 Thursday, the computer stayed awake until 21:38, then woke 08:49 Friday. Lanes didn't return until about 13:45. No pause marker covered it. **If the app was closed:** just say so. **If it wasn't:** it becomes a fault to chase.

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The 09-23 retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer **awake all day** on 14 and 15 September, with no lane starting. So either the app was closed, or the lanes were switched off. **If the app was closed:** nothing to do. **If it wasn't:** it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-11-07: five chapters The First used to play out alone now deal you a hand on their first step, and it is live** ([THR-2179](https://linear.app/threadbare/issue/THR-2179)). Merged via [#2776](https://github.com/christianspliid-ui/threadbare/pull/2776).
- **2026-11-07: your cards now say how they landed — each card you play adds its own line under the step's result, and it is live** ([THR-2187](https://linear.app/threadbare/issue/THR-2187/your-cards-say-how-they-landed-each-card-the-god-played-adds-its-own)). Merged via [#2775](https://github.com/christianspliid-ui/threadbare/pull/2775).
- **2026-11-07: The Crossroads is on screen — a threaded mortal's next three roads, and you can lean toward one; it is live** ([THR-1928](https://linear.app/threadbare/issue/THR-1928/the-crossroads-on-screen-a-threaded-mortals-next-three-roads-as-an)). Merged via [#2774](https://github.com/christianspliid-ui/threadbare/pull/2774).
- **2026-11-06: hex cards' sphere push now lands on the right place on the map, and it is live** ([THR-2091](https://linear.app/threadbare/issue/THR-2091/hex-cards-sphere-push-picks-the-nearest-place-on-the-wrong-hex-grid)). Merged via [#2773](https://github.com/christianspliid-ui/threadbare/pull/2773).
- **2026-11-06: The Crossroads is live — see a threaded mortal's top choices and lean on one** ([THR-1926](https://linear.app/threadbare/issue/THR-1926/the-crossroads-read-a-threaded-mortals-top-three-choices-encounters)), the god action you approved on 14 Oct. Merged via [#2772](https://github.com/christianspliid-ui/threadbare/pull/2772).
- **2026-11-06: rank words on a reach tile now show where they sit on their ladder, and it is live** ([THR-2182](https://linear.app/threadbare/issue/THR-2182/rank-words-show-their-ladder-a-reach-tile-says-where-its-word-sits-and)). Merged via [#2771](https://github.com/christianspliid-ui/threadbare/pull/2771).
- **2026-11-06: "See the work" on a work moment now opens the mortal's sheet on the work, and it is live** ([THR-2186](https://linear.app/threadbare/issue/THR-2186/see-the-work-lands-on-the-work-the-inspector-opens-on-the-tab-a-link)). Merged via [#2770](https://github.com/christianspliid-ui/threadbare/pull/2770).
- **2026-11-06: a rival’s raid now names the place it pressed and opens it, and the Chronicle names the rival, and it is live** ([THR-2185](https://linear.app/threadbare/issue/THR-2185/a-rivals-move-has-a-place-and-an-answer-the-raid-toast-names-the-place)). Merged via [#2769](https://github.com/christianspliid-ui/threadbare/pull/2769).
- **2026-11-06: coming back to the game now opens on a "While you were away" recap, and it is live** ([THR-2184](https://linear.app/threadbare/issue/THR-2184/while-you-were-away-the-warm-up-card-ends-on-a-five-line-recap-led-by)). Merged via [#2768](https://github.com/christianspliid-ui/threadbare/pull/2768).
- **2026-11-06: the god rail's folded rows now say what they count, and it is live** ([THR-2183](https://linear.app/threadbare/issue/THR-2183/the-rail-rows-say-what-they-are-plain-summaries-on-the-folded-god-rail)). Merged via [#2766](https://github.com/christianspliid-ui/threadbare/pull/2766).
---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
