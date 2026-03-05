---
tags: ["terrain", "generated"]
id: terrain.desert
category: terrain
color: "#ddc890"
icon: 🏜️
elevation_range:
  - 0
  - 0.4
temperature_range:
  - 0
  - 40
moisture_range:
  - 0
  - 15
---

# Desert

> Vast, arid expanses of sand or stone where water is precious. Extreme heat by day, freezing cold by night. Oases are treasured; trade routes cut across the dunes.

## Properties
- **color**: #ddc890
- **icon**: 🏜️
- **elevation_range**: [0,0.4]
- **temperature_range**: [0,40]
- **moisture_range**: [0,15]

## Outgoing Connections
- **Adjacent** → [[Steppe]] (w: 0.6)
- **Adjacent** → [[Savanna]] (w: 0.5)

## Incoming Connections
- **Biome Affinity** ← [[Energy]] (w: 0.8)
- **Biome Affinity** ← [[Entropy]] (w: 0.5)
- **Adjacent** ← [[Badlands]] (w: 0.8)
- **Adjacent** ← [[Volcanic]] (w: 0.5)
