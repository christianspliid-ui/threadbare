---
tags: ["terrain", "generated"]
id: terrain.glacier
category: terrain
color: "#d8e8f0"
icon: 🧊
elevation_range:
  - 0.5
  - 1
temperature_range:
  - -50
  - -10
moisture_range:
  - 20
  - 40
---

# Glacier & Ice

> Vast sheets of ancient ice covering land and sea. Crevasses hide deadly falls; the ice creaks and groans as it moves. A place of stark beauty and existential cold.

## Properties
- **color**: #d8e8f0
- **icon**: 🧊
- **elevation_range**: [0.5,1]
- **temperature_range**: [-50,-10]
- **moisture_range**: [20,40]

## Outgoing Connections
- **Adjacent** → [[Mountains]] (w: 0.8)

## Incoming Connections
- **Biome Affinity** ← [[Time]] (w: 0.4)
- **Adjacent** ← [[Mountains]] (w: 0.8)
- **Adjacent** ← [[Tundra]] (w: 0.8)
- **Draws From** ← [[Ice Magic]] (w: 0.95)
