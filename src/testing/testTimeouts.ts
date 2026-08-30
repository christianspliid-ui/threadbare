/**
 * Shared per-test timeouts for tests that drive a real simulation.
 *
 * ## Why these exist as constants (THR-1015)
 *
 * A test that calls `initializeGameState` and runs N ticks is asserting
 * **correctness** — that the pipeline produces encounters, that scoring is
 * deterministic, that no agent is double-booked. None of them assert *speed*.
 * Their per-test timeout is therefore a **hang detector**, not a performance
 * budget, and the only wrong value for it is one small enough to fire on a slow
 * runner.
 *
 * Until THR-1015 the values were scattered as magic numbers across eleven files
 * (ten hardcoding `120_000`, one outlier at `15_000`/`30_000`) and five more
 * heavy tests carried no timeout at all, silently inheriting vitest's 5000 ms
 * default. That default is what actually failed.
 *
 * ## The measurement the values are derived from
 *
 * CI runner speed is not fixed and is not ours to control. Measured spreads:
 *
 * - Run 31175512341: whole suite 353 s against ~70 s locally — a **~5×** slower
 *   runner. `agent-decision-pipeline`'s 3277 ms test × 5 ≈ 16.4 s, clearing its
 *   15 s timeout. That is the failure THR-1015 was filed for.
 * - `reference_ci_wall_time_variance` records the `Run tests` step varying
 *   **2.2×** on unchanged code.
 * - Load *within* one machine matters as much as the machine: on 2026-08-07
 *   `threaded-agent-balance` measured **1553 ms** run alone and **timed out past
 *   5000 ms** in the same session's full-suite run — a 3.2× in-suite slowdown
 *   before any CI variance is applied.
 *
 * So the qualifying predicate (THR-688 rule A) is: **a test whose local duration
 * multiplied by ~5 exceeds its timeout is at risk.** Re-derive it by comparing
 * local per-test durations against the value in force, never from a snapshot
 * list — the set changes as tests get slower.
 *
 * `WORLD_SIM_TEST_TIMEOUT_MS` is set to 120 s because that is what ten of the
 * eleven files had already converged on independently, and it gives every
 * currently-measured world-sim test a margin of 14× or better. It is deliberately
 * generous: the cost of it being too high is a hung test taking 2 minutes to
 * surface, and the cost of it being too low is a red required check on a green
 * change, which is strictly worse and has now happened three times in one day.
 *
 * ## What this is NOT for
 *
 * Do not use it to silence a genuine wall-clock assertion. `coastline-integration`
 * asserts `computes in < 500ms` as an `expect`, which is a real performance
 * contract — a slow runner failing it is a signal, not noise, and raising it
 * would hide the thing it exists to measure. That class is THR-949's.
 *
 * That rule stands; the example under it has been resolved and is kept because
 * the resolution is the point (THR-1328, 2026-08-30). The coastline case was
 * failing ~13% of the time **standalone on an idle machine** — a tight ~101 ms
 * median with a tail clearing 500 ms in ~2 of 15 samples — so it was measuring
 * GC/JIT scheduling, not the coastline. It was fixed without touching the
 * budget: it now asserts the **median of 7 runs** against the same 500 ms. The
 * general form, for the next wall-clock assertion that goes flaky: when the
 * signal is real but the sampling is not, fix the sampling. Reach for one of
 * the constants above only when the assertion is a hang detector to begin with.
 */

/**
 * Hang-detector timeout for a test that builds a world and runs ticks.
 *
 * Use on any test calling `initializeGameState` / `initializeGameStateFromIdentity`
 * and driving `runTick`, whose assertions are about correctness rather than speed.
 */
export const WORLD_SIM_TEST_TIMEOUT_MS = 120_000;

/**
 * Hang-detector timeout for a test that builds and runs TWO (or more) full
 * simulations in one case — the A/B shape used by determinism and seed-divergence
 * tests, which run a world twice and diff the outputs.
 *
 * A distinct constant because the shape breaks the measurement the 120 s value
 * above was derived from: that value gave "every currently-measured world-sim
 * test a margin of 14× or better", but a case that pays the whole world-build +
 * N-tick cost twice does not resemble those tests. Measured 2026-08-29:
 * `content-layer1-integration`'s `same seed produces deterministic results` at
 * **108 224 ms standalone** — a 1.1× margin against 120 s — and it duly timed out
 * in CI (run 33272123551) on a runner where the suite ran ~2× slower than local.
 * Its sibling `different seeds produce different narratives` measured 52 809 ms,
 * also past the qualifying predicate (local × ~5 exceeds the timeout).
 *
 * 600 s keeps the doctrine's margin (~5× runner spread on the 108 s measurement).
 * Same contract as above: a hang detector, never a performance budget.
 */
export const MULTI_WORLD_SIM_TEST_TIMEOUT_MS = 600_000;

/**
 * Hang-detector timeout for a test whose first case absorbs a heavy module import.
 *
 * A distinct constant rather than a reuse of the one above, because the shape is
 * different and mislabelling it would mislead the next reader: these tests do not
 * build a world at all. The tell is a file whose *first* case measures seconds
 * while every sibling measures 0–1 ms — the cost is a one-time dynamic `import()`
 * of the module under test, billed to whichever case ran first.
 *
 * Measured 2026-08-07: `traitPredicate.contract.test.ts`'s first case at 2096 ms
 * against 33 siblings at 0–1 ms. Its 5000 ms inherited default gives a 2.4×
 * margin, under the ~5× runner spread, so it is one slow runner away from a red
 * check on a green change — while the assertion itself is a single `toBe(1)`.
 *
 * 30 s rather than 120 s: nothing here runs a simulation, so a case that has not
 * finished importing after 30 s is hung, not slow.
 */
export const HEAVY_IMPORT_TEST_TIMEOUT_MS = 30_000;

/**
 * Hang-detector timeout for a test that shells out to a real script or binary.
 *
 * A third constant rather than a reuse, because the cost driver is different
 * again: these cases neither build a world nor import a heavy graph — they pay
 * `spawnSync` / `execFileSync` process-startup cost, several times per case, and
 * process startup is precisely what degrades when the machine is already running
 * a full vitest pool.
 *
 * Measured 2026-08-09 (THR-853): `scripts/__tests__/worktree-write-guard.test.ts`
 * runs 9 cases at 558–866 ms each **standalone** — a ~5.8× margin against the
 * 5000 ms vitest default, which reads as comfortable. In-suite it is not: adding
 * one 300-tick engine test to the pool was enough to push its heaviest case past
 * 5000 ms and turn a green change red, with the guard itself untouched. That is
 * the same shape as the `threaded-agent-balance` 3.2× in-suite slowdown recorded
 * above, and it clears the qualifying predicate (local × ~5 exceeds the timeout).
 *
 * 30 s rather than 120 s, for the same reason as the constant above: a `bash`
 * subprocess that has not returned in 30 s is hung, not slow.
 */
export const SUBPROCESS_TEST_TIMEOUT_MS = 30_000;
