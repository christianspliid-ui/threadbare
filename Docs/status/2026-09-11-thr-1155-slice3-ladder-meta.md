# THR-1155 slice 3, part 2 — the court ladder, climbable

**2026-09-11** · [THR-1155](https://linear.app/threadbare/issue/THR-1155) · slice 3 Done-when bullet 2

## What this closes

Slice 2 gave every Realm a court ladder — `REALM_RANK_LADDER`, *stranger · subject ·
yeoman · sworn · thane · counsel*, six rungs with thresholds, slots, access prefixes and
bonuses, minted into the definition by `buildRealmDefinition`. Every rung was real. None
was reachable.

Not for one reason but two, and they had to be closed together.

**One.** A Realm's definition is minted per world, so anything that walks a ladder has to
resolve it through `getFactionDefinition` rather than the static catalogue. Slice 2's
21-site sweep did that, but proved it on a *founded guild* — the THR-1322 path. This
ships the behavioural proof for a Realm on a generated world: a mortal sworn to a real
minted court climbs from `stranger` past `subject` to `sworn` at reputation 0.5, and
`meetsFactionRankRequirement` agrees they are a Sworn and not yet a Thane.

**Two, and the larger half.** `FACTION_ENCOUNTER_META` answers *which faction is this
encounter about* with a **static** `factionDefId`. A Realm is `realm.<cultureId>` over a
culture worldgen generated, so no static string can name one. A row that names no
resolvable definition does not fail loudly — every consumer of that table fails soft in
its own direction: the rank gate stands open, the reputation reward is skipped, the join
outcome returns false. Put together, no realm encounter could ever move a mortal up a
rung. The ladder would have been decoration.

## The shape, and the decision behind it

A meta row may now be **class-scoped**: it carries `factionClass: 'realm'`, parks
`CLASS_SCOPED_META_DEF_ID` in `factionDefId`, and the real answer comes from
`resolveMetaFactionDefId` (`src/engine/factionMetaScope.ts`).

The token is parked rather than left plausible on purpose. A site that forgets the
resolver must resolve to **nothing** — fail-soft and greppable — rather than to some
other faction whose id happened to look right.

**The rule, once:** *the Realm an encounter is about is the one the agent has standing
with; joining is how standing begins, so a would-be subject's Realm is the one whose
ground they stand on.* Both halves are one sentence because they are one question asked
at two moments, before and after the first oath. Membership alone cannot be the source —
nobody is a member of a court before they join it, and `realm.join` is precisely the row
that needs an answer then.

The ground half asks the **map** (`getLocationHolder`), never the agent's acquaintances —
the same argument slice 3 part 1 made for `$realm`. A Location's holder may be a guild,
an order or a monster faction (the guild-hall reconciliation alone cedes 7 of seed 42's
domain towns), and `isRealm` is read *there* rather than remembered at the call site. So
asking the map cannot return a non-Realm, where a filter bolted onto the town read would
be one that is one day forgotten — and what it would forget is the design: *the realm
that holds this town* must never quietly become *whoever holds this town*. Ground no
Realm holds binds nothing, which is the honest answer: there is no court there to be a
stranger to.

## The sweep

Nine agent-scoped read sites across five modules route through the resolver
(`encounterFilterPipeline` ×2, `factionOutcome` ×3, `factionRankBonus` ×2,
`factionReputation` ×2). The two **enumeration** sites hold a definition id and no agent,
so they ask `metaBelongsToDefinitionId` instead: an authored row matches one definition,
a class-scoped row matches *every* Realm — the content is authored once and the Realms
are minted per world.

Behaviour for the ~150 authored guild rows is unchanged **by construction**: the field is
absent on all of them and the resolver returns their id untouched. The one new negative
is the rank gate closing on a class-scoped row that resolves to nothing — tier-restricted
court work is not drawable where there is no court, which is the direction a gate may
fail.

`realm.join` and `realm.promotion` ship as the first two class-scoped rows. They are not
speculative: `buildRealmDefinition` already names them as every Realm's
`joinEncounterTemplateId` / `promotionEncounterTemplateId`, so the rows complete a promise
the shipped definition already makes. The templates are THR-1454's content; until they
exist the rows are inert, because every consumer looks the meta up *by template id*.

## Why a shape tripwire and not only behaviour

A re-introduced direct read of `meta.factionDefId` would pass every behavioural test in
the repo. Guild rows resolve to themselves either way, and a realm row read directly
resolves to nothing — so the symptom is not an exception but a court that quietly stops
paying standing, which is the exact failure this part exists to remove.
`src/data/__tests__/faction-encounter-meta.readsites.test.ts` asserts the shape over
`src/engine` and `src/data`, with the matcher deliberately coarse (any
`<something>meta.factionDefId`) for the reason slice 2's `controls` participation test
paid for: a narrower regex is precise about the sites that exist today and blind to the
one nobody thought of. It carries its own vacuous-probe guard — the corpus is pinned
large, the matcher is shown to fire on the resolver itself, and the comment-stripper is
shown not to fire on prose.

## Falsified, not watched

- Neuter the resolver's class branch → **4 of 9** arms go red, exactly the four asserting
  class-scoped resolution; the ladder, authored-row identity and non-vacuity arms stay
  green, because they do not depend on that branch.
- Make realm definitions unresolvable → **2 of 9** go red: the ladder walk and the
  non-vacuity arm. Its in-file control (a membership against an id no lookup answers,
  whose rank stays the stored `role` and never becomes a ladder word) stays green in both
  perturbations, which is what makes the ladder arm mean something.

The two signatures are complementary — no single perturbation reddens the whole file, so
neither half is riding on the other.

## One thing the checkpoint expected that was already done

Bullet 2's third part — *the takes / loses chronicle line fires on a seize* — is already
shipped and gated. `battleAftermath.ts:385` builds the line, `armyNotifications.ts:282`
carries it to the feed as a `realm_territory_change` event with both Realms and the
Location as `WorldRef`s, and `battleAftermath.conquest.test.ts` asserts both the trace
summary and the feed message (`Realm 0 takes Town 1 from Realm 1`). It landed inside slice
2's conquest work rather than waiting for slice 3. Nothing was owed and nothing was
written.

## Evidence

`npm test` 1224 files / 19978 tests green · `npm run test:heavy` 30 files / 202 tests
green · `check:typecheck` **OK 2878, unchanged from baseline** (baseline **not**
refreshed) · `npx vite build` green 14.52s · CLI smoke tick 30 / 486 agents / 61 events ·
`check:generated-freshness`, `check:wiki-freshness:blocking` and the typecheck ratchet all
re-run **last**, after the final closeout edit.

No UI-pillar file touched — the diff is `src/engine`, `src/data`, `src/types`, two test
files, two wiki pages and the interface map — so no browser-verify is owed.

## Remaining in slice 3

Bullets 3–5, unchanged: registry, canon (`world-objects.md`, `agents.md`, `rulebook.md`,
quick reference), the wiki's *Realms and Areas* section on `world-map-reference` with the
two projection modules in its `sources`, the UL entries per THR-1453, and the
interface-map rows for the projections and the sentinels (this part updated the rank-gate
contract it rerouted, not those) · the browser Done-when driving a real conquest through
`window.__DEBUG.conquerLocation` · then the close keyword.

**Note for the resuming run.** The `FACTION_ENCOUNTER_META` dynamic-def-id question the
previous checkpoint flagged is settled here, so realm content registers statically after
all — one row per template, class-scoped. THR-1454 authors `realm.join` and
`realm.promotion` against the two rows already in the table, and any further
`realm.quest.*` / `realm.senior.*` / `realm.elite.*` / `realm.leadership.*` rows take the
same shape; the prefixes are already the ones `REALM_RANK_ACCESS` unlocks per rung.
