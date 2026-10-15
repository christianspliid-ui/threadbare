# Encounter Pipeline: The Bloodletting Hour
> Scale: medium | Slug: bloodletting-hour | Pass: systems
> Date: 2026-10-15 | Pipeline version: 3.0 | Batch: master-everyday-3 (THR-1840), slot 6

Audited: `bloodletting-hour-revised.md` against the gated `bloodletting-hour.package.json` (authoritative), `src/types/unifiedAction.ts`, `src/data/ui-content.ts`, and `npm run -s draw:consequences -- encounter.town.bloodletting_hour --reach star --rarity 2`. Gate: `node .cache/check-encounter-batch3.mjs --package Docs/plans/encounters/bloodletting-hour.package.json` prints OK. No package change was needed.

## 1. Support Bundle Honesty

| Object | Delivery | Verdict |
|---|---|---|
| `physician` (healer, "Anselm Crewe") | lazy-materialize-on-trigger, must-persist, `reuseNpcRoles: [healer]` | Realistic. Reuse-or-spawn is the standard path; `must-persist` is needed because the hidden mark and two bond_change reactions land on him after the scene. |
| `bishop` (priest, "Walter Hamond") | lazy-materialize-on-trigger, must-persist | Realistic. He is the `favor_creation` debtor and a bond_change target; both need a persistent agent node. |

Both keys are used as `$cast:physician` / `$cast:bishop` everywhere and nowhere else; no unbound sentinel. No claim of persistence beyond what the bundle delivers.

## 2. Missing Primitives

None. Test and consequence is carried by `carryoverFactorLines` on step 1 (live). `failBehavior` `continue_weakened` then `fail_action` is live. No flip/reveal state, task carrier, or interception is claimed. No `authoredChoices` (rejected primitive) is used; the reactions are ordinary aftermath reactions. No branching, no `encounter_seed`, no `appointment`.

## 3. Runtime Feasibility

Two steps, linear, branch count 0, `aftermathConfig.branchOnStep: 0` with an empty `variants` and a `byOutcome` fallback keyed on all five bands. The step-0 `critical_failure` ends the action (no carryover row for it, as designed). All five bands have overview, and the prose for each step carries the five afterimages. Supported.

## 4. Aftermath Supportability

Effect kinds and fields, each resolved in `src/types/unifiedAction.ts`:

| Package effect | Type site | Result |
|---|---|---|
| `reputation_with` (`targetLocationId: $here`, `delta`) | line 1199; delta capped per outcome; ±0.06 / −0.03 within the cap (gate green) | resolves |
| `intelligence` (`category: political_secret`, `label`, `detail`, `reliability`, `targetAgentId: $actor`) | line 562 | resolves |
| `favor_creation` (`magnitudeRange`, `context`, `debtorAgentId: $cast:bishop`) | line 1147; the authoring gate requires `debtorAgentId`, present | resolves |
| `hidden_mark` (`category: concealed_action`, `severity`, `label`, `targetAgentId: $cast:physician`) | line 552 | resolves |
| `bond_change` (`withAgentId: $cast:*`, `sentimentDelta`, `trustDelta`) in reactions | line 1359; `$cast:` rebinds via support bindings in `bindAftermathSceneTargets` | resolves |

**Consequence hand** (printed: knowledge, secret; star, rarity 2): knowledge wired as `intelligence` (printed set: intelligence, spawn_clue, sharpen_clue); secret wired as `favor_creation` and `hidden_mark` (printed set: hidden_mark, secret_discovery, favor_creation). Only printed kinds are used; no swap recorded or needed.

**Law 56 (chips are state-backed).**

| Band | Chips | Backing effect on that band |
|---|---|---|
| critical_success, success, success_at_cost | reputation gain, favour owed, knowledge | step 1 `successMetadata`: `reputation_with` +0.06, `favor_creation`, `intelligence` (success_at_cost is a success-side band and fires successMetadata) |
| failure | reputation scar | step 1 `failureMetadata` `reputation_with` −0.06 (and step 0 failure −0.03 if the route went through it) |
| critical_failure | reputation scar | step 1 `failureMetadata` −0.06, or step 0 `failureMetadata` −0.03 when the action ended at step 0 |

The physician's `hidden_mark` is unchipped by design (hidden), so there is no chip without an effect and no effect needing a chip. The brief's known gap (the mark fires on a step-1 critical failure but not on a step-0 one) is why no chip claims it. Reaction bond_change targets are both cast keys that exist in the bundle.

**Later-tense promises (rule 7b).** The only forward-looking prose is "the household will ask {actor} for the hour of every bleeding", "the palace will not send for them again", and the reaction `intent` sentences ("He thinks better of the mortal", "will remember" style). The first two are aftermath overview colour for outcomes the standing change enacts (`reputation_with`), not obligations on the mortal: no place-and-time promise exists, so no `appointment` is owed. The reaction intents each name the `bond_change` that performs them. No `encounter_seed` is promised.

## 5. Chip referents resolve

| Chip | Referent | Status |
|---|---|---|
| reputation (all bands) | `entityId: $here`, `visualKind: location`, tooltip `ui.reputation_with`; concept tooltip `ui.standing` | `$here` resolves to the town; both tooltips exist (`ui.reputation_with`, `ui.standing` used by shipped encounters; `chipStateNounWording` test green via the gate) |
| favour owed | stateNoun tooltip `ui.favour_owed` (defined at `src/data/ui-content.ts:595`); concept `$cast:bishop`, `visualKind: agent` | sentinel binds to the bundle key |
| knowledge | tooltip `ui.knowledge` (`ui-content.ts:637`), concept tooltip `ui.knowledge` | exists; the intelligence effect on `$actor` backs it |

No chip points at free-text fiction.

## 6. New Hooks Needed

None. No new roles (healer and priest exist), sublocation types, state fields or content entries. No new tooltips, no new tags.

## 7. Implementation File Map

Beyond the compiled set: nothing to hand-edit.
- Compiled by `compile:encounter` from `Docs/plans/encounters/bloodletting-hour.package.json`: the encounter module, its structural test, both registrations.
- Art: one image per nudge uses existing `imageTag`s (`generic.memory`, `generic.focus`, `generic.matter`, `generic.warmth`); no new art keys. Optional concept art per the revised packet's art direction (no people).
- Wiki/UL: no new terms.

## 8. Wording check: "the mortal" in reaction `intent`

Acceptable. The same wording ("The mortal walks the youth to his mother's door...", "The mortal tells the crowd...") is the shipped convention in the sibling packages (`gallows-pardon`, `tannery-fire`, `wool-staple`, `inheritance-wake`, `toll-gate-writ` and others; 86 occurrences across 15 packages). The reaction card is the god's view of the player's agent, so the mortal is the agreed noun. No change made.

## 9. Verdict

**READY FOR IMPLEMENTATION**

## 10. Primitive Disposition

No missing primitives identified.
