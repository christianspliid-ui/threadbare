> **Audit, 2026-10-14 (attended session).** Evidence base for the wayfinder map THR-1863 (*Mortal economy: making wealth and want drive what agents, factions and towns do*, project M3: Dynamic Economy). Confirmed defects are filed separately as THR-1862. Findings only; no design is decided here. Christian's framing: the economy exists to *"provide substrate for the world, and drive a lot of the fundamental interaction and behavior of the in game living agents (factions, cities, agents)."*

# Mortal economy — state, gaps, connectivity, content, UI, player verbs, undertakings

Measured on `main` @ `667869d2`, seed 42, map medium, headless CLI (`npm run cli -- --seed 42 --map medium` with piped `eval` probes), ticks 0 → 600. Code reads by five parallel sweeps (engine core, connectivity, content, design history, UI/verbs/undertakings); every defect listed in §8 was re-read in source by the session before filing.

## 1. Verdict

The mortal economy is a **closed weather system, not a driver**. Prosperity is a rich equilibrium model and it does ripple outward: into settlement tier, gold-reach places, location traits (Welcoming, Lawless), army supply, scene mood (THR-725) and the essence bridge. But:

- **No mortal decision reads wealth.** No graph condition, no scoring term, no undertaking cost. Getting rich or poor changes a Means word, a trait and chronicle lines.
- **Factions have no economy.** Treasuries never earn; monopolies are computed and unread; no faction action or war aim is economic.
- **Stocks are a fixed map.** Nothing is produced or consumed per tick; lanes carry a cargo label and move nothing.
- **The player sees little of it** and gets no economic receipt after an economic verb.
- **Most economic content is disconnected:** ~65 money encounters with good prose write nothing economic.

The 2026-07-04 plan's directive ("the economy is very simple — few resources, not used in trade routes or to influence spheres, factions, or power", `Docs/plans/2026-07-04-mortal-economy-resource-web.md:9`) was largely answered on the *settlement* side (P1–P4 shipped 2026-07-05 → 2026-07-28) but not on the *actor* side. The second-pass bar — "not complete if consequences only change background numbers" (`Docs/plans/2026-04-02-economy-consequence-second-pass-design.md:350`) — is still unmet for agents and factions.

## 2. Measured runtime (seed 42, medium)

| Measure | t0 | t100 | t300 | t600 |
|---|---|---|---|---|
| Settlements (hamlet/town/city/capital) | 38 (17/9/8/4) | — | 39 | 42 |
| Settlement prosperity bands | 20–39: 17 · 40–59: 17 · 60–79: 4 | — | 20–39: 20 · 40–59: 18 · 60–79: 1 | 20–39: 22 · 40–59: 18 · 60–79: 2 |
| Settlements whose prosperity moved (t0→t300) | — | — | 36 of 37 (22 up, 14 down; 22 by ≥10; range −35…+37) | — |
| Settlement tier changes | — | — | 0 | 0 |
| Resource stocks (location `resources` bag) | 140 | 140 | 140 | — |
| Stock quantity quartiles | 20/40/53/69/94 | **identical** | **identical** | — |
| Stock tiers (scarce/adequate/surplus) | (not yet derived) | 6/87/47 | 6/86/48 | — |
| `trades_with` lanes | 6 | 6 | 4 | 5 |
| Lane volume (max 10) | 1 | 2 | 2–3 | — |
| Lanes with `controlledBy` / `threatened` | 0 / 0 | 0 / 0 | 0 / 0 | — |
| Individuals / with a `wealth` value | 506 / 47 | 656 / 137 | 825 / 159 | — |
| Individual wealth quartiles | 20/40/40/70/70 | 8/20/30/48/78 | 6/20/25/65/100 | — |
| Factions / with `wealth` / sum of faction wealth | 52 / 49 / **0** | 66 / 49 / **0** | 84 / 49 / **0** | **0** |
| Unrest quartiles (settlements) | 0 | 0/0/0/1/3 | 0 | — |
| `controls` / `owns` edges | 47 / 47 | — | 80 / 55 | — |
| Individuals holding an economic trait | 0 | — | 0 | — |
| Settlements at prosperity ≤ 1.5 (the §8.1 crash signature) | 0 | — | 0 | 0 |

No individual's wealth dropped below 6 in 300 ticks, consistent with §4's finding that the legacy gold actions (which would overwrite wealth to ~0.15) no longer fire.

## 3. Engine core — what each part does, and who reads it

All phases are registered and run (some on a 4- or 12-tick cadence). Dead code is *inside* phases, not whole phases.

| Part | Writes | Read by | Notes |
|---|---|---|---|
| `resourceSeeding.ts` (worldgen) | location `resources: {quantity, renewable, renewalRate}` | everything below | Only other writers: anomaly finds (`orchestrator.ts:969-979`), rival `drain_stock` (`:1851`), god verbs (`graphOpExecutor.ts:1669-1819`). **No per-tick regrowth or use**; `renewalRate` only feeds carrying capacity (`phaseProsperity.ts:226-235`). |
| `resource_stock_tiers` (`phases/resourceStockTiers.ts`, `resourceEconomy.ts`) | `resourceBalance`, `ResourceInstance.stockTier`, livelihood thread tugs, scarcity/glut chronicle | prosperity target (`phaseProsperity.ts:444`), embargo seeds (`routeEvents.ts:184`), army supply host (`armySupply.ts:118`), lane manifest, essence bridge (`essenceEconomyBridge.ts:138`), `LocationView.tsx:981` | Demand is a proxy: `0.15 + prosperity·0.35 + sublocation density·0.30` (`resourceEconomy.ts:51-60`). Full detail capped at 40 locations. |
| 6.62 `phaseTradeRouteDecay` | `lastTraded`, `volume` (toward 2–4), lane deletion, `prosperityShocks` −3 | lane consumers | Settlement lanes refresh every tick (THR-1636). |
| 6.628 `holdingIncome.ts` (12 ticks) | individual `wealth`, `lastWealthReason` | Means tooltip (`agentDetail.ts:984`) | **Faction holders skipped** (`:85-88`). Toll = `max(1, round(volume·0.1))` ≡ 1 at volume ≤ 10 (`:113`), so `taxRate` has no effect. |
| 6.63 `phaseProsperity` | `prosperity`, `populationTrend`, `populationLagTicks`, `populationHealth`, death-site `unrest`, shock seeds (THR-725) | scene scoring (`encounterScoring.ts:1484`), prose (`proseEnrichment.ts:604`), tier promotion, sublocations, unrest, tithe, yield, traits, omens | Target = carrying capacity + trade + faction presence + corruption + divine influence + unrest + upkeep + spheres + stock balance; drift 0.05, ±2/tick. **Faction presence is always 0** (§8.4). `populationTrend`/`populationLagTicks` have no reader. Five shock constants unused (`:168-183`). |
| 6.632 `phaseEconomicTraits` | `economicPeakWealth`, `previousTickWealth`, `wealthLossCount`, `guildJoinedTick`; 8 trait edges | itself; trade-baron gives +0.15 gold capability | `debt-laden` written, nothing grants or tooltips it. |
| 6.635 `phaseSettlementPromotion` | `locationSubtype` after 20 ticks ≥70 / ≤20 | encounter cache rebuild | 0 changes in 600 ticks on seed 42. |
| 6.636 `phaseSettlementReassessment` | `genomeResult`, archetype fields | UI, prose | **`materializeGenome()` runs only at worldgen** (`worldSeed.ts:1451`): a promoted town never gains its new places (`:10`, `:73`). |
| 6.637 `phaseUnrest` | `unrest` (−1/tick, −0.5 more above prosperity 60; low health raises it) | prosperity target, Lawless trait, omen, survey prose | Header promises defection at 70 and sack at 90 (`:7`); the code only traces dropping *below* them (`:82-87`). Low prosperity does not raise unrest. |
| 6.65 `phaseSublocations` | 7 Gold-reach place types (market district, mine, harbor, warehouse, counting house, smugglers' den, caravan rest) | — | Warehouse/counting house gate on guild wealth (`sublocation.ts:920-930`), which is always 0. Dead: `MINE_PRODUCTION_PER_TICK`, `SUBLOC_MARKET_TRADE_BONUS`, `SUBLOC_MARKET_VOLUME_BONUS` (`:57-63`). Other 7 reach families empty (`:209-218`). |
| 6.66 `phaseEconomicChronicle` | chronicle entries | chronicle | `getNodesByType('agent')` (`:97`) matches nothing (§8.5). Template match on event id cannot work (ids are `ua_ua_N_resolved`). Lane context reads the actor's own `trades_with` edges (`:227`), but lanes run settlement to settlement. `monopolyResource` (`:247`) has no writer. `guild_founded` never fires. |
| `route_events` (12 ticks) | lane `threatened`, `threatenedSinceTick`, ambush/embargo/toll seeds | prosperity trade bonus, holding income, lane traffic, army supply, map markers | Seed outcomes are empty (§5). |
| `army_supply` (4 ticks) | `armyState.supply/supplyMax/supplyTier/supplyHostId/supplyHops`, forage/mutiny/siege-lifted seeds | attrition (`armyAttrition.ts:117`), `ArmySheet.tsx:67`, detail pages | **The best economic coupling in the engine.** Shortest path over roads + lanes to a host town with balance ≥ −0.2. |
| `economic_power` (12 ticks) | `faction.monopolies` (`:197`), sphere drift from lane goods, `scarcityArc` + unrest Δ + seeds | monopolies: **nothing** (the comment at `:199-200` is false) | Scarcity arc: shortage → hoarding → unrest → flashpoint. |
| `wealth.ts` | constants, `bankWealth` | — | 12 constants (trade success/failure, disrupted, agreement broken, the five spend costs) appear only in the CMS tunables list. `WEALTH_PROSPEROUS_HOME_INCOME` deliberately unpaid (residence is observed, THR-822). |

**Goods, prices, money.** 18 resource types with class, base value, sphere and category; **no prices**; demand is a proxy; **no per-settlement production or consumption**; money is a 0–100 `wealth` on actor nodes (no coin item); lanes carry a manifest built once at founding (`strategicGraphOps.ts:117`) and never refreshed. The only real consume-and-deliver loop in the game is the army larder. The only closed feedback loop is prosperity → demand → stock balance → prosperity target.

## 4. Connectivity — does the economy drive behaviour?

| Consumer | Verdict | Evidence |
|---|---|---|
| Mortal encounter choice | **Weak yes.** Boom/bust term, 0.15 × deviation, cap ±0.5, on 43 templates; Welcoming/Lawless traits | `encounterScoring.ts:1481-1494`, `economic-scene-affinity.ts:49-52` |
| Mortal undertakings | **Narrow yes.** Decision board leans to held towns; the surplus→scarce lane bias is **dead** under cells (§8.7) | `decisionBoard.ts:477-481`, `strategicActionCandidates.ts:959-978` |
| Planted scenes | **Yes.** Shocks, scarcity arcs, lane events, supply trouble plant encounters on present mortals | `phaseProsperity.ts:795-829`, `economicPower.ts:325-334` |
| Mortal wealth → choice | **No.** No condition or scoring term; `wealthCost` on strategic packs never charged (`strategicActionCandidates.ts:286`); `minWealthRequired` lost in migration (`unified-action-templates.ts:358-396`), its gate has no caller (`actionCandidates.ts:71`); "wealth advantage" in social leverage reads Gold reach (`socialLeverage.ts:188-196`); `secretGeneration.ts:151` reads `goldCapability`, never written | — |
| Births, migration, idle, professions | **No.** Births = head count only (`agentLifecycle.ts:447-449`); Bless the Harvest's `migrationPullUntilTick` has no reader (`unifiedActionResolution.ts:1717`); a role sets only starting wealth (`npcGraduation.ts:91-123`) | — |
| Faction treasury | **Dead.** Seeded 0 (`factionSeeding.ts:268`, `guildSeeding.ts:310`), only debited (`phaseFactionActions.ts:310,665`); `FACTION_MIN_TREASURY` gate (`:793`) blocks Commission Quest (5) and Issue Bounty (12) forever | `holdingIncome.ts:10-11` promises income "stays with phaseFactionActions"; none exists |
| Faction prosperity (derived, THR-711) | **Yes.** Gates expansion (`factionAmbitions.ts:102-108`) and feeds faction Gold capability (`domainCapability.ts:68-70`) → army spawning (`armySpawning.ts:93-94`) | — |
| Monopolies, faction actions, ambitions, succession, schism, agendas | **No.** 0 of 6 faction actions economic (`types/factionAction.ts:19-24`); 1 of 20 ambitions | — |
| War targets | **No.** Nearest hostile settlement (`armySpawning.ts:154-194`) | — |
| War → economy | **Yes.** Battles cut prosperity and sever lanes (`battleAftermath.ts:580-635`); blockades threaten lanes (`strategicGraphOps.ts:1152-1171`); horde raids cut prosperity | — |
| Army funding | **Dead.** `checkUnderfunded` reads unwritten faction `prosperity` (§8.3) | `armyAttrition.ts:221` |
| Settlements | **Strongest.** Prosperity → tier, places, traits; but population is hollow (`populationTrend` unread), recruitment no | — |
| Rival gods (THR-619) | **Partly.** Reads `worldHasStocks`; drains the richest stock, severs lanes; "corner the grain" and "starve the faithful" write no economic state (`orchestrator.ts:2218-2244`, `:2368-2386`); targets god turf, not value | — |
| Prose | **Mostly unwired.** `prosperityResolver` not in `LOCATION_RESOLVERS` (`proseGenerator.ts:38-53`); `{econ_adj}`/`{econ_noun}`/`{econ_atmosphere}` filled (`proseEnrichment.ts:952-954`) but used by no template | — |

## 5. Content

| Area | Count | Quality | Note |
|---|---|---|---|
| Resources | 18 (8 common, 10 rare) | adequate | No made goods (salt ~155 prose mentions, cloth ~87). Tier prose for 7 of 18; lane-goods prose for 5. Desert, dunes, tundra, arctic, snow fields, oceans: empty tables (`resource-content.ts:228,363-377`). `world-model.json` is stale (8 resources, 2026-03-08). |
| Settlement places | 7 conditional Gold places + genome customs house, exchange, merchant prince hall | adequate | No encounter references customs house, exchange, merchant prince hall, mine, harbor or manufactory. 5 guild types, none with encounters of its own. |
| Lane events | 3 (ambush, toll dispute, embargo) | rich prose, **no state change** | Every step `onSuccess: []`/`onFailure: []`. Embargo hard-coded to grain ("The Grain Does Not Come") even when a water or fish scarcity arc seeds it (`economicPower.ts:334`). `locationSubtypes: ['village', …]` names a tier that does not exist and omits hamlet. Merchant pool `#consortium_errand` holds 5 templates (`undertaking-cells.ts:214-216`). |
| Simple money encounters (`encounter.*`) | ~42 | adequate prose, **no state change** | the_loan, toll_bridge, debt_collection, merchants_gambit, market_haggle, smuggle_goods, caravan_deal, guild_negotiation, black_market_deal, the_fence, pirate_raid, labor_dispute, prospecting_expedition, the_rich_vein, harbor_construction, … (full list in the content sweep). The 15,453-line `encounter-content.ts` mentions wealth/prosperity/resource/tradeRoute once. |
| Branching money encounters | ~23 | rich prose, **no state change** | bell-at-the-exchange, border-levy, cathedral-loan, coiners-mint, counting-house-dispute, crowns-reckoning, debt-arbitration, granary-riot, ledger-by-lamplight, mill-lease-auction, overdue-caravan, pawnbrokers-strongroom, smugglers-ford, the-granaries-in-the-famine-year, tithe-barn-raid, tithe-demanded, toll-gate-writ, toll-of-blades, warlords-tribute, the-unmarked-crossing, … None in the boom/bust table. |
| Faction guild content | Merchant Consortium 15, Thieves Guild ~6 economic, Builders 2 | rich, broken metadata | 8 of the Consortium's 10 `questTemplateIds` do not exist (escort_goods, appraise_cargo, open_market, collect_debts, trade_war, monopoly_bid, trade_empire, royal_charter; `merchant-consortium-definition.ts:104-109`). `mct.leadership.` prefix matches 0 templates. |
| Economic ambitions | 1 of 20 | thin | Dominate Regional Trade (`ambition-templates.ts:110`). |
| Rival economic scheme | 4 beats × 3 variants | rich, wired | `rival-schemes/economic.ts`. |
| Economic chronicle | 15 triggers, ~85 templates | rich, partly orphaned | `guild_founded` (6 templates + 15 flavor lines) never emitted. |
| Boom/bust table (THR-725) | 41 rows, 6+6 seed lists, 36 mood words | table wired; mood words orphaned | `economic-scene-affinity.ts:237`. |
| Legacy gold actions | 12 `action.gold.*` | **unreachable** | In `UNIFIED_ACTION_TEMPLATES` (`unified-action-templates.ts:5808`) but their selector `phaseIdleSelection` is imported and never called (`orchestrator.ts:133`, `:3387-3388`). Their wealth ops are raw numbers that would *overwrite* wealth (`graphOpExecutor.ts:528-558`), a dormant bug. `npc_trade_goods` is a stub (no ops, `motivations: []`). |

No TODO / lorem / "placeholder" markers were found in economy files; the thinness is disconnection, not stubs.

## 6. What the player can see

| Surface | Shows | Reach | Status |
|---|---|---|---|
| `LocationView.tsx:959-1027` Livelihood box | up to 3 scarce/surplus goods; Famine/Glut for staples; essence-bridge clause | place page | real |
| `LocationView.tsx:1131` place prose | most abundant good; lane volume tier, goods, threatened/controlled/decaying (`proseResolvers.ts:873-918`) | place page, `HexChronicle.tsx:379` | real |
| `HexTooltip.tsx:364-395` | per lane: far end, goods, ·staple, ·threatened, ·blockaded, ·fading (no volume) | hover | real |
| `TradeRouteMesh.ts` | lane lines, gold or red, width by volume | map | real |
| `LocationProfileModal.tsx:156` | tier word, holder; prosperity and balance hidden on purpose (`:20-23`) | profile | real |
| `OverviewTab.tsx:714-735` | mortal Means word + source tooltip (`agentDetail.ts:1002-1016`) | agent sheet | real |
| `AttachmentsTab.tsx:119-125` | holdings (toll, freehold) | agent sheet | real |
| `FactionSheet.tsx:416-422` | faction Means word | faction sheet | real, always Destitute (faction wealth 0) |
| `ThreadsPanel.tsx:484`, `ThreadDetailView.tsx:932` | prosperity label | Threads | **broken** — reads unwritten `prosperityScore` (§8.6) |
| `ArmySheet.tsx:67` | supply word | army sheet | real |
| `DoomClockDetail.tsx:56-57` | "Settlement unrest", "Prosperity shock" as effect labels | doom clock | real |
| `codexRegistry.ts:739-780,905` | resource classes | Codex → Resources | real, static |
| Great Chronicle | promotion/demotion, lane born/died, monopoly, wealth tier (dead, §8.5), scarcity/glut, holding income, scarcity-arc ending | chronicle | real |
| `EconomyDebugTab.tsx`, `ArmiesTabContent.tsx:207` | stock tiers, balance, monopolies, raw prosperity | debug panel | **debug only** |

**Invisible to the player:** prosperity (number or band), unrest, route volume (only line width), lane owner and toll, faction monopolies, scarcity-arc phase, `resourceBalance`, holding income amounts, settlement tier change except as a chronicle line.

## 7. What the player can do, and what comes back

| Card | Effect | Unlock / cost |
|---|---|---|
| `loc.open_markets` (`unified-action-templates.ts:2083`) | prosperity +6, unrest −10 | milestone *the wellspring flows* (`ascendant-milestone-beats.ts:76-96`); 3 essence |
| `loc.bless_harvest` (`:1893`) | prosperity +12, health +15, staple stock +25 | same milestone; 4 |
| `loc.blight` (`:1934`) | prosperity −10, health −12, staple stock −25 | same; 4 |
| `loc.reveal_vein` (`:1978`) | adds a missing non-staple good at 35, or +20 to the poorest | same, tier 2; 5 |
| `loc.guide_caravan` (`:2013`) | every touching lane: volume +1, clears threatened, refreshes | same; 5 |
| `loc.sour_mine` (`:2048`) | every non-staple good −25 | same; 5 |
| `loc.incite_unrest` (`:1817`) | unrest +20 | market, tier 1; 2 |
| `loc.sicken_wells` (`:2388`) | health −25, unrest +15, blocks promotion 10 ticks | market, tier 2; 6 |
| `loc.curse_roads` (`:2427`) | unrest +10; prosperity ignores those lanes 12 ticks | market, tier 2; 5 |
| `hex.bless_land` / `corrupt_land` / `cultivate` | divine influence / corruption → prosperity target | market |

- **Receipts:** the cast receipt diffs only the target's influences and traits (`castTargetChanges.ts:87-111`). No prosperity, stock or unrest change is ever shown.
- **Promised but unwired:** Open the Markets' thieves' guild and trade partner (`location-action-constants.ts:52-58,105` constants never read; `tradehub` subtype exists nowhere else); `hex.claim_resource` pays a flat 0.5 matter/tick regardless of resource (`:4538-4576`); `hex.incite_exodus` prose says "prosperity crumbles" but it only drifts agent values (`hexActionBridge.ts:632-647`).
- **No verb** touches a mortal's wealth, a holding, a single lane, or a monopoly.
- **What the god gets back:** sanctity drift on typed essence sources from local stock (capped below flowering, `essenceEconomyBridge.ts`); livelihood thread tugs; planted scenes. Holding income pays mortals only (The First's holdings feed her Means). Dominion has no direct economic input.

## 8. Confirmed defects (filed as THR-1862)

1. Undertaking `change:raise`/`change:lower` on prosperity: delta 0.1, clamp [0, 1] on a 0–100 value → sets any town to 1 (`undertaking-objects.ts:1237-1251`, `strategic-action-constants.ts:1283`). Latent: 0 occurrences in 600 ticks on seed 42; 7 ambitions use raise, 2 use lower.
2. Tithe bands `[0.25, 0.5, 0.75]` vs raw prosperity → every living town pays ×2 (`strategic-action-constants.ts:1476`, `holdingIncome.ts:94-99`).
3. `checkUnderfunded` reads unwritten faction `prosperity` ?? 0.5 → no army is ever underfunded (`armyAttrition.ts:221`).
4. `computeFactionPresence` tests `node.type === 'faction'`; factions are `actor` nodes → bonus always 0 (`phaseProsperity.ts:333-344`).
5. `getNodesByType('agent')` → wealth-tier chronicle never fires (`phaseEconomicChronicle.ts:97`).
6. Threads prosperity label reads unwritten `prosperityScore` → always Destitute (`retinue.ts:551,993`).
7. Lane-pairing bias checks the retired `create_trade_route` hint; cells carry `no_mutation` → bias dead (`strategicActionCandidates.ts:969-978` vs `createsRoute` at `:668`).
8. False comment: monopolies "feed encounter-scoring inputs" (`economicPower.ts:199-200`).

**Dormant, not filed as a fix:** the legacy gold actions' wealth overwrite (§5) — the actions are unreachable; whether to revive or retire them is a map decision.

## 9. Undertakings and the economy (cells model, `UNDERTAKING_MODEL = 'cells'`)

| Cell | Reads | Writes |
|---|---|---|
| create × location | — | settlement at prosperity 8 (`strategic-action-constants.ts:1076`); **no resources bag, no holder** (`strategicGraphOps.ts:1093-1150`) |
| raise / lower × location | — | prosperity ±0.1 clamped [0,1] — **§8.1** |
| use × location (draw yield, THR-1439) | prosperity band, commerce places, 12-tick cooldown (`undertaking-objects.ts:1211-1218`) | holder wealth; prosperity −4; standing −0.05 (`yieldOps.ts:100-156`) |
| claim / seize × location | — | `controls` → tithe |
| destroy × location | — | prosperity floor 0.1, subtype → ruins |
| create × place | — | place only: **no `owns` edge (no freehold), no stock effect** (`strategicGraphOps.ts:170-233`) |
| claim / seize / destroy × place | — | freehold → `WEALTH_SUBLOCATION_INCOME` |
| create × route | pairing bias **dead** (§8.7) | lane at volume 1, manifest from endpoints; **does not fire `trade_route_established`** |
| raise × route | volume cap 10 | volume +2 |
| lower / use / claim / seize × route | — | blockade; conduct trade +1; freehold; toll |
| faction expansion | derived faction prosperity ≥ 0.3 (`factionAmbitions.ts:37,103-107`) | — |

- Dominate Regional Trade (`ambition-templates.ts:110-141`) walks 11 economic cells; milestones check bonds, a market and gold reach (`:156-173`), never Means, lanes or a monopoly.
- No economic link: Rebuild from Ashes (`:1730`, no strategic profile), Found Anew (`:1788`), Protect the Home, Flee the Ravaged Land, Greatest Healer, Avenge the Fallen, Avenge the Wrong.
- A guild founded by an undertaking (`UNDERTAKING_DEFAULT_FACTION_SEED`) gets no wealth or monopoly.

## 10. Design intent vs shipped (history)

- **Shipped:** Gold Reach systems (2026-03-17); M3 P1 THR-615 (2026-07-05), P2a THR-616 (07-21), P2b THR-669, P2c THR-670, P3 THR-617 (07-22), P4 verbs + THR-618 essence bridge (07-28), THR-725 economy shapes scenes (07-23), THR-619 rival scheme (07-27), THR-711 derived faction prosperity, THR-626 army supply over lanes (08-05), THR-1320 founder's warranty (08-28), THR-1428 holding income (09-07), THR-1439 yield as a verb (09-08), THR-1636 lane traffic (09-28); divine side THR-1747/1748/1750 (10-08 → 10-13).
- **Deferred / never built:** Flow Web primitive extraction (DEFER, `Docs/plans/2026-07-22-flow-web-extraction-checkpoint.md`); pressure-driven migration (THR-729, Idea); flow-web hooks — doom economic tell, economic protagonists, economic mandates, relic economy, agent careers, scarcity → Maslow needs, economy onboarding beat (`flow-web-exploration.md:53-61`); second-pass reward-pool modifiers, security/risk channel, rumor heat, consequence packets.
- **Interface map:** no economy row is LEAKED/PARTIAL/HOLLOW/UNWIRED, but Economy & Prosperity is on the audit-on-touch list (`interface-map.md:402`) — stock tier → prosperity, route events, economic power, scarcity arcs, rival scheme and wealth → traits have **no contract rows**. `blockade-suspends-lane-traffic` is UNVERIFIED-OK (no blockade landed in 300 ticks on seeds 42/99).
- **UL gap:** Freehold and Means are defined (`Agents.md:653`, `:913`); prosperity, resource class, stock tier, livelihood, famine/glut, monopoly, cargo manifest, tithe and toll are not.
- **Rulebook drift:** `rulebook.md:453` "Both verbs" is stale; the quick reference says five divine economic verbs while six are granted (`rulebook-quick-reference.md:90`).

## 11. Unexplored opportunities (inputs to the map, not decisions)

- **Wealth as want, not label:** poverty and greed as drives in the decision board; charge the existing `wealthCost`.
- **The faction purse:** route the 114/117 faction-held `controls` edges' tithes to treasuries; one wire turns on Commission Quest, Issue Bounty, guild warehouses and counting houses and gives faction Means meaning.
- **Goods that move:** regrowth at the existing `renewalRate`, local use, lanes shifting surplus to scarcity, so embargoes, blockades and cut lanes *starve* a far town.
- **Hunger → faith:** scarcity as a reason to pray; a god who answers a famine earns devotion. Bridges the mortal economy into the player's core loop.
- **Economic war aims and monopolies with teeth:** armies march on staples and lanes; a monopoly drags rivals' towns or arms an embargo.
- **Unrest with consequences:** defection, revolt, sack, new factions and schisms.
- **Encounters that write the economy:** ~65 money encounters already exist; adding outcome effects and famine/boom eligibility is cheap relative to the content already authored.
- **Show it in words:** prosperity and unrest bands on the place page, a map look for boom and famine, economic receipts on god verbs (the prosperity prose resolver already exists, unregistered).
- **Undertakings that build the economy:** founded towns with stocks and a holder; buildings that change stock or income.
