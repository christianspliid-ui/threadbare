# Content Health Report — Design & Test-Functionality Assessment

**Author:** Cowork · **Date:** 2026-06-22 · **Status:** draft (director-requested; on-demand report)
**Related:** THR-457 (KPI harness), THR-471 (Content Census), THR-469 (cross-content program)

## Goal

An on-demand report that answers, over time, "how well is our content working?" It joins two halves:
- **Supply** — how much content of each type we have (from the Content Census, THR-471).
- **Demand** — how often each content type/entry triggers across a standard test matrix, and for which kind of god.

Run across a fixed matrix: **4 map seeds (landscapes) × 8 ascendants (one per primary reach) × 200 ticks = 32 runs.** Reports are generated artifacts (uncommitted), browsable over time under `http://localhost:5173/?view=cms`.

## Director decisions (2026-06-22)
- Must-have signal groups: **content-to-god match, dead content (never-fired), variety/concentration, outcome health + why-gated.** (All four.)
- Run depth: **200+ ticks** per run (deep).
- Cadence: **on-demand** (npm command; no CI/scheduled for now).
- History: **generated artifacts, uncommitted** — CMS reads local files.

## Report data — what goes in, and why it tells us content is working

Each section maps to a content-health question.

### 0. Header / config
Date, git short-SHA, seeds[4], ticks (200), map size, the 8 ascendant fixtures, total runs (32), engine version. Makes every report self-describing and comparable.

### 1. Content inventory (supply) — *do we have enough, and where?*
From the Content Census (THR-471): per-type counts; reach×scale coverage heatmap (filled/desert/empty/N/A); desert + empty lists. Static (not per-run); the denominator for everything below.

### 2. Utilization & dead content (must-have) — *are we authoring content nobody sees?*
Aggregated over all 32 runs:
- **Library utilization:** % of authored entries that fired ≥1×, overall and per content type.
- **Dead-content list:** specific entries that NEVER fired in any run, per type. The wasted-authoring list — the single most actionable output.

### 3. Variety / concentration + anti-recurrence benchmark (must-have, headline) — *does it feel fresh or same-beat-on-loop?*
Per run + aggregated: top-template share, normalized entropy, distinct-templates-fired.

**Repeatability categories.** Every content entry carries a `repeatability` tag:
- `unique` — fires at most once per playthrough; any repeat is a defect (bespoke/marquee story beats).
- `variant` — generic template that may recur only as a *distinct context-bound variant* (different bound entities — "trade route X&Y" vs "P&Q"); same-binding repeats are defects. This is the THR-467 context-multiplied surface case.
- `ambient` — low-salience texture; identical repeats tolerated under a soft cap.

**Category-aware anti-recurrence benchmark** (per playthrough = seed × god × 200t), measured at **binding granularity** (template + context key) via the THR-495 classifier — the same axis as THR-467 surface-granular novelty:
- `unique`: >1 fire → **red**.
- `variant`: **red** if (a) the same binding repeats, OR (b) one template's total fires exceed `MAX_VARIANT_FIRES_PER_PLAYTHROUGH` (first-guess 8) even across distinct bindings (soft cap so one parameterized template can't dominate).
- `ambient`: **red** if a single entry exceeds `MAX_AMBIENT_FIRES_PER_PLAYTHROUGH` (first-guess 12).
- **Untagged** entries → listed as a re-tag worklist and **excluded** from the recurrence verdict until categorized.

This is the load-bearing "is content working" signal — it measures whether a player sees the same *beat* twice in one run while crediting genuine variant-variety.

### 4. Content-to-god match (must-have, the headline) — *does an Iron god get Iron content?*
The matrix this report exists for. 8 rows (ascendant primary reach) × per-row:
- reach-distribution of triggered content (mini-bars across the 8 reaches);
- **own-reach share %** (what fraction of triggered content matches the god's primary reach);
- **match score** (own-reach share vs a uniform/expected baseline);
- **reaches never seen** by that god.
Reveals whether content is well-matched to god type — the core of replayability across different gods. A flat distribution for every god = content ignores who you are; a healthy bias toward own-reach (without starving others) = content responds to god identity.

### 5. Per-content-type breakdown — *which types are healthy vs starved?*
For each type (encounters, attachments, conditions, spells, artifacts, omens, sublocations, actions): total fires, distinct fired, utilization %, concentration. Surfaces type-level imbalance (e.g., omens fire constantly, artifacts never).

### 6. Outcome health (must-have) — *does interacting feel good?*
Outcome-ladder distribution (clean-success / success-at-cost / failure / critical-failure) overall and per god; branching-encounter fires per 30t (marquee-content delivery). Ties to THR-451/465.

### 7. Why-gated / eligibility funnel (must-have) — *if content isn't firing, why?*
Aggregated funnel: considered → gated-by-which-gate (cap / prerequisites / awareness / threat) → scored → selected. Most-gated content list. Turns "this never fires" into a diagnosable cause (the THR-452/465 lever).

### 8. Seed stability (secondary) — *is content robust across landscapes?*
Variance of key metrics across the 4 seeds. High variance = content exposure is landscape-fragile (some content seed-locked).

### 9. Trend (secondary) — *are we improving as we add content?*
Per-metric delta vs the previous report (CMS keeps history). Utilization up? Dead-content shrinking? Concentration falling? This is the "follow development over time" payoff.

### 10. Health flags
Red/amber/green per metric vs thresholds (reuse KPI thresholds; add content-health ones: utilization floor, dead-content ceiling, match-score band). One-line verdict.

## Test-functionality assessment — what's missing

The current `gameplay-report` harness gets us part-way but has real gaps:

| # | Gap | Status | What's needed |
|---|-----|--------|---------------|
| **G1** | **Per-ascendant-reach run config** | **Missing — load-bearing** | Harness uses `createBalancedCosmology()` + random `generateArchetypes(seed)[0]`; it cannot pin the god's primary reach. Build **8 deterministic `AscendantIdentity` fixtures**, one per reach (using the 1:1 sphere↔reach map: Force→Iron, Matter→Stone, Energy→Eye, Life→Gold, Mind→Veil, Spirit→Heart, Time→Star, Entropy→Shadow), driven via `createAscendantFromIdentity`. Add a harness param to select one. |
| **G2** | **Matrix runner** | Missing | New `scripts/content-health-report.ts`: loops 4 seeds × 8 fixtures × 200t, aggregates, writes JSON+manifest. Reuses the KPI compute path parameterised by identity. |
| **G3** | **Content classifier (templateId → {type, reach, scale})** | Missing — shared dep | Needed to bucket trigger data by content type and reach (powers §2/§4/§5). Build once in THR-471 (census) and **reuse here** — single source of truth for classification. |
| **G4** | **Per-type / per-reach trigger aggregation + never-fired tracking** | Partial | KPI tracks concentration by templateId and an eligibility funnel; extend to bucket fires by type+reach (via G3) and to record the never-fired set across the whole matrix. |
| **G5** | **Content-to-god match metric** | Missing | New computation: reach-distribution of triggered content per ascendant + own-reach share + match score (§4). |
| **G6** | **CMS report viewer + history** | Missing | Report script writes JSON to a gitignored **`public/reports/`** dir + a `public/reports/index.json` manifest; a CMS registry entry + viewer **fetches** `/reports/index.json` then a selected report (Vite serves `public/` at `/`), renders the sections, and computes trend deltas vs the prior report. (Fetch-at-runtime, not static import, because history is dynamic + uncommitted.) |
| **G7** | **Census integration** | Depends on THR-471 | Report embeds census output for §1; if census isn't ready, §1 degrades gracefully to raw counts. |
| **G8** | **Perf / determinism** | Note | 32 × 200t ≈ 15+ min. Fixtures must be deterministic for comparability. Add a `--quick` subset (e.g., 2 seeds × 8 gods × 120t) for fast iteration; full matrix for real reports. |

**Net:** the report is buildable on the existing engine, but needs (1) the 8 ascendant fixtures + harness hook [G1], (2) a matrix runner [G2], (3) a shared content classifier [G3, ideally from THR-471], (4) per-type/reach + never-fired aggregation [G4/G5], and (5) the CMS viewer + history mechanism [G6]. None require prose authoring — all engine/instrument/frontend (**Sonnet-lane**).

## Three pillars
- **Engine:** ascendant fixtures + harness param (G1); matrix runner (G2); classifier (G3); aggregation + match metric (G4/G5). Pure, deterministic, no PRNG beyond the seeded engine.
- **Content:** N/A authoring. The classifier's tag resolution is the only content-facing surface (shared with census).
- **UI:** CMS report viewer + history timeline + trend deltas (G6). Browser-verify at 1920×1080 per the viewport contract (Definition of Done) — screenshot via Playwright (DOM) since CMS is not WebGL.

## Constants (NFP #1)
`REPORT_SEEDS` (4), `REPORT_TICKS` (200), `REPORT_ASCENDANT_REACHES` (8 fixtures), `MAX_VARIANT_FIRES_PER_PLAYTHROUGH` (8), `MAX_AMBIENT_FIRES_PER_PLAYTHROUGH` (12) — `unique` cap is fixed at 1; content-health thresholds (`UTILIZATION_MIN`, `DEAD_CONTENT_MAX`, reuse KPI thresholds for outcome/concentration). All named.

**Settled decisions (2026-06-22):** (1) the 8 ascendant fixtures each run their **aligned per-reach cosmology**; (2) the headline benchmark is the **category-aware per-playthrough anti-recurrence** metric (§3) keyed on the `repeatability` tag (`unique`/`variant`/`ambient`), measured at binding granularity; (3) untagged content is reported as a re-tag worklist and excluded from the recurrence verdict.

## Fail-soft (NFP #4)
A run that throws → record the cell as errored, continue the matrix (never abort all 32). Census missing → §1 degrades to raw counts. Classifier can't resolve a fired template → bucket as `unclassified`, surface the count, never drop.

## Phasing
1. **G1 — ascendant-reach fixtures + harness hook** (unblocks the matrix; small, well-specified → Ready for Dev now).
2. **G3 — content classifier** (coordinate with THR-471; shared util).
3. **G2/G4/G5 — matrix runner + aggregation + match metric** (the report engine).
4. **G6 — CMS viewer + history** (the surface).
Each gated by the prior; G8 `--quick` mode lands with G2.

## Relationship to existing work
Sibling to THR-457 (gameplay KPI) and THR-471 (content census) — this report is the join of the two across the god×seed matrix. Feeds THR-469 (measures whether the coverage program is working). All Sonnet-lane (no prose).

