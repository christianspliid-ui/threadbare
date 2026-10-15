# Encounter Pipeline: The Fallen Silver Drift
> Scale: medium | Slug: silver-drift-rescue | Pass: systems
> Date: 2026-10-15 | Pipeline version: 3.0 (master-everyday-3, slot 7, THR-1840)

**Verdict: READY WITH CAVEATS.** One required one-line package edit (a past-tense narrativeTemplate line, see Caveats). Everything else is live in the runtime. The private gate passes on the package as it stands: OK, 0 warnings.

## 1. Support Bundle Honesty

| Object | Claim | Finding |
|---|---|---|
| reeve | reuse `elder`/`steward`, else spawn elder "Wat Corley", must-persist | Realistic. Bond edges are written on every step, so the persistence claim is needed and met. |
| miner | spawn mason "Ivo Tenney", must-persist | Realistic. Carries `trait.condition.wounded` by `condition_attachment` with `targetAgentId: $cast:miner`, and a bond edge from the "Wait at the mine mouth" reaction. |
| builders_fellowship | pre-seeded, `src/data/builders-fellowship-definition.ts` | Verified: `id: 'builders_fellowship'`. The `membership_change` join targets `$actor`. |
| prize | reward pool `#stone` AND `#tool` | `rewardPool.ts` applies tagFilters with `every` (AND). Six items wear both, per the brief's catalog check. Delivery is the step-2 success `rewardPool`, not a literal item. |

No optimistic claims.

## 2. Missing Primitives

No missing primitives identified. Shape check: test shaping (three stone steps, forecast deltas, carryover factor lines), prize by tag (`rewardPool.tagFilters`), person-borne condition (`condition_attachment` on a cast sentinel), faction join (`membership_change`). No flip/reveal state, no task carrier, no authored choice (`authoredChoices` is not used). No placed or timed promise, so no `appointment` block is owed.

## 3. Runtime Feasibility

- Three steps, branch count 0: supported. Spine, per-step afterimages and carryover lines are the standard linear shape.
- Failure behaviour: steps 0 and 1 are `continue_weakened`. Step 2 is `fail_action`. A failure at step 0 or 1 therefore makes the whole action `success_at_cost` if step 2 then succeeds (`computeFinalActionOutcome`). A critical failure at any step ends the action. Step 2 failure ends it as `failure`.
- Ladder: all five bands are reachable. `critical_success` needs a clean run with a crit. `success_at_cost` is reached by an earlier-step failure, a near miss, or a step at-cost.
- Aftermath: curated `byOutcome` for all five bands, with reactions on both sides, and the fallback with no `changes`. Wirable.

## 4. Aftermath Supportability

**Chips against effects (Law 56).**

| Chip | Band(s) | Backing effect |
|---|---|---|
| Taken In (faction_reputation, `$faction:builders_fellowship`) | cs, success, sac | step-2 success `membership_change` join, `chronicle: true`. Success-side bands are all reached only through a step-2 success. |
| The Reeve's Trust gain | cs, success, sac | step-2 success `bond_change $cast:reeve` +0.12/+0.12. |
| Well Regarded | cs, success, sac | step-2 success `reputation_with $here` +0.05. |
| Crushed Leg (Wounded on `$cast:miner`) | failure, cf | `condition_attachment` in `failureMetadata` on steps 0, 1 and 2. Every route into failure or critical_failure fires it, and every route's afterimage tells the injury. |
| The Reeve's Trust loss | failure, cf | `bond_change $cast:reeve` in `failureMetadata` on every step (-0.04 on steps 0 and 1, -0.12 on step 2). |
| Found Wanting / Out of Favour | failure, cf | `reputation_with $here` in `failureMetadata` on every step. |

Net signs on the earlier-failure-then-success route: reeve -0.04 to -0.08 then +0.12, regard -0.02 to -0.04 then +0.05. Both end positive, so the "trusts now" and "thinks well of now" chips on the sac page stay true.

**Later-tense promises (rule 7b).** The prose makes three forward-looking statements:
1. Failure overview "has sent down the valley for another crew", critical_failure overview "another crew is coming up the valley". This is offstage world colour. It does not bind the mortal to a place or a time, promises no sequel, and nothing in the game claims to deliver the crew. No seed is owed. Accepted, with the reaction intents ("until the other crew brings the miners out") reading as the mortal's own choice about where to stand.
2. Step-2 success-side prose, "They give {actor} a tool", is enacted by the `rewardPool`.
3. `narrativeTemplates.failure` says "Another crew brought the miners out" in the past tense. The failure overview and reactions put that crew in the future, and no effect performs it. This is invented state and a page conflict. See Caveats.

No placed-and-timed promise exists, so there is no appointment to audit.

## 5. Chip referents resolve

| Chip | Referent | Resolves |
|---|---|---|
| Taken In | `$faction:builders_fellowship` | Pre-seeded faction. Yes. |
| Reeve trust chips | `$cast:reeve` (agent) | Support bundle actor. Yes. |
| Village regard | `$here` (location) | Yes. |
| Crushed Leg | `trait.condition.wounded` (attachment) and `$cast:miner` | Condition template exists; miner is a support actor. Yes. |

No chip points only at prose.

## 6. New Hooks Needed

None. No new roles, sublocation types, state fields, condition ids or node types. Support roles `silver_drift_reeve` and `silver_drift_trapped_miner` are compiler-registered through the package `supportBundle`.

## 7. Implementation File Map

Beyond the compiled set: none. The package compiles into the encounter module, its structural test and both registrations. Closeout stamps `hook.shifting_shape` into `src/data/content-eval/plotHooks.ts` `usedBy` (batch mechanic, not a hand edit for this slot alone). No art file is owed by the audit.

## 8. Verdict

**READY WITH CAVEATS.**

Caveats:
1. **Required package edit** (one line, prose only): `template.narrativeTemplates.failure`: "Another crew brought the miners out, and the reeve no longer trusts the master's reading of rock." -> "Another crew was sent for to bring the miners out, and the reeve no longer trusts the master's reading of rock." Reason: past-tense claim of an event that has not happened and no effect performs (rule 7/7b), and it contradicts the failure overview. Re-run the private gate after the edit.
2. **Package `doc` block is stale in places** (non-blocking, comment text only): "76 / 80" (the opening is now 73); "Cool failure ... another crew brings the miners out alive, one with a crushed leg" and "the fall comes down again on the miner" predate the editorial pass; the Standing line omits that step 0 and 1 bond/regard hits carry sentiment -0.04, trust -0.05. The structural fields are correct. Fix at the batch closeout if the doc block is meant to be read.
3. **Accepted limit (a)**, see below.
4. Evidence note from the brief: at master difficulty the proof ascendant loses most natural runs. Success-side rows (the join, the reward pool, the three success chips) need a seed sweep plus a pinned band, and unexercised rows on a failed run are not proof.

## Rulings on the editorial pass's three questions

**(a) `success_at_cost` carries the same chips as `success`: accepted limit, no edit.** Chips are keyed by the final band, and step metadata is only success-side or failure-side, so no effect can fire for sac alone. Sac is reached three ways: an earlier-step failure (the wound, reeve and regard hits do fire, unchipped), a near miss, or an at-cost landing. A chip that claims a wound or a debt would be false on the latter two. The honest cost lives in the step afterimages (a lost morning, the hoist timber, the lost drift, a stone on the miner), and the sac overview says only what is true on every route ("counting what the rescue cost the mine"). This is the same accepted limit as `witch-trial.package.json`. The package doc block already states it.

**(b) Reeve chips as `kind: reputation` with a `$cast:reeve` concept: confirmed.** The shape is identical to `witch-trial.package.json` (`reputation`, `stateNoun` text "reputation", `ui.reputation_with`, concepts `$cast:<key>` agent plus "trusts"). The backing effect is the `bond_change` with `withAgentId: $cast:reeve` on every step. The referent is a real support actor.

**(c) "The Builders Fellowship holds this mine. It takes in whoever brings its people out.": backed.** The second sentence is a standing fact enacted by the step-2 success `membership_change` join. It is not a later-tense promise about this mortal specifically. The first sentence is a scene-local claim about a pre-seeded faction, not graph state that any chip or effect depends on. It is acceptable under rule 7 because it asserts no node, edge or number that the run must contain and is true to the faction's world role. No edit.

## 9. Primitive Disposition

No missing primitives identified.
