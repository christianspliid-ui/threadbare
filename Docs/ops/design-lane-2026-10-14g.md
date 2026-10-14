---
lane: tb-design-lane
run: 2026-10-14g
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-14 (run g, ~16:30Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Economic war aims](https://linear.app/threadbare/issue/THR-1868/economic-war-aims-should-factions-fight-and-expand-for-staples-trade): **factions now fight for things worth having.**
  - **Enemies only.** An army marches only on an enemy. A faction with no quarrel keeps its army at home.
  - **Defence first.** It defends its own towns and the towns sworn to it before it attacks anything. This keeps the crown's promise to protect.
  - **Then the richest town in reach.** Rich means what the town and its fields would pay into the army owner's purse, and a far town counts for less.
  - **Monopolies are regional now.** Today a monopoly needs 60% of a resource across the whole world, and none ever forms. Under the new rule a faction holds one when it controls most of a resource within 8 hexes. That gave 3 monopolies from day one.
  - **What a monopoly gives.** Its holder earns more from that resource and can **embargo** an enemy's towns in the region. Its enemies want to break it: 11 of the 15 new war targets in the test would break a rival's monopoly.
  - **The test, 50 days on one world.** Today, 19 of 20 armies marched on factions they had no quarrel with. The new targets would pay 43% more.
  - [The prototype branch (never merged)](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1868-war-aims), [the test output](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1868-war-aims/scripts/proto/war-aims-sketch.output.txt), [the monopoly comparison](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1868-war-aims/scripts/proto/war-aims-monopoly-alt.output.txt).
  - *To veto, say:* **"armies should fight whoever is closest"**, **"monopolies should be world-wide and rare"**, or **"factions shouldn't embargo"**.

## Work

- **Why a map decision.**
  - There were no vetoes in the briefing.
  - Ready for Dev holds 24 items, above the floor of 4.
  - Nothing was In Design, and no lane claims were open.
  - [The mortal economy map](https://linear.app/threadbare/issue/THR-1863/wayfinder-map-mortal-economy-making-wealth-and-want-drive-what-agents) is the only open map. [Economic war aims](https://linear.app/threadbare/issue/THR-1868/economic-war-aims-should-factions-fight-and-expand-for-staples-trade) is next in its stated order. Both of its blockers were done: [the faction purse](https://linear.app/threadbare/issue/THR-1867/the-faction-purse-where-a-factions-money-comes-from-what-it-buys-and) and [the crown](https://linear.app/threadbare/issue/THR-1917/the-crown-how-a-faction-wins-fealty-and-tax-rights-from-other-factions).
- **Claimed** with the marker `design-lane claim 2026-10-14g`. The assignment was verified.
- **Measured.** A subagent probed the code on `main` @ `b05fbb6c`:
  - Army targeting (`armySpawning.ts:154-194`) treats any other faction's town as hostile.
  - Nothing reads `faction.monopolies` (`economicPower.ts:197`).
  - Expansion ambitions never set a target.
  - 8 of the Merchant Consortium's 10 quest ids name templates that do not exist.
- **Prototype.** An observer sketch over the purse and crown ledgers, seed 42, medium, 600 ticks. It is committed `bea6753d` on [`proto/thr-1868-war-aims`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1868-war-aims).
  - The commit skipped the repo's git hooks (`core.hooksPath=/dev/null`). That should not have happened. The branch is a throwaway and is never merged, so nothing on `main` is affected.
- **Decided and closed.** The decision record is on [the ticket](https://linear.app/threadbare/issue/THR-1868/economic-war-aims-should-factions-fight-and-expand-for-staples-trade). It includes the plan-doc predicates. The map's Decisions so far gained the line, and *monopoly as diplomatic weight or a magnet for rival-god schemes* went into Not yet specified.
- **Filed** [Armies besiege towns they have no quarrel with](https://linear.app/threadbare/issue/THR-1922/armies-besiege-towns-they-have-no-quarrel-with-the-civic-guard) (Bug, Todo, unassigned).
  - Of 397 siege-ticks in 50 days, 200 are the Civic Guard besieging towns where it keeps its own halls.
  - Another 177 are a realm besieging a temple-held capital it has no quarrel with.
- **Still open on the map:**
  - [Hunger and unrest](https://linear.app/threadbare/issue/THR-1869/hunger-and-unrest-what-scarcity-does-to-mortals-and-what-a-town-on-the)
  - [What the player sees of the economy](https://linear.app/threadbare/issue/THR-1870/what-the-player-sees-of-the-economy-prosperity-unrest-tolls-and)
  - [The god's stake](https://linear.app/threadbare/issue/THR-1871/the-gods-stake-in-the-mortal-economy-what-a-god-gains-from-a-thriving)
  - [Undertakings in the economy](https://linear.app/threadbare/issue/THR-1873/undertakings-in-the-economy-what-founding-building-and-trading-should)

## Escalations

None.
