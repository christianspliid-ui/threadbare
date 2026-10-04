---
domain: engine
last_reviewed: 2026-08-29
reviewer: claude-code
ul_shards: [Graph, Process]
status: live
---

# Canon — Engine

> The engine is the deterministic, fail-soft tick loop that mutates a typed property graph. Same seed + same inputs = same outputs. Every meaningful decision emits a trace.

## Current spec

- **Tick entry point:** [`src/engine/orchestrator.ts`](../../src/engine/orchestrator.ts) → `runTick(state, runtime)`. Phases are *not* uniformly pure — see `Docs/ai-index/tick-phases.md`.
- **Phase wiring (THR-238, shipped 2026-04-29):** two modes coexist. The **declarative registry** ([`src/engine/phaseRegistry.ts`](../../src/engine/phaseRegistry.ts) + [`src/engine/phases/index.ts`](../../src/engine/phases/index.ts)) holds `EnginePhase` descriptors run by `runRegisteredPhases` at slot anchors inside `runTick` — a new phase is a descriptor file plus an index entry, no orchestrator edit. The **inline legacy mode** (~70 phases hand-inserted in `runTick`) predates the registry and migrates opportunistically, not on a schedule. **New phases use the registry.** The generated [`systems-inventory.md`](systems-inventory.md) `Source` column shows which mode each live phase uses.
- **World graph:** [`src/engine/graph.ts`](../../src/engine/graph.ts) `WorldGraph` — mutated in place, stable object identity. Never key memos on `gameState.graph` reference.
- **Hexes are not graph nodes.** Hexes live in `GameState.tiles[]`; hex actions produce `HexMutation[]` applied in `phaseHexState`. Terrain and hex adjacency are read from tiles/coordinates, never from graph edges.
- **Per-session runtime:** [`src/engine/simulationRuntime.ts`](../../src/engine/simulationRuntime.ts) `SimulationRuntime` — owns encounter cache, distance matrix, `worldVersion`, `structuralCacheVersion`. Module-level cache singletons are rejected (see Rejected approaches).
- **Resolution service:** [`src/engine/resolutionService.ts`](../../src/engine/resolutionService.ts) — sigmoid-derived capability × normalized difficulty (`0..1`) → threshold ∈ `[0.05, 0.95]` (`PROBABILITY_FLOOR` / `PROBABILITY_CEILING`) → d100 with doubles-based crit. `forecastAction` and `resolveAction` share one threshold. The five-band outcome ladder (`critical_success | success | success_at_cost | failure | critical_failure`) is fully live; success-at-cost is the *dominant expected texture*, not an expansion slot (THR-571).
- **Seeded PRNG:** every random decision uses the seeded RNG. `Math.random()` is forbidden. Same seed + same tick = same output.
- **Tracing:** [`src/engine/traceBuffer.ts`](../../src/engine/traceBuffer.ts) `emitTrace()`. New phases emit ≥1 trace; fallbacks emit traces. The Debug Panel (backtick in-game; `F1` jumps to CLI) is the primary inspectability surface.
- **Three-tier position model:** hex → location → sublocation, joined by exactly one `located_at` edge to the most-specific node. **The sublocation tier is one node shape** — `type: 'location'` carrying `parentLocationId` (THR-1183). Ask through [`src/engine/sublocationShape.ts`](../../src/engine/sublocationShape.ts) (`isPlaceNode` / `getLocationNodes` / `resolveToParentLocation`); a bare `getNodesByType('location')` returns *both* tiers. See [Three-tier Position Model in UL/Graph](../ubiquitous-language/Graph.md).
- **Distance matrix:** indexes the **place tier only** (THR-1346, via `getLocationNodes`), caps at `MAX_DISTANCE_MATRIX_SIZE` (1200), and is live on the per-tick path — `socialEncounterGeneration.findVisibleAgents` and `idleBehavior.deriveAmbitionTarget` walk whole rows. Encounter *awareness* never uses it: awareness is hex-coordinate distance (`encounterAwareness.ts`).
- **Typed gamestate program (THR-1156, ratified 2026-08-17):** typed distinctions game-wide, strangler-sequenced with consequence chips as the pilot — content-claim surfaces carry a required typed `anchor` resolvable to a real graph object; the referenceable-object vocabulary is a *generated* catalog from `graph.ts`; rendering reads projections of canonical state, never private pipelines. Check THR-1156's children before green-fielding type machinery.
- **Authoring entrypoint:** [`.claude/skills/engine-architecture/SKILL.md`](../../.claude/skills/engine-architecture/SKILL.md) (the single skill tree — `.claude/skills/` only).
- **UL terms:** [Graph shard](../ubiquitous-language/Graph.md) (Node, Edge, WorldGraph, NodeType, EdgeType, Property-vs-Edge Rule, Three-tier Position Model, located_at, worldVersion, structuralCacheVersion, SimulationRuntime, GameState, HexTile, TerrainType) and [Process shard](../ubiquitous-language/Process.md) (NFP, Three-Pillar Rule, Definition of Done).

## Live engine pointers (read these before refactoring)

The `Docs/ai-index/` files are the live runtime contracts. The Canon page links to them; it does not duplicate them.

| File | Read before |
|------|-------------|
| [`Docs/ai-index/graph-contract.md`](../ai-index/graph-contract.md) | Adding a node or edge type, changing relationship semantics, adding low-fidelity actor variants |
| [`Docs/ai-index/tick-phases.md`](../ai-index/tick-phases.md) | Changing phase order, inserting a new phase, moving work between orchestrator and phase modules |
| [`Docs/ai-index/invariants-and-footguns.md`](../ai-index/invariants-and-footguns.md) | Refactoring caches/selectors, adding UI that depends on graph changes, adding new graph-driven entities |

Alongside them, four canon gates bind engine design work: [`world-objects.md`](world-objects.md) (the catalogue of kinds — a new node type, subtype or content target names its kind there first), [`systems-inventory.md`](systems-inventory.md) (Step 0 — grep before drafting; extend/activate, never green-field a listed subsystem), [`interface-map.md`](interface-map.md) (contract stewardship, § Interface impact), and [`verification-gates.md`](verification-gates.md) (the gate law, incl. the 30-tick engine smoke).

## Non-Functional Priorities (the seven, in order)

CLAUDE.md is authoritative. Higher-numbered NFPs yield to lower-numbered ones in tension.

1. **Tunability** — every magic number is a named constant at module top.
2. **Inspectability** — flat state, pure functions where practical, traces at every decision point.
3. **Determinism** — seeded PRNG everywhere; same seed + same inputs = same outputs.
4. **Fail-soft** — the tick loop never crashes; missing data → graceful fallback + trace.
5. **Narrative over mechanical perfection** — adjust the mechanic when it produces a weird story.
6. **Additive over destructive** — add fields/functions; refactor only when the old shape blocks progress.
7. **Performance budget, not premature optimization** — profile first; lean on the spotlight tier system.

## Load-bearing architectural decisions (settled)

These are settled. Do not revisit. CLAUDE.md is authoritative — repeated here as Step-0 reminders.

- **Everything is a graph node/edge.** No separate relational tables. (Hexes are the one deliberate exception — `GameState.tiles[]`, see Current spec.)
- **Reaches and Spheres are orthogonal axes.** Reaches = what you do; Spheres = what fuels it. See [`Docs/canon/cosmology.md`](cosmology.md) for the rosters.
- **Relationships are edges, never property string IDs.** Properties are for data internal to a node. See [Property-vs-Edge Rule in UL/Graph](../ubiquitous-language/Graph.md).
- **Agent position is a single `located_at` edge** to the most-specific tier. Resolve upward to hex for spatial reasoning. Within-hex visibility is automatic; cross-hex visibility is hex-distance-based, not location-graph-distance-based.
- **The sublocation tier is one node shape** — `type: 'location'` + `parentLocationId` (THR-1183); `'sublocation'` remains a registered `NodeType` that readers accept for saved worlds, but no producer writes it.
- **`actor` is broader than "full agent".** Many engine systems still gate on `properties.actorType === 'individual'`. Adding a new actor-like entity without revisiting those gates causes leaks.
- **The world graph mutates in place.** Use `worldVersion` (UI) and `structuralCacheVersion` (caches) — never the graph object reference — to detect change.
- **Caches live on `SimulationRuntime`, not module scope.** Module singletons leak across game sessions when the page is not fully reloaded.
- **Distance matrix caps at `MAX_DISTANCE_MATRIX_SIZE` (1200)** and indexes the place tier only. Covers all current map presets (measured seed 42: small 131 … epic 791); warns at the cap.
- **No inventing node types without verification.** If a conversation references an unknown node type, stop and ask. Check `src/types/graph.ts` and `world-model.json` first.
- **New node types require full design before code.** Define category, properties, edge types, tick participation, and emitted traces *before* writing any.
- **Content-claim surfaces carry typed anchors** (THR-1156) — never free-text references to world objects, never hand-maintained object lists.

## Tick phase pipelines (mental model)

Detailed order in [`Docs/ai-index/tick-phases.md`](../ai-index/tick-phases.md); the authoritative wiring table is the generated [`systems-inventory.md`](systems-inventory.md). The five buckets are:

1. **Early world progression** — doom, journey beats, unified action progress, thread-bind familiarity, effect tick.
2. **Encounter and agent activity** — encounter progression → revelations → visibility → decision → movement → colocation → dilemma detection → familiarity → interaction depth.
3. **Mid-tick world and narrative** — rival actions, stealth, narrative, essence, control effects.
4. **Late economy/social/structural** — reputation/influence decay → prosperity → settlement promotion → hex state → unrest → sphere pressure/aggregation → ambitions → mandate → doom expiry.
5. **End-of-tick recompute** — `touchWorld()` → visibility recompute → automatic revelations → tick summary trace → notification cleanup → health validation.

**Load-bearing order dependencies:**

- Encounter progression runs **before** decision (resolve active before picking new).
- Movement runs **before** colocation and NPC graduation (post-move position is what downstream phases observe).
- Settlement promotion runs **before** sublocation spawning (lets later phases react to the new tier same tick).
- Visibility and revelation are **end-of-tick recomputations**, not maintained continuously.

## Active design plans

- [`2026-04-16-systemic-wiring-guide.md`](../plans/2026-04-16-systemic-wiring-guide.md) — the systemic capabilities content authors must use. Read this before any prose, encounter, or attachment authoring.
- [`2026-04-29-declarative-engine-phase-registry.md`](../plans/2026-04-29-declarative-engine-phase-registry.md) — the phase registry (THR-238, **shipped 2026-04-29**; kept for rationale — the registry landed, full inline migration deliberately did not).

## Rejected approaches (do not reintroduce)

- ❌ Classical stats (STR/DEX/INT) — replaced by Domain Capability across the Reaches.
- ❌ Fixed rival pantheon — replaced by generated rivals from the World-Soul.
- ❌ Old 5-force cosmology — replaced by Foundation + Creation Sphere model.
- ❌ Pure template prose — replaced by hybrid layered engine.
- ❌ Pure LLM-generated content at runtime — all art and most prose is pre-baked / generated within constraints.
- ❌ Intervention wheel (`AgentWheel`) / fixed action-count slots — replaced by `ActionDrawer` + Generalized Action Targeting (component deleted 2026-08-29).
- ❌ React Three Fiber for the hex map — raw three.js with a canvas ref.
- ❌ Module-scope cache singletons — caches live on `SimulationRuntime`.
- ❌ Location-hop awareness via the location-graph distance matrix — replaced by hex-distance awareness (geometric, predictable, sublocation-agnostic).
- ❌ V1 SVG hex map (`HexMap.tsx`, `HexTile.tsx`, `AgentDots.tsx`, `MovementTrails.tsx`) — replaced by HexMapV2 (Three.js InstancedMesh).
- ❌ `Math.random()` anywhere in the engine — seeded PRNG only.
- ❌ A second skill tree (`.agents/skills/`) — deleted 2026-07-21 with the Cowork lane (THR-654); `.claude/skills/` is the only tree.

## Engine-specific NFP audit table (for new engine work)

From the engine-architecture skill — fill this in when designing engine modules:

| NFP | What to verify |
|-----|----------------|
| Tunability | Thresholds, rates, costs, bonuses, caps named at module top. No inline numbers. |
| Inspectability | New phases emit structured traces via `emitTrace()`. Composite calculations trace each component, not just the result. |
| Determinism | Every branching decision uses seeded PRNG. PRNG instances scoped per context. |
| Fail-soft | Missing nodes/properties/edges → explicit fallback (`if (!x) return [];`). Never throw. Emit trace on fallback. |
| Narrative > mechanical | Weird narrative outcome → adjust the mechanic. |
| Additive | New properties/fields/functions; existing tests keep passing. |
| Performance | Global-tick systems (process all entities) flagged for future profiling; use spotlight tier for per-entity fidelity. |

## Open questions

- **Inline-phase migration pace:** the THR-238 registry is live and is the required mode for *new* phases, but ~70 legacy phases remain inline in `runTick` (~1,174 lines). Migration is opportunistic — no ticket forces it; migrate a phase when you touch it for other reasons.
- **Structural cache granularity:** `structuralCacheVersion` over-invalidates by design (a settlement subtype change rebuilds the distance matrix even if only encounter scoring changed). Split only after profiling shows unnecessary rebuilds matter.
- **Encounter participation breadth:** runtime models one `actorId` + optional `targetAgentId`. Multi-party participants (retainers, escorts) are encounter-runtime work, not just edge wiring. See `Docs/ai-index/invariants-and-footguns.md` §9.

## Last-reviewed

2026-08-29 by Claude Code (THR-1362, context-cleanup round 4 — THR-238/THR-1183/THR-1346/THR-1156 folded in; `.agents` mirror pointer removed). Review trigger: monthly, or when any linked plan moves to `superseded`, or when `src/types/graph.ts` / `src/engine/orchestrator.ts` / `src/engine/simulationRuntime.ts` / `src/engine/phaseRegistry.ts` change shape.

---

## Relocated from CLAUDE.md (THR-1718) — load-bearing architectural decisions (full text) and the debugging protocol

> **Relocated verbatim from `CLAUDE.md` by THR-1718 (2026-10-04).** CLAUDE.md keeps a condensed list of these decisions; the full statements, rationale and measurements live here. The text below is unchanged; paths in it are repo-root relative, and "this file" / "this section" mean their original place in `CLAUDE.md`. `CLAUDE.md` now carries a short card pointing here.

### Load-Bearing Architectural Decisions

Settled. Do not revisit.

- **Everything is a graph node/edge.** No separate relational tables.
- **Reaches and Spheres are orthogonal axes.** Reaches = what you do (activity categories). Spheres = what fuels it (cosmic energies). They combine freely — same Reach at different Sphere alignments produces different action flavors. Neither subsumes the other.
- **Ascendants use the same prerequisite system as agents.** Domain Capability tiers + sphere alignment checks apply equally. Ascendants are powerful former mortals, not a special-cased entity type. Power level is tunable, not structurally different.
- **No inventing node types without verification.** If a conversation references a node type that doesn't exist in the current graph schema, **stop and ask the human** before creating it. First confirm it isn't an existing node under a different name. Check `src/types/graph.ts` and `world-model.json` for the canonical list.
- **New node types require full design before code.** If a genuinely new node type is confirmed, design it before implementing: define its category, required/optional properties, which edge types connect it to existing nodes, how it participates in the tick loop, and what traces it emits. No stub-it-and-figure-it-out-later.
- **Relationships between entities are graph edges, not property fields.** If two entities have a meaningful relationship (commands, owns, defends, trades with, etc.), model it as an edge type — never as a string ID field in a property bag. Properties are for data internal to a node (scores, statuses, flags). Before adding a new edge type, check `src/types/graph.ts` for existing edges that could serve the same purpose. Before encoding a relationship as a property, justify why graph traversal isn't needed — the default answer is "it is needed."
- **Agent position is a three-tier model: hex → location → sublocation.** An agent is always on exactly one tier via a single `located_at` edge pointing to the most specific node they occupy. The tiers nest: sublocation sits inside a location, location sits on a hex. Resolution upward: sublocation → `parentLocationId` → parent location → `hexCol`/`hexRow` → hex. All systems that need spatial reasoning must resolve to the hex level.
  - **The sublocation tier is one node shape: `type: 'location'` carrying `parentLocationId` (THR-1183).** `parentLocationId` is the discriminator — not the node type, and not a subtype string. Ask through `src/engine/sublocationShape.ts` (`isPlaceNode` / `isLocationNode` / `getPlaceNodes` / `getLocationNodes` / `resolveToParentLocation` — the game words, THR-1394: **Location** is the outer tier, **Place** the inner; the code-word names `isSublocationNode` / `isPlaceTierLocation` / `getSublocationNodes` / `getPlaceTierLocations` survive one release as deprecated aliases); never hand-roll the test. **A bare `getNodesByType('location')` returns *both* tiers** — a sweep that means settlements must say `getLocationNodes`. `'sublocation'` remains a registered `NodeType` (THR-1177) that readers still *accept* for saved worlds, but no sublocation producer writes it. Two spellings appear only in old test fixtures and in no writer — `properties.locationSubtype: 'sublocation'` and `properties.locationType: 'sublocation'`; both are deliberately rejected, because a fixture must not get to define the shape.
  - **Why it is `location` and not `sublocation`.** `src/types/sublocation.ts` has always documented it (*"The node itself has `type: 'location'`"*), and the canonical worldgen writer has always obeyed — 473 of 738 location nodes in a seeded medium world at tick 30. `strategicGraphOps.createSublocation` was the single drifted writer, and its nodes sat outside every location sweep while canonical ones sat outside every `getNodesByType('sublocation')` sweep: each shape half-visible, in complementary halves. Narrowing the one drifted writer is also the additive direction (NFP #6) over migrating the high-volume one.
- **Encounter awareness is hex-granular.** If an agent can see a hex, they can see everything on it — every location, every sublocation, every encounter. Within-hex visibility is automatic (distance 0). Cross-hex visibility is computed as hex coordinate distance vs. per-reach awareness hops. The distance matrix between locations is NOT used for encounter awareness — use hex distance (`encounterAwareness.ts`). This means an agent at a sublocation sees all encounters across all locations and sublocations on their hex, plus encounters on hexes within their awareness range.
- **The world graph is mutated in place — never depend on graph object identity for change detection.** `WorldGraph` methods and direct `node.properties` writes modify internal state without changing the object reference. Any `useMemo`, selector, or cache that keys on `gameState.graph` identity will silently serve stale data. Use explicit version counters (`worldVersion` for UI selectors, `structuralCacheVersion` for structural caches such as the distance matrix and encounter cache) via exported `touchWorld()` / `touchStructure()` calls. Property mutations like `locationSubtype` changes in settlement promotion affect encounter scoring via the fallback in `getLocationType()` — versioning only works if every meaningful mutation participates, including property edits. Both tick phases and UI hooks (e.g. `useAgentInteraction`) must use the same touch API. `worldVersion` will bump nearly every tick during active simulation — that's intentional; memos gate paused/idle states, not per-tick skipping. `structuralCacheVersion` intentionally over-invalidates for v1 (a subtype change triggers distance matrix rebuild even though only encounter scoring changed); split into finer-grained versions only if profiling shows unnecessary rebuilds are costly.
- **Engine caches must be owned per session, not stored at module scope.** Module-level singletons (encounter cache, distance matrix, etc.) persist across game sessions if the page isn't fully reloaded. A lightweight `SimulationRuntime` owned by `useSimulation` should hold caches, version counters, and lazy rebuild logic, scoped to the current playthrough.
- **The distance matrix indexes the place tier only, and caps at `MAX_DISTANCE_MATRIX_SIZE` (1200).** It is *not* dead code: `socialEncounterGeneration.findVisibleAgents` and `idleBehavior.deriveAmbitionTarget` both walk a matrix row directly on the per-tick path, so every agent-to-agent social encounter and every ambition drift target comes out of it. Neither calls the module's `getDistance` accessor — both want a whole row, not a point lookup — so grepping for `getDistance` callers will tell you the matrix is unused. It is not. **Measured place-tier counts (seed 42, tick 0): small 131, medium 214, large 542, epic 791** — comfortably under the cap on every preset. THR-1346 scoped the build to `getLocationNodes`; before that it walked the bare `getNodesByType('location')`, which since THR-1183 also returns sublocations (~2:1 over place-tier), pushing `large` to 1628 and `epic` to 2549 and silently truncating **235 and 391 real settlements** out of the index. The earlier figures recorded here (`large ~584`, `epic ~805`) predated that unification and were never a measurement of what the matrix indexed. If place-tier count ever does exceed 1200, a `console.warn` fires and agents at unindexed locations degrade to "nothing is near me" — assert the headroom on a **generated** world, never a fixture (`distanceMatrix.test.ts`).


### Debugging Protocol: Verify the Noun Before the Verb

When debugging "system X doesn't produce output for entity Y":

1. **Verify entity identity first.** Inspect the actual `actorId`, `templateId`, `locationId`, or `actionId` in state before modifying the producing system. Use the CLI (`eval state.unifiedActions[...]`) or debug bridge to confirm the entity is what you think it is.
2. **Check alias resolution.** If you used `@hero`, a partial name, or any fuzzy match, confirm what it resolved to. Debug spawn commands now print resolution notes — read them.
3. **Only then trace the system.** Once you've confirmed the input data is correct, trace why the system didn't process it.

This protocol exists because: a bug where `@hero` resolved to the wrong actor was misdiagnosed as a visibility system bug, resulting in two correct-but-non-causal fixes before the real cause (identity mismatch) was found. The wasted work was avoidable with a single `eval` command.
