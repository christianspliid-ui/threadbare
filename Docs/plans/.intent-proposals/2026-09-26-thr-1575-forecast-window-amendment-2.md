# Action Proposal — forecast window, second amendment 2026-09-26 (ship the dice, carve the content)

## intent_quote

Christian, chat, 2026-09-24 (the parent ruling, recorded on THR-1575):

> "we will aim for agents aiming for the same general success rate … who a mortal is should count a lot. The scaling should allow more proficient mortals to tackle higher difficulty challenges … less proficient mortals would shy away from higher difficulty encounters … the 50–65% success rate is what a mortal would deem acceptable as forecast in order to actually actively engage with the challenge."

> "lets get the right long term design back on, and then we can always create more higher difficulty encounter, monster and undertaking content."

Christian, Discord DM, 2026-09-26 07:05Z (relayed on THR-1581 by keep-work-flowing-cc; the author was verified against the allowlist):

> "follow the newer decisions, we learn and grow and evolve. 1 in 6 is fine."
> "it doesnt have to be a rule, it is a constant we tweak as we search for a good game."

The orchestrator's staging comment on THR-1581 (2026-09-26 08:30Z) asks for a ruling on four things:
- the S4 invariant: narrow it, or hold the branch for content;
- the fight re-fit;
- the duel pin;
- whether to file a content ticket.

## scope (what this plan does)

This amends `Docs/plans/2026-09-24-thr-1575-forecast-window.md` a second time. It changes no code.

1. The combined S3 + S4 change ships at `ODDS_AT_PAR` 0.40.
2. Its gates narrow to what the dice and the window control:
   - the S3 mechanical checks;
   - the novice band level;
   - the two traps;
   - variety, theme and branching;
   - total success 0.45–0.72.
3. Journeyman-and-up band success, in-window share and the difficulty rise become reported content KPIs, owned by a new ticket, THR-1627. That ticket measures the local scale offset first, then briefs the content.
4. The fight and duel calibration fixtures are re-stamped so that each step's probability on the new dice equals its probability on `main`. `FIGHT_RATING_DIFFICULTY` stays as it is. A calibration miss stays a stop.

## scope (what this plan does NOT do — explicit non-goals)

- It does not change `SCALE_DIFFICULTY_OFFSETS`. The local offset is measured in THR-1627 before anyone rules on it.
- It restores no floor and scales no difficulty to the actor. The novice kill criterion stays.
- It authors no content and rewrites no templates.
- It re-rates no fight ratings, and it changes neither `DIFFICULTY_WORD_BANDS` nor the THR-1531 rows.
- It does not change the at-cost band as a design value. Christian already made it report-only.
- It does not touch S5's sheet words (THR-1583) or the pre-refit readers (THR-1580).

## impact_class

High-risk (inherited). The change it gates moves every roll and every free choice. This amendment only calibrates the gates and sequences the work; the behaviour it gates is the parent's, and the parent was signed off.

## evidence cited

- **Linear issue:** THR-1581 (carries S3 + S4). THR-1582 closes on the same PR. New: THR-1627.
- **Vision premises invoked:** the north star ("the player hesitates"), via the parent's Vision audit.
- **UL terms touched:** none new. "Difficulty = the proficiency a step demands" is THR-1577, already filed. The band names stay KPI-internal.
- **Canon pages consulted:** `Docs/canon/process.md` (rule 4), `Docs/canon/rulebook.md` §7 (via the parent).
- **Prior plan docs this builds on:**
  - `Docs/plans/2026-09-24-thr-1575-forecast-window.md` and its first 2026-09-26 amendment;
  - `Docs/plans/2026-09-23-fight-block.md` (FB7 calibration and its kill criteria).
- **Measurements cited:** the executor's THR-1581 comments of 2026-09-26 01:25Z and 08:24Z, covering:
  - the `ODDS_AT_PAR` sweep over 0.55 / 0.40 / 0.42 / 0.45, on seeds 42 / 99 / 7 plus 11 / 23;
  - `measure:roll-spread` coverage (234 / 41 / 1 / 1);
  - the fight fixture at capability 1.0: won 18.5% against the row's 2%, and struck down 2.5% against 14%;
  - the duel: 63.8% against 49%.

  Verified on the branch by this session: `ODDS_AT_PAR = 0.40` (`resolutionService.ts:88`), `STRONG_RAW_CLASH = 30`, `stronger_by_clock: 49` (`duelCalibration.ts`), and `BOLD_GUARD_CLASH_CAPABILITY = 1.0` (`fightCalibration.ts` on `main`).
- **Rejected approaches considered and dismissed:**
  - **Content-first** (hold the branch until journeyman content exists). It reverses Christian's stated order, and it keeps a working dice change off `main` for weeks.
  - **Zeroing local's offset now.** Unmeasured, and it moves 97% of rolls.
  - **Re-rating `FIGHT_RATING_DIFFICULTY` up about 0.4.** It breaks the word bands, and it treats a master winning as a defect.
  - **Restoring floors.** Forbidden by the parent.

## load-bearing decisions touched

None from CLAUDE.md's list. All changes stay inside the resolution constants and the test fixtures.

## high-impact files touched (from Codesight)

None. This is a docs-only amendment. The parent's Blast Radius section still covers the executor's change.

## kill criteria

- **Novice band.** If it cannot be held level at any `ODDS_AT_PAR` / `ENGAGE_*` setting without a floor or actor-scaled difficulty, the ticket returns to design. This is unchanged.
- **Fight or duel calibration.** If the odds-preserving re-stamp misses its row by more than 10 points, something other than the curve moved. The executor stops and reports, with no re-rate.
- **Content KPIs.** If THR-1627's offset sweep plus the content brief still cannot level journeymen once content exists, the premise fails for real, and the forecast window returns to design as a whole.

## explicit user sign-off

- Parent behaviour, 2026-09-24 (quoted above; recorded on THR-1575): "lets get the right long term design back on, and then we can always create more higher difficulty … content."
- Gate flexibility, 2026-09-26 07:05Z: "it is a constant we tweak as we search for a good game." And: "follow the newer decisions."

## author notes for the judge

- **Why the gate narrows instead of the design changing.** Every measured failure traces to the content above novice being missing. None traces to the dice.
- **Is the fixture re-stamp "tuning toward the number"?** Please check this. My argument: the rows describe a matchup, "a bold guard against a steep elite is close". The capability 1.0 in the fixture was the saturated curve's reading of every protagonist. Preserving the step probabilities preserves the matchup. Tuning toward the number would mean keeping the fixture at 1.0 and re-rating the opponents.
- **Total-success gate.** It widens to the 0.45–0.72 band S3 carried originally. The reason is per-seed noise of about ±10 points: seed 11 read 0.71 at 0.40.
- **Veto window.** This builds on a lane decision under 24 hours old. Christian has already engaged with that decision, so the plan treats the window as satisfied. If you think it is not, say so.
