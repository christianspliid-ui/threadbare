---
lane: tb-design-lane
run: 2026-10-03b
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-03 (run b, ~06:15Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Spells as divine gifts and found tomes](https://linear.app/threadbare/issue/THR-1672/spells-as-divine-gifts-and-found-tomes-acquisition-channels-1-and-4): **the god can teach a mortal a spell, and some old books teach whoever comes to hold them.** These are the last two of the five ways a mortal comes to know magic, all agreed with you on 25 August. The calls I made:
  - **A new card, Teach a Spell, beside Bestow Power.** Bestow Power stays as it is. The god teaches from its own spheres first, and falls back to the mortal's own school when it has nothing to give.
  - **Teaching dark magic costs the god.** It costs doom, and makes the god more likely to be noticed in that region. Every later casting of the spell adds a little more, and the mark it leaves names "a god's teaching". Teaching gentle magic costs only essence. *This is the call to veto if you want every gift priced, not just the dark ones.*
  - **A god never teaches elder magic.** Elder magic stays something mortals discover. An ancient book is now the first way a mortal outside the old orders can find it (your note that elder magic is found "through ruins, texts, and encounters").
  - **Which books teach:** the arcane and ancient ones already in the reward catalogue (the Veilscript Fragment, the Silent Testament, the Book of Sealing and three more), and the generated "book that should not be read". Treasure maps, chronicles and ledgers do not teach. A book teaches each new holder once.
  - **It is live from day one.** The world already hands out 11 to 16 of these books per world in 150 turns. It does not wait on, or depend on, the found-things-in-rewards plan that is still in its veto window.
  - **Knowing a spell does not make someone a caster.** That title stays earned the ways you ruled. A farmer who finds a forbidden book carries its spell and can use it, but cannot study for more.
  - **The card shows which spell it will teach before you play it.** The mortal only ever learns that they know it. *If you would rather the card keep the spell a surprise and name only its sphere, say so; it is a one-line change.*
  - **One new nudge card, A Word Left Behind**, in the Cache family. It teaches the mortal a spell of yours.

  Plan: [Spells as divine gifts and found tomes](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-03-thr-1672-spells-as-gifts-and-tomes.md). Say "veto spell gifts" to reverse it, or name the one call you disagree with. Not ready for you to look at until it is built. It also waits on the spell generator, which is built but not yet merged.

## Work

- **Chosen:**
  - The build shelf held 6 jobs that are not deferrals (the floor is 4), no map was open, and nothing was staged for design.
  - This was the agreed deferral whose stated prerequisite had landed: [the spell generator's plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-30-thr-1572-seeded-spell-generator.md), 30 September. Its decisions are three days old.
  - The other candidate, [threading as character creation](https://linear.app/threadbare/issue/THR-1644), was skipped: it waits on the round-2 cold playtest of the opening.
- **Measured before deciding** (current main, medium map, seeds 42 / 99 / 7, 150 turns):
  - Every one of the 104 to 123 spell-knowers in each world was seeded. Nobody learned a spell in play, and every knower has two free spell slots, so a taught spell is carried at once.
  - Generated books never occur yet: masterworks are 1 to 3 per world, and none of them is a book.
  - Authored arcane and ancient books are handed out 11 to 16 times per world, so they are where a teaching book lives today.
  - The god has a sphere pair on every seed.
  - Reader and data: [the census reader](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/readers/spell-gifts-tomes.ts) and [its output](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/spell-gifts-tomes-2026-10-03-thr1672.json).
- **Checks:**
  - The independent plan reviewer approved, with no gaps. Its one handoff note, marking the ticket as waiting on the spell generator, is done.
  - The three side reviews passed: rules (with notes), completeness, and vision (with notes). Their notes were fixed or recorded as calls you can veto; all of it is in the plan.
- **Plan PR:** [#2183](https://github.com/christianspliid-ui/threadbare/pull/2183).
- **Handed off:** [Spells as divine gifts and found tomes](https://linear.app/threadbare/issue/THR-1672/spells-as-divine-gifts-and-found-tomes-acquisition-channels-1-and-4) is in Ready for Dev with its build notes. It waits out the 24-hour veto window, which closes around 08:47 Sunday your time, and it waits for the spell generator to merge.

## Escalations

- None.
