# Action proposal — the settlement economy (THR-1923)

## intent_quote

Christian, chat, 2026-10-14. The four messages arrived in this order:

> simple simulation of goods flow a la civ, not along roads.

> i would like a game where resources do not stockpile to large numbers but instead , also like civ, extra resources lead to growth on different dimensions locally, as well as start of trade routes trying to sell the surplus.
>
> so like: food: population is foodsink: surplus leads to increased population growth,  and food trade routes.
>
> wood: population is a woodsink: surplus leads to buildings in city (housing, town walls, markets, trade goods, increasing happiness, and creating trade goods trade routes.
>
> something along these lines.
>
> special goods will unlock certain buildings or special traits on a town.

> we want a diverse world map, which means that all settlements shouldn't end up looking the same over time. the system should lead to diverse settlements of diverse sizes and with diverse buildings and traits.

> you also don't get a city unless there is a faction HQ in the city that can pull in resources to build out the city. this means that rich farmland can also end up with a few dotted villages and everything there traded out to a nearby already established city.

> yes, a town can be the outcome of a strong local economy without the power structure to develop trade to the level a city needs.

> go ahead

## scope (what this plan does)

One new daily engine phase gives every settlement land it works (hexes within 3, Civ-style), a food sink that grows a population number, a build sink that raises buildings (as Places) into size-limited slots, special goods that unlock buildings and traits, and a city ceiling that only a pulling faction seat lifts. A surplus that has nowhere to go starts a `trades_with` route to a buyer. A worldgen settling run sizes settlements to their land before tick 0. The place page shows a size word, a livelihood sentence, building cards and trait chips. God verbs and sieges shock the land. Tier, unrest, prosperity's balance input and the famine tier read the new state. The four diversity measures become a heavy test.

## scope (what this plan does NOT do — explicit non-goals)

- Does not ship goods along roads to balance the map. Routes only sell surplus.
- Does not let stockpiles grow: the food store is capped at a few days of need.
- Does not show population, meters or yields as numbers to the player.
- Does not build the faction purse (THR-1867), war-aim targeting (THR-1868), hunger and unrest behaviour (THR-1869) or money-encounter wiring (THR-1872). It feeds them state.
- Does not fix the scarcity-arc cap (THR-1919, a separate bug).
- Does not materialize the settlement genome on promotion ("Task 10").
- Does not add new node or edge types.
- Does not change what a god earns (the Dominion map is closed).

## impact_class

Reversible. One engine phase behind `SETTLEMENT_ECONOMY_DRIVES_TIER`, additive props, and a worldgen pre-run that changes settlement sizes at tick 0. Snapshot and fixture churn is expected.

## evidence cited

- **Linear issue:** THR-1923; directions recorded on THR-1866; map THR-1863
- **Vision premises invoked:** a living world the god moves through mortals; the map's two judgement tests (something worth fighting over; diverse settlements)
- **UL terms touched:** Place (buildings are Places), Location, Realm seat. New terms needing a `UL-proposal`: Population, Building (a Place raised by the settlement economy), Surplus route, Seat (pulling)
- **Canon pages consulted:** `Docs/canon/rulebook.md` economy section; `Docs/canon/systems-inventory.md:45,63`; `Docs/canon/interface-map.md:402`; `Docs/game-design/laws.md` (36, 41, 42, 43, 45); `Docs/design-system/laws.md` (13, 14, 16–20, 58)
- **Prior plan docs this builds on:** `Docs/plans/2026-07-04-mortal-economy-resource-web.md`, `Docs/plans/2026-07-04-flow-web-exploration.md`; audit `Docs/audits/2026-10-14-mortal-economy-audit.md`
- **Rejected approaches considered and dismissed:**
  - static stocks + shocks
  - regrowth-and-use stocks
  - lane balancing
  - hinterland stock draw (superseded by Civ yields)
  - a separate building system
  - a happiness stat

  Reasons in the brainstorm companion.

## load-bearing decisions touched

- **Everything is a graph node/edge.** Respected: buildings are Places (`location` + `parentLocationId`), routes are `trades_with`, traits are `has_trait`. No new types.
- **Relationships are edges, not properties.** `landShocks` and the meters are properties of a settlement's own land and people, not relationships. Seats are read from the existing edge or property.
- **Three-tier position (sublocation = `location` with `parentLocationId`).** Respected; building Places use it.
- **The world graph is mutated in place; key change detection on versions.** The hex-ownership cache keys on `structuralCacheVersion` plus a hash of the `controls` edges.
- **Engine caches are owned per session.** The ownership cache lives on `SimulationRuntime`.

## high-impact files touched (from Codesight)

Measured with a grep for import counts on 2026-10-14:

- `src/types/trace.ts` (140 importers): additive union members.
- `src/engine/orchestrator.ts` (123): **not edited**; the phase goes through the registry.

The Blast Radius section is present.

## kill criteria

- The engine run fails any of the four diversity measures on seeds 42 and 99 after tuning the named levers (`PATH_BONUS`, `BUILDING_SLOTS`, the seat-pull rule, `LAND_PER_HOME`). Stop and bring the measure to Christian with the numbers.
- Day-0 tiers land below 80% within one step of the genome. Stop, because the world would visibly reshape at game start.
- A warm playtest tester cannot name one difference between two same-size towns. The diversity is not reaching the player, so the UI section is wrong, not the model.
- The phase costs more than 2 ms per day on medium. Profile before cutting scope.
