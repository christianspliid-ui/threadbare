# Encounter Pipeline: The Drowned Man's Will
> Scale: local (short) | Slug: drowned-mans-testimony | Pass: systems
> Date: 2026-09-30 | Pipeline version: 2.0
> Critic: independent Pass 3 (batch expert-everyday-1, slot 6, THR-1678). I audited the post-editorial `drowned-mans-testimony-revised.md` for design intent and prose. For mechanics I used `drowned-mans-testimony.package.json`, which is authoritative there. The editorial pass changed no mechanics, and I confirmed that against the package.

## 1. Support Bundle Honesty

| Object | Claim | Verdict |
|---|---|---|
| `heir` (`$cast:heir`) | actor, `lazy-materialize-on-trigger`, `must-persist`, no `reuseNpcRoles`, spawn `trader` "Corvin Aldmere", `supportRole: claimant_heir` | **Legal and it materializes, but one packet claim is wrong (corrected in final).** `EncounterSupportActorSpec` makes `reuseNpcRoles` optional (`src/types/encounter.ts:216`). `trader` is a live `NpcRole` (`src/types/npc.ts:68`), seeded at 0.8–0.9 per settlement subtype (`npc.ts:230, 248, 273`). The legacy matcher returns null on an empty reuse set (`encounterSupportBundle.ts:183-184`), so that path always mints. **The binder is different.** It passes `acceptedRoles: spec.reuseNpcRoles` (`encounterSupportBundle.ts:515`), and when that is empty it falls back to `[request.mintRole]` (`binding/binder.ts:191-193, 240`). So a local `trader` within the binder horizon is a legal reuse candidate. The packet's "no reuse, so a stranger in town is never made someone's nephew" is therefore false. Mint is only *preferred*: `encounterSupportBundle.ts:522-526` measures commodity roles at about 99.8% mint. A support-role match also wins first (`encounterSupportBundle.ts:177-181`): a `claimant_heir` already at that location from an earlier run is re-bound, so the same nephew returns, which is consistent. |
| — gender | Packet §5: "Never gendered in prose" | **Inaccurate (corrected in final).** The spine says "His nephew, {cast:heir}", and *nephew* is a gendered kinship noun. Spawners write no `gender` property (the only writer is `agentDetail.ts:1462`), so the minted "Corvin Aldmere" reads male and fits the noun. In the rare binder-reuse case, an existing trader with a female-reading name would be called a nephew. This is a prose-level caveat and not a mechanical defect. I did not rewrite prose. |
| The reader's fee | drawn at resolution, `#relic` item_template query | Real. See § 2. |

## 2. Missing Primitives, and the query prize

None missing. The encounter uses step `rewardPool` (tag-filtered), `reputation_with`, `thread_strengthen`, `thread_weaken`, `assign_ambition`, `plant_compulsion`, a `deal` fill, a Stumble special (`opposes`) and a Bargain special (`costs.doomDelta`). All of these are live.

**Step effects path.** `getStepOutcomeMetadata` picks `successMetadata` on `isStepSuccess` and `failureMetadata` otherwise (`unifiedActionResolution.ts:1173-1179`). `isStepSuccess` = crit / success / success_at_cost / near_miss (`types/unifiedAction.ts:2955-2957`). The effect list is wrapped in a synthetic reaction and dispatched through `applyEncounterAftermathReaction` (`unifiedActionResolution.ts:1216-1264`), so every reaction-path effect kind is live per step. Sentinels bind before dispatch in `bindAftermathSceneTargets` (`encounterAftermath.ts:835-900`): `$actor` becomes `action.actorId`, `$ascendant` becomes `scene.ascendantId` (kind-checked), and `$here` becomes the actor's `located_at`, walked to the location tier.

**The `#relic` draw lands on the success path.** I traced it end to end:
1. `successMetadata.rewardPool` → `resolveUnifiedReward` → `drawSeededReward` with `site: 'step_reward_pool'` (`unifiedActionResolution.ts:1561`).
2. `mapStepOutcomeToRewardOutcome` (`unifiedActionResolution.ts:1510-1523`) maps success, success_at_cost and near_miss to `success`, and critical_success to `critical_success`.
3. `toContentQuery` sends `possession` → `{ kind: 'item_template', tags: ['#relic'] }` (`rewardPool.ts:139-162`). `item_template` resolves over `artifact` nodes (`contentQuery.ts:131`).
4. Pool weight per candidate = categoryWeight × tierCurve[tier] (`rewardPool.ts:265, 336`), drawn by `drawFromPool` (`rewardPool.ts:359`). An empty tier contributes nothing, so the draw renormalises.
5. **Live bearers (14, matching the tag catalog's `#relic · item 14`).** I recount this below because the packet's "14 in relics_talismans" is off by one.
   - `reward-attachment-catalog.ts`, all `attachmentCategory: 'possession'`, subcategory `relics_talismans`:
     - **T2:** Ember Sigil (:1150), Shadowglass Pendant (:1175), Hearthglass Ward (:1197), Stasis Pearl (:1223), Moonstone Pendant (:1940), River Clay Bead (:2334), Tarnished Draw-Tube (:2353).
     - **T3:** Heart of the Barrow (:1248), The Weeping Icon (:1272), Hourglass of the Unraveling (:1298), Null Circlet (:2083), The Sweating Vessel (:2372).
     - **T4:** The Fulcrum (:1326).
   - `anomaly-reward-catalog.ts:165`: Sealed Codex (possession, tomes_scrolls, **T3**).
   - There is **no tier-1 `#relic`.**
6. **Band odds.** Tier curves are at `rewardPool.ts:383-384`.
   - **Success curve** (T1 .40 / T2 .40 / T3 .15 / T4 .05): T2 2.80, T3 0.90, T4 0.05, so **≈75% T2, 24% T3, 1% T4**.
   - **Crit curve** (T1 .10 / T2 .40 / T3 .40 / T4 .10): T2 2.80, T3 2.40, T4 0.10, so **≈53% T2, 45% T3, 2% T4**.
   - Both pools are non-empty. The best band leans toward tier 3, which is the "best draw of the tier curve" the ladder promises. The dedup excludes relics the actor already holds, but 14 bearers make exhaustion negligible.

**Caveat (engine behaviour, accepted).** `BAD_OUTCOME_CHANCE_SUCCESS = 0.05` and `..._CRIT_SUCCESS = 0` (`rewardPool.ts:388-389`). On about 5% of success, success_at_cost and near_miss runs, the recipe swaps to the harm table with the tag filter dropped (`rewardPool.ts:651-656`). The PRIZE chip then names what was actually drawn, so the chip stays honest. The success and success_at_cost overview sentence "The court paid the (reader's) fee from the dead man's river finds" is the one line that would be wrong on that 5%. The cunning-fair and bell-at-the-exchange precedents carry the same exposure. The critical_success overview is always true.

## 3. Runtime Feasibility

- **Step and tier.** One plain step: veil 0.64, `fail_action`, duration 1–2. `intrinsicTier: 'shaping'`, `rarityTier: 2`, `scale: 'local'`, `settings: ['urban','rural']`, each with an opening. The id is under `encounter.town.*`, not `encounter.slice.*`. There is no rule gate (no `requiresHold`, guild rank or faction requirement) and no new condition id or node type. All of this is as the brief binds.
- **Difficulty cap.** The 0.45 cap binds only `intrinsicTier === 'background'` (`nudgeHandChecklist.ts:419-420`, `OPEN_DRAW_ATTENTION_TIER` at `nudgeAuthoringConstants.ts:169`), so 0.64 at `shaping` is lawful.
- **Hand.** The hand is 2 specials + deal 4 = 6. Both deal tags, `insight` and `presence`, are `DealContextTag` members (`types/unifiedAction.ts:1898-1910`).
- **Stumble special.** `opposes: 'heir'` resolves through `resolveOpposedCastNodeId` (`engine/encounters/nudges.ts:66-76`, called at `:331`). It strips an optional `$cast:` prefix and matches `supportBindings[].key === 'heir'` of kind `actor`. It is fail-soft: an unbound key falls back to card attribution and the delta still lands.
- **Bargain special.** `essenceCost: 0` is legal ("0 is allowed", `types/unifiedAction.ts:1683-1684`). `costs: { doomDelta: 1 }` is a `NudgeCostChannels` field (`:1810-1819`). The special mirrors the library `card.bargain.signature.entropy` exactly: 0 essence, 0.14, doom +1 (`nudge-card-library.ts:1034-1038`). Each special carries one cost channel.
- **Specials' imageTags.** `generic.luck` is `chaos` (`encounter-image-library.ts:631`) and `generic.decay` is `entropy` (`:641`). Both match the specials' spheres.
- **Motivations.** `tradition_novelty` and `honesty_cunning` are live `ValuePair`s (`types/agent.ts:12-13, 34-35`). `crudType: 'read'` is in the union (`types/unifiedAction.ts:2400`).
- **Outcome bands.** All five `byOutcome` bands are authored, which clears the floor of 3. `near_miss` aggregates to the `success_at_cost` action band (`debugOutcomePin.ts:375`).

## 4. Aftermath Supportability

**Effects, verified:**

| Effect | Evidence | Refusal paths |
|---|---|---|
| `thread_strengthen` / `thread_weaken` `$ascendant` ↔ `$actor` (reason set, default delta) | `encounterAftermath.ts:4039-4103` | Skips with `edge_missing` when the mortal holds no thread from this god. The aftermath page only reaches the player for threaded mortals (and `?forceencounters` only widens threaded ones), so the thread chip is backed wherever it is seen. |
| `reputation_with` `targetLocationId: '$here'` ±0.06 | `encounterAftermath.ts:1460-1530`; well under `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` 0.15 (`reputation.ts:66`) | — |
| `assign_ambition` `ambition_uncover_secrets`, `priority: 'secondary'`, `targetAgentId: '$actor'` | `encounterAftermath.ts:2403-2480` → `assignAmbitionToActor` (`ambitionAssignment.ts:108-127`). The id is an `AMBITION_TEMPLATES` member with `displayName: 'Uncover Ancient Secrets'` (`ambition-templates.ts:677-678`), which matches the chip text exactly. `AmbitionPriority` includes `'secondary'` (`types/ambition.ts:205`). | Returns `already_pursued` when the mortal already pursues it; the chip "is pursuing … now" stays true. Returns `no_free_slot` at `MAX_ACTIVE_AMBITIONS = 2` (`ambitionAssignment.ts:45, 127`), with no eviction. The-broken-seal measured about 21% of actors in a mature world (`the-broken-seal.ts:28-31, 602-608`). On that path the PATH · ambition chip reports a write that was refused. This is a corpus-wide engine limitation, and the-broken-seal ships the same exposure. It is a caveat and not a template defect: there is no band- or result-keyed chip channel to gate it on. |
| `plant_compulsion` `encounterBias: { explore: 0.5 }`, 72 ticks, `targetAgentId: '$actor'` | `encounterAftermath.ts:2978-3040`. `explore` is in the closed `EncounterType` union (`types/encounter.ts:28-30`). The bias is consumed by `derivePlantedCompulsionEncounterBias` (`plantedCompulsion.ts:60-86`, weight `COMPULSION_BIAS_WEIGHT` 0.5) in `phaseAgentDecision`. 72 ticks (six days) matches the bell-at-the-exchange step-metadata precedent (`bell-at-the-exchange.ts:138-144`). | Only an empty bias or a missing target refuses; neither applies here. |

**Prose rule 7b.** Every later-tense sentence is paired with its enacting effect on the same path:

| Sentence | Enacting effect |
|---|---|
| P3 "A wrong reading in court will cost {actor} their good name in {location}." | failure half `reputation_with $here` −0.06 |
| "The thread to {actor} runs stronger / thinner." | `thread_strengthen` / `thread_weaken` |
| "{actor} is pursuing Uncover Ancient Secrets now." | success half `assign_ambition` (see the `no_free_slot` caveat) |
| "For a while they put the search for the will before other work." (both failure bands) | failure half `plant_compulsion` explore +0.5 × 72 ticks |
| `plant_compulsion.narrativeHook` "…They have not." | same `plant_compulsion`. It is chronicle text, emitted only on a successful plant. |
| `assign_ambition.narrativeHook` "…they want to learn what other old finds can tell." | same `assign_ambition`. It is emitted only when `assigned`, so this line is never false. |
| `description` "…leaves them searching for the missing will for a while" | `plant_compulsion` |
| Overviews: "paid the (reader's) fee from the dead man's river finds" | step `rewardPool` (see the 5% caveat in § 2) |
| Crit overview "The magistrate thanked {actor}…" | a past event, which claims no state |
| Card effect line "Doom moves a step closer." | the Bargain's `costs.doomDelta: 1` |

There is no appointment, placed or timed promise, or seed. "The will is still missing", "the almshouse was calling it a lie" and "{cast:heir} called the second answer luck" are scene outcomes and assert no state.

**Law 56, band by band:**
- **critical_success, success, success_at_cost.** These chips (BOND reputation +, BOND thread +, PATH ambition, engine PRIZE) are backed by `successMetadata`. That metadata fires on every success-side step outcome. The success_at_cost action band is reached by a step `success_at_cost` or `near_miss`, and both are `isStepSuccess`.
- **failure, critical_failure.** These chips (SCAR thread −, SCAR compulsion, BOND reputation −) are backed by `failureMetadata`. That metadata fires on step failure and critical_failure, and one `fail_action` step maps those one-to-one to the action bands.
- **Fallback growth chip (veil reach).** This chip renders only on an unauthored outcome, and every band is authored.
- **success_at_cost cost.** The band's cost (face lost before the court) lives only in its overview. No lawful per-band step channel exists: `successMetadata` is keyed on `isStepSuccess`, not on band. This is the accepted pattern (cunning-fair; editorial "Consider" item).

## 5. Chip referents

| Chip | Referent | Resolves? |
|---|---|---|
| BOND · reputation with {location} (5 bands) | `entityId: '$here'`, `visualKind: 'location'`. `resolveRefAnchor` binds the sentinel at `buildAftermathConsequences.ts:682` (via `resolveAnchor`, `:527-530`). The noun text is enriched at `:705`, so the tag shows the town's name (`enrich` is `enrichProse(text, ctx)`, `buildUnifiedEncounterStageModel.ts:14`). `settings` expand only to settlement subtypes, so `$here` is always a place-tier location. This is the same form cunning-fair ships. THR-1685 does not bite: the chip anchors on `$here`, not on `$cast`, and the town is what the prose means. | yes (location, linked) |
| BOND/SCAR · thread | `ui.thread` (`ui-content.ts:458`), the shipped tooltip form | yes (named) |
| PATH · ambition | `ui.ambition` (`ui-content.ts:475`) | yes (named) |
| SCAR · compulsion (`kind: 'shell_state'`) | `ui.compulsion` (`ui-content.ts:469`); the bell-at-the-exchange precedent (`bell-at-the-exchange.ts:390`) | yes (named) |
| concept "higher regard" / "doubts their readings" | `ui.standing` (`ui-content.ts:384`) | yes |
| stateNoun tooltip | `ui.reputation_with` (`ui-content.ts:423`) | yes |
| PRIZE (engine) | the drawn `#relic` instance | yes (item, linked) |
| fallback growth · veil reach | `reach.veil`, a world-model reach node; the aftermathWords tooltip-backed set (`aftermathWords.ts:84-113`) | yes |

Each concept substring (`higher regard`, `doubts their readings`, `thread`, `Uncover Ancient Secrets`, `search for the will`, `veil reach`) occurs in its chip's `detail`. No chip anchors on `$actor` or `$cast`.

## 6. New Hooks Needed

None.

## 7. Implementation File Map

Only the compiler-owned set (`compile:encounter`). The package compiles into the encounter module, its structural test and both registrations. There are no engine, type or art changes.

The transcriber applies the revised prose from the final doc's **Exact strings** onto `drowned-mans-testimony.package.json`. The "Changed-from-package index" lists every field that moves, and the package's `doc` block says prose is replaced from the final doc. No mechanics change.

## 8. Verdict

**READY WITH CAVEATS**

(a) **Ambition refusal.** `assign_ambition` refuses on `no_free_slot` (about 21% of mature-world actors, no eviction). On those runs the PATH · ambition chip reports a write that did not land. This is a corpus-wide engine limitation shared by the-broken-seal, and I have not filed it (lanes do not file process tickets).

(b) **Bad-outcome swap.** The 5% bad-outcome swap on success, success_at_cost and near_miss draws makes the overview's fee sentence wrong on those runs. The PRIZE chip still names the true draw. Accepted engine behaviour, as in the precedents.

(c) **Cast reuse and gender.** The binder may reuse an existing local `trader` as the heir (mint is preferred about 99.8%). In that rare case, the gendered noun "nephew" may not fit the bound person. The packet's contrary claim is corrected in the final.

(d) **Census counting.** As in batch 1, the composition census counts `content_query` only off an `encounter_seed` query. This slot's tag-drawn prize (site `step_reward_pool`) may not register under that key, and the batch report should say so.

(e) **Live proof.** Take evidence from a seed sweep plus pinned bands, not the default proof run (#1111, #1113):
- `?spawn=encounter.town.drowned_mans_testimony&outcome=success`: confirm a `#relic` item lands on `$actor` (trace `step_reward_pool`, `content.query_*` with `tags: ['#relic']`) and that `assign_ambition` succeeds.
- `&outcome=failure`: confirm the `plant_compulsion` entry, the `reputation_with` write and `thread_weaken`.

(f) **Gates.** Run both `compile:encounter --dry-run` and `check:encounter`, because the dry-run misses the gates `check:encounter` runs (#1114). I did not run either in this pass (no npm by instruction).

## 9. Primitive Disposition

No missing primitives identified.

**Defects fixed in final.md (documentation only):**
- The packet's bearer claim ("14 items, relics_talismans") is corrected to 13 relics_talismans plus 1 anomaly-catalog item, with tiers named.
- The cast claims ("no reuse", "never gendered") are corrected to what the binder does.

No id, effect, delta, rewardPool, deal, cost or `opposes` value needed changing.
