# Action proposal — 2026-10-28-thr-2081-god-caused-mandate

## intent_quote

Christian (chat, 2026-09-25, the design lane's mandate, THR-1611):
> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

Ticket THR-2081 (filed by the design lane as a split of THR-2080, a bug Christian's warm playtests and UX review hit), Done-when:
> "a decision recorded on this ticket, and if it changes behaviour, a plan doc in `Docs/plans/`, with a census showing an unattended world on the `?seeded` route and on three CLI seeds stays below `MANDATE_PROGRESS` 0.5 at doom 0.75."

Decision recorded on THR-2081 (design lane, 2026-10-27T20:29Z, by delegation, 12 h veto window closed 2026-10-28T08:29Z with no veto):
> "Only growth the god causes counts toward the Mandate. … **Rivals and doom wearing the god's spheres down still subtracts**, so a contested Mandate can slip back."
> "The plan doc's active-god census finding the 18% / 10% targets unreachable by a playing god. Then the targets are refit on that run (calibrate on live draws, not recipe averages) and this decision stands."

## scope (what this plan does)

Builds the decision: sphere pushes carry who caused them (`causedBy`); sphere-pressure resolution hands the Mandate a weighted credit per score point the god's writers moved, and a debit when rivals/doom erode points the god put there; the Mandate's progress reads that ledger; the targets become 80 / 20 points of the god's own making, fitted on an active-god census; the Mandate's generated words and one line of its detail panel stop describing world totals. Kill switch returns today's rule.

## scope (what this plan does NOT do — explicit non-goals)

- Does not add energy cards (filed as THR-2086); Kindle, Wander and Illuminate's energy half stays Dominion-only until that lands.
- Does not reprice any card (spirit's cheapest place card costing 4 is noted, not changed).
- Does not change doom, the checkpoints' doom thresholds, counter-omens, or the age-ending ceremony.
- Does not change the legacy graph-condition Mandate evaluator.
- Does not decide whether the world drifting toward the god's spheres is "the Hunger at work" (option d) — the decision rejected it; a veto would reopen it.
- Does not build anything: `src/` changes are the executor's.

## impact_class

Reversible — a flag (`MANDATE_GOD_LEDGER_ENABLED`) restores today's rule; all new fields are optional.

## evidence cited

- **Linear issue:** THR-2081 (and THR-2080, THR-1381, THR-2086)
- **Vision premises invoked:** Game Design Laws 13, 30, 32, 42 (`Docs/game-design/laws.md`); rulebook §8 "The Clocks" ("Pushing the Mandate harder consumes essence…"; §11 "*you* shaped what survives")
- **UL terms touched:** Mandate, Hunger, Dominion, threaded — none new
- **Canon pages consulted:** `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/interface-map.md`, `Docs/canon/systems-inventory.md`, `Docs/ubiquitous-language/README.md`
- **Prior plan docs this builds on:** THR-2080's baseline settle (shipped in `phaseMandate.ts`), THR-1381 `2026-10-17-thr-1381-the-end-of-the-age.md`, THR-1768 `2026-10-06-thr-1768-sphere-score-seeding.md` (trace `sources`)
- **Rejected approaches considered and dismissed:** source-only attribution; action lookup by `sourceId`; full wear; a zero-floored ledger; keeping relative targets (each with its measured reason in the plan)

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected: no new node or edge; reads the existing `thread` edge.
- "The world graph is mutated in place — never key change detection on graph identity" — untouched (no change detection).
- "Engine caches are owned per session" — untouched (the ledger lives on `mandateState`, not a module singleton).

## high-impact files touched (from Codesight)

- `src/types/gameState.ts` (865 importers) — one optional field
- `src/engine/orchestrator.ts` (162) — one `causedBy` field, one cleared field
Blast Radius section present.

## kill criteria

A cold or warm playtest round shows a playing god finishing the Mandate before doom 0.3, or never past Stage I by doom 0.75 → refit the two point constants on that round's run (the decision stands). If attribution is wrong — the census's unattended arm ever credits more than 5 points — the `causedBy` audit is wrong and the flag goes off until fixed.
