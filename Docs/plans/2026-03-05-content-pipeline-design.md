# Content Pipeline Design — Unified World Model + Obsidian Visualization

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a single canonical `world-model.json` containing the complete domain model as a graph (nodes + edges), with a generator script that produces a richly-linked Obsidian vault for visualization and gap analysis.

**Architecture:** One unified JSON graph file (`src/data/world-model.json`) is the single source of truth for all game content structure. A TypeScript generator script reads it and produces the Obsidian vault. The engine's taxonomy loader is refactored to consume this file instead of the current 6 separate JSON files.

**Tech Stack:** TypeScript, Node/ts-node for the generator script, Obsidian (Markdown + YAML frontmatter + wikilinks)

---

## 1. Problem Statement

The domain model currently lives in two partially-overlapping places:

- **Obsidian vault** (~60+ hand-authored notes): rich prose, wikilinks, and structured-ish data embedded in Markdown. Covers cosmology, traits, actions, magic, actors, terrain, domains.
- **`src/data/taxonomy/` JSON files** (6 files): machine-readable nodes and edges for cosmology, magic traditions, terrain biomes, and relationship types.

Problems:
1. **Drift.** The JSON and vault notes can disagree (e.g., Time sphere color mismatch between JSON and STYLE.md).
2. **Incomplete coverage.** Traits, actions, actors, locations, and cultures exist only in Markdown — the engine can't query them.
3. **Gap blindness.** Without a unified graph, it's hard to see where the domain model has thin connections that would starve the narrative engine of story material.

## 2. Solution Overview

Three deliverables:

| Deliverable | Path | Purpose |
|---|---|---|
| Unified graph file | `src/data/world-model.json` | Single source of truth — all nodes + edges |
| Vault generator | `scripts/generate-vault.ts` | Reads JSON, writes Obsidian vault notes |
| Refactored loader | `src/engine/taxonomy.ts` | Engine consumes `world-model.json` |

**Source of truth direction:** JSON → Obsidian (one-way). Edit JSON, regenerate vault. Never hand-edit generated vault notes.

## 3. The Unified Graph File

**File:** `src/data/world-model.json`

### Shape

```json
{
  "meta": {
    "version": "1.0.0",
    "generated": "2026-03-05T...",
    "nodeCount": 200,
    "edgeCount": 600,
    "categories": [
      "foundation-sphere", "creation-sphere", "magic-tradition",
      "terrain", "reach", "action-template",
      "trait-innate", "trait-mastery", "trait-reputation",
      "trait-scar", "trait-condition", "trait-destiny",
      "actor-type", "culture",
      "region-type", "location-type", "sublocation-type",
      "artifact-class", "enchantment-class", "resource-type",
      "relationship-type"
    ]
  },
  "nodes": [
    {
      "id": "creation.force",
      "name": "Force",
      "category": "creation-sphere",
      "description": "Physics, motion, kinetic energy, and motive power.",
      "properties": { }
    }
  ],
  "edges": [
    {
      "source": "creation.force",
      "target": "magic.air",
      "type": "rel.generates",
      "weight": 1.0
    }
  ]
}
```

### Node ID Convention

`{category-prefix}.{optional-subcategory}.{name-slug}`

| Category | Prefix | Example ID |
|---|---|---|
| Foundation sphere | `foundation` | `foundation.chaos` |
| Creation sphere | `creation` | `creation.force` |
| Magic tradition | `magic` | `magic.fire` |
| Terrain | `terrain` | `terrain.grassland` |
| Reach | `reach` | `reach.iron` |
| Action template | `action.{reach}` | `action.iron.conquer` |
| Trait (all 6 types) | `trait.{type}` | `trait.innate.dragonborn` |
| Actor type | `actor` | `actor.individual` |
| Culture | `culture` | `culture.{name}` |
| Region type | `region` | `region.kingdom` |
| Location type | `location` | `location.settlement` |
| Sub-location type | `sublocation` | `sublocation.market-district` |
| Artifact class | `artifact` | `artifact.{name}` |
| Enchantment class | `enchantment` | `enchantment.{name}` |
| Resource type | `resource` | `resource.{name}` |
| Relationship type | `rel` | `rel.underpins` |

### Category-Specific Properties

**Foundation spheres:**
```json
{ "color": "#...", "opposed": "foundation.order" }
```

**Creation spheres:**
```json
{
  "color": "#ff6b6b",
  "physicalPhenomena": ["Wind", "Gravity", "Magnetism"],
  "associatedColors": ["Red", "Violet"],
  "dominantTemperature": "neutral",
  "dominantMoisture": "neutral",
  "dominantElevation": "neutral",
  "terrainBias": 0.0
}
```

**Magic traditions:**
```json
{
  "school": "Elemental",
  "primarySpheres": ["creation.energy", "creation.force"],
  "sphereWeights": { "creation.energy": 0.7, "creation.force": 0.3 },
  "color": "#ff4500"
}
```

**Terrain:**
```json
{
  "color": "#c8d87a", "icon": "🌾",
  "elevation_range": [-0.1, 0.2],
  "temperature_range": [10, 25],
  "moisture_range": [30, 60]
}
```

**Reaches:**
```json
{ "sphereAlignment": "creation.force" }
```

**Action templates:**
```json
{
  "reach": "reach.iron",
  "crudType": "DELETE",
  "resolutionParams": { }
}
```

**Traits (all 6 categories):**
```json
{
  "traitCategory": "innate",
  "validNodes": ["actor.individual", "actor.god", "actor.ascendant"],
  "maxLevel": 1,
  "visibility": "public",
  "effects": {
    "actionModifiers": { "reach.iron": 0.15, "reach.veil": 0.10 },
    "statModifiers": ["resilience"]
  },
  "acquisition": { "method": "inherited", "requires": "divine/draconic parent edge" }
}
```

**Actor types:**
```json
{
  "tier": "individual",
  "defaultReaches": { "reach.iron": 0.5, "reach.gold": 0.3 },
  "maslowLayers": ["survival", "safety", "belonging", "esteem", "self-actualization", "transcendence"]
}
```

**Cultures:**
```json
{
  "aestheticTraits": { "architecture": "...", "clothing": "...", "artStyle": "..." },
  "languageFamily": "...",
  "dominantBeliefs": ["creation.force", "creation.matter"],
  "knowledgeTraditions": ["reach.iron", "reach.stone"],
  "taboos": ["..."],
  "values": { },
  "historicalArchetypes": ["..."]
}
```

**Region types:**
```json
{
  "viewLevel": "region",
  "governanceType": "monarchy",
  "defaultLocationSlots": 8,
  "terrainMix": { "terrain.grassland": 0.4, "terrain.farmland": 0.3 }
}
```

**Location types:**
```json
{
  "viewLevel": "location",
  "validTerrains": ["terrain.grassland", "terrain.farmland"],
  "defaultReach": "reach.gold",
  "capacities": { "population": 5000, "garrison": 200 }
}
```

**Sub-location types:**
```json
{
  "viewLevel": "sub-location",
  "parentLocationTypes": ["location.settlement", "location.fortress"],
  "hostedActions": ["action.gold.trade", "action.heart.negotiate"]
}
```

**Artifact / Enchantment / Resource classes:** Placeholder schemas — to be fleshed out when those systems are built. Minimal shape:
```json
{ "rarity": "rare", "sphereAffinity": "creation.force" }
```

### Edge Types

**Existing (preserved from current taxonomy):**

| ID | Pattern | Description |
|---|---|---|
| `rel.underpins` | asymmetric | Foundational dependency |
| `rel.opposes` | symmetric | Binary opposition |
| `rel.emerges-from` | asymmetric | Derivative emergence |
| `rel.generates` | asymmetric | Creative hierarchy |
| `rel.draws-from` | asymmetric | Resource dependency |
| `rel.biome-affinity` | asymmetric | Sphere → terrain preference |
| `rel.contains` | asymmetric | Spatial containment |
| `rel.adjacent` | symmetric | Spatial adjacency |
| `rel.amplifies` | asymmetric | Enhancing interaction |
| `rel.suppresses` | asymmetric | Diminishing interaction |
| `rel.corrupts` | asymmetric | Destructive transformation |
| `rel.transforms-into` | asymmetric | State change |
| `rel.seasonal-cycle` | asymmetric | Temporal rotation |

**New edge types:**

| ID | Pattern | From → To | Description |
|---|---|---|---|
| `rel.boosts` | asymmetric | trait → reach | Trait provides bonus to this reach |
| `rel.valid-for` | asymmetric | trait → actor-type | Trait can be applied to this actor type |
| `rel.belongs-to` | asymmetric | action-template → reach | Action is part of this reach's CRUD set |
| `rel.aligned-with` | asymmetric | reach → creation-sphere | Reach's primary sphere alignment |
| `rel.terrain-valid` | asymmetric | location-type → terrain | Location can exist on this terrain |
| `rel.contains-type` | asymmetric | region/location → location/sublocation | Type hierarchy containment |
| `rel.hosts` | asymmetric | sublocation-type → action-template | Sub-location enables this action |
| `rel.upgrades-to` | asymmetric | location-type → location-type | Growth path |
| `rel.practices` | asymmetric | culture → magic-tradition | Culture uses this magic |
| `rel.favors` | asymmetric | culture → reach | Culture excels in this domain |
| `rel.venerates` | asymmetric | culture → sphere | Culture's religious alignment |
| `rel.inhabits` | asymmetric | culture → terrain/region-type | Culture's homeland |
| `rel.produces` | asymmetric | culture → artifact-class | Culture's crafting tradition |

## 4. The Vault Generator

**Script:** `scripts/generate-vault.ts`

### Folder Ownership Map

The generator declares exactly which folders it manages. It will NEVER write outside these:

```typescript
const OWNED_FOLDERS = [
  "Cosmology",
  "Traits",
  "Domains",
  "Actions",
  "Magic",
  "Actors",
  "Cultures",
  "Terrain",
  "Locations",
  "World Objects",
  "Relationships",
];
```

Everything else (Systems/, Index.md top-level, Build Status.md, CLAUDE.md) is untouched.

### Category → Folder Mapping

```typescript
const CATEGORY_FOLDER_MAP: Record<string, string> = {
  "foundation-sphere": "Cosmology",
  "creation-sphere": "Cosmology",
  "magic-tradition": "Magic/{school}",       // subfolder by school property
  "terrain": "Terrain",
  "reach": "Domains",
  "action-template": "Actions/{reach-name}",  // subfolder by parent reach
  "trait-innate": "Traits/Innate",
  "trait-mastery": "Traits/Mastery",
  "trait-reputation": "Traits/Reputation",
  "trait-scar": "Traits/Scar",
  "trait-condition": "Traits/Condition",
  "trait-destiny": "Traits/Destiny",
  "actor-type": "Actors",
  "culture": "Cultures",
  "region-type": "Locations/Regions",
  "location-type": "Locations/Locations",
  "sublocation-type": "Locations/Sub-locations",
  "artifact-class": "World Objects/Artifacts",
  "enchantment-class": "World Objects/Enchantments",
  "resource-type": "World Objects/Resources",
  "relationship-type": "Relationships",
};
```

### Generated Note Template

Each node produces a `.md` file with this structure:

```markdown
---
tags: [{category}, generated]
id: {node.id}
category: {node.category}
{...flattened properties as YAML frontmatter}
---

# {node.name}

> {node.description}

## Properties
{formatted key-value pairs from node.properties}

## Outgoing Connections
{for each outgoing edge: "- **{rel-type-name}** → [[{target-name}]] (w: {weight})"}

## Incoming Connections
{for each incoming edge: "- **{rel-type-name}** ← [[{source-name}]] (w: {weight})"}
```

### Generated Index

The script also generates a top-level `Index.md` that replaces the current one, organized by category with node counts and links.

### CLI Interface

```bash
# Full regeneration
npx ts-node scripts/generate-vault.ts

# Dry run — show what would be written without writing
npx ts-node scripts/generate-vault.ts --dry-run

# Validate — check world-model.json for integrity errors
npx ts-node scripts/generate-vault.ts --validate
```

### Validation Rules (run before generation)

1. Every edge's `source` and `target` must reference existing node IDs
2. Every edge's `type` must reference an existing `relationship-type` node
3. No duplicate node IDs
4. Every node has non-empty `name`, `category`, `description`
5. Category values must be in the allowed list
6. Warn on orphan nodes (no edges at all) — potential gaps

## 5. Engine Loader Refactor

**File:** `src/engine/taxonomy.ts`

Minimal change: replace the 6 `import` statements with a single import of `world-model.json`. All existing query functions (`getNodesByCategory`, `getEdgesForNode`, etc.) remain unchanged — they already operate on `TaxonomyGraph { nodes, edges }`.

```typescript
// Before:
import creationSpheres from "../data/taxonomy/creation-spheres.json";
import foundationSpheres from "../data/taxonomy/foundation-spheres.json";
// ... 4 more imports

// After:
import worldModel from "../data/world-model.json";

export async function loadTaxonomy(): Promise<TaxonomyGraph> {
  return {
    nodes: worldModel.nodes as TaxonomyNode[],
    edges: worldModel.edges as TaxonomyEdge[],
  };
}
```

The old `src/data/taxonomy/` files are deleted after migration.

## 6. Migration Path

1. **Consolidate** existing 6 JSON files into `world-model.json` (automated script)
2. **Extract** structured data from vault notes into new node categories (trait notes → trait nodes, action notes → action-template nodes, etc.)
3. **Infer edges** from existing vault wikilinks and structured references
4. **Validate** the unified graph
5. **Generate** the vault from the new source of truth
6. **Refactor** `taxonomy.ts` to load from `world-model.json`
7. **Delete** old `src/data/taxonomy/` files
8. **Verify** all existing tests still pass

## 7. What This Enables

Open the Obsidian graph view and see the complete story machine:

```
Spheres → Magic Traditions → Cultures → Location Types → Sub-locations → Hosted Actions → Reaches → Traits
   ↕           ↕                ↕           ↕                                    ↕           ↕
 Terrain    Artifacts      Actor Types   Region Types                       Resolution   Modifiers
```

**Gap analysis becomes visual:** An isolated node = missing connections = potential narrative dead end. A reach with no action templates = unplayable domain. A culture with no magic traditions = unexplored design space.

## 8. Decisions Log

| Decision | Chosen | Alternatives considered | Rationale |
|---|---|---|---|
| JSON structure | Single unified graph | Flat files per category, domain-scoped bundles | Graph-native project philosophy; one file = one truth; trivial integrity validation |
| Source of truth | JSON → Obsidian | Vault → JSON, dual sync | Engine already consumes JSON; vault notes are lossy to parse; eliminates drift |
| Vault strategy | Same vault, folder-ownership guards | Separate vault for generated content | Wikilinks must resolve across generated + hand-authored notes for graph view to work |
| Culture handling | Distinct category (not actor) | Culture as actor sub-type | Cultures are context-layers that actors inhabit, not agents that take actions |
| Location hierarchy | 3 types (region, location, sublocation) | Single location-type with level property | Matches existing View Levels system; clearer in graph view |
