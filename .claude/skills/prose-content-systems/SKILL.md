---
name: prose-content-systems
description: >
  Content tables, encounter templates, and existing systems you add prose to.
  The "add content here" skill. Covers narrative engine (sphere vocabulary,
  cultural prose), generic effect system (spell flavorText, backlash
  narrativeTemplate), encounter content packages (115 templates + 10 faction
  files), faction reputation system (prose impact), and movement content
  (terrain/location taxes — prose relevance). Also pointers to content-files-reference.md.
  Load for day-to-day content work: encounter templates, narrative event prose,
  faction-specific content, spell flavor text, content tables. Triggers on
  "encounter content", "encounter template", "faction encounter", "narrative
  content", "sphere vocabulary", "cultural prose", "spell flavor", "effect
  prose", "movement content", "content table", "write prose".
model: opus
---

# Prose Content Systems — Content Authoring Reference

High-volume, day-to-day prose work: adding encounter templates, writing narrative event prose, authoring faction content, adding spell flavor text. Load `prose-pipeline` when you need to understand resolver architecture or implement a new resolver. Load `prose-vignettes-and-enrichment` for enrichment placeholders and vignettes.

## Content Tables Reference

All prose content lives in `src/data/`. Read **`content-files-reference.md`** (in this skill directory) for the complete file → key tables → system map when you need to locate a specific content table or verify what exists before adding new content.

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

### Faction-Specific Content

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
