---
lane: tb-design-lane
run: 2026-10-25f
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-25 (run f, ~17:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

All three calls are inside [Plan doc: famine and glut draws](https://linear.app/threadbare/issue/THR-2040/plan-doc-famine-and-glut-draws-a-hungry-town-tells-hungers-stories-a) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-25-thr-2040-famine-and-glut-draws.md)). Each one can be vetoed on its own.

- **A starving town tells hunger's stories.** In a hungry town, refugees, hard bartering, the merchant's granaries, the exchange bell and mending nets for work become likelier. Fairs and festivals there become rarer. "Hungry" is the town's existing hunger, the same one its Fortunes sentence and its unrest read. *Veto:* "famine should mean a staple at the scarce tier".
- **Glut means grain with nowhere to go.** Only a town with a large spare harvest for three days running (food at least 1.75 times its need) leans toward the harvest bounty, the mill lease and the tithe-barn raid. A town with a little spare food is the normal state of a settled town, so it does not count. *Veto:* "any town with spare food is in glut".
- **The granary riot keeps one cause.** Hunger and unrest already start it. Famine does not also make it likelier on the everyday board. *Veto:* "famine should also make the riot likelier".

## Work

- **What was open.**
  - The briefing has no *From Christian* section, so there were no vetoes to apply.
  - Ready for Dev held 3 items that are not Deferrals, below the floor of 4, so a plan doc was owed.
  - No wayfinder map is open, and no lane claim was waiting to resume.
  - The money-encounter leftovers list ([Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954)) asks for each row to be split out as its own small design. Its *famine and glut* row draws on none of the debt calls still inside their veto day, so I split it out.
  - I filed [Plan doc: famine and glut draws](https://linear.app/threadbare/issue/THR-2040/plan-doc-famine-and-glut-draws-a-hungry-town-tells-hungers-stories-a) and claimed it with `design-lane claim 2026-10-25f`. The claim stuck.
- **What the census found.** I ran headless worlds on main @ e67e0517 (seeds 42 / 99 / 7, medium map, 360 ticks each), using a script on the unmerged branch [proto/thr-2040-larder-census](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2040-larder-census).
  - A town is hungry on about 4 % of its days. **76 % of those hungry days are not "poor" days**, so the existing boom/bust weighting never sees them.
  - On two seeds of three, the eight hunger scenes were rarer in hungry towns (1.3 % and 2.6 % of firings) than everywhere else (4.1 % and 4.4 %).
  - "Some food to spare" is true on 42–67 % of town-days. That is why glut needs the stronger test.
- **The plan.**
  - It adds one reading of a town's larder and one scoring term beside the prosperity term.
  - It adds two optional weights on the existing story-affinity table, with 18 rows.
  - It adds a debug readout, and lands the census script so the builder can show before and after.
  - It adds no new player text.
- **Gates.**
  - The intent judge returned Allow. It raised two small gaps, both fixed: the fallback order for towns without a food store, and a kill-criteria section in the plan itself.
  - The design audit passed: NFP and Vision with notes, the three pillars clean.
  - The docs gate passed.
  - [PR #2578](https://github.com/christianspliid-ui/threadbare/pull/2578) merged. The liveness check reads LIVE.
- **Handoff.**
  - The ticket is in Ready for Dev, unassigned, with its decision record, handoff and coordination block.
  - Its description carries `Claimable from: 2026-10-26T18:05:00Z`, so the builder waits out your veto day.
  - The leftovers list now keeps place-as-holding, lane-bound writes, tribute oaths, quest pay, salt, tolls and threatened lanes.
- **Noticed, not filed.** The boom/bust mood words (`{econ_adj}` and friends) are wired into prose enrichment, but no encounter text uses them. They never render. I recorded this in the plan's brainstorm and told the builder not to add famine words to that seam.

## Escalations

None.
