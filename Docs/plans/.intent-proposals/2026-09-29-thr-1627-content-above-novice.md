# Action proposal — content above novice (THR-1627)

## intent_quote

> "lets get the right long term design back on, and then we can always create more higher difficulty encounter, monster and undertaking content." — Christian, chat, 2026-09-24 (recorded on THR-1575 / THR-1627)

> "it is a constant we tweak as we search for a good game" / "follow the newer decisions" — Christian, 2026-09-26 07:05Z, on success-rate bands (recorded on THR-1581)

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations" — Christian, 2026-09-25 (design-lane mandate, THR-1611)

THR-1627's own scope, as filed from the second amendment of the forecast-window plan: (1) measure the local scale offset and rule on it under "difficulty = the proficiency a step demands" (THR-1577); (2) brief the content per band and per kind (encounter / monster / undertaking) and file each authoring batch; (3) re-arm the demoted invariant gates once a band has content. It is explicitly labelled "a design ticket — the design lane authors the plan".

## scope (what this plan does)

It rules `SCALE_DIFFICULTY_OFFSETS.local` from −0.10 to 0, on a four-value, five-seed sweep. It changes the coverage gauge to band content by the window mortals choose at, not by par, and adds an everyday-settlement-board table per reach. It lists the knock-on constants and tests that read the offset, each to be re-checked against its own purpose. It re-arms the level-success clause for bands that pass. It writes a per-band, per-reach, per-kind content brief: 36 everyday encounters and 2 monster elite cards, in seven tickets with a stop rule. It corrects the canon authoring paragraph on picking a difficulty.

## scope (what this plan does NOT do — explicit non-goals)

- Author any encounter (the factory does, per ticket, with Christian's 2-of-6 sample).
- Change `ODDS_AT_PAR`, `ODDS_GAIN`, the window, or any floor.
- Change the `personal` or `cosmic` offsets (unmeasured; < 1.5% of rolls).
- Make the situational content (forts, ruins, guild rungs, armies) fire. That belongs to the living-world plans.
- Give masters in-window fights (D5: that needs a fight-calibration pass on *severe*).
- Add undertaking cells (the existing ones already serve journeymen and experts by window fit).
- Any UI change.

## impact_class

High-risk (inherited). One constant moves 98% of rolls, and the world gets about nine points harder. It sits inside a parent (THR-1575) that was signed off, and it lands success inside the parent's own gate and Christian's own target band. The revert is one line.

## evidence cited

- **Linear issue:** THR-1627 (parent THR-1575; carved out by the THR-1581 second amendment). THR-1577 (UL-proposal: Difficulty).
- **Vision premises invoked:** the parent's tagline "what a mortal attempts grows with them"; the non-negotiables "failure never costs reach" and "every failure leaves a story".
- **UL terms touched:** Difficulty (THR-1577, already filed). The band names stay KPI-internal. No new term.
- **Canon pages consulted:** `Docs/canon/encounters.md` (difficulty paragraph, factory tooling), `Docs/canon/rulebook-quick-reference.md` (Resolution), `Docs/canon/process.md` rule 4, `Docs/canon/systems-inventory.md` (`engagement`, `kpi`).
- **Prior plan docs this builds on:** `Docs/plans/2026-09-24-thr-1575-forecast-window.md` and both of its 2026-09-26 amendments.
- **Measurements (this session, `origin/main` @ `4eb75754`):**
  - `gameplay-report` + `measure:roll-spread`, seeds 42/99/7/11/23 × 120, medium, local ∈ {−0.20, −0.10, 0, +0.10}; tables are in the plan;
  - an engagement-ledger harvest (seeds 42/99) by band: forecast zones, attempted difficulty, templates fired;
  - a catalogue census by scale, window-fit band, settlement board and reach.
- **Rejected approaches considered and dismissed:**
  - parity-sized brief (~200 encounters);
  - re-difficulty existing templates (breaks the prose);
  - actor-scaled difficulty and floors (forbidden by the parent);
  - keeping −0.10 because it "converts" authored proficiency to the window (it couples the content scale to the window constants and contradicts THR-1577).

## load-bearing decisions touched

None from CLAUDE.md's list. "Ascendants use the same prerequisite system as agents" is preserved: player casts read the same offset and are re-baselined, not special-cased.

## high-impact files touched (from Codesight)

None ≥ 100 importers. `resolutionScaleAdjust.ts` has 13 importers under `src/`; `engagementKpi.ts` and `kpiConstants.ts` are KPI-internal.

## kill criteria

- The ruled world reads as grinding → local to −0.05 after re-running the sweep. The brief is unchanged, because it is authored in demanded terms.
- After two journeyman batches (S3), the journeyman band's mean attempted difficulty still does not exceed the novice band's on 42 and 99, even with every reach at the floor → the board is the problem (draw weights, gating, too-easy fit). Stop authoring and re-plan before S4.
- In-window share still under 0.50 after S7 → report and re-plan (window or board, not content).

## explicit user sign-off

- Parent behaviour, 2026-09-24: "lets get the right long term design back on, and then we can always create more higher difficulty encounter, monster and undertaking content."
- Gate and band tuning, 2026-09-26 07:05Z: "it is a constant we tweak as we search for a good game"; "follow the newer decisions."
- Lane mandate, 2026-09-25: "you can probably iterate and progress designs without me in many situations."

## author notes for the judge

- The ticket said local was −0.20. It is −0.10 (`resolutionScaleAdjust.ts:37-42`). The sweep was re-centred on the real value; the plan says so in § Why and in the executor notes.
- The ruling makes the difficulty word (reads the authored number) and the roll (authored + offset) agree. That is a correctness gain the plan claims with no UI code change. Verify at `buildNudgePhaseModel.ts:702-704,937` and `scaledForecast.ts` `forecastActionAtScale`.
- Where I am least sure: (a) that 120-tick runs are enough to call expert and master level (n = 50–90 per seed per band); (b) whether per-reach floors 3/2/1 are enough. The stop rule and the S3 kill criterion are the hedge. (c) The partial re-arm uses the executor's own run, so a band may flip. The plan makes that a skip, not a stop.
- The lane chose not to reserve D1 for Christian. It is gate calibration under rule 4 and moves success toward his own target, and his 2026-09-26 words cover tuning these bands. The report invites a veto.
- Veto window: every input decision is from 2026-09-24 or 2026-09-26, more than 24 h before this run.
