# Geographic Regions & Historical Culture Naming — Design

**Date:** 2026-03-15
**Status:** Approved
**Branch:** feat/attachment-system (or new branch TBD)

## Problem

Terrain generation produces a grid of biome-classified hexes, but there are no named geographic regions. The map has no mountain ranges, no forests with names, no sense of place. The design doc (`2026-03-09-terrain-generation-design.md`) specified a Pass 8 for region detection and naming, but it assumed random name-fragment pools rather than culture-driven naming.

Additionally, the world lacks a historical depth layer — there are no dead empires whose legacy shapes the landscape. Living cultures are assigned identically as both `historical` and `current` layers, missing the opportunity for a richer, older world.

## Solution

Three interconnected systems:

1. **Flood-fill region detection** — group contiguous related-terrain hexes into named region clusters
2. **Historical culture generation** — full `CultureIdentity` dead empires seeded before living cultures
3. **Culture-driven region naming** — historical cultures claim territory and name the regions they held

## Decisions

### Decision 1: Regions Are Purely Geographic

Regions are terrain clusters, not political boundaries. A "mountain range" is a mountain range regardless of who controls it. Culture territories and political boundaries are a separate layer expressed through `belongs_to` and `controls` edges.

### Decision 2: Full CultureIdentity for Historical Cultures

Historical cultures use the same `composeCultureIdentity` pipeline as living cultures — foundation bias, venerated spheres, primary biome, behavioral keywords, material vocabulary, metaphor palette, trait seeds. This data supports future systems: ruin generation, artifact seeding, encounter flavor, and prose enrichment. Historical cultures are not simulation participants but their identity data is load-bearing for world texture.

- **Graph representation:** `actor` nodes with `actorType: 'culture'` and `cultureEra: 'historical'` property
- **Authored seed templates:** `historical-culture-content.ts` provides starting constraints (e.g., force a foundation bias or sphere affinity) that feed into the existing composition pipeline

### Decision 3: Historical Cultures Claim Multi-Region Territories

Like real empires, a historical culture controls a contiguous blob of multiple regions. Territory assignment:

1. Pick a seed hex per historical culture (Poisson-like spacing for even distribution)
2. Greedy round-robin expansion — each culture claims the nearest unclaimed region, preferring biome-matching regions
3. Expansion continues until coverage target is met
4. Unclaimed regions become wilderness

### Decision 4: Region Names Derive from Historical Culture

Claimed regions get names built from the historical culture's `CULTURE_NAME_FRAGMENTS` (foundation + sphere fragments) combined with geographic feature vocabulary. Unclaimed regions get plain geographic names.

Names are permanent — conquest does not rename regions.

### Decision 5: Rivers Named by Culture at Mouth, Lakes Inherit Region

Rivers are named by the historical culture controlling the region at the river's mouth (or the largest settlement along the river if it's inland). Lakes inherit the historical culture of their containing region.

### Decision 6: Tunable Constants

| Constant | Default | Purpose |
|----------|---------|---------|
| `HISTORICAL_CULTURE_COUNT` | `{ min: 2, max: 4 }` | Number of dead empires per world |
| `HISTORICAL_TERRITORY_COVERAGE` | `0.85` | Fraction of nameable regions claimed by historical cultures |

## Geographic Region Detection

### Flood-Fill Clustering

Post-biome-classification pass. Group contiguous hexes of related terrain types.

| Feature | Hex types grouped | Min cluster size |
|---------|-------------------|-----------------|
| Mountain Range | mountains, high_mountains, glacier, volcano | 3 |
| Hill Country | hills, forested_hills, moor_bog | 4 |
| Forest | all forest types (temperate, dense, boreal, light, evergreen, great_home_trees) + jungle | 5 |
| Plains | grassland, savanna, steppe, farmland | 6 |
| Desert | desert, rocky_desert, sand_dunes, badlands | 4 |
| Wetland | swamp, marsh, moor_bog, floodplain | 3 |
| Tundra | tundra, arctic, snow_fields, glacier | 4 |
| River | contiguous hasRiver hexes | 5 |
| Lake | contiguous lake hexes | 1 |
| Sea/Ocean | ocean, deep_ocean, tropical_ocean | — (not named) |

**Overlap note:** Some terrain types appear in multiple categories (glacier in both Mountain Range and Tundra, moor_bog in both Hill Country and Wetland). Resolution: assign to the category with the most neighbors of that category. Ties broken by priority order (Mountain > Hill > Forest > Plains > Desert > Wetland > Tundra).

**Undersized clusters:** Clusters below minimum size are absorbed into the nearest qualifying neighbor region. If no neighbor qualifies, the hexes remain unregioned (no `regionId`).

### Graph Representation

Each region cluster becomes a `region` node:

```typescript
{
  id: 'region_0',
  type: 'region',
  name: 'The Veiled Crags',       // generated name
  properties: {
    featureType: 'mountain_range', // geographic category
    hexCount: 7,                   // number of hexes in cluster
    centerCol: 12,                 // centroid hex col
    centerRow: 8,                  // centroid hex row
  },
}
```

Each hex in the cluster gets `regionId` set on its `HexTile`. Regions do NOT get `contains` edges to individual hexes (hexes aren't graph nodes). Instead, region membership is queryable via `tiles.filter(t => t.regionId === regionId)`.

Regions that contain locations get `contains` edges to those location nodes.

## Historical Culture Generation

### Authored Seed Templates

`src/data/historical-culture-content.ts` provides an array of seed templates:

```typescript
export interface HistoricalCultureTemplate {
  id: string;
  name: string;                          // display name for the dead empire
  foundationBias?: string;               // optional: force foundation
  sphereAffinities?: SphereName[];       // optional: bias sphere selection
  biomePreference?: TerrainType;         // optional: preferred terrain
  ruinDescriptors: string[];             // architectural flavor for ruins
  legacyFlavor: string;                  // one-line flavor for prose
}
```

Templates are selected by seeded PRNG and fed into `composeCultureIdentity` with their biases applied. The full `CultureIdentity` is generated, not hand-authored — templates just constrain the generator.

### Seeding Order

Historical cultures are generated **before** living cultures in the world-seed pipeline:

1. Generate hex grid + terrain classification (existing)
2. **Detect geographic regions** (new — flood-fill)
3. **Generate historical cultures** (new — from templates)
4. **Assign historical territories** (new — greedy expansion)
5. **Name regions** (new — culture-driven naming)
6. Generate living cultures (existing — unchanged)
7. Assign living cultures to locations (existing — `current` layer)
8. Seed actors, factions, artifacts (existing)

## Territory Assignment

### Algorithm

```
1. For each historical culture, pick a seed hex:
   - Use Poisson-like spacing (divide map into N sectors, pick random hex per sector)
   - Prefer hexes matching the culture's primaryBiome

2. Build a region adjacency graph (regions that share hex borders)

3. Round-robin expansion:
   for each round:
     for each culture:
       find all unclaimed regions adjacent to culture's territory
       score each by: biome_match_bonus + inverse_distance_to_seed
       claim the highest-scoring region
       add belongs_to edge (cultureLayer: 'historical')
   until claimed_count / total_nameable_regions >= HISTORICAL_TERRITORY_COVERAGE

4. Remaining unclaimed regions → wilderness (no historical culture edge)
```

### Border Zones

Where two historical cultures' territories meet, the border regions are natural sites for:
- Ruins with mixed architectural styles
- Battleground locations
- Contested artifacts
- Cultural tension encounters

This is a future system concern but the territory data supports it.

## Region Naming

### Name Construction

**Claimed regions** — built from historical culture fragments + geographic vocabulary:

| Pattern | Example |
|---------|---------|
| `The {culture_adj} {geo_noun}` | The Veiled Crags |
| `{culture_noun}{geo_suffix}` | Ashwall |
| `The {culture_adj} {feature_type}` | The Hidden Marshes |
| `{culture_noun} {geo_noun}` | Bone Hollows |

Where:
- `culture_adj` / `culture_noun`: drawn from the historical culture's `CULTURE_NAME_FRAGMENTS` (foundation + sphere entries)
- `geo_noun` / `geo_suffix` / `feature_type`: from a new `REGION_NAME_FRAGMENTS` table keyed by geographic feature category

**Unclaimed regions** — plain geographic names:

| Pattern | Example |
|---------|---------|
| `The {geo_adj} {feature_type}` | The Iron Mountains |
| `The {geo_noun}` | The Shallows |

**Rivers** — named by the historical culture at the river mouth. Pattern: `The {culture_noun} River` or `The {culture_adj} {river_noun}`.

**Lakes** — inherit the historical culture of their containing region. Pattern: `{culture_adj} Lake` or `Lake {culture_noun}`.

### New Data Table: REGION_NAME_FRAGMENTS

```typescript
// Keyed by geographic feature type
export const REGION_NAME_FRAGMENTS: Record<RegionFeatureType, {
  nouns: string[];       // "Crags", "Peaks", "Hollows"
  suffixes: string[];    // "-wall", "-mere", "-wood"
  adjectives: string[];  // for unclaimed wilderness names
}> = { ... };
```

### Uniqueness

Names are generated with seeded PRNG. Collision retry (up to 3 attempts with different fragment combinations) ensures no duplicate region names per world.

## Downstream Uses (Future, Shaped by This Design)

The full `CultureIdentity` on historical cultures enables:

- **Ruins** — `locationSubtype: 'ruins'` with `ruinDescriptors` from the historical culture template, material vocabulary for architectural flavor
- **Artifacts** — sphere-affinity artifacts seeded from the historical culture's `veneratedSpheres`
- **Encounters** — ghosts/echoes shaped by the culture's behavioral keywords and metaphor palette
- **Prose** — prose generator references historical culture identity when describing regions, locations, and discoveries
- **Player discovery** — uncovering which historical culture built a ruin is a knowledge-fog reveal

## Testing Strategy

1. **Flood-fill correctness** — unit tests: known hex grids → expected clusters
2. **Historical culture generation** — deterministic seed → same cultures every time
3. **Territory coverage** — assert claimed/total ratio within ±5% of target across 20 seeds
4. **Name uniqueness** — no duplicate region names per world across 20 seeds
5. **Integration** — full pipeline seed 1-20, assert every region has a name, every claimed region has a `belongs_to` edge
