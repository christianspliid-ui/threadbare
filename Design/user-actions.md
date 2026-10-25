# User Action Required

**Last updated:** 2026-10-25 04:58 local (03:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

Recent gaps: 12–13 Oct overnight (03:57–13:57), Thursday 15 Oct (14:50–20:44), Friday 16 into Saturday 17 Oct (18:31–11:34, 21 jobs ready), Sunday 18 into Monday 19 Oct (20:26 Sunday – about 19:42 Monday, 25 jobs ready), and **Wednesday 21 into Friday 23 Oct (about 23:07 Wednesday – 23:11 Friday, 48 hours, 20 jobs ready)**.

### Wednesday 21 – Friday 23 Oct: was the app closed or the computer off, or was this a pause? (new 23 Oct)

The silence check says: "No scheduled Claude Code lane has written to origin/main or origin/ops since 2026-10-21T21:07:01.000Z — 48.1h of fleet-wide silence, past the 6h threshold, and no pause marker is set. Either the lanes are broken, or this is a deliberate pause that was never declared." The lanes all restarted in the same second at 23:11 Friday, and the worktree reaper (a separate Windows scheduler) stopped at the same time, so it looks like the computer or app was off. **If so:** just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### The process cuts THR-1947 and THR-1949: run them with you present, or let the builder edit the gate files? (15 Oct)

You approved both on 15 Oct. The unattended builder claimed [THR-1947](https://linear.app/threadbare/issue/THR-1947) (one status line per PR instead of three ledgers), but it is not allowed to edit the gate, CI and Definition-of-Done files, so nothing changed ([the park note](https://linear.app/threadbare/issue/THR-1947)). [THR-1949](https://linear.app/threadbare/issue/THR-1949) edits the same files and will hit the same wall. [THR-1951](https://linear.app/threadbare/issue/THR-1951) waits on 1947.

**Run 1947, then 1949, in one session with you present** (recommended, the smaller trust change), **or allow the unattended builder to edit those files.** *— from [daily-backlog-grooming](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-10-23.md)*

### Sunday 18 – Monday 19 Oct: was the app closed, or was this a pause? (new 19 Oct)

The silence check says: "The scheduled lanes went silent for 23.3h (2026-10-18T18:26:51.000Z → 2026-10-19T17:42:15.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." **If the app was closed or the computer was off:** just say so. **If it wasn't:** say so, and it becomes a fault to chase.

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

- **2026-10-25: choices widen across runs: four hungers on the first run, one more woken each age, a second court, sealed god cards, and "The world remembers"** ([THR-1844](https://linear.app/threadbare/issue/THR-1844)). Merged via [#2562](https://github.com/christianspliid-ui/threadbare/pull/2562) and live.
- **2026-10-25: an echo heir’s seeded kin tie counts as part of the world’s past** ([THR-2029](https://linear.app/threadbare/issue/THR-2029)). Merged via [#2561](https://github.com/christianspliid-ui/threadbare/pull/2561) and live.
- **2026-10-25: echoes of a past god stand in the new world** ([THR-1843](https://linear.app/threadbare/issue/THR-1843)). Merged via [#2559](https://github.com/christianspliid-ui/threadbare/pull/2559) and live.
- **2026-10-25: a lake hex's land page reads as water, not as a desert; coast and river ruins stay dry** ([THR-2021](https://linear.app/threadbare/issue/THR-2021)). Merged via [#2558](https://github.com/christianspliid-ui/threadbare/pull/2558) and live.
- **2026-10-25: a liege pays the raise for a sworn free company with no army and no coin** ([THR-2020](https://linear.app/threadbare/issue/THR-2020)). Merged via [#2557](https://github.com/christianspliid-ui/threadbare/pull/2557) and live.
- **2026-10-24: the realm check "Oaths pay" is judged on the leading Crown** ([THR-2017](https://linear.app/threadbare/issue/THR-2017)). Merged via [#2556](https://github.com/christianspliid-ui/threadbare/pull/2556) and live.
- **2026-10-24: plan docs are capped at 400 lines per slice, and only an encounter's final package reaches main** ([THR-1948](https://linear.app/threadbare/issue/THR-1948)). Merged via [#2555](https://github.com/christianspliid-ui/threadbare/pull/2555).
- **2026-10-24: a gift's card line shows its toast once, not twice** ([THR-2013](https://linear.app/threadbare/issue/THR-2013)). Merged via [#2554](https://github.com/christianspliid-ui/threadbare/pull/2554) and live.
- **2026-10-24: 35 encounters' words now describe the test their Reach actually rolls** ([THR-2011](https://linear.app/threadbare/issue/THR-2011)). Merged via [#2553](https://github.com/christianspliid-ui/threadbare/pull/2553) and live.
- **2026-10-24: a faction pays for a member's founding they can't afford** ([THR-2008](https://linear.app/threadbare/issue/THR-2008)). Merged via [#2550](https://github.com/christianspliid-ui/threadbare/pull/2550) and live.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
