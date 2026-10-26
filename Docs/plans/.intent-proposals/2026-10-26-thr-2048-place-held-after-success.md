# Action proposal — a place held after success (THR-2048)

## intent_quote

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, 2026-09-25 (THR-1611, the design lane's mandate)

The agreed input is a row of the closed Mortal economy map's research ([THR-1872](https://linear.app/threadbare/issue/THR-1872), verbatim rows):

> forge_construction | S forge held, prosperity+; F holding with repair cost | boom 0.6 ✓ | yes | NEW (create place)
> prospecting_expedition | S deposit + claim; F Means− | none | yes | V, U + NEW (claim)
> prospect_the_seam | S claim held; F claim lost | none | yes | NEW (claim)
> town.mill_lease_auction (+ sealed/forfeit) | mill held by fellowship / merchant; rent; forfeit | none → grain glut/boom | yes | NEW (faction holds place) + U

and the deferral that holds them ([THR-1954](https://linear.app/threadbare/issue/THR-1954), filed by the mortal wealth plan): *"Place as a holding — forge construction, the mill lease auction and sequels, prospecting claims: a place held (`owns` / `controls`) after success. … Each is its own small design once S1–S3 ship."*

## scope (what this plan does)

Adds one aftermath effect kind, `hold_place`, that holds or raises a Place of a given type at the scene's place and grants it to the mortal as a freehold through the existing `grantHolding`, capped at one per type per place. Authors outcome tables for forge construction, the prospecting expedition and prospect the seam, and rewrites one failure line. No UI code: the sheet, notable line and income already read `owns`.

## scope (what this plan does NOT do — explicit non-goals)

- No holding for *The Mill Lease* or its sequels (the lease is the fellowship's; a faction holding a Place needs a new reader) — returned to THR-1954.
- No deposit/stock write for the prospecting expedition (a wild place is not a settlement with stock).
- No town building: the forge is not on the building table, and the smithy is not raised.
- No scene ever removes a holding (failure stakes nothing).
- No change to holding income, `grantHolding`, `createSublocation` or the settlement economy.

## impact_class

Reversible — additive effect kind and content rows; removing the rows turns it off.

## evidence cited

- **Linear issue:** THR-2048 (split from THR-1954; rows from THR-1872)
- **Vision premises invoked:** `Vision/00-north-star.md`, `Vision/01-core-loop.md`, `Vision/02-non-negotiables.md`, `Vision/03-design-tensions.md`
- **UL terms touched:** Freehold, Place, Work (existing; no new term)
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md` (THR-1966 builder-holds line), `Docs/ubiquitous-language/Agents.md` (Freehold, Work)
- **Prior plan docs this builds on:** `Docs/plans/2026-10-15-thr-1936-mortal-wealth.md`, `Docs/plans/2026-10-17-thr-1937-undertakings-in-the-economy.md`, `Docs/plans/2026-10-25-thr-2046-encounter-lane-writes.md`
- **Rejected approaches considered and dismissed:** raising the town's smithy; `spawn_unique_location`; a faction-held mill (see brainstorm companion).

## load-bearing decisions touched

- Everything is a graph node/edge — the holding is the `owns` edge; the forge is a Place node.
- Agent position three-tier — the raised Place is the sublocation tier (`type: 'location'` + `parentLocationId`), via `createSublocation`.
- No inventing node types — none invented.
- Relationships are edges — `owns`, `constructed_by`, `contains`.

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts` (wide-blast; one additive union member). Plan carries a Blast Radius section.

## kill criteria

A 30-day seed-42 run with more than one `raised` per three towns → success pays instead of raising; re-measure.
