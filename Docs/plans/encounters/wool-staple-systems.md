# Encounter Pipeline: The Wool Buyers' Ring
> Scale: medium | Slug: wool-staple | Pass: systems
> Date: 2026-10-15 | Pipeline version: 2.0

Audited against `wool-staple-revised.md` (editorial verdict PASS WITH REVISIONS) and the live
data files. Every id below was checked by grep against the registry it lives in.

## 1. Support Bundle Honesty

| Object | Claim | Verified |
|---|---|---|
| `buyer` | lazy-materialize, must-persist, reuse merchant/trader/broker, spawn `merchant` | `merchant` is the most-used spawn role in `src/data/encounters/` (17). Must-persist is required: the seed inherits it. Honest. |
| `mayor` | lazy-materialize, must-persist, reuse official/elder/noble, spawn `official` | `official` is a live spawn role (4 uses). Must-persist is required: it is the treaty counterparty. Honest. |

## 2. Missing Primitives

None. Every mechanic used is live: two linear steps, `continue_weakened` / `fail_action`,
`carryoverFactorLines`, `deal` fills, `opposes` on a special, `attachment_grant` (possession and
agreement with `counterpartyId`), `encounter_seed` by `templateId` with `inheritContext`,
`reputation_with $here`, `bond_change`. No `authoredChoices`.

## 3. Runtime Feasibility

- Beats: two, linear. Supported.
- Outcome ladder: `branchOnStep: 1`, fallback `byOutcome` keyed on cs / s / sac / f / cf (all
  in the seven-value `UnifiedActionOutcome`). `near_miss` lands on the success side, so a
  near-miss sale fires `successMetadata` (silk, seed, +0.08) and the `success` page reads true
  ("The town's wool is sold").
- A step-0 critical_failure ends the action. That route carries only step 0's
  `failureMetadata` (town −0.05), which backs the critical_failure page's one chip. Its
  overview ("half the town's clip went back to the sheds unsold") agrees with step 0's cf
  afterimage (the buyers left the market).
- Hands: two specials + `deal.count: 4` per step. `check:encounter` reports the composed hand
  clean (no warnings).

## 4. Aftermath Supportability

| Write | Fires on | Backs |
|---|---|---|
| `attachment_grant reward_vestments_merchant_silks → $actor` | step 1 success side | BOON · Merchant Silks on cs / s / sac |
| `encounter_seed encounter.town.bell_at_the_exchange`, delay 72, inheritContext | step 1 success side | PATH · seed on cs / s / sac |
| `reputation_with $here +0.08` | step 1 success side | BOON · reputation with {location} |
| `reputation_with $here −0.10` | step 1 failure side | SCAR · reputation with {location} (f / cf) |
| `reputation_with $here −0.05` | step 0 failure side | SCAR on the step-0 cf route |
| reactions: `agreement.treaty.trade` (counterparty `$cast:mayor`), `bond_change $cast:buyer` / `$cast:mayor`, `reputation_with +0.04` | chosen reaction | the reaction's own intent |

**Later-tense promises (rule 7b).**
- Step 1 spine "the town will blame the one the guild sent" → enacted by `reputation_with
  $here −0.10` on the failure side.
- PATH chip "{cast:buyer} will come to bid against {actor} again" and the seedLabel → enacted
  by the placeless seed; the factor *finds* the mortal, no place is promised. The target's
  opening places the scene on an exchange floor in `{location}`; a `templateId` seed skips the
  eligibility filter, so it fires wherever the mortal stands. This is the same accepted shape
  as `salt-monopoly` → `mill_lease_auction`.
- Reaction "The mayor holds the paper / holds the guild to it" → the treaty agreement edge with
  `$cast:mayor`, 96-tick term. Nothing promises the engine sells wool later (Pass 2 removed
  that line).
- No appointment is needed or implied.

## 5. Chip referents resolve

| Chip | Referent | Resolves |
|---|---|---|
| Merchant Silks | `reward_vestments_merchant_silks` (possession, tier 1, `#gold #cloth #commercial #trade`) | yes — `src/data/reward-attachment-catalog.ts`; used by no other encounter |
| reputation with {location} | `$here` | yes — sentinel |
| seed | carrier `$actor`, concept `$cast:buyer` | yes — must-persist cast; seed target `encounter.town.bell_at_the_exchange` is registered, drawable, gold, urban, rarity 2, cast key `buyer` |

The target's prose never genders `{cast:buyer}`, so any inherited factor reads correctly.

## 6. New Hooks Needed

None. No new roles, conditions, items, tags or node types.

## 7. Implementation File Map

Beyond the compiled set (`compile:encounter` emits the module, its test and both
registrations — orchestrator-owned for this batch):

- `src/data/content-eval/plotHooks.ts` — stamp `usedBy` on `hook.negotiation_under_pressure`
  at closeout (orchestrator).
- THR-1526 seed pins (`encounter-contract-migration.test.ts`, seed-liveness pins) if the gate
  asks for a row for this seed after compiling (orchestrator; brief § mechanics that bit).
- Concept art `public/concept-art/encounters/wool-staple.jpg` per the art direction (optional
  for this batch, orchestrator's call).

## 8. Verdict

**READY FOR IMPLEMENTATION**

Private gate run on the package: `✓ encounter.town.wool_staple [systems: cast, rewards, seeds,
reputation]`, 0 warnings, OK.

## 9. Primitive Disposition

No missing primitives identified.
