# User Action Required

**Last updated:** 2026-10-26 13:05 local (12:05 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

Recent gaps: 12–13 Oct overnight (03:57–13:57), Thursday 15 Oct (14:50–20:44), Friday 16 into Saturday 17 Oct (18:31–11:34, 21 jobs ready), Sunday 18 into Monday 19 Oct (20:26 Sunday – about 19:42 Monday, 25 jobs ready), and **Wednesday 21 into Friday 23 Oct (about 23:07 Wednesday – 23:11 Friday, 48 hours, 20 jobs ready)**.

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

- **2026-10-26: round 5's two design findings are planned and on the build shelf.** [New things arrive one at a time](https://linear.app/threadbare/issue/THR-2060) and [Readouts say what they show](https://linear.app/threadbare/issue/THR-2061), from [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2058-one-thing-at-a-time.md) merged via [#2596](https://github.com/christianspliid-ui/threadbare/pull/2596). Its five calls sit in the briefing's *Decided for you* until Tuesday 11:38 UTC.
- **2026-10-26: cold playtest round 5 is done.** 8 tickets are filed: 6 bugs ready to build, 2 for design. The builder took the Urgent one, [THR-2052](https://linear.app/threadbare/issue/THR-2052). See [the report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-5.md).
- **2026-10-26: the playtest testers can log in again.** Their login worked this morning, and the three new-player testers of [cold playtest round 5](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-5.md) started at 10:49.
- **2026-10-26: the plan for an oath sworn from tribute is merged** ([THR-2051](https://linear.app/threadbare/issue/THR-2051)), via [#2594](https://github.com/christianspliid-ui/threadbare/pull/2594). Its four calls sit in the briefing's *Decided for you* until Tuesday 09:49.
- **2026-10-26: three settings that no longer changed anything are removed, and the change is live** ([THR-2050](https://linear.app/threadbare/issue/THR-2050/authored-knobs-with-no-reader-minwealthrequired-on-five-action)). Merged via [#2593](https://github.com/christianspliid-ui/threadbare/pull/2593).
- **2026-10-26: eight pieces of old code the game no longer used are removed, and the change is live** ([THR-2049](https://linear.app/threadbare/issue/THR-2049/eight-modules-have-tests-but-no-production-caller-delete-each-with-its)). Merged via [#2592](https://github.com/christianspliid-ui/threadbare/pull/2592).
- **2026-10-26: the First's temperament now counts toward how its story ends, and the fix is live** ([THR-2034](https://linear.app/threadbare/issue/THR-2034/return-archetype-reads-never-match-the-usurper-bypass-and-the)). Merged via [#2591](https://github.com/christianspliid-ui/threadbare/pull/2591).
- **2026-10-26: the ending now follows who the First was born as, and the fix is live** ([THR-2009](https://linear.app/threadbare/issue/THR-2009/founding-gates-read-a-meeting-record-field-nobody-writes-the-reach)). The founding checks read the First's own Reach, so Transcendence can now happen. Merged via [#2590](https://github.com/christianspliid-ui/threadbare/pull/2590).
- **2026-10-26: an earlier god's relic now lies at its place, and the fix is live** ([THR-2030](https://linear.app/threadbare/issue/THR-2030)). Its page, its site's connections and Dominion all find it. Merged via [#2588](https://github.com/christianspliid-ui/threadbare/pull/2588).
- **2026-10-26: the Toll Dispute can now fire, and the fix is live** ([THR-2047](https://linear.app/threadbare/issue/THR-2047/the-toll-dispute-never-fires-on-three-30-day-worlds-no-lane-had)). Its trigger now uses the shared enemy-faction rule, so a road between two hostile factions can start one. Merged via [#2585](https://github.com/christianspliid-ui/threadbare/pull/2585).

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
