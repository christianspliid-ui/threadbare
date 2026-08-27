> **title:** `The action library: works, holdings & naming — THR-1297`
> **linear_issue:** THR-1297
> **author:** `Claude Code`
> **created:** 2026-08-27
> **three_pillars:** Engine `done — ownership edge, holdings writer, naming resolver, groupKind, mutation ops` · Content `done — the ten kind rows, authored seam values, lexicons, vertical slices` · UI `minimal — Law 56 declaration seam only; surfaces are doc 5`

# The action library: works, holdings & naming — THR-1297

*Plan doc 2 of 6 from the [Proactive Agent Actions wayfinder map](https://linear.app/threadbare/issue/THR-1276/proactive-agent-actions-wayfinder-map): the kind-row registry with its no-destroy-no-kind gate, the ten kinds authored into the substrate/binder seams docs 1 and 3 shipped, agent ownership as one new edge + one `holding` attachment category behind a single writer, the work-naming resolver with christening and the failure-name register, and the wilderness fix.*

**Settled input (do not re-litigate here):** the grammar verdict on
[THR-1281](https://linear.app/threadbare/issue/THR-1281/the-action-library-grammar-crud-verbs-across-reaches-and-tiers)
(kind-first; schema refuses a destroy-less kind; ten kinds; `holding` category + seize-as-transfer;
motive-gated cross-family destroys; behavior families retired for the derived calling; tiered
shipping with vertical slices), the network mapping + addendum on
[THR-1288](https://linear.app/threadbare/issue/THR-1288/network-kind-verify-the-graph-mapping)
(group-family actor node; **`groupKind` ships now** per review ruling 2.3.2, with the raw
`member_of` reader audit and the `commanded_by` description amendment), the naming verdict on
[THR-1291](https://linear.app/threadbare/issue/THR-1291/naming-the-works-how-a-generic-verb-makes-the-saltway-ring)
(assembled names, earned at completion, names outlive owners, echo names), and the §3 doc-2
obligations in
[`Docs/audits/2026-08-26-proactive-agent-actions-review.md`](../audits/2026-08-26-proactive-agent-actions-review.md)
(the `controls` disposition table consumer by consumer; the wilderness fix in-catalog; holdings as
a single-writer three-object mirror, seize atomic, slot-cap exempt). Absorbed deferrals:
[THR-1294](https://linear.app/threadbare/issue/THR-1294/requireslocation-defaults-off-undertakings-ignore-their-stage-until)
(per-kind `requiresLocation` with the liveness census as acceptance) and
[THR-1295](https://linear.app/threadbare/issue/THR-1295/folded-found-order-undertaking-has-no-faction-payoff-create-group)
(`create_group`). All file:line references verified against `main` @ `074dbadc` (post-THR-1292 and
post-THR-1296 — both fully executed).

## Why this is load-bearing

The machine is built and running empty. Docs 1 and 3 shipped checkpoint dice, the scored binder,
banded creation, and the remote-anchor gate — and every authoring seam is deliberately unauthored
on all 43 templates, pinned by tests that fail on the first real row. The board's cutover
(THR-1301) is blocked on exactly this doc's `motivations`/`payoffValue` values; the binder binds
nothing until cast specs exist; a third of spotlight decisions idle at lairs because no verb can
target the wilderness; and "The Saltway Ring" has neither a node to hang on nor a namer that can
say it. This doc turns the substrate into a game.

## Substrate inventory

Everything touched exists in `Docs/canon/systems-inventory.md` or was shipped by docs 1/3;
dispositions per row. The honestly-new pieces — the ownership edge, the holdings writer, the kind
registry, the work namer, `create_group`/wilderness mutation ops — are new because the review's
own obligations demand them; each reuses a named existing mechanism rather than green-fielding.

| Existing subsystem | Status | This plan |
|---|---|---|
| Strategic packs + template registry (`strategic-packs/`, `TEMPLATE_REGISTRY`) | 🟢 ACTIVE | **extends** — a 7th pack (`wanderer-explorer`, a pre-declared family with UI rows and no pack) + kind-row authoring onto the 8 shipped seam fields |
| Undertaking runtime + binder (docs 1/3, `undertakingCheckpoints`, `binding/`) | 🟢 ACTIVE | **authors into** — cast specs, creation effects, difficulty/payoff/motivations; first `remote: true` |
| Attachments, Items & Possessions | 🟢 ACTIVE | **extends** — `holding` category; slot-cap exemption is free by construction (absent cap ⇒ uncapped, `attachmentSlotResolver.ts:274`) |
| `controls` edge + consumers (72 files) | 🟢 ACTIVE | **preserved untouched** — ownership gets a NEW edge; disposition table below keeps every faction-territory consumer exactly as it is |
| Groups (companies/bands/armies) | 🟢 ACTIVE | **extends** — explicit `groupKind` replaces presence-discrimination (review ruling 2.3.2); `createGroup` becomes the warband kind's op |
| Faction seeding (`seedFactionFromDefinition`, `dynamicFactionDefinitions`) | 🟢 ACTIVE (producer-less since THR-1292 §3) | **re-activates** — `create_group` restores the runtime producer (THR-1295) |
| Naming (`pickCulturalName`, `culturePhonetics`, `groupNames`) | 🟢 ACTIVE | **generalizes** — `groupNames.ts` is already the pattern-set proper-name resolver; it becomes THE work namer rather than a third one being built (see §5) |
| Ruins, Clues & Delves (`clueLifecycle`, `knows_clue_of`/`knows_of`, treasure maps) | 🟢 ACTIVE | **extends** — the chart/expedition kind's outputs reuse these paths; treasure maps gain their missing minter |
| Secrets & Favors (`knows_secret_of`, `owes_favor`) | 🟢 ACTIVE | **extends** — the leverage-mark kind lives in this economy, as ruled |

## Engine pillar

### 1. The kind-row registry (THR-1281 §1/§2)

New data module `src/data/undertaking-kinds.ts` + type in `src/types/strategicAction.ts`:

```ts
interface UndertakingKindRow {
  kindId: UndertakingKindId;              // ten members, open union by design (open registry)
  tier: 1 | 2 | 3;
  displayName: string;                    // UL term for the kind
  objectShape: string;                    // doc: node/edge shape produced — existing types only
  ownable: boolean;                       // joins the holdings system (§3)
  createTemplateIds: readonly string[];   // C row
  updateTemplateIds: readonly string[];   // U row (fortify, rededicate — rename rides here, THR-1291 §3)
  destroyTemplateIds: readonly string[];  // D row — MUST be non-empty
  lexicon: WorkLexiconId;                 // naming (§5)
}
```

**The no-destroy-no-kind gate is a schema test, not an audit** (`undertakingKindRegistry.test.ts`):
every registered row has ≥1 destroy template id, every referenced template id resolves in
`TEMPLATE_REGISTRY`, and every destroy template carries a motive gate (§2 below) — counter-play
closure by construction, exactly as ruled. The registry is data the engine reads for naming,
holdings, and (doc 6) the factory gates; candidate generation continues to run off the packs.

**Corpus invariants honored:** every new template carries a `mutationHint` (pinned by
`strategicBehaviorFamilies.test.ts:161-166`), registers in an ambition `strategicProfile`
(the slice-4 no-dead-content discipline), and every `motivations` entry is a `VALUE_PAIRS` member
(compile-checked; the silent-zero failure mode is documented at `strategicAction.ts:175-178`).

### 2. Motive-gated cross-family destroys (THR-1281 §4)

Destroy templates gain `motiveGate: readonly MotiveKind[]` — `'rivalry' | 'grudge' |
'contested_ambition' | 'faction_war'`. Candidate generation refuses a destroy candidate whose
actor holds none of the named motives toward the target's owner (rivalry via `hostile_to` /
rival schemes, grudge via grudge edges, contested ambition via overlapping `pursues` milestones,
faction war via the war system) — refusal reason `no_motive`, traced like the existing
`no_eligible_apprentice` gate. No motiveless demolition; every destroy narratable, which is what
doc 4's grievance minting consumes.

### 3. Ownership: the `owns` edge + the `holding` attachment (THR-1281 §6; review §3 row on holdings)

**The decision the review demanded, made explicit: ownership is a NEW edge type `owns`, not a
reuse of `controls`.** The inventory (this session, consumer-by-consumer — summarized below)
found the assumed property firewall does not exist: exactly **one** of ~30 production read sites
discriminates by any `controls` property (`releaseControl`'s `controlType === 'strategic'` filter
— inside the code THR-1303 deletes), `influence` is write-only, and reuse breaks seven
faction-territory consumers outright (`armySupply.ts:204`, `battleResolution.ts:578`,
`proseResolvers.ts:249`, `routeEvents.ts:61`, `economicPower.ts:84`, `armySpawning.ts:155`, and
`battleAftermath.ts:253`'s power-vacuum deleting holdings on a razing) plus five
`[0]?.source`-order sites that become nondeterministic (NFP #3). A new type breaks zero, and
`holds_place_of_power` is the repo's own precedent for a narrow ownership edge coexisting with
`controls`, integrated at two known tuples. `EDGE_SCHEMA` row: `owns` — `actor →
location | resource`, directed, many-to-many, required `['acquiredTick', 'via']`.

**The disposition table (review §3, consumer by consumer).** Full inventory: 132 occurrences / 72
files; 63 production occurrences / 37 files; **eight writers in five property shapes**, two of
them already agent-side un-flagged. Dispositions:

| Population | Writers | Disposition |
|---|---|---|
| Faction territory (`influence`, worldgen ×2 + monster lairs) | `worldSeed.ts:1355,463`, `monsterFactionSeed.ts:94` | **keep on `controls`, untouched** — all ~13 incoming-edge consumers (army supply, sieges, threat, route events, economic power, hex panel, prose, lair reinfestation, retinue) continue reading faction territory exactly as today |
| Agent-strategic (`controlType: 'strategic'`) | `strategicGraphOps.ts:192` | **unchanged here** — deleted by [THR-1303](https://linear.app/threadbare/issue/THR-1303) behind its measured gate; not this doc |
| Ascendant seat / essence sources | `influence.ts:450`, `graphOpExecutor.ts:858,973` | **keep on `controls`** — the divine economy's edges; the three `already_controls` idempotency guards additionally check `owns` so an owned node cannot be double-claimed |
| **Agent ownership riding `controls` un-flagged today** | `encounterAftermath.ts:3758` (spawn_unique_location), `action-template-content.ts:176,565` (conquer / establish-network `add_edge`) | **migrate to `owns` via the holdings writer** — the decision is retroactive; these are the only agent `controls` writers outside the retiring loop |

Cross-cutting integrations (the bounded cost of the new type): sibling accessors
`getOwnedBy`/`getOwners` beside `getControlledBy`/`getControllers` (`graphQueries.ts:450-461`);
`'owns'` joins the two `['controls','holds_place_of_power']` tuples (`notableAgendas.ts:443`,
`orchestrator.ts:1895`); the `agent_controls_location` graph condition
(`graphConditions.ts:243-249`) reads `owns` (its name finally honest); the home-territory
predicate (`effectPredicates.ts:314`, `resolutionModifiers.ts:372`) counts standing on your own
holding as home ground — a small authored rule closing the gap the inventory found (an owner reads
as an enemy on their own land today).

**The three-object mirror, single-writer.** A holding is: the world object node (existing types
only — location, sublocation, resource, route-identity node §6, artifact for masterworks) + the
`owns` edge + the bearer-side attachment (`category: 'holding'`, an ordinary attachment node held
via `possesses`). One module, `src/engine/holdings.ts`, is the only writer of all three:
`grantHolding`, `transferHolding` (**seize — one atomic call**: retarget the edge, retire the
loser's attachment, mint the winner's; no intermediate state), `releaseHolding`, `razeHolding`.
Mirror doctrine copied verbatim from the roster precedent (`groupFormation.ts:405-412`): **the
`owns` edge stays the authority; the attachment is a bookkeeping face.** Seize joins ownable
kinds' U rows as ruled ("changed hands", north star #2); battle seizure of a settlement may call
`transferHolding` for holdings at the site — loud, per doc 3's honest-breakage doctrine.

**Attachment integration** (from the inventory — `AttachmentCategory` has *no* compile-time
enforcement, so the sweep is enumerated, not discovered): add `'holding'` to the union
(`attachments.ts:142-146`); the three closed unions that DO error — `InstantiateRewardResult.category`
(`rewardPool.ts:468`), `SlotInventoryEntry.kind` (`attachmentSlotResolver.ts:47`), the facet union
(`trace.ts:1727`); the silent-drop chains that must gain arms — `rewardCategoryNodeQuery` +
`rewardRecipeHasCandidates` (**both**, `rewardPool.ts:53` + `nudgeGrantLiveness.ts:288` — the
authoring gate deliberately mirrors the runtime and a one-sided arm recreates the drift its header
warns about), `agentAttachments.ts` bucketing, `HooksBlock.tsx` bucket ternary,
`AttachmentsTab.tsx` `SLOT_GROUP_ORDER` + capless-group rendering, codex category defs +
`SLOT_TAG_DISPLAY_NAMES`. Plus the enforcement gift: an `ATTACHMENT_CATEGORIES` const and a
`Record<AttachmentCategory, string>` display map mirroring `POSSESSION_SUBCATEGORY_NAMES`, so the
*next* category gets the compile errors this one couldn't.

**Slot caps + disposal:** `holding` gets **no** `SLOT_CAPS` entry (absent cap ⇒ uncapped by
construction — the exemption is free) **and** `lossCondition: 'permanent'` (pinned), because
`phaseDisposalTimeout` GC's inactive items via `removeEdge` — which does **not** fire the binding
hook — and a seize must never open an inactive window. Both belts, stated.

### 4. `groupKind` + the `member_of` audit (review ruling 2.3.2; THR-1288 addendum)

`groupKind: 'company' | 'army' | 'network' | 'battle'` is written at **every** group-mint site
(`createGroup` `groupFormation.ts:404`, `spawnArmy` `armySpawning.ts:222`, `raiseWarhost` `:382`,
the battle coordinator `battleResolution.ts:209`, debug spawns) and becomes the primary
discriminator with presence-fallback for legacy fixtures: `isCompanyNode` /
`isCompanyMembershipTarget` (the hand-mirrored copy at `graphQueries.ts:98` stays local for the
import-cycle reason but derives from the same rule) read `groupKind` first, then today's
`armyState`/`groupType` presence tests. `isFactionMembershipEdge`'s load-bearing premise —
*"companies are the only non-faction `member_of` target"* — becomes false the moment networks
land, which is exactly why the ruling pulled `groupKind` forward.

**The audit ships as inventory, the sweep as migration.** Measured: ~110 production `member_of`
call sites; 34 already routed through the safe wrappers; **~49 raw outgoing-from-agent sites**
(the full file:line list rides the executor handoff) that read any membership as faction — each
migrates to `getFactionMembershipEdges` mechanically. One live defect fixed in the sweep:
`strategicActionCandidates.ts:305`'s `faction` target rule returns a *company* as a faction
target today. One schema violation found and filed, not fixed: `runGenome.ts:239-241` reads a
**location** as a `member_of` target against the schema's `actor` — its own ticket at execution.
The `commanded_by` description amends to: *"Commanded entity (army, company, network) → its
commander. Direction is entity→commander; co-location is NOT implied — companies derive position
from the leader, armies and networks may stand elsewhere (the remote-anchor rule reaches through
them)."* Network cells register into `getCommandedEntities` (`remoteAnchor.ts:73`) — the
pre-declared registration point doc 3 left for exactly this.

### 5. The work-naming resolver (THR-1291)

**"Never a second namer" is resolved by generalizing the second namer that already exists.**
`src/engine/groups/groupNames.ts` is structurally the ruled design — a context of bound entities
(leader/location/faction), additive flavor lexicons keyed by cause **and sphere**, pattern sets
chosen by input presence, eager-rendering for input-independent PRNG draw counts, a correct
`possessive()` fallback, and a reformation grammar. It generalizes into
`src/engine/naming/workNames.ts` (the group namer becomes its first caller), extended with:

- **Anchor part from the binder's output** (the ruled coupling): `WorkNameContext` takes the
  completed undertaking's released binding ledger + `mutation.ops` created ids + `targetNodeId` /
  `originLocationId` — the bound coast road is where *Saltway* comes from.
- **Per-kind lexicons** in `src/data/work-name-content.ts`, shaped like
  `SETTLEMENT_ROOTS_BY_SPHERE` but keyed by **reach** (the founder's leading reach) ×
  **foundation** (culture), per kind: network (ring/circle/web/brotherhood…), place
  (rest/hold/haven…), route (way/road/run…) — reach-keyed tables are new (existing tables are
  sphere-keyed); the culture grammar joins parts via the pattern sets.
- **Phonetic flavor** via one-line extension of `culturePhonetics.ts`'s `mode` union
  (`'work'` — the seam its `:345` union was built for), never a parallel phonetics.
- **Christening at completion** (THR-1291 §2): the resolver runs in the completion block between
  `executeInstantMutation` and the history write (`strategicActionLifecycle.ts:482-491` — every
  input is in scope there), renames the created/target node, and the completion moment carries
  the christened name instead of `candidate.displayName`. Until completion the undertaking wears
  the working possessive (`possessive(actor) + kind noun`).
- **Failure-name register** (review ruling 2.2): a visible failure (doc 1's
  `undertaking_failed_visible`, gated on `everInterrupted`) writes a `failureScars` entry onto the
  site location's properties — `{ name: possessive(actor) + folly-lexicon draw, tick, actorId,
  templateId }` — a register distinct from earned names, no new node, rendered by doc 5's
  surfaces and readable by prose. Clean failures write nothing (the amendment's other half).
- **Names outlive owners** (THR-1291 §3): `transferHolding` never renames; deliberate renaming is
  a `rededicate` U-row template on ownable kinds; `razeHolding` retires the name into the site's
  `nameEchoes` property, and the resolver accepts a destroyed work as an anchor entity — "the
  Second Saltway" falls out of the recipe.
- **Fixes in passing** (all three naming sites the inventory found): the hardcoded `"{actor}'s"`
  in eight `nameTemplate` strings routes through `possessive()` (the trailing-s bug); the
  duplicated legacy fallback strings at `strategicActionLifecycle.ts:777/785` collapse; the
  binder's raw-typeId display name (`creationEffects.ts:175`) routes through the resolver.

Determinism: FNV-1a seed from the named node's id (the group-namer idiom), zero draws dependent on
input presence. Fail-soft: possessive fallback at every gap, terminal kind-noun fallback, never a
template id on a player surface. Lair placeholder names ("Lair 3" shipping to players) are out of
scope — filed as a finding at execution.

### 6. Object shapes: the two gaps the ten kinds expose

- **Trade routes have no identity to own or name** — `createTradeRoute` mints a `trades_with`
  *edge* (no name field, nothing an `owns` edge can target, nothing to christen). The route kind
  adds a **route-identity node**: `type: 'location'`, `locationSubtype: 'trade_route'` (a
  subtype, not a node type — the additive move), anchored at the origin endpoint's hex, endpoints
  in properties. **The `trades_with` edge stays the economic authority** (every existing consumer
  untouched); the node is the identity face — name, ownership, blockade state — kept consistent
  by the same single-writer discipline as holdings (the roster-mirror doctrine, third
  application). Blockade/sever verbs act on the node and suspend the edge (`threatened` /
  volume, the existing properties). Veto-open: this is the one place the ruled design forces a
  new *shape*; the alternative (a `routeName` edge property) leaves the route unownable and
  uncastable, which the vertical slice (route vs blockade) cannot accept.
- **`create_group` and the wilderness verbs are missing `StrategicMutationHint` members.** Added
  (all completion-time, matching the hint axis; checkpoint-banded creation stays the
  creation-effects axis): `{ type: 'create_group'; groupKind: 'company' | 'faction'; … }` —
  company/warband routes through `createGroup` (`groupFormation.ts:373`, the one code path that
  mints a company); faction routes through a synthesized `FactionDefinition` →
  `seedFactionFromDefinition` + `dynamicFactionDefinitions` (THR-1295's Done-when: the producer
  restored; the ~20-field definition synthesizes from a per-template `factionSeed` block whose
  four content-id lists point at existing generic guild content). `{ type: 'spawn_clue' }` and
  `{ type: 'seed_knows_of' }` reuse `clueLifecycle`'s creation paths; `{ type:
  'mint_treasure_map' }` closes the measured gap that treasure maps have consumption
  (`treasureMapConsumption.ts`) and **no minter**. `create_group` gets the
  `ENCOUNTER_POOL_INVALIDATING` treatment (`poolInvalidatedLocationIds`, THR-1184 precedent) —
  a founded organization changes what a location can host.

### 7. The wilderness fix (review §3 row; field-survey seam 8)

The measured idle third (700/798 idle decisions at lairs) is three stacked gates, all closed
in-catalog:

1. **A 7th pack** — `wandererStrategicPack.ts`, `behaviorFamily: 'wanderer-explorer'` (a
   pre-declared union member with presentation rows already wired and no pack — the cleanest
   possible landing). Chart/expedition/survey templates target wilderness via the *existing*
   `location_subtype` rule — lairs, `cleared_lair`, `ruins`, and the ten anomaly subtypes are all
   location nodes already; no template names any of them today.
2. **Ambition profiles** — the generation gate is `strategicProfile` presence, and only 7 of ~25
   ambition templates carry one; every wilderness-flavored ambition (`forge_legend`,
   `chase_the_wonder`, `reclaim_homeland`, …) generates zero undertakings anywhere. Doc 2 authors
   profiles naming the explorer kinds for the wilderness ambition set (each new template
   registered in ≥1 profile — the no-dead-content discipline).
3. **Stage locality** — chart verbs author `requiresLocation: true` safely *because* their
   targets are the wilderness features around where the idle agents already stand (the
   THR-1294-compatible authoring: presence is satisfiable by construction, and `travelPenalty`
   handles the rest). The liveness census (rolled share ≥ 50%, seeds 42+99) is the acceptance
   instrument, per that deferral's Done-when.

Outputs are the existing economies: clue edges, `knows_of` familiarity, treasure-map possessions,
intelligence records — a find is a *lead the world can act on*, which is what makes the explorer
arc feed encounters rather than dead-ending.

### Graph nodes / edges

One new edge type (`owns`, with `EDGE_SCHEMA` row); one new location *subtype*
(`trade_route`); zero new node types — every kind's object shape is an existing type
(the network is THR-1288's `actor`+`networkState` shape with `groupKind: 'network'`). `member_of`
audit per §4; `commanded_by` description amended.

### Tick phases

No new phases. `create_group`/wilderness hints dispatch inside the existing completion path
(2a.55); holdings writes ride undertaking completions, battle aftermath, and the two migrated
writers; the namer runs in the completion block.

### Resolution logic

Kind rows author `checkpointDifficulty` per the band-table principle: T1 marks ~0.40 (routine
craft), founding verbs ~0.5–0.55 (place/organization), destroys ~0.5 + target-defense modifier
seam (doc 4/war). All values in the Content pillar table; the doc-1 dice are untouched.

### PRNG callouts

Namer: FNV-1a from node id + eager pattern rendering (draw count input-independent — the group
namer's proven idiom). Mutation ops reuse callers' streams. No `Math.random()`.

## Content pillar

### The ten kind rows (THR-1281 §2 — authored values for every shipped seam)

Format per row: object shape · ownable · C/U/D verbs (→ = cross-family destroy) · key authored
values. Full band tables, cast specs, prose, and lexicons are enumerated in the pack files; this
table is the design contract. All rows: `canRunBeside: true` except noted; `motivations` from
`VALUE_PAIRS` only.

| Kind (tier) | Object shape | Own | C / U / D | Authored notes |
|---|---|---|---|---|
| **Intelligence cache** (1) | actor-side intelligence + `knows_of`/clue edges | no (own economy) | survey/chart → `record_intelligence`+`seed_knows_of` / deepen / **expose** (→ any family, motive-gated), decay is ambient | `requiresLocation: true`; diff 0.40; motivations `revelation_discretion` |
| **Leverage mark** (1) | `knows_secret_of` edge (Secrets & Favors) | no (own economy) | cultivate-informant / press / **burn** (spend it — self) + **expose** (→) | cast: 1 informant (`must-persist`, commodity roles); diff 0.45; `honesty_cunning` |
| **Masterwork item** (1) | artifact node (IS an attachment already) | via `possesses` (not `holding`) | craft-masterwork / improve / **destroy** (→ warlord raze, rival sabotage) | cast: patron optional; diff 0.50; `preservation_transformation`; payoff high, duration long |
| **Chart/expedition find** (1) | treasure-map possession + clue/`knows_of` edges | map is a possession | chart-the-wilds / follow-up survey / **map stolen or destroyed** (possession economy) + intel decay | the wilderness pack (§7); targets lair/ruins/anomaly subtypes; diff 0.45; `tradition_novelty` |
| **Network** (1) | `actor` node, `groupKind: 'network'`, `member_of` contacts, `commanded_by` owner (THR-1288) | commanded, not held | build-network / extend-reach (adds contacts, `remote: true` U rows — **the first `remote` templates**) / **sever** (→ any family — un-foots every remote anchor through it) | cast: contacts (`must-persist`, mixed roles); diff 0.50; `loyalty_ambition`; registers into `getCommandedEntities` |
| **Sublocation** (2) | `type:'location'`+`parentLocationId` (existing) | **yes** | build (existing `create_sublocation` hints) / fortify / **raze** (→ warlord) + battle destruction | existing 6 build templates gain kind rows + ownership on completion; diff 0.45 |
| **Place-tier location** (2) | `type:'location'` at a hex | **yes** | found-settlement (**new** `create_location` op — minimal v1: target an unclaimed hex adjacent to demand; the undertaking's checkpoints ARE the construction arc) / grow / **raze** (→) + abandonment | diff 0.55, duration long; deep founding dressing (signifiers, ceremonies) stays recorded map fog — the *mechanics* ship, the pageantry follows |
| **Trade route** (2) | `trades_with` edge (economic authority) + route-identity node (§6) | **yes** | establish-route (existing merchant template gains the identity node) / extend / **blockade** (→ warlord — the vertical slice) + endpoint destruction | diff 0.50; `asceticism_extravagance` |
| **Company/warband** (3) | `createGroup` company, `groupKind` set (kills the recruit-warband mirage) | commanded | raise-warband (`create_group{company}`) / recruit / **disband** (self) + battle destruction + schism (→) | cast: recruits (mixed); diff 0.55; `courage_prudence` |
| **Faction** (3) | faction node via synthesized definition (§6, THR-1295) | led, not held | found-order (existing template gains the faction payoff) / charter-growth / **schism/dissolve** (→ `phaseSchismResolution` exists) | diff 0.60, longest duration; `sacrifice_survival` |

**Authored seam values across the corpus:** `payoffValue` per kind (T1 ~0.5–0.8, T2 ~1.2–1.6,
T3 ~2.0 — in the EVT currency, tuned against the cutover envelope; the `payoffValue` emptiness
pin fires on the first row, deliberately); `motivations` on all 43+new templates (2–3 pairs each,
the desire-multiplier repair THR-1301 waits on); `checkpointDifficulty` per row;
`requiresLocation` per kind with the census as acceptance; `remote: true` only on network
extend-reach rows (fires the second pin). Cast specs + creation effects per kind land in the pack
files against doc 3's `UndertakingCastSpec` / `UndertakingCreationEffects` schemas.

### The three vertical slices (THR-1281 §8 — each tier ships whole)

1. **T1 — the leverage mark**: create (cultivate) → use (press, feeding Secrets & Favors) → burn;
   proof = one agent's full arc in a 150-tick CLI run with `binding_decision` +
   `undertaking_checkpoint` traces and the mark visible in the target's leverage economy.
2. **T2 — merchant route vs warlord blockade**: a route founded, christened, owned; a motivated
   warlord blockades it; the route suspends, the owner's grievance seam fires (doc 4's event);
   proof = the chronicle chain in CLI events + the route node's state.
3. **T3 — the warband**: raise-warband mints a real company with `groupKind`, killing the
   `strategic_recruit_warband` mirage; proof = the company exists, moves, and resolves as the
   groups system already does.

### Prose & lexicons

Per-kind activity/completion prose in the pack files (the shipped register); per-kind name
lexicons + folly-lexicon in `src/data/work-name-content.ts`. No encounter templates here
(encounters are the encounter factory's lane); `catalystEncounterIds` reuse existing content.

## UI pillar

Minimal — surfaces are doc 5's ([THR-1299](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56)):
arc panel, moment cards, works/holdings on the character sheet, chronicle. This doc ships the
**Law 56 declaration seam** those surfaces need: undertaking moments today carry a prose-only
`TickEvent` (`buildMomentEvent`), so authored consequences have no chip the composition gate can
check. Templates gain `completionChanges?` / per-band `changes?` (on creation-effect bands)
reusing `EncounterAftermathChange` + `EncounterAftermathConceptRef` verbatim, validated through
the same `compositionContract` anchor/backing checks — a chip without a write refuses at authoring
time, game-wide, before doc 5 renders one. The attachment-surface touches in §3 (AttachmentsTab
capless group, codex row, display names) are mechanical and DOM-only — **Playwright** at
1920×1080 per the Done-when; Laws engaged: 1 (real data), 13/14 (holdings visible where
possessions already are), 17 (empty state), 37 (words), 56 (the seam itself).

### Debug inspection (DebugPanel / CLI)

No new trace categories — kind work rides `undertaking_checkpoint` / `binding_decision` /
`strategic_world_change`. New CLI affordances: `eval` reads of `strategicState` holdings via
graph queries; the kind registry is importable data. Doc 6 owns the `?spawn`-style undertaking
review levers.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `undertaking-kinds.ts` (new data) | read by naming/holdings/gates | doc 5 | — | — | importable; registry test |
| `holdings.ts` (new, single writer) | 2a.55 completions, battle aftermath, migrated writers | AttachmentsTab (mechanical) | graph (`owns` + attachment nodes) | `strategic_world_change` + holding facet | CLI `agent`, codex |
| `naming/workNames.ts` (new; groupNames folds in) | 2a.55 completion block | doc 5 renders | node `name`, `failureScars`, `nameEchoes` | rides completion event | CLI `events` |
| `groupKind` + `member_of` sweep | all group mint sites | — | node properties | — | `eval` |
| mutation ops (`create_group`, `spawn_clue`, `seed_knows_of`, `mint_treasure_map`, `create_location`) | 2a.55 `executeInstantMutation` | doc 5 | graph + `dynamicFactionDefinitions` | `strategic_world_change` | CLI `factions`, `agents` |
| `wandererStrategicPack.ts` + kind rows on 6 packs | 2b candidates | doc 5 | — | existing decision traces | balance summary decision mix |
| Law 56 seam (`completionChanges`) | authored data → compositionContract | doc 5 chips | — | — | `check:encounter`-family gates (doc 6 extends) |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `KIND_DIFFICULTY_*` (per row, in pack data) | table above | per-kind checkpoint difficulty |
| `KIND_PAYOFF_*` (per row) | table above | EVT payoff per kind |
| `MOTIVE_GATE_KINDS` | 4 members | the destroy motive vocabulary |
| `WORK_NAME_PHONETIC_CHANCE` | 0.35 | phonetic-flavor share in the work namer |
| `WORK_NAME_MAX_ATTEMPTS` | 5 | uniqueness attempts before possessive fallback |
| `FAILURE_SCAR_LEXICON` | folly/ruin/wreck… | the failure-name register's kind part |
| `ROUTE_IDENTITY_SUBTYPE` | `'trade_route'` | the new location subtype |
| `FACTION_SEED_SYNTH_DEFAULTS` | generic guild content ids | the four content-id lists a synthesized definition points at |
| `OWNS_EDGE_REQUIRED_PROPS` | `['acquiredTick','via']` | schema row |
| (board/binder constants) | unchanged | authored *values* land in data, not new constants — NFP #1 satisfied by the seams docs 1/3 already named |

## Tracing

No new trace *categories* (deliberate — the doc-1/doc-3 seams already emit
`undertaking_checkpoint` / `binding_decision` / `strategic_world_change` and kind work rides
them). Two additive payload extensions on an existing interface:

```ts
// StrategicWorldChangeTrace — additive fields (existing category 'strategic_world_change')
interface StrategicWorldChangeTraceAdditions {
  christenedName?: string;           // set when the completion block named the work (§5)
  holdingTransfer?: {                // set on grant/seize/release/raze through holdings.ts
    verb: 'grant' | 'transfer' | 'release' | 'raze';
    nodeId: string; fromActorId?: string; toActorId?: string;
  };
}
```

The holding facet joins the closed facet union (`trace.ts:1727`) — one of the three compile
anchors the attachment sweep names.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Namer finds no anchor entity | possessive fallback → terminal kind noun; never a blank or template id |
| Lexicon misses a reach/culture cell | foundation-level table → generic kind nouns (coverage AND quality fallback per review §3 doc-5 row — the register hook is doc 5's) |
| `create_group{faction}` finds no qualifying location | skip creation, complete with hall only, traced (the `findQualifyingLocations` fail-soft, reused) |
| Synthesized definition content-id miss | falls to `FACTION_SEED_SYNTH_DEFAULTS`; never an unresolvable template id |
| `transferHolding` on a node with no `owns` edge | grant instead of transfer, traced — seize of the unowned is a claim |
| Holding attachment missing (mirror drift) | edge is authority: reconcile mints the face, traced (roster-reconcile precedent) |
| Destroy candidate with no motive | refused at generation (`no_motive`), traced — never a silent skip |
| Route node/edge desync | edge is authority for economics; node reconciles from edge, traced |
| Legacy fixture group without `groupKind` | presence-fallback discriminators keep working (the migration is additive) |
| Kind row referencing a missing template | registry test fails at build — authoring error, never runtime |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/graph.ts` | 125+ | one union member (`owns`) + `EDGE_SCHEMA` row — additive |
| `src/types/strategicAction.ts` | high (types) | kind-row type + hint variants + `completionChanges` — all additive optional |
| `src/engine/graphQueries.ts` | wide | two sibling accessors + wrapper-routing sweep — mechanical, each site a one-line change |
| `src/types/attachments.ts` | wide | one union member + new consts — additive; the three closed unions error loudly (by design) |
| `src/engine/encounterScoring.ts` / `phaseAgentDecision.ts` | hot | only the `member_of` wrapper sweep touches them — one-line mechanical edits |

## Interface impact

*Design workflow Step 0.7 — contracts per `Docs/canon/interface-map.md`.*

| Contract / seam | Disposition |
|---|---|
| Doc-1/doc-3 authoring seams (`payoffValue`, `motivations`, cast, creation effects, `remote`) | **consume** — the emptiness pins fire deliberately (`decisionBoard.test.ts:93`, `strategicRemoteAnchorGate.test.ts:139`, the paired-control fixtures); each pin's failure is restated as the authored identity |
| `controls` faction-territory contracts (13 consumers) | **preserve untouched** — the new-edge decision exists to keep them |
| `dynamicFactionDefinitions` (producer-less since THR-1292 §3) | **re-activate** — `create_group` restores the write half; both TODO comments updated |
| Secrets & Favors / Ruins-Clues-Delves | **extend** — new producers into existing economies (leverage mark, chart outputs); read halves already live |
| Treasure maps (consumption-only today) | **complete the contract** — `mint_treasure_map` is the missing producer half (the one-sided-contract shape the interface map exists to catch) |
| `getCommandedEntities` (doc 3's provider interface) | **register** — network cells become anchors, as pre-declared |
| `isFactionMembershipEdge` premise | **retire the premise, keep the symbol** — exclusion survives via `groupKind`+fallback; the doc comment's "only non-faction target" sentence is rewritten |
| THR-1303's deletion surface (`controlType: 'strategic'`) | **untouched** — mutexed, not overlapped |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (the doc's center of gravity)
- [x] UI pillar minimal with rationale (Law 56 seam here; surfaces doc 5)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — kinds make mortal ambition produce
  durable named legacy (north star #1's last link); motive-gated destroys are "every destroy
  narratable"; seize-keeps-the-name is the chronicle doing worldbuilding; the wilderness fix
  serves "follow ANY spotlight agent".
- [x] No Vision edit required.

## Rulebook impact

- [x] This plan changes rules of play: agents gain ownership, founding, and destroy verbs; the
  world gains named works.
- [x] `Docs/canon/rulebook.md` gains/updates the undertaking rows (`[IMPL]`-flagged as tiers land)
  in the closing PR; the quick-reference card stays agent-stack-free.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | per-kind difficulty/payoff/motivations are data rows in the packs; namer chances/attempts named constants; motive vocabulary a named set — changing feel is changing rows |
| 2. Inspectability | PASS | destroy refusals traced (`no_motive`); holding verbs + christened names ride `strategic_world_change` additively; the emptiness pins convert to authored-identity assertions as they fire |
| 3. Determinism | PASS | namer is FNV-1a-seeded with input-independent draw counts (the group-namer idiom); mutation ops reuse callers' streams; the golden faction-membership comparison pins the sweep; no `Math.random()` |
| 4. Fail-soft | PASS | ten-row table; possessive/kind-noun naming fallbacks; synthesized-definition defaults; edge-is-authority reconciles for both mirrors |
| 5. Narrative over mechanical perfection | PASS | motive-gated destroys, names-outlive-owners, the failure-name register, and seize-keeps-the-name all exist to keep the chronicle honest |
| 6. Additive over destructive | PASS | new edge type instead of overloading `controls` (zero consumers broken); `groupKind` with presence-fallback; all template/type fields optional; the two agent `controls` writers migrate rather than mutate meaning |
| 7. Performance budget | PASS | no new per-tick scans — kind registry is static data, holdings writes are event-driven, the namer runs once per completion; the `member_of` sweep swaps call targets, not complexity |

## Kill criteria

- **The census regresses** (rolled checkpoint share < 50% on either seed after per-kind
  `requiresLocation` values land) → the values are wrong for the world as it is; revert to
  `false` for the offending kinds and record which (THR-1294's instrument).
- **The cutover envelope still fails after `payoffValue`/`motivations` land** (THR-1301's gate) →
  do not chase it with kind payoffs; the residual is THR-1302's selector-vacuity design call —
  hand the evidence there.
- **The registry gate can be satisfied vacuously** (a destroy row pointing at an unreachable
  template) → the gate must resolve reachability, not presence; fix the gate before authoring on.
- **Seize shows any intermediate state** in the atomicity test (edge moved, faces inconsistent) →
  stop; the single-writer is the deliverable, not the verbs on top of it.
- **The `member_of` sweep changes any faction-membership read's result** on the shipped corpus
  (golden comparison on seeds 42/99) → the wrapper migration was not mechanical; stop and diff.

## Done when

*(T1-scoped; T2/T3 implementation issues are filed from this plan at closeout — the tiers ship
whole and sequenced, per the grammar; "strangler, never big-bang".)*

- [ ] Kind registry + no-destroy-no-kind gate + `groupKind` + the `member_of` wrapper sweep
  merged; golden faction-membership comparison green on seeds 42+99
- [ ] `owns` + `holdings.ts` live: the two un-flagged agent writers migrated; seize atomicity
  test green; holdings render in AttachmentsTab/codex (Playwright 1920×1080 + console capture)
- [ ] Work namer live: a completed T1 undertaking christens through the resolver; a visible
  failure writes its `failureScars` register entry; the eight `nameTemplate` possessives fixed
  (CLI evidence with names in events)
- [ ] T1 shipped whole: five kind rows authored (cast, creation effects, difficulty, payoff,
  motivations, flags), the wilderness pack live with ambition profiles, the leverage-mark
  vertical slice proven end-to-end in a 150-tick CLI run on both seeds; liveness census ≥ 50%
  rolled; decision-mix shift reported against the THR-1301 envelope
- [ ] T2/T3 issues filed with coordination blocks (route+blockade slice; warband slice;
  `create_location`; `create_group` per THR-1295's Done-when), each citing this plan's rows
- [ ] `npm test` + `npx vite build` + `npm run check:typecheck`; engine smoke; freshness gates
  LAST; UL-proposal issue filed for *work/holding/undertaking-kind* terms
- [ ] Closing commit body includes `Fixes THR-1297`

## Coordination block

**Suggested model:** opus — content-heavy authoring against contract-tested seams plus two
mechanical sweeps with golden comparisons (advisory; the automation runs Opus regardless).

**Parallel-safe with:** [THR-1298](https://linear.app/threadbare/issue/THR-1298/the-reactive-loop-proactive-agent-actions-plan-doc-46) /
[THR-1299](https://linear.app/threadbare/issue/THR-1299/the-calling-and-the-surfaces-proactive-agent-actions-plan-doc-56) /
[THR-1300](https://linear.app/threadbare/issue/THR-1300/the-undertaking-factory-proactive-agent-actions-plan-doc-66)
*design sessions* (docs-only).

**Mutex with:**
- [THR-1301](https://linear.app/threadbare/issue/THR-1301) (cutover): it flips on the values this
  doc authors; both touch `decisionBoard.ts` inputs and the balance evidence — sequence the
  cutover measurement after T1's values land.
- [THR-1302](https://linear.app/threadbare/issue/THR-1302) (ambition-boost vacuity): shares the
  desire-input seam (`motivations` authoring changes what that design call measures).
- [THR-1303](https://linear.app/threadbare/issue/THR-1303) (control deletion): disjoint by the
  new-edge decision, but both edit `strategicActionCandidates.ts` — declare, don't overlap.
- [THR-1294](https://linear.app/threadbare/issue/THR-1294) / [THR-1295](https://linear.app/threadbare/issue/THR-1295):
  **absorbed by this plan** (per-kind flags; `create_group`) — close them against this issue's
  slices rather than executing separately.

**Files to touch:**
- Create: `src/data/undertaking-kinds.ts`, `src/data/work-name-content.ts`,
  `src/data/strategic-packs/wandererStrategicPack.ts`, `src/engine/holdings.ts`,
  `src/engine/naming/workNames.ts`, registry/atomicity/golden tests
- Edit: `src/types/graph.ts` + `src/types/edgeSchema.ts` (`owns`; `commanded_by` description),
  `src/types/strategicAction.ts` (kind row, hint variants, `completionChanges`),
  `src/types/attachments.ts` (+ consts), `src/engine/strategicGraphOps.ts` +
  `strategicActionLifecycle.ts` (ops, christening hook, fallback dedupe),
  `src/engine/groups/groupFormation.ts` + `armySpawning.ts` + `battleResolution.ts` (`groupKind`),
  `src/engine/graphQueries.ts` + the ~49-site wrapper sweep, `src/engine/groups/groupNames.ts`
  (fold into resolver), `src/engine/culturePhonetics.ts` (`'work'` mode),
  `src/engine/binding/creationEffects.ts` + `remoteAnchor.ts` (naming route; network anchors),
  `rewardPool.ts` + `nudgeGrantLiveness.ts` + `attachmentSlotResolver.ts` +
  `agentAttachments.ts` + UI attachment surfaces (the §3 sweep), the six packs (kind-row
  authoring), `src/data/ambition-templates.ts` (profiles), `src/data/content-eval/compositionContract.ts`
  (Law 56 seam), `scripts/interface-contracts.ts` + wiki pages

## Notes for the executor

- **Slice order:** (1) `groupKind` + `member_of` sweep with the golden comparison; (2) kind
  registry + gate; (3) `owns` + holdings + writer migration + attachment sweep; (4) namer +
  christening + failure register; (5) T1 kind rows + wilderness pack + profiles + the
  leverage-mark slice; (6) measurements (census, decision mix) + file the T2/T3 issues.
  Sequential PRs; the closing PR carries `Fixes THR-1297`.
- The emptiness pins are supposed to go red — restate each as its authored identity when it
  fires (the pin's own comments say so).
- The `member_of` sweep's full ~49-site file:line list and the raw-incoming/army lists are in
  the recon record on this issue — work from the list, not a fresh grep.
- File at execution: the `runGenome.ts` location-as-`member_of`-target schema violation (its own
  ticket); the lair placeholder-name finding; the `worldSeed.ts:370-374` no-op prefix ternary.
- Do not add `holding` draws to reward recipes yet — holdings are earned through undertakings,
  never dropped as loot; the reward-path arms exist so the *gate* understands the category, not
  to enable drops (`categoryWeights` stays holding-free).
- UL: file the `UL-proposal` issue for **work**, **holding**, **kind row**, **christening**,
  **failure-name register** in the same closeout (the grammar verdict's naming lean, veto open).

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-08-27*

**Intent-judge (Step 8.5): Allow** — first pass, all 11 dimensions PASS, zero GAPs/VIOLATIONs,
impact class Reversible confirmed. Both author-flagged judgment calls scrutinized and upheld on
independently verified code ground: the `owns` edge is "exactly the explicit, measured decision
the review demanded of this doc", and the route-identity subtype is "the smallest shape that
satisfies the ruled vertical slice without violating the node-type constitution, correctly
flagged veto-open." Three non-blocking notes: (1) the home-territory rule is the one behavioral
change with no ruling behind it — surfaced with a veto line in the handoff comment; (2) content
depth at execution accepted as standard; (3) a two-line citation drift fixed in place
(`attachmentSlotResolver.ts:274`). Proposal:
`Docs/plans/.intent-proposals/2026-08-27-thr-1297-action-library-works-holdings-naming.md`.

### NFP audit

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | Per-kind `checkpointDifficulty`/payoff/motivations are data rows in pack files (not hardcoded logic); Constants table names 9 discrete constants (`KIND_DIFFICULTY_*`, `WORK_NAME_PHONETIC_CHANCE: 0.35`, `WORK_NAME_MAX_ATTEMPTS: 5`, `MOTIVE_GATE_KINDS`, etc.) |
| 2. Inspectability | PASS | `no_motive` destroy refusal traced like existing `no_eligible_apprentice` gate; additive `christenedName`/`holdingTransfer` fields on existing `strategic_world_change` trace category rather than a silent side-channel |
| 3. Determinism | PASS | Namer is FNV-1a seeded from node id with explicitly input-independent draw counts ("the group-namer idiom"); mutation ops reuse callers' PRNG streams; `member_of` sweep is pinned by a golden comparison on seeds 42/99; doc states "No `Math.random()`" |
| 4. Fail-soft | PASS | Ten-row fail-soft table covers every new surface (namer anchor miss → possessive→kind-noun cascade, lexicon miss, synth-definition miss, transfer-without-owns→grant, mirror drift→reconcile-traced, registry gate failing at build not runtime) |
| 5. Narrative over mechanical perfection | PASS | Motive-gated cross-family destroys ("no motiveless demolition"), names-outlive-owners via `nameEchoes`, and a distinct failure-name register are all explicit narrative-priority design choices, not incidental |
| 6. Additive over destructive | PASS | New `owns` edge type chosen specifically to avoid overloading `controls` (disposition table shows 0 of ~30 read sites broken); `groupKind` ships with presence-fallback for legacy fixtures; all new template/type fields listed as optional |
| 7. Performance budget | PASS | No new tick phases and no new per-tick scans; holdings writes are event-driven, namer runs once per completion, kind registry is static data read, not scanned |

**NFP AUDIT: PASS**

### Three-pillar audit

| Pillar | Verdict | Finding |
|---|---|---|
| Engine | present-and-substantive | 7 subsections (kind registry, motive gates, `owns`/holdings, `groupKind`, namer, object shapes, wilderness) with graph/tick/resolution/PRNG all filled |
| Content | present-and-substantive | 10 kind rows, 3 vertical slices, prose/lexicon pointers — doc's stated center of gravity |
| UI | present-but-thin, rationale stated | Deliberately minimal — the Law 56 declaration seam + mechanical attachment-surface touches; surfaces deferred to doc 5 (THR-1299), named explicitly with justification |

Missing required sections: none. Wiring: 7-row table populating all six required columns.
Substrate-existence check (THR-658): `## Substrate inventory` present, 9 rows cross-checked
against `Docs/canon/systems-inventory.md` (names match verbatim); no green-field duplication —
new pieces explicitly justified as extending named existing mechanisms.

`PILLAR AUDIT: PASS — all three pillars addressed; UI intentionally thin with explicit rationale; substrate inventory cross-checks clean`

### Vision audit

**Premises touched:** `02-non-negotiables.md` → "narrative over mechanical perfection" —
confirmed (motive-gated destroys, names-outlive-owners, failure-name register, seize-keeps-the-name).
`00-north-star.md` → durable named legacy / "follow ANY spotlight agent" — extended.
`01-core-loop.md` / `03-design-tensions.md` / `taste-profile.md` — not referenced/engaged.

**Contradictions:** No contradictions found.

**Qualitative checks:** North star: consistent — holdings/naming turn founding/destroying into
durable, named, inheritable legacy; the wilderness fix widens which idle agents can be followed.
Core loop: preserved — no new tick phase, everything rides the existing completion path. God/
protagonist separation: undisturbed — every new verb is agent-tier. Design tensions: not engaged.
Taste profile: not engaged.

`VISION AUDIT: PASS` (note: the plan's north-star invocation is uncited against the Vision file —
a traceability nit, not a violation)
