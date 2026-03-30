# The Fantasy World Simulator

## What This Is

A systemic god-game/rogue-lite narrative simulation built in React + TypeScript + Vite. The player is an Ascendant — a powerful former mortal — who guides a retinue of agents through a procedurally generated fantasy world. The hex map is the primary spatial interface; the game engine simulates faction ambitions, army-scale conflict, sphere-aligned magic, economic systems, and narrative encounters driven by agent decisions.

## Core Value

The world must **feel alive** — every hex, agent, faction, and location has a unique sphere character that determines its strengths, vulnerabilities, and magical potential. Player actions have cosmic consequences through the sphere pressure system.

## Current State (v1.0 shipped 2026-03-30)

**Codebase:** 1,055 TS/TSX files, 85,313 LOC, 485 test files
**Tech stack:** React 19 + TypeScript + Vite + Three.js (orthographic) + Tailwind CSS

**What's built:**
- Three.js hex map renderer (60K hexes, InstancedMesh, 4-tier zoom, fog of war, organic coastlines)
- Continuous-field world generation (27 biomes, rivers, elevation, fantasy overlay)
- Per-entity sphere affinity (8 spheres, pressure resolution, magic-as-sphere-fluency, World-Soul)
- Agent character sheet (5-tab layout, knowledge model, revelation discovery)
- Army-scale conflict (faction ambitions, battles, sieges, destruction, refugees)
- Monster encounters (lair escalation, sphere feedback, danger gradients)
- Threads panel (all graph-connected nodes in sidebar)
- MTG-style action cards (spell names, descriptions, particle bursts)
- Mercenary companies, encounter pipeline, auto-pause on encounters

## Requirements

### Validated

- ✓ Three.js hex map with InstancedMesh, zoom, fog, coastlines — v1.0
- ✓ 27-biome continuous world generation — v1.0
- ✓ Per-entity sphere affinity with pressure resolution and World-Soul — v1.0
- ✓ Agent character sheet with knowledge model — v1.0
- ✓ Army-scale conflict with battles, sieges, destruction — v1.0
- ✓ Monster encounters with lair escalation — v1.0
- ✓ Threads panel showing all connected nodes — v1.0
- ✓ Action feedback with spell names and particle effects — v1.0

### Active

See REQUIREMENTS.md for v1.1 milestone requirements.

## Current Milestone: v1.1 Low-Hanging Fruit Optimization

**Goal:** Fix correctness bugs, wire missing connections, tune performance, and improve code hygiene across the v1.0 codebase — targeting only small-to-medium effort items with high impact.

**Target features:**
- Fix determinism failures (unseeded Math.random, Date.now IDs)
- Wire stubbed connections (onFocusHex, avatar position, actor ID attribution)
- Tune encounter cache rebuild threshold
- Cache prose resolver output
- Extract DebugPanel sub-components (1774 lines)
- Code-split large data files
- Lodash audit and dedup

### Out of Scope

- **3D perspective camera** — rejected 2026-03-21. 2D orthographic only.
- **React Three Fiber** — direct Three.js for full InstancedMesh/render loop control.
- **Animated terrain** — performance budget. No continuous terrain animation.
- **Terrain blending** — hard edges per Tait style. Coastline mask is sole exception.
- **Mobile** — desktop viewport (1920×1080) only.

## Context

- v1.0 shipped in 33 days (2026-02-26 → 2026-03-30), 1,512 commits, 22 phases, 81 plans
- Next priority area likely Dynamic Economy (M3) — encounter↔economy feedback, trade routes, Gold+Stone CRUD
- Known gaps: RNDR-01 (formal 60fps benchmark), ELEV-04 (altitude labels, deferred)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Three.js Orthographic | 2D map beauty > 3D novelty | ✓ Good — 60K hexes performant |
| Continuous fields first, hex grid second | Organic coastlines, natural rivers | ✓ Good — beautiful terrain |
| Per-entity sphere affinity (not global-only) | Every entity has unique sphere character | ✓ Good — rich differentiation |
| Armies as actor nodes (not new node type) | Reuse graph infrastructure | ✓ Good — minimal new types |
| Lairs as location nodes (not new type) | Consistent with graph-everything principle | ✓ Good — divine targeting free |
| Magic = sphere fluency (no separate system) | Spheres ARE the magic system | ✓ Good — unified mechanics |
| MTG-style action cards | Rich feedback, spell identity | ✓ Good — cards feel meaningful |

## Constraints

- **Tech stack**: React 19 + TypeScript + Vite + Three.js (orthographic). No React Three Fiber.
- **Performance**: 60K hexes at 60fps. InstancedMesh, GPU instancing, frustum culling.
- **Determinism**: Seeded PRNG everywhere. Same seed = same world.
- **Viewport**: 1920×1080. Nothing scrolls below fold.
- **NFPs**: Tunability > Inspectability > Determinism > Fail-soft > Narrative > Additive > Performance budget.

---
*Last updated: 2026-03-30 after v1.1 milestone initialization*
