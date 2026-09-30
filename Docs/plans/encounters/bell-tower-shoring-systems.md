# Encounter Pipeline: The Leaning Bell Tower
> Scale: short | Slug: bell-tower-shoring | Pass: systems
> Date: 2026-09-30 | Pipeline version: 2.0
> Batch: expert-everyday-1 (THR-1678), slot 5 · Template id: `encounter.town.bell_tower_shoring`

Independent critic, cold context. Audited `bell-tower-shoring-revised.md` (primary) against the runtime, with `bell-tower-shoring-editorial.md` for context and `well-sinking.package.json` / `well-sinking.ts` / `well-sinking-sequels.ts` as the shipped appointment precedent. Every id the packet names was grepped in `src/`; results are in the verification table at the end.

**Verdict: READY WITH CAVEATS.** Two corrections are applied in the final (a reward-pool shape and one mis-targeted sentinel in the missed sequel). The caveats are implementation-time items, not missing primitives.

## 1. Support Bundle Honesty

| Object | Claim | Verified | Verdict |
|---|---|---|---|
| `councillor` | lazy-materialize-on-trigger, must-persist; reuse `elder`/`steward`/`clerk`/`merchant`/`noble`, else spawn `elder` "Maud Carrow" | `LOCATION_ROLE_ROSTERS` (`src/types/npc.ts`): `hamlet` seeds `elder` (1.0); `town` seeds `merchant` (1.0), `clerk` (0.6); `city`/`capital` seed `merchant` (1.0), `noble` (0.7/0.9). `steward` is seeded only at `castle` (harmless in the reuse list). `farmland` and `mining` (the other two `rural` subtypes, `src/data/settingClasses.ts`) have **no roster** — the councillor always spawns there. | Honest. Self-audit's "seeded in hamlet and town/city" omits farmland/mining; the spawn fallback covers them, so no defect. |
| `lodgemaster` | reuse `mason`, else spawn `mason` "Osric Venn" | `mason` is seeded only at `town` (0.7). Hamlet, farmland, mining, city and capital always spawn. | Honest — matches the well-sinking `wright` precedent exactly. |
| Persistence | must-persist for both | Both are read after the scene: the councillor by `appointment.counterpartyId` and by both sequels via `inheritContext` (the missed-branch rewrite in `encounterSeeding.ts` spreads `...seed`, so `supportBindings` survive into `town.bell_tower_cracked`). The lodgemaster is read only inside the parent. | Honest. |
| `supportRole` | not stated | `SupportBundleEntry.supportRole: string` is required (free string). | Package pass must supply (e.g. `councillor`, `lodge_master`). Caveat, not a defect. |

## 2. Missing Primitives

No missing primitives identified. Everything the packet leans on is live:

- **Appointment** (`encounter_seed.appointment`, THR-1479) — `AppointmentBlock` in `src/types/unifiedAction.ts:1477`: `locationId` (`$here` ok), `counterpartyId` (`$cast:<key>` ok), `windowTicks` optional (default `APPOINTMENT_WINDOW_TICKS` = 12), `missed: { templateId | query, seedLabel, delayTicks? }` (default delay `APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS` = 12). The packet authors a missed branch — `validateEncounterSeedRefs` will not raise `appointment_missing_branch`.
- **Step reward pool** (possession) — `successMetadata.rewardPool: RewardPoolRecipe`; `consequenceDraw.ts` credits `possession` from `hasRewardPool` (line 333).
- **`intelligence`** (knowledge) — `consequenceDraw.ts:192` lists it under `knowledge`.
- **`reputation_with`**, **`bond_change`**, **`apply_condition` on a place** (`targetLocationId`, THR-1143) — all live, all accept scene sentinels.
- **Seed-only sequels** (`drawable: false`, THR-1526) — live; the `town.` prefix is already claimed in `src/data/content-objects.ts:190`, so the literal `templateId`s pass the kind narrowing.

No rejected primitive (`authoredChoices`) is used.

## 3. Runtime Feasibility

- **Beats:** two steps, short scale — supported.
- **Branching:** linear, `branchOnStep` aftermath with `byOutcome` — supported.
- **Outcome ladder** against `computeFinalActionOutcome` / `advanceStep` (`src/engine/unifiedActionLifecycle.ts`):
  - step 0 `continue_weakened` failure → continues; any continued failure aggregates to `success_at_cost` if step 1 succeeds (matches the packet's at-cost path).
  - step 0 `critical_failure` → forces fail_action → action `critical_failure` (line 205–209). Step-0 `failureMetadata` fires; step 1 never runs.
  - step 1 `fail_action`: failure → action `failure`; critical_failure → action `critical_failure`.
  - step 1 `near_miss` → `isStepSuccess` is true (`unifiedAction.ts:2955`), so `successMetadata` fires (prize, knowledge, regard, appointment) and the action aggregates to `success_at_cost`. Every success-band chip is backed on that path.
- **Open-draw difficulty cap:** 0.60 / 0.66 exceed `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45), but `nudgeHandChecklist.ts:419` applies the cap only when `intrinsicTier === OPEN_DRAW_ATTENTION_TIER` (`background`). `intrinsicTier: 'shaping'` is the brief's deliberate decision and defers the check — not a defect. *Forecast-window rationale (note only):* nothing gates this template on Stone, so a low-Stone mortal will see *severe* on both steps; the forecast window (mortals engage at roughly 50–65%, THR-1575) is what keeps it with stone-competent actors, not an eligibility gate. That is the intended shape for an expert template at `shaping`, and the reason the hand is not decorative for the mortals who actually take it.
- **Deal tags:** `craft`, `insight`, `peril` are all members of the closed `DealContextTag` set (`unifiedAction.ts:1898`).
- **Image tags:** `generic.light`, `generic.time-slow`, `generic.oath`, `generic.strength` all present in `src/data/encounter-image-library.ts`.
- **Motivations:** `preservation_transformation`, `tradition_novelty` are live axes (`src/types/agent.ts`).

## 4. Aftermath Supportability

**Channels.** `reputation_with` on `$here` (location standing) — real; ±0.06 / −0.03 are inside `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` (0.15). `intelligence` — real; `IntelligenceCategory` includes `cultural_knowledge` (`unifiedAction.ts:79`). `trait.condition.location.festival` — real (`src/data/condition-trait-content.ts:454`, default duration `CONDITION_FESTIVAL_DURATION` = 36, which the kept sequel matches; precedent `masons-commission.ts:195`).

**Reward pool shape — CORRECTED.** The packet writes `{ possession: 1, tagFilters: ['#stone'] }`. `RewardPoolRecipe` (`src/types/attachments.ts:232`) is `{ categoryWeights: Partial<Record<AttachmentCategory, number>>, tagFilters?: string[], … }`. Corrected in the final to `{ categoryWeights: { possession: 1 }, tagFilters: ['#stone'] }`. `possession` maps to `{ kind: 'item_template', tags }` (`rewardPool.ts:162`); the content-tag catalog counts **16 items** tagged `#stone` (e.g. Master Chisel, Iron Tongs, Basalt Maul, Pack Goat, Book of Sealing), so the pool is live. *Note:* the pool includes arms (Basalt Maul, a glaive) and a beast — all honest as "a gift from {location}'s stores", since no prose names the object. `#trade` for the kept sequel: 5 items (the precedent `town.well_first_water` uses the identical recipe), so it is live too.

**Law 56 — per chip, per band.**

| Chip | Bands | Backing write | Paths checked |
|---|---|---|---|
| BOND `reputation with {location}` gain | crit_success, success, success_at_cost | step 1 `successMetadata` `reputation_with $here +0.06` | All three success bands require step 1 on the success side (incl. near_miss). On the step-0-failure → step-1-success at-cost path the net write is +0.03 (−0.03 then +0.06); "thinks well of" is still true of a net gain. |
| BOON `knowledge` | same | step 1 `successMetadata` `intelligence` (`cultural_knowledge`) | Same paths. Detail names the arch, so it reads on the step-0-failure path (per the packet's own design). |
| PATH `appointment` → `$appointment` | same | step 1 `successMetadata` `encounter_seed` + `appointment` | Same paths. `$appointment` is legal because the template authors an appointment block (`chipAnchorDeclarations.ts:224`, THR-1518). |
| PRIZE (auto) | same | step 1 `successMetadata.rewardPool` | Same paths. |
| SCAR `reputation with {location}` loss (failure) | failure | step 1 `failureMetadata` `−0.06` | Only reachable by step 1 plain failure. Backed. |
| SCAR (critical_failure) | critical_failure | step 1 `failureMetadata −0.06` **or** step 0 `failureMetadata −0.03` | Two paths: step-1 critical_failure (step-1 write) and step-0 critical_failure (step-0 write — the well-sinking lesson, correctly applied). Both backed. |

**Prose rule 7b — every later-tense promise and its enacting effect.**

| Sentence | Where | Enacting effect | Verdict |
|---|---|---|---|
| "The rest will be paid at the tower when the bell rings on market day." | P3 spine | step 1 `encounter_seed` + `appointment` (`$here`, `$cast:councillor`, missed branch authored) | Lawful (the appointment exception). Same unconditional form shipped in well-sinking's step-0 spine. |
| "If {actor} fails as well, {location} will think less of them." | P3 spine | step 0 `−0.03`, step 1 `−0.06` | Backed on every failing path. |
| "If the new courses give way, the top of the tower can come down." | step 1 spine | step 1 critical_failure afterimage | A scene hazard, not a promise to the mortal; the tower is not a world object, so no state is claimed. OK. |
| PATH detail "{cast:councillor} pays it at the tower when the bell rings." | chip | appointment | Lawful. |
| Kept sequel: "If the new courses hold through the peal, the councillor pays the rest of the fee." | sequel spine | kept success `rewardPool` `#trade` possession | Backed. |
| Missed sequel: "…holds back the rest of the fee **until the crack is looked at**." | sequel spine | **none** — success is only a small `bond_change` | **Finding (caveat).** "until the crack is looked at" implies a later release of money nothing enacts. The shipped precedent (`town.well_gone_foul`, "wants the well cleared before any of it is paid", success afterimage "paid part of the fee") carries the same hole, so this is not blocking — but when `bell-tower-sequels.ts` is authored, either end the sentence at "holds back the rest of the fee", or give the missed success a small `#trade` `rewardPool` and let its afterimage say part is paid. Do not write a success afterimage that claims payment on a bond-only success. |

No placed promise without an appointment block. The missed sequel keeps the placeless truthful shape ("{cast:councillor} has come looking for {name}").

**Missed-sequel regard write — CORRECTED.** § 17 gave `town.bell_tower_cracked` failure `reputation_with $here −0.04`. `$here` binds to the actor's **current** `located_at` (`encounterAftermath.ts:849`, `resolveSceneHere`), and the missed branch by construction fires **wherever the mortal is** — i.e. not at the tower's place. The engine carries `missedAppointment.locationId` on the rewritten seed (`encounterSeeding.ts:639`) but no scene sentinel reads it (`sceneSentinels.ts` has `$actor`/`$target`/`$cast:`/`$ascendant`/`$here`/`$realm`/`$area` only). As written, the loss would land on an unrelated town. Corrected in the final to `reputation_with` **`targetAgentId: '$cast:councillor'`** `−0.04` — standing with the person who holds the fee, which binds because the missed seed keeps the inherited `supportBindings`. (Dropping the write, as the well precedent does, is the acceptable alternative.) The **kept** sequel's `reputation_with $here +0.04` and festival on `$here` are correct: the kept branch fires only while the mortal is at the appointment place.

## 5. Chip referents resolve

| Chip | Referent | Resolves? |
|---|---|---|
| BOND / SCAR `reputation with {location}` | `$here` → WorldRef location | Yes. Declare `visualKind: 'location'`, `tooltipId: 'ui.reputation_with'`, concept "thinks well of" / "thinks less of" with `tooltipId: 'ui.standing'` (both ids in `src/data/ui-content.ts`, lines 423 / 384) — the well-sinking shape. |
| PATH `appointment` | `$appointment` → the place of the soonest live appointment (`owes_favor` edge) | Yes (THR-1518). Declare `visualKind: 'location'` as the precedent does. |
| BOON `knowledge` | `tooltipId: 'ui.knowledge'` (`ui-content.ts:446`), no `entityId` | Accepted precedent (`counting-house-dispute.ts`, `assize-letter.ts`, `pilots-reckoning.ts`) — the intelligence record is not a graph node; the noun names a sheet concept, not fiction. |
| Named cast in prose | `{cast:councillor}`, `{cast:lodgemaster}` | Both are support-bundle keys. |

No chip points at a phrase-only referent.

## 6. New Hooks Needed

None in the engine. Implementation-time field completions the packet leaves unwritten (package pass; wording may be tuned there, but the fields are required by the types):

- **Kept `seedLabel`** (required on `encounter_seed`) and **`appointment.missed.seedLabel`** (required). The final's § 21 offers text built from the packet's own sentences.
- **`intelligence.label` / `.detail`** (both required). § 21 offers text from the BOON chip.
- **`supportRole`** for both bundle entries.
- **`tags`** — the packet declares none. The well precedent carries `#build` (a live `family` tag, 22 uses). Recommended, not required.
- Sequel `intrinsicTier`: unstated; follow the precedent (`background` — no open-draw cap applies to a `drawable: false` template's audience in practice, and the difficulties are 0.35 / 0.45).

Scope: under 15 minutes, all inside the package and the sequel file.

## 7. Implementation File Map (beyond the compiled set)

| File | Action | Notes |
|---|---|---|
| `Docs/plans/encounters/bell-tower-shoring.package.json` | create | Compiles (`compile:encounter`, THR-1246) into `src/data/encounters/bell-tower-shoring.ts`, its structural test, and the parent's registrations — not hand-edited. |
| `src/data/encounters/bell-tower-sequels.ts` | create (hand-authored) | `town.bell_tower_first_peal` + `town.bell_tower_cracked`, `drawable: false`, no `locationSubtypes`, exported as `BELL_TOWER_SEQUELS`. Mirror `well-sinking-sequels.ts`. |
| `src/data/unified-action-templates.ts` | modify (2 lines) | Import and spread `BELL_TOWER_SEQUELS` beside `...WELL_SINKING_SEQUELS` (line ~5723). The sequels sit outside the compiled package, so this one registration is a hand edit — the THR-1677 precedent. Without it `validateEncounterSeedRefs` reports both appointment branches as `dead_template`. |
| `src/data/content-objects.ts` | none | `town.` already claimed. |
| Engine / types / art | none | Scene art is the image library's `generic.*` tags; § 18 concept-art direction is optional. |

## 8. Verdict

**READY WITH CAVEATS.**

Caveats (implementation-time, no pre-task ticket needed):
1. Author `bell-tower-sequels.ts` and register it by hand (§ 7) — the parent's seeds are dead without it.
2. Fill the required fields in § 6 (seed labels, intelligence label/detail, supportRole).
3. Missed-sequel 7b: drop "until the crack is looked at" or back it with a small `#trade` pool; never let a bond-only success claim payment.

## 9. Primitive Disposition

No missing primitives identified.

## Verification table (ids grepped in `src/`)

| Id / shape | Location | Result |
|---|---|---|
| `RewardPoolRecipe` `{ categoryWeights, tagFilters? }` | `src/types/attachments.ts:232` | Confirmed; packet shape wrong → corrected |
| `#stone` → possession items | content-tag catalog (item 16); `reward-attachment-catalog.ts` | Live |
| `#trade` → possession items | content-tag catalog (item 5) | Live |
| `IntelligenceCategory` `cultural_knowledge` | `src/types/unifiedAction.ts:79` | Live |
| `trait.condition.location.festival` | `src/data/condition-trait-content.ts:454` | Live |
| `apply_condition` `{ conditionTraitId, durationTicks?, intensity?, targetLocationId? }` | `unifiedAction.ts:631` | Matches |
| `bond_change` `{ withAgentId, sentimentDelta, trustDelta?, reciprocal? }` | `unifiedAction.ts:1336` | Matches |
| `reputation_with` `{ targetLocationId? / targetAgentId? / targetFactionId?, delta }` | `unifiedAction.ts:1176` | Matches |
| `encounter_seed.appointment` `AppointmentBlock` | `unifiedAction.ts:518, 1477` | Matches; missed branch present |
| `generic.light` / `generic.time-slow` / `generic.oath` / `generic.strength` | `src/data/encounter-image-library.ts` | All present |
| `ui.knowledge` / `ui.reputation_with` / `ui.standing` | `src/data/ui-content.ts:446 / 423 / 384` | All present |
| `$appointment` anchor | `src/data/content-eval/chipAnchorDeclarations.ts:161` (THR-1518) | Live; requires an appointment block, which the template has |
| npc roles `elder`, `steward`, `clerk`, `merchant`, `noble`, `mason` | `src/types/npc.ts` | All valid roles; roster coverage as § 1 |
| `DealContextTag` `craft` / `insight` / `peril` | `unifiedAction.ts:1898` | All members |
| consequence draw: possession via rewardPool, knowledge via `intelligence` | `src/data/content-eval/consequenceDraw.ts:190–192, 333` | Confirmed |
| `town.bell_tower_*` ids | `src/` | Not yet present (to be created); no collision |
| `NUDGE_OFF_REACH_MAX_DIFFICULTY` scope | `src/data/content-eval/nudgeHandChecklist.ts:419` | `background` only — `shaping` defers |
