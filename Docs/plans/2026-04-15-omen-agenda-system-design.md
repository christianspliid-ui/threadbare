# Omen Agenda System — THR-19 Design

> **Date:** 2026-04-15
> **Status:** In Design
> **Issue:** [THR-19](https://linear.app/threadbare/issue/THR-19/tb-105-omen-agenda-system)
> **Project:** Thematic Pressure & Living World
> **Depends on:** Doom Clock (✅), Sphere Pressure (✅), Culture/Faction systems (✅)
> **Blocks:** THR-21 (Doom Archetype Identity Pass)

---

## Problem Statement

The simulation has a **macro** pressure system (doom clock — fires escalation cards every ~20 ticks at stage transitions) and **micro** per-agent activity (encounters, actions, movement). But between those scales there's a dead zone: the world doesn't have a legible **current mood**. The player can't tell *what the world fears right now* without opening the doom detail panel and doing arithmetic.

Omen agendas fill that gap. They're short-lived thematic pressure tracks (5–15 ticks) that make diffuse tension into readable beats — the world's weather system for dread, hope, and unease.

**Design goal:** By tick 10, even before the first doom card fires, the player should feel a consistent atmospheric tone from the world. By tick 30, the player should recognize that the world's mood has shifted at least once, and that shift should feel narratively motivated.

---

## Core Concept: Omen Tracks

An **omen track** is an active thematic pressure that lasts 5–15 ticks. At most 2 omen tracks are active simultaneously (one primary, one secondary). When a track expires, a new one is selected based on current world state.

Omen tracks are **not** doom cards. Doom cards are discrete events that fire once at stage transitions. Omen tracks are ambient — they bias systems continuously while active, then fade.

### Omen Track Categories

| Category | Source | Example Tracks | Frequency |
|----------|--------|----------------|-----------|
| **Doom-echo** | Doom archetype + current stage | "Thin Places" (Breach), "The Pull" (Convergence), "Old Debts" (Reckoning) | Always one active from ~tick 5 |
| **Sphere-surge** | When a sphere exceeds dominance threshold in the world-soul | "Verdant Surge" (Life), "Entropic Tide" (Entropy), "Iron Season" (Force) | Reactive, 0–1 active |
| **Cultural** | Faction state, settlement conditions | "War Drums" (faction conflict), "Lean Harvest" (low prosperity), "Festival Season" (high prosperity) | Reactive, 0–1 active |
| **Seasonal** | Pure tick-count cadence (every ~20 ticks) | "The Quiet Before", "The Turning", "The Long Dark" | Rhythmic, always cycling |

**Selection rule:** Primary slot **always prefers doom-echo** when eligible (i.e., a matching archetype+stage template exists). Doom-echo is mandatory for the primary slot from `OMEN_FIRST_ACTIVATION_TICK` onward — seasonal tracks only fill primary when no doom-echo template qualifies (should only happen in the first few ticks before doom stage 0 templates activate, or during brief transition gaps). This ensures THR-21's "felt identity by tick 10–20" goal isn't diluted by generic seasonal atmosphere. Secondary slot holds a sphere-surge or cultural track if conditions are met. If no secondary qualifies, the slot stays empty (silence is a valid omen — absence of secondary pressure means the world is calm in that dimension). Seasonal cadence is instead expressed as a **tonal modifier** on the active doom-echo omen — the seasonal category provides vocabulary overlays rather than competing for the primary slot.

---

## Engine Pillar

### Data Model

```typescript
// ─── Omen Track Definition (content-authored) ──────────────
interface OmenTrackTemplate {
  id: string;                          // e.g., 'omen.breach.thin_places'
  name: string;                        // "Thin Places"
  category: OmenCategory;              // 'doom_echo' | 'sphere_surge' | 'cultural' | 'seasonal'
  /** Which doom archetypes this track applies to (doom_echo only) */
  doomArchetypes?: DoomClockArchetype[];
  /** Which doom stages this track can appear in (doom_echo only) */
  doomStageRange?: [number, number];   // e.g., [0, 2] = whispers–tremors
  /** Sphere trigger condition (sphere_surge only) */
  sphereTrigger?: { sphere: SphereName; minDominance: number };
  /** Cultural trigger condition */
  culturalTrigger?: CulturalTriggerCondition;
  /** Duration range in ticks */
  durationRange: [number, number];     // e.g., [8, 12]
  /** Encounter type biases: positive = more likely, negative = less likely */
  encounterBias: Partial<Record<EncounterType, number>>;
  /** Sphere pressure applied per tick while active */
  spherePressure?: { sphere: SphereName; magnitude: number };
  /** Prose vocabulary bank for enrichProse() injection */
  vocabulary: OmenVocabulary;
  /** Omen beat templates — periodic narrative micro-events */
  beats: OmenBeatTemplate[];
  /** Significance weight for chronicle entries (0–1) */
  chronicleSignificance: number;
}

type OmenCategory = 'doom_echo' | 'sphere_surge' | 'cultural' | 'seasonal';

interface CulturalTriggerCondition {
  type: 'faction_conflict' | 'low_prosperity' | 'high_prosperity' |
        'high_unrest' | 'mass_death' | 'discovery_surge';
  threshold: number;
}

interface OmenVocabulary {
  adjectives: string[];     // Injected into prose: "the {adj} wind..."
  verbs: string[];          // "shadows {verb} across the fields"
  nouns: string[];          // "a {noun} hangs over the settlement"
  atmosphere: string[];     // Full sentence mood fragments for chronicle
}

interface OmenBeatTemplate {
  /** Tick interval between beats (e.g., every 3 ticks) */
  interval: number;
  /** Prose template with placeholders: {location}, {agent}, {sphere} */
  prose: string[];
  /** Significance for TickEvent emission */
  significance: number;
}

// ─── Active Omen State (runtime) ────────────────────────────
interface ActiveOmen {
  templateId: string;
  name: string;
  category: OmenCategory;
  startTick: number;
  duration: number;          // Chosen from durationRange at selection time
  slot: 'primary' | 'secondary';
  /** Accumulated beats emitted (for interval tracking) */
  lastBeatTick: number;
}

// ─── GameState addition ─────────────────────────────────────
// Add to GameState:
interface OmenState {
  primary: ActiveOmen | null;
  secondary: ActiveOmen | null;
  /** History of completed omens for pattern detection (THR-21 hook) */
  history: { templateId: string; startTick: number; endTick: number }[];
}
```

### Orchestrator Phase: `phaseOmenAgenda`

**Slot:** New Phase 1.7 — after `phaseDoom` (Phase 1) and `phaseJourneyBeat` (Phase 1.5), before action processing (Phase 2a). This ensures omen state is fresh before encounter seeding and prose generation consume it.

**Phase logic (per tick):**

1. **Expiry check:** If primary or secondary omen has exceeded its duration, expire it. Push to `omenState.history`. Emit `omen_expired` TickEvent.
2. **Selection:** If a slot is empty, run the selection pipeline:
   - **Primary slot:** Doom-echo templates matching current archetype + stage are mandatory candidates. Only if no doom-echo qualifies, fall back to seasonal. Highest score wins. Tie-break by PRNG.
   - **Secondary slot:** Score sphere-surge templates against current sphere dominance, cultural templates against faction/settlement state. Only select if score exceeds `OMEN_SECONDARY_THRESHOLD`. Otherwise leave empty.
3. **Beat emission:** For each active omen, if `currentTick - lastBeatTick >= beat.interval`, emit an `omen_beat` TickEvent with prose selected from the beat template pool (PRNG).

**Note:** No transient `encounterOmenBias` field on GameState. Encounter bias is **derived at the consumer** — encounter seeding (Phase 2a.8) reads `omenState.primary` and `omenState.secondary`, looks up their templates' `encounterBias` fields, and merges them. This avoids stale-bias leakage across ticks and keeps `omenState` as the single source of truth.

### Integration Points

| System | How it consumes omens |
|--------|----------------------|
| **Encounter seeding** (Phase 2a.8) | Derives encounter bias from `omenState.primary/secondary` template lookups at consumption time. A +0.3 bias on `duel` during "War Drums" omen means duel encounters seed 30% more often. No transient GameState field — bias is computed fresh each tick from omen state. |
| **Prose pipeline** (`enrichProse()`) | Reads active omen vocabulary. Omen adjectives/verbs/nouns are injected into prose placeholders via a new `{omen_adj}`, `{omen_verb}`, `{omen_noun}` set, and `{omen_atmosphere}` for full sentences. |
| **Chronicle** (Phase 5) | Omen beats flow into `phaseNarrative`. Omen start/expire events become chronicle interludes at `chronicleSignificance` ≥ 0.7. |
| **Doom clock** (Phase 1) | Doom stage transitions can force-expire the current primary omen and select a new doom-echo omen appropriate to the new stage. |
| **Sphere pressure** (Phase 6.639) | Active sphere-surge omens apply `spherePressure` per tick, creating a feedback loop (dominant sphere → omen → more pressure → sustains dominance). Capped by `OMEN_SPHERE_PRESSURE_CAP`. |
| **THR-21 hook** | `omenState.history` + per-archetype omen vocabulary is the data surface THR-21 uses to give each doom archetype a distinct felt identity. |

### New TickEvent Types

```typescript
type OmenTickEventType =
  | 'omen_started'        // New omen track activated
  | 'omen_expired'        // Omen track completed its duration
  | 'omen_beat'           // Periodic atmospheric micro-event
  | 'omen_forced_shift';  // Doom stage transition forced omen change
```

### Trace Types

Add `'omen_selection'` and `'omen_beat'` to the `TraceCategory` union in `src/types/trace.ts`. Both extend `TraceBase`:

```typescript
interface OmenSelectionTrace extends TraceBase {
  category: 'omen_selection';
  slot: 'primary' | 'secondary';
  candidates: { templateId: string; score: number }[];
  selected: string | null;
  reason: string;  // e.g., 'doom_stage_2_breach', 'entropy_dominance_0.6'
}

interface OmenBeatTrace extends TraceBase {
  category: 'omen_beat';
  omenId: string;
  prose: string;
  targetLocation?: string;
}
```

---

## Content Pillar

### Doom-Echo Omen Templates (per archetype × stage range)

Each doom archetype needs 3–5 omen templates spanning its 5 stages. Early-stage omens are subtle and atmospheric; late-stage omens are urgent and visceral.

**The Breach (Force/Chaos/Entropy):**

| Track | Stage Range | Duration | Encounter Bias | Vocabulary Tone |
|-------|-------------|----------|----------------|-----------------|
| Thin Places | 0–1 | 8–12 | explore +0.2 | Unsettling absence, wrong angles, cold spots |
| Borrowed Voices | 1–2 | 6–10 | duel +0.15, social -0.1 | Whispers from nowhere, mistrust, paranoia |
| Fissure Winds | 2–3 | 6–8 | duel +0.3, trade -0.2 | Violent, tearing, exposure, rawness |
| The Hemorrhage | 3–4 | 5–7 | duel +0.4, explore -0.2 | Pouring through, overwhelm, dissolution |

**The Convergence (Order/Mind/Energy):**

| Track | Stage Range | Duration | Encounter Bias | Vocabulary Tone |
|-------|-------------|----------|----------------|-----------------|
| Geometric Dreams | 0–1 | 10–15 | social +0.2 | Perfect patterns, déjà vu, crystalline clarity |
| The Humming | 1–2 | 8–12 | social +0.15, duel -0.15 | Resonance, harmony, drowsiness, inevitability |
| Gravity Wells | 2–3 | 6–10 | social +0.3, explore -0.2 | Compression, closeness, loss of space |
| The Singularity Approaches | 3–4 | 5–7 | social +0.4, duel -0.3 | Unity, dissolution of self, transcendent dread |

**The Reckoning (Time/Spirit/Darkness):**

| Track | Stage Range | Duration | Encounter Bias | Vocabulary Tone |
|-------|-------------|----------|----------------|-----------------|
| Old Debts | 0–1 | 10–15 | social +0.2, explore +0.1 | Nostalgia, guilt, half-remembered faces |
| The Witnesses | 1–2 | 8–12 | social +0.25 | Being watched, judgment, accountability |
| Echo Walk | 2–3 | 6–10 | social +0.2, duel +0.2 | Past and present overlap, time confusion |
| The Accounting | 3–4 | 5–7 | social +0.3, trade +0.2 | Debts called in, final chances, absolution or damnation |

*(Remaining 4 archetypes — changing, sundering, failing, ascension — follow the same pattern. Content authored during implementation.)*

### Sphere-Surge Omen Templates (12 — one per sphere)

| Track | Sphere | Trigger | Duration | Bias | Tone |
|-------|--------|---------|----------|------|------|
| Verdant Surge | life | dominance ≥ 0.25 | 8–12 | assist +0.2 | Growth, fecundity, wild overgrowth |
| Entropic Tide | entropy | dominance ≥ 0.25 | 8–12 | explore +0.2 | Decay, rot, beautiful ruin |
| Iron Season | force | dominance ≥ 0.25 | 6–10 | duel +0.3 | Tension, martial energy, readiness |
| Crystal Clarity | mind | dominance ≥ 0.25 | 8–12 | explore +0.2, social +0.1 | Insight, revelation, uncomfortable truth |
| The Veil Thins | spirit | dominance ≥ 0.25 | 8–12 | assist +0.15, explore +0.15 | Ancestor presence, thin boundaries |
| Temporal Drift | time | dominance ≥ 0.25 | 6–10 | social +0.15 | Echoes, repetition, prophecy fragments |
| *(6 more for order, chaos, energy, darkness, creation, foundation)* | | | | | |

### Cultural Omen Templates (~8)

| Track | Trigger | Duration | Bias | Tone |
|-------|---------|----------|------|------|
| War Drums | faction_conflict (≥ 2 hostile pairs) | 6–10 | duel +0.3, trade -0.2 | Martial, tense, choosing sides |
| Lean Harvest | low_prosperity (avg < 30) | 8–12 | trade +0.3, assist -0.1 | Scarcity, desperation, hard choices |
| Festival Season | high_prosperity (avg > 70) | 8–12 | social +0.3, duel -0.2 | Abundance, celebration, complacency |
| The Unquiet | high_unrest (avg > 60) | 6–10 | duel +0.2, social +0.2 | Restlessness, anger, mob energy |
| Season of Grief | mass_death (≥ 3 deaths in 5 ticks) | 6–8 | assist +0.3, duel -0.2 | Mourning, memorial, fragility |
| Age of Discovery | discovery_surge (≥ 3 reveals in 5 ticks) | 8–12 | explore +0.3 | Wonder, ambition, recklessness |

### Seasonal Omen Templates (~4, cycling)

| Track | Tick Window | Duration | Bias | Tone |
|-------|-------------|----------|------|------|
| The Quiet Before | 1–15 | 10–15 | explore +0.2 | Potential, watchfulness, fragile calm |
| The Turning | 15–35 | 8–12 | duel +0.1, social +0.1 | Change, momentum, choices hardening |
| The Long Dark | 35–55 | 8–12 | duel +0.2 | Endurance, attrition, grim resolve |
| The Reckoning Hour | 55+ | 5–8 | duel +0.2, social +0.2 | Urgency, last chances, no more delays |

### Omen Beat Prose (examples)

Each omen template carries 4–6 beat prose variants. These fire every 2–4 ticks as atmosphere:

**"Thin Places" beats:**
- "Travelers on the road near {location} report the horizon flickering — a shimmer like heat haze, but cold."
- "A child in {location} drew a door in the air with her finger. Her mother swears the air shivered where she traced."
- "The well water in {location} tastes of iron and distance. No one drinks after dark anymore."

**"War Drums" beats:**
- "Smiths in {location} work through the night. The ringing carries for miles."
- "Old soldiers in {location} have taken to sitting by the gates again, watching the road."
- "A merchant fleeing {location} claims the faction banners have changed — the old colors, the war colors."

---

## UI Pillar

### World Pulse: Omen Display

The omen system's primary UI surface is the **World Pulse** — a compact, always-visible indicator showing the world's current atmospheric state.

**Location:** Top-center of the game view, below the doom bar. Persistent, not a panel — think weather indicator.

**Display:**
- **Primary omen:** Name + atmospheric one-liner. E.g., `⊘ Thin Places — "The horizon shimmers where it shouldn't."`
- **Secondary omen (if active):** Smaller text beneath. E.g., `◈ Iron Season`
- **No secondary:** Just the primary line.
- **Transition animation:** When an omen expires/starts, a brief fade-crossfade (300ms). No jarring pop.

**Interaction:**
- Hover → tooltip with omen description, remaining duration (as "fading" / "strong" / "freshly risen"), and which systems it's biasing (in narrative language, not numbers: "Conflict is more likely. Trade feels harder.")
- Click → opens a small omen detail flyout showing current active omens, recent omen history (last 3), and a prose summary of the world's mood trajectory.

### Chronicle Integration

Omen beats appear in the chronicle as **interludes** (compressed, atmospheric entries between chapter-grade events). They use the omen vocabulary to color surrounding entries.

Omen start/expire events appear as brief chronicle markers:
- Start: *"A new unease settles over the world — Thin Places."*
- Expire: *"The shimmer fades. The horizon steadies. But something has changed."*

### Omen Influence on Existing UI

- **AgentDetailPanel:** When an agent is in a location affected by an omen beat, their activity description can reference it: "Kael trains warily — the war drums are impossible to ignore."
- **HexMapV2:** No direct hex overlay for omens (that's doom territory). But omen-influenced hexes could show a subtle atmospheric particle effect in a future pass (deferred — not in scope for THR-19).
- **Debug Panel:** New "Omens" tab showing active omens, selection scores, beat history, encounter bias values.

---

## Wiring Section

| Module | Orchestrator Phase | UI Component | GameState Flow | Traces | Debug Visibility | Player Controls |
|--------|-------------------|--------------|----------------|--------|-----------------|-----------------|
| `phaseOmenAgenda` | Phase 1.7 (after doom, before actions) | WorldPulse (new) | `GameState.omenState` → `phaseOmenAgenda` writes, encounter seeding reads | `omen_selection`, `omen_beat` | DebugPanel "Omens" tab | Hover/click on WorldPulse |
| Encounter bias derivation | Phase 2a.8 reads `omenState` and derives bias | N/A (indirect — affects which encounters appear) | Derived from `omenState.primary/secondary` template lookups — no transient GameState field | Included in existing encounter seeding traces | Visible in encounter seeding trace detail | N/A |
| Prose vocabulary injection | `enrichProse()` reads active omen vocabulary | All prose-displaying components | `omenState.primary/secondary` → vocabulary lookup | N/A (prose traces already exist) | N/A | N/A |
| Chronicle omen entries | Phase 5 (`phaseNarrative`) processes omen TickEvents | Chronicle panel | `omen_started/expired/beat` TickEvents → chronicle interludes | Existing narrative traces | Existing chronicle debug | N/A |

---

## Constants Table (NFP #1: Tunability)

| Constant | Default | Purpose |
|----------|---------|---------|
| `OMEN_PRIMARY_DURATION_DEFAULT` | `[8, 12]` | Default tick duration range for primary omens |
| `OMEN_SECONDARY_DURATION_DEFAULT` | `[6, 10]` | Default tick duration range for secondary omens |
| `OMEN_SECONDARY_THRESHOLD` | `0.4` | Minimum selection score for secondary slot activation |
| `OMEN_BEAT_INTERVAL_DEFAULT` | `3` | Default ticks between omen beat emissions |
| `OMEN_BEAT_SIGNIFICANCE` | `0.5` | Default TickEvent significance for omen beats |
| `OMEN_START_SIGNIFICANCE` | `0.7` | TickEvent significance for omen activation |
| `OMEN_ENCOUNTER_BIAS_CAP` | `0.4` | Maximum encounter type bias from omens |
| `OMEN_SPHERE_PRESSURE_CAP` | `0.05` | Max sphere pressure per tick from sphere-surge omens |
| `OMEN_SPHERE_DOMINANCE_THRESHOLD` | `0.25` | Sphere dominance fraction to trigger sphere-surge omen |
| `OMEN_MAX_HISTORY` | `20` | Max completed omens retained in history |
| `OMEN_DOOM_STAGE_FORCE_EXPIRE` | `true` | Whether doom stage transitions force-expire primary omen |
| `OMEN_FIRST_ACTIVATION_TICK` | `3` | Earliest tick an omen can activate (avoid tick-0 noise) |
| `SEASONAL_CADENCE_TICKS` | `20` | Tick interval for seasonal omen cycling |

---

## Fail-Soft Table (NFP #4)

| Failure Case | Fallback |
|-------------|----------|
| No doom-echo templates match current archetype+stage | Fall back to seasonal omen for primary slot |
| No sphere exceeds dominance threshold | Secondary slot stays empty (valid state) |
| No cultural conditions met | Secondary slot stays empty |
| Omen template references missing vocabulary | Use empty arrays; prose placeholders render as empty string |
| Encounter bias references unknown encounter type | Skip that bias entry; log warning trace |
| `enrichProse()` called with no active omen | Omen placeholders resolve to empty string (invisible) |
| `omenState` missing from GameState (migration) | Initialize with both slots null, empty history |
| PRNG seed missing | Derive from tick number + doom seed |
| Duration range invalid (min > max) | Clamp to `[min, min]` |
| Omen history exceeds `OMEN_MAX_HISTORY` | Drop oldest entries |

---

## NFP Compliance

| Priority | NFP | Status | Notes |
|----------|-----|--------|-------|
| 1 | Tunability | PASS | All thresholds, durations, biases, caps are named constants. Encounter biases are per-template data, not hardcoded. |
| 2 | Inspectability | PASS | Selection traces log all candidates + scores. Beat traces log prose. Debug panel tab shows live state. |
| 3 | Determinism | PASS | Selection uses seeded PRNG. Duration chosen from range via PRNG. Beat prose selected via PRNG. |
| 4 | Fail-soft | PASS | See fail-soft table. Empty slots are valid. Missing templates → fallback. |
| 5 | Narrative over mechanical | PASS | Omens exist to create narrative atmosphere. Mechanical effects (encounter bias, sphere pressure) serve the narrative goal. |
| 6 | Additive | PASS | New `omenState` field, new phase, new TickEvent types. No existing fields modified. Encounter seeding reads an optional bias — no change if absent. |
| 7 | Performance | PASS with note | Phase runs once per tick. Template scoring is O(templates) ≈ 40–60 items. Beat emission is O(1). No concern. |

---

## Rejected Alternatives

- **Omens as graph nodes:** Considered modeling active omens as graph nodes with edges to affected locations. Rejected — omens are world-global, not location-specific. Adding 1–2 nodes per omen that connect to all locations creates edge explosion for no query benefit. Flat state on GameState is simpler and sufficient.
- **Per-hex omen effects:** Considered different omens per hex. Rejected — omens are atmospheric mood, not spatial mechanics. Doom cards already handle spatial effects (hex corruption, location unrest). Omens are a narrative layer, not a mechanical one.
- **Player-selectable omens:** Considered letting the player choose which omen to manifest. Rejected — omens are the world's voice, not the player's. The player influences the world through interventions; the world responds with omens. Player agency over omens would undermine the "living world" feel.

---

## Implementation Scope Estimate

| Task | Pillar | Size |
|------|--------|------|
| `OmenTrackTemplate` types + `OmenState` on GameState | Engine | S |
| `phaseOmenAgenda` orchestrator phase | Engine | M |
| Omen selection pipeline (scoring, PRNG, slot logic) | Engine | M |
| Encounter bias integration (modify encounter seeding) | Engine | S |
| Prose vocabulary integration (`enrichProse()` additions) | Engine/Content | S |
| Doom-echo omen templates (3 archetypes × 4 = 12) | Content | M |
| Sphere-surge + cultural + seasonal templates (~24) | Content | M |
| Beat prose authoring (~6 beats × 36 templates = ~216 lines) | Content | L |
| WorldPulse UI component | UI | M |
| Chronicle omen interludes | UI | S |
| Debug panel Omens tab | UI | S |
| Tests (omen selection, expiry, bias injection, fail-soft) | Engine | M |

**Total estimate:** ~3–4 Claude Code sessions
