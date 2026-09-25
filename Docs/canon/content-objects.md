# Content objects — the catalogue of things an author writes

> **Step 0 for any work that adds, names, targets or retires a kind of authored content** — a new template type, a catalog, a content-to-content reference, a gate over authored entries. The generated companion, [`content-objects.generated.md`](content-objects.generated.md), is the current census; this page is what the kinds *mean* and how to change them. Sibling of [`world-objects.md`](world-objects.md). Plan doc: [`Docs/plans/2026-09-12-thr-1481-content-model.md`](../plans/2026-09-12-thr-1481-content-model.md); seated by THR-1485 (slice 1 of THR-1481).

**Status:** live · **Owner:** Content · **Registry:** [`src/data/content-objects.ts`](../../src/data/content-objects.ts) · **Loader:** [`src/data/contentCatalogs.ts`](../../src/data/contentCatalogs.ts) · **UL:** [Encounters.md](../ubiquitous-language/Encounters.md) · **Last-reviewed:** 2026-09-13 (THR-1489, slice 5)

## Census — 2026-09-13

`npm run check:content-model-census -- --ticks 200 --seed 42 --map medium`, the weekly hygiene routine's measurement. **The numbers are a baseline to move against, not a target.**

| Measure | 2026-09-13 |
|---|---|
| Live tags / DEAD tags | 106 / 7 |
| DEAD | `#blackmail_evidence` `#community` `#contraband` `#light` `#military` `#stewardship` `#supply` |
| Query sites live over 200 ticks | `step_reward_pool` (8 resolutions) |
| Query sites silent | `reward_draw` · `encounter_seed` · `undertaking_catalyst` · `condition_pool` |

**Movement since (2026-09-18, THR-1501):** the six `family` tags in that DEAD row — `#blackmail_evidence` `#community` `#contraband` `#military` `#stewardship` `#supply` — were **sunset**. THR-1496 had repointed their only query sites (the four army reward recipes) at live content, leaving them asked for by nothing and worn by nothing, which is the sunset rule's own deletion predicate. The DEAD set is now `#light` alone — a derived sphere word, never deletable — and the seating test in [`contentTags.test.ts`](../../src/data/__tests__/contentTags.test.ts) no longer carries a reader-only allowlist: a seated authored tag with no bearer fails it outright. If the army-logistics fictions are ever given purpose-built bearers, re-seating a tag is one row in [`content-tags.ts`](../../src/data/content-tags.ts) plus the bearer that earns it.

**Read the silence carefully — the four sites are silent for three different reasons.**

- `undertaking_catalyst` was **unreachable**, not unauthored: 35 templates carried `catalystQuery` and every one was a legacy-arm pack, which `UNDERTAKING_MODEL: 'cells'` does not walk. [THR-1497](https://linear.app/threadbare/issue/THR-1497) (2026-09-16) put the catalyst on the cell (`UNDERTAKING_CELL_CATALYSTS`, eleven cells) and made the seeding site trace a catalyst seed at its own site — it had traced every seed as `encounter_seed`, so the site was registered and never emitted. Measured after: seed 42 / 200 ticks, 6 catalyst seeds spawned an errand. The census's 2000-entry ring still evicts mid-run firings, so read the site's row with `--ticks` lowered before calling it silent.
- `encounter_seed` and `reward_draw` are **authored but unreached on this seed** — a seed resolves when it comes due, and 200 ticks of one seeded world is a small sample of the corpus.
- The trace buffer is a **2000-entry ring**, so a site that fired only in the opening ticks reads as silent at tick 200. The bias is toward over-reporting death; lower `--ticks` to separate *alive-but-early* from *actually silent*.

### Census — 2026-09-18 (THR-1514: seeding sites counted off state)

The 2026-09-13 numbers above were read off the ring once at tick 200, and a seeded medium run emits ~51,000 traces over 200 ticks — so that one read saw the last 2,000 and undercounted the seeding sites to silence. [THR-1514](https://linear.app/threadbare/issue/THR-1514) counts `encounter_seed` and `undertaking_catalyst` off `state.tickEvents` (one row per seed that spawned or withered, via `scripts/seed-consumption-ledger.ts`) and labels every other row `ring` — a floor, harvested after every tick on the monotonic emit counter. Same command, same seed:

| Site | Resolved / Empty | Source | 2026-09-13 read |
|---|---|---|---|
| `encounter_seed` | 21 / 18 | state | silent |
| `undertaking_catalyst` | 3 / 6 | state | silent |
| `step_reward_pool` | live | ring (floor) | 8 |
| `reward_draw` · `condition_pool` | 0 / 0 | ring (floor) | silent |

112 seeds observed, 59 spawned, 44 withered, 2 orphaned, 7 pending at tick 200, **0 left the pool unexplained**. A `state` silence is exact; a `ring` silence still wants the `--ticks` check. The independent recount that certifies these rows is in [`Docs/status/2026-09-18-thr-1514.md`](../status/2026-09-18-thr-1514.md).

A DEAD tag is a query nothing can answer: the author gets an empty pool and no error. The retro either finds it a bearer or deletes it ([`CONTENT_TAG_DEAD_BEARERS`](../../src/data/content-eval/packetDice.ts)).

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
| **Trait** | A mortal's own identity — Core continua poles, emergent personality poles, masteries, reputations, and the cultural marks a guild or a people stamps on its own. Five classes, five id prefixes, the five mortal-trait content files (THR-1520). Conditions and scars are the Condition kind even where they share a file; `innate` / `destiny` / `experience` are minted, never authored. | `trait` | `check:attachment` |
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
- **The economic trait file is shared between Trait and Condition** (THR-1520) and partitioned by prefix — `trait.mastery.` / `trait.cultural.` / `trait.reputation.` are Trait's, `trait.scar.` / `trait.condition.` are Condition's — the encounter/action pattern, pinned by `traitCatalogsSeated.test.ts`. The split follows the `subcategory` the file already authors; the registry invented no discriminator.
- **Trait routes to no codex sheet.** The codex's `conditions` rail reads `subcategory: condition` and nothing reads `mastery`, `reputation`, `core`, `personality` or `cultural`; a trait is met on its bearer's sheet. The surface row records it as *withheld for want of a shelf, not by ruling* — chartering one is a design decision.
- **Only `instantiateReward`'s clones are carved out of the world view** (THR-1520). Freeholds are `type: 'artifact'` tagged `#holding` and remain by-type candidates of `item_template`; a possession draw could in principle deal a clone of a freehold. Recorded for the world-objects owner, not widened here.

## The tag vocabulary

Seated by THR-1486 (slice 2). Registry: [`src/data/content-tags.ts`](../../src/data/content-tags.ts) · generated catalog: [`content-tag-catalog.generated.md`](../../.claude/skills/encounter-pipeline/reference/content-tag-catalog.generated.md) (`npm run generate-content-tag-catalog`).

**Five axes, two of them derived.** `reach` is generated from `REACH_DOMAINS` and `sphere` from `SPHERE_NAMES` — the vocabulary imports the unions rather than restating them, and each derived tag owes a description at compile time. `polarity` is `#positive` | `#negative`. `form` (what the thing *is*) and `family` (what class of story-object it belongs to, and what walk of life it comes from) are authored.

**`family` is the wide axis and knowingly so.** It holds both "what kind of object" (`#relic`, `#trinket`) and "what walk of life" (`#combat`, `#knowledge`, `#trade`). Those read as two ideas; the corpus treats them as one, because an entry carries `#weapon` *and* `#combat` rather than one instead of the other. Splitting them is a sixth axis, which is a design decision and was not slice 2's to take. **The axis is presentation and completeness, never query semantics** — the resolver matches tags, not axes — so a tag on the wrong axis is a legibility defect, cheap to correct.

**Projection beats authoring.** Where a kind's registry row names a `projections` field, the tag is derived from it at index time and never written by hand; `contentTags.test.ts` fails an authored tag that contradicts its projection. `effectiveTags(entry) = authored ∪ projected`.

**Adding a tag is a design-session decision**, recorded here. Seating one with no bearer ships a **DEAD** row in the generated catalog; writing one on an entry without seating it fails `contentTags.test.ts` and `check:attachment` by name.

**Seated since: the trait vocabulary — 45 tags** (THR-1520, 2026-09-22). Registering the six trait content files as catalogs put every spelling they author under the tag contract at once: the five class words (`#core` `#personality` `#mastery` `#reputation` `#cultural`) and `#condition` / `#scar` / `#location`, the two pole words (`#virtue` `#vice`), the five Core continua by id (`#core_warmth` … `#core_integrity`), twelve walk-of-life words (`#economic` `#guild` `#loss` `#monopoly` `#smuggling` `#debt` `#construction` `#perception` `#stability` `#fear` `#sacred` `#martial`) and the twenty reputation words — exactly one positive and one negative per reach (`#honor` / `#violence` for Iron … `#devotion` / `#fanaticism` for Star) plus `#renown`. All on `family`; the class and pole words scoped to the two trait kinds. **Seated rather than stripped**, against the migration's bearer-count clause, because that clause was a filter over a folksonomy and this set is a designed vocabulary with a bearer for every word on the day it landed — stripping the reputation words would have left *Iron, positive* and *Iron, negative* indistinguishable to a query. Two spellings were retired from their entries instead: `#general` (one bearer, no meaning) and `#power` (one bearer, and the word is a kind's). `#place`, which the ticket named, has no bearer in the corpus and was not seated — a seated tag nothing wears fails `contentTags.test.ts` by its own rule. Seated by an execution session; **flagged for veto** on the ticket.

**Seated since: `#crown_errand`** (THR-1454, 2026-09-13) — *Work set by a Realm's crown — the summons, the levy, the due.* The thirteenth `#<body>_errand`, scoped to `encounter_template`, seated on the bearer arm with three bearers on the day it landed (`encounter.realm.court_summons` / `.border_levy` / `.tithe_demanded`). Two reasons it is a new word rather than a reuse: `#court_errand` is the **Underking's Court** and cannot be shared, and a Realm is the only work-setting body whose faction is minted per world (`realm.<cultureId>`), so its content has no stable id prefix to be found by and needs the word more than any of the twelve. Seated by an **execution** session rather than a design one — the family would otherwise have had to wear `#court`, which is honest for the summons and wrong for the levy and the tithe, and a family word that fits a third of its family is the rot the errand axis exists to prevent. Flagged on the ticket for veto.

**Seated since: `#temper`** (THR-1544, 2026-09-24) — *How a creature breaks when a fight turns.* The class word of the `temper` trait class, on `family`, scoped to `trait_template`, with four bearers the day it landed (`trait.temper.stubborn` / `.berserk` / `.skittish` / `.bargainer`, in `src/data/temper-trait-content.ts`, registered under the Trait kind with the `trait.temper.` prefix). It sits beside the other class words (`#core` … `#cultural`) for the same reason they do: each trait definition file authors its class word on every entry. The seat is plan doc 3's design decision (`Docs/plans/2026-09-23-monsters-as-opponents.md` § Content); `#monster` was deliberately **not** seated — nothing queries it, and the class word carries the meaning.

**Seated since: `#lair_confront` and `#hunt_trail_cold`** (THR-1560, 2026-09-25) — *The beast's den, entered on purpose.* / *A hunt that was never taken to the den.* The two branches of the hunt's appointment, on `family`, scoped to `encounter_template`, **one bearer each** — `fight.lair.confront` and `hunt.trail_cold` — seated on the seating rule's runtime-reader clause: `cell.destroy.monster`'s appointment payoff (`UNDERTAKING_CELL_APPOINTMENTS`) names both by query, so a single bearer is the family, not a stray. `hunt.` joined the Encounter kind's `idPrefixes` in the same PR, because the content query narrows each kind to the ids its prefixes claim and a missed hunt would otherwise have resolved nothing. The seat is plan doc 6's design decision (`Docs/plans/2026-09-23-hunts.md` § Content pillar).

**How the 153 spellings in the corpus became 96 seated tags** (the migration's rule, recorded so it is not re-derived): a spelling survived with **at least one runtime reader** — a `tagFilters` query site or a hardcoded read — **or** at least `CONTENT_TAG_MIN_BEARERS` (3) bearers across the catalogs. 16 bare spellings were rewritten with their `#`; 63 were removed from their entries; the rest moved onto the derived axes. Seven tags ship DEAD: six authored ones a query site asks for and nothing wears, one sphere the corpus has not reached. The ratchet ([`contentTagRetrofitPending.ts`](../../src/data/content-eval/contentTagRetrofitPending.ts)) is **empty**, which is what let the catalog-entry `tags` types tighten to `readonly ContentTag[]`.

## The content query

Landed by THR-1487 (slice 3). Types: [`src/types/contentQuery.ts`](../../src/types/contentQuery.ts) · resolver: [`src/engine/contentQuery.ts`](../../src/engine/contentQuery.ts) · catalog-backed views: [`src/engine/contentCatalogView.ts`](../../src/engine/contentCatalogView.ts).

**The rule: name content by kind and tags, never by literal id.** `{ kind: 'item_template', tags: ['#weapon', '#entropy'] }` is the shape. A literal id stays legal where an author genuinely means *that one thing*, and is gated; a query is what you write when any fitting thing will do — which is most of the time, and is what keeps content meaning something as the catalog grows.

**One resolver, and the gate calls it.** `resolveContentQuery` is the only matcher. `validateContentQueries` does not mirror it, it *calls* it — because a gate that re-states the runtime rule agrees only while someone keeps checking, which is the failure `rewardCategoryNodeQuery`'s own header has warned about since THR-1146.

**Matching, exactly.** `classes` narrows within a kind (a Power is `bestowed` or `spell`; a Condition is `condition` or `scar`). `tags` is ALL-of and `anyTags` is any-of, over `effectiveTags` — so the projection rule above applies to queries too. `tier` is an inclusive window, and **an entry with no declared tier passes every window** (the condition pool's rule since it was written; the alternative silently drops untiered content). Results are totally ordered: registry kind order, then id ascending.

**A resolve is uncapped; a draw is capped** at `CONTENT_QUERY_MAX_CANDIDATES` (64). A caller that weights the resolved set itself must see all of it.

**What a query deliberately cannot express *to the resolver*: anything about the recipient.** Companions and agreements keep their own catalog filters, because "not at the companion cap" and "this unique is not already in the world" are facts about a bearer, not about content. Two bearer-side terms exist anyway, and both are judged **at the call site**, never by `resolveContentQuery` (THR-1520): **`exclude`** — the reward pool fills it with everything the recipient's `possesses` / `has_trait` edges point at (template id recovered from the instance form `reward_<bearer>_<tick>_<template>`), so a mortal is never dealt what they already hold; and **`requiresBearerTrait`** — a `TraitPredicate`, *"only a Master Smith may be dealt this"*, judged through `contentQueryAdmitsBearer` and the engine's one trait gate, with no bearer to judge meaning unmet. The resolver returns identical hits with the term and without it, which is what keeps the authoring-time gate honest. `resolveContentQueryDetailed` names what `exclude` removed; the traces carry it as `excludedCount`. **The world view skips cloned prizes** (`properties.source === 'encounter_reward'`): a clone wears its template's type and tags, and the by-type scan was offering every mortal's prize back as a candidate.

**Two views, and which one asks what.** The world view (`graphContentCatalogs`) answers from graph nodes, because that is where a running world holds items, conditions, powers and legendaries — including ones minted after seeding. The library view (`staticContentCatalogs`) answers from catalog literals. The *gate* uses neither: it asks over **the nodes the world seeds**, because the registry's item catalogs include `TREASURE_MAPS`, which nothing seeds — a recipe resolving only against those would read live and draw nothing.

**Where it runs today:** `reward_draw`, `step_reward_pool`, `condition_pool`, `debug`, and — since THR-1488 (slice 4) — `encounter_seed` and `undertaking_catalyst`.

**Encounters carry tags, and name their sequels by family (THR-1488).** `UnifiedActionTemplate.tags` holds the `form` / `family` words another piece of content finds this one by; `encounter_seed.query` and `StrategicActionTemplate.catalystQuery` are how a parent names its follow-up. Eighteen **family tags** are seated for encounters — the thirteen faction quest lines (`#crown_errand` is the Realm's, THR-1454) plus `#tavern_night`, `#delve`, `#threshold_errand`, `#broker_errand`, `#craft_commission` — and each is a **game word, never an id spelling** (`#circle_errand`, not `#ac_quest`), because the word reaches the player through the withered-seed narrative event. A seed's query resolves at *fire* time rather than plant time, so a sequel owed twenty ticks out finds the family as it stands when it comes due.

**A named sequel may refuse the board: `drawable` (THR-1526).** `UnifiedActionTemplate.drawable: false` marks an encounter that only a seed, an appointment branch, a trigger or a debug spawn may start — the decision board never offers it. It is a template field, not a tag, because the tag axis is presentation and never query semantics; and it is not catalog removal, because the query catalog is how a missed branch finds its sequel. Absent means drawable. A named sequel whose opening assumes its parent declares `false`; every `encounter.*` seed target on the board declares one value or the other (`check:encounter` warns until it does).

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
- Any statement that the registry's `surface` column is **un**filled, or that it is `{ card: null, sheet: null }` for every kind. Slice 2 of THR-1482 (THR-1491) filled it from `SURFACE_BY_CONTENT_KIND` in `src/data/surface-registry.ts`, which is now the single source for it — a kind's row and its surface can no longer disagree, because they are the same object.
- Any statement that six kinds reach no codex category. THR-1495 ruled on all six: **legendary artifacts, companions, ambitions and the nudge deck were chartered** (the first into `possessions` as a rail group, the other three as their own categories), and **encounters and omens are withheld by recorded ruling** — an encounter catalog is the answer key, and an omen catalog turns dread into a lookup table. Both withholds are quotable in the row's `note`; ten of twelve kinds now reach the codex.
- Any *count* quoted from this page's sibling registries as a current fact. Every count in the 2026-09-12 coverage table had moved a day later (encounters 557 → 513, actions 239 → 187) while the predicate behind it held exactly. `Docs/canon/content-objects.generated.md` carries the live census, and `contentKindCodexCoverage()` the live codex coverage.
- Any statement that `requiredAxes` is empty — slice 2 populated it for the six attachment kinds from *measured* coverage (an axis is required only where every entry of the kind already carries it, so the column can only grow and never ships red).
- Any plan-doc statement that `censusTag` is retired outright, or that the item sphere tag is projected from `sphereAffinity`. Both are corrected above.
