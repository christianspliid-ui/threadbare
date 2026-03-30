# M1: World-Soul Connection — Cosmic Metabolism

> Design doc for TB-072. Created 2026-03-28.
> Covers all four phases: M1.1 Tick Integration, M1.2 Sphere Balance Effects, M1.3 UI & Visibility, M1.4 Player Interaction.

## Premise

The World-Soul is the cosmic metabolism of the world. It tracks how sphere balance shifts in response to events — divine actions, agent behavior, doom escalation, encounter outcomes — and feeds those shifts back into downstream systems. Without this wiring, the World-Soul engine (fully built, 338 lines, 24 pure functions, comprehensive tests) sits dormant. Player actions feel local and isolated.

After this milestone, every action shifts cosmic balance, creating consequences the player can see and respond to.

## Existing Infrastructure

| Component | Status | Location |
|-----------|--------|----------|
| `FundamentState` (sphere weights, foundation axes, cycle count) | ✅ Built, initialized in GameState | `src/types/worldSoul.ts`, `src/engine/worldSoul.ts` |
| `ResonanceState` (curated memories) | ✅ Built | Same |
| Sphere relationships (allies, opposites) | ✅ Built | `src/engine/cosmology.ts` |
| `applyFundamentShift()`, `applyBatchShifts()` | ✅ Built & tested | `src/engine/worldSoul.ts` |
| `captureMemory()`, `degradeMemories()` | ✅ Built & tested | Same |
| Orchestrator tick loop (33 phases) | ✅ Running | `src/engine/orchestrator.ts` |
| Prosperity phase | ✅ Running | `src/engine/phaseProsperity.ts` |
| Encounter scoring | ✅ Running | `src/engine/encounterScoring.ts` |
| Agent decision (axiological profiles) | ✅ Running | `src/engine/phaseAgentDecision.ts` |
| Control effects (per-tick divine effects) | ✅ Running | `src/engine/phaseControlEffects.ts` |

**Key insight:** The World-Soul engine is complete. This milestone is primarily *wiring* — connecting shift sources to the fundament, injecting modifiers into downstream systems, and making the results visible.

---

## Phase M1.1 — World-Soul Tick Integration

### Goal

Wire `worldSoul.ts` into the orchestrator so that every tick:
1. Collects `FundamentShift`s from events that occurred this tick
2. Applies them to the fundament via `applyBatchShifts()`
3. Emits a `world_soul_pulse` trace with the full sphere breakdown

### System: Shift Collection

Events that produce `FundamentShift`s:

| Source | `ShiftSource` value | What triggers it | Where to tap |
|--------|-------------------|-----------------|-------------|
| Divine actions resolved | `resolved_action` | Any `UnifiedAction` completes (success or failure) | `phaseUnifiedActionProgress` — after resolution |
| Doom escalation | `doom_escalation` | Doom clock advances a tier | `phaseDoom` — after tier change |
| Mandate progress | `mandate_outcome` | Mandate milestone or completion | `phaseMandate` — after milestone |
| Rival actions | `rival_action` | Rival performs an action | `phaseRivalActions` — after action |
| Encounter resolution | `resolved_action` | An encounter step completes with sphere-tagged rewards | `phaseEncounterProgressionV2` — after step resolution |
| Control effects active | `resolved_action` | Per-tick sphere drain from sustained control effects | `phaseControlEffects` — after payment |

### Shift Magnitude Computation

Each shift source produces sphere deltas based on the action's `sphereAffinity` and outcome.

**For resolved actions:**

```typescript
function computeActionShift(
  template: UnifiedActionTemplate,
  outcome: 'success' | 'failure',
): FundamentShift {
  const sphere = template.sphereAffinity;
  if (!sphere || !isCreationSphere(sphere)) return NO_SHIFT;

  const magnitude = outcome === 'success'
    ? ACTION_SHIFT_SUCCESS
    : ACTION_SHIFT_FAILURE;

  return {
    source: 'resolved_action',
    sphereDeltas: {
      [sphere]: magnitude,
      [SPHERE_OPPOSITES[sphere]!]: -magnitude * OPPOSITION_ECHO_RATIO,
    },
  };
}
```

**Constants table — Shift magnitudes:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `ACTION_SHIFT_SUCCESS` | 0.008 | Sphere weight boost when a sphere-aligned action succeeds |
| `ACTION_SHIFT_FAILURE` | 0.003 | Smaller boost even on failure (the sphere was invoked) |
| `OPPOSITION_ECHO_RATIO` | 0.4 | How much of a shift echoes negatively into the opposing sphere |
| `DOOM_SHIFT_PER_TIER` | 0.015 | Entropy sphere boost per doom tier escalation |
| `DOOM_FOUNDATION_SHIFT` | 0.02 | Chaos←→order axis shift per doom escalation (toward chaos) |
| `MANDATE_SHIFT_MILESTONE` | 0.010 | Sphere boost when mandate milestone achieved |
| `MANDATE_SHIFT_COMPLETION` | 0.025 | Larger boost on mandate completion |
| `RIVAL_SHIFT_MAGNITUDE` | 0.006 | Sphere shift from rival actions |
| `ENCOUNTER_SHIFT_PER_STEP` | 0.004 | Sphere shift when encounter step resolves |
| `CONTROL_SHIFT_PER_TICK` | 0.001 | Tiny per-tick shift from sustained control effects (cumulative over many ticks) |
| `FOUNDATION_SHIFT_CAP_PER_TICK` | 0.05 | Maximum total foundation axis change per tick (prevents runaway) |
| `SPHERE_WEIGHT_SHIFT_CAP_PER_TICK` | 0.03 | Maximum total sphere weight change per tick |

**For doom escalation:**

```typescript
function computeDoomShift(previousTier: number, newTier: number): FundamentShift {
  const tierDelta = newTier - previousTier;
  return {
    source: 'doom_escalation',
    foundationAxis: 'chaos_order',
    foundationDelta: -DOOM_FOUNDATION_SHIFT * tierDelta, // toward chaos (negative)
    sphereDeltas: {
      entropy: DOOM_SHIFT_PER_TIER * tierDelta,
      life: -DOOM_SHIFT_PER_TIER * tierDelta * OPPOSITION_ECHO_RATIO,
    },
  };
}
```

**For encounters:**
Encounter steps carry a `sphere` property on their template. When a step resolves, emit a shift toward that sphere. The shift is smaller than divine actions — agents acting in the world shifts the cosmos subtly, whereas divine intervention shifts it directly.

**Tracing — `world_soul_shift` trace:**

```typescript
interface WorldSoulShiftTrace {
  category: 'world_soul_shift';
  tick: number;
  source: ShiftSource;
  /** Which action/encounter/event produced this shift */
  sourceId: string;
  /** The shift that was applied */
  shift: FundamentShift;
  /** Sphere weights after application */
  resultingWeights: Record<SphereName, number>;
  /** Foundation balances after application */
  resultingFoundations: FoundationBalances;
}
```

**Fail-soft — Shift collection:**

| Failure | Fallback | Consequence |
|---------|----------|-------------|
| Action template has no `sphereAffinity` | Skip shift (return `NO_SHIFT`) | Many templates are sphere-neutral; this is the common case |
| `sphereAffinity` is an elder sphere (chaos/order/light/darkness) | Skip sphere weight delta, still apply foundation axis shift if applicable | Elder spheres don't participate in the 8-sphere weight system |
| Shift would push sphere weight below 0.01 | `normalizeSphereWeights()` floors at 0.01 (already implemented) | Prevents sphere extinction |
| More shifts in one tick than expected (>20) | Apply all, then cap total delta per tick | `SPHERE_WEIGHT_SHIFT_CAP_PER_TICK` prevents runaway |
| `worldSoul` undefined on GameState | Initialize with `createDefaultFundament()` | Backward compat with old saves |

**PRNG callouts:** None in M1.1. Shift computation is deterministic arithmetic — same events always produce same shifts.

### System: Orchestrator Phase — `phaseWorldSoul`

New phase at position **9.5** (after `phaseHexState` at 9, before `phaseMagicalSaturation` at 9.2). Rationale: runs after all action/encounter/doom/mandate phases have completed their work for this tick, collecting all shifts accumulated during the tick.

**Implementation approach:** Rather than modifying every upstream phase to return shifts, use a **shift accumulator** pattern:

```typescript
/** Accumulated shifts for the current tick, reset at phase start */
interface TickShiftAccumulator {
  shifts: FundamentShift[];
}

/** Called by upstream phases to register a shift */
export function registerWorldSoulShift(
  accumulator: TickShiftAccumulator,
  shift: FundamentShift,
): void {
  if (shift.sphereDeltas || shift.foundationDelta !== undefined) {
    accumulator.shifts.push(shift);
  }
}
```

The accumulator lives on `GameState` as a transient field (`pendingWorldSoulShifts: FundamentShift[]`), similar to how `pendingHexMutations` works. Upstream phases push shifts; `phaseWorldSoul` consumes and clears them.

**Phase implementation:**

```typescript
export function phaseWorldSoul(state: GameState): Partial<GameState> {
  const shifts = state.pendingWorldSoulShifts ?? [];
  if (shifts.length === 0) {
    return { pendingWorldSoulShifts: [] }; // no-op
  }

  // Cap total deltas per tick
  const cappedShifts = capShiftsPerTick(shifts);

  // Apply all shifts
  const newFundament = applyBatchShifts(
    state.worldSoul.fundament,
    cappedShifts,
  );

  // Emit pulse trace
  const pulseTrace: WorldSoulPulseTrace = {
    category: 'world_soul_pulse',
    tick: state.tick,
    shiftsApplied: cappedShifts.length,
    shiftsCapped: shifts.length - cappedShifts.length,
    sphereWeights: { ...newFundament.sphereWeights },
    foundations: { ...newFundament.foundations },
    dominantSphere: getDominantSphere(newFundament),
    recessiveSphere: getRecessiveSphere(newFundament),
    harmonyIndex: computeHarmonyIndex(newFundament),
  };

  return {
    worldSoul: {
      ...state.worldSoul,
      fundament: newFundament,
    },
    pendingWorldSoulShifts: [],
    recentEvents: [
      ...state.recentEvents,
      // Only emit player-visible event on significant shifts
      ...maybeEmitSphereShiftEvent(state, newFundament, pulseTrace),
    ],
  };
}
```

**Tracing — `world_soul_pulse` trace (per-tick summary):**

```typescript
interface WorldSoulPulseTrace {
  category: 'world_soul_pulse';
  tick: number;
  shiftsApplied: number;
  shiftsCapped: number;
  sphereWeights: Record<SphereName, number>;
  foundations: FoundationBalances;
  dominantSphere: SphereName;
  recessiveSphere: SphereName;
  /** 0.0 = perfectly balanced, 1.0 = one sphere dominates completely */
  harmonyIndex: number;
}
```

### System: Harmony Index

A single scalar that captures how balanced or imbalanced the world's sphere weights are. Used by downstream systems and UI.

```typescript
/**
 * Compute how far the sphere distribution is from perfect balance.
 * 0.0 = perfect balance (all spheres equal).
 * 1.0 = maximum imbalance (one sphere has all weight).
 * Uses normalized standard deviation of sphere weights.
 */
export function computeHarmonyIndex(fundament: FundamentState): number {
  const weights = SPHERE_NAMES.map(s => fundament.sphereWeights[s]);
  const mean = 1 / SPHERE_NAMES.length; // 0.125
  const variance = weights.reduce((sum, w) => sum + (w - mean) ** 2, 0) / weights.length;
  const stddev = Math.sqrt(variance);
  // Normalize: max possible stddev when one sphere = 1.0, others ≈ 0
  const maxStddev = Math.sqrt((1 - mean) ** 2 / SPHERE_NAMES.length + (SPHERE_NAMES.length - 1) * mean ** 2 / SPHERE_NAMES.length);
  return Math.min(1.0, stddev / maxStddev);
}
```

**Constants table — Harmony:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `HARMONY_EVENT_THRESHOLD` | 0.05 | Minimum harmony index change per tick to emit a player-visible event |
| `DOMINANCE_THRESHOLD` | 0.20 | Sphere weight above which a sphere is considered "dominant" (balanced = 0.125) |
| `RECESSION_THRESHOLD` | 0.06 | Sphere weight below which a sphere is considered "recessive" |

### System: Memory Capture

At the end of `phaseWorldSoul`, check whether any significant events this tick warrant a `ResonanceMemory`:

| Condition | Memory type | Significance |
|-----------|------------|-------------|
| A sphere crosses `DOMINANCE_THRESHOLD` for first time | `sphere_dominance` | 0.7 |
| Divine action shifts foundation axis by > 0.03 in one tick | `divine_intervention` | 0.8 |
| Doom escalates to tier 3+ | `doom_scar` | 0.9 |
| Mandate completes | `mandate_triumph` | 0.85 |

**Constants table — Memory capture:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `MEMORY_DOMINANCE_SIGNIFICANCE` | 0.7 | Significance of a sphere achieving dominance |
| `MEMORY_DIVINE_SIGNIFICANCE` | 0.8 | Significance of a major divine intervention |
| `MEMORY_DOOM_SIGNIFICANCE` | 0.9 | Significance of doom reaching critical tier |
| `MEMORY_MANDATE_SIGNIFICANCE` | 0.85 | Significance of mandate completion |
| `MEMORY_FOUNDATION_SHIFT_THRESHOLD` | 0.03 | Minimum single-tick foundation shift to capture |

**PRNG callouts:** None. Memory capture is deterministic based on threshold checks.

**Fail-soft — Memory capture:**

| Failure | Fallback | Consequence |
|---------|----------|-------------|
| Resonance at capacity (10 memories) | Replace lowest effective significance (existing behavior) | Old memories naturally displaced |
| No qualifying events this tick | Skip capture | Most ticks won't capture memories — this is normal |

---

## Phase M1.2 — Sphere Balance Effects

### Goal

World-Soul sphere balance modifies three downstream systems: prosperity, encounter weighting, and agent behavior. The world *reacts* to its own cosmic state.

### System: Prosperity Harmonic

Sphere balance modifies the prosperity equilibrium target at each settlement.

**Design:** The prosperity phase already computes an equilibrium target from 6 inputs (carrying capacity, trade, factions, corruption, divine influence, unrest). We add a 7th: **sphere harmonic**.

Each settlement has a `sphereAffinity` (the dominant sphere in its hex's sphere influence, or the settlement's location node sphere property). The prosperity harmonic compares this local affinity to the global sphere balance:

- If the settlement's sphere is globally dominant → prosperity target gets a bonus (the cosmos favors this kind of place)
- If the settlement's sphere is globally recessive → prosperity target gets a penalty (the cosmos is hostile to this energy)
- Neutral balance → no modifier

```typescript
/**
 * Compute prosperity modifier from World-Soul sphere state.
 * Returns a value in [-PROSPERITY_HARMONIC_MAX, +PROSPERITY_HARMONIC_MAX].
 */
export function computeProsperityHarmonic(
  locationSphere: SphereName | undefined,
  fundament: FundamentState,
): number {
  if (!locationSphere) return 0;

  const weight = fundament.sphereWeights[locationSphere];
  const balanced = 1 / SPHERE_NAMES.length; // 0.125
  const deviation = weight - balanced;

  // Scale: at max deviation (~0.875), returns full PROSPERITY_HARMONIC_MAX
  return clamp(
    deviation * PROSPERITY_HARMONIC_SCALE,
    -PROSPERITY_HARMONIC_MAX,
    PROSPERITY_HARMONIC_MAX,
  );
}
```

**Injection point:** `phaseProsperity.ts`, `computeEquilibriumTarget()` function, after the divine bonus computation (line ~307). Add the harmonic as an additive component to the target.

**Constants table — Prosperity harmonic:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `PROSPERITY_HARMONIC_SCALE` | 80.0 | Converts sphere weight deviation into prosperity target points |
| `PROSPERITY_HARMONIC_MAX` | 10.0 | Cap on prosperity harmonic modifier (±10 prosperity target) |

**Example:** If Life sphere has weight 0.25 (dominant) and a settlement is Life-aligned:
- deviation = 0.25 - 0.125 = 0.125
- harmonic = 0.125 × 80 = 10.0 (capped at 10)
- Settlement prosperity target raised by 10

If Entropy is recessive at 0.04 and a settlement is Entropy-aligned:
- deviation = 0.04 - 0.125 = -0.085
- harmonic = -0.085 × 80 = -6.8
- Settlement prosperity target lowered by 6.8

**Tracing:** The existing `prosperity_tick` trace should be extended with a `sphereHarmonic` field showing the applied modifier.

**Fail-soft:**

| Failure | Fallback | Consequence |
|---------|----------|-------------|
| Location has no sphere affinity | Return 0 (no modifier) | Many settlements are sphere-neutral |
| World-Soul not initialized | Return 0 | Backward compat |
| Harmonic exceeds cap | Clamped to ±`PROSPERITY_HARMONIC_MAX` | Prevents extreme prosperity swings |

**PRNG callouts:** None. Pure arithmetic.

### System: Encounter Sphere Resonance

Global sphere balance biases which encounters agents pursue. When a sphere is dominant in the cosmos, encounters aligned with that sphere are subtly more attractive (the world is primed for that kind of activity).

**Design:** Inject an additive score bonus in `scoreAndSelect()` based on the match between the encounter's sphere and the global sphere weights.

```typescript
/**
 * Compute encounter scoring bonus from World-Soul resonance.
 * Encounters whose sphere matches the world's dominant spheres score higher.
 */
export function computeEncounterResonance(
  encounterSphere: SphereName | undefined,
  fundament: FundamentState,
): number {
  if (!encounterSphere) return 0;

  const weight = fundament.sphereWeights[encounterSphere];
  const balanced = 1 / SPHERE_NAMES.length;
  const deviation = weight - balanced;

  // Positive deviation → sphere is dominant → encounters score higher
  // Negative deviation → sphere is recessive → encounters score lower
  return deviation * ENCOUNTER_RESONANCE_SCALE;
}
```

**Injection point:** `encounterScoring.ts`, `scoreAndSelect()`, after the faction scoring boost (line ~319). Add resonance as an additive component to `finalScore`.

**Constants table — Encounter resonance:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `ENCOUNTER_RESONANCE_SCALE` | 2.0 | Converts sphere weight deviation into encounter score bonus |
| `ENCOUNTER_RESONANCE_FLOOR` | -0.15 | Minimum resonance score (prevents sphere recession from completely blocking encounters) |

**Example:** If Force sphere has weight 0.22 and an encounter is Force-aligned:
- deviation = 0.22 - 0.125 = 0.095
- resonance = 0.095 × 2.0 = 0.19 (additive to final score)

This is a gentle nudge, not a hard filter. The encounter scoring system already has values typically in the 0.1–2.0 range, so a ±0.19 modifier is meaningful but not overwhelming.

**Tracing:** Extend the existing `encounter_scoring` trace's per-candidate breakdown with a `sphereResonance` field.

**Fail-soft:**

| Failure | Fallback | Consequence |
|---------|----------|-------------|
| Encounter has no sphere | Return 0 | Some encounters are sphere-neutral |
| Resonance would push score below 0 | Score is already floored at `IDLE_SCORE_THRESHOLD` (0.0001) | Encounters never get negative scores |

**PRNG callouts:** None.

### System: Agent Axiological Drift

Global sphere balance exerts a subtle pressure on all agents' axiological profiles. In a Force-dominant world, agents lean slightly more toward ambition and action. In a Life-dominant world, agents lean more toward nurturing and preservation.

**Design:** Add a World-Soul overlay to the existing `resolveProfile()` function, which already applies divine influence overlays. This is the same pattern — an additive shift to axiological pair values.

**Sphere → Axiological pair mapping:**

| Dominant sphere | Axiological pair affected | Direction of drift |
|----------------|--------------------------|-------------------|
| Force | `mercy_ambition` | +ambition |
| Matter | `loyalty_ambition` | +loyalty |
| Energy | `mercy_ambition` | +ambition (weaker than Force) |
| Life | `mercy_ambition` | +mercy |
| Mind | `tradition_progress` | +progress |
| Spirit | `tradition_progress` | +tradition |
| Time | `loyalty_ambition` | +loyalty (weaker than Matter) |
| Entropy | `mercy_ambition` | +ambition (different: ruthlessness) |

```typescript
/**
 * Compute axiological drift from World-Soul state.
 * Returns partial axiological profile with drift deltas.
 */
export function computeWorldSoulValueDrift(
  fundament: FundamentState,
): Partial<AxiologicalProfile> {
  const drift: Partial<AxiologicalProfile> = {};

  for (const sphere of SPHERE_NAMES) {
    const weight = fundament.sphereWeights[sphere];
    const balanced = 1 / SPHERE_NAMES.length;
    const deviation = weight - balanced;

    if (Math.abs(deviation) < DRIFT_ACTIVATION_THRESHOLD) continue;

    const mapping = SPHERE_DRIFT_MAP[sphere];
    if (!mapping) continue;

    const currentDrift = drift[mapping.pair] ?? 0;
    drift[mapping.pair] = currentDrift + deviation * mapping.direction * AXIOLOGICAL_DRIFT_SCALE;
  }

  // Clamp all drifts
  for (const pair of Object.keys(drift) as (keyof AxiologicalProfile)[]) {
    drift[pair] = clamp(drift[pair]!, -AXIOLOGICAL_DRIFT_MAX, AXIOLOGICAL_DRIFT_MAX);
  }

  return drift;
}
```

**Injection point:** `encounterScoring.ts`, `resolveProfile()` function (line ~203). After applying divine influence overlays via `buildValueOverlay()`, apply World-Soul drift additively.

**Constants table — Axiological drift:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `AXIOLOGICAL_DRIFT_SCALE` | 1.5 | Converts sphere weight deviation into axiological value shift |
| `AXIOLOGICAL_DRIFT_MAX` | 0.15 | Maximum drift per axiological pair from World-Soul |
| `DRIFT_ACTIVATION_THRESHOLD` | 0.03 | Minimum sphere weight deviation before drift activates (prevents noise from balanced states) |

**Example:** If Force is at weight 0.22 (deviation +0.095, above threshold 0.03):
- mapping: `mercy_ambition`, direction +1 (toward ambition)
- drift = 0.095 × 1 × 1.5 = 0.1425 → clamped to 0.1425
- All agents lean 0.14 toward ambition on the mercy-ambition axis

This is a *global* bias — every agent feels it. It represents the world's cosmic mood. Individual divine influences and personal axiological profiles still dominate individual agent behavior.

**Tracing:** Extend existing `encounter_scoring` trace with a `worldSoulDrift` field showing applied pair drifts.

**Fail-soft:**

| Failure | Fallback | Consequence |
|---------|----------|-------------|
| World-Soul not initialized | Return empty drift `{}` | No modification |
| Drift + divine overlay exceeds profile range [-1, 1] | Axiological values are already clamped in `resolveProfile` | Existing safeguard handles it |
| All spheres balanced (none above threshold) | Return empty drift | No modification — this is the intended behavior at equilibrium |

**PRNG callouts:** None. Pure arithmetic.

### System: Terrain Drift (Stretch Goal)

Extreme sphere imbalance slowly shifts terrain types. High Entropy → fertile land degrades toward barren. High Life → barren land blooms toward fertile.

**Design deferred to M1.2b** — this is the stretch goal noted in the roadmap. The core M1.2 effects (prosperity, encounters, agent behavior) provide sufficient cosmic feedback. Terrain drift is additive and can land in a follow-up phase if the core systems feel good.

**Sketch (not for initial implementation):** `phaseHexState` already handles terrain mutations. Add a condition that checks sphere imbalance against `TERRAIN_DRIFT_THRESHOLD` (0.30 — a single sphere holding 30%+ of cosmic weight) and probabilistically mutates hex terrain toward the sphere's associated terrain type.

---

## Phase M1.3 — UI & Player Visibility

### Design Principle: Prose-First, No Numbers

The player never sees sphere weights, harmony indices, or modifier values. All World-Soul effects are communicated through **narrative prose with Interactive Prose Keywords (IPK)** — sphere names and concepts rendered in their canonical color, bold, underlined, and tooltippable. The player learns by reading; the prose *is* the interface.

Full IPK specification: `Docs/ui-patterns.md § 19. Interactive Prose Keywords (IPK)`

### System: World-Soul HUD Indicator

A compact prose status line in the game chrome. Positioned near the existing DoomBar and EssencePanel.

**Design:** A one-line poetic status describing the current cosmic state. The dominant sphere name is rendered as an IPK keyword (bold, underlined, sphere-colored, tooltippable).

**Example status lines (driven by harmony index thresholds):**

| State | Example text |
|-------|-------------|
| Balanced (harmony < 0.15) | "The spheres rest in quiet balance." |
| Tilted (0.15–0.35) | "The winds of **Force** blow across the world." |
| Dominant (0.35–0.55) | "**Entropy** gnaws at the world's foundations." |
| Extreme (> 0.55) | "The cosmos trembles beneath the weight of **Mind**." |

If two spheres are close in dominance, the status can mention both: "**Force** and **Matter** contend for the world's soul."

Foundation axis states produce additional flavor when exceeding threshold: "An ancient **Order** hums beneath all things." / "The old structures fray — **Chaos** seeps through the cracks."

**Component:** `WorldSoulIndicator.tsx` in `src/components/Game/`

**Rendering location:** GameView HUD area (top bar, alongside DoomBar).

**Constants table — Status thresholds:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `HARMONY_DISPLAY_BALANCED` | 0.15 | Harmony index below this shows balanced prose |
| `HARMONY_DISPLAY_TILTED` | 0.35 | Harmony index in [balanced, tilted] shows tilted prose |
| `HARMONY_DISPLAY_DOMINANT` | 0.55 | Harmony index above tilted shows dominant prose |
| `FOUNDATION_DISPLAY_THRESHOLD` | 0.15 | Foundation axis value must exceed this to add foundation flavor |

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| World-Soul undefined | Show "The spheres rest in quiet balance." |
| No dominant sphere (all equal) | Show balanced prose, no sphere keyword |

### System: World-Soul in HexChronicle — The Soul Layer

The hex chronicle's "The Soul" paragraph is the primary surface for detailed World-Soul effects at a specific location. When the player inspects a hex, the Soul layer describes how the cosmic state affects *this place specifically*.

**Prose generation:** The soul paragraph combines:
1. **Local sphere influence** (already exists — sphere pills showing local influence)
2. **Global World-Soul effects** (NEW) — how the cosmic sphere balance impacts this settlement

**Example soul paragraph with IPK keywords:**

> The deep currents of **Life** run strong through Thornvale's roots, yet the wider world's appetite for **Force** presses against this place. The settlement's people grow restless — the old patience of the grove feels distant, as if the cosmos itself has forgotten the quiet rhythms of growth. Trade suffers when the world turns its attention to conflict, and the land's natural abundance cannot fully shield its people from the cosmic tide.

In this paragraph:
- "**Life**" and "**Force**" are IPK keywords — bold, underlined, sphere-colored, tooltippable
- The prose conveys the mechanical reality (Force dominance is penalizing this Life-aligned settlement's prosperity) without showing any numbers
- Hovering "**Force**" shows: "The sphere of motion, momentum, and raw physical power. Force-dominant lands breed ambition and conflict."
- Hovering "**Life**" shows: "The sphere of growth, healing, and living things. Where Life is strong, settlements flourish and the land blooms."

**Implementation:** Extend the existing soul layer prose resolver to accept `worldSoulState` and generate sphere-comparative prose. The prose resolver already has access to local sphere influence data — this adds the global context.

### System: World-Soul in Action Previews

When the player is about to perform a sphere-aligned action, the confirmation UI shows a brief prose line describing the cosmic implication:

> "This rite will strengthen **Life**'s hold on the world."

Or for actions that oppose the current dominance:

> "**Force** reigns — but this act of **Life** pushes back against the tide."

This tells the player their actions have cosmic consequences *before* they commit. The sphere keywords are IPK-styled.

### System: Chronicle Integration

Significant World-Soul events generate narrative chronicle entries with IPK keywords:

| Event | Chronicle entry (with IPK) |
|-------|--------------------------|
| Sphere achieves dominance | "The sphere of **Force** swells with power, its influence reshaping the essence of the world." |
| Sphere enters recession | "The presence of **Spirit** fades from the world — its whispers grow faint." |
| Foundation axis shifts | "An ancient pull toward **Order** settles over all things, like a law written in the bones of the earth." |
| Major imbalance event | "The world's energies churn and struggle — the cosmic balance grows volatile." |

**Implementation:** `maybeEmitSphereShiftEvent()` in `phaseWorldSoul` generates `TickEvent`s with sphere keywords marked for IPK rendering.

**Notification channel:** `world_soul` category — defaults to chronicle-only (no toast/alert) to avoid notification fatigue from per-tick shifts. Players can enable toasts via notification preferences (TB-067).

### System: Concept Tooltip Registry

Central data file mapping sphere identifiers to prose tooltip content. This is the single source of truth for what hovering a sphere keyword shows.

```typescript
// src/data/concept-tooltips.ts
export const CONCEPT_TOOLTIPS: Record<string, { identity: string; implication: string }> = {
  'sphere:force': {
    identity: 'The sphere of motion, momentum, and raw physical power.',
    implication: 'Force-dominant lands breed ambition and conflict. Settlements may struggle with unrest but attract bold adventurers.',
  },
  'sphere:matter': {
    identity: 'The sphere of substance, solidity, stone, and metal.',
    implication: 'Where Matter holds sway, the land is rich in resources and construction thrives — but rigidity can stifle change.',
  },
  'sphere:energy': {
    identity: 'The sphere of heat, fire, lightning, and vitality.',
    implication: 'Energy-rich lands crackle with potential. Commerce and industry flourish, but recklessness follows close behind.',
  },
  'sphere:life': {
    identity: 'The sphere of growth, healing, and living things.',
    implication: 'Where Life is strong, settlements flourish and the land blooms. When Life wanes, growth falters and healing comes slowly.',
  },
  'sphere:mind': {
    identity: 'The sphere of thought, reason, and knowledge.',
    implication: 'Mind-touched lands produce scholars and innovators. People question tradition and seek progress — sometimes at the cost of wisdom.',
  },
  'sphere:spirit': {
    identity: 'The sphere of the divine, the transcendent, and the soul.',
    implication: 'Spirit-rich lands are places of faith and mystery. The sacred is near, but the mundane is easily neglected.',
  },
  'sphere:time': {
    identity: 'The sphere of temporal flow, causality, and change.',
    implication: 'Where Time runs strong, things shift and evolve swiftly. Loyalty endures — but so do grudges.',
  },
  'sphere:entropy': {
    identity: 'The sphere of decay, dissolution, and returning to nothing.',
    implication: 'Entropy gnaws at all things. Infrastructure crumbles, prosperity fades — but from ruin, new possibilities emerge.',
  },
  'foundation:chaos': {
    identity: 'The primordial principle of possibility, disruption, and raw potential.',
    implication: 'In a chaotic world, anything can happen. Structures are fragile but creativity flourishes.',
  },
  'foundation:order': {
    identity: 'The primordial principle of structure, law, and stability.',
    implication: 'An ordered world resists change. Institutions endure, traditions hold — but stagnation threatens.',
  },
  'foundation:light': {
    identity: 'The principle of revelation, clarity, and truth.',
    implication: 'Under Light, secrets are scarce and knowledge spreads freely. Deception falters but so does mystery.',
  },
  'foundation:darkness': {
    identity: 'The principle of concealment, mystery, and the unknown.',
    implication: 'In Darkness, the hidden thrives. Intrigue and shadow operations flourish, but trust is hard to come by.',
  },
};
```

**Rule:** Every sphere and foundation must have tooltip content before M1.3 ships. Missing tooltip = broken learning loop.

### System: Debug Panel — World-Soul Tab

New DebugPanel ViewMode: `world-soul`. This is the *only* place numbers appear — it's developer-facing, not player-facing.

Shows:

1. **Live sphere weights** — All 8 spheres with current weight, deviation from balanced, and trend (↑/↓/→)
2. **Foundation axes** — Current values with history sparkline
3. **Harmony index** — Current value with history sparkline
4. **Shift log** — Last 20 `FundamentShift`s with source, deltas, and resulting weights
5. **Active modifiers** — Current prosperity harmonic, encounter resonance, and axiological drift values being applied downstream
6. **Resonance memories** — Current memory store with significance and degradation

**Component:** `WorldSoulDebugTab.tsx` — added to DebugPanel's ViewMode options.

**Fail-soft:**

| Failure | Fallback |
|---------|----------|
| No shifts this session | Show "No shifts yet" with initial state |
| Trace buffer overflow | Show most recent 20 entries |

---

## Phase M1.4 — Player Interaction

### Goal

Connect existing divine hex actions to the World-Soul so that player actions directly shift global sphere balance, and add awareness mechanics so the player can *feel* the World-Soul.

### System: Action → World-Soul Wiring

The following existing action templates should produce `FundamentShift`s when resolved:

| Template ID | Sphere affinity | Shift on success |
|------------|----------------|-----------------|
| All templates with `sphereAffinity` | Per template | `ACTION_SHIFT_SUCCESS` toward that sphere |
| `hex.sense_leylines` | (diagnostic) | No shift — this is observation, not intervention |
| `hex.shift_dominion` (if exists) | Target sphere | Larger shift (`ACTION_SHIFT_SUCCESS × 2`) — this is explicitly about shifting cosmic balance |

**Implementation:** The shift accumulator pattern from M1.1 handles this automatically — `phaseUnifiedActionProgress` already processes action resolutions. We just need to call `computeActionShift()` in the resolution path and push the result to `pendingWorldSoulShifts`.

### System: World-Soul Awareness Prose

As sphere balance shifts, the game's narrative prose subtly reflects the cosmic mood:

- **High Life:** Descriptions mention lush growth, vibrant colors, healing winds
- **High Entropy:** Descriptions mention decay, rust, crumbling, fading
- **High Force:** Descriptions mention tension, pressure, the air feeling thick with potential energy
- **High Mind:** Descriptions mention clarity, sharpness, the world feeling intelligible

**Implementation:** Extend `enrichProse()` with a `worldSoulContext` that provides sphere-derived adjectives and mood words. The existing prose pipeline already supports variable substitution — we add new variables:

| Variable | Source | Example value |
|----------|--------|--------------|
| `{cosmic_mood}` | Dominant sphere prose table | "vibrant and teeming with life" |
| `{cosmic_tension}` | Harmony index | "uneasy" / "volatile" / "harmonious" |
| `{dominant_sphere_adj}` | Dominant sphere | "forceful" / "entropic" / "mindful" |

**Constants table — Prose:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `PROSE_MOOD_REFRESH_TICKS` | 10 | How often to recalculate cosmic mood strings (avoid per-tick string allocation) |

**PRNG callouts:** If multiple mood phrases exist per sphere, use seeded PRNG to select one. `rng` from game state seed.

---

## Wiring Section

### Per-module wiring (referencing `Docs/plans/wiring-checklist.md`):

#### `phaseWorldSoul` (new orchestrator phase)

| Surface | Detail |
|---------|--------|
| **Orchestrator** | New phase at position 9.5. Called after `phaseHexState` (9), before `phaseMagicalSaturation` (9.2). |
| **UI rendering** | Produces `TickEvent`s consumed by `NarrativeLog` and `ToastStack`. WorldSoulIndicator reads `worldSoul` from GameState. |
| **GameState flow** | Reads: `pendingWorldSoulShifts`, `worldSoul`. Writes: `worldSoul` (updated fundament), `pendingWorldSoulShifts` (cleared), `recentEvents` (sphere shift events). |
| **Traces** | Emits `world_soul_pulse` (per tick) and `world_soul_shift` (per shift). |
| **Debug** | New `WorldSoulDebugTab` in DebugPanel with ViewMode `world-soul`. |
| **Prose** | Sphere shift chronicle events use `enrichProse()`. |
| **Player controls** | WorldSoulIndicator click opens WorldSoulModal. Notification category `world_soul` in preferences. |
| **Prerequisite health** | Requires at least one shift source firing. Verification: `pendingWorldSoulShifts.length > 0` at least once per 10 ticks on a standard game. If all shift sources are wired, divine actions alone ensure throughput. |

#### `computeProsperityHarmonic` (modifier injection)

| Surface | Detail |
|---------|--------|
| **Orchestrator** | No new phase. Injected into existing `phaseProsperity` at `computeEquilibriumTarget()`. |
| **GameState flow** | Reads: `worldSoul.fundament.sphereWeights`. Writes: nothing (pure function, result used by existing prosperity computation). |
| **Traces** | Extends existing `prosperity_tick` trace with `sphereHarmonic` field. |
| **Throughput** | Prosperity phase fires every tick. No upstream concern. |

#### `computeEncounterResonance` (modifier injection)

| Surface | Detail |
|---------|--------|
| **Orchestrator** | No new phase. Injected into existing `scoreAndSelect()` in encounter scoring. |
| **GameState flow** | Reads: `worldSoul.fundament.sphereWeights`. Writes: nothing (pure function). |
| **Traces** | Extends existing `encounter_scoring` trace with `sphereResonance` field. |
| **Throughput** | Encounter scoring fires whenever agents make decisions (~every 3-5 ticks per agent). No upstream concern. |

#### `computeWorldSoulValueDrift` (modifier injection)

| Surface | Detail |
|---------|--------|
| **Orchestrator** | No new phase. Injected into existing `resolveProfile()` in encounter scoring. |
| **GameState flow** | Reads: `worldSoul.fundament`. Writes: nothing (pure function). |
| **Traces** | Extends existing `encounter_scoring` trace with `worldSoulDrift` field. |

#### `WorldSoulIndicator` (new UI component)

| Surface | Detail |
|---------|--------|
| **UI rendering** | New component in GameView HUD area. Must be rendered in GameView JSX. |
| **GameState flow** | Reads: `worldSoul.fundament` (sphere weights, foundations), computed `harmonyIndex`. |
| **Player controls** | Click opens WorldSoulModal. |

#### `WorldSoulModal` (new UI component)

| Surface | Detail |
|---------|--------|
| **UI rendering** | Modal triggered by WorldSoulIndicator click. Must be rendered in GameView JSX with show/hide state. |
| **GameState flow** | Reads: `worldSoul` (full state including resonance). |

#### `WorldSoulDebugTab` (new debug component)

| Surface | Detail |
|---------|--------|
| **Debug** | New ViewMode `world-soul` added to DebugPanel. |
| **GameState flow** | Reads: `worldSoul`, trace buffer for `world_soul_pulse` and `world_soul_shift` categories. |

### Throughput Gate

| Upstream dependency | Expected throughput | Verification method |
|--------------------|--------------------|--------------------|
| Divine actions resolved | ≥1 per 20 ticks (player is active) | Check `pendingWorldSoulShifts` contains `resolved_action` entries |
| Encounters resolving steps | ≥3 per 30 ticks | Check `pendingWorldSoulShifts` contains encounter-sourced entries |
| Doom escalation | 1 per doom cycle (variable) | Check doom tier changes emit shifts |
| Combined: shifts per tick | ≥1 shift per 5 ticks average | `world_soul_pulse` trace shows `shiftsApplied > 0` regularly |

---

## Implementation Ordering

| Phase | Scope | Depends on | Estimated effort |
|-------|-------|-----------|-----------------|
| **M1.1a** | New file `worldSoulModifiers.ts` with shift computation functions. Add `pendingWorldSoulShifts` to GameState. | Nothing | Small |
| **M1.1b** | Wire shift registration into upstream phases (action resolution, doom, mandate, rival, encounter, control effects). | M1.1a | Medium — touches 6 files |
| **M1.1c** | New `phaseWorldSoul` in orchestrator. Harmony index. Memory capture. | M1.1a, M1.1b | Medium |
| **M1.2a** | `computeProsperityHarmonic` — inject into `phaseProsperity`. | M1.1c | Small |
| **M1.2b** | `computeEncounterResonance` — inject into `scoreAndSelect`. | M1.1c | Small |
| **M1.2c** | `computeWorldSoulValueDrift` — inject into `resolveProfile`. | M1.1c | Small |
| **M1.3a** | `WorldSoulIndicator` + `WorldSoulModal` UI components. | M1.1c | Medium |
| **M1.3b** | `WorldSoulDebugTab` in DebugPanel. | M1.1c | Small |
| **M1.3c** | Chronicle entries and notification integration. | M1.1c, M1.3a | Small |
| **M1.4a** | Verify action templates produce shifts (integration test). | M1.1b | Small |
| **M1.4b** | World-Soul awareness prose variables. | M1.1c | Small |

**Critical path:** M1.1a → M1.1b → M1.1c → (M1.2a, M1.2b, M1.2c, M1.3a, M1.3b in parallel)

## Testing Strategy

### Unit Tests

| Module | What to test |
|--------|-------------|
| `computeActionShift()` | Correct sphere deltas for success/failure, opposition echo, elder sphere handling |
| `computeDoomShift()` | Correct entropy boost and chaos foundation shift per tier delta |
| `computeHarmonyIndex()` | Returns 0.0 for balanced weights, approaches 1.0 for single-sphere dominance |
| `computeProsperityHarmonic()` | Positive for dominant sphere, negative for recessive, 0 for neutral/missing |
| `computeEncounterResonance()` | Additive bonus for dominant sphere encounters, penalty for recessive |
| `computeWorldSoulValueDrift()` | Correct pair mapping, threshold activation, clamping |
| `phaseWorldSoul()` | Applies shifts, clears accumulator, emits traces, captures memories |
| `capShiftsPerTick()` | Enforces per-tick caps correctly |

### Contract Tests

| Producer → Consumer | What to verify |
|--------------------|---------------|
| `phaseUnifiedActionProgress` → `pendingWorldSoulShifts` | Resolved actions with sphere affinity produce valid FundamentShift entries |
| `phaseWorldSoul` → `phaseProsperity` | Updated sphere weights feed correct harmonic into next tick's prosperity |
| `phaseWorldSoul` → `encounterScoring` | Updated sphere weights feed correct resonance into next scoring pass |
| `phaseWorldSoul` → `WorldSoulIndicator` | State shape matches what the UI component expects |

### Integration Tests

| Test | What to verify |
|------|---------------|
| 30-tick simulation with divine actions | Sphere weights drift away from balanced, harmony index increases, prosperity modifiers appear in traces |
| Doom escalation → entropy spike | Doom tier increase produces entropy-heavy world, encounters shift toward entropy-aligned types |
| Memory capture over 50 ticks | At least one resonance memory captured when sphere crosses dominance threshold |

---

## NFP Compliance Summary

| # | Priority | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Tunability | **PASS** | 23 named constants across all systems. Every magnitude, threshold, cap, and scale factor is tunable. |
| 2 | Inspectability | **PASS** | Two new trace categories (`world_soul_pulse`, `world_soul_shift`). Three existing traces extended. New DebugPanel tab. |
| 3 | Determinism | **PASS** | All shift computation is pure arithmetic. One PRNG callout for prose mood selection (uses game seed). |
| 4 | Fail-soft | **PASS** | Fail-soft tables for every system. Missing data → zero modifier. Undefined state → default fundament. Caps prevent runaway. |
| 5 | Narrative > mechanical | **PASS** | Prose awareness system, chronicle entries, and sphere mood provide narrative interpretation of mechanical state. |
| 6 | Additive > destructive | **PASS** | All changes are additive: new phase, new field on GameState, modifier injection into existing functions. No existing functions are rewritten. |
| 7 | Performance budget | **PASS** | Shift collection is O(shifts per tick) — typically <10. Harmony index is O(8) arithmetic. Prosperity/encounter modifiers are O(1) per call. No optimization needed. |
