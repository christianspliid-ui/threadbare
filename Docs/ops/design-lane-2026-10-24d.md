---
lane: tb-design-lane
run: 2026-10-24d
promoted: 0
filed: 0
resolved: 2
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-24 (run d, ~22:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

No new design calls this run. This run closed two tickets whose decisions you already saw on 2026-10-20 and 2026-10-21, and neither was vetoed:

- [Warm brief v2 trigger fired](https://linear.app/threadbare/issue/THR-1861/warm-brief-v2-trigger-fired-round-2-had-3-coverage-failures-on-v1-03): closed. Warm round 3 uses the v2 brief. Its change merged in [PR #2493](https://github.com/christianspliid-ui/threadbare/pull/2493).
- [Founding costs starve founding on their own](https://linear.app/threadbare/issue/THR-2006/founding-costs-starve-founding-on-their-own-with-costs-on-seeds-427): closed. The faction-patron fix it led to has shipped ([A faction pays for a member's founding they cannot afford](https://linear.app/threadbare/issue/THR-2008/a-faction-pays-for-a-members-founding-they-cannot-afford-the-founding)).

## Work

- **What was open.** Briefing *From Christian*: no section, so there were no vetoes to apply. Ready for Dev holds 8 items that are not Deferrals. That is above the floor of 4, so no plan doc was owed. Every wayfinder map is Done, so there is no frontier ticket to decide. No lane claims were waiting to resume. [Traits wave 3](https://linear.app/threadbare/issue/THR-791) is assigned but carries no lane marker, so it was skipped.
- **Plan-doc candidates in Todo:** none are workable now.
  - [Undertakings in the economy S2](https://linear.app/threadbare/issue/THR-1966) already has its plan. It is build work, and it is blocked.
  - [The Crossroads on screen](https://linear.app/threadbare/issue/THR-1928) is the same: planned, and blocked.
  - [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954) draws on [the debts plan](https://linear.app/threadbare/issue/THR-2023)'s decisions, which are still inside their veto day.
  - [No non-human cast primitive](https://linear.app/threadbare/issue/THR-1274) needs a new node type, and CLAUDE.md says a new node type stops for the human.
- **Closed under the design-request carve-out (THR-1888).** Both tickets got a claim marker and a closing comment that quotes the Done-when and links every output. Then `save_issue(state:"Done")`, which Linear confirmed as Done:
  - [THR-1861](https://linear.app/threadbare/issue/THR-1861/warm-brief-v2-trigger-fired-round-2-had-3-coverage-failures-on-v1-03): decision recorded, and [PR #2493](https://github.com/christianspliid-ui/threadbare/pull/2493) merged 2026-10-20T01:50Z, before warm round 3.
  - [THR-2006](https://linear.app/threadbare/issue/THR-2006/founding-costs-starve-founding-on-their-own-with-costs-on-seeds-427): decision recorded, the audit [PR #2519](https://github.com/christianspliid-ui/threadbare/pull/2519) merged, and build ticket [THR-2008](https://linear.app/threadbare/issue/THR-2008/a-faction-pays-for-a-members-founding-they-cannot-afford-the-founding) is Done.

## Escalations

- **Warm round 3's gate is still stuck in a loop.** The gate needs every ticket in *Warm playtest · round 2* Done or Canceled. With THR-1861 closed, two remain: [the mortal's mid-game is behind a button](https://linear.app/threadbare/issue/THR-1859) and [outcome words that mislead](https://linear.app/threadbare/issue/THR-1860). Both say they stay open until round 3 confirms their fix, so each side waits on the other. The design lane first raised this on 2026-10-20. Recommended fix: the gate should ignore tickets whose only open condition is a "Fixed when" that round 3 itself checks. The cold-playtest lane owns that gate; this lane does not change it.
