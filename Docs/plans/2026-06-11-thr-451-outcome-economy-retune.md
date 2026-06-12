# THR-451 — Outcome Economy Retune: Eliminate the Failure-Dominant World

> **Date:** 2026-06-11
> **Status:** Design — Ready for Dev (Cowork)
> **Project:** Agent Success Redesign
> **Linear:** [THR-451](https://linear.app/threadbare/issue/THR-451)
> **Parent roadmap:** `Docs/plans/2026-04-02-agent-success-redesign-roadmap.md` (Phase 5)
> **Related issues:** THR-62 (Phase 5 encounter migration — partial overlap), THR-453 (template novelty), THR-457 (KPI harness — verification dependency), THR-452 (branching reachability), THR-456 (event feed hygiene)
> **Canon:** `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/rulebook.md` §Resolution Ladder, `Docs/ubiquitous-language/resolution.md`

## 1. Problem (verified noun)

Headless CLI evidence (seed 42, 120 ticks, current `main`):

| Outcome           | Count | Share |
|-------------------|------:|------:|
| failure           |    79 | 78.2% |
| critical_failure  |    18 | 17.8% |
| success_at_cost   |     4 |  4.0% |
| success           |     0 |  0.0% |
| critical_success  |     0 |  0.0% |
| **Total resolved**| **101** | — |

Seed 99 / 60 ticks confirms direction (~73% failure). Every beat the player witnesses ends in failure — the world reads as universal futility. There is no arc, no momentum, nothing rises.

**Acceptance targets (from issue):**

* Routine / local-scale actions: ~50–65% clean success
* Overall resolved distribution at tick 120, 3 seeds: `failure + critical_failure ≤ 35%`
* `critical_failure ≤ 5%`

## 2. Debugging Protocol — verify before you retune

`CLAUDE.md` "Verify the noun before the verb" is binding here. The current data tells us **what the resolver emitted**, not **why** the thresholds collapsed. Multiple hypotheses fit the observed distribution:

| H | Mechanism                                                            | Falsifying evidence                                            |
|---|----------------------------------------------------------------------|----------------------------------------------------------------|
| H1 | `capability` << `difficulty` everywhere → P clamped at `PROBABILITY_FLOOR` (0.05) | Histogram of computed `probability` skewed to 0.05 floor       |
| H2 | `sphereFactor` negative across the board (no alignment, all penalty) | Histogram of `sphereFactor` skewed strongly negative           |
| H3 | Legacy difficulty values not normalized at boundary → diff > 1       | `difficulty` ingestion telemetry shows raw values pre-clamp    |
| H4 | `actionModifiers` / `influenceNudge` reducing P (doom stage stacking) | Per-input contribution attribution shows mod < −0.10 on avg    |
| H5 | Capability growth too slow → no recovery from early failures         | Capability scores flat through tick 120 across all agents      |

**Phase A (diagnose) is mandatory before any constant change.** Without it we risk shipping a retune that masks the actual mechanism — a textbook "fix the symptom, not the cause" failure mode that bit us in 2026-04-18.

## 3. Scope (three pillars)

### Engine — primary

1. **Resolution input telemetry (Phase A, blocking).** Extend the existing resolution `traceBuffer` event with the full `ResolutionInput` payload (capability, difficulty, sphereFactor, actionModifiers, influenceNudge) plus the computed `probability`. Today `resolveAction` returns these in `ResolutionResult` but only `outcome` + `probability` + `margin` reach the trace stream. Add a new trace category `resolution.input` (gated by the existing tracing toggle, NFP #2). Coordinate with THR-457 (KPI harness) — the harness owns aggregation; we only need the field-level payload landed.
2. **Diagnostic CLI command (Phase A).** Add `npm run cli` command `resolution-stats [N]` that, given a paused state, dumps the last N resolutions as a TSV table (one row per resolution: tick, actor, template, capability, difficulty, sphereFactor, mods, nudge, P, roll, outcome). Feeds Phase B hypothesis testing.
3. **Per-scale difficulty bias (Phase B, conditional on H1/H3).** Introduce `SCALE_DIFFICULTY_OFFSETS` keyed by action `scale` — applied at the **caller boundary** alongside `normalizeLegacyDifficulty`, never inside `resolutionService.ts`. Default offsets are **tunable knobs**:

   | Scale        | Default offset | Intent                                                |
   |--------------|---------------:|-------------------------------------------------------|
   | `routine`    |          −0.20 | Make routine action ≥50% success at typical capability |
   | `local`      |          −0.10 | Soft easing for low-stakes flavour beats              |
   | `regional`   |           0.00 | Baseline — current behaviour                          |
   | `saga`       |          +0.05 | Saga-scale should feel earned                         |
   | `mythic`     |          +0.10 | Crit-failure budget intentionally higher              |

   Offsets are **additive** to `difficulty` (so negative offset → easier). Boundary callsite is `unifiedActionResolution.ts` resolve path; legacy encounter path lives in `encounter.ts` and gets the same hook. The resolver itself stays scale-agnostic.
4. **PROBABILITY_FLOOR re-evaluation (Phase B, conditional on H1).** If Phase A shows most thresholds at the 0.05 floor, the floor is doing the wrong job — it was designed to prevent guaranteed-failure absurdity for capable actors against godlike challenges, not to be the dominant outcome of routine actions. Two options to evaluate, pick one based on H1 evidence:
   * **Option A:** Raise `PROBABILITY_FLOOR` to 0.15 — simple, broad, blunt.
   * **Option B:** Keep `PROBABILITY_FLOOR` at 0.05 but introduce a softer per-scale floor `MIN_PROBABILITY_BY_SCALE = { routine: 0.45, local: 0.35, regional: 0.20, saga: 0.10, mythic: 0.05 }` applied at the caller boundary alongside the scale offset.

   **Default choice for the spec:** Option B — finer-grained, preserves the original floor's intent for high-tier content. Resolver remains pure math.
5. **Critical-failure cap (Phase B, conditional on H4).** The doubles model produces ~9% doubles at any threshold; with the threshold clamped at floor, all 9% become critical_failure. Acceptance demands `critical_failure ≤ 5%` overall. Two clean options:
   * **Option A:** Only allow critical_failure when `probability < CRIT_FAILURE_ENABLE_THRESHOLD` is **false** — i.e., crit-failure requires the actor had a real chance. Below that threshold, doubles over threshold → plain `failure`. Default `CRIT_FAILURE_ENABLE_THRESHOLD = 0.25` (below this P, the failure isn't dramatic — it's just lost in noise).
   * **Option B:** Tie crit-failure to action `scale` — routine/local actions never crit-fail; regional+ can. Cleaner narratively, less math.

   **Default choice for the spec:** Option B — cleaner thematically, matches "critical failures are reserved for genuine stakes" framing in the issue, and is one read of `actionTemplate.scale`. Implemented in `classifyResolutionRoll` by widening the function signature to take `permitCriticalFailure: boolean` (caller-supplied), default `true` for back-compat.
6. **Capability growth check (Phase A diagnostic only — not a code change here).** Run `npm run cli -- --seed 42 --map medium` for 200 ticks, dump capability deltas per agent. If H5 confirms (capability flat), open a follow-up Linear issue — capability growth tuning is **out of scope** for this issue but in-scope for the project. Do not fold it in.

### Content — minor audit

If we move from 0% clean success → 50%+ on routine actions, the existing success-tier prose must not feel grandiose for what is now a typical outcome. Spot-check (≤20 templates):

* Sample 20 routine/local templates from the encounter catalog (10 each).
* For each, read the `success` outcome prose. If the tone reads as a triumph ("the air itself bows to your will…"), file a content note for re-pitching to "a competent beat lands" register.
* Output: a single markdown table in the closing comment listing template id + verdict (PASS / DOWNTONE) + one-line note. No bulk rewrite this issue — feed verdicts to `prose-content-systems` in a follow-up.

This is intentionally **read-only on content**. The issue is engine-driven; rewriting 100 templates to defend a math change inverts the priorities.

### UI — N/A (intentional)

No surface change. Distribution change only. Existing chronicle / event feed / aftermath modal already render all five outcome tiers; they will simply show a different mix.

**Exception:** if the diagnostic CLI command above (Phase A) lands a small DebugPanel readout for `__DEBUG.getResolutionStats()`, that **is** a UI touch and the Definition of Done browser-verify clause applies. Recommend deferring the DebugPanel readout to a follow-up unless it's trivially small; keep this issue engine + CLI-only to dodge the screenshot/console requirement.

## 4. Wiring (per `Docs/plans/wiring-checklist.md`)

| Module                            | Wired into                                                                 |
|-----------------------------------|----------------------------------------------------------------------------|
| `resolutionService.ts` constants  | Existing — `unifiedActionResolution.ts`, `encounter.ts`, planner forecast  |
| `SCALE_DIFFICULTY_OFFSETS` table  | New: `resolutionScaleAdjust.ts` (or inline in `unifiedActionResolution.ts`) |
| `resolution.input` trace          | `traceBuffer.ts` category enum + emitter in `resolveAction` callsites      |
| `resolution-stats` CLI command    | `cli/commands/resolutionStats.ts`, registered in `cli/index.ts`            |
| `__DEBUG.getResolutionStats()`    | Optional — `src/debug-bridge.ts` (see UI N/A note above)                   |
| Balance targets reconciliation    | `balanceTargets.ts` — confirm new distribution fits existing band scopes   |

## 5. Constants table (NFP #1: Tunability)

| Name                              | File                            | Default                         | Purpose                                       |
|-----------------------------------|---------------------------------|---------------------------------|-----------------------------------------------|
| `SCALE_DIFFICULTY_OFFSETS`        | new                              | `{routine:-0.20, local:-0.10, regional:0, saga:+0.05, mythic:+0.10}` | Per-scale difficulty bias at caller boundary |
| `MIN_PROBABILITY_BY_SCALE`        | new                              | `{routine:0.45, local:0.35, regional:0.20, saga:0.10, mythic:0.05}`  | Soft per-scale floor (replaces flat floor effect) |
| `PROBABILITY_FLOOR`               | `resolutionService.ts`           | 0.05 (unchanged)                | Hard floor of last resort                     |
| `PROBABILITY_CEILING`             | `resolutionService.ts`           | 0.95 (unchanged)                | Hard ceiling of last resort                   |
| `CRIT_FAILURE_PERMITTED_BY_SCALE` | new                              | `{routine:false, local:false, regional:true, saga:true, mythic:true}` | Which scales allow doubles-over-threshold to escalate to critical_failure |

Every adjustment lands as a named constant. Zero magic numbers in the diff.

## 6. Tracing (NFP #2: Inspectability)

New trace event:

```ts
// src/types/trace.ts (extend)
interface ResolutionInputTrace {
  category: 'resolution.input';
  tick: number;
  actorId: string;
  templateId: string;
  scale: ActionScale;
  capability: number;
  difficulty: number;          // post-normalization, post-scale-offset
  rawDifficulty: number;       // pre-normalization (legacy callers)
  scaleOffsetApplied: number;  // SCALE_DIFFICULTY_OFFSETS[scale]
  sphereFactor: number;
  actionModifiers: number;
  influenceNudge: number;
  probability: number;         // computed threshold
  scaleFloorApplied: boolean;  // true if MIN_PROBABILITY_BY_SCALE bumped P
  roll: number;
  outcome: OutcomeType;
}
```

Emitted alongside the existing `resolution.outcome` trace — no replacement, additive (NFP #6).

## 7. Fail-soft (NFP #4)

| Failure case                                  | Fallback                                                                   |
|-----------------------------------------------|----------------------------------------------------------------------------|
| `scale` undefined on action template          | Treat as `regional` (no offset, neutral floor)                             |
| `SCALE_DIFFICULTY_OFFSETS[scale]` missing key | Offset = 0; log warning once per process                                   |
| `MIN_PROBABILITY_BY_SCALE[scale]` missing key | Fall through to `PROBABILITY_FLOOR`                                        |
| `permitCriticalFailure` not provided          | Default `true` — back-compat with existing call sites                      |
| Diagnostic CLI run with no resolutions yet    | Print `"No resolutions recorded — advance ticks first"` and exit cleanly   |

## 8. Three-pillar exit gates

* **Engine:** PASS — primary scope. New constants, new boundary adjustment, new trace, new CLI command.
* **Content:** PASS WITH NOTE — read-only audit table only; rewrites deferred to follow-up.
* **UI:** N/A (intentional, justified above). Browser-verify clause does not apply unless DebugPanel readout is added (recommend deferring).

## 9. NFP compliance

| NFP                                  | Verdict | Note                                                          |
|--------------------------------------|---------|---------------------------------------------------------------|
| 1. Tunability                        | PASS    | All five new tables / knobs are named constants               |
| 2. Inspectability                    | PASS    | New `resolution.input` trace closes a real gap                |
| 3. Determinism                       | PASS    | No new PRNG paths; scale-offset is pure deterministic adjustment |
| 4. Fail-soft                         | PASS    | Table in §7 covers every new failure surface                  |
| 5. Narrative over mechanical perfect | PASS    | Scale-based crit-failure permission is a *narrative* choice ("crit-failure must read as drama") expressed as a mechanical rule |
| 6. Additive over destructive         | PASS    | Hard floor / ceiling untouched; new behaviour is additive at boundary |
| 7. Performance budget                | PASS    | One extra dict lookup per resolution; ~1k resolutions/run, negligible |

## 10. Rejected approaches

* ❌ **Lower `PROBABILITY_CEILING` to widen mid-range and lower `PROBABILITY_FLOOR`.** Symmetric tuning sounds elegant but breaks the planner forecast tiers (`favorable`, `fated`) and downstream balance targets in `balanceTargets.ts`. We tune at the *caller boundary*, not inside the pure-math resolver — same discipline as `normalizeLegacyDifficulty`.
* ❌ **Make `success_at_cost` the default failure tier (auto-shift all failures up by one).** Would meet the failure-rate target trivially but inverts the meaning of the outcome ladder. `success_at_cost` is currently shaper-driven (attachments) — keep it that way; semantic clarity matters more than hitting a number.
* ❌ **Inflate `capability` across the board.** Capability is the agent's growth axis; cheating it here hides the real growth-curve question that THR-453 and the broader Agent Success Redesign project own. Out of scope.
* ❌ **Disable doubles → crit pipeline entirely.** Loses the "your skill makes brilliance and disaster proportional" theming. Per-scale permission keeps the theme, lowers the rate.

## 11. Coordination block

```
Suggested model: sonnet
Parallel-safe with: THR-455 (UI), THR-456 (event feed), THR-449 (docs)
Mutex with: THR-453 (template novelty — both touch encounter scoring math), THR-452 (branching reachability — touches eligibility pipeline upstream of resolution; safe to coordinate via sequence)
Codex review: yes
Verification depends on: THR-457 (KPI harness) — recommend THR-457 ships first so the retune can be verified through the eligibility funnel and outcome distribution KPI, not bespoke CLI scraping
```

## 12. Done when

* [ ] Phase A — `resolution.input` trace lands, `resolution-stats` CLI command lands, diagnostic run at seed 42 / 120 ticks pasted into closing comment with hypothesis verdict (which of H1–H5 is the dominant mechanism)
* [ ] Phase B — chosen knobs from §3.3–§3.5 implemented as named constants; legacy and unified paths both pass through scale offset and per-scale floor
* [ ] Acceptance distribution met across **3 seeds** (42, 99, 7) at tick 120:
  * `failure + critical_failure ≤ 35%` overall
  * `critical_failure ≤ 5%` overall
  * routine-scale clean-success rate within 50–65%
* [ ] Content audit table (20 templates) pasted into closing comment
* [ ] All existing tests pass; new unit tests cover scale offset, per-scale floor, scale-gated crit-failure
* [ ] 30-tick engine smoke (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) — last ~10 lines pasted
* [ ] Definition of Done items in CLAUDE.md §Definition of Done (commit/push/merge/Linear close)

## 13. Open questions for the author at implementation time

(Not blocking for handoff — Cowork is making reasonable default choices above. CC should flag back to Cowork only if any of these surface as actual blockers during Phase A diagnosis.)

1. Is action `scale` reliably set on every template today, or are there `undefined` scales in the catalog? If significant gaps exist, the `regional` fallback in §7 covers it, but content audit follow-up should backfill.
2. Does Phase A diagnostic reveal a dominant single hypothesis (H1–H5), or is the skew multi-causal? If multi-causal, prefer landing Phase B in slices (scale offset first, observe, then per-scale floor) rather than all knobs at once — easier to attribute the delta.
3. If THR-457 (KPI harness) has not landed yet by the time this issue is picked up, fall back to the existing `agent-analyser` skill for verification — TSV export → eyeball distribution.
