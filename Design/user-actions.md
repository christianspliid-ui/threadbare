# User Action Required

**Last updated:** 2026-10-25 15:56 local (14:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Log the playtest testers back in (new 25 Oct)

[Cold playtest round 5](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-5.md) is due: every round-4 ticket is closed and the fixes are live on [threadbearer.co](https://threadbearer.co/). The run stopped before any tester started, because the standalone `claude` the testers use said its login had expired and could not be refreshed. **Open a terminal, run `claude`, then type `/login`.** The next daily run (about 10:48 tomorrow) then plays round 5 by itself. Nothing was filed this time.

### Approve the new weekly review lane (new 25 Oct)

The builder wrote [THR-1950](https://linear.app/threadbare/issue/THR-1950): one Friday review pass that replaces five lanes (weekly retro, workflow retro, CI/CD review, project hygiene, daily grooming). Its prompt is merged ([#2574](https://github.com/christianspliid-ui/threadbare/pull/2574), [the prompt](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/scheduled-task-prompts/tb-weekly-review.md)). Creating a scheduled lane needs a person to approve it, so an unattended run cannot finish. **Open one session, say "finish THR-1950", and approve the prompts.** Until then the five old lanes keep running, so nothing is lost by waiting.

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

- **2026-10-25: four encounters' declared Reach now matches the steps they roll** ([THR-2038](https://linear.app/threadbare/issue/THR-2038)). Merged via [#2577](https://github.com/christianspliid-ui/threadbare/pull/2577).
- **2026-10-25: six settlement-economy terms are in the glossary** ([THR-1924](https://linear.app/threadbare/issue/THR-1924)). Merged via [#2576](https://github.com/christianspliid-ui/threadbare/pull/2576).
- **2026-10-25: the encounter-coverage judge v2 sees the stakes and flags a Reach no step rolls** ([THR-2012](https://linear.app/threadbare/issue/THR-2012)). Merged via [#2575](https://github.com/christianspliid-ui/threadbare/pull/2575).
- **2026-10-25: the review gate and browser evidence now apply only to engine and large UI changes** ([THR-1949](https://linear.app/threadbare/issue/THR-1949)). Merged via [#2573](https://github.com/christianspliid-ui/threadbare/pull/2573); the process-cuts question needed no answer.
- **2026-10-25: the heavy tests' appointment check is fixed and green on main** ([THR-2037](https://linear.app/threadbare/issue/THR-2037)). Merged via [#2572](https://github.com/christianspliid-ui/threadbare/pull/2572).
- **2026-10-25: the world tilt reaches places, backfill seeds included** ([THR-2028](https://linear.app/threadbare/issue/THR-2028)). Merged via [#2571](https://github.com/christianspliid-ui/threadbare/pull/2571) and live.
- **2026-10-25: mortals can broker an oath: a warlord swears its free company first, and a landless realm takes no vassal** ([THR-1944](https://linear.app/threadbare/issue/THR-1944)). Merged via [#2570](https://github.com/christianspliid-ui/threadbare/pull/2570) and live.
- **2026-10-25: the restless road ends in its story: a mortal who takes the road for a story now starts it on arrival** ([THR-2036](https://linear.app/threadbare/issue/THR-2036)). Merged via [#2569](https://github.com/christianspliid-ui/threadbare/pull/2569) and live.
- **2026-10-25: when cards hide under the hand bar, the bar says how many and one click shows them** ([THR-1942](https://linear.app/threadbare/issue/THR-1942)). Merged via [#2568](https://github.com/christianspliid-ui/threadbare/pull/2568) and live.
- **2026-10-25: the heavy simulation tests' restless-road check and settlement speed budget are fixed** ([THR-2035](https://linear.app/threadbare/issue/THR-2035)). Merged via [#2567](https://github.com/christianspliid-ui/threadbare/pull/2567).

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
