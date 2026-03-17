---
name: engine-architecture
description: >
  Use when writing engine modules, tick loop logic, resolution systems, action pipelines,
  tracing, PRNG usage, or any code that lives in src/engine/. Triggers on "engine",
  "tick loop", "sigmoid", "resolution", "trace", "PRNG", "Maslow", "action pipeline",
  "graph op", "fail-soft", or when implementing systems described in Obsidian vault notes.
---

# Engine Architecture — Domain Context

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

## Resolution: Sigmoid Pool → d100

The unified resolution system:
1. Gather domain capability scores for the relevant Reach
2. Feed through sigmoid curve to produce a probability (0-1)
3. Roll d100 against that probability
4. No alternative dice systems, no special-case resolution

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

## CRUD Action System

The unified action lifecycle:
- GraphOp executor processes graph mutations
- Template enrichment adds narrative flavor via the Reach system
- Fail-soft batch execution ensures no single bad action kills the tick
- 36 enriched templates across the Nine Reaches

## Module Conventions

- **Tunability:** Group constants at the top of each module or in the type file. Every magic number gets a name.
- **Additive changes:** Prefer adding new fields/functions over modifying existing ones. Old tests keep passing.
- **Performance:** Profile before optimizing. The spotlight tier system handles fidelity scaling architecturally.

## Key Source Paths

- `src/engine/` — core engine modules
- `src/engine/traceBuffer.ts` — trace emission system
- `src/engine/types/` — shared type definitions
- Obsidian vault for system specs: read `Index.md` first, follow wikilinks

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
