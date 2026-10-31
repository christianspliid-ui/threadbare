# User Action Required

**Last updated:** 2026-10-31 03:57 local (02:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

Recent gaps: 12–13 Oct overnight (03:57–13:57), Thursday 15 Oct (14:50–20:44), Friday 16 into Saturday 17 Oct (18:31–11:34, 21 jobs ready), Sunday 18 into Monday 19 Oct (20:26 Sunday – about 19:42 Monday, 25 jobs ready), **Wednesday 21 into Friday 23 Oct (about 23:07 Wednesday – 23:11 Friday, 48 hours, 20 jobs ready)**, and **Thursday 29 into Friday 30 Oct (about 02:57 Thursday – 19:12 Friday, 40 hours)**.

### Thursday 29 – Friday 30 Oct: was the computer off or the app closed, or was this a pause? (new 30 Oct)

The silence check says: "No scheduled Claude Code lane has written to origin/main or origin/ops since 2026-10-29T01:56:50.000Z — 40.3h of fleet-wide silence, past the 6h threshold, and no pause marker is set. Either the lanes are broken, or this is a deliberate pause that was never declared." Every lane restarted in the same minute at 19:12 Friday, and the worktree reaper (a separate Windows timer) stopped at the same time, so it looks like the computer or app was off. **If so:** just say so. **If it wasn't:** say so, and it becomes a fault to chase.

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

- **2026-10-30: a god's push onto a hex now lands on the place it falls on, and it is live** ([THR-2087](https://linear.app/threadbare/issue/THR-2087/hex-cards-sphere-pressure-goes-nowhere-a-push-onto-a-hex-col-row)). Merged via [#2653](https://github.com/christianspliid-ui/threadbare/pull/2653).
- **2026-10-29: energy gods now have two cards of their own, Stoke the Forges and Kindle a Spark, and they are live** ([THR-2086](https://linear.app/threadbare/issue/THR-2086/energy-has-no-card-a-god-can-cast-kindle-wander-and-illuminate-cannot)). Merged via [#2652](https://github.com/christianspliid-ui/threadbare/pull/2652).
- **2026-10-28: only the god's own hand now fills the Mandate, and it is live** ([THR-2081](https://linear.app/threadbare/issue/THR-2081/the-worlds-own-drift-fills-the-mandate-with-no-god-an-unattended-world)). Merged via [#2651](https://github.com/christianspliid-ui/threadbare/pull/2651).
- **2026-10-28: Inspire now changes what a mortal decides, and it is live** ([THR-2088](https://linear.app/threadbare/issue/THR-2088/inspire-changes-nothing-a-mortal-decides-its-card-writes-an-influence)). Merged via [#2650](https://github.com/christianspliid-ui/threadbare/pull/2650).
- **2026-10-28: a loan now brings its lender back to collect, and it is live** ([THR-2044](https://linear.app/threadbare/issue/THR-2044/debt-collection-is-rarely-drawn-by-a-mortal-who-is-owed-93percent-of)). Merged via [#2649](https://github.com/christianspliid-ui/threadbare/pull/2649).
- **2026-10-28: hunger and plenty stories are live** ([THR-2040](https://linear.app/threadbare/issue/THR-2040/plan-doc-famine-and-glut-draws-a-hungry-town-tells-hungers-stories-a)). Merged via [#2648](https://github.com/christianspliid-ui/threadbare/pull/2648).
- **2026-10-28: Attention now has a price, and it is live** ([THR-2062](https://linear.app/threadbare/issue/THR-2062/attention-is-never-spent-spendattention-has-no-production-caller-so)). Merged via [#2644](https://github.com/christianspliid-ui/threadbare/pull/2644).
- **2026-10-28: the heavy simulation tests pass on main again.** The fix (a compulsion paid mid-encounter no longer steered The First, [THR-2085](https://linear.app/threadbare/issue/THR-2085/heavy-simulation-tests-red-on-main-a-compulsion-paid-mid-encounter-no), [#2643](https://github.com/christianspliid-ui/threadbare/pull/2643)) is merged, and [the run on its merge](https://github.com/christianspliid-ui/threadbare/actions/runs/40627110730) succeeded.
- **2026-10-28: the god's steering powers now reach a mortal's own final choice, and it is live** ([THR-2073](https://linear.app/threadbare/issue/THR-2073/the-gods-steering-verbs-and-a-mortals-movement-leans-may-stop-at-the)). Merged via [#2641](https://github.com/christianspliid-ui/threadbare/pull/2641).
- **2026-10-28: the town economy now reaches the mortal's final choice, and it is live** ([THR-2071](https://linear.app/threadbare/issue/THR-2071)). Merged via [#2639](https://github.com/christianspliid-ui/threadbare/pull/2639).

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
