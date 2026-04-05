# Graph Contract

> Added 2026-04-02. Source of truth: `src/types/graph.ts`, `src/types/edgeSchema.ts`, `src/engine/graph.ts`, `src/engine/graphQueries.ts`.
> Purpose: define how the live runtime graph is meant to be interpreted.

## Core Idea

The world is a typed property graph:

- nodes are entities
- edges are typed relationships
- node and edge properties carry most gameplay state

The runtime graph is implemented by `WorldGraph` in `src/engine/graph.ts` and is mutated in place.

## Node Families

The key node categories from `src/types/graph.ts` are:

- `actor`
  - includes `god`, `ascendant`, `faction`, `culture`, `group`, and `individual`
- `location`
  - includes hexes, locations, and sublocations via properties/subtypes
- `trait`
- `artifact` and `artifact_legendary`
- `resource`
- `event`
  - durable history/event records, not just UI events
- `ambition`

Important consequence:

- `node.type === 'actor'` does not mean "full agent"
- many engine systems still use `properties.actorType === 'individual'` as the participation gate

## Edge Semantics

Use the existing edge meaning, not a near miss.

### Spatial

- `contains`
  - region -> location
  - location -> sublocation
  - not for actor placement
- `located_at`
  - actor -> location or sublocation
  - use this for presence, movement, and occupancy
- `adjacent`
  - structural world connectivity
- `road`
  - explicit travel infrastructure between locations

### Social / Cultural

- `relates_to`
  - relationship/bond between actors
- `member_of`
  - membership in faction or group
  - source = member, target = faction/group
- `belongs_to`
  - cultural affiliation for actors or locations
  - source = actor/location, target = culture
- `thread`
  - ascendant -> mortal/location/artifact divine thread

### Progression / Activity

- `pursues`
  - actor -> ambition node
- `performing`
  - actor -> action template
- `participated_in`
  - actor -> event
- `occurred_at`
  - event -> location

## Query Discipline

If `graphQueries.ts` already has a canonical query, use it instead of open-coding edge walks.

Examples:

- `getAgentsAtLocation()`
- `getActorCultures()`
- `getAgentLocationId()`
- `getAgentAmbitions()`

Reason:

- it centralizes directionality and edge-type semantics
- it reduces bugs when schemas or edge meanings evolve

## Participation Rules

The graph model is broader than the simulation loop.

Today, major engine systems often assume:

- full autonomous movers are `actorType === 'individual'`
- not every actor node is eligible for decision, movement, scoring, or validation

That means a new actor-like entity is not "integrated" just because it exists in the graph. For new classes such as low-fidelity NPCs, you must decide:

- should it be visible in location rosters?
- should it participate in decision or movement?
- should validation treat it like a full agent?
- should detail builders assume axiological profile, capabilities, ambitions, and movement state exist?

## Property Bag Reality

The graph is intentionally flexible:

- properties are `Record<string, unknown>`
- many systems read optional properties
- some systems still assume certain fields are present for full agents

Design implication:

- sparse actor nodes are possible
- sparse actor nodes are only safe where readers are explicitly built to tolerate them

## Common Semantic Traps

### Culture is `belongs_to`, not `member_of`

If an actor or location belongs to a culture, use `belongs_to`.

### Occupancy is `located_at`, not `contains`

Actors are placed with `located_at`. `contains` is for structural containment like location -> sublocation.

### Ambitions are nodes, not a plain array contract

Some UI and summaries aggregate ambitions, but the canonical model is graph-native via `pursues` edges and ambition nodes.

### Events can be graph-native

Encounter history is represented by `event` nodes and participation/location edges, not only ephemeral `TickEvent` UI records.

## Guidance For New Features

Before adding a graph-backed feature, answer these questions explicitly:

1. What node type is the thing?
2. What edge types express its relationships?
3. Which existing query helpers should expose it?
4. Which phase(s) mutate it?
5. Which systems should ignore it?
6. Which existing assumptions about `actorType === 'individual'` would it violate?

If those answers are not written down, implementation tends to sprawl into ad hoc property checks.
