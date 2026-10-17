> **title:** Undertakings in the economy — what mortals found, build and open stays built and pays, and wealth ambitions can be met — THR-1937
> **linear_issue:** THR-1937
> **author:** Claude Code (design lane, unattended, run 2026-10-17a)
> **created:** 2026-10-17
> **three_pillars:** Engine done · Content done · UI done

# Undertakings in the economy — THR-1937

*A town a mortal founds has a ruler who taxes it and a founder who keeps a freehold in it; a building a mortal raises is the town's own next building; whoever opens a lane tolls it; a trade run pays the trader; and the ambitions that send mortals to do these things can finally be met by doing them.*

## Why this is load-bearing

The [Mortal economy map](https://linear.app/threadbare/issue/THR-1863) wants the economy to *"drive a lot of the fundamental interaction and behavior of the in game living agents (factions, cities, agents)"* (Christian, 2026-10-14). Undertakings are how a mortal changes the world on purpose, and today the economic ones leave nothing behind. Measured on this worktree at `origin/main` (§ Substrate inventory has the citations):

- **A founded town belongs to nobody.** Founding writes the place and a `constructed_by` edge and nothing else: no `controls`, no `owns`. The [faction purse](https://linear.app/threadbare/issue/THR-1931) (shipped) taxes towns through `controls`, so a founded town is a town no faction can tax or fight over.
- **Every mortal builds the same workshop.** The cells model raises `sublocation-type.workshop` in every town, whatever the land, against the map's ruling that *"all settlements shouldn't end up looking the same"*.
- **A lane's founder gets nothing,** and a trade run writes volume and a timestamp but no money.
- **The ambitions that drive this work cannot be met by it.** Found Something New asks for an `estate`, Rebuild from Ashes a `camp`, Dominate Regional Trade a `market`, Protect the Home a `castle`. No undertaking makes any of them.

**Settled input** (cited inline where used; not re-opened):

- **[Undertakings in the economy](https://linear.app/threadbare/issue/THR-1873)** — the whole cell table and the ambition rewrite. Decided by the design lane under delegation, 2026-10-14T17:32Z (code census at `ffdd9cfa` in its comment). Its veto day closed 2026-10-15T17:33Z with no veto.
- **Christian on the map, 2026-10-15:** *"Keep all three calls as decided. The plan docs can go ahead."* The carve-up's order at execution: *"mortal wealth, then undertakings, last (Christian's ruling: kingdom before individual richness)."*
- **Upstream plans this reads:** [the settlement economy](2026-10-14-thr-1923-settlement-economy.md) (building table, chooser, slots, surplus routes — not built yet), [the faction purse](2026-10-15-thr-1931-faction-purse.md) (built: `applyTreasuryDelta`, tax holder, guild work), [mortal wealth](2026-10-15-thr-1936-mortal-wealth.md) (birth Means, `economy_shift`, the want, the founding-cost switch — not built yet), [economic war aims](2026-10-15-thr-1933-war-aims.md) S2 (regional monopolies — not built yet).

**How-level choices this plan made** (the decision left them open; reasons and alternatives in the [brainstorm companion](2026-10-17-thr-1937-undertakings-in-the-economy-brainstorm.md); each is invited for veto): three build slices in the map's order; the ruler is read through the derived rank, ties to a realm; the building is picked when the work starts and re-checked when it ends; a trade run pays a trader at most once a day; the lane's founder is a `constructed_by` edge on the lane's identity node; a founded guild takes a guild type from its founder's leading Reach so the purse's guild work pays it; the guild founding cost gets its missing row in the cost table (S3); a **claimed** lane (claim × route's `owns` on the lane's identity node) counts as held for `agent_holds_lanes`, beside the decision's "tolls or founded", because claiming is how a mortal comes to hold a lane they did not open.

## Substrate inventory

Measured on this worktree at `origin/main`. Citations are `path:line`.

Measured at `dcaadbe9` (2026-10-17). The decision's census was at `ffdd9cfa`; lines below are re-measured, and the two changes since are marked.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Found a town — `create × location` (`src/data/undertaking-objects.ts:1235-1248`; `createLocation` `strategicGraphOps.ts:1093-1150`, node `:1115-1129`, `constructed_by` `:1136-1144`; subtype `UNDERTAKING_DEFAULT_LOCATION_SUBTYPE = 'hamlet'` `strategic-action-constants.ts:1281`; the lifecycle passes no `params`, `strategicActionLifecycle.ts:1795-1810`) | 🟢 ACTIVE | **extends**: ruler `controls`, founder freehold. No `controls`/`owns` today. |
| Founding site (`createSite` `undertaking-objects.ts:600-616` returns an existing location; the legacy hint path uses `findUnclaimedSite`, `strategicActionLifecycle.ts:192, 1896`) | ⚠️ HAZARD (new finding) | **fixes in S1**: the cell founds the town on the **same hex** as an existing settlement today. S1 uses `findUnclaimedSite` from the cell too. |
| Founded prosperity (`FOUNDED_SETTLEMENT_INITIAL_PROSPERITY = 8`, `strategic-action-constants.ts:1076`; change deltas now on 0–100, `:1284-1290`) | 🟢 ACTIVE (THR-1862's scale bug fixed since the census) | **reads only.** At 8 the town tithes nothing (`HOLDING_TITHE_PROSPERITY_THRESHOLDS` start at 25, `:1493`; `titheMultiplier` `holdingIncome.ts:95-100`), so a founder earns from the freehold, not a tithe, until it grows. |
| Raise a building — `create × place` (`createSublocation` `strategicGraphOps.ts:170-233`: place `:192-209`, `contains` `:212-218`, `constructed_by` `:221-227`; default `UNDERTAKING_DEFAULT_PLACE_TYPE_ID = 'sublocation-type.workshop'` `strategic-action-constants.ts:1279`; override `ctx.params.sublocationTypeId` `undertaking-objects.ts:1336-1337`, never supplied) | 🟢 ACTIVE | **extends in S2**: the type comes from the town's chooser through `params`. |
| Legacy pack place types (`research_circle` `scholarStrategicPack.ts:108`; `warehouse` `merchantStrategicPack.ts:136`; `guild_chapter` `:160`; `shrine` `zealotStrategicPack.ts:78, 153`; `garrison` `warlordStrategicPack.ts:151`; `workshop` `builderStrategicPack.ts:78`; `granary` `:125`; `court` `courtStrategicPack.ts:106`; `estate` `:130`; hard-coded arms `strategicActionLifecycle.ts:2138-2156`) | 🟠 DORMANT (template model, review levers only) | **maps** onto the building table in S2. |
| Freeholds (`grantHolding` `src/engine/holdings.ts:229`, `owns` at `:262-268`; claim × place `undertaking-objects.ts:1342-1345`) | 🟢 ACTIVE | **reads**: founder and builder freeholds go through it. |
| Holding income (`collectHoldingPayments` `holdingIncome.ts:104`: toll `:108-121` reads `controlledBy` on the `trades_with` edge, mortals only `:87-89`; freehold `:123-137`; tithe `:139-160`) | 🟢 ACTIVE | **untouched**; pays the founder's freehold and toll. |
| Open a lane — `create × route` (`createTradeRoute` edge `strategicGraphOps.ts:124-140`: `volume: 1`, `lastTraded`, `establishedBy`, no owner; identity node `mintRouteIdentity` `tradeRouteOps.ts:297`; cell `undertaking-objects.ts:1387-1404`; `TRADE_ROUTE_DEFAULT_TAX_RATE = 0.1` `tradeRoute.ts:138`) | 🟢 ACTIVE | **extends**: `controlledBy`, `taxRate` on the edge; `constructed_by` from the identity node to the founder. |
| Claimed lanes (claim × route writes `owns` on the route identity node, `undertaking-objects.ts:1421-1424`; only seize sets `controlledBy` via `executeTaxTradeRoute` `:1431-1435`) | 🟢 ACTIVE | **reads** for `agent_holds_lanes` (a claimed lane counts as held). |
| Lane chronicle (`ACTION_TRIGGER_MAP` `phaseEconomicChronicle.ts:38-44`, consumed `:78`; enrichment `:245-261` reads the actor's `trades_with`; lines `economic-chronicle-content.ts:102-108`) | 🟠 DORMANT for cells (no undertaking emits it) | **activates** for `create × route`. |
| Conduct trade — `use × route` (`executeConductTrade` `tradeRouteOps.ts:198-228`; picks the **stalest** lane at the anchor `:209-217`; writes `volume + 1`, `lastTraded` `:220-226`; no wealth; call `undertaking-objects.ts:1418`) | 🟢 ACTIVE | **extends in S3**: pays the trader on the lane it actually traded. |
| Found a guild — `create × faction` (cell `undertaking-objects.ts:1708-1719`; `reachProfile = ctx.params?.reachProfile ?? {}` `:1717`; seed `UNDERTAKING_DEFAULT_FACTION_SEED` `strategic-action-constants.ts:1318`; `seedFactionFromDefinition` via `foundFaction` `strategicGraphOps.ts:1856`; `wealth: 0` `factionSeeding.ts:267-268`; fallback 0.1 `:52`) | 🟢 ACTIVE | **extends in S1**: reach profile, guild type, opening purse. |
| Faction purse (`factionPurse.ts`, daily; income `factionPurse/income.ts` incl. tolls on faction `controlledBy` `:353-354`; `applyTreasuryDelta` `wealth.ts:112`; `GUILD_PLACE_AFFINITY` `faction-purse-constants.ts:110`) | 🟢 ACTIVE (shipped, THR-1931) | **reads**: taxes founded towns, pays founded guilds' guild work. No change. |
| Mortal Means (`bankWealth` `wealth.ts:139`; tiers `:60-88`) | 🟢 ACTIVE | **reads/writes** through the funnel (S3 trade pay). |
| Mortal wealth plan pieces (`mortalMeans.ts`, `economy_shift`, `MEANS_CELL_COST`) | 🔴 not on main | S1 is blocked by mortal wealth S1; the guild cost row lands in its table. |
| Settlement economy (`settlementEconomy/`, building table, chooser) | 🔴 not on main | S2 is blocked by it. |
| Monopolies (`phases/economicPower.ts`, world-wide rule; `faction.properties.monopolies`) | 🟢 ACTIVE (never fires) | S3 reads war aims S2's `regionalMonopolies`; blocked by it. |
| Ambitions (`ambition-templates.ts`: Dominate Regional Trade `:108-173`, Protect the Home `:1604-1637`, Rebuild from Ashes `:1728-1761`, Found Something New `:1786-1815`; `CompletionRule` `types/ambition.ts:146-149`; union `:18-136`; evaluator `graphConditions.ts:215`, `agent_controls_location` `:306-327`) | 🟢 ACTIVE | **extends in S3**: two new kinds, one widened, one home-place kind, four milestone rows. No predicate reads Means, lanes or monopoly today. |
| Faction ambitions (kinds `types/faction.ts:162-168`; `phaseFactionAmbitions` `factionAmbitions.ts:179` picks only when none is active; `selectAmbitionType` `:125`; abandon paths `:202-235`; `pursues` edge `milestones: []` `:279`, never read) | 🟢 ACTIVE, no completion | **extends in S3**: one met check and a forced switch. |
| Home settlement (`fighterHomeSettlement` `fights/fightEnding.ts:172`, residence origin then position) | 🟢 ACTIVE | **reads** for `agent_home_has_place`. |
| Membership rank (`getDerivedMembershipRank` `factionReputation.ts:241`) | 🟢 ACTIVE | **reads** for the ruler. |

## Engine pillar

### Systems design

Three slices, one plan. **This ticket builds S1.** S2 and S3 are filed as their own tickets at handoff (§ Slices).

**1. Found a town — a ruler and a founder (S1).** In the `create × location` executor (`src/data/undertaking-objects.ts:1235-1248`):

- **On free ground.** The cell takes the hex of `createSite`, which is an existing location, so today the new hamlet lands on the same hex as a town that already stands. S1 picks the hex with `findUnclaimedSite` (the legacy path's helper, `strategicActionLifecycle.ts:192`), searching out from the site. No free hex within `FOUNDED_SETTLEMENT_SITE_SEARCH_RADIUS` → the work completes with nothing founded (§ Fail-soft, § Player-facing text). This is a fix the decision's census missed; the settlement economy's hex ownership needs one town per hex.
- **Ruler.** Among the factions the founder is a member of (`member_of`), keep those that `controls` at least one settlement (`locationSubtype` in the settlement tiers, place tier only, via `getLocationNodes`). Take the one where the founder's rank is highest, read with `getDerivedMembershipRank` (`factionReputation.ts:241`; never the raw `rank`, which has disagreeing writers). Ties: a realm first, then the lower faction id. No such faction → the founder is the ruler.
- **Writes.** The ruler gets a `controls` edge to the town with `role: 'strategic'`, `establishedTick`, and `influence` `FOUNDED_TOWN_RULER_INFLUENCE` (the purse's tax-holder rule reads influence; a realm whose border holds the hex still wins tax by the purse's own rule). The founder gets the town as a **freehold** through `grantHolding` (the `owns` edge plus its face; UL *Freehold*: the edge is the authority). When the founder is the ruler, they get both edges.
- **No resource bag.** Food and land come from the settlement economy's daily phase, which starts a mid-run town at the hamlet start population the first time it sees it (posted on [THR-1923](https://linear.app/threadbare/issue/THR-1923) as an input; S1 does not depend on it).
- The decision's prosperity-scale note is resolved on main since its census (change deltas are on 0–100 now, `strategic-action-constants.ts:1284-1290`). A founded hamlet starts at prosperity 8, below the first tithe band (25), so the founder's income is the freehold's flat rate until the town grows; that is intended (a new town is poor).

**2. Open a lane — the founder tolls it (S1).** In the `create × route` executor, the new `trades_with` edge gets `controlledBy: <founder>`, `taxRate: TRADE_ROUTE_DEFAULT_TAX_RATE` (`tradeRoute.ts:138`, 0.1) and the lane's identity node (minted by the cell through `mintRouteIdentity`, `tradeRouteOps.ts:297`) gets a `constructed_by` edge to the founder, the same edge a founded town and a raised Place carry (`strategicGraphOps.ts:1136-1144`, `:221-227`). Who founded a lane is a relationship, so it is an edge on the lane's node, never an id on the `trades_with` edge (Vision non-negotiable #4). Holding income already pays a mortal toll holder through `controlledBy` (`holdingIncome.ts:108-121`), and the purse pays a faction one (`factionPurse/income.ts:353-354`), so the founder earns from the first day the lane carries. The lane fires the existing `trade_route_established` chronicle trigger: `ACTION_TRIGGER_MAP` (`phaseEconomicChronicle.ts:38-44`) gains the cell's id, and the trigger's enrichment (`:245-261`) reads the lane's two ends from the event's object for a cell event instead of the actor's own `trades_with` edges (a mortal has none). A lane with no `goodsType` renders "goods".

**3. Found a guild — a purse and a calling (S1).** In the `create × faction` executor (`undertaking-objects.ts:1708-1719`, which passes `reachProfile` and the seed into `foundFaction`):

- `reachProfile` = the founder's two leading Reaches, each `domainCapabilities[reach] / 100` (the raw 0–100 scale, canon § dormant kinds), instead of `{}` and the flat 0.1 fallback.
- `guildType` = `FOUNDED_GUILD_TYPE_BY_REACH[leading Reach]`, falling back to the second Reach, else none (gold → merchants · stone → builders · shadow → thieves · star → temples · veil → temples · eye → bankers · heart → artisans · iron → none). A guild with a type earns guild work in the purse's daily phase like any town guild (`GUILD_PLACE_AFFINITY`, `faction-purse-constants.ts:110`). How-level choice: without a type, the purse pays a founded guild nothing, ever.
- **Its purse starts with what the founder paid** for the founding, moved with `applyTreasuryDelta` (`wealth.ts:112`), nothing minted. S1 reads what the founding cost from mortal wealth's cost table if it exists and has a `faction` row, else 0. There is no cost table before mortal wealth S2, and that table has no `create × faction` row, so in S1 the purse starts at 0 by construction and fills from guild work. **S3** adds the missing row `faction: MEANS_CELL_COST_GUILD` (30) to the table (S3 is blocked by mortal wealth S2, which creates it); with founding costs switched off it still charges nothing.

**4. Raise a building — the town's next building (S2).** In the `create × place` cell:

- **Target rule.** A town is a target only when the settlement economy's chooser (`settlementEconomy/building.ts`, pure, per the note on THR-1923) returns a candidate and a slot is free (`BUILDING_SLOTS`). A town with full slots is not a target.
- **At start**, the chooser's top candidate is stored on the action as `plannedBuildingId`, so the activity line can name it.
- **At completion**, the candidate is re-checked. If it still qualifies and a slot is free, it is raised **at once** (no build meter). The lifecycle passes the building's Place type as `params.sublocationTypeId`, the override the cell already honours (`undertaking-objects.ts:1336-1337`) and the resolver already threads (`undertakingResolver.ts:199`) but no caller sets today (`strategicActionLifecycle.ts:1795-1810`). `createSublocation` writes the Place, `contains` and `constructed_by` as now; the settlement economy's building helper then stamps it as a building (`isBuilding`, `buildingId`, `builtTick`), and the cell gives the builder a **freehold** through `grantHolding`. If it no longer qualifies, the chooser runs again; if it returns nothing, the work completes with nothing raised (§ Fail-soft, § Player-facing text).
- **Legacy pack types** map onto the table through `LEGACY_PLACE_TYPE_TO_BUILDING`: granary and warehouse → storehouse, workshop → workshop, shrine → shrine, guild_chapter → counting house, garrison → walls. Court, estate and research circle are non-economic: they are raised as today, take no slot and are not buildings.

**5. A trade run pays (S3).** In `executeConductTrade` (`tradeRouteOps.ts:198-228`, `use × route`), after the existing volume and `lastTraded` writes, the trader is paid on **the lane the run actually traded** (the function picks the stalest lane at the anchor, `:209-217`, which may not be the one the cell named; pay follows the trade, not the label). They are paid `min(TRADE_RUN_PAY_MAX, TRADE_RUN_PAY_BASE + TRADE_RUN_PAY_PER_UNIT × carriedPerDay)` Means through `bankWealth` with reason `trade_success`. `carriedPerDay` is the settlement economy's per-lane figure (0 when absent, so a dead lane pays the base). **Once per trader per game day:** the trader keeps one number, `lastTradeRunPaidTick`, and a second run inside `TRADE_RUN_PAY_COOLDOWN_TICKS` pays nothing, on any lane. Canon records why: an instant cell cannot fail, so a cell that pays every time becomes a farm (THR-1440). The want from mortal wealth S2 already counts conduct trade as paying work (`MEANS_EARNING_CELLS`); nothing new is added to the board.

**6. Ambitions measure what undertakings make (S3).** Two new predicate kinds and one widened kind in `src/types/ambition.ts` and the evaluator (`graphConditions.ts`):

- `agent_means_at_least { tier: WealthTier }` — `getWealthTier(readWealth(agent)) ≥ tier`.
- `agent_holds_lanes { minCount }` — standing `trades_with` lanes the agent tolls (`controlledBy`), founded (a `constructed_by` edge from the lane's identity node to the agent) or claimed (an `owns` edge to the lane's identity node, which is what claim × route writes, `undertaking-objects.ts:1421-1424`), counted once each.
- `agent_controls_location` (`types/ambition.ts:22`, evaluator `graphConditions.ts:306-326`) widens additively: `locationType` accepts a string **or** a list, and an optional `foundedBySelf: true` requires a `constructed_by` edge from the location to the agent. Old conditions read exactly as before.
- `agent_home_has_place { placeType }` — the agent's home settlement (`fighterHomeSettlement`, `fights/fightEnding.ts:172`: residence origin, else last position, climbed to a settlement) contains a Place of that type.

The milestone rewrite, as the decision set it:

| Ambition | Milestones after this plan | Completes on |
|---|---|---|
| Dominate Regional Trade | 3 trade bonds · holds a market (`market` or `market-district`) · gold Reach 0.875 · **holds ≥ 2 lanes** · **Means Wealthy** | **3 of 5** (today 2 of 3) |
| Found Something New (the decision's "Found Anew") | 3 alliance bonds · **holds a town they founded** (replaces `estate`) | 2 of 2 |
| Rebuild from Ashes | 3 labour bonds · **holds a town of any size** (replaces `camp`) · stone Reach | 2 of 3 |
| Protect the Home | 3 loyalty bonds · **walls stand in their home town** (`city-walls`, replaces `castle`) · iron Reach | 2 of 3 |

**7. A faction's `resource_acquisition` is met by a regional monopoly (S3).** Faction ambitions have no completion today: `phaseFactionAmbitions` (`factionAmbitions.ts:179`) picks only when none is active, and the two exits are abandonments (`:202-235`). A new pure check, `isFactionAmbitionMet`, runs in the same phase before the abandon checks: while a faction whose active ambition is `resource_acquisition` holds any entry in `regionalMonopolies` (war aims S2's record), the ambition is met. The phase then closes it the way an abandonment does (ambition node `status: 'achieved'`, `pursues` edge removed) and makes the faction's next pick `defensive_consolidation` directly, skipping the weighted draw (`selectAmbitionType`, `:125`) for that one pick, so a monopoly holder guards it. War aims S2 owns the record and the ambition's target; this plan owns only the met check and the switch.

**Rollback.** `UNDERTAKING_ECONOMY_ENABLED = false` skips every write in §§ 1–7: founding writes only the town, lanes have no toll holder, guilds seed as today, buildings are workshops, trade runs pay nothing, and the old milestones are used. The milestone tables keep both shapes behind the flag until S3's Done-when is met, then the old shape is deleted in S3's PR.

### Graph nodes / edges

**No new node or edge types.** Checked against `src/types/graph.ts`: `controls`, `owns`, `constructed_by`, `trades_with`, `member_of` all exist.

| Where | Property | Type | Writer |
|---|---|---|---|
| `controls` (ruler → founded town) | `role: 'strategic'`, `influence`, `establishedTick`, `via: 'founded'` | existing shape + `via` | `create × location` |
| `owns` (founder → town, builder → building) | existing shape, via `grantHolding` | — | `create × location`, `create × place` |
| `trades_with` | `controlledBy`, `taxRate` (existing fields, newly written) | actor id (existing pattern the toll readers need) | `create × route` |
| `constructed_by` (lane identity node → founder) | existing edge type | — | `create × route` |
| trader (actor node) | **`lastTradeRunPaidTick`** (new) | number | `use × route` |
| faction (founded guild) | `reachProfile`, **`guildType`**, `wealth` | existing fields | `create × faction` |
| `StrategicAction` | **`plannedBuildingId`** | string | `create × place` start |

### Tick phases

| Phase | Slot | Cadence | Reads | Writes |
|---|---|---|---|---|
| undertaking completion (`strategicActionLifecycle.ts`) | unchanged | per completed undertaking | founder's memberships, `controls`, Reaches, the chooser | §§ 1–4 writes |
| undertaking instant (`use × route`) | unchanged | per run | `carriedPerDay`, `lastTradeRunPaidTick` | trader Means, `lastTradeRunPaidTick` |
| `faction_purse` (shipped) | unchanged | daily | `controls`, `guildType` | unchanged writer; now sees founded towns and guilds |
| `holding_income` (shipped) | unchanged | daily | `owns`, `controlledBy` | unchanged writer; now pays founders |
| economic chronicle | unchanged | per event | the cell event | `trade_route_established` for a founded lane |
| ambition evaluation | unchanged | unchanged | the new predicates | unchanged |
| faction ambition review | unchanged | unchanged | `regionalMonopolies` | ambition switch (S3) |

### Resolution logic

1. **The ruler's tax and the realm's rent are different things.** The ruler taxes the town through `controls` (the purse's town tax, decided in [the faction purse](https://linear.app/threadbare/issue/THR-1867)); a realm whose border holds the hex already earns land rent through the border. When both hold, the purse's tax-holder rule decides who taxes, unchanged.
2. **A founder outside any town-holding faction rules alone.** They get `controls` and `owns`. The crown's oaths ([THR-1932](https://linear.app/threadbare/issue/THR-1932), shipped) read faction `controls`, so a mortal ruler is outside them, as the decision intended (*"rejected: mortal lords outside the realm-and-crown structure"* is about the founder always ruling, not this fallback).
3. **Lanes held.** A lane the agent both founded and tolls counts once. A lane that has decayed away (edge removed by `trade_route_decay`) no longer counts.
4. **Means tiers.** `agent_means_at_least` reads the same five words as the sheet (Magnate 80 · Wealthy 60 · Comfortable 40 · Getting by 20, `wealth.ts:60-88`).

### PRNG callouts

None new. The building chooser's jitter is the settlement economy's own seeded draw; every rule here is deterministic, and ties break by id.

## Content pillar

### Encounter templates

N/A — no encounter changes. The undertakings are cells; their prose is below.

### Prose tables

**Undertaking prose** (cells' `activityProse` / `completionProse`, four slots `{object}` `{owner}` `{actor}` `{place}`, game register, present tense, no numerals; checked by `npm run check:undertaking`):

| Cell | Line | Text |
|---|---|---|
| `create × location`, completion, ruler is a faction | new variant | "{actor} founds {object}, and raises the banner of {owner} over it." |
| `create × location`, completion, founder rules | existing line kept | (the cell's current completion line) |
| `create × location`, completion, no free ground | new variant | "{actor} finds no open ground near {place} to found a town." |
| `create × place`, activity | rewritten | "{actor} sets about raising {object} in {place}." — `{object}` is the planned building's name ("a storehouse", "walls") |
| `create × place`, completion | rewritten | "{actor} raises {object} in {place}, and it is theirs." |
| `create × place`, completion, nothing to raise | new variant | "{actor} finds no room left in {place} for what they meant to build." |
| `create × route`, completion | existing line kept; the chronicle carries the lane | — |

`{owner}` is the ruler's display name. A cell line with an empty slot drops to the existing line (Law 14).

**Ambition milestone prose** (each milestone's `prose` line, matching the existing register):

| Ambition · milestone | Prose |
|---|---|
| Dominate Regional Trade · lanes held | "Two roads answer to one name now." |
| Dominate Regional Trade · Means Wealthy | "The strongbox no longer closes." |
| Found Something New · holds a town they founded | "There is a place on the map that was not there before." |
| Rebuild from Ashes · holds a town | "A roof again, and a door that is {their} own." |
| Protect the Home · walls | "Stone stands between home and the world." |

**Means source phrase:** `trade_success` already reads "trade that paid" (`describeWealthSource`, `agentDetail.ts`); a trade run gives it a writer. No new phrase.

### Attachment content

The founder's and builder's freeholds are ordinary freehold faces minted by `grantHolding`. No new attachment content.

### Data tables

`src/data/undertaking-economy-constants.ts` (§ Constants table) holds `FOUNDED_GUILD_TYPE_BY_REACH` and `LEGACY_PLACE_TYPE_TO_BUILDING` as one entry per kind (Law 58). Completeness tests: every Reach has a row in `FOUNDED_GUILD_TYPE_BY_REACH` (a `null` is an entry), and every type a strategic pack raises has a row in `LEGACY_PLACE_TYPE_TO_BUILDING`. `ambition-templates.ts` gains the milestone rows above.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces only: the place page, the person sheet's Journey tab, the faction sheet, the chronicle; no WebGL change).*

### Player-facing display

1. **Place page, founded town.** The place page's header line gains "Founded by {founder}" (a `useRefRouter` link) when the town has a `constructed_by` edge to an actor, and the existing ruler line names the ruler.
2. **Building card.** A building a mortal raised shows "built by {builder}" where the settlement economy's town-raised building shows "built by the town" (same tag slot; the builder's name is a link).
3. **Lane hover.** The founder appears as the toll holder through the existing words ("Tolled by Kael Thornweaver."), because the hover reads `controlledBy`. No new line.
4. **Person sheet, Holdings.** The founder's town and the builder's building appear in the existing freehold list, because `grantHolding` mints the face.
5. **Journey tab.** The new milestones show with their prose like any milestone.
6. **Faction sheet, founded guild.** The Purse panel works unchanged; the guild's calling shows through the existing guild-type word.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Place page header (founded town) | "Founded by Kael Thornweaver." · tooltip `ui.place.founded`: "The mortal who founded this town. They keep a freehold here, and it pays them while the town lasts." | PC-1 | The name is a link (Law 21). The freehold the tooltip names is the same `owns` edge the person sheet's Holdings list reads, so they cannot disagree (PC-6). |
| Place page ruler line | "Ruled by the Saltmarch Guild." (existing line, now filled for a founded town) | PC-6 | Reads the same `controls` edge the purse taxes through. |
| Building card | "Storehouse — built by Kael Thornweaver" · tooltip: the building's own settlement-economy tooltip, plus "Kael Thornweaver holds it." | PC-1, PC-6 | Same tag slot as "built by the town"; the holder sentence reads `owns`. |
| Chronicle, a founded lane | "A new trade route opens between Ashford and Wolfton, carrying goods." | PC-3 | The existing `trade_route_established` lines; the lane's two ends fill `{actor}` and `{target}`; `{goodsType}` falls back to "goods". A line whose ends do not resolve is dropped, not printed with a hole. |
| Moment card, founding with no free ground | "Kael Thornweaver finds no open ground near Ashford to found a town." | PC-8 | The work ends with a reason, never silently; the town is not stacked on Ashford's hex. |
| Moment card, raising a building | "Kael Thornweaver sets about raising a storehouse in Ashford." | PC-2 | The planned building is named before the work, so its result is not a surprise. |
| Moment card, nothing to raise | "Kael Thornweaver finds no room left in Ashford for what they meant to build." | PC-8 | The work ends with a reason on the card, never silently. |
| Person sheet Means tooltip after a trade run | "Lately: trade that paid." | PC-3 | The existing tooltip shape; `trade_success` gains its writer. |
| Journey tab milestone | "Two roads answer to one name now." | PC-1 | Milestone prose, as every milestone. |
| Empty slots | No founder resolvable → the header line is omitted. No ruler → the ruler line is omitted. No builder → "built by the town" is not claimed; the tag is omitted. | PC-3 | Each line reads one edge; a missing edge drops the line (Law 14). |

### Playtest signal

A tester who follows a mortal through founding a town can afterwards find the town on the map, see who rules it and who founded it, and see it in the mortal's Holdings. **Watch item:** a tester should never read founding as a money engine; the freehold pays quietly and only shows as Means words.

### Event notifications

None new. A founded lane uses the existing economic chronicle line. Founding a town already reaches the chronicle through the existing undertaking completion path.

### Debug inspection (DebugPanel)

- **`window.__DEBUG.getFoundingRecord(locationId): Promise<{ founderId: string | null; rulerId: string | null; rulerReason: 'faction_rank' | 'realm_tie' | 'id_tie' | 'founder' | null } | null>`** in `src/debug-bridge.ts` + `src/debug-bridge.d.ts` (S1).
- **`window.__DEBUG.getLaneHolders(edgeKey)`** returns `{ controlledBy, founderId }` (founder read from the identity node's `constructed_by`; S1), and `window.__DEBUG.getMortalMeans` (mortal wealth's) shows `lastTradeRunPaidTick` once S3 lands.
- The Economy debug tab's lanes table gains a "founded by" column (S1).

### Visual presence (HexMapV2)

N/A — a founded town already draws as a hamlet; lanes already draw. No new map mark.

### UI Laws engaged

| Law | Verdict |
|---|---|
| 1 / 17 | "Founded by" carries a registry tooltip (`ui.place.founded`). Build obligation. |
| 13 / 14 | Words only; every line reads one edge and drops when it is missing. |
| 16 | The moment card names the building before it is built. |
| 21 | Founder and builder names route through `useRefRouter`. Build obligation. |
| 33 | One header line and one tag; nothing new competes for space at 1920×1080. |
| 37 | N/A — no multi-beat flow. |
| 56 | Every line renders from a written edge (`constructed_by`, `controls`, `owns`, `controlledBy`); nothing is claimed that was not written. |
| 58 | `FOUNDED_GUILD_TYPE_BY_REACH` and `LEGACY_PLACE_TYPE_TO_BUILDING` are one entry per kind with completeness tests. |

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/engine/undertakingEconomy.ts` (new: `pickFoundedTownRuler`, `foundedGuildType`, `tradeRunPay`) | undertaking completion / instant | place page, building card | edges and props above | `undertaking.economy.*` | `__DEBUG.getFoundingRecord`, `getLaneHolders` |
| `src/data/undertaking-objects.ts` (the five cells' executors) | undertaking completion | moment card | — | via the helper | trace viewer |
| `strategicGraphOps.ts` (`createLocation`, route create) | — | — | `controls`, `owns`, `trades_with` | — | — |
| `tradeRouteOps.ts` (`executeConductTrade`, S3) | undertaking instant | person sheet Means tooltip | actor `wealth`, `lastTradeRunPaidTick` | `undertaking.economy.trade_pay` | `getLaneHolders` |
| `phaseEconomicChronicle.ts` (trigger map + enrichment) | economic chronicle | chronicle | — | existing | chronicle |
| `graphConditions.ts` + `types/ambition.ts` (S3) | ambition evaluation | Journey tab | — | existing ambition traces | Agents debug tab |
| `factionAmbitions.ts` (S3) | faction ambition review | faction sheet | faction ambition | `undertaking.economy.ambition_met` | Factions debug tab |
| `LocationView.tsx` / the Inspector's place section | — | place page header, building card tag | reads edges | — | browser evidence |

**Prose pipeline:** undertaking lines go through `resolveUndertakingProse`; chronicle lines through the economic chronicle resolver; never `enrichProse`. **Player controls:** none; the player reads.

**Order.** The map's ruling puts every undertaking build last, after mortal wealth. **S1 is blocked by [mortal wealth S1](https://linear.app/threadbare/issue/THR-1936)** (founders and traders must have Means for a freehold or toll to mean anything, and the cost row extends its table). **S2 is blocked by S1 and by [the settlement economy build](https://linear.app/threadbare/issue/THR-1923)** (the chooser, slots and table). **S3 is blocked by S1, mortal wealth's S2 ticket** (the want and the cost switch it measures against) **and [war aims S2](https://linear.app/threadbare/issue/THR-1955)** (the monopoly record).

## Interface impact

`Docs/canon/interface-map.md` lists Economy & Prosperity and Undertakings as audit-on-touch. Contracts:

| Contract | Kind | Production read site |
|---|---|---|
| `founded-town-has-ruler-and-founder` (`controls` ruler → town; `owns` founder → town) | **add** (S1) | `phaseFactionPurse` town tax; `payHoldingIncome` freehold; place page |
| `founded-lane-tolled-by-founder` (`trades_with.controlledBy`; identity node `constructed_by`) | **add** (S1) | `payHoldingIncome` toll (`holdingIncome.ts:108-121`); `agent_holds_lanes` (S3) |
| `founded-guild-earns-guild-work` (faction `guildType`, `reachProfile`, opening `wealth`) | **add** (S1) | `phaseFactionPurse` guild work |
| `mortal-raised-building-from-town-chooser` (building Place + `owns`) | **add** (S2) | settlement economy phase; place page |
| `trade-run-pays-means` (actor `wealth` via `bankWealth`) | **add** (S3) | person sheet Means; the want (mortal wealth S2) |
| `ambitions-read-means-lanes-buildings` (new predicates) | **add** (S3) | ambition evaluator |
| `regional-monopoly-meets-resource-acquisition` | **add** (S3) | faction ambition review |
| `freehold-income-pays-mortal-holders` | **preserve** | unchanged |

`scripts/interface-contracts.ts` gets the same rows; `Docs/canon/systems-inventory.md`'s Undertakings and Mortal Economy rows gain one clause each. `Docs/canon/undertakings.md` gains a paragraph under the verb × object model ("The economic cells leave something behind (THR-1937)") in S1, extended in S2 and S3. Design Reference Wiki: the page whose sources match `undertaking-objects.ts` is updated in each slice.

**UL:** no new player word. *Freehold*, *Means* and *Route* are existing UL terms; "Ruled by" is the place page's existing line, not a UL entry. No `UL-proposal`.

## Constants table

All in `src/data/undertaking-economy-constants.ts`.

| Constant | Default | Purpose |
|----------|---------|---------|
| `UNDERTAKING_ECONOMY_ENABLED` | `true` | Master switch and rollback lever |
| `FOUNDED_TOWN_RULER_INFLUENCE` | `0.5` | Influence on the ruler's `controls` edge (the purse's tax-holder tie-break reads it) |
| `FOUNDED_GUILD_TYPE_BY_REACH` | gold merchants · stone builders · shadow thieves · star temples · veil temples · eye bankers · heart artisans · iron `null` | A founded guild's calling |
| `FOUNDED_GUILD_REACH_COUNT` | `2` | Leading Reaches copied into the guild's reach profile |
| `MEANS_CELL_COST_GUILD` | `30` | S3: the missing `create × faction` row in mortal wealth's cost table (applies only with costs on) |
| `LEGACY_PLACE_TYPE_TO_BUILDING` | granary, warehouse → storehouse · workshop → workshop · shrine → shrine · guild_chapter → counting house · garrison → walls · court, estate, research_circle → `null` (non-economic) | Packs' place types onto the building table |
| `TRADE_RUN_PAY_BASE` | `2` | Means a trade run pays on an idle lane |
| `TRADE_RUN_PAY_PER_UNIT` | `1` | Means per unit the lane carried yesterday |
| `TRADE_RUN_PAY_MAX` | `6` | Cap on one run's pay (one `MEANS_STEP`) |
| `TRADE_RUN_PAY_COOLDOWN_TICKS` | `TICKS_PER_DAY` (imported) | One paid trade run per trader per day |
| `FOUNDED_SETTLEMENT_SITE_SEARCH_RADIUS` | existing (`findUnclaimedSite`'s default, `strategicActionLifecycle.ts:195`) | How far from the site the cell looks for free ground; reused, not redefined |
| `DOMINATE_TRADE_LANES_MIN` | `2` | Lanes held for the milestone |
| `DOMINATE_TRADE_COMPLETION` | `{ requires: 3, of: 5 }` | Dominate Regional Trade's completion rule (the kill criterion's lever: 4 of 5) |
| `DOMINATE_TRADE_MEANS_TIER` | `'Wealthy'` | Means for the milestone |
| `FOUNDING_STARVATION_FLOOR` | `0.5` | S3 kill line: foundings with trade pay and costs on must stay at least half of foundings with costs off |

## Tracing

```ts
// undertaking.economy.found_town — S1, once per founded town
interface FoundTownTrace {
  type: 'undertaking.economy.found_town';
  tick: number;
  founderId: string;
  locationId: string;
  rulerId: string;
  rulerReason: 'faction_rank' | 'realm_tie' | 'id_tie' | 'founder';
  candidateFactionIds: string[];      // town-holding factions the founder belongs to
  siteId: string;                     // the location createSite named
  hexOffset: number;                  // hexes from the site to the free hex chosen
}

// undertaking.economy.found_town_refused — S1, no free ground
interface FoundTownRefusedTrace {
  type: 'undertaking.economy.found_town_refused';
  tick: number;
  founderId: string;
  siteId: string;
  outcome: 'no_ground';
}

// undertaking.economy.open_lane — S1
interface OpenLaneTrace {
  type: 'undertaking.economy.open_lane';
  tick: number;
  founderId: string;
  fromId: string;
  toId: string;
  taxRate: number;
}

// undertaking.economy.found_guild — S1
interface FoundGuildTrace {
  type: 'undertaking.economy.found_guild';
  tick: number;
  founderId: string;
  factionId: string;
  guildType: string | null;
  reachProfile: Record<string, number>;
  openingPurse: number;
}

// undertaking.economy.raise_building — S2
interface RaiseBuildingTrace {
  type: 'undertaking.economy.raise_building';
  tick: number;
  builderId: string;
  settlementId: string;
  plannedBuildingId: string | null;
  raisedBuildingId: string | null;   // null = nothing raised
  outcome: 'raised' | 'repicked' | 'no_room';
}

// undertaking.economy.trade_pay — S3
interface TradePayTrace {
  type: 'undertaking.economy.trade_pay';
  tick: number;
  traderId: string;
  edgeKey: string;
  carriedPerDay: number;
  paid: number;                      // 0 when inside the cooldown
  skipped: 'cooldown' | null;
}

// undertaking.economy.ambition_met — S3
interface FactionAmbitionMetTrace {
  type: 'undertaking.economy.ambition_met';
  tick: number;
  factionId: string;
  ambition: 'resource_acquisition';
  monopolyResourceIds: string[];
  next: 'defensive_consolidation';
}
```

All seven are registered in `src/types/trace.ts`.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| No free hex near the founding site | Nothing is founded; the work completes with the no-ground line; trace `outcome: 'no_ground'` |
| Founder has no memberships, or none that hold a town | The founder rules (`rulerReason: 'founder'`) |
| A membership's faction node is missing | Skipped |
| `grantHolding` fails | The `controls` write stands; a `console.warn` once; no freehold face |
| Founded guild's founder has no `domainCapabilities` | Today's `{}` and 0.1 fallback; `guildType` none |
| No Reach maps to a guild type | `guildType` none; the guild earns no guild work (as today) |
| Settlement economy not on main (S2 unbuilt) | Not reachable: S2 is blocked by it; S1 leaves `create × place` as today |
| Chooser throws | Caught in the cell executor; the work completes with nothing raised and `outcome: 'no_room'` |
| `carriedPerDay` absent | Treated as 0; the run pays the base |
| `lastTradeRunPaidTick` missing | Treated as never paid |
| Lane has no identity node (legacy lane) | No `constructed_by`; the founder still tolls through `controlledBy`, and the lane counts as held through it |
| Trader has no `wealth` (old save) | `readWealth` reads 0; `bankWealth` writes the result |
| `regionalMonopolies` absent | The ambition is not met; no switch |
| Chronicle lane ends do not resolve | The line is dropped |

## Blast Radius

`src/types/ambition.ts` and `src/engine/graphConditions.ts` are read widely (every ambition and many content conditions). The change is additive: two new union members, one widened member (`locationType: string | readonly string[]`, `foundedBySelf?`). Exhaustive switches over the condition union need two cases; the typecheck ratchet finds them. No signature changes.

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/ambition.ts` | wide | Additive union members; the widened `locationType` is read in one evaluator case |
| `src/engine/graphConditions.ts` | wide | Two new cases, one widened; no change to other cases |

## Game Design Laws check

- **Law 20** (engagement window) — untouched: nothing here reads or writes a forecast.
- **Law 22** (no outcome is dead air) — a building that finds no room still ends with a line that says why.
- **Law 24** (failure never loops) — trade pay has no loss side; the cooldown prevents a farm.
- **Law 41** (one vocabulary) — freeholds through `grantHolding`, Means through `bankWealth`, purses through `applyTreasuryDelta`: no new funnels.
- **Law 42** (simple frameworks) — the building comes from the town's own chooser; no second building logic.
- **Law 43** (one concept per thing) — "Means", "freehold", "ruled by" keep their one meaning.
- **Law 45** (never promise what the world will not do) — every line reads a written edge.
- **Law 58** (lists, not screens) — both new tables are one entry per kind with completeness tests.
- No random draw added.

## Three-pillar check

- [x] Engine pillar present (ruler and freehold, lane toll and chronicle, guild purse and calling, the town's next building, trade pay, ambition predicates, faction ambition met)
- [x] Content pillar present (undertaking prose, milestone prose, two data tables with completeness tests; encounters N/A with rationale)
- [x] UI pillar present (place page founder and ruler, building card builder, lane hover via existing words, Holdings, Journey milestones, debug)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves *the world does not wait for the god* (what mortals make stays and pays) and *mechanics surface through prose, never numbers* (every fact is a word or a sentence).
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes a rule of play: founded towns have a ruler and a founder, mortal-raised buildings follow the town's land, lanes pay their founder, trade runs pay the trader, and four ambitions change their milestones.
- [x] `Docs/canon/rulebook.md` is updated in the build PRs: S1 adds two sentences to the undertakings paragraph (who rules a founded town, who tolls a founded lane); S2 one sentence on raised buildings; S3 one on trade pay and the ambitions. The quick reference gains one line in S1.

> Brainstorm companion: `Docs/plans/2026-10-17-thr-1937-undertakings-in-the-economy-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 15 named constants and two tables in one file; the site search radius is the existing constant, reused |
| 2. Inspectability | PASS | Seven trace types with the reason for each choice; two debug accessors; a lanes column |
| 3. Determinism | PASS | No new PRNG; ties by realm then id; the chooser's draw is the settlement economy's seeded one |
| 4. Fail-soft | PASS | Every missing input falls back to today's behaviour; the chooser call is caught |
| 5. Narrative over mechanical perfection | PASS | Words only; the building is named before it is raised; a failed build says why |
| 6. Additive over destructive | PASS | New props and predicate kinds; one widened kind with old reads unchanged; master switch; old milestones kept behind the flag until S3 |
| 7. Performance budget | PASS with note | Writes run once per completed undertaking; `agent_holds_lanes` scans the agent's tolled, founded and claimed lanes, measured in S3's `test:heavy` run against main (budget: ambition evaluation time within noise) |

## Kill criteria

- **S1:** if a 600-tick run on seed 42 shows no founded town paying tax to any faction (purse trace `townTax` source for a founded town), the ruler rule picks nothing in practice; post the census of founders' memberships on the issue and stop.
- **S2:** if the settlement economy's four diversity measures fail with mortal-raised buildings on and pass with them off (seeds 42 and 99), mortals are flattening towns; stop and post the failing measure.
- **S3:** if, with trade pay on and founding costs on, foundings over 600 ticks fall below `FOUNDING_STARVATION_FLOOR` × foundings with costs off (the decision's *"would change the call"*: THR-1865's 9 → 1), trade pay is switching costs on too early; lower `TRADE_RUN_PAY_MAX` before anything else and report.
- **S3:** if Dominate Regional Trade completions over 1,200 ticks rise above three times main's, the 3-of-5 rule is too loose; tighten to 4 of 5.

## Done when

Predicates on seed 42 medium over 600 ticks unless stated.

**S1 (this ticket)**

- [ ] **Free ground:** a founded town never shares a hex with another settlement (test over 600 ticks: no two place-tier settlements on one hex that were not so at tick 0).
- [ ] **Ruler:** a fixture founder who is a member of two town-holding factions gives the town to the higher-rank one; a tie goes to the realm; a founder with none rules alone (unit tests).
- [ ] **Founder's freehold:** after `create × location` completes, `owns` founder → town exists and the person sheet's Holdings list shows the town (test + browser).
- [ ] **Taxed:** in a 600-tick run, every founded town whose ruler is a faction appears as a `townTax` source in that faction's `economy.purse.day` trace, or is a ruin.
- [ ] **Lane:** after `create × route`, the edge has `controlledBy` = founder and the lane's identity node has `constructed_by` → founder, and holding income pays the founder on the next pay day the lane has volume (test).
- [ ] **Chronicle:** a founded lane fires `trade_route_established` with both town names (resolver test with each slot empty: the line drops).
- [ ] **Guild:** a founded guild with a gold-led founder has `guildType: 'merchants'` and a reach profile from the founder's two leading Reaches; with costs off its purse starts at 0 and earns guild work within ten days in a town with a market (test).
- [ ] **Rollback:** with `UNDERTAKING_ECONOMY_ENABLED = false`, a 300-tick run on seed 42 matches main in every `controls`, `owns` and `trades_with` edge.
- [ ] In the browser, `?view=game&seeded&size=medium&undertaking=cell.create.location` on The First, run to completion with `window.__DEBUG.tick(n)`, shows "Founded by …" on the new town's place page; `await window.__DEBUG.getFoundingRecord(<id>)` is non-null with a `rulerReason`. Four-part browser evidence: 1920×1080 screenshot of the place page, console clean, the debug assertion, a UI-Laws line for Laws 1, 13/14, 17, 21, 33, 37, 56.

**S2 (filed)**

- [ ] A mortal-raised building is the chooser's top candidate for that town at completion, never a workshop by default (test across three terrains).
- [ ] A town with full slots is never a target (test).
- [ ] The builder holds it (`owns`) and the card reads "built by …" (browser).
- [ ] The settlement economy's four diversity measures pass on seeds 42 and 99 with mortal-raised buildings on.

**S3 (filed)**

- [ ] A trade run pays base + per-unit, capped, at most once per trader per day (unit test across the cooldown).
- [ ] Each rewritten milestone can be met by its own undertakings: a fixture mortal who founds a town meets Found Something New's; one who opens two lanes and reaches Wealthy meets Dominate Regional Trade's two new milestones (tests).
- [ ] With trade pay on and costs on, foundings over 600 ticks are at least `FOUNDING_STARVATION_FLOOR` × foundings with costs off; the PR body quotes both counts.
- [ ] A faction with `resource_acquisition` and a regional monopoly switches to `defensive_consolidation` on its next review (test).
- [ ] The old milestone shapes are deleted.

**Every slice**

- [ ] Interface contracts, systems inventory, `Docs/canon/undertakings.md`, the wiki page and the rulebook lines updated in the slice that changes them.
- [ ] `npm run check:undertaking -- --all` green.
- [ ] `npm run gate` green (code track: tests, typecheck ratchet, build, 30-tick CLI smoke, `test:heavy`); `npm run gate -- --final` last before push.
- [ ] Closing commit body and PR body carry the line-anchored closer for that slice's issue.

## Slices

| Slice | Ticket | Builds | Blocked by |
|---|---|---|---|
| S1 | this ticket | ruler and founder freehold, lane toll and chronicle, guild purse and calling, debug accessors, founder line on the place page | [mortal wealth S1](https://linear.app/threadbare/issue/THR-1936) |
| S2 | filed at handoff | the town's next building, legacy type map, builder freehold and card tag | S1; [the settlement economy build](https://linear.app/threadbare/issue/THR-1923) |
| S3 | filed at handoff | trade pay, the guild cost row, the four predicates, the milestone rewrite, `resource_acquisition` met | S1; mortal wealth S2; [war aims S2](https://linear.app/threadbare/issue/THR-1955) |

## Coordination block

**Suggested model:** opus — five undertaking executors, a chronicle enrichment and two wide condition files; each slice is moderate, but the ordering across four upstream builds needs care.

**Blocked by:** [mortal wealth S1](https://linear.app/threadbare/issue/THR-1936) — the map's ruling puts undertakings last, after mortal wealth.

**Parallel-safe with:** [the type and icons rollout](https://linear.app/threadbare/issue/THR-1879) and the icon sweeps (UI-only files); [hunger and unrest](https://linear.app/threadbare/issue/THR-1934) (no shared files: unrest phase and Flee minting).

**Mutex with:** any build editing `undertaking-objects.ts` or `strategicGraphOps.ts`; [the Inspector](https://linear.app/threadbare/issue/THR-1876) place section (the founder line moves with the place page; whichever lands second ports it); [seizing a trade lane tolls the wrong lane](https://linear.app/threadbare/issue/THR-1883) (`tradeRouteOps.ts`); S3 with mortal wealth S2 (`MEANS_CELL_COST` table, `decisionBoard.ts` reads).

**Files to touch:** (slice S1; S2 adds the `create × place` path, the settlement economy's building helper call and the card tag; S3 adds `tradeRouteOps.ts`, `types/ambition.ts`, `graphConditions.ts`, `ambition-templates.ts` and `factionAmbitions.ts`)
- Create: `src/engine/undertakingEconomy.ts`, `src/data/undertaking-economy-constants.ts`, `src/engine/__tests__/undertakingEconomy.test.ts`
- Edit: `src/data/undertaking-objects.ts` (location, route, faction executors; the founding site), `src/engine/strategicActionLifecycle.ts` (export `findUnclaimedSite` for the cell), `src/engine/strategicGraphOps.ts` (route props), `src/engine/phaseEconomicChronicle.ts` (trigger map + enrichment), `src/components/Game/LocationView.tsx` (founder line), tooltip registry (`ui.place.founded`), `src/types/trace.ts` (four S1 trace types), `src/debug-bridge.ts` + `src/debug-bridge.d.ts`, `src/components/Game/debug/EconomyDebugTab.tsx` (founded-by column), `scripts/interface-contracts.ts`, `Docs/canon/systems-inventory.md`, `Docs/canon/undertakings.md`, `Docs/canon/rulebook.md` + quick reference, `Docs/plans/wiring-checklist.md` (an *Undertakings in the economy* section), `public/wiki-manifest.json` + the matching wiki page

## Notes for the executor

- **Never read `member_of.rank` raw.** Use `getDerivedMembershipRank` (`factionReputation.ts:241`).
- **Freeholds go through `grantHolding`**, never a bare `owns` edge: the face must agree with the edge (UL *Freehold*).
- **Do not write faction `wealth` with `applyWealthDelta`.** Faction purses go through `applyTreasuryDelta` (purse plan § Notes).
- **A ≥100-importer file** (`types/ambition.ts`, `graphConditions.ts`) changes only in S3, additively.
- The settlement economy's chooser must be a pure function of the settlement (the note on THR-1923); S2 calls it, never copies it.
- Smuggling stays out (the map's *later efforts*).

## Intent-judge verdicts

| Pass | Verdict | Findings | Disposition |
|---|---|---|---|
| 1 | **Allow** (Reversible) | dim 3 GAP: the guild cost row's home was split between S1 and mortal wealth S2; dim 6 GAP: "Ruler" claimed as a UL term; advisories: claimed lanes counted as held without being listed as a how-level choice; NFP row said six trace types (seven defined) | All taken: the cost row moved to S3 (S1's opening purse is 0 by construction); the UL line now says "Ruled by" is an existing UI line; claimed lanes added to the how-level choices for veto; trace count corrected |

## Forked-audit verdicts

Run on the first draft, 2026-10-17 (design lane); the Vision audit was re-run on the revised draft.

### NFP audit

**PASS-with-notes.** Tunability PASS-with-note: the free-ground search radius and the 3-of-5 rule were not in the constants table — *fixed: `FOUNDED_SETTLEMENT_SITE_SEARCH_RADIUS` (existing, reused) and `DOMINATE_TRADE_COMPLETION` added.* Inspectability, Determinism, Fail-soft, Narrative PASS. Additive PASS-with-note: S3 deletes the old milestone shapes and S1 moves the founding site to free ground — both intended, both behind the flag. Performance PASS-with-note: `agent_holds_lanes` measured in S3's `test:heavy`.

### Three-pillar audit

**PASS.** Engine, Content and UI present and substantive; no missing required sections; Wiring maps every module; the Substrate inventory extends existing subsystems (undertaking cells, holdings, trade routes, the shipped purse, ambitions) with no green-field duplication.

### Vision audit

First draft: **REVISE** — the lane's founder was a `foundedBy` actor id on the `trades_with` edge, a relationship in a property (non-negotiable #4, taste profile "graph edges, not property-bag relationships"). *Fixed: the founder is a `constructed_by` edge from the lane's identity node, and the trade-pay cooldown is one number on the trader instead of a per-trader map on the lane.* Re-run on the revised draft: **PASS-with-notes.** No contradictions; confirms non-negotiables #2, #3, #4, #6, #7; extends the north star's *the world does not wait for the god*. Note: leans toward systemic emergence (economy plumbing), offset by chronicle lines, milestone prose and buildings named before they are built.
