# THR-133 — Move `emitTrace` out of the `setGameState` updater (StrictMode dedup)

**Status:** Ready for Dev
**Project:** Encounter Format Migration
**Parent issue:** THR-112 (shipped — hidden mark reveal loop)
**Parallel-safe with:** THR-143 (no file overlap)
**Date:** 2026-04-18

## Problem

React 18 `<StrictMode>` (wired in `src/main.tsx`) intentionally double-invokes every `setGameState` updater function in development. Any side effect inside the updater fires twice.

`consumeMatchingMarks()` (`src/engine/hiddenMarks.ts`) calls `emitTrace()` when a hidden mark is probabilistically consumed. The call site is inside the `setGameState(prev => {...})` updater in `handleEncounterAftermathReaction` (`src/components/Game/GameView.tsx` line 1959). Consequence: every `hidden_mark_revealed` trace shows up twice in the dev debug panel, which misleads anyone using tracing to audit reveal frequency or debug the new THR-112 reveal loop.

Production is unaffected — `emitTrace` short-circuits when tracing is disabled (default in prod), and nothing user-visible is double-written. But tracing is the primary inspection surface for engine debugging (NFP #2), so a noisy trace stream is a regression in inspectability.

A matching bug exists in `applyEncounterAftermathReaction` (`src/engine/encounterAftermath.ts`) — 101 internal `emitTrace` calls, all reachable through the same `setGameState` updater. We scope this fix to the hidden-mark path and track the aftermath path as a follow-up (see Deferrals).

## Load-bearing context

- **Precedent already in the codebase.** THR-114 introduced the pattern of a mutable "pending" object written inside the updater and consumed outside. `pendingAftermathMutations` in `GameView.tsx` lines 1917, 1931–1933, 1977–1979 is exactly this — we reuse the shape.
- **Pure state math is fine.** The updater's state transforms (`tickEvents`, `recentEvents`, `hiddenMarks`) are idempotent — StrictMode produces the same `next` from the same `prev` both invocations, so React discards one copy and state stays correct. Only emitter-style side effects (trace buffer, analytics) double-fire.
- **Trace buffer is append-only with LRU.** `BUFFER_SIZE = 500` in `src/engine/traceBuffer.ts` — duplicate entries waste a slot and shift the eviction window. Not just a cosmetic issue.
- **Fail-soft is non-negotiable.** Existing code wraps `emitTrace` in `try/catch` (hiddenMarks.ts line 194–207). The refactor must preserve that guarantee — a trace-buffer failure must never block mark consumption or state transition.

## Fix approach — Option E: pass an optional `tracesOut` array

The cleanest fix at this scope: let the pure engine functions collect traces into a caller-provided array when invoked from inside an updater, and keep direct-emit behavior as the default so non-updater callers are unchanged.

### Engine pillar

#### `src/engine/hiddenMarks.ts`

Add an optional `tracesOut?: PendingTrace[]` parameter to the two functions that emit traces today:

```ts
type PendingTrace = Parameters<typeof emitTrace>[0];

export function revealHiddenMark(
  state: GameState,
  markId: string,
  tick: number,
  revealedBy: string,
  tracesOut?: PendingTrace[],                       // NEW — optional
): GameState {
  const mark = (state.hiddenMarks ?? []).find(m => m.markId === markId);
  if (!mark) return state;
  const entry: PendingTrace = {
    tick,
    category: 'hidden_mark_revealed',
    agentId: mark.targetAgentId,
    markId,
    actorId: mark.targetAgentId,
    revealedBy,
    ticksSincePlacement: tick - mark.placedTick,
    summary: `Hidden mark revealed: "${mark.label}" on ${mark.targetAgentId} by ${revealedBy}`,
  };
  if (tracesOut) {
    tracesOut.push(entry);
  } else {
    try { emitTrace(entry); } catch { /* fail-soft (NFP #4) */ }
  }
  return removeHiddenMark(state, markId);
}

export function consumeMatchingMarks(
  state: GameState,
  agentId: string | undefined,
  templateId: string | undefined,
  tick: number,
  tracesOut?: PendingTrace[],                       // NEW — optional
): GameState {
  // ... existing body, replace the inline emitTrace({...}) block at line 194 with:
  const entry: PendingTrace = {
    tick,
    category: 'hidden_mark_revealed',
    agentId: mark.targetAgentId,
    markId: mark.markId,
    actorId: mark.targetAgentId,
    revealedBy: templateId,
    ticksSincePlacement: tick - mark.placedTick,
    summary: `Hidden mark revealed: "${mark.label}" on ${mark.targetAgentId} by ${templateId}`,
  };
  if (tracesOut) {
    tracesOut.push(entry);
  } else {
    try { emitTrace(entry); } catch { /* fail-soft */ }
  }
  // ... rest unchanged (chronicle event, state slice)
}
```

Delete the `// TODO(THR-133): ...` comment on line 210.

Keep the `try/catch` wrapper on the direct-emit branch only — the push-to-array branch cannot throw (array access is infallible).

#### Optional helper (small quality-of-life, not required)

```ts
// src/engine/hiddenMarks.ts
export function flushTraces(traces: PendingTrace[]): void {
  for (const t of traces) {
    try { emitTrace(t); } catch { /* fail-soft */ }
  }
}
```

Callers then do `flushTraces(pendingTraces)` after `setGameState` returns. If CC prefers inlining the loop, that's fine — the helper is cosmetic.

### UI pillar

#### `src/components/Game/GameView.tsx` — `handleEncounterAftermathReaction`

Mirror the THR-114 shape. Add a `pendingTraces` array alongside `pendingAftermathMutations`, pass it into `consumeMatchingMarks`, flush after the updater.

```ts
const handleEncounterAftermathReaction = useCallback((reactionId: string) => {
  // ... existing early returns + suppression logic ...

  // THR-114: mutable mutations surfaced out of the updater
  const pendingAftermathMutations = { touchedWorld: false, touchedStructure: false };
  // THR-133: trace records collected in-updater, emitted outside (StrictMode-safe)
  const pendingTraces: PendingTrace[] = [];

  setGameState(prev => {
    // ... existing activeAction lookup ...
    const { state: nextState, mutationSummary: reactionMutations } =
      applyEncounterAftermathReaction(prev, activeAction, reaction, prev.tick, runtime);
    pendingAftermathMutations.touchedWorld = reactionMutations.touchedWorld;
    pendingAftermathMutations.touchedStructure = reactionMutations.touchedStructure;

    // ... existing promotion block (unchanged) ...

    const afterMarks = consumeMatchingMarks(
      stateAfterPromotion,
      activeAction?.actorId,
      activeAction?.templateId,
      prev.tick,
      pendingTraces,                                  // NEW
    );
    observeResolutionIntelligence(afterMarks, activeAction, reaction, prev.tick);
    return { ...afterMarks, encounterNotifications: /* unchanged */ };
  });

  // THR-133: flush traces AFTER setGameState (StrictMode-safe)
  flushTraces(pendingTraces);
  // THR-114: touches (existing)
  if (pendingAftermathMutations.touchedStructure) touchStructure(runtime);
  else if (pendingAftermathMutations.touchedWorld) touchWorld(runtime);

  if (reaction.closeAfterSelection ?? true) {
    closeEncounterModalAndResume(tieredEncounterState.openedAsInterrupt);
  }
}, [...]);
```

Import `PendingTrace` (export the type alias from `hiddenMarks.ts`) and `flushTraces`.

**No other call sites need to change.** `revealHiddenMark` has exactly one callsite (itself, re-exported) and `consumeMatchingMarks` has exactly one callsite (`GameView.tsx`). The optional parameter preserves backward compatibility for any future caller that isn't inside an updater (e.g. engine tick phases — those already run outside React's state machine).

### Content pillar

**N/A.** Pure infrastructure change. No encounter templates, no prose, no data tables touched.

### Constants

None added. Existing constants untouched.

### Traces emitted

Unchanged in content — same `hidden_mark_revealed` category, same payload shape. Only the *when* moves from "inside updater" to "right after updater returns". Trace `id` / `timestamp` are assigned by `emitTrace` at flush time, which is the correct moment anyway (closer to human wall-clock perception of the event).

## Fail-soft table

| Branch | Failure case | Behavior |
|---|---|---|
| `tracesOut` provided | `tracesOut.push` can't fail on a plain array | No throw path. |
| Default direct emit | `emitTrace` throws (buffer bug) | `try/catch` swallows — state transition still completes. |
| `flushTraces` post-updater | `emitTrace` throws on one entry | Remaining entries still flush (per-entry `try/catch`). |
| StrictMode double-invoke of updater | Updater pushes to `pendingTraces` twice | Second invocation's array reference is a fresh local (captured at handler-call time, not updater-call time), so both invocations push into the same array. **Mitigation:** the outer handler scope runs once per user reaction; React's StrictMode only double-invokes the *updater function*, not the enclosing `useCallback` body. The `pendingTraces = []` and `flushTraces` calls each fire exactly once per user click. See Strict Mode note below. |

### Strict Mode correctness — why one flush emits once

`handleEncounterAftermathReaction` is the event handler. React calls it once per user click. Inside it:

1. `const pendingTraces: PendingTrace[] = []` — runs once.
2. `setGameState(prev => /* ... pushes to pendingTraces ... */)` — the updater runs twice under StrictMode. Both invocations push into the **same** array (closed over), so after `setGameState` returns, `pendingTraces.length === 2 * N`.
3. `flushTraces(pendingTraces)` — runs once, but emits 2N traces. **This is still wrong.**

To get exactly N, we must ensure the updater is idempotent with respect to trace collection. Two options:

**Option 1 — dedupe by key (simplest):** `flushTraces` de-dupes by a stable key derived from the trace. For `hidden_mark_revealed` the key is `${markId}|${tick}` — already unique per reveal. Add at the top of `flushTraces`:

```ts
export function flushTraces(traces: PendingTrace[]): void {
  const seen = new Set<string>();
  for (const t of traces) {
    const key = `${t.category}|${(t as any).markId ?? ''}|${t.tick}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try { emitTrace(t); } catch { /* fail-soft */ }
  }
}
```

**Option 2 — single-run collector (more robust, recommended):** Instead of passing the array into the updater, capture traces *into the returned state* via a dedicated field, then drain it in an effect. This is heavier — adds a `GameState.pendingTraces` field — but survives arbitrary updater patterns.

**Recommendation:** Ship Option 1. The `markId|tick` key is already unique per reveal and the existing `revealEvent.id = mark_reveal_${mark.markId}_${tick}` pattern (line 212) confirms uniqueness at that grain. Option 2 adds GameState noise for no additional correctness.

## Test plan

Add to `src/engine/__tests__/hiddenMarks.test.ts`:

1. **`consumeMatchingMarks` with `tracesOut`** — passes array, confirms:
   - Array has one entry per consumed mark.
   - `emitTrace` is NOT called (spy on module).
   - Returned state is identical to the direct-emit variant.
2. **`consumeMatchingMarks` without `tracesOut`** — existing behavior preserved: `emitTrace` called once per consumed mark.
3. **`revealHiddenMark` with `tracesOut`** — same contract.
4. **`flushTraces` dedup** — push the same trace record twice, confirm `emitTrace` called exactly once.
5. **`flushTraces` fail-soft** — mock `emitTrace` to throw on the second entry, confirm first and third still emit.

Integration test in `src/components/Game/__tests__/handleEncounterAftermathReaction.test.tsx` (or extend whichever exists):

6. **StrictMode dedup smoke** — render GameView wrapped in `<StrictMode>`, trigger the reaction handler with a mark-matching template, assert the trace buffer contains exactly one `hidden_mark_revealed` entry. This is the regression test for the bug itself.

Run `npm test` — all existing hiddenMarks + hiddenMarkReveal contract tests must continue to pass. The `mark-reveal-liveness` contract is unaffected (same reveal outcome).

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | No new magic numbers. |
| 2. Inspectability | **PASS with improvement** | Traces now appear exactly once in dev — inspectability was being actively degraded by the bug. |
| 3. Determinism | PASS | Same seed + same inputs → same state AND same trace sequence. Previously trace sequence was non-deterministic (1× in prod, 2× in dev). |
| 4. Fail-soft | PASS | Every emit path retains its `try/catch`. `flushTraces` is per-entry fail-soft. |
| 5. Narrative over mechanical | N/A | Infra change. |
| 6. Additive over destructive | PASS | New optional parameter, new helper function, existing signatures preserved. |
| 7. Performance budget | PASS | One array allocation per reaction handler call; dedupe uses `Set<string>` sized to ≤ a few entries. Negligible. |

## Three-pillar check

- **Engine:** PASS — `hiddenMarks.ts` refactor, new `flushTraces` helper.
- **Content:** N/A — no content surfaces touched.
- **UI:** PASS — `GameView.tsx` `handleEncounterAftermathReaction` updated; no visible UI change, but the Debug Panel's Trace tab will show a clean single-emit stream.

## Wiring check (see `Docs/plans/wiring-checklist.md`)

- Orchestrator phase: N/A (event handler, not a tick phase).
- Modal rendered: N/A.
- GameState field added: none.
- Trace category: existing (`hidden_mark_revealed`) — no new category.
- Player control: N/A.
- Debug panel visibility: already wired via trace category; improved signal-to-noise.

## Deferrals tracked as follow-ups

- **`encounterAftermath.ts` — 101 `emitTrace` calls inside `applyEncounterAftermathReaction`**, called inside the same updater (`GameView.tsx` line 1930). Same StrictMode double-emit bug but much larger surface area. Create a separate Linear issue labeled `Deferral` under project **Encounter Format Migration** when this lands: "THR-133 follow-up: apply trace-collection pattern to `applyEncounterAftermathReaction`". No player impact in prod; debug noise only.
- No new deferrals introduced by this change.

## Files touched

1. `src/engine/hiddenMarks.ts` — add `PendingTrace` type alias (exported), add optional `tracesOut` parameter to `revealHiddenMark` and `consumeMatchingMarks`, add `flushTraces` helper, remove THR-133 TODO comment.
2. `src/components/Game/GameView.tsx` — `handleEncounterAftermathReaction`: declare `pendingTraces`, pass to `consumeMatchingMarks`, call `flushTraces` after `setGameState`.
3. `src/engine/__tests__/hiddenMarks.test.ts` — add five unit tests per Test Plan.
4. *(optional)* New file `src/components/Game/__tests__/handleEncounterAftermathReaction.strictmode.test.tsx` — the StrictMode integration regression test if a component test harness is convenient; otherwise skip and rely on the unit tests, since the underlying mechanism is well-covered.

## Definition-of-Done reminders

- Commit message: `Fixes THR-133`
- Codex review: **no** (narrow, well-scoped infra fix with deterministic tests; not a new primitive downstream features will depend on).
- Model: **haiku** — surgical refactor, small file count, clear test plan.
