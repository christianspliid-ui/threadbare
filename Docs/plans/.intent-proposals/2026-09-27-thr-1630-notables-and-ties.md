# Action proposal: 2026-09-27-thr-1630-notables-and-ties

## intent_quote

Christian, chat, 2026-09-25, agreeing the analysis the map was charted from (recorded in the map's Notes, [THR-1589](https://linear.app/threadbare/issue/THR-1589)):

> "I agree with your analysis. log it as a design map, and make sure you dont forget the details of this analysis"

Christian, chat, 2026-09-25, sanctioning the design lane (THR-1611):

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

The map's destination, item 1 (charted with Christian):

> "A world that starts alive. Every settlement has someone who wants something there, people are tied to one another, and the world carries a past. All of it is seeded at worldgen as named constants inside the tick budget."

The ticket's Done-when ([THR-1630](https://linear.app/threadbare/issue/THR-1630), carve-up doc 1 of 7):

> "a plan doc in `Docs/plans/` is merged via a `docs/plan-*` PR, passes intent-judge and design-audit, covers all three pillars (the notable and their ties must be visible on the settlement page and sheet — UI Laws apply), and the ticket is handed off to Ready for Dev with a coordination block."

The ticket's two open calls:

> "1. The ambition bond vocabulary (`kin`/`lineage`, `enemy`, `spouse`/`romantic`, …) has no writer; settle it with the seeding. 2. Notable → spotlight graduation bypasses the THR-1348 decider budget. The plan closes the bypass or bounds it."

## scope (what this plan does)

Designs the "someone who wants something in every settlement, and people tied to each other" half of the map's destination, from the settled decisions THR-1593, THR-1594 and THR-1592.

- **Seeding, at worldgen, in `seedLivingWorld`:**
  - each named hero gets a kin, a friend and a rival among neighbours (both directions, stamped `origin:'worldgen'`);
  - a favour inside their faction;
  - secrets at 0.33 per hero;
  - their existing starting membership re-pointed to the Realm that holds their home;
  - one existing resident per settlement promoted to notable, with a holding, an old quarrel and a secret or favour tied to a nearby decider.
- **The two open calls:** `kin` is canonical, with an alias table so every reader matches seeded ties; graduation into the deciding tier joins the THR-1348 budget.
- **Local agendas:** a small roster under its own cap, aimed at the notable's own quarrel and holding.
- **UI:** the sheet names the bond, the settlement page names its notable in one state-built sentence, and the Notables panel groups local agendas.
- **Four slices:** S1 is this ticket; S2–S4 are filed at handoff.

## scope (what this plan does NOT do — explicit non-goals)

- No new deciding mortals, no new node or edge types, no per-tick scanner.
- No master/apprentice at worldgen (deferred; the mentorship lane owns that writer).
- No kin among ordinary townsfolk (THR-1594 stage 2, 0 until re-measured), no lovers, spouses, oaths or faith fellows.
- No ambitions for notables at t0.
- No history, dead notables or chronicle chapter (that is THR-1631).
- No rumour content kind.
- No new encounter prose.
- No change to faith and politics settings (that is THR-1632).
- No re-scoring of t0 ambitions (ties reach ambitions at the first re-evaluation).

## impact_class

Reversible. Every behaviour change sits behind a named constant or flag (`WORLDGEN_RANDOM_PROTAGONIST_TIES_ENABLED`, `NOTABLES_PER_SETTLEMENT`, `NOTABLE_GRADUATION_BUDGETED`, `MAX_ACTIVE_LOCAL_AGENDAS`). The seeded world changes (more edges and tiers at t0), and S3 changes late-game decider counts. Both are measured with gates and a flag fallback.

## evidence cited

- **Linear issue:** THR-1630 (carve-up of THR-1589; draws on THR-1593, THR-1594, THR-1592; relates to THR-1620, THR-1348)
- **Vision premises invoked:** `Vision/00-north-star.md` (mortals the player knows by name from watching them choose); `Vision/02-non-negotiables.md` §§ 1, 2, 3, 4, 5, 6
- **UL terms touched:** Spotlight tier (`Agents.md`, used as defined); new term **Kin** added in S1's PR (no UL-proposal issue: the term names a `relates_to` basis that ambition templates already read, so it is a missing definition, not a contested one; flagged for the judge)
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/interface-map.md`, `Docs/canon/systems-inventory.md` (grep), `Docs/design-system/laws.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-08-thr-1437-worldgen-seeds-the-living-world.md` (the `seedLivingWorld` passes and their conventions); `Docs/audits/2026-09-25-living-world-and-content-coverage.md` Part 1
- **Rejected approaches considered and dismissed:** more deciders (map out-of-scope, tick budget); two notables per settlement (+12–13%, breaks the line); a separate graduation cap (widens the attention budget by a second door); deleting the legacy tie block (shifts the shared worldgen stream); a new kin edge type; re-scoring t0 ambitions (destructive)

## load-bearing decisions touched

- **Everything is a graph node/edge; relationships are edges:** respected. All ties, holdings, quarrels, secrets, favours and memberships are existing edge types. `notableOrigin` is a node property describing the node itself, not a relationship.
- **No inventing node types:** respected. None added.
- **Agent position three-tier model:** read only (residence resolves Place → Location via `homeLocationOf`).
- **Ascendants use the same prerequisite system:** untouched.
- **Attention follows ambition (THR-1348, UL Spotlight tier):** enforced on a second path (graduation), not changed.

## high-impact files touched (from Codesight)

None of the ≥100-importer files (`graph.ts`, `gameState.ts`, `unifiedAction.ts`, `traceBuffer.ts`) is edited. The plan's Blast Radius section states this and tells the executor to re-check at pickup.

## kill criteria

- **S1 or S2 fails the budget line on both seeds** (+10% steady-state ms/tick against a same-session baseline, or deciders at t200 +10%) → reduce `NOTABLES_PER_SETTLEMENT` for hamlets and camps first. If ties alone fail it, an unstamped seeded `relates_to` is leaking into graduation; find it.
- **S3 regresses reach** (drawable templates fired < 121, or The First's longest gap > 30 ticks) → ship with `NOTABLE_GRADUATION_BUDGETED=false`, file the numbers on this ticket, and the lane re-decides.
- **Settlements with no story at t0 stay above 0 after S2** → the pick or holding step is failing; the summary lists the settlements by id.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- **Seven lane decisions are made under delegation** (listed at the top of the plan). The one most likely to draw a veto is **closing the graduation bypass**. It enforces Christian's own THR-1348 ruling, but it changes late-game decider counts, so it has its own slice, a flag, and a measured fallback. The ticket explicitly offered "close or bound".
- **The re-measure corrected the research on seven facts** (listed in the plan). None of them reverses a decision; they change how it is built. The biggest is that half the heroes do not live in a settlement.
- **The judge should check** that the UI pillar satisfies the Done-when's "the notable and their ties must be visible on the settlement page and sheet". The sheet shows bond words in Relationships, and the settlement page shows the notable line with fog-gated secret clauses.
- **Uncertain:** whether `ambitionTick`'s re-evaluation trace already carries the bonds list. The plan tells the executor to add a count if it does not, rather than asserting it does.
