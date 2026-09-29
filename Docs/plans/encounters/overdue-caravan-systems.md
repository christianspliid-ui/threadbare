# Encounter Pipeline: The Overdue Caravan
> Scale: medium (3 steps, `scale: 'local'`) | Slug: overdue-caravan | Pass: systems
> Date: 2026-09-29 | Pipeline version: 2.0 | Audited: `overdue-caravan.package.json` after the editorial fixes

## 1. Support bundle honesty

One actor, `steward`: `lazy-materialize-on-trigger`, `must-persist`, reuse `merchant` /
`trader` / `innkeeper`, spawn `merchant` "Oda Varrin". Every settlement subtype that `urban`
+ `rural` expand to carries at least a trader-type NPC or falls back to spawn. Honest.
`supportRole: 'house_steward'` is a free-text role label (`encounter.ts:218`), fine.

## 2. Missing primitives

None. Uses: carryover factor lines (live), step `successMetadata`/`failureMetadata.effects`
(THR-783), `thread_strengthen` / `thread_weaken`, `reputation_with` on `$cast:steward`,
`encounter_seed` with `query: { kind: 'encounter_template', tags: ['#explore'] }` (tag in the
closed catalog, 41 templates), `intelligence` with category `trade_route` (in
`IntelligenceCategory`).

## 3. Runtime feasibility

- Three steps, linear, `branchOnStep: 0` with no variants → `fallback.byOutcome` resolves
  every band. Tier `background` with all steps ≤ 0.45 satisfies
  `NUDGE_OFF_REACH_MAX_DIFFICULTY` (binding correction applied this pass).
- Aggregation (`computeFinalActionOutcome`): a failure on step 0 or 1 (continue_weakened)
  or a final `near_miss` yields `success_at_cost`; the SAC overview was rewritten to hold on
  every such path. The final step is `fail_action`, so `failure`/`critical_failure` reach
  the aftermath only from step 2.
- `isStepSuccess` counts `near_miss` as success, so the success-side effects (thread up,
  reputation up, seed) fire on a final near-miss and land under the SAC band, whose chip
  says thread up. Consistent.

## 4. Aftermath supportability / later-tense promises (rule 7b)

| Sentence | Enacting effect |
|---|---|
| "the house will remember who helped and who did not" (step 1 spine) | `reputation_with $cast:steward` ±0.08 on step 2, +0.04 on one reaction |
| "The roads will call on {actor} again" (seed chips), seedLabels | `encounter_seed` by `#explore` query on both sides, placeless, targets `$actor` — promises no place |
| "What the stones said stays with the mortal" (reaction intent) | `intelligence` record, `trade_route` |
| "the steward paid the searchers" (success overview) | **none** — removed in editorial |

No place-and-time promise; no appointment needed. Query seed caveat: a `query` seed keeps
the family eligibility filter, so the sequel may wither if the mortal stands somewhere no
`#explore` template accepts; the prose promises only that the roads come asking, not when or
where, so a withered seed breaks no sentence.

## 5. Chip referents

`thread` → both endpoints via the thread edge (named, tooltip); `reputation with {target}` →
`$cast:steward` (agent, linked); `seed` → carrier `{actor}` (anchor-catalog rule 2). All
exist in the world on every path.

## 6. New hooks needed

None.

## 7. Implementation file map

Compiler-owned set only (`compile:encounter`). No engine or type work.

## 8. Verdict

**READY FOR IMPLEMENTATION.** `check:encounter` (scratch checker on the unregistered
package) clean, 0 warnings; compile dry-run clean.

## 9. Primitive disposition

No missing primitives identified.
