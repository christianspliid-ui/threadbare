# Ubiquitous Language — Graph

Not content-adjacent. Terms covering the world graph data model: nodes, edges, versioning, position, and cache architecture.

---

### Node

**Aliases:** Graph Node, World Node
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

The typed categories of nodes in the world graph: `actor`, `location`, `trait`, `artifact`, `artifact_legendary`, `resource`, `action_template`, `event`, `cosmology`, `region`, `ambition`. Do not invent new node types without verifying none of the existing types covers the concept. New types require full design before any code changes.

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

The spatial hierarchy: **hex → location → sublocation**. An agent always occupies exactly one tier via a single `located_at` edge pointing to the most specific node they occupy. Resolution upward: sublocation → parent location → hex. All systems needing spatial reasoning must resolve to hex level. An agent at a sublocation sees all encounters on their hex automatically.

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
