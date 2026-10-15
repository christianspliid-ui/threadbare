# Action Proposal — 2026-10-15-thr-1936-mortal-wealth

## intent_quote

> "the purpose of the economical model is to provide substrate for the world, and drive a lot of the fundamental interaction and behavior of the in game living agents (factions, cities, agents)." — Christian, chat 2026-10-14 (the Mortal economy map's destination, THR-1863)

> "so important that the economic system simulates the cities and factions and locations to have a basic 'kingdom' economy so factions have something to fight over. this is more important than to make the agent model even deeper than it already is on individual agent richness." — Christian, chat 2026-10-14 (priority ruling; recorded on THR-1865 and THR-1863)

> "Keep all three calls as decided. The plan docs can go ahead." — Christian on THR-1863, 2026-10-15 08:29Z, releasing the carve-up (THR-1931..THR-1937) in the map's order.

The re-check Christian asked for when he parked THR-1865 (comment, 2026-10-14): "it is re-checked then against the kingdom design (for example, whether a mortal's Means should come from their town's and faction's fortunes rather than their own ledger)."

The ticket (THR-1936): author one plan doc that builds THR-1865 (decided by the design lane under delegation, veto window closed 2026-10-15T10:42Z, no veto) and THR-1872 (orchestrator research: the 71-row money-encounter outcome table), scheduling money-to-faction rows after the faction purse (THR-1931).

## scope (what this plan does)

Specifies: a birth pass that gives every autonomous decider Means from their role table, shifted ±10 by their home town's prosperity word; an outcome table on encounter templates (band → ordinary aftermath effects) applied once at resolution in `fireResolvedActionTriggers` for every mortal, with a converter passthrough so simple encounters can carry it; one new aftermath effect kind `economy_shift` (S1: `means`, through `bankWealth`, losses halved below Getting by); one new aftermath change kind `economy` (crossed band → new word, else direction); the THR-1865 want as a bounded board multiplier on paying work, where paying work is derived from the outcome tables (S2); founding costs behind a switch flipped only on the decision's measured predicate (S2); the world/purse/debt rows of the table (S3). Means stays a word everywhere.

## scope (what this plan does NOT do — explicit non-goals)

- No change to the forecast, the engagement window or the odds (Law 20, THR-1575).
- No Means derived from the town or faction (answered: own ledger, with three town couplings).
- No patronage, careers or "the rich hire others" (map Out of scope).
- No god verb on a mortal's Means (Fortune's Favour / Ruin belong to THR-1935).
- No place-as-holding, lane-bound writes, `sworn_to` from tribute, debt removal or famine/glut draws (one Deferral).
- No chronicle lines, toasts or Needs-you entries for a mortal's purse.
- No ambient-mortal Means (they do not decide; map fog).
- No change to holding income, step ops, or `wealthCost`.

## impact_class

Reversible — every behaviour sits behind `MORTAL_MEANS_ENABLED`; additive type fields; founding costs ship off.

## evidence cited

- **Linear issue:** THR-1936 (decision inputs THR-1865, THR-1872; map THR-1863)
- **Vision premises invoked:** mechanics surface through prose, never numbers; the world does not wait for the god; failure is plot
- **UL terms touched:** Means (`Docs/ubiquitous-language/Agents.md` § Means) — one sentence added, stale anchor fixed; no new term
- **Canon pages consulted:** `Docs/game-design/laws.md` (20, 22, 24, 41, 42, 43, 45), `Docs/canon/rulebook.md` (:461), `Docs/ubiquitous-language/README.md`, `Docs/canon/interface-map.md` (:402), `Docs/canon/systems-inventory.md` (:45, :74)
- **Prior plan docs this builds on:** `Docs/plans/2026-10-15-thr-1931-faction-purse.md`, `Docs/plans/2026-10-15-thr-1932-crown.md`, `Docs/plans/2026-10-14-thr-1923-settlement-economy.md`, `Docs/audits/2026-10-15-thr-1870-economy-visibility-decision.md`, `Docs/audits/2026-10-14-mortal-economy-audit.md`
- **Rejected approaches considered and dismissed:** step ops for money; writes in reactions; an encounter-type list for paying work; Means derived from the town; a daily drift toward the town (brainstorm companion)

## load-bearing decisions touched

- Everything is a graph node/edge — respected: no new node or edge types.
- Relationships are edges, not properties — respected: a cast-key target is resolved through the existing cast binding.
- The world graph is mutated in place — `wealth` property writes via `bankWealth`; no change detection keyed on identity.
- Engine caches owned per session — `templatePaysActor` is keyed on the template registry's version (static content), not world state; executor to hold it beside the template registry.

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts` (≥100 importers; additive optional fields and union members), `src/engine/unifiedActionResolution.ts` (wide; one block in an existing hook). Plan has a Blast Radius section.

## kill criteria

- Paying work still under 5% of poor deciders' board wins with S2 on (600 ticks, seed 42) → reopen THR-1865: the want needs an earning cell, not a weight.
- Destitute share at t600 more than 10 points above t0 → money encounters drain the poor; damp losses first.
- Median decider Means at t600 Wealthy or above → gains outrun losses; rebalance before S3.
- Engagement-window fit moves by more than 2 points → the want leaked into the odds; a bug.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- **Revised after pass 1 (Escalate on ordering):** the first draft let S1/S2 build before the faction purse. The ticket's own text settles it ("The plan doc should still schedule its build after the faction purse"), and Christian's priority ruling backs it, so the plan now blocks S1 on the faction purse build (THR-1931); S2 follows S1; S3 also waits on the purse and THR-1920. Nothing ships before the purse. This follows the agreed instruction rather than asking a new question.
- Also fixed after pass 1: the faction half of Christian's re-check (§ Resolution 1: in v1 coin flows mortal → faction; the first faction → mortal write, quest/bounty pay, goes to the Deferral), `templatePaysActor` owned by `SimulationRuntime`, the tooltip text and the empty-name fallback quoted.
- The research said "how much of the table to build is the map's next decision", and the map closed without that call. The plan decides: the Means half of every row (S2), the world halves and purse rows (S3), a Deferral for rows needing primitives the research could not specify. I judge this a how-level call inside the ticket's title ("the money encounters finally pay or cost something"), not a fork in what the game means.
- Christian's re-check is answered as a how-level choice with a veto invited, not reserved: the decision already said "own ledger", his comment offered the town-derived reading only as an example to check, and the map's diversity ruling argues against it.
- Paying work is derived from content rather than the prototype's type list; the measurement shows the type list misclassifies (market_haggle is `acquire` and costs Means; merchant_caravan is `lead` and pays).
- The `economy` change kind is claimed here; THR-1935 (god's stake, not yet authored) was assigned "economy receipts" by the carve-up. The plan says this plan owns the shape and 1935 reuses it.
