# Encounter Content & Delivery Assessment — 2026-06-22

**Author:** Cowork · **Status:** assessment · **Trigger:** "Do we have enough variety and quantity of encounters so the player regularly sees and interacts with them?"

## TL;DR

**Quantity is not the problem. Delivered variety is.** The library holds 200+ encounter templates and 23 authored branching encounters; 107–112 distinct templates fire in a single 120-tick session. The bottleneck is the **selection pipeline**, which over-concentrates on a handful of ambient templates and still under-delivers the authored branching content — even after the June 11–12 emergency fixes (THR-451/452/453).

Three of the four gameplay KPIs are still red against their own targets:

| KPI | June 11 baseline | **June 22 measured** | Target | Verdict |
|-----|-----------------|----------------------|--------|---------|
| Failure rate | 89% | **29–33%** | ≤35% | ✅ Fixed (THR-451) |
| Clean-success rate | 0% | **26%** | ≥40% | ⚠️ Improved, still red |
| Template top-share | >50% (top 8) | **14.8% / 37.2%** (single template) | ≤8% | ❌ Still red (THR-453 insufficient) |
| Branching fires / 30t | 0 | **0.5** | ≥1 | ⚠️ Improved, still red (THR-452 short of acceptance) |

> **⚠️ Freshness caveat — read first.** Measurements were taken on branch `christianspliid/thr-75-...` at HEAD `7311a48c` (2026-06-12), **32 commits behind `origin/main`**. The THR-451/452/453 fixes ARE present in this tree, so conclusions about *those* are valid. But two later commits — **THR-459** (stepDifficulty 0–1 normalization) and **THR-62 Phase 5** (encounter migration & early-game retune) — touch outcome resolution and are NOT in this tree. The **clean-success** and possibly **concentration** numbers may already be better on current main. **Action 0 for any executor: re-run `npm run gameplay-report` on fresh `origin/main` before tuning.** The **branching-firing** and **content-inventory** findings are unaffected by the missing commits and stand as-is.

## Method

- Empirical: `npm run gameplay-report -- --ticks 120 --seeds 42,99` (THR-457 KPI batch harness). Report JSON at `Docs/playtests/kpi/2026-06-22-kpi-report.json`. (Seed 7 omitted — sandbox 45s timeout; two seeds are representative.)
- Static: content inventory of `src/data/encounters/` + linear-template content files; selection-pipeline read of `encounterFilterPipeline.ts`, `branchingCurator.ts`, `encounterScoring.ts`.
- Note: the KPI harness measures **autonomous agent encounter resolution** in a headless world (no bonded First, no player curation). It is the best available proxy for "what populates the world and is available to surface," but the player-facing curation path is not directly exercised. Same caveat THR-452 recorded.

## Content inventory — quantity & variety (the supply side)

**Authored branching encounters** (`src/data/encounters/`, the high-value player-choice "chapters"): **23 files.**

- Reach coverage spans all 8 canonical reaches. By step-level reach tally: iron (heaviest), heart, gold, shadow, eye, then star / stone / veil thinnest (≈8 each).
- **Scale: 100% `local`. Zero regional, zero saga-scale branching encounters.** The weighty multi-session arcs the game's vision calls for do not exist as branching content. ← genuine content gap.

**Ambient + linear-template encounters** (the volume layer):

| Source | Count |
|--------|-------|
| `encounter-content.ts` (`encounter.*` ambient) | ~159 |
| `social-scene-templates.ts` | 162 |
| `thieves-guild-encounter-content.ts` | 65 |
| `social-encounter-content.ts` | 57 |
| `borderland-encounter-content.ts` | 39 |
| `tavern-encounter-content.ts` | 38 |

**Delivered volume:** 112 distinct templates fired (seed 42), 107 (seed 99) over 120 ticks. The player is not starved for raw encounter count. **Conclusion: the supply side is healthy. Do not author more ambient encounters to fix "the player doesn't see variety" — that won't help.**

## Delivery analysis — what the player actually experiences (the demand side)

### 1. Template concentration is the dominant variety failure ❌

One template eats a huge share of all selections:

| Template | Seed 42 | Seed 99 |
|----------|---------|---------|
| `encounter.confront_the_unknown` | 91 (14.8%) | 340 (**37.2%**) |
| `encounter.grand_tournament` | 78 (12.7%) | 120 (13.1%) |
| `encounter.master_local_craft` | 51 (8.3%) | 26 (2.8%) |

Top 2 templates = ~28% (seed 42) / **~50% (seed 99)** of everything the world produces. Normalized entropy 0.78 / 0.64 (target ≥0.70; seed 99 amber). THR-453 shipped global+per-agent recency penalties and category quotas (`NOVELTY_GLOBAL_MAX_PENALTY=0.55`, etc.), but they are **not strong enough to hold its own acceptance criterion** (≤8% top-share). A single template at 37% means the player sees the same beat on loop despite a 200+ library — exactly the "no variety" symptom, caused by distribution, not supply.

### 2. Authored branching encounters still under-fire ⚠️

2 fires per 120 ticks per seed = **0.5 / 30t**, half the ≥1/30t target THR-452 set as acceptance. Improved from 0 (real progress), but the acceptance criterion is not met. The eligibility funnel shows why: branching candidates are **cap-gated**.

- `MAX_SCORED_CANDIDATES = 40` per agent per tick.
- `BRANCHING_CAP_RESERVE = 1` — only **one** branching entry is guaranteed past the cap into scoring. When an agent has 4–5 branching candidates available (the funnel shows this routinely), the rest are cut with `topGate=cap`, then the survivor must still out-score `confront_the_unknown` et al.
- Funnel evidence (seed 42): `warlords_tribute`, `shadow_court_audience`, `the_merchants_favor`, `the_infiltrators_approach`, `the_renowned_duel` — all `considered=723, selected=0, topGate=cap`. Seed 99: `the_star_pilgrim` gated by `awareness`.

### 3. Clean-success rate low ⚠️ (likely partly addressed on current main)

26% clean success vs ≥40% target; most encounters resolve `success_at_cost`. THR-451 lifted this from 0% but not to target. **THR-459 (difficulty normalization) and THR-62 Phase 5 (retune) are not in the measured tree** and plausibly move this — re-measure before acting.

### 4. Ambient low-conversion noise

Templates like `patrol_perimeter`, `barter_supplies`, `assess_holdings` are considered ~730× and selected 2× (conv <0.003), flooding the consideration set with chaff that crowds richer candidates. Secondary, but compounds #1 and #2.

## Recommendations (priority order)

**0. Re-measure on fresh `origin/main`** before any tuning — confirm #1–#3 persist after THR-459 / THR-62 Phase 5. One `npm run gameplay-report` run. (Gates the rest.)

**1. Strengthen template novelty pressure (variety — highest leverage).** THR-453's mechanism exists but is under-tuned; `confront_the_unknown` at 37% violates its acceptance. Raise `NOVELTY_GLOBAL_MAX_PENALTY` / shorten half-life, or add a hard per-template share ceiling. Re-verify ≤8% top-share across 3 seeds. → *new follow-up to THR-453.*

**2. Raise branching reach (delivery of authored content).** Bump `BRANCHING_CAP_RESERVE` (1 → 2–3) and/or `BRANCHING_CURATOR_BIAS_WEIGHT` so more branching candidates survive the cap and win scoring. Re-verify ≥1/30t. → *new follow-up to THR-452.*

**3. Author regional/saga-scale branching encounters (content gap).** All 23 branching encounters are `local`. The vision's weighty arcs need regional/saga-scale branching content. Scope a first batch via `encounter-pipeline`. → *new content issue, Encounter Format Migration / Content Architecture.*

**4. (Optional) Down-weight low-conversion ambient chaff** so the consideration set isn't dominated by near-never-fired templates.

## NFP / constants touchpoints

All levers are named constants (NFP #1 holds): `NOVELTY_GLOBAL_MAX_PENALTY=0.55`, `NOVELTY_GLOBAL_HALF_LIFE=4`, `NOVELTY_AGENT_MAX_PENALTY=0.45`, `NOVELTY_CATEGORY_QUOTA_SOFT=0.18`, `NOVELTY_COMBINED_CAP=0.75` (`src/data/agent-behavior-constants.ts`); `MAX_SCORED_CANDIDATES=40` (same file); `BRANCHING_CAP_RESERVE=1`, `BRANCHING_CURATOR_BIAS_WEIGHT=1.75`, `BRANCHING_CURATOR_COOLDOWN=40` (`src/engine/encounter/branchingConstants.ts`). Tuning is judgment-driven; per the THR-347 pattern, user verdict gates ship.

## Appendix — raw KPI (120t, June-12 tree)

```
Seed 42  failure 29.0%  critfail 0.0%  clean 26.1%  top_share 14.8%  entropy 0.78  templates 112  branching 2 (0.50/30t)
Seed 99  failure 33.3%  critfail 0.0%  clean 25.8%  top_share 37.2%  entropy 0.64  templates 107  branching 2 (0.50/30t)
```
JSON: `Docs/playtests/kpi/2026-06-22-kpi-report.json`
