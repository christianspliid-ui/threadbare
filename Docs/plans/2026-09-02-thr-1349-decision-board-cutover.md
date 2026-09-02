> **title:** `The decision-board cutover — what the throughput loss was made of — THR-1349`
> **linear_issue:** THR-1349
> **author:** `Claude Code` (single-executor design session, 2026-09-02)
> **created:** 2026-09-02
> **three_pillars:** Engine `done` · Content `N/A — no template, prose, or data-table change; the variety weight is a board constant` · UI `N/A — no surface changes; mortals' undertakings and encounters render through surfaces that already exist`

# The decision-board cutover — what the throughput loss was made of — THR-1349

*The flip from contest B to the one prioritization board was held back three times by a measured loss of undertaking volume; the loss is mostly a stacking artefact of the path being replaced, and this plan re-derives the gates so the flip can be judged on what the design actually asks for.*

## Why this is load-bearing

`UNIFIED_DECISION_BOARD_MODE` has shipped `'shadow'` since THR-1292 slice 5: the board ranks every candidate a mortal has, of both families, in one currency, and then **contest B decides anyway** — a comparison the substrate plan (`Docs/plans/2026-08-26-thr-1292-undertaking-substrate.md` §4) describes as *"one clamp and one constant are the entire commensurability story"*. Every downstream design of the Proactive Agent Actions programme — the grievance urgency term (doc 4), the calling's ambition weight (doc 5), the kind rows' `payoffValue` (doc 2) — was written for the board, and none of them decides anything until the mode flips. THR-1301 and THR-1303 sit behind this ticket.

Three passes each shipped a real piece (the variety term, the neutral-desire branch, a throughput gate) and each found a new blocker beneath. The third pass's blocker was a balance judgement rather than a mechanism: *a live board starts 36% fewer undertakings and the encounter family loses 44% of its share; the cutover's main consequence must be readable by a gate before it ships.* That judgement was made against a baseline no pass had read directly. The census in `'shadow'` reports **the board's preference**, not what contest B does — so nobody had seen what the 892-start baseline was made of. This session measured it. The plan follows from the measurement.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `decision` — `decisionBoard.ts`, `phaseAgentDecision.ts` (THR-1292, THR-1349) | 🟢 ACTIVE | **activates** the live branch that has shipped inert since THR-1301; deletes contest B, `STRATEGIC_ENCOUNTER_SCORE_BRIDGE` and the strategic clamp in the same commit, as §4 wrote |
| strategic candidate generation / scoring — `strategicActionCandidates.ts`, `strategicActionScoring.ts` | 🟢 ACTIVE | **preserves**; `scoreStrategicCandidates` keeps ordering, `varietyPenalty` and `STRATEGIC_SCORE_FLOOR`, loses only the bridge factor |
| undertaking census — `scripts/undertaking-census.ts` (THR-1297 slice 6, THR-1349) | 🟢 ACTIVE | **extends**: retires `CENSUS_UNDERTAKING_START_FLOOR`, adds a per-mortal start-rate gate, a fixed-sample variety gate, and reports per-mortal concurrency |
| balance telemetry — `balanceSummary.ts` `shadowBoard` | 🟢 ACTIVE | **preserves**; under `'live'` the same counters describe behaviour rather than preference |

Runtime counts consumed (seed 42 / 99, medium, 150 ticks): 27 autonomous spotlight mortals per seed; 1,935 / 2,127 decisions under `'shadow'`, 1,548 / 1,448 under `'live'`.

## The measurement this plan stands on

Two arms on the current tip (post-THR-1377 corpus), 150 ticks, medium, reading the `legacyWinner` column of `decision_board_comparison` — the column that says what the world *did* — beside the board's verdict:

| | shadow s42 | shadow s99 | live s42 | live s99 |
|---|---|---|---|---|
| decisions | 1935 | 2127 | 1548 | 1448 |
| **what the world did** enc / und / idle | 472 / **892** / 571 (24% / **46%** / 30%) | 389 / **891** / 847 (18% / **42%** / 40%) | 692 / 331 / 525 (45% / 21% / 34%) | 627 / 404 / 417 (43% / 28% / 29%) |
| board *preference* enc / und / idle | 67% / 16% / 17% | 75% / 13% / 12% | = behaviour | = behaviour |
| active undertakings per mortal at tick 150 (max · top 8) | **8** · 8,7,7,6,6,5,5,5 | **11** · 11,11,8,8,6,6,6,6 | 5 · 5,3,3,3,2,2,2,1 | 8 · 8,5,3,3,3,3,2,2 |
| mean active undertakings, all ticks | 49.7 | 59.4 | 16.2 | 20.3 |
| mortals busy in unified actions (avg/tick) | 9.2 | 6.7 | 14.0 | 12.1 |
| distinct templates in the first 300 starts | 45 | 45 | **27** | **32** |
| `trades_with` at tick 150 | 1 | 0 | 0 | 0 |

Three things follow.

1. **The 892-start baseline is contest B choosing an undertaking on 42–46% of spotlight decisions — outside the substrate plan's own envelope (`BOARD_UNDERTAKING_SHARE_RANGE = [0.10, 0.35]`) — and letting one mortal carry eight to eleven concurrent undertakings.** Nothing but *"this template is already running for me"* (`project_already_active`) gates a start, and the strategic score is clamped into `[0.08, 0.851]` against encounter scores that mostly sit lower, so contest B starts nearly everything an ambition offers. The census reported 16% / 13% under `'shadow'` because it reads the board's preference; the actual share was never on any surface.
2. **The live board sits inside the envelope on both seeds, starts *more* encounters in absolute terms, idles the same or less, and holds fewer undertakings per mortal.** Checkpoint #3's *"encounter share 61% → 34%, idle 18% → 33%"* compared the shadow board's preference against the live board's behaviour. Against what the world did, encounters go 472 → 692 and 389 → 627; idles go 571 → 525 and 847 → 417.
3. **The one real loss is variety at equal sample size:** 27 / 32 distinct templates in the first 300 starts against 45 / 45. The board's `varietyMultiplier` shipped at `BOARD_VARIETY_PENALTY_WEIGHT = 0.18` without being calibrated on the live arm (PR #1724 measured `trades_with`, not variety at a fixed sample). Swept on the live arm, both seeds:

| `BOARD_VARIETY_PENALTY_WEIGHT` | distinct @300 s42 / s99 | starts s42 / s99 | und share s42 / s99 |
|---|---|---|---|
| 0.18 (shipped) | 27 / 32 | 331 / 404 | 21.4% / 27.9% |
| 0.35 | 32 / 32 | 345 / 370 | 22.2% / 26.6% |
| **0.5** | **36 / 36** | 300 / 408 | 19.8% / 27.5% |
| 0.7 | 35 / 34 | 280 / 346 | 18.3% / 24.8% |

It is a knob, it plateaus at 0.5, and the envelope shares do not move with it.

So `CENSUS_UNDERTAKING_START_FLOOR = 700` was sized on a stacking artefact rather than on health, and the two red acceptance tests are organic-world vacuity guards on rare families that any world-shifting change flips (their own comments say so). Neither is a reason to keep contest B.

## Engine pillar

### Systems design

Six moves, in three slices. Slice order is load-bearing: the gates are re-derived and green on the *shipped* arm before the flip is measured against them, so a green flip is never "the gate was moved to admit it".

**Slice 1 — the gates say what the design wants.** `scripts/undertaking-census.ts`:

- Retire `CENSUS_UNDERTAKING_START_FLOOR`. Its docblock records that it was sized against 892 / 891; this plan's measurement records what those numbers were. Delete the constant and the gate; leave the starts *reported*.
- Add **`CENSUS_STARTS_PER_MORTAL_PER_100_TICKS_FLOOR = 4`** — starts ÷ mean autonomous-mortal count ÷ (ticks/100). Derived from the design, not from either arm: a spotlight mortal begins a new undertaking about every two days (12 ticks/day; the calling's own hold is 36 ticks). Live measures 8.1 / 10.0, contest B 21.9 / 22.0, so the floor sits at roughly half the live arm and a fifth of the artefact — headroom in the direction the gate exists to guard, and a number a reader can check against a mortal's sheet. The census gains an autonomous-mortal count per tick (mean) to divide by; `isAutonomousDecisionActor` is the shared predicate (THR-1329).
- Replace the absolute `CENSUS_DISTINCT_TEMPLATE_FLOOR` with **`CENSUS_VARIETY_SAMPLE_STARTS = 300`** and **`CENSUS_DISTINCT_AT_SAMPLE_FLOOR = 30`** — distinct templates among the first 300 starts. The old gate's own note says distinct count tracks sample size; at a fixed sample it stops doing so. Sized so the shipped arm (45 / 45) and the live arm at the chosen weight (36 / 36) both pass with margin, and the shipped 0.18 live arm (27 / 32) fails on one seed — a gate that can distinguish the calibrated board from the uncalibrated one, which is the falsification the constant needs.
- Report **active undertakings per mortal** (max and top-8 at run end, mean over ticks). Reported, not gated — the gate belongs to the concurrency cap (see Deferrals), which is sequenced after the flip.
- Keep the three §4 envelope gates and the rolled-share gate unchanged.

**Slice 2 — the two organic guards become constructed assertions.** Both are on THR-1384's heavy list and will run post-merge from now on; the flip must not leave them red there.

- `edgeIntegrity.test.ts` *"writes trade routes without a single schema warning"* — the claim is that the real `trades_with` writer emits no schema warning. Keep the 150-tick seeded smoke for the zero-violations assertion; for the route claim, after the run, **drive the real writer**: pick a spotlight mortal, assign `ambition_dominate_trade` through `assignAmbitionToActor` (the nudge-grant path), generate candidates with `generateStrategicCandidates`, and execute `strategic_establish_trade_route` through `executeStrategicAction`. Then assert `writtenByType.trades_with > 0` and no warnings. The organic 150-tick window stops being the assertion's supply; the route pipeline is exercised on a generated world regardless of which seed's merchants happen to want one (THR-1329, THR-1348 own the organic supply).
- `lairClearing.test.ts` *"reinfests cleared lairs that were still steeped when they fell"* — if the organic run yields no cleared lair at `sphereScore ≥ LAIR_REINFESTATION_SPHERE_THRESHOLD`, **construct one from the world it did produce**: take the most steeped *active* lair at run end, clear it with `clearLair` (the real writer, already unit-tested in that file), advance the clock past `LAIR_REINFESTATION_MIN_TICKS`, run the reinfestation pass, assert. The claim (the reader reinfests what the writer cleared) is unchanged; its supply is no longer one seed's trajectory. Keep the organic eligible-set assertion as a *report* line, not a guard.

**Slice 3 — the flip, exactly as §4 wrote it, one commit.**

- `UNIFIED_DECISION_BOARD_MODE` → `'live'`; `BOARD_VARIETY_PENALTY_WEIGHT` → `0.5` with the sweep table in its docblock.
- Delete contest B (`phaseAgentDecision.ts` — the `bestStrategicScore > bestEncounterScore` block and the comment that says it goes with the flip), `STRATEGIC_ENCOUNTER_SCORE_BRIDGE`, and the bridge multiplication in `scoreStrategicCandidates` (`finalScore = clamp01(rawScore) + jitter`; `STRATEGIC_SCORE_FLOOR` stays as the family's own candidate floor — it and `BOARD_SCORE_FLOOR` are different quantities, and the comment claiming they are pinned equal is corrected).
- `decisionBoardLiveness.test.ts`: the mode pin flips to `'live'`; the "board must not decide anything yet" case becomes "the board decides" (a live decision's `decisionFamily` equals `boardFamily`).
- `decision_board_comparison` stays. `legacyWinner` is re-described as *the encounter scorer's own pick* (the only legacy contest left), and `agreement` becomes a drift signal between the encounter scorer and the board — reported by the census, never gated. The CLI's `Shadow board` block is relabelled `Decision board` and prints the mode.
- Delete the census's `'shadow'`-only wording; the same counters now describe behaviour.

### Graph nodes / edges

None added or changed. The board reads `pursues` edges and template data it already reads.

### Tick phases

`phaseAgentDecision` only. Contest B's removal shortens the per-agent path; the board already ran on every decision in `'shadow'`, so the live cost is the shipped cost minus one contest.

### Resolution logic

Unchanged from §4: `boardScore = EVT × desireMultiplier × temperamentWeight × varietyMultiplier`, winner resolved by `candidateIndex`, idle when the board is empty or its best entry is below `BOARD_SCORE_FLOOR`. The only numeric change is the variety weight.

### PRNG callouts

None new. `scoreStrategicCandidates` keeps its seeded jitter; the board is deterministic given its inputs (NFP #3, pinned by its existing tie-break test).

## Content pillar

Content: N/A — no template, prose, or data-table change. The variety weight is a board constant, not authored content; the trade-route content question was falsified in pass 2 and the route economy is THR-1348's (ruled long-term).

## UI pillar

UI: N/A — nothing renders differently. A mortal's undertakings still appear on the arc panel and the sheet; encounters still arrive through the veil. What changes is which of the two a mortal chooses, and the surfaces for both are shipped (THR-1299). No screenshot is owed; the evidence is the census and the CLI (THR-688 rule C).

### Debug inspection (DebugPanel / CLI)

The CLI `balance summary` block relabels `Shadow board` → `Decision board (live)`. `window.__DEBUG` gains nothing; `getCalling` and the moment stream already expose the consequences.

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md` — no new orchestrator phase, modal, GameState field, trace category, or player control is added; the rows below name the existing surfaces each touched module already rides.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `decisionBoard.ts` (weight change only) | `phaseAgentDecision` | — | — | `decision_board_comparison` (existing) | CLI `balance summary` |
| `phaseAgentDecision.ts` (contest B deleted, live branch decides) | `phaseAgentDecision` | — | `strategicState`, `unifiedActions` (existing writers) | `strategic_action_started`, `decision_board_comparison`, `idle_decision` (existing) | CLI `balance summary`, `traces` |
| `strategicActionScoring.ts` (bridge deleted) | `phaseAgentDecision` | — | — | — | — |
| `scripts/undertaking-census.ts` (gates re-derived) | headless | — | — | reads the traces above | `npm run census:undertakings` |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `UNIFIED_DECISION_BOARD_MODE` | `'live'` (from `'shadow'`) | The board decides |
| `BOARD_VARIETY_PENALTY_WEIGHT` | `0.5` (from `0.18`) | Discount on a repeated undertaking; the sweep above is its calibration |
| `CENSUS_STARTS_PER_MORTAL_PER_100_TICKS_FLOOR` | `4` | Throughput floor stated per spotlight mortal — one new undertaking about every two days |
| `CENSUS_VARIETY_SAMPLE_STARTS` | `300` | The fixed start sample variety is measured at |
| `CENSUS_DISTINCT_AT_SAMPLE_FLOOR` | `30` | Distinct templates among that sample |
| `CENSUS_UNDERTAKING_START_FLOOR` | **deleted** | Was sized on contest B's stacking |
| `CENSUS_DISTINCT_TEMPLATE_FLOOR` | **deleted** | Replaced by the fixed-sample pair |
| `STRATEGIC_ENCOUNTER_SCORE_BRIDGE` | **deleted** | Contest B's commensurability clamp |
| `STRATEGIC_SCORE_FLOOR` | `0.08` (unchanged) | The strategic family's own candidate floor, kept |
| `BOARD_SCORE_FLOOR` | `1e-6` (unchanged) | The board's idle floor; the "pinned equal" comment is corrected |

## Tracing

N/A — no new trace types; the existing `decision_board_comparison`, `strategic_action_started`, `idle_decision` and `undertaking_checkpoint` traces carry everything the census and the CLI read. The one interface touched is comment-only:

```ts
// src/types/trace.ts — existing, unchanged in shape (THR-1292 §4). Only the
// `legacyWinner` doc-comment changes: under 'live' it is the encounter scorer's
// own pick, the one legacy contest left, and `agreement` is a drift signal
// between that scorer and the board — reported by the census, never gated.
export interface DecisionBoardComparisonTrace extends TraceBase {
  category: 'decision_board_comparison';
  agentId: string;
  mode: 'shadow' | 'live';           // reads 'live' after the flip
  legacyWinner: { family: DecisionFamily; id: string | null; score: number };
  boardTop: ReadonlyArray<{ family: DecisionFamily; id: string; score: number; evt: number; desireMultiplier: number; temperamentWeight: number; advanceProbability?: number; ambitionBoost?: number }>;
  agreement: boolean;
  boardFamily: DecisionFamily;       // the verdict after BOARD_SCORE_FLOOR — what the agent did
  encounterCandidates: number;
  undertakingCandidates: number;
}
```

The census additionally samples the autonomous-mortal count per tick (via `isAutonomousDecisionActor`) for the per-mortal start rate; that is a script-side read, not a trace.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Board scoring throws for an agent | Unchanged: `decision_board_error` traced, that agent's decision is absent from the denominator, encounter path proceeds (no contest B to fall back to — the encounter scorer's own `selected` stands) |
| `scoredStrategic[candidateIndex]` missing at the live branch | Unchanged: the `chosen` guard leaves `decisionFamily` as the encounter scorer set it |
| Census sees zero autonomous mortals in a tick | Rate divides by the mean over ticks; a zero mean fails the gate loudly ("no population") rather than passing |
| Constructed trade-route test cannot find a spotlight mortal or a valid partner | The test fails naming which step returned nothing — it is a constructed assertion, so an empty world is a defect in the construction, not a pass |

## Interface impact

| Contract (`interface-map`) | Action |
|---|---|
| `decision-board-shadow-telemetry` (🟢 LIVE) | **extend** — same event and fields; `mode` becomes `'live'`, `legacyWinner` re-described as the encounter scorer's pick; the row's one-liner updated to say the ranking now decides (no longer "before one ranking replaces…") |
| `undertaking-checkpoint-events` (🟢 LIVE) | preserve |
| `world-events-mint-ambitions`, `ambition-acquisition` (🟢 LIVE) | preserve — the constructed trade-route test uses `assignAmbitionToActor` as a consumer, adding no producer |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar N/A with rationale
- [x] UI pillar N/A with rationale
- [x] Wiring section connects them

## Vision audit

- [x] If it did, the Vision edit would be part of this ticket's scope — none is owed (forked Vision audit below: PASS, no contradictions).
- [x] This plan does not contradict a Vision premise. It leans on *narrative over mechanical perfection* (a gate protecting "892 starts" protected a number; a mortal running eleven undertakings is not a person) and on tension #2 — the board restores the encounter as the default beat and makes an undertaking something a mortal chooses over one. No Vision edit owed.

## Rulebook impact

- [x] If it did, `Docs/canon/rulebook.md` would be updated in the same PR — no edit is owed.
- [x] No rule of play changes. The rulebook's account of undertakings (§10.7) and of following (§10.8) describes the board as the competition surface already; the flip makes the description true. No edit owed.

> Brainstorm companion: `Docs/plans/2026-09-02-thr-1349-decision-board-cutover-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every number is a named constant; two are deleted with their reasons recorded, three are added with derivations |
| 2. Inspectability | PASS | No new traces needed; the census reports what it gates and what it does not (concurrency) |
| 3. Determinism | PASS | No new random code; existing jitter and tie-breaks pinned |
| 4. Fail-soft | PASS | Table above; the deletion removes one silent `catch` path rather than adding one |
| 5. Narrative over mechanical perfection | PASS | The whole plan is this: the gate now protects a legible life, not a start count |
| 6. Additive over destructive | PASS with note | The one deletion (contest B, bridge, clamp) is the one §4 scheduled for this exact commit a week ago; everything else is additive |
| 7. Performance budget | PASS | Removes a contest from the per-agent path; the board already ran on every decision |

## Kill criteria

The plan is wrong if, on the current corpus under `'live'` at the retuned weight, **either seed fails any re-derived gate at ≥150 ticks** (envelope, per-mortal start rate, fixed-sample variety), or if `npm test` / `npm run test:heavy` shows red beyond the two re-anchored files. Then: the flip does **not** land (slice 3 is reverted or never merged — slices 1 and 2 stand, since they are green on the shipped arm by construction); the measurement is pasted to the issue; and the concurrency-cap deferral is promoted **ahead** of the flip — because after three passes of tuning, occupancy is the one remaining lever that is not a constant nudged toward a gate. A second failure after the cap lands is the signal that the board's currency itself needs a design pass, and that goes back to a design session rather than to a fourth executor attempt.

## Done when

- [ ] Slice 1: census gates re-derived; `npm run census:undertakings` **PASS on the shipped `'shadow'` arm, both seeds** before any flip is measured — the gates must be green on the tree they are added to
- [ ] Slice 2: `edgeIntegrity` route assertion and `lairClearing` reinfestation assertion re-anchored as constructed; each falsified once (break the writer, see the red) and recorded
- [ ] Slice 3: mode `'live'`, weight `0.5`, contest B + bridge deleted in that commit, liveness pin flipped; `npm run census:undertakings` PASS on seeds 42 and 99 at ≥150 ticks against the re-derived gates; `npm run test:all` green (the heavy lane included — the two re-anchored files are heavy)
- [ ] The census's reported per-mortal concurrency (max, top-8) pasted to the issue for both seeds, and the concurrency-cap deferral filed with it
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`; 30-tick CLI smoke; `npm run test:heavy` locally (engine diff)
- [ ] Closing commit body includes `Fixes THR-1349`
- [ ] Browser-verify exempt: engine-only, no rendered change

## Coordination block

**Suggested model:** opus — three slices with a measurement gate between each; the constants are trivial, reading the census is not.

**Parallel-safe with:** THR-1384 follow-ups (CI/vitest infrastructure), THR-1383 (grievance supply — `ambitionTick.ts`, `grievanceLifecycle.ts`), THR-1300 / THR-1381 (plan-doc authoring, no source).

**Mutex with:** anything editing `src/engine/phaseAgentDecision.ts` (contest B is deleted from the middle of its agent loop — conflicts by construction), `src/engine/decisionBoard.ts`, `src/engine/strategicActionScoring.ts`, `src/data/strategic-action-constants.ts`, `scripts/undertaking-census.ts`, `src/engine/__tests__/edgeIntegrity.test.ts`, `src/engine/__tests__/lairClearing.test.ts`. THR-1301 and THR-1303 are downstream, not concurrent.

**Files to touch:**
- Edit: `scripts/undertaking-census.ts` (gates), `src/data/strategic-action-constants.ts` (constants), `src/engine/decisionBoard.ts` (docblocks), `src/engine/phaseAgentDecision.ts` (delete contest B), `src/engine/strategicActionScoring.ts` (delete the bridge), `src/engine/__tests__/decisionBoardLiveness.test.ts`, `src/engine/__tests__/edgeIntegrity.test.ts`, `src/engine/__tests__/lairClearing.test.ts`, `scripts/cli.ts` (label), `scripts/interface-contracts.ts` + `Docs/canon/interface-map.md` (the row's one-liner), wiki pages whose `sources` match (`essence-control-reference`, `agents-reference`, `encounters-agents-reference`)
- Edit (comment only): `src/types/trace.ts` — `DecisionBoardComparisonTrace.legacyWinner`'s doc-comment is re-described as the encounter scorer's own pick. **115 importers** (`.codesight/graph.md`), which is why this is stated: no field, type, or union member changes, so nothing cascades; an executor who finds the edit growing past a comment should stop and treat it as a Blast Radius question.

## Deferrals (filed at handoff)

- **Per-mortal concurrency cap** — `UNDERTAKING_MAX_ACTIVE_PER_ACTOR`, a candidate-generation rejection (`active_cap`), never a busy-gate (the substrate addendum forbids that). Measured need: 8 / 11 concurrent undertakings per mortal under contest B, 5 / 8 under the live board. Sequenced *after* the flip with its own census run, because it moves the same throughput number the flip is judged on. Doc 6's kind-row schema is where a per-kind cap would live if a flat one proves wrong.

## Notes for the executor

- **Do not size any gate to the arm you want to pass.** Slice 1 lands and is green on the shipped arm before slice 3 is measured; that ordering is the evidence the gates are not tuned to the flip.
- The busy-gate addendum stands: `strategicState.projects` never joins `busyAgentIds`, and the contract test that makes the mistake loud is untouched.
- `BOARD_SCORE_FLOOR`'s comment in `phaseAgentDecision.ts` says it is pinned equal to `STRATEGIC_SCORE_FLOOR`; it is not (`1e-6` vs `0.08`) and they gate different quantities. Correct the comment, not the numbers.
- The two-arm probe this plan was measured with lives outside the tree (`.cache/board-arm-probe.ts`, session worktree). If the census needs the legacy-vs-board columns again after the flip, there is no legacy left to compare against — that is the point.
- THR-1384's heavy lane is live (PR #1778, merged 2026-09-02): `edgeIntegrity` and `lairClearing` run post-merge, not on the PR gate, so `npm run test:heavy` locally before pushing slice 2 and slice 3 is the last place a red in them is caught before `main`. If that script is ever absent, run the two files directly: `npx vitest run src/engine/__tests__/edgeIntegrity.test.ts src/engine/__tests__/lairClearing.test.ts`.

## Intent-judge verdict

*2026-09-02 — first pass **Revise** (four disclosure/terminology gaps: the variety-weight retune undisclosed in the proposal's scope, in-flight "works" vs UL *undertaking*, `src/types/trace.ts` (115 importers) absent from Files to touch, no Kill-criteria section); all four applied; re-run **Allow** (Reversible confirmed; dimensions 1–5, 7–9, 11 PASS; two residual GAPs — a "new work" → "new undertaking" wording and a fallback for `test:heavy` — applied before the PR opened).*

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-02*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table names every changed value (`UNIFIED_DECISION_BOARD_MODE`, `BOARD_VARIETY_PENALTY_WEIGHT`, 3 new census constants) with derivations, not magic numbers; deletions justified by name |
| 2. Inspectability | PASS | Wiring table follows checklist format; no new traces needed — existing `decision_board_comparison`/`strategic_action_started` reused; census reports concurrency even where it doesn't gate |
| 3. Determinism | PASS | "No new random code; existing jitter and tie-breaks pinned" — PRNG callouts section explicit, backed by existing tie-break test |
| 4. Fail-soft | PASS | Fail-soft table covers 4 cases incl. board-scoring throw, missing candidateIndex, zero-population census, and constructed-test empty-world; deletion removes a silent-catch path rather than adding one |
| 5. Narrative over mechanical | PASS | Kill criteria and Vision audit both argue the gate change protects "a legible life," not a start count — concrete, not asserted |
| 6. Additive over destructive | PASS-with-note | Genuinely destructive: deletes contest B, `STRATEGIC_ENCOUNTER_SCORE_BRIDGE`, and 2 constants outright. Plan's own note is honest about this being the one deletion; it's the substrate plan's (§4) scheduled removal, not a surprise — but it is still a destructive change, correctly not laundered as additive |
| 7. Performance budget | PASS | "Removes a contest from the per-agent path" — measured, not asserted; no new phase or per-tick cost added |

NFP AUDIT: PASS-with-notes (see NFP #6)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, graph nodes/edges, tick phases, resolution logic, PRNG callouts all filled with specific detail (3 slices, constants, fail-soft table) |
| Content | N/A-with-rationale | "no template, prose, or data-table change; the variety weight is a board constant" — acceptable |
| UI | N/A-with-rationale | "nothing renders differently... surfaces for both are shipped" — acceptable, includes a Debug inspection subsection despite N/A framing (extra detail, not a defect) |

No missing required sections.

Wiring section check: Present and connects all four active modules to orchestrator phase (`phaseAgentDecision`), GameState fields, existing traces, and debug visibility (CLI `balance summary`); UI/Component columns are correctly `—` given UI:N/A.

Substrate-existence check: `## Substrate inventory` section present, opens the doc, states extends/activates/preserves per subsystem with runtime counts (27 mortals/seed, decision counts). Cross-checked against `Docs/canon/systems-inventory.md`: `decision` (`decisionBoard.ts`) listed 🟢 ACTIVE tagged THR-1292/THR-1349; `strategic` module 🟢 ACTIVE. No green-field duplication — the plan correctly activates/extends existing subsystems rather than proposing new ones.

PILLAR AUDIT: PASS

### Vision audit

**Vision premises touched:**
- `00-north-star.md` → "the mortal is not a unit" / weight of threads — [confirmed]. Plan explicitly frames the contest-B artifact (one mortal holding 8–11 concurrent undertakings) as violating this, and cites it near-verbatim.
- `01-core-loop.md` → scan → encounter → aftermath, encounter as "the chapter" — [confirmed]. Live board raises absolute encounter starts (472→692, 389→627) and lowers undertaking stacking, which the plan reads as restoring the encounter default.
- `02-non-negotiables.md` → #2 Narrative over mechanical perfection — [confirmed, self-cited]; #5 Expansive/conservative — [confirmed, brainstorm companion linked]; #7 Three pillars — [confirmed, Content/UI marked N/A with rationale]; #1, #3, #4, #6 → not referenced (engine-internal, no player-facing surface, no graph shape change).
- `03-design-tensions.md` → Tension #2 (systemic emergence vs. authored moments) — [confirmed]. Plan explicitly invokes it, arguing the flip restores the encounter as the curated-chapter default over undertaking accumulation.
- `taste-profile.md` → not referenced; no prose/numbers/UI surface touched.

**Vision contradictions:** No contradictions found.

**Five qualitative checks:**
- North star: yes — corrects a mechanism that was making mortals feel like stacked units, not people.
- Core loop: preserves it — no change to player-facing scan/encounter/aftermath rhythm; this is upstream agent-decision plumbing feeding the encounter pool.
- Non-negotiables: stays inside them — no direct control added, no numbers surfaced, three-pillar N/A is argued, not skipped.
- Design tensions: leans on tension #2 toward authored/encounter side, but the plan's own data shows this corrects a degenerate stacking artifact (contest B) rather than suppressing genuine emergence — the underlying systemic generation (candidates, scoring) is preserved untouched.
- Taste profile: no strong opinion at risk; no player-visible surface.

VISION AUDIT: PASS
