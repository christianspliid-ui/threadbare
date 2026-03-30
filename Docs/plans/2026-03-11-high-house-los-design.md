# Line-of-Sight Design — Court Agents & Scry Observation

**Date:** 2026-03-11
**Revised:** 2026-03-17 — Updated for scry/court separation. Two distinct LOS source types now exist: permanent (court agents) and temporary (scry observation).
**Status:** Approved (revised)

## Problem

All three fog-of-war sight-range constants in `src/types/visibility.ts` are placeholder zeroes.
As a result:
- The avatar reveals only the exact hex they stand on (range 0 = 1 hex)
- Retinue agents and court agents contribute nothing meaningful
- Players cannot follow their court agents' journeys through the world

Additionally, `getScryTargetHexes` discards agent IDs, so court targets use a flat constant
and cannot benefit from the modifier pipeline (traits, items, terrain) the way retinue
agents already do.

## Design

### Goal

**Four LOS source types**, each with distinct lifetime and range:

| Source | Lifetime | Base Range | Modifier-Aware | Governed By |
|--------|----------|-----------|----------------|-------------|
| **Avatar** | Permanent (player position) | `AVATAR_SIGHT_RANGE` (3) | No (fixed) | Player movement |
| **Retinue agents** | Permanent (while tier >= 1) | `AGENT_SIGHT_RANGE` (2) | Yes (traits, items, terrain) | Influence system |
| **Court agents** | Permanent (while holding court position) | `COURT_AGENT_SIGHT_RANGE` (2) | Yes (traits, items, terrain) | Divine Court investiture |
| **Scry targets** | Temporary (`SCRY_DURATION_TICKS` ticks) | `SCRY_OBSERVATION_RANGE` (2) | Yes (traits, items, terrain) | Scry action (see `2026-03-17-scry-observation-design.md`) |

Note: Court agents and retinue agents may overlap (a court agent is always also in the retinue). The visibility system deduplicates LOS sources by hex — if an agent contributes LOS from both court and retinue, the higher range wins. Scry targets are distinct: a scried agent is NOT necessarily in the court, and court agents cannot be scried (they already have permanent LOS).

### Sight Range Constants (tunable numbers)

| Constant | Old | New | Meaning |
|---|---|---|---|
| `AVATAR_SIGHT_RANGE` | 0 | 3 | Hexes around the avatar revealed as they walk |
| `AGENT_SIGHT_RANGE` | 0 | 2 | Base sight for retinue agents (worships-edge tier >= 1) |
| `COURT_AGENT_SIGHT_RANGE` | 0 (was `SCRY_SIGHT_RANGE`) | 2 | Base sight for agents assigned to Divine Court positions |
| `SCRY_OBSERVATION_RANGE` | (new) | 2 | Base sight for agents under temporary scry observation |

These are named constants — tuning game feel means changing a number, not rewriting logic.

### New Type: `ScryTarget` (retained but clarified)

`ScryTarget` now represents **any temporary observation target** (from the scry action), not court positions:

```ts
export interface ScryTarget {
  coord: HexCoord;
  agentId: string;
}
```

Court agent LOS sources are collected separately from court position data (not via `ScryTarget`).

### Modifier-Aware Range

`collectLOSSources` calls `getModifiedValue(graph, agentId, 'los_range', baseRange)` for:
- **Retinue agents** — base: `AGENT_SIGHT_RANGE`
- **Court agents** — base: `COURT_AGENT_SIGHT_RANGE`
- **Scry targets** — base: `SCRY_OBSERVATION_RANGE`

An agent with an "Eagle-Eyed" trait or a mountain-terrain bonus will contribute more sight;
a dense-forest penalty will reduce it. No new modifier infrastructure is needed.

### Tracing

```typescript
interface LOSRecalcTrace {
  type: 'los_recalc';
  tick: number;
  sourceCount: {
    avatar: 1;
    retinue: number;
    court: number;
    scry: number;
  };
  hexesRevealed: number;
  hexesRemembered: number;
  hexesUnexplored: number;
}
```

### Fail-Soft

| Failure Case | Fallback Behavior |
|---|---|
| Court agent's hex not found in grid | Skip this source for the tick. Log warning. |
| Scry target agent no longer in graph | Expire the scry edge. Treat as normal expiry. |
| Modifier pipeline returns negative range | Clamp to 0 (reveal only the agent's own hex). |
| Duplicate LOS source (same agent via court + retinue) | Deduplicate by hex. Higher range wins. |

## Files Changed

| File | Change |
|---|---|
| `src/types/visibility.ts` | Rename `SCRY_SIGHT_RANGE` → `COURT_AGENT_SIGHT_RANGE`. Add `SCRY_OBSERVATION_RANGE`. Bump all constants to target values. |
| `src/engine/visibility.ts` | `collectLOSSources` collects four source types. `getScryTargetHexes` renamed/split: court targets from positions, scry targets from edges. |
| `src/engine/orchestrator.ts` | `runTick` collects both court and scry LOS sources, passes both to visibility recalc. |
| `src/engine/__tests__/visibility.test.ts` | Update tests for renamed constants and split source collection. |
| `src/engine/__tests__/visibility-modifiers.test.ts` | Add modifier-aware tests for both court and scry sources. |

React hooks (`useSimulation.ts`, `useViewNavigation.ts`) call the collection functions and pass
the result straight through — TypeScript will enforce the new types automatically.

## Non-Goals
- The "Scry" wheel slot now triggers temporary observation (see `2026-03-17-scry-observation-design.md`). It no longer opens the court overlay.
- Agent dots are already rendered above the fog layer (always visible). This change affects hex-level fog only (terrain and location revelation).
- Rank-based base ranges are out of scope for this iteration.

## NFP Compliance Summary

| # | Priority | Verdict |
|---|----------|---------|
| 1 | Tunability | PASS — Four named constants, all independently tunable. |
| 2 | Inspectability | PASS — `LOSRecalcTrace` breaks down source counts per type. |
| 3 | Determinism | PASS — LOS is a pure function of positions + ranges. No randomness. |
| 4 | Fail-soft | PASS — Missing hexes, missing agents, negative ranges all handled gracefully. |
| 5 | Narrative | PASS — Court = permanent divine sight. Scry = temporary god-vision. Both are thematically coherent. |
| 6 | Additive | PASS — Adds scry observation source alongside existing sources. No existing sources removed. |
| 7 | Performance | PASS — At most 3 scry sources added to existing pipeline. Deduplication is O(sources). |
