> **title:** `Realms and Areas — the map draws what the world keeps: one geography, and nations as the factions that hold the ground — THR-1155`
> **linear_issue:** THR-1155
> **author:** `Claude Code`
> **created:** 2026-09-10
> **three_pillars:** Engine `done` · Content `done — a realm definition minted per culture at worldgen, a court ladder, a realm encounter meta, the anchor-catalog rows flipped; no encounter prose` · UI `done — the three map layers read projections of the graph; the hex chronicle and location profile name the Area and the Realm with image, tooltip and link; Claude-in-Chrome for the WebGL borders, Playwright for the DOM lines`

# Realms and Areas — THR-1155

*Today the map draws two things the world does not keep. The red political borders are provinces grouped by culture, computed once at worldgen and parked in a React state with no setter, so a town seized on tick 200 sits inside a border that will never move. The dotted geographic borders and their labels come from a second region detector that never enters the graph, joined to the real Area nodes by array index, so the name a player reads over a mountain range belongs to whichever unrelated cluster shares its position in a list. After this there is one geography, kept in the graph and stamped on every hex; and a nation is a Realm — a faction with a definition, a seat and a court — whose border on the map is the towns it holds, redrawn whenever one changes hands.*

## Why this is load-bearing

Christian's direction (chat, 2026-08-17), verbatim: *"I agree 100% this is a flaw in the implementation, that nations and areas only have the rendering implemented and the game state part is not there. lets schedule a fix for that also."* THR-1156's fourth ratified distinction says the same as architecture: *rendering reads projections of canonical game state, never private pipelines*. Measured on `main` (survey 2026-09-10), the two objects fail it differently.

**Named areas are half real.** `region` nodes exist — 41 on the census seed, minted by `worldSeed.ts:603-623` from the flood-fill detector, named from historical-culture ownership, with `contains` edges to their Locations and `tile.regionId` stamped on their hexes; the world-object catalogue registers them as **Area** (`world-objects.ts:184-189`) and the hex chronicle already says *Region: The Iron Crags*. But the renderer never reads them. `hexGrid.ts:132` runs a second detector, `detectRegionsBorderCost` (watershed), whose `RegionData.geographicRegions` and `hexRegionId` feed `GeoBorderMesh` and the label overlay; `gameInit.ts:142-152` then copies the graph nodes' names onto those clusters by `region_${geo.id}` — an index join between two different partitions. 115 of 768 tiles carry no `regionId` at all (`worldSeed.ts:1167-1171`). The Area also has `worldRef: null` (no chip can route to it), `effectScope`'s `'region'` case is a hex-radius fake (`effectScope.ts:109-128`), and the five modules under `src/engine/region*` sit under World Generation by module prefix only (`systems-inventory.md:62`) with no tick phase of their own.

**Nations do not exist.** The word appears once in `src/`, in a comment (`factionAmbitions.ts:33`). The red borders are `RegionData.hexDomainId` / `hexProvinceId` — provinces from the worldgen partition, grouped into "domains" by shared `cultureId` (`regionPolitical.ts:258-263`), named *duchy of Blade Heights*, held in `useSimulation.ts:90` as `useState` with no setter. `BorderMesh.ts:190-251` reads only those two per-hex maps; it never touches the graph. Meanwhile the two or three generic factions `worldSeed.ts:1346-1370` mints (`FACTION_COUNT` 2–3, names from a fixed list) carry no `factionDefId`, so nine faction subsystems skip them by construction: no ambition (`factionAmbitions.ts:189` `continue`), no quest (`phaseFactionActions.ts:277`), no encounter content (`encounterFilterPipeline.ts:364-439`), no rank ladder (`factionReputation.ts:83`), no army through the ambition path (`armySpawning.ts:48`). Their territory is `controls` edges assigned round-robin (`worldSeed.ts:1375-1385`, *"first faction controls first location"*), retargeted by province only when `WORLDGEN_TERRITORY_MODE === 'province'` (`seedLivingWorld.ts:229-305`). So the thing the player sees (a culture's provinces) and the thing that could simulate (a generic faction) are two different objects that never meet. The anchor catalog records the consequence: *Nation — nothing; do not anchor to a nation* (`generate-anchor-catalog.ts:424-443`), pinned by a test that fails the day a nation object lands.

**The settled input this plan builds on, not against.** THR-1394 (Christian, 2026-09-03) ratified the Area row with its note: *"Geographic only: political territory is a faction's `controls` edges, never a second region kind."* That sentence is the design: a nation is not a new node type and not a second region; it is a **Faction** — the catalogue's existing kind, which already *"holds territory through `controls`"* — given what the generic factions lack: a definition, a seat, a class, and a border drawn from what it holds. The load-bearing rule against inventing node types is satisfied by inventing none.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **World Generation, Terrain & Places** — `region` nodes (`worldSeed.ts:603-623`, flood-fill `detectRegions`, marked `@deprecated` at `regionDetection.ts:519`), `tile.regionId`, `contains` region → location (`worldSeed.ts:1175-1188`), `regionNaming.ts` + `region-name-content.ts`, `historicalCulture.assignHistoricalTerritories` | 🟢 ACTIVE | **extends** — the Area keeps its node, name and `contains` edges; its hexes come from the watershed detector instead, so every hex has one |
| Renderer-side geography — `detectRegionsBorderCost` (`regionDetection.ts:226`), `RegionData` (`regionTypes.ts:97-108`), `hexGrid.ts:127-185`, `gameInit.ts:142-152` index join, `GeoBorderMesh.ts`, `regionLabels.ts`, `RegionLabelOverlay.tsx` | 🟢 ACTIVE, **private pipeline** | **replaces the source, keeps the layers** — the meshes and labels read a projection of the graph and tiles; the parallel clustering and the index join are deleted |
| Worldgen political partition — `ctx.provinceIds` / `provinceRoles` (`hexGrid.ts:36-45`), `regionPolitical.ts:158-300` (provinces, domains by `cultureId`, `DOMAIN_NOUNS` names), `CapitalMarkers.ts` | 🟢 ACTIVE, **worldgen-only, never re-derived** | **activates as the Realm's founding data** — the domain becomes the Realm faction, the domain's name its name, the capital hex's settlement its seat; provinces stay worldgen scaffolding (culture assignment, naming) and stop being drawn |
| **Factions & Succession** — generic faction mint (`worldSeed.ts:1346-1370`, `FACTION_COUNT`, `FACTION_NAMES`), `controls` edges (`worldSeed.ts:1375-1385`; `edgeSchema.ts:107-115` actor → location), `retargetTerritoryByProvince` (`seedLivingWorld.ts:229-305`), `factionDefId` consumers (`factionAmbitions.ts:185-189`, `phaseFactionActions.ts:277`, `encounterFilterPipeline.ts:364-439`, `factionReputation.ts:83`, `armySpawning.ts:43-73`), `leads` + `getFactionLeaderId` (`notableAgendas.ts:102-108`, `factionSuccessionOps.ts:94`) | 🟢 ACTIVE | **activates for realms** — the generic factions become Realms with a dynamic definition minted at worldgen; territory is written once, by province, as the canonical `controls` edges |
| Faction definition lookup (THR-1322) — `src/data/faction-definition-lookup.ts` (`getFactionDefinition(id, state.dynamicFactionDefinitions)`, the run-founded overlay, `publishDynamicFactionDefinitions` at game init), `GameState.dynamicFactionDefinitions` | 🟢 ACTIVE, **half-wired** — four callers (`factionNetwork.ts`, `tooltipResolver.ts`, `FactionSheet.tsx`, `faction-sigil-assets.ts`), none of them a subsystem that skips def-less factions; the engine's own consumers read the static `FACTION_DEFINITIONS` map by id (predicate: any `FACTION_DEFINITIONS.get(` / `ALL_FACTION_DEFINITIONS.get(` under `src/engine`; measured 2026-09-10: 21 sites in 12 files, `factionReputation.ts` alone six) | **extends and repairs** — a Realm's definition is minted through this door, and § Engine B sweeps every engine read site onto the lookup so the door leads somewhere; this also admits THR-1322's run-founded factions, which the same sites shut out today |
| Area point reader — `src/engine/hexRegion.ts` `getHexRegionData(graph, regionId)` → `{ regionId, regionName, featureType, hexCount, historicalCulture }`, consumed by `useHexZoomData.ts:129` into `HexChronicle.tsx` / `HexSidebar.tsx`; the ruling comment (2026-08-24) names it as *"the graph-backed reader … unused by the renderer"* | 🟢 ACTIVE, chronicle-only | **preserves as the canonical point reader** — one Area's detail by id; `areaProjection` (§ Engine A) is the *partition* view the map layers need (every hex → Area, every Area → hexes) and composes over the same nodes and stamps; the chronicle keeps reading `getHexRegionData` through `useHexZoomData`, which gains the Realm read for the *held by* line. Two reads, one source, no third model |
| **Strategic Projects & Control** — `controls` also carries mortal holds (THR-1287) and the ascendant's `controlEffects` | 🟢 ACTIVE | **preserves** — a Realm's `controls` edges are faction-sourced; `isMortalHolder` and the stance loop ignore them today and keep doing so |
| **War, Armies & Battles** — `raiseCampaignArmy` (`notableAgendas.ts:472-508`), `economy-provisions-armies` (an army eats from the towns its faction holds) | 🟢 ACTIVE | **connects** — a Realm with a definition reaches `isEligibleForArmySpawn` through ambitions, and the towns it holds feed its armies as any faction's do |
| Shared anchor machinery (THR-1212) — `WorldRefKind` (`worldRef.ts:34-47`), `EncounterAftermathConceptRef.visualKind` (`unifiedAction.ts:201-241`), `NavigationTarget`, the anchor catalog (`generate-anchor-catalog.ts`, `anchor-catalog-sources.ts:156-165`), `assertKindUnionCoverage` | 🟢 ACTIVE | **extends** — `area` joins `WorldRefKind` and `visualKind` with a route; `faction` already covers the Realm |
| Effects & scoping — `effectScope.ts:109-128` (`'region'` = radius-4 fake), `settingClasses.ts` (spawn scope = location subtype only), `SCENE_SENTINEL_FIELDS` (THR-1446 added `$here`, Done 2026-09-10) | 🟢 ACTIVE | **extends** — `'region'` scope becomes Area membership; two sentinels `$area` and `$realm` resolve from `$here` |
| **Culture** — `cultureId` on provinces, `belongs_to` historical layer | 🟢 ACTIVE, worldgen-only | **preserves** — a Realm belongs to its founding culture through the same `belongs_to` edge a Location uses |

**Grep evidence (2026-09-10, worktree at `main` `bc04d0af`+).** `NodeType` has no `nation` / `polity` / `domain` / `province` (`graph.ts:17-39`); `ActorType` has no room and needs none. `getFactionDefinition(` has four production callers (`src/engine/factionNetwork.ts`, `src/engine/tooltipResolver.ts`, `src/components/Game/FactionSheet.tsx`, `src/data/faction-sigil-assets.ts`), none of them among the subsystems that skip def-less factions; `FACTION_DEFINITIONS.get(` has 21 engine sites in 12 files. `HexTile` (`types/index.ts:124-146`) carries `regionId?` and no political stamp. `RegionData` is not on `GameState` or `SimulationRuntime`. `BorderMesh.ts` and `GeoBorderMesh.ts` each have one production importer (`HexMapV2.tsx:962-969`); `regionTypes.ts` has 10 production importers, six of them renderer files. Census: 41 Areas, 106 Factions (`world-objects.generated.md:18,26`). The anchor catalog's tripwire: `generate-anchor-catalog.test.ts:108-120` asserts `nation` is absent from the node types and `region` is `named` — the first stays true under this plan (no node type is added), the second flips to `linked`.

## Engine pillar

### Systems design

**A. One geography — the Area is the map's terrain partition.** Worldgen mints `region` nodes from **one** detector, the watershed `detectRegionsBorderCost` (the non-deprecated one, whose clusters are the ones the player has been looking at), and stamps `tile.regionId` on **every** hex it partitions (the flood-fill left 115 unstamped). `RegionData.geographicRegions` / `hexRegionId` stop being computed in `hexGrid.ts`; the renderer's geographic layer reads `buildAreaProjection(tiles, graph)` — `{ areas: [{ id, name, featureType, hexes, center }], hexAreaId: Map }` — derived from the tiles' stamps and the nodes' names. The index join in `gameInit.ts:142-152` is deleted with the thing it joined. `effectScope`'s `'region'` case becomes *hexes whose `regionId` equals the caster's hex's* (capped by the existing `SCOPE_REGION_MAX_HEXES`), which is what the word always claimed. The deprecated flood-fill detector is deleted once nothing calls it. **Kill criterion:** if the watershed partition leaves any hex unstamped, the executor's coverage test fails and the detector gains a nearest-cluster fill before anything ships; a hex without an Area is the bug this slice exists to remove.

**The acted-on test, answered for the Area.** An Area is acted on in four places after this slice: an effect scoped `'region'` lands on its real members and nowhere else; a chip or seed binds `$area` and the aftermath reaches into it; a reference of kind `area` routes to its page; and the chronicle names it with image, tooltip and link. Before this slice the first was a radius fake, the second and third did not exist, and the fourth read a name joined by list position. That is the difference between a label and an object.

**B. Realms — a nation is a Faction with a definition, a seat and a class.** At worldgen, for each domain `regionPolitical.ts` forms (provinces sharing a `cultureId`), the seeding pass mints **one Realm**: an `actor · actorType: 'faction'` node — the same shape the generic factions have today, which it replaces — carrying `factionDefId: realm.<cultureId>` and `factionClass: 'realm'`, with a **dynamic faction definition** written into `GameState.dynamicFactionDefinitions` (the THR-1322 path run-founded factions already use, so `faction-definition-lookup` resolves it everywhere): name from the domain (`DOMAIN_NOUNS` × culture short name — *the Kingdom of Wild Storm*), `kind: 'realm'`, a **court ladder** (`REALM_RANK_LADDER`, the words a subject climbs), the reach profile of its culture, and an encounter meta pointing at the realm family (§ Content). Its **seat** is the settlement on the domain's capital hex (the `controls` edge to it carries `role: 'seat'`, an edge-internal property; `CapitalMarkers` reads that edge); its **culture** is a `belongs_to` edge to the culture node; its leader is whatever `getFactionLeaderId` derives, and the succession seam may seat one with `leads` as for any faction. **Territory** is written once, at worldgen, as `controls` edges Realm → every Location whose hex the domain's provinces cover — `retargetTerritoryByProvince` becomes the canonical writer and runs unconditionally (the `WORLDGEN_TERRITORY_MODE` flag retires); the round-robin assignment and `FACTION_NAMES` are deleted. `FACTION_COUNT` retires: the number of Realms is the number of domains, which is the number of cultures worldgen seated (2–4). Guilds, orders, cults and monster factions keep `factionDefId`s from the static catalogue; the class discriminator is `factionClass` on the node (`realm · guild · order · cult · monster · founded`), stamped by each minter, registered as the Faction kind's classes.

**The door is only half-hung, and this slice hangs it.** The nine skips all key on `factionDefId`, and THR-1322 built `getFactionDefinition(id, state.dynamicFactionDefinitions)` so a definition minted at run time resolves like an authored one. But on `main` the engine's consumers do not call it: `factionAmbitions.ts:81`, `encounterFilterPipeline.ts:367`, `factionReputation.ts` (six sites), `factionQuestGeneration.ts`, `factionOutcome.ts`, `factionMembership.ts`, `factionMemberWork.ts`, `factionRankBonus.ts`, `phaseReputationTraits.ts`, `socialEncounterGeneration.ts`, `agentDetail.ts` and `npcSeeding.ts` read `FACTION_DEFINITIONS.get(id)` on the static map, so a run-founded faction is shut out of ambitions, quests, ladders and encounter gates exactly as the generic factions are — THR-1322's door opens onto a wall, and nobody noticed because a founded faction is rare. **Slice 2 sweeps every engine read site onto the lookup** — the one in `src/data/faction-definition-lookup.ts:119`, returning `null`, not the `factionNetwork.ts:171` wrapper that returns `undefined`, so all 21 sites land on one signature — (membership predicate: any by-id read of `FACTION_DEFINITIONS` or `ALL_FACTION_DEFINITIONS` under `src/engine`, excluding enumeration consumers that mean *the authored roster* — content-eval chip declarations, sigil coverage — which keep the static map on purpose), passing `state.dynamicFactionDefinitions` where the caller holds state and relying on the overlay where it does not. A tripwire test pins the predicate over production modules only (`src/engine/**` minus `__tests__/`, where five fixtures import the static map on purpose): no engine module imports `FACTION_DEFINITIONS` from `faction-definitions` except `worldSeed.ts` (which mints from it) and the lookup module itself. `publishDynamicFactionDefinitions` already runs at game init as a projection of state, so Realm definitions written into `state.dynamicFactionDefinitions` during worldgen are in the overlay before the first tick with no new call.

After the sweep, **every consumer that skipped the generic factions admits a Realm through its definition**: `factionAmbitions` gives it ambitions (expansion becomes reachable — the `EXPANSION_PROSPERITY_THRESHOLD` comment at `factionAmbitions.ts:28-37` was written around this gap), `phaseFactionActions` lets it commission quests, `factionReputation` gives it a rank ladder, `armySpawning` lets it field armies through the ambition path, and the faction sheet renders it from its definition. That is the acted-on test answered for the Realm: it is not a node that exists; it is a faction that acts. The same sweep admits THR-1322's run-founded factions to the same systems; the executor reports that on THR-1322's thread as a finding, not a scope change.

**C. The political map is a projection of held towns.** No per-hex realm stamp is stored. `buildRealmProjection(graph, tiles)` is a pure function that assigns each hex to the Realm that controls the nearest Location (hex distance) within `REALM_FILL_RADIUS`; ties go to the Realm controlling more Locations; hexes farther than the radius from any held Location are **unclaimed** and draw no border — wilderness is real. The projection returns `{ realms: [{ id, name, seatHex, hexes }], hexRealmId: Map }` in the shape `BorderMesh` already consumes, so the mesh changes one import. **One owner: `SimulationRuntime`.** Both projections are runtime fields in the pattern the encounter cache and distance matrix already use — `runtime.realmProjection` / `runtime.realmProjectionBuiltAt`, `runtime.areaProjection` / `runtime.areaProjectionBuiltAt` — rebuilt by `ensureRealmProjection(runtime, state)` / `ensureAreaProjection(runtime, state)` when `…BuiltAt !== structuralCacheVersion`, exactly as `ensureEncounterCache` does at `simulationRuntime.ts:360`. **Participation is a Done-when, not an assumption.** On `main` the faction-sourced `controls` writers are worldgen (before any version matters), `battleAftermath.applyPowerVacuum` (removal; no `touchStructure` — the war phases are called as `phaseBattleTick(s)` with no runtime, `orchestrator.ts:3265`) and nothing else; a mortal's `claimControl` adds a `controlType: 'strategic'` edge beside the faction's and does not move the political map. § Engine E adds the one producer of *takes* and threads the runtime through `phaseBattleTick(state, runtime?)` → `tickSiege` → `resolveBattle` → `applyAftermath` in the optional-parameter shape `phaseEncounterProgressionV2(state, runtime?)` already uses (`orchestrator.ts:442`), so every faction-edge write bumps. **And a belt:** `ensureRealmProjection` also keeps a fingerprint of the faction-sourced `controls` edges (sorted `source→target` pairs, ~112 on medium — cheap) and rebuilds on a fingerprint change even when the version matches, emitting `realm_projection_rebuilt` with `reason: 'fingerprint'` — so a writer that forgets to bump is *visible in the trace*, never silently stale. `useSimulation` reads them through its `runtimeRef` for the map; the aftermath binder reads them through the runtime it already requires (`encounterAftermath.ts:932`); the CLI and the census scripts, which each construct a runtime, reach them the same way. The setter-less `useState(regionData)` is deleted and nothing about a projection lives in React state or at module scope. Map and `$realm` cannot disagree because there is one projection to read. **Consequence:** a Realm that takes a town (§ E) moves its border on the map the tick it happens; a Realm that loses its last Location has no territory and no border. The province tier (thin lines) is no longer drawn — REGN-06's own rule, *draw only what is political*, now reads *draw only what is held*; provinces remain worldgen scaffolding for culture and naming.

**D. Two sentinels and the Area's route.** `SCENE_SENTINEL_FIELDS` gains `$area` (the Area containing `$here`'s hex) and `$realm` (the Realm whose projection claims `$here`'s hex; **unbound** when no Realm claims it — a guild's town outside every Realm is not a Realm, and the sentinel never binds a non-Realm faction) — both resolve through `ensureAreaProjection` / `ensureRealmProjection` on the runtime the binder already holds, so a chip or a seed can say *the realm that holds this town* without a template knowing an id, and the headless slice-3 test needs nothing the CLI does not have. `WorldRefKind` gains `area`; `EncounterAftermathConceptRef.visualKind` gains `'area'`; `NavigationTarget` gains the Area arm, routed to the region detail page the detail-page resolvers already generate (`detailPageResolvers.ts:132, 639`); the Area row's `worldRef` becomes `'area'`. A Realm needs no new arm — it is a `faction` reference, and `faction` is already linked.

**E. Conquest — the one producer of *takes*.** On `main` no engine path ever writes a faction's `controls` edge after worldgen. A siege the attacker wins at `severity === 'total'` runs `applyPowerVacuum` (`battleAftermath.ts:249-262`), which deletes the defender's `controls` and `controlled_by` edges and leaves the town nobody's; the victor's faction is already known there (`member_of[0].target` of the victor army, `battleAftermath.ts:214`) and used only for sphere pressure. So a border could shrink and never grow, and *{Realm} takes {Location}* would be a chronicle template with no producer — the recorded-not-acted-on flaw one layer down. **Decision: the army that sacks a town takes it for its faction.** `applyPowerVacuum` becomes `applyConquestOrVacuum(state, settlementId, victorArmyId, runtime?)`: when the victor army belongs to a faction, each faction-sourced `controls` edge at the Location is retargeted to that faction with `graph.retargetEdgeSource` (`graph.ts:197`), stamped `establishedTick` and `via: 'conquest'`; when the Location has **no** faction-sourced `controls` edge (nobody's — an earlier vacuum, or wilds a Realm never held) the victor's faction gains a fresh one with `addEdge`, because the rule is *the army that sacks a town takes it*, not *takes it from someone*; when the edge is already the victor's (a double aftermath) nothing is written and the trace says so. There is no mirror edge to maintain: `controlled_by` is in neither `EdgeType` (`src/types/graph.ts`) nor `src/types/edgeSchema.ts`, its only writer is a test fixture (`siegeRegionalEncounters.test.ts:88`), and the four production reads of it (`battleAftermath.ts:263`, `battleResolution.ts:579`, `siegeResolution.ts:143`, `:657`) are dead paths that already fall back to `controls`. `touchStructure(runtime)` fires; the chronicle line *takes* / *loses* is emitted once, naming both factions. When the victor has no faction (a rebel host, a monster horde without a definition) the town falls into the vacuum exactly as today. A mortal's `controlType: 'strategic'` hold on the town is **not** touched by conquest — the hold is a commitment to the town, not to the faction, and what a hold inside a *new* Realm means is THR-1448's question. Severity is the existing `total`; `REALM_CONQUEST_SEVERITY` names it so a designer can let a `major` victory take a town too. This is the smallest producer that makes the projection's promise true, it reuses the siege pipeline that exists (`siegeResolution.ts`, armies already march on *the nearest hostile-held settlement*, `armySpawning.ts:122-125`), and it is presented decided-with-veto: *does a Realm keep what its army sacks?* — yes, or the map can only lose.

### Graph nodes / edges

**No new node type and no new edge type.** The Realm is an `actor · actorType: 'faction'` with `factionDefId`, `factionClass: 'realm'` and a dynamic definition; its territory is `controls` (existing); its seat is a `role: 'seat'` property on one `controls` edge (edge-internal data, not a relationship); its culture is `belongs_to` (existing). The Area is the existing `region` node with the existing `contains` edges. Factions gain one property (`factionClass`); Locations and hexes gain nothing — `tile.regionId` already exists and is now total. The ticket's edge checklist also named *claims* and *adjacency*: **no `claims` edge** — a Realm's want for a town it does not hold is an ambition (`factionAmbitions`, the expansion ambition this plan makes reachable), not a relationship, and an ambition already has its own record; **no `adjacent` edge between Areas** — Area adjacency is derived from the tile stamps by the projection (`hexAreaId` of neighbouring hexes) and never stored, the same rule the political border obeys.

### Tick phases

None new. Worldgen (once): the Area mint moves to the watershed detector; the Realm mint replaces the generic-faction mint; territory is written by province. Per tick: nothing — both projections are lazy, memoized on `structuralCacheVersion` (with the fingerprint belt), and rebuilt only when a faction's `controls` edge or a Location is added, moved or removed. Conquest runs inside the existing `battle_tick` inline phase when a siege resolves; it adds no phase and no per-tick work. The existing faction phases (ambitions, faction actions, reputation, succession) and the war phases start seeing Realms because, after the read-site sweep, they see definitions.

### Resolution logic

None. Ambitions, quests, encounters, reputation and war resolve as they do for any faction. The realm projection's tie-break (more Locations wins, then the lower faction id) is deterministic and named.

### PRNG callouts

The generic faction mint (`worldSeed.ts:1347-1366`) draws the faction count with `randomInRange` and then, per faction, a name index, `generateAxiologicalProfile(rng, cosmology)` and `generateDomainCapabilities(rng)`. The Realm mint keeps the two profile draws per Realm (a Realm is a faction and needs both) and drops the count and name draws; because the number of Realms is the number of domains (2–4) rather than the rolled 2–3, the draw count changes and **the downstream stream shifts on most seeds. This is a one-time, declared re-pin, not a stream-preserving shim.** Burning legacy draws to hold a stream that only existed because the old mint was there would be a permanent wart with no game meaning; NFP #3 is *same seed + same inputs = same outputs across runs*, which holds, not stability across code versions, which worldgen never promised. The executor re-takes the seed-42 tick-0 pin in slice 2's first commit and lists in that PR body every pinned artifact that changed (generated-world snapshot tests, any agent or place name recorded in docs or memory as *the seed-42 X*); from that commit the pin holds unchanged through slices 2 and 3. The projections draw nothing; conquest draws nothing (severity was rolled by the siege).

## Content pillar

### Encounter templates

None authored here. The realm family gets an entry in `FACTION_ENCOUNTER_META` so the existing faction encounter gates (`encounterFilterPipeline.ts:364-439`: join prerequisites, reputation with the counterparty, rank) admit realm-scoped content once the read-site sweep lets them resolve a Realm's definition; authoring realm encounters (a court summons, a border levy, a tithe demanded) is Encounter Factory work and is the natural first use of `$realm` — filed at handoff as a content ticket, not smuggled here. THR-1448 (a held town as a faction position) is the design that will spend most of this: a mortal's hold inside a Realm is a position in that Realm.

**Encounter spawn scoping — the ticket's third minimum consumer, decided.** Setting envelopes (THR-884, `src/data/settingClasses.ts`) are a *kind-of-place* vocabulary: eight classes expanded to location subtypes, enforced by the cache's existing `locationSubtypes` filter. An Area or a Realm is a *which-place* axis, and the two do not belong in one table. **Realm-scoped spawn needs no new axis:** realm content is faction content, and faction content already scopes through `FACTION_ENCOUNTER_META` and the gates above — a realm template registers where its meta says and is admitted by standing with the Realm, the same door a guild's `.join` uses. **Area-scoped spawn is N/A here, with the reason:** no authored template has ever wanted *only in the Iron Crags*; what content wants from terrain is *mountain versus marsh*, which is the Area's `featureType` — a ninth-class question for THR-884's vocabulary owner (a `featureType`-keyed setting class), not a filter this plan should invent on the side. Effects that want the Area get it from `effectScope('region')`, now real, and from `$area`. If a content ticket later asks for Area-keyed registration, the projection's `hexAreaId` is the one lookup it needs.

**Plot hooks — the ticket's other minimum consumer, N/A with the reason.** The plot-hook draw (THR-1147, `src/data/content-eval/plotHooks.ts`) is an *authoring-time* table the factory's brief rolls for a premise — pure, no graph, no runtime, no scope field, and by its own doctrine *"a starting point, never a contract"*. An Area- or Realm-scoped hook is therefore not a field but a *premise*: *the realm that holds this town demands a tithe* is a hook line the corpus can carry today, and what the finished encounter then needs at run time is `$realm`, which slice 3 provides. Hooks *about* realms and areas ride the realm-encounter content ticket filed at handoff; no scope axis is added to the draw.

**Movement or awareness flavour — the ticket's last consumer, N/A with the reason.** The ticket asked for it *where cheap*. Nothing cheap presented itself: a border-crossing cost touches the movement scorer and the hex-distance awareness rule (both load-bearing, `encounterAwareness.ts`), and a Realm border is a projection that moves, so any cost keyed on it needs its own design with its own fail-soft. Not taken here; if a later design wants *the road grows wary past the border*, `hexRealmId` on the runtime projection is the one lookup it needs, and the design is a ticket of its own.

### Prose tables

- `REALM_RANK_LADDER` — the court's words for a mortal's standing with a Realm: *stranger · subject · yeoman · sworn · thane · counsel*; the same slots the guild ladders use, so `factionReputation`'s rank changes and the `Respected+` gates read them unchanged. (*Freeholder* was the first draft's third rank and is rejected: *Freehold* is the UL's word for the `owns` edge and a court rank must not overload it.)
- Chronicle lines: *held by the Realm of {name}* on a Location; *{Realm} takes {Location} from {Realm}* when conquest retargets a faction's `controls` edge (§ Engine E — the one producer of *takes*); *{Realm} loses {Location}* when the vacuum removes it (a victor without a faction). Both `[IMPL]` on ship because both have a producer; the mortal seize path (`claimControl`) adds a hold beside the faction's edge and emits nothing here.
- Realm names come from `DOMAIN_NOUNS` × culture short name (`regionPolitical.ts:68-71, 124-141`) — moved to `src/data/realm-content.ts` with the ladder and the meta, so the three live together.

### Attachment content

N/A — a Realm holds Locations through `controls`, never through an attachment; the Freehold face (`artifact:holding`) belongs to a mortal's `owns` and this plan does not touch it.

### Data tables

The anchor catalog's gap rows flip: *Nation* becomes *Realm — a Faction with `factionClass: 'realm'`; anchor the faction* (🔗 linked); *Named area* becomes 🔗 linked with the `area` route. `scripts/anchor-catalog-sources.ts` and the tripwire test (`generate-anchor-catalog.test.ts:108-120`) update in the same PR. The world-object registry: the Faction kind gains `classes` (`realm · guild · order · cult · monster · founded`, discriminator `factionClass`); the Area row's `worldRef` becomes `'area'`; the Area note keeps its ratified sentence verbatim as the registry carries it (`world-objects.ts:188`) — *Geographic only: political territory is a faction's `controls` edges, never a second region kind.* — and gains one parenthetical after *faction's*: *(a Realm is such a faction, THR-1155)*. Canon: `Docs/canon/world-objects.md` (both rows), `Docs/canon/rulebook.md` (§ Rulebook impact), `Docs/canon/agents.md` (the Factions section names the realm class). UL: [THR-1453](https://linear.app/threadbare/issue/THR-1453) proposes **Realm** (alias *nation*); the Area entry's political sentence updates with it.

## UI pillar

*Screenshot tools: **Claude-in-Chrome** for the WebGL borders and labels (`BorderMesh`, `GeoBorderMesh`, `RegionLabelOverlay`, `CapitalMarkers` — Playwright cannot see the canvas; report the real viewport size, never claim 1920×1080); **Playwright** at 1920×1080 for the DOM lines (hex chronicle, location profile, faction sheet). Route: `?view=game&seeded&size=medium&nofog`.*

### Player-facing display

- **The map.** Red borders are the realm projection; dotted geographic borders and their labels are the area projection; capital markers sit on Realm seats. The thin province lines are gone. When a Location changes hands the red border moves on the next structural rebuild — the first time the political map has ever moved.
- **The hex chronicle** (`HexChronicle.tsx`, `HexDetailView.tsx`, `HexSidebar.tsx`) already says *Region: {name}*; the line becomes an Area reference with image (`EntityVisual`, kind `area` — the feature-type glyph), tooltip (`ui.area`) and link (the Area page), and gains a sibling *Held by the {Realm}* line rendered as a faction reference (image, tooltip `ui.realm`, link to the faction sheet), or *Unclaimed* in words when no Realm claims the hex.
- **The location profile** gains the same *held by* line where it shows the controlling faction today (the `controls` read sites already render it for guild-held towns; a Realm now appears there by construction).
- **The faction sheet** renders a Realm from its dynamic definition: name, seat, culture, court ladder, leader, and the towns it holds in the sheet's existing *What They Control* section (`FactionSheet.tsx`, `summary.controlledLocations`), which already reads `controls` and needs no new word. No numerals (Law 13): if a count is ever worded it is *a dozen towns*, never twelve. **Never *holdings* on a Realm's surfaces** — see § Notes for the executor on the three words.

**The UI Laws this surface engages (THR-1007; they bind by default):** Law 1 (an Area and a Realm named to the player carry image, tooltip and link — this is the ticket's own visibility-parity clause); Laws 13/14 (no hex counts, no province ids; *a dozen towns*, *unclaimed*); Law 17 (tooltip ids `ui.area`, `ui.realm` from the registry); Law 21 (the Area link routes to the region page; the Realm link to the faction sheet; an Area with no page renders as text, never a dead link); Laws 26/27 (`EntityVisual`, `Tooltip`, the existing chronicle row primitives; no new component); Law 33 (no layout change); Law 37 (the map, the chronicle and the sheet name the same Realm by the same word); Law 56 (a *takes / loses* chip anchors the Location and the Realm the engine actually wrote).

### Event notifications

`{Realm} takes {Location}` / `{Realm} loses {Location}` as chronicle-tier events on a `controls` source change (significance `REALM_TERRITORY_EVENT_SIGNIFICANCE`); no toast — the map moving is the notification.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getRealmProjection()` → `{ realms: [{ id, name, seatLocationId, hexCount, heldLocationIds }], unclaimedHexes }`; `window.__DEBUG.getAreaProjection()` → `{ areas: [{ id, name, featureType, hexCount }], unstampedHexes }` — the second is the coverage assertion.
- **One write lever, so a moved border is constructed, never waited for:** `window.__DEBUG.conquerLocation(locationRef, factionRef)` resolves both refs by id or name (the bridge's existing match semantics), routes through `applyConquestOrVacuum` with the runtime so `touchStructure`, `realm_territory_change` and the *takes* line all fire exactly as a real siege would, and returns `{ locationId, fromFactionId, toFactionId, structuralCacheVersion }`. Unknown ref → `console.warn` once and `null`, no throw. The browser Done-when calls it, then `__DEBUG.tick(1)`, then captures.
- The strategic debug tab's faction list shows `factionClass`.
- Traces below in the trace viewer.

### Visual presence (HexMapV2)

The three existing layers keep their geometry code and change their data source: `createBorderMesh(realmProjection, tiles, cols)`, `createGeoBorderMesh(areaProjection, …)`, `createCapitalMarkers(realmProjection)`, `buildRegionLabels(areaProjection, realmProjection)` (label tiers `realm · area · river`; `province` retires). The label overlay's collision rules are untouched. Blast radius: one importer each.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `engine/worldSeed.ts` (Area mint via watershed; Realm mint with dynamic definition; territory by province) | worldgen | — | `dynamicFactionDefinitions` (existing), graph nodes/edges, `tile.regionId` (total) | `area_coverage`, `realm_founded` | `objects` in the CLI; `getAreaProjection` |
| `engine/realmProjection.ts` (new, pure builder) + `simulationRuntime.ts` (`ensureRealmProjection`, `realmProjection` / `realmProjectionBuiltAt` fields) | lazy on `structuralCacheVersion`, owner `SimulationRuntime`; read by the map (`useSimulation` runtimeRef) and the aftermath binder | `BorderMesh`, `CapitalMarkers`, `RegionLabelOverlay` | reads `controls`, tiles; no `GameState` field | `realm_projection_rebuilt` | `getRealmProjection` |
| `engine/areaProjection.ts` (new, pure builder) + `simulationRuntime.ts` (`ensureAreaProjection`, `areaProjection` / `areaProjectionBuiltAt`) | lazy on `structuralCacheVersion`, owner `SimulationRuntime` | `GeoBorderMesh`, `RegionLabelOverlay`; `HexChronicle` keeps `getHexRegionData` | reads `tile.regionId`, `region` nodes | — | `getAreaProjection` |
| `engine/battleAftermath.ts` (`applyConquestOrVacuum`) via `battleResolution` / `siegeResolution`, `runtime?` threaded from `orchestrator.ts` `battle_tick` | existing `battle_tick` inline phase (`orchestrator.ts:3265`); no new phase | chronicle (*takes / loses*); the map on the next read | none — the `controls` edge is the state | `realm_territory_change`, `strategic_world_change` | `getRealmProjection` shows the moved hexes; the war readout names the victor |
| `engine/effectScope.ts` (`'region'` real) | wherever effects resolve | — | reads `tile.regionId` | existing scope traces | — |
| `engine/encounterAftermath.ts` (`$area`, `$realm`) | aftermath binding | — | — | existing binder traces | — |
| `data/realm-content.ts` (new: names, ladder, meta) | — | `FactionSheet` | `dynamicFactionDefinitions` | — | `?view=codex` factions |
| `types/worldRef.ts`, `types/unifiedAction.ts` (`area` arm / `visualKind`) | — | chips, `EntityVisual`, `NavigationTarget` | — | — | anchor catalog |
| `components/HexMapV2/HexMapV2.tsx`, `hooks/useSimulation.ts` (reads the runtime's projections in place of `regionData`) | — | the three layers | — | — | — |
| `components/Game/HexChronicle.tsx`, `HexDetailView.tsx`, `HexSidebar.tsx`, `LocationProfile`, `FactionSheet.tsx` | — | the DOM lines | — | — | — |

Prose pipeline: the chronicle lines pass through `enrichProse()` as faction lines do. Player controls: none new — clicking the Area or Realm reference opens its page.

## Constants table

New `src/data/realm-content.ts` and `src/data/area-constants.ts` unless noted (NFP #1):

| Constant | Default | Purpose |
|----------|---------|---------|
| `REALM_FILL_RADIUS` | `3` | hexes from a held Location a Realm's border reaches; beyond it the hex is unclaimed |
| `REALM_TIEBREAK` | `'more_held_locations'` | which Realm a hex equidistant from two held Locations joins (then lower faction id) |
| `REALM_RANK_LADDER` | `['stranger','subject','yeoman','sworn','thane','counsel']` | the court's words; same slot count as the guild ladders; no rank word may be a UL headword for another thing |
| `REALM_TERRITORY_EVENT_SIGNIFICANCE` | `0.7` | the *takes / loses* chronicle line |
| `REALM_CONQUEST_SEVERITY` | `'total'` | the siege-victory severity at which the victor's faction takes the town (today's vacuum threshold); `'major'` lets a lesser victory take it |
| `REALM_DEFINITION_ID_PREFIX` | `'realm.'` | `factionDefId` shape for minted Realms |
| `AREA_DETECTOR` | `'watershed'` | the one detector; the flood-fill deletes when nothing calls it |
| `AREA_MIN_HEXES` (existing in the detector) | unchanged | minimum cluster size |
| `SCOPE_REGION_MAX_HEXES` (existing) | unchanged | cap on the now-real Area scope |
| `FACTION_CLASSES` | `['realm','guild','order','cult','monster','founded']` | the Faction kind's classes (registry) |

Retired: `FACTION_COUNT`, `FACTION_NAMES` (`worldSeed.ts:87, 166-169`), `WORLDGEN_TERRITORY_MODE` (territory by province is the only mode).

## Tracing

Register at all four sites in `src/types/trace.ts` (`emitTrace`'s `Omit` collapses unions):

```ts
// AreaCoverageTrace — once at worldgen
interface AreaCoverageTrace extends TraceBase {
  category: 'area_coverage';
  areas: number;
  hexes: number;
  unstamped: number;   // must be 0; the coverage test asserts it
}

// RealmFoundedTrace — once per Realm at worldgen
interface RealmFoundedTrace extends TraceBase {
  category: 'realm_founded';
  realmId: string;
  cultureId: string;
  seatLocationId: string | null;
  heldLocations: number;   // `controls` targets; never `holdings` — that word is the `owns` edge
}

// RealmProjectionTrace — once per rebuild (not per tick)
interface RealmProjectionTrace extends TraceBase {
  category: 'realm_projection_rebuilt';
  reason: 'version' | 'fingerprint';   // 'fingerprint' = a controls writer changed edges without touchStructure — a bug made visible
  realms: number;
  claimedHexes: number;
  unclaimedHexes: number;
  structuralCacheVersion: number;
}

// RealmTerritoryTrace — once per conquest or vacuum at a Location
interface RealmTerritoryTrace extends TraceBase {
  category: 'realm_territory_change';
  locationId: string;
  fromFactionId: string | null;
  toFactionId: string | null;          // null = vacuum (victor had no faction)
  via: 'conquest' | 'vacuum';
  victorArmyId: string;
}
```

The chronicle-tier *takes / loses* event is emitted beside `realm_territory_change`; four categories, four registration sites each.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Watershed detector leaves a hex unstamped | nearest-cluster fill at worldgen; `area_coverage.unstamped` counts it; the test fails so it never ships silently |
| A domain has no settlement on its capital hex | seat = the domain's largest held settlement; `seatLocationId: null` only if it holds none, and then no capital marker |
| A culture seats no domain | no Realm minted for it; the census reports Realms < cultures |
| `dynamicFactionDefinitions` missing a Realm's id (a world saved before this) | `faction-definition-lookup` falls back as it does for run-founded factions today; the Realm renders by node name and holds its territory |
| A hex is equidistant from two Realms' Locations | `REALM_TIEBREAK`, then lower faction id — deterministic |
| A Realm loses every Location | no hexes claimed, no border, no marker; the faction node survives (it may reclaim); the sheet says *holds nothing* |
| Victor army has no faction (`member_of` absent) | the town falls into the vacuum exactly as `main` does today; `realm_territory_change.via = 'vacuum'` |
| Double aftermath — the faction `controls` edge is already the victor's, or was removed since the siege began | `retargetEdgeSource` no-ops on a missing edge by contract (`graph.ts:195-196`) and conquest never relies on a throw: it reads the edge first — already the victor's → nothing written, `realm_territory_change` with `via: 'conquest'` and `fromFactionId === toFactionId`; no faction edge at all → the victor's faction gains a fresh one (the town was nobody's) |
| A faction-sourced `controls` writer does not call `touchStructure` | the fingerprint belt rebuilds the projection on the next `ensure` and traces `reason: 'fingerprint'`; the map is right one read late and the omission is named |
| `runtime` absent at `applyAftermath` (a headless caller that did not thread it) | no bump; the belt covers it as above |
| `__DEBUG.conquerLocation` given an unknown Location or faction ref, or a faction that is not a Realm | `console.warn` once, returns `null`, nothing written; a non-Realm faction is refused so the lever cannot construct a state conquest never would |
| `$realm` at an unclaimed hex | unbound — the effect skips as unbound sentinels do today; the sentinel binds a Realm or nothing, never the guild or order that happens to control the Location (a Realm-held town's own hex is always claimed, so "unclaimed" means "no Realm here") |
| `$area` on a hex with no `regionId` (cannot happen post-coverage; saved worlds) | unbound; effect skips |
| `ensureRealmProjection` / `ensureAreaProjection` throws | the `ensure` catches, traces the error and leaves the previous projection on the runtime (`…BuiltAt` unchanged, so the next structural bump retries); on the map path the layer draws the last good projection; on the binder path `$realm` / `$area` bind from the stale projection or, if none has ever built, stay unbound and the effect skips as unbound sentinels do today. The tick never throws |
| Area page missing for a region id | the Area reference renders as text (Law 21) |

## Interface impact

Rows in `Docs/canon/interface-map.generated.md`; register changes in `scripts/interface-contracts.ts` in the same change.

| Contract | Action | Producer → Consumer |
|----------|--------|---------------------|
| `world-object-registry` | **extend** — Faction gains classes; Area gains `worldRef: 'area'` | registry → catalogue, census, guard |
| `undertaking-object-types` | **preserve** — Area and Faction rows unchanged as objects | — |
| `holdings-single-writer-owns-edge` | **preserve** — `owns` untouched; `controls` gains the `role: 'seat'` property on one edge per Realm | — |
| `faction-ambitions-drive-action` (🟢) | **extend** — Realms enter through their definitions once the engine read sites resolve dynamic definitions | `worldSeed` (definition) → `faction-definition-lookup` → `factionAmbitions` |
| Faction definition resolution (engine consumers → lookup) | **add** — the sweep in § Engine B; the tripwire test asserts no engine module reads the static map by id | `state.dynamicFactionDefinitions` + authored tables → `getFactionDefinition` → every `factionDefId` consumer |
| Realm-held Locations → political map | **add** | `controls` edges → `realmProjection` → `BorderMesh` / `CapitalMarkers` / labels |
| Siege victory → Realm territory (conquest) | **add** — the one runtime producer of a faction `controls` edge | `battleAftermath.applyConquestOrVacuum` → `controls` retarget + `touchStructure` → `realmProjection`, chronicle |
| Area point read (`getHexRegionData`) → chronicle | **preserve** — the partition projection composes over the same nodes and stamps | `region` nodes + `belongs_to` → `hexRegion.ts` → `useHexZoomData` → `HexChronicle` / `HexSidebar` |
| Area stamps + nodes → geographic map | **add** | `tile.regionId` + `region` nodes → `areaProjection` → `GeoBorderMesh` / labels / chronicle |
| Renderer-private region pipeline (`hexGrid` → `RegionData` → meshes) | **retire** — with the tests that asserted it (`regionDetection` watershed tests move to the worldgen mint; `BorderMesh.test` reads a projection fixture) | — |
| Scene sentinels (`$area`, `$realm`) | **extend** the row THR-1446 registers | binder → chips, seeds |
| `economy-provisions-armies` | **preserve** — a Realm's armies eat from the towns it holds as any faction's do | — |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/gameState.ts` | 526 | **not edited** — no new field; the projections live on `SimulationRuntime`; `dynamicFactionDefinitions` already exists |
| `src/engine/simulationRuntime.ts` | 184 | four fields and two `ensure` functions in the existing cache pattern; additive |
| `src/engine/orchestrator.ts`, `battleResolution.ts`, `siegeResolution.ts`, `battleAftermath.ts` | war path | optional `runtime?` threaded through four signatures (the `phaseEncounterProgressionV2` shape); `applyPowerVacuum` → `applyConquestOrVacuum`; every existing caller compiles unchanged |
| `src/types/graph.ts` | 203 | **not edited** — no new node or edge type |
| `src/types/unifiedAction.ts` | 464 | one member added to `EncounterAftermathConceptRef.visualKind` (`'area'`); the ratchet covers it |
| `src/types/worldRef.ts` | ~30 | `area` member; `assertKindUnionCoverage` and the anchor catalog fail by name until every projection union carries it — that is the gate working |
| `src/types/trace.ts` | 120 | four categories at the four registration sites |
| `src/engine/worldSeed.ts` | ~40 | the Area and Realm mints change; the rng draw count changes with them, so the seed-42 tick-0 pin is re-taken once in slice 2's first commit with the changed artifacts listed (§ PRNG callouts) |
| `src/engine/regionTypes.ts` | 10 (6 renderer) | `RegionData` shrinks to the projection shapes; each consumer changes one import |
| Engine faction-definition read sites (12 files, 21 sites measured) | — | mechanical: `FACTION_DEFINITIONS.get(id)` → `getFactionDefinition(id, state.dynamicFactionDefinitions)`; behaviour-neutral for authored ids (the lookup checks the authored tables second); the tripwire keeps the sweep total |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves *systemic emergence* (`03-design-tensions.md` #2): a Realm that acts — ambitions, quests, armies — makes the world produce situations the player did not author, and a border that moves when a town falls is emergence the player can *see*. It keeps the god at a remove (`02-non-negotiables.md` #1): no player control over a Realm is added; the player nudges the mortals whose deeds move the border. It honours *prose never numbers* (#3): held towns render as words, hexes never as counts. The north-star's *weight of threads* gains a new kind of thing to care about: the realm your First's town belongs to.
- [x] No Vision edit required. The taste profile's *graph edges, not property-bag relationships* is respected — territory, seat and culture are edges; `factionClass` is data internal to the faction.

## Rulebook impact

- [x] This plan **adds a rule of play** to `Docs/canon/rulebook.md` § The World at Work, tagged `[IMPL]` on ship: *The map's realms are the factions that hold the ground. A Realm holds the towns it controls; its border is drawn from those towns and moves when one changes hands; land too far from any held town is nobody's. A town an army sacks passes to that army's Realm; a town sacked by a host with no Realm falls to nobody. A Realm acts as any faction does — it wants, it commissions, it fields armies, it keeps a court a mortal can rise in.* Areas are named in the same section as the map's geography, never political.
- [x] `Docs/canon/rulebook.md` is updated in the same PR as the code, and `Docs/canon/rulebook-quick-reference.md` gains one sentence under *What the World Is*.

> Brainstorm companion: `Docs/plans/2026-09-10-thr-1155-realms-and-areas-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | ten constants in the table (eight new, two existing reused); the fill radius, the conquest severity and the ladder are the three a designer will touch |
| 2. Inspectability | PASS | four traces (the projection trace says *why* it rebuilt); two `__DEBUG` readers with the coverage and unclaimed counts and one write lever (`conquerLocation`) so a moved border can be constructed on demand; the CLI `objects` census shows Realms as a Faction class |
| 3. Determinism | PASS with note | the projections and conquest are pure over graph and tiles and draw nothing; the Realm mint changes worldgen's draw count, so the seed-42 pin is re-taken once, declared, with its changed artifacts listed — same seed + same inputs = same outputs holds across runs from that commit |
| 4. Fail-soft | PASS | fifteen rows; coverage is asserted at worldgen; the projections rebuild lazily on the runtime behind an `ensure` that catches; conquest is fail-soft on every branch (no faction → vacuum; edge missing → `retargetEdgeSource` no-ops by contract and the victor gains a fresh edge; edge already the victor's → nothing written, traced) |
| 5. Narrative over mechanical perfection | PASS with note | Voronoi-by-held-towns gives blunter borders than the watershed provinces did; accepted because a border that moves when a town falls is a story, and a pretty one that never moves is a picture |
| 6. Additive over destructive | PASS with note | no new node or edge type; the renderer-private pipeline, the round-robin territory, `FACTION_NAMES`, `FACTION_COUNT`, `WORLDGEN_TERRITORY_MODE`, the flood-fill detector and the province border tier are removed — each is either the private pipeline the ruling names or scaffolding the Realm replaces; conquest *narrows* the vacuum (a faction-less victor still gets today's behaviour) and the runtime threading is optional-parameter, so no caller changes |
| 7. Performance budget | PASS | projections are O(hexes × held Locations) at structural rebuild only (768 × ~112 on medium); nothing per tick |

## Done when

Three ordered slices, one ticket; each slice merges on its own PR with `Fixes THR-1155` only on the last.

**Slice 1 — one geography.**
- [ ] `worldSeed` mints Areas from the watershed detector; `area_coverage.unstamped === 0` on seeds 42, 99, 7 at all four map sizes (a generated-world test, never a fixture); the flood-fill detector and `gameInit`'s index join are deleted; `regionDetection.test` moves to the mint
- [ ] `areaProjection` feeds `GeoBorderMesh`, the labels and the chronicle; `HexMapV2` no longer receives `RegionData.geographicRegions`; the setter-less `regionData` state is gone
- [ ] `effectScope('region')` returns Area membership, tested against a fixture where the radius fake and the membership differ
- [ ] `area` in `WorldRefKind` and `visualKind`; `NavigationTarget` routes to the region page; the Area row's `worldRef` is `'area'`; the anchor catalog's *Named area* row reads 🔗 linked; the tripwire test updated

**Slice 2 — Realms.**
- [ ] One Realm per domain minted with a dynamic definition, `factionClass: 'realm'`, a seat edge and a culture edge; `FACTION_COUNT` / `FACTION_NAMES` / the round-robin gone; `retargetTerritoryByProvince` is the unconditional territory writer; the seed-42 tick-0 pin is re-taken once in this slice's first commit with every changed pinned artifact listed in the PR body, and holds unchanged for the rest of slice 2 and all of slice 3
- [ ] Every engine by-id read of `FACTION_DEFINITIONS` / `ALL_FACTION_DEFINITIONS` resolves through `getFactionDefinition` (the § Engine B predicate); a tripwire test asserts the predicate over `src/engine`; a generated-world test founds a faction through THR-1322's path and asserts it now receives an ambition — the pre-existing gap, closed as evidence
- [ ] `census:seeded-world` (THR-1437's instrument) reports Realms = domains and every Location with a hex inside a domain controlled by its Realm
- [ ] `realmProjection` feeds `BorderMesh`, `CapitalMarkers` and the realm label tier; the province tier is not drawn; a generated-world test builds a siege on a Realm-held Location and resolves it `attacker_victory` at `REALM_CONQUEST_SEVERITY` for an army of a second Realm, then asserts: the `controls` edge's source is the victor faction with `via: 'conquest'`, `structuralCacheVersion` bumped, the hex moved in the projection with `reason: 'version'`, `realm_territory_change` traced, the *takes* chronicle line names both Realms; a sibling test with a faction-less victor asserts the vacuum and `via: 'vacuum'` (never `transferHolding`, which retargets `owns`)
- [ ] A participation test enumerates every production writer of a faction-sourced `controls` edge (predicate: `addEdge`/`retargetEdgeSource`/`removeEdge` on type `controls` whose source is a faction, under `src/engine`, excluding worldgen) and asserts each calls `touchStructure` or is covered by a test that drives it and asserts `reason: 'version'`; a second test edits a `controls` edge with no bump and asserts the belt rebuilds with `reason: 'fingerprint'`
- [ ] On a 150-tick CLI run of seed 42, at least one Realm holds an ambition and at least one commissions a quest or fields an army — the acted-on test, reported as counts on the ticket; the number of `realm_territory_change` traces on that run is *reported*, not gated (a conquest in 150 ticks depends on a march and a siege the seed may not produce — the constructed siege test above is the gate)
- [ ] The faction sheet renders a Realm; the hex chronicle and location profile carry the *held by* line with image, tooltip and link; `Unclaimed` renders in words

**Slice 3 — consumers and words.**
- [ ] `$area` and `$realm` bind in the aftermath binder; a test wires a chip on each and the effect lands in a trace
- [ ] `REALM_RANK_LADDER` reads through `factionReputation` for a Realm; `FACTION_ENCOUNTER_META` has the realm entry; the *takes / loses* chronicle line fires on a seize
- [ ] Registry, canon (`world-objects.md`, `agents.md`, `rulebook.md`, quick reference), the wiki (a *Realms and Areas* section on `world-map-reference`, whose `sources` gain the two projection modules), the UL entries per THR-1453 once approved, and the interface-map rows
- [ ] Browser-verify per the UI pillar: Claude-in-Chrome capture of the border *before*, then after `await window.__DEBUG.conquerLocation(<a Realm-held town>, <the other Realm>)` followed by `window.__DEBUG.tick(1)`, with honest dimensions — the border must visibly move between the two captures; Playwright at 1920×1080 of the chronicle and sheet lines; console; `__DEBUG.getRealmProjection()` / `getAreaProjection()` assertions; the Laws line citing 1, 13/14, 17, 21, 26/27, 33, 37, 56
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`; 30-tick CLI smoke; `npm run test:heavy` locally; `npm run generate-world-objects:check`, `generate-anchor-catalog`, `generate-interface-map` green
- [ ] Closing commit body and PR body include `Fixes THR-1155`

## Kill criteria

- The watershed partition cannot be made total without absurd clusters → keep the nearest-cluster fill and cap cluster count; never ship a hex with no Area.
- Realm borders read as noise on the census seeds (more than `REALM_FILL_RADIUS` worth of interleaving between two Realms) → the fill radius halves before any smoothing is invented; a smoothing pass is a new design.
- A Realm's ambitions dominate the faction board (expansion every window) → `EXPANSION_PROSPERITY_THRESHOLD` was tuned for a world without Realms; retune it with the measured Realm prosperity and record the number — never gate Realms back out.
- The seed-42 tick-0 pin fails *after* slice 2's declared re-pin → the rng stream shifted again; fix the draw order. One re-pin, in the open, with its changed artifacts listed; never a second one silently.

## Coordination block

**Suggested model:** opus — worldgen surgery with an rng pin, two projections, a type-union extension gated by the catalog, three map layers re-pointed, and a rulebook sentence; three slices.
**Parallel-safe with:** [THR-1287](https://linear.app/threadbare/issue/THR-1287) (strategic lifecycle; touches `controls` only for mortal stances, which this plan preserves), [THR-1195](https://linear.app/threadbare/issue/THR-1195), [THR-1114](https://linear.app/threadbare/issue/THR-1114), [THR-1424](https://linear.app/threadbare/issue/THR-1424) / [THR-1426](https://linear.app/threadbare/issue/THR-1426) (components this plan does not touch), [THR-1380](https://linear.app/threadbare/issue/THR-1380) (docs).
**Mutex with:** any ticket editing `src/engine/battleAftermath.ts`, `battleResolution.ts` or `siegeResolution.ts` (none queued on 2026-09-10; re-check at pickup — the conquest producer and the runtime threading touch all three); [THR-1315](https://linear.app/threadbare/issue/THR-1315) (both edit `src/types/worldRef.ts` and `scripts/anchor-catalog-sources.ts` — either order, rebase the loser); any ticket editing `src/engine/worldSeed.ts`, `src/engine/seedLivingWorld.ts`, `src/engine/regionDetection.ts`, `src/components/HexMapV2/HexMapV2.tsx` or the three mesh files (none queued); [THR-1448](https://linear.app/threadbare/issue/THR-1448) is sequenced after this (a position inside a Realm needs the Realm).
**Landed dependency:** [THR-1446](https://linear.app/threadbare/issue/THR-1446) (`$here`) is Done — PR #1875 merged 2026-09-10 09:52Z — so `SCENE_SENTINEL_FIELDS` on `main` already carries `$here`; slice 3 adds `$area` / `$realm` beside it. The design worktree predates that merge; rebase before reading `encounterAftermath.ts`.
**Files to touch:** `src/engine/worldSeed.ts`, `src/engine/seedLivingWorld.ts`, `src/engine/hexGrid.ts`, `src/engine/gameInit.ts`, `src/engine/regionDetection.ts`, `src/engine/regionTypes.ts`, `src/engine/regionPolitical.ts` (names → `realm-content.ts`), `src/engine/regionLabels.ts`, `src/engine/hexRegion.ts` (untouched in behaviour; cited so nobody replaces it), `src/engine/realmProjection.ts` (new), `src/engine/areaProjection.ts` (new), `src/engine/simulationRuntime.ts` (the four projection fields, two `ensure` functions and the fingerprint belt), `src/engine/battleAftermath.ts` (`applyConquestOrVacuum`), `src/engine/battleResolution.ts`, `src/engine/siegeResolution.ts`, `src/engine/orchestrator.ts` (thread `runtime?` through `phaseBattleTick` → `tickSiege` → `resolveBattle` → `applyAftermath`), `src/engine/effectScope.ts`, `src/engine/encounterAftermath.ts` (slice 3), **the faction-definition read-site sweep** (predicate in § Engine B; measured members: `src/engine/factionReputation.ts`, `factionAmbitions.ts`, `encounterFilterPipeline.ts`, `factionQuestGeneration.ts`, `factionOutcome.ts`, `factionMembership.ts`, `factionMemberWork.ts`, `factionRankBonus.ts`, `phaseReputationTraits.ts`, `socialEncounterGeneration.ts`, `agentDetail.ts`, `npcSeeding.ts` — re-grep at pickup, the predicate rules), `src/data/faction-definition-lookup.ts` (no behaviour change; the tripwire test lives beside it), `src/data/realm-content.ts` (new), `src/data/area-constants.ts` (new), `src/data/world-objects.ts`, `src/data/faction-encounter-meta*` (realm entry), `src/types/worldRef.ts`, `src/types/unifiedAction.ts` (`visualKind`), `src/types/notification.ts` (`NavigationTarget` area arm), `src/types/trace.ts`, `src/components/HexMapV2/HexMapV2.tsx`, `src/components/HexMapV2/scene/BorderMesh.ts`, `GeoBorderMesh.ts`, `CapitalMarkers.ts`, `src/components/HexMapV2/overlay/RegionLabelOverlay.tsx`, `src/components/Game/hooks/useSimulation.ts`, `src/components/Game/hooks/useHexZoomData.ts` (gains the Realm read beside `getHexRegionData`), `src/components/Game/HexChronicle.tsx`, `HexDetailView.tsx`, `HexSidebar.tsx`, the location profile component, `FactionSheet.tsx`, `src/debug-bridge.ts` + `.d.ts`, `scripts/anchor-catalog-sources.ts`, `scripts/__tests__/generate-anchor-catalog.test.ts`, `scripts/interface-contracts.ts`, `scripts/undertaking-grid-dispositions.ts` (Faction classes need no new cells), `Docs/canon/world-objects.md`, `Docs/canon/agents.md`, `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `public/wiki-manifest.json` + `world-map-reference.html`, tests: `worldSeed.areas.test.ts`, `worldSeed.realms.test.ts` (rng pin), `realmProjection.test.ts`, `areaProjection.test.ts`, `effectScope.region.test.ts`, `faction-definition-lookup.readsites.test.ts` (the tripwire), the mesh tests on projection fixtures, the census script assertion.

## Notes for the executor

- **No new node type, no new edge type, no new `GameState` field.** If the design seems to need one, stop: the Realm is a Faction with a definition; the Area is the `region` node that exists; the political map is a projection. THR-1394's Area note is the ruling, and this plan is written inside it.
- **Do not store a per-hex realm stamp.** The border is derived from `controls` so that seizing a town moves it. A stored stamp is a second truth and the bug this ticket exists to remove.
- **Conquest is the only runtime writer of a faction's `controls` edge, and it must bump.** `applyConquestOrVacuum` retargets the faction's `controls` edge with `retargetEdgeSource`, never delete-and-add (the edge id is the audit trail), adds a fresh edge only when the town had no faction edge at all, and calls `touchStructure(runtime)` when it has one. **Do not add `'controlled_by'` to `EdgeType`.** It is not a registered edge; the `applyPowerVacuum` code that removes it and the three siege reads are fixture-only paths. In slice 2, sweep the four reads (`battleAftermath.ts:263`, `battleResolution.ts:579`, `siegeResolution.ts:143`, `:657`) onto `getIncomingEdges(settlementId, 'controls')[0]?.source`, delete the fixture's write, and say so in the PR body — registering the type to make the old code "work" would be a new edge type without a design, the exact thing the load-bearing rule forbids. Thread `runtime?` through the four war signatures as an optional parameter so every existing caller and test compiles; the belt covers a caller that does not pass it, and its `reason: 'fingerprint'` trace in a test run is a defect, not a feature. Do not touch a mortal's `controlType: 'strategic'` edge in conquest — THR-1448 owns that question.
- **The projections are runtime fields, not React state and not module scope.** `ensureRealmProjection` / `ensureAreaProjection` on `SimulationRuntime`, in the `ensureEncounterCache` pattern (`simulationRuntime.ts:360`). The map reads them through `useSimulation`'s runtime ref; the binder reads them through the runtime it is handed; the CLI constructs a runtime and gets them for free. If the map and `$realm` can ever disagree, you have two projections and one is wrong.
- **The rng pin is re-taken once, in the open.** The Realm mint drops the count and name draws and mints per domain, so the stream after the mint shifts on most seeds; do not write a shim that burns legacy draws to hide that. Slice 2's first commit re-takes the seed-42 tick-0 snapshot and its PR body lists every pinned artifact that changed; every later commit must hold that pin. If you find a second shift later in the slice, the draw order moved — fix it, do not re-pin again.
- **Dynamic definitions are the path, and the read-site sweep is not optional.** A Realm's definition is minted at worldgen into `state.dynamicFactionDefinitions`; `getFactionDefinition` resolves it. But the engine's consumers read the static map today (§ Engine B), so without the sweep a Realm is a generic faction with a nicer name and the acted-on Done-when fails. Do the sweep first in slice 2, land the tripwire, then mint. Do not add realms to the static `FACTION_DEFINITIONS` catalogue. Note `encounterFilterPipeline.ts:367` fails *open* on a missing definition (no `joinPrerequisites` means no gate), so a missed site there hides rather than breaks — the tripwire is what catches it.
- **Three words, three edges.** *Holds* on a Realm's surfaces is plain prose for the `controls` relationship — *the Realm holds Ashford* — pending UL arbitration: THR-1449 proposes *hold* narrowly as a mortal's committed stance (`controls` **with** a `StrategicControlState` clock), and a Realm's edge has no clock. This plan does not widen THR-1449; it records on THR-1453 that Realm needs the same verb for a clockless faction edge, with a cross-note on THR-1449, so the arbitration settles one word for both senses or names two. Until it does, *holds* is prose and no code identifier says `hold`. *Freehold* is the `owns` edge (engine literal `'holding'`, THR-1314) and belongs to a mortal's sheet. *Holdings* as a noun is that second thing in the UL, so a Realm never has *holdings* on any player surface, trace field or debug shape — it has *the towns it holds*, `heldLocations`, `heldLocationIds`. The faction sheet's *What They Control* section is already worded correctly; do not rename it.
- **`getHexRegionData` stays.** It is the Area's point reader (name, feature type, hex count, historical culture) and the chronicle's source; the projection is the partition view for the map. If you find yourself writing a third way to ask what Area a hex is in, stop — `tile.regionId` → `getHexRegionData` is the answer, and `hexAreaId` in the projection is the same answer batched.
- **Provinces are scaffolding.** They keep assigning culture and naming domains at worldgen; they are not drawn and not objects. If a later design wants baronies, it is a new decision with its own ruling.
- **The word is Realm, alias nation, pending [THR-1453](https://linear.app/threadbare/issue/THR-1453).** Use it on every surface; never *kingdom*, *domain*, *province* on a player surface except inside a Realm's own name.
- **THR-1446 has landed.** `$here` is on `main` (PR #1875); slice 3's `$area` / `$realm` sit beside it in `SCENE_SENTINEL_FIELDS`. Work from a tree that has it.
- **The anchor-catalog tripwire is meant to fire.** `generate-anchor-catalog.test.ts:108-120` asserts today's gap; update it to assert the flipped rows, not to keep the gap.
- **Wiki:** `world-map-reference` has no region or border coverage; add the section and the two projection modules to its `sources` in the same PR, and `run-lifecycle-reference` fires on `worldSeed.ts` — update its worldgen paragraph.
- **Realm encounters are content, filed separately** at handoff; THR-1448 will spend `$realm` first.

## Intent-judge verdict

**Allow** — run 7 of 7, 2026-09-10 (fable, cold context). Impact class confirmed Reversible at the ceiling of the class; no new node or edge type, no CLAUDE.md edit, canon edited by row. Dimensions 1–3 and 5–11 PASS; dimension 4 carried one stale phrase (the NFP #4 note described a *retarget throws* branch that `graph.ts:195` rules out), fixed before the PR with no re-judge required. Both creative choices — the headword **Realm** over *nation*, and **a Realm keeps the town its army sacks** — are routed decided-with-veto per the 2026-08-12 delegation rule.

The six Revise rounds before it, each verified against source rather than the author's notes, and what each changed: (1) `getHexRegionData` disposition, setting-envelope scoping, *holdings* vs the Holding kind — and, found on the way, that THR-1322's `getFactionDefinition` has no engine callers, so the 21-site read sweep entered slice 2; (2) projection ownership moved from a React memo to `SimulationRuntime`; plot hooks disposed; the Area note kept verbatim; (3) `$realm` binds a Realm or nothing; *yeoman* for *freeholder*; movement flavour disposed; (4) the `controls` write path — `transferHolding` retargets `owns`, the war phases carry no runtime, and *takes* had no producer, so conquest (§ Engine E), the runtime threading and the fingerprint belt entered slice 2; *holds* made plain prose pending THR-1453 / THR-1449 arbitration; (5) the `__DEBUG.conquerLocation` write lever; the honest one-time re-pin instead of a stream-preserving shim; the THR-1453 / THR-1449 notes actually posted; (6) the `controlled_by` "mirror" shown to be a fixture-only phantom and removed from conquest with a bold instruction never to register it.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-10*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 10-entry constants table (`REALM_FILL_RADIUS`, `REALM_TIEBREAK`, `REALM_CONQUEST_SEVERITY`, `REALM_RANK_LADDER`, etc.), 8 new + 2 reused; retired constants (`FACTION_COUNT`, `FACTION_NAMES`) named explicitly |
| 2. Inspectability | PASS | 4 registered trace categories, each causal (`RealmProjectionTrace.reason: 'version'\|'fingerprint'` names *why* it rebuilt); 2 `__DEBUG` readers + 1 write lever (`conquerLocation`) so a moved border is "constructed, never waited for" |
| 3. Determinism | PASS-with-note | Projections/conquest are pure, draw nothing; Realm mint changes worldgen's rng draw count — "a one-time, declared re-pin, not a stream-preserving shim," re-taken once in slice 2 with changed artifacts listed |
| 4. Fail-soft | PASS | 15-row fail-soft table; `ensureRealmProjection`/`ensureAreaProjection` catch and trace, keep stale projection on throw; conquest never relies on a throw (`retargetEdgeSource` no-ops by contract) |
| 5. Narrative over mechanical | PASS-with-note | Voronoi-by-held-towns is blunter than the watershed provinces it replaces; accepted because "a border that moves when a town falls is a story"; Law 13 honored (*"a dozen towns,"* never a numeral) |
| 6. Additive over destructive | PASS-with-note | No new node/edge type. But deletes flood-fill detector, `gameInit` index join, round-robin territory, `FACTION_COUNT`/`FACTION_NAMES`, `WORLDGEN_TERRITORY_MODE`, province border tier — justified as retiring the "private pipeline" that is this ticket's own root flaw, not a discretionary refactor |
| 7. Performance budget | PASS | Projections lazy, memoized on `structuralCacheVersion` with a fingerprint belt; O(hexes × heldLocations) at structural rebuild only (768×~112 medium); nothing added per tick |

**NFP AUDIT: PASS-with-notes (see rows above)**

Independent verification note: the plan doc carries its own self-reported NFP table reaching the same seven verdicts; this audit re-derived each verdict from the Constants table, Tracing section, PRNG callouts, Fail-soft table, and Wiring section rather than trusting the self-report, and it agrees on all seven rows including both PASS-with-note caveats (determinism's rng re-pin, additive's justified deletions).

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, Graph nodes/edges, Tick phases, Resolution logic, PRNG callouts all present with real detail (rng draw-count shift, PRNG re-pin plan). |
| Content | present-and-substantive | Encounter templates, Prose tables, Data tables all substantive (with explicit N/A-with-rationale sub-decisions for spawn scoping/plot hooks/movement flavour); Attachment content was a bare "N/A." with no reason line — a reason was added after the audit. |
| UI | present-and-substantive | Player-facing display, Event notifications, Debug inspection, Visual presence all present with concrete component/trace references and screenshot-tool routing. |

Missing-required-sections list: No missing required sections.

Wiring section check: Yes — the Wiring table maps each module to orchestrator phase, UI component, GameState field, trace emitted, and debug visibility, matching the checklist's required columns exactly, plus a prose-pipeline/player-controls note.

Substrate-existence check (THR-658): PASS. Plan opens with `## Substrate inventory` listing nine existing subsystems by inventory name — World Generation/Terrain & Places, Factions & Succession, Strategic Projects & Control, War/Armies & Battles, faction-definition lookup, plus non-inventory renderer/worldgen modules — each verified present in `Docs/canon/systems-inventory.md`. Every row states extends/activates/replaces, never "build new." No green-field duplication found — the plan explicitly reuses the existing Faction node shape (no new node/edge type) and activates the half-wired `getFactionDefinition` lookup rather than inventing a parallel system.

**PILLAR AUDIT: PASS**

### Vision audit

Method: read the plan doc, ran `npm run vision-audit` (found no path-cited Vision file, seven non-negotiables named without citation), then read all six Vision sources directly. `Docs/design-brief.md` has no distinct "§ Vision summary" heading but is current (`last_validated_against: 2026-08-28`); audited against the Vision files directly, not flagged stale.

**Vision premises touched**
- `00-north-star.md` → "weight of threads" — [silent/speculative]. Plan's own claim is not cashed by shipped content this ticket; realm encounters are explicitly deferred.
- `01-core-loop.md` → not referenced. [silent] — infrastructure only; no scan/encounter/aftermath change.
- `02-non-negotiables.md` → #1 god-not-protagonist, #3 prose-never-numbers, #4 graph node/edge, #5 Brainstorm companion, #7 three pillars — [confirmed]. #6 additive-over-destructive — [confirmed], deletions (FACTION_COUNT, province tier, flood-fill detector) are argued as removing the private-pipeline flaw the ticket exists to fix.
- `03-design-tensions.md` → #2 emergence vs authored moments — [extended toward emergence]. Realm ambitions/quests/armies become reachable; the authored counterpart (realm encounters) is deliberately filed as a separate content ticket, not smuggled in.
- `taste-profile.md` → graph-edges-not-property-bags, no-numbers-in-UI, god-never-protagonist, no-invented-node-types — [confirmed].

**Vision contradictions:** No contradictions found.

**Five qualitative checks**
- North star: doesn't itself deliver the crisis moment; sets up future weight-of-threads material, not yet realized.
- Core loop: preserved — untouched, and new content is honestly deferred rather than smuggled.
- Non-negotiables: clean — no direct mortal control added, no new node/edge types, territory stays edge-based.
- Design tensions: leans toward systemic emergence without landing authored curation in this ticket — disclosed, not drift.
- Taste profile: every touched strong opinion respected; no anti-pattern reintroduced.

**VISION AUDIT: PASS-with-notes**
