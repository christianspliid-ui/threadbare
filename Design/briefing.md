# Briefing
**Generated:** 2026-11-07 19:56 local (18:56 UTC) · keep-work-flowing-cc

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
- [The sheet's Story list shows a raw key](https://linear.app/threadbare/issue/THR-2145) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-07-thr-2145-story-rows-name-the-deed.md)) — **a mortal's Story list will name what happened to them in words, never in the game's internal code.** Kael's sheet showed "cell.destroy.power (afflicted)". It will now read "Destroy a power", the same words the work's card uses. A fight death reads as the fight's title ("The Beast in Its Den"), and a commander killed in battle reads "A commander slain in battle". Nobody builds on this before 20:30 UTC on 7 November. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-07c.md)*

Say "veto paid army turns at once", "veto one tick runs once", "veto scene picture alt text" or "veto Story rows name the deed" to reverse any of these.

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-02/contact-sheet.jpg) — better: all three of last week's faults are fixed, and for the first time the review reached a real mid-game, where one new overlap shows.

## Queue

**Starved: one ticket ready, on hold until 20:30 UTC. Nothing is being built right now.**
- [An army taken into its liege's pay keeps marching on its liege's town](https://linear.app/threadbare/issue/THR-2026/an-army-taken-into-its-lieges-pay-keeps-marching-on-its-lieges-town) is built and live ([PR #2786](https://github.com/christianspliid-ui/threadbare/pull/2786)).
- [The sheet's Story list shows a raw key](https://linear.app/threadbare/issue/THR-2145/the-sheets-story-list-shows-a-raw-key-celldestroypower-afflicted) opens after 20:30 UTC today. The builder runs at 18:09, 18:32 and 18:51 UTC stood down correctly, because it was still inside its hold.
- Next for the design lane to plan: [away leans almost always read "work"](https://linear.app/threadbare/issue/THR-2189), now that THR-2026 is handed off. *— from [the orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-11-07f.md)*

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (18 days; In Dev since 15 Oct, 23 days; last touched 1 Nov). No pushed branch and no local worktree carries work for it. It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- The live site is up to date (2f555386). Checks on main and the 3 scheduled background jobs pass. No pull requests are waiting. All scheduled tasks are on time. The worktree reaper ran within the hour. Engine speed is normal (133 ms/tick, 9% under the 7-day median).
- The lanes were quiet overnight 3–4 Nov (20:25–08:19 local); overnight quiet is normal, so it is not an ask.
- **The home-folder copy of the repo is 217 commits behind main** (last synced 4 Nov). An edited `.claude/settings.local.json` and untracked files under `Docs/evidence/` and `Docs/ops/` still block the mirror's sync. This is the thirty-sixth hour in a row this brief has flagged it; an attended agent session should set them aside and fast-forward. Nothing is lost, because the lanes work from fresh copies of main.
