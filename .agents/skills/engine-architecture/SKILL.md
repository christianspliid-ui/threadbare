---
name: engine-architecture
description: >
  Use when writing engine modules, tick loop logic, resolution systems, action pipelines,
  tracing, PRNG usage, or any code that lives in src/engine/. Triggers on "engine",
  "tick loop", "sigmoid", "resolution", "trace", "PRNG", "Maslow", "action pipeline",
  "graph op", "fail-soft", or when implementing systems described in Obsidian vault notes.
---

# Engine Architecture — Domain Context

> **Prerequisite:** Load `state-of-game-design` first for foundational context.

This skill provides the deep engine context that the root CLAUDE.md intentionally omits to keep context lean. Load this before writing or modifying any engine code.

## Inspectability: The Trace System

All engine modules that make decisions or generate content **must** emit structured traces via `emitTrace()` from `src/engine/traceBuffer.ts`.

**3-step recipe for new trace categories:**
1. Define the trace interface (what data to capture)
2. Add it to the trace union type
3. Call `emitTrace()` at the decision point

The **debug panel** (backtick key in-game) is the primary inspectability tool. If you can't see a decision or outcome in the panel, it's not inspectable. Verify new traces appear there before considering the feature complete.

**Principles:**
- Flat state objects (loggable, diffable)
- Pure functions (testable in isolation)
- Causal event trails — every outcome must be traceable to its inputs
- No hidden state in closures or singletons

## Determinism: Seeded PRNG

Every random decision uses the seeded PRNG. Never use `Math.random()`.

- Same seed + same inputs = same outputs
- Essential for debugging: "broke on seed 42 tick 300"
- Essential for replay: "I liked seed 7, let me tweak doom speed and replay"
- The PRNG is the single source of randomness in the engine

## Resolution: Shared Resolution Service (Phase 2)

The single authoritative resolution system lives in `src/engine/resolutionService.ts`. All callers (unified actions, legacy encounters, planner forecast) use the same math.

**Pipeline:**
1. Gather domain capability scores for the relevant Reach (sigmoid → 0-1)
2. Build `ResolutionInput` with normalized difficulty (`0..1`), capability, sphereFactor, modifiers
3. `computeResolutionThreshold(inputs)` → probability clamped to `[0.05, 0.95]`
4. `resolveAction(inputs, rng)` → roll d100 → classify outcome

**Canonical difficulty normalization:** All callers provide `difficulty` in `0..1`. Legacy encounters use `normalizeLegacyDifficulty()` at their boundary (divides integer difficulty by 100). Unified actions pass through directly.

**Crit model (doubles-based, Phase 2):**
- Doubles (11, 22, 33, ..., 99) determine crits
- Doubles at or under threshold = `critical_success`
- Doubles over threshold = `critical_failure`
- Crit frequency scales with competence (replaces old flat `roll ≥ 96` tail)

**Outcome ladder:** `critical_success | success | success_at_cost | failure | critical_failure`
(`success_at_cost` exists in the contract for Phase 3 expansion)

**Forecast/live parity:** `forecastAction(inputs)` and `resolveAction(inputs, rng)` use the same threshold and crit rules. No planner-only offsets.

**Key files:**
- `src/engine/resolutionService.ts` — shared resolver (authoritative)
- `src/engine/resolution.ts` — legacy low-level implementation (still used by contestation)
- `src/types/resolution.ts` — `ResolutionInput`, `OutcomeType`, `ResolutionResult`, `ResolutionRollBreakdown`, `ResolutionProbabilitySummary`

## Quintessence: Current/Max Model (Phase 2)

Actor-level quintessence is a reserve/capacity system:
- `quintessence` — current reserve (0 to `quintessenceMax`)
- `quintessenceMax` — durable capacity / power ceiling (defaults to 1.0)
- Passive regen fills toward `quintessenceMax` per tick
- 5 threshold states derived from ratio (`quintessence / quintessenceMax`):
  - `healthy` (>50%), `strained` (25-50%), `weakened` (10-25%), `critical` (0-10%), `broken` (0)
- Threshold transitions emit balance telemetry events

**Quintessence pressure:** Encounter failure pushes erosion into `pendingQuintessenceEvents` (live non-player pressure seam). The `phaseQuintessence` tick phase processes all pending events.

**Spend/resist hooks** (`src/engine/quintessenceActions.ts`):
- `canSpendQuintessence(node, kind)` / `spendQuintessence(node, kind, source, tick)`
- `getPushModifier(node)` — probability bonus from push spend
- `canResistOutcome(node)` / `applyResistOutcome(node, source, tick)`
- Phase 2 implements the contract; full content wiring is Phase 3+

**Balance telemetry:**
- `quintessence_changed` events with `reason: 'pending_event' | 'passive_regen' | 'encounter_failure_by_band'`
- Per-band loss tracked in `BalanceCounters.quintessenceLossByBand`
- Summary exposes `lossPerEncounterByBand`, `thresholdTransitions`, `totalNegativeDelta`, `totalPositiveDelta`

**Key files:**
- `src/types/quintessence.ts` — types, constants, threshold helpers
- `src/engine/phaseQuintessence.ts` — tick phase (regen, event processing, dissolution)
- `src/engine/quintessenceActions.ts` — spend/resist hooks, encounter failure erosion

## Fail-Soft Tick Loop

The tick loop must **never crash**. Defensive coding at all boundaries:
- Missing data → graceful fallback (idle action, placeholder prose, skip)
- Never throw exceptions that kill the game
- Validate inputs at module boundaries, trust data within
- Every fallback should emit a trace so it's visible in the debug panel

## Action Selection: Maslow Pipeline

Agents use a six-layer Maslow-inspired pipeline (survival → self-actualization). Key rules:
- Higher layers only activate when lower needs are met
- No utility-function AI, no behaviour trees — those are rejected approaches
- Action selection feeds into the CRUD action template system

## Action System

> Covered by `state-of-game-design`. Load that skill first for the full action system context (5 verbs, 119+ templates, targeting pipeline).

## Generalized Action Targeting

The action pipeline uses `TargetContext` → `getTargetActionSlots()` → `ActionDrawer`:
- Any graph node the player focuses on becomes an action target
- Templates declare `targetCategories` and `targetSubtypes` for filtering
- Filtering cascade: node-type → subtype → traits → sphere → essence → range
- Detail views construct `TargetContext` from their focused node
- Design doc: `Docs/plans/2026-03-17-generalized-action-targeting-design.md`

## Hex Mutations

Hexes aren't graph nodes — they live in `GameState.tiles[]`. Hex actions produce `HexMutation[]` instead of `GraphOp[]`:
- `HexMutation { col, row, field: 'divineInfluence' | 'corruption', delta, source }`
- Applied in `phaseHexState` tick phase
- Terrain transformation is threshold-based via lookup table
- Design doc: `Docs/plans/2026-03-17-world-state-and-hex-actions-design.md`

## Control Actions (Design Phase)

A 5th action verb beyond CRUD: sustained actions requiring ongoing resources/focus/stability.
- Control slots scale with Domain Capability tier
- Three sustain models: essence drain, state threshold, ritual investment
- Active controls spawn visible encounter nodes that rivals can contest
- Prerequisites: Reach tier + Sphere alignment gate who can see/attempt contestation
- Brainstorm: `Docs/plans/2026-03-17-brainstorm-hex-actions-and-control-mechanic.md`

## Module Conventions

- **Tunability:** Group constants at the top of each module or in the type file. Every magic number gets a name.
- **Additive changes:** Prefer adding new fields/functions over modifying existing ones. Old tests keep passing.
- **Performance:** Profile before optimizing. The spotlight tier system handles fidelity scaling architecturally.

## Key Source Paths

- `src/engine/` — core engine modules
- `src/engine/traceBuffer.ts` — trace emission system
- `src/engine/types/` — shared type definitions
- Obsidian vault for system specs: read `Index.md` first, follow wikilinks

## Content-Facing Capability Check

**After implementing** any engine change that adds or modifies capabilities content authors use, update the **systemic wiring guide** (`Docs/plans/2026-04-16-systemic-wiring-guide.md`). This is a Definition of Done requirement.

Content-facing capabilities include: new effect types in `effects.ts`, new graph operations in `strategicGraphOps.ts`, new enrichment placeholders in `proseEnrichment.ts`, new aftermath reaction kinds in `unifiedAction.ts`, new template fields in `encounter.ts`, new scoring signals in `encounterScoring.ts` or `agent-behavior-constants.ts`. If content authors don't know a capability exists, they won't use it — and the game gets hardcoded prose instead of systemically alive content.

**Ask yourself:** "Does this change give content authors a new tool for making encounters dynamic?" If yes, the wiring guide needs a new entry or an updated entry.

## Design Assessment for Engine Work

Before implementing any new engine system or significant engine change, verify the design document includes an NFP audit. If no audit exists, write one before coding.

### Engine-specific NFP checklist

| NFP | What to verify for engine work |
|-----|-------------------------------|
| Tunability | Every threshold, rate, cost, bonus, and cap has a named constant at module top or in a shared constants file. No inline numbers. |
| Inspectability | New phase functions emit structured traces via `emitTrace()`. Composite calculations trace each component, not just the result. New trace categories are added to the debug panel. |
| Determinism | Every branching decision uses seeded PRNG. PRNG instances are scoped per context (no shared state). Verify: same seed + same tick = same output. |
| Fail-soft | Every function has explicit fallback for missing nodes, missing properties, removed edges. Pattern: `if (!x) return []` or `return defaultValue`. Never throw. Emit trace on fallback. |
| Narrative > mechanical | When a mechanic produces a weird narrative outcome, adjust the mechanic. Don't sacrifice story coherence for elegant math. |
| Additive | New properties/fields/functions, not renames or removals. Existing tests keep passing without modification. |
| Performance | Global-tick systems (anything that processes all entities) flagged for future profiling. Use spotlight tier system for per-entity fidelity. |

### Constants convention

Group all tuning constants at the top of the module file, exported and documented:

```typescript
/** How much prosperity changes per tick, clamped to this range */
export const PROSPERITY_DELTA_CLAMP = 10;
```

### Trace convention

Every new phase or resolver emits at least one trace type. Define the trace interface alongside the implementation:

```typescript
interface ProsperityTickTrace {
  type: 'prosperity_tick';
  locationId: string;
  baseIncome: number;
  tradeBonus: number;
  disruptionPenalty: number;
  netDelta: number;
  newProsperity: number;
  tierChanged: boolean;
}
```
