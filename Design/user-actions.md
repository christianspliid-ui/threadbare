# User Action Required

**Last updated:** 2026-10-04 10:55 local (08:55 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### A finished change stuck for 29 hours: the fair draw for experts ([#2180](https://github.com/christianspliid-ui/threadbare/pull/2180), [THR-1687](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert))

The armed-PR check escalated it: *"A finished change has been stuck for 29 hours and cannot merge on its own: PR #2180 … has a conflict that repeated automated attempts have not cleared. Nothing is broken on the live site, but that work is not reaching it."*

**You don't need to do anything.** It is held on purpose until its veto window closes (~02:45 Monday). After that, a builder clears the conflict. The code is safe on the pull request.

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

- **2026-10-04: the playthrough is paused until your morning findings are built** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)). You played The Unsafe Bridge, and four jobs came out of it ([THR-1724](https://linear.app/threadbare/issue/THR-1724/encounter-screen-christians-2026-10-04-layout-pass-169-card-art-skill), [THR-1725](https://linear.app/threadbare/issue/THR-1725/remove-the-threads-placeholder-lines-from-encounters-show-nothing), [THR-1726](https://linear.app/threadbare/issue/THR-1726/the-unsafe-bridge-the-keepers-name-is-missing-from-the-scene-prose-the), [THR-1727](https://linear.app/threadbare/issue/THR-1727/encounter-stakes-line-one-formula-sentence-replaces-the-summary-and)). The invitation comes back once all four are live.
- **2026-10-04: the seeded spell generator is unstuck** ([#2178](https://github.com/christianspliid-ui/threadbare/pull/2178)). A builder cleared its clash. (Update 10:55: its tests now fail, so it is back with a builder.)
- **2026-10-04: the word *Tradition* is now in the game glossary** ([THR-1701](https://linear.app/threadbare/issue/THR-1701)). Merged via [#2210](https://github.com/christianspliid-ui/threadbare/pull/2210).
- **2026-10-04: an encounter choice the god can't afford can no longer be played** ([THR-1720](https://linear.app/threadbare/issue/THR-1720/an-authored-encounter-choice-the-god-cant-afford-is-still-playable)). Merged via [#2205](https://github.com/christianspliid-ui/threadbare/pull/2205).
- **2026-10-04: a descendant can want the old homeland back** ([THR-1658](https://linear.app/threadbare/issue/THR-1658/a-descendant-can-want-the-old-homeland-back-a-reclaim-homeland-rule)): the "Raise the Old Banner" ambition. Merged via [#2208](https://github.com/christianspliid-ui/threadbare/pull/2208).
- **2026-10-04: the encounter-nudge reader sees what a spawn opened** ([THR-893](https://linear.app/threadbare/issue/THR-893/spawnnudgeexemplar-opens-a-stage-getencounternudges-cannot-see-the-two)), a review-tool fix. Merged via [#2209](https://github.com/christianspliid-ui/threadbare/pull/2209).
- **2026-10-04: the missing "X begins Y" news line is fixed** ([THR-1722](https://linear.app/threadbare/issue/THR-1722/a-mortal-who-begins-a-new-catalogue-encounter-crashes-the-rest-of-its)): a mortal starting one of the 86 new-catalogue encounters, including your slice encounters, is announced and recorded again. Merged via [#2207](https://github.com/christianspliid-ui/threadbare/pull/2207).
- **2026-10-04: an apex monster's card now names the apex** ([THR-1698](https://linear.app/threadbare/issue/THR-1698/an-apex-monsters-card-line-reaches-prose-only-the-fight-header-and)), not just the fight header. Merged via [#2204](https://github.com/christianspliid-ui/threadbare/pull/2204).
- **2026-10-04: a rival's strike now plays out as an encounter** ([THR-1703](https://linear.app/threadbare/issue/THR-1703/the-rival-strike-has-no-encounter-author-shadowrival-strike-so)): it is held where it cannot land, and both worst-case endings show and write the same harm. Merged via [#2203](https://github.com/christianspliid-ui/threadbare/pull/2203).
- **2026-10-03: timed conditions now end on time** ([THR-1697](https://linear.app/threadbare/issue/THR-1697)): a timed condition never lands permanent by accident. Merged via [#2202](https://github.com/christianspliid-ui/threadbare/pull/2202).

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
