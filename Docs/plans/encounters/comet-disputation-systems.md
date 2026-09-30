# Encounter Pipeline: The Comet Disputation
> Scale: short | Slug: comet-disputation | Pass: systems
> Date: 2026-09-30 | Pipeline version: 3.0 (Factory) | Batch: expert-everyday-1, slot 4 (THR-1678)

**Verdict: READY WITH CAVEATS.** No missing primitives. Three systems corrections are applied in `comet-disputation-final.md`:

1. The ambition id changes to `ambition_uncover_secrets`, because the old id fails `check:encounter`.
2. A step-0 `failureMetadata` debit is added, because the step-0 critical_failure path wrote nothing.
3. The compulsion chip is removed from both `critical_failure` bands, because that path cannot back it.

The caveats are listed in § 8.

---

## 1. Support Bundle Honesty

- **`champion`** is delivered `lazy-materialize-on-trigger` and must persist. It reuses `sage` / `scholar` / `oracle`, and otherwise spawns a `sage` named "Maudry Fenn". All three roles are in the `NpcRole` union (`src/types/npc.ts:43` scholar, `:86` sage, `:92` oracle). Reuse odds by class, from `LOCATION_ROLE_ROSTERS` (`src/types/npc.ts:214`):
  - **town**: only `sage`, at 0.4 (`:238`). A town without a sage spawns one. That is honest, because the college's first reader is a learned person the town has.
  - **city**: scholar 0.8 (`:252`), sage 0.5 (`:261`), oracle 0.3 (`:264`).
  - **capital**: scholar 0.9 (`:277`), sage 0.6 (`:287`), oracle 0.4 (`:304`).

  `{cast:champion}` is named in the step-0 spine, so the champion is materialised before step 1's `successMetadata` names them as `favor_creation.debtorAgentId`. This follows the fair-bout precedent, where the backer is named before the metadata names them. Because the actor is an explicit must-persist support spec, `castTargetViolations` and `validateFavorDebtors` (`nudgeGrantLiveness.ts:683`) are both satisfied.
- **`$here`** resolves to the actor's `located_at`, walked up to the Location tier. Step-metadata effects dispatch through `applyEncounterAftermathReaction` (`unifiedActionResolution.ts:1261`, THR-783), so `$here` binds on this path. This is the same route `cunning-fair` and `well-sinking` use.
- **Scene-local objects** are the college, the council, the doctrine and the champion's chart. None of them is claimed as a node and no chip points at any of them. That is honest.

## 2. Missing Primitives

**No missing primitives identified.** The primitives the encounter uses are all live:

- **`ActionStepBranch.decidedBy: { axis: 'revelation_discretion' }`** (THR-894). The branch is decided in `applyAgentDecidedBranches` (`branchDecision.ts:364`), which `unifiedActionResolution.ts:2335` calls **before** `advanceStep`. The axis is in the `ValuePair` union (`src/types/agent.ts:15`).
- **`BranchAwareAftermathConfig`** with per-arm `byOutcome`. It resolves through `resolveAftermathVariant` (`src/types/unifiedAction.ts:2345`).
- **Step-outcome effects** (THR-783), on both fork arms. The effect kinds are:
  - `reputation_with.targetLocationId` (`unifiedAction.ts:1176`)
  - `assign_ambition` (`:699`)
  - `favor_creation` (`:1124`)
  - `plant_compulsion` (`:843`)
- **`poleLean`** on the two step-0 specials. They are summed by `sumHandLean(resolvedStep.nudges, action.activeNudges, axis)` (`branchDecision.ts:400`).

The draft does not use the rejected `authoredChoices` primitive.

## 3. Runtime Feasibility

The encounter has two steps.

- **Step 0**: star 0.58, `continue_weakened`.
- **Step 1**: a fork. Both arms are star 0.68 and `fail_action`. The fallback is a copy of the Sentinel (`negative`) arm.

The expert window and the `shaping` tier rationale are in the brief. `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45) binds `background` templates only.

**Carry-forward (c): what renders when step 0 critically fails. This is resolved from engine code, and it corrects the revised file's claim.**

1. The fork key **is** recorded. `applyAgentDecidedBranches` runs on every step-0 resolution, whatever the band (`unifiedActionResolution.ts:2331–2337`). It writes the chosen pole through `recordDecidedChoice` (`branchDecision.ts:429`). Only afterwards does `advanceStep` run.
2. The action then ends. `advanceStep` forces the action to `critical_failure` on any step-level critical_failure, whatever the step's `failBehavior` (`unifiedActionLifecycle.ts:205–216`). Step 1 never runs.
3. The aftermath renders the **recorded arm's** `critical_failure` band. `resolveAftermathVariant` looks up `choiceHistory` at `branchOnStep: 0` and uses `variants[pole]` (`unifiedAction.ts:2350–2354`). It does not fall back to Sentinel. The revised file's note ("the fallback (= negative arm)") is therefore inexact: either arm's critical_failure can render on this path.

**Prose truth on that path.** I read both overviews after the step-0 crit-fail afterimage ("In the dark {actor} got the comet's path wrong, and found the mistake too late to fix."):

- **Seeker**: "The gates are shut, the spring fair is called off, and the council thanked the college before the whole square." True. It makes no claim about the chart.
- **Sentinel**: "…{cast:champion}'s own chart showed the comet leaving, and it went back to the college unread." True. The chart exists in the scene, and on this path nobody read it.

Both are true on both paths, so no prose change is needed. The § 13 parenthetical in the final file is corrected to say "the recorded arm's band" instead of "the fallback".

**Side effect, noted and not a defect.** On a step-0 crit-fail the mortal still takes `driftTowardPole` on `revelation_discretion`, even though no disputation took place. This is engine-standard for every `decidedBy` fork.

**Path finding (fixed): the crit-fail band was unbacked on the step-0 path.**
- In the revised file, every failure-side write sits on step 1's `failureMetadata`. Step 0 authors no effects.
- So on the step-0 critical_failure path the engine writes **nothing**, and both critical_failure chips (SCAR reputation, SCAR compulsion) claim state that never changed.
- The Law 56 gate cannot see this, because it is a per-face floor. `stepBackingForFace` (`compositionContract.ts:540`) credits step 1's failure writes to every failure face.
- This is the same finding `well-sinking-systems.md` § 3 recorded. **The fix follows that precedent (and `crowns-reckoning`'s):**
  - **Step 0 gains `failureMetadata: [reputation_with $here −0.03]`.** The failure fires on `failure` and `critical_failure` only, because `isStepSuccess` counts `near_miss` as success (`unifiedActionResolution.ts:1178`).
  - **The SCAR compulsion chip is removed from both arms' `critical_failure` bands.** Nothing plants a compulsion on the step-0 crit-fail path. Adding `plant_compulsion` to step 0 would instead plant it on the step-0-failure-then-win path, where "restless because they lost" is false.
  - On the step-1 crit-fail path the compulsion is still written, but not chipped. It remains inspectable on the sheet. That is lawful: Law 56 constrains chips that claim state, not writes that go unchipped.

Every path, checked against the net standing each one writes (Seeker / Sentinel):

| Path (step 0 → step 1) | Action band | Standing written | Other writes | Chips true? |
|---|---|---|---|---|
| success / crit → success | success / critical_success | +0.08 / +0.05 | ambition; Sentinel: favour | yes |
| success → near_miss | success_at_cost | +0.08 / +0.05 | same | yes |
| failure → success / near_miss / crit | success_at_cost | +0.05 / +0.02 | same | yes (BOND "thinks better": net gain) |
| any non-crit → failure | failure | −0.06, or −0.09 if step 0 failed | compulsion | yes |
| any non-crit → critical_failure | critical_failure | −0.06 / −0.09 | compulsion (unchipped) | yes |
| **critical_failure (step 1 never runs)** | critical_failure | −0.03 | none | yes, after the fix |

## 4. Aftermath Supportability

**(a) Ambition liveness.**
- `ambition_chase_the_wonder` is defined at `src/data/ambition-templates.ts:1751`. That is inside `EVENT_MINTED_AMBITION_TEMPLATES` (`:1455`), not `AMBITION_TEMPLATES` (`:107–1367`).
- At runtime it would resolve, because `assignAmbitionToActor` → `findAmbitionTemplateById` searches all pools (`ambitionAssignment.ts:117`).
- **The gate still rejects it, so there is no doubt.** `check:encounter` runs `validateNudgeGrantRefs([template])` as its liveness block (`scripts/check-encounter.ts:264`). That sweep iterates `allTemplateEffects`, which explicitly walks `step.successMetadata.effects` / `failureMetadata.effects` on every runnable step, branch arms included (`nudgeGrantLiveness.ts:394–404`), as well as aftermath reactions. It checks `assign_ambition.templateId` against `new Set(AMBITION_TEMPLATES.map(t => t.id))` only (`:95`, `:126`). The old id would fail as `dead` at `step[1].positive.successMetadata`.
- **Switched to `ambition_uncover_secrets`** ("Uncover Ancient Secrets", `ambition-templates.ts:678`, inside `AMBITION_TEMPLATES`). It already ships in `the-drowned-archive.ts:286` and `the-broken-seal.ts:611`. It fits: the mortal has just seen that the college's own chart contradicts its doctrine, and now wants to know what else the learned keep to themselves.
- `assignAmbitionToActor` applies no reach floors, so a star expert takes it even though its floors are eye/veil.
- The chip detail is now "{actor} is pursuing Uncover Ancient Secrets now.", with concept `Uncover Ancient Secrets` → `ui.ambition`. This is the drowned-mans-testimony shape.

**(b) Favour chip shape.** It follows fair-bout exactly:
- `kind: 'shell_state'`, `category: 'bond'`, `stateNoun: { text: 'a favour owed', tooltipId: 'ui.favour_owed' }` with **no** `entityId`.
- The person goes in `concepts: [{ text: '{cast:champion}', entityId: '$cast:champion', visualKind: 'agent' }]`.

This clears `chipStateNounWordingViolations` (`compositionContract.ts:902`), which rejects `$actor` / `$target` / `$cast:*` on the noun (`:951–958`). "a favour owed" is 3 words, equal to `CHIP_STATE_NOUN_MAX_WORDS` (3, `nudgeAuthoringConstants.ts:452`). The backing write is `favor_creation { magnitudeRange: [0.15, 0.3], debtorAgentId: '$cast:champion' }` in the Sentinel arm's and fallback's `successMetadata`.

**(d) success_at_cost pays the same as success.**
- There is no band-keyed write channel. Step metadata is keyed by half (success or failure), not by band.
- `EffectPredicate` (`src/types/effects.ts:65`) has no outcome-band predicate.
- Aftermath bands carry only reactions, and this encounter authors none.

**Decision: leave it, with the cost carried in prose plus the one lawful write the § 3 fix already provides.**
- A success_at_cost reached through a failed step 0 now nets a smaller standing gain (+0.05 / +0.02 instead of +0.08 / +0.05).
- A success_at_cost reached through a step-1 near_miss pays in full. Its cost is the prose: "{cast:champion} left the square without a word" / "knowing {actor} had held back".
- Every run also writes the pole drift, which is the brief's "a lean".
- I rejected a condition on `$actor`: none fits, and the brief discourages it.

**(e) Reference checks.**

| Ref | Status | Evidence |
|---|---|---|
| `ui.ambition` | live | `src/data/ui-content.ts:475` |
| `ui.compulsion` | live | `ui-content.ts:469` |
| `ui.favour_owed` | live | `ui-content.ts:404` |
| `ui.reputation_with` | live | `ui-content.ts:423` |
| `ui.standing` | live | `ui-content.ts:384` |
| `generic.light` | live | `src/data/encounter-image-library.ts:629` |
| `generic.focus` | live | `encounter-image-library.ts:628` |
| `generic.crowd` | live | `encounter-image-library.ts:678` (situational nudge art: "a council, a testimony") |
| `generic.rumor` | live | `encounter-image-library.ts:638` |
| `trait.personality.star.virtue` (Guiding) | live | built by `personalityTraitId` (`src/data/personality-trait-content.ts:110`) over the canonical axes; `star` entry at `:102`; already read at `choice-set-catalog.ts:272` |
| `trait.core.core_humility.vice` (Proud) | live | `core-trait-content.ts:58` (`core_humility`), built at `:72`; shipped in `fair-bout.ts:370`, `pilots-reckoning.ts:376` |
| NPC roles | see § 1 | town: sage only; city/capital: all three |
| `encounterBias.explore` | live | `EncounterType` union, `src/types/encounter.ts:29` |
| `revelation_discretion`, `tradition_novelty` | live | `src/types/agent.ts:15`, `:13` |
| spheres light, time, order, chaos, mind | live | `src/types/index.ts` `SPHERE_NAMES` (Foundation + Creation) |
| deal tags `lore`, `journey`, `social`, `presence` | live | `DealContextTag`, `unifiedAction.ts:1898–1910` |
| `ambition_uncover_secrets` | live, gate-passing | `ambition-templates.ts:678` in `AMBITION_TEMPLATES` |

**(f) THR-1685.** No chip about a person uses the `reputation with {target}` noun.
- Both standing chips read `reputation with {location}`, anchored `$here` with `visualKind: 'location'`. They are about the town, which is what the prose means. This is the cunning-fair precedent (`cunning-fair.package.json:271`).
- The only chip that names a person is the favour. Its noun is `a favour owed`, with the person in `concepts`.
- There is no `bond_change` chip.

**Rule 7b / THR-1479 sweep (every later-tense sentence).**

| Sentence | Path | Enacting effect |
|---|---|---|
| P3 "The council will follow the winner, and the loser's name as a star-reader will suffer." | all | A statement of the stake, paid in the same action: the council rules in the band overview, and the name is `reputation_with $here` ± on every path (including the new step-0 debit) |
| PATH "{actor} is pursuing Uncover Ancient Secrets now." | success bands | `assign_ambition` in both arms' `successMetadata` (present state, not a promise) |
| SCAR "{actor} is restless to explore for a while." | failure band | `plant_compulsion { explore: 0.5 }`, 96 ticks, in both arms' `failureMetadata` |
| "The gates stay open for the fair" / "the spring fair is called off" | overviews | Present-tense rulings (editorial); no later event is promised |

No placed-and-timed promise exists. No appointment is needed.

## 5. Chip referents and Law 56 backing: per chip, per band, per arm

"S1±" means step 1 of that arm, success or failure half. "S0−" means the new step-0 `failureMetadata`.

**Seeker (`positive`)**

| Band | Chip | Anchor | Backing write |
|---|---|---|---|
| critical_success | BOND · reputation with {location} | `$here` / `ui.reputation_with`; concept "thinks better of" → `ui.standing` | S1+ `reputation_with $here +0.08` |
| critical_success | PATH · ambition | `ui.ambition`; concept "Uncover Ancient Secrets" | S1+ `assign_ambition ambition_uncover_secrets` |
| success | same two | same | same |
| success_at_cost | same two | same | same (net +0.05 when S0 failed) |
| failure | SCAR · reputation with {location} | `$here`; concept "trusts" → `ui.standing` | S1− `reputation_with −0.06` (+ S0− −0.03 if step 0 failed) |
| failure | SCAR · compulsion | `ui.compulsion`; concept "restless to explore" | S1− `plant_compulsion` |
| critical_failure | SCAR · reputation with {location} | `$here` | S1− −0.06 **or** S0− −0.03 (step-0 crit path) |
| critical_failure | ~~SCAR · compulsion~~ | removed | would be unbacked on the step-0 crit path (§ 3) |

**Sentinel (`negative`; the `fallback` is identical)**

| Band | Chip | Anchor | Backing write |
|---|---|---|---|
| critical_success | BOND · reputation with {location} | `$here` | S1+ `reputation_with +0.05` |
| critical_success | BOND · a favour owed | `ui.favour_owed`; concept `{cast:champion}` → `$cast:champion` | S1+ `favor_creation`, debtor `$cast:champion` |
| critical_success | PATH · ambition | `ui.ambition` | S1+ `assign_ambition` |
| success | same three | same | same |
| success_at_cost | same three | same | same (net +0.02 when S0 failed) |
| failure | SCAR · reputation, SCAR · compulsion | as Seeker | S1− −0.06 (+S0−), S1− `plant_compulsion` |
| critical_failure | SCAR · reputation with {location} | `$here` | S1− −0.06 or S0− −0.03 |
| critical_failure | ~~SCAR · compulsion~~ | removed | § 3 |

**Base (arm-level) faces.** Each arm authors all five bands in `byOutcome`, so the base face is reached only if a band is missing. Author each variant's base `changes: []` so that no unbacked chip leaks.

**Known runtime limitation (corpus-wide, not a template defect).** `assignAmbitionToActor` refuses with `no_free_slot` when the actor already holds `MAX_ACTIVE_AMBITIONS` (2, `ambitionAssignment.ts:45`), and it never evicts. `the-broken-seal.ts:30` measured this refusal at about 21% of actors in a mature world. On that path the PATH · ambition chip claims an assignment that did not land. The same limitation applies to `the-drowned-archive`, `the-broken-seal` and slot 6 of this batch. Carry it as a caveat, not a block.

## 6. New Hooks Needed

None.

## 7. Implementation File Map

The only content file is the package: `Docs/plans/encounters/comet-disputation.package.json` → `compile:encounter` (THR-1246) produces the module, its structural test and both registrations. Do not hand-edit those.

- **The package must be regenerated from `comet-disputation-final.md`.** The existing `comet-disputation.package.json` is a 4 KB draft-stage stub. It carries pre-editorial prose (Part The Clouds "until dawn" / "cloud rolled in from the west") and placeholder `narrativeTemplates` (`"x"`). It must not be compiled as is.
- **Fields the packet does not author, which the package must carry** (the full list is in the final file § 19):
  - `TraitVariant.factorLine` is a **required** field (`unifiedAction.ts:1835`, ≤12 words, `nudgeAuthoringConstants.ts:265`). The final file proposes two lines for the orchestrator or editor to confirm.
  - `narrativeTemplates.initiation / success / failure` is required (`unifiedAction.ts:2692`). The orchestrator authors these from the packet's crux.
  - `purposeLine` per step.
- **At closeout**, stamp `hook.underground_city` `usedBy` in `src/data/content-eval/plotHooks.ts` (brief § Rolled constraints).
- No engine, type, UI or art files change.

## 8. Verdict

**READY WITH CAVEATS.**

1. **Package regeneration.** The stub `comet-disputation.package.json` is stale. Compile from the final file, then run both `compile:encounter` (dry run) and `check:encounter` (impediment #1114).
2. **Two `TraitVariant.factorLine`s are required.** The final file's lines are systems proposals; the editor or orchestrator must confirm the wording.
3. **Ambition `no_free_slot` (corpus-wide).** The PATH · ambition chip can claim an unlanded write for about 21% of mortals. This is engine-side and matches the precedents.
4. **Batch variance.** Slot 6 (`drowned-mans-testimony`) also lands `ambition_uncover_secrets` and an `explore` compulsion (`drowned-mans-testimony.package.json:55`). Both drive hands now resolve to the same ambition. There is no gate problem. The batch report should note it, or pick a different ambition for one slot. The only other live `AMBITION_TEMPLATES` fit is `ambition_arcane_enlightenment` (star 0.3). `ambition_fulfill_destiny` (star 0.8) sits in the event-minted pool and would fail the same gate.
5. **Live proof.** At expert difficulty the proof's ascendant loses most runs (#1111/#1113). Take the evidence from a seed sweep plus pinned bands, including `?outcome=critical_failure` together with a step-0 crit-fail, to observe the new S0− debit.

## 9. Primitive Disposition

No missing primitives identified.
