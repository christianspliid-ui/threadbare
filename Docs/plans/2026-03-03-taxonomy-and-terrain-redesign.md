# Cosmological Taxonomy & Naturalistic Terrain Redesign

**Date:** 2026-03-03
**Status:** Approved
**Approach:** Graph-First Data Model + Parallel Agent Team

---

## 1. Overview

This iteration replaces the MVP's fantasy terrain types (Crystal Wastes, Void Rift, etc.) with a two-layer system:

1. **Naturalistic geography** — realistic biomes generated from elevation, temperature, and moisture noise (forests, mountains, plains, swamps, etc.)
2. **Cosmological taxonomy** — a typed directed graph defining the metaphysical structure of the world (Elder Spheres, Creation Spheres, magic traditions) stored as JSON data files with a visual graph renderer

The cosmology subtly biases geography but does not dominate it. High-fantasy elements (enchanted groves, void rifts, crystal formations) become **anomalies** discovered at deeper zoom levels in future iterations, not base terrain types.

---

## 2. The Cosmological Taxonomy

### 2.1 Graph Data Model

The taxonomy is a **typed directed graph** stored in JSON files under `src/data/taxonomy/`.

**Nodes** — every concept in the cosmology:
```typescript
interface TaxonomyNode {
  id: string;           // unique slug, e.g. "foundation.chaos"
  name: string;         // display name, e.g. "Chaos"
  category: string;     // layer: "foundation", "creation", "magic-tradition", "terrain", "relationship-type", etc.
  description: string;  // lore/flavor text
  properties: Record<string, any>; // category-specific data (color, game params, etc.)
}
```

**Edges** — typed connections between nodes:
```typescript
interface TaxonomyEdge {
  source: string;       // source node ID
  target: string;       // target node ID
  type: string;         // references a relationship-type node ID
  weight?: number;      // optional strength (0.0–1.0)
  properties?: Record<string, any>; // edge-specific metadata
}
```

**Relationship Types** — themselves nodes in the graph (category: "relationship-type"), making the system self-describing:
```typescript
interface RelationshipTypeProperties {
  pattern: "symmetric" | "asymmetric";
  description: string;
  visualStyle?: { color: string; dashArray?: string; arrowHead?: boolean };
}
```

### 2.2 File Structure

```
src/data/taxonomy/
  relationship-types.json   # meta-definitions of edge types
  foundation-spheres.json   # Chaos, Darkness, Light, Shadow
  creation-spheres.json     # Force, Matter, Energy, Life, Mind, Spirit, Time, Entropy
  magic-traditions.json     # Elemental, Nature, Spiritual, Abstract schools + specific traditions
  terrain-biomes.json       # All ~20 naturalistic biome definitions
  edges.json                # All connections across the taxonomy
```

### 2.3 Starting Relationship Types

| ID | Name | Pattern | Description |
|----|------|---------|-------------|
| `underpins` | Underpins | Asymmetric | Foundational dependency (Chaos underpins Darkness & Light) |
| `opposes` | Opposes | Symmetric | Binary opposition (Darkness opposes Light) |
| `emerges-from` | Emerges From | Asymmetric | Derivative/mergent (Shadow emerges from Darkness + Light) |
| `generates` | Generates | Asymmetric | Creative hierarchy (a Creation Sphere generates magic traditions) |
| `draws-from` | Draws From | Asymmetric | A tradition pulls energy from one or more spheres |
| `biome-affinity` | Biome Affinity | Asymmetric | A Creation Sphere has weighted affinity to terrain biomes |
| `contains` | Contains | Asymmetric | Hierarchical parent-child (Forest contains Dense Forest) |
| `adjacent` | Adjacent | Symmetric | Natural biome transition (Plains adjacent to Hills) |
| `amplifies` | Amplifies | Asymmetric | One element strengthens another |
| `suppresses` | Suppresses | Asymmetric | One element weakens another |

The content designer can define new relationship types at any time by adding nodes with category "relationship-type".

### 2.4 Elder Spheres of Foundation

The deepest layer of the cosmology. These are not "forces" the player manipulates — they are the metaphysical substrate of reality.

```
Chaos (the primordial underpinning)
  ├── underpins → Darkness
  ├── underpins → Light
  Darkness ←opposes→ Light
  Shadow (emerges-from Darkness + Light)
```

**Chaos** is the ground of all being — not evil, but raw potential. It underpins Darkness and Light, which are the first binary opposition. Shadow is not a "fourth sphere" at the same level — it is emergent, the interplay zone where Darkness and Light meet.

### 2.5 Elder Spheres of Creation

Built on top of the Foundation. These are the building blocks of physical and metaphysical reality:

| Sphere | Domain | Key Associations |
|--------|--------|-----------------|
| **Force** | Physics, motion, kinetic energy | Wind, gravity, pressure, magnetism |
| **Matter** | Substance, solidity, material | Stone, metal, crystal, soil |
| **Energy** | Heat, light, electricity, radiation | Fire, lightning, plasma, radiance |
| **Life** | Biology, growth, healing, fertility | Plants, animals, regeneration, disease |
| **Mind** | Thought, perception, memory, illusion | Telepathy, psychic powers, dreams |
| **Spirit** | Soul, afterlife, divine connection | Ghosts, undead, holy/unholy, ancestors |
| **Time** | Temporal flow, aging, prophecy | Haste, slow, precognition, stasis |
| **Entropy** | Decay, randomness, luck, dissolution | Chance, rot, probability, chaos magic |

### 2.6 Magic Traditions

Derived from Creation Spheres. Each tradition **draws-from** one or more spheres, forming the in-world magic system that NPCs and factions practice.

**Elemental Schools** (draw primarily from Force + Matter + Energy):
- Fire Magic (Energy + Force)
- Ice Magic (Energy + Matter, subtractive)
- Earth Magic (Matter + Force)
- Air/Wind Magic (Force)
- Water Magic (Matter + Energy)
- Lightning Magic (Energy + Force)

**Nature Schools** (draw primarily from Life):
- Plant Magic (Life + Matter)
- Animal Magic (Life + Mind)
- Healing (Life + Spirit)
- Druidic/Shapeshifting (Life + Force + Matter)

**Spiritual Schools** (draw primarily from Spirit + Mind):
- Shamanism / Soul Magic (Spirit + Life)
- Necromancy (Spirit + Entropy)
- Holy/Divine Magic (Spirit + Energy)
- Mind Control / Psionics (Mind)
- Illusion (Mind + Energy)
- Dream Magic (Mind + Spirit + Time)

**Abstract Schools** (draw from Time, Entropy, or complex combinations):
- Teleportation / Spatial Magic (Force + Time)
- Chronomancy / Time Stop (Time)
- Divination / Prophecy (Time + Mind)
- Luck / Probability Magic (Entropy)
- Transmutation (Matter + Energy + Life)
- Enchantment / Artificing (Matter + Mind + Energy)
- Ward / Abjuration (Force + Spirit)

> **Note:** This is the starting content. The content designer agent will expand with more traditions, sub-schools, and cross-references.

---

## 3. Naturalistic Terrain System

### 3.1 Biome Set (~20 types)

Replaces the MVP's 16 fantasy terrain types with geographic biomes inspired by the Atlas of Mystara.

**Water:**
| ID | Name | Generation Rule |
|----|------|----------------|
| `ocean` | Ocean | Elevation < -0.3 |
| `coastal_shallows` | Coastal Shallows | Elevation -0.3 to -0.1 |
| `lake` | Lake | Low elevation inland basin |
| `river` | River | Water flow from elevation gradient |

**Lowlands:**
| ID | Name | Generation Rule |
|----|------|----------------|
| `grassland` | Plains / Grassland | Low elevation, moderate moisture, temperate |
| `farmland` | Farmland | Fertile plains near settlements (human layer) |
| `savanna` | Savanna | Low elevation, low-moderate moisture, warm |
| `steppe` | Steppe | Low elevation, low moisture, temperate-cold |

**Forest:**
| ID | Name | Generation Rule |
|----|------|----------------|
| `deciduous_forest` | Deciduous Forest | Moderate elevation, high moisture, temperate |
| `dense_forest` | Dense Forest | Low-moderate elevation, very high moisture, temperate |
| `taiga` | Taiga / Boreal | Moderate elevation, moderate moisture, cold |
| `jungle` | Jungle / Tropical | Low elevation, very high moisture, hot |

**Wet:**
| ID | Name | Generation Rule |
|----|------|----------------|
| `swamp` | Swamp / Marsh | Very low elevation, very high moisture, warm-temperate |
| `bog` | Bog / Fen | Very low elevation, high moisture, cold |

**Elevated:**
| ID | Name | Generation Rule |
|----|------|----------------|
| `hills` | Hills | Moderate-high elevation, any moisture |
| `mountains` | Mountains | High elevation |
| `plateau` | Plateau | High elevation, flat gradient |
| `badlands` | Badlands | Moderate elevation, very low moisture, high temperature |

**Extreme:**
| ID | Name | Generation Rule |
|----|------|----------------|
| `desert` | Desert | Low-moderate elevation, very low moisture, hot |
| `tundra` | Tundra | Any elevation, very cold |
| `glacier` | Glacier / Ice | High elevation + very cold, or polar |
| `volcanic` | Volcanic | Special: rare, near tectonic features |

### 3.2 Generation Algorithm

Replaces the force-field approach with geographic noise layers:

1. **Elevation** — multi-octave simplex noise → height map (continental shapes, mountain ranges)
2. **Temperature** — latitude gradient + altitude modifier + noise
3. **Moisture** — distance-from-ocean + rain shadow from mountains + noise
4. **Biome lookup** — (elevation, temperature, moisture) → terrain type via Whittaker-style classification

The cosmology applies a subtle global bias:
- Creation Spheres weighted toward Energy → slight temperature increase
- Creation Spheres weighted toward Life → slight moisture increase
- Creation Spheres weighted toward Matter → more mountainous terrain
- Creation Spheres weighted toward Entropy → more terrain variation/noise

These biases shift biome boundaries by small amounts (±5-10%), making the cosmology's influence visible but not dominating.

### 3.3 Color Palette

Naturalistic cartographic colors inspired by the Mystara map:

| Biome | Color | Hex |
|-------|-------|-----|
| Ocean | Deep blue | #4477aa |
| Coastal Shallows | Light blue | #88bbdd |
| Grassland | Yellow-green | #c8d87a |
| Farmland | Golden yellow | #ddc855 |
| Deciduous Forest | Medium green | #6aaa5a |
| Dense Forest | Dark green | #3d7a3d |
| Taiga | Grey-green | #7a9a6a |
| Jungle | Bright green | #2d8a3d |
| Swamp | Olive-teal | #6a8a5a |
| Hills | Tan-green | #b8a870 |
| Mountains | Brown-grey | #8a7a6a |
| Desert | Sandy tan | #ddc890 |
| Tundra | Pale grey | #c8c8b8 |
| Glacier | White-blue | #d8e8f0 |
| Savanna | Warm yellow | #d8c870 |
| Steppe | Dusty brown | #c0a868 |
| Volcanic | Dark red-brown | #6a3a2a |
| Plateau | Ochre | #b89858 |
| Badlands | Red-brown | #a87050 |
| Bog | Dark olive | #5a6a4a |

### 3.4 Hex Map Integration

The hex map components (HexTile, HexMap) are updated to:
- Use the new biome types and naturalistic color palette
- Replace fantasy terrain emoji icons with geographic icons (🌲🏔️🌾🏜️🌊 etc.)
- Keep the TTRPG parchment aesthetic (Cinzel font, sepia grid, warm UI)
- Remove the "Divine Lens" force overlay (replaced later by cosmological saturation view)

---

## 4. Taxonomy Viewer Component

A new tab/panel in the React app that renders the taxonomy graph visually.

### 4.1 Features
- Force-directed graph layout using d3-force
- Nodes colored by category (foundation = deep purple, creation = gold, magic = blue, terrain = green)
- Edges styled by relationship type (dashed for opposition, solid for hierarchy, etc.)
- Click a node to see its properties, connections, and lore text
- Filter by category (show only magic traditions, only terrain, etc.)
- Zoom and pan

### 4.2 Technical Approach
- Read taxonomy JSON files at build time (Vite JSON import)
- d3-force for layout simulation
- SVG rendering (consistent with hex map approach)
- Sidebar panel for selected node details

---

## 5. Agent Team Structure

Three parallel agents with no shared file conflicts:

### Agent 1: Content Designer
**Scope:** Expand the taxonomy content in JSON data files
**Inputs:** The Elder Sphere structure from Section 2, fantasy trope research
**Outputs:** `src/data/taxonomy/*.json` — all nodes, edges, relationship types
**Constraints:** Follow the node/edge schema exactly. Research classic fantasy magic systems for inspiration. Define at least the full foundation layer, creation layer, 15+ magic traditions with sphere connections, and all 20+ terrain biomes as taxonomy nodes.

### Agent 2: Graph Engineer
**Scope:** Build the taxonomy data model, loader, and visual viewer
**Inputs:** TypeScript interfaces from Section 2.1, d3-force for layout
**Outputs:** `src/types/taxonomy.ts`, `src/engine/taxonomy.ts` (loader + query helpers), `src/components/TaxonomyViewer/` (React + d3 graph renderer)
**Constraints:** TDD. Do not write taxonomy content — load it from JSON files. The viewer must support filtering by category and clicking nodes for details.

### Agent 3: Terrain Engineer
**Scope:** Rebuild hex map with naturalistic biomes
**Inputs:** Biome set from Section 3, color palette, generation algorithm
**Outputs:** Updated `src/types/index.ts`, new `src/engine/terrain.ts`, updated `src/engine/hexGrid.ts`, updated `src/engine/color.ts`, updated `src/components/HexMap/*`
**Constraints:** TDD. Replace all fantasy terrain types with geographic biomes. Use elevation/temperature/moisture noise. Keep the TTRPG parchment aesthetic. The cosmology panel should still work but now biases geographic parameters instead of force weights.

---

## 6. File Ownership (No Conflicts)

| File/Directory | Owner |
|----------------|-------|
| `src/data/taxonomy/*.json` | Content Designer |
| `src/types/taxonomy.ts` | Graph Engineer |
| `src/engine/taxonomy.ts` | Graph Engineer |
| `src/components/TaxonomyViewer/*` | Graph Engineer |
| `src/types/index.ts` (terrain types) | Terrain Engineer |
| `src/engine/terrain.ts` | Terrain Engineer |
| `src/engine/hexGrid.ts` | Terrain Engineer |
| `src/engine/color.ts` | Terrain Engineer |
| `src/engine/forceField.ts` | Terrain Engineer (rewrite) |
| `src/components/HexMap/*` | Terrain Engineer |
| `src/components/Cosmology/*` | Terrain Engineer |
| `src/App.tsx` | Integration (after agents complete) |
