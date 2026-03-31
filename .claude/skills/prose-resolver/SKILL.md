---
name: prose-resolver
description: Use when authoring prose content for the graph-walking prose generator, implementing new resolvers, or enriching existing prose-layer-content.ts tables. Triggers on "write prose", "new resolver", "prose content", "entity description", "location flavor", "agent biography", "vignette", "encounter content", "narrative template", "enrichment", "prose pipeline", "backstory".
model: opus
---

# Prose Resolver Skill — Content Authoring Guide

This skill covers **all prose and narrative content systems** in The Fantasy World Simulator. Use it when authoring new content, implementing resolvers, or extending the prose pipeline.

## Architecture Overview

Prose generation is a **multi-layer pipeline** where content flows through four distinct systems:

```
Graph-Walking Resolvers → Prose Composer → Final Entity Description
Narrative Engine       → Sphere-Flavored Event Prose
Vignette Generator     → Encounter Step Narratives
Prose Enrichment       → Dynamic Placeholder Injection
```

Each system draws from **data tables in `src/data/`**, never hardcoded strings in engine code.

---

## System 1: Graph-Walking Prose Generator

**Files:** `src/engine/proseGenerator.ts`, `src/engine/proseResolvers.ts`, `src/engine/proseComposer.ts`
**Content:** `src/data/prose-layer-content.ts`
**Types:** `src/types/prose.ts`
**Design doc:** `Docs/plans/2026-03-09-prose-generator-framework-design.md`

### How It Works

1. `generateEntityProse(nodeId, graph, seed, mode, tick)` is the public API
2. It looks up resolvers based on node type (location, actor, faction)
3. Each resolver **walks graph edges** from the target node and returns `ProseLayer[]`
4. The composer sorts by priority, caps per category (max 2), and joins into paragraphs

### Resolver Registry

**Location resolvers** (10 total, in priority order):

| Resolver | Priority | Category | Graph Walk | Content Table |
|----------|----------|----------|-----------|---------------|
| `subtypeResolver` | 90 | origin | node properties → `locationSubtype` | `SUBTYPE_ESTABLISHING_PROSE` |
| `biomeResolver` | 80 | atmosphere | `located_at` → hex → terrain | `BIOME_PROSE` |
| `resourcesResolver` | 65 | economic | `produces` edges → resource nodes | `RESOURCE_PROSE` (from `resource-content.ts`) |
| `cultureResolver` | 60 | origin | `influenced_by` → culture node | `CULTURE_LOCATION_PROSE`, `HISTORICAL_CULTURE_PROSE`, `REGION_ETYMOLOGY_PROSE` |
| `sphereResolver` | 55 | atmosphere | `influenced_by` → culture → spheres | `SPHERE_LOCATION_PROSE` |
| `factionResolver` | 50 | tension | `controlled_by` → faction node | `FACTION_CONTROL_PROSE` |
| `guildIdentityResolver` | 48 | character | `member_of` → guild → identity | `GUILD_IDENTITY_PROSE` |
| `populationResolver` | 45 | economic | node properties → population + prosperity | `POPULATION_PROSE_TEMPLATES`, `PROSPERITY_PROSE`, `PROSPERITY_TERRAIN_PROSE` |
| `tradeRouteResolver` | 40 | economic | `trade_route` edges → partner nodes | `TRADE_ROUTE_VOLUME_PROSE`, `TRADE_ROUTE_GOODS_PROSE`, `TRADE_ROUTE_STATUS_PROSE`, `TRADE_ROUTE_CROSSROADS_PROSE` |
| `locationEncounterHistoryResolver` | 40 | atmosphere | `occurred_at` edges from event nodes | `LOCATION_ENCOUNTER_HISTORY_PROSE` |

**Actor resolvers** (6 total):

| Resolver | Priority | Category | Graph Walk | Content Table |
|----------|----------|----------|-----------|---------------|
| `archetypeResolver` | 70 | character | `archetype` property | `ARCHETYPE_PROSE` (from `archetype-content.ts`) |
| `agentCultureResolver` | 60 | origin | `member_of` → culture node | `CULTURE_LOCATION_PROSE` (reused) |
| `agentFactionResolver` | 55 | tension | `member_of` → faction edges | `FACTION_CONTROL_PROSE` (reused) |
| `wealthResolver` | 45 | economic | `wealth` property → tier | `WEALTH_PROSE` |
| `dispositionResolver` | 40 | character | `disposition` property | `DISPOSITION_PROSE` |
| `agentEncounterBiographyResolver` | 35 | character | `participated_in` → event nodes | `AGENT_ENCOUNTER_BIOGRAPHY_PROSE` |

**Faction resolvers** (1 total):

| Resolver | Priority | Category | Graph Walk | Content Table |
|----------|----------|----------|-----------|---------------|
| `guildFactionIdentityResolver` | 70 | character | node properties → `guildType` | `GUILD_IDENTITY_PROSE` |

### ProseLayer Interface

```typescript
interface ProseLayer {
  text: string;        // The prose fragment
  priority: number;    // Higher = more likely to survive composition (0-100)
  category: ProseCategory;  // Grouping for per-category caps
  source: string;      // Resolver name for debug tracing
}

type ProseCategory = 'origin' | 'atmosphere' | 'character' | 'economic' | 'tension' | 'history';
```

### Composition Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `MAX_LAYERS_PER_CATEGORY` | 2 | Max layers per category in composed output |
| `FULL_MAX_PARAGRAPHS` | 6 | Max total paragraphs in 'full' mode |
| `SUMMARY_MAX_CHARS` | 200 | Truncation limit for 'summary' mode |
| `CULTURE_FLAVOR_CHANCE` | 0.4 | Probability of cultural vocabulary substitution |

### Prose Cache

Module-level cache keyed by `${nodeId}:${tick}:${mode}`. Auto-evicts all entries when tick advances. Prevents redundant resolver calls on same-tick panel re-opens.

### How to Write a New Resolver

1. **Add content table** to `src/data/prose-layer-content.ts` (or a separate content file)
2. **Write resolver function** in `src/engine/proseResolvers.ts`:
   - Accept `(nodeId, graph, seed)` → return `ProseLayer[]`
   - Walk graph edges from `nodeId` to find relevant data
   - Use `pickTemplate(templates, seed + UNIQUE_OFFSET)` for deterministic selection
   - Return `[]` on any missing data (fail-soft)
3. **Register** in `src/engine/proseGenerator.ts` → appropriate `*_RESOLVERS` array
4. **Export** the resolver from `proseResolvers.ts` and import in `proseGenerator.ts`

### Template Placeholder Syntax

Content tables use `{placeholder}` syntax resolved by each resolver:

```
{name}     → Entity name
{count}    → Numeric count
{them}     → Gendered pronoun (him/her/them)
{terrain}  → Terrain type name
{sphere}   → Sphere name
{faction}  → Faction name
{goods}    → Trade goods description
```

Each resolver calls `replacePlaceholder(template, key, value)` for substitution.

---

## System 2: Narrative Engine (Event Prose)

**Files:** `src/engine/narrative.ts`, `src/engine/culturalProse.ts`
**Content:** `src/data/narrative-content.ts`, `src/data/culture-content.ts`
**Types:** `src/types/narrative.ts`

### Three-Tier Model

| Tier | Name | When | Source |
|------|------|------|--------|
| 1 | Routine | Common events | Template-stitched from `ROUTINE_TEMPLATES` |
| 2 | Notable | Significant events | Enhanced templates with conditional clauses from `NOTABLE_TEMPLATES` |
| 3 | Chronicle | Major events | Structured prompts for LLM generation (future) |

### Sphere Vocabulary

Each of the **Nine Spheres** provides vocabulary flavoring via `SPHERE_VOCABULARY`:
- **Verbs, adjectives, nouns** per sphere
- Used by `pickSphereWord()` to flavor event descriptions
- Cultural prose palettes can override (30% substitution chance via `culturalProse.ts`)

### Cultural Prose Integration

`src/engine/culturalProse.ts` extracts vocabulary from a culture's prose palette:
- Palette selection: **foundation bias → primary venerated sphere → default fallback**
- `getCulturalFlavorWords()` returns `{ verbs, adjectives, nouns?, phrases? }`
- `pickCulturalWord()` substitutes with 30% probability per word slot

Content palettes live in `src/data/culture-content.ts` → `CULTURAL_PROSE_PALETTES` (keyed by sphere/foundation).

### Value Flavors

`VALUE_FLAVORS` in `narrative-content.ts` maps axiological value pairs to narrative tone:
- Each value pair gets `{ positive, negative }` flavor strings
- Used to color event prose based on the agent's axiological alignment

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

---

## System 7: Generic Effect System (Prose-Relevant)

**Types:** `src/types/effects.ts`
**Content:** `src/data/effect-constants.ts`, `src/data/spell-templates.ts`, `src/data/reward-attachment-catalog.ts`
**Design doc:** `Docs/plans/2026-03-31-generic-effect-system-design.md`

### Why Effects Matter for Prose

The generic effect system introduces **29 composable effect primitives** on attachments (items, blessings, curses, spells). These are prose-relevant because:

1. **Spell templates have `flavorText` and `mechanicalSummary`** — displayed in UI
2. **Backlash effects have `narrativeTemplate`** — with `{actor}` placeholder for prose injection
3. **Attachments in `reward-attachment-catalog.ts`** carry names, descriptions, and effect arrays
4. **Effect conditions** (`in_combat`, `health_low`, `near_water`, `biome:*`, `has_trait:*`) can trigger narrative variation

### Spell Template Structure (Prose Fields)

```typescript
interface SpellTemplate {
  id: string;
  name: string;
  flavorText: string;           // Narrative description
  mechanicalSummary: string;     // Player-facing mechanical explanation
  backlash?: {
    narrativeTemplate: string;   // e.g. "The veil tears — {actor} stumbles..."
    // ...
  };
}
```

### Effect Tiers for Content Authors

| Tier | Types | Scope | Content Examples |
|------|-------|-------|-----------------|
| 1 (Gear) | 1–14 | Mundane-to-mythic items | Stat boosts, resistances, resource bonuses |
| 2 (Spell) | 15–23 | Rule benders | Teleport, scry, spawn, compel — each needs flavor text |
| 3 (God-tier) | 24–29 | World-reshaping | Transform biome, create structure, override rules |

### Existing Spell Templates (5 worked examples)

Located in `src/data/spell-templates.ts`:
- **Veilwalk** (T2): Teleport 3 hexes + shadow bonus
- **Soulfire** (T3): Swap iron→star for combat + stacking
- Plus 3 more — check the file for current list

---

## System 8: Encounter Content Packages

**Main:** `src/data/encounter-content.ts` (115 templates, 408KB)
**Faction-specific:** 10 files in `src/data/` named `{faction-name}-encounter-content.ts`
**Type-specific:** `social-`, `faction-`, `army-`, `monster-`, `mercenary-`, `borderland-`, `siege-`, `anomaly-`, `battle-spotlight-encounter-content.ts`

### Template Structure

Each encounter template has:
- **Steps** (2-4) with escalating difficulty and narrative
- **Location specificity** (location-specific: 3 steps, universal: 2 steps, reach-agnostic: 2 steps)
- **Difficulty tiers**: early (0.8×), mid (1.0×), late (1.3×)
- **Tone adjectives** per difficulty tier

### Faction-Specific Content (New)

10 faction content files provide faction-gated encounters:
- `arcane-circle-encounter-content.ts`
- `builders-fellowship-encounter-content.ts`
- `civic-guard-encounter-content.ts`
- `holy-order-dawn-encounter-content.ts`
- `lorekeepers-covenant-encounter-content.ts`
- `merchant-consortium-encounter-content.ts`
- `rangers-brotherhood-encounter-content.ts`
- `temple-of-spheres-encounter-content.ts`
- `thieves-guild-encounter-content.ts`
- `underking-court-encounter-content.ts`

These encounters require faction membership and scale with reputation rank.

---

## System 9: Faction Reputation System (Prose Impact)

**Files:** `src/engine/factionReputation.ts`
**Content:** `src/data/faction-definitions.ts`, `src/data/faction-encounter-content.ts`

### How Reputation Affects Prose

- `factionResolver` reads `controlled_by` edges to describe faction presence at locations
- `agentFactionResolver` reads `member_of` edges with reputation/rank properties
- Faction rank affects encounter eligibility (higher ranks unlock more content)
- `FACTION_CONTROL_PROSE` in `prose-layer-content.ts` provides faction-presence flavor

### Reputation Constants (from `agent-behavior-constants.ts`)

| Constant | Value | Purpose |
|----------|-------|---------|
| `FACTION_NETWORK_AWARENESS` | true | Enable faction intel sharing |
| `FACTION_NETWORK_MAX_ENTRIES` | 20 | Max shared encounters |
| `FACTION_SECONDARY_THRESHOLD` | 0.3 | Secondary faction interest threshold |
| `FACTION_MIN_RANK_FOR_INTEL` | 0.05 | Minimum rank for intel access |
| `FACTION_DEFAULT_RANK` | 0.1 | Starting reputation for new members |

---

## System 10: Movement Content

**Files:** `src/data/movement-content.ts`

### Prose Relevance

Movement taxes influence where agents go, which determines what encounters they face and what prose is generated for their descriptions. Key constants:

| Constant | Value | Purpose |
|----------|-------|---------|
| `TERRAIN_TAXES` | 27 entries | Per-terrain traversal cost |
| `LOCATION_ENTRY_TAXES` | 23 entries | Per-location-subtype entry cost |
| `BASE_EDGE_TRAVERSAL_COST` | 1 | Default edge cost |
| `DISTANCE_DECAY_FACTOR` | 0.15 | Score decay per hex of distance |
| `ROAD_MAJOR_COST_MULTIPLIER` | 0.4 | Major road discount |
| `ROAD_TRAIL_COST_MULTIPLIER` | 0.7 | Trail discount |

---

## Content Tables Reference

All prose content lives in `src/data/`. Here's the complete map:

| File | Key Tables | Used By |
|------|-----------|---------|
| `prose-layer-content.ts` | `BIOME_PROSE`, `CULTURE_LOCATION_PROSE`, `SPHERE_LOCATION_PROSE`, `SUBTYPE_ESTABLISHING_PROSE`, `FACTION_CONTROL_PROSE`, `POPULATION_PROSE_TEMPLATES`, `PROSPERITY_PROSE`, `PROSPERITY_TERRAIN_PROSE`, `WEALTH_PROSE`, `GUILD_IDENTITY_PROSE`, `TRADE_ROUTE_*_PROSE`, `GEOGRAPHIC_REGION_*_PROSE`, `LOCATION_ENCOUNTER_HISTORY_PROSE`, `AGENT_ENCOUNTER_BIOGRAPHY_PROSE` | Graph-walking resolvers |
| `narrative-content.ts` | `SPHERE_VOCABULARY`, `ROUTINE_TEMPLATES`, `NOTABLE_TEMPLATES`, `VALUE_FLAVORS` | Narrative engine |
| `culture-content.ts` | `CULTURAL_PROSE_PALETTES` | Cultural prose flavoring |
| `archetype-content.ts` | `ARCHETYPE_PROSE` | Archetype resolver |
| `backstory-content.ts` | `BACKSTORY_LAYERS` | Backstory system |
| `resource-content.ts` | `RESOURCE_PROSE` | Resources resolver |
| `encounter-content.ts` | 115 encounter templates | Encounter system |
| `faction-encounter-content.ts` | Faction-gated encounters | Faction encounter pipeline |
| `*-encounter-content.ts` (10 files) | Per-faction encounter packages | Faction-specific encounters |
| `social-encounter-content.ts` | Social/meeting encounters | Social encounter system |
| `army-encounter-content.ts` | Military encounters | Army encounter system |
| `monster-encounter-content.ts` | Creature encounters | Monster encounter system |
| `mercenary-encounter-content.ts` | Hired combat encounters | Mercenary system |
| `borderland-encounter-content.ts` | Frontier/wilderness encounters | Borderland system |
| `siege-encounter-content.ts` | Siege encounters | Siege system |
| `encounter-anomaly-content.ts` | Supernatural encounters | Anomaly system |
| `battle-spotlight-content.ts` | Battle narratives | Battle spotlight system |
| `spell-templates.ts` | 5 spell templates with flavor | Effect system |
| `reward-attachment-catalog.ts` | Named attachments with descriptions | Reward system |
| `anomaly-reward-catalog.ts` | Anomaly-specific rewards | Anomaly rewards |
| `artifact-templates.ts` | Named artifact templates | Artifact generation |
| `unified-action-templates.ts` | Action templates (122KB) | Action system |
| `action-template-content.ts` | Encounter step actions | Action resolution |
| `agenda-content.ts` | Agent agenda flavor | Agenda system |
| `reputation-trait-content.ts` | Reputation-derived traits | Trait system |
| `movement-content.ts` | Terrain/location movement costs | Movement system |

---

## Writing Guidelines

### Tone: The Threadbare Aesthetic

All prose follows the project's aesthetic:
- **Dark world, hidden magic, threads that break through**
- Short, declarative sentences with one vivid detail
- No exclamation marks, no breathless enthusiasm
- Wear and age over polish and perfection
- The uncanny over the fantastic
- Dry wit over comedy; irony over sentimentality

### Content Authoring Checklist

When adding new prose content:

- [ ] **Minimum 3-5 variants** per key in content tables (avoids repetition)
- [ ] **Use `{placeholder}` syntax** — never hardcode entity names
- [ ] **Seeded PRNG** for variant selection — use unique seed offsets per resolver
- [ ] **Fail-soft** — resolver returns `[]` on any missing data, never throws
- [ ] **Priority 0-100** — higher survives composition. Check existing ranges to avoid collisions
- [ ] **Category balance** — max 2 per category in output. Don't overload one category
- [ ] **Test with CLI** — run `npm run cli`, advance ticks, inspect agents/locations to verify prose appears
- [ ] **No orphan content** — every table must have a resolver that uses it, registered in the generator

### PRNG Seed Offset Convention

Each resolver uses `seed + OFFSET` for deterministic variant selection. Existing offsets:

| Offset Range | Used By |
|-------------|---------|
| 0-99 | biomeResolver, subtypeResolver |
| 100-199 | cultureResolver |
| 200-299 | sphereResolver |
| 300-399 | factionResolver |
| 1000-1099 | populationResolver |
| 2000-2099 | tradeRouteResolver |
| 3000-3099 | resourcesResolver |
| 5000-5099 | guildIdentityResolver |
| 7700-7799 | locationEncounterHistoryResolver |
| 7710-7799 | agentEncounterBiographyResolver |

**New resolvers** should claim a unique range and document it here.
