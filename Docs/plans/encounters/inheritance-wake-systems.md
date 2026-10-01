# Encounter Pipeline: The Inheritance Wake
> Scale: medium | Slug: inheritance-wake | Pass: systems
> Date: 2026-10-01 | Pipeline version: 3.0 (Factory) | Batch: expert-everyday-3, slot 2 (THR-1680)

**Verdict: READY WITH CAVEATS.** Critic loop 1 is clean (editorial PASS WITH REVISIONS, systems READY WITH CAVEATS). One real defect was found and fixed in `inheritance-wake-final.md`: the two **loss** bonds could not move the number their chips name. Two small consistency edits were also made. Everything else was grepped against live code.

## 1. Support bundle honesty

| Spec | Check | Verdict |
|---|---|---|
| `widow` spawn `elder` | `'elder'` ∈ `NpcRole` (`src/types/npc.ts:70`) | ok |
| `eldest` spawn `steward` | `'steward'` ∈ `NpcRole` (`npc.ts:60`) | ok |
| `youngest` spawn `weaver` | `'weaver'` ∈ `NpcRole` (`npc.ts:65`) | ok |
| all three `lazy-materialize-on-trigger` + `must-persist`, no `reuseNpcRoles` | the THR-1165 rule (never aim a durable write at a bind-only default key): each persistent write (`bond_change`, `reputation_with` person) targets a cast key this template spawns itself | ok |

Spawn-only is correct. A reused hamlet `elder` would make the village elder the dead farmer's widow.

## 2. Effect shapes (each against `src/types/unifiedAction.ts`)

| Effect | Fields used | Live? |
|---|---|---|
| `bond_change` | `withAgentId: '$cast:<key>'`, `sentimentDelta`, `trustDelta` | ok. Applied by `applyBondEdge` (`encounterAftermath.ts:1039`); reciprocal by default. `$cast` in step metadata is shipped (e.g. `withAgentId: '$cast:clerk'` in a shipped package's step metadata) |
| `membership_change` | `factionId: 'temple_of_spheres'`, `op: 'join'`, `targetAgentId: '$actor'`, `chronicle: true` | ok (`unifiedAction.ts:1206`). `joinFaction` → `resolveFactionNodeId` (`factionMembership.ts:105`) resolves a def id to the **local congregation** via `localChapterNodeId`, so "the parish" is literally the nearest Temple chapter. Temple congregations are seeded per culture at worldgen (`worldSeed.ts:2060`). Shipped shape: `well-sinking.package.json:206` |
| `reputation_with` | `targetLocationId: '$here'` / `targetAgentId: '$cast:<key>'`, `delta` ≤ 0.15 | ok |

The consequence hand recomputes as `relationship` + `membership` (`npm run draw:consequences -- encounter.town.inheritance_wake --reach heart --rarity 2`: `bond_change` / `membership_change`). Both are wired on both arms. `checkConsequenceDraw` is template-wide (`compositionContract.ts:1817`), so either arm alone would satisfy it. Both are wired anyway, so whichever pole the mortal takes, the drawn hand lands.

## 3. DEFECT (fixed): a loss bond cannot lower trust from a fresh edge

`applyBondEdge` clamps trust with `clamp01(trustBefore + trustDelta)` (`encounterAftermath.ts:1063`). A missing edge is created at `BOND_CREATE_INITIAL_TRUST = 0` (`effect-constants.ts:200`). These three spawn-only kin have no edge to the mortal before the scene, so `trustDelta: -0.1` writes `0 → 0`, which is no change.

The person chips name **reputation**. `getReputationWith` reads the bond leg as `(trust + 1) / 2` (`reputation.ts:195-200`). That reads 0.5 before and 0.5 after, which is still *Accepted*. So the Sworn-failure chip "{cast:eldest} trusts {actor} less" and the Renegade-failure chip "{cast:widow} trusts {actor} less" would sit over an unchanged standing. That is the hollow-chip shape Law 56 exists to stop. The gate would not catch it, because it is a floor: *some* write fires on the band.

**Fix merged into the final:** each loss keeps a sentiment-only `bond_change` (the relationship sours; sentiment is signed, `[-1, 1]`). It drops the `trustDelta` and adds `reputation_with { targetAgentId: '$cast:<key>', delta: -0.08 }`. The edge leg outranks the bond leg in `getReputationWith`, so the person's standing now reads 0.42. The chip names exactly that number.

The **win** bonds are unaffected. `trustDelta: +0.15` writes 0 → 0.15, and the bond leg reads 0.575, which is a real gain.

## 4. Chip backing, band by band (Law 56)

- **Success / critical_success / success_at_cost (both arms).** Step-1 `successMetadata` fires on every `isStepSuccess`, including a near_miss floored to success_at_cost. Its three writes back the three chips: bond (person), membership, village.
- **Step-0 failure then step-1 success.** Step 0's −0.03 fires with no chip; the village BOON nets +0.02, still a gain.
- **Failure (only reachable through step 1, since step 0 is `continue_weakened`).** −0.06 village backs the SCAR; the person `reputation_with −0.08` backs the BOND loss.
- **Critical_failure.** The step-0 route fires only step 0's −0.03, and the step-1 route fires −0.06 + the person writes. Both crit-fail bands carry **only** the village SCAR, true on both routes. The person write on the step-1 route carries no chip, which is legal.

## 5. Gates the package compiler does not run (impediment #1114) — pre-checked by hand

- Card names: `remember`, `stoke`, `soften`, `call`, `weigh`, `dim` are all in `IMPERATIVE_VERB_LEXICON` (`doctrineV2Checks.ts:94`).
- Image tags `generic.memory`, `.energy`, `.warmth`, `.oath`, `.matter`, `.dark` are all in `encounter-image-library.ts`.
- Deal tags `presence`, `social`, `lore`, `insight` are all in the closed 12-tag set.
- Tooltips `ui.reputation_with`, `ui.standing`, `ui.faction_member` are all in `src/data/ui-content.ts`.
- Trait ids `trait.personality.heart.virtue` / `.vice` come from `personalityTraitId` (`personality-trait-content.ts:110`).
- `notButClause` (`/\bnot\b[^.!?]*\bbut\b/i`, `nudgeAuthoringConstants.ts:399`): zero hits after the editorial split. "softened toward the widow, but not toward the others" has `but` before `not` and does not match.
- Chip sentences: all ≤ 12 words, no `causeClause`. No four-word run shared with the overview on any face (checked: "put {actor}'s name on the parish roll" vs "is a member of the Temple of the Spheres").
- Opening: recounted at **70** words (P1 13 + spine 57). The draft's 74 was a miscount. Under budget either way.

## 6. New hooks needed

None. No new role, sublocation, tag, condition, faction or state field.

## 7. Caveats (recorded, not blocking)

1. **`already_member`.** A mortal already in the Temple gets `joinFaction → already_member`, a traced no-op, and the membership chip then names a join that did not happen. This is the same exposure `well-sinking` shipped with for the Builders Fellowship. The other two chips on the band still back it. A `when` predicate on membership is a corpus-wide pattern question, not this encounter's.
2. **Off-reach Renegade arm.** gold 0.62 on a Heart expert. `NUDGE_OFF_REACH_MAX_DIFFICULTY` binds `background` only (`nudgeHandChecklist.ts`); this is `shaping`. The brief binds the pole. As with toll-gate-writ's Sentinel arm, the steeper arm gives the god's ambition lean its price.
3. **Roll-spread** reads step 0 only (the fork step has no top-level difficulty).
4. Dealt-hand sphere spread depends on the god's repertoire. It is owed at the live proof, not here.

## 8. Consistency edits merged into the final

1. The fixes in § 3: the Sworn and Renegade `failureMetadata` person writes.
2. The Sworn narrative put `{cast:eldest}.` and `{cast:eldest} promised` back to back, an echo across a sentence boundary (trigger 22). It is now one sentence: "By custom the whole farm passes to the eldest, {cast:eldest}, who promised the farmer to look after the others and now refuses the widow's wish in front of the wake."
3. The opening word count is corrected to 70 in § 10 and the self-audit.

## 9. Implementation file map

`Docs/plans/encounters/inheritance-wake.package.json` → `compile:encounter` emits `src/data/encounters/inheritance-wake.ts`, its structural test and both registrations. The orchestrator runs the real compile and `check:encounter`. The census regeneration follows the batch-1/2 practice.
