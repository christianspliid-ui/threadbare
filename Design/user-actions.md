# User Action Required

**Last updated:** 2026-10-09 18:55 local (16:55 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

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

- **2026-10-09: template seams no longer reach the player's text** ([THR-1779](https://linear.app/threadbare/issue/THR-1779/recurs-after-fix-template-seams-reach-the-player-his-only-kin-claims)). Merged via [#2286](https://github.com/christianspliid-ui/threadbare/pull/2286) and live.
- **2026-10-09: you chose B: the world offers powers, you choose and pay** ([THR-1770](https://linear.app/threadbare/issue/THR-1770/a-buy-system-for-god-actions-can-the-player-buy-cards-with-what-the)). Your words: *"i go with B, and i would like a tier/progression system of actions, aswell as an assessment of which should be generic."* The tiers and generic set are now [THR-1794](https://linear.app/threadbare/issue/THR-1794/god-card-tiers-and-the-generic-set-a-progression-ladder-for-every-god).
- **2026-10-09: "Return to the world" now resolves the whole chapter** ([THR-1778](https://linear.app/threadbare/issue/THR-1778/return-to-the-world-bounces-back-closing-an-aftermath-resolves-only)). Merged via [#2285](https://github.com/christianspliid-ui/threadbare/pull/2285) and live.
- **2026-10-09: every world now draws its doom from all seven archetypes, not just Breach** ([THR-1774](https://linear.app/threadbare/issue/THR-1774/every-runs-doom-is-breach-six-of-the-seven-authored-doom-archetypes)). Merged via [#2284](https://github.com/christianspliid-ui/threadbare/pull/2284) and live.
- **2026-10-09: your turf grows in two moves, Shift then Claim** ([THR-1762](https://linear.app/threadbare/issue/THR-1762/how-the-frontier-moves-which-verbs-push-dominion-outward-what-they)). Decided for you by the design lane; say "veto" in chat to reverse.
- **2026-10-09: elder magic can now be found in ruins** ([THR-1753](https://linear.app/threadbare/issue/THR-1753/foundation-signed-cards-lose-their-only-identity-route-once-spheres)). Merged via [#2282](https://github.com/christianspliid-ui/threadbare/pull/2282) and live.
- **2026-10-09: God’s Will now changes the world when you pay for it** ([THR-1781](https://linear.app/threadbare/issue/THR-1781/gods-will-takes-the-essence-and-changes-nothing-a-whispers)). Merged via [#2273](https://github.com/christianspliid-ui/threadbare/pull/2273) and live.
- **2026-10-09: the threading rite now plays on screen** ([THR-1754](https://linear.app/threadbare/issue/THR-1754/threading-rite-s2-the-rite-on-screen-every-thread-opens-a-short-rite)). Merged via [#2280](https://github.com/christianspliid-ui/threadbare/pull/2280) and live.
- **2026-10-09: you can buy your spheres at the start of a run** ([THR-1749](https://linear.app/threadbare/issue/THR-1749/buy-your-spheres-point-buy-across-the-eight-creation-spheres-at)). Merged via [#2272](https://github.com/christianspliid-ui/threadbare/pull/2272) and live.
- **2026-10-09: your turf now changes what things cost and pay** ([THR-1761](https://linear.app/threadbare/issue/THR-1761/what-the-band-buys-cost-effect-strength-thread-yield-and-source-income)). Decided for you by the design lane; say "veto" in chat to reverse.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
