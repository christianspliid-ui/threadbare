# THR-1155 slice 3, part 1 — the two sentinels

**2026-09-11 · Engine**

Slice 2 finished with a world that has nations in it: Realms minted per domain, a border
derived from the towns they hold, conquest to move it, courts to raise the armies that do
the moving, and surfaces that report all of it. What authored content still could not do
was **name** one.

A Realm's faction node is minted per world, and its definition id is `realm.<cultureId>`
over a *generated* culture. So neither of the two forms that reach every committed
order — a literal node id, or `$faction:<defId>` — can reach a nation. The realm content
the Encounter Factory is about to write (a court summons, a border levy, a tithe
demanded) needs to say *the realm that holds this town* without knowing either string.
`$realm` is that sentence.

## It resolves from the map, not from the town

`$here` gives the Location, the Location gives its hex, and the hex gives the nation out
of the same `realmProjection` the border mesh draws. The plan's rule for this slice is
that if the map and `$realm` can ever disagree, there are two projections and one of them
is wrong; there is one, and it lives on `SimulationRuntime`.

Reading the Location's *holder* instead would have been one line shorter and wrong in a
specific way. A holder may be a guild, an order or a monster faction — the guild-hall
reconciliation alone cedes 7 of seed 42's domain towns — and the projection contains
Realms only. So asking the map **cannot** return a non-Realm, where asking the town would
need a `factionClass` filter bolted on to be safe. A filter that is merely remembered is a
filter that is one day forgotten, and the thing it would one day forget is the design:
*the realm that holds this town* must never quietly become *whoever holds this town*, or a
tithe demanded by a nation is demanded by a thieves' guild.

On ground no Realm claims, `$realm` binds **nothing**. That refusal is the feature.

## The agreement, over a generated world

The unit arms use a fixture, and a fixture can only show that the binder does what the
fixture was built to let it do. The arm that carries the weight builds a real seed-42
medium world, walks every town the projection reports a Realm holding, stands a probe
agent in it, and asks the binder what `$realm` is there:

```
33 of 33 Realm-held towns — sentinel and map name the same nation, 0 disagreements
```

That is the same population slice 2's projection-vs-point-reader arm walks, so the
sentinel has joined an agreement that already held between two readers rather than
starting a third opinion.

**Falsified, not watched.** With `resolveSceneRealm` neutered to `return null`, four arms
go red — the two binding arms, the trace arm, and the generated-world agreement — while
the guild, kind-gate and unclaimed-ground arms stay green, because those assert *unbound*
and unbound is exactly what the perturbation produces. Two of the arms are falsifiers by
construction: the **guild falsifier** holds the same town under a guild and requires the
sentinel to stay unbound (without it, every other assertion here would pass on a binder
that resolved *whoever holds this town*), and the **kind falsifier** puts `$realm` on an
agent field, so the faction gate is doing work rather than being implied by a fixture that
only ever offers faction fields.

## `$area` binds nothing, on purpose — and that is the finding

The plan expected `$area` to bind in the binder beside `$realm`. It cannot, and the reason
is worth recording rather than working around: **no field in the
`EncounterAftermathReactionEffect` union takes an Area.** Enumerated across the whole
union, every node-id field on it names an agent, a faction, a location, a sublocation, an
ascendant or a template. Registering a new field for a sentinel nothing consumes would be
dead code wearing a design's clothes.

So `$area` ships registered and refusing, which is strictly better than the alternative
and is not a compromise. **Unregistered, `'$area'` is not a sentinel** — the binder skips
it before the trace and passes the literal seven-character string downstream to be read as
a node id. That is authored, typed, present and dead: the exact silent failure THR-1446
built this vocabulary's gate to end, and the failure `$actor` suffered for a year.
Registered, the binder *consumes* it, the trace says `UNRESOLVED`, and the authoring gate
names the surface that does answer — a chip anchor, whose `visualKind` gained `'area'` in
slice 1 for precisely this.

The arm that holds this is the consumption arm, not the "leaves the field in place" arm.
Removing `$area` from the binder's sentinel set leaves the second arm green and reds only
the first — which is the belt-and-braces trap in miniature, and why the trace assertion is
where the gate actually lives.

## Two things the plan assumed that are not on `main`

- **There is no THR-1446 interface-map row to extend.** § Interface impact says the
  sentinels *extend the row THR-1446 registers*; `scripts/interface-contracts.ts` and
  `Docs/canon/interface-map.md` both carry no sentinel contract at all — THR-1446
  registered none. Left to slice 3's bullet 3, which owns the interface-map rows and can
  decide the question for the projections and the sentinels together rather than having
  this part invent a contract row on the side.
- **`sceneSentinels.ts` was outside the wiki gate.** THR-1446 extracted the vocabulary
  from `encounterAftermath.ts` into its own module, but `encounters-manual-reference`'s
  `sources` still name only `src/engine/encounter*.ts` — so an edit to the table that *is*
  the authority would not have tripped the freshness gate. Added to the manifest here.

## Evidence

`npm test` 1222 files / 19966 tests green · `npm run test:heavy` 30 files / 202 tests
green · `check:typecheck` **OK 2878, unchanged from baseline** (no net-new errors, baseline
not refreshed) · `npx vite build` green 13.34s · CLI smoke tick 30 / 486 agents / 61
events · `check:encounter --all` OK · `check:chip-anchors` 697 templates, 0 failing ·
`check:generated-freshness`, `check:wiki-freshness:blocking` and `check:impediment-ids`
run last, after the final closeout edit.

No UI-pillar file touched — the diff is `src/engine/sceneSentinels.ts`,
`src/engine/encounterAftermath.ts` and one new test — so no browser-verify is owed.

The close keyword for THR-1155 rides the last part of slice 3; this ticket stays In Dev.
