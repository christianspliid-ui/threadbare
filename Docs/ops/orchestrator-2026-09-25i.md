---
lane: tb-orchestrator
run: 2026-09-25i
promoted: 0
filed: 6
resolved: 2
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-25 (run i, ~09:29–09:49Z)

## Needs Christian

Nothing needs you. Two more questions on your [living-world map](https://linear.app/threadbare/issue/THR-1589/map-a-world-that-starts-alive-people-ties-and-a-past-at-game-start-and) now have answers.

**[What the player actually meets](https://linear.app/threadbare/issue/THR-1590/what-the-player-actually-meets-measure-the-attended-view-and-the).** With The First bonded and no clicks, the player reads about 7 encounters in the first 150 ticks. All of them come from The First, and none gives you a hand to play. On one seed The First wandered for 90 ticks before its first encounter.

Every social, tavern and secret encounter is written but never fires, because a filter cuts them all. That bug is queued: [social encounters never pass the filter](https://linear.app/threadbare/issue/THR-1614/social-tavern-scene-and-secret-encounters-never-pass-the-filter-cap).

The dice otherwise land the same way whether a player is watching or not. So the plan to write where the dice land still stands.

**[Seeded things that die](https://linear.app/threadbare/issue/THR-1595/seeded-things-that-die-trade-lanes-that-decay-to-zero-reputation-never).** Every trade lane dies at exactly tick 36, because nothing ever trades along it. Most other "dead" things are simply rare, or were never real things at all. Five plain bugs are queued for the builder:
- [a dead trade route can still be claimed](https://linear.app/threadbare/issue/THR-1615/a-dissolved-trade-lane-leaves-a-claimable-ghost-route-and-never-sends)
- [waypoints clutter the map's places](https://linear.app/threadbare/issue/THR-1616/movement-waypoints-pile-up-as-subtype-less-locations-outside-every)
- [non-casters try to learn spells and always fail](https://linear.app/threadbare/issue/THR-1617/create-a-power-is-offered-to-mortals-who-cannot-cast-runs-40-ticks)
- [the Builder's Legacy mandate is already complete at the start](https://linear.app/threadbare/issue/THR-1618/the-builders-legacy-mandate-is-complete-at-tick-0-its-edge-count-reads)
- [route-building aims at the builder's own town](https://linear.app/threadbare/issue/THR-1619/create-a-route-picks-the-actors-own-settlement-as-the-far-end-and)

Three design questions go to the design lane:
- how trade lanes stay alive
- whether pilgrim roads come back
- what culture half the mortals should have, since they currently have none

None of them is marked as yours.

## T1 — unblock sweep

- Shelf at scan: `Ready for Dev` 20. THR-1600 went Done at 09:29Z. `In Dev`: none. The shelf is over the 15 ceiling.
- No Todo candidate changed since run h. The declines stand as in [run h](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-25h.md):
  - **Unmet blockers:**
    - THR-1561 ← THR-1553 / THR-1557
    - THR-1558 ← THR-1557
    - THR-1560 ← THR-1559
    - THR-1574 ← THR-1528
    - THR-1582 / THR-1583 / THR-1584 ← THR-1581 (In Design)
    - THR-1580: "not before S3 and S4"
  - **Design tickets** (wrong destination): THR-1605 to THR-1609, THR-1570 to THR-1572, THR-1274 and THR-1586.
- **Filed straight to Ready for Dev.** Six unambiguous bugs from the T1.5 research, under the map's writer-bug rule. For each one:
  - the assignee is cleared by a separate update and verified absent by re-query;
  - a coordination block is posted;
  - it carries a related-to link to its research ticket.

  The six: THR-1614, THR-1615 (it combines two defects on `phaseTradeRouteDecay.ts`, so they need no mutex against each other), THR-1616, THR-1617, THR-1618 and THR-1619. The only mutex between them is THR-1615 ↔ THR-1617 (both edit `undertaking-objects.ts`). THR-1619 is mutex with both only if its fix lands in that file.
- Shelf after: 26, all product. Product vs process this week: all product.

## T1.5 — wayfinder sweep

Map THR-1589 had a frontier of 7 before this run: THR-1590, THR-1593, THR-1594, THR-1595, THR-1591, THR-1596 and THR-1599. It has no `## Reserved for Christian` section.

- **Resolved 2 of 2 AFK (the cap).** For each: claimed (verified), subagent run, resolution comment posted, closed Done (verified), gist appended to Decisions-so-far.
  - **THR-1590 (task).** An attended census on seeds 42 and 99, medium, 150 ticks, reproducing `?seeded` exactly.
    - 772 firings.
    - The First gets 7 per seed, all at the shaping tier, none with a nudge hand.
    - The social path fires 0: a cap-stage positional cut, filed as THR-1614.
    - Attended and unattended dice agree within ~2 points.
    - Data: PR #2041 (merged).
  - **THR-1595 (research).**
    - A verdict for every item.
    - Five writer/reader bugs filed: THR-1615 to THR-1619.
    - Design calls left open: lane upkeep, `sacred_route` restore-or-retire, culture outside culture provinces, starting vs earned state, and the clue climb.
    - Data: PR #2042. It went DIRTY against #2041 on the shared README paragraph; resolved by merging main and keeping both rows, pushed, and auto-merge is still armed.
- **Left for the design lane** (grilling/prototype, unreserved): THR-1591, THR-1596, THR-1599.
- **Next run's AFK candidates:** THR-1593 and THR-1594 (research, unblocked by THR-1592). THR-1598 is now unblocked too, because THR-1590 is Done.

## T2 — design authoring

Not triggered. The shelf holds 24 non-Deferral items against a floor of 2. In Design: THR-1581, live.

## T3 — architecture health

Already ran today in [run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-25e.md). Not re-run.

## Escalations

None.

The shelf is now 26, well over the 15 ceiling. All of it is bug and product work produced by the map's research. The ceiling limits promotions, not research-filed bugs. If the shelf keeps growing faster than the executor drains it, the retro should decide whether T1.5-filed bugs count against the ceiling.
