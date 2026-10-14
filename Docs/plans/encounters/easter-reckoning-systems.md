# Encounter Pipeline: The Wrong Feast Day
> Scale: short | Slug: easter-reckoning | Pass: systems (cold critic, THR-1757 master batch 2, slot 6)
> Date: 2026-10-14 | Pipeline version: 2.0
> Audited: `easter-reckoning.package.json` (what ships) + `src/data/encounters/easter-reckoning-sequels.ts`

**Verdict: READY WITH CAVEATS.**

## Every name the package uses, resolved

| Name | Where it resolves | |
|---|---|---|
| `ambition_spread_faith` | `src/data/ambition-templates.ts:796`, displayName "Spread the Faith" (matches the chip concept) | ✓ |
| imageTags `generic.dark` / `generic.strength` / `generic.decay` / `generic.vigor` | `src/data/encounter-image-library.ts` | ✓ |
| deal tags `lore`, `insight`, `social`, `presence` | `contextTags` in `src/data/nudge-card-library.ts` (:910, :919, :935, :1005) | ✓ |
| spheres darkness, force, entropy, life, time | Creation Spheres | ✓ |
| tooltipIds `ui.reputation_with`, `ui.standing`, `ui.ambition` | in use by shipped encounters (assize-letter, ducal-nativity, comet-disputation) | ✓ |
| `$appointment` chip sentinel | `ANCHOR_SENTINEL_APPOINTMENT`, `src/data/content-eval/chipAnchorDeclarations.ts:161` | ✓ |
| `$here`, `$actor`, `$cast:dean` | standard sentinels; `dean` declared in `supportBundle` | ✓ |
| NPC role `priest` (reuse + spawn) | `src/types/npc.ts:40` | ✓ |
| motivations `tradition_novelty`, `honesty_cunning` (parent), `loyalty_ambition` (defaulted) | live motivation axes | ✓ |
| tag `#sacred` | `src/data/content-tags.ts` | ✓ |
| `emit_omen` shape (`category: 'cultural'`, `scope: { kind: 'global' }`, `sphereAlignment`) | `OmenCategory` `src/types/omen.ts:19`; dispatched `src/engine/encounterAftermath.ts:3229` | ✓ |
| `reputation_with` `targetLocationId` / `targetAgentId` | `src/types/unifiedAction.ts:1199-1207` | ✓ |
| seed `town.easter_reckoning_heard`, missed `town.easter_reckoning_defaulted` | `EASTER_RECKONING_SEQUELS`, spread into the registry at `src/data/unified-action-templates.ts:6018` (import :264) | ✓ |
| `delayTicks: 36` = "in three days" | `TICKS_PER_DAY = 12` (`src/data/attention-constants.ts:14`) | ✓ |

## 1. Support Bundle Honesty

`dean`: lazy-materialize-on-trigger, must-persist, reuse `priest` else spawn "Osric Fenwold". This is honest, and must-persist is required: the dean is the appointment's `counterpartyId`, and both sequels inherit him (`inheritContext: true`).

## 2. Missing Primitives

None. The appointment (THR-1479) is live and its `missed` branch is authored. `drawable: false` (THR-1526) is live.

## 3. Runtime Feasibility — the routes

`terminalActionOutcome` / `computeFinalActionOutcome` (`src/engine/unifiedActionLifecycle.ts`):

| Route | Final band | Omen fired? | Reputation net |
|---|---|---|---|
| s0 success-side → s1 success-side | crit / success / s_a_c | `time` | +0.06 |
| s0 failure (continue_weakened) → s1 success | success_at_cost | `time` | −0.03 +0.06 |
| any s0 non-crit → s1 failure / crit fail | failure / critical_failure | `entropy` | −0.06 (−0.09 on s0 fail) |
| s0 critical_failure (ends the action; `continue_weakened` does not carry a critical failure) | critical_failure | **none** | −0.03 |

Every success-side band has step 1 success, so the `time` omen always fired. The failure band always comes through step 1's failure, so the `entropy` omen always fired. The critical_failure band is mixed. The editorial fixes respect this: the failure overview tells the bad sign, and the critical_failure overview does not.

## 4. Aftermath Supportability and prose rule 7b

- Every chip is backed on every route into its band: reputation ± on `$here`, the ambition and the seed on step 1 success, the crit-fail scar by the step-0 −0.03 write (the forged-charter lesson).
- Later-tense promises:
  - The step-1 spine ("read before the whole synod in the chapter house on synod day, in three days, with the dean there") → the `appointment` block (`locationId: $here`, `counterpartyId: $cast:dean`, `missed` authored). This is lawful.
  - The synod chip ("answers the reckoning in {location} in three days") → the same seed.
  - The heard sequel's "every parish in the diocese will keep it there" is a world-fiction close, not a constraint on the mortal. It is the same sentence shape as the charter-inquest precedent.
  - The defaulted sequel places nobody, and its regard write targets `$cast:dean`, never `$here` (pinned by `easter-reckoning-sequels.test.ts`).
- **The omen has no player surface of its own.** No file under `src/components` reads `emittedOmens`. The engine reads it in `phaseAgentDecision.ts:1033` (`deriveEmittedOmenEncounterBias`) and in the decay/agenda phases. The draft's claim that the omen reaches a "chronicle line" is unverified, so this audit does not rely on it. After the editorial fix, the prose is how the player meets it.

## 5. Chip referents

`reputation with {location}` → `$here` location (linked). `ambition` → the assigned ambition (content ref, `ui.ambition`, shipped precedent). `appointment` → `$appointment` → the appointment's place (location). No chip points at fiction.

## 6. New Hooks Needed

None.

## 7. Implementation File Map

Beyond the compiled set: none. `easter-reckoning-sequels.ts` is already hand-authored, registered and tested. This pass edited only its prose strings and its doc comment. The ids and the `EASTER_RECKONING_*` export names stay, because they are identifiers, not player text.

## 8. Verdict

**READY WITH CAVEATS**
1. The omen is engine-only (a draw bias). Its recognisability rests on the prose fixed in editorial.
2. `check:encounter-live` was not run here. At master difficulty, read success-side rows on a failed run as not exercised.

## 9. Primitive Disposition

No missing primitives identified.
