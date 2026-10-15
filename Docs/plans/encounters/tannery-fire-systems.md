# Encounter Pipeline: The Tannery Fire
> Scale: medium | Slug: tannery-fire | Pass: systems (master-everyday-3 slot 4)
> Date: 2026-10-15 | Pipeline version: 2.0
> Audited: `tannery-fire-revised.md` and `tannery-fire.package.json` after the editorial fixes.

## Verdict: READY WITH CAVEATS

Every id, condition, trait, role, image tag, tooltip and sentinel resolves. The gate (`node .cache/check-encounter-batch3.mjs --package Docs/plans/encounters/tannery-fire.package.json`) is green with zero warnings: `✓ encounter.town.tannery_fire [systems: cast, rewards, conditions, reputation]`. The caveats are design limits, verified against the engine and named below.

## 1. Support bundle honesty

| Object | Claim | Evidence | Verdict |
|---|---|---|---|
| `sergeant` (Hob Ketteridge) | lazy-materialize, reuse `guard`, spawn `guard`, must-persist | `'guard'` in `NpcRole` (`src/types/npc.ts:37`) | honest. Bond target on both failure routes and in a success reaction |
| `tanner` (Gerold Ashby) | lazy-materialize, spawn `merchant`, no reuse | `'merchant'` in `NpcRole` (`src/types/npc.ts:38`) | honest. Disjoint from `sergeant`; the bond write on every success side needs the node to persist, and it does |
| `$here` | `apply_condition` (`under_watch` / `plague_scare`) + `reputation_with` | both effects take `targetLocationId`; both condition ids live in `CONDITION_TRAIT_DEFINITIONS` (`src/data/condition-trait-content.ts`) | honest |
| the journeymen, hook crews, sheds, river stair | scene fiction | no chip names them | honest |

## 2. Missing primitives

None. Linear steps, step-outcome metadata, carryover factor lines, `byOutcome` fallback bands and reactions, all live.

## 3. Runtime feasibility — route semantics

- A step-0 `critical_failure` ends the action whatever `failBehavior` says; step 0's `continue_weakened` continues on plain `failure` only.
- The aftermath page keys on the **final action outcome**: any continued failure, `near_miss` or `success_at_cost` in the history makes a step-1 success read as `success_at_cost`; a clean run with a critical success reads `critical_success`.
- Step metadata fires one side per step; `near_miss` / `success_at_cost` count as success.

Route table, checked against the package:

| Page | Routes in | Chips | Backed on every route? |
|---|---|---|---|
| critical_success | clean run, step 1 success side | tanner bond, Under Watch, town regard | yes — all three in step-1 `successMetadata` |
| success | clean run | same | yes |
| success_at_cost | step 1 success after a step-0 failure / near_miss / sac, or step 1 sac | same | yes — step-1 success side fires on every route. **Fix applied here:** the editorial's sac overview asserted a fight with the hook crews that only the step-1 sac route narrates; rewritten route-neutral ("a closer thing than the watch wanted … The journeymen blame {actor} for the sheds") |
| failure | step 1 failure | Plague Scare, town regard, sergeant trust | yes — all in step-1 `failureMetadata` |
| critical_failure | step 0 cf (ends) or step 1 cf | town regard, sergeant trust | yes — both in step-0 and step-1 `failureMetadata`. Plague Scare is deliberately **not** chipped here, because the step-0 route never fires it |

## 4. Aftermath supportability

- **standing** (drawn): `reputation_with $here` ±0.06 on step 1, −0.02 on step 0 failure; reactions ±0.02. Real channel, shown as the town's regard.
- **place** (drawn): `under_watch` has a live reader (`LOCATION_CONDITION_STEP_MODIFIER`: a shadow penalty on steps resolved there), so the chip's "the watch keeps men posted" is true in play; `plague_scare` has a live reader (`LOCATION_CONDITION_MOVEMENT_TAX`, avoided multiplier), so "travellers keep away" is true in play.
- Bonds: `bond_change` to two persisted cast members.
- **Later-tense promises (rule 7b).** "The tanner may let the grudge go" (reaction intent) is enacted by the reaction's `bond_change +0.08`; "the town will ask why it should pay" by its `reputation_with −0.02`; "the sergeant will remember it" by `bond_change +0.08`; "the town will see who stayed" by `reputation_with +0.02`; "keeps the answer" by the `intelligence` record. Step 1 spine "the town will blame {actor}" is enacted by `reputation_with −0.06` on failure. No placed or timed promise; no seed.

## 5. Chip referents resolve

Every chip's `stateNoun` names an engine word: `reputation with {target}` (`$cast:tanner`, `$cast:sergeant`, agent), `reputation with {location}` (`$here`), `Under Watch` / `Plague Scare` (attachment, the conditions' own `name`). Tooltips `ui.reputation_with`, `ui.standing` are the ones master batch 2 shipped with.

## 6. New hooks needed

None.

## 7. Implementation file map

Beyond the compiled set (module, structural test, registrations — orchestrator compiles after all eight packages are green): none. `src/data/content-eval/plotHooks.ts` `usedBy` stamp for `hook.environmental_gauntlet` at closeout (orchestrator).

## 8. Caveats

1. `success_at_cost` carries the same three chips as `success`; its cost is prose only (no band-keyed step effect). Accepted, as in master batch 2.
2. The tanner's bond falls on `critical_success` too, where the tanner stood aside. Defensible (the stock is still lost); left as is.
3. Two systems-pass prose fixes carried into the package: the sac overview (above), and `stakes.risk` / `stakes.lostBadly` → "see/saw the fire burn on past the quarter until dawn" (the editorial's Consider item: the old line read smaller than the failure band's "two streets").

## 9. Primitive disposition

No missing primitives identified.

READY WITH CAVEATS
