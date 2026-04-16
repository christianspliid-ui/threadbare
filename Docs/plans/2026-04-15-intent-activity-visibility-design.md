# Intent & Activity Visibility for the Living World — THR-22 Design

> **Date:** 2026-04-15
> **Status:** In Design
> **Issue:** [THR-22](https://linear.app/threadbare/issue/THR-22/tb-108-intent-and-activity-visibility-for-the-living-world)
> **Project:** Thematic Pressure & Living World
> **Depends on:** Ambition/intention systems (✅), movement and encounter history (✅)

---

## Problem Statement

The simulation generates rich agent behavior — ambitions, multi-step actions, movement decisions, encounter engagements, faction relationships — but none of it is visible without clicking into an agent's detail panel. Locations feel empty. The hex map shows dots that move, but not *why* they move. The world looks dead between player interventions.

**The gap:** There's no ambient visibility layer. To understand what's happening, the player must open panels, read details, and mentally aggregate. The simulation is alive; the surface is inert.

**Design goal:** The player should be able to glance at a location and feel that it's inhabited — that things are happening, people have purposes, and social currents are flowing. This must work *without* opening any panel. The hex map and location summaries should radiate enough signal that the player forms expectations about what they'll find when they look closer.

### The Anti-Spreadsheet Constraint

This system must avoid becoming a dashboard. The player is a divine observer, not a data analyst. Activity visibility should read as atmospheric narrative, not KPIs. "The market is busy today" not "3 agents performing trade actions." "Tension simmers" not "unrest: 62%." The prose-first principle (memory: `feedback_prose_first_ui`) applies everywhere.

---

## Core Concept: Three Visibility Surfaces

Activity visibility operates at three scales, each communicating a different grain of information:

| Surface | Scale | What it shows | Where it appears |
|---------|-------|--------------|-----------------|
| **Hex Pulse** | Hex level | Aggregate activity mood for the hex | HexMapV2 — subtle visual indicators on hex tiles |
| **Location Murmur** | Location level | What's happening here right now (1–3 lines) | Location tooltip on hex hover, and location headers in panels |
| **Agent Thread** | Individual | What this agent is doing and why | Agent tooltip on hex hover, agent dots on hex map |

### Design Principle: Knowledge-Gated Presentation

Not everything is visible to the player immediately. Activity visibility respects the fog-of-war and familiarity systems:

- **Fog-hidden hexes:** No activity visibility at all (hex pulse, murmur, threads all hidden)
- **Low familiarity agents:** Activity thread shows vague: "a traveler, heading somewhere with purpose"
- **Medium familiarity:** "Kael heads toward the market — he seems determined"
- **High familiarity / bonded:** "Kael is negotiating a trade deal with Voss — step 2 of 3, going well so far"

This gating uses the existing familiarity system. No new mechanics needed — just presentation rules.

---

## Engine Pillar

### Location Activity Summary

A new derived data structure computed each tick, summarizing what's happening at each location.

```typescript
interface LocationActivitySummary {
  locationId: string;
  /** Overall activity level: quiet | stirring | busy | tense | volatile */
  pulse: LocationPulse;
  /** 1–3 narrative murmur lines describing current activity */
  murmurs: string[];
  /** Agent activity threads for agents at this location */
  agentThreads: AgentActivityThread[];
  /** Active encounter count (not names — those require familiarity) */
  encounterPressure: number;
  /** Dominant activity category this tick */
  dominantActivity: ActivityCategory | null;
}

type LocationPulse = 'quiet' | 'stirring' | 'busy' | 'tense' | 'volatile';

type ActivityCategory =
  | 'commerce'    // trade actions, Gold reach activity
  | 'conflict'    // duel/contest actions, Iron reach
  | 'diplomacy'   // social actions, Heart reach
  | 'intrigue'    // shadow actions, information gathering
  | 'devotion'    // Star/Veil actions, religious activity
  | 'craft'       // Stone actions, building
  | 'exploration' // Eye actions, discovery
  | 'gathering'   // multiple agents converging
  | 'dispersal'   // agents leaving
  | 'idle';       // nothing happening

interface AgentActivityThread {
  agentId: string;
  agentName: string;
  /** Prose-form activity description, gated by familiarity */
  visibleActivity: string;
  /** Activity category for hex-level aggregation */
  category: ActivityCategory;
  /** Movement intent: arriving, present, departing, or null */
  movementPhase: 'arriving' | 'present' | 'departing' | null;
  /** Emotional temperature from recent outcomes (cool/warm/heated) */
  temperature: 'cool' | 'warm' | 'heated';
}
```

### Computation: `deriveLocationActivities()`

Runs as a UI-side derivation (not an orchestrator phase — this is presentation, not simulation). Called from the existing `useGameSelectors` or equivalent memo, gated by `worldVersion`.

**Performance contract (mandatory):**
- **One-pass `located_at` index:** Build a `Map<locationId, agentId[]>` in a single pass over all `located_at` edges — O(agents). Do NOT iterate locations × agents (that's O(agents × locations) and hits ~1000 agents on seeded maps).
- **Visible-hex-only derivation:** Only compute summaries for locations on hexes currently visible in the camera viewport. Use the existing HexMapV2 frustum/visible-hex set. Off-screen locations get no summary (they're not rendered anyway).
- **Global particle cap:** `HEX_PULSE_MAX_TOTAL_PARTICLES` (default 200). If visible hexes × particles-per-hex would exceed this, reduce per-hex particle count proportionally. Prevents GPU saturation on dense maps.
- **Profiling gate:** Implementation must include a performance measurement pass before merge. Run `?view=game&seeded` on `large` and `epic` map presets, measure frame time delta with/without the derivation + particles. If >2ms added per frame, optimize before merging.

**Steps:**
1. **Build `located_at` index** (single pass over edges):
   Build `Map<locationId, agentId[]>` from all `located_at` edges where target is a location node.
2. For each **visible** location with at least one agent:
   a. Look up agents from the index
   b. For each agent, derive `AgentActivityThread` from unified actions, movement state, recent encounter history
   c. Classify agent activity into `ActivityCategory` based on action reach
   d. Derive `movementPhase` from movement queue (arriving = has this location as destination, departing = has queued movement away)
   e. Derive `temperature` from recent step outcomes (failure/complication in last 3 ticks → heated, success → warm, idle → cool)
2. Compute `LocationPulse` from aggregate:
   - 0 agents = `quiet`
   - 1–2 agents, all idle = `stirring`
   - 3+ agents or any active actions = `busy`
   - Any conflict category activity = `tense`
   - 2+ conflict activities or active encounter with contestation = `volatile`
3. Generate `murmurs` (1–3 lines) by selecting from prose templates keyed by (pulse, dominantActivity, encounterPressure, activeOmenCategory):
   - `quiet`: "The settlement rests under a grey sky."
   - `busy` + `commerce`: "The market square hums with barter and argument."
   - `tense` + `conflict`: "Hands rest on hilts. The wrong word could start something."
   - `volatile`: "The air crackles. Every face is a threat or an ally — nothing in between."

### Murmur Prose Templates (~60)

Keyed by `(LocationPulse, ActivityCategory, OmenCategory?)`:

```typescript
const MURMUR_TEMPLATES: Record<LocationPulse, Record<ActivityCategory, string[]>> = {
  quiet: {
    idle: [
      "Smoke rises from a single chimney. Otherwise, stillness.",
      "A dog sleeps in the road. Nobody disturbs it.",
    ],
    commerce: [
      "A lone merchant arranges {possessive} wares, more habit than hope.",
    ],
    // ...
  },
  tense: {
    conflict: [
      "Voices carry from the square — sharp-edged, not quite shouting. Not yet.",
      "Armed figures move with purpose. The settlement watches from doorways.",
    ],
    intrigue: [
      "Conversations stop when strangers approach. Doors close a fraction earlier than usual.",
    ],
    // ...
  },
  // ...
};
```

**Omen coloring:** When an active omen's vocabulary is available, murmur templates can reference `{omen_adj}` and `{omen_atmosphere}` for atmospheric injection. "The {omen_adj} market square hums with barter."

### Hex Pulse Aggregation

For HexMapV2, hex-level pulse is the maximum pulse of all locations on that hex. This drives a subtle visual indicator (see UI Pillar).

---

## UI Pillar

### 1. Hex Pulse Indicators (HexMapV2)

A subtle visual effect on hex tiles indicating aggregate activity level. This is NOT a new overlay layer — it's a modification to the existing hex rendering.

| Pulse | Visual Effect |
|-------|--------------|
| `quiet` | No effect (default hex appearance) |
| `stirring` | Faint ambient particle drift (2–3 particles, slow, low opacity) |
| `busy` | Moderate particle activity (5–8 particles, warm-toned) |
| `tense` | Particles shift to amber/red, slightly faster movement |
| `volatile` | Particles become sharp sparks, rapid, with occasional flash |

**Implementation:** Extend the existing signifier particle system or add a new InstancedMesh layer for pulse particles. Performance budget: at most 10 particles per visible hex, instanced rendering, LOD-culled at high zoom.

### 2. Location Murmur Tooltips

On hex hover (existing tooltip system), add murmur text below the location name:

```
┌──────────────────────────────┐
│  Thornhaven (Town)           │
│  ─────────────────────────── │
│  The market square hums with │
│  barter and argument.        │
│                              │
│  ● Kael — negotiating        │
│  ● Sera — arriving           │
│  ○ (2 others)                │
└──────────────────────────────┘
```

- Murmur text in italic, muted color
- Agent threads below: bullet list, prose-form activity, gated by familiarity
- Low-familiarity agents grouped as "(N others)" to avoid clutter
- Maximum 3 named agents + 1 "(N others)" line

### 3. Agent Dot Enhancement (HexMapV2)

Agent dots on the hex map currently show position. Enhance with:

- **Movement trails** (already exist) — no change
- **Activity halo:** A tiny color ring around the agent dot indicating their current activity category:
  - Commerce = gold
  - Conflict = red
  - Diplomacy = blue
  - Intrigue = purple
  - Devotion = white
  - Exploration = green
  - Idle = no halo (grey dot only)
- **Movement phase indicator:** Arriving agents have a subtle trail leading to the hex. Departing agents have a trail leading away. Present agents are static.

### 4. World Pulse Panel Integration

The existing World Pulse / chronicle area gets a "Living World" summary bar (compact, one line) that rotates through the most active locations:

- "Thornhaven buzzes with commerce. Ironkeep braces for conflict. The western reaches are quiet."
- Rotates every 8 seconds or on tick change
- Draws from the top 2–3 locations by pulse level + the overall quiet/active assessment

### 5. Reaction Visibility (Post-Intervention)

When the player performs an intervention and it bends agent behavior, the affected agent's activity thread should briefly flash or annotate the change:

- Before intervention: "Kael heads toward the forest"
- After whisper nudge: "Kael pauses — then turns toward the market instead" (brief highlight, 2 ticks)

This uses the existing premonition/intervention tracking; the UI just needs to detect when an agent's activity label changed within 1 tick of a player action.

---

## Wiring Section

| Module | Phase/Hook | UI Component | GameState Flow | Traces | Debug | Player Controls |
|--------|-----------|--------------|----------------|--------|-------|-----------------|
| `deriveLocationActivities()` | UI memo, gated by `worldVersion` | LocationMurmur tooltip, HexPulse | Reads graph (agents, locations, edges), unifiedActions, encounterProgress, movementState, omenState | N/A (UI derivation, not engine) | LocationActivity debug tab | Hover for tooltip |
| Hex pulse particles | HexMapV2 render loop | New particle sublayer | Reads derived hex pulse map | N/A | Visible in hex overlay debug | N/A (ambient) |
| Agent activity halos | HexMapV2 agent layer | Agent dot enhancement | Reads `agentThreads` from derived data | N/A | Visible in agent layer debug | N/A (ambient) |
| Living World summary bar | UI component | WorldPulseSummary (new) | Reads top location summaries | N/A | N/A | N/A (ambient) |
| Murmur prose templates | `MURMUR_TEMPLATES` data | Tooltip text | Templates + omen vocabulary | N/A | Template ID in tooltip debug mode | N/A |

---

## Constants Table (NFP #1)

| Constant | Default | Purpose |
|----------|---------|---------|
| `LOCATION_PULSE_BUSY_THRESHOLD` | `3` | Agent count for 'busy' pulse |
| `LOCATION_PULSE_VOLATILE_CONFLICT_COUNT` | `2` | Conflict activities needed for 'volatile' |
| `MURMUR_MAX_LINES` | `3` | Maximum murmur prose lines per location |
| `TOOLTIP_MAX_NAMED_AGENTS` | `3` | Max named agents in location tooltip |
| `FAMILIARITY_VAGUE_THRESHOLD` | `0.3` | Below this, agent activity is vague |
| `FAMILIARITY_DETAIL_THRESHOLD` | `0.7` | Above this, full activity detail shown |
| `TEMPERATURE_HEATED_LOOKBACK` | `3` | Ticks to look back for failure/complication |
| `HEX_PULSE_PARTICLE_COUNT` | `[0, 3, 6, 8, 12]` | Particles per pulse level (quiet→volatile) |
| `HEX_PULSE_PARTICLE_SPEED` | `[0, 0.5, 1.0, 1.5, 2.5]` | Particle speed per pulse level |
| `HEX_PULSE_MAX_TOTAL_PARTICLES` | `200` | Global particle cap across all visible hexes |
| `WORLD_SUMMARY_ROTATION_SECONDS` | `8` | Seconds between living world summary rotation |
| `WORLD_SUMMARY_TOP_LOCATIONS` | `3` | Number of locations in the summary bar |
| `INTERVENTION_REACTION_HIGHLIGHT_TICKS` | `2` | Ticks to highlight activity change post-intervention |

---

## Fail-Soft Table (NFP #4)

| Failure Case | Fallback |
|-------------|----------|
| No agents at location | LocationPulse = 'quiet', no murmurs, no threads |
| Agent has no unified action and no movement | ActivityCategory = 'idle', thread = "Idling" |
| Murmur template pool empty for (pulse, category) | Generic murmur: "Life goes on." |
| Familiarity data missing for agent | Default to vague (low familiarity) display |
| Omen vocabulary missing for omen injection | Murmur renders without omen adjectives |
| HexPulse particle system not available (performance) | Fall back to static color tint on hex |
| Location has 50+ agents (edge case) | Cap tooltip at TOOLTIP_MAX_NAMED_AGENTS + "(N others)" |
| `worldVersion` not bumping (paused game) | Derived data stays cached (correct behavior) |

---

## NFP Compliance

| Priority | NFP | Status | Notes |
|----------|-----|--------|-------|
| 1 | Tunability | PASS | All thresholds, particle counts, rotation intervals are named constants. |
| 2 | Inspectability | PASS | Debug panel shows derived location summaries. Hex overlay debug shows pulse level. |
| 3 | Determinism | PASS | Murmur selection uses seeded PRNG (tick-based seed for reproducible murmur per tick). |
| 4 | Fail-soft | PASS | See table. Missing data → quiet/idle/generic. Never crashes. |
| 5 | Narrative over mechanical | PASS | Everything is prose. "The market hums" not "3 trade actions." Knowledge-gated presentation prevents spreadsheet-ification. |
| 6 | Additive | PASS | New derived data structures. New UI sublayers. No existing components modified except tooltip extension. |
| 7 | Performance | PASS with gate | One-pass `located_at` index: O(agents + locations), not O(agents × locations). Visible-hex-only derivation. Global particle cap (200). Instanced rendering with LOD cull. **Profiling gate required before merge:** measure frame time on `large`/`epic` maps, reject if >2ms added per frame. |

---

## Implementation Scope Estimate

| Task | Pillar | Size |
|------|--------|------|
| `LocationActivitySummary` types + `deriveLocationActivities()` | Engine | M |
| Murmur prose templates (~60) | Content | M |
| Knowledge-gated presentation rules | Engine | S |
| Hex pulse particle sublayer | UI/HexMap | M |
| Location murmur tooltips | UI | M |
| Agent activity halos | UI/HexMap | S |
| Living World summary bar | UI | S |
| Reaction visibility (post-intervention highlight) | UI | S |
| Tests (derivation, familiarity gating, pulse computation) | Engine | M |

**Total estimate:** ~3 Claude Code sessions

---

## Quality Gate Addendum (2026-04-16)

> Added to satisfy the design quality gate (`Docs/plans/2026-04-16-design-quality-gate.md`). Sections 1 and 9 were the primary gaps.

### Section 1: Player Experience Scenario

**The golden scenario.**

Tick 14. The player zooms out on the hex map to scan their territory. Two things catch their eye without clicking anything:

The hex containing Millhaven has a warm amber particle drift — *busy*. The hex two tiles north (Eastridge) has faster, redder particles — *tense*. Three other hexes show faint slow particles — *stirring*. The rest are still.

The player hovers over Millhaven. A murmur tooltip appears:

> *The market square rings with argument and coin. Three caravans arrived this morning, and Pyra Ironhand's new festival draws folk from the outer farms. Someone is singing badly near the well.*

Below the murmur, agent threads (for bonded agents at this location):

> *Kael Thornweaver — meeting with Lira in the back room of the Weathered Oak (2nd day)*

The player thinks: "Millhaven is buzzing — Pyra's festival is working, and Kael is doing *something* with Lira. I should check on that." They hover over Eastridge:

> *Voices carry from the square — sharp-edged, not quite shouting. Not yet. The patrol captain hasn't returned from the northern ridge.*

> *Serafina — on patrol, extended (overdue by 1 day)*

The player thinks: "Serafina is overdue. Eastridge is tense. That's where I need to focus." In ten seconds of hovering, the player has done their Beat 1 portfolio scan, identified the interesting location, and decided where to spend their attention — all through prose, not spreadsheet.

**The mundane scenario.**

Most hexes on most ticks are *quiet* or *stirring*. The murmurs for these states are atmospheric rather than actionable:

> *Smoke rises from a single chimney. Otherwise, stillness.*

> *Two farmers argue about a fence line. The argument has been going on for years. Neither expects it to end.*

These don't demand player attention. They provide texture — the sense that the world exists between dramatic moments. The player scans past them in quick turns, but they accumulate into a feeling of inhabited space.

**The failure scenario.**

The system fails when murmurs are generic or repetitive — when every "busy" settlement sounds the same. The template pool (~60) is sized to avoid this, but the quality bar is: a player who hovers over five different "busy" locations in one session should never read the same murmur twice, and each murmur should feel specific to the activity happening *at that location*.

### Section 9: Content Benchmark Moments

#### Benchmark 1: The Glanceable Scan (Hex Pulse — Golden)

**Setup:** Turn 16. Player has 3 bonded agents across 3 settlements. They advance the tick and look at the map.

**Trigger:** `deriveLocationActivities()` runs for all visible hexes. Hex pulse particles update.

**The moment (visual, no click needed):**

The hex map shows life: Millhaven glows warm (6 particles, slow, amber — *busy*). Eastridge pulses faster (8 particles, red-shifted — *tense*). The crossroads settlement has 2 faint drifting particles (*stirring*). The frontier hamlet is dark (*quiet*). The forest hex where no one lives has nothing.

**Player's internal response:** "Three of my settlements are alive. Eastridge looks wrong. I'll check there first." The player made a triage decision from visual information alone — no panel, no click, no text. The hex map told them where the story is.

**Forward hook:** The player's attention is drawn to Eastridge, where Serafina's overdue patrol will generate a curated encounter next tick.

#### Benchmark 2: The Murmur That Changes Your Plans (Location Murmur — Golden)

**Setup:** Player is about to advance the tick. They're focused on Kael's initiative at Millhaven. They absently hover over Thornwall (their secondary settlement) to check in.

**Trigger:** Thornwall murmur generated from (tense, intrigue, omen: Breach).

**The moment (tooltip):**

> *Conversations stop when strangers approach. Doors close a fraction earlier than usual. Whatever happened at the Eastridge has people here looking sideways at anyone they don't recognize.*

Agent thread below:

> *Dorek — drinking alone at the tavern (3rd day in a row)*

**Player's internal response:** "Wait — Dorek has been drinking alone for three days? He was fine last time I checked. And Thornwall is spooked. Something happened while I was watching Kael." The player's attention shifts. A location they were going to skip becomes the focus of their turn.

**Forward hook:** Dorek's condition has shifted from "settled" to "troubled." Investigation via encounter or divine action reveals what triggered it — connecting to a story thread the player wasn't tracking.

#### Benchmark 3: Post-Intervention Reaction (Reaction Visibility — Aftermath)

**Setup:** The player just spent essence to help Serafina's patrol return safely (divine intervention during an encounter). The encounter resolved with Serafina gaining condition "grateful but unsettled."

**Trigger:** Post-intervention visibility. Eastridge murmur regenerates after state change. Agent thread updates.

**The moment (tooltip, 1 tick after intervention):**

> *The patrol captain returned this morning. Nobody asks where she was. Her silence speaks for itself. The settlement breathes out — but not all the way.*

Agent thread:

> *Serafina — resting, not speaking to anyone (she keeps touching the pendant you guided her toward)*

**Player's internal response:** "My intervention worked — she's back. But it changed her. And the settlement noticed." The player sees the aftermath of their choice reflected in the world's texture. The divine action wasn't just a button press — it had visible, prose-communicated consequences.

**Forward hook:** Serafina's "grateful but unsettled" condition will color her next encounters. The settlement's murmur will shift from "tense" toward "watchful" — not fully relaxed, because what happened on the ridge hasn't been explained.

#### Benchmark 4: The Quiet Background (Mundane Murmur — 80% Case)

**Setup:** Player hovers over a quiet hamlet during a quick-scan turn. No bonded agents here. Nothing happening.

**Trigger:** Murmur generated from (quiet, idle, no omen context).

**The moment:**

> *A dog sleeps in the road. Nobody disturbs it.*

**Player's internal response:** This costs the player nothing — they scan past it in half a second. But it registered: this is a real place with a real dog. When something *does* happen at this hamlet later, the player will remember it as somewhere that was quiet once.

### Emotional Condition Mapping

The murmur system doesn't create conditions on agents — it *reads* them. But it creates an emotional condition on the *player*:

| World State | Murmur Tone | Player Feeling |
|------------|-------------|----------------|
| Quiet hex | Atmospheric, pastoral | "This place is fine. I can focus elsewhere." |
| Stirring hex | Hinting, suggestive | "Something might be developing. I'll check back." |
| Busy hex | Vibrant, populated | "Life is happening here. Good." |
| Tense hex | Sharp, watchful | "Something is wrong. I should intervene." |
| Volatile hex | Urgent, alarmed | "This is about to break. Where are my agents?" |

### Content Quality Bar

**"Every murmur must make the player feel that this is a place where people live, not a node on a graph. If a murmur could describe any settlement interchangeably, it fails. If a murmur makes the player pause during a quick scan, it succeeds."**
