# Action Proposal — yield and leverage (THR-1439)

## intent_quote

> "Take the map as far toward its destination as possible … remaining bands (people-things, yield) authored/handed off or shipped" — Christian's brief to the autonomous driver, 2026-09-07 evening.

> Christian's decisions on THR-1397 (2026-09-03), verbatim on the grid: *"Use × location — Yield is a verb: the active harvest of a held Location — holding court, taxing a market, drawing a tithe. Op needed: `draw_yield`, moving a lump of the Location's stock into the holder's wealth at a cost to the Location's prosperity or the holder's standing there; the Location's productive Places … are the multiplier. Ships only once wealth is visible on the sheet"*; *"Raise × route — A merchant's expansion work writing a lump of volume onto the lane. Op needed: `raise_route_volume`"*; *"Seize × agreement — Stealing a secret — the `knows_secret_of` edge moves from holder to thief … The holder loses it, never a copy, or theft is free. Op needed: `steal_mark`"*; *"Use × standing — Calling in a favour: a work that spends some standing with a person or faction to mint an `owes_favor` edge … Spending it is use × Agreement, forgiving it destroy × Agreement, both live … Op needed: `mint_favor`."*

> The standing rider (THR-1397): *"wealth … must be on the mortal sheet and the faction view as a banded word before any yield cell ships"* — paid by THR-1428 (the Means word), verified at `OverviewTab.tsx:603` and `FactionSheet.tsx:335`.

## scope (what this plan does)

Authors the executor plan for the four yield-and-leverage cells the grid decided: `draw_yield` through the income funnel THR-1428 built, with a cooldown and costs to prosperity and standing; `raise_route_volume` on the lane the toll reads; `steal_mark` by retargeting the edge's source; `mint_favor` spending standing to write the favour edge the encounters read; the Agreement kind widened to the favour class with per-verb ownership through THR-1438's hooks, so a favour is redeemed and forgiven by the two live Agreement cells; and one hand-built UI row — the live sheet's Bonds tab renders the marks-and-favours strand where a placeholder sits today (the strand's only renderer was an unmounted panel, impediment #981). Hands off to Ready for Dev with a coordination block, mutex behind THR-1438.

## scope (what this plan does NOT do — explicit non-goals)

- No new node or edge type; no new kind (the favour class joins the existing Agreement kind).
- No second rendering of wealth; the Means word stays the only one (Law 4).
- No change to the encounter-side favour path (`redeem_favor`, the favour encounters); they keep their own funnel.
- No table change to the division rule.
- The capability-growth rider (a completed work grows capability) is not built here; it is filed as its own ticket at the handoff.
- No player control: mortals' work.

## impact_class

Reversible — four registry declarations, two new op modules, one shape widening behind the kind's own discriminator, one cause word; nothing removed.

## evidence cited

- **Linear issue:** THR-1439 (parent THR-1396; decisions THR-1397; band order THR-1399; riders THR-1397/THR-1428)
- **Vision premises invoked:** `Vision/00-north-star.md` (a favour called in, a grudge carried), `Vision/02-non-negotiables.md` (graph; three pillars; mortal sovereignty)
- **UL terms touched:** Undertaking, Location, Route, Agreement (mark and favour classes), Standing, Means; no new term
- **Canon pages consulted:** `Docs/canon/undertakings.md`, `Docs/canon/world-objects.md`, `Docs/canon/undertaking-grid.generated.md`, `Docs/canon/rulebook.md`
- **Prior plan docs this builds on:** `2026-09-03-thr-1392-verb-object-undertakings.md`, `2026-09-08-thr-1436-registry-reads-writers-edges.md`, `2026-09-08-thr-1438-ownership-of-people-things.md`, the THR-1428 readers plan
- **Rejected approaches considered and dismissed:** a copy of the stolen mark; a separate Favour kind; wealth as a favour's product; a `capacity` property beside `volume`; a second wealth rendering

## load-bearing decisions touched

- *Everything is a graph node/edge* — respected: the favour is the `owes_favor` edge; the theft moves an edge.
- *Relationships are edges, not property fields* — respected; `stolenFromId` is provenance on the edge, not a relationship.
- *No inventing node types* — none invented.
- *The world graph is mutated in place* — `retargetEdgeSource` reindexes (THR-1437's finding on `updateEdge` is why it is named).

## high-impact files touched (from Codesight)

`src/types/trace.ts` (120 importers) — one added member on the closed `WealthDeltaTrace.reason` union, nothing renamed; the plan carries a `## Blast radius` section for it. Nothing else touched has ≥100 importers (`undertaking-objects.ts` ~24, `strategicActionCandidates.ts` ~41, `holdingIncome.ts` few).

## kill criteria

- A town's prosperity ratcheting to 0 under repeated harvests on the census seeds → the cooldown doubles, recorded.
- A stolen mark still pressing for its old holder → the graph method's reindex, never a second edge.
- A favour on a Location or oneself in any world → the eligibility hook reads the wrong end.
- A numeral for wealth on any sheet → Law 4.
