# High House Line-of-Sight Design

**Date:** 2026-03-11
**Status:** Approved

## Problem

All three fog-of-war sight-range constants in `src/types/visibility.ts` are placeholder zeroes.
As a result:
- The avatar reveals only the exact hex they stand on (range 0 = 1 hex)
- Retinue agents and scry court (High House) agents contribute nothing meaningful
- Players cannot follow their High House agents' journeys through the world

Additionally, `getScryTargetHexes` discards agent IDs, so scry targets use a flat constant
and cannot benefit from the modifier pipeline (traits, items, terrain) the way retinue
agents already do.

## Design

### Goal
All agents assigned to the player's High House (Scry Court positions) permanently share
line of sight with the player — their current hex is always revealed in the fog of war,
following them as they move. Traits, items, and terrain modifiers can increase or decrease
their individual sight contribution.

### Sight Range Constants (tunable numbers)
| Constant | Old | New | Meaning |
|---|---|---|---|
| `AVATAR_SIGHT_RANGE` | 0 | 3 | Hexes around the avatar revealed as they walk |
| `AGENT_SIGHT_RANGE` | 0 | 2 | Base sight for retinue agents (worships-edge tier ≥ 1) |
| `SCRY_SIGHT_RANGE` | 0 | 2 | Base sight for High House court agents |

These are named constants — tuning game feel means changing a number, not rewriting logic.

### New Type: `ScryTarget`
Currently `getScryTargetHexes` returns `HexCoord[]`, silently dropping the agent ID.
A new `ScryTarget` interface carries both:

```ts
export interface ScryTarget {
  coord: HexCoord;
  agentId: string;
}
```

### Modifier-Aware Scry Range
`collectLOSSources` already calls `getModifiedValue(graph, agentId, 'los_range', AGENT_SIGHT_RANGE)`
for retinue agents. Scry targets will use the same call with `SCRY_SIGHT_RANGE` as the base.
An agent with an "Eagle-Eyed" trait or a mountain-terrain bonus will contribute more sight;
a dense-forest penalty will reduce it. No new modifier infrastructure is needed.

## Files Changed

| File | Change |
|---|---|
| `src/types/visibility.ts` | Bump constants; add `ScryTarget` interface; import `HexCoord` |
| `src/engine/visibility.ts` | `getScryTargetHexes` → returns `ScryTarget[]`; `collectLOSSources` uses modifier pipeline for scry |
| `src/engine/orchestrator.ts` | `runTick` param `scryTargets` typed as `ScryTarget[]` |
| `src/engine/__tests__/visibility.test.ts` | New `getScryTargetHexes` test; update scry-target assertion |
| `src/engine/__tests__/visibility-modifiers.test.ts` | Replace static-range scry test with modifier-aware test |

React hooks (`useSimulation.ts`, `useViewNavigation.ts`) call `getScryTargetHexes` and pass
the result straight through — TypeScript will enforce the new type automatically, no manual
edits needed unless the compiler complains.

## Non-Goals
- The "Scry" wheel slot remains a UI navigation button (opens High House overlay). It does
  not independently tag agents for LoS. All LoS comes from court assignments.
- Agent dots are already rendered above the fog layer (always visible). This change affects
  hex-level fog only (terrain and location revelation).
- Rank-based base ranges are out of scope for this iteration.
