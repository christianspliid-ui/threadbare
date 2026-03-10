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
