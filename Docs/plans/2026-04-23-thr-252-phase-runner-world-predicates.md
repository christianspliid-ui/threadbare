# THR-252 — Phase-runner: implement non-doom-clock WorldPredicate ops

**Status:** Design (Ready for Dev)
**Project:** Social Systems Expansion
**Author:** Cowork (autonomous scheduled session, 2026-04-23)
**Parent:** THR-225 (event recipe phased activation — In Dev)
**Parent plan:** `Docs/plans/2026-04-23-thr-225-event-recipe-phased-activation.md`

## Context

THR-225 shipped the Composition DSL `phases` construct and a v1 runtime phase-runner in `src/engine/phaseComposition.ts`. The runner evaluates `phase.activatesAt: WorldPredicate` against the live game state.

The DSL schema (`src/composition-dsl/schema.ts`) accepts seven predicate ops. The v1 runner only evaluates five of them:

| `WorldPredicate.op`            | v1 runner | THR-252 scope     | Deferred    |
|--------------------------------|-----------|-------------------|-------------|
| `doom-clock`                   | ✅        | —                 | —           |
| `composition-fired`            | ✅        | —                 | —           |
| `and` / `or`                   | ✅        | —                 | —           |
| `not`                          | ✅        | —                 | —           |
| `world-flag`                   | ❌        | **v1**            | —           |
| `has-faction-of-archetype`     | ❌        | **v1**            | —           |
| `has-agent-of-archetype`       | ❌        | **v1**            | —           |
| `edge-exists`                  | ❌        | —                 | follow-up   |

Unknown ops fall through to a `console.warn(...); return false` branch (load-bearing fail-soft — **do not remove**). This ticket narrows that branch by filling in the three predicates authored content will reach for first. `edge-exists` is explicitly deferred to a follow-up (see §Deferrals) because it requires wiring a `FilterQuery` evaluator from `src/composition-dsl/findCard.ts` into the runtime-graph surface, which is a cross-module refactor well beyond the scope of a low-priority deferral.

### Why these three first

Each of the three maps to a near-term content authoring need:

- **`world-flag`** — Chain Weakens already emits `{ op: 'set-world-flag', key: 'chain-weakens.plague-materialized', value: true }` in its `phase-2-plague` effects. A follow-up phase (or a *different* composition) that gates on that flag cannot currently do so: the predicate exists in the schema but the runner ignores it. This is the first flag-gated cross-recipe chain and will be the first thing a content author tries.
- **`has-faction-of-archetype`** — Used in **preconditions** already (Chain Weakens precondition uses `has-agent-of-archetype`). THR-225 only wires `evaluatePhasePredicateV1` inside the phase runner; preconditions are evaluated at composition-fire time via the validator (out of scope of THR-225). But as soon as an author wants a phase to only activate if a faction of a given archetype exists — e.g. the shield-anvil's absorption phase gating on the presence of a surviving divine_champion faction — the current `return false` silently blocks the phase forever. Painful failure mode; high value to fix.
- **`has-agent-of-archetype`** — Same shape as faction; same story.

### Why `edge-exists` is deferred

`edge-exists` has the form `{ fromFilter: FilterQuery, edgeType: string, toFilter?: FilterQuery }`. Evaluating it requires running a `FilterQuery` matcher over runtime graph nodes. A suitable evaluator already exists in `src/composition-dsl/findCard.ts` as a private function `evaluateFilterQuery(query, node, ctx)`, but it operates on the DSL-side `WorldSnapshot` / `WorldNode` DTOs, not the runtime `WorldGraph` / `GraphNode`. Wiring this correctly — either by extracting the evaluator to a shared module and parameterising it over the two node shapes, or by building an adapter — is a legitimate piece of engineering that deserves its own ticket. THR-252 is not it; a new deferral is opened in §Deferrals.

## Three-Pillar Overview

### Engine pillar
Extend `evaluatePhasePredicateV1()` in `src/engine/phaseComposition.ts` to handle three additional ops: `world-flag`, `has-faction-of-archetype`, `has-agent-of-archetype`. Keep the unknown-op fall-through behavior intact. Add one small helper (`countNodesMatchingArchetype`) and reuse `state.graph.getNodesByType('actor')` for archetype counting; no new graph APIs.

### Content pillar
Extend `src/composition-dsl/examples/event-chain-weakens.recipe.ts`: add a **fifth phase** `phase-5-reckoning` gated on `{ op: 'world-flag', key: 'chain-weakens.plague-materialized', value: true }` AND `{ op: 'has-faction-of-archetype', archetype: 'divine_champion_order' }` with `count: { gte: 1 }`. This exercises two of the three new predicates in the same phase. Document the pattern in the recipe's inline rationale so content authors have a worked example to copy.

### UI pillar
No new UI surfaces. The existing DebugPanel composition view (shipped with THR-225) already renders active phases, last-evaluation tick, and predicate op strings; it will display the new op strings unmodified. Add one line to DebugPanel's predicate summary so that `world-flag` predicates show the `{ key, expectedValue, actualValue }` triple at evaluation time (small DX improvement — if this slows the pickup, it can be split to a follow-up).

## Engine Design

### Predicate implementations

```ts
// src/engine/phaseComposition.ts

function evaluatePhasePredicateV1(
  predicate: WorldPredicate,
  state: GameState
): boolean {
  switch (predicate.op) {
    case 'doom-clock': {
      // unchanged
    }
    case 'composition-fired': {
      // unchanged
    }
    case 'world-flag': {
      const flags = state.worldFlags ?? {};
      return flags[predicate.key] === predicate.value;
    }
    case 'has-faction-of-archetype': {
      const count = countActorsByArchetype(state, 'faction', predicate.archetype);
      return satisfiesCountBounds(count, predicate.count);
    }
    case 'has-agent-of-archetype': {
      const count = countActorsByArchetype(state, 'individual', predicate.archetype);
      return satisfiesCountBounds(count, predicate.count);
    }
    case 'and': {
      // unchanged
    }
    case 'or': {
      // unchanged
    }
    case 'not': {
      // unchanged
    }
    default:
      console.warn(`[phaseComposition] Unknown predicate op "${(predicate as { op: string }).op}" — treating as false`);
      return false;
  }
}
```

### Archetype matching

Runtime actor nodes carry archetype identifiers in `properties`:

- **Factions:** `{ actorType: 'faction', factionDefId: string, ... }` (see `src/engine/factionSeeding.ts:251-253`). Archetype comparison is against `properties.factionDefId`.
- **Individuals / ascendants:** `{ actorType: 'individual' | 'ascendant', archetypeId: string, ... }` (see `src/engine/ascendant.ts:134`, `src/engine/agentDetail.ts:687-689`). Archetype comparison is against `properties.archetypeId`.

```ts
function countActorsByArchetype(
  state: GameState,
  actorType: 'faction' | 'individual',
  archetype: string
): number {
  const actors = state.graph.getNodesByType('actor');
  const archetypeField = actorType === 'faction' ? 'factionDefId' : 'archetypeId';
  let count = 0;
  for (const node of actors) {
    if (node.properties.actorType !== actorType) continue;
    if (node.properties[archetypeField] === archetype) count += 1;
  }
  return count;
}
```

**Note on `has-agent-of-archetype`:** the DSL does not distinguish `individual` vs `ascendant` vs `group`. We match **any** non-faction actor whose `archetypeId` equals `predicate.archetype`. If a recipe needs finer-grained gating (e.g. "ascendant only"), that is a future predicate extension — tracked as a deferral if a content author requests it.

### Count bounds

```ts
function satisfiesCountBounds(
  count: number,
  bounds: { gte?: number; lte?: number } | undefined
): boolean {
  if (!bounds || (bounds.gte === undefined && bounds.lte === undefined)) {
    // No bounds given — presence semantics (at least one)
    return count >= 1;
  }
  if (bounds.gte !== undefined && count < bounds.gte) return false;
  if (bounds.lte !== undefined && count > bounds.lte) return false;
  return true;
}
```

Spec-level decision: `{ archetype: 'x' }` with no `count` means "at least one exists" (presence). `{ archetype: 'x', count: { lte: 0 } }` means "zero exist" (absence). This matches how `preconditionResolver` interprets the same bounds in existing code paths.

### Performance

`state.graph.getNodesByType('actor')` is O(n) in actor count. Current typical worlds have ~1000 actors by tick 72 (large map per `CLAUDE.md` §Running the Prototype). The phase runner is capped at `PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK = 16` compositions per tick with ~4 phases each — upper bound is 64 predicate evaluations per tick. Worst case ~64 × 1000 = 64,000 property reads per tick. That's within budget for NFP #7 (performance budget, not premature optimization) — no caching in v1. A future cache keyed on `(tick, archetype, actorType)` is easy to add if profiling shows pressure; noted as a deferral.

### Constants table

| Constant | Default | Where | Purpose |
|----------|---------|-------|---------|
| — | — | — | No new constants. Existing `PHASE_RUNNER_MAX_COMPOSITIONS_PER_TICK`, `PHASE_ACTIVATION_COOLDOWN_TICKS`, `COMPOSITION_FAILED_RETENTION_TICKS` already bound the work. |

Tunability (NFP #1) is preserved because all count-bound checks read `predicate.count.gte` / `predicate.count.lte` directly from the recipe — no magic numbers added.

### Tracing

| Trace category | Changes | New fields |
|----------------|---------|------------|
| `composition.phase_activated` | No changes | — |
| `composition.phase_eval_failed` | No changes | `error` string remains the sole failure signal |

No new trace categories. Failure modes:
- Unknown op → `console.warn` (pre-existing; unchanged).
- Graph iteration exception → caught in outer `try/catch` that wraps `evaluatePhasePredicateV1(...)` at `phaseComposition.ts:222`; emits `composition.phase_eval_failed` with the error message. Pre-existing behavior; unchanged.

### Fail-soft table

| Failure case | Behavior | Trace |
|--------------|----------|-------|
| `state.worldFlags` is `undefined` | Treated as `{}`; predicate returns `false` unless value is explicitly `undefined` | — |
| `state.graph` missing actor of requested archetype | `count = 0`; bounds check evaluates normally (absence passes `lte: 0`) | — |
| `state.graph.getNodesByType` throws | Outer `try/catch` at phase-runner level catches, emits `composition.phase_eval_failed`, phase skipped | `composition.phase_eval_failed` |
| Unknown `predicate.op` | `console.warn`, returns `false`. Phase stays dormant. | — |
| `predicate.count` malformed (e.g. `gte: NaN`) | `count < NaN` is `false`, `count > NaN` is `false` → bounds reject → predicate `false` | — |

## Content Design

### Chain Weakens phase-5 extension

Add to `src/composition-dsl/examples/event-chain-weakens.recipe.ts` after the existing `phase-4-crack`:

```ts
{
  id: 'phase-5-reckoning',
  activatesAt: {
    op: 'and',
    terms: [
      { op: 'doom-clock', comparator: 'gte', tier: 4 },
      { op: 'world-flag', key: 'chain-weakens.plague-materialized', value: true },
      { op: 'has-faction-of-archetype', archetype: 'divine_champion_order', count: { gte: 1 } },
    ],
  },
  activates: [], // reckoning is a beat, not a spawn — no new nodes
  storyBeat: {
    tier: 'story_beat',
    template: 'story-beat.chain-weakens-reckoning',
    priority: 'doom_clock',
  },
  rationale:
    'After the Azath cracks, if the plague materialized AND an aligned order survived to witness it, a reckoning beat fires. Exercises world-flag + has-faction-of-archetype predicates.',
}
```

**Rationale:** This phase is optional — it only fires if both the plague materialized (via phase-2 world-flag effect) AND a surviving aligned faction exists. It acts as a deterministic regression fixture: with both conditions true, `phase-5-reckoning` activates; with either false, it stays dormant. That makes it a good test fixture and a good exemplar for content authors.

**Author instructions** (to be added as a comment block in the recipe):

> Conditional phases. A phase's `activatesAt` can reference state other phases have produced. This lets you gate a beat on "did something prior happen?" without hardcoding phase ordering. Use `world-flag` for cross-phase and cross-recipe flags. Use `has-faction-of-archetype` / `has-agent-of-archetype` to gate on the presence of actors. Use `and` / `or` / `not` to compose.

### Story beat template

The `chain-weakens-reckoning` template is authored as a stub in `src/data/story-beat-templates/chain-weakens.ts` with placeholder prose marked `TODO(THR-253)` — THR-253 (Chain Weakens prose polish) already exists and will absorb this prose.

## UI Design

### DebugPanel predicate-summary line (small DX)

In `src/components/DebugPanel/CompositionView.tsx` (or wherever THR-225 shipped the runner's debug surface), when rendering a phase row, include the predicate op in the summary. If op is `world-flag`, append `{key} = {expectedValue} (actual: {actualValue})`. If op is `has-faction-of-archetype` / `has-agent-of-archetype`, append `{archetype} (count: {actualCount}, needs: {bounds})`. If op is `and` / `or` / `not`, recurse and render nested.

**Keep it narrow.** One tooltip line is enough; a full predicate tree explorer is over-scope. If the implementer finds the existing DebugPanel already renders `predicate.op` verbatim (likely), this reduces to ~15 lines of additional string formatting. If it doesn't, they can ship without it and open a follow-up — this UI polish is explicitly **N/A-if-complex**.

### No new player-facing surface

Phase activation already emits Chronicle entries (shipped with THR-225). The new predicates don't change the player's read of the world; they only unlock richer phase gating for content authors.

## Wiring

| Surface | Touch | What |
|---------|-------|------|
| Orchestrator phase | No change | `phaseComposition` already runs after `phaseDoom`, before `phaseAttention` |
| UI component | DebugPanel predicate-summary line (optional) | Tiny formatting addition |
| GameState fields | No change | Reads `state.worldFlags`, `state.graph` — both existing |
| Trace categories | No change | Existing categories cover failure modes |
| Prose pipeline | No change | `chain-weakens-reckoning` story beat uses existing `enrichProse()` pathway |
| Player controls | No change | — |
| `wiring-checklist.md` | No update | No new surfaces |

## Testing

### Unit tests (new)

In `src/engine/__tests__/phaseComposition.worldPredicates.test.ts`:

1. **world-flag**
   - Flag set to `true`, predicate `{ key: k, value: true }` → passes.
   - Flag set to `false`, predicate `{ key: k, value: true }` → fails.
   - Flag missing, predicate `{ key: k, value: undefined }` → passes (explicit undefined match).
   - Flag missing, predicate `{ key: k, value: true }` → fails.
   - `state.worldFlags === undefined` — treated as `{}`; presence checks fail.

2. **has-faction-of-archetype**
   - Empty graph → count = 0; no bounds → fails (presence semantics).
   - Graph with one matching faction, no bounds → passes.
   - Graph with three matching factions, `count: { gte: 2 }` → passes.
   - Graph with one matching faction, `count: { gte: 2 }` → fails.
   - Graph with one matching faction, `count: { lte: 0 }` → fails.
   - Faction has different `factionDefId` → not counted.
   - Non-faction actor (actorType `'individual'`) with same `factionDefId` → not counted.

3. **has-agent-of-archetype**
   - Same shape as faction, matched against `actorType: 'individual'` + `archetypeId`.
   - Ascendant actor with matching `archetypeId` and `actorType: 'ascendant'` → NOT counted (we match `individual` only in v1; this is a documented narrowing).

4. **Composition in phase predicates** — `and` / `or` / `not` wrapping the new ops: one case per wrapper to confirm recursion works end-to-end. Includes the Chain Weakens phase-5 three-term `and` as a representative fixture.

### Integration test (new)

In `src/engine/__tests__/phaseComposition.chainWeakens.test.ts` (extending existing if present, else new):

- Seed a world with Chain Weakens fired, advance doom-clock to tier ≥ 4.
- Assert `phase-5-reckoning` stays dormant when no `divine_champion_order` faction exists.
- Add a faction with `factionDefId: 'divine_champion_order'` → assert the phase activates on the next evaluation tick.
- Assert `composition.phase_activated` trace is emitted with `phaseId: 'phase-5-reckoning'`.

### Existing tests

Run full suite. Existing phase-runner tests should not change behavior — the new ops never match in existing test fixtures.

### Pre-commit gate

`npm test`, `npx tsc --noEmit`, `npx vite build`. Paste raw terminal output in the closing Linear comment (Definition of Done).

## Deferrals

Tracked as new Linear issues (created by CC at closeout per Definition of Done):

1. **Phase predicate: `edge-exists`** — requires extracting / adapting the `FilterQuery` evaluator from `src/composition-dsl/findCard.ts` (private function, operates on `WorldSnapshot`) into a shared module callable from the runtime phase-runner. New ticket (label `Deferral`, project Social Systems Expansion). Unblocks: any recipe that wants "phase activates if edge X exists between nodes matching filters F1 and F2".

2. **Phase predicate: `has-agent-of-archetype` — ascendant vs individual narrowing** — if a content author needs "ascendant of archetype X" distinct from "individual of archetype X", split the op or add an optional `actorType` qualifier. Not needed now. Open a deferral when the first content request hits.

3. **Archetype-count caching** — if profiling ever shows `countActorsByArchetype` is hot (>5ms per tick), add an LRU cache keyed on `(tick, actorType, archetype)` invalidated on graph mutation via `structuralCacheVersion`. Not needed at current scale. Open a deferral only on evidence.

4. **DebugPanel predicate tree explorer** — if authors ask for a deep predicate inspector (full tree, per-term pass/fail, drill-down to matching nodes) beyond the one-line summary, open a follow-up in the UI Visual Overhaul project.

## NFP Compliance

| NFP | Status | Note |
|-----|--------|------|
| #1 Tunability | PASS | No new magic numbers. All count bounds come from recipes. |
| #2 Inspectability | PASS | Existing `composition.phase_activated` and `composition.phase_eval_failed` traces carry all necessary info. Optional DebugPanel line adds predicate-evaluation detail. |
| #3 Determinism | PASS | `state.graph.getNodesByType` iteration order is insertion order (Map). No PRNG in predicate evaluation. |
| #4 Fail-soft | PASS | Unknown ops, missing state, graph exceptions all degrade gracefully. Table in §Engine Design. |
| #5 Narrative over mechanical perfection | PASS | Phase-5 reckoning is narrative — a beat that fires only when the arc has the right shape. |
| #6 Additive over destructive | PASS | Extends `evaluatePhasePredicateV1` switch; no removal, no signature change. Adds one story-beat template (stub). |
| #7 Performance budget | PASS | Worst-case ~64,000 property reads per tick at large-map scale; within budget. Caching deferred behind evidence. |

## Acceptance Criteria

- [ ] `evaluatePhasePredicateV1` in `src/engine/phaseComposition.ts` handles `world-flag`, `has-faction-of-archetype`, `has-agent-of-archetype` correctly per §Engine Design.
- [ ] `countActorsByArchetype` + `satisfiesCountBounds` helpers added (can be private to `phaseComposition.ts` — no need to export in v1).
- [ ] Unknown-op fallthrough with `console.warn` preserved.
- [ ] Chain Weakens recipe gets `phase-5-reckoning` exercising `world-flag` + `has-faction-of-archetype` under an `and`.
- [ ] Story-beat template stub `story-beat.chain-weakens-reckoning` added with placeholder prose tagged `TODO(THR-253)`.
- [ ] Unit tests per §Testing — all pass.
- [ ] Integration test for Chain Weakens phase-5 — passes.
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all green — raw output pasted in closeout comment.
- [ ] Deferrals 1–4 logged as Linear issues (if they need opening; 2 and 3 can wait for evidence).
- [ ] THR-252 TODO comment in `phaseComposition.ts:196` removed.
- [ ] Closing commit includes `Fixes THR-252` in the body.

## Files to touch

- `src/engine/phaseComposition.ts` — extend `evaluatePhasePredicateV1`, add helpers, remove `TODO(THR-252)` comment
- `src/engine/__tests__/phaseComposition.worldPredicates.test.ts` — new unit tests
- `src/engine/__tests__/phaseComposition.chainWeakens.test.ts` — new or extended integration test
- `src/composition-dsl/examples/event-chain-weakens.recipe.ts` — add `phase-5-reckoning`
- `src/data/story-beat-templates/chain-weakens.ts` — add `chain-weakens-reckoning` stub
- `src/components/DebugPanel/CompositionView.tsx` (or equivalent) — optional predicate-summary line; skip if complex
- `Docs/changelog.md` — append row
- `Docs/project-status.md` — append completion entry, move older entries to `project-history.md` if ≥60 lines
