> **title:** The paid army turns at once — brainstorm companion — THR-2026
> **linear_issue:** THR-2026
> **author:** Claude Code (tb-design-lane, run 2026-11-07f)
> **created:** 2026-11-07

# The paid army turns at once — brainstorm companion

Companion to [the plan](2026-11-07-thr-2026-the-paid-army-turns-at-once.md). It records the shapes weighed and
the premises behind the one chosen.

## The question

An army that comes into its liege's pay keeps the conquer target it picked under its own banner. When that
target belongs to the liege's side, it marches on its paymaster until the next daily re-aim. Why did a re-aim
on the pay step not clear it, and where should the fix sit?

## Why the pay-step re-aim could not work

Two facts, both read from the code (quoted in the plan):

1. **Phase order.** `phaseArmyMovement` runs the re-aim first in the tick (`armyMovement.ts:90-95`, orchestrator
   `army_movement` before `crown`). The crown phase pays wages later in the same tick. So on a pay day the
   re-aim has already run under the vassal's banner when the commander flips. The next re-aim is
   `WAR_AIM_REAIM_INTERVAL_TICKS` (12) ticks away.
2. **The target can change sides after the pay step.** The THR-2020 evidence shows the violation starting at
   tick 170, two ticks after the tick-168 take-up, and ending at 179, the tick before the next re-aim. At tick
   168 the town was not yet on the liege's side, so a take-up check ("is the target's holder an enemy of the
   liege?") passed, and the objective survived. The town came onto the liege's side mid-day (a capture or an
   oath), when nothing was looking.

So a check that runs once, at take-up, misses the case it was written for. The check has to run where the
army moves, every tick, against the commander of *that* tick.

## Shapes weighed

| Shape | Verdict |
|---|---|
| **A. Re-aim inside `payWages` on take-up** | Rejected. Tried on the THR-2020 branch: it skipped `skipsReaim` (would re-aim mid-siege and `agenda` armies) and missed the seed-42 case, because the town turned two ticks later (fact 2). |
| **B. Run the whole daily re-aim every tick** | Rejected. Builds the war-aim context (realm projection, town values) for every army every tick. The orchestrator's scope note says not to widen the re-aim cadence. |
| **C. A per-tick guard in the army movement step: an army whose conquer target is on its commander's side re-aims now, through the same guarded per-army path** | **Chosen.** Narrow: it fires only for an army fighting for a liege (own faction ≠ commander) whose target is held by that commander or by a fellow vassal at peace with it, the measure's own predicate. The predicate reads two edges and no context, so it is cheap every tick. When it fires, the army goes through the same body the daily re-aim runs, so `skipsReaim`, defence-first and the traces stay one code path. |
| **D. The march step treats such a target as void (drop the objective, hold)** | Rejected. The army would stand idle until the daily re-aim, up to 11 ticks, with `holdReason` lying about why. C gives it a real target the same tick. |
| **E. Stamp the faction the objective was aimed for, and re-aim when the commander changes** | Rejected as the trigger: it catches the take-up but not fact 2 (the commander does not change when the town does). |

## Premises

- A paid army fights for its paymaster. The THR-1974 rule says the commander answers every army-level enemy
  question while the wage is fresh. Marching on the paymaster's own town breaks that rule for up to a day. It
  is a bug, so it is agreed work (D2), and no game meaning changes.
- The guard is scoped to the paymaster case only. A target that turns to peace with an unpaid army is
  still the daily re-aim's job (`target_no_longer_enemy`). Widening that is a cadence change nobody asked for.
- An army in a siege or with an `agenda` objective keeps its objective, exactly as the daily re-aim does
  (the ticket's Done-when).
