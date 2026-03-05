---
tags: ["terrain", "generated"]
id: terrain.volcanic
category: terrain
color: "#6a3a2a"
icon: 🌋
elevation_range:
  - 0.2
  - 0.8
temperature_range:
  - 15
  - 45
moisture_range:
  - 0
  - 30
---

# Volcanic

> Landscapes shaped by volcanic activity. Lava flows, ash fields, and hot springs dot the terrain. The earth rumbles with primal power; danger and opportunity intertwine.

## Properties
- **color**: #6a3a2a
- **icon**: 🌋
- **elevation_range**: [0.2,0.8]
- **temperature_range**: [15,45]
- **moisture_range**: [0,30]

## Outgoing Connections
- **Adjacent** → [[Badlands]] (w: 0.6)
- **Adjacent** → [[Desert]] (w: 0.5)
- **Adjacent** → [[Mountains]] (w: 0.7)

## Incoming Connections
- **Biome Affinity** ← [[Matter]] (w: 0.75)
- **Biome Affinity** ← [[Energy]] (w: 0.8)
- **Biome Affinity** ← [[Entropy]] (w: 0.5)
- **Draws From** ← [[Fire Magic]] (w: 0.9)
