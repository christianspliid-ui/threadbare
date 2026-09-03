> **title:** `Undertakings as verb × object type — THR-1392`
> **linear_issue:** THR-1392
> **author:** `Claude Code`
> **created:** 2026-09-03
> **three_pillars:** Engine `done — an object-type registry with typed shapes, six generic verbs, one resolver in place of the per-template switch` · Content `done — the 64 templates migrate to verb × object lexicon lines or retire; authored flavour becomes per-object-type and per-verb, not per template` · UI `done — the Package View and moment card read the same surfaces; one new block (the object) on the Package View, browser-verified`

# Undertakings as verb × object type — THR-1392

*An undertaking should be a verb applied to a thing the world already has, with the flavour coming from that thing and the mortal doing it; today it is one of sixty-four hand-written fictions, most of which never fire and a quarter of which change nothing when they do.*

## Why this is load-bearing

Christian's framing (chat, 2026-09-03): *"what i am afraid of on the undertaking is that we technically make an extreme amount of variants that never fire… a chart, if in the game, would be an attachment, and so for me the undertaking should be a generic 'destroy attachment' undertaking with flavour text from the attachment being destroyed and the destroyer."* This plan compares the shipped model against that one on scalability, connectivity and simplicity, with the code's own numbers, and names the model to build.

**The measurement (census of every template in `TEMPLATE_REGISTRY`, 2026-09-03, `main` at `91b28194`; the probe runs are those of THR-1388):**

| | count | what it says |
|---|---|---|
| hand-written templates | 64 (create 23 · change 16 · gather_info 10 · destroy 9 · control 6) | the supply is authored, one fiction each |
| templates in a kind row | 28 of 64 | the grid that promises counter-play covers less than half |
| templates whose target rule is "a settlement by subtype" | 58 of 64 | almost nothing targets the object it acts on; the object is implied by the fiction |
| templates with `no_mutation` | 15 of 64 (23%) | they complete and change nothing — including 5 of the 9 destroys |
| distinct mutation ops the engine hand-writes | 16 hint types + 5 arms keyed on template ids, in a 373-line switch (the critic's count from the union; the census's 13 missed three) | every new object shape is a new engine arm |
| templates the board started in 300 ticks (seeds 42 / 99) | 28–29 distinct of 64 | more than half never fire on a default seed |
| harm-capable templates that could reach a board before THR-1388 | 4 of 9 | reachability is a list position in an ambition profile |
| object types the world already has with a node/edge shape | 9 (see § Substrate inventory) | the substrate the verbs should act on exists |

Two of those numbers decide the question. **58 of 64 target a settlement** means the shipped model never modelled the object at all — a template *about* a chart targets a town, and the chart is a word in the prose. **15 `no_mutation`** means the model lets a fiction ship without a world-write, which is exactly the "variants that never fire" — or fire and leave nothing — that the director is afraid of.

## The two models, side by side

**A — authored kind-row templates (shipped).** A template is a fiction: `strategic_burn_the_charts` carries its own prose, difficulty, payoff, target rule and mutation hint; templates are grouped into kind rows (8) so each kind has a destroy. Adding an undertaking = writing a template, placing it in a row, naming it in an ambition profile, and — when its object is new — adding an engine arm and a graph op.

**B — verb × object type (proposed).** An undertaking is one of six generic verbs — found, improve, use, control (in two variants: claim what nobody holds, seize what someone else does), undo, survey — applied to one of the world's object types. Each **object type** is registered once with a typed shape (what node or edge it is, what owns it, how its tier is read) and the semantics of the verbs that apply to it, owned by the system that already owns the object. A **template** is a verb × object cell, derived, not authored: its target rule is "an object of this type (owned by someone else, for seize and undo)", its tier and payoff are read off the object, its prose is composed from a per-verb line set and the object's own name and lore plus the actor's reach and calling. Adding an undertaking = nothing; adding an **object type** = one registry entry plus its verb semantics in its own system; adding flavour = lexicon lines.

| axis | A — authored templates | B — verb × object |
|---|---|---|
| **Scalability** — what grows when the world grows | Nothing. Content is the pack file; 64 templates give 64 possible acts regardless of how many attachments, rooms or routes the world holds. Variety is authored (28–29 of 64 fire). | The act space is verbs × the objects that exist: a world with 200 attachments and 40 routes offers hundreds of concrete `undo × attachment` and `seize × route` acts from one cell each. Variety comes from who owns what. |
| **Scalability** — what it costs to add | A new fiction: ~60–90 lines of pack, a row entry, a profile entry; a new object shape: an engine arm + a graph op (the 373-line switch grows). Six at a time through a factory. | A new object type: one registry entry + verb semantics in the owning system (≈ the size of one graph op today) and lexicon lines; it then supports every verb. A new verb: one resolver arm + lines per object type. |
| **Connectivity** — what it reads | Settlement subtypes (58/64), two group targets, four co-located actors, ambition profile lists, a `motiveGate`. It never targets an attachment, a route, a faction or a room as the object it acts on (the `faction` / `trade_route` / `sublocation_type` rules exist and are unused); the object is prose. | The object's own system: holdings (`owns`), attachments (rarity, lore), sublocations (type), routes (`trades_with`), groups, factions, marks (`knows_secret_of`), control claims (`controls`). Every verb enters through the seam that system already exposes. |
| **Connectivity** — what it writes | 49 of 64 through four generic ops (`record_intelligence`, `modify_location_property`, `create_sublocation`, `no_mutation`); 15 through 13 bespoke ops; 15 write nothing. | Every completion writes through the object type's declared semantic (found / improve / seize / hold / undo / survey), so the write set is never empty by construction and the live proof reads the object, not a per-hint switch. |
| **Simplicity** — the engine | 13 hint types + 5 template-id arms + 21 graph ops + `objectShape` as unread prose. | One resolver: resolve object → dispatch verb to the object type's semantics. `objectShape` typed and read. The five template-id arms and `no_mutation` disappear. |
| **Simplicity** — the content | 64 files' worth of fiction, each carrying numbers a designer tuned by hand and a target rule that is wrong 58 times out of 64. | Six verb line-sets × object-type lexicons, plus optional flavour overrides for the cells that earn them. Numbers derived from the object. |
| **Where taste lives** | In each template's sentences. | In the verb lines, the object lexicons, the christening roots, and the overrides — fewer places, all reused. |
| **Risk** | Known: hollow destroys, unreachable templates, an engine that knows content by name. | New: generic prose reading flat (Tension §2's drift signal); objects whose tier derivation is wrong; the migration of 64 templates. Each has a named mitigation below. |

**Verdict:** B. The shipped model's grid was the right instinct pointed at the wrong noun: it grouped *fictions* by kind when it should have registered *objects* and let the verbs be generic. B is what the kind rows were reaching for, with the object made real.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Ambitions & Undertakings — candidate generation, kind rows, contract, checkpoints, binder, motive gate, harm, christening, moments | 🟢 ACTIVE | **extends** — the object-type registry replaces the kind-row registry (rows become object types); everything above the mutation layer is untouched |
| Strategic Projects & Control — `strategicActionLifecycle.executeInstantMutation`, `strategicGraphOps` | 🟢 ACTIVE | **replaces** the per-template switch with one resolver; the 21 graph ops survive as the object types' verb semantics |
| Attachments, Items & Possessions (`holdings.ts` `owns`, `attachments.ts` categories, `mintMasterwork`, `mintTreasureMap`) | 🟢 ACTIVE | **connects** — the `attachment` object type; found / seize / undo ride `grantHolding` / `transferHolding` / `razeHolding` + the removal funnel |
| Sublocations (`createSublocation`, `checkDissolutions`, `sublocationShape`) | 🟢 ACTIVE | **connects** — the `room` object type |
| Settlements (`createLocation`, prosperity, `FOUNDED_SETTLEMENT_INITIAL_PROSPERITY`) | 🟢 ACTIVE | **connects** — the `settlement` object type; undo = ruin (prosperity floor + `ruined` flag the battle aftermath already reads) |
| Trade routes (`createTradeRoute`, `blockadeRoute`, route identity node) | 🟢 ACTIVE | **connects** — the `route` object type |
| Companies & Group Travel (`raiseWarband`, `reinforceWarband`, `disbandGroup`, `groupShape`) | 🟠 DORMANT per the inventory (built; the travel half idle) | **activates** — the `company` object type (group kinds company and network) gives the group system its first generic verbs; nothing is rebuilt |
| Factions & Succession (`foundFaction`, `applyPlantSchism`, `phaseSchismResolution`) | 🟢 ACTIVE | **connects** — the `faction` object type; undo = schism |
| Secrets & Favors (`knows_secret_of`, `mintLeverageMark`, `pressTheMark`) | 🟢 ACTIVE | **connects** — the `mark` object type (an edge object) |
| Control (`claim_control` execution mode, `StrategicControlState`, upkeep, degradation, collapse) | 🟢 ACTIVE | **connects** — `control:claim × settlement` dispatches to this mode unchanged (it never reaches the mutation switch, `strategicActionLifecycle.ts:488`, and does not need to); the `control` verb's other variant, `seize`, and its transfer semantics on attachments, rooms, routes and companies ride the holdings writers |
| Intelligence records (`actor.properties.strategicIntelligence`, 15 templates, zero engine readers) | 🟢 ACTIVE (property bag, write-only) | **deferred** — the `knows_of` edge is knower → location and refuses a duplicate, so it cannot carry typed, repeated intelligence without a schema change; and nothing in the engine reads the records today. The 15 `record_intelligence` templates stay on the legacy flag; an `intelligence` object type lands only with its reader (a named `Deferral` filed at slice 1) — a `survey` with no reader is decoration, and the plan will not ship it as a cell |

Population consumed at runtime (seed 42, medium, tick 0 → 300, from the THR-1388 quarrel probe): 112 → 147 owned or controlled locations, 0 → 44 companies, plus every attachment any mortal holds. That is the act space B enumerates; A enumerates 64 fictions.

## Engine pillar

### Systems design

**Object types.** `src/data/undertaking-objects.ts` registers each type once:

```ts
interface UndertakingObjectType {
  id: 'attachment' | 'room' | 'settlement' | 'route' | 'company' | 'faction' | 'mark';
  shape: { nodeType?: NodeType; edgeType?: EdgeType; discriminator?: (n) => boolean };   // typed, read by the resolver
  ownedVia: readonly EdgeType[];       // node objects: 'owns' | 'controls' | 'commanded_by' | 'possesses'; edge objects: the edge's own source
  tierOf: (graph, handle) => 1 | 2 | 3; // per-type source, table below
  verbs: Partial<Record<UndertakingVerb, ObjectVerbSemantic>>;  // what found / improve / use / control / undo / survey do to THIS type
  lexicon: WorkLexiconId;              // the christening roots and nouns (the per-type lexicon tables are a slice-2 deliverable — workNames.ts names them and does not have them yet)
  harmOnUndo: UndertakingHarmClass;    // the grievance lane's read
}
```

`ObjectVerbSemantic` is a function `(graph, actor, handle, ctx) => GraphOpResult` owned by the object's system — `razeHolding`, `disbandGroup`, `applyPlantSchism`, `blockadeRoute`, `transferHolding`, `createSublocation`… the ops that exist today, re-homed under the object they act on instead of under the template that mentioned them. **The critic's correction stands:** these are authored decisions, on the order of thirty, and the grammar does not write them.

**Object handles and owners (blocking finding 2).** Today the whole pipeline is keyed on `targetNodeId` and `resolveTargetOwners` walks only `controls`, `commanded_by` and `owns` (`undertakingMotive.ts:80–86`), so an attachment (held by `possesses`) or a mark (an edge) has no owner and the motive gate refuses it as unowned. The plan adds an **object handle** — `{ kind: 'node', nodeId } | { kind: 'edge', edgeId }` — carried on the candidate and the project beside `targetNodeId` (which stays as the *place* of the work, for distance and moments); `resolveTargetOwners` gains `possesses` for node objects and *the edge's source* for edge objects; `findValidTargets` gains one rule, `{ type: 'object', objectTypeId, ownership: 'other' | 'own' | 'any' }`, that enumerates handles of the type in range through the registry's `shape`. `undertakingMotive.ts`, `strategicActionCandidates.ts` and the binder's target reads are in files-to-touch for this.

**Verbs.** `UndertakingVerb = 'found' | 'improve' | 'use' | 'control' | 'undo' | 'survey'`: `create` → found, `change` → improve **or use**, `control` → control, `destroy` → undo, `gather_info` → survey. **`control` has two variants, decided by what the resolved object's ownership actually is** (Christian, 2026-09-03: *"together they form 'control' right? … one seems to be establishing an initial control, the other is taking over control from someone else"*): **claim** — nobody holds it; the actor establishes control (for a settlement, the existing sustained `claim_control` mode with its upkeep, degradation and collapse, unchanged; for an attachment, a room, a route or a company, `grantHolding`); **seize** — someone else holds it; the actor takes it (`transferHolding`, which the world has and no template ever offered), carrying the motive gate and `holding_seized`. The six shipped `control` templates become `control:claim × settlement` and keep their execution mode. **`use`** is the self-spend the kind rows already distinguished (*"a self-spend is a use, not a counter"* — the mark row): pressing a mark, following a chart, burning one's own mark — own object only, no gate, no harm. `undo` and `control:seize` carry the motive gate and a harm class by rule; they require `ownership: 'other'`, `control:claim` requires `'unowned'`, `use` and `improve` require `'own'`, and the cross-family rule on the rows (a kind's destroy comes from another family) is kept as a **per-type rule** on `undo` so a holder cannot undo their own object through the counter-play verb.

**Execution mode by verb.** `survey` and `use` default to `instant` (the 19 instant templates today are 9 gather_info, 5 destroy, 5 change; the 5 instant destroys become checkpointed `undo` deliberately — an instant destroy was the shape that shipped five hollow ones); `found`, `improve`, `undo` and `control` over an attachment, room, route or company are multi-tick with `UNDERTAKING_VERB_DURATION`; `control × settlement` is the sustained `claim_control` mode, not a project. A cell override may pin the mode.

**Templates are cells.** `generateStrategicCandidates` enumerates verb × object-type cells the actor's ambition profile prefers, resolves candidate handles of that type in range under the cell's ownership rule, and scores them with tier and payoff read off the object. A cell can carry an **authored override** (prose, cast, creation effects, a narrower target predicate, a pinned mode) — that is where a designer's taste goes when a cell earns it — but a cell with no override is still a complete undertaking.

**Tier per object type (major finding 6).** No object carries a universal tier today (`mintTreasureMap` stamps 1, `mintMasterwork` defaults 2, seeded attachments carry none, companies and routes none), so each type names its source:

| object type | `tierOf` reads | T1 / T2 / T3 |
|---|---|---|
| attachment | `properties.tier` when stamped, else category | provisions, tools, arms, vestments / tomes, relics, mounts / legendary artifacts |
| room | sublocation type table | granary, warehouse, workshop / shrine, garrison, chapter, circle / court, estate |
| settlement | `locationSubtype` | hamlet, camp / village, town, port, market / city, capital |
| route | hex length of the `trades_with` pair | ≤ 3 / ≤ 6 / longer |
| company | roster size | ≤ 3 / ≤ 8 / larger |
| faction | member count | ≤ 5 / ≤ 15 / larger |
| mark | `magnitude` on the edge | ≤ 0.4 / ≤ 0.7 / higher |

A type whose source is missing on a given object defaults to T2 **and traces `tier_defaulted`**; the acceptance counts those traces and fails the slice if any type defaults on more than a tenth of its objects on the default seeds.

**One resolver.** `resolveUndertakingCompletion(graph, project)`: look up the object type, dispatch the verb to its semantic, emit `strategic_world_change` with the object id. The 373-line switch, the 13 hint types and the 5 template-id arms are deleted.

**Prose (major finding 5 — this is a deliverable, not a promise).** Today the strategic path renders `activityProse[0]` verbatim (`strategicPresentation.ts:211`, `ambitionTick.ts:734`) and `STRATEGIC_PROSE_TOKENS` is an empty set: no substitution chain exists. The plan adds `resolveUndertakingProse(line, ctx)` in `src/engine/undertakingProse.ts` — the one place the four slots `{object}`, `{owner}`, `{actor}`, `{place}` are filled — from the object's own name and lore (an attachment's `description`, a room's type word, a settlement's name, a route's christened name), the owner's name, and the actor's calling word, routed through the existing enrichment layer so the sheet and the moment card render chips (Law 1) rather than bare names; `STRATEGIC_PROSE_TOKENS` gains the four tokens so the contract's `tokens` block checks them. Per verb, a small authored line-set (three to five activity lines, three to five completion lines, GM narration) with those slots, in `src/data/undertaking-verb-prose.ts`. The christening machinery (`generateWorkName`: reach roots, foundation roots, per-object nouns) already composes names this way and is kept as the naming of what `found` makes; its per-type lexicons (`workNames.ts:144` says "slice 5's") are written in slice 2 of this plan.

### Graph nodes / edges

No new node or edge type. `undo × settlement` sets `locationSubtype: 'ruins'` after the prosperity floor — the shape `battleAftermath.ts:150` already reads (`!== 'ruins'`), not a new flag. Intelligence stays where it is until its reader exists (§ Substrate inventory). Everything else uses the edges the object systems already use; the object handle is carried on the candidate and the project as data about the work, and the relationship it names is the edge it points at.

### Tick phases

Unchanged: `phaseAgentDecision` (candidates), `phaseStrategicProjects` (checkpoints, completion → the resolver). No new phase.

### Resolution logic

Candidate scoring unchanged in shape; tier and payoff come from `tierOf(object)` and a per-verb payoff table (`UNDERTAKING_VERB_PAYOFF[verb][tier]`) instead of per-template numbers. Checkpoint dice unchanged.

### PRNG callouts

None new. Object enumeration is sorted by id then distance (deterministic); prose line choice uses the existing `pickWithRepetitionGuard` with the project's seeded rng.

## Content pillar

### The migration of the 64

| shipped templates | become |
|---|---|
| 10 `create_sublocation` (granary, warehouse, garrison, shrine, chapter, circle, seat, patronage, civic works, holy site) | `found × room`, the room type as the object's discriminator; each keeps its lines as a **cell override** if its prose is worth keeping |
| `found_settlement`, `grow_settlement`, `raze_settlement`, `fortify_*`, `consecrate_*`, `organize_festival`, `preach_masses` | `found / improve / undo × settlement`; the improve variants become lexicon lines keyed on the property they move |
| `establish_trade_route`, `extend_route`, `blockade_route`, `establish_sacred_route` | `found / improve / undo × route` |
| `recruit_warband`, `reinforce_warband`, `suborn_warband`, `establish_spy_network`, `extend_reach`, `sever_network` | `found / improve / control:seize / undo × company` (`GroupKind` company and network — an order is a faction, `foundFaction`, so `found_order` → `found × faction`) |
| `craft_masterwork`, `improve_masterwork`, `destroy_masterwork`, `chart_the_wilds`, `burn_the_charts`, `follow_the_chart`, `commission_quest` | `found / improve / use / undo × attachment` — the chart is an attachment (`mintTreasureMap` already mints one); following it is `use` |
| `cultivate_informant`, `press_the_mark`, `burn_the_mark`, `expose_mark` | `found / use / undo × mark` (press and burn are `use`, the holder's own spend; expose is `undo` by someone else) |
| 10 `gather_info` + `write_treatise`, `research_archive`, `investigate_anomaly`, `expose_cache`, `buy_influence`, `secure_office`, `negotiate_storage` (the 15 `record_intelligence` templates) | **stay on the legacy flag** until the `intelligence` object type lands with its reader (deferred, § Substrate inventory) |
| 6 `control` (`claim_territory`, `maintain_*`, `police_doctrine`, `guard_knowledge`) | `control:claim × settlement` — the cell dispatches to the existing sustained `claim_control` mode; their prose becomes the settlement type's control lines or cell overrides |
| `train_apprentice`, `walk_the_unmapped`, `mount_expedition`, `recruit_companions`, `draft_plans` | folded into `survey` / `improve` cells where their write is real; **retired** where their only product was prose — the retirement list is the executor's first deliverable and is reviewed in chat |

Nothing is deleted before its cell exists and proves live.

**Ambition profiles (major finding 3).** `strategicProfile.templateIds` names all 64 ids today and is read by `strategicActionCandidates.ts:126,173`, `strategicKindReachability.ts:129`, `decisionBoard.ts:374`, `calling.ts:113` and `covetRivalry.ts:61`. The profile gains `cells: readonly { verb: UndertakingVerb; objectTypeId: UndertakingObjectTypeId; overrideId?: string }[]` beside `templateIds`; while `UNDERTAKING_MODEL = 'templates'` the walk reads `templateIds`, on `'cells'` it reads `cells`, and the five readers above are each touched in slice 3 to read the cells (the reachability contract block and the covet counter's "destroy-heavy" test read `preferredVerbs`, which is unchanged). The `STRATEGIC_MAX_CANDIDATES_PER_AMBITION` walk and its list-position starvation (THR-1309, THR-1388) disappear with the list: cells are enumerated by object, not by position.

### Encounter templates

N/A — no encounter content; the harm an `undo` or `control:seize` emits feeds the catalyst encounters the shipped templates already name, and those ids move onto the cell overrides that keep them.

### Prose tables

Six verb line-sets (activity + completion, three to five lines each, GM narration, tokens for object / owner / actor / place) in `src/data/undertaking-verb-prose.ts`; per-object-type lexicons (nouns, roots) extend `workNames.ts`'s existing tables. Cell overrides keep the best of the shipped prose.

### Attachment content

Attachments gain nothing new; their existing `name`, category and description are what the `attachment` object type reads for flavour and tier (rarity).

### Data tables

`undertaking-objects.ts` (the registry), `UNDERTAKING_VERB_PAYOFF`, `UNDERTAKING_VERB_DIFFICULTY`, the harm-on-undo table.

## UI pillar

### Player-facing display

The moment card and the mortal sheet render what they render today (moments, hostility lines, the activity line); nothing restyles. The one visible change is the *words*: the activity and completion lines now name the object and its owner as chips (Law 1) through `resolveUndertakingProse`. Tier and payoff never render as numbers (Law 13/14).

### Event notifications

Unchanged — the moment stream (`started`, checkpoint, terminal) is the notification surface, and the resolver feeds the same records the checkpoints feed today.

### Debug inspection (DebugPanel)

The **Package View** (`?view=cms#undertaking-packages`) gains one block — *The object* — showing the cell's object type, its shape, its owner rule, and, for a concrete project, the object it resolved to as a chip with tooltip and link (Law 21). The CMS entry lists cells instead of templates. `undertakings` in the in-game and headless CLI shows `verb × object` and the object's name per project. Verified with Playwright at 1920×1080 on the Package View (DOM surface; no WebGL in scope). Laws engaged: 1, 13/14, 17 (a cell with no override shows its derived lines, never an empty block), 21, 33, 37, 56.

### Visual presence (HexMapV2)

N/A — undertakings have no map signifier today and this plan adds none; the object acted on already has its own presence (a settlement, a room label, a route line).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|------------------|
| `undertaking-objects.ts` (registry) | — (data) | Package View object block | — | — | `?view=cms#undertaking-packages`, `check:undertaking` |
| `strategicActionCandidates.ts` (cell enumeration) | agent decision | — | `strategicState.projects` (unchanged shape + `objectTypeId`, `verb`) | `strategic_candidate_board` (refusals gain `no_object_in_range`) | `encounters` CLI block |
| `undertakingResolver.ts` (completion) | strategic projects | moment card (unchanged) | graph | `strategic_world_change` (+ `objectTypeId`, `objectId`, `verb`) | `undertakings` CLI, `check:undertaking-live` |
| `undertaking-verb-prose.ts` + `workNames.ts` | — | moment card, sheet | — | — | Package View |
| Player controls | — | N/A — autonomous world behaviour; the god nudges through the existing levers | — | — | — |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `UNDERTAKING_VERBS` | `['found','improve','use','control','undo','survey']` | the closed verb set; `control` resolves to a variant by ownership — `claim` (nobody holds it) or `seize` (someone else does) |
| `UNDERTAKING_VERB_DIFFICULTY[verb][tier]` | found 0.45/0.5/0.55 · improve 0.4/0.45/0.5 · use 0.35/0.4/0.45 · control:claim 0.4/0.45/0.5 · control:seize 0.55/0.6/0.6 · undo 0.5/0.55/0.6 · survey 0.35/0.4/0.45 | checkpoint difficulty by verb and object tier — inside the existing tier bands |
| `UNDERTAKING_VERB_PAYOFF[verb][tier]` | inside `UNDERTAKING_TIER_PAYOFF_BANDS` per tier; undo and control:seize at the band's top | the board's payoff by verb and object tier |
| `UNDERTAKING_VERB_DURATION[verb][tier]` | found/improve/control/undo 4/6/8 checkpoints; use and survey instant by default; control × settlement is sustained (the existing `claim_control` mode with upkeep), not a project | project length |
| `MOTIVE_GATED_VERBS` | `['control:seize','undo']` | which verb variants require a quarrel |
| `OWNERSHIP_BY_VERB` | found `any` · improve `own` · use `own` · control:claim `unowned` · control:seize `other` · undo `other` · survey `any` | the cell's default ownership rule; `control` picks its variant from what the resolved object's ownership actually is |
| `HARM_ON_UNDO` | per object type: attachment `property_destroyed`, room `property_destroyed`, settlement `property_destroyed`, route `network_severed`, company `holding_seized`, faction `network_severed`, mark `network_severed` | the grievance lane's read |
| `TIER_DEFAULT_SHARE_MAX` | 0.1 | the share of a type's objects that may fall to the default tier before the slice fails |
| `HARM_ON_SEIZE` | `holding_seized` | — |
| `CELL_OVERRIDE_MAX_PER_CELL` | 3 | how many authored flavour variants one cell may carry before it is a pack again |

## Tracing

```ts
// strategic_world_change gains the object — every completion names what it acted on
interface StrategicWorldChangeTrace extends TraceBase {
  category: 'strategic_world_change';
  actorId: string;
  verb: UndertakingVerb;
  objectTypeId: UndertakingObjectTypeId;   // new
  objectId: string;                        // new — the node or edge id
  graphOps: string[];
  affectedNodeIds: string[];
  summary: string;
}
// undertaking_cell_unreachable — emitted once per run per cell that has no object in the world (NFP #2: a cell nobody can ever take is the new "variant that never fires")
interface UndertakingCellUnreachableTrace extends TraceBase {
  category: 'undertaking_cell_unreachable';
  verb: UndertakingVerb;
  objectTypeId: UndertakingObjectTypeId;
  reason: 'no_object_exists' | 'no_owned_object' | 'no_semantic_declared';
}
```

Registered at the four sites.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Object type has no semantic for the verb | cell not enumerated; `undertaking_cell_unreachable` once per run |
| No object of the type in range | refusal `no_object_in_range:<type>` on the board trace; nothing starts |
| Object removed mid-project (battle, dissolution) | the binding registry's removal hook already severs; project fails with the existing complication |
| `tierOf` throws or returns out of range | tier 2; trace notes `tier_defaulted` |
| A cell override's prose is missing a token | the verb's default line renders; Law 43 guard as today |
| Migration finds a template with no cell (retire list) | stays in a `legacy` pack behind a flag until the retirement is reviewed; never silently dropped |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/strategicAction.ts` | high (the template type) | `StrategicActionTemplate` gains `verb: UndertakingVerb` and `objectTypeId`; the old `verb` union stays as an alias during migration, so importers compile unchanged until the flag flips |
| `src/types/trace.ts` | 116 | additive fields + one category |
| `src/engine/strategicActionLifecycle.ts` | moderate | the switch is deleted behind the flag; nothing else changes shape |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Interface impact

| Contract | Disposition |
|---|---|
| `factory-pack-registry` | retire in favour of the object-type registry once the migration flag flips; the compiler compiles cell overrides and object types instead of templates |
| `undertaking-creation-effects`, `binder-*`, `undertaking-remote-anchor` | preserve — the binder binds cast per cell exactly as per template |
| `grievance-reaches-the-mortal-sheet`, the THR-1388 covet rivalry | preserve — `undo` and `control:seize` emit the same harm classes |
| holdings `owns` single writer | extend — `control:seize × attachment/room/route` is the first production caller of `transferHolding`; `control:claim` calls `grantHolding` |
| Control (`claim_control` mode, upkeep, degradation, collapse) | preserve — `control × settlement` *is* that mode; the cell dispatches to it instead of to a completion semantic |
| new: object-type registry → the owning systems' verb semantics | add — read sites are the resolver and the live proof |

## Vision audit

- [x] `02-non-negotiables.md` §4 *everything is a graph node/edge* — confirmed: every object type is an existing node or edge, the registry reads shapes and never invents them, and the object handle points at the edge rather than copying it. The one known violation (intelligence records as a property bag) is **named and deferred**, not repaired here — the critic showed the obvious repair would have moved an unread property into a lossy edge; it lands with its reader.
- [x] §1 god-not-protagonist — untouched; the verbs are the mortal's.
- [x] `03-design-tensions.md` §2 *systemic emergence vs. authored moments* — the drift signal named there ("the agent did the thing") is the risk of B and is mitigated by design: the verb lines carry slots the object's own lore fills, cell overrides keep authored beats where they earn them, and `CELL_OVERRIDE_MAX_PER_CELL` stops the overrides becoming the old pack by another name.
- [x] `taste-profile.md` words-never-numbers, narrate-never-inhabit — unchanged surfaces.
- [x] No Vision edit; `Docs/canon/undertakings.md` is rewritten (§ Rulebook impact).

## Rulebook impact

- [ ] This plan **does** change a rule of play: the undertaking verb set — stated in `Docs/canon/undertakings.md:11` as "a thing built, changed, taken or undone" — becomes found / improve / use / control (claim or seize) / undo / survey, and "a kind is not a kind until it can be undone" becomes "an object type is registered with its undo". The rulebook's undertaking rules live in `Docs/canon/rulebook.md` **§10.7 The Reactive Loop** and **§10.8 Following, Moments and the Calling** (§10.6 is Reputation — an earlier draft of this line mis-cited it; the judge caught it); those two sections and `Docs/canon/undertakings.md` are updated in the same PR as the registry.
- [x] The UL gains **object type**, **verb cell**, **cell override**; **kind row** is retired in their favour — filed with the implementation as a `UL-proposal`.

> Brainstorm companion: `Docs/plans/2026-09-03-thr-1392-verb-object-undertakings-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | verb × tier tables replace 64 hand-tuned numbers |
| 2. Inspectability | PASS | every completion names its object; a cell nobody can take traces once per run |
| 3. Determinism | PASS | sorted enumeration; seeded prose picks; no new rng |
| 4. Fail-soft | PASS | table above; the legacy pack stays behind a flag until retirement is reviewed |
| 5. Narrative over mechanical perfection | PASS with note | the risk is flatness; the mitigation is the object's own lore in the slots and cell overrides where a beat is earned — measured by the register scorer on the composed lines before the flag flips |
| 6. Additive over destructive | PASS with note | the migration is destructive by intent (the switch and the packs go), staged behind `UNDERTAKING_MODEL = 'templates' \| 'cells'` with both live until the census re-run passes on the cells |
| 7. Performance budget | PASS | enumeration is bounded by the same distance cap the walk uses today; `tierOf` is O(1) per object |

## Done when

- [ ] `undertaking-objects.ts` with the seven object types, typed shapes, `tierOf` per the table, verb semantics re-homed from `strategicGraphOps`, `HARM_ON_UNDO`; the `intelligence` deferral filed with its reader named.
- [ ] Cell enumeration in `generateStrategicCandidates` behind `UNDERTAKING_MODEL`; the resolver; the 373-line switch deleted when the flag is `cells`.
- [ ] Verb prose line-sets + object lexicons; cell overrides for the shipped prose worth keeping; the retirement list reviewed in chat.
- [ ] Contract, gates, live proof, compiler and Package View read cells and object types (the live proof's `mutation_object` reads the typed shape, not a per-hint switch).
- [ ] **Acceptance:** `census:undertakings` seeds 42 and 99 inside the envelope on the cell model — **including the variety floor**, which is the variety measurement (the reachability gate below is not); the THR-1388 harm probe ≥ its template-model baseline (11 / 21 harms); **every cell with an object in the world fires at least once in 300 ticks on one of the two seeds** (`undertaking_cell_unreachable` = 0 for existing types — reachability, not variety); `tier_defaulted` share ≤ `TIER_DEFAULT_SHARE_MAX` per type; register scorer on 200 composed lines ≥ the shipped templates' score.
- [ ] The object handle on candidates and projects; `resolveTargetOwners` reading `possesses` and an edge object's source; the `object` target rule — with a test that `undo × attachment` and `undo × mark` pass the motive gate against a rival holder and are refused against oneself.
- [ ] `strategicProfile.cells` and the five readers of `templateIds` switched behind the flag.
- [ ] `Docs/canon/undertakings.md` and `rulebook.md` rewritten; UL-proposal filed; wiki pages updated.
- [ ] `npm test`, `test:heavy`, build, ratchet, CLI smoke; Playwright 1920×1080 on the Package View.
- [ ] Closing commit body includes `Fixes THR-1392`.

## Coordination block

**Suggested model:** `opus` — a substrate migration with a measured acceptance; four slices (registry + resolver behind the flag · cells + prose · gates and Package View · migration and flag flip).

**Parallel-safe with:** THR-1389 (movement / pathfinding; disjoint files).

**Mutex with:** THR-1300 slice 5 (the pilot batch) — **superseded**: the pilot's six templates become cells or overrides under this plan; do not run the pilot on the template model.

**Files to touch:**
- Create: `src/data/undertaking-objects.ts`, `src/data/undertaking-verb-prose.ts`, `src/engine/undertakingResolver.ts`, `src/engine/undertakingProse.ts`, `src/engine/__tests__/undertakingResolver.test.ts`, `src/engine/__tests__/undertakingObjectTargets.test.ts`, `src/data/__tests__/undertaking-objects.test.ts`
- Edit: `src/types/strategicAction.ts` (verb, objectTypeId, object handle, cell overrides, `strategicProfile.cells`), `src/engine/strategicActionCandidates.ts` (cell enumeration; `object` target rule), `src/engine/undertakingMotive.ts` (`resolveTargetOwners` reads `possesses` and edge sources), `src/engine/binding/undertakingBindPass.ts` (target reads through the handle), `src/engine/strategicActionLifecycle.ts` (resolver call; switch deleted at flip), `src/engine/strategicGraphOps.ts` (ops re-homed), `src/engine/naming/workNames.ts` (object lexicons), `src/engine/strategicKindReachability.ts` + `src/engine/decisionBoard.ts` + `src/engine/calling.ts` + `src/engine/grievance/covetRivalry.ts` (profile readers), `src/data/ambition-templates.ts` (`cells`), `src/data/content-eval/undertakingContract.ts` + `undertakingConstants.ts` (`STRATEGIC_PROSE_TOKENS`) + `undertakingPackage.ts` + `scripts/undertaking-live-proof.ts` + `scripts/check-undertaking.ts` (cells), `src/components/CMS/undertaking-package/*` (object block), `src/data/undertaking-kinds.ts` (retired at flip), the seven packs (cell overrides / legacy flag), `Docs/canon/undertakings.md`, `Docs/canon/rulebook.md`, `public/essence-control-reference.html`, `public/agents-reference.html`

## Notes for the executor

- Slice 1 ships the registry and the resolver **behind the flag with the template model still live**; nothing the player sees changes until the census passes on cells.
- The first deliverable of slice 4 is the **retirement list** — which of the 64 have no cell — presented in chat before anything is deleted.
- Do not let cell overrides become packs: `CELL_OVERRIDE_MAX_PER_CELL` is the guard, and the census's variety floor is the test.
- Intelligence as `knows_of` edges is a THR-1348-class repair in its own right; land it first, it is the smallest slice and fixes an NN #4 violation regardless of the rest.
- **The grammar does not write the consequences.** Eight object types × the verbs that apply to each is on the order of thirty semantics, and every one is a decision someone makes once — what undoing a route means (suspend, not delete), what seizing a room does to its faces, what surveying a faction writes. Most are re-homed graph ops that already exist; the rest are the work of this ticket, and they are engine work with a designer's judgment in them, not boilerplate.

## Pre-design debate — trade-off card

*Two advocates (Fable, cold context: the five Vision files, `Docs/canon/undertakings.md`, `undertaking-kinds.ts`, and the census numbers above), one cross-examination round. The card is the design session's synthesis; the full arguments are in the companion.*

- **Path A — authored kind-row templates — costs:** a variety ceiling equal to the pack file (28–29 of 64 fire in 300 ticks); an engine that grows one arm per object shape (13 hint types + 5 template-id arms); the object modelled as prose (58/64 target a settlement); hollow writes (15 `no_mutation`, 5 of 8 destroys); reachability by list position in an ambition profile. **Buys:** a place for a designer's judgment on every act — the A advocate's best evidence is the trade-route row's *"a blockade suspends rather than deletes… a blockade that never lifted would be deletion wearing a counter's name"*, measured on Hawkgate's prosperity; the taste profile's anti-pattern *pure template-based prose* stays out by construction; NN §6 additive-over-destructive is honoured.
- **Path B — verb × object type — costs:** a substrate migration (registry, resolver, 64 templates to cells or retirement, canon and rulebook rewrites); the flatness risk Tension §2 names becomes the central quality risk; tier derivation per object type must be right; **and — the A advocate's sharpest point in cross-examination — the authored consequence does not go away, it moves**: "moving the key from template id to object type relocates the empty arm; it does not fill it." Every object type's verb semantics still have to be written by someone who decided what undoing a route *means*. **Buys:** an act space that scales with the world (owned locations 112 → 147, companies 0 → 44 in one seed's 300 ticks become targets); the consequence written **once per object type and inherited by every verb and every cell** instead of once per fiction — the B advocate's answer to the trade-route example: *"'suspends rather than deletes' is a statement about what undoing a route means — a fact about the object type, not about a template; `undo(route)` is precisely the place to hold it"*; hollow destroys impossible by construction (a cell with no semantic is not enumerated and traces `undertaking_cell_unreachable`); reachability as "an object of this type someone else owns is in range"; one resolver instead of a switch.
- **On the anti-pattern:** the taste profile rejects *pure* template-based prose and names its replacement — *"the hybrid layered engine"*. B is that layered engine for undertakings: a structural layer (verb × object, the object's own lore in the slots) beneath authored prose (verb line-sets, cell overrides). Tension §2's over-authorship drift signal — *"the same encounter fires twice in a run with the same beats"* — is the shipped model's failure by construction.
- **Vision premises favouring A:** `03-design-tensions.md` §2 (authorship is the kitchen); `taste-profile.md` anti-pattern (pure templates); `02-non-negotiables.md` §6, §7 ("engine without content is a mechanism with no story").
- **Vision premises favouring B:** `02-non-negotiables.md` §4 (the graph must actually be a graph); `00-north-star.md` (choices accumulate into something the player has opinions about — *Hawkgate's* road); `taste-profile.md` *state facts, never encode them*; `03-design-tensions.md` §2 read for its drift signals in both directions.
- **What each path must still answer:** A — how 64 fictions stop being the ceiling without becoming 640. B — where the authored judgment lives so voice does not flatten: **in this plan, in three places and no more** — the per-object-type verb semantics (written once), the six verb line-sets with object-lore slots, and bounded cell overrides (`CELL_OVERRIDE_MAX_PER_CELL`), with the register scorer gating the flag flip.

**Verdict after the debate:** B, unchanged — but the plan changed twice because of A: the acceptance now requires the register scorer on composed lines to meet the shipped templates' score before the flip, and § Notes for the executor states plainly that the object-type semantics are authored engine work, eight types' worth, not something the grammar produces for free.

## Independent critic review

*Fable, cold context, with the code. Verbatim, then what changed.*

> 1. **BLOCKING — `hold` is not a completion verb.** All 6 `control` templates run `executionMode: 'claim_control'`, which returns a `StrategicControlState` (neglect, degradation, collapse) and never reaches `executeInstantMutation` (`strategicActionLifecycle.ts:488-520`). Resolve: drop `hold` from the verb set (control stays its own mode).
> 2. **BLOCKING — edge objects and possessions have no target/owner seam.** The pipeline is `targetNodeId`-keyed; `resolveTargetOwners` walks only `controls`, `commanded_by`, `owns` (`undertakingMotive.ts:80-86`) — not `possesses` or `member_of`. So `undo × attachment` and `undo × mark` hit `ownerCount: 0` and are refused by the motive gate. Resolve: specify edge-id or subject-node targeting and the owner-resolution extension.
> 3. **MAJOR — migration under-specified.** `ambition-templates.ts` (13 profiles naming all 64 ids) and its consumers are not in files-to-touch; the profile's new shape is never defined. 19 templates are `instant` and silently become checkpointed projects.
> 4. **MAJOR — `knows_of` cannot carry intelligence.** The edge is knower → location; `seedKnowsOf` refuses a duplicate; records are keyed `${intelligenceType}_${target}`. And `strategicIntelligence` has zero engine readers — the "NN #4 repair" moves an unread property into a lossy edge. Resolve: typed edge property with upsert, or retire intelligence honestly.
> 5. **MAJOR — the flatness mitigation is a promise.** `STRATEGIC_PROSE_TOKENS` is an empty set; the strategic path renders `activityProse[0]` verbatim. `{object}/{owner}/{actor}/{place}` needs a substitution chain that is not a listed deliverable. `workNames.ts:144` says per-kind lexicons "are slice 5's".
> 6. **MAJOR — tier derivation has no source for most types.** Name the per-type tier source in the plan.
> 7. **MINOR — factual drift.** 16 non-`no_mutation` hints, not 13; 9 destroys, not 8; two templates do target groups; `GroupKind` is company | army | network | battle — an order is a faction.
> 8. **MINOR — `ruined` flag:** the battle aftermath reads `locationSubtype !== 'ruins'`, not a property.
> 9. **MINOR — verb set.** Self-spends (`press_the_mark`, `burn_the_mark`, `follow_the_chart`) folded into `improve` is wrong — a self-spend is a *use*; the rows' cross-family destroy rule and "a self-spend is a use, not a counter" must carry over or `undo × mark` by its holder returns.
> 10. **MINOR — scalability is right in kind but bounded in variety.** Instances scale with the world; distinct acts scale with ~30 semantics × six line-sets. "Every cell fires" is reachability, not variety — keep the census variety floor as acceptance.
>
> **CRITIC: ACCEPT WITH CHANGES** — direction is sound and the census is verified (64/58/15 hold), but items 1–2 must be resolved before Ready for Dev.

**What changed:** (1) `hold` removed as a completion verb; then, on Christian's decision, `seize` and the establishing of control merged into one verb, `control`, with the variant decided by ownership — `control:claim × settlement` dispatches to the existing sustained mode unchanged, so the critic's finding stands satisfied. (2) The object handle, the `object` target rule, `resolveTargetOwners` reading `possesses` and edge sources — specified in § Systems design, tested in § Done when, files added. (3) `strategicProfile.cells`, the five readers named, execution mode by verb with the instant disposition stated. (4) Intelligence **deferred** with its reader; the 15 templates stay on the legacy flag. (5) `resolveUndertakingProse` and the four tokens are deliverables; the lexicons are slice 2. (6) The per-type tier table and `TIER_DEFAULT_SHARE_MAX`. (7–8) Numbers and the `ruins` subtype corrected. (9) `use` added; ownership by verb; the cross-family rule kept per type. (10) The census variety floor named in the acceptance beside the reachability gate. Not credited before and credited now: the kind rows carried three disciplines on the row itself — the self-spend/counter distinction, the cross-family destroy rule, and the founding-grace lesson — and the object registry inherits all three as per-type rules.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-03, run on the revision that already carried the critic's changes.*

**Intent judge (Fable, cold context): Escalate — by class, not by defect.** Impact class confirmed High-risk (a rule-of-play edit, a canon rewrite, a registry and a UL term retired, an approved pilot superseded). On the eleven dimensions the plan scored one GAP (a rulebook section mis-citation, fixed above) and no violation — an Allow on the dimensions alone — but a High-risk plan needs Christian's approval of *the plan*, and his sign-off so far is of the direction and the design pass. The judge's escalation question, put to him in chat verbatim: the six-verb set with `seize` as new beyond his framing and control kept separate; the 64 templates becoming cells or retiring behind a flag with the retirement list shown first; the THR-1300 pilot superseded.

**Christian's answer (chat, 2026-09-03):** (1) *"seize makes total sense if we have hold. together they form 'control' right? … one seems to be establishing an initial control, the other is taking over control from someone else"* — merged into one verb, `control`, with `claim` and `seize` as its variants (§ Verbs); (2) agreed; (3) agreed. The High-risk gate is passed; the plan is amended for (1) in this revision and hands off.

### NFP audit

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | Constants table names 9 tunables (`UNDERTAKING_VERB_DIFFICULTY/PAYOFF/DURATION`, `OWNERSHIP_BY_VERB`, `HARM_ON_UNDO`, `TIER_DEFAULT_SHARE_MAX`, `CELL_OVERRIDE_MAX_PER_CELL`, …) replacing 64 hand-tuned template numbers with verb × tier tables |
| 2. Inspectability | PASS | `strategic_world_change` gains `objectTypeId`/`objectId`; new `undertaking_cell_unreachable` category registered at the four sites; Wiring table gives CLI/debug visibility per module |
| 3. Determinism | PASS | "None new. Object enumeration is sorted by id then distance; prose line choice uses `pickWithRepetitionGuard` with the project's seeded rng" |
| 4. Fail-soft | PASS | Six-row table covers missing semantic, no object in range, mid-project removal, `tierOf` throwing, missing prose token, unmigrated template |
| 5. Narrative over mechanical | PASS-with-note | Flatness named as the central risk, mitigated by object-lore slots + bounded overrides, gated by the register scorer before the flip — a real gate |
| 6. Additive over destructive | PASS-with-note | Destructive by intent, staged behind `UNDERTAKING_MODEL` with both live until the census passes — self-flagged |
| 7. Performance budget | PASS | Enumeration bounded by the walk's distance cap; `tierOf` O(1) per object |

NFP AUDIT: PASS-with-notes

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | All five subsections filled, cross-referenced to code lines. |
| Content | present-and-substantive | Migration table, profile rewiring, prose, attachments, data tables. (§ Encounter templates was absent; added as N/A after the audit.) |
| UI | present-but-thin → revised | The four template subsections were collapsed into one paragraph; split out after the audit (Player-facing display / Event notifications / Debug inspection / Visual presence N/A). |

Wiring: connects all five modules to phase / UI / state / trace / debug. Substrate check: section present, nine of ten rows accurate; Companies & Group Travel was badged ACTIVE against the inventory's DORMANT — corrected to "🟠 DORMANT — activates".

PILLAR AUDIT: PASS-with-notes (all three notes applied in this revision)

### Vision audit

`02-non-negotiables.md` §4 confirmed, §1 confirmed, §6 knowingly traded and disclosed; `03-design-tensions.md` §2 engaged head-on through the debate, drift signal named and given a measured gate; `taste-profile.md` words-never-numbers confirmed, the *pure template-based prose* anti-pattern addressed — the plan self-identifies as the prescribed "hybrid layered engine" with bounded override caps against re-authoring a pack in disguise. North star and core loop not implicated (strategic layer). No contradictions.

VISION AUDIT: PASS `[design-brief-stale — no § Vision summary in Docs/design-brief.md]`
