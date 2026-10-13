# User Action Required

**Last updated:** 2026-10-13 03:57 local (01:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

### Was the Claude app closed on Thursday 1 Oct afternoon and Friday 2 Oct morning? (lane silence, ended)

The power log shows the computer **was on**: lanes stopped about 16:30 Thursday, the computer stayed awake until 21:38 when it was shut down or put to sleep, then woke 08:49 Friday. Lanes didn't return until about 13:45. No pause marker covered it.

**If the app was closed:** nothing to do, just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The 09-23 retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) found the computer **awake all day** on 14 and 15 September, with no lane starting. So either the app was closed, or the lanes were switched off.

**If the app was closed:** nothing to do. **If it wasn't:** say so, and it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-10-12: Dominion core: one graded read of how much a place or thing is yours, used by prices and checks** ([THR-1748](https://linear.app/threadbare/issue/THR-1748/dominion-core-one-graded-read-of-how-much-a-world-object-is-the-gods)). Merged via [#2351](https://github.com/christianspliid-ui/threadbare/pull/2351) and live.
- **2026-10-12: a long vignette on the Meet-The-First picker no longer runs off the bottom of the screen** ([THR-1836](https://linear.app/threadbare/issue/THR-1836/meet-the-first-picker-a-long-vignette-runs-past-the-bottom-of-the)). Merged via [#2345](https://github.com/christianspliid-ui/threadbare/pull/2345) and live.
- **2026-10-12: pouring a Sphere says what it will change before you commit** ([THR-1815](https://linear.app/threadbare/issue/THR-1815/say-it-before-it-happens-the-sphere-pour-says-what-it-changes-the)). Merged via [#2344](https://github.com/christianspliid-ui/threadbare/pull/2344) and live.
- **2026-10-12: Doom, Omen, World-Soul and Attention now explain themselves when you hover them** ([THR-1814](https://linear.app/threadbare/issue/THR-1814/the-maps-words-explain-themselves-doom-omen-world-soul-and-attention)). Merged via [#2343](https://github.com/christianspliid-ui/threadbare/pull/2343) and live.
- **2026-10-12: a chapter choice made while the clock is paused stays on screen** ([THR-1812](https://linear.app/threadbare/issue/THR-1812/a-chapter-step-committed-on-a-paused-clock-stays-on-screen-the-world)). Merged via [#2342](https://github.com/christianspliid-ui/threadbare/pull/2342) and live.
- **2026-10-11: the map tooltip names land in plain words and hides when you click** ([THR-1818](https://linear.app/threadbare/issue/THR-1818/map-hover-tooltip-shows-raw-terrain-keys-plateau-temperate-forest-and)). Merged via [#2336](https://github.com/christianspliid-ui/threadbare/pull/2336) and live.
- **2026-10-11: the world map can no longer crash on load** ([THR-1817](https://linear.app/threadbare/issue/THR-1817/the-world-map-can-crash-on-load-hexmapv2-calls-two-usememo-hooks-after)). Merged via [#2334](https://github.com/christianspliid-ui/threadbare/pull/2334) and live.
- **2026-10-11: Escape closes the sheet on top, not the encounter behind it** ([THR-1816](https://linear.app/threadbare/issue/THR-1816/escape-closes-the-encounter-behind-an-open-sheet-instead-of-the-sheet)). Merged via [#2333](https://github.com/christianspliid-ui/threadbare/pull/2333) and live.
- **2026-10-11: encounter lines no longer show a raw `{are}` instead of the word** ([THR-1810](https://linear.app/threadbare/issue/THR-1810/encounter-prose-leaks-raw-are-two-lines-use-a-verb-token-only)). Merged via [#2332](https://github.com/christianspliid-ui/threadbare/pull/2332) and live.
- **2026-10-11: every skill reader now uses the new Reach share, last one was encounter awareness** ([THR-1580](https://linear.app/threadbare/issue/THR-1580/re-fit-the-non-dice-capability-readers-sight-tiers-growth-gates-one-at)). Merged via [#2331](https://github.com/christianspliid-ui/threadbare/pull/2331) and live.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
