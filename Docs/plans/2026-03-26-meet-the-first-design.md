# Meet The First — Full System Design (v2)

**Date:** 2026-03-26
**Status:** Design complete, pending implementation
**Backlog:** TB-035
**Depends on:** Encounter system (exists), Generalized Action Targeting (✅), Ambition system (needs assessment), Archetype content (exists), Cooperation strategy (exists), Axiological profile (exists)
**Brainstorm source:** Obsidian → `TheFantasyWorldSimulator/Brainstorms/brainstorm-meet-the-first.md`
**Supersedes:** v1 of this document (pre-review)

## Problem

The player has no personal, narratively meaningful relationship with any agent. Agents are generated during world seed as statistical bundles — archetype, axiological profile, cooperation strategy — but none of them are *the player's*. There is no origin story, no divine bond forged through choice, no character whose arc the player shaped from the beginning.

The game's core fantasy is being a god who works through mortals. Without a mechanism for the player to discover, bond with, and shepherd a mortal agent through a complete hero's journey, the simulation runs but the player watches from behind glass.

## Scope

This design covers nine interconnected subsystems:

0. **The Divine Court & Thread Edge** — replaces `worships` with `thread`, defines court position spectrum (The First / Retinue / Watched), rival perception, supporting cast vignettes
1. **The Court Slot: "The First"** — the deepest court position with narrative cooldowns
2. **The Meeting Encounter** — intent-driven, 4-step choice encounter that generates a bonded agent
3. **Choice-Point Step Type** — new encounter step type for player decisions (vs. resolution rolls)
4. **The Hero's Journey Arc** — doom-clock-scheduled branching story tree
5. **Journey Vignettes & Universal Encounter Visibility** — auto-interrupt modals for The First; clickable encounter views for all threaded agents
6. **The Return** — peak-end convergence with Founding Gates and Ripple Consequences, producing 6 divergent dramatic outcomes
7. **Unified Vignette Engine** — layered template system: structure + axis selector + dynamic enrichment + archetype tone
8. **Dynamic Prose Enrichment** — world-state queries that inject titles, artifacts, allies, and context into vignette prose

**Out of scope:** Onboarding auto-trigger flow (TB-037), Great Chronicle echo/metaprogression, co-op divine mode from Loyal Ascension, strategic hex/location/agent actions (TB-036 — distinct from encounter interventions).

**Two interaction modes (architectural principle):**
- **Encounter interventions** (this design): in-the-moment divine presence during encounters. Vignettes, choices, essence spending. Dramatic, reactive.
- **Strategic actions** (TB-036, future): long-term investment on hexes, locations, agents NOT in encounters. Cards, hex map, chronicle. Planning, tactical.

---

## System 0: The Divine Court & Thread Edge

The divine court is the god's web of mortal connections — every person the god has reached out to and woven a thread of fate around. It's a spectrum from deep investment (The First, whose entire hero's journey the player shapes) down to a passing glance (a watched mortal the god has merely noticed).

The relationship isn't worship flowing upward — it's the god reaching *down*. The mortal may experience it as faith, strange luck, or an uncanny intuition, but the source is divine attention. The game is called Threadbearer: **the god weaves threads of fate around mortals.**

### The `thread` Edge (replaces `worships`)

```typescript
// Direction: ascendant → mortal (the god reaches down)
// Replaces: 'worships' (mortal → god) — direction flips
interface ThreadEdgeProperties {
  // Court position
  courtPosition: CourtPosition | null;  // null = thread exists but no named position

  // Investment depth (migrated from InfluenceRelationshipProperties)
  tier: 0 | 1 | 2 | 3 | 4;            // Thread thickness / depth of divine investment
  ticksAtCurrentTier: number;
  establishedTick: number;
  totalEssenceSpent: number;
  maintenanceCurrent: number;           // Essence paid to maintain thread this tick

  // The mortal's experience of the thread
  awareness: 'unaware' | 'intuition' | 'faith' | 'communion';
  readBackstoryTier: number;

  // Attention mode (determines vignette behavior)
  attentionMode: 'pause' | 'auto_resolve';  // Defaults by court position, modifiable by player action

  // Journey state (only for The First)
  storyPhase?: CampbellianPhase;        // Current journey phase
  ordealOutcome?: OrdealOutcome;
  meetingChoiceRecord?: MeetingChoiceRecord;
  beatHistory?: BeatOutcome[];          // Record of which beat variants fired and what happened

  // Intervention tracking (for all court positions)
  interventionTracking: InterventionTracking;
}

type CourtPosition = 'the_first' | 'retinue' | 'watched';
type CampbellianPhase = 'call' | 'road_of_trials' | 'crisis' | 'ordeal' | 'return';
```

**Direction change:** The old `worships` edge ran mortal → god. The new `thread` edge runs god → mortal. The god is the actor; the mortal is the subject. Migration requires flipping all existing edges.

### Court Position Spectrum

| Position | Thread Thickness | Vignette Treatment | Encounter Visibility | Attention Default |
|----------|-----------------|-------------------|---------------------|------------------|
| **The First** | Maximum | Scheduled auto-interrupt, rich prose, 2-3 choices, full enrichment | Full vignette with choices | `pause` |
| **Retinue** | Moderate | Encounter notification, medium prose, 1-2 choices | Click to view + intervene | `auto_resolve` |
| **Watched** | Thin | Brief log entry | Click to peek, option to spend essence | `auto_resolve` |
| **Unthreaded** | None (no edge) | Nothing | Invisible to the god | N/A |

The player can modify `attentionMode` on any thread via a divine action (costs essence). Thickening a thread to `pause` means the god cares deeply enough to stop everything when this mortal faces a crisis. This is a resource decision — more paused threads = more interruptions but more control.

### Retinue — The Supporting Cast

Retinue members are the god's inner circle. They get occasional "supporting scene" vignettes — lighter than The First's journey but richer than the Watched.

**How agents enter the retinue:**
- Spending essence on a threaded mortal above `RETINUE_ESSENCE_THRESHOLD` auto-promotes to retinue
- A completed First whose Return concluded positively may remain as retinue
- Player manually promotes via divine action

**Supporting vignettes trigger when:**
- A retinue member enters an encounter (any encounter, not just scheduled ones)
- A retinue member achieves a personal milestone
- A retinue member's relationship with The First changes significantly

Supporting vignettes are queued notifications (not auto-interrupt). Player clicks to engage. 1-2 choices. No "do nothing" — the god either intervenes or the moment passes.

### Watched — Peripheral Vision

Watched mortals appear in the narrative log. No vignettes. The player can click into their encounters for a brief snapshot and option to spend essence boosting odds.

**Auto-watch:** Mortals entering The First's hex are auto-Watched (the god notices people near their champion).

### Rival Perception

Rival gods can perceive the player's threads — and the player can perceive theirs.

| Sphere | Perceives |
|--------|----------|
| Shadow | Thread existence ("something divine touches this mortal") |
| Mind | Thread thickness and court position |
| Eye | Full thread details (god, position, investment) |

Perception is an action costing `RIVAL_THREAD_SCAN_COST` essence. Not passive.

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `MAX_RETINUE_SIZE` | `5` | Soft cap (excess increases maintenance cost) |
| `RETINUE_ESSENCE_THRESHOLD` | `10` | Cumulative essence for auto-promotion |
| `RETINUE_VIGNETTE_CHANCE` | `0.3` | Probability a qualifying retinue event triggers a vignette |
| `RETINUE_VIGNETTE_MAX_PER_CYCLE` | `3` | Cap per retinue member per cycle |
| `RIVAL_THREAD_SCAN_COST` | `3` | Essence cost for rival perception scan |
| `AUTO_WATCH_RADIUS` | `1` | Hex radius around The First for auto-watching |
| `ATTENTION_MODE_CHANGE_COST` | `2` | Essence cost to toggle a thread's attention mode |

### Migration: `worships` → `thread`

1. Rename edge type in `edgeSchema.ts` and all query functions
2. Flip direction (mortal→god becomes god→mortal)
3. Extend properties with `courtPosition`, `awareness`, `attentionMode`, `interventionTracking`, journey state
4. Update canonical queries: `getAgentWorships()` → `getThreadsFrom(ascendantId)` / `getThreadTo(agentId)`
5. Update all callers (~8 files)
6. World seed: create `thread` edges with `courtPosition: null` or `'watched'`

### Tracing

```typescript
interface ThreadChangeTrace {
  type: 'thread_change';
  tick: number;
  ascendantId: string;
  mortalId: string;
  change: 'created' | 'position_changed' | 'tier_changed' | 'severed' | 'awareness_changed' | 'attention_mode_changed';
  previousPosition: CourtPosition | null;
  newPosition: CourtPosition | null;
  previousTier: number;
  newTier: number;
  reason: string;
}
```

### Fail-soft

| Failure | Fallback |
|---------|----------|
| Mortal has thread from two different gods | Both threads coexist (contested mortal — tension, not error) |
| Thread references deleted mortal | Sever thread, emit trace |
| Thread references deleted ascendant | Sever thread |
| Retinue exceeds `MAX_RETINUE_SIZE` | Allow but increase maintenance cost per excess member |

**PRNG:** Thread creation deterministic. Retinue vignette trigger uses `retinueSeed = hash(gameSeed, agentId, tick, 'retinue_vignette')`.

---

## System 1: The Court Slot — "The First"

The First is the deepest court position — a `thread` edge with `courtPosition: 'the_first'`. Only one thread can hold this position at a time.

### Slot Title

Varies by ascendant sphere:

| Sphere | Title |
|--------|-------|
| Spirit | The Anointed |
| Mind | The Awakened |
| Force | The Chosen |
| Shadow | The Found |
| Entropy | The Marked |
| Creation | The Shaped |
| Life | The Blessed |
| Default | The First |

Title is derived from sphere at render time, not persisted.

### Lifecycle

1. **Empty** → Meet The First action → encounter → `thread` edge created with `courtPosition: 'the_first'`
2. **Active** → journey plays out → Return resolves → `courtPosition` cleared; agent may stay as retinue or thread may sever
3. **Truncated** → First dies mid-arc → position cleared, thread severed

### Narrative Cooldown

After the Return, the god reflects. Variable by outcome:

| Return Outcome | Cooldown (ticks) | Narrative Reason |
|---------------|-----------------|-----------------|
| Loyal Ascension | `3` | Joy and pride |
| Sacrifice | `8` | Deep grief |
| Vanishing | `5` | Confusion and loss |
| Transcendence | `4` | Bittersweet peace |
| Usurper | `6` | Betrayal |
| Monster | `10` | Horror |

Stored as `firstSlotCooldownUntil: number` on the ascendant. Meet The First unavailable when `currentTick < firstSlotCooldownUntil`.

### Action Availability Gate

`getThreadsFrom(ascendantId).none(t => t.courtPosition === 'the_first')` AND `currentTick >= firstSlotCooldownUntil`.

### Fail-soft

| Failure | Fallback |
|---------|----------|
| Multiple threads have `the_first` | Clear all but earliest `establishedTick` |
| Cooldown in distant future | Cap at `currentTick + 15` |

---

## System 2: The Meeting Encounter — Intent-Driven Agent Generation

A player-initiated Avatar action at a populated location. The god reaches into the web of fate, looking for a specific kind of destiny to weave. This is the game's emotional on-ramp — the highest prose budget in the game, the most content variety, the moment where the player must bond with a mortal character.

**Content directive:** This encounter gets more prose, more variants, more hand-crafted content than any other system. Repeat playthroughs must feel fresh. The quality bar here determines whether the entire hero's journey system succeeds emotionally.

### Entry Point

Action template:

```typescript
{
  id: 'meet_the_first',
  name: 'Meet The First',
  actionVerb: 'invoke',
  targetCategories: ['location'],
  targetSubtypes: ['hamlet', 'village', 'town', 'city', 'temple', 'monastery', 'camp'],
  essenceCost: 0,
  prerequisites: [
    { type: 'no_active_first' },
    { type: 'cooldown_expired', slotId: 'the_first' },
    { type: 'location_has_agents', minimum: 1 }
  ],
  playerInitiated: true,
  encounterTemplateId: 'meet_the_first_encounter',
  description: 'Reach into the web of fate and find the one whose destiny you will weave.'
}
```

### Step 1 — "Seeking Threads" (Intent + Candidate Selection)

The god reaches out, feeling for threads of fate. **The player first declares what kind of destiny they're looking for** — framed narratively but mapping to reach domains:

| Option Text | Reach |
|------------|-------|
| "A blade to carve your will into the world" | Iron |
| "A voice to move hearts and bend kingdoms" | Heart |
| "Eyes that see what others cannot" | Eye |
| "A shadow that moves where no one watches" | Veil/Shadow |
| "Hands that shape the raw stuff of creation" | Stone |
| "A soul that burns bright enough to change fate" | Star |
| "The pulse of living things, bent to your design" | Flesh |
| "Gold, influence, the levers of mortal power" | Gold |
| "Ancient secrets, knowledge that reshapes reality" | Mind (via domain) |

Options shown are filtered and weighted by the ascendant's own sphere/reach affinities. A Shadow ascendant sees Shadow-aligned options prominently.

**After the intent is declared**, 3 candidates appear — each pre-seeded with the chosen reach direction in their axiological profile and archetype. Candidates are constrained by location subtype and culture.

**Candidate generation:**

```typescript
interface MeetingCandidate {
  archetypeId: string;          // Filtered by location + intent
  cultureId: string;            // From location
  reachBias: ReachDomain;       // From player's intent choice
  vignetteText: string;         // Rich prose — a person in a specific moment
  axiologicalSeed: Partial<AxiologicalProfile>;
  appearanceSeed: number;
}
```

The player picks one candidate. This locks archetype + culture + initial reach direction.

### Step 2 — "The Defining Moment" (2-3 Dilemmas)

The dramatic core. The god has found their target — now they create a crucible. 2-3 dilemma scenes where the god pulls the strings of fate to put this person in defining situations.

**This is the god designing the moment.** Not observing — *engineering*. Kill their parents to forge a vengeful warrior. Let the beggar find gold to see what wealth does to their soul. Put them in front of an injustice and see if they fight.

Each dilemma presents a short narrative scene and 2-3 choices. The choices reflect what kind of god the player is — merciful or cruel, direct or subtle. Each choice shifts axiological values and feeds the Founding Gates for the Return.

```typescript
interface DilemmaTemplate {
  id: string;
  archetypeIds: string[];
  locationSubtypes: string[];
  setup: string;                // Rich prose — the situation the god has arranged
  godVoice: string;             // How the god perceives this moment (sphere-filtered)
  choices: DilemmaChoice[];     // 2-3 choices
}

interface DilemmaChoice {
  text: string;                 // What happens narratively
  godAction: string;            // How the god pulls the threads
  axiologicalShifts: Partial<Record<ValuePair, number>>;
  traitSeed?: string;
  foundingTag: string;          // Tags for Founding Gates: 'noble', 'dark', 'cunning', etc.
}
```

**Prose budget:** Each dilemma should be 3-5 sentences of setup (longer than any other encounter text in the game). The god's voice overlay adds 1-2 sentences. Each choice is 1-2 sentences describing what happens.

**Content target:** ~60+ dilemma templates (3+ per archetype × location type). Enough that repeat playthroughs with the same archetype at the same location type still feel fresh.

### Step 3 — "The Spark" (Reveal + Invest)

The dilemmas are done. The person has changed. This step reveals the transformation and lets the player invest further.

**Reveal:** "She walks away from the burning house. Something in her has hardened." The system shows — narratively, not as a stat sheet — who this person has become. Their shifted values, their new traits, their primary reach. Presented as prose, not numbers.

**Invest:** The god can choose a trade/profession/path that further pushes the mortal in a direction:

| Investment Option | Mechanical Effect |
|------------------|-------------------|
| "You steer her toward the blade-smiths" | +reach capability boost in Iron, seeds smith-related trait |
| "You plant the seed of command" | +reach capability boost in Heart, seeds leadership trait |
| "You open her eyes to the hidden world" | +reach capability boost in Eye/Veil, seeds perception trait |

Investment costs essence (`SPARK_INVESTMENT_COST`) — the god is putting divine energy into shaping this person's trajectory.

**Ascendant lens:** The reveal and investment options are flavored by the god's sphere. A Force god's investment options are direct and physical. A Mind god's options are subtle and intellectual.

### Step 4 — "The Name They'll Carry" (Shape or Surprise)

Two paths:

**"Shape them"** — Content Pipeline controls: edit name, lock fields + regenerate, tweak values via narrative reframing. For RP-oriented players.

**"Surprise me"** — Accept everything the system generated. Name, appearance, backstory. Fast path.

**Both paths produce:**
1. New agent node with full properties
2. `thread` edge from ascendant → agent with `courtPosition: 'the_first'`, tier 1
3. `located_at` edge at encounter location
4. Story ambition assigned (System 4)
5. Closing vignette: the moment after the divine touch

**All encounter choices stored as `MeetingChoiceRecord`:**

```typescript
interface MeetingChoiceRecord {
  encounterTick: number;
  locationId: string;
  intentReach: ReachDomain;     // Step 1 intent
  candidateIndex: number;
  archetypeId: string;
  dilemmaChoices: DilemmaChoiceRecord[];  // Step 2 choices with founding tags
  investmentChoice: string;     // Step 3 investment
  shapePath: 'shape' | 'surprise';
  ascendantSphere: string;
}
```

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `MEETING_CANDIDATE_COUNT` | `3` | Candidates shown |
| `MEETING_DILEMMA_COUNT` | `2-3` | Dilemmas per encounter (varies by archetype) |
| `DILEMMA_SHIFT_MAGNITUDE` | `0.15` | Axiological shift per choice |
| `SPARK_INVESTMENT_COST` | `2` | Essence cost for Step 3 investment |
| `SPARK_CAPABILITY_BOOST` | `1.0` | Reach capability boost from investment |
| `ASCENDANT_REACH_BIAS` | `0.6` | Probability ascendant's affinities appear in Step 1 options |

### Tracing

```typescript
interface MeetTheFirstTrace {
  type: 'meet_the_first';
  tick: number;
  locationId: string;
  ascendantId: string;
  newAgentId: string;
  intentReach: ReachDomain;
  archetypeId: string;
  dilemmaChoices: DilemmaChoiceRecord[];
  investmentChoice: string;
  axiologicalProfile: AxiologicalProfile;
  cooperationStrategy: CooperationStrategy;
  courtSlotTitle: string;
}
```

### Fail-soft

| Failure | Fallback |
|---------|----------|
| No eligible archetypes for location + intent | Widen to full archetype pool |
| No dilemma templates match | Use generic dilemma set |
| Agent creation fails mid-encounter | Abort, emit error trace |
| Content Pipeline edit produces invalid values | Clamp to valid range |

**PRNG:** Candidate generation uses `encounterSeed = hash(gameSeed, tick, locationId)`. Dilemma selection uses `dilemmaSeed = hash(encounterSeed, archetypeId, dilemmaIndex)`.

---

## System 3: Choice-Point Step Type

New encounter step type alongside resolution rolls.

```typescript
interface ChoicePointStep extends BaseEncounterStep {
  stepType: 'choice_point';
  choices: ChoiceOption[];
  timeoutTicks?: number;
  autoResolveChoice?: number;
  ascendantLensKey?: string;
}
```

**Execution:** When reached, encounter sets `status: 'awaiting_choice'`. Tick loop skips this encounter. UI renders choice modal. Player selects → effects applied → encounter advances.

**Pause vs. timeout:** Determined by the thread's `attentionMode`:
- `pause`: tick loop halts entirely. Game freezes until player acts. (Default for The First.)
- `auto_resolve`: timeout fires after `timeoutTicks`, "do nothing" auto-resolves. (Default for Retinue/Watched.)

### Fail-soft

| Failure | Fallback |
|---------|----------|
| Empty choices array | Auto-advance, warning trace |
| Invalid choice index | Clamp to valid range |
| Encounter abandoned while awaiting | Standard abandon flow |

---

## System 4: The Hero's Journey Arc — Doom-Clock-Scheduled Story Tree

The journey is not a linear quest log. It's a branching story tree where the doom clock determines *when* beats fire, the First's accumulated world state determines *which* variant fires, and the player's vignette choice determines *what happens next*.

### The Doom Clock as Pacemaker

```
|--- Call ---|--- Road of Trials ---|--- Crisis ---|--- Ordeal ---|--- Return ---|
0%          15%                     55%            70%            85%           100%
```

At each phase boundary, the system fires a story beat. Not "when a condition is met" — when **the clock says it's time**. The beat always fires. The question is which variant.

### Beat Architecture (Layered Template System)

Every story beat is constructed from four layers:

**Layer 1 — Structural Template** (hand-authored): The dramatic shape of the scene. Setup, tension point, choices, consequences. Does not reference specific names, places, or items. Example: "Something threatens what the First has built. They must choose: defend it, abandon it, or weaponize the threat."

**Layer 2 — Axis Selector** (algorithmic): Reads the First's world-state snapshot across four axes and selects a structural template:
- **Power axis:** Capability in primary reach, total traits, tier level
- **Influence axis:** Factions led, locations controlled, agreements forged, enemies made
- **Relationship axis:** Thread tier, trust, intervention ratio, attention mode
- **Ambition axis:** Active ambitions, completed milestones, failed attempts

The snapshot maps to a template selection. High power + high influence → "threats from rivals." Low power + high relationship → "the god shelters their fragile champion."

**Layer 3 — Dynamic Enrichment** (System 8): Template slots filled from the graph. Names, places, artifacts, allies, traits. "Something threatens what the First has built" becomes "The Ironclad Order marches on Ashenmoor — the city Kira fought to claim. The Ashen Blade hums at her hip."

**Layer 4 — Archetype Tone** (hand-authored overlay): Voice and flavor per archetype. A Tragic Hero's version has fatalistic prose. A Trickster's has dark humor. Same structure, different emotional register.

**Content target:** Generous, not minimal. Aim for **5-8 structural templates per phase** (25-40 total across the journey). Each with archetype tone overlays. The enrichment system adds surface variety on top.

### Journey Phases

**Call (0-15% doom clock) — 1 beat:**
The thread is fresh from the meeting encounter. The Call beat reads the First's initial state (archetype, meeting choices, starting location) and presents the first narrative moment outside the meeting — the First begins to change.

**Road of Trials (15-55% doom clock) — 3-5 beats:**
The bulk of the journey. Beats fire at roughly equal intervals within this window. Each reads the accumulated state and fires the appropriate variant. The First's ambitions drive what happens between beats; the beats read the results.

Between beats: the First acts autonomously via normal agent decision-making. Their ambitions, encounters, and relationships change the world. The next beat reads that changed world.

**Crisis (55-70% doom clock) — 1-2 beats:**
Tension escalates. The archetype's shadow surfaces. Prior beat outcomes weight toward darker or lighter variants. If the First has been Rising Star throughout, the Crisis introduces hubris or external threat. If they've been Underdog, the Crisis is raw survival.

**Ordeal (70-85% doom clock) — 1 beat:**
The peak moment. Reads EVERYTHING: power, influence, relationship, prior beat pattern, world state. This is the single most important moment in the arc — it determines the Return (System 6).

The Ordeal beat has special properties:
- Always uses `attentionMode: 'pause'` regardless of thread setting
- 3 choices reflecting different levels of divine intervention
- The middle choice incorporates a capability check (the one moment where the First's growth matters mechanically)
- Outcome recorded as `OrdealOutcome: 'triumph' | 'scraped_through' | 'broken'`

**Return (85-100% doom clock) — 1 beat:**
The convergence fires (System 6). The Return beat is the dramatic conclusion — a vignette showing the outcome playing out, followed by ripple consequences.

### No Failure State

The arc always completes. A First who hasn't grown much gets a *different* story, not a shorter one. A powerful First who's conquered a kingdom faces a political Ordeal. A nobody First who's barely survived faces a personal, intimate Ordeal. Both are complete stories.

Different world states produce different beat variants, which produce different arc shapes, which produce different Returns. The variety comes from the world, not from artificial difficulty gating.

### Ambition = Story

The First's ambitions are the narrative engine between scheduled beats. When the First pursues an ambition and achieves it, that raises their power/influence for the next beat. When they fail, the next beat reads a weaker, more desperate state. The beats don't need separate milestone conditions — they read the ambition system's output.

### Beat History

Each beat outcome is recorded on the thread edge:

```typescript
interface BeatOutcome {
  phase: CampbellianPhase;
  tick: number;
  templateId: string;
  variantKey: string;           // Which state-driven variant fired
  playerChoiceId: string;       // What the player chose
  stateSnapshot: StateSnapshot; // The four axes at time of beat
}
```

The accumulated `beatHistory` is available to later beats (especially Crisis and Ordeal) for pattern-matching. A sequence of Rising Star → Rising Star → Corrupted Path tells a different story than Underdog → Underdog → Beloved Servant.

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `CALL_PHASE_END` | `0.15` | Doom clock % when Call phase ends |
| `TRIALS_PHASE_END` | `0.55` | Doom clock % when Road of Trials ends |
| `CRISIS_PHASE_END` | `0.70` | Doom clock % when Crisis ends |
| `ORDEAL_PHASE_END` | `0.85` | Doom clock % when Ordeal ends |
| `TRIALS_BEAT_COUNT` | `4` | Target number of beats during Road of Trials |
| `CRISIS_BEAT_COUNT` | `1` | Beats during Crisis phase |
| `ORDEAL_CAPABILITY_THRESHOLD` | `0.5` | Capability needed for "scraped_through" on middle Ordeal choice |
| `ORDEAL_DIRECT_COST` | `5` | Essence for guaranteed triumph |
| `ORDEAL_SUBTLE_COST` | `2` | Essence for guided attempt |
| `TEMPLATES_PER_PHASE` | `5-8` | Target structural templates per journey phase |

### Tracing

```typescript
interface JourneyBeatTrace {
  type: 'journey_beat';
  tick: number;
  agentId: string;
  phase: CampbellianPhase;
  doomClockPercent: number;
  stateSnapshot: StateSnapshot;
  templateId: string;
  variantKey: string;
  playerChoiceId: string;
  isOrdeal: boolean;
  ordealOutcome?: OrdealOutcome;
}
```

### Fail-soft

| Failure | Fallback |
|---------|----------|
| No template matches state snapshot | Use generic "fate moves" template for the phase |
| Doom clock ends before Ordeal fires | Force-fire Ordeal at 90% doom |
| First dies during journey | Truncate arc, clear court position |
| Beat history corrupted | Ignore history, select variant from current state only |
| Enrichment fails for beat | Render structural template without enrichment |

**PRNG:** Template variant selection within a phase uses `beatSeed = hash(gameSeed, agentId, phase, beatIndex)`.

---

## System 5: Journey Vignettes & Universal Encounter Visibility

The vignette system is the god's window into the mortal world. Thread thickness determines how much the player sees and can do.

### The First — Scheduled Auto-Interrupt

When a journey beat fires (System 4), the game pauses and presents a `JourneyVignetteModal`:
1. Doom clock triggers beat → orchestrator sets `gameState.pendingVignette`
2. Tick loop pauses
3. Modal renders with rich prose, enriched content, 2-3 choices
4. Player chooses → effects applied → modal closes → tick loop resumes

Journey vignettes always include a **"step back" choice** (the god withdraws, the First acts on their own). This feeds the intervention tracking. Constantly steered Firsts may resent it. Free Firsts may be more loyal — or drift.

### Retinue — Encounter Notifications

When a retinue member enters an encounter, a notification appears. Player clicks to view:
1. Medium prose vignette (shorter than The First's)
2. 1-2 choices (one intervention, one "let it play out")
3. Game does NOT pause unless player has set `attentionMode: 'pause'` on this thread
4. If `auto_resolve`: timeout of `RETINUE_VIGNETTE_TIMEOUT` ticks, then auto-resolves

### Watched — Encounter Peeks

Brief log entry: "Theron enters the ruins of Ashenmoor." Player can click to see:
1. Short snapshot (1-2 sentences)
2. Option to spend essence boosting the mortal's encounter odds
3. No choices — just observation + resource commitment

### All Threaded Agents — Encounter Intervention

For any encounter involving a threaded agent, the player can view and influence:
- **View:** See a vignette of the encounter (depth varies by thread thickness)
- **Spend:** Commit essence to tilt encounter probability (existing `divineInterventionModifier` in resolution formula)
- **This happens when the game is paused** — the player clicks in, sees the situation, makes a resource decision

### Intervention Tracking

```typescript
interface InterventionTracking {
  totalVignettes: number;
  playerIntervened: number;
  playerWithdrew: number;
  interventionRatio: number;      // intervened / totalVignettes
  supportiveCount: number;        // Nudge + shield choices
  coerciveCount: number;          // Challenge + force choices
  essenceSpentOnEncounters: number;
}
```

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `RETINUE_VIGNETTE_TIMEOUT` | `8` | Ticks before retinue vignette auto-resolves |
| `ENCOUNTER_PEEK_COST` | `1` | Essence to peek at a Watched agent's encounter |
| `ENCOUNTER_BOOST_MIN` | `1` | Minimum essence to boost encounter odds |
| `ENCOUNTER_BOOST_MAX` | `5` | Maximum essence per encounter boost |
| `BOOST_TO_PROBABILITY_RATIO` | `0.03` | Probability increase per essence spent |

### Fail-soft

| Failure | Fallback |
|---------|----------|
| Vignette modal dismissed | "Step back" fires |
| Agent dies between trigger and choice | Cancel vignette, truncate if First |
| Essence insufficient for boost | Gray out option |
| Multiple vignettes pending simultaneously | Queue, resolve in order of thread thickness |

---

## System 6: The Return — Peak-End Convergence

The Return fires during the Return phase (85-100% doom clock). The outcome is determined by a **peak-end convergence model**: the Ordeal (peak) and the final relationship state (end) dominate, with Founding Gates filtering impossible outcomes and Ripple Consequences propagating effects through the First's connections.

### The Four Inputs

**0. Founding Gates (from meeting encounter — hard prerequisites):**

Certain Return outcomes require narrative seeds planted during the meeting. If the founding moment didn't contain the germ of this ending, it can't happen.

| Outcome | Founding Gate | Narrative Logic |
|---------|--------------|----------------|
| **Loyal Ascension** | At least one dilemma tagged `noble` | The seed of devotion was there from the start |
| **Usurper** | At least one dilemma tagged `cunning` or `dark`, OR archetype is Schemer/Trickster/Fallen Noble | The seed of rebellion was planted |
| **Vanishing** | No gate — any founding can lead to absence | Anyone can walk away |
| **Sacrifice** | At least one dilemma tagged `noble` or `sacrifice`, AND intent reach ≠ Shadow | The willingness to give was always there |
| **Transcendence** | Intent reach is Star, Veil, or Eye | The spark was always otherworldly |
| **Monster** | At least one dilemma tagged `dark` | The shadow was visible from the beginning |

**1. The Ordeal outcome (dominant signal):**

| Ordeal Outcome | Opens | Closes |
|---------------|-------|--------|
| `triumph` | Loyal Ascension, Sacrifice, Transcendence | Monster |
| `scraped_through` | All 6 remain possible | — |
| `broken` | Monster, Vanishing, Usurper | Loyal Ascension |

**2. Final relationship state (tiebreaker):**

```typescript
interface RelationshipState {
  bondTier: number;
  totalEssenceSpent: number;
  interventionRatio: number;
  supportiveVsCoercive: number;
  cooperationStrategy: CooperationStrategy;
  trust: number;
}
```

**3. Archetype default trajectory (soft tiebreaker):**

Each archetype has natural endings (see v1 doc for full table). Fires when Ordeal + relationship don't clearly favor one outcome.

### Convergence Algorithm

```
function resolveReturn(meetingRecord, ordeal, relationship, archetype, beatHistory):
  eligible = ALL_OUTCOMES.filter(o => passesFoundingGate(meetingRecord, o))
  eligible = eligible.filter(o => !closedBy(ordeal, o))

  for each outcome in eligible:
    score = ordealBonus(ordeal, outcome)
    score += relationshipScore(relationship, outcome)
    score += archetypeDefault(archetype, outcome)
    scores[outcome] = score

  return highest score (ties: archetype default > alphabetical)
  // If eligible empty: Vanishing (always gateless)
```

### The 6 Outcomes

**Loyal Ascension:** Agent becomes minor allied Ascendant. Unique court position "The Risen."
**Usurper:** Agent becomes rival Ascendant. Personal antagonist born from the player's choices.
**Vanishing:** Thread severed. Agent walks away as a mortal. Just absence.
**Sacrifice:** Agent dies. Permanent sacred site/artifact at last location.
**Transcendence:** Agent becomes genius loci / eternal guardian. Permanent hex feature.
**Monster:** Agent becomes hostile empowered mortal. Persistent threat.

### Ripple Consequences

The First doesn't exist alone. When the Return fires, the system walks the First's graph edges and applies secondary consequences to significant connections.

```typescript
function gatherRippleTargets(graph, agentId): RippleTarget[] {
  // Artifacts at Storied+ tier (possesses edges)
  // Agents with trust > 0.5 or < -0.3 (relates_to edges)
  // Factions where First holds rank (member_of edges)
  // Locations First controls (controls edges)
  // Spouse/partner (relates_to with basis 'romantic')
  // Cap at RIPPLE_MAX_TARGETS, sorted by significance
}
```

**Consequence matrix (abbreviated — full matrix in v1 doc):**

| Connection | Sacrifice | Usurper | Monster |
|-----------|-----------|---------|---------|
| **Legendary weapon** | Sacred relic at sacrifice site | Usurper keeps it (corrupted) | Cursed weapon |
| **Spouse** | Inherits leadership | Must choose sides | Monster's first target |
| **Faction led** | Memorial order | Faction splits | Members scatter |
| **Controlled location** | Sacred site | Contested territory | Place of dread |

Each ripple target gets a short prose beat: "The Ashen Blade rests upon the altar where she fell. It will never be lifted again."

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `ORDEAL_STRONG_BONUS` | `3` | Score for strong ordeal→outcome match |
| `ORDEAL_WEAK_BONUS` | `1` | Score for weak match |
| `RELATIONSHIP_TRUST_WEIGHT` | `1.0` | Trust contribution multiplier |
| `RELATIONSHIP_COOPERATION_WEIGHT` | `1.5` | Cooperation strategy multiplier |
| `ARCHETYPE_DEFAULT_BONUS` | `1` | Bonus for archetype's natural ending |
| `RIPPLE_MAX_TARGETS` | `5` | Max connections receiving ripple consequences |
| `RIPPLE_FACTION_SPLIT_THRESHOLD` | `0.4` | Trust threshold for Usurper loyalty split |

### Tracing

```typescript
interface ReturnResolutionTrace {
  type: 'return_resolution';
  tick: number;
  agentId: string;
  outcome: ReturnOutcome;
  foundingGateResults: Record<ReturnOutcome, boolean>;
  ordealOutcome: OrdealOutcome;
  relationshipState: RelationshipState;
  scores: Record<ReturnOutcome, number>;
  eligibleOutcomes: ReturnOutcome[];
  beatHistory: BeatOutcome[];
}

interface RippleConsequenceTrace {
  type: 'ripple_consequence';
  tick: number;
  sourceAgentId: string;
  returnOutcome: ReturnOutcome;
  targetNodeId: string;
  consequence: string;
}
```

### Fail-soft

| Failure | Fallback |
|---------|----------|
| All outcomes score ≤ 0 | Archetype default |
| Ordeal never fired | Treat as `scraped_through` |
| Relationship data missing | Default trust = 0 |
| Outcome state change fails | Fall back to Vanishing |
| Ripple target deleted | Skip, warning trace |

**PRNG:** Return is fully deterministic. Faction-split loyalty checks use `rippleSeed = hash(gameSeed, firstAgentId, 'ripple', targetNodeId)`.

---

## System 7: Unified Vignette Engine

The core system powering meeting encounters, journey beats, retinue vignettes, and encounter peeks. One engine, many configurations.

### Layered Template Architecture

Every vignette is assembled from:

1. **Structural template** — hand-authored dramatic shape (setup → tension → choices → consequences)
2. **Axis selector** — algorithmic mapping from world state to template
3. **Dynamic enrichment** — graph-derived content fills template slots (System 8)
4. **Archetype tone** — hand-authored voice overlay per archetype

### Configuration by Context

| Context | Templates | Enrichment Depth | Choices | Prose Budget |
|---------|-----------|-----------------|---------|-------------|
| **Meeting encounter** | Meeting-specific (4 steps) | Full | 2-3 per step | **Highest** — longest prose in the game |
| **Journey beat (First)** | Phase-specific (5-8 per phase) | Full | 2-3 + "step back" | High |
| **Retinue vignette** | Generic encounter set | Medium | 1-2 | Medium |
| **Encounter peek (Watched)** | Minimal snapshot | Low | 0 (just resource commitment) | Low (1-2 sentences) |

### Ascendant Lens Overlay

Every vignette is wrapped in an ascendant lens — how the god perceives the moment, keyed to sphere:

```typescript
const ASCENDANT_LENS: Record<string, Record<string, string>> = {
  'observe': {
    'spirit': 'Their soul burns bright enough to see from the heavens.',
    'mind': 'You taste their thoughts — sharp, quick, unguarded.',
    'force': 'You feel the tension in them, like a drawn bow.',
    'shadow': 'They move through the world half-noticed. You notice.',
    'entropy': 'The threads of their fate are knotted here.',
    'creation': 'Something in them is unfinished, waiting to be shaped.',
    'life': 'The pulse of their blood sings to you.',
  },
  // ... per scene key
};
```

### Callback System

Journey beat vignettes reference meeting encounter choices. The `MeetingChoiceRecord` is passed to the prose generator:

- "She stands her ground — the same stubbornness you saw that first day at the grain merchant's stall."
- "He reaches for the shadows, just as he did on the harbour wall when you first noticed him."

Callbacks become more frequent and more specific as the arc progresses. The Ordeal should reference the founding moment at least once.

### Content Volume Targets

| Content Type | Target Count | Notes |
|-------------|-------------|-------|
| Meeting dilemma templates | 60+ | 3+ per archetype × location type |
| Journey structural templates | 25-40 | 5-8 per phase |
| Archetype tone overlays | 19 per template | Short — 1-2 sentences of voice |
| Ascendant lens entries | 7 spheres × ~20 scene keys | Prose snippets, not full scenes |
| Return outcome vignettes | ~60 | ~10 per outcome (archetype-grouped) |
| Ripple consequence prose | ~30 | Per connection type × outcome |
| Callback references | 2-3 per meeting choice | Prose echoes for journey use |

---

## System 8: Dynamic Prose Enrichment

The system that makes every vignette feel specific to THIS person in THIS world. Queries the graph at vignette generation time and injects real world elements.

### World State Query

```typescript
interface NarrativeContext {
  agentName: string;
  archetypeId: string;
  cultureName: string;
  primaryReach: ReachDomain;

  factionRank?: { factionName: string; rank: string };
  rulerOf?: { locationName: string };
  titles: string[];

  notableArtifacts: { name: string; tier: string; reach: ReachDomain }[];
  strongAllies: { name: string; trust: number }[];
  rivals: { name: string; trust: number }[];

  currentLocationName: string;
  currentHexTerrain: string;

  completedPhases: CampbellianPhase[];
  meetingChoiceRecord: MeetingChoiceRecord;
  beatHistory: BeatOutcome[];
}
```

### Placeholder System

Templates use tagged placeholders:

```
"{name} draws {artifact:weapon} and faces the darkness. {ally:strongest} stands beside {them}."
→ "Kira draws the Ashen Blade and faces the darkness. Theron stands beside her."
```

**Conditional blocks** handle presence/absence:

```
"{?has_artifact}The {artifact:weapon} hums.{/has_artifact}{?no_artifact}{They} feel{s} the weight of empty hands.{/no_artifact}"
```

Every template must work with zero enrichment (the First is a nobody with nothing). Enrichment adds specificity, not requirement.

### Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `ENRICHMENT_ARTIFACT_MIN_TIER` | `'storied'` | Min artifact tier for mention |
| `ENRICHMENT_ALLY_MIN_TRUST` | `0.5` | Min trust for named ally |
| `ENRICHMENT_MAX_NAMED_ALLIES` | `2` | Cap per vignette |
| `CALLBACK_PROSE_PROBABILITY` | `0.7` | Chance journey vignette includes meeting callback |

### Fail-soft

| Failure | Fallback |
|---------|----------|
| Graph query fails | Use fallback text for that placeholder |
| Agent has nothing notable | All enrichment falls back — prose reads as "a person alone" |
| Referenced entity deleted | Generic fallback text |

---

## Implementation Ordering

### Phase 0: Thread Edge Migration
1. Rename `worships` → `thread`, flip direction, extend properties
2. Update all callers to canonical query functions
3. Update world seed
4. **Milestone:** All existing worships functionality works through thread edge

### Phase 1: Foundation
5. Choice-point step type in encounter system
6. Court position on thread edge properties
7. Meet The First action template
8. Basic meeting encounter (4 steps with hardcoded candidates)
9. Agent creation from encounter output
10. **Milestone:** Player can trigger Meet The First and get a bonded agent

### Phase 2: Journey Engine
11. Doom-clock phase boundaries
12. Beat scheduling system (fire beats at phase boundaries)
13. State snapshot query (4 axes)
14. Structural template selection from state
15. Journey vignette modal (auto-interrupt for First)
16. Story ambition assignment
17. Beat history tracking on thread edge
18. **Milestone:** Journey beats fire on schedule, variants selected by world state

### Phase 3: The Return
19. Founding Gates (meeting choice tags → outcome eligibility)
20. Ordeal beat with capability check
21. Return convergence algorithm
22. 6 outcome implementations (primary game state changes)
23. Ripple consequence engine
24. Return vignette + ripple prose
25. Court slot lifecycle (cooldown, position clear)
26. **Milestone:** Complete arc from meeting to dramatic conclusion with ripple effects

### Phase 4: Universal Encounter Visibility
27. Retinue encounter notifications + medium vignettes
28. Watched encounter peeks
29. Encounter intervention (essence spending for probability boost)
30. Attention mode toggle (player changes thread's pause/auto setting)
31. **Milestone:** All threaded agents visible during encounters

### Phase 5: Dynamic Prose Enrichment
32. `gatherNarrativeContext` world state query
33. Placeholder system with conditionals
34. Enrichment integration into vignette renderer
35. Callback prose system (meeting choices echoed in journey)
36. **Milestone:** Vignettes reference actual world state

### Phase 6: Content & Polish
37. Full meeting dilemma library (60+ templates)
38. Full journey structural templates (25-40 across phases)
39. Archetype tone overlays (19 per template)
40. Ascendant lens prose (7 spheres × 20 scene keys)
41. Return outcome prose (per-archetype variants)
42. Ripple consequence prose
43. **Milestone:** Rich, varied content across all archetypes and locations

---

## NFP Compliance Summary

| Priority | NFP | Status |
|----------|-----|--------|
| 1 | **Tunability** | PASS — 65+ named constants across 9 systems. Phase boundaries, candidate counts, dilemma magnitudes, cooldowns, thresholds, boost ratios — all tunable. |
| 2 | **Inspectability** | PASS — Every system emits typed traces. Journey beats log state snapshots, template selection, and player choices. Return trace shows full scoring breakdown with founding gates. |
| 3 | **Determinism** | PASS — All randomness seeded. Return is fully deterministic. Beat selection deterministic from state. Same seed + same choices = same arc. |
| 4 | **Fail-soft** | PASS — Every system has a fail-soft table. Missing content falls back to generic. Broken encounters abort. Return falls back to Vanishing. Enrichment degrades gracefully. |
| 5 | **Narrative over mechanical** | PASS — Peak-end convergence, no failure states, branching story tree driven by world state rather than stat checks. The Ordeal capability check is the only resolution roll in the entire arc. |
| 6 | **Additive over destructive** | PASS — New step type alongside existing. New edge type replaces old (migration, not deletion). New ambition type alongside existing. Thread edge extends, doesn't replace properties. |
| 7 | **Performance** | PASS — Journey beats fire ~8-10 times per arc. State snapshot query is a graph traversal (existing infrastructure). No per-tick cost beyond existing encounter system. |

---

## Addendum: Review Decisions (2026-03-26, post-v2)

Decisions made during detailed review session after v2 was written. These refine and extend the systems above.

### A. Meeting Encounter — Co-Authorship Mechanics

**Principle: "Half character discovery, half player co-authorship."** The agent's personality cannot be controlled, only influenced through lived experience. The god has a plan and is hunting for the right person.

#### Step 1 Refinements

- Player picks **primary reach + secondary reach** (not just one). This pair defines the archetype.
- Player also picks a **sphere/domain**.
- **Candidates are generated from scratch** — not pulled from an existing agent pool. The fundamental numbers that define the character are created within the constraints of the player's choices.
- Primary reach is boosted above average, secondary reach is slightly above average, remaining seven reaches are randomized at a lower threshold with variance.
- **Axiological profile is random.** The player cannot see or edit the ten value pairs. They see personality hints ("willful, courageous, merciful") that gesture toward the profile without revealing numbers.
- **Flavor tagging system:** Player picks from proposed descriptors across categories. Appearance (gender, height, hair, etc.) and manner/bearing. These are optional — skip and the game randomizes. Stored permanently and fed into the prose resolver for all future encounters and the character sheet.
- Flavor choices are **image-constrained** — limited to what we can illustrate with a character image library. Small, curated set. Enough that players can pick something that resonates.
- **One archetype name per primary×secondary reach combination** — 81 combinations. Source pool: the full breadth of fantasy and sci-fi literature.

#### Step 2 Refinements — Dilemma Content Architecture

Four dilemma categories, ~150 typed + a general pool:

| Category | Count | Keyed to | What it changes | Character's role |
|---|---|---|---|---|
| Axiological | ~50 (5 × 10 pairs) | Value pair | Personality shift | Victim — something happens *to* them |
| Reach-specific | ~45 (5 × 9 reaches) | Reach domain | Capability growth | Practitioner — shaped by experience |
| Domain-specific | ~35 (5 × 7 spheres) | Sphere | Cosmic alignment | Touched by forces beyond them |
| General/graph | Larger pool, unconstrained | Nothing specific | Adds graph elements (allies, equipment, factions, mounts) | Adventurer — gains connections |

**Axiological dilemmas are universal.** They're about what happens TO the person, not about their capabilities. A story about losing mercy works regardless of reach. They don't multiply by reach × domain.

**Dilemma choices produce any combination of:** axiological profile shifts, reach level changes, domain alignment nudges, and **graph additions** (allies, equipment, faction membership, named mounts). Anything from the game's graph vocabulary is valid as a dilemma outcome, as long as it's a cool story.

**One dilemma should always target the main axiological pairing** for the chosen reach (using the existing REACH_VALUE_PAIR mapping). Example: Iron reach → Mercy vs. Cruelty pairing. The player can get a merciful warlord, then put them through a dilemma where they "lose all their empathy and become ruthless."

**The dilemmas also generate two narrative traits** — these come from the story, not from a god-granted list.

**Research task (TB-038):** Full creative-attention research into what kinds of origin-story dilemmas resonate across mythology, fantasy literature, and hero's journey traditions. Brief: `Docs/plans/2026-03-26-dilemma-research-brief.md`.

#### Step 3 Refinements — The Spark

- Player picks **one trait from a god-given list** — distinct from the two narrative traits from dilemmas. Filtered by primary reach, secondary reach, primary sphere, secondary sphere. No essence cost.
- **The ambition is set** and must feel like it *grew from the story*. It's the consequence of what the god put this person through, not a menu. The ambition system already supports changes over time — this is just the starting ambition.

### B. Founding Gates — Tag-Based Gating

Validated via prose eval (`Docs/plans/2026-03-26-meeting-encounter-prose-eval.md`). Six complete meeting encounter paths demonstrate that gate tags emerge naturally from story choices without feeling forced.

**Tag architecture:** Each dilemma choice carries `gateTags[]`. The meeting's accumulated tags determine which of the 6 Return outcomes are eligible. Gate tags documented in the prose eval (e.g., `heroic_origin`, `duty_over_desire`, `devotion_seed`, `sacrifice_seed`, `ruthless_origin`, `transcendence_seed`, `cosmic_touch`).

**Gating should leave 1–2 primary eligible outcomes** with the journey determining which fires. Not so tight that the meeting locks in one ending, not so loose that gates are meaningless.

### C. Attention Mode — Thread Thickness Gates Access

**The reward for pause mode is access to the choice itself.** No hidden bonus. You either see the encounter and can intervene, or you don't. That's enough.

**Thread thickness (tier) gates pause access.** You can't just toggle pause on anyone — the thread must be thick enough (tier threshold). This naturally paces the player:
- Early game: one thick thread (The First, auto-pause), everyone else thin (auto-resolve)
- Over time: essence investment thickens threads, more agents become eligible for pause
- Progression is organic, not a UI setting

**Design intent — attention management:** We don't want a player hiring 5 agents at turn 5 and setting them all to pause. The system forces focus: start with one deep relationship, then expand.

**Thread thickness is also a prerequisite for strategic actions (TB-036).** The same investment axis (essence → thread tier) unlocks both encounter interventions (this design) and strategic actions (next design). The thread is the universal currency of divine attention.

### D. Ambition System Assessment

**Current system is sufficient** for the journey design. Key findings:
- 10 standard + 4 reactive ambition templates with milestone-based progression
- Milestones evaluate graph conditions (reach levels, trait possession, bond counts, location control, region presence)
- `completedMilestones[]`, `status`, and `priority` are queryable on the `pursues` edge
- Ambitions boost action/encounter scoring but don't directly modify capabilities
- The doom-clock journey can read ambition state as one of its world-state axes without changes: "How many milestones has the First completed?" and "What category of ambition are they pursuing?" are already answerable

### E. Prose Budget Directives

- **Meeting encounter gets the highest prose budget in the game.** The defining moment (axiological dilemma) and seeking threads (Step 1 intent prose) get extra budget.
- **Quality bar:** The prose eval (`Docs/plans/2026-03-26-meeting-encounter-prose-eval.md`) is the benchmark. Templates must produce output at this level after enrichment.
- **Variety directive:** "Enough different versions to make it really, really interesting." Variety should not be skipped to make things faster.
- **Journey vignettes:** High budget for First, medium for Retinue, minimal for Watched. The system scales prose investment with thread thickness.

### F. Open Questions Deferred to Implementation

- **Beat history pattern-matching details:** How exactly does prior beat sequence weight Crisis/Ordeal variant selection? (Principle established: it does. Implementation details for Phase 2.)
- **Retinue vignette content spec:** Exact prose length, choice count, enrichment layers. (Phase 4.)
- **Character image library scope:** What images we can generate/source constrains flavor choices. (Separate art task.)
