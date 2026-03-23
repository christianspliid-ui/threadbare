# Implementation Ordering Guide — Agent Behavior Systems

**Date:** 2026-03-18
**Purpose:** Guide for Claude Code to implement the five design docs + one UI spec from the 2026-03-18 design session. Specifies dependency order, implementation phases, and what can be parallelized.

## Design Documents (in dependency order)

| # | Document | File | Decisions |
|---|----------|------|-----------|
| 1 | Agent Decision & Encounter Awareness | `Docs/plans/2026-03-18-agent-decision-and-encounter-awareness-design.md` | 8 |
| 2 | Encounter Resolution & Divine Intervention | `Docs/plans/2026-03-18-encounter-resolution-and-divine-intervention-design.md` | 5 |
| 3 | Tier Promotion & Capability Growth | `Docs/plans/2026-03-18-tier-promotion-and-capability-growth-design.md` | 3 |
| 4 | Social Fabric & Faction Formation | `Docs/plans/2026-03-18-social-fabric-and-faction-formation-design.md` | 5 |
| 5 | Social Fabric Visibility Spec | `Docs/plans/2026-03-18-social-fabric-visibility-spec.md` | UI spec |

## Implementation Phases

### Phase 0: Prerequisites (content authoring + small utilities)

These can be done independently and in parallel. They unblock later phases.

| Task | What | Unblocks | Effort |
|------|------|----------|--------|
| **0a** | Add `duration?: number` to `EncounterStep` interface in `types/encounter.ts` | Phase 1 (scoring denominator) | Tiny — 1 field |
| **0b** | Backfill `duration` on all 64 existing encounter template steps in `encounter-content.ts`. Quick actions = 1, multi-day = 3-5, sieges/rituals = 5-10. | Phase 1 (accurate tick costs) | Medium — 64 templates × 3 steps |
| **0c** | Add `remoteAttempt?` to `EncounterTemplate` interface in `types/encounter.ts` | Phase 1 (remote encounters) | Tiny — 1 field |
| **0d** | Create `SPHERE_OPPOSITIONS: Record<SphereName, SphereName>` lookup table. Derive from canonical cosmology: Life↔Entropy, Light↔Darkness, Order↔Chaos, Force↔Matter(?), Energy↔Mind(?). Check Obsidian `Cosmology/Spheres and Reaches.md` for canonical pairings. | Phase 2 (sphere alignment bonus) | Small |
| **0e** | Add `trust: number` to `relates_to` edge properties in graph type definitions. Initialize existing edges: `trust = (sentiment ?? 0) * 0.5`. | Phase 4 (reputation walks, social scoring) | Small |
| **0f** | Add `rank: number` and `joinedTick: number` to `member_of` edge properties. Backfill existing guild membership edges with `rank: 0.3` default. | Phase 4 (faction awareness) | Small |
| **0g** | Add `reachPreferences: Record<ReachDomain, number>` to faction node properties. Backfill existing guilds from `guildSeeding.ts` domain data. | Phase 1 Decision 3 (faction intelligence) | Small |
| **0h** | Implement `findAllPaths(sourceId, targetId, maxHops, edgeType)` — bounded BFS on the graph with edge type filter and `REPUTATION_WALK_MAX_NODES = 100` safety cap. General graph utility in `src/engine/graphUtils.ts`. | Phase 4 (reputation walks) | Small |
| **0i** | Add `occupiedUntilTick?: number` to `EncounterProgress` interface. | Phase 1 (multi-tick steps) | Tiny — 1 field |

### Phase 1: Encounter Cache + Unified Decision Phase

**Design doc:** Agent Decision & Encounter Awareness (all 8 decisions)

This is the foundation. Everything else builds on the unified decision pipeline.

**Implementation order within Phase 1:**

1. **Distance matrix** — precompute and cache graph distances between all location pairs. Update incrementally when locations are created/destroyed. (`src/engine/distanceMatrix.ts`)

2. **EncounterCacheManager** — Decision 5. Build the global cache, event-based invalidation, cache entry shape with pre-computed scoring data (`successRewardEstimate`, `totalTickCost`, `stepDifficulties`, `stepReaches`). Wire `graphOpExecutor` to fire cache events after mutations.

3. **Awareness filter** — Decision 2. Per-reach awareness using `max(primaryCap, secondaryCap)` with `CAPABILITY_PER_HOP` scaling. Uses distance matrix.

4. **Faction awareness** — Decision 3. Rank-gated, reach-filtered. Falls back gracefully if faction data is missing (Phase 0g provides it).

5. **Filter pipeline** — Decision 6. Five-stage filter: awareness → visibleTo → prerequisites → threat (courage-modified) → performance cap with diversity floor.

6. **Scoring** — Decision 7. Value-per-tick × desire multiplier. Deterministic selection (pick highest). Full formula as specified in the doc. Integrate `growthValue` from Tier Promotion doc.

7. **Multi-tick step mechanics** — resolve at end of duration. `occupiedUntilTick` check in decision phase. Occupied agents skipped.

8. **Idle behavior** — Decision 8. Heart axis (Loyalty vs. Ambition) determines drift vs stay. `deriveAmbitionTarget` resolver.

9. **Phase ordering** — Wire `phaseAgentDecision` into orchestrator as Phase 2b. Retire old `phaseIdleSelection` / `generateMovementCandidates` / `computeBasePull`. Keep `phaseMovement` for path execution (Phase 2.35).

**Tests:** Each step should have unit tests. The decision pipeline should have integration tests with known graph setups verifying that agents make sensible choices (merchant goes to market, warrior goes to fortress, etc.).

### Phase 2: Resolution Modifier Pipeline

**Design doc:** Encounter Resolution & Divine Intervention (Decision 1 only — modifiers)

**Implementation order:**

1. **Sphere alignment bonus** — uses `SPHERE_OPPOSITIONS` from Phase 0d. Fail-soft: all bonuses = 0 if table missing.

2. **Equipment modifier** — walks agent's attachment edges, sums `reachBonus[step.reach]`. Requires adding `reachBonus` to attachment properties (can start with a few key attachments, expand later).

3. **Terrain modifier** — reads location terrain type from `TERRAIN_RESOLUTION_MODIFIERS` table. Faction control bonus (mutually exclusive: own faction = +0.05, hostile = -0.05, neutral = 0).

4. **Trait bonus** — walks agent's trait edges, sums `resolutionBonus[step.reach]`. Requires adding `resolutionBonus` to trait properties (can start with a few key traits, expand later).

5. **Replace hardcoded constants** — remove `ENCOUNTER_SPHERE_FACTOR = 0.1` and `ENCOUNTER_DIFFICULTY_MODIFIER = 0.5`. The modifier pipeline replaces them.

6. **Update `estimateStepProbability`** in the scoring pipeline (Phase 1) to use the new modifier pipeline instead of the flat formula.

**Note:** The divine intervention modifier (Decision 3) and vignette system (Decisions 2, 4, 5) are Phase 3. The modifier pipeline has a slot for `divineInterventionModifier` that defaults to 0 until Phase 3 is built.

### Phase 3: Tier Promotion & Capability Growth

**Design doc:** Tier Promotion & Capability Growth (all 3 decisions)

**Implementation order:**

1. **Experience trait system** — create synthetic `encounter_experience_{domain}` traits on first growth application. Growth formula: `BASE_ENCOUNTER_GROWTH × promotionMultiplier × difficultyScaling × diminishingReturns`. Wire into encounter step resolution (after d100 roll, apply growth on success, `FAILURE_GROWTH_FRACTION` on failure).

2. **Tier crossing detection** — after growth application, check `computeTier(previous) vs computeTier(new)`. Fire promotion event on crossing.

3. **Promotion event** — narrative vignette (Tier 1 notification), visible trait signifier from `PROMOTION_TRAITS` table, faction rank bump if domain matches.

4. **Payoff estimation integration** — update the scoring formula's `growthValue` computation to use real proximity-to-next-tier data instead of a placeholder.

### Phase 4: Social Fabric

**Design doc:** Social Fabric & Faction Formation (all 5 decisions)

**Implementation order:**

1. **Trust mechanics** — trust changes on cooperative/defective interactions (+0.03 / -0.08). Trust decay toward 0 per tick. Wire into existing `resolveDilemma` and interaction resolution.

2. **Graph-walked reputation** — `perceiveReputation(sourceId, targetId, graph, maxHops)`. Uses `findAllPaths` from Phase 0h. Shadow distortion, Heart resistance, faction rank bonus. Replace `reputationScore` reads in `applyDispositionModifier`.

3. **Social encounter generation** — during decision phase, generate social encounter candidates from visible agents. Bond modifier on scoring. Stranger curiosity for ambitious/perceptive agents.

4. **Social encounter templates** — author 14 templates (Forge Alliance, Spy On, Negotiate Deal, Challenge to Duel, Establish Patronage, Found a Group, etc.) with full step definitions.

5. **Faction formation** — "Found a Group" encounter (3-step, remote-capable). Creates faction node + member_of edges on success. "Recruit to Faction" encounter for growth.

6. **Social awareness** — bonds bypass distance for visibility. Heart/Shadow capability for unbonded agent perception. Social density bonus.

### Phase 5: Divine Intervention & Vignettes

**Design doc:** Encounter Resolution & Divine Intervention (Decisions 2-5)

This is the most UI-heavy phase and depends on all prior phases.

**Implementation order:**

1. **Vignette notification system** — significance gating (threat ≥ hard, ambition milestone, journey beat). Three tiers. `VIGNETTE_MAX_PER_TICK` cap.

2. **DivineAttention state** — property on agent/location nodes. Defaults to `{ level: 'none' }`.

3. **Divine attention actions** — Attune, Scry, Focus as `UnifiedActionTemplate` entries. Write to `DivineAttention` state via GraphOps.

4. **Exponential essence cost** — triangular cost curve. Sphere matching. Bond efficiency scaling. UI: slider showing probability bonus vs essence cost.

5. **Intervention tracking** — `InterventionRecord` stored on agent. Feeds Return convergence (future Meet The First integration).

6. **Vignette prose generation** — new resolver registry (`vignetteSceneResolver`, `vignetteLensResolver`, `vignetteStakesResolver`, `vignetteForecastResolver`). Sphere-flavored content tables. Start with 4 spheres + defaults.

### Phase 6: Visibility & Debug Tools

**Design doc:** Social Fabric Visibility Spec

Implement in priority order from the spec:

1. Debug Panel — Decision Breakdown (Critical)
2. Debug Panel — Relationship Graph (Critical)
3. Notifications — Social TickEvents (High)
4. Debug Panel — Map Overlays: Bond lines + Decision vectors (High)
5. Chronicle — Social Events (Medium)
6. Agent Profile — Relationships Section (Medium)
7. Debug Panel — Reputation Walk Inspector (Medium)
8. Constants Tuning Panel (Medium)
9. Map — Faction Presence (Low)
10. Debug Panel — Faction Inspector (Low)

## What Can Be Parallelized

```
Phase 0 (all tasks)     ← can be done in any order, all independent
  ↓
Phase 1 (cache + decision) ← foundation, must complete before Phases 2-5
  ↓
Phase 2 (modifiers)  ┐
Phase 3 (growth)     ├── can be done in parallel after Phase 1
Phase 4 (social)     ┘
  ↓
Phase 5 (intervention) ← depends on Phases 2 + 4 (modifiers + social awareness)
  ↓
Phase 6 (visibility) ← can start after Phase 1, grows incrementally with Phases 2-5
```

## Key Architecture Notes for Claude Code

1. **No top-N selection, no probabilistic select.** The old pipeline structure is retired. Deterministic pick of highest `finalScore`.

2. **Multi-tick steps resolve at the END of duration.** Agent is occupied for the full duration before the d100 roll.

3. **The encounter cache is the single source of truth** for location-based encounters. Social encounters are generated dynamically per-agent during the decision phase. Both enter the same scoring pipeline.

4. **Reputation is graph-walked, not a flat field.** `reputationScore` on agent nodes is deprecated. Use `perceiveReputation()` which walks `relates_to` edges. The old field stays as fallback during migration.

5. **All fail-softs default to "skip gracefully."** Missing data → skip that modifier/filter/step, never crash. The system works at reduced fidelity without any single component.

6. **Every system emits traces.** Check each design doc's Tracing section for the exact trace interface. Add new trace categories to `TRACE_CATEGORIES` in `types/trace.ts`.

7. **Read the full design doc before implementing each phase.** The docs contain constants tables, fail-soft tables, trace schemas, and PRNG notes that are load-bearing for correctness.
