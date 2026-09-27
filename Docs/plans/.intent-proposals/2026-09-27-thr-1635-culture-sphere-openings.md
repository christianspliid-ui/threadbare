# Action proposal — culture and spheres showing through (THR-1635)

## intent_quote

> "I agree with your analysis. log it as a design map, and make sure you dont forget the details of this analysis"

Christian, 2026-09-25, agreeing the living-world analysis that became the map THR-1589 ("a world that starts alive"). The map's destination is plan docs ready for handoff so that the world starts alive.

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

Christian, 2026-09-25 (THR-1611). This is the authority under which the design lane authors this plan unattended.

The design this plan implements was decided on THR-1599 by the design lane under delegation (2026-09-25, veto invited, not vetoed). The ticket THR-1635 is carve-up plan 6 of 7 from the closed map.

## scope (what this plan does)

The plan adds one stated-fact sentence to the situation-and-complication paragraph of every drawable encounter's opening. The line comes from two shared tables: a culture custom keyed by the place's culture's foundation × the encounter's reach, or, failing that, a sphere fact keyed by the place's dominant sphere × reach when that sphere's share is ≥ 0.55. The plan:

- extends the THR-573 fragment module with two coloration axes and a reserved slot;
- adds a module-load compile pass that places the token in step 0;
- stamps each culture with a variant ordinal at worldgen;
- adds the four missing sphere word lists;
- adds a trace, two debug reads and a debug-tab row;
- splits the prose into two slices (the carrier plus the prototype's cells, then the rest of the tables).

## scope (what this plan does NOT do — explicit non-goals)

- No mechanical effect: no roll, forecast, eligibility, selection weight or surface identity changes.
- No per-template culture rewrites and no word substitution into authored sentences.
- No line keyed on the *actor's* culture ("cultural friction" is named as a possible later idea, not built).
- No change to the sphere card tints.
- No change to the five slice encounters Christian is currently playing (held out by a constant until THR-1220 closes).
- No sphere lines for force, mind, spirit or chaos, which never dominate a place on the measured seeds.
- No new node or edge type.

## impact_class

Reversible. The line is prose only, and the tables and token are additive. Removing the compile pass restores today's text byte for byte.

## evidence cited

- **Linear issue:** THR-1635 (decision THR-1599; map THR-1589; slice 2 THR-1638)
- **Vision premises invoked:** the world is lived in and not about you; narrate, never inhabit (Doctrine v2)
- **UL terms touched:** Culture, Foundation, Sphere, Reach, Location/Place (the outer and inner tiers). No new UL term: the table names are code-level, and "culture custom" is described in plain words.
- **Canon pages consulted:** `Docs/canon/cosmology.md`, `Docs/canon/prose.md`, `Docs/canon/interface-map.md` (Culture and Encounters are unaudited → audit-on-touch rows added), `Docs/canon/systems-inventory.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-07-23-encounter-context-multiplication-grammar.md` (THR-573); the THR-884 setting envelopes (`compileOpeningEnvelope`)
- **Rejected approaches considered and dismissed:** word substitution (THR-1101, Doctrine v2); per-template culture openings (cost); setting envelopes only (no culture, 3.8% of firings); keying the custom on venerated sphere (12 × 8 lines saying less); identity axes (would change selection weighting); a render-time append (five call sites)

## load-bearing decisions touched

- **Everything is a graph node/edge; relationships are edges.** Respected: the place's culture is read through the existing `belongs_to` edge. The only new data is a property internal to the culture node (`customVariant`, an ordinal), not a relationship.
- **Three-tier position model.** Respected: the place resolves up to the Location tier through `resolveToParentLocation`, never by hand-rolled tests.
- **No inventing node types.** None invented.

## high-impact files touched (from Codesight)

None ≥100 importers (counted by grep 2026-09-27: `types/culture` 33, `settingClasses` 50, `proseEnrichment` 29, `worldSeed` 24).

## kill criteria

- A read test or Christian's play shows players skip the added sentence → the tables stay but the compile pass is turned off (one constant/exclusion change).
- The line reads as a stuck record in one town after about five encounters → more variants per cell (the decision's named fix), not a redesign.
- The leak guard finds a renderer outside `enrichProse` that cannot be fixed cheaply → narrow the compile pass's universe to the renderers that are covered.

## explicit user sign-off

Not required (Reversible). The decision is a lane decision under delegation with veto invited; this plan's own lane decisions are listed in the plan for veto.

## author notes for the judge

- The re-measure on current `main` changed one input: seed 42's cultures now have three different foundations. Seed 99 still has two light cultures, so the variant stamp stays.
- The THR-1599 decision named new `foundation`/`sphere` axes in the fragment system. The plan lands them as **coloration** axes, the kind the module already defines, rather than identity axes. I believe that is faithful: the decision is explicit that no encounter is rewritten per culture, which is what identity would imply in the surface count.
- Holding out the slice encounters trades visibility for a clean playthrough verdict. It is flagged as a lane decision for veto.
- The sphere table scope comes from a measurement on two seeds. The trace makes a future miss visible.
