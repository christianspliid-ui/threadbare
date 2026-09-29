# Encounter Pipeline: The Well Sinking
> Scale: short (local) | Slug: well-sinking | Pass: systems
> Date: 2026-09-29 | Pipeline version: 2.0

## 1. Support Bundle Honesty

- **`reeve`**: lazy, must-persist. It reuses elder/steward/clerk/merchant, otherwise it spawns an elder, "Wenna Marsh". All four roles are in `NPC_ROLES` (`src/types/npc.ts`). `elder` is on the hamlet roster at chance 1.0. Towns and cities carry merchant (1.0) and clerk (0.6), so reuse is realistic on every class. The reeve is named in the step 0 spine, so it is materialised before step 1's `successMetadata` names it as the appointment's `counterpartyId`. It is an explicit must-persist spec, not a default cast key, so it is cast-target safe (THR-1165). Written as the `owes_favor` edge.
- **`wright`**: lazy, must-persist, reuses a mason, otherwise spawns a mason, "Tobin Hale". Mason is on the town roster (0.7) and on no hamlet, farmland or mining roster, so rural runs spawn one. That is realistic: the wright is an outsider sinking the lord's well. The wright is named in the step 1 spine, which is where the membership chip's `{cast:wright}` cause reads it. `inheritContext: true` carries it into the kept sequel.
- **`$here`**: the actor's `located_at`, walked to the Location tier. Step-metadata effects dispatch through `applyEncounterAftermathReaction` (THR-783), so `$here` binds on this path, the same way it does for the Mason's Commission.

## 2. Missing Primitives

None. The live primitives in use are the `encounter_seed.appointment` (THR-1479; the block shape matches `vertical-slice.ts:2067`, and the `missed` branch here is a literal `templateId`, which `AppointmentBlock.missed` allows), `reputation_with.targetLocationId`, `membership_change` (THR-1144) and `emit_omen`.

## 3. Runtime Feasibility

The encounter has two linear steps: stone 0.42 `continue_weakened`, then stone 0.45 `fail_action`. Both are at or under the background open-draw ceiling of 0.45. The mean is 0.435.

**Path finding (fixed).** `advanceStep` (`unifiedActionLifecycle.ts:180`) ends the action on any step `critical_failure`, whatever the step's `failBehavior`. So a step-0 critical_failure resolves the whole encounter as `critical_failure` before step 1 runs. In the draft, *all* failure-side writes sat on step 1's `failureMetadata`, so on that path nothing was written, and the critical_failure band's SCAR `reputation with {location}` chip was **unbacked** (Law 56). **Fix:** step 0 now carries `failureMetadata: [reputation_with $here −0.03]`, following the `crowns-reckoning` precedent (a small standing cost on the first step's failure side). The side effects are honest on every path:

- step-0 critical_failure → −0.03, and the SCAR chip is backed.
- step-0 failure then step-1 success → success_at_cost, net +0.03, so the BOND "thinks well" chip stays true.
- step-0 failure then step-1 failure → −0.08.

Note that `near_miss` counts as step success, so it fires `successMetadata` (`ActionStepOutcomeMetadata` doc). A step-1 near_miss therefore plants the appointment and the join, and the action lands on success_at_cost. That is correct: the lining stood.

## 4. Aftermath Supportability

**(a) Membership in rural envelopes (the author's FLAG), settled: the join lands on every settlement class.**

- `worldSeed.ts:2094` passes the whole `FACTION_DEFINITIONS` map to `seedAllFactions`. `builders_fellowship` is single-instance (no `instanceCount`), so it seeds one node.
- `findQualifyingLocations` (`factionSeeding.ts:97`) places its halls in town/city/capital. If a world has none, it **falls back to any hamlet+**. It skips the faction only in a world with no settlement at all, and this encounter cannot run in such a world, because `rural`/`urban` expand only to hamlet, farmland, mining, town, city and capital.
- `joinFaction` → `resolveFactionNodeId(graph, 'builders_fellowship', agentId)` (`factionMembership.ts:105`). It scans `factionDefId` and returns at the `candidates.length === 1` short-circuit, **independent of where the agent stands**. A hamlet run therefore enrols the mortal in the one Fellowship, whose halls stand in some town. The fiction supports this: a mason vouching someone onto a guild's rolls does not need a hall on the plot.
- The only non-landing outcome is `already_member` (idempotent; `failMembership` trace). The chip ("{actor} is on the rolls of the Builders Fellowship now") is still true in that case, so no chip claims state that was not written.

I considered narrowing to `urban` or swapping to `story_seed` and rejected both: the chip is state-backed on every class. `resolveFactionNodeId` returns null (the `faction_not_found` trace) only if the node was removed during play, and no faction phase calls `removeNode` on a faction (grep of `phaseFactionSuccession`, `factionSuccessionOps`, `phaseFactionActions`). No change was needed.

The membership write does not mask the reputation write. `getReputationWith` reads membership first only for the *same* faction (the toll-of-blades fix #1). Here `reputation_with` targets `$here` (a Location), so the two writes are independent.

**(b) The `#build` tag.** `#build` (catalog: "something to be raised or mended where people will use it", 21 members) makes this encounter a candidate for the Mason's Commission's placeless `#build` query sequel ("the works office sends for the mason when the next work is let"). **Acceptable.** The encounter stands alone: its opening introduces the well, the reeve and the fee from nothing, and it asserts no prior visit or relationship. A query seed also keeps the family eligibility filter, so it only lands where `rural`/`urban` accepts the subtype. Being sent for and then being handed a well to sink is an honest continuation of "more building work". Keep the tag.

**(c) Rule 34 / THR-1479 sweep (every later-tense sentence):**

| Sentence | Path | Enacting effect |
|---|---|---|
| Spine: "The rest will be paid at the well on the day its water runs clear." | all (a conditional statement of the contract's terms) | the appointment on every lined-well band. The condition (clear water) is met only where the appointment exists |
| PATH chips: "{cast:reeve} pays the rest at the well when its water runs clear." | crit / success / at-cost | the `encounter_seed` + `appointment { $here, $cast:reeve, missed }` in step 1 `successMetadata` (fires on every success-side step outcome, near_miss included) |
| kept seedLabel "…paid at the new well on the day its water runs clear." | same | same |
| missed seedLabel "…the reeve comes looking with the money held back." | missed branch | `town.well_gone_foul` fires wherever the mortal stands, which is the "other party finds them" truthful shape |
| Step 1 spine: "An unlined shaft will fall in before morning." | scene fact (weather), not a constraint on the mortal | n/a |
| narrativeTemplates.success "…the rest of the fee is paid at the well when its water runs clear." | success side | the appointment |

Unbacked promises cut: none were forward-looking. One rule-31 assertion was cut ("starts the wait … short of money", since no money state is written).

The appointment has both branches. **BLOCK condition not met.** Both sequel ids are currently `dead_template` (scratch `check:encounter`, `[liveness]` ×2) until the orchestrator authors them.

**(d) Omen.** Both `emit_omen` writes (life on success, entropy on failure; cultural, global, 0.3) ride step 1. None fires on the step-0-critical path, and no chip claims one. The hook text now says "the people who paid for it" so it reads true for an urban street.

## 5. Chip referents

- reputation → `$here` (Location, linked; `ui.reputation_with` and `ui.standing` both exist in `src/data/ui-content.ts`).
- a guild membership → `$faction:builders_fellowship` (faction, linked; definition ships and the node always exists, see 4a). Kind `faction_reputation` classifies to `standing` → BOND (`buildAftermathConsequences.categoryForKind`), which matches its declared category.
- appointment → `$appointment` (THR-1518; legal because the template plants an appointment; resolved off the `owes_favor` edge). Because the seed rides step metadata, not a reaction, the engine-derived seed chip (which scans reaction effects only) does not also render, so there is exactly one PATH chip.
- growth fallback → `reach.stone` (tooltip exists).
- Image tags `generic.memory`, `generic.matter`, `generic.ward` and `generic.warmth` all resolve in `encounter-image-library.ts`.

## 6. New Hooks Needed

None in the parent. The orchestrator owns the sequels (see § 7).

## 7. Implementation File Map

The parent is only the compiled set (package → module, test, registrations). The orchestrator must also handle the following:

1. **`src/data/encounters/well-first-water.ts`** (`town.well_first_water`) and **`well-gone-foul.ts`** (`town.well_gone_foul`): seed-only (`drawable: false`), registered where `hunt.trail_cold` is (`monster-encounter-content.ts:995` precedent) or an equivalent pool.
2. **`src/data/content-objects.ts`**: add `'town.'` to the `encounter_template` kind's `idPrefixes`. The `hunt.` prefix was added for exactly this reason. Without it, `contentObjects.test.ts` fails "unified ids claimed by NEITHER the encounter nor the action kind" as soon as the sequels register. Then regenerate `content-objects.generated.md` (`npm run generate-content-objects`).
3. Re-run `check:encounter -- encounter.town.well_sinking` after registration. The two `[liveness]` rows must clear.

## 8. Verdict

**READY WITH CAVEATS.**

1. The two sequels must be authored and registered, with the `town.` prefix claimed, before `check:encounter` goes green.
2. Live proof: pin `success` on a **rural** seed and read the `aftermath_membership_change` trace, which proves the hamlet join. Also pin `critical_failure` and confirm the step-0 `reputation_with` trace.
Settled rather than left as a caveat: the missed branch inherits the parent's cast. `encounterSeeding.ts:627` builds the missed seed as `{ ...seed, templateId: missed.templateId, … }`, so the inherited context survives and `{cast:reeve}` / `{cast:wright}` bind in `town.well_gone_foul`. It also calls `breakAppointmentFavour`, so the sheet shows the broken promise.

## 9. Primitive Disposition

No missing primitives identified.
