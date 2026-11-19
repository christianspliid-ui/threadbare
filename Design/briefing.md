# Briefing
**Generated:** 2026-11-19 08:43 local (07:43 UTC) · keep-work-flowing-cc

## The one thing

**Should every one of Kael's chapters give you a hand?** About 1 in 4 of The First's chapters is "Theirs alone": it plays out without you. Two of three warm testers asked for cards in every one. Say **"every chapter asks"** or **"keep theirs alone"** ([THR-2174](https://linear.app/threadbare/issue/THR-2174/the-player-cant-tell-which-chapters-wait-for-their-cards-the-gallows)). The design lane leans "every chapter asks". If you say nothing, it stays as it is. *— from [the orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-11-18.md)*

## Also waiting (11)

- **Pick the carved icon shapes** for the five open icon classes ([THR-1908](https://linear.app/threadbare/issue/THR-1908/christian-picks-carved-shapes-for-the-five-open-icon-classes-doom), on [the review sheet](https://claude.ai/artifact/X9woLDsYia4iP3uQkk6QjN)) and the Inspector tabs with none yet ([THR-2104](https://linear.app/threadbare/issue/THR-2104/christian-picks-carved-shapes-for-the-inspectors-tabs-with-no-icon-yet)).
- **Sunday 8 to Thursday 12 Nov:** silent for 103 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Set the Claude app to open when Windows starts** ([the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)).
- **Your writing-checks conversation can start** ([the story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b), for [THR-2106](https://linear.app/threadbare/issue/THR-2106)).
- **Thursday 29 to Friday 30 Oct:** silent for 40 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Wednesday 21 to Friday 23 Oct:** silent for 48 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Sunday 18 to Monday 19 Oct:** silent for 23 hours, with no pause recorded. App closed, or a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided)).
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-12/contact-sheet.jpg) — better: The First's name fits, the essence and Doom readouts speak in words, and returning to the mid-game now opens on a "While you were away" summary, but arrival toasts still pile up and his thread row cuts his story short.

## Queue

**Starved: 0 in Ready for Dev.** Two things shipped overnight and are live: [a town that rises sacks its costliest building](https://linear.app/threadbare/issue/THR-2033) ([PR #2860](https://github.com/christianspliid-ui/threadbare/pull/2860)) and [Flawed Steel no longer genders its cast](https://linear.app/threadbare/issue/THR-2150) ([PR #2859](https://github.com/christianspliid-ui/threadbare/pull/2859)). The last ready ticket, [the faction sheet names its open commission](https://linear.app/threadbare/issue/THR-2043/the-faction-sheet-names-its-open-commission-the-player-can-see-before), is in progress: its work is saved on [its branch](https://github.com/christianspliid-ui/threadbare/tree/claude/thr-2043-faction-sheet-commission) (checkpoint before verify, 00:32 local), nothing uncommitted, and a builder run started 08:35 local. New work comes from [THR-2245, a well-played age can be won](https://linear.app/threadbare/issue/THR-2245/a-well-played-age-can-be-won-a-god-who-plays-the-whole-game-finishes), which is with the design lane; its next run is due about 09:17 local.

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (30 days; last touched 8 Nov). It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- **A broken git branch pointer on this machine.** The local pointer for `proto/thr-2245-full-player-census` was written as blank bytes at 00:36 local (a write cut off mid-way). Every `git fetch` here now ends with "bad object", and the session precheck reports freshness as unknown; the remote copies of main and ops still update. Repair: point it back at the remote's commit (`91e703c9`). This run's repair was refused by the permission check, so an agent in a watched session should do it. The home copy of main is 3 commits behind because of it.
- Engine speed: tick cost 228 ms/tick steady, 47% above the 7-day median (155, 129 rows since 0a999d5b); top phase agent_decision, 638 agents. Name the merges between 0a999d5b and 210bdbec: `git log --oneline --merges 0a999d5b..210bdbec`. A builder run was active on this machine during the measurement (last hour's 347 had the same caveat), so this may be a busy CPU. The executor's to chase if it holds.
- Lane silence: no lane ran from 00:33 to 08:35 local (8 hours overnight; the computer was most likely asleep). Per your ruling overnight quiet is normal, so this is not an ask; lanes are running again.
- Everything else green: main is live on 210bdbec, CI and heavy tests green on main, no PRs waiting, the worktree reaper last ran at 08:27 local.
