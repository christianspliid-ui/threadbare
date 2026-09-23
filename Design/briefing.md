# Briefing
**Generated:** 2026-09-23 13:55 local (11:55 UTC) · keep-work-flowing-cc

## The one thing

**One design hour: [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its). Are scenes being offered to exactly the people who will refuse them?**

The builder has **no game work left**. Its last job is a housekeeping fix to its own crash recovery ([THR-1529](https://linear.app/threadbare/issue/THR-1529/a-pickup-run-killed-mid-slice-leaves-its-work-invisible-no-wip-push)), and that job is waiting on a docs-check repair. After it lands, the shelf is empty. The planning lane may not stage anything new while THR-1525 sits on the design desk, so this is still the one decision that gets game work moving again.

The fork: the game offers a scene to mortals who lean one way on the scene's value. When the scene's choice then splits on that same value, the arm that matters is usually the other one. Either the draw was always meant to reach both kinds of mortal, and the code has drifted from its own docs. Or the lean is the design, and the house guide has to stop telling authors to build forks on the same value. Open a chat and say you want to work THR-1525. The full question is in [user-actions](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (5)

- **May the planning lane draft design docs itself?** The reason given for the rule against it has expired. A yes would let it draft [THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded), [THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the) and [THR-1528](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location). *— from tb-orchestrator*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs nobody had built. All five are restored. *— from tb-orchestrator*
- **Finish the sitting** for [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with). Two encounters are left, and nothing is broken on screen.
- **Were you away from the app on Monday 14 and Tuesday 15 September?** The 17 and 18 September stops are explained: the computer was asleep. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Starved: nothing ready, one job in progress, no parked jobs.** [THR-1529](https://linear.app/threadbare/issue/THR-1529/a-pickup-run-killed-mid-slice-leaves-its-work-invisible-no-wip-push) is claimed and in progress (a process fix that clears the materiality bar). The only live design item is [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its), about 31 hours on the desk; it is the ask above. Daily grooming notes that [THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded) is a design session's call under your delegation ruling. It does not need you.

## Health

- **THR-1529's pull request is still blocked on a failing docs check.** [PR #1987](https://github.com/christianspliid-ui/threadbare/pull/1987) failed "Docs gates" and has had no new push since 10:15 UTC, which is about 1h40 now. The 11:11 builder run did not fix it. The next builder run (~12:10 UTC) resumes its own claim. This is the builder's job, not yours.
- **Heavy simulation tests:** the probe still says "failing on main for 30 hours". The latest run on today's code ([08:34 UTC](https://github.com/christianspliid-ui/threadbare/actions/runs/35837874948)) passed. The pattern repeats daily: red first, then green on the same code. That points to a slow runner, not broken code. This is a technical call, not yours; the lasting fix (a longer time limit) is a session's job.
- **Lane silence:** the worst recent gap (25 hours, Saturday into Sunday) falls on a weekend. It is declined under your 11 September ruling.
- **Worktree reaper:** 5 worktrees await disposition (13:40 run). Routine; this is the reaper's call.
- Everything else is green. The live site is serving the latest game code (f50759a4); later commits touched only docs. CI is healthy, and all nine scheduled lanes are on time. Engine speed is 85 ms/tick, 20% above the 7-day median of 71. That is under the 25% alert line, on unchanged code (the last hour read 75), so it is measurement noise to watch, not a regression.
