---
name: state-of-game-design/cosmology
description: >
  Cosmology reference for The Fantasy World Simulator: Reaches, Spheres, scales,
  actor types, Hex Chronicle layers, and game design direction principles.
  Load for content authoring, encounter design, cosmology work, or prose that
  references Sphere/Reach combinations.
last_validated_against: 2026-05-16
---

# Cosmology & Game Design Direction

## Game Design Direction (Experiential Compass)

**Read `Docs/plans/2026-04-16-game-design-direction.md` before any design or content work.** That document defines what Threadbearer is supposed to *feel like* to play. This shard covers the mechanical foundations — reaches, spheres, actor types. The game design direction covers the experiential foundations — what the player does, how they feel, and what makes moments matter. Both are required context.

**Core principles (summary — read the full doc for depth):**

**The core fantasy:** You are a nascent god who discovers interesting mortals, follows their stories like a living novel, and shapes their arcs through subtle divine intervention.

**The three-beat core loop** (every play session):
1. **Portfolio scan** — "How are my people doing?" Read protagonist states at a glance via emotional/iconic signals + human-textured prose.
2. **Curated moment** — The game identifies emotionally significant encounters and pulls the player in for branching decision-making under uncertainty.
3. **Aftermath** — Resolution reshapes the protagonist's trajectory. Failure is not a loss state — it's a story turn.

**Six principles every feature and content piece must satisfy:**
1. **Emotional read at every level** — the player understands state through human conditions (alone, ashamed, triumphant), not numbers.
2. **Genuine dilemmas** — choices where there's no obviously right answer and the "best" option depends on understanding the protagonist.
3. **Cool failure** — every failure state produces narrative texture that makes the next chapter more interesting. Failure is plot, not punishment.
4. **Turn-based pacing** — each tick is a turn the player controls. Features must work in quick turns (scan and advance) AND deep turns (stop and engage).
5. **Prose carries narrative, UI carries status** — mechanics are communicated through story, never through exposed numbers.
6. **Content is design** — authored prose, encounter templates, and complication moments are not implementation details. They ARE the player experience.

**Anti-patterns to avoid:** Six new actions listed without dilemmas, engine-first design without player experience scenarios, binary succeed/fail outcomes, mechanical surfaces instead of emotional reads, isolated systems, missing UI vision.

**Design quality gate:** `Docs/plans/2026-04-16-design-quality-gate.md` — 9-section checklist required before any player-facing feature moves to Implementation Planning.

---

## The Two Orthogonal Axes — Reaches × Spheres

Every action in the world is described by two independent dimensions.

**Reaches = What You Do** (activity categories). Eight domains covering every type of action:

| Reach | Theme | God-Scale |
|-------|-------|-----------|
| **Iron** | Force, destruction, protection, dominance | Cataclysm, annihilation, wrath |
| **Gold** | Wealth, craft, industry, trade | Shape abundance, blight, plenty |
| **Shadow** | Deception, persuasion, intrigue | Fate-weaving, hidden influence |
| **Veil** | Spells, rituals, sphere channeling | Sphere dominion, cosmic magic |
| **Heart** | Bonds, love, loyalty, inspiration, culture | Universal love, binding oath |
| **Eye** | Perception, understanding, memory, truth | Omniscience, deep memory, oracle |
| **Stone** | Building, shaping land, territory, travel | Terraform, reshape landscape |
| **Star** | Faith, devotion, divine connection, transcendence | Divine communion, cosmic pact |

Each Reach operates at four scales: **Individual** → **Group** → **Faction** → **God**.

Agent competence per-Reach is computed via the **Domain Capability** system: sigmoid curve over trait contributions → 10-tier narrative lexicon (e.g., Iron tier 5 = "Steeled", Veil tier 7 = "Arcane").

**Spheres = What Fuels It** (cosmic energies). Threads that power activities, making some easier, others harder.

Foundation Spheres (2 opposed pairs — cosmic structure): **Chaos ↔ Order**, **Light ↔ Darkness**
Creation Spheres (8 independent — domains of existence): **Force**, **Matter**, **Energy**, **Life**, **Mind**, **Spirit**, **Time**, **Entropy**

No inherent alignment — context determines expression. Entropy is freedom and dissolution, not evil. Life is growth and mutation, not goodness.

**They combine freely.** The same Reach fueled by different Spheres produces fundamentally different actions:

| Reach | + Life | + Entropy | + Mind |
|-------|--------|-----------|--------|
| **Iron** | Rally living troops | Raise undead soldiers | Dominate enemy's will to fight |
| **Veil** | Growth ritual | Decay curse | Psychic ward |
| **Shadow** | Covert healer network | Poisoner's guild | Psychic espionage |

Canonical Obsidian reference: `TheFantasyWorldSimulator/Cosmology/Spheres and Reaches.md`

**Cultural naming:** Each culture names the same Reaches differently. The Aurelian Empire calls Iron "Imperium"; the Warrens goblins call it "Smash". These naming differences ARE worldbuilding — they encode what a culture values and despises without exposition.

---

## Actor Types

Six types as graph node categories (not a strict hierarchy):

| Type | Natural Scale | Role |
|------|--------------|------|
| **God / Primordial** | Cosmic → Regional | Creation myths, divine edicts |
| **Ascendant / Demigod** | Regional → Local | The player (and rivals). Subtle manipulation, indirect influence |
| **Faction / Organization** | Regional → Local | Doctrine, expansion, institutional ambition |
| **Culture / Nation** | Regional | Civilizational momentum, migration, identity |
| **Group / Party** | Local → Personal | Adventure arcs, fellowship, small-band purpose |
| **Individual** | Local → Personal | Personal destiny, moral dilemma |

Scale is a property, not a constraint. A peasant *could* attempt "Overthrow a Kingdom" — near-zero probability without the right graph edges. But with `inspires → rebel group → allies_with → rival faction → supported_by → Ascendant`... revolution.

**Ascendants use the same systems as agents.** Domain Capability tiers, sphere alignment, prerequisite checks — all apply equally. Ascendants are powerful former mortals, not a special-cased entity type. Power level is tunable, not structurally different.

---

## Hex Chronicle Layers

The hex detail view has 4 narrative layers, each an action target context:

- **The Land** — terrain, biome, resources, divineInfluence, corruption
- **The Soul** — sphere influence, magical saturation, leylines
- **The People** — cultures, factions, agents, encounters, locations
- **The Ruins** — historical culture, archaeology, exploration hooks (context-gated: only where historical culture exists)

---

## Relevant References

| What | Where |
|------|-------|
| Spheres and Reaches deep-dive | `TheFantasyWorldSimulator/Cosmology/Spheres and Reaches.md` via Obsidian MCP |
| Cosmology canon page | `Docs/canon/cosmology.md` |
| Encounter canon page | `Docs/canon/encounters.md` |
| Game design direction (full) | `Docs/plans/2026-04-16-game-design-direction.md` |
| Design quality gate | `Docs/plans/2026-04-16-design-quality-gate.md` |
| Domain Capability design | `Docs/plans/2026-03-04-disc13-domain-capability-and-resolution-design.md` |
