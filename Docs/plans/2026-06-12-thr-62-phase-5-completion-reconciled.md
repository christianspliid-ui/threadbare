# THR-62 — Phase 5 Completion (Reconciled with Current Code)

**Status:** Implementation plan, ready for handoff to CC
**Project:** Agent Success Redesign
**Author:** Cowork, 2026-06-12 (scheduled `keep-work-flowing` run)
**Supersedes scope from:** original THR-62 description + `Docs/plans/2026-04-02-agent-success-redesign-roadmap.md` § Phase 5

## 0. Why this reconciled doc exists

The original THR-62 description was written against the Phase 2-4 plan, not the shipped code. Auditing the tree on 2026-06-12 shows:

| Ticket claim | Code reality |
|---|---|
| "Migrate to `resolveCheck()`" | Function is named `resolveAction()` in `src/engine/resolutionService.ts` |
| "Six-band outcome ladder" incl. `near_miss` as an outcome | `OutcomeType` is five bands (`critical_success`, `success`, `success_at_cost`, `failure`, `critical_failure`). `near_miss` is a **zone** — `NEAR_MISS_MARGIN = 5` — that maps rolls into `success_at_cost` on the success side, see `src/engine/resolutionService.ts:65` and `src/engine/plannerForecast.ts:156-189`. |
| "Recommended first slice: `borderland-encounter-content.ts`" | File exists at `src/data/borderland-encounter-content.ts`; already UAT-format (4 UAT references, 0 legacy `EncounterTemplate`). |
| "Audit every call site that still uses the pre-Phase-2 resolution shortcut" | Audit ran. Three callers remain: `encounter.ts:462`, `encounterScoring.ts:525`, `plannerForecast.ts:140`. All three go through `normalizeLegacyDifficulty(÷100)`. `encounter.ts:461` already branches on `isUATStep` and **bypasses** the legacy divisor — confirming this is a transition shim, not the live path. |
| "Convert legacy pass/fail prose into the six-band ladder" | Sampled `civic-guard-encounter-content.ts` and `borderland-encounter-content.ts` — both use `successAfterimage` / `failureAfterimage` prose only. No `success_at_cost` / `critical_*` prose authored in content layer; the system synthesises generic prose for those bands. |

Three of the five "files with any legacyET residue" (`arcane-circle`, `civic-guard`, `thieves-guild`, `holy-order-dawn`, `monster`) only have residue in type imports or comments — not in template definitions. Verified via spot-grep.

**Net:** the format migration is ~95% done. What remains is finishing the legacy path removal, authoring band-specific prose, and the early-game retune. Original ticket's "Exit criteria 3 — no call sites remaining on the legacy resolution path (grep clean)" is *exactly* the right exit gate, but the scope to hit it is much smaller than the ticket implies.

## 1. Reconciled scope

Three workstreams, ordered by dependency:

1. **Legacy path removal** — delete the `isUATStep` shim and `normalizeLegacyDifficulty`-flavoured callers once all five residue files are confirmed clean. Engineering.
2. **Outcome prose audit + authoring pass** — extend the encounter content schema so authors can write `successAtCost` and `criticalSuccess` / `criticalFailure` prose, then author at least the four borderland-tier templates as the reference slice. Content + light engineering for the schema bump.
3. **Early-game retune** — run `balanceEvaluator` for ticks 1-50 against `balanceTargets.ts`, adjust seed DCs in the four reference templates and the global `*_DIFFICULTY_BASE` constants in `src/data/borderland-encounter-content.ts` and adjacent packs. Content + tuning.

Workstream (1) is independent and can ship first.
Workstream (2) blocks workstream (3) (prose drives toast/chronicle copy, which the retune validates against).

## 2. Three-pillar coverage

### Engine

**Legacy path removal:**
- Delete `normalizeLegacyDifficulty` callers in `src/engine/encounter.ts:462`, `src/engine/encounterScoring.ts:525`, `src/engine/plannerForecast.ts:140`.
- Delete the `isUATStep` branch in `encounter.ts:459-462` once content layer guarantees `duration: {min, max}` shape on every step (workstream 1's exit gate).
- Keep `normalizeLegacyDifficulty` itself in `resolutionService.ts` as a *test-only* utility — `resolutionService.test.ts` uses it to drive legacy-difficulty test inputs. Mark `@internal` and add a TSDoc note that no production caller exists.
- Verification: `grep -rn "normalizeLegacyDifficulty\|isUATStep" src` returns matches only in `resolutionService.ts`, `resolutionService.test.ts`, and this plan doc.

**Outcome prose schema bump:**
- Extend the per-step prose object in `EncounterStepContent` (or wherever `successAfterimage` / `failureAfterimage` are typed) with two new optional fields: `successAtCostAfterimage`, `criticalSuccessAfterimage`, `criticalFailureAfterimage`. Optional — when omitted, fall through to existing `successAfterimage` / `failureAfterimage` with a `[band-name]` prefix so debuggers can see the fallback.
- Outcome → prose lookup lives wherever `successAfterimage` / `failureAfterimage` are consumed today (probably `aftermathProse.ts` or `encounter.ts`). Add a single switch.

**Constants:**
| Name | File | Default | Purpose |
|---|---|---|---|
| `PROBABILITY_FLOOR` | `resolutionService.ts:59` | `0.05` | Existing — no change |
| `PROBABILITY_CEILING` | `resolutionService.ts:62` | `0.95` | Existing — no change |
| `NEAR_MISS_MARGIN` | `resolutionService.ts:65` | `5` | Existing — no change |
| `LEGACY_DIFFICULTY_DIVISOR` | `resolutionService.ts:72` | `100` | Existing — keep, used only by test helper after workstream 1 |
| `EARLY_GAME_TICK_WINDOW` | new — `balanceTargets.ts` | `50` | Drives the retune evaluation window |
| `EARLY_GAME_SUCCESS_RATE_TARGET` | new — `balanceTargets.ts` | `0.55` ± `0.10` | Bread-and-butter content target |
| `EARLY_GAME_FAILURE_RATE_CAP` | new — `balanceTargets.ts` | `0.25` | Pure-failure ceiling for early game (failures may roll into `success_at_cost`) |

The new `EARLY_GAME_*` constants must be defined inside the existing `DEFAULT_BALANCE_TARGETS` object (don't drop them at file scope — fits the existing structure).

**Traces:**
| Trace type | Fields | Purpose |
|---|---|---|
| `resolution.outcomePromoted` | `{templateId, stepIdx, fromBand, toBand, reason}` | Fired when the near-miss zone promotes a `failure` roll into `success_at_cost`. Already implicit in `resolveAction`; emit explicit trace for observability. |
| `balance.earlyGameSampled` | `{templateId, tickRange:[0,50], outcomeCounts: Record<OutcomeType,number>}` | Fired once per balance-evaluator pass; feeds retune workflow. |

### Content

**Prose authoring — reference slice:**

The four templates in `borderland-encounter-content.ts` are the first authored set. For each, add the new optional fields where the band needs distinct copy:

- `successAtCostAfterimage`: the "almost" — same desired outcome reached but with a visible price (a wound, a debt taken, a watcher noticed). Must read as *partial victory*, not failure.
- `criticalSuccessAfterimage`: the "remembered" — outcome plus a permanent benefit (a clue, a contact, a reputation lift).
- `criticalFailureAfterimage`: the "consequence" — failure plus a lasting cost (a scar, a known enemy, a sphere-pressure tick).

When the field is omitted, the fallback synthesises `[success_at_cost] {successAfterimage}` so debug visibility is preserved without polluting player-facing text.

**Outcome prose audit checklist (per template):**
- [ ] `success_at_cost` reads as partial victory, not failure
- [ ] `critical_success` and `success` are distinguishable (the critical version has something the player will tell stories about)
- [ ] `critical_failure` carries forward — leaves a graph trace, a condition, or a marked NPC
- [ ] No copy reuses verbatim across bands (this is the failure mode the original ticket flagged)

**Files in scope (workstream 2):**
- `src/data/borderland-encounter-content.ts` — reference slice, 4 templates
- `src/data/social-encounter-content.ts` — adjacent early social, 7 templates
- `src/data/secret-encounter-content.ts` — early ruins/scavenging, 5 templates

Total: 16 templates × 5 bands = ~80 prose authoring units. Most templates will use 2-3 optional fields; not every band needs distinct copy if the fallback synthesis reads cleanly.

### UI

**Toast / chronicle / action-card distinguishability:**
- Audit the toast renderer (`OutcomeToast.tsx` or equivalent) — confirm the five bands use distinct colours, icons, or framing. `success_at_cost` should look like a partial-win not a failure.
- Chronicle entries: confirm `success_at_cost` and `critical_*` get distinct verbs in the chronicle generator. Search `chronicleEntry`, `chronicleGenerator`, or `generateChronicle` in `src/engine` and `src/components/Game/`.
- Action cards (forecast UI): the `forecastAction()` output gives per-band probabilities; the UI must show at least success-band totals (sum of `success + critical_success + success_at_cost`) so the player reads "good chance" not "0% critical".

**Browser-verify artifact requirement:** This change touches the UI pillar (toast / chronicle / forecast surfaces). The closing commit must include a 1920×1080 screenshot of a `success_at_cost` and a `critical_failure` toast in flight, plus console output, per CLAUDE.md Definition of Done § Browser-verify UI changes.

### Wiring section

| Module | Hook |
|---|---|
| `src/engine/resolutionService.ts` | Already wired into orchestrator via existing `resolveAction()` callers — no new wiring. |
| `src/engine/encounter.ts` | Remove the `isUATStep` branch; delete the legacy normalizer call. Touched in workstream 1. |
| New prose fields | Consumed by `aftermathProse.ts` (or the equivalent — see existing `successAfterimage` consumer); fall-through default behaviour preserves backward compat. |
| Balance evaluator | Already wired; new constants feed it. CLI access via `npm run cli -- --seed 42 --map medium` + `run 50` for retune. |
| Trace `balance.earlyGameSampled` | Add to debug bridge `__DEBUG.getBalanceReport()` if not already exposed. |

## 3. NFP compliance

| NFP | Verdict | Notes |
|---|---|---|
| 1. Tunability | PASS | New constants are named, in `balanceTargets.ts`, with defaults documented in §2. No magic numbers in retune work. |
| 2. Inspectability | PASS | Two new trace types defined with fields. Outcome promotion (near-miss → success_at_cost) becomes explicit instead of implicit. |
| 3. Determinism | PASS | No new RNG paths; resolution is already seeded through `resolveAction`. |
| 4. Fail-soft | PASS | Prose fields are optional with debug-prefixed fallback. Removing legacy `normalizeLegacyDifficulty` shim is safe only after grep-clean is verified per workstream-1 exit gate. |
| 5. Narrative > mechanical | PASS | Workstream 2 is exactly this — making the five bands readable in prose, not just legible in numbers. |
| 6. Additive | PASS | All prose-field additions are optional. Legacy removal is destructive but gated on a grep audit; safe by construction. |
| 7. Performance budget | PASS | Removing the `isUATStep` branch is a one-line hot-path simplification. No new work in tick loop. |

## 4. Fail-soft table

| Failure | Behaviour |
|---|---|
| Prose field missing for a band | Fall through to existing `successAfterimage` / `failureAfterimage` with a `[band-name]` debug prefix; never throw. |
| `balance.earlyGameSampled` evaluator produces no data (e.g. zero templates fire in 50 ticks) | Trace `balance.earlyGameSampled` with empty `outcomeCounts`; do not gate retune on this — log a warning. |
| Legacy residue grep returns hits after workstream 1 | Abort the deletion commit and surface the remaining sites; never delete `normalizeLegacyDifficulty` while a non-test caller exists. |

## 5. Blast radius

`normalizeLegacyDifficulty` is imported in 3 engine files and 1 test file (verified 2026-06-12). Below the 100-importers threshold by two orders of magnitude — no codesight blast-radius section required. The prose-field additions touch one type (`EncounterStepContent` or equivalent) used by 19 content files — additive only, none of those files need updates to keep working.

## 6. Done when

- [ ] **Workstream 1 — legacy removal:**
  - [ ] `isUATStep` branch deleted from `src/engine/encounter.ts`
  - [ ] `normalizeLegacyDifficulty` calls deleted from `encounter.ts`, `encounterScoring.ts`, `plannerForecast.ts`
  - [ ] `normalizeLegacyDifficulty` marked `@internal` in `resolutionService.ts`
  - [ ] `grep -rn "normalizeLegacyDifficulty\|isUATStep" src` returns only `resolutionService.ts` + its test
  - [ ] `npm test` green
- [ ] **Workstream 2 — prose schema + reference slice:**
  - [ ] New optional fields added to `EncounterStepContent` type
  - [ ] Fallback synthesis preserves backwards compat (existing 19 files compile and behave identically)
  - [ ] `borderland-encounter-content.ts`, `social-encounter-content.ts`, `secret-encounter-content.ts` authored with band-specific copy where it adds value (per per-template checklist in §2 Content)
  - [ ] `aftermathProse.ts` (or equivalent) consumes new fields
  - [ ] 1920×1080 screenshot of a `success_at_cost` toast and a `critical_failure` toast in flight, plus console output (CLAUDE.md DoD § Browser-verify)
- [ ] **Workstream 3 — early-game retune:**
  - [ ] `EARLY_GAME_TICK_WINDOW`, `EARLY_GAME_SUCCESS_RATE_TARGET`, `EARLY_GAME_FAILURE_RATE_CAP` added to `DEFAULT_BALANCE_TARGETS`
  - [ ] 200-tick headless CLI run (`npm run cli -- --seed 42 --map medium` → `run 200`) captures pre-retune baseline; outcome-band distribution saved as TSV
  - [ ] DCs in the three reference packs adjusted; second 200-tick run hits the target bands within tolerance
  - [ ] `balance.earlyGameSampled` trace appears in the run output
- [ ] **Standard closeout:**
  - [ ] `npm test` + `npx tsc --noEmit` + `npx vite build` clean (paste output)
  - [ ] Engine smoke run per CLAUDE.md Testing §6 (30-tick CLI smoke)
  - [ ] Closing commit body includes `Fixes THR-62`
  - [ ] Verification evidence pasted in closing Linear comment or commit body

## 7. Coordination block

- **Suggested model:** sonnet — three-workstream change with concrete file lists and well-bounded surface; doesn't need opus-tier judgment.
- **Required label:** `model:sonnet`
- **Parallel-safe with:** any work that doesn't touch `src/engine/resolutionService.ts`, `src/engine/encounter.ts`, `src/engine/encounterScoring.ts`, `src/engine/plannerForecast.ts`, or the three reference content files in §2.
- **Mutex with:** any work modifying `OutcomeType` in `src/types/resolution.ts`, or restructuring the encounter content schema in `src/data/*-encounter-content.ts`.
- **Codex review:** no — this is judgment-light migration + tuning work, fits CC's queue.
- **Suggested splitting:** workstream 1 (legacy removal) can ship as its own PR before workstream 2/3 start. CC's call.

## 8. Open questions deferred to implementer

These are scope clarifications CC can resolve in-flight without bouncing back to Cowork:

1. **Which existing prose-consumer file owns the outcome→afterimage lookup?** Plan refers to it as `aftermathProse.ts` or equivalent — confirm during implementation. Grep `successAfterimage|failureAfterimage` to find it.
2. **Should the new prose fields nest under a `byOutcome:` map or stay flat?** Either pattern is fine; pick whichever matches the existing shape in `EncounterStepContent`.
3. **Retune granularity** — the plan calls for adjusting the four reference templates' DCs. If the 200-tick run shows the issue is global (e.g. all early templates are too hard because `PROBABILITY_FLOOR` is biting), surface that to Cowork as a follow-up ticket rather than tuning the floor unilaterally.

---

*This plan was authored by Cowork during a scheduled `keep-work-flowing` run on 2026-06-12. The dev queues were empty; THR-62 was selected because it (a) has a project-level plan doc as its brainstorm (the 2026-04-02 roadmap), (b) is mechanical follow-through on shipped foundation work (Phases 1-4), and (c) needed a reality-reconciliation pass before it could move to Ready for Dev.*
