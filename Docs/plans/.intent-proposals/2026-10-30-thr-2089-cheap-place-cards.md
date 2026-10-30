# Action proposal — 2026-10-30-thr-2089-cheap-place-cards

## intent_quote

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." (Christian, chat, 2026-09-25: the design lane's mandate, THR-1611)

The ticket (THR-2089, filed 2026-10-28 by the THR-2081 executor as that plan's kill-criterion output; staged for the design lane by the orchestrator 2026-10-29):

> **Design question.** Give each sphere a cheap place or sublocation card (the THR-2086 shape), or price the Mandate per Hunger.

The THR-2081 plan's kill criterion, which the ticket executes:

> "a Hunger with no energy sphere whose all-in scripted god … stays below half its target at doom 0.75. A constant cannot fix a missing card, so file that sphere's card gap beside THR-2086 instead of refitting."

Standing rulings the plan answers to: Law 38 (cards come from the world's offers, priced in their own sphere); Law 36 (every card costs; the purse is small).

## scope (what this plan does)

It decides the ticket's fork for cards: every sphere a Hunger can name gets a tier-1 market card that targets a settlement and costs 2 essence. Slice 1 adds three such cards on ops already in the catalogue. **Steel the Walls** (`loc.steel_walls`, force) uses `fortify_location`. **Lay the Footings** (`loc.lay_footings`, matter) adds `buildProgress`. **Keep the Stores** (`loc.keep_stores`, time) adds `foodStore`. It also adds `fort` and `tower` to Fortify's subtype list, because Fortify has no legal target on the seeded world today. It adds a progression-check warning, `hole: no cheap <sphere> place card`, and a legal-target filter in `scripts/mandate-census.ts`, because the census over-credits today. It files slice 2 (spirit, life, entropy), which carries a measured doom-wears-life finding.

## scope (what this plan does NOT do — explicit non-goals)

- It does not change the Mandate's targets or price the Mandate per Hunger.
- It does not re-price any existing card.
- It adds no spirit, life or entropy card (that is slice 2).
- It does not decide what to do about doom's entropy push wearing life down (slice 2, possibly a fork).
- It adds no new op, trace, engine phase or UI component.
- It does not touch hex cards (THR-2087).

## impact_class

Reversible. Three data rows, two subtype strings, three constants, one script warning, one census filter. Deleting them restores today.

## evidence cited

- **Linear issue:** THR-2089 (related: THR-2081, THR-2086, THR-2087, THR-1934)
- **Vision premises invoked:** `Docs/game-design/laws.md` Laws 26, 30, 36, 37, 38, 41, 45
- **UL terms touched:** none new (Mandate, Hunger, sphere, essence, market offer, Place)
- **Canon pages consulted:** `Docs/canon/cosmology.md` (Force: physical power; Matter: substance, crafting; Time: duration, memory), `Docs/canon/rulebook-quick-reference.md` (the Mandate counts only the god's own hand)
- **Prior plan docs this builds on:** `Docs/plans/2026-10-28-thr-2081-god-caused-mandate.md` (kill criterion, Decision 3), `Docs/plans/2026-10-28-thr-2086-energy-cards.md` (the card shape)
- **Measurements:** synthetic 2-essence card arm vs legal-target arm, seeded medium 42, five Hungers (in the plan's § Why)
- **Rejected approaches considered and dismissed:** per-Hunger Mandate targets (bakes the catalogue into the win condition; leaves no verb); re-pricing the 4-essence cards (three are gifts); 1-essence price (the look-only band)

## load-bearing decisions touched

- "Reaches and Spheres are orthogonal axes": respected. Each card keeps its reach (iron, stone, gold) apart from its sphere.
- "Everything is a graph node/edge": respected; the cards write existing node properties.
- "Ascendants use the same prerequisite system as agents": respected.

## high-impact files touched (from Codesight)

- `src/data/unified-action-templates.ts`: 283 importers; rows only. The plan has a Blast Radius section.

## kill criteria

- The census with legal targets still shows a slice-1 first sphere under a quarter of its target at doom 0.75: cards are not the limit; file against the Mandate targets.
- A playtest shows Keep the Stores cast every tick on one town as a dominant loop: lower its delta.
