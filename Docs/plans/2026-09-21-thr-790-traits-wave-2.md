> **title:** `Traits wave 2 — places earn traits from what happens to them, and the pool reads them — THR-790`
> **linear_issue:** THR-790
> **author:** `Claude Code`
> **created:** 2026-09-21
> **three_pillars:** Engine `done` · Content `done — four location trait definitions with their effect rows, one pool-bonus table, the bearer-kind carve` · UI `done — the location page's condition rows gain their effect line; Playwright DOM evidence`

# Traits wave 2 — THR-790

*Wave 1 put traits on mortals and let encounters react to them. Wave 2 puts traits on places the way the program epic promised — minted from what the world already measures, read by the pool that decides what happens there — and closes the two gaps that would otherwise let a mortal be dealt "Festival".*

## Why this is load-bearing

THR-789's settled verdict (Christian, 2026-07-26): traits are *the main flexible trigger for custom variant events game-wide*, on every object; *an object's traits are always visible in its interface*; a trait hook always names its trait. Wave 1 shipped: THR-786 unified the predicate across six read sites, and the authored gate corpus that THR-788 measured at zero in July is now real — `traitVariants` ×28, `requiredTraits` ×20, `requiredTargetTraits` ×28, `StepNudge.requiredTrait` ×15 across `src/data/`. The parent plan's own kill criterion for the whole bet is wave 2's: *"if wave 2 location traits ship and no measurable behavior shift appears in headless runs (encounter pool composition at #haunted vs unmarked locations)"* (`2026-07-26-traits-trigger-architecture.md:179`).

Two things moved since the ticket was filed, and the plan is shaped by both. **Location traits half-shipped under another name.** THR-1143 / 1175 / 1483 built six `trait.condition.location.*` definitions (`condition-trait-content.ts:404-532`), three live readers — movement cost (`movementCost.ts:112-118`), step resolution (`resolutionModifiers.ts:640`), target-action gating (`targetActions.ts:302-306`) — and a player surface (`LocationProfileModal.tsx:101-122`). What never shipped is a **producer from the world's own scalars**: every location trait today is planted by an encounter aftermath. So item 1 of the ticket is a phase, a table and a pool term, not a substrate. **THR-1481 shipped the content query**, which subsumes most of item 3 (draw-by-trait): *"gain a random #relic"* is `{ kind: 'item_template', tags: ['#relic'] }` today. What remains is two specific gaps, one of them a live defect: `condition_template`'s catalog carve is *every* `trait` node with `subcategory ∈ {condition, scar}` (`engine/contentQuery.ts:156-168`), which includes the six location conditions — and **45 shipped `rewardPool` recipes** with `categoryWeights.condition` and no `tagFilters` can hand a mortal *Closed for the Season*. Adding four more location traits without the carve fix doubles that blast, so the carve lands in this slice, first.

THR-800's lesson binds every trait named here: *a definition with no producer is gate theatre* — it gives a ref something to resolve to while no bearer holds it, and the sweep goes quiet. Every trait in this plan has a named threshold writer and at least one named reader in the same slice, per the director's 2026-09-12 rule recorded at `condition-trait-content.ts:585-614` (`CONDITION_IDS_WITHOUT_EFFECT` is empty and its emptiness is load-bearing).

## Substrate inventory

Grep evidence 2026-09-21 on `main`. `has_trait` sources today: `['actor','location','sublocation']` (`edgeSchema.ts:65-73`); schema enforcement is a dev-only `console.warn` (`graph.ts:133-150`). Twelve `assignTrait` call sites, all actor-targeted; location traits are written only by raw `addEdge` from encounter aftermath. No `trait_minted` trace category exists.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Effects & Conditions** — `trait.condition.location.*` (six definitions, `condition-trait-content.ts:404-532`), **`LOCATION_CONDITION_ID_PREFIX` / `LOCATION_CONDITION_IDS`** (`:571-583`, THR-1143 — the prefix-keyed *"is this a place's condition?"* predicate, derived from the definitions), `LOCATION_CONDITION_MOVEMENT_TAX` (`:623`), `LOCATION_CONDITION_STEP_MODIFIER` (`:650`, cap `0.10` at `:234`), `seedEncounterTraitDefinitions`, `CONDITION_IDS_WITHOUT_EFFECT` (empty, load-bearing) | 🟢 ACTIVE | **extends** — four definitions join the same file, the same prefix and the same two effect tables; the existing predicate is what the carve reads; none ships without a row in at least one table plus the pool table |
| **Personality & Emergent Traits** — `assignTrait` / `removeTrait` (`traits.ts:71,105`), the hysteresis-minting precedent `phaseSettlementPromotion.ts:100-124` (dual thresholds, dead band, sustain counters persisted on the node, mid-band does not reset), `PERSONALITY_TRAIT_VIRTUE_THRESHOLD` (`personalityTraitEmerge.ts:127`) | 🟢 ACTIVE | **extends** — a sibling phase `phaseLocationTraits` copies the promotion phase's shape verbatim and calls `assignTrait` / `removeTrait` on Location nodes |
| **Mortal Economy & Prosperity** — `prosperity` 0–100 (`phaseProsperity.ts:865`), `unrest` 0–100 (`phaseUnrest.ts:89`), `magicalSaturation` 0–1 (`phaseMagicalSaturation.ts:55`), `deathCount` (`agentLifecycle.ts:203-206`, already a threshold input at `phaseProsperity.ts:877`); two writers treat prosperity as 0–1 (`monsterFactionSeed.ts:86`, `RUINED_SETTLEMENT_PROSPERITY_FLOOR`) | 🟢 ACTIVE | **reads** — the four scalars are the minting inputs; the 0–1 writers are read as *Destitute*, which is correct for a monster den and a ruin |
| **Encounters & Dilemmas** — `scoreAndSelect` (`encounterScoring.ts:1014`) resolves `locationNode` once (`:1254`) and derives `rarityMultiplier` and `economicContextBonus` (`:1264-1268`) from it; eligibility keys on `getLocationType` (`encounterCache.ts:352`) | 🟢 ACTIVE | **extends** — one additive `locationTraitBonus` beside `economicContextBonus`, reusing the already-resolved node; no new graph walk |
| **Movement & Colocation** — `computeEdgeCost` compounds `LOCATION_CONDITION_MOVEMENT_TAX` (`movementCost.ts:53,112-118`) | 🟢 ACTIVE | **reads for free** — a new trait with a tax row is taxed with no code change |
| **Content model** — `graphContentCatalogs` / `carveNodes` (`engine/contentQuery.ts:112,156-168`), `assembleRewardPool` (`rewardPool.ts:184`, per-bearer filtering only for companions `:210-224`), `ContentQuery.exclude` (`contentQuery.ts:88`, honoured at `:265`, **no caller populates it**), trait families not registered as content catalogs (`content-objects.ts`), `#condition` / `#location` unseated, `CONTENT_TAG_RETROFIT_PENDING` empty and load-bearing | 🟢 ACTIVE | **extends** — the `condition_template` carve reads `LOCATION_CONDITION_ID_PREFIX` (this slice, no new discriminator); dedup-against-held and the bearer-trait filter are slice 2 |
| **Attachments, Items & Possessions** — `artifact` / `artifact_legendary` (`graph.ts:22-23`), `PossessionNodeProperties` (`attachments.ts:77-126`), THR-661's `properties.cursed` (untyped, read by nobody, `graphOpExecutor.ts:1212`), `holdings.ts:160` minting freeholds as `type: 'artifact'` | 🟢 ACTIVE | **untouched here** — artifact traits are slice 3 |
| Surfaces — `LocationProfileModal.tsx:101-122` (walks `has_trait`, filters `subcategory === 'condition'`, shows name + `ticksRemaining`, **not** the effect line), `AttachmentDetailView.tsx:152` (`conditionEffectLine`), `surface-registry.ts:76-99` (location → card `place`, sheet `location`) | 🟢 ACTIVE | **extends** — the location page's rows gain `conditionEffectLine` parity; no new surface |

Runtime counts consumed: a seeded medium world at tick 0 has 214 place-tier Locations (CLAUDE.md § distance matrix); the phase scans settlements only (the prosperity / unrest writers' own population, `phaseProsperity.ts:686`, `phaseUnrest.ts:42-48`) plus every location for saturation.

## Engine pillar

### Systems design

**Minting — `phaseLocationTraits`**, registered after `6.638` (magical saturation) so every input is this tick's. For each Location, four rules, each the settlement-promotion shape (enter threshold, release threshold with a dead band, sustain counter persisted on the node, mid-band holds the counter):

| Trait | Enter | Release | Sustain | Reader that makes it real |
|---|---|---|---|---|
| `trait.condition.location.welcoming` (`#welcoming`) | `prosperity ≥ LOCATION_TRAIT_WELCOMING_ENTER` | `< LOCATION_TRAIT_WELCOMING_RELEASE` | `LOCATION_TRAIT_SUSTAIN_TICKS` | pool bonus to hospitality / market / social families; movement tax `< 1` (a place worth the road) |
| `trait.condition.location.lawless` (`#lawless`) | `unrest ≥ LOCATION_TRAIT_LAWLESS_ENTER` | `< LOCATION_TRAIT_LAWLESS_RELEASE` | same | pool bonus to crime / confrontation families; step modifier against Gold reach |
| `trait.condition.location.veil_thin` (`#veil-thin`) | `magicalSaturation ≥ LOCATION_TRAIT_VEIL_THIN_ENTER` | `< …_RELEASE` | same | pool bonus to arcane / anomaly families; step modifier for Veil |
| `trait.condition.location.haunted` (`#haunted`) | `magicalSaturation ≥ LOCATION_TRAIT_HAUNTED_ENTER` **and** `deathCount ≥ LOCATION_TRAIT_HAUNTED_DEATHS` | saturation `< …_RELEASE` | same | pool bonus to the uncanny families; movement tax `> 1`; step modifier against Heart |

**`#blood-soaked` is deliberately not minted.** There is no per-location battle record — battles overwrite prosperity and subtype and mint no Event node (`battleAftermath.ts:492-510`); `deathCount` counts all deaths. The honest substrate for *blood-soaked* is a battle record that does not exist; minting it from `deathCount` would call a plague a massacre. `deathCount` enters `#haunted` as a co-condition instead, where *many died here and the veil is thin* is exactly the fiction. A battle-history trait is filed as a deferral against slice 3's sibling (below), not faked here.

A minted trait is a `has_trait` edge with no `ticksRemaining` — it lives until the release rule removes it (the phase calls `removeTrait`). Enter and release are exclusive by the dead band, so a location cannot flicker. `veil_thin` and `haunted` are ordered: `haunted` supersedes `veil_thin` on the same location (one is removed when the other enters), so the page never shows both.

**Reading — the pool.** `scoreAndSelect` gains `locationTraitBonus = Σ LOCATION_TRAIT_ENCOUNTER_BONUS[traitId][entry.encounterFamilyTag] ?? 0` over the location's live trait edges, added beside `economicContextBonus` at `:1268`. The table is keyed by trait id × the family tags THR-1481 seated (`content-tags.ts`), so a new family joins by carrying the tag; an unknown tag reads `0`. The three existing readers (movement, step, target gating) need no code — each new definition gets its rows in the two effect tables. **This is the parent plan's kill-criterion instrument:** `npm run census:pool -- --trait '#haunted'` (a new census flag on the existing pool census, or a script beside `kind-reachability.ts`) reports family share at marked vs unmarked locations on seeds 42 / 99.

**The bearer-kind carve — first, not last.** The substrate already declares which conditions are a place's: `LOCATION_CONDITION_ID_PREFIX = 'trait.condition.location.'` and the derived `LOCATION_CONDITION_IDS` (`condition-trait-content.ts:571-583`, THR-1143 — *"the id namespace is the declaration"*). The plan adds **no second discriminator**: the four new definitions take the prefix, and `carveNodes` for `condition_template` **excludes** ids under `LOCATION_CONDITION_ID_PREFIX` unless the query names the place class (`classes: ['location']`), so the 45 untagged `condition` recipes stop being able to deal *Festival* to a mortal — with a falsification arm that asserts the pre-fix candidate set *did* contain a location id and the post-fix set does not. Zero edits to `src/types/traits.ts`. The trait catalogs are **not** registered as content catalogs in this slice (that is slice 2's seating work); the carve reads the graph nodes it already reads.

**What does not change.** `assignTrait` / `removeTrait`, the predicate, the six read sites, the effect-table readers, `LocationProfileModal`'s edge walk, every existing definition, `phaseSettlementPromotion`, the saturation / unrest / prosperity writers.

### Graph nodes / edges

No new type. Four `trait` definition nodes (seeded by `seedEncounterTraitDefinitions`); `has_trait` edges Location → definition, minted and released by the phase; two sustain counters per rule on the Location node (`locationTraitSustain.<rule>`), the promotion phase's idiom.

### Tick phases

**One new phase**, `phaseLocationTraits`, after `6.638` — recorded in `Docs/plans/wiring-checklist.md` and `Docs/canon/systems-inventory.md` (phase table). Cost: one scan of Locations per tick with four threshold tests each.

### Resolution logic

Deterministic thresholds over persisted counters; no draw. Supersession (`haunted` over `veil_thin`) is a fixed order.

### PRNG callouts

None.

## Content pillar

### Encounter templates

N/A — no encounter is authored. Existing encounters gain reach through the pool table: any template tagged with a family the table names scores higher at a marked location.

### Prose tables

- Four definitions with display names and descriptions in the register the six shipped ones use (`condition-trait-content.ts`): *Welcoming*, *Lawless*, *Veil-thin*, *Haunted*.
- `conditionEffectLine` (`aftermathWords.ts:460`) already derives a sentence from the effect rows; the four get one for free and the location page starts showing it (UI).
- Chronicle line on mint at `LOCATION_TRAIT_EVENT_SIGNIFICANCE`: *`${place} has become ${trait word}`*; none on release (a place quietly returning to itself is not an event — Law 13 parity).

### Attachment content

N/A.

### Data tables

`LOCATION_CONDITION_MOVEMENT_TAX` and `LOCATION_CONDITION_STEP_MODIFIER` rows for the four; `LOCATION_TRAIT_ENCOUNTER_BONUS` (new, beside them); constants below. **UL** (`Traits.md`): the Trait entry's bearer list gains *Location* explicitly, and **Location trait** is seated as a sub-entry (*a condition-subcategory trait a place earns from its own scalars and loses when they recover; visible on the place's page*) under delegated seating. **Canon** `Docs/canon/encounters.md`: one paragraph on the pool term. **Rulebook**: one sentence under The World at Work `[IMPL]`.

## UI pillar

*Screenshot tool: **Playwright (DOM)** — `LocationProfileModal`. Route: `?view=game&seeded&size=medium`; force a mint through the CLI / `__DEBUG` (`eval` the scalar above the enter threshold, `tick(LOCATION_TRAIT_SUSTAIN_TICKS + 1)`), open the location's page; capture the condition rows with their effect lines at 1920×1080; console; `__DEBUG.getLocationTraits(id)` assertion; Laws 1 (the trait's image / tooltip / link), 13/14, 21, 56.*

### Player-facing display

- **The location page** (`LocationProfileModal.tsx:101-122`) keeps its walk and gains `conditionEffectLine` beneath each row — the parity `AttachmentDetailView.tsx:152` already has — so *Haunted* reads *"the road here costs more; Heart falters"* rather than a bare name. A minted trait has no `ticksRemaining`, so the row shows no term. Canon rule 2 (an object's traits are always visible in its interface) is satisfied by the surface that exists.
- **The hex tooltip / sidebar** already names the location; no change.

### Event notifications

The mint chronicle line. No toast.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getLocationTraits(locationId?)` → `{ traitId, since, sustain }[]`; CLI `traits <location>`.
- `location_trait` traces in the viewer.

### Visual presence (HexMapV2)

N/A for this slice — no signifier. (A `#haunted` overlay is a legitimate later ask; the trait is on the graph for it.)

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `engine/phaseLocationTraits.ts` (new) | **new phase after `6.638`** | — | graph `has_trait` + `locationTraitSustain.*` on Location nodes | `location_trait` (aggregate per tick: minted / released) | `__DEBUG.getLocationTraits`, CLI `traits` |
| `engine/encounterScoring.ts` (`locationTraitBonus` at `:1268`) | `2a` decision | — | — | existing scoring traces (bonus on the breakdown) | `__DEBUG` scoring readout |
| `engine/contentQuery.ts` (`carveNodes` bearer-kind exclusion) | wherever content is drawn | — | — | existing `content.query_*` | `__DEBUG.queryContent` |
| `data/condition-trait-content.ts` (four definitions + effect rows), `data/location-trait-constants.ts` (new: thresholds + the pool table) | — | — | — | — | — |
| `components/Game/LocationProfileModal.tsx` (effect line) | — | `LocationProfileModal` | reads | — | Playwright capture |
| `types/trace.ts` (+ three sites) | — | — | — | — | — |

Prose pipeline: `conditionEffectLine` (existing). Player controls: none.

## Constants table

In `src/data/location-trait-constants.ts` (new, beside `condition-trait-content.ts`; NFP #1):

| Constant | Default | Purpose |
|----------|---------|---------|
| `LOCATION_TRAIT_SUSTAIN_TICKS` | `36` | ticks a scalar must hold past its enter threshold before the trait mints (three days) |
| `LOCATION_TRAIT_WELCOMING_ENTER` / `_RELEASE` | `70` / `50` | prosperity band (0–100; the promotion phase's own 70 / 20 is the precedent, narrowed) |
| `LOCATION_TRAIT_LAWLESS_ENTER` / `_RELEASE` | `70` / `50` | unrest band (0–100; `phaseUnrest.ts:27-28` already names 70 / 90 as thresholds) |
| `LOCATION_TRAIT_VEIL_THIN_ENTER` / `_RELEASE` | `0.3` / `0.15` | saturation band (0–1; `phaseMagicalSaturation.ts:26-27` names 0.5 / 0.3) |
| `LOCATION_TRAIT_HAUNTED_ENTER` / `_RELEASE` | `0.5` / `0.3` | saturation band for the stronger trait |
| `LOCATION_TRAIT_HAUNTED_DEATHS` | `5` | `deathCount` co-condition |
| `LOCATION_TRAIT_ENCOUNTER_BONUS` | table | trait id × family tag → additive pool bonus (same order as `economicContextBonus`, ≤ `0.15`) |
| `LOCATION_TRAIT_EVENT_SIGNIFICANCE` | `0.4` | the mint chronicle line |

Effect rows (`LOCATION_CONDITION_MOVEMENT_TAX`, `LOCATION_CONDITION_STEP_MODIFIER`) for the four sit in `condition-trait-content.ts` with the existing six, under the cap.

## Tracing

Register at all four sites; never duck-type.

```ts
// location_trait — one aggregate per tick in which any location gained or lost a trait
interface LocationTraitTrace extends TraceBase {
  category: 'location_trait';
  minted: ReadonlyArray<{ locationId: string; traitId: string; input: 'prosperity' | 'unrest' | 'saturation'; value: number; sustainTicks: number }>;
  released: ReadonlyArray<{ locationId: string; traitId: string; value: number }>;
  superseded: ReadonlyArray<{ locationId: string; removed: string; by: string }>;
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Scalar absent on a Location (never written) | rule skipped for that location; no counter written |
| Prosperity written on the 0–1 scale (`monsterFactionSeed.ts:86`, ruins) | reads below every threshold — Destitute — correct for a den or a ruin |
| Definition node missing (saved world from before this plan) | `seedEncounterTraitDefinitions` re-seeds on load; until then `assignTrait` returns its existing "definition missing" reason and the phase traces nothing |
| Both `veil_thin` and `haunted` qualify | `haunted` wins; `veil_thin` released with `superseded` |
| A recipe queries `condition_template` with `classes: ['location']` deliberately | the carve admits location definitions — the opt-in path |
| A location dissolves while carrying a trait | the edge goes with the node; nothing to release |
| Pool table names a family tag no template carries | bonus `0` for every candidate; `contentTags.test.ts` fails the spelling if it is not seated |

## Interface impact

| Contract | Action | Producer → Consumer |
|----------|--------|---------------------|
| `location-condition-taxes-movement-and-gates-templates` (`interface-contracts.ts:2054`) | **extend** | four new producers (the phase's minted definitions) into the five named readers; evidence: the effect-table rows and the page |
| `location-traits-shift-encounter-pool` | **add** | `phaseLocationTraits` → `has_trait` → `scoreAndSelect`'s `locationTraitBonus`; evidence: the `#haunted` vs unmarked census |
| `content-query-one-resolver-engine-and-gate` (`:3187`) | **extend** | the `condition_template` carve gains the bearer-kind axis; the 45-recipe falsification arm is the evidence |
| `trait-predicate-resolution` (`:460`) | **preserve** | unchanged; a Location is already a legal bearer |
| `trait-ref-authoring-vocabulary` (`:486`, 🔴 LEAKED, THR-800) | **preserve — not widened** | the four new ids are minted by a producer in the same slice, so they never enter the dead-ref set; the ratchet in `traitRefReconciliation.test.ts` is updated for four *live* refs, not relaxed |

`Docs/canon/interface-map.md:198` reserves *"Trait minting, decay, and display rows … waves 2–3"*; the two rows above begin them.

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | 125 (`.codesight/graph.md`, 2026-09-21) | one union member + one interface |
| `src/types/traits.ts` | 337 | **not edited** — the place discriminator is the existing id prefix, not a new field |
| `src/engine/graph.ts` / `src/types/unifiedAction.ts` / `src/types/gameState.ts` | 913 / 494 / 599 | **not edited** |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] Does not contradict a Vision premise. Places that remember what happened to them are the living world (`00-north-star.md`); the god touches none of it — the traits are the world's own record, and the pool reading them is the world reacting, which is THR-789's verdict made true for the second object family.
- [x] No Vision edit required.

## Rulebook impact

- [x] **Changes a rule of play** (The World at Work): *A place earns traits from its own fortunes — a town long prosperous is welcoming, one long restless is lawless, ground where the veil has worn thin is veil-thin or, where many have died, haunted — and the encounters that gather there follow the trait.* Lands in `Docs/canon/rulebook.md` in the same PR, `[IMPL]` on ship.
- [x] `Docs/canon/rulebook.md` is updated in the same PR as the code — the executor re-verdicts the section when the tag flips.

> Brainstorm companion: `Docs/plans/2026-09-21-thr-790-traits-wave-2-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | every threshold, band and bonus is a named constant; the pool term is a table |
| 2. Inspectability | PASS | aggregate trace with inputs and values, `getLocationTraits`, CLI, the page's effect line |
| 3. Determinism | PASS | thresholds over persisted counters; fixed supersession order; no draw |
| 4. Fail-soft | PASS | seven rows; every absent input skips the rule |
| 5. Narrative over mechanical perfection | PASS | `#blood-soaked` declined rather than faked from the wrong scalar; *haunted* needs the dead |
| 6. Additive over destructive | PASS | four definitions, one phase, one table, no new field or subcategory; nothing on the six shipped conditions changes; the carve is opt-in for location queries |
| 7. Performance budget | PASS | one Location scan per tick with four comparisons; the pool term reuses the resolved node |

## Done when

**This ticket — slice 1:**

- [ ] Unit, on fixtures that falsify: each rule mints after `SUSTAIN` ticks above enter and not one tick sooner; releases below release and not in the dead band; the mid-band holds the counter; `haunted` supersedes `veil_thin`; a 0–1 prosperity reads Destitute; the carve excludes every id under `LOCATION_CONDITION_ID_PREFIX` from an untagged `condition_template` query **and the pre-fix arm proves a location id was in the set**; `classes: ['location']` admits them; the four new ids are in `LOCATION_CONDITION_IDS` by construction
- [ ] **The parent plan's kill criterion, measured:** seeds 42 and 99, 150 ticks — the census reports family share of resolved encounters at `#haunted` / `#lawless` / `#welcoming` locations vs unmarked, and at least one marked family's share differs from unmarked by more than `LOCATION_TRAIT_ENCOUNTER_BONUS`'s smallest row would predict at zero; the count of locations carrying each trait is reported
- [ ] `LOCATION_CONDITION_MOVEMENT_TAX` / `_STEP_MODIFIER` rows for the four; `CONDITION_IDS_WITHOUT_EFFECT` stays empty; `conditionEffectLine` renders for each
- [ ] Location page effect line — Playwright four-part evidence at 1920×1080; Laws 1, 13/14, 21, 56
- [ ] Phase registered in the wiring checklist and the systems-inventory phase table; `location_trait` at all four sites; `__DEBUG.getLocationTraits`, CLI `traits`
- [ ] UL sub-entry, rulebook sentence, canon paragraph; interface contracts registered; `traitRefReconciliation.test.ts` ratchet updated for four live refs; wiki freshness green
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`; 30-tick CLI smoke; `npm run test:heavy` locally
- [ ] Closing commit body and PR body include `Fixes THR-790`

**Slice 2 — draw-by-trait completion (child, parallel-safe with slice 1):** `assembleRewardPool` populates `ContentQuery.exclude` from the bearer's held template ids (derivable from their `possesses` / `has_trait` targets; `instantiateReward`'s id form `rewardPool.ts:718`) so possessions, conditions and powers dedup the way companions already do; a bearer-trait term `requiresBearerTrait?: TraitPredicate` evaluated at the call site through `resolveTraitPredicate` (the resolver stays pure); the six trait-definition files registered as content catalogs with `#condition` / `#location` / `#place` seated (`CONTENT_TAG_RETROFIT_PENDING` stays empty — seat, do not defer); `check:attachment` then sees them.

**Slice 3 — artifact traits (child, blocked by slice 2 for the draw path):** `edgeSchema.ts:67` gains `artifact` / `artifact_legendary` with a holdings carve-out (`holdings.ts:160` mints freeholds as `type: 'artifact'` tagged `#holding` — never a trait bearer); two state-carrying definitions — `#storied` (level climbs with the encounters the artifact was present in) and `#cursed` (THR-661's untyped `properties.cursed` migrated to an edge so the predicate system can see it; the bearer-side `HiddenMark` unchanged) — while `#masterwork` / `#heirloom` / `#stolen` stay family tags (already seated by THR-1481; only per-bearer state justifies an edge); producer `mintMasterwork` stamps `#storied` at level 1; `ArtifactSheet.tsx` gains a trait slot reconciled with `AttachmentDetailView`'s chip vocabulary; the `trait` world-object row's `via` widens (registry + UL + canon, one PR). A **battle-history record** (the substrate `#blood-soaked` needs) is filed as a deferral beside it, not built.

**Slice 4 — the deferred consumers (child, blocked by slice 1, filed at handoff so the deferral is a ticket and not a sentence):** the three consumers the ticket names that this slice does not wire — **merchant routing** (`scoreRoutePairBalance`, `tradeRoute.ts:324`, reads only `resources`; a `#welcoming` / `#lawless` term is a *new* factor at its two call sites, `tradeRouteOps.ts:135` and `strategicActionCandidates.ts:790-798`), **prose** (`settlementGenomeResolver`, `proseResolvers.ts:1206`, the one `character`-category location layer; zero `has_trait` reads today — a place's traits can move cost and steps but cannot be *said*), and **the Broken-state drift bonus** (what the ticket calls "rebuild-road bonuses": `drawableWhileBroken`, `unifiedAction.ts:2322`, behind `BROKEN_GATE_ENABLED = false` with zero declaring templates — there is no road-repair capability in-run, so this row is a *design decision to make*, not a wire to run). Gated on slice 1's census showing the pool term moves.

## Kill criteria

- The census shows no family-share difference at marked vs unmarked locations on either seed → the pool table's rows are too small or the family tags are unseated; check `contentTags.test.ts` before raising the bonus.
- Locations flicker between minted and released → the dead band is too narrow; widen `_RELEASE` before touching `SUSTAIN`.
- A mortal is dealt a location condition after the carve → the carve regressed or a recipe opted in by accident; the falsification arm is the guard.
- Any of the four ids appears in the dead-ref ratchet → its producer is not firing; fix the phase, never the ratchet.

## Coordination block

**Suggested model:** opus — a new tick phase with hysteresis, a pool term whose spread must be measured, and a content-query carve with a falsification arm; the content rows follow the plan mechanically.
**Parallel-safe with:** [THR-1479](https://linear.app/threadbare/issue/THR-1479) (appointments — `encounterSeeding.ts`, `phaseAgentDecision.ts`; **both touch `encounterScoring.ts`**: THR-1479 at `:1245` (relocation term), this plan at `:1268` (location term) — disjoint lines, additive terms; merge `origin/main` before editing), [THR-1348](https://linear.app/threadbare/issue/THR-1348) (tier pull — disjoint), [THR-1448](https://linear.app/threadbare/issue/THR-1448) (held town — disjoint).
**Mutex with:** any ticket editing `src/data/condition-trait-content.ts`, `src/engine/contentQuery.ts` or `src/engine/orchestrator.ts`'s phase registry (both edit the definition file / the carve / the phase list) — none queued at handoff; re-check at claim.
**Files to touch:** `src/engine/phaseLocationTraits.ts` (new), `src/engine/orchestrator.ts` (phase registration after `6.638`), `src/engine/encounterScoring.ts` (`:1268` term), `src/engine/contentQuery.ts` (`carveNodes` excludes `LOCATION_CONDITION_ID_PREFIX` unless the place class is named), `src/types/trace.ts` (+ three sites), `src/data/condition-trait-content.ts` (four definitions under the prefix + effect rows), `src/data/location-trait-constants.ts` (new), `src/engine/traitDefinitionSeeding.ts` (if the four need explicit seeding), `src/components/Game/LocationProfileModal.tsx` (effect line), `src/debug-bridge.ts` + `.d.ts`, `scripts/cli.ts`, the pool census script, `scripts/interface-contracts.ts`, `src/engine/__tests__/traitRefReconciliation.test.ts`, `Docs/plans/wiring-checklist.md`, `Docs/canon/{systems-inventory.md,rulebook.md,encounters.md}`, `Docs/ubiquitous-language/Traits.md`, wiki page per manifest; tests: `src/engine/__tests__/phaseLocationTraits.test.ts` (new), `contentQuery-bearerKind.test.ts` (new), `encounterScoring` location-term test, `LocationProfileModal.test.tsx` (effect line).

## Notes for the executor

- **Carve first.** Land the bearer-kind exclusion and its falsification arm before the four definitions exist; the order is what keeps the 45 recipes safe during the PR.
- **Copy the promotion phase's shape, not its thresholds.** Dual threshold, dead band, persisted counters, mid-band holds — `phaseSettlementPromotion.ts:100-124`. Do not reset the counter in the dead band.
- **No `#blood-soaked`.** The ticket names it; the substrate does not exist. Its deferral is filed with slice 3.
- **Every definition needs its rows.** `CONDITION_IDS_WITHOUT_EFFECT` is empty on purpose; a trait with no tax, no step modifier and no pool row is the gate theatre THR-800 named.
- **The pool term reuses `locationNode`.** It is already resolved at `:1254`; do not walk the graph again per candidate.
- **Location traits are conditions, and the id prefix is the declaration.** They ride the `condition` subcategory under `trait.condition.location.` — no new subcategory, no new field — which is what makes the three existing readers, `LOCATION_CONDITION_IDS`, and the page work without code. The word on the page is the definition's display name; *Location trait* is the UL's word for the family.
- **Enumerate settlements with `getLocationNodes`** (`src/engine/sublocationShape.ts`), never a bare `getNodesByType('location')`, which returns Places too (THR-1183). The prosperity and unrest rules run over the place tier only (the writers' own population); the saturation rules run over the place tier as well. The step reader (`resolutionModifiers.ts:646`) hops a Place to its parent Location; movement (`movementCost.ts:113`) and target gating (`targetActions.ts:304`) read the node they are given — so the place tier is the one source every reader agrees on, and minting on a Place would double-count for the step reader while being invisible to the other two.
- **Bump the world version.** `assignTrait` / `removeTrait` do not call `touchWorld`; the phase must (the promotion phase calls `applyEncounterCacheUpdate` at `:33`), or a selector keyed on `worldVersion` serves a stale page. Registration comment: *after `6.638` (magical saturation)* verbatim — `orchestrator.ts` labels two consecutive phases `6.638`, and the parenthetical is the disambiguation.
- **The wiki gate will fire** (`encounterScoring.ts`, `orchestrator.ts` are in page sources). Update; do not exempt.
- **Do not widen the LEAKED vocabulary contract.** Four live refs join the ratchet as live; the 22 dead ones stay dead and stay counted.

## Intent-judge verdict

**Run 1 (fable, cold, 2026-09-21): Revise** — Reversible confirmed; seven dimensions PASS, four GAPs, all author-fixable: the plan proposed a `bearerKind` field beside the substrate's existing prefix-keyed predicate (`LOCATION_CONDITION_ID_PREFIX` / `LOCATION_CONDITION_IDS`, `condition-trait-content.ts:571-583`) — a second source of truth on a 337-importer type; the traits.ts importer count was stale; the ticket's dropped consumers (merchant routing, rebuild-road, prose) were deferred only in the proposal's non-goals, not filed; the phase's Location enumeration did not name `getLocationNodes`. All four fixed in this revision: the field is dropped and the carve reads the prefix (zero edits to `traits.ts`); Blast Radius refreshed; **slice 4** stubbed in the Done-when with each consumer's seam named; the executor note on tier enumeration added.

**Run 2 (fable, cold, 2026-09-21): Allow** — nine dimensions PASS, two GAPs (a residual "one optional field" phrase in NFP row 6 and the proposal; the tier note overstated which readers hop a Place to its parent), both fixed in this revision, plus two executor notes (`touchWorld` in the phase; the duplicate `6.638` label) now in § Notes. All four run-1 actions confirmed satisfied against source.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-21 (sonnet, three auditors spawned in one message, on the run-1 revision).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | every threshold / band / bonus is a named constant in `location-trait-constants.ts`; effect rows keyed as the six existing conditions |
| 2. Inspectability | PASS | `LocationTraitTrace` (minted / released / superseded) at all four sites; `__DEBUG.getLocationTraits`, CLI `traits`; wiring table per the checklist; the page's effect line |
| 3. Determinism | PASS | no PRNG; thresholds over persisted sustain counters; fixed supersession |
| 4. Fail-soft | PASS | seven rows; absent scalar skips the rule; 0–1 prosperity reads Destitute; missing definition re-seeds; dual-qualify resolved deterministically |
| 5. Narrative over mechanical | PASS | `#blood-soaked` declined — *"minting it from `deathCount` would call a plague a massacre"*; `#haunted` needs the dead |
| 6. Additive over destructive | PASS | four definitions, one phase, one table; nothing on the six shipped conditions changes; the carve is opt-in; zero edits to `traits.ts` |
| 7. Performance budget | PASS | one place-tier scan per tick with four comparisons; the pool term reuses the resolved node |

**NFP AUDIT: PASS.**

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | hysteresis phase mirroring `phaseSettlementPromotion`, graph nodes/edges, phase placement after `6.638`, deterministic resolution, PRNG none (justified) |
| Content | present-and-substantive | four definitions, constants, UL / canon / rulebook rows; Encounter templates and Attachment content N/A with rationale |
| UI | present-and-substantive | display, notifications, debug concrete; Visual presence N/A with rationale |

No missing required sections. Wiring table maps each module to phase / component / field / trace / debug. Substrate check: six subsystems by inventory name, all 🟢 ACTIVE, each with an extends / reads / untouched disposition; no green-field duplication. **PILLAR AUDIT: PASS.**

### Vision audit

`00-north-star.md` → the world's own record; the god watches — confirmed. `01-core-loop.md` → extended (a pool term inside the existing loop; order and cadence untouched). `02-non-negotiables.md` → narrative over mechanical (`#blood-soaked` declined), everything a graph edge (no new type) — confirmed. `03-design-tensions.md` → leans toward systemic emergence (pool reweighting only, feeding authored templates by family tag) — acceptable for the slice's framing. `taste-profile.md` → prose-first, no numbers — confirmed. No contradictions. **VISION AUDIT: PASS-with-notes.**
