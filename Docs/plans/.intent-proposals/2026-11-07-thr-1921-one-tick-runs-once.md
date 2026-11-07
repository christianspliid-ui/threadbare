# Action Proposal — One tick runs once (THR-1921)

## intent_quote

Ticket THR-1921 (filed 2026-10-14 by an executor session while verifying THR-1854):

> **What happens:** at `?view=game&seeded&size=medium`, ticking to ~tick 230 with `window.__DEBUG.tick(10)` logged 25 console errors: React's "Encountered two children with the same key" for `evt_141_10`. The id comes from `src/engine/orchestrator.ts:353` (`evt_${currentTickForIds}_${++eventCounter}`), so two events minted with the same tick and counter value reach one list.
>
> **Likely cause to check first:** the counter resets (or the tick-for-ids value is reused) between two minting passes on the same tick, or an event minted at tick 141 is re-appended to the feed later.
>
> **Done when:** a 300-tick browser run at `?seeded` logs no duplicate-key error, and an engine test mints events across two passes on one tick and asserts unique ids.

Orchestrator staging note (2026-11-07 ~12:29Z):

> The plan should decide whether the fix is (a) find and stop the duplicate pass / re-append, or (b) make the id derivable … and should not widen into moving every phase counter unless the evidence demands it.

Standing mandate (Christian, 2026-09-25): *"you can probably iterate and progress designs without me in many situations"*. Bugs are agreed work (D2).

## scope (what this plan does)

The plan stops a tick from running twice off a stale state. `useSimulation.doTick` gets the ref write that the
other five state-advancing callbacks already have. It also makes any future replay visible:
`SimulationRuntime.lastTickRun` plus a `tick_replayed` trace in `runTick`, detected by the same graph object at a
lower tick, with trace-and-continue. It adds an engine test (a replay is detected and ids stay deterministic), a
hook test (two bunched `doTick`s advance two ticks), and the ticket's 300-tick browser run.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change the `evt_<tick>_<n>` id format or salt ids per pass.
- Does not move module-scope phase counters onto the runtime.
- Does not fix the possible lost-update where `doTick`'s non-functional `setGameState(next)` overwrites a pending functional update (noted as a grey zone only).
- Does not refuse or block a replayed tick.
- No player-visible change, no prose, no layout.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-1921
- **Vision premises invoked:** none (no player surface)
- **UL terms touched:** none
- **Canon pages consulted:** `Docs/canon/engine.md` (load-bearing: graph mutated in place; engine caches per session), `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/README.md`
- **Prior plan docs / fixes this builds on:** THR-853 uniqueness sweep (`tickEventIdUniqueness.test.ts`); `b6b0131c` StrictMode double-move fix; THR-689 `runTicksSync` ref rule
- **Rejected approaches considered and dismissed:** per-pass salt / session-monotonic ids (hides double mutation, breaks determinism); refusing a replayed tick (freezes the clock on a false positive); tick-only detection (false positives on load); moving all counters (unmotivated)

Measured: heavy uniqueness test passes on `ec90c06e` (3 passed, 300 ticks seed 42); single `evt_${` minter in `src/`; `doTick` (`useSimulation.ts:202-206`) is the only state-advancing callback without a ref write (others at `:236, :252, :271, :344, :368`).

## load-bearing decisions touched

- *The world graph is mutated in place — never key change detection on graph identity.* The replay check uses graph identity to tell **which world** a state belongs to, not whether it changed; the tick number is the change signal. Respected.
- *Engine caches are owned per session (SimulationRuntime), never module-scope singletons.* The new record lives on the runtime. Respected.

## high-impact files touched (from Codesight)

- `src/engine/simulationRuntime.ts` — 235 importers (grep). Additive field. Blast Radius section present.
- `src/engine/orchestrator.ts` — 89 importers.

## kill criteria

- Duplicate keys persist in the browser run with no `tick_replayed` trace → the cause is not a replay; checkpoint and return to In Design.
- `tick_replayed` fires after the fix → another stale-state caller; find it via the dev warning's stack and apply the same ref write.
- The hook test cannot be made red before the fix → rely on the engine test plus the browser run and say so.
