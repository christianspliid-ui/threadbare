# Grill-Me Synthesis — Cross-Content Variety & Coverage Program

**Date:** 2026-06-22 · **Mode:** conversational (batched rounds) · **Feeds:** THR-469 / `2026-06-22-cross-content-variety-and-coverage-program.md`
**Questions asked:** 12 (large scope; focused on cruxes per director's concision preference)

## 1. Scope under interrogation
The cross-content variety & coverage program (THR-469): how to generate more variety and coverage across all content types, what "coverage" means, what to fill, how much, who fills it, and in what order.

## 2. Confirmed decisions (director verdicts)

| # | Decision | Verdict |
|---|----------|---------|
| 1 | **Sequencing vs broken delivery** | **Author in parallel** — do NOT gate authoring on the delivery fixes (THR-464/465). Accept some surfacing waste. |
| 2 | **Coverage goal** | **Global catalog completeness** — optimize the whole catalog, not per-run felt variety. |
| 3 | **Coverage shape** | **Uniform fill** to threshold (not weighted-by-playtime). |
| 4 | **Repo-health gate** | **Do not gate** this program on test-suite stabilization. |
| 5 | **Matrix spine** | **Reach × scale × content-type** = ~32 primary cells/type. Archetype-pole / rarity / location-subtype tracked as *secondary* fill within cells. |
| 6 | **Cell threshold** | **≥5 entries per cell** = "filled". |
| 7 | **Type scope** | **All authored player-encountered content**: encounters, attachments/items, conditions, spells, artifacts, omens, sublocations, non-encounter actions. **Excludes** generative systems (agent/culture/faction generation). |
| 8 | **Authoring engine** | **Agent pipelines at volume + gates** (Cowork/CC run authoring pipelines; editorial + systems-audit + director sample verdicts). |
| 9 | **Audit-first** | **Yes** — census + re-tag existing content (~328 reward attachments, ~88 omens, ~210 encounters) into the matrix FIRST; author only genuinely empty cells. |
| 10 | **Sublocation depth (P2)** | **Flavor + encounter-gating first** for the 7 non-Gold reaches; defer Gold-style systemic behavior. |
| 11 | **Quality gate at scale** | **Automated eval scoring + sampled verdicts** (every entry scored against the Meeting-encounter bar; director verdicts a sample per batch + all marquee). |
| 12 | **Elder/foundation content** | **Exclude** from this matrix now; track in the separate Elder Magic & Ruins loop. |

## 3. Derived target (computed from #5, #6)
Primary spine = 8 reaches × 4 scales = 32 cells/type × ≥5 ≈ **~160 entries per content type**. Across ~8 in-scope types ⇒ a **~1,000–1,300 entry catalog floor** — but #9 (audit-first) means much may already be covered once existing content is tagged. Replaces the earlier hand-wavy "~1,000 surfaces." Note: not every type spans all 4 scales meaningfully (see grey zone R1).

## 4. Agent recommendations (⚡ — pushback welcome)
- ⚡ **DoD phasing by scale.** Wave 1 = fill `local` + `regional` cells to ≥5 (where playtime concentrates); `cosmic` + `personal` as a later wave. Keeps "uniform fill" from blocking on rarely-hit scales.
- ⚡ **Eval harness is a prerequisite, not an afterthought.** The chosen quality gate (#11) needs an automated scorer extending the Meeting-encounter eval. Treat it as P0.5 — without it, sampled verdicts collapse into a director bottleneck.
- ⚡ **Land surface-granular novelty early even under "author in parallel."** This is the one place I'd soften decision #1: a complete catalog can still *feel* repetitive if delivery concentrates on two templates (the current 37% problem). Authoring in parallel is fine, but ship the surface-granular novelty key (from THR-464/THR-467) early so the new catalog is actually *felt*. Otherwise we risk a full box of cards the dealer never shuffles.

## 5. Parked-then-resolved
None — all questions answered on first pass.

## 6. Open risks & assumptions
- **R1 — Scale applicability is non-uniform.** "Cosmic-scale condition" or "personal-scale sublocation" may be N/A. The census must encode **N/A vs empty** per (type × scale), or uniform-fill will chase impossible cells. *Resolve in P1 census design.*
- **R2 — Author-in-parallel + broken delivery (accepted).** A meaningful fraction of new content may not surface well until THR-464/465 land. Director accepted; mitigation = recommendation in §4.3.
- **R3 — Aggressive scope on an unstable suite (accepted).** Global completeness + uniform fill + mass agent authoring + no repo-health gate, on a test suite flagged unstable post-TB-120. Director explicitly accepted; flag for the executor to watch for regression churn.
- **R4 — Quality-gate dependency.** Automated eval harness does not exist yet; it gates the throughput model.
- **R5 — Pre-census estimates only.** Reward-attachment (~328) and omen (~88) counts may cluster heavily; true deserts unknown until the census + re-tag runs. All per-type targets are provisional until P1.

## 7. Inputs for the design doc (refinements to THR-469)
1. Replace "~1,000 surfaces" with the computed **reach × scale × type, ≥5/cell** target (~160/type).
2. Reframe the **Content Census** around the **global reach×scale spine** (per goal #2/#3), with: (a) N/A-vs-empty encoding per type×scale; (b) **re-tag existing content first**; (c) desert list = cells `<5`; (d) recommend it *also* surface the concentration/delivery view so felt-variety regressions are visible.
3. Add **P0.5 — automated eval harness** as an explicit dependency for the quality gate.
4. P2 sublocations = **flavor + encounter-gating** depth for 7 reaches.
5. Scope excludes generative systems and elder/foundation content.
6. Sequencing: authoring proceeds in parallel with delivery fixes; recommend surface-granular novelty lands early (§4.3).
7. Throughput = agent pipelines + editorial/systems-audit + automated eval + sampled director verdicts.
8. Program is **not** gated on repo health (director verdict; risk R3 recorded).
