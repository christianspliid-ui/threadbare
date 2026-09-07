# Action Proposal — THR-1436 the registry reads the edges the world writes

**Plan doc:** `Docs/plans/2026-09-08-thr-1436-registry-reads-writers-edges.md`

---

## intent_quote

> "Registry ↔ writer disagreements (the ownership edges the registry reads vs the edges the systems write: place `owns`, faction `leads` vs `member_of` rank, power/condition/companion with no `ownedVia`, Standing shaped as a `reputation_with` edge nobody writes, Route shaped as a `trade_route` location worldgen never mints): these are engineering facts, **yours to fix**. Prefer registering the edge the writer already uses over inventing a new writer."

> (Christian, 2026-09-07, on THR-1435:) "we need to look at our current world generation algorithm and see if we are generating the needed amount of objects … an assessment of all systems, and the objects they use or manipulate, compared to what we seed as the starting world."

> (Standing ruling, THR-1396 Notes:) "No new node types; a variant is a subtype or a class."

## scope (what this plan does)

Makes the undertaking object registry read ownership the way the engine writes it for six types: Faction (owner = the leader `getFactionLeaderId` derives), Companion (`accompanies`), Condition (the object becomes the borne `has_trait` edge, the cure removes one bearer's edge and is un-gated for allies), Standing (objects = `reputation_with` ∪ `relates_to` per ordered pair), Item (catalog template nodes excluded), Route (the create cell mints the identity node through a helper shared with the lifecycle). Adds three optional fields to the type interface (`ownersOf`, `gateExemption`, `edgeTypes`), two constants, one interface-map row, a CLI ownership column and a ported ownership census. Place is left as-is (the `owns` edge is right; seeding freeholds is THR-1437's).

## scope (what this plan does NOT do — explicit non-goals)

- No new writer, edge type, node type or property.
- No seeding (THR-1437).
- No flip and no calibration (THR-1403).
- No people-things or yield cell (the next bands).
- Does not change what `create × Condition`, `use × Power` or `destroy × Power` do.
- Does not fix `destroy × Standing`'s bystander-quarrel semantics (recorded for THR-1403).

## impact_class

Reversible — registry reads and one shape change with a test pinning each; every fix has an inverse edit.

## evidence cited

- **Linear issue:** THR-1436 (filed from THR-1435; map THR-1396)
- **Vision premises invoked:** `Vision/02-non-negotiables.md` §1, §4; `Vision/03-design-tensions.md` §2
- **UL terms touched:** Faction, Companion, Condition, Standing, Item, Route, Holding, freehold (no new terms)
- **Canon pages consulted:** `Docs/canon/world-objects.md`, `Docs/canon/undertakings.md`, `Docs/canon/undertaking-grid.generated.md`, `Docs/canon/interface-map.md`, `Docs/canon/systems-inventory.md`
- **Prior plan docs this builds on:** `2026-09-03-thr-1392-verb-object-undertakings.md`, `2026-09-03-thr-1394-world-object-model.md`, `2026-09-07-thr-1429-dormant-kinds-powers-conditions.md`, `Docs/audits/2026-09-08-thr-1435-seeded-world-vs-systems.md`
- **Rejected approaches considered and dismissed:** writing the registry's edges at seed (a second truth); a node-shaped Condition with a target lookup; an ungated cure; items-by-possession; minting the route node inside the edge op — all in the brainstorm companion.

## load-bearing decisions touched

- *Everything is a graph node/edge* — respected (reads existing edges).
- *Relationships are edges, not property fields* — respected; the Condition object becomes the edge the catalogue already names.
- *No inventing node types* — respected.
- *Agent position three-tier model* — untouched.

## high-impact files touched (from Codesight)

None ≥100 importers. `src/data/undertaking-objects.ts` (registry, ~10 importers), `src/engine/strategicActionCandidates.ts`, `src/engine/tradeRouteOps.ts`, `src/engine/strategicActionLifecycle.ts`. `src/types/strategicAction.ts` is touched only if the registry interfaces prove to live there (grep says they live in the registry file).

## kill criteria

- `destroy × Faction` fires against a leaderless lair faction on either census seed → the discriminator is wrong; fix the read, not the rule.
- A live reader outside the registry depends on the Condition object being a node → listed in the closeout and repointed, or the shape change is reverted and the cure fixed by target lookup instead (alternative 2).
- The census re-run still shows `no_owned_object` for any of faction / condition / companion → the plan missed a writer; the executor names it on the ticket.
