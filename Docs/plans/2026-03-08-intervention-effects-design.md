# Intervention Effects & Action Card Feedback — Design Doc

> **Date:** 2026-03-08
> **Status:** Approved
> **Scope:** Visual/audio feedback on action cards, real world-graph effects per intervention type, player-facing consequence messages

## Problem

Two gaps in the current intervention flow:

1. **No feedback**: Clicking a card → confirming → the drawer silently closes. No animation, no sound, no confirmation the player's action registered.
2. **No world impact**: `executeIntervention` deducts essence and logs a generic message, but never modifies the target agent's values, traits, relationships, or behavior. The agent selection pipeline has no concept of "pending divine influence." Actions feel hollow.
3. **No consequence communication**: The player has no idea what their intervention actually *did* to the target. They need a concrete message like "Kael is now more likely to seek alliances" or "Mira has been Afflicted — her combat prowess wanes."

## Design

### Part 1: Action Card Feedback

#### 1A. Visual Feedback (~600ms sequence)

When `handleInterventionConfirm` succeeds:

1. **Card pulse** (0-200ms): The clicked card gets a sphere-colored radial glow that pulses outward (CSS `@keyframes` with `box-shadow` expansion). The glyph scales up 1.2x briefly.
2. **Spent state** (200-400ms): Card transitions to a desaturated "spent" appearance — reduced opacity, subtle checkmark overlay, border color dims.
3. **Drawer close** (400-600ms): Drawer slides down after the visual registers.

Implementation: Add a `playingCard` state to `useAgentInteraction` storing the slot ID being played. ActionCard gets a `playing` prop that triggers the CSS animation. After 600ms timeout, clear `playingCard` and close drawer.

#### 1B. Audio Feedback

Web Audio API synthesis — no external files:

- **Cast sound**: Short rising sine wave (~200ms, 220Hz → 440Hz) with sphere-colored pitch offset. Force/Matter = lower base, Mind/Spirit = higher base. Quick exponential decay envelope.
- **Detection overlay**: If detected, layer a secondary discordant tone (detuned by ~30Hz) that creates a subtle "warning" quality.

Implementation: A `useInterventionAudio` hook wrapping `AudioContext`. Called from `handleInterventionConfirm`. Memoize the context across renders. Respect browser autoplay policy (create context on first user gesture).

#### 1C. Consequence Message

Replace the current generic `def.description` narrative event with a specific consequence message template system.

Each intervention type has 3-5 message templates that incorporate:
- Target agent name
- The concrete effect applied (value shift direction, trait name, behavioral change)
- Detection status

Examples:
- Dream: "You reach into {agent}'s sleeping mind… {agent} will be drawn toward {shifted_value_direction} in the days ahead."
- Persuade: "Your whispered influence takes hold — {agent} is now more inclined toward {value_label}."
- Intimidate: "{agent} feels a chill of dread. They will avoid reckless action for a time."
- Afflict/Bless: "{agent} has been {Blessed/Afflicted} — their {domain} capabilities are {strengthened/diminished}."
- Coincidence: "Fate bends around {location} — {description of environmental change}."

These are data-driven in a new `intervention-feedback-content.ts` package.

### Part 2: Intervention World Effects

#### 2A. Divine Influence Storage

Add a `divineInfluences` array to agent node properties:

```typescript
interface DivineInfluence {
  id: string;                    // unique ID
  interventionType: InterventionType;
  sphere: SphereName;
  tickApplied: number;
  ticksRemaining: number;        // decremented each tick, removed at 0
  // Type-specific payload:
  valueDrifts?: Partial<Record<ValuePair, number>>;  // for dream/persuade/deceive/intimidate
  traitId?: string;              // for afflict_bless/inspire condition traits
  personalityBoost?: number;     // for inspire_intervention
  strategyOverride?: string;     // for intimidate
}
```

#### 2B. Per-Type Effects

**Dream** (`probability` stage)
- Stores a `divineNudge` with `valueDrifts` — shifts 1-2 axiological values by ±0.10-0.15 for 3 ticks.
- During `runSelectionPipeline`, between goal scoring and personality weights, active dream influences temporarily adjust the agent's axiological profile before scoring.
- Player message: "{agent} will be drawn toward {value_direction} in the days ahead."

**Persuade** (`scoring` stage)
- Shifts 1-2 axiological values by +0.15-0.25 toward the *player's desired direction* (inferred from sphere alignment). Lasts 10-15 ticks.
- Uses `valueDrifts` — applied as a temporary overlay on the axiological profile during action selection.
- Player message: "{agent} is now more inclined toward {value_label} ({shifted_direction})."

**Deceive** (`scoring` stage)
- Same mechanism as Persuade but shifts in a *misaligned* direction — the agent acts on false belief.
- Additionally grants a temporary "Deceived" condition trait (discoverable, 15-20 tick decay).
- If another agent with high Eye domain capability interacts with the target, the deception can collapse early.
- Player message: "{agent} now believes {false_belief}… but the truth may surface."

**Intimidate** (`topN` stage)
- Shifts `courage_prudence` toward prudence by -0.3 for 8-12 ticks.
- If target's `cooperationStrategy` is not `always_defect`, temporarily override it to `grudger` for the same duration.
- Player message: "{agent} feels a chill of dread — they will act with greater caution."

**Inspire** (`personality` stage)
- Grants a temporary "Divinely Inspired" condition trait with +0.2 domain capability bonus to the agent's strongest Reach.
- Sets `personalityBoost` of +0.30 applied during personality weight stage. Lasts 5-8 ticks.
- Player message: "{agent} burns with sudden conviction — their {top_domain} prowess surges."

**Coincidence** (`environment` stage)
- Modifies the *world* rather than the *agent*:
  - Option A: Increase sphere influence on the agent's location (+0.15 for the intervention's sphere)
  - Option B: Create or strengthen a `relates_to` edge between two agents at the location (serendipitous meeting)
  - Option C: Spawn a temporary resource node at the location
- Which option fires depends on local context (PRNG seeded choice).
- Player message: "Fate shifts around {location} — {concrete_description}."

**Omen** (`personality` stage)
- Creates a temporary event node at the target's location connected via `sphere_influence` edge.
- All agents at that location get a mood modifier (slight axiological drift toward the omen's thematic direction) for 5 ticks.
- Affects regional Divine Awareness (increases detection risk for future interventions in the area by +0.05).
- Player message: "An omen manifests at {location} — {omen_description}. All who witness it are moved."

**Afflict/Bless** (`condition` stage)
- Grants a condition trait via `has_trait` edge:
  - **Bless**: "+1 tier effective capability" in the sphere's primary Reach domain for 8-12 ticks.
  - **Afflict**: "-1 tier effective capability" in a domain, plus slight negative axiological drift for 8-12 ticks.
- Trait has `ticksRemaining` on the edge properties; decremented in orchestrator.
- Player message: "{agent} has been {Blessed/Afflicted} — their {domain} is {strengthened/diminished} for a time."

#### 2C. Pipeline Integration

The `runSelectionPipeline` function gets a new optional step between stages 1 (goal alignment) and 2 (disposition): **"Apply Divine Influences"**.

```
For each active DivineInfluence on the actor:
  if influence.valueDrifts:
    temporarily adjust axiological profile values
  if influence.personalityBoost:
    store for use in personality weight stage
  if influence.strategyOverride:
    override cooperation strategy for this tick's disposition check
```

This is a *temporary overlay* — the original profile is not mutated. The influence creates a modified copy used only for this tick's selection.

#### 2D. Decay & Cleanup

In the orchestrator tick loop, add a `phaseDivineInfluenceDecay` phase:
- Walk all agents with `divineInfluences` in their properties
- Decrement `ticksRemaining` on each influence
- Remove influences where `ticksRemaining <= 0`
- Remove condition traits whose `has_trait` edge `ticksRemaining` has expired
- Emit `divine_influence_decay` trace for inspectability

#### 2E. Trace Integration

New trace category: `intervention_effect` emitted when an intervention is applied:
- `interventionType`, `targetAgentId`, `sphere`
- `effects`: list of concrete changes (value drifts, traits granted, strategy overrides)
- `consequenceMessage`: the player-facing message
- `ticksRemaining`: how long the effect lasts

Visible in the Debug Panel under a new renderer.

### Part 3: Constants & Tunability

All magic numbers extracted to a `DIVINE_INFLUENCE_CONSTANTS` object:

```typescript
const DIVINE_INFLUENCE_CONSTANTS = {
  // Duration (ticks)
  DREAM_DURATION: 3,
  PERSUADE_DURATION: 12,
  DECEIVE_DURATION: 18,
  INTIMIDATE_DURATION: 10,
  INSPIRE_DURATION: 6,
  COINCIDENCE_DURATION: 1,  // instant effect
  OMEN_DURATION: 5,
  AFFLICT_BLESS_DURATION: 10,

  // Value drift magnitudes
  DREAM_DRIFT: 0.12,
  PERSUADE_DRIFT: 0.20,
  DECEIVE_DRIFT: 0.20,
  INTIMIDATE_COURAGE_DRIFT: -0.30,

  // Capability modifiers
  INSPIRE_PERSONALITY_BOOST: 0.30,
  BLESS_CAPABILITY_BONUS: 0.20,
  AFFLICT_CAPABILITY_PENALTY: -0.20,

  // Feedback timing (ms)
  CARD_PULSE_MS: 200,
  CARD_SPENT_MS: 200,
  DRAWER_CLOSE_DELAY_MS: 600,

  // Audio
  AUDIO_BASE_FREQ: 220,
  AUDIO_RISE_FREQ: 440,
  AUDIO_DURATION_MS: 200,
  AUDIO_DETECTION_DETUNE: 30,
} as const;
```

## Decisions

1. **Temporary overlay, not mutation**: Divine influences create a temporary modified profile for action selection rather than permanently mutating axiological values. This preserves agent identity while allowing divine nudging. Values "snap back" when the influence expires.

2. **Player-facing consequence messages**: Every intervention produces a concrete, specific message telling the player what changed. No generic "Intervention performed" — the player sees behavioral predictions ("more likely to seek alliances") and mechanical effects ("combat prowess diminished").

3. **Web Audio synthesis over audio files**: Keeps the bundle small, avoids asset management, and allows sphere-colored pitch variation programmatically.

4. **Condition traits via existing has_trait edges**: Afflict/Bless and Inspire use the existing trait system (condition category) rather than inventing a parallel system. This means existing trait-based UI (agent detail panel, tooltips) automatically surfaces them.

5. **Decay in orchestrator tick loop**: All influence expiry runs as a tick phase, keeping it deterministic and inspectable via traces.

6. **Coincidence modifies world, not mind**: This is the most expensive intervention for a reason — it's the only one that changes the environment rather than an agent's psychology. Keeps it distinct from the other 7.

7. **600ms feedback delay before drawer close**: Long enough for the player to see the visual confirmation, short enough to not feel sluggish. Tuneable via constant.

## Files Changed/Created

### New files:
- `src/engine/interventionEffects.ts` — `applyInterventionEffects()` + per-type effect functions
- `src/data/intervention-feedback-content.ts` — consequence message templates, audio config
- `src/components/Game/hooks/useInterventionAudio.ts` — Web Audio synthesis hook

### Modified files:
- `src/types/dream.ts` — `DivineInfluence` interface
- `src/engine/agentSelection.ts` — divine influence overlay in pipeline
- `src/engine/orchestrator.ts` — `phaseDivineInfluenceDecay` tick phase
- `src/components/Game/hooks/useAgentInteraction.ts` — `playingCard` state, delayed close, consequence message
- `src/components/Game/ActionCard.tsx` — `playing` prop, CSS pulse animation
- `src/components/Game/ActionDrawer.tsx` — pass `playingCard` state to cards
- `src/engine/traceBuffer.ts` — `intervention_effect` trace category
- `src/components/Game/DebugPanel.tsx` — intervention effect trace renderer

### Test files:
- `src/engine/__tests__/interventionEffects.test.ts`
- `src/data/__tests__/intervention-feedback-content.test.ts`
- `src/engine/__tests__/interventionEffects-integration.test.ts`
- `src/components/Game/__tests__/ActionCard-feedback.test.tsx`
