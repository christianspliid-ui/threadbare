# User Action Required

**Last updated:** 2026-10-16 14:58 local (12:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

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

- **2026-10-16: every place on the map now draws its carved icon in the map ink; hidden and in-transit places stay off the map** ([THR-1903](https://linear.app/threadbare/issue/THR-1903/carved-places-on-the-map-every-place-type-draws-its-carved-shape-in)). Merged via [#2447](https://github.com/christianspliid-ui/threadbare/pull/2447) and live.
- **2026-10-16: the map camera has zoom buttons and map keys, can centre on your First, and opens on known land** ([THR-1900](https://linear.app/threadbare/issue/THR-1900/map-camera-and-controls-zoom-buttons-centre-on-my-first-show-known)). Merged via [#2445](https://github.com/christianspliid-ui/threadbare/pull/2445).
- **2026-10-16: the world remembers, first slice: an account record carries across runs, divine echoes land at harvest, and each run wakes in a new world** ([THR-1813](https://linear.app/threadbare/issue/THR-1813/the-world-remembers-an-account-record-each-run-a-new-world-seeded-with)). Merged via [#2444](https://github.com/christianspliid-ui/threadbare/pull/2444) and live.
- **2026-10-16: the carved icon registry is live: 229 icon shapes, their concept table and the icon credits** ([THR-1904](https://linear.app/threadbare/issue/THR-1904/carved-icon-registry-vendor-the-229-shapes-fill-the-concept-table-ship)). Merged via [#2443](https://github.com/christianspliid-ui/threadbare/pull/2443).
- **2026-10-16: lines like "The captain nod at Kael" now read "The captain nods at Kael"** ([THR-1945](https://linear.app/threadbare/issue/THR-1945/noun-subjects-drop-their-verbs-s-for-a-theythem-actor-the-captain-nod)). Merged via [#2442](https://github.com/christianspliid-ui/threadbare/pull/2442).
- **2026-10-16: the unused effect-glyph table with six broken symbols is deleted** ([THR-1874](https://linear.app/threadbare/issue/THR-1874/delete-the-unread-effect-type-glyph-table-six-malformed-escapes-never)). Merged via [#2441](https://github.com/christianspliid-ui/threadbare/pull/2441).
- **2026-10-16: a hamlet founded inside a people’s own lands now takes their heartland, not their fringe** ([THR-1849](https://linear.app/threadbare/issue/THR-1849/a-hamlet-founded-inside-a-peoples-own-lands-reads-as-their-fringe)). Merged via [#2440](https://github.com/christianspliid-ui/threadbare/pull/2440) and live.
- **2026-10-16: long place names now wrap inside the hex tooltip** ([THR-1848](https://linear.app/threadbare/issue/THR-1848)). Merged via [#2439](https://github.com/christianspliid-ui/threadbare/pull/2439) and live.
- **2026-10-16: one death no longer keeps a town at full unrest forever** ([THR-1925](https://linear.app/threadbare/issue/THR-1925/death-site-unrest-never-stops-one-death-pins-a-town-at-99-unrest-for)). Merged via [#2438](https://github.com/christianspliid-ui/threadbare/pull/2438) and live.
- **2026-10-16: card labels and the library and world trails now read in sentence case** ([THR-1905](https://linear.app/threadbare/issue/THR-1905/label-sweep-sentence-case-bold-labels-and-no-small-cinzel-on-the-kept)). Merged via [#2436](https://github.com/christianspliid-ui/threadbare/pull/2436) and live.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
