# User Action Required

**Last updated:** 2026-10-03 00:54 local (22:54 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the playthrough: two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September, saying *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters, played together, good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

### Was the app closed from Thursday ~17:00 to Friday ~13:45? (lane silence, 1–2 October, ended)

No lane ran for about 21 hours: the last brief went out Thursday 1 October 16:55, and lanes resumed Friday 2 October ~13:48, your time. The builder, design and grooming lanes all missed their slots. No pause marker covered it, and it was a weekday.

**If you were away or had the app closed:** nothing to do; just say so. **If you weren't:** say so, and it becomes a fault to chase.

### Were you away from Tuesday evening to Wednesday evening? (lane silence, 29–30 September, ended)

No scheduled lane ran for about 25 hours: from Tuesday 29 September ~19:30 to Wednesday 30 September ~20:20, your time. Nothing merged in that window, and every lane has now resumed on its own. No pause marker covered it, and it was a weekday.

**If you were away or had the app closed:** nothing to do; just say so. A marker at `~/.claude/threadbare-pause.json` keeps this off your list next time. **If you weren't:** say so, and it becomes a fault to chase.

### Turn off Linear's auto-complete for sub-issues, which closes unbuilt work

When a parent issue closes, Linear marks its unfinished children finished too. **It happened twice in four hours on Sunday night and erased five pieces of authored work.** All five were restored, and each was checked first to confirm nothing had been built. No builder did anything wrong.

**The fix:** [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general) → turn off auto-completing sub-issues on parent completion. Until then, it fires again the next time someone completes a parent with unfinished children. *— from tb-orchestrator*

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) read the computer's power log. **The 17 and 18 September stops are explained: the computer was asleep.** But on **14 and 15 September the computer was awake all day, and no lane started at all**. So either the Claude app was closed, or the lanes were switched off.

**If you were away or had the app closed:** nothing to do. **If you weren't:** say so, and it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-10-03: Sanctify and Hearthfire Blessing now do something lasting** ([THR-662](https://linear.app/threadbare/issue/THR-662/wire-the-two-remaining-no-op-sanctify-actions-subsanctify-subsanctify)): a blessed place keeps its blessing, and a tavern's owner cannot stack it twice. Merged 00:46 via [#2174](https://github.com/christianspliid-ui/threadbare/pull/2174).
- **2026-10-02: dialogue cards now take their colour from the moment** ([THR-1586](https://linear.app/threadbare/issue/THR-1586)): story, elder and gain palettes, and the sphere tint on the card face. Merged ~23:45 via [#2173](https://github.com/christianspliid-ui/threadbare/pull/2173).
- **2026-10-02: jobs inside a veto window now wait their turn** ([THR-1694](https://linear.app/threadbare/issue/THR-1694)): the builder will not start a design you could still veto. Merged 22:39 via [#2172](https://github.com/christianspliid-ui/threadbare/pull/2172).
- **2026-10-02: undertakings now say where they must happen** ([THR-1294](https://linear.app/threadbare/issue/THR-1294/requireslocation-defaults-off-make-it-an-authored-flag-on-every-multi)): every multi-turn undertaking carries the flag instead of a hidden default. Merged 21:31 via [#2171](https://github.com/christianspliid-ui/threadbare/pull/2171).
- **2026-10-02: found things in the reward draw are designed** ([THR-1626](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at)): about 50 per world, ~40% of Storied and Mythic rewards. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-02-thr-1626-found-items-in-reward-draws.md) merged via [#2170](https://github.com/christianspliid-ui/threadbare/pull/2170); veto window open until Saturday ~20:45.
- **2026-10-02: the dead encounter-choice pipeline is retired** ([THR-964](https://linear.app/threadbare/issue/THR-964/pendingchoicecommits-has-no-producer-the-entire-encounter-choice)). Merged 20:41 via [#2169](https://github.com/christianspliid-ui/threadbare/pull/2169).
- **2026-10-02: rival schemes now show who is behind them, on the map too** ([THR-829](https://linear.app/threadbare/issue/THR-829/sponsors-scheme-attribution-edge-never-binds-in-a-real-world-rivals)). Merged 19:54 via [#2168](https://github.com/christianspliid-ui/threadbare/pull/2168).
- **2026-10-02: the encounter factory's checks now read the right side of each step** ([THR-1693](https://linear.app/threadbare/issue/THR-1693/encounter-factory-gates-live-proof-stops-reading-success-side-step)). Merged 18:50 via [#2167](https://github.com/christianspliid-ui/threadbare/pull/2167).
- **2026-10-02: every code change now gets a cold review before it merges** ([THR-1691](https://linear.app/threadbare/issue/THR-1691/automatic-code-review-gate-a-cold-suspicious-reviewer-runs-before)). Merged via [#2166](https://github.com/christianspliid-ui/threadbare/pull/2166); its first backtest already found the Wolf-Winter Watch bug ([THR-1697](https://linear.app/threadbare/issue/THR-1697)).
- **2026-10-02: the builder lane is running again.** It ran at 16:11 and picked up the top job ([THR-1691](https://linear.app/threadbare/issue/THR-1691)). The stall was the same outage as the silence above.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
