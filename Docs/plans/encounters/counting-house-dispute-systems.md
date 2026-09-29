# Encounter Pipeline: The Counting-House Dispute
> Scale: local | Slug: counting-house-dispute | Pass: systems
> Date: 2026-09-29 | Pipeline version: 2.0 (Factory v3 critic, batch journeyman-everyday-1 slot 4)

Audited against the package after the editorial edits.

## 1. Support bundle honesty

| Key | Reuse / spawn | Class-honest across `urban` (town · city · capital)? | Verdict |
|---|---|---|---|
| `founder` (added this pass) | reuse `smith` / spawn `smith` "Ide Brannock" | `smith` seeded at town 0.9, city 1.0, capital 1.0 (`LOCATION_ROLE_ROSTERS`) | honest; prose never genders the founder |
| `aldane` | reuse `merchant` / spawn `merchant` | merchant 1.0 at all three | honest |
| `corrow` | reuse `trader` / spawn `trader` | trader 0.8–0.9 | honest (spawn covers the gap) |

All `lazy-materialize-on-trigger`, `must-persist` — the favour debtors must persist for the
`owes_favor` edge to mean anything. Realistic.

## 2. Missing primitives — none

`ActionStepBranch.decidedBy` (THR-894) is live: `applyAgentDecidedBranches` in
`unifiedActionResolution.ts` decides the fork after step 0 resolves; `poleLean` on the two
step-0 specials is summed by `encounters/poleLean.ts`. The player has no choice surface on the
fork — verified in the package: no `authoredChoices`, no card whose effect is a ruling.

## 3. Runtime feasibility

Two steps, step 0 `continue_weakened` → fork arms `fail_action`, `fallback` arm authored.
`aftermathConfig.branchOnStep: 0` matches the fork's `branchOnStep: 0`. Six bands authored per
arm (crit success, success, success_at_cost, failure, crit failure; near_miss routes to the
success side per `isStepSuccess`).

## 4. Aftermath supportability

| Effect | Where | Resolves? |
|---|---|---|
| `attachment_grant` `reward_tomes_scrolls_letters_of_introduction` → `$actor` | positive arm success side | yes (`reward-attachment-catalog.ts`) |
| `attachment_grant` `reward_arms_assessors_weighted_scales` → `$actor` | negative arm success side | yes |
| `favor_creation` debtor `$cast:corrow` / `$cast:aldane` | success side | yes — cast sentinel binds `supportBindings[key]` |
| `reputation_with` `$cast:aldane` / `$cast:corrow` −0.08 | failure side | yes |
| `reputation_with` `targetLocationId: $here` +0.08 | crit-success reaction | **yes, and now rendered honestly.** `$here` binds the actor's `located_at` and walks up via `resolveToParentLocation` when the field wants a Location (`SCENE_SENTINEL_FIELDS.targetLocationId = 'location'`), so the write lands on the town even if the mortal stands at a Place inside it. The old intent used `{location}`, which enriches from the raw `located_at` node (`getAgentLocation`) and could name a tavern while the standing landed on the town; it also promised future quarrels the engine never routes. The intent now names only "the town" and the standing change. |
| `hidden_mark` `secret_knowledge` on `$actor` | crit-success reaction | yes (valid `HiddenMarkCategory`; `hiddenMarks.ts` reads by category) |

**Later-tense promises (rule 7b):** P3 "The house that wins will pay the arbiter and owe a
favour besides" → enacted by `attachment_grant` + `favor_creation` on the success side. ✓.
"goes to the magistrate" is a closure statement about offscreen NPCs, not a binding on the
mortal. "gave the house a season to pay" (neg success_at_cost) is a fictional term of the
ruling, binding no one the engine tracks — accepted. The "nobody will ask them again this
season" sentences were cut (unenforceable, and re-fire in the same town would contradict).

## 5. Chip referents

Every chip anchors: item chips on the granted attachment template ids (`visualKind:
attachment`), bond chips on `$cast:corrow` / `$cast:aldane` (the debtor end of `owes_favor`),
scar chips on the counterparty of `reputation_with`. No chip points at scene fiction.

## 6. New hooks needed — none.
## 7. Implementation file map — compiled set only (`compile:encounter`); no hand edits.

## 8. Verdict — READY FOR IMPLEMENTATION

## 9. Primitive disposition — No missing primitives identified.

Residual note: the rolled packet system for slot 4 was `conditions`; the package touches cast,
rewards, reputation (+ favour, hidden mark) and no condition. Contract quota (≥3) is met;
the brief's own guidance steers away from a personal condition as the penalty.
