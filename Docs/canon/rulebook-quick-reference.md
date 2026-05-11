---
domain: rulebook
last_reviewed: 2026-05-11
reviewer: cowork
ul_shards: [Cosmology, Agents, Encounters, Prose, Graph]
status: live
companion_of: rulebook.md
---

# Rulebook — Quick Reference

> The board-game reference card. **Current rules only** — no status flags, no caveats. For "is this real yet?" load the full [rulebook](rulebook.md). For *why*, load Vision. For terms, load UL.

## What You Are

You are an **Ascendant** — a transcended mortal. You watch the world from a height. You spend sphere-typed essence. You shift probabilities on mortals you have threads to. You do not direct-control characters. The game asks one question per run: *what kind of god are you?*

## What the World Is

A procedurally generated hex map. Hexes are mutable state (not graph nodes). Everything else — actors, locations, sublocations, factions, cultures, artifacts, traits — is a graph node connected by typed edges. Agents pursue their own goals through a Maslow needs pipeline. Above the cycle: a **Doom Clock** ticking toward an Unmaking. Beneath it: a **World-Soul** carrying echoes from prior cycles.

## The Three-Beat Turn

**Scan → Curated Moment → Aftermath.** Each tick is two in-world hours; 12 ticks per day. The world advances only when you say so. Order is load-bearing: scan means you chose to look; encounter is the chapter; aftermath is the breath before the next scan.

## What You Can Do

Five verbs: **Create, Find, Change, Destroy, Control**. Control is the god-game signature — sustained commitment with ongoing cost, contestable by rivals. *You can't Update what you haven't Read* — Find gates Change/Control.

Every detail view becomes an **action target**. The ActionDrawer fills with templates filtered for that target. Each template can require two orthogonal checks: a **Reach prerequisite** (Domain Capability tier) and a **Sphere prerequisite** (sphere alignment). Both optional per template. Prerequisites also gate visibility.

## The Cosmology

**Eight Reaches** (what you do): Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star.

**Twelve Spheres** (what fuels it):
- *Foundation:* Chaos ↔ Order, Light ↔ Darkness
- *Creation:* Force ↔ Mind, Matter ↔ Time, Energy ↔ Spirit, Life ↔ Entropy

Reaches and Spheres are **orthogonal**. The same Reach at different Sphere alignments produces different narrative textures. Quintessence is a separate meta-property (narrative centrality / threadbare-ness), **not** a ninth Reach.

## Your Resources

- **Influence Essence** — per-sphere pools. Regenerates from worshippers / places of power / portfolio depth. Spent on actions, sustained on Control.
- **Control slots** — sustained-effect cap, scales with Domain Capability tier.
- **Influence Tiers** — depth of a thread (0–4 in code; six narrative names in design).
- **Court positions** — `the_first`, `retinue`, `watched`, `dormant`.
- **Stealth** — detection profile against two audiences: mortals (whose disbelief turns to faith) and rival gods (who scan for divine signatures).

The two-way thread: you intervene; the mortal responds. The response is part of the texture.

## Encounters

A **curated chapter**, not a flat roll. Two pipelines, one format (`UnifiedActionTemplate`): authored *branching* encounters and systemic *linear template* encounters. Encounter awareness is **hex-granular** — if you see the hex, you see everything on it.

Resolution: **sigmoid → d100**, unified. No alternative dice.

Four design rules: (1) Path over adjective. (2) Moral axis is structural — each Reach maps to an archetype-pair (Iron: Protector ↔ Conqueror, etc.). (3) Verbs are encounter-specific, soft-power flavoured. (4) Every primitive is clickable.

**Failure is plot, not punishment.** Aftermath reshapes the protagonist's trajectory; it always produces narrative texture.

## The Clocks and the Ending

Two clocks pressure the run. **Doom** (7 archetypes × 5 stages: Whispers, Signs, Tremors, Crisis, Culmination) ticks toward an Unmaking. **Victory Mandate** (3 stages, graph-state win) runs in parallel. They pressure each other — essence spent on one is essence not spent on the other.

Either clock ending triggers the **Twilight Phase**: the run's closing chapter, harvested into Echoes (Legacy / Monument / Relic) that feed the **World-Soul** and shape the next cycle.

The game is not, structurally, about winning. It is about what kind of being you chose to be toward a world you could not save unconditionally.

---

For the full rulebook (with status flags, source citations, and open questions): [rulebook.md](rulebook.md).
For terms: [Ubiquitous Language index](../ubiquitous-language/README.md).
For why: [Vision/](../../TheFantasyWorldSimulator/Vision/) (Obsidian vault).
