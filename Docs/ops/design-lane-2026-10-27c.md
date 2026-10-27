---
lane: tb-design-lane
run: 2026-10-27c
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-27 (run c, ~11:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The seeded world ends after 41 ticks](https://linear.app/threadbare/issue/THR-2080) — **this is a bug, not Mandate pacing.** The Mandate measures how much the god's spheres have grown since the world began. It took that starting point before the world's first tick, and tick 1 builds about 69 new places (caravan rests, mines, smugglers' dens). Their arrival counted as growth: more than half the Mandate filled on tick 2, and the age ended in "fulfilled" by tick 58–77 with the god doing nothing. The fix takes the starting point once the world has settled. In the measurement, the seeded world then plays on past tick 600. *Veto:* "growth from the world's own new buildings should count toward the Mandate".

## Work

- **Claimed, decided and handed off** [The seeded world ends after 41 ticks](https://linear.app/threadbare/issue/THR-2080), the High bug from today's UX review that also blocks warm playtest round 3. Evidence on the ticket ([decision](https://linear.app/threadbare/issue/THR-2080)):
  - `?seeded` medium, seed 42: Mandate progress 0.02 at tick 1 → 0.64 at tick 2. The age ends at tick 58 with the dev test package and at tick 77 without it. The warm-up is not the cause.
  - Normal CLI play (seeds 42/99/7) shows the same tick-2 jump, and the age ends at ticks 114/125/127.
  - Cause: 1,079 places at tick 0, 1,155 at tick 1. The baseline is read before the 69 sublocation instances appear.
  - With the baseline re-taken after tick 2, the seeded world stays playing at tick 600 (Mandate 0.50, doom 0.74).
  - The ending was invisible until [The end of the age](https://linear.app/threadbare/issue/THR-1381) made a fulfilled Mandate end the run (2026-10-24).
  - Scripts on [`proto/thr-2080-mandate-baseline`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2080-mandate-baseline), which is never merged.
  - Moved to **Ready for Dev**, unassigned, with the coordination block (sonnet; mutex on `phaseMandate.ts`). There is no veto hold because it is a bug fix and two lanes wait on it.
- **Filed** [The world's own drift fills the Mandate with no god](https://linear.app/threadbare/issue/THR-2081) (Todo, blocked by THR-2080). Even with the baseline fixed, an unattended world reaches 50% of its Mandate (seeded) and up to 100% (CLI seed 99, by tick 250) with no player action. Whether the world's own growth should count is a design question, laid out with four options and not decided this run.
- **Skipped:** [Famine and glut draws](https://linear.app/threadbare/issue/THR-2040) (assigned elsewhere, and its re-plan waits on [the board reads the place](https://linear.app/threadbare/issue/THR-2071)); [the god's steering verbs](https://linear.app/threadbare/issue/THR-2073) (blocked by THR-2071); the money-encounters list is empty. No wayfinder maps are open, and the shelf holds 6 ready.

## Escalations

None.
