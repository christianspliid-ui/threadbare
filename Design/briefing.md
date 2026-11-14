# Briefing
**Generated:** 2026-11-14 12:58 local (11:58 UTC) · keep-work-flowing-cc

## The one thing

**From Sunday 8 to Thursday 12 Nov, the lanes were silent for about 103 hours. Was the computer off, was the app closed, or was that a pause?** Every lane and the worktree reaper came back in the same minute on Thursday evening, so it looks like the computer or the app was off. If so, just say so. If it wasn't, it becomes a fault to chase. Detail: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (9)

- **Set the Claude app to open when Windows starts.** That would have closed most of these silent gaps without anyone noticing ([the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)).
- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. *— from the design lane*
- **Thursday 29 to Friday 30 Oct:** silent for 40 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Wednesday 21 to Friday 23 Oct:** silent for 48 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Sunday 18 to Monday 19 Oct:** silent for 23 hours, with no pause recorded. App closed, or a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Re-decide the purse tuning](https://linear.app/threadbare/issue/THR-2215/re-decide-the-purse-tuning-no-setting-met-p1-p3-on-all-three-seeds-so): **the purse gets its numbers. Cards cost three times as much, each pool holds at most 35, and the god earns 0.6 where it earned 1.0.** Measured on five worlds: at 0.6 the god can pay for its whole hand only some of the time but always has a card it can play. **Veto:** say "veto purse numbers" to keep income at 1.0, or "richer purse" to step it to 0.7. The build is held for your veto until **12:17 UTC today (about 20 minutes from now)**: [Tune the purse](https://linear.app/threadbare/issue/THR-2216/tune-the-purse-card-prices-3-pool-cap-35-base-and-seat-income-06). *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-14a.md)*

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-12/contact-sheet.jpg) — better: The First's name fits, the essence and Doom readouts speak in words, and returning to the mid-game now opens on a "While you were away" summary, but arrival toasts still pile up and his thread row cuts his story short.

## Queue

**Healthy: 5 tickets in Ready for Dev.** Three shipped in the last hour: [the path draws The First to its work](https://linear.app/threadbare/issue/THR-2214) ([#2824](https://github.com/christianspliid-ui/threadbare/pull/2824)), [the garbled dashes](https://linear.app/threadbare/issue/THR-2217) ([#2825](https://github.com/christianspliid-ui/threadbare/pull/2825)) and [a won chapter credits the cards](https://linear.app/threadbare/issue/THR-2218) ([#2826](https://github.com/christianspliid-ui/threadbare/pull/2826)). The builder is now on [new Doom stages arrive as bare titles](https://linear.app/threadbare/issue/THR-2219) ([branch](https://github.com/christianspliid-ui/threadbare/tree/thr-2219-doom-words)). Next up are four more round-4 playtest bugs, two of them [recurring](https://linear.app/threadbare/issue/THR-2220) [after a fix](https://linear.app/threadbare/issue/THR-2221), then [THR-2216 Tune the purse](https://linear.app/threadbare/issue/THR-2216/tune-the-purse-card-prices-3-pool-cap-35-base-and-seat-income-06) once its veto window closes.

The design lane has a new plan open: [put the god in the climax](https://github.com/christianspliid-ui/threadbare/pull/2827), waiting on its checks.

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (25 days; In Dev since 15 Oct). No pushed branch or local worktree names it. It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

All green. Linear read live this run. The live site serves the latest commit on main (5fbfb9f9). Checks on main and the 3 scheduled background jobs pass; one PR (the design plan above) is waiting on checks and will merge on green. All 10 scheduled tasks are on time, and the worktree reaper ran at 12:40 local. Engine speed: 159 ms/tick, +5% on the 7-day median (152).
