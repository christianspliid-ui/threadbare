# Action Proposal — realms and areas (THR-1155)

## intent_quote

> "ok lets go" — Christian, attended chat, 2026-09-10, to a report that closed with *"The next design session, when you want it: THR-1155 nations and named areas becoming real game objects is High, your direction from August, and now unblocked."*

> The ticket's source, Christian in chat 2026-08-17, verbatim: *"I agree 100% this is a flaw in the implementation, that nations and areas only have the rendering implemented and the game state part is not there. lets schedule a fix for that also."*

> The ratified constraint the plan is written inside (THR-1394, Christian 2026-09-03, the Area row in `Docs/canon/world-objects.md`): *"Geographic only: political territory is a faction's `controls` edges, never a second region kind."* (registry text, `src/data/world-objects.ts:188`) And THR-1156's fourth ratified distinction: *"Rendering reads projections of canonical game state, never private pipelines."*

## scope (what this plan does)

Makes the Area the map's one geography (the watershed detector mints the existing `region` nodes, every hex is stamped, the renderer's parallel clustering and index join are deleted, the geographic borders and labels read a projection of the graph, `effectScope`'s region case becomes real, and `area` becomes a routable reference kind). Makes a nation a **Realm**: one Faction per culture domain minted at worldgen with a dynamic definition, a `factionClass`, a seat and a culture edge, holding its Locations through `controls`; the political border becomes a projection of those holdings (nearest held Location within a radius; farther land unclaimed) so it moves when a town changes hands; the province tier stops being drawn. Adds `$area` / `$realm` sentinels, a court ladder, a realm encounter meta, the chronicle and sheet lines, the rulebook rule, and flips the anchor catalog's gap rows. **Sweeps every engine by-id read of the static faction-definition map onto THR-1322's `getFactionDefinition`** (the door a dynamic definition needs; measured 21 sites in 12 files on `main`, none of which resolve run-founded definitions today), pinned by a tripwire test. Keeps `getHexRegionData` as the Area's point reader with the partition projection composing over it. **Adds conquest as the one runtime producer of a faction's `controls` edge** — a siege the attacker wins at total severity passes the town to the victor army's faction instead of deleting the edge into a vacuum (the vacuum stays for a faction-less victor) — threads the runtime through the war phases so the write bumps `structuralCacheVersion`, and gives the projection a fingerprint belt that makes an un-bumped write visible in the trace. Three ordered slices on one ticket.

## scope (what this plan does NOT do — explicit non-goals)

- No new node type, edge type, `ActorType` or `GameState` field.
- No stored per-hex realm stamp; the political map is derived, never written.
- No barony / province object and no province border.
- No realm encounters authored (content, filed at handoff); no border-crossing movement or awareness cost.
- No scope axis on the plot-hook draw (THR-1147): it is an authoring-time premise table with no graph and no runtime; hooks *about* realms ride the realm-encounter content ticket, and the finished encounter binds `$realm`.
- No Area axis on setting envelopes (THR-884): setting classes are *kind of place*, an Area is *which place*; Realm-scoped spawn rides the existing faction gates, Area-scoped spawn is N/A with the reason in the plan's Content pillar (a `featureType`-keyed class is THR-884's vocabulary decision).
- No new word for a Realm's territory: it *holds* towns (`controls`, the THR-1449 verb); *holdings* stays the `owns` sense and never appears on a Realm surface.
- No change to the ascendant's `controlEffects`, to mortal holds (THR-1287), or to `owns` / Freeholds. Conquest does not touch a mortal's `controlType: 'strategic'` edge on the sacked town (THR-1448's question).
- No siege or battle redesign: only the aftermath's disposition of the loser's faction edge changes (retarget to the victor's faction, else today's vacuum), and the runtime is threaded as an optional parameter.
- No decision on THR-1448 (a held town as a faction position) beyond providing the Realm it needs.

## impact_class

Reversible in shape (no schema change), but wide: worldgen changes the faction mint and the region mint (with an rng-stream pin), three map layers change their data source, and one union gains a member gated by the anchor catalog. Declared **Reversible**; the judge may raise it.

## evidence cited

- **Linear issue:** THR-1155 (parent epic THR-1156; wave-1 map THR-1157; machinery THR-1212; ordering THR-1213; catalogue THR-1394; run-founded definitions THR-1322; sentinels THR-1446; the position that follows THR-1448)
- **Vision premises invoked:** `Vision/03-design-tensions.md` #2 (emergence vs authored — a Realm that acts and a border that moves), `Vision/02-non-negotiables.md` #1 (no player control over a Realm), #3 (holdings in words), #4 (territory, seat and culture are edges), `Vision/00-north-star.md` (weight of threads — the realm your First's town belongs to)
- **UL terms touched:** Area (political sentence updated), Faction (gains classes), Holding / Freehold (untouched, distinguished), hold (THR-1449, distinguished). **New term filed:** Realm (alias nation) — THR-1453
- **Canon pages consulted:** `Docs/canon/world-objects.md` (Step 0 for adding a kind — none added; classes and a worldRef added), `Docs/canon/agents.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/design-governance.md`
- **Prior plan docs this builds on:** `2026-09-03-thr-1394-world-object-model.md` (the Area row and its note), `2026-08-27-shared-anchor-machinery.md` (the kind spine; names THR-1155 as the region-identity seam), `2026-08-27-hunger-vocabulary-unification.md` (the typed-seam pattern this doc cites: one authority, one resolver, a live gate), `2026-09-08-thr-1437-worldgen-seeds-the-living-world.md` (the census instrument; the round-robin territory finding), `2026-03-15-region-naming-design.md` (the Area's origin), `.planning/phases/04-regions-borders/04-RESEARCH.md` (REGN-06: draw only what is political)
- **Rejected approaches considered and dismissed:** a `nation` node type or `polity` actor type (the ruling); a second political region kind (the ruling); a stored per-hex realm stamp (two truths); keeping the worldgen provinces as the border (never moves); promoting provinces to objects (no consumer); keeping two detectors and fixing the join (the join is the symptom); static catalogue entries for realms (per-world object in an authored table); a `nation` chip kind (a Realm is a `faction` reference)

## load-bearing decisions touched

- *No inventing node types without verification* / *new node types require full design before code* — respected by adding none; the plan says so in three places.
- *Relationships are edges, not property fields* — territory (`controls`), seat (a property on one `controls` edge — edge-internal data, not a relationship), culture (`belongs_to`); `factionClass` is data internal to the faction node.
- *Hexes are not graph nodes* — respected; `tile.regionId` is the existing stamp; no political stamp is added.
- *The world graph is mutated in place — never depend on object identity* — both projections memoize on `structuralCacheVersion`, which a `controls` write bumps.
- *Engine caches must be owned per session* — the projections are `SimulationRuntime` fields with `…BuiltAt` versions in the encounter-cache pattern; not module scope, not React state; one owner reachable by the map, the aftermath binder and the CLI alike.

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts` (464 importers) — one member on `visualKind`; `src/types/trace.ts` (120) — three categories; the faction-definition read-site sweep (12 engine files, mechanical and behaviour-neutral for authored ids). All carried in the plan's `## Blast Radius` table. Deliberately untouched: `src/types/gameState.ts` (526), `src/types/graph.ts` (203). `.codesight/` is absent from the worktree; counts are direct import-statement counts recorded in the survey.

## kill criteria

- The watershed partition cannot be made total without absurd clusters → nearest-cluster fill and a cluster cap; never a hex with no Area.
- Realm borders read as noise on the census seeds → halve the fill radius before inventing smoothing.
- Realm ambitions dominate the faction board → retune `EXPANSION_PROSPERITY_THRESHOLD` with the measured Realm prosperity; never gate Realms back out.
- The seed-42 tick-0 rng pin fails → fix the draw order; never re-pin.

## explicit user sign-off

Not required by class. The direction is Christian's (2026-08-17), the constraint is his ratification (2026-09-03), and the go is his (2026-09-10). Two creative choices are presented decided-with-veto in the chat report: the headword **Realm** over **Nation** (THR-1453), and **a Realm keeps the town its army sacks** (conquest as the producer of *takes*; the alternative is a map that can only lose territory).

## author notes for the judge

- The plan's central move is to read the existing Area note as the design rather than a constraint on it: a nation is a Faction because Christian already ruled that political territory is a Faction's `controls` edges. If the judge reads that note as narrower than I do, the alternative is a new node type, which the load-bearing rule makes a High-risk change requiring his sign-off — I chose the reading that needs none.
- The border-as-projection decision trades visual smoothness for a border that moves; the companion records the trade and the kill criterion names the retreat (halve the radius, never smooth).
- Judge run 1 (2026-09-10) returned Revise on three gaps: `getHexRegionData` had no disposition, setting-envelope scoping was neither designed nor marked N/A, and *holdings* collided with the ratified Holding kind. Chasing the first exposed that THR-1322's lookup has no engine callers, so the plan's "by construction" claim was false; the read-site sweep is now in slice 2 with a tripwire, and the claim is stated as *after the sweep*. All three gaps are addressed in this revision.
- Judge run 2 (2026-09-10) returned Revise on four points: the realm projection was placed in a UI memo while `$realm` binds in an engine phase and is tested headlessly; the plot-hook consumer had no disposition; six residual *holdings* in the `controls` sense (one a constant default); and the ratified Area clause was reworded rather than kept. All four are addressed: the projections now live on `SimulationRuntime` in the encounter-cache pattern with one owner for map, binder and CLI; plot hooks are N/A with the reason; the residue is reworded (`REALM_TIEBREAK` default is `'more_held_locations'`); the Area note keeps *never a second region kind* verbatim and gains a parenthetical.
- Judge run 3 (2026-09-10) returned Revise on three small points, all addressed: `$realm` now binds a Realm or stays unbound (the "else the controlling faction" fallback would have bound a guild, since a Realm-held town's own hex is always claimed); the court ladder's third rank is *yeoman*, not *freeholder* (the UL's Freehold is the `owns` edge); and the movement/awareness consumer has its N/A line in the plan's Content pillar. The Area-note quote now matches the registry's punctuation verbatim.
- Judge run 4 (2026-09-10) returned Revise on the `controls` write path, which no earlier run had pulled: the seize test named `transferHolding` (an `owns` writer); the "a `controls` write already bumps" assertion was untrue (`battleAftermath` removes edges with no `touchStructure`, and the war phases carry no runtime); *takes* had no producer because the only runtime path deletes the loser's edge into a vacuum; and *hold* was attributed to THR-1449 in a sense THR-1449 does not propose. All addressed: § Engine E adds conquest as the producer (decided-with-veto), the runtime is threaded through the war phases, `ensureRealmProjection` gains a fingerprint belt with a `reason` on its trace, the seize test drives a constructed siege, a participation test enumerates faction-`controls` writers, the tripwire excludes fixtures, and *holds* is plain prose pending arbitration recorded on THR-1453 with a cross-note on THR-1449.
- Judge run 5 (2026-09-10) returned Revise on four points, all addressed: the browser Done-when now constructs the moved border through a new `__DEBUG.conquerLocation` write lever instead of waiting for an organic siege; the PRNG section now says honestly that the Realm mint changes worldgen's draw count and the seed-42 pin is re-taken once, declared, with changed artifacts listed (the earlier "stream unchanged" claim was impossible — the count and name draws go away and the per-faction profile draws scale with domains, not the rolled count); the `controlled_by` mirror is remove-and-re-add with the exemption stated (`graph.ts` retargets sources only); the THR-1453 / THR-1449 notes the plan asserted are now actually posted and verified; stale self-audit counts fixed; the grep-evidence sentence about `getFactionDefinition` callers corrected; *claims* and *adjacency* disposed.
- Judge run 6 (2026-09-10) returned Revise on three points, all addressed: the `controlled_by` "mirror" the conquest section proposed to remove-and-re-add does not exist as a registered edge type (its only writer is a test fixture), so conquest now touches the `controls` edge only, adds a fresh edge when the town had none, and the executor is told in bold not to register the type; the fail-soft row premised on `retargetEdgeSource` throwing is replaced with its real no-op contract and a double-aftermath branch; the stale constant and fail-soft counts are corrected; THR-1446 is recorded as landed (PR #1875) and dropped from the mutex line.
- The rng pin is the one place a wide-blast regression can hide: replacing the generic-faction mint changes worldgen's draw order unless the executor is careful, and every downstream id would shift silently. The plan makes the pin the first test written.
- Slicing three PRs under one ticket follows THR-1212 / THR-1213's own shape; the close keyword rides only the last.
