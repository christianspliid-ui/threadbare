# Briefing
**Generated:** 2026-11-12 21:57 local (20:57 UTC) · keep-work-flowing-cc

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

## News from the playtest (no decision needed)

- **Best round so far: nobody said no.** All three new players bonded a mortal for the sixth round running. For the first time the lunch-break player moved from "no" to "maybe" ([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-7.md)).
- **Round 6's walls are gone.** Chapters now answer on screen, and the results screen and the mortal's page agree.
- **The new wall is the god's goal.** Its bar says your mortal's deeds fill it, but they never do, so after five chapters it still shows nothing. All three players were stuck on "am I winning?" ([THR-2199](https://linear.app/threadbare/issue/THR-2199), for design).
- **The bonding scene, everyone's favourite, opens cut off at the top** and cannot be scrolled up ([THR-2195](https://linear.app/threadbare/issue/THR-2195), ready to build).
- **6 tickets are filed** in the [round-7 group](https://linear.app/threadbare/project/onboarding-and-first-run-experience-4591bc5f51c7): 4 bugs ready to build and 2 for design. Round 8 runs on its own once they are closed and live. Nothing here needs a decision from you.

*— from [cold playtest round 7](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-7.md)*. Since then the bonding-scene fix ([THR-2195](https://linear.app/threadbare/issue/THR-2195)) has merged and is live ([PR #2799](https://github.com/christianspliid-ui/threadbare/pull/2799)).

## Queue

**Healthy again: 4 ready to build, 1 being built.** Last hour's ask ("what should the design lane plan next?") is retired: playtest round 7 and the weekly screen review refilled the shelf, as the brief said they would.

- Being built: [THR-2196 — The First's first chapter contradicts itself](https://linear.app/threadbare/issue/THR-2196) (claimed 20:09 UTC, branch pushed, a builder run is live).
- Ready: [THR-2198](https://linear.app/threadbare/issue/THR-2198) four small faults from round 7 · [THR-2197](https://linear.app/threadbare/issue/THR-2197) popups opening under the player's hand · [THR-2193](https://linear.app/threadbare/issue/THR-2193) thread row wraps (held for veto until 08:19 UTC) · [THR-2194](https://linear.app/threadbare/issue/THR-2194) stacked "claim comes due" toasts.

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (23 days; In Dev since 15 Oct). It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

All green. The live site serves the latest main (8fcdca17). Checks on main and the 3 scheduled background jobs pass. No PRs are waiting to merge. All 10 enabled scheduled tasks are on time. Engine speed is back to normal (159 ms/tick, within range of the 136 median). The home-folder copy of the repo has caught up with main. The worktree reaper ran at 21:40 local (775 worktrees, 10 waiting for a decision).
