# THR-1155 slice 2, part 2 — the Realm mint

**Date:** 2026-09-11 · **Issue:** [THR-1155](https://linear.app/threadbare/issue/THR-1155) · **Plan:** `Docs/plans/2026-09-10-thr-1155-realms-and-areas.md` · **Pillars:** Engine · Content

`Fixes THR-1155` deliberately does **not** ride this PR — it rides slice 3.

## What a nation was, and is

A nation used to be one of two or three factions rolled out of a six-name list
(`FACTION_NAMES`), holding whatever Locations a round-robin over the location array
handed it — *the first faction controls the first location, etc.* Nothing about it was
addressable: it carried no `factionDefId`, so `factionAmbitions`, `factionQuestGeneration`,
`factionReputation`, `factionRankBonus` and the encounter gates all skipped it by
construction, and its territory said nothing about who lived on the ground.

Now worldgen mints **one Realm per culture domain**. A Realm is not a new kind of thing —
it is the `actor · actorType: 'faction'` node the generic factions already were,
distinguished by `factionClass: 'realm'` and carrying a *dynamic* faction definition
(`realm.<cultureId>`) written into `GameState.dynamicFactionDefinitions` at worldgen,
through the same THR-1322 door a run-founded order uses. Never into the static
`FACTION_DEFINITIONS` catalogue: that map is what the game *ships with*, and a Realm is
what a *world* has.

- **Its name is the map's name.** `generateDomainName` moved out of `regionPolitical.ts`
  into `src/data/realm-content.ts` as `generateRealmName`, and both the Realm mint and
  the domain label the border draws call it. One generator, so the nation in the graph
  and the words over its ground cannot drift.
- **Its territory is written by culture, once.** A `controls` edge to every Location
  inside its domain. Ground outside every domain is held by nobody — measured on seed 42
  medium, 3 Realms holding 17 / 10 / 6 towns, and the rest of the map genuinely unheld.
  Wilderness is real, which is what makes the projection slice 2 builds next mean
  something.
- **Its seat is edge-internal data** — `role: 'seat'` on one of those `controls` edges,
  chosen by `stampRealmSeat` (`src/engine/realmSeat.ts`): the settlement on the domain's
  capital hex, else the most town-like holding, ties on the lowest id.
- **Its court ladder** is `REALM_RANK_LADDER` — *stranger · subject · yeoman · sworn ·
  thane · counsel*. Six slots where a guild has four, in the same `FactionRankTier`
  shape, so `factionReputation`'s rank walk and every `Respected+` gate read it
  unchanged. (*Freeholder* was the first draft's third rank and is rejected: *Freehold*
  is the `owns` edge's word, THR-1314.)

`FACTION_COUNT`, `FACTION_NAMES`, the round-robin and `WORLDGEN_TERRITORY_MODE` are all
deleted.

## The acted-on test, measured

150-tick CLI run, seed 42 medium, after the mint:

```
faction_0 "hold of Witness Skyfield"   holds=17  pursues=1  resource_acquisition
faction_1 "march of Shadow-Kept light" holds=10  pursues=1  territorial_expansion
faction_2 "sovereignty of Open Earth"  holds=6   pursues=1  defensive_consolidation
```

All three Realms hold an ambition. One of them holds `territorial_expansion`, which is
the gate the plan predicted would open — `EXPANSION_PROSPERITY_THRESHOLD` is derived from
held settlements, and a faction with no definition never reached the scorer at all.

**The half that does not yet fire, with its cause.** No Realm fields an army and none
commissions a quest in 150 ticks, and neither is a resolution failure:

- **Armies:** `isEligibleForArmySpawn` requires `selectCommander`, which picks the
  highest-Iron **member** of the faction. A Realm has no `member_of` edges — nobody is
  seeded as its subject, because `npcSeeding` assigns membership from
  `buildDataDrivenFactionLocationMap(graph, factionDefIds)`, which enumerates the
  *static-definition* factions and so cannot see a Realm. This is a finding the plan did
  not foresee and it is the next thing the acted-on Done-when needs; recorded here rather
  than fixed inside the mint commit.
- **Quests:** the realm definition ships `questTemplateIds: []` on purpose — realm
  encounter content is THR-1454's, filed at handoff. The gates read the
  `realm.quest.` / `realm.senior.` / `realm.elite.` / `realm.leadership.` prefixes the
  moment templates carrying them exist.

## The declared rng re-pin

The mint drops the count roll and the per-faction name roll, and mints per domain (2–4)
rather than the rolled 2–3, so the stream after it shifts on most seeds. This is the
one-time, in-the-open re-pin the plan declared — not a shim that burns legacy draws to
hold a stream that only existed because the old mint was there. NFP #3 is *same seed +
same inputs → same outputs across runs*, which holds.

**No committed snapshot test pinned a post-mint value**, so `npm test` and
`npm run test:heavy` are green without edits. The pinned artifacts that *did* change are
the generated census pages, and they are the full list:

| Artifact | What moved |
|---|---|
| `Docs/canon/world-objects.generated.md` | faction 106→107, location 569→567, place 1761→1780, route 69→70, mortal 1147→1133, army 11→9, companion 1→0 (LIVE→DORMANT), item 295→289, holding 11→2, power 69→70, condition 144→142, agreement 6→7, standing 216→189, ambition 46→50, event 153→139 |
| `public/world-objects-reference.html` | the same census, same numbers |
| `Docs/canon/interface-map.generated.md` | production-hit counts +1 on three contracts (the new `realm-content.ts` module) |

`companion 1→0` and `holding 11→2` are the largest relative moves and both are stream
shift, not regression: `seedFreeholds` grants by spotlight mortal, leading reach and
place class, none of which this change touches. From this commit the pin holds unchanged
for the rest of slice 2 and all of slice 3.

## One deviation, recorded with its measurement

`retargetTerritoryByProvince` used to do three things: prefer a same-culture
definition-faction home within `WORLDGEN_TERRITORY_MAX_HEXES` (10), round-robin the
remainder over the culture list, and drop an edge made redundant by a guild's own home
edge. The first two existed because the holder they moved ground *away from* was a
nameless generic faction — moving a town to a guild at least gave it a holder that meant
something.

Measured after the mint, that 10-hex reach took **37 of the 40** Locations inside a
domain, leaving the three Realms holding three towns between them: a merchants' guild
holding a kingdom. So the pass keeps only its third job — a definition faction's **home**
Location is the guild's, and the Realm's redundant edge there is dropped (with a re-seat
if that town was the Realm's seat). One holder per town, which is what the
`getIncomingEdges(loc, 'controls')[0]?.source` readers need (THR-1297).

This is a technical verdict inside an already-agreed design, not a design change: the
plan's § Engine B says territory is written by domain and the Realm is the political
holder; the proximity reach was machinery for the thing the Realm replaces.

## Evidence

`npm test` 1214 files / 19875 tests green · `npm run test:heavy` 30 files / 202 tests
green · `npm run check:typecheck` OK 2905 unchanged (baseline **not** refreshed) ·
`npx vite build` green · CLI smoke tick 30 / 488 agents / 67 events ·
`check:generated-freshness` OK · `check:wiki-freshness:blocking` OK 26 pages — all three
tree-diffing gates re-run **last**, after the final closeout edit.

New tests: `src/engine/__tests__/worldSeed.realms.test.ts`, seven arms on a **generated**
world (never a fixture — that domains exist, that Locations fall inside them, and that
the definitions reach the lookup are all properties of real worldgen, and a fixture would
have had to invent all three). It carries its own non-vacuity arm (a medium world seats
≥2 cultures, so an empty realm set fails before anything else is asserted) and one arm
that falsifies the old shape directly: *some* place-tier Location is unheld, which the
round-robin made impossible.

No UI-pillar file touched, so no browser-verify owed. `public/run-lifecycle-reference.html`
carries the change rather than an exemption line — a nation becoming a first-class faction
is not behaviour-neutral.

## Remaining in slice 2

1. **`realmProjection`** on `SimulationRuntime` with the fingerprint belt; `BorderMesh`,
   `CapitalMarkers` and the realm label tier re-pointed; the province tier no longer
   drawn; the setter-less `regionData` state finally goes.
2. **Conquest** — `applyPowerVacuum` → `applyConquestOrVacuum`, `runtime?` threaded
   through the four war signatures, the four dead `controlled_by` reads swept onto
   `controls` (do **not** register the type — it is a fixture-only phantom).
3. **Realm membership** — the finding above: without `member_of` edges a Realm cannot
   field an army, so the acted-on Done-when's second half is unreachable.
4. The participation test, the census assertion, and the faction-sheet / chronicle
   *held by* lines.
