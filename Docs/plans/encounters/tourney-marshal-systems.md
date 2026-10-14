# Encounter Pipeline: The Tourney Marshal
> Scale: short | Slug: tourney-marshal | Pass: systems (cold critic, master-everyday-2 slot 4)
> Date: 2026-10-14 | Pipeline version: 2.0
> Audited: `tourney-marshal.package.json` after the editorial fixes.

## Verdict: READY WITH CAVEATS

Every id, condition, trait, role, image tag, tooltip and sentinel resolves in code. The caveats are design limits the author already named, verified here against the engine.

## 1. Support bundle honesty

| Object | Claim | Evidence | Verdict |
|---|---|---|---|
| `heir` (Aldric Fenmoor) | lazy-materialize, reuse `noble`, spawn `noble`, must-persist | `'noble'` in `NpcRole` (`src/types/npc.ts:45`) | honest. The favour debtor, Wounded carrier and bond target must persist, and does |
| `champion` (Brannoc Vell) | lazy-materialize, spawn `warrior_priest`, no reuse | `'warrior_priest'` in `NpcRole` (`src/types/npc.ts:89`) | honest. Disjoint from `heir`, so the two never bind one NPC |
| `$here` | Festival + reputation | standard sentinel, `apply_condition.targetLocationId` and `reputation_with.targetLocationId` both typed (`src/types/unifiedAction.ts`) | honest |
| the order, barrier, heralds | scene fiction | no faction surface touched, no chip names them | honest |

## 2. Missing primitives

None. The encounter uses linear steps, step-outcome metadata, carryover factor lines, `byOutcome` fallback bands and reactions. All live.

## 3. Runtime feasibility — the route semantics (the author's question)

- `advanceStep` (`src/engine/unifiedActionLifecycle.ts:219`): a `critical_failure` ends the action whatever `failBehavior` says, with outcome `critical_failure`. So step 0's `continue_weakened` continues on plain `failure` only.
- `computeFinalActionOutcome` (`:367`): any continued failure, `near_miss` or `success_at_cost` in the history → `success_at_cost`; any `critical_success` on a clean run → `critical_success`.
- `applyAftermathOutcomeBand` (`src/types/unifiedAction.ts:2328`) keys the page on that **final action outcome**, not on `branchOnStep`'s step.
- Step metadata fires one side per step; `near_miss` and `success_at_cost` count as success.

Consequences, all checked against the package:

| Page | Routes | Every chip backed on every route? |
|---|---|---|
| critical_success / success | step 1 success side | yes — `favor_creation`, `apply_condition` Festival, `reputation_with $here +0.06` |
| success_at_cost | step 1 success side, after any step-0 band but cf | yes — same three; on the step-0 failure route town standing nets +0.04, still a gain |
| failure | step 1 plain failure | yes — `condition_attachment` Wounded on `$cast:heir`, `bond_change` heir, `reputation_with $here −0.06` |
| critical_failure | step 0 cf **or** step 1 cf | yes — town loss and heir trust loss are written on both routes (step 0 `failureMetadata` −0.02 / −0.04·−0.05; step 1 −0.06 / −0.10·−0.12). Wounded fires only on the step-1 route, so it is correctly not chipped |

The author's note is right on both counts: the cf page cannot chip Wounded, and the sac cost cannot be a write (step effects carry no band key; the `when` predicate on effects is not an outcome predicate).

## 4. Aftermath supportability

| Write | Resolves to | Evidence |
|---|---|---|
| `condition_attachment trait.condition.wounded` → `$cast:heir` | condition template | `src/data/condition-trait-content.ts:273` (name `Wounded`, duration `CONDITION_WOUNDED_DURATION` = 24) |
| `apply_condition trait.condition.location.festival` → `$here` | location condition | `src/data/condition-trait-content.ts:454` (duration 36); same shape ships in `judicial-duel` and `cathedral-vault` |
| `favor_creation` debtor `$cast:heir` | `owes_favor` edge, debtor heir, creditor actor | `src/types/unifiedAction.ts:1147` |
| `bond_change` `$cast:heir` / `$cast:champion` | `relates_to` sentiment / trust | live, corpus-wide |
| `reputation_with` `$here` | place standing | `src/types/unifiedAction.ts:1199` |
| reaction `intelligence` `cultural_knowledge` | knowledge record | `cultural_knowledge` in the category union (`src/types/unifiedAction.ts:79`) |
| trait variants | `trait.personality.iron.virtue` (Brave), `trait.reputation.iron.negative` (Brutal Thug) | `src/data/personality-trait-content.ts` builder; `src/data/reputation-trait-content.ts:78` |
| image tags | `generic.ward`, `generic.blade`, `generic.oath`, `generic.decay` | `src/data/encounter-image-library.ts:632–688` |
| deal tags | `might`, `peril`, `presence` | worn by cards in `src/data/nudge-card-library.ts` |
| tooltip ids | `ui.favour_owed`, `ui.reputation_with`, `ui.standing` | `src/data/ui-content.ts:568–614` |

**Later-tense promises (prose rule 7b).** "The house will remember who stayed" (failure / cf reaction) → that reaction's `bond_change` heir +0.10. "The champion will remember it" (honour reaction) → `bond_change` champion +0.10. "The town will blame its marshal" (step-1 spine, a stake) → step-1 failure's `reputation_with −0.06`. The removed failure line ("will not walk without a stick again") had no enacting effect and contradicted a 24-tick condition; it is gone. No place-and-time promise; no seed; no appointment needed.

## 5. Chip referents resolve

| Chip | Referent | Anchor |
|---|---|---|
| a favour owed | the heir's `owes_favor` edge | concept `$cast:heir`, `agent` |
| Festival | `trait.condition.location.festival` on the town | `attachment` |
| reputation with {location} | town standing | `$here`, `location` |
| Wounded | `trait.condition.wounded` on the heir | `attachment` |
| reputation with {target} | the heir | `$cast:heir`, `agent`. The brief's THR-1685 caution is superseded: `buildAftermathConsequences.ts` `anchorNameFor` makes `{target}` read the person, pinned by `reputationChipNamesPerson.test.tsx`. Backed by `bond_change`, the same pairing `cathedral-loan` and `masons-commission` ship |

## 6. New hooks needed

None.

## 7. Implementation file map

Compiled set only (`compile:encounter`). Closeout: stamp `usedBy` on `hook.siege_and_hold` in `src/data/content-eval/plotHooks.ts`.

## 8. Primitive disposition

No missing primitives identified.

## Caveats

1. success_at_cost cost is prose only (no band-keyed step effect exists).
2. Wounded unchipped on the step-1 cf route (shared page with the step-0 cf route).
3. Live proof at master difficulty: take success-side evidence from a seed sweep plus a pinned band (`?outcome=<band>`); a failed natural run leaves those rows *not exercised*.

## Gate

`check:encounter --package` (private bundle `.cache/cc-tourney-marshal.mjs`): `✓ encounter.town.tourney_marshal [systems: cast, rewards, conditions, reputation]`, 0 warnings, OK.
