# Encounter Pipeline: The Assize Letter
> Scale: short | Slug: assize-letter | Pass: systems
> Date: 2026-09-29 | Pipeline version: 2.0

## 1. Support Bundle Honesty

| Object | Claim | Verdict |
|---|---|---|
| `clerk` (`$cast:clerk`) | lazy-materialize, reuse role `clerk`, spawn `Wenna Loy`, must-persist | Honest. `clerk` is a live NPC role (`default-support-bundles.ts`). `supportRole` is a free string. The `bond_change` is written onto a declared key, which satisfies `CAST_TARGET_PERSISTENT_KINDS`. |

## 2. Missing Primitives

None. The encounter uses `intelligence`, `agent_relocation` (travel), `bond_change` and the deal fill, all of them live.

## 3. Runtime Feasibility

One plain step, Star 0.45, `fail_action`. `successMetadata` fires on `critical_success`, `success`, `success_at_cost` **and `near_miss`** (`isStepSuccess`). The aftermath's success bands therefore always see all three writes, and the chips now report all three (visibility parity). `near_miss` aggregates to a success-side action outcome. The river card's `near_miss` fragment ("waited on the bank for the last of it") reads correctly above a success ending.

## 4. Aftermath Supportability (prose rule 7b)

| Later-tense sentence | Enacting effect |
|---|---|
| PATH "{actor} is travelling away from {location} now" | `agent_relocation` `{ kind: 'away', minHexDistance: 3 }`, `mode: 'travel'`, on the same success path. `{location}` is the town the clerk found them in, which is where the intent measures "away" from. The pre-fix cause "Went on from the county seat" asserted a place the engine never put them, so it was removed. |
| BOND "trusts them with the assize's business now" / "trusts them less" | `bond_change` ±, `withAgentId: '$cast:clerk'` (`relates_to` sentiment and trust, acted on by `ambitionTick`) |
| BOON "knows who laid the heresy charge" | `intelligence` `political_secret` on `$actor` (acted on by `encounterScoring`, shown in `AgentIntelligencePanel`) |

No appointment, no placed promise, no seed. Nothing unenacted.

## 5. Chip referents and the PATH noun (the drafter's open question)

**Decision: `stateNoun: { text: 'seed', tooltipId: 'ui.aftermath_seed' }`.** The drafter's `journey` is not shippable, for three reasons:

1. **It anchors nothing.** A `stateNoun` with neither `entityId` nor `tooltipId` fails Law 56 clause 2 in `chipAnchorViolations` (`compositionContract.ts`: "names '…' and anchors nothing"), so `check:encounter` goes red. `ui.journey` does not exist in `src/data/ui-content.ts`, and registering it is outside this pass's write scope.
2. **The catalog rules the kind out for chips.** `anchor-catalog.generated.md` lists `journey` as deliberately absent from `EncounterAftermathConceptRef.visualKind`: *"An engine report, not a claim authored content makes … a chip names the traveller."* Naming the traveller (`$actor`) instead trips THR-1472's "anchors its noun to the carrier" rule.
3. **No sheet surface reads a travel intent.** The sheet's Journey tab (`JourneyTab.tsx`) shows undertakings, ambition and arc. No component reads `relocationIntent`. A `JOURNEY` tag would point the player at a tab where this write never appears.

`seed` is the shipped precedent for exactly this write (`the-broken-seal` `seal.fail.driven_out`, and `the-sign-over-the-ruin` ×2). Its tooltip ("something this ending set in motion … will surface later as an encounter") is also mechanically accurate here: a travel intent works only by raising encounter scores near the destination (`relocationIntent.ts` header), so the relocation surfaces as the encounters the mortal meets on the way. **Recommended follow-up (not filed, since lanes do not file process tickets):** register a `ui.journey` concept if more than a handful of relocation chips accumulate, and move them to it in one sweep.

Other referents: `$cast:clerk` (declared key, agent 🔗), `ui.knowledge`, `ui.reputation_with`, `ui.standing` and `reach.star` all resolve in `ui-content.ts` / the reach tooltips.

## 6. Deal tags

`deal.tags: ['journey', 'lore']`. Both are members of the closed `DealContextTag` union (`src/types/unifiedAction.ts`), and both match Repertoire cards in `src/data/nudge-card-library.ts`:

- `lore`: `card.insurance.signature.order` and several insight+lore cards
- `journey`: `card.whisper.signature.light` (craft+journey), a craft+journey+labor card, and `card.boost.signature.energy`

**Risk:** `journey` can deal `card.boost.signature.energy`, which the brief marks over-exposed ("not at all"). That instruction binds *authored* cards, and a deal is not an authored card, so this is not a breach. `exclude` works by card type and would strip every boost, so it is not used. Recorded for the batch report.

## 7. Live ids checked

`sacrifice_survival` and `loyalty_ambition` (`ValuePair`), `political_secret` (`IntelligenceCategory`), `generic.matter` and `generic.time-slow` (`encounter-image-library.ts`, spheres matter and time, matching the cards), `crudType: 'read'`, role `clerk`. There are no condition, ambition, compulsion, item, sequel or template references.

## 8. Implementation File Map

Compiler-owned set only (`compile:encounter`). No engine hooks.

## 9. Verdict

**READY FOR IMPLEMENTATION.** No missing primitives were identified. The `check:encounter` composition-contract run (not exercised by `--dry-run`) is the remaining gate. The PATH-noun fix was made specifically so that it passes.
