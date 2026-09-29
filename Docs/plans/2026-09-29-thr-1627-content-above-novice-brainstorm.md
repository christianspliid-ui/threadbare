> Brainstorm companion to `Docs/plans/2026-09-29-thr-1627-content-above-novice.md` (THR-1627). Design lane, run 2026-09-29b.

# Content above novice — brainstorm companion

## What the lane expected, and what the measurements said instead

The ticket framed two levers: the local offset (cheap) and content (expensive). Going in, the expectation was "sweep the offset, then count templates per band". Four measurements changed the shape.

1. **The offset in the ticket was wrong.** Local is −0.10; personal is −0.20. The ticket's "local's −0.20 offset" was a misreading carried from the THR-1581 executor report into the second amendment and on into the ticket body. The sweep was re-centred on the real value.

2. **Masters and experts already engage — they just engage easy things.** Since THR-1584 made graduation worth something, the expert and master bands carry 45–90 free-choice engagements per seed. The ticket's picture ("journeymen and novices attempt the same near-trivial content") now holds for **every** band. At −0.10, the mean attempted difficulty is 0.05 / 0.08 / 0.05 / 0.08 across novice → master.

3. **The existing harder content is mostly unreachable.** Only 11 of 62 journeyman-fit templates fired in two seeds × 120 ticks. The unfired list (seed 42 + 99):
   - fort / castle: `siege_defense_planning`, `prisoner_interrogation`, `fortification_engineering`;
   - ruins: `delve_into_depths`, `decipher_ancient_inscriptions`, `restless_spirits`, `sunken_vault`, `broken_span`, `hollow_watch`, `seal_the_breach`, `arcane_cataclysm`;
   - mining: `mineral_vein_discovery`;
   - confront family (needs an opposing band): `confront_ambush`, `confront_den_assault`, `confront_guild_falls`;
   - guild rungs: the `mc.quest.*`, `mc.senior.*`, `mc.elite.*`, `ag.quest.*`, `ag.senior.*`, `ag.elite.*` and promotion templates;
   - armies: `mc.army.raise`, `army.threshold.*`, `army.supply.*`, `army.aftermath.refugees`;
   - monsters and fights: `monster.hunt.named_elite`, `monster.encounter.*`, `fight.lair.confront`, `fight.duel.grudge`;
   - rare or undrawable: `encounter.slice.swindler_found` (`drawable: false`), `the_table_that_holds` (reputation-gated), `encounter.apotheosis.ascension`, `encounter.border.standing_the_line`, `encounter.hunt.the_beast_in_the_granary`, `social.political_leverage`, `social.intimidate`.

   These are the world's systemic, situational content. They light up as the living-world work makes ruins visited, wars fought and guild ladders climbed. Authoring *more* of that kind would add to a pile that already does not fire. So the brief targets the everyday settlement board.

4. **The coverage gauge bands content at par, not at the window.** At par (40%) is below the window mortals choose (50–65%). The gap is 0.14 of capability, about half a band. The at-par table understates journeyman coverage (41 vs 62) and hides the expert-fit templates (1 vs 7).

## Offset options considered

| Option | For | Against |
|---|---|---|
| Keep −0.10 | No change; novices keep the easiest world | Misses the total-success ceiling on seed 7 and the streak p95 on 99/7; the word shown ≠ the difficulty rolled; lowest in-window share |
| −0.20 | Easiest; highest success | 70–80% success, above Christian's target |
| **0** | THR-1577 literally true; word = roll; best in-window (46%); trend > 0 on all seeds; inside every gate on 42/99/7; success lands in the 0.50–0.65 target on 4/5 seeds | World ~9 points harder; weak mortals (raw < 10) drop to 26% |
| +0.10 | Content serves the highest bands | In-window falls back to 39%; 2.3% floor-pinned; weak mortals at 21% |
| Set every scale to 0 | One principle everywhere | Personal and cosmic unmeasured; under 1.5% of rolls; "cosmic feels earned" is a separate call |

A tempting reading: −0.10 "happens to" convert authored proficiency into the window, because −0.10 ≈ the 0.14 fit gap. So a mortal exactly as able as the author wrote forecasts 0.525, inside the window. That argues for keeping it. But it makes the author's number mean "the proficiency that *chooses* this", not "the proficiency this demands". That contradicts THR-1577 and the canon paragraph authors already follow. It also couples the content scale to the window constants: retune the window and every authored number silently changes meaning. The ruled version decouples them. Authored numbers mean demand, and the gauge derives the fit gap from the live constants.

## Brief-sizing options considered

- **Parity with novices** (~94 journeyman, ~63 expert, ~47 master everyday encounters). Rejected: about 35 factory batches, each with a Christian sample, for a band split where novices are only 43% of engagements.
- **Proportional to engagement share** (~80 / 36 / 28). Still over 20 batches.
- **Per-reach floors 3 / 2 / 1 (chosen).** Bands are per reach, so a floor per reach is what guarantees "a mortal of this band has something". It comes to 36 encounters, with a stop rule that lets the gauge close a ticket early.
- **Re-difficulty existing templates.** Rejected: an authored difficulty is welded to its prose and outcome bands. Doubling up a novice scene as an expert scene by changing a number breaks the fiction.
- **Actor-scaled difficulty or harder variants picked by the mortal's level.** Rejected by the parent plan (never actor-scaled difficulty).

## Tensions left open (not forks — noted for later passes)

- **Personal and cosmic offsets.** Same principle; unmeasured; tiny share.
- **Masters' fights** (D5). They need a fight-calibration pass on *severe*.
- **Undertakings at master level.** Revisit after S7.
- **The situational pile firing.** It belongs to the living-world plans (lead climb, guild ranks, war) and is not this ticket's.
