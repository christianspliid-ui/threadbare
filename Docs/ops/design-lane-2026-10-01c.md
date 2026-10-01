---
lane: tb-design-lane
run: 2026-10-01c
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-01 (run c, ~12:15Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [A faith undertaking consecrates new pilgrim routes](https://linear.app/threadbare/issue/THR-1660/a-faith-undertaking-consecrates-new-pilgrim-routes-mid-game-design-the): **a mortal who wants to spread the faith can now make a town a place of pilgrimage.** Today each congregation gets one pilgrim road to its capital at the start, and nothing can ever add another. The mortals who want to spread the faith (20 to 40 per world) have almost nothing to do: two finished works across three test worlds. The calls made:
  - **Mid-game pilgrimage is wanted.** You asked for faith that lets us "test and see balance and interaction", and a faith fixed on day one has nothing to interact with.
  - **The way belongs to the town's own people's congregation, not to the mortal who made it.** I measured it: not one faith-spreader on any test world belongs to a congregation. So "a member consecrates for their Temple" would be a job nobody can take. The town's own people decide whose faith it is. The mortal is remembered for doing it, in their story and on the moment card.
  - **Towns, cities and capitals only.** Shrines and temples already host the pilgrimage, so a road there would change nothing. That was the old version's bug.
  - **A pilgrim way, once made, is not unmade.** Desecration would be its own design, with its own question about what it means, so I left it out.
  - **The old unused pilgrim-road job stays as it is.** Nothing deleted.
  - **Both kinds of pilgrim way now show** on the town's page (*"Pilgrims come here — a way of the Temple of …"*) and on the congregation's page. Until now even the starting roads were invisible to you.

  Plan: [Consecrate a pilgrim way](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-01-thr-1660-consecrate-a-pilgrim-way.md). To reverse the main call, say that a pilgrim way should belong to the mortal's own faith instead of the town's, which would need a way to convert towns first. This is not ready for you to look at until it is built.

## Work

- **Chosen:** the build shelf held 2 jobs (the floor is 4). No map was open and the orchestrator had staged no design request. This deferral's blocker ([faith and politics as world settings](https://linear.app/threadbare/issue/THR-1632)) is done, and the decisions it draws on are three days old.
- **Measured before deciding** (current main, medium, seeds 42 / 99 / 7, 300 ticks):
  - Pilgrim roads stay at 3 per world from start to finish. All of them are seeded, congregation to capital.
  - 23 / 39 / 24 mortals held *Spread the Faith* during the run. Not one of them belongs to a congregation.
  - Every one of them has 3 to 7 towns within reach that this job could take. None has zero.
  - The pilgrimage ran twice in total, both times at a shrine.
  - Reader and data: [the census reader](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/readers/consecration.ts) and [its output](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/consecration-2026-10-01-thr1660.json).
- **Reported, not chased:**
  - By tick 300 the number of towns, cities and capitals roughly halves (21 → 11 on seed 42), which bounds how far faith can spread.
  - On seed 42, one congregation's capital became ruins, and pilgrims are still offered there. It reads as pilgrims to a fallen holy city, so it was left alone.
- **Checks:**
  - The independent plan reviewer approved. Both of its notes were folded in.
  - The three side reviews passed: rules (with notes), completeness, and vision (with notes). They are recorded in the plan.
- **Plan merged:** [PR #2163](https://github.com/christianspliid-ui/threadbare/pull/2163), confirmed live on `main`.
- **Handed off:** [A faith undertaking consecrates new pilgrim routes](https://linear.app/threadbare/issue/THR-1660/a-faith-undertaking-consecrates-new-pilgrim-routes-mid-game-design-the) is in Ready for Dev with its build notes. Like any lane decision, it waits out the 24-hour veto window before building; the window closes around 14:45 tomorrow your time.

## Escalations

- None.
