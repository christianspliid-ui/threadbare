# Tick Phases

> Added 2026-04-02. Source of truth: `src/engine/orchestrator.ts`.
> Purpose: show the live order of operations and the integration assumptions between phases.

## Entry Point

The simulation tick entry point is `runTick()` in `src/engine/orchestrator.ts`.

Important implementation detail:

- phases are not uniformly pure
- some return partial state
- some mutate the graph in place
- some are side-effect helpers that emit traces or notifications without returning state

Do not assume "phase function" means a pure transform.

## High-Level Order

### 1. Early world progression

- Doom
- Journey beat checks
- Unified action progress
- Thread-bind familiarity grant
- Effect tick

### 2. Encounter and agent activity

- Encounter progression
- Encounter revelations
- Encounter visibility
- Agent decision
- Agent movement
- Army movement / attrition / battle work
- Lair escalation
- Army notifications
- Colocation detection
- Colocation revelations
- NPC graduation
- Sublocation dissolution
- Dilemma detection
- Dilemma revelations
- Familiarity gain
- Interaction depth

### 3. Mid-tick world and narrative systems

- Rival actions
- Stealth
- Narrative
- Essence
- Control effects

### 4. Late economic / social / structural world updates

- Reputation decay
- Faction reputation decay
- Divine influence decay
- Trade route decay
- Prosperity
- Economic traits
- Reputation traits
- Settlement promotion
- Hex state
- Unrest
- Magical saturation
- Sphere pressure
- Sphere aggregation
- Influence tier promotion
- Gold sublocations
- Economic chronicle
- Ambition progress
- Faction ambitions
- Agent lifecycle
- Mandate
- Doom expiry

### 5. End-of-tick recomputation and cleanup

- world-version touch for UI observability
- visibility recomputation
- automatic revelation updates
- recent event merge
- tick summary trace
- notification/action cleanup
- health validation

## Load-Bearing Order Dependencies

These are easy to break during refactors.

### Encounter progression happens before decision

Agents should resolve/advance active encounters before picking new work for the tick.

### Movement happens before colocation and NPC graduation

That means post-move world position is what downstream phases observe.

### Settlement promotion happens before sublocation spawning

That allows later structural systems to react to the newly promoted settlement tier in the same tick.

### Visibility and revelation are post-phase recomputations

They are not continuously maintained during the tick. Most world mutation happens first, then player-facing visibility is recomputed near the end.

## Mutation Observability Hooks

The orchestrator currently uses `SimulationRuntime` hooks for change detection:

- `touchStructure(runtime)` after known structural mutations
- `touchWorld(runtime)` at the end of the tick

Current important examples:

- settlement tier changes can trigger structural cache invalidation
- sublocation spawn/dissolve can trigger structural cache invalidation
- general per-tick property mutation is covered by the final world touch

This is intentionally coarse, not maximally precise.

## Phase Style Variants

There are three common styles in the current engine:

### Partial-state phases

Return `Partial<GameState>` and are merged into the running state.

Examples:

- `phaseAgentDecision`
- `phaseMovement`
- `phaseProsperity`

### In-place graph/system phases

Mutate graph or runtime structures directly and may return nothing.

Examples:

- some army/faction helper phases
- helper emitters and timeline updates

### Hybrid orchestration

The orchestrator itself often performs extra graph updates around phases:

- post-phase touch calls
- visibility/revelation recompute
- timeline/cleanup work

## Adding A New Phase

Before inserting a phase, decide:

1. What data must already be up to date when it runs?
2. Does it read pre-move or post-move world state?
3. Does it mutate graph structure or only properties?
4. Does it need `touchStructure()` or only the end-of-tick `touchWorld()`?
5. Does it emit `TickEvent`s, traces, both, or neither?
6. Should newly created entities act immediately, or only next tick?

If those answers are unclear, phase ordering bugs tend to appear as "stale world" or "acted twice in one tick" issues.

## Current Phase Buckets Worth Remembering

If you need a quick mental model:

- encounter pipeline: progression -> visibility/revelation -> decision
- movement pipeline: decision -> movement -> colocation
- economy pipeline: prosperity -> traits -> settlement promotion -> sublocations -> chronicle
- knowledge pipeline: encounter/colocation/dilemma revelations -> familiarity -> interaction depth
- end-of-tick player view pipeline: touch versions -> visibility -> revelation -> UI-facing event buffers
