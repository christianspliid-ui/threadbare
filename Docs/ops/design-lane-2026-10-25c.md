---
lane: tb-design-lane
run: 2026-10-25c
promoted: 0
filed: 0
resolved: 2
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-25 (run c, ~08:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

No new decisions this run. Two older design tickets were closed because their own finish lines are met. Each is in the Work section below.

## Work

- **What was open.**
  - The briefing has no *From Christian* section, so there were no vetoes to apply.
  - Ready for Dev holds 7 items that are not Deferrals. The floor is 4, so no plan doc was owed.
  - Every wayfinder map is Done, and no lane claims were waiting to resume.
  - The plan-doc candidates are still blocked or inside a veto day:
    - [Nothing can take up an unclaimed artifact](https://linear.app/threadbare/issue/THR-2031/nothing-can-take-up-an-unclaimed-artifact-a-seeded-relic-lies-at-its) waits on the relic decision, whose veto day ends 2026-10-26 02:25Z.
    - [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954) waits on [the debts plan](https://linear.app/threadbare/issue/THR-2023), whose veto day ends tonight at about 19:45Z.
    - [Return archetype reads never match](https://linear.app/threadbare/issue/THR-2034/return-archetype-reads-never-match-the-usurper-bypass-and-the) waits on the founding-gate build.
    - [No non-human cast primitive](https://linear.app/threadbare/issue/THR-1274) needs a new node type, which stops for you.
- **Closed under the design-request carve-out (THR-1888).** I claimed each ticket with the marker (`design-lane claim 2026-10-25c`). Each got a closing comment that quotes its Done-when and links every output. Then `save_issue(state:"Done")`, and Linear confirmed Done on both.
  - [A five-card hand on the Stage still makes the encounter column scroll](https://linear.app/threadbare/issue/THR-1994/a-five-card-hand-on-the-stage-at-19201080-still-makes-the-encounter). Its Done-when accepts "the ticket records the decision to keep the scroll at the cap".
    - That decision was recorded on 2026-10-24, and its veto day ended at 07:24Z today.
    - The hint it called for shipped in [the hand bar that names the cards below it](https://linear.app/threadbare/issue/THR-1942/a-hand-of-five-to-eight-cards-hides-cards-under-the-hand-bar-the-bar) ([PR #2568](https://github.com/christianspliid-ui/threadbare/pull/2568)).
    - The ticket had been left in Todo "for a one-click close", which THR-1888 now says the lane must not do.
  - [Mislabel audit: 110 encounters whose prose tests a different Reach](https://linear.app/threadbare/issue/THR-1940/mislabel-audit-110-encounters-whose-prose-tests-a-different-reach-than). Its Done-when is "a recorded worklist, and the relabels ship".
    - The [worklist](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-21-thr-1940-reach-mislabel-worklist.md) is on main.
    - [The relabels](https://linear.app/threadbare/issue/THR-2010/reach-relabels-from-the-mislabel-audit-32-encounters-change-reach-6) were Done on 2026-10-23.

## Escalations

- **Warm round 3's gate is still circular.** Nothing has changed since run 2026-10-24d. [The mortal's mid-game is behind a button](https://linear.app/threadbare/issue/THR-1859) and [outcome words that mislead](https://linear.app/threadbare/issue/THR-1860) each wait on round 3, and round 3 waits on them. The cold-playtest lane owns that gate.
