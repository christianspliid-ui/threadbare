---
tags: ["trait-innate", "generated"]
id: trait.innate.seafaring
category: trait-innate
traitCategory: innate
validNodes: ["actor.culture", "actor.group", "actor.faction"]
maxLevel: 1
visibility: public
effects: "{\"actionModifiers\":{\"reach.gold\":0.1,\"reach.iron\":0.1}}"
acquisition: "{\"method\":\"threshold\",\"requires\":\"coastal territory >40%\"}"
---

# Seafaring

> Master of ocean navigation and maritime life

## Properties
- **traitCategory**: innate
- **validNodes**: ["actor.culture","actor.group","actor.faction"]
- **maxLevel**: 1
- **visibility**: public
- **effects**: {"actionModifiers":{"reach.gold":0.1,"reach.iron":0.1}}
- **acquisition**: {"method":"threshold","requires":"coastal territory >40%"}

## Outgoing Connections
- **Boosts** → [[Gold]] (w: 0.1)
- **Boosts** → [[Iron]] (w: 0.1)
