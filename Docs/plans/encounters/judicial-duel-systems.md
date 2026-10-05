# Encounter Pipeline: The Judicial Duel
> Scale: medium | Slug: judicial-duel | Pass: systems
> Date: 2026-10-05 | Pipeline version: 2.0
> Template: `encounter.town.judicial_duel` · Batch: master-everyday, slot 4 (THR-1688)

**Verdict: READY WITH CAVEATS.** No missing primitive. Every effect, chip and cast shape is
live, and a provisional package carrying the same effects and chip shapes passes
`check:encounter` clean (re-run read-only this pass: `checked 1 clean 1 failing 0 warnings 0`,
systems `cast, rewards, conditions, reputation`). The caveats are one pre-task (rebuild the
package from the revised prose and re-gate) and two accepted runtime limits, recorded below.

**Changes made to the revised content for the final: none.** The final's packet is the
revised file, verbatim.

---

## 1. Support Bundle Honesty

| Object | Claim | Verdict |
|---|---|---|
| `claimant` | lazy-materialize, reuse `merchant`/`trader`, spawn `merchant` "Wenna Coldridge", must-persist | Honest. Same shape as shipped cast bundles; must-persist is what makes the `owes_favor` debtor and the failure-side `bond_change` land on a real node. |
| `champion` | lazy-materialize, spawn `warrior_priest` "Corvin Ashe", must-persist | Honest. `opposes: 'champion'` on Twist Their Footing and Weigh A False Oath resolves to the bound node; the success reaction's `bond_change` needs persistence and has it. |
| `$here` | the town | Honest. `$here` walks `located_at` to the place tier (`resolveSceneHere`); it carries `reputation_with`, Under Watch and Festival. |
| the order, the farm, the court | scene fiction | Honest. Never chipped, never an effect target. Correctly not a faction node (no node-type invention). |

## 2. Missing Primitives

None. Checked:
- **Test shaping:** linear three-step test, `continue_weakened` → `continue_weakened` → `fail_action`. Live.
- **Flip/reveal, task/progress carriers:** not used.
- **Prevention/interception/recovery:** not used.
- **Authored choice bundles:** not used. No `authoredChoices`. The stance lives in aftermath reactions, which is the sanctioned shape.
- **Fight system:** correctly absent. The bout is two nudge-resolved Iron steps; no fight state, so `FIGHT_RESULT_ACTION_OUTCOME` never applies and the outcome comes from `computeFinalActionOutcome`.

## 3. Runtime Feasibility

- **Beats:** three steps, supported.
- **Branching:** linear, branch count 0. `aftermathConfig.branchOnStep: 0` with empty `variants` routes everything through `fallback` + `byOutcome`, the documented shape for a choice-less encounter.
- **Outcome ladder, traced against `unifiedActionLifecycle.ts`:**
  - A `critical_failure` at **any** step ends the action as `critical_failure` (line 206). Three routes reach that face.
  - A plain `failure` at step 0 or 1 continues weakened. The action-level `failure` face is reachable **only** through a step-2 failure (`fail_action`).
  - Any continued failure, any `success_at_cost` step, or any `near_miss` step makes the action `success_at_cost`. A step-2 `near_miss` counts as a step success (`isStepSuccess`), so `successMetadata` fires (thread, favour, standing) and the action lands on `success_at_cost`. The s@c overview ("how near the order came to winning") is true on that route.
  - `critical_success` needs a clean run with at least one critical step.
- **Afterimages:** `near_miss` falls back to `successAfterimage` (`afterimageForOutcome`); no `nearMissAfterimage` is authored. Every fallback reads true. The step-1 near_miss pairing ("gave no ground", then step 2's "They held the rush, but only just") is tight but not false. Optional polish only.
- **Carryover lines:** keyed on the previous step's band. The `critical_failure` rows are correctly unreachable and unauthored.

## 4. Aftermath Supportability

**Per-face chip backing (Law 56).** `applyAftermathOutcomeBand` substitutes `changes` wholesale per band, so backing is checked per face:

| Face | Routes | Chips | Backing on every route? |
|---|---|---|---|
| critical_success | clean run, step 2 success | thread, favour, standing (+) | Yes. Step-2 `successMetadata`. |
| success | clean run, step 2 success | same | Yes. |
| success_at_cost | step 2 success or near_miss after any cost | same | Yes. Step-2 `successMetadata` fires on near_miss too. On routes through a step-0/1 failure the net standing is +0.04 or +0.02 (−0.02 per failed step, +0.06 on the win), so "thinks well of" stays true. |
| failure | step 2 failure only | Under Watch, thread (−), standing (−) | Yes. Step-2 `failureMetadata`. |
| critical_failure | step 0, 1 or 2 critical failure | standing (−) | Yes. −0.02 on the step-0/1 routes, −0.06 on the step-2 route. |

**Reputation channel:** `reputation_with $here` is world standing and passes visibility parity (THR-1136 §5). There is no `reputation_tally` chip.

**Conditions:** `trait.condition.location.under_watch` and `trait.condition.location.festival` are authored on `$here`. Both were validated by the provisional gate.

**Thread:** `$ascendant` binds `scene.ascendantId` only if it resolves to an ascendant (`bindAftermathSceneTargets`). For an unthreaded performer it is left in place and the effect no-ops, fail-soft. That is the same exposure as shipped `cunning-fair` / `border-levy` / `drowned-mans-testimony`. Not a finding for this encounter.

**Favour:** `favor_creation` mints `owes_favor` with debtor `$cast:claimant`, and the chip's concept anchors `$cast:claimant`. That is the correct end of the edge (spec 0c).

**Prose rule 7b, every later-tense sentence walked:**

| Sentence | Enacting effect on the same path |
|---|---|
| spine 0: "offers a favour owed if the farm is saved" | step-2 `successMetadata` `favor_creation` (fires on success, s@c and near_miss: every "farm saved" route) |
| spine 2: "The court will give the farm to whoever makes the other yield" | fiction resolved by the band overviews in the same action; no world-state promise |
| reaction: "The champion will remember it." | `bond_change $cast:champion +0.12` |
| reaction: "the town takes a holiday" | `apply_condition` Festival on `$here` |
| reaction: "The family will remember who stayed." | `bond_change $cast:claimant +0.12` |
| reaction: "keeps the answer" | `intelligence` cultural_knowledge "The Order's Style" |
| success overview: "pack their carts and leave {location} by evening" | same-evening fiction, no state claimed; nothing on the success side contradicts it |

There is no placed-and-timed promise, so no `appointment` is owed. The editorial already removed the one unenforced promise ("every old title can be challenged").

**Chip referents (THR-1490/1491).** Every chip anchors a real referent:
- `$here` (location)
- `$cast:claimant` (agent)
- `trait.condition.location.under_watch` (attachment)
- `ui.thread`, `ui.favour_owed`, `ui.reputation_with`, `ui.standing` (tooltip ids)

No chip points at the order, the farm or the court.

### Rulings on the editorial "Consider" items

1. **success_at_cost has no state-backed cost: ACCEPTED, no change.** The runtime has no band-keyed forced write. `AftermathOutcomeOverride` carries overview, changes, reactionPrompt and reactions only. Step effects split on `isStepSuccess`, not on the six-value band. So the leg cut cannot be made a condition without it also landing on every success. The cost is partly real anyway: s@c routes through a step-0/1 failure pay a −0.02 standing write. Only the clean-route s@c (a step-level s@c or near_miss) carries its cost in prose alone. This is the corpus norm: none of the 30 packages surveyed puts a cost-only write on s@c. A per-band forced effect would be a cross-cutting primitive for the whole factory, not this encounter's to build. Noted as BACKLOG below, not blocking.
2. **Step-2 critical_failure fires `thread_weaken` + Under Watch unchipped: ACCEPTED as a caveat, no change.**
   - The critical_failure face is shared by three routes. Adding the thread and Under Watch chips would make them unbacked on the step-0/1 routes: a Law 56 lie, worse than an omission.
   - Moving the writes onto steps 0/1 is wrong too: `failureMetadata` also fires on their plain, continue_weakened failures, which can still go on to win.
   - Under-reporting is the honest choice. Both quantities stay inspectable (the thread on the sheet, Under Watch on the location), so visibility parity's "shown ⇒ inspectable" is not breached. The gap is "written ⇒ not shown" on one route.
   - The real fix is an aftermath keyed on which step ended the action. That is the same BACKLOG primitive as item 1.
3. **`reputation with {location}` as a `stateNoun` renders braces?: NO, it renders resolved. Keep.** `buildAftermathConsequences.ts` `nounTextFor()` (THR-1685) returns `enrich(text)`, so `{location}` resolves in the `CATEGORY · NOUN` tag. Fourteen shipped encounters (80 occurrences, including `levee-breach`, `flood-dyke-mending`, `well-sinking`) use the identical noun, and the provisional gate passed it. Two older sources are now stale: the spec's line "the surface does **not** enrich this field" (nudge-authoring-spec § 0c item 1) and the auto-memory `reference_chip_rendering_asymmetries` item 1. Doc drift for the batch report; not this lane's file to edit.
4. **"Slow Every Move" too plain a special?: KEEP.** A plain boost is odds with no mechanism. This card names one ("drag a fighter's motions a beat late, so anyone watching sees each one start"), and that mechanism is only possible because the disposition die put the drill in the open. It also shares no word with its name. It is the weakest of the five cards, but it is not a defect, and replacing it would reopen a hand the editorial pass composed (time vs memory).

## 5. New Hooks Needed

None. No new roles beyond the two `supportRole` strings (bundle data, compiled), no new sublocation types, state fields, condition traits or content entries.

## 6. Implementation File Map

Beyond the compiled set (`Docs/plans/encounters/judicial-duel.package.json` → encounter module, structural test, both registrations via `compile:encounter`): **none.**

The package does not yet exist in the worktree. The provisional one under the session scratchpad was built from the **draft** prose and must be rebuilt from the final packet. Mapping notes for whoever builds it:
- Nudge `duel.slow_a_fighter` / "Slow A Fighter" → rename the id to `duel.slow_every_move` and the name to "Slow Every Move". Take the new effect lines and band fragments for all five cards from the final.
- Step 0/1/2 `narrativeTemplate`s, afterimages and carryover lines: take them from the final. The provisional still carries "four generations", the "every old title" promise, and "Both fighters are cut".
- Thread chips: drop `causeClause`. The detail is "The god's thread to {actor} runs stronger." / "…runs thinner."
- Favour and standing chip details gain "now" ("{cast:claimant} owes {actor} a favour now.").
- Failure-side reactions: the label is "Load the family's cart", with the new intent. Re-key the ids to match (e.g. `duel.fail.load_the_cart` / `duel.critfail.load_the_cart`). The intelligence reaction's intent becomes "…and keeps the answer."
- Festival reaction intent: "…and the town takes a holiday."
- Overviews: success_at_cost, failure and critical_failure change per final § 13.
- Re-run `node .cache/check-encounter.mjs --package Docs/plans/encounters/judicial-duel.package.json` after the rebuild.

Scene art per § 17 is the batch's art step, not a hand-edit here.

## 7. Verdict

**READY WITH CAVEATS.**
- **Pre-task:** rebuild the package from the final packet and re-gate (§ 6).
- **Accepted limit:** the clean-route success_at_cost carries its cost in prose only (ruling 1).
- **Accepted limit:** the step-2 critical_failure route writes a thinner thread and Under Watch without a chip (ruling 2).

## 8. Primitive Disposition

No missing primitives identified for this encounter.

One factory-wide **BACKLOG** candidate surfaced by rulings 1–2, recorded for the batch report rather than filed here. Its spec: an aftermath band override keyed on the route that ended the action, i.e. `byOutcome[band].byEndingStep?: Record<stepIndex, AftermathOutcomeOverride>` resolved from `stepOutcomes.length - 1`, plus an optional `effects` on `AftermathOutcomeOverride` fired once at aftermath assembly. Together they would let a band carry a cost write of its own and show chips that are true on only one of its routes.
