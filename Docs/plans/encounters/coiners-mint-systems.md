# Encounter Pipeline: False Coin at the Mint
> Scale: short (local) | Slug: coiners-mint | Pass: systems
> Date: 2026-10-05 | Pipeline version: 2.0 (factory batch master-everyday, slot 5, THR-1688)
> Audited: `coiners-mint-revised.md` (editorial PASS WITH REVISIONS) against the live types and data, plus the orchestrator's in-memory `check-encounter --package` result on the provisional package.

**Verdict: READY WITH CAVEATS.** No missing primitive. Two gate findings (one FAIL, one warn class) and three spec/claim errors are corrected in `coiners-mint-final.md`. The caveats are re-gate checks on the compiled package, not pre-build tasks.

## 0. Gate findings applied (orchestrator's in-memory gate)

| # | Finding | Disposition in the final |
|---|---|---|
| 1 | **FAIL [forecast]** step 1: difficulty 0.81 + authored specials (0.14 + 0.08 = 0.22) = 1.03 > 1.00 | Hold The Door Shut `forecastDelta` **0.12**, Harden A Kind Heart **0.07**. Sum 0.19, so 0.81 + 0.19 = **1.00**, exactly at the ceiling. Step 0 is 0.75 + 0.10 + 0.08 = 0.93, clean. The full hand is far under `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70). |
| 2 | **[page]** success side: the two reactions shared *"who struck the coin"*. Failure side: the intents shared *"the mortal tells the"*, and the swear block shared *"the crown's court the"* with the failure overview | Success: **Keep the apprentice's name quiet** keeps its intent; **Name the apprentice to the council** now reads *"The town trusts the mortal more, and the mint-master will not forgive it."* Failure: the label **Swear for the mint-master** drops "at court"; its intent is *"The mortal swears the mint-master did not know. The mint-master will remember who stood up."* **Name the apprentice to the court** reads *"The town hears it, and the mint-master will not forgive it."* All effects and both stances (mercy against justice) are unchanged. I hand-checked the 4-word runs with the gate's own splitter (`proseWords.wordRuns`: hyphenated words stay one token, and label + intent read as one block). The only shared run between the paired stances is the 3-word *"the mint-master will"*. No reaction shares a 4-word run with its band overview or chips. |
| 3 | Bind library ids | Both ids exist in `NUDGE_CARD_LIBRARY` (`src/data/nudge-card-library.ts`: `card.heavy_hand.signature.force` "Throw Full Weight", `card.trait_card.core` "Draw On Character"). Hold gets `libraryCardId: 'card.heavy_hand.signature.force'` and Harden gets `libraryCardId: 'card.trait_card.core'`, matching the pattern shipped in `wolf-winter-watch.package.json` (`wolf.raise_morale`). Effect: `dealHand.ts` builds `authoredTypes` from authored `libraryCardId`s and refuses those types in the fill. Step 1 therefore can never be dealt a second Heavy Hand or a second trait card, and the batch's over-exposed-card tally counts Hold as the one Heavy Hand. Side effect, which is correct: `buildNudgeHand`'s repertoire gate now dims Hold for a god whose repertoire lacks the force signature. That is the same god its `sphere: 'force'` already dims. The trait card is core, held by every god, so no new gate. |
| 4 | "All three variants on step 1" is false | `TraitVariant` (`src/types/unifiedAction.ts:1851`) has no step field. `traitVariants` is **template-level**, and `resolveTraitVariants` applies a held variant's `forecastDelta` and `factorLine` on **every** step. Warm (−0.05), Proud (−0.05) and Shadow Walker (+0.05) therefore drag or lift **both** steps. The final says so. Consequences: (a) the Proud factor line *"…will not leave without the dies, whatever the noise."* names the dies on step 0, where no prose has established them yet, and it is false to the investigation step. It is reworded to *"Being Proud, they will not stop short, whatever the noise."* (10 words, true on both steps, and the brief's "stubborn one refusing to stop"). Warm (*"slow to hand anyone to the hangman"*) reads true on step 0 too, because the opening already puts a hanging on the table. Shadow Walker (*"wait in the dark without a sound"*) fits both a night watch on the strongroom and the take. (b) On step 0 the Warm variant's `addNudgeIds: ['coin.harden_a_kind_heart']` names a nudge that step does not carry. `buildNudgeHand` skips it with one `console.warn` per template. That is fail-soft and inert, and it is the same shape `wolf-winter-watch` ships (Raise Morale on step 2 only). It is accepted, and noted so a reviewer reading console output is not surprised. |
| 5 | Standing chip `stateNoun` spelling | **`reputation with {location}`**, anchored `$here`, `visualKind: 'location'`, `tooltipId: 'ui.reputation_with'`. The reasoning follows the table. |

**Why `{location}`, not `{target}` (finding 5):**

- **Both spellings pass the gate.** `chipStateNounWordingViolations` exempts the exact string `reputation with {target}` (`CHIP_STATE_NOUN_REPUTATION_FORM`). `reputation with {location}` is 3 words, which is not over `CHIP_STATE_NOUN_MAX_WORDS` (3), and its `$here` anchor is not one of the flagged carrier sentinels (`$actor` / `$target` / `$cast:*`).
- **Spec rule 0c.1 is stale on one point.** It says the surface "does not enrich" `stateNoun`, so a placeholder "ships as literal braces". Since THR-1685, `nounTextFor` in `buildAftermathConsequences.ts` runs `enrich(text)` on every noun. The revised doc's premise for `{target}`, that `{location}` would render as literal braces, is false: **both enrich**.
- **`{location}` is right for this chip.** `{location}` enriches to the acting mortal's current location, and that is the node the `$here` anchor and the `reputation_with $here` write resolve to. Noun, anchor and write therefore name one place on every draw. `{target}` with a `$here` anchor falls through to the scene's target (`SCENE_TARGET_ANCHORS`). That is the settlement on a board draw and could be anything else on any other draw path, so the tag can disagree with the write.
- **The corpus convention agrees.** Every `$here`-anchored reputation chip in the shipped packages but one encounter uses `reputation with {location}` (86 chip declarations across 16 packages, e.g. `flood-dyke-mending`, `wolf-winter-watch`). `reputation with {target}` is the person-anchored form (`$cast:*`, rewritten per person by THR-1685). The one outlier is `debt-arbitration` (7 declarations).
- **Follow-up.** Spec rule 0c.1's "does not enrich" sentence should be corrected. I filed nothing, because process notes go through the batch report.

## 1. Support Bundle Honesty

| Object | Claim | Verified | Notes |
|---|---|---|---|
| `mintmaster` (actor) | lazy-materialize, reuse `smith`, spawn `smith` "Marrin Coyle", must-persist | **Yes** | `smith` is on `LOCATION_ROLE_ROSTERS` for town (0.9), city (1.0) and capital (1.0) in `src/types/npc.ts`, so `urban` reuse almost always succeeds. The spawn fallback covers the rest. Must-persist is required: three reactions write `bond_change` on `$cast:mintmaster`. |
| The Coiner's Dies | `spawn_artifact` to `$actor` on step 1 success | **Yes, with one field the revised doc left implicit** | The shape is `{ kind: 'spawn_artifact', category: 'mundane', tier: 'common', nameOverride: "The Coiner's Dies", tags: ['#shadow', '#tool'], targetAgentId: '$actor' }`. **`nameOverride` is required**, or the boon chip's noun names an item the sheet calls something else (Law 56 / rule 0b). Both tags are in the content-tag catalog (`#shadow` and `#tool`, item kind). `category`/`tier` are valid `ArtifactCategory`/`ArtifactTier` values. |
| Standing with {location} | `reputation_with $here` | **Yes** | `targetLocationId: '$here'`, `delta`. Same shape as the shipped corpus. |

No optimistic delivery claims.

## 2. Missing Primitives

- Test shaping: authored specials, deal fill, carryover factor lines and trait variants are all live.
- Flip/reveal state: none needed. The apprentice reveal is prose-only, held behind the investigation gate in afterimages. No hidden mark is claimed.
- Task/progress carriers: the two-step linear `continue_weakened` → `fail_action` structure is live.
- Prevention/interception/recovery: none claimed.
- Authored choice bundles: **not used**, because the rejected `authoredChoices` model is absent. Aftermath reactions are the live `EncounterAftermathReaction` shape.
- **Band-keyed step write for `success_at_cost`:** not available. `EffectPredicate` (`src/types/effects.ts`) has no outcome-band condition. The revised doc records this as an accepted limit: SAC takes the same +0.05 as success, and the SAC chip says "a little better". That is honest, and not a new gap to file.

**No missing primitives identified.**

## 3. Runtime Feasibility

- Beats: 2 (shadow 0.75 `continue_weakened` → shadow 0.81 `fail_action`), mean 0.78. Both steps are inside the brief's master band of 0.72–0.85.
- Branching: linear, branch count 0. Supported.
- Outcome ladder: all five bands authored in `aftermathConfig.fallback.byOutcome`. All six `StepOutcome`s are covered by specials on both steps (Hold alone covers all six on step 1, because Harden is hidden off-trait).
- A step-0 `critical_failure` ends the action, as the corpus documents ("a critical_failure at any step ends the action"). The revised step-0 crit-failure afterimage and the critical_failure overview both read true on that path.
- Hands: step 0 has 2 specials + deal 3 (`['shadow', 'insight']`). Step 1 has 2 specials (1 off-trait) + deal 3 (`['shadow', 'finesse']`). Every deal tag is a `DealContextTag`. Composed hands stay at 4–5, inside `NUDGE_HAND_MIN..MAX`.
- Image tags verified in `encounter-image-library.ts`: `generic.rumor` (mind), `generic.energy` (energy), `generic.strength` (force), `generic.focus` (mind).
- Trait ids verified: `trait.core.core_warmth.virtue` (Warm) and `trait.core.core_humility.vice` (Proud) per `coreRegistry.ts`, both already used in `ambition-templates.ts`. `trait.mastery.shadow-walker` ("Shadow Walker") is in `mastery-trait-content.ts`.
- Heavy Hand: `costs.detectionDelta: 0.15`, essence 0, one channel. This is the batch's single allowed Heavy Hand (brief § Cost channels).

## 4. Aftermath Supportability

- Reputation channel: `reputation_with $here`, real. +0.05 on step 1 `successMetadata`; −0.08 on step 1 `failureMetadata`; −0.03 on step 0 `failureMetadata`. Every standing chip is backed on its band (Law 56). Step-0-fail plus step-1-success nets +0.02, and the SAC chip's "a little better" matches.
- Possession: `spawn_artifact` on step 1 `successMetadata` fires on every success-side band. The boon chip is anchored `$artifact` (`ANCHOR_SENTINEL_ARTIFACT`), `visualKind: 'artifact'`.
- Bond reactions: `bond_change` (`withAgentId: '$cast:mintmaster'`, `sentimentDelta` ±0.12) and `reputation_with $here +0.03`. All live.

**Prose rule 7b: every later-tense promise is checked against the effect that enacts it.**

| Sentence | Path | Enacting effect |
|---|---|---|
| "The mint-master will remember the mercy." | success reaction *Keep the apprentice's name quiet* | `bond_change $cast:mintmaster +0.12` |
| "…the mint-master will not forgive it." | success reaction *Name the apprentice to the council* | `bond_change $cast:mintmaster −0.12` |
| "The mint-master will remember who stood up." | failure reaction *Swear for the mint-master* | `bond_change $cast:mintmaster +0.12` |
| "…the mint-master will not forgive it." | failure reaction *Name the apprentice to the court* | `bond_change $cast:mintmaster −0.12` |
| "Rival gods notice a hand this heavy." | Hold effect line | `costs.detectionDelta 0.15` |
| Opening "The crown's assayer comes at the week's end…" / "If it is light, the mint will be shut and its master hanged." / spine "Whoever struck the false coin will hang for it." / "…all of {location} will know of the coining by morning." | openings and spines | **P3 stakes, not promises to the mortal.** These state the world's law and the stake. They bind the mortal to no place or time, and the band prose resolves each one. No appointment is needed, and none is claimed. |

No placed-and-timed promise exists, so no `appointment` block is needed. **Honesty note:** "the mint is shut" and "{cast:mintmaster} is held for the crown's court" in the failure overviews are prose, with no world state behind them. There is no mint node, and nothing jails the smith. That is lawful for an overview, which is prose and claims nothing, and no chip asserts it. But no later content can read that the mint shut. This is accepted for an everyday encounter.

## 5. Chip referents resolve

| Chip | Noun | Anchor | Resolves to |
|---|---|---|---|
| standing (all 5 bands) | `reputation with {location}` | `$here`, location | the acting mortal's location, the same node the write targets |
| boon (3 success bands) | `The Coiner's Dies` | `$artifact`, artifact | the item `spawn_artifact` mints that band, named by `nameOverride` |

No chip points at fiction. The apprentice, the strongroom, the watch and the assayer are never chip referents.

## 6. New Hooks Needed

None. No new role, sublocation type, state field, trait, condition or card.

## 7. Implementation File Map (beyond the compiled set)

- `Docs/plans/encounters/coiners-mint.package.json`: author it from `coiners-mint-final.md` (the compiler's input). `compile:encounter` then owns the module, the structural test and both registrations. Do not hand-edit those.
- `src/data/content-eval/plotHooks.ts`: stamp `hook.stronghold_raid` `usedBy` with `encounter.town.coiners_mint` at closeout (brief § Rolled constraints).
- No engine, type, art or primitive files.

## 8. Verdict

**READY WITH CAVEATS.**

1. **Re-run `check:encounter --package` on the compiled package** to confirm the step-1 forecast is ≤ 1.00 (it sits at exactly 1.00) and the `[page]` warnings are gone. I verified both by hand against the gate's own splitter. The machine run is the proof.
2. **Composed-hand check (self-audit FLAG carried forward):** confirm in the composed-hand output that each step reaches ≥4 spheres and ≥1 ungated common. Also confirm that the step-0 fill (`shadow`/`insight`) does not deal `card.boost.signature.energy` beside Stir A Banked Fire. The brief forbids that card. `deal.exclude` takes card *types*, so excluding `boost` would also bar the core Boost the brief wants the fill to supply. If the fill deals it, the narrowest fix is to bind Stir to a library id or to change the step's deal tags. Do not use a type-wide exclude.
3. **Expected console line:** one `[nudges] encounter.town.coiners_mint: traitVariant 'trait.core.core_warmth.virtue' adds unknown nudge id 'coin.harden_a_kind_heart'` on step 0 for a Warm mortal. This is inert, and it is the shipped `wolf-winter-watch` pattern.
4. **Accepted design limits carried:** no band-keyed SAC write. The own-trait opposition meets only Warm or Proud mortals, so everyone else plays a plain heist (editorial "Consider"). This is a batch-report line, not a defect.

## 9. Primitive Disposition

No missing primitives identified.
