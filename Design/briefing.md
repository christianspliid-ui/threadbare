# Briefing
**Generated:** 2026-09-23 07:58 local (05:58 UTC) · keep-work-flowing-cc

## The one thing

**The builder's model credit.** [claude.ai usage settings](https://claude.ai/settings/usage). Please check it this morning and top it up if it has not reset.

Yesterday the builder failed **eight times in a row**, every hour from 10:11 to 17:11 local, and each time the error was *"You've reached your Fable limit."* The machine was then off overnight (about 19:40 to 07:30), so **nothing has tried since**. The next attempt is at about **08:11**. If the limit reset overnight, that run gets the work moving again without you and this ask drops off the next brief. If the limit has not reset, the builder fails the same way, and topping up is the only fix. No agent can move a scheduled lane onto another model.

One job is waiting: [artifact traits](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits). It is designed and claimed. I checked again this run and nothing has been started: no branch, no pull request. The builder picks it up again by itself. Nothing is lost while it waits.

## Also waiting (7)

- **Heavy simulation tests** — "Heavy simulation tests" has been failing on main for 24 hours and nobody has picked it up — the code on main has a problem the merge gate does not check. *(This is the probe's own sentence. It also needs the builder, so it is stuck behind the ask above.)*
- **One design hour** — [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its): the game offers scenes to exactly the mortals who will refuse them. The biggest item here.
- **May a planning lane draft a design doc on its own?** Its rule against drafting rests on a reason that has expired: it used to run a cheaper model. *— from tb-orchestrator*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). On Sunday it closed five jobs nobody had built. All five are restored. *— from tb-orchestrator*
- **Finish the sitting** for [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with). Two encounters are left, and nothing is broken on screen.
- **Were the weekday stops deliberate?** The lanes went quiet on 17 and 18 September with no pause marker. Overnight and weekend quiet is already declined.
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

## Queue

**Starved: nothing ready to build, 1 in progress.** Ready for Dev is empty. In Dev holds only [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits), claimed yesterday at 10:21 and not started. The board has not changed since 10:22 yesterday. Nothing is blocked or stale.

One item is in In Design: [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its), unassigned for about 25 hours. That is the design-hour ask above, not a parked job.

## Health

- **The overnight gap was the machine being off, not stuck lanes.** The heartbeat probe says the builder and the orchestrator are 13–14 slots behind "while keep-work-flowing-cc kept firing". The second half is wrong: this lane also stopped after 17:58, and the worktree reaper has no runs between 19:40 and 07:32. Every lane stopped together, overnight. That is declined under your 8 August ruling, so it is not an ask. The first real test is the builder's 08:11 run.
- **Heavy simulation tests** have been red on main for 24 hours. That lane runs after merges, not as a merge gate, so nothing is blocked. It is listed above only because the probe flags it that way. Fixing it is a session's job.
- **Lane silence:** the worst recent gap (25 hours, Saturday into Sunday) falls on a weekend and is declined under your 11 September ruling.
- Everything else is green. The live site is current: only docs changed since the last build. CI is green, no pull requests are waiting, and the reaper ran at 07:32. Engine speed is 84 ms/tick, 19% above the 7-day median of 70. That is below the 25% drift line, so no action.
