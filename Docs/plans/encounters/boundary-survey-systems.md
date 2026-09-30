# Encounter Pipeline: The Boundary Survey
> Scale: short | Slug: boundary-survey | Pass: systems
> Date: 2026-09-30 | Pipeline version: 2.0
> Batch: expert-everyday-2 (THR-1679), slot 1 · Template id: `encounter.town.boundary_survey`

Independent critic, cold context. Audited `boundary-survey-revised.md` (primary) against the runtime, with `boundary-survey-editorial.md` for context and `bell-tower-shoring-systems.md` / `-final.md`, `bell-tower-shoring.package.json` and `src/data/encounters/bell-tower-sequels.ts` as the shipped, live-proved appointment precedent. Every id the packet names was grepped in `src/` (verification table at the end).

**Verdict: READY WITH CAVEATS.** No missing primitives. No field-shape corrections to the packet were needed (the reward-pool shape and the missed-sequel regard write were already written in the corrected form the bell-tower Pass 3 established). The caveats are implementation-time items: hand-register the sequel file, supply the required fields the packet left unwritten (§ 21 of the final), and take live-proof evidence from a seed sweep plus pinned bands.

## 1. Support Bundle Honesty

| Object | Claim | Verified | Verdict |
|---|---|---|---|
| `steward` | lazy-materialize-on-trigger, must-persist; reuse `steward`/`noble`/`clerk`, else spawn `steward` "Edric Payne" | `LOCATION_ROLE_ROSTERS` (`src/types/npc.ts`): `steward` is seeded only at `castle` (0.9) and `noble_house` (1.0); `noble` at city/capital/castle; `clerk` at town/city. The template's single setting class is `rural` = `hamlet`, `farmland`, `mining` (`src/data/settingClasses.ts:58`), none of which seeds a steward, noble or clerk. So on every place this template can run, the steward **always spawns**. | Honest. The reuse list is harmless but never fires here; the spawn fallback is the real path. Spawn name "Edric Payne" is a free string. |
| `reeve` | reuse `elder`, else spawn `elder` "Wat Hollis" | `hamlet` seeds `elder` at 1.0; `farmland` and `mining` have no roster entry, so the reeve spawns there. | Honest. Reeve and steward draw from disjoint role lists (`elder` vs `steward`/`noble`/`clerk`), so the two roles can never bind to the same actor. |
| Persistence | must-persist for both | Steward: read after the scene by `appointment.counterpartyId`, by both sequels via `inheritContext` (the missed-branch rewrite spreads `...seed`, so `supportBindings` survive), and by the PATH chip. Reeve: read by step-1 prose, the BOON chip, and step-1 afterimages. | Honest. |
| Materialisation order | steward first named on step 0; reeve first named on step 1 | Checked every outcome field for a `{cast:reeve}` that could render on a path where step 1 never ran. The only band with a step-0 exit, `critical_failure`, carries the overview ("{location} sent for a sworn surveyor…"), the SCAR cause ("Their word for the lord") and the step-0 afterimage, none of which names the reeve. The BOON chip (which names him) sits only on success bands, all of which ran step 1. | Honest. The step-1-only cast is never referenced on a step-0 exit. |
| `supportRole` | not stated | `SupportBundleEntry.supportRole: string` is required. | Supplied in § 21 of the final: `steward` → `'steward'`, `reeve` → `'reeve'`. |

## 2. Missing Primitives

No missing primitives identified. Everything the packet leans on is live:

- **Appointment** (`encounter_seed.appointment`, THR-1479): `AppointmentBlock` (`src/types/unifiedAction.ts:1477`): `locationId` (`$here`), `counterpartyId` (`$cast:steward`), `windowTicks` optional (default `APPOINTMENT_WINDOW_TICKS` = 12, `src/data/movement-content.ts:290`), `missed: { templateId, seedLabel, delayTicks? }` (default `APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS` = 12). The missed branch is authored by `templateId`, so no `appointment_missing_branch` error.
- **Step reward pool** (possession): `successMetadata.rewardPool: RewardPoolRecipe`, written in the packet as `{ categoryWeights: { possession: 1 }, tagFilters: ['#map'] }`. This is the correct `RewardPoolRecipe` shape (`src/types/attachments.ts:232`). `#map` has six bearers in `src/data/reward-attachment-catalog.ts` (shrine map, four ruin-seeker maps, the Cartographer's Survey), each `attachmentCategory: 'possession'`, so the pool is live.
- **`intelligence`** (knowledge): `{ kind: 'intelligence', category, label, detail, reliability?, targetAgentId? }` (`unifiedAction.ts:562`). `political_secret` is a member of `IntelligenceCategory` (`unifiedAction.ts:78`). `label` and `detail` are required and the packet left them unwritten; supplied in § 21 of the final.
- **`reputation_with`**, **`bond_change`**, **`apply_condition` on a place** (`targetLocationId`): live; all accept scene sentinels.
- **Seed-only sequels** (`drawable: false`, THR-1526): live; the `town.` prefix is claimed in `src/data/content-objects.ts:190`, so `town.bounds_beaten` and `town.bounds_stone_uprooted` pass the kind narrowing with no edit.
- **Family tag `#territorial`**: seated on the `family` axis in `src/data/content-tags.ts:237` ("Of ground held, claimed, or argued over"); three bearers today (two items, one condition). `contentTags.test.ts` requires seating and non-contradiction of projections and places no per-kind limit on a family tag, so an encounter bearer is lawful and is the tag's first encounter bearer. Not a reach or sphere tag, so no projection clash.

No rejected primitive (`authoredChoices`) is used.

## 3. Runtime Feasibility

- **Beats:** two steps, short scale. Supported.
- **Branching:** linear, `branchOnStep` aftermath with `byOutcome`. Supported.
- **Outcome ladder** against `computeFinalActionOutcome` / `advanceStep` (`src/engine/unifiedActionLifecycle.ts`):
  - step 0 `continue_weakened` failure continues; a continued failure aggregates to `success_at_cost` if step 1 succeeds (the packet's at-cost path).
  - step 0 `critical_failure` forces `fail_action` (lines 205–209) and the action ends `critical_failure`. Step-0 `failureMetadata` fires; step 1 never runs.
  - step 1 `fail_action`: failure gives action `failure`; critical_failure gives action `critical_failure`.
  - step 1 `near_miss` counts as a step success (`isStepSuccess`), so `successMetadata` fires (prize, knowledge, regard, appointment) and the action aggregates to `success_at_cost`. Every success-band chip is backed on that path.
- **Open-draw difficulty cap:** eye 0.58 / 0.66 exceed `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45), but the cap binds `background` only (`nudgeHandChecklist.ts:419`). `intrinsicTier: 'shaping'` is the brief's deliberate decision. No reach gate is authored, so the forecast window (mortals engage at roughly 50–65%) is what keeps the job with Eye-competent actors. Intended for an expert template; a note, not a defect.
- **Deal tags:** `insight`, `lore`, `journey` are all members of `DealContextTag` (`unifiedAction.ts:1898`).
- **Hand shape (composed):** `deal.count: 3` (the default is `DEAL_DEFAULT_COUNT` = 4; 3 + 2 specials = composed 5, inside the 4–8 band, and the bell-tower shipped the same 3). Hand-shape, sphere-coverage and common-option checks are skipped wholesale on a composed step (`nudgeHandChecklist.ts`, `composed`); the per-special checks (failure fragment, big-delta) still run and pass (max Δ 0.12). The "ungated common" options come from the sphere-less core cards (`card.boost.core`, `card.insurance.core`, `card.mercy.core`, `card.trait_card.core`), which carry no `contextTags` and so are always dealable whatever the deal's tags. The tag filter chooses the sphere-signature cards on top; `insight` has six tagged library cards, `lore` five, `journey` three, so both deals can fill. Composed hand of four or more distinct spheres: the specials contribute life, chaos (step 0) and order, mind (step 1); the dealt signature cards add more. Confirmed by `check:encounter`, not by reading.
- **Image tags:** `generic.vigor`, `generic.luck`, `generic.oath`, `generic.memory` all present in `src/data/encounter-image-library.ts`. `generic.luck` is the chaos-sphere concept art ("a coin on edge, caught before it tips"). There is no wind or air tag in the library, so the gust in Loose The Wind is carried by the sphere-keyed image, not a literal one. Acceptable: image tags are sphere/concept keyed, the card's prose names the gust. Optional art ticket only if a literal wind image is ever wanted.
- **Motivations:** `honesty_cunning`, `tradition_novelty` are live axes (`src/types/agent.ts`).
- **Imperative lexicon:** `quicken`, `loose`, `call`, `walk` are all in `IMPERATIVE_VERB_LEXICON` (`src/data/content-eval/doctrineV2Checks.ts:94`). `loose` is **already** in the lexicon (the editor called it "new"; no lexicon edit is needed).
- **Card ids:** `bounds.quicken_the_turf`, `bounds.loose_the_wind`, `bounds.call_up_the_oath`, `bounds.walk_the_old_line` have no collision in `src/`. Template ids `encounter.town.boundary_survey`, `town.bounds_beaten`, `town.bounds_stone_uprooted` are unused.
- **Over-exposed cards (brief):** the brief's `card.compulsion.signature.mind` cap applies to specials. Walk The Old Line is an authored mind Compulsion special, not that library id, so the cap is not breached. Note: the library card carries `contextTags: ['insight', 'presence']`, so step 1's `insight` deal may draw it as a dealt card beside the authored Walk The Old Line. A dealt card is the deal's business, not an authored special, and no rule forbids it. Logged as a batch-coverage note, not a defect.

## 4. Aftermath Supportability

**Channels.** `reputation_with` on `$here` (±0.06 / −0.03 sit inside `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` = 0.15, `src/engine/reputation.ts:66`). `intelligence` (`political_secret`). `trait.condition.location.festival` (`src/data/condition-trait-content.ts:454`; its default `CONDITION_FESTIVAL_DURATION` is 36 ticks, which the kept sequel's `BOUNDS_BEATEN_FEAST_TICKS` matches; the precedents are `masons-commission.ts`, `the-beast-in-the-granary.ts`, `bell-tower-sequels.ts`). `#trade` for the kept sequel: five possession bearers (the same recipe as `town.well_first_water` and `town.bell_tower_first_peal`), so live.

**Law 56, per chip, per band.**

| Chip | Bands | Backing write | Paths checked |
|---|---|---|---|
| BOND `reputation with {location}` gain | crit_success, success, success_at_cost | step 1 `successMetadata` `reputation_with $here +0.06` | All three bands require step 1 on the success side (incl. `near_miss`). On the step-0-failure then step-1-success at-cost path the net write is +0.03 (−0.03 then +0.06); "thinks well of" is still true of a net gain. |
| BOON `knowledge` | same | step 1 `successMetadata` `intelligence` (`political_secret`) | Same paths. The chip names the reeve, who has materialised by step 1 on every such path. |
| PATH `appointment` → `$appointment` | same | step 1 `successMetadata` `encounter_seed` + `appointment` | Same paths. `$appointment` is legal because the template authors an appointment block (`chipAnchorDeclarations.ts:161`, THR-1518). |
| PRIZE (auto) | same | step 1 `successMetadata.rewardPool` | Same paths. |
| SCAR `reputation with {location}` loss (failure) | failure | step 1 `failureMetadata` `−0.06` | The failure band is reachable only by step-1 failure (step-0 failure is `continue_weakened`, so it never ends the action). Backed. |
| SCAR (critical_failure) | critical_failure | step 1 `failureMetadata −0.06` **or** step 0 `failureMetadata −0.03` | Two paths, both backed: step-1 crit (step-1 write) and step-0 crit (step-0 write; the well-sinking / bell-tower lesson, correctly applied in § 0 of the packet). |

**Prose rule 7b: every later-tense promise and its enacting effect.**

| Sentence | Where | Enacting effect | Verdict |
|---|---|---|---|
| "If {actor} cannot find the true line, {location} will think less of them." | P3 spine | step 0 `−0.03`, step 1 `−0.06` | Backed on every failing path. |
| "If the line is found, a new stone is set at this year's beating of the bounds, in three days, with the lord's steward as witness." | step-1 spine | step 1 `encounter_seed` + `appointment` (`$here`, `$cast:steward`, `missed` authored, `delayTicks: 36`) | Lawful (the appointment exception), conditional on the find, fired only on the success path. `delayTicks: 36` = three days at `TICKS_PER_DAY` = 12. |
| PATH detail "{cast:steward} witnesses it set in {location} in three days." | chip | same appointment | Lawful. |
| Kept sequel: "If the stone is set true …, the steward seals the survey and pays the lord's share of the fee." | sequel spine | kept success `rewardPool` `#trade` (the payment) and `bond_change` (the steward's regard) | Backed. "Seals the survey" is scene fiction reported by the afterimage, the bell-tower "pays the rest of the fee" shape. |
| Missed sequel: "…says the lord will not seal the survey without the surveyor's word." | sequel spine | success `bond_change` (a small mend) | A present-tense statement of the steward's position, not a later promise. The success afterimage reports a finished act ("sealed the survey without the stone") and claims **no payment**, so the bell-tower caveat 3 (never claim payment on a bond-only success) is honoured from the start. |
| Missed failure afterimage: "…thinks less of the surveyor who stayed away." | sequel afterimage | `bond_change −0.1/−0.12` and `reputation_with targetAgentId '$cast:steward' −0.04` | Backed (the bell-tower cracked-sequel shape). |

No placed promise without an appointment block. The missed sequel keeps the placeless truthful shape ("{cast:steward} has come looking for {name}", no place named).

**Missed-sequel regard write:** already correct in the revised packet: `reputation_with` **`targetAgentId: '$cast:steward'`** `−0.04`, never `$here` (which binds wherever the mortal stands when the missed branch fires). The binding works because the missed seed keeps the inherited `supportBindings`. Verified against the bell-tower Pass 3 correction (`encounterAftermath.ts` `resolveSceneHere`; no sentinel reads the missed appointment's place).

**Success-at-cost band (editor's hand-off).** The brief's band table asks for "a condition, a lean, a debt" on this band. The packet's cost is the lost day and being turned off the land once, plus (on the step-0-failure path) a net regard of +0.03 instead of +0.06. The parent deliberately puts no condition on the mortal (brief: reputation is the expert penalty). A band-keyed SAC-only effect would need a per-band predicate that `successMetadata` does not offer (step-1 `near_miss` and step-0-failure-then-success both land in the band by different routes, so any single unconditional write would also fire on the clean success). The bell-tower shipped with the same prose-carried cost and passed live proof. **Not adding an effect.** Flagged for the batch report as the judgement call it is.

## 5. Chip referents resolve

| Chip | Referent | Resolves? |
|---|---|---|
| BOND / SCAR `reputation with {location}` | `$here` → WorldRef location | Yes. Declare `visualKind: 'location'`, `tooltipId: 'ui.reputation_with'`; concept "thinks well of" / "thinks less of" with `tooltipId: 'ui.standing'` (`ui-content.ts` lines 423 / 384). |
| PATH `appointment` | `$appointment` → the place of the soonest live appointment (`owes_favor` edge) | Yes (THR-1518). Declare `visualKind: 'location'`. |
| BOON `knowledge` | `tooltipId: 'ui.knowledge'` (`ui-content.ts:446`), no `entityId` | Accepted precedent (`counting-house-dispute`, `assize-letter`, `pilots-reckoning`, `bell-tower-shoring`): the intelligence record is not a graph node; the noun is a sheet concept, not fiction. |
| PRIZE | auto chip from the step reward pool | Yes. |
| Named cast in prose | `{cast:steward}`, `{cast:reeve}` | Both are support-bundle keys. |

No chip points at a phrase-only referent.

## 6. New Hooks Needed

None in the engine. Implementation-time field completions the packet leaves unwritten (wording may be tuned in the package pass; the fields are required by the types). All are written out in **§ 21 of the final**:

- `encounter_seed.seedLabel` (kept) and `appointment.missed.seedLabel`.
- `intelligence.label` / `.detail`.
- `supportRole` for both bundle entries.
- Chip declarations (the well-sinking / bell-tower shape).
- Template `tags: ['#territorial']` and `settings: ['rural']`.
- Sequel field completion (`description`, tiers, affinities, export name).

Scope: under 20 minutes, all inside the package and the sequel file.

## 7. Implementation File Map (beyond the compiled set)

| File | Action | Notes |
|---|---|---|
| `Docs/plans/encounters/boundary-survey.package.json` | create | Compiles (`compile:encounter`, THR-1246) into `src/data/encounters/boundary-survey.ts`, its structural test and the parent's registrations. Not hand-edited. |
| `src/data/encounters/boundary-survey-sequels.ts` | create (hand-authored) | `town.bounds_beaten` + `town.bounds_stone_uprooted`, `drawable: false`, no `locationSubtypes`, `intrinsicTier: 'background'`, exported as `BOUNDARY_SURVEY_SEQUELS`. Mirror `bell-tower-sequels.ts`. Content is final § 20. |
| `src/data/unified-action-templates.ts` | modify (2 lines) | Import and spread `BOUNDARY_SURVEY_SEQUELS` beside `...BELL_TOWER_SEQUELS` (line ~5736). The sequels sit outside the compiled package, so this one registration is a hand edit (the THR-1677 / THR-1678 precedent). Without it `validateEncounterSeedRefs` reports both appointment branches as `dead_template`. |
| `src/data/content-objects.ts` | none | `town.` already claimed. |
| Generated census artifacts, action-catalog wiki page | regenerate / exempt | As batch 1's closeout did: run the census/freshness generators after the sequels land; the action catalog wiki page takes a `Wiki-freshness-exempt:` line if its `sources` glob matches (compare the THR-1678 closeout commit). |
| Engine / types / art | none | Image tags are `generic.*` library entries; § 17 concept-art direction is optional. |

## 8. Verdict

**READY WITH CAVEATS.**

Caveats (implementation-time, no pre-task ticket needed):
1. Author `boundary-survey-sequels.ts` and register it by hand (§ 7). The parent's seeds are dead without it.
2. Fill the required fields in final § 21 (seed labels, intelligence label/detail, supportRole ×2, chip declarations, tags).
3. **Live-proof evidence** (brief impediments #1111/#1113/#1118: the default live-proof run reports failure-band runs as missing success-side effects): take evidence from a **seed sweep** (several seeds through `?view=game&seeded&size=medium&spawn=encounter.town.boundary_survey`) plus **one pinned run per band** (`&outcome=critical_success|success|success_at_cost|failure|critical_failure`), reading `await window.__DEBUG.getOutcomePinVerdict()` before trusting a band (`band_rendered` only). Also run `check:encounter` and the dry-run compile; the dry-run misses the gates `check:encounter` runs (#1114). For the appointment: prove the kept branch (mortal on the hex in the window → `town.bounds_beaten`, festival on the village) and the missed branch (mortal elsewhere → `town.bounds_stone_uprooted`, steward-targeted regard write, never a `$here` write).
4. *Note, not a defect:* `intrinsicTier: 'shaping'` is deliberate; the 0.45 open-draw cap binds `background` only.
5. *Note:* step-1 deal tag `insight` can also draw the library `card.compulsion.signature.mind` as a dealt card (see § 3); watch the batch coverage audit.

## 9. Primitive Disposition

No missing primitives identified.

## Verification table (ids grepped in `src/`)

| Id / shape | Location | Result |
|---|---|---|
| `RewardPoolRecipe` `{ categoryWeights, tagFilters? }` | `src/types/attachments.ts:232` | Confirmed; packet shape already correct |
| `#map` → possession items (six) | `src/data/reward-attachment-catalog.ts` (1823, 3776, 3797, 3818, 3839, 3861; Cartographer's Survey ~3811) | Live |
| `#trade` → possession items (five) | content-tag catalog | Live |
| `#territorial` (family axis, three bearers) | `src/data/content-tags.ts:237` | Seated; encounter bearer lawful |
| `IntelligenceCategory` `political_secret` | `src/types/unifiedAction.ts:78` | Live |
| `intelligence` effect `{ category, label, detail, reliability?, targetAgentId? }` | `unifiedAction.ts:562` | Matches |
| `trait.condition.location.festival` | `src/data/condition-trait-content.ts:454` | Live |
| `encounter_seed.appointment` `AppointmentBlock` | `unifiedAction.ts:518, 1477` | Matches; missed branch present |
| `APPOINTMENT_WINDOW_TICKS` = 12 / `APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS` = 12 | `src/data/movement-content.ts:290, 334` | Defaults |
| `TICKS_PER_DAY` = 12 (so `delayTicks: 36` = three days) | `src/data/attention-constants.ts:14` | Confirmed |
| `$appointment` anchor | `src/data/content-eval/chipAnchorDeclarations.ts:161` (THR-1518) | Live; needs an appointment block, which the template has |
| `ui.knowledge` / `ui.reputation_with` / `ui.standing` | `src/data/ui-content.ts:446 / 423 / 384` | All present |
| `generic.vigor` / `generic.luck` / `generic.oath` / `generic.memory` | `src/data/encounter-image-library.ts` (631, 632, 636, 640) | All present |
| `quicken` / `loose` / `call` / `walk` | `IMPERATIVE_VERB_LEXICON`, `doctrineV2Checks.ts:94` | All present (`loose` already) |
| `DealContextTag` `insight` / `lore` / `journey` | `unifiedAction.ts:1898` | All members |
| Core cards carry no `contextTags` (always dealable commons) | `src/data/nudge-card-library.ts:847–870` | Confirmed |
| `StepFailBehavior` `continue_weakened` / `fail_action` | `unifiedAction.ts:42` | Live |
| step-0 `critical_failure` forces action fail | `unifiedActionLifecycle.ts:205–209` | Confirmed |
| npc roles `steward`, `elder`, `clerk`, `noble` | `src/types/npc.ts`; rosters 217, 235, 253, 331, 378 | Valid; rural rosters as § 1 |
| rural = hamlet, farmland, mining | `src/data/settingClasses.ts:58` | Confirmed |
| `town.` id prefix claimed | `src/data/content-objects.ts:190` | Confirmed |
| `BELL_TOWER_SEQUELS` hand registration | `src/data/unified-action-templates.ts:246, 5736` | Precedent to mirror |
| `encounter.town.boundary_survey`, `town.bounds_beaten`, `town.bounds_stone_uprooted`, `bounds.*` card ids | `src/` | Not present; no collision |
| `motivations` `honesty_cunning`, `tradition_novelty` | `src/types/agent.ts:12–13` | Live |
| `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` = 0.15 | `src/engine/reputation.ts:66` | Deltas inside cap |
