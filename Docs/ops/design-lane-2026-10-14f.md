---
lane: tb-design-lane
run: 2026-10-14f
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-14 (run f, ~13:18Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Should goods flow](https://linear.app/threadbare/issue/THR-1866/should-goods-flow-a-fixed-stock-map-with-shocks-today-slow-regrowth): **food and goods regrow and get used up, and each town eats from the fields around it. A town's fields become something worth fighting over.** Today 22 of 38 towns hold no food stock at all, so they can never go hungry. Blights scar a stock for good, and the trade roads link towns to towns and carried no food in the test. In the new model, stocks regrow and get used each day, and a town draws food from the open land within 3 hexes, the hungriest town first. In the 50-day test that fed 17 towns from 18 fields, and 7 hamlets grew into towns or cities (none grew in any other version). When one town lost its field, its grain fell from 31 to 12 and its fish ran out. Goods moving along trade roads waits until there are enough roads to carry them. [The prototype branch (never merged)](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1866-goods-flow), [the test output](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1866-goods-flow/scripts/proto/goods-flow-sketch.output.txt). *To veto, say:* **"goods should move along the trade roads; the roads are the story"**, **"keep stocks fixed and make the shocks bigger"**, or **"towns should only eat what lies inside their own walls"**.

## Work

- **Claimed** [Should goods flow](https://linear.app/threadbare/issue/THR-1866/should-goods-flow-a-fixed-stock-map-with-shocks-today-slow-regrowth): the next ticket in the [mortal economy map](https://linear.app/threadbare/issue/THR-1863/wayfinder-map-mortal-economy-making-wealth-and-want-drive-what-agents)'s stated order (purse → crown → goods flow). It also unblocks three tickets: hunger and unrest, the money-encounter table, and undertakings in the economy.
- **Prototype:** seven in-loop variants on seed 42, medium, 600 ticks: today, (a) shocks, (b) regrowth, (c) lane flow, lane flow with a cut, (b) + hinterland, and hinterland with a field lost. Stocks change once a day between ticks, so the engine's own tiers, prosperity and scarcity arcs react. A first pass of lane flow drained the sending towns into 6 famines. It was rerun with a rule that a sender keeps its own need, and both outputs are kept. Committed `9d97e707` on [`proto/thr-1866-goods-flow`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1866-goods-flow).
- **Decided and closed** with the decision record on the ticket. The map's Decisions so far gained the line. *Goods along trade lanes* went into Not yet specified, waiting on lane density.
- **Filed** [Scarcity arcs jam](https://linear.app/threadbare/issue/THR-1919/scarcity-arcs-jam-three-towns-hold-all-three-arc-slots-at-flashpoint) (Bug, Todo, unassigned). The world-wide cap is 3 arcs, and a flashpoint holds for as long as the town stays scarce. In today's game, three towns are at flashpoint by day 4, and until day 50 the slots only pass among them and one more town. No other famine can start an arc.
- **Now workable on the map:** [Hunger and unrest](https://linear.app/threadbare/issue/THR-1869/hunger-and-unrest-what-scarcity-does-to-mortals-and-what-a-town-on-the), [the money-encounter table](https://linear.app/threadbare/issue/THR-1872/which-of-the-65-money-encounters-should-change-the-economy-an-outcome), [undertakings in the economy](https://linear.app/threadbare/issue/THR-1873/undertakings-in-the-economy-what-founding-building-and-trading-should), and [economic war aims](https://linear.app/threadbare/issue/THR-1868/economic-war-aims-should-factions-fight-and-expand-for-staples-trade), which now has fields as a war aim to weigh.

## Escalations

None.
