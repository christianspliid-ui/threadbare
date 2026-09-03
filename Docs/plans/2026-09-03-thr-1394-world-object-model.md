> **title:** `The world-object model — THR-1394`
> **linear_issue:** THR-1394
> **author:** `Claude Code`
> **created:** 2026-09-03
> **three_pillars:** Engine `done — one registry of world-object kinds in game words, projecting onto WorldRefKind, a node schema beside the edge schema, a generated canon page and a build gate that fail on drift` · Content `done — three phantom target names leave content, items stamp their category, events carry one kind key; UL terms proposed` · UI `done — the generated catalogue is a served Design Reference Wiki page, browser-verified; no game surface changes`

# The world-object model — THR-1394

*The undertaking redesign showed the tree had drifted from the objects that define the world: a verb was being drawn against "a room" and "an attachment", neither of which is a thing the game names. This plan ratifies the catalogue of world objects in game words, fixes the measured drift, and installs the mechanism that keeps the catalogue true afterwards.*

## Why this is load-bearing

Christian, chat, 2026-09-03, on seeing the verb × object grid: *"this shows that we are in fundamental trouble with the contents of the tree. we have drifted away from the fundamental graph objects that define our world model. the undertakings should interact with the world models fundamental objects. I have never heard of or designed a 'room' in this game … an item, a spell, a holding, a condition, all are attachments but they work very differently in the game."* And after the map: *"lets follow your recommendations … after that ensure that we have a mechanism to ensure that agents can stay in control of, adhere to, and cautiously expand this world model, to keep drift minimal and ensure that the world model stays understandable and easy to work with and connect."*

**The measurement** (seed 42, medium, tick 30; the review map is the *The World's Objects* artifact linked on THR-1394):

- One canonical source exists — the `NodeType` (15) and `EdgeType` (50) unions in `src/types/graph.ts` — and every page that describes it (`Docs/ubiquitous-language/Graph.md`, the vault's *World Graph*) speaks in code words. No page lists the objects as the game names them.
- The inner place tier is 764 of 1021 location nodes and has no game name; the code says *sublocation*.
- The `LocationSubtype` union is 50-odd members (the map's most common place, `elder_ruin` ×88, is one of them — an earlier reading of this session that called five of them undeclared was wrong and is retracted); no page groups them into the seven classes a designer thinks in, and content target rules name three subtypes no place carries (`market`, `port`, `trading_post` — in the merchant, court and warlord packs, in `ambition-templates.ts`, and in the cells' own `FOUND_SITE_RULE`; the `market` in `the-stones-judgement.ts` is a `sublocationTypeId`, a legitimate Place class, and must not be swept up).
- A kind vocabulary already exists and this plan must extend it, not duplicate it: `WorldRefKind` (`src/types/worldRef.ts`, THR-1212) is "the kind vocabulary — every other union is validated as a projection of it", the anchor catalog (`scripts/generate-anchor-catalog.ts`) fails by name on an unannotated member, and the UL carries it. It names thirteen chip-addressable kinds in UI words (`agent`, `faction`, `location`, `sublocation`, `hex`, `artifact`, `attachment`, `companion`, `army`, `encounter`, `journey`, `receipt`, `codex`); it does not name Area, Route, Condition, Agreement or Standing, and it keeps `attachment` as one kind — which is the abstraction Christian rejected.
- "Attachment" is eight categories in three graph shapes (artifact node · trait node · edge · own node type · owns-edge plus a mirror artifact); 0 of 139 seeded possessions carry `attachmentCategory`.
- `resource` has no writer in `src/`; `cosmology` nodes are never minted (spheres live on `GameState.cosmology`); `relationship` nodes (0) duplicate `relates_to` edges (58); events carry their kind under `eventType` and, for quests and bounties, `nodeSubtype`.
- Trait nodes are mostly shared definitions (10 cultural traits → 450 bearers) with per-bearer state on the `has_trait` edge, but conditions (70 nodes → 7 bearers) and experience (44 → 44) are minted one node per bearer. Tags exist on all 211 trait nodes and on no actor or location.

Nothing above is a crash. All of it is the kind of drift no gate sees, and the undertaking grid is the first design that broke on it.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| World Graph — `src/types/graph.ts` unions, `WorldGraph` | 🟢 ACTIVE | **extends** — the registry projects the unions into kinds; `resource` and `relationship` retire with their readers repointed, `cosmology` goes DORMANT (retires only if `contextBuilder` repoints green) |
| WorldRef / anchor catalog — `src/types/worldRef.ts` (`WorldRefKind`, `WORLD_REF_KINDS`), `scripts/generate-anchor-catalog.ts` + `scripts/anchor-catalog-sources.ts` (union parser, annotate-or-fail guard), THR-1212 | 🟢 ACTIVE | **extends** — every registry kind names the `WorldRefKind` it projects to (or `null` for a kind no chip addresses yet); the generator reuses the anchor catalog's union parser; a test pins that every non-reserved `WorldRefKind` is claimed by a kind. One vocabulary, two views: WorldRef answers "where does a chip route", the registry answers "what is it and what may it be" |
| Edge schema — `src/types/edgeSchema.ts` (`EDGE_SCHEMA`, dev-mode `addEdge` validation) | 🟢 ACTIVE | **mirrors** — a `NODE_SCHEMA` beside it, same flags, same warn-not-throw posture |
| Sublocation shape — `src/engine/sublocationShape.ts` | 🟢 ACTIVE | **renames** — the helpers take the game words (Location tier / Place) |
| Systems inventory generator — `scripts/generate-systems-inventory.ts` (curated registry + mechanical layers + `--check`) | 🟢 ACTIVE | **is the template** for `generate-world-objects` |
| Generated-freshness gate — `scripts/check-generated-freshness.ts` `EXTERNAL_GENERATED_ARTIFACTS` | 🟢 ACTIVE | **extends** — the new page registers there |
| Resource economy — `src/types/resource.ts`, `resourceEconomy.ts`, `resourceSeeding.ts` (stocks as location properties, `StockTier`) | 🟢 ACTIVE | **connects** — Deposit becomes a Location class over the existing subtypes; stocks stay properties |
| Routes — `road` edges, `trades_with` + route identity node, `sacred_route` | 🟢 ACTIVE | **normalizes** — one Route kind with subtypes; the identity-node pattern generalized |
| Traits — `has_trait`, trait subcategories, tag namespace (UL Traits) | 🟢 ACTIVE | **states the rule** (shared definitions, state on the edge) and files the condition/experience repair as its own ticket |
| Design Reference Wiki — `public/wiki-manifest.json`, hub + nav on build | 🟢 ACTIVE | **adds** the served catalogue page |
| Interface map — `scripts/interface-contracts.ts` | 🟢 ACTIVE | **adds** one row: registry → schema validation |

## Engine pillar

### Systems design

**A. The catalogue (the ratified decisions).** A world object is a node type plus a subtype the game names; a variant is a subtype or a tag, never a new node type.

| kind (game word) | kept as | classes / subtypes | decision recorded |
|---|---|---|---|
| **Area** | `region` node · `contains` → locations | by dominant terrain feature | geographic only; political territory stays a faction's `controls` edges |
| **Hex** | `GameState.tiles[]` | terrain, features | the settled exception; not a node |
| **Location** | outer-tier `location` | Location classes: settlement · stronghold · holy place · ruin · wild · wonder · **deposit** | nothing joins the union; the classes are a registry table over the existing subtypes, and deposit is the class over the six that already exist (`mining`, `gem_deposit`, `iron_seep`, `fossil_bed`, `pearl_shoal`, `herb_garden`) |
| **Place** | inner-tier `location` (`parentLocationId`) | Place classes: the nine `sublocation-type.*` categories | the game word for the inner tier; not always built (nature, borderlands) |
| **Route** | an edge between two locations, plus an identity `location` node once the route is nameable, ownable, blockadable or consecrated | road · trail · trade lane · pilgrim way · portal | traversal stays on edges; a portal is a route with an empty hex path and its own cost |
| **Mortal · Faction · Culture · Company · Army · Network** | `actor` by `actorType` / `groupKind` | roles, callings, stances | unchanged; Battle stays an engine detail |
| **Item** | `artifact` node · `possesses` | the seven possession subcategories; chart, masterwork, legendary as variants | every mint stamps `attachmentCategory: 'possession'` |
| **Holding** | the `owns` edge | — | ownership of a Location, Place or Route, not a thing; the mirror face is a sheet convenience and never a target |
| **Power** | `'spell'` · `'bestowed_power'` · innate | spell · bestowal · innate | the UL family; a node shape of its own is a later ticket (today a cast spell mints a condition) |
| **Condition** | `trait` subcategory `condition` / `scar` · `has_trait` with duration | wound · disease · strain · blessing · curse · scar | blessings and curses are signed conditions; **per-bearer state moves to the edge** (own ticket, see Done-when) |
| **Agreement** | `owes_favor` · `knows_secret_of` edges | favor · mark | both between two parties |
| **Standing** | `reputation_with` edge; `relates_to` edge | reputation · relationship | the `relationship` node (two readers, no writer) **retires with its readers repointed** at slice 2 — the resolver already falls back to `relates_to`; one shape from then on |
| **Trait** | shared `trait` definition nodes · `has_trait` state | the ten categories; tags refine traits | the taxonomy of adjectives; never per-bearer nodes |
| **Ambition · Undertaking · Event** | `ambition` node · runtime record · `event` node | — | events carry one kind key (`eventType`) |
| **Sphere · Reach** | `GameState.cosmology` · `ReachDomain` union | — | axes of the cosmos, not objects; the `cosmology` node type (two value-level reads in `contextBuilder`, no minter) is registered **DORMANT** at slice 1 and retires at slice 2 only if those two reads repoint at `GameState.cosmology` with their tests green |

**B. The registry** — `src/data/world-objects.ts`. One row per kind, and it is the only hand-maintained piece:

```ts
interface WorldObjectKind {
  id: WorldObjectKindId;            // 'place' | 'location' | 'route' | 'item' | …
  gameWord: string;                 // "Place"
  ulTerm: string;                   // the UL entry it points at
  /**
   * The WorldRefKind this kind projects to — the chip vocabulary (THR-1212). Many-to-one
   * is expected (Item and Legendary artifact → 'artifact'; Mortal → 'agent'); null for a
   * kind no chip addresses yet (Area, Route, Condition, Agreement, Standing). The test
   * pins the reverse: every non-reserved WorldRefKind is claimed by at least one kind, so
   * the two vocabularies cannot drift apart silently. WorldRefKind stays as it is; this
   * plan adds no member to it and retires none.
   */
  worldRef: WorldRefKind | null;
  shape:
    | { kind: 'node'; nodeType: NodeType; discriminator?: { key: string; values: readonly string[] } }
    | { kind: 'edge'; edgeType: EdgeType; identityNode?: { nodeType: NodeType; subtype: string } }
    | { kind: 'state'; path: string };   // GameState.tiles, GameState.cosmology
  classes?: Readonly<Record<string, readonly string[]>>;   // Location classes → subtypes; Place classes → type ids
  owningSystem: string;             // the systems-inventory subsystem
  writers: readonly string[];       // module names that mint one (the generator verifies each)
  status: 'live' | 'dormant' | 'retired';
}
```

`NODE_SCHEMA` (`src/types/nodeSchema.ts`) is derived from the registry at module load — per `NodeType`: the discriminator key, its legal values, required properties — and `WorldGraph.addNode` validates against it in dev mode the way `addEdge` validates against `EDGE_SCHEMA`, with two things the edge schema does **not** do and this plan adds as new work: the warning is **de-duplicated** — once per `(nodeType, discriminator value)` per session through a module-level set that `initializeGameState` clears (`WORLD_OBJECT_WARN_ONCE`; the edge schema warns on every violating call, which floods the console at the first repeated mint) — and `WORLD_OBJECT_THROW_ON_UNKNOWN` is actually consulted (`if (throwOnUnknown) throw else warn`; its edge-schema twin `GRAPH_SCHEMA_THROW_ON_UNKNOWN` is declared and never read).

**C. The guard — four mechanisms, one source.**

1. **The generated catalogue** — `npm run generate-world-objects` writes `Docs/canon/world-objects.generated.md` from the registry plus a headless census (`WORLD_OBJECT_CENSUS_SEEDS`, `WORLD_OBJECT_CENSUS_MAP`, `WORLD_OBJECT_CENSUS_TICKS`): per kind and class, the count on each seed, the writers actually found, the edge types in use, and a badge — **LIVE** (minted on a census seed), **DORMANT** (registered, writer found, zero minted), **UNREGISTERED** (a discriminator value the world wrote that no kind claims), **PHANTOM** (a value content targets that no kind claims), **RETIRED**. `--check` exits non-zero on any UNREGISTERED or PHANTOM row above `UNREGISTERED_SUBTYPE_MAX` / `PHANTOM_TARGET_MAX` (both 0). Registered in `EXTERNAL_GENERATED_ARTIFACTS`, so `check:generated-freshness` — already in the required CI check — fails a PR that changes a writer without regenerating.
2. **The schema at the write** — `NODE_SCHEMA` in `addNode`, so an unregistered subtype is named in the console the tick it is first written, with the writer's node id — once per session per (type, value), so a repeated mint is one line, not a flood.
3. **The contract test** — `src/data/__tests__/worldObjects.test.ts`: every `NodeType` and `EdgeType` member is claimed by exactly one kind or listed as retired; every `LocationSubtype`, `sublocation-type.*` id, `GroupKind`, `ActorType`, `AttachmentCategory`, trait subcategory and event kind appears in a class list; every registry writer resolves to a module that exists; the seeded world (small, 20 ticks — the fast lane) writes no unregistered value.
4. **The process rule** — a new kind, class or subtype is a registry row **and** a UL term **and** a row on the canon page, in one PR; a new node or edge type keeps the existing load-bearing rule (full design before code) and additionally names its kind. `Docs/canon/world-objects.md` becomes the Step-0 load for any Engine-pillar work that touches nodes or edges (CLAUDE.md canon table, the `state-of-game-design` router, `Docs/canon/engine.md`).

Why generated, not hand-written: the systems inventory exists because hand-written canon drifted the way this world model drifted (THR-614); a page assembled from the registry and a census cannot describe a world that is not there. The generator reads the unions through `scripts/anchor-catalog-sources.ts`, the parser the anchor catalog already trusts, rather than a second parser — and the contract test's first assertion is that the registry and `WORLD_REF_KINDS` cover each other.

### Graph nodes / edges

No new node type. Three union members have no production writer; the grep of their readers is already done and the outcome per member is decided here, not left to the executor:

- `resource` — readers: `src/components/shared/entityVisualResolver.ts:124` (`case 'resource'`), `src/engine/phaseComposition.ts:37`, `src/types/targetContext.ts:42`, two `EDGE_SCHEMA` rows (`edgeSchema.ts:110,119` list it as a target type), test fixtures in `graphQueries.test.ts`. **Retire with repoint:** delete the case, the list entry, the union member and the schema rows; rewrite the fixtures onto a Deposit location. No behaviour changes — nothing ever minted one.
- `cosmology` — readers: `src/engine/contextBuilder.ts:178,189` read `node.type === 'cosmology'` with `sphereType`; tests mint them (`contextBuilder*.test.ts`, `proseGenerator.test.ts`, `traceBuffer-context.test.ts`). Spheres are state (`GameState.cosmology`), and Christian ratified them as axes, not objects. **Registered DORMANT in slice 1; retired in slice 2 only if the two `contextBuilder` reads can be repointed at `GameState.cosmology` with their tests green — else it stays DORMANT with the reads named on the page.**
- `relationship` — readers: `src/engine/encounters/relationshipResolver.ts:45` (already falls back to `relates_to`), `src/components/Game/debug/EncounterCacheView.tsx:243`; one test writer (`relationshipResolver.test.ts:19`). **Retire with repoint:** the resolver reads `relates_to` only, the cache view drops the node listing, the type `RelationshipNodeProperties` goes, the test rewrites onto the edge.

`sublocation` stays reader-accepted legacy. New edge property: `routeKind` on `road` (`road | trail | portal`), with the trade route's identity-node pattern documented as the way any route becomes ownable. Rename in `sublocationShape.ts`: `isPlaceTierLocation` → `isLocationTier`, `getPlaceTierLocations` → `getLocationTierNodes`, `isSublocationNode` → `isPlaceNode`, `getSublocationNodes` → `getPlaceNodes` (34 files in all including `scripts/anchor-catalog-sources.ts` and `scripts/undertaking-live-proof.ts`; a codemod over `src/` and `scripts/`, the old names kept as deprecated aliases for one release).

### Tick phases

None. The schema check runs inside `addNode`; the census is a script.

### Resolution logic

None.

### PRNG callouts

None. The census uses the seeded worlds; the generator is deterministic for a given registry and seed.

## Content pillar

### Encounter templates

The three phantom target names leave content: `market` → `town` (the market is a Place class inside it), `port` → `city` or a coastal tag once the union has one, `trading_post` → `hamlet` — in `merchantStrategicPack.ts`, `courtStrategicPack.ts`, `warlordStrategicPack.ts:251`, `ambition-templates.ts:148` (`locationType: 'market'`) and the cells' own site rules, `undertaking-cells.ts` `FOUND_SITE_RULE` (room and route name `market`, `port`, `trading_post`) — edited in slice 2 as a three-name substitution, which is why the Interface impact table does not treat the cells as untouched. The contract test checks every `location_subtype` target rule and every ambition `locationType` against the union; it does **not** check `sublocationTypeId` values against it (a `market` sublocation is a Place class, and legitimate).

### Prose tables

N/A — no prose changes; the game words are already the words prose uses (settlement, ruin, road, item).

### Attachment content

Every possession mint stamps `attachmentCategory: 'possession'` (the seeded 139 carry none); holding faces keep `'holding'`. `Docs/canon/attachments.md` gains a pointer to the catalogue and the sentence *"attachment is the code umbrella; the game words are Item, Condition, Power, Agreement, Companion, Holding"*.

### Data tables

Events: `faction_quest` and `bounty` move from `nodeSubtype` (`phaseFactionActions.ts:288,635`) to `eventType`, the key every other event writer uses; the readers move with them — `phaseFactionActions.test.ts:137` asserts the old key, and the three `edgeSchema.ts` descriptions (lines 466, 474, 483) name it. UL proposal (one `UL-proposal` issue): **Area**, **Location**, **Place**, **Location class**, **Place class**, **Route** (with its five subtypes), **Deposit**, **Standing**, **Item**; existing entries **Sublocation**, **Three-tier Position Model** and **Attachment** re-pointed. The vault's *World Graph* page gains the game-word table; the vault *Locations* and *Regions* folders are bannered as pre-catalogue history.

## UI pillar

### Player-facing display

N/A — no game surface changes. (The Package View's *The object* block is re-drawn when THR-1392 resumes on the catalogue.)

### Event notifications

N/A — no new player-facing event kind; the write-time check reports to the console and the census to a page.

### Debug inspection (DebugPanel)

The CLI gains `objects` — the census table for the running world (kind · class · count · unregistered values), so a session can ask "what does this world contain, in game words" without a script.

### Visual presence (HexMapV2)

N/A — no hex-layer signifier changes; Area, Location and Place are the tiers the map already draws.

**Wiki page.** `public/world-objects-reference.html` — a served Design Reference Wiki page rendered from the same registry (registered in `public/wiki-manifest.json` with `sources: ['src/data/world-objects.ts', 'src/types/graph.ts', 'src/types/index.ts']`, so the freshness gate binds it). Browser-verify: Playwright DOM at 1920×1080 on the served page; Laws 13/14 (words, never numerals beyond the census counts, which are counts), 17 (every kind links to its UL entry), 33, 37.

## Wiring

| module | orchestrator | UI | GameState | traces | debug | prose | player controls |
|---|---|---|---|---|---|---|---|
| `src/data/world-objects.ts` | — | wiki page reads it | — | — | CLI `objects` | — | — |
| `src/types/nodeSchema.ts` | `WorldGraph.addNode` dev-mode validation (every phase that mints a node) | — | — | console warn once per (type, value) | — | — | — |
| `scripts/generate-world-objects.ts` | headless census via `initializeGameState` + `runTick` | — | — | — | `check:generated-freshness` | — | — |
| `src/data/__tests__/worldObjects.test.ts` | — | — | — | — | fast lane | — | — |
| `Docs/canon/world-objects.md` | — | — | — | — | Step-0 load, CLAUDE.md canon table | — | — |

Wiring checklist: `Docs/plans/wiring-checklist.md` — the generator, the gate registration, the wiki manifest row, the canon table row, the interface-map row (`world-object-registry`: registry → node schema; producer World Graph, consumer every minting phase).

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `WORLD_OBJECT_VALIDATION_ENABLED` | `true` | dev-mode `addNode` validation against `NODE_SCHEMA` (mirrors `GRAPH_SCHEMA_VALIDATION_ENABLED`) |
| `WORLD_OBJECT_THROW_ON_UNKNOWN` | `false` | when true, `addNode` throws on an unregistered value instead of warning; consulted by the check (unlike its unread edge-schema twin) — a test lever, never a production default (NFP #4) |
| `WORLD_OBJECT_WARN_ONCE` | `true` | de-duplicate the write-time warning per `(nodeType, value)` per session; the set clears in `initializeGameState` |
| `WORLD_OBJECT_CENSUS_SEEDS` | `[42, 99]` | the worlds the generator counts |
| `WORLD_OBJECT_CENSUS_MAP` | `'medium'` | the generator's map |
| `WORLD_OBJECT_CENSUS_TICKS` | `30` | ticks before the count (past worldgen and the first re-decisions) |
| `WORLD_OBJECT_TEST_TICKS` | `20` | the fast-lane test's smaller world (small map) |
| `UNREGISTERED_SUBTYPE_MAX` | `0` | discriminator values the world may write outside the registry before `--check` fails |
| `PHANTOM_TARGET_MAX` | `0` | subtype names content may target that no kind carries |
| `ROUTE_KINDS` | `['road', 'trail', 'trade_lane', 'pilgrim_way', 'portal']` | the Route subtypes |

## Tracing

N/A — no new trace category. The write-time check reports through `console.warn` — once per `(nodeType, discriminator value)` per session, a de-duplication the edge schema lacks and this plan adds — and the census through the generated page. A `world_object_unregistered` trace category is deliberately not added: the value is already named at the write, and the page is the durable record (NFP #2 is served by the page, not a ring entry).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| A node is minted with an unregistered subtype | dev warn once, node added; `--check` fails at the next generate |
| The registry names a writer module that does not exist | generator marks the row `writer missing`; `--check` fails |
| The census world fails to build (worldgen throws) | generator writes the page from the registry alone with every badge `UNMEASURED` and exits 2 |
| Content targets a subtype no kind carries | contract test fails; the generator lists it PHANTOM |
| A saved world carries the legacy `sublocation` type | still read (THR-1177); the registry lists it retired-readable |
| `NODE_SCHEMA` derivation throws at load | validation disabled for the session with one warn; the graph is unaffected |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/graph.ts` | hundreds | additive: `routeKind` property doc; `resource` and `relationship` removed with every reader named in § Graph nodes / edges repointed in the same PR; `cosmology` removed only on the green-repoint condition |
| `src/engine/sublocationShape.ts` | 34 files naming the four helpers (two under `scripts/`) | rename with deprecated aliases kept one release; codemod |
| `src/engine/graph.ts` | hundreds | one call in `addNode`, behind a flag, warn-only |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Interface impact

| Contract | Disposition |
|---|---|
| new: `world-object-registry` — the registry → `NODE_SCHEMA` → `addNode` validation, read by every minting phase | add — producer World Graph, consumers every phase that mints a node; write site `src/data/world-objects.ts`, read sites `src/engine/graph.ts`, `scripts/generate-world-objects.ts` |
| `sublocation-shape` (the THR-1183 single-shape reads: `isSublocationNode` / `getPlaceTierLocations`) | preserve, renamed — same predicates under the game words with deprecated aliases; every importer keeps compiling |
| `factory-pack-registry`, `undertaking-object-types` | preserve — THR-1392's registry is redrawn on this catalogue when it resumes; the only edit here is the three phantom names in `FOUND_SITE_RULE`, substituted for subtypes the world carries |
| trade route identity node (`trades_with` + `ROUTE_IDENTITY_SUBTYPE`) | preserve, documented as the Route identity pattern; `routeKind` is additive on `road` |
| resource economy (`readResources`, stock tiers on location properties) | preserve — Deposit is a class over existing subtypes; stocks stay where they are |
| Attachments, Items & Possessions (`possesses` writers in `holdings.ts`, `strategicGraphOps.ts`, `rewardPool.ts`, `resourceSeeding.ts`) | extend — every possession mint stamps `attachmentCategory: 'possession'`; no read site changes, every existing reader that keys on the category gains the seeded 139 it could not see |
| `relates_to` / `reputation_with` | preserve — Standing names them; the unused `relationship` node retires |

## Vision audit

- [x] `00-north-star.md` — served indirectly, as scaffolding: nothing here reaches a session, but the objects a mortal acts on must be nameable before THR-1392 can land the undertakings the seventh hour needs. Confirmed, not changed.
- [x] `01-core-loop.md` — scan → moment → aftermath untouched; nothing here reaches a player surface.
- [x] `02-non-negotiables.md` §4 *everything is a graph node/edge* — upheld and strengthened: two union members with no world behind them retire, and a new kind cannot exist without a registry row; mortal sovereignty untouched.
- [x] `03-design-tensions.md` — Tension 4 (mechanical legibility vs. narrative mystery) is the nearest named tension and this plan sits outside it: the legibility gained is the engine's model becoming legible to designers and agents, not the player's model of the world becoming over-solved. No player surface changes.
- [x] `taste-profile.md` words-never-numbers — the catalogue's keys are game words; the one place numerals appear is the census on a Design Reference Wiki page, a dev-facing surface with the systems-inventory and UL-dashboard precedent, never a game surface. No Vision edit.

## Rulebook impact

- [x] No rule of play changes. The rulebook's nouns (settlement, road, item, company, faction, reputation) are the catalogue's words already; §10 economy references "resource stocks", which the catalogue keeps as properties of a Location.
- [x] `Docs/canon/rulebook.md` gains one pointer line to the catalogue under the world section; no `[IMPL]/[DESIGN]/[OPEN]` marker changes.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | nine named constants; the registry is data, the schema is derived from it |
| 2. Inspectability | PASS | the generated page and the CLI `objects` readout say what the world contains and where it drifted, per kind and class |
| 3. Determinism | PASS | census on fixed seeds; the generator is deterministic for a registry and a seed |
| 4. Fail-soft | PASS | warn-not-throw at the write; every generator failure degrades to a page with badges, never a missing file |
| 5. Narrative over mechanical perfection | PASS | game words are the catalogue's keys; numerals appear only as census counts on a reference page |
| 6. Additive over destructive | PASS with note | two retirements with every named reader repointed in the same PR; `cosmology` DORMANT unless its repoint is green; the helper rename keeps deprecated aliases for one release |
| 7. Performance budget | PASS | one map lookup per `addNode`, dev mode only; measured against `measure:tick-cost` before merge (kill criterion in the proposal) |

## Kill criteria

- The census on seeds 42 and 99 reports any UNREGISTERED value after slice 2 → the registry is incomplete; slice 2 does not merge.
- The `addNode` check costs more than 1 ms per tick on the seed-42 small `measure:tick-cost` run in dev mode → gate it harder or move it to the generator only.
- A `contextBuilder` repoint for `cosmology` cannot keep its tests green → the member stays DORMANT, named on the page; it is never deleted with a red test.
- The registry and `WORLD_REF_KINDS` stop covering each other → the contract test fails; neither list is edited to make it pass without the other.

## Done when

- [ ] **Slice 1 — the catalogue and the guard.** `Docs/canon/world-objects.md` (hand-written: the rule, the kinds in game words, the decisions above, pointers) and `Docs/canon/world-objects.generated.md` (the generator's census); `src/data/world-objects.ts`; `src/types/nodeSchema.ts` wired into `addNode`; `scripts/generate-world-objects.ts` with `--check`, registered in `check:generated-freshness`; `worldObjects.test.ts`; the served wiki page and its manifest row; CLAUDE.md canon table row; `Docs/canon/engine.md` and the `state-of-game-design` router point at it; the UL-proposal issue filed; the interface-map row.
- [ ] **Slice 2 — the cheap drifts.** The three phantom targets leave content; possessions stamp their category; events carry one kind key; `resource` and `relationship` retire with their readers repointed; `cosmology` retires only if its two `contextBuilder` reads repoint green, else stays DORMANT; `routeKind` on `road`; the `sublocationShape` renames with aliases. `generate-world-objects --check` passes with zero UNREGISTERED and zero PHANTOM on both census seeds.
- [ ] **Deferral filed with its coordination block:** conditions and experience become `has_trait` edge state on shared definitions (touches `gameInit`, `spellActivation`, `capabilityGrowth`, `rewardPool`, the effect walker).
- [ ] **THR-1392 un-parked** with its registry redrawn on the catalogue (room → Place; settlement → Location with classes; attachment → Item · Condition · Power · Agreement; mark → Agreement; Standing added).
- [ ] `npm test`, `test:heavy`, build, ratchet, CLI smoke; Playwright 1920×1080 on the served page.
- [ ] Closing commit body includes `Fixes THR-1394`.

## Coordination block

**Suggested model:** `opus` — a registry, a schema, a generator with a census and a codemod rename across 34 files; the judgment is in the catalogue rows, which are ratified.

**Parallel-safe with:** anything outside `src/types/graph.ts`, `src/types/index.ts`, `src/engine/sublocationShape.ts` and the docs generators.

**Mutex with:** THR-1392 slice 4 (parked on this — it redraws its registry on the catalogue); any ticket editing `src/types/graph.ts` unions or `sublocationShape.ts` (the rename touches 34 files); THR-1212 follow-ups that edit `WorldRefKind` (the registry projects onto it).

**Files to touch:**
- Create: `Docs/canon/world-objects.md`, `Docs/canon/world-objects.generated.md`, `src/data/world-objects.ts` (importing `WorldRefKind`), `src/types/nodeSchema.ts`, `scripts/generate-world-objects.ts` (reusing `scripts/anchor-catalog-sources.ts`), `src/data/__tests__/worldObjects.test.ts`, `public/world-objects-reference.html`
- Edit: `src/engine/graph.ts` (addNode), `src/types/graph.ts`, `src/types/edgeSchema.ts` (the two `resource` target rows), `src/types/targetContext.ts`, `src/components/shared/entityVisualResolver.ts`, `src/engine/phaseComposition.ts`, `src/engine/contextBuilder.ts` (the two `cosmology` reads, if repointed), `src/engine/encounters/relationshipResolver.ts` + its test, `src/components/Game/debug/EncounterCacheView.tsx`, `src/engine/phaseFactionActions.ts` + `phaseFactionActions.test.ts:137` (the `nodeSubtype` key and its assertion), `src/data/strategic-packs/warlordStrategicPack.ts:251`, `src/data/undertaking-cells.ts` (`FOUND_SITE_RULE` phantom names), the test fixtures minting `resource` / `cosmology` nodes (`graphQueries.test.ts`, `contextBuilder*.test.ts`, `proseGenerator.test.ts`, `traceBuffer-context.test.ts`), `src/engine/sublocationShape.ts` (+ its 34 referencing files via codemod, `scripts/` included), `src/data/ambition-templates.ts:148`, `src/engine/holdings.ts` / `strategicGraphOps.ts` / `rewardPool.ts` / `resourceSeeding.ts` (category stamp at every possession mint), `src/engine/phaseFactionActions.ts` (event kind key), the three packs naming phantom targets, `scripts/check-generated-freshness.ts`, `public/wiki-manifest.json`, `scripts/interface-contracts.ts`, `CLAUDE.md` (canon table), `Docs/canon/README.md` (index row), `Docs/canon/engine.md`, `Docs/canon/attachments.md`, `Docs/ubiquitous-language/Graph.md`, `.claude/skills/state-of-game-design/SKILL.md`, `package.json`

## Notes for the executor

- The registry is the one file a designer edits. If a change needs a second hand-edited list to agree with it, that second list is the next drift; derive it.
- The reader grep for `resource`, `cosmology` and `relationship` is done and its outcome is in § Graph nodes / edges; do not re-litigate it — repoint the named readers in the same PR as the removal, and if a `cosmology` repoint cannot keep its tests green, leave the member DORMANT and say so on the page.
- The rename is mechanical but wide: keep `isPlaceTierLocation` and friends as deprecated re-exports for one release so an open branch does not break, and delete them in the following retro.
- The census must be a *real* seeded world, never a fixture (`reference_vacuous_probe_empty_population`): an empty population passes every "no unregistered value" check for free.

## Intent-judge verdict

**Pass 1 (fable, 2026-09-03): Revise** — the plan had ignored the existing kind vocabulary (`WorldRefKind`, THR-1212) and mis-measured the location subtypes; nine further findings. **Pass 2: Revise** — all ten addressed at their sites; eight consistency residuals. **Pass 3: Allow.** Seven of the eight residuals fixed and verified against the worktree: the Location row no longer adds subtypes to the union; `resource`/`relationship` retire with readers repointed and `cosmology` goes DORMANT (retiring only if `contextBuilder.ts:178,189` repoint green) — stated consistently across the catalogue, Substrate, Blast Radius, executor note, Done-when and proposal; the phantom sweep names `warlordStrategicPack.ts:251` and `FOUND_SITE_RULE`; `nodeSubtype` readers are listed; the 34-file helper count includes `scripts/`; the Done-when closes via `Fixes`; proposal and plan are in sync. The four low residuals (a duplicated sentence, three stale phrasings) were fixed before this PR opened.

## Forked-audit verdicts

_(written by the three auditors before the plan-doc PR opens)_

### NFP audit

**PASS-with-notes** (sonnet, 2026-09-03). The plan's NFP table is broadly accurate — nine named constants, fixed-seed census, warn-not-throw posture, additive unions with grep-gated retirements. Two claims did not survive a check against the code the plan cites as its mirror: (1) `addEdge`'s dev-mode block warns on every violating call with no de-duplication, so "warn once per (type, value), as the edge schema does" was false — the plan now names de-duplication as new work with its own constant and reset policy; (2) `GRAPH_SCHEMA_THROW_ON_UNKNOWN` is declared and never read, so a mirrored flag would gate nothing — the plan now wires `WORLD_OBJECT_THROW_ON_UNKNOWN` into the check. Both corrections applied in the Engine pillar, Constants and Tracing sections.

### Three-pillar audit

**PASS-with-notes** (sonnet, 2026-09-03). Engine, Content and UI sections present and actionable; the Wiring table connects each module and cites the checklist; Done-whens are predicates (zero UNREGISTERED / PHANTOM on both census seeds, named values), with Playwright named for the served page and CLI/headless for engine and content; the coordination block carries reasons. Two UI subsections read bare `N/A` without rationale (Event notifications, HexMapV2) — fixed. The possession category stamp touches the audited *Attachments, Items & Possessions* subsystem with no row in the Interface impact table — a row added.

### Vision audit

**PASS-with-notes** (sonnet, 2026-09-03). Enabling infrastructure, not player-facing content: no scan → moment → aftermath change, no god/protagonist change, no numbers reaching a player surface; NFP #4 and #6 reinforced by grep-gated retirements and aliased renames. Two corrections applied: the plan's own audit named a tension ("legibility over realism") that `03-design-tensions.md` does not contain — Tension 4 (mechanical legibility vs. narrative mystery) is the nearest, and the plan now says it sits outside it; the north-star line now owns the work as scaffolding for THR-1392 rather than direct service; the words-never-numbers line now carries the census-counts caveat the UI pillar already stated.
