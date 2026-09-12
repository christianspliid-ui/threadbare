# Action Proposal — THR-1481 content model

## intent_quote

> i would like an assessment of our game content model in regards to how easy it is for our agents to use the different content types to build encounters, appointments (in flight) and undertakings.
> i would like the content model to be standardized so it is easy to combine content pieces using the same rules.
> tagging - do we have a standardized tagging system: example an item attachment "the sword of gilgul" tagged with #weapon, #sword, #magical, #entropy. this would allow an entropy themed encounter to give out random #weapon #entropy rewards from the content table. this pattern should be used across all content types so our agent skills for using them just works.

> yes, this is it. and also ensure that it is well integrated in our existing agent harness. start the  design immediately

(Christian, attended chat, 2026-09-12. The second quote answers the assessment that proposed exactly two design tickets: the content model, and the card/router unification.)

## scope (what this plan does)

Adds a content-object registry beside the world-object registry (same row shape, generator, contract test, one-PR rule); a closed content-tag vocabulary with five axes (form, reach, sphere, family, polarity; reach and sphere derived from the existing unions), a generated catalog injected into the authoring prompts, and a named shrinking ratchet for the five existing tag dialects; a `ContentQuery` type with one pure resolver shared by the engine and every gate, placed under the existing reward pool, encounter seeding, undertaking catalysts and the condition pool; optional `tags` on encounter templates with the converter passthrough; the attachment pipeline's first machine gate; a codex tag filter and attachment-sheet tag chips as the player-facing readers; and a harness table (wiring guide, canon page, UL, three pipeline skills, systems-prompt live primitives, brief die, composition quota, live proof, interface map, census) carried as Done-whens. Sliced into five execution tickets.

## scope (what this plan does NOT do — explicit non-goals)

- Does not narrow the node-property `tags` types (`PossessionNodeProperties`, `TraitDefinitionProperties`) — saved worlds carry arbitrary strings.
- Does not replace `RewardPoolRecipe`; it projects onto the query.
- Does not touch the nudge deal-tag vocabulary (`DealContextTag`) — a card-context vocabulary, recorded as a known seam.
- Does not design the appointment primitive (THR-1479); it names the shape THR-1479 must land on.
- Does not build the universal card or router — that is THR-1482.
- Does not add tags to prose or change any rule of play.
- Does not author new encounters, attachments or undertakings beyond one exemplar per query site on templates the pipeline already cites.

## impact_class

Reversible. Every field is optional-additive; the one deletion (`censusTag`) is metadata with no runtime reader; alias and ratchet tables carry legacy spellings one release.

## evidence cited

- **Linear issue:** THR-1481 (child of THR-1156)
- **Vision premises invoked:** `Docs/canon/encounter-catalogs.md` preamble (closed vocabularies; creativity in the combination); THR-1156's four distinctions; THR-1479's connectivity rule
- **UL terms touched:** Template, Encounter, Attachment, Seed, Reach, Sphere; **new:** Content Object, Content Tag, Content Query (UL-proposal seated in `Encounters.md` by slice 1)
- **Canon pages consulted:** `world-objects.md`, `attachments.md`, `encounters.md`, `encounter-catalogs.md`, `undertakings.md`, `interface-map.md`, `design-governance.md`, `systems-inventory.md`
- **Prior plan docs this builds on:** `2026-08-27-shared-anchor-machinery.md` (THR-1212), `2026-09-03-thr-1394-world-object-model.md`, `2026-08-16-consequence-palette-expansion.md` § Primitive D (THR-1146), `2026-06-23-contentcensustag-schema-plumbing.md` (THR-474/477), `2026-09-03-thr-1392-verb-object-undertakings.md`
- **Rejected approaches considered and dismissed:** free-string tags with a warn lint; a hand-written union restating reach/sphere; narrowing node-property types; promoting `censusTag`; replacing the recipe; id-prefix families; folding deal tags; a wayfinder map (see the brainstorm companion)

## load-bearing decisions touched

- **Everything is a graph node/edge.** Respected: no new node or edge type; content stays in catalogs and existing template node types.
- **Reaches and Spheres are orthogonal axes.** Respected and reinforced: two separate tag axes, both derived from the canonical unions.
- **No inventing node types without verification.** Respected: none invented.
- **Engine caches must be owned per session.** Respected: the catalog index lives on `SimulationRuntime`.
- **Relationships are edges, not property fields.** Not touched: tags classify an entry; they do not relate two entities.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` — 476 importers — two optional fields. Blast Radius section present.
- `src/types/traits.ts` — 335 importers — not edited in slices 1–3; type deliberately unchanged.

## kill criteria

- If after slices 1–3 the shared-path test cannot be made byte-identical for every shipped `RewardPoolRecipe`, the resolver is wrong and the recipe path stays as is; stop before slice 4.
- If the migration classification retires more than half of the 118 live tags with no runtime reader losing a match, the axes are too narrow: reopen the `form`/`family` seed set with Christian before tightening any type.
- If two batches after slice 5 author zero queries (the usage census), the capability is dead by THR-1479's own rule and the retro names it.

## explicit user sign-off

Not required (Reversible). Director direction quoted above.

## author notes for the judge

The design leans on one existing, proven mechanism (`reward_draw`) and generalises it, rather than inventing a query language; the judge should check that the plan never lets a gate reimplement the predicate. The deal-tag exclusion is a deliberate scope cut, not an oversight — the eight words do not map onto the eight reaches. The harness table is the part Christian named explicitly; it is carried as Done-whens per slice rather than a trailing docs ticket. Two places where I am least certain: the seed set of `form`/`family` tags (left to the executor under a stated rule with a kill criterion) and whether the anomaly catalog's tag-sharing claim should be made true or deleted (either acceptable; the header must be true).
