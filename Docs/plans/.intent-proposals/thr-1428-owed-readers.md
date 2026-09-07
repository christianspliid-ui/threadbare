# Action Proposal — the owed readers (THR-1428)

## intent_quote

> we still do not have anything ready for dev. lets continue working the map to get something through the pipe

> we need to ensure that we spread out undertakings to interface with all the different systems, and not overcrowd certain parts of the game where we already have a lot of complexity.

> i think a living world has interaction between a variety of agents and systems, the dynamism of a living organic world is hyperconnectivity, so i think we are on the right track here. wouldn't you say?

(All three from Christian in chat, 2026-09-07, during the wayfinder session on THR-1396. The first is the ask for a Ready-for-Dev deliverable; the second and third are the rulings that chose *which* deliverable.)

## scope (what this plan does)

Wires the readers that nine live undertaking cells were decided to have (THR-1397) and never got: observe cells write familiarity, clues, a chart and (on a strong result) a mark instead of a dead record; a mortal-ruined settlement joins the delve layer after a decay window; seized routes, held Places and controlled Locations pay their holder a daily trickle through the existing wealth constants; a cast spell's soul-price erodes quintessence through the existing pending-events path and exhaustion is honoured; the army-supply read of a mortal claimant is fixed. It puts wealth on the agent and faction sheets as a word (the standing rider that binds any wealth movement), gives the completion moment a sentence naming what was learned, and writes one rule into canon: a cell ships with its reader. No new cell, kind, verb, node type or edge type.

## scope (what this plan does NOT do — explicit non-goals)

- Does not build any *wanted* cell (use × Location yield, the dormant kinds, people-things) — those are the later bands in the order the map set on 2026-09-07.
- Does not flip `UNDERTAKING_MODEL`; that is THR-1403, gated on the census.
- Does not implement the division rule or the callings × cells generated view (THR-1403 carries the view per THR-1399's resolution).
- Does not feed the god's detection pressure from mortal surveillance (decided no, THR-1397).
- Does not pay faction treasuries; does not touch faction income phases.
- Does not change the delve pipeline beyond which Locations qualify for admission.
- Does not redesign wealth: two sheet lines rendering an existing tier word, nothing more.

## impact_class

Reversible. Every reader is additive or behind a named constant; the one *moved* write (the `doom_increase` spell cost from `doom` to a quintessence event) is a decision recorded on the map (THR-1397: "move it there") and is a one-line revert.

## evidence cited

- **Linear issue:** THR-1428, off map THR-1396; decisions cited inline: THR-1397, THR-1398, THR-1399, THR-1400.
- **Vision premises invoked:** the living world / hyperconnectivity (Christian, 2026-09-07); mortal sovereignty (non-negotiable); balance is not symmetry (2026-09-03).
- **UL terms touched:** undertaking, work, freehold, calling, moment, clue, familiarity, holding, quintessence. No new term proposed.
- **Canon pages consulted:** `Docs/canon/undertakings.md`, `Docs/canon/undertaking-grid.generated.md`, `Docs/canon/world-objects.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.generated.md`, `Docs/canon/design-governance.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/prose.md`, `Docs/design-system/laws.md`.
- **Prior plan docs this builds on:** `Docs/plans/2026-09-03-thr-1392-verb-object-undertakings.md`, `Docs/plans/2026-09-03-thr-1394-world-object-model.md`, `Docs/audits/2026-09-03-undertaking-systems-coverage-research.md`.
- **Rejected approaches considered and dismissed:** a dedicated `strategicIntelligence` consumer (second familiarity system by accretion); always-located clues (a free door to the delve); paying factions from the holding pass (double-count); writing quintessence directly from `payCosts` (bypasses the threshold machinery). Detail in the brainstorm companion.

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected; every product is an existing edge or property.
- **No inventing node types without verification** — no new type; the chart is the existing artifact shape.
- **Relationships are edges, not property fields** — familiarity, clues, marks and holdings are all edges; `ruinMagnitude` is an internal property of the location node (a score, not a relationship).
- **The world graph is mutated in place** — the delve filter reads `ruinedTick` off the node each scan; no memo on graph identity.
- **Reaches and Spheres are orthogonal** — untouched.

## high-impact files touched (from Codesight)

`src/types/trace.ts` (additive union members only) and `src/engine/orchestrator.ts` (one inline phase registration). Blast Radius section present in the plan doc.

## kill criteria

- If the census (THR-1402) shows no `narrowed` clue ever maturing to a delve and no holding income crossing a wealth tier within 150 ticks on two seeds, the constants are decorative and the band tables are re-tuned — not the design.
- If `ctx.outcome` cannot be plumbed from the lifecycle without a second resolution, the by-band readers collapse to the plain-success row and the plan still ships; the gap is recorded on the map's Not-yet-specified.
- If the fourth gate (built cells reach ≥ 3 systems) still fails for the Seeker after this ships, the readers were pointed at the wrong systems and the map reopens the coverage question — that is the measurable failure of the whole premise.

## explicit user sign-off

Not required (Reversible). For the record, Christian's band-order ruling: *"we need to ensure that we spread out undertakings to interface with all the different systems…"* (2026-09-07) and his affirmation *"i think we are on the right track here"* (2026-09-07) are on THR-1399's resolution comment verbatim.

## author notes for the judge

- The plan is deliberately a *readers* plan: it resists the pull to build the wanted cells that sit one step further. The whole argument for ordering it first is that it opens three systems with zero new cells; adding even one cell would undercut that.
- The wealth-on-the-sheet UI item is not scope creep: the THR-1397 rider makes it a precondition of any wealth movement, and R3 moves wealth. It is the minimum that satisfies the rider.
- The `doom_increase` move is the one place NFP #6 (additive) yields to a recorded decision and to NFP #5 (the spirit/body split reads right). It is called out in the NFP table rather than hidden.
- Uncertain: whether `knows_of` accepts a Place target under the edge schema. The plan tells the executor to check the schema row and skip on violation; it does not assume.
- The plan cites map tickets inline where each decision is used, per the wayfinder rule that plan docs link their primary sources.
