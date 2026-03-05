---
tags: ["terrain", "generated"]
id: terrain.river
category: terrain
color: "#5577cc"
icon: 🌊
elevation_range:
  - -0.1
  - 0.3
temperature_range:
  - 5
  - 25
moisture_range:
  - 90
  - 100
---

# River

> Flowing freshwater that carves through the land. Rivers are highways of commerce, sources of life, and often form natural barriers or meeting places.

## Properties
- **color**: #5577cc
- **icon**: 🌊
- **elevation_range**: [-0.1,0.3]
- **temperature_range**: [5,25]
- **moisture_range**: [90,100]

## Outgoing Connections
- **Adjacent** → [[Grassland & Plains]] (w: 0.7)
- **Adjacent** → [[Deciduous Forest]] (w: 0.7)
- **Adjacent** → [[Swamp & Marsh]] (w: 0.8)

## Incoming Connections
- **Contains** ← [[Lake]] (w: 0.8)
- **Draws From** ← [[Water Magic]] (w: 0.7)
