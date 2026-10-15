---
lane: tb-design-lane
run: 2026-10-15c
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-15 (run c, ~10:18Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The faction purse plan](https://linear.app/threadbare/issue/THR-1931/plan-doc-the-faction-purse-the-land-fills-it-war-empties-it-and-a) — **every faction opens the game with a little coin and enough pay for its soldiers for about three weeks, so no army walks away on day one.** After that, a faction whose land cannot pay its soldiers watches them leave. ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-15-thr-1931-faction-purse.md), [why each choice](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-15-thr-1931-faction-purse-brainstorm.md)) *Veto:* **"factions should start with nothing"** or **"start them rich"**.
- Same plan — **a faction that cannot pay never goes into debt.** It pays what it can, and the soldiers it cannot pay start to slip away. *Veto:* **"let factions run up debts"**.
- Same plan — **the two free companies get paid like everyone else, so they break up once their opening coin runs out.** Nobody can hire them yet; that question is filed as [mercenary hire](https://linear.app/threadbare/issue/THR-1939/mercenary-hire-who-pays-a-free-company-once-factions-have-purses). *Veto:* **"keep the mercenaries in the field until hiring exists"**.
- Same plan — **a faction's wealth uses the same five words as a mortal's** (Destitute, Getting by, Comfortable, Wealthy, Magnate), measured in how long it could pay its soldiers. The decision's working words (Bankrupt, Solvent and so on) never reach the screen. *Veto:* **"factions should have their own money words"**.

## Work

- **Claimed** [the faction purse plan](https://linear.app/threadbare/issue/THR-1931/plan-doc-the-faction-purse-the-land-fills-it-war-empties-it-and-a) (claim `2026-10-15c`). It is first in the map's order. Your 08:29 release on [the Mortal economy map](https://linear.app/threadbare/issue/THR-1863/wayfinder-map-mortal-economy-making-wealth-and-want-drive-what-agents) (*"The plan docs can go ahead"*) cleared it to start before its own 22:29 hold.
- **Authored** the plan and its brainstorm companion. Every claim about the code was checked against main first. The main finding: today nothing ever pays a faction, raising an army costs nothing, and soldiers' pay is never taken.
- **Gates:**
  - The intent judge returned Revise twice, then Allow. The fixes: one shared word ladder for wealth, chronicle lines that never claim debt, kill criteria, and the glossary edit.
  - The NFP, three-pillar and vision audits all passed with notes, and every note is folded in.
  - The plan-doc lint and generated-freshness checks are green.
- **Merged** in [PR #2422](https://github.com/christianspliid-ui/threadbare/pull/2422). The plan is live on main.
- **Handed off** to Ready for Dev with a coordination block. The issue carries `Claimable from: 2026-10-15T22:29:00Z`, so nothing is built on the Purse panel before your veto window on [what the player sees of the economy](https://linear.app/threadbare/issue/THR-1870/what-the-player-sees-of-the-economy-prosperity-unrest-tolls-and) closes.
- **Filed** [mercenary hire](https://linear.app/threadbare/issue/THR-1939/mercenary-hire-who-pays-a-free-company-once-factions-have-purses) (Todo, Deferral, low priority) for the one gap the purse decision left open.

## Escalations

None.
