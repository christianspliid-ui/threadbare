# Invariants And Footguns

> Added 2026-04-02. Source of truth: current engine behavior, not design intent.
> Purpose: prevent common mistakes during refactors and feature work.

## 1. The graph mutates in place

`WorldGraph` keeps stable object identity while nodes, edges, and property bags change.

Implications:

- never depend on `gameState.graph` identity to detect change
- selector invalidation must use explicit versioning or other observability
- "nothing changed because the object is the same" is a false assumption here

## 2. Runtime observability lives outside the graph

`SimulationRuntime` owns:

- `worldVersion`
- `structuralCacheVersion`
- encounter cache
- distance matrix

Implications:

- per-session caches belong to the runtime, not module globals
- UI selectors should key off runtime versions, not graph identity
- structural invalidation is intentionally coarse for now

## 3. `member_of` and `belongs_to` are not interchangeable

Use:

- `member_of` for faction/group membership
- `belongs_to` for cultural affiliation

Mixing them breaks both semantics and existing query helpers.

## 4. `contains` is not actor placement

Use:

- `contains` for region -> location or location -> sublocation structure
- `located_at` for actor presence

If an actor is "inside" an inn or city, that is still a `located_at` problem.

## 5. `actor` is broader than "full agent"

The graph allows many kinds of actors:

- ascendants
- gods
- factions
- cultures
- groups
- individuals

But many engine systems still treat `actorType === 'individual'` as the operational gate for:

- decision
- movement
- validation
- location occupancy queries
- social candidate generation

Adding a new actor-like entity without revisiting those assumptions causes leaks.

## 6. Sparse actor property bags are only safe where readers tolerate them

Some code is defensive and falls back gracefully.
Some code still assumes full-agent data exists.

Common fragile properties:

- `axiologicalProfile`
- `movementState`
- domain/capability data
- ambitions
- knowledge/familiarity-linked data

If you introduce low-fidelity actors, they need explicit treatment in:

- validation
- detail builders
- targeting/UI
- encounter generation

## 7. Tick phases are not uniformly pure

The orchestrator mixes:

- returned partial state
- direct graph mutation
- helper phases with side effects

Do not refactor on the assumption that all phases behave like reducers.

## 8. Structural invalidation is broader than reachability alone

Today `structuralCacheVersion` also covers content-scoring inputs such as settlement subtype changes that affect encounter matching.

Implication:

- it is intentionally an over-invalidation mechanism for v1
- do not "optimize" it into narrower versions unless you also audit every mutation classification

## 9. Existing encounter participation is still narrow

Current encounter runtime fundamentally models:

- one acting `actorId`
- optional `targetAgentId`

That is enough for many social encounters, but not for arbitrary multi-party participant semantics.

Implication:

- retainers, followers, escorts, and bystanders are not a trivial add-on
- if a design needs secondary participants to take steps or receive outcomes, treat it as encounter-runtime work, not just edge wiring

## 10. UI targeting is generic, but detail expectations are not

The targeting pipeline is intentionally generalized, but actor detail views and action filtering still assume certain target shapes.

Implication:

- "just make it another actor target" is only half the work
- the target may still need a dedicated detail builder, filtered action pool, and visibility rules

## 11. Use canonical query helpers where they exist

If `graphQueries.ts` has the query, prefer it over raw edge walks.

Why this matters:

- edge direction mistakes are common
- semantics such as culture membership are easy to invert
- helpers are where schema meaning becomes stable

## 12. Design docs are not the same as live contracts

`Docs/plans/` explains rationale and intended design.
The live engine may already have:

- migrated naming
- partial runtime refactors
- compatibility shims
- known coarse invalidation that the plan does not mention

Always confirm against code before using a plan doc as implementation truth.

## Quick Review Checklist

Before merging a graph-heavy feature, sanity-check:

1. Did I use the right edge semantics?
2. Did I accidentally treat all actors as full agents?
3. Did any UI memo or selector depend on graph identity?
4. Did I bypass runtime invalidation/versioning?
5. Did I assume encounter runtime supports more participants than it actually does?
6. Did I add a new concept without updating canonical queries or detail builders?
