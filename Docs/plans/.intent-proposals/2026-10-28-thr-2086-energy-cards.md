# Action proposal — 2026-10-28-thr-2086-energy-cards

## intent_quote

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." (Christian, chat, 2026-09-25: the design lane's mandate, THR-1611)

The ticket (THR-2086, filed by the design lane 2026-10-28 as a consequence of shipped design, process.md rule 4):

> **Done when:** at least two ascendant-castable cards carry `sphereAffinity: 'energy'`, at least one of them targeting a place, priced in the band of the other spheres' cheapest place cards. The THR-2081 census (`npm run census:mandate`) on a Kindle identity then shows the scripted god's energy half reaching at least half its target by doom 0.75.

Standing rulings the plan answers to: Law 38 (Christian, 2026-10-09: cards come from the world's offers, priced in their own sphere, "this should all be metadata on the actions"); Law 36 (every card costs).

## scope (what this plan does)

It adds two ascendant cards in the energy sphere to `src/data/unified-action-templates.ts`, both tier-1 market offers built only on ops already in the catalog. **Stoke the Forges** (`loc.stoke_forges`, a town, 3 essence) raises prosperity by 6 and unrest by 5. **Kindle a Spark** (`divine.kindle_spark`, a mortal, 2 essence) applies an energy influence that deepens the mortal's own lean, using the THR-1651 `own_lean` drift rule at 0.12. The plan also files two defects it measured: hex-targeted sphere pushes are dropped (THR-2087), and Inspire's card writes no drift (THR-2088). The plan adds their constants, effect prose, technical lines, beat bucket rows and art, plus tests that the effects and the energy pressure land and that an energy god's market can offer them.

## scope (what this plan does NOT do — explicit non-goals)

- It does not fix hex-targeted sphere pressure; that is filed as THR-2087.
- It does not tag the four energy-priced flows hex cards.
- It does not re-tag Inspire, Rekindle the Thread, or any existing card.
- It adds no new engine code path, op, trace or UI component.
- It does not tune the Mandate's targets (THR-2081). The ticket's census clause becomes a report-only line, because the census does not exist on `main` yet and the decision behind it is still inside its veto window.
- It adds no energy card at tier 4, no light card, and no Wander-specific movement verb.

## impact_class

Reversible. Two data rows and three constants; deleting the rows restores today's catalog.

## evidence cited

- **Linear issue:** THR-2086 (bug filed alongside: THR-2087)
- **Vision premises invoked:** `Docs/game-design/laws.md` Laws 9, 26, 36, 38, 41, 45
- **UL terms touched:** none new (Mandate, Hunger, sphere, essence, market offer)
- **Canon pages consulted:** `Docs/canon/cosmology.md` (Energy: vitality, fire, kinetic power; opposite Spirit), `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-28-thr-2081-god-caused-mandate.md` (Decision 5 names this gap), `Docs/plans/2026-10-13-thr-1811-god-card-progression-and-offerings.md` (progression metadata)
- **Rejected approaches considered and dismissed:** tagging the flows hex cards (their pressure is dropped); re-tagging spine or milestone gifts (moves other gods' cards); a saturation card (duplicates Ward); movement substrate (its own ticket)

## load-bearing decisions touched

- "Reaches and Spheres are orthogonal axes": respected. The cards keep their Reach (gold, heart) separate from the energy sphere.
- "Everything is a graph node/edge": respected; no new state.
- "Ascendants use the same prerequisite system as agents": respected; the cards resolve on the shared ladder.

## high-impact files touched (from Codesight)

- `src/data/unified-action-templates.ts`: 283 importers. The change only adds rows. The plan doc has a Blast Radius section.

## kill criteria

- A playtest shows Stoke cast repeatedly on one town as a dominant loop: lower the prosperity delta below the shock line, or raise the unrest delta.
- The THR-2081 census, once shipped, shows a Kindle god's energy half under a quarter of target at doom 0.75: cards are not the binding constraint; file against the Mandate targets.
