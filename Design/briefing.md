# Briefing
**Generated:** 2026-09-23 22:56 local (20:56 UTC) · keep-work-flowing-cc

## The one thing

**Yes or no: may the planning lane write first-draft designs itself?** *— from tb-orchestrator*

Your 6 August rule says the planning lane stages design work but never writes it. The reason recorded for the rule was that the lane ran the cheaper Sonnet model. It runs Opus now, so that reason no longer holds. ([The rule, in the process canon](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md).)

- **Yes:** it drafts [THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded), [THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the) and [THR-1528](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location), runs the same audits a design chat would, and you review the drafts.
- **No:** nothing changes, and design stays in chats with you.

**Why now:** the builder finished [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its) (merged 22:41 local). All it has left is one small bug fix, [THR-1534](https://linear.app/threadbare/issue/THR-1534). After that, it has no game work.

## Also waiting (5)

- **Design session wanted for [THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the).** Follow-up scenes can fire on their own, so a stranger turns up to collect on a promise the mortal never made. It takes about half an hour and has no creative fork. Say "design THR-1526" in a chat. *— from tb-orchestrator*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs that nobody had built. *— from tb-orchestrator*
- **Finish the sitting** for [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with). Two encounters are left, and nothing on screen is broken.
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Starved: one job ready, one in progress, no parked jobs.**
- [THR-1534](https://linear.app/threadbare/issue/THR-1534) (two death paths skip the "will not die" ward) was filed at 22:15 local and is ready. It is the builder's next pickup.
- [THR-1529](https://linear.app/threadbare/issue/THR-1529/a-pickup-run-killed-mid-slice-leaves-its-work-invisible-no-wip-push) is a process fix. It is claimed, but its PR is stuck and has had no push since 12:15 local (~10h40). See Health.
- Correction to the last brief: the three Physical Conflict questions are already answered. You closed that map at 21:43 local ([THR-1258](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)). *— from tb-orchestrator*

## Health

- **THR-1529's pull request is still orphaned.** [PR #1987](https://github.com/christianspliid-ui/threadbare/pull/1987) now has a merge conflict as well as a failing "Docs gates" check. **A session must merge main in, resolve the conflict and fix the docs check.** That is the builder's job, not yours.
- **Heavy simulation tests:** the probe says it has been "failing on main for 39 hours". Tonight's run on the THR-1525 merge ([20:41 UTC](https://github.com/christianspliid-ui/threadbare/actions/runs/35917614021)) failed two tests, both on the 5-second timeout. This morning's run on unchanged code [passed](https://github.com/christianspliid-ui/threadbare/actions/runs/35837874948). The pattern is the same slow runner as before, not broken code. This is a technical call, not yours.
- **Lane silence:** the worst recent gap (25 hours, Saturday into Sunday) falls on a weekend. It is declined under your 11 September ruling.
- **Worktree reaper:** 5 worktrees are waiting to be sorted (last run 22:40 local). This is routine.
- Everything else is green. Engine speed is 60 ms/tick, 18% under its weekly median. The live site is serving the THR-1525 merge, CI is healthy, and all nine scheduled lanes are on time.
