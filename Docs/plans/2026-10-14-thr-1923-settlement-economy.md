> **title:** The settlement economy — towns grow from surplus, build to their land, seats make cities, and leftovers start trade routes — THR-1923
> **linear_issue:** THR-1923
> **author:** Claude Code (attended design session, Christian present in chat)
> **created:** 2026-10-14
> **three_pillars:** Engine done · Content done · UI done

# The settlement economy — THR-1923

*Every settlement on the map becomes what its land, its holder and its trade make it, so the map is different every run, and factions have fields, villages and roads worth fighting over.*

## Why this is load-bearing

The mortal-economy audit (`Docs/audits/2026-10-14-mortal-economy-audit.md`) found the economy is a closed weather system. Stocks never change on their own: all 140 stocks were identical at ticks 0, 100 and 300 on seed 42. No settlement has a population number, and nothing builds from surplus. A town's tier moves only with a prosperity threshold. Christian set the replacement in chat on 2026-10-14, in four directions recorded on the [goods-flow ticket](https://linear.app/threadbare/issue/THR-1866):

1. **à la Civ, not along roads.** Each settlement works the land around it, and goods are not shipped down roads to even out the map.
2. **Sinks, not stockpiles.** *"resources do not stockpile to large numbers but instead … extra resources lead to growth on different dimensions locally, as well as start of trade routes trying to sell the surplus."* Food grows population. Wood and stone raise buildings that lift happiness. Special goods unlock buildings and traits.
3. **A diverse map.** *"all settlements shouldn't end up looking the same over time … diverse settlements of diverse sizes and with diverse buildings and traits."*
4. **Cities need a seat.** *"you also don't get a city unless there is a faction HQ in the city that can pull in resources to build out the city."* Confirmed: *"a town can be the outcome of a strong local economy without the power structure to develop trade to the level a city needs."*

The rest of the economy map rests on this plan. The [faction purse](https://linear.app/threadbare/issue/THR-1867) pays from town size and held places. [Economic war aims](https://linear.app/threadbare/issue/THR-1868) target the richest enemy town and its fields. [Hunger and unrest](https://linear.app/threadbare/issue/THR-1869) needs a famine that can actually happen. Today 22 of 38 settlements hold no staple stock at all, so they can never starve ([goods-flow prototype](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1866-goods-flow/scripts/proto/goods-flow-sketch.output.txt)).

**Prototype for this plan:** [`proto/thr-1923-settlement-economy`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1923-settlement-economy) @ f35f6b2a, never merged. A standalone sketch runs this model on the seed-42 medium world (38 settlements): a 100-day settling run, then 150 game days. [Agreed model output](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1923-settlement-economy/scripts/proto/settlement-economy-agreed.output.txt) · [control output](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1923-settlement-economy/scripts/proto/settlement-economy-flat.output.txt). The control has no slot limit, no specialisation and no seat rule.

| Diversity measure (THR-1866) | Agreed model, day 50 → 150 | Control (convergent strawman) |
|---|---|---|
| 1. Sizes stay spread (size CV, day 1 → 100) | 0.51 → 0.51 PASS | 0.58 → 0.56 PASS, but 28 of 38 settlements become cities |
| 2. Same-tier pairs sharing less than half their buildings | 85% PASS | 30% FAIL |
| 3. Trait combinations; top single trait | 26 of 38; Market Town on 45% PASS | 31; Quarry Town on 68% FAIL |
| 4. No convergence from day 50 to day 150 | CV 0.51→0.52 · distinct 85→85% · combos 26→26 PASS | distinct 33→30% (drifting) |
| Tiers at day 150 (hamlet/town/city/capital) | 4 / 19 / 13 / 2 | 4 / 6 / 28 / 0 |
| Day-0 tier within one step of the worldgen tier | 34 of 38 | — |

The sketch has no war, god verbs or faction moves, so after settling the agreed world is nearly still. That is the flow-web canon's *"equilibrium is silence"*. In the engine, the stories come from shocks, sieges, lost seats and cut routes, which this plan wires as inputs.

## Substrate inventory

Measured by a substrate sweep of the tree at `b05fbb6c` (2026-10-14). Citations are `path:line`.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Mortal Economy & Prosperity (`systems-inventory.md:45`) | 🟢 ACTIVE | **extends**. Prosperity stays the one scalar downstream systems read (2026-07-04 resource-web plan). The new phase writes `resourceBalance` from the settlement's food and build balance instead of deposit quantity, so `phaseProsperity.ts:444` keeps its reader. |
| Settlement tiers: `phaseSettlementPromotion.ts` (`PROMOTION_ELIGIBLE` :42-51; prosperity 70/20, sustain 20, `phaseProsperity.ts:67-73`) | 🟢 ACTIVE | **replaces the trigger, keeps the writer.** Tier comes from population plus seat (§ Resolution logic). The existing phase still performs the change: it mutates `locationSubtype`, emits `settlement_tier_change`, writes "A Settlement Rises" and sets `pendingReassessment`. Its prosperity trigger stays behind `SETTLEMENT_ECONOMY_DRIVES_TIER` as the fallback. |
| Settlement genome reassessment (`phaseSettlementReassessment.ts:57-73`) | 🟠 PARTIAL | **untouched.** It reruns the genome on promotion but never materializes it. Buildings come from this plan instead; the "Task 10" materialize gap stays out of scope. |
| Places / sublocations (`phaseSublocations.ts:239`, `GOLD_SUBLOCATION_SPECS` :106-192, one instance per type :346) | 🟢 ACTIVE | **extends.** A building is a Place (UL: Place = sublocation) the settlement economy raised, marked `isBuilding: true`, created through the same node + `contains` edge path (:378-404). A building whose type already exists at the settlement **adopts** that Place instead of duplicating it. This covers market-district and counting-house, which the gold specs also spawn. |
| Location traits (`phaseLocationTraits.ts:188-229`, `has_trait` :234, hysteresis + sustain counters) | 🟢 ACTIVE | **extends** with economic trait rules (§ Data tables), using the rule shape's `computed` input (:110). |
| Faction seats: `homeLocationId` (`factionSeeding.ts:244,267`, `guildSeeding.ts:309`) and the realm seat `role:'seat'` on a `controls` edge (`realmSeat.ts`, stamped `worldSeed.ts:1728`, re-stamped on conquest `battleAftermath.ts:352,380`) | 🟢 ACTIVE | **reads only.** "Seat" = either form. No new edge. |
| Trade routes: `createTradeRoute` (`strategicGraphOps.ts:94`), decay (`phaseTradeRouteDecay.ts:182-212`), tolls (`tradeRouteOps.ts:275`) | 🟢 ACTIVE | **extends.** Surplus routes are ordinary `trades_with` edges, created through `createTradeRoute` with `establishedBy:'surplus'` and two new properties (`carries`, `carriedPerDay`). Carrying sets `lastTraded`, so the existing decay leaves a living route alone and removes it once the surplus ends. |
| Unrest (`phaseUnrest.ts:51-89`) | 🟢 ACTIVE | **extends.** Happiness is not a new stat (Game Design Law 43). Buildings that lift happiness and hunger that lowers it write into `unrest`, through a new bounded term in the unrest phase. |
| Resource deposits (`resourceSeeding.ts:25-70`, `TERRAIN_RESOURCE_TABLE` `resource-content.ts:226+`) | 🟢 ACTIVE | **reads.** A deposit on a place inside a settlement's land adds to that hex's yield. Rare place subtypes (gem_deposit, herb_garden, crystal_cavern, golden_grove, fossil_bed, hot_spring, iron_seep, mining) are special goods. Hex tiles carry no resources today (`types/index.ts:125-147`), and this plan does not add any. |
| Stock tiers (`phases/resourceStockTiers.ts`) | 🟢 ACTIVE | **extends.** The settlement's own food and build balance set its famine/glut tier, as the THR-1866 decision requires ("a fed town reads adequate"). Deposit tiers on non-settlement places are unchanged. |
| God economic verbs: Bless the Harvest, Blight, Sour Mine, Reveal Vein (`unified-action-templates.ts:1893,1934`; ops `graphOpExecutor.ts:1669-1819`) | 🟢 ACTIVE | **extends** each verb's op with a land shock on the target settlement (§ Resolution logic 7). The existing prosperity, health and stock writes stay. |
| Faction purse ([THR-1867](https://linear.app/threadbare/issue/THR-1867), decided, not yet built) | ⚪ PLANNED | **feeds it.** Town tax reads prosperity, which this phase drives. Held-place yield reads the same hex yields. Its faction-type-to-natural-places table supplies the building lean. If the purse lands first, the lean reads its table; if not, this plan ships the table and the purse imports it. |

Runtime counts on seed 42: 38 settlements (17 hamlets, 9 towns, 8 cities, 4 capitals); 52 factions, 49 with `homeLocationId` at 24 distinct places; 3 realms seated via `role:'seat'`; 6 worldgen lanes; 8 resource ids seeded (timber, water, stone, grazing, ore, grain, peat, fish).

## Engine pillar

### Systems design

One new phase, **`settlement_economy`**, a registered `EnginePhase` in the `pre-economy` slot. It runs once a day (every `TICKS_PER_DAY` ticks, on the tick where `tick % TICKS_PER_DAY === SETTLEMENT_ECONOMY_TICK_OFFSET`) and is skipped on other ticks. It runs **before** `resource_stock_tiers`, so tiers read today's balance. Settlements are processed in id order. The phase lives in `src/engine/phases/settlementEconomy.ts`. Its pure helpers live in `src/engine/settlementEconomy/`:

- `land.ts`: hex ownership and yields.
- `growth.ts`: food, population, growth.
- `building.ts`: build meter, building choice, slots, idling.
- `seat.ts`: seats and pulls.
- `surplusRoutes.ts`: route birth, carrying, ending.
- `tier.ts`: target tier.
- `measures.ts`: the four diversity measures, shared by the debug bridge and the heavy test.

Each day, for every settlement (UL: Location with subtype hamlet/town/city/capital):

1. **Land.** The settlement's land is every hex within `WORK_RADIUS` that it owns (rule 1 below). Each owned hex has a daily yield of `[food, wood, stone]` from the terrain table, plus the deposits of places on that hex (quantity / `DEPOSIT_YIELD_DIVISOR` into the deposit's channel). Land shocks multiply it. The settlement's own hex always yields at least `CENTRE_YIELD`.
2. **Work.** One person works one hex. The settlement works its best `population` hexes, scored `WORK_FOOD_WEIGHT_SHORT` (3) × food while its store is short and `WORK_FOOD_WEIGHT` (2) × food otherwise, plus wood and stone. The sum is multiplied by its buildings' channel bonuses, and yesterday's imports are added (seat draws and incoming routes).
3. **Food sink.** Need = `population × FOOD_PER_PERSON`. A surplus fills the store up to `STORE_DAYS` of need, then the growth meter (until the population cap). When the meter reaches `GROWTH_BASE + GROWTH_PER_PERSON × population`, the settlement gains one person. Anything left is **exportable food**. A deficit drains the store, then the meter. A settlement with both empty for `STARVE_DAYS` loses one person (never below 1).
4. **Build sink.** Upkeep = `population × WOOD_PER_PERSON` plus each building's upkeep. Wood + stone − upkeep fills the build meter while a slot is free. When the meter reaches the chosen building's cost, the building is raised (rule 4). When the slots are full, the remainder is **exportable goods**, with workshop output added. If upkeep is short, the building with the highest upkeep idles. After `IDLE_DAYS_TO_LOSE` idle days it is lost.
5. **Seat draw.** A settlement held by a faction that has a seat elsewhere sends `SEAT_DRAW` of its exportable food and goods to that seat as the seat's imports.
6. **Surplus routes.** Exportable food or goods that lasts `ROUTE_PERSIST_DAYS` starts a route to a buyer (rule 6). It runs while the surplus lasts and ends after `ROUTE_DIE_DAYS` without surplus.
7. **Tier.** The phase writes `targetTier` (rule 5). The existing promotion phase moves the subtype after its sustain window.
8. **Balance out.** The phase writes `foodBalance` and `buildBalance` (each in −1..1), and `resourceBalance` = their value-weighted mean, which prosperity already reads.

**Worldgen settling run.** `worldSeed.ts` runs the phase `SETTLEMENT_SETTLING_DAYS` (100) times after `runSettlementGenome` / `materializeGenome` and lane seeding, and before tick 0. It runs with chronicle and traces muted, starting each settlement at `min(genome start population for its tier, its population cap)`. This makes day 0 fit the land. In the sketch, 34 of 38 settlements start within one tier step of their genome tier.

### Graph nodes / edges

**No new node or edge types.** Checked against `src/types/graph.ts` (THR-1183: Places are `type:'location'` with `parentLocationId`).

- **Settlement node properties (new, flat):**
  - `population` (int ≥ 1), `foodStore`, `growthProgress`, `buildProgress`, `importedFood`, `importedGoods`
  - `starveDays`, `foodSurplusDays`, `goodsSurplusDays`
  - `foodBalance`, `buildBalance`, `targetTier`
  - `landShocks: { hexKey, channel, factor, untilTick, source }[]` (an array of records on the land the settlement works; it is not a relationship)
- **Building Places:** a `location` node with `parentLocationId`, `sublocationTypeId` from the building table, `isBuilding: true`, `buildingId`, `builtTick`, `idleDays` (on the building's own node, never keyed by id on the settlement), and a `contains` edge. This is the existing sublocation creation path. A building that adopts an existing Place sets `isBuilding:true` and `buildingId` on it.
- **`trades_with` (existing):** `establishedBy:'surplus'`, plus new properties `carries: 'food' | 'goods'`, `carriedPerDay` (number) and `surplusFrom` (seller location id). `volume` is set from `carriedPerDay` through `SURPLUS_ROUTE_VOLUME_PER_UNIT`, capped at the existing `TRADE_ROUTE_MAX_VOLUME`.
- **Traits:** the existing `has_trait` edge, with new location trait ids.
- **Seat:** read, never written. A faction seat is `homeLocationId`, or for a realm the `controls` edge with `role:'seat'`.

### Tick phases

| Phase | Slot | Cadence | Reads | Writes |
|---|---|---|---|---|
| `settlement_economy` (new) | `pre-economy`, before `resource_stock_tiers` | daily | tiles, settlement props, Places, `controls`, seats, `trades_with`, place deposits, `landShocks` | settlement props above, building Places, surplus routes, `resourceBalance`, traces, chronicle |
| `resource_stock_tiers` | `pre-economy` | every tick | + `foodBalance` for settlements | famine/glut tier for settlements from `foodBalance` |
| `settlement_tier_change` (inline, `orchestrator.ts:3830`) | economy | every tick | + `targetTier` when `SETTLEMENT_ECONOMY_DRIVES_TIER` | unchanged writer |
| `unrest` (inline :3882) | economy | every tick | + `happinessTerm` from buildings and hunger | `unrest` |
| `location_trait` (inline :3902) | economy | every tick | + economic trait inputs | `has_trait` |
| `trade_route_decay` (inline :3738) | economy | every tick | `lastTraded` (set by carrying) | unchanged |

### Resolution logic

1. **Hex ownership.** A land hex within `WORK_RADIUS` of one or more settlements goes, in order: to the settlement whose holder holds the hex's realm (`buildRealmProjection`); else to the nearest settlement; ties go to the lower location id. The result is cached on the session runtime, keyed by `structuralCacheVersion` plus a hash of the `controls` edges (load-bearing decision: never key on graph identity).
2. **Population cap.** cap = `landHousing` + `HOUSING_PER_BUILDING` × housing buildings + `PULL_HOMES` × `pullCount`, where `landHousing = max(LAND_HOUSING_MIN, round((CENTRE_YIELD food + food of the best TOWN_MAX_POP owned hexes) / LAND_PER_HOME))`. A settlement whose seat does not **pull** is capped at `TOWN_MAX_POP`.
3. **Pull.** A seat pulls when its faction holds at least one other settlement, or when at least `SEAT_MIN_INCOMING` surplus routes run into it. `pullCount = min(PULL_MAX, held settlements + incoming routes)`. This is Christian's *"a faction HQ in the city that can pull in resources"*: a seat that pulls nothing is a town.
4. **Building choice.** Candidates are buildings not yet present whose `needs` predicate holds. Score each one:

   > `BUILD_SCORE_BASE` + (`SURPLUS_TAG_BONUS` if its tag matches the settlement's largest surplus channel) + (`FOOD_RICH_BONUS` if it is a food building and food yield ≥ `FOOD_RICH_RATIO` × need) + (`SPECIAL_GOOD_BONUS` if it carries a trait) + (`HOUSING_PRESSURE_BONUS` if it is housing and population ≥ cap − 1) + `PATH_BONUS` × owned buildings sharing its tag + (`LEAN_BONUS` if it is the holder faction's natural building) + `BUILD_CHOICE_JITTER` × PRNG

   The highest score is chosen and built when the meter covers its cost. Slots: hamlet 2, town 3, city 5, capital 6. A settlement with full slots builds nothing new, and its build surplus becomes exportable goods. Worldgen Places that map to a building (§ Data tables: `adoptsTypes`) count as built at day 0 and are grandfathered past the slot cap until lost.
5. **Target tier.**
   - `capital` if the settlement is a realm's seat (or a crown's, once [THR-1917](https://linear.app/threadbare/issue/THR-1917) lands) and `population ≥ CAPITAL_POP`.
   - Else `city` if its seat pulls and `population ≥ CITY_POP`.
   - Else `town` if `population ≥ TOWN_POP`; else `hamlet`.

   **A capital that loses its realm seat drops to city or below.** This changes today's rule, under which capital never changes (`phaseSettlementPromotion.ts:75`). It sits behind the same flag.
6. **Surplus routes.**
   - **Buyer for food:** the nearest settlement within `SURPLUS_ROUTE_RANGE` that is a pulling seat or is short of food. A seat of the seller's own holder comes first.
   - **Buyer for goods:** the nearest pulling seat or settlement with a market within range.
   - **Route cap:** a seller may run 1 + (market) + (counting house) routes.
   - **What a route carries:** each day it carries the day's exportable amount. The buyer's imports gain the food in full, and goods at `GOODS_IMPORT_FACTOR` into the build meter.
   - **Toll and income:** the existing tax/toll stays on the edge (`taxRate`, `controlledBy`). The purse plan reads `carriedPerDay` for tolls and sale income.
   - **A blockaded or threatened lane carries nothing.** Its days count toward `ROUTE_DIE_DAYS` (the THR-1636 blockade rule).
7. **Land shocks.** God verbs and war write `landShocks` on the settlement:
   - Blight / Sour Mine: the best food / stone hex at `SHOCK_BLIGHT_FACTOR` for `SHOCK_DAYS`.
   - Bless the Harvest / Reveal Vein: `SHOCK_BOON_FACTOR`.
   - A siege: **the `settlement_economy` phase reads siege state, and nothing in war code is edited.** A siege is an `actor` node with `properties.battleState.battleType === 'siege'` and `battleState.settlementId` (`siegeResolution.ts:202-262`, `createSiegeNode`). Each day the phase finds the siege nodes naming each settlement. While one exists, every owned hex except the centre yields at `SHOCK_SIEGE_FACTOR`. This is a read, not a stored shock: the siege ends when its node goes, and the yield returns the next day. A `settlement_land_shock` trace with `source:'siege'` fires on the first and last siege day.

   God-verb shocks fade linearly to 1 by `untilTick`.
8. **Happiness → unrest.** happiness = sum of building `happy` + `ROUTE_HAPPY` if any route + `HUNGER_UNHAPPY` if starving − ⌊population / `CROWDING_PER_UNHAPPY`⌋. The unrest phase moves `unrest` toward `UNREST_FROM_HAPPINESS × −happiness` at the existing decay rate, bounded at ±`UNREST_HAPPINESS_MAX`.

### PRNG callouts

One seeded draw **per candidate building** in each building choice, taken in building-table order (the order of `settlement-buildings.ts`). `BUILD_CHOICE_JITTER` breaks ties so two identical settlements do not always pick the same building. The seed is `mulberry32(hash(state.seed, 'settlement_economy', settlementId, tick))`, using `src/lib/prng.ts:8` and the string-hash pattern already used by `resourceStockTiers.ts` (`hashString`). No `Math.random()`. Everything else is deterministic, settlements are iterated in id order, and the hex-ownership tie-break is by id.

## Content pillar

### Encounter templates

N/A for this plan. Wiring the money encounters to famine and glut belongs to [the money-encounter table](https://linear.app/threadbare/issue/THR-1872) and [Hunger and unrest](https://linear.app/threadbare/issue/THR-1869). This plan gives them a famine that can actually happen (`foodBalance` → scarce tier → scarcity arc, once [THR-1919](https://linear.app/threadbare/issue/THR-1919) unjams the arc cap).

### Prose tables

New Great Chronicle triggers in `src/data/economic-chronicle-content.ts`, resolved through `resolveEconomicChronicle`. There are 3 variants each, in the game register (Prose doctrine v2: GM narration). Only full-detail settlements emit them: the top `ECON_PHASE_SPOTLIGHT_CAP` by population, plus any settlement where a threaded mortal lives.

| Trigger | Title | Sample (rendered) |
|---|---|---|
| `building_raised` | "New Walls Rise" (per tag: "A Timber Yard Opens", "The Smithy Is Lit", …) | "Ironwick has more timber than it can burn. Its people raise a timber yard by the river." |
| `building_lost` | "The Forge Goes Cold" | "No ore has come to Dusk Halt in a month. The smithy's fire is out, and its smith has left." |
| `surplus_route_born` | "A Road Fills With Grain" / "A Road Fills With Wares" | "Downswick grows more grain than it can eat. Carts now leave for Great Silverhold every morning." |
| `surplus_route_ended` | "The Carts Stop" | "The carts from Wolfton no longer come. Its fields feed only Wolfton now." |
| `settlement_starving` | "Hunger at Meadowcity" | "Meadowcity's stores are empty and its fields cannot feed its people. Families are leaving." |
| `seat_lost_shrinking` | "The Court Has Gone" | "With the court gone from Greycity, the wagons stop coming. The city is growing smaller." |

The existing `settlement_promotion` / demotion lines stay.

### Attachment content

N/A. The plan adds no attachments or attachment modifiers; buildings are Places, and traits use the existing `has_trait` edge.

### Data tables

All tables are **one entry per kind** (UI Law 58): adding a building, terrain yield, special good or trait is one entry in one file, and a test fails if an entry is missing.

- **`src/data/terrain-yields.ts`**: `TERRAIN_YIELDS: Record<TerrainType, [food, wood, stone]>` for all 17 terrains, prototype values. For example: grassland 3/0/0, floodplain 4/0/0, steppe 2.5/0/0, temperate forest 1/3/0, mountains 0/0/3, plateau 2/0/1, tundra 1/0/0, coastal shallows 2/0/0, deep ocean 0/0/0. A completeness test checks every `TerrainType`.
- **`src/data/settlement-buildings.ts`**: one entry per building, with `{ id, sublocationTypeId, tag, cost, upkeep, needs, effects: { food?, wood?, stone?, happy?, routeCap?, goods? }, trait?, adoptsTypes?, nameKey, tooltipId }`. 19 buildings, mapped to **existing** Place types wherever one exists:

| Building | Place type | Tag | Needs | Effect / trait |
|---|---|---|---|---|
| housing | `housing-quarter` (**new**) | growth | — | +3 homes |
| storehouse | `warehouse` | food | food yield ≥ 6 | food ×1.15 |
| mill | `mill` (**new**) | food | ≥ 3 grassland/floodplain hexes | food ×1.2 |
| fishery | `wharf` | food | ≥ 2 coast/ocean hexes | food ×1.15 · *Fishing Port* |
| stockyard | `beast-pen` | food | ≥ 3 steppe hexes | food ×1.1 · *Horse Country* |
| timber yard | `timber-yard` (**new**) | wood | wood yield ≥ 3 | wood ×1.3 · *Timber Town* |
| stoneworks | `mason-yard` | stone | stone yield ≥ 3 | stone ×1.3 · *Quarry Town* |
| walls | `city-walls` | stone | pop ≥ 4 and (stone ≥ 2 or seat) | happy +1 · *Walled* |
| market | `market-district` (adopts) | trade | ≥ 2 routes | happy +1, route cap +1 |
| counting house | `counting-house` (adopts) | trade | ≥ 1 route | route cap +1 |
| workshop | `workshop` (adopts; also `manufactory`) | craft | wood yield ≥ 2 | +1 goods/day |
| smithy | `smithy` | craft | ore in reach | *Iron Town* |
| lapidary | `lapidary` (**new**) | craft | gems in reach | +1 goods · *Gem-cutters' Town* |
| herbalist | `herbalist-hut` | faith | herbs in reach | happy +1 · *Herb Town* |
| bathhouse | `healing-spring` | faith | springs in reach | happy +2 · *Spa Town* |
| seers' hall | `oracle-chamber` | faith | crystal in reach | *Crystal Seers* |
| carvers' hall | `carvers-hall` (**new**) | craft | amber in reach | +1 goods · *Amber Market* |
| curio hall | `chronicle-hall` | faith | curios in reach | *Curio Collectors* |
| shrine | `shrine` (adopts `temple-quarter`) | faith | pop ≥ 3 and (faith lean or a faith building) | happy +1 |

  Five new Place types (`housing-quarter`, `mill`, `timber-yard`, `lapidary`, `carvers-hall`) each get a definition, a `sublocation-category-art.ts` category entry (commerce / commerce / commerce / commerce / commerce) and a `location.*` tooltip. Their art keys fall back through the category art until [the art pipeline](https://linear.app/threadbare/issue/THR-638) draws them.
- **`src/data/special-goods.ts`**: place subtype → special good (gem_deposit→gems, herb_garden→herbs, crystal_cavern→crystal, golden_grove→amber, fossil_bed→curios, hot_spring/healing_spring→springs, iron_seep/mining→ore), plus deposit → good (ore quantity ≥ `ORE_SPECIAL_MIN`). "In reach" means within `WORK_RADIUS` and inside the holder's realm projection (Civ realm pooling, the THR-1866 direction).
- **`src/data/faction-building-lean.ts`**: faction class → natural building (guild→workshop, military→walls, religious→shrine, criminal→market, political→counting house, realm→walls). It is superseded by the purse's natural-places table if THR-1867 lands first.
- **Location trait rules** (`phaseLocationTraits.ts`, new `LOCATION_TRAIT_IDS`):
  - **One rule per building trait** (input: building present; enter 1 / release 0): `iron_town`, `gem_cutters`, `herb_town`, `spa_town`, `crystal_seers`, `amber_market`, `curio_collectors`, `timber_town`, `quarry_town`, `fishing_port`, `horse_country`, `walled`.
  - **`breadbasket`:** input is land food per worked hex; enter `BREADBASKET_ENTER` 3.0, release 2.6.
  - **`market_town`:** input is routes touching the settlement while a market stands; enter 3, release 2.
  - **`restless`:** input is `unrest`, the same input as Lawless; enter `RESTLESS_ENTER` 30, release `RESTLESS_RELEASE` 15. Restless sits below Lawless (enter 50, release 30, `location-trait-constants.ts:90-91`), so a town turns Restless before it turns Lawless, from the same number.
- **Tooltips** (`resolveTooltip`, `location.*` prefix; ≤ 200 characters each): one per building, one per trait, and `location.population.*` for the size words.

## UI pillar

*Screenshot tool: Playwright (DOM) for the place page and DebugPanel. The map change is limited to existing tier icons and lanes, which Claude-in-Chrome checks on the WebGL map.*

UI Laws engaged: 13 (words, never numerals), 14 (no raw keys), 16 (no key:value strips), 17–20 (tooltip registry, chaining, three-tier ladder), 21 (the cast sees what it changed), 33 (viewport), 37, 56 (consequences are state), 58 (one entry per kind).

### Player-facing display

On the **place page** (`LocationView.tsx` today; the [Inspector](https://linear.app/threadbare/issue/THR-1876) section registry once it lands: one section entry, Law 58):

1. **The size line.** It replaces nothing; it sits under the subtype word. It shows tier word + trend in words, never a number (Law 13): *growing*, *steady*, *shrinking*, *going hungry*. The trend comes from `growthProgress` direction and `starveDays`.
2. **The livelihood line** (`LivelihoodLine`, :944) is rewritten as sentences built from `foodBalance` / `buildBalance` and routes (Law 16):
   - fed / short / overflowing
   - where the surplus goes and what comes in
3. **Buildings.** The existing `SublocationCard` list (:1492) shows building Places like any Place, with a small "built by the town" kind tag and the building tooltip. An idle building shows *idle* with the reason in its tooltip.
4. **Traits.** The existing location-trait chips (`describeLocationTraits`) show the new traits, each with a tooltip.

**Map:** the settlement icon and 3D model are keyed by `locationSubtype` (`locationIconRegistry.ts:124-131`, `SettlementModelMesh.ts:87`). Today's prosperity promotion already changes the subtype at runtime. Whether the map redraws on that change is **not verified**: the executor checks a promotion in the browser, and fixes it in this PR if the icon is stale. Surplus routes are `trades_with` edges, so they appear on the existing lane layer and in the Trade lens ([THR-1830](https://linear.app/threadbare/issue/THR-1830)).

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Place page, size line | "A town, growing." · "A hamlet, going hungry." · "A city, shrinking since its court left." | PC-1 (a size word with no explanation) | Tooltip on the size word: "How many people live here. A settlement grows when its fields feed more than its people eat. Only a faction's seat can grow into a city." |
| Place page, livelihood | "Downswick's fields feed it with grain to spare. The spare grain goes to Great Silverhold." · "Meadowcity's fields cannot feed its people. Its stores are running out." · "Ironwick has more timber than it can use; its timber yard sends wares to Crystalspire." | PC-6 (must agree with the famine chronicle and the trait chips) | The same `foodBalance` value drives the line, the tier word and the chronicle, so they cannot disagree. |
| Building card | "Timber yard — built by the town" · tooltip: "Raised from spare timber. More wood is cut here each day, and leftover wares are sold to other towns." | PC-1 | Every building's tooltip is quoted in § Building and trait text below. |
| Building card, idle (input lost) | "Smithy — idle. No ore has reached it this month." | PC-8 (idle with no reason) | `reason: 'input_lost'`. The reason sits on the card itself, not only in the tooltip. |
| Building card, idle (upkeep short) | "Walls — idle. The town cannot spare the stone to keep them." | PC-8 | `reason: 'upkeep_short'`. The material named is the building's upkeep channel: "timber" for wood buildings, "stone" for stone buildings. |
| Place page, a building lost | The card leaves the list, and the livelihood line carries one sentence for a season: "Dusk Halt's smithy has gone cold; its smith has left." | PC-8 (taken with no reply), PC-6 (must match the chronicle) | Same `settlement_building_lost` event as the chronicle line, so the words match. The sentence clears after `SHOCK_DAYS`. |
| Trait chip, Restless | "Restless" · tooltip: "Its people are unhappy: too crowded, too hungry, or too little to live for. Left alone, a restless town can slide into {{location.lawless}}." | PC-6 (must agree with Unrest and Lawless) | Restless and Lawless read the same `unrest` value. Restless enters at a lower unrest than Lawless, and its tooltip names Lawless as where it leads. Both can show together; Lawless never shows without the unrest that also made the town Restless first. |
| Trait chip | "Iron Town" · tooltip: "Ore is mined nearby and worked in the smithy here. Its smiths are known across the region." | PC-1 | Registry tooltip, Law 17. |
| Great Chronicle | "Downswick grows more grain than it can eat. Carts now leave for Great Silverhold every morning." | PC-3 (no ids, no template seams) | Names resolve through the display vocabulary (Law 14). The chronicle resolver test renders every trigger with real names. |
| **Cast result: Blight** (the cast receipt, `castTargetChanges.ts`, gains a land line) | "The fields east of Downswick wither. They will take a season to recover." | PC-8 (a cast with no visible reply), PC-2 (an effect decided by unseen rules) | The receipt names *which* fields (the hex's direction from the settlement: "east of", "by the river at") and says the effect lasts and fades. It appears in the same receipt and in the same second as the existing prosperity and health lines. |
| Cast result: Bless the Harvest | "The fields around Wolfton swell with grain. The plenty will ease over the coming season." | PC-8, PC-2 | Same receipt line; the word "ease" tells the player it fades. |
| Cast result: Sour Mine | "The quarry above Dusk Halt runs to rubble. It will take a season to open again." | PC-8, PC-2 | Same, for stone. |
| Cast result: Reveal Vein | "A rich seam opens in the hills by Ironwick. It will run thin over the coming season." | PC-8, PC-2 | Same, for stone and ore. |
| Place page while a land shock is active (livelihood line) | "Downswick's eastern fields are blighted and give little this season." · "Wolfton's fields are blessed this season." | PC-6 (must agree with the cast receipt) | The livelihood line reads the same `landShocks` record as the receipt. When the shock fades to nothing, the clause disappears and the chronicle says nothing (equilibrium is silence). Tooltip on "blighted": "A god's hand lies on these fields. They yield less, and recover slowly over the season." |
| Place page while besieged (livelihood line) | "Downswick's fields lie outside its walls and give little while the siege lasts." · tooltip on "the siege": "An army camps outside the walls. The fields cannot be worked until it leaves." | PC-6 (must agree with the war surfaces) | The clause reads the same siege node the war surfaces read (`battleState`), so it appears and clears with the siege. The sentence names no army, so it has no slot that can be empty. |
| **Empty slots** (every templated line above) | Buyer gone: "The carts from Wolfton no longer come." (never "…go to ."). Seat gone: "The court has left Greycity." (never names a missing court). No direction feature for a hex: "The fields around Downswick wither." ("around <settlement>" is the fallback for "east of" / "by the river at"). No resolvable name at all: the line is dropped, not printed with a hole. | PC-3 (what renders when a slot is empty) | The chronicle and receipt resolvers fill every slot from live nodes. Each slot has a declared fallback phrase above. A slot with no fallback drops the whole line (UI Law 14). The resolver test renders each trigger once with each slot empty. |
| Pre-cast (the card's forecast of the blight) | The card's existing effect line gains: "…and its best fields yield little for a season." | PC-2 (the line read before the roll) | The odds and price lines are unchanged. The effect sentence tells the player before they cast that the harm lasts, so the receipt never surprises them. |

### Building and trait text

All tooltips are ≤ 200 characters, in plain register, with no numbers (UI Laws 13, 18). They are registered under `location.building.<id>` and `location.trait.<id>`.

| Building | Card name | Tooltip |
|---|---|---|
| housing | Housing quarter (**new type**) | "New homes, built from spare timber and stone. More people can live here." |
| storehouse | Storehouse | "Spare grain is kept dry here, so a lean week does not mean a hungry one." |
| mill | Mill (**new type**) | "The grain from the fields is ground here. The same harvest feeds more mouths." |
| fishery | Wharf | "Boats go out from here each dawn. The catch feeds the town." |
| stockyard | Beast pens | "Herds from the grasslands are kept and fattened here." |
| timber yard | Timber yard (**new type**) | "Raised from spare timber. More wood is cut here each day, and leftover wares are sold to other towns." |
| stoneworks | Mason's yard | "Stone from the nearby slopes is cut and dressed here." |
| walls | Town walls | "Stone walls around the town. Its people sleep easier behind them." |
| market | Market district | "Traders from other towns come here to buy and sell. More roads can run through." |
| counting house | Counting house | "Merchants keep their ledgers here. The town can trade along more roads." |
| workshop | Workshop | "Spare timber is turned into wares here, and the wares are sold to other towns." |
| smithy | Smithy | "Ore from nearby is worked into tools and blades here." |
| lapidary | Gem-cutter's hall (**new type**) | "Stones from the nearby deposit are cut and polished here, then sold far away." |
| herbalist | Herbalist's hut | "Herbs from the nearby gardens are dried and mixed into remedies here." |
| bathhouse | Healing spring | "The warm spring nearby is walled and roofed. People come to rest in it." |
| seers' hall | Oracle chamber | "Crystal from the nearby caverns is read here for omens." |
| carvers' hall | Carvers' hall (**new type**) | "Amber from the nearby grove is carved here into charms and trinkets." |
| curio hall | Chronicle hall | "Old bones and stones dug up nearby are kept and shown here." |
| shrine | Shrine | "A small holy place. It comforts the people who live here." |

| Trait | Chip | Tooltip |
|---|---|---|
| `iron_town` | Iron Town | "Ore is mined nearby and worked in the smithy here. Its smiths are known across the region." |
| `gem_cutters` | Gem-cutters' Town | "Its cutters turn rough stones from the nearby deposit into gems sold far away." |
| `herb_town` | Herb Town | "Its remedies, mixed from herbs grown nearby, are sought by the sick of the region." |
| `spa_town` | Spa Town | "People travel here to rest in its warm healing spring." |
| `crystal_seers` | Crystal Seers | "Its seers read omens in crystal from the nearby caverns." |
| `amber_market` | Amber Market | "Amber carvings from here are sold in towns far away." |
| `curio_collectors` | Curio Collectors | "It keeps and shows the strange old things dug up nearby." |
| `timber_town` | Timber Town | "It cuts more timber than it needs and sells the wares." |
| `quarry_town` | Quarry Town | "It cuts more stone than it needs and sells it." |
| `fishing_port` | Fishing Port | "Its boats feed the town and sell what is left over." |
| `horse_country` | Horse Country | "Herds graze the grasslands around it." |
| `walled` | Walled | "Stone walls guard it. An army has to besiege it, not just walk in." |
| `breadbasket` | Breadbasket | "Its fields are rich. It grows more food than most towns its size." |
| `market_town` | Market Town | "Several trade roads meet here, and its market is busy." |
| `restless` | Restless | (quoted above, with how it agrees with Lawless) |

### Playtest signal

A warm tester who opens two towns of the same size can say one thing that is different about them: a building, a trait, or where their food goes. A tester whose god blights a town's fields sees that town's livelihood line change within a day.

### Event notifications

Chronicle lines only (§ Prose tables). There are no toasts: the economy is weather, and the Needs-you queue stays for the god's choices. A threaded mortal's home going hungry already pulls a livelihood thread tug (`resourceStockTiers.ts`). It now reads the settlement's food tier, so a starving home tugs.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getSettlementEconomy(locationId)` (async) returns:
  - `population`, `cap`, the meters, `foodBalance`, `buildBalance`
  - worked hexes with yields, buildings with idle days
  - seat / pull count, routes in and out, `targetTier`, `landShocks`
- `window.__DEBUG.getSettlementDiversity()` returns the four measures and their PASS/FAIL flags.
- `src/debug-bridge.d.ts` documents both.
- The DebugPanel economy tab gets a settlements table: name, population, tier → target, buildings, traits, routes.

### Visual presence (HexMapV2)

N/A for new layers. Tier icons (subject to the redraw check above) and the lane layer render what changes. The Trade lens design ([THR-1830](https://linear.app/threadbare/issue/THR-1830), decided, build pending in [THR-1878](https://linear.app/threadbare/issue/THR-1878)) owns how routes look.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `phases/settlementEconomy.ts` | `settlement_economy` (pre-economy, daily) | — | settlement node props; `resourceBalance` | `settlement_economy_day` (spotlight only), `settlement_growth` | `getSettlementEconomy` |
| `settlementEconomy/building.ts` | same | `SublocationCard` (building tag) | building Places | `settlement_building_raised`, `settlement_building_lost`, `settlement_building_idle` | DebugPanel table |
| `settlementEconomy/surplusRoutes.ts` | same | `LivelihoodLine` | `trades_with` props | `surplus_route_born`, `surplus_route_ended` | lane layer, Trade lens |
| `settlementEconomy/tier.ts` | same → `settlement_tier_change` | size line | `targetTier`, `locationSubtype` | existing `settlement_tier_change` (+ `cause`) | `getSettlementEconomy` |
| Trait rules | `location_trait` | trait chips | `has_trait` | existing trait traces | existing |
| Happiness term | `unrest` | (prosperity / lawless already) | `unrest` | `settlement_happiness` (on change) | table |
| God-verb land shocks | `graphOpExecutor` ops | livelihood line, cast receipt | `landShocks` | `settlement_land_shock` | `getSettlementEconomy` |
| Siege land read | `settlement_economy` reads siege `actor` nodes (`battleState.battleType === 'siege'`, `settlementId`) | livelihood line | none stored (derived daily) | `settlement_land_shock` (`source:'siege'`, first and last day) | `getSettlementEconomy` (`besiegedBy`) |
| Worldgen settling | `worldSeed.ts` | — | all of the above at t0 | muted | `getSettlementDiversity` |

## Interface impact

`Docs/canon/interface-map.md` lists Economy & Prosperity as audit-on-touch (:402), so these rows are new. Mapped subsystems this plan reads without changing their contracts:
- War, Armies & Battles: siege state, read for land shocks.
- Factions & Succession: seats, read only.
- Essence & Divine Economy: no read or write; the god verbs' essence costs are untouched.
- Traits: the location trait rules are extended.

| Contract | Kind | Production read site |
|---|---|---|
| `settlement-economy-writes-resource-balance` | **add** (writer change; reader preserved) | `phaseProsperity.ts:444` |
| `settlement-economy-drives-tier` | **add** | `phaseSettlementPromotion.ts` (`targetTier`) |
| `settlement-economy-raises-buildings` | **add** | `LocationView.tsx:1492`, `getVisibleSubLocations` |
| `surplus-route-carries` | **add** | `phaseTradeRouteDecay.ts` (`lastTraded`), Trade lens, purse (THR-1867) |
| `building-trait-grant` | **add** | `phaseLocationTraits.ts` |
| `happiness-term-into-unrest` | **add** | `phaseUnrest.ts` |
| `god-verb-land-shock` | **add** | `settlement_economy` land yields |
| `siege-cuts-settlement-land` | **add** (read of War's siege node; War's code unchanged) | `settlement_economy` land yields; reader of `battleState.settlementId` |
| `food-balance-sets-famine-tier` | **extend** | `resourceStockTiers.ts`; scarcity arcs (`economicPower.ts`) |

`scripts/interface-contracts.ts` gets the same rows. The systems-inventory row for Mortal Economy & Prosperity gains "settlement economy (population, buildings, surplus routes)". The Design Reference Wiki economy page whose `sources` match updates in the same PR.

## Constants table

All constants live in `src/data/settlement-economy-constants.ts`. Defaults are the prototype values.

| Constant | Default | Purpose |
|----------|---------|---------|
| `SETTLEMENT_ECONOMY_ENABLED` | `true` | Master switch. `false` skips the phase and the worldgen settling run entirely, so the game behaves as before this plan. The rollback lever |
| `SETTLEMENT_ECONOMY_DRIVES_TIER` | `true` | Tier from population + seat; `false` restores the prosperity trigger while the rest of the economy runs |
| `SETTLEMENT_ECONOMY_TICK_OFFSET` | `0` | Which tick of the day the phase runs |
| `SETTLEMENT_SETTLING_DAYS` | `100` | Worldgen settling run before tick 0 |
| `WORK_RADIUS` | `3` | Hexes a settlement can work (Civ city radius) |
| `CENTRE_YIELD` | `[2, 1, 1]` | Minimum yield of the settlement's own hex |
| `DEPOSIT_YIELD_DIVISOR` | `50` | Deposit quantity ÷ this = extra yield on its hex |
| `FOOD_PER_PERSON` | `1.5` | Daily food one person eats |
| `WOOD_PER_PERSON` | `0.25` | Daily wood/stone upkeep per person |
| `STORE_DAYS` | `3` | Food store size, in days of need ("no stockpiles") |
| `GROWTH_BASE` / `GROWTH_PER_PERSON` | `12` / `4` | Growth meter size to gain one person |
| `STARVE_DAYS` | `6` | Empty store + meter for this long loses one person |
| `LAND_PER_HOME` | `2.5` | Food per home in the land housing base |
| `HOUSING_PER_BUILDING` | `3` | Homes a housing quarter adds |
| `TOWN_POP` / `CITY_POP` / `CAPITAL_POP` | `4` / `10` / `14` | Tier thresholds |
| `TOWN_MAX_POP` | `9` | Ceiling without a pulling seat ("a town can be the outcome of a strong local economy") |
| `SEAT_MIN_INCOMING` | `2` | Incoming routes that make a seat with no holdings pull |
| `PULL_HOMES` / `PULL_MAX` | `2` / `6` | Homes per pull source, and the cap on sources |
| `SEAT_DRAW` | `0.5` | Share of held settlements' surplus sent to the seat |
| `BUILDING_SLOTS` | `{ hamlet: 2, town: 3, city: 5, capital: 6 }` | Room for buildings |
| `SURPLUS_TAG_BONUS` | `1.0` | Build-choice pull toward the largest surplus |
| `FOOD_RICH_BONUS` | `0.8` | Pull toward food buildings on rich land |
| `FOOD_RICH_RATIO` | `1.3` | Food yield ÷ need that counts as rich land |
| `BUILD_SCORE_BASE` | `1` | Base score of every candidate building |
| `WORK_FOOD_WEIGHT` / `WORK_FOOD_WEIGHT_SHORT` | `2` / `3` | Food weight when choosing which hexes to work (normal / store short) |
| `LAND_HOUSING_MIN` | `2` | Least homes any settlement has |
| `SPECIAL_GOOD_BONUS` | `1.2` | Pull toward a special good in reach |
| `HOUSING_PRESSURE_BONUS` | `1.5` | Pull toward housing near the cap |
| `PATH_BONUS` | `1.0` | Per owned building sharing the tag (character) |
| `LEAN_BONUS` | `0.5` | The holder faction's natural building |
| `BUILD_CHOICE_JITTER` | `0.25` | Seeded tie-break |
| `IDLE_DAYS_TO_LOSE` | `20` | Idle days before a building is lost |
| `SURPLUS_ROUTE_RANGE` | `8` | Hexes a seller looks for a buyer |
| `ROUTE_PERSIST_DAYS` / `ROUTE_DIE_DAYS` | `3` / `6` | Surplus days before a route; dry days before it ends |
| `GOODS_IMPORT_FACTOR` | `0.5` | Share of carried goods that reaches the buyer's build meter |
| `SURPLUS_ROUTE_VOLUME_PER_UNIT` | `1` | `volume` per unit carried per day (capped at `TRADE_ROUTE_MAX_VOLUME`) |
| `SHOCK_BLIGHT_FACTOR` / `SHOCK_BOON_FACTOR` / `SHOCK_SIEGE_FACTOR` | `0.3` / `1.5` / `0.2` | Land shock multipliers |
| `SHOCK_DAYS` | `20` | Shock fade length |
| `ORE_SPECIAL_MIN` | `60` | Ore deposit quantity that counts as a special good |
| `BREADBASKET_ENTER` / `_RELEASE` | `3.0` / `2.6` | Food per worked hex for the trait |
| `RESTLESS_ENTER` / `RESTLESS_RELEASE` | `30` / `15` | Unrest for the Restless trait (below Lawless's 50 / 30) |
| `ROUTE_HAPPY` / `HUNGER_UNHAPPY` / `CROWDING_PER_UNHAPPY` | `1` / `−2` / `5` | Happiness terms |
| `UNREST_FROM_HAPPINESS` / `UNREST_HAPPINESS_MAX` | `4` / `20` | Unrest per point of unhappiness; bound |
| `ECON_PHASE_SPOTLIGHT_CAP` | `40` (**existing**, `src/data/resource-classes.ts:55`; reused, not redefined) | Settlements that emit full-detail chronicle and traces |
| `DIVERSITY_SIZE_CV_TOLERANCE` | `0.02` | Measures 1 and 4: allowed drop |
| `DIVERSITY_DISTINCT_PAIR_MIN` | `0.5` | Measure 2: share of same-tier pairs that must differ |
| `DIVERSITY_TOP_TRAIT_MAX` | `0.5` | Measure 3: no trait on more than this share |
| `DIVERSITY_COMBOS_MIN_SHARE` | `0.33` | Measure 3: distinct trait sets ÷ settlements |

## Tracing

```ts
// settlement_economy_day — one per spotlight settlement per day (ECON_PHASE_SPOTLIGHT_CAP)
interface SettlementEconomyDayTrace {
  category: 'settlement_economy_day';
  tick: number; locationId: string;
  population: number; cap: number; workedHexes: number;
  foodYield: number; foodNeed: number; foodBalance: number;
  buildYield: number; upkeep: number; buildBalance: number;
  importedFood: number; importedGoods: number; pullCount: number;
}
// settlement_growth — a person gained or lost
interface SettlementGrowthTrace {
  category: 'settlement_growth'; tick: number; locationId: string;
  delta: 1 | -1; population: number; cause: 'surplus' | 'starvation';
}
// settlement_building_raised / _lost / _idle
interface SettlementBuildingTrace {
  category: 'settlement_building_raised' | 'settlement_building_lost' | 'settlement_building_idle';
  tick: number; locationId: string; buildingId: string; placeId: string;
  score?: number; runnerUp?: string;               // raised: why this one
  reason?: 'upkeep_short' | 'input_lost' | 'adopted';
}
// surplus_route_born / _ended
interface SurplusRouteTrace {
  category: 'surplus_route_born' | 'surplus_route_ended';
  tick: number; fromId: string; toId: string; carries: 'food' | 'goods';
  carriedPerDay: number; reason?: 'own_seat' | 'nearest_buyer' | 'surplus_ended' | 'blockaded';
}
// settlement_land_shock
interface SettlementLandShockTrace {
  category: 'settlement_land_shock'; tick: number; locationId: string;
  hexKey: string; channel: 0 | 1 | 2; factor: number; untilTick: number;
  source: 'bless_harvest' | 'blight' | 'sour_mine' | 'reveal_vein' | 'siege';
}
// settlement_happiness — when the bounded unrest term changes band
interface SettlementHappinessTrace {
  category: 'settlement_happiness'; tick: number; locationId: string;
  happiness: number; unrestTarget: number;
}
```

`settlement_tier_change` gains `cause: 'population' | 'seat_lost' | 'seat_gained' | 'prosperity'`.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Settlement has no hex coords | Works only its centre (`CENTRE_YIELD`); warn once per id |
| Terrain missing from `TERRAIN_YIELDS` | Yields 0/0/0; completeness test catches it at build time |
| A building's Place type is missing from the registry | Skip building it; warn once; the completeness test catches it |
| Seat edge points at a missing node | Treat as no seat (town ceiling); no throw |
| Siege node with no `battleState.settlementId` | Ignore that node; no throw |
| Buyer node deleted mid-route | Route ends with `reason:'surplus_ended'`; edge removal goes through existing decay |
| `population` absent (old save) | Initialise from the tier's genome start population capped at the land cap, on first run |
| NaN / negative meter | Clamp to 0; trace once |
| Phase throws for one settlement | Catch per settlement, skip it this day, log; never abort the tick |
| `SETTLEMENT_ECONOMY_DRIVES_TIER=false` | The prosperity promotion trigger runs as today |
| `SETTLEMENT_ECONOMY_ENABLED=false` | Phase and settling run skipped; place page falls back to today's livelihood line (no size line, no building tags) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | 140 importers (measured: files with `from '…/trace'`, 2026-10-14) | Additive union members only; no field renamed |
| `src/engine/orchestrator.ts` | 123 importers | **Not edited.** The phase registers through `phaseRegistry` (registered-phase list). The promotion and unrest changes live in `phaseSettlementPromotion.ts` (4 importers) and `phaseUnrest.ts` (4) |
| `src/engine/graphOpExecutor.ts` | 44 | Four god-verb ops gain one `landShocks` append each; their existing writes are untouched |
| `src/engine/worldSeed.ts` | 25 | The settling run is appended after lane seeding, with chronicle and traces muted, and is deterministic. Worldgen snapshots and fixtures that pin settlement sizes or subtypes will change; regenerate them |

`graph.ts`, `gameState.ts`, `unifiedAction.ts` and `traceBuffer.ts` are not edited.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (encounter wiring N/A with rationale; it belongs to THR-1869/1872)
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict a Vision premise. It realises the north star's living world, which the god moves through mortals. The god acts on the economy only through existing verbs, which now land as land shocks the player can see.
- [x] No Vision edit needed.

## Rulebook impact

- [ ] This plan does not change a rule of play. **It does:** it changes how a settlement grows, what makes a city or capital, and what blight and bless do over time.
- [x] So `Docs/canon/rulebook.md` §§ economy (~:380-470) is updated **in the implementation PR**, an executor action item, with these rules in plain words.

> Brainstorm companion: `Docs/plans/2026-10-14-thr-1923-settlement-economy-brainstorm.md`.

## Game Design Laws check

`Docs/game-design/laws.md`:

- **36 (the purse is small):** untouched; this is the mortal economy.
- **41 (one vocabulary of effects):** god verbs reach the land through their existing ops plus one land-shock write. There is no second effect system.
- **42 (simple framework, richness in connections):** one daily phase and data entries. Richness comes from seats, routes, war and the purse.
- **43 (one concept per thing):** happiness folds into `unrest`, and buildings are Places.
- **45 (never promise what the world will not do):** every building, trait and livelihood line reads live state. An idle building says *idle*.

No [E] law is broken.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 40+ named constants in one file; tables are data (terrain, buildings, special goods, lean, traits) |
| 2. Inspectability | PASS | Seven trace types; `getSettlementEconomy` / `getSettlementDiversity`; DebugPanel table; flat node props |
| 3. Determinism | PASS | One seeded draw per build choice; id-ordered iteration and tie-breaks; settling run seeded |
| 4. Fail-soft | PASS | Per-settlement catch; fail-soft table above |
| 5. Narrative over mechanical perfection | PASS with note | The economy speaks through chronicle lines and place-page sentences, never numbers. Equilibrium is silent by design, so stories come from shocks, war and seats |
| 6. Additive over destructive | PASS with note | Prosperity's reader and the promotion writer are kept. The tier trigger and capital immutability change behind `SETTLEMENT_ECONOMY_DRIVES_TIER`. `SETTLEMENT_ECONOMY_ENABLED=false` turns off the whole economy, including the settling run, buildings, routes and the happiness term |
| 7. Performance budget | PASS with note | Daily phase, 38 settlements × ~37 hexes on medium; the ownership cache is keyed on structure. The heavy test asserts phase time < 2 ms per day on medium and < 4 ms on large. The worldgen settling run (100 days) must add < 300 ms to world creation on medium; the heavy test measures it. The unrest and trait additions are one read each on the existing per-tick passes |

## Done when

- [ ] A heavy test (`npm run test:heavy`) runs the settling run plus 150 game days headless on seeds 42 and 99 (medium) and asserts measures 1–4 all PASS. In the browser, on the `?view=game&seeded&size=medium` world (a different map from `--seed 42`), `await window.__DEBUG.getSettlementDiversity()` after `window.__DEBUG.tick(1800)` reports all four PASS.
- [ ] Day-0 tier is within one step of the genome tier for at least 80% of settlements on seeds 42 and 99 (the sketch reaches 34 of 38 on seed 42).
- [ ] A settlement whose faction seat pulls nothing never passes town. A capital that loses its realm seat drops a tier within `SETTLEMENT_PROMOTION_SUSTAIN_TICKS`. A test covers each.
- [ ] A surplus route is born from a settlement capped at town with lasting food surplus, carries daily (`lastTraded` updated), and ends `ROUTE_DIE_DAYS` after the surplus stops. A test covers this.
- [ ] Blight on a settlement lowers its best food hex's yield. The cast receipt shows the quoted land line in the same receipt as the existing lines, and the livelihood line changes within one day. Browser evidence: the receipt, plus the place page before and after, at 1920×1080. The same holds for Bless the Harvest, Sour Mine and Reveal Vein (a test per verb).
- [ ] The place page shows the size line, livelihood sentences, building cards and trait chips with tooltips, with no numerals and no raw ids. Four-part browser evidence (screenshot at 1920×1080, console clean, a `__DEBUG` assertion, a UI-Laws line for Laws 1, 13/14, 17, 21, 33, 37, 58).
- [ ] Completeness tests: every `TerrainType` has a yield; every building's Place type exists and has a tooltip; every new trait has a tooltip.
- [ ] Interface-map rows, `scripts/interface-contracts.ts`, systems-inventory and the matching wiki page are updated; `Docs/canon/rulebook.md` economy section is updated.
- [ ] The heavy test records phase time per day (< 2 ms medium, < 4 ms large) and the settling run's added world-creation time (< 300 ms medium).
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build` pass; a 30-tick CLI smoke and `npm run test:heavy` pass (engine files).

## Kill criteria

Stop and take the measured numbers to Christian, in plain words, when any of these hold:

1. **Diversity fails in the engine.** The engine run fails any of the four measures on seeds 42 and 99, even after tuning the named levers (`PATH_BONUS`, `BUILDING_SLOTS`, the seat-pull rule, `LAND_PER_HOME`). **Stop action:** do not merge; post the failing measure and the tuning tried on the issue.
2. **The world reshapes at game start.** Fewer than 80% of settlements start within one tier of their genome tier. **Stop action:** do not merge; the settling run or start sizes need redesign.
3. **The diversity does not reach the player.** A warm playtest tester cannot name one difference between two same-size towns. **Stop action:** the model stays and the UI section is reworked. File the finding against this plan.
4. **Too slow.** The phase costs more than 2 ms per day on medium. **Stop action:** profile before cutting any rule. A rule is cut only with Christian's yes.

## UL terms

These are new terms, filed as [UL-proposal THR-1924](https://linear.app/threadbare/issue/THR-1924) before handoff. The executor uses the words the proposal settles; if it is still open at build time, the executor uses these:
- **Population**: how many people a settlement has. Shown only as a size word and trend.
- **Building**: a Place raised by the settlement economy (UL "Place" stays the parent term).
- **Surplus route**: a trade route born from a settlement's lasting surplus.
- **Pulling seat**: a faction seat that draws resources in.
- **Happiness**: not a new stat. It is the bounded term that buildings and hunger write into **Unrest**. Define it as a sub-entry of Unrest, so the player and agents learn one concept (Game Design Law 43).

## Coordination block

**Suggested model:** opus. A new engine phase with a worldgen pre-run, cross-system reads (seats, realms, lanes, traits, unrest), a UI section, and a measured acceptance test.

**Parallel-safe with:** [THR-1919](https://linear.app/threadbare/issue/THR-1919) (the scarcity-arc cap in `economicPower.ts`; this plan only feeds it a food tier). UI build plans other than the Inspector (THR-1875, THR-1877, THR-1878, THR-1879) are file-disjoint.

**Mutex with:**
- [THR-1862](https://linear.app/threadbare/issue/THR-1862), the economy-read fixes: same economy readers (`phaseProsperity.ts`, `resourceStockTiers.ts`).
- [THR-1883](https://linear.app/threadbare/issue/THR-1883), the seize-toll fix: same `tradeRouteOps.ts` / route props.
- [THR-1876](https://linear.app/threadbare/issue/THR-1876) (the Inspector): the place-page section. Whichever lands second ports the section.

**Files to touch:**
- Create:
  - `src/engine/phases/settlementEconomy.ts`
  - `src/engine/settlementEconomy/{land,growth,building,seat,surplusRoutes,tier,measures}.ts`
  - `src/data/{terrain-yields,settlement-buildings,special-goods,faction-building-lean,settlement-economy-constants}.ts`
  - tests beside each
- Edit:
  - `src/engine/worldSeed.ts`: the settling run
  - `src/engine/phaseSettlementPromotion.ts`: read `targetTier` behind the flag; capital may drop
  - `src/engine/phaseUnrest.ts`: the happiness term
  - `src/engine/phaseLocationTraits.ts` + `src/data/location-trait-constants.ts`: trait rules
  - `src/engine/phases/resourceStockTiers.ts`: settlement food tier from `foodBalance`
  - `src/engine/graphOpExecutor.ts`: land shocks on the four god verbs
  - `src/engine/castTargetChanges.ts` (the cast receipt): the land line; the four verbs' effect sentences in `unified-action-templates.ts`
  - `src/data/economic-chronicle-content.ts`: triggers
  - the sublocation type registry + `src/data/sublocation-category-art.ts`: 5 new Place types
  - the tooltip registry
  - `src/components/Game/LocationView.tsx`: size line, livelihood, building tag
  - DebugPanel economy tab
  - `src/debug-bridge.ts` + `src/debug-bridge.d.ts`
  - `src/types/trace.ts`
  - `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `Docs/canon/systems-inventory.md`, `Docs/canon/rulebook.md`

## Notes for the executor

- **Do not stockpile.** `foodStore` is capped at `STORE_DAYS` of need; anything above it is growth or export, never a bigger store. This is Christian's ruling.
- **Do not ship goods to even out the map.** Routes carry only surplus that is looking for a buyer, and only from a seller whose own sink is full.
- **A seat that pulls nothing is a town.** Guild HQs without holdings become cities only through incoming routes. This is deliberate: *"a faction HQ in the city that can pull in resources"*.
- **Prosperity stays the shared scalar.** Do not make other systems read `population` or the meters; they read prosperity and tiers as today.
- **The prototype is a sketch, not the spec.** It skips war, god verbs and faction moves, and it measures diversity on a still world. If the engine run fails a measure, tune the constants table first; the levers that mattered most were `PATH_BONUS`, `BUILDING_SLOTS`, the seat-pull rule, and land-based housing.
- The genome "Task 10" materialize gap (`phaseSettlementReassessment.ts:57-73`) stays out of scope. Buildings come from this phase.

## Forked-audit verdicts

*Intent judge (opus): Revise → Revise → Revise → **Allow** on the fourth pass, 2026-10-14. The fixes added cast-receipt text for the four god verbs, kill criteria, UL-proposal [THR-1924](https://linear.app/threadbare/issue/THR-1924), `idleDays` moved onto the building node, the full building and trait text, the master switch `SETTLEMENT_ECONOMY_ENABLED`, the siege read and its text, and empty-slot fallbacks.*

*Generated by design-audit-pipeline — 2026-10-14 (three sonnet auditors, run in parallel). The notes are folded into the plan above.*

### NFP audit

**NFP AUDIT: PASS-with-notes.**
- **Tunability:** a few literal numbers remained (the food-rich ratio, the work weights, the base score, the housing minimum). Now named: `FOOD_RICH_RATIO`, `WORK_FOOD_WEIGHT` / `WORK_FOOD_WEIGHT_SHORT`, `BUILD_SCORE_BASE`, `LAND_HOUSING_MIN`.
- **Determinism:** the PRNG wording said one draw per choice while the formula draws once per candidate. Clarified to one draw per candidate, in building-table order.
- **Additive over destructive:** capital immutability is dropped, and worldgen fixtures will churn. Both are declared.
- **Performance:** there was no large-map or settling-run budget. Added: < 4 ms per day on large, and < 300 ms for the settling run on medium, both in Done-when.
- Inspectability, Fail-soft and Narrative: PASS.

### Three-pillar audit

**PILLAR AUDIT: PASS-with-notes.**
- Engine, Content and UI are each present and substantive. The Wiring table connects each pillar to its phase, component, field, trace and debug surface.
- The substrate inventory extends Mortal Economy & Prosperity, Unrest, Location Traits and siege state. It duplicates nothing in the inventory.
- The only gap was a missing Attachment content line. It is now N/A with a reason.
- The auditor did not read `wiring-checklist.md` in full (509 KB, over its read limit).

### Vision audit

**VISION AUDIT: PASS-with-notes. No contradictions.**
- **Confirmed:** "narrative over mechanical", "mechanics surface through prose, never numbers", and "the player is a god, not a protagonist" (extended: existing verbs gain a land effect, and no direct control is added).
- **Note:** the economy links to the player's named mortals only through the livelihood thread tug for a threaded mortal's home.
- **Note:** the plan leans toward emergence. It names the silence at equilibrium and the shock, war and seat inputs that break it.
