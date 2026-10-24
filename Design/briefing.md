# Briefing
**Generated:** 2026-10-24 17:56 local (15:56 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** The longest gap so far ended last night: no lane ran from about 23:07 Wednesday 21 Oct until 23:11 Friday 23 Oct. That is two whole days, with 20 jobs ready for the builder. The lanes all came back in the same second, which is what it looks like when the app reopens. Only you can change that setting. Say "done" and the next silence check will confirm it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (7)

- **Wednesday night to Friday night (21–23 Oct):** "The scheduled lanes went silent for 48.1h (2026-10-21T21:07:01.000Z → 2026-10-23T21:15:17.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed or the computer off, or was this a pause?
- **The two process cuts you approved on 15 Oct are stuck.** The unattended builder may not edit the gate and CI files that [THR-1947](https://linear.app/threadbare/issue/THR-1947) and [THR-1949](https://linear.app/threadbare/issue/THR-1949) change. Recommended: ship both in one session with you present, rather than widening the builder's permissions. *— from [daily-backlog-grooming](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/backlog-grooming-2026-10-24.md)*
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours with no pause recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Three player texts promise that mandates slow the doom clock](https://linear.app/threadbare/issue/THR-2004/three-player-texts-promise-that-mandates-slow-the-doom-clock-they-only): the words change, not the rules. Four tooltips and The Seat beat will stop saying a finished mandate slows the doom or gives essence. A well-kept mandate checkpoint softens the doom's next blow instead. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-24a.md)*
- [A hand of five to eight cards hides cards under the hand bar](https://linear.app/threadbare/issue/THR-1942/a-hand-of-five-to-eight-cards-hides-cards-under-the-hand-bar-the-bar): the cards stay as they are, a full 16:9 picture, four to a row, and the encounter column scrolls. While a card is hidden under the commit bar, the bar says "2 more cards below", and one click shows the whole hand. *Veto:* "the whole hand should fit without scrolling, shrink the cards". *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-24b.md)*
- [A five-card hand on the Stage still makes the column scroll](https://linear.app/threadbare/issue/THR-1994/a-five-card-hand-on-the-stage-at-19201080-still-makes-the-encounter): the same decision. The scroll stays, and the hidden-cards line is added. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-24b.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Backed up: 16 ready, 2 in progress.** [Hiring a free company](https://linear.app/threadbare/issue/THR-1974) merged at 15:41 UTC ([#2544](https://github.com/christianspliid-ui/threadbare/pull/2544)) and is live. The builder run that started at 15:42 UTC has taken the heavy-tests fix ([THR-2019](https://linear.app/threadbare/issue/THR-2019)) and is active.

- [Cut per-PR paperwork to one line](https://linear.app/threadbare/issue/THR-1947) is still parked and unassigned, 9 days after it was first claimed. It waits on your answer above, not on the builder.
- [The settlement-economy glossary terms](https://linear.app/threadbare/issue/THR-1924) and the two cross-run Dominion jobs ([echoes](https://linear.app/threadbare/issue/THR-1843), [widening choices](https://linear.app/threadbare/issue/THR-1844)) have not been touched for a week. The agents own these; most of that week is the silences above.

## Health

- Heavy tests have been red on main since 13:18 UTC, after the war-aims merge ([#2542](https://github.com/christianspliid-ui/threadbare/pull/2542)). Ticket [THR-2019](https://linear.app/threadbare/issue/THR-2019) is filed, and the builder is on it now. The live game is not affected.
- Everything else is green: main's CI, the three scheduled background jobs, no PR waiting to merge, engine speed back inside its normal range (168 ms/tick, +17% on the week's median), the worktree reaper ran at 17:40, and the live site is current ([82d6e70b](https://github.com/christianspliid-ui/threadbare/commit/82d6e70b)).
