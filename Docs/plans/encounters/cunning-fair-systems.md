# Encounter Pipeline: The Widow's Dream (slug cunning-fair)
> Scale: local (short) | Slug: cunning-fair | Pass: systems
> Date: 2026-09-29 | Pipeline version: 2.0
> Critic: independent (batch journeyman-everyday-2, slot 6, THR-1677). Audited against the post-editorial `cunning-fair.package.json`; no separate final file (batch critic contract).

## 1. Support Bundle Honesty

| Object | Claim | Verdict |
|---|---|---|
| `rival` (`$cast:rival`) | actor, `lazy-materialize-on-trigger`, `must-persist`, reuse `healer`, spawn `healer` "Tamsin Carrow" | Honest. `healer` is a live `NpcRole` (`src/types/npc.ts:39`). It is seeded per settlement subtype at chances 0.5–1.0 (`npc.ts` 220–340), and a spawn fallback covers a settlement without one. `supportRole` is a free string. The rival is named in prose and overviews only, and no effect writes onto them. `castTargetViolations` is clean (THR-1165), because nothing needs a persistent cast target here. The spawn name is never gendered in prose. |
| The keepsake | drawn at resolution | See § 2. |

## 2. Missing Primitives, and the query prize

None missing. What is used: step `rewardPool`, `reputation_with`, `thread_strengthen` / `thread_weaken`, `hidden_mark`, and the deal fill. All are live.

**The `#talisman` draw actually lands on the success path.** Traced end to end:

1. `successMetadata.rewardPool` → `resolveUnifiedReward` (`unifiedActionResolution.ts:1534`) → `drawSeededReward` with `site: 'step_reward_pool'`.
2. `mapStepOutcomeToRewardOutcome` maps `success`, `success_at_cost` and `near_miss` → `success`, and `critical_success` → `critical_success`. `successMetadata` fires on `isStepSuccess`, so all four success-side step outcomes draw. `near_miss` aggregates to the `success_at_cost` action band (`debugOutcomePin.ts:375`), which is why that band carries the success chips.
3. `toContentQuery` projects `{ categoryWeights: { possession: 1 }, tagFilters: ['#talisman'] }` onto `{ kind: 'item_template', tags: ['#talisman'] }` (`rewardPool.ts:162`) and resolves it through `resolveContentQueryDetailed`.
4. Live members (`reward-attachment-catalog.ts`): Wayfarer's Charm, Bone Ward, Duelist's Luck Token and The Hush Stone (tier 1), and Gambler's Last Copper (tier 2). This matches the tag catalog's `#talisman · item 5`. Both the success curve (T1 0.40 / T2 0.40) and the crit curve (T1 0.10 / T2 0.40) weight a non-empty pool. The best band therefore leans to the tier-2 Copper, which is the "best draw of the tier curve" the ladder promises.
5. `validateContentQueries` (liveness arm of `check:encounter`) finds the pool non-empty.

**Caveat (not a defect):** `BAD_OUTCOME_CHANCE_SUCCESS = 0.05`. On `success`/`success_at_cost` there is a 5% roll that swaps the recipe for the harm table (condition 0.6 / curse 0.3 / blessing 0.1, with the tag filter dropped). The crit band is 0. The PRIZE chip then names what was drawn, so the page stays honest. `narrativeTemplates.success` ("the keepsake is theirs") is the one line that would be wrong on that 5%. It is the chronicle summary, not the aftermath page, and the bell-at-the-exchange precedent carries the same exposure. Accepted.

**The hidden mark was a write nothing read (fixed).** `hidden_mark` without `revealFamilies` never matches `evaluateMarkReveals` (`hiddenMarks.ts:152`). It could not raise encounter scores or be consumed by a reveal. It only decayed after `MARK_DECAY_GRACE_TICKS` into a sub-toast chronicle line. Fixed: `revealFamilies: ['shadow', 'settlement']`. Both are live aliases in `reveal-family-aliases.ts`. `shadow` covers `action.shadow.*` (spy, establish-network, recruit-agent), `encounter.shadow_*` (ambush, hunt, in_the_night) and `reputation.shadow.*`. `settlement` covers `encounter.frontier_settlement`, `encounter.rally_the_locals` and `loc.*`. A reader who knows where a widow's coin sits now leans slightly toward shadow work and settlement business, and a reveal there spends the label aloud. The label was also wrong for its consumer. `HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE.secret_knowledge` splices `{mark_label}` as a spoken noun phrase ("A phrase drops into the conversation … — {mark_label} —"), so "Knows what coin the widow keeps in her house" would have rendered as a broken sentence. It is now *"the coin in the widow's house"*.

## 3. Runtime Feasibility

One plain step: Veil 0.45, `fail_action`, duration 1–2. `intrinsicTier: 'background'`, `rarityTier 2`, `scale local`, `settings ['urban','rural']`: all unchanged and within the background cap (`NUDGE_OFF_REACH_MAX_DIFFICULTY` 0.45). The composed hand is 2 specials + deal 4 = 6. The `deal.tags` `lore` and `social` are members of `DealContextTag`. The specials' spheres are mind and matter. `imageTag` `generic.memory` (mind) and `generic.matter` (matter) match (`encounter-image-library.ts:636, 642`). `motivations` `tradition_novelty` (Veil, Archivist/Heretic) and `courage_prudence` are live `ValuePair`s (`src/types/agent.ts`). The dry-run test recomputes the consequence hand `['secret','thread']` from id + reach + rarity. The five `byOutcome` bands clear the floor of 3.

## 4. Aftermath Supportability (prose rule 7b)

| Sentence | Enacting effect |
|---|---|
| P3 "Whoever reads it wrong … loses trade in {location}" | `reputation_with` `targetLocationId: '$here'` −0.05 (failure half) / +0.06 (success half) |
| "The thread to {actor} runs stronger / thinner" | `thread_strengthen` / `thread_weaken` `$ascendant` ↔ `$actor` |
| "{actor} knows there is coin in the widow's house now" | `hidden_mark` `secret_knowledge` on `$actor`, success half |
| "the keepsake is theirs" (initiation/success summary) | step `rewardPool` (see § 2 caveat) |

No appointment, no placed or timed promise, no seed. Nothing is unenacted. "{cast:rival} calls the second one luck" and "sold a charm … to every house on the square" are scene outcomes in overviews. They claim no state.

**The author's doubt 1: success_at_cost chips are identical to success.** Verified: there is **no lawful per-band step channel.** `successMetadata` is keyed on `isStepSuccess` and not on band. `EffectPredicate` (`src/types/effects.ts`) has no outcome or band predicate. The only band-keyed write surface is `AftermathOutcomeOverride.reactions`, which would put a player choice on a local test the brief keeps choice-free. So the band's cost (face lost at the fair) lives in its overview, which is prose and claims no state. **Acceptable**, and consistent with batch 1's assize-letter and bell-at-the-exchange. One real defect was found and fixed: the draft's success_at_cost chip said "thinks *a little* better", and the crit chips said "trusts … now" / "trusts … far less". Each implied a magnitude different from the single fixed write (+0.06 / −0.05), which misreports state (Law 13 visibility parity). The wording is now uniform per polarity.

**The author's doubt 2: `reputation with {location}` in `stateNoun`.** **It renders enriched, not raw.** `buildAftermathConsequences.ts:705` runs `enrich(stateNoun.text)` (THR-1205). The live adapter passes `enrich: (text) => enrichProse(text, ctx)` (`buildUnifiedEncounterStageModel.ts:811`), and `{location}` is a core `enrichProse` placeholder. The masons-commission chip (batch 1) ships the identical noun. Note: `nudge-authoring-spec.md` § Consequences 0c still says the surface "does **not** enrich" `stateNoun`. That sentence predates THR-1205 and is stale. It is recorded here for the batch report, not filed (lanes do not file process tickets).

## 5. Chip referents

| Chip | Referent | Resolves? |
|---|---|---|
| BOND/SCAR · reputation with {location} | `entityId: '$here'`, `visualKind: 'location'`: the settlement the mortal is in. `settings` expand only to settlement subtypes, so `$here` is always a place-tier location | yes (location, linked) |
| BOND/SCAR · thread | `tooltipId: 'ui.thread'` (`ui-content.ts:458`). The catalog's `thread` row asks for endpoint anchoring, but the tooltip form is the shipped precedent (overdue-caravan) and passes `chipAnchorViolations` | yes (named) |
| PATH · hidden mark | `tooltipId: 'ui.hidden_mark'` (`ui-content.ts:436`), backed by the success-half `hidden_mark`. It is a GameState record, not a graph node, so a tooltip is the only anchor it can take (the one-body-short precedent) | yes (named) |
| PRIZE (engine) | the drawn `#talisman` instance | yes (item, linked) |
| fallback growth · veil reach | `reach.veil` tooltip; renders only on an unauthored outcome | yes |

The concept substrings (`thinks better of`, `trusts their readings less`, `coin in the widow's house`, `thread`) each occur in their `detail`.

## 6. New Hooks Needed

None.

## 7. Implementation File Map

The compiler-owned set only (`compile:encounter`: module, structural test, registration). No engine, type or art changes.

## 8. Verdict

**READY WITH CAVEATS**
- (a) As in batch 1, the composition census counts `content_query` only off an `encounter_seed` query. This slot's tag-drawn prize (site `step_reward_pool`) is a query prize by recipe but may not register under the census key. The batch report should say so.
- (b) Live proof should pin `success` and confirm that a `#talisman` item lands on `$actor` (trace `step_reward_pool`, `content.query_*` with `tags: ['#talisman']`). It should also confirm that `hidden_mark_placed` carries `revealFamilies [shadow, settlement]`.
- (c) The 5% bad-outcome swap on the success bands (see § 2) is accepted as engine behaviour.

## 9. Primitive Disposition

No missing primitives identified.

Gate evidence: `npm run compile:encounter -- Docs/plans/encounters/cunning-fair.package.json --dry-run` exits 0. The scratch `check:encounter` (the real script, with the package's `assembleTemplate` output injected in place of the registry lookup) reports `✓ encounter.town.cunning_fair [systems: cast, rewards, reputation]` with 0 violations, 0 liveness, 0 token, 0 forecast problems and 0 warnings.
