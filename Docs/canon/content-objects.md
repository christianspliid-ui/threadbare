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
| **Item** | Arms, mounts, tomes, relics, tools, provisions — the possession catalog `reward_draw` already draws from by tag. | `item` | `check:attachment` |
| **Legendary artifact** | An item with its own trait graph, bonded rather than possessed. Three entries. | `legendary_artifact` | `check:attachment` |
| **Condition** | Wounds, diseases, strains; blessings and curses as signed conditions. Shared `trait` definition nodes, per-bearer state on the edge. | `condition` | `check:attachment` |
| **Power** | A god's gift (`bestowed`) and a spell a mortal learned (`spell`) — two classes of one kind (THR-1429), in two catalog shapes. | `power` | `check:attachment` |
| **Agreement** | A favour owed or a mark held — the template names a *relationship*, so the thing it becomes is an edge. | `agreement` | `check:attachment` |
| **Companion** | A face that walks with one mortal and grants small always-on bonuses; never an agent. Already tag-bearing. | `companion` | `check:attachment` |
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
- **`DealContextTag` is a card-context vocabulary, not a reach spelling.** Its twelve values (`might`, `finesse`, …) do not map onto the eight Reaches, and unifying it is chartered by defect evidence, not pre-planned. Slice 2 left it alone, as planned.
- **Items declare `sphereAffinity` and no catalog entry carries it** (0 of 134, measured THR-1485). Slice 2 retyped it `string` → `SphereName` as type hygiene and built **no** projection on it; items' sphere tags stay authored until the field has bearers — the verdict THR-477 reached for their reach.
- **An omen's sphere is nested and conditional** (`sphereTrigger.sphere`, on 6 of 44 tracks), so it is not the flat field a projection reads. A projection firing for a seventh of the kind would read as "no tags authored". Its **reach** is a different matter: it was authored on `censusTag.reach` and slice 2 moved all 44 onto the tag axis.
- **`censusTag` kept its `scale` half.** The plan called the whole field "metadata nothing reads"; measured, that is true of `reach` and false of `scale` — 132 of 193 literals carried scale and nothing else, `contentCensus/matrix.ts` reads it, and no other field in the corpus carries an entry-level scale. Retiring it would have taken the census from 193 entries to zero. The reach half is gone and `dominantReachFromEffects` with it.
- **`FACTORY_STRATEGIC_TEMPLATES` is legitimately empty** — the factory compiles packages on demand and ships none by default. Named in the contract test, so a *second* empty catalog fails.
- **`check:encounter` scopes to the `encounter.` prefix**, so most of the Encounter kind — every faction quest family, every social and tavern template — is ungated today despite the row showing a gate.

## The tag vocabulary

Seated by THR-1486 (slice 2). Registry: [`src/data/content-tags.ts`](../../src/data/content-tags.ts) · generated catalog: [`content-tag-catalog.generated.md`](../../.claude/skills/encounter-pipeline/reference/content-tag-catalog.generated.md) (`npm run generate-content-tag-catalog`).

**Five axes, two of them derived.** `reach` is generated from `REACH_DOMAINS` and `sphere` from `SPHERE_NAMES` — the vocabulary imports the unions rather than restating them, and each derived tag owes a description at compile time. `polarity` is `#positive` | `#negative`. `form` (what the thing *is*) and `family` (what class of story-object it belongs to, and what walk of life it comes from) are authored.

**`family` is the wide axis and knowingly so.** It holds both "what kind of object" (`#relic`, `#trinket`) and "what walk of life" (`#combat`, `#knowledge`, `#trade`). Those read as two ideas; the corpus treats them as one, because an entry carries `#weapon` *and* `#combat` rather than one instead of the other. Splitting them is a sixth axis, which is a design decision and was not slice 2's to take. **The axis is presentation and completeness, never query semantics** — the resolver matches tags, not axes — so a tag on the wrong axis is a legibility defect, cheap to correct.

**Projection beats authoring.** Where a kind's registry row names a `projections` field, the tag is derived from it at index time and never written by hand; `contentTags.test.ts` fails an authored tag that contradicts its projection. `effectiveTags(entry) = authored ∪ projected`.

**Adding a tag is a design-session decision**, recorded here. Seating one with no bearer ships a **DEAD** row in the generated catalog; writing one on an entry without seating it fails `contentTags.test.ts` and `check:attachment` by name.

**How the 153 spellings in the corpus became 96 seated tags** (the migration's rule, recorded so it is not re-derived): a spelling survived with **at least one runtime reader** — a `tagFilters` query site or a hardcoded read — **or** at least `CONTENT_TAG_MIN_BEARERS` (3) bearers across the catalogs. 16 bare spellings were rewritten with their `#`; 63 were removed from their entries; the rest moved onto the derived axes. Seven tags ship DEAD: six authored ones a query site asks for and nothing wears, one sphere the corpus has not reached. The ratchet ([`contentTagRetrofitPending.ts`](../../src/data/content-eval/contentTagRetrofitPending.ts)) is **empty**, which is what let the catalog-entry `tags` types tighten to `readonly ContentTag[]`.

## The content query

Landed by THR-1487 (slice 3). Types: [`src/types/contentQuery.ts`](../../src/types/contentQuery.ts) · resolver: [`src/engine/contentQuery.ts`](../../src/engine/contentQuery.ts) · catalog-backed views: [`src/engine/contentCatalogView.ts`](../../src/engine/contentCatalogView.ts).

**The rule: name content by kind and tags, never by literal id.** `{ kind: 'item_template', tags: ['#weapon', '#entropy'] }` is the shape. A literal id stays legal where an author genuinely means *that one thing*, and is gated; a query is what you write when any fitting thing will do — which is most of the time, and is what keeps content meaning something as the catalog grows.

**One resolver, and the gate calls it.** `resolveContentQuery` is the only matcher. `validateContentQueries` does not mirror it, it *calls* it — because a gate that re-states the runtime rule agrees only while someone keeps checking, which is the failure `rewardCategoryNodeQuery`'s own header has warned about since THR-1146.

**Matching, exactly.** `classes` narrows within a kind (a Power is `bestowed` or `spell`; a Condition is `condition` or `scar`). `tags` is ALL-of and `anyTags` is any-of, over `effectiveTags` — so the projection rule above applies to queries too. `tier` is an inclusive window, and **an entry with no declared tier passes every window** (the condition pool's rule since it was written; the alternative silently drops untiered content). Results are totally ordered: registry kind order, then id ascending.

**A resolve is uncapped; a draw is capped** at `CONTENT_QUERY_MAX_CANDIDATES` (64). A caller that weights the resolved set itself must see all of it.

**What a query deliberately cannot express: anything about the recipient.** Companions and agreements keep their own catalog filters, because "not at the companion cap" and "this unique is not already in the world" are facts about a bearer, not about content.

**Two views, and which one asks what.** The world view (`graphContentCatalogs`) answers from graph nodes, because that is where a running world holds items, conditions, powers and legendaries — including ones minted after seeding. The library view (`staticContentCatalogs`) answers from catalog literals. The *gate* uses neither: it asks over **the nodes the world seeds**, because the registry's item catalogs include `TREASURE_MAPS`, which nothing seeds — a recipe resolving only against those would read live and draw nothing.

**Where it runs today:** `reward_draw`, `step_reward_pool`, `condition_pool`, `debug`, and — since THR-1488 (slice 4) — `encounter_seed` and `undertaking_catalyst`.

**Encounters carry tags, and name their sequels by family (THR-1488).** `UnifiedActionTemplate.tags` holds the `form` / `family` words another piece of content finds this one by; `encounter_seed.query` and `StrategicActionTemplate.catalystQuery` are how a parent names its follow-up. Seventeen **family tags** are seated for encounters — the twelve faction quest lines plus `#tavern_night`, `#delve`, `#threshold_errand`, `#broker_errand`, `#craft_commission` — and each is a **game word, never an id spelling** (`#circle_errand`, not `#ac_quest`), because the word reaches the player through the withered-seed narrative event. A seed's query resolves at *fire* time rather than plant time, so a sequel owed twenty ticks out finds the family as it stands when it comes due.

**The measurement that closed the id-prefix era.** On 2026-09-12, of the 51 `encounterFamily` values the corpus authored, **41 matched no template at all**, and seven seeds named `templateId`s that do not exist — forty-eight kinds of promised follow-up withering on arrival, with no error anywhere. Undertaking catalysts were worse: all thirty-three literals spelled `encounter_<name>` where the corpus spells `encounter.<name>`, so none of them had ever resolved. The gates are what keep this from recurring: `check:encounter` is fatal on a dead seed `templateId` and on an empty seed `query` (advisory on a legacy prefix, which is the 41-family backlog, ratcheted), and `check:undertaking`'s `catalysts` block is fatal on both catalyst operands. The encounter gate has a corpus-wide vitest behind it because `check:encounter --all` sweeps `encounter.*` only and **every one of the seven fatal findings lived outside that prefix**.

**Ask before you author:** `await window.__DEBUG.queryContent({ kind, tags })`, or CLI `query {"kind":"item_template","tags":["#weapon"]}`. When a prize fails to arrive at runtime, read `content.query_empty` — it names the site and carries the whole query.

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
- ❌ **Gating one authoring route and assuming the other.** The reward gate walked `reward_draw` only — 1 recipe of the corpus's 482 — while the step route carried 481 and shipped unchecked for as long as both existed. A gate that sees one of several authoring surfaces reports green about the ones it cannot see; when a capability has two routes, sweep both or the gate is theatre (THR-1487; the sixteen recipes it found are THR-1496).
- ❌ **Narrowing node-property `tags` to the vocabulary.** Saved worlds carry arbitrary strings; the closed vocabulary binds *catalog literals*, never the property bag.

## Reading it from the game

- CLI: `content` (every kind with its catalog size), `content <kind>` (prefixes, per-catalog splits, the note).
- Browser: `await window.__DEBUG.getContentObjects()`.
- Both read the catalogs and not the world, so the numbers are identical on every seed and at every tick. A stable number is the design, not a stale read.
- **The query levers read the opposite way** — CLI `query <json>` and `await window.__DEBUG.queryContent(query)` read the *live world*, so a prize minted three ticks ago is a candidate and a template the world never seeded is not. That is the question you have when a `content.query_empty` trace has just fired.

## Stale sources to avoid

- Any plan-doc statement that the registry's `catalog` field is a single `{ module, exports }` — it is a `catalogs` **array** of `{ module, export }`, because items come from four modules and conditions from three.
- Any statement that the registry's `surface` column is filled — it is `{ card: null, sheet: null }` for every kind until THR-1482 slice 2.
- Any statement that `requiredAxes` is empty — slice 2 populated it for the six attachment kinds from *measured* coverage (an axis is required only where every entry of the kind already carries it, so the column can only grow and never ships red).
- Any plan-doc statement that `censusTag` is retired outright, or that the item sphere tag is projected from `sphereAffinity`. Both are corrected above.
