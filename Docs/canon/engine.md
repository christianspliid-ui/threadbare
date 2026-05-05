---
domain: engine
last_reviewed: 2026-05-05
reviewer: cowork
ul_shards: [Graph, Process]
status: live
---

# Canon — Engine

> The engine is the deterministic, fail-soft tick loop that mutates a typed property graph. Same seed + same inputs = same outputs. Every meaningful decision emits a trace.

## Current spec

- **Tick entry point:** [`src/engine/orchestrator.ts`](../../src/engine/orchestrator.ts) → `runTick(state, runtime)`. Phases are *not* uniformly pure — see `Docs/ai-index/tick-phases.md`.
- **World graph:** [`src/engine/graph.ts`](../../src/engine/graph.ts) `WorldGraph` — mutated in place, stable object identity. Never key memos on `gameState.graph` reference.
- **Per-session runtime:** [`src/engine/simulationRuntime.ts`](../../src/engine/simulationRuntime.ts) `SimulationRuntime` — owns encounter cache, distance matrix, `worldVersion`, `structuralCacheVersion`. Module-level cache singletons are rejected (see Rejected approaches).
- **Resolution service:** [`src/engine/resolutionService.ts`](../../src/engine/resolutionService.ts) — sigmoid-derived capability × normalized difficulty (`0..1`) → threshold ∈ `[0.05, 0.95]` → d100 with doubles-based crit. `forecastAction` and `resolveAction` share one threshold.
- **Seeded PRNG:** every random decision uses the seeded RNG. `Math.random()` is forbidden. Same seed + same tick = same output.
- **Tracing:** [`src/engine/traceBuffer.ts`](../../src/engine/traceBuffer.ts) `emitTrace()`. New phases emit ≥1 trace; fallbacks emit traces. The Debug Panel (backtick in-game; `F1` jumps to CLI) is the primary inspectability surface.
- **Three-tier position model:** hex → location → sublocation, joined by exactly one `located_at` edge to the most-specific node. See [Three-tier Position Model in UL/Graph](../ubiquitous-language/Graph.md).
- **Hex state mutations:** hexes live in `GameState.tiles[]`, not in the graph. Hex actions produce `HexMutation[]` applied in `phaseHexState`.
- **Authoring entrypoint:** [`.claude/skills/engine-architecture/SKILL.md`](../../.claude/skills/engine-architecture/SKILL.md). Mirror at `.agents/skills/engine-architecture/SKILL.md`.
- **UL terms:** [Graph shard](../ubiquitous-language/Graph.md) (Node, Edge, WorldGraph, NodeType, EdgeType, Property-vs-Edge Rule, Three-tier Position Model, located_at, worldVersion, structuralCacheVersion, SimulationRuntime, GameState, HexTile, TerrainType) and [Process shard](../ubiquitous-language/Process.md) (NFP, Three-Pillar Rule, Definition of Done).

## Live engine pointers (read these before refactoring)

The `Docs/ai-index/` files are the live runtime contracts. The Canon page links to them; it does not duplicate them.

| File | Read before |
|------|-------------|
| [`Docs/ai-index/graph-contract.md`](../ai-index/graph-contract.md) | Adding a node or edge type, changing relationship semantics, adding low-fidelity actor variants |
| [`Docs/ai-index/tick-phases.md`](../ai-index/tick-phases.md) | Changing phase order, inserting a new phase, moving work between orchestrator and phase modules |
| [`Docs/ai-index/invariants-and-footguns.md`](../ai-index/invariants-and-footguns.md) | Refactoring caches/selectors, adding UI that depends on graph changes, adding new graph-driven entities |

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

- **Everything is a graph node/edge.** No separate relational tables.
- **Reaches and Spheres are orthogonal axes.** Reaches = what you do; Spheres = what fuels it. See [`Docs/canon/cosmology.md`](cosmology.md) for the rosters.
- **Relationships are edges, never property string IDs.** Properties are for data internal to a node. See [Property-vs-Edge Rule in UL/Graph](../ubiquitous-language/Graph.md).
- **Agent position is a single `located_at` edge** to the most-specific tier. Resolve upward to hex for spatial reasoning. Within-hex visibility is automatic; cross-hex visibility is hex-distance-based, not location-graph-distance-based.
- **`actor` is broader than "full agent".** Many engine systems still gate on `properties.actorType === 'individual'`. Adding a new actor-like entity without revisiting those gates causes leaks.
- **The world graph mutates in place.** Use `worldVersion` (UI) and `structuralCacheVersion` (caches) — never the graph object reference — to detect change.
- **Caches live on `SimulationRuntime`, not module scope.** Module singletons leak across game sessions when the page is not fully reloaded.
- **Distance matrix caps at `MAX_DISTANCE_MATRIX_SIZE` (1200).** Covers all current map presets; warns at the cap.
- **No inventing node types without verification.** If a conversation references an unknown node type, stop and ask. Check `src/types/graph.ts` and `world-model.json` first.
- **New node types require full design before code.** Define category, properties, edge types, tick participation, and emitted traces *before* writing any.

## Tick phase pipelines (mental model)

Detailed order in [`Docs/ai-index/tick-phases.md`](../ai-index/tick-phases.md). The five buckets are:

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

- [`2026-04-16-systemic-wiring-guide.md`](../plans/2026-04-16-systemic-wiring-guide.md) — the 7 engine capabilities content authors must use. Read this before any prose, encounter, or attachment authoring.
- [`2026-04-29-declarative-engine-phase-registry.md`](../plans/2026-04-29-declarative-engine-phase-registry.md) — orchestrator phase wiring → declarative registry (THR-238). Three landings; status: Ready for Dev.
- [`2026-05-05-canonical-documentation-strategy.md`](../plans/2026-05-05-canonical-documentation-strategy.md) — strategy plan for this Canon page (Phase 2b, THR-315).

## Rejected approaches (do not reintroduce)

- ❌ Classical stats (STR/DEX/INT) — replaced by Domain Capability across the Reaches.
- ❌ Fixed rival pantheon — replaced by generated rivals from the World-Soul.
- ❌ Old 5-force cosmology — replaced by Foundation + Creation Sphere model.
- ❌ Pure template prose — replaced by hybrid layered engine.
- ❌ Pure LLM-generated content at runtime — all art and most prose is pre-baked / generated within constraints.
- ❌ Intervention wheel (`AgentWheel`) / fixed action-count slots — replaced by `ActionDrawer` + Generalized Action Targeting.
- ❌ React Three Fiber for the hex map — raw three.js with a canvas ref.
- ❌ Module-scope cache singletons — caches live on `SimulationRuntime`.
- ❌ Location-hop awareness via the location-graph distance matrix — replaced by hex-distance awareness (geometric, predictable, sublocation-agnostic).
- ❌ V1 SVG hex map (`HexMap.tsx`, `HexTile.tsx`, `AgentDots.tsx`, `MovementTrails.tsx`) — replaced by HexMapV2 (Three.js InstancedMesh).
- ❌ `Math.random()` anywhere in the engine — seeded PRNG only.

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

- **Phase registry migration (THR-238):** until Land 3 lands, new phases still register in `orchestrator.ts` inline. Once shipped, "create the file, register the descriptor" replaces orchestrator edits.
- **Structural cache granularity:** `structuralCacheVersion` over-invalidates by design (a settlement subtype change rebuilds the distance matrix even if only encounter scoring changed). Split only after profiling shows unnecessary rebuilds matter.
- **Encounter participation breadth:** runtime models one `actorId` + optional `targetAgentId`. Multi-party participants (retainers, escorts) are encounter-runtime work, not just edge wiring. See `Docs/ai-index/invariants-and-footguns.md` §9.

## Last-reviewed

2026-05-05 by Cowork. Review trigger: monthly, or when any linked plan moves to `superseded`, or when `src/types/graph.ts` / `src/engine/orchestrator.ts` / `src/engine/simulationRuntime.ts` change shape.
