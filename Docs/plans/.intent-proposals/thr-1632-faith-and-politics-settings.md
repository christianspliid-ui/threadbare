# Action proposal — faith and politics as world settings (THR-1632)

## intent_quote

> "This should be tunable for different scenarios. To begin let's go with something that allows us to test and see balance and interaction"

— Christian, Discord, 2026-09-26 16:25 UTC, answering the fork on [THR-1596](https://linear.app/threadbare/issue/THR-1596) (faith and politics at game start). Recorded on THR-1596 by keep-work-flowing-cc.

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

— Christian, 2026-09-25 (the design lane's mandate, THR-1611).

> "I agree with your analysis. log it as a design map, and make sure you dont forget the details of this analysis"

— Christian, 2026-09-25, agreeing the living-world analysis that chartered map THR-1589.

The ticket's own ask (THR-1632, carve-up plan 3 of 7 from the closed map THR-1589): a plan doc implementing THR-1596's decided default — one `WorldScenario` block of knobs; one Temple of the Spheres instance per living culture carrying the culture's first venerated sphere (`TEMPLE_CHAPTERS_PER_CULTURE = 1`, chapters of the existing definition); `HOLY_PLACES_MIN_PER_CULTURE = 2`; unheld towns stay unheld with the wilderness knobs joining the block; settlement guilds get `factionType: 'guild'` plus a class separating them from the 6 definition guilds — and settling two calls from THR-1595: `sacred_route` restore-or-retire, and culture for settlements outside culture provinces.

## scope (what this plan does)

Designs S1 (engine, this ticket): a `WorldScenario` settings block threaded as an optional parameter through `initializeGameState` → `generateWorld` (wilderness counts) and `seedWorld`; per-culture Temple congregations (numeric-suffix instances of the existing definition, seated at the culture capital, halls on the heartland, carrying `cultureId` + `veneratedSphere`, renamed, dispositions for every instance); a holy-place top-up on each culture's heartland after the placement loop; a fringe-culture pass giving settlements outside every heartland the nearest culture within 8 hexes (current layer, half strength, flagged, kept out of the map that builds Realm control); `factionType`/`factionClass` 'guild' on town guilds; one seeded `sacred_route` per congregation to its seat; a debug accessor, one aggregate trace, a census reader. Files S2 (UI: faction page sphere line and guild kind; fringe label in the hex culture panel) as THR-1659 and the mid-game faith cell as deferral THR-1660.

## scope (what this plan does NOT do — explicit non-goals)

- No scenario picker (URL/CLI/UI) — map Out of scope.
- No new faction definition, order, heresy, or faction kind.
- No new culture kind ("frontier culture"), no culture borders on the map, no change to Realm `controls` or holding.
- No sphere-based join gate for congregations.
- No new encounter prose; no mid-game writer for `sacred_route` (deferred); the legacy template is not deleted.
- No change to protagonist counts or the decider budget.
- Not the lane-upkeep or clue-climb design (plan 7 of 7, THR-1636).

## impact_class

Reversible — worldgen-only writers behind knobs; the all-"today" block reproduces today's t0 graph (tested). It does change the default world for every seed.

## evidence cited

- **Linear issue:** THR-1632 (inputs THR-1596, THR-1595, THR-1592; map THR-1589)
- **Vision premises invoked:** the living-world map's destination ("a world that starts alive"); graph purity; game prose / sheet words
- **UL terms touched:** "chapter" is taken (`Docs/ubiquitous-language/Encounters.md:203-209`) → new term **Congregation**; *fringe* under Culture; added in S1's PR
- **Canon pages consulted:** `Docs/canon/world-objects.md` (Route row), `Docs/canon/interface-map.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/cosmology.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-08-thr-1437-worldgen-seeds-the-living-world.md`, `Docs/plans/2026-09-27-thr-1630-notables-and-ties.md`, `Docs/plans/2026-09-28-thr-1631-world-with-a-past.md`, `Docs/plans/2026-09-27-thr-1635-culture-sphere-openings.md`
- **Rejected approaches considered and dismissed:** new order definitions (THR-1596); retiring `sacred_route` (destructive, reader live); frontier culture kind; every town held (THR-1596 option c)

## load-bearing decisions touched

- Everything is a graph node/edge — congregations are faction nodes; fringe is a `belongs_to` edge; routes are `sacred_route` edges.
- Relationships are edges, not property fields — a congregation's culture is a `belongs_to` edge (the actor-culture edge), not the `cultureId` property Realms carry; `veneratedSphere` is an internal founding fact.
- No inventing node types — none invented.
- Political territory is `controls` edges, never a second region kind — fringe culture links are kept out of the `controls` build.

## high-impact files touched (from Codesight)

- `src/engine/gameInit.ts` — 122 importers (33 non-test)
- `src/types/gameState.ts` — 145 importers
- Not touched: `src/types/graph.ts` (255)

## kill criteria

- Steady-state tick cost > +10% vs same-session baseline on seed 42 or 99 → lower fringe strength/range, re-measure.
- Cultural convergence mandate complete at t0 or within 10 ticks → exclude `fringe` edges from its count.
- Unheld settlements change by more than one with wilderness counts unchanged → seat/hall constraint broken.
- Pilgrimage encounter becomes the most-fired encounter at a capital over 200 ticks → cap via cooldown.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The decision said "chapter"; the plan says "congregation" because of the UL collision. Same design. Judge whether the rename is faithful.
- The decision put the sphere on the chapter without naming a reader; the Temple's join rule is Reach-keyed, so the plan reads the sphere on the faction page and in the top-up holy places' `sphereInfluence`. Judge whether that is an honest reader or decoration.
- The fringe decision (culture outside provinces) is the largest lane call here: it gives a culture to roughly half the mortals. Evidence: 26-file reader audit, none political. Judge whether it is a fork in what the game *means* (should be reserved for Christian) or a *how* of the agreed "culture showing through" + "each culture's ground" outcomes.
- A congregation's culture is its `belongs_to` edge; `veneratedSphere` is stored as a property (a founding fact, copied from the culture at worldgen). Judge whether that copy should instead be derived at read time.
