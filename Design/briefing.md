# Briefing
**Generated:** 2026-09-24 00:58 local (22:58 UTC) · keep-work-flowing-cc

## The one thing

**Yes or no: may the planning lane write first-draft designs itself?** *— from tb-orchestrator*

Your rule from 6 August says the planning lane stages design work but never writes it. The reason on record is that the lane ran the cheaper Sonnet model. It runs Opus now, so that reason no longer holds. ([The rule, in the process canon](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md).)

- **Yes:** the lane drafts [THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded), [THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the) and [THR-1528](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location). It runs the same audits a design chat would, and you review the drafts.
- **No:** nothing changes, and design stays in chats with you.

**Why now:** the builder finished [THR-1536](https://linear.app/threadbare/issue/THR-1536/a-killings-grief-reaches-only-the-corpse-the-ambition-phase-walks-the) tonight ([#1994](https://github.com/christianspliid-ui/threadbare/pull/1994)). A killing's grief now reaches the victim's family and friends. The builder's queue holds one job, the first fight slice ([THR-1537](https://linear.app/threadbare/issue/THR-1537/fight-block-fb1-fight-steps-read-their-opponent)). After that, only designs that nobody has written yet stand in its way.

## Also waiting (6)

- **The odds shown are not the odds rolled ([THR-1535](https://linear.app/threadbare/issue/THR-1535/the-odds-shown-are-not-the-odds-rolled-the-unified-road-never-reads-a)).** Items, conditions and standing change the percentage you see, but not the dice. The fix shifts the odds on every ordinary encounter step at once. **Are you OK with that landing unattended?** The fix stops itself if success rates move more than 10 points. *— from tb-orchestrator*
- **Design session wanted for [THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the).** Follow-up scenes can fire on their own. It takes about half an hour and has no creative fork. To start it, say "design THR-1526" in a chat. *— from tb-orchestrator*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs that nobody had built. *— from tb-orchestrator*
- **Finish the sitting** for [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with). Two encounters are left, and nothing on screen is broken.
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Starved: one job ready, one in progress, no parked jobs.**
- [THR-1537](https://linear.app/threadbare/issue/THR-1537/fight-block-fb1-fight-steps-read-their-opponent) is the builder's next pickup: fight steps take their opponent into account. It is High priority and the first slice of the fight plan. Four fight plans were merged tonight: fight-block, fight-on-screen, mortal duels and hunts ([#1993](https://github.com/christianspliid-ui/threadbare/pull/1993), [#1995](https://github.com/christianspliid-ui/threadbare/pull/1995), [#1996](https://github.com/christianspliid-ui/threadbare/pull/1996)). More slices should come through as the orchestrator unblocks them.
- [THR-1529](https://linear.app/threadbare/issue/THR-1529/a-pickup-run-killed-mid-slice-leaves-its-work-invisible-no-wip-push) is a process fix. It is claimed, and its PR is still stuck (see Health).

## Health

- **THR-1529's pull request still will not merge.** The conflict on [PR #1987](https://github.com/christianspliid-ui/threadbare/pull/1987) was resolved at 00:13 local. The docs gate now fails on one check, `check:predicate-copies`. **A session must read that check and push a fix.** That is the builder's job, not yours.
- **Lane silence:** the worst recent gap (25 hours, Saturday into Sunday) falls on a weekend. Your 11 September ruling declines it.
- **Home tree:** it is on `main` and up to date. One tracked local edit (`.claude/settings.local.json`) is harmless.
- **Worktree reaper:** 5 worktrees are waiting to be sorted (last run 00:40 local). This is routine.
- Everything else is green:
  - Engine speed is 60 ms/tick, 16% under its weekly median.
  - The live site is current. Tonight's commits since the THR-1536 fix touched only docs.
  - CI is healthy.
  - All nine scheduled lanes are on time.
