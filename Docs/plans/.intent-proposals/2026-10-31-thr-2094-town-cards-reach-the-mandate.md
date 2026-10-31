# Action proposal — THR-2094 town cards reach the Mandate

## intent_quote

There is no live user ask; the request is the ticket (filed under THR-2089's kill criteria) and the orchestrator's design request staging it for the design lane.

> "Tuning follow-up filed by THR-2089 under its plan's kill criteria (§ Kill criteria: a slice-1 first sphere between a quarter and half of target at doom 0.75 → ship, record, file a tuning follow-up)."
> "Hypothesis to test first: the ledger counts the score change the god's pushes made on each entity, and a town's sphere score saturates, so the reachable ledger is bounded by the number of legal towns, not the card price. Second thing to check: why casts stall (essence income vs refused casts — the census swallows refusals in a `catch`)."
> "**Levers** (pick after measuring): widen the cards' `targetSubtypes` (or allow sublocation targets), raise the per-cast pressure, or revisit the Mandate's place weighting. Not a price change — the cards already cost 2."

Orchestrator staging comment (2026-10-31 ~10:40Z): "Choosing among those is a *how* inside an agreed system, so it belongs to the design lane: measure the saturation hypothesis and the cast stall, pick the lever, hand off with a Done-when."

Standing delegation (Christian, 2026-09-25): "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

## scope (what this plan does)

Measures both hypotheses on a proto census and picks two levers. (1) A god's sphere push aimed at a town lands on the town's Place with the lowest score in that sphere. A new pure resolver does this, beside the hex resolver. (2) A god's push is multiplied by its card's essence cost, capped at 2. The card prices, card effects and the Mandate's target and ledger rule are all unchanged.

## scope (what this plan does NOT do — explicit non-goals)

- No change to the Mandate target (87 / 23) or the ledger's credit rule.
- No card price change, no new card, no change to any card's targets or effects.
- No change to mortal or rival pushes.
- No tuning of Gather / Kindle / Haunt / Consume; they are recorded after THR-2090.
- No UI surface.

## impact_class

Reversible. Two switch constants restore today: `GOD_PUSH_LANDS_IN_SUBLOCATION=false`, `GOD_PUSH_ESSENCE_CAP=1`.

## evidence cited

- **Linear issue:** THR-2094 (and its design-request comment)
- **Vision premises invoked:** `Docs/game-design/laws.md` Laws 30, 32, 36, 43
- **UL terms touched:** Mandate, Hunger, sphere, Place (UL game word; code word sublocation), essence. No new terms.
- **Canon pages consulted:** `Docs/canon/rulebook.md` (:413), `Docs/canon/rulebook-quick-reference.md` (:136)
- **Prior plan docs this builds on:** `Docs/plans/2026-10-30-thr-2089-cheap-place-cards.md` (Decisions 1, 2; kill criteria), `Docs/plans/2026-10-31-thr-2090-spirit-life-entropy-place-cards.md` (tide exemption), `Docs/plans/2026-10-28-thr-2081-god-caused-mandate.md` (Decisions 3, 4)
- **Rejected approaches considered and dismissed:** widen targetSubtypes; Place targets on the cards; uncapped per-essence push; lower or per-Hunger target; re-price; pressure-based ledger credit (brainstorm table)
- **Measurements:** proto branch `proto/thr-2094-place-card-plateau`, `scripts/_scratch-2094-results/*.log`

## load-bearing decisions touched

- Agent position is three-tier: hex → location → sublocation; the sublocation tier is `type: 'location'` with `parentLocationId`. The resolver reads children through that property. It does not move anything's position.
- Everything is a graph node/edge: no new node or edge type.
- The world graph is mutated in place: the resolver is pure and builds its map per call, with no identity caching.

## high-impact files touched (from Codesight)

None at ≥100 importers. `unifiedActionResolution.ts` has 62 importers, `src/types/sphereAffinity.ts` 54 (grep of import lines).

## kill criteria

- Any Hunger in `sweep seeded` completes before doom 0.5 → set `GOD_PUSH_ESSENCE_CAP` to 1 and re-measure.
- Preserve under half on top of THR-2090 → file a Keep the Stores target follow-up; no target refit.
- No rival push ever reaches a Place in a warm run → file a rival-targeting follow-up.
- A playtest shows unexplained Mandate movement → name the Place in the Mandate detail.
