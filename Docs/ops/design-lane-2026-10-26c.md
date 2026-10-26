---
lane: tb-design-lane
run: 2026-10-26c
promoted: 2
filed: 3
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-26 (run c, ~11:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

[The player still can't read what they spend or risk](https://linear.app/threadbare/issue/THR-2058): five calls inside [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2058-one-thing-at-a-time.md). Each can be vetoed on its own until Tuesday 11:38 UTC.

- **New panels arrive one per chapter.** After the bond, each time The First closes a chapter, one new panel arrives (Reaches and Dominion still come as a pair). If nothing happens for a while, the next one comes anyway. Today the Seat gift brings Doom, Mandates and Investiture together, and later everything else comes at once. That pile is where a round-5 tester quit. Each arrival's message says in one line what the panel is for. *Veto:* "the Seat should bring Doom, Mandate and Investiture together".
- **Rivals and the map's lens buttons wait their turn too.** Rivals come after a rival first acts. The Dominion lens comes with Dominion, Trouble with Doom, Threads with the Seat, and Trade last. *Veto:* "show all four lenses from the start".
- **The Attention gauge leaves the screen.** Nothing in the game spends Attention today, so the gauge always reads full (testers: *"I never saw it go down"*). What attending should cost is filed as its own question ([Attention is never spent](https://linear.app/threadbare/issue/THR-2062)). *Veto:* "keep the gauge on screen".
- **The essence arrow shows which way the pool is moving now.** Up while it refills, down only when it drains. Today a spend keeps it pointing down while the pool visibly climbs. The ▼ mark now follows only your own cards and casts. *Veto:* "the arrow should show the last few days".
- **The Needs-you number counts only what waits on you.** News stays in the list but no longer keeps the number up. *Veto:* "news should count".

The card legend now shows only the shapes on your hand and names the hollow ○. Each aftermath word carries a short meaning ("Scar · what it cost"). These are wording fixes, not calls.

## Work

- **Claimed** [THR-2058](https://linear.app/threadbare/issue/THR-2058) (the round-5 PC-1 recurrence, High). Shelf full (12 ready), no wayfinder map open, and the decisions it draws on (THR-1980, 2026-10-18) are past their veto window.
- **Measured** on `origin/main` @ `9685f6b8`: The Seat reveals three panels on one gift, and the 200-tick ceiling reveals every waiting row at once. `spendAttention` has no production caller. The spend-flash timer is cleared by the next refill render (a stuck ▼). The trend arrow nets two 100-tick windows.
- **Plan doc** [2026-10-26-thr-2058-one-thing-at-a-time.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2058-one-thing-at-a-time.md), with its [brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2058-one-thing-at-a-time-brainstorm.md), via [PR #2596](https://github.com/christianspliid-ui/threadbare/pull/2596). Intent judge: Revise (five legibility findings, all fixed), then Allow. NFP, pillar and Vision audits: PASS-with-notes.
- **Filed** in *Cold playtest · round 5*: [New things arrive one at a time](https://linear.app/threadbare/issue/THR-2060) (S1) and [Readouts say what they show](https://linear.app/threadbare/issue/THR-2061) (S2). Both are Ready for Dev and claimable from 2026-10-27T11:38Z. Also filed the deferral [Attention is never spent](https://linear.app/threadbare/issue/THR-2062).
- **Closed** THR-2058 under its Done-when (implementation tickets filed into the milestone), as THR-1807 and THR-1980 were.

## Escalations

None.
