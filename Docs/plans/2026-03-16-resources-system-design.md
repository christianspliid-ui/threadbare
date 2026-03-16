# Resources System Design

> Written 2026-03-16. Adds hex/location resources to give the Land layer material depth and create economic motivations for agents.

---

## 1. Problem

The HexChronicle Land layer has terrain prose but nothing about what the land *yields*. Locations have no material identity — a mountain hamlet and a forest hamlet are mechanically identical. Agents have no economic motivations for choosing locations or pursuing ambitions.

## 2. Design

### Resource types

8 resource types covering the basic material economy. Each has terrain affinities, a sphere connection, and a renewal characteristic.

| Resource | Terrains | Sphere | Renewable | Notes |
|----------|----------|--------|-----------|-------|
| timber | all forests, forested_hills, great_home_trees | life | yes | Construction, fuel |
| stone | mountains, high_mountains, hills, badlands, plateau | matter | no | Fortification, building |
| ore | mountains, high_mountains, volcano, hills | matter, energy | no | Metalwork, tools, weapons |
| water | lake, river, floodplain, oasis, marsh, swamp | life | yes | Agriculture, settlement |
| fish | coast, coastal_shallows, lake, river, reef | life | yes | Food, trade |
| grazing | grassland, savanna, steppe, farmland | life | yes | Livestock, cavalry |
| grain | farmland, floodplain, grassland | life, matter | yes | Agriculture, food surplus |
| peat | marsh, moor_bog, swamp | entropy | slow | Fuel, preservative |

### How resources are modeled

Resources are **not** separate graph nodes. They are **properties on location nodes** — a flat `resources` record. This keeps the graph lean (no node explosion) and matches how resources are consumed: per-location, not per-hex.

```typescript
// On location node properties:
resources: Record<string, ResourceInstance>
// e.g. { timber: { quantity: 72, renewable: true, renewalRate: 0.3 }, stone: { quantity: 45, renewable: false } }
```

A `ResourceInstance` is:
```typescript
interface ResourceInstance {
  quantity: number;       // 0-100 abundance scale
  renewable: boolean;
  renewalRate: number;    // 0-1, per-cycle renewal fraction (0 for non-renewable)
}
```

### Terrain → resource seeding

During `seedWorld()`, after location nodes are created, each location gets resources based on its terrain. The mapping is defined in a content table `TERRAIN_RESOURCE_TABLE`:

```typescript
const TERRAIN_RESOURCE_TABLE: Record<string, { type: string; min: number; max: number }[]> = {
  temperate_forest: [
    { type: 'timber', min: 50, max: 85 },
    { type: 'water', min: 20, max: 40 },
  ],
  mountains: [
    { type: 'stone', min: 60, max: 90 },
    { type: 'ore', min: 30, max: 70 },
  ],
  // ...etc
};
```

Each location gets 1-3 resource types. Seeded PRNG determines exact quantities within the range. Sphere cosmology biases quantities slightly (life-heavy world = more timber/grazing, matter-heavy = more stone/ore).

### Prose resolver

A new `resourcesResolver` in `proseResolvers.ts` generates prose layers for locations that have resources. Priority 65 (between atmosphere and origin). Category: `'resources'`.

Content table `RESOURCE_PROSE` in `prose-layer-content.ts` provides 3-4 templates per resource type, both abundance and scarcity variants.

### HexChronicle integration

Resources appear in the **Land** layer of the HexChronicle, below the terrain prose. Displayed as:

1. A prose sentence about the dominant resource (from resourcesResolver).
2. Resource tags — small pill-shaped labels showing each resource type + abundance label (abundant/moderate/scarce).

Abundance labels:
- **abundant**: quantity ≥ 60
- **moderate**: quantity 30-59
- **scarce**: quantity 1-29

### Resource icons

Emoji for v1 (matching the Notion backlog suggestion). Upgrade to SVG later.

| Resource | Icon |
|----------|------|
| timber | 🪵 |
| stone | 🪨 |
| ore | ⛏️ |
| water | 💧 |
| fish | 🐟 |
| grazing | 🌾 |
| grain | 🌽 |
| peat | 🟤 |

## 3. Implementation Plan

### Task 1: Type definitions + resource content table
- Add `ResourceInstance` to `src/types/resource.ts` (new file)
- Add `RESOURCE_DEFINITIONS` and `TERRAIN_RESOURCE_TABLE` to `src/data/resource-content.ts` (new file)
- Add `RESOURCE_ICONS` and `RESOURCE_ABUNDANCE_LABELS` constants
- Tests: validate all 42 terrains have at least a fallback, quantity ranges are valid

### Task 2: Seed resources in worldSeed
- After location node creation, call `seedLocationResources(graph, locationIds, cosmology, rng)`
- New function in worldSeed.ts (or extracted to a helper)
- Stores `resources` property on each location node
- Tests: determinism (same seed = same resources), all locations get at least 1 resource, quantities in range

### Task 3: Resource prose resolver
- Add `resourcesResolver` to `proseResolvers.ts`
- Add `RESOURCE_PROSE` table to `prose-layer-content.ts`
- Register in prose generator pipeline for location entities
- Tests: fail-soft on missing resources, correct priority/category, template substitution

### Task 4: HexChronicle Land layer integration
- In `HexChronicle.tsx`, query location resources from graph
- Add resource prose paragraph below terrain prose in Land section
- Add resource tag pills (emoji + type + abundance label)
- Tests: renders with resources, renders without resources (graceful), correct abundance labels

### Task 5: World-model.json update
- Add `resource-type` category
- Add 8 resource-type definition nodes
- Add `has_resource` to relationship types (documentation only — actual edges are properties, not graph edges)
- Run validation script

### Task 6: Integration tests + verification
- Multi-seed determinism test
- Full pipeline: seedWorld → location has resources → HexChronicle renders resource content
- Type-check, build, all tests pass

## 4. What this does NOT include (future)

- Resource depletion/harvesting mechanics (needs action system integration)
- Resource trade between locations
- Resource-driven agent ambitions (needs ambition template expansion)
- Resource-driven encounter generation
- SVG resource icons (emoji first)
