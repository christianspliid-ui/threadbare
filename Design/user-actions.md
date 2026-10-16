# User Action Required

**Last updated:** 2026-10-16 03:01 local (01:01 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

It happened again on the night of 12 to 13 Oct: no lane ran from 03:57 until 13:57 on Tuesday 13 Oct. And again on Thursday 15 Oct: no lane ran from about 14:50 to 20:44 local, with 19 jobs waiting for the builder.

### Was the Claude app closed on Thursday 1 Oct afternoon and Friday 2 Oct morning? (lane silence, ended)

The power log shows the computer **was on**: lanes stopped about 16:30 Thursday, the computer stayed awake until 21:38 when it was shut down or put to sleep, then woke 08:49 Friday. Lanes didn't return until about 13:45. No pause marker covered it.

**If the app was closed:** nothing to do, just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The 09-23 retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer **awake all day** on 14 and 15 September, with no lane starting. So either the app was closed, or the lanes were switched off.

**If the app was closed:** nothing to do. **If it wasn't:** say so, and it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-10-16: factions now have a purse: the land fills it, war empties it, and a broke faction’s armies desert** ([THR-1931](https://linear.app/threadbare/issue/THR-1931/plan-doc-the-faction-purse-the-land-fills-it-war-empties-it-and-a)). Merged via [#2435](https://github.com/christianspliid-ui/threadbare/pull/2435) and live.
- **2026-10-16: map markers keep one steady size per zoom, and place names step aside for portraits** ([THR-1899](https://linear.app/threadbare/issue/THR-1899/map-markers-and-labels-one-steady-marker-size-per-zoom-band-portraits)). Merged via [#2434](https://github.com/christianspliid-ui/threadbare/pull/2434) and live.
- **2026-10-15: realm borders now wear their holder’s ink, and uncharted land shows as parchment** ([THR-1902](https://linear.app/threadbare/issue/THR-1902/realm-borders-in-their-holders-ink-and-uncharted-land-as-parchment)). Merged via [#2432](https://github.com/christianspliid-ui/threadbare/pull/2432) and live.
- **2026-10-15: the icon, chip and tab primitives are live** ([THR-1885](https://linear.app/threadbare/issue/THR-1885/icon-chip-and-tabs-primitives-the-icon-registry-format-one-chip-in)). Merged via [#2431](https://github.com/christianspliid-ui/threadbare/pull/2431).
- **2026-10-15: four small faults from warm round 2 are fixed** ([THR-1858](https://linear.app/threadbare/issue/THR-1858/four-small-faults-from-warm-round-2-a-chaos-price-drains-a-hidden-pool)): the hidden Chaos drain, odds that moved without showing it, the dropdown that ate a click, and the "Mute" chip that read as a trait. Merged via [#2430](https://github.com/christianspliid-ui/threadbare/pull/2430) and live.
- **2026-10-15: the template seams in player prose are fixed** ([THR-1857](https://linear.app/threadbare/issue/THR-1857/new-template-seams-in-player-prose-they-wants-kael-thornweaver-work)): no more "They wants", and inns and waypoints carry proper names. Merged via [#2428](https://github.com/christianspliid-ui/threadbare/pull/2428).
- **2026-10-15: Escape on an aftermath now acknowledges it, and its exit and reactions stay on screen** ([THR-1856](https://linear.app/threadbare/issue/THR-1856/escape-on-an-aftermath-blanks-the-screen-and-the-aftermath-comes-back)). Merged via [#2425](https://github.com/christianspliid-ui/threadbare/pull/2425) and live.
- **2026-10-15: the first encounter coverage run is done** ([THR-1850](https://linear.app/threadbare/issue/THR-1850/first-encounter-coverage-run-judge-all-encounter-entries-with-jev)). Merged via [#2424](https://github.com/christianspliid-ui/threadbare/pull/2424) and live; its first follow-up, [nine mis-tagged encounters](https://linear.app/threadbare/issue/THR-1941/nine-encounters-wear-a-family-tag-their-prose-does-not-earn-anomaly), is queued.
- **2026-10-15: every dialog now shares one backdrop and one Escape order** ([THR-1884](https://linear.app/threadbare/issue/THR-1884/overlay-and-panel-primitives-one-backdrop-z-band-and-escape-stack)). Merged via [#2423](https://github.com/christianspliid-ui/threadbare/pull/2423) and live.
- **2026-10-15: your TypeSafe key is set and the lanes can see it** (confirmed by [the orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-15e.md)). [The first encounter coverage run](https://linear.app/threadbare/issue/THR-1850/first-encounter-coverage-run-judge-all-encounter-entries-with-jev) is queued.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
