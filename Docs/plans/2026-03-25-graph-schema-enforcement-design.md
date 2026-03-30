# Graph Schema Enforcement — Design Doc

**Date:** 2026-03-25
**Status:** 🎨 Design
**Backlog:** TB-033
**Trigger:** Repeated bugs from variant/redundant edge types (`contains` vs `located_at`, `relationship` vs `relates_to`, `located_in` vs `located_at`)

---

## The Problem — Why This Keeps Happening

The graph model is the spine of the game. Every tick phase, every UI component, and every content system reads and writes edges. But the graph layer has **no schema enforcement**. It's a bag of strings.

Here's what that means in practice:

**The EdgeType union is documentation, not enforcement.** `graph.ts` defines 22 edge types as a TypeScript union, but `addEdge()` accepts any string. Four edge types are used in production code that aren't in the union at all: `encounter_at`, `located_in`, `relationship`, `opposes`. TypeScript doesn't catch this because `properties: Record<string, unknown>` is wide open.

**There are no canonical accessors.** Every file that wants "agents at this location" writes its own query: `graph.getIncomingEdges(locId, 'located_at')`. If someone types `'contains'` instead, TypeScript won't complain, the graph will happily return a different set of edges, and the bug is invisible until it causes weird behavior 50 ticks later. This is exactly what happened in `agentLifecycle.ts`.

**Edge direction is undocumented.** The type comment says `located_at: actor is at location` but nothing enforces that the source must be an actor and the target must be a location. You have to know the convention. And conventions get forgotten across sessions.

**Edge semantics are duplicated.** `relates_to` and `relationship` both mean inter-actor relationship. `located_at` and `located_in` both mean agent-at-location. These aliases exist because someone (or some Claude session) didn't find the canonical edge type and invented a new one that "seemed right."

**Four defined edge types are dead code.** `enchanted`, `warded`, `cursed`, `blessed` — defined in the union, never created, never read. They add noise when scanning for the right edge type to use.

### Root cause analysis

The recurring pattern is:

1. Developer needs to query "what agents are at this location?"
2. They look at `graph.ts`, see `contains` and `located_at`, both plausible
3. They pick one based on the name. Sometimes they pick wrong.
4. No runtime error. No type error. Bug is silent.
5. System works in isolation tests (where the test creates the edge type it expects)
6. System breaks in integration (where the edge was created by a *different* module using the *other* type)

The fix isn't "be more careful." The fix is making the wrong thing impossible.

---

## The Fix — Three Layers

### Layer 1: Canonical Query Functions (Highest Impact, Lowest Cost)

Instead of everyone writing raw `graph.getIncomingEdges(locId, 'located_at')`, provide a typed function for every common query:

```typescript
// src/engine/graphQueries.ts

/** Get all individual agents at a location */
export function getAgentsAtLocation(graph: WorldGraph, locationId: string): GraphNode[] {
  return graph.getIncomingEdges(locationId, 'located_at')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => n != null && n.properties.actorType === 'individual');
}

/** Get the location an agent is at */
export function getAgentLocation(graph: WorldGraph, agentId: string): GraphNode | undefined {
  const edges = graph.getOutgoingEdges(agentId, 'located_at');
  return edges.length > 0 ? graph.getNode(edges[0].target) : undefined;
}

/** Get all faction members */
export function getFactionMembers(graph: WorldGraph, factionId: string): GraphNode[] {
  return graph.getIncomingEdges(factionId, 'member_of')
    .map(e => graph.getNode(e.source))
    .filter((n): n is GraphNode => n != null);
}

/** Get the culture(s) an actor belongs to */
export function getActorCultures(graph: WorldGraph, actorId: string): Array<{ culture: GraphNode; strength: number }> {
  return graph.getOutgoingEdges(actorId, 'belongs_to')
    .map(e => ({
      culture: graph.getNode(e.target),
      strength: (e.properties.culturalStrength as number) ?? 1.0,
    }))
    .filter((c): c is { culture: GraphNode; strength: number } => c.culture != null);
}

// ... one function per canonical query pattern
```

**Why this works:** When every module calls `getAgentsAtLocation()` instead of writing its own edge query, there's exactly one place where the edge type and direction are specified. If it's wrong, we fix one line. If someone invents a new variant, it's visible in code review because they're not using the standard function.

**Migration path:** Don't rewrite all callers at once. New code uses `graphQueries.ts`. Add a lint rule (or a CLAUDE.md rule) that flags raw `getIncomingEdges`/`getOutgoingEdges` calls with `'located_at'`, `'member_of'`, etc. — point developers to the query function instead.

### Layer 2: Edge Schema Registry (Medium Impact, Medium Cost)

Define the schema as runtime data, not just types:

```typescript
// src/types/edgeSchema.ts

export interface EdgeSchema {
  type: EdgeType;
  sourceNodeType: NodeType | NodeType[];  // what can be the source
  targetNodeType: NodeType | NodeType[];  // what can be the target
  direction: 'directed' | 'bidirectional';
  cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many';
  requiredProperties: string[];           // properties that must be present
  description: string;                     // human-readable purpose
}

export const EDGE_SCHEMA: Record<EdgeType, EdgeSchema> = {
  located_at: {
    type: 'located_at',
    sourceNodeType: 'actor',
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'many-to-many',  // agent at one location, location has many agents
    requiredProperties: [],
    description: 'Actor is physically at this location. Source = actor, target = location.',
  },
  contains: {
    type: 'contains',
    sourceNodeType: ['region', 'location'],
    targetNodeType: 'location',
    direction: 'directed',
    cardinality: 'one-to-many',
    requiredProperties: [],
    description: 'Spatial containment. Region contains locations; location contains sub-locations. NOT for actors — use located_at.',
  },
  member_of: {
    type: 'member_of',
    sourceNodeType: 'actor',
    targetNodeType: 'actor',
    direction: 'directed',
    cardinality: 'many-to-many',
    requiredProperties: ['role', 'rank', 'joinedTick'],
    description: 'Individual/group is member of faction. Source = member, target = faction/group.',
  },
  // ... all 22 types
};
```

**Why this works:** The schema is both documentation and a validation target. `validateAgentIntegrity()` (from TB-030) can check that edges on an agent node match the schema: source type matches, target type matches, required properties present. The schema lives in code, not in comments that get stale.

### Layer 3: Validated `addEdge` (Highest Impact on Prevention, Highest Cost)

Wrap `graph.addEdge()` with schema validation in development:

```typescript
// In WorldGraph or a wrapper

addEdge(edge: GraphEdge): void {
  if (import.meta.env.DEV) {
    const schema = EDGE_SCHEMA[edge.type];
    if (!schema) {
      console.warn(`[GraphSchema] Unknown edge type: "${edge.type}". Not in EDGE_SCHEMA.`);
    } else {
      const sourceNode = this.getNode(edge.source);
      const targetNode = this.getNode(edge.target);
      if (sourceNode && !matchesNodeType(sourceNode.type, schema.sourceNodeType)) {
        console.warn(`[GraphSchema] Edge "${edge.type}" source should be ${schema.sourceNodeType}, got ${sourceNode.type}`);
      }
      if (targetNode && !matchesNodeType(targetNode.type, schema.targetNodeType)) {
        console.warn(`[GraphSchema] Edge "${edge.type}" target should be ${schema.targetNodeType}, got ${targetNode.type}`);
      }
      for (const prop of schema.requiredProperties) {
        if (!(prop in edge.properties)) {
          console.warn(`[GraphSchema] Edge "${edge.type}" missing required property: ${prop}`);
        }
      }
    }
  }
  // actual addEdge logic
}
```

**Why dev-only:** Validation has a cost. In production, trust the schema; in development, enforce it loudly. This is the same pattern React uses for prop validation.

---

## Immediate Cleanup — Fix the Variant Bugs

Before building the layers above, fix the existing bugs that the audit found. These are all one-line fixes but they illustrate exactly why the schema matters.

| Bug | File | Fix |
|-----|------|-----|
| `located_in` used instead of `located_at` | `phaseEconomicChronicle.ts` | Replace `'located_in'` → `'located_at'` |
| `relationship` used instead of `relates_to` | `agentDetail.ts` | Replace `'relationship'` → `'relates_to'` |
| `encounter_at` used but not in EdgeType | `movementCandidates.ts`, `threatRating.ts` | Either add to EdgeType union or replace with the intended type |
| `contains` used to query agents at location | `agentLifecycle.ts:135` | Already in TB-030 plan — replace with `'located_at'` |
| Dead edge types in union | `graph.ts` | Remove `enchanted`, `warded`, `cursed`, `blessed` — or explicitly mark as `// RESERVED: not yet implemented` with a comment block |

---

## Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `GRAPH_SCHEMA_VALIDATION_ENABLED` | `true` in dev, `false` in prod | Toggle validated addEdge |
| `GRAPH_SCHEMA_THROW_ON_UNKNOWN` | `false` | Whether to throw or warn on unknown edge types |

---

## Tracing

| Trace Type | When Emitted | Payload |
|------------|-------------|---------|
| `graph_schema_violation` | Dev mode, on addEdge with wrong source/target type | `{ edgeType, expectedSource, actualSource, expectedTarget, actualTarget }` |
| `graph_unknown_edge_type` | Dev mode, on addEdge with type not in EDGE_SCHEMA | `{ edgeType, edgeId }` |

---

## Fail-Soft

| Failure | Behavior |
|---------|----------|
| Unknown edge type in addEdge | Warn in dev console, allow in prod (additive — don't block future edge types) |
| Wrong source/target type | Warn in dev console, allow in prod |
| Missing required property | Warn in dev console, allow in prod |
| Schema not loaded | Skip validation entirely (fail-open) |

---

## PRNG Callouts

None — schema enforcement is deterministic and has no random elements.

---

## NFP Compliance Summary

| Priority | NFP | Status |
|----------|-----|--------|
| 1 | Tunability | PASS — validation toggle is a named constant |
| 2 | Inspectability | PASS — trace types defined for schema violations |
| 3 | Determinism | PASS — no PRNG involvement |
| 4 | Fail-soft | PASS — dev-only validation, warn-not-throw, fail-open |
| 5 | Narrative over mechanical | N/A |
| 6 | Additive over destructive | PASS — query functions added alongside existing API; migration is gradual |
| 7 | Performance budget | PASS — validation is dev-only; query functions are zero-overhead wrappers |

---

## Implementation Plan

### Task 1: Create `src/engine/graphQueries.ts` (Layer 1)

Create a file with canonical query functions for every common graph relationship. Each function encapsulates the edge type string, direction, source/target filtering, and null handling.

**Minimum set of query functions (based on the edge audit — covers the 8 most-read edge types):**

```typescript
// Location
getAgentsAtLocation(graph, locationId): GraphNode[]
getAgentLocation(graph, agentId): GraphNode | undefined
getAgentLocationId(graph, agentId): string | undefined
getSublocationsAt(graph, locationId): GraphNode[]
getLocationsInRegion(graph, regionId): GraphNode[]

// Social
getFactionMembers(graph, factionId): GraphNode[]
getAgentFaction(graph, agentId): { faction: GraphNode; rank: number; role: string } | undefined
getAgentCultures(graph, actorId): Array<{ culture: GraphNode; strength: number }>
getAgentBonds(graph, agentId): Array<{ agent: GraphNode; sentiment: number; trust: number }>
getAgentTraits(graph, agentId): Array<{ trait: GraphNode; level: number }>

// Ambition
getAgentAmbitions(graph, agentId): Array<{ ambition: GraphNode; priority: number; status: string }>

// Cosmology / Divine
getAgentWorships(graph, agentId): GraphNode | undefined
getAvatarsOf(graph, ascendantId): GraphNode[]
```

**Tests:** Unit test per function — pass a real (small) graph, verify correct results and null handling.

**File:** `src/engine/graphQueries.ts`, `src/engine/__tests__/graphQueries.test.ts`

---

### Task 2: Create `src/types/edgeSchema.ts` (Layer 2)

Define the `EDGE_SCHEMA` registry as runtime data. One entry per `EdgeType` value, specifying source node type(s), target node type(s), directionality, cardinality, and required properties.

**File:** `src/types/edgeSchema.ts`

---

### Task 3: Wire Schema into `validateAgentIntegrity()` (Layer 2 integration)

After TB-030 lands the validation utility, extend it to use `EDGE_SCHEMA` for edge validation: check that every edge on an agent node matches the schema's source/target type constraints.

**Depends on:** TB-030 Task 2

**File:** `src/engine/agentValidation.ts`

---

### Task 4: Add Dev-Mode Validation to `addEdge` (Layer 3)

Wrap `graph.addEdge()` with a dev-only schema check. Warn on unknown edge types, wrong source/target node types, and missing required properties.

**File:** `src/engine/graph.ts`

---

### Task 5: Migrate High-Traffic Callers to Query Functions

Migrate the top-10 most frequent raw edge queries to use `graphQueries.ts`. Prioritize files that have had edge-type bugs: `agentLifecycle.ts`, `phaseAgentDecision.ts`, `phaseMovement.ts`, `agentDetail.ts`, `phaseEconomicChronicle.ts`.

**Approach:** File-by-file as we touch them. No big-bang refactor.

**File:** Various engine files

---

## Execution Order

1. **Task 1** (canonical query functions) — immediate payoff, prevents the bug class for new code
2. **Task 2** (edge schema registry) — enables automated validation
3. **Task 3** (wire into validator) — depends on TB-030
4. **Task 5** (migrate callers) — ongoing, file-by-file
5. **Task 4** (validated addEdge) — the long-term guardrail, last because it touches the graph core

---

## Open Questions

1. **Should we also canonicalize node property access?** The same problem exists with `properties.locationId` vs `located_at` edges — the property is a second source of truth that diverges. Layer 1 fixes this for edges, but property access is equally unguarded.
2. **Should query functions live in `graphQueries.ts` or on the `WorldGraph` class itself?** Standalone functions are easier to test and tree-shake. Class methods are more discoverable.
3. **How aggressive should the migration be?** We could lint-ban raw edge queries immediately, or we could migrate file-by-file as we touch them.
