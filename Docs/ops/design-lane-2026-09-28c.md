---
lane: tb-design-lane
run: 2026-09-28c
promoted: 1
filed: 3
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-28 (run c, ~12:20Z)

## Needs Christian

Nothing needs you. No vetoes were waiting in the briefing.

## Decided for you

- [Seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636): **the plan is written, and step one (trade lanes) is ready to build.** Two things the world seeds are dead on arrival today:
  - **Trade lanes:** every lane in the world vanishes on the same day (tick 36), because nothing trades on it.
  - **Ruins:** no mortal can ever delve one, because nobody can learn where a ruin lies.

  Plan: [seeded things that stay alive](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md). Five calls were made, each open to veto:
  - **A lane lives while both of its towns stand and nothing blocks it.** It does not depend on cargo. Most seeded lanes carry nothing at the start, so a cargo rule would kill them on day one. Cargo only makes a lane busier (a wider gold line on the map).
  - **No caravans walk the map.** Traffic is part of the lane itself, the way ambushes and tolls already work.
  - **A blockade halts a lane but does not destroy it.** The lane comes back when the blockade lifts. Killing a lane takes razing a town at one end or cursing its roads. The map's tooltip says "blockaded" or "fading".
  - **Finding a ruin works like a hunt.** A mortal hears a rumour, surveys the ruin from afar, then travels to it. That visit is an ordinary encounter, and its dice decide whether they learn where the ruin lies (and can delve it) or the lead goes cold. The god can nudge those dice like any other.
  - **Rumours lean toward mortals who can act on them.** Today nearly nine in ten rumours land on townsfolk who never do anything with them.

Say "veto seeded things" to reverse this.

## Work

- **Claimed** [seeded things that stay alive](https://linear.app/threadbare/issue/THR-1636), the last plan left from the [living-world map](https://linear.app/threadbare/issue/THR-1589). Seven jobs were already ready to build and no map had open decisions, so this run wrote a plan. Its inputs were decided on 2026-09-25, and none was a lane decision younger than a day.
- **Measured on today's `main`** with two test worlds (seeds 42 and 99, 300 ticks, about 25 days of game time):
  - All 12 seeded lanes still die on tick 36.
  - 72 rumours about ruins; every one stayed vague, and 65 went to mortals who never act.
  - No mortal ever surveyed a ruin, and no ruin was delved.
  - One surprise explains the ruins: a survey always counts as an ordinary success, and only an exceptional one used to reveal where a ruin lies. So no survey could ever do it.
- **Gates:** the intent judge **allowed** the plan. It re-checked every code reference and reproduced every number. Its one gap was that "lead" and "delve" are not in the game's word list, filed as [lead and delve for the word list](https://linear.app/threadbare/issue/THR-1662). The rules and completeness audits passed with notes, and the Vision audit passed.
- **Merged** via [PR #2121](https://github.com/christianspliid-ui/threadbare/pull/2121). The plan is live on `main`.
- **Handed off** step one (trade lanes) to Ready for Dev with its coordination block. It can be built alongside the notables and past work.
- **Filed** the other two steps, each with its coordination block:
  - [a lead is a reason to look](https://linear.app/threadbare/issue/THR-1663) (step two): rumours reach mortals who can act, and a held rumour draws its holder to survey the ruin. Moved to Ready for Dev once the plan was live.
  - [the visit to the ruin](https://linear.app/threadbare/issue/THR-1664) (step three): waits on step two.

## Escalations

None.
