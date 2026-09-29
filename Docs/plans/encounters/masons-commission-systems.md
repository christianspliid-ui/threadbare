# Encounter Pipeline: The Mason's Commission
> Scale: short (local) | Slug: masons-commission | Pass: systems
> Date: 2026-09-29 | Pipeline version: 2.0

## 1. Support Bundle Honesty

- `inspector`: lazy, reuse clerk/elder/steward, else spawn clerk "Aldo Venner", must-persist. Realistic. It is also the appointment's `counterpartyId`, so the promise is written as an `owes_favor` edge.
- `rival`: lazy, reuse mason, else spawn mason "Brisa Holt", must-persist. `inheritContext: true` carries it into the kept sequel.
- `$here`: the actor's `located_at`, walked to the Location tier (`resolveSceneHere`). Step-metadata effects dispatch through `applyEncounterAftermathReaction` (`unifiedActionResolution.ts` `applyStepOutcomeEffects`, THR-783), so `bindAftermathSceneTargets` binds `$here` on this path too.

## 2. Missing Primitives

None. Appointment (`encounter_seed.appointment`, THR-1479), `ContentQuery` seeds, `apply_condition.targetLocationId` (THR-1143) and `reputation_with.targetLocationId` are all live.

## 3. Runtime Feasibility

Two linear steps: stone 0.40 `continue_weakened`, then stone 0.45 `fail_action`. Both are at or under the open-draw ceiling of 0.45 (`intrinsicTier: 'background'`). Mean 0.425. The six outcome bands are covered by afterimages plus special fragments plus the dealer.

## 4. Aftermath Supportability — open risks decided

**(a) `place` family.** Live location conditions: pass_closed, festival, plague_scare, under_watch, harvest_blight, tended_shrine, welcoming, lawless, veil_thin, haunted, blood_soaked. None covers works, repair or disrepair. `welcoming` means "long prosperity", which one pier does not earn. A hazard on the failure side (plague_scare, lawless) would be a lie about a botched trial footing, and the brief forbids new condition ids. **Decision: keep `trait.condition.location.festival` on the success side**, and make it honest in the prose. The step 0 spine now states "Nobody may go near it, so the fair has been put off", and the chip pays that off ("{location} holds the fair it had put off"). The precedent is `the-beast-in-the-granary.ts`, where Festival stands for a town's relief after a threat is removed. I dropped the chip's `{location}` concept: concept text is matched *unenriched* against the enriched sentence, so it could never decorate anything.

**(b) Reputation chip noun.** `{target}` in `stateNoun.text` is enriched (`buildAftermathConsequences` → `enrichProse`). On a self-targeted everyday scene `$target` / `{target}` is the actor (`chipAnchorDeclarations.ts` `ANCHOR_SENTINEL_HERE` doc), so the tag would have read "reputation with <the mortal>". **Fixed:** the noun is now `reputation with {location}`, anchored to `$here` with visualKind `location` and tooltip `ui.reputation_with`. It is 3 words, inside `CHIP_STATE_NOUN_MAX_WORDS`, and `$here` is not a refused carrier anchor. `{location}` enriches to the actor's current Location, the same node `$here` binds. The write is `reputation_with` with `targetLocationId: '$here'`, and `reputation.ts` resolves a Place up to its Location.

**(c) Appointment.** The block shape matches the shipped `vertical-slice.ts:2067` (`locationId '$here'`, `counterpartyId '$cast:…'`, `missed: { query, seedLabel }`). The kept sequel is `#build` (21 members, e.g. `encounter.bridge_engineering`, `tower_restoration`, `harbor_construction`), which honestly continues "more building work". The missed sequel is `#tavern_night` (10 members). No seated family is about a broken work promise: `#crossroads_debt` is crossroads-specific, and `#craft_commission` has one member, a smith (`flawed-steel`). So `#tavern_night` stays. **Fixed:** its seedLabel claimed "word that the mason walked off … reaches the common rooms", which no tavern template performs. It now reads "The scaffold came down without them, and the evening finds them in a common room." The real cost of a miss is the broken `owes_favor` edge with the inspector. The kept seedLabel now says "on the site for the next work", no longer "to see it" struck.

**Rule 34 sweep.** Every later-tense sentence was walked. The PATH chips ("due back on the site when the scaffold comes down") are backed by the appointment. Three unbacked promises were cut: "The rest is paid when the work stands", "the town's fee will only just cover it", and "waits a long time for the next commission".

## 5. Chip referents

reputation → `$here` (Location, linked) · Festival → condition template (attachment, linked) · appointment → `$appointment` (THR-1518, valid because the template plants an appointment) · PRIZE → engine-rendered from `rewardPool #tool`. All resolve.

## 6. New Hooks Needed

None.

## 7. Implementation File Map

Only the compiled set (package → module, test, registrations). No engine changes.

## 8. Verdict

**READY WITH CAVEATS**. Two caveats for live proof. First, a `#build` query sequel keeps the family eligibility filter, so it can wither if no `#build` member accepts the settlement subtype on the due tick; confirm with the `Family seed matched` trace. Second, the `#tool` reward draw must resolve to a real item on the band.

## 9. Primitive Disposition

No missing primitives identified.
