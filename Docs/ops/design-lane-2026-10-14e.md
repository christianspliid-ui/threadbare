---
lane: tb-design-lane
run: 2026-10-14e
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-14 (run e, ~10:20Z)

## Needs Christian

Nothing needs your decision. The open question from charting still stands: are any of [the mortal economy map](https://linear.app/threadbare/issue/THR-1863/wayfinder-map-mortal-economy-making-wealth-and-want-drive-what-agents)'s questions yours alone? Until you answer, the lane works the unreserved ones with a veto, as below.

## Decided for you

- [What money means to a mortal](https://linear.app/threadbare/issue/THR-1865/what-money-means-to-a-mortal-which-choices-a-mortals-wealth-should) — **money becomes something a mortal wants first, and something they spend later.**
  - **Means from birth.** Every mortal who makes choices starts with Means set by their walk of life. Today the mortals who choose, your First among them, have none at all.
  - **Poverty and greed pull toward paying work.** A poor mortal leans toward trade, theft, hired work, a town's yield, a toll or a freehold. A greedy one leans that way even when rich. A generous one feels the pull less. A wealthy mortal who is not greedy turns to other things.
  - **Costs come later.** Founding a town, a place or a trade lane will cost Means, but only once paying work actually pays. In the test, charging first nearly stopped all founding: costed starts fell from 9 to 1, and a poor mortal never saved enough.
  - **The odds stay yours.** Mortals still take on what they forecast at 50–65%. Need changes *what* they reach for, not how long the odds are.
  - **"The rich hire the poor"** has no mechanism yet. It goes on the map beside the faction purse.
  - Links: [the decision and its numbers](https://linear.app/threadbare/issue/THR-1865/what-money-means-to-a-mortal-which-choices-a-mortals-wealth-should), [the prototype branch (never merged)](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1865-means-want), [the test output](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1865-means-want/scripts/proto/means-want-sketch.output.txt).
  - *To veto, say:* **"a mortal's purse should limit what they try from day one"**, **"desperate mortals should take worse odds"**, or **"leave money out of what mortals want"**.

## Work

- **Why a map decision.**
  - Ready for Dev holds about 22 items, above the floor of 4.
  - There were no vetoes in the briefing.
  - Five plan-doc tickets sit In Design, assigned to the shared user, with no lane marker. They belong to another session that is writing them now, so the lane skipped them: [screen frame](https://linear.app/threadbare/issue/THR-1875/plan-doc-the-screen-frame-top-bar-with-needs-you-the-god-rail-with-the), [Inspector](https://linear.app/threadbare/issue/THR-1876/plan-doc-the-inspector-one-docked-panel-for-every-place-person-and), [encounter Stage](https://linear.app/threadbare/issue/THR-1877/plan-doc-the-encounter-stage-a-mortals-moment-plays-over-the-dimmed), [lenses and chrome](https://linear.app/threadbare/issue/THR-1878/plan-doc-map-lenses-and-map-chrome-dominion-threads-trouble-trade-and), [type and icons](https://linear.app/threadbare/issue/THR-1879/plan-doc-type-and-icons-rollout-ship-alegreya-the-label-rule-and-the).
  - [The mortal economy map](https://linear.app/threadbare/issue/THR-1863/wayfinder-map-mortal-economy-making-wealth-and-want-drive-what-agents) is the only open map. Its first frontier ticket, [THR-1865](https://linear.app/threadbare/issue/THR-1865/what-money-means-to-a-mortal-which-choices-a-mortals-wealth-should), had no blocker and blocks two others ([hunger and unrest](https://linear.app/threadbare/issue/THR-1869/hunger-and-unrest-what-scarcity-does-to-mortals-and-what-a-town-on-the), [undertakings in the economy](https://linear.app/threadbare/issue/THR-1873/undertakings-in-the-economy-what-founding-building-and-trading-should)).
- **Claimed** with the marker `design-lane claim 2026-10-14e`. The assignment was verified.
- **Measured** on `main` @ `acad350b`, seed 42, with a subagent substrate probe through the headless CLI:
  - Only spotlight mortals choose (`phaseAgentDecision.ts:572-582`), and they skip wealth hydration. At t300, 0 threaded mortals carry wealth.
  - No path spends a mortal's wealth.
  - Pack `wealthCost` is unreachable under the cells model.
  - Earning work wins 17 of 1,651 board decisions.
- **Prototype:** [`proto/thr-1865-means-want` @ d7b23e57](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1865-means-want), pushed and never merged. It adds birth Means, the want and cell costs, and runs on and off for 300 ticks:
  - Costed starts fell from 9 to 1.
  - Getting-by deciders took a median of 240 ticks to reach Comfortable (4 of 19 got there).
  - Median decider wealth rose from 8 to 20 at t300.
- **Judged** against Christian's purpose statement, the "never recreate the early-game traps" ruling and the 50–65% forecast-window ruling ([forecast window](https://linear.app/threadbare/issue/THR-1575)), and the absolute-motivations ruling ([desire score](https://linear.app/threadbare/issue/THR-1525)). The decision record is on the ticket.
- **Closed** [THR-1865](https://linear.app/threadbare/issue/THR-1865/what-money-means-to-a-mortal-which-choices-a-mortals-wealth-should) as Done (verified). The gist is appended to the map's Decisions so far.
- **Graduated:** patronage (the rich hire the poor) goes into the map's *Not yet specified* section, beside [the faction purse](https://linear.app/threadbare/issue/THR-1867/the-faction-purse-where-a-factions-money-comes-from-what-it-buys-and). No new ticket was filed: birth Means and the want go into the map's carve-up plan doc, so nothing gets built inside the veto window.

## Escalations

None.
