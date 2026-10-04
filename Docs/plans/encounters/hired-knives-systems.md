# Encounter Pipeline: The Hired Knives
> Scale: short | Slug: hired-knives | Pass: systems
> Date: 2026-10-03 | Pipeline version: 2.0

**Verdict: READY WITH CAVEATS.** Every effect kind, cast spec, nudge field and aftermath
shape in the revised packet exists in the real types and has a live engine consumer. No
missing primitive. The caveats are one accepted premise-fit looseness on the second planter,
one test that must flip in the implementing PR, and three machine-gate confirmations that
only `check:encounter` can give.

Audited against: `src/types/unifiedAction.ts`, `src/types/encounter.ts`,
`src/engine/encounterSeeding.ts`, `src/engine/orchestrator/phaseDetectionPressure.ts`,
`src/engine/encounterAftermath.ts` (`bindAftermathSceneTargets`),
`src/data/condition-trait-content.ts`, `src/data/ambition-templates.ts`,
`src/data/content-tags.ts`, the Swollen Ford exemplar, and `the-infiltrators-approach.ts`.

---

## 1. Support Bundle Honesty

| Object | Claim | Verified |
|---|---|---|
| `{cast:warner}` | `lazy-materialize-on-trigger`, `must-persist`, `reuseNpcRoles: ['innkeeper','wanderer','pilgrim','hunter']`, `spawnNpcRole: 'wanderer'`, `spawnName: 'Corra Venn'`, `supportRole: 'warner'` | Every field is on `EncounterSupportActorSpec` (`encounter.ts:210`). Same shape as the exemplar's `traveler` (reuse-first, real-name spawn, never gendered). Realistic. |
| The two strangers | scene-only prose | Honest: nothing binds, nothing persists, no ending claims them. |
| The rival | off-stage, no anchor | Honest. No chip points at it. |
| Regional detection pressure | `pre-seeded`, moved by `costs.detectionDelta` | Live: `NudgeCostChannels.detectionDelta` (`unifiedAction.ts:1816`) is applied at commit through `applyDetectionDelta` (`nudgeDispatch.ts`). Not optimistic. |
| `trait.condition.wounded` | pre-seeded template | Live in `condition-trait-content.ts:273`; carries a `CONDITION_DURATIONS` term (two game days, line 705), so the omitted `durationTicks` on `apply_condition` resolves to a term (THR-1697) and the chip line "until the cut heals" is true. |
| `ambition_seek_revenge` | pre-seeded template | Live at `ambition-templates.ts:1043`; `assign_ambition` (`unifiedAction.ts:702`) is the shared-helper path. |

No optimistic claims.

## 2. Missing Primitives

None. Checked:

- **Test shaping:** `StepNudge.forecastDelta`, `traitVariants`, `carryoverFactorLines` all live.
- **Flip/reveal:** not used.
- **Task/progress carriers:** two linear steps, `failBehavior: continue_weakened` on step 1 (live, `StepFailBehavior`).
- **Prevention/interception/recovery:** the Veil / Heavy Hand pair uses `costs.detectionDelta`, live.
- **Authored choice bundles (`authoredChoices`):** not used (rejected primitive absent, correct).
- **Appointment / rendezvous:** none claimed (see § 4).

## 3. Runtime Feasibility

- **Beats / branching:** two steps, linear, `branchDepth` 0. Supported.
- **Hand rules** (compiler-enforced): each step is 2 authored specials plus `deal: { count: 4, tags: [...] }`. `DealContextTag` accepts `'shadow'`, `'peril'`, `'might'` (`unifiedAction.ts:1901`). Composed hand is 6, inside 4-8, with at most 2 specials. Every authored nudge carries a failure-band fragment (Veil: `failure`; Doubt: `failure` + `critical_failure`; Shatter: `failure` + `critical_failure`; Rouse: `failure`). Shatter (Δ 0.16 ≥ 0.15) covers both failure bands, as required.
- **Id prefix / duplicates:** all four ids share the `knives.` prefix and are unique.
- **Trait card:** `requiredTrait: 'trait.core.core_hope.vice'` paired with `traitVariants[0].addNudgeIds: ['knives.doubt_every_face']`. Both halves present; the trait id is live (hooked by `the-garrisons-price` and `wolf-winter-watch`).
- **Image tags:** `generic.dark`, `generic.focus`, `generic.rumor` (`encounter-image-library.ts:628-638`) and `generic.blade` (line 688) all resolve.
- **Step 1 critical failure ends the action:** the packet's reading (engine forces `fail_action` on any critical failure) is already pinned by the editorial and the page is written path-agnostic. Accepted.
- **Near-miss counts as step success** (`isStepSuccess`, `unifiedAction.ts:60`): step 2 near_miss fires `successMetadata` (bond up, wary compulsion). The band prose for near_miss on the cards is therefore consistent with the outcome that actually lands.
- **`drawable: false`:** seed-only. `encounterFamilyHasContent('shadow.rival_strike')` flips true because `ENCOUNTER_FAMILY_TAGS['shadow.rival_strike'] = '#rival_strike'` (`encounterSeeding.ts:122`) and the template wears `#rival_strike` (seated at `content-tags.ts:295`). `seedContentQuery` then resolves `{ kind: 'encounter_template', tags: ['#rival_strike'] }`.
- **Setting envelope:** the family-query seed keeps the draw's location-subtype filter; `settings: ['rural','urban','wayside']` means a mortal at a stronghold/sacred/arcane/ruin/battlefield site is not struck. Already accepted in the brief; the withered-seed fallback covers it.

## 4. Aftermath Supportability

**Effect kinds (all in the effect union):** `bond_change` (`:1339`, `withAgentId: '$cast:warner'` bound by `bindAftermathSceneTargets`; `sentimentDelta`/`trustDelta` shape matches), `plant_compulsion` (`:846`, `encounterBias` keys `hire trade assist duel explore steal` are all in the closed `EncounterType` union, `encounter.ts:28`), `apply_condition` (`:631`, `conditionTraitId` + `targetAgentId`), `assign_ambition` (`:702`, `templateId` + `narrativeHook` + `targetAgentId`). `$actor` is a bound sentinel (`encounterAftermath-actor-sentinel.test.ts`). Step-level `effects` are the live THR-783 channel on `ActionStepOutcomeMetadata`.

**Chip backing (Law 56):** per-band floor is met on every band. The `critical_failure` BOND chip is written by step 1 failure **or** step 2 failure `bond_change`, so it is true on both paths. The Wounded and fear chips appear only on `failure`, where step 2 `failureMetadata` is the sole path in. `success_at_cost` BOND chip (up) is true on every path: step 2 success (+0.1) net of at most step 1's strain (-0.05). Seek Revenge is reaction-borne and carries no chip.

**`Leave their anger be` (`effects: []`):** empty-effect reactions have shipped precedent (`the-beast-in-the-granary.ts`, `counting-house-dispute.ts`, `holy-order-dawn-encounter-content.ts`). Lawful. It is a stance with no chip of its own, and the band's own chips carry the page.

**Rule 7b / appointment check (every later-tense sentence):**

| Sentence | Enacting effect |
|---|---|
| "They will not wait another night." (step 1 spine) | Paid inside the scene by step 2. No cross-encounter promise. |
| "For a while they avoid hiring, trading with, or helping strangers." | `plant_compulsion` wary, `durationTicks: 72`. |
| "For a while they shy from fights and far roads." | `plant_compulsion` fear, `durationTicks: 96`. |
| "{actor} is wounded until the cut heals." | `apply_condition` wounded (term-bearing). |
| Seek Revenge intent: "They wake wanting to repay the strike, whether or not the payer is ever found." | `assign_ambition` `ambition_seek_revenge`. Promises a want, not a hunt. |
| "{cast:warner} trusts {actor} more / less" | `bond_change`. |

No place-and-time promise exists, so no `appointment` block is owed. No `encounter_seed` is authored on this template.

## 5. Chip referents resolve

| Chip | Referent | Resolves |
|---|---|---|
| SCAR compulsion (`ui.compulsion` tooltip) | the compulsion `plant_compulsion` writes | corpus precedent (`bell-at-the-exchange`, `drowned-mans-testimony`) |
| SCAR Wounded, `entityId: 'trait.condition.wounded'`, `visualKind: 'attachment'` | the condition `apply_condition` writes | catalog entry; same shape as the exemplar's `trait.condition.exhausted` |
| BOND `reputation with {target}`, anchor `$cast:warner` | the bound warner node | `bindAftermathSceneTargets` rebinds `$cast:warner`; the spec materializes if no NPC is reused, so the node always exists |

No chip points at the strangers or the rival. No finding.

## 6. New Hooks Needed

None. No new role, sublocation type, state field, node type or content entry. `warner` is a `supportRole` label on an existing `wanderer` spawn role.

## 7. Implementation File Map (beyond the compiled set)

Compiled by `npm run compile:encounter -- Docs/plans/encounters/hired-knives.package.json`
(encounter module, structural test, both registrations): not listed as hand edits.

| File | Change | Scope |
|---|---|---|
| `Docs/plans/encounters/hired-knives.package.json` | author the package from the final packet (prose byte-identical) | content |
| `src/data/content-tags.ts` | `#rival_strike` already added (done in this worktree) | done |
| `src/engine/encounterSeeding.ts` | `'shadow.rival_strike' → '#rival_strike'` already added (done in this worktree) | done |
| `src/engine/orchestrator/__tests__/phaseDetectionPressure.test.ts:139-151` | The `encounterFamilyHasContent('shadow.rival_strike')).toBe(false)` assertion goes false once the template registers. The test already says "flip this when THR-1703 authors the encounter". Repoint it to assert the gate with the `contentGate.open = false` mock only, or invert the real-check expectation to `true` | small |
| `src/engine/orchestrator/phaseDetectionPressure.ts:94-95` | remove the `TODO(THR-1703)` comment (the encounter now exists) | trivial |
| `reference/content-tag-catalog.generated.md` and the other generated companions | regenerate (`check:generated-freshness` is owed; the tag changed `content-tags.ts`) | generated |
| `public/wiki-manifest.json` source globs | `encounterSeeding.ts` / `content-tags.ts` edits may match a wiki page's `sources`; update the page or add `Wiki-freshness-exempt:` if the change is a pure alias row | check |
| `Docs/plans/2026-04-16-systemic-wiring-guide.md` | no new capability; no edit unless the seed-family alias row is judged content-facing | check |
| Concept art | residue image per § 15 (knife and coin on a post), scene tag `road.night.followed` | art, deferrable (EntityVisual fallback) |

Verification commands (owed at implementation): `npm run check:typecheck`,
`npx vitest run src/data/encounters/__tests__/hired-knives.test.ts`,
`npm run check:encounter -- encounter.rival.hired_knives`,
`npm run check:encounter-live -- encounter.rival.hired_knives`, the un-mocked
`nudgeDetectionEscalation.test.ts` case, and
`?view=game&seeded&size=medium&spawn=encounter.rival.hired_knives`.

## 8. Verdict

**READY WITH CAVEATS.**

### Caveats

1. **Infiltrator's Approach planter: accepted as a recorded caveat, no re-point.**
   The editorial routed the fit question here. Ruling: the cause sentence ("A rival sent
   them, because a god's help was seen around {actor}") is true by construction on the
   detection planter (`recordDetectionCrossings`, fired from a nudge commit that raised the
   region's pressure to the encounter band). On the Infiltrator seed
   (`the-infiltrators-approach.ts:184-190`, `encounterFamily: 'shadow.rival_strike'`,
   `seedLabel: 'The betrayed master moves first'`, `delayTicks: 30`) the *rival sent them*
   half is true (the betrayed master) and the *because a god's help was seen* half is a
   loose fit: the trigger there is the mortal's own betrayal of the master, not the god's
   noticed work. That is a mild premise mismatch of explanation, not a false state claim:
   the scene-local facts (followed for three days, asked for by name) hold on both, and no
   effect or chip depends on the cause sentence. It is not worth diluting the detection
   payoff, and I may not edit that file. Note the seed still uses the deprecated
   `encounterFamily` operand, but `ENCOUNTER_FAMILY_TAGS` now answers it, so it resolves.
   Recommended follow-up (optional, low priority, not a blocker): a later pass may change
   that seed to a literal `query` and give its target an authored cause line.
2. **Flip the `phaseDetectionPressure.test.ts` no-content assertion** in the same PR (§ 7).
   Left as-is it fails the suite when the template registers.
3. **Hand composition is a preference, not a proof.** Each step authors 2 specials and
   relies on the dealer for the other 4. The compiler enforces >=4 distinct spheres and >=1
   ungated common option on the *authored-plus-dealt* hand only at `check:encounter`
   (`checkComposedHand`). If the dealer returns fewer than 4 spheres for a god with a thin
   Repertoire, that is a gate failure to fix by an authored common card, not a design
   defect.
4. **Registration is not proven until the live check.** Tick-lifecycle behavior (seed ->
   step 1 -> step 2 under the real loop) is the THR-1703 Done-when; it is proved by
   `check:encounter-live` and the un-mocked nudge-detection case, not by this audit.
5. **Band-path under-reporting (accepted, editorial D2).** A step-1 critical failure writes
   only step 1's bond strain; Wounded and fear do not land on that path and no chip claims
   them. Path-scoped step effects would need an engine ticket. Not this encounter.

## 9. Primitive Disposition

No missing primitives identified.
