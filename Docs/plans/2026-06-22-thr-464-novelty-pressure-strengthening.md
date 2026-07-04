# THR-464 — Strengthen novelty pressure (template concentration still 37% after THR-453)

**Date:** 2026-06-22
**Author:** Cowork (keep-work-flowing)
**Issue:** THR-464 (Agent Success Redesign)
**Type:** Engine scoring/distribution tuning — single-pillar
**Source audit:** `Docs/audits/2026-06-22-encounter-content-and-delivery-assessment.md` §Delivery #1
**Follow-up to:** THR-453 (Done — shipped the novelty mechanism this plan strengthens)
**Mutex with:** THR-465 (both move the same KPI surface — see §Interaction)

## Problem

THR-453 shipped novelty pressure (global + per-agent recency penalty, category quotas), but its own acceptance — **no single template > 8% of selections over 120 ticks across 3 seeds** — is not met. Re-measured 2026-06-22 (KPI batch harness, 120t):

- Seed 42: `encounter.confront_the_unknown` = **14.8%** of all selections; `encounter.grand_tournament` 12.7%. Entropy 0.78.
- Seed 99: `encounter.confront_the_unknown` = **37.2%**; `grand_tournament` 13.1%. Entropy 0.64 (amber).

Top 2 templates = ~28% / ~50% of all world output against a 200+ template library. This is the core "no variety" symptom and it is a **distribution** failure, not a content-supply failure. THR-466 (supply) is independent and does not block this.

## Action 0 — re-baseline gate (do this first)

The assessment was taken on a tree **32 commits behind** `origin/main`. Before tuning anything, claim the issue (`save_issue assignee:"me" state:"In Dev"`, then `get_issue` to confirm the write stuck), then on fresh `origin/main` run:

```
npm run gameplay-report        # or: npm run cli kpi across seeds 42/99/7
```

Confirm `confront_the_unknown` still tops ~15–37% after THR-459 / THR-62 Phase 5. If fresh main already satisfies < 8% top-share, record the measurement and close as already-satisfied — skip the tuning.

## Step 1 — verify the noun before the verb (root-cause the escape)

Before touching any constant, confirm **why `confront_the_unknown` specifically escapes the recency penalty.** The 37.2% on seed 99 is far above what a 0.55 global + 0.45 agent penalty (combined-capped at 0.75) should permit if the penalty were actually applying. The mechanism (`src/engine/encounterScoring.ts`):

- `globalRecencyPenalty(record, templateId, tick)` = `NOVELTY_GLOBAL_MAX_PENALTY * exp(-ln2 * ticksSince / NOVELTY_GLOBAL_HALF_LIFE)`, keyed by `record.globalLastSelected[templateId]`.
- `agentRecencyPenalty(...)` analogous, keyed by `agentLastSelected[templateId]`.
- Both combine and clamp at `NOVELTY_COMBINED_CAP = 0.75`.

Candidate failure modes to rule out by inspection / a one-tick `kpi` trace **before** retuning:

1. **Key mismatch.** The selection commit may record the global last-selected tick under a different id than the scoring lookup uses (e.g. the unified-action id vs the encounter templateId, or a `confront_the_unknown` variant family). If `globalLastSelected['encounter.confront_the_unknown']` is never written, `ticksSince` is `undefined` → zero penalty every tick. This is the most likely cause of a 37% escape and is a **bug fix**, not a tuning lever — fixing it may resolve the issue without raising any constant.
2. **Baseline dominance.** `confront_the_unknown` may carry a baseline score so high that even a full 0.75 multiplicative penalty leaves it on top. If so, the lever is the penalty ceiling / a hard share-cap backstop, not the half-life.
3. **Re-considered-fresh path.** Confirm it flows through the same scoring path that applies novelty (it is an `encounter.*` template, so it should — but verify it isn't injected via a bypass like a guaranteed/fallback "something always happens" path).

Emit the scoring trace (`category: 'encounter_scoring'`, top-5) for a tick where `confront_the_unknown` is selected and read off its applied novelty multiplier. **If the multiplier is ~1.0 when it should be penalised, stop — this is failure mode 1 (key mismatch), fix the key, re-measure, and most likely you are done.**

## Step 2 — strengthen the existing mechanism (only if Step 1 shows the penalty is applying but is too weak)

Do **not** add a parallel system. Strengthen THR-453's levers (all named constants in `src/data/agent-behavior-constants.ts`). Tune one axis at a time, re-measure between rungs, stop at the first rung that brings top-share < 8% on seeds 42/99/7.

**Tuning ladder:**

| Rung | Lever | From → candidate | Rationale |
|------|-------|------------------|-----------|
| 1 | `NOVELTY_GLOBAL_HALF_LIFE` | 4 → 6–8 | Slower decay = penalty persists longer after a global selection, so a hot template stays suppressed for more ticks. Cheapest, most targeted lever for a *global* concentration problem. |
| 2 | `NOVELTY_GLOBAL_MAX_PENALTY` | 0.55 → 0.65–0.70 | Deeper trough immediately after selection. |
| 3 | `NOVELTY_COMBINED_CAP` | 0.75 → 0.85 | Lets global+agent penalties stack deeper for a template that is both globally and per-agent recent. Raise only if rungs 1–2 are capped out by the combined ceiling. |
| 4 (backstop) | New `NOVELTY_TEMPLATE_SHARE_CEILING` | n/a → 0.10 | Hard per-template selection-share ceiling over the rolling window: once a template exceeds the ceiling within `NOVELTY_CATEGORY_WINDOW_TICKS`, apply a steep additional penalty (or exclude from the top-gate). Deterministic backstop that guarantees the acceptance bound regardless of baseline dominance. Add only if rungs 1–3 cannot hold the line — it is a harder mechanism and should be the last resort. |

**Guardrail (THR-465 interaction):** raising global novelty pressure suppresses high-frequency *routine* templates — which is exactly the field branching encounters must out-score. Capture branching fire rate before/after; novelty strengthening must **not** drop branching fires below the THR-465 target line. If the two pull against each other, record the deltas and coordinate sequencing (see §Interaction).

## Three pillars

- **Engine** — scoring/distribution only (`encounterScoring.ts` + constants in `agent-behavior-constants.ts`). Either a key-mismatch bug fix (Step 1) or named-constant tuning / one bounded new constant (Step 2).
- **Content** — **N/A.** No template authoring; the novelty mechanism already shipped in THR-453.
- **UI** — **N/A.** Distribution is invisible to the player surface; no component, modal, toast, chronicle, or hex signifier changes. (Browser-verify exempt: no runtime UI change — state it in the closing commit body.)

## Constants table (NFP #1)

| Constant | Current | This ticket | Purpose |
|----------|---------|-------------|---------|
| `NOVELTY_GLOBAL_HALF_LIFE` | 4 | tune ↑ (rung 1) | Ticks for global recency penalty to halve. |
| `NOVELTY_GLOBAL_MAX_PENALTY` | 0.55 | tune ↑ (rung 2) | Max global recency penalty at ticksSince=0. |
| `NOVELTY_COMBINED_CAP` | 0.75 | tune ↑ (rung 3) | Ceiling on stacked global+agent+category penalty. |
| `NOVELTY_TEMPLATE_SHARE_CEILING` | — | new, default 0.10 (rung 4 only) | Per-template rolling selection-share ceiling backstop. Add only if rungs 1–3 fail. |
| `NOVELTY_AGENT_HALF_LIFE` / `_AGENT_MAX_PENALTY` / `NOVELTY_CATEGORY_*` | unchanged | — | Left as shipped unless measurement implicates them. |

Every value that moves must be a named constant with its default and a one-line purpose in the closing commit body.

## Tracing (NFP #2)

Reuse the existing `encounter_scoring` ScoringTrace (top-5 with per-candidate novelty multiplier). **Requirement:** when a novelty penalty changes which candidate wins (i.e. the pre-penalty top differs from the post-penalty selection), emit a trace field recording the penalty delta and the displaced templateId, so the distribution fix is inspectable from the funnel. If rung 4 is used, the share-ceiling activation must also appear in the trace.

```ts
interface NoveltyDecisionTrace {
  tick: number;
  agentId: string;
  prePenaltyTop: string;      // templateId leading before novelty
  selected: string;           // templateId actually chosen
  noveltyMultiplier: number;  // applied to `selected`
  shareCeilingHit?: string;   // templateId suppressed by rung-4 backstop, if any
}
```

## Determinism (NFP #3)

All tuning is to deterministic, seeded scoring inputs — no new RNG draws. Same seed + same constants ⇒ identical selections. Verify by running the same seed twice and diffing the selection sequence.

## Fail-soft table (NFP #4)

| Failure case | Fallback |
|--------------|----------|
| `globalLastSelected[templateId]` undefined (never selected) | Treat as zero penalty (current behaviour) — full novelty, never throws. This is also the bug surface from Step 1. |
| Recency record / global novelty state missing on GameState | Skip novelty penalty for the tick (multiplier 1.0); never crash the scoring phase. |
| Rolling window counters absent (rung 4) | Share-ceiling inactive (no suppression) rather than thrown — degrades to rungs 1–3 behaviour. |
| Division/`exp` on malformed `ticksSince` (negative/NaN) | Clamp to 0 penalty; log once via trace, continue. |

## Interaction with THR-465 (mutex)

THR-465 (raise branching fire rate via cap reserve + curator weight) and THR-464 both move the encounter candidate/scoring pipeline and each shifts the other's KPI: THR-464 suppresses high-frequency routine templates (which can *help* branching win) but stronger global novelty can also dampen branching templates if they recur. **Do not tune both in the same In Dev window.** Whichever lands first records its fire-rate **and** top-template concentration deltas; the second re-baselines on the merged result before tuning. THR-465 is already in Ready for Dev — expected to land first; this ticket re-baselines after it merges.

## Acceptance / Done when

- No single template > 8% of selections over 120 ticks on seeds 42/99/7, verified via `kpi` template top-share.
- Branching fire rate not regressed below the THR-465 target (record before/after).
- Deterministic per seed (NFP #3); fail-soft on missing recency data (NFP #4); decision trace emitted when novelty changes a selection (NFP #2); constants table in the closing commit body (NFP #1).
- 30-tick CLI smoke (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) + `npm test` + `npx tsc --noEmit` + `npx vite build` green; raw KPI/funnel output (before + after) pasted in the closing commit/comment.
- Tuning is judgment-driven; **user verdict gates ship** (THR-347 pattern) — land the change but flag in the closing comment that final constant values are subject to Christian's playtest sign-off.

## NFP compliance

| NFP | Status |
|-----|--------|
| 1 Tunability | PASS — all levers are named constants; at most one new named constant (rung 4). |
| 2 Inspectability | PASS — reuses `encounter_scoring` trace + adds novelty-decision fields. |
| 3 Determinism | PASS — no new RNG; seeded scoring inputs only. |
| 4 Fail-soft | PASS — see fail-soft table; missing data → no penalty, never throws. |
| 5 Narrative over mechanical | PASS with note — distribution fix serves variety/story-freshness; no mechanical-vs-narrative tension. |
| 6 Additive over destructive | PASS — strengthens THR-453 in place; rung 4 is additive (new constant + guarded branch), no rewrite. |
| 7 Performance budget | PASS — same per-candidate scoring cost; rung 4 adds O(1) rolling-window lookups. |
