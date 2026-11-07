# Action proposal — Story rows name the deed, not its key (THR-2145)

## intent_quote

The ticket (filed 2026-11-02 while verifying THR-2139):

> `?view=game&seeded&size=medium`, about 200 ticks in, the First's (Kael Thornweaver) sheet → Story group lists a row reading `cell.destroy.power (afflicted)` between "Copy the Scriptures" and "The Star Pilgrim".

> **Done when** the event that produced this row is identified, its Story row reads a player-facing name, and a unit test pins that no Story row on a generated world matches `/[a-z]+\.[a-z_.]+/`.

The orchestrator's design request (2026-11-07 07:31Z):

> It should identify the event minter that leaves `templateName` unset for undertaking-verb events, and decide whether the fix belongs at the minter or in `refFor`'s fallback. The minter is the stronger choice, because other surfaces read `templateName` too. It should also define the generated-world regression test from the Done-when.

Standing rule (UI Law 14, `Docs/design-system/laws.md`):

> **[E] No raw internal keys, ever.** ... A key the vocabulary cannot resolve renders as its best plain-English fallback and warns once, never as the key.

## scope (what this plan does)

Names the one event minter (`createUndertakingOutcomeNode`, `src/engine/grievance/undertakingOutcomeNode.ts:231`) that builds an event node's name from a raw template id. Specifies a pure `outcomeDeedName(templateId, sourceKind)` that resolves the work's card phrase (strategic registry → unified registry → named fallback per source kind, with a once-per-id warn), written as both `name` and a new `templateName` property. Defines two tests: a registry-wide unit test and a generated-world Story sweep that fails on today's main.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change `refFor` or any UI component.
- Does not change the node id, `templateId`, `harmClass`, `verb` or any edge (the grievance mint, omen agenda and motive receipt read them).
- Does not move Story rows to past-tense deed phrasing ("Sealed the Ember Rite") — recorded in the brainstorm as a possible later polish, not filed.
- Does not touch the other eleven event minters, which already name in words.
- No migration: the game has no save files.

## impact_class

Reversible — one engine file's name string plus one additive property, two new tests.

## evidence cited

- **Linear issue:** THR-2145
- **Vision premises invoked:** the world remembers what was done (Story list as a life's record); UI Law 14
- **UL terms touched:** none new (Undertaking, Story group are existing terms)
- **Canon pages consulted:** `Docs/design-system/laws.md` (Law 14), `Docs/canon/undertakings.md` (cells), `src/engine/views/connections.ts` (`refFor`)
- **Prior plan docs this builds on:** THR-1298 (outcome nodes), THR-2139 (Story row per instance)
- **Rejected approaches considered and dismissed:** `refFor` key-shape guard (fixes one of four readers, hides future minters); harm-word naming ("Sealed") — splits the list's convention from encounter rows; `templateName`-only (leaves `name` raw)

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected; one property on an existing event node, no new type.
- "The world graph is mutated in place" — unaffected; the write happens at node creation.

## high-impact files touched (from Codesight)

None. `undertakingOutcomeNode.ts` has 15 importers, `grievance-constants.ts` 12 (grep count). No Blast Radius section needed.

## kill criteria

- The generated-world test cannot be made to fail on today's main (i.e. the outcome node never reaches a Story group in a test world) → the executor falls back to the graph-fixture form that `thr2139-aftermath-sheet-agree.test.ts` uses, and says so.
- Importing the strategic registry into the minter closes an import cycle → resolve the name at the three callers and pass it in (noted for the executor).
- A tester still quotes a dotted key from a Story row after merge → another minter exists; the sweep test should have caught it, so widen the sweep.

## explicit user sign-off

N/A — Reversible.

## author notes for the judge

All substrate claims were measured this run: grep of `type: 'event'` minters (12, one raw), the three callers, vite-node probes of `getStrategicTemplate(...).displayName` and `getUnifiedTemplateById('fight.lair.confront').name`, readers of `templateName` (4 files), and absence of save files. The card-phrase choice (imperative, matching encounter rows) over past-tense deed words is a judgement; the brainstorm records it and what would change it.
