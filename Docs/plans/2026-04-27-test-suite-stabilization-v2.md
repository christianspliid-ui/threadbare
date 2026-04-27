# Test Suite Stabilization Sprint v2

**Date:** 2026-04-27
**Type:** Infrastructure / engineering hygiene — multi-issue sprint
**Status:** Implementation Planning
**Applies to:** `npm test` reliability on `main`; gates re-enabling GitHub branch protection on the `Test · Typecheck · Build` required check.
**Three pillars:** Engine (most failures live here — `trait.reputation.power.renown`, count drift, trace overflow), Content (residual count assertions on vocabulary tables, encounter content drift), UI (limited; jsdom harness gaps for `Image` etc.). All three pillars touched by *some* failure.

---

## Framing — why a v2

TB-120 (THR-160) and TB-121 (THR-161) shipped 2026-04-18 and were closed. The follow-on count-assertion sweep (THR-237 + THR-245 v2 + THR-165) closed 2026-04-23/24. The retro narrative since then has read "test repair complete." It isn't.

Branch protection on `main` was rolled back on 2026-04-27 because `npm test` is still unstable. The user's verdict — quoted in the conversation that produced this plan — is "the test suite is unstable." Treat that as ground truth, not the closed status of TB-120.

This sprint exists because the closure of TB-120 was process-honest (the helper landed, the named cluster of count assertions was converted) but outcome-incomplete (the suite is still red). It also exists because operating against a red baseline normalises "scoped verification" — touched-slice-only checks — which lets real regressions hide inside the pre-existing noise. Every retrospective from 2026-04-11 onward has flagged this as the #1 systemic risk. The two upcoming heavy features (turn-based perspective, encounter experience) cannot ship safely on top of an unreliable regression net; an engine bug introduced in the tick-loop refactor will look identical to the existing baseline noise.

The v1 sprint failed to deliver stability because it patched a named symptom cluster (count drift) without an empirical pass. v2 inverts that order: survey first, bucket every failure, fix to root cause, only then re-enable protection.

---

## What we know going in

From `Docs/impediments.md` and previous retros, suspected current red areas (to be confirmed by the survey, not assumed):

- `unifiedActionPhases.test.ts` tick-event count drift (impediment #54, deferred via THR-255 — closed but the drift may regress)
- `traceBuffer-integration.test.ts > trace IDs are sequential after clearing` overflow when `phaseFactionActions` runs hot (impediment #57, ~500 trace cap exceeded over 10 ticks of `phaseFactionActions`)
- `trait.reputation.power.renown` undefined runtime crashes in orchestrator-backed tests (recurring across impediments #22, #30, #32, #34, #38, #39 — never root-caused)
- `movement-content.test.ts` expecting river-tax `Infinity`
- `revelationGate.test.ts`
- `npcSeeding.test.ts`
- `rewardPipeline.contract.test.ts`
- `sublocation-integration.test.ts`
- portrait/audio/AgentSpriteMesh assertions (likely jsdom harness gaps)
- residual count assertions on vocabulary tables that THR-245 v2 sweep didn't touch

Everything above is suspected, not confirmed. The survey is the ground-truth source.

---

## Approach — survey-first, root-cause-only

### Phase 1 — Survey & triage (the ground-truth pass)

Run `npm test` from a clean checkout of `main`. Capture full output. For each failing test, record:

- File path + test name
- Failure mode (assertion message, stack trace, timeout, runtime exception)
- Bucket (one of four — see below)
- Suggested fix shape
- Suggested model tier (haiku / sonnet / opus)
- Suggested executor lane (CC / Codex / either)

Output goes to `Docs/audits/2026-04-27-test-suite-triage.md`. Each failing test gets a row.

The four buckets:

1. **Brittle assertion** — test asserts a count, a string match against generated content, or anything else that drifts when content is added/removed. Fix is mechanical: convert via the existing `contentInvariants` helper from THR-237, or replace with a structural assertion. **Codex-suitable, haiku.**
2. **Real bug** — engine code path produces wrong state. The orchestrator `trait.reputation.power.renown` crashes are the canonical example: something is reading a nested property the engine doesn't always populate. Fix requires understanding the code path. **CC, sonnet (opus only if it spans 3+ subsystems).**
3. **Flaky / timing / non-deterministic** — passes some runs, fails others; or has a hidden capacity cap that triggers under load. The `traceBuffer-integration` overflow is the canonical example. Fix is usually a capacity bump, a stable-ordering pass, or seeded-randomness wiring. **CC, sonnet.**
4. **Test environment / harness** — jsdom doesn't provide a global the test depends on (`Image`, etc.), or a setup helper is missing. Fix is harness-side, never test-data side. **CC, sonnet.**

The triage report must classify *every* failure. Anything that doesn't fit a bucket is filed as a separate "needs design" issue and the rest of the sprint proceeds without it.

### Phase 2 — Per-bucket fixes

The survey spawns one Linear child issue per fix cluster. Buckets 1 + 4 may bundle multiple tests per issue when they share a fix shape. Bucket 2 (real bugs) gets one issue per root cause. Bucket 3 gets one issue per flake.

No `it.skip`. No `// TODO` deferrals. Every failing test either gets fixed or its underlying assertion is deleted as obsolete. If a fix is genuinely out of scope (e.g. requires a new system), the issue is filed and the test itself is deleted, not skipped — a skipped test is invisible drift.

### Phase 3 — Stability watch and re-enable protection

After the per-bucket issues land, the sprint enters a 3-day watch period. The exit criterion is **3 consecutive working days of all merges to `main` shipping with green CI.** No flake, no scoped-only verification, no "ignore that one test." After the watch, branch protection is re-enabled on the `Test · Typecheck · Build` required check, per `Docs/plans/2026-04-19-cc-review-replacement.md`.

If the watch fails — any merge breaks the suite — the sprint loops: file an issue for the new failure, fix to root cause, restart the 3-day clock.

---

## Three-pillar coverage

### Engine pillar

Most expected failures are engine-side: orchestrator phases reading or writing state that's not always shaped the way the test expects, or trace emission running into capacity caps. Fix shape will usually be either:

- **Make the engine populate the property the test reads** (defensive default in the relevant phase, e.g. ensure `trait.reputation.power.renown` is initialized whenever a trait node is created, not only on first promotion). This is fail-soft (NFP #4) and additive (NFP #6).
- **Raise a constant** (e.g. `TRACE_BUFFER_SIZE` from 500 to a value that covers `phaseFactionActions`'s burst — the constant is already named per NFP #1, so this is a one-line change).

### Content pillar

THR-237 + THR-245 closed most count assertions. The survey will reveal whether residual count drift exists in vocabulary tables or generated-content sample tests. Fix is `contentInvariants`-helper conversion — mechanical, Codex-friendly.

### UI pillar

Likely small. Portrait / audio / AgentSpriteMesh tests historically flake on jsdom missing globals. Fix is harness-side: extend the test setup to stub the missing globals (precedent: `vi.stubGlobal('Image', ...)` from impediment #7).

### Wiring section

This sprint produces no new orchestrator phases, modals, GameState fields, or trace categories. It only ensures existing wiring is correctly tested. No update to `Docs/plans/wiring-checklist.md` is required. If a real-bug fix in Bucket 2 turns out to require new wiring, the relevant child issue updates the checklist.

---

## Constants table

| Constant | Default | Purpose | Likely change |
|---|---|---|---|
| `TRACE_BUFFER_SIZE` | 500 | Circular buffer cap for emitted traces per session | Raise to 2000 if `phaseFactionActions`-driven burst confirmed in survey |
| `vitest test timeout` | (default 5000ms) | Per-test timeout | Possibly raise for orchestrator-backed integration tests |

No new constants introduced.

---

## Tracing

No new trace types. Existing trace categories must remain emittable; if the survey reveals `TRACE_CATEGORIES` enum gaps from any phase added since TB-120, the gap is part of that phase's fix.

---

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Test depends on a graph property that's sometimes absent | Engine populates a default; test asserts against the default |
| Test depends on a count that drifts with content | Convert to `contentInvariants` structural assertion |
| jsdom missing global | Stub via `vi.stubGlobal()` in test setup |
| Test is genuinely obsolete (asserted behavior was rejected) | Delete the test; never skip |

---

## NFP compliance

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | PASS | All proposed knob adjustments use existing named constants |
| 2. Inspectability | PASS with note | Survey output itself is an inspectability artifact; no new traces |
| 3. Determinism | PASS | Flaky tests fixed by addressing the non-determinism source, never by retries |
| 4. Fail-soft | PASS | Engine fixes default missing properties rather than throwing |
| 5. Narrative over mechanical | N/A | Infrastructure work, no narrative stakes |
| 6. Additive over destructive | PASS | Tests deleted only when behaviour is genuinely obsolete; engine fixes additive |
| 7. Performance budget | PASS | `TRACE_BUFFER_SIZE` raise is bounded, not unbounded |

---

## Linear sprint structure

- **Parent (Implementation Planning):** "Test Suite Stabilization Sprint v2" — this plan doc.
- **Child 1 (Ready for Dev now):** "Survey current `npm test` failures on `main` and produce stabilization triage report." Output: `Docs/audits/2026-04-27-test-suite-triage.md`. Sonnet, judgment work, ~1–2h.
- **Child 2 (Idea / Backlog, blocked by sprint complete):** "Re-enable branch protection on `main` after 3-day green watch."
- **Children 3..N (filed by Survey):** One per fix cluster. Bucketing produces lane assignment (CC vs Codex) and model suggestion in the survey itself.

---

## Exit criteria

1. `Docs/audits/2026-04-27-test-suite-triage.md` exists and classifies every failing test from a fresh `npm test` run on clean `main`.
2. Every test in Buckets 1, 2, 3, 4 either fixed (passing in CI) or its underlying assertion deleted as obsolete (with rationale in the close-out comment).
3. Three consecutive working days of merges to `main` ship with green CI.
4. Branch protection re-enabled on `main` requiring `Test · Typecheck · Build` check.
5. Impediments #22, #30, #31, #32, #34, #38, #39, #54, #57 marked Resolved in the next dashboard regen.
6. `feedback_test_suite_unstable` memory entry updated to reflect new green-stable status.

---

## Risks

- **Survey reveals the failure list is small and mostly bucket-1 mechanical.** Best case: 1–2 days of work, mostly Codex. Sprint closes fast.
- **Survey reveals a Bucket-2 root cause that spans multiple subsystems** (e.g. `trait.reputation.power.renown` turns out to live in 4 places across orchestrator, lifecycle, and content scoring). Mid case: 3–5 days of focused engine work, opus-tier on the worst offenders.
- **Watch period keeps failing because new merges introduce new flakes.** Worst case: the underlying issue isn't the existing red tests, it's that engineering culture treats scoped-only verification as acceptable. Mitigation: branch protection re-enable is non-negotiable once the suite is empirically green for 3 days. The cultural problem self-corrects once CI is a hard gate.
- **The two upcoming heavy features stay paused for the duration.** Acceptable cost. A turn-based engine refactor on top of a red baseline would cost more in regression pain than the sprint costs in calendar time.

---

## Out of scope

- Adding new tests (this is *stabilization*, not coverage expansion)
- Restructuring vitest config beyond timeout adjustments
- Performance regressions visible in tests but not asserted on (file separately under Repo Health)
- The browser-stalls-at-tick-72 issue (impediment #42) — already filed under Repo Health, separate scaling concern
