# Briefing
**Generated:** 2026-11-07 21:57 local (20:57 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** The lanes lost 40 hours on 29–30 Oct and 48 hours on 21–23 Oct while the app was not running, with tickets ready to build both times. [The workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md) traced every recent gap to the app not reopening after a start or wake. Only you can change that setting. Say "done" and the next silence check confirms it.

## Also waiting (8)

- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. The next story-beat rewrite waits on it too. *— from the design lane*
- **Thursday 29 to Friday 30 Oct:** the lanes were silent for 40 hours and no pause was recorded. Was the computer off or the app closed, or was this a pause?
- **Wednesday night to Friday night (21–23 Oct):** the lanes were silent for 48 hours and no pause was recorded. Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours and no pause was recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [An army taken into its liege's pay keeps marching on its liege's town](https://linear.app/threadbare/issue/THR-2026/an-army-taken-into-its-lieges-pay-keeps-marching-on-its-lieges-town) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-07-thr-2026-the-paid-army-turns-at-once.md)) — **a company that takes its liege's pay turns to fight for that liege before the day's turn ends.** Before, a hired company could keep walking towards its new paymaster's own town for up to a day before it changed course. It never attacked, but the map showed it heading for a friend. After the fix, as soon as its target is on its paymaster's side, it picks a new target. A company in the middle of a siege, or one on a notable's own errand, keeps its course. This is a technical fix, so nothing is held for a veto. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-07f.md)* Now built and live ([PR #2786](https://github.com/christianspliid-ui/threadbare/pull/2786)).
- [Event ids collide during play](https://linear.app/threadbare/issue/THR-1921/orchestrator-event-ids-collide-evt-141-10-25-duplicate-react-keys-in) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-07-thr-1921-one-tick-runs-once.md)) — **the world will never run the same day twice.** Now and then one day of the world ran twice from the same starting point, so mortals could take two steps instead of one and the history log wrote the day twice. The fix makes the running clock note where it got to, and adds a tracker so any future repeated day names itself. Nothing changes on screen. This is a technical fix, so nothing is held for a veto. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-07e.md)* Now built and live ([PR #2783](https://github.com/christianspliid-ui/threadbare/pull/2783)).
- [The encounter illustration's alt text is the whole encoded contract](https://linear.app/threadbare/issue/THR-1733/the-encounter-illustrations-alt-text-is-the-whole-encoded-contract) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-07-thr-1733-scene-picture-speaks-words.md)) — **an encounter's opening picture will be read aloud as a scene, never as the game's internal data.** A screen reader now says "Scene from Road Ambush" instead of reading several thousand characters of hidden setup data. Sighted players see no change. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-07d.md)* Now built and live ([PR #2781](https://github.com/christianspliid-ui/threadbare/pull/2781)).

Say "veto paid army turns at once", "veto one tick runs once" or "veto scene picture alt text" to reverse any of these. (The Story-rows decision passed its 12-hour veto window and is now built and live, [PR #2787](https://github.com/christianspliid-ui/threadbare/pull/2787).)

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-02/contact-sheet.jpg) — better: all three of last week's faults are fixed, and for the first time the review reached a real mid-game, where one new overlap shows.

## Queue

**Starved: nothing is ready to build.** The builder shipped the last ready ticket, [the sheet's Story list shows a raw key](https://linear.app/threadbare/issue/THR-2145), and it merged at 20:50 UTC ([PR #2787](https://github.com/christianspliid-ui/threadbare/pull/2787)). It is live. The builder run at 20:46 UTC found Ready for Dev empty and stood down, which is correct.
- Next for the design lane to plan: [away leans almost always read "work"](https://linear.app/threadbare/issue/THR-2189). The design lane runs next at about 23:17 UTC. *— from [the orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-11-07f.md)*

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (18 days; In Dev since 15 Oct, 23 days; last touched 1 Nov). No pushed branch and no local worktree carries work for it. It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- The live site is up to date (9bc9da97). Checks on main and the 3 scheduled background jobs pass. No pull requests are waiting. All scheduled tasks are on time. The worktree reaper ran within the hour.
- **Engine speed reading is high:** "tick cost 207 ms/tick steady, 43% above the 7-day median (145, 156 rows since 11c77fb5); top phase agent_decision, 638 agents. Name the merges between 11c77fb5 and 9bc9da97: git log --oneline --merges 11c77fb5..9bc9da97". Last hour read 131 ms/tick on nearly the same code (only THR-2145's sheet-text fix landed between), so a busy machine is the likely cause. If next hour still reads high, a builder session should go through those merges.
- The lanes were quiet overnight 3–4 Nov (20:25–08:19 local). Overnight quiet is normal, so this is not an ask.
- **The home-folder copy of the repo is 221 commits behind main** (last synced 4 Nov). An edited `.claude/settings.local.json` and untracked files under `Docs/evidence/` and `Docs/ops/` still block the mirror's sync. This brief has flagged it 38 hours in a row. An attended agent session should set those files aside and fast-forward. Nothing is lost, because the lanes work from fresh copies of main.
