---
lane: tb-design-lane
run: 2026-10-27e
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-27 (run e, ~23:19Z → 01:30Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Plan doc: famine and glut draws](https://linear.app/threadbare/issue/THR-2040/plan-doc-famine-and-glut-draws-a-hungry-town-tells-hungers-stories-a) — **a hungry town now plants a hunger story instead of nudging the odds.** On a town's second hungry day, one person living there is handed a fitting scene: refugees, barter, the merchant's granaries, the exchange bell. When a town's granaries first overflow, someone gets a plenty scene: the harvest bounty, the market festival, the mill lease. It happens at most once per town every 10 days, and the granary riot still comes first. The first design, a small lean on the scene scores, shipped nothing because its own test failed. Even a much stronger lean barely moved anything this run. Planting moved it from about 1 in 5 hungry spells with a hunger story to 2 in 3. "Fairs grow rarer in a famine" is dropped, because a planted story adds a scene and cannot remove one. *Veto:* "famine should only make hunger stories likelier, not hand one out", or "a starving town should also hold fewer festivals".

## Work

- **Claimed** [famine and glut draws](https://linear.app/threadbare/issue/THR-2040/plan-doc-famine-and-glut-draws-a-hungry-town-tells-hungers-stories-a) for a re-plan, after the builder's census tripped the first plan's kill criterion (2026-10-26). The shelf was thin: 2 tickets ready, below the floor of 4.
- **Measured where the scenes are lost.** Six worlds × 360 ticks, on [the measurement branch](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2040-pool-presence) (never merged). In starving towns, a hunger scene is among a mortal's options 75 % of the time, on the top-5 shortlist 25 %, and picked 8 %.
- **Prototyped two fixes.** A score multiplier of up to ×1.75 on the shortlist and the pick moved the shortlist share from 5.0 % to 5.3 % (flat). Planting the scene, the riot's mechanism, raised hungry spells that get a hunger story from 22 % to 66 %, and glut spells that get a plenty story from 43 % to 74 %. Ordinary towns were unchanged.
- **Plan doc** [Hunger's stories are planted](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2040-hunger-stories-planted.md), with [its brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2040-hunger-stories-planted-brainstorm.md).
  - Intent judge: **Allow**. Its one gap (a sibling seeder, the scarcity arc) and its one advisory (the dropped festival half) are both fixed.
  - Design audits: NFP, three-pillar and Vision all **PASS with notes**.
  - Merged via [PR #2640](https://github.com/christianspliid-ui/threadbare/pull/2640). The liveness check reads LIVE.
- **Handed off** to Ready for Dev, unassigned, with its coordination block. `Claimable from: 2026-10-28T13:30:00Z` gives you the 12 h veto window.

## Escalations

None.
