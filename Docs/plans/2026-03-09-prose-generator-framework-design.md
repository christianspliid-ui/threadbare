# Graph-Walking Prose Generator Framework — Design Doc

**Date:** 2026-03-09
**Status:** Design complete, pending implementation

## Problem

The game has rich interconnected systems — cultures, spheres, biomes, archetypes, factions, encounters, divine influences — but all prose generation is **event-centric**: something happens → compose a sentence about it. There's no way to ask "describe this location" or "describe this agent" and get prose that reflects the full web of graph connections.

We need a **generic entity prose generator** that walks graph edges from any node and composes rich, unique descriptions. The same framework should work for locations, agents, factions, artifacts, cultures — anything in the graph.

## Design Decisions

### Decision 1: Edge-Walking Prose Layers (not hardcoded entity templates)

**Chosen:** A generic `ProseLayer` system where each layer corresponds to an edge type or node property that contributes a prose fragment. Layers are registered per-entity-type but the composition engine is shared.

**Why:** The game already has 18 edge types. Each edge type implies a relationship that contributes to an entity's description. Rather than writing bespoke generators per entity type, we define "what prose does a `belongs_to` edge contribute?" and "what prose does `aligned_with` contribute?" — then for any entity, we walk its edges, collect applicable layers, and compose.

**Rejected:** Per-entity hardcoded generators. Would mean duplicating the culture lookup logic in location generator, agent generator, faction generator, etc.

### Decision 2: ProseLayer Interface with Priority + Composition

Each layer produces a `ProseFragment` with:
- `text`: the prose string
- `priority`: ordering weight (higher = appears first in composed output)
- `category`: grouping tag for dedup/cap (`'origin'`, `'atmosphere'`, `'character'`, `'tension'`, `'history'`)
- `source`: which edge/property produced it (for debug tracing)

Layers are sorted by priority, capped per category (max 2), and joined with paragraph breaks. This prevents runaway descriptions while ensuring variety.

### Decision 3: Content Tables, Not Inline Strings

All prose fragments live in a content data file (`prose-layer-content.ts`), keyed by `[layerType][subkey]`. The engine module does graph walking + selection; the content file has every string. This matches our established content package pattern.

### Decision 4: Resolver Registry Pattern

A `ProseResolver` is a function: `(node: GraphNode, graph: WorldGraph, rng: () => number) => ProseLayer[]`

We register resolvers per node type:
```
location → [biomeResolver, cultureResolver, sphereResolver, subtypeResolver, factionResolver, encounterHistoryResolver, divineInfluenceResolver]
actor → [archetypeResolver, cultureResolver, factionResolver, locationResolver, dispositionResolver, traitResolver]
artifact → [sphereResolver, loreResolver, possessorResolver]
```

Each resolver walks a specific edge type and produces 0-N prose layers. The framework runs all registered resolvers for a node type, collects layers, then composes.

### Decision 5: Seeded Determinism via Node ID Hash

Prose generation for a given node should be deterministic across sessions with the same world seed. We hash the node ID + world seed to get a per-entity PRNG seed. This means "describe Thornhaven" always produces the same description for seed 42, but different for seed 7.

### Decision 6: Graph-Verifiable Content (reuse existing data)

Every resolver pulls from existing content packages where possible:
- `culture-content.ts` → culturalVariantDescriptors, biome modifiers, foundation modifiers
- `chronicler-content.ts` → LOCATION_TYPE_FLAVOR, SUBLOCATION_FLAVOR, ARTIFACT_LORE
- `archetype-content.ts` → toneKeywords, vignetteSeeds, proseTone
- `narrative-content.ts` → SPHERE_VOCABULARY
- `encounter-content.ts` → encounter templates (for location history)

New content is only added for gaps. This keeps the content DRY.

### Decision 7: Two Output Modes — Summary and Full

- **Summary** (1-2 sentences): Used in tooltips, list items, map hover. Quick prose that captures the dominant character.
- **Full** (3-6 paragraphs): Used in inspection panels, location detail view, agent profile modal. Multi-layered composed prose.

The resolver collects all layers; the composer either takes the top 1-2 (summary) or all of them (full).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ generateEntityProse(nodeId, graph, seed, mode)      │  ← public API
├─────────────────────────────────────────────────────┤
│  1. Look up node type                               │
│  2. Get registered resolvers for type               │
│  3. Run each resolver → collect ProseLayer[]        │
│  4. Sort by priority, cap per category              │
│  5. Compose into string (summary or full mode)      │
│  6. Emit prose_generation trace                     │
└─────────────────────────────────────────────────────┘
        ↕                    ↕                    ↕
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ biomeResolver│  │ cultureResolver  │  │ sphereResolver   │
│ walks terrain│  │ walks belongs_to │  │ walks aligned_w. │
│ → atmosphere │  │ → cultural voice │  │ → magical char.  │
└──────────────┘  └──────────────────┘  └──────────────────┘
        ↕                    ↕                    ↕
┌────────────────────────────────────────────────────────┐
│ prose-layer-content.ts  (all template strings live here)│
└────────────────────────────────────────────────────────┘
```

## Resolver Specifications

### Location Resolvers (7)

| Resolver | Edge/Property | Priority | Category | What it produces |
|----------|--------------|----------|----------|-----------------|
| `subtypeResolver` | `properties.locationSubtype` | 100 | origin | Establishing shot from LOCATION_TYPE_FLAVOR + subtype-specific generation |
| `biomeResolver` | `properties.terrain` | 90 | atmosphere | Terrain atmosphere (how the land looks/feels) |
| `cultureResolver` | incoming `belongs_to` | 80 | character | Cultural identity — who built this, what they value, how they shaped it |
| `sphereResolver` | `properties.sphereInfluence` | 70 | atmosphere | Dominant sphere magical character |
| `factionResolver` | incoming `controls` | 60 | character | Who rules here, how they rule, tensions between factions |
| `populationResolver` | incoming `located_at` | 50 | character | Notable inhabitants and their archetypes |
| `historyResolver` | events/encounters | 40 | history | What happened here — completed encounters, divine interventions, deaths |

### Agent Resolvers (6)

| Resolver | Edge/Property | Priority | Category | What it produces |
|----------|--------------|----------|----------|-----------------|
| `archetypeResolver` | `properties.narrativeArchetype` | 100 | origin | Core character archetype prose — story shape, proseTone |
| `cultureResolver` | outgoing `belongs_to` | 90 | character | Cultural background and how it shapes behavior |
| `locationResolver` | outgoing `located_at` | 80 | atmosphere | Where they are and what that says about them |
| `factionResolver` | outgoing `member_of` | 70 | character | Faction allegiance and role |
| `dispositionResolver` | `properties.cooperationStrategy` | 60 | character | How they deal with others |
| `traitResolver` | outgoing `has_trait` | 50 | history | Notable traits and what they imply |

### Artifact Resolvers (3)

| Resolver | Edge/Property | Priority | Category | What it produces |
|----------|--------------|----------|----------|-----------------|
| `loreResolver` | `properties.sphereAffinity` | 100 | origin | Artifact lore from ARTIFACT_LORE |
| `possessorResolver` | incoming `possesses`/`bonded_to` | 80 | character | Who holds it and what that implies |
| `locationResolver` | `properties.locationId` | 60 | atmosphere | Where it resides |

## Content Shape (prose-layer-content.ts)

```typescript
// Each resolver has a content table keyed by the relevant property value
// Templates use {placeholders} resolved at generation time

export const BIOME_PROSE: Record<TerrainType, string[]> = {
  grassland: [
    'Open land stretching to the horizon, where the wind carries whispers from settlements too distant to see.',
    'Tall grass ripples in waves that mimic the ocean the inland folk have never visited.'
  ],
  mountains: [...],
  // ...
};

export const CULTURE_LOCATION_PROSE: Record<string, string[]> = {
  // Foundation pair keys
  'order_light': [
    'Built with precision and devotion — every cornerstone aligned, every street named for a saint or principle.',
  ],
  'chaos_darkness': [
    'Grown rather than built. Streets twist and double back. The architecture answers to no plan but survival.',
  ],
  // ...
};

export const SPHERE_LOCATION_PROSE: Record<SphereName, string[]> = {
  life: [
    'Life threads run thick here — plants grow too fast, wounds heal too quickly, and the old linger longer than they should.',
  ],
  entropy: [
    'Things come apart here. Ropes fray overnight, bread goes stale by noon, and the oldest buildings lean like they\'re tired of standing.',
  ],
  // ...
};
```

## Composition Rules

1. **Sort** layers by priority (descending)
2. **Cap** at 2 layers per category
3. **Summary mode**: Take highest-priority layer only, use its text as-is
4. **Full mode**: Join all surviving layers with `\n\n`, producing multi-paragraph prose
5. **Template resolution**: Replace `{name}`, `{terrain}`, `{sphere}`, `{culture}` placeholders
6. **Seeded selection**: When multiple templates exist per key, pick via seeded PRNG
7. **Trace**: Emit `prose_generation` trace with nodeId, layers used, final length

## Integration Points

- **AgentInfoCard** / **AgentProfileModal**: Call `generateEntityProse(agentId, graph, seed, 'full')` for the backstory/description section
- **LocationView**: Call `generateEntityProse(locationId, graph, seed, 'full')` for the location inspection flavor
- **HexZoomView tooltips**: Call `generateEntityProse(locationId, graph, seed, 'summary')` for hover prose
- **Tooltip system**: `prose.*` prefix routes to summary-mode entity prose
- **DebugPanel**: New `prose_generation` trace category shows layer breakdown

## Tunable Constants

```typescript
export const MAX_LAYERS_PER_CATEGORY = 2;
export const SUMMARY_MAX_CHARS = 200;
export const FULL_MAX_PARAGRAPHS = 6;
export const CULTURE_FLAVOR_CHANCE = 0.4;  // Chance culture resolver adds variant descriptor
```
