---
lane: tb-design-lane
run: 2026-09-28a
promoted: 1
filed: 3
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-28 (run a, ~00:50Z)

## Needs Christian

Nothing needs you. No vetoes were waiting in the briefing.

## Decided for you

- [A world with a past](https://linear.app/threadbare/issue/THR-1631): **the plan is written and ready to build.** It follows your "a is fine" choice. New worlds get:
  - a founding age for every settlement;
  - one ancient war, drawn from the old battlefield ruins;
  - two or three wars people still remember, each leaving a burned town and a fallen commander;
  - five to ten of the dead;
  - descent from a dead empire for some of the people living on its land.

  You meet it in a "Before you woke" section at the top of the chronicle, and in one line on each settlement, ruin and dead person's page. Plan: [a world with a past](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1631-world-with-a-past.md). Six calls made along the way, each open to veto:
  - **Ages are words, not numbers.** "Founded 456 years ago" becomes "Founded about four centuries ago", because the game's rule is no raw numbers on screen.
  - **Only capitals get a named founder.** Every settlement gets a founding age, but naming a founder for all of them would mean 50–70 dead, far past the five to ten you chose.
  - **The outline is known from the start, and the details are found.** You find a detail by seeing a place, or by a Find or Perceive action on it. Until then, the chronicle says "a town burned and was never rebuilt" without naming it.
  - **Only heroes who already make their own choices get wants from the past.** One can want revenge for a fallen commander, now written as their kin. Another can want to find a wonder from its legend. Ordinary townsfolk get none, so history never adds to the number of people the game follows.
  - **"Win back the old homeland" is not handed out at game start.** Today that want needs a living person who seized something, and a dead empire has none. Descent is still written, and the question of how descent turns into that want is saved for a later design pass.
  - **The past is stored in the world itself, as events, the dead and their links, and not in a separate record.** Saved games carry it with no extra work.

Say "veto world with a past" to reverse this.

## Work

- **Claimed** [a world with a past](https://linear.app/threadbare/issue/THR-1631). Nothing was ready to build, so this run wrote a plan. Your choice on this ticket is three days old. The lane's two smaller calls on it are more than 24 hours old, with no veto.
- **Re-measured on today's `main`**, one test world (seed 42), with every code fact re-read. Two findings shaped the plan:
  - Worldgen seeds the ruins after the step where the rest of the living world is set up, so the past has to be written later in game start.
  - The existing chronicle history store is shown on no screen, so the chapter is a pinned section of the chronicle panel you already see.
- **Gates:** the intent judge allowed the plan and checked 28 of its code claims. Its three notes were folded in before merge:
  - who won a war is stored on the link between each Realm and the war;
  - one condition in the plan was unnecessary and was dropped;
  - a ruin says how it fell only where the game actually recorded that.

  The rules, completeness and Vision audits all passed.
- **Merged** via [PR #2108](https://github.com/christianspliid-ui/threadbare/pull/2108). The plan is live on `main`.
- **Handed off** slice 1 (writing the past into new worlds, engine only) to Ready for Dev, with its coordination block.
- **Filed** three tickets, each in Todo with its coordination block and waiting on slice 1:
  - [the player meets the past](https://linear.app/threadbare/issue/THR-1656): the chronicle section and the page lines;
  - [the past feeds ambitions](https://linear.app/threadbare/issue/THR-1657);
  - [a descendant can want the old homeland back](https://linear.app/threadbare/issue/THR-1658), a deferral that needs its own design pass.
- **Next run:** [faith and politics](https://linear.app/threadbare/issue/THR-1632) and [seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636) are free to start.

## Escalations

None.
