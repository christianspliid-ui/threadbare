---
tags: ["terrain", "generated"]
id: terrain.deciduous_forest
category: terrain
color: "#6aaa5a"
icon: 🌲
elevation_range:
  - 0.1
  - 0.4
temperature_range:
  - 5
  - 22
moisture_range:
  - 50
  - 80
---

# Deciduous Forest

> A forest of broad-leafed trees that lose their leaves seasonally. Rich undergrowth, dappled light, and the songs of countless birds characterize this temperate biome.

## Properties
- **color**: #6aaa5a
- **icon**: 🌲
- **elevation_range**: [0.1,0.4]
- **temperature_range**: [5,22]
- **moisture_range**: [50,80]

## Outgoing Connections
- **Adjacent** → [[Dense Forest]] (w: 0.7)
- **Adjacent** → [[Taiga & Boreal Forest]] (w: 0.6)
- **Adjacent** → [[Hills]] (w: 0.8)

## Incoming Connections
- **Biome Affinity** ← [[Life]] (w: 0.85)
- **Adjacent** ← [[Grassland & Plains]] (w: 1)
- **Adjacent** ← [[River]] (w: 0.7)
