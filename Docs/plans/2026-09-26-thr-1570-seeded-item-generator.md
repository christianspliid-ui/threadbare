> **title:** The seeded item generator — a masterwork is born with an idea, a power and a price — THR-1570
> **linear_issue:** THR-1570
> **author:** Claude Code (design lane, run 2026-09-26b)
> **created:** 2026-09-26
> **three_pillars:** Engine `done` · Content `done — the Storied-and-up trope cores ported from the THR-1236 prototype, each grown to two or three signatures` · UI `done — the artifact sheet says what the thing does, what it costs and who made it, in words`

# The seeded item generator — THR-1570

*A mortal who finishes a masterwork today makes an object that does nothing. After this plan they make a thing with an idea — a blade that wants blood, a ring that bargains, a book that should not be read — dressed by who made it and where, and it only ever promises what the engine actually does.*

## Why this is load-bearing

The Item Generator map ([THR-1227](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)) closed on 2026-09-24 with this as its one plan doc. The prototype it judged ([thirty generated items](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-24-thirty-generated-items.md), THR-1236) proved the machine: about fifteen of thirty read as *cool*, every one of them Storied or above and grown from an authored trope core, and all 38 items read back clean against the real engine (538 checks; a dishonest control batch failed six of seven).

Meanwhile the one place the world makes a remarkable object is empty. `mintMasterwork` (`src/engine/strategicGraphOps.ts:839-889`) writes `effects: []`, a stock name (`"<maker>'s masterwork"`) and the summary *"Made well, by someone who meant it."* The living-world census (`Docs/audits/2026-09-25-living-world-data/output/cells.txt`) counts roughly **3–4 masterworks per 150-tick medium run** (seed 42: 10 starts / 4 completions; seed 99: 8 / 3), and those items are then *seized* by rivals — so the world already fights over things that are, mechanically, nothing. This plan fills them.

It also closes a leak the survey found on the way: every masterwork is drawable as a **reward template** today (see § Substrate inventory, row 3), so a mortal can be handed a clone of somebody else's masterwork.

**Settled input — not reopened here** (each is cited where the plan uses it):

- **[THR-1234](https://linear.app/threadbare/issue/THR-1234/item-minting-today-where-items-are-born-and-what-shapes-them), the minting seam** — a generated item needs a unique id, the artifact type, a name, a numeric tier 1–4 and `#`-prefixed tags; `graph.addNode` makes it real.
- **[THR-1235](https://linear.app/threadbare/issue/THR-1235/random-table-raw-material-what-the-world-can-tell-the-generator), the tables** — twelve table axes, the seeded-roller pattern (`drawFromTable`), six naming grammars, the lore tones.
- **[THR-1236](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to), the prototype rulings (2026-09-24)** — authored trope cores with world tables as dressing; **two or three mechanical signatures per core**; **generate Storied and up** (Mundane stays in the hand catalog); free composition rejected as the default; **an item never promises what the engine does not do** — the honest-vocabulary validator plus the engine read-back is the required gate.
- **The map's closing carve-up** (THR-1227, 2026-09-24) — masterworks first; other minting points named, not built; the generated share per band a named constant; art a deterministic rule over the existing category keys. Out of scope, unchanged: item lifecycle, the visibility overhaul, shops and crafting.

**Decided in this plan by the design lane under delegation** (process.md rule 4, 2026-09-11; each is marked *Lane decision* where it appears, and each can be vetoed in chat): the masterwork band rule (§ Resolution logic), the *Storied* word ruling (§ Content pillar → UL), the pool-share value and its deferral (§ Constants), the art rule (§ UI pillar), and the review path (§ Content pillar → Review path).

**The prototype source is in git** on the never-merged branch [`proto/thr-1570-item-generator`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1570-item-generator/Docs/audits/2026-09-24-proto-items) (`generator.mjs`, 1715 lines; `engine-check.mjs`; `world-vocab.json`). It was copied verbatim from the design vault, which is not git-backed. **Port from it; do not rewrite from the write-up.**

## Substrate inventory

Measured 2026-09-26 against `origin/main` 7f5195c5 (grep + read; line numbers are that commit's).

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Attachments, Items & Possessions** — `mintMasterwork` (`strategicGraphOps.ts:839`), called from `strategicActionLifecycle.ts:1983` (`mint_masterwork` hint on `strategic_craft_masterwork`, `builderStrategicPack.ts:133-167`, `tier: 2`) and from the Item kind's `create` verb (`undertaking-objects.ts:2172-2177`, cell `cell.create.item`) | 🟢 ACTIVE | **extends** — the mint calls the generator and writes its effects, name, prose and tags; the id, the `possesses` edge, `craftedBy` and the Storied stamp are kept |
| Generic effect system (`effects[]` on artifact nodes, walked over `possesses` / `bonded_to` / `has_trait` by `effects/effectWalker.ts:22,85`) | 🟢 ACTIVE | **preserve** — generated effects are ordinary `effects[]` entries; no resolver change |
| Reward pool / content query — `graphContentCatalogs` (`contentQuery.ts:226`) carves every `artifact` node without `source: 'reward'` as an `item_template` (`contentQuery.ts:195`) | 🟢 ACTIVE | **extends** — minted instances (generated, or any node carrying `craftedBy`) are excluded from the template carve. **Today every masterwork is drawable as a template** — measured: `mintMasterwork` sets no `source`, and :195 is the only exclusion |
| Content-object registry — `item_template.idPrefixes: ['reward_', 'starter_', 'anomaly_']` (`content-objects.ts:247`) | 🟢 ACTIVE | **extends** — adds `gen_` so `contentKindsForId` names a generated item as an Item |
| Artifact traits — `assignArtifactTrait(graph, artifactId, traitId, { tick, source })` (`artifactTraits.ts:104`); level always 1 because `assignTrait` writes `level: 1` (`traits.ts:86`); Storied max level 3, words *has seen a thing or two / much / it all* (`artifact-trait-content.ts:57,70`) | 🟢 ACTIVE | **extends** — an optional `level` on `assignArtifactTrait`, applied to the edge *after* `assignTrait` returns. `traits.ts` is **not** edited |
| Seeded tables — `drawFromTable(tableId, weights, seedKey, n)` (`content-eval/drawTable.ts:94`, imports only `mulberry32`); its header says *"Nothing under `src/engine/**` imports it"* (:20-21) — a convention, not a technical block | 🟢 ACTIVE (authoring) | **extends** — lifted to `src/lib/drawTable.ts`; the `content-eval` path re-exports it so its four importers are untouched |
| One namer — `hashSeed`, `pickFrom`, `possessive` in `engine/naming/workNames.ts:68-91` (interface row `one-namer-shared-primitives`) | 🟢 ACTIVE | **preserve** — the generator imports these; it mints no hash or possessive of its own (the prototype's `fnv1a` is dropped) |
| Category art — `ARTIFACT_CATEGORY_ART: Record<PossessionSubcategory, string>` (`artifact-category-art.ts:52-60`), resolved by `getAttachmentArtUrl(id, subcategory)` (:116-125): bespoke → category → null | 🟢 ACTIVE | **preserve** — total over subcategories, so setting the right subcategory *is* the art rule |
| `ARTIFACT_LORE_PATTERNS` (`culture-content.ts:1168`) | 🟠 DORMANT (read only by its own test) | **not activated** — the prototype kept only its five tones and rewrote every sentence plainly; the cores carry their own provenance lines |
| Artifact sheet (`components/Game/ArtifactSheet.tsx`, THR-1009 / THR-1521) — visual, rarity badge, kind, `flavorText`, trait chips, tag chips; deliberately **not** `mechanicalSummary` (Law 13) | 🟢 ACTIVE | **extends** — adds *What it does*, *The catch* and *Made by* for generated items |
| Save/load | — | **none exists**: `agentAttachments.ts:132-133` — *"The world graph is never serialized (no save/load path exists)"*. A generated item needs no persistence work |

Green-field parts, with their evidence: **0 hits** for `itemGenerator`, `generateItem`, `gen_` (as an id prefix) or `honestVocabulary` across `src/` and `Docs/canon/systems-inventory.md`; the only effect-kind ledger is script-side (`scripts/consumption-ledger-sources.ts`, `EFFECT_ROWS` — the aftermath reaction union, a different union). The generator, its cores and its validator are new; everything they write lands in systems that already read it.

**Population consumed:** masterworks, ~3–4 per 150 ticks per medium world (above). Generated items are rare by construction.

## Engine pillar

### Systems design

A new module family, `src/engine/itemGenerator/`, pure and fail-soft:

| Module | Does |
|---|---|
| `generateItem.ts` | `generateItem(request: ItemGenRequest): GeneratedItem \| null`. Picks a core, draws every world table eagerly (the `generateGroupName` discipline, THR-1235 §4 — which entities the prose ends up naming never shifts another roll), builds effects from the core's chosen signature, renders name, look and provenance, and returns the item plus its plain-word description. Never touches the graph. |
| `worldContext.ts` | `buildItemWorldContext(graph, state, { makerId, placeId })` — reads the live world the prototype faked: the maker (name, pronoun, calling), the maker's faction (`member_of`) with its reach leanings, the place (resolved to the settlement tier via `resolveToParentLocation`) and its dominant sphere, the maker's culture, and — for provenance that names a past — dead notables and chronicle events when present. Every field optional. |
| `validateGeneratedItem.ts` | The honest-vocabulary validator, ported from the prototype's `validate()` (`generator.mjs:1494-1540`): per-effect and per-reach caps from `effect-constants.ts`, stat bands from `item-stat-bands.ts`, live rule keys, live trigger events, conditions that exist, immunities that block a real condition, the closed tag vocabulary (`isContentTag`, family tag required), loss-condition honesty (breakable ⇒ a break trigger; cursed ⇒ a real catch), no catalog-name collision, and **"a `when…` bonus names a real situation"** (a conditional on its own reach is a passive in disguise — 26 of the catalog's 41 are; only `in_combat` on Heart, the fight's nerve step, is exempt). Returns `string[]` problems. |
| `describeItem.ts` | Plain words for effects — *a little / noticeably / much / far*, *a touch / somewhat / a good deal*, days not ticks, *about one time in four* — ported from `generator.mjs:1351-1490`. Pure over `effects[]`, so the sheet derives words at render and they never go stale when tier advancement scales an effect. |
| `mintGeneratedItem.ts` | The one writer: builds the node from a `GeneratedItem` (the prototype's `toNode`, `generator.mjs:1574`), `graph.addNode`, stamps Storied at the requested level, emits the trace. Used by `mintMasterwork` and by the debug lever. |
| `src/data/item-generator-cores.ts` | The authored trope cores (Content pillar). |
| `src/data/item-generator-tables.ts` | Forms, materials, looks, sphere roots and adjectives, name grammars, magnitude envelopes — the prototype's tables, less everything the live world now supplies (factions, places, heroes, events, monsters). |
| `src/data/item-honest-vocabulary.ts` | One row per effect shape the generator may emit: `status: 'live' \| 'narrow' \| 'planned'` and the name of its production reader. The validator refuses `planned`. |
| `src/lib/drawTable.ts` | `drawFromTable` lifted out of `content-eval/` (the re-export keeps its four importers). |

**`mintMasterwork` changes, additively.** A new optional last parameter `opts?: { worldSeed?: number; outcomeBand?: StepOutcomeBand; placeId?: string }`. When `worldSeed` is present and `ITEM_GEN_MASTERWORK_ENABLED` is true, it asks the generator for an item at the masterwork band (§ Resolution logic) and writes it; otherwise — or when the generator returns `null` after its rerolls — it writes exactly today's empty masterwork. Both call sites pass `state.seed`; the lifecycle site also passes the band its final checkpoint landed on (`executeInstantMutation` already receives it, THR-1428).

**The name survives christening.** Every created work is renamed at completion by `christenCompletedWork` (`strategicActionLifecycle.ts:316-374`, called at :1048 after the mint at :1009): it calls `generateWorkName(...)` and `graph.updateNode(createdId, { name })` (:360), and its own comment lists *"a masterwork"* among the works it names (:326-327); `mintMasterwork`'s name is marked *"A working name only"* (`strategicGraphOps.ts:857-858`). Cells complete through the same function (it maps `project.objectTypeId` to a naming kind), so this is the one seam for both mint paths. The change follows the precedent the function already sets for `trait` nodes (THR-1429 — *"the catalog is the authority on what they are called"*): a created node with `properties.origin === 'generated'` is **not renamed**, because the generator is its christening. The function still returns `{ nodeId, name: created.name }` for it, so the completion trace's `christenedName` (:1233), the cell's deed (`undertakingDeed.ts:47`) and the chronicle line all carry the generated name. The empty-masterwork fallback carries no `origin` and is christened exactly as today.

**The id.** A generated masterwork's id becomes `gen_masterwork_${makerId}_${tick}` (was `artifact_masterwork_…`). The fallback keeps the old id. `gen_` is registered on the `item_template` kind so `contentKindsForId` and the CLI `content` listing see generated items as Items.

**Instances are not templates.** `contentQuery.ts:195` gains one clause: a node with `properties.craftedBy` or `properties.origin === 'generated'` is not carved as an `item_template`. This fixes the existing masterwork leak and keeps a unique named thing ("The Unquiet Blade") from being cloned onto a stranger. It changes the reward pool's candidate set **only** on worlds where a masterwork exists; the shared-path test (`content-query-one-resolver-engine-and-gate`) is re-pinned with that stated.

**Storied at birth.** `assignArtifactTrait` gains `opts.level?: number` (clamped to the definition's `maxLevel`), written onto the `has_trait` edge after `assignTrait`. A masterwork keeps level 1 — a new thing has seen only its making. The `found` origin (the CLI review path now, the reward-draw minting point later) starts at `STORIED_START_LEVEL_FOUND_BY_BAND`.

### Graph nodes / edges

No new node or edge type. A generated item is an `artifact` node (a generated Legendary is out of scope — § Notes) with the properties the reward catalog already uses (`PossessionNodeProperties`, `types/attachments.ts:78`: `subcategory`, `tier`, `tags`, `mechanicalSummary`, `lossCondition`, `effects`, `flavorText`, `sphereAffinity`) plus the masterwork's existing `craftedBy` / `createdTick`, plus one new bag:

```ts
/** On a generated item only. Read by the sheet, the debug bridge and the gate test. */
interface GeneratedItemProvenance {
  origin: 'masterwork' | 'found';
  coreId: string;            // the trope core, e.g. 'blood_hungry'
  signatureId: string;       // which of the core's two or three signatures fired
  band: 2 | 3 | 4;           // Storied / Mythic / Legendary
  seedKey: string;           // the full seed key — re-running it reproduces the item
  catchIndexes: number[];    // indexes into effects[] that are the catch, not the boon
  provenanceConcepts: { id: string; kind: 'actor' | 'faction' | 'location' }[]; // who/where the story names — the producer declares its concepts (UI Law clause b)
}
// node.properties.origin = 'generated'; node.properties.generated = GeneratedItemProvenance
```

`properties.origin` is a flat string so the one-clause carve exclusion does not have to reach into the bag. Relationships stay edges: the maker is `craftedBy` (existing property on the masterwork, unchanged — it predates this plan) plus the existing `possesses` edge; `provenanceConcepts` are *display declarations* for the sheet's links, not relationships the engine traverses (a dead hero named in a story is not an ownership fact).

### Tick phases

None new. Generation runs inside the existing completion paths: `executeInstantMutation` (`strategicActionLifecycle.ts:1734`, reached at :520 and :1009) and `resolveUndertakingCompletion` → the Item kind's `create` verb (`undertakingResolver.ts:194`). Cost: one generation per masterwork, ~3–4 per 150 ticks.

### Resolution logic

**Core choice (masterwork).** Eligible cores are those whose `origins` include `'masterwork'` and whose `bands` include the requested band. Weight = `core.weight × (1 + reach lean)` where the lean is the core's reach weight dotted with the maker's faction reach weights (the prototype's `FACTIONS[...].reach` lean) — a Free Company smith leans to Iron cores, a scholar to the book — times `ITEM_GEN_CORE_REPEAT_DECAY ^ n`, *n* = generated items of that core already in this world (counted off the graph by `properties.generated.coreId`). The prototype capped a core at two per *batch*; a live world has no batch, so the decay does that job across the whole world.

**Signature choice.** Uniform over the core's signatures that are legal at the band, with the same per-world decay keyed on `coreId:signatureId` — so a core's second appearance tends to carry its other idea (the fix for *The Black Knife* re-skinning *Hollowroot*).

**Band (Lane decision).** The masterwork's band comes from how the work went, read off `MASTERWORK_BAND_BY_OUTCOME`: a `critical_success` final checkpoint makes a **Mythic** thing; every other completing band makes a **Storied** one; a completion with no band (the cell path when it carries none) is Storied. Capped at `MASTERWORK_MAX_BAND = 3` — a mortal's workshop does not make Legendaries; a Legendary is its own content kind with a trait graph (`content-objects.md`, *Legendary artifact*). The authored hint's `tier: 2` stays the floor. *Why this and not a flat roll:* the dice that decided the work decide the work's standing, so a great day at the forge is visible in the thing — and the rule needs no new randomness.

**Rerolls.** If the validator returns problems, reroll with seed key suffix `:r<k>` up to `ITEM_GEN_MAX_REROLLS`; still failing → return `null` and the mint writes today's empty masterwork. A shipped core should never reach this (the gate test proves it); the path exists for NFP #4.

### PRNG callouts

No `Math.random()` anywhere. The item seed key is `gen_item:${worldSeed}:${origin}:${makerId}:${tick}` (masterwork) or `gen_item:${seed}:${origin}:${index}` (CLI / debug), hashed with `hashSeed` (`workNames.ts:68`). Every table is its own stream through `drawFromTable(tableId, weights, seedKey, n)` — cutting a core or a material never reshuffles another table (the prototype's `Roller`, re-expressed on the lifted helper). The lifecycle's own `rng` is **not** consumed, so adding the generator does not shift any other roll in the tick — a world with `ITEM_GEN_MASTERWORK_ENABLED = false` and one with it on stay identical in everything but the masterworks themselves. Determinism test: the same world seed and tick produce byte-identical items.

## Content pillar

### Encounter templates

N/A — no encounter template changes. A generated item reaches encounters only through what already reads possessions (its `effects[]` shape step rolls; the Storied trait is read as the fight's *Storied arms* advantage), so no template needs a new field or line.

### Attachment content — the trope cores

Port the prototype's cores (`generator.mjs:460-1028`) into `src/data/item-generator-cores.ts`, keeping every core that reaches **Storied or higher** (the THR-1236 ruling). Each core carries: `id`, `label`, `bands`, `weight`, `origins`, `forms`, `reaches`, `spheres`, `factions`, `family` tags, `looks`, `provenance` lines (each with its `tone` and the entities it `uses`), `names` and `grammar` weights, and — new — `signatures`: **two or three** named builders, each a function from the draw context to boon and catch effects. A core with one signature fails the content gate.

| Core | Bands | Masterwork? | Note |
|---|---|---|---|
| the blade that wants blood | 2–4 | yes | its *practical* line already reads "made it to a plain pattern; something got into it afterwards" |
| the lantern that shows the dead | 2–4 | yes | |
| the ring that bargains | 2–4 | yes | |
| the stone that quiets magic | 2–4 | yes | |
| the book that should not be read | 2–4 | yes | |
| the vow-bound thing | 2–3 | yes | made to seal an oath |
| the standard that steadies the line | 2–4 | yes | |
| road luck | 2–3 | yes | Storied row only (Mundane rows retire with the band) |
| the trader's edge | 2–3 | yes | the prototype's weakest (*Factor's Coin*) was its Mundane row — retired |
| tools of a quiet trade | 2 | yes | |
| plain gear, well made → **gear made past its maker's skill** | 2–3 | yes | the masterwork archetype; its Storied row gains a real catch or a second idea |
| the weapon that chose its bearer | 3–4 | no | a thing *found*, not made |
| the thing that will not let you die | 4 | no | Legendary only — out of this plan's minting point |
| a saint's relic | 2–4 | no | |
| the relic that sours the land | 3–4 | no | |
| the heirloom | 2–3 | no | born at *has seen much* on the `found` origin |
| a trophy taken from a monster | 2–3 | no | |
| salvage from a disaster | 2–3 | no | **needs the Storied level** — *The Last Helm* failed because a history-touched thing did not feel touched |
| a beast worth its keep | 2–3 | no | a mount is bred, not crafted |
| good things to carry · a small luck | — | — | **dropped**: Mundane-only in practice; stay in the hand catalog |

Eleven cores are masterwork-eligible; nine are carried for the `found` origin (exercised by the review path now, and by the reward-draw minting point later). **A masterwork-eligible core authors at least one `made` provenance line** that names the maker (`uses: ['maker']`) — a masterwork's story is who made it, where, and for what: *"Tamsin Weir made it at Saltmere for the Guild, and has not been easy since."* The prototype's hero/event lines assume a dead owner; they remain for `found`.

**Second signatures to author (the content work).** Each core's second (and optional third) signature must change *what the thing does*, not its dressing. Starting ideas, from the prototype's own catch variety — the executor finalises each against the validator and the read-back: blood-wants → (a) fights harder and seeks fights · (b) steadies nerve but costs Heart with people; ring-that-bargains → (a) trade edge, standing cost · (b) a toll on each success paid in quintessence; book → (a) Veil insight, value drift · (b) reveals encounters, Nightmares chance; lantern → (a) reveal the dead's encounters · (b) Mind aura for allies, Grieving chance; quiets-magic → (a) suppress radius · (b) immunity to one real curse family, Star penalty; vow-bound → (a) faction standing, action gate · (b) conditional *in the hands of someone True*, penalty when not.

### Prose tables

The cores' `looks`, `provenance` and `names` are the prose. Register: **game, not novel** — one concrete detail, plain sentences, no lyrical register (the prototype rewrote every `ARTIFACT_LORE_PATTERNS` sentence for this reason). Names follow the eight grammars the prototype measured (*material + form*, *whose trade it served*, *whose it was*, *X of the Y*, *The + word + thing*, one made-up word, *thing of a named person or place*, a family name); a grammar is offered only when the story backs it (no *Hesta's Spear* unless the story names Hesta); rarer items lean away from plain material names; a name never collides with a catalog name (validator).

### Data tables

`item-generator-tables.ts` (ported): ~40 forms across the seven possession subcategories, ~40 materials with sphere and terrain leanings (trophy materials only from a monster), one look per sphere for hard and soft goods, sphere roots and adjectives for names, and `ITEM_GEN_MAGNITUDE_BY_BAND` (the prototype's `MAG` table, re-keyed to bands 2–4 — calibrated against the hand catalog's own ranges and inside `item-stat-bands.ts`).

`item-honest-vocabulary.ts`: the prototype's `SHAPE_STATUS` (`generator.mjs:119-143`), **re-measured at build**. Since 2026-09-24, three shapes the prototype held back have shipped: `reactive` timed boosts ([THR-1568](https://linear.app/threadbare/issue/THR-1568/items-that-promise-a-burst-when-struck-never-give-it-a-reactions-timed), Done), `inflict_condition` (fight block FB6, [THR-1542](https://linear.app/threadbare/issue/THR-1542/fight-block-fb6-effect-vocabulary-for-fights), Done), and the condition family tags ([THR-1569](https://linear.app/threadbare/issue/THR-1569/fear-wards-wound-cures-and-curse-wards-miss-the-real-conditions), Done). A shape moves to `live` **only** when a read-back case for it passes in the gate test. `rest` and `spell_cast` triggers stay refused — measured 2026-09-26: `checkAndFireActionTriggers` is called only with `movement_complete` (`phaseMovement.ts:274`), `action_complete` and the ladder bands (`unifiedActionResolution.ts:2952`), and `encounter_success` / `encounter_failure` (`orchestrator.ts:895`). `prevent_loss` stays quintessence-channel only ([THR-1625](https://linear.app/threadbare/issue/THR-1625): the `condition` channel has no reader). Only 2 of 11 terrain overlays are read (`warded`, `shrouded` in `movementCost.ts`), so `hex_effect` is limited to `divineInfluence`, `corruption` and `explorationAttraction`.

### Review path (Lane decision)

A generated item reaches a world only through cores that have passed three gates:

1. **The gate test** (`src/engine/itemGenerator/__tests__/itemGenerator.gate.test.ts`): for seeds `ITEM_GEN_GATE_SEEDS`, every band, both origins, `ITEM_GEN_GATE_ITEMS_PER_CELL` items each — **zero validator problems** and **zero read-back failures**; every core fires at least once across the grid; every core has ≥ `ITEM_GEN_MIN_SIGNATURES` signatures; determinism (same key ⇒ identical item). The **read-back** is the prototype's `engine-check.mjs`, ported: mint the item into a three-mortal test world (a bearer, an ally, a rival, in a village held by a third faction), then call the real engine readers — every boon changes its reach's roll in an ordinary step *and in its intended situation*, capability via `computeRawScore`, rule overrides at their owning site, immunities against every real condition, triggers, ticks, auras, suppression, charges — and every catch applies. **A control batch of deliberately dishonest items must fail**, or a clean pass proves nothing (the prototype's control failed six of seven, and the validator caught the seventh).
2. **The CLI** (`npm run cli`): `generate items [N] [--band 2|3|4] [--origin masterwork|found] [--seed S]` prints each item as the sheet would read it (name, what it is, what it does, the catch, under-the-hood line) plus its validator and read-back verdict. This is how a person reviews a core change: generate thirty, read them.
3. **Christian's bar stays "are they cool?"** — a batch of new cores is surfaced to him as a sample the way THR-1236 was, never as a diff.

## UI pillar

*Screenshot tool: **Playwright** (DOM) — the artifact sheet is a modal, not canvas.*

### Player-facing display

`ArtifactSheet.tsx` gains three optional blocks for a node with `properties.origin === 'generated'` (Law 4: each appears only when it has content):

- **Made by** — in the identity row after the kind: *Made by* + the maker's name as an entity link (from `craftedBy`), and the place when the story names it. Links resolve through the existing entity-link path; a dead or missing maker renders the name unlinked, never a dead link (Law 21).
- **What it does** — `describeItem(effects excluding catchIndexes)`: one plain sentence per boon, magnitudes in words (Law 13 — the reason `mechanicalSummary` stays hidden applies unchanged).
- **The catch** — the same over `catchIndexes`, or no block when there is none.

`flavorText` carries *what it is* — the look sentence plus the provenance — so the existing prose block needs no change. The names in the provenance that `provenanceConcepts` declares render as links (UI Law clause b: the producer declares its concepts; the sheet does not parse English). **Authored catalog items are unchanged** — extending *What it does* to them is a separate call (§ Notes).

**UI Laws engaged:** 1 (every concept carries its image — the category plate via `EntityVisual`), 4 (absence is designed), 13/14 (no numerals; player words only), 17, 21 (no dead links), 33, 37, 56 (every chip backed by a real edge — the Storied chip is the real `has_trait` edge).

**Art (Lane decision).** The rule is the one the resolver already applies: bespoke art by id (none for `gen_` ids) → the category plate for the item's `subcategory` → the designed glyph tile. The generator sets `subcategory` from the core's form kind (a sword ⇒ `arms`, a signet ⇒ `relics_talismans`), which also stops every masterwork showing the tools plate (all masterworks are `tools_instruments` today). Per-form plates are not in scope.

### Event notifications

None new. The undertaking completion already names its object on the world-change trace and in the chronicle; the generated name flows through it, and the name links to this sheet (THR-1009).

### Debug inspection (DebugPanel)

- `window.__DEBUG.getGeneratedItems()` → `{ id, name, coreId, signatureId, band, origin, makerId, tick, rerolls }[]`.
- `window.__DEBUG.previewGeneratedItem({ seed, band, origin })` → the item, its words, its effects and its validator problems, without minting.
- `window.__DEBUG.mintGeneratedItem({ holder: '@hero' | actorId, band, origin })` → mints one onto a mortal and returns its id — the browser-verify lever, because a masterwork is a ~1-in-40-ticks event.
- CLI `generate items …` (above) and the existing `agent <name>` possession listing.

### Visual presence (HexMapV2)

N/A — an item has no map presence; nothing on the hex map reads possessions.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `itemGenerator/generateItem.ts` | via completion (below) | — | — (reads `state.seed`) | — (the minter traces) | `previewGeneratedItem`, CLI `generate items` |
| `itemGenerator/mintGeneratedItem.ts` | strategic project completion (`executeInstantMutation`) and undertaking completion (`resolveUndertakingCompletion`) | `ArtifactSheet` | graph only | `item.generated`, `item.generate_fallback` | `getGeneratedItems`, `mintGeneratedItem` |
| `mintMasterwork` (edited) | same | `ArtifactSheet` | graph only | existing + the two above | CLI `agent <name>` |
| `christenCompletedWork` (edited, `strategicActionLifecycle.ts:316`) | strategic project completion (both mint paths) | chronicle, `ArtifactSheet` title | graph only | existing completion trace, `christenedName` = the generated name | — |
| `contentQuery.ts:195` (edited) | every reward draw | — | — | existing `traceContentQuery` | — |
| `assignArtifactTrait` (edited) | same completion | `ArtifactSheet` trait chips | graph only | existing trait trace, now with the real level | `getArtifactTraits` |
| `describeItem.ts` | — | `ArtifactSheet` | — | — | CLI output |

Prose pipeline: the item's text is composed at generation from the cores' own lines; it does not go through `enrichProse()` (no placeholders survive generation — the validator rejects an unrendered `{…}`). Player controls: none — the player meets these items; they do not make them. Update `Docs/plans/wiring-checklist.md` with the minter and the two traces.

## Interface impact

| Contract | Action |
|---|---|
| `attachment-encounter-rewards` | **preserve** — reward draws still pay out authored templates; they stop offering minted instances |
| `content-query-one-resolver-engine-and-gate` | **extend** — the carve excludes minted instances; the shared-path test is re-pinned, stating the one intended difference |
| `content-objects-registry` | **extend** — `gen_` on `item_template` |
| `one-namer-shared-primitives` | **preserve** — new consumer of `hashSeed` / `pickFrom` / `possessive` |
| `attachment-effects-shape-resolution`, `attachment-domain-contributions`, `attachment-on-use-triggers` | **extend** — a new producer (generated `effects[]`); readers unchanged |
| `undertaking-object-types`, `undertaking-ownership-agrees-with-writers` | **preserve** — `cell.create.item` still mints a held Item; a `gen_` id is not in `CATALOG_TEMPLATE_IDS`, so ownership still resolves it |
| **add:** `generated-item-honest-vocabulary` | *An item the world makes promises only what the engine does* — producer `validateGeneratedItem` + `item-honest-vocabulary.ts`; read site: the gate test's read-back and `mintGeneratedItem` (refuses an invalid item). Register in `scripts/interface-contracts.ts` in the same PR |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `ITEM_GEN_MASTERWORK_ENABLED` | `true` | Master switch for the masterwork minting point; `false` restores today's empty masterwork exactly |
| `ITEM_GEN_ID_PREFIX` | `'gen_'` | Id prefix for generated items; registered on `item_template` |
| `MASTERWORK_BAND_BY_OUTCOME` | `{ critical_success: 3, default: 2 }` | How the work went decides the band (Lane decision) |
| `MASTERWORK_MAX_BAND` | `3` | A workshop never makes a Legendary |
| `ITEM_GEN_MAX_REROLLS` | `3` | Validator rerolls before falling back to the empty masterwork |
| `ITEM_GEN_CORE_REPEAT_DECAY` | `0.15` | Weight × this per earlier generated item of the same core in this world (prototype's `TROPE_REPEAT_DECAY`) |
| `ITEM_GEN_SIGNATURE_REPEAT_DECAY` | `0.3` | Same, per core-and-signature — pushes a repeat core onto its other idea |
| `ITEM_GEN_FACTION_REACH_LEAN` | `1.0` | Strength of the maker's faction reach lean on core choice |
| `ITEM_GEN_MIN_SIGNATURES` | `2` | Content gate: fewer signatures fails the gate test |
| `ITEM_GEN_MAGNITUDE_BY_BAND` | prototype `MAG`, bands 2–4 | Bonus / penalty / stat / aura / drift envelopes per band |
| `ITEM_GEN_BREAK_CHANCE_BY_BAND` | `{ 2: 0.2, 3: 0.1 }` | Chance a breakable item breaks on a critical failure |
| `STORIED_START_LEVEL_MASTERWORK` | `1` | A new thing has seen only its making |
| `STORIED_START_LEVEL_FOUND_BY_BAND` | `{ 2: 1, 3: 2, 4: 2 }` | A found thing arrives with a past; level 3 is only ever earned |
| `ITEM_GEN_GATE_SEEDS` | `[7, 42, 99]` | Gate-test seeds |
| `ITEM_GEN_GATE_ITEMS_PER_CELL` | `12` | Items per seed × band × origin in the gate test |

**Pool share (Lane decision, value ruled here, constant deferred).** The ticket asks for the generated-versus-authored share per band as a named constant. It has no reader until generated items join **reward draws**, which the map named and did not build — so shipping it now would be a number nothing reads (a dead constant fails NFP #1's purpose). The ruling: `GENERATED_REWARD_SHARE_BY_BAND = { 1: 0, 2: 0.5, 3: 0.5, 4: 0 }` — half of every Storied and Mythic reward draw is generated, Mundane stays authored (the THR-1236 ruling), Legendary stays authored until a generated Legendary has its own trait-graph design. It lands with its reader in the deferral ticket filed with this plan: [Item generator minting point 2 — reward draws carry generated items at the band share](https://linear.app/threadbare/issue/THR-1626).

## Tracing

```ts
// item.generated — a generated item was minted
interface ItemGeneratedTrace {
  type: 'item.generated';
  itemId: string;
  name: string;
  origin: 'masterwork' | 'found';
  coreId: string;
  signatureId: string;
  band: 2 | 3 | 4;
  seedKey: string;           // reproduces the item exactly
  makerId: string | null;
  placeId: string | null;
  sphere: string;
  reach: string;
  effectCount: number;
  catchCount: number;
  rerolls: number;           // 0 in a healthy world
  storiedLevel: number;
}

// item.generate_fallback — the generator gave up; the mint wrote the plain masterwork
interface ItemGenerateFallbackTrace {
  type: 'item.generate_fallback';
  makerId: string;
  seedKey: string;
  reason: 'no_eligible_core' | 'validator_exhausted' | 'world_context_missing' | 'threw';
  lastProblems: string[];    // the validator's words on the final attempt
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| No core is eligible for the band and origin | `null` → today's empty masterwork; `item.generate_fallback` (`no_eligible_core`) |
| Validator still finds problems after `ITEM_GEN_MAX_REROLLS` | `null` → empty masterwork; trace carries the problems |
| Maker, faction, place or culture missing from the graph | Provenance lines that `use` a missing entity are ineligible; a core with no eligible line is skipped; nothing names a missing thing |
| No dead notables or chronicle events in a young world | Lines needing a past are skipped (masterworks never need one) |
| `worldSeed` not passed (an older caller, a test) | Today's empty masterwork, unchanged |
| The generator throws | Caught in `mintMasterwork`; empty masterwork; `item.generate_fallback` (`threw`); the tick continues |
| `assignArtifactTrait` level above the definition's max | Clamped to `maxLevel` |
| A shape in the vocabulary loses its reader later | The gate test's read-back fails at CI — the drift is caught before a world sees it |
| The sheet meets a generated node missing `generated` | Renders as today (visual, name, badge, prose) — the new blocks are optional |

## Three-pillar check

- [x] Engine pillar present — generator, validator, minter, masterwork integration, carve fix, trait level
- [x] Content pillar present — cores with two or three signatures, prose, tables, honest vocabulary, review path
- [x] UI pillar present — *Made by*, *What it does*, *The catch* on the artifact sheet; debug levers
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves *systemic over scripted* (the world makes its remarkable things, dressed by who and where) and *narrative over mechanical perfection* (NFP #5 — an item is an idea with a price, never a stat stick). The one tension — generated content risks anonymity — is exactly what the THR-1236 ruling settled: authored cores, not free composition.
- [x] No Vision edit is owed.

## Rulebook impact

- [x] This plan **changes a rule of play**: a masterwork now *does* something and may cost its bearer something. `Docs/canon/rulebook.md` § near line 122 (*A thing remembers where it has been*) gains, in the same PR: **"A masterwork is made with an idea.** What a mortal makes grows around one of a set of authored ideas — a blade that wants blood, a ring that bargains — dressed by its maker, their people and their place; a great day at the work makes a Mythic thing. It only ever promises what the world actually does." `[IMPL — THR-1570, src/engine/itemGenerator/, MASTERWORK_BAND_BY_OUTCOME]`. The quick-reference card needs no line.
- [x] The UL ruling (below) lands in the same PR.

**UL ruling — *Storied* (Lane decision).** *Storied* is the second rarity word (`rarity.ts`: *"Notable — has a history"*) and the artifact trait (*has seen a thing or two / much / it all*). They are **one meaning, not two**: *Storied* means **has a history**. The band is the promise a thing makes about its history at birth; the trait is where that history lives and grows. The rule that makes the words agree: **a generated item of band Storied or higher is always born carrying the Storied trait** (a masterwork at level one; a found thing at `STORIED_START_LEVEL_FOUND_BY_BAND`), so the prototype's two contradictions — a Storied-band ring with no story, a Mythic sword that was Storied-the-trait — cannot recur. Mundane things may still *earn* the trait. The rarity words have no UL entry today (0 hits for "Mundane"/"Mythic" across `Docs/ubiquitous-language/`); the executor adds **Rarity band** to the Traits or Encounters shard with this definition and cross-links the existing *Artifact Trait* entry (`Traits.md:61`).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every envelope, decay, chance, band rule and level is a named constant; the pool share is ruled and deferred to its reader rather than shipped dead |
| 2. Inspectability | PASS | `item.generated` carries the seed key that reproduces the item; `item.generate_fallback` names why; three debug levers and a CLI command |
| 3. Determinism | PASS | Per-table streams off a hashed seed key; the lifecycle `rng` is not consumed, so no other roll shifts; determinism asserted in the gate test |
| 4. Fail-soft | PASS | Every failure returns the empty masterwork of today; the generator is caught at its only call site |
| 5. Narrative over mechanical perfection | PASS | Items are authored ideas with prices, named and storied by the live world; the honest-vocabulary rule keeps the story true to what the engine does |
| 6. Additive over destructive | PASS with note | New modules and optional parameters; the one behavioural change to existing code is the carve exclusion, which removes a leak (a masterwork being handed out as a reward template) |
| 7. Performance budget | PASS | ~3–4 generations per 150 ticks; generation is table draws over a few hundred rows; the read-back runs in tests only |

## Done when

- [ ] A seeded medium world (CLI, seed 42 and seed 99, 150 ticks) mints its masterworks as `gen_masterwork_*` items with non-empty `effects[]`, a core-grown name and a maker's provenance; **zero** `item.generate_fallback` traces; `ITEM_GEN_MASTERWORK_ENABLED = false` reproduces today's run exactly
- [ ] On **both** mint paths (`strategic_craft_masterwork` and `cell.create.item`), the node's `name` after completion equals the `item.generated` trace's `name`, and the completion trace's `christenedName` equals it too — a regression test on each path, so christening can never silently rename a generated item
- [ ] The gate test passes: zero validator problems and zero read-back failures across `ITEM_GEN_GATE_SEEDS` × bands × origins; every core fires; every core has ≥ 2 signatures; the dishonest control batch fails; determinism holds
- [ ] A reward draw on a world holding a masterwork never offers the masterwork (regression test on the carve)
- [ ] `npm run cli` → `generate items 30 --seed 42` prints thirty readable cards with verdicts
- [ ] `ArtifactSheet` shows *Made by*, *What it does* and *The catch* for a generated item — browser-verify via Playwright at 1920×1080 on `?view=game&seeded&size=medium` after `await window.__DEBUG.mintGeneratedItem({ holder: '@hero', band: 3, origin: 'masterwork' })`, with the four-part evidence (screenshot, console, a `__DEBUG.getGeneratedItems()` assertion, UI-Laws line: 1, 4, 13/14, 17, 21, 33, 37, 56)
- [ ] `content-objects.md`, the UL **Rarity band** entry, `rulebook.md`, `interface-contracts.ts` + `interface-map`, `wiring-checklist.md`, and any wiki page whose `sources` match are updated in the same PR; systems inventory regenerated
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy` and the 30-tick CLI smoke pass
- [ ] Closing commit body includes the close keyword for THR-1570 on its own line

## Kill criteria

How we would know this plan was wrong, and what happens then:

- **The gate test cannot reach zero read-back failures for the ported cores** → shrink the honest vocabulary to what reads back; a core that cannot survive is dropped, never faked.
- **A seeded 150-tick run shows any `item.generate_fallback`** → a core or world-context bug; fix before merge, never ship with fallbacks.
- **Christian vetoes the band rule, the *Storied* ruling or the pool-share value** → each is one constant or one UL paragraph: revise on this ticket before build, or on THR-1626 for the share.
- **Christian reads a generated sample and calls it flat** → the machine stays; the cores are re-authored through the review path (CLI, thirty items), exactly as THR-1236 was judged.

## Coordination block

**Suggested model:** opus — a port of a 1700-line prototype into four engine modules plus a content file of eleven-plus authored cores with new second signatures and a read-back harness; judgement-heavy content and cross-module engine work.

**Parallel-safe with:** [THR-1623](https://linear.app/threadbare/issue/THR-1623), [THR-1622](https://linear.app/threadbare/issue/THR-1622), [THR-1621](https://linear.app/threadbare/issue/THR-1621) (culture and hex prose — `culture-content.ts` readers and hex lore; this plan does not edit `culture-content.ts`); [THR-1625](https://linear.app/threadbare/issue/THR-1625) (the `prevent_loss` condition-channel reader — the generator only emits the quintessence channel, and if 1625 lands first the executor may flip the row to `live` behind a read-back case).

**Mutex with:** none measured on 2026-09-26. Re-check at claim time for any In-Dev ticket editing `src/engine/strategicGraphOps.ts` (the masterwork mint), `christenCompletedWork` in `src/engine/strategicActionLifecycle.ts` (the naming seam), `src/engine/contentQuery.ts` (the template carve) or `src/components/Game/ArtifactSheet.tsx` (the sheet) — those four files are this plan's only edits to existing high-traffic code.

**Files to touch:**
- Create: `src/engine/itemGenerator/{generateItem,worldContext,validateGeneratedItem,describeItem,mintGeneratedItem}.ts` and `__tests__/itemGenerator.gate.test.ts` (+ a read-back helper)
- Create: `src/data/item-generator-cores.ts`, `src/data/item-generator-tables.ts`, `src/data/item-honest-vocabulary.ts`, `src/lib/drawTable.ts`
- Edit: `src/data/content-eval/drawTable.ts` (re-export from `src/lib`)
- Edit: `src/engine/strategicGraphOps.ts` (`mintMasterwork` optional `opts`, generator call, fallback)
- Edit: `src/engine/strategicActionLifecycle.ts` (pass `state.seed` and the final band at `mint_masterwork`; `christenCompletedWork` leaves a generated node's name and returns it)
- Edit: `src/data/undertaking-objects.ts` (Item `create` passes `ctx.state.seed`)
- Edit: `src/engine/contentQuery.ts` (carve excludes minted instances)
- Edit: `src/data/content-objects.ts` (`gen_` on `item_template`)
- Edit: `src/engine/artifactTraits.ts` (optional `level`)
- Edit: `src/components/Game/ArtifactSheet.tsx` (three optional blocks)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts` (three levers), `scripts/cli.ts` (`generate items`)
- Edit: `Docs/canon/content-objects.md`, `Docs/canon/rulebook.md`, a UL shard, `scripts/interface-contracts.ts`, `Docs/plans/wiring-checklist.md`

## Notes for the executor

- **Port, don't reinvent.** The prototype is on [`proto/thr-1570-item-generator`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1570-item-generator/Docs/audits/2026-09-24-proto-items). Its world tables for factions, places, heroes, events and monsters were faked; replace them with `worldContext.ts` reads. Its `fnv1a` and possessive helpers are replaced by `workNames.ts` (the one-namer contract). Its engine read-back is the gate — port it as tests, including the dishonest control batch.
- **Re-measure the vocabulary before trusting the prototype's table.** Three shapes have shipped since it was written (THR-1568, THR-1542, THR-1569). Flip a shape to `live` only with a passing read-back case. Leave `rest` / `spell_cast` refused unless you find a raise site (none on 2026-09-26).
- **Out of scope, deliberately:** generated Legendaries (a Legendary artifact is a separate content kind with its own trait graph); reward-draw, delve-loot and faction-gift minting points (THR-1626 carries the first); shops, crafting, item lifecycle; *What it does* for authored catalog items (their 26 disguised conditionals would read truthfully but oddly — a separate call); per-form art.
- **Do not edit `src/engine/traits.ts`** (hundreds of importers). The Storied level is written on the edge by `assignArtifactTrait` after `assignTrait` returns — mind that `updateEdge` merges properties.
- **The carve change moves reward-pool candidates** on any seed where a masterwork exists before the draw. That is the fix, not a regression; say so in the re-pinned shared-path test.
- **The christening regression tests must drive the multi-tick completion arm** (`strategicActionLifecycle.ts:1009` → :1048). The instant arm at :520 never calls `christenCompletedWork`, so a test that completes a cell instantly proves nothing about the name. Both mint paths are multi-tick today (`cell.create.item` via `UNDERTAKING_VERB_DURATION.create`).
- **Not a new node type.** A generated item is an `artifact` node with an extra property bag; if you find yourself wanting a `generated_item` type, stop — CLAUDE.md's no-invented-node-types rule applies.
- **The gate test may be slow** (it mints into test worlds). If it exceeds the fast lane's budget, tag it `// @vitest-lane heavy` and keep a small smoke (one seed, one band) in the fast lane.

> Brainstorm companion: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator-brainstorm.md`

## Intent-judge verdict

*2026-09-26, judged on fable, cold context; proposal at `Docs/plans/.intent-proposals/2026-09-26-thr-1570-seeded-item-generator.md`.*

- **Run 1 — Revise.** VIOLATION on wiring: `christenCompletedWork` renames every created work at completion, so the generated name would have been overwritten on both mint paths; GAP on kill criteria (they lived only in the proposal). Fixed: § Engine pillar *The name survives christening*, a wiring row, a Done-when on both paths, § Kill criteria, refreshed trigger-site line refs.
- **Run 2 — Allow.** All eleven dimensions PASS; the one-seam claim was traced two levels deeper than the plan cites (`cell.create.item` is multi-tick and completes through :1009 → :1048). Three non-blocking executor notes, the first carried into § Notes.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-26 (auditors on sonnet, run after the intent-judge Allow)*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 14-row constants table (band rule, decays, reroll cap, magnitude/break tables, Storied start levels, gate params) — no bare literals; pool-share value ruled but deferred with its reader named (THR-1626) rather than shipped dead |
| 2. Inspectability | PASS | `item.generated`/`item.generate_fallback` traces carry `seedKey` (reproduces item) and fallback `reason`; Wiring table maps every module to phase/trace/debug lever; 3 debug levers + CLI `generate items` |
| 3. Determinism | PASS | No `Math.random()`; seed key `gen_item:${worldSeed}:...` hashed via existing `hashSeed`; `drawFromTable` per-axis streams so one draw can't reshuffle another; lifecycle `rng` untouched; explicit determinism assertion in gate test |
| 4. Fail-soft | PASS | Fail-soft table enumerates 9 cases, all resolving to today's empty masterwork; generator call wrapped/caught in `mintMasterwork`; reroll cap before giving up; tick never halts |
| 5. Narrative over mechanical | PASS | Honest-vocabulary validator + read-back gate explicitly ties prose claims to real engine reads ("never promises what the engine does not do") |
| 6. Additive over destructive | PASS-with-note | Mostly additive (optional params, new modules); one deliberate behavioral change — `contentQuery.ts:195` carve now excludes minted instances, altering reward-pool candidates on worlds holding a masterwork. Plan justifies this as closing an existing leak, not a regression, and re-pins the shared-path test — but it is a real behavior change to shipped-world content selection, not purely additive |
| 7. Performance budget | PASS | ~3–4 generations per 150 ticks; generation is table draws over a few hundred rows; read-back harness runs only in tests, not the tick loop |

NFP AUDIT: PASS-with-notes (see row 6)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, graph nodes/edges, tick phases, resolution logic, and PRNG callouts all filled with concrete detail (modules, constants, seed-key scheme) |
| Content | present-but-thin | Attachment content, prose tables, data tables, and review path are substantive, but the template's "Encounter templates" subsection is absent with no N/A stated |
| UI | present-and-substantive | Player-facing display, event notifications, debug inspection, and visual presence (N/A with rationale) all filled; UI Laws cited |

Wiring check: Yes — the Wiring table connects each edited/created module to orchestrator phase, UI component, GameState field, trace type and debug visibility, and names the checklist update owed. Substrate-existence check: present and correctly targeted; every touched piece marked extends/preserve; no green-field duplication.

PILLAR AUDIT: PASS-with-notes — Content's missing "Encounter templates" subsection (unstated N/A) is the only gap. *(Resolved after the audit: § Content pillar → Encounter templates now states N/A with its reason.)*

### Vision audit

Premises touched: core loop (aftermath residue gains something durable — extended, no new beat); non-negotiables #2 narrative over mechanics, #3 prose not numbers, #4 graph node/edge — confirmed; design tension #2 systemic vs authored — extended (authored cores as the kitchen, world tables as the ingredients; free composition rejected per THR-1236); taste profile — numbers-in-UI anti-pattern avoided, graph edges not property-bag relationships confirmed.

Contradictions: none. North star indirect but consonant; core loop preserved; non-negotiables held; leans toward authorship by stated, deliberate balance; no anti-pattern reintroduced.

VISION AUDIT: PASS
