# THR-1155 slice 2, step 6 — the reporting surface

**2026-09-11 · Engine · Content · UI**

Slice 2 had built a political map that moves: Realms minted per domain, a border derived
from the towns they hold, conquest to move it, and courts to raise the armies that do the
moving. What it had not built was anything that **reports** it. The border said a nation
held a town and every other surface in the game said nothing, because nothing else read
the `controls` edge the border is projected from. This step closes both sides — the
writers, and the words.

## The participation tripwire, and what it caught

The projection is a cache keyed on `structuralCacheVersion`, so it has exactly one
failure mode: a writer that moves a faction `controls` edge and forgets `touchStructure`.
The fingerprint belt makes that *visible* — the next read rebuilds and traces
`reason: 'fingerprint'` instead of serving a stale border — but a belt is a diagnosis.
Something had to enumerate the writers.

`factionControls.participation.test.ts` does. The predicate is deliberately coarse: a
module qualifies as a **candidate** when it carries the `'controls'` literal *and* calls
`addEdge`, `retargetEdgeSource` or `removeEdge` — fourteen of them under `src/engine`.
Whether a given `removeEdge` can reach a `controls` edge is not decidable by reading the
line, so the test over-collects and then classifies, and an unclassified module fails
until someone says which kind it is. A narrower regex would have been precise about the
sites it happened to match and blind to the one nobody thought of.

**It found the one nobody thought of.** `lairEscalation`'s legendary tier upgrade calls
`seedMonsterFaction`, which mints a monster faction and writes faction → lair `controls`
— a faction-sourced edge, at run time, on a tick phase. The pass-level bump counted
cleared and reinfested lairs only. So a monster faction taking a lair left the border one
rebuild late, the belt firing, and the distance matrix and encounter cache blind to a new
faction holding ground.

Conquest was the *second* runtime writer of such an edge. This one predates the
projection entirely.

The arm is falsified, not watched: it primes the projection, drives the real
`phaseLairEscalation(state, runtime)`, and asserts `['version', 'version']`. With the
bump removed it reports `expected [ 'version', 'fingerprint' ] to deeply equal [
'version', 'version' ]` — a different value, not a missing one.

## The census, as an instrument

`census:seeded-world` gains a realm block, with the predicate and verdict split into
`scripts/realm-census.ts` (the script builds a world at import time, so a test importing
the predicate from it would run the whole census to ask one question; an entry guard would
not have helped — the npm script bundles with esbuild, which flattens one away).

Seed 42, medium, tick 0:

```
realms 3 / domains 3 · domain locations 40
  (held by their realm 33 · ceded to a definition faction 7 · unheld 0)
realm holdings: faction_0 17 · faction_1 10 · faction_2 6
realm census: OK — one realm per domain; every domain location held
```

`ceded 7` is not a defect and the verdict does not gate on it — it is the guild-hall
reconciliation, which drops a Realm's redundant edge where an authored faction keeps its
home so there is one holder per town for the `[0]?.source` readers. Worldgen reports
`realm edges dropped at guild halls 7` on the same run. Only a Location inside a domain
that **nobody** holds is a gap, and that count is 0.

The verdict is red-tested on the three cases worldgen does not produce: a domain with no
Realm, a held-by-nobody town, and — the one cardinality alone would miss — two Realms and
two domains that do not correspond.

## The words

`getLocationHolder` is the Realm's **point reader**, standing to `realmProjection` exactly
as `getHexRegionData` stands to `areaProjection`: the projection is the partition the map
draws, this is the one-place question a sheet asks. Both read the same edges, so they
cannot disagree — and that is asserted rather than assumed. A generated-world arm walks
every Location the projection reports a Realm holding and checks its sheet names the same
Realm: **33 checked, 0 disagreements.** It is the headless form of the browser Done-when,
holding over every settlement at once instead of the one a screenshot happens to show.

One `HeldByLine` primitive renders it, on the location profile and the hex chronicle. The
three parts the Done-when names, each for a reason: the **image** is the holder's own
sigil through `EntityVisual` (a name alone reads as metadata — Law 26/27); the **tooltip**
is the single `ui.held_by` registry entry, because *held by* is a concept learned once and
read everywhere (Laws 3/17); the **link** opens the holder's sheet, degrading to plain
text where a surface cannot route (Law 17/21, `EntityLink`'s load-bearing half).

**`Unclaimed` is a word, not a blank.** Ground no faction holds is a fact about the world
— it is why the border stops — so it gets a designed line rather than a vanished row
(Law 4). A place held by a guild reads the guild; the discriminator is `factionClass` on
the node, never the name and never the type, so the reconciliation's ceded towns report a
holder without the political map gaining one.

The chronicle's block is distinct from *Factions Present* below it, which lists everyone
with people on the hex. Presence is not title. Before this a hex could name four guilds
and never name the nation whose border it sat inside. It reads the **outer tier** only: a
`controls` edge points at a settlement, never at the tavern inside it, and without that
filter the line would read a sublocation's holder — reliably nobody — and print
*Unclaimed* over a town a Realm holds.

## The faction sheet renders a Realm

Two things it got wrong, both because a Realm's identity lives where the sheet was not
looking. The type chip renders `factionType` title-cased and a Realm's stored value is the
enum `'political'` — a raw key on a player surface (Law 14), and the wrong word besides;
the headword is **Realm**. And the court had no seat: `role: 'seat'` on one `controls`
edge is the same stamp conquest re-writes and the capital marker is drawn from, and the
sheet named it nowhere, so the one town on the map with a dot had nothing saying why.

The guild arm is what makes the Realm arm mean something — a guild whose definition
happens to say `political` is still a guild, and a sheet that special-cased on the *type*
would have called it a Realm.

## Rendered, on a generated world

```
LocationProfileModal — a Realm's seat
  ALLEGIANCE: Held by · hold of Witness Skyfield · seat of the court
LocationProfileModal — a town an authored faction holds
  ALLEGIANCE: Held by · The Temple of the Spheres
LocationProfileModal — ground no faction holds
  ALLEGIANCE: Held by · Unclaimed

FactionSheet — a Realm
  kind chip : Realm
  court chip: Court at Wraithwood
```

## Remaining

Slice 2's Done-when is complete. Slice 3 — `$area` / `$realm` sentinels, the realm rank
ladder through `factionReputation`, `FACTION_ENCOUNTER_META`, the canon and UL entries,
and the browser Done-when with a real conquest — carries `Fixes THR-1155`.
