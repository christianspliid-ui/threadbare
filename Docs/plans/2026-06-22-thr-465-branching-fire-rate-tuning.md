# THR-465 — Branching encounter fire-rate tuning (cap reserve + curator weight)

**Date:** 2026-06-22
**Author:** Cowork (keep-work-flowing)
**Issue:** THR-465 (Encounter Format Migration)
**Type:** Engine balance tuning — single-pillar
**Source audit:** `Docs/audits/2026-06-22-encounter-content-and-delivery-assessment.md` §Delivery #2
**Follow-up to:** THR-452 (Done)

## Problem

THR-452's acceptance — **≥1 branching encounter fires per ~30 ticks for a threaded agent** — is not met. Re-measured 2026-06-22 (120t): **2 fires / 120t = 0.5/30t**, half the target, on both seeds 42 and 99. THR-452 moved the rate up from a hard 0, but it plateaued below the bar.

Eligibility-funnel root cause is **cap-gating**, not eligibility. The funnel shows branching candidates reaching the performance-cap stage and being cut there (`topGate=cap`), then the single survivor failing to out-score routine actions like `confront_the_unknown`.

Two compounding levers in `src/engine/encounter/branchingConstants.ts`:

1. **`BRANCHING_CAP_RESERVE = 1`** — `capWithDiversity()` in `encounterFilterPipeline.ts` (Phase 1b, ~line 477) guarantees only ONE branching quest entry survives the `MAX_SCORED_CANDIDATES = 40` cut. When an agent has 4–5 branching candidates (routine), the other 3–4 are dropped before scoring.
2. **`BRANCHING_CURATOR_BIAS_WEIGHT = 1.75`** — the surviving entry still has to win the scoring stage against high-baseline routine actions. 1.75× is sometimes not enough.

Funnel evidence (seed 42, considered=723, selected=0, topGate=cap): `reputation.iron.warlords_tribute`, `reputation.shadow.shadow_court_audience`, `reputation.gold.the_merchants_favor`, `reputation.shadow.the_infiltrators_approach`, `reputation.power.the_renowned_duel`. Seed 99: `reputation.star.the_star_pilgrim` was gated by `awareness` (a different, eligibility-side cause — see §Awareness case).

## Action 0 — re-baseline gate (do this first)

The assessment was taken on a tree **32 commits behind** `origin/main`. Before tuning anything, claim the issue, then on fresh `origin/main` run:

```
npm run gameplay-report        # or: npm run cli kpi across seeds 42/99/7
```

Confirm the branching fire rate is still ~0.5/30t. If fresh main already meets ≥1/30t, the fix may have landed via another change — in that case record the measurement, close as already-satisfied, and skip the tuning. Otherwise proceed.

## Design — tuning approach

This is a measured tuning loop, not a one-shot constant edit. Tune the **cap reserve first** (it admits more candidates to scoring — the upstream constraint), re-measure, then raise the **curator weight** only if survivors still lose scoring. Tuning reserve before weight keeps the two effects separable in the KPI trace.

**Tuning ladder (stop at the first rung that hits ≥1/30t on all three seeds):**

| Rung | `BRANCHING_CAP_RESERVE` | `BRANCHING_CURATOR_BIAS_WEIGHT` | Rationale |
|------|------------------------|----------------------------------|-----------|
| 0 (current) | 1 | 1.75 | Baseline — 0.5/30t |
| 1 | **2** | 1.75 | Admit a second branching candidate to scoring; most direct fix for `topGate=cap` |
| 2 | **3** | 1.75 | If two survivors still lose, widen the reserved set further |
| 3 | 3 | **2.25** | Survivors are admitted but lose scoring → lift the curator boost |
| 4 | 3 | **2.75** | Last resort before escalating; see Stop condition |

**Stop condition / escalation:** if rung 4 still misses on any seed, do NOT keep climbing — stop, record the KPI deltas, and post a comment on THR-465 flagging that the lever ceiling was reached. A miss past rung 4 means the cause is upstream of these two levers (eligibility, awareness gating, or candidate supply) and needs a separate diagnostic, not bigger numbers. Over-boosting risks branching crowding out variety (see guardrail).

## Guardrail — interaction with THR-464 (novelty pressure)

THR-464 (template concentration still 37%, High, Agent Success Redesign) is strengthening **novelty pressure** to spread encounter variety. Raising branching reach must not re-introduce concentration by letting the same 2–3 branching templates dominate a threaded agent's feed.

Verification requirement: alongside the branching fire-rate KPI, capture the **template-concentration metric** (top-template share) from the same `gameplay-report` run before/after. **Branching fire rate must reach ≥1/30t without top-template share rising above its pre-change value by more than ~3 pp.** If branching boosts push concentration up materially, prefer the lower cap-reserve rung and lean on `BRANCHING_CURATOR_COOLDOWN = 40` (already prevents the curator re-boosting the same (agent, template) pair) rather than a higher reserve. Note the concentration delta in the commit body so THR-464 can account for it.

## Awareness-gated case (`the_star_pilgrim`, seed 99)

`reputation.star.the_star_pilgrim` was cut by `awareness`, not by the cap — a different failure mode. This is **out of scope** for THR-465's cap/curator tuning. If it recurs in the Action-0 re-baseline, do not try to fix it with cap reserve. Record it in the closing comment and (if it materially suppresses the seed-99 rate) open a small follow-up Deferral issue under Encounter Format Migration for awareness-gate handling. Don't let one awareness-gated template block the cap-tuning acceptance on seeds 42/7.

## Three pillars

- **Engine** — `BRANCHING_CAP_RESERVE` and/or `BRANCHING_CURATOR_BIAS_WEIGHT` in `src/engine/encounter/branchingConstants.ts`. Cap reserve is consumed by `capWithDiversity()` Phase 1b in `encounterFilterPipeline.ts`; curator weight by `branchingCurator.ts`. No new code paths, no schema change — value edits to existing, already-wired levers.
- **Content — N/A.** Gate values and curator scaffolding shipped in THR-452. No new templates or prose.
- **UI — N/A.** This changes firing rate only; branching-encounter presentation shipped in Encounter Experience v1.

## Constants table (NFP #1)

| Constant | File | Current | Candidate range | Purpose |
|----------|------|---------|-----------------|---------|
| `BRANCHING_CAP_RESERVE` | `branchingConstants.ts` | 1 | 2–3 | Branching quest entries guaranteed past the `MAX_SCORED_CANDIDATES` cap into scoring |
| `BRANCHING_CURATOR_BIAS_WEIGHT` | `branchingConstants.ts` | 1.75 | 1.75–2.75 | Multiplicative score lift on nearly-eligible branching templates for threaded agents |

Both already named constants — the change is values only, keeping NFP #1 (tunability) intact. Update the doc comments' "first-guess" notes to reflect the THR-465-tuned values.

## Tracing & inspectability (NFP #2)

No new traces required — the eligibility-funnel trace (`topGate`, `considered`, `selected`) that produced the funnel evidence already exposes cap-gating. CC should paste the relevant funnel/KPI lines for the chosen rung into the closing comment as evidence (before vs after).

## Fail-soft (NFP #4)

| Case | Behavior |
|------|----------|
| Fewer branching candidates than `BRANCHING_CAP_RESERVE` at cap stage | `capWithDiversity()` loop simply reserves what exists (`if (added >= needed) break`) — no crash, no padding |
| Reserve consumes slots needed by diversity floor | Phase 2 fill clamps via `MAX_SCORED_CANDIDATES - reserved.length`; existing `remaining <= 0` guard returns `reserved.slice(0, MAX_SCORED_CANDIDATES)` |
| Curator weight raised but agent not threaded | `getBranchingCuratorBias()` returns the boost only for threaded, nearly-eligible pairs — unthreaded agents unaffected |

Determinism (NFP #3) preserved: both levers feed the existing seeded scoring path; same seed + same values = same selection.

## Acceptance

- ≥1 branching encounter fires per ~30 ticks for a threaded agent, verified via `kpi` across **seeds 42 / 99 / 7**.
- Top-template concentration does not rise > ~3 pp vs pre-change baseline (THR-464 guardrail).
- Deterministic per seed; fail-soft preserved; constants table in the commit body (NFP #1).
- Closing comment includes raw KPI/funnel output (before + after) for the chosen rung, plus the concentration delta.

## Pre-commit (engine change)

Engine-touching change → run the 30-tick CLI smoke before commit:
`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`
Plus the standard gate: `npm test`, `npx tsc --noEmit`, `npx vite build`. Paste evidence in the closing comment.

## NFP compliance

| NFP | Verdict |
|-----|---------|
| 1 Tunability | PASS — value-only edits to named constants |
| 2 Inspectability | PASS — existing funnel/KPI trace covers it |
| 3 Determinism | PASS — seeded scoring path unchanged |
| 4 Fail-soft | PASS — existing cap guards hold for all edge cases |
| 5 Narrative > mechanical | PASS with note — raises weighty-arc delivery; guardrail prevents variety regression |
| 6 Additive | PASS — no refactor; values only |
| 7 Performance budget | PASS — reserve of 2–3 is negligible vs 40-cap |
