# Encounter Pipeline: The Returned Heir
> Scale: medium | Slug: returned-heir | Pass: systems
> Date: 2026-10-15 | Pipeline version: 3.0 | Batch: master-everyday-3 slot 1 (THR-1840)

Input: `returned-heir-revised.md` (editorial verdict PASS WITH REVISIONS, 25 edits, all applied to `returned-heir.package.json`).

## Verdict

**READY WITH CAVEATS.** Every declared object resolves against code, every chip is backed by an effect on every route into its band, and the package gates green. The caveats are below and none blocks implementation.

## 1. Support bundle honesty

| Object | Check | Result |
|---|---|---|
| `claimant` (`wanderer`, must-persist) | NpcRole `wanderer` exists (`src/types/npc.ts`); bound at encounter start (`resolveActorSupportViaBinder`, `stepIndex: 0`) | ok |
| `steward` (`steward`, must-persist) | NpcRole `steward` exists; bound at start, so the failure-band reaction `bond_change $cast:steward` resolves even on the step-0 critical-failure route | ok |
| Kept sequel `town.returned_heir_sworn` | `src/data/encounters/returned-heir-sequels.ts`, registered in `unified-action-templates.ts` beside `EASTER_RECKONING_SEQUELS`; `drawable: false`; no envelope | ok |
| Missed sequel `town.returned_heir_defaulted` | same file; writes only to `$cast:claimant`, never `$here` (pinned by `returned-heir-sequels.test.ts`) | ok |

## 2. Effects by route (Law 56)

| Band | Routes in | Effects that fired | Chips claimed |
|---|---|---|---|
| critical_success / success / success_at_cost | step 1 succeeded (step 0 any non-crit-fail band) | claimant bond +0.12/+0.10, `$here` +0.06, appointment seed; possibly step-0 failure's −0.08 claimant / −0.02 `$here` before it (net still positive) | town gain, claimant trusts, appointment |
| failure | step 1 failed (plain) | claimant bond −0.12/−0.10, `$here` −0.06, `agent_relocation` away ≥3 | town loss, claimant blames, travelling away |
| critical_failure | step 1 crit-failed **or** step 0 crit-failed (action ends) | step-1 route: as failure; step-0 route: claimant −0.08/−0.06, `$here` −0.02 | town loss, claimant blames (no road chip — the step-0 route never relocates) |

Reactions: success side claimant +0.04 or `$here` +0.03; failure side claimant +0.04 (net still negative, the BLAME chip stays true) or steward +0.04/+0.04. No reaction contradicts a chip.

## 3. Appointment

`encounter_seed` on step 1 success: `templateId: town.returned_heir_sworn`, `delayTicks: 36`, `inheritContext: true`, `appointment: { locationId: '$here', counterpartyId: '$cast:steward', missed: { templateId: 'town.returned_heir_defaulted' } }` — the exact shape of the shipped `easter-reckoning` appointment. The PATH chip anchors `$appointment` with `visualKind: location` (THR-1518 precedent). The step-1 spine names the place and day; that is prose rule 7b's lawful exception on this seed's path only.

**Movement does not fight the appointment.** The relocation fires only on step 1 failure, where no seed is planted. A success-side relocation would have walked the master away from `$here` during their own appointment window.

## 4. Consequence hand

`check:encounter` recomputes relationship + movement from the id and finds both wired (`bond_change`, `agent_relocation`). No swap.

## 5. Caveats

1. **The prebuilt batch bundle cannot see the sequels.** `node .cache/check-encounter-batch3.mjs --package …` fails liveness on `town.returned_heir_sworn` / `_defaulted` because the bundle was built before `returned-heir-sequels.ts` existed. A private bundle of the same script built after the sequels landed (`.cache/check-encounter-slot1-returned-heir.mjs`, same esbuild flags as the npm alias) gates the package green. The orchestrator's post-batch rebuild clears it.
2. **`encounterSeedLiveness.test.ts` › "every non-drawable template has a planter"** fails until the parent is compiled and registered: the two sequels exist, their planter does not yet. Clears at compile.
3. **success_at_cost writes no extra state.** The cost (the uncle's bribery charge) is prose in the afterimage and overview. Same as the shipped batch-2 appointment; the engine cannot key a step's success metadata to one success band.
4. **Steady-state live proof is not exercised here** (no compile, no registration of the parent, per the batch rules). `check:encounter-live` belongs to the orchestrator after compile; at master difficulty read success-side rows on a failed run as *not exercised*.

## 6. Implementation file map

| File | Owner | State |
|---|---|---|
| `Docs/plans/encounters/returned-heir.package.json` | this pass | written, gated green (private bundle) |
| `src/data/encounters/returned-heir-sequels.ts` | this slot | written |
| `src/data/encounters/__tests__/returned-heir-sequels.test.ts` | this slot | written, 4/4 pass |
| `src/data/unified-action-templates.ts` | this slot (sequel lines only) | +1 import, +1 spread, +1 comment |
| `src/data/encounters/returned-heir.ts` + its test + registration | orchestrator (`compile:encounter`) | not created, by rule |
| `src/data/content-eval/plotHooks.ts` `usedBy` (hook.meeting_to_keep) | orchestrator at closeout | not touched |

New hooks needed: none. New primitives: none.
