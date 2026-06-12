# Gameplay Observability — KPI Harness, Eligibility Funnel, Batch Report

**Linear:** THR-457 · **Project:** Continuous Improvement · **Date:** 2026-06-11 · **Author:** Cowork

## Problem

The game is too complex to root-cause by hand. Two engagement-killing regressions lived on `main` unnoticed until a manual CLI investigation (2026-06-11):

- **Outcome economy collapse:** seed 42, 120 ticks → 101 resolved unified actions: 79 `failure`, 18 `critical_failure`, 4 `success_at_cost`, **0 clean successes** (89% failure). Seed 99: ~73%.
- **Rich content unreachable:** 0 of ~30 handcrafted branching encounters (`src/data/encounters/`) fired in 120 ticks; top 8 ambient templates = >50% of all encounters.

The creative director cannot analyse root causes himself anymore. Agents need first-class gameplay telemetry so that tuning decisions are data-driven and "fun regressions" are as visible as test regressions. This plan is the verification tool for THR-451 (outcome retune), THR-452 (branching reachability), THR-453 (novelty pressure), and the playtest-tuning vehicle THR-347.

## Relationship to existing instrumentation (extend, don't duplicate)

| Exists today | What it gives | Gap |
|---|---|---|
| `scripts/balance-eval.ts` + `npm run balance:smoke/cadence/journey/seed` | Multi-seed headless runs; `BalanceRunSummary` (decision counts, per-template decision summaries, idle reasons, forecast stats); `evaluateBalanceSummary()` vs `getDefaultBalanceTargets()` (`src/engine/balanceTargets.ts`) | Decision-side only. No **resolved-outcome distribution**, no template entropy, no branching-fire rate, no threaded-beat rate, no eligibility funnel. Skew like 89%-failure is invisible. |
| Trace buffer (`src/engine/traceBuffer.ts`, categories in `src/types/trace.ts`), incl. `FilterPipelineTrace` / `IdleDecisionTrace` | Per-event causality, headless-available | Per-event, ring-buffered; no longitudinal aggregate; rejected-candidate data evaporates |
| CLI (`scripts/cli.ts`, switch-dispatch) | `status`, `encounters`, `traces`, `eval` | No one-shot engagement readout; analysing requires hand-written `eval` reducers |
| `window.__DEBUG` bridge (`src/debug-bridge.ts`) | Health report, encounter log TSV, balance targets/summary | No KPI report method |

Decision: **extend the balance-eval family** with an engagement-KPI layer rather than building a parallel harness.

## Design

### Phase 1 — KPI module (Engine)

New module `src/engine/kpi/gameplayKpi.ts`, pure function:

```ts
export interface GameplayKpiReport {
  tick: number;
  seed: number | string;
  outcomes: OutcomeDistribution;            // counts + rates per outcome tier, overall and by scale
  templateConcentration: TemplateConcentration; // per-template counts, top-N share, normalized Shannon entropy
  branchingFire: BranchingFireStats;        // branching-encounter fires, fires per 30 ticks
  threadedBeats: ThreadedBeatStats;         // encounters involving threaded agents per 10 ticks
  eligibilityFunnel: EligibilityFunnelSummary; // per-template considered/gated/scored/selected + top blocking prerequisite
  resolutionGap: ResolutionGapStats;        // mean capability-vs-difficulty margin, by scale
  thresholds: KpiThresholdEvaluation[];     // red/amber/green per metric vs constants
}
export function computeGameplayKpiReport(state: GameState, runtime?: SimulationRuntime): GameplayKpiReport
```

Pure read over `state.unifiedActions`, the template registry (for branching/ambient classification — classify by template source/category field, not by id-prefix string matching), thread edges, and the funnel counters (Phase 2). No PRNG, no mutation (NFP #3: deterministic; report of a deterministic run is itself deterministic).

### Phase 2 — Encounter eligibility funnel (Engine)

Session-owned aggregate counters answering "why does `crafting.quest.flawed_steel` never fire?":

```ts
export interface EligibilityFunnelCounters {
  byTemplate: Record<string, {
    considered: number;
    gatedBy: Record<string, number>;   // prerequisite-type → count (first failing gate per evaluation)
    scored: number;
    selected: number;
  }>;
  sinceTick: number;
}
```

- Owned by `SimulationRuntime` (per CLAUDE.md load-bearing decision: engine caches per session, never module scope; `useSimulation` owns it in browser, CLI runner owns it headless).
- Hook points: `src/engine/encounterFilterPipeline.ts` (stage rejections — reuse the data `FilterPipelineTrace` already computes), `src/engine/generateEncounterCandidates.ts` (considered), `src/engine/encounterScoring.ts` (scored/selected).
- Always-on, O(1) per evaluation, bounded by `KPI_FUNNEL_MAX_TEMPLATES` entries.

### Phase 3 — Surfaces (UI pillar + CLI)

1. **CLI `kpi` command** in `scripts/cli.ts` (existing switch-dispatch pattern): pretty table + `kpi --json`.
2. **`window.__DEBUG.getKpiReport()`** in `src/debug-bridge.ts` (existing callback-registration pattern).
3. **DebugPanel KPI tab** — new tab in the existing DebugPanel tab pattern rendering the report (pretty-printed sections, red/amber/green threshold chips). Dev-only surface; the player-facing game is intentionally untouched (this is director/agent tooling, not game UI).

### Phase 4 — Batch gameplay report (Infrastructure)

`scripts/gameplay-report.ts` following the `balance-eval.ts` esbuild-bundle pattern, npm script `gameplay-report`:

- Runs `KPI_REPORT_SEEDS` × `KPI_REPORT_TICKS` headless (same init/runTick pipeline as CLI), computes `GameplayKpiReport` per run + cross-seed aggregate.
- Emits dated markdown to `Docs/audits/gameplay-reports/YYYY-MM-DD-gameplay-report.md`: KPI table with red/amber/green, worst offenders (top templates, most-gated branching encounters), delta vs previous report if one exists.
- Thresholds are **advisory** in v1 (no CI gate). A follow-up may wire it into the Friday drift scan — logged as a deferral, not in scope.

## Constants (NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `KPI_FAILURE_RATE_MAX` | 0.35 | failure+critical_failure share above this = red |
| `KPI_CRITFAIL_RATE_MAX` | 0.05 | critical_failure share above this = red |
| `KPI_CLEAN_SUCCESS_MIN` | 0.40 | clean success share below this = red |
| `KPI_TEMPLATE_TOP_SHARE_MAX` | 0.08 | any single template above this share = red |
| `KPI_TEMPLATE_ENTROPY_MIN` | 0.70 | normalized entropy below this = amber |
| `KPI_BRANCHING_FIRE_MIN_PER_30T` | 1 | branching fires per 30 ticks below this = red |
| `KPI_THREADED_BEAT_MIN_PER_10T` | 1 | threaded-agent beats per 10 ticks below this = amber |
| `KPI_FUNNEL_MAX_TEMPLATES` | 512 | funnel counter memory bound |
| `KPI_REPORT_SEEDS` | `[42, 99, 7]` | batch report seeds |
| `KPI_REPORT_TICKS` | 120 | batch report run length |
| `KPI_AMBER_BAND` | 0.15 | relative band around red thresholds rendered amber |

All in a new `src/engine/kpi/kpiConstants.ts`. Threshold defaults are first-guess targets — THR-347/THR-451 design will retune them; that's the point of making them constants.

## Tracing (NFP #2)

```ts
export interface KpiSnapshotTrace extends BaseTrace {
  category: 'kpi';               // new TRACE_CATEGORIES entry (additive)
  report: GameplayKpiReport;     // emitted when kpi command/bridge runs, not per tick
}
```

The funnel itself is aggregate counters, not traces — per-event causality already exists via `FilterPipelineTrace`. The funnel is the longitudinal rollup of the same signal.

## Fail-soft (NFP #4)

| Failure | Behavior |
|---|---|
| `unifiedActions` empty/missing | Report with zeroed sections + `insufficient_data` flags; never throw |
| Template registry lookup miss | Bucket as `unknown` category; count reported |
| Funnel exceeds `KPI_FUNNEL_MAX_TEMPLATES` | Stop adding new keys, set `truncated: true`, `console.warn` once |
| Runtime absent (no funnel wired) | Report omits funnel section with `funnel: 'unavailable'` |
| gameplay-report run crash on one seed | Continue remaining seeds, mark seed `crashed` in report |
| Previous report missing/unparseable | Skip delta section |

## Three pillars

- **Engine:** KPI module, funnel counters in SimulationRuntime, hook points in filter pipeline/candidate generation/scoring, one additive trace category.
- **Content:** N/A — no templates, prose, or content tables are authored or modified. (Rationale: pure instrumentation; the content-side consumers are THR-451/452/453.)
- **UI:** DebugPanel KPI tab + `__DEBUG.getKpiReport()`. Dev/debug surface by design; no player-facing change. Browser-verify at closeout: Playwright (DOM surface) — screenshot of DebugPanel KPI tab at 1920×1080, console capture, and `window.__DEBUG.getKpiReport()` state assertion.

## Wiring

| Surface | Wiring |
|---|---|
| Orchestrator | Funnel hooks called from existing filter/scoring call sites (no new tick phase) |
| GameState | None added — funnel lives on SimulationRuntime, report computed on demand |
| UI | DebugPanel new tab; registered in existing tab list |
| Traces | `kpi` category added to `TRACE_CATEGORIES` (additive) |
| Debug bridge | `getKpiReport()` via existing callback registration |
| CLI | `kpi` command in switch dispatch; `gameplay-report` npm script (esbuild pattern, mirrors `balance:*`) |
| Prose pipeline | N/A |
| Player controls | N/A |
| `Docs/plans/wiring-checklist.md` | Update with the new debug surface + trace category |

## Blast radius

No structural modification to any ≥100-importer file. `src/types/trace.ts` / `src/engine/traceBuffer.ts` (106 importers) receive **additive-only** changes (one new category string + one new trace interface) — no signature changes, no behavioral changes for existing callers. `encounterFilterPipeline.ts` / `encounterScoring.ts` get additive counter calls guarded by runtime-presence checks.

## Determinism (NFP #3)

Report computation is a pure function of state + counters. Counters increment inside the already-deterministic tick pipeline. Same seed + same ticks ⇒ identical report. No new PRNG draws.

## Alternatives considered

- **Grow `BalanceRunSummary` directly** instead of a separate KPI module: rejected — balance-eval is decision-forecast-oriented and consumed by existing targets machinery; bolting outcome/engagement metrics into it muddies both. The KPI module *reads* alongside it and the batch script reuses balance-eval's runner pattern.
- **Per-event funnel traces instead of counters:** rejected — ring buffer evaporates over 120 ticks; longitudinal questions need aggregates. The traces stay for per-event drill-down.
- **CI-gating thresholds in v1:** rejected — thresholds are first-guess; gating on them before THR-451 retunes the economy would make every CI run red. Advisory first, gate later.

## Kill criteria

Wrong if: (a) KPI report answers don't change tuning decisions within 2 weeks of landing (nobody cites it in THR-451/452/453 closeouts), (b) funnel counters measurably slow the tick loop (>2% on the 30-tick CLI smoke), or (c) the batch report rots unread for a month. Then: strip the funnel hooks (additive, trivially removable), keep the pure KPI module as a CLI-only tool, and log a retro entry.

## NFP compliance

| Priority | Status |
|---|---|
| 1 Tunability | PASS — all thresholds/bounds named constants |
| 2 Inspectability | PASS — this plan *is* inspectability; trace interface defined |
| 3 Determinism | PASS — pure computation, no PRNG |
| 4 Fail-soft | PASS — table above; never throws in tick loop |
| 5 Narrative over mechanical | PASS with note — dev-only surface; exists to protect narrative quality |
| 6 Additive over destructive | PASS — all changes additive |
| 7 Performance budget | PASS — O(1) counters; report on demand only; kill criterion (b) guards |

## Implementation order

1. Phase 1 + 2 (module + funnel + tests: unit on KPI math, contract on funnel hooks)
2. Phase 3 (CLI `kpi`, `__DEBUG`, DebugPanel tab)
3. Phase 4 (`gameplay-report` script + first committed report)

Done when: `kpi` works in CLI at tick 120 seed 42 reproducing the 2026-06-11 findings (≈89% failure, 0 branching fires, top-share >8% — the harness must detect the known-bad state), `npm run gameplay-report` emits the markdown, DebugPanel tab renders, all pre-commit gates green, 30-tick engine smoke passes.
