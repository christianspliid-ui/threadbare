---
lane: tb-design-lane
run: 2026-10-16a
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-16 (run a, ~01:50Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The hunger and unrest plan](https://linear.app/threadbare/issue/THR-1934/plan-doc-hunger-and-unrest-a-hungry-town-boils-over-through-restless) — **a town's anger now follows what it lives through.** Hunger, an army at the walls, sickness, want and grief push it up a little each day; a fed, content town calms down. A town that has had enough first loses people to a calmer town nearby, then its streets turn lawless and pay its lord half the tax, then it turns to a better lord, and at last it rises. ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-16-thr-1934-hunger-and-unrest.md), [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-16-thr-1934-hunger-and-unrest-brainstorm.md)) *Veto:* **"ship all four bands at once"**.
- Same plan — **a town picks its new lord the way its people would:** who can protect it, who keeps a hall in its streets, whose army burned its fields, and whether the lord's own towns are fed and his purse is not empty. It turns only to a clearly better lord, and not twice within 20 days. *Veto:* **"towns should never change hands without a war"**.
- Same plan — **losing a town makes the old lord an enemy of the new one, and he wants it back.** The war-aims plan's armies then march on it first. *Veto:* **"losing a town should not start a war"**.
- Same plan — **a town that rises is led by the lord's own people who live there**; if none live there, its most important resident founds a free town. No new kind of rebel faction. *Veto:* **"a rising should be its own kind of faction"**.
- Same plan — **a town that has just turned or risen calms a little** for a while, so it does not flip again the next day. *Veto:* **"a new lord should not calm a town"**.
- Same plan — **the world stops for a town on the edge or a rising only when one of your threaded mortals lives there or you keep a shrine there**; everywhere else it is a chronicle line. *Veto:* **"every town about to turn should ask me first"**.
- Same plan — **people actually leave only once the settlement economy counts people.** Until then, only one resident at a time leans toward moving away. *Veto:* **"Restless towns should lose people now"**.

## Work

- **Claimed** [the hunger and unrest plan](https://linear.app/threadbare/issue/THR-1934/plan-doc-hunger-and-unrest-a-hungry-town-boils-over-through-restless) (claim `2026-10-16a`). The briefing held no vetoes and you sent no new messages. No wayfinder maps are open and the shelf is full, so the lane took the next plan in your kingdom order: purse, crown, war aims, then **hunger and unrest**. Its own wait ended at 22:29Z yesterday.
- **Measured** every code claim on main first:
  - Unrest drains 12 points a day, so no town stays angry.
  - The promised turning at 70 and sack at 90 are never acted on.
  - No settlement has a population number, and nothing moves people between towns.
  - A faction split cannot choose members by where they live.
  - The granary riot has no famine trigger; the famine story seeds an unrelated guard quest instead.
  - The faction purse's town tax ignores unrest.
- **Gates:**
  - The intent judge returned **Revise** once. Fixes: quote the prosperity tooltip and the Restless chip words; add a row for the Threads prosperity word; say how the tax reads the Lawless trait; name the missing constants. The second pass was **Allow**, and its one note is folded in: the old [pressure-driven migration](https://linear.app/threadbare/issue/THR-729/pressure-driven-migration-mortals-leave-a-busted-province-flock-to-a) idea is absorbed and is closed when part 1 ships.
  - The NFP, pillar and Vision audits passed with notes, and all notes are folded in.
  - Plan-doc lint, generated freshness and impediment ids are green.
- **PR** [#2437](https://github.com/christianspliid-ui/threadbare/pull/2437), auto-merge armed.
- **Handed off** to Ready for Dev with `Claimable from: 2026-10-16T18:47:00Z`. The plan reads the crown plan's choices, which are still inside their veto day. Two bugs ship first: [one death keeps a town in unrest forever](https://linear.app/threadbare/issue/THR-1925/death-site-unrest-never-stops-one-death-pins-a-town-at-99-unrest-for) and [scarcity arcs jam](https://linear.app/threadbare/issue/THR-1919/scarcity-arcs-jam-three-towns-hold-all-three-arc-slots-at-flashpoint).
- **Filed** [Hunger and unrest, part 2: a town turns or rises](https://linear.app/threadbare/issue/THR-1957/hunger-and-unrest-s2-a-town-on-the-edge-turns-to-a-better-lord-and-a) (Todo; blocked by part 1 and the crown build).

## Escalations

None.
