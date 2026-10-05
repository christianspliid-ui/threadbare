# Encounter Pipeline: The Granary Riot
> Scale: medium | Slug: granary-riot | Pass: systems
> Date: 2026-10-05 | Pipeline version: 2.0
> Audited: `granary-riot-revised.md` (editorial PASS WITH REVISIONS, loop 2)

## 1. Support Bundle Honesty

- **`speaker`**: `lazy-materialize-on-trigger`, `must-persist`, `reuseNpcRoles: ['smith', 'innkeeper']`, `spawnNpcRole: 'smith'`, `spawnName: 'Wynn Halloway'`, `supportRole: 'granary_crowd_speaker'`. Both roles are in `NpcRole` (`src/types/npc.ts:36,71`). The `urban` envelope expands to `town · city · capital` (`src/data/settingClasses.ts:59`). `innkeeper` is seeded at 1.0 in all three rosters, and `smith` at 0.9 / 1.0 / 1.0 (`LOCATION_ROLE_ROSTERS`, `npc.ts:225-279`), so reuse almost always binds. Where it does not, a spawned smith reads correctly. The envelope is honest about class.
- **`cellarer`**: `lazy-materialize-on-trigger`, `must-persist`, `reuseNpcRoles: ['priest']`, `spawnNpcRole: 'monk'`, `spawnName: 'Osric Vane'`, `supportRole: 'abbey_cellarer'`. `priest` is seeded at town 0.7, city 1.0 and capital 1.0. `monk` is a valid `NpcRole` (`npc.ts:87`) and can be spawned at any subtype. A reused town priest cast as the abbey's cellarer is acceptable in the fiction. The two specs reuse different roles, so the bindings cannot collide.
- `must-persist` is required on both. `bond_change` writes onto `$cast:speaker` and `$cast:cellarer` from step metadata and from reactions. Both specs materialize, so `castTargetViolations` (THR-1165, `compositionContract.ts:1058`) passes: neither key is a bind-only `pre-seeded` default. The precedent is `masons-commission.ts:265`, which has the same lazy-materialize spec and writes `$cast:inspector` from step metadata.
- The abbot is a role noun with no binding, which is correct. He has no write and no chip, and he is named only in the critical_success overview.
- **Watch errand seed.** `#watch_errand` is a registered family tag (`src/data/content-tags.ts:300`). Five templates wear it, all in `src/data/civic-guard-encounter-content.ts`: `cg.quest.wall_patrol`, `cg.quest.gate_duty`, `cg.quest.break_up_brawl`, `cg.quest.escort_prisoner` and `cg.quest.investigate_disturbance`. All five are `actorAffinities: ['individual']`. All five accept `town · city · capital`, and `break_up_brawl` also accepts `hamlet`. The family is live. Its delivery is conditional, as § 4 finding S1 explains.

## 2. Missing Primitives

None. Everything the encounter uses is live.

| Need | Primitive | Verified at / precedent |
|---|---|---|
| bonds on step outcomes | `ActionStepOutcomeMetadata.effects` → `bond_change { withAgentId, sentimentDelta, trustDelta? }` | type `unifiedAction.ts:49-67`, `:1359-1373`; dispatched through the reaction applier by `applyStepOutcomeEffects` (`unifiedActionResolution.ts:1256`); `masons-commission.ts:189,222` |
| bonds on reactions | same `bond_change` | `flood-dyke-mending.ts:420` |
| standing | `reputation_with { targetLocationId: '$here', delta }` | `masons-commission.ts:184` |
| placeless sequel by family | `encounter_seed { query: { kind: 'encounter_template', tags: ['#watch_errand'] }, targetAgentId: '$actor', delayTicks, priority, seedLabel }` | type `unifiedAction.ts:476-520` (`priority` is a real field); `army-encounter-content.ts:1030` uses the same tag |
| trait variant + trait-only card | `traitVariants[].addNudgeIds` + `StepNudge.requiredTrait`, `essenceCost: 0` | `unifiedAction.ts:1693,1851-1861`; `hired-knives.ts:127,264-270` (identical shape) |
| hand fill | `deal: { count: 3, tags: [...] }` | `presence`, `peril`, `social` are all in the closed `NudgeDealTag` set (`unifiedAction.ts:1925-1931`) |

No rejected primitive (`authoredChoices`) is used. No appointment is used, and no sentence makes a placed promise (§ 4).

## 3. Runtime Feasibility

- Two plain steps. Step 0 heart 0.76 `continue_weakened`, step 1 heart 0.80 `fail_action`. The encounter is linear, with no branch and no `decidedBy`. The aftermath uses `branchOnStep: 0` and `variants: {}`, the same shape as `flood-dyke-mending`.
- **Band routing** (`unifiedActionLifecycle.ts` `terminalActionOutcome` :175, `advanceStep` :194, `computeFinalActionOutcome` :344). Step metadata fires on the step that rolled it, terminal or not. `isStepSuccess` counts `near_miss` as success, so a near miss fires `successMetadata`.

| Route | Band | Step writes that fire |
|---|---|---|
| s0 clean → s1 clean, ≥1 critical_success | critical_success | s1 success |
| s0 clean → s1 clean | success | s1 success |
| s0 near_miss / s@c → s1 success-side | success_at_cost | s1 success |
| s0 clean → s1 near_miss / s@c | success_at_cost | s1 success |
| s0 **failure** → s1 success-side | success_at_cost (`hasAnyFailure`) | s0 failure + s1 success |
| s0 success-side → s1 failure | failure | s1 failure |
| s0 failure → s1 failure | failure | s0 failure + s1 failure |
| s0 **critical_failure** | critical_failure (the action ends; s1 never runs) | s0 failure |
| s0 any non-critical → s1 critical_failure | critical_failure | s1 failure (+ s0 failure if it failed) |

- The ladder in § 9 of the packet matches this table.
- **Hand arithmetic.** Each step has 2 specials plus `deal.count` 3, so a hand of 5, inside 4–8. The specials' Δ is 0.10 + 0.08 = 0.18 on step 0, and 0.10 + 0.08 = 0.18 on step 1 for a Warm mortal. The dealer clamps the total under `NUDGE_HAND_MAX_TOTAL_DELTA`.
- **Image tags.** All four resolve in `src/data/encounter-image-library.ts`: `generic.crowd` (`:678`, situational plate), `generic.ward` (`:637`), `generic.memory` (`:636`) and `generic.warmth` (`:639`). `generic.ward` is an order plate on a force card. That pairing already ships, since `flood-dyke-mending` puts it on matter and `smugglers-ford` on time, and no gate pairs image sphere with card sphere.
- **Trait ids.** `trait.core.core_warmth.virtue` and `.vice` are minted by `coreTraitId()` (`src/data/core-trait-content.ts:70-72`, format `trait.core.<continuumId>.<pole>`). `core_warmth` is a registered continuum (`src/types/coreRegistry.ts:123`, Warm ↔ Cold), and `.virtue` is already a shipped variant (`company-drama.ts:1273`).
- **Card labels.** "Whisper (mind)", "Boost (force)" and "Omen (time)" are author shorthand for the card type. They are not library ids. Mind's signature member is `compulsion`, force's is `heavy_hand` and time's is `omen` (`nudge-card-library.ts:619-637`). The package should author these three as plain `StepNudge` specials with `sphere` set and **no `libraryCardId`**. An absent id is legal (`unifiedAction.ts:1682`). Do not stamp `card.boost.core` (brief: never as a special) or `card.compulsion.signature.mind` (that card is slot 2's).
- **Consequence hand.** `node .cache/draw-consequences.mjs encounter.town.granary_riot --reach heart --rarity 2` prints `relationship` (bond_change) plus `story_seed` (encounter_seed), so the hand matches with no swap.

## 4. Aftermath Supportability

**Every chip on every route (Law 56).** A step-1 success on the s@c route through a step-0 failure gives these net writes: standing −0.02 + 0.06 = **+0.04**; cellarer sentiment −0.06 + 0.12 = **+0.06** and trust −0.06 + 0.10 = **+0.04**; speaker +0.12 / +0.10; seed planted.

| Band | Chip | Backed on every route? |
|---|---|---|
| crit / success / s@c | The Town's Thanks (standing gain) | yes. +0.06 on clean routes, +0.04 net through a step-0 failure. Reactions only add to it (+0.03). |
| crit / success / s@c | The Crowd's Trust (speaker bond gain) | yes. Step 1 success writes it, and no success-side write lowers it. |
| crit / success / s@c | The Abbey's Trust (cellarer bond gain) | yes. Net +0.06 sentiment and +0.04 trust at worst. "Sup at the abbey's table" only adds. |
| crit / success / s@c | Work From the Watch (seed) | the seed is **planted** on every route. **Delivery is not guaranteed; see S1.** |
| failure | Ruling Refused (standing loss) | yes. −0.06, or −0.08 if step 0 also failed. No failure reaction touches standing. |
| failure | The Crowd's Doubt (speaker bond loss) | yes. −0.12 sentiment and −0.10 trust. "Side with the crowd" brings it to −0.08 at best. |
| failure | The Abbey's Doubt (cellarer bond loss) | yes. −0.10 / −0.10. "Side with the abbey" brings it to −0.06 at best. |
| critical_failure | Blamed for the Granary (standing loss) | yes. −0.02 on the step-0 route, −0.06 or −0.08 on the step-1 route. |
| critical_failure | The Abbey's Blame (cellarer bond loss) | yes. On the step-0 route: −0.06 sentiment and −0.06 trust, and with "Side with the abbey" +0.04 the sentiment nets −0.02 and stays a loss. If the package also gives that reaction `trustDelta`, it must be ≤ +0.04, so trust still nets ≤ −0.02. On the step-1 route: −0.10 / −0.10, or −0.16 if step 0 failed. |

**Reaction magnitudes cannot make a chip false.** Every success-side reaction is positive. The failure-side pair is held at ±0.04 against step losses of at least 0.06, so the worst case is a −0.02 net on the cellarer (step-0 critical_failure route). The speaker has no chip on critical_failure, so writing +0.04 or −0.04 to the speaker there contradicts nothing.

**Reaction inheritance.** `applyAftermathOutcomeBand` uses `band.reactions ?? variant.reactions` (`unifiedAction.ts:2328-2341`) and the gate's `aftermathFaces` uses `override.reactions ?? baseReactions`. Both **replace** the fallback reactions; they do not merge. The package must therefore author the two success-side reactions on `fallback.reactions` and author the failure-side pair explicitly on **both** `byOutcome.failure.reactions` and `byOutcome.critical_failure.reactions`. If either band is left without its own list, it shows "Stay until the last sack leaves" and "Sup at the abbey's table" on a failed ruling.

**Later-tense promises (prose rule 7b).** Each sentence with the effect that enacts it:

| Sentence | Path | Effect that enacts it |
|---|---|---|
| "…and the town hears of it." ("Stay until the last sack leaves" intent) | success reaction | `reputation_with $here +0.03` |
| "The cellarer will remember the company." ("Sup" intent) | success reaction | `bond_change $cast:cellarer +0.04` |
| "The crowd's speaker will remember it kindly, and the cellarer will not." | failure reaction | `bond_change` speaker +0.04 / cellarer −0.04 |
| "The cellarer is grateful; the crowd's speaker is not." | failure reaction | `bond_change` cellarer +0.04 / speaker −0.04 |
| seedLabel "A town watch has heard how {actor} settled the granary, and has work for them." | success side | `encounter_seed` query `#watch_errand`. This is the sequel's own label, read on both the fired and the withered event (the `flood-dyke-mending` precedent). |
| "Word of the ruling will bring {actor} work from a town watch." (chip) | success side | the same seed, **but see S1** |
| "…{location}'s next harvest will be small." (critical_failure overview) | critical_failure | **none. Finding S2.** |
| "The abbey will sow fewer fields this spring." (s@c overview) | success_at_cost | **none. Finding S3.** |
| "The abbey sells the share {actor} named at last year's price…" (critical_success overview) | critical_success | none. This is a present-habitual arrangement that reads as ongoing world behaviour. **Finding S4 (minor).** |

Sentences reviewed and found lawful: "every sack given away now is a field unsown next spring" and "the town will not reach spring without bread" (step-1 spine) are claims the cast make in reported speech, not promises the game makes. "The grain inside is the abbey's seed for next year" is a present fact about the grain. "The abbey keeps its seed for the spring" is a present state. "Bread is still dear… This quarrel is still going" is present state. The carryover lines are present state.

**Finding S1: a query sequel can wither.** A `query` seed keeps the family draw's eligibility filter at fire time (`encounterSeeding.ts` `resolveSeedByQuery` :318 / `eligibleAt` :367: individual-performable, and the target's current location subtype must be one the template accepts). The seed has no `resolutionLocationId`, so it is judged where the mortal is standing 48 ticks later. Four of the five `#watch_errand` members accept only `town · city · capital`, and one also accepts `hamlet`. A mortal standing in farmland, a mining camp, a ruin or the wilds gets the withered narrative instead. The chip's "will bring {actor} work" promises a delivery the engine may not make. **Fix (applied in final):** the chip now states what is true when the seed is planted, and names its carrier: detail **"Word of {actor}'s ruling reaches a town watch."** The `seedLabel` stays. `query` stays over a literal `templateId`, because the brief asks for a placeless query by an existing family tag, and a master who settled a town granary is likely still in a town.

**Finding S2: the critical_failure overview forecasts the town's next harvest with no effect behind it.** "{location}'s next harvest will be small" promises world behaviour that nothing writes. The consequence hand has no `place` family, and `harvest_blight` on `$here` cannot be keyed to this band alone: it would have to sit on the step failure metadata, and then it would also fire on the plain `failure` band whenever step 1 failed. **Fix (applied in final):** cut the forecast and keep the present fact. The new overview: **"The abbey has lost most of its seed for the spring. Both sides asked {actor} to settle this, and both have lost by it."**

**Finding S3: the s@c overview promises what the abbey will sow.** "The abbey will sow fewer fields this spring" is a future act with no effect. **Fix (applied in final):** state the present cost instead: **"{cast:speaker} led the crowd home with bread. The abbey has less seed left than it wanted."**

**Finding S4 (minor): the critical_success overview's present habitual.** "The abbey sells the share… and keeps the rest" reads as a standing arrangement the world will keep. **Fix (applied in final):** past tense, scoped to the scene: **"The abbey sold the share {actor} named at last year's price and kept the rest for seed. The abbot came out to thank {actor} in front of the town."**

**Corpus proximity (reported, not a defect).** `gold.famine.merchant_granaries` (`the-granaries-in-the-famine-year.ts`) is a regional gold branching encounter with a merchant-prince cornering grain. This one is a local heart test with a crowd, an abbey and a ruling. The decision, scale, reach and cast all differ.

## 5. Chip referents resolve

| Chip | Referent | Ref kind / declaration |
|---|---|---|
| The Town's Thanks / Ruling Refused / Blamed for the Granary | `$here` | location `WorldRef`: `stateNoun { text: 'reputation with {location}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }` |
| The Crowd's Trust / The Crowd's Doubt | `$cast:speaker` | agent `WorldRef` (lazy-materialized cast) |
| The Abbey's Trust / The Abbey's Doubt / The Abbey's Blame | `$cast:cellarer` | agent `WorldRef` (lazy-materialized cast) |
| Work From the Watch | `$actor` (the seed's carrier) | agent `WorldRef`: `stateNoun { text: 'seed', tooltipId: 'ui.aftermath_seed' }` + concept `{actor}` → `$actor`, `visualKind: 'agent'`, the `flood-dyke-mending` shape |

**Finding S5: the person chips must anchor the person.** The revised table gives the bond chips `stateNoun: reputation` (tooltip `ui.reputation_with`) and no entity. That passes `chipAnchorViolations` on the tooltip alone, as `tithe-barn-raid` does. But the referent of "{cast:speaker} trusts {actor} now" is a person the encounter casts, and Law 56 clause 2 asks that a chip point at that object. **Fix (applied in final):** each person chip declares the noun without `{target}` (THR-1685 is still avoided) and anchors the cast member: `stateNoun { text: 'reputation', entityId: '$cast:<key>', visualKind: 'agent', tooltipId: 'ui.reputation_with' }`. The precedent is the `$cast:` agent anchors in `the-garrisons-price.ts:694` and `toll-gate-writ.ts:810`. `classifyAnchorDeclaration` accepts `$cast:<key>` for any key in the template's `supportBundle`, and both keys are declared.

No `{target}` appears in any chip. All referents exist once the band resolves, because both cast members are materialized at trigger.

## 6. New Hooks Needed

None. No new role, sublocation type, state field, tag or content entry.

## 7. Implementation File Map

Only the compiled set. `Docs/plans/encounters/granary-riot.package.json` compiles through `compile:encounter` into `src/data/encounters/granary-riot.ts`, `src/data/encounters/__tests__/granary-riot.test.ts` and both registrations. The orchestrator runs the real compile, gated first with `check:encounter -- --package` (#1114). Beyond the compiled set:

- concept art per § 17 of the packet;
- a `src/data/content-eval/plotHooks.ts` `usedBy` stamp for `hook.civil_unrest` at closeout (orchestrator);
- regenerated census and coverage artifacts.

There are no engine, type or support-bundle edits.

**Package must-carries** (from this audit and the brief): `intrinsicTier: 'shaping'`; `scale: 'local'`; seed `targetAgentId: '$actor'`, `delayTicks: 48`, `priority: 0.8`, `inheritContext` absent or false (the watch errand stars new people); failure-side reactions authored on both `failure` and `critical_failure` `byOutcome` (§ 4); the specials authored without a `libraryCardId` (§ 3); the person-chip anchors (S5).

## 8. Verdict

**READY FOR IMPLEMENTATION.** There are five findings and the final fixes all of them: S1 the watch chip wording, S2 the critical_failure harvest forecast, S3 the s@c sowing forecast, S4 the critical_success tense, and S5 the person-chip anchors. One limitation is accepted: the `#watch_errand` sequel withers for a mortal who is not in a settlement when it fires, and the chip no longer promises otherwise.

## 9. Primitive Disposition

No missing primitives identified.
