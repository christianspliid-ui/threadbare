# THR-140 — Intel-derived difficulty bonus (engineering scope)

**Linear issue:** THR-140
**Project:** Encounter Format Migration (Urgent, Now)
**Parent:** THR-113 (Intelligence Consumption Pathway — Done). Deferred at parent design time per `Docs/plans/2026-04-17-thr-113-intelligence-consumption.md` §Goal "non-goals for v1: No difficulty bonus from intelligence in v1".
**Effort size:** S (engineering only; ~constant + field + ~30 LOC modifier + 4 unit tests).
**Audience:** Codex (mechanical extension of an established intel pattern; binary acceptance).

## Scope split

THR-140 originally scoped two things:

1. **Engineering scaffold** — constant, type field, resolution-path modifier, trace discriminator, tests. **This ticket.**
2. **Content opt-in pass** — go through `UNIFIED_ACTION_TEMPLATES` and decide which steps get `difficultyContext: 'intel_sensitive'`. Judgment work; **deferred to a new follow-up ticket** (created at handoff time — see closing checklist).

Engineering ships as a no-op feature: until step authors opt in, no template has `difficultyContext` set, so the modifier never fires. NFP-#4-aligned (fail-soft default), parallel-safe with all current Encounter Format Migration content work.

## Goal

Close the third intelligence consumption loop: when an actor's intelligence records match an encounter step's locator, reduce that step's effective difficulty in `unifiedActionResolution`, scaled by record reliability. Emit a `'difficulty_modifier'`-discriminated `intelligence_referenced` trace per use.

The two existing consumption surfaces (scoring boost in `encounterScoring.ts`; prose enrichment in `proseEnrichment.ts`) are unchanged. This ticket adds a third surface in the resolution path.

## Three-pillar coverage

- **Engine** — full coverage (this ticket).
- **Content** — N/A in this ticket. Marked as deferred follow-up; engineering ships inert until content opts in.
- **UI** — N/A. The new trace is consumed by trace inspectors (DebugPanel already renders all `intelligence_referenced` traces uniformly via `referencedBy`); no new UI surface needed because the existing surface auto-includes the new discriminator value.

## Engine design

### Constant

Add to `src/data/agent-behavior-constants.ts`, immediately after `INTEL_SCORING_BONUS = 0.25` (line 807):

```ts
/**
 * Magnitude of the per-step difficulty reduction applied when an actor's
 * intelligence records match the step's encounter context AND the step has
 * `difficultyContext: 'intel_sensitive'`. Scaled by record reliability:
 *   reliable   → full bonus (× 1.0)
 *   uncertain  → half bonus (× 0.5)
 *   dubious    → no bonus   (× 0.0)
 *
 * Subtracted from `step.difficulty` (in [0, 1] units) before passing to
 * `resolveActionShared`. Effective difficulty is floor-clamped at 0 so the
 * divine-action shortcut at `unifiedActionResolution.ts:197` is not bypassed
 * by an intel-modified non-divine step.
 *
 * @range -0.20 to -0.05  (more negative = bigger advantage)
 */
export const INTEL_DIFFICULTY_BONUS = -0.10;
```

### ActionStep type — `src/types/unifiedAction.ts`

Add an optional field to `ActionStep` (line 499):

```ts
export interface ActionStep {
  // ... existing fields ...
  /**
   * Marks this step as eligible for an intel-derived difficulty reduction.
   * When set to `'intel_sensitive'`, `unifiedActionResolution` looks up the
   * actor's intelligence records via `findActionableIntelligence` and, on
   * match, subtracts `INTEL_DIFFICULTY_BONUS` (× reliability weight) from
   * the effective difficulty before resolution.
   *
   * Omitted on most steps. Author opt-in only; defaulting to undefined keeps
   * legacy templates inert. Future values may be added (e.g. 'patrol_route',
   * 'ritual_lore') if step-category-specific bonuses are wanted; today there
   * is one value.
   */
  readonly difficultyContext?: 'intel_sensitive';
}
```

Do not change `ActionStepBranch` — branches contain `ActionStep`s in `variants` and `fallback`, so they pick up the field automatically.

### Resolution path — `src/engine/unifiedActionResolution.ts`

Inside `resolveUncontestedStep` (starts line 183), insert a new block **after** the divine-action shortcut at line 197 and the player shortcut at line 203, but **before** the capability computation at line 208. The block computes `effectiveDifficulty` and emits the trace; downstream code consumes `effectiveDifficulty` via the `ResolutionInput.difficulty` field on line 246 instead of `step.difficulty`.

The intel candidate built for the match must mirror the shape `findActionableIntelligence` expects (see `src/engine/intelligence.ts:128` and the `encounterScoring.ts` call site at line 950). Use the action's encounter context — fields available on `UnifiedAction`/state during resolution:

- `templateId`: `action.templateId`
- `locationId`: resolve from the encounter context node — read `getEncounterContext(state, action.encounterContextId)` (existing helper in `src/engine/encounterContext.ts`) and pull `locationId`. If no context, set `undefined`.
- `targetAgentId`: same source, `targetActorId` field.
- `region`: resolve from the location's hex via existing `getLocationRegion(graph, locationId)` if available; otherwise `undefined`. Match-on-region is best-effort and may be skipped if the helper is absent — check `src/engine/intelligence.ts` callers for the canonical resolution pattern.

Behavior:

```ts
// Intel-derived difficulty reduction (THR-140).
// Only fires for non-divine, non-player steps with the explicit opt-in flag.
let effectiveDifficulty = step.difficulty;
if (step.difficultyContext === 'intel_sensitive') {
  const encContext = action.encounterContextId
    ? state.encounterContexts?.[action.encounterContextId]
    : undefined;
  const intelCandidate = {
    templateId: action.templateId,
    locationId: encContext?.locationId,
    targetAgentId: encContext?.targetActorId,
    region: encContext?.region,
  };
  const intelMatch = findActionableIntelligence(state, action.actorId, intelCandidate);
  if (intelMatch) {
    const band = reliabilityDescriptor(intelMatch.reliability);
    const weight = band === 'reliable' ? 1.0 : band === 'uncertain' ? 0.5 : 0.0;
    if (weight > 0) {
      effectiveDifficulty = Math.max(0, step.difficulty + INTEL_DIFFICULTY_BONUS * weight);
      emitIntelligenceReferenced(
        state.tick,
        action.actorId,
        intelMatch.recordId,
        'difficulty_modifier',
        { templateId: action.templateId, intelCategory: intelMatch.category },
      );
    }
  }
}
```

Then change line 246:

```ts
difficulty: effectiveDifficulty,
```

Imports to add at the top of `unifiedActionResolution.ts`:

- `INTEL_DIFFICULTY_BONUS` from `../data/agent-behavior-constants`
- `findActionableIntelligence`, `reliabilityDescriptor`, `emitIntelligenceReferenced` from `./intelligence`

If `state.encounterContexts` is the wrong field name, follow the existing read pattern used elsewhere in this file. There is no API change to `findActionableIntelligence`.

**Floor clamping** (`Math.max(0, ...)`) is required: without it, a step at difficulty 0.05 with a reliable intel match would yield `-0.05`, which `resolveActionShared` does not expect, and the divine-action shortcut at line 197 would not have run earlier (because the *raw* `step.difficulty` was non-zero). Clamping preserves the invariant that any non-divine step has a positive resolution roll.

### Trace type — `src/types/trace.ts`

Update the union literal in `IntelligenceReferencedTrace` (line 1212) to add `'difficulty_modifier'`:

```ts
referencedBy: 'scoring_boost' | 'prose_enrichment' | 'resolution_match' | 'difficulty_modifier';
```

And update the same union in the `emitIntelligenceReferenced` signature in `src/engine/intelligence.ts:208`:

```ts
referencedBy: 'scoring_boost' | 'prose_enrichment' | 'resolution_match' | 'difficulty_modifier',
```

No new trace category — reuses `'intelligence_referenced'` (already in `TRACE_CATEGORIES` at trace.ts:236).

### Constants table

| Name | Value | Purpose | NFP #1 |
|------|-------|---------|--------|
| `INTEL_DIFFICULTY_BONUS` | `-0.10` | Magnitude of per-step difficulty reduction; subtract from `step.difficulty`, scaled by reliability weight. | ✅ named, exported |

### Tracing

| Trace | When | Discriminator |
|-------|------|---------------|
| `intelligence_referenced` | Each time an intel record matches an `intel_sensitive` step's encounter context with reliability > dubious. | `referencedBy: 'difficulty_modifier'` |

Existing dedup pattern (per-`scoreAndSelect` call) does NOT apply here — resolution fires once per step, so single-emit is automatic.

### Fail-soft

| Failure | Fallback |
|---------|----------|
| `state.encounterContexts` missing or undefined | Treat as no context; `intelCandidate` fields are `undefined`; `findActionableIntelligence` returns `undefined` (already handled). No bonus, no trace. |
| `findActionableIntelligence` throws | Already wrapped in try/catch internally; returns `undefined`. |
| `reliabilityDescriptor(NaN)` | Returns `'dubious'` (existing helper); weight is `0`; no bonus, no trace. |
| `step.difficulty` already 0 | Divine-action shortcut at line 197 returns before our block runs. |
| `emitIntelligenceReferenced` throws | Already wrapped in try/catch internally (intelligence.ts:222). |

## Tests

Add to `src/engine/__tests__/unifiedActionResolution.test.ts` a new `describe` block: `'intel-derived difficulty bonus (THR-140)'`. Required tests:

| # | Name | Setup | Expectation |
|---|------|-------|-------------|
| 1 | `applies full bonus for reliable intel match` | Step difficulty 0.5, `difficultyContext: 'intel_sensitive'`; agent has matching record with `reliability: 0.85` (reliable band). | `resolveUncontestedStep` calls shared resolver with `difficulty === 0.4`. Trace emitted with `referencedBy: 'difficulty_modifier'`. |
| 2 | `applies half bonus for uncertain intel match` | Same step; record `reliability: 0.5` (uncertain band). | Resolver receives `difficulty === 0.45`. Trace emitted. |
| 3 | `applies no bonus for dubious intel match` | Same step; record `reliability: 0.2` (dubious band). | Resolver receives `difficulty === 0.5` (unchanged). **No trace emitted.** |
| 4 | `applies no bonus when no record matches` | Same step; agent has zero intelligence records. | Resolver receives `difficulty === 0.5`. No trace. |
| 5 | `is inert when step lacks the flag` | Step difficulty 0.5, `difficultyContext` omitted; agent has reliable matching record. | Resolver receives `difficulty === 0.5`. No trace, no `findActionableIntelligence` call. |
| 6 | `floor-clamps effective difficulty at 0` | Step difficulty 0.05, `difficultyContext: 'intel_sensitive'`; reliable match. | Resolver receives `difficulty === 0` (not `-0.05`). Trace emitted. |

For trace assertions, use the existing test pattern in this file — capture via `traceBuffer` mock (see existing tests for `intelligence_granted` emit checks elsewhere in the suite).

## Files touched (definitive list)

**Edits (5 files):**
- `src/data/agent-behavior-constants.ts` — add `INTEL_DIFFICULTY_BONUS` constant after `INTEL_SCORING_BONUS`.
- `src/types/unifiedAction.ts` — add optional `difficultyContext?: 'intel_sensitive'` to `ActionStep`.
- `src/types/trace.ts` — extend `IntelligenceReferencedTrace.referencedBy` union with `'difficulty_modifier'`.
- `src/engine/intelligence.ts` — extend `emitIntelligenceReferenced` `referencedBy` parameter union with `'difficulty_modifier'`.
- `src/engine/unifiedActionResolution.ts` — add intel-bonus block in `resolveUncontestedStep`, plumb `effectiveDifficulty` into `ResolutionInput`. Add imports.

**Edits (test file):**
- `src/engine/__tests__/unifiedActionResolution.test.ts` — add 6-case `describe` block per the table above.

**Creates:** none.
**Deletes:** none.

## Done when (binary)

1. ✅ `INTEL_DIFFICULTY_BONUS` constant exported from `src/data/agent-behavior-constants.ts`, exact name and sign per spec.
2. ✅ `ActionStep.difficultyContext?: 'intel_sensitive'` field present in `src/types/unifiedAction.ts`.
3. ✅ `IntelligenceReferencedTrace.referencedBy` union in `src/types/trace.ts` includes `'difficulty_modifier'`.
4. ✅ `emitIntelligenceReferenced` signature in `src/engine/intelligence.ts` accepts `'difficulty_modifier'`.
5. ✅ `unifiedActionResolution.ts` `resolveUncontestedStep` computes `effectiveDifficulty` honoring the flag, reliability scaling, and floor clamp; passes `effectiveDifficulty` (not `step.difficulty`) into `ResolutionInput`.
6. ✅ Trace emitted only when (a) flag is set AND (b) record matches AND (c) reliability weight > 0.
7. ✅ All six test cases pass in `src/engine/__tests__/unifiedActionResolution.test.ts`.
8. ✅ `npm test` green (full suite).
9. ✅ `npx tsc --noEmit` clean.
10. ✅ `npx vite build` succeeds.
11. ✅ Existing `intelligence_referenced` callers unchanged (grep `referencedBy:` — only the union widens; no call site needs updating).
12. ✅ `Docs/plans/wiring-checklist.md` not changed (no new orchestrator phase, no new modal, no new GameState field — pure extension of existing module).
13. ✅ `Docs/plans/2026-04-16-systemic-wiring-guide.md` updated: under §"7 engine capabilities content authors must know" (or the closest match), add a one-paragraph note that authors can flag steps with `difficultyContext: 'intel_sensitive'` to enable intel-aware resolution. Cite this plan doc.

## Verification evidence (paste in closing comment)

- Output of `npm test` (or link to green CI run).
- Output of `npx tsc --noEmit`.
- Output of `npx vite build`.

## Coordination

**Parallel-safe with:** any encounter-content authoring (THR-318 streams), any engine ticket that does not touch `unifiedActionResolution.ts`, `intelligence.ts`, or the three type files listed.
**Mutex with:** none currently in flight. The Encounter Experience B-phase tickets that touched `unifiedActionResolution` are all Done.
**Codex review:** no — change is small, the test suite is the gate, and the new trace value is additive (no existing call site breaks if the union widens).

## Follow-up to file at handoff time

Open a new Linear issue in the same project (Encounter Format Migration) titled "Content opt-in pass for `difficultyContext: 'intel_sensitive'` (THR-140 follow-up)" with label `Deferral` and a brief description: walk `UNIFIED_ACTION_TEMPLATES` (and any branching encounters) and decide which steps deserve the flag. Judgment work; route to Ready for Dev with `model:opus-4-6` when picked up.

## NFP compliance

| Priority | Status | Note |
|----------|--------|------|
| 1. Tunability | ✅ PASS | `INTEL_DIFFICULTY_BONUS` named with default and range. |
| 2. Inspectability | ✅ PASS | New `'difficulty_modifier'` trace discriminator preserves audit trail. |
| 3. Determinism | ✅ PASS | No new RNG; existing intel records are deterministic, reliability is read straight from record state. |
| 4. Fail-soft | ✅ PASS | All five failure modes mapped to safe fallbacks; tick loop never throws. |
| 5. Narrative over mechanical | ✅ PASS with note | Pure mechanical change; narrative payoff comes from the deferred content opt-in. The trace surface keeps the change author-visible. |
| 6. Additive over destructive | ✅ PASS | New constant, new optional field, widened type union — zero call site updates required. |
| 7. Performance | ✅ PASS | One additional record lookup per `intel_sensitive` step (rare); existing `findActionableIntelligence` is O(records) per call and already used per scoring tick. |
