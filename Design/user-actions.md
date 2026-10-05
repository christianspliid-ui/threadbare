# User Action Required

**Last updated:** 2026-10-05 16:56 local (14:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Was the app closed from Thursday ~17:00 to Friday ~13:45? (lane silence, 1–2 October, ended)

No lane ran for about 21 hours: the last brief went out Thursday 1 October 16:55, and lanes resumed Friday 2 October ~13:48, your time. The builder, design and grooming lanes all missed their slots. No pause marker covered it, and it was a weekday.

**If you were away or had the app closed:** nothing to do; just say so. **If you weren't:** say so, and it becomes a fault to chase.

### Were you away from Tuesday evening to Wednesday evening? (lane silence, 29–30 September, ended)

No scheduled lane ran for about 25 hours: from Tuesday 29 September ~19:30 to Wednesday 30 September ~20:20, your time. Nothing merged in that window, and every lane has now resumed on its own. No pause marker covered it, and it was a weekday.

**If you were away or had the app closed:** nothing to do; just say so. A marker at `~/.claude/threadbare-pause.json` keeps this off your list next time. **If you weren't:** say so, and it becomes a fault to chase.

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) read the computer's power log. **The 17 and 18 September stops are explained: the computer was asleep.** But on **14 and 15 September the computer was awake all day, and no lane started at all**. So either the Claude app was closed, or the lanes were switched off.

**If you were away or had the app closed:** nothing to do. **If you weren't:** say so, and it becomes a fault to chase.

### Fog or witness: does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-10-05: encounter summaries now read as player prose, not authoring prompts** ([THR-1739](https://linear.app/threadbare/issue/THR-1739/encounter-summaries-read-like-authoring-prompts-rewrite-designer-voice)), your Granary Riot finding. Its conflict was cleared by the builder; merged via [#2239](https://github.com/christianspliid-ui/threadbare/pull/2239) at 15:53.
- **2026-10-05: the commit button stays on screen when a five-card hand wraps** ([THR-1732](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls)). Merged via [#2242](https://github.com/christianspliid-ui/threadbare/pull/2242) at 15:18.
- **2026-10-05: a mortal with a promise no longer starts a two-step job it can't finish** ([THR-1737](https://linear.app/threadbare/issue/THR-1737/a-departing-mortal-starts-a-two-step-encounter-and-misses-its)). Its conflict was cleared by the builder; merged via [#2235](https://github.com/christianspliid-ui/threadbare/pull/2235) at 11:08 and live.
- **2026-10-05: Tend to Wounds and Old Blood now tell one ending per result** ([THR-1741](https://linear.app/threadbare/issue/THR-1741/two-encounters-tell-a-different-ending-in-different-places-tend-to)). Merged via [#2240](https://github.com/christianspliid-ui/threadbare/pull/2240) at 07:59.
- **2026-10-05: the world now arrives with its first beat already open** ([THR-1716](https://linear.app/threadbare/issue/THR-1716/the-world-arrives-paused-with-no-direction-after-ascend-nothing-says)). Its veto window closed at 08:45 with no veto; merged via [#2238](https://github.com/christianspliid-ui/threadbare/pull/2238) and live.
- **2026-10-05: every encounter now has a stakes line, and the veil never shows the designer's description** ([THR-1728](https://linear.app/threadbare/issue/THR-1728/author-stakes-for-every-encounter-template-and-make-the-stakes-line)). Merged via [#2234](https://github.com/christianspliid-ui/threadbare/pull/2234) at 07:59; the raw `{cast:drover}` text fix ([THR-1738](https://linear.app/threadbare/issue/THR-1738/the-encounter-test-panel-shows-castdrover-literally-carryover-factor)) followed via [#2236](https://github.com/christianspliid-ui/threadbare/pull/2236) at 08:35.
- **2026-10-05: master-level everyday work is in town** ([THR-1688](https://linear.app/threadbare/issue/THR-1688/content-above-novice-s7b-master-everyday-encounters-1-per-reach-once)): eight master encounters, one per Reach. Merged via [#2232](https://github.com/christianspliid-ui/threadbare/pull/2232) at 06:40 and live.
- **2026-10-05: a mortal about to leave town no longer starts local encounters that break its promise** ([THR-1736](https://linear.app/threadbare/issue/THR-1736/a-departing-mortal-starts-local-encounters-that-break-its-promise-the)). Merged via [#2231](https://github.com/christianspliid-ui/threadbare/pull/2231) at 04:37 and live.
- **2026-10-05: the fair draw for experts is live** ([THR-1687](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert)). Its veto window closed at 02:45 with no veto; merged via [#2180](https://github.com/christianspliid-ui/threadbare/pull/2180) and deployed.
- **2026-10-04: the rulebook clean-up merged** ([THR-912](https://linear.app/threadbare/issue/THR-912/drift-scan-2026-10-02-rulebook-ul-9-ul-references-broken-in-rulebook), [THR-913](https://linear.app/threadbare/issue/THR-913/drift-scan-2026-10-02-rulebook-impl-tags-9-impl-tags-with-broken-code)). Its clash with main was cleared by the builder, and it merged via [#2227](https://github.com/christianspliid-ui/threadbare/pull/2227) at 23:00.

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
