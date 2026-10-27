# Action Proposal — a sealed mill lease gives the town's mill to a guild (THR-2077)

## intent_quote

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."
> — Christian, chat, 2026-09-25 (the design lane's mandate, THR-1611)

> "so important that the economic system simulates the cities and factions and locations to have a basic 'kingdom' economy so factions have something to fight over. this is more important than to make the agent model even deeper than it already is on individual agent richness."
> — Christian, chat, 2026-10-14, recorded on the mortal economy map THR-1863

The row itself is the last item on THR-1954 (Money encounters, later rows). THR-2048's plan, Decision 4, returned it: *"the row returns to the later-rows list as a faction holds a place"*.

## scope (what this plan does)

When *The Lease Sealed* succeeds, a guild present in the town holds the town's mill. A guild faction gets a `controls` edge onto the mill Place. If no mill stands, one is raised as a town building when a slot is free. A faction-held mill pays its guild a small prosperity-scaled due in the faction purse. The purse sentence names it *"the mill at <town>"*. It adds one aftermath effect kind, one pure picker, one purse term and one phrase branch.

## scope (what this plan does NOT do — explicit non-goals)

- It does not give the mill to the mortal (THR-2048 Decision 4 stands).
- It does not change *The Mill Lease* or *The Lease Forfeit*, their stakes or their prose.
- It does not invent a millers' faction, and it does not let a realm hold the mill (no border change).
- It does not pay guild work for every mill in the world, only dues to the faction that holds one.
- It does not change mortal holding income, `grantHolding`, the realm projection or war aims code.
- It adds no new UI component or notification.

## impact_class

Reversible. The change is additive engine code plus a data row. It is off by removing one effect from one template or by zeroing one constant.

## evidence cited

- **Linear issue:** THR-2077 (split from THR-1954; draws on THR-2048 Decision 4 and the THR-1863 kingdom ruling)
- **Vision premises invoked:** `Vision/00-north-star.md`, `Vision/01-core-loop.md`, `Vision/02-non-negotiables.md`, `Vision/03-design-tensions.md` #2 and #4
- **UL terms touched:** Place, Faction, Holding (no new term; a guild *controls* a Place as factions already do)
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/README.md`, `Docs/game-design/laws.md` (13, 41, 42, 43, 45)
- **Prior plan docs this builds on:** `Docs/plans/2026-10-26-thr-2048-place-held-after-success.md`, `Docs/plans/2026-10-14-thr-1923-settlement-economy.md` (buildings), the THR-1931 faction purse plan
- **Rejected approaches considered and dismissed:** the abbey keeps it (no change); the realm holds it (moves borders); the actor's faction (fiction mismatch); minting a millers' faction (Law 43); guild work for all mills (too wide) — see the brainstorm companion

## load-bearing decisions touched

- *Everything is a graph node/edge*: the holding is a `controls` edge, not a property.
- *No inventing node types*: none invented; the mill is an existing building Place type.
- *Relationships between entities are graph edges*: yes, faction → Place `controls`.
- *Agent position three-tier / sublocation is `type: 'location'` with `parentLocationId`*: the mill is a Place on that shape; the purse and the realm projection resolve it to its parent.
- *The world graph is mutated in place*: the handler calls `touchStructure` because `fingerprintFactionControls` keys on `controls`.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` (wide-blast; one additive union member). The plan has a Blast Radius section.
- `src/types/trace.ts` (one category registered).

## kill criteria

- `no_fellowship` is more than 60% of sealed leases, pooled over seeds 42/99/7 in a 30-day run. Then widen the guild list to every non-realm, non-temple purse faction present, and re-measure.
- A guild's Means band rises by more than one band from mill dues alone in the 30-day run. Then halve `HELD_BUILDING_DUES.mill`.
