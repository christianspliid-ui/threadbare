# Ambition-Driven Strategic Actions

> **Date:** 2026-04-09
> **Status:** Approved design
> **Scope:** Add a proactive world-shaping behavior layer beside encounters, driven by the existing ambition system and scalable across many actor types, reaches, institutions, and world states.
> **Supersedes:** The narrow `phaseAgentInitiative` concept in `Docs/plans/2026-03-31-social-systems-expansion-design.md` Expansion B.

---

## Problem Statement

The current simulation makes agents legible mainly through encounters, movement, and relationship drift. That produces useful moment-to-moment activity, but it does **not** reliably produce the higher-level behavior players expect from an intelligent world. A merchant with a guild-founding ambition should not merely drift between trade-flavored encounters; they should also take deliberate steps that reshape the graph:

- gather commercial intelligence
- secure allies or political cover
- establish routes
- build storage or offices
- found or capture institutions
- maintain control over the resulting network

The old CRUD action-template system was aimed at exactly this problem, but its autonomous planner path was too blunt and too detached from ambition, target specificity, and modern inspectability. The game now has a stronger top-level planner in the ambition system, so the missing piece is no longer "give agents goals." The missing piece is:

**let ambitions drive proactive world-changing behavior as a first-class execution family, while encounters remain the dramatic scene/friction layer around that work.**

---

## Design Goals

1. Agents should feel strategically legible at a glance.
2. Ambitions should unlock concrete proactive steps, not only scoring bias.
3. Encounters should remain important, but not be the only way agents express intent.
4. Proactive actions must touch real game systems: factions, locations, trade, influence, control, institutions, construction, knowledge, and terrain.
5. The system must scale across many actor archetypes and reaches without requiring bespoke planner code for each one.
6. The player and developer must be able to inspect why an action was chosen, what alternatives existed, and how it advanced an ambition.

### Non-Goals

- Replacing the encounter system
- Reintroducing the deprecated standalone `phaseIdleSelection`
- Turning the world into a spreadsheet of invisible background maintenance
- Letting actors spam generic CRUD verbs without ambition context

---

## Core Concept

The ambition system remains the planner spine. Each active ambition can expose one or more **strategic steps**. At each decision point, the agent evaluates two candidate families together:

1. **Encounter candidates** — authored scenes, opportunities, risks, and reactive drama
2. **Strategic action candidates** — proactive graph-changing steps that directly advance an ambition

The chooser ranks both families on one inspectable board, then selects the best next step. This keeps one coherent planner surface instead of two invisible competing planners.

### Execution Families

| Family | Purpose | Typical Result |
|---|---|---|
| `encounter` | Experience a scene, challenge, bargain, ritual, crisis, or opportunity | Prose-forward outcomes, rewards, relationships, complications |
| `strategic_action` | Deliberately reshape the graph in service of an ambition | New nodes/edges, changed control, new routes, new buildings, resource shifts |
| `strategic_project` | Multi-tick proactive work too large for one step | In-progress build/network/reform/research effort with progress and opposition |
| `catalyst_action` | Proactive step that primarily seeds future scenes | New encounter seeds, rivals, witnesses, obligations, crises |
| `control_stance` | Ongoing effort to maintain influence or hold a position | Sustained graph state with upkeep, contestation, and drift |

---

## Why This Supersedes Legacy CRUD

The legacy CRUD model solved the right problem but at the wrong layer.

### What Was Right

- CREATE / CONTROL / CHANGE / GATHER INFO / DESTROY are the right high-level verbs for world-shaping behavior.
- Those verbs are a good abstraction for graph mutation.
- They are broad enough to cover merchants, rulers, scholars, zealots, spies, builders, and warlords.

### What Was Missing

- ambition-specific filtering
- rich target selection beyond "current location"
- inspectable priority reasoning
- integration with the encounter chooser
- support for long-running control and project states
- enough world-system hooks to make actions legible as campaigns instead of isolated verbs

### Revised Position

Keep the CRUD/CONTROL verbs, but use them as the **execution language under ambitions**, not as a separate free-floating planner.

---

## Strategic Verb Layer

Every proactive step belongs to one of five world-shaping verbs:

| Verb | Meaning | Example outcomes |
|---|---|---|
| `gather_info` | Reveal the state of the world so better actions become possible | survey market, identify a rival, scout a route, study doctrine |
| `create` | Add a new node, edge, institution, route, or asset to the graph | build warehouse, found guild chapter, create shrine, establish route |
| `change` | Reconfigure an existing graph state | reform charter, improve defenses, deepen alliance, redirect trade |
| `control` | Sustain or claim an ongoing position | hold council influence, maintain monopoly, govern district, keep shrine loyal |
| `destroy` | Remove, sabotage, dissolve, or sever a structure | burn route, discredit faction chapter, suppress archive, ruin a workshop |

These verbs remain broad and reusable, but the actual action list is generated from ambition + world state, not from a flat catalog.

---

## Reach-Scaled Behavior Matrix

The system must scale across many actor types and reaches. The answer is not one bespoke behavior tree per NPC class. The answer is a compositional matrix:

- ambition says **why**
- role/archetype says **what kinds of institutions and relationships matter**
- dominant reaches say **how this actor tends to pursue the goal**
- world state says **what is currently possible**

### Reach Tendencies for Strategic Actions

| Reach | Strategic tendencies |
|---|---|
| `iron` | conquest, coercion, patrols, garrisons, armed escort, suppression, martial prestige |
| `heart` | alliances, mentorship, celebrations, recruitment, care networks, cohesion, legitimacy |
| `gold` | trade, sponsorship, financing, markets, charters, logistics, wealth leverage |
| `veil` | secrecy, occult inquiry, forbidden study, hidden networks, infiltration, revelation control |
| `stone` | building, fortification, settlement growth, storage, roads, civil order, durable presence |
| `eye` | scouting, surveying, auditing, research, discovery, diagnosis, intelligence-gathering |
| `shadow` | sabotage, blackmail, smuggling, espionage, quiet influence, criminal enterprise |
| `star` | doctrine, ritual, ceremony, inspiration, legitimacy, sacred institutions, cosmic alignment |

### Broad Behavior Families

| Family | Typical ambitions | Likely verbs | Typical outputs |
|---|---|---|---|
| `merchant-expansion` | found guild, dominate trade, enrich house | gather_info, create, change, control | trade routes, warehouses, deals, sponsorships, chapters |
| `builder-civic` | improve settlement, leave legacy, fortify domain | create, change, control | workshops, shrines, walls, roads, civic buildings |
| `scholar-seeker` | reveal truth, preserve lore, master hidden knowledge | gather_info, create, control, destroy | archives, treatises, expeditions, restricted access, research circles |
| `zealot-mission` | spread doctrine, sanctify land, cleanse corruption | gather_info, create, change, control, destroy | shrines, conversions, rites, sacred routes, desecrations |
| `court-political` | rule well, seize office, stabilize realm, dominate council | gather_info, change, control, destroy | alliances, decrees, offices, patronage networks, purges |
| `underworld-network` | control vice, extort rivals, move contraband | gather_info, create, control, destroy | smuggling routes, fronts, informants, sabotage, tribute |
| `warlord-expansion` | conquer, secure borders, build war machine | gather_info, create, change, control, destroy | garrisons, patrol routes, mercenary contracts, claims |
| `caretaker-steward` | protect community, heal land, preserve order | gather_info, create, change, control | clinics, grain stores, rites of care, local pacts |
| `artist-crafter` | perfect a craft, build renown, found a school | gather_info, create, control | workshops, masterworks, apprenticeships, salons |
| `wanderer-explorer` | map the unknown, find a home, discover anomalies | gather_info, create, catalyst_action | routes, camps, survey notes, anomaly seeds |

This family matrix gives us scale. A merchant, scholar, zealot, and spymaster can all use the same strategic infrastructure while still producing distinct behavior.

---

## Ambition-to-Step Bridge

The critical new seam is an **ambition step generator**.

### Rule

Active ambitions no longer only contribute score bias. They also generate concrete step candidates.

### Candidate Sources

For each active ambition, generate candidates from:

1. **Template progression**
   - ambition-specific step lists or milestone ladders
2. **World blockers**
   - missing prerequisites that are preventing the ambition
3. **Opportunity pulls**
   - nearby markets, empty buildings, weak rivals, fertile wilderness, open offices
4. **Control obligations**
   - positions already claimed that need upkeep or defense
5. **Recent history**
   - unfinished project, sabotage suffered, deal offered, route discovered, follower recruited

### Example: Guild-Founding Merchant

Possible generated steps:

1. survey nearby markets
2. negotiate storage rights
3. recruit caravan master
4. establish route to nearby settlement
5. buy influence in local merchant council
6. build warehouse
7. found guild chapter
8. defend route against sabotage
9. maintain monopoly/control over district

This is the behavior arc the player should see.

---

## Candidate Model

The chooser needs a new candidate shape that can sit beside encounters without losing inspectability.

```ts
export type StrategicVerb =
  | 'gather_info'
  | 'create'
  | 'change'
  | 'control'
  | 'destroy';

export type StrategicExecutionMode =
  | 'instant_graph_op'
  | 'multi_tick_project'
  | 'seed_encounter'
  | 'claim_control'
  | 'contest_control';

export interface StrategicActionCandidate {
  id: string;
  ambitionId: string;
  family: 'strategic_action';
  verb: StrategicVerb;
  executionMode: StrategicExecutionMode;
  templateId: string;
  title: string;
  summary: string;
  targetNodeId?: string;
  targetLocationId?: string;
  targetActorId?: string;
  targetFactionId?: string;
  targetHex?: { col: number; row: number };
  reachProfile: ReachDomain[];
  projectedTicks: number;
  travelCost: number;
  resourceCost: number;
  controlUpkeep?: number;
  risk: number;
  catalystWeight: number;
  ambitionAlignment: number;
  worldImpactScore: number;
  blockerReliefScore: number;
  score: number;
  rationaleTags: string[];
}
```

### Key Point

This model preserves enough information to answer:

- why this candidate existed
- what ambition it served
- what systems it would touch
- why it beat encounters this tick

---

## Unified Chooser

The live decision system should stay singular and inspectable.

### Design Decision

Do **not** reintroduce a separate autonomous planner like the old `phaseIdleSelection`.

### Revised Decision Flow

1. build encounter candidates
2. build strategic action candidates
3. normalize them into one decision board
4. score them with family-aware heuristics
5. choose top-ranked action
6. execute as:
   - start encounter
   - queue movement to encounter
   - perform instant strategic action
   - start strategic project
   - seed/trigger encounter
   - claim or contest control

### Family-Aware Scoring Factors

| Factor | Encounter | Strategic action |
|---|---|---|
| ambition alignment | medium-high | very high |
| immediate drama/opportunity | high | medium |
| blocker relief | medium | very high |
| direct graph change | low-medium | very high |
| travel requirement | medium | medium |
| familiarity penalty | high | medium |
| control obligation pressure | low | high |
| catalyst value | medium | high |
| resource affordability | medium | high |
| role/archetype fit | medium | high |

This makes strategic actions more likely when the agent needs to make structural progress, while encounters remain appealing for vivid opportunity, risk, or reaction.

---

## Control as a First-Class Mode

Many ambitions are not about a one-off mutation. They are about holding a position.

Examples:

- keep the council on your side
- maintain a trade monopoly
- keep a shrine consecrated
- hold a smuggling route
- govern a district
- retain military control over a gate

These should be represented as **control stances** with:

- owner actor/faction
- target node or edge
- upkeep cadence
- contest difficulty
- decay if ignored
- visible consequences while active

### Data Shape

Prefer existing graph primitives:

- store control state on nodes/edges where possible
- use `controls`, `trades_with`, `constructed_by`, `member_of`, `relates_to`, and typed properties before inventing new edge types
- represent the current active effort as an `event` node with status and progress rather than inventing a new node category for v1

This keeps the first implementation additive and schema-light while still supporting long-running strategic work.

---

## Project Lifecycle

Some strategic actions are instant; others need sustained effort.

### Lifecycle States

1. `proposed`
2. `in_progress`
3. `contested`
4. `completed`
5. `failed`
6. `abandoned`

### Execution Model

- **instant graph op**
  - direct mutation now
- **multi-tick project**
  - progress over time, may spawn encounters or control checks
- **seed encounter**
  - the action itself mostly creates future dramatic content
- **claim control**
  - starts an upkeep-bearing strategic position
- **contest control**
  - tries to seize or break an existing position

### Design Rule

At least some strategic actions in every major behavior family should produce or attract follow-up encounters. This prevents the proactive layer from becoming silent spreadsheet churn.

---

## Strategic Actions as Encounter Generators

To keep the world lively, many proactive steps should be **catalysts** rather than silent resolutions.

### Examples

| Strategic step | Typical follow-up encounter |
|---|---|
| build warehouse | labor dispute, sabotage, inspection, guild complaint |
| found guild chapter | charter hearing, rival smear campaign, initiation rite |
| establish route | bandit ambush, toll demand, route dispute, caravan rescue |
| consecrate shrine | pilgrimage, blasphemy, miracle, rival cult response |
| start spy network | blackmail, exposure risk, double agent, stolen ledger |
| write treatise | debate, censorship, plagiarism, visionary revelation |

This keeps strategic action and encounter systems mutually reinforcing.

---

## Broad Ambition Coverage

The system must scale beyond a few merchant examples.

### Coverage Strategy

Each ambition template should optionally declare:

- `behaviorFamily`
- `preferredStrategicVerbs`
- `preferredTargets`
- `controlAspirations`
- `catalystBias`

This keeps the planner data-driven without baking every ambition into code.

```ts
export interface AmbitionStrategicProfile {
  behaviorFamily:
    | 'merchant-expansion'
    | 'builder-civic'
    | 'scholar-seeker'
    | 'zealot-mission'
    | 'court-political'
    | 'underworld-network'
    | 'warlord-expansion'
    | 'caretaker-steward'
    | 'artist-crafter'
    | 'wanderer-explorer';
  preferredStrategicVerbs: StrategicVerb[];
  preferredTargets: Array<'location' | 'sublocation' | 'actor' | 'faction' | 'edge' | 'hex'>;
  controlAspirations: string[];
  catalystBias: number;
}
```

### First-Wave Behavior Packs

The first proving slice should support at least:

- merchant / trader
- ruler / steward
- scholar / occult seeker
- zealot / temple agent
- spy / criminal broker
- builder / artisan

That is enough breadth to prove the system scales across reaches and institution types.

---

## UI and Visibility Phase

No design is complete until the player can see it.

### Player-Facing Surfaces

#### 1. Thread / agent detail

Show:

- current ambition
- current strategic step
- execution family: encounter vs strategic action
- affected system tags: faction, route, building, control, doctrine, knowledge
- recent completed strategic steps
- top alternative steps considered

#### 2. Hex map presence

Show:

- small action-type icon while a strategic project is in progress
- distinct control-state signifier when an actor is actively holding something
- optional world pulse callouts for newly created buildings, routes, or institutions

#### 3. Character sheet / action history

The player should be able to read a short history like:

- Surveyed markets in Thornwall
- Negotiated storage rights at the inn
- Built a warehouse in Thornwall
- Established a route to Green-shroud
- Founded the Amber Ledger chapter
- Defended the route against bandits

This is the legibility target.

#### 4. Developer/debug surfaces

Add:

- strategic candidate board in thread detail / debug panel
- family split: encounter vs strategic
- ambition-step rationale
- top-10 dominance summary for strategic templates just like encounter dominance
- control obligations and overdue upkeep summary

---

## Telemetry and Tracing

Strategic actions must be inspectable at the same level as encounter decisions.

### Trace Interfaces

```ts
export interface StrategicCandidateBoardTrace {
  tick: number;
  actorId: string;
  ambitionIds: string[];
  encounterCandidateCount: number;
  strategicCandidateCount: number;
  topEncounterIds: string[];
  topStrategicIds: string[];
  chosenFamily: 'encounter' | 'strategic_action' | 'idle';
  chosenId?: string;
}

export interface StrategicActionStartedTrace {
  tick: number;
  actorId: string;
  ambitionId: string;
  templateId: string;
  verb: StrategicVerb;
  executionMode: StrategicExecutionMode;
  targetNodeId?: string;
  targetLocationId?: string;
  projectedTicks: number;
  rationaleTags: string[];
}

export interface StrategicProjectProgressTrace {
  tick: number;
  actorId: string;
  projectId: string;
  progress: number;
  state: 'in_progress' | 'contested' | 'completed' | 'failed' | 'abandoned';
  tensionTags: string[];
}

export interface StrategicWorldChangeTrace {
  tick: number;
  actorId: string;
  ambitionId: string;
  templateId: string;
  graphEffects: string[];
  createdNodeIds: string[];
  createdEdgeIds: string[];
  seededEncounterIds: string[];
}
```

### Required Summary Views

- strategic actions started/completed per behavior family
- new buildings/routes/institutions created
- control positions claimed/lost
- top ambition-step patterns by actor archetype
- top catalyst actions that led to encounters

---

## Constants Table

All tuning must be named constants.

| Constant | Default | Purpose |
|---|---:|---|
| `STRATEGIC_ACTION_MIN_SCORE` | `0.18` | Minimum normalized score required for a proactive action to beat idle |
| `STRATEGIC_ACTION_TOP_N` | `8` | Max strategic candidates kept after local scoring |
| `STRATEGIC_ACTION_COOLDOWN_TICKS` | `4` | Short anti-spam cooldown after completing the same strategic template |
| `STRATEGIC_PROJECT_DEFAULT_TICKS` | `5` | Default duration for a multi-tick project |
| `STRATEGIC_PROJECT_MAX_TICKS` | `16` | Hard cap for first-wave project duration |
| `STRATEGIC_CONTROL_DECAY_TICKS` | `12` | Ticks before ignored control begins degrading |
| `STRATEGIC_CONTROL_UPKEEP_INTERVAL` | `3` | Cadence for checking upkeep pressure |
| `STRATEGIC_CATALYST_BASE_CHANCE` | `0.35` | Base chance a catalyst-capable strategic action seeds a follow-up encounter |
| `STRATEGIC_BLOCKER_RELIEF_WEIGHT` | `1.4` | Weight for steps that unblock an ambition milestone |
| `STRATEGIC_WORLD_IMPACT_WEIGHT` | `1.2` | Weight for steps that materially change graph structure |
| `STRATEGIC_ROLE_FIT_WEIGHT` | `1.1` | Weight for actor-role alignment |
| `STRATEGIC_CONTROL_OBLIGATION_WEIGHT` | `1.3` | Pressure to maintain claimed positions |
| `STRATEGIC_RESOURCE_AFFORDABILITY_WEIGHT` | `0.9` | Penalty/bonus for realistic affordability |
| `STRATEGIC_VARIETY_PENALTY_WEIGHT` | `0.8` | Damp repeated template spam |
| `STRATEGIC_TRAVEL_PENALTY_WEIGHT` | `0.6` | Penalize distant proactive steps when local progress exists |
| `STRATEGIC_FAMILY_SWITCH_BONUS` | `0.15` | Small bonus when shifting from repeated encounters into meaningful proactive behavior |

These are starting values only; all are expected to move during tuning.

---

## PRNG Callouts

Determinism must be preserved.

Use seeded PRNG only for:

- tie-breaking between similarly scored strategic candidates
- selection among equivalent valid targets
- whether a catalyst action seeds one of several follow-up encounter variants
- controlled stochastic variation in project complications

Do **not** use PRNG for:

- whether a valid strategic candidate exists
- whether ambition gates apply
- whether a direct graph mutation succeeds when prerequisites are already satisfied

---

## Fail-Soft Table

| Failure case | Fallback behavior |
|---|---|
| ambition has no strategic profile | encounter-only planning continues |
| no valid targets for a strategic template | drop that candidate silently and trace the rejection |
| graph mutation target vanished before execution | abandon the strategic action and replan next tick |
| project target becomes invalid mid-progress | mark project `failed` or `abandoned`, emit trace, no crash |
| control state cannot be maintained due to missing owner/target | degrade and clear control gracefully |
| catalyst follow-up encounter cannot be seeded | strategic action still resolves; trace missing follow-up |
| resource affordability is missing or malformed | treat as unaffordable, not as exception |
| strategic generator emits zero candidates | encounter chooser continues as normal |
| both encounter and strategic pools are empty | existing idle / forced-travel logic remains authoritative |

---

## Wiring Section

This design adds a new behavior family, so the wiring must be explicit.

### Engine

| Module | Responsibility |
|---|---|
| `src/engine/phaseAgentDecision.ts` | Remains the unified chooser; now merges encounter and strategic candidates |
| `src/engine/strategicActionCandidates.ts` | Generate ambition-driven strategic candidates |
| `src/engine/strategicActionScoring.ts` | Family-aware strategic scoring and normalization |
| `src/engine/strategicActionLifecycle.ts` | Start/advance/resolve strategic actions and projects |
| `src/engine/strategicGraphOps.ts` | Safe graph mutation helpers for create/change/control/destroy outcomes |
| `src/engine/ambitionTick.ts` | Supplies ambition stage/blocker context to the strategic generator |
| `src/engine/factionAmbitions.ts` | Later: faction-level adoption of the same strategic framework |

### Types

| Module | Responsibility |
|---|---|
| `src/types/ambition.ts` | Add optional `strategicProfile` metadata |
| `src/types/trace.ts` | Add strategic candidate/project/world-change traces |
| `src/types/gameState.ts` | Add in-progress strategic project/runtime state |

### UI

| Surface | Wiring |
|---|---|
| `GameView` | Route strategic activity data to thread/detail/map surfaces |
| `ThreadsPanel` / `ThreadDetailView` | Show current strategic step, family, and top alternatives |
| `HexMapV2` activity layers | Add action-type / control-state icons for proactive projects |
| agent detail / profile | Add strategic history and current agenda progress |
| debug bridge / CLI | Expose strategic candidate boards, project states, and world-change summaries |

### Documentation + Checklist

When implementation starts, update:

- `Docs/plans/wiring-checklist.md`
- public/system reference pages if this changes live decision behavior documentation

---

## Recommended Implementation Sequence

### Phase 1: Merchant proving slice

Support:

- survey market
- negotiate storage rights
- establish trade route
- build warehouse
- found guild chapter
- maintain route / monopoly control

This slice should already touch:

- ambitions
- locations
- factions
- trade edges
- new sublocations
- catalyst encounters

### Phase 2: Scholar + zealot slices

Add:

- research / archive / treatise / occult inquiry
- consecrate / convert / shrine / doctrine / desecration

### Phase 3: Court + shadow slices

Add:

- influence, office control, favors, intrigue, blackmail, spy networks, sabotage

### Phase 4: Faction adoption

Let faction ambitions use the same strategic infrastructure at institutional scale.

---

## Why This Will Make the World Feel More Living

Because the player will stop seeing isolated repeated encounter choices and start seeing campaigns of intent.

Instead of:

- Merchant's Gambit
- Merchant's Gambit
- Merchant's Gambit
- Merchant's Gambit

the player should see:

- surveyed the market at Thornwall
- opened talks with the innkeepers
- hired an escort caravan
- established a route to Green-shroud
- built a warehouse
- defended the route against bandits
- founded the Amber Ledger chapter

That is the qualitative shift this design is for.

---

## NFP Compliance

| Priority | Status | Notes |
|---|---|---|
| Tunability | PASS | All strategic-action thresholds, cadence, control decay, catalyst rates, and weighting terms are named constants. |
| Inspectability | PASS | Unified chooser, explicit strategic candidate shape, trace interfaces, and player/debug surfaces make reasoning visible. |
| Determinism | PASS | PRNG only for tie-breaks, equivalent-target selection, and bounded catalyst variation. |
| Fail-soft | PASS | Strategic generation and project progress degrade cleanly to encounter-only or idle behavior. |
| Narrative over mechanical perfection | PASS | Strategic actions exist to make actor behavior read as coherent campaigns, not as optimal graph math. |
| Additive over destructive | PASS | Extends ambition metadata and chooser plumbing without reviving deprecated planners or replacing encounters. |
| Performance budget | PASS with note | Candidate generation must be capped and spotlight-aware. The first implementation should keep strategic top-N small and reuse existing thread/telemetry surfaces. |

---

## Summary

This design keeps the current strengths of the encounter system while finally giving ambitions a way to produce proactive, world-changing behavior.

The old CRUD model becomes useful again, but in the right place:

- ambitions decide what matters
- strategic verbs decide how the world can be changed
- encounters provide drama, friction, and consequence

That combination is what can scale to a genuinely living world.
