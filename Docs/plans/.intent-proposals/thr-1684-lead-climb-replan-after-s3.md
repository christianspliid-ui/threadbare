# Action proposal — THR-1684 re-plan after S3 (lead climb: survey and visit rungs)

Amends `Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md` with a new § *Re-plan after S3 (2026-10-01, THR-1684)*, re-baselines the S3 Done-when and kill criteria, adds three constants rows and Decided-list item 7. Files implementing ticket THR-1686.

## intent_quote

THR-1684 (filed 2026-09-29 by the executor of THR-1664, staged by tb-orchestrator T2):

> The S3 kill criterion fired when THR-1664 shipped the visit: "if no seed produces a `located` lead and a delve in 300 ticks … report the starving rung and re-plan. Never widen the dice."

> **Levers to weigh (design lane):** Lead hand-off, the plan's named next lever for visit supply (§ Re-plan after S2, option a). A hold on `waiting` mortals at an appointment's place (the appointment substrate, THR-1479). This would also help hunts. First trace what pulls a waiting mortal away. Making ruin surveys less fragile to world perturbation. For example, the lead survey candidate is admitted but loses on the board. Measure `leadPull` against the winners, as THR-1663 did.

> **Done when:** a re-plan is recorded in the plan doc with the chosen lever(s), and the ticket that implements them is filed.

Christian, 2026-09-25 (THR-1611, the design lane's charter): "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

Christian, 2026-09-24 (THR-1575, the forecast-window ruling, the constraint this re-plan must respect): "the 50–65% success rate is what a mortal would deem acceptable as forecast in order to actually actively engage with the challenge." With the addendum: never recreate retry loops, never restore floors or scale difficulty to the actor.

## scope (what this plan does)

Records which rungs of the hear → survey → visit → delve chain starve on current main and why (measured), and chooses three engine levers for one implementing ticket: (1) on the decision board, an instant survey of a ruin the actor holds a lead on takes forecast 1 and fit 1 instead of passing through the forecast window, because an instant cell has no dice; (2) the appointment regime block gains `waiting`, which drops non-local candidates that would overrun the time to the due tick; (3) `leaning`'s existing overrun discount is carried into the live board, where today it is dead. It re-baselines the S3 Done-when from "located + delve on each seed" to "≥ 2 visits per seed and ≥ 1 located + delve across a four-seed census", with an `observe`-count guard.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change any dice, difficulty, scale offset or floor; does not touch `INSTANT_COMPLETION_BAND`, `OBSERVE_CLUE_PRECISION_BY_BAND`, or the visit's precision ladder.
- Does not exempt instant cells in general from the forecast window (measured and rejected; recorded as an observation for the forecast-window design's owner).
- Does not build lead hand-off (measured unnecessary: ≥ 3 visits arranged per seed with parts 1 + 2).
- Does not raise `CLUE_LEAD_SURVEY_PULL_MULT` or `CLUE_BIAS_DECIDER`.
- Does not fix the full-moon-collection misses (mortals planted ~130 ticks early who leave legitimately and cannot get back) — a separate walk problem.
- No content or UI change; no new node, edge, phase or trace category.
- Does not write `src/`; the measurement patch was local, uncommitted and reverted.

## impact_class

Reversible. Docs-only PR now; the implementing ticket ships three kill-switched or additive engine changes.

## evidence cited

- **Linear issue:** THR-1684 (implementing ticket THR-1686); prior re-plan THR-1675; S3 THR-1664 (PR #2151); S2 THR-1663; THR-1627 / PR #2143 (local scale offset); THR-1479 (appointments); THR-1575 (forecast window).
- **Vision premises invoked:** systemic over scripted; god, not protagonist (the dice of the visit stay the mortal's, nudgeable by the god).
- **UL terms touched:** lead, appointment, forecast window, undertaking, instant cell. "Lead" has no UL entry (THR-1662, pre-existing).
- **Canon pages consulted:** `Docs/canon/process.md` (rule 4), `Docs/canon/systems-inventory.md` (appointment, clue, ruins rows), `Docs/canon/interface-map.md`.
- **Prior plan docs this builds on:** `Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md`; `Docs/plans/2026-09-24-thr-1575-forecast-window.md`.
- **Rejected approaches considered and dismissed:** all instant cells skip the window (+560% to +2120% `observe` undertakings vs main, measured); raising the lead pull (wins 3/10/22 of 42 rows at ×5/×10/×25 on seed 42, nothing for refused holders); scaling survey difficulty to the holder (forbidden by the THR-1575 ruling); lead hand-off (not starving); resolving an appointment on early arrival (a timing change to the hunt's confront, not a narrow fix).

## load-bearing decisions touched

- Determinism: no PRNG added; filters and multipliers only.
- Fail-soft: every new branch degrades to today's behaviour (kill switches; absent fields treated as 1 / not exempt).
- Agent position three-tier model and hex-distance reasoning: the `waiting` filter uses `hexDistanceToEntry` and resolves the place to a hex, the same as `departing`.
- None is changed.

## high-impact files touched (from Codesight)

None ≥ 100 importers. `encounterScoring.ts` (25 importers by grep, one optional field on `ScoredCandidate`), `engagementWindow.ts` (4, one additive union value), `decisionBoard.ts`, `phaseAgentDecision.ts`, `ruins/constants.ts`, `movement-content.ts`.

## kill criteria

- After the build, any of seeds 42 · 99 · 4 · 8 arranging fewer than 2 visits brings lead hand-off forward.
- Fewer than a third of resolved visits kept points the next re-plan at the walk to the place (`far → leaning → departing → lost`), never the dice or the window.
- `observe` undertakings other than ruin surveys above +50% of baseline on any seed: the exemption is wider than intended; narrow it or switch `CLUE_LEAD_SURVEY_SKIPS_WINDOW` off.
- The budget harness over +10%: ship with the switch off and re-plan.

## explicit user sign-off

Not required (Reversible). Decided by delegation under process.md rule 4; veto invited in the lane report.

## author notes for the judge

- The main judgment call is whether skipping the forecast window for the lead survey contradicts the THR-1575 ruling. My reading: the ruling governs which *challenges* a mortal engages by their forecast odds. An instant survey has no roll (it always completes at `INSTANT_COMPLETION_BAND`), so the window judges a roll that never happens; the climb's real dice are the visit's, and those are untouched and still nudgeable. Nothing scales difficulty to the actor. If you read it as a fork in what the game should mean, Escalate and I will reserve it for Christian.
- The measured arms came from a local patch that I reverted. The patch was ~12 lines: in `scoreUnifiedBoard`'s strategic loop, `exempt = candidate.executionMode === 'instant' && candidate.leadPull !== undefined` → `advanceProbability = 1`, `engagement = { fit: 1, zone: 'in' }`; and in `phaseAgentDecision.ts` a `waiting` branch filtering `topCandidates`/`rankedCandidates` by `hexDistanceToEntry > 0 && overruns(c)` with budget `dueTick − tick`. Part 3 was not measured; the plan says so.
- Measurement provenance: the board-loss replay (`leadsurvey.ts`) and the appointment trace (`appt-hold.ts`) were run by subagents on main `218cdfa7`; the four-arm census JSON is committed at `Docs/audits/2026-09-25-living-world-data/output/upkeep-2026-10-01-thr1684-arms.json`. The replay figures (63/61/12/0, 30/30/6/0) and the seed-8 trace lines are quoted from those runs; their raw JSONs are not committed (scratch).
- Seed 4's −17% engagements in the chosen arm is reported as a butterfly effect; the budget harness gates it.
