---
lane: tb-design-lane
run: 2026-11-13b
promoted: 2
filed: 4
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-13 (run b, ~08:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Give both clocks a verb](https://linear.app/threadbare/issue/THR-2202) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-13-thr-2202-give-both-clocks-a-verb.md)). Each threat now has an answer the player can play, paid from the same essence as the nudge cards:
  - **The Mandate:** when a mortal bound to you finishes a chapter, the Mandate goes up. It goes up a little when the chapter is in one of the Mandate's spheres, and more when you played cards of those spheres in it. The goal word now shows the last day ("Rising", "Holding", "Slipping") instead of sitting at "Holding" all run. Say "veto Mandate deeds" to keep it counting only your own hand.
  - **Doom:** a new card, *Stay the Unmaking*, which you get at the first Doom stage. While you hold it, Doom runs at three-quarters speed, and it draws on your essence every day. It never stops Doom. The Doom notice gets a "Stay it" button. Say "veto Stay the Unmaking" to keep Doom unanswerable.
  - **Rivals:** a new card, *Rebuke*, which you get the first time a rival's blow lands on your ground. You play it on the place the rival just pressed. The place holds against that rival for a few days, some of what was taken comes back, and the rival's temper rises. The toast's "Tend it and the next blow breaks" promised something the game never did, and now says only what is true. Say "veto Rebuke" to keep tending as the only answer.
  - The three build tickets are held for your veto until 20:43 UTC today: [Stay the Unmaking](https://linear.app/threadbare/issue/THR-2207), [A bound mortal's deeds fill the Mandate](https://linear.app/threadbare/issue/THR-2208), [Rebuke](https://linear.app/threadbare/issue/THR-2209).

## Work

- **Unit chosen:** a plan doc (rule 1, shelf thin: one non-Deferral item in Ready for Dev). [Make the purse bite](https://linear.app/threadbare/issue/THR-2201) is held by a live sibling lane run (claimed 07:47Z, files written minutes before this run started), so this run did not touch it. [Give both clocks a verb](https://linear.app/threadbare/issue/THR-2202) is agreed (your "Yes, file them", 12 Nov) and says its design can proceed in parallel. There was no UI-focus candidate: the two open UI tickets are your own icon picks.
- **Claimed** with marker `design-lane claim dl-20261113T0820Z`. Measured the code first:
  - The Mandate already counts a bound mortal's scenes, but only as tiny sphere pushes. An earlier plan measured their share at zero, and the "Holding" word is a 2% cumulative threshold, not a trend.
  - The rulebook says essence slows Doom. The code path exists, but no card uses it.
  - **A Doom bug:** an active speed multiplier is saved back every tick, so it compounds. The build fixes it before adding the new card.
  - The rival toast's "next blow breaks" is prose only. The 6 Nov rival plan named a counter-card as its next step if testers still could not act, and the 12 Nov session showed they could not.
- **Gates:**
  - The intent judge returned Revise four times, each fixed: player-text table; two trend-word tables that disagreed; the Doom floor on the wrong code path; pools named; before-roll stakes lines. Its fifth verdict was Allow.
  - Audits: rules (NFP) and three-pillar both PASS-with-notes. Vision returned REVISE first (numbers in player prose, now rewritten in words), then PASS-with-notes.
  - `npm run gate -- --final` passed on the docs track.
- **Plan doc** in [PR #2806](https://github.com/christianspliid-ui/threadbare/pull/2806), merging automatically. Filed:
  - three build tickets, each with `Claimable from: 2026-11-13T20:43:00Z`;
  - the vocabulary proposal, [UL proposal: Rebuke, Stay the Unmaking, "Slipping"](https://linear.app/threadbare/issue/THR-2210).
- **Ticket states:** [Stay the Unmaking](https://linear.app/threadbare/issue/THR-2207) and [A bound mortal's deeds fill the Mandate](https://linear.app/threadbare/issue/THR-2208) are in Ready for Dev. [Rebuke](https://linear.app/threadbare/issue/THR-2209) waits in Todo behind Stay the Unmaking, because they share card files. The design ticket goes back to Todo, blocked by the three builds, as the 6 Nov rival plan did.

## Escalations

None.
