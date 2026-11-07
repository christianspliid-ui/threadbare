# Action Proposal — 2026-11-07-thr-2026-the-paid-army-turns-at-once

## intent_quote

> "When a liege's wage first covers a vassal army (a stale `liegePaidTick` becomes fresh), `commanderFactionOf` flips from the vassal to the liege at once, but the army keeps the objective it picked under its own banner. If that objective is a town held by the liege or a fellow vassal at peace with it, the army marches on its paymaster until `reaimArmies` runs ... Any fix must honour `skipsReaim`, and must first find out why that army's objective survived the take-up on tick 168."
> — THR-2026 description (filed 2026-10-24 while building THR-2020)

> Done when: "`measure:crown-wages` on seeds 42/99/7 reads 'no march on the paymaster: 0 violations' with THR-2020's liege raise on." / "A fixture: an army newly in its liege's pay that is marching on its liege's town gets a new objective on the take-up tick. One in a siege, or with an `agenda` objective, keeps its objective."

> Orchestrator T2 scope note (2026-11-07): "Candidate shapes to weigh: re-aim on take-up through the same guard `reaimArmies` uses, or have the march step treat a target held by the current commander's side as void. Keep it to the take-up path; do not widen to the re-aim cadence."

Christian's standing delegation: bugs are agreed work and the design lane designs them (process.md rule 4; design-lane skill, 2026-09-25).

## scope (what this plan does)

Explains why the army's objective survived the take-up (the re-aim runs before the pay step in the tick, and the target came onto the liege's side two ticks after the take-up). Moves the daily re-aim's per-army body into a shared `reaimOne`. Adds a narrow end-of-tick guard that re-aims only a liege-paid army whose conquer target is held by its liege or a fellow vassal at peace with it, through `reaimOne`, so `skipsReaim` is honoured. One new inline phase after `unrest`, one new `ReaimWhy` member, one interface-contract sentence.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change the daily re-aim's cadence or behaviour for any army not on its paymaster's side (an unpaid army aimed at a town that made peace still waits for the daily re-aim).
- Does not re-aim an army in a siege, with an `agenda` objective, or in a campaign.
- Does not change wages, the command window, siege or battle start, or any player text or UI.
- Does not add a re-aim inside `payWages`.

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-2026
- **Vision premises invoked:** none changed
- **UL terms touched:** none
- **Canon pages consulted:** `Docs/canon/engine.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/README.md`, interface contract `crown-liege-pays-vassal-wages`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-15-thr-1933-war-aims.md`, `Docs/plans/2026-10-19-thr-1974-hiring-a-free-company.md`
- **Rejected approaches considered and dismissed:** re-aim in `payWages` (unsafe, misses the mid-day side change); full re-aim every tick (cost, widens cadence); void the target (army idles up to a day); re-aim on commander change (misses the mid-day side change)

## load-bearing decisions touched

- Everything is a graph node/edge — respected; reads existing edges only.
- The world graph is mutated in place — respected; writes go through `graph.updateNode` as today.
- Engine caches are owned per session — respected; the projection comes from the runtime's `ensureRealmProjection`.

## high-impact files touched (from Codesight)

- `src/engine/orchestrator.ts` — 153 importers (grep). Plan has a Blast Radius section.

## kill criteria

If the end-of-tick guard still leaves violations in `measure:crown-wages` on 42/99/7, or the daily re-aim suite changes output, the shape is wrong: revert the phase and fall back to calling the guard at the start of `phaseArmyMovement` and the end of `runCrownPhase`, and report which phase moved the target.

## note added after measuring

On origin/main 3601e1d8 all three seeds already read 0 violations (the world drifted since THR-2020's branch). The plan keeps the measure as a regression guard and puts the proof in fixtures that build the case directly.
