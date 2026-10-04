# User Action Required

**Last updated:** 2026-10-04 04:58 local (02:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the playthrough: two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September, saying *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **are the encounters, played together, good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

### A finished change stuck for 24 hours: the seeded spell generator ([#2178](https://github.com/christianspliid-ui/threadbare/pull/2178), [THR-1572](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and))

The armed-PR check escalated it: *"A finished change has been stuck for 24 hours and cannot merge on its own: PR #2178 … has a conflict that repeated automated attempts have not cleared. Nothing is broken on the live site, but that work is not reaching it."*

**Nothing for you to do by hand.** Clearing the conflict is a builder's job; the code is safe on the pull request. The spell-gifts design ([THR-1672](https://linear.app/threadbare/issue/THR-1672/spells-as-divine-gifts-and-found-tomes-acquisition-channels-1-and-4)) waits on it. The fair-draw PR [#2180](https://github.com/christianspliid-ui/threadbare/pull/2180) is stuck the same way but on purpose: it waits on its veto window (~02:45 Monday), then a builder clears it.

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

- **2026-10-04: the missing "X begins Y" news line is fixed** ([THR-1722](https://linear.app/threadbare/issue/THR-1722/a-mortal-who-begins-a-new-catalogue-encounter-crashes-the-rest-of-its)): a mortal starting one of the 86 new-catalogue encounters, including your slice encounters, is announced and recorded again. Merged via [#2207](https://github.com/christianspliid-ui/threadbare/pull/2207).
- **2026-10-04: an apex monster's card now names the apex** ([THR-1698](https://linear.app/threadbare/issue/THR-1698/an-apex-monsters-card-line-reaches-prose-only-the-fight-header-and)), not just the fight header. Merged via [#2204](https://github.com/christianspliid-ui/threadbare/pull/2204).
- **2026-10-04: a rival's strike now plays out as an encounter** ([THR-1703](https://linear.app/threadbare/issue/THR-1703/the-rival-strike-has-no-encounter-author-shadowrival-strike-so)): it is held where it cannot land, and both worst-case endings show and write the same harm. Merged via [#2203](https://github.com/christianspliid-ui/threadbare/pull/2203).
- **2026-10-03: timed conditions now end on time** ([THR-1697](https://linear.app/threadbare/issue/THR-1697)): a timed condition never lands permanent by accident. Merged via [#2202](https://github.com/christianspliid-ui/threadbare/pull/2202).
- **2026-10-03: reward draws now carry found things** ([THR-1626](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at)): generated items can turn up in an encounter's rewards. Merged via [#2201](https://github.com/christianspliid-ui/threadbare/pull/2201).
- **2026-10-03: six small interface faults fixed** ([THR-1711](https://linear.app/threadbare/issue/THR-1711)), including the time control now showing the held state a press will change. The last round-2 playtest bug. Merged via [#2198](https://github.com/christianspliid-ui/threadbare/pull/2198).
- **2026-10-03: a held blessing is no longer offered again at full price** ([THR-1700](https://linear.app/threadbare/issue/THR-1700)): a blessing still resolving now counts as held. Merged via [#2186](https://github.com/christianspliid-ui/threadbare/pull/2186).
- **2026-10-03: your own mortal now reads as yours, not a stranger** ([THR-1710](https://linear.app/threadbare/issue/THR-1710)): the Threads panel no longer fogs your avatar's own details. The eighth round-2 playtest bug fixed. Merged via [#2197](https://github.com/christianspliid-ui/threadbare/pull/2197).
- **2026-10-03: the Divine Court now fits the screen, sits above the HUD, and stops the clock while open** ([THR-1709](https://linear.app/threadbare/issue/THR-1709)), the seventh round-2 playtest bug fixed. Merged via [#2196](https://github.com/christianspliid-ui/threadbare/pull/2196).
- **2026-10-03: player text cleaned up** ([THR-1708](https://linear.app/threadbare/issue/THR-1708)): no doubled "the", spell names on the lines that report them, and a nudge only counts as yours when you played it. The sixth round-2 playtest bug fixed. Merged via [#2195](https://github.com/christianspliid-ui/threadbare/pull/2195).

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
