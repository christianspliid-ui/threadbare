---
lane: tb-design-lane
run: 2026-11-03a
promoted: 1
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-03 (run a, ~23:20Z on 2 Nov)

## Needs Christian

Nothing needs you.

## Decided for you

All from [On a running clock a chapter step still answers nothing on screen](https://linear.app/threadbare/issue/THR-2136/recurs-after-fix-on-a-running-clock-a-chapter-step-still-answers). Plan: [The answer comes here](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-03-thr-2136-the-answer-comes-here.md). Built as [The answer comes here](https://linear.app/threadbare/issue/THR-2151/the-answer-comes-here-after-play-a-chapter-step-stays-on-the-stage), which nobody may start before 11:35Z on 3 Nov.

- After you press Play on a chapter step, the chapter stays on screen even when time is running. The card reads "Played: Boost." and "The world turns. The answer comes here." Time keeps running underneath it, and nothing pauses. Veto line: "close the chapter after Play as before".
- When the step plays out, its answer opens in the same place: "Step 1 held. You: Boost." for a middle step, or the chapter's ending after the last one. The map never shows in between. Veto line: "show the answer on the map instead".
- The chapter's own answer goes before any premonition or other moment that turned up while you waited. Those wait their turn; nothing is lost. In round 6 a premonition came first and the ending arrived about 20 seconds late. Veto line: "let premonitions go first".
- "Back to the map" stays on the card as the way out. "Let the world turn" does not show there, because the world is already turning. Veto line: "keep both buttons".
- If testers say the waiting card blocks the map, the map behind it gets undimmed while it waits. If a tester still sees no result, the next step would pause time on Play. That reverses your no-forced-pause rule, so it comes back to you first.

## Work

- **Chose** [On a running clock a chapter step still answers nothing on screen](https://linear.app/threadbare/issue/THR-2136/recurs-after-fix-on-a-running-clock-a-chapter-step-still-answers). It is UI-usability focus work, raised by all 3 round-6 testers and recurring for the fourth round. The ready shelf held 3, below the floor of 4. [Legibility 2](https://linear.app/threadbare/issue/THR-2123), [3](https://linear.app/threadbare/issue/THR-2124) and [4](https://linear.app/threadbare/issue/THR-2125) were still held behind [Legibility 1](https://linear.app/threadbare/issue/THR-2122)'s veto window, which ends at 23:50Z.
- **Measured** on `main` @ `1d67ef29`:
  - The close is deliberate: the running-clock switch is off.
  - The existing answering card holds the clock. Turning it on alone would pause a running world, which is the opposite of the fix.
  - A step plays out in at most 8 ticks, 1–8 s at speed 1.
  - Any ready premonition blocks every chapter beat. That explains the late ending.
- **Gates:**
  - Intent judge: Revise twice (an engine-file wording slip; the before/after lines quoted, not described), then Allow.
  - Three-pillar audit: FAIL (it read the draft before the handoff sections were written), then PASS-with-notes.
  - NFP: PASS-with-notes. The premonition wait now shows in the debug state.
  - Vision: PASS-with-notes. The waiting card must stay light: two lines, nothing to read.
  - The docs gates are green.
- **Merged** [the plan PR](https://github.com/christianspliid-ui/threadbare/pull/2720). Plan-doc liveness: LIVE.
- **Filed** [The answer comes here](https://linear.app/threadbare/issue/THR-2151/the-answer-comes-here-after-play-a-chapter-step-stays-on-the-stage) into *Cold playtest · round 6*. It is in Ready for Dev, unassigned, held until 11:35Z on 3 Nov.
- **Closed** [On a running clock a chapter step still answers nothing on screen](https://linear.app/threadbare/issue/THR-2136/recurs-after-fix-on-a-running-clock-a-chapter-step-still-answers). Its Done-when is met.

## Escalations

None.
