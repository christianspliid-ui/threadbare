---
lane: tb-design-lane
run: 2026-10-26f
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-26 (run f, ~21:15Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [A bounty is collected in a duel](https://linear.app/threadbare/issue/THR-2072) — five calls inside [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-26-thr-2072-bounty-collected-in-a-duel.md#decisions-this-plan-builds-on). Each can be vetoed on its own until Tuesday 21:05 UTC.
  - **A bounty is paid in a fight, not a scene.** When a guild puts a price on a cast-out member's head, the guild's own people who live near them may come for them in a duel. The three bounty scenes stay as they are; they come up about once a month and never name who is hunted. *Veto:* "a bounty should be a scene the hunter is drawn to".
  - **Any member of the guild can hunt, seen or unseen.** Mortals who make choices are near a hunted mortal for only 1 to 4 bounties a month, so if only they could hunt, almost no bounty would ever be paid. On three test worlds this gives about 6 to 15 bounty duels a month. *Veto:* "only mortals who make choices may hunt".
  - **The winner is paid, and the price is lifted.** If the hunter beats the hunted mortal, the coin the guild set aside goes to the hunter (a mortal who makes choices gets a little richer, the same as for a commission), and the mortal is no longer hunted. *Veto:* "a bounty should pay more than a commission".
  - **Whether the hunted mortal dies is the duel's own call,** exactly as in any duel today: the winner's nature decides mercy, and The First and your avatar are never killed. The bounty adds no "dead or alive".
  - **A price nobody collects goes back to the guild,** and a guild never sets two prices on the same mortal, or one on the dead. *Veto:* "a lapsed bounty's coin is spent anyway".

## Work

- **Claimed** [Plan doc: a bounty is collected in a duel](https://linear.app/threadbare/issue/THR-2072), split from [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954) (its last money row; that list now holds only the mill lease). Claimed at 20:54Z, after the [commission decision](https://linear.app/threadbare/issue/THR-2042) it builds on cleared its own veto window at 20:53Z.
- **Measured** first: [a census](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-bounty-census/scripts/bounty-census.ts) on a branch that is never merged. On three test worlds over 30 days, factions set 28 to 39 bounties, nothing ever collected one, and 1 to 2 a month were set on mortals already dead.
- **Gates:** the intent judge ruled Revise twice (missing duel lines, a goal the hunted side's win could not deliver, bounties aimed at whole factions) and then **Allow**. The design audit passed on all three axes.
- **Plan merged** in [PR #2612](https://github.com/christianspliid-ui/threadbare/pull/2612). Handed off to Ready for Dev with `Claimable from: 2026-10-27T21:05:00Z`, so the builder waits out your veto day.

## Escalations

None.
