---
tags: ["trait-scar", "generated"]
id: trait.scar.dragon-slayer
category: trait-scar
traitCategory: scar
validNodes: ["actor.individual", "actor.group"]
maxLevel: 1
visibility: public
effects: "{\"actionModifiers\":{\"reach.iron\":0.2,\"reach.star\":0.1}}"
acquisition: "{\"method\":\"event\",\"requires\":\"successful DELETE on dragon-type node\"}"
---

# Dragon-Slayer

> Slew a mighty dragon and bears the mark of that victory

## Properties
- **traitCategory**: scar
- **validNodes**: ["actor.individual","actor.group"]
- **maxLevel**: 1
- **visibility**: public
- **effects**: {"actionModifiers":{"reach.iron":0.2,"reach.star":0.1}}
- **acquisition**: {"method":"event","requires":"successful DELETE on dragon-type node"}

## Outgoing Connections
- **Boosts** → [[Iron]] (w: 0.2)
- **Boosts** → [[Star]] (w: 0.1)
