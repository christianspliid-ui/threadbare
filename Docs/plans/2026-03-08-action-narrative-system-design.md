# Action Narrative System — Design Document

**Date:** 2026-03-08
**Status:** Approved
**Scope:** Agenda layer, decay curve, narrative beats, ascendant feedback, UI changes

---

## Problem Statement

When the player executes an intervention (Persuade, Intimidate, etc.), the current system:
1. Deducts essence and rolls detection — but **never modifies the world graph**
2. Shows a one-line message (`"Persuade target (undetected)"`) — no rich narrative
3. Offers no meaningful choice — the intervention type determines a fixed, random effect
4. Never updates the ascendant's stats — `interventionHistory` is defined but empty

The fully-written effects engine (`interventionEffects.ts`, 766 lines) with 8 per-type handlers, value drifts, trait applications, and strategy overrides is **exported but never called**. The `encounterMode` choice (Go to Them / Summon) is accepted by the UI but not passed to execution.

### Design Goal

Every player action should feel like a story beat: the player chooses *what* to push a mortal toward (the agenda), sees a contextual narrative description of what happens, and observes readable behavioral change in the target — strong at first, fading to a whisper over time.

---

## Decision 1: Agenda System (Player Choice Layer)

**What:** When the player clicks an action card, before confirming cost/risk, they choose from 2-4 **agendas** — contextual options for *what direction* to push the target.

**Each agenda combines:**

| Component | Example | Source |
|-----------|---------|--------|
| Value direction | `greed_generosity → greed` | Player's choice |
| Reach boost | Gold reach +0.3 | Derived from value pair |
| Behavior tag | `"wealth-seeking"` | Content data |
| Narrative hook | `"golden visions of wealth and dominion"` | Content data |

**Agenda generation is contextual**, not a fixed list. The system examines:
- Target agent's **archetype** (Conqueror gets dominance/ambition agendas; Healer gets compassion/devotion)
- Target agent's **current top values** (don't offer what they're already maxed on)
- Player's **primary sphere** (Mind-aligned god gets more subtle agendas; Force-aligned gets blunt ones)
- **Intervention type** (Persuade = value-drift agendas; Intimidate = fear-based agendas; Inspire = capability-boost agendas)

**Replaces:** The current `selectValuePairs(count, seed)` random selection. Player agency replaces PRNG.

**Content package:** New `agenda-content.ts` with ~40 agenda templates organized by intervention type × value pair, each with narrative hook + behavior tag.

---

## Decision 2: Exponential Decay Curve

**What:** Replace binary `ticksRemaining` with a smooth exponential decay.

**Formula:**
```
currentStrength = max(minimumStrength, initialStrength × e^(-decayRate × ticksElapsed))
```

**Constants per intervention type:**

| Type | initialStrength | decayRate | minimumStrength | maxDuration |
|------|-----------------|-----------|-----------------|-------------|
| Dream | 0.50 | 0.15 | 0.03 | 20 |
| Persuade | 0.70 | 0.10 | 0.05 | 30 |
| Deceive | 0.70 | 0.08 | 0.05 | 35 |
| Intimidate | 0.90 | 0.12 | 0.04 | 25 |
| Inspire | 0.80 | 0.15 | 0.03 | 20 |
| Coincidence | 0.60 | 0.20 | 0.02 | 15 |
| Omen | 0.50 | 0.10 | 0.05 | 25 |
| Afflict/Bless | 0.75 | 0.08 | 0.06 | 30 |

**Behavior timeline (Persuade example):**
- Tick 0-3: Strong push (strength 0.70 → 0.52). Agent visibly changes behavior.
- Tick 4-10: Noticeable fade (0.52 → 0.26). Agent still influenced but returning to baseline.
- Tick 11-25: Gentle nudge (0.26 → 0.06). Background whisper, barely perceptible.
- Tick 26-30: Minimum strength (0.05). Persistent lean until maxDuration removes it.

**Modified `DivineInfluenceEntry`:**
```typescript
interface DivineInfluenceEntry {
  id: string;
  interventionType: InterventionType;
  sphere: SphereName;
  tickApplied: number;
  // NEW: decay curve parameters (replace ticksRemaining)
  initialStrength: number;
  decayRate: number;
  minimumStrength: number;
  maxDuration: number;
  // Existing effect data
  valueDrifts?: Partial<Record<ValuePair, number>>;
  reachBoost?: { reach: string; bonus: number };
  behaviorTag?: string;
  traitId?: string;
  personalityBoost?: number;
  strategyOverride?: string;
  // NEW: agenda reference
  agendaId?: string;
}
```

**New helper:**
```typescript
function getCurrentStrength(influence: DivineInfluenceEntry, currentTick: number): number {
  const elapsed = currentTick - influence.tickApplied;
  if (elapsed >= influence.maxDuration) return 0; // Expired
  return Math.max(
    influence.minimumStrength,
    influence.initialStrength * Math.exp(-influence.decayRate * elapsed)
  );
}
```

**Integration point:** `buildValueOverlay()` in `interventionEffects.ts` multiplies each drift by `getCurrentStrength()` instead of applying at full magnitude. Same for reach boosts.

---

## Decision 3: Contextual Narrative Beats

**What:** Replace the one-line `"Persuade target (undetected)"` with a 2-3 sentence narrative beat that incorporates the agent's archetype, the chosen agenda, and the sphere vocabulary.

**Template structure (enhanced):**

```
[Opening: intervention type + sphere metaphor]
[Middle: agent archetype reaction + agenda effect description]
[Closing: decay hint — "though time will dull its edge" / "for now"]
```

**Example templates for Persuade + ambition agenda + Conqueror archetype:**
- "You thread {sphere_adj} visions of {agenda_hook} into {agent}'s thoughts. The conqueror's eyes sharpen — already, they calculate new conquests. {decay_hint}"
- "{agent} stirs as {sphere_adj} whispers of {agenda_hook} take hold. The {archetype} in them responds with fierce hunger. {decay_hint}"

**Template variables resolved from existing content:**
- `{sphere_adj}` → from `SPHERE_VOCABULARY[sphere].adjectives` (narrative-content.ts)
- `{agenda_hook}` → from agenda's narrativeHook field
- `{agent}` → actor name
- `{archetype}` → from archetype-content.ts toneKeywords
- `{decay_hint}` → pool of 5-6 closing phrases ("though time will dull the edge", "for now, at least", "the seed is planted — what grows is uncertain")

**Detection addendum:** If detected, append: "But {detector} noticed the threads of divine influence. Your hand has been seen."

**Rendered as:** A highlighted NarrativeLog entry with sphere-colored left border, significance 0.8 (above routine, below chronicle). Auto-opens NarrativeLog pill if closed.

**Content scope:** ~40 new templates in `intervention-feedback-content.ts` organized as `AGENDA_CONSEQUENCE_TEMPLATES[interventionType][agendaCategory][]`.

---

## Decision 4: Ascendant Stat Feedback

**What:** Interventions feed back into the ascendant's identity, not just drain essence.

**Two feedback channels:**

### 4a. Sphere Affinity Shift
Each intervention adds a small permanent bump to the ascendant's sphere alignment:
- `ASCENDANT_AFFINITY_GAIN = 0.02` per intervention on the agenda's primary sphere
- Stored on `AscendantProperties.sphereAlignment` (already exists as a `Record<SphereName, number>`)
- Capped at ±1.0 per sphere (existing constraint)

Over 20+ interventions using Gold-sphere agendas, the god becomes measurably Gold-attuned. This feeds into:
- Wheel slot generation (sphere-aligned slots could become cheaper/more available)
- Narrative voice (god's sphere shapes how consequences are described)
- Metaprogression (World-Soul records sphere affinity as part of fundament)

### 4b. Intervention History
Populate `AscendantProperties.interventionHistory: Record<InterventionType, number>`:
- Increment on each successful intervention
- Feeds mandate evaluation (some mandates require "perform N interventions")
- Feeds rival detection sensitivity (more interventions = higher baseline detection)
- Feeds cycle-end scoring

**No negative ascendant feedback** from detection — that's already handled by rival reactions and doom clock. Keeping ascendant feedback positive-only means every intervention feels like progress.

---

## Decision 5: UI Flow Changes

**Current flow:**
```
ActionCard click → InterventionConfirm (cost/risk) → Execute → One-line log
```

**New flow:**
```
ActionCard click → AgendaPicker (2-4 choices) → InterventionConfirm (cost/risk/agenda) → Execute → Narrative Beat
```

### AgendaPicker Component
- **Triggers:** When player clicks an action card that has an interventionType
- **Display:** Small overlay/popover showing 2-4 agenda cards
- **Each agenda card shows:** Name (e.g. "Whisper Ambition"), value direction icon, affected reach, one-line flavor text
- **Selection:** Click selects, then transitions to InterventionConfirm
- **Dismiss:** Escape or click-outside cancels

### Modified InterventionConfirm
- **Adds:** Selected agenda name + narrative preview (first line of consequence)
- **Retains:** Essence cost, detection risk, range status, confirm/cancel buttons
- **Local encounter mode:** Now properly passed to execution (wiring the existing but disconnected parameter)

### Enhanced NarrativeLog Entry
- **Sphere-colored left border** (matches intervention sphere)
- **Slightly larger text** than routine events
- **Auto-opens** NarrativeLog pill if it was closed
- **Significance 0.8** to ensure it sorts above routine tick events

---

## Decision 6: Wire the Effects Engine

The existing `applyInterventionEffects()` in `interventionEffects.ts` gets called from `handleInterventionConfirm()` in `useAgentInteraction.ts` after `executeIntervention()` succeeds.

**Modifications to the effects engine:**
1. Accept new `agenda` parameter (value direction, reach boost, behavior tag)
2. Use agenda's value direction instead of `selectValuePairs()` random selection
3. Populate `DivineInfluenceEntry` with decay curve constants from `DECAY_CONSTANTS[interventionType]`
4. Add `reachBoost` and `behaviorTag` fields to the influence entry
5. Return enhanced consequence message (from new templates)

**Modifications to `buildValueOverlay()`:**
1. Accept `currentTick` parameter
2. Multiply each drift by `getCurrentStrength(influence, currentTick)`
3. Filter out expired influences (elapsed > maxDuration)

**Modifications to action selection pipeline:**
1. Read `reachBoost` from active influences, apply `bonus × currentStrength` to domain capability
2. Read `behaviorTag` from active influences, use as a tie-breaker in action selection when multiple actions have similar scores

---

## Decision 7: Existing Code Leveraged (No Rewrites)

| Existing Asset | Lines | Status | Change Needed |
|---------------|-------|--------|--------------|
| `interventionEffects.ts` | 766 | Orphaned | Wire into hook, add agenda param, add decay constants |
| `intervention-feedback-content.ts` | 170 | Working | Expand templates with agenda-specific variants |
| `DivineInfluenceEntry` type | ~20 | Defined | Add decay fields + agenda fields |
| `buildValueOverlay()` | ~15 | Working | Add currentTick param, multiply by strength |
| `getDivineInfluences()` | ~10 | Working | No change |
| `InterventionConfirm.tsx` | ~200 | Working | Add agenda display, pass encounterMode |
| `CONSEQUENCE_TEMPLATES` | 24 | Working | Expand to ~64 with agenda variants |
| `agentSelection.ts` pipeline | ~300 | Working | Read reachBoost + behaviorTag from influences |

**Net new code:** ~600-800 lines across agenda-content.ts, AgendaPicker component, decay helpers, template expansion, and hook wiring.

---

## Rejected Alternatives

- ❌ **Full LLM-generated prose for every intervention** — too slow for real-time play, breaks determinism
- ❌ **Post-action branching choices** — adds UI complexity without proportional narrative payoff at this stage
- ❌ **Linear decay** (instead of exponential) — doesn't create the "readable immediate effect" followed by graceful fade
- ❌ **Binary on/off timer** (current design) — no nuance, agent either fully influenced or not at all
- ❌ **Fixed agenda lists per intervention type** — misses the opportunity for archetype/value/sphere-contextual generation
- ❌ **Negative ascendant feedback from detection** — already handled by doom/rivals, double-penalizing isn't fun
