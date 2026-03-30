---
tags: ["terrain", "generated"]
id: terrain.mountains
category: terrain
color: "#8a7a6a"
icon: 🏔️
elevation_range:
  - 0.6
  - 1
temperature_range:
  - -20
  - 10
moisture_range:
  - 20
  - 60
---

# Mountains

> Towering peaks that pierce the sky. Snow caps summits, thin air makes breathing difficult, and views stretch for a hundred miles. Home to hermits, dwarves, and ancient dragons.

## Properties
- **color**: #8a7a6a
- **icon**: 🏔️
- **elevation_range**: [0.6,1]
- **temperature_range**: [-20,10]
- **moisture_range**: [20,60]

## Outgoing Connections
- **Adjacent** → [[Plateau]] (w: 0.6)
- **Adjacent** → [[Taiga & Boreal Forest]] (w: 0.7)
- **Adjacent** → [[Glacier & Ice]] (w: 0.8)

## Incoming Connections
- **Biome Affinity** ← [[Matter]] (w: 0.85)
- **Biome Affinity** ← [[Spirit]] (w: 0.5)
- **Adjacent** ← [[Hills]] (w: 0.9)
- **Adjacent** ← [[Glacier & Ice]] (w: 0.8)
- **Adjacent** ← [[Volcanic]] (w: 0.7)
- **Draws From** ← [[Earth Magic]] (w: 0.9)
- **Terrain Valid** ← [[Fortress]] (w: 1)
- **Terrain Valid** ← [[Temple]] (w: 1)
- **Terrain Valid** ← [[Mine]] (w: 1)
