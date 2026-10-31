# Action proposal — 2026-10-31-thr-2090-spirit-life-entropy-place-cards

## intent_quote

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." (Christian, chat, 2026-09-25: the design lane's mandate, THR-1611)

The ticket (THR-2090, filed 2026-10-30 as slice 2 of THR-2089's decision, staged for the design lane by the orchestrator 2026-10-30):

> **Done when:** a plan doc in `Docs/plans/` hands off three cards (or a reasoned subset) and a decision, or a reservation, on the life-vs-doom erosion.

> Whether doom should wear down the god's own ground in life is a question about what the Mandate *means*. The design session decides it from evidence (is it the stage push only, how do the other spheres compare against their opposite's doom pressure) or reserves it for Christian with the options laid out.

Standing rulings the plan answers to: THR-2089 Decision 1 (every Hunger sphere gets a tier-1 market place card at 2 essence); THR-2081 Decisions 3 (rivals and doom take back only what the god built) and 4 (one target unit for every world); Laws 32, 36, 38.

## scope (what this plan does)

Three tier-1 market cards at 2 essence on settlements, each on `update_node`. **Tend the Sick** (`loc.tend_sick`, life) raises `populationHealth`. **Let the Damp In** (`loc.let_damp_in`, entropy) lowers it. **Keep the Vigil** (`loc.keep_vigil`, spirit) lowers `unrest`. Stoke the Forges drops from 3 to 2 essence. It decides the doom question: the per-stage entropy push doom lays on every location keeps landing, but the Mandate ledger no longer counts it as opposition (a named constant prefix, a predicate in `mandateLedger.ts`, and a switch). Doom's archetype cards and rivals still take back. One rulebook sentence and one interface-map row are updated.

## scope (what this plan does NOT do — explicit non-goals)

- It does not change the doom clock, its stage push, or any world sphere score.
- It does not change the Mandate's targets.
- It does not fix the supply plateau (THR-2094).
- It adds no new op, trace type, phase or UI component.
- It does not touch hex cards (THR-2087).

## impact_class

Reversible. Three data rows, one price, three constants, one exported string constant, one predicate behind `MANDATE_DOOM_STAGE_PUSH_EXEMPT` (false restores today's ledger). Deleting them restores today.

## evidence cited

- **Linear issue:** THR-2090 (blocked by THR-2089; related THR-2081, THR-2094, THR-2087)
- **Vision premises invoked:** `Docs/game-design/laws.md` Laws 32, 36, 38, 41, 45
- **UL terms touched:** none new (Mandate, Hunger, sphere, essence, doom, market offer)
- **Canon pages consulted:** `Docs/canon/cosmology.md` (Life ↔ Entropy, Energy ↔ Spirit), `Docs/canon/rulebook.md:413` (the erosion rule), `rulebook-quick-reference.md:136`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-30-thr-2089-cheap-place-cards.md`, `Docs/plans/2026-10-28-thr-2081-god-caused-mandate.md`, `Docs/plans/2026-10-28-thr-2086-energy-cards.md`
- **Measurements:** proto branch `proto/thr-2090-doom-wears-life`, nine census arms (plan § Why)
- **Rejected approaches considered and dismissed:** keep the tide (two Hungers unreachable); drop the push (wrong layer); archetype-sphere push (per-world spread); bigger life delta (the push erases it); Spoil the Stores (negative store fail-soft hole); a presence card (nothing a player sees)

## load-bearing decisions touched

- "Everything is a graph node/edge": respected; the cards write existing node properties.
- "Reaches and Spheres are orthogonal axes": respected (heart / shadow reaches apart from spheres).

## high-impact files touched (from Codesight)

- `src/data/unified-action-templates.ts`: 283 importers, rows and one price only. The plan has a Blast Radius section.
- `src/types/sphereAffinity.ts`: one additive export.

## kill criteria

- Gather's life under a quarter of target at doom 0.75 with cards and exemption: file against the Mandate targets beside THR-2094.
- Let the Damp In as a dominant loop in playtest: lower its delta.
