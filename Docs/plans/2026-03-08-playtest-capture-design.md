# Playtest Capture System — Design

**Date:** 2026-03-08
**Status:** Approved

## Problem

~21,000 lines of engine code with zero structured playtesting. Can't evaluate narrative quality, pacing, agent behavior, or system balance without seeing actual output. The existing DebugPanel + trace buffer provides in-session inspection, but there's no way to run a batch simulation and review the output as a document.

## Decision: Headless Playtest Runner

A Node script (`scripts/playtest.ts`) that imports engine modules directly (no React, no browser), runs N ticks, and dumps a structured markdown report.

### Key Design Decisions

1. **Build on the trace buffer.** The trace system (5 categories: action_selection, narrative_generation, context_harvest, dilemma_resolution, tick_summary) is already instrumented. The playtest runner enables tracing, runs ticks, then formats the buffer — no duplicate instrumentation.

2. **Extract `initializeGameState` from GameView.tsx.** Currently game initialization is trapped inside a React component. Extract to `src/engine/gameInit.ts` as a pure function. This serves double duty: needed for headless runner AND is the first step of the Priority 2 GameView decomposition.

3. **Output is markdown, not JSON.** The whole point is human review — reading the narrative, spotting dead stretches, noticing repetitive prose. Markdown renders nicely and is diffable across seeds.

4. **Three-section report structure:**
   - **Dashboard** (quick scan): seed, tick count, doom progression table, essence curve, mandate progress, agent count, culture distribution, key metrics at snapshot intervals
   - **Narrative Log** (is this interesting?): all chronicle entries and notable+ events chronologically, grouped by tick ranges, with significance scores
   - **Trace Deep-Dive** (why did that happen?): full trace buffer formatted by category — action selection pipelines, dilemma resolutions, context harvests, narrative generation details

5. **Multi-seed comparison mode.** `--seeds 42,7,100` runs all three and produces separate reports plus a comparison summary (which seed had most events, fastest doom, most dilemmas, etc.).

6. **Snapshot intervals.** Every 10 ticks (configurable), capture: agent count, doom stage, essence totals, mandate progress, reputation distribution (min/median/max), active cultures.

## Interface

```bash
# Single seed, 50 ticks (default)
npm run playtest

# Custom seed and tick count
npm run playtest -- --seed 42 --ticks 100

# Multi-seed comparison
npm run playtest -- --seeds 42,7,100 --ticks 100

# With snapshot interval override
npm run playtest -- --seed 42 --ticks 200 --interval 20
```

Output: `Docs/playtests/YYYY-MM-DD-seed-{N}.md`

## Extracted Module: `src/engine/gameInit.ts`

Pure function, no React dependencies:

```typescript
export function initializeGameState(
  archetype: AscendantArchetype,
  avatarName: string,
  cosmology: CosmologyProfile,
  seed: number,
): { state: GameState; tiles: HexTile[] }
```

GameView.tsx imports and calls this instead of its inline version. Zero behavior change.

## What This Does NOT Do

- No browser automation or screenshots
- No LLM-based narrative quality scoring (that's a future enhancement)
- No automated pass/fail — this is a review artifact for humans
- No modification of the trace buffer API — consumes it as-is
