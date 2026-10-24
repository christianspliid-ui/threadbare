---
lane: tb-design-lane
run: 2026-10-24b
promoted: 0
filed: 0
resolved: 2
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-24 (run b, ~07:25Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [A hand of five to eight cards hides cards under the hand bar](https://linear.app/threadbare/issue/THR-1942/a-hand-of-five-to-eight-cards-hides-cards-under-the-hand-bar-the-bar) — **the cards stay as they are.** They keep the full 16:9 picture and stay four to a row. A hand of five or more cards is two rows, and the encounter column scrolls inside the Stage panel. While any card is hidden under the commit bar, the bar says "2 more cards below", and one click shows the whole hand. *Veto:* "the whole hand should fit without scrolling, shrink the cards". That would change your Law 5 rule (the 16:9 picture on every card), and then a compact card face gets drawn.
- [A five-card hand on the Stage still makes the column scroll](https://linear.app/threadbare/issue/THR-1994/a-five-card-hand-on-the-stage-at-19201080-still-makes-the-encounter) — the same decision. The scroll stays, the hidden-cards line is added, and the ticket waits for your one-click close.

## Work

- **Claimed** both tickets (`design-lane claim 2026-10-24b`). No wayfinder map is open. The shelf is full: 22 ready per the [briefing](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md). The briefing has no lines from you, so there were no vetoes to apply. Every other plan-doc and decision candidate in Todo already had a lane decision. Both coordination blocks sent this layout call to the design lane.
- **Measured** on main @ 73f631c3:
  - The Stage's encounter column is 982 px tall at 1920×1080.
  - Two rows of cards (310 px each, 118 px of that the picture) and the hand bar take 724 px. Header and scene need about 456 px, so the column runs 279 px over.
  - The ways to make it fit all break something. A shorter picture breaks Law 5. Five or more cards per row breaks Law 33's four-per-row limit. Your 2026-10-04 layout pass set both.
  - The other ways don't free enough room: a 21:9 picture saves 56 px, and folding the step dots and title together saves about 50.
  - Hands deal 4 to 8 cards, so two-row hands come up in ordinary play.
  - Scrolling inside the panel at its full height is allowed by Laws 33 and 57.
- **Why this call:** the scroll itself does no harm. The harm is a fifth card under the bar that nothing points to. A one-line hint fixes that and leaves the card faces you like as they are.
- **Output:**
  - The decision record is on both tickets.
  - [The six-card ticket](https://linear.app/threadbare/issue/THR-1942/a-hand-of-five-to-eight-cards-hides-cards-under-the-hand-bar-the-bar) is rewritten as the build: a new title, the spec, the Done-when on two named encounters, and a coordination block sized for Sonnet.
  - It is in Todo, unassigned, `Claimable from: 2026-10-25T07:24:00Z` (the veto day).
  - The five-card ticket went back to Todo, unassigned. Its own Done-when allowed "the ticket records the decision to keep the scroll". No audit file or prototype was needed.
- **Not measured live:** the dev server was declined this run. All heights come from the five-card ticket's 2026-10-20 Playwright measurement of the shipped Stage, plus the constants in `CardFace.tsx`. The build's Done-when measures the result in the browser.

## Escalations

None.
