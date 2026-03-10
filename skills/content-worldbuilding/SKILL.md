---
name: content-worldbuilding
description: >
  Use when working with the cosmology, sphere system, Nine Reaches, content packages,
  graph data, world-model.json, or any content-authoring pipeline. Triggers on "sphere",
  "cosmology", "reach", "Foundation", "Creation", "World-Soul", "content package",
  "graph node", "graph edge", "world model", "constraint layer", "category",
  or when designing new game content or narrative systems.
---

# Content & Worldbuilding — Domain Context

This skill provides the cosmology, content system, and worldbuilding context. Load this before working on content packages, graph data, narrative systems, or anything touching the game's fictional universe.

## Cosmology

Three orthogonal dimensions define the world:

### Foundation Spheres (2 opposed pairs)
- **Chaos ↔ Order** — cosmic structure
- **Light ↔ Darkness** — cosmic illumination

These set the cosmic tone and bias the World-Soul. They are the player's initial god-creation choice.

### Creation Spheres (8 independent)
Force, Matter, Energy, Life, Mind, Spirit, Time, Entropy.

Context determines expression — no inherent alignment. A Creation Sphere is neither good nor evil; its meaning emerges from how it interacts with Foundation Spheres and the narrative situation.

### Nine Reaches (action domains)
Every CRUD action template maps to a Reach:

| Reach | Domain | Examples |
|-------|--------|----------|
| Iron | Warfare | Combat, conquest, defense |
| Gold | Trade | Commerce, negotiation, wealth |
| Shadow | Stealth | Espionage, subterfuge, theft |
| Veil | Magic | Spellcraft, enchantment, rituals |
| Heart | Social | Diplomacy, persuasion, bonds |
| Eye | Knowledge | Research, divination, secrets |
| Stone | Construction | Building, crafting, fortification |
| Star | Navigation/Fate | Exploration, prophecy, destiny |
| Flesh | Biology | Healing, mutation, growth |

## Content Generation Pipeline

Content is **generated-within-constraints**, never freeform:

1. **Schema constraints** — structural validity (required fields, type shapes)
2. **Tonal constraints** — matches the World-Soul's current Foundation bias
3. **Balance constraints** — mechanical fairness within acceptable bounds
4. **Coherence constraints** — narrative consistency with existing world state

Player iteration options: regenerate, lock+regenerate, edit, parameter nudge. Players cannot directly change mechanical values.

## Graph Data Model

- All entities (actors, locations, objects, traits) are **graph nodes**
- All relationships are **typed edges**
- No separate relational tables
- Current stats: 198 nodes, 290 typed edges, 18 categories, 18 content packages

`world-model.json` is the canonical data file. Validate with `npm run validate-model`.

## World-Soul & Metaprogression

- **Fundament:** Coefficient ledger that persists across cycles. Biases world generation.
- **Resonance:** Memory fragments from previous cycles. Narrative echoes.
- **Echoes:** Player-facing selection mechanism for choosing which memories carry forward.

## Rival Gods

Generated, not fixed. 2-4 per run, derived from:
- Current World-Soul state
- Player's sphere choices
- Tension with existing narrative themes

## Key Files

- `world-model.json` — canonical graph data
- Obsidian vault (`TheFantasyWorldSimulator/`) — system specs with wikilinks, read `Index.md` first
- `Docs/plans/` — design rationale documents
- `src/engine/` — content generation and constraint system code
