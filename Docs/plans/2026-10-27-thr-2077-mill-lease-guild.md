> **title:** A sealed mill lease gives the town's mill to a guild — the fellowship becomes a real faction that holds the mill and earns its dues — THR-2077
> **linear_issue:** THR-2077
> **author:** Claude Code (design lane, run 2026-10-27b, unattended)
> **created:** 2026-10-27
> **three_pillars:** Engine done (one aftermath effect kind, one purse line) · Content done (one effect on *The Lease Sealed*) · UI done (no component; the guild's page and purse sentence already read the edge, one phrase added — § UI pillar)

# A sealed mill lease gives the town's mill to a guild — THR-2077

*The cellarer sealed the lease, and the fellowship paid Wren's fee. In Ashford the Carvers' Guild holds the mill now, and every quarter the grinding pays its dues into the guild's chest.*

## Why this is load-bearing

*The Mill Lease* (`mill-lease-auction.ts:37`) wins the abbey's water-mill *"for the fellowship"*, and *The Lease Sealed* (`mill-lease-sequels.ts:43-96`) pays the hired mortal's fee. The fellowship is not a node, so after the sealing nobody holds the mill and no purse earns from it. [A place held after success](2026-10-26-thr-2048-place-held-after-success.md) Decision 4 ruled the mill is not the mortal's, and returned the row to [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954) as *a faction holds a place*. It is that list's last row.

The agreed input is the kingdom-economy ruling on [the mortal economy map](https://linear.app/threadbare/issue/THR-1863): factions hold the places that fit them and earn from them, so that factions have something to fight over.

## Substrate inventory

Measured on main @ b22026e7. Census: branch [`proto/thr-2077-mill-census`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2077-mill-census) (never merge), `npx tsx scripts/_scratch-mill-census.ts --seeds 42,99,7 --ticks 360`, medium.

| Fact | Where |
|---|---|
| *The Lease Sealed* resolved **13 / 10 / 6** times in 360 ticks (seeds 42 / 99 / 7). *The Lease Forfeit* resolved 0 / 0 / 1. | census, trace `encounter_resolution` |
| A mill Place stood in **1 / 2 / 2** towns of 39 / 59 / 53, and no faction controlled one. | census at t360 |
| A guild (a purse faction with a guild affinity) was present in **23 / 28 / 28** towns. Present means a hall, a home, or a member standing there. | census; `guildPresenceIndex`, `factionPurse/income.ts:294-313` |
| At worldgen **no** faction `controls` edge points at a Place (47 and 68 faction `controls` edges on seeds 42 / 99, 0 onto Places). | census at t0 |
| The purse already pays a controlled Place's holder: every faction `controls` target is collected, `taxHolderOf` picks one holder (a single controller wins outright), and `placeYieldOf` pays its resource bag. A mill has no bag, so today it would pay **0**. | `income.ts:179-213`, `:231-243`, `:339-361` |
| The mill is a town building: `{ id: 'mill', sublocationTypeId: 'sublocation-type.mill', tag: 'food', upkeep: 0.2, effects: { food: 1.2 } }`. `raiseBuilding` adopts a standing unbuilt Place of the type, else mints one, and `buildingSlotsOf` caps the count. A mortal-raised building is stamped by `markMortalBuilding` and stays as a Place if lost. | `settlement-buildings.ts:99-103`; `settlementEconomy/building.ts:217`, `:250-252`, `:263-310`; `undertakingEconomy.ts:562-575` |
| The realm border projection reads `controls` only from **realm** nodes, and resolves a Place target to its parent's hex. | `realmProjection.ts:110-140` |
| A faction's page lists its `controls` targets, Places included, in Connections. The purse sentence names a `place` source by its largest good, else by the Place's name. | `factionNetwork.ts:387-392`; `purseSentences.ts:78-81` |
| War aims defend every `controls` target of a faction. | `warAims/defence.ts:29-36` |
| `faction_broker_fealty` already picks "the best-standing faction present at the broker's town" in an aftermath. | `unifiedAction.ts:1036-1060` |
| *The Lease Sealed* success writes `reputation_with $here` and `bond_change $cast:cellarer` only. | `mill-lease-sequels.ts:76-86` |

## Decisions

Decided by the design lane under delegation (process.md rule 4). Each can be vetoed on its own.

1. **The fellowship is the town's own guild.** When the lease is sealed, the guild with the strongest claim in that town holds the mill. That is the first affinity in `MILL_FELLOWSHIP_AFFINITIES` (artisans, builders, merchants, traders, miners, bankers) with a faction present in the town. Within that affinity, the faction with the most members standing there wins, then the lowest id. Temples are left out because the abbey is the landlord, not the leaseholder. Thieves are left out because a thieves' guild does not bid for a mill under the abbey's rule. *Veto:* "the abbey (the temple) should keep the mill" or "the mortal's own faction should hold it".
2. **No guild in town, no holder.** About half of towns have no guild present (census). There the lease is still sealed and the fee is still paid, exactly as today, and nobody holds the mill. The trace says `no_fellowship`. We do not invent a faction.
3. **The mill stands afterwards.** If the town has an unheld mill, the guild takes it up. If no mill stands and the town has a free building slot, the mill is raised as one of the town's buildings, so the same harvest feeds more mouths (its existing `food: 1.2` effect). If there is no free slot, nothing is raised and nobody holds anything (`no_room`). The mill is never raised beside another one.
4. **A scene never takes a holding away.** A mill another faction already holds stays theirs (`held_elsewhere`). This is the rule from [a place held after success](2026-10-26-thr-2048-place-held-after-success.md) Decision 3 and [a road's encounters](https://linear.app/threadbare/issue/THR-2046) Decision 3.
5. **A held mill pays its guild milling dues.** Each purse cycle a faction-controlled mill pays `HELD_BUILDING_DUES.mill` (0.2, a quarter of a middling town's tax), scaled by the town's prosperity the way town tax is. A ruined town pays nothing. The dues are a row in a table keyed by building, so another building can follow without new code.
6. **The forfeit writes nothing.** On the missed branch the mill goes to *"the merchant"*, a person and not a faction.

## Engine pillar

### Systems design

1. **New aftermath effect kind `guild_hold_place`** (`src/types/unifiedAction.ts`, `EncounterAftermathReactionEffect` union, beside `hold_place`):
   ```ts
   | { readonly kind: 'guild_hold_place';
       /** A building id from SETTLEMENT_BUILDINGS, e.g. 'mill'. */
       readonly buildingId: string;
       /** Guild affinities in preference order; default MILL_FELLOWSHIP_AFFINITIES. */
       readonly affinities?: readonly string[];
       /** The settlement; default the scene's own place ($here). */
       readonly targetLocationId?: string;
       readonly when?: EffectPredicate; }
   ```
2. **Handler** in `applyEncounterAftermathReaction` (`src/engine/encounterAftermath.ts`), beside `case 'hold_place'` (`:1999`). Skipped when `!FACTION_PURSE_ENABLED`. Steps:
   - Site = literal `targetLocationId`, else `resolveSceneHere(graph, actorId, 'location')`. If it is missing or not `isSettlement` → `aftermath_target_invalid` (`target_node_missing` / `not_a_settlement`), write nothing.
   - Def = `getSettlementBuilding(buildingId)`. If it is missing → `aftermath_target_invalid` `unknown_building`.
   - **Fellowship** = new pure `pickTownGuild(graph, siteId, affinities)` in `src/engine/factionPurse/townGuild.ts`. It takes the purse factions where `affinityOf(f)` is in `affinities` and are not realms (the private `isRealmNode`, `realmProjection.ts:93`, is exported for this), and keeps the ones `guildPresenceIndex` places in the site. It returns the first affinity in order that has any, ranked by members whose `located_at` resolves to the site (descending), then id. None → `no_fellowship`.
   - **Mill** = the site's `contains` Places with `sublocationTypeId === def.sublocationTypeId`, lowest id first.
     - Standing, with an incoming faction `controls` edge from the guild → `already_theirs`, no write.
     - Standing, controlled by another faction → `held_elsewhere`, no write.
     - Standing, uncontrolled → write the `controls` edge (below). If it is not yet a building and a slot is free, also `markMortalBuilding`. With no free slot it stays a plain Place: it is held and pays its dues (step 3 keys on the Place type), but it does not feed the town. Result `taken_up`.
     - None standing, `readBuildings(...).length < buildingSlotsOf(site)` → `raiseBuilding(graph, site, def, tick)`, then `markMortalBuilding` on the new Place (a guild-raised building reads as adopted, so it stays a Place if the town later loses it), then the edge. Result `raised`.
     - None standing, no slot → `no_room`, no write.
   - **The edge:** `controls` guild → mill, id `controls_<guild>_<mill>_<tick>`, properties `{ role: 'guild_holding', influence: GUILD_HOLDING_INFLUENCE, establishedTick: tick, via: 'encounter' }`. Then `touchStructure(runtime)`, because `fingerprintFactionControls` (`realmProjection.ts:223`) keys on these edges.
   - Every branch emits `encounter.place.guild_held` (§ Tracing).
3. **Purse line** (`src/engine/factionPurse/income.ts`, the place loop at `:339-361`): after `placeYieldOf`, add `heldBuildingDuesOf(graph, place)`. It keys on the Place **type**, not on the building stamp, so a held mill always pays (Decision 5), stamped or not: `def = buildingForPlaceType(place.properties.sublocationTypeId)` (`settlement-buildings.ts`), then `HELD_BUILDING_DUES[def.id] × parent prosperity / TOWN_TAX_PROSPERITY_PIVOT` when the parent settlement is above `RUINED_SETTLEMENT_PROSPERITY_FLOOR`, else 0. The amount is booked into `income.placeYield` and a `place` source. Holding blessing applies as it does to yield.
4. No change to `grantHolding`, holding income (it pays mortals only, `holdingIncome.ts:94-96`), realm projection, or war aims. A guild-held mill joins the guild's war-aim defence list by the existing read. That is intended: it gives the guild something to defend.

### Graph nodes / edges

No new node or edge type. Writes are an existing `controls` edge (faction → Place, already allowed: `realmProjection.ts:127-129` resolves a Place target) and, on `raised`, the building Place `raiseBuilding` mints. `src/types/graph.ts:81`.

### Tick phases · Resolution · PRNG

No phase change. The effect runs at the roll. The purse line runs in the existing `faction_purse` phase. No new PRNG draw: the guild and the mill are picked by fixed keys.

## Content pillar

One effect on `town.mill_lease_sealed`'s `successMetadata.effects` (`mill-lease-sequels.ts:82-85`):

```ts
{ kind: 'guild_hold_place', buildingId: 'mill' },
```

No prose changes. The success line says *"{cast:cellarer} sealed the lease, and the fellowship paid {name}'s fee"*, and that holds on every branch. The fellowship is the guild when one is present. Where none is, nothing in the prose names a holder. *The Mill Lease* and *The Lease Forfeit* are unchanged (Decision 6).

## UI pillar

No component changes.

### Player-facing text

| Surface | Exact text | Complaint class | How the player understands it |
|---|---|---|---|
| Guild page, Connections | *Mill (Ashford)*, the building's existing name from `raiseBuilding` (`<cardName> (<settlement>)`) | PC-6: one fact, the `controls` edge, read by the page, the purse and war aims | The guild holds Ashford's mill |
| Guild page, Purse row | *"Most of its coin comes from the mill at Ashford and the town of Ashford."* | PC-1: no number, only where the coin comes from | The mill earns the guild money |
| Town page, Places | *Mill (Ashford)* when minted, or the adopted Place's own name (e.g. *Ashford Water-Mill*), with its building art | PC-3: no raw id; the building words already exist | Ashford has a mill now |
| Lease Sealed afterimage (unchanged) | *"The rent was all there. {cast:cellarer} sealed the lease, and the fellowship paid {name}'s fee."* | PC-8: the sealing now answers with a change in the world | The fellowship won and holds the mill |
| Guild page, Connections, an **adopted** standing mill | the Place's own worldgen name, e.g. *Ashford Water-Mill*, unchanged | PC-6 | as above |

**PC-6: the same fact on four surfaces, and why the words differ.**
- **Who holds it.** The scene says *"the fellowship"*. That is deliberate. The scene is told from the hired mortal's side, where the bidders are "the fellowship", and two branches (`no_fellowship`, `no_room`) have no guild to name. A slot that names the guild would be blank or false on those branches. The guild's own page is the one surface that names the holder, through the `controls` edge.
- **What it is.** Connections and the town's Places show the Place's **name**: *Mill (Ashford)* when minted, or its own name when adopted. The Purse row shows the building **kind** (*"the mill at Ashford"*), because purse sources are worded by kind (*"the salt of…"*, *"the town of…"*, `purseSentences.ts:70-91`). All three read the one Place through the one edge, so they never disagree on which mill.

- **Before:** after *"The lease was sealed"*, no faction's page changes and no town gains a mill.
- **After:** the guild's page lists *Mill (Ashford)* under Connections, from the existing `controls` read (`factionNetwork.ts:387-392`). The town's Places list the mill by the same name (*Mill (Ashford)* when minted, the adopted Place's own name otherwise) with its building art (`settlementBuildings.test.ts` already requires art for `sublocation-type.mill`). When the mill is one of the guild's two largest sources, the Purse row reads *"Most of its coin comes from the mill at Ashford…"*. To make that read right, `sourcePhrase`'s `place` case (`purseSentences.ts:78-81`) gains one branch: a Place with no goods and a `HELD_BUILDING_DUES` row reads `['the ' + buildingNoun + ' at ', placeRef(parent)]`, with words from `HELD_BUILDING_SOURCE_WORDS` (§ Constants).
- **Empty / missing:** a mill whose parent is gone falls back to the Place's own name, as today. A guild with no name falls back to the existing faction placeholder.
- Laws engaged: 1 (one truth: the `controls` edge), 4 (no numerals: dues show only as a source phrase), 13/14 (no raw ids), 17 and 21 (the mill and the guild are links through existing rows), 33 (the guild's page is where a reader looks for what it holds), 37 (no new panel), 56 (every line is backed by the write).

### Event notifications

None new. The sealing's own success line is the moment. A guild gaining a mill in a background scene is learned from the guild's page, as a mortal's freehold is (THR-2048).

### Visual presence (HexMapV2)

N/A: a Place is the sublocation tier and draws nothing on the hex map, and non-realm `controls` edges never move a border (`realmProjection.ts:110-114`).

### Debug inspection

The Traces tab shows `encounter.place.guild_held` with its `result`. The Inspector on the mill shows the incoming `controls` with `role: 'guild_holding'`. `await window.__DEBUG.getFactionPurse(guildId)` (`src/debug-bridge.d.ts:1727`) shows the `place` source.

### Playtest signal

A warm-playtest tester who opens a guild in a town where a mill lease was sealed finds the mill among what it controls.

**Browser-verify tool:** Playwright DOM at 1920×1080. The changed code is engine-side (`purseSentences.ts`), so the DoD UI pillar does not bind. The executor still takes one screenshot of the guild's page showing the mill, reached through `?view=game&seeded&size=medium` and the debug bridge. If no route reaches a sealed lease, the screenshot is replaced by the view-model test below.

## Wiring

Checked against `Docs/plans/wiring-checklist.md`: one new module (`townGuild.ts`), no new phase, component or debug tab.

| Module | Phase | UI | GameState | Trace | Debug |
|---|---|---|---|---|---|
| `guild_hold_place` handler (`encounterAftermath.ts`) | encounter resolution | guild page Connections; town Places | graph: `controls` + building Place | `encounter.place.guild_held` | Inspector on the mill |
| `pickTownGuild` (`factionPurse/townGuild.ts`) | — (pure) | — | reads graph | via the handler's trace (`guildId`, `affinity`) | — |
| `heldBuildingDuesOf` (`income.ts`) | `faction_purse` | Purse row source phrase | faction `wealth` | existing purse day sources | Purse row |

## Interface impact

| Contract | Status | Change |
|---|---|---|
| Encounter Aftermath → Faction territory (`controls` onto a Place) | add | the first encounter writer of a faction→Place `controls`. Read sites: `income.ts:339-361` (purse), `factionNetwork.ts:387` (page), `warAims/defence.ts:29` (defence), `realmProjection.ts:223` (fingerprint; non-realms do not move borders) |
| Encounter Aftermath → Settlement buildings (`raiseBuilding`, `markMortalBuilding`) | add | a third raiser beside the economy and undertakings. Read site: `readBuildings` (food channel, upkeep, slots) |
| Faction purse ← held building dues | extend | `placeYield` gains a dues term for a controlled building Place |

`Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` gain all three rows in the build PR.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `MILL_FELLOWSHIP_AFFINITIES` | `['artisans','builders','merchants','traders','miners','bankers']` | which guilds may hold a leased mill, in preference order (Decision 1) |
| `GUILD_HOLDING_INFLUENCE` | 0.5 | the `controls` edge's influence; only breaks ties in `taxHolderOf` when two factions control one Place |
| `HELD_BUILDING_DUES` | `{ mill: 0.2 }` | what a faction-held building pays each purse cycle at the prosperity pivot (Decision 5) |
| `HELD_BUILDING_SOURCE_WORDS` | `{ mill: 'mill' }` | the noun in *"the mill at Ashford"* |

All live in `src/data/faction-purse-constants.ts` beside `GUILD_PLACE_AFFINITY`. Turning it off is data: remove the effect from the template, or set the dues to 0.

## Tracing

```ts
interface EncounterPlaceGuildHeldTrace {
  category: 'encounter.place.guild_held';
  tick: number; agentId: string; sourceTemplateId: string | null;
  siteId: string; buildingId: string;
  result: 'raised' | 'taken_up' | 'already_theirs' | 'held_elsewhere' | 'no_fellowship' | 'no_room';
  guildId: string | null; affinity: string | null; placeId: string | null; heldBy?: string;
}
```

Registered in `TraceCategory` / `TRACE_CATEGORIES` (`src/types/trace.ts`) beside `encounter.place.held`.

## Fail-soft table

| Case | Behaviour |
|---|---|
| Actor not in a settlement | `aftermath_target_invalid`; nothing written; the fee and bond writes still apply |
| Unknown `buildingId` | `aftermath_target_invalid` `unknown_building`; nothing written |
| No guild present | `no_fellowship`; nothing written |
| No free building slot and no mill | `no_room`; nothing written |
| `raiseBuilding` returns null | traced `no_room` with `placeId: null`; no edge |
| The guild later dissolves | its edges go with it; the mill stays a town building with no holder, and the next sealing can take it up |
| The town is razed | the existing building-loss path runs; the edge dangles on a removed node and the purse skips it (`income.ts:343-344`) |
| `FACTION_PURSE_ENABLED` false | handler is a no-op; dues term is never reached |

## Blast Radius

`src/types/unifiedAction.ts` is wide-blast. The change is one additive union member. The sentinel-binding and apply switches in `encounterAftermath.ts` gain a case (the `hold_place` neighbours), and `npm run check:typecheck` finds any other `switch (effect.kind)`. No existing member changes shape.

## Three-pillar check

- [x] Engine pillar present (one effect kind, one picker, one purse term)
- [x] Content pillar present (one effect on one template)
- [x] UI pillar present (existing surfaces, one phrase)
- [x] Wiring section connects them

## Game Design Laws

Conforms to 13 (the world's factions gain and earn without the god), 41 (one vocabulary: an aftermath effect and an existing edge), 42 (one effect for any guild-held town building, the mill first), 43 (no new concept: a guild *controls* a place, as it already can) and 45 (*"for the fellowship"* is now true where a fellowship exists). Breaks none.

## Vision audit

- [x] Does not contradict a Vision premise. Checked: `Vision/00-north-star.md` (a story: the Carvers' Guild won Ashford's mill through Wren's work), `Vision/01-core-loop.md` (mortals' deeds change the world), `Vision/02-non-negotiables.md` (the relationship is an edge), `Vision/03-design-tensions.md` #2 (systemic, with the scene's own words) and #4 (dues never shown as a number), and the taste profile (prose-first, graph edges).
- [x] No Vision edit needed.

## Rulebook impact

- [x] A rule of play changes: a sealed mill lease leaves a guild holding the town's mill.
- [x] Owed in the build PR, in `Docs/canon/rulebook.md` beside the THR-2048 line and in the quick reference's economy paragraph: *"When a mill lease is sealed, the town's own guild holds the mill and earns its dues. A scene never takes a holding away."* (`[IMPL — THR-2077]`).

> Brainstorm companion: `Docs/plans/2026-10-27-thr-2077-mill-lease-guild-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | four named constants; off is data |
| 2. Inspectability | PASS | one trace naming guild, affinity and branch; `role` on the edge |
| 3. Determinism | PASS | no PRNG; fixed-key picks |
| 4. Fail-soft | PASS | table above |
| 5. Narrative | PASS | the fellowship the scene names becomes real |
| 6. Additive | PASS | one union member, one module, one purse term, one phrase branch |
| 7. Performance | PASS | `guildPresenceIndex` once per sealed lease (about 10 a seed per 360 ticks) |

## Done when

- [ ] `guildHoldPlace.test.ts`: in a town with an artisans guild present and no mill, the effect leaves one mill Place (`isBuilding`, stamped by `markMortalBuilding`) and one `controls` from the guild with `role === 'guild_holding'`. Result `raised`.
- [ ] The same test covers the other branches. A second run is `already_theirs` with no new edge. A mill controlled by another faction is `held_elsewhere` and gets no edge. No guild present is `no_fellowship`, with nothing written. A full town with no mill is `no_room`, with nothing written. An unheld standing mill is `taken_up`. A temple or thieves' guild alone is `no_fellowship`.
- [ ] `pickTownGuild` test: the affinity order wins over member count, member count wins within an affinity, and a realm never holds.
- [ ] Purse test: a guild controlling a mill in a town at the prosperity pivot gains `HELD_BUILDING_DUES.mill` as a `place` source. In a ruined town it gains 0. A mill Place with no `buildingId` (taken up with no free slot) pays the same dues. The source phrase reads *"the mill at <town>"* for both.
- [ ] Content test: `town.mill_lease_sealed` success carries `guild_hold_place` with `buildingId: 'mill'`. The forfeit and the auction carry none.
- [ ] A 30-day headless run on seeds 42, 99 and 7 reports `encounter.place.guild_held` counts by result. No town has two mills. Realm border hexes are identical with and without the effect (the run's `fingerprintFactionControls` differs, but the projection's hexes do not).
- [ ] Rulebook and quick-reference lines; interface map and contracts; wiki page whose `sources` match. `npm run gate` green.

## Kill criteria

- `no_fellowship` is more than 60% of sealed leases pooled over the three seeds. Then widen `MILL_FELLOWSHIP_AFFINITIES` to every non-realm, non-temple purse faction present, and re-measure.
- A guild's Means band rises by more than one band from mill dues alone in the 30-day run. Then halve `HELD_BUILDING_DUES.mill`.

## Coordination block

**Suggested model:** sonnet. One additive effect kind on the `hold_place` precedent, one pure picker over existing reads, one purse term, one phrase branch.

**Parallel-safe with:** [salt](https://linear.app/threadbare/issue/THR-2069), [the bounty duel](https://linear.app/threadbare/issue/THR-2072), [the board context pull](https://linear.app/threadbare/issue/THR-2071). None edits the mill templates, the purse place loop or the aftermath union.

**Mutex with:** [an oath from tribute](https://linear.app/threadbare/issue/THR-2051). Both may add a member to the aftermath effect union in `unifiedAction.ts` and a case in `encounterAftermath.ts`. That means merge conflicts only, with no design overlap. Whoever lands second rebases.

**Files to touch:** `src/types/unifiedAction.ts`, `src/types/trace.ts`, `src/engine/encounterAftermath.ts`, `src/engine/factionPurse/townGuild.ts` (new), `src/engine/factionPurse/income.ts`, `src/engine/factionPurse/purseSentences.ts`, `src/data/faction-purse-constants.ts`, `src/data/encounters/mill-lease-sequels.ts`, tests; rulebook pair, interface map and contracts, wiki page.

## Notes for the executor

Do not touch `grantHolding` or `holdingIncome.ts`: the mill is a faction's, not a freehold. Do not change *The Mill Lease*'s stakes or prose. Do not let a realm hold the mill, because that would move a border.

## Intent-judge verdicts

| Run | Verdict | Findings | Fixed by |
|---|---|---|---|
| 1 | Revise | dim 4 GAP: a mill taken up with no free slot had no `buildingId`, so it paid no dues; dim 12 GAP: PC-6 surfaces not reconciled, no sample for an adopted mill | dues key on the Place type (`buildingForPlaceType`), with a Done-when; PC-6 block and adopted-mill row added |
| 2 | Revise | dim 12 GAP: the town Places row quoted *Mill* while the PC-6 block quoted the Place name | row and After bullet now quote the Place name |
| 3 | **Allow** | none | — |

## Forked-audit verdicts

### NFP audit
PASS-with-notes. All seven pass. Note on 7 (Performance): the per-purse-cycle `heldBuildingDuesOf` cost is not measured. It is one table lookup inside a loop that already visits every controlled place.

### Three-pillar audit
PASS-with-notes. Engine and Content are present and substantive. UI is present, but thin as first drafted: it had no player-facing text table and no complaint-class (PC-n) check. The table is now added, with PC-1/3/6/8. Resolution and PRNG share one heading, and the substrate table states dispositions in the Interface impact table rather than in its own column. These are structure-only notes. The plan builds on Factions & Succession and the guild seeding systems, and does not rebuild them.

### Vision audit
PASS-with-notes. There are no contradictions. North star: mild support, because this is background-world storytelling. Tension #2: it leans a little toward systemic emergence, and about half of towns (those with no guild) get no visible payoff. The kill criterion widens the guild list if `no_fellowship` dominates.
