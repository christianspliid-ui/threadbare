# Briefing
**Generated:** 2026-11-12 23:58 local (22:58 UTC) · keep-work-flowing-cc

## The one thing

**Sunday 8 to Thursday 12 Nov: the lanes were silent for about 103 hours. Was the computer off or the app closed, or was that a pause?** Every lane and the worktree reaper came back in the same minute tonight, so it looks like the computer or app was off. If so, just say so. If it wasn't, it becomes a fault to chase. Detail: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Also waiting (9)

- **Set the Claude app to open when Windows starts.** This would have closed most of these silent gaps without anyone noticing ([the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)).
- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. *— from the design lane*
- **Thursday 29 to Friday 30 Oct:** silent for 40 hours, no pause recorded. Computer off, app closed, or a pause?
- **Wednesday night to Friday night (21–23 Oct):** silent for 48 hours, no pause recorded. Computer off, app closed, or a pause?
- **Sunday evening to Monday evening (18–19 Oct):** silent for 23 hours, no pause recorded. App closed, or a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [The First's thread row cuts his current story to "raising a p…"](https://linear.app/threadbare/issue/THR-2193) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-12-thr-2193-thread-row-story-lines-wrap.md)). **The lines under a mortal in the Threads rail now wrap instead of cutting.** What they are working on, their latest chapter's result and their promises show in full, up to three lines each, instead of "raising a p… — all or nothing". The rail had empty room below, and your "room before scroll" law says a panel grows before it cuts. The other choice was shorter hand-written versions of every line; that would mean a new list to keep up to date and would still drop words. If the taller rows ever push the Chronicle off screen, the cap drops to two lines. It is held for your veto until 08:19 UTC tomorrow. Say "veto thread row wrap" to keep rows one line high instead.

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-12/contact-sheet.jpg) — better: The First's name fits, the essence and Doom readouts speak in words, and returning to the mid-game now opens on a "While you were away" summary, but arrival toasts still pile up and his thread row cuts his story short.

## Queue

**Starved but moving: 1 ready to build (held for your veto), 1 being built.** Two more fixes went live this hour, and the next "make the middle a game" ticket is queued for the design lane.

- Live now: [THR-2198](https://linear.app/threadbare/issue/THR-2198) four small faults from playtest round 7 ([PR #2802](https://github.com/christianspliid-ui/threadbare/pull/2802)) · [THR-2194](https://linear.app/threadbare/issue/THR-2194) several rulers' agendas coming due now fold into one toast ([PR #2803](https://github.com/christianspliid-ui/threadbare/pull/2803)).
- Being built: [THR-1938](https://linear.app/threadbare/issue/THR-1938) a writing check that wrongly fails every "master everyday" brief (builder run live since 22:51 UTC).
- Ready: [THR-2193](https://linear.app/threadbare/issue/THR-2193) thread row wraps (held for veto until 08:19 UTC).
- Next for the design lane: [THR-2201 Make the purse bite](https://linear.app/threadbare/issue/THR-2201/make-the-purse-bite-a-full-hand-should-cost-more-than-the-god-can), the first of the five tickets you approved today. *— from the orchestrator*

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (23 days; In Dev since 15 Oct). No pushed branch names it. It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- **Engine measured slower this run:** tick cost 188 ms/tick steady, 35% above the 7-day median (139, 64 rows since 4833b9b3); top phase agent_decision, 638 agents. Name the merges between 4833b9b3 and fe0d09ef: `git log --oneline --merges 4833b9b3..fe0d09ef`. Last hour read 149 ms, and this run measured while a builder session was busy on the same machine, so the next hour's row shows whether it holds. Executor work if it does.
- Everything else green: the live site serves the latest main (fe0d09ef), checks on main and the 3 scheduled background jobs pass, no PRs are waiting to merge, all 10 enabled scheduled tasks are on time, and the worktree reaper ran at 23:40 local (777 worktrees, 10 waiting for a decision).
