# Action proposal — forecast window re-plan (THR-1740)

## intent_quote

> "Mortals are meant to take on work they would win about half the time. Only 45% of their free choices do … Decisions this plan needs (in this order) 1. Do branching quests face the window like other work? … Gate: the branching-fire KPI for threaded agents (`KPI_BRANCHING_FIRE_MIN_PER_30T`), measured in the attended world … 2. Which window does the KPI judge, and what is the floor? … Pick the contract and restate `KPI_IN_WINDOW_MIN` against it (gauge decision). 3. Are the edge ramps steep enough? Decide after 1 and 2, re-measured on that baseline: steeper ramps, or accept that value and theme outrank the window near its edges."
> — THR-1740 description (design request from THR-1689)

> Done when: "A plan doc in `Docs/plans/` decides 1–3 with the measurements above as its baseline, re-measured on `main` after THR-1688 lands … The plan names the attended-world branching-fire check as a gate on decision 1 … The three `TODO(THR-1689)` skip rows in `engagementWindow.invariant.test.ts` point at this ticket (or at the slice that will un-skip them)."
> — THR-1740 Done when

> "the 50–65% success rate is what a mortal would deem acceptable as forecast in order to actually actively engage with the challenge" … "who a mortal is should count a lot" … "the overall goals for mortal behavior is variety, tension, progression and theme."
> — Christian, chat 2026-09-24 (THR-1575 ruling, quoted in `Docs/plans/2026-09-24-thr-1575-forecast-window.md`)

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations"
> — Christian, 2026-09-25 (THR-1611, the design lane's mandate)

## scope (what this plan does)

Decides the three questions with a six-arm measurement on `main` `e2f765fc` in both worlds: (1) branching quests lose the window's too-easy exemption for every mortal not threaded to the ascendant, while a threaded mortal's quests stay exactly as shipped (revised after a first-round Escalate: the all-mortal version took The First's quest fires from 9 to 0 over six attended seeds; the carve-out holds them at 11), gated on both the threaded-agent count and the all-mortal branching KPI; (2) the in-window gauge judges each mortal's own shifted window, with `KPI_IN_WINDOW_MIN` restated 0.60 → 0.50; (3) the ramps stay and an encounter's value per tick becomes odds-neutral above the window midpoint, because expected utility already counts the odds. Specifies one executor slice that wires all three, re-arms four invariant rows, and routes the fifth (masters out-attempt experts) to a Deferral ticket. Commits a probe reader and its raw output as evidence.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change the window's ramps, edges, shifts, the dice, `ODDS_*` or `SIGMOID_*`.
- Does not restore a floor or scale difficulty to the actor (THR-1575 standing rule).
- Does not touch undertaking value (measured gap noted, left).
- Does not author content; the master-content rung is routed, not solved.
- Does not raise threaded-agent branching fires (pre-existing shortfall against the per-threaded-agent target); it holds them at or above `main`.
- Writes no `src/` code (design lane); probes are build-time patches in `Docs/audits/`.

## impact_class

Reversible — every change sits behind a named flag or constant (`BRANCHING_QUEST_WINDOW_EXEMPT_SCOPE`, `ENGAGE_VALUE_ODDS_NEUTRAL`, `KPI_IN_WINDOW_MIN`); behaviour-moving for every mortal's free choice, so the slice carries kill criteria.

## evidence cited

- **Linear issue:** THR-1740 (from THR-1689; parents THR-1575/1582, THR-1627/1688)
- **Vision premises invoked:** north star ("the player hesitates"); cool-failure rule; mortal-behaviour goals (THR-1575 § Mortal behaviour goals)
- **UL terms touched:** Forecast tier (unchanged); no new terms ("own window" is plan vocabulary for the shifted edges)
- **Canon pages consulted:** `Docs/ubiquitous-language/README.md`, `Docs/canon/rulebook-quick-reference.md` (line: "A mortal takes on challenges it forecasts at ~50–65% … long odds are the god's to impose"), `Docs/canon/systems-inventory.md` (`engagement`, `kpi`, `decision`), `Docs/canon/interface-map.md` (`engagement-forecast-gates-choice`)
- **Prior plan docs this builds on:** `Docs/plans/2026-09-24-thr-1575-forecast-window.md`; audit `Docs/audits/2026-10-05-thr-1689-out-of-window-choices.md`
- **Rejected approaches considered and dismissed:** exemption off for everyone (The First's quests 9 → 0; first-round escalation); quest fit floor 0.50 (keeps the padding); steeper ramps (master success 0.719, constant outside documented range); "accept value outranks the window" (value is the odds counted twice, not theme); restoring floors (THR-1575 forbids)

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected: no graph changes, runtime structures only.
- "Engine caches are owned per session" — respected: the ledger stays on `SimulationRuntime`.
- No load-bearing decision is changed.

## high-impact files touched (from Codesight)

Importer counts by grep (`from '…/<module>'`, src + scripts): `encounterScoring` 28, `engagementKpi` 9, `engagementWindow` 4 (unchanged), `agent-behavior-constants` 68, `kpiConstants` 10, `phaseAgentDecision` (call site only). None ≥ 100; `src/types/trace.ts` is deliberately not edited. No Blast Radius section owed.

## kill criteria

- Expert or master level success outside tolerance on seed 42 or 99 with all three decisions in → stop, post gauge output; never retune ramps/odds/sigmoid or add floors.
- Branching fires < 1 per 30 ticks on any seed in either world, or threaded-agent fires over six attended seeds below `main`'s → stop, report with traces; no quest bonus.
- Own-window share < 0.50 on seed 42 or 99 → stop; Decision 2 returns to Christian.
- Christian's veto of any decision in chat reverts that decision before build (the handoff holds the ticket 24 h via `Claimable from:`).
