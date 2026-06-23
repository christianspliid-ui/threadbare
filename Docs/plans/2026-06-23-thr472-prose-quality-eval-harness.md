# THR-472 — Automated Prose-Quality Eval Harness (P0.5)

**Date:** 2026-06-23
**Issue:** THR-472 (Content Architecture · parent THR-469)
**Status:** Ready for Dev (design complete)
**Author:** Cowork (keep-work-flowing PM pass)
**Suggested model:** sonnet

---

## 1. Why

THR-469's mass-authoring throughput model is *"agent pipelines at volume + automated eval scoring + sampled director verdicts."* That model has a missing leg: there is no **automated prose-quality scorer**. Without it, "sampled verdicts" collapses into the director being the QA bottleneck at catalog scale, which is exactly the failure mode the program exists to avoid.

This harness is a **hard dependency for P3+ (mass authoring)**. It does **not** block P1 (census, THR-473 — shipped) or P2 (sublocation authoring at small volume with manual review). It is sequenced as P0.5 so it is ready before volume authoring begins.

The design intent is deliberately conservative: **operationalize the quality bar that already exists in committed, director-approved artifacts** — not invent a new one. The scorer is a measuring instrument calibrated against the existing voice contract; it does not get a vote on taste. Where a threshold encodes a taste judgment, it becomes a named tunable constant (NFP #1) that the director calibrates against a sample run, never a hardcoded verdict.

### Source artifacts (the rubric is derived, not authored)

| Artifact | What it supplies |
|----------|------------------|
| `Docs/plans/2026-03-06-content-strategy.md` | The voice contract: 3 voice modes + length rules, thematic rules ("show, never explain"), 19 archetype tones, **Hard Exclusions** (§ Hard Exclusions) |
| `Docs/plans/2026-03-26-meeting-encounter-prose-eval.md` | The qualitative walkthrough framework this harness automates |
| `Docs/plans/2026-04-16-systemic-wiring-guide.md` | Enrichment-placeholder vocabulary + **Anti-Pattern 2 "Static Strings in Dynamic Fields"** |
| `scripts/lint-encounter-content.ts` | **Existing scaffolding to extend** — `FLOWERY_PHRASES`, `PROBABILITY_PHRASES`, `FORECAST_DIGIT_PATTERN`, `PROSE_WARNING_THRESHOLD`/`PROSE_LOUD_WARNING_THRESHOLD` banding |
| THR-86 (5 prose shapes) | `svo / aftermath / inverted / compound / fragment` shape vocabulary for variety scoring |

**Key framing for the implementer:** this is an *extension* of the existing encounter-content linter into a *scored, batch-capable* harness, not a greenfield build. Reuse `lint-encounter-content.ts`'s detection lists and banding constants; do not duplicate them — promote shared detectors into a module both can import.

---

## 2. What it produces

For a single content entry: a **banded score** (`pass | warn | fail`) plus a numeric sub-score (0–100) and a **structured flag list**. For a batch: scored entries ranked worst-first, with the bottom tail surfaced for human review and all marquee-tier entries always surfaced regardless of score.

The four flag categories named in the ticket map to concrete detectors:

1. **Voice-contract violations** — purple prose (extend `FLOWERY_PHRASES`), numbers/probabilities in prose (`FORECAST_DIGIT_PATTERN` + `PROBABILITY_PHRASES`), length-rule breaches (Divine > 2 sentences, Chronicler > 3 sentences), and "tell-don't-show" markers (e.g. `the tragedy of it was`, `she felt`, explicit emotion-naming).
2. **Hard-exclusion content** — pattern match against the § Hard Exclusions list (sexual violence, child victimization, etc.). **Any hit is an automatic `fail` regardless of other scores** — this is a gate, not a weighted contributor.
3. **Static-Strings-in-Dynamic-Fields** — narrative/template fields with no enrichment placeholders (no `{name}`, no `{they}/{them}/{their}`, no `{?...}` conditional). Directly from wiring-guide Anti-Pattern 2.
4. **Missing enrichment** — softer than (3): a field that has `{name}` but no conditional block, or no pronoun placeholders where the agent's identity would change emotional texture. A warn-level nudge toward the dynamism the engine supports.

---

## 3. Engine pillar — the scorer

**Module:** `src/engine/content-eval/proseQualityScore.ts` (pure, deterministic, no I/O).

```ts
export type ProseBand = 'pass' | 'warn' | 'fail';

export interface ProseQualityFlag {
  category: 'voice-contract' | 'hard-exclusion' | 'static-string' | 'missing-enrichment';
  severity: 'gate' | 'loud' | 'soft';   // gate => forces fail
  field: string;                         // which template field tripped it
  detail: string;                        // human-readable reason
  evidence: string;                      // the offending substring (truncated)
}

export interface ProseQualityResult {
  entryId: string;
  contentType: string;                   // encounter | condition | omen | attachment | ...
  voiceMode: 'divine' | 'event' | 'chronicler' | 'unknown';
  score: number;                         // 0–100
  band: ProseBand;
  flags: ProseQualityFlag[];
  marquee: boolean;                      // rarity/importance => always surface
}

export function scoreProseEntry(entry: EvalInput, cfg?: Partial<ProseQualityConfig>): ProseQualityResult;
export function scoreProseBatch(entries: EvalInput[], cfg?: Partial<ProseQualityConfig>): ProseQualityBatchResult;
```

**Scoring model (transparent, additive — NFP #2):** start at 100; each flag subtracts its weighted penalty; any `gate` flag (hard-exclusion) clamps the band to `fail` and the score to 0 irrespective of arithmetic. Banding from the resulting score via two thresholds (`PROSE_PASS_FLOOR`, `PROSE_WARN_FLOOR`). No hidden ML, no opaque embedding distance in v1 — every point lost is traceable to a named detector firing on a named field. This is a deliberate inspectability choice; a future v2 may add an LLM-judge pass behind the same interface, gated separately.

**Determinism:** pure string/regex analysis over the entry's static template text. Same input → same score, always. No PRNG, no clock, no network.

**Voice-mode resolution:** infer the mode from the content type and field (divine-voice fields, chronicler/flavor-plaque fields, event/character fields) so length rules apply to the right standard. When indeterminate, mark `unknown` and skip mode-specific length checks (fail-soft, never throw).

**Detector reuse:** extract `FLOWERY_PHRASES`, `PROBABILITY_PHRASES`, `FORECAST_DIGIT_PATTERN`, and the banding constants out of `scripts/lint-encounter-content.ts` into `src/engine/content-eval/detectors.ts`; have both the existing linter and the new harness import from there (additive refactor, NFP #6 — keep the old linter's public behavior identical).

---

## 4. Content pillar — the rubric

The rubric is a **data table**, not code, so the director can tune it without an engineer. `src/data/content-eval/proseQualityRubric.ts`:

- **Hard-exclusion patterns** — transcribed verbatim from content-strategy § Hard Exclusions into a reviewed pattern list. This file carries a header comment pointing back to the source section and a "last reconciled" date, so drift between the doc and the patterns is auditable.
- **Tell-don't-show markers** — the banned-construction list ("the tragedy of it was", emotion-naming verbs) drawn from the content-strategy "Show, never explain" rule.
- **Length limits per voice mode** — Divine ≤ 2 sentences, Chronicler ≤ 3 sentences, event/character unbounded (rhythm-checked only).
- **Enrichment-expectation table** — per content type, which fields are "dynamic" (must carry placeholders) vs. "static-ok" (e.g. a fixed proper-noun title).

**Calibration corpus (the deliverable that makes this trustworthy):** a fixtures set under `src/data/__fixtures__/prose-quality-eval/` of `good/` and `bad/` exemplars — seed `good/` from the THR-472-cited Meeting-encounter prose-eval paths (those are director-vetted) and `bad/` from the wiring-guide anti-pattern examples and `lint-encounter-content`'s existing bad fixtures. The test suite asserts every `good/` entry bands `pass` and every `bad/` entry bands `warn`-or-worse with the expected flag category. This corpus *is* the operational definition of "good" and is the artifact the director reviews to calibrate thresholds.

---

## 5. UI pillar

Per the ticket, the player-facing UI surface is **deferred / N/A for v1** — this is an authoring-time tool, not a runtime game surface. The "UI" for v1 is the **author/CI-facing report**, which still has real interface requirements:

- **CLI batch report:** `npm run eval:prose` — prints a ranked table (worst-first), a summary banding histogram, and the bottom-tail entries with their flags. Mirrors the ergonomics of the existing `npm run` lint scripts.
- **Machine-readable output:** `--json` flag emits `ProseQualityBatchResult` for CI consumption and for the future batch-review surface.
- **Marquee surfacing:** entries flagged `marquee: true` (high rarity/importance) always appear in the report tail even if they band `pass`, so the director's sample always includes the entries that matter most.

**Deferred (logged, not orphaned):** an in-app DebugPanel "Content Eval" tab that runs the scorer over loaded content and shows the histogram. Tracked as a follow-up — see § Deferrals. No runtime HexMapV2 / chronicle / toast surface in scope; this tool never speaks to the player.

---

## 6. Wiring

| Surface | Wiring |
|---------|--------|
| Engine entry | `scoreProseEntry` / `scoreProseBatch` in `src/engine/content-eval/` |
| Shared detectors | `src/engine/content-eval/detectors.ts` — imported by both new harness and existing `lint-encounter-content.ts` |
| Rubric data | `src/data/content-eval/proseQualityRubric.ts` (director-tunable) |
| CLI | `scripts/eval-prose-quality.ts` + `eval:prose` script in `package.json` |
| CI | optional advisory step (non-blocking in v1, mirrors the structural-review Action's advisory posture) |
| Tests | `src/engine/content-eval/__tests__/proseQualityScore.test.ts` + fixtures corpus |
| Census tie-in | batch result keys by `entryId`/`contentType` so it can join THR-473's Content Census output (coverage × quality view later) |

This module is **not** wired into the tick loop, GameState, or any runtime UI — it is an offline authoring instrument. That boundary is intentional and is the reason the UI pillar is N/A for runtime.

---

## 7. Constants table (NFP #1)

| Constant | Default | Purpose |
|----------|---------|---------|
| `PROSE_PASS_FLOOR` | 85 | Score at/above which an entry bands `pass` |
| `PROSE_WARN_FLOOR` | 60 | Score at/above which an entry bands `warn` (below ⇒ `fail`) |
| `FLOWERY_PHRASE_PENALTY` | 8 | Per-hit penalty for purple-prose phrases |
| `TELL_DONT_SHOW_PENALTY` | 12 | Per-hit penalty for emotion-naming / "the X of it was" |
| `NUMBER_IN_PROSE_PENALTY` | 10 | Per-hit penalty for digits/probability words in prose |
| `LENGTH_BREACH_PENALTY` | 10 | Penalty for exceeding voice-mode sentence cap |
| `STATIC_STRING_PENALTY` | 25 | Penalty for a dynamic field with zero placeholders |
| `MISSING_ENRICHMENT_PENALTY` | 6 | Soft penalty for `{name}` present but no conditional/pronoun |
| `BATCH_TAIL_FRACTION` | 0.15 | Fraction of a batch surfaced as the bottom tail for review |
| `HARD_EXCLUSION_IS_GATE` | true | Whether any hard-exclusion hit forces `fail`+score 0 |

All thresholds live in `src/data/content-eval/proseQualityRubric.ts` so tuning game feel = changing a number. **The director calibrates these against the first real batch run** — defaults are starting points, not settled values.

---

## 8. Tracing / inspectability (NFP #2)

Not a tick-loop system, so no `traceBuffer` emission. Inspectability is delivered through the **fully attributable flag list**: every point deducted names the detector, the field, and the offending substring (`evidence`). A reader of any `ProseQualityResult` can reconstruct exactly why an entry scored what it did — the scoring is a transparent additive ledger, never a black box.

---

## 9. Fail-soft table (NFP #4)

| Failure case | Fallback |
|--------------|----------|
| Entry has no recognizable prose fields | Score `null` band `unknown`, flag `no-prose-fields`; never throw |
| Voice mode indeterminate | Skip mode-specific length checks, score the rest, mark `voiceMode: 'unknown'` |
| Rubric file malformed / missing | Fall back to built-in default rubric, emit a loud warning, continue |
| Malformed/empty template string | Treat as empty, flag `empty-field`, do not crash the batch |
| Single entry throws in batch | Catch per-entry, record an `error` result for that entry, continue the batch |

The harness must **never** halt a batch because one entry is malformed — at catalog scale a single bad entry cannot be allowed to block QA of the other 999.

---

## 10. NFP compliance summary

| NFP | Verdict |
|-----|---------|
| 1 Tunability | **PASS** — all thresholds named in the rubric data file |
| 2 Inspectability | **PASS** — additive score ledger; every flag carries field + evidence |
| 3 Determinism | **PASS** — pure static-text analysis, no PRNG/clock/network |
| 4 Fail-soft | **PASS** — per-entry catch; batch never halts; all fallbacks tabled |
| 5 Narrative over mechanical | **PASS with note** — the tool *serves* narrative quality; the human director remains the final taste authority, the scorer only triages |
| 6 Additive over destructive | **PASS** — extends existing linter via shared-detector extraction; old linter behavior preserved |
| 7 Performance budget | **PASS** — offline batch tool, O(n) over entries; no runtime budget impact |

---

## 11. Done when

- [ ] `scoreProseEntry` / `scoreProseBatch` implemented in `src/engine/content-eval/` with the typed interfaces above
- [ ] Shared detectors extracted to `detectors.ts`; `lint-encounter-content.ts` imports from there with **no behavior change** (existing linter tests still green)
- [ ] Rubric data file with hard-exclusion patterns transcribed from content-strategy § Hard Exclusions + "last reconciled" header
- [ ] Calibration corpus (`good/` from the Meeting prose-eval paths, `bad/` from wiring-guide anti-patterns) under `__fixtures__/prose-quality-eval/`
- [ ] Test suite: every `good/` bands `pass`, every `bad/` bands `warn`-or-worse with expected flag category
- [ ] `npm run eval:prose` CLI with ranked table + `--json`; marquee entries always surfaced
- [ ] All four flag categories detectable end-to-end on a real content batch
- [ ] Verification evidence (test/typecheck/build output) in closing commit or Linear comment
- [ ] Follow-up Linear issue filed for the deferred DebugPanel "Content Eval" tab (labeled `Deferral`, project Content Architecture)

---

## 12. Deferrals

- **DebugPanel "Content Eval" tab** — in-app runtime view of the scorer over loaded content. File as `Deferral` under Content Architecture during implementation closeout.
- **LLM-judge v2 pass** — a model-scored quality dimension behind the same `ProseQualityResult` interface, for nuance the regex detectors miss. Out of scope for v1; the interface is designed to accept it later.
- **Census × quality join** — a combined coverage-and-quality matrix view joining this harness's output with THR-473's Content Census. Out of scope; the shared `entryId`/`contentType` keys make it a later add.
