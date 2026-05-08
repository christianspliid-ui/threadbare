---
status: current
title: THR-328 — `archetype_drift_register` aftermath effect kind
date: 2026-05-07
linear: THR-328
parent_plan: 2026-05-05-encounter-ui-implementation-phasing.md
canonical_design: 2026-05-04-encounter-experience-design-plan.md
---

# THR-328 — `archetype_drift_register` aftermath effect kind

**Status:** Codex-ready implementation plan. Phase B6 of the Encounter UI implementation phasing. Tightens the original Linear coordination block: the file paths in the original handoff (`src/engine/encounters/aftermathEffects.ts`, `src/types/encounter-contract.ts`) were aspirational — the real surfaces are `src/engine/encounterAftermath.ts` (the dispatcher, ~1500 lines) and `src/types/unifiedAction.ts` (the `EncounterAftermathReactionEffect` union, line 165). The encounter-contract.ts file is the lighter authoring contract from THR-321 and already lists `archetype_drift_register` as an `EncounterAftermathChangeKind` string variant — it does **not** carry the executable engine handler.

**Mutex update:** Original ticket said "Mutex with: B1 (soft sequencing)." B1 (THR-323) shipped 2026-05-06 — drift accumulator state, threshold detection, `DriftThresholdCrossedTrace`, and the `archetypeDrift` GameState field are all live. The mutex is moot. This handoff is fully unblocked.

## 1. What this ticket adds

A new variant on the canonical `EncounterAftermathReactionEffect` discriminated union: `archetype_drift_register`. Content authors place it in `aftermathConfig.reactions[].effects[]` to surface the fact that the agent crossed a drift threshold during this encounter's resolution. The effect:

- Reads the agent's current drift accumulator state (already mutated by `applyDriftMagnitude` earlier in the same tick via Phase B1).
- Verifies the requested threshold band (`soft` / `banner` / `becoming`) on the requested axis is currently held by the target agent.
- If yes: pushes a `recent_event` (Notable significance) to the agent's `recentEvents` describing the registration, e.g. *"Eira has tilted toward [pole] across her last [n] choices"*, and emits a `drift_threshold_crossed` trace marking this as the encounter-aftermath registration of the crossing.
- If no: fail-soft — emits an `encounter_aftermath_effect` trace with `success: false`, `failReason: 'threshold_not_held'`, and proceeds.

No graph mutation. No new GameState field. The drift accumulator continues to be the single source of truth, written once per choice resolution by Phase B1.

## 2. Files to touch

Concrete paths. Codex must not invent or rename.

| File | Action |
|---|---|
| `src/types/unifiedAction.ts` | **Extend** the `EncounterAftermathReactionEffect` discriminated union (line 165) with one new variant. See §3. |
| `src/engine/encounterAftermath.ts` | **Extend** the `switch (effect.kind)` dispatcher (line 425) with one new `case 'archetype_drift_register'` handler. See §4. |
| `src/engine/__tests__/encounterAftermath-archetype_drift_register.test.ts` | **New file.** Tests per §5. Mirrors the file-naming convention of `aftermathFactionReputation.test.ts`. |

Files that are **out of scope** for this ticket:
- `src/types/encounter-contract.ts` — already includes `archetype_drift_register` in `EncounterAftermathChangeKind` (line 49). No change needed.
- `src/types/traces/encounter-traces.ts` — `DriftThresholdCrossedTrace` already exists and is reused by this effect. No new trace type.
- `src/engine/traceBuffer.ts` — `drift_threshold_crossed` is already registered in `TRACE_CATEGORIES` (per A2 / THR-321). No new category.
- `Docs/plans/wiring-checklist.md` — no new wiring surface; the dispatcher is already covered.
- `Vault/Systems/Intervention Effects.md` — the canonical doc augment is **F3's** scope (THR-341), not this ticket's.

## 3. Type surface (exact)

Insert the following variant into the `EncounterAftermathReactionEffect` union in `src/types/unifiedAction.ts`. Place it adjacent to the existing thread-mutation block (after `thread_branch`, before the ruins-layer block, around line 407) — keep related effect kinds grouped, but the dispatcher in §4 doesn't care about source order.

```ts
  // ─── Archetype drift surface (THR-328) ───────────────────────────────────
  | {
      /**
       * UI surface trigger: marks that a drift threshold was crossed during
       * this encounter's resolution. Engine writes drift via
       * `driftAccumulator.applyDriftMagnitude` (Phase B1); this effect kind
       * surfaces the crossing as a chronicle entry + trace so the UI can
       * render the "Eira has tilted toward Conqueror across her last 14
       * choices" line in scene state.
       *
       * Fail-soft: if the requested threshold is not currently held by the
       * target agent on the requested axis, the effect emits a skipped trace
       * and proceeds (no chronicle write, no error).
       *
       * No graph mutation. No new GameState field.
       */
      readonly kind: 'archetype_drift_register';
      /** Moral axis the registration applies to (e.g. 'protector_conqueror'). */
      readonly axisId: string;
      /** Threshold band that must currently be held on the axis. */
      readonly threshold: 'soft' | 'banner' | 'becoming';
      /** Direct the registration at a specific agent (defaults to actor). */
      readonly targetAgentId?: string;
      /** Optional predicate gate — effect skips if predicate evaluates false. */
      readonly when?: EffectPredicate;
    }
```

`EffectPredicate` is already imported and used by every other effect kind in this union — no new import.

## 4. Handler logic (exact)

Insert the new `case` into the dispatcher switch in `src/engine/encounterAftermath.ts` (line 425). Follow the `case 'recent_event'` and `case 'reputation_tally'` shapes for trace emission style and `mutationSummary.touchedWorld` discipline.

Pseudocode (Codex to translate to TS):

```ts
case 'archetype_drift_register': {
  // Resolve target. `target` is computed upstream of the switch (see how
  // reputation_score does it). Effect-specific override via effect.targetAgentId
  // already flows through `target` resolution; here we just unwrap.
  const resolvedAgentId =
    effect.targetAgentId
      ?? (target.kind === 'agent' ? target.id : actorAgentId);

  if (!resolvedAgentId) {
    emitTrace({
      tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
      encounterId, actionId, reactionId: reaction.id, effectIndex: i,
      effectKind: 'archetype_drift_register',
      effectDetail: { axisId: effect.axisId, threshold: effect.threshold },
      success: false, failReason: 'no_actor_id',
      effectiveTargetId: '', effectiveTargetKind: 'actor_fallback',
      summary: `archetype_drift_register[${i}] skipped: no actorId`,
    });
    break;
  }

  // Read live drift state from GameState (Phase A2 / B1 surface).
  const driftEntry = (state.archetypeDrift ?? []).find(
    (d) => d.agentId === resolvedAgentId && d.axisId === effect.axisId,
  );

  if (!driftEntry) {
    emitTrace({
      tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
      encounterId, actionId, reactionId: reaction.id, effectIndex: i,
      effectKind: 'archetype_drift_register',
      effectDetail: { axisId: effect.axisId, threshold: effect.threshold, targetId: resolvedAgentId },
      success: false, failReason: 'drift_entry_missing',
      effectiveTargetId: resolvedAgentId, effectiveTargetKind: 'agent',
      summary: `archetype_drift_register[${i}] skipped: no drift entry for axis '${effect.axisId}'`,
    });
    break;
  }

  // Threshold values come from constants (Phase A2).
  const thresholdValue =
    effect.threshold === 'soft'      ? DRIFT_THRESHOLD_SOFT
    : effect.threshold === 'banner'  ? DRIFT_THRESHOLD_BANNER
    : /* 'becoming' */                 DRIFT_THRESHOLD_BECOMING;

  const magnitude = Math.abs(driftEntry.toPosition);
  if (magnitude < thresholdValue) {
    emitTrace({
      tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
      encounterId, actionId, reactionId: reaction.id, effectIndex: i,
      effectKind: 'archetype_drift_register',
      effectDetail: {
        axisId: effect.axisId, threshold: effect.threshold,
        targetId: resolvedAgentId, magnitude,
      },
      success: false, failReason: 'threshold_not_held',
      effectiveTargetId: resolvedAgentId, effectiveTargetKind: 'agent',
      summary: `archetype_drift_register[${i}] skipped: |${driftEntry.toPosition.toFixed(2)}| < ${thresholdValue} on '${effect.axisId}'`,
    });
    break;
  }

  // Threshold currently held. Surface as recent_event.
  const pole: 'virtue' | 'flaw' = driftEntry.toPosition >= 0 ? 'virtue' : 'flaw';
  const message =
    `${resolvedAgentId} has tilted toward ${pole} on '${effect.axisId}' ` +
    `(${effect.threshold} threshold, |${magnitude.toFixed(2)}|).`;

  // Append to the agent's recentEvents (use existing appendRecentEvent helper).
  const agentNode = state.graph.getNode(resolvedAgentId);
  if (agentNode && agentNode.kind === 'agent') {
    const previous = (agentNode.properties.recentEvents as TickEvent[] | undefined) ?? [];
    agentNode.properties.recentEvents = appendRecentEvent(previous, {
      tick,
      eventType: 'narrative',
      significance: 0.6, // Notable tier per Narrative Engine canon
      message,
    });
    mutationSummary.touchedWorld = true;
  }

  // Emit canonical drift_threshold_crossed trace marking the registration.
  // fromPosition/toPosition reuse the live entry (no movement here — this is a
  // surfacing event, not a mutation); pole derived above.
  emitTrace({
    tick, category: 'drift_threshold_crossed',
    agentId: resolvedAgentId,
    axisId: effect.axisId,
    fromPosition: driftEntry.fromPosition,
    toPosition: driftEntry.toPosition,
    thresholdCrossed: effect.threshold,
    pole,
  });

  // And the standard aftermath bookkeeping trace.
  emitTrace({
    tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
    encounterId, actionId, reactionId: reaction.id, effectIndex: i,
    effectKind: 'archetype_drift_register',
    effectDetail: {
      axisId: effect.axisId, threshold: effect.threshold,
      targetId: resolvedAgentId, magnitude, pole,
    },
    success: true,
    effectiveTargetId: resolvedAgentId, effectiveTargetKind: 'agent',
    summary: `archetype_drift_register[${i}]: ${resolvedAgentId} ${effect.threshold} on '${effect.axisId}' (${pole})`,
  });
  break;
}
```

Imports to add at the top of `src/engine/encounterAftermath.ts`:

```ts
import {
  DRIFT_THRESHOLD_SOFT,
  DRIFT_THRESHOLD_BANNER,
  DRIFT_THRESHOLD_BECOMING,
} from '../data/encounter-experience-constants';
```

(`appendRecentEvent` is already exported from this file. `TickEvent` is already imported. `state.archetypeDrift` is the GameState field added by A2.)

## 5. Tests (exact cases)

Create `src/engine/__tests__/encounterAftermath-archetype_drift_register.test.ts`. Use the test harness pattern from `src/engine/__tests__/aftermathFactionReputation.test.ts` for `applyEncounterAftermath` invocation and trace inspection.

Required cases:

| # | Scenario | Expected |
|---|---|---|
| 1 | Agent drift at +0.32 on `protector_conqueror`, effect requests `soft` threshold | `recent_event` appended with pole `virtue`; `drift_threshold_crossed` trace emitted with `thresholdCrossed: 'soft'`, `pole: 'virtue'`; `success: true` aftermath trace |
| 2 | Agent drift at -0.65 on same axis, effect requests `banner` threshold | `recent_event` appended with pole `flaw`; `drift_threshold_crossed` trace emitted with `thresholdCrossed: 'banner'`, `pole: 'flaw'` |
| 3 | Agent drift at +0.90 on same axis, effect requests `becoming` threshold | `recent_event` appended with pole `virtue`; `drift_threshold_crossed` trace emitted with `thresholdCrossed: 'becoming'`, `pole: 'virtue'` |
| 4 | Agent drift at +0.20, effect requests `soft` (0.30) threshold | No `recent_event`; no `drift_threshold_crossed` trace; `encounter_aftermath_effect` trace with `success: false`, `failReason: 'threshold_not_held'` |
| 5 | No drift entry for the requested axis (agent has never accumulated drift on it) | No `recent_event`; no `drift_threshold_crossed` trace; `encounter_aftermath_effect` trace with `success: false`, `failReason: 'drift_entry_missing'` |
| 6 | `targetAgentId` overrides actor — registration appended to the override agent's `recentEvents` | Override agent's `recentEvents` length grows by 1; actor's does not |
| 7 | `when` predicate evaluates false | Existing `aftermath_effect_skipped_by_when` trace fires; no `recent_event`, no `drift_threshold_crossed` |
| 8 | Type-level — exhaustiveness check on the union (compile-time only) | TS `tsc --noEmit` passes; no `// @ts-expect-error` needed |

Cases 1–6 are runtime tests. Case 7 piggybacks on the existing `when` predicate plumbing (already covered by every other effect kind's pattern — a single test confirming `archetype_drift_register` participates is enough). Case 8 is implicit in the `npx tsc --noEmit` gate; no separate test file required.

## 6. Done when

Lifted from the Linear issue and tightened. Each item is binary.

- [ ] `archetype_drift_register` variant present in `EncounterAftermathReactionEffect` union in `src/types/unifiedAction.ts` with the exact field shape from §3.
- [ ] `case 'archetype_drift_register'` present in the dispatcher switch in `src/engine/encounterAftermath.ts` (around line 425) implementing §4.
- [ ] Three threshold constants imported from `src/data/encounter-experience-constants`.
- [ ] No new file under `src/engine/encounters/` — the canonical handler lives in the existing dispatcher.
- [ ] No graph state added (no new node type, no new edge type, no new property on existing nodes — the only writes are to the existing `agent.recentEvents` property via `appendRecentEvent`).
- [ ] No changes to `src/types/encounter-contract.ts`, `src/types/traces/encounter-traces.ts`, `src/engine/traceBuffer.ts`, `Docs/plans/wiring-checklist.md`, or vault `Systems/*` pages.
- [ ] Test file `src/engine/__tests__/encounterAftermath-archetype_drift_register.test.ts` created with all 7 runtime cases from §5.
- [ ] `npm test` passes (paste raw output or link green CI run for the closing commit).
- [ ] `npx tsc --noEmit` passes.
- [ ] `npx vite build` passes.
- [ ] Commit body includes `Fixes THR-328` so merge-to-main auto-close fires.

## 7. NFP compliance

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | ✅ PASS | Threshold values come from existing A2 constants (`DRIFT_THRESHOLD_SOFT`, `_BANNER`, `_BECOMING`) — no magic numbers. |
| 2. Inspectability | ✅ PASS | Two trace emissions per fire (the canonical `drift_threshold_crossed` + the bookkeeping `encounter_aftermath_effect`); fail-soft branches each emit a distinct `failReason`. |
| 3. Determinism | ✅ PASS | Pure function of state — no PRNG involvement. |
| 4. Fail-soft | ✅ PASS | Three explicit fail-soft branches (`no_actor_id`, `drift_entry_missing`, `threshold_not_held`); each emits a trace and `break`s without throwing. |
| 5. Narrative over mechanical perfection | ✅ PASS | The chronicle entry is the load-bearing payload. |
| 6. Additive over destructive | ✅ PASS | One union variant added, one switch case added, one test file added. No deletions, no shape changes. |
| 7. Performance budget | ✅ PASS | O(1) lookup against the bounded `archetypeDrift` array (one entry per agent×axis); no traversal. |

## 8. Three-pillar coverage

- **Engine** — `EncounterAftermathReactionEffect` union extension + dispatcher case in `encounterAftermath.ts`. Reuses existing `applyDriftMagnitude` output.
- **Content** — content authors gain a typed effect kind they can place in any reaction's `effects[]` to opt the encounter into surfacing drift. No content authoring required *in this ticket* — the surface is now available for future encounter packets to consume. (THR-318 — content epic — picks up the authoring of the first encounters that use this surface.)
- **UI** — no UI rendering work in this ticket. The new `recent_event` rides the existing chronicle / scene-state read paths. The dedicated **Moment 2 EffectRegistration** animation for `archetype_drift_register` lands in **Phase D2** (THR-335). For now, the chronicle line surfaces in any view that reads `agent.recentEvents`.

## 9. Vision audit

No Vision premise contradicted or updated. This ticket lands one of the canonical "8 + 1" aftermath effect kinds enumerated in design plan §3.5 — Vision-aligned at the long-form plan level (THR-301), inherited by this implementation phase.

## 10. References

- `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §3.5 (canonical 8 + 1) and §3.6 (drift accumulator semantics).
- `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` §3 Phase B6.
- `src/engine/encounters/driftAccumulator.ts` — the upstream writer (Phase B1, THR-323).
- `src/types/traces/encounter-traces.ts` — `DriftThresholdCrossedTrace` definition.
- `src/data/encounter-experience-constants.ts` — `DRIFT_THRESHOLD_SOFT`, `_BANNER`, `_BECOMING`.
- `src/engine/__tests__/aftermathFactionReputation.test.ts` — handler-test pattern reference.
