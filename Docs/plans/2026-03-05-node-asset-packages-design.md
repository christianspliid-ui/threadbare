# Node Asset Package System — Design Document

**Date:** 2026-03-05
**Purpose:** Define a standardized "asset package" for every visually-surfaced node type in the game, inspired by Endless Legend's anomaly system (lore + art + icon + game logic per entity).

---

## Inspiration: Endless Legend Anomalies

Endless Legend treats hex anomalies as complete content units. Each anomaly has:
- **Flavor text** — evocative description grounding the anomaly in the world
- **Concept art** — a painted illustration showing what it looks like up close
- **Hex overlay** — a small icon visible on the strategic hex map at zoom-out
- **Game effects** — FIDSI bonuses, strategic value, terrain interactions

We adapt this pattern for all node types in Threadbare, tailored to each type's role.

---

## The Six Node Types

### 1. Biomes (22 types)

The terrain itself. What you see on every hex.

| Component | Spec |
|-----------|------|
| **Lore text** | 2-4 sentences. Atmospheric, Threadbare voice. What does it feel like? What do travelers whisper? Dramatic present tense. |
| **Concept art** | 16:9 painting. Dark Threadbare style (10-40% brightness world). Magic threads in biome's affinity sphere colors breaking through. God's-eye or wide establishing shot. |
| **Hex overlay** | 1:1, 48-64px target. Simplified biome silhouette on dark background. Subtle affinity-color thread accent. Must read clearly at small size. |
| **Game logic** | Sphere affinities (from Obsidian notes), Reach domain modifiers, resource spawn tendencies, agent behavior effects, narrative vocabulary tags. |

**Prototype examples:** Volcanic, Jungle, Glacier

### 2. Locations (named places)

Points of interest on the hex map. Closest to EL anomalies.

| Component | Spec |
|-----------|------|
| **Lore text** | 3-5 sentences. History, mystery, atmosphere. Who built this? What happened here? What power lingers? |
| **Concept art** | 16:9 painting. The location itself in Threadbare style. Architecture/geography + magic threads in the location's sphere bias colors. Mid-distance perspective. |
| **Hex overlay** | 1:1, 48-64px. Architectural or geographic silhouette. Distinct from biome icons — locations are man-made or magically altered. |
| **Game logic** | Sphere biases, available actions, agent attraction rules, resource generation, sub-location slots, narrative hooks. |

**Prototype examples:** Ardenmor Keep, The Sunken Library, Wraithwood

### 3. Artifacts (items of power)

Objects that actors possess or bond with.

| Component | Spec |
|-----------|------|
| **Lore text** | 2-4 sentences. Origin story, what it does to its bearer, what legends surround it. |
| **Concept art** | 3:4 portrait. The object itself, dramatic lighting, sphere-colored threads emanating from or woven into it. Close-up, still-life composition. |
| **Hex overlay** | 1:1, 32px. Simplified object silhouette with sphere glow. For inventory/map markers. |
| **Game logic** | Sphere affinity, trait contributions to sigmoid pool, legendary vs common, echo potential, bonding requirements. |

**Prototype examples:** The Crown of Echoes, Griefender, The Lantern of Stars

### 4. Factions (organized groups)

Political/cultural entities that control territory and pursue agendas.

| Component | Spec |
|-----------|------|
| **Lore text** | 3-5 sentences. Founding ethos, what they believe, what they fight for, how outsiders see them. |
| **Concept art** | 16:9. The faction in their element — a scene showing their values in action. Banner/heraldic elements. Dark Threadbare style with faction's sphere-tinted magic. |
| **Hex overlay** | 1:1, 32px. Heraldic badge/symbol. Must be recognizable as THIS faction at small size. Faction identity color. |
| **Game logic** | Axiological profile tendencies, domain strengths, cultural traits, territory preferences, rival/ally tendencies. |

**Prototype examples:** The Iron Covenant, The Verdant Circle, The Ashen Hand

### 5. Actor Archetypes (character types)

Individual character templates that seed world population.

| Component | Spec |
|-----------|------|
| **Lore text** | 2-3 sentences. Who is this archetype? What drives them? What role do they play in the world? |
| **Concept art** | 3:4 portrait. Character portrait in Threadbare style — partially woven from magic threads, emerging from darkness. Mid-close composition. |
| **Hex overlay** | 1:1, 32px. Portrait thumbnail — simplified face/silhouette with dominant trait visual cue. |
| **Game logic** | Typical domain capability distribution, axiological profile tendencies, Maslow layer priorities, trait affinities. |

**Prototype examples:** Warlord, Scholar, Hedge-Priest

### 6. Doom Archetypes (world-ending threats)

The 7 apocalyptic scenarios that end each cycle.

| Component | Spec |
|-----------|------|
| **Lore text** | 3-4 sentences. Prophetic/apocalyptic voice. What the world sees as the doom approaches. Escalating dread. |
| **Concept art** | 16:9 painting. The doom in progress — the world breaking/transforming/ending in this archetype's specific way. Maximum visual drama. All relevant sphere colors active. |
| **Hex overlay** | 1:1, 32px. DoomBar icon — symbolic representation of this doom type. Must be distinct from other doom icons at small size. |
| **Game logic** | Escalation stages, tick ranges, sphere interactions, rival god relationships, Unmaking visual effects, World-Soul impact. |

**Prototype examples:** Breach, Convergence, Reckoning

---

## Production Order

1. **Biomes** (3) — proves format, transforms hex map immediately
2. **Locations** (3) — closest to EL anomalies, tests narrative depth
3. **Artifacts** (3) — tests portrait/still-life composition at 3:4
4. **Factions** (3) — tests heraldic/scene composition
5. **Actors** (3) — tests character portraits
6. **Doom** (3) — tests apocalyptic/epic scale

After all 18 prototypes: evaluate which formats work, refine, then plan full production run.

---

## File Organization

```
Assets/
  biomes/
    volcanic/
      volcanic-concept.png      (16:9 concept art)
      volcanic-hex.png           (1:1 hex overlay icon)
      volcanic-package.md        (lore + game logic)
    jungle/
    glacier/
  locations/
    ardenmor-keep/
    sunken-library/
    wraithwood/
  artifacts/
  factions/
  actors/
  doom/
```

## Art Direction (all types)

All art follows STYLE.md — dark world (10-40% brightness), concentrated magic threads (5-15% area, 70-100% brightness), painterly oil painting, no UI/text/modern elements. Each package's art should make the sphere affinities visually obvious through the thread colors and form language.
