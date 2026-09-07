# Action Proposal — THR-1437 worldgen seeds what the systems need

**Plan doc:** `Docs/plans/2026-09-08-thr-1437-worldgen-seeds-the-living-world.md`

---

## intent_quote

> "the longer term goal besides fixing and finishing the map and any defects and small problems across the game is to get the seeding/world generation to a place where we can generate a great starting world with all systems in play, and a mature and balanced set of starting objects and relationships spawned and connected of all the types available in a way that lets the simulation start at a place where it actually looks like a living world of places, people, events and so on. this is a very broad goal, but one i am sure a single agent can probably bring forward."

> "**Worldgen seeding counts and owners**: propose them as named, tunable constants with a one-line rationale each, implement conservative values, and list every constant in the digest for veto. Determinism holds: same seed, same world. Never seed a kind whose band has not shipped its shape (Network until THR-1430 lands; Standing until its shape is settled by THR-1435)."

> (Christian, 2026-09-07, on THR-1435:) "we need to look at our current world generation algorithm and see if we are generating the needed amount of objects … an assessment of all systems, and the objects they use or manipulate, compared to what we seed as the starting world."

## scope (what this plan does)

Adds a tail pass to `seedWorld` (`seedLivingWorld`) with seven passes behind thirteen named constants at conservative defaults: more protagonists (`AGENT_COUNT_BY_MAP_SIZE` medium 18–24), province-based territory, two trade routes per culture with their identity nodes, one freehold per gold/stone/heart protagonist, one possession per protagonist, standing quarrels from the strongest seeded rivalries (`rivalry` provenance, never `grudge`), one mark per culture, one garrison army per culture capital. Every pass reuses the engine's existing writer for the thing it seeds. Determinism is tested by a double build. A ported `census:seeded-world` script and the CLI `objects` readout are the evidence surfaces.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change the graduation aperture (THR-1348's fork).
- Does not seed Company, Network, Companion, or `reputation_with` (the standing rule; THR-1436 makes `relates_to` the Standing object).
- Does not seed grudges that license the plot.
- Does not touch any player surface, prose, or encounter content.
- Does not fix the registry (THR-1436, which lands first and provides `mintRouteIdentity`).
- Does not tune ruin density, road density, or lair factions (noted in the audit, not proposed).

## impact_class

Reversible — every pass is behind a constant whose `0` / `'round_robin'` value is the pre-plan world; the seeder's existing steps and PRNG streams are unchanged.

## evidence cited

- **Linear issue:** THR-1437 (filed from THR-1435; map THR-1396)
- **Vision premises invoked:** `Vision/00-north-star.md`; `Vision/02-non-negotiables.md` §1, §4, §6; `Vision/03-design-tensions.md` §5
- **UL terms touched:** Location, Place, Route, Mortal, Faction, Army, Item, Agreement (mark), Standing (quarrel), freehold, protagonist/spotlight — no new terms
- **Canon pages consulted:** `Docs/canon/world-objects.md`, `Docs/canon/undertakings.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md`, `Docs/canon/undertaking-grid.generated.md`
- **Prior plan docs this builds on:** `Docs/audits/2026-09-08-thr-1435-seeded-world-vs-systems.md`, `2026-09-03-thr-1394-world-object-model.md`, `2026-09-07-thr-1428-owed-readers.md`, `2026-09-02-thr-1383-grievance-supply.md`, `2026-09-08-thr-1436-registry-reads-writers-edges.md`
- **Rejected approaches considered and dismissed:** widening the aperture instead; seeding generously; seeding unshipped kinds; seeding `reputation_with`; grudge-provenance quarrels; culture-blind territory; a worldgen trace — in the brainstorm companion.

## load-bearing decisions touched

- *Everything is a graph node/edge* — respected; every seeded thing is an existing node or edge shape written by its existing writer.
- *Determinism (NFP #3)* — respected; reserved streams, sorted-first, double-build test.
- *No inventing node types* — respected.
- *Relationships are edges* — respected (quarrels, marks, freeholds, lanes are edges).

## high-impact files touched (from Codesight)

None ≥100 importers. `src/engine/worldSeed.ts` (one tail call), `src/data/agent-behavior-constants.ts` (values only), `src/engine/grievance/grudgeEdge.ts` (one union member). New: `src/engine/seedLivingWorld.ts`, `src/data/worldgen-living-constants.ts`, `scripts/census-seeded-world.ts`.

## kill criteria

- Tick cost at medium rises above +25% on either seed → `AGENT_COUNT_BY_MAP_SIZE.medium` steps down to 14–20; recorded on the ticket.
- Province territory leaves a capital under a foreign culture's faction → `'round_robin'` until fixed.
- A heavy-lane test goes red on a fixture assumption (14 mortals, 0 routes) → the assumption is corrected against a generated world; the constant is not lowered to fit a test.
- Christian vetoes any constant in the digest → that constant goes to its off value in a one-line follow-up; the pass stays available.
