---
name: state-of-game-design/architectural-decisions
description: >
  Architectural and systems reference for The Fantasy World Simulator: load-bearing
  decisions, NFP priorities, all major systems, and how they connect. Load for
  plan-doc authoring, audit work, governance work, or any task where you need to
  understand how the systems interrelate.
last_validated_against: 2026-05-16
---

# Architectural Decisions & Systems Reference

## Non-Functional Priorities (in order)

When in tension, higher priorities win.

1. **Tunability** — Every magic number is a named constant. Changing game feel = changing a number.
2. **Inspectability** — Trace *why* something happened. Flat state, pure functions, causal event trails.
3. **Determinism** — Seeded PRNG everywhere. Same seed + same inputs = same outputs.
4. **Fail-soft** — The tick loop must never crash. Missing data → graceful fallback.
5. **Narrative over mechanical perfection** — When mechanics and story diverge, lean toward story.
6. **Additive over destructive changes** — Add new fields/functions; don't rewrite.
7. **Performance budget, not premature optimization** — Profile before optimizing.

---

## Architectural Decisions (Settled — Do Not Revisit)

- **Everything is a graph node/edge.** No separate relational tables.
- **Reaches and Spheres are orthogonal axes.** Neither subsumes the other. They combine freely.
- **Ascendants use the same prerequisite system as agents.** No special-casing.
- **Hexes are NOT graph nodes.** They live in `GameState.tiles[]`, mutated via `HexMutation`.
- **Content is generated-within-constraints.** Never freeform, never pure LLM. Player iterates within bounds.
- **Maslow pipeline for agent AI.** No utility functions, no behaviour trees.
- **Sigmoid → d100 for resolution.** One system, no special cases.
- **Agent position is a three-tier model: hex → location → sublocation.** A single `located_at` edge to the most specific node. Resolution upward via parentLocationId → hexCol/hexRow.
- **Encounter awareness is hex-granular.** Hex distance (not location-hop BFS) determines awareness. Cross-hex visibility computed via per-reach awareness hops.
- **The world graph is mutated in place.** Never depend on graph object identity for change detection. Use `touchWorld()` / `touchStructure()` version counters.
- **Engine caches must be owned per session, not stored at module scope.** Module-level singletons persist across game sessions; use `SimulationRuntime` scoped to the current playthrough.
- **The distance matrix caps indexed locations at `MAX_DISTANCE_MATRIX_SIZE` (1200).** Covers all supported presets (`large` ~584, `epic` ~805).

> **Canonical source:** CLAUDE.md § "Load-Bearing Architectural Decisions" is the primary ledger. This shard mirrors the settled subset; if they diverge, CLAUDE.md wins.

---

## Major Systems

### The World Graph

**Everything is a graph node/edge.** No separate relational tables. This is the foundational architectural decision.

- All entities (actors, locations, objects, traits) are graph nodes
- All relationships are typed edges with properties
- `world-model.json` is the canonical data file
- Current: 244 nodes, 371 typed edges, 18 categories, 19 content packages

**Exception:** Hexes are NOT graph nodes. They live in `GameState.tiles[]` indexed by coordinate. Hex actions produce `HexMutation[]` instead of `GraphOp[]`.

### The Control Mechanic (Design Phase)

**Control slots:** Limited number, scaling with Domain Capability tier.

**Three sustain models (can combine):**
1. **Essence drain** — continuous per-tick cost
2. **State threshold** — world condition must hold (e.g., hex corruption ≥ 0.5)
3. **Ritual investment** — upfront essence + ticks, self-sustaining if threshold holds

**Contestation:** Active control effects spawn visible encounter nodes. Only agents/ascendants who meet prerequisite thresholds can see and contest them. Rivals can **usurp** or **destroy**.

**Canonical example:** Tap Entropic Source — invest 5 essence over 5 ticks to bind an entropy ruin. Generates entropic essence/tick while hex corruption ≥ 0.5.

### Avatar

The player's physical anchor in the world. An individual actor node linked via `avatar_of` edge.

- Tick-based movement with terrain costs (unified with agent movement system)
- Location determines range for actions (local, regional, astral)
- Avatar HUD: center, move, actions

### Disposition System

Game theory cooperation/defection layer: 5 strategies (Tit-for-Tat, Grudger, Pavlov, Always-Cooperate, Always-Defect). Modifies action scores, produces dilemma events, tracks reputation.

### Encounter System

68 multi-step encounter templates across 10 types (explore, acquire, create, hire, duel, steal, trade, assist, build, lead). Location-driven triggers, threat-rated, personality-driven selection. Each encounter is a sequence of resolution steps producing graph operations.

### Trait System (6 Categories)

Graph-native: traits are taxonomy nodes, assignments are `has_trait` edges with level/decay/evolution.

| Category | Duration | Example |
|----------|----------|---------|
| **Innate** | Permanent | Species traits, birth gifts |
| **Mastery** | Decaying (needs reinforcement) | Battle-Hardened, Trade Baron |
| **Reputation** | Evolving | Feared, Beloved, Infamous |
| **Scar** | Permanent | Battle wound, trauma |
| **Condition** | Temporary | Poisoned, Blessed, Cursed |
| **Destiny** | Until fulfilled | Prophecy, doom, calling |

### Attachment System

Unified model for possessions, conditions, spells, powers, agreements, retainers. 6 categories expressed via graph infrastructure. Tags enable semantic scripting; 4-tier rarity; modifier engine resolves all effects through edges.

### Mutable World State

**Hex state** (on HexTile, NOT graph nodes):
- `divineInfluence` (0.0–1.0) — player's presence, decays 0.02/tick
- `corruption` (0.0–1.0) — entropy/chaos, decays 0.01/tick (slower — corruption lingers)
- Terrain transformation at thresholds: corruption ≥ 0.7 degrades, divineInfluence ≥ 0.8 restores

**Location state** (on node properties):
- `prosperity` (0–100) — 5 tiers, tick-driven, trade/disruption/population effects
- `unrest` (0–100) — political instability, decays naturally, prosperity dampens
- `magicalSaturation` (0.0–1.0) — divine/magical energy, decays naturally

### Settlement & Economy

- **Prosperity** ticks via baseIncome + trade bonuses − disruptions. 5 tiers trigger promotions (hamlet↔town↔city).
- **Trade Routes:** `trades_with` edges track economic volume. Active routes boost prosperity; disruption breaks them.
- **Wealth:** Per-actor (0–100), 5 tiers (Magnate→Destitute).

### Culture System

Cultures generated at world seed via foundation bias + sphere selection + biome. 2–4 per world. Assigned to actors and locations (dual-layer: historical + current). Drives identity, naming, values, behavior. Cultural tension detects mismatch, conquest, dual-identity, and fanaticism.

### Narrative Engine

Hybrid layered prose: Tier 1 (routine → template stitching), Tier 2 (notable → enhanced templates), Tier 3 (chronicle → structured generation). Sphere-colored, personality-influenced, foundation-biased.

### Metaprogression Loop

1. **Doom Clock** — 7 archetypes, 5-stage escalation, ticks toward the Unmaking
2. **Victory Mandate** — Graph-state win conditions (dominance/culture/completion), 3-stage structure
3. **The Unmaking** — Cycle transition: Twilight Phase → echo selection → resonance capture → fundament update
4. **World-Soul** — Persistent: Fundament (coefficient ledger) + Resonance (memory fragments)
5. **Echo System** — Legacy/Monument/Relic echoes inject thematic content into next cycle

---

## How Systems Connect

### The Core Loop (per tick)

```
Agent Action Selection (Maslow) → Encounter/Action Choice → Resolution (sigmoid→d100)
    → GraphOp Execution → State Updates (prosperity, unrest, traits, attachments)
    → Narrative Engine (prose for the event) → Trace Emission
```

### The Player Loop

```
Observe (Fog of War, Hex Chronicle, Detail Views)
    → Focus (enter detail view → TargetContext constructed)
    → Act (ActionDrawer shows filtered actions → player picks one)
    → Resolve (action enters tick pipeline as UnifiedAction)
    → Consequence (state changes, narrative feedback, detection risk)
```

### The Metaprogression Loop

```
World Generation (seeded by World-Soul)
    → Play (ticks, actions, influence, doom clock advancing)
    → Unmaking (doom expires or mandate completes → Twilight Phase)
    → Harvest (echo selection, resonance capture)
    → World-Soul Update (fundament shifts, new resonance)
    → Next Cycle (new world, shaped by accumulated echoes)
```

### System Dependency Map

| System | Feeds Into | Fed By |
|--------|-----------|--------|
| World Graph | Everything | World Generation, GraphOp Executor |
| Trait System | Domain Capability, Modifier Engine, Action Selection | Encounters, Attachments, Culture |
| Domain Capability | Action Prerequisites, Resolution | Trait System (sigmoid computation) |
| Action Selection (Maslow) | Encounter System, Action System | Traits, Disposition, Prosperity, Threats |
| Resolution System | GraphOp Executor | Domain Capability, PRNG |
| Encounter System | Trait/State Updates, Narrative | Action Selection, Location triggers |
| Narrative Engine | Player-facing prose | All state-changing systems |
| Player Influence | Avatar, Stealth, Essence | Worshippers, Places of Power |
| Doom Clock | Unmaking trigger | Tick count, Rival actions |
| World-Soul | Next cycle generation | Unmaking, Echo selection |

---

## Key References

| What | Where |
|------|-------|
| Obsidian vault index | `TheFantasyWorldSimulator/Index.md` via Obsidian MCP |
| Generalized Action Targeting | `Docs/plans/2026-03-17-generalized-action-targeting-design.md` |
| Hex state + hex actions | `Docs/plans/2026-03-17-world-state-and-hex-actions-design.md` |
| Hex action brainstorm | `Docs/plans/2026-03-17-brainstorm-hex-actions-and-control-mechanic.md` |
| Domain Capability design | `Docs/plans/2026-03-04-disc13-domain-capability-and-resolution-design.md` |
| Original CRUD design | `Docs/plans/2026-03-03-actor-crud-action-system.md` |
| Visual style guide | `STYLE.md` |
| Design system | `Docs/design-system/INDEX.md` |
| Process canon page | `Docs/canon/process.md` |
| Wiring checklist | `Docs/plans/wiring-checklist.md` |
