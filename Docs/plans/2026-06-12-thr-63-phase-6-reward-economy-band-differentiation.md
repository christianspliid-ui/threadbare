# THR-63 — Phase 6 Slice A: Outcome-Band Reward Differentiation

**Date:** 2026-06-12
**Author:** Cowork (keep-work-flowing scheduled run)
**Linear:** THR-63 (Phase 6 — Reward & attachment economy expansion)
**Parent project:** Agent Success Redesign
**Depends on:** THR-62 (Phase 5, Done 2026-06-12), THR-451 (outcome economy retune, Done 2026-06-11)
**Source spec:** `Docs/plans/2026-04-02-agent-success-redesign-roadmap.md` § Phase 6
**Suggested executor:** Claude Code, `model:sonnet`
**Codex review:** no (judgment-heavy reward tuning, but ladder-pattern logic)

---

## Scope decision (why this is one slice, not the whole phase)

THR-63 as written is three workstreams (engine band differentiation, content prose+loot tiers, UI card+toast+chronicle). Shipping all three in one PR would balloon scope past CC's WIP=1 window and force re-tuning content twice (once before UI lands, once after). This plan implements **Slice A — Engine band differentiation + minimum-viable content + minimum-viable UI** and files Slices B/C as follow-up issues. The Linear issue moves to Done when Slice A ships; new issues track B/C.

**In scope (Slice A):**
1. Remove the proving-slice gate for success-tier consequences in `outcomeConsequences.ts`; differentiate Q delta, growth multiplier, and significance boost across all six bands for all templates.
2. Add a band-keyed attachment drop weight to `outcomeConsequences.ts` (returns a drop intent; existing attachment grant pipeline consumes it).
3. Wire `narrativeTag` ('surge' / 'strained' / 'setback' / 'catastrophe' / 'fortunate' / 'neutral') into `enrichProse` so prose pipelines can react to outcome tier.
4. Toast and chronicle entry differentiate `near_miss` (success_at_cost) from `failure` and surface the Q delta.

**Deferred (file as follow-up issues after merge):**
- B — Full prose tier rewrite per band across `narrative-content.ts` and `quintessence-content.ts` (3–5 days, content authoring).
- C — MTG-style action card outcome face per band (UI redesign, needs design pass).

Slice A is the spine; B and C are polish on top of a correct spine.

---

## Three-pillar coverage

### Engine pillar

**File:** `src/engine/outcomeConsequences.ts` (extends existing module).

Current state: success-tier consequences (growth multiplier, Q events) are gated to `isProvingSliceTemplate()`. Failure-tier complications already apply universally (THR-20).

Changes:
1. **Remove proving-slice gate for success tiers.** All templates receive band-differentiated Q deltas and growth multipliers on `critical_success`, `success`, `success_at_cost`. Existing per-family risky-action multipliers (1.5×) stay scoped to `RISKY_COERCIVE_IDS`.
2. **Introduce `OutcomeConsequence.attachmentDropIntent`** — a `{ band, weight, tierHint }` triple that downstream reward pipelines consume to roll on the attachment drop table. `null` for `failure` and `critical_failure`; weighted positively for success bands; weighted weakly for `success_at_cost` ("scraped a curse" or "a debt voucher").
3. **Six bands, not five.** The existing module collapses `near_miss` into `success_at_cost`. Per the issue's six-band requirement (critical_success, success, success_at_cost, near_miss, failure, critical_failure), split `near_miss` out as a distinct band on the consequence side: zero Q delta, partial growth credit (0.25×), no complication. `near_miss` is a future-tense "progress counter" — the agent learns something but does not advance the encounter. Add a `progressCounterDelta: number` to `OutcomeConsequence` so encounter authors can register progress on `near_miss`.
4. **`balanceTelemetry` hook.** Emit a `consequence_applied` trace with `{ templateId, band, qDelta, growthMultiplier, dropIntent }` so the existing telemetry layer (`balanceTelemetry.ts`) can confirm the new distribution sits in target bands. THR-451 already shipped balance retune; we need ongoing visibility to catch drift.

**Graph nodes/edges touched:** none new. Existing `actor.properties.quintessence` and `actor.properties.capabilities[*].growth` continue to be the mutation surfaces.

**Tick phase:** existing `applyOutcomeConsequence` site in the resolution phase; no new phase.

**PRNG:** all drop-table rolls go through the existing seeded PRNG (`gameState.rng`) — no `Math.random()` anywhere.

### Content pillar

**Minimum-viable for Slice A:**
- Add `narrative-content.ts` entries for the four new tag values that don't yet exist (`fortunate` for near_miss, plus the four existing tags need a sweep against the new band semantics).
- Add band-keyed entries to `quintessence-content.ts` so the Q delta flavor text reads correctly ("a surge", "a strained recovery", "barely held the thread", "a sharp drain", "a hollow loss").
- Loot tier assignment: a thin `LOOT_TIER_BY_BAND` constant table in `outcomeConsequences.ts` maps band → tier hint (`mythic | rare | common | curse | none`). Full content authoring for the tier prose lives in Slice B.

**Deferred to Slice B:**
- The full per-band prose rewrite across all encounter authoring; per-band enrichment placeholders for `{reward}` / `{loot}` / `{near_miss_note}`.

### UI pillar

**Minimum-viable for Slice A:**
- `Toast` notification differentiates `near_miss` from `failure` — distinct icon + copy ("not yet, but closer" vs. "the moment passes"). Existing toast surface in the encounter resolution path.
- `Chronicle` entry shows Q delta as a numeric annotation when non-zero (e.g., `+0.02Q` / `−0.04Q`). Existing chronicle row format already supports an annotation slot.
- **Debug inspection:** `window.__DEBUG.consequencesFor(actorId, last: N)` returns the last N applied consequences for an actor (band, Q delta, growth mult, drop intent). Surfaces in DebugPanel via the existing CLI tab.

**Hex map signifiers:** none for Slice A. Bands are encounter-scoped, not hex-scoped.

**Deferred to Slice C:**
- MTG-style action card outcome face per band (visual redesign, needs design pass).
- Banded color treatment in the encounter stage outcome banner.

**Browser-verify artifact required:** screenshot at 1920×1080 of (a) a `near_miss` toast next to a `failure` toast and (b) the chronicle row showing a non-zero Q delta. Use Playwright for DOM-side toast/chronicle. WebGL not affected.

---

## Constants table (NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `NEAR_MISS_GROWTH_MULTIPLIER` | `0.25` | Partial growth credit on near_miss (learning-from-trying) |
| `NEAR_MISS_PROGRESS_COUNTER_DELTA` | `0.5` | Progress accumulated toward eventual success on near_miss |
| `CRITICAL_SUCCESS_DROP_WEIGHT` | `1.5` | Drop-table weight multiplier on critical_success |
| `SUCCESS_DROP_WEIGHT` | `1.0` | Drop-table weight on success (baseline) |
| `SUCCESS_AT_COST_DROP_WEIGHT` | `0.4` | Drop-table weight on success_at_cost; biased toward curse/debt tiers |
| `NEAR_MISS_DROP_WEIGHT` | `0.0` | No drop on near_miss; progress counter instead |
| `LOOT_TIER_BY_BAND` | `{critical_success: 'mythic', success: 'rare', success_at_cost: 'curse', near_miss: 'none', failure: 'none', critical_failure: 'none'}` | Band → loot tier hint for the drop pipeline |

All exported from `outcomeConsequences.ts`; balance-tuning lives in this one file.

---

## Trace types (NFP #2)

Add one new trace category to `traceBuffer.ts`:

```ts
export interface ConsequenceAppliedTrace {
  category: 'consequence_applied';
  tick: number;
  actorId: string;
  templateId: string;
  band: StepOutcome;
  qDelta: number;
  growthMultiplier: number;
  progressCounterDelta: number;
  dropIntent: { tierHint: string; weight: number } | null;
  complicationId: string | null;
}
```

Emitted at the existing `applyOutcomeConsequence` call site. Visible in `__DEBUG.getTraces()` and the DebugPanel trace tab.

---

## Fail-soft table (NFP #4)

| Failure case | Fallback |
|---|---|
| Unknown template ID | Return `DEFAULT_CONSEQUENCE` with band-keyed Q/growth applied at universal rates (no proving-slice flavor) |
| Missing `actorId` in graph | Skip Q event, log a warn-level trace, return consequence with `quintessenceEvent: null` |
| Drop pipeline rejects intent | Trace `consequence_drop_rejected`, consequence still applies for Q/growth |
| `near_miss` band on a template with no `progressCounter` field | Treat as `failure` band for Q/growth purposes; trace `near_miss_unsupported` |
| Telemetry trace buffer full | Drop trace silently; do not throw |

Tick loop must never crash on this path. All exits are returns.

---

## Wiring section (the IKEA manual)

Cross-reference: `Docs/plans/wiring-checklist.md`.

| Surface | Wired by |
|---|---|
| Orchestrator phase | `applyOutcomeConsequence` already called from resolution phase — no new phase. |
| GameState fields | Existing `quintessence` and `capabilities[*].growth`. New: optional `progressCounter` on encounter step state for `near_miss`. |
| Traces | New `consequence_applied` category in `traceBuffer.ts`. |
| Debug bridge | `window.__DEBUG.consequencesFor(actorId, last)` exposed in `debug-bridge.ts`. |
| UI components | `Toast` differentiation lives in existing `useEncounterToast` hook. Chronicle row uses existing annotation slot. |
| Prose enrichment | `enrichProse` reads `consequence.narrativeTag` to pick a band-flavored prose variant. New variants added to `narrative-content.ts` and `quintessence-content.ts`. |
| Player controls | None new. Players don't directly drive band selection; the resolver does. |

Update `Docs/plans/wiring-checklist.md` in the same PR with the new trace category and the `consequencesFor` debug bridge entry.

---

## NFP compliance summary

| NFP | Status | Note |
|---|---|---|
| 1 — Tunability | PASS | 7 named constants in `outcomeConsequences.ts`. |
| 2 — Inspectability | PASS | New `consequence_applied` trace; `__DEBUG.consequencesFor` debug surface. |
| 3 — Determinism | PASS | All drop-table rolls use seeded PRNG. |
| 4 — Fail-soft | PASS | 5 failure cases enumerated above, all return-only. |
| 5 — Narrative over mechanical | PASS | `near_miss` is added explicitly to preserve the "almost did it" story beat that the current 5-band collapse erases. |
| 6 — Additive over destructive | PASS | New fields (`progressCounterDelta`, `attachmentDropIntent`) added to `OutcomeConsequence`; existing fields unchanged. Proving-slice gate removed (destructive on that one line) but the gate was always a Phase 3 placeholder, not load-bearing. |
| 7 — Performance budget | PASS | One additional struct field per consequence call; no new allocations in the tick hot path beyond what already exists. |

---

## Done when

- [ ] `outcomeConsequences.ts` differentiates Q delta, growth multiplier, drop intent across all six bands for all templates
- [ ] `near_miss` band returns non-zero `progressCounterDelta` and zero Q delta
- [ ] `OutcomeConsequence.attachmentDropIntent` populated for success bands; consumed by existing attachment grant pipeline
- [ ] `narrativeTag` flows to `enrichProse`; minimum-viable entries added to `narrative-content.ts` and `quintessence-content.ts`
- [ ] Toast differentiates near_miss from failure; chronicle shows non-zero Q delta
- [ ] `window.__DEBUG.consequencesFor` returns last N consequences for an actor
- [ ] `consequence_applied` trace fires and is visible in DebugPanel
- [ ] CLI smoke (seed 42, medium, 30 ticks): non-zero counts in all six bands; status block shows agents still alive
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all green; raw output pasted in closing comment
- [ ] Browser-verify artifact: 1920×1080 screenshot of near_miss vs. failure toast and the chronicle Q delta row; console output captured
- [ ] Slices B (prose tier rewrite) and C (MTG card outcome face) filed as follow-up Linear issues in Agent Success Redesign project, labeled `Deferral`, with this plan doc referenced

---

## Coordination block

* **Suggested model:** `model:sonnet` (pattern-following band differentiation, no novel design)
* **Parallel-safe with:** THR-459 (different files: cache scale normalization touches `resolutionService.ts` and `encounterCache.ts`; this touches `outcomeConsequences.ts` and the UI toast/chronicle layer)
* **Mutex with:** any in-flight work touching `outcomeConsequences.ts`, `traceBuffer.ts`, `narrative-content.ts`, `quintessence-content.ts`
* **Files to touch:**
  - `src/engine/outcomeConsequences.ts` (extend)
  - `src/engine/traceBuffer.ts` (add trace category)
  - `src/types/quintessence.ts` (verify `QuintessenceEvent.source` accepts new `outcome_near_miss` and `outcome_success_at_cost_drop` literals)
  - `src/data/narrative-content.ts` (band-flavored prose variants)
  - `src/data/quintessence-content.ts` (band-flavored Q delta flavor)
  - `src/components/Game/encounter-stage/useEncounterToast.ts` (or equivalent) — near_miss copy and icon
  - `src/components/Game/chronicle/*` (Q delta annotation in row format)
  - `src/debug-bridge.ts` (`consequencesFor` API)
  - `src/debug-bridge.d.ts` (types)
  - `Docs/plans/wiring-checklist.md` (new trace + debug bridge entry)
* **Test coverage:** extend `phase3-outcomeExpansion.test.ts` with universal-template band differentiation cases; add `consequence_applied` trace shape test; add UI toast snapshot test for near_miss vs failure.

---

## Open questions surfaced (none blocking)

None. The slice is well-scoped against Phase 5's just-shipped baseline. If Slice B or C surfaces a Vision-level question, it lands in those follow-up issues, not this one.

---

## Author note (keep-work-flowing autonomous decision)

This plan was authored by the `keep-work-flowing` scheduled task on 2026-06-12. The three In Design candidates (THR-414, THR-431, THR-390) are all explicitly user-gated per their descriptions. The Ready-for-Dev queue had only THR-459 in flight; this plan refills the queue with a same-project sibling so CC has a parallel-safe pickup after THR-459 lands. Slicing decision (this is one slice, not the whole phase) is the author's autonomous call per the scheduled-task latitude.
