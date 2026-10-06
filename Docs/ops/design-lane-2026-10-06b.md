---
lane: tb-design-lane
run: 2026-10-06b
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-06 (run b, ~06:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Buy your spheres](https://linear.app/threadbare/issue/THR-1749/buy-your-spheres-point-buy-across-the-eight-creation-spheres-at): your point-buy ruling is now designed ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-06-thr-1749-buy-your-spheres.md)).
  - **The buy.** After you pick your hunger and court, you pour yourself into the spheres: **five measures, at most three in one sphere**. The screen shows **four rows, one per opposed pair** (Force against Mind, Matter against Time, Energy against Spirit, Life against Entropy). You can only lean each row one way, so you never buy both poles. It opens already filled in from your hunger, so one click keeps today's god.
  - **Income.** It follows what you poured. A hunger's suggested split earns almost exactly what it earns today. An empty sphere still trickles, never zero. Spreading wide (2/1/1/1) gives you more spheres but a thinner pool to pay your mortals from.
  - **Three hungers lose a sphere.** Your rulebook says the elder spheres are found in ruins, not chosen at the start, and the one-side-per-pair rule forbids Force with Mind. So **Haunt loses Darkness** (now Spirit and Entropy), **Illuminate loses Light** (now Mind and Energy), and **Reshape** becomes Force and Matter. Their stories stay word for word.
  - **Elder cards leave the start.** Whisper, Veil, Undertow and Order's Favor can no longer come from your god's identity until elder magic gets a ruin route. I filed that as its own job.
  - *The calls to veto:* **"keep Haunt dark"** (or Illuminate's light), **"ten points"** (finer buys, but the screen would need numbers), or **"no buy screen, hunger decides"**. Building waits until ~08:45 Wednesday your time.

## Work

- **Claimed** [Buy your spheres](https://linear.app/threadbare/issue/THR-1749/buy-your-spheres-point-buy-across-the-eight-creation-spheres-at) (marker `design-lane claim 2026-10-06b`). The shelf held four ready jobs, all waiting out veto windows, and no maps were open. This was the only unblocked piece of the Dominion ruling with a plan doc owed; [Dominion core](https://linear.app/threadbare/issue/THR-1748) is still blocked on [the shared prerequisites](https://linear.app/threadbare/issue/THR-1747).
- **Measured before writing** (the plan's *Measured substrate* table quotes file and line for each). Four measurements shaped the plan:
  - **Three hungers break rules that are already settled.** Two hand out an elder sphere at the start; one pairs two opposed spheres.
  - **The ticket's field name was taken.** `sphereAffinities` already means something else in five places. The plan uses `spherePoints`, your phrase.
  - **The income split ran over all twelve spheres**, as two private copies of the same numbers. The plan replaces both with one shared split.
  - **There is no save format**, so nothing needs migrating; old states fall back to the hunger's split.
- **Gates:**
  - Plan review, first pass: *Revise*. It found five gaps:
    - "power" on the buy screen clashes with the word for spells and bestowals;
    - the kill criteria lived outside the plan;
    - two player-complaint classes were not named;
    - the ruling was quoted as a paraphrase;
    - the veto wording was owed.
  - All five were fixed. Second pass: *Allow*.
  - Design principles, all three parts covered, and game vision: each passed with notes. Notes applied.
- **Plan doc PR:** [#2254](https://github.com/christianspliid-ui/threadbare/pull/2254) merged (`a176afa7`); the liveness check says LIVE. The ticket is in **Ready for Dev**, unassigned, with its handoff and coordination block. The description carries `Claimable from: 2026-10-07T06:47:00Z`, so the builder waits out the veto window. The plan is mutex with [the shared prerequisites](https://linear.app/threadbare/issue/THR-1747); that one lands first.
- **Branch slip, caught before the PR:** the first push used a branch named after the ticket id, which the plan-PR rule forbids. It was renamed id-free and the old remote branch deleted before any PR was opened.
- **Filed:** [Foundation-signed cards lose their only identity route](https://linear.app/threadbare/issue/THR-1753/foundation-signed-cards-lose-their-only-identity-route-once-spheres) (Deferral, blocked by the buy, three options laid out).
- **Noted on** [Dominion core](https://linear.app/threadbare/issue/THR-1748): the god's grown sphere score is never seeded at the start of a run, which that ticket's formula will need.

## Escalations

None.
