# Content objects — the catalogue of things an author writes

> **Step 0 for any work that adds, names, targets or retires a kind of authored content** — a new template type, a catalog, a content-to-content reference, a gate over authored entries. The generated companion, [`content-objects.generated.md`](content-objects.generated.md), is the current census; this page is what the kinds *mean* and how to change them. Sibling of [`world-objects.md`](world-objects.md). Plan doc: [`Docs/plans/2026-09-12-thr-1481-content-model.md`](../plans/2026-09-12-thr-1481-content-model.md); seated by THR-1485 (slice 1 of THR-1481).

**Status:** live · **Owner:** Content · **Registry:** [`src/data/content-objects.ts`](../../src/data/content-objects.ts) · **Loader:** [`src/data/contentCatalogs.ts`](../../src/data/contentCatalogs.ts) · **UL:** [Encounters.md](../ubiquitous-language/Encounters.md)

## The rule

A **content object** is a kind of thing a person writes into a catalog. A **world object** is a kind of thing the engine mints into the world. They are two registries because they answer different questions — *what may I author?* versus *what is out there?* — and `instantiatesAs` is the one-way join between them: an `item_template` becomes an `item` when something grants it; a `nudge_card` becomes nothing at all, because a card is played and spent.

The registry exists because content references content **by literal id**, and literal ids rot. 67 of 115 reveal families matched zero templates before THR-844 aliased them; undertaking `catalystEncounterIds` spell `encounter_` where the corpus spells `encounter.`, so none can resolve. The fix (THR-1481) is to name content *by kind and tags* instead — and that needs one place that says what the kinds are. This page is that place; the tags themselves arrive in slice 2.

**Slice 1 adds no behaviour.** Nothing in the engine reads the registry yet. It is a vocabulary plus its guards.

## The catalogue

| Kind | What it is | Becomes | Gate |
|---|---|---|---|
| **Encounter** | The curated chapter a mortal walks into — authored branching encounters and systemic linear templates, one `UnifiedActionTemplate` format. | `encounter_template` | `check:encounter` (scoped to the `encounter.` prefix only) |
| **Action** | The verbs the player and the world *play* rather than walk into — divine interventions, hex workings, location and artifact verbs, thread cards. Same shape as an Encounter; the difference is who acts. | `action_template` | — |
| **Undertaking** | A multi-tick work a mortal commits to: the seven authored packs, the factory's compiled output, and the synthesised cells (verb × object type) that superseded the packs under the `cells` model. | `undertaking` | `check:undertaking` |
| **Item** | Arms, mounts, tomes, relics, tools, provisions — the possession catalog `reward_draw` already draws from by tag. | `item` | — |
| **Legendary artifact** | An item with its own trait graph, bonded rather than possessed. Three entries. | `legendary_artifact` | — |
| **Condition** | Wounds, diseases, strains; blessings and curses as signed conditions. Shared `trait` definition nodes, per-bearer state on the edge. | `condition` | — |
| **Power** | A god's gift (`bestowed`) and a spell a mortal learned (`spell`) — two classes of one kind (THR-1429), in two catalog shapes. | `power` | — |
| **Agreement** | A favour owed or a mark held — the template names a *relationship*, so the thing it becomes is an edge. | `agreement` | — |
| **Companion** | A face that walks with one mortal and grants small always-on bonuses; never an agent. Already tag-bearing. | `companion` | — |
| **Ambition** | What a mortal wants, and the shape of the work it offers. Three catalogs by provenance — seeded, grown from a grievance, minted by an event — which is not a kind distinction. | `ambition` | — |
| **Omen** | A track of signs the world shows before something breaks. Becomes nothing: an omen is pressure the doom clock reads, never an object a mortal holds. | _(nothing)_ | — |
| **Card** | The god's repertoire — what a player may commit to a step to lean a roll. Becomes nothing: a card is played and spent. | _(nothing)_ | — |

Live counts, per-catalog splits and the drift verdict are in the [generated companion](content-objects.generated.md), never here — a count in a hand page is a snapshot that rots.

## The three guards

The world-object trio, one shape lighter (there is no write-time guard, because content is authored rather than minted — a bad entry fails the build, never the tick loop).

1. **Contract test** — [`src/data/__tests__/contentObjects.test.ts`](../../src/data/__tests__/contentObjects.test.ts). Every catalog id is claimed by a kind; a shared catalog's kinds have disjoint prefixes; a shared prefix is declared with a reason; every catalog module + export exists and is wired into the loader *both ways*; `owningSystem` is a verbatim subsystem name; `instantiatesAs` is a registered world-object kind; every `content`-status world-object row points back at a content kind; every projection names a field entries actually carry.
2. **Generator** — `npm run generate-content-objects`, `--check` under `check:generated-freshness`. Renders the census and fails on an **UNCLAIMED** id or an **EMPTY** kind. Ungated kinds are *counted, not fatal* — 10 of 12 today, and closing that is what the later slices are judged by. It boots no world (~1s), which is why it can afford to be blocking where its world-object sibling (~40s) is expensive.
3. **The one-PR rule** — adding a content kind is a **registry row + a UL term + a row on this page**, in one PR. The generator fails by name on a row whose catalog does not resolve, so a half-added kind cannot land quietly.

## Known seams

Recorded rather than fixed, so the next author does not rediscover them.

- **Prefixes are claimed for totality, not owned.** The plan asked that every id prefix be claimed by exactly one row. True of nine kinds, false of three: `anomaly_spore_*` names an item, a power *and* a condition, and `anomaly_crystal_*` names two. The ids were never built to discriminate. So: the **catalog** decides where the prefix cannot, the **prefix** decides where the catalog is pooled (the Encounter/Action split of `UNIFIED_ACTION_TEMPLATES`), and one of the two must always decide. The three genuinely shared prefixes — `reward_`, `starter_`, `anomaly_` — are declared in `SHARED_ID_PREFIXES` with their reasons; an *undeclared* collision fails.
- **`DealContextTag` is a card-context vocabulary, not a reach spelling.** Its twelve values (`might`, `finesse`, …) do not map onto the eight Reaches, and unifying it is chartered by defect evidence, not pre-planned. Slice 2 leaves it alone.
- **Items declare `sphereAffinity` and no catalog entry carries it** (0 of 134, measured THR-1485). The plan expected to project the item sphere tag from that field and retype it in slice 2; there is nothing to retype. Items' sphere tags stay authored until the field has bearers — the verdict THR-477 reached for their reach.
- **An omen's sphere is nested and conditional** (`sphereTrigger.sphere`, on 6 of 44 tracks), so it is not the flat field a projection reads. A projection firing for a seventh of the kind would read as "no tags authored".
- **`FACTORY_STRATEGIC_TEMPLATES` is legitimately empty** — the factory compiles packages on demand and ships none by default. Named in the contract test, so a *second* empty catalog fails.
- **`check:encounter` scopes to the `encounter.` prefix**, so most of the Encounter kind — every faction quest family, every social and tavern template — is ungated today despite the row showing a gate.

## Adding a kind

1. A row in [`src/data/content-objects.ts`](../../src/data/content-objects.ts): `gameWord` (the word the game uses, not a code identifier), `ulTerm`, `idPrefixes` covering every id in its catalogs, `catalogs`, `instantiatesAs` (or `null`, deliberately), `gate` (or `null`), `owningSystem` **verbatim** from `scripts/subsystems-registry.ts`, `status`, and a `note` that records the decision.
2. A matching entry in [`src/data/contentCatalogs.ts`](../../src/data/contentCatalogs.ts) — the static import that turns the ref into entries. The contract test pins both directions, so neither half can drift.
3. A UL term in the owning shard, and a row in the table above.
4. `npm run generate-content-objects` and commit both outputs.

If the new kind's ids collide with an existing kind's prefixes, either narrow the prefix or declare the share in `SHARED_ID_PREFIXES` with the reason — and give the two kinds separate catalogs, since the catalog is then the only thing that decides.

## Rejected approaches

- ❌ **Free-string tags.** The five existing dialects with no const, no union and no lint are exactly why content cannot be named by tag today. Slice 2's vocabulary is closed.
- ❌ **Id-prefix families as the reference mechanism.** `encounterFamily` prefix-matching is the literal-id rot this model replaces; it survives one release as an alias table, then goes.
- ❌ **Per-kind gates.** Twelve bespoke validators would drift against each other. Gates call the shared resolver (slice 3), so gate and engine cannot disagree.
- ❌ **Narrowing node-property `tags` to the vocabulary.** Saved worlds carry arbitrary strings; the closed vocabulary binds *catalog literals*, never the property bag.

## Reading it from the game

- CLI: `content` (every kind with its catalog size), `content <kind>` (prefixes, per-catalog splits, the note).
- Browser: `await window.__DEBUG.getContentObjects()`.
- Both read the catalogs and not the world, so the numbers are identical on every seed and at every tick. A stable number is the design, not a stale read.

## Stale sources to avoid

- Any plan-doc statement that the registry's `catalog` field is a single `{ module, exports }` — it is a `catalogs` **array** of `{ module, export }`, because items come from four modules and conditions from three.
- Any statement that the registry's `surface` column is filled — it is `{ card: null, sheet: null }` for every kind until THR-1482 slice 2.
- `requiredAxes` and `projections` are near-empty by design in slice 1; the vocabulary that gives them meaning is slice 2.
