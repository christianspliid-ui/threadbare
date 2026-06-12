---
name: state-of-game-design
description: >
  Router for The Fantasy World Simulator game design context. Load this first,
  then follow the routing table to pull in the one or two reference shards your
  task actually needs. Replaces the monolithic SKILL.md with a thin router +
  on-demand shards pattern (THR-377).
last_validated_against: 2026-06-11
---

# State of the Game Design — Router

> **The Fantasy World Simulator** — A systemic god-game / rogue-lite narrative simulation.
> The player is an Ascendant (a former mortal turned demigod) shaping a procedurally generated fantasy world through indirect influence, divine interventions, and sustained control — all while a Doom Clock ticks toward the Unmaking.

**Always (first read):**
- [`Docs/design-brief.md`](../../../Docs/design-brief.md) — ≤2-page orientation; read before any shard or canon page

**Always-load companions:**
- [`Docs/canon/rulebook-quick-reference.md`](../../../Docs/canon/rulebook-quick-reference.md) — board-game card (~80 lines, always-load)
- `TheFantasyWorldSimulator/Index.md` via Obsidian MCP — vault navigation

**Agent-domain cross-reference:** For actor/agent/faction/Ascendant/thread/archetype questions, read `Docs/canon/agents.md` as Step 0 before domain implementation.

---

## Which shard to load

| Task type | Load this shard | Plus canon page |
|-----------|----------------|----------------|
| Encounter / content / cosmology / prose | `reference/cosmology.md` | `Docs/canon/encounters.md` + `Docs/canon/cosmology.md` |
| Engine / tick / resolution / PRNG | `reference/verbs-resolution.md` | (none specific) |
| Plan-doc authoring / audit / governance | `reference/architectural-decisions.md` | `Docs/canon/process.md` |
| Proposing a pattern that might be rejected | `reference/deprecated.md` | (always check before proposing) |
| Prose / vignette / enrichment | `reference/cosmology.md` (Sphere/Reach refs) | `Docs/canon/prose.md` |
| Hex map / HexMapV2 / Three.js | (router orientation only) | `Docs/canon/hex-map.md` |

Multi-domain tasks load multiple shards (e.g., an encounter touching resolution → `cosmology.md` + `verbs-resolution.md`).

---

## Canon pages (per-domain entrypoints)

| Domain | Canon page |
|--------|-----------|
| Rules of play | `Docs/canon/rulebook.md` (full) · `Docs/canon/rulebook-quick-reference.md` (always-load) |
| Encounters | `Docs/canon/encounters.md` |
| Cosmology (Reaches, Spheres) | `Docs/canon/cosmology.md` |
| Process / governance | `Docs/canon/process.md` |
| Prose / vignettes | `Docs/canon/prose.md` |
| Hex map / HexMapV2 | `Docs/canon/hex-map.md` |
| Agents | `Docs/canon/agents.md` |

Canon pages are the per-domain entrypoints — they list current spec pointers and stale sources to avoid. They do NOT duplicate shard content.

---

## Domain skills (after this router)

| Domain | Skill | When |
|--------|-------|------|
| Engine code | `engine-architecture` | Tick loop, tracing, resolution, PRNG, graph ops |
| Frontend & UI | `frontend-ui` | Components, styling, layout, design system tokens |
| Content & worldbuilding | `content-worldbuilding` | Content packages, graph data, constraint layers |
| Art direction | `art-direction` | Hex tiles, prompt construction, Threadbare aesthetic |
| Creative prose & content | `cw-*` (platform) | Brainstorming, prose drafting, wiki docs, critique |
| Post-implementation docs | `gamedocumenter` | Linear/Obsidian/changelog updates |
| Image manipulation | `image-manipulation` | Geometric clipping, alpha masks, hex pipeline |
| QA sweeps | `qa-orchestrator` | Systematic UI/UX/frontend QA |
