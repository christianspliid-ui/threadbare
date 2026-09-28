> **title:** Faith and politics as world settings — a Temple congregation per culture, holy places on every culture's ground, unheld towns, labelled town guilds — THR-1632
> **linear_issue:** THR-1632
> **author:** Claude Code (design lane, run 2026-09-28b)
> **created:** 2026-09-28
> **three_pillars:** Engine `done` · Content `done — congregation names and one sheet line; no encounter prose (existing Temple and pilgrimage lines are reused)` · UI `done — the faction page names each congregation and the sphere it venerates; a fringe settlement's culture reads as fringe; town guilds read "guild"`

# Faith and politics as world settings — THR-1632

*Today every world starts with one world-wide temple, a handful of holy places that happen to sit off every culture's ground, and 34–41 town guilds that nothing can tell apart from anything else. This plan turns faith and politics at game start into one block of named world settings, and sets its first default to the world that puts the most systems in contact: a Temple congregation for every living culture, at least two holy places on every culture's ground, the wild towns left unheld, and town guilds labelled as guilds.*

## Why this is load-bearing

The living-world map ([A world that starts alive](https://linear.app/threadbare/issue/THR-1589)) found **one religious faction per world on both seeds**, holy places that worldgen cuts first, about half of all settlements held by nobody, and 34 · 41 factions with no type (audit §1.1, §1.2, §1.6 gap 9). Christian's direction on the fork was *"This should be tunable for different scenarios. To begin let's go with something that allows us to test and see balance and interaction"* (Discord, 2026-09-26 16:25 UTC). So this plan does two things at once: it builds the **settings block** that makes the landscape tunable, and it ships the **testable default** the design lane chose inside that direction.

It also closes two open calls from [Seeded things that die](https://linear.app/threadbare/issue/THR-1595) that the map routed here: whether pilgrim routes (`sacred_route`) are restored or retired, and whether settlements outside every culture's heartland get a culture. Half the mortals on seed 42 have no culture today, and the holy-place floor has to be counted on *some* culture's ground.

This is carve-up plan 3 of 7. It runs beside [notables and ties](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1630-notables-and-ties.md) (plan 1) and [a world with a past](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1631-world-with-a-past.md) (plan 2), and must land sequentially with the notable slice (§ Coordination block).

**Settled input, not reopened here.**

- [Faith and politics at game start](https://linear.app/threadbare/issue/THR-1596) — **decided by the design lane under delegation on 2026-09-26 18:30 UTC, inside Christian's direction above; no veto in the 36 hours since.** One `WorldScenario` block of knobs, same seed = same world. Default: one Temple of the Spheres instance per living culture carrying that culture's first venerated sphere (`TEMPLE_CHAPTERS_PER_CULTURE = 1`, 0 = today's single temple; instances of the existing definition, not a new kind); `HOLY_PLACES_MIN_PER_CULTURE = 2` shrines or temples on each culture's ground; unheld towns stay unheld (the existing wilderness knobs join the block); settlement guilds get `factionType: 'guild'` plus a class that separates them from the 6 definition guilds. A scenario picker is a follow-on (the map's Out of scope).
- [Seeded things that die](https://linear.app/threadbare/issue/THR-1595) (orchestrator research, 2026-09-25) — `sacred_route`'s only writer is a legacy template never offered under `UNDERTAKING_MODEL = 'cells'`; 245 of 480 mortals on seed 42 have no culture; only Locations inside a culture province get `belongs_to`.
- [What liveness costs](https://linear.app/threadbare/issue/THR-1592) — the budget line: +10% steady-state tick cost against a same-session baseline.
- Standing rulings from the map: counts are named constants; never seed a kind whose band has not shipped its shape; political territory is `controls` edges, never a second region kind.

**Decided in this plan by the design lane under delegation** (process.md rule 4: the *how* of an agreed outcome). Each is marked *Lane decision* where it appears, and each can be vetoed in chat:

1. **"Congregation", not "chapter"** (§ S1b). The glossary already uses *chapter* for the encounter reading unit (`Docs/ubiquitous-language/Encounters.md:203-209`), so a Temple instance is a **congregation**, and the knob is `TEMPLE_CONGREGATIONS_PER_CULTURE`. Same design, a free word.
2. **Each congregation's seat is its culture's capital** (§ S1b). Its first hall stands there and its other halls are drawn only from that culture's heartland, so a congregation never takes a wild town and the unheld ground stays unheld.
3. **A congregation's sphere shows on its page and leans its holy places** (§ S1b, S1c). The decision wrote the sphere onto the congregation; a write needs a reader, and the Temple's join rule keys on a Reach (`star`), not a sphere (`temple-of-spheres-definition.ts:128`, `types/faction.ts:147`). So the sphere is read by the faction page and by the holy places the floor adds, which lean toward it.
4. **Settlements outside every heartland take the nearest culture, as its fringe** (§ S1d). Within 8 hexes of a culture's heartland, a settlement gets a *current* culture link marked `fringe` at half strength, with no *historical* link. Ruins, lairs and wonders stay cultureless. Nothing political changes: Realm holding is built from provinces, not from culture links.
5. **Pilgrim routes are restored by seeding, not retired** (§ S1f). Each congregation consecrates one pilgrim route to its seat at game start, so every culture's capital hosts the pilgrimage encounter. Consecrating new routes mid-game needs a faith undertaking cell, which is the undertaking lane's design and is filed as a deferral.
6. **Town guilds get `factionClass: 'guild'`; the six definition guilds get nothing new** (§ S1e). `factionClass` already exists with `'guild'` in its list (`realm-content.ts:55`) and only Realms write it today. A definition guild is already told apart by its `factionDefId`, which town guilds lack.

## Re-measured on current `main` (2026-09-28, `1ad1b776`)

Census: seeds 42 and 99, medium map, t0, `initializeGameState` as the CLI runs it (a scratch script in the `readers/*.ts` pattern, bundled with esbuild; to be committed as `readers/faith.ts` in S1).

| | seed 42 | seed 99 |
|---|---|---|
| Factions by `factionType` | 50: none 34, guild 6, political 4, military 3, criminal 2, religious 1 | 57: none 41, guild 6, political 4, military 3, criminal 2, religious 1 |
| Factions with a `guildType` (town guilds) | 34, none with `factionType` or `factionDefId` | 41, same |
| `factionClass` written | realm 3, all others none | same |
| The religious faction | `faction_def_temple_of_spheres`: 5 halls, 27 members, controls `loc_1`, no culture | same id: 3 halls, 12 members, controls `loc_84` |
| Living cultures, `cultureIdentity.veneratedSpheres` | culture_0 [spirit], culture_1 [light, life], culture_2 [entropy, mind] | culture_0 [matter, force], culture_1 [matter], culture_2 [force] |
| Shrines + temples | 3 (2 temples, 1 shrine), **all 3 off every culture's ground** | 11 (10 shrines, 1 temple): culture_0 1, culture_2 2, culture_1 **0**, none 8 |
| Locations with a `belongs_to` culture | 40 of 235 (195 without, incl. 103 elder ruins, 13 lairs) | 60 of 238 |
| Mortals without a culture | 245 of 489 (50.1%) | 299 of 633 (47.2%) |
| Settlements (hamlet and up) held by a `controls` edge | 24 of 38; the 14 unheld are all off culture ground | 36 of 54; the 18 unheld are all off culture ground |
| `runTick`, 30 ticks after 5 warm-up | 87.3 ms/tick | 166.8 ms/tick |

**The holy-place floor starts from zero:** no culture on seed 42 has a single holy place on its ground, and culture_1 has none on seed 99.

| Fact | Where | Consequence |
|---|---|---|
| Temple definition: `factionType:'religious'`, `locationTypes: ['town','city','capital','temple','shrine']`, no `instanceCount`, no sphere or culture field | `data/temple-of-spheres-definition.ts:15-143`, `:22`, `:33` | congregations are an instance override at seeding, not a definition edit |
| Instances: `instanceCount > 1` gives id `faction_def_${def.id}_${i}`, the same `nameTemplate` for all, 3–5 halls each drawn from the **whole map** list, first hall = `homeLocationId` | `engine/factionSeeding.ts:218-249, 350-413`; `faction-constants.ts:42,45` | S1b restricts halls per congregation and renames them (the mercenary rename precedent, `worldSeed.ts:1891-1896`) |
| `seedFactionDispositions` uses **only the first instance** per definition (regex `/^faction_def_(.+?)(?:_\d+)?$/`) | `factionSeeding.ts:430-438` | S1b extends it to every instance; ids keep the numeric suffix so the regex still parses |
| `resolveFactionNodeId` is already instance-aware (own instance → local → lowest id); membership compares `factionDefId` | `factionMembership.ts:73-109`; `factionQuestGeneration.ts:293-304` | every Temple content line reads every congregation with no change |
| First-match readers that see only one instance | `factionQuestGeneration.ts:288-289` (first hall at a town), `encounterSupportBundle.ts:70-80`, `debugWorldSpawnTools.ts:311-322, 587-591` | acceptable: each is "a hall/faction here", and congregations do not share a heartland |
| Every definition faction controls its home | `ensureFactionControlAtHomeLocations`, `worldSeed.ts:465-496`, called `:1996` | each congregation co-holds its culture's capital, as the single temple holds `loc_1` today |
| Priest, acolyte and pilgrim NPCs route to `factionType: 'religious'` factions with a hall or control at their town | `npcSeeding.ts:101-103, 645`; `worldSeed.ts:439-463, 2008-2011` | congregations fill with their own culture's clergy with no routing change |
| Holy subtypes are `'shrine'` and `'temple'`; candidates pre-roll `locCount*2` and sort by tier, holy places last (tier 3), then stop at `locCount` | `worldSeed.ts:552-594, 796-817` | the floor is a top-up after the loop, not a reorder |
| The placement loop already knows each hex's culture: `getHexCultureIdentity(col,row)` reads the province's `cultureId` | `worldSeed.ts:765-773` | the top-up counts culture ground the same way `belongs_to` is written |
| Culture links: only Locations whose province has a `cultureId` get `belongs_to` (both layers); the same map drives Realm `controls` and the capital/city/town promotion pass | `worldSeed.ts:1338-1380, 1546-1563` | fringe links must stay **out** of `locationCultureMap` |
| No code gives a nearest culture; THR-1588's "freehold fallback" is property (`owns`), not culture | `seedLivingWorld.ts:341-390` | S1d is new |
| NPCs take their Location's culture link (`current` first, else the first link) and are seeded at `:1727`; actor culture traits are granted `:1740-1751` | `npcSeeding.ts:338-344`; `worldSeed.ts:1723-1751` | the fringe pass runs before `:1723` |
| 26 `src/engine` files read `belongs_to`; **none** treats a Location's culture as Realm ground or ownership; none draws map borders from it; none requires a *historical* link beside a *current* one | reader audit (brainstorm companion § Reader audit) | fringe links are safe; three readers change on purpose (below) |
| `detectConquestTension` needs both layers; `detectCulturalMismatch` needs only *current* | `culturalTension.ts:128, 152-155` | fringe towns gain mismatch tension, never false conquest tension |
| `hexZoom.getHexCultures` averages `culturalStrength` into the hex culture panel | `hexZoom.ts:161-175` | a half-strength fringe link reads as a partial culture |
| The *cultural convergence* mandate counts every `belongs_to` edge | `mandate.ts:100` | S1 checks it is not complete at t0 (§ Kill criteria) |
| `sacred_route`: actor → location, needs `establishedTick`; its reader pools `encounter.pilgrimage_trial` at any destination; it invalidates the encounter cache when minted | `edgeSchema.ts:491-509`; `encounterCache.ts:318-331`; `strategic-action-constants.ts:345-361` | a seeded route to a capital makes the pilgrimage reachable there |
| `sacred_route`'s writer is only in `ambition_spread_faith.templateIds`; under cells it is never offered; no faith cell exists | `ambition-templates.ts:831`; `strategic-action-constants.ts:1160`; `strategicActionCandidates.ts:104-107`; `undertaking-cells.ts` | mid-game consecration is a new cell → deferral |
| Wilderness knobs: `WILDERNESS_PROVINCE_COUNT = 10`, `CORNER_WILDERNESS_COUNT = 4`, used only in pass 1 | `worldgen/constants.ts:45, 71`; `passes/pass01-provinces.ts:210, 232` | the block reads them as defaults |
| No scenario or worldgen-options object exists; `initializeGameState` takes positional arguments; the override-bag precedent is `LIVING_WORLD_DEFAULTS` + `seedLivingWorld(graph, ctx, overrides)` | `gameInit.ts:117-156`; `worldgen-living-constants.ts:156,189`; `seedLivingWorld.ts:1037-1042` | S1a copies that precedent |
| Town guild nodes: `actorType:'faction'`, `guildType`, `homeLocationId`, no `factionType`/`factionDefId`/`factionClass`; no `=== 'guild'` check exists in `src/` outside tests | `guildSeeding.ts:283-297`; grep | stamping is additive; visible effects are the faction page's kind line and schism naming (`factionTopology.ts:128`, `faction-schism-content.ts:113-121`) |
| The faction page's name is `summary?.name ?? node.name`; its kind line reads `factionType`, falling back to "faction" | `components/Game/FactionSheet.tsx:103-104` | renamed congregations render distinctly; town guilds will read "guild" |

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| World Generation, Terrain & Places | 🟢 ACTIVE | **extends**: a settings block, a holy-place top-up after placement, a fringe-culture pass |
| Factions & Succession (definition seeding, instances, dispositions, home control) | 🟢 ACTIVE | **extends**: per-culture Temple instances with seat and hall constraints; dispositions for every instance |
| Culture (province culture, `belongs_to`, actor inheritance, tension) | 🟢 ACTIVE | **extends**: fringe links outside heartlands |
| Guild seeding (`guildSeeding.ts`) | 🟢 ACTIVE | **extends**: two properties on town guild nodes |
| Sacred routes / pilgrimage pool (THR-1184) | 🟠 writer stranded, reader live | **activates**: a worldgen writer for the live reader |
| Worldgen province pass (wilderness seeds) | 🟢 ACTIVE | **extends**: reads its two counts from the block |

## Engine pillar

*Slice S1, this ticket: the settings block and the default world.*

### S1a. The `WorldScenario` block

A new `src/data/world-scenario.ts` holds the interface, `DEFAULT_WORLD_SCENARIO`, and a `resolveWorldScenario(overrides?)` that merges a partial override over the default (the `LIVING_WORLD_DEFAULTS` pattern):

```ts
export interface WorldScenario {
  /** Temple of the Spheres congregations per living culture. 0 = one world-wide Temple (today's world). */
  templeCongregationsPerCulture: 0 | 1;
  /** Floor of holy places (shrine or temple Locations) on each living culture's heartland. 0 = no floor. */
  holyPlacesMinPerCulture: number;
  /** Wilderness provinces at worldgen — the ground nobody holds. Default reads WILDERNESS_PROVINCE_COUNT. */
  wildernessProvinceCount: number;
  /** Of those, how many are placed in the map corners. Default reads CORNER_WILDERNESS_COUNT. */
  cornerWildernessCount: number;
  /** Settlements within this many hexes of a heartland take that culture as its fringe. 0 = off. */
  cultureFringeMaxHexes: number;
  /** Each congregation consecrates a pilgrim route to its seat at game start. */
  seedCongregationPilgrimRoutes: boolean;
  /** Town guilds carry factionType 'guild' and factionClass 'guild'. */
  labelSettlementGuilds: boolean;
}
```

`initializeGameState` gains a trailing optional `scenario?: Partial<WorldScenario>` (after `doomArchetype`), resolves it once, passes the two wilderness counts into `generateWorld` (a new optional field on `WorldGenParams` read by pass 1 instead of the imported constants) and the resolved block into `seedWorld` (a new trailing optional parameter). Every existing caller passes nothing and gets the default. The resolved block is stored on `GameState` as `worldScenario` so the debug bridge and a later picker can read what a world was made with. *Lane decision:* the congregation knob is `0 | 1`; more than one congregation per culture has no agreed meaning and no seat rule.

**Rejected:** putting the knobs in `LIVING_WORLD_DEFAULTS`. That bag belongs to `seedLivingWorld`, which runs after faction seeding and cannot change where holy places or wilderness provinces go.

### S1b. A Temple congregation per living culture

With `templeCongregationsPerCulture = 1`, `seedAllFactions` seeds the Temple definition once per **living** culture (registered pregen cultures; `hist_culture_*` nodes also carry `actorType:'culture'` and are excluded), through a new optional per-definition instance plan rather than `instanceCount`:

1. **Ids** keep the existing form `faction_def_temple_of_spheres_${i}`, `i` in culture order, so the disposition regex and every `factionDefId` reader keep working.
2. **Seat** (*Lane decision 2*): the first hall is placed at the culture's capital, which the promotion pass guarantees (`worldSeed.ts:1368+`). The other `FACTION_GUILD_HALL_COUNT_MIN..MAX` halls are drawn from that culture's heartland Locations of a `locationTypes` subtype, with the instance's existing seed. If the heartland has fewer qualifying Locations, the congregation keeps fewer halls; it never borrows another culture's town or a wild one.
3. **Identity:** each congregation belongs to its culture by a `belongs_to` edge, the relationship every actor's culture already uses (item 5), not by a property; Realms' `cultureId` property (`worldSeed.ts:1524`) is not copied. It carries `veneratedSphere` (the culture's `veneratedSpheres[0]` at worldgen, a founding fact that stays put if the culture later drifts) and is renamed after seeding to `CONGREGATION_NAME_TEMPLATE` (Content item 1).
4. **Dispositions, both sides:** `seedFactionDispositions` gives every instance its definition's dispositions, not only the first, **and** fans out the target side: another definition's disposition toward `temple_of_spheres` (which today resolves to the first instance only, through the map built at `factionSeeding.ts:430-438`) is written toward every congregation.
5. **Culture for actors:** `assignCulturesToActors` is handed each congregation's culture directly, so its `belongs_to` edge goes to that culture instead of being inferred from the first `controls` target or rolled at random (`cultureGenerator.ts:698-709`).
6. **Home control** is unchanged: `ensureFactionControlAtHomeLocations` gives each congregation a `controls` edge on its capital beside the Realm's, which is the single temple's pattern today.

With the knob at `0`, the Temple seeds exactly as today (one instance, id `faction_def_temple_of_spheres`). A test pins that.

### S1c. Holy places on every culture's ground

Directly after the placement loop (`worldSeed.ts:~817-860`), a top-up counts, per living culture, placed Locations with subtype `'shrine'` or `'temple'` on hexes whose `getHexCultureIdentity` is that culture. For each culture below `holyPlacesMinPerCulture`, it places new holy Locations on free hexes of that culture's heartland, in this order: unused pre-rolled candidates on that ground first, then the remaining shuffled habitable tiles on that ground. It honours the spacing rule, draws from its own stream `mulberry32(seed + HOLY_PLACE_TOPUP_SEED_OFFSET)`, and picks the subtype with the terrain weights of `pickLocationSubtype` restricted to `shrine`/`temple` (a `'temple'` if the culture has none yet, per `HOLY_PLACE_TOPUP_FIRST_TEMPLE`). The executor extracts the loop body's node creation into a `placeLocation(tile, subtype)` helper so the top-up and the loop create identical nodes; top-up ids continue `loc_${locIndex}`.

*Lane decision 3:* a top-up holy place of a culture with a congregation has its `sphereInfluence[veneratedSphere]` set to `HOLY_PLACE_SPHERE_BIAS` (the field is initialised per location for mandate evaluation, `worldSeed.ts:~851-855`).

The top-up runs before sublocations, resources, roads and culture links (`worldSeed.ts:1323-1361`), so a new holy place gets the same Places, resources and heartland `belongs_to` as any other Location. It adds at most `holyPlacesMinPerCulture × cultures` Locations (6 at the default), far inside the distance matrix's 1200 cap (medium has 214 place-tier Locations).

### S1d. Culture for settlements outside every heartland (fringe)

*Lane decision 4.* After the promotion pass and before `assignCulturesToActors` (`worldSeed.ts:~1400-1723`), each Location with **no** `belongs_to` whose subtype is in `CULTURE_FRINGE_SUBTYPES` finds the nearest heartland Location by hex distance (ties broken by culture id, then location id; no randomness). Within `cultureFringeMaxHexes` it gets one `belongs_to` edge to that culture with `cultureLayer: 'current'`, `culturalStrength: CULTURE_FRINGE_STRENGTH` and `fringe: true`, written through `assignCultureToLocation` extended with an optional strength and fringe flag (so it also grants the culture trait). It gets **no** historical link. Elder ruins, lairs, wonders and anomalies are not in the subtype set and stay cultureless. Farther than the range, a settlement stays cultureless.

Fringe links are **never** added to `locationCultureMap`, so they touch neither the promotion pass, the Realm `controls` build, nor culture-aware NPC names. What they do change, on purpose:

- NPCs seeded at a fringe town, and later births and minted inhabitants there, carry that culture (`npcSeeding.ts:338-344`, `agentLifecycle.ts:555`, `mintInhabitant.ts:205-207`).
- Encounter openings at a fringe town can carry the culture line from [culture and spheres showing through](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-27-thr-1635-culture-sphere-openings.md) (`openingColoration.ts:35-39`). That plan's rule keeping the five playthrough encounters untouched is unaffected.
- A fringe town's genome runs its culture pass at half strength (`runGenome.ts:68-72`).
- Actors of another culture at a fringe town feel cultural mismatch there (`culturalTension.ts:128`). Conquest tension stays off, because it needs a historical link.

`CultureEdgeProperties` (`types/culture.ts:83-86`) gains `fringe?: boolean`.

### S1e. Town guilds labelled

With `labelSettlementGuilds`, `guildSeeding.ts` writes `factionType: 'guild'` and `factionClass: 'guild'` on each town guild node (*Lane decision 6*). No reader branches on `=== 'guild'` today. The visible effects are the faction page's kind line and the schism naming table (`factionTopology.ts:128`): the executor confirms `faction-schism-content.ts:113-121` has a `guild` row and records which splinter names a town guild now gets. NPC routing is unchanged, because town guilds are not in `factionLocationMap` (`worldSeed.ts:2008-2011`).

### S1f. Pilgrim routes restored by seeding

*Lane decision 5.* With `seedCongregationPilgrimRoutes`, after home control each congregation writes one `sacred_route` edge from itself to its seat capital with `establishedTick: 0` and `origin: 'worldgen'`. The live reader then pools `encounter.pilgrimage_trial` at every culture's capital, which as a town could never host it before (`strategic-action-constants.ts:331-344`). Nothing decays a `sacred_route`. The legacy template and its ambition link are left as they are (additive); a faith undertaking cell that consecrates new routes mid-game is the deferral [a faith undertaking consecrates new pilgrim routes](https://linear.app/threadbare/issue/THR-1660).

`Docs/canon/world-objects.md:21` defines a Route as a Location↔Location edge while `pilgrim_way` is actor → location (`world-objects.ts:245`). S1 corrects that one row to say a pilgrim way runs from a faith to its holy destination.

### PRNG callouts

- Congregation hall draws reuse each instance's seed (`seed + offsetIndex*7919 + i*7919`, `factionSeeding.ts:350-413`).
- Holy-place top-up: its own `mulberry32(seed + HOLY_PLACE_TOPUP_SEED_OFFSET)` (offset `53731`; the executor greps worldgen offsets and moves it if taken). It draws one roll per short culture per placement, in culture order.
- Fringe assignment and pilgrim routes use no randomness.
- **The default world changes for every seed.** New Locations and factions shift later `loc_` ids and per-location streams. Same seed = same world still holds; snapshot tests that pin a default-world count move, and the executor updates them with the census as evidence. With every knob at its "today" value (congregations 0, floor 0, fringe 0, routes off, labels off) the t0 graph must equal today's — a test pins it.

### Tick phases

None. Everything in this plan runs once at worldgen. The per-tick consequences come from existing readers (encounter cache, cultural tension, genome reassessment) meeting more data.

## Content pillar

1. **Congregation name**: `CONGREGATION_NAME_TEMPLATE = 'The {culture} Congregation of the Spheres'`, `{culture}` from the culture node's display name. The Temple's own name is unchanged when the knob is 0. Game words, no ids; if a culture name still leaks a biome id ([THR-1622](https://linear.app/threadbare/issue/THR-1622)), the name inherits that defect rather than working around it.
2. **Sheet line**: `CONGREGATION_SPHERE_LINE = 'Venerates {sphere}.'`, `{sphere}` as the sphere's display name (the `SPHERE_VOCABULARY` label).
3. **Fringe label**: `CULTURE_FRINGE_LABEL = '{culture} fringe'` for the hex culture panel (UI item 2).
4. No new encounter prose. The Temple's existing content lines (`temple-of-spheres-encounter-content.ts`) read every congregation through `factionDefId`, and the pilgrimage encounter at the capitals is the existing `encounter.pilgrimage_trial`.

## UI pillar

*Slice S2: [the player sees faith and fringe](https://linear.app/threadbare/issue/THR-1659).*

*Screenshot tool: Playwright (DOM surfaces only; no WebGL change).*

1. **Faction page** (`FactionSheet.tsx`): a congregation shows its own name (already, via `node.name`) and one line under the kind: *Venerates Light.* A town guild's kind line reads *Guild*.
2. **Hex culture panel** (`hexZoom.getHexCultures` → the focused-hex panel, `GameView.tsx:4955-4987`; `HexSidebar.tsx:333-336` "Culture: …"): a fringe settlement's culture reads *Varn fringe* rather than as full membership. `getHexCultures` passes the `fringe` flag through; the label comes from Content item 3.
3. **No event notifications.** Everything happens at worldgen, before the player acts, so no toast or chronicle entry is emitted. The pilgrimage encounter at a capital arrives through the existing encounter flow.
4. **No new surface and no map change.** Culture borders are not drawn from Location culture links (`hexRegion.ts` reads region → historical only), so the map is untouched.

**UI Laws engaged** (`Docs/design-system/laws.md`): at minimum Laws 1, 13/14, 17, 21, 33 and 37 (THR-1007). Law 13 is the one that shapes the design: the fringe is a word, never the 0.5 strength behind it. S2 carries the four-part browser evidence at 1920×1080.

**Debug inspection (S1):** `window.__DEBUG.getWorldScenario()` returns the resolved block and a census `{ congregations: [{ id, name, cultureId, veneratedSphere, seatId, hallCount }], holyPlacesByCulture, fringeSettlements, culturelessSettlements, settlementGuildsLabelled, unheldSettlements, pilgrimRoutes }`, computed by one pure selector the census reader also calls.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `data/world-scenario.ts` (block + resolver) | worldgen (`initializeGameState`) | none | `worldScenario` | `worldgen_scenario_applied` | `getWorldScenario()` |
| congregation seeding (`factionSeeding.ts`, `worldSeed.ts`) | worldgen | `FactionSheet` (S2) | graph (faction nodes, halls, `controls`) | inside `worldgen_scenario_applied` | `getWorldScenario().congregations` |
| holy-place top-up (`worldSeed.ts`) | worldgen | existing location pages | graph (Locations) | inside `worldgen_scenario_applied` | `.holyPlacesByCulture` |
| fringe culture (`worldSeed.ts`, `cultureGenerator.ts`) | worldgen | hex culture panel (S2) | graph (`belongs_to`) | inside `worldgen_scenario_applied` | `.fringeSettlements` |
| town guild labels (`guildSeeding.ts`) | worldgen | `FactionSheet` kind line (S2) | graph | inside `worldgen_scenario_applied` | `.settlementGuildsLabelled` |
| pilgrim routes (`worldSeed.ts`) | worldgen; read by the encounter cache | existing encounter flow | graph (`sacred_route`) | inside `worldgen_scenario_applied` | `.pilgrimRoutes` |
| wilderness counts (`pass01-provinces.ts`) | worldgen | none | none | inside `worldgen_scenario_applied` | `.unheldSettlements` |

## Interface impact

| Contract | Change |
|---|---|
| `authored-faction-ids-resolve-to-seeded-faction-nodes` (`scripts/interface-contracts.ts:2488`) | **preserve** — Temple content resolves to a congregation through `resolveFactionNodeId`; S1 adds a test that a `faction_reputation_gain factionId:'temple_of_spheres'` lands on the actor's own congregation |
| `culture-custom-reaches-encounter-opening` (`interface-map.md:300-313`) | **extend** — its producer now includes fringe links; the row's note says so |
| new: `congregation-sphere-reaches-faction-page` | **add** — producer S1b `veneratedSphere`, reader `FactionSheet` (S2); registered in S1 with S2 as its remediation ticket until S2 lands |
| new: `seeded-pilgrim-route-pools-pilgrimage` | **add** — producer S1f, reader `encounterCache.ts:318-331` |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `DEFAULT_WORLD_SCENARIO.templeCongregationsPerCulture` | `1` | Temple congregations per living culture; 0 = one world-wide Temple |
| `DEFAULT_WORLD_SCENARIO.holyPlacesMinPerCulture` | `2` | floor of shrines/temples on each culture's heartland |
| `DEFAULT_WORLD_SCENARIO.wildernessProvinceCount` | `WILDERNESS_PROVINCE_COUNT` (10) | ground nobody holds |
| `DEFAULT_WORLD_SCENARIO.cornerWildernessCount` | `CORNER_WILDERNESS_COUNT` (4) | of which in the corners |
| `DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes` | `8` | reach of a culture beyond its heartland; 0 = off (matches `WORLDGEN_FREEHOLD_SETTLEMENT_MAX_HEXES`) |
| `DEFAULT_WORLD_SCENARIO.seedCongregationPilgrimRoutes` | `true` | one pilgrim route per congregation, to its seat |
| `DEFAULT_WORLD_SCENARIO.labelSettlementGuilds` | `true` | town guilds typed and classed |
| `CULTURE_FRINGE_SUBTYPES` | capital, city, town, hamlet, camp, farmland, fort, shrine, temple | which Locations can be fringe |
| `CULTURE_FRINGE_STRENGTH` | `0.5` | `culturalStrength` of a fringe link (genome, hex panel) |
| `HOLY_PLACE_SPHERE_BIAS` | `0.6` | `sphereInfluence` of a top-up holy place toward its congregation's sphere |
| `HOLY_PLACE_TOPUP_FIRST_TEMPLE` | `true` | the first top-up for a culture with no temple is a temple |
| `HOLY_PLACE_TOPUP_SEED_OFFSET` | `53731` | the top-up's PRNG stream |
| `CONGREGATION_NAME_TEMPLATE` | `'The {culture} Congregation of the Spheres'` | congregation name |
| `CONGREGATION_SPHERE_LINE` | `'Venerates {sphere}.'` | faction page line (S2) |
| `CULTURE_FRINGE_LABEL` | `'{culture} fringe'` | hex culture panel label (S2) |

## Tracing

```ts
// worldgen_scenario_applied — emitted once at worldgen, after S1f
interface WorldgenScenarioAppliedTrace {
  type: 'worldgen_scenario_applied';
  scenario: WorldScenario;                        // the resolved block
  congregations: Array<{ id: string; cultureId: string; veneratedSphere: string | null; seatId: string | null; hallCount: number }>;
  holyPlaces: Record<string, { before: number; added: number; shortBy: number }>; // per culture
  fringe: { linked: number; outOfRange: number };
  settlementGuildsLabelled: number;
  pilgrimRoutes: number;
  skipped: Array<{ step: 'congregation' | 'holy' | 'fringe' | 'guild' | 'route'; id: string; reason: string }>;
}
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A culture has no capital (promotion pass found no promotable Location) | Seat = the culture's first heartland Location of a `locationTypes` subtype; none → that congregation is not seeded, logged in `skipped` |
| A culture's heartland has no free hex for the holy floor | Place what fits; record `shortBy` in the trace; never place off the culture's ground |
| A culture has no venerated sphere | `veneratedSphere: null`; no sphere bias; the page line is omitted |
| Fewer than 1 living culture (pregen path absent) | Fall back to today's single Temple; trace records it |
| `scenario` override with an unknown or out-of-range value | `resolveWorldScenario` clamps to the documented range and warns once |
| The fringe pass finds no heartland Location at all | No fringe links; everything else proceeds |
| A `sacred_route` write fails schema validation | Skip that route, log in `skipped` |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/engine/gameInit.ts` | 122 (33 non-test) | one trailing optional parameter; existing callers untouched |
| `src/types/gameState.ts` | 145 | one optional field `worldScenario?: WorldScenario`; no reader breaks on absence (old saves) |

`src/types/graph.ts` (255 importers) is **not** touched: `sacred_route` and `belongs_to` already exist; the new edge property lives in `types/culture.ts` (16 importers).

## Kill criteria

- **Steady-state tick cost rises more than 10%** on seeds 42 or 99 against a same-session baseline → the likely readers are cultural mismatch at fringe towns and the extra halls. Lower `CULTURE_FRINGE_STRENGTH` or `cultureFringeMaxHexes` first, measure again, and post the numbers on this ticket.
- **The cultural convergence mandate is complete at t0**, or within 10 ticks, on either seed → exclude `fringe: true` edges from its count (`mandate.ts:100`), the THR-1618 lesson.
- **Unheld settlements (hamlet and up) change by more than one** on either seed with the wilderness counts unchanged → a congregation took a wild town; the seat or hall constraint is broken.
- **The pilgrimage encounter fires more than any other encounter** at a capital in a 200-tick run → cap it through the existing encounter cooldown rather than removing the route.

## Three-pillar check

- [x] Engine pillar present (S1a–S1f)
- [x] Content pillar present (three lines; no encounter prose, with reason)
- [x] UI pillar present (S2, two surfaces, Laws named)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It adds no god verb and no decider; it gives the existing Temple content, pilgrimage encounter, cultural tension and holding systems more of the world to act on, which is the living-world map's destination.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss).
- [x] Not applicable: no rulebook edit is owed. It changes what a new world contains at game start, not how turns, verbs, prerequisites, resources, encounters, clocks or win/loss work.

> Brainstorm companion: `Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | every count, range, strength and bias is in the block or the constants table; the block exists so a scenario is a number change |
| 2. Inspectability | PASS | one aggregate trace lists every skip by id; `getWorldScenario()` reads the same selector as the census |
| 3. Determinism | PASS with note | own stream for the top-up; fringe and routes are draw-free; the default world changes for every seed (stated), and the all-"today" setting reproduces today's graph (tested) |
| 4. Fail-soft | PASS | § Fail-soft; every step degrades to "fewer", never throws |
| 5. Narrative over mechanical perfection | PASS | faiths belong to peoples, holy places stand in their lands, pilgrims walk to each capital, and the wild stays wild |
| 6. Additive over destructive | PASS | new module, new properties, a new optional parameter; the stranded legacy writer is left, not deleted |
| 7. Performance budget | PASS with note | ≤ 2 extra factions, ≤ 10 extra halls, ≤ 6 extra Locations, fringe links on tens of settlements; worldgen-only writers; measured against the +10% line in S1 |

## Done when

S1 (this ticket):

- [ ] the census reader `Docs/audits/2026-09-25-living-world-data/readers/faith.ts` reports on seeds 42 and 99: one congregation per living culture, each seated at its culture's capital with every hall on its heartland; ≥ 2 holy places on every culture's heartland (or `shortBy` in the trace with the reason); fringe links on settlements within range and none on ruins, lairs or wonders; every town guild labelled; one pilgrim route per congregation; unheld settlements within one of the before count; before/after in the PR body;
- [ ] tests: determinism (same seed → identical census); the all-"today" block reproduces today's t0 graph; the knob-0 Temple is today's single instance; every congregation has dispositions; a Temple reputation effect lands on the actor's own congregation; a fringe link never enters `locationCultureMap` (no promotion, no Realm control change);
- [ ] a 200-tick run on a generated world (heavy lane) shows `encounter.pilgrimage_trial` offered at a capital, and the cultural convergence mandate incomplete at t0;
- [ ] steady-state tick cost within the kill line, same-session baseline, numbers in the PR body;
- [ ] interface-map rows updated or registered as in § Interface impact; the world-objects Route row corrected; the Design Reference Wiki pages `factions-cultures-reference.html` and `run-lifecycle-reference.html` updated; UL entries **Congregation** and **Fringe** landed as seated in [the glossary proposal](https://linear.app/threadbare/issue/THR-1661) (seated by delegation 2026-09-28), with a line-anchored close keyword for that proposal in the closing commit;
- [ ] `npm test`, `npm run test:heavy`, `npm run check:typecheck`, `npx vite build` pass; 30-tick CLI engine smoke;
- [ ] the closing commit body has a line-anchored close keyword for this ticket;
- [ ] `Browser-verify exempt: engine and data only; the faction page and hex panel lines ship in S2`.

S2 ([the player sees faith and fringe](https://linear.app/threadbare/issue/THR-1659)): UI items 1–2 with the four-part browser evidence at 1920×1080 on `?view=game&seeded&size=medium`, and `getWorldScenario()` as the state assertion.

## Coordination block

**Suggested model:** opus. A worldgen change that shifts every seed's world, an instance override inside faction seeding, and a culture writer whose readers span 26 files.

**Parallel-safe with:** [THR-1633](https://linear.app/threadbare/issue/THR-1633) slices (encounter shortlist, movement; `encounterFilterPipeline.ts`), [THR-1657](https://linear.app/threadbare/issue/THR-1657) (`ambitionTick.ts`/`worldPast.ts` minting; no worldgen seeding file overlap).

**Mutex with:** [THR-1654](https://linear.app/threadbare/issue/THR-1654) (both change who holds settlements at t0: congregations co-hold capitals, and notables join the settlement's holder; land one after the other so the second PR's census covers the first); [THR-1656](https://linear.app/threadbare/issue/THR-1656) (both read settlement culture on the settlement page; S1 changes what it returns); [THR-1636](https://linear.app/threadbare/issue/THR-1636) once handed off (both likely edit `worldSeed.ts` seeding passes).

**Files to touch:** (S1)

- Create: `src/data/world-scenario.ts`, `Docs/audits/2026-09-25-living-world-data/readers/faith.ts`
- Edit: `src/engine/gameInit.ts` (optional parameter, pass-through), `src/engine/worldgen/types.ts` + `passes/pass01-provinces.ts` + `hexGrid.ts` (wilderness counts), `src/engine/worldSeed.ts` (top-up, fringe pass, congregation seat/rename, routes), `src/engine/factionSeeding.ts` (instance plan, dispositions for every instance), `src/engine/guildSeeding.ts` (labels), `src/engine/cultureGenerator.ts` (strength/fringe option; congregation culture), `src/types/culture.ts` (`fringe?`), `src/types/gameState.ts` (`worldScenario?`), `src/debug-bridge.ts` + `.d.ts`, `scripts/interface-contracts.ts`, `Docs/canon/interface-map.md`, `Docs/canon/world-objects.md`, `Docs/ubiquitous-language/` (Factions and Culture entries), the two wiki pages

## Notes for the executor

- **"Chapter" in code comments is the code word; "congregation" is the game word.** `factionMembership.ts:86-98` already says *chapters share a `factionDefId`* for multi-instance factions. Leave those comments alone; use *congregation* in anything a player reads, in the UL entry and in new identifiers (`TEMPLE_CONGREGATIONS_PER_CULTURE`).
- **Keep fringe links out of `locationCultureMap`.** That map drives the promotion pass and Realm `controls`; a fringe town entering it would be promoted and annexed. The test for this is in Done-when.
- **Exclude historical cultures** when counting living ones: `hist_culture_*` nodes are also `actorType:'culture'`.
- **Keep the numeric instance suffix.** `seedFactionDispositions` and `FactionSheet.tsx:72` parse `faction_def_(.+?)(?:_\d+)?$`; a culture-id suffix would break both.
- **Draw every roll in a fixed order** (cultures in id order, candidates in shuffled order) so a later change to one culture's ground does not move another's.
- **Re-baseline in the same session.** Tick cost swings on unchanged `main` (77–144 ms/tick this week in the briefing).
- **Do not delete the legacy sacred-route template.** Its fate belongs to the deferral that designs the faith cell.

## Forked-audit verdicts

**Intent judge (fable), 2026-09-28: Allow.** Class confirmed Reversible. More than 40 file:line citations spot-checked against `origin/main`, none false. One GAP (UL): new terms were to be added directly rather than through a UL proposal, and the code word *chapter* for multi-instance factions (`factionMembership.ts:86`) was unmentioned. Folded in before merge: [the glossary proposal](https://linear.app/threadbare/issue/THR-1661) filed and seated by delegation, and an executor note on the two words. Its second note (disposition *targets* toward the Temple resolve to the first instance only) is answered in § S1b item 4.

*Generated by design-audit-pipeline — 2026-09-28*

### NFP audit

PASS-with-notes. Tunability, Inspectability, Fail-soft, Narrative and Additive: PASS (seven named knobs plus a full constants table; one aggregate trace with a per-skip reason; seven fail-soft cases; the legacy template kept). Determinism: PASS-with-note (own stream for the top-up, draw-free fringe and routes, the default world changes per seed as stated, and the all-"today" block is test-pinned). Performance: PASS-with-note (bounded additions and a +10% kill line with a named mitigation, but the measurement is S1's job, not yet in hand).

### Three-pillar audit

PASS-with-notes. Engine, Content and UI are present and substantive. The Engine and UI pillars sit under slice headings (S1a–S1f, S2) rather than the template's literal subsection names; event notifications were unstated and are now stated N/A (UI item 3). The wiring table connects every module to phase, component, state, trace and debug lever. The substrate inventory matches `systems-inventory.md`; the stranded sacred-route writer is correctly **activated**, not rebuilt. No green-field duplication.

### Vision audit

PASS. No contradictions. The plan confirms narrative over mechanical perfection and graph purity (a congregation's culture is an edge), keeps the fringe's strength off screen per the numbers-in-UI anti-pattern, adds no god verb and no decider, and leaves the scan → encounter → aftermath loop untouched.