# Briefing
**Generated:** 2026-11-12 20:53 local (19:53 UTC) · keep-work-flowing-cc

## The one thing

**Pick what the design lane plans next. The builders have run out of agreed work.** [Away leans](https://linear.app/threadbare/issue/THR-2189), the last agreed ticket, merged on Sunday 8 Nov ([PR #2795](https://github.com/christianspliid-ui/threadbare/pull/2795)) and is live. Nothing is ready to build now. Reply with a system, or with one of the warm-playtest problems: [rival gods you can't answer](https://linear.app/threadbare/issue/THR-2172), [no "while you were away"](https://linear.app/threadbare/issue/THR-2173), or ["Fated" failing with no reason](https://linear.app/threadbare/issue/THR-2171). If you don't reply, the lanes wait for the next playtest round to fill the list again. *— from [the orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-11-08.md)*

## Also waiting (10)

- **Sunday 8 to Thursday 12 Nov: the lanes were silent for about 103 hours (new).** Every lane and the worktree reaper came back in the same minute tonight, so the computer or the app looks to have been off. Was it, or was this a pause?
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

## Queue

**Starved: nothing ready to build (0 in Ready for Dev).** That is correct while no agreed work is on the shelf; see the lead ask.

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (23 days; In Dev since 15 Oct). GitHub has no branch for it and no local worktree holds work for it. It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- **The lanes were dark from Sunday 8 Nov 13:37 to Thursday 12 Nov about 20:45 local.** The silence check says: "No scheduled Claude Code lane has written to origin/main or origin/ops since 2026-11-08T12:37:04.000Z — 103.2h of fleet-wide silence, past the 6h threshold, and no pause marker is set. Either the lanes are broken, or this is a deliberate pause that was never declared." The lanes started again at 19:45–19:48 UTC tonight, and this brief is the first write since. The ask is above.
- **Engine speed reads slow, but probably because the machine was busy:** "tick cost 238 ms/tick steady, 76% above the 7-day median (136, 65 rows since 90221547); top phase agent_decision, 638 agents. Name the merges between 90221547 and 0a999d5b: git log --oneline --merges 90221547..0a999d5b". Only one merge ([PR #2795](https://github.com/christianspliid-ui/threadbare/pull/2795)) landed since the last normal reading (125 ms/tick), and six lanes started in the same minute as this measurement. The next hour's reading will tell. Executor's job if it holds.
- **The home-folder copy of the repo is 255 commits behind main.** An edited `.claude/settings.local.json` and untracked files under `Docs/evidence/` and `Docs/ops/` still block the mirror's sync. An attended agent session should set those files aside and fast-forward. Nothing is lost, because the lanes work from fresh copies of main.
- The live site serves the latest main (0a999d5b). Checks on main and the 3 scheduled background jobs pass. No PRs are waiting to merge. All 9 enabled scheduled tasks are on time. The worktree reaper ran at 20:40 local (777 worktrees, 8 waiting for a decision).
