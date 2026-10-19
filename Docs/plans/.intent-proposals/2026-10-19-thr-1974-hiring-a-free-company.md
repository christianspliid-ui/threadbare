# Action proposal — hiring a free company (THR-1974)

## intent_quote

Christian, on the Mortal economy map's crown ruling ([the faction purse](https://linear.app/threadbare/issue/THR-1867), 2026-10-14), quoted in the decision this plan builds on:

> oaths are won "by persuasion, by gifts, by arms, or by a broken treasury"

Christian, on the Mortal economy map, 2026-10-15 08:29Z (the carve-up release):

> "Keep all three calls as decided. The plan docs can go ahead."

Christian's standing delegation to the design lane, 2026-09-25:

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

The ticket's Done-when (THR-1974, filed by the design lane from the THR-1939 decision, which passed its veto day 2026-10-19T01:35Z with no veto):

> "Author one plan doc in `Docs/plans/` through `design-session` and hand it to Ready for Dev. It amends the built crown and war aims. Treat the decision on THR-1939 as settled input and cite it inline."
> "Must measure, not assume: price base when the company fields nothing … the liege's wage bill as a share of its income on seeds 42 / 99 / 7, with a kill criterion if a crown goes Bankrupt from wages alone … whether two hired companies should make a realm a Crown … free companies stand where their members stand for courting … check that both companies are courtable on all three seeds."

## scope (what this plan does)

Writes the four rules of the THR-1939 decision into the built crown and war aims: (1) an oath's gift is priced on max(income, standing-army upkeep) for factions that keep a standing army; (2) in the daily `crown` phase, after loyalty and before the tax, a liege pays the upkeep of its vassal's armies that the vassal's own purse left unpaid, keeping a two-day reserve for its own soldiers; (3) an army its liege paid today may eat from the liege's towns as well as its own; (4) such an army fights its liege's enemies (targeting, defence, siege start, battle start) instead of its own faction's. The liege's Means word counts the wages it paid. Two chronicle triggers, three sheet clauses, a debug accessor. Everything behind `CROWN_WAGES_ENABLED`.

## scope (what this plan does NOT do — explicit non-goals)

- No new edge, node type or contract system (the decision ruled it out).
- No liege-funded army raise (named as the first kill-criterion lever, not built).
- No change to who may swear or court, the offer weights, loyalty, breaks or rebellion.
- No change to faction-level enemy reads (`grievanceFactionOf`, the crown's own `isEnemy`).
- No map signifier for hired armies.
- No encounter effects (the existing deferral THR-1944 covers mortal-brokered oaths).
- No exclusion of companies from the Crown count (decided: they keep counting; the plan states the measured effect).

## impact_class

Reversible. One master switch returns every reader to today's behaviour; no new edge; optional fields only. It touches the daily economy and every army's enemy question, so the plan carries a rollback predicate.

## evidence cited

- **Linear issue:** THR-1974; decision THR-1939; precondition THR-1973 (Done).
- **Vision premises invoked:** the Mortal economy map's destination test ("does this give factions something worth fighting over?"); mechanics surface through prose.
- **UL terms touched:** none new. *Fealty*, *Crown* (pending UL-proposal THR-1943) are read, not added.
- **Canon pages consulted:** `Docs/canon/rulebook.md` (war aims and crown paragraphs), `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/README.md`.
- **Prior plan docs this builds on:** `Docs/plans/2026-10-15-thr-1932-crown.md`, `Docs/plans/2026-10-15-thr-1933-war-aims.md`, the faction purse plan (THR-1931).
- **Rejected approaches considered and dismissed:** a `hired_by` edge or contract term (Law 42/43, decision); upkeep exemption for companies (purse plan); every vassal army joins every liege war (decision); a union of enemies instead of replacement (brainstorm § 6).

## load-bearing decisions touched

- "Everything is a graph node/edge" and "Relationships between entities are graph edges, not property fields": respected. The hire is the existing `sworn_to` edge. `armyState.liegePaidTick` is a tick-only pay stamp (like `paidThroughTick`); it stores no entity id, and every reader takes the liege from the live `sworn_to` edge.
- "No inventing node types without verification": no new node or edge type.
- "The world graph is mutated in place": the wage step writes through `graph.updateNode`/property writes inside the phase, as the purse does.

## high-impact files touched (from Codesight)

`src/types/trace.ts` (≥100 importers; one additive category, additive optional fields). The plan has a Blast Radius section.

## kill criteria

- Any liege on seeds 42/99/7 goes Destitute on a wage day when the last 10 days' wages would have kept it above Destitute → raise the reserve, then switch off and reopen THR-1939.
- Sworn free companies field an army on fewer than half their sworn days → file the liege-funded raise as a Deferral.
- More than a quarter of realm-vassal armies fight for their liege on two of three seeds → restrict wages to vassals with no held town.

## explicit user sign-off

Not required (Reversible). The decision is the lane's under delegation; its veto day closed with no veto.

## author notes for the judge

- The census ran on main @ 04ed4c85 with THR-1973's fix live; the plan's § Measurements quotes it.
- Ten how-level choices are listed at the plan's top and argued in the brainstorm. The two with the most game weight are replacement-not-union for command (§ 6) and the two-day wage reserve (§ 4). Both are invited for veto in the lane report.
- The decision text says the price is 30 days of max(income, upkeep "of what it fields, or would raise if it fields nothing"). The plan narrows "would raise" to factions that keep a standing army, so guilds are not priced on armies they never raise. Judge whether that is a faithful reading.
