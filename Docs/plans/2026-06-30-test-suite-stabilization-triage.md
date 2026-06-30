# Test-Suite Stabilization — Triage & Repair Plan (THR-489)

**Date:** 2026-06-30
**Issue:** THR-489 (Repo Health, P2, Infrastructure)
**Author:** Cowork (keep-work-flowing scheduled PM pass)
**Status:** Ready for Dev handoff

## Gate check — satisfied

THR-489 was held in Todo with the note *"Stays in Todo until WS1–WS3 merge … likely needs a plan doc first given scope — consider an In Design pass to triage before handoff."*

The single-executor consolidation batch (WS1–WS3) **has merged** to main:
- `2c670edb` — docs: single-executor consolidation — strip Codex / two-queue, fold in merge=Done (THR-486) (#394)
- `a76d6b84` — ci: merge = Done — delete dead review gate + robust Linear auto-close (THR-487)
- `58bec5fe` — docs: THR-488 branch & worktree amnesty (aggressive prune)

The gate condition is therefore met. This doc is the triage/In-Design pass the issue asked for. **This is a CC execution issue** — Cowork cannot run the suite (sandbox `node_modules` is incomplete: `vitest` / `@vitejs/plugin-react` unresolvable, the documented EPERM/stale-install limitation). The live triage classification is CC's job; this doc scopes it.

## Why this matters

`npm test` has been red on `main` for **months** (impediments #22, #30–34, #38, #39, #54, #57 — ~15+ recorded occurrences over 8+ days in the 2026-04-11 retro alone, recurring since). A red baseline trains every agent to ignore the CI gate and normalizes "verify the touched slice, log the baseline red, move on." That workaround is now load-bearing in a bad way: branch protection's required `Test · Typecheck · Build` check had to be **rolled back once already** (impediment #94) precisely because the suite is unstable/slow. Until the suite is green and fast, `merge = Done` (THR-487) and the required CI gate are not fully trustworthy.

## Known failing surface (from the impediment log — verify live at pickup)

These are the recurring named failures across impediments #32/#34/#38/#39/#54/#57. **Treat as a starting checklist, not ground truth** — the suite has moved since April; run `npx vitest run` first and reconcile against the actual current failures.

- `movement-content.test.ts`
- `revelationGate.test.ts`
- `sublocation-integration.test.ts`
- `npcSeeding.test.ts`
- `rewardPipeline.contract.test.ts`
- reward / retinue contract tests
- portrait / audio / `AgentSpriteMesh` assertions (terrain audio, portrait compositor, avatar)
- **encounter content-count drift** — brittle exact-count assertions (e.g. `expect(...).toBe(<literal count>)`)
- repeated **orchestrator crashes from missing `trait.reputation.power.renown`**
- `unifiedActionPhases.test.ts` — "walks a 3-step action … expects `allEvents.length === 3`" (#54)
- `traceBuffer-integration.test.ts` — "trace IDs are sequential after clearing" — collateral from THR-29 `phaseFactionActions` overflowing `TRACE_BUFFER_SIZE=500` (#57)

Repo currently has ~737 `*.test.ts(x)` files — full-suite runtime is the reason it times out at sandbox defaults (#31). Budget for a long local run and consider sharding.

## Triage framework — classify every failure into one of three buckets

1. **(a) Stale assertion** — test encodes an outdated expectation (most encounter content-count drift lands here). Fix = update the assertion to the current correct value, OR convert the brittle exact-count to a robust invariant (`>= N`, non-empty, shape/relationship check). **Prefer converting count assertions to range/invariant checks** — the 2026-04-11 retro explicitly called for deleting count-based assertions; re-pinning a literal just resets the same trap.
2. **(b) Real regression** — production code is actually wrong (the `trait.reputation.power.renown` orchestrator crash is the prime suspect — a missing/renamed trait path that throws in a tick phase). Fix = repair the source; the test stays as the guard. **Fail-soft check (NFP #4):** a missing trait path must never throw in the tick loop — if the crash is a genuine missing-key throw, the fix is both (i) graceful fallback at the read site and (ii) the test asserting the fallback.
3. **(c) Flaky / environment** — order-dependent, buffer-overflow-dependent (#57), or timing. Fix = make deterministic (e.g. raise `TRACE_BUFFER_SIZE`, reduce per-tick trace verbosity, or make the sequential-ID test tolerant of circular-buffer wrap). **Quarantine is allowed only with a tracking issue** — never silently `.skip`. A quarantined test gets a `// TODO(THR-XX)` and a `Deferral`-labelled Linear issue in Repo Health.

## Recommended execution order

1. **Run the full suite once, capture the real failing set.** `npx vitest run --reporter=verbose 2>&1 | tee /tmp/baseline.txt`. Reconcile against the checklist above. This is the source of truth — work from it, not from this doc's list.
2. **Kill the orchestrator crash first (bucket b).** A throw in a tick phase can cascade and mask downstream failures; fixing `trait.reputation.power.renown` may turn several reds green at once. Run a CLI smoke after (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) to confirm the tick loop is crash-free.
3. **Sweep the count-drift / stale-assertion cluster (bucket a)** — convert exact counts to invariants where the count is legitimately non-deterministic or content-volume-driven.
4. **Stabilize the known flakies (bucket c)** — #54 (`unifiedActionPhases`) and #57 (`traceBuffer-integration`) have documented root causes; apply them.
5. **Re-run to green, then run twice more** to catch order-dependence. Paste the full green run into the closing comment.

## Three-pillar coverage

- **Engine** — the bulk of the work: orchestrator crash repair (`trait.reputation.power.renown` read path + fail-soft), trace-buffer determinism, unifiedActionPhases event-count logic. These are real engine touches → **engine smoke required at closeout** (CLAUDE.md Pre-Commit #6).
- **Content** — encounter content-count assertions are content-volume coupled; the fix is test-side (robust invariants) but the *judgement* of "what count is correct now" needs content awareness. No new content authored.
- **UI** — portrait / audio / `AgentSpriteMesh` contract tests are render-adjacent but **test-infrastructure, not player-facing UI changes**. No visual surface changes → **Browser-verify exempt: test-only repair, no runtime UI change** (state this in the closing commit body). If any fix touches an actual `src/components/**` render path, that slice gets the standard 1920×1080 screenshot + console pass.

## Constants

No new tunable constants. One possible existing-constant bump in scope: `TRACE_BUFFER_SIZE` (currently 500) if the #57 fix path chosen is "raise the buffer" rather than "reduce trace verbosity" or "tolerate wrap." If bumped, name the rationale in the commit and check the buffer isn't masking a real verbosity problem.

## Fail-soft (NFP #4)

| Failure case | Required behavior |
|---|---|
| Missing trait path (`trait.reputation.power.renown`) read in a tick phase | Graceful fallback (default/neutral value), never a thrown exception. Test asserts the fallback, not a throw. |
| Circular trace buffer wraps mid-run | Trace IDs remain usable; the sequential-ID guarantee is either preserved by sizing or the test is corrected to model wrap. |

## Done when

- `npx vitest run` (full suite) is **green on `main`** — paste the full run summary into the closing comment (raw terminal output, per CLAUDE.md verification-evidence rule).
- `npx tsc --noEmit` clean, `npx vite build` succeeds.
- 30-tick CLI smoke passes (engine changes touched) — paste the `status` block.
- Every genuinely-flaky test is **fixed or quarantined with a tracking Linear issue** (`Deferral` label, Repo Health project) — never silently `.skip`.
- Closing commit body: `Fixes THR-489`. **Also put `Fixes THR-489` in the PR body** (impediment #140 — non-squash merge commits drop the feature-commit body, so the keyword must be in the PR body for auto-close to fire).

## Follow-on (out of scope for THR-489, file as Repo Health follow-ups if surfaced)

- Re-enable the required `Test · Typecheck · Build` branch-protection check with a `paths-ignore` filter for `Docs/**`, `.claude/**`, `*.md`, `.gitignore` (impediment #94 prerequisite — only after the suite is reliably green AND fast).
- Suite runtime / sharding so CI doesn't hang (impediment #31, #94).
