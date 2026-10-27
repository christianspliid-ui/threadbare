# User Action Required

**Last updated:** 2026-10-27 21:58 local (20:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

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

- **2026-10-27: salt, the good the smugglers carry, is live** ([THR-2069](https://linear.app/threadbare/issue/THR-2069/plan-doc-salt-the-good-the-smugglers-carry-the-monopoly-scene-prices)). Merged via [#2636](https://github.com/christianspliid-ui/threadbare/pull/2636).
- **2026-10-27: the heavy simulation tests pass on main again.** The fix for the timing miss ([THR-2084](https://linear.app/threadbare/issue/THR-2084/heavy-simulation-tests-red-on-main-armed-targets-frame-budget-measured), [#2635](https://github.com/christianspliid-ui/threadbare/pull/2635)) is merged, and [the run on its merge](https://github.com/christianspliid-ui/threadbare/actions/runs/40551208332) succeeded.
- **2026-10-27: the army heavy test now fits its time limit, and the fix is merged** ([THR-2083](https://linear.app/threadbare/issue/THR-2083/heavy-simulation-tests-red-on-main-the-run-on-the-thr-2082-fix-merge)), via [#2634](https://github.com/christianspliid-ui/threadbare/pull/2634). The heavy tests are still red for a different reason; the builder has that as [THR-2084](https://linear.app/threadbare/issue/THR-2084/heavy-simulation-tests-red-on-main-armed-targets-frame-budget-measured).
- **2026-10-27: a fix for the red heavy tests (an army whose commander dies was no longer offered to a faction-mate) is merged and live** ([THR-2082](https://linear.app/threadbare/issue/THR-2082/heavy-simulation-tests-red-on-main-the-ownership-band-army-offered-to)), via [#2633](https://github.com/christianspliid-ui/threadbare/pull/2633).
- **2026-10-27: the seeded world no longer ends after 41 ticks, and the fix is live** ([THR-2080](https://linear.app/threadbare/issue/THR-2080)). Merged via [#2632](https://github.com/christianspliid-ui/threadbare/pull/2632).
- **2026-10-27: The First's page no longer shows an empty portrait box, and the fix is live** ([THR-2079](https://linear.app/threadbare/issue/THR-2079)). Merged via [#2630](https://github.com/christianspliid-ui/threadbare/pull/2630).
- **2026-10-27: the Doom and Omen hints no longer float over the Inspector, and the fix is live** ([THR-2078](https://linear.app/threadbare/issue/THR-2078)). Merged via [#2629](https://github.com/christianspliid-ui/threadbare/pull/2629).
- **2026-10-27: an oath from tribute is live.** The house that pays tribute in a crown's hall now swears to that crown ([THR-2051](https://linear.app/threadbare/issue/THR-2051)). Merged via [#2627](https://github.com/christianspliid-ui/threadbare/pull/2627).
- **2026-10-27: God's Will offers story and the path leans, and it is live** ([THR-2068](https://linear.app/threadbare/issue/THR-2068)). Merged via [#2625](https://github.com/christianspliid-ui/threadbare/pull/2625).
- **2026-10-27: taking over an empty forge or mine now fully registers, and the fix is live** ([THR-2076](https://linear.app/threadbare/issue/THR-2076)). Merged via [#2623](https://github.com/christianspliid-ui/threadbare/pull/2623).

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
