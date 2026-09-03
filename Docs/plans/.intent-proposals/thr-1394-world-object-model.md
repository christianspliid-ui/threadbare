# Action proposal — The world-object model (THR-1394)

## intent_quote

Christian, chat, 2026-09-03: *"we have drifted away from the fundamental graph objects that define our world model. the undertakings should interact with the world models fundamental objects … lets put this redesign on hold until we have a full overview of all the game world object types with names that make sense in a game world."* Then: *"lets follow your recommendations i think they are all good. after that ensure that we have a mechanism to ensure that agents can stay in control of, adhere to, and cautiously expand this world model, to keep drift minimal and ensure that the world model stays understandable and easy to work with and connect."*

## scope (what this plan does)

- Ratifies a catalogue of world-object kinds in game words (Area · Hex · Location with classes · Place with classes · Route with subtypes · Mortal · Faction · Culture · Company · Army · Network · Item · Holding-as-ownership · Power · Condition · Agreement · Standing · Trait · Ambition · Undertaking · Event; Sphere and Reach as axes) as a hand-written canon page plus a registry (`src/data/world-objects.ts`).
- Installs the guard: a `NODE_SCHEMA` derived from the registry and checked in dev-mode `addNode` (warn-only, mirroring the edge schema); a generator that writes `Docs/canon/world-objects.generated.md` from the registry plus a seeded-world census with LIVE / DORMANT / UNREGISTERED / PHANTOM badges and a `--check` that fails on drift, registered in the existing generated-freshness gate; a contract test; a served wiki page; a process rule (registry row + UL term + canon row in one PR).
- Extends the existing kind vocabulary rather than duplicating it: every registry kind projects onto a `WorldRefKind` (`src/types/worldRef.ts`, THR-1212) and the generator reuses the anchor catalog's union parser; a test pins that the two cover each other.
- Fixes the measured drift: three phantom target names leave content (merchant, court and warlord packs, `ambition-templates.ts`, the cells' `FOUND_SITE_RULE`), possessions stamp their category, events use one kind key, `resource` and `relationship` retire from the union with their named readers repointed, `cosmology` goes DORMANT and retires only if its two `contextBuilder` reads repoint green, `routeKind` lands on roads, the `sublocationShape` helpers take the game words with deprecated aliases.
- Files the condition/experience-to-edge-state repair as a deferral with its coordination block, and un-parks THR-1392 on the catalogue.

## scope (what this plan does NOT do — explicit non-goals)

- Does not rename `NodeType` members (`artifact` stays `artifact`; the registry maps game word to code word).
- Does not give Power its own node shape.
- Does not redraw the undertaking registry itself (THR-1392 slice 4 does, on this catalogue).
- Does not add a political Area kind; territory stays faction control.
- Does not change any rule of play, any prose, or any game surface.

## impact_class

High-risk by breadth (the type unions and a helper family referenced from 34 files), low-risk by behaviour (additive types, warn-only validation, renames with aliases, retirements with every named reader repointed in the same PR). Classified **High** so it escalates.

## evidence cited

- **Linear issue:** THR-1394 (and THR-1392, parked on it)
- **Vision premises invoked:** `Vision/00-north-star.md`, `Vision/02-non-negotiables.md`, `Vision/taste-profile.md` (words, never numbers)
- **UL terms touched:** Node, Edge, NodeType, EdgeType, Three-tier Position Model, Sublocation, Attachment, Trait, Trait Category, Group, Company, Reputation; **new** (UL-proposal): Area, Location, Place, Location class, Place class, Route, Deposit, Standing, Item
- **Canon pages consulted:** `Docs/canon/engine.md`, `Docs/canon/agents.md`, `Docs/canon/attachments.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/undertakings.md`
- **Prior plan docs this builds on:** `2026-09-03-thr-1392-verb-object-undertakings.md`; `2026-08-27-shared-anchor-machinery.md` (THR-1212 — `WorldRefKind` and the anchor catalog, which this registry extends); the systems-inventory generator (THR-658); the sublocation unification (THR-1183)
- **Rejected approaches considered and dismissed:** hand-written canon alone (drifted before, THR-614); tags as the taxonomy (tags live only on traits); resources as nodes (stocks are place data); "Structure" (not always built); a node per route (doubles hops); throw-on-unknown (NFP #4)

## load-bearing decisions touched

- *Everything is a graph node/edge* — upheld; two union members with no world behind them retire.
- *No inventing node types without verification; new node types require full design* — upheld and strengthened: a new type also names its kind in the registry.
- *Relationships are edges, not property fields* — upheld; the `relationship` node (a reified pair, 0 instances) retires in favour of the edge.
- *Three-tier position model; the sublocation tier is one node shape (THR-1183)* — shape unchanged; the tier gains a game word and the helpers rename with aliases.
- *Distance matrix indexes the place tier only* — unchanged behaviour; the helper it calls renames.

## high-impact files touched (from Codesight)

`src/types/graph.ts` (hundreds of importers — additive edits; union removals with their readers repointed), `src/engine/graph.ts` (one flagged call in `addNode`), `src/engine/sublocationShape.ts` (34 files in all — rename with aliases), `src/types/index.ts` (additive).

## kill criteria

- The census on seeds 42 and 99 reports any UNREGISTERED value after slice 2 → the registry is incomplete; do not merge slice 2.
- The `addNode` check costs more than 1 ms per tick on the seed-42 small `measure:tick-cost` run in dev mode → gate it harder or move it to the generator only.
- A `contextBuilder` repoint for `cosmology` cannot keep its tests green → the member stays DORMANT, named on the page; it is never deleted with a red test. (`resource` and `relationship` have their readers named and repointed in the same PR — that is the plan, not a criterion.)
- The registry and `WORLD_REF_KINDS` stop covering each other → the contract test fails; neither list is edited to make it pass without the other.

## explicit user sign-off

Christian, chat, 2026-09-03: *"lets follow your recommendations i think they are all good."* The four open points (Area geographic only; Deposit as a Location class; conditions to edge state; Place for the inner tier) were his answers in the same exchange.

## author notes for the judge

The plan's risk is breadth, not behaviour; every destructive step is hedged (readers named and repointed before a member goes, aliases before deleting, warn before failing). The one thing that would make it a different plan is if the judge finds the generated page duplicating the hand page — they own different things (decisions vs. census), and the plan says so.
