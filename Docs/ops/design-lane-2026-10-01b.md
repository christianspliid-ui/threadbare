---
lane: tb-design-lane
run: 2026-10-01b
promoted: 1
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-01 (run b, ~06:18Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The candidate cap starves newly written everyday content](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert): **an expert in a town now gets to consider the expert work on offer there.** Today she almost never does (about 1 time in 20). Each mortal has a shortlist of about 30 things it can do where it stands, and that list is filled in the order the encounters were written. All the harder content was written last, so it was always cut. The calls made:
  - **The shortlist becomes a fair draw.** Every encounter in the mortal's town gets the same chance each turn, whatever order it was written in. A mortal who stays put sees the whole town's work over a few turns.
  - **It does not favour work that suits the mortal.** I considered keeping a few places for work at the mortal's level, and decided against it. Choosing suited work is what the mortal's own judgement already does, one step later. Doing it twice would hide which of the two made the choice.
  - **The test is fairness, not a target score.** Expert work now survives the shortlist at about 0.8 the rate of novice work (from 0.1). The small remaining gap is honest: easy work is offered in more places nearby.
  - **In a trial build (thrown away afterwards), experts started choosing harder work than journeymen** on all three test worlds. The measure of how hard the work they attempt is went from 0.13 / 0.16 / 0.12 to 0.24 / 0.23 / 0.23, and they took on half again as much of it.

  Plan: [the shortlist's local draw](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-01-thr-1687-cap-local-order.md). To reverse the main call, say that the shortlist should keep some places for work at the mortal's level. This is not ready for you to look at until it is built.

## Work

- **Chosen:** the build shelf held 2 jobs (floor 4), and no map was open. This was the one design request the orchestrator had staged. It is on the critical path of the content-above-novice program: the master encounters wait on it.
- **Measured before deciding** (main `e5118533`, medium, 120 ticks, seeds 42 / 99 / 7). Each mortal's shortlist was built twice on the same turn: as shipped, and with a fair draw.
  - **The cause is confirmed.** Encounters in the third quarter of the catalogue reached the mortal's own list 0.8% / 1.4% / 1.1% of the time. The first quarter reached it 59–63% of the time.
  - **A mortal's town offers 87–117 different encounters** (the median, by seed) against 40 shortlist places. No number of places fixes this, so the fix has to be the order.
  - Separating the shortlist from the earlier checks: for an expert mortal, the shortlist kept expert work 7% / 7% / 6% of the time and novice work about 50%. With the fair draw it kept expert work 36% / 39% / 35% and novice work 46% / 49% / 43%.
  - The fair draw costs no more time per decision than the shipped one.
- **Reported, not chased:** the share of choices inside the 50–65% odds window does not go up with the fix. It dips 1–2 points (0.475 → 0.446 on seed 42). So the shortfall is not about what reaches the board. It is filed for measurement below.
- **Trial:** about 20 lines in the shortlist, run in both versions on three seeds and then reverted. Nothing reached `main` from it. The reader and its results are committed: [the measurement data](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/cap-band-2026-10-01-thr1687.txt).
- **Checks:**
  - The independent plan reviewer approved. Its one catch: two sections disagreed on what an unrecognised setting does. Fixed before commit.
  - The three side reviews passed (rules, completeness, vision), two with notes. The notes are recorded in the plan.
- **Plan merged:** [PR #2161](https://github.com/christianspliid-ui/threadbare/pull/2161).
- **Handed off:** [The candidate cap starves newly written everyday content](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert) is in Ready for Dev with its build notes. Like any lane decision, it waits out the 24-hour veto window (closes around 08:45 tomorrow your time) before building.
- **Filed** (both in Todo, both waiting on the fix):
  - [The master everyday encounters](https://linear.app/threadbare/issue/THR-1688/content-above-novice-s7b-master-everyday-encounters-1-per-reach-once). The trial showed masters falling below experts, because no master work exists yet. The earlier master ticket closed without writing them, so nothing was tracking this batch.
  - [Why fewer than half of choices land in the odds window](https://linear.app/threadbare/issue/THR-1689/in-window-share-sits-at-045-even-with-the-shortlist-fixed-measure). A measurement only, with no tuning.

## Escalations

- None.
