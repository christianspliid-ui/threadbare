---
tags: ["terrain", "generated"]
id: terrain.dense_forest
category: terrain
color: "#3d7a3d"
icon: 🌲
elevation_range:
  - -0.05
  - 0.3
temperature_range:
  - 8
  - 24
moisture_range:
  - 70
  - 95
---

# Dense Forest

> A thick, primordial forest with towering trees and dense canopy. Sunlight barely penetrates the gloom; the air is thick with moisture and life. Home to ancient creatures and hidden peoples.

## Properties
- **color**: #3d7a3d
- **icon**: 🌲
- **elevation_range**: [-0.05,0.3]
- **temperature_range**: [8,24]
- **moisture_range**: [70,95]

## Outgoing Connections
- **Adjacent** → [[Jungle & Tropical Forest]] (w: 0.5)
- **Adjacent** → [[Swamp & Marsh]] (w: 0.7)

## Incoming Connections
- **Biome Affinity** ← [[Life]] (w: 0.9)
- **Biome Affinity** ← [[Mind]] (w: 0.4)
- **Adjacent** ← [[Deciduous Forest]] (w: 0.7)
- **Draws From** ← [[Plant Magic]] (w: 0.85)
