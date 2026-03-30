# Unified Action System Design

> **Date:** 2026-03-12
> **Status:** Design approved, pending implementation planning
> **Replaces:** ActionInProgress + EncounterProgress + interventionEffects (three parallel pipelines → one)

## Core Principle

**Every action in the game is the same kind of thing.** Whether the Ascendant inspires a general, a warlord raises an army, or a spy infiltrates a court — it's one unified Action. Every action has an initiator, a target, a tick cost (minimum 1), and graph operations that execute on completion. Every action occupies an AP slot on the actor who initiated it. Every action is visible in the UI on the actor's tooltip, detail view, and page.

The differences between a divine intervention and a mortal CRUD action are parameter choices on the same template format — scale, step count, resource cost, resolution method — not different systems.

## Motivation

The existing codebase has three parallel action execution pipelines:

1. **CRUD Actions** — 36 templates, single-step, tick-progressed, resolved via GraphOps
2. **Encounters** — 64 templates, multi-step (2-4 steps), per-step resolution, separate EncounterProgress state
3. **Divine Interventions** — 8 types, instant effect, hardcoded handlers in interventionEffects.ts, creates decaying DivineInfluenceEntry

All three ultimately mutate the world graph via GraphOps. All three represent "an actor does something that takes time and has consequences." But they use different state shapes, different orchestrator phases, different lifecycle functions, and different resolution logic.

This creates three problems:

- **Code complexity:** Three execution paths doing similar things makes the engine harder to reason about, debug, and extend.
- **Game design asymmetry:** The player's actions (instant interventions) feel mechanically alien compared to agent actions (tick-based). This makes the game harder to understand.
- **UI inconsistency:** An agent's in-progress action shows on their tooltip, but the Ascendant's interventions don't — because they're instant. There's no unified "what is this actor doing right now?" answer.

## Design Decisions (Settled)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Minimum action duration | 1 tick (nothing is instant) | Unified time model; all actions visible in UI |
| Tick priority ordering | Scale High→Low, then FIFO within band | Cosmic forces shape the frame, mortals react within it |
| Scale bands | Cosmic → Regional → Local → Personal | Same as existing ScaleLevel; now drives resolution priority |
| Multi-step actions | Variant within unified Action (optional steps array) | Absorbs encounters without a separate system |
| Player resource model | AP slots + Essence cost | AP creates bandwidth tension; Essence gates power level |
| Contestation | Per-step dual resolution when opposing actions overlap | Drawn-out dramatic conflict with swing points |
| Contestation frequency | Emergent via three mechanisms (see below) | Organic but reliably frequent |
| Template format | Fully converged — one format for all action types | One mental model for content authors, designers, debuggers |

## Time Model

**4 ticks ≈ 24 hours.** This is the foundational time mapping for content authors.

| Action Category | Typical Duration | Reaction Window | Examples |
|----------------|-----------------|-----------------|----------|
| Snap actions | 1 tick (~6 hrs) | Effectively none | Assassinate, Quick Theft, Divine Inspire |
| Tactical actions | 2-4 ticks (~12-24 hrs) | Narrow | Ambush, Sabotage, Rally Troops |
| Operational actions | 5-15 ticks (~1-4 days) | Moderate | March Army, Forge Alliance, Build Fortification |
| Strategic actions | 15-60 ticks (~4 days - 2 weeks) | Wide | Siege, Political Campaign, Corrupt Ley Line |
| Epic actions | 60+ ticks (~2+ weeks) | Very wide | Found City, Awaken Ancient Power, Civilization Shift |

**Content authoring principle: impact scales with duration, and duration creates vulnerability.** A 1-tick assassination is unstoppable but kills one person. A 30-tick siege is visible to everyone and can be contested — but it can conquer a city. The tick duration of an action IS the reaction window for opponents.

Some actions will be in progress for many turns before completing. This is intentional and desirable — long-running actions create the visible "living world" texture where agents are always mid-project, and other agents can observe and react to those projects.

## Unified Action Template

One template format replaces all three current systems (36 action templates + 64 encounter templates + 8 intervention types).

### Schema

```typescript
interface UnifiedActionTemplate {
  // Identity
  id: string;                          // e.g., "action.iron.raise-force" or "divine.inspire"
  name: string;                        // display name
  reach: ReachDomain;                  // which of the Nine Reaches
  crudType: 'create' | 'read' | 'update' | 'delete';

  // Scale & Priority
  scale: 'cosmic' | 'regional' | 'local' | 'personal';

  // Steps (1 = simple action, 2+ = encounter-like)
  steps: ActionStep[];

  // Costs
  apCost: number;                      // always 1 (occupies a slot for duration)
  essenceCost?: number;                // only for divine actions

  // Filtering
  actorAffinities: ActorType[];        // which actor types can use this
  locationSubtypes?: string[];         // valid location contexts
  sphereAffinity?: SphereName;         // cosmological alignment

  // Contestation
  contestsWith?: string[];             // template IDs this opposes

  // Selection
  motivations: ValuePair[];            // which axiological values drive this choice
  difficulty: number;                  // 0-1 base difficulty

  // Narrative
  narrativeTemplates: {
    initiation: string;
    perStep?: string[];                // per-step narrative (for multi-step)
    success: string;
    failure: string;
    contested?: string;                // narrative when resolved as contestation
  };
}

interface ActionStep {
  reach: ReachDomain;                  // which domain this step tests
  duration: { min: number; max: number }; // tick range for this step
  difficulty: number;                  // 0-1 for this specific step
  onSuccess: GraphOp[];               // mutations if step succeeds
  onFailure: GraphOp[];               // mutations if step fails
  failBehavior: 'fail_action' | 'continue_weakened'; // what happens on step failure
}
```

### GraphOp Extension: apply_influence

A new GraphOp type for decaying effects (replaces hardcoded intervention logic):

```typescript
interface ApplyInfluenceOp {
  type: 'apply_influence';
  target: '$actor' | '$target' | '$location';
  influence: {
    initialStrength: number;
    decayRate: number;
    minimumStrength: number;
    maxDuration: number;
    valueDrifts?: Record<ValuePair, number>;
    reachBoost?: { reach: ReachDomain; bonus: number };
    behaviorTag?: string;
    traitId?: string;
    strategyOverride?: string;
  };
}
```

Any template can use `apply_influence` in its GraphOps, though in practice only divine intervention templates would. This makes the intervention effect system data-driven rather than hardcoded.

### Template Migration Map

| Current System | Count | Becomes |
|---------------|-------|---------|
| Action templates (action-template-content.ts) | 36 | 36 unified templates, 1 step each |
| Encounter templates | 64 | 64 unified templates, 2-4 steps each |
| Intervention handlers (interventionEffects.ts) | 8 | 8-16 unified templates with essenceCost + apply_influence GraphOps |
| **Total** | **108** | **~108-116 unified templates** |

## Unified Action Runtime

### State Shape

One array on GameState replaces three:

**Before:** `actionsInProgress: ActionInProgress[]` + `encounterProgress: EncounterProgress[]` + divine influences on actor nodes

**After:** `actions: UnifiedAction[]`

```typescript
interface UnifiedAction {
  actionId: string;
  actorId: string;
  templateId: string;
  targetId: string;

  // Priority
  scale: 'cosmic' | 'regional' | 'local' | 'personal';
  source: 'agent' | 'player' | 'system';  // who initiated (tracing, not execution)
  startTick: number;

  // Step progression
  currentStep: number;                     // 0-indexed
  stepProgress: number;                    // ticks completed on current step
  stepDuration: number;                    // total ticks for current step

  // Resources (already deducted on creation)
  essencePaid?: number;

  // Contestation
  contestedWith?: string;                  // actionId of opposing action

  // Resolution
  resolved: boolean;
  outcome?: 'success' | 'failure' | 'contested_won' | 'contested_lost';
  stepOutcomes?: ('success' | 'failure')[]; // per-step results for multi-step
}
```

Divine influence decay entries remain on actor nodes as *consequences* of completed actions. They're effects, not actions. Created by the `apply_influence` GraphOp when a divine action completes.

## Tick Processing Pipeline

When a tick advances, the orchestrator processes all actions in a single ordered pass:

### Phase 1 — Progress
Increment `stepProgress` by 1 for every active (unresolved) action. Pure, cheap, no decisions.

### Phase 2 — Collect Completions
Flag any action where `stepProgress >= stepDuration` as "completing this tick."

### Phase 3 — Detect Contestation
Among completing actions, find pairs where:
- Both target the same entity
- Their templates declare `contestsWith` each other
- Both are on active (unresolved) steps

Pair them for dual resolution. Also check for *ongoing* contestation: active multi-step actions where both sides have a step resolving this tick.

### Phase 4 — Resolve in Priority Order
Sort all completing actions by scale band (Cosmic → Regional → Local → Personal), then FIFO within band.

- **Uncontested actions:** Sigmoid pool → d100 vs step difficulty. Actor's reach domain capability determines probability.
- **Contested pairs:** Dual independent rolls. Both sides roll against their respective difficulties. Relative success determines winner. Ties go to the defender (stability bias).

### Phase 5 — Execute GraphOps
Successful/winning actions execute their step's `onSuccess` GraphOps. Failed/losing actions execute `onFailure` GraphOps (if any). This includes `apply_influence` ops for divine actions.

### Phase 6 — Advance or Complete
- Multi-step actions that succeeded: advance `currentStep`, reset `stepProgress`, compute new `stepDuration`.
- Multi-step actions that failed: check `failBehavior`. If `fail_action`, mark entire action as failed. If `continue_weakened`, advance with a penalty modifier.
- Actions on their final step: mark as `resolved` with outcome.

### Phase 7 — Idle Selection
Any actor with a free AP slot runs their decision pipeline:
- AI agents: Axiological Motivation Engine → action candidate scoring → start new UnifiedAction
- Ascendant: Player's queued interventions (if any) → start new UnifiedAction
- System: Event-triggered actions (e.g., seasonal effects)

### What This Replaces

| Current Orchestrator Phase | Unified Phase |
|---------------------------|---------------|
| `phaseAgentActions` (action + encounter initiation) | Phase 7 (idle selection) |
| `phaseActionProgress` (CRUD tick progression + resolution) | Phases 1-6 |
| Encounter resolution (separate multi-step loop) | Phases 1-6 (multi-step handled natively) |
| `phaseDivineInfluenceDecay` | **Kept as-is** — decay is an effect, not an action |

## Contestation Design

### Per-Step Resolution
When two multi-step contested actions overlap (e.g., 3-step Siege vs 3-step Defend), each step where both sides are active resolves as a dual contest. This creates dramatic structure:

- Step 1: Attacker wins → "The vanguard breached the outer defenses"
- Step 2: Defender wins → "But the garrison rallied at the inner wall"
- Step 3: Final contest → climactic resolution

Each step is a swing point. The narrative engine treats each contested step as a Notable-tier event with its own prose beat.

### Asymmetric Step Counts
A 3-step siege vs a 2-step defense: steps 1 and 2 are contested. The siege's step 3 resolves uncontested — but the defense's successful steps may have already applied GraphOps (fortification bonuses, morale boosts) that make the final assault harder.

### Ensuring Frequent Contestation

Three mechanisms work together to make contests reliably common:

**1. Reactive Candidate Generation**
When an agent's action selection pipeline runs, incoming threats heavily bias candidate scoring. If there's an active action targeting your location, faction, or person, defensive and counter-actions get a large scoring bonus. A brave agent facing a siege almost always picks "Defend." A cowardly one picks "Flee" — also interesting. The Axiological Motivation Engine already uses context for scoring; "active threats against me" becomes a very heavy context signal.

**2. Proximity Friction**
Agents in the same location with opposing dispositions naturally generate contested situations. The Disposition System's cooperation/defection model means that defection-oriented agents actively seek conflict. Factions sharing borders with opposed values will repeatedly collide: one side's "Expand Territory" contests the other's "Patrol Border."

**3. Ascendant as Contest Catalyst**
The player's core gameplay loop becomes *creating contestation on purpose*. Inspire a rebel's courage so they challenge the tyrant. Deceive a merchant into aggression against a rival. The player sets up conditions for dramatic collisions, then watches them play out — a better god-game fantasy than "push button, get instant effect."

## What Stays the Same

The following systems are **not changed** by this design:

- **Axiological Motivation Engine** — still drives AI action selection; just feeds into one pipeline
- **Disposition System** — still provides cooperation/defection scoring
- **Resolution System** — sigmoid pool → d100 still resolves individual rolls
- **GraphOp Executor** — still processes graph mutations; gains `apply_influence` op type
- **Debug Trace System** — still emits traces; now one trace category instead of three
- **Divine Influence Decay** — still fades effects over time; still a separate orchestrator phase
- **Influence Essence** — still the player's resource; now a cost field on divine templates
- **Action Points** — still per-actor bandwidth; now uniformly applied to all actors including Ascendant

## Rejected Alternatives

- **Unified execution only (Approach 2):** Keep three input formats, funnel to one runtime type. Rejected because it preserves three mental models for content authors. Full convergence is cleaner.
- **Separate chains for multi-step (Option B):** Encounters become sequences of independent actions. Rejected because it loses the gestalt narrative ("Raid Caravan step 2/3") and creates interruption timing issues.
- **Low→High priority ordering:** Personal actions first, cosmic last. Rejected because it makes the Ascendant feel reactive rather than powerful. High→Low fits the god-game fantasy.
- **Instant divine interventions:** Keep player actions at 0 ticks. Rejected because it breaks the unified mental model and prevents interventions from appearing in the UI action display.
- **Completion-only contestation:** Only contest when one action finishes. Rejected in favor of per-step contestation for richer narrative arcs and more swing points.

## Open Questions for Implementation

1. **Encounter template migration detail:** The 64 encounter templates have a different data shape (linear step arrays with per-step reach domains). Need a mechanical migration plan.
2. **Intervention template authoring:** How many divine templates? 8 (one per intervention type) or more granular (sphere-specific variants)?
3. **AP for Ascendant:** Baseline AP count? The design says 1-2 (from existing Action Points spec). Needs playtesting.
4. **Contested action narrative integration:** How does the Narrative Engine's tier system (Routine/Notable/Chronicle) interact with per-step contest beats?
5. **Auto-pause triggers:** Which contestation events should auto-pause? All? Only those involving spotlight actors?
