# Encounter Pipeline: The Levee Breach
> Scale: medium (3 steps, `scale: 'local'`) | Slug: levee-breach | Pass: systems
> Date: 2026-09-29 | Pipeline version: 2.0 | Audited: `levee-breach.package.json` after the editorial fixes

## 1. Support bundle honesty

There is one actor, `warden`: `lazy-materialize-on-trigger`, `must-persist`. It reuses `elder` / `guard_captain` / `guard` and falls back to spawning an `elder` named "Hale Brannock". All three roles are members of `NpcRole` (`src/types/npc.ts`), and the same reuse lists appear in `default-support-bundles.ts`. Because the spawn fallback exists, binding never fails on a settlement whose roster lacks all three. Honest. `supportRole: 'levee_warden'` is a free-text label.

**Cast-target safety (THR-1165).** No effect on any path targets `$cast:warden`: no `reputation_with.targetAgentId`, no bond, no condition. The warden is named in prose only (the spines of all three steps and the critical-success, success, failure and critical-failure overviews). A persistent write aimed at a bind-only key is therefore impossible by construction. Every persistent write targets `$actor`, `$ascendant` or `$here`.

## 2. Missing primitives

None. The encounter uses:

- carryover factor lines, which are live
- step `successMetadata` / `failureMetadata.effects` (THR-783, `unifiedActionResolution.ts`)
- `thread_strengthen` / `thread_weaken` on `$ascendant` → `$actor`
- `reputation_with` with `targetLocationId: '$here'` (`unifiedAction.ts:1160`, capped at ±`REPUTATION_WITH_MAX_DELTA_PER_OUTCOME` = 0.15, and ±0.06 and +0.03 sit well under it)
- `apply_condition` with `targetLocationId: '$here'` (THR-1143, `unifiedAction.ts:631`)
- `intelligence` with category `cultural_knowledge`, a member of `IntelligenceCategory` (`unifiedAction.ts:79`)

`$here` resolves through `resolveSceneHere` (`encounterAftermath.ts:848`), walked to the tier the field wants. A mortal in a sublocation therefore still conditions the town.

## 3. Runtime feasibility

- There are three linear steps, and `branchOnStep: 0` has no variants, so `fallback.byOutcome` resolves all five bands. `applyAftermathOutcomeBand` **replaces** `changes` per band rather than merging them, so the fallback's iron-reach growth line never renders. It is harmless and noted in the editorial pass. The `reactions` are not overridden, so every band inherits both.
- Tier is `background`, and the steps are iron 0.42 → eye 0.40 → iron 0.45: every one is at or under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45), and the mean is 0.423. Forecast arithmetic: the largest step-2 total is 0.45 + 0.12 + 0.10 = 0.67 before the dealt fill, which `check:encounter` accepts.
- Aggregation (`computeFinalActionOutcome`, `unifiedActionLifecycle.ts:318`):
  - Any continue-weakened failure on step 0 or 1, or any success-at-cost or near miss on any step, produces `success_at_cost`.
  - A critical on a clean run produces `critical_success`.
  - Step 2 is `fail_action`, so `failure` and `critical_failure` come only from step 2.
  - The success-at-cost overview was rewritten in editorial to hold on all six paths.
- `isStepSuccess` counts `near_miss` as a success, so a step-2 near miss fires `successMetadata` (thread up, reputation up) and lands in the success-at-cost band. That band now shows both chips. Consistent.
- `critical_failure` on step 2 fires `failureMetadata`, so the harvest, reputation and thread writes land on both failure bands. Consistent with both bands' chips.

## 4. Aftermath supportability / later-tense promises (rule 7b)

| Sentence | Enacting effect |
|---|---|
| "If it goes, the harvest goes" (step-2 spine) | `apply_condition trait.condition.location.harvest_blight` on `$here`, step-2 failure side |
| "{location} will blame {actor}" (step-2 spine) | `reputation_with $here −0.06`, step-2 failure side |
| "the town will hear who ran" (step-1 spine, the warden's threat) | the same `reputation_with −0.06` on failure. On success the threat simply isn't carried out, and it is a character's line, not a narrator's promise |
| "{location} will go short this winter" (the two Blighted Harvest chips) | `harvest_blight`, 240 ticks, intensity 0.6 |
| "{location} thinks well / less of {actor} now" (reputation chips) | `reputation_with $here ±0.06` |
| "The thread to {actor} runs stronger / thinner" | `thread_strengthen` / `thread_weaken` |
| "What the night showed about the bank stays with the mortal" (reaction intent) | `intelligence` record "The Levee's Weak Place" |
| "the town marks who stayed" (reaction intent) | `reputation_with $here +0.03` |
| "The fields below it will be cut at harvest" (drafted success overview) | **none**, removed in editorial |

There is no place-and-time promise and no seed, so no appointment is needed.

**Harvest Blight has readers.** Its readers are the location movement tax (`LOCATION_AVOIDED_MULTIPLIER`, `condition-trait-content.ts:778`) and the location-condition gates, and its `name` is "Blighted Harvest", which is the chip noun. `durationTicks: 240` overrides the default `CONDITION_HARVEST_BLIGHT_DURATION` (480): half a default blight for a single flooded field. That is an authored choice, not an error.

**Thread caveat, the same as batch 1.** `thread_strengthen` / `thread_weaken` skip with `thread_mutation_skipped` when the actor has no thread edge to the ascendant (`encounterAftermath.ts:4041`). A background-drawn, unthreaded mortal therefore resolves the encounter with no thread write. But the player sees an aftermath only for threaded agents, and every such agent has the edge, so no visible thread chip is ever unbacked.

## 5. Chip referents

| Chip noun | Referent | Resolves? |
|---|---|---|
| `thread` (all five bands) | the thread edge `$ascendant` ↔ `$actor` | yes, named (`ui.thread` tooltip, `ui-content.ts:458`) |
| `reputation with {location}` (all five bands, success at cost added this pass) | the actor's standing with `$here` | yes, location, linked (`entityId: '$here'`, `ui.reputation_with` at `ui-content.ts:423`, concept `ui.standing` at `:384`) |
| `Blighted Harvest` (failure, critical failure) | the condition node on `$here` | yes, the `trait.condition.location.harvest_blight` template (`condition-trait-content.ts:509`), attachment |
| iron reach (fallback growth, never rendered) | reach | `reach.iron`, built from `reach.${reach}` in `DomainCard` / `CardFace` |

**Other ids checked:**

- image tags: `generic.matter`, `generic.light` and `generic.strength` are members of `NUDGE_CONCEPT_ART` (`encounter-image-library.ts:628–642`). `generic.focus`, the mind plate on a time card, was corrected to `generic.time-slow`.
- deal tags: `might`, `labor`, `insight` and `peril` all appear in the card library's `contextTags`.
- spheres: `matter`, `light`, `force`, `time`.

## 6. The binding consequence hand in context

`check:encounter` recomputes the hand from id + reach + rarity, and the dry-run's generated test stamps `['thread', 'place']`. No swap.

- **thread**: `thread_strengthen` on the step-2 success side and `thread_weaken` on its failure side. The thread is shown on all five bands. Wired.
- **place**: `apply_condition harvest_blight` on `$here`, on the step-2 failure side only.

**The author's doubt, judged.** The brief asks for "a town whose levee held *or* broke". The only honest location conditions for the success side are `festival` (batch 1 spent it, and a feast because the levee held is a stretch) and `welcoming` (the road-worth-travelling trait, which does not fit either). A town whose levee held is, honestly, the same town it was.

The success side is still not empty. It writes `reputation_with $here +0.06`: the place changes its mind about the mortal, even though it does not change as a place. `check:encounter` counts the family as present, and the anchor table in the brief ("slots 2 and 3 leave a condition on the town") is met on the failure side.

**Acceptable as wired.** A condition minted only to make the success side symmetric would be the invented state the rules forbid.

## 7. New hooks needed

None.

## 8. Implementation file map

The compiler-owned set only (`compile:encounter`: the encounter module, its structural test, and both registrations). No engine, type or art work is needed.

## 9. Verdict

**READY FOR IMPLEMENTATION.**

- `check:encounter`, run with the scratch checker on the unregistered package (a bundle built earlier today from this worktree's `scripts/check-encounter.ts`): clean, **0 warnings**. The systems it counted are cast, rewards, conditions and reputation.
- `compile:encounter --dry-run`: exit 0.

## 10. Primitive disposition

No missing primitives identified.
