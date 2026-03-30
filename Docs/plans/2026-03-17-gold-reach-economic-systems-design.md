# Gold Reach Economic Systems — Design Proposal

> Written 2026-03-17. Design-time brainstorm for economic simulation systems that give Gold Reach agents something meaningful to do, visible to the player through prose, encounters, and location evolution.

---

## Design Philosophy

**Numbers behind the scenes, prose for the player.** Every system below produces numeric state that the engine tracks, but the player experiences it as narrative: a market that "thrums with coin and argument," a guild that "quietly buys up the grain supply," a trade route that "withers as bandits grow bold." The simulation runs on math; the player reads stories.

**Economical to implement.** Each system is a thin layer on existing primitives — graph nodes/edges, location properties, CRUD actions, encounter templates, prose resolvers. No new engine subsystems. No new UI panels in the first pass.

---

## System 1: Settlement Prosperity

### What it is
Every location with a settlement type (hamlet, town, city, capital) gets a `prosperity` property (0–100 scale) and an abstract `population` count. These numbers tick up or down based on what's happening economically — active trade routes boost prosperity, disrupted trade tanks it, abundant resources help, scarce ones hurt.

### Graph representation
**No new node types.** Prosperity and population are properties on existing location nodes:

```
location.properties.prosperity: number          // 0–100
location.properties.population: number          // abstract headcount
location.properties.populationTrend: 'growing' | 'stable' | 'declining' | 'collapsing'
location.properties.populationLagTicks: number  // seeded at creation via PRNG, range POPULATION_LAG_TICKS_MIN to _MAX
```

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `PROSPERITY_DELTA_CLAMP` | 10 | Max absolute change per tick |
| `PROSPERITY_TRADE_BONUS_PER_ROUTE` | TBD | Prosperity gain per active `trades_with` edge, scaled by volume |
| `PROSPERITY_TIER_FLOURISHING` | 80 | Threshold for "Flourishing" prose and promotion eligibility |
| `PROSPERITY_TIER_PROSPEROUS` | 60 | Threshold for "Prosperous" prose, passive wealth generation |
| `PROSPERITY_TIER_MODEST` | 40 | Threshold for "Modest" prose, Market District spawn |
| `PROSPERITY_TIER_STRUGGLING` | 20 | Threshold for "Struggling" prose, sublocation dissolution, demotion |
| `POPULATION_LAG_TICKS_MIN` / `_MAX` | 1 / 3 | Range for population-follows-prosperity delay, seeded per settlement at creation via PRNG |
| `SETTLEMENT_PROMOTION_PROSPERITY` | 70 | Sustained prosperity for hamlet→town→city |
| `SETTLEMENT_PROMOTION_SUSTAIN_TICKS` | TBD | How many ticks prosperity must stay above threshold |
| `SETTLEMENT_DEMOTION_PROSPERITY` | 20 | Sustained low prosperity for city→town→hamlet |

### Tick behavior
Each cycle, during a new `phaseProsperity` orchestrator phase:

1. **Base income** = sum of local resource quantities × renewal rates (productive capacity)
2. **Trade bonus** = count of active `trades_with` edges × `PROSPERITY_TRADE_BONUS_PER_ROUTE` × volume
3. **Disruption penalty** = active disruptions, recent raids, broken agreements
4. **Prosperity delta** = clamp(base + trade - disruption, -`PROSPERITY_DELTA_CLAMP`, +`PROSPERITY_DELTA_CLAMP`) per tick
5. **Population follows prosperity** with lag (`populationLagTicks`, seeded per settlement at creation)

### Tracing

`phaseProsperity` emits one trace per settlement per tick — each component of the delta is visible, not just the result:

```typescript
interface ProsperityTickTrace {
  type: 'prosperity_tick';
  locationId: string;
  baseIncome: number;
  tradeBonus: number;
  disruptionPenalty: number;
  netDelta: number;
  previousProsperity: number;
  newProsperity: number;
  previousTier: ProsperityTier;
  newTier: ProsperityTier;
  tierChanged: boolean;
}
```

Settlement promotion/demotion emits a separate `settlement_tier_change` trace with the sustained-tick count and direction.

### Fail-soft

| Failure case | Fallback |
|-------------|----------|
| Location has no `resources` property | `baseIncome = 0`, proceed normally |
| Non-settlement location processed | Skip — `phaseProsperity` filters to settlement-typed locations only |
| Prosperity would exceed 0–100 range | Clamp to bounds |
| Missing `populationLagTicks` | Default to `POPULATION_LAG_TICKS_MIN`, emit warning trace |

### Prosperity tiers (prose hooks)

| Range | Label | Prose flavor |
|-------|-------|-------------|
| ≥ `PROSPERITY_TIER_FLOURISHING` | Flourishing | "The streets overflow with merchants hawking silks no one needs" |
| ≥ `PROSPERITY_TIER_PROSPEROUS` | Prosperous | "Honest trade keeps the granaries full and the taverns loud" |
| ≥ `PROSPERITY_TIER_MODEST` | Modest | "People get by. The market has what you need, rarely what you want" |
| ≥ `PROSPERITY_TIER_STRUGGLING` | Struggling | "Half the stalls stand empty. Children eye travelers' packs" |
| < `PROSPERITY_TIER_STRUGGLING` | Destitute | "The settlement is a husk. Those who can leave, have" |

### Settlement tier promotion/demotion
When prosperity stays above `SETTLEMENT_PROMOTION_PROSPERITY` for `SETTLEMENT_PROMOTION_SUSTAIN_TICKS`, a hamlet can become a town, a town can become a city. When it stays below `SETTLEMENT_DEMOTION_PROSPERITY` for the same duration, the reverse. This uses existing `update_node` GraphOps to change `locationType`. Promotions and demotions generate chronicle entries.

### Player visibility
- **HexChronicle / location detail:** Prosperity label appears in location prose (via a new `prosperityResolver`)
- **Hex map:** Settlement icon could gain a visual indicator (glow, size) but that's optional polish — the prose carries it first
- **Narrative log:** Tier changes ("The hamlet of Thornfield has grown into a proper town") appear as notable events

---

## System 2: Trade Routes & Agreements

### What it is
Trade routes are the economic arteries. They connect two settlements, flow resources between them, and generate wealth for both ends. They can be established, improved, taxed, disrupted, and destroyed. Agreements are the political scaffolding — pacts between factions or agents that govern trade terms.

### Graph representation
Trade routes already exist as `trades_with` edges. We enrich them with new properties (additive — existing `volume` property preserved):

```
trades_with edge properties:
  volume: number          // 1–TRADE_ROUTE_MAX_VOLUME scale, how much flows
  goodsType: ResourceType // primary resource being traded
  established: tick       // when created
  lastTraded: tick        // freshness — routes decay if unused
  controlledBy: nodeId?   // which faction/agent taxes this route
  threatened: boolean     // bandits, war, etc.
```

Agreements use the existing **attachment system** — specifically the `agreement` category (pact, debt, favour, oath, treaty, bargain). A trade agreement is an agreement attachment on a faction or agent:

```
agreement attachment:
  subcategory: 'treaty' | 'pact' | 'bargain'
  terms: { resourceType, volume, duration, exclusivity }
  parties: [nodeId, nodeId]
  expiresAtTick: number | null
```

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `TRADE_ROUTE_MAX_VOLUME` | 10 | Cap on route volume |
| `TRADE_ROUTE_DECAY_RATE` | 1 | Volume lost per tick when unused |
| `TRADE_ROUTE_FRESHNESS_WINDOW` | TBD | Ticks of inactivity before decay starts |

### New Gold actions (expand the existing 4)

| Action | CRUD | What it does |
|--------|------|-------------|
| **Establish Trade** | CREATE | Already exists. Enriched: now specifies goodsType, creates route with volume 1 |
| **Negotiate Agreement** | CREATE | New. Two factions/agents formalize trade terms. Creates agreement attachment on both parties. Success requires Gold + Heart capability check |
| **Expand Trade** | UPDATE | **Evolves** the existing `gold.trade` template (same id, backward-compatible). Adds volume-scaling difficulty. Does NOT replace or rename — existing references to `gold.trade` remain valid |
| **Tax Trade Route** | UPDATE | New. A faction claims control of a route, extracting wealth. Requires controlling the route's midpoint or endpoint location |
| **Disrupt Trade** | DELETE | Already exists. Enriched: now degrades volume, marks route as threatened |
| **Break Agreement** | DELETE | New. Unilaterally end a trade agreement. Cheap to do, expensive in reputation. Triggers `loyalty_treachery` value pair |

### Trade route decay
Routes that aren't actively traded on (no Trade action within `TRADE_ROUTE_FRESHNESS_WINDOW` ticks) lose `TRADE_ROUTE_DECAY_RATE` volume per tick. At volume 0, the edge is removed. This means trade routes require maintenance — agents must keep choosing to trade, or commerce dies.

### Tracing

Every route volume change emits a `trade_route_volume_change` trace:

```typescript
interface TradeRouteVolumeChangeTrace {
  type: 'trade_route_volume_change';
  edgeId: string;
  sourceId: string;    // settlement A
  targetId: string;    // settlement B
  previousVolume: number;
  newVolume: number;
  cause: 'established' | 'expanded' | 'decayed' | 'disrupted' | 'taxed';
  causingActorId?: string;
  causingActionId?: string;
}
```

When a route dies (volume → 0, edge removed), emit a `trade_route_dissolved` trace summarizing its full lifetime: established tick, peak volume, total ticks active, cause of death.

### Fail-soft

| Failure case | Fallback |
|-------------|----------|
| `trades_with` edge references a removed node | Skip in prosperity calculation, emit warning trace, queue edge for cleanup |
| Trade route decay on already-removed edge | No-op |
| Agreement attachment references a deleted party | Agreement becomes void, emit trace, clean up attachment |
| Missing `lastTraded` on legacy edge | Treat as `established` tick, proceed with normal decay logic |

### Player visibility
- **Prose:** "A steady stream of ore carts links Ironhaven to Millford" / "The road between them grows quiet"
- **Location detail:** Active trade routes listed as part of location description
- **Agent actions:** When agents choose trade actions, the narrative log explains what they're trading and with whom
- **Encounters:** Trade caravans as encounter opportunities (escort, raid, negotiate toll)

---

## System 3: Guilds as Economic Factions

### What it is
Guilds are factions — same `actor` node type, same axiological profiles, same action selection pipeline. What makes them guilds is their **reach preferences** (heavily Gold-weighted), their **sublocations** (guild halls, workshops, warehouses), and their **behavioral coloring** (they pursue wealth and craft mastery rather than territory or worship).

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `GUILD_SPAWN_COUNT_MIN` | 1 | Min guilds per qualifying settlement |
| `GUILD_SPAWN_COUNT_MAX` | 2 | Max guilds per qualifying settlement |
| `GUILD_GOLD_CAP_MIN` / `_MAX` | 60 / 80 | Gold domain capability range for guild factions |
| `GUILD_SECONDARY_CAP_MIN` / `_MAX` | 30 / 50 | Secondary domain capability range |
| `GUILD_MINOR_CAP_MIN` / `_MAX` | 10 / 20 | Minor domain capability range |
| `GUILD_WAREHOUSE_THRESHOLD` | 30 | Guild wealth needed to spawn Warehouse sublocation |
| `GUILD_MARKET_STALL_THRESHOLD` | 20 | Guild wealth needed to spawn Market Stall |
| `GUILD_COUNTING_HOUSE_THRESHOLD` | 50 | Guild wealth needed to spawn Counting House |

### Guild generation (during world seeding)
When a settlement is town+ tier at world creation, spawn `GUILD_SPAWN_COUNT_MIN` to `GUILD_SPAWN_COUNT_MAX` guild factions (count chosen via seeded PRNG):

```
Guild faction properties:
  actorType: 'faction'
  guildType: 'merchants' | 'artisans' | 'miners' | 'traders' | 'bankers'
  domainCapabilities: { gold: GUILD_GOLD_CAP_MIN–MAX, [secondary]: GUILD_SECONDARY_CAP_MIN–MAX, [others]: GUILD_MINOR_CAP_MIN–MAX }
  axiologicalProfile: biased toward greed, cunning, ambition (but not uniformly — a miners' guild might be tradition-heavy)
  homeLocation: nodeId  // the settlement they're based in
```

Guild type is determined by the settlement's dominant resource. **When multiple resources are equally dominant, use PRNG tiebreaker** (not arbitrary ordering):
- Ore/stone → miners' guild
- Timber/grain → artisans' guild
- Fish/water (coastal) → traders' guild
- Multiple resources (tied) → PRNG selects from eligible types → merchants' guild as final fallback
- High prosperity → bankers' guild

### Guild behaviors (emergent from existing systems)
Because guilds are factions with Gold-heavy reach preferences, the existing action selection pipeline naturally makes them:
- **Establish and expand trade routes** (high Gold capability + greed motivation)
- **Negotiate agreements** with other factions (cunning + ambition)
- **Survey resources** at new locations (ambition + cunning)
- **Tax trade routes** they control (greed + dominance)

Guilds also pursue **ambitions** — the existing ambition system gives them goals like "control 3 trade routes" or "accumulate wealth above threshold."

### Guild sublocations
When a guild is created, it spawns a `guild_hall` sublocation at its home settlement. As the guild grows (wealth threshold), it can spawn additional sublocations:

| Sublocation | Spawns when | Function |
|-------------|-------------|----------|
| Guild Hall | On creation | Base of operations. Encounter site for hiring, negotiating |
| Market Stall | Wealth ≥ `GUILD_MARKET_STALL_THRESHOLD` | Public-facing. Encounter site for buying/selling |
| Warehouse | Wealth ≥ `GUILD_WAREHOUSE_THRESHOLD` | Stores trade goods. Increases route capacity |
| Counting House | Wealth ≥ `GUILD_COUNTING_HOUSE_THRESHOLD` | Banking operations. Enables lending, debt agreements |

### Fail-soft

| Failure case | Fallback |
|-------------|----------|
| Guild's home settlement destroyed or demoted below hamlet | Guild enters `displaced` state: no passive home income, adds "seek new home" ambition. Does not crash — guild continues taking actions from wherever its actors are located |
| Settlement has no resources (can't determine guild type) | Default to `merchants` guild type, emit trace |
| Guild wealth property missing | Initialize to 0, emit warning trace |

### Player visibility
- **Location detail:** "The Ironmongers' Guild dominates the eastern quarter"
- **Agent behavior:** Guild masters appear as notable agents with Gold-heavy action patterns
- **Encounters:** Guild-specific encounters (apply for membership, negotiate bulk purchase, expose corruption, hire guild artisans)
- **Faction panel (existing):** Guilds appear in the faction list, showing wealth, controlled routes, member count

---

## System 4: Wealth & Economic Power

### What it is
A `wealth` property on every actor (individuals and factions), representing accumulated economic power. Not just gold coins — it's influence, assets, debts owed, trade position. Wealth is the Gold Reach's equivalent of what reputation is to the Heart Reach.

### Graph representation
```
actor.properties.wealth: number  // 0–100 scale, like other properties
```

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `WEALTH_TRADE_SUCCESS_MIN` / `_MAX` | 2 / 5 | Wealth gain on successful trade (scaled by route volume) |
| `WEALTH_ROUTE_CONTROL_INCOME` | 1 | Passive wealth per controlled route per tick |
| `WEALTH_SUBLOCATION_INCOME` | 1 | Passive wealth per productive sublocation per tick |
| `WEALTH_PROSPEROUS_HOME_INCOME` | 1 | Passive wealth when home settlement ≥ `PROSPERITY_TIER_PROSPEROUS` |
| `WEALTH_TRADE_FAILURE_MIN` / `_MAX` | 1 / 3 | Wealth loss on failed trade |
| `WEALTH_ROUTE_DISRUPTED_PENALTY` | 2 | Wealth loss per disrupted route |
| `WEALTH_AGREEMENT_BROKEN_MIN` / `_MAX` | 3 / 5 | Wealth loss when an agreement is broken against you |
| `WEALTH_MERCENARY_COST` | 10 | Cost to hire mercenaries |
| `WEALTH_ASSASSINATION_COST` | 15 | Cost to commission assassination |
| `WEALTH_INFLUENCE_COST` | 8 | Cost to buy influence |
| `WEALTH_CONSTRUCTION_COST` | 12 | Cost to fund construction |
| `WEALTH_MONOPOLY_COST` | 25 | Cost to establish monopoly |
| `WEALTH_TIER_MAGNATE` | 80 | Threshold for "Magnate" |
| `WEALTH_TIER_WEALTHY` | 60 | Threshold for "Wealthy" |
| `WEALTH_TIER_COMFORTABLE` | 40 | Threshold for "Comfortable" |
| `WEALTH_TIER_GETTING_BY` | 20 | Threshold for "Getting by" |

### How wealth changes

| Event | Wealth delta | Constant |
|-------|-------------|----------|
| Successful trade action | +`WEALTH_TRADE_SUCCESS_MIN`–`_MAX` (scaled by route volume) | `WEALTH_TRADE_SUCCESS_*` |
| Controlling a trade route (per tick) | +`WEALTH_ROUTE_CONTROL_INCOME` per route | `WEALTH_ROUTE_CONTROL_INCOME` |
| Owning a productive sublocation | +`WEALTH_SUBLOCATION_INCOME` per warehouse/counting house | `WEALTH_SUBLOCATION_INCOME` |
| Home settlement prosperity ≥ `PROSPERITY_TIER_PROSPEROUS` | +`WEALTH_PROSPEROUS_HOME_INCOME` per tick | `WEALTH_PROSPEROUS_HOME_INCOME` |
| Failed trade action | -`WEALTH_TRADE_FAILURE_MIN`–`_MAX` | `WEALTH_TRADE_FAILURE_*` |
| Trade route disrupted | -`WEALTH_ROUTE_DISRUPTED_PENALTY` per affected route | `WEALTH_ROUTE_DISRUPTED_PENALTY` |
| Agreement broken (by others) | -`WEALTH_AGREEMENT_BROKEN_MIN`–`_MAX` | `WEALTH_AGREEMENT_BROKEN_*` |
| Hiring mercenaries | -`WEALTH_MERCENARY_COST` | `WEALTH_MERCENARY_COST` |
| Lending (agreement attachment) | Deferred gain | N/A |

### Tracing

Every wealth change emits a `wealth_delta` trace with full provenance:

```typescript
interface WealthDeltaTrace {
  type: 'wealth_delta';
  actorId: string;
  previousWealth: number;
  delta: number;
  newWealth: number;
  reason: 'trade_success' | 'trade_failure' | 'route_control' | 'sublocation_income'
        | 'prosperous_home' | 'disruption' | 'agreement_broken'
        | 'mercenary_hire' | 'assassination_commission' | 'influence_purchase'
        | 'construction' | 'monopoly';
  sourceActionId?: string;  // the action that caused this change
  sourceActorId?: string;   // who initiated (for disruptions, broken agreements)
}
```

Crossover actions (hire-mercenaries, commission-assassination, etc.) emit a second trace linking the Gold spend to the spawned effect. When hire-mercenaries spawns a retainer, the retainer's `source` property references the Gold action's id. The causal chain must be traceable: Gold action → wealth spent → retainer spawned → Iron action enabled.

### Fail-soft

| Failure case | Fallback |
|-------------|----------|
| Wealth would go negative from spending | Clamp to 0, action still succeeds ("you spent your last coin") |
| Wealth property missing on actor | Initialize to 0, emit warning trace |
| Spending action targets actor who can't receive (deleted, missing) | Action fails gracefully, wealth not deducted, emit trace |

### Wealth tiers (prose hooks)

| Range | Label | What it enables |
|-------|-------|----------------|
| ≥ `WEALTH_TIER_MAGNATE` | Magnate | Can hire armies (future), buy loyalty, reshape settlements |
| ≥ `WEALTH_TIER_WEALTHY` | Wealthy | Can hire mercenaries, fund construction, bribe officials |
| ≥ `WEALTH_TIER_COMFORTABLE` | Comfortable | Can hire assassins, establish new routes, expand operations |
| ≥ `WEALTH_TIER_GETTING_BY` | Getting by | Basic trade actions only |
| < `WEALTH_TIER_GETTING_BY` | Destitute | Desperate actions — theft, begging, indentured service |

### What wealth is FOR

This is the critical part — wealth must be *spendable*, not just a score. Spending wealth is how Gold Reach agents exert power in other Reaches:

**1. Hire Mercenaries (Gold → Iron crossover)**
New action: `gold.hire-mercenaries`. Costs `WEALTH_MERCENARY_COST`, spawns a temporary retainer attachment (mercenary band) with Iron Reach capability. The retainer's `source` property references the funding action for traceability. The mercenary acts as a force multiplier for the next N ticks, then leaves. This is how a wealthy merchant "buys" Iron Reach power without having Iron capability themselves.

**2. Commission Assassination (Gold → Shadow crossover)**
New action: `gold.commission-assassination`. Costs `WEALTH_ASSASSINATION_COST`, targets an agent. Resolved as a Shadow Reach contest between the hired assassin's capability and the target's awareness. Success removes the target (or applies severe condition). Failure exposes the commissioner — massive reputation hit.

**3. Buy Influence (Gold → Heart crossover)**
New action: `gold.buy-influence`. Costs `WEALTH_INFLUENCE_COST`, improves relationship sentiment with a target faction or agent. Essentially bribery. Works best on agents with high greed; resisted by agents with high honesty.

**4. Fund Construction (Gold → Stone crossover)**
New action: `gold.fund-construction`. Costs `WEALTH_CONSTRUCTION_COST`, creates a new sublocation at a location. The merchant pays for a new market, warehouse, or guild hall to be built. Uses Stone Reach resolution but Gold Reach initiation.

**5. Establish Monopoly (Gold → Gold escalation)**
New action: `gold.establish-monopoly`. Costs `WEALTH_MONOPOLY_COST`, targets a resource type at a location. Success gives the actor exclusive control, dramatically increasing their wealth generation but decreasing settlement prosperity (extractive). Generates strong negative sentiment from other factions. **Narrative watch:** the monopoly must be experienced through prose ("The guild tightens its grip on the ore supply; miners speak in whispers"), not stat changes — if it ever feels "gamey," adjust the mechanic to serve the story.

### Player visibility
- **Agent detail cards:** Wealth tier shown as a descriptor ("Magnate," "Comfortable")
- **Prose:** Wealth influences how agents are described ("the silk-draped merchant lord" vs "the threadbare peddler")
- **Action narration:** When agents spend wealth, the narrative explains it ("The Gilded Pact hires a company of sellswords, paying handsomely for their silence")
- **Motivation visibility:** Player can see that agents with high greed + high wealth are choosing power-projection actions

---

## System 5: Gold Sublocations

### What it is
Economic points of interest within settlements. These are where Gold Reach activity *happens* — where encounters fire, where resources are produced or traded, where guilds operate.

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `SUBLOC_MARKET_SPAWN_PROSPERITY` | 40 (`PROSPERITY_TIER_MODEST`) | Prosperity needed to spawn Market District |
| `SUBLOC_MARKET_DISSOLVE_PROSPERITY` | 20 (`PROSPERITY_TIER_STRUGGLING`) | Prosperity below which Market District dissolves |
| `SUBLOC_SMUGGLER_SPAWN_PROSPERITY` | 30 | Prosperity below which Smuggler's Den can appear |
| `SUBLOC_MARKET_TRADE_BONUS` | 0.10 | Bonus to trade action resolution at Market Districts |
| `SUBLOC_MARKET_VOLUME_BONUS` | 0.10 | Trade volume multiplier boost at Market Districts |
| `MINE_PRODUCTION_PER_TICK` | 3 | Base resource units produced per mine per tick |

Note: Guild sublocation thresholds are defined in System 3 (`GUILD_WAREHOUSE_THRESHOLD`, etc.)

### New sublocation types

| Type | Generated by | Function | Encounter types hosted |
|------|-------------|----------|----------------------|
| **Market District** | Settlement prosperity ≥ `SUBLOC_MARKET_SPAWN_PROSPERITY` | Central trade hub. Boosts trade actions by `SUBLOC_MARKET_TRADE_BONUS` | trade, acquire, hire |
| **Mine** | Location has ore or stone resource | Produces `MINE_PRODUCTION_PER_TICK` raw materials. Can be controlled by a faction | acquire, build, lead |
| **Harbor** | Coastal location | Enables long-distance trade routes (non-adjacent) | trade, explore, hire |
| **Warehouse** | Guild wealth ≥ `GUILD_WAREHOUSE_THRESHOLD` | Storage. Increases trade route capacity from this location | acquire, trade |
| **Counting House** | Guild wealth ≥ `GUILD_COUNTING_HOUSE_THRESHOLD` | Banking. Enables loan/debt agreements | trade, assist |
| **Smuggler's Den** | Settlement prosperity < `SUBLOC_SMUGGLER_SPAWN_PROSPERITY` OR shadow reach activity | Black market. Cheaper goods, stolen wares, illicit contracts | steal, trade, hire |
| **Caravan Rest** | On trade route midpoint | Encounter site for traveling merchants, bandits, toll collectors | trade, explore, duel |

### Sublocation lifecycle
Gold sublocations are **conditional** — they appear and disappear based on economic conditions. This requires implementing the conditional sublocation predicate evaluator (currently stubbed in the type system as `persistence.type === 'conditional'` with a TODO):

- Market Districts appear when prosperity ≥ `SUBLOC_MARKET_SPAWN_PROSPERITY`, dissolve below `SUBLOC_MARKET_DISSOLVE_PROSPERITY`
- Mines are permanent (tied to terrain resources) but can be "exhausted" (resource quantity → 0)
- Smuggler's Dens appear in settlements below `SUBLOC_SMUGGLER_SPAWN_PROSPERITY` or where Shadow Reach agents are active
- Guild buildings track their parent guild's wealth against the guild threshold constants

This creates a living economic landscape — the player watches markets spring up in prosperous towns and black markets appear in struggling ones.

### Resource generation
Sublocations that produce resources add to their parent location's resource pool each tick:

```
Mine: +MINE_PRODUCTION_PER_TICK ore or stone per tick (modified by workforce = population fraction)
Harbor: no direct production, but enables trade routes to non-adjacent locations
Market District: no production, but +SUBLOC_MARKET_VOLUME_BONUS to all trade volume through this location
```

### Fail-soft

| Failure case | Fallback |
|-------------|----------|
| Conditional predicate references missing property (e.g. `prosperity` not set) | Predicate returns `false`, sublocation not spawned, no error, emit trace |
| Mine's parent location has no ore/stone resource | Mine produces nothing (0 output), does not crash |
| Guild sublocation's parent guild deleted | Sublocation dissolves gracefully on next tick, emit trace |
| Caravan Rest's trade route dissolved | Sublocation dissolves (no longer at a midpoint), emit trace |

### Player visibility
- **Location detail view:** Sublocations listed with economic flavor text
- **Encounter availability:** Gold sublocations host trade/acquire encounters that agents pursue
- **Prose:** "The market district buzzes with commerce" / "A smuggler's den operates in the shadow of the old wall"

---

## System 6: Economic Encounters

### What it is
New encounter templates that fire at Gold sublocations, giving agents concrete economic activities to engage in. These are the moment-to-moment beats the player reads in the narrative log.

### Constants

Encounter-specific outcome values (resource deltas, wealth gains/losses) are defined as constants within each encounter template, following the existing pattern in `encounter-content.ts`. The wealth deltas reference the System 4 wealth constants where applicable. New encounter-specific constants:

| Constant | Default | Purpose |
|----------|---------|---------|
| `MARKET_FESTIVAL_PROSPERITY_BOOST` | 5 | Prosperity gain from Market Day Festival |
| `MARKET_FESTIVAL_RELATIONSHIP_CHANCE` | 0.3 | PRNG probability of relationship formation per agent pair |
| `RICH_VEIN_RESOURCE_BONUS` | 20 | Resource quantity gain on successful Rich Vein encounter |
| `RICH_VEIN_COLLAPSE_PENALTY` | 10 | Resource quantity loss on Rich Vein failure |

### New encounter templates (12 total, 2 per Gold sublocation type)

**Market District:**
1. **The Haggle** — Two agents negotiate a price. Tests Gold + Heart. Winner gets +`WEALTH_TRADE_SUCCESS_MIN` wealth; loser gets less but still positive (both benefit from trade, but unequally). 2 steps.
2. **Market Day Festival** — Settlement-wide event. All agents present get small wealth boost (+`WEALTH_TRADE_SUCCESS_MIN`). Prosperity +`MARKET_FESTIVAL_PROSPERITY_BOOST` (new constant). Relationship formation: each pair of present agents has `MARKET_FESTIVAL_RELATIONSHIP_CHANCE` probability (PRNG roll) of forming a new `relates_to` edge with positive sentiment. 1 step.

**Mine:**
3. **The Rich Vein** — Agent discovers an unusually productive seam. Tests Gold + Stone. Success: resource quantity +`RICH_VEIN_RESOURCE_BONUS` at this location. Failure: mine collapse, -`RICH_VEIN_COLLAPSE_PENALTY` resource, condition "injured." 3 steps.
4. **Labor Dispute** — Workers demand better conditions. Tests Gold + Heart. Resolve fairly: -wealth but +reputation. Exploit: +wealth but spawn negative trait "cruel taskmaster." 2 steps.

**Harbor:**
5. **Foreign Trader** — A ship arrives with exotic goods. Tests Gold + Eye (appraisal). Success: acquire rare possession. Failure: swindled, -wealth. 2 steps.
6. **Pirate Raid** — Raiders hit the harbor. Tests Iron + Gold (defend cargo). Success: repel, +reputation. Failure: -trade route volume, -wealth. 3 steps.

**Counting House:**
7. **The Loan** — Agent offers/receives a loan. Creates debt agreement attachment. No test — pure axiological choice (greed vs prudence). 1 step.
8. **Debt Collection** — An agreement comes due. Tests Gold + Iron (for forceful collection) or Gold + Heart (for negotiated settlement). Failure: agreement broken, -reputation. 2 steps.

**Smuggler's Den:**
9. **Black Market Deal** — Acquire goods at steep discount, but risk exposure. Tests Gold + Shadow. Success: +possession, -small wealth. Failure: caught, -reputation, possible condition "wanted." 2 steps.
10. **The Fence** — Sell stolen goods. Tests Shadow + Gold. Success: +wealth. Failure: -reputation, aggro from original owner. 1 step.

**Caravan Rest:**
11. **Toll Bridge** — Control a chokepoint on a trade route. Tests Gold + Dominance value. Collect toll: +wealth but creates enemies. Let pass: +reputation. 1 step.
12. **Caravan Guard** — Hired to protect a merchant caravan. Tests Iron + Gold. Success: +wealth, +relationship with merchant. Failure: goods lost, -reputation. 3 steps.

### Player visibility
These encounters ARE the player-facing economic system. The player sees:
- Agents choosing economic encounters over combat or exploration
- Outcomes changing settlement prosperity, agent wealth, trade route health
- Narrative log entries with economic flavor: "Aldric the Sharp-Tongued haggles fiercely in the Ironhaven market, walking away with a bolt of spider-silk and a grudging respect"

---

## Implementation Order

These systems have dependencies. Here's the recommended build sequence:

### Phase 1: Foundation (can be done in one sprint)
1. **Settlement prosperity** — Add property + tick calculation + prosperity resolver for prose
2. **Wealth on actors** — Add property + delta tracking from existing Gold actions
3. **Enriched `trades_with` edges** — Add volume, goodsType, decay

This gives the simulation an economic pulse immediately. Existing Gold actions now produce visible effects.

### Phase 2: Locations & Encounters (next sprint)
4. **Gold sublocations** — Conditional spawn/dissolve based on prosperity thresholds
5. **Economic encounters** — 12 templates across the new sublocation types
6. **Trade route decay** — Routes need maintenance or they wither

Now the world has economic geography that changes over time.

### Phase 3: Guilds & Power (following sprint)
7. **Guild generation** — Spawn guild factions at towns/cities during world seed
8. **New Gold actions** — Negotiate Agreement, Tax Trade Route, Break Agreement
9. **Wealth spending actions** — Hire mercenaries, commission assassination, buy influence, fund construction

Now wealth is meaningful — it can be spent to cross into other Reaches.

### Phase 4: Dynamics (stretch)
10. **Settlement promotion/demotion** — Hamlet ↔ town ↔ city based on sustained prosperity
11. **Monopoly action** — High-wealth economic domination play
12. **Economic AI tuning** — Adjust axiological weights so guilds and merchants create interesting emergent trade patterns

---

## What This Looks Like to the Player

**Early cycle:** The world has settlements with resources, a couple of trade routes, and fledgling guilds. The narrative mentions "a modest market" and "miners working the eastern slopes."

**Mid cycle:** Trade routes multiply. Prosperous towns spawn market districts and guild halls. The Merchants' Guild of Ironhaven controls two routes and is getting wealthy. The narrative mentions "caravans streaming between Ironhaven and Millford" and "the guild master eyeing the harbor with undisguised ambition."

**Late cycle:** Economic power consolidates. A magnate faction attempts a monopoly. Struggling settlements spawn smuggler's dens. Wealthy actors hire mercenaries for protection or assassination. The narrative log is full of economic drama: "The Gilded Pact breaks its agreement with the Iron Covenant. The roads grow dangerous."

**The player's lever:** Divine interventions. Dream a merchant into generosity (break a monopoly). Curse a trade route (crash a faction's wealth). Bless a mine (save a struggling hamlet). The economy is another canvas for divine meddling.

---

## NFP Compliance Summary

Assessment against all 7 non-functional priorities. Remediations from this audit have been integrated into the system descriptions above — this section records the verdicts and any remaining watch items.

| NFP | Verdict | Notes |
|-----|---------|-------|
| **#1 Tunability** | PASS | All numeric values now reference named constants in per-system Constants tables. ~40 constants total. |
| **#2 Inspectability** | PASS | Trace interfaces defined inline: `ProsperityTickTrace` (System 1), `TradeRouteVolumeChangeTrace` + `trade_route_dissolved` (System 2), `WealthDeltaTrace` + crossover provenance (System 4). |
| **#3 Determinism** | PASS | PRNG callouts integrated: guild count (System 3), guild type tiebreaker (System 3), Market Day relationship formation (System 6), population lag seeded at creation (System 1). |
| **#4 Fail-soft** | PASS | Per-system failure mode tables added to Systems 1–5. Pattern: missing data → default/skip + emit trace, never throw. |
| **#5 Narrative > mechanical** | PASS | Design is narrative-first. Monopoly mechanic flagged with narrative watch item (System 4). |
| **#6 Additive** | PASS | Fixed: Expand Trade now *evolves* `gold.trade` (same id, backward-compatible) instead of replacing it (System 2). All other changes are strictly additive. |
| **#7 Performance** | PASS with note | `phaseProsperity` and trade route decay are global-tick (new pattern). Fine at current scale; flag for profiling at scale. |

### Load-bearing decision: Everything is a graph node/edge — PASS

All new state lives on nodes (properties) or edges (properties). No separate tables, no parallel data structures.

### Rejected approaches — CLEAN

No classical stats, no fixed pantheon, no pure template prose, no pure LLM content. Wealth is a domain-specific economic property, not a generic stat.

---

## Architectural Notes

### Fits existing primitives
- **Prosperity, population, wealth** — location/actor node properties (like reputation)
- **Trade routes** — enriched `trades_with` edges (existing edge type)
- **Guilds** — faction actor nodes with Gold-heavy reach preferences (existing actor type)
- **Agreements** — agreement attachments (existing attachment category)
- **Sublocations** — conditional sublocation system (existing)
- **Encounters** — encounter templates (existing framework, 12 new templates)
- **Wealth spending** — new action templates using existing CRUD + GraphOp patterns
- **Prose** — new resolvers plugged into existing prose composer

### No new engine subsystems
Everything here is a content layer on existing mechanics. The most "structural" addition is `phaseProsperity` in the orchestrator — and that's just a new phase function following the established pattern.

### Global-tick systems (new pattern)
Both `phaseProsperity` and trade route decay tick globally — they process all settlements/routes every tick regardless of spotlight tier. This is a new pattern (existing systems only tick spotlighted entities). At current scale this is fine; flag for profiling if the world grows.

---

## Open Questions

1. **Should trade routes be visible on the hex map as lines?** The design says "prose first," but a visual indicator of economic connectivity would be powerful. Could be a Phase 4 polish item.
2. **How many guilds per settlement?** Proposed 1–2, but more guilds = more faction drama. Tuning constant.
3. **Should prosperity affect terrain visually?** A flourishing city could have a different hex tile than a destitute one. Ties into the art pipeline.
4. **Debt as a weapon:** The agreement/debt system could get very interesting — factions buying each other's debts, debt traps, etc. Worth exploring in a later iteration.
5. **Divine economic interventions:** Should there be Gold-specific divine interventions beyond the existing 8? E.g., "Bless Harvest" (boost all food resources in a region), "Curse of Greed" (make an agent's wealth decay rapidly).
