---
tags: ["terrain", "generated"]
id: terrain.grassland
category: terrain
color: "#c8d87a"
icon: 🌾
elevation_range:
  - -0.1
  - 0.2
temperature_range:
  - 10
  - 25
moisture_range:
  - 30
  - 60
---

# Grassland & Plains

> Rolling or flat expanses of grass and low vegetation. The horizon stretches endlessly, wind whispers through the grasses, and the sky dominates the landscape. Perfect for cavalry and nomadic peoples.

## Properties
- **color**: #c8d87a
- **icon**: 🌾
- **elevation_range**: [-0.1,0.2]
- **temperature_range**: [10,25]
- **moisture_range**: [30,60]

## Outgoing Connections
- **Adjacent** → [[Hills]] (w: 1)
- **Adjacent** → [[Deciduous Forest]] (w: 1)
- **Adjacent** → [[Farmland]] (w: 0.9)
- **Adjacent** → [[Savanna]] (w: 0.8)
- **Adjacent** → [[Steppe]] (w: 0.7)

## Incoming Connections
- **Biome Affinity** ← [[Force]] (w: 0.3)
- **Biome Affinity** ← [[Life]] (w: 0.6)
- **Adjacent** ← [[Coastal Shallows]] (w: 0.6)
- **Adjacent** ← [[River]] (w: 0.7)
- **Adjacent** ← [[Farmland]] (w: 0.9)
- **Draws From** ← [[Shamanism & Soul Magic]] (w: 0.5)
- **Terrain Valid** ← [[Settlement]] (w: 1)
- **Terrain Valid** ← [[Temple]] (w: 1)
- **Terrain Valid** ← [[Market Town]] (w: 1)
