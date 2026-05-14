# THR-385 — `{intel:<category>.acquiredDaysAgo}` enrichment placeholder

**Date:** 2026-05-14
**Issue:** THR-385 (Encounter Format Migration · Deferral · follow-up of THR-139)
**Author:** Cowork (keep-work-flowing session)
**Status:** Ready for Dev
**Size:** XS

---

## 1. Summary

THR-139 shipped the `intel_referenced_prose` aftermath effect and the `{intel:<category>}` /
`{intel:<category>.detail}` / `{intel:<category>.reliability}` prose-enrichment vocabulary. Its
§Deferrals item 3 calls for one more placeholder so authored prose can surface *how old* a piece
of intelligence is — "a rumor from eighteen days ago still held," "what {name} learned last
winter had not aged well."

This plan adds **two** age placeholders to the existing `{intel:*}` loop in `enrichProse`:

| Placeholder | Resolves to | Unit |
|---|---|---|
| `{intel:<category>.acquiredTicksAgo}` | `max(0, ctx.tick − record.acquiredTick)` | raw ticks |
| `{intel:<category>.acquiredDaysAgo}` | `max(0, floor((ctx.tick − record.acquiredTick) / TICKS_PER_DAY))` | game days |

Both resolve to a **plain integer string** so prose authors wrap them with their own templating
(`"{intel:trade_route.acquiredDaysAgo} days ago"`, `"some {intel:cult_activity.acquiredDaysAgo}
days back"`). Missing record → silent strip, identical to the existing fail-soft pattern.

## 2. Why two placeholders (deviation from the issue's literal formula — design call)

The issue text specifies the value as `currentTick - record.acquiredTick` and names the
placeholder `acquiredDaysAgo`. Those two are in tension: the formula yields **ticks**, but the
name — and the motivating example in both this issue ("a rumor from 18 days ago") and the
THR-139 plan doc §Deferrals — clearly means **days**. The codebase already carries this exact
imprecision: `buildIntelligenceDisplay` in `src/engine/intelligence.ts:297-298` computes
`daysAgo = Math.max(0, effectiveTick - record.acquiredTick)` — a tick delta stored under a
`daysAgo` name. At `TICKS_PER_DAY = 12`, an 18-tick-old rumor is 1.5 game days old, not 18 — so
shipping the literal formula under the `acquiredDaysAgo` name would hand authors a placeholder
that produces wrong prose.

Considered resolutions:

- **A — honor the name, divide by `TICKS_PER_DAY`.** Accurate, but silently contradicts the
  issue's literal formula text; authors who want tick precision lose it.
- **B — honor the formula, rename to `acquiredTicksAgo`.** Accurate, but drops the issue's named
  deliverable and the "days ago" use case it was filed for.
- **C — ship both (chosen).** `acquiredTicksAgo` is the literal formula; `acquiredDaysAgo` is
  that delta floored into game days. Honors the issue's name *and* its intent, resolves the
  latent ambiguity instead of propagating it, and stays XS — both branches live in the same
  loop iteration, ~6 lines of engine code and 4 extra test cases over a one-placeholder version.

This is a Cowork design call within the scope of an approved THR-139 follow-up. It is flagged
here explicitly so it is visible at review: **the plan ships more than the issue's literal
formula on purpose, because the literal formula under the issue's chosen name is a latent prose
bug.** If the reviewer prefers Resolution A or B, the cut is trivial.

## 3. Codesight pre-flight / Blast Radius

`src/engine/proseEnrichment.ts` is **not** in the high-impact (≥100 importers) set
(`graph.ts`, `types/index.ts`, `gameState.ts`, `traits.ts`, `traceBuffer.ts`). No Blast Radius
section required. The change is purely **additive** — two new `result.replace(...)` branches
inside the existing `for (const category of INTEL_CATEGORIES)` loop, plus one residual-strip
that already catches them (`/\{intel:[^}]+\}/g` at the end of the block strips any unmatched
`{intel:*}` token, so malformed age tokens never leak even before the new branches run). Zero
signature changes, zero call-site changes, zero breaking surface.

## 4. Engine pillar

**File:** `src/engine/proseEnrichment.ts` — the `if (ctx.intelligence) { for (const category of
INTEL_CATEGORIES) {...} }` block (currently ~L278-303).

**Change:** inside the existing per-category loop, after the three existing `result.replace`
calls and before the `emitIntelligenceReferenced` check, add:

```ts
// Age placeholders (THR-385). record may be undefined → silent strip via residual sweep.
const ticksAgo = record ? Math.max(0, (ctx.tick ?? 0) - record.acquiredTick) : 0;
const daysAgo = Math.floor(ticksAgo / TICKS_PER_DAY);
result = result.replace(
  new RegExp(`\\{intel:${category}\\.acquiredTicksAgo\\}`, 'g'),
  record ? String(ticksAgo) : '',
);
result = result.replace(
  new RegExp(`\\{intel:${category}\\.acquiredDaysAgo\\}`, 'g'),
  record ? String(daysAgo) : '',
);
```

Notes for the implementer:

- **Trace gating.** The existing `hadPlaceholder` check (which decides whether to emit an
  `intelligence_referenced` trace) is computed from `detailRe / reliabilityRe / labelRe`. Extend
  that boolean to also test for the two new age tokens, so referencing intel age *also* counts
  as consuming the record — consistent with the THR-139 rule that a present `{intel:*}`
  placeholder for a category that has a record is a real consumption. Add `acquiredTicksAgoRe`
  and `acquiredDaysAgoRe` to the `hadPlaceholder` disjunction. **No new trace category** — this
  reuses the existing `intelligence_referenced` / `referencedBy: 'prose_enrichment'` path.
- **Empty-string vs `"0"`.** When the record is **absent**, both placeholders resolve to `''`
  (silent strip — matches `{intel:<cat>.detail}` behavior). When the record is **present** and
  was acquired this tick, they resolve to `'0'` — a real, meaningful value the author asked for.
  Do not collapse "no record" and "zero ticks old" to the same output.
- **`ctx.tick` fallback.** `ctx.tick` is already optional with a documented silent fallback to
  `0`. If `ctx.tick` is absent, `ticksAgo` clamps to `0` via the `Math.max(0, …)` — acceptable
  fail-soft (a missing tick yields "0 days ago", never a negative or `NaN`).
- **Residual strip already covers malformed tokens.** `result.replace(/\{intel:[^}]+\}/g, '')`
  at the end of the block strips `{intel:typo.acquiredDaysAgo}`, `{intel:<cat>.acquiredYearsAgo}`,
  etc. No new residual handling needed.

**Import:** `TICKS_PER_DAY` is exported from `src/data/attention-constants.ts` (already imported
by `src/engine/curator.ts` — reuse the same constant, do not introduce a local copy).

### Constants table (NFP #1)

| Constant | Value | Source | Purpose |
|---|---|---|---|
| `TICKS_PER_DAY` | `12` | `src/data/attention-constants.ts` (existing) | Divisor converting the raw tick delta into game-day units for `{intel:<cat>.acquiredDaysAgo}`. **Reused, not redefined.** |

No new constants are introduced. `0` (the `Math.max` clamp floor and the `ctx.tick` fallback) is
a structural boundary, not a tunable.

### Tracing (NFP #2)

No new trace types. The change extends the **`hadPlaceholder`** predicate that gates the
existing `intelligence_referenced` trace (`referencedBy: 'prose_enrichment'`, payload
`{ intelCategory: category }`). After this change, an encounter line that references only
`{intel:trade_route.acquiredDaysAgo}` — with no label/detail/reliability token — still emits one
`intelligence_referenced` trace for that record, exactly as a `.detail`-only line does today.
Verify with the existing trace test pattern in `proseEnrichment.test.ts` (the
"emits one intelligence_referenced trace per unique recordId per call" test).

### Fail-soft table (NFP #4)

| Failure case | Behavior |
|---|---|
| No matching record for category | Placeholder resolves to `''` (silent strip), no trace emitted — identical to `{intel:<cat>.detail}` today |
| `ctx.intelligence` absent entirely | Whole `if (ctx.intelligence)` block skipped; residual strip `/\{intel:[^}]+\}/g` removes the raw token — never leaks braces |
| `ctx.tick` absent | `ticksAgo` clamps to `0` via `Math.max(0, (ctx.tick ?? 0) - acquiredTick)` → "0 days ago", never negative/`NaN` |
| `acquiredTick` somehow > `ctx.tick` (clock skew) | `Math.max(0, …)` clamps to `0` |
| Malformed token (`{intel:<cat>.acquiredYearsAgo}`, `{intel:typo.acquiredDaysAgo}`) | Caught by the existing end-of-block residual strip — stripped, never leaked |

## 5. Content pillar

No new content files. This ships **vocabulary**, not prose. Two documentation surfaces must be
updated so content authors discover the new placeholders:

1. **`Docs/plans/wiring-checklist.md`** — the placeholder-vocabulary line (currently ~L337:
   *"`{intel:<category>}` (label), `{intel:<category>.detail}`, `{intel:<category>.reliability}`…"*).
   Append `{intel:<category>.acquiredTicksAgo}` (raw tick delta) and
   `{intel:<category>.acquiredDaysAgo}` (tick delta ÷ `TICKS_PER_DAY`, floored) to the list, with
   a one-clause note that both silent-strip on missing record.

2. **`Docs/plans/2026-04-16-systemic-wiring-guide.md`** — the `{intel:*}` resolution table
   (currently ~L273-275). Add two rows:
   - `{intel:shrine_location.acquiredTicksAgo}` → "Ticks since the record was acquired
     (`tick − acquiredTick`, clamped ≥ 0)" / "Stripped"
   - `{intel:shrine_location.acquiredDaysAgo}` → "Game days since acquired (ticks ÷
     `TICKS_PER_DAY`, floored)" / "Stripped"
   Optionally extend the "Why this changes what you write" paragraph with a one-line example:
   *"What {name} knew of {intel:trade_route} was already {intel:trade_route.acquiredDaysAgo} days
   stale."*

These doc updates are **in scope for this issue** — the systemic-wiring guide is the IKEA manual
for content authors; an undocumented placeholder is an unused placeholder (per the Definition of
Done "Update systemic wiring guide" gate).

No template-walk content pass here. Applying the placeholder across encounter templates is
THR-383's job (and authors get more value if THR-385 lands first — see §8).

## 6. UI pillar — N/A (verified, not omitted)

This change produces **no new UI surface and no changed render path**. The two placeholders
resolve inside `enrichProse`, which runs before any prose string reaches a renderer. Whatever
chronicle / right-rail / encounter-detail component consumed the enriched string before this
change consumes the identical-shape string after it — just with an integer where the author put
the token. There is no new component, no new event, no new modal, no hex-map signifier, no
`__DEBUG` surface.

**Browser-verify exemption claim:** this change is enrichment-vocabulary only; it changes the
*content* of an already-rendered string, not any render behavior. Per the Definition of Done
§Browser-verify exemption, the implementer may state in the closing commit body:
`Browser-verify exempt: prose-enrichment vocabulary only, no render-path change; unit tests in proseEnrichment.test.ts cover resolution + strip + trace-gating.`
If the implementer is uncomfortable claiming the exemption, a single screenshot of any chronicle
line that happens to use the placeholder satisfies it — but no UI work is required to *produce*
such a line, and none is in scope here.

## 7. Wiring section

| Surface | Wiring |
|---|---|
| Orchestrator phase | None — `enrichProse` is a pure function called from existing prose paths; no tick-phase change |
| Engine module | `src/engine/proseEnrichment.ts` — two `result.replace` branches added inside the existing `INTEL_CATEGORIES` loop |
| GameState flow | None — reads `ctx.tick` and `ctx.intelligence` which are already populated by `gatherNarrativeContext` |
| Traces | No new trace; extends the `hadPlaceholder` gate for the existing `intelligence_referenced` trace |
| Debug visibility | None new — the existing `intelligence_referenced` DebugPanel inspector already shows `prose_enrichment` references; age-only references now appear there too |
| Prose pipeline | This **is** the prose pipeline change — `enrichProse()` vocabulary extension |
| Player controls | None |
| Docs | `wiring-checklist.md` + `2026-04-16-systemic-wiring-guide.md` updated (see §5) |

No new orchestrator phase, modal, GameState field, trace category, or player control →
`wiring-checklist.md` needs only the placeholder-vocabulary line extended, not a structural add.

## 8. Sequencing vs THR-383

THR-385 should land **before** THR-383 (the `intel_referenced_prose` template-walk content
sweep, still in Idea/backlog, not yet designed). If the sweep runs first, authors writing
age-aware lines have no placeholder and either skip the beat or hand-hardcode it. Landing
THR-385 first means the sweep can use `{intel:<cat>.acquiredDaysAgo}` from line one. This is a
**soft sequencing preference, not a hard block** — THR-383 is not yet in a dev queue, and it
could technically proceed without the placeholder. Not modeled as a Linear `blocks` edge to
avoid over-constraining; noted in the coordination block instead.

THR-385 and THR-383 are **not file-mutex** — THR-383 is explicitly engine-code-out-of-scope
(templates + encounter files only); THR-385 is engine + docs only.

## 9. Tests

Extend `src/engine/__tests__/proseEnrichment.test.ts`, the
`describe('enrichProse — intelligence placeholders')` block (~L352). The existing fixture has
records at `acquiredTick: 10` and `acquiredTick: 20` with `ctx.tick: 30`.

Required assertions:

1. `{intel:shrine_location.acquiredTicksAgo}` → `'20'` (tick 30 − acquiredTick 10).
2. `{intel:shrine_location.acquiredDaysAgo}` → `'1'` (20 ticks ÷ 12, floored).
3. `{intel:trade_route.acquiredTicksAgo}` → `'10'`; `.acquiredDaysAgo` → `'0'` (10 ticks ÷ 12,
   floored = 0) — confirms a real record acquired recently resolves to `'0'`, not `''`.
4. Silent strip when no matching record: `{intel:agent_network.acquiredDaysAgo}` → `''`.
5. Silent strip when `ctx.intelligence` undefined → `''`.
6. `ctx.tick` undefined → `acquiredTicksAgo` resolves to `'0'` (clamp), not `NaN`/negative.
7. Trace gating: a template containing **only** `{intel:shrine_location.acquiredDaysAgo}` (no
   label/detail/reliability token) still emits exactly one `intelligence_referenced` trace for
   `intel_001` — extend the existing trace-emission test or add a sibling.
8. Malformed token `{intel:shrine_location.acquiredYearsAgo}` is stripped, not leaked.

## 10. Definition of Done

- [ ] Two placeholders resolve correctly when a matching record exists (ticks + floored days)
- [ ] Silent strip on missing record / absent `ctx.intelligence` (matches existing fail-soft)
- [ ] `hadPlaceholder` trace gate extended — age-only references emit `intelligence_referenced`
- [ ] `TICKS_PER_DAY` reused from `attention-constants.ts` (no local redefinition)
- [ ] `wiring-checklist.md` + `2026-04-16-systemic-wiring-guide.md` placeholder vocab updated
- [ ] 8 unit assertions above pass; `npm test` green; `npx tsc --noEmit` clean
- [ ] `npx vite build` clean
- [ ] Closing commit body includes `Fixes THR-385` + raw verification output
- [ ] Completion comment on THR-385

## 11. NFP Compliance

| # | NFP | Verdict |
|---|---|---|
| 1 | Tunability | PASS — no new magic numbers; `TICKS_PER_DAY` is an existing named constant, reused |
| 2 | Inspectability | PASS — reuses the existing `intelligence_referenced` trace; age-only references become inspectable in the existing DebugPanel inspector |
| 3 | Determinism | PASS — pure arithmetic on `ctx.tick` and `record.acquiredTick`; no PRNG |
| 4 | Fail-soft | PASS — clamp at 0, silent strip on missing record, residual strip on malformed token (see §4 table) |
| 5 | Narrative over mechanical | PASS — the entire point is giving authors a narrative lever (intel age) they currently lack |
| 6 | Additive over destructive | PASS — two `result.replace` branches added to an existing loop; zero signature/call-site changes |
| 7 | Performance budget | PASS — two extra regex replaces per category per `enrichProse` call, inside a loop that already runs the same shape of work three times; negligible |

## 12. Three-pillar check

- **Engine** — §4: two placeholder branches + `hadPlaceholder` extension in `proseEnrichment.ts`.
- **Content** — §5: no new content files; placeholder-vocabulary docs updated so authors can
  discover and use it.
- **UI** — §6: N/A, verified — no render-path change; enrichment-vocabulary only.
- **Wiring** — §7: prose-pipeline vocabulary extension; no orchestrator/modal/state/control adds.
