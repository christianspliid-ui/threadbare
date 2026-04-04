# Divine Premonition System — Design Spec

**Date:** 2026-04-04
**Status:** Approved design, pending implementation plan

## Summary

A two-tier system where the Threadbearer senses their mortal agents' desires and decision-making, presented as modal vignettes with actionable nudges. The player builds their relationship with threaded actors through engagement — every interaction deepens the divine connection.

---

## Two-Tier Model

### Whisper (Idle/Cooldown — Subconscious Influence)

| Aspect | Detail |
|--------|--------|
| **Fantasy** | Dreams, omens, coincidences. The god plants seeds. The agent may not even know they're being guided. |
| **Trigger** | During idle/cooldown, once per idle period. Fires in new `phaseDivinePremonition` before `phaseAgentDecision`. |
| **Eligibility** | All threaded actors (tier 1+). `whisperAvailable` flag: `true` when agent goes idle, `false` when agent commits to a non-generic encounter. Generic/filler encounters do NOT reset the flag. |
| **What player sees** | Vignette prose + 2-3 contextually derived nudge options |
| **Effect** | Temporary scoring bias by category via `DivineInfluenceEntry`. Decay-based, ~20-30 ticks. |
| **Cost** | 1-2 essence (sphere-matched to the nudge) |
| **Dismiss** | "Let the dream fade" — free, no effect |

### Compulsion (Scoring Moment — Direct Divine Pressure)

| Aspect | Detail |
|--------|--------|
| **Fantasy** | Sudden certainty, a voice in the chest, the world narrowing to one path. Unmistakable divine will. |
| **Trigger** | At scoring moment in `phaseAgentDecision`, between candidate scoring and commitment. |
| **Eligibility** | `the_first` and `retinue` court positions only. |
| **What player sees** | Vignette prose + agent's actual top 3-4 scored encounter candidates |
| **Effect** | Large temporary score boost to chosen candidate, effectively guaranteeing the agent picks it. Also creates a `DivineInfluenceEntry` for tracing. |
| **Cost** | 3-5 essence (sphere-matched to dominant sphere of chosen encounter) |
| **Dismiss** | "Release your hold — let her choose" — free, no effect |

### Design Constraint

The player never forces an agent to do something they wouldn't do. Compulsion only lets the player tip the scales among the agent's own top-ranked candidates. All options were in the agent's shortlist already — none are against their nature.

---

## Whisper Nudge Categories

The modal presents 2-3 of these contextually, derived from the agent's current state. Not a full menu — curated by relevance.

| Category | Prose Example | Mechanical Effect |
|----------|---------------|-------------------|
| **Reach bias** | "Seek the path of Iron" | Boost encounters in a specific reach domain |
| **Sphere bias** | "Draw from Creation's well" | Boost encounters aligned to a specific sphere |
| **Ambition drift** | "Your destiny lies elsewhere" | Chance to re-evaluate/change current ambition |
| **Gather strength** | "Rest. Recover. You are not yet whole." | Bias toward quintessence-restoring actions |
| **Gather courage** | "You were meant for greater trials" | Bias toward higher-threat encounters |

Extensible — new nudge categories can be added over time without structural changes.

### Contextual Derivation

Which 2-3 nudges appear is determined by agent state:

- **Low quintessence** → "Gather strength" becomes a candidate
- **Ambition reach matches nearby encounters** → that reach becomes a candidate
- **Agent has been doing same-reach encounters repeatedly** → a different reach or sphere nudge surfaces
- **Agent quintessence is high, threat tolerance is low** → "Gather courage" surfaces
- **Ambition feels stale** (long time at same ambition, few milestones) → "Ambition drift" surfaces

Top 2-3 by relevance, with seeded PRNG for tie-breaking.

---

## Engine Integration

### Approach: Dedicated Phase + Scoring Hook (Option B)

Two integration points matching the two distinct tiers.

### New Phase: `phaseDivinePremonition`

Runs in the orchestrator **before** `phaseAgentDecision`.

1. Iterate threaded actors (tier 1+) who are currently idle/in cooldown
2. Check `whisperAvailable` flag (true by default; false when agent commits to non-generic encounter; true again when agent goes idle)
3. For eligible agents, derive 2-3 contextual nudge options:
   - Read axiological profile, ambitions, quintessence, nearby encounter landscape
   - Score nudge category relevance
   - Pick top 2-3 with seeded PRNG tie-breaking
4. Emit `WhisperPremonition` event onto `premonitionQueue` on GameState
5. UI picks it up and pops modal

### Compulsion Hook in `phaseAgentDecision`

Between scoring and commitment:

1. Agent has scored candidates and has top 3-4 shortlist
2. If court position is `the_first` or `retinue`, emit `CompulsionPremonition` event with shortlist attached
3. Event goes onto the same `premonitionQueue`
4. Agent decision **pauses** until player acts or dismisses (similar to `attentionMode: 'pause'`)

### Premonition Queue

```typescript
interface PremonitionEvent {
  id: string;
  type: 'whisper' | 'compulsion';
  agentId: string;
  agentName: string;
  tick: number;
  eligibleUntilTick: number;       // expiry for staleness
  options: WhisperNudge[] | CompulsionCandidate[];
}

interface WhisperNudge {
  category: 'reach_bias' | 'sphere_bias' | 'ambition_drift' | 'gather_strength' | 'gather_courage';
  targetReach?: ReachDomain;
  targetSphere?: SphereName;
  essenceCost: number;
  sphere: SphereName;              // which essence pool to draw from
  prose: string;                   // the nudge label prose
}

interface CompulsionCandidate {
  encounterId: string;
  encounterName: string;
  encounterHook: string;           // one-line prose hook
  reach: ReachDomain;
  sphere: SphereName;
  threatRating: number;
  score: number;                   // from scoring pipeline
  essenceCost: number;
}
```

GameState addition:
```typescript
premonitionQueue: PremonitionEvent[];
```

UI drains the queue, popping modals one at a time. Dismissed or acted-on events are removed. Stale events (past `eligibleUntilTick`) are silently discarded.

### When the Player Acts

- **Whisper**: Creates a `DivineInfluenceEntry` with the chosen bias. Decay-based, lasts ~20-30 ticks. Feeds into existing `buildValueOverlay` / scoring modifier system in `encounterScoring.ts`.
- **Compulsion**: Applies a large temporary score boost to the chosen encounter candidate, effectively guaranteeing the agent picks it. Also creates a `DivineInfluenceEntry` for tracing and decay.
- **Dismiss**: No cost, no effect. Modal closes.

---

## UI & Modal Design

### Modal Structure

Both variants use the existing `Modal` primitive (portal-based, max-height 85vh, Escape to close, z-index 60). Both pop up as modals by default for every eligible agent — the player builds relationship through engagement.

### Layout (Both Variants)

1. **Header** — "A Stirring in the Thread" (Whisper) / "The God's Will" (Compulsion)
2. **Vignette** — 2-3 sentences of character-specific prose (see Prose Generation)
3. **Options** — 2-3 nudge choices (Whisper) or 3-4 encounter candidates (Compulsion)
4. **Dismiss** — "Let the dream fade" / "Release your hold — let her choose"

### Color System

Colors follow the **nudge target**, not the agent. Each option is tinted by the sphere/reach color from the cosmology model:

| Sphere | Color | Reach |
|--------|-------|-------|
| Force | `#ff6b6b` | Iron |
| Matter | `#d4a87a` | Stone |
| Energy | `#ffe44d` | Eye |
| Life | `#33ff77` | Gold |
| Mind | `#44aaff` | Veil |
| Spirit | `#cc66ff` | Heart |
| Time | `#ffb355` | Star |
| Entropy | `#8fd4c0` | Shadow |
| Quintessence | `#ff9ecf` | — |

A single modal may contain options in different sphere colors. The modal frame itself stays neutral/dark. Essence cost labels use the corresponding sphere color.

### Whisper Option Row

```
[Sphere-tinted border]
  "Seek the path of Iron"                    — 1 essence (in #ff6b6b)
  Her hands remember the weight of a blade
```

### Compulsion Option Row

```
[Sphere-tinted border]
  The Shrine of Broken Oaths                 Iron · Threat 3
  A reckoning with old promises              — 4 essence (in #ff6b6b)
```

---

## Prose Generation

### Input Dimensions

**Whisper vignette inputs:**
1. Agent's axiological profile → word choice, value language
2. Current state (post-combat, post-travel, idle) → situational framing
3. Current ambition → desire imagery, what they *want*
4. Quintessence level → vitality of the prose, dream coherence
5. Available nudge categories → what the vignette hints at
6. Sphere/reach of each nudge → sensory palette

**Compulsion vignette inputs:**
All of the above, plus:
7. The actual encounter candidates → names, locations, hooks
8. Thread tier → how aware the agent is of divine pressure

### Quintessence-Scaled Prose

| Quintessence | Prose Quality |
|--------------|---------------|
| > 0.8 (healthy) | Vivid, energetic dreams. Sharp imagery. |
| 0.5-0.8 (moderate) | Clear but muted. Slightly distant. |
| 0.25-0.5 (strained) | Fragmented, fading imagery. Confusion. |
| < 0.25 (weakened/critical) | Nightmares, dissolution motifs, the dream fraying at edges. |

### Ambition-Colored Prose

The agent's current ambition colors the vignette's *desire*:
- **Vengeance** → dreams of old wrongs, sharp edges, faces in firelight
- **Legacy** → dreams of monuments, names carved in stone, crowds remembering
- **Discovery** → dreams of doors, maps with blank spaces, light from unknown sources
- **Dominion** → dreams of thrones, banners, walls that obey
- **Mastery** → dreams of hands that do not tremble, the perfect strike
- **Devotion** → dreams of warmth, voices calling, the thread made visible
- **Survival** → dreams of running, shelter, the horizon clear of threat

### Implementation

Template-based content tables keyed by `(nudge type, ambition category, quintessence tier)`, similar to existing patterns in `encounter-content.ts` and `movement-content.ts`. Template strings with `{name}`, `{reach}`, `{location}`, `{possessive}`, `{pronoun}` placeholders. Selected by seeded PRNG from a pool per key combination.

**Whisper templates** (examples per nudge type):
- Reach bias: `"That night, {name} dreamed of {reachImagery} and woke with {reachSensation}."`
- Gather strength: `"{name} felt the weariness in {possessive} bones — a weight beyond fatigue, as though the world itself pressed down."`
- Ambition drift: `"A restlessness had taken root in {name}. The old purpose felt thin, worn through like cloth too long in the sun."`

**Compulsion templates:**
- `"A certainty seized {name} — {encounterHook}. {pronoun} could not say why, but {pronoun} *must* go there."`
- `"{name} stood at the crossroads. Three paths. But one burned brighter than the rest — {encounterName}, pulling like a tide."`

---

## Constants Table

| Constant | Default | Purpose |
|----------|---------|---------|
| `WHISPER_ESSENCE_COST_BASE` | 1 | Base essence cost for a Whisper nudge |
| `WHISPER_ESSENCE_COST_AMBITION_DRIFT` | 2 | Higher cost for ambition drift (more impactful) |
| `WHISPER_INFLUENCE_DURATION` | 25 | Ticks before Whisper influence fully decays |
| `WHISPER_INFLUENCE_STRENGTH` | 0.15 | Initial strength of Whisper scoring bias |
| `WHISPER_INFLUENCE_DECAY_RATE` | 0.006 | Per-tick decay of Whisper influence |
| `COMPULSION_ESSENCE_COST_MIN` | 3 | Minimum essence cost for Compulsion |
| `COMPULSION_ESSENCE_COST_MAX` | 5 | Maximum essence cost for high-threat candidates |
| `COMPULSION_SCORE_BOOST` | 5.0 | Score boost applied to chosen candidate |
| `PREMONITION_EXPIRY_TICKS` | 3 | Ticks before a queued premonition goes stale |
| `WHISPER_NUDGE_COUNT_MIN` | 2 | Minimum nudge options per Whisper modal |
| `WHISPER_NUDGE_COUNT_MAX` | 3 | Maximum nudge options per Whisper modal |
| `COMPULSION_CANDIDATE_COUNT` | 4 | Number of top candidates shown in Compulsion |
| `COURAGE_THREAT_BOOST` | 0.3 | Scoring boost to higher-threat encounters for "gather courage" |
| `GATHER_STRENGTH_QUINTESSENCE_THRESHOLD` | 0.7 | Below this quintessence, "gather strength" becomes a nudge candidate |

---

## Tracing

### New Trace Type

```typescript
interface PremonitionTrace {
  type: 'divine_premonition';
  subtype: 'whisper' | 'compulsion';
  agentId: string;
  tick: number;
  options: string[];              // nudge category ids or encounter template ids
  playerChoice: string | null;    // null if dismissed
  essenceCost: number;
  sphereUsed: SphereName;
  influenceId: string | null;     // resulting DivineInfluenceEntry id
}
```

### Debug Panel Integration

- Premonition events visible in trace log with `divine_premonition` filter
- CLI command: `premonitions [agent]` — shows pending/recent premonitions
- `whisperAvailable` flag visible on agent inspect

### Encounter Log Export

New columns for agent-analyser correlation:
- `whisper_active` (bool) — was a Whisper influence active when this encounter was selected?
- `compulsion_used` (bool) — was this encounter selected via Compulsion?
- `nudge_type` — which nudge category was active, if any

---

## Fail-Soft Table

| Failure Case | Fallback |
|--------------|----------|
| No eligible nudges for agent | Whisper modal doesn't fire for that agent this idle period |
| Empty encounter shortlist | Compulsion skipped, agent decides normally |
| Missing prose template for key combination | Fallback generic template per nudge type |
| Stale premonition event (past `eligibleUntilTick`) | Silently discarded from queue |
| Agent state changes between emit and modal display | Modal shows stale data; dismiss is always safe; acting on stale Compulsion re-validates shortlist |
| Insufficient essence | Option shown but grayed out with "not enough essence" hint |
| Agent has no ambition | Ambition-drift nudge excluded from candidates; vignette uses generic desire imagery |
| Agent at dissolution quintessence (0.0) | No premonition — the thread is severed |

---

## Wiring

| Surface | Integration Point |
|---------|-------------------|
| **Orchestrator phase** | New `phaseDivinePremonition` before `phaseAgentDecision` |
| **Orchestrator hook** | Compulsion pause point in `phaseAgentDecision` between scoring and commitment |
| **GameState** | `premonitionQueue: PremonitionEvent[]` |
| **UI component** | New `PremonitionModal` (Whisper variant + Compulsion variant) |
| **GameView JSX** | `PremonitionModal` rendered, reads from `premonitionQueue` |
| **Traces** | `divine_premonition` trace type emitted on player choice |
| **Debug CLI** | `premonitions [agent]` command |
| **Encounter log** | `whisper_active`, `compulsion_used`, `nudge_type` columns |
| **Prose pipeline** | New content table in `premonition-content.ts` |
| **Player controls** | Modal choices spend essence, create `DivineInfluenceEntry` |

---

## NFP Compliance

| # | Priority | Status | Notes |
|---|----------|--------|-------|
| 1 | Tunability | PASS | All costs, decay rates, cooldowns, thresholds are named constants (see Constants Table) |
| 2 | Inspectability | PASS | `divine_premonition` trace type, debug CLI command, encounter log columns |
| 3 | Determinism | PASS | Nudge option selection and prose template selection both use seeded PRNG |
| 4 | Fail-soft | PASS | See Fail-Soft Table — every failure path has a graceful fallback |
| 5 | Narrative > mechanical | PASS | Entire system is narrative-first. Player chooses through prose, not sliders. |
| 6 | Additive | PASS | New phase, new event type, new modal. Existing systems untouched beyond narrow pause point in scoring. |
| 7 | Performance | PASS | Whisper phase iterates only threaded actors (small set). No per-tick allocations for non-eligible agents. |
