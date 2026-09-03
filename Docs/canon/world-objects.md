# World objects — the catalogue of things the world keeps

> **Step 0 for any work that adds, names, targets or retires a kind of thing in the world** — an undertaking object, a chip anchor, a new subtype, a content target rule. Load this before `graph.ts`. The generated companion, [`world-objects.generated.md`](world-objects.generated.md), is the current census; this page is what the kinds *mean* and how to change them. Ratified by Christian 2026-09-03 (THR-1394); plan doc [`Docs/plans/2026-09-03-thr-1394-world-object-model.md`](../plans/2026-09-03-thr-1394-world-object-model.md).

**Status:** live · **Owner:** Engine · **Registry:** [`src/data/world-objects.ts`](../../src/data/world-objects.ts) · **UL:** [Graph.md](../ubiquitous-language/Graph.md)

## The rule

A **world object** is a node type (or an edge type, or a slice of `GameState`) plus a subtype the game names. A **variant** is a subtype or a class — never a new node type. The graph unions in `src/types/graph.ts` are the *shape*; this catalogue is the *vocabulary*; the two are pinned to each other by a contract test and a generator that fails by name.

Two words for one thing is the drift this page exists to stop. Where the code word and the game word differ, the game word is the one every player-facing surface and every plan doc uses, and the registry row records both.

## The catalogue

| Kind | What it is | Shape | Classes |
|---|---|---|---|
| **Area** | A multi-hex cluster by dominant terrain, containing its Locations. Geographic only — political territory is a Faction's `controls` edges. | `region` node | — |
| **Hex** | A tile: terrain, features, fog. The one thing that is not a node. | `GameState.tiles[]` | — |
| **Location** | The outer place tier: where mortals live, hold, ruin and wonder. | `location` node without `parentLocationId`; `locationSubtype` | settlement · stronghold · holy_place · ruin · wild · wonder · deposit |
| **Place** | The inner tier — an inn, a granary, a gatehouse, a grove, a spring — inside a Location. Not always built. (Code word: *sublocation*.) | `location` node with `parentLocationId`; `sublocationTypeId` | military · scholarly · arcane · commerce · religious · cultural · underworld · nature · authority · borderlands |
| **Route** | An edge between two Locations that grows an identity node when it becomes nameable, ownable, blockadable or consecrated. | `road` · `trades_with` · `sacred_route` edges; identity node `location:trade_route` | road · trail · trade_lane · pilgrim_way · portal |
| **Mortal** | An individual actor. (Engine word: *agent*.) | `actor` · `actorType: individual` | roles, callings, spotlight tiers are variants |
| **Ascendant** | The player and rival ascendants; an ordinary actor architecturally. | `actor` · `actorType: ascendant` | — |
| **God / Spirit** | Gods and place-spirits; dormant. | `actor` · `actorType: god \| place_spirit` | — |
| **Faction** | A structured social entity holding territory through `controls`. | `actor` · `actorType: faction` | — |
| **Culture** | A people; mortals and locations `belongs_to` one. | `actor` · `actorType: culture` | — |
| **Company** | A travelling group; never "party". | `actor` · `groupKind: company` | — |
| **Army** | A company kind with stance, supply, momentum. | `actor` · `groupKind: army` | — |
| **Network** | A company kind that does not travel; dormant. | `actor` · `groupKind: network` | — |
| **Battle** | An engine detail kept as an actor node so participants can `participates_in` it. | `actor` · `groupKind: battle` | — |
| **Companion** | A face that walks with one mortal; never an agent. | `companion` node | — |
| **Item** | A possession. | `artifact` · `attachmentCategory: possession` | arms · mounts_and_beasts · vestments · tomes_and_scrolls · relics_and_talismans · tools_and_instruments · provisions |
| **Legendary artifact** | An item with its own trait graph, bonded rather than possessed. | `artifact_legendary` node | — |
| **Holding** | Not a thing — the *ownership* of a Location, Place or Route. The `owns` edge is the truth; the artifact face is a sheet convenience. (Player word: *freehold*.) | `owns` edge; mirror `artifact:holding` | — |
| **Power** | Spell · bestowal · innate. No node shape of its own yet; dormant. | `trait` · `subcategory: bestowed` (partial) | spell · bestowal · innate |
| **Condition** | Wounds, diseases, strains, blessings, curses, scars. | `trait` · `subcategory: condition \| scar` | condition · scar |
| **Trait** | The graph's vocabulary of what a thing *is*: shared definitions, per-bearer state on `has_trait`. Tags refine traits; they are not an object taxonomy. | `trait` · `subcategory` ∈ nine | — |
| **Agreement** | A favour owed, or a mark (a secret held as leverage). | `owes_favor` · `knows_secret_of` edges | favor · mark |
| **Standing** | How two parties stand: reputation, relationship arc, quarrel. | `reputation_with` · `relates_to` · `hostile_to` edges | reputation · relationship · quarrel |
| **Ambition** | What a mortal wants. | `ambition` node | — |
| **Undertaking** | A work in progress — bookkeeping, not an entity (THR-1280). | `GameState.strategicState.projects[]` | — |
| **Event** | What happened; the chronicle's substrate. One key: `eventType`. | `event` node | — |
| **Sphere · Reach** | Axes of the cosmos, not objects. | `GameState.cosmology` · `ReachDomain` | — |

Templates (`action_template`, `encounter_template`) are authored content that happens to live in the graph — registered as `content`, never a thing a player points at. Three union members have no world behind them: `resource` and `relationship` retire in slice 2 with their readers repointed; `cosmology` stays DORMANT unless its two `contextBuilder` reads repoint green. `sublocation` is reader-accepted legacy (THR-1177).

## What the model settles

- **Resources are stocks, not nodes.** A Location carries `properties.resources`; **Deposit** is a Location class over the six extraction subtypes. The economy reads stocks; nothing mints a `resource` node.
- **Traits are shared definitions with edge state.** The `has_trait` edge carries per-bearer state. Conditions and experience are minted one node per bearer today — that is drift, and its repair is its own ticket.
- **Attachment is a code umbrella, not a world object.** It spans three graph shapes; the catalogue names each shape by its game word — Item, Condition, Power, Agreement — and never "attachment".
- **A Route is an edge first.** Traversal walks edges. The identity node is grown, never minted first, and only the trade route grows one today.
- **Holding is ownership, not a thing.** The undertaking model targets the Location, Place or Route; the Holding is what a `hold` verb creates.

## The four guards

| Guard | What it catches | Where |
|---|---|---|
| **Write-time** | A writer minting a discriminator value no kind claims — named the tick it first happens, once per `(type, value)` per session, never a crash. | `WorldGraph.addNode` → [`src/types/nodeSchema.ts`](../../src/types/nodeSchema.ts) (dev mode) |
| **Contract test** | A union member no kind claims; a `WorldRefKind` no kind projects onto; a class member outside its kind's values; a writer that does not exist; an unregistered value in a generated world. | [`src/data/__tests__/worldObjects.test.ts`](../../src/data/__tests__/worldObjects.test.ts) |
| **Generator** | Drift badges on a two-seed census — UNREGISTERED values and PHANTOM union members / content target names; `--check` exits non-zero above `UNREGISTERED_SUBTYPE_MAX` / `PHANTOM_TARGET_MAX` (both 0). | `npm run generate-world-objects[:check]` → [`world-objects.generated.md`](world-objects.generated.md) + the served [World Objects](../../public/world-objects-reference.html) page |
| **Process** | A kind, class or subtype that reaches code without a name. | This page + the rule below |

## Adding a kind, class or subtype

One PR, three edits, no exceptions:

1. **A row in the registry** — `src/data/world-objects.ts`. A subtype joins an existing kind's `discriminator.values` and a class; a class is a new key in the kind's `classes`; a kind is a new `K({...})` with its `gameWord`, `ulTerm`, `worldRef`, `shape`, `owningSystem`, `writers`, `status`, `note`.
2. **A UL term** — the shard the `ulTerm` names. The game word is the term; the code word is an alias.
3. **A row on this page** — the catalogue table above.

A **new node or edge type** additionally keeps the load-bearing rule (full design before code — CLAUDE.md § Load-Bearing Architectural Decisions) and names its kind in the same PR; the contract test fails by name on a union member no kind claims, so it cannot be forgotten.

**Cautious expansion, in one sentence:** before a new kind, ask whether it is a class or a subtype of one that exists — the answer is almost always yes, and the registry note on the nearest kind says what was decided last time.

## Reading it from the game

- **Headless:** `npm run cli` → `objects` prints every kind with its live count in the running world and the write-time warnings raised so far.
- **Browser:** the served [World Objects](../../public/world-objects-reference.html) reference page (Design Reference Wiki → Deep Reference).
- **Chips:** every kind names the `WorldRefKind` it projects onto; a kind with `worldRef: null` is one no chip can route to yet (see [`src/types/worldRef.ts`](../../src/types/worldRef.ts), THR-1212).

## Stale sources to avoid

- Any page or plan that calls a Place a "room" or a "structure" — both were considered and rejected (a place is not always built).
- Any surface that treats *attachment* as an object type — it is three shapes.
- The `undertaking-objects.ts` registry as it stood before THR-1392 slice 4 — it is redrawn on this catalogue when that ticket resumes.
