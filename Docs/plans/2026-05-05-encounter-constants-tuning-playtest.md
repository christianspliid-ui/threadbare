> **title:** `Encounter constants tuning playtest — findings — THR-347`
> **lint_plan_doc:** exempt — this is a measurement/findings report, not a forward-looking plan doc. It specifies no system to build, so `## Engine pillar` / `## Wiring` / `## Tracing` / `## Coordination block` have nothing to say; the three defects it found carry their own tickets (THR-963/964/965) where those sections belong. See impediment #184.
> **linear_issue:** THR-347
> **author:** `Claude Code`
> **created:** 2026-05-05 (plan lineage) · **measured:** 2026-08-02
> **three_pillars:** Engine `done — measurement only, no engine change` · Content `N/A — no content authored` · UI `N/A — the constants reach no mounted surface; see "Finding 4"`

# Encounter constants tuning playtest — findings (THR-347)

*The playtest ran. Its finding is that four of the five constant families cannot be tuned yet, because the pipeline that consumes them has no producer — so no number in this file was changed.*

## Why this is load-bearing

THR-347 asked for a calibration pass over `src/data/encounter-experience-constants.ts` "against play data once v1 has shipped", on the correct premise that pre-implementation defaults are placeholders whose feel cannot be predicted. The premise has a hidden dependency: tuning a constant is only meaningful if play actually exercises it. This pass measured that first, and it does not.

Changing these numbers today would have produced a plausible-looking diff, a green test suite, and zero change to anything a player experiences — the exact shape of gate theater the project's evidence rules exist to prevent. The honest deliverable is the measurement plus three follow-up tickets, and no constants change.

## What was measured

Headless engine sweep, the sanctioned evidence shape for this ticket per its promotion comment ("engine-only verification … no browser-verify required"):

```
printf "tick 120\neval …\nexit\n" | npm run cli -- --seed 42 --map medium
```

`--seed 42 --map medium`, 383 agents at tick 120, 726 locations.

| Probe | Tick 30 | Tick 120 |
|---|---|---|
| `state.pendingChoiceCommits` | `[]` | `[]` |
| `state.regionalDetectionPressure` | `[]` | `[]` |
| `state.archetypeDrift` entries | 1 | 6 (of 383 agents) |
| Drift threshold crossings, any band | 0 | 0 |
| Detection threshold crossings, any band | 0 | 0 |

## Finding 1 — the choice-commit pipeline has no producer

Every non-test reference to `state.pendingChoiceCommits` is a read or a clear:

| Site | Role |
|---|---|
| `phaseChoiceResolution.ts:60` | read |
| `phaseChoiceResolution.ts:62`, `:140` | returns `[]` (clear) |
| `phaseDetectionPressure.ts:103` | read |
| `orchestrator.ts:2980` | assigns the cleared `[]` back |
| `types/gameState.ts:389` | type declaration |

No UI component, engine phase, or debug-bridge method ever enqueues a commit. `effectiveProbability` — required on the commit type — likewise has no production writer: it appears only in type declarations, test fixtures, the reader at `choiceResolution.ts:33`, and trace/debug-panel reads.

Consequence: `phaseChoiceResolution` early-returns every tick, and `phaseDetectionPressure` iterates zero commits and runs decay over an empty array. Tracked as **THR-964**.

## Finding 2 — detection pressure has a units mismatch that collapses its ladder

`baseDetectionDeltaForCost` (`detectionPressure.ts:23-27`) prices a detection delta by returning the **essence cost** constants (1 / 2 / 3), but pressure is clamped to `[0, 1]`. The sphere-visibility multiplier only ever returns 0.8 / 1.0 / 1.2, so the smallest possible delta is 0.8.

All three thresholds — `NOTICE = 0.5`, `TURN = 0.8`, `ENCOUNTER = 1.0` — are therefore crossed together on the first choice of any intensity, and at multiplier ≥ 1.0 the first choice also seeds a `shadow.rival_strike` rival encounter. The graduated "rivals are starting to notice → rivals turn → rivals move" escalation is unreachable by construction. Latent today only because of Finding 1. Tracked as **THR-963**.

## Finding 3 — the drift ladder is unreachable against its live writer

The live drift writer is not `phaseChoiceResolution` but `branchDecision.driftTowardPole` (`branchDecision.ts:318-329`), using `BRANCH_DECISION_DRIFT_MAGNITUDE = 0.08` from `src/data/nudge-constants.ts` — a different constant in a different file from the ones this ticket names.

Its doc comment states the intent: one fork is a lean, "three in the same direction register as who this person is becoming". But `3 × 0.08 = 0.24` against `DRIFT_THRESHOLD_SOFT = 0.30`. Three forks do not register; four are needed, and decay (0.001/tick, flat, on the accumulated entry) means those four must land within ~6 ticks of each other — half a game day — to clear the band at all.

Measured drift at tick 120, all six entries in the world:

| Agent | Axis | Drift |
|---|---|---|
| `elite_lair_12_50` | heart_axis | 0.048 |
| `elite_lair_1_50` | veil_axis | 0.047 |
| `ind_7` | heart_axis | 0.024 |
| `elite_lair_1_50` | iron_axis | 0.018 |
| `agent_mc_cmdr_1` | iron_axis | 0.000 (decayed out) |
| `ind_10` | stone_axis | 0.000 (decayed out) |

Every value is consistent with exactly **one** fork decaying since it landed (0.048 ≈ 0.08 − 32 × 0.001). No agent took a second fork in 120 ticks. Tracked as **THR-965**, which carries the creative-direction question.

## Finding 4 — the player-facing surface was built, then orphaned

*Correction to this doc's first revision, which said the scene-state indicators "were never landed (C4/THR-333)". They were: THR-333 is `Done`. The conclusion is unchanged — the constants reach no player — but the reason is different, and the difference matters to THR-964's retire-or-wire decision.*

`SceneStatePanel`, the C4 surface that would render drift and detection state to the player, has **zero importers** — not one, not test-only:

```
grep -rn "SceneStatePanel" src/ --include=*.ts --include=*.tsx | grep -v __tests__ | grep -iE "import|from"
(no output)
```

So the ladder is dead at both ends: no producer feeds the state (Findings 1–2), and no mounted component displays it. This is the same class as impediment #397, logged hours earlier by the sibling ticket THR-346 — the Nudge Model pivot (THR-775) rebuilt the encounter interface under `encounter-stage/` and `GameView` mounts that instead, leaving the Phase C/D surfaces built, tested, and unrendered. Tracked as a prune candidate in THR-951.

Practical consequence for THR-964: "retire the pipeline" is the cheaper option than it first appears, because the UI half of it is already unreachable and separately queued for pruning. "Wire the producer" would mean reviving a display surface too, not just an engine path.

## Calibration verdict, per constant

The ticket asks for "calibration adjustments documented with rationale per constant". The rationale for every one is *no change, and why*:

| Constant | Current | Verdict | Rationale |
|---|---|---|---|
| `CHOICE_PROBABILITY_TILT_SMALL/FULLER/DEEP` | 0.05 / 0.1 / 0.2 | **No change — dead lever** | Computed by `probabilityTiltForCost` only to fill a trace field. `resolveEncounterChoice` takes `commit.effectiveProbability` as given and never applies the tilt, so this would not move the roll even with a producer wired. |
| `CHOICE_DRIFT_MAGNITUDE_SMALL/FULLER/DEEP` | 0.04 / 0.07 / 0.12 | **No change — unreachable** | Reachable only via `heuristicDriftMagnitude` in the contract builder, landing on `PendingChoiceCommit.driftMagnitude`, which nothing produces. The live drift path uses `BRANCH_DECISION_DRIFT_MAGNITUDE` instead. |
| `DETECTION_THRESHOLD_NOTICE/TURN/ENCOUNTER` | 0.5 / 0.8 / 1.0 | **No change — fix units first** | Re-spacing bands is meaningless while a single choice delivers ≥ 0.8 of a 1.0 scale. THR-963 must settle the scale before these have a defensible value. |
| `DETECTION_DECAY_RATE_PER_TICK` | 0.005 | **No change — no data** | Pressure has never been non-zero, so decay has never run against a real value. |
| `DRIFT_THRESHOLD_SOFT/BANNER/BECOMING` | 0.3 / 0.6 / 0.85 | **No change — needs a design call** | Three candidate recalibrations exist (THR-965) and they imply different games. Picking one is creative direction, not measurement. |
| `PERSONALITY_DRIFT_DECAY_PER_TICK` | 0.001 | **No change — binding, but coupled** | This is the constraint that erases forks faster than they accumulate, but it cannot be set independently of the fork magnitude and band heights it interacts with. Settle THR-965 as a set. |

## What this pass could not establish

Background simulation under-samples the intended play pattern by construction: authored forks fire on threaded and attended agents, and a headless run has no player steering attention anywhere. So the *absolute* fork-frequency figure above is a floor, not the number a player would see.

The relative findings are unaffected — "no producer exists", "1 essence unit on a 0–1 scale", and "3 × 0.08 < 0.30" are grep and arithmetic, true at any fork frequency. But the ticket's original Approach step 1 ("run the four worked-example encounters") is genuinely an attended activity, and should be re-run that way once THR-964 has settled whether the choice pipeline lives or is retired.

## Constants table

No constant was added or changed by this pass. The table under "Calibration verdict" above records the current value and the verdict for each constant in scope.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| N/A — measurement only | No code path was added or modified; the tick loop is untouched. |

## Three-pillar check

- [x] Engine pillar present — measurement of three orchestrator phases; no engine change, findings routed to THR-963 / THR-964 / THR-965
- [x] Content pillar — N/A, no content authored
- [x] UI pillar — N/A; these constants currently feed debug traces and `DriftVisualiser` only. The player-facing C4 surface (`SceneStatePanel`, THR-333) shipped but has zero importers and is not mounted — see Finding 4 — which is why no browser-verify applies
- [x] Wiring section — no new module to wire

## Vision audit

- [x] This plan does not contradict any Vision premise. It reports that a system does not currently reach the player; it proposes no change to what the game is.

## Rulebook impact

- [x] This plan does not change a rule of play. It records that a documented rule (rival detection escalating in three stages) is not currently in effect, and routes the fix to THR-963.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | `PASS` | No magic numbers introduced. The pass explicitly declines to change tunables it cannot justify from evidence. |
| 2. Inspectability | `PASS` | Every claim is backed by a named file:line or a reproducible CLI probe. |
| 3. Determinism | `PASS` | Measurement used the fixed `--seed 42 --map medium`; no random code added. |
| 4. Fail-soft | `PASS` | No code path modified. |
| 5. Narrative over mechanical perfection | `PASS with note` | THR-965 frames its options in game terms — how fast a mortal visibly becomes someone — rather than as a numeric preference. |
| 6. Additive over destructive | `PASS` | Nothing deleted. THR-964 raises retirement as an option but defers the decision. |
| 7. Performance budget | `N/A` | No runtime change. |

## Done when

- [x] All constant families playtested at default constants (headless sweep, seed 42, medium map, 120 ticks)
- [x] Calibration adjustments documented with rationale per constant — verdict is *no change* for all six families, each with its reason
- [x] Follow-up defects filed: THR-963 (detection units), THR-964 (absent producer), THR-965 (drift ladder calibration)
- [x] `npm test` not required — docs-only diff per CLAUDE.md § Testing classification
- [x] Closing commit body includes the auto-close keyword for THR-347
- [x] `Browser-verify exempt: docs-only findings report; the constants in scope drive debug traces only, and no UI surface was touched`

## Notes for the executor

- **Do not tune these constants as a follow-up to this doc.** THR-964 decides whether the choice pipeline is wired or retired; tuning before that is wasted either way.
- The live drift writer lives in `src/data/nudge-constants.ts`, not the file this ticket names. A future tuning pass on drift should start there.
- `CHOICE_ESSENCE_COST_*` is load-bearing in two unrelated roles — an essence resource cost and a detection-pressure delta. THR-963 should split them rather than retune the shared value.
