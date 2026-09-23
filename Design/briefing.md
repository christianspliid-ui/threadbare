# Briefing
**Generated:** 2026-09-23 12:55 local (10:55 UTC) · keep-work-flowing-cc

## The one thing

**One design hour: [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its). Are scenes being offered to exactly the people who will refuse them?**

The builder has **no game work left**. It is now on its last job, a housekeeping fix to its own crash recovery ([THR-1529](https://linear.app/threadbare/issue/THR-1529/a-pickup-run-killed-mid-slice-leaves-its-work-invisible-no-wip-push)). After that its shelf is empty. The planning lane may not stage anything new while THR-1525 sits on the design desk, so this is still the one decision that gets game work moving again.

The fork: the game offers a scene to mortals who lean one way on the scene's value. When the scene's choice then splits on that same value, the arm that matters is usually the other one. Either the draw was always meant to reach both kinds of mortal, and the code has drifted from its own docs. Or the lean is the design, and the house guide has to stop telling authors to build forks on the same value. Open a chat and say you want to work THR-1525. The full question is in [user-actions](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (5)

- **May the planning lane draft design docs itself?** The reason given for the rule against it has expired. A yes would let it draft [THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded), [THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the) and [THR-1528](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location). *— from tb-orchestrator*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs nobody had built. All five are restored. *— from tb-orchestrator*
- **Finish the sitting** for [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with). Two encounters are left, and nothing is broken on screen.
- **Were you away from the app on Monday 14 and Tuesday 15 September?** The 17 and 18 September stops are explained: the computer was asleep. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Starved: nothing ready, one job in progress, no parked jobs.** The builder claimed [THR-1529](https://linear.app/threadbare/issue/THR-1529/a-pickup-run-killed-mid-slice-leaves-its-work-invisible-no-wip-push) this hour. It is a process fix that clears the materiality bar: one builder run died 26 minutes into a job. After it lands, the shelf is empty. The only live design item is [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its), about 30 hours on the desk; it is the ask above.

## Health

- **THR-1529's pull request is blocked on a failing docs check.** [PR #1987](https://github.com/christianspliid-ui/threadbare/pull/1987) failed its [Docs gates run](https://github.com/christianspliid-ui/threadbare/actions/runs/35847857034/job/107138340091). It will not merge until a session pushes a fix. It is 38 minutes old, so the builder may still be on it. This is the builder's job, not yours.
- **Heavy simulation tests are green on today's commit.** The [08:34 UTC run](https://github.com/christianspliid-ui/threadbare/actions/runs/35837874948) passed on the same code that failed at 06:37, so the red was a slow runner, not broken code. The probe still reports "failing on main for 29 hours" because it counts the earlier red run. This is a technical call, not yours. The lasting fix is a session's job: a longer time limit on those world-building tests.
- **Lane silence:** the worst recent gap (25 hours, Saturday into Sunday) falls on a weekend. It is declined under your 11 September ruling.
- **Worktree reaper:** 5 worktrees await a decision on what to do with them (the 12:40 run). This is routine and is the reaper's call.
- Everything else is green. The live site is serving the latest game code (f50759a4). Later commits touched only docs. CI is healthy, and all nine scheduled lanes are on time. Engine speed is 75 ms/tick, 6% above the 7-day median of 70, which is within normal range.
