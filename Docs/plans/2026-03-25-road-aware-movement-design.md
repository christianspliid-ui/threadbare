# Road-Aware Agent Movement — Design Doc

**Date:** 2026-03-25
**Status:** Design complete, pending implementation
**Depends on:** Road Network (complete), Movement Execution (complete), Agent Decision & Encounter Awareness (partial — P1 decision pipeline implemented, mid-movement re-evaluation limited)
**Brainstorm notes:** Cowork conversation 2026-03-25 (road movement discussion)

## Problem

Roads and trails exist as first-class graph edges (`type: 'road'`) with full hex paths, terrain-aware costs, and visual rendering. But they are purely cosmetic — they have zero mechanical effect on gameplay:

1. **Pathfinding ignores roads.** `findShortestPath` (Dijkstra) only walks `adjacent` and `contains` edges. An agent traveling from Town A to City B across mountains pays the full terrain tax even when a paved road connects them.

2. **Movement animation doesn't follow roads.** Each graph edge traversal produces a single 800ms bezier hop from one hex to the next. When an agent crosses 8 hexes via road, the player sees one long arc, not an agent walking the road. The road is visible underneath but the agent floats over it.

3. **Moving agents are decision-locked.** `phaseAgentDecision` (line 114) explicitly skips agents with active `movementQueue`. The only re-evaluation is a narrow gate in `phaseMovement` requiring a 2× score improvement after 4+ ticks. An agent on a long road journey cannot react to encounters, threats, or changed circumstances.

4. **No concept of intermediate hex position.** An agent is either "at Location A" or "at Location B." There is no engine-level representation of "between locations, currently at hex (7,4)." This matters for road traversal, encounter interrupts, and visual accuracy.

The result: roads look great but do nothing. Agents fly between locations ignoring infrastructure. Long journeys are uninterruptible. The visual and mechanical layers are disconnected.

## Design Principles

1. **Roads reduce cost, not replace pathfinding.** Road edges compete as alternative paths in the existing Dijkstra algorithm. They don't create a separate routing system — they're just cheaper edges.

2. **Animation is the movement.** The agent's hex-by-hex progression along a road path IS the movement, not a cosmetic overlay. Each hex crossed is a tick of accumulated progress. What the player sees matches what the engine computes.

3. **Moving agents remain decision-capable.** Every tick, every agent gets a decision opportunity. Road traversal is interruptible — agents can leave the road mid-journey if circumstances change.

4. **Additive over destructive.** Off-road movement (single adjacent hops) works exactly as before. Road-awareness layers on top without disturbing the existing flow.

## Design Decisions

### Decision 1: Road Edges Join Dijkstra as First-Class Traversal Options

**Chosen:** Add `'road'` to the edge types that `findShortestPath` considers, alongside `'adjacent'` and `'contains'`. A road edge between Town A and City B appears as a direct graph edge with a pre-computed discounted cost, competing naturally with the hop-by-hop adjacent path.

**Why:** Roads already exist as graph edges with `totalCost` and `hexPath`. Making them visible to Dijkstra requires minimal code change — one additional spread in the `outgoingEdges` array (line 105 of `pathfinding.ts`). The algorithm handles the rest: if the road is cheaper, the path goes through it; if not, adjacent hops win.

**Road cost formula:**

The cost stored on the road edge at worldgen is the raw A* terrain cost (no discount). At pathfinding time, the road discount is applied:

```
roadEdgeCost = roadEdge.properties.totalCost × ROAD_COST_MULTIPLIER[roadType]
```

This discount is applied once when Dijkstra evaluates the edge, not stored permanently — so the same road edge can have different effective costs if multipliers change (tunability).

**What changes in `findShortestPath`:**
- Add `...graph.getOutgoingEdges(current, 'road')` to the edge scan
- Also add `...graph.getIncomingEdges(current, 'road')` — road edges are stored with canonicalized source/target (alphabetical ID order), so an agent traveling B→A needs to see the A→B road edge via incoming edges. For incoming edges, the "neighbor" is `edge.source` (not `edge.target`)
- For road edges, cost = `totalCost × ROAD_COST_MULTIPLIER[roadType]` instead of `computeEdgeCost`
- Road edges skip the `neighborNode.type !== 'location'` check — both endpoints are already locations by construction (road generation only connects settlement nodes)

**hexPath direction caveat:** Road edges store `hexPath` in the direction of the original MST/trail computation (from→to), which may not match the canonical source→target ordering on the graph edge. When the agent traverses the road in the opposite direction (i.e., the agent is at `target` traveling to `source`, or found the road via incoming edges), **the hexPath must be reversed**. This reversal happens when populating `roadHexQueue` in `initMovementState`, not in pathfinding itself.

**Cost formula scale note:** The road's stored `totalCost` uses the hex-grid A* formula (`BASE_EDGE_TRAVERSAL_COST + terrain_tax` per hex step), while adjacent graph edges use `computeEdgeCost` (`2 × BASE + departure_tax + arrival_tax + location_tax + speed_modifier`). These are different scales. This is intentional — the road competes as a single edge in Dijkstra, and the `ROAD_COST_MULTIPLIER` is tuned as a gameplay lever relative to the total adjacent-hop cost for the same route, not matched to the per-hop formula. When tuning, compare total road edge cost vs total multi-hop cost for representative routes.

**What changes in `computeEdgeCost`:** Nothing. `computeEdgeCost` remains the per-hop terrain cost calculator. Road costs are pre-computed at worldgen and discounted at pathfinding time. The two systems don't overlap.

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `ROAD_MAJOR_COST_MULTIPLIER` | 0.4 | Discount applied to major road A* cost at pathfinding time |
| `ROAD_TRAIL_COST_MULTIPLIER` | 0.7 | Discount applied to trail A* cost at pathfinding time |

**Tracing:**

When pathfinding selects a road edge, the `PathResult` is extended with road metadata:

```typescript
export interface PathResult {
  path: string[];
  totalCost: number;
  /** If set, the path includes road segments with hex-level detail */
  roadSegments?: RoadSegmentInfo[];
}

export interface RoadSegmentInfo {
  /** Source location node ID */
  fromId: string;
  /** Destination location node ID */
  toId: string;
  /** Road type used */
  roadType: 'major' | 'trail';
  /** Full hex path for this road segment */
  hexPath: HexCoord[];
  /** Discounted cost for this segment */
  discountedCost: number;
}
```

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Road edge has missing/corrupt `totalCost` | Skip road edge, Dijkstra falls back to adjacent hops |
| Road edge has missing/corrupt `hexPath` | Use road for pathfinding cost but fall back to single bezier animation |
| Road edge points to non-existent node | Skip edge (Dijkstra already handles missing neighbors) |
| Road multiplier ≤ 0 | Clamp to `MIN_EDGE_COST` (0.5) — same floor as terrain costs |

**PRNG callout:** None — pathfinding is deterministic (Dijkstra with stable iteration order). Road costs are deterministic given the same multipliers.

### Decision 2: Hex-Level Movement State Tracks Intermediate Position

**Chosen:** Extend `MovementState` with fields that track the agent's current hex position during road traversal, plus the hex-level path they're following.

```typescript
export interface MovementState {
  // ... existing fields ...

  /** Current hex position (updated each time agent crosses a hex boundary).
   *  For non-road movement: matches the hex of the current graph node.
   *  For road movement: advances through the road's hexPath. */
  currentHexPosition?: HexCoord;

  /** When traversing a road segment, the remaining hex path to follow.
   *  Consumed one hex at a time as ticks accumulate.
   *  undefined/empty = not on a road (normal adjacent hop). */
  roadHexQueue?: HexCoord[];

  /** Per-hex cost for the current road segment.
   *  Pre-computed when entering a road: discountedCost / hexPath.length.
   *  Used by tickMovement to advance hex-by-hex instead of node-by-node. */
  roadHexCost?: number;

  /** Road type being traversed (for animation speed and trail rendering). */
  currentRoadType?: 'major' | 'trail';
}
```

**Why:** The current `MovementState` tracks position at the graph node level only (`movementQueue: string[]`). An agent "at" Town A or "at" Town B, nothing in between. For road traversal, the agent needs a hex-level position that updates every tick: they're at hex (5,3), then (6,3), then (7,4) as they walk the road. This position is needed for:
- Animation: sprite position matches engine state
- Decision interrupts: re-evaluation starts from current hex, not the origin location
- Trail rendering: trails trace the road path hex by hex
- Encounter detection: the agent is "somewhere" even when between locations

**`located_at` edge policy:** The `located_at` graph edge updates only when the agent formally arrives at a location node — NOT at intermediate road hexes. An agent mid-road is between locations. Their `currentHexPosition` is authoritative for rendering and decision-making; their `located_at` edge reflects the last location they departed from (or arrived at).

**Implication for colocation detection:** `phaseColocationDetection` currently checks shared `located_at` targets. Agents on roads won't trigger colocation with agents at intermediate hexes — only at endpoints. This is correct behavior: you don't "encounter" someone just because you pass through the same hex while traveling. Road encounters (bandits, travelers) are a future system, not part of this design.

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `ROAD_MAJOR_HEX_COST` | Computed: `(totalCost × ROAD_MAJOR_COST_MULTIPLIER) / hexPath.length` | Per-hex tick cost on major roads |
| `ROAD_TRAIL_HEX_COST` | Computed: `(totalCost × ROAD_TRAIL_COST_MULTIPLIER) / hexPath.length` | Per-hex tick cost on trails |
| `MIN_ROAD_HEX_COST` | 0.25 | Floor for per-hex road cost (prevents instant traversal) |

**Tracing:**

Road traversal emits a `road_hex_transition` trace type:

```typescript
interface RoadHexTransitionTrace extends TraceEntry {
  type: 'road_hex_transition';
  agentId: string;
  fromHex: HexCoord;
  toHex: HexCoord;
  roadType: 'major' | 'trail';
  hexProgress: number;  // e.g., "4 of 8"
  hexTotal: number;
  ticksAccumulated: number;
  hexCost: number;
}
```

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| `roadHexQueue` is empty mid-traversal | Treat as arrived at destination (same as empty `movementQueue`) |
| `currentHexPosition` is undefined | Derive from `located_at` edge → location node → hexCol/hexRow |
| `roadHexCost` is NaN or ≤ 0 | Use `MIN_ROAD_HEX_COST` |
| Road segment hexPath contains out-of-bounds hex | Skip that hex, advance to next (log warning trace) |

**PRNG callout:** None — hex queue consumption is deterministic.

### Decision 3: Movement Execution Gains Road Mode

**Chosen:** `tickMovement` gains a road traversal branch. When `roadHexQueue` is non-empty, the function advances the agent one hex at a time along the road, accumulating ticks against `roadHexCost` per hex. When the road hex queue is exhausted, the agent arrives at the destination location node and the `located_at` edge updates.

**Current flow (preserved for non-road movement):**
```
tickMovement() → accumulate 1 tick → if ticks >= currentEdgeCost → advance to next node in movementQueue
```

**New flow (when roadHexQueue is populated):**
```
tickMovement() → accumulate 1 tick → if ticks >= roadHexCost → pop next hex from roadHexQueue
  → update currentHexPosition
  → emit road_hex_transition trace
  → record MovementHistoryEntry (with hexCol, hexRow)
  → if roadHexQueue now empty → advance to next node in movementQueue (location arrival)
    → update located_at edge
  → else → reset ticksAccumulated, continue road traversal
```

**Why a branch, not a replacement?** Off-road movement (adjacent hops between neighboring locations) doesn't need hex-level granularity — it's one hop, one hex. Forcing it through the road hex queue would add overhead for the common case. The branch checks `roadHexQueue?.length > 0` — cheap and clear.

**How `roadHexQueue` gets populated:** When `initMovementState` detects that the next edge in the path is a road edge (via `RoadSegmentInfo` from pathfinding), it sets `roadHexQueue` to the road's `hexPath` (minus the starting hex, since the agent is already there) and computes `roadHexCost`. If the agent is traveling opposite to the stored hexPath direction, the path is reversed before slicing (see Decision 1 hexPath direction caveat). When the road segment is fully traversed, the queue is cleared and the next movement queue entry is processed normally.

**Mixed paths (road + adjacent hops):** A path from A to C might use a road from A→B then an adjacent hop B→C. The `movementQueue` is `[B, C]` with a `RoadSegmentInfo` for the A→B segment. When the agent completes the road (arrives at B), `roadHexQueue` empties, `located_at` updates to B, and the next edge (B→C) processes as a normal adjacent hop with no road context. The transition is clean because `roadHexQueue` being empty triggers the standard `movementQueue` advancement logic.

**Constants table:**

(Uses constants from Decision 2 — no additional constants needed.)

**Tracing:**

Standard `agent_movement` tick events continue to fire on location node transitions. Road hex transitions get the additional `road_hex_transition` trace from Decision 2. Both are emitted, so the trace stream shows both the hex-level and node-level movement.

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| `roadHexCost` is 0 | Clamp to `MIN_ROAD_HEX_COST`, log warning |
| `roadHexQueue` hex doesn't exist in tile grid | Skip hex, advance (non-fatal — worldgen may have edge cases) |
| Agent graph node missing during road traversal | Abandon movement, clear state (existing fail-soft pattern) |

**PRNG callout:** None — tick accumulation and queue consumption are deterministic.

### Decision 4: Moving Agents Get Gated Re-Evaluation (Replace Skip, Don't Remove It)

**Chosen:** Replace the blanket skip of moving agents in `phaseAgentDecision` (lines 110–116) with a **gated re-evaluation path** that respects in-flight movement. Moving agents do NOT enter the full decision pipeline. Instead, they run a constrained "should I reroute?" check with strict guards against the hazards of concurrent movement mutation.

**Why not simply remove the skip?** The skip is a correctness guard, not just a performance optimization. Two independent systems write to the same `movementState` field: `phaseAgentDecision` (creates fresh state via `initMovementState`) and `phaseMovement` (ticks existing state). Without the skip, a moving agent could:

1. **Have its movement overwritten** — `phaseAgentDecision` creates an entirely new `MovementState`, replacing the in-flight `roadHexQueue`, `ticksAccumulated`, and encounter targeting fields. The old journey is silently lost.
2. **Start a local encounter while moving** — `scoreAndSelect` returns `start_local` if the agent's `located_at` matches an encounter location. But a moving agent's `located_at` is their departure point, not their current road position. The agent would start an encounter at a location they physically left several ticks ago.
3. **Thrash between destinations** — Every re-evaluation tick, a marginally better encounter nearby could trigger a reroute, then next tick something else appears. Agent never completes any journey.
4. **Become double-bound** — Agent enters an encounter AND retains a movement queue. `phaseMovement` advances movement while encounter resolution assumes the agent is stationary. State becomes incoherent.

**What replaces the skip:**

```
if (agent has movementQueue.length > 0) {
  // GUARD 1: Tick gating — only re-evaluate every DECISION_REEVALUATION_TICKS
  if (currentTick - lastDecisionTick < DECISION_REEVALUATION_TICKS) continue;

  // GUARD 2: Only score the CURRENT destination's encounter against alternatives
  //          Do NOT run the full filter pipeline (too expensive, wrong context)
  currentScore = re-score current targetEncounterId at current destination
  bestAlternative = score top candidate from encounter cache (quick scan, no social gen)

  // GUARD 3: Reroute threshold — alternative must be dramatically better
  if (bestAlternative.score < currentScore × REROUTE_SCORE_MULTIPLIER) continue;

  // GUARD 4: Only allow action = 'queue_movement' — never 'start_local' or 'attempt_remote'
  //          A moving agent cannot start encounters until they arrive somewhere
  if (bestAlternative.action !== 'queue_movement') continue;

  // GUARD 5: Invalidation check — reroute if current target no longer exists
  //          (encounter removed, location destroyed, etc.)
  if (currentTargetValid) {
    // Apply reroute threshold
    reroute to bestAlternative
  } else {
    // Target invalid — reroute unconditionally
    reroute to bestAlternative (or idle if nothing scores above threshold)
  }
}
```

**This is NOT the full decision pipeline.** Moving agents skip: social candidate generation, the full 5-stage filter pipeline, and the ability to start local encounters or attempt remote ones. They only check: "is my current destination still the best place to be heading?" This is cheap (one score comparison), safe (no movement overwrite unless threshold is met), and prevents all four hazards listed above.

**Reroute mechanics when triggered:** When an agent reroutes mid-road:
1. Their `currentHexPosition` becomes the visual origin
2. Pathfinding runs from the nearest location node to `currentHexPosition` (the V1 snap-back — see below)
3. New `movementQueue` and possibly new `roadHexQueue` are computed
4. `lastDecisionTick` is updated to prevent immediate re-evaluation
5. Old `targetEncounterId` and `targetSublocationId` are cleared before setting new ones

**Simplification for V1:** Rerouting from mid-road snaps the agent back to the nearest endpoint of the current road segment (the location they most recently departed from or are closest to). This avoids needing arbitrary hex→location pathfinding and keeps the graph-level movement model intact. The `currentHexPosition` is still tracked for animation and trail accuracy, but pathfinding restarts from a known location node.

**Visual discontinuity on reroute:** When an agent snaps back to the nearest location node for pathfinding, their visual position (at the current road hex) won't match the pathfinding origin. The animation system handles this with a standard bezier hop from `currentHexPosition` to the snap-back location's hex, using off-road timing (800ms). This looks intentional — the agent "turns around" and walks back to the nearest town before heading off in a new direction. Future Work (hex-level pathfinding from arbitrary position) would eliminate the snap-back entirely.

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `REROUTE_SCORE_MULTIPLIER` | 1.5 | New destination must score this much better than current to trigger reroute |
| `DECISION_REEVALUATION_TICKS` | 4 | (Existing) Minimum ticks between re-evaluations |

**Tracing:**

```typescript
interface AgentRerouteTrace extends TraceEntry {
  type: 'agent_reroute';
  agentId: string;
  oldDestinationId: string;
  newDestinationId: string;
  currentHexPosition: HexCoord;
  reason: 'better_encounter' | 'target_invalid' | 'threat';
  oldScore: number;
  newScore: number;
}
```

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Re-evaluation scoring throws | Caught per-agent, continue current path (existing pattern) |
| Pathfinding from snap-back location returns null | Agent stays on current path |
| `currentHexPosition` undefined during reroute | Derive from last known location node |
| No candidates score above threshold | Agent continues current path (not idle — still traveling) |
| Current `targetEncounterId` no longer exists in cache | Reroute unconditionally to best available, or idle at next location arrival |
| Re-evaluation returns `start_local` or `attempt_remote` | Ignored — moving agents can only `queue_movement` |

**PRNG callout:** None — decision scoring is deterministic per the P1 design (highest score wins, no randomness at selection).

### Decision 5: Animation System Gains Road Traversal Mode

**Chosen:** The hex map animation system (`agentAnimationState.ts`, `HexMapV2.tsx`) gains a new mode for multi-hex road animation. When the engine reports a `road_hex_transition` (agent advanced one hex along a road), the animation system queues a shorter, road-specific bezier hop. Multiple hops chain smoothly.

**Current animation model (preserved for off-road):**
- Detect hex change in React prop diff → `startMoveAnimation(fromHex, toHex)` → 800ms bezier hop → 150ms settle bounce

**New road animation model:**
- Detect hex change with road context → `startRoadHopAnimation(fromHex, toHex, roadType)` → shorter duration bezier → no settle bounce until final hex → chain next hop immediately

**Road hop timing:**

| Road type | Per-hex duration | Purpose |
|-----------|-----------------|---------|
| `major` | `ROAD_MAJOR_HOP_MS` = 300ms | Fast travel — agent visibly zips along |
| `trail` | `ROAD_TRAIL_HOP_MS` = 500ms | Moderate travel — noticeably faster than off-road but not instant |
| off-road | `AGENT_MOVE_TRANSITION_MS` = 800ms | Existing — unchanged |

**How the animation system knows it's a road hop:** The `MovementState` on the agent prop includes `currentRoadType`. When `HexMapV2.tsx` detects a hex change and sees `currentRoadType` is set, it uses road hop timing. When `currentRoadType` is undefined, it uses the existing 800ms bezier.

**Chaining:** Road hops chain without a settle bounce between them. The settle bounce (150ms, scale 1.05→1.0) only plays on the final hex of the road segment (when `roadHexQueue` becomes empty). This creates a smooth flowing motion along the road rather than a stuttery hop-pause-hop pattern.

**Bezier wobble along roads:** Road hops use a reduced wobble magnitude compared to off-road hops. Off-road movement has a perpendicular wobble that simulates "picking a path through terrain." Road movement should feel more directed — slight wobble for visual interest but noticeably straighter.

**Animation/tick timing contract:** Animation durations (300ms, 500ms, 800ms per hex) are visual-only — they don't affect engine tick rate. The engine advances hexes based on tick accumulation against `roadHexCost`. If the game tick rate is fast enough that multiple hex transitions occur between animation frames, the animation system snaps to the latest position (see fail-soft: "multiple road hops arrive in same frame"). Conversely, if ticks are slow, the animation for a hex finishes well before the next transition — the agent waits visually at the hex center until the next tick advances them. This is the same contract as the existing 800ms bezier: animation duration and tick rate are independent, and the system is tolerant of mismatches.

**Trail rendering:** Each road hex transition emits a trail segment, same as current non-road transitions. The trail naturally traces the road because each segment connects adjacent hexes along the `hexPath`. Trail color remains faction heraldic. Trail opacity and fade remain unchanged.

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `ROAD_MAJOR_HOP_MS` | 300 | Animation duration per hex on major roads |
| `ROAD_TRAIL_HOP_MS` | 500 | Animation duration per hex on trails |
| `ROAD_WOBBLE_FACTOR` | 0.3 | Multiplier on standard wobble magnitude for road hops (1.0 = same as off-road) |
| `AGENT_MOVE_TRANSITION_MS` | 800 | (Existing) Off-road hop duration — unchanged |
| `SETTLE_DURATION_MS` | 150 | (Existing) Settle bounce — only at end of road segment |

**Tracing:**

Animation state is render-layer only (not engine state), so no engine traces. The `AgentAnimState` interface gains:

```typescript
export interface AgentAnimState {
  // ... existing fields ...
  /** If set, this is a road hop — affects wobble and chaining behavior */
  roadContext?: {
    roadType: 'major' | 'trail';
    isLastHop: boolean;  // true → play settle bounce after this hop
  };
}
```

**Fail-soft:**

| Failure case | Fallback |
|---|---|
| Road hop duration ≤ 0 | Clamp to 100ms minimum |
| Multiple road hops arrive in same frame (fast-forward / lag) | Process all, snap to latest position |
| Sprite missing during road animation | Skip silently (existing pattern) |
| `currentRoadType` undefined but `roadHexQueue` populated | Fall back to off-road hop timing |

**PRNG callout:** Bezier wobble seed unchanged — deterministic via `(agentId, fromHex, toHex)`. Road wobble factor is a multiplier on the existing wobble magnitude, preserving determinism.

### Decision 6: Road Costs Pre-Computed at Worldgen, Discounted at Runtime

**Chosen:** The `totalCost` stored on road edges at worldgen remains the raw A* terrain cost (current behavior — no change to `generateRoadEdges`). The road discount multiplier is applied at pathfinding time by `findShortestPath`. This separation keeps worldgen stable and makes the discount tunable without re-running worldgen.

**Why not store discounted cost at worldgen?** Tunability (NFP #1). If the user wants to change `ROAD_MAJOR_COST_MULTIPLIER` from 0.4 to 0.5, the change takes effect immediately in pathfinding without needing to regenerate the world. The raw cost is the ground truth; the discount is a gameplay lever.

**Why not compute road cost at pathfinding time (re-run A* per road)?** Performance. Road A* was already computed at worldgen and the result stored. Re-running it per pathfinding call would be O(hexes²) per road edge per Dijkstra relaxation. The stored `totalCost` makes road edge evaluation O(1).

**PRNG callout:** Road generation uses deterministic A* with stable terrain data — same seed = same roads = same stored costs.

## Architecture

### Data Flow Overview

```
Worldgen                    Pathfinding                   Movement Execution
─────────                   ───────────                   ──────────────────
generateRoadEdges()         findShortestPath()            tickMovement()
  → road edges with           → considers road edges        → if roadHexQueue:
    hexPath, totalCost          with discount multiplier        advance hex-by-hex
                              → PathResult includes           → emit road_hex_transition
                                RoadSegmentInfo[]             → update currentHexPosition
                                                            → if roadHexQueue empty:
                                                                arrive at location node

Decision Phase              Animation Layer
──────────────              ───────────────
phaseAgentDecision()        HexMapV2 detects hex change
  → moving agents             → road context → short hop
    re-evaluated every          → chain hops without settle
    REEVALUATION ticks          → settle bounce on final hex
  → reroute if better         → trail traces road path
    candidate appears
```

### Modified Files

| File | Change |
|------|--------|
| `src/engine/pathfinding.ts` | Add road edges to Dijkstra scan; apply discount; return `RoadSegmentInfo[]` on `PathResult` |
| `src/types/movement.ts` | Add `currentHexPosition`, `roadHexQueue`, `roadHexCost`, `currentRoadType` to `MovementState` |
| `src/engine/movementExecution.ts` | Add road hex traversal branch in `tickMovement`; update `initMovementState` to populate road fields |
| `src/engine/phaseAgentDecision.ts` | Remove moving-agent skip (lines 110–116); add re-evaluation with `REROUTE_SCORE_MULTIPLIER` gate |
| `src/engine/phaseMovement.ts` | Pass `RoadSegmentInfo` through to `initMovementState` when starting road-based movement |
| `src/data/movement-content.ts` | Add road cost multipliers and road hex cost constants |
| `src/components/HexMapV2/agents/agentAnimationState.ts` | Add `roadContext` to `AgentAnimState`; add `startRoadHopAnimation` factory; modify `tickAgentAnimations` for chaining |
| `src/components/HexMapV2/HexMapV2.tsx` | Detect road context on hex change; use road hop timing; chain hops |
| `src/data/agent-visual-content.ts` | Add `ROAD_MAJOR_HOP_MS`, `ROAD_TRAIL_HOP_MS`, `ROAD_WOBBLE_FACTOR` |
| `src/types/trace.ts` | Add `RoadHexTransitionTrace`, `AgentRerouteTrace` interfaces |

### Implementation Order

1. **Road-aware pathfinding** (Decision 1) — extend Dijkstra, add constants. Testable in isolation: verify road paths are cheaper.
2. **Hex-level movement state** (Decision 2) — extend `MovementState`. Backward-compatible: new fields are optional.
3. **Road mode in movement execution** (Decision 3) — add road branch to `tickMovement`. Testable: verify hex-by-hex advancement and `located_at` update on completion.
4. **Decision re-evaluation for moving agents** (Decision 4) — remove skip, add reroute logic. Testable: verify agents change course when better option appears.
5. **Animation system road mode** (Decision 5) — road hop timing, chaining, reduced wobble. Visual verification required (Claude in Chrome at `?view=game`).

Steps 1–3 are engine-only and independently testable. Step 4 depends on 1–3. Step 5 depends on 2–3 but can be developed in parallel with 4.

## Testing Strategy

### Regression Safety

Adding optional fields to `MovementState` is safe — all 15 consumer files use spread operators or explicit field reads, no serialization/deserialization touches `MovementState`, and no code iterates over its keys. Existing tests will pass without modification.

The riskiest change is Decision 4 (gated re-evaluation). The existing test at `phaseAgentDecision.test.ts` (line 206–223) verifies the skip behavior. This test must be updated to verify the NEW gated behavior, not just removed.

### Required Test Cases by Step

**Step 1 — Road-aware pathfinding:**
- Road path is cheaper than equivalent adjacent-hop path (grassland route)
- Road path loses to adjacent hops when terrain is easy and road is long (road not always optimal)
- Dijkstra finds road via incoming edges (agent travels opposite to stored source→target)
- Missing `totalCost` on road edge → road edge skipped, adjacent path used
- Road multiplier applied correctly: `totalCost × multiplier`
- `RoadSegmentInfo[]` populated on `PathResult` when road is selected
- Mixed path: road segment + adjacent hop in same path

**Step 2 — Hex-level movement state:**
- New fields default to `undefined` when not on a road
- `initMovementState` populates `roadHexQueue` from `RoadSegmentInfo`
- `hexPath` is reversed when agent travels opposite to stored direction
- Starting hex is excluded from `roadHexQueue` (agent is already there)
- Spread operator in `tickMovement` preserves new fields

**Step 3 — Road mode in movement execution:**
- Agent advances one hex per `roadHexCost` ticks along road
- `currentHexPosition` updates on each hex transition
- `located_at` edge does NOT update at intermediate road hexes
- `located_at` edge DOES update when `roadHexQueue` empties (arrival)
- `MovementHistoryEntry` recorded with hex coords for each road hex transition
- Mixed path: agent completes road segment, then processes next adjacent hop normally
- `roadHexCost` clamped to `MIN_ROAD_HEX_COST` when computed value is too low
- Empty `roadHexQueue` mid-traversal → treated as arrived

**Step 4 — Gated re-evaluation:**
- Moving agent is NOT processed by full decision pipeline
- Re-evaluation respects tick gating (`DECISION_REEVALUATION_TICKS`)
- Agent does NOT reroute when alternative scores below `REROUTE_SCORE_MULTIPLIER × currentScore`
- Agent DOES reroute when alternative scores above threshold
- Agent reroutes unconditionally when `targetEncounterId` no longer exists
- Reroute clears old `targetEncounterId` and `targetSublocationId`
- Re-evaluation NEVER returns `start_local` for a moving agent
- Re-evaluation NEVER returns `attempt_remote` for a moving agent
- `lastDecisionTick` updates after reroute to prevent immediate re-evaluation
- **Regression:** idle agents still enter full decision pipeline (existing behavior preserved)

**Step 5 — Animation road mode:**
- Road hop uses `ROAD_MAJOR_HOP_MS` / `ROAD_TRAIL_HOP_MS` timing
- Settle bounce only on final hop of road segment
- Road hops chain without intermediate settle
- Off-road hops use existing 800ms timing (regression)
- `roadContext.isLastHop` correctly identifies final hex
- Missing sprite during road animation → skipped silently
- Visual verification at `?view=game`: agent follows rendered road path

### Integration Tests

- Full tick loop: agent decides to travel via road → advances hex-by-hex → arrives → enters encounter
- Full tick loop: agent on road → re-evaluation fires → reroutes → completes new journey
- Full tick loop: agent on road → target becomes invalid → reroutes or idles on arrival
- Multiple agents on same road → no state interference between them
- Agent uses road for part of journey, adjacent hops for rest → seamless transition

### What NOT to Test (Out of Scope)

- Road encounters at intermediate hexes (future work)
- Hex-level pathfinding from arbitrary position (future work)
- Road construction or decay (future work)

## Future Work (Not In Scope)

- **Road encounters:** Bandits, travelers, merchant caravans encountered while traversing a road. Requires colocation detection at the hex level, not just location level.
- **Road construction:** Player action to build roads between locations. Would call `findHexPath` and create a new road edge.
- **Road decay:** Roads degrade over time without maintenance, increasing their cost multiplier.
- **Hex-level pathfinding from arbitrary position:** Currently, rerouting from mid-road snaps to the nearest location node. Full hex→location pathfinding would allow seamless off-road rerouting from any hex.
- **Agent speed on roads as trait:** A `road_speed` trait modifier that further reduces road cost for certain agents (merchants, cavalry).
- **Road preference by agent type:** Trade caravans strongly prefer roads; adventurers are indifferent; wilderness scouts prefer off-road.

## NFP Compliance Summary

| # | Priority | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Tunability | PASS | 8 new named constants, 2 existing reused. All costs, timings, and thresholds are tunable. Road feel = changing `ROAD_MAJOR_COST_MULTIPLIER` and `ROAD_MAJOR_HOP_MS`. |
| 2 | Inspectability | PASS | Two new trace types (`road_hex_transition`, `agent_reroute`). `PathResult` extended with `RoadSegmentInfo[]`. Animation state carries `roadContext`. Full causal chain: pathfinding chose road → movement advanced hex-by-hex → animation reflected it. |
| 3 | Determinism | PASS | Road costs are deterministic (stored at worldgen from deterministic A*). Pathfinding is deterministic (Dijkstra, stable iteration). Tick accumulation is deterministic. Animation wobble uses existing deterministic seed. |
| 4 | Fail-soft | PASS | Every decision has a documented fallback. Missing road data → falls back to adjacent hops. Corrupt hex queue → treat as arrived. Failed re-evaluation → continue current path. The tick loop never crashes. |
| 5 | Narrative over mechanical | PASS | Agents visually walk roads — the player sees beings making sensible travel decisions through the world, not teleporting between nodes. Road travel feels purposeful. Mid-road interrupts create emergent story moments. |
| 6 | Additive over destructive | PASS | All new fields are optional on `MovementState`. Off-road movement is untouched. Pathfinding gains road edges additively. Animation branches on presence of `roadContext`. No existing interfaces are broken. |
| 7 | Performance budget | PASS with note | Road edge evaluation in Dijkstra is O(1) per edge (pre-computed cost × multiplier). Hex-level tick processing adds per-hex work for road-traveling agents only. For ~20 agents with ~50% on roads at any time, this is ~10 extra hex evaluations per tick — negligible. Profile if agent count grows significantly. |
