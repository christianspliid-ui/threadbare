# Agent Decision & Encounter Awareness — Design Doc

**Date:** 2026-03-18
**Status:** Design complete, pending implementation
**Depends on:** Generalized Action Targeting (`2026-03-17`), World State & Hex Actions (`2026-03-17`)
**Brainstorm notes:** Conversation between user and Claude Code (2026-03-18), `brainstorm-hex-actions-and-control-mechanic.md`

## Problem

Agents wander aimlessly. The P0 movement system has working pathfinding, terrain costs, and movement queues, but the *decision* about where to go uses a flat heuristic (`P0_BASE_MOTIVATION_PULL = 0.3`). Agents don't evaluate what encounters await at a destination, whether those encounters are feasible, whether they align with the agent's values or ambitions, or whether the journey is worth the cost.

Meanwhile, the action selection pipeline (`agentSelection.ts`) is rich — axiological scoring, disposition modifiers, ambition boosts, probabilistic selection — but only runs *after* the agent has already arrived at a location. Movement and action selection are disconnected systems using completely different scoring models.

The result: agents move randomly, then make good local decisions. They never make good *strategic* decisions about where to be.

## Design Principles

1. **Movement IS action selection at a different horizon.** The same four questions that gate local action selection — Can I? Should I? What does it cost? Does it fit my ambition? — should gate movement decisions. An agent choosing between "trade locally" and "travel 8 hexes to assault a fortress" is comparing two actions on the same scale.

2. **Expected value per tick drives momentum behavior.** Agents maximize reward/tick-invested. Local easy encounters naturally score high (low cost, high feasibility). Distant ambitious encounters need dramatically higher payoff to compete. This creates momentum: agents grind locally, build capability, then travel for bigger goals — without needing a special "prefer local things" modifier.

3. **Different agents see different worlds.** An agent's encounter awareness is shaped by their capabilities. A merchant sees trade opportunities across the map. A spy hears about intrigue at distant courts. A hermit mage senses magical disturbances. This replaces the flat "everyone sees X hexes" model with reach-based awareness that creates genuinely different behavior patterns.

4. **The encounter cache is a shared resource, agent filtering is personal.** A global cache of all encounters on the map updates incrementally via events. Each agent filters this cache through their personal awareness, prerequisites, and preferences. Expensive work (template matching) happens once; cheap work (filtering) happens per agent.

## Design Decisions

### Decision 1: Unified Decision Phase Replaces Separate Movement and Action Phases

**Chosen:** A single `phaseAgentDecision` replaces the current `phaseMovement` (for idle agents) and the action selection trigger. When an agent is idle (no active encounter, no movement queue), they evaluate all visible encounters — local and distant — through one pipeline and either start a local encounter, queue movement toward a distant one, or attempt a remote encounter.

**Why:** The current split means movement uses a flat heuristic while action selection uses the full Maslow pipeline. Agents make good local choices but terrible strategic choices. Unifying them means the same scoring model (value/tick × desire) governs both "what to do here" and "where to go."

**What it replaces:**
- `generateMovementCandidates` (flat pull heuristic) → replaced by encounter-driven scoring
- `computeBasePull` / `P0_BASE_MOTIVATION_PULL` → retired entirely
- `phaseMovement` for idle agents → absorbed into `phaseAgentDecision`
- `phaseMovement` for agents with active movement queues → retained as `phaseMovementExecution` (advancing along queued paths)

**What it preserves:**
- Mid-path re-evaluation (`DECISION_REEVALUATION_TICKS = 4`) — agents can change course if a dramatically better encounter appears
- Movement queue mechanics, terrain costs, A* pathfinding — unchanged
- Pure scoring functions from `agentSelection.ts`: `scoreByGoalAlignment`, `getDivineInfluences`, `buildValueOverlay`, `applyDispositionModifier`, `computeAmbitionBoost` — reused within the new scoring formula. The pipeline structure (top-N, probabilistic select) is retired.

**Selection model:** Deterministic. The candidate with the highest `finalScore` wins. No top-N filtering, no probability normalization, no random roll. Behavioral variety comes from the scoring inputs (different profiles, capabilities, bonds, ambitions), not from randomness at the selection step. See Decision 7 for the full formula.

**Tick phase ordering in the orchestrator:**

The new decision phase slots into the existing orchestrator structure:

```
Phase 1:    Doom clock
Phase 2a:   Encounter step resolution — agents in active encounters:
              - Occupied agents: check if occupiedUntilTick <= currentTick
              - If expired: resolve the step (d100 roll), advance or abandon
              - GraphOps from resolution fire encounter cache update events
              - Agents freed from encounters become idle
Phase 2b:   Agent Decision (NEW) — idle agents run the unified decision pipeline:
              - Read from encounter cache (current after Phase 2a updates)
              - Generate social encounter candidates
              - Run 5-stage filter pipeline
              - Score by value/tick × desire
              - Pick highest → start local encounter, queue movement, attempt remote, or idle
Phase 2.35: Movement execution — agents with queued paths advance along them (unchanged)
Phase 2.36: Colocation detection (unchanged)
Phase 2.4:  Sublocation dissolution
Phase 2.5:  Dilemma detection
...         (remaining phases unchanged)
```

The critical ordering: Phase 2a fires cache update events, so the cache is current when Phase 2b reads from it. Phase 2b's movement decisions take effect in Phase 2.35.

### Decision 2: Per-Reach Encounter Awareness

**Chosen:** Each of the Nine Reaches provides awareness of encounters in its own domain. An agent's capability in a reach determines how far they can see encounters whose `reachPrimary` matches that reach. An agent with Gold 0.5 sees trade encounters at moderate range; an agent with Gold 0.1 barely sees the local market.

**Why not a single "awareness radius"?** A flat radius means all agents of similar power level see the same encounters. Per-reach awareness creates differentiated worldviews — the spy sees a map full of intrigue, the merchant sees a map full of trade, the warrior sees threats and battles. This produces emergent behavioral diversity without requiring hand-tuned personality routines.

**Formula:**
```
For each encounter cache entry:
  primaryCap = agent's capability in entry.reachPrimary
  secondaryCap = agent's capability in entry.reachSecondary
  bestCap = max(primaryCap, secondaryCap)

  if bestCap < AWARENESS_THRESHOLD → invisible
  maxRange = BASE_AWARENESS_HOPS + floor(bestCap / CAPABILITY_PER_HOP)
  if graphDistance(agent.location, entry.locationId) > maxRange → invisible
```

Using `max(primary, secondary)` means encounters are visible through either reach channel. The Deep Descent (Iron primary, Shadow secondary) is detected by warriors through Iron awareness ("word of a dangerous challenge") and by spies through Shadow awareness ("rumors of something hidden in the ruins"). This naturally supports generalist agents — moderate capability across several reaches sees more encounter variety at shorter range, while specialists see their domain's encounters at longer range.

**Reach awareness flavor:**

| Reach | What it reveals | Narrative flavor |
|-------|----------------|------------------|
| Iron | Military encounters — battles, duels, fortification, training | "Word of a skirmish reaches you" |
| Gold | Economic encounters — trade, acquisition, market events | "Your trade contacts mention rare goods at the eastern market" |
| Shadow | Hidden/political encounters — intrigue, theft, espionage | "Whispers of a conspiracy at the capital" |
| Veil | Magical encounters — rituals, sphere disturbances, arcane phenomena | "You sense a disturbance in the weave" |
| Heart | Social encounters — alliances, diplomacy, faction events | "Your network says the southern tribes seek alliance" |
| Eye | Knowledge encounters — exploration, discovery, lore | "Scholarly correspondence mentions matching ruins" |
| Stone | Territorial encounters — construction, geography, resources | "The earth speaks of rich deposits beneath the northern hills" |
| Star | Spiritual encounters — worship, consecration, divine events | "You feel a calling toward the abandoned shrine" |
| Flesh | Survival/physical encounters — very short range only | "Your body senses danger nearby" |

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `AWARENESS_THRESHOLD` | 0.05 | Minimum capability in a reach to see any encounters in that domain |
| `BASE_AWARENESS_HOPS` | 1 | Everyone sees encounters at adjacent locations |
| `CAPABILITY_PER_HOP` | 0.15 | Each 0.15 capability adds 1 hop of awareness range |
| `MAX_AWARENESS_HOPS` | 5 | Hard cap to prevent performance blow-up |
| `FLESH_MAX_HOPS` | 1 | Flesh reach never extends beyond adjacent (body must be present) |

**Tracing:**
```typescript
interface AwarenessTrace {
  tick: number;
  category: 'encounter_awareness';
  agentId: string;
  reach: ReachDomain;
  capability: number;
  hopsGranted: number;
  encountersVisible: number;
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Agent has no capability data | Use 0.0 for all reaches → sees only BASE_AWARENESS_HOPS encounters |
| Encounter template has no reachPrimary | Visible to all agents at BASE_AWARENESS_HOPS range |
| Graph distance computation fails | Treat as MAX distance → encounter invisible |
| Agent has no location (edge case) | Return empty encounter list, skip decision |

**PRNG:** Not needed — awareness is deterministic based on capability and distance.

### Decision 3: Faction Network Awareness — Rank-Gated and Reach-Filtered

**Chosen:** Faction membership provides awareness of encounters at faction-networked locations, but filtered by two constraints: the faction's domain focus (reach-filtered) and the agent's rank within the faction (rank-gated). A trade guild only reports trade encounters, and a foot soldier gets far less intelligence than the guild master.

**Why:** Factions are specialist organizations. A trade guild monitors markets, not battlefields. A spy network tracks intrigue, not theology. Unfiltered "see everything at faction locations" floods agents with irrelevant encounters and makes faction membership a flat power boost. Reach-filtering makes faction intelligence thematic and useful. Rank-gating makes faction advancement meaningful — rising through the ranks literally expands your worldview.

**Mechanic:**

```
factionReaches = faction's reachPreferences (weighted map, same shape as cultures)
factionPrimaryReach = reach with highest weight in factionReaches
agentFactionRank = agent's rank/status within faction (0.0 to 1.0)
maxFactionEntries = floor(agentFactionRank × FACTION_NETWORK_MAX_ENTRIES)

For each location where faction has presence:
  Get encounters where reachPrimary matches factionPrimaryReach
    (or reachSecondary, if faction has secondary reach weight > FACTION_SECONDARY_THRESHOLD)
  Add to visible set (up to maxFactionEntries total, prioritized by questPriority)
```

**Examples:**
- Foot soldier in the Merchant Guild (rank 0.1, Gold reach): sees ~2 trade encounters across the network
- Guild Master (rank 0.9, Gold reach): sees ~18 trade encounters — comprehensive economic intelligence at every guild outpost
- Neither sees the duel happening at the guild outpost — Iron encounters are outside the guild's domain focus
- A mercenary company (Iron primary 0.7, Gold secondary 0.4) reports both military and lucrative encounters

**Schema requirement:** Faction nodes need `reachPreferences: Record<ReachDomain, number>` — same shape as the existing culture `reachPreferences`. Guild seeding already implies this (guilds are "Gold-heavy"), but it needs to be explicit on the faction node properties. Agent membership edges need a `rank` or `status` property (0.0 to 1.0). **Note:** Factions and groups are not yet a fully designed system. These properties are requirements that the future faction/groups design must satisfy. This decision is forward-compatible — if factions don't have the required data, the fail-soft skips faction awareness entirely.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `FACTION_NETWORK_AWARENESS` | true | Enable/disable faction network visibility |
| `FACTION_NETWORK_MAX_ENTRIES` | 20 | Cap on faction-sourced encounter additions at max rank |
| `FACTION_SECONDARY_THRESHOLD` | 0.3 | Minimum reach weight for faction to report secondary-reach encounters |
| `FACTION_MIN_RANK_FOR_INTEL` | 0.05 | Minimum rank to receive any faction intelligence (absolute newcomers get nothing) |

**Tracing:**
```typescript
interface FactionAwarenessTrace {
  tick: number;
  category: 'faction_awareness';
  agentId: string;
  factionId: string;
  factionPrimaryReach: ReachDomain;
  agentRank: number;
  maxEntries: number;
  entriesAdded: number;
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Agent has no faction edges | Skip faction bonus, use reach-based awareness only |
| Faction node missing | Skip that faction, continue with others |
| Faction has no reachPreferences | Skip faction awareness (cannot determine domain focus) |
| Agent membership edge has no rank property | Default to 0.1 (low rank — minimal intelligence) |

**PRNG:** Not needed — faction awareness is deterministic based on rank and faction presence.

### Decision 4: Remote Encounter Capability

**Chosen:** Encounters can optionally declare that they may be attempted without physical presence. Remote attempts incur a content-authored probability penalty and optional range cap.

**Why:** Some encounters are inherently non-physical. A Shadow agent sends spies. A Veil agent scries remotely. A Gold agent dispatches a trade caravan. Requiring physical presence for everything forces agents into constant travel, which is both unrealistic and narratively flat. Remote capability creates a class of "reach-out-and-touch" actions that let powerful agents project influence without relocating.

**Schema addition to `EncounterTemplate`:**
```typescript
/** Remote attempt configuration. If omitted, encounter requires physical presence. */
remoteAttempt?: {
  /** Whether this encounter can be attempted remotely */
  allowed: boolean;
  /** Probability penalty for remote attempts (0.0 to 0.5) */
  probabilityPenalty: number;
  /** Maximum range in graph hops for remote attempt (undefined = unlimited within awareness) */
  maxRange?: number;
}
```

**Examples:**
- "Establish Trade Route" → `{ allowed: true, probabilityPenalty: 0.05, maxRange: 5 }` (almost as good remotely)
- "Remote Scrying" → `{ allowed: true, probabilityPenalty: 0.2 }` (harder at distance, no range cap)
- "Deep Descent" → omitted (you must physically descend)
- "Market Haggle" → omitted (in-person bargaining)

**Impact on scoring:** Remote encounters have `travelCost = 0` but their probability (and thus expected reward) is reduced by the penalty. The value/tick calculation naturally handles this — a remote encounter with 0 travel cost but lower success probability competes fairly against a local encounter with full probability.

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| `remoteAttempt` missing on template | Requires presence (backward compatible) |
| `probabilityPenalty` exceeds 0.5 | Clamp to 0.5 (minimum 0.05 success chance preserved by resolution clamp) |

### Decision 5: Global Encounter Cache with Event-Based Invalidation

**Chosen:** A global `EncounterCacheManager` maintains a flat list of all encounter opportunities on the map. The cache is built once at game start and updated incrementally via events fired during the action phase. The decision phase reads from the cache without rebuilding it.

**Why not rebuild every tick?** Encounter template matching (checking `locationTypes` against location subtypes for every template × every location) is unnecessary work when most of the map didn't change. With agents creating and destroying encounters constantly (building mines, burning them down, spawning encounters, completing them), the cache will change frequently — but typically only a few locations per tick. Incremental updates for those locations are vastly cheaper than a full rebuild.

**Cache entry shape:**
```typescript
interface EncounterCacheEntry {
  templateId: string;
  locationId: string;
  hexId: string;                  // for distance computation
  reachPrimary: ReachDomain;
  reachSecondary: ReachDomain;
  threatRating: ThreatRating;
  encounterType: EncounterType;
  motivations: ValuePair[];
  visibleTo?: string[];
  requiresPresence: boolean;
  remotePenalty: number;          // 0 if requires presence or no remote config
  remoteMaxRange?: number;
  sphereAffinity?: SphereName;
  culturalAffinity?: string;
  // Pre-computed for scoring:
  totalTickCost: number;          // sum of step durations
  successRewardEstimate: number;  // sum of success-path reputationDelta + loot value
  stepCount: number;              // number of steps (for completion probability chain)
  stepDifficulties: number[];     // per-step difficulty for probability estimation
  stepReaches: ReachDomain[];     // per-step reach domain for capability lookup during scoring
}
```

**Events that trigger cache updates:**

| Event | Source | Cache action |
|-------|--------|-------------|
| `location_created` | Settlement founding, location spawning | Add: match all templates against new location's subtype |
| `location_destroyed` | Destruction actions, decay | Remove: all entries for that locationId |
| `location_type_changed` | Settlement promotion, terrain transformation | Rebuild: re-match templates for that location |
| `encounter_spawned` | Agent actions that create encounters | Add: single entry for new encounter at location |
| `encounter_completed` | Encounter resolution | Update or remove: mark entry, remove if one-shot |
| `encounter_destroyed` | Agent actions, decay, rival interference | Remove: single entry |
| `terrain_transformed` | Hex actions changing terrain | Rebuild: all locations on that hex |

**Manager interface:**
```typescript
interface EncounterCacheManager {
  // Lifecycle
  buildFullCache(graph: WorldGraph): void;

  // Event handlers (called during action phase)
  onLocationCreated(graph: WorldGraph, locationId: string): void;
  onLocationDestroyed(locationId: string): void;
  onLocationTypeChanged(graph: WorldGraph, locationId: string): void;
  onEncounterSpawned(graph: WorldGraph, locationId: string, templateId: string): void;
  onEncounterDestroyed(locationId: string, templateId: string): void;
  onTerrainTransformed(graph: WorldGraph, hexId: string): void;

  // Query (called during decision phase)
  getAllEntries(): readonly EncounterCacheEntry[];
  getEntriesForLocation(locationId: string): readonly EncounterCacheEntry[];
  getEntryCount(): number;
}
```

**How events are triggered — integration with action resolution:**

The cache manager's event handlers are called by the action resolution pipeline after GraphOps are applied. This is not a separate detection system — it's wired into the existing `graphOpExecutor`:

1. **GraphOp creates/destroys a location node** → `onLocationCreated` / `onLocationDestroyed`
2. **GraphOp changes a location's subtype** (e.g., settlement promotion) → `onLocationTypeChanged`
3. **GraphOp creates/destroys a sublocation** → `onLocationTypeChanged` on parent (re-matches templates)
4. **Action outcome explicitly spawns an encounter** (e.g., "Spark an Encounter" hex action) → `onEncounterSpawned`
5. **Encounter resolution marks an encounter completed** → `onEncounterDestroyed` if non-repeatable
6. **Hex terrain transforms** → `onTerrainTransformed`

The key implementation point: `graphOpExecutor` needs a hook that fires the appropriate cache event after each mutation. This is a lightweight integration — check the op type, call the matching cache method.
```

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `CACHE_REBUILD_THRESHOLD` | 50 | If more than this many locations changed in a tick, do full rebuild instead of incremental |

**Tracing:**
```typescript
interface CacheUpdateTrace {
  tick: number;
  category: 'encounter_cache';
  event: string;
  locationId?: string;
  entriesAdded: number;
  entriesRemoved: number;
  totalEntries: number;
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Cache manager not initialized | Build full cache on first query (lazy init) |
| Event references unknown locationId | Log warning, skip update |
| Template matching throws | Skip that template, continue with others |
| Cache entry count exceeds MAX_CACHE_SIZE | Log warning, stop adding entries (stale > crash) |

**PRNG:** Not needed — cache is deterministic based on world state.

### Decision 6: Five-Stage Filtering Pipeline

**Chosen:** Each idle agent filters the global encounter cache through a five-stage pipeline that progressively reduces the candidate list before scoring. The pipeline is ordered from cheapest to most expensive, and includes a performance-gated cap.

**Why a pipeline instead of scoring everything?** With 200+ locations × 5+ templates each = 1,000+ cache entries, scoring all of them for all 50+ agents every tick is expensive. But most entries are irrelevant to most agents. A cheap filter chain eliminates 90%+ of entries before the expensive scoring runs.

**The pipeline:**

```
Global cache (~1000 entries)
  → Filter 1: Reach awareness + distance (per-reach visibility)    → ~150-300 survive
  → Filter 2: visibleTo membership check                           → ~140-280 survive
  → Filter 3: Prerequisite/trait gate                               → ~110-225 survive
  → Filter 4: Threat gate (axiological-modified)                    → ~75-160 survive
  → Filter 5: Performance cap (ambition relevance + diversity)      → max X survive
  → Scoring: value/tick × desire multiplier                         → ranked list
  → Selection: best candidate wins
```

**Filter 1 — Reach Awareness + Distance**

For each cache entry, check if the agent has sufficient capability in `entry.reachPrimary` to see this encounter at this distance. Also add faction-network encounters (Decision 3).

This is the heaviest filter but also the most impactful — it typically cuts 70%+ of entries. Requires a distance lookup for each entry; mitigated by precomputed distance tables between locations (see Performance section).

**Filter 2 — `visibleTo` Membership**

If the encounter has `visibleTo` restrictions, check if the agent's factions, culture, or archetype match. Binary pass/fail. Most encounters have no restriction (visible to all), so this is a fast no-op for the majority.

**Filter 3 — Prerequisite/Trait Gate**

Check `requiredTraits` and `blockingTraits` on the encounter template against the agent's trait set. Binary pass/fail. This is the "can I even attempt this?" filter — an encounter requiring a specific tool or knowledge the agent lacks is invisible to their planning.

Note: This filter uses template prerequisites, not step-level checks. If an encounter's entry requirements are met, the agent considers it viable even if individual steps may be challenging.

**Filter 4 — Threat Gate (Courage-Modified)**

Check if the agent's capability in the encounter's reach domain falls within the threat tolerance band, modified only by the cross-cutting Courage vs. Prudence axis (existing behavior from `isWithinThreatTolerance`). Courageous agents expand their threat tolerance upward; prudent agents restrict it.

The reach-bound axiological pair (e.g., Mercy vs. Ruthlessness for Iron encounters) does **not** affect the threat filter. It influences scoring in Decision 7 instead — the threat filter is about feasibility ("can I survive this?"), while the axiological pair is about desire ("do I want to?"). A cold, calculating strategist can be ruthless AND cautious; those are independent axes.

This filters out encounters where the agent genuinely couldn't handle the threat level, or that are trivially below their capability (not interesting).

**Social encounters pass through the same threat gate.** Social encounter templates carry threat ratings (e.g., "Forge Alliance" = easy, "Challenge to Duel" = hard, "Assassinate" = deadly). The threat gate filters them identically to location encounters — an agent who can't handle a hard duel doesn't consider it. See Social Fabric doc, Decision 1 for the full social encounter template table with threat ratings.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `COURAGE_TOLERANCE_MODIFIER` | 1.0 | Existing courage/prudence modifier (from `THREAT_COURAGE_THRESHOLD`) |
| `THREAT_FLOOR_FILTER` | true | Also filter out encounters that are trivially below agent capability (not interesting) |

**Filter 5 — Performance Cap with Diversity Floor**

If more than `MAX_SCORED_CANDIDATES` entries survive filters 1-4, reduce the list:

1. Score each surviving entry by **ambition relevance**: how well does `entry.reachPrimary` match the agent's active ambitions' `reachAffinity`? Pure dot product — cheap.
2. Sort by ambition relevance descending.
3. Keep the top `MAX_SCORED_CANDIDATES` entries, BUT ensure at least `MIN_DIVERSITY_SLOTS` encounter types are represented (to prevent tunnel vision).

The diversity floor means: even if all top-scoring entries are "trade" encounters, the agent keeps at least 1 "explore", 1 "duel", etc. from their filtered set. This creates occasional surprising decisions — the merchant who stumbles into a duel, the warrior who discovers a ruin.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `MAX_SCORED_CANDIDATES` | 40 | Performance cap — maximum entries that enter the scoring phase |
| `MIN_DIVERSITY_SLOTS` | 1 | Minimum entries per encounter type to preserve in the capped list |

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| All entries filtered out | Agent enters idle behavior (personality-driven: drift toward ambition or stay) |
| Fewer entries than MAX_SCORED_CANDIDATES | Skip Filter 5 entirely, score all survivors |
| Ambition data missing | Skip ambition relevance sort, use distance as tiebreaker |
| Axiological profile missing | Use neutral (0.0) for all axes, base threat tolerance only |

**Tracing:**
```typescript
interface FilterPipelineTrace {
  tick: number;
  category: 'encounter_filter';
  agentId: string;
  cacheSize: number;
  afterAwareness: number;
  afterVisibility: number;
  afterPrerequisites: number;
  afterThreat: number;
  afterCap: number;
  summary: string;
}
```

### Decision 7: Value-Per-Tick Scoring Model

**Chosen:** Surviving candidates are scored by expected value per tick invested, multiplied by a desire modifier that captures axiological alignment and ambition fit. The highest-scoring candidate wins — no top-N selection, no probabilistic roll. If the scoring model is doing its job, the top candidate IS the right choice for that agent at that moment.

**Why deterministic selection?** Behavioral variety comes from the scoring inputs (different axiological profiles, different capabilities, different bonds, different ambitions), not from randomness at the selection step. A deterministic pick is traceable: you can look at the winning candidate and know exactly why the agent chose it. If agents prove too predictable, a small seeded noise term can be added to `finalScore` without reintroducing a probabilistic selection layer.

**Why value/tick?** This single metric naturally produces the momentum behavior we want. A local trivial encounter (1 tick cost, high certainty, small reward) competes against a distant hard encounter (15 tick cost, uncertain, large reward) on the same scale. The local encounter wins unless the distant one is dramatically more rewarding. This creates "grind locally, travel for big goals" without special-casing.

**How it integrates with existing functions:**

The new scoring reuses existing functions from `agentSelection.ts` but recomposes them differently. The old pipeline (axiological → disposition → personality → top-N → probabilistic) is replaced by a single scoring pass where value/tick is the primary metric and the existing functions supply the desire multiplier:

- `scoreByGoalAlignment()` — reused, computes axiological score for desire multiplier
- `getDivineInfluences()` + `buildValueOverlay()` — reused, overlays god's nudges on axiological profile
- `applyDispositionModifier()` — reused for social encounters (game theory matters when targeting another agent)
- `computeAmbitionBoost()` — reused, contributes to desire multiplier
- `selectTopN()` — **retired** (no top-N selection)
- `assignProbabilities()` — **retired** (no probabilistic distribution)
- `probabilisticSelect()` — **retired** (deterministic pick)

**successRewardEstimate computation (pre-computed on cache entry):**

```
successRewardEstimate =
  Σ(step.onSuccess.reputationDelta × REPUTATION_REWARD_WEIGHT) for all steps
  + (hasAnyRewardPool ? LOOT_REWARD_WEIGHT : 0)
  + DOMAIN_EXERCISE_WEIGHT
```

This is computed once when the cache entry is built and stored on `EncounterCacheEntry.successRewardEstimate`. It does not vary per agent — it represents the encounter's intrinsic reward potential. Agent-specific factors (growth proximity, desire) are applied during scoring.

**Full scoring formula:**

```
// ═══ PRE-COMPUTED ON CACHE ENTRY (agent-independent) ═══

successRewardEstimate =
  Σ(step.onSuccess.reputationDelta × REPUTATION_REWARD_WEIGHT) for all steps
  + (hasAnyRewardPool ? LOOT_REWARD_WEIGHT : 0)
  + DOMAIN_EXERCISE_WEIGHT

// ═══ COMPUTED PER AGENT PER CANDIDATE (during decision phase) ═══

// Step 1: Estimate completion probability (chain across all steps)
// Each step's probability uses the agent's capability in that step's reach domain
completionProb = Π(estimateStepProbability(agent, step)) for each step
  where estimateStepProbability uses:
    capability = agent's capability in step.reach (from cache: stepReaches[i])
    difficulty = step difficulty (from cache: stepDifficulties[i])
    P = clamp(capability + sphereFactor - difficulty/100 + modifiers, 0.05, 0.95)
  Note: sphereFactor and modifiers are stubs today (see Resolution Overhaul doc).
  When the modifier pipeline is implemented, estimateStepProbability will include
  sphere alignment, equipment, terrain, and trait bonuses.

// Step 2: Estimate expected reward (agent-specific component)
growthValue = estimatedGrowth × proximityToNextTier × GROWTH_REWARD_WEIGHT
  where estimatedGrowth = BASE_ENCOUNTER_GROWTH × difficultyScaling × promotionMultiplier
  and proximityToNextTier = 1.0 - (distanceToNextTierBoundary / tierWidth)
  (See Tier Promotion doc, Decision 3)
expectedReward = completionProb × (entry.successRewardEstimate + growthValue)

// Step 3: Compute total tick cost
travelCost = isLocal ? 0
           : isRemoteCapable ? 0
           : distanceMatrix[agent.locationId][entry.locationId]  // precomputed
encounterCost = entry.totalTickCost
totalCost = max(travelCost + encounterCost, 1)  // floor at 1 to avoid division by zero

// Step 4: Value per tick
valuePerTick = expectedReward / totalCost

// Step 5: Desire multiplier (how much does this agent WANT this?)
// Uses existing functions recomposed:
axiologicalScore = scoreByGoalAlignment(entry.motivations, agent.profile)
  // If divine influence is active on this agent, overlay the profile first:
  if divineInfluences.length > 0:
    overlayProfile = buildValueOverlay(agent.profile, divineInfluences, tick)
    axiologicalScore = scoreByGoalAlignment(entry.motivations, overlayProfile)
// For social encounters: apply disposition modifier
if entry is social encounter AND agent has relationship with target:
  dispositionMod = applyDispositionModifier(candidate, strategy, history, targetReputation)
else:
  dispositionMod = 0
ambitionBoost = computeAmbitionBoost(entry.reachPrimary, agent.ambitions)
// For social encounters: apply bond modifier (from Social Fabric doc, Decision 1)
bondMod = computeBondModifier(agent, entry.targetAgentId) if social else 0
desireMultiplier = max(axiologicalScore + dispositionMod + ambitionBoost + bondMod, MINIMUM_DESIRE)

// Step 6: Final score
finalScore = valuePerTick × desireMultiplier

// ═══ SELECTION ═══
// Pick the candidate with the highest finalScore. Deterministic. No randomness.
selectedCandidate = candidate with max(finalScore)
if selectedCandidate.finalScore < IDLE_SCORE_THRESHOLD → enter idle behavior
```

**For remote encounters:** `travelCost = 0` but `completionProb` is reduced by the encounter's `remotePenalty`. The value/tick calculation naturally handles this tradeoff.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `MINIMUM_DESIRE` | 0.1 | Floor on desire multiplier — prevents zero scores for axiologically neutral encounters |
| `REPUTATION_REWARD_WEIGHT` | 1.0 | Weight for reputationDelta in successRewardEstimate |
| `LOOT_REWARD_WEIGHT` | 0.5 | Weight for rewardPool presence in successRewardEstimate |
| `DOMAIN_EXERCISE_WEIGHT` | 0.3 | Base value for exercising a reach domain (capability growth signal) |
| `GROWTH_REWARD_WEIGHT` | 0.4 | Weight of growth value in reward estimate (from Tier Promotion doc) |
| `IDLE_SCORE_THRESHOLD` | 0.05 | Below this finalScore, agent enters idle behavior instead |

**Tracing:**
```typescript
interface ScoringTrace {
  tick: number;
  category: 'encounter_scoring';
  agentId: string;
  topCandidates: Array<{
    templateId: string;
    locationId: string;
    isLocal: boolean;
    isSocial: boolean;
    valuePerTick: number;
    desireMultiplier: number;
    axiologicalScore: number;
    dispositionMod: number;
    ambitionBoost: number;
    bondMod: number;
    finalScore: number;
    travelCost: number;
    encounterCost: number;
    completionProb: number;
    growthValue: number;
  }>;
  selectedTemplateId: string;
  selectedLocationId: string;
  action: 'start_local' | 'queue_movement' | 'attempt_remote' | 'idle';
  summary: string;
}
```

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Pathfinding fails to destination | Set travelCost = Infinity → encounter drops to bottom of ranking |
| Step probability estimation fails | Use 0.5 (uncertain) as default |
| successRewardEstimate is 0 | Use DOMAIN_EXERCISE_WEIGHT as minimum reward |
| All scores below IDLE_SCORE_THRESHOLD | Enter idle behavior |
| Divine influence lookup fails | Skip overlay, use raw axiological profile |
| Disposition lookup fails for social encounter | Use dispositionMod = 0 |
| Growth value computation fails | Use growthValue = 0 |

**PRNG:** Not needed — scoring and selection are fully deterministic from game state. If agents prove too predictable, add a small seeded noise term: `finalScore += mulberry32(seed + agentId + tick) × SCORE_NOISE_FACTOR`.

### Decision 8: Personality-Driven Idle Behavior

**Chosen:** When no encounter scores above `IDLE_SCORE_THRESHOLD`, the agent's behavior depends on their ambition axis:

- **High ambition** (Heart axiological pair toward Ambition pole, value > `AMBITION_DRIFT_THRESHOLD`): Drift toward the nearest location relevant to their active ambition milestones. Derive target from milestone conditions: "I need to control a market" → find nearest market. "I need 3 trade bonds" → find nearest location with tradeable agents.
- **Low ambition / content** (Heart axiological pair toward Loyalty pole, or no active ambition): Stay put. Attempt trivial local encounters if any exist. If none, wait.

**Why personality-driven?** Two visible behavior archetypes on the map: restless climbers always on the move, settled locals grinding in place. Both are realistic. The Heart axis (Loyalty vs. Ambition) is the natural control — it's literally the tension between staying loyal to your place vs. climbing toward something greater.

**Constants:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `AMBITION_DRIFT_THRESHOLD` | 0.2 | Heart axis value above which agent drifts toward ambition targets |
| `IDLE_DRIFT_SPEED` | 1 | Hops per decision cycle when drifting (slower than purposeful movement) |
| `IDLE_TRIVIAL_PREFERENCE` | 0.8 | Probability that a content agent does a local trivial encounter vs. doing nothing |

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| Ambition milestone has no derivable location target | Drift toward random adjacent hex |
| Milestone condition references capability (no location) | Skip drift, stay put |

**Ambition → Location derivation for idle drift:**

Ambitious agents drift toward locations relevant to their unfulfilled ambition milestones. The system derives a target location from the milestone condition type:

```
deriveAmbitionTarget(agent, milestone, graph, distanceMatrix):
  switch milestone.conditionType:
    'agent_controls_location':
      // Find nearest location matching the required subtype
      return nearestLocationBySubtype(agent.location, milestone.locationType, distanceMatrix)

    'agent_has_bonds':
      // Find nearest location with agents matching the bond basis
      // (e.g., 'trade' basis → location with trade-capable agents)
      return nearestLocationWithAgents(agent.location, milestone.basis, graph, distanceMatrix)

    'agent_reach_level':
      // No location target — this is a capability condition
      return null  // agent stays put and grinds locally

    default:
      return null  // unknown condition type, fail-soft
```

`nearestLocationBySubtype` scans the distance matrix for the closest location with matching `locationSubtype`. `nearestLocationWithAgents` scans for locations with agents that have relevant reach capability or bond basis. Both are bounded by `MAX_AWARENESS_HOPS` — agents don't drift toward locations they can't perceive.
| No trivial encounters at current location | Stay put, do nothing |
| Heart axis value missing | Default to 0.0 (neutral) → stay put |

## Schema Changes Required

### EncounterStep — Add Duration

```typescript
interface EncounterStep {
  // ... existing fields ...
  /** Duration of this step in ticks. Defaults to 1 if omitted. */
  duration?: number;
}
```

All existing templates default to `duration: 1` per step (backward compatible). New templates set explicit durations. A siege step might be `duration: 5`; a quick negotiation might be `duration: 1`.

**Multi-tick step mechanics:**

When a step has `duration > 1`, the step resolves at the **end** of the duration — not the start. The agent commits the full tick cost before learning the outcome.

- Tick 1: Agent begins step. Status becomes `occupied_in_step`. Decision phase skips this agent. Agent cannot move, cannot be targeted for new social encounters.
- Ticks 2 through N-1: Agent remains occupied. Skipped by decision phase.
- Tick N: Step resolves (d100 roll, success/failure determined). If success: advance to next step or complete encounter. If failure: encounter abandoned.

This means duration is a genuine commitment cost — you're locked in for the full time before knowing if it worked. This makes the value/tick calculation's denominator meaningful: a 5-tick step that might fail is a real gamble compared to a 1-tick step.

**Agent state during occupation:**
- `EncounterProgress` gains a `occupiedUntilTick: number` field. Set to `currentTick + step.duration` when a step begins.
- The decision phase checks `occupiedUntilTick > currentTick` to skip occupied agents.
- The agent cannot be targeted by social encounters while occupied (they're busy).
- The agent CAN be observed by the player (vignettes still fire at step start, showing "your agent is attempting the siege — 3 ticks remain").
- The player CAN intervene with a divine action to boost the eventual resolution roll (essence committed now, applied when the step resolves at the end).

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| `occupiedUntilTick` missing on active encounter | Treat as duration 1 (resolve immediately) |
| Step has no duration field | Default to 1 tick |
| Agent becomes orphaned while occupied (location destroyed) | Force-abandon encounter, free agent |

### EncounterTemplate — Add Remote Attempt Config

```typescript
interface EncounterTemplate {
  // ... existing fields ...
  /** Remote attempt configuration. If omitted, encounter requires physical presence. */
  remoteAttempt?: {
    allowed: boolean;
    probabilityPenalty: number;
    maxRange?: number;
  };
}
```

## Architectural Dependencies (Out of Scope — Design Separately)

The following systems were discovered during this design as needing their own design work. They enhance the movement/encounter system but do not block V1 implementation.

### 1. Encounter Resolution Probability Overhaul (Priority: High)

**Problem:** `ENCOUNTER_SPHERE_FACTOR = 0.1` and `ENCOUNTER_DIFFICULTY_MODIFIER = 0.5` are hardcoded constants. The resolution formula `P = capability + 0.1 - difficulty + 0.5` has no sphere alignment, no situational modifiers, no context.

**Impact on this system:** The payoff estimation (`estimateStepProbability`) will use the same flat formula. Two agents with identical capability will estimate identical odds regardless of sphere alignment, equipment, or situational advantage. This makes encounter scoring less differentiated than it should be.

**Recommendation:** Design a real modifier pipeline for encounter resolution: sphere alignment bonus, attachment/equipment modifiers, terrain/weather modifiers, trait bonuses. The movement system's `estimateStepProbability` function is a seam where the new resolution system plugs in — it just needs to return a probability.

### 2. Tier Promotion System (Priority: Medium)

**Problem:** `tierPromotionEligible` is a boolean on `EncounterOutcome` that no code reads. There is no tier promotion mechanic — no progress tracking, no threshold checking, no rank-up event.

**Impact on this system:** The payoff estimation currently cannot value tier promotion eligibility. An encounter that could trigger a rank-up is valued the same as one that can't. Once a tier system exists, `successRewardEstimate` should weight promotion-eligible encounters significantly higher for agents near their promotion threshold.

**Recommendation:** Design the tier promotion system as part of the capability growth model. The payoff estimator gains a `PROMOTION_REWARD_WEIGHT` constant that scales with proximity to threshold.

### 3. Axiological Vocabulary Alignment (Priority: Medium)

**Problem:** Encounter template `motivations` use an older value pair vocabulary (`greed_generosity`, `wrath_patience`, `dominance_humility`) that doesn't match the canonical axiological pairs from the Obsidian vault (`asceticism_extravagance`, `mercy_ruthlessness`, `humility_pride`).

**Impact on this system:** The axiological scoring step (`scoreByGoalAlignment`) matches encounter motivations against agent profiles. If the vocabularies diverge, the matching produces meaningless scores. Filter 4 (threat gate with axiological modification) also depends on correct reach-to-pair mapping.

**Recommendation:** Migrate encounter template motivations to the canonical axiological pair names. Update `ENCOUNTER_TYPE_MOTIVATIONS` to use canonical pairs. This is a content migration, not an architectural change.

### 4. Step Tick Duration Backfill (Priority: High — Blocks Accurate Scoring)

**Problem:** Existing encounter templates have no `duration` field on steps. All steps default to 1 tick, which underestimates the cost of complex encounters.

**Impact on this system:** The value/tick calculation's denominator (`totalTickCost`) will be inaccurately low for encounters that should take many ticks (sieges, rituals, long journeys). This makes long encounters look more attractive than they should be relative to quick ones.

**Recommendation:** Backfill duration on all 64 existing encounter templates. Quick actions = 1 tick. Multi-day events = 3-5 ticks per step. Long rituals or sieges = 5-10 ticks per step. This is content authoring work.

### 5. Faction/Groups System Design (Priority: Medium — Blocks Decision 3)

**Problem:** Factions exist in the graph (guilds are seeded, agents have membership edges) but are not a fully designed system. Decision 3 (Faction Network Awareness) requires `reachPreferences: Record<ReachDomain, number>` on faction nodes and `rank` (0.0 to 1.0) on agent membership edges. Neither property is guaranteed to exist.

**Impact on this system:** Without faction reach preferences and agent rank, Decision 3's rank-gated reach-filtered intelligence system cannot function. The fail-soft skips faction awareness entirely if data is missing, so V1 works without it — but faction-driven behavior won't appear until factions are properly designed.

**Recommendation:** Design factions/groups as a system: node schema, membership edges with rank, reach preferences, promotion mechanics. This is a prerequisite for faction awareness to produce meaningful behavior.

## Performance Considerations

### Distance Precomputation

Graph distance between locations changes rarely (only when locations are created/destroyed or terrain transforms create new paths). Precompute a distance matrix between all location pairs and cache it. Update incrementally when the graph topology changes (same event bus as the encounter cache).

With 200 locations, the matrix is 200×200 = 40,000 entries. At 4 bytes each, that's 160KB — negligible.

### Filter Pipeline Cost Estimate

Per agent per decision tick, with 1,000 cache entries and 50 agents:

| Stage | Cost per entry | Entries processed | Total per agent |
|-------|---------------|-------------------|-----------------|
| Filter 1 (awareness + distance) | 1 capability lookup + 1 distance lookup | ~1,000 | ~2,000 lookups |
| Filter 2 (visibleTo) | 1 set membership check | ~300 | ~300 checks |
| Filter 3 (prerequisites) | 1-3 trait lookups | ~280 | ~500 lookups |
| Filter 4 (threat) | 1 capability + 2 axiological lookups | ~225 | ~675 lookups |
| Filter 5 (cap) | 1 ambition dot product | ~160 | ~160 multiplies |
| Scoring | probability chain + value/tick + desire | ~40 | ~200 operations |

Total per agent: ~3,835 lightweight operations. Across 50 agents: ~192,000 operations per tick. All are arithmetic or hash lookups — no graph traversals, no string parsing. This should complete in well under 1ms on modern hardware.

### Cache Update Cost

Per cache-invalidating event: iterate ~64 templates, check `locationTypes` against one location's subtype = 64 string comparisons. Even with 10 events per tick = 640 comparisons. Negligible.

## NFP Compliance Summary

| Priority | NFP | Status | Notes |
|----------|-----|--------|-------|
| 1 | Tunability | PASS | 20+ named constants govern all thresholds, weights, and caps |
| 2 | Inspectability | PASS | Traces at awareness, filtering, scoring, and cache update stages |
| 3 | Determinism | PASS | Scoring is deterministic; final selection uses seeded PRNG; cache updates are order-independent |
| 4 | Fail-soft | PASS | Every filter stage and scoring step has explicit fallback for missing data |
| 5 | Narrative over mechanical | PASS | Per-reach awareness creates agents with distinct worldviews; axiological scoring produces personality-driven choices |
| 6 | Additive over destructive | PASS with note | Replaces `phaseMovement` idle logic and `computeBasePull`, but preserves movement queue mechanics and the selection pipeline. The retired code is genuinely obsolete. |
| 7 | Performance budget | PASS | Five-stage filter reduces 1,000 → 40 before expensive scoring. Precomputed distances. Event-based cache. Estimated <1ms per tick for 50 agents. |
