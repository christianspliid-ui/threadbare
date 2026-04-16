# Agent Initiatives — Implementation Plan

> **Date:** 2026-04-14 (updated 2026-04-15)
> **Status:** Implementation Planning
> **Issue:** THR-51
> **Depends on:** THR-28 (Deep Social Scenes — leverage mechanic, multi-step encounters)
> **Blocks:** THR-29 (Faction Agency — faction founding is an initiative)
> **Supplement:** `2026-04-15-initiative-types-deep-design.md` — detailed per-type specs, corrections, and interaction chains. **Where conflicts exist, the supplement is authoritative.**

---

## Problem

Agents are reactive. They respond to encounters, follow ambition milestones, and drift between locations — but they never *create* new things in the world. A charismatic agent at a wealthy city doesn't decide to found a guild. A devout agent at an ancient ruin doesn't consecrate a shrine. A cunning agent with allies doesn't organize a spy ring.

The world changes through random encounter outcomes and player divine actions. Agents are passengers, not authors. This makes the chronicle feel like things happen *to* agents, not *because of* them.

## Solution

**Agent Initiatives** — a system where agents autonomously propose and execute multi-tick projects that create durable world changes. Initiatives are the agent equivalent of the player's divine actions: they cost resources, take time, can fail, and produce persistent graph mutations (new factions, sublocations, relationships, encounters).

Six initiative types, each producing a different kind of world change:

| Initiative | Output | Ticks | Cost | Narrative Feel |
|-----------|--------|-------|------|---------------|
| Found Organization | New faction node + guild hall sublocation | 8–12 | 20 wealth | "A banner rises above a new hall" |
| Recruit Party | 2–4 `relates_to` bonds (basis: sworn_ally) with nearby agents | 5–8 | 3 wealth | "They share a fire and a purpose" |
| Organize Festival | Temporary social boost + encounter burst at location | 4–6 | 10 wealth | "Music fills the square for three days" |
| Consecrate Holy Site | New shrine sublocation with sphere alignment | 6–10 | 15 wealth | "The ground remembers what was spoken here" |
| Commission Quest | Spawns a quest encounter targeting a specific agent | 3–5 | 8 wealth | "A task written on good parchment, sealed" |
| Establish Spy Network | `relates_to` edge (basis: espionage) + `recordIntelligence()` intel generation | 8–12 | 18 wealth | "Eyes and ears, bought cheaply" |

---

## Architecture Decision: Initiatives as Scored Alternatives in Agent Decision

Initiatives need to integrate with the existing agent decision pipeline, not replace it. Two options considered:

**Option A: Separate phase after agent decision — `phaseAgentInitiative` runs independently.**
- New orchestrator phase between Agent Decision and Movement
- Agents not currently occupied check initiative eligibility independently
- Pro: clean separation. Con: agents might start an initiative AND an encounter in the same tick; two selection systems competing for the same agents.

**Option B: Initiatives score as candidates within the existing agent decision pipeline.**
- Initiative templates produce `ScoredCandidate` entries alongside encounter candidates
- Single selection: agent picks the highest-scoring option, whether encounter or initiative
- Pro: unified decision, no double-selection. Con: requires initiative templates to be scorable like encounters.

**Chosen: Option B (hybrid).** Initiatives inject candidates into the existing `scoreAndSelect()` pipeline via a new `generateInitiativeCandidates()` function called during `phaseAgentDecision`. However, initiative *progression* (advancing an in-progress initiative each tick) runs in a new lightweight `phaseInitiativeProgress` after agent decision and before movement. This keeps selection unified but progression separate.

---

## Architecture Decision: Initiative Progress Tracking

**Option A: Reuse `EncounterProgress` with an initiative flag.**
- Add `isInitiative?: boolean` to EncounterProgress
- Reuse `occupiedUntilTick`, `status`, `currentEncounterIndex` for multi-step tracking
- Pro: maximum reuse. Con: EncounterProgress becomes overloaded; initiative steps are fundamentally different from encounter resolution (they don't use difficulty/threshold).

**Option B: New `InitiativeProgress` type on agent node properties.**
- Store `activeInitiative?: InitiativeProgress` on the agent's properties
- Separate shape: template reference, start tick, ticks remaining, wealth invested, milestone checks
- Pro: clean separation, initiative-specific fields. Con: new type.

**Chosen: Option B.** Initiatives don't resolve via the encounter threshold/dice system — they progress via milestone checks and can fail from external disruption (agent dies, loses wealth, location falls). A separate type is clearer and avoids polluting EncounterProgress.

---

## Implementation Phases

### Phase 1: Initiative Templates & Types (Engine)

**1.1 Define InitiativeTemplate type**

File: new `src/types/initiative.ts`

```typescript
export interface InitiativeTemplate {
  id: string;                          // e.g., 'initiative.found-organization'
  name: string;
  category: 'founding' | 'social' | 'religious' | 'espionage' | 'quest';
  description: string;                 // Prose description for chronicle

  // Prerequisites
  minWealth: number;                   // Minimum wealth to begin
  wealthCost: number;                  // Wealth deducted at start
  requiredReaches?: Partial<Record<Domain, number>>;  // Minimum capability tiers
  requiredAxiologicalBias?: {          // Agent's axiological profile must lean this way
    axis: keyof AxiologicalProfile;
    direction: 'left' | 'right';       // left = first value, right = second value
    minStrength: number;               // How far they must lean (0.0–1.0)
  };
  locationFilter?: {                   // Where the initiative can start
    requiredSubtype?: string;          // e.g., 'city' or 'capital'
    requiredSublocationTypeId?: string;
    minPopulation?: number;
  };

  // Execution
  baseDuration: number;                // Ticks to complete (modified by capability)
  durationVariance: number;            // ±ticks of randomized variance
  checkInterval: number;               // Ticks between milestone checks
  failureConditions: InitiativeFailureCondition[];
  
  // Output
  outcomes: InitiativeOutcome[];
  
  // Scoring (for candidate generation)
  motivations: Array<{
    left: string;
    right: string;
    weight: number;
  }>;
  sphereAffinity?: string;            // Preferred sphere alignment
}

export type InitiativeFailureCondition =
  | { type: 'wealth_below'; threshold: number }
  | { type: 'agent_leaves_location' }
  | { type: 'agent_dies' }
  | { type: 'location_destroyed' }
  | { type: 'disrupted_by_encounter'; encounterTypes: string[] };

export type InitiativeOutcome =
  | { type: 'create_faction' }  // Faction definition generated dynamically from founder's profile
  | { type: 'create_sublocation'; sublocationTypeId: string; name?: string }
  | { type: 'create_bonds'; bondType: string; bondBasis: string; count: number; radius: number }
  | { type: 'temporary_location_boost'; property: string; value: number; duration: number }
  | { type: 'spawn_encounter'; templateId: string; targetFilter?: string }
  | { type: 'create_edge'; edgeType: string; edgeBasis?: string; targetFilter: string };
```

**1.2 Define InitiativeProgress type**

File: `src/types/initiative.ts`

```typescript
export interface InitiativeProgress {
  templateId: string;
  initiativeId: string;               // Unique instance ID
  actorId: string;
  locationId: string;                  // Where the initiative is happening
  startedTick: number;
  targetCompletionTick: number;        // startedTick + computed duration
  occupiedUntilTick: number;           // Same semantics as encounter occupation
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  wealthInvested: number;
  checkpoints: Array<{
    tick: number;
    passed: boolean;
    reason?: string;
  }>;
  // For chronicle prose
  sphereColoring?: string;             // Sphere that colors the initiative's narrative
}
```

Store as `properties.activeInitiative` on the agent node. Only one active initiative per agent.

**1.3 Extend agent properties type**

File: `src/types/graph.ts` or wherever actor property types are defined

Add `activeInitiative?: InitiativeProgress` to actor node properties.

---

### Phase 2: Initiative Candidate Generation (Engine)

**2.1 Create initiative candidate generator**

File: new `src/engine/initiativeCandidates.ts`

```typescript
export function generateInitiativeCandidates(
  agent: GraphNode,
  graph: WorldGraph,
  state: GameState,
  rng: SeededRNG,
): ScoredCandidate[]
```

Logic:
1. **Skip if occupied** — agent has `activeInitiative` with status `'active'` → return empty
2. **Skip if in encounter** — `isEncounterOccupied()` → return empty
3. **Cooldown check** — `properties.lastInitiativeCompletedTick` + `INITIATIVE_COOLDOWN_TICKS` > current tick → return empty
4. **Filter eligible templates** — for each template:
   - Wealth check: `readWealth(agent.properties) >= template.minWealth`
   - Reach check: agent capability tiers meet `requiredReaches`
   - Axiological check: agent's profile leans in required direction
   - Location check: agent's current location matches `locationFilter`
5. **Score eligible templates** — reuse encounter scoring shape:
   - Base score from axiological motivation alignment (same math as encounter motivations)
   - Ambition bonus: if agent has an active ambition whose milestones align with initiative output, `+INITIATIVE_AMBITION_ALIGNMENT_BONUS`
   - Wealth surplus: agents with excess wealth above cost are more likely to invest → `+INITIATIVE_WEALTH_SURPLUS_BONUS * (wealth - minWealth) / 100`
   - Social density: founding/social initiatives score higher at populated locations
   - Score cap: `INITIATIVE_MAX_SCORE` to prevent initiatives from dominating over encounters

Return as `ScoredCandidate[]` with `requiresMovement: false` and a special `isInitiative: true` flag to distinguish from encounters during selection.

**2.2 Wire into phaseAgentDecision**

File: `src/engine/phaseAgentDecision.ts`

In the candidate generation section (after `generateSocialCandidates` and combat/exploration candidates are collected), add:

```typescript
const initiativeCandidates = generateInitiativeCandidates(agent, graph, state, rng);
allCandidates.push(...initiativeCandidates);
```

The existing `scoreAndSelect()` handles the rest — initiatives compete on equal footing with encounters.

**2.3 Handle initiative selection outcome**

In the decision resolution section of `phaseAgentDecision`, when the selected candidate has `isInitiative: true`:
- Deduct `wealthCost` via `applyWealthDelta()`
- Compute duration: `baseDuration + rng.nextInt(-durationVariance, durationVariance)`
- Create `InitiativeProgress` and store on agent properties
- Set `occupiedUntilTick = state.tick + computedDuration`
- Emit `InitiativeStartedTrace`

---

### Phase 3: Initiative Progression Phase (Engine)

**3.1 Create phaseInitiativeProgress**

File: new `src/engine/phaseInitiativeProgress.ts`

```typescript
export function phaseInitiativeProgress(state: GameState): void
```

Called once per tick. For each agent with `activeInitiative.status === 'active'`:

1. **Failure check** — evaluate each `failureCondition` in the template:
   - `wealth_below`: `readWealth(agent.properties) < threshold`
   - `agent_leaves_location`: agent's `located_at` target ≠ `initiative.locationId` (resolved up to location level)
   - `location_destroyed`: location node missing from graph
   - `disrupted_by_encounter`: agent completed an encounter of a listed type since last check
   - If any condition fires → set `status: 'failed'`, emit `InitiativeFailedTrace`, clear occupation

2. **Completion check** — `state.tick >= initiative.targetCompletionTick`:
   - Execute outcomes (see Phase 4)
   - Set `status: 'completed'`
   - Set `properties.lastInitiativeCompletedTick = state.tick`
   - Emit `InitiativeCompletedTrace`
   - Clear `occupiedUntilTick`

3. **Checkpoint** (every `checkInterval` ticks since start):
   - Roll a capability check against the template's required reaches
   - On failure: extend `targetCompletionTick` by `INITIATIVE_DELAY_ON_FAILED_CHECK` ticks (initiative slows but doesn't fail)
   - Record in `checkpoints[]`
   - Emit `InitiativeCheckpointTrace`

**3.2 Wire into orchestrator**

File: `src/engine/orchestrator.ts`

Add `phaseInitiativeProgress(state)` at line ~1818 — between Phase 2b (Agent Decision) and Phase 2.35 (Movement). Initiatives progress after decisions but before movement, so a newly started initiative occupies the agent before movement could override it.

```typescript
// Phase 2b.1: Initiative Progress
phaseInitiativeProgress(state);
```

---

### Phase 4: Initiative Outcomes (Engine)

**4.1 Outcome executor**

File: new `src/engine/initiativeOutcomes.ts`

```typescript
export function executeInitiativeOutcomes(
  initiative: InitiativeProgress,
  template: InitiativeTemplate,
  agent: GraphNode,
  graph: WorldGraph,
  state: GameState,
  rng: SeededRNG,
): void
```

Each outcome type maps to existing engine functions:

| Outcome Type | Implementation |
|-------------|----------------|
| `create_faction` | Create actor node (type=faction), add `member_of` edge from agent, `createSublocation()` for guild hall |
| `create_sublocation` | `createSublocation()` from `strategicGraphOps.ts` with initiative's `locationId` as parent |
| `create_bonds` | Find agents within `radius` hexes, add `relates_to` edges with specified `basis` (up to `count`) |
| `temporary_location_boost` | Set property with expiry tick on location node (cleared by a future tick check) |
| `spawn_encounter` | Register encounter template instance targeting a filtered agent |
| `create_edge` | Add typed edge from agent to filtered target |

**4.2 Faction-specific initialization**

For `create_faction` outcomes, the faction definition is **generated dynamically** from the founder's profile (see deep design supplement for full spec):
- Faction type derived from founder's top reach domain (e.g., iron → military order, gold → merchant guild)
- Name generated from reach-themed patterns
- 3-tier rank system auto-generated
- Node: `{ type: 'actor', actorType: 'faction', name: generated, properties: { factionDefId: generatedDef.id, foundedTick, founderId } }`
- Edges: `member_of` (founder → faction, rank: 'leader'), `located_at` (faction → location), `controls` (faction → guild hall sublocation)
- Guild hall sublocation via `createSublocation()` with type `sublocation-type.guild-hall`

This extends the existing faction seeding pattern from `factionSeeding.ts` but with dynamic definition generation instead of static `faction-definitions.ts` lookup.

---

### Phase 5: Initiative Content (Content)

**5.1 Six initiative template definitions**

File: new `src/data/initiative-templates.ts`

Each template follows the `InitiativeTemplate` shape defined in Phase 1.

**Found Organization**
```
id: 'initiative.found-organization'
category: 'founding'
minWealth: 20, wealthCost: 20
requiredReaches: { heart: 2, gold: 2 }
requiredAxiologicalBias: { axis: 'loyalty_ambition', direction: 'right', minStrength: 0.3 }
locationFilter: { requiredSubtype: 'town' }  // town or above
baseDuration: 10, durationVariance: 2, checkInterval: 3
motivations: [{ axis: 'loyalty_ambition', direction: 'right', weight: 0.8 }]  // Ambitious agents
outcomes: [{ type: 'create_faction' }]  // Faction definition generated dynamically from founder's profile — see deep design supplement
failureConditions: [
  { type: 'wealth_below', threshold: 5 },
  { type: 'agent_leaves_location' },
  { type: 'agent_dies' },
]
```

**Recruit Party**
```
id: 'initiative.recruit-party'
category: 'social'
minWealth: 5, wealthCost: 3
requiredReaches: { heart: 1 }
requiredAxiologicalBias: { axis: 'loyalty_ambition', direction: 'left', minStrength: 0.2 }
locationFilter: { minPopulation: 3 }
baseDuration: 6, durationVariance: 2, checkInterval: 2
outcomes: [{ type: 'create_bonds', bondType: 'relates_to', bondBasis: 'sworn_ally', count: 3, radius: 1 }]
failureConditions: [{ type: 'agent_dies' }]
```

**Organize Festival**
```
id: 'initiative.organize-festival'
category: 'social'
minWealth: 10, wealthCost: 10
requiredReaches: { heart: 2 }
locationFilter: { minPopulation: 3 }
baseDuration: 5, durationVariance: 1, checkInterval: 2
outcomes: [{ type: 'temporary_location_boost', property: 'socialBoost', value: 0.5, duration: 10 }]
failureConditions: [
  { type: 'wealth_below', threshold: 3 },
  { type: 'agent_leaves_location' },
]
```

**Consecrate Holy Site**
```
id: 'initiative.consecrate-holy-site'
category: 'religious'
minWealth: 15, wealthCost: 12
requiredReaches: { star: 2, veil: 1 }
requiredAxiologicalBias: { axis: 'sacrifice_survival', direction: 'left', minStrength: 0.3 }
baseDuration: 8, durationVariance: 2, checkInterval: 3
sphereAffinity: 'life'  // default; actual coloring from agent's dominant sphere
outcomes: [{ type: 'create_sublocation', sublocationTypeId: 'sublocation-type.shrine' }]  // NOTE: shrine type must be created — see deep design supplement
failureConditions: [
  { type: 'agent_leaves_location' },
  { type: 'agent_dies' },
  { type: 'location_destroyed' },
]
```

**Commission Quest**
```
id: 'initiative.commission-quest'
category: 'quest'
minWealth: 8, wealthCost: 8
requiredReaches: { gold: 2 }
requiredAxiologicalBias: { axis: 'loyalty_ambition', direction: 'right', minStrength: 0.2 }
baseDuration: 4, durationVariance: 1, checkInterval: 2
outcomes: [{ type: 'spawn_encounter', templateId: 'encounter.commissioned-quest' }]
failureConditions: [
  { type: 'wealth_below', threshold: 2 },
  { type: 'agent_dies' },
]
```

**Establish Spy Network**
```
id: 'initiative.establish-spy-network'
category: 'espionage'
minWealth: 20, wealthCost: 18
requiredReaches: { shadow: 3, eye: 2 }
requiredAxiologicalBias: { axis: 'honesty_cunning', direction: 'right', minStrength: 0.4 }
locationFilter: { requiredSubtype: 'city' }
baseDuration: 10, durationVariance: 2, checkInterval: 3
outcomes: [{ type: 'create_edge', edgeType: 'relates_to', edgeBasis: 'espionage', targetFilter: 'current_location' }]  // Also calls recordIntelligence() — see deep design supplement
failureConditions: [
  { type: 'wealth_below', threshold: 5 },
  { type: 'agent_leaves_location' },
  { type: 'disrupted_by_encounter', encounterTypes: ['investigation', 'interrogation'] },
]
```

**5.2 Initiative prose content**

File: new `src/data/initiative-prose.ts`

Each initiative has prose for 4 moments:
- **Start:** "Kael Thornweaver clears a table at The Crowned Stag and begins drawing plans..."
- **Checkpoint pass:** "The work continues. Timber arrives. Laborers sign on."
- **Checkpoint fail:** "A shipment of stone never arrives. The project stalls."
- **Completion:** "A new banner flies above a modest hall. The guild accepts its first members."
- **Failure:** "The coins ran dry. The half-built hall stands empty, a monument to ambition."

Prose uses the existing enrichment placeholders: `{name}`, `{location}`, `{target}`, sphere-colored variants.

**5.3 Chronicle event types**

Initiatives produce 3 new chronicle entry types:
- `initiative_started` — "X has begun [initiative] at [location]"
- `initiative_completed` — "X has completed [initiative], establishing [output]"
- `initiative_failed` — "X's [initiative] has collapsed because [reason]"

These flow through the existing `emitNarrativeEvent()` pipeline.

---

### Phase 6: Player Agency — Divine Actions (Player)

**6.1 "Inspire Initiative" divine action**

File: `src/data/unified-action-templates.ts` or `src/data/action-template-content.ts`

```typescript
{
  id: 'action.inspire.initiative',
  name: 'Inspire Initiative',
  sphere: 'mind',
  reach: 'heart',
  essenceCost: 12,
  targetCategories: ['actor'],
  targetFilter: { actorType: 'agent', hasActiveInitiative: false },
  steps: [{
    id: 'inspire.spark',
    name: 'Divine Inspiration',
    narrative: 'You plant a seed of purpose in {target}\'s mind — a vision of what could be built here.',
    effects: [
      { type: 'force_initiative_evaluation', bonusScore: 0.5 },  // Next tick, agent evaluates initiatives with +0.5 score bonus
    ],
  }],
}
```

This doesn't force a specific initiative — it makes the agent much more likely to choose *an* initiative on their next decision tick, while their personality and circumstances determine which one.

**6.2 "Sabotage Initiative" divine action**

```typescript
{
  id: 'action.sabotage.initiative',
  name: 'Sabotage Initiative',
  sphere: 'entropy',
  reach: 'shadow',
  essenceCost: 10,
  targetCategories: ['actor'],
  targetFilter: { actorType: 'agent', hasActiveInitiative: true },
  steps: [{
    id: 'sabotage.undermine',
    name: 'Unraveling',
    narrative: 'You pull at the threads of {target}\'s ambition. Supplies go missing. Allies have second thoughts.',
    effects: [
      { type: 'extend_initiative', ticks: 5 },     // Delays completion
      { type: 'add_failure_check', probability: 0.4 }, // 40% chance initiative fails next checkpoint
    ],
  }],
}
```

---

### Phase 7: UI (UI)

**7.1 Initiative indicator on agent panel**

File: `src/components/Game/AgentPanel.tsx` or equivalent

When an agent has `activeInitiative`, display:
- Initiative name and category icon
- Progress bar: `(currentTick - startedTick) / (targetCompletionTick - startedTick)`
- Ticks remaining
- Location where initiative is happening
- Wealth invested

**7.2 Initiative events in chronicle**

Initiative chronicle entries use existing chronicle rendering. The 3 event types (`started`, `completed`, `failed`) get appropriate notification tiers:
- Started: toast (notable but not urgent)
- Completed: alert (world changed — new faction, sublocation, etc.)
- Failed: toast

**7.3 Location view — active initiatives**

File: `src/components/Game/LocationView.tsx`

Show active initiatives at a location as a small badge or list item under the sublocation cards. "Kael Thornweaver is founding an organization here (4 ticks remaining)."

**7.4 Debug panel — initiative inspection**

The existing agent inspection in DebugPanel should display `activeInitiative` contents. Add initiative-specific trace filtering to the trace viewer.

---

## Dependency: Maslow Needs System

The original design referenced Maslow needs as a gating mechanism for initiative selection (agents wouldn't pursue founding until lower needs were met). **Research confirms this system does not exist in the codebase.** The only reference is `ENCOUNTER_MASLOW_TIER = 5` — a placeholder constant.

**Resolution: Do not implement Maslow needs for THR-51.** Instead, initiative eligibility uses:
- **Wealth floor** — agents below minimum wealth don't consider initiatives (they're focused on survival)
- **Axiological fit** — personality must align with initiative type
- **Capability gates** — must have the skills to execute
- **Ambition alignment** — agents pursuing relevant ambitions score higher
- **Score cap** — `INITIATIVE_MAX_SCORE` ensures encounters still dominate unless an agent is genuinely initiative-ready

This provides natural tiering without a formal needs hierarchy. A destitute agent (wealth < 5) will never found an organization. A non-ambitious agent won't seek leadership. The effect is similar to Maslow without the system.

If a formal needs system is desired later, it can be added as an additional filter in `generateInitiativeCandidates()` without changing the initiative architecture.

---

## Wiring Checklist

| Surface | Integration |
|---------|------------|
| **Orchestrator** | New `phaseInitiativeProgress` after Phase 2b, before 2.35. Candidates injected into existing phaseAgentDecision. |
| **GameState** | `activeInitiative` on actor properties. No new top-level GameState fields. |
| **UI: AgentPanel** | Progress bar, initiative name, ticks remaining when active |
| **UI: LocationView** | Active initiatives badge at location |
| **UI: Chronicle** | 3 new narrative event types (started/completed/failed) |
| **Encounter pipeline** | Initiative candidates scored via `scoreAndSelect()`. `isInitiative` flag on ScoredCandidate. |
| **Prose pipeline** | Initiative prose authored in templates. Enrichment placeholders for {name}/{location}. |
| **Traces** | 4 new trace types: Started, Checkpoint, Completed, Failed |
| **Debug panel** | ActiveInitiative visible in agent inspection. Initiative traces in trace viewer. |
| **Player controls** | "Inspire Initiative" and "Sabotage Initiative" divine action templates |
| **Wealth system** | `applyWealthDelta()` for initiative cost. `readWealth()` for eligibility. |
| **Ambition system** | Ambition alignment bonus in initiative scoring. No structural changes to ambitions. |
| **Sublocation system** | `createSublocation()` for Consecrate Holy Site and Found Organization outcomes |
| **Faction system** | Faction creation for Found Organization outcome |

---

## Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `INITIATIVE_COOLDOWN_TICKS` | 20 | Minimum ticks between completing one initiative and starting another |
| `INITIATIVE_MAX_SCORE` | 0.6 | Score cap for initiative candidates (prevents dominating over encounters) |
| `INITIATIVE_AMBITION_ALIGNMENT_BONUS` | 0.15 | Bonus score when initiative aligns with agent's active ambition |
| `INITIATIVE_WEALTH_SURPLUS_BONUS` | 0.10 | Max bonus from excess wealth above initiative cost |
| `INITIATIVE_DELAY_ON_FAILED_CHECK` | 3 | Ticks added to duration when a checkpoint check fails |
| `INITIATIVE_MIN_WEALTH_FLOOR` | 5 | Agents below this wealth never consider initiatives |
| `INITIATIVE_INSPIRE_BONUS` | 0.5 | Score bonus from "Inspire Initiative" divine action |
| `INITIATIVE_SABOTAGE_EXTENSION` | 5 | Ticks added by "Sabotage Initiative" divine action |
| `INITIATIVE_SABOTAGE_FAIL_CHANCE` | 0.4 | Probability of initiative failing at next checkpoint after sabotage |
| `INSPIRE_INITIATIVE_ESSENCE_COST` | 12 | Essence cost for Inspire Initiative |
| `SABOTAGE_INITIATIVE_ESSENCE_COST` | 10 | Essence cost for Sabotage Initiative |

---

## Tracing

**InitiativeStartedTrace:**
```typescript
interface InitiativeStartedTrace {
  tick: number;
  category: 'initiative';
  event: 'started';
  actorId: string;
  templateId: string;
  locationId: string;
  wealthCost: number;
  targetCompletionTick: number;
  axiologicalFit: number;      // How well agent profile matched
  ambitionAligned: boolean;
  summary: string;
}
```

**InitiativeCheckpointTrace:**
```typescript
interface InitiativeCheckpointTrace {
  tick: number;
  category: 'initiative';
  event: 'checkpoint';
  actorId: string;
  templateId: string;
  passed: boolean;
  delayApplied: number;
  newTargetCompletionTick: number;
  summary: string;
}
```

**InitiativeCompletedTrace:**
```typescript
interface InitiativeCompletedTrace {
  tick: number;
  category: 'initiative';
  event: 'completed';
  actorId: string;
  templateId: string;
  locationId: string;
  outcomesApplied: string[];   // e.g., ['create_faction:guild-of-merchants', 'create_sublocation:guild-hall']
  totalDuration: number;
  checkpointsFailed: number;
  summary: string;
}
```

**InitiativeFailedTrace:**
```typescript
interface InitiativeFailedTrace {
  tick: number;
  category: 'initiative';
  event: 'failed';
  actorId: string;
  templateId: string;
  locationId: string;
  failureCondition: string;    // Which condition triggered
  ticksElapsed: number;
  wealthLost: number;
  summary: string;
}
```

---

## Fail-Soft Table

| Failure | Fallback |
|---------|----------|
| No templates match any agent | No initiatives this tick — agents pick encounters as before. System is invisible. |
| Agent selected initiative but wealth changed between scoring and execution | Re-check wealth at execution. If insufficient, skip initiative, agent idles this tick. |
| Initiative location destroyed mid-progress | `location_destroyed` failure condition triggers. Initiative fails gracefully. |
| Agent enters encounter while initiative active | Initiative has `occupiedUntilTick` — agent should be skipped by encounter pipeline. If somehow enrolled, initiative status untouched until next progress check. |
| Initiative outcome fails (e.g., sublocation creation fails) | Log warning, mark initiative completed anyway (partial outcome). Don't crash the tick. |
| Template references unknown outcome type | Skip that outcome, emit warning trace. Other outcomes still apply. |
| `activeInitiative` property is malformed | Parse defensively. On failure, clear the property and emit error trace. Agent resumes normal behavior. |
| Divine action targets agent without/with initiative | Target filter prevents invalid targeting. If somehow bypassed, action is no-op. |

---

## NFP Compliance

| # | Priority | Status |
|---|----------|--------|
| 1 | Tunability | PASS — 11 named constants covering scoring, timing, costs, and divine action parameters |
| 2 | Inspectability | PASS — 4 trace types cover full lifecycle. Initiative state visible in debug panel and agent inspection. |
| 3 | Determinism | PASS — Duration variance uses seeded PRNG. Candidate scoring deterministic. Checkpoint rolls seeded. |
| 4 | Fail-soft | PASS — see table above. Tick loop never crashes from initiative failures. |
| 5 | Narrative > mechanics | PASS — Initiative prose authored per template. Chronicle entries tell stories. Sphere coloring on initiative prose. |
| 6 | Additive | PASS — New types, new phase, new templates. No existing systems modified destructively. Initiative candidates injected alongside encounter candidates. |
| 7 | Performance | PASS — Candidate generation is O(agents × templates) where templates = 6. Progression phase is O(agents with active initiatives). Both negligible. |

---

## Implementation Order for CC

1. Define `InitiativeTemplate` and `InitiativeProgress` types (new `src/types/initiative.ts`)
2. Create 6 initiative template definitions (new `src/data/initiative-templates.ts`)
3. Create `generateInitiativeCandidates()` (new `src/engine/initiativeCandidates.ts`)
4. Wire initiative candidates into `phaseAgentDecision` scoring pipeline
5. Create `phaseInitiativeProgress()` (new `src/engine/phaseInitiativeProgress.ts`)
6. Wire `phaseInitiativeProgress` into orchestrator after Phase 2b
7. Create outcome executor (new `src/engine/initiativeOutcomes.ts`)
8. Create initiative prose content (new `src/data/initiative-prose.ts`)
9. Add "Inspire Initiative" and "Sabotage Initiative" divine action templates
10. Add initiative indicator to AgentPanel UI
11. Add initiative events to chronicle pipeline
12. Add active initiative badge to LocationView
13. Extend debug panel for initiative inspection
14. Write tests: candidate generation, progression, outcomes, failure conditions, scoring integration
15. Smoke test via CLI: `tick 50`, check `agents` for active initiatives, `events` for initiative chronicle entries
16. Visual verification: `?view=game&seeded` — check AgentPanel shows initiative progress

## Estimated Scope

~3 CC sessions. Bulk is Phase 2–4 (candidate generation + progression + outcomes). Content is lighter than THR-28 since there are only 6 templates vs 30 encounter templates.
