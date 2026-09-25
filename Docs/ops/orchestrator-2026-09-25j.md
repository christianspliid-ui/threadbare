---
lane: tb-orchestrator
run: 2026-09-25j
promoted: 0
filed: 1
resolved: 2
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-25 (run j, ~10:29–10:47Z)

## Needs Christian

Nothing needs you. Two more questions on your [living-world map](https://linear.app/threadbare/issue/THR-1589/map-a-world-that-starts-alive-people-ties-and-a-past-at-game-start-and) now have answers.

**[Story in every settlement](https://linear.app/threadbare/issue/THR-1593/story-in-every-settlement-what-does-a-seeded-notable-want-and-do).**
- Don't add new people. In each town, raise one person who already lives there to a notable.
- Give them a property they own, an old quarrel with a neighbour, and a secret or a favor tied to one of the heroes.
- Their wish then plays out as a small local agenda that the chronicle reports.
- In a test, one notable per settlement cost no measurable speed and left no settlement without a story at the start. Two per settlement was too slow.

**[The people web](https://linear.app/threadbare/issue/THR-1594/the-people-web-which-ties-between-mortals-to-seed-at-game-start-how).**
- Each named hero starts with a relative, a friend and a rival in their own town.
- They also start with some standing in their home realm, a favor owed inside their faction, and now and then a secret.
- All of this fits the speed budget.
- The research found one plain bug, now queued for the builder: [heroes' starting faction membership gives them no standing](https://linear.app/threadbare/issue/THR-1620/named-heroes-starting-faction-membership-carries-no-standing). Because of it, faction quests never reach them.

None of the open questions on the map is marked as yours.

## T1 — unblock sweep

- Shelf at scan: `Ready for Dev` 25 (all product). `In Dev`: none. The shelf is over the 15 ceiling, so at most 1 promotion was allowed. No candidate qualified.
- No Todo blocker cleared since run i. The declines stand as in [run i](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-25i.md):
  - **Unmet blockers:**
    - THR-1561 ← THR-1553 / THR-1557
    - THR-1558 ← THR-1557
    - THR-1560 ← THR-1559
    - THR-1574 ← THR-1528
    - THR-1582 / THR-1583 / THR-1584 ← THR-1581 (In Design)
    - THR-1580: "not before S3 and S4"
    - All the named blockers are still Ready for Dev.
  - **Design tickets** (wrong destination): THR-1605 to THR-1609, THR-1570 to THR-1572, THR-1274 and THR-1586.
- **Filed straight to Ready for Dev (1):** THR-1620, an unambiguous writer defect from the THR-1594 research. I verified it in code: `worldSeed.ts` mints protagonist `member_of` with no `reputation` or `factionDefId`.
  - Assignee cleared by a separate update and verified absent by `get_issue`.
  - Coordination block posted; related to THR-1594.
- Shelf after: 26, all product. Product vs process this week: all product.

## T1.5 — wayfinder sweep

Map THR-1589 had a frontier of 6 before this run: THR-1593, THR-1594, THR-1598, THR-1591, THR-1596 and THR-1599. It has no `## Reserved for Christian` section.

- **Resolved 2 of 2 AFK (the cap).** For each: claimed (verified), subagent run, resolution comment posted, closed Done (verified), gist appended to Decisions-so-far.
  - **THR-1594 (research).** Tie table with readers and veto-able constants.
    - Kin rides on `relates_to` basis `kin`, so no new edge type is needed.
    - Seeded ties carry `origin:'worldgen'` and are excluded from `SPOTLIGHT_MIN_EDGES`.
    - The ambition bond vocabulary has no writer; this is left as a design call.
    - Filed THR-1620.
  - **THR-1593 (research).** Promote one existing resident per settlement.
    - The package: holding, `old_quarrel`, and a secret or favor with a decider.
    - A new local slot in the notable agendas.
    - Same-session cost: one per settlement is noise, two per settlement is +12–13%.
    - `REACTIVE_AMBITION_TEMPLATES` had already been retired by THR-1298.
- Neither subagent changed `src/`. Their scratch harnesses are local to this run and were not published; no data PR this run.
- **Left for the design lane** (grilling/prototype, unreserved): THR-1591, THR-1596, THR-1599.
- **Next run's AFK candidate:** THR-1598 (write where the dice land, research; unblocked by THR-1590). It is the map's last open research ticket.

## T2 — design authoring

Not triggered: 26 non-Deferral items against a floor of 2. In Design: THR-1581, live.

## T3 — architecture health

Already ran today in [run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-25e.md). Not re-run.

## Escalations

None.
