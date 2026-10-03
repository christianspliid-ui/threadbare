# User Action Required

**Last updated:** 2026-10-03 18:57 local (16:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the playthrough: two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September, saying *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters, played together, good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

### A finished change stuck for 13 hours: the fair draw ([#2180](https://github.com/christianspliid-ui/threadbare/pull/2180), [THR-1687](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert))

The armed-PR check escalated it: *"A finished change has been stuck for 13 hours and cannot merge on its own: PR #2180 … has a conflict that repeated automated attempts have not cleared. Nothing is broken on the live site, but that work is not reaching it."*

**Nothing for you to do by hand.** A builder merges main into the branch and pushes, which also restarts its checks. It is here so you know the work exists and is not yet live.

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

- **2026-10-03: a held blessing is no longer offered again at full price** ([THR-1700](https://linear.app/threadbare/issue/THR-1700)): a blessing still resolving now counts as held. Merged via [#2186](https://github.com/christianspliid-ui/threadbare/pull/2186).
- **2026-10-03: your own mortal now reads as yours, not a stranger** ([THR-1710](https://linear.app/threadbare/issue/THR-1710)): the Threads panel no longer fogs your avatar's own details. The eighth round-2 playtest bug fixed. Merged via [#2197](https://github.com/christianspliid-ui/threadbare/pull/2197).
- **2026-10-03: the Divine Court now fits the screen, sits above the HUD, and stops the clock while open** ([THR-1709](https://linear.app/threadbare/issue/THR-1709)), the seventh round-2 playtest bug fixed. Merged via [#2196](https://github.com/christianspliid-ui/threadbare/pull/2196).
- **2026-10-03: player text cleaned up** ([THR-1708](https://linear.app/threadbare/issue/THR-1708)): no doubled "the", spell names on the lines that report them, and a nudge only counts as yours when you played it. The sixth round-2 playtest bug fixed. Merged via [#2195](https://github.com/christianspliid-ui/threadbare/pull/2195).
- **2026-10-03: developer text no longer reaches a player's build** ([THR-1707](https://linear.app/threadbare/issue/THR-1707)), the fifth round-2 playtest bug fixed. Merged via [#2193](https://github.com/christianspliid-ui/threadbare/pull/2193).
- **2026-10-03: Meet The First now tells one story about one person** ([THR-1712](https://linear.app/threadbare/issue/THR-1712)), the fourth round-2 playtest bug fixed and the High one. Merged via [#2192](https://github.com/christianspliid-ui/threadbare/pull/2192).
- **2026-10-03: essence now tells one story** ([THR-1706](https://linear.app/threadbare/issue/THR-1706)): the card names the sphere that pays, the budget is that sphere's pool, and Meet The First charges. It is the third round-2 playtest bug fixed, merged 12:48 via [#2191](https://github.com/christianspliid-ui/threadbare/pull/2191).
- **2026-10-03: delivery velocity step 1 shipped** ([THR-1717](https://linear.app/threadbare/issue/THR-1717)): builders now get leaner session context and one command for the checks. Merged 12:00 via [#2189](https://github.com/christianspliid-ui/threadbare/pull/2189).
- **2026-10-03: clicking a mortal's name in a hex list now opens that mortal, and the spell hand names its target** ([THR-1705](https://linear.app/threadbare/issue/THR-1705)), the second round-2 playtest bug fixed. Merged 11:37 via [#2190](https://github.com/christianspliid-ui/threadbare/pull/2190).
- **2026-10-03: the Threads panel now shows The First right after the bond** ([THR-1704](https://linear.app/threadbare/issue/THR-1704)), the first round-2 playtest bug fixed. Merged this morning.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
