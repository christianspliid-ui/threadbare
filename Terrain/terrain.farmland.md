---
tags: ["terrain", "generated"]
id: terrain.farmland
category: terrain
color: "#ddc855"
icon: 🚜
elevation_range:
  - -0.05
  - 0.15
temperature_range:
  - 12
  - 26
moisture_range:
  - 40
  - 65
---

# Farmland

> Cultivated land bearing crops and domesticated life. Plowed fields, irrigation channels, and scattered farmsteads mark human presence. A place of order imposed upon nature.

## Properties
- **color**: #ddc855
- **icon**: 🚜
- **elevation_range**: [-0.05,0.15]
- **temperature_range**: [12,26]
- **moisture_range**: [40,65]

## Outgoing Connections
- **Adjacent** → [[Grassland & Plains]] (w: 0.9)

## Incoming Connections
- **Biome Affinity** ← [[Life]] (w: 0.7)
- **Adjacent** ← [[Grassland & Plains]] (w: 0.9)
- **Terrain Valid** ← [[Settlement]] (w: 1)
