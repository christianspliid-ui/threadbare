# Ardenmor Keep — Location Asset Package

## Lore Text

They built it to last. The walls are twelve feet of grey basalt fused with Force threads so old they have sunk into the stone itself, visible only as faint crimson veins pulsing when the wind changes. Ardenmor has been sacked four times and rebuilt three — the fourth sacking left it in the hands of whoever was strong enough to hold it. Now it broods on its hilltop like a scarred old warlord, watching the passes. The garrison swears the keep remembers its enemies. That the gates close a heartbeat faster when old bloodlines approach.

## Concept Art

`ardenmor-keep-concept.png` — 16:9 mid-distance establishing shot. ✅ Generated.
Massive dark basalt fortress on a hill, weathered and battle-scarred, multiple curtain walls and a central tower. Faint crimson Force threads (#ff4444) running through the stone like veins — sharp directional streaks, impact radiants at stress points, shockwave arcs where walls have been breached and rebuilt. Amber-gold Order threads (#d4af37) in geometric tessellation along intact structural elements. 85-95% dark world, 5-15% concentrated magic.

## Hex Overlay

`ardenmor-keep-hex.png` — 1:1 icon for hex map. ✅ Generated.
Fortress silhouette — crenellated wall and central tower on a hilltop. Faint crimson Force thread veins in the stonework, sharp directional streaks. Designed for 48-64px display.

## Game Logic

### Sphere Biases
| Sphere | Bias | Role |
|--------|------|------|
| **Force** | 0.70 | Primary — warfare, military power, structural resilience |
| **Matter** | 0.45 | Secondary — stone, fortification, enduring construction |
| **Order** | 0.35 | Tertiary — military discipline, hierarchy, law |

### Available Actions
| Action | Reach | Description |
|--------|-------|-------------|
| **Garrison** | Iron | Station troops; increases local defense modifier |
| **Fortify** | Stone | Repair/improve walls; requires Matter-capable agents |
| **Command** | Iron | Issue military orders to agents in surrounding hexes |
| **Scout** | Eye | Observe approaching forces; high visibility from hilltop |
| **Hold Court** | Heart | Resolve disputes; settlement governance actions |

### Agent Attraction Rules
- Agents with high **Iron** or **Force** domain capability are drawn to Ardenmor
- Warlord and soldier archetypes prefer this location
- Factions with military orientation will contest control
- Agents with high **Gold** domain avoid — no trade value, too martial

### Resource Generation
- **High:** Military supplies, defensible position, garrison capacity
- **Medium:** Prestige (controlling Ardenmor signals strength), local governance
- **Low:** Trade goods, food production, magical resources

### Sub-Location Slots
| Sub-Location | Type | Description |
|-------------|------|-------------|
| **The Great Hall** | Social | Court, feasting, oaths of fealty |
| **The Armoury** | Military | Weapon stores, smithing, equipment |
| **The Watch Tower** | Intelligence | Surveillance, scout reports, signal fires |
| **The Crypts** | Memorial | Former lords buried here; echo-resonant |

### Narrative Hooks
- Who controls Ardenmor controls the passes — strategic chokepoint
- The keep "remembers" — Force threads in the walls react to old bloodlines (mechanical: agents with ancestor-of edges to previous holders get +10% Iron in this location)
- Fourth sacking never fully repaired — structural weakness on the eastern wall (can be exploited or fortified)
- Crypt beneath holds echo-fragments of past commanders

### Narrative Vocabulary Tags
```
atmosphere: ["martial", "brooding", "scarred", "defiant", "watchful"]
sounds: ["wind through battlements", "clinking chain", "distant horn", "stone groaning", "boots on flagstone"]
textures: ["rough basalt", "cold iron", "cracked mortar", "worn leather", "polished steel"]
colors: ["basalt-grey", "iron-black", "crimson-vein", "torch-amber", "banner-dark"]
threats: ["siege", "betrayal from within", "structural collapse", "haunted crypts", "rival claimant"]
```
