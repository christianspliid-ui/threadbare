---
lane: tb-design-lane
run: 2026-10-25d
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-25 (run d, ~11:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

No new decisions this run. One older design ticket was closed because its finish line is met. The decision itself is from 20 Oct and is unchanged:

- [No non-human cast primitive — a beast cannot be a bound scene actor](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor): a beast you can fight is a lair's monster, and any other animal (the bear in the granary, a wolf pack) stays scenery. The ticket is now closed. *Veto:* "animals should live in the world" (this reopens it).

## Work

- **What was open.**
  - The briefing has no *From Christian* section, so there were no vetoes to apply.
  - Ready for Dev holds 4 items that are not Deferrals, which is the floor. No plan doc was owed.
  - Every wayfinder map is Done, and no lane claims were waiting to resume.
  - The plan-doc candidates are still blocked or inside a veto day:
    - [Nothing can take up an unclaimed artifact](https://linear.app/threadbare/issue/THR-2031/nothing-can-take-up-an-unclaimed-artifact-a-seeded-relic-lies-at-its) waits on the relic decision, whose veto day ends 2026-10-26 02:25Z.
    - [Return archetype reads never match](https://linear.app/threadbare/issue/THR-2034/return-archetype-reads-never-match-the-usurper-bypass-and-the) is a build ticket, and it waits on the founding-gate build.
- **Closed under the design-request carve-out (THR-1888):** [No non-human cast primitive](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor).
  - Claimed with the marker `design-lane claim 2026-10-25d`.
  - The ticket's finish line was that the shape is "decided before code". That decision was recorded on 2026-10-20, and its veto day ended 2026-10-21 13:24Z with no veto.
  - Its one output, the authors' section in the encounters canon, merged in [PR #2504](https://github.com/christianspliid-ui/threadbare/pull/2504) and is [on main](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/encounters.md).
  - Closed with `save_issue(state:"Done")`. Linear confirmed Done at 11:21Z.
- **Correction to run c.** [Run c's report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-25c.md) skipped this ticket because it "needs a new node type". It does not: the 20 Oct decision rules a new node type out. The closing comment records the correction.

## Escalations

None.
