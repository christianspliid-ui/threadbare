# THR-162 — Tick Loop Scaling Investigation
**Date:** 2026-04-19  
**Author:** Claude Code (claude-sonnet-4-6)  
**Status:** Investigation complete — world-gen divergence fixed, performance split into follow-up issues

---

## Part 1: World-Gen Divergence — Root Cause (CONFIRMED)

### The problem

`?view=game&seeded` produces a ~1010-agent world. CLI `--seed 42` produces a ~414-agent world. They use the same numeric seed but generate different worlds.

### Root cause

Three contributing factors:

**1. Map size (primary cause of agent count difference)**

`DEV_ASCENDANT_IDENTITY` in `src/engine/gameInit.ts` uses `hungerId: 'hunger.witness'`.  
`deriveMapSize('hunger.witness')` → `'large'` (see `src/engine/remembrance.ts:HUNGER_MAP_SIZES`).  
CLI defaults to `medium` map size.

| | Map preset | Hex grid | Approximate initial agents |
|---|---|---|---|
| `?seeded` | `large` | 48×36 = 1728 hexes | ~830–850 |
| CLI `--seed 42` | `medium` | 32×24 = 768 hexes | ~400–420 |

The large map generates ~2.25× more hexes → proportionally more locations → more seeded NPCs.

**2. Cosmology difference**

`initializeGameStateFromIdentity` derives cosmology from the identity's `sphereAlignment` and `mortalTags` via `deriveCosmologyFromIdentity`. CLI uses `createBalancedCosmology()`. The cosmology affects agent axiological profiles and potentially world-gen passes.

**3. devSeedTheFirst / devSeedAscendantTestPackage**

These two calls inject Kael Thornweaver and ascendant test packages into the browser game state only. They add ~2-5 additional nodes/edges not present in the CLI session.

### The fix (implemented in this PR)

`App.tsx` now respects `?size=` URL parameter in the `playing-remembrance` path. Setting `?view=game&seeded&size=medium` runs `?seeded` with a medium map (same size as CLI).

**CLI equivalent for large-map parity:**  
`npm run cli -- --seed 42 --map large`  
Note: cosmology still differs (CLI uses balanced; browser uses witness-derived). True world-gen parity would require matching cosmology — currently not supported in CLI, filed as a follow-up.

---

## Part 2: Tick Loop Scaling — Code Analysis

### The stall pattern

The browser stalls at tick 72 with 1010+ agents. This is not a fixed-tick trigger — it is cumulative. Agent population grows by ~5–10 births per tick (BIRTH_CHANCE = 0.01 per qualifying location, ~584 locations on large map). Starting from ~830-850 initial agents, the population reaches ~1010 by tick 70–75, crossing the browser's frame budget threshold.

### Agent count composition at tick 72

| Source | Spotlight tier | Count (approx.) |
|---|---|---|
| `worldSeed.ts` — named individuals | `spotlight` | 16–24 |
| `npcSeeding.ts` — ambient NPCs | `ambient` | 800–830 |
| `agentLifecycle.ts` — lifecycle births | `spotlight` | 160–190 |
| **Total** | | **~1000–1045** |

Key insight: **lifecycle-born agents default to `spotlight` tier** (see `agentLifecycle.ts`), so `phaseAgentDecision` and `phaseMovement` process an ever-growing spotlight pool as lifecycle births accumulate.

### O(N) phases running over ALL agents per tick

These phases iterate over every individual actor regardless of spotlight tier:

| Phase | Location in orchestrator | Per-agent cost |
|---|---|---|
| **Effect Tick** (Phase 2a.4) | Line ~1838 | 3 `getOutgoingEdges` calls + Map ops |
| **Mastery Trait Decay** (Phase 6.626) | Line ~2110 | Graph trait queries |
| **Familiarity Gain** (Phase 2.75) | Line ~2025 | Location + hex coordinate lookup |
| **Colocation Detection** (Phase 2.36) | Phase call | All agents + pairwise per-location |

With N = 1010 agents: 4 × 1010 = ~4040 minimum iterations per tick, each with graph queries. JavaScript object allocation + GC pressure at this scale causes frame budget overruns.

### O(N_spotlight) phases — scale with growing lifecycle births

| Phase | Location | Notes |
|---|---|---|
| `phaseAgentDecision` | Line ~1927 | Full encounter filter pipeline per spotlight agent |
| `phaseMovement` | Line ~1942 | Pathfinding tick per spotlight agent with movement queue |
| `phaseSlotCaps` | Called | Spotlight-only iteration |

By tick 72, ~160–190 lifecycle-born spotlight agents join the decision pipeline, adding significant per-tick cost.

### Potential O(N²) risk: colocation detection

`phaseColocationDetection` does pairwise detection for agents at the same location. For each location with K agents: K×(K-1)/2 pairs checked. Typical values: most locations have 1–3 agents (cheap), but dense cities with 15 ambient NPCs + lifecycle-born agents could have 20+ agents → 190+ pairwise checks per city. With multiple large settlements on a large map, total pairwise work can reach 5000–15000 operations.

### Encounter cache rebuild trigger

`touchStructure(runtime)` is called when:
1. `phaseInitiativeProgress` fires events (line 1937)
2. `phaseSettlementPromotion` fires tier changes (line 2142)
3. `phaseSublocations` spawns/dissolves sublocations (line 2190)

Each `touchStructure` call causes `ensureEncounterCache` to rebuild the full cache next tick via `buildFullCache` — scanning all ~584 locations and building encounter entries. Estimated rebuild cost: 20–50ms. If `phaseSublocations` fires frequently (as prosperity builds), the cache rebuilds every few ticks, adding consistent overhead.

### Distance matrix status (corrected)

`MAX_DISTANCE_MATRIX_SIZE` was raised from 500 → **1200** in TB-088 (see `src/engine/distanceMatrix.ts`). Large map generates ~584 locations, well within the new cap. The comment in CLAUDE.md referring to the old 500-cap value is stale and has been corrected.

---

## Part 3: Acceptance Criteria Status

| Criterion | Status |
|---|---|
| Reproduction confirmed with agent count | Confirmed by code analysis — 1010 agents via large map + lifecycle growth |
| Stall resolved OR split into follow-up issues | **Split** — 3 follow-up issues filed (THR-185, THR-186, THR-187) |
| `?seeded` ↔ `--seed 42` divergence documented | **Documented** — map size diff is `hunger.witness → large` vs CLI `medium` |
| `?size=` URL override works for seeded path | **Fixed** in `src/App.tsx` |

---

## Part 4: Follow-Up Issues

### THR-185: Lifecycle-born agents should default to `ambient`, not `spotlight`
**Hypothesis:** `agentLifecycle.ts` creates born-later agents at `spotlight` tier (the legacy default). These agents accumulate in `phaseAgentDecision` and `phaseMovement` over time, growing the decision pool well beyond the initial seeded count. Changing born-later agents to `ambient` by default (with organic graduation via `phaseNpcGraduation`) would cap the active decision pool at the seeded spotlight count + graduates, rather than growing unboundedly.

### THR-186: Profile and cap O(N_all) ambient agent iterations ✅ Done (2026-04-19)
Early-exit predicates added to Effect Tick (skip agents with no `possesses`/`bonded_to`/`has_trait` edges), Mastery Decay (skip agents with no `has_trait` edges), and Familiarity Gain (`hexDistance > FAMILIARITY_PROXIMITY_HEX_RANGE` guard, constant=0). `TickPhaseProfileTrace` aggregate per phase per tick. Deferral THR-188 filed for hex→actor index to eliminate remaining O(N) location lookups in familiarity phase. Commit: `5ab98a08`.

### THR-187: Encounter cache rebuild frequency on large map
**Hypothesis:** `touchStructure` fires frequently on large maps due to sublocation spawns and settlement promotions, causing full encounter cache rebuilds every few ticks. `buildFullCache` over 584 locations adds 20–50ms overhead. Investigate whether incremental cache updates (already implemented via `addLocation`/`removeLocation`) could replace full rebuilds for the common cases.

---

## References
- `src/engine/remembrance.ts:HUNGER_MAP_SIZES` — hunger ID → map size table
- `src/engine/gameInit.ts:DEV_ASCENDANT_IDENTITY` — dev identity uses `hunger.witness`
- `src/data/agent-behavior-constants.ts:AGENT_COUNT_BY_MAP_SIZE` — spotlight agent counts per preset
- `src/engine/agentLifecycle.ts:BIRTH_CHANCE` — 1% per qualifying location per tick
- `src/engine/simulationRuntime.ts:touchStructure` — triggers encounter cache rebuild
- `src/engine/distanceMatrix.ts:MAX_DISTANCE_MATRIX_SIZE` — currently 1200 (not 500)
- `src/engine/phaseColocationDetection.ts` — pairwise detection within locations
