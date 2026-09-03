# Ubiquitous Language — Graph

Not content-adjacent. Terms covering the world graph data model: nodes, edges, versioning, position, and cache architecture.

---

### World Object

**Aliases:** World-object kind, Kind, Object kind
**Also see:** `[[Node]]`, `[[NodeType]]`, `[[Location]]`, `[[Place]]`, `[[Route]]`, `[[WorldRef]]`
**Status:** canonical

A kind of thing the world keeps, named in game words: a node type (or an edge type, or a slice of `GameState`) plus a subtype the game names. A *variant* is a subtype or a class, never a new node type. The registry is `src/data/world-objects.ts`; the catalogue and the one-PR rule for adding a kind (registry row + UL term + canon row) are `Docs/canon/world-objects.md` (THR-1394, ratified 2026-09-03). Every kind names the `[[WorldRef]]` kind it projects onto — the two are one vocabulary seen from two sides.

---

### Area

**Aliases:** Region (code word), `region` node
**Also see:** `[[World Object]]`, `[[HexTile]]`, `[[Location]]`
**Status:** canonical

A multi-hex cluster by dominant terrain feature, containing its Locations. Geographic only: political territory is a Faction's `controls` edges, never a second region kind. The code word is *region*; the game word is Area.

---

### Location

**Aliases:** Place-tier location, Settlement (one class of it)
**Also see:** `[[World Object]]`, `[[Place]]`, `[[Three-tier Position Model]]`, `[[Area]]`
**Status:** canonical

The outer place tier: a `location` node **without** `parentLocationId`, told apart by `locationSubtype`. Seven classes over the existing subtypes — settlement, stronghold, holy_place, ruin, wild, wonder, deposit — each a game word. Resources are stocks on a Location (`properties.resources`); Deposit is the Location class over the six extraction subtypes, and nothing mints a `resource` node.

---

### Place

**Aliases:** Sublocation (code word), `sublocation` (legacy node type, reader-accepted only)
**Also see:** `[[World Object]]`, `[[Location]]`, `[[Three-tier Position Model]]`
**Status:** canonical

The inner place tier — an inn, a granary, a gatehouse, a grove, a spring — inside a Location: a `location` node **with** `parentLocationId`, told apart by `sublocationTypeId`, classed by the sublocation tag (military, scholarly, arcane, commerce, religious, cultural, underworld, nature, authority, borderlands). Not always built, which is why it is not a *structure*; never a *room* (Christian, 2026-09-03). The code word stays *sublocation* (`src/engine/sublocationShape.ts`); the game word is Place.

---

### Route

**Aliases:** Road, Trade route, Pilgrim way, Portal
**Also see:** `[[World Object]]`, `[[Location]]`, `[[Edge]]`
**Status:** canonical

An edge between two Locations — `road`, `trades_with`, `sacred_route` — that traversal walks, and that grows an identity node (`location:trade_route` today) the moment it becomes nameable, ownable, blockadable or consecrated. Five ratified classes: road, trail, trade_lane, pilgrim_way, portal; a portal is a route edge with an empty hex path and its own cost. Trail and portal have no edge type yet (THR-1394 slice 2 adds `routeKind`).

---

### Node

**Aliases:** Graph Node, World Node, GraphNode
**Also see:** `[[Edge]]`, `[[WorldGraph]]`, `[[NodeType]]`
**Status:** canonical

A `GraphNode`: the basic entity in the world graph. Every entity in the game — agents, locations, traits, artifacts, encounters, cosmology nodes — is a node. Nodes have an id, type, name, and a properties bag. "Everything is a graph node" is a settled architectural decision; there are no separate relational tables.

---

### Edge

**Aliases:** Graph Edge, Relationship Edge
**Also see:** `[[Node]]`, `[[WorldGraph]]`, `[[EdgeType]]`
**Status:** canonical

A `GraphEdge`: a typed directed relationship between two nodes. Every meaningful relationship between entities is an edge — never a string ID field in a node's properties bag. Edges have an id, source, target, type, and a properties bag for relationship attributes.

---

### WorldGraph

**Aliases:** World Graph, Graph
**Also see:** `[[Node]]`, `[[Edge]]`, `[[worldVersion]]`
**Status:** canonical

The central data structure containing all nodes and edges. The world graph is mutated in place — its object reference never changes even when nodes/edges are added, removed, or updated. Any cache or memo that keys on `gameState.graph` identity will serve stale data. Use `worldVersion` and `structuralCacheVersion` instead.

---

### NodeType

**Aliases:** Node Category
**Also see:** `[[Node]]`, `[[ActorType]]`
**Status:** canonical

The typed categories of nodes in the world graph — the full union in `src/types/graph.ts` (15 types): `actor`, `location`, `trait`, `artifact`, `artifact_legendary`, `resource`, `action_template`, `event`, `cosmology`, `region`, `sublocation`, `ambition`, `encounter_template`, `relationship`, `companion`. `sublocation` is reader-accepted only (registered by THR-1177 for saved worlds; no producer writes it since THR-1183 — sublocations are minted as `location` nodes carrying `parentLocationId`). Do not invent new node types without verifying none of the existing types covers the concept — check the union itself, not this list, when in doubt. New types require full design before any code changes.

---

### EdgeType

**Aliases:** Edge Category, Relationship Type
**Also see:** `[[Edge]]`, `[[Property-vs-Edge Rule]]`
**Status:** canonical

The typed categories of edges. Key examples: `located_at` (agent → position), `has_trait` (actor → trait), `thread` (ascendant → mortal), `caused_by` (event → seed), `participated_in` (actor → event), `knows_secret_of` (discoverer → subject), `holds_place_of_power`. Check `src/types/graph.ts` for the complete list before adding a new edge type.

---

### Property-vs-Edge Rule

**Aliases:** Edge Rule, Relationship Encoding Rule
**Also see:** `[[Edge]]`, `[[EdgeType]]`
**Status:** canonical

The governing rule: relationships between entities are graph edges, never string ID fields in a property bag. Properties are for data internal to a node (scores, flags, statuses). If two entities have a meaningful relationship, it must be an edge type. Before adding a property to encode a relationship, justify why graph traversal isn't needed — the default answer is "it is needed."

---

### Three-tier Position Model

**Aliases:** Position Model, Spatial Hierarchy
**Also see:** `[[located_at Edge]]`, `[[Hex]]`, `[[Location]]`, `[[Sublocation]]`
**Status:** canonical

The spatial hierarchy: **hex → location → sublocation**. An agent always occupies exactly one tier via a single `located_at` edge pointing to the most specific node they occupy. Resolution upward: sublocation → parent location → hex. All systems needing spatial reasoning must resolve to hex level. An agent at a sublocation sees all encounters on their hex automatically. **The sublocation tier is one node shape** (THR-1183): a `location` node carrying `parentLocationId` — ask through `src/engine/sublocationShape.ts` (`isSublocationNode` / `getPlaceTierLocations` / `resolveToParentLocation`), never hand-roll the test; a bare `getNodesByType('location')` returns *both* tiers, so a sweep that means settlements must use `getPlaceTierLocations`.

---

### located_at Edge

**Aliases:** Position Edge, Location Edge
**Also see:** `[[Three-tier Position Model]]`, `[[EdgeType]]`
**Status:** canonical

The `located_at` edge connecting an agent to their current position in the three-tier model. An agent has exactly one `located_at` edge at any time. Changing an agent's position means removing the old edge and adding a new one. This is the authoritative source of agent position — do not store position as a node property.

---

### worldVersion / touchWorld()

**Aliases:** worldVersion, touchWorld
**Also see:** `[[WorldGraph]]`, `[[structuralCacheVersion]]`
**Status:** canonical

The version counter that increments on any meaningful graph mutation. UI selectors must depend on `worldVersion`, not on the graph object reference (which never changes). Call `touchWorld()` after every mutation that should trigger a UI update. `worldVersion` bumps nearly every tick during active simulation — that is intentional.

---

### structuralCacheVersion / touchStructure()

**Aliases:** structuralCacheVersion, touchStructure
**Also see:** `[[worldVersion]]`, `[[WorldGraph]]`
**Status:** canonical

The version counter for structural caches — the distance matrix and encounter cache. Call `touchStructure()` after mutations that affect structural relationships (e.g., location subtype changes, new locations). Intentionally over-invalidates for v1; split into finer-grained versions only after profiling reveals unnecessary rebuilds.

---

### SimulationRuntime

**Aliases:** Runtime, Session Runtime
**Also see:** `[[WorldGraph]]`, `[[structuralCacheVersion]]`
**Status:** canonical

The per-session owner of engine caches (encounter cache, distance matrix), version counters, and lazy rebuild logic. Owned by `useSimulation` and scoped to the current playthrough. Module-level singleton caches were rejected — they persist across game sessions without a full page reload. The SimulationRuntime pattern ensures each game session starts clean.

---

### GameState

**Aliases:** Game State, Session State
**Also see:** `[[WorldGraph]]`, `[[Cosmology Profile]]`, `[[HexTile]]`
**Status:** canonical

The per-session container for everything the simulation needs to advance one tick. Holds meta (`tick`, `cycle`, `phase`, `seed`), the world graph, the cosmology profile, all hex tiles, the simulation clock, the player's Ascendant identity and essence pool, the mandate, the doom track, encounter queues, and tick-event buffers. `GameState` is mutated in place by the orchestrator each tick; UI selectors read it via `worldVersion` rather than object reference. Definition: `src/types/gameState.ts`.

---

### HexTile

**Aliases:** Hex, Tile, Hex Cell
**Also see:** `[[Three-tier Position Model]]`, `[[TerrainType]]`, `[[GameState]]`
**Status:** canonical

One cell on the world's hex grid — the top tier of the three-tier position model. A `HexTile` carries its axial coordinate, geographic parameters (elevation, moisture, temperature), terrain biome, optional river flag, region assignment, plus mutable per-tick state: divine influence, corruption, exploration attraction, base terrain (for restoration), and positional danger. Stored in `GameState.tiles`. Agents resolve their hex by walking up the `located_at` edge chain to the first hex they reach.

---

### TerrainType

**Aliases:** Biome, Terrain Biome
**Also see:** `[[HexTile]]`
**Status:** canonical

The 42-value biome enum on every `HexTile.terrain`. Categories include water (`ocean`, `lake`, `river`, `reef`), lowlands (`grassland`, `farmland`, `savanna`), forest (`temperate_forest`, `dense_forest`, `boreal_forest`, `jungle`), wet (`swamp`, `marsh`, `moor_bog`), elevated (`hills`, `mountains`, `plateau`, `badlands`), special (`great_home_trees`, `broken_lands`, `oasis`), and extreme (`desert`, `tundra`, `glacier`, `volcano`). Used by encounter scoring, awareness rules, sublocation eligibility, and prose tier biasing. Definition: `src/types/index.ts`.

---

### WorldRef

**Aliases:** WorldRefKind, world reference
**Also see:** `[[Node]]`, `[[NodeType]]`, `[[claim-without-anchor]]`, `[[Consequence Chip]]`
**Status:** canonical

The normalised way anything in the game names a game-state object: a `kind` drawn from `WorldRefKind` plus the id that kind addresses. Thirteen kinds — `agent`, `faction`, `location`, `sublocation`, `hex`, `artifact`, `attachment`, `companion`, `army`, `encounter`, `journey`, `receipt`, `codex`. Definition: `src/types/worldRef.ts` (THR-1212 slice 1).

**It is the membership spine, not a replacement format.** Seven consumer vocabularies name world objects and disagree with each other — the graph says `actor` where every UI layer says `agent`; `faction` is type-illegal in `TargetCategory`; `attachment` is legal in the aftermath concept vocabulary and deliberately illegal in the visual resolver it feeds. `WorldRefKind` is *the* kind vocabulary, and the generated anchor catalog projects each consumer union against it, failing by name on an unmapped member. `NavigationTarget`, `EntityVisualRef` and the rest keep the shapes their consumers already speak (hub-and-spoke / strangler, NFP #6); what unified immediately is the kind vocabulary, not the wire shapes.

**Deliberately not called "anchor".** `EntityNotice` already owns that word on the interface side, and a second referent for it would collide on the surface where the distinction matters most. The violation class named for the missing referent keeps the anchor word (`[[claim-without-anchor]]`); the referent vocabulary itself is `WorldRef`.

**The module is import-free by construction.** It is a membership source parsed by `scripts/generate-anchor-catalog.ts`, and a generator that must resolve an import graph to read a union breaks when an unrelated module moves. Adapters live in `worldRefAdapters`, which may import freely.

`codex` is *reserved*, not live: `?view=codex` is a full-page navigation that tears down the running simulation, so no in-game codex destination exists for a link to open. `toNavigationTarget` returns `undefined` for it — the fail-soft every unroutable kind takes (NFP #4).
