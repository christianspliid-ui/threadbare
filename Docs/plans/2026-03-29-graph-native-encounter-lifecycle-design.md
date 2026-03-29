# Graph-Native Encounter Lifecycle

**Date:** 2026-03-29
**Status:** Design (Cowork)
**Backlog:** TB-077
**Depends on:** Encounter system (✅), Graph engine (✅), Encounter Reward Wiring (✅), Agent Decision Pipeline (✅)

---

## Problem Statement

The game's load-bearing architectural principle — "everything is a graph node/edge" — has a structural exception at its most important seam: the encounter lifecycle. Active encounters live in a flat `GameState.encounterProgress[]` array. Completed encounters vanish entirely. The agent-to-encounter-goal relationship lives in `movementState.targetEncounterId` — a string ID in a property bag, not a graph edge.

This isn't a bug. The flat array was the right call during early development: fast iteration, simple mutation, no index overhead. But the encounter system is now the game's primary narrative engine — where agents grow, stories happen, rewards drop, factions form, and the player's interventions manifest. The cost of the exception is compounding:

1. **No queryable encounter history.** You can't ask the graph "what happened at this cave?" or "what has this agent survived?" Prose resolvers, location flavor, and agent backstory all lack this signal.
2. **Two sources of truth for world state.** The graph knows persistent state (traits, locations, factions). The flat array knows dynamic behavior (encounters, actions). Every feature that crosses the boundary — encounter visibility, colocation detection, divine intervention — needs bridge code joining both sources.
3. **A property field where an edge should be.** `movementState.targetEncounterId` is a relationship encoded as a property, violating the graph-edges-not-properties rule. You can't traverse "who is headed toward this location's encounters?" without scanning all agents.
4. **The `encounter_at` edge is underutilized.** It binds templates to locations for movement candidates and threat rating, but doesn't participate in the active encounter lifecycle or history.
5. **The UnifiedAction migration is half-complete.** `encounterProgress` is marked `@deprecated` in favor of `UnifiedAction`, but both run in parallel. There's no clear end state for how encounters graduate from flat arrays into the architectural mainstream.

This design proposes completing the graph-native encounter lifecycle in three layers: event nodes for encounter history, graph edges for active encounter binding, and a reconciliation pattern that preserves tick-loop performance.

---

## Architecture Overview

Three layers, each independently shippable:

```
Layer 1: Encounter Event Nodes (history)
  Completed encounters → event nodes in graph
  Edges: participated_in (agent → event), occurred_at (event → location)
  Enables: prose enrichment, location history, agent biography

Layer 2: Goal Edge (active binding)
  Replace movementState.targetEncounterId property → pursuing edge
  Enables: "who is headed here?" graph queries, encounter-aware pathfinding

Layer 3: Active Encounter Projection (reconciliation)
  Active encounters → transient event nodes (created on start, archived on end)
  Enables: full graph-queryable world state, colocation via graph, single source of truth
```

**Layer 1 is the high-value, low-risk move.** It's purely additive, touches no existing hot paths, and immediately enriches the prose layer. Layers 2 and 3 are more invasive and can wait for the UnifiedAction migration to settle.

---

## Decision 1: Encounter Event Nodes (Layer 1)

When an encounter step resolves (success or failure), create an `event` node in the graph capturing the outcome. Wire it to the location and agent with new edge types.

### Event Node Shape

```typescript
// Node type: 'event' (already exists in NodeType union)
// properties:
{
  eventType: 'encounter_outcome',           // discriminator within event nodes
  templateId: string,                       // encounter template ID
  templateName: string,                     // human-readable name
  encounterType: EncounterType,             // explore, duel, trade, etc.
  stepIndex: number,                        // which step (0-based)
  stepName: string,                         // human-readable step name
  outcome: 'success' | 'failure' | 'critical_success' | 'critical_failure',
  reachTested: ReachDomain,                 // which reach was tested
  threatRating: ThreatRating,               // encounter threat level
  sphereAffinity?: SphereName,             // sphere alignment if any
  tick: number,                             // when it happened
  tierPromotionOccurred: boolean,           // did this trigger a tier promotion?
  rewardGranted?: string,                   // reward instance ID if any
  targetAgentId?: string,                   // for social encounters
}
```

### New Edge Types

```typescript
// agent → event: "this agent participated in this encounter outcome"
| 'participated_in'   // actor → event (role, outcome, tick)

// event → location: "this encounter happened at this location"
| 'occurred_at'       // event → location (tick)
```

**Edge properties for `participated_in`:**
```typescript
{
  role: 'primary' | 'target',     // actor or target of social encounter
  outcome: string,                 // duplicate for quick edge-only queries
  tick: number,                    // when
}
```

**Edge properties for `occurred_at`:**
```typescript
{
  sublocationId?: string,          // if at a sublocation
  tick: number,
}
```

### Why Two New Edge Types Instead of Reusing Existing Ones

- `performing` connects actor → action_template (active action). Event nodes are *resolved* outcomes, not active actions. Reusing `performing` would conflate active and completed states.
- `located_at` connects actors to their current position. Events don't have a "current position" — they *happened at* a place. Semantic distinction matters for graph queries.
- `encounter_at` connects templates to locations (availability). This is schema-level binding, not instance-level history.

### Event Node Lifecycle

```
Encounter step resolves
  → Create event node (ID: evt_{agentId}_{tick}_{stepIndex})
  → Add participated_in edge (agent → event)
  → Add participated_in edge (target → event, if social encounter)
  → Add occurred_at edge (event → location)
  → Event node is permanent (retained indefinitely)
```

### Archival and Graph Size

Event nodes accumulate. Over a 300-tick game with 16 agents averaging 1 resolution per 3 ticks, that's ~1,600 event nodes and ~3,200 edges. On a graph that starts with 252 nodes and 371 edges, this is significant growth.

Mitigation strategies (choose based on profiling — NFP #7):

| Strategy | Tradeoff |
|----------|----------|
| **No archival** (simplest) | Graph grows linearly. Fine for games under 500 ticks. Profile first. |
| **Tick-based TTL** | Events older than `EVENT_ARCHIVE_TTL` ticks get removed in a cleanup phase. Loses deep history. |
| **Ring buffer per location** | Each location retains at most `EVENT_MAX_PER_LOCATION` most recent events. Older events removed. Preserves recent history while bounding growth. |
| **Summarization** | After `EVENT_SUMMARIZE_THRESHOLD` events at a location, collapse them into a single summary node. Preserves aggregate signal, loses detail. |

**Recommendation:** Start with no archival. The graph engine uses Maps with O(1) lookup — 1,600 nodes won't cause problems. Add ring-buffer archival if profiling shows degradation past `ENCOUNTER_EVENT_PROFILE_THRESHOLD` nodes.

### Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `ENCOUNTER_EVENT_ENABLED` | `true` | Feature flag for event node creation |
| `ENCOUNTER_EVENT_PROFILE_THRESHOLD` | `5000` | Node count at which to investigate archival |
| `EVENT_MAX_PER_LOCATION` | `50` | Ring buffer cap per location (if archival enabled) |
| `EVENT_ARCHIVE_TTL` | `200` | Ticks before event is eligible for removal (if TTL archival enabled) |
| `EVENT_NODE_ID_PREFIX` | `'evt_'` | ID prefix for encounter event nodes |

### Fail-Soft Table

| Failure | Fallback |
|---------|----------|
| Event node creation fails (duplicate ID, graph full) | Log warning, skip node creation. Encounter resolution unaffected — event nodes are write-only side effects. |
| Edge creation fails (missing source/target node) | Log warning, skip edge. Orphaned event node is harmless — no downstream consumer requires edges to exist. |
| Event node has missing properties | Downstream queries use optional chaining. Prose resolvers fall back to template-only descriptions. |
| Graph performance degrades from event node count | `ENCOUNTER_EVENT_ENABLED` flag allows immediate disable without code change. |

### Tracing

New trace event under existing `encounter_resolution` category:

```typescript
interface EncounterEventNodeTrace extends TraceBase {
  category: 'encounter_resolution';
  event: 'event_node_created';
  agentId: string;
  eventNodeId: string;
  templateId: string;
  stepIndex: number;
  outcome: string;
  locationId: string;
}
```

### PRNG

No randomness involved. Event node creation is deterministic — same encounter resolution always produces the same event node (given same tick, agent, step).

---

## Decision 2: Prose Layer Integration

Encounter event nodes become a new signal for the prose engine. Two resolver integrations:

### Location History Resolver

When generating location descriptions or encounter scene prose, the prose layer can walk `occurred_at` edges to find what has happened here.

```typescript
// Query: "What encounters have happened at this location recently?"
function getLocationEncounterHistory(
  graph: WorldGraph,
  locationId: string,
  maxResults: number = EVENT_PROSE_HISTORY_DEPTH,
): GraphNode[] {
  const edges = graph.getIncomingEdges(locationId, 'occurred_at');
  return edges
    .map(e => graph.getNode(e.source))
    .filter(Boolean)
    .sort((a, b) => (b.properties.tick as number) - (a.properties.tick as number))
    .slice(0, maxResults);
}
```

This enables prose like: *"The entrance to the Deep Descent bears the marks of three failed expeditions — the most recent, a shadow-walker who never returned."*

### Agent Biography Resolver

When generating agent descriptions or encounter vignette prose, walk `participated_in` edges to find an agent's encounter history.

```typescript
// Query: "What encounters has this agent completed?"
function getAgentEncounterHistory(
  graph: WorldGraph,
  agentId: string,
  maxResults: number = EVENT_PROSE_HISTORY_DEPTH,
): GraphNode[] {
  const edges = graph.getOutgoingEdges(agentId, 'participated_in');
  return edges
    .map(e => graph.getNode(e.target))
    .filter(Boolean)
    .sort((a, b) => (b.properties.tick as number) - (a.properties.tick as number))
    .slice(0, maxResults);
}
```

This enables prose like: *"Kael has faced the abyss twice before — once triumphant, once broken. The scars remember."*

### Constants Table (Prose)

| Constant | Default | Purpose |
|----------|---------|---------|
| `EVENT_PROSE_HISTORY_DEPTH` | `5` | Max recent events to consider for prose enrichment |
| `EVENT_PROSE_CALLBACK_CHANCE` | `0.3` | PRNG chance of referencing a past encounter in current prose |
| `EVENT_PROSE_MIN_TICK_GAP` | `5` | Minimum ticks between an event and when it can be referenced (avoid "just happened" callbacks) |

---

## Decision 3: Goal Edge (Layer 2)

**Status: Deferred design — ship after Layer 1 proves value.**

Replace `movementState.targetEncounterId` (property field) with a `pursuing` graph edge from agent → encounter cache entry's location. This would allow graph queries like "which agents are headed toward encounters at location X?" without scanning all agent properties.

### Why defer

- The `movementState` property bag is deeply wired into `phaseAgentDecision`, `phaseMovement`, and the reroute logic. Extracting `targetEncounterId` into an edge is a cross-cutting refactor.
- The benefit (graph-queryable goal binding) is real but not urgently needed. No current consumer asks "who is pursuing encounters at this location?"
- Layer 1 (event nodes) delivers immediate prose-layer value without touching the hot decision path.

### Design sketch (for future implementation)

```typescript
// New edge type:
| 'pursuing'    // actor → location (encounter goal)

// Edge properties:
{
  templateId: string,       // target encounter template
  sublocationId?: string,   // if targeting a sublocation
  startedTick: number,      // when pursuit began
}

// Created in phaseAgentDecision when action = 'queue_movement'
// Removed in phaseEncounterProgressionV2 when encounter starts or is abandoned
// Removed in phaseAgentDecision on reroute
```

### Grey Zone: Should this be `pursuing` → location or `pursuing` → event node?

If Layer 3 is implemented (active encounters as event nodes), the pursuing edge could target the event node directly. This is more precise but creates a dependency on Layer 3. For now, target the location — it's sufficient for "who is headed here?" queries.

---

## Decision 4: Active Encounter Projection (Layer 3)

**Status: Deferred design — evaluate after UnifiedAction migration completes.**

The most ambitious layer: represent active encounters as transient `event` nodes in the graph, created when an encounter starts and archived when it ends. This would make the graph the single source of truth for "what's happening right now?"

### Why defer

- The `UnifiedAction` system is already migrating away from `encounterProgress`. Adding a third representation (graph event nodes for active encounters) before that migration completes would create three parallel systems instead of two.
- The performance characteristics of creating/removing graph nodes every tick need profiling. The current flat array processes ~16 active encounters per tick with zero allocation overhead. Graph node creation involves Map insertions, edge creation, and adjacency index updates.
- Layer 1 (history nodes) captures the high-value part (what happened) without touching the hot path (what's happening now).

### When to revisit

- After `encounterProgress` is fully retired in favor of `UnifiedAction`
- After Layer 1 is shipped and profiled for graph size impact
- When a feature actually needs graph-queryable active encounter state (e.g., "show all active encounters on the hex map as live overlays," "let rivals detect and interfere with nearby encounters")

### Design sketch

```
Encounter starts → create event node (status: 'active') + performing edge (agent → event)
Each step resolves → update event node properties (currentStep, lastOutcome)
Encounter ends → update event node (status: 'completed'/'abandoned')
                  remove performing edge
                  add participated_in edge (permanent history record)
```

This would retire the flat array entirely. The tick loop would query `graph.getNodesByType('event').filter(n => n.properties.status === 'active')` or maintain a hot index.

---

## Decision 5: Interaction with UnifiedAction Migration

The `encounterProgress` array is marked `@deprecated` in favor of `UnifiedAction`. This design does NOT conflict with that migration — it's orthogonal:

| Concern | UnifiedAction migration | This design |
|---------|------------------------|-------------|
| **What it addresses** | Runtime action processing format (step progression, contestation, resolution) | Durable encounter history in the graph |
| **What it changes** | `encounterProgress[]` → `unifiedActions[]` (flat array to flat array) | Adds event nodes to graph after resolution |
| **When it fires** | During tick processing (phases 2a, 2a.3) | After resolution, as a side effect |
| **Compatibility** | N/A — independent | Layer 1 works with either `encounterProgress` or `UnifiedAction` as the source of resolution events |

The recommended implementation hooks into the resolution output, not the input format. Whether the source is `resolveEncounter()` (current) or a future unified resolution function, the event node creation is the same: take the outcome and write it to the graph.

---

## Grey Zones Requiring Decision

These are areas where I've made a judgment call but see legitimate arguments in both directions:

### 1. Event granularity: per-step or per-encounter?

**Current proposal:** One event node per resolved step. A 3-step encounter produces 3 event nodes.

**Alternative:** One event node per completed encounter (with step outcomes as properties).

**Trade-off:** Per-step gives richer prose signal ("failed at step 2 of the Deep Descent") but creates more nodes. Per-encounter is simpler but loses the step-level narrative. I've proposed per-step because it aligns with how the prose layer works (step-level narratives) and the node count is manageable.

### 2. Social encounter events: one node or two?

**Current proposal:** One event node, two `participated_in` edges (one for primary actor, one for target).

**Alternative:** Two event nodes (one per participant's perspective).

**Trade-off:** Single node is simpler and avoids double-counting. Two nodes would allow different properties per participant (e.g., different outcome perceptions). I've proposed single node because encounters have one resolution — the outcome is shared.

### 3. Should existing encounters be retroactively back-filled?

**Current proposal:** No. Event nodes are only created for encounters that resolve after the feature ships. History begins at the tick the feature activates.

**Alternative:** At game start, scan `encounterProgress` history entries and create event nodes for past encounters.

**Trade-off:** Backfill gives immediate prose richness in ongoing games. But history entries lack location data and step details — the backfill would produce incomplete nodes. I've proposed no backfill because the feature is forward-looking and incomplete nodes would be worse than no nodes.

---

## Implementation Plan

### Layer 1 (recommended for immediate implementation)

**Phase 1A: Type definitions and event node creation** (~1 session)
- Add `participated_in` and `occurred_at` to `EdgeType` union in `graph.ts`
- Add edge schemas in `edgeSchema.ts`
- Create `createEncounterEventNode()` function
- Wire into `phaseEncounterProgressionV2` after `resolveEncounter()` returns
- Unit tests: event node created with correct properties, edges wired, fail-soft on errors

**Phase 1B: Graph query utilities** (~0.5 session)
- `getLocationEncounterHistory(graph, locationId)` → recent event nodes
- `getAgentEncounterHistory(graph, agentId)` → agent's encounter event nodes
- Unit tests for both queries

**Phase 1C: Prose layer integration** (~1 session)
- Add location history resolver to prose pipeline
- Add agent biography resolver to prose pipeline
- Wire `EVENT_PROSE_CALLBACK_CHANCE` into encounter scene generation
- Integration tests: prose output references past encounters when history exists

**Phase 1D: Debug visibility** (~0.5 session)
- Add encounter event nodes to existing DebugPanel `encounters` tab
- Show: location history, agent history, total event node count
- Feature flag in debug UI to enable/disable event creation

### Layers 2 & 3: Deferred

Backlogged. Revisit after UnifiedAction migration and Layer 1 profiling.

---

## Wiring Section

| Surface | Connection |
|---------|-----------|
| **Orchestrator** | Hooks into existing `phaseEncounterProgressionV2` (phase 2a.3). After `resolveEncounter()` and `advanceEncounter()`, before event emission. No new phase. |
| **UI rendering** | No new UI components. Prose enrichment flows through existing encounter narrative display (ChronicleNarrator, event messages). Debug visibility added to existing DebugPanel encounters tab. |
| **GameState flow** | Writes: `graph` (new event nodes + edges). Reads: `encounterProgress` or `unifiedActions` (source of resolution events). No new GameState fields. |
| **Traces** | Emits `encounter_resolution` → `event_node_created`. Uses existing trace category — no new category needed. |
| **Debug visibility** | Existing `encounters` tab in DebugPanel. New sub-section showing event node count, recent events per location, agent encounter history. |
| **Prose pipeline** | New resolvers registered in prose pipeline: `locationHistoryResolver`, `agentBiographyResolver`. Both call `enrichProse()` integration. |
| **Player controls** | None. Event nodes are automatic side effects of encounter resolution. Player interacts with encounters through existing ActionDrawer and vignette system. |

---

## NFP Compliance Summary

| Priority | NFP | Verdict |
|----------|-----|---------|
| 1 | Tunability | **PASS** — 8 named constants controlling event creation, archival, prose integration. Feature flag (`ENCOUNTER_EVENT_ENABLED`) allows instant disable. |
| 2 | Inspectability | **PASS** — This design *exists to improve inspectability*. Encounter history becomes graph-queryable. Every event node traces its creation. DebugPanel shows event counts and history. |
| 3 | Determinism | **PASS** — Event node creation is deterministic (same resolution → same node). Prose callback uses seeded PRNG (`EVENT_PROSE_CALLBACK_CHANCE`). No new sources of non-determinism. |
| 4 | Fail-soft | **PASS** — Event node creation failures are logged and skipped. Encounter resolution is unaffected — nodes are write-only side effects. Missing nodes produce no errors downstream (optional chaining in prose resolvers). Feature flag for emergency disable. |
| 5 | Narrative > mechanical | **PASS** — This design is specifically a narrative enrichment. Encounter history feeds prose, not mechanics. No new die rolls, modifiers, or resolution changes. |
| 6 | Additive | **PASS** — Adds 2 new edge types, 1 new function, 2 new graph queries, 2 new prose resolvers. Modifies 1 existing function (phaseEncounterProgressionV2 — adds side-effect block). Removes nothing. |
| 7 | Performance | **PASS with note** — Event nodes grow linearly with game length. Estimated ~1,600 nodes over a 300-tick game. Graph engine uses O(1) Map lookups; this should be fine. `ENCOUNTER_EVENT_PROFILE_THRESHOLD` triggers investigation if growth exceeds expectations. Ring buffer archival is designed but deferred until profiling justifies it. |

---

## Rejected Approaches

- ❌ **Promote encounter templates to graph nodes.** Templates are immutable schema, not world state. Adding them to the graph creates dead nodes with no meaningful lifecycle. The `encounter_at` edges already handle template→location binding.
- ❌ **Store encounter history in agent properties.** Would make encounter history a property bag, not a graph relationship. Violates "edges not properties" principle. Can't query "what happened at this location" by scanning agent properties.
- ❌ **Create a separate event store (not graph).** Would create a third data structure alongside the graph and flat arrays. The whole point is consolidation, not proliferation.
- ❌ **Full graph-native active encounters immediately.** Too much risk in the hot tick path before profiling. Layer 1 (history only) captures 80% of the value at 20% of the risk. Layer 3 is designed but deferred.
