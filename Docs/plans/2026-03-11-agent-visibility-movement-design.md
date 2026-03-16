# DES-009: Agent Visibility, Movement & Pathfinding

**Date:** 2026-03-11
**Status:** P0 implemented — P1 pending (2026-03-11: movement types, content data, edge costs, pathfinding, candidates, execution, phase integration all shipped with 131 tests)
**Scope:** Visual representation of agents on hex map, fog-of-war integration, graph-based movement architecture, goal-directed pathfinding, colocation encounter detection (DES-010 hook)
**Depends on:** Hex map renderer, graph engine, encounter system, axiological selection pipeline, modifier system, culture/faction systems
**Backlog items:** DES-009 (Agent Visibility on Hex Map), DES-010 (Agent Encounter Engine)

---

## 1. Visual Representation

### 1.1 Zoom Levels

Agents render differently depending on d3 zoom scale:

| Zoom range | Representation |
|-----------|----------------|
| scale < `ZOOM_TOKEN_THRESHOLD` (2.5) | Colored dot with black outline, subtle breathing animation |
| scale ≥ `ZOOM_TOKEN_THRESHOLD` (2.5) | Token with agent initials, archetype icon badge |

Dot color maps to the agent's primary domain (Nine Reaches color palette). Black outlines ensure contrast against colored terrain hexes.

### 1.2 Clustering

**Approach:** Ring arrangement around the settlement icon.

Each hex has 6 edge positions corresponding to the 6 adjacent hexes. An agent occupies the edge slot closest to the hex they arrived from, giving visual directionality — you can see where they came from at a glance.

`MAX_RING_AGENTS = 6` — one slot per hex edge. If a hex has more than 6 agents (rare), excess agents stack with a count badge on the settlement icon.

### 1.3 Movement Trails

Dark grey/black ink trail lines showing recent movement history. Trail length is tunable:

- `TRAIL_HISTORY_TICKS = 12` (default: ~3 days at 4 ticks/day)
- Future divine power hook: spending power extends trail visibility for a specific agent
- Trail renders as a thin ink line connecting the agent's recent hex positions
- Trail fades linearly from full opacity (current position) to 0 (oldest tick)

No color on trails — black/dark grey ink on colored terrain for consistent contrast. Matches the Threadbare parchment aesthetic.

### 1.4 Dot Interaction

| Interaction | Result |
|------------|--------|
| Hover | Tooltip: agent name, tier, current activity |
| Click | Opens AgentInfoCard panel (full profile, inventory, relationships) |

### 1.5 Ghost Dots (Lost Line of Sight)

When a player loses LOS on a hex containing their agents, those agents leave behind ghost dots:

- Initial opacity: `GHOST_DOT_INITIAL_OPACITY = 0.3`
- No breathing animation (static, fading)
- Fade linearly to 0 over `GHOST_DOT_DECAY_TICKS = 28` (~7 days)
- Tooltip: "*\<name\> was last seen here Y days ago*"
- Only shown for the player's own agents (worshippers/retinue)

---

## 2. Fog of War & Visibility Rules

Visibility depends on the player's relationship to the hex and whether they are actively scrying:

| Situation | What the player sees |
|-----------|---------------------|
| **Avatar's hex** | ALL agents — divine presence reveals everything |
| **LOS hex, not scrying** | Only the player's own worshippers/retinue (divine bond) |
| **LOS hex, actively scrying** | Player's agents + agents discovered via colocation encounter detection (§6) |
| **Remembered hex (lost LOS)** | Ghost dots for player's agents only, fading over 28 ticks |
| **No LOS** | Nothing |

"Discovered via colocation" means: the encounter engine (§6) fired a successful detection roll while the player was scrying, revealing a foreign agent. That agent remains visible in the hex until scrying ends or the agent moves.

---

## 3. Movement Architecture

### 3.1 Core Principle

**Movement follows the graph.** Every edge traversal in the movement graph costs **1 tick + node tax**. An agent is always at a node — never in limbo. Agents are always touchable, always encounterable. There is no safe transit state.

The agent pays the tick cost, then transitions to the destination node. While "paying," they remain at their current node and can be targeted by encounters, events, and other agents.

### 3.2 Scale

- 1 tick ≈ 4 hours
- Human walking speed ≈ 4 km/hr
- Hex width ≈ 8–10 km across
- Crossing a hex on foot ≈ 2 ticks (border→center + center→border)

### 3.3 Hex-to-Hex Travel

Moving between adjacent hexes requires two edge traversals:

```
[Hex A center] ---(1 tick + Hex A departure tax)---> [Hex A/B border]
[Hex A/B border] ---(1 tick + Hex B arrival tax)---> [Hex B center]
```

Total: **2 ticks base + terrain penalties on both departure and arrival hexes.**

Terrain taxes are per hex terrain type:

| Terrain | Tax (ticks) | Rationale |
|---------|------------|-----------|
| Plains / Road | 0 | Easy travel |
| Forest | +0.5 | Dense but passable |
| Hills | +0.5 | Elevation gain |
| Swamp | +1 | Difficult footing |
| Mountain | +1.5 | Steep terrain |
| Desert | +1 | Heat, sand |

These are named constants in a `TERRAIN_MOVEMENT_TAX` lookup, tunable per terrain type.

### 3.4 Within-Hex Navigation

Within a hex, locations and sublocations form a tree. Moving up or down the tree costs ticks:

| Movement | Cost |
|----------|------|
| Hex center → Location | 1 tick + location entry tax |
| Location → Sublocation | 1 tick + sublocation entry tax |
| Sublocation → Sublocation (same location) | 1 tick |
| Sublocation → Location (exit) | 1 tick |
| Location → Hex center (exit) | 1 tick |

Location/sublocation taxes are per location type (e.g., fortified city = +1 tick to enter, open market = +0). These are properties on the location node.

### 3.5 Movement Speed Modifiers

The existing graph-native modifier engine applies to movement. Modifiers reduce the effective tick cost per edge:

| Source | Example modifier |
|--------|-----------------|
| Mount artifact | `+movement_speed` (mule: small bonus, horse: large bonus) |
| Road edge | Zeroes terrain tax for connected hexes |
| Spell/blessing | Temporary speed boost (ticks remaining on trait edge) |
| Provisions | `+movement for 3 ticks` (already in starter content) |
| Trait | "Fleet-footed" trait contributes to movement domain |
| Encumbrance | Heavy inventory = penalty (future) |

Item data already references `+movement_speed` on mounts and provisions. The engine needs to wire `movement_speed` modifiers into the edge cost calculation during pathfinding.

**Named constant:** `BASE_EDGE_TRAVERSAL_COST = 1`

---

## 4. Agent Goal Evaluation & Decision-Making

### 4.1 Integration with Existing Pipeline

The agent selection pipeline (`agentSelection.ts`) already scores action candidates via:

1. `scoreByGoalAlignment()` — axiological profile × action motivations
2. `applyDispositionModifier()` — game theory (cooperation strategy + reputation)
3. `applyPersonalityWeights()` — trait-based adjustments
4. `selectTopN()` → `assignProbabilities()` → `probabilisticSelect()`

Movement candidates are a new candidate type injected into this pipeline. "Move to hex X" competes against "do action Y at current location." An agent only moves if the best move candidate outscores the best local action candidate.

### 4.2 Movement Candidate Scoring

For each reachable destination with available encounters/actions:

```
moveScore = motivationPull × distanceDecay × threatModifier × socialModifier
```

Where:

**motivationPull** = best axiological alignment score among actions available at the destination. This uses the existing `scoreByGoalAlignment()` against the destination's encounter templates and action candidates. Quest encounters (§5) inflate this score via their `questPriority` multiplier.

**distanceDecay** = `1 / (1 + DISTANCE_DECAY_FACTOR × tickDistance)` where `tickDistance` is the shortest-path cost in ticks from current position to destination. Diminishing returns — a destination 2 ticks away is much more attractive than one 20 ticks away, but a high-priority quest can still overcome long distances.

**threatModifier** = `1.0 - (hexThreatRating × (1.0 - courageFactor))` where:
- `hexThreatRating` (0.0–1.0) is computed from: controlling faction hostility + culture misalignment + known hostile agents + average encounter difficulty at destination
- `courageFactor` is derived from the agent's `courage_prudence` axiological value (high courage → threat matters less)
- A brave warlord barely notices threat; a cautious merchant avoids dangerous hexes

**socialModifier** = composite of:
- Faction alignment: +bonus if agent's faction controls destination, −penalty if enemy faction controls it
- Culture compatibility: same culture = +bonus, hostile culture = −penalty (uses culture edge strength)
- Worship sites: +bonus if destination contains a place of worship for agent's god
- Social ties: +bonus if allies/friends are at destination (from cooperation history)

### 4.3 Threat Rating Computation

Each hex/location gets a composite threat rating (0.0–1.0) from:

| Factor | Weight | Source |
|--------|--------|--------|
| Controlling faction hostility | High | Rival state `hostility` field |
| Culture misalignment | Medium | Agent's culture vs. hex's current culture (edge strength comparison) |
| Known hostile agents | Medium | Agents at destination with defect history or enemy faction membership |
| Average encounter difficulty | Low | Mean threat rating of encounter templates at destination |
| Recent violence/events | Low | Recent combat/death events at location (future) |

Threat rating feeds into both the `threatModifier` in goal evaluation AND influences encounter avoidance — agents with high prudence naturally avoid high-threat hexes.

**Named constants:** `THREAT_FACTION_WEIGHT`, `THREAT_CULTURE_WEIGHT`, `THREAT_HOSTILE_AGENT_WEIGHT`, `THREAT_ENCOUNTER_WEIGHT`

### 4.4 No Hard Horizon

Agents evaluate all reachable nodes, not a fixed radius. The `distanceDecay` function naturally deprioritizes distant destinations — no agent will cross 40 hexes for a mediocre encounter. But a high-priority quest encounter (§5) at 40 hexes can still win because the `questPriority` multiplier overcomes the decay.

A hard horizon would create artificial cliffs in behavior. The smooth decay curve produces more naturalistic movement patterns.

### 4.5 Decision Frequency

Agents re-evaluate their destination every `DECISION_REEVALUATION_TICKS` ticks (default: 4, ~1 day). Between evaluations, they continue on their current path. This prevents erratic zigzagging while still allowing course correction when circumstances change (new quest, threat appears, ally moves).

An agent that arrives at its destination immediately re-evaluates (what do I do here? stay and act, or move on?).

---

## 5. Quest Encounters (Targeted Encounters)

### 5.1 Core Concept

**Quests are not a separate system.** They are encounters with a visibility filter and a priority multiplier.

A quest is an encounter node spawned at a specific location/sublocation, with:
- `visibleTo`: array of agent IDs, faction IDs, or `"all"` (default encounters are `"all"`)
- `questPriority`: score multiplier (default encounters = 1.0, quests = 2.0–10.0)

The encounter sits at the destination until resolved, expired, or reassigned.

### 5.2 How Quests Influence Movement

Quest encounters are scored by the same `scoreByGoalAlignment()` as regular encounters, but the result is multiplied by `questPriority`. This inflated motivation score flows through the normal movement candidate formula:

```
motivationPull = baseAlignmentScore × questPriority
```

A `questPriority` of 5.0 means this encounter scores 5× higher than an equivalent regular encounter. Combined with the axiological profile (a warlord *wants* to fight), this creates a powerful directional pull that can overcome distance decay and threat penalties.

### 5.3 Quest Priority vs. Threat

Not a binary override. The `questPriority` multiplier is tunable per encounter. Examples:

| Quest type | questPriority | Behavior |
|-----------|---------------|----------|
| "Visit the market" | 1.5 | Mild nudge, easily overridden by threat or distance |
| "Retrieve the artifact" | 3.0 | Strong pull, worth moderate danger |
| "Take the city by force" | 5.0–8.0 | Dominant — overrides most threat and distance penalties |
| "Fulfill divine prophecy" | 10.0 | Compulsive — agent goes regardless of danger |

The axiological profile still matters. A cowardly agent (`courage_prudence` near −1.0) with a 5.0× quest may still hesitate at an extremely threatening destination, because the `threatModifier` scales with courage. A brave agent shrugs off the same threat.

### 5.4 Quest Lifecycle

| Event | Effect |
|-------|--------|
| Faction decision / divine intervention / narrative event | Spawns quest encounter at target location |
| Agent arrives and resolves encounter | Quest completed — encounter removed, rewards granted |
| Agent dies en route | Quest may be reassigned to another eligible agent, or expires |
| Timeout (optional `expiresAtTick`) | Quest encounter removed, possible narrative consequence |
| Conditions change (faction makes peace) | Quest encounter can be cancelled or modified |

### 5.5 Visibility Filter Examples

| Quest | `visibleTo` | Rationale |
|-------|------------|-----------|
| "Take the city" | `[faction:ironPact]` | Any Iron Pact agent can attempt it |
| "Steal the relic" | `[agent:shadow_thief_42]` | Only the specific thief sees it |
| "Defend the shrine" | `[faction:playerWorshippers]` | All the player's worshippers are drawn to defend |
| "Trade expedition" | `[archetype:merchant]` | Any merchant-class agent in any faction |
| "Pilgrimage" | `[culture:sunChildren]` | Cultural obligation, not faction-bound |

The `visibleTo` filter extends the existing `actorAffinities` on encounter templates. Encounters with `visibleTo: "all"` behave exactly as current encounters do — no breaking change.

---

## 6. Colocation Encounter Detection (DES-010 Hook)

### 6.1 Mechanic

Every tick, for each pair of agents sharing a location tier, roll for discovery:

| Colocation level | Base discovery chance per tick |
|-----------------|------------------------------|
| Same hex (different locations) | `ENCOUNTER_BASE_CHANCE_HEX = 0.05` (5%) |
| Same location | `ENCOUNTER_BASE_CHANCE_LOCATION = 0.10` (10%) |
| Same sublocation | `ENCOUNTER_BASE_CHANCE_SUBLOCATION = 0.20` (20%) |

### 6.2 Stat Modifiers

Discovery chance is modified by both agents' stats:

- **Observer's Eye domain capability:** +bonus to spot others (higher Eye = more perceptive)
- **Target's Shadow domain capability:** −penalty to being spotted (higher Shadow = stealthier)
- **Social orientation:** Cooperative agents are more approachable (slight +bonus)

```
finalChance = baseChance + observerEyeBonus - targetShadowPenalty + socialBonus
```

Clamped to [0.01, 0.95] — always a small chance, never guaranteed.

### 6.3 Detection Outcomes

Successful detection triggers:

1. **Player notification / story beat** — "*Your agent \<name\> has encountered \<other agent\> at \<location\>.*" This is a narrative opportunity.
2. **Agent becomes visible** on the hex map (if the player is scrying that hex)
3. **Interaction opportunity** — feeds into the disposition/cooperation system. The agents may cooperate, trade, fight, or ignore each other based on their cooperation strategies and reputation history.
4. **Possible encounter spawn** — meeting certain agents in certain places could trigger new encounters (e.g., meeting a rival agent at a contested shrine triggers a confrontation encounter).

### 6.4 Scrying Requirement

Colocation detection only produces player-visible results when the player is actively scrying the hex. If the player is not scrying:

- Detection still happens between agents (they discover each other)
- But the player doesn't learn about it until later (via agent reports, story beats, or re-scrying)

This preserves the fog-of-war — the player doesn't get omniscient information about agent encounters just because they have LOS.

---

## 7. Pathfinding

### 7.1 Graph Shortest Path

Pathfinding operates on the movement graph (hexes + locations + sublocations connected by edges with tick costs). Standard Dijkstra or A* on weighted edges, where weight = `BASE_EDGE_TRAVERSAL_COST + nodeTax - speedModifiers`.

### 7.2 Map Knowledge

**Start simple:** All agents know the full map. No agent-level fog of war for pathfinding. This avoids the complexity of per-agent map knowledge while we validate the movement system.

**Future refinement:** Agent LOS constraints, faction-shared map knowledge, exploration-based discovery. All additive — the base pathfinding code doesn't need to change, only the graph it operates on.

### 7.3 Generic System

The pathfinding system is entity-agnostic. It works for:

| Entity type | Goal evaluation | Movement cost |
|-------------|----------------|---------------|
| Agents | Axiological profile + quests + social | Base + terrain + modifiers |
| Armies | Military objectives + faction orders | Base + terrain + army size penalty |
| Parties | Shared goal of party leader | Base + terrain + slowest member |
| Monsters (DES-008) | Territorial range + prey seeking | Base + terrain affinity (some monsters move faster in swamp) |

Entity type determines which goals are valid and how the value function weights them. The movement and routing code is shared.

### 7.4 Path Execution

Once an agent selects a destination:

1. Compute shortest path (sequence of nodes)
2. Store path as `movementQueue` on the agent node (array of node IDs)
3. Each tick: if agent has a `movementQueue`, pay the next edge cost
4. When cost is paid, transition to next node, pop from queue
5. On arrival at destination (queue empty), re-evaluate goals
6. Every `DECISION_REEVALUATION_TICKS` (4), re-evaluate even mid-path — agent may change course

**No limbo:** While paying edge cost, agent remains at current node. Encounters fire. Events fire. The agent is always addressable.

---

## 8. Tunable Constants Summary

| Constant | Default | Category | Purpose |
|----------|---------|----------|---------|
| `ZOOM_TOKEN_THRESHOLD` | 2.5 | Visual | d3 scale at which dots become tokens |
| `MAX_RING_AGENTS` | 6 | Visual | Agents in ring before badge fallback |
| `TRAIL_HISTORY_TICKS` | 12 | Visual | Ticks of trail shown behind agent |
| `GHOST_DOT_INITIAL_OPACITY` | 0.3 | Visual | Starting opacity for ghost dots |
| `GHOST_DOT_DECAY_TICKS` | 28 | Visual | Ticks before ghost dot fully fades |
| `BASE_EDGE_TRAVERSAL_COST` | 1 | Movement | Base tick cost per graph edge |
| `TERRAIN_MOVEMENT_TAX.*` | varies | Movement | Per-terrain-type tick tax |
| `DISTANCE_DECAY_FACTOR` | TBD | Decision | How fast distance reduces destination value |
| `DECISION_REEVALUATION_TICKS` | 4 | Decision | How often agents reconsider destination |
| `THREAT_FACTION_WEIGHT` | TBD | Threat | Weight of faction hostility in threat rating |
| `THREAT_CULTURE_WEIGHT` | TBD | Threat | Weight of culture misalignment in threat rating |
| `THREAT_HOSTILE_AGENT_WEIGHT` | TBD | Threat | Weight of known hostiles in threat rating |
| `THREAT_ENCOUNTER_WEIGHT` | TBD | Threat | Weight of encounter difficulty in threat rating |
| `ENCOUNTER_BASE_CHANCE_HEX` | 0.05 | Detection | Per-tick discovery chance, same hex |
| `ENCOUNTER_BASE_CHANCE_LOCATION` | 0.10 | Detection | Per-tick discovery chance, same location |
| `ENCOUNTER_BASE_CHANCE_SUBLOCATION` | 0.20 | Detection | Per-tick discovery chance, same sublocation |

### 8.1 Content-Data Tunability Principle

Per non-functional priority #1 (Tunability): **every multiplier, tax, weight, and threshold in this design must be a named constant defined in content data, not hardcoded in engine logic.**

Specifically, the following must live in content-layer data files (alongside encounter templates, trait definitions, etc.) — not in engine modules:

**Movement costs as content:**
- `TERRAIN_MOVEMENT_TAX` — keyed by terrain type. A content author adding a new terrain type (e.g., "volcanic waste") just adds a row. No engine change.
- Location/sublocation entry taxes — property on the location node itself, set during world generation or content authoring. A fortified city sets `entryTax: 1`, an open camp sets `entryTax: 0`.
- Road edges — a `road` edge between two hexes zeroes the terrain tax. Roads are content, placed by world generation or player actions.

**Decision weights as content:**
- `DISTANCE_DECAY_FACTOR`, `THREAT_*_WEIGHT` — all in a single `movement-decision-content.ts` content file. Tweaking game feel = changing a number in one file.
- `questPriority` — set per encounter template. Content authors control how strongly a quest pulls.

**Detection chances as content:**
- `ENCOUNTER_BASE_CHANCE_*` — in encounter content data. Can be overridden per location (a crowded market has higher detection than a sprawling wilderness hex).

**Speed modifiers as content:**
- Mount and provision bonuses already live in `starter-attachments.ts`. New items adding `+movement_speed` are purely content additions.

**Engine modules read these values at resolution time — they never own them.** The engine provides the formula; content provides the numbers. This is consistent with how the encounter system, trait system, and modifier engine already work.

---

## 9. What Exists vs. What Needs Building

### Already implemented (wire into new systems)

| System | File | Reuse |
|--------|------|-------|
| Axiological profiles & scoring | `agentSelection.ts` | Score destinations by action alignment |
| Disposition & cooperation | `disposition.ts` | Social modifiers in goal evaluation |
| Encounter templates & resolution | `encounter.ts` | Quest encounters extend this |
| Trait/modifier engine | graph edges | Movement speed modifiers |
| Culture identity & edges | `culture.ts` | Culture alignment scoring |
| Rival hostility tracking | `rival.ts` | Faction threat computation |
| Agent lifecycle & migration | `agentLifecycle.ts` | Replace random migration with pathfinding |
| `located_at` edge tracking | `avatarMove.ts` | Extend to all agent movement |
| `+movement_speed` item data | `starter-attachments.ts` | Wire into cost calculation |

### Needs new implementation

| Component | Priority | Depends on |
|-----------|----------|-----------|
| Movement graph with tick-cost edges | P0 | Hex grid, location tree |
| Pathfinding (Dijkstra on movement graph) | P0 | Movement graph |
| Movement candidate generation | P0 | Pathfinding, action candidates |
| Movement candidate scoring formula | P0 | Axiological pipeline |
| `movementQueue` on agent nodes | P0 | Graph engine |
| Tick-based movement execution | P0 | Movement queue, edge costs |
| `movement_speed` modifier processing | P1 | Modifier engine |
| Terrain tax lookup | P1 | Hex terrain data |
| Quest encounter type (visibleTo + questPriority) | P1 | Encounter system |
| Threat rating computation | P1 | Rival state, culture edges |
| Colocation detection per tick | P1 | Agent location queries |
| Hex map dot/token rendering | P1 | Hex renderer, d3 zoom |
| Movement trail rendering | P2 | Movement history tracking |
| Ghost dot rendering & decay | P2 | LOS system, tick counter |
| AgentInfoCard panel | P2 | UI framework |
| Decision re-evaluation timer | P2 | Movement execution |

---

## 10. Migration Path

The existing `agentLifecycle.ts` migration system (2% random hop per tick) is replaced by goal-directed movement. Migration phase becomes:

1. For each agent without a `movementQueue`: run goal evaluation, possibly generate a move candidate
2. For each agent with a `movementQueue`: pay next edge cost, transition if paid
3. Remove the old random `MIGRATION_CHANCE` roll entirely

This is a clean replacement — the old migration was a placeholder. The new system is strictly more capable and deterministic (seeded PRNG for goal evaluation ties).
