# M2: Conflict & Destruction — Armies, Battles, Sieges

> Design doc for TB-073. Created 2026-03-29.
> Covers M2.1 (Army Entities), M2.2 (Battle/Siege Resolution), M2.3 (Destruction & Consequences), M2.4 (Army Visibility & UI).
> M2.5 (Monster Encounters / TB-051) deferred — needs separate brainstorm.
> Brainstorm: Obsidian → `TheFantasyWorldSimulator/Brainstorms/brainstorm-conflict-and-destruction.md`

## Premise

The world needs danger. Economy without conflict is a spreadsheet. Agents without adversaries are tourists. Armies give factions teeth, give the player something to fear and fight, and make Iron Reach matter at scale.

**Narrative design principle (Malazan):** Gods don't command armies — they corrupt, empower, and manipulate the people who do. The player creates conditions where war becomes inevitable, or intervenes to prevent, redirect, or tip it. The player influences through **actions only** — no special war UI. War is the stakes part, not the fun part. Most ascendant types should feel dread when war comes.

**Design north star:** The worst outcome is the player being bored. A predictable victory is a missed opportunity. It should be so fun to lose a siege that the way you lost was awesome from a narrative perspective. Surprise and narrative quality over predictability, always.

## Existing Infrastructure

| Component | Status | Location |
|-----------|--------|----------|
| Faction system | ✅ Built (vertical slice) | `src/types/faction.ts`, `src/data/faction-definitions.ts` |
| Encounter system | ✅ Built (multi-step, modal, intervention) | `src/types/encounter.ts`, `src/engine/encounters/` |
| Divine intervention | ✅ Built (essence commitment, probability modification) | `src/engine/encounters/`, intervention modal |
| Agent movement + pathfinding | ✅ Built | `src/engine/movement/` |
| Sphere affinity (TB-072) | ✅ Phase 10 core complete | `src/types/sphereAffinity.ts`, `src/engine/spherePressure/` |
| Sphere pressure resolution | ✅ Built | `src/engine/spherePressure/phaseSpherePressure.ts` |
| Control effects + contestation | ✅ Built | `src/types/controlEffect.ts` |
| Prosperity system | ✅ Built | `src/engine/economy/phaseProsperity.ts` |
| Trade routes | ✅ Built | `trades_with` edge type |
| Ambition system (agents) | ✅ Built | `src/types/graph.ts` → `ambition` node type |
| HexMapV2 | ✅ Built (Three.js InstancedMesh) | `src/components/HexMapV2/` |
| Encounter modal + tiered notifications | ✅ Built | `src/components/` |
| Quintessence sphere (TB-075) | 🎨 Designed, not yet implemented | `.planning/BACKLOG.md` → TB-075 |
| Faction ambition system | ❌ Not built | Prerequisite — see Phase 0 |

## Prerequisite: Faction Ambition System (Phase 0)

Before armies can exist, factions need ambitions that drive military action. This extends the existing agent ambition system to factions.

### Scope: Mercenary Company Vertical Slice

Rather than building a general-purpose faction ambition system, Phase 0 builds a **mercenary company** as the second faction vertical slice (after the adventuring guild). The merc company is inherently military — its core business is fighting — making it the ideal test bed for the entire TB-073 pipeline.

**Evolving autonomy model:**
- **Early game:** Mercenary company is a tool — other factions hire them via Gold→Iron crossover encounters. Merc ambitions are reactive: `resource_acquisition` (get paid). They raise armies on contract.
- **Mid game:** As the company wins battles and gains reputation, they develop autonomous ambitions — `territorial_expansion` (seize undefended settlements for ransom), `revenge` (punish factions that stiffed them on payment).
- **Late game:** A successful merc company becomes a political force. No longer just hired swords — they're a faction with territorial ambitions, alliances, and enemies. The transition from mercenary to warlord state is itself a story the player watches unfold.

This tests both sides of the army equation: the merc company as army provider, and hiring factions exercising ambitions that spend Gold for military power. The general-purpose faction ambition system can be extracted and generalized after the vertical slice proves the pipeline.

### System: Faction Ambitions

Factions develop ambitions through **faction social encounters** — internal political encounters that drive faction action prioritization. These are analogous to agent ambitions but operate at group scale.

A faction's ambition pool is shaped by its `factionType`, `reachWeights`, sphere alignment, current prosperity, and relationships with neighboring factions. The faction's dominant ambition drives its encounter selection — some ambitions naturally lead to conflict.

```typescript
export type FactionAmbitionType =
  | 'territorial_expansion'    // Conquest-driven — high conflict potential
  | 'resource_acquisition'     // Economic — can escalate to conflict
  | 'defensive_consolidation'  // Fortification — low-medium conflict, may provoke preemptive strikes
  | 'cultural_dominance'       // Sphere influence spread — friction builds over time
  | 'revenge'                  // Retaliation for past grievances — high, emotional
  | 'divine_mandate';          // Carry out ascendant's will (strongly threaded factions)
```

Faction ambitions are `ambition` graph nodes connected to the faction actor via `pursues` edges — identical structure to agent ambitions. They are created and progressed through faction-level encounters.

**Constants Table — Faction Ambitions**

| Constant | Default | Purpose |
|----------|---------|---------|
| `FACTION_AMBITION_EVALUATION_INTERVAL` | 5 ticks | How often the faction reassesses its priority ambition |
| `EXPANSION_PROSPERITY_THRESHOLD` | 0.6 | Minimum faction prosperity before territorial expansion becomes eligible |
| `REVENGE_GRIEVANCE_DECAY` | 0.02/tick | How fast grudges fade (slow — factions have long memories) |
| `DIVINE_MANDATE_THREAD_THRESHOLD` | 3 (Influence Tier) | Minimum ascendant influence tier before faction responds to divine mandate ambitions |

**Tracing — `faction_ambition`**

```typescript
interface FactionAmbitionTrace {
  category: 'faction_ambition';
  tick: number;
  factionId: string;
  ambitionType: FactionAmbitionType;
  event: 'created' | 'prioritized' | 'progressed' | 'completed' | 'abandoned';
  reason: string;
}
```

**PRNG callouts:** Faction ambition selection uses seeded PRNG weighted by `reachWeights` and sphere alignment. Revenge ambitions bypass randomness — they trigger deterministically from grievance events.

**Fail-soft Table**

| Failure | Fallback | Consequence |
|---------|----------|-------------|
| Faction has no eligible ambitions | Default to `defensive_consolidation` | Faction turtles; peaceful but boring — tune eligibility thresholds |
| Faction ambition references destroyed target | Abandon ambition, reassess next interval | Log trace with `abandoned` + reason |
| Faction prosperity too low for any offensive ambition | Only `defensive_consolidation` and `revenge` eligible | Impoverished factions are defensive or vengeful, never expansionist |

---

## Phase 1: Army Entities

### System: Army as Actor Node

Armies are **`actor` nodes** in the graph — no new node type needed. They are distinguished by an `armyState` property bag on the actor node, analogous to how locations have `locationSubtype`.

An army is a faction-level agent that participates in the encounter system like any other actor.

```typescript
export interface ArmyState {
  /** Army size category — affects battle strength, movement speed, supply cost */
  size: 'warband' | 'regiment' | 'host';
  /** Approximate headcount — warband ~100, regiment ~1000, host ~10000 */
  headcount: number;
  /** Current objective — what the army is trying to do */
  objective: ArmyObjective | null;
  /** Quintessence score — army cohesion/quality/health. Silently degrades */
  quintessence: number;
  /** Maximum quintessence at full strength */
  quintessenceMax: number;
  /** Tick the army was raised */
  raisedTick: number;
  /** Gold cost per tick to maintain */
  maintenanceCost: number;
}

// Relationships are graph edges, NOT properties (CLAUDE.md architectural decision):
// - Commander: `commanded_by` edge → commander agent
// - Faction: `member_of` edge → faction actor
// - Location: `located_at` edge → hex/location
// - Objective: `pursues` edge → ambition node
// - Sphere alignment: standard SphereAffinity on the node (TB-072), inherited from faction at creation

export interface ArmyObjective {
  type: 'raid' | 'conquer' | 'defend' | 'intercept' | 'reinforce_siege';
  targetNodeId: string;
  /** Estimated quintessence cost to reach target (distance × terrain factor) */
  estimatedAttrition: number;
}
```

**Graph connections:**

| Edge | From | To | Purpose |
|------|------|----|---------|
| `member_of` | Army actor | Faction actor | Army belongs to faction |
| `commanded_by` | Army actor | Commander agent | Commander is locked in |
| `located_at` | Army actor | Location/hex | Army's current position |
| `pursues` | Army actor | Ambition node | Army's current objective (via ambition) |

Note: `commanded_by` is a new edge type. The commander agent's `located_at` edge moves with the army — the commander is physically committed.

### System: Army Spawning

Armies are raised through **faction encounters**. A faction encounter to raise an army fires when:

1. Faction has a prioritized ambition that requires military force (`territorial_expansion`, `revenge`, or `defensive_consolidation` under threat)
2. Faction has a member agent at sufficient Iron capability tier (minimum Tier 4 "Veteran")
3. Faction has sufficient Gold capability (minimum Tier 3 "Established")
4. No existing army is already active for this faction (one army per faction at launch — tune later)

The spawning encounter:

1. Selects the highest Iron-capable faction leader as commander
2. Commits the commander — their `located_at` edge will follow the army
3. Creates the army `actor` node at the faction's primary settlement
4. Deducts Gold from faction (one-time creation cost + ongoing maintenance)
5. Sets initial Quintessence from faction's Iron capability tier
6. Assigns initial objective from the faction's priority ambition

**Constants Table — Army Spawning**

| Constant | Default | Purpose |
|----------|---------|---------|
| `ARMY_SPAWN_IRON_TIER_MIN` | 4 | Minimum commander Iron capability tier |
| `ARMY_SPAWN_GOLD_TIER_MIN` | 3 | Minimum faction Gold capability tier |
| `ARMY_CREATION_GOLD_COST` | 50 | One-time Gold deduction at creation |
| `ARMY_MAINTENANCE_WARBAND` | 2/tick | Per-tick Gold drain for warband |
| `ARMY_MAINTENANCE_REGIMENT` | 5/tick | Per-tick Gold drain for regiment |
| `ARMY_MAINTENANCE_HOST` | 10/tick | Per-tick Gold drain for host |
| `ARMY_QUINTESSENCE_BASE_WARBAND` | 30 | Starting quintessence for warband |
| `ARMY_QUINTESSENCE_BASE_REGIMENT` | 60 | Starting quintessence for regiment |
| `ARMY_QUINTESSENCE_BASE_HOST` | 100 | Starting quintessence for host |
| `MAX_ARMIES_PER_FACTION` | 1 | Simultaneous active armies per faction (tune upward later) |

**Tracing — `army_lifecycle`**

```typescript
interface ArmyLifecycleTrace {
  category: 'army_lifecycle';
  tick: number;
  armyId: string;
  factionId: string;
  commanderId: string;
  event: 'raised' | 'objective_set' | 'arrived' | 'disbanded' | 'destroyed' | 'mutiny';
  details: string;
}
```

**PRNG callouts:** Commander selection is deterministic (highest Iron tier). Army size is deterministic (based on faction Gold tier). No randomness in spawning.

**Fail-soft Table**

| Failure | Fallback | Consequence |
|---------|----------|-------------|
| No eligible commander (none at Iron Tier 4+) | Skip army spawn encounter | Faction cannot field army until agents level up |
| Faction Gold insufficient mid-campaign | Army Quintessence degrades faster (starvation) | Spawns supply crisis encounter sooner |
| Commander dies during unrelated encounter before army spawns | Cancel army spawn | Log trace, faction reassesses next ambition cycle |
| Faction already has max armies | Skip army spawn encounter | One-army limit prevents faction from draining all Gold |

---

## Phase 2: Army Movement & Attrition

### System: Army Movement

Armies use the **existing pathfinding system** (`findShortestPath`) but with modified cost weights. Armies are slower than individual agents, and terrain penalties are amplified.

```typescript
/** Movement cost multipliers for armies (vs. base agent cost) */
export const ARMY_MOVEMENT_COST_MULTIPLIERS: Record<TerrainType, number> = {
  plains: 1.5,
  grassland: 1.5,
  forest: 2.5,
  hills: 2.0,
  mountains: 4.0,    // Extremely costly — armies avoid mountains
  desert: 3.0,
  swamp: 3.5,
  coast: 1.5,
  water: Infinity,    // Armies cannot cross water (no naval at launch)
};

/** Road discount for armies (stronger than for agents — roads matter more) */
export const ARMY_ROAD_DISCOUNT = 0.4;  // 40% cost reduction on roads
```

Army movement is processed by the existing `phaseMovement` — the army is an actor with a `MovementState`. The modified cost weights are applied when the army's path is calculated.

### System: Quintessence Attrition

Each tick the army exists, its Quintessence degrades based on:

```
attritionPerTick = BASE_ATTRITION
  + (terrainCostOfCurrentHex × TERRAIN_ATTRITION_FACTOR)
  + (isOffRoad ? OFF_ROAD_ATTRITION_PENALTY : 0)
  + (factionGoldBelowMaintenance ? UNDERFUNDED_ATTRITION_PENALTY : 0)
```

The player **never sees the Quintessence number**. They only see the consequences when thresholds are crossed, delivered as encounters.

**Quintessence Threshold Encounters:**

| Threshold | % of Max | Encounter Spawned |
|-----------|----------|-------------------|
| Strained | 70% | `army_supply_crisis` — supply running low, commander chooses rationing/foraging/pushing on |
| Weakened | 50% | `army_desertion_wave` — soldiers leaving, commander must rally or accept reduced strength |
| Critical | 30% | `army_mutiny` — troops refuse orders or challenge commander. Political encounter |
| Collapse | 10% | `army_forced_disbandment` — army dissolves. Commander released (possibly diminished) |

When a threshold encounter fires, the encounter outcome determines whether the army stabilizes, degrades further, or recovers slightly. Player intervention via the existing encounter system can prevent collapse — at essence cost.

**Constants Table — Movement & Attrition**

| Constant | Default | Range | Purpose |
|----------|---------|-------|---------|
| `ARMY_BASE_ATTRITION` | 0.5/tick | 0.2–1.0 | Baseline Quintessence loss per tick |
| `TERRAIN_ATTRITION_FACTOR` | 0.3 | 0.1–0.5 | Multiplied by terrain cost, added to attrition |
| `OFF_ROAD_ATTRITION_PENALTY` | 0.8 | 0.3–1.5 | Extra attrition when not on a road |
| `UNDERFUNDED_ATTRITION_PENALTY` | 1.5 | 0.5–3.0 | Extra attrition when faction can't pay maintenance |
| `QUINTESSENCE_THRESHOLD_STRAINED` | 0.70 | — | 70% of max |
| `QUINTESSENCE_THRESHOLD_WEAKENED` | 0.50 | — | 50% of max |
| `QUINTESSENCE_THRESHOLD_CRITICAL` | 0.30 | — | 30% of max |
| `QUINTESSENCE_THRESHOLD_COLLAPSE` | 0.10 | — | 10% of max |
| `ARMY_SPEED_WARBAND` | 2 hexes/tick | — | Warband base movement speed |
| `ARMY_SPEED_REGIMENT` | 1.5 hexes/tick | — | Regiment base movement speed |
| `ARMY_SPEED_HOST` | 1 hex/tick | — | Host base movement speed |

**Tracing — `army_attrition`**

```typescript
interface ArmyAttritionTrace {
  category: 'army_attrition';
  tick: number;
  armyId: string;
  quintessenceBefore: number;
  quintessenceAfter: number;
  attritionAmount: number;
  attritionSources: {
    base: number;
    terrain: number;
    offRoad: number;
    underfunded: number;
  };
  thresholdCrossed?: 'strained' | 'weakened' | 'critical' | 'collapse';
}
```

**PRNG callouts:** Attrition calculation is deterministic. Threshold encounter outcomes use the existing encounter resolution PRNG (seeded).

**Fail-soft Table**

| Failure | Fallback | Consequence |
|---------|----------|-------------|
| Army has no valid path to objective | Army stays in place, Quintessence still degrades | Will eventually hit threshold and disband — expensive mistake by faction |
| Terrain cost lookup fails (unknown terrain) | Use `plains` cost (1.5) | Safe default; log warning trace |
| Faction Gold field missing or NaN | Treat as underfunded (maximum attrition penalty) | Aggressive but fail-safe — army degrades fast |
| Quintessence goes below 0 | Clamp to 0, force `army_forced_disbandment` | Army always dissolves cleanly rather than entering negative state |

---

## Phase 3: Battle Resolution

### System: Battle as Graph Node

When two armies meet at the same hex, a **battle node** is created in the graph. The battle is a thing in the world — `located_at` a hex, connected to participating armies via edges, discoverable by any entity through normal graph traversal.

This means agents and factions can converge on battles emergently. A Shadow assassin three hexes away sees the battle node, checks if their target (enemy commander) is connected to it via `commanded_by`, and decides to move toward it. An allied faction discovers the battle through their decision phase and sends reinforcements. No special convergence logic — the battle is just an interesting node at a location, and existing systems react to interesting things.

```typescript
export interface BattleState {
  /** Battle type — determines pacing and spotlight pool */
  battleType: 'field_battle' | 'siege';
  /** Momentum — shifted by spotlight outcomes and size advantage. Positive = attacker winning */
  momentum: number;
  /** Composited prose updated each tick */
  backgroundProse: string;
  /** IDs of spotlight child encounters spawned so far */
  spotlightHistory: string[];
  /** Ticks since last spotlight (for pacing) */
  ticksSinceLastSpotlight: number;
  /** Tick the battle started */
  startedTick: number;
  /** Settlement under siege (if applicable) */
  settlementId?: string;
  /** Initial momentum offset from size/modifier calculation */
  initialMomentumOffset: number;
}

// Relationships are graph edges:
// - Attacker army: `participates_in` edge (new) → battle node
// - Defender army: `participates_in` edge → battle node
// - Location: `located_at` edge → hex
// - Additional armies that join: `participates_in` edges added when they arrive
```

Note: `participates_in` is a new edge type connecting armies (and potentially individual agents who converge) to the battle node. This enables graph traversal: "who is involved in this battle?" and "what battles is this army in?"

Each tick, the encounter phase checks for active battle nodes and:

1. Updates `backgroundProse` from the composited prose pipeline (base + faction + agent + location + intervention layers)
2. Decrements army Quintessence for combat attrition (separate from march attrition)
3. Checks spotlight spawn eligibility based on pacing profile and momentum thresholds
4. If a spotlight is due, spawns a child encounter referencing the battle node
5. Applies spotlight outcomes to battle momentum
6. Checks resolution threshold — if momentum exceeds ±`BATTLE_RESOLUTION_THRESHOLD`, the battle ends
7. Checks for newly arrived entities (armies, agents) and updates `participates_in` edges

### System: Size & Situational Modifiers

Battles aren't decided by who has more soldiers — they're decided by context. Numbers only become the deciding factor when all other advantages are neutralized. When they do, *that itself is a story* — the moment a smaller army realizes the tactical advantages are gone and it's just a numbers game.

**Size tiers and approximate headcount:**

| Tier | Headcount | Examples |
|------|-----------|---------|
| Warband | ~100 | Raiding party, mercenary band, scouting force |
| Regiment | ~1,000 | Professional military unit, city garrison |
| Host | ~10,000 | Full army, national mobilization |

**Situational multipliers** (multiply effective size of the advantaged side):

| Modifier | Multiplier | Source |
|----------|-----------|--------|
| Prepared defense | 3:1 | Defender chose the ground, had time to prepare |
| Basic fortification | 10:1 | Settlement with walls |
| Grand fortification | 30:1 | Major fortified city, capital |
| Tactical brilliance | up to 20:1 | Commander Iron capability + terrain choice + army veterancy |
| Tactical blunder | 0.05:1 (20:1 against) | Low-capability commander, bad terrain, raw recruits |

**Initial momentum calculation:**

```
effectiveAttackerSize = attackerHeadcount × attackerTacticalModifier
effectiveDefenderSize = defenderHeadcount × defenderSituationalModifier × defenderTacticalModifier
sizeRatio = effectiveAttackerSize / effectiveDefenderSize
initialMomentum = clamp(log2(sizeRatio) × SIZE_MOMENTUM_SCALE, -BATTLE_RESOLUTION_THRESHOLD + 2, BATTLE_RESOLUTION_THRESHOLD - 2)
```

The `log2` compression means a 2:1 advantage gives +1 momentum, 4:1 gives +2, etc. Clamped so that even an overwhelming size advantage can't auto-resolve the battle — there must always be at least 2 momentum of space for spotlights to matter.

**Key narrative beat: modifiers stripping away.** When a siege breach spotlight succeeds, the fortification multiplier drops dramatically. The prose shifts — IPK keywords change from "**impregnable** walls" to "**shattered** defenses" — and the player reads the moment the math turns against the defenders. This is itself one of the most dramatic spotlight encounters.

**IPK keywords for battle mechanics (all communicated through prose, never numbers):**

| Mechanical State | IPK Keywords (examples) | Sphere Color |
|-----------------|------------------------|-------------|
| Size advantage | **overwhelming**, **horde**, **endless ranks** | Force |
| Size disadvantage | **outnumbered**, **thin line**, **desperate few** | Force |
| Fortification active | **impregnable**, **towering walls**, **ancient wards** | Stone |
| Fortification breached | **shattered**, **broken gates**, **crumbling stone** | Entropy |
| Tactical advantage | **masterful**, **flanking**, **disciplined formation** | Iron |
| Tactical disadvantage | **disordered**, **stumbling**, **caught unaware** | Entropy |
| Modifiers neutralized (numbers game) | **grinding**, **attrition**, **weight of numbers** | Force |
| Divine intervention | **unnatural**, **blessed**, **cursed**, **otherworldly** | (sphere-specific) |

**Constants Table — Size & Modifiers**

| Constant | Default | Range | Purpose |
|----------|---------|-------|---------|
| `SIZE_MOMENTUM_SCALE` | 1.5 | 1.0–3.0 | How much size ratio translates to initial momentum |
| `FORTIFICATION_BASIC` | 10 | 5–15 | Effective size multiplier for basic walls |
| `FORTIFICATION_GRAND` | 30 | 20–40 | Effective size multiplier for grand fortress |
| `PREPARED_DEFENSE_MULTIPLIER` | 3 | 2–5 | Multiplier for prepared defensive position |
| `TACTICAL_MAX_MULTIPLIER` | 20 | 10–30 | Maximum tactical advantage multiplier |
| `BREACH_FORTIFICATION_REDUCTION` | 0.3 | 0.1–0.5 | Fortification multiplier after breach (30% of original) |

### System: Spotlight Encounters

Spotlights are **regular encounters** spawned as children of the parent battle. They use the existing encounter modal and intervention system — the player sees prose, stakes, and the three intervention choices (Pull the threads / Watch from afar / Withdraw).

**Spotlight POV is determined by the player's threads:**

- Thread to the commander → commander's-eye-view spotlight
- Thread to the whole faction → abstract strategic perspective (morale, momentum)
- Thread to an artifact in the battle → artifact's POV
- Multiple threads → multiple spotlights across multiple ticks
- No threads → no spotlights (one-line chronicle entry for the aftermath)

**Detail scales with thread count:**

| Thread Count | Experience |
|-------------|------------|
| 0 | One-line chronicle entry: "[Army] sacked [Settlement]" |
| 1 | One spotlight per battle, brief, personal |
| 2 | Two spotlights from different perspectives |
| 3+ | Layered narrative over multiple ticks — closest to reading a Malazan battle chapter |

**Spotlight Selection Pool:**

Spotlights are selected from a template pool, filtered by battle state and available threaded entities. Each template has eligibility conditions:

| Template | Eligibility | POV Requirement | Momentum Effect |
|----------|------------|-----------------|-----------------|
| `spotlight_commander_peril` | Army losing (momentum < -3); commander threaded | Commander thread | Large swing if intervention succeeds |
| `spotlight_turning_point` | Momentum near 0 (±2) | Any thread | Medium swing either direction |
| `spotlight_moral_dilemma` | Victory possible but sphere tension high | Commander thread | Victory with sphere-alignment cost |
| `spotlight_betrayal` | Unresolved faction grievance in army history | Betrayer or commander thread | Large negative swing (betrayal hurts) |
| `spotlight_artifact_activation` | Significant artifact present; sphere pressure intense | Artifact thread (or any) | Unpredictable — large swing either direction |
| `spotlight_third_army` | Another faction's army enters battle hex | Any thread | Resets momentum toward 0 (chaos) |
| `spotlight_divine_counterstrike` | Rival ascendant invested in opposing army | Commander or faction thread | Negates player's previous intervention |
| `spotlight_last_stand` | Army nearly destroyed (Quintessence < 20%) but holding | Commander thread | Extremely high intervention cost, massive narrative |
| `spotlight_champion_duel` | Both armies have Tier 5+ Iron commanders | Commander thread | Personal-scale encounter; winner gains large momentum |

**Constants Table — Battle Resolution**

| Constant | Default | Range | Purpose |
|----------|---------|-------|---------|
| `BATTLE_RESOLUTION_THRESHOLD` | 8 | 5–12 | Momentum magnitude that ends the battle |
| `BATTLE_MOMENTUM_PER_SPOTLIGHT` | 1–4 | — | Base momentum shift per spotlight outcome (varies by template) |
| `FIELD_BATTLE_SPOTLIGHT_INTERVAL` | 1 tick | — | Ticks between spotlights in field battles |
| `FIELD_BATTLE_MAX_DURATION` | 5 ticks | 3–8 | Maximum ticks before forced resolution |
| `BATTLE_COMBAT_ATTRITION` | 2.0/tick | 1.0–4.0 | Quintessence loss per tick during active combat |
| `SPOTLIGHT_INTERVENTION_COST_MULTIPLIER` | 1.5 | 1.0–2.0 | Battle spotlights cost more essence than normal encounters (fog of war, chaos) |

**Tracing — `battle`**

```typescript
interface BattleTrace {
  category: 'battle';
  tick: number;
  battleEncounterId: string;
  event: 'started' | 'spotlight_spawned' | 'momentum_shift' | 'resolved';
  momentum: number;
  attackerArmyId: string;
  defenderArmyId?: string;
  spotlightTemplateId?: string;
  spotlightOutcome?: 'success' | 'failure' | 'critical_success' | 'critical_failure';
  resolutionType?: 'attacker_victory' | 'defender_victory' | 'stalemate' | 'mutual_destruction';
}
```

**PRNG callouts:** Spotlight selection uses seeded PRNG when multiple eligible templates exist. Spotlight encounter resolution uses the existing encounter PRNG. Momentum shifts from spotlight outcomes are deterministic (fixed per template + outcome).

**Fail-soft Table**

| Failure | Fallback | Consequence |
|---------|----------|-------------|
| No eligible spotlight templates | Skip spotlight this tick; advance pacing timer | Battle may resolve without any player interaction (chronicle-only) |
| Player has no threads to either army | No spotlights spawned; battle resolves silently | Player sees aftermath via map changes + chronicle |
| Battle exceeds max duration | Force resolution based on current momentum | Prevents infinite battles; stalemate if momentum ≈ 0 |
| Spotlight references destroyed entity | Skip that spotlight, select next eligible | Log warning trace |
| Both armies destroyed simultaneously | Mutual destruction resolution | Both armies removed; aftermath applies to both factions |

---

## Phase 4: Siege Resolution

### System: Siege Pacing

Sieges use the **same battle node system** as field battles, with `battleType: 'siege'` and a different pacing profile. The key difference: sieges are slow, then accelerate. The siege node at a hex is visible to the region — agents and armies can converge on it through normal graph traversal and decision-making.

**Pacing acceleration curve:**

```
spotlightInterval(tick) = max(1, SIEGE_INITIAL_INTERVAL - floor(ticksElapsed / SIEGE_ACCELERATION_RATE))
```

Starting at `SIEGE_INITIAL_INTERVAL` ticks between spotlights, decreasing by 1 every `SIEGE_ACCELERATION_RATE` ticks. Floor of 1 = every-tick spotlights during crescendo.

| Siege Phase | Ticks In | Spotlight Interval | Tone |
|-------------|----------|-------------------|------|
| Opening | 0–3 | 4+ ticks | One atmospheric vignette. Slow dread |
| Early | 4–10 | 3 ticks | Probing attacks, diplomatic feelers |
| Middle | 11–20 | 2 ticks | Sally attempts, supply shortages, disease |
| Crescendo | 21+ | 1 tick | Final assault, wall breach, last stand |

### System: Siege as Regional Encounter Generator

While a siege is active, it generates encounters for **entities not directly participating in the battle**. The siege's existence creates encounter opportunities in the region:

| Generated Encounter | Who Receives It | Trigger |
|--------------------|-----------------|---------|
| `siege_call_for_aid` | Allied factions with military capability within range | Defender's faction broadcasts need |
| `siege_join_attackers` | Attacker-allied factions with army in range | Opportunity to pile on |
| `siege_smuggle_supplies` | Shadow-capable agents near the siege hex | Blockade running — extends defender endurance |
| `siege_negotiate_terms` | Heart-capable agents or faction diplomats | Diplomatic resolution attempt |
| `siege_relief_march` | Allied army (if one exists and is not engaged) | March to break the siege |
| `siege_sabotage` | Shadow-capable agents with thread to either side | Sabotage siege equipment or defenses |

These encounters fire for **entities outside the siege** — they are how the wider world responds to and gets pulled into the conflict. A siege becomes a gravity well: the longer it runs, the more actors get involved, the more encounters it spawns.

**Constants Table — Siege**

| Constant | Default | Range | Purpose |
|----------|---------|-------|---------|
| `SIEGE_INITIAL_INTERVAL` | 5 ticks | 3–8 | Ticks between spotlights at siege start |
| `SIEGE_ACCELERATION_RATE` | 6 ticks | 4–10 | How many ticks before interval decreases by 1 |
| `SIEGE_MAX_DURATION` | 40 ticks | 20–60 | Maximum siege length before forced resolution |
| `SIEGE_RESOLUTION_THRESHOLD` | 12 | 8–16 | Higher than field battle — sieges are harder to decide |
| `SIEGE_DEFENDER_MOMENTUM_BONUS` | 2 | 1–4 | Defenders start with positive momentum (walls help) |
| `SIEGE_STARVATION_TICK` | 15 | 10–25 | Tick at which starvation encounter fires (if not resupplied) |
| `SIEGE_REGIONAL_ENCOUNTER_RANGE` | 5 hexes | 3–8 | How far the siege broadcasts encounters |
| `SIEGE_COMBAT_ATTRITION_ATTACKER` | 1.0/tick | — | Attacker Quintessence loss (lower than field — waiting) |
| `SIEGE_COMBAT_ATTRITION_DEFENDER` | 0.5/tick | — | Defender Quintessence loss (even lower — behind walls) |

**Siege-Specific Spotlight Templates:**

| Template | Siege Phase | Description |
|----------|------------|-------------|
| `siege_opens` | Opening | Atmospheric vignette — encirclement, foreboding. No player choice, just prose |
| `siege_sally_forth` | Middle | Defenders attempt breakout. Risk sortie to damage enemy supply? |
| `siege_negotiate_terms` | Middle | Attacker offers terms. Heart-reach resolution. Could end siege peacefully |
| `siege_starvation` | Middle-Crescendo | Settlement starving. Prosperity tanks. Life intervention could alleviate |
| `siege_breach` | Crescendo | Walls breached. Shifts to urban combat. Massive turning point |
| `siege_final_assault` | Crescendo | All-or-nothing attack. Highest stakes spotlight |
| `siege_relief_arrives` | Any (external) | Allied army reaches siege. Changes entire dynamic |

**Tracing — `siege`**

```typescript
interface SiegeTrace {
  category: 'siege';
  tick: number;
  siegeEncounterId: string;
  event: 'established' | 'spotlight' | 'regional_encounter_spawned' | 'relief_arrived' | 'resolved';
  phase: 'opening' | 'early' | 'middle' | 'crescendo';
  momentum: number;
  defenderProsperity?: number;
  ticksElapsed: number;
}
```

**PRNG callouts:** Siege spotlight selection uses seeded PRNG. Regional encounter eligibility is deterministic (range + capability check). Starvation timing is deterministic (constant tick threshold).

**Fail-soft Table**

| Failure | Fallback | Consequence |
|---------|----------|-------------|
| Siege exceeds max duration | Force resolution — stalemate. Attacker withdraws, both armies damaged | Prevents infinite sieges |
| Defender settlement has no prosperity data | Treat as prosperity 0 (already destitute) | Starvation fires immediately |
| Relief army arrives after siege resolved | Army arrives at settlement normally (no battle) | Missed the fight — annoying but not broken |
| Regional encounter range finds no eligible actors | No regional encounters generated this tick | Siege remains a two-party event |

---

## Phase 5: Destruction & Aftermath

### System: Scaled Destruction

Battle resolution applies destruction **scaled by outcome severity**. The outcome is derived from final momentum magnitude and the losing army's remaining Quintessence.

```typescript
export type DestructionSeverity = 'minor' | 'major' | 'total';

function calculateDestructionSeverity(
  finalMomentum: number,
  loserQuintessencePercent: number
): DestructionSeverity {
  const magnitude = Math.abs(finalMomentum);
  if (magnitude >= TOTAL_DESTRUCTION_THRESHOLD && loserQuintessencePercent < 0.15) return 'total';
  if (magnitude >= MAJOR_DESTRUCTION_THRESHOLD) return 'major';
  return 'minor';
}
```

**Destruction Effects by Severity:**

| Severity | Sphere Effect | Graph Mutations | Prosperity | Settlement |
|----------|--------------|-----------------|------------|------------|
| Minor | Victor's sphere pressure floods area (standard) | Trade routes flagged `threatened: true` | -20% | No tier change |
| Major | Victor's sphere pressure at 2x magnitude | 1–2 sublocations destroyed. Trade routes severed | -50% | Downgrade one tier (city→town, town→hamlet) |
| Total | Victor's sphere pressure at 3x magnitude. Defender's spheres eroded to minimum | All sublocations destroyed. All trade routes severed. Faction presence removed | Set to 0 | Becomes ruins (new location subtype) |

### System: Aftermath Consequences

Destruction ripples outward:

- **Refugees:** Displaced population generates `refugee` encounter at neighboring settlements. Refugees shift receiving settlement's sphere alignment (they carry their culture), increase population pressure, and may trigger unrest
- **Trade disruption:** Severed trade routes tank prosperity at connected settlements (existing `phaseTradeRouteDecay` handles this)
- **Ruins:** Totally destroyed settlements become `ruins` location subtype — explorable, potential artifact recovery site, Entropy sphere concentration. Can be resettled later (M3 economic action)
- **Power vacuum:** Destroyed faction presence creates uncontested hex control opportunities for other factions and for the player's control effects
- **Commander fate:** Determined by severity + PRNG:
  - Minor defeat: Commander retreats with army remnants (army disbands, commander returns to faction)
  - Major defeat: Commander captured (50%) or escapes wounded (50%). Captured = removed from play for N ticks
  - Total defeat: Commander killed (30%) or captured (70%). Killed = permanent loss

**Constants Table — Destruction**

| Constant | Default | Purpose |
|----------|---------|---------|
| `TOTAL_DESTRUCTION_THRESHOLD` | 10 | Momentum magnitude for total destruction |
| `MAJOR_DESTRUCTION_THRESHOLD` | 6 | Momentum magnitude for major destruction |
| `SPHERE_PRESSURE_MINOR_MULTIPLIER` | 1.0 | Normal sphere pressure on minor defeat |
| `SPHERE_PRESSURE_MAJOR_MULTIPLIER` | 2.0 | Double sphere pressure on major defeat |
| `SPHERE_PRESSURE_TOTAL_MULTIPLIER` | 3.0 | Triple sphere pressure on total defeat |
| `PROSPERITY_LOSS_MINOR` | 0.20 | Prosperity reduction on minor defeat |
| `PROSPERITY_LOSS_MAJOR` | 0.50 | Prosperity reduction on major defeat |
| `COMMANDER_CAPTURE_DURATION` | 10 ticks | How long a captured commander is out of play |
| `COMMANDER_DEATH_CHANCE_TOTAL` | 0.30 | Probability of commander death on total defeat |
| `COMMANDER_DEATH_CHANCE_MAJOR` | 0.00 | Commanders don't die in major defeats, only total |
| `REFUGEE_GENERATION_MAJOR` | 1 encounter | Refugee encounters at neighbors on major defeat |
| `REFUGEE_GENERATION_TOTAL` | 3 encounters | More refugees on total destruction |

**Tracing — `destruction`**

```typescript
interface DestructionTrace {
  category: 'destruction';
  tick: number;
  battleEncounterId: string;
  severity: DestructionSeverity;
  settlementId?: string;
  sublocationsDestroyed: string[];
  tradeRoutesSevered: string[];
  prosperityBefore: number;
  prosperityAfter: number;
  commanderFate: 'retreated' | 'captured' | 'killed';
  spherePressureApplied: Partial<Record<SphereName, number>>;
  refugeeEncountersGenerated: number;
}
```

**PRNG callouts:** Commander fate (capture vs death) uses seeded PRNG. Sublocation destruction selection (which sublocations are destroyed on major defeat) uses seeded PRNG. Refugee settlement selection is deterministic (nearest non-ruined settlements).

**Fail-soft Table**

| Failure | Fallback | Consequence |
|---------|----------|-------------|
| Settlement has no sublocations to destroy | Skip sublocation destruction; apply prosperity loss only | Minor settlements have less to lose |
| No neighboring settlements for refugees | Skip refugee generation | Isolated settlement — refugees just disappear (narratively: they scatter to the wilderness) |
| Commander already dead/missing | Skip commander fate | Army dissolves without commander resolution |
| Prosperity already at 0 | No further reduction | Can't go below zero |

---

## Phase 6: Visibility & Intelligence

### System: Thread-Based War Intelligence

The player's visibility into wars is **directly proportional to their thread network**. No separate intelligence system — threads ARE the spy network.

| Thread Type | What Player Sees |
|-------------|-----------------|
| Thread to agent in mobilizing faction | Army mobilization notification: "[Agent] reports that [Army] has been mobilized in [City], led by [Commander]" |
| Thread to army commander | All army encounters (attrition thresholds, battle spotlights from commander POV) |
| Thread to faction (high influence) | Faction-level strategic view — army morale, objective, supply state |
| Thread to artifact in battle | Artifact-POV spotlights during battle |
| Thread to settlement under siege | Defender's perspective — starvation, breach, morale |
| No threads to any participant | Nothing until aftermath changes map. One-line chronicle: "[Army] sacked [Settlement]" |

This means a Shadow ascendant who has invested threads across many factions has an intelligence advantage — they see mobilizations and can prepare. A Force ascendant who only invested in their own warlord hits harder but gets surprised.

**No new tracing needed** — encounter visibility traces already exist.

---

## Phase 7: UI & Player Visibility

### Army Display on HexMapV2

- Army entities rendered as **faction-colored sprites** on the hex map at all zoom tiers
- Size indicator: warband (small), regiment (medium), host (large)
- Commander portrait badge attached to army sprite
- March route rendered as dashed line from current position to objective hex
- Siege indicator: encirclement ring around besieged settlement

### Battle Modal

A **battle variant of the encounter modal** with additional layers:

1. **Background prose panel** — composited battle prose (base + faction + agent + location + intervention) updated each tick
2. **Spotlight encounter** — embedded within the battle context, using existing encounter UI and intervention choices
3. **Aftermath panel** — destruction prose and consequence summary after resolution

### Notifications

Army events use the existing tiered notification system:

| Event | Notification Tier | Condition |
|-------|------------------|-----------|
| Army mobilization (own faction) | Tier 1 (modal) | Thread to commander or faction |
| Army mobilization (foreign) | Tier 2 (toast) | Thread to agent in that faction |
| Battle spotlight | Tier 1 (modal) | Thread to any participant |
| Army attrition threshold | Tier 2 (toast) | Thread to commander |
| Siege established | Tier 1 (modal) | Thread to any participant or settlement |
| Battle aftermath | Tier 1 (modal) | Thread to any participant |
| No-thread aftermath | Tier 3 (chronicle) | No threads |

### Debug Panel

New "Armies" tab in DebugPanel:

- List of active armies with state (objective, Quintessence %, commander, faction)
- Active battles/sieges with momentum, pacing phase, spotlight history
- Destruction log from current game

---

## Wiring

### Orchestrator

**Battle node processing** is handled within the **existing encounter phase** (`phaseEncounterProgressionV2`). No new phase needed. The encounter phase is extended to:

1. Check for active battle nodes (graph query: all nodes with `BattleState`) each tick
2. Update their state (prose, momentum, Quintessence attrition)
3. Check for newly arrived entities at the battle hex and add `participates_in` edges
4. Spawn spotlight child encounters when pacing allows
5. Apply spotlight outcomes to battle node momentum
6. Resolve battles when momentum crosses threshold — remove battle node, apply aftermath

Army movement is handled by the **existing movement phase** (`phaseMovement`). Armies are actors with `MovementState`.

Army attrition (Quintessence degradation during marching) runs as a **new sub-step within the movement phase** — after movement resolution, before encounter detection.

Faction ambition evaluation runs within **phaseAgentDecision** (extended to handle faction-level decision-making) or as a new lightweight phase at position 2.38 (after movement, before encounter).

**Battle node creation** happens in the **colocation detection phase** (`phaseColocationDetection`) — when two hostile armies are detected at the same hex, a battle node is created and connected.

### UI Rendering

| Component | What It Displays |
|-----------|-----------------|
| `HexMapV2` | Army sprites, march routes, siege indicators |
| `TieredEncounterModal` (extended) | Battle variant with background prose + aftermath panel |
| `NarrativeLog` | Army notifications (mobilization, attrition, aftermath) |
| `DebugPanel` (new tab) | Active armies, battles, sieges, destruction log |

### GameState Flow

| Field Written | Written By | Read By |
|---------------|-----------|---------|
| Army `actor` nodes | Army spawn encounter | HexMapV2, DebugPanel, encounter system, agent decision phase |
| `ArmyState` properties | Attrition phase, battle resolution | Movement phase, encounter eligibility, HexMapV2 |
| Battle nodes (`BattleState`) | Colocation detection (creation), encounter phase (updates) | Encounter phase, agent decision phase, HexMapV2, DebugPanel |
| `participates_in` edges | Colocation detection, battle convergence | Battle resolution (who's involved), encounter eligibility |
| Settlement destruction mutations | Aftermath resolution | Prosperity phase, HexMapV2, trade route decay |
| Refugee encounters | Aftermath resolution | Encounter phase (next tick) |

### Traces

| Category | Emitted From |
|----------|-------------|
| `faction_ambition` | Faction ambition evaluation |
| `army_lifecycle` | Army spawn/disband/destroy encounters |
| `army_attrition` | Movement phase (Quintessence sub-step) |
| `battle` | Encounter phase (persistent encounter tick) |
| `siege` | Encounter phase (persistent encounter tick) |
| `destruction` | Battle/siege resolution |

### Debug Visibility

New "Armies" tab in DebugPanel showing all active armies, battles, sieges. Accessible from existing DebugPanel toggle.

### Prose Pipeline

- **Composited battle prose** requires a new prose resolver type that layers multiple content sources. This extends the existing `enrichProse()` pipeline
- **Spotlight encounter prose** uses existing encounter prose generation
- **Aftermath prose** uses existing encounter prose generation with destruction-specific templates
- **Army notification prose** uses existing encounter notification format

### Player Controls

No new player controls. The player interacts with armies through:
- Existing action system (bless, curse, influence via action templates)
- Existing encounter intervention system (spotlight encounters → Pull the threads / Watch from afar)
- Existing thread system (more threads = more visibility)

### Prerequisite Health

| Dependency | Status | Verification |
|------------|--------|-------------|
| Encounter system (multi-step) | ✅ | `npm test` — encounter progression tests |
| Divine intervention (essence commitment) | ✅ | `npm test` — intervention tests |
| Sphere pressure resolution | ✅ | `npm test` — sphere pressure tests |
| Pathfinding | ✅ | `npm test` — movement contract tests |
| Prosperity system | ✅ | `npm test` — prosperity phase tests |
| Faction system | ✅ | `npm test` — faction tests |
| Quintessence sphere (TB-075) | ⚠️ Designed, not yet built | **Blocker for army attrition** — without Quintessence, attrition model needs interim vitality score |

---

## Success Criteria

1. A faction with sufficient Iron + Gold capability raises an army through the encounter system within 30 ticks of game start (on maps with military factions)
2. Army movement is visible on HexMapV2 with faction coloring and march route
3. When two armies meet, a persistent battle encounter fires with at least one spotlight if the player has any thread to a participant
4. Siege pacing demonstrates acceleration — early spotlights are spaced further apart than crescendo spotlights
5. Battle aftermath applies scaled destruction — verifiable via DebugPanel destruction log
6. Player can intervene in battle spotlights using existing essence system — intervention visibly shifts battle momentum
7. Losing a war causes visible sphere pressure shift on affected hexes and prosperity drop
8. Army Quintessence degradation spawns threshold encounters (verifiable in CLI: `tick 30` + `encounters` + `agents`)
9. Thread-based visibility works — player with no threads to either side sees only chronicle entry, player with commander thread sees full spotlight sequence
10. No new orchestrator phase added — battles are graph nodes processed within existing encounter phase
11. Agents converge on battles emergently — a Shadow agent near a battle hex should pathfind toward it if their target is a participant (verifiable in CLI: `agents` + `agent <name>`)
12. IPK keywords in battle prose correctly signal size advantage, fortification, tactical state, and divine intervention

---

## NFP Compliance Summary

| # | Priority | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Tunability | ✅ PASS | 40+ named constants across all systems. Army speed, attrition rates, destruction thresholds, spotlight intervals — all tunable without code changes |
| 2 | Inspectability | ✅ PASS | 6 trace categories (faction_ambition, army_lifecycle, army_attrition, battle, siege, destruction). DebugPanel "Armies" tab for live inspection |
| 3 | Determinism | ✅ PASS | All PRNG usage identified and uses seeded RNG. Attrition is deterministic. Spotlight selection seeded. Commander fate seeded |
| 4 | Fail-soft | ✅ PASS | Every system has fail-soft table. Missing data → safe defaults. Battles cap at max duration. Quintessence clamps to 0. No crash paths |
| 5 | Narrative > mechanical | ✅ PASS | Core design principle. Battles exist for stories, not strategy. Spotlight depth = surprise + drama. Loss should be narratively compelling |
| 6 | Additive | ✅ PASS | No existing types modified. `actor` nodes gain optional `armyState`. New `battle` node category with `BattleState`. New edge types: `commanded_by`, `participates_in`. Encounter phase extended, not rewritten |
| 7 | Performance | ✅ PASS with note | Armies add actors to the graph (1 per faction max at launch). Persistent encounters add per-tick processing for active battles. Profile if battle count exceeds 3 simultaneous |
