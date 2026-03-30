# Performance Scaling & Simulation Fidelity — Design Document

**Date:** 2026-03-03
**Status:** Draft
**Origin:** Architecture discussion on graph database scaling for turn-based simulation
**Related:** Actor CRUD Action System, Trait System, Cosmological Taxonomy

---

## 1. Design Philosophy

> "We simulate only to be able to tell better and more coherent stories. We have creative liberty to take shortcuts if they are nearly invisible to the player."

This document defines **performance contingency patterns** — architectural escape hatches that let us gracefully degrade simulation fidelity without the player noticing. Every pattern follows one rule: **if the player can't tell the difference, the shortcut is free.**

The game is a narrative engine, not a physics simulator. A distant faction's economy doesn't need frame-perfect accuracy — it needs to produce interesting events when the player finally turns their attention to it.

### 1.1 Performance Budget

Target: **end-of-turn processing completes in under 3 seconds** on a mid-range laptop browser.

| Scale Tier | Hexes | Active Actors | Edges | Turn Target |
|------------|-------|---------------|-------|-------------|
| Small (MVP) | 500–1,000 | 30–80 | 5K–15K | < 500ms |
| Medium | 1,000–2,500 | 80–200 | 15K–60K | < 1.5s |
| Large | 2,500–5,000 | 200–500 | 60K–150K | < 3s |
| Epic | 5,000+ | 500+ | 150K+ | Requires all contingencies active |

### 1.2 Where The Time Goes

Based on the CRUD action system and trait system designs, end-of-turn processing has these cost centers:

| Operation | Per-Actor Cost | Scaling | Notes |
|-----------|---------------|---------|-------|
| Action selection (motivation scoring) | O(48 templates × 10 values) | Linear in actors | Most expensive per-actor step |
| Graph traversal for prerequisites | O(edges per node × depth) | Varies by connectivity | Currently O(n) filters |
| Trait acquisition check (pattern matching) | O(action_history × rules) | Linear in traits × actors | Rolling window scans |
| Trait decay/evolution | O(active_traits) | Linear in total traits | Cheap per-trait |
| Action resolution (success/failure) | O(1) per action | Linear in actors | Dice roll + modifiers |
| Graph mutation (CRUD ops) | O(1–5 ops per action) | Linear in actors | 3–5 atomic ops each |
| Event condition checking | O(conditions × graph queries) | Potentially expensive | Depends on condition complexity |
| Cascading effects | Unbounded | Worst case: chain reactions | Needs circuit breaker |

---

## 2. Core Architecture: The Indexed Graph

Before any simulation shortcuts, the graph engine itself needs to be fast. The current `taxonomy.ts` uses `.filter()` and `.find()` on arrays — O(n) for every lookup. This is the single biggest win available.

### 2.1 Graph Index Layer

Replace array scans with hash-based lookups. This is not a shortcut — it's foundational infrastructure.

```typescript
interface IndexedGraph {
  // Node storage
  nodesById: Map<string, TaxonomyNode>;
  nodesByCategory: Map<string, Set<string>>;  // category → node IDs

  // Edge storage (adjacency lists)
  outgoing: Map<string, TaxonomyEdge[]>;      // source → edges
  incoming: Map<string, TaxonomyEdge[]>;      // target → edges
  edgesByType: Map<string, TaxonomyEdge[]>;   // type → edges

  // Composite indexes (built lazily)
  outgoingByType: Map<string, Map<string, TaxonomyEdge[]>>; // source → type → edges
}
```

**Impact:** Every `getEdgesForNode`, `getNodeById`, `getOutgoingEdges` call drops from O(n) to O(1). For a graph with 150K edges, this alone is ~1000x faster for individual lookups.

**Build cost:** O(n + e) at load time, negligible.

### 2.2 Dirty Flag System

Most of the graph doesn't change each turn. Track what changed and skip unchanged subgraphs.

```typescript
interface TurnDelta {
  modifiedNodes: Set<string>;      // nodes whose properties changed
  addedNodes: Set<string>;         // new nodes this turn
  removedNodes: Set<string>;       // deleted nodes this turn
  modifiedEdges: Set<string>;      // edges whose properties changed
  addedEdges: Set<string>;         // new edges
  removedEdges: Set<string>;       // deleted edges
  affectedActors: Set<string>;     // actors whose context changed (neighbor modified, etc.)
}
```

Every graph mutation records itself in the TurnDelta. Next turn, only actors in `affectedActors` need full re-evaluation. Others can reuse cached action scores.

**Estimated skip rate:** In a stable world, 70–90% of actors have unchanged contexts turn-to-turn.

---

## 3. Simulation Fidelity Tiers

The core scaling strategy: **not all actors deserve the same computational attention.** The system assigns each actor a fidelity tier that determines how thoroughly it's simulated.

### 3.1 The Spotlight Model

```
┌─────────────────────────────────────────────┐
│                                             │
│   TIER 1: FULL FIDELITY                     │
│   Player's focused actors + their targets   │
│   Every action scored, every trait checked   │
│   ~5–15 actors                              │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │                                     │   │
│   │   TIER 2: HIGH FIDELITY             │   │
│   │   Regional neighbors, rival factions│   │
│   │   Actions scored, major traits only │   │
│   │   ~20–60 actors                     │   │
│   │                                     │   │
│   │   ┌─────────────────────────────┐   │   │
│   │   │                             │   │   │
│   │   │   TIER 3: STATISTICAL       │   │   │
│   │   │   Distant factions/cultures │   │   │
│   │   │   Aggregate simulation      │   │   │
│   │   │   ~50–200 actors            │   │   │
│   │   │                             │   │   │
│   │   │   ┌─────────────────────┐   │   │   │
│   │   │   │                     │   │   │   │
│   │   │   │  TIER 4: DORMANT    │   │   │   │
│   │   │   │  Off-screen actors  │   │   │   │
│   │   │   │  Wake on proximity  │   │   │   │
│   │   │   │  ~100+ actors       │   │   │   │
│   │   │   │                     │   │   │   │
│   │   │   └─────────────────────┘   │   │   │
│   │   └─────────────────────────────┘   │   │
│   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 3.2 Tier Definitions

#### Tier 1: Full Fidelity ("On Stage")

**Who:** The player's Ascendant, any actors the player is actively influencing, actors involved in current player-visible events, actors the player has selected/inspected recently.

**Processing:**
- Full 48-template action scoring against axiological profile
- All trait acquisition rules checked (pattern, event, threshold)
- Full graph traversal for prerequisites and relationship evaluation
- Detailed narrative generation for chosen actions
- All trait effects applied precisely

**Budget:** ~5–15 actors, unlimited computation per actor.

#### Tier 2: High Fidelity ("Wings of Stage")

**Who:** Actors in the same region as Tier 1 actors, rival factions, actors with direct edges to Tier 1 actors, actors whose actions might visibly affect Tier 1 actors.

**Processing:**
- Action selection uses **top-3 domain shortlist** instead of all 48 templates
  - Determined by actor's strongest axiological leanings + current condition traits
  - Skip scoring domains where the actor has no capability
- Trait acquisition checked only for **mastery** and **condition** categories (the fast-changing ones)
- Reputation and scar traits checked only on pivotal events (success/failure on high-stakes actions)
- Standard narrative generation

**Budget:** ~20–60 actors. ~4x cheaper per actor than Tier 1.

#### Tier 3: Statistical ("Off Stage, Audible")

**Who:** Distant factions, cultures, and groups that the player isn't directly interacting with but whose aggregate state matters (trade partners, potential future enemies, the broader geopolitical landscape).

**Processing:**
- **No individual action selection.** Instead, run aggregate state transitions:
  ```
  faction.military_trend = f(faction.military_capability, neighbor_threats, axiological_profile.courage)
  faction.economic_trend = f(faction.trade_routes.count, resource_hexes, condition_traits)
  faction.territory_trend = f(military_trend, neighbor_weakness, axiological_profile.ambition)
  ```
- Trends are simple weighted sums computed from cached properties — no graph traversal
- Trait changes only via **threshold acquisition** (property crosses boundary → gain/lose trait)
- **Retroactive detail generation:** When the player's attention shifts to a Tier 3 actor, the system runs a **catch-up pass** that back-fills plausible action history from the statistical trends
  - "The Merchant League's trade_trend was +0.3 for 4 turns → generate: 'Established 2 trade routes, expanded into coastal markets, gained Trade Baron trait'"
  - This is the key narrative trick — the player sees a coherent history that was never actually simulated step-by-step

**Budget:** ~50–200 actors. ~20x cheaper per actor than Tier 1.

#### Tier 4: Dormant ("Backstage")

**Who:** Actors with no connection to any Tier 1–3 actor, isolated regions, wilderness groups, potential future actors that haven't been "discovered" yet.

**Processing:**
- **Nothing.** State frozen.
- **Wake condition:** An edge is created connecting a dormant actor to a Tier 1–3 actor, OR the player explores within N hexes, OR a cascading event reaches them.
- On wake: run catch-up pass based on elapsed time and world trends (see Section 4.3).

**Budget:** Zero per turn. Unlimited count.

### 3.3 Tier Assignment Algorithm

```typescript
function assignFidelityTier(actor: ActorNode, context: SimulationContext): FidelityTier {
  // Tier 1: Player attention
  if (context.playerFocusedActors.has(actor.id)) return TIER_1;
  if (context.activeInfluenceTargets.has(actor.id)) return TIER_1;
  if (context.currentEventParticipants.has(actor.id)) return TIER_1;

  // Tier 2: Proximity to attention
  const hopsToTier1 = context.shortestPathToTier1(actor.id);
  if (hopsToTier1 <= 2) return TIER_2;

  // Also Tier 2 if they share a region with any Tier 1 actor
  if (context.regionsContainingTier1.has(actor.regionId)) return TIER_2;

  // Tier 3: Connected to the active world
  if (hopsToTier1 <= 5) return TIER_3;
  if (actor.category === "faction" || actor.category === "culture") return TIER_3;
  // Major actors always get at least statistical sim

  // Tier 4: Everything else
  return TIER_4;
}
```

**Re-evaluation frequency:** Tier assignments are recalculated every N turns (not every turn). Default N=3 for Tiers 2–3, N=10 for Tier 4 wake checks.

---

## 4. Contingency Patterns (The Escape Hatches)

### 4.1 Action Budget Per Turn

Instead of "every actor gets one action," use a **global action budget** that distributes computational work.

```typescript
interface TurnBudget {
  tier1Actions: number;    // unlimited (but naturally small count)
  tier2Actions: number;    // e.g., 40 actions max
  tier3Updates: number;    // e.g., 100 stat updates max
  totalGraphOps: number;   // hard ceiling on CRUD operations per turn, e.g. 500
  maxCascadeDepth: number; // prevent infinite chain reactions, e.g. 5
}
```

If Tier 2 has 60 actors but only 40 action slots, the remaining 20 **defer to next turn** (with a priority queue so no actor starves). This is invisible to the player — the narrative just says those actors are "still executing their previous action" or "deliberating."

### 4.2 Trait Evaluation Amortization

Checking every actor's trait acquisition rules every turn is expensive. Instead, **spread trait checks across turns using a round-robin schedule.**

```typescript
// Instead of: every actor checks every trait every turn
// Do: each actor checks traits on their assigned turn in the cycle

function shouldCheckTraits(actor: ActorNode, currentTurn: number, cycleLength: number): boolean {
  const actorSlot = hashToSlot(actor.id, cycleLength);
  return currentTurn % cycleLength === actorSlot;
}
```

**Cycle length by tier:**
- Tier 1: Every turn (cycle=1)
- Tier 2: Every 2 turns (cycle=2)
- Tier 3: Every 4 turns (cycle=4) — but only threshold traits

**Exception:** Event-triggered traits (scar, condition) always evaluate immediately regardless of cycle — they're triggered by specific CRUD outcomes, not polling.

### 4.3 Retroactive History Generation (The Big Trick)

When a dormant or statistical actor enters the player's attention, we need to make it look like they were fully simulated the whole time. This is where the narrative-first philosophy pays off.

```typescript
interface CatchUpContext {
  actor: ActorNode;
  elapsedTurns: number;
  worldTrends: WorldTrends;        // aggregate world state changes
  neighborEvents: Event[];          // what happened near this actor
  statisticalTrends: TrendRecord;   // the Tier 3 trend data (if available)
}

function generateCatchUpHistory(ctx: CatchUpContext): ActionHistoryEntry[] {
  const history: ActionHistoryEntry[] = [];

  // 1. Determine actor's "personality trajectory" from axiological profile
  const dominantDomains = getTopDomains(ctx.actor, 3);

  // 2. Generate plausible actions based on trends
  for (let t = 0; t < ctx.elapsedTurns; t++) {
    // Pick domain weighted by personality + world pressure
    const domain = weightedPick(dominantDomains, ctx.worldTrends);

    // Pick action type based on actor state
    const crudType = inferCrudType(ctx.actor, ctx.statisticalTrends, t);

    // Generate a plausible action with outcome
    const action = fabricateAction(domain, crudType, ctx.actor);
    history.push(action);

    // Apply lightweight state changes
    applyFabricatedOutcome(ctx.actor, action);
  }

  // 3. Check for trait acquisitions based on fabricated history
  evaluateTraitsForHistory(ctx.actor, history);

  return history;
}
```

**The key insight:** This doesn't need to be deterministic or reproducible. The player never saw the original turns, so any coherent history that matches the statistical trends is "correct." We're writing fiction, not replaying a recording.

**Cost:** O(elapsed_turns × constant) — linear in time skipped, but constant per fabricated turn (no graph traversal, just weighted random picks).

### 4.4 Event Coalescing

When many similar events happen in one turn (especially at Tier 3), merge them into aggregate narratives instead of processing individually.

```typescript
// Instead of 15 separate "Group raids caravan" events:
// → "Banditry surges across the Northern Trade Routes"

// Instead of 8 separate "Faction converts settlement" events:
// → "The Iron Church's missionary campaign sweeps the eastern provinces"

interface CoalescedEvent {
  type: string;
  domain: ActionDomain;
  region: string;
  actorCount: number;
  aggregateImpact: Record<string, number>;
  narrativeTemplate: string;  // "{{count}} {{actor_type_plural}} {{action_verb}} across {{region}}"
}
```

**When to coalesce:**
- 3+ actors of the same type perform actions in the same domain in the same region in the same turn
- The individual events have no Tier 1 participants (those always get individual treatment)

**Narrative benefit:** Coalesced events actually feel *more* epic than individual ones. "A wave of rebellion sweeps the south" is better storytelling than showing 12 separate peasant revolts.

### 4.5 Sphere Influence Caching

Cosmological sphere influence on action success changes rarely (only when the world's cosmology profile shifts, which is a Cosmic-scale action). Cache it.

```typescript
interface CachedSphereInfluence {
  // Pre-computed per domain
  domainModifiers: Map<ActionDomain, number>;  // e.g., Military: +0.08 (Force-dominant world)

  // Pre-computed per tradition
  traditionStrength: Map<string, number>;       // e.g., Fire Magic: 1.12 (Energy-dominant)

  // Pre-computed per terrain type
  biomeAffinity: Map<string, Map<string, number>>; // sphere → terrain → affinity weight

  // Invalidation
  validUntilTurn: number;
  cosmologyHash: string;  // recompute only if cosmology profile changes
}
```

**Impact:** Removes ~30% of graph traversals from action scoring (sphere alignment lookups were the most common query pattern).

### 4.6 Spatial Partitioning for Geographic Queries

Hex-based queries ("what actors are within 5 hexes?") currently require scanning all actors. Use a spatial index.

```typescript
interface SpatialIndex {
  // Grid-of-grids: divide the hex map into "chunks" of N×N hexes
  chunks: Map<string, Set<string>>;  // chunkKey → actor IDs in that chunk
  chunkSize: number;                  // e.g., 8 hexes per chunk side

  // Query
  getActorsInRange(center: HexCoord, range: number): string[];
  getActorsInChunk(chunkKey: string): string[];
}
```

**Impact:** Range queries drop from O(all_actors) to O(actors_in_nearby_chunks). For a 2500-hex map with 200 actors, a 5-hex range query checks ~20 actors instead of 200.

### 4.7 Web Worker Offloading

The nuclear option for large worlds. Move turn processing to a background thread.

```typescript
// Main thread
const worker = new Worker('turn-processor.js');
worker.postMessage({
  type: 'PROCESS_TURN',
  graph: serializableGraph,
  turnDelta: lastTurnDelta,
  tierAssignments: currentTiers,
  budget: turnBudget,
});

worker.onmessage = (event) => {
  const { mutations, events, narratives } = event.data;
  applyMutations(mutations);
  displayEvents(events);
  renderNarratives(narratives);
};
```

**Constraints:** The graph must be serializable (no closures, no DOM references). Our `TaxonomyNode`/`TaxonomyEdge` types are already pure data, so this is naturally compatible.

**When to activate:** If turn processing exceeds 1 second on the main thread, automatically switch to worker mode. The UI shows a "world is turning..." animation while processing continues in background.

### 4.8 Cascade Circuit Breaker

Some CRUD actions trigger cascading effects (assassinate a king → succession crisis → civil war → trade disruption → famine). Without a limit, cascades can explode.

```typescript
interface CascadeContext {
  depth: number;
  maxDepth: number;          // hard limit, e.g. 5
  eventCount: number;
  maxEvents: number;         // hard limit, e.g. 20
  affectedNodeIds: Set<string>;
}

function shouldContinueCascade(ctx: CascadeContext): boolean {
  if (ctx.depth >= ctx.maxDepth) return false;
  if (ctx.eventCount >= ctx.maxEvents) return false;
  return true;
}

// When cascade is truncated, generate a "brewing tension" event instead:
// "The reverberations of the King's assassination continue to unfold..."
// → Queue remaining cascade effects for next turn's processing
```

**Narrative framing:** Truncated cascades become cliffhangers. "The consequences are still unfolding" is actually better drama than resolving everything instantly.

---

## 5. The Turn Processing Pipeline

Putting it all together, each end-of-turn follows this pipeline:

```
PHASE 0: PREPARE
  ├── Recalculate tier assignments (every N turns, not every turn)
  ├── Invalidate caches if cosmology changed
  └── Build TurnDelta from previous mutations

PHASE 1: TIER 1 — FULL SIMULATION
  ├── For each Tier 1 actor:
  │   ├── Score all 48 action templates against axiological profile
  │   ├── Apply trait modifiers to scores
  │   ├── Apply sphere influence modifiers
  │   ├── Select top action (with weighted randomness)
  │   ├── Resolve action (probability check)
  │   ├── Execute graph mutations (CRUD ops)
  │   ├── Check all trait acquisition rules
  │   └── Generate detailed narrative
  └── Process cascading effects (with circuit breaker)

PHASE 2: TIER 2 — HIGH FIDELITY
  ├── For each Tier 2 actor (up to budget):
  │   ├── Score top-3 domain templates only
  │   ├── Apply major trait modifiers
  │   ├── Select and resolve action
  │   ├── Execute graph mutations
  │   ├── Check mastery/condition traits (on rotation)
  │   └── Generate standard narrative
  └── Deferred actors carry over to next turn

PHASE 3: TIER 3 — STATISTICAL
  ├── For each Tier 3 actor:
  │   ├── Update trend values from cached properties
  │   ├── Apply threshold trait checks
  │   └── Flag if trend crosses event threshold
  └── Coalesce similar events

PHASE 4: TIER 4 — WAKE CHECK
  ├── Check dormant actors against wake conditions
  └── Run catch-up for newly woken actors

PHASE 5: WORLD MAINTENANCE
  ├── Decay mastery traits (amortized across turns)
  ├── Expire temporary conditions
  ├── Update spatial index
  ├── Rebuild dirty flags
  └── Update turn counter

PHASE 6: NARRATIVE ASSEMBLY
  ├── Rank events by narrative importance
  ├── Select top N events for player notification
  ├── Coalesce minor events into aggregate summaries
  └── Queue narrative text for display
```

**Estimated cost at Medium scale (2000 hexes, 150 actors):**

| Phase | Actor Count | Per-Actor Cost | Total |
|-------|-------------|---------------|-------|
| Phase 1 | ~10 | ~5ms | ~50ms |
| Phase 2 | ~40 (of 60) | ~1.2ms | ~48ms |
| Phase 3 | ~80 | ~0.1ms | ~8ms |
| Phase 4 | ~wake checks | ~0.01ms | ~1ms |
| Phase 5 | global | — | ~20ms |
| Phase 6 | events | — | ~10ms |
| **Total** | | | **~137ms** |

Well within the 1.5s target for Medium scale. And this is without the Web Worker — on the main thread.

---

## 6. Data Structure Changes

### 6.1 New Types

```typescript
// Fidelity tier for each actor
type FidelityTier = 1 | 2 | 3 | 4;

// Statistical trends for Tier 3 actors
interface ActorTrends {
  military_trend: number;     // -1.0 to 1.0 (declining to growing)
  economic_trend: number;
  political_trend: number;
  territorial_trend: number;
  spiritual_trend: number;
  stability_trend: number;
  lastFullSimTurn: number;    // when this actor was last at Tier 1 or 2
}

// Turn budget configuration
interface TurnBudget {
  tier2ActionSlots: number;
  tier3UpdateSlots: number;
  maxGraphOpsPerTurn: number;
  maxCascadeDepth: number;
  maxCascadeEvents: number;
}

// Configuration presets
const BUDGET_PRESETS: Record<string, TurnBudget> = {
  small:  { tier2ActionSlots: 30,  tier3UpdateSlots: 50,  maxGraphOpsPerTurn: 200,  maxCascadeDepth: 5, maxCascadeEvents: 15 },
  medium: { tier2ActionSlots: 60,  tier3UpdateSlots: 150, maxGraphOpsPerTurn: 500,  maxCascadeDepth: 5, maxCascadeEvents: 20 },
  large:  { tier2ActionSlots: 100, tier3UpdateSlots: 300, maxGraphOpsPerTurn: 1000, maxCascadeDepth: 4, maxCascadeEvents: 25 },
  epic:   { tier2ActionSlots: 150, tier3UpdateSlots: 500, maxGraphOpsPerTurn: 2000, maxCascadeDepth: 3, maxCascadeEvents: 30 },
};
```

### 6.2 Additions to TaxonomyNode Properties

```typescript
// Actor nodes gain these properties
interface ActorProperties {
  fidelityTier: FidelityTier;
  trends: ActorTrends;
  lastActionTurn: number;
  lastTraitCheckTurn: number;
  cachedActionScores?: CachedScores;   // invalidated by dirty flags
  cachedActionScoresTurn?: number;     // turn when cache was built
}
```

### 6.3 IndexedGraph Implementation

The `IndexedGraph` wraps the existing `TaxonomyGraph` and is the **only** way simulation code accesses the graph. All mutation goes through it so dirty flags stay accurate.

```typescript
class IndexedGraph {
  private nodesById: Map<string, TaxonomyNode>;
  private outgoing: Map<string, TaxonomyEdge[]>;
  private incoming: Map<string, TaxonomyEdge[]>;
  private edgesByType: Map<string, TaxonomyEdge[]>;
  private nodesByCategory: Map<string, Set<string>>;
  private turnDelta: TurnDelta;

  // All reads go through indexed lookups
  getNode(id: string): TaxonomyNode | undefined;
  getOutgoing(nodeId: string): TaxonomyEdge[];
  getOutgoingOfType(nodeId: string, type: string): TaxonomyEdge[];
  getIncoming(nodeId: string): TaxonomyEdge[];
  getByCategory(category: string): TaxonomyNode[];

  // All writes record dirty flags
  addNode(node: TaxonomyNode): void;
  removeNode(id: string): void;
  updateNodeProperty(id: string, key: string, value: any): void;
  addEdge(edge: TaxonomyEdge): void;
  removeEdge(source: string, target: string, type: string): void;
  updateEdgeProperty(source: string, target: string, type: string, key: string, value: any): void;

  // Turn lifecycle
  getTurnDelta(): TurnDelta;
  resetTurnDelta(): void;

  // Bulk export (for Web Worker serialization)
  serialize(): SerializableGraph;
  static deserialize(data: SerializableGraph): IndexedGraph;
}
```

---

## 7. Narrative Shortcuts (Creative Fudging)

These are the most aggressive shortcuts — places where we sacrifice simulation accuracy in exchange for narrative plausibility. They exploit the fact that the player is reading stories, not auditing spreadsheets.

### 7.1 "Meanwhile, In the North..."

When the player shifts attention to a region they haven't looked at in many turns, instead of running a full catch-up simulation:

1. Look at the statistical trends for actors in that region
2. Pick the 2–3 most narratively interesting trend changes
3. Generate a "montage" summary: "While your attention was elsewhere, the Merchant League expanded into the Tidal Coast, the Nomad Clans fractured into rival bands, and a mysterious plague swept through the Dwarven Holds."
4. Materialize the end-state directly (create/modify nodes to match the trends)
5. Only fabricate detailed action history for the specific events the player clicks on

**Why this works:** It's exactly how epic fantasy novels work. Time-skips between chapters summarize off-screen developments in a paragraph. The reader fills in the details with their imagination.

### 7.2 "Fog of Simulation"

Distant actors have less precise state — and that's a feature, not a bug. When the player tries to inspect a Tier 3 actor:

- Show approximate values: "The Merchant League is **thriving** economically" (not "trade_income: 847.3")
- Show trend arrows: "Military strength: **↑ growing**"
- Show known traits only (public + any the player has discovered)
- Show unknown traits as "???" with hints ("Something is unusual about their spiritual practices...")

This maps perfectly to the information model in the CRUD system — you need READ actions to reveal precise information. The simulation fidelity tiers naturally align with the fog-of-war gameplay.

### 7.3 "Dramatic Timing"

Events for Tier 3+ actors don't need to happen on the exact turn they're triggered. They can be **queued and released** when narratively appropriate:

- Queue a faction collapse event, but delay it until the player is about to interact with that faction (maximum dramatic impact)
- Queue a distant war, but surface it as news from traders arriving in the player's region (natural information flow)
- Queue a prophecy fulfillment, but reveal it during a moment of narrative calm (pacing control)

```typescript
interface QueuedEvent {
  event: SimulationEvent;
  minTurn: number;          // earliest it can fire (the "real" time)
  maxTurn: number;          // latest before it force-fires (prevent staleness)
  releaseConditions: {
    playerProximity?: number;  // fire when player is within N hops
    narrativeLull?: boolean;   // fire during quiet turns
    relatedEvent?: string;     // fire when a related event happens
  };
}
```

### 7.4 "The History Engine Writes Itself"

For truly distant/dormant actors, don't simulate forward at all. Instead, when they become relevant, run the catch-up generator with a **narrative seed** derived from:

- Their axiological profile (determines personality)
- Their initial state when they went dormant
- The aggregate world trends during the dormant period
- A seeded random generator (so the same catch-up always produces the same history — deterministic retroactivity)

The result is a plausible history that was never computed until needed. It's like a quantum state: the history doesn't exist until observed.

---

## 8. Performance Monitoring

### 8.1 Adaptive Budget

The system monitors actual turn processing time and automatically adjusts:

```typescript
interface PerformanceMonitor {
  recentTurnTimes: number[];     // rolling window of last 10 turns
  averageTurnTime: number;
  targetTurnTime: number;        // e.g., 2000ms

  // Auto-adjustment
  adjustBudget(currentBudget: TurnBudget): TurnBudget {
    const ratio = this.averageTurnTime / this.targetTurnTime;
    if (ratio > 1.2) {
      // Too slow: reduce tier 2 slots, increase tier 3 threshold
      return shrinkBudget(currentBudget);
    } else if (ratio < 0.5) {
      // Headroom available: promote some tier 3 to tier 2
      return expandBudget(currentBudget);
    }
    return currentBudget;
  }
}
```

### 8.2 Player Settings

Expose a simple preference:

| Setting | Effect |
|---------|--------|
| **Fast turns** | Aggressive budgets, more statistical simulation, quick turns |
| **Balanced** (default) | Medium budgets, good fidelity near player |
| **Deep simulation** | Large budgets, more Tier 2 actors, slower turns accepted |

---

## 9. Implementation Priority

### Phase 1: Foundation (Must-Have for MVP)
1. **IndexedGraph** — Replace array scans with Map lookups
2. **Dirty flag system** — Track mutations per turn
3. **Fidelity tier assignment** — Basic 4-tier spotlight model
4. **Turn budget** — Global action cap with priority queue

### Phase 2: Scaling (Needed for Medium+ worlds)
5. **Trait evaluation amortization** — Round-robin scheduling
6. **Sphere influence caching** — Precompute and invalidate on change
7. **Spatial index** — Chunk-based actor location queries
8. **Cascade circuit breaker** — Depth and event limits

### Phase 3: Narrative Fidelity (Needed for Large+ worlds)
9. **Statistical Tier 3 simulation** — Trend-based updates
10. **Retroactive history generation** — Catch-up passes
11. **Event coalescing** — Merge similar events into aggregate narratives
12. **Dramatic timing queue** — Release events for narrative impact

### Phase 4: Performance Ceiling (For Epic scale)
13. **Web Worker offloading** — Background turn processing
14. **Adaptive budget** — Self-tuning based on measured performance
15. **Player settings** — Exposed simulation depth preference

---

## 10. Open Questions

- **Save/Load:** How does the tiered simulation affect save game consistency? (Suggestion: save full state for Tier 1–2, trends-only for Tier 3, nothing for Tier 4 — regenerate on load.)
- **Multiplayer (future):** If multiple players have different spotlights, do their Tier 1 zones overlap and compound, or does the budget split?
- **Replay/History viewer:** Can the player review past turns? If so, retroactively generated history needs to be deterministic (seeded RNG).
- **Testing:** How do we verify that statistical simulation produces narratively similar results to full simulation? (Suggestion: run both in parallel during development and measure divergence.)

---

## 11. Summary

The performance architecture follows three principles:

1. **Index everything, scan nothing.** The graph engine uses hash-based lookups for all queries.
2. **Simulate what matters, approximate the rest.** The spotlight model focuses computation where the player is looking.
3. **Generate history on demand.** Distant actors don't need a past until someone asks for one.

Combined, these patterns should support worlds of 2,000–5,000 hexes with 200–500 actors while keeping turn times under 3 seconds in a browser — comparable to a small-to-medium Civilization map, which is plenty of space for epic fantasy narrative.
