# Briefing
**Generated:** 2026-09-23 10:40 local (08:40 UTC) · keep-work-flowing-cc

## The one thing

**One design hour: [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its). Are scenes being offered to exactly the people who will refuse them?**

The builder has **nothing left to build**. Its credit came back this morning. At 08:11 it finished [artifact traits](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits), and that work merged at 08:37 via [#1985](https://github.com/christianspliid-ui/threadbare/pull/1985). Nothing is waiting behind it. The planning lane is not allowed to stage anything new while THR-1525 sits on the design desk. So this is the one decision that gets work moving again.

The fork: the game offers a scene to mortals who lean one way on the scene's value. When the scene's choice then splits on that same value, the arm that matters is usually the other one. Either the draw was always meant to reach both kinds of mortal, and the code has drifted from its own docs. Or the lean is the design, and the house guide has to stop telling authors to build forks on the same value. Open a chat and say you want to work THR-1525. The full question is in [user-actions](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (5)

- **May the planning lane draft design docs itself?** The reason given for the rule against it has expired. A yes would let it draft [THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded), [THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the) and [THR-1528](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location). *— from tb-orchestrator*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs nobody had built. All five are restored. *— from tb-orchestrator*
- **Finish the sitting** for [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with). Two encounters are left, and nothing is broken on screen.
- **Were the weekday stops deliberate?** The lanes went quiet on 17 and 18 September with no pause marker.
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Starved: nothing ready to build, nothing in progress.** Ready for Dev and In Dev are both empty. [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) closed as Done at 08:38. There are no parked jobs. The only live design item is [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its), about 28 hours on the desk. It is the ask above. Daily backlog grooming notes that [THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded) does not need you: a design session can pick an option and invite your veto.

## Health

- **The builder's credit is back.** Its 08:11 run succeeded and shipped artifact traits. The credit ask is resolved.
- **Heavy simulation tests: a slow runner, not broken code.** The probe calls it "failing on main for 27 hours" and flags it for you. I checked the logs. Each red run is one test running a few tenths of a second past the 5-second limit, and it is a different test each time: an army test on 22 September, a harvest test today. The 22 September commit went green when the same test ran again with no change. A fresh run on today's commit is in progress. This is a session's job, not your call. The fix is a more generous time limit on those world-building tests.
- **The machine was quiet from about 08:40 to 10:37 local.** The heartbeat probe says the orchestrator is "2+ hourly slots behind, while tb-opus-pickup kept firing". That is misleading. The builder and this lane only fired when the machine came back at 10:37, and they missed the same slots. The orchestrator's next run is at 11:28.
- **Lane silence:** the worst recent gap (25 hours, Saturday into Sunday) falls on a weekend and is declined under your 11 September ruling.
- Everything else is green. The live site is serving today's merge (f50759a4). CI is healthy and no pull requests are waiting. Engine speed is 65 ms/tick, 8% below the 7-day median of 71.
