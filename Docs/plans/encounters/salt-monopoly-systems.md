# Encounter Pipeline: The Salt Monopoly
> Scale: short (`scale: local`) | Slug: salt-monopoly | Pass: systems (cold critic, THR-1757 master batch 2, slot 2)
> Date: 2026-10-14 | Pipeline version: 3.0 | Audited artifact: `salt-monopoly.package.json`

## Every id the package names, resolved

| Reference | Where | Resolves to | Proof |
|---|---|---|---|
| `encounter.town.salt_monopoly` | template id | new; under `encounter.town.*`, not `slice.*` | brief row 2 |
| `reward_tools_instruments_gate_seal_case` | step 1 `successMetadata` `attachment_grant`; BOON chips cs/s/sac | `REWARD_POSSESSIONS` artifact node "Gate Seal Case", `attachmentCategory: possession`, `subcategory: tools_instruments`, tier 1, tags `#checkpoint #order #eye #gold`, flavour "Wax seals, chalk, and a customs stamp wrapped in oilcloth" | `src/data/reward-attachment-catalog.ts:178` |
| `encounter.town.mill_lease_auction` | step 1 `encounter_seed.templateId` | registered template, gold, `settings: rural, urban`, `drawable` (no `drawable:false`), cast keys `cellarer` + `merchant` | `src/data/encounters/mill-lease-auction.ts:35,245,255` |
| `agreement.debt.minor` | sac reaction `attachment_grant`, counterparty `$cast:clerk` | "Minor Debt", `agreementType: debt` | `src/data/agreement-reward-catalog.ts:45` |
| `trait.reputation.monopolist` | `traitVariants` | "Monopolist" | `src/data/economic-trait-content.ts:86` |
| `$cast:merchant`, `$cast:clerk` | reactions, `opposes`, concepts | both declared in `supportBundle` (lazy-materialize, must-persist) | package |
| `$here`, `$actor` | `reputation_with`, chips | standard sentinels | anchor catalog |
| `ui.reputation_with`, `ui.standing`, `ui.aftermath_seed` | chip tooltips | live tooltip ids used across the corpus | `src/data/encounter-content.ts` |
| `generic.crowd / luck / focus / memory` | special image tags | `src/data/encounter-image-library.ts` | grep |
| deal tags `social`, `insight`, `presence` | both steps | members of the closed 12-value `DealContextTag` set | spec § 3b |

No companion, condition, hidden mark, faction tag or content tag is named. `tags` is not authored (no family word minted — brief: "No new family tag is minted").

## 1. Support Bundle Honesty

Two actors, both `lazy-materialize-on-trigger` / `must-persist`, reuse-first by NPC role. Realistic on an organic draw: `phaseAgentDecision.ts:1865` runs `prepareEncounterSupportBundle` for drawn encounters. **Fix applied:** the factor's `spawnName` was "Isolde Varne"; changed to "Edric Varne" because the inherited binding seats this NPC in the sequel's `merchant` slot, and the mill lease's prose writes *he / his* for `{cast:merchant}` ("could not say where his flour came from", "let him the mill"). A female-coded spawn guaranteed a pronoun clash on the spawn path. (A reused NPC of any gender can still clash; that is a latent defect in the mill lease's own prose, not in this package — see caveat 2.)

## 2. Missing Primitives

None. Every primitive used is live: `attachment_grant` (possession), `encounter_seed` with `templateId` + `inheritContext`, `reputation_with`, `bond_change`, carryover factor lines, `deal`.

## 3. Runtime Feasibility

Linear, two steps. Step 0 `continue_weakened` (its critical_failure ends the action, so that route carries only step 0's `-0.05` write, which backs the one cf chip); step 1 `fail_action`. Carryover lines keyed on step 0's band ride `carryover:<outcome>`. `successMetadata` fires on `near_miss` (`isStepSuccess`), so the item and the seed land on a near-miss close — the band prose is now honest about that (new `nearMissAfterimage` on step 1 names the narrow win and the seal case).

## 4. Aftermath Supportability

- **Possession.** `attachment_grant` from step 1 success metadata on `$actor`. The chip's referent is the template id, per the anchor catalog's attachment rule ("`entityId` is the **template** node id, never a granted instance").
- **Story seed — the inherited binding, traced through the code.** The step-metadata effects are dispatched through the same `applyEncounterAftermathReaction` path as reactions (`unifiedActionResolution.ts` `applyStepOutcomeEffects`, THR-783), with the real `action` in hand. At plant, `encounterAftermath.ts:1737` snapshots `inheritedTargetId: action.targetId` and `inheritedBindings: action.supportBindings` — here the `merchant` and `clerk` bindings. At spawn, `encounterSeeding.ts` `resolveSeedInheritance` (l.445) drops dead nodes (dual gone-test) and passes the survivors straight into `createUnifiedAction({ supportBindings })` (l.803). Cast is then resolved **by key**: `$cast:<key>` via `action.supportBindings.find(b => b.key === key)` (`encounterAftermath.ts:725/995`), and `{cast:<key>}` via the scene-cast block in `proseEnrichment.ts`. The mill lease declares `key: 'merchant'` (`mill-lease-auction.ts:255`), so **the salt factor is seated as the mill lease's rival bidder** — `{cast:merchant}` names them and `$cast:merchant` effects reach them. Verdict: the binding works as the author claimed.
- `templateId` seeds skip the eligibility filter, so the mill lease spawns wherever the mortal stands; no place is promised (seed label and chip promise only "the next lease", which is what fires). Rule 7b holds.
- **Later-tense promises walked.** "{cast:merchant} will bid against {actor} for the next lease" → the seed above. "The council will blame the one it sent" (step-1 spine) → `reputation_with $here -0.10` on step-1 failure. "Someone must stand for it" (sac overview) → answered on the same page by the two reactions (debt grant to `$actor` with counterparty `$cast:clerk`, or `-0.04` regard). No unenacted promise remains (the dropped "the backers want their silver back" was one).

## 5. Chip referents resolve

| Chip | Referent | Kind |
|---|---|---|
| `*.seal_case` (cs/s/sac) | `reward_tools_instruments_gate_seal_case` | attachment template ✓ |
| `*.town` (all five bands) | `$here` | location ✓ |
| `*.next_lease` (cs/s/sac) | seed carrier `$actor`; **added** concept `$cast:merchant` (agent) — the person the chip says will come back | agent ✓ |

## 6. New Hooks Needed

None.

## 7. Implementation File Map

Compiler-owned only (`npm run compile:encounter -- Docs/plans/encounters/salt-monopoly.package.json` → module, structural test, both registrations). Beyond that: concept art `public/concept-art/encounters/salt-monopoly.jpg` (optional), and at closeout stamp `encounter.town.salt_monopoly` into `hook.artifact_recovery.usedBy` in `src/data/content-eval/plotHooks.ts`.

## 8. Verdict

**READY WITH CAVEATS**

1. **Live proof needs a pinned band.** At gold 0.80 the proof ascendant loses most natural runs; the item, seed and success-side reputation are success-metadata claims and read *not exercised* on a failed run. Prove with `--seed` sweep or `?outcome=success`.
2. **The sequel's own unbound cast (pre-existing, not this package).** Seeded spawns get only inherited bindings — no support-bundle binder runs on the seed path (`prepareEncounterSupportBundle` is called only from `phaseAgentDecision`, `deliveryBeatAdapter`, debug tools). So in the spawned mill lease `cellarer` is unbound: its prose falls back to the spec name "Brother Anselm", and its `$cast:cellarer` appointment counterparty resolves to nothing and fails soft. The inherited `clerk` binding rides along unused (the mill lease declares no `clerk` key). Every `templateId` seed into the mill lease behaves this way; worth a follow-up on the seed path, not a block here.
3. **Fiction fit of the sequel.** The mill lease calls its merchant "a grain merchant" who "boasts of cheap flour". A salt house's factor bidding on an abbey mill reads as a trading house diversifying — acceptable, not seamless.

## 9. Primitive Disposition

No missing primitives identified. Caveat 2 is a candidate follow-up (run the support-bundle binder for keys a seeded action's inherited bindings do not cover), outside this slot's scope.
