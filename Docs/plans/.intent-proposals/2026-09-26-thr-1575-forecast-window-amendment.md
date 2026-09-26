# Action proposal — forecast window amendment 2026-09-26 (S3 + S4 as one change)

Plan doc: `Docs/plans/2026-09-24-thr-1575-forecast-window.md` § Amendment 2026-09-26 (plus the edited rows in § Slices, § Done when S3/S4, § Coordination block).

## intent_quote

The design itself is Christian's 2026-09-24 ruling, quoted in the plan's § Why this is load-bearing:

> "we will aim for agents aiming for the same general success rate … who a mortal is should count a lot. The scaling should allow more proficient mortals to tackle higher difficulty challenges … less proficient mortals would shy away from higher difficulty encounters … the 50–65% success rate is what a mortal would deem acceptable as forecast in order to actually actively engage with the challenge."

This amendment was requested by the orchestrator's design-staging comment on THR-1581 (2026-09-24 ~21:35Z):

> "Amend `Docs/plans/2026-09-24-thr-1575-forecast-window.md` via a `docs/plan-*` PR: Decide the sequencing: the executor recommends landing S3 + S4 as **one change**, with the S3 kill criterion measured with the window in place. Restate the kill criterion accordingly. Re-point THR-1582's `Blocked by` (merge the tickets, or make S4 carry S3's branch). Record the two findings for S4's review."

Standing delegation (Christian, 2026-09-12, `Docs/canon/process.md` § User review interface rule 4): gate/test calibration and the *how* of an already-agreed design are the agent's to make.

## scope (what this plan does)

Changes the delivery order of an already-ruled design, and nothing about its target. S3 (dice re-fit) and S4 (forecast window) ship as one PR on the existing `thr-1581-dice-refit` branch. S3's interim total-success gate (0.45–0.72 "with choices still as after S2") is retired because it fails by construction. Its choice-independent checks stay as gates on the combined change. The dice-only numbers become a diagnostic column. Two findings from the S3 run are carried into the combined Done-when:

- **Branching fires.** They are gated at the existing `KPI_BRANCHING_FIRE_MIN_PER_30T` floor.
- **At-cost share.** The existing stop-and-ask-Christian rule is unchanged.

The PR also re-baselines on today's `main`, since THR-1535 and the fight block have landed, and updates the stale mutex lines.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change any constant, formula, window edge, KPI target or the whole-design kill criterion.
- Does not retune toward the failed number. The plan's rule "never restore a floor to hit a number" stands.
- Does not move the at-cost band. That is Christian's July ruling, and it still stops the executor.
- Does not add a branching-specific bonus to the fit.
- Does not cancel THR-1582. It closes on the same PR.
- Does not touch S5 (THR-1583) or the pre-refit readers Deferral (THR-1580).

## impact_class

High-risk. The parent design moves every roll. The amendment itself is Reversible: it changes sequencing and gates, not behaviour, and the parent's High-risk sign-off still covers the behaviour.

## evidence cited

- **Linear issue:** THR-1581 (staged for this amendment), THR-1582, parent THR-1575
- **Vision premises invoked:** unchanged from the parent: north star (the player hesitates); non-negotiables (interventions shift probabilities; narrative over mechanics)
- **UL terms touched:** none new. THR-1577 (difficulty = the proficiency a step demands) is unchanged.
- **Canon pages consulted:** `Docs/canon/process.md` (rule 4), `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** the parent plan doc
- **Measured / verified this session:**
  - `KPI_BRANCHING_FIRE_MIN_PER_30T = 1` (`src/engine/kpi/kpiConstants.ts:58`)
  - `BRANCHING_QUEST_SKIP_OUTGROWTH = true` (`src/engine/encounter/branchingConstants.ts:50`)
  - `OUTGROWTH_FILTER_ENABLED = true` still on `main` (`src/data/agent-behavior-constants.ts:566`), so S4 is unbuilt
  - branch `thr-1581-dice-refit` is 3 commits ahead of `origin/main` and 135 behind
  - THR-1535 is Done (2026-09-24 22:44Z)
  - every Physical Conflict fight/duel slice is Done
  - The KPI numbers in the amendment are quoted from the executor's report on THR-1581, not re-measured.
- **Rejected approaches considered and dismissed:**
  - (a) Retune `ODDS_AT_PAR`/`ODDS_GAIN`/`SIGMOID_*` so S3 alone hits 0.45–0.72. That is tuning toward a number, and it makes an even match read perilous.
  - (b) Land S4 first, on the old dice. The window reads a saturated forecast (capability ~0.98), so it would have nothing to separate.
  - (c) Keep S3 separate but relax its gate to "any". That merges an unlevelled world to `main` for however long S4 takes. The live build would be easier than it is today.

## load-bearing decisions touched

None. The amendment changes no architecture. The parent's decisions (additive over destructive; no difficulty scaled to the actor) are restated, not altered.

## high-impact files touched (from Codesight)

None by this amendment (docs only). The parent's Blast Radius section stands for the combined change.

## kill criteria

- The parent's whole-design kill criterion stands unchanged. If novice or journeyman level success needs a floor or actor-scaled difficulty, the ticket returns to design.
- New in this amendment: if branching fires stay below `KPI_BRANCHING_FIRE_MIN_PER_30T` with the window in place, the executor stops and reports with traces.
- If at-cost leaves 0.30–0.70, the executor stops and the finding goes to Christian.
- If the combined change cannot be finished on one branch, the executor checkpoints; nothing merges partially.

## explicit user sign-off

The behaviour is covered by the parent's sign-off (Christian, chat, 2026-09-24, quoted in the parent proposal `Docs/plans/.intent-proposals/2026-09-24-thr-1575-forecast-window.md` § explicit user sign-off). This amendment is sequencing and gate calibration, which the 2026-09-12 delegation hands to the agent. It is decided by the design lane under `Docs/canon/process.md` rule 4, and Christian is invited to veto in chat.

## author notes for the judge

- **Least certain.** Whether the window alone brings at-cost back into 0.30–0.70. The mechanism argues yes: even-odds engagements land in `success_at_cost` far more often than 0.95 ones. But no model has measured it. That is why the stop-and-ask rule is kept rather than softened.
- **Why the branching gate is not new tuning.** The branching gate uses an existing KPI floor, not a new number. The executor's S3-only run already breached it on seed 42.
- **Why one PR rather than merging the tickets.** THR-1582 stays open so its scope list and Done-when remain the S4 checklist. Closing it on the same PR avoids cancelling a ticket whose work ships (see the project memory: "shipped-under-sibling = park, never cancel").
