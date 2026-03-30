---
tags: ["terrain", "generated"]
id: terrain.hills
category: terrain
color: "#b8a870"
icon: ⛰️
elevation_range:
  - 0.3
  - 0.6
temperature_range:
  - 0
  - 22
moisture_range:
  - 25
  - 65
---

# Hills

> Gently rolling terrain with moderate elevation changes. Valleys nestle between slopes; forests cling to hillsides. A biome of transition and layered views.

## Properties
- **color**: #b8a870
- **icon**: ⛰️
- **elevation_range**: [0.3,0.6]
- **temperature_range**: [0,22]
- **moisture_range**: [25,65]

## Outgoing Connections
- **Adjacent** → [[Mountains]] (w: 0.9)
- **Adjacent** → [[Plateau]] (w: 0.7)

## Incoming Connections
- **Biome Affinity** ← [[Matter]] (w: 0.7)
- **Adjacent** ← [[Grassland & Plains]] (w: 1)
- **Adjacent** ← [[Deciduous Forest]] (w: 0.8)
- **Terrain Valid** ← [[Fortress]] (w: 1)
