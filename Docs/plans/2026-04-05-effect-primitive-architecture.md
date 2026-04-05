# Effect Primitive Architecture

How to build all 26 primitives so they're flexible, reusable, and interoperable.

## Design Principle

Every primitive is **data, not code**. A primitive is a typed JSON object on an attachment's `effects[]` array. The engine interprets it through a small number of integration points. Adding a new primitive = adding a new discriminant to the union type + a handler in the appropriate integration point. No new orchestrator phases, no new tick hooks, no new UI components.

## Integration Points

There are exactly 5 places the engine reads effects. Every primitive hooks into one or more of these:

```
1. RESOLUTION  — "How well did this encounter step go?"
   Called per encounter step. Reads effects → outputs reach modifiers + test shapers.

2. TICK        — "What changes this tick?"
   Called once per tick per agent. Manages lifecycle (duration, cooldown, decay, stacking).
   Also fires periodic effects (resource drain, axiological drift, hex effects).

3. EVENT       — "Something just happened — does anything react?"
   Called when events fire (damaged, entered_hex, encounter_complete, etc.).
   Triggers reactive effects, transforms, on-use triggers.

4. QUERY       — "Does this agent have capability X?"
   Called by action selection, awareness, movement, social systems.
   Reads trait grants, action gates, behavior weights, immunities, range modifiers.

5. MUTATION    — "Change the world graph."
   Called when an effect needs to create/destroy/modify nodes or edges.
   Used by graph_mutation, dispel, spawn, faction_manipulate, compel.
```

## Primitive → Integration Point Map

| Primitive | Resolution | Tick | Event | Query | Mutation |
|-----------|:---:|:---:|:---:|:---:|:---:|
| passive | x | | | | |
| conditional | x | | | | |
| cooldown | x | x | | | |
| decay | x | x | | | |
| stacking | x | x | x | | |
| consumable_charge | x | | x | | |
| tradeoff | x | | | | |
| duration | x | x | | | |
| until_event | x | | x | | |
| test_shaper | x | | | | |
| prevent_loss | x | | | | |
| transform | | | x | | x |
| reactive | | | x | | |
| trait_grant | | | | x | |
| action_gate | | | | x | |
| behavior_weight | | | | x | |
| social_modifier | | | | x | |
| axiological_drift | | x | | | |
| range_modifier | | | | x | |
| tag_immunity | | | | x | |
| dispel | | | | | x |
| hex_effect | | x | | | |
| resource_manipulate | | x | x | | |
| graph_mutation | | | x | | x |
| modify_rules | | | | x | |
| compel | | | | | x |
| faction_manipulate | | | | | x |
| cascade | | | x | | x |

## The Five Handlers

### 1. Resolution Handler (`effectResolver.ts`)

**When:** Every encounter step, per agent.
**Input:** Agent's attached effects + encounter context (step reach, encounter type, biome, etc.).
**Output:** `{ modifiers: Record<ReachDomain, number>, testShapers: TestShaper[], preventLoss: PreventLoss[] }`

**What it does:**
1. Walk agent's attachment edges → collect all effects
2. For each effect, check if it's active:
   - `conditional` → evaluate predicate against context
   - `cooldown` → check if in active phase
   - `until_event` → check if event has fired
   - `consumable_charge` → check if charges > 0
   - `decay` → read current decayed value
   - `stacking` → read current stack count × valuePerStack
3. Sum active reach modifiers (per-item cap, global cap)
4. Collect test shapers and prevent_loss effects separately

**Already exists:** `effectResolver.ts` handles passive, conditional, cooldown, duration, decay, stacking, test_shaper, prevent_loss. Needs extension for `tradeoff` (already designed, just needs content).

### 2. Tick Handler (`effectTick.ts`)

**When:** Once per tick, per agent.
**Input:** Agent's attached effects + current tick state.
**Output:** `{ stateUpdates: EffectStateUpdate[], destroyedAttachments: string[], hexMutations: HexMutation[] }`

**What it does:**
1. Walk agent's attachment edges → collect all effects with tick-relevant types
2. For each:
   - `duration` → decrement ticksRemaining, flag destroy if expired
   - `cooldown` → advance phase (active→dormant or dormant→active)
   - `decay` → apply changePerTick, flag destroy if at limit
   - `stacking` → apply decayPerTick to stack count
   - `axiological_drift` → apply rate to agent's value profile
   - `hex_effect` → apply property change to agent's hex
   - `resource_manipulate` (perTick) → apply to essence/quintessence
3. Return updates for the orchestrator to apply

**Already exists:** `effectTick.ts` handles duration, cooldown, decay, stacking. Needs extension for axiological_drift, hex_effect, resource_manipulate.

### 3. Event Handler (new: `effectEvents.ts`)

**When:** Game events fire — encounter outcomes, movement, damage, etc.
**Input:** Event type + agent + event-specific data.
**Output:** `{ triggeredEffects: TriggeredEffect[], transforms: TransformResult[], mutations: GraphOp[] }`

**What it does:**
1. Walk agent's attachment edges → collect effects with event-relevant triggers
2. Match event type against:
   - `reactive` → check trigger match, fire nested effect (respecting cooldown)
   - `transform` → check trigger match, roll probability, replace attachment if success
   - `stacking` → check stackOn trigger, increment if match
   - `until_event` → check event match, expire if match
   - `consumable_charge` → decrement charge on use
   - `graph_mutation` → execute if condition met
   - `cascade` → fire step sequence
   - `resource_manipulate` (one-shot) → apply to target
3. On-use triggers (separate system) → also fire here

**Partially exists:** `attachmentTriggers.ts` handles on-use triggers. Reactive, transform, and cascade need new handlers.

### 4. Query Handler (new: `effectQueries.ts`)

**When:** Other systems ask "does this agent have X capability?"
**Input:** Query type + agent.
**Output:** Depends on query type.

**What it does — query dispatch:**

```typescript
// Does this agent have a trait?
hasGrantedTrait(agent, traitId): boolean
  → walks effects, returns true if any trait_grant matches

// What actions are gated?
getActionGates(agent): { blocked: string[], unlocked: string[] }
  → walks effects, collects action_gate entries

// What are this agent's behavior weights?
getBehaviorWeights(agent): Record<string, number>
  → walks effects, collects behavior_weight entries

// What social modifiers does this agent emit?
getSocialModifiers(agent): SocialModifier[]
  → walks effects, collects social_modifier entries

// Is this agent immune to a tag?
isImmuneToTag(agent, tag): boolean
  → walks effects, checks tag_immunity entries

// What range modifiers apply?
getRangeModifiers(agent): { movementCost: number, awarenessRange: number }
  → walks effects, collects range_modifier entries

// What rule overrides are active?
getActiveRuleOverrides(scope): RuleOverride[]
  → walks all agents' effects in scope, collects modify_rules entries
```

**Partially exists:** `effectResolver.ts` has `getGrantedTrait()`. The rest needs building.

### 5. Mutation Handler (extend: `effectExecutors.ts`)

**When:** An effect needs to change the world graph.
**Input:** Mutation specification + source agent + target.
**Output:** `GraphOp[]` for the orchestrator to apply.

**What it does:**
1. Validate the mutation is legal (target exists, permission checks)
2. Translate to GraphOp sequence:
   - `graph_mutation` → create_node/destroy_node/create_edge/destroy_edge/modify_property
   - `dispel` → find matching attachments by tag, generate remove ops
   - `compel` → write override to target agent's compel state
   - `faction_manipulate` → generate faction graph ops
   - `cascade` → process steps sequentially, collecting ops from each
3. Return ops for the orchestrator

**Partially exists:** `effectExecutors.ts` has stubs for most operations. Needs orchestrator wiring.

## Shared Infrastructure

### Predicate Evaluator

All primitives that take a `condition` field use the same predicate evaluator. One function, one context builder, shared across all 5 handlers.

```typescript
evaluatePredicate(condition: EffectPredicate, context: EffectContext): boolean
```

Already exists in `effectResolver.ts`. Extract to shared module.

### Effect Walker

All 5 handlers need to walk an agent's attachment edges and collect effects. One function.

```typescript
collectEffects(graph: WorldGraph, agentId: string): AttachedEffect[]
// Returns: { effect, sourceAttachmentId, sourceTier }
```

Already exists as inline code in effectResolver. Extract to shared module.

### Effect State Store

Mutable runtime state for effects that change over time (cooldown phase, stack count, decay value, charge count). Stored on the graph edge or a separate state map — not on the effect definition.

```typescript
interface EffectRuntimeState {
  cooldownPhase?: 'active' | 'dormant';
  cooldownTicksElapsed?: number;
  currentStacks?: number;
  currentDecayValue?: number;
  chargesRemaining?: number;
  driftAccumulated?: number;
}
```

Already exists as `EffectRuntimeState` in effects.ts.

### Scope Resolver

Primitives with `scope` field (hex, radius, region, faction, global) need to resolve "which agents/hexes does this affect?" One function.

```typescript
resolveScope(scope: EffectScope, sourceAgent: string, graph: WorldGraph): string[]
// Returns: agent IDs or hex coordinates affected
```

Infrastructure exists but isn't used by content yet.

## System Interfaces

How primitives connect to every existing game system. Each system already has a natural point where it should ask the effect handlers for input.

### Encounter Resolution (`encounter.ts`, `resolutionModifiers.ts`, `resolutionService.ts`)
**Handler:** Resolution
**Currently:** Calls `computeEquipmentModifier()` (legacy reachBonus) and `resolveEffectModifiers()` (new effects[]).
**Primitives that feed in:** passive, conditional, cooldown, decay, stacking, consumable_charge, tradeoff, duration, until_event, test_shaper, prevent_loss
**Interface change:** None needed — already wired. Just needs content using the primitives.

### Action Selection / Maslow Pipeline (`actionCandidates.ts`, `agentDecisionMaslow.ts`)
**Handler:** Query
**Currently:** Filters by wealth, location subtype, actor type. No trait/effect awareness.
**Primitives that feed in:** behavior_weight, action_gate, trait_grant (as prerequisite)
**Interface change:** After filtering candidates, call `getBehaviorWeights(agent)` to multiply selection scores. Call `getActionGates(agent)` to hard-filter blocked/unlocked actions. Check `hasGrantedTrait(agent, requiredTrait)` for prerequisites.

### Agent Movement (`movement.ts`, terrain cost calculation)
**Handler:** Query
**Currently:** Reads terrain cost from `TERRAIN_TAXES`. No per-agent modifiers.
**Primitives that feed in:** range_modifier (movement_cost dimension), compel (movement_target override)
**Interface change:** After terrain cost lookup, call `getRangeModifiers(agent).movementCost` as multiplier. Before pathfinding, check for active compel(movement_target) overrides.

### Encounter Awareness (`encounterAwareness.ts`)
**Handler:** Query
**Currently:** Hex distance calculation with per-reach awareness hops.
**Primitives that feed in:** range_modifier (awareness_range dimension), modify_rules (awareness_range_bonus)
**Interface change:** After base awareness range calculation, add `getRangeModifiers(agent).awarenessRange` bonus. Check for active modify_rules(awareness_range_bonus) in scope.

### Disposition / Social System (`disposition.ts`, game-theory cooperation)
**Handler:** Query
**Currently:** 5 strategies (Tit-for-Tat, Grudger, etc.) based on archetype. No dynamic modifiers.
**Primitives that feed in:** social_modifier (intimidation, trust, attraction, avoidance), axiological_drift
**Interface change:** When evaluating agent-to-agent disposition, call `getSocialModifiers(targetAgent)` and apply dimension values. When computing cooperation strategy weights, check if axiological_drift has shifted the agent's profile.

### Prosperity / Economy (`prosperityTick.ts`, trade resolution)
**Handler:** Tick + Query
**Currently:** Per-location prosperity calculation from base income + trade.
**Primitives that feed in:** modify_rules (healing_multiplier for prosperity growth?), graph_mutation (create trade routes)
**Interface change:** Minimal — economic effects mostly go through graph_mutation (create/destroy trade edges) rather than direct prosperity modifiers. Could add a prosperity_multiplier rule override if needed.

### Faction System (`factionRelationships.ts`, reputation tracking)
**Handler:** Query + Mutation
**Currently:** Reputation tracked via relationship edges, faction control via controls edges.
**Primitives that feed in:** social_modifier (faction_standing), faction_manipulate, graph_mutation (create/destroy controls edges), modify_rules (faction_influence_multiplier)
**Interface change:** When processing reputation changes, multiply by any active faction_influence_multiplier. Faction_manipulate operations generate GraphOps that feed into the standard faction pipeline.

### Doom Clock (`doomClock.ts`)
**Handler:** Tick + Query
**Currently:** Ticks toward Unmaking, 5-stage escalation.
**Primitives that feed in:** modify_rules (doom_rate_multiplier), until_event (doom_threshold as event)
**Interface change:** After computing doom increment per tick, multiply by active doom_rate_multiplier from modify_rules. When doom crosses a threshold, fire doom_threshold event for until_event and transform triggers.

### Reward Pool / Loot System (`rewardPool.ts`, `attachmentTierAdvancement.ts`)
**Handler:** Query
**Currently:** Tier-weighted random selection from catalog.
**Primitives that feed in:** modify_rules (reward_tier_bonus)
**Interface change:** After computing tier curve, apply reward_tier_bonus from active modify_rules. This lets divine effects or location properties bias rewards.

### Condition Application (when an agent receives a new condition)
**Handler:** Query
**Currently:** Conditions added directly via graph edge creation.
**Primitives that feed in:** tag_immunity (blocks incoming conditions matching tags), prevent_loss (absorbs condition)
**Interface change:** Before adding a has_trait edge for a new condition, call `isImmuneToTag(agent, conditionTags)`. If immune, block silently. Check prevent_loss for condition channel.

### Hex State (`hexMutations.ts`, `phaseMagicalSaturation.ts`)
**Handler:** Tick
**Currently:** divineInfluence, corruption, magicalSaturation decay naturally per tick.
**Primitives that feed in:** hex_effect (direct property modification)
**Interface change:** After natural decay, apply hex_effect contributions from agents on or near the hex. This is additive — hex_effect counters or accelerates natural decay.

### Orchestrator Tick Phases (`orchestrator.ts`)
**Currently:** ~15 phases per tick. Effects are processed in `tickEffects` phase.
**New phase needed?** No — but the existing `tickEffects` phase needs to also call the Event handler for tick-triggered events (axiological_drift, hex_effect, resource_manipulate per-tick). The Event handler for encounter-triggered events fires from within encounter resolution, not as a separate phase.

### Debug / Inspectability (`DebugPanel`, traces)
**Handler:** All — via trace emission
**Currently:** EffectTickTrace emitted per tick.
**Primitives that feed in:** All primitives should emit traces when they fire.
**Interface change:** Each handler emits its own trace type:
- ResolutionTrace: which effects contributed to this roll
- EventTrace: which reactive/transform effects fired
- QueryTrace: which gates/weights/immunities were checked
- MutationTrace: which graph ops were generated

### Prose / Narrative Engine (`proseResolvers.ts`)
**Handler:** Query (read-only)
**Currently:** Prose resolvers walk the graph for entity descriptions.
**Primitives that feed in:** All effects are potential prose fodder — a decaying weapon, a cooldown spell cycling, stacked combat experience.
**Interface change:** Prose resolvers can read effect state (current stacks, decay value, cooldown phase) to generate flavor. No architectural change — just more data available for templating.

### Player UI / ActionDrawer
**Handler:** Query
**Currently:** ActionDrawer shows filtered actions per target context.
**Primitives that feed in:** action_gate (show unlocked actions, hide blocked ones), behavior_weight (not directly — player is not an AI agent)
**Interface change:** When building action candidate list for the player, call `getActionGates(playerAvatar)` to filter. action_gate with `gate: 'unlock'` adds new action cards; `gate: 'block'` removes them.

## Implementation Order

Build the shared infrastructure first, then the handlers, then the primitives flow naturally:

### Phase 1: Extract shared modules
- [ ] Extract predicate evaluator from effectResolver → `effectPredicates.ts`
- [ ] Extract effect walker from effectResolver → `effectWalker.ts`
- [ ] Verify EffectRuntimeState covers all tick-relevant primitives

### Phase 2: Extend existing handlers
- [ ] Resolution handler: add tradeoff support (trivial — just read bonus and penalty)
- [ ] Tick handler: add axiological_drift, hex_effect, resource_manipulate(perTick)
- [ ] Verify all P1 primitives (conditional, consumable_charge, cooldown, stacking, decay) work end-to-end

### Phase 3: Build new handlers
- [ ] Event handler (`effectEvents.ts`): reactive, transform, cascade, event-triggered mutations
- [ ] Query handler (`effectQueries.ts`): trait_grant, action_gate, behavior_weight, social_modifier, tag_immunity, range_modifier, modify_rules

### Phase 4: Wire mutation handler
- [ ] Connect effectExecutors.ts to orchestrator
- [ ] Implement graph_mutation, dispel, compel, faction_manipulate through GraphOp pipeline
- [ ] Implement cascade as sequential step executor

### Phase 5: Orchestrator integration
- [ ] Resolution handler: already wired (effectResolver called from resolutionModifiers)
- [ ] Tick handler: already wired (effectTick called from orchestrator)
- [ ] Event handler: wire to encounter resolution outcomes, movement events, damage events
- [ ] Query handler: wire to action selection, movement cost, encounter awareness, social disposition
- [ ] Mutation handler: wire to GraphOp executor

## File Structure

```
src/engine/effects/
  effectPredicates.ts    — shared predicate evaluator
  effectWalker.ts        — shared effect collector
  effectResolver.ts      — integration point 1: resolution modifiers (exists, move here)
  effectTick.ts          — integration point 2: per-tick lifecycle (exists, move here)
  effectEvents.ts        — integration point 3: event reactions (new)
  effectQueries.ts       — integration point 4: capability queries (new)
  effectExecutors.ts     — integration point 5: world mutations (exists, move here)
  effectConstants.ts     — all tunable constants (exists, move here)
```

## Adding a New Primitive

1. Add discriminant to `AttachmentEffect` union in `src/types/effects.ts`
2. Determine which integration points it touches (resolution? tick? event? query? mutation?)
3. Add handler case in each relevant integration point
4. Add to reference card (`Docs/attachment-primitive-reference.md`) with story pattern, fields, and usage tags
5. Create test content exercising the primitive
6. Verify via CLI: `spawn attachment @hero <templateId>`, then `tick 10`, `status`
