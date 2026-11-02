---
lane: tb-design-lane
run: 2026-11-02f
promoted: 1
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-02 (run f, ~17:20Z)

## Needs Christian

Nothing needs you. Your question from run e (should a sphere's pool show its limit as a number: a, b or c) is still open and still the briefing's one thing.

## Decided for you

All from [Card tags and the coloured circles beside card prices](https://linear.app/threadbare/issue/THR-2146/card-tags-and-the-coloured-circles-beside-card-prices-are-still-unread). Plan: [Every card says what it buys](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-02-thr-2146-every-card-says-what-it-buys.md). It is built as [the build ticket](https://linear.app/threadbare/issue/THR-2147/every-card-says-what-it-buys-a-result-line-for-cards-that-dont-move), which nobody may start before 05:00Z on 3 Nov.

- A card that does not move the odds (Balm, Cache, Kindled ambition, Compulsion) gets a line where the odds dots would be, saying exactly what it does: "Ends Elara's Wounded." The testers' complaint was not the tag names. It was that only Boost visibly did anything. Veto line: "no result line".
- Balm is not offered when the mortal has nothing for it to heal, so that hand is one card shorter. Today it costs three essence and does nothing. Veto line: "show Balm greyed out instead".
- The coloured circle beside a price goes. The word after the price already names the pool that pays, and the card's colour does too. The colour tint stays. Veto line: "keep the circle".
- An action card's skill mark moves away from the price and gets its word ("Iron"), so nothing beside the price is about anything but the price. Veto line: "keep the skill mark by the price".
- An action card shows one tag ("Change"), not two. The size word ("Local", "Cosmic") moves into that tag's hover. Veto line: "keep the size tag".
- What a played card did now shows in the Aftermath, as an ordinary result chip naming the mortal. The one exception is the Long Game's hidden mark, which stays hidden as designed. Veto line: "show the hidden mark too".

## Work

- **Chose** [Card tags and the coloured circles](https://linear.app/threadbare/issue/THR-2146/card-tags-and-the-coloured-circles-beside-card-prices-are-still-unread) as period-focus work. The ready shelf was at 3, below the floor of 4. [Legibility 2](https://linear.app/threadbare/issue/THR-2123), [3](https://linear.app/threadbare/issue/THR-2124) and [4](https://linear.app/threadbare/issue/THR-2125) are held until about 23:50Z behind the veto window on [Legibility 1](https://linear.app/threadbare/issue/THR-2122). [Can't read what they spend](https://linear.app/threadbare/issue/THR-2143) waits on your answer.
- **Measured** on `main` @ `d322ddd1`:
  - Every card tag already has a hover. Cold players do not hover.
  - 18 library cards move no odds and show nothing in the odds slot.
  - Balm is dealt whether or not the mortal is hurt.
  - A played card's write is applied, then forgotten: nothing records it for the Aftermath.
  - The price's coloured circle names the same sphere as the word beside it.
- **Gates:**
  - Intent judge: Revise twice, then Allow. Run 1 found no player-facing text table and an unkeyed grant kind. Run 2 found no blast-radius section for a 721-importer type file.
  - Three-pillar audit: FAIL, FAIL, then PASS-with-notes, on the same gaps.
  - NFP: PASS-with-notes (E3's carrier was unnamed, now fixed). Vision: PASS-with-notes (the ambition and compulsion lines now say what the god does).
- **Merged** [the plan PR](https://github.com/christianspliid-ui/threadbare/pull/2714). Plan-doc liveness: LIVE.
- **Filed** [Every card says what it buys](https://linear.app/threadbare/issue/THR-2147/every-card-says-what-it-buys-a-result-line-for-cards-that-dont-move) into the round-6 milestone. It is in Ready for Dev, unassigned, and holds until 05:00Z.
- **Closed** [Card tags and the coloured circles](https://linear.app/threadbare/issue/THR-2146/card-tags-and-the-coloured-circles-beside-card-prices-are-still-unread). Its Done-when ("implementation tickets are filed into this milestone and the design pass closes this ticket") is met.

## Escalations

None.
