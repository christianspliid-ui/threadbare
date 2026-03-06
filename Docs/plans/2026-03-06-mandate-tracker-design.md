# Mandate Tracker Design

> **Phase 6D remaining** — Victory Mandate content, generation, real evaluation, and tracker UI.

## Problem

The mandate system has full type definitions (`MandateDefinition`, `MandateState`, `MandateStage`) and engine functions (`createMandateState`, `evaluateMandate`, `advanceMandateStage`), but:

1. No mandate content — no actual mandate templates exist
2. No generator — `mandateDefinition` and `mandateState` are initialized as `null` in GameView
3. Fake progress — the orchestrator's `phaseMandate` ticks progress by +0.002/tick instead of evaluating real conditions
4. No UI — the player has no way to see their win condition or progress

## Design Decisions

### Decision 1: Curated mandate pool over procedural generation

**Chosen:** 9 handcrafted mandate templates (3 per type: graph_state, narrative, sphere_dominance).

**Why:** Mandates fire once per run — variety matters less than quality. A curated pool guarantees every mandate reads well narratively and has mechanically fair conditions. Procedural generation would need extensive tuning for something that triggers once.

### Decision 2: All conditions must be graph-verifiable today

**Chosen:** Every mandate condition uses types the engine can already evaluate: `node_count`, `edge_count`, `sphere_weight`, `actor_tier`.

**Why:** No `custom` conditions that fake progress. If a condition says "control 5 settlements," the engine actually counts settlement nodes. This means we skip complex narrative mandates ("unite three warring kingdoms") until faction diplomacy is built. All 9 mandates are mechanically honest from tick 1.

**Rejected:** Mixed pool with some aspirational `custom` conditions using placeholder progress ticking.

### Decision 3: Minimal top-bar tracker with click-to-expand

**Chosen:** Compact horizontal bar beside DoomBar showing name + stage pips + progress bar. Click to expand a popover with full condition checklist.

**Why:** Doom and mandate are the two main tension drivers — placing them together reinforces the "race against time" framing. Minimal by default keeps the top bar clean; the popover provides full detail on demand.

**Rejected:** Left sidebar placement (crowds existing panels), always-visible 3-stage timeline (too much horizontal space).

### Decision 4: Sphere-weighted mandate selection

**Chosen:** Generator filters by sphere affinity — mandates thematically aligned with the player's primary/secondary sphere get higher PRNG weight.

**Why:** A Life-sphere Ascendant should be more likely to get "raise agents to high influence tiers" than "corrupt the World-Soul." The alignment makes the mandate feel like a natural extension of the player's identity, not a random assignment.

### Decision 5: Replace fake progress with real evaluation

**Chosen:** Rewire `phaseMandate` in the orchestrator to call `evaluateMandate()` (which already exists) instead of the current `progress + 0.002` placeholder.

**Why:** The evaluation function exists and works. It just needs to be called. This makes mandate progress meaningful — it changes based on what actually happens in the world.

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `src/data/mandate-content.ts` | 9 mandate templates with sphere affinities |
| `src/engine/mandateGenerator.ts` | `generateMandate()` — sphere-weighted PRNG selection |
| `src/components/Game/MandateTracker.tsx` | Compact bar + expanded popover |

### Modified Files

| File | Change |
|------|--------|
| `src/engine/orchestrator.ts` | Replace fake progress with `evaluateMandate()` + `advanceMandateStage()` |
| `src/components/Game/GameView.tsx` | Call `generateMandate()` in init, render `<MandateTracker>` beside `<DoomBar>` |

## Mandate Content Templates

### Graph-State Mandates (3)

1. **"Dominion of Stone"** — Control 5+ settlements across 3 different terrain types
   - Setup: Control 2 settlements
   - Escalation: Control 4 settlements across 2 terrains
   - Culmination: Control 5+ settlements across 3+ terrains
   - Sphere affinity: Matter, Force

2. **"The Builder's Legacy"** — Create 8 permanent structures (temples, fortifications, monuments)
   - Setup: Create 2 structures
   - Escalation: Create 5 structures
   - Culmination: Create 8+ structures
   - Sphere affinity: Matter, Energy

3. **"Web of Allegiance"** — Establish 6 alliance edges between factions
   - Setup: 2 alliances formed
   - Escalation: 4 alliances formed
   - Culmination: 6+ alliances formed
   - Sphere affinity: Mind, Spirit

### Sphere Dominance Mandates (3)

4. **"Tide of Life"** — Life sphere influence ≥ 0.5 across 60% of world regions
   - Setup: Life influence ≥ 0.3 in 30% of regions
   - Escalation: Life influence ≥ 0.4 in 45% of regions
   - Culmination: Life influence ≥ 0.5 in 60% of regions
   - Sphere affinity: Life

5. **"The Entropic Cascade"** — Entropy sphere becomes globally dominant
   - Setup: Entropy influence in 20% of regions
   - Escalation: Entropy influence in 40% of regions
   - Culmination: Entropy is highest sphere in 50%+ of regions
   - Sphere affinity: Entropy

6. **"Illumination"** — Energy sphere saturates 4+ regions to ≥ 0.7 influence
   - Setup: Energy ≥ 0.5 in 1 region
   - Escalation: Energy ≥ 0.6 in 2 regions
   - Culmination: Energy ≥ 0.7 in 4+ regions
   - Sphere affinity: Energy

### Narrative Mandates (3) — using actor_tier conditions

7. **"The Ascendant's Champion"** — Raise an agent to Aspect tier (tier 5)
   - Setup: Have 1 agent at tier 2+ (Aligned)
   - Escalation: Have 1 agent at tier 3+ (Devoted) AND 3 agents at tier 2+
   - Culmination: Have 1 agent at tier 5 (Aspect)
   - Sphere affinity: Spirit, Mind

8. **"The Devoted Circle"** — Achieve tier 3+ influence with 5 agents simultaneously
   - Setup: 2 agents at tier 2+
   - Escalation: 3 agents at tier 3+
   - Culmination: 5 agents at tier 3+
   - Sphere affinity: any (universal)

9. **"The Shadow Sovereign"** — Maintain tier 4+ on 3 agents while stealth exposure < 0.3
   - Setup: 1 agent at tier 3+ with exposure < 0.5
   - Escalation: 2 agents at tier 4+ with exposure < 0.4
   - Culmination: 3 agents at tier 4+ with exposure < 0.3
   - Sphere affinity: Time, Entropy

## Mandate Generator

```
generateMandate(cosmology, archetype, seed) → MandateDefinition
```

1. Build affinity scores: each template has 1-2 sphere affinities. Score = 3 if matches primary, 2 if matches secondary, 1 otherwise.
2. Use seeded PRNG (mulberry32) to weighted-random select one template.
3. Clone the template, assign `id: 'mandate.{type}.{index}'`.
4. Return the full `MandateDefinition`.

## MandateTracker Component

### Props

```typescript
interface MandateTrackerProps {
  definition: MandateDefinition;
  state: MandateState;
}
```

### Compact Bar (always visible)

- Mandate name in amber text (Cinzel font, matching DoomBar)
- Three small stage pips: ○ ○ ○ — filled/highlighted for completed/current stages
- Progress bar for current stage, colored by mandate type:
  - graph_state: `#d4a574` (warm amber — Stone/Matter feel)
  - sphere_dominance: `#5c6bc0` (indigo — cosmic feel)
  - narrative: `#9c27b0` (purple — story/Spirit feel)
- Click anywhere to toggle expanded popover

### Expanded Popover

- Mandate type badge (e.g., "GRAPH-STATE" in type color)
- Full description text
- 3-stage timeline: Setup → Escalation → Culmination
  - Completed stages: muted, checkmark
  - Current stage: highlighted, expanded to show conditions
  - Future stages: dimmed
- Current stage conditions:
  - ✓ met condition (green text)
  - ○ unmet condition (amber text)
  - Each condition shows its `description` string

### Threadbare Styling

- `bg-stone-800/95` background matching DoomBar
- `border-b border-amber-900/30` bottom border
- Amber text hierarchy: `text-amber-100` for name, `text-amber-400/70` for secondary
- Cinzel font for mandate name

## Orchestrator Changes

Replace in `phaseMandate`:

```typescript
// OLD: fake progress
progress: Math.min(1.0, state.mandateState.progress + 0.002)

// NEW: real evaluation
const evaluated = evaluateMandate(state.graph, state.mandateDefinition, state.mandateState, state.tick);
const advanced = evaluated.progress >= 1.0 ? advanceMandateStage(evaluated, state.tick) : evaluated;
return { mandateState: advanced };
```

## GameView Changes

In `initializeGameState`:

```typescript
const mandateDef = generateMandate(cosmology, archetype, seed);
const mandateState = createMandateState(mandateDef.id, 0);
// Set on GameState instead of null
```

In render, beside DoomBar:

```tsx
<div className="w-full px-4 py-2 bg-stone-800/95 border-b border-amber-900/30 flex gap-4">
  <DoomBar definition={gameState.doomDefinition} state={gameState.doomClock} />
  {gameState.mandateDefinition && gameState.mandateState && (
    <MandateTracker
      definition={gameState.mandateDefinition}
      state={gameState.mandateState}
    />
  )}
</div>
```

Note: This means DoomBar and MandateTracker share a parent container. DoomBar currently has its own `w-full` wrapper — we'll need to adjust it to sit inside this shared container.
