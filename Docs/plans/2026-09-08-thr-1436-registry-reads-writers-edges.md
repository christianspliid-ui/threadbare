> **title:** `The registry reads the edges the world writes — THR-1436`
> **linear_issue:** THR-1436
> **author:** `Claude Code`
> **created:** 2026-09-08
> **three_pillars:** Engine `done` · Content `done — three grid notes, one canon sentence; no prose` · UI `N/A — no player surface changes; the CLI census gains an ownership column`

# The registry reads the edges the world writes — THR-1436

*Six of the fourteen undertaking object types read ownership through an edge the world never writes, or ignore the one it does; this plan makes the registry agree with the writers so the verbs those types already declare can find something to act on.*

## Why this is load-bearing

The verb × object model (THR-1392) resolves every cell's ownership rule through one reader, `resolveObjectOwners` (`src/data/undertaking-objects.ts:1796`), which walks each type's `ownedVia` edges. The wayfinder research [THR-1435](https://linear.app/threadbare/issue/THR-1435) measured that reader against the world on seeds 42 · 99 and found six types where the registry and the engine disagree about how a thing is held — and the census that resolved [THR-1402](https://linear.app/threadbare/issue/THR-1402) showed the cost: `destroy × Condition`, `destroy × Faction`, `destroy × Companion` and the three Standing cells refused `no_owned_object` / `no_object_exists` on both seeds, not because the world lacked conditions, factions, or standings but because the registry could not see who held them. Route objects were 0 at every tick because the cell that creates a route mints the edge and not the node the object *is*.

Christian's delegation for this class of finding (driver brief, 2026-09-07): *"these are engineering facts, yours to fix. Prefer registering the edge the writer already uses over inventing a new writer."* This plan does exactly that: no new writer, no new edge type, no new node type. It lands before [THR-1403](https://linear.app/threadbare/issue/THR-1403) so the flip's acceptance census counts owned objects, and before [THR-1437](https://linear.app/threadbare/issue/THR-1437) so the seeded freeholds, routes and marks are read by a registry that can see them.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Ambitions & Undertakings — `resolveObjectOwners`, `ownershipOf`, `enumerateObjectHandles`, the motive gate | 🟢 ACTIVE | **extends** — an optional `ownersOf` reader per type beside `ownedVia`; an optional multi-edge shape; a per-verb gate exemption hook |
| Factions & Succession — `getFactionLeaderId` / `getAnointedLeaderId` (`factionNetwork.ts:544–567`) | 🟢 ACTIVE | **connects** — the Faction type reads its leader through the one seam every leader-resolution site already consults |
| Attachments, Items & Possessions — `companions.ts` (`accompanies`, `:252`), `rewardPool.instantiateReward` (`:596–640`), the reward and anomaly catalogs | 🟢 ACTIVE | **connects** — Companion ownership through `accompanies`; catalog template nodes told apart from instances |
| Effects & Conditions — `has_trait` per-bearer state (THR-1395), `removeTrait` | 🟢 ACTIVE | **corrects** — the Condition object becomes the borne edge, so the cure removes one bearer's condition rather than every bearer's |
| Reputation & Influence — `applyReputationWithDelta` (`reputation.ts:233`, mints `reputation_with` on first write), `relates_to` (worldgen writes 56 · 59) | 🟢 ACTIVE | **connects** — Standing objects enumerate both edge types |
| Mortal Economy & Prosperity — `createTradeRoute` (`strategicGraphOps.ts:73–141`), the route identity node arm (`strategicActionLifecycle.ts:1300–1330`) | 🟢 ACTIVE | **extends** — one shared `mintRouteIdentity` helper; the cell calls it |

**Grep evidence (measured 2026-09-07 on `main` 67a13f4f).** `type: 'leads'` is written at one site, `phaseFactionSuccession.ts:256`; `getFactionLeaderId` derives the leader from `member_of.rank` when no `leads` edge stands (0 · 1 edges at tick 150). `type: 'accompanies'` is written at `companions.ts:252` and no registry row names it. `resolveObjectOwners` walks `ownedVia` only; `HOLDER_TO_OBJECT` (`undertaking-objects.ts:216`) lists `owns`, `controls`, `possesses`, `leads`, `has_trait`. `CONDITION.ownedVia` is `[]` (`:1565`) and `cure_condition` removes the trait from **every** bearer of the definition node (`:1638–1640`) under a comment that still says "one node per bearer" — THR-1395 made conditions shared definitions, so a cure today would clear a wound from everyone in the world who carries that wound. `STANDING.shape` is `{ edgeType: 'reputation_with' }` (`:1691`); `reputation_with` edges: 0 at tick 0 and 0 at tick 150 on both seeds. `isItemObject` (`:674`) admits every `artifact` node except holding faces; `seedAttachments.ts:34–66` adds every `REWARD_POSSESSIONS` and `ANOMALY_SIGNATURE_ARTIFACTS` template as a node with no possessor, and `instantiateReward` clones a template into an instance whose id also begins `reward_` (`REWARD_INSTANTIATE_PREFIX = 'reward'`, `rewardPool.ts:236`) and whose properties spread the template's. `ROUTE.create` (`:1110–1120`) returns `createTradeRoute`'s result, whose `createdId` is the edge id; the identity node is minted only in the lifecycle's `trade_route` hint arm. Population consumed: 49 · 57 factions, 59 condition definitions with 4 · 4 borne edges at tick 0 (38 · 29 at 150), 56 · 59 `relates_to`, 129 · 130 artifact nodes of which ~120 are templates, 0 route identity nodes.

## Engine pillar

### Systems design

**R1 — Faction: the owner is the leader the world already derives.** `UndertakingObjectType` gains an optional `ownersOf?: (graph, handle) => readonly string[]`, consulted by `resolveObjectOwners` *before* `ownedVia` and returned as-is when present. `FACTION.ownersOf` returns `[getFactionLeaderId(graph, factionId)]` when a leader resolves and `[]` otherwise; `FACTION.ownedVia` becomes `[]` (a faction is never `commanded_by`, and `leads` is what `getAnointedLeaderId` already prefers inside that seam). Consequences: `destroy × Faction` (plant a schism, ownership `other`) now finds the leader as the owner the motive gate reads — `faction_war` and `grudge` against the leader license it, as THR-1397 intended; a leaderless faction reads `unowned`, which is exactly the precondition THR-1397 set for `claim × Faction` (people-things band).

**R2 — Companion: `accompanies`.** `COMPANION.ownedVia = ['accompanies']`, and `HOLDER_TO_OBJECT` gains `accompanies` (bearer → companion is holder-to-object, the `possesses` direction). `destroy × Companion` (ownership `other`, motive-gated) then targets *another's* companion — "turn them", the half of the live note that needs an owner. Dismissing one's own companion is not a cell: it stays the story's and the expiry phase's (`removeCompanion`, `expireCompanions`), and the grid note is trimmed to say so. *Decided here, veto invited* — the alternative was a second, ungated `use × Companion` cell, which THR-1397 did not ask for.

**R3 — Condition: the object is the borne edge, and the cure is signed.** The world's conditions are shared definition nodes with per-bearer state on `has_trait` (THR-1395; `world-objects.ts` Condition row). So the thing a healer cures is not the definition but one mortal's bearing of it. `CONDITION.shape` becomes `{ edgeType: 'has_trait', edgeDiscriminator: e => target is a trait with subcategory condition | scar }`; the object handle is the edge; the owner is the edge's source (the bearer) through the existing edge-object rule in `resolveObjectOwners`. `cure_condition` removes **that edge** (`removeTrait(graph, edge.source, edge.target)`), never the definition's other bearers — the shared-definition bug is closed at the same time. `create × Condition` is unchanged (its handle is the site, a co-located mortal, and its mint writes the edge). **The gate:** `destroy` is motive-gated by verb, which would make curing a friend's wound need a grudge. The registry gains an optional per-verb `gateExemption?: Partial<Record<UndertakingVerbVariant, (graph, actorId, handle) => boolean>>`; `CONDITION.gateExemption.destroy` returns true when the bearer is an ally of the actor (the blessing's own `isAlly` test, THR-1429) — the sign that gates the curse un-gates the cure. Curing a stranger or an enemy stays gated (a healer does not go to work on someone they have no reason to touch; lifting an enemy's seal needs a motive, which is what makes the seal a counter-play). `strategicActionCandidates` consults the exemption where it consults `evaluateMotiveGate`. *Decided here, veto invited.* The tier reads off the definition node's `tier` (the catalog stamps one) through the edge target.

**R4 — Standing: both edges, one object per ordered pair.** `UndertakingObjectShape` gains `edgeTypes?: readonly EdgeType[]` (additive beside `edgeType`); `enumerateObjectHandles` walks every listed type and dedupes by `${source}→${target}`, keeping the `reputation_with` handle when both exist (the score is the truth, the relationship the fallback). `STANDING.shape = { edgeTypes: ['reputation_with', 'relates_to'], edgeDiscriminator: source and target are actors or a location }`. The three semantics already call `applyReputationWithDelta(edge.source, edge.target, …)`, which mints the `reputation_with` edge on first write — so a `relates_to` handle is a valid object and the op does what it did. Tier: the `reputation_with` score's distance from neutral when present (unchanged), else the `relates_to` sentiment's magnitude through `UNDERTAKING_STANDING_TIER_SENTIMENT_BANDS`. `hostile_to` is deliberately **not** an object: it is what `destroy × Standing` writes.

**R5 — Item: templates are not objects.** `CATALOG_TEMPLATE_IDS` — a module-level `Set` of every id in `REWARD_POSSESSIONS` and `ANOMALY_SIGNATURE_ARTIFACTS` — and `isItemObject` excludes members (holding faces stay excluded as today). Instances are told apart by id, never by prefix (`REWARD_INSTANTIATE_PREFIX` is also `reward`) and never by a stamped property (an instance spreads its template's properties, so a stamp would propagate). The 1–2 world artifacts (`artifact_i`, unheld, on a Location) remain objects — they are what `claim × Item` (wanted) is for.

**R6 — Route: the cell mints the node the object is.** `mintRouteIdentity(graph, sourceLocId, targetLocId, edgeId, actorId, tick): GraphOpResult` in `src/engine/tradeRouteOps.ts`, extracted verbatim from the lifecycle's `trade_route` arm (`createLocation` at the origin hex, subtype `ROUTE_IDENTITY_SUBTYPE`, name `${A}–${B} Road`, `routeSourceId` / `routeTargetId` / `routeEdgeId`). The lifecycle arm calls it; `ROUTE.create` calls it after a successful `createTradeRoute` and reports the **node** as `createdId` (the object; the edge id is carried on the node). Consequence: `create × route` produces a Route object; `claim / seize / observe / lower / use × Route` enumerate it; THR-1437's seeded routes use the same helper.

### Graph nodes / edges

No new node type, no new edge type, no new property. Read differently: `accompanies` (Companion owner), `has_trait` to a condition-class trait (the Condition object), `relates_to` beside `reputation_with` (Standing objects), `leads` / `member_of.rank` through `getFactionLeaderId` (Faction owner). Written by an additional caller: the `trade_route` identity `location` node (`ROUTE.create`).

### Tick phases

None new. Every change is inside the registry read at proposal (`strategic_projects` candidate enumeration, phase 2b) and completion (2a.55).

### Resolution logic

- `resolveObjectOwners`: `ownersOf` first; else edge object → source; else `ownedVia` as today.
- `enumerateObjectHandles`: `edgeTypes` iterated in order; dedupe by ordered pair, first type wins.
- Gate: `strategicActionCandidates` skips `evaluateMotiveGate` for a candidate whose type declares an exemption that returns true for `(actor, handle)`; the board trace records `gate_exempt:<reason>` beside the refusal list so the skip is inspectable.
- Standing tier: `|sentiment|` ≤ bands → T1 / T2 / T3, deterministic.

### PRNG callouts

None. Every choice is a lookup, a sort or a first.

## Content pillar

### Encounter templates

Content: N/A for templates — no encounter or prose is authored. Three grid notes change in `scripts/undertaking-grid-dispositions.ts` (Companion destroy, Condition destroy, the three Standing cells) and `Docs/canon/undertakings.md` § The verb × object model gains one sentence on ownership readers; the grid regenerates.

### Prose tables

N/A — no line-set changes; the cells keep their verb lines.

### Attachment content

N/A — no catalog entry changes. `CATALOG_TEMPLATE_IDS` is derived from the catalogs, never hand-listed.

### Data tables

- `src/data/undertaking-objects.ts` — the six types; `HOLDER_TO_OBJECT`; `CATALOG_TEMPLATE_IDS`.
- `src/data/strategic-action-constants.ts` — `UNDERTAKING_STANDING_TIER_SENTIMENT_BANDS`.
- `scripts/undertaking-grid-dispositions.ts` — notes; `Docs/canon/undertakings.md`.
- `scripts/interface-contracts.ts` — rows below.

## UI pillar

UI: N/A — no player surface changes. Every fix is a registry read; what the player sees is that cells which never fired begin to fire, through surfaces that already exist (the moment card, the sheet). The one inspection change: the CLI `objects` readout gains an **owned** column per undertaking kind (objects · owned · owned by a deciding mortal), which is the number this ticket moves and the number THR-1437 is measured on. Headless evidence only (THR-688 rule C); `Browser-verify exempt: registry reads only, no component touched` on the closing commit.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/data/undertaking-objects.ts` (`ownersOf`, `gateExemption`, `edgeTypes`, six types) | 2b (proposal), 2a.55 (completion) | — | graph only | existing `undertaking_cell_unreachable`, `strategic_candidate_board` (+ `gate_exempt`) | CLI `objects` owned column; `census:ownership` |
| `src/engine/strategicActionCandidates.ts` (exemption consult) | 2b | — | — | `strategic_candidate_board.refusals` | board trace |
| `src/engine/tradeRouteOps.ts` (`mintRouteIdentity`) + `strategicActionLifecycle.ts` (calls it) | 2a.55 | — | graph | existing `strategic_world_change` | CLI `undertakings` |
| `scripts/census-ownership.ts` (ported from the proto reader) | — | — | — | — | `npm run census:ownership` |

Player controls: N/A by design — no player verb changes.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `UNDERTAKING_STANDING_TIER_SENTIMENT_BANDS` | `[0.3, 0.6]` | Standing tier from a `relates_to` sentiment's magnitude when no `reputation_with` score exists; mirrors `UNDERTAKING_STANDING_TIER_DISTANCE_BANDS` |
| `CONDITION_CURE_UNGATED_FOR_ALLIES` | `true` | whether curing an ally's condition bypasses the motive gate (the cure's sign); `false` restores the verb's default gate |

## Tracing

No new category. The board trace's `refusals` gains no member; a gate exemption records `{ templateId, reason: 'gate_exempt:ally' }` in the same list so a skipped gate is as visible as a refused one.

```ts
// StrategicCandidateBoardTrace.refusals (existing) — one more reason value
// { templateId: 'cell.destroy.condition', reason: 'gate_exempt:ally' }
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `getFactionLeaderId` returns null | faction reads `unowned` (a claim target, never a crash) |
| `accompanies` edge to a missing companion node | handle skipped by `enumerateObjectHandles` (node absent) |
| Condition edge whose target is not a condition-class trait | excluded by the discriminator |
| Bearer node gone by completion | `cure_condition` refuses `bearer_gone` |
| `isAlly` throws | exemption returns false → the gate applies (safe direction) |
| Both a `reputation_with` and a `relates_to` for one pair | one handle, the score's |
| `relates_to` with no numeric sentiment | tier defaults with `undertaking_tier_defaulted` as today |
| Catalog arrays empty | `CATALOG_TEMPLATE_IDS` empty; every artifact is an object (today's behaviour) |
| `mintRouteIdentity` fails after the edge landed | the edge stands (the economy's authority); the cell reports `createdId` = edge id and traces `route_identity_unminted` on the world-change summary |

## Interface impact

| Contract | Status today | Action |
|---|---|---|
| `undertaking-object-types` | 🔵 UNVERIFIED-OK | **extend** — `ownersOf`, `gateExemption`, `edgeTypes`; six rows re-read |
| `t1-undertaking-objects-feed-existing-economies` | 🟢 LIVE | **extend** — Route objects now exist for the route cells to feed |
| `destroy-candidates-gated-on-motive` | 🟢 LIVE | **extend** — a per-type exemption; note names the cure |
| `mortal-inflicts-a-condition` (THR-1429) | 🔵 | **preserve** — the create side is untouched; the cure reads the edge |
| `world-object-registry` | 🟢 LIVE | **preserve, with one sentence** — no kind, class or subtype changes. The catalogue's Condition *kind* stays the shared definition node (`world-objects.ts` Condition row, `shape: node`); the undertaking *object* for a Condition becomes the borne `has_trait` edge. That is the one kind where the two registries' shapes differ on purpose, and the catalogue row's `note` gains the sentence saying so (intent-judge finding, 2026-09-08) |
| `undertaking-ownership-agrees-with-writers` | — | **add** — producers: `worldSeed`, `holdings`, `companions`, `reputation`, `phaseFactionSuccession`, `rewardPool`; consumer: `resolveObjectOwners`. Register in `scripts/interface-contracts.ts` |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (grid notes and the canon sentence; templates N/A with rationale)
- [x] UI pillar N/A with rationale (CLI column only)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves `02-non-negotiables.md` §4 (everything is a graph node/edge — the registry reads the graph the writers make, and the Condition object becomes the edge the catalogue says it is) and mortal sovereignty (no player verb changes).
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes one rule of play: **curing an ally needs no quarrel; curing a stranger or an enemy does** (the cure is signed like the blessing).
- [x] `Docs/canon/rulebook.md` § conditions gains that sentence, marked `[IMPL]` by the executor in the same PR.

> Brainstorm companion: `Docs/plans/2026-09-08-thr-1436-registry-reads-writers-edges-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | two named constants; the template set is derived from the catalogs |
| 2. Inspectability | PASS | the gate exemption is on the board trace; `census:ownership` prints objects · owned per kind |
| 3. Determinism | PASS | no random call; dedupe order is the declared `edgeTypes` order |
| 4. Fail-soft | PASS | nine rows; the exemption fails closed (gate applies) |
| 5. Narrative over mechanical perfection | PASS with note | a healer does not need a grudge to help a friend — the sign, not the verb, decides |
| 6. Additive over destructive | PASS with note | three optional fields on the type; one shape change (Condition node → edge) that no live consumer other than the cell reads; one bug fixed by it (the whole-world cure) |
| 7. Performance budget | PASS | `getFactionLeaderId` is already computed per faction by the succession phase; the pair dedupe is O(edges) per enumeration under the existing `object` scan cap |

## Done when

- [ ] Headless, seed 42 medium, tick 0: `census:ownership` shows Faction owned ≥ the number of factions with a resolvable leader (every guild and definition faction), Companion owned = minted companions after one `spawn undertaking … cell.create.companion`, Condition objects = borne `has_trait` edges to condition-class traits (4 at tick 0), Standing objects = 56 (the `relates_to` pairs), Item objects = possessed + world artifacts (≤ 10), Route objects = 1 after one completed `cell.create.route` (`--band success`) — each falsified against a generated world, never a fixture
- [ ] `cure_condition` on a shared definition with two bearers removes exactly one bearer's edge (test); a cure on an ally is not motive-gated and a cure on a stranger is (`undertakingMotiveGate.test.ts`)
- [ ] The census re-run (`census:cells`, ported by THR-1403 or run from the proto branch) shows `no_owned_object` gone for `faction`, `condition`, `companion` and `no_object_exists` gone for `standing`; recorded on this ticket
- [ ] The grid regenerates with the three notes; `Docs/canon/undertakings.md` carries the ownership-reader sentence; `Docs/canon/rulebook.md` § conditions carries the cure's sign; interface map regenerated with the new row; wiki pages whose `sources` match touched files updated or exempt with a reason
- [ ] 30-tick CLI engine smoke and `npm run test:heavy` locally (engine files touched)
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build` pass
- [ ] Closing commit body includes `Fixes THR-1436`
- [ ] `Browser-verify exempt: registry reads only, no component touched` in the commit body

## Kill criteria

- If the Faction owner read makes `destroy × Faction` fire against monster-lair factions on the census seeds (36 · 44 of the factions are lairs' with no leader → `unowned`; a leader-less faction cannot be schismed by this rule, so the shape is right by construction — if it fires anyway, the discriminator is wrong, not the rule).
- If the Condition-as-edge shape breaks a live reader of `cell.destroy.condition` outside the registry (grep: the live proof's `mutation_object` reads the removed edge, the grid's op name is unchanged) — the executor lists the readers in the closeout.

## Coordination block

**Suggested model:** opus — six seams, one shape change with a shared-definition subtlety, and a gate hook that must fail closed.
**Parallel-safe with:** THR-1432 (omens), THR-1433 (intention reading), THR-1434 (codex page) — none touch the registry or the candidates module.
**Mutex with:** THR-1403 (both edit `src/data/undertaking-objects.ts`, `scripts/undertaking-grid-dispositions.ts`, `src/engine/strategicActionCandidates.ts` — **land this one first**); THR-1437 (edits `undertaking-objects.ts` for nothing but reads `mintRouteIdentity` — land this first).
**Files to touch:** `src/data/undertaking-objects.ts`, `src/engine/strategicActionCandidates.ts`, `src/engine/tradeRouteOps.ts`, `src/engine/strategicActionLifecycle.ts`, `src/engine/undertakingResolver.ts` (no logic change expected; verify `ownershipOf`), `src/data/strategic-action-constants.ts`, `src/types/strategicAction.ts` (only if the type interfaces live there — the registry's own interfaces are in `undertaking-objects.ts`), `src/data/world-objects.ts` (the Condition row's `note` only) + `Docs/canon/world-objects.md` (the same sentence), `src/data/world-objects.ts` (the Condition row's `note` only) + `Docs/canon/world-objects.md` (the same sentence), `src/cli` (`objects` readout), `scripts/census-ownership.ts` (new) + `package.json` script, `scripts/undertaking-grid-dispositions.ts`, `scripts/interface-contracts.ts`, `Docs/canon/undertakings.md`, `Docs/canon/rulebook.md`, tests: `src/data/__tests__/undertaking-objects.test.ts`, `src/engine/__tests__/undertakingMotiveGate.test.ts`, `src/engine/__tests__/undertakingObjectTargets.test.ts`.

## Notes for the executor

- **`ownersOf` before `ownedVia`, and only one of them per type.** A type that declares both is an authoring error the test pins. Faction is the only `ownersOf` type this plan adds.
- **The Condition edge discriminator reads the target's subcategory.** `CONDITION_SUBCATEGORIES` from `world-objects.ts` (`condition`, `scar`) — never a hand list. The seal's Null-Touched is a `condition`, so lifting a seal early is the same cell.
- **The cure's `isAlly`** is the THR-1429 helper in `undertaking-objects.ts` (same faction, same company, or `reputation_with` ≥ `CONDITION_ALLY_STANDING_MIN`). Self is not an ally for this purpose and is not a target (`other` ownership) — resting off one's own wound is not a work.
- **Standing dedupe** must be by ordered pair; a→b and b→a are two standings. Keep `hostile_to` out of the shape — it is the product of the destroy cell.
- **Templates by id set, not by prefix or stamp** (both would misclassify instances — see § R5).
- **`mintRouteIdentity`** is an extraction, not a rewrite: keep the name form and the properties exactly, and make the lifecycle arm call it so there is one writer.
- **Found on the way, not this ticket:** `destroy × Standing` opens the quarrel between the standing's *two parties* (`createRelationEdge(edge.source, edge.target, 'hostile_to')`), not between the actor and the other party — a bystander can set two strangers at odds. Record it on THR-1403's ticket as a semantic to review at the flip.
- **Tests falsify at the owning layer:** a generated small world (`initializeGameState`, 20 ticks) for the counts; unit fixtures only for the dedupe and the exemption.

## Intent-judge verdict

**Run 1 (fable, cold, 2026-09-08): Allow** — impact class Reversible confirmed; ten dimensions PASS, one GAP on substrate existence: the world-object catalogue's Condition *kind* is a node (`world-objects.ts` Condition row) while this plan makes the undertaking *object* the borne `has_trait` edge — the one kind where the two registries' shapes differ. Applied in this revision: the Interface-impact row says so and the catalogue row's `note` joins the files to touch. Every cited line was verified at source by the judge (`HOLDER_TO_OBJECT`, the whole-world cure loop, `STANDING.shape`, `isItemObject`, `REWARD_INSTANTIATE_PREFIX`, the sole `leads` writer, the lifecycle's route arm); the create-side of Condition was verified unaffected (`undertakingResolver.ts:135` bypasses the shape check for `create`).

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-08 (sonnet, three auditors spawned in one message).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Two named constants (`UNDERTAKING_STANDING_TIER_SENTIMENT_BANDS`, `CONDITION_CURE_UNGATED_FOR_ALLIES`); template set derived from catalogs, not hand-listed |
| 2. Inspectability | PASS | Gate exemptions recorded on existing board trace (`gate_exempt:<reason>`); new `census:ownership` CLI column; wiring table maps every module to an existing trace/CLI surface, none silent |
| 3. Determinism | PASS | Explicit "PRNG callouts: None — every choice is a lookup, a sort or a first"; Standing dedupe order is the declared `edgeTypes` order |
| 4. Fail-soft | PASS | Nine-row fail-soft table; exemption fails closed (`isAlly` throws → gate applies, safe direction); `mintRouteIdentity` failure leaves the edge standing rather than losing the route |
| 5. Narrative over mechanical | PASS-with-note | Curing an ally bypasses the motive gate while a stranger/enemy stays gated — "the sign, not the verb, decides," a deliberate rule change (Rulebook impact section), not an oversight |
| 6. Additive over destructive | PASS-with-note | Three optional fields on the type registry; one genuine shape change (Condition object: node → borne edge) justified as closing a real bug (whole-world cure); the "no other live reader" claim is deferred to a kill-criterion grep the executor must run, so the risk is named rather than hidden |
| 7. Performance budget | PASS | `getFactionLeaderId` reuses an already-computed value; pair dedupe is O(edges) under the existing object-scan cap; no new tick-phase work |

**NFP AUDIT: PASS-with-notes** (rows 5 and 6).

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design (R1–R6), Graph nodes/edges, Tick phases, Resolution logic, PRNG callouts all present with real content |
| Content | present-and-substantive | Data tables filled; Encounter templates / Prose tables / Attachment content N/A with a one-line rationale each |
| UI | N/A-with-rationale | "UI: N/A — no player surface changes", CLI census column only |

No missing required sections; Blast Radius correctly omitted (no ≥100-importer file touched). Wiring section connects the Engine pillar to phase (2b, 2a.55), GameState, trace and debug visibility. Substrate check: PASS — all six subsystems match the inventory verbatim, all 🟢 ACTIVE, dispositions extends / connects / corrects, no green-field duplication.

**PILLAR AUDIT: PASS.**

### Vision audit

`02-non-negotiables.md` → everything is a graph node/edge — confirmed (a graph-fidelity correction); the player is a god, not a protagonist — confirmed by omission (no player verb changes); additive over destructive — confirmed (three optional fields, one extraction helper, the catalogue kind unchanged and the divergence documented); three pillars — confirmed with rationale; narrative over mechanical — indirect (the signed cure is a narrative asymmetry). `00-north-star.md`, `01-core-loop.md`, `03-design-tensions.md`, `taste-profile.md` → not referenced, correctly. No contradictions. North star neutral (repairs plumbing THR-1403 and THR-1437 need); core loop preserved; non-negotiables clear; no tension leaned on; taste profile clear.

**VISION AUDIT: PASS.**
