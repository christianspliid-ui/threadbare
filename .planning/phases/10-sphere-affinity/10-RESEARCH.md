# Phase 10: Sphere Affinity — Research

**Researched:** 2026-03-28
**Domain:** Per-entity sphere scores, pressure resolution, triangle number scale, IPK prose keywords, magic/overchannel
**Confidence:** HIGH — all integration points verified against current codebase

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Data model**
- `SphereAffinity` = `{ scores: Record<SphereName, number>, progress: Record<SphereName, number> }` on every entity's graph node properties
- 8 creation spheres only (force, matter, energy, life, mind, spirit, time, entropy)
- Triangle number scale: level N costs N from N−1. Total to reach N = N×(N+1)/2. Max 10.
- All entities use same structure — hexes, agents, artifacts, locations, factions, cultures

**Pressure system**
- Tick accumulator pattern (like `pendingHexMutations`)
- Opposition cancellation, allied defense (50% rounded down), threshold comparison, erosion, cumulative construction
- No opposition echo — homeostasis, not runaway
- Agent presence = temporary buffer, not permanent change

**Magic**
- Power = caster + location − opposition. NO cap on location draw.
- Overchannel excess damages caster permanently. Always a choice, never forced.

**UI**
- IPK prose keywords: bold + underline + sphere-colored, tooltippable. Never show numbers.
- Full spec: `Docs/ui-patterns.md § 19`

**Global World-Soul**
- Derived aggregate, not independent register
- FundamentState.sphereWeights populated for backward compat
- Foundation axes = global-only

### Claude's Discretion
- Accumulator implementation details (array on GameState vs TickContext parameter)
- Graph property storage strategy
- Aggregate caching
- IPK component internals
- Debug panel layout

### Deferred Ideas (OUT OF SCOPE)
- Army/NPC/monster affinity (M2/TB-069)
- Terrain drift from sphere imbalance
- Spell lists, mana pools
- Per-entity foundation axes
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SPHR-01 | `SphereAffinity` type defined with `scores` and `progress` for all 8 creation spheres | New type in `src/types/worldSoul.ts` alongside existing `FundamentState` |
| SPHR-02 | All entity graph nodes gain `sphereAffinity` in their properties | `GraphNode.properties: Record<string, unknown>` is extensible — add during init |
| SPHR-03 | Starting sphere scores seeded from terrain type (hexes), archetype (agents), type bias (locations) | Terrain table in design doc; archetype scores derivable from existing `sphereAlignment` on agents |
| SPHR-04 | `SpherePressureEvent` type and accumulator on GameState | Precedent: `pendingHexMutations?: HexMutation[]` on `GameState` — same pattern |
| SPHR-05 | Opposition cancellation resolves 4 pairs before threshold comparison | Use existing `SPHERE_OPPOSITES` from `src/engine/cosmology.ts` |
| SPHR-06 | Allied defense adds 50% of ally score to threshold | Use existing `SPHERE_ALLIES` from `src/engine/cosmology.ts` |
| SPHR-07 | Erosion reduces permanent score, resets progress | Standard arithmetic on `SphereAffinity.scores` and `.progress` |
| SPHR-08 | Construction accumulates in progress, levels up at triangle cost | `TRIANGLE_COST(n) = n` utility function |
| SPHR-09 | `phaseSpherePressure` at orchestrator position 9.5 consumes and resolves all pressure | Insert in `runTick()` between phaseHexState (9) and phaseMagicalSaturation (9.2) |
| SPHR-10 | `phaseSphereAggregation` at 9.6 computes global aggregate | New phase after pressure resolution |
| SPHR-11 | 6 upstream phases push `SpherePressureEvent`s to accumulator | Modify: action progress, encounter progression, doom, rivals, control effects, mandate |
| SPHR-12 | Prosperity sphere modifier injected into `computeEquilibriumTarget()` | Existing function in `phaseProsperity.ts` — add sphere term to inputs |
| SPHR-13 | Encounter resonance modifier injected into `scoreAndSelect()` | Existing function in `encounterScoring.ts` — add location sphere score term |
| SPHR-14 | Agent decision sphere influence injected into `resolveProfile()` | Existing function in `phaseAgentDecision.ts` — add sphere-derived axiological shift |
| SPHR-15 | `FundamentState.sphereWeights` derived from aggregate | Backward compat — normalize aggregate into 0–1 weights |
| SPHR-16 | Foundation axes computed from aggregate (global-only) | New function: map sphere totals to chaos↔order, light↔darkness |
| SPHR-17 | `ProseKeyword` React component: bold, underline, sphere-colored, tooltippable | New component, spec in `Docs/ui-patterns.md § 19` |
| SPHR-18 | Concept tooltip registry for all 8 creation spheres + 4 foundations | Content in design doc § M1.3 |
| SPHR-19 | `WorldSoulIndicator` prose status line in top bar | Reads `worldSoul.aggregate`, selects prose by dominant sphere + intensity |
| SPHR-20 | HexChronicle Soul layer paragraph | Per-hex prose from sphere scores, with IPK keywords |
| SPHR-21 | Action preview prose shows sphere consequences | Uses target hex sphere scores + action sphereAffinity |
| SPHR-22 | Debug panel Sphere State tab with raw numbers | New tab, dev-only |
| SPHR-23 | `computeEffectivePower()` for magic — caster + location − opposition | New pure function |
| SPHR-24 | Overchannel: excess beyond caster score applied as self-pressure | Reuses pressure resolution from SPHR-05..08 |
| SPHR-25 | Agent AI overchannel decision with seeded PRNG | Probability-based, personality-modified |
| SPHR-26 | `sphere_pressure` traces emitted for every resolution | New trace category |
| SPHR-27 | Agent presence buffer adds to hex effective threshold | Computed at resolution time, not stored |
</phase_requirements>

---

## Technical Research

### Existing Sphere Infrastructure

**`SphereName` type** — Already defined in `src/types/index.ts`:
```typescript
export const SPHERE_NAMES = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'] as const;
export type SphereName = typeof SPHERE_NAMES[number];
```
This is the creation sphere set. Use `SphereName` for `SphereAffinity.scores` keys — no new type needed.

**Sphere relationships** — Already defined in `src/engine/cosmology.ts`:
```typescript
export const SPHERE_ALLIES: Record<SphereName, SphereName | null>
export const SPHERE_OPPOSITES: Record<SphereName, SphereName | null>
```
These are the exact lookup tables needed for opposition cancellation and allied defense.

**Sphere colors** — Already defined in `Docs/design-system/tokens.md` and `src/data/sphereColors.ts`:
```
Force: #ff4444 / #ff6b6b    Matter: #8b6b4a / #a8886a
Energy: #ffd700 / #ffe44d   Life: #00cc55 / #33ff77
Mind: #2288ff / #44aaff      Spirit: #aa44dd / #cc66ff
Time: #ff9933 / #ffb355      Entropy: #5a8a7a / #7aaa9a
```
IPK `ProseKeyword` component uses these for colored text.

### Graph Node Extension Pattern

`GraphNode.properties` is `Record<string, unknown>` — fully extensible. Current usage stores typed data as properties:
- Hexes: `properties.terrain`, `properties.elevation`, `properties.corruption`, etc.
- Agents: `properties.sphereAlignment`, `properties.movementState`, etc.
- Locations: `properties.prosperity`, `properties.unrest`, etc.

**Pattern:** Add `sphereAffinity: SphereAffinity` to `properties` during initialization. Type-narrow with helper: `getNodeSphereAffinity(node: GraphNode): SphereAffinity | undefined`.

### Accumulator Precedent

`GameState.pendingHexMutations?: HexMutation[]` is the exact pattern:
- Upstream phases push mutations during their execution
- `phaseHexState` at position 9 consumes and clears the array
- Array lives on `GameState`, cleared at consumption

**Apply same pattern:** Add `pendingSpherePressures?: SpherePressureEvent[]` to `GameState`. Upstream phases push. `phaseSpherePressure` at 9.5 consumes and clears.

### Orchestrator Insertion

`runTick()` in `src/engine/orchestrator.ts` is a sequential function with phases called in order. Current sequence around the insertion point:

```
... phaseHexState (9) → phaseUnrest (9.1) → phaseMagicalSaturation (9.2) → ...
```

Insert `phaseSpherePressure` at 9.5 and `phaseSphereAggregation` at 9.6 — after all producers have run, before influence tier promotion (10).

### Downstream Injection Points

**Prosperity** — `phaseProsperity.ts` has `computeEquilibriumTarget()` that sums 6 inputs. Add a 7th input: sphere modifier from location's Life/Energy/Entropy scores.

**Encounter scoring** — `encounterScoring.ts` has `scoreAndSelect()` with additive scoring. Add sphere resonance term: location sphere alignment with encounter sphere.

**Agent decision** — `phaseAgentDecision.ts` has `resolveProfile()` that builds axiological profile from agent data + divine influence overlay. Add sphere-derived axiological shift after existing overlays.

### Triangle Number Scale

```typescript
/** Cost to advance from level n-1 to level n */
function triangleCost(n: number): number { return n; }

/** Total investment to reach level n from 0 */
function triangleTotal(n: number): number { return n * (n + 1) / 2; }
```

Level progression: 0→1 costs 1, 1→2 costs 2, 2→3 costs 3, ... 9→10 costs 10. Total to reach 10 = 55.

### Existing `sphereAffinity` on Action Templates

`UnifiedActionTemplate` already has `sphereAffinity?: SphereName` — this determines which sphere an action channels. The pressure system uses this to decide which sphere pressure to emit on action resolution.

### Existing `sphereAlignment` on Agents

Agents already have `properties.sphereAlignment: CosmologyProfile` (8 floats summing to 1.0). This is the *global* cosmology profile — not per-sphere integer scores. The new `SphereAffinity` is separate. Starting agent sphere scores can be derived from which sphere has highest weight in their `sphereAlignment`.

---

## Implementation Wave Structure (Recommended)

The design doc specifies 7 implementation steps. These map to 4 GSD waves:

| Wave | Steps | Focus | Autonomous? |
|------|-------|-------|-------------|
| 1 | Steps 1–2 | Data model + pressure engine | Yes — pure types and functions, no UI |
| 2 | Steps 3–4 | Upstream wiring + downstream modifiers | Yes — modify existing phases |
| 3 | Step 5 | Aggregation + backward compat | Yes — new phase + derived state |
| 4 | Steps 6–7 | UI (IPK, indicators, debug) + magic/overchannel | Partially — needs human visual verification |

Wave 1 is the foundation. Waves 2–3 can potentially parallelize. Wave 4 needs human eyes on the IPK rendering and prose output.

---

## Summary

Phase 10 builds the universal sphere affinity system — the connective tissue between all game systems. The technical approach is conservative: extend existing graph nodes with a new property, use the established accumulator pattern for pressure collection, insert two new orchestrator phases at known safe positions, and inject modifiers into existing functions at verified injection points. The sphere relationship lookups (`SPHERE_ALLIES`, `SPHERE_OPPOSITES`) and sphere colors are already built. The primary new code is the pressure resolution algorithm (opposition cancellation + allied defense + threshold comparison + erosion/construction) and the IPK component for prose communication.

The design is fully specified in `Docs/plans/2026-03-28-world-soul-connection-design.md` with constants tables, trace schemas, fail-soft tables, and wiring section. The RESEARCH phase confirms all integration points exist in the current codebase.
