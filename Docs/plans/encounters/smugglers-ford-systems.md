# Encounter Pipeline: The Salt Train at the Ford
> Scale: short | Slug: smugglers-ford | Pass: systems
> Date: 2026-09-29 | Pipeline version: 2.0

## Verdict: READY WITH CAVEATS (two gate failures found and fixed; one corpus-wide noun caveat carried forward, not blocking)

## 0. Gate evidence

`compile:encounter --dry-run` was **green on the draft while `check:encounter` failed it**. The dry-run does not run the composition contract. I ran `check:encounter` against the package without registering it: a scratch copy of `scripts/check-encounter.ts` appended the package template, built through `compileOpeningEnvelope` + `expandSettings`, to the registry population. No shared file was touched.

- Draft: **FAIL.** `[hand] step 1 variant 'negative' (shadow): purposeLine is 6 words, over REACH_PURPOSE_MAX_WORDS 4`, and `[warn] [opening] opening is 81 words … over the budget of 80`.
- After the fixes: **clean, 0 warnings.** `✓ encounter.town.smugglers_ford [systems: cast, rewards, reputation]`.

The purpose lines are now "Lead the crossing" and "Hand back the rope" on both the variant and the fallback. `check:encounter` reports only the first over-budget line per step, and "Hand back the lead rope" (5 words) would have failed next.

## 1. Support Bundle Honesty

- `carrier`: reuse `trader`/`fence`, spawn `trader` "Wenna Tarrow". `exciseman`: reuse `guard`/`clerk`, spawn `guard` "Oswin Keel". Both are `lazy-materialize-on-trigger` and `must-persist`, and all four roles are live (`default-support-bundles.ts`; `border-levy.ts` spawns `guard` and `counting-house-dispute.ts`/`pilots-reckoning.ts` spawn `trader`).
- **THR-1165 cast-target safety: passes.** Every `bond_change` names `$cast:carrier` or `$cast:exciseman`, and both are materializing specs the template declares itself, never a bind-only default. The one caveat is inherent to `reuse`. A `guard` already standing in the settlement may be bound as the exciseman, so the scar lands on that guard. That is the intended reading ("the exciseman is whoever keeps the post"), and the prose names the bound node through `{cast:exciseman}`.
- `agent_relocation` targets `$actor`, so it has no cast dependency.

## 2. Missing Primitives

None. The encounter uses `ActionStepBranch.decidedBy` (`honesty_cunning`, whose poles are Confessor +1 and Puppeteer −1 per `src/types/agent.ts`), `BranchAwareAftermathConfig` with `byOutcome`, step-outcome effects (THR-783, routed through the aftermath dispatcher by `applyStepOutcomeEffects`), `agent_relocation` (THR-1142), `emit_omen`, and `bond_change`. All of them are live.

## 3. Runtime Feasibility

- The encounter has two beats; step 0 is `continue_weakened`, and the agent-decided fork on step 0 leads to `fail_action` arms. Difficulties are 0.40, 0.45 and 0.20, all ≤ `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45). `intrinsicTier: 'background'`, `rarityTier: 2`, `scale: 'local'`. That matches the brief row.
- `successMetadata` fires on `isStepSuccess`, which **includes `near_miss`**. A lead-arm near_miss therefore writes the relocation, the trust gain and the favouring omen. Its aftermath lands on the `success_at_cost` band, which chips exactly those. Consistent.
- **Measurement note (unchanged, not a defect).** The fork step carries no top-level `difficulty`, so `measure:roll-spread` reads the mean as 0.40 (window fit 0.54, journeyman). The same holds for batch 1's pilots-reckoning.
- **crudType `update`** maps to `assist` (`encounterCache.ts` `CRUD_TO_ENCOUNTER_TYPE`), which is the right type for a mortal helping another's crossing.

## 4. Aftermath Supportability / consequence hand / later-tense promises

**The binding hand is `movement` + `omen`, with no swap, and both are wired in context.**
- `movement`: `agent_relocation` `{ targetAgentId: '$actor', destination: { kind: 'away', minHexDistance: 3 }, mode: 'travel' }` on the lead arm's `successMetadata`. This is the Assize Letter's shipped shape. **What it actually does** (`relocationIntent.ts`): it writes a `relocationIntent` that *leans* the mortal's encounter scoring toward a seeded destination at least 3 hexes off. It does not teleport. The PATH chip was reworded from "is travelling away … now" to "**is headed away** from {location} with the salt train", which claims the intent rather than the journey. The overview's "toward the market" was removed, because nothing writes a market destination.
- `omen`: `emit_omen` (cultural, global, 0.25, darkness on success and chaos on failure) on both lead sides. **Added by the critic:** a quiet `emit_omen` (cultural, global, **0.15**, chaos) on the decline arm's `failureMetadata`, and on the fallback mirror, so that a decline which goes badly still leaves the drawn omen family. It reads "the ford has turned against night crossings", which matches the decline failure overviews. `check:encounter`'s draw block recomputes `['movement','omen']` from the id and passes.
- **Scope `global` is forced, not chosen.** `EmittedOmenScope` is `global | regional{regionId} | local{hexCol,hexRow}`. No scene sentinel binds either field, and `encounterAftermath.ts` degrades an unbound local or regional scope to global in any case. Global at 0.25 or 0.15 intensity, for the default 15 ticks, is honest. `EMITTED_OMEN_MAX_ACTIVE` (20) evicts the oldest omen under load.
- **The omen reads.** `phaseAgentDecision` folds `deriveEmittedOmenEncounterBias` into `combinedBias` for later encounter selection, and the dispatcher posts the `narrativeHook` as a chronicle `narrative` event. It is not chip-backing (`CHIP_BACKING_EFFECT_KINDS` excludes it deliberately), so it is carried in words on every band where it fires.
- **Rule 7b / trigger 34.** I walked every future-tense sentence:
  - "A guide known at a post is no use on this road again" (lead crit_failure) is a constraint with no enacting effect. **Removed.**
  - "the salt will sell at the old price" (lead success) was a promise with no effect. **Removed.**
  - "would hand {actor} a lead rope again" (BOND) was a conditional promise. It is now the present-tense "trusts {actor} with a lead rope now", which the +0.15 sentiment / +0.10 trust write backs.
  - "the river favours / has turned against …" is enacted by the `emit_omen` on the same band side.
  - "The carrier has until the fog lifts to find another guide" is an in-scene deadline, resolved by the same scene's bands.
  - There are no appointments and no placed promises.
- **The generic `narrativeTemplates.failure`** said "The excise caught the salt train … who held the rope", which is false on the decline arm. It is now "The salt train did not get over the ford, and the carrier knows who read the watch." That line is true on both arms.
- **Chip backing (Law 56 clause 1), per band.**
  - Lead success, success_at_cost and crit_success: BOND ← `bond_change` +; PATH ← `agent_relocation`.
  - Lead failure and crit_failure: SCAR carrier ← `bond_change` −0.15; SCAR exciseman ← `bond_change` −0.15 / −0.10.
  - Decline success bands: SCAR ← −0.05. Decline failure bands: SCAR ← −0.12.
  - Both failure bands write the same −0.15, so neither chip claims "much less". The chips say only "thinks less of", to match the write.

## 5. Chip referents (THR-1490/1491)

- Every `reputation with {target}` chip anchors `$cast:carrier` or `$cast:exciseman` with `visualKind: 'agent'`. Both are materialized cast members, and the chips are linked.
- **The PATH chip anchors through its tooltip** (`ui.aftermath_seed`, which resolves), and its carrier is named `{actor}` in the sentence.
- **Caveat, carried and not fixed here.** The `seed` noun's tooltip says *"it will surface later as an encounter"*, and a relocation intent is not a seed. The claim is loosely true, because the intent surfaces as encounters near the destination, but it is the wrong word. This is the **Assize Letter's shipped form**, and it is the only lawful noun today:
  - a new noun needs a tooltip id that resolves;
  - `CHIP_STATE_NOUN_MAX_WORDS` is 3;
  - a `$actor` noun anchor is banned by `chipStateNounWordingViolations`.

  I changed nothing here. Coining a second spelling for one state in one encounter is the drift THR-1472 forbids. **Follow-up for the orchestrator:** register a travel noun (e.g. `ui.aftermath_departure`, "On the road") in `src/data/ui-content.ts`, then migrate both relocation chips (`assize-letter`, `smugglers-ford`) in one PR. It is an impediment-log row, not a blocker.
- **Dead concepts removed.** `applyConceptDecorations` matches concept text as a literal substring of the enriched sentence, so the following concepts never rendered:
  - `trusts`: the old sentence said "would hand … again";
  - `knows their face`: the sentence said "knows {actor}'s face";
  - `{actor}` on the PATH chip: the placeholder is enriched away before matching.

  The first two now match the sentence ("trusts", "knows"); the third is removed.

## 6. New Hooks Needed

None. The travel-noun tooltip above is an optional corpus clean-up, not a dependency.

## 7. Implementation File Map

Compiled set only (`npm run compile:encounter`). No extra files.

## 8. Primitive Disposition

No missing primitives identified.

Final: scratch `check:encounter` clean with 0 warnings; `compile:encounter --dry-run` exit 0.
