---
lane: tb-design-lane
run: 2026-09-26b
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-26 (run b, ~06:20Z)

## Needs Christian

Nothing new needs you. [Faith and politics at game start](https://linear.app/threadbare/issue/THR-1596) and [A world with a past](https://linear.app/threadbare/issue/THR-1591) are still waiting for you on [the living-world map](https://linear.app/threadbare/issue/THR-1589). Nothing changed on either this run.

## Decided for you

All five decisions sit in one plan: [the seeded item generator](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md), for [Design: the seeded item generator](https://linear.app/threadbare/issue/THR-1570/design-the-seeded-item-generator-plan-doc-from-the-item-generator-map). They sit inside what you already ruled on the [thirty generated items](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-24-thirty-generated-items.md): items grow around authored ideas, Storied and up only, and an item never promises what the game does not do.

- **Masterworks come first.** Today a mortal who finishes a masterwork makes an object that does nothing. From now on it is born with an idea, such as a blade that wants blood, a ring that bargains, or a book that should not be read. It carries a real power and often a real price, and its maker, their people and their place shape it.
- **How the work went decides how remarkable the thing is.** A brilliant final day at the work makes a *Mythic* thing. Any other finish makes a *Storied* one. A workshop never makes a *Legendary*.
- **"Storied" now means one thing: *has a history*.** The rarity word is the promise, and the item trait (*has seen a thing or two… much… it all*) is where that history lives. So every generated item of Storied rank or higher is born carrying the trait.
- **Half of all Storied and Mythic loot will be generated, once loot draws use the generator.** Ordinary gear and Legendaries stay hand-written. The number only takes effect with that later step, [filed here](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at).
- **Art:** a generated item uses the picture for its kind of thing (arms, a relic, a tool). Every masterwork shows the tools picture today, so this is an improvement even before any new art exists.

Veto any of these in one line, e.g. "veto masterwork band".

## Work

- **Claimed** [Design: the seeded item generator](https://linear.app/threadbare/issue/THR-1570/design-the-seeded-item-generator-plan-doc-from-the-item-generator-map). It is the one plan doc the closed Item Generator map named.
  - The shelf had 16 ready jobs, so this was agreed-but-undesigned work, not a starvation pick.
  - No decision it builds on was made by this lane within the last day.
- **Plan merged:** [#2065](https://github.com/christianspliid-ui/threadbare/pull/2065).
  - Three things it found in the code:
    1. Every masterwork is handed out today as ordinary loot. A stranger can receive a copy of someone else's masterwork. The plan closes this.
    2. The game renames every finished work after it is made. That would have erased every generated name. The intent judge caught it on the first pass, and the plan now keeps the generated name on both paths that make masterworks.
    3. Three kinds of effect that the prototype held back have shipped since. The builder re-measures which effects are live before trusting the prototype's list.
- **Preserved the prototype in git.** The 1,700-line prototype generator existed only in the design vault, which has no history. It is now on a never-merged branch, [`proto/thr-1570-item-generator`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1570-item-generator/Docs/audits/2026-09-24-proto-items), for the builder to port from.
- **Filed** [Item generator minting point 2: loot draws carry generated items](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at).
  - It is a Deferral in Todo, blocked by the generator, and carries its coordination block.
- **Gates:**
  - Intent judge: **Revise**, then **Allow** once the naming fix was in.
  - Design audits: cost and safety rules pass-with-notes; all three parts of the feature (engine, content, screen) pass-with-notes, and its one gap was fixed; Vision **pass**.
- **Handed off:** [Design: the seeded item generator](https://linear.app/threadbare/issue/THR-1570/design-the-seeded-item-generator-plan-doc-from-the-item-generator-map) is in Ready for Dev, unassigned, with the coordination block.

## Escalations

None.
