---
lane: tb-orchestrator
run: 2026-09-25h
promoted: 0
filed: 0
resolved: 2
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-25 (run h, ~08:29–09:23Z)

## Needs Christian

Nothing needs you. Two research questions from your new [living-world map](https://linear.app/threadbare/issue/THR-1589/map-a-world-that-starts-alive-people-ties-and-a-past-at-game-start-and) are answered:

- **[Why so much written content never reaches play](https://linear.app/threadbare/issue/THR-1597/reach-before-volume-why-about-300-written-encounters-never-land).** Most of it is blocked by who takes part, not by what is written. Guild members are background people who never act on screen. Most easy encounters are dropped because every acting mortal has outgrown them. Two plain bugs were found and queued for the builder: [Mercenary Company encounters can never be seen](https://linear.app/threadbare/issue/THR-1612/every-mercenary-company-template-lacks-a-template-level-reach-the), and [six kinds of follow-up plant a seed that nothing can grow](https://linear.app/threadbare/issue/THR-1613/six-seed-families-planted-by-shipped-aftermaths-have-no-member-and-no).
- **[What a livelier starting world costs](https://linear.app/threadbare/issue/THR-1592/what-liveness-costs-measure-the-per-tick-price-of-notables-social-ties).** A seeded past is nearly free, and so are a few more friendships and family ties. Extra notable people in each town cost 9–18% more simulation time. Dense webs of ties are the trap: they turn ordinary townsfolk into full decision-makers and double the cost. The proposed limit is +10%.

The remaining questions on the map carry on without you. None of them are marked as yours.

## T1 — unblock sweep

- Shelf at scan: `Ready for Dev` 19, of which 16 are not Deferrals. `In Dev`: none. That is **over the 15 ceiling**, so at most 1 promotion was allowed. No candidate qualified.
- Blocker cleared since run g: THR-1547 (M4), Done 07:39Z. It unblocks nothing on its own:
  - THR-1558 (E3) still waits on THR-1557 (Ready for Dev).
  - THR-1560 (H2) still waits on THR-1559 (Ready for Dev).
- **Declined, unmet blocker (unchanged from run g):**
  - THR-1561 ← THR-1553 and THR-1557.
  - THR-1574 ← THR-1528.
  - THR-1582, THR-1583 and THR-1584 ← THR-1581 (In Design).
  - THR-1580 (Deferral): "not before S3 and S4".
- **Declined, wrong destination — new since run g.** Five cold-playtest round-1 findings were filed at 07:42Z:
  - THR-1605 (Urgent: a new player never meets The First)
  - THR-1606
  - THR-1607
  - THR-1608
  - THR-1609

  Each is labelled Game Design, and each Done-when reads "a design session picks the direction and hands off implementation ticket(s)". They are design-lane input, not executor work. Their bug siblings (THR-1600..1604) are already in Ready for Dev.
- Also declined as design tickets, as before: THR-1570, THR-1571, THR-1572, THR-1274 and THR-1586.
- Shelf after: 21 (18 non-Deferral). It grew by THR-1612 and THR-1613, the defects the T1.5 research filed.
- Product vs process this week: all product.

## T1.5 — wayfinder sweep

Map THR-1589, "a world that starts alive", opened 07:38Z. It has 10 children; the frontier is 7 open, unblocked and unclaimed. It has no `## Reserved for Christian` section.

- **Resolved 2 of 2 AFK (the cap):**
  - **THR-1592 (research).** Liveness cost, measured as a controlled study: 5 arms plus a placebo, 2 seeds. Posted as the resolution comment and closed Done (verified). Gist appended to the map. Raw data in PR #2040 (docs-only, auto-merge armed).
  - **THR-1597 (research).** Gate attribution for the 414 encounters that never fire. Posted, closed Done (verified), gist appended. Filed THR-1612 and THR-1613 to Ready for Dev: unassigned (verified), each with a coordination block and a relation to THR-1597. Data in PR #2038.
- **Left for the design lane** (grilling/prototype, unreserved):
  - THR-1591 (a world with a past, prototype)
  - THR-1596 (faith and politics, grilling)
  - THR-1599 (culture and spheres, prototype)
- **Next run's AFK candidates:** THR-1590 (attended-view census, task) and THR-1595 (seeded things that die, research).
- **Now unblocked by this run:** THR-1593 and THR-1594. THR-1592 was their blocker.
- **Still blocked:** THR-1598, by THR-1590.

## T2 — design authoring

Not triggered. There are 16 non-Deferral items against a floor of 2. In Design: THR-1581 only, live (updated 09-24).

## T3 — architecture health

Already ran today in [run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-25e.md). Not re-run.

## Escalations

None. This run took about 55 minutes of wall time because the two research subagents ran to completion. That time overlaps the 09:25Z slot.
