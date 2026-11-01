# User Action Required

**Last updated:** 2026-11-02 00:58 local (23:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

Recent gaps: 12–13 Oct overnight (03:57–13:57), Thursday 15 Oct (14:50–20:44), Friday 16 into Saturday 17 Oct (18:31–11:34, 21 jobs ready), Sunday 18 into Monday 19 Oct (20:26 Sunday – about 19:42 Monday, 25 jobs ready), **Wednesday 21 into Friday 23 Oct (about 23:07 Wednesday – 23:11 Friday, 48 hours, 20 jobs ready)**, and **Thursday 29 into Friday 30 Oct (about 02:57 Thursday – 19:12 Friday, 40 hours)**.

### Your writing-checks conversation can start (new 31 Oct)

[The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) reviewed every writing check against real lines, which is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. In short: the checks never see most of what players read (three in four encounters come from the old board, which the doctrine checks skip); the prose score takes points off plain stated facts; two word lists ("rather than", "on the way out") get in the way; one doctrine rule (a card's effect line never repeats a word from its name) has no check; the chip-length check is the most useful warning. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-31b.md)*

### Thursday 29 – Friday 30 Oct: was the computer off or the app closed, or was this a pause? (new 30 Oct)

The silence check says: "The scheduled lanes went silent for 40.3h (2026-10-29T01:56:50.000Z → 2026-10-30T18:17:35.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Every lane restarted in the same minute at 19:12 Friday, and the worktree reaper (a separate Windows timer) stopped at the same time, so it looks like the computer or app was off. **If so:** just say so. **If it wasn't:** say so, and it becomes a fault to chase.

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

- **2026-11-01: the ceremonies (the harvest, the end of the age, the threading rite) now lead with art, and it is live** ([THR-2102](https://linear.app/threadbare/issue/THR-2102/art-led-pass-slice-6-the-ceremonies-and-the-front-door-meeting-the)). Merged via [#2693](https://github.com/christianspliid-ui/threadbare/pull/2693).
- **2026-11-01: the dialogs (chapter ledger, what your act bought) now lead with art, and it is live** ([THR-2101](https://linear.app/threadbare/issue/THR-2101/art-led-pass-slice-5-the-dialogs-chapter-ledger-what-your-act-bought)). Merged via [#2690](https://github.com/christianspliid-ui/threadbare/pull/2690).
- **2026-11-01: type-size question handed to the design lane** ("Let the design lane do the work", Discord 19:04). [THR-2118](https://linear.app/threadbare/issue/THR-2118/type-hierarchy-can-a-player-tell-title-heading-value-and-label-apart) is no longer reserved; the design lane decides it and invites your veto.
- **2026-11-01: the Stage moments (encounter, premonition, vision, story beat, new power, undertaking) now lead with art, and it is live** ([THR-2100](https://linear.app/threadbare/issue/THR-2100/art-led-pass-slice-4-the-stage-moments-encounter-premonition-vision)). Merged via [#2686](https://github.com/christianspliid-ui/threadbare/pull/2686).
- **2026-11-01: the cheap town cards now push a god's first sphere far enough to reach the Mandate, and it is live** ([THR-2094](https://linear.app/threadbare/issue/THR-2094/cheap-place-cards-plateau-reshapepreservebind-first-sphere-reaches-26)). Merged via [#2678](https://github.com/christianspliid-ui/threadbare/pull/2678).
- **2026-11-01: the god rail and the top bar now lead with art, and it is live** ([THR-2099](https://linear.app/threadbare/issue/THR-2099/art-led-pass-slice-3-the-god-rail-and-the-top-bar)). Merged via [#2683](https://github.com/christianspliid-ui/threadbare/pull/2683).
- **2026-11-01: the rulebook's monthly review (14 fixes to the rules text) is merged** ([THR-2112](https://linear.app/threadbare/issue/THR-2112/rulebook-review-2026-11-14-findings)). Merged via [#2677](https://github.com/christianspliid-ui/threadbare/pull/2677).
- **2026-11-01: a faction's page now lists the reputations its living members hold, and it is live** ([THR-2111](https://linear.app/threadbare/issue/THR-2111/faction-page-reputations-they-hold-reads-a-property-nothing-writes)). Merged via [#2675](https://github.com/christianspliid-ui/threadbare/pull/2675).
- **2026-11-01: every other Inspector page (places, lands, factions, armies, relics, the god, cards, records) now leads with its art, and it is live** ([THR-2098](https://linear.app/threadbare/issue/THR-2098/art-led-pass-slice-2-every-other-inspector-page-places-lands-factions)). Merged via [#2674](https://github.com/christianspliid-ui/threadbare/pull/2674).
- **2026-11-01: the ten most-met encounters now read in the new story-text style, and it is live** ([THR-2105](https://linear.app/threadbare/issue/THR-2105/story-text-quality-in-encounters-read-the-prose-the-way-a-player-meets), slice 1). Merged via [#2672](https://github.com/christianspliid-ui/threadbare/pull/2672).

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
