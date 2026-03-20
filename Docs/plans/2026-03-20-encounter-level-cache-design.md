# Encounter-Level Cache & Eager Sublocation Design

**Date:** 2026-03-20
**Status:** Draft
**Problem:** Agents choose destinations based on location-level approximations, not specific encounter desire. Sublocation-specific encounters are invisible to the decision pipeline.

---

## Problem Statement

The agent decision pipeline has two disconnected paths:

1. **The encounter cache** (`encounterCache.ts`) — built at game start, keyed by `locationId × locationType`. Calls `getEncountersByLocationType()` which returns ALL templates matching a location type string, ignoring sublocation structure entirely.

2. **`generateEncounterCandidates()`** (`encounterCandidates.ts`) — sublocation-aware, calls `ensureSublocations()` + `getEncountersBySublocationAndLocation()`. But **never called by the decision pipeline**. It is dead code relative to agent decisions.

### Consequences

- An agent deciding whether to travel to a capital sees the union of ALL capital-type encounter templates — dungeon, throne-room, market-district, temple-quarter — scored as one undifferentiated blob.
- Templates with `sublocationTypes` restrictions (20 of ~80 templates) are served to the cache without sublocation filtering. An agent could select a temple-quarter encounter at a location whose only sublocation is a dungeon.
- Conditional sublocations (`phaseSublocations.ts`) spawn/dissolve at Phase 6.65, but the cache built at tick 1 is never updated. A Market District spawning at prosperity ≥ 40 adds encounters no agent will ever seek.
- The agent doesn't think "I want *The Merchant's Gambit* at the Market District in Thornwall." It thinks "Thornwall looks okay."

---

## Design

Five coordinated changes, ordered by dependency:

### System 1: Eager Base Sublocation Creation

Move base sublocation creation from lazy (`ensureSublocations` called per-agent) to eager (during `seedWorld`).

**Why:** The cache needs the full sublocation tree materialized to enumerate encounter opportunities. Base sublocations are deterministic (same seed → same set), so deferring them adds complexity without benefit.

**Entry point:** `seedWorld()` in `worldSeed.ts`

**Algorithm:**
1. After creating each location node, immediately call `ensureSublocations(graph, locationId, seed)` using the worldgen PRNG
2. `ensureSublocations` is already idempotent — calling it eagerly changes timing, not behavior
3. Conditional sublocations (Gold Reach) remain lazy via `phaseSublocations` — they depend on runtime state (prosperity, resources, guild wealth)

| Constant | Value | Purpose |
|----------|-------|---------|
| (none new) | — | Uses existing `SUBTYPE_SUBLOCATION_MAP` and worldgen seed offsets |

**Tracing:**
No new trace types. Sublocation creation already produces graph mutations visible in the graph snapshot.

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| `ensureSublocations` returns empty for a location subtype | Location gets only location-level cache entries (no sublocation-specific ones) |
| `SUBTYPE_SUBLOCATION_MAP` missing an entry | Same as today — no sublocations, no error |

**PRNG:** Uses the same worldgen PRNG stream that creates the location. Seed passed to `ensureSublocations` derived from location index: `seed + locationIndex * 7717`.

---

### System 2: Encounter-Level Cache

Replace the location-level cache with an encounter-level cache keyed by `templateId × (sublocationId | locationId)`.

**Entry point:** `EncounterCacheManager.buildFullCache()` in `encounterCache.ts`

#### 2a. New cache entry structure

Add `sublocationId` to `EncounterCacheEntry`:

```typescript
export interface EncounterCacheEntry {
  templateId: string;
  locationId: string;              // parent location (for distance/travel)
  sublocationId: string | null;    // null = location-level encounter
  sublocationTypeId: string | null; // e.g. 'sublocation-type.market-district'
  // ... existing fields unchanged ...
  reachPrimary: ReachDomain;
  reachSecondary: ReachDomain;
  threatRating: ThreatRating;
  encounterType: EncounterType;
  motivations: ValuePair[];
  visibleTo?: string[];
  requiresPresence: boolean;
  remotePenalty: number;
  remoteMaxRange?: number;
  sphereAffinity?: SphereName;
  questPriority: number;
  targetAgentId?: string;
  totalTickCost: number;
  successRewardEstimate: number;
  stepCount: number;
  stepDifficulties: number[];
  stepReaches: ReachDomain[];
}
```

| Constant | Value | Purpose |
|----------|-------|---------|
| (none new) | — | Existing reward/cost computation unchanged |

#### 2b. New cache build algorithm

Replace `buildFullCache` and `buildEntriesForLocation`:

```
buildFullCache(graph):
  for each location node:
    sublocations = getSublocations(graph, locationId)

    if sublocations is non-empty:
      for each sublocation:
        sublocationTypeId = sublocation.properties.sublocationTypeId
        locationType = location.properties.locationSubtype
        templates = getEncountersBySublocationAndLocation(sublocationTypeId, locationType)
        for each template:
          create entry with { templateId, locationId, sublocationId, sublocationTypeId, ... }

    else:
      // Location has no sublocations — use location-level lookup
      templates = getEncountersByLocationType(locationType)
      for each template:
        create entry with { templateId, locationId, sublocationId: null, ... }
```

This replaces the current approach where `buildEntriesForLocation` calls only `getEncountersByLocationType`. The key change: **`getEncountersBySublocationAndLocation` is now the primary lookup path**, which correctly filters templates by their `sublocationTypes` field.

**Template resolution rules** (already implemented in `getEncountersBySublocationAndLocation`):
- Template has `sublocationTypes` → only appears at matching sublocations
- Template has no `sublocationTypes` → appears at every sublocation of a matching `locationType` (location-level fallback)

This means a template like *The Deep Descent* (`sublocationTypes: ['sublocation-type.dungeon']`) will only create cache entries for dungeon sublocations, not for every sublocation in a ruin.

#### 2c. Helper: `getSublocations`

Extract from existing `ensureSublocations` check logic:

```typescript
function getSublocations(graph: WorldGraph, locationId: string): GraphNode[] {
  const containsEdges = graph.getOutgoingEdges(locationId, 'contains');
  const subs: GraphNode[] = [];
  for (const edge of containsEdges) {
    const child = graph.getNode(edge.target);
    if (child?.type === 'location') {
      const props = child.properties as Partial<SublocationProperties>;
      if (props.parentLocationId === locationId && props.sublocationTypeId) {
        subs.push(child);
      }
    }
  }
  return subs;
}
```

**Tracing:**
No new trace type. The existing `FilterPipelineTrace` and `ScoringTrace` already log `templateId` and `locationId`. Add `sublocationId` to both:

```typescript
// Addition to FilterPipelineTrace
interface FilterPipelineTrace {
  // ... existing fields ...
}

// Addition to ScoringTrace topCandidates entries
interface ScoringTraceCandidate {
  templateId: string;
  locationId: string;
  sublocationId: string | null;  // NEW
  isLocal: boolean;
  valuePerTick: number;
  desireMultiplier: number;
  finalScore: number;
}
```

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Sublocation node missing `sublocationTypeId` | Skip sublocation, no entries generated for it |
| `getEncountersBySublocationAndLocation` returns empty | No entries for that sublocation (expected for some type combos) |
| Location has sublocations but none match any template | Location gets zero cache entries — agents won't travel there (correct behavior) |

**PRNG:** None — cache build is deterministic lookup, no randomness.

---

### System 3: Cache Lifecycle Hooks

Wire sublocation spawn/dissolve events into the encounter cache so it stays accurate as the game progresses.

**Entry point:** `phaseSublocations()` in `phaseSublocations.ts`, `checkDissolutions()` in `sublocation.ts`

#### 3a. New cache mutation methods

Add to `EncounterCacheManager`:

```typescript
/** Add cache entries for a newly spawned sublocation. */
onSublocationCreated(graph: WorldGraph, sublocationId: string, parentLocationId: string): void {
  const sublocation = graph.getNode(sublocationId);
  if (!sublocation) return;
  const sublocationTypeId = sublocation.properties.sublocationTypeId as string;
  const parentNode = graph.getNode(parentLocationId);
  if (!parentNode) return;
  const locationType = getLocationType(graph, parentLocationId);
  if (!locationType) return;

  const templates = getEncountersBySublocationAndLocation(sublocationTypeId, locationType);
  const newEntries = templates.map(tmpl => buildEntry(tmpl, parentLocationId, sublocationId, sublocationTypeId));

  // Append to existing entries for this location
  const existing = this.byLocation.get(parentLocationId) ?? [];
  this.byLocation.set(parentLocationId, [...existing, ...newEntries]);
}

/** Remove cache entries for a dissolved sublocation. */
onSublocationDestroyed(sublocationId: string, parentLocationId: string): void {
  const existing = this.byLocation.get(parentLocationId);
  if (!existing) return;
  this.byLocation.set(
    parentLocationId,
    existing.filter(e => e.sublocationId !== sublocationId),
  );
}
```

#### 3b. Wire into phaseSublocations

After `spawnConditionalSublocation` succeeds, call `encounterCache.onSublocationCreated()`.
After `checkDissolutions` returns events, call `encounterCache.onSublocationDestroyed()` for each.

This requires `phaseSublocations` to receive the encounter cache as a parameter (currently it only receives `GameState`). Two options:

**Option A: Pass cache through GameState.** Add `encounterCache: EncounterCacheManager` to GameState. Clean but changes the state interface.

**Option B: Pass cache as parameter.** Change `phaseSublocations(state, encounterCache)`. Minimal change, follows the pattern used by `phaseAgentDecision`.

**Recommendation: Option B.** It follows the existing pattern (`phaseAgentDecision` already takes `encounterCache` as a parameter) and doesn't pollute the serializable game state with a class instance.

| Constant | Value | Purpose |
|----------|-------|---------|
| (none new) | — | Lifecycle hooks are event-driven, no thresholds |

**Tracing:**
Cache mutation events are visible through the existing graph change tracking. No new trace type needed — the `phaseSublocations` phase already logs sublocation spawn/dissolve.

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| `onSublocationCreated` called for unknown sublocation | No-op — returns early |
| `onSublocationDestroyed` called with no matching entries | No-op — filter returns same array |
| `phaseSublocations` throws during spawn | Same as today — fail-soft continue. Cache stays stale for that sublocation until next spawn attempt |

**PRNG:** None — lifecycle hooks are deterministic reactions to graph mutations.

---

### System 4: Sublocation-Aware Movement & Arrival

The current movement system cannot route agents to sublocations. This system fixes the full path from "agent selects encounter at sublocation" through "agent arrives and starts encounter at that sublocation."

**Entry points:** `phaseAgentDecision.ts` (queue_movement branch), `movementExecution.ts` (arrival), `pathfinding.ts` (routing)

#### 4a. The current problem

Three gaps in the movement→arrival→encounter flow:

1. **Decision phase sets wrong destination.** `phaseAgentDecision` line 200 pathfinds to `sel.entry.locationId` (the parent location). With encounter-level cache entries carrying `sublocationId`, the agent knows *which* sublocation it wants but doesn't use that information for routing.

2. **Pathfinding can't reach sublocations.** `findShortestPath` traverses `adjacent` and `contains` edges between location nodes. Sublocations are reachable *inward* via `contains` from their parent, but have no outgoing edges to leave. More importantly, the pathfinder would need to route: current location → (adjacent hops) → parent location → (contains) → sublocation. This two-phase path isn't how Dijkstra works on a flat graph.

3. **Arrival doesn't place agent at sublocation.** `tickMovement` updates the `located_at` edge to point at whatever node is at the end of the movement queue. If the destination is a parent location, the agent is "at" the location but not "at" the sublocation. The encounter starts with no sublocation context.

#### 4b. Design: Two-phase arrival

Rather than making sublocations pathfinding-reachable (which would require adding `adjacent` edges and movement costs within locations — a much larger change), treat sublocation entry as an **arrival action** that happens automatically when the agent reaches the parent location.

**Movement destination remains the parent location.** The cache entry's `locationId` is still used for pathfinding. This is correct — travel cost is between locations (hex-to-hex), not within a location.

**New field on MovementState:**

```typescript
interface MovementState {
  destinationId: string;          // parent location (unchanged)
  targetSublocationId?: string;   // NEW: sublocation to enter on arrival
  targetEncounterId?: string;     // encounter to start (existing field)
  movementQueue: string[];
  ticksAccumulated: number;
  currentEdgeCost: number;
  lastDecisionTick: number;
  movementHistory: MovementHistoryEntry[];
  motivationPull?: number;
}
```

| Constant | Value | Purpose |
|----------|-------|---------|
| SUBLOCATION_ENTRY_COST | 0 | Tick cost to enter a sublocation from its parent. Zero = instant. Tunable if we later want intra-location travel time. |

**Decision phase change** (`phaseAgentDecision.ts`, queue_movement branch):

```typescript
// Current:
movementState: {
  movementQueue: pathResult.path,
  destinationId: sel.entry.locationId,
  targetEncounterId: sel.entry.templateId,
  lastDecisionTick: state.tick,
}

// New:
movementState: {
  movementQueue: pathResult.path,
  destinationId: sel.entry.locationId,
  targetSublocationId: sel.entry.sublocationId ?? undefined,
  targetEncounterId: sel.entry.templateId,
  lastDecisionTick: state.tick,
}
```

**Arrival handling** — when `arrivedAtDestination` is true in `phaseMovement` or when `phaseAgentDecision` detects an agent whose queue is empty and has a `targetSublocationId`:

```
if agent.movementState.targetSublocationId exists:
  sublocation = graph.getNode(targetSublocationId)
  if sublocation exists and sublocation.properties.parentLocationId === agent's current locationId:
    update agent's located_at edge to point at sublocationId
    clear targetSublocationId from movementState
  else:
    // Sublocation dissolved while agent was traveling — fail-soft
    // Agent stays at parent location, targetSublocationId cleared
    // Decision pipeline will re-evaluate next tick
    clear targetSublocationId from movementState
```

This means the agent's `located_at` edge points to the sublocation while they're attempting the encounter there. When the encounter completes or the agent moves on, they return to the parent location.

#### 4c. Encounter completion: return to parent

When an encounter completes (or is abandoned), if the agent's `located_at` points to a sublocation, move them back to the parent:

```typescript
// In encounter resolution phase, after marking encounter completed/abandoned:
const agentLocation = getCurrentLocation(graph, agentId);
if (agentLocation) {
  const locProps = agentLocation.properties as Partial<SublocationProperties>;
  if (locProps.parentLocationId) {
    // Agent is at a sublocation — return to parent
    updateLocatedAt(graph, agentId, locProps.parentLocationId);
  }
}
```

This ensures agents don't get "stuck" in a sublocation after their encounter ends.

#### 4d. Distance matrix implications

The `DistanceMatrix` is built from location-to-location distances. Sublocations share their parent's hex coordinates and have zero additional travel cost. **No changes needed to the distance matrix** — the `entry.locationId` on cache entries still points to the parent location, which is what the distance matrix indexes.

**Tracing:**
The `ScoringTrace` already logs `templateId` and `locationId`. With the addition of `sublocationId` from System 2, the full path is traceable: "Agent selected encounter X at sublocation Y within location Z, queued movement to Z, arrived, entered Y, started X."

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Sublocation dissolved while agent was traveling | Agent stays at parent location. `targetSublocationId` cleared. Decision pipeline re-evaluates next tick. |
| Sublocation node not found on arrival | Same as above — stay at parent, clear target, re-evaluate. |
| Agent's `located_at` points to a sublocation whose parent is unknown | Agent stays put. Encounter resolution will skip the return-to-parent step. |
| `targetSublocationId` set but encounter is remote (`attempt_remote`) | Field ignored — remote encounters don't require physical presence at sublocation. |

**PRNG:** None — arrival logic is deterministic state mutation.

---

### System 5: Remove Dead Code

Delete `generateEncounterCandidates()` from `encounterCandidates.ts`. Its responsibilities are now split:

- **Sublocation creation** → moved to eager creation in `seedWorld` (System 1)
- **Template lookup by sublocation** → moved into cache build (System 2)
- **Threat filtering** → already handled by the filter pipeline's Stage 4
- **Social encounter targeting** → already handled by `generateSocialCandidates`

The `selectSublocation` scoring function in `sublocation.ts` also becomes unused by the decision pipeline — sublocations are now a structural concern (which templates are available where), not a per-agent per-tick selection. Keep the function for potential future use (e.g., narrative flavor for which sublocation an agent "visits" during an encounter), but remove the per-decision-tick call path.

---

## Impact on Decision Pipeline

### Before (current)
```
buildFullCache → getEncountersByLocationType("capital") → 15 templates × 1 entry per location
  Agent sees: "Thornwall has 15 undifferentiated encounters"
  Agent pathfinds to: Thornwall (parent location)
  Agent arrives at: Thornwall
  Agent starts: encounter (no sublocation context)
```

### After (proposed)
```
buildFullCache → for each sublocation of Thornwall:
  Market District → getEncountersBySublocationAndLocation("market-district", "capital") → 3 templates
  Temple Quarter → ... → 2 templates
  Barracks → ... → 2 templates
  Throne Room → ... → 1 template
  (location-level fallback templates) → distributed across sublocations

  Agent sees: "The Merchant's Gambit at Market District (Thornwall)" as a distinct candidate
  Agent pathfinds to: Thornwall (parent location, using locationId for distance)
  Agent arrives at: Thornwall → auto-enters Market District (targetSublocationId)
  Agent starts: The Merchant's Gambit (at Market District)
  Agent completes: returns to Thornwall (parent location)
```

### Cache size estimate

Current: ~80 templates × ~5 locations ≈ ~400 entries (many duplicated across locations of same type).

Proposed: ~80 templates × ~15 sublocations (avg 3 per location × 5 locations) ≈ ~300-500 entries. Comparable size — templates with `sublocationTypes` restrictions reduce duplication, while the sublocation fan-out increases it. Net effect is roughly neutral.

### Filter pipeline changes

The filter pipeline (`encounterFilterPipeline.ts`) operates on `EncounterCacheEntry[]` and uses `entry.locationId` for distance checks. **No changes needed** — `locationId` still points to the parent location (for travel cost), and the new `sublocationId` field is additive.

### Scoring changes

The scoring module (`encounterScoring.ts`) uses `entry.locationId` for distance and `entry.motivations` for desire. **No changes needed** — both fields are populated correctly by the new cache build. The `sublocationId` is carried through for tracing/display but doesn't affect the score formula.

### Movement changes

Movement destination remains the parent location. Pathfinding algorithm unchanged. The only addition is `targetSublocationId` on `MovementState`, which triggers a `located_at` update on arrival. Zero-cost sublocation entry means no impact on travel time calculations.

---

## Implementation Order

1. **System 1** — Eager sublocation creation in `seedWorld`. Low risk, self-contained.
2. **System 2** — Encounter-level cache rebuild. Core change, needs careful testing.
3. **System 3** — Cache lifecycle hooks. Depends on System 2's new cache structure.
4. **System 4** — Sublocation-aware movement & arrival. Depends on System 2's `sublocationId` on cache entries.
5. **System 5** — Dead code removal. Cleanup after Systems 1-4 are verified.

---

## NFP Compliance Summary

| Priority | Status | Notes |
|----------|--------|-------|
| 1. Tunability | PASS | No new magic numbers. Existing constants unchanged. Template-sublocation mapping is data-driven via `sublocationTypes` field on templates and `SUBTYPE_SUBLOCATION_MAP`. |
| 2. Inspectability | PASS | `sublocationId` added to cache entries and scoring traces. Agent's decision now traceable to specific encounter at specific sublocation. |
| 3. Determinism | PASS | Eager sublocation creation uses same seeded PRNG. Cache build is deterministic lookup. Lifecycle hooks are deterministic reactions. |
| 4. Fail-soft | PASS | Every system has explicit fallback table. Missing sublocations → location-level fallback. Missing templates → empty entries. Cache mutation failures → stale but functional. |
| 5. Narrative over mechanical | PASS | Agents now pursue specific encounters that align with their axiological profile, producing more legible narrative ("Kael travels to the Market District to attempt The Merchant's Gambit") vs generic location attraction. |
| 6. Additive over destructive | PASS with note | System 5 removes dead code (`generateEncounterCandidates`). This is a true dead path — it was never called by the decision pipeline. The `selectSublocation` function is preserved. System 4 adds `targetSublocationId` to `MovementState` (additive field). |
| 7. Performance budget | PASS | Cache size roughly constant. No per-tick computation added — cache build moves work from per-agent-per-tick (the orphaned `generateEncounterCandidates`) to once-at-startup. Sublocation entry on arrival is O(1) graph mutation. |
