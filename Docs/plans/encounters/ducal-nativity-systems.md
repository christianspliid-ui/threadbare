# Encounter Pipeline: The Duke's Nativity
> Scale: short (local) | Slug: ducal-nativity | Pass: systems
> Date: 2026-10-05 | Pipeline version: 2.0 (Factory v3 batch master-everyday, slot 6, THR-1688)

Audited input: `Docs/plans/encounters/ducal-nativity-revised.md` (editorial PASS WITH REVISIONS; notes in `ducal-nativity-editorial.md`). Binding row: `Docs/plans/encounters/master-everyday-brief.md` slot 6. Hand re-drawn live: `node .cache/draw-consequences.mjs encounter.town.ducal_nativity --reach star --rarity 2` → **drive** (`assign_ambition` / `plant_compulsion`) + **place** (`apply_condition` / `condition_attachment` / `spawn_unique_location` / `remove_condition`, with `targetLocationId`). The design wires `assign_ambition` and `apply_condition … targetLocationId: '$here'`. Both families are honoured and there is no swap.

**Verdict: READY WITH CAVEATS.** Four systems fixes are folded into `ducal-nativity-final.md`. Each is a wiring correction, and none needs a new primitive. Four corpus-wide caveats remain, each with a shipped precedent.

---

## 1. Support Bundle Honesty

| Object | Claim | Verdict |
|---|---|---|
| `duke` actor | lazy-materialize, reuse `noble` / spawn `noble` "Aldric Varre", must-persist | **Honest.** `noble` is a live `NpcRole` (shipped spawn precedent at `src/data/encounters/*`). must-persist is needed because the duke is the `favor_creation` debtor. Only the positive arm names him; on the negative arm he is bound and never shown, which is harmless. |
| `astrologer` actor | reuse `sage`/`scholar`, spawn `sage` "Mabry Holt", must-persist | **Honest.** Same shape as `comet-disputation`'s `champion`. She is named on the negative spine and in both arms' overviews. The cast id must be exactly `astrologer`, because `nativity.trip_the_flatterer.opposes` keys on it. |
| `plague_scare` on `$here` | 48 ticks | **Corrected.** `CONDITION_PLAGUE_SCARE_DURATION = 168` (`src/data/condition-trait-content.ts:129`, 14 game days). `apply_condition`'s field is `durationTicks`, and when it is omitted the runtime uses the `CONDITION_DURATIONS` term (THR-1697). The 48 was an unexplained magic number (NFP #1). **Fix: omit `durationTicks` so the named constant owns the term.** `intensity: 0.6` is kept. It is stored on the edge and no current location-condition reader scales by it, so it is cosmetic. The mechanical reader is `LOCATION_AVOIDED_MULTIPLIER` (×1.6 movement tax), which matches the chip's "travellers go around it". |
| `ambition_fulfill_destiny` | "AMBITION_TEMPLATES member" | **Claim false, effect still legal.** The template sits in `EVENT_MINTED_AMBITION_TEMPLATES` (`src/data/ambition-templates.ts`, `DESTINY_AMBITION_TEMPLATE`, wonder class, THR-1298), not `AMBITION_TEMPLATES`. Since THR-1703, `assignAmbitionToActor` resolves through `findAmbitionTemplateById` across all three pools, and the grant-liveness index (`nudgeGrantLiveness.ts` `buildLiveIndex`) admits all three, so an `assign_ambition` step effect naming it is live. (The stricter `validateLibraryGrantRefs` rule binds only library-card `grants`. This encounter puts no grant on a card.) Display name: **Fulfill the Destiny**. Its pole affinities include `courage_prudence` virtue, which fits the courage arm. |

## 2. Missing Primitives

None.
- **Test shaping:** carryover factor lines (`carryoverFactorLines`, THR-892) are live and keyed on `StepOutcome`.
- **Flip/reveal, task carriers, interception:** not used.
- **Authored choice bundles:** none. The fork is `ActionStepBranch.decidedBy: { axis: 'courage_prudence' }` (THR-894, live). The rejected `authoredChoices` is not used.
- **Agent-decided branch on a terminal step 0:** `applyAgentDecidedBranches` runs at `unifiedActionResolution.ts:2411`, before `advanceStep`, with no outcome gate. So a step-0 critical failure still records the pole in `choiceHistory`.

## 3. Runtime Feasibility

- **Beat count:** 2 steps (step 0 plus a branch step). Supported.
- **Branching:** a `decidedBy` pole fork with a `fallback` equal to the negative arm. Supported, and the shape matches `comet-disputation`.
- **Outcome ladder: FIX REQUIRED.** The revised file never states the step-1 `failBehavior`. In `computeFinalActionOutcome` (`unifiedActionLifecycle.ts:344`), any failure on a `continue_weakened` step aggregates to `success_at_cost`. A `continue_weakened` step 1 would therefore turn every plain step-1 failure into a `success_at_cost` page: success chips over a failure that wrote a Plague Scare and a reputation loss, and the `failure` band could never be reached. **Fix: `failBehavior: 'fail_action'` on both arms and on the step fallback** (comet precedent). Step 0 stays `continue_weakened`.
- **Resulting route table** (verified against `advanceStep` / `terminalActionOutcome`):

| Action outcome | Routes | Effects that fire |
|---|---|---|
| critical_success | a clean run with at least one crit | step-1 success metadata |
| success | a clean run | step-1 success metadata |
| success_at_cost | step 0 failure / success_at_cost / near_miss, then a step-1 success; **or** step-1 near_miss / success_at_cost | step-1 success metadata (+ step-0 −0.03 when step 0 failed) |
| failure | step-1 plain failure (`fail_action`) | step-1 failure metadata (+ step-0 −0.03 if step 0 failed) |
| critical_failure | **(a)** step-0 crit fail ends the action · **(b)** step-1 crit fail | (a) step-0 −0.03 only · (b) step-1 failure metadata (+ step-0 −0.03 if failed) |

- **Note:** `isStepSuccess` counts `near_miss` as a success, so `successMetadata` fires on a step-1 near_miss and its page (success_at_cost) is backed.
- **Hand rules** (package validator): step 0 and the positive arm each have 2 specials plus deal 4. The negative arm and the fallback are deal-only 4, as in `debt-arbitration`'s watcher arm. Every special has a failure-band fragment. No card has Δ ≥ 0.15. They share the id prefix `nativity.` and there is no rider.
- **`libraryCardId`:** none on any special. Binding one gates the card behind the god's unlocked repertoire (`apotheosis-ascension.ts` note; `debt-arbitration` precedent "No libraryCardId bound"). The library type is named in a code comment instead. This also avoids two sphere mismatches with the library signatures: library Whisper is `light` while Counsel Caution is `mind`, and library Omen is `time` while Light the Sign is `light`. The brief's "Kindled Ambition at most once" is met by type, on Kindle Duty only.
- **Trait variant:** `trait.core.core_integrity.virtue` (True) is live (`company-drama`, `counting-house-dispute`).
- **Image tags:** `generic.energy`, `generic.focus`, `generic.luck` and `generic.light` are all in `encounter-image-library.ts`.

## 4. Aftermath Supportability

**Channels:** `reputation_with { targetLocationId: '$here' }` is live (THR-1206). Every delta is under the ±0.15 cap (`REPUTATION_WITH_MAX_DELTA_PER_OUTCOME`), so the cap never binds. `apply_condition` on `$here` is live (THR-1143/THR-1446). `favor_creation { debtorAgentId: '$cast:duke' }` is legal: the type doc names `$cast:<key>` as an accepted debtor, and `comet-disputation` ships the same form with `$cast:champion`. `assign_ambition` is covered in §1.

**Which variant renders when the action ends at step 0? Answered.** It is the arm the mortal leaned to, not the fallback. The pole is written to `choiceHistory` before `advanceStep` ends the action. `resolveAftermathVariant` (`unifiedAction.ts:2368`) then finds the `branchOnStep: 0` choice and renders that arm's `critical_failure` band. The fallback renders only if no choice was recorded, which cannot happen on a `decidedBy` fork (§2). That makes both arms' route-agnostic critical_failure overviews correct.

**Step-0 critical-failure route: the Plague Scare chip. FIX REQUIRED (Law 56).** On route (a) only the step-0 −0.03 fires, so a Plague Scare chip on the critical_failure band would claim a condition nothing wrote. No narrower channel exists to make it true:
- `EffectPredicate` has no outcome-band member (`src/types/effects.ts`).
- Step metadata is half-keyed, so `failureMetadata` fires on both `failure` and `critical_failure`.
- Moving `plague_scare` into step-0 `failureMetadata` would also fire on a plain step-0 failure, which is a private night reading. That route goes on to a `success_at_cost` page that shows no scare, so it would trade a false chip for a hidden town-wide write.

**Fix (comet-disputation precedent, `comet.seek.critfail.*`):** the critical_failure band on both arms and on the fallback carries **only the reputation SCAR chip**, which is backed on both routes. The Plague Scare chip stays on the `failure` band, where it is always backed. *Caveat:* on route (b), the step-1 critical failure, the scare is written without a chip. The overview's present-tense rumour ("{location} is saying the star … means plague") is prose and claims no state. No prose changes.

**Step-0 −0.03 on a plain step-0 failure. Cannot narrow; accepted.** There is no band predicate (above). On a plain step-0 failure the action continues, and the debit nets into step 1:
- positive success: +0.08 − 0.03 = +0.05
- negative success: +0.05 − 0.03 = +0.02
- failure: −0.11 / −0.09

Every page's reputation chip still points the true way, so this is an unseen net delta, not a false claim. It stays because it is the only backing for the critical_failure reputation chip on route (a). Comet ships the identical −0.03.

**Prose rule 7b (later-tense promises).** One sentence in the outcome prose is future-tense: the negative critical_success overview, "Only {actor} knows that the child's first year will be hard." It is the reader's knowledge, not a promise, and the ambition (`pursues` edge) is the forward state that carries it. "The duke has sent for healers" and "are already watching over the child" are present scene facts. There are no `encounter_seed` effects, no placed or timed promises and no `appointment` blocks, so nothing needs one. **Clear.**

**`success_at_cost` writes the same as `success`.** The writes cannot be told apart, because aftermath bands have no auto-effect channel and step metadata is half-keyed. The editorial "Consider" (a smaller standing gain at success_at_cost) cannot be built without a new primitive. The cost is carried in prose (the astrologer's enmity, the twice-asked question) plus, on the failed-night route, the −0.03. This is the same caveat comet records.

## 5. Chip referents resolve

| Chip | Anchor | Resolves? |
|---|---|---|
| BOND · reputation with {location} (gain) | `stateNoun.entityId: '$here'`, `visualKind: 'location'` | Yes. The counterparty is anchored, per the catalog's `reputation_with` row. |
| SCAR · reputation with {location} (loss) | same | Yes |
| BOND · a favour owed | `stateNoun` carries **no** `entityId` (`tooltipId: 'ui.favour_owed'`). The debtor is anchored in `concepts: [{ text: '{cast:duke}', entityId: '$cast:duke', visualKind: 'agent' }]` | Yes. This is the exact comet/debt-arbitration form, and it anchors the debtor end of `owes_favor` as rule 0c requires. |
| PATH · ambition | `stateNoun { text: 'ambition', tooltipId: 'ui.ambition' }`, concept "Fulfill the Destiny" | Yes. The `ambition` node is `named` in the catalog; the actor's sheet shows it. |
| SCAR · Plague Scare | `stateNoun.entityId: 'trait.condition.location.plague_scare'`, `visualKind: 'attachment'` (template id) | Yes. The condition's template is real, and the effect on the same band grants it (`the-unfinished-rite` precedent). |

**Category correction.** The revised file calls the reputation gain chip "BOON". Per the `EncounterAftermathCategory` doc, `bond` is "who now stands with or against them", and the star sibling `comet-disputation` files a reputation gain as `bond`. **Fix: `category: 'bond'`.** The words do not change.

**Chip titles.** The revised file gives each chip's detail but no `title`, and `EncounterAftermathChange.title` is required. The systems pass supplies plain titles in the final (marked *[systems-supplied]*) for the package critic to accept or replace: "Believed by the duke" / "Heard by the court" (gain), "Trusted less" (loss), "A favour owed", "A new ambition", "Talk of plague".

## 6. New Hooks Needed

None. Every field and effect kind used is shipped.

## 7. Implementation File Map

Beyond the compiled set (`Docs/plans/encounters/ducal-nativity.package.json`, which `compile:encounter` turns into `src/data/encounters/ducal-nativity.ts`, its structural test, and both registrations): **no engine, type or content-table edits.** Art: none this batch (runbook). The concept-art direction is recorded in the final.

## 8. Verdict

**READY WITH CAVEATS.**

Systems fixes, applied in the final (no prose changed except where noted):
1. Step-1 arms and the fallback get `failBehavior: 'fail_action'`, so the `failure` band is reachable and honest.
2. `apply_condition plague_scare` omits `durationTicks`, so `CONDITION_PLAGUE_SCARE_DURATION` (168) owns the term.
3. The critical_failure bands drop the Plague Scare chip and keep only the reputation SCAR chip (Law 56, route a).
4. The reputation gain chip's category is `bond`. Chip titles are supplied. The fallback aftermath mirrors the negative arm's chips on all five bands, because the step fallback is the negative arm. The fallback's critical_success and success_at_cost bands carry chips only and inherit the base overview. No `libraryCardId` on any special.

Caveats (corpus-wide, precedented):
- A step-1 critical failure writes a Plague Scare with no chip (comet's compulsion has the same asymmetry).
- A plain step-0 failure debits −0.03 unseen (nets correctly).
- success_at_cost writes the same as success (half-keyed metadata).
- `assignAmbitionToActor` refuses on `no_free_slot` / `already_pursued`, so the PATH chip can over-claim for an actor with full slots. This is engine-side and corpus-wide.

## 9. Primitive Disposition

No missing primitives identified. (A band-keyed `when` predicate, such as `outcome:critical_failure`, would retire caveats 1–3 corpus-wide. It is noted here only; this encounter does not need it.)
