# Encounter Pipeline: Called to End a Feud
> Scale: medium (3 steps, `scale: 'local'`) | Slug: feud-mediation | Pass: systems
> Date: 2026-09-30 | Pipeline version: 2.0 | Batch: expert-everyday-1, slot 2 (THR-1678) | Auditor: cold context

Audited input: `feud-mediation-revised.md` (editorial PASS WITH REVISIONS). Template id `encounter.town.feud_mediation`.

**Verdict: READY WITH CAVEATS.** No missing primitive. The audit found three wiring defects and fixed each one inline in `feud-mediation-final.md`. One of them would have silently broken the scene: both heads could bind to the same NPC. The caveats are checks the implementer runs at compile. None of them blocks the work.

---

## 0. Id and shape verification (every reference in the packet, grepped in `src/`)

| Reference | Where checked | Result |
|---|---|---|
| Template id `encounter.town.feud_mediation` | `src/` grep | Free: no collision. `feud.` nudge prefix is unused. |
| Consequence hand `companion` + `secret` | `npm run draw:consequences -- encounter.town.feud_mediation --reach heart --rarity 2` | **Confirmed.** It drew `companion` (weight 9) and `secret` (weight 4). Wired by `grant_companion` and by `hidden_mark` + `favor_creation`. |
| `intrinsicTier: 'shaping'` | `AttentionTier` (`src/types/attention.ts:20`) | Valid. The 0.45 open-draw cap (`nudgeHandChecklist.ts:419`) binds `background` only. |
| `motivations: ['loyalty_ambition', 'revelation_discretion']` | `src/types/agent.ts:14-15` | Valid `ValuePair`s. |
| `grant_companion` `{ companionTemplateId, targetAgentId }` | `unifiedAction.ts:657` | Shape matches. `companion.guild-scribe` exists (`companion-templates.ts:91`: profession *Guild Scribe*, gold 2, tags `#settlement`/`#court`). `encounterAftermath.ts` mints with `respectCap: false`, so the chip's write always lands. |
| `hidden_mark` `{ category, severity, label, revealFamilies, targetAgentId }` | `unifiedAction.ts:552` | Shape matches. `concealed_action` is a `HiddenMarkCategory` (`:114`). `investigation` is a live alias (`reveal-family-aliases.ts:42`, 12 prefixes). See caveat C3. |
| `favor_creation` `{ magnitudeRange, context, debtorAgentId }` | `unifiedAction.ts:1124` | Shape matches. `debtorAgentId` is a registered `agent` sentinel field (`sceneSentinels.ts:120`), so `$cast:accused` binds. |
| `reputation_with` `{ targetLocationId: '$here', delta }` | `unifiedAction.ts:1176`, `sceneSentinels.ts:222` | Shape matches. `$here` binds a `location` field. Deltas are 0.06 and 0.03, under `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` 0.15 (`reputation.ts:66`). Precedent: `counting-house-dispute`, `cunning-fair`. |
| `intelligence` `{ category, label, detail }` | `unifiedAction.ts:562` | Shape matches. `political_secret` is an `IntelligenceCategory` (`:78`). |
| `bond_change` ±0.12 on `$cast:aggrieved` / `$cast:accused` | `unifiedAction.ts:1336` | The implementer writes it as `{ kind: 'bond_change', withAgentId: '$cast:<key>', sentimentDelta: ±0.12 }`. Both keys are `lazy-materialize-on-trigger`, so `castTargetViolations` passes. |
| Trait refs `trait.core.core_forgiveness.virtue` / `.vice` | `coreRegistry.ts:143`, `core-trait-content.ts:70-72` (`trait.core.<continuumId>.<pole>`), `traitRefIndex.ts` | Resolve. They are already live refs in `ambition-templates.ts:1046-1049`, so `validateTraitRefs` will not report them dead. |
| Trait card `requiredTrait` + `essenceCost: 0` | `nudgeHandChecklist.ts:301`, precedent `the-broken-seal.ts:185-200` | Lawful. The precedent also pairs the card with `addNudgeIds` on the variant (added, see F3). |
| Image tags `generic.rumor` / `generic.memory` / `generic.luck` / `generic.oath` / `generic.mercy` | `encounter-image-library.ts:631-638, 683` | All five are library rows. `generic.mercy` is the situational *appeal* row, which fits a trait card. |
| Deal tags `insight`, `social`, `presence` | `DealContextTag` (`unifiedAction.ts:1898`) | All in the closed union. |
| Stumble `opposes: 'aggrieved'` | `StepNudge.opposes` (`unifiedAction.ts:1758`); precedent `toll-of-blades.ts:166` | Bare cast key is accepted. `aggrieved` is declared. |
| Card named "Whisper" (Loosen A Tongue) | `nudge-card-library.ts:151`; `StepNudge.reveals` (`NudgeRevealKind = 'next_step_demand'`) | **Defect, fixed (F2).** A Whisper's mechanism is `reveals: 'next_step_demand'`, but the card's effect line promises witnesses who talk. |
| NPC roles `merchant`, `noble`, `elder` | `NpcRole` (`src/types/npc.ts:38,45,70`) | All valid. **Reuse overlap is a defect, fixed (F1).** |
| `EncounterSupportActorSpec.supportRole` | `src/types/encounter.ts:218` (required) | Not authored by the packet. Supplied in F1. |
| `TraitVariant.factorLine` | `unifiedAction.ts:1835` (required) | **Not authored by the packet, fixed (F3).** |
| Tooltip ids `ui.reputation_with` / `ui.standing` / `ui.favour_owed` / `ui.companions` | `src/data/ui-content.ts:423, 384, 404, 20` | All four are registered, so `tooltipResolves` passes. |
| Chip anchor `$here` (`visualKind: 'location'`) | `chipAnchorDeclarations.ts:250` (unconditional ok) | Resolves. Precedent `cunning-fair.ts:269`. |
| Chip anchor `$cast:accused` (favour concept) | `classifyAnchorDeclaration` cast branch | Resolves, because the key is declared. |
| Companion chip | Anchor catalog § companion; no `$companion` sentinel (#1115) | Anchor it through `stateNoun { text: 'companion', tooltipId: 'ui.companions' }`, exactly as `fair-bout.ts:443-452` does. |
| `aftermathConfig { branchOnStep: 0, variants: {}, fallback }` | `BranchAwareAftermathConfig` (`unifiedAction.ts:2250`, `branchOnStep` required) | Lawful, and the fallback-only shape is precedented (`assize-letter`, `bell-at-the-exchange`, `border-levy`). The editorial "Consider" note is resolved: keep it. |
| `carryoverFactorLines` keyed `near_miss` | `Partial<Record<StepOutcome, StepCarryoverFactorLine>>` (`:2051`), `forecastDelta` field | Lawful. The packet's "Δ" column maps to `forecastDelta`. |

## 1. Support Bundle Honesty

| Object | Claim | Verdict |
|---|---|---|
| `accused` | lazy-materialize, must-persist, reuse merchant/noble/elder, spawn elder "Osric Venn" | **Delivery honest, reuse list defective (F1).** |
| `aggrieved` | lazy-materialize, must-persist, reuse merchant/noble/elder, spawn merchant "Maud Carrow" | **Same defect (F1).** |
| guild scribe companion | `grant_companion` | Honest. It mints a new companion node plus an `accompanies` edge, uncapped. The scribe is told in fiction only, as the packet says. |
| town standing | `reputation_with $here` | Honest. It writes the edge that the Location Profile standing row reads. |

**F1: the two heads can bind to the same person.** On the legacy (non-`useScoredBinder`) path, `resolveActorSupport` calls `findExistingActorSupport(state, placementId, spec)` (`encounterSupportBundle.ts:157-194`). That function returns the first individual at the anchor whose `npcRole` is in the spec's `reuseNpcRoles`. It is never passed the bundle's earlier bindings, and a reused node is not stamped. Both specs declare the identical list `[merchant, noble, elder]`, so in any town holding one such NPC, `accused` and `aggrieved` both bind that NPC.

The consequences:
- one person is both heads of the feud;
- the Stumble opposes the favour debtor;
- the failure reaction's `bond_change` +0.12 and −0.12 land on the same edge and cancel to zero.

The shipped two-cast precedent (`fair-bout`) uses disjoint lists. **Fixed:**
- `accused`: `reuseNpcRoles: ['noble', 'elder']`, `spawnNpcRole: 'elder'`, `supportRole: 'feud_accused_head'`
- `aggrieved`: `reuseNpcRoles: ['merchant']`, `spawnNpcRole: 'merchant'`, `supportRole: 'feud_aggrieved_head'`

The two `supportRole` values are distinct. That also keeps the `encounterSupportRole` match branch (`:178`) from cross-binding the two heads on a later draw.

## 2. Missing Primitives

None. Test shaping (carryover lines, trait variant, trait card), concealed state (`hidden_mark`), persistent social debt (`favor_creation`), a companion (`grant_companion`) and place standing (`reputation_with`) are all live. The packet authors no fork, no seed, no appointment and no rejected `authoredChoices`.

## 3. Runtime Feasibility

- **Beats.** Three positions, inside `COMPOSITION_STEPS_MAX` 3. Linear.
- **Outcome aggregation** (`computeFinalActionOutcome`, `unifiedActionLifecycle.ts:344`):
  - Steps 0 and 1 are `continue_weakened`, and step 2 is `fail_action`.
  - A failure on step 0 or 1, or any `near_miss` / `success_at_cost`, aggregates to `success_at_cost`.
  - `failure` and `critical_failure` arrive only through step 2.
  - `isStepSuccess` counts `near_miss` as a success (`unifiedAction.ts:2956`).
  - So every success-side band fires step 2's `successMetadata`, and every failure-side band fires its `failureMetadata`. The editorial's reading ("s_a_c overview must be true on every path") is correct.
- **Forecast ceiling (difficulty + authored hand).**
  - Step 0: 0.55 + 0.10 + 0.09 = 0.74.
  - Step 1: 0.62 + 0.10 = 0.72.
  - Step 2: 0.68 + 0.10 + 0.08 = 0.86.
  - Worst case, step 2 for a Forgiving mortal with a critical carryover: 0.86 + 0.06 + 0.04 = 0.96.
  - All stay ≤ 1. No Δ ≥ `NUDGE_BIG_DELTA` 0.15. The authored totals are far under `NUDGE_HAND_MAX_TOTAL_DELTA` 0.70.
- **Hand rules.**
  - Specials are 2 / 1 / 2 (≤2 each). Every special has a `failure` fragment. Card names are 3 words (≤4). One shared prefix, `feud.`.
  - The ≥4-sphere and ≥1-common rules are composed-hand rules owned by `checkComposedHand` at the live deal (caveat C1).

## 4. Aftermath Supportability

**Band faces** (`aftermathFaces`, wholesale `??` substitution):
- All five bands are authored in `fallback.byOutcome`. That meets the floor of 3 and has a success side, a failure side and an extreme.
- The base face carries no `changes`, so it is exempt from Law 56. It is reachable only on `contested_*`, which an individual never rolls.
- Each failure band must author its own `reactions` (the failure pair). If it does not, it inherits the base success pair.

**Law 56 clause 1 (a chip needs a backing write on its band).**

| Band | Chips | Backing writes on that face |
|---|---|---|
| critical_success / success / success_at_cost | reputation with {location}, a favour owed, companion | step 2 `successMetadata`: `reputation_with` +0.06, `favor_creation`, `grant_companion`; step 0 `successMetadata` `hidden_mark`; reactions `reputation_with`, `intelligence` |
| failure / critical_failure | reputation with {location} (SCAR) | step 2 `failureMetadata` `reputation_with` −0.06; reactions `reputation_with`, `bond_change` ×2 |

Each chip's *semantic* write fires on every path into its band, because step 2 is the one gate.

**Law 56 clause 2 and the chip-noun wording rule** (`chipStateNounWordingViolations`, `CHIP_STATE_NOUN_MAX_WORDS` 3):
- `reputation with {location}` is 3 words. Its anchor is `$here`, not a carrier sentinel, so it passes.
- `a favour owed` is 3 words, with a tooltip anchor only. It passes.
- `companion` is 1 word, with a tooltip anchor. It passes.
- THR-1685 does not bite, because no chip interpolates `{target}`.
- The exact anchor declarations are specified in the final doc § Systems wiring spec.
- Every chip is 10–15 words, within the budget (`causeClause` + `detail` ≤ 15).

**Systems quota** (`systemConnections`):
- `cast`: two actor specs.
- `rewards`: `hidden_mark`, `favor_creation` and `bond_change` are persistent kinds.
- `reputation`: `reputation_with`.
- That makes 3, which meets `COMPOSITION_SYSTEMS_QUOTA_MIN`.

**Prose rule 7b (later-tense promises).**
- P3 "{location} will think less of {actor}" is enacted by step 2's `failureMetadata` `reputation_with $here −0.06`.
- "the house scribe travels with {actor} now" is enacted by `grant_companion`.
- "{cast:accused} owes {actor} a favour" is enacted by `favor_creation`.
- "Stay on in town, taking no side" and "See the contract kept" are stances taken where the mortal already stands (`$here`). Their effect is the town marking it (`reputation_with +0.03`). This is the shipped `levee-breach` pattern ("Stay on to rebuild the far bank"), not a placed or timed promise.
- There is no `encounter_seed`, so there is nothing placeless to flag.

## 5. Chip referents resolve

Every chip referent is either a `WorldRef` the ending writes or a registered tooltip concept:
- the town (`$here`, `location`);
- the debtor head (`$cast:accused`, `agent`, declared and lazily materialized);
- the companion (a tooltip anchor, the precedented shape while no `$companion` sentinel exists).

No chip points at scene fiction such as the letter, the mill contract or the hall. The hidden mark is concealed and correctly not chipped.

## 6. New Hooks Needed

None. No new role, sublocation type, state field, condition id, node type or content entry. No rule gate.

## 7. Implementation File Map

The package compiles everything standard. There are no hand edits beyond it.

| File | Action |
|---|---|
| `Docs/plans/encounters/feud-mediation.package.json` | **Create.** Fill it from `feud-mediation-final.md` (prose verbatim, wiring per § Systems wiring spec). |
| `src/data/encounters/feud-mediation.ts`, `src/data/encounters/__tests__/feud-mediation.test.ts`, registrations | Emitted by `npm run compile:encounter` (THR-1246). Do not hand-author. |
| `src/data/content-eval/plotHooks.ts` | Stamp `hook.unlikely_alliance` `usedBy` at batch closeout (brief § Rolled constraints). |
| Concept art | Per packet § 18, through the normal art step. |

No engine, type or primitive file changes.

## 8. Verdict

**READY WITH CAVEATS.**

Fixes applied inline in the final doc:

- **F1: cast reuse lists made disjoint, and `supportRole` supplied.** This was a real silent defect: both heads could bind one NPC and the failure-pair bonds would cancel.
- **F2: "Loosen A Tongue" re-typed from Whisper to Boost (witness).** Author it with **no** `reveals` and no whisper `libraryCardId`. A Whisper's only mechanism is `reveals: 'next_step_demand'`. Its effect line would then have to describe that reveal, and this card's line promises talking witnesses. The prose is unchanged. The card is mechanically a plain mind boost, which is what its line says.
- **F3: `factorLine` supplied for both trait variants, plus `addNudgeIds: ['feud.lay_grudges_down']` on Forgiving.** `factorLine` is a required field. These are two new 11- and 12-word lines, the only new prose in the final doc. Each is within `NUDGE_WORD_BUDGETS.factorLine` 12 and follows the `the-broken-seal` / `fair-bout` "Being X, they …" form.

Caveats (implementer checks, none blocking):

- **C1.** Run `check:encounter`. `checkComposedHand` must confirm three things at the live deal: ≥4 distinct spheres, ≥1 ungated common card, and coverage of the `success_at_cost` / `critical_failure` fragments by dealt members' `BAND_FRAGMENTS`. The authored specials cover crit / success / near_miss / failure only. Step 1's authored hand is a single special. If the deal falls short, raise the step's `deal.count`. Do not add a `card.boost.core` special; the brief bans it.
- **C2. The live proof.** At expert difficulty the proof's ascendant loses most runs (#1111, #1113). Take success-side evidence from a seed sweep plus a pinned band: `?spawn=encounter.town.feud_mediation&outcome=success`, then read `getOutcomePinVerdict()`. Run both the dry-run compile and `check:encounter` (#1114).
- **C3. Hidden-mark reveal reach.** `evaluateMarkReveals` reveals a mark only when its **bearer** (`$cast:accused`, normally an ambient walk-on) resolves an investigation-family template. Ambient NPCs rarely or never run decisions. So the mark is a real concealed record, queryable by `hasHiddenMark` and scoring, but seldom revealed in play.

  This matches shipped precedent (`company-drama.ts`, four cast-borne `investigation` marks). The `secret` family is independently satisfied by `favor_creation` (a live `owes_favor` edge), so the draw gate holds either way. No change.
- **C4. Path truth, a prose note for the record only.** On a `success_at_cost` run where step 0 *failed*, no hidden mark is written, yet the band overviews still have `{cast:accused}` admit the draft in private. The favour context ("kept quiet …") still fires. This is narratively covered by the private admission and is not a systems defect. The note records that the concealed mark exists only on step-0-success paths.

## 9. Primitive Disposition

No missing primitives identified.
