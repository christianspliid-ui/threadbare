---
status: current
issue: THR-789
supersedes: none (game-wide architecture; binds into Docs/plans/2026-07-26-nudge-model-encounter-system.md for the encounter wave)
---

# Traits as the Universal Trigger Layer

**User verdicts (Christian, chat, 2026-07-26 — settled, co-designed live):** Traits are "the main flexible trigger in the game for 'custom' variant events in our systems" — **game-wide**, on all object families (mortals, companies, factions, cultures, gods, locations, artifacts, relationships, actions): any system may react when it connects with an object carrying a trait. Canon rules: **(1) a trait hook always names its trait to the player; (2) an object's traits are always visible in its interface *once known*** (they live in the object's modal, per the everything-clickable ruling). Rule 2 composes with the live `TraitVisibility` gate (`traits.ts:57` — `public | discoverable | divine_only`): visibility governs *whether the player knows the trait yet*; once public or discovered, it is always displayed — no known-but-hidden state. The mystery layer survives; the display obligation is absolute for known traits. Two further guards from the Vision audit: **trait reactions color the curated moment and never raise an independent notification** (no new front-of-stage claimants), and **trait levels never surface as numerals** — words only, per the game's legibility law (exit criteria on THR-775/THR-788/THR-790/THR-791). **God-earned traits confirmed with the roguelike framing** ("you can earn and unlock traits as you play based on how you play, and this can actually impact the game"). **Relationship traits**: explore ("a very cool variant, an advanced trait shared by two specific objects"). **Destiny**: fill the empty category as the forward-contract class ("sure lets try this"). **Eldritch Horror is the architectural reference** (researched this session from the EH wiki, Assets + Conditions pages).

**Investigation base:** independent session's substrate map (pasted 2026-07-26), load-bearing claims re-verified against source here — see § Substrate inventory.

## Substrate inventory (verified in code, 2026-07-26)

| Claim | Source | Status |
|---|---|---|
| Trait defs are nodes; assignments are `has_trait` edges (level·ticksRemaining per edge schema; `source`/`visibility` typed at `traits.ts:117-118`) | `src/types/traits.ts`, `src/engine/traits.ts`, `edgeSchema.ts:65-73` | **live** |
| `has_trait.sourceNodeType` already includes `location`, `sublocation` | `edgeSchema.ts:67` | **verified** — location traits are schema-legal today |
| `artifact_legendary` designed to "have own trait graph" | `graph.ts:22` | **verified** (comment-level intent; edge legality is wave 2's one-line extension) |
| Every object family has a graph home | `graph.ts:17-33` NodeType + ActorType unions | **verified** (incl. reified `relationship` nodes) |
| `requiredTraits`/`blockedByTraits` evaluated but undeclared | `encounterFilterPipeline.ts:270`; zero matches in `types/unifiedAction.ts` | **verified** — phantom API, fixed via WS0 PR |
| `has_trait:<tag>` string predicates in production content | `effects/effectPredicates.ts:57-63`; `choice-set-catalog.ts` ×4 | **verified** — sugar must be preserved |
| Reputation-title dead read (`category` vs `subcategory`) | `proseEnrichment.ts:370` vs `reputation-trait-content.ts` | **verified** — THR-787 |
| Tag-filtered reward draws exist | `rewardPool.tagFilters` (`#iron` etc.) | **live** — wave 2 generalizes onto the trait vocabulary |
| Threshold-minting precedent | personality virtues/vices minted at axis 0.8/0.2 | **live** — the minting rule's model |
| Producers minting every trait category except destiny | worldgen, personality phases, aftermath, tier promotion, economy, reputation, condition overflow, item grants | **live** (independent session's map, spot-verified) |

## The Eldritch Horror findings (what we're stealing)

1. **Traits are inert on the bearer; all power is in being referenced.** Verbatim: traits "have no direct impact on gameplay, but they are often referenced by other cards or by investigator abilities." Connection logic lives in the referencing system, never on the trait.
2. **Draw-by-trait is the core selector verb.** "Gain 1 *Madness* Condition" = search the deck for the first card with that trait the bearer doesn't already have (dedup built in).
3. **Two-tier taxonomy: one class trait + composable property traits.** "Blessed Blade — Item — *Magical Relic Weapon*". Class = what it is (structural); properties = what it's like (referenceable, stackable).
4. **Category is a lifecycle contract, not a label.** All *Illness* conditions share removal rules; all *Injury* flip on failed Reckoning; *Deal* triggers at Reckoning but Debts can be bought off early. The class defines acquisition, removal, trigger timing, and worsening; card text only flavors.
5. **Negative/scoped predicates are first-class** ("a *non-Deal* Condition").

## The six connectivity verbs (built once, adopted per system)

| Verb | Meaning | Substrate |
|---|---|---|
| **draw-by-trait** | filtered random grant/affliction with dedup ("gain a random #relic") | generalize `rewardPool.tagFilters` onto the unified vocabulary |
| **gate** | have/lack predicate shows or hides an option/template/action | filter pipeline + effect predicates (live), THR-786 unifies |
| **react** | modifier or variant when a system connects two objects and one bears the trait | per-system at existing seams (encounter variants = WS0 `traitVariants`; the pattern generalizes) |
| **lifecycle-by-category** | the category defines expiry/removal/worsening for every trait in it | `ticksRemaining` machinery exists for conditions; contract table below extends |
| **trigger-subscribe** | reckoning-style beats a category subscribes to | on-use trigger system (THR-719) + aftermath + tick phases |
| **name-always** | every hook names its trait; every object's modal lists its traits | canon rules 1–2; WS2 modal system + agent sheet |

No central rules engine — each system adopts verbs at seams it already owns (NFP #6; the brainstorm records the rejected alternative).

## Object × trait map (grounded in `NodeType`/`ActorType`)

| Family | A trait means | Reacting systems (connection points) | Status |
|---|---|---|---|
| Mortal (`actor:individual`) | who they are / what they survived | encounter gates·variants·trait-nudges (WS0), targeting, ambitions, disposition, prose | **live** |
| Company/band (`actor:group`) | the group's character | contested pairs, cohesion drama, faction response | schema-legal, unmined |
| Faction (`actor:faction`) | institutional temperament | diplomacy, promotion, war behavior, band encounter generation | schema-legal, unmined |
| Culture (`actor:culture`) | formative identity | worldgen mints today; extend consumers | live, consumer-poor |
| God (`actor:god/ascendant`) | **earned** reputation from play | disposition, faith spread, faction trust, rival targeting; Echo/World-Soul legacy | wave 3 |
| Location/sublocation | the character of a place | encounter pools, movement, merchants, rebuild roads, prose | **edge-schema-legal today**, wave 2 |
| Artifact (`artifact`, `artifact_legendary`) | the object's story and temper | merchants, thieves, temples, on-use triggers, draw-by-trait pools | wave 2 (one additive edge-schema extension) |
| Relationship (`relationship` node) | what stands between two beings | react-verb when both share a scene; social scenes; cohesion | wave 3 |
| Action/template | the nature of the deed | #devout refuses #profane; #lawless enables #clandestine; god personality gates | authored tags in the same vocabulary (data-side, not runtime nodes) |

**Starter generics** (working vocabulary; WS1 authoring guideline: hooks reference mintable traits): Mortals #trustworthy #silver-tongued #battle-hardened #oathbreaker #haunted #beloved #feared #lucky #marked-by-⟨place⟩ · Companies #veteran #blooded #mutinous #famed #ill-omened · Factions #honor-bound #mercantile #zealous #vengeful #outlawed #decadent · Gods #oathkeeper #wrathful #subtle #harvest-friend #thread-gentle · Locations #haunted #sacred-to-⟨sphere⟩ #lawless #warded #veil-thin #blood-soaked #welcoming · Artifacts #storied #cursed #stolen #masterwork #hungry #heirloom · Relationships #sworn #blood-feud #debt-bound #old-flames #rivals · Actions #violent #sacred #clandestine #honest-work #profane.

**Minting rule (design law):** traits are discrete identity minted when a continuous system crosses a threshold and held with hysteresis — the precedent is live (personality virtues at 0.8/0.2). #welcoming is *earned* by sustained prosperity, not a restatement of the scalar. Traits are the nouns the scalars earn.

**Competence law (stated accurately per source, Vision audit):** competence flows only through the existing capped channels — `domainContributions` (≤0.10-scale, carried today by mastery and some reputation traits) and the resolution-bonus cap. **Personality-category traits never gain competence effects**, and the *react* verb may add competence modifiers only through those existing capped channels, never as uncapped bespoke bonuses. Selection steering (`scoringModifiers`) remains competence-free for every category.

## Category contracts (upgrading the ten categories)

| Category | Contract (acquisition · removal · trigger) |
|---|---|
| innate | worldgen-minted · permanent · passive |
| cultural | culture-inherited · permanent · passive |
| personality | threshold-minted from axes (live) · drifts with axes · steers *selection*, never competence (verified: `personality-trait-content.ts` carries no `domainContributions`) |
| mastery | earned via encounters/promotion (live) · decays (live) · steers *competence* |
| reputation | minted by the reputation phase (live) · fades with standing · gates + disposition **+ capped competence contributions** (verified: `reputation-trait-content.ts` grants `domainContributions` ≤0.10 — the honest law is below, not "never crossed") |
| condition | inflicted · expires (`ticksRemaining`, live) or mended (rebuild roads) · may trigger on use/tick |
| scar | overflow/aftermath-minted (live) · permanent save rare rites · colors prose + hooks |
| bestowed | granted by god/items (live) · revocable by grantor · carries source |
| **destiny** | **world-minted promise · fires when the seed system keeps it · removable only by rare rites · always visible** |
| core | reserved for run-defining identity (The First bond etc.) · permanent |

## Waves (staging, keyed to the Nudge Model program)

- **Floor — THR-786 (engine, this doc § Engine):** predicate unification. Everything consumes it.
- **Defect — THR-787 (Ready for Dev):** the three `category`→`subcategory` dead reads (reputation titles have never rendered) + regression test.
- **Wave 1 — encounters (already staged):** WS0 `traitVariants`/`requiredTrait`/declared gates (THR-773, Ready for Dev); WS1 trait-hooks authoring step (THR-774); WS5 authors hooks per family (THR-778). Plus the trait coloration axis on THR-573 context fragments (WS1 rules; engine one-axis additive).
- **Wave 2 — THR-790:** location traits go live (minting + consumers), artifact traits (edge-schema extension), draw-by-trait generalization of `tagFilters`.
- **Wave 3 — THR-791:** minting identity — god-earned traits (roguelike framing; Echo/World-Soul legacy question owned by its design pass **under a named Vision constraint: earned-in-run traits + degrading Echo inheritance are compliant; a persistent cross-run unlock ladder is not** — the north star rejects completion-reward progression), relationship traits, destiny contracts.
- **Docs — THR-788:** wiki "Traits & Marks" page + UL entries (Trait, categories-as-contracts, Trait Hook, the selection/competence separation, destiny — first definition).

## Engine pillar — THR-786: one predicate, six call sites

**Canonical predicate:** `TraitPredicate { traitId: string; minLevel?: number }`, resolved by one `resolveTraitPredicate(graph, bearerId, pred): boolean` in `src/engine/traits.ts` — semantics of the encounter filter pipeline (trait **node id** on `has_trait` edges, `level ≥ minLevel`, item-granted traits included). `bearerId` is any legal source node. **The `TraitRefIndex` maps a ref (tag / display name / id) to the *set* of trait node ids carrying it, and predicates pass on ANY-match** — this preserves today's union semantics exactly (a tag shared by several traits matches a bearer holding any of them; NFP #6). The six vocabularies converge (audit-corrected enumeration):

1. **Encounter filter pipeline** (`encounterFilterPipeline.ts:270`) — swaps inline logic for the shared resolver (behavior-identical; suites stay green).
2. **Effect predicates** (`has_trait:<tag>`/`lacks_trait:<tag>`, `effects/effectPredicates.ts:57-63`) — string sugar **stays** (production content: `choice-set-catalog.ts` ×4). The set-based call site keeps its shape: the **context builder in `effectPredicates.ts:227-301`** (which today unions tags ∪ display name into `ctx.agentTraits`) additionally unions the resolved **node ids**; the check tests the raw ref first (today's path, byte-identical) and then the index-resolved ids. Additive at set-build time — no graph access needed at check time.
3. **Ambition `graphConditions`** — `traitId`/`trait.`-prefixed forms route through the index + resolver.
4. **Ambition eligibility snapshots** (`ambitionSelection.ts:61-68`) — `AmbitionAgentSnapshot.traits[]`/`blockingTraits` membership normalizes through the index at snapshot build (the snapshot stays a string array; its contents become resolved ids ∪ raw keys).
5. **Spell prerequisites** (`spellActivation.ts:104-125`, `types/effects.ts` `prerequisites.requiredTraits`) — same union matching today (id ∪ name ∪ tags); migrates to the index's any-match resolution, which reproduces that union by construction.
6. **Item-granted traits** — granted keys resolve through the index (completing the THR-737 trail); unmatched keys warn, never silently fail.

Unresolvable refs warn once and evaluate false; dev-only `validateTraitRefs()` sweeps **all six** content surfaces (choice-sets, effect tables, ambition defs, spell prerequisites, item grants, template gates) and lists every dead ref via `__DEBUG`.

No new node types, no new edge *types*, no PRNG, no tick-phase changes in the floor. Two staged one-line `sourceNodeType` array additions to the existing `has_trait` schema: `artifact`/`artifact_legendary` (wave 2, THR-790) and `relationship` (wave 3, THR-791) — same additive class, each landing with its wave.

## Content pillar

Defects split to THR-787 (above). First content wave bound into the program: WS1 gains the mandatory **trait-hooks authoring step**; WS5 wave-1 = batch-1 rewrites whose premise names a personality/reputation-sensitive interaction (predicate, not count). `destiny` receives its **first definition** per the contract table (the category shipped empty; no prior UL entry exists to redefine) — **THR-788 is the UL-proposal issue** (it carries the `UL-proposal` label) covering Trait, the category contracts, Trait Hook, the selection/competence separation, and destiny. Generics list above is the authoring vocabulary seed — placeholder by design, evolved in play.

## UI pillar

N/A for new surfaces in the floor ticket. **Canon rule 2 ownership, named per bearer family:** mortals — the agent sheet (live, compliant today); encounter-facing objects (items, conditions, seeds) — THR-775 (WS2 modal system, already in its designed scope); wave-2 bearers (locations, artifacts) — THR-790's UI section; wave-3 bearers (gods, relationships, destiny on the sheet) — THR-791's UI section. No bearer ships reactive traits without its visibility surface — that pairing is a per-wave exit criterion. Floor visibility deliverable: `__DEBUG.validateTraitRefs()`. Browser-verify: exempt for THR-786 (engine read-path + debug bridge; evidence = unchanged-behavior suites + 30-tick CLI smoke).

## Wiring

| Seam | Where |
|---|---|
| Shared resolver + index | `src/engine/traits.ts` (resolver), new `src/engine/traitRefIndex.ts` — **owned by `SimulationRuntime`** (per the load-bearing engine-caches-per-session rule; built lazily at first use from the static trait defs, rebuild trivial), never a module-scope singleton |
| Call-site migrations | `encounterFilterPipeline.ts`, `effects/effectPredicates.ts` (incl. the :227-301 context builder), ambition condition evaluator + `ambitionSelection.ts` snapshot eligibility, `spellActivation.ts` prerequisites |
| Template gate declaration | `requiredTraits?`/`blockedByTraits?` on `UnifiedActionTemplate` — **in the WS0 PR** (THR-773 handoff already carries the schema edit; one editor on the 278-importer file) |
| Draw-by-trait | wave 2: `rewardPool` filter path reads the index (THR-790) |
| Debug | `__DEBUG.validateTraitRefs()` + `.d.ts` |
| Docs | THR-788; systemic-wiring-guide gains the trait-hooks capability row (content-facing) in the THR-786 PR |

## Constants

| Constant | Default | Purpose |
|---|---|---|
| `TRAIT_REF_WARN_ONCE` | true | unresolvable ref warns once per ref id |
| (existing) trait level/decay constants | unchanged | floor adds no numeric tuning; wave minting thresholds are named per-wave |

## Tracing

None at runtime for the floor (pure predicates; ring-buffer discipline). Wave 2/3 minting emits transition-fired traces (`trait_minted` — defined in those waves' plans). Inspection: `validateTraitRefs()` + trait edges on object modals.

## Fail-soft

| Failure | Behavior |
|---|---|
| Unresolvable tag / granted key / ambition ref | warn once, evaluate false, listed by `validateTraitRefs()` |
| `TraitRefIndex` unavailable (load order) | resolver falls back to node-id-only matching (today's behavior) |
| Duplicate tag→id mapping | **not a conflict**: the index maps ref → set of ids, predicates any-match (today's union semantics preserved); `validateTraitRefs()` reports high-fanout refs informationally |
| Empty `requiredTraits: []` | vacuous pass (matches current pipeline handling) |
| Bearer type with no has_trait legality (e.g. artifact before wave 2) | predicate evaluates false; no throw |

## Blast Radius

`unifiedAction.ts` (278 importers) deliberately untouched by THR-786 — field declarations ride the WS0 PR. THR-786's surface: `effects/effectPredicates.ts` (incl. context builder), ambition evaluator + `ambitionSelection.ts`, `spellActivation.ts`, `encounterFilterPipeline.ts` — behavior-preserving migrations guarded by unchanged-behavior contract suites written **before** the migration, covering **all six** call sites (the suites are the kill criterion).

## Interface impact

*Personality & Traits is ⚪ UNAUDITED — audit-on-touch; first contract slice; executor registers rows in `scripts/interface-contracts.ts` in the THR-786 PR.*

| Contract | Producer → Consumer | Action |
|---|---|---|
| `has_trait` edge (level/source/expiry) | all producers → all readers | **preserve** |
| trait gate on templates | templates → filter pipeline | **extend** (fields declared in WS0 PR; resolver shared) |
| `has_trait:` string predicates | choice-set/effect content → effect predicates | **extend** (load-time resolution; sugar preserved) |
| ambition trait conditions | ambition defs → evaluator | **extend** (shared resolver) |
| granted-trait keys | item effects → all trait reads | **extend** (THR-737 completion) |
| reputation title prose | trait defs → proseEnrichment | **repair** (THR-787) |
| `rewardPool.tagFilters` | templates → reward draws | **preserve** now; **extend** in wave 2 (draw-by-trait) |

## Done-when (THR-786, the floor)

1. `resolveTraitPredicate` + `SimulationRuntime`-owned `TraitRefIndex` exist with unit coverage; all six call sites route through them; the six unchanged-behavior contract suites (written first) are green.
2. `__DEBUG.validateTraitRefs()` sweeps all six content surfaces and reports zero unresolvable refs on shipped content (or each remaining ref is a filed defect).
3. Ambition-def `requiredTraits` (string keys, `types/ambition.ts:59-60`) vs template `requiredTraits` (`TraitPredicate[]`, WS0) name collision documented in both types' JSDoc and flagged to THR-788 for UL wording.
4. Systemic-wiring-guide gains the trait-hooks capability row; interface-map rows registered; standard pre-commit gates incl. 30-tick CLI smoke.

**Coordination block (THR-786)** — Suggested model: opus. Parallel-safe with: THR-787, THR-777, THR-782, non-encounter queue work. Mutex with: THR-773 implementation (filter-pipeline + effects-table adjacency — whichever lands second rebases); hard sequencing: template gate *fields* land in the WS0 PR, never here.

## Kill criteria

- Floor is wrong if any migrated site changes behavior for passing content: unchanged-behavior suites across all six sites (pipeline, the 4 shipped `has_trait:` uses, ambition graphConditions + snapshot eligibility, spell prerequisites' union matching, item grants) written first, stay green.
- The trigger layer fails its purpose if post-WS5-wave-1 `validateTraitRefs()` shows authored hooks referencing traits no producer mints — an authoring-guideline failure (WS1), not more engine.
- The *game-wide* bet fails if wave 2 location traits ship and no measurable behavior shift appears in headless runs (encounter pool composition at #haunted vs unmarked locations) — then the react-verb integrations, not the substrate, need rework.
- Revert: resolver is a drop-in; sites revert independently; waves are independently droppable.

## NFP compliance

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — no floor tuning; wave minting thresholds named per-wave |
| 2 Inspectability | PASS — `validateTraitRefs()`, warn-once, name-always canon makes triggers player-legible too |
| 3 Determinism | PASS — pure reads; deterministic duplicate resolution; draw-by-trait uses seeded streams (wave 2) |
| 4 Fail-soft | PASS — table above |
| 5 Narrative over mechanical | PASS — the design's purpose is "the world reacts to who you are"; every hook names its story |
| 6 Additive | PASS — sugar preserved, migrations behavior-identical, schema extensions additive, waves droppable |
| 7 Performance budget | PASS — load-time index; runtime = edge lookups as today; minting is threshold-crossing, not per-tick scans |

## Forked-audit verdicts

**NFP auditor (opus, 2026-07-26): REVISE → integrated.** (1) Enumeration was incomplete — `spellActivation.ts` prerequisites and `ambitionSelection.ts` snapshot eligibility added; the plan now unifies **six** call sites and `validateTraitRefs()` sweeps all six surfaces. (2) Effect-predicate migration respecified at the real seam: the `effectPredicates.ts:227-301` context builder additionally unions resolved node ids — additive at set-build time, no graph access at check time. (3) The lowest-id duplicate-tag rule was a behavior change wearing a fail-soft costume — replaced by ref→set-of-ids ANY-match, which reproduces today's union semantics by construction. Substrate-table nit (edge vs type-level fields) corrected.

**Three-pillar auditor (opus, 2026-07-26): REVISE → integrated.** `TraitRefIndex` ownership pinned to `SimulationRuntime` (engine-caches-per-session rule; never module scope). The ambition-def string-key gate scoped **in** (site 4) with its name-collision documented as a Done-when item. Done-when + Coordination block added for the floor ticket.

**Vision auditor (opus, 2026-07-26): PASS-with-notes → integrated.** Canon rule 2 restated as "always visible **once known**", composing with the live `TraitVisibility` mystery gate instead of silently retiring it. Two guards added: trait reactions never raise independent notifications (one-story-at-a-time), and trait levels never surface as numerals. The "never crossed" separation law restated accurately per source (reputation traits already carry capped `domainContributions`) as the Competence law. Wave-3 Vision constraint named: earned-in-run + degrading Echo inheritance compliant; persistent cross-run unlock ladders are not.

## Intent-judge verdict

Round 1 (opus, cold): **Revise** — missing Substrate inventory section (violation), UI-pillar ownership, edge-claim correction, UL routing. All integrated. Round 2 (same judge, cold re-read, source-verified): **Allow** — 0 violations, 1 cosmetic gap (fixed in passing); every inventory row the judge could falsify held.
