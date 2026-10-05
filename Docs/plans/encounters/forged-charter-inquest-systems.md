# Encounter Pipeline: The Forged Charter
> Scale: short | Slug: forged-charter-inquest | Pass: systems
> Date: 2026-10-05 | Pipeline version: 2.0
> Input: `Docs/plans/encounters/forged-charter-inquest-revised.md` (editorial: `forged-charter-inquest-editorial.md`, PASS WITH REVISIONS)
> Batch: master-everyday (THR-1688), slot 1 · Template id: `encounter.town.forged_charter_inquest`

**Verdict: READY WITH CAVEATS.** Every id and field the packet names resolves against live code. No packet prose or design changes. The completions are field precision: the forger's spawn-only cast must stay on the legacy binder; there are cast `supportRole` strings, both `seedLabel`s, the intelligence record text, the parent's `narrativeTemplates` / `description`, and the full sequel-file spec. There are no missing primitives. The caveats are the sequel file and its registration (the orchestrator's job), the liveness test that stays red until the compile, live proof, and dealt-fill exposure to two over-exposed library cards.

## 1. Support bundle honesty

| Key | Reuse roles | Seeded where (`LOCATION_ROLE_ROSTERS`, `src/types/npc.ts`) | Spawn | Verdict |
|---|---|---|---|---|
| `steward` | `steward`, `noble` | town: neither seeded · city `noble` 0.7 · capital `noble` 0.9 · `castle` / `noble_house` sublocations seed `steward` 0.9 / 1.0 | `steward` "Aldric Vane" (`steward` is a real `NpcRole`, line 59) | honest. A town has no local candidate, so it spawns the count's steward. In a city or capital it may reuse a resident noble as the count's man. That is a stretch the fiction tolerates, the same kind as the mill-lease cellarer reusing a priest. |
| `forger` | **none** (spawn-only) | town `clerk` 0.6 | `clerk` "Wat Penrose" (`clerk` is a real `NpcRole`, line 54) | honest **only on the legacy cast path**. See the binder note below. |

**Binder note (field-precision fix).** `reuseNpcRoles` is optional (`EncounterSupportActorSpec`, `src/types/encounter.ts:216`). On the legacy path (`src/engine/encounterSupportBundle.ts:183`), an absent list returns `null` and the spec materializes. That is the spawn-only cast the packet intends. On the scored binder (`useScoredBinder: true`), an absent `acceptedRoles` falls back to `[mintRole]` (`src/engine/binding/binder.ts:191, 240`). There the forger would reuse any town `clerk`, which is exactly the town's man the packet rules out. **So the template must not set `useScoredBinder`** (it is opt-in and the mill lease does not set it), and the forger spec omits `reuseNpcRoles` entirely. Both specs need distinct `supportRole` strings, because the legacy resolver first re-binds any node already carrying the same `encounterSupportRole`. Use `"count's steward"` and `"count's clerk"`.

Both specs are `must-persist`. The steward is the appointment counterparty and is inherited by both sequels (`inheritContext: true`). The forger is named in step 1's success fragments and afterimages.

`settings: ['urban']` expands to `town · city · capital` (`src/data/settingClasses.ts:59`). A council, market, town hall and charter are lawful in all three.

## 2. Effect and field audit

| Field | Shape | Verified against | Verdict |
|---|---|---|---|
| step 0 `failureMetadata.effects` | `reputation_with $here −0.03` | mill-lease / boundary-survey precedent; backs the step-0 critical_failure SCAR | ok |
| step 1 success `reputation_with` | `$here +0.06` | `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME = 0.15` (`src/engine/reputation.ts:66`) | ok |
| step 1 `intelligence` | `category: 'political_secret'` + `label` / `detail` / `reliability` / `targetAgentId: '$actor'` | `IntelligenceCategory` (`src/types/unifiedAction.ts:73–79`). Readers: `TEMPLATE_CATEGORY_MATCHERS.political_secret` = `court · intrigue · blackmail · extort · betray` (`src/engine/intelligence.ts:72`). Same category as the toll-gate writ, boundary survey and assize letter. | ok |
| step 1 `encounter_seed` + `appointment` | `templateId: 'town.charter_inquest_heard'`, `delayTicks: 36`, `inheritContext: true`, `appointment { locationId: '$here', counterpartyId: '$cast:steward', missed { templateId: 'town.charter_inquest_defaulted', seedLabel } }` | `AppointmentBlock` (`src/types/unifiedAction.ts:1500`). `windowTicks` omitted → `APPOINTMENT_WINDOW_TICKS` 12; `missed.delayTicks` omitted → `APPOINTMENT_MISSED_SEQUEL_DELAY_TICKS` 12 (`src/data/movement-content.ts:290, 375`) | ok. The packet left both `seedLabel`s unwritten; they are supplied in § 21, with no `{…}` token (labels print raw). |
| step 1 failure `reputation_with` | `$here −0.06` | — | ok |
| sequel ids | `town.charter_inquest_heard`, `town.charter_inquest_defaulted` | no collision in `src/` | ok, but **unregistered** (caveat 1) |
| `deal` tags | `['insight','lore']`, `['insight','social']` | `DealContextTag` (`src/types/unifiedAction.ts:1921`, closed, 12 values) | ok. Boundary survey step 0 uses the same `['insight','lore']`. |
| specials' spheres | entropy, energy, mind, chaos | `CREATION_SPHERE_NAMES` (entropy, energy, mind) and `FOUNDATION_SPHERE_NAMES` (chaos) (`src/types/index.ts`) | ok |
| `imageTag`s | `generic.decay` (entropy) · `generic.energy` (energy) · `generic.memory` (mind) · `generic.luck` (chaos) | `NUDGE_CONCEPT_ART`, `src/data/encounter-image-library.ts:631–643`. Every plate's sphere matches its card's sphere. | ok, no fix. Subjects: a lock corroding (decay for the ink test), a charge gathering (heat for the wax), an old notch surfacing (a buried guilt), a coin caught before it tips (a spill). |
| card names | Test / Warm / Wake / Crack | `IMPERATIVE_VERB_LEXICON` (`src/data/content-eval/doctrineV2Checks.ts:94`): all four present | ok |
| `libraryCardId` | none on any special | brief: `card.boost.signature.energy` not at all | ok |
| `motivations` | `revelation_discretion`, `tradition_novelty`; sequels `revelation_discretion`, `loyalty_ambition` | `ValuePair` (`src/types/agent.ts:13–15`) | ok |
| `tags` | `['#territorial']` | family axis, seated (`src/data/content-tags.ts:237`; catalog line 134: 4 bearers, 1 encounter, the boundary survey) | ok. Shares the family with its Eye sibling, which is honest: both are ground argued over. |
| sequel `bond_change` / `reputation_with targetAgentId` | `withAgentId: '$cast:steward'`; `targetAgentId: '$cast:steward'` | `bond_change` (`unifiedAction.ts:1359`, accepts `$cast:<key>`); `reputation_with.targetAgentId` accepts `$cast:<key>` (`:1199`) | ok. The missed sequel never writes to `$here`. |

## 3. Chip backing (Law 56) and chip referents

| Chip | Referent | Backing write | Fires on |
|---|---|---|---|
| BOND reputation with {location} (CS / S / SAC) | `entityId: '$here'` (the town, which the scene resolves) | step 1 `+0.06` | every success-band path. On the step-0-failure path the net is +0.03, still a gain. |
| BOON knowledge (CS / S / SAC) | no `entityId` (precedent) | step 1 `intelligence political_secret` | step 1 success |
| PATH appointment (CS / S / SAC) | `entityId: '$appointment'` (THR-1518 anchor, as mill lease) | step 1 `encounter_seed` + `appointment` | step 1 success |
| SCAR (failure) | `$here` | step 1 `−0.06` | step 1 failure |
| SCAR (critical_failure) | `$here` | step 1 `−0.06`, or step 0 `−0.03` on the step-0-critical path | both paths |

No chip points at prose-only fiction. The forger has no chip, which is correct: a real node backs it, but no state write names him.

## 4. Aftermath supportability: prose rule 7b walk

| Later-tense sentence | Path | Effect that performs it |
|---|---|---|
| "the findings are read out at the inquest in the town hall on court day, in three days, with the steward there to answer them" (step-1 spine) | step 1 success | `encounter_seed` + `appointment` (`$here`, 36 ticks, counterparty `$cast:steward`), with the missed branch authored. Lawful. |
| "If not, {location} will think less of {actor}" (step-1 spine) | step 1 failure | `reputation_with $here −0.06` |
| PATH detail "{cast:steward} answers the findings in {location} in three days" | step 1 success | the appointment |
| kept sequel: "If {name}'s findings hold … the bench lets the town's charter stand" | in-scene conditional | settled by its own step; success afterimage reports it. Status quo: no write is owed. |
| kept sequel failure: "the bench put off its ruling to the next court" | — | reports a finished deferral. It binds the mortal to nothing, so no write is owed. |
| missed sequel: steward "has come looking … with a purse, to buy the written findings and burn them" | — | the steward's motive, settled in-scene. Failure afterimage "thinks less of … says so at the count's table" → `bond_change` + `reputation_with $cast:steward −0.04`. |

No placed promise exists without an appointment block, and the appointment has its missed branch. Both sequels place the mortal correctly: the kept sequel fires on the hex in the window, so `{location}` is the town; the missed sequel names no place.

## 5. Missing primitives

None. Every effect kind ships: `reputation_with`, `intelligence`, `encounter_seed` + `appointment`, `bond_change`.

**Editorial "consider" items, ruled.**
- *success_at_cost cost the master carries:* there is no honest band-keyed write. Step effects key on success or failure, not band, and a condition on `$actor` would spend the brief's two-slot `apply_condition` cap for a cost the fiction puts on the council's case. The cost stays prose-carried (findings on {actor}'s word alone), as the mill lease and boundary survey did. Noted, not changed.
- *"and for whom" on the knowledge record:* the record's `detail` names the steward's household, which every success band shows. The steward's *order* is shown only on critical_success, so it stays out of the record. This needs no schema change.

## 6. Dealt-fill exposure to the brief's over-exposed table

The dealer **scores, never filters** by context tag (`src/engine/encounters/dealHand.ts`: score = sphere + tag + provenance; only `exclude` eliminates). So a dealt fill can hand out a barred or capped card whenever the playing god's sphere favours it. Against this slot's tags (`card-library` `PLAY_PROFILES`, `src/data/nudge-card-library.ts:851`):

| Card (brief instruction) | Can this slot's deal hand it out? |
|---|---|
| `card.compulsion.signature.mind` (once, slot 2) | **Yes, tag-matched.** Its `contextTags: ['insight','presence']` match `insight` on both steps. A mind-aligned god is likely to be dealt it here. |
| `card.boost.signature.energy` (not at all) | Not tag-matched (`might`, `labor`), but an energy-aligned god's sphere term can still deal it. The authored Warm The Wax already covers energy, which lowers the sphere-variety pull. |
| `card.mercy.core` (once, slot 3) / `card.boost.core` (deal only) | Universal core, dealable on any step. `boost.core` via the deal is what the brief asks for. |
| `card.heavy_hand.signature.force` / `card.undertow.signature.darkness` / `card.kindled_ambition.signature.spirit` | No tag match (`might`/`labor`/`peril`, `presence`). Sphere-only. |
| (not on the table) `card.heavy_hand.hunger.illuminate`, `card.whisper.hunger.witness` | Tag-matched on step 1 (`social`; `insight`/`social`). The first carries `detectionDelta: 4` (a dealt Heavy Hand, not an authored one). The second grants a second `political_secret` record beside the authored one, which is harmless. |

**Caveat, not a fix.** The mill-lease Pass 3 ruled that the brief's caps cover authored specials, and this pass keeps that reading. If the orchestrator wants the table to bind dealt fills too, the only existing lever is `deal.exclude` (a real field, `StepDealDeclaration.exclude`, `NudgeCardTypeId` includes `'compulsion'`; precedent `the-beast-in-the-granary.ts:143`). `exclude: ['compulsion']` on both steps would also bar the haunt Compulsion. No schema is invented here.

## 7. New hooks needed

None beyond the hand-authored sequel file (§ 8).

## 8. Implementation file map

| File | Action | Notes |
|---|---|---|
| `Docs/plans/encounters/forged-charter-inquest.package.json` | create | Compiles (`compile:encounter`, THR-1246) into `src/data/encounters/forged-charter-inquest.ts`, its structural test, and the parent registrations. **The orchestrator compiles.** Gate with `check:encounter -- --package` first (#1114). |
| `src/data/encounters/charter-inquest-sequels.ts` | create (hand-authored, **orchestrator**) | exports `CHARTER_INQUEST_SEQUELS` (both sequels; `drawable: false`; no `locationSubtypes`; `intrinsicTier: 'background'`). Full spec in final § 21. |
| `src/data/unified-action-templates.ts` | modify (2 lines, **orchestrator**) | `import { CHARTER_INQUEST_SEQUELS } from './encounters/charter-inquest-sequels';` + `...CHARTER_INQUEST_SEQUELS,` spread after `...MILL_LEASE_SEQUELS,` with a `// THR-1688` comment |
| `src/data/content-eval/plotHooks.ts` | orchestrator, at closeout | stamp `hook.meeting_to_keep` `usedBy` |
| Engine / types / art | none | `generic.*` library plates |

## 9. Caveats

1. **Sequel file + registration** (the orchestrator's job). Without them, `validateEncounterSeedRefs` reports both appointment branches as `dead_template`.
2. **`encounterSeedLiveness.test.ts` › every non-drawable template has a planter** stays red for both sequel ids until the compile registers `encounter.town.forged_charter_inquest`. Expected. Re-run it after.
3. **Live proof.** Run a seed sweep plus one pinned run per band (`?view=game&seeded&size=medium&spawn=encounter.town.forged_charter_inquest&outcome=<band>`), and read `await window.__DEBUG.getOutcomePinVerdict()` until `band_rendered`. At eye 0.74 / 0.80 the proof ascendant loses most natural runs, so read success-side rows on a failed run as *not exercised*. Prove both appointment branches.
4. **Do not set `useScoredBinder`** on the parent (§ 1), or the forger reuses a town clerk.
5. **Dealt-fill exposure** (§ 6): a mind-aligned god can be dealt `card.compulsion.signature.mind` here. Reported to the batch report; `deal.exclude` is the lever if wanted.
6. *Notes:* `intrinsicTier: 'shaping'` is deliberate (brief). The success_at_cost cost is prose-carried (§ 5). No Heavy Hand, Compulsion, Mercy, Undertow or Kindled Ambition is authored.

## 10. Primitive disposition

No missing primitives identified.

READY WITH CAVEATS
