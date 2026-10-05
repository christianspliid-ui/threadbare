# Action proposal — 2026-10-05-thr-1702-found-leads-end-the-climb

## intent_quote

The ticket ([THR-1702](https://linear.app/threadbare/issue/THR-1702), filed by Christian's account 2026-10-03 from THR-1686's census; no attended chat on it). Verbatim from its description:

> The climb's last rung is unreachable for any lead on a wonder, and that holder's survey slot is spent on a lead that cannot go anywhere.

> ## Shape of a fix (to design)
> Three options:
> * Drop `wonder` from the visit row's `siteClasses`.
> * Give a `located` wonder lead its own payoff.
> * Stop offering the lead survey (and its `leadPull`) once the lead is `located` and the site is not delvable.

The governing direction for the lane (Christian, chat, 2026-09-25): *"I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations."* A bug is agreed work under `Docs/canon/process.md` rule 4.

## scope (what this plan does)

The plan ends the loop for any `located` lead on a site no delve can ever enter: wonders, and plain worldgen ruins. Such a lead is "spent". The lead pass stops pulling its holder to it, and a survey no longer refreshes it. The clue-decay sweep then turns it into durable knowledge: a `knows_of` edge carrying a new optional `foundTick`. That last step is what the sheet shows as "found it", and it stops a new lead restarting the climb on a place already found. The plan also removes one false promise from the visit's chip ("and can go down into it"). It adds a kill switch, a trace, two interface-contract rows and a census reader with measured baselines.

## scope (what this plan does NOT do — explicit non-goals)

- It does not drop `wonder` from the visit's `siteClasses` (option 1). Rejected with evidence: that moves the loop to `narrowed`, and it reverses S3's agreed scope.
- It gives no reward, boon or essence for finding a wonder (option 2). That is a fork in what wonders mean; left open, not reserved, because the bug does not need it.
- It does not author a wonder-voiced visit template.
- It does not change the delve rule, the visit's dice, `leadPull`, the THR-1686 forecast-window skip, or `narrowed`/`vague` leads.
- It does not change the UI components.

## impact_class

Reversible. One kill switch restores today's behaviour exactly; one additive optional edge property.

## evidence cited

- **Linear issue:** THR-1702
- **Vision premises invoked:** "the world starts alive" / seeded things stay alive (`Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md`, the living-world map THR-1589)
- **UL terms touched:** lead, clue, delve, Location, wonder. The plan adds a fourth sheet phrasing, *found it*, and the code-side word *spent* to the § Lead entry (`Docs/ubiquitous-language/Encounters.md`). It is seated by delegation in the executor's PR (plan § Glossary); no `UL-proposal` issue is filed.
- **Canon pages consulted:** `Docs/canon/world-objects.md` (Location classes), `Docs/canon/interface-map.md` (Ruins & Delves unaudited), `Docs/canon/systems-inventory.md` (Ruins, Clues & Delves; Ambitions & Undertakings)
- **Prior plan docs this builds on:** `2026-09-28-thr-1636-seeded-things-stay-alive.md` § S3 and its THR-1686 re-plan; `2026-09-28-thr-1631-world-with-a-past.md` (wonders, chase_the_wonder)
- **Rejected approaches considered and dismissed:** none of CLAUDE.md's rejected list applies. Within the ticket, options 1 and 2 were dismissed (above).
- **Measured substrate:** census `Docs/audits/2026-09-25-living-world-data/readers/lead-dead-ends.ts` on `3dc2947b`, seeds 42 · 99 · 4 · 8 × 300 ticks. On seed 99, 9 re-surveys of one found glowcap hollow and 9 `not_narrowed` refusals; the lead is still live at t300. 14–24 never-delvable sites per world; 2 of 66 visits went to one.

## load-bearing decisions touched

- *Everything is a graph node/edge*: respected. The find is a `knows_of` edge; the new datum is an edge property, not a node field.
- *Relationships between entities are graph edges*: respected (`knows_of`).
- *No inventing node types*: none invented.
- *The world graph is mutated in place*: the sweep mutates as `phaseClueDecay` already does; no change detection keyed on identity.

## high-impact files touched (from Codesight)

`src/types/trace.ts`: 114 importers (judge-measured). It is additive: one interface and two union members. The plan now carries a `## Blast Radius` section with the exhaustive-switch grep instruction. None of CLAUDE.md's named wide-blast files (graph.ts, gameState.ts, unifiedAction.ts, traceBuffer.ts) is edited.

## kill criteria

- Delves summed over the four census seeds fall by 2 or more against today's 8 → keep the switch on only if the drop traces to would-be loopers; otherwise switch off and report.
- `ruins.lead_found` fires more than once per (knower, site) in 300 ticks → the `already_found` gate leaks; fix before merge.
- If Christian later decides what finding a wonder means, a wonder payoff builds on top of `ruins.lead_found` and `knows_of.foundTick`, with no rework.
