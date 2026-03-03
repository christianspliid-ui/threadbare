# Cosmological Taxonomy

This directory contains the complete cosmological taxonomy for The Fantasy World Simulator, defining the metaphysical structure of the game world as a typed directed graph.

## Overview

The taxonomy is organized into six JSON files, representing different layers of the world's metaphysical structure:

### File Descriptions

#### 1. `relationship-types.json`
Defines the 13 relationship types that connect all nodes in the graph.

**Relationship Types:**
- `rel.underpins` — Foundational dependency (asymmetric)
- `rel.opposes` — Binary opposition (symmetric)
- `rel.emerges-from` — Derivative emergence (asymmetric)
- `rel.generates` — Creative hierarchy (asymmetric)
- `rel.draws-from` — Energy sourcing (asymmetric)
- `rel.biome-affinity` — Terrain alignment (asymmetric)
- `rel.contains` — Hierarchical containment (asymmetric)
- `rel.adjacent` — Spatial transition (symmetric)
- `rel.amplifies` — Strengthening synergy (asymmetric)
- `rel.suppresses` — Weakening opposition (asymmetric)
- `rel.corrupts` — Degradation (asymmetric)
- `rel.transforms-into` — State change (asymmetric)
- `rel.seasonal-cycle` — Cyclical rhythm (symmetric)

#### 2. `foundation-spheres.json`
The deepest layer: the metaphysical foundations of reality.

**Spheres:**
- **Chaos** — The primordial underpinning; raw potential, formless and boundless
- **Darkness** — The principle of absence, void, mystery, and the unknown
- **Light** — The principle of presence, clarity, and revelation
- **Shadow** — The emergent sphere where Darkness and Light interplay; trickery and twilight

#### 3. `creation-spheres.json`
The eight building blocks of physical and metaphysical reality.

**Spheres:**
- **Force** — Physics, motion, kinetic energy, gravity, pressure
- **Matter** — Substance, solidity, stone, metal, crystal, material form
- **Energy** — Heat, light, electricity, radiation, plasma
- **Life** — Biology, growth, healing, fertility, disease
- **Mind** — Thought, perception, memory, consciousness, illusion, dreams
- **Spirit** — Soul, afterlife, divine connection, ancestors, transcendence
- **Time** — Temporal flow, aging, prophecy, causality, stasis
- **Entropy** — Decay, randomness, luck, dissolution, chaos

#### 4. `magic-traditions.json`
31 magic traditions organized into four schools, derived from Creation Spheres.

**Schools:**
- **Elemental (6):** Fire, Ice, Air, Water, Earth, Lightning
- **Nature (6):** Plant Magic, Animal Magic, Healing, Druidism, Poison, Weather
- **Spiritual (8):** Shamanism, Necromancy, Holy Magic, Psionics, Illusion, Dream Magic, Demonology, Restoration, Ascension
- **Abstract (11):** Teleportation, Chronomancy, Divination, Luck Magic, Transmutation, Enchantment, Warding, Summoning, Binding, Blood Magic, Rune Magic, Chaos Magic, Corruption

#### 5. `terrain-biomes.json`
20 naturalistic terrain biomes replacing the MVP's fantasy terrain types.

**Categories:**
- **Water (4):** Ocean, Coastal Shallows, Lake, River
- **Lowlands (4):** Grassland, Farmland, Savanna, Steppe
- **Forest (4):** Deciduous Forest, Dense Forest, Taiga, Jungle
- **Wet (2):** Swamp, Bog
- **Elevated (4):** Hills, Mountains, Plateau, Badlands
- **Extreme (4):** Desert, Tundra, Glacier, Volcanic

#### 6. `edges.json`
The comprehensive connection graph linking all nodes across all layers.

**Edge Types:**
- **Foundation relationships** — Underpins, opposes, emerges-from (5 edges)
- **Creation sphere generation** — Generates relationships from spheres to magic traditions (67 edges)
- **Magic tradition relationships** — Amplifies, supposes, opposes, draws-from between traditions (32 edges)
- **Biome affinities** — Sphere alignments with terrain types (27 edges)
- **Terrain adjacencies** — Natural transitions between biomes (45 edges)
- **Sphere interactions** — Amplifies/suppresses among creation spheres (5 edges)
- **Total edges:** 181

## Node Structure

All nodes follow the TaxonomyNode interface:

```json
{
  "id": "unique.kebab.cased.id",
  "name": "Display Name",
  "category": "node-category",
  "description": "Rich flavor text describing this concept",
  "properties": {
    "category-specific properties": "values"
  }
}
```

## Edge Structure

All edges follow the TaxonomyEdge interface:

```json
{
  "source": "source.node.id",
  "target": "target.node.id",
  "type": "rel.relationship-type-id",
  "weight": 0.0-1.0,
  "properties": {}
}
```

## Statistics

- **Total Nodes:** 80
  - Relationship Types: 13
  - Foundation Spheres: 4
  - Creation Spheres: 8
  - Magic Traditions: 31
  - Terrain Biomes: 20
  - Plus 4 for future expansion

- **Total Edges:** 181
  - Foundation relationships: 5
  - Generation relationships: 67
  - Magic tradition relationships: 32
  - Biome affinity relationships: 27
  - Terrain adjacency relationships: 45
  - Sphere interaction relationships: 5

## Cosmological Structure

### Metaphysical Hierarchy

```
Foundation (Chaos)
├── Darkness (Void, Mystery)
├── Light (Revelation, Truth)
└── Shadow (Twilight, Interplay)

Creation (8 Spheres)
├── Force (Physics, Motion)
├── Matter (Substance, Solidity)
├── Energy (Heat, Light, Power)
├── Life (Biology, Growth)
├── Mind (Thought, Perception)
├── Spirit (Soul, Divinity)
├── Time (Temporal Flow, Causality)
└── Entropy (Decay, Randomness)

Magic Traditions (31 total)
└── Organized by Creation Sphere dependencies

Terrain Biomes (20 total)
└── Influenced by Creation Sphere affinities
```

## Design Philosophy

1. **Self-Describing:** Relationship types are themselves nodes, making the system self-referential and extensible.

2. **Weighted Connections:** All edges support optional weights (0.0–1.0) to model strength of relationship, enabling nuanced gameplay mechanics.

3. **Bidirectional Implications:** While edges are directional, gameplay systems should recognize both directions (e.g., "Fire suppresses Plant" and "Plant is suppressed by Fire").

4. **Foundation-First:** All creation and magic flows from the Foundation Spheres (Chaos, Darkness, Light, Shadow), ensuring metaphysical coherence.

5. **Emergent Complexity:** The taxonomy is designed to support future expansion—new traditions, biomes, and relationships can be added without restructuring the core.

## Integration

This taxonomy is intended to be:
- **Loaded at build-time** by Vite JSON imports
- **Visualized** in a force-directed graph renderer (TaxonomyViewer component)
- **Queried** by game systems (terrain generation, magic system, NPC behavior)
- **Extended** by content designers as the game evolves

## Future Expansion

Planned additions:
- Sub-traditions (schools within schools, e.g., "Infernal Demonology")
- Sacred/Profane polarities for magic traditions
- Seasonal cycles affecting magic power and biome transitions
- Faction-specific magic traditions and cosmological interpretations
- Anomalies: high-fantasy overlay biomes (Crystal Wastes, Void Rifts) as exceptions to naturalistic generation
