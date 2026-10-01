> **title:** Consecrate a pilgrim way — a faith-driven mortal makes a town a pilgrimage destination for its people's congregation, as an undertaking cell — THR-1660
> **linear_issue:** THR-1660
> **author:** Claude Code (design lane, run 2026-10-01c)
> **created:** 2026-10-01
> **three_pillars:** Engine `done — one class object type (pilgrim_way, a class of Route) with one create verb, written through the existing createRelationEdge` · Content `done — the cell's name, deed word, prose lines and catalyst family; the payoff encounter (pilgrimage_trial) already exists` · UI `done — the pilgrim way reads on the Location sheet and the congregation's Faction sheet; the moment card and ledger line come with the cell`

# Consecrate a pilgrim way — THR-1660

*Faith in this world is set at game start and then never moves. Each congregation gets one pilgrim route to its capital, and nothing can ever add another. This plan gives the mortals who want to spread the faith one piece of long work that leaves a mark on the map: they consecrate a town to their people's congregation, and from then on pilgrims come and the pilgrimage can happen there.*

## Why this is load-bearing

[Faith and politics as world settings](2026-09-28-thr-1632-faith-and-politics-settings.md) (THR-1632, lane decision 5) restored pilgrim routes by **seeding**. Each Temple congregation writes one `sacred_route` to its seat capital at game start, so the live reader (`encounterCache.ts:326-340`, `sacredRouteDestinationTemplates`) pools `encounter.pilgrimage_trial` at every culture's capital. It left mid-game consecration to this deferral. The only writer is still the legacy template `strategic_establish_sacred_route` (`zealotStrategicPack.ts:104-124`). It is reachable only through `ambition_spread_faith.templateIds` (`ambition-templates.ts:831`), and under `UNDERTAKING_MODEL = 'cells'` (`strategic-action-constants.ts:1160`) a profile's `templateIds` are never walked (`strategicActionCandidates.ts:106-109`).

**Measured on current main** ([census reader](../audits/2026-09-25-living-world-data/readers/consecration.ts), [output](../audits/2026-09-25-living-world-data/output/consecration-2026-10-01-thr1660.json); seeds 42 / 99 / 7, medium map, default scenario, 300 ticks):

| | 42 | 99 | 7 |
|---|---|---|---|
| `sacred_route` edges, tick 0 → 300 | 3 → 3 | 3 → 3 | 3 → 3 |
| …all of them congregation → seat capital, `origin: 'worldgen'` | yes | yes | yes |
| Mortals who held `ambition_spread_faith` during the run | 23 | 39 | 24 |
| …of those, members of any congregation | **0** | **0** | **0** |
| Long works the faith ambition drove | 2 (`cell.change_raise.standing`) | 0 | 0 |
| Places offering the pilgrimage | 11 (8 shrine/temple + 3 routed capitals) | 15 (12 + 3) | 15 (12 + 3) |
| Pilgrimages run | 2, both at a shrine/temple | 0 | 0 |
| Towns/cities/capitals a consecration could take (D3's test: culture with a congregation, no way yet), tick 0 → 300 | 12 → 5 | 15 → 9 | 15 → 8 |
| …blocked for having no culture link / already routed (t300) | 4 / 2 | 2 / 3 | 6 / 3 |
| Consecratable sites among each holder's 8 nearest towns (the candidate walk), t300 min / median / max | 4 / 4 / 5 | 4 / 6 / 6 | 3 / 3 / 5 |
| Holders with **no** consecratable site in reach | 0 | 0 | 0 |

The site walk was emulated with the generator's own `orderTargetsByProximity` from the holder's `located_at` hex, capped at `STRATEGIC_TARGET_SCAN_CAPS.location_subtype` (8). Every culture has a congregation on every seed, so the only things that block a town are a missing culture link or an existing way. The number of towns, cities and capitals roughly halves by tick 300 (21 → 11 on seed 42). That is reported, not chased here: it bounds how far faith can spread, and it is a property of settlement life, not of this cell.

**What these numbers mean.** The faith ambition has 23–39 holders per world and almost nothing to do: two finished works across three worlds. The map of where pilgrims go is fixed on the first tick. The ambition's milestones and completion prose talk about shrines and flocks. Its cells build Places and raise standing. None of them changes where the faith *is*. This plan adds the one work whose whole fiction is that change, and points it at the pool the encounter cache already reads, so it needs no new firing mechanism.

**The finding that shapes the design.** No faith-ambition holder belongs to a congregation, on any seed (0 of 86). A rule like "a member of the Temple consecrates for their Temple" would therefore be a cell nobody can ever take. The design reads the faith from the **ground**, not from the mortal: a pilgrim way is consecrated to the congregation of the site's own culture (decision D2).

**Lane decisions in this plan** (made under `Docs/canon/process.md` § User review interface rule 4, open to veto):

- **D1 the shape:** a class object type `pilgrim_way` (`classOf: 'route'`) with one `create` verb.
- **D2 whose way it is:** the site's congregation, not the mortal's.
- **D3 where:** a town, city or capital with a congregation on its ground and no pilgrim way yet.
- **D4 the legacy template:** kept as it is, recorded as absorbed. Not deleted.
- **D5 no unmaking verb.**

The decisions this plan draws on are THR-1632's lane decisions 1, 3 and 5 (congregation per culture; holy places; seeded routes). The lane made them on 2026-09-28, and they are past their veto window. Christian's direction on faith was *"something that allows us to test and see balance and interaction"* (Discord 2026-09-26, quoted in THR-1632).

**Is mid-game consecration wanted at all?** The ticket's Done-when allows the lane to record that it is not. The lane judges it **wanted**. Christian's direction asks for interaction, and a faith that can grow toward new towns is an interaction the world does not have today. The Vision premise of a living world that changes under the player's eye argues for it (see the [brainstorm companion](2026-10-01-thr-1660-consecrate-a-pilgrim-way-brainstorm.md) § Is it wanted). The cost is one cell on a substrate that already pays out.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Ambitions & Undertakings** → the cell registry (`undertaking-objects.ts` `UNDERTAKING_OBJECT_TYPES`, `undertaking-cells.ts` `synthesiseCell`) | 🟢 ACTIVE | **extends** — one object type, a class of Route on the MONSTER precedent (`classOf: 'mortal'`, `undertaking-objects.ts:2086-2131`), so one synthesised cell, `cell.create.pilgrim_way` |
| `createRelationEdge` (`strategicGraphOps.ts:384-443`) | 🟢 ACTIVE | **reused** — the single `sacred_route` writer. It schema-validates (:406), refuses a duplicate (:424-428), stamps `establishedTick` (:436) and returns `createdId` (:439). The new verb calls it. It writes no edge by hand |
| `sacredRouteDestinationTemplates` (`encounterCache.ts:326-340`) + `SACRED_ROUTE_DESTINATION_ENCOUNTER_IDS` | 🟢 ACTIVE (reads 3 seeded edges per world) | **extends its producer set** — gains a second producer. The reader is untouched |
| Cell-arm pool invalidation (`strategicActionLifecycle.ts:1796`, `poolInvalidatedLocationIds.push(targetId)` on any successful cell) | 🟢 ACTIVE | **preserve** — a create cell's `targetNodeId` is its site, which is the pilgrim destination, so the new pool is live the same tick. Verified by reading. The legacy hint arm's `ENCOUNTER_POOL_INVALIDATING_EDGE_TYPES` check (:1917-1924) is not on this path and is not needed |
| THR-1617 create-site eligibility hook (`strategicActionCandidates.ts:397-414`, refused as `ineligible:<reason>:<site>`) | 🟢 ACTIVE | **consumed** — the faith-ground test lives here. A target rule has no faith clause (`StrategicTargetRule`, `strategicAction.ts:703+`) |
| World scenario (THR-1632): congregation per culture (`worldSeed.ts:2101-2125`, `belongs_to` culture via `assignCultureToActor`), seeded routes (`worldSeed.ts:2249-2275`) | 🟢 ACTIVE | **preserve** — the cell finds a site's congregation through the same `belongs_to` edge the seeding wrote |
| `strategic_establish_sacred_route` (legacy pack) | 🟠 never offered under `cells` | **preserve, recorded as absorbed** (D4) |
| Moment card / Journey tab deed line (`momentCardModel.ts:144-205`, `JourneyTab.tsx:233-234`) | 🟢 ACTIVE | **consumed** — a finished cell gets both with no new code. The cell supplies a deed word and prose |
| Location sheet Allegiance section (`LocationProfileModal.tsx:256-265`), Faction sheet faith line (`FactionSheet.tsx:118-124, 282-287`, THR-1659) | 🟢 ACTIVE | **extends** — one read-only line on each |

Green-field claims, with evidence: no UI surface reads `sacred_route` (0 hits for `sacred_route` under `src/components`). No undertaking cell writes it (0 hits in `undertaking-objects.ts` / `undertaking-cells.ts`).

## Interface impact

| Contract | Action | Detail |
|---|---|---|
| `seeded-pilgrim-route-pools-pilgrimage` (LIVE, `scripts/interface-contracts.ts:5359+`) | **extend** | A second producer, the `create` verb of `pilgrim_way`, writes the same edge. The reader and its test are unchanged. Edit the row's producer list and note in the same PR |
| new: `consecrated-pilgrim-way-pools-pilgrimage` | **add** | Producer: `PILGRIM_WAY.verbs.create` → `createRelationEdge(…, 'sacred_route')`. Reader: `encounterCache.ts` `sacredRouteDestinationTemplates`. Proof: the cell test in Done-when 2 plus the census in Done-when 5 |
| new: `pilgrim-way-reaches-location-and-faction-sheets` | **add** | Producer: any `sacred_route` edge, whether seeded or consecrated. Readers: `LocationProfileModal` Allegiance line and `FactionSheet` faith line (UI S2). This closes a gap THR-1632 left: the three seeded routes have reached no player surface since they shipped |
| Cell-arm pool invalidation | **preserve** | No edit |

## Engine pillar

### Systems design

**D1 — a class object type, not a switch on the route verb.** Add to `UNDERTAKING_OBJECT_TYPES`:

```ts
const PILGRIM_WAY: UndertakingObjectType = {
  id: 'pilgrim_way',
  displayName: 'Pilgrim way',
  // A class of the Route kind (world-objects.ts:247-248 already lists `pilgrim_way:
  // ['sacred_route']`), the way MONSTER is a class of Mortal.
  classOf: 'route',
  shape: { edgeType: 'sacred_route' },
  ownedVia: [],            // edge objects are held by the edge's own source — the congregation
  tierOf: () => 1,         // one tier: a way is consecrated or it is not
  lexicon: 'route',
  harmOnDestroy: 'network_severed',  // required field; unreachable — no destroy verb (D5)
  reasonWords: 'Only where its people keep a congregation, and no pilgrim way runs yet',
  eligibility: { create: pilgrimWaySiteEligibility },
  verbs: { create: consecratePilgrimWay },
};
```

Why a class type and not a branch inside `ROUTE.verbs.create`:

1. A cell is `(variant, object type)`, and its **site rule** comes from `CREATE_SITE_RULE[type.id]` (`undertaking-cells.ts:131`). A branch inside the route verb could change what is written. It could not change where the work may be aimed, and it could not stop the merchant profiles that walk `cell.create.route` from consecrating.
2. The world-objects catalogue already names `pilgrim_way` as a class of Route (`world-objects.ts:248`). The undertaking registry gains the class it lacked, so `world-objects.ts` needs no edit.
3. MONSTER is the precedent: a class of Mortal that became its own undertaking object (THR-1560).

**D2 — whose way it is.** The edge's **source is the congregation of the site's culture**, not the mortal who did the work. The seeded routes have the same shape (`worldSeed.ts:2263-2266`: congregation → seat). It makes the sheet line *"Pilgrims come here — a way of the Temple of the Ashen Folk"* true, and it is the only version a holder can actually take, since none of them is a member (measured above). The mortal's part is remembered where all finished work is: the project history, the deed line, the completion trace and the moment card. The edge carries `projectId` so the two can be joined.

`congregationOfSite(graph, siteId)`:
1. Find the site's culture through the Location's own `belongs_to` edge to a culture node. Use the current layer; if there are several, take the strongest. Reuse the existing reader (`culturalTension.ts:47` `getLocationCultureIds` or `npcSeeding.ts:338` `resolveLocationCulture`, whichever already returns the current-layer strongest). Do not hand-roll it.
2. Return the living Temple faction (`factionDefId === TEMPLE_OF_SPHERES_DEF_ID`, carrying `veneratedSphere`) that `belongs_to` that culture (written by `assignCultureToActor`, `worldSeed.ts:2117`). If there are several, take the lowest id (NFP #3). If there are none, return `null`.

Fringe links (THR-1632 S1d) count. A town outside every heartland that took the nearest culture at half strength belongs to that culture's congregation, the same as it does for custom readings.

**D3 — where.** `CREATE_SITE_RULE.pilgrim_way = { type: 'location_subtype', subtypes: PILGRIM_WAY_SITE_SUBTYPES }`, which is `['town', 'city', 'capital']`. Shrines and temples are deliberately excluded, because every pilgrimage encounter is already gated to them (`strategic-action-constants.ts:331-344`). A way to a shrine would add nothing to the pool. The legacy template had exactly this defect, and THR-1184 found it.

`pilgrimWaySiteEligibility(graph, actorId, handle)` returns `null` when the site is consecratable. Otherwise it returns one of:

| Reason | When |
|---|---|
| `consecrator_gone` | the actor is dead or gone |
| `site_gone` | the site node no longer exists, or is no longer one of `PILGRIM_WAY_SITE_SUBTYPES` (razed, ruined). This matters at completion; the candidate walk never offers such a site |
| `no_congregation_here` | `congregationOfSite` is `null`: no culture, or the culture has no living congregation |
| `already_a_pilgrim_destination` | the site already has **any** incoming `sacred_route`. The reader is a boolean, so a second way adds nothing |

The mortal does **not** need to be a member, and does not need to share the site's culture. The ambition is *Spread the Faith*. A zealot who walks into a foreign town and makes it a destination for that town's own Temple is spreading pilgrimage, and that is the fiction the ambition's prose already asks for. The site is a town, never wilderness, so the ground always decides whose faith it is.

The THR-1617 hook runs after the 8-nearest cut (`STRATEGIC_TARGET_SCAN_CAPS.location_subtype: 8`). A consecratable site that is not among the holder's 8 nearest towns is never seen. This is acceptable by design: the work is local, and the cap is the board's own budget. Measured, every holder on every seed has 3–7 consecratable towns within its 8 nearest, and none has zero (table above).

**`consecratePilgrimWay(ctx)`:**

```
site       = ctx.targetNodeId ?? nodeIdOf(ctx.handle)
             — the far end chosen at proposal; never substituted
re-check   pilgrimWaySiteEligibility at completion
             — the world moved during the project; fail with its reason, no write
congregation = congregationOfSite(graph, site)
result     = createRelationEdge(graph, congregation → site, 'sacred_route',
               { establishedTick: tick, origin: 'undertaking', projectId: ctx.projectId })
return result   — createdId is the edge id
```

`createdId` is an edge id, so christening does not fire (`strategicActionLifecycle.ts:336-343` needs a node), and none is wanted: a pilgrim way has no name of its own. It reads as *the Temple's way to Brindle*. The resolver appends `createdId` to `strategic_world_change.affectedNodeIds` (`undertakingResolver.ts:222`). An edge id there is harmless, but the executor confirms that `describeDeed` (:585) falls back to the cell's deed word when the id is not a node.

**D5 — no unmaking verb.** The registry contract test (`undertaking-objects.test.ts:65-75`) requires every type with `create` to also carry `destroy`. Route is exempt (`t.id !== 'route'`, :71) because the hostile verb on a route is a blockade. Widen the exemption to the Route **kind**: `t.id !== 'route' && t.classOf !== 'route'`. Desecrating a pilgrim way would be a counter-play work with a harm class and a grievance. That is a separate design with a real meaning question (is unmaking a faith's way an act against the faith or against the town?). It is not needed for faith to move, so it is out of scope (see the brainstorm). Nothing decays a `sacred_route` today, and nothing in this plan does either.

**The profile.** Add `'cell.create.pilgrim_way'` to `ambition_spread_faith.strategicProfile.cells` (`ambition-templates.ts` ~:812-821). Insert it after `'cell.create.place'`. Cells rotate by tick (`strategicActionCandidates.ts:251-255`), so the position matters little, but it groups the faith's two building works. No other ambition walks it in this plan.

**Do not widen `createsRoute()`** (`strategicActionCandidates.ts:663-666`, hard-coded `objectTypeId === 'route'`). Its own-settlement exclusion (:797-801) stops a merchant opening a lane to the town they stand in. A zealot consecrating the town they stand in is the most natural form of this work. The executor leaves the check exactly as it is and adds a test that a holder may consecrate their own town.

### Graph nodes / edges

- **No new node type and no new edge type.** `sacred_route` (actor → location, needs `establishedTick`, `edgeSchema.ts:495-513`) is written as the seeding writes it, with source the congregation.
- **Edge properties:** `establishedTick`, `origin: 'undertaking'` (the seeding writes `'worldgen'`), and `projectId`. These are internal data about the edge. `projectId` is a join key into the project history, which is where the mortal's part already lives as records. It is not a relationship that needs traversal, so it is not a second edge.
- `src/types/graph.ts` is **not** touched.

### Tick phases

There is no new phase:
- **Candidate generation:** the strategic decision pass. The cell is walked like any other profile cell.
- **Progress:** the checkpoint pass, unchanged.
- **Completion:** the resolver, in `strategicActionLifecycle` / `undertakingResolver`.
- **Pool invalidation:** the existing cell arm (:1796).
- **The payoff:** the next `getEncounterPool` at the site, via the existing reader.

### Resolution logic

The work rides the cell machinery unchanged:
- Difficulty, payoff and length come from `create`'s verb tables at `UNDERTAKING_DEFAULT_TIER`.
- The reach profile is `create`'s (`stone 0.6, gold 0.4`).
- The motivations are `create`'s.

**One override, by package, is in scope.** `create`'s generic reach (Stone/Gold, the builder's) misreads a consecration, which is Star work. The legacy template used `star 0.5, stone 0.3, heart 0.2`. Ship the cell with an `UndertakingCellOverride` carrying `reachProfile: PILGRIM_WAY_REACH_PROFILE` = `{ star: 0.6, heart: 0.4 }`, using the overrides surface (`undertaking-cells.ts:379-429`) as THR-1392 intended ("an override is where taste goes when a cell earns it").

There is one alternative to check first. If the cell can carry its reach directly, the way `UNDERTAKING_CELL_CATALYSTS` is read at synthesis, a bounded `UNDERTAKING_CELL_REACH` table read in `synthesiseCell` is preferred over a package override. The executor checks which the grid generator and the codex already display, and uses that one. Either way the Star lean is the constant below. Growth on completion then raises **Star** (`undertakingCapabilityGrowth.ts` reads the work's reach), so a zealot who consecrates becomes better at faith work. That is the mortal's progression, and it is right.

### PRNG callouts

None. The site walk is the existing deterministic candidate walk, the congregation tie-break is the lowest id, and the verb has no roll. The checkpoint dice are the existing undertaking dice on their existing stream.

## Content pillar

### Undertaking text

All of it lives in `src/data/undertaking-verb-prose.ts`, in the four tables that hold every cell's words:

| Table | Entry |
|---|---|
| `UNDERTAKING_CELL_PHRASES` | `'cell.create.pilgrim_way': 'Consecrate a pilgrim way'` |
| `UNDERTAKING_CELL_DEEDS` | `'cell.create.pilgrim_way': 'Consecrated'` |
| `UNDERTAKING_CELL_PROSE['cell.create.pilgrim_way']` | an `UndertakingVerbLineSet` in the shape `'cell.destroy.monster'` uses (:416-428): **three activity lines, three completion lines and one narration line**. Start from the legacy template's (`zealotStrategicPack.ts:110-117`), rewritten to the GM-narration register (`Docs/canon/prose.md`; the game says what happened, never in situ). Use only the slots the table already fills: `{Actor}` / `{actor}`, `{object}`, `{place}`. There is no congregation slot. Lines do not name the congregation, and a new slot is out of scope: the sheet line and the moment card's chips name it from state. |

Sample (the executor may improve these, keeping register and slots):

> *activity:* "{Actor} is marking way-stones on the road into {place}, one blessing at each."
> *completion:* "{Actor} has consecrated the way to {place}. Pilgrims will follow where the faithful walked first."
> *narration:* "{Actor} means to make {place} a place of pilgrimage."

### Catalyst

`UNDERTAKING_CELL_CATALYSTS['cell.create.pilgrim_way'] = { kind: 'encounter_template', tags: ['#temple_errand'] }`, the legacy template's own family (`zealotStrategicPack.ts:118`). It is a live tag: members are in `temple-of-spheres-encounter-content.ts:62, 186, 313, 443, 585`. The executor confirms that `undertakingCellCatalysts.test.ts` (the eligibility half) passes for town, city and capital. If no member accepts `capital`, the test names it and the row stays, because a withered seed is today's fail-soft.

### Encounter templates

None new. The payoff is `encounter.pilgrimage_trial`, which already exists and is already pooled by the reader. That is the point of D3.

### Data tables

| Table | Change |
|---|---|
| `CREATE_SITE_RULE` | one row |
| `CELL_FAMILY_BY_TYPE` | `pilgrim_way: 'zealot-mission'`, the legacy template's family, and what the faith ambition reports |
| `UNDERTAKING_KIND_GLYPHS` (`undertakingCodex.ts:35`) | `pilgrim_way: '✶'` (or any glyph distinct from route's `⇢`; totality pinned at `codexUndertakings.test.ts:74`) |
| `ambition_spread_faith.cells` | one entry |
| `scripts/undertaking-grid-dispositions.ts` | a `LIVE_CLASS_CELL_NOTES` entry for `pilgrim_way.create` (`:220-225`) with `op: 'create_relation_edge (sacred_route)'`, a one-line note, and `retires: ['establish_sacred_route']` (D4) |

## UI pillar

*Screenshot tool: Playwright (DOM surfaces only, no WebGL).*

### Player-facing display

**S2 is the one UI slice.** It makes every pilgrim way visible, the three seeded per world as well as consecrated ones. The seeded ones have shipped with no player surface (0 component reads).

1. **Location sheet, Allegiance section** (`LocationProfileModal.tsx:256-265`, beside `HeldByLine`). When the Location has any incoming `sacred_route`, show one line: *"Pilgrims come here — a way of* [Congregation] *."* The congregation name is a link to its Faction sheet (Law 33), with its `EntityVisual` and tooltip (the UI Law, THR-1004). With several ways, list the congregations, joined, in id order. No numerals; a count is never shown.
2. **Faction sheet**, under the THR-1659 *"Venerates …"* line (`FactionSheet.tsx:282-287`). For a congregation with outgoing `sacred_route` edges, show *"Pilgrim ways to* [Town], [Town] *."* Each town is a link with its visual.
3. Both lines read through **one selector**, `selectPilgrimWays(graph)` in a new `src/engine/pilgrimWays.ts`, returning `{ edgeId, congregationId, siteId, origin, establishedTick, projectId }[]` sorted by edge id. It is used by the two lines, the debug accessor and the census reader, so there is one read path (Law 56: chips are state-backed). Memoise it on `worldVersion`, never on graph identity.
4. **The moment card and the Journey-tab deed line come with the cell**, with no new code. *"Consecrated — the way to Brindle"* uses the deed word and the site, as every finished cell does.

UI Laws engaged: 1, 4, 13/14 (player words — *pilgrim way*, never `sacred_route`), 17, 21, 33 (every name is a link), 37, 56 (state-backed: the line reads the edge, never a cached string).

### Event notifications

Nothing new. A followed mortal's finished consecration stops the world through the existing moment card, and an unfollowed one badges. The chronicle receives the existing completion record. A dedicated toast would duplicate the moment.

### Debug inspection (DebugPanel)

`window.__DEBUG.getPilgrimWays()` returns `selectPilgrimWays` plus each congregation's and site's name. It is declared in `src/debug-bridge.d.ts` with JSDoc and is synchronous, because it is a pure graph read. The existing `getStrategicProjects()` shows the work in flight, `getWorldScenario()` keeps its `pilgrimRoutes` count, and `startUndertaking` can stage the cell for review.

### Visual presence (HexMapV2)

N/A. A pilgrim way is actor → location with no hex path. There is nothing to draw between two places, and the seeded routes draw nothing either. A map signifier for pilgrimage destinations would be a separate UI decision. It is noted in the brainstorm and not proposed here.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `PILGRIM_WAY` object type + `consecratePilgrimWay` (`undertaking-objects.ts`) | strategic decision (candidates) → checkpoint pass → resolver | moment card, Journey deed line (existing) | `strategicState.projects` / `.history` (existing) | `strategic_world_change`, `strategic_project_progress` (existing); board refusals `ineligible:<reason>:<site>` (existing) | `getStrategicProjects`, `startUndertaking` |
| `pilgrimWaySiteEligibility` | candidate walk (THR-1617 hook) | — | — | board refusal reasons (existing) | `getStrategicDecisionSummary` |
| `src/engine/pilgrimWays.ts` `selectPilgrimWays`, `congregationOfSite` | read-only, no phase | `LocationProfileModal`, `FactionSheet` | graph (`sacred_route`, `belongs_to`) | — | `getPilgrimWays()` |
| `sacredRouteDestinationTemplates` (existing) | encounter-pool build | encounter flow | graph | existing | `getWorldScenario().pilgrimRoutes` |

Wiring checklist: one new debug accessor and one new engine module, both read-only. No modal, no GameState field, no trace category. Update `Docs/plans/wiring-checklist.md` with the accessor row.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `PILGRIM_WAY_SITE_SUBTYPES` | `['town', 'city', 'capital']` | Where a way may be consecrated. Shrines and temples are excluded because they already host the pilgrimage (D3) |
| `PILGRIM_WAY_REACH_PROFILE` | `{ star: 0.6, heart: 0.4 }` | The reaches the work leans on, and so the reach a finished consecration grows |
| `PILGRIM_WAY_EDGE_ORIGIN` | `'undertaking'` | The `origin` stamp that tells a consecrated way from a seeded one (`'worldgen'`) |

Difficulty, payoff, length and the per-cell candidate cap stay the `create` verb's and the board's own constants. This plan adds no second copy.

## Tracing

**No new trace type** (and so no edit to `src/types/trace.ts`, a high-importer file). Every question about a consecration is answered by an existing trace or by the edge itself:

- **Why it was not offered:** the board's `ineligible:<reason>:<site>` refusal, with the three reasons above.
- **That it finished:** `strategic_world_change` with the site in `affectedNodeIds`, and `strategic_project_progress` with `status: 'completed'`.
- **Which congregation, from which project:** the edge's own `source` and `projectId`, read through `getPilgrimWays()`.
- **A refusal at completion:** the `GraphOpResult` failure reason, which the resolver already records on the project (`undertaking_cell_unreachable` when the cell itself cannot resolve).

```ts
// Shape returned by selectPilgrimWays / __DEBUG.getPilgrimWays (not a trace — a read model)
interface PilgrimWayRow {
  edgeId: string;
  congregationId: string;
  siteId: string;
  origin: 'worldgen' | 'undertaking' | string;  // legacy writer leaves it unset → 'legacy'
  establishedTick: number;
  projectId: string | null;
}
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Site razed, became ruins, or left `PILGRIM_WAY_SITE_SUBTYPES` mid-project | Completion re-check fails `already_a_pilgrim_destination` / `no_congregation_here` / `site_gone`. No write, and the project resolves as failed with that reason, as `ROUTE.create` does with `far_end_gone` |
| The site's congregation dissolved mid-project | `no_congregation_here` at completion, no write |
| Another way was consecrated to the site first | `createRelationEdge` refuses `edge_already_exists`, or the re-check refuses `already_a_pilgrim_destination`. No write, no throw |
| Schema rejects the edge | `createRelationEdge` returns its failure, which is recorded on the project. The tick continues |
| `congregationOfSite` finds several Temples on one culture | Lowest id (NFP #3). Census-visible |
| The site's culture is unreadable (no `belongs_to`) | `no_congregation_here`. The site is simply never offered |
| UI reads an edge whose source or target node is gone | `selectPilgrimWays` skips the row. The sheet shows nothing rather than a dangling name |

## Blast Radius

`src/types/strategicAction.ts` gains `'pilgrim_way'` in `UndertakingObjectTypeId` (:61-65). The union is consumed through five `Record<UndertakingObjectTypeId, …>` tables, all in `src/`. Their totality is compile-checked, so a missed row is a type error, not a runtime surprise:

- `HARM_ON_DESTROY`: derived, no edit.
- `CELL_FAMILY_BY_TYPE`.
- `CREATE_SITE_RULE`.
- `UNDERTAKING_KIND_GLYPHS`.

No `switch` on the type id exists (the resolver looks types up by id, `undertakingResolver.ts:162`). `src/types/graph.ts` and `src/types/trace.ts` are **not** touched.

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/strategicAction.ts` | **123** files import it. Measured 2026-10-01 by counting `src/` + `scripts/` files whose import names `types/strategicAction`, since `.codesight/` is absent in the worktree | Additive union member. Only the five total `Record<UndertakingObjectTypeId, …>` tables cascade, and the compiler names each one. No runtime path changes for existing ids |

## Rulebook impact

- [ ] This plan does not change a rule of play. **Unchecked: it does.** It adds a new long work.
- [x] The rulebook paragraph is part of this ticket's scope: the executor lands it in the build PR. The executor adds this paragraph to `Docs/canon/rulebook.md`, beside **A hunt** in the undertakings section, as `[IMPL]` with its file references:

> **A pilgrim way** [IMPL — THR-1660; the `pilgrim_way` object type in `src/data/undertaking-objects.ts`, a class of Route]. A mortal who wants to spread the faith can make a town a place of pilgrimage. **Consecrating a pilgrim way** is a long work at a town, city or capital where a congregation keeps the faith of the land's own people, and where no pilgrim way runs yet. Finishing it gives that congregation a way to the town: from then on pilgrims come, and the pilgrimage can happen there. The way belongs to the congregation, not to the one who made it. The zealot need not be a member, and may consecrate a foreign town for its own people's Temple. Shrines and temples need no way; pilgrims already go there. A way, once made, is not unmade.

The quick-reference card needs no line, since undertakings are listed there by family, not by cell. The executor confirms this at pickup.

## Vision audit

- [x] This plan does not contradict any Vision premise. A faith that can move toward new towns serves *the world is alive and changes under you*. The god is not the actor here; mortals are, which keeps the god's role as nudger (core loop) intact.
- [x] No Vision edit is needed.

## Three-pillar check

- [x] Engine pillar: one class object type, one verb, one eligibility hook, one profile entry.
- [x] Content pillar: phrase, deed, prose lines, catalyst. The payoff encounter already exists.
- [x] UI pillar: the Location and Faction sheet lines (for seeded and consecrated ways alike), the debug accessor, and the moment card and deed line that come with the cell.
- [x] Wiring connects them through one selector.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Site subtypes, reach lean and origin stamp are named constants. Difficulty, length and payoff stay the verb tables' |
| 2. Inspectability | PASS with note | No new trace type, by choice. Every question is answered by an existing trace, a board refusal reason, or the edge's `source` / `origin` / `projectId` through `getPilgrimWays()` |
| 3. Determinism | PASS | No new randomness. Congregation ties break by lowest id. The selector sorts by edge id |
| 4. Fail-soft | PASS | See the table. Every failure is a recorded refusal with no write and no throw |
| 5. Narrative over mechanical perfection | PASS | The way belongs to the people's congregation, so the sheet line reads true. Shrines are excluded because the fiction "pilgrims come here" would change nothing there |
| 6. Additive over destructive | PASS | One union member, one type, one cell. The legacy template, its three tests and the ratchet line are kept (D4). The one contract-test edit widens an exemption; it removes nothing |
| 7. Performance budget | PASS with note | The eligibility hook does at most 8 site checks per holder per decision: one `belongs_to` read, one faction lookup, one incoming-edge read. 23–39 holders per world. Done-when 5 records ms/tick before and after, within ±3% |

## Done when

- [ ] **DW1** — **Registry.** `pilgrim_way` is in `UNDERTAKING_OBJECT_TYPES` with `classOf: 'route'`, and `cell.create.pilgrim_way` is synthesised. `undertaking-objects.test.ts` passes with the exemption widened to the Route kind (:71) and `CLASS_OF` gaining `pilgrim_way: 'route'` (:35-38). `undertaking-cells.test.ts` passes. `npm run check:undertaking` passes, and the generated grid shows the class cell with its note.
- [ ] **DW2** — **The cell, unit-tested** (a new `pilgrimWay.test.ts`):
   - Completing the cell at a town whose culture has a congregation writes exactly one `sacred_route` congregation → town with `origin: 'undertaking'`, `establishedTick` and `projectId`, and puts the town in `poolInvalidatedLocationIds`.
   - `getEncounterPool` at that town then contains `encounter.pilgrimage_trial`. Assert it through the real cache, not by reading the edge.
   - A site with an existing incoming way is refused `already_a_pilgrim_destination`, at the board and at completion.
   - A site whose culture has no congregation is refused `no_congregation_here`.
   - A shrine is never a candidate site.
   - A holder may consecrate the town it stands in.
   - A non-member holder may consecrate (the measured case).
   - The finished work's deed line reads the cell's deed word and the site, even though `createdId` is an edge id: `describeDeed` falls back correctly. Assert this; do not leave it to reading.
- [ ] **DW3** — **The profile.** `ambition_spread_faith.cells` contains the cell. The legacy template, its pack entry, its three tests (`encounterCache.test.ts:545+`, `edgeIntegrity.test.ts:141-168`, `strategicBehaviorFamilies.test.ts:365-402`) and `undertakingRetrofitPending.ts:55` are **unchanged** and green.
- [ ] **DW4** — **UI**, browser-verified with Playwright at 1920×1080 on `?view=game&seeded&size=medium`, with four-part evidence:
   - a screenshot of a capital's Location sheet showing the seeded way's line, and of its congregation's Faction sheet showing *Pilgrim ways to …*;
   - the console;
   - `window.__DEBUG.getPilgrimWays()` returning the seeded rows;
   - a UI-Laws line citing 1, 4, 13/14, 17, 21, 33, 37 and 56.

   A consecrated way is shown by staging the cell with `startUndertaking` on a holder and `tick(n)` until it completes. If that cannot be driven in the run, the unit test covers the consecrated case, and the substitution is recorded as `Browser-verify substitution: <route> — <reason>`.
- [ ] **DW5** — **Census, with a kill criterion.** Extend `readers/consecration.ts` with consecrated-way counts and rerun it on seeds 42, 99 and 7, medium map, 300 ticks. Put the before/after in the PR body:
   - `sacred_route` edges by origin;
   - consecrations started and finished, by holder;
   - pilgrimages offered and run at consecrated sites;
   - ms/tick.

   **Kill criterion:** if no seed finishes a single consecration in 300 ticks, ship anyway. The cell is correct and test-proven. Then record in the closeout which stage starved it, using the board's own refusal reasons and the in-window filter (the [THR-1689 measurement](https://linear.app/threadbare/issue/THR-1689) is the open question about how the board chooses). Do not tune verb tables or the window here; that is THR-1689's lane.
- [ ] **DW6** — **Docs in the same PR:**
   - the rulebook paragraph above;
   - the interface-map rows (`scripts/interface-contracts.ts` + `Docs/canon/interface-map.md`), followed by `npm run generate-interface-map`;
   - the Route row note in `Docs/canon/world-objects.md` (*a pilgrim way may also be consecrated mid-game, THR-1660*);
   - the UL Route entry's one-line amendment (`Docs/ubiquitous-language/Graph.md:65`);
   - the systemic wiring guide (a new undertaking cell that writes a pool-changing edge);
   - the wiki page whose `sources` glob matches (`check:wiki-freshness:blocking` names it).
- [ ] **DW7** — `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy` (engine touched), the 30-tick CLI smoke, both freshness gates last.

## Coordination block

**Suggested model:** opus. A registry-wide additive type plus a UI slice. The judgement calls are in the cell's eligibility and the reach-override placement.

**Parallel-safe with:** [the shortlist's local draw](https://linear.app/threadbare/issue/THR-1687) (edits `encounterFilterPipeline.ts`, not touched here); [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572) (spell data and power runtime, not the undertaking registry).

**Mutex with:** [The lead survey and the kept visit](https://linear.app/threadbare/issue/THR-1686), because both edit `src/data/undertaking-cells.ts` / `strategicActionCandidates.ts` (its survey door and visit hold sit in the candidate walk). Also any open ticket editing `src/data/undertaking-objects.ts`'s registry list or `ambition-templates.ts`'s `ambition_spread_faith` profile.

**Files to touch:**
- Create: `src/engine/pilgrimWays.ts`, `src/engine/__tests__/pilgrimWay.test.ts`
- Edit:
  - `src/types/strategicAction.ts`: the union.
  - `src/data/undertaking-objects.ts`: the type and the registry list.
  - `src/data/undertaking-cells.ts`: `CREATE_SITE_RULE`, `CELL_FAMILY_BY_TYPE`, catalyst row, reach lean.
  - `src/data/undertaking-verb-prose.ts`: phrase, deed, prose.
  - `src/data/ambition-templates.ts`: one cell id.
  - `src/data/strategic-action-constants.ts`: three constants.
  - `src/components/Codex/undertakingCodex.ts`: glyph.
  - `src/components/…/LocationProfileModal.tsx`, `FactionSheet.tsx`: the two lines.
  - `src/debug-bridge.ts`, `src/debug-bridge.d.ts`: the accessor.
  - `src/data/__tests__/undertaking-objects.test.ts`: exemption, `CLASS_OF`.
  - `scripts/undertaking-grid-dispositions.ts`, `scripts/interface-contracts.ts`.
  - Docs as in Done-when 6.

## Notes for the executor

- **Do not touch the legacy template** (D4). It is dead under `cells`, and its three tests prove `createRelationEdge` and the reader, both of which this plan reuses. Whatever sweep eventually retires the `templates` model retires it with its siblings (`found_shrine` and `consecrate_site` were handled the same way: `retires` in the grid note, template kept).
- **Never write the edge by hand.** Go through `createRelationEdge`, so schema validation and the duplicate refusal stay in one place.
- **Do not add a destroy / desecrate verb** (D5), and do not make `sacred_route` decay.
- **Do not widen `createsRoute()`**, for the reason given above.
- The seed-42 census found one seat capital turned to ruins by tick 300. Its worldgen way still points there, and the pilgrimage is still offered at the ruins. That is consistent with "a way, once made, is not unmade" (pilgrims to a fallen holy city). This plan does not change it. A Location-sheet line on a ruin reads the same.
- If the reach lean cannot be carried without a package override, the package lives beside the other cell overrides, and the cell id the profile names is then the override's id (`cellOverrideId`). Check what the grid and the codex display before choosing.

## Intent-judge verdict

**Allow** (2026-10-01, cold spawn, Reversible confirmed). Findings, both advisory:

- The ticket's test-file line ranges differ from this plan's. This plan's re-measured ranges are current.
- Assert the `describeDeed` fallback in a test rather than by reading. This has been folded into Done-when 2.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-01*

### NFP audit

**PASS-with-notes.**

- **1 Tunability:** PASS. Three named constants, and the verb tables are reused.
- **2 Inspectability:** PASS with a note. No new trace category, by design. Questions are answered by board refusal reasons, `strategic_world_change`, and the edge's `source` / `origin` / `projectId` via `getPilgrimWays()`. A completion-time refusal relies on the existing project failure record.
- **3 Determinism:** PASS. No new randomness, lowest-id tie-break, and a sorted selector.
- **4 Fail-soft:** PASS. Every failure is a recorded refusal, with no write and no throw.
- **5 Narrative:** PASS. The way belongs to the site's own congregation; shrines are excluded.
- **6 Additive:** PASS. The legacy template, its tests and the ratchet are kept. The only test edit widens an exemption.
- **7 Performance:** PASS with a note. At most 8 site checks per holder per decision. The estimate is not yet measured; Done-when 5 records ms/tick within ±3%.

### Three-pillar audit

**PASS.**

- **Engine:** present and substantive.
- **Content:** present and substantive. The payoff encounter already exists.
- **UI:** present and substantive. The hex map is N/A with a rationale, and the Playwright tool is named.
- **Required sections:** none missing. Blast Radius is present.
- **Wiring:** connects each pillar to its phase, component, state, traces and debug surface.
- **Substrate:** opens with the inventory, extends Ambitions & Undertakings, absorbs the legacy template rather than duplicating it, and gives runtime counts. No unacknowledged duplication.

### Vision audit

**PASS-with-notes.**

- **North star:** world-side change that the player witnesses.
- **Core loop:** reuses the moment card, the Journey tab and the encounter pool. It feeds aftermath compounding.
- **Non-negotiables:** the god/protagonist separation holds, with mortals as the actors and no new player control. *Narrative over mechanical perfection* is confirmed.
- **Design tensions:** systemic emergence with authored payoff encounters and prose.
- **Taste profile:** prose-first, no counts shown, GM narration.

Notes:
- This plan's Vision section cites no Vision file by path. The premises are *the world does something next; the pleasure is witnessing* (`Vision/00-north-star.md`) and *consequences compound* (`Vision/01-core-loop.md`).
- The sovereignty-return channel (mortals answering the god) is not engaged, and does not need to be.
