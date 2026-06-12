# THR-384 — `intel_referenced_prose` dedup at reaction level

**Date:** 2026-05-15
**Author:** Cowork (keep-work-flowing run)
**Linear:** THR-384 (Encounter Format Migration, parent lineage THR-139)
**Status:** Ready for Dev
**Suggested model:** sonnet

> **Stale-checkout caveat (read before implementing):** this plan was authored from a sandbox checkout behind `origin/main` (HEAD `62146dc0`, before THR-443/THR-386/THR-75 merged). The targeted file — `src/engine/encounterAftermath.ts`, `intel_referenced_prose` dispatcher case — is very unlikely to have moved (recent merges touched `src/data/` content, `src/engine/intelligence.ts` lint imports, and docs — not this dispatcher), but `git fetch && git pull` first and re-verify the case's line range (~984–1085) and the loop structure against fresh `origin/main` before editing.

---

## Summary

When a single encounter aftermath reaction carries **multiple `intel_referenced_prose` effects that resolve to the same intelligence record**, the chronicle currently fires one narrative line per effect — the player sees the same "the intel paid off" beat two or three times in one tick. This ticket suppresses all but the **highest-significance** line per record, per reaction.

The dedup decision is **per-reaction**, not cross-reaction. Two different reactions firing on the same tick legitimately produce multiple lines — that is a chronicle-volume concern tracked separately (THR-139 "noise" follow-up), explicitly out of scope here.

## Why now (deferral-trigger note)

THR-384 was filed by THR-139 with the deferral trigger *"defer until playtest shows the noise is real."* That literal trigger has not been observed in a playtest. It is being promoted now on a **different, stronger justification**: THR-383 (the `intel_referenced_prose` template-walk content sweep, currently In Dev) adds ~25–40 new `intel_referenced_prose` effects across the encounter catalog. Multiple-effects-per-reaction pointing at the same record becomes a *structural likelihood* the moment THR-383 lands. This is the exact relationship THR-386 (the category lint) had to THR-383 — the breadth pass creates the need, the guard ships alongside it. THR-384 is the runtime-dedup half of that same guard.

If the implementer disagrees with this justification, the correct move is to bounce the issue back to Cowork with the reasoning — not to ship a half-measure.

## Scope

**In scope**
- Reaction-level dedup of `intel_referenced_prose` effects that resolve to the same `recordId`.
- Winner selection by significance, stable tie-break by effect index.
- New `skipped_duplicate_record` skip trace for suppressed effects.
- Unit test coverage in the existing `encounterAftermath.intelReferencedProse.test.ts`.

**Out of scope**
- Cross-reaction dedup (different reactions on the same tick — that is THR-139's chronicle-volume follow-up).
- Any change to *which* records match (`findIntelReferencedProseMatch` semantics are untouched).
- Any change to the prose packs, reliability banding, or significance constants.
- Content authoring — no template edits.

## Three-pillar coverage

| Pillar | In scope | Rationale |
|---|---|---|
| **Engine** | **Full** — dispatcher change in `src/engine/encounterAftermath.ts`: a per-reaction pre-pass that builds a winner map, a guard in the `intel_referenced_prose` case, and a new skip trace. |
| **Content** | **N/A** | No template, prose pack, or data table is touched. The dedup operates purely on effects already authored. The behavioural change is *fewer* chronicle lines, not different prose. |
| **UI** | **N/A (verify-don't-omit)** | No new UI surface and no UI-file change. The visible effect is that the chronicle / right-rail shows one line instead of duplicates — it surfaces through the existing `recentEvents` / `tickEvents` renderer (same path THR-139 wired). The suppressed effects are inspectable in the DebugPanel `encounter_aftermath_effect` trace stream via the new `failReason`. Closeout still requires the standard browser pass (see Done-when) because the change alters a player-visible surface's output, even though no `src/components/**` file changes. |

## Engine design

### Current behaviour (`encounterAftermath.ts` ~lines 984–1085)

The `intel_referenced_prose` case runs inside the per-effect `for` loop (index `i`, `effect`, `reaction` in scope). For each effect it: resolves `targetAgentId`, calls `findIntelReferencedProseMatch(state, targetAgentId, effect.category, action)` → `matched` (carries `recordId`), computes the reliability `band`, picks the prose line, computes `significance` (`effect.significance ?? band default`), appends a `TickEvent` to `nextRecentEvents` / `nextTickEvents`, and emits `emitIntelligenceReferenced` + an `encounter_aftermath_effect` success trace. There is **no awareness of sibling effects** — each fires independently.

### E1 — Per-reaction winner pre-pass

Before the per-effect loop runs for a reaction (i.e. at the point where the reaction's effect array is known, before iteration), build a winner map scoped to that reaction:

```
winnerByRecordId: Map<recordId, { effectIndex: number; significance: number }>
```

Walk every `intel_referenced_prose` effect in the reaction's effect array. For each, resolve `targetAgentId` and call `findIntelReferencedProseMatch` exactly as the main case does; if it produces no `matched`, the effect has no record and is irrelevant to dedup (it will no-op in the main loop with `no_matching_record` — leave it alone). For effects that *do* match, compute the same `significance` value the main case computes (`effect.significance ?? band-default`, where the band default is the `INTEL_REFERENCED_PROSE_SIGNIFICANCE_*` constant for the matched record's band). Group by `matched.recordId`. The winner for each `recordId` is the entry with the **highest significance**; ties break to the **lowest effect index** (stable, deterministic — NFP #3).

To avoid calling `findIntelReferencedProseMatch` twice per effect, memoise the pre-pass result: keep a `Map<effectIndex, matched>` (or equivalent) the main loop reads instead of re-resolving. The memo is reaction-scoped and discarded when the reaction finishes. This keeps the change O(effects-per-reaction) with no extra graph traversal.

The pre-pass must run **after** the `when`-predicate evaluation conceptually does *not* apply — i.e. dedup considers all `intel_referenced_prose` effects regardless of `when`, because `when` is evaluated per-effect inside the main loop and an effect skipped by `when` should not have "claimed" a record. **Resolution:** the cleanest correct ordering is to have the pre-pass skip any effect whose `when` predicate fails (re-use the same `evaluateOptionalCondition` path). An effect that will be skipped by `when` must not win a record and suppress a sibling that *would* have fired. The implementer should factor the `when` check so it is evaluated once and shared, or accept evaluating it twice (it is pure) — either is acceptable; document the choice in the commit.

### E2 — Main-loop guard in the `intel_referenced_prose` case

In the existing case, after `matched` is resolved and **before** the `TickEvent` is appended, add the guard:

```
if (winnerByRecordId.get(matched.recordId)?.effectIndex !== i) {
  // this effect is a duplicate-record loser → suppress, emit skip trace, break
}
```

A suppressed effect must **not** append a `TickEvent`, must **not** call `emitIntelligenceReferenced`, and must **not** emit the success trace. It emits only the new skip trace (E3) and `break`s, exactly like the existing `skipped_dubious` / `skipped_empty_prose` early-outs.

Order of guards within the case: `no_target_agent` → `no_matching_record` → **`skipped_duplicate_record` (NEW)** → `skipped_dubious` → `skipped_empty_prose` → fire. Placing the duplicate guard immediately after `no_matching_record` is correct: a duplicate that would also have been dubious-suppressed should still report `skipped_duplicate_record` (the more specific reason for *this* effect), and we avoid doing the band/prose work for an effect we are dropping anyway.

### E3 — `skipped_duplicate_record` skip trace

`TraceCategory` `encounter_aftermath_effect` carries `failReason?: string` (free-form string — confirmed in `src/types/trace.ts:1175`; **no type-union change needed**). Emit:

```
emitTrace({
  tick, category: 'encounter_aftermath_effect', agentId: actorAgentId,
  encounterId, actionId, reactionId: reaction.id, effectIndex: i,
  effectKind: 'intel_referenced_prose',
  effectDetail: {
    category: effect.category,
    recordId: matched.recordId,
    targetAgentId,
    winningEffectIndex: <winner.effectIndex>,
  },
  success: false, failReason: 'skipped_duplicate_record',
  effectiveTargetId: targetAgentId, effectiveTargetKind: 'agent',
  summary: `intel_referenced_prose[${i}] skipped: record ${matched.recordId} already claimed by effect[${winnerIdx}] in this reaction`,
});
```

Including `winningEffectIndex` in `effectDetail` makes the suppression debuggable — an author inspecting the DebugPanel can see exactly which sibling won.

## Constants table (NFP #1)

No new tunable numbers are introduced. Winner selection reuses the existing significance constants:

| Constant | Location | Default | Role in this ticket |
|---|---|---|---|
| `INTEL_REFERENCED_PROSE_SIGNIFICANCE_RELIABLE` | `src/data/agent-behavior-constants.ts:826` | `0.6` | Band-default significance used by the pre-pass when `effect.significance` is absent (reliable band). |
| `INTEL_REFERENCED_PROSE_SIGNIFICANCE_UNCERTAIN` | `src/data/agent-behavior-constants.ts:834` | `0.45` | Same, uncertain band. |
| `INTEL_REFERENCED_PROSE_SIGNIFICANCE_DUBIOUS` | `src/data/agent-behavior-constants.ts:842` | `0.3` | Same, dubious band. |
| `INTEL_REFERENCED_PROSE_DUBIOUS_FIRES` | `src/data/agent-behavior-constants.ts:851` | `true` | Unchanged. The pre-pass scores dubious effects normally; `INTEL_REFERENCED_PROSE_DUBIOUS_FIRES` still gates whether the *winner* actually fires in the main loop. (Edge case — see Fail-soft table row 4.) |

The pre-pass must derive the band-default significance using the **same branch logic** as the main case (lines ~1046–1049), so a winner chosen in the pre-pass and the significance written to the `TickEvent` agree. Do not duplicate the magic numbers — reference the constants.

## Tracing (NFP #2)

| Trace | Category | When | Change |
|---|---|---|---|
| Duplicate-record suppression | `encounter_aftermath_effect` | A non-winning `intel_referenced_prose` effect is dropped | **New** `failReason: 'skipped_duplicate_record'`; `effectDetail` carries `recordId` + `winningEffectIndex` |
| Winning-effect fire | `encounter_aftermath_effect` | The winning effect fires | Unchanged — existing success trace |
| `emitIntelligenceReferenced` | `intelligence_referenced` | Only on the winning effect | Unchanged path; simply fires once per record per reaction instead of N times |

No new trace *category* is added — `failReason` is a free string, so this is a new *value*, not a new *type*.

## Fail-soft table (NFP #4)

| Case | Behaviour |
|---|---|
| Reaction has 0–1 `intel_referenced_prose` effects | Pre-pass produces a 0–1-entry map; the guard is always satisfied; behaviour is byte-identical to today. |
| Two effects, different `recordId`s | Both are winners of their own record; both fire. No suppression. |
| Two effects, same `recordId`, different significance | Higher-significance effect fires; lower one emits `skipped_duplicate_record`. |
| Two effects, same `recordId`, equal significance | Lowest effect index wins (stable). The other is suppressed. Deterministic across runs (NFP #3). |
| Winning effect would itself be `skipped_dubious` / `skipped_empty_prose` | The winner is selected by significance in the pre-pass; if it then hits `skipped_dubious` / `skipped_empty_prose` in the main loop, **no line fires for that record at all** — the suppressed sibling is not "promoted." This is acceptable for v1 (matches first-wins simplicity); note it in the commit. If playtest shows real lines being lost this way, file a follow-up to make the pre-pass skip dubious/empty losers when picking a winner. |
| `findIntelReferencedProseMatch` returns null for an effect | Effect is absent from the winner map; it no-ops in the main loop with the existing `no_matching_record` trace. Untouched. |
| `targetAgentId` unresolvable for an effect | Effect is absent from the winner map; main loop emits existing `no_target_agent` trace. Untouched. |

## Wiring checklist (`Docs/plans/wiring-checklist.md`)

| Wiring surface | Status |
|---|---|
| Orchestrator phase | No new phase. Change is inside `applyEncounterAftermathReaction`, already called from the aftermath orchestrator phase. |
| GameState fields | None new. Mutates the existing `recentEvents` / `tickEvents` arrays (now with fewer entries in the dup case). |
| Modals / GameView JSX | None. |
| Trace categories emitted | `encounter_aftermath_effect` (existing) with new `failReason: 'skipped_duplicate_record'`. |
| Debug visibility | DebugPanel's `encounter_aftermath_effect` trace inspector renders the new `failReason` and `effectDetail` fields with no code change (it is generic over `effectDetail`). Verify at closeout. |
| Prose pipeline | Unchanged — the winning effect's prose still flows through the existing enrichment path. |
| Player controls | None. |
| Wiring checklist update | No new row required (no new surface); optionally annotate the existing `intel_referenced_prose` aftermath-effect row to mention reaction-level dedup. |
| Systemic wiring guide | Optional one-line addition under the `intel_referenced_prose` row in `Docs/plans/2026-04-16-systemic-wiring-guide.md`: note that duplicate records within a reaction collapse to the highest-significance line. |

## Tests

Add to the existing `src/engine/__tests__/encounterAftermath.intelReferencedProse.test.ts` (231 lines today):

1. **Two effects → same record → one line.** A reaction with two `intel_referenced_prose` effects whose `category` resolves (via `findIntelReferencedProseMatch`) to the same `recordId`. Assert exactly one `TickEvent` of `type: 'narrative'` is appended, and it is the higher-significance one.
2. **Significance winner.** Effects in index order `[low-significance, high-significance]` for the same record — assert the *second* (higher) effect's prose is the one that fired, proving winner-by-significance, not first-wins.
3. **Tie-break by index.** Two effects, equal significance, same record — assert the lower index fires; deterministic across repeated runs.
4. **Skip trace emitted.** Assert a `encounter_aftermath_effect` trace with `failReason: 'skipped_duplicate_record'` is emitted for the suppressed effect, and its `effectDetail.winningEffectIndex` points at the winner.
5. **Different records → both fire.** Two effects resolving to *different* `recordId`s — assert both lines fire, no suppression (regression guard against over-deduping).
6. **`when`-skipped effect does not claim a record.** A reaction with effect `[A: when=false, B: when=true]`, both resolving to the same record — assert B fires (A must not win the record and suppress B).

Do **not** add a whole-corpus assertion — this is a unit-level behaviour, not a content invariant.

## NFP compliance

| # | Priority | Verdict |
|---|---|---|
| 1 | Tunability | **PASS** — no new magic numbers; reuses named significance constants. |
| 2 | Inspectability | **PASS** — new `skipped_duplicate_record` trace with `recordId` + `winningEffectIndex` makes every suppression traceable to its cause. |
| 3 | Determinism | **PASS** — winner selection is significance-desc then index-asc; no PRNG; identical inputs → identical suppression set. |
| 4 | Fail-soft | **PASS** — every degenerate case (0–1 effects, no match, no target, dubious/empty winner) falls back to existing behaviour; see Fail-soft table. |
| 5 | Narrative over mechanical | **PASS** — the change exists to protect narrative quality (no repeated beats); it removes mechanical noise from the chronicle. |
| 6 | Additive over destructive | **PASS** — adds a pre-pass + a guard branch; no existing branch is rewritten, no signature changes. |
| 7 | Performance budget | **PASS** — one extra O(effects-per-reaction) pass per reaction, memoised so `findIntelReferencedProseMatch` is still called once per effect. No new graph traversal. |

## Vision audit

No Vision premise is touched or contradicted. The change is a chronicle-hygiene fix inside an existing engine path; it does not alter what a god can do, how the player acts, or any non-negotiable. **N/A — no Vision edit in scope.**

## Rulebook impact

None. This does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss). No `Docs/canon/rulebook.md` edit required.

## Coordination block

- **Suggested model:** sonnet — bounded engine change in one file with one new test; the only judgment call (the `when`-ordering choice) is spelled out in E1.
- **Parallel-safe with:** THR-380 (vision-audit CLI — `scripts/`, disjoint), THR-406 (Vision/ files — Codex queue, disjoint). Any Ready-for-Dev work that does not touch `src/engine/encounterAftermath.ts`.
- **Mutex with:** THR-383 (In Dev — template-walk content sweep). THR-383 edits `src/data/` encounter content; THR-384 edits `src/engine/encounterAftermath.ts` — **files are disjoint, so they are technically parallel-safe.** Flagged as a soft-mutex only because THR-383 is the change that motivates THR-384: if THR-383's content sweep is still in flight, THR-384's tests should use synthetic fixtures (not rely on THR-383's authored effects) so the two do not race on test expectations. Once THR-383 merges, THR-384 can also be smoke-verified against real content.
- **Codex review:** yes — engine change to a dispatcher with multiple early-out branches; a second pass on the guard ordering and the `when`-interaction is worth it.

## Done when

- [ ] Per-reaction winner pre-pass implemented in `src/engine/encounterAftermath.ts`; `findIntelReferencedProseMatch` memoised so it is still called once per effect.
- [ ] Main-loop guard added to the `intel_referenced_prose` case, ordered immediately after `no_matching_record`.
- [ ] `skipped_duplicate_record` skip trace emitted for suppressed effects, with `recordId` + `winningEffectIndex` in `effectDetail`.
- [ ] 6 unit tests added to `encounterAftermath.intelReferencedProse.test.ts` (see Tests); all green.
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass — raw output pasted in the closing commit body or Linear comment.
- [ ] Engine smoke: `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium` reaches tick 30 without exceptions; last ~10 lines pasted into the closing comment.
- [ ] Browser-verify: `?view=game&seeded` at 1920×1080 — screenshot of the chronicle/right-rail, console capture (errors+warnings filter), and one `window.__DEBUG` assertion (e.g. `getTraces()` filtered for `skipped_duplicate_record` after running enough ticks, or a note that the dup path did not naturally fire and the unit tests cover it). If the dedup path does not fire naturally in a short seeded run, state that explicitly and lean on the unit tests — that is a valid result.
- [ ] `// TODO(THR-XX)` for any deferral (e.g. the "promote a sibling when the winner is dubious/empty" follow-up, if the implementer judges it worth tracking).
- [ ] Closing commit body includes `Fixes THR-384`.
- [ ] Docs updated per Definition of Done: `project-status.md`, `project-history.md`, `changelog.md`; Linear completion comment.

---

*Plan authored by Cowork, 2026-05-15 (keep-work-flowing run). Source issue THR-384 was filed by THR-139 with a near-complete spec; this plan doc formalises it to the three-pillar / NFP standard and resolves the `when`-ordering and dubious-winner edge cases that the issue left implicit.*
