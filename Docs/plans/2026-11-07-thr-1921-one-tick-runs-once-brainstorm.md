# Brainstorm companion — One tick runs once (THR-1921)

Companion to `Docs/plans/2026-11-07-thr-1921-one-tick-runs-once.md`. Design lane, run 2026-11-07e.

## Hypotheses weighed for `evt_141_10` ×25

1. **A second minter with the same prefix.** Ruled out: `grep '\`evt_\${'` over `src/` finds only
   `orchestrator.ts:372`.
2. **The per-tick counter collides inside one linear run.** Ruled out: the THR-853 sweep
   (`tickEventIdUniqueness.test.ts`, 300 ticks, seed 42) passes on `ec90c06e`.
3. **UI handlers that append to `recentEvents` with their own ids.** Ruled out as the source of `evt_141_10`:
   they mint `evt_meet_first_…`, `evt_intervention_…` and `evt_choice_resolved_…`, never `evt_<tick>_<n>`.
4. **A tick re-run from a stale state.** Chosen. `doTick` is the one state-advancing callback that does not write
   `gameStateRef` before committing. The other five do, and `runTicksSync` carries a comment explaining why.
   The repro used `__DEBUG.tick(10)`, which reads that same ref. The same family was fixed once before
   (`b6b0131c`, StrictMode double movement).

## Fix shapes weighed

- **Make ids unique per pass (salt or session-monotonic counter).** Hides the symptom and leaves the graph
  stepped twice. It also breaks replay determinism and save/load reproducibility. Rejected.
- **Refuse a replayed tick (return the input state).** Safer for the graph, but a false positive would freeze the
  clock, and a load onto the same runtime is the obvious false-positive risk. Rejected in favour of detecting
  by graph identity plus trace-and-continue.
- **Detect by tick alone.** False positives on load or new world. Rejected; graph identity distinguishes a
  stale state (same in-place graph) from a fresh one.
- **Move all module-scope phase counters to the runtime.** Right in principle (load-bearing decision on
  per-session ownership), but unmotivated by evidence here. Left for its own ticket if a cross-session collision
  is ever observed.

## Done-when reinterpretation

The ticket's "an engine test mints events across two passes on one tick and asserts unique ids" conflicts with
NFP #3: two passes from one state must replay identically. The plan keeps the intent (catch double passes) and
splits it in two. The engine test checks that a replay is detected. The hook test checks that a replay does not
happen. The 300-tick browser criterion is unchanged.

## Open risk

The fix rests on a mechanism shown in code, not on a reproduced browser run. The kill criteria cover the case
where the duplicate keys persist with no replay trace. In that case the cause is elsewhere and the ticket goes
back to design rather than growing a guessed fix.
