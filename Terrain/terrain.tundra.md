---
tags: ["terrain", "generated"]
id: terrain.tundra
category: terrain
color: "#c8c8b8"
icon: ❄️
elevation_range:
  - 0.1
  - 0.5
temperature_range:
  - -40
  - -5
moisture_range:
  - 10
  - 30
---

# Tundra

> Frozen wasteland where permafrost underlies sparse, hardy vegetation. Brutal cold defines this biome. Few humans survive here; those who do are tough beyond measure.

## Properties
- **color**: #c8c8b8
- **icon**: ❄️
- **elevation_range**: [0.1,0.5]
- **temperature_range**: [-40,-5]
- **moisture_range**: [10,30]

## Outgoing Connections
- **Adjacent** → [[Glacier & Ice]] (w: 0.8)
- **Adjacent** → [[Taiga & Boreal Forest]] (w: 0.8)

## Incoming Connections
- **Adjacent** ← [[Taiga & Boreal Forest]] (w: 0.8)
- **Draws From** ← [[Ice Magic]] (w: 0.85)
