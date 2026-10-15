---
lane: tb-design-lane
run: 2026-10-15f
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-15 (run f, ~22:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The war aims plan](https://linear.app/threadbare/issue/THR-1933/plan-doc-economic-war-aims-armies-march-on-enemies-for-their-richest) — **armies that are not enemies no longer fight when they meet, and an army never besieges a town it simply passes through.** Today any two armies of different factions fight on sight, and an army besieges any foreign town it stands in. The plan uses one rule for "enemy" everywhere: who an army marches on, who it fights, and what it besieges. ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-15-thr-1933-war-aims.md), [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-15-thr-1933-war-aims-brainstorm.md)) *Veto:* **"armies of different factions should still fight when they meet"**.
- Same plan — **an army defends by holding the threatened town, not by chasing the enemy army.** It marches to the town and fights from behind its walls. *Veto:* **"armies should ride out to meet the enemy"**.
- Same plan — **armies rethink their target once a day**, so they can turn back to defend. An army mid-march keeps a target that is still good. *Veto:* **"an army should keep the target it was raised for"**.
- Same plan — **an army only marches on a town it could keep fed once it gets there.** Its supply line must reach the town, and the town must be at most about 16 hexes away. *Veto:* **"armies should march anywhere they can walk"**.
- Same plan — **it ships in two parts.** First, wars about something, with defence. Second, regional monopolies, their extra income and embargoes ([part 2](https://linear.app/threadbare/issue/THR-1955/war-aims-s2-regional-monopolies-pay-rent-and-can-embargo-an-enemys)). An embargo cuts only the embargoed good, such as salt: people and armies still use the road, so the map says "no salt moves on it", not "nothing moves". *Veto:* **"ship monopolies with the armies"** or **"an embargo should close the road completely"**.

## Work

- **Claimed** [the war aims plan](https://linear.app/threadbare/issue/THR-1933/plan-doc-economic-war-aims-armies-march-on-enemies-for-their-richest) (claim `2026-10-15f`). There were no vetoes in the briefing and no open maps, and the shelf is full. This is the third plan in your kingdom order (purse, crown, war aims). The claim waited until its own hold ended at 22:29Z.
- **Measured** every code claim on main first:
  - An army chooses its target once, when it is raised, and never again.
  - Nothing ever tells an army to defend.
  - A declared war is invisible to the shared hostility check.
  - Monopolies never form under today's world-wide rule, and nothing reads them.
  - Trade roads do not carry goods into a town's stores yet, so the embargo works as a direct cut to the embargoed town's stock until goods flow arrives.
- **Gates:**
  - The intent judge returned Revise twice, then **Allow**. Its fixes: how often each line shows, a fallback when the enemy army is gone, keeping an embargo in one place instead of marked on towns and roads, monopoly chronicle lines that no longer claim total control, and the place page's own "the stores are low" wording. Its three last advisory notes are folded in.
  - The NFP and Vision audits passed with notes, and the notes are folded in. The pillar audit passed.
  - Plan-doc lint, generated freshness and impediment ids are green.
- **Merged** via [PR #2433](https://github.com/christianspliid-ui/threadbare/pull/2433). The plan is live on main.
- **Handed off** to Ready for Dev with `Claimable from: 2026-10-16T18:47:00Z`. The plan builds on this evening's crown plan, which is still inside its veto day. It is also blocked by the [faction purse](https://linear.app/threadbare/issue/THR-1931) build. Two bugs ship first: [armies besiege towns they have no quarrel with](https://linear.app/threadbare/issue/THR-1922) and [seizing a lane tolls the wrong lane](https://linear.app/threadbare/issue/THR-1883).
- **Filed** [War aims part 2: regional monopolies and embargo](https://linear.app/threadbare/issue/THR-1955/war-aims-s2-regional-monopolies-pay-rent-and-can-embargo-an-enemys) (Todo, blocked by part 1 and the purse).

## Escalations

None.
