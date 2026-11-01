# User Action Required

**Last updated:** 2026-11-01 01:56 local (00:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

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

- **2026-10-31: spirit, life and entropy gods now have cheap town cards (Tend the Sick, Let the Damp In, Keep the Vigil), and they are live** ([THR-2090](https://linear.app/threadbare/issue/THR-2090/spirit-life-and-entropy-get-a-cheap-place-card-and-doom-wears-a-life)). Merged via [#2668](https://github.com/christianspliid-ui/threadbare/pull/2668).
- **2026-10-31: card lean sentence — you chose B, effect only** ("B", Discord 15:58). Cards on a choice step drop "It argues for the honest way." and keep the effect line. Passed to the builder of [THR-2105](https://linear.app/threadbare/issue/THR-2105/story-text-quality-in-encounters-read-the-prose-the-way-a-player-meets) via the briefing.
- **2026-10-31: heavy simulation tests are green on main again** ([THR-2107](https://linear.app/threadbare/issue/THR-2107/heavy-simulation-tests-red-on-main-the-thr-2068-compelled-journey)). Merged via [#2664](https://github.com/christianspliid-ui/threadbare/pull/2664).
- **2026-10-31: a person’s page now leads with their art, and it is live** ([THR-2097](https://linear.app/threadbare/issue/THR-2097/art-led-pass-slice-1-inspector-art-and-icon-primitives-dressed-on-the)). Merged via [#2663](https://github.com/christianspliid-ui/threadbare/pull/2663).
- **2026-10-31: the faction set-pieces now name the faction they are about, and it is live** ([THR-2096](https://linear.app/threadbare/issue/THR-2096/faction-bounty-names-no-faction-the-eight-generic-faction-set-pieces)). Merged via [#2661](https://github.com/christianspliid-ui/threadbare/pull/2661).
- **2026-10-31: a won encounter no longer hands out a wound and calls it a boon, and it is live** ([THR-2095](https://linear.app/threadbare/issue/THR-2095/a-won-encounter-hands-out-a-wound-and-calls-it-a-boon-hesper-won)). Merged via [#2660](https://github.com/christianspliid-ui/threadbare/pull/2660).
- **2026-10-31: the meeting's test text and its helps/hinders panel now sit on a dark backing, and it is live** ([THR-2093](https://linear.app/threadbare/issue/THR-2093/the-meetings-test-prose-and-its-helpshinders-panel-sit-bare-on-the)). Merged via [#2659](https://github.com/christianspliid-ui/threadbare/pull/2659).
- **2026-10-31: the origin and drive pictures are no longer see-through, and it is live** ([THR-2092](https://linear.app/threadbare/issue/THR-2092/the-origin-and-drive-choice-pictures-are-see-through-at-rest-the-void)). Merged via [#2658](https://github.com/christianspliid-ui/threadbare/pull/2658).
- **2026-10-31: force, matter and time gods now have cheap town cards (Steel the Walls, Lay the Footings, Keep the Stores), and they are live** ([THR-2089](https://linear.app/threadbare/issue/THR-2089/only-mind-has-a-cheap-place-card-under-the-god-caused-mandate-10-of-12)). Merged via [#2656](https://github.com/christianspliid-ui/threadbare/pull/2656).
- **2026-10-30: a god's push onto a hex now lands on the place it falls on, and it is live** ([THR-2087](https://linear.app/threadbare/issue/THR-2087/hex-cards-sphere-pressure-goes-nowhere-a-push-onto-a-hex-col-row)). Merged via [#2653](https://github.com/christianspliid-ui/threadbare/pull/2653).

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
