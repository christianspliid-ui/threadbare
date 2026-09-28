# Brainstorm companion — faith and politics as world settings (THR-1632)

Companion to `Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md`. Written by the design lane, run 2026-09-28b.

## Vision premises in play

- **A world that starts alive** (the living-world map's destination): every system needs something to act on at t0. One world-wide temple and holy places off every culture's ground give the religious content line almost nothing to act on.
- **Christian's direction, 2026-09-26:** *"tunable for different scenarios … something that allows us to test and see balance and interaction."* The block is the tunability; the default is the most-contact world.
- **Graph purity:** territory is `controls`, never a second region kind. The fringe is a culture link, not territory, and stays out of the map that builds `controls`.
- **Game prose, sheet words:** "congregation", "fringe", "venerates" are words a player reads; no strength number reaches a screen.

## Alternatives considered

### Temple instances

| Option | Taken? | Why |
|---|---|---|
| New per-culture order definitions plus a heresy | No | decided against in [THR-1596](https://linear.app/threadbare/issue/THR-1596): new definitions with no content |
| `instanceCount` on the definition | No | the count depends on the world (living cultures), and each instance needs a seat and a culture; an instance plan passed at seeding carries both |
| Instances with a culture-id suffix (`faction_def_temple_of_spheres_culture_0`) | No | breaks the disposition and sheet regex `faction_def_(.+?)(?:_\d+)?$` |
| **Numeric-suffix instances, seat at the culture capital, halls on the heartland** | Yes | every `factionDefId` reader keeps working; congregations never take wild towns |
| Word "chapter" (as decided) | No | the glossary already uses it for the encounter reading unit; "congregation" is free |

### The congregation's sphere

The decision wrote the culture's first venerated sphere onto the congregation, and every write needs a reader. The Temple's join rule keys on a **Reach** (`joinPrerequisites: { star: 0.375 }`, typed `Partial<Record<ReachDomain, number>>`), so "join if you lean toward the sphere" would need a new gate kind: rejected as scope creep. Two readers remain: the faction page line, and the `sphereInfluence` of the holy places the floor adds. Honest limit: the sphere does not change who joins. A later design could add a sphere-alignment join gate; nobody asked for it yet.

### Holy-place floor

| Option | Taken? | Why |
|---|---|---|
| Re-sort placement so holy places are not cut first | No | changes every seed's settlement mix; the floor is about culture ground, which the sort does not know |
| Convert an existing hamlet to a shrine | No | deletes a settlement someone may live in |
| **Top-up after the loop, on the culture's heartland** | Yes | additive, counted the same way `belongs_to` is written, runs before Places, resources and roads so the new Location is complete |
| Count the floor on heartland + fringe | No | the fringe is written later, and a heartland holy place is the one the culture would plausibly hold |

### Culture outside the heartlands

| Option | Taken? | Why |
|---|---|---|
| Leave the frontier cultureless | No | half of all mortals have no culture, and the culture content line (THR-1635) never reaches half the towns |
| A "frontier" culture | No | a new culture kind with no content; the map forbids seeding kinds whose band has not shipped |
| Nearest culture at full membership, both layers | No | fakes history (conquest tension would read a historical layer) and inflates culture strength |
| **Nearest culture within 8 hexes, current layer only, half strength, flagged `fringe`** | Yes | people on the edge of a people still carry its ways; weaker, visibly partial, no false history |
| Fringe for ruins, lairs, wonders | No | ruins belong to dead empires (historical layer); lairs and wonders have no residents |

The 8-hex default copies the one existing "nearest settlement" range in worldgen (`WORLDGEN_FREEHOLD_SETTLEMENT_MAX_HEXES`). It is a guess the census will test; S1 reports how many settlements it reaches and how many stay out of range.

### Pilgrim routes

| Option | Taken? | Why |
|---|---|---|
| Retire `sacred_route` (edge, reader, pool, world-object class, three tests) | No | destructive; the reader is live and the pilgrimage encounter has nowhere else to fire at a town |
| Restore by designing a faith cell now | No | cells are the undertaking lane's design; filed as a deferral ([THR-1660](https://linear.app/threadbare/issue/THR-1660)) |
| Seed routes to holy places | No | pilgrimage encounters are already gated to shrine/temple subtypes, so a route to a holy place adds nothing |
| **Seed one route per congregation to its seat capital** | Yes | the capital, a town, gains the pilgrimage it could never host; one edge per culture; the edge kind and its reader already shipped |

### Town guilds

Stamping `factionType: 'guild'` alone would make town guilds indistinguishable from the six definition guilds by type. `factionClass` exists with a `'guild'` value and is written only for Realms, so town guilds take `factionClass: 'guild'`. The definition guilds are already told apart by `factionDefId`. Stamping the definition guilds `factionClass: 'order'` was considered and left out: nothing asks for it, and "order" misdescribes an adventurers' guild.

## Tensions

- **Testability vs meaning.** The default puts the most systems in contact, which is what Christian asked for; it is explicitly not a ruling on what faith *means* in the world. Every piece is a knob, and the all-"today" setting reproduces today's world.
- **Unheld ground vs a congregation in every culture.** Resolved by seating congregations on heartland capitals only; the kill criterion watches the unheld count.
- **Culture coverage vs cultural tension cost.** Fringe links wake `detectCulturalMismatch` at fringe towns. That is contact, which the direction wants; the kill line on tick cost watches it, and the fringe strength and range are the dials.

## Reader audit (fringe `belongs_to`)

26 non-test `src/engine` files read `belongs_to`. Summary of what a fringe link changes (full per-file list gathered this run):

- **Change on purpose:** NPC culture at seeding (`npcSeeding.ts:338-344`), births (`agentLifecycle.ts:555`), minted inhabitants (`binding/mintInhabitant.ts:205-207`), encounter support NPCs (`encounterSupportBundle.ts:61-68`), the settlement genome's culture pass (`settlementGenome/runGenome.ts:68-72`, `phaseSettlementReassessment.ts:53-55`), culture prose for the location (`proseResolvers.ts:158-186`), opening coloration (`openingColoration.ts:35-39`), cultural mismatch tension (`culturalTension.ts:128`), the hex culture panel (`hexZoom.ts:161-175`), MeetTheFirst's culture display (`graphQueries.ts:185` via `MeetTheFirstFlow.tsx:76`), and the world-past wonder finder's nearest-culture pool (`worldPast.ts:482-494`).
- **No change:** conquest tension (needs both layers), region history readers (`hexRegion.ts`, `historicalCulture.ts`, `ruins/elderRuinSeeding.ts`, `proseResolvers.ts:511,568,636`), actor-only readers.
- **Watch:** the cultural convergence mandate counts every `belongs_to` edge (`mandate.ts:100`) — a kill criterion; the debug spawn tool copies edge properties including `fringe` onto spawned nodes (`debugWorldSpawnTools.ts:297-309`), acceptable for a debug path.
- **None** treats a Location's culture as political ground, and none draws map borders from it.
