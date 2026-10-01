# Encounter Pipeline: The Failing Dyke
> Scale: medium | Slug: flood-dyke-mending | Pass: systems
> Date: 2026-10-01 | Pipeline version: 2.0
> Audited: `flood-dyke-mending-revised.md` (editorial PASS WITH REVISIONS, loop 1)

## 1. Support Bundle Honesty

- **`ganger`** — `lazy-materialize-on-trigger`, `must-persist`, `reuseNpcRoles: ['wanderer']`, `spawnNpcRole: 'mason'`, `spawnName: 'Tam Hesketh'`, `supportRole: 'dyke_rival_ganger'`. Both roles are in `NpcRole` (`src/types/npc.ts`). The `rural` envelope expands to `hamlet · farmland · mining` (`src/data/settingClasses.ts:58`); only `hamlet` has a roster, and it seeds `wanderer` at 0.2. Everywhere else the spec spawns a mason, which reads correctly at all three subtypes. Class-honest. Same shape as `wolf-winter-watch` (reuse + spawn fallback).
- The reeve is a role noun with no binding. Correct: the bond reactions write onto the crew's leader only, and no chip names the reeve.
- `must-persist` is required: two reactions write `bond_change` onto `$cast:ganger`.

## 2. Missing Primitives

None. Everything used is live:

| Need | Primitive | Precedent |
|---|---|---|
| query prize | step `successMetadata.rewardPool` + `tagFilters` | `pawnbrokers-strongroom` (`#stealth`) |
| sequel by family | `encounter_seed.query` | `the-stones-judgement.ts:238` (`#fellowship_errand`, same tag) |
| place | `apply_condition` `trait.condition.location.harvest_blight` on `$here` | `levee-breach.ts:300` (same id, same intensity) |
| standing | `reputation_with` `targetLocationId: '$here'` | `wolf-winter-watch`, `pawnbrokers-strongroom` |
| bond reactions | `bond_change` `withAgentId: '$cast:…'` | `wolf-winter-watch` |
| carryover lines | `carryoverFactorLines` per StepOutcome | `wolf-winter-watch` |
| rival card | `opposes: 'ganger'` (a declared cast key) | `wolf.twist_a_tale` |

## 3. Runtime Feasibility

- Three plain steps (contract ceiling 3). Steps 0–1 `continue_weakened`, step 2 `fail_action`.
- **Band routing (`unifiedActionLifecycle.ts` § determine overall outcome):**
  - critical_success / success: clean run; step 2 `successMetadata` fires.
  - success_at_cost: any failure/near_miss/s@c at steps 0–1, or s@c/near_miss at step 2, then a step 2 success-side result. Step 2 `successMetadata` fires (near_miss counts as success). Steps 0–1 may also fire their −0.02.
  - failure: only a plain failure at step 2. Step 2 `failureMetadata` fires (Blighted Harvest, −0.06).
  - critical_failure: a critical failure at **any** step ends the action. Step 0 route → −0.02; step 1 route → −0.02 (plus step 0's if it also failed); step 2 route → −0.06 **and Blighted Harvest**.
- Hand arithmetic: each step is 2 specials + `deal.count` 3 = 5, inside 4–8. Specials' Δ sum per step ≤ 0.20; difficulty + full hand stays under 1 at 0.68 + 0.20 + dealt fill, which the dealer clamps under `NUDGE_HAND_MAX_TOTAL_DELTA`.
- `deal.tags` all in the closed 12: `insight`, `labor`, `craft`, `peril`.
- Image tags all resolve in `src/data/encounter-image-library.ts`: `generic.memory`, `generic.matter`, `generic.vigor`, `generic.luck`, `generic.ward`, `generic.energy`.
- Trait refs: `trait.mastery.steadfast` (`mastery-trait-content.ts:173`, "Steadfast"), `trait.reputation.stone.negative` (`reputation-trait-content.ts:407`, "Immovable Tyrant"). Both live, both already used by shipped content.

## 4. Aftermath Supportability

**Every chip, every route (Law 56):**

| Band | Chip | Backed on every route? |
|---|---|---|
| crit / success / s@c | BOND reputation gain | yes — step 2 success writes +0.06 on every route into these bands. On the s@c route through steps 0–1 failures the net is +0.02 or +0.04: still a gain. |
| crit / success / s@c | PATH seed | yes — step 2 success plants it |
| crit / success / s@c | PRIZE | yes — step 2 `rewardPool` (engine-rendered) |
| failure | SCAR Blighted Harvest | yes — the band has one route, and it writes the condition |
| failure | BOND reputation loss | yes — −0.06 |
| critical_failure | BOND reputation loss | yes — −0.02 / −0.02 / −0.06 on the three routes |

**Accepted asymmetry (editorial's "consider").** A critical failure at step 2 writes Blighted Harvest with no chip on its band, and a critical failure at step 0 or 1 writes none. The revised critical_failure page claims only the breach and the reeve's blame, so nothing on it lies. Chipping the condition on critical_failure would be unbacked on two of three routes; writing it on steps 0–1 would blight villages whose dyke was then mended. There is no band-keyed step write (same limit recorded in `pawnbrokers-strongroom-systems.md`). Accept.

**Later-tense promises (prose rule 7b), each with its effect:**

| Sentence | Path | Effect that enacts it |
|---|---|---|
| "If it breaks, the river will drown the winter wheat." (spine) | failure | `apply_condition` Blighted Harvest |
| "By morning, the village will know whose work held." (step 2 spine) | both | `reputation_with $here` ± on step 2 |
| "Food in {location} will run short this year." (SCAR) | failure | Blighted Harvest ("Food is short, prices climb") |
| "…their leader will remember it kindly" / "will not forget it" / "hears of it" (reactions) | reaction | `bond_change` ±0.12 |
| seedLabel "…has work for them." | success side | `encounter_seed` query `#fellowship_errand` |
| PATH chip "Word reaches the Builders' Fellowship, which has work for {actor}." | success side | same seed — **but see finding S1** |

**Finding S1 — a query sequel can wither.** A `query` seed keeps the family draw's eligibility filter at fire time (`encounterSeeding.ts`, THR-1497). The five `#fellowship_errand` members accept `town · city · capital`, and one (`bf.quest.lay_foundation`) also `hamlet`. A mortal standing in farmland or a mining camp when the seed ripens gets the withered narrative event instead. So the chip's "which has work for {actor}" promises a sequel that may not arrive. **Fix (applied in final):** the chip states what is true the moment the seed is planted, and promises nothing about delivery: detail "Word of {actor}'s work reaches the Builders' Fellowship." The `seedLabel` stays (it is the sequel's own label and reads on both the fired and the withered event). `query` is kept over a `templateId`: the brief and the batch prefer it, and a fellowship errand at a town is exactly where a travelling mason is likely to be.

**Finding S2 — corpus proximity (not a defect; reported).** `encounter.town.levee_breach` (THR-1677, journeyman iron, rural/urban) is a river-against-a-bank night with an investigation step, `harvest_blight` on `$here` on failure, `reputation_with $here`, and an Eye special named **Show The Leak**. This encounter is stone/expert with a different decision and payoff (an old culvert to rebuild, a rival crew, a tag-drawn prize, a fellowship sequel), but the place write is identical and step 0's matter special "Draw Out The Leak" is a near-twin name and question. **Fix (applied in final):** the special is renamed **Raise Hidden Water** with an effect line naming a different mechanism (ground water pulled up, not light on a seep). The shared `harvest_blight` write is what the brief's `place` hand plus a flood premise produce; there is no other honest location condition for a drowned field. Flag to the orchestrator for the batch report.

**Seed handoff.** `#fellowship_errand` members (`builders-fellowship-encounter-content.ts`) are Builders' Fellowship postings — repair a wall, lay a foundation, forge tools. A mason who rebuilt a culvert being offered fellowship work is coherent, and the label names the cause.

## 5. Chip referents resolve

| Chip | Referent | Ref kind |
|---|---|---|
| BOND gain / loss | `$here` | location `WorldRef`, `visualKind: 'location'` |
| PATH seed | `$actor` (the carrier) | agent `WorldRef` |
| SCAR Blighted Harvest | `trait.condition.location.harvest_blight` | condition (`attachment`), written onto `$here` by this band |
| PRIZE | the drawn possession | engine-rendered |

All referents exist after the band resolves. No `{target}` in any chip (THR-1685 avoided: nouns use `{location}`).

## 6. New Hooks Needed

None.

## 7. Implementation File Map

Compiled set only: `Docs/plans/encounters/flood-dyke-mending.package.json` → `src/data/encounters/flood-dyke-mending.ts`, `src/data/encounters/__tests__/flood-dyke-mending.test.ts`, both registrations (orchestrator runs the real compile). Beyond it: concept art per § 17; `src/data/content-eval/plotHooks.ts` `usedBy` stamp for `hook.harvest_reckoning` at closeout (orchestrator); regenerated census/coverage artifacts. No engine, type or support-bundle edits.

## 8. Verdict

**READY FOR IMPLEMENTATION.** Two findings, both fixed in the final (S1 chip wording, S2 card rename). One accepted limitation (critical_failure write asymmetry).

## 9. Primitive Disposition

No missing primitives identified.
