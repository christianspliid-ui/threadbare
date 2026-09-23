# Briefing
**Generated:** 2026-09-23 17:55 local (15:55 UTC) · keep-work-flowing-cc

## The one thing

**One design hour: [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its). Are scenes being offered to exactly the people who will refuse them?**

The builder has **no game work left**. Nothing is ready, and its one open job is a process fix whose pull request is stuck (see Health). The planning lane may not stage anything new while THR-1525 sits on the design desk. That makes this the one decision that gets game work moving again.

The fork: the game offers a scene to mortals who lean one way on the scene's value. When the scene's choice then splits on that same value, the arm that matters is usually the other one. There are two readings:

- The draw was always meant to reach both kinds of mortal, and the code has drifted from its own docs.
- The lean is the design, and the house guide has to stop telling authors to build forks on the same value.

Open a chat and say you want to work THR-1525. The full question is in [user-actions](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (5)

- **May the planning lane draft design docs itself?** The reason given for the rule against it has expired. A yes would let it draft [THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded), [THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the) and [THR-1528](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location). *— from tb-orchestrator*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs nobody had built. All five are restored. *— from tb-orchestrator*
- **Finish the sitting** for [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with). Two encounters are left, and nothing is broken on screen.
- **Were you away from the app on Monday 14 and Tuesday 15 September?** The stops on 17 and 18 September are explained: the computer was asleep. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Starved: nothing ready, one job in progress, no parked jobs.** [THR-1529](https://linear.app/threadbare/issue/THR-1529/a-pickup-run-killed-mid-slice-leaves-its-work-invisible-no-wip-push) is claimed, with its PR open (a process fix). The only live design item is [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its), about 35 hours on the desk; it is the ask above. The orchestrator re-surfaces it at its 48-hour mark, ~06:37 local tomorrow.

## Health

- **THR-1529's pull request is orphaned, not just slow.** [PR #1987](https://github.com/christianspliid-ui/threadbare/pull/1987) failed "Docs gates" at the `check:predicate-copies` step ([run](https://github.com/christianspliid-ui/threadbare/actions/runs/35847857034)). It has had no push since 10:15 UTC, about 5h40 now. The builder runs explain why no run has touched it: it counts an issue with an open closing PR as *not* holding the work slot, so there is "nothing to resume". No lane will ever push the fix, and each builder run exits in about 30 seconds. **A session must fix the predicate-copies failure on the branch.** This is the builder's job, not yours. The skip rule is a gap in the pickup flow, noted for the weekly retro.
- **Engine speed:** the probe reports: "tick cost 98 ms/tick steady, 36% above the 7-day median (72, 86 rows since ee8f4909); top phase agent_decision, 503 agents. Name the merges between ee8f4909 and c1318329: git log --oneline --merges ee8f4909..c1318329". But the same commit (c1318329) measured 64 ms at 12:55 UTC, then 85, 91 and now 98 this afternoon. Code that did not change got slower, which points to machine load, not a regression. Watch whether it holds.
- **Heavy simulation tests:** the probe says "failing on main for 34 hours". The latest run on the current game code ([08:34 UTC](https://github.com/christianspliid-ui/threadbare/actions/runs/35837874948)) passed. The daily pattern holds: red first, then green on the same code. That points to a slow runner, not broken code. This is a technical call, not yours.
- **Lane silence:** the worst recent gap (25 hours, Saturday into Sunday) falls on a weekend. It is declined under your 11 September ruling.
- **Worktree reaper:** 5 worktrees await disposition. Routine; this is the reaper's call.
- Everything else is green. The live site is serving the latest game code; later commits touched only docs. CI is healthy, and the scheduled lanes are on time.
