> **title:** One tick runs once — the clock's tick records the state it made, and a replayed tick is traced — THR-1921
> **linear_issue:** THR-1921
> **author:** Claude Code (tb-design-lane, run 2026-11-07e)
> **created:** 2026-11-07
> **three_pillars:** Engine done (one runtime field + one replay trace in `runTick`) · Content N/A — no player text · UI done (one hook line in `useSimulation.doTick`; nothing a player sees changes)

# One tick runs once — THR-1921

*Two events named `evt_141_10` can only exist if tick 141 ran twice. Stop the second run, and make any future one name itself.*

## Why this is load-bearing

A browser run at `?view=game&seeded&size=medium` ticked with `window.__DEBUG.tick(10)` logged 25 React
"two children with the same key" errors for `evt_141_10`. Duplicate ids are the symptom. A tick that runs twice
from the same state also mutates the in-place graph twice (agents step twice, timelines append twice). The
fix in `b6b0131c` (*"prevent double movement from React StrictMode double-invocation"*) already fixed this once.
That is a determinism and inspectability defect (NFP #2, #3). It is a bug, so it is agreed (D2). The
orchestrator staged it 2026-11-07 ~12:29Z.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Tick event ids — `orchestrator.ts:369-372` (`evt_${currentTickForIds}_${++eventCounter}`), reset per tick by `resetEventCounters()` (`:402`) | 🟢 ACTIVE | **unchanged** — the format is right; it encodes the tick and replays deterministically |
| `runTick` (`orchestrator.ts:3196`) | 🟢 ACTIVE | **extends** — records the tick it ran on the runtime; traces a replay |
| `SimulationRuntime` (`simulationRuntime.ts:65`) | 🟢 ACTIVE | **extends** — one new field (required, initialised `null`) |
| `useSimulation.doTick` (`hooks/useSimulation.ts:199-208`) | 🟢 ACTIVE | **fixed** — writes the ref before committing |
| Id-uniqueness sweep — `engine/__tests__/tickEventIdUniqueness.test.ts` (THR-853, heavy lane) | 🟢 ACTIVE | unchanged; still the linear-run guard |

### Measured — a straight run never collides

`npx vitest run --project heavy src/engine/__tests__/tickEventIdUniqueness.test.ts` on `origin/main`
`ec90c06e`: `3 passed`, run built at import (`import 67.69s`). Seed 42, 300 ticks, a medium world: no
`TickEvent` id repeats. `grep '\`evt_\${'` over `src/` finds one minter (`orchestrator.ts:372`). So the
collision is not a minter. It needs a second `runTick` pass for the same tick number.

### Measured — the one path that can tick from a stale state

`useSimulation.ts` keeps `gameStateRef` so ticks read the live state. Every state-advancing callback writes the ref
before it commits: `runTicksSync` (`:236`, with the comment *"Update the ref before setGameState so a
subsequent call in the same task — before React re-renders — starts from the advanced state"*),
`completeTwilightNow` (`:252`), `openTwilightNow` (`:271`), `endAgeNow` (`:344`), `beginTwilightNow` (`:368`).
**`doTick` alone does not** (`:202-206`: `const prev = gameStateRef.current; … const next = runTick(prev, …);
setGameState(next);`). The ref refreshes only on render (`:196`). So if the interval's `doTick` fires
and anything else ticks before React renders, the second pass starts from `prev` again. The anything else can be
another `doTick` from a throttled, bunched interval, or `__DEBUG.tick(n)` → `runTicksSync`, which reads the
same stale ref. That second pass re-runs the tick number, resets the counters, and mints the same ids.

## Decision

1. **`doTick` writes `gameStateRef.current = next` before `setGameState(next)`.** This is the same one-line rule the
   other five callbacks already follow.
2. **`runTick` names a replay.** The runtime records the last tick it ran and the graph it ran on. A call
   whose input `state.graph` is that same graph object, and whose `state.tick` is below the recorded tick, is a
   replay from a stale state. It emits one `tick_replayed` trace and, in dev builds, one `console.warn`. It
   then **continues** (fail-soft). It never throws and never refuses: refusing would turn a hidden double-step
   into a frozen clock. A loaded save or a new world carries a new graph, so it is never a replay.
3. **The Done-when's "two passes on one tick → unique ids" is re-read.** Two passes from the same state *must*
   mint the same ids. That is determinism (NFP #3), and making them differ would hide the double mutation. The
   engine test therefore asserts that the second pass is *detected* (one `tick_replayed` trace), and the hook test
   asserts that the second pass *does not happen*. The 300-tick browser criterion stands unchanged.

Rejected: a session-monotonic id counter or a per-pass salt. Either one makes ids unique while the graph is still
stepped twice, and it breaks save/load reproducibility. Rejected: moving every module-scope phase counter
onto the runtime. That is the right long-term home (load-bearing decision: per-session caches), but no evidence
says those counters cause this bug. Out of scope, as the staging note asked.

## Engine pillar

1. `src/engine/simulationRuntime.ts` — add to `SimulationRuntime`, initialised `null` in `createSimulationRuntime()`:
   ```ts
   /** THR-1921 — the last tick `runTick` produced on this runtime, and the graph it ran on (replay detection). */
   lastTickRun: { tick: number; graph: WorldGraph } | null;
   ```
2. `src/engine/orchestrator.ts` `runTick`, before `resetEventCounters()`, when `runtime` is given:
   ```ts
   const last = runtime.lastTickRun;
   if (last && last.graph === state.graph && state.tick + 1 <= last.tick) {
     emitTrace({ category: 'tick_replayed', tick: state.tick + 1, lastTick: last.tick,
       summary: `tick_replayed: tick ${state.tick + 1} ran again (last run ${last.tick}) — a caller ticked from a stale state` });
     if (import.meta.env?.DEV) console.warn(`[THR-1921] tick ${state.tick + 1} replayed from a stale state`);
   }
   ```
   At the end of a successful tick, inside `runTick`'s `try` just before its `return`:
   `runtime.lastTickRun = { tick: s.tick, graph: s.graph }`. No-runtime
   (legacy test) calls skip both. `import.meta.env?.DEV` is already used this way in engine code that the CLI
   runs (`aftermathWords.ts:1001`), so under Node it is `undefined` and the warning is skipped. The record keeps a
   reference to the last graph it ran on. After a load or a new world on the same runtime, the old graph stays held
   until the first tick overwrites the record. That is one world and acceptable, so no extra clearing hook is needed.
3. `src/types/trace.ts` — register `'tick_replayed'` in the category union and list (beside
   `'debug_tick_batch'`, `:605` / `:1306`) and add its entry interface `{ category: 'tick_replayed'; tick: number; lastTick: number }`.

Graph nodes / edges: none. PRNG: none. Tick phases: none change.

## Content pillar

N/A. No player text. The trace summary and the dev warning are developer strings.

## UI pillar

1. `src/components/Game/hooks/useSimulation.ts` `doTick`: insert `gameStateRef.current = next;` before
   `setGameState(next);`.

### Player-facing display / Player-facing text

None. No string a player reads is added or changed; complaint classes are not engaged. The only new strings are
the trace summary and the dev-console warning, both developer-facing.

### Event notifications / Debug inspection / Visual presence (HexMapV2)

None / the `tick_replayed` trace through the existing `__DEBUG.getTraces` / none.

Nothing a player sees changes, except that a world no longer steps twice on a bunched tick. **Browser-verify
tier:** the change is invisible, so per THR-1949 it owes no screenshot. The ticket's own Done-when still asks for
a 300-tick browser run with no duplicate-key error, so it stands. Tool: Playwright, console read. UI Laws
engaged: none. No layout, text, type or colour changes. Law 56 (state-backed) is served: the ref and the
committed state no longer diverge.

**Playtest signal:** none player-visible; the signal is the console. At `?view=game&seeded&size=medium`, a run
of 300 ticks in rounds of the running clock followed by `window.__DEBUG.tick(10)` (see Done when) logs zero
"same key" errors. `await
window.__DEBUG.getTraces()` (tracing enabled) holds zero `tick_replayed` entries.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

- Orchestrator phase: none; the check sits at the top of `runTick`, before any phase.
- GameState flow: none. The new field lives on the session runtime, not on `GameState`, so saves are untouched.
- Traces: `tick_replayed` (new). Debug visibility: through the existing trace accessor; no new bridge method.
- UI component / prose pipeline / player controls: none.

## Interface impact

| Contract | Change |
|---|---|
| `runTick` → `SimulationRuntime` (reads/writes `lastTickRun`) | **add** — a session-owned field read and written only by `runTick` |
| `useSimulation` → `runTick` (input state) | **preserve** — same call, now never from a stale state |
| Trace buffer ← `runTick` | **add** — one category |

No cross-system write outside the runtime; `Docs/canon/interface-map.md` needs a row only if
`check:interface-contracts` flags the new runtime field.

## Blast Radius

`simulationRuntime.ts` has 235 importers (`grep -rl "simulationRuntime'" src | wc -l`), and `orchestrator.ts` has 89.
The runtime change is one **added** field (required, not optional), initialised in the single factory. Any hand-built runtime
fixture in tests that types the full interface must add `lastTickRun: null`. `check:typecheck` lists them, and the
executor fixes each one by adding that field. No existing field or signature changes.

## Constants table

| Constant | Default | Purpose | Home |
|---|---|---|---|
| — | — | No tunable number. The replay test is exact (same graph object, lower tick); there is nothing to tune. | — |

## Tracing

```ts
export interface TickReplayedTrace extends TraceBase {
  category: 'tick_replayed';
  tick: number;      // the tick number being run again
  lastTick: number;  // the highest tick this runtime already ran on this graph
}
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A replay is detected | trace + dev warn; the tick still runs; no throw |
| `runtime` absent (legacy tests) | no detection, no record — today's behaviour |
| `runTick` throws mid-tick | `lastTickRun` is not advanced (it is written only at the end), so the next call is not a false replay |
| A save is loaded or a new world starts on the same runtime | a new graph object → not a replay; the record is overwritten on its first tick |

## Done when

- [ ] `doTick` writes `gameStateRef.current = next` before committing.
- [ ] `SimulationRuntime.lastTickRun` exists, starts `null`, and `runTick` sets it at the end of each tick.
- [ ] Engine test (new, `src/engine/__tests__/tickReplayDetection.test.ts`): on a small initialised world with one
      runtime, `runTick(s0)` then `runTick(s0)` again emits exactly one `tick_replayed` trace (`tick` = s0.tick+1),
      and the two passes' `tickEvents` ids are equal (determinism kept). `runTick(s0)` then `runTick(s1)` emits none.
      A freshly initialised world (a new graph) at a lower tick on the same runtime emits none.
- [ ] Hook test (new; no test renders `useSimulation` today, so the pure-helper route below is the likely one): with `useSimulation` rendered, two `doTick()` calls inside
      one `act()` leave the state at tick +2, not +1. **This test must fail before the one-line fix.** Quote the
      red run in the commit. If the hook cannot be rendered in isolation, extract the ref-advance into a tiny
      pure helper and test that instead, and say so.
- [ ] Browser: `?view=game&seeded&size=medium`, tracing on, 300 ticks with the race exercised. `__DEBUG.tick(n)`
      pauses the clock first (`useSimulation.ts:223`), so each round is: start the clock at top speed (Play), let a
      few interval ticks land, then call `window.__DEBUG.tick(10)` in the same task. Repeat until tick ≥ 300.
      Zero "Encountered two children with the same key" console errors and zero `tick_replayed` traces.
      Paste the console count and the trace query result. Optional: the same run on `main` before the fix
      shows the duplicates or the traces. Quote it if it does.
- [ ] `npm run gate` green (code track); 30-tick CLI smoke (engine files); `review-gate` before auto-merge (`src/engine/`).
- [ ] Closing commit and PR body carry the line-anchored closer for this ticket.

## Kill criteria

- The browser run still logs duplicate keys **and** no `tick_replayed` trace fires → the cause is not a replay
  (for example an old event re-appended to a list). Stop, record the colliding list and component in a checkpoint
  comment, and send the ticket back to `In Design`. Do not widen the fix by guessing.
- `tick_replayed` fires in the browser after the `doTick` fix → a second stale-state caller exists. Find it
  through the trace's tick and the call stack of the dev warning, give it the same ref write, and name it in the commit.
- The hook test cannot go red before the fix → the bunched-interval path is not reproducible in jsdom. Keep the
  engine test and the browser run as the evidence, and say so in the commit.

## Coordination block

**Suggested model:** sonnet — two one-line production changes, one runtime field, one trace type, two tests; fully specified.

**Parallel-safe with:** THR-2188 (draw/forecast and lean code — no file overlap), THR-2145 (outcome-node minter and views).

**Mutex with:** any ticket editing `useSimulation.ts`'s tick callbacks or `runTick`'s prologue; none is open today.

**Files to touch:**
- Edit: `src/engine/simulationRuntime.ts`, `src/engine/orchestrator.ts`, `src/types/trace.ts`, `src/components/Game/hooks/useSimulation.ts`
- Create: `src/engine/__tests__/tickReplayDetection.test.ts`, one hook test file

## Notes for the executor

- Grey zone: `doTick` commits with `setGameState(next)`, which is not a functional update, so a pending
  `setGameState(prev => …)` from a handler is overwritten when a tick lands first. Examples are the meeting bond's
  `recentEvents` line (`GameView.tsx:3296`) and the cast's essence spend (`useAgentInteraction.ts:615`). That is a separate
  possible lost-update bug, not this one. Do not change it here. If you see it bite, file it as a `Deferral`.
- Do not change the id format or move the phase counters onto the runtime.
- `__DEBUG.getTraces` returns `[]` while tracing is disabled; enable tracing first.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar N/A with rationale
- [x] UI pillar present (one hook line; invisible change, tier named)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — a determinism fix with no player-facing change.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-07-thr-1921-one-tick-runs-once-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | N/A | no tunable number; the replay test is exact |
| 2. Inspectability | PASS | a replay now names itself in a trace instead of surfacing as a React key warning |
| 3. Determinism | PASS | ids unchanged; a replay still mints identical ids; the cause of double mutation removed |
| 4. Fail-soft | PASS | detection never throws or refuses a tick |
| 5. Narrative over mechanics | N/A | no story surface |
| 6. Additive | PASS | one field, one trace, one inserted line |
| 7. Performance | PASS | one object comparison per tick |

## Intent-judge verdict

Pass 1 (cold): **Allow**. Reversible; 0 VIOLATIONs, 1 GAP (dimension 3: the browser run's "clock running"
could not hold, because `__DEBUG.tick` pauses the clock first). Fixed: the Done-when now runs rounds that
restart the clock and then call `tick(10)`. Advisories applied: `lastTickRun` is written inside the `try`
before the return; the hook test names the pure-helper route, since no test renders `useSimulation` today.
The Done-when reinterpretation (a replay is detected, not salted) was judged reasoned and NFP-backed, not drift.

## Forked-audit verdicts

### NFP audit

NFP AUDIT: PASS-with-notes. Tunability N/A (exact check, no number); Inspectability, Determinism PASS; Fail-soft
PASS-with-note (`import.meta.env?.DEV` under Node — answered: already used by `aftermathWords.ts:1001`);
Additive PASS-with-note (field is required, not optional — wording fixed; fixtures must add it, stated in Blast
Radius); Performance PASS-with-note (record holds the previous graph until the next tick — stated, accepted).

### Three-pillar audit

PILLAR AUDIT: PASS-with-notes. Engine present-and-substantive; Content N/A with rationale; UI present-but-thin.
It lacked an explicit Player-facing text section; fixed with headed "none" subsections. Wiring adequate; substrate
check PASS. Nothing green-field: the plan extends `SimulationRuntime`, `runTick`, `useSimulation.doTick`.

### Vision audit

VISION AUDIT: PASS. No premises touched, no contradictions; core loop preserved; inside the non-negotiables.
