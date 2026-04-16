# THR-73: choice_set Player onResolve — Execute Consequence Effects

**Date:** 2026-04-14
**Issue:** [THR-73](https://linear.app/threadbare/issue/THR-73)
**Parent:** THR-14 (choice_set primitive — Done)
**Status:** Implementation Planning

## Problem

The `choice_set` content primitive is fully implemented as a data type and executor (`effectExecutors.ts:590–692`), and the player-facing `ChoiceSetModal` renders and accepts selections. But when the player resolves a choice, `onResolve` in `GameView.tsx:2660` **does nothing with the selected option's consequences** — it just clears `pendingChoice` and resumes simulation. The choice is cosmetic.

```typescript
// Current (GameView.tsx:2660–2665)
onResolve={(_choiceId, _selectedOptionId) => {
  // TODO(THR-73): Execute selectedOption.consequences on the actor.
  setPendingChoice(null);
  setRunning(true);
}}
```

This means any encounter or reward that uses `choice_set` with player mode silently discards the player's selection.

## Scope

Small, surgical change. Three pillars assessment:

- **Engine:** No new primitives or orchestrator phases. Uses existing `executeEffect()` pipeline.
- **Content:** No new content. Existing proof-pack content with `choice_set` effects will start working.
- **UI:** No new components. Existing `ChoiceSetModal` is complete. Only the callback wiring changes.

## Design

### Data Already Available

`PendingChoiceData` (defined in `effectExecutors.ts:71–78`) carries everything needed:

```typescript
interface PendingChoiceData {
  readonly choiceId: string;
  readonly actorId: string;
  readonly sourceId: string;
  readonly options: readonly ChoiceOption[];  // includes .consequences: AttachmentEffect[]
  readonly timeoutMs: number | undefined;
}
```

The `ChoiceOption.consequences` field (`effects.ts:465`) is `readonly AttachmentEffect[]` — the same union type used throughout the effect system.

### Implementation

**File: `src/components/Game/GameView.tsx` (~2660)**

Replace the TODO callback with consequence execution:

```typescript
onResolve={(choiceId, selectedOptionId) => {
  // 1. Find the selected option
  const selectedOption = pendingChoice!.options.find(o => o.id === selectedOptionId);

  if (selectedOption && selectedOption.consequences.length > 0) {
    // 2. Build execution context
    const ctx: ExecutionContext = {
      casterId: pendingChoice!.actorId,
      tick: gameState.tick,
      graph: gameState.graph,
    };

    // 3. Execute each consequence effect
    const traces: TraceEntry[] = [];
    for (const consequence of selectedOption.consequences) {
      const result = executeEffect(consequence, ctx);
      if (result.traces) traces.push(...result.traces);
      // result mutates graph in place (standard pattern)
    }

    // 4. Emit resolution trace
    traces.push({
      type: 'choice_set_resolved',
      tick: gameState.tick,
      actorId: pendingChoice!.actorId,
      choiceId,
      selectedOptionId,
      consequenceCount: selectedOption.consequences.length,
    });

    // 5. Bump world version (graph was mutated)
    touchWorld();

    // 6. Append traces to recent events
    setGameState(prev => ({
      ...prev,
      recentEvents: [...prev.recentEvents, ...traces],
    }));
  }

  // 7. Clear modal and resume
  setPendingChoice(null);
  setRunning(true);
}}
```

### onDismiss Path

The `onDismiss` handler (timeout or manual cancel) should remain as-is — no consequences fire. This is the intended behavior: dismissing a choice is equivalent to "no selection made." Optionally emit a `choice_set_dismissed` trace for inspectability.

```typescript
onDismiss={() => {
  // Optional: emit dismissal trace for inspectability
  setPendingChoice(null);
  setRunning(true);
}}
```

### Pattern Precedent

This follows the same pattern as `applyInterventionEffects` in `useAgentInteraction.ts:507–515`: build context from current game state, execute effects (which mutate the graph in place), collect traces, bump version, update React state in one call.

### Nested choice_set Guard

A consequence effect could itself be a `choice_set` (though this would be unusual). If `executeEffect` returns an `ExecutionResult` with a non-null `pendingChoice`, the handler should queue it by calling `setPendingChoice(result.pendingChoice)` instead of clearing it. This prevents the edge case from silently dropping a nested choice. Implementation:

```typescript
// After executing all consequences, check for nested pending choice
let nestedPending: PendingChoiceData | null = null;
for (const consequence of selectedOption.consequences) {
  const result = executeEffect(consequence, ctx);
  if (result.traces) traces.push(...result.traces);
  if (result.pendingChoice) nestedPending = result.pendingChoice;
}

// Set nested choice or clear
setPendingChoice(nestedPending);
if (!nestedPending) setRunning(true);
```

This is a defensive guard — current content doesn't nest choice_sets, but the architecture should support it.

## Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| (none) | — | No new tunables. Consequence effects use their own existing constants. |

## Tracing (NFP #2)

| Trace type | Fields | When |
|------------|--------|------|
| `choice_set_resolved` | `actorId, choiceId, selectedOptionId, consequenceCount` | Player confirms selection |
| `choice_set_dismissed` | `actorId, choiceId` | Player dismisses / timeout expires |

Both trace types should be added to the trace type union if not already present. Check `src/types/traces.ts` or wherever `TraceEntry` is defined.

## Fail-Soft (NFP #4)

| Failure | Fallback |
|---------|----------|
| `selectedOption` not found by ID | Log warning, clear modal, resume. No consequences fire. |
| Individual consequence `executeEffect` throws | Catch per-effect, log error trace, continue with remaining consequences. Never crash the tick loop. |
| `pendingChoice` is null when `onResolve` fires | Guard with `if (!pendingChoice) return`. Race condition between timeout and click. |

## Testing

1. **Unit test:** Mock `executeEffect`, verify `onResolve` calls it for each consequence in the selected option.
2. **Integration test:** Use CLI or headless — trigger a `choice_set` encounter with player mode, resolve it, verify the actor received the consequence effects (e.g., a `content_grant` consequence should attach the granted item).
3. **Dismiss test:** Verify dismissal fires no consequences.
4. **Fail-soft test:** Verify a throwing consequence doesn't prevent other consequences from executing.

## Wiring Checklist

- [ ] **Orchestrator phase:** N/A — no new phase. Existing encounter/reward resolution produces the `pendingChoice`.
- [ ] **UI component:** `ChoiceSetModal` — already rendered in `GameView.tsx:2656`. Only callback changes.
- [ ] **GameState flow:** `pendingChoice` → `onResolve` → `executeEffect` per consequence → `touchWorld()` → `setGameState` with traces.
- [ ] **Traces:** `choice_set_resolved`, `choice_set_dismissed` added to trace types.
- [ ] **Debug visibility:** Consequences will appear in DebugPanel trace log via standard trace emission.
- [ ] **Player controls:** No new controls. Existing modal selection is the player control.

## NFP Compliance

| # | Priority | Status |
|---|----------|--------|
| 1 | Tunability | PASS — no new magic numbers |
| 2 | Inspectability | PASS — resolution and dismissal traces emitted |
| 3 | Determinism | PASS — consequence execution is deterministic (same option → same effects) |
| 4 | Fail-soft | PASS — per-effect try/catch, null guards on pendingChoice and selectedOption |
| 5 | Narrative > mechanical | PASS — N/A (pure wiring) |
| 6 | Additive | PASS — only adds callback body, no refactoring |
| 7 | Performance | PASS — consequence arrays are small (1–5 effects typically) |
