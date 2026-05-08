---
name: prose-vignettes-and-enrichment
description: >
  Dynamic prose systems that run at generation time: vignettes, enrichment
  placeholders, encounter history persistence, and backstory strata. Load
  when implementing enrichment placeholders, authoring vignettes, modifying
  backstory strata, or working on encounter history → prose integration.
  Triggers on "vignette", "enrichment", "placeholder", "NarrativeContext",
  "backstory", "encounter history", "biography", "forecast tier",
  "prose enrichment", "{name}", "{artifact}", "{ally}", "conditional block".
model: opus
last_validated_against: 2026-05-08
---

# Prose Vignettes & Enrichment — Dynamic Prose Systems

Covers the four dynamic prose systems that run at generation time. Load `prose-pipeline` for resolver architecture, `prose-content-systems` for encounter templates and content tables.

---

## Step 0: Canon-First Pre-Read

Before authoring vignettes or enrichment placeholders, read [`Docs/canon/prose.md`](../../../Docs/canon/prose.md) first. The Canon page is the Step-0 entrypoint for all prose-domain authoring: it identifies which of the three prose skills to load, names the four pipelines, asserts the Threadbare voice rules and player-as-god framing, and points to Capability 1 of the systemic wiring guide (the prose-author chapter for placeholders and conditional blocks). Skim it once, then return here for vignette and enrichment detail. If a pointer in this skill disagrees with the Canon page, the Canon page wins and this skill needs an update — open a `drift-scan`-labeled Linear issue.

---

## System 3: Vignette Prose (Encounter Steps)

**Files:** `src/engine/vignetteProse.ts`
**Design:** TB-035

### Four-Part Structure

Every encounter step vignette has:

| Part | Purpose | Max Length |
|------|---------|-----------|
| **Scene** | Sets the physical/emotional stage | 3 sentences |
| **Lens** | Sphere-specific perspective on what's happening | Sphere-variant |
| **Stakes** | What's at risk | 2 sentences |
| **Forecast** | Narrative prediction based on probability | Tier-variant |

### Forecast Tiers

Mapped from encounter success probability:

| Probability | Tier | Narrative Tone |
|-------------|------|----------------|
| < 0.15 | `doomed` | Near-certain failure |
| < 0.35 | `perilous` | Dangerous odds |
| < 0.65 | `uncertain` | Could go either way |
| < 0.85 | `favorable` | Good odds |
| >= 0.85 | `fated` | Near-certain success |

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `VIGNETTE_SCENE_MAX_SENTENCES` | 3 | Scene section cap |
| `VIGNETTE_STAKES_MAX_SENTENCES` | 2 | Stakes section cap |
| `VIGNETTE_LENS_VARIANTS_PER_SPHERE` | 3 | Minimum lens variants per sphere |
| `VIGNETTE_FORECAST_VARIANTS` | 3 | Minimum forecast variants per tier × sphere |

---

## System 4: Prose Enrichment (Dynamic Placeholders)

**Files:** `src/engine/proseEnrichment.ts`
**Design:** TB-035 Phase 5

### Placeholder Syntax

Enrichment runs at vignette generation time, querying the graph for real-world data:

| Placeholder | Resolution |
|-------------|-----------|
| `{name}` | Agent name |
| `{artifact:weapon}` | Notable weapon (tier >= storied) |
| `{ally:strongest}` | Strongest ally (trust >= 0.5) |
| `{them}/{they}/{their}/{s}` | Gendered pronouns (default: they/them) |
| `{location}` | Current location name |
| `{?has_X}...{/has_X}` | Conditional block (rendered if condition true) |
| `{?no_X}...{/no_X}` | Inverse conditional block |

### NarrativeContext

Gathered from graph at generation time:

```typescript
interface NarrativeContext {
  agentName, agentId, archetypeId, cultureName, primaryReach;
  factionRank?: { factionName, rank };
  rulerOf?: { locationName };
  titles: string[];
  notableArtifacts: Array<{ name, tier, reach? }>;
  strongAllies: Array<{ name, trust }>;
  rivals: Array<{ name, trust }>;
  currentLocationName, currentHexTerrain?;
  completedPhases: CampbellianPhase[];
  meetingChoiceRecord?: MeetingChoiceRecord;
  beatHistory: BeatOutcome[];
  pronouns: { they, them, their, s };
}
```

### Enrichment Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `ENRICHMENT_ARTIFACT_MIN_TIER` | `'storied'` | Minimum artifact tier for mention |
| `ENRICHMENT_ALLY_MIN_TRUST` | 0.5 | Minimum trust for named ally |
| `ENRICHMENT_MAX_NAMED_ALLIES` | 2 | Max named allies per vignette |
| `CALLBACK_PROSE_PROBABILITY` | 0.7 | Probability of journey meeting callback |

---

## System 5: Encounter Event Nodes (History Persistence)

**Files:** `src/engine/encounterEventNode.ts`
**Design:** TB-077 Layer 1

### How History Feeds Prose

After each encounter step resolves, `createEncounterEventNode()` creates a durable `event` node in the graph with:
- `participated_in` edges (agent → event, target → event for social encounters)
- `occurred_at` edge (event → location)

These enable two prose resolvers:
- **`locationEncounterHistoryResolver`** — walks `occurred_at` edges to describe a location's encounter history
- **`agentEncounterBiographyResolver`** — walks `participated_in` edges to describe an agent's track record

### Biography Categories

Agent encounter biography categorizes agents by success/failure ratio:

| Category | Condition | Tone |
|----------|-----------|------|
| `triumphant` | 3+ events, successes > 2× failures | Confident, proven |
| `scarred` | 3+ events, failures > 2× successes | Battered, enduring |
| `veteran` | Default for tested agents | Experienced, measured |
| `untested` | 0 events | Fresh, unknown |

### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `EVENT_PROSE_HISTORY_DEPTH` | 5 | Max recent events for prose |
| `EVENT_PROSE_CALLBACK_CHANCE` | 0.3 | PRNG chance of history reference |
| `EVENT_PROSE_MIN_TICK_GAP` | 5 | Min ticks before event can be referenced |
| `ENCOUNTER_EVENT_ENABLED` | true | Feature flag |

---

## System 6: Backstory System

**Types:** `src/types/prose.ts` → `BackstoryLayer`, `BackstoryStratumBlock`, `BackstoryResult`
**Content:** `src/data/backstory-content.ts`

### Stratum Model

Agent backstories are revealed in four tiers as the player gains knowledge:

| Stratum | Title | Depth |
|---------|-------|-------|
| 1 | Surface (What They Say) | Public reputation |
| 2 | History (What Happened) | Personal background |
| 3 | Hidden (What They Hide) | Secrets, fears, contradictions |
| 4 | Divine (The Thread) | Cosmic significance |

### Backstory Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `CONTRADICTION_THRESHOLD` | 0.15 | Below this, axiological values are contradictory |
| `FEAR_THRESHOLD` | 0.3 | Above this magnitude, value generates shadow fear |
| `ESSENCE_BRACKET_LOW` | 20 | Low essence bracket boundary |
| `ESSENCE_BRACKET_MEDIUM` | 50 | Medium bracket |
| `ESSENCE_BRACKET_HIGH` | 100 | High bracket |
| `BACKSTORY_SECTION_MIN_KNOWLEDGE` | `'recognised'` | Min knowledge tier to see backstory |
