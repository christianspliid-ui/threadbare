---
name: content-worldbuilding
description: >
  Use when working with content packages, graph data, world-model.json, constraint layers,
  or any content-authoring pipeline. Triggers on "content package", "graph node", "graph edge",
  "world model", "constraint layer", "category", "World-Soul", "rival gods",
  or when designing new game content or narrative systems.
---

# Content & Worldbuilding — Domain Context

> **Prerequisite:** Load `state-of-game-design` first for foundational context.

This skill provides the content system and worldbuilding context. Load this before working on content packages, graph data, narrative systems, or anything touching the game's fictional universe.

## Cosmology

> Covered by `state-of-game-design`. Load that skill first.
> For the canonical reference: Obsidian → `TheFantasyWorldSimulator/Cosmology/Spheres and Reaches.md`

## Action Verbs (5)
Actions decompose into 5 verbs, mapped to CRUD:
- **Create** → `create` — bring something into existence
- **Find** → `read` — perceive, search, reveal
- **Change** → `update` (one-time) — modify once for a one-time cost
- **Destroy** → `delete` — remove, corrupt, scatter
- **Control** → `update` (sustained) — ongoing commitment requiring continuous resources, focus, or stability

## Hex Chronicle Layers (Action Contexts)
The hex detail view has 4 narrative layers, each a target context for actions:
- **The Land** — terrain, biome, resources, divineInfluence, corruption
- **The Soul** — sphere influence, magical saturation, leylines
- **The People** — cultures, factions, agents, encounters, locations
- **The Ruins** — historical culture, archaeology, exploration hooks (context-gated: only on hexes with historical culture)

## Actor Prerequisites (Two-Axis)
Actions are gated by two orthogonal prerequisite checks:
- **Reach prerequisite** — Domain Capability tier in the relevant Reach (competence gate)
- **Sphere prerequisite** — sphere alignment match (alignment gate)
Ascendants use the same prerequisite system as agents. No special-casing.

## Content Generation Pipeline

Content is **generated-within-constraints**, never freeform:

1. **Schema constraints** — structural validity (required fields, type shapes)
2. **Tonal constraints** — matches the World-Soul's current Foundation bias
3. **Balance constraints** — mechanical fairness within acceptable bounds
4. **Coherence constraints** — narrative consistency with existing world state

Player iteration options: regenerate, lock+regenerate, edit, parameter nudge. Players cannot directly change mechanical values.

## Graph Data Model

> Graph-first principle covered by `state-of-game-design`. Load that skill first.

Current stats: 244 nodes, 371 typed edges, 18 categories, 19 content packages.

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

## Design Assessment for Content & Systems

New game systems, content pipelines, or world-model extensions must pass an architectural assessment before implementation. This applies to economy, faction behavior, encounter sets, resource pipelines, new Reach mechanics, and any system that agents interact with.

### Content-specific NFP checklist

| NFP | What to verify for content/system work |
|-----|---------------------------------------|
| Tunability | Spawn thresholds, tier boundaries, probability weights, cost tables — all named constants. If a designer might want to tweak it, it's a constant. |
| Inspectability | New systems that modify agent state (wealth, reputation, traits) must emit traces showing the cause. "Why did this agent become wealthy?" must be answerable from traces alone. |
| Determinism | World seeding additions (new faction types, resource assignment, guild generation) use the seeded PRNG. Content selection at runtime (encounter choice, sublocation spawn) uses PRNG. |
| Fail-soft | Missing content gracefully skips — no content package should be able to crash the tick loop. Missing resources → 0 income. Missing faction → skip guild check. |
| Narrative > mechanical | Systems exist to generate stories. If a system produces mechanically correct but narratively boring outcomes, redesign the system. Encounters should read as interesting, not optimal. |
| Additive | New node properties, new edge properties, new action templates, new encounter templates — all additive. Don't remove or rename existing content that other systems reference. |
| Graph compliance | All new state lives on graph nodes (properties) or edges (properties). No parallel data structures, no separate lookup tables. The graph is the single source of truth. |

### Design document template for new game systems

When proposing a new system, include these sections **per system** (NFP compliance is inline, not a separate appendix):

1. **What it is** — plain language, one paragraph
2. **Graph representation** — which nodes, edges, properties
3. **Constants** — every tunable number named with default and purpose (NFP #1)
4. **Tick behavior** — what happens each tick (if anything)
5. **Tracing** — TypeScript trace interfaces for all emitted traces (NFP #2)
6. **Fail-soft** — table of failure cases and fallback behavior (NFP #4)
7. **Actions** — what agents can do (CRUD mapping), with PRNG callouts where needed (NFP #3)
8. **Player visibility** — how the player experiences it (prose, encounters, location changes)

At the **end of the full design document**, include:

9. **NFP Compliance Summary** — one-row-per-priority verdict table (PASS / PASS with note)
10. **Implementation phases** — ordered by dependency, each phase delivers visible value

The design is not ready to present until the compliance summary shows all PASS. If a genuine trade-off exists, flag it explicitly for the user to decide.
