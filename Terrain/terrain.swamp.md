---
tags: ["terrain", "generated"]
id: terrain.swamp
category: terrain
color: "#6a8a5a"
icon: 🌿
elevation_range:
  - -0.2
  - 0.05
temperature_range:
  - 10
  - 28
moisture_range:
  - 85
  - 100
---

# Swamp & Marsh

> Waterlogged terrain where water and land blur together. Cattails, lily pads, and murky channels characterize this biome. Insects swarm; the air reeks of decay and life.

## Properties
- **color**: #6a8a5a
- **icon**: 🌿
- **elevation_range**: [-0.2,0.05]
- **temperature_range**: [10,28]
- **moisture_range**: [85,100]

## Outgoing Connections
- **Adjacent** → [[Bog & Fen]] (w: 0.6)
- **Adjacent** → [[Lake]] (w: 0.8)

## Incoming Connections
- **Biome Affinity** ← [[Life]] (w: 0.8)
- **Adjacent** ← [[Dense Forest]] (w: 0.7)
- **Adjacent** ← [[Jungle & Tropical Forest]] (w: 0.6)
- **Adjacent** ← [[River]] (w: 0.8)
- **Draws From** ← [[Necromancy]] (w: 0.6)
