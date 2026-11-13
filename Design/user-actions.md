# User Action Required

**Last updated:** 2026-11-13 19:58 local (18:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077).

## Standing asks

### Sunday 8 – Thursday 12 Nov: was the computer off or the app closed, or was this a pause? (new 12 Nov)

The silence check says: "No scheduled Claude Code lane has written to origin/main or origin/ops since 2026-11-08T12:37:04.000Z — 103.2h of fleet-wide silence, past the 6h threshold, and no pause marker is set. Either the lanes are broken, or this is a deliberate pause that was never declared." Every lane restarted between 20:45 and 20:48 local on Thursday, and the worktree reaper (a separate Windows timer) was silent from 13:50 Sunday to 20:40 Thursday too, so it looks like the computer or app was off. **If so:** just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### Set the Claude app to open when Windows starts

[The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) read the computer's power log. Every time the computer started or woke recently, the lanes came back hours later. That points to the Claude app not reopening by itself. **Turning on "open at login" for the Claude app** closes these gaps without anyone noticing them. Only you can change that setting. Say "done" and the next silence check will confirm it.

Recent gaps: 16–17 Oct, 18–19 Oct (25 jobs ready), **21–23 Oct (48 hours)**, **29–30 Oct (40 hours)**, and **8–12 Nov (103 hours)**.

### Your writing-checks conversation can start (new 31 Oct)

[The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) reviewed every writing check against real lines, which is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. In short: the checks never see most of what players read (three in four encounters come from the old board, which the doctrine checks skip); the prose score takes points off plain stated facts; two word lists ("rather than", "on the way out") get in the way; one doctrine rule (a card's effect line never repeats a word from its name) has no check; the chip-length check is the most useful warning. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-31b.md)*

### Thursday 29 – Friday 30 Oct: was the computer off or the app closed, or was this a pause? (new 30 Oct)

The silence check says: "The scheduled lanes went silent for 40.3h (2026-10-29T01:56:50.000Z → 2026-10-30T18:17:35.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Every lane restarted in the same minute at 19:12 Friday, and the worktree reaper stopped at the same time, so it looks like the computer or app was off. **If so:** just say so. **If it wasn't:** say so, and it becomes a fault to chase.

### Wednesday 21 – Friday 23 Oct: was the app closed or the computer off, or was this a pause? (new 23 Oct)

The silence check says: "The scheduled lanes went silent for 48.1h (2026-10-21T21:07:01.000Z → 2026-10-23T21:15:17.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." The lanes all restarted in the same second at 23:11 Friday, and the worktree reaper stopped at the same time. **If so:** just say so. **If it wasn't:** say so, and it becomes a fault to chase.

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

- **2026-11-13: a mortal's lines in the Threads rail now wrap instead of cutting to "raising a p…", and it is live** ([THR-2193](https://linear.app/threadbare/issue/THR-2193)). Merged via [#2807](https://github.com/christianspliid-ui/threadbare/pull/2807).
- **2026-11-12: the writing check that wrongly failed every "master everyday" brief now reads only the shape column; all three master briefs pass** ([THR-1938](https://linear.app/threadbare/issue/THR-1938)). Merged via [#2804](https://github.com/christianspliid-ui/threadbare/pull/2804).
- **2026-11-12: several rulers' agendas coming due now fold into one toast that opens to each ruler's line, and it is live** ([THR-2194](https://linear.app/threadbare/issue/THR-2194)). Merged via [#2803](https://github.com/christianspliid-ui/threadbare/pull/2803).
- **2026-11-12: four small faults from playtest round 7 are fixed, and it is live** ([THR-2198](https://linear.app/threadbare/issue/THR-2198)). Merged via [#2802](https://github.com/christianspliid-ui/threadbare/pull/2802).
- **2026-11-12: popups now wait for the player's hand to go quiet instead of opening under it, and it is live** ([THR-2197](https://linear.app/threadbare/issue/THR-2197)). Merged via [#2801](https://github.com/christianspliid-ui/threadbare/pull/2801).
- **2026-11-12: The First's first chapter no longer contradicts itself, and it is live** ([THR-2196](https://linear.app/threadbare/issue/THR-2196)). Merged via [#2800](https://github.com/christianspliid-ui/threadbare/pull/2800).
- **2026-11-12: the shelf refilled without a direction call. Cold playtest round 7 and the weekly screen review filed new work, so "what should the design lane plan next?" is retired.** ([round 7](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-7.md))
- **2026-11-12: the bonding scene opens at its first line and fits one screen, and it is live** ([THR-2195](https://linear.app/threadbare/issue/THR-2195)). Merged via [#2799](https://github.com/christianspliid-ui/threadbare/pull/2799).
- **2026-11-08: a god's lean on a mortal who is away now waits for them to come back, with one honest "away" line, and it is live** ([THR-2189](https://linear.app/threadbare/issue/THR-2189)). Merged via [#2795](https://github.com/christianspliid-ui/threadbare/pull/2795).
- **2026-11-08: leftover mortal-summary code that only the deleted mortal panel used is gone; nothing changes on screen** ([THR-2192](https://linear.app/threadbare/issue/THR-2192)). Merged via [#2794](https://github.com/christianspliid-ui/threadbare/pull/2794).

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
