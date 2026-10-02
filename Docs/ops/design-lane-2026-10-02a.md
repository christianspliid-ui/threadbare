---
lane: tb-design-lane
run: 2026-10-02a
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-02 (run a, ~18:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Item generator minting point 2: reward draws carry generated items](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at): **about half of the Storied and Mythic rewards a mortal earns become a thing found in this world.** That could be a dead hero's blade, salvage from a flood, or a trophy off a monster host. Today these rewards come from a few dozen authored items handed out again and again: one book went out ten times in a single test world. The calls made:
  - **The reward still fits the work.** A scholar's reward stays a thing of knowledge and a trader's a thing of gold. If the generator cannot make something that fits, the authored item is given instead.
  - **No one idea on repeat.** A swap happens only when at least two kinds of found thing fit the reward. Today only one kind fits scholars' rewards: *the book that should not be read*. Without this rule, about 19 of those per world would go to scholars.
  - **One new kind of found thing:** *the book someone argued with*, a working copy with a dead reader's quarrels in the margins. With it, scholars' rewards can be found things too. If it does not pass the item checks, it is dropped and scholars keep authored rewards.
  - **The number, so you can judge it:** about 50 found things per world in 150 turns, against 3 or 4 masterworks. That is roughly 40% of the Storied and Mythic rewards. The everyday rewards (about 240 per world) stay as they are. The share is the 50% you were offered on 26 September and did not veto; this is what it comes to.

  Plan: [Found things in the reward draw](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-02-thr-1626-found-items-in-reward-draws.md). If 50 per world is too many, give me a smaller share, for example a quarter. Not ready for you to look at until it is built.

## Work

- **Chosen:** the build shelf held 10 jobs (floor 4), and no map was open. The orchestrator had staged no design request. This was the oldest agreed deferral whose blocker had shipped ([the seeded item generator](https://linear.app/threadbare/issue/THR-1570), done 27 September). The ruling it carries is six days old.
- **Measured before deciding** (current main, medium, seeds 42 / 99 / 7, 150 turns):
  - 443 / 403 / 459 reward draws per world. Of those, 132 / 128 / 148 handed out an authored Storied or Mythic item.
  - Almost every one of those rewards is tied to a theme. A found thing made without regard to the theme matched it 0 to 19 times in 60. Scholars' rewards are the commonest at 115 of 408, and matched 1 to 5 times in 60. So the generator has to be asked for the theme.
  - Seven themes have only one kind of found thing that fits. 52% of these rewards have two or more, and about 80% will with the new book.
  - Making a found thing costs under half a millisecond, against a 182 ms turn.
  - Reader and data: [the census reader](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/readers/reward-minting.ts), [its output](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/reward-minting-2026-10-02-thr1626.json), and [which kinds fit which theme](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/reward-minting-cover-2026-10-02-thr1626.txt).
- **Reported, not chased:** an older reward path in the encounter loop draws on its own and was not changed. If the builder finds it still in use, it keeps authored rewards.
- **Checks:**
  - The independent plan reviewer approved. Its one catch (where a new record type is registered) was fixed.
  - The three side reviews (rules, completeness, vision) all passed with notes, and all three notes were folded into the plan.
- **Plan PR:** [#2170](https://github.com/christianspliid-ui/threadbare/pull/2170).
- **Plan merged** and confirmed live on main.
- **Handed off:** [Item generator minting point 2](https://linear.app/threadbare/issue/THR-1626/item-generator-minting-point-2-reward-draws-carry-generated-items-at) is in Ready for Dev with its build notes. It waits out the 24-hour veto window, which closes around 20:45 tomorrow your time.

## Escalations

- None.
