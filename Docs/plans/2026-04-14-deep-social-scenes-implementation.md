# Deep Social Scenes — Implementation Plan

> **Date:** 2026-04-14
> **Status:** Implementation Planning
> **Issue:** THR-28
> **Depends on:** THR-27 (Tavern Social Hubs)
> **Blocks:** THR-51 (Agent Initiatives), THR-30 (Secrets & Favors)

---

## Problem

The 14 existing social encounters are 2-step transactions — check, outcome. They read like ATM withdrawals, not conversations. An intimidation encounter is "you glare, they flinch." A negotiation is "you offer, they accept." There's no dramatic arc, no personality-driven pushback, no room for the encounter to go sideways in interesting ways.

The result: the social layer of the chronicle is the least compelling section to read. Exploration and dungeon encounters have multi-step tension. Social encounters don't.

## Solution

Replace the thin 2-step model with rich 3-5 step **social scenes** featuring:
1. **Leverage mechanic** — a running score (0.0–1.0) that accumulates across steps, making early successes pay off later
2. **Personality-driven counter-arguments** — the target agent's axiological profile determines how they push back
3. **Sphere coloring** — the same scene produces different prose per sphere alignment
4. **Group scene resolution** — 3+ agent scenes with per-participant outcomes

---

## Architecture Decision: Leverage as Resolution Modifier

The leverage mechanic needs to influence encounter resolution without creating a parallel system. Two options considered:

**Option A: Leverage as a new field on EncounterProgress, fed into resolution modifiers.**
- Store `leverage: number` on EncounterProgress alongside `currentEncounterIndex`
- Each step's outcome adds to or subtracts from leverage
- Leverage feeds into `computeResolutionModifiers()` as an additive bonus to probability
- Pro: clean integration with existing resolution math. Con: one more field on a hot type.

**Option B: Leverage accumulated via temporary effect/attachment.**
- Each step's success applies a temporary "social leverage" effect
- Effect stacks, read by resolution modifiers on subsequent steps
- Pro: uses existing effect system. Con: heavier, creates transient graph state.

**Chosen: Option A.** Leverage is encounter-local state — it exists only during the scene and doesn't persist in the graph. EncounterProgress is the right home. This keeps it lightweight and deterministic without creating temporary graph nodes.

---

## Implementation Phases

### Phase 1: Leverage Mechanic (Engine)

**1.1 Extend EncounterProgress with leverage state**

File: `src/types/encounter.ts`

```typescript
// Add to EncounterProgress
leverage?: number;  // 0.0–1.0, accumulates across steps in social scenes. Undefined for non-social.
leverageHistory?: Array<{
  stepIndex: number;
  delta: number;
  source: 'step_success' | 'step_failure' | 'bond_bonus' | 'wealth_bonus' | 'power_bonus' | 'secret_bonus';
}>;
```

**1.2 Extend EncounterStep with leverage configuration**

File: `src/types/encounter.ts`

```typescript
// Add to EncounterStep
leverageOnSuccess?: number;  // Leverage gained on success (e.g., +0.15)
leverageOnFailure?: number;  // Leverage lost on failure (e.g., -0.10)
leverageModifiesDifficulty?: boolean;  // If true, accumulated leverage reduces this step's difficulty
leverageDifficultyScale?: number;  // How much leverage affects difficulty (default: 0.3 = 30% reduction at max leverage)
```

**1.3 Wire leverage into encounter resolution**

File: `src/engine/encounter.ts`

In `resolveEncounter()`, before calling `computeResolutionThreshold()`:

1. Check if encounter template has social scene steps with leverage config
2. If `step.leverageModifiesDifficulty`, compute effective difficulty:
   ```
   effectiveDifficulty = baseDifficulty × (1.0 - leverage × leverageDifficultyScale)
   ```
3. Pass modified difficulty to resolution pipeline
4. After resolution, update `progress.leverage`:
   ```
   if success: leverage += step.leverageOnSuccess
   if failure: leverage += step.leverageOnFailure
   leverage = clamp(leverage, 0.0, 1.0)
   ```
5. Record leverage delta in `leverageHistory`

**1.4 Initial leverage from bonds, wealth, and power**

File: `src/engine/socialEncounterGeneration.ts` (or new `src/engine/socialLeverage.ts`)

When a social scene begins (`initiateEncounter` for a social template), compute starting leverage:

```typescript
function computeInitialLeverage(graph: WorldGraph, actorId: string, targetId: string): number {
  let leverage = 0.0;
  
  // Bond strength — existing relationship gives starting advantage
  const trust = getTrust(graph, actorId, targetId);
  if (trust > STRONG_BOND_THRESHOLD) leverage += LEVERAGE_BOND_BONUS;  // +0.10
  
  // Wealth advantage — Gold capability
  const actorWealth = getAgentWealth(graph, actorId);
  const targetWealth = getAgentWealth(graph, targetId);
  if (actorWealth > targetWealth * LEVERAGE_WEALTH_RATIO) leverage += LEVERAGE_WEALTH_BONUS;  // +0.08
  
  // Power advantage — Iron/military capability gap
  const actorPower = computeCapability(graph, actorId, 'iron');
  const targetPower = computeCapability(graph, targetId, 'iron');
  if (actorPower > targetPower + LEVERAGE_POWER_GAP) leverage += LEVERAGE_POWER_BONUS;  // +0.08
  
  // Faction rank advantage
  const actorRank = getHighestFactionRank(graph, actorId);
  const targetRank = getHighestFactionRank(graph, targetId);
  if (actorRank > targetRank + LEVERAGE_RANK_GAP) leverage += LEVERAGE_RANK_BONUS;  // +0.05
  
  return clamp(leverage, 0.0, LEVERAGE_INITIAL_CAP);  // Cap at 0.3 — can't start with more than 30%
}
```

Constants:
| Constant | Default | Purpose |
|----------|---------|---------|
| `LEVERAGE_BOND_BONUS` | 0.10 | Starting leverage from strong trust bond |
| `LEVERAGE_WEALTH_BONUS` | 0.08 | Starting leverage from wealth advantage |
| `LEVERAGE_WEALTH_RATIO` | 1.5 | Wealth must exceed target by this ratio |
| `LEVERAGE_POWER_BONUS` | 0.08 | Starting leverage from military power gap |
| `LEVERAGE_POWER_GAP` | 0.2 | Capability gap threshold for power advantage |
| `LEVERAGE_RANK_BONUS` | 0.05 | Starting leverage from higher faction rank |
| `LEVERAGE_RANK_GAP` | 0.3 | Rank difference threshold |
| `LEVERAGE_INITIAL_CAP` | 0.30 | Maximum starting leverage (can't skip straight to winning) |
| `LEVERAGE_DIFFICULTY_SCALE` | 0.30 | How much max leverage reduces difficulty (30% at leverage 1.0) |
| `LEVERAGE_STEP_SUCCESS` | 0.15 | Default leverage gain per successful step |
| `LEVERAGE_STEP_FAILURE` | -0.10 | Default leverage loss per failed step |

---

### Phase 2: Personality-Driven Counter-Arguments (Engine + Content)

**2.1 Counter-argument selection system**

File: new `src/engine/socialCounterArgument.ts`

When a social scene reaches the "Counter" step (step 4 in the 5-step arc), the target agent selects a counter-argument based on their personality:

```typescript
interface CounterArgumentSet {
  axisId: ValuePair;         // Which personality axis drives this counter
  polePositive: {            // Counter when target leans positive on this axis
    narrative: string;       // Prose template with {target}, {actor} placeholders
    approachVulnerable: ReachDomain[];  // Which approaches work against this counter
    approachResistant: ReachDomain[];   // Which approaches bounce off
  };
  poleNegative: {            // Counter when target leans negative
    narrative: string;
    approachVulnerable: ReachDomain[];
    approachResistant: ReachDomain[];
  };
}

function selectCounterArgument(
  graph: WorldGraph,
  targetId: string,
  encounterType: EncounterType,
  sphereContext: SphereName | undefined,
): CounterArgumentResult {
  const profile = getAxiologicalProfile(graph, targetId);
  // Find the target's most extreme axiological axis (strongest personality signal)
  const dominantAxis = findDominantAxis(profile);
  // Select counter-argument from that axis's pole
  const counterSet = COUNTER_ARGUMENT_LIBRARY[encounterType][dominantAxis.axis];
  const pole = dominantAxis.value > 0 ? counterSet.polePositive : counterSet.poleNegative;
  return {
    narrative: enrichProse(pole.narrative, { target, actor, sphere: sphereContext }),
    vulnerableApproaches: pole.approachVulnerable,
    resistantApproaches: pole.approachResistant,
  };
}
```

**2.2 Counter-argument effect on resolution**

The counter-argument modifies the *next* step's difficulty based on whether the actor's approach (reach) matches the counter's vulnerability or resistance:

- Actor's reach is in `vulnerableApproaches` → difficulty reduced by `COUNTER_VULNERABLE_BONUS` (−10 on legacy scale)
- Actor's reach is in `resistantApproaches` → difficulty increased by `COUNTER_RESISTANT_PENALTY` (+15 on legacy scale)
- Neither → no modification

This creates a rock-paper-scissors dynamic: a courageous target is vulnerable to Shadow (cunning undermines bravery) but resistant to Iron (you can't out-brave the brave). A cunning target is vulnerable to Heart (sincerity disarms manipulation) but resistant to Shadow (can't out-trick the trickster).

**2.3 Counter-argument content tables**

File: new `src/data/counter-argument-content.ts`

One `CounterArgumentSet` per axiological axis × encounter type. For v1, cover the 4 most distinctive axes:

| Axis | Positive Pole | Counter Theme | Vulnerable To | Resistant To |
|------|--------------|---------------|---------------|-------------|
| courage_prudence | Courage | "I'll take my chances" — dismisses caution | Shadow (undermine confidence) | Iron (can't intimidate the brave) |
| courage_prudence | Prudence | "Too risky" — demands guarantees | Gold (sweeten the deal) | Heart (appeals to emotion won't sway the cautious) |
| loyalty_ambition | Loyalty | "My word is my bond" — stands firm with allies | Shadow (reveal ally's betrayal) | Heart (loyalty trumps new friendships) |
| loyalty_ambition | Ambition | "What's in it for me?" — demands personal gain | Gold (match their price) | Star (abstract ideals bore the ambitious) |
| honesty_cunning | Honesty | "Prove it" — demands evidence | Eye (show them the truth) | Shadow (lies enrage the honest) |
| honesty_cunning | Cunning | "Nice try" — sees through the pitch | Heart (genuine emotion surprises the cynic) | Shadow (can't manipulate the manipulator) |
| mercy_ruthlessness | Mercy | "What about the cost?" — worried about harm | Heart (assure no harm) | Iron (threats repel the merciful) |
| mercy_ruthlessness | Ruthlessness | "Weakness" — sees compassion as flaw | Iron (match strength with strength) | Heart (sentiment is irrelevant) |

Each entry gets 3-4 narrative variants for prose variety, sphere-colored by the target's dominant sphere.

Constants:
| Constant | Default | Purpose |
|----------|---------|---------|
| `COUNTER_VULNERABLE_BONUS` | -10 | Difficulty reduction when approach matches counter vulnerability (legacy scale) |
| `COUNTER_RESISTANT_PENALTY` | +15 | Difficulty increase when approach matches counter resistance (legacy scale) |
| `COUNTER_ARGUMENT_LEVERAGE_THRESHOLD` | 0.7 | If leverage exceeds this, counter is suppressed (target is too outmatched to argue) |

---

### Phase 3: Social Scene Templates (Content)

**3.1 Template structure — the 5-step dramatic arc**

All social scene templates follow the same dramatic shape, with steps 4 and 5 being conditional:

```
Step 1: Opening Gambit (establish the ask)
  → Sets scene, reveals intent
  → Leverage: leverageOnSuccess +0.10
  → Reach: varies by encounter type

Step 2: Reading the Room (assess the target)
  → ALWAYS Eye reach — you can't influence what you don't understand
  → Success reveals target's counter-argument type (for player/chronicle)
  → Leverage: leverageOnSuccess +0.15 (information is power)
  → leverageModifiesDifficulty: false (this step isn't about persuasion)

Step 3: The Pitch (make your case)
  → Core persuasion/negotiation/intimidation step
  → Reach: varies by approach (Heart, Shadow, Gold, Iron)
  → leverageModifiesDifficulty: true (accumulated leverage helps here)
  → Leverage: leverageOnSuccess +0.20

Step 4: The Counter (target pushes back) — CONDITIONAL
  → Only fires on partial success in step 3 (success with low margin)
  → Target's personality-driven counter-argument modifies difficulty
  → Reach: must adapt — counter-argument's vulnerable reach is ideal
  → leverageModifiesDifficulty: true

Step 5: Resolution
  → Final outcome: full agreement, partial concession, refusal, or complication
  → leverageModifiesDifficulty: true (full leverage weight here)
  → Outcomes branch by leverage tier:
    - leverage >= 0.7: decisive victory (best outcome, full rewards)
    - leverage 0.4-0.7: negotiated success (moderate outcome)
    - leverage < 0.4: pyrrhic or failed (poor outcome even on success roll)
```

**3.2 Conditional step mechanics**

File: `src/types/encounter.ts`

```typescript
// Add to EncounterStep
conditional?: {
  type: 'leverage_range' | 'partial_success' | 'personality_trigger';
  // For leverage_range: step only fires if leverage is in this range
  leverageMin?: number;
  leverageMax?: number;
  // For partial_success: step fires if previous step's margin was within this range
  marginMin?: number;
  marginMax?: number;
};
```

File: `src/engine/encounter.ts`

In `advanceEncounter()`, before advancing to next step:
1. Check if next step has `conditional` config
2. If conditional not met → skip to the step after (or to resolution)
3. This allows 3-step scenes (gambit → pitch → resolution) when leverage is high, and 5-step scenes when it's contested

**3.3 Template categories — v1 batch (30 templates)**

Group templates by social encounter type, 5-6 per category. Each template is a unique scene with its own narrative, but all follow the 5-step arc structure.

| Category | Templates | Reach Primary | Notes |
|----------|-----------|--------------|-------|
| **Persuasion** (5) | Political Audience, Recruitment Pitch, Mentorship Offer, Romantic Pursuit, Religious Conversion | Heart | Classic social influence |
| **Negotiation** (5) | Tavern Negotiation, Trade Fair, Peace Negotiation, Contract Dispute, Territorial Accord | Gold | Deal-making, mutual benefit |
| **Intimidation** (4) | Confrontation, The Challenge, Protection Racket, Warlord's Demand | Iron | Power plays |
| **Intrigue** (5) | Spy Debrief, Betrayal Reveal, Extortion, The Double Agent, Court Whispers | Shadow | Secrets and manipulation |
| **Ceremony** (4) | Oath Swearing, Trial & Judgment, Coronation, Eulogy/Memorial | Star | Formal social rituals |
| **Community** (4) | Festival/Celebration, War Council, Tavern Confession, Town Assembly | Heart+Eye | Group social events |
| **Investigation** (3) | Interrogation, Reputation Assessment, The Accusation | Eye | Social information-gathering |

Total: 30 templates. Each needs: 5 steps × (narrative + onSuccess + onFailure) × sphere coloring = substantial content authoring. Recommend using the `encounter-pipeline` skill for batch authoring.

**3.4 Sphere coloring tables**

File: new `src/data/social-scene-sphere-coloring.ts`

A lookup table mapping `(approach, sphere)` → prose flavor phrases. The encounter template's narrative uses `{sphere_flavor}` placeholder that resolves via this table.

```typescript
const SPHERE_COLORING: Record<string, Record<SphereName, string>> = {
  persuade: {
    life: 'Together we can grow stronger',
    entropy: 'Without this, everything decays',
    mind: 'Logic demands cooperation',
    force: 'Join me or be left behind',
    order: 'This is the natural hierarchy',
    chaos: 'The old rules are dead — make your own',
    matter: 'The foundation we build will endure',
    energy: 'Feel the pull of this opportunity',
  },
  negotiate: {
    life: 'A deal that nurtures both sides',
    entropy: 'Take what you can before it rots',
    // ... etc
  },
  // intimidate, recruit, confess, accuse, etc.
};
```

---

### Phase 4: Group Scene Resolution (Engine)

**4.1 Extend EncounterProgress for group participants**

File: `src/types/encounter.ts`

```typescript
// Add to EncounterProgress
participantIds?: string[];  // All agents involved (beyond actor + target)
participantOutcomes?: Record<string, {
  success: boolean;
  leverageContribution: number;  // How much this participant shifted leverage
  role: 'initiator' | 'supporter' | 'opponent' | 'observer';
}>;
groupResolutionMode?: 'consensus' | 'majority' | 'best_member' | 'leader_decides';
```

**4.2 Group step resolution**

File: `src/engine/encounter.ts`

For steps in group encounters (`template.isGroupEncounter === true`):

1. **best_member mode** (default for skill checks): resolve using the participant with highest capability in the step's reach. Others contribute via `LEVERAGE_GROUP_SUPPORT_BONUS` per supporter.
2. **consensus mode** (for decisions like "where do we go?"): all participants resolve independently. Need majority success to advance.
3. **leader_decides mode** (for faction conclaves): only the highest-rank participant resolves. Others contribute leverage bonuses.

```typescript
function resolveGroupStep(
  state: GameState,
  progress: EncounterProgress,
  step: EncounterStep,
): GroupResolutionResult {
  const mode = progress.groupResolutionMode ?? 'best_member';
  switch (mode) {
    case 'best_member': {
      const bestId = findBestCapability(state.graph, progress.participantIds, step.reach);
      const result = resolveEncounter(state, { ...progress, actorId: bestId });
      // Other participants add leverage
      const supportBonus = (progress.participantIds.length - 1) * LEVERAGE_GROUP_SUPPORT_BONUS;
      return { ...result, leverageDelta: result.leverageDelta + supportBonus };
    }
    // ... other modes
  }
}
```

Constants:
| Constant | Default | Purpose |
|----------|---------|---------|
| `LEVERAGE_GROUP_SUPPORT_BONUS` | 0.03 | Per-supporter leverage bonus in group scenes |
| `GROUP_SCENE_MIN_PARTICIPANTS` | 3 | Minimum agents for a group scene |
| `GROUP_SCENE_MAX_PARTICIPANTS` | 6 | Maximum agents for a group scene |
| `GROUP_COMPATIBILITY_TRUST_WEIGHT` | 0.5 | How much pairwise trust affects group scoring |

---

### Phase 5: Player Agency — Divine Actions (Player)

**5.1 "Tip the Scales" action**

File: `src/data/unified-action-templates.ts`

```typescript
{
  id: 'action.social.tip_scales',
  name: 'Tip the Scales',
  sphere: 'mind',
  reach: 'shadow',
  essenceCost: 12,
  targetCategories: ['agent'],
  targetFilter: { inSocialScene: true, bonded: true },
  steps: [{
    id: 'tip_scales.whisper',
    name: 'Divine Whisper',
    narrative: 'You breathe a word into the space between thoughts. {target}\'s argument sharpens — or their opponent\'s resolve wavers. The scales of the conversation shift.',
    effects: [{
      type: 'leverage_shift',
      amount: 0.20,  // +20% leverage to the targeted agent's active social scene
      duration: 0,   // Immediate, applies to current scene
    }],
  }],
}
```

**5.2 "Embolden" action**

```typescript
{
  id: 'action.social.embolden',
  name: 'Embolden',
  sphere: 'force',
  reach: 'heart',
  essenceCost: 8,
  targetCategories: ['agent'],
  targetFilter: { inSocialScene: true, bonded: true },
  steps: [{
    id: 'embolden.courage',
    name: 'Divine Courage',
    narrative: 'A warmth fills {target}\'s chest — the certainty that they are not alone. Their voice steadies. Their gaze hardens. They will not be moved.',
    effects: [{
      type: 'counter_resistance',
      // Negates the counter-argument penalty on the next step
      // Target treats all counter-arguments as neutral (no vulnerable/resistant modifiers)
      duration: 1,  // Next step only
    }],
  }],
}
```

**5.3 Wire divine actions into social scene resolution**

File: `src/engine/encounter.ts`

In `resolveEncounter()`, check for active divine effects on the actor:
- `leverage_shift` → add to `progress.leverage` before computing effective difficulty
- `counter_resistance` → skip counter-argument modifier for this step

These use the existing `effectStates` pipeline — the divine action creates a temporary effect, and `computeResolutionModifiers()` reads it.

Constants:
| Constant | Default | Purpose |
|----------|---------|---------|
| `TIP_SCALES_ESSENCE_COST` | 12 | Cost of Tip the Scales action |
| `TIP_SCALES_LEVERAGE_AMOUNT` | 0.20 | Leverage shift applied |
| `EMBOLDEN_ESSENCE_COST` | 8 | Cost of Embolden action |

---

### Phase 6: UI Visibility (UI)

**6.1 Social scene step display**

File: `src/components/Game/EncounterDetail.tsx` (or equivalent)

For bonded agents in active social scenes:
- Show current step name and narrative
- Show leverage bar (0–100% visual, colored by tier: red < 30%, yellow 30-70%, green > 70%)
- Show counter-argument text when step 4 fires

**6.2 Leverage indicator**

Visual: a small bar or gauge next to the encounter detail, similar to a health bar but for social leverage. Color-coded by leverage tier.

**6.3 Chronicle sphere-colored prose**

The chronicle already renders encounter outcome narratives. Sphere coloring is purely a content change — the `{sphere_flavor}` placeholder resolves to different prose, which the existing chronicle renderer displays.

**6.4 Notifications**

Per the Social Fabric visibility spec (already designed):
- Bonded agent in social scene → Alert notification
- Non-bonded agent → Toast
- Outside awareness → Silent chronicle

No new notification types needed — these are `social_encounter` events flowing through the existing notification pipeline.

---

## Wiring Checklist

| Surface | Integration |
|---------|------------|
| **Orchestrator** | No new phase — social scenes are encounters processed by existing encounter progression phases |
| **GameState** | `EncounterProgress` gains `leverage`, `leverageHistory`, `participantIds`, `participantOutcomes`, `groupResolutionMode` |
| **Encounter resolution** | `resolveEncounter()` reads leverage, applies to difficulty. `advanceEncounter()` updates leverage. |
| **Counter-arguments** | New `selectCounterArgument()` function, called during step 4 resolution |
| **Scoring** | `scoreAndSelect()` group compatibility modifier for group scenes |
| **UI: EncounterDetail** | Leverage bar, counter-argument display, sphere-colored prose |
| **UI: Chronicle** | Sphere coloring via placeholder resolution (content change only) |
| **Prose pipeline** | `{sphere_flavor}` placeholder, `{counter_argument}` placeholder |
| **Traces** | Extend encounter resolution trace with leverage, counter-argument data |
| **Debug panel** | Leverage visible in encounter inspection |
| **Player controls** | "Tip the Scales" and "Embolden" divine action templates |

---

## Fail-Soft Table

| Failure | Fallback |
|---------|----------|
| Leverage field missing on EncounterProgress | Treat as 0.0 (no leverage) — encounter resolves normally |
| Target has no axiological profile | Skip counter-argument step (use default difficulty) |
| Sphere coloring lookup misses | Use generic prose (no sphere flavor) |
| Group scene has < 3 participants | Resolve as standard 1v1 scene |
| Conditional step check fails | Skip to next non-conditional step |
| Counter-argument library missing for encounter type | Skip counter step, proceed to resolution |
| Divine action targets agent not in social scene | Action fails with "no active scene" message |

---

## Tracing

Extend encounter resolution trace:
```typescript
interface SocialSceneTrace {
  tick: number;
  category: 'social_scene_resolution';
  encounterId: string;
  actorId: string;
  targetId: string;
  stepIndex: number;
  leverageBefore: number;
  leverageAfter: number;
  leverageSource: string;
  counterArgument?: {
    axis: string;
    pole: string;
    vulnerableTo: string[];
    resistantTo: string[];
    actorApproach: string;
    modifier: number;
  };
  sphereColoring?: SphereName;
  groupParticipants?: string[];
  groupResolutionMode?: string;
  summary: string;
}
```

---

## NFP Compliance

| # | Priority | Status |
|---|----------|--------|
| 1 | Tunability | PASS — 15+ named constants for leverage, counter-arguments, group scenes |
| 2 | Inspectability | PASS — SocialSceneTrace captures leverage, counter-arguments, sphere coloring per step |
| 3 | Determinism | PASS — leverage is computed from graph state + resolution outcomes, all seeded |
| 4 | Fail-soft | PASS — see table above; every new field gracefully degrades to existing behavior |
| 5 | Narrative > mechanics | PASS — sphere coloring, personality-driven counters, leverage-tiered outcomes all serve narrative |
| 6 | Additive | PASS — extends EncounterProgress with optional fields; new templates alongside existing ones |
| 7 | Performance | PASS — leverage is O(1) per step; counter-argument is O(1) lookup; group resolution is O(participants) |

---

## Implementation Order for CC

1. Extend `EncounterProgress` type with leverage and group fields (encounter.ts)
2. Extend `EncounterStep` type with leverage config and conditional step fields
3. Implement leverage computation in `resolveEncounter()` — difficulty modifier and accumulation
4. Implement `computeInitialLeverage()` in new socialLeverage.ts
5. Wire leverage into `initiateEncounter()` — compute starting leverage
6. Implement conditional step skipping in `advanceEncounter()`
7. Build counter-argument selection system (new socialCounterArgument.ts)
8. Author counter-argument content tables (new counter-argument-content.ts)
9. Build sphere coloring lookup table (new social-scene-sphere-coloring.ts)
10. Author 30 social scene templates using `encounter-pipeline` skill (batch: 5-6 per session)
11. Implement group scene resolution in encounter.ts
12. Add "Tip the Scales" and "Embolden" divine action templates
13. Wire divine action effects into social scene resolution
14. Add leverage bar and counter-argument display to encounter UI
15. Extend encounter traces with social scene data
16. Write tests: leverage accumulation, counter-argument selection, conditional steps, group resolution
17. Smoke test via CLI: spawn social encounters, verify leverage progression and counter-arguments
18. Visual verification: check encounter detail shows leverage, sphere-colored prose renders

## Content Authoring Strategy

The 30 templates are the bulk of the work. Recommend:
- **Batch 1 (5 templates):** Persuasion category — establish the pattern
- **Batch 2 (5):** Negotiation — test leverage mechanic with trade encounters
- **Batch 3 (5):** Intrigue — test counter-arguments heavily (Shadow vs everything)
- **Batch 4 (5):** Intimidation — test Iron approach and courage/prudence counter
- **Batch 5 (5):** Ceremony — test group scene resolution with formal events
- **Batch 6 (5):** Community + Investigation — remaining templates

Use `encounter-pipeline` skill for each batch: draft → editorial → systems audit → merge.

## Estimated Scope

~5-7 CC sessions. Engine work (phases 1-2, 4-5) is ~2 sessions. Content authoring (phase 3) is ~3-4 sessions. UI (phase 6) is ~1 session.
