---
lane: tb-design-lane
run: 2026-09-29a
promoted: 1
filed: 4
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-29 (run a, ~00:18Z)

## Needs Christian

Nothing needs you. No vetoes were waiting in the briefing.

## Decided for you

- [The power runtime: spells carried and cast](https://linear.app/threadbare/issue/THR-1571): **the plan is written, and step one is ready to build.**
  - **Today:** no mortal in the world holds a spell, and a spell that is cast charges its price but does nothing else.
  - **After step one:** every priest, healer, scholar and other caster starts the world with one spell of their tradition. A spell that is cast does what it says, and it costs what it should.
  - **Step two:** a caster reaches for a spell in the middle of a scene, and you see it on the step.

  Plan: [the power runtime](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-29-thr-1571-power-runtime.md). Calls made:
  - **The same roll decides the step and the spell.** There is no second die, and your cards on the step bend the spell with it. A spell that lands on a good result does what it says. On a near miss or worse it fizzles, and the price is still paid.
  - **The mortal decides to cast, not you.** A caster reaches for their spell only when a step looks worse than they would normally take on: below 45% for most, up to 55% for the bold, down to 35% for the careful. The step then shows "casting *Hollow Crown*" among its odds. Your cards cannot urge or stop the cast itself, only bend the roll. If you want a card that urges a mortal to cast, that can be added later.
  - **Out in the world, a mortal casts through the job they already take on to use a power.** No second way to decide the same thing.
  - **A spell's price bites when its kind says it should.**
    - A *strain* spell leaves the caster's Reach thin for a couple of days ("Strained"), never a permanent loss.
    - A *gamble* can bite even on success, but never on a critical success.
    - A *transgression* bites only on disaster.
  - **Every caster starts with one spell.** That is 104 mortals on a medium world. If that reads as too much magic, it can be narrowed by caster type in one setting.
  - **A spell that works on its own while carried may only do simple, always-on things for now.** Spells are shared records, so a charge or a counter would be shared by everyone who carries the spell.
  - **Lifting a curse lifts it from one person.** The broken version would have cured the whole world and deleted the curse from the game. A dispelled item is silenced for a while, never taken from its owner.
  - **Monsters are born with one power of their kind** (step three): a beast's thick hide, a wraith that is half there, and so on, one for each of the eight monster families.
  - **You are not asked to try any of this yet.** Powers is not finished until the spell generator fills the shelf. Step two's closeout will carry two links, for information.

Say "veto the power runtime" to reverse this.

## Work

- **Claimed** [the power runtime](https://linear.app/threadbare/issue/THR-1571), the first plan in the [Powers & Spellcraft map](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)'s carve-up ("build the runtime first"). Why this ticket:
  - no map is open;
  - five jobs are ready to build;
  - every living-world plan is already handed off;
  - every input decision is at least five days old.
- **Measured on today's `main`** (seed 42, medium, headless):
  - **Nobody holds a spell.** There are 0 spell holders at tick 30.
  - **Casters exist but cannot learn.** There are 104 casters, but only one of them is in the tier that can choose to learn a spell.
  - **The nine powers mortals do hold cannot be cast.**
- **Found while designing, all fixed in step one:**
  - The caster check can never match the real "spell-weaver" trait, because of a hyphen.
  - Every caster shared one cooldown per spell.
  - The world-map cast rolled a coin keyed on the *length* of the caster's name.
  - The "always-on" spell field was declared but read by nothing.
- **Gates:**
  - The intent judge asked for revisions on its first pass. It found that the seeding rollback would have switched seeding off, and that the cast threshold sat inside the odds mortals already accept. Both were fixed, and it **allowed** the plan on the second pass.
  - The rules, completeness and Vision audits all passed with notes, and each note is fixed or answered in the plan.
- **Merged** via [PR #2135](https://github.com/christianspliid-ui/threadbare/pull/2135). The plan is live on `main`, and step one is Ready for Dev with its coordination block.
- **Filed:**
  - [a caster casts in the scene](https://linear.app/threadbare/issue/THR-1670) (step two);
  - [monsters' innate powers](https://linear.app/threadbare/issue/THR-1671) (step three);
  - [spells as divine gifts and found tomes](https://linear.app/threadbare/issue/THR-1672) (deferral);
  - [the glossary word "Strained"](https://linear.app/threadbare/issue/THR-1673).

  Each is Todo with its coordination block. Steps two and three are blocked on step one.

## Escalations

None.
