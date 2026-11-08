# Briefing
**Generated:** 2026-11-08 10:57 local (09:57 UTC) · keep-work-flowing-cc

## The one thing

**Pick what the design lane plans next. The builders have run out of agreed work.** The last ticket, [away leans](https://linear.app/threadbare/issue/THR-2189), is being built now. Nothing else is on the shelf: every agreed feature and bug has shipped or is waiting on you. Reply with a system, or with one of the warm-playtest problems: [rival gods you can't answer](https://linear.app/threadbare/issue/THR-2172), [no "while you were away"](https://linear.app/threadbare/issue/THR-2173), or ["Fated" failing with no reason](https://linear.app/threadbare/issue/THR-2171). If you don't reply, the lanes wait for the next playtest round to fill the list again. *— from [the orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-11-08.md), still open on Discord ([run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-11-08b.md))*

## Also waiting (9)

- **Set the Claude app to open when Windows starts.** The lanes lost 40 hours on 29–30 Oct and 48 hours on 21–23 Oct while the app was not running ([the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)).
- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. *— from the design lane*
- **Thursday 29 to Friday 30 Oct:** the lanes were silent for 40 hours and no pause was recorded. Was the computer off or the app closed, or was this a pause?
- **Wednesday night to Friday night (21–23 Oct):** the lanes were silent for 48 hours and no pause was recorded. Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours and no pause was recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- ["A Work Finished" says every undertaking left something standing](https://linear.app/threadbare/issue/THR-2075/a-work-finished-says-every-undertaking-left-something-standing-a-relic) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-08-thr-2075-a-finished-work-says-what-was-done.md)) — **when a mortal finishes a work that made nothing, the card now says what they actually did.** Taking up a relic reads "Kael takes up The Hollow Bell, left by a god of the last age…" instead of "It stands in the world now". Works that build something keep today's line; works that improve a mortal's own thing ("raise") get their own line. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-07h.md)* Live ([PR #2791](https://github.com/christianspliid-ui/threadbare/pull/2791)).

Say "veto finished work line" to reverse it.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-02/contact-sheet.jpg) — better: all three of last week's faults are fixed, and for the first time the review reached a real mid-game, where one new overlap shows.

## Queue

**Starved: nothing ready to build.** The builder claimed [away leans](https://linear.app/threadbare/issue/THR-2189) at 09:11 UTC and is still working on it (branch `proto/thr-2189-away-lean-waits`). No pull requests are open.

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (19 days; In Dev since 15 Oct). Earlier briefs said its work sat on the branch `pr/1947`, but this run found no such branch on GitHub or in the local copy, so where its work is now is unknown. It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- The live site serves the latest main (e39f348f). Checks on main and the 3 scheduled background jobs pass. No pull requests are waiting. All 10 enabled scheduled tasks are on time. The worktree reaper ran at 10:40 local (778 worktrees, 8 waiting for a decision).
- **Engine speed reading is high:** tick cost 206 ms/tick steady, 43% above the 7-day median (144, 156 rows since d3516032); top phase agent_decision, 638 agents. Name the merges between d3516032 and e39f348f: `git log --oneline --merges d3516032..e39f348f`. The same commit measured 146 ms/tick two hours ago and the builder was running at the same time, so this is likely machine load rather than a code change. Executor's job, not yours.
- The lanes were quiet overnight 3–4 Nov (20:25–08:19 local). Overnight quiet is normal, so this is not an ask.
- **The home-folder copy of the repo is 249 commits behind main** (last synced 4 Nov). An edited `.claude/settings.local.json` and untracked files under `Docs/evidence/` and `Docs/ops/` still block the mirror's sync. This brief has flagged it 51 hours in a row. An attended agent session should set those files aside and fast-forward. Nothing is lost, because the lanes work from fresh copies of main.
