# Briefing
**Generated:** 2026-11-21 03:58 local (02:58 UTC) · keep-work-flowing-cc

## The one thing

**Should every one of Kael's chapters give you a hand?** About 1 in 4 of The First's chapters is "Theirs alone": it plays out without you. Two of three warm testers asked for cards in every one. Say **"every chapter asks"** or **"keep theirs alone"** ([THR-2174](https://linear.app/threadbare/issue/THR-2174/the-player-cant-tell-which-chapters-wait-for-their-cards-the-gallows)). The design lane leans "every chapter asks". If you say nothing, it stays as it is. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-15b.md)*

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

## Decided for you

- [The Rebuke card says it answers only rival gods](https://linear.app/threadbare/issue/THR-2268/the-rebuke-card-says-it-answers-only-rival-gods-its-words-also-name) — the card's own words now name both things it answers. Its hover line becomes: *"Answers a rival god, or the doom, where it just struck a place: the place holds for a few days, and some of what was taken comes back."* The card does not get a separate "the doom fed here" line; the place page, the Doom panel's place list and the feeding alert already say that where you cast. Veto in chat. The build waits until 14:30Z (15:30 local) for that. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-21a.md)*
- [The Doom panel's left column shows raw numbers](https://linear.app/threadbare/issue/THR-2270/the-doom-panels-left-column-shows-raw-numbers-speed-modifier-090-doom) — the Doom dialog stops printing engine numbers. "Counter-omens 2" and "Doom debt +1.0" become one row, **"Next Doom card: Lands harder"** or **"Lands softer"**, hidden when the two cancel out or no stage is left. "Speed modifier ×1.05" becomes **"Pace: Hastened"** (or "Slowed"). The Mandate dialog keeps its count of the counter-omens you earned. Veto in chat. The build waits until 11:30Z (12:30 local) for that. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-20d.md)*
- [The Doom panel scrolls at its last stage](https://linear.app/threadbare/issue/THR-2269/the-doom-panel-scrolls-at-its-last-stage-at-19201080-the-stage-list) — the Doom dialog now fits on one screen. Each Doom card shows once, in the stage that dealt it; "Recent consequences" goes; passed stages fold to their names. **Already built and live** ([#2882](https://github.com/christianspliid-ui/threadbare/pull/2882)); a veto would undo it. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-20c.md)*

Say "veto <title>" to reverse any of these.

## Queue

**Healthy: 2 in Ready for Dev, 1 being built.** The veto window on [a quiet day on the map between chapters](https://linear.app/threadbare/issue/THR-2266/a-quiet-day-on-the-map-between-chapters-after-a-chapters-aftermath) closed at 02:30Z, and the builder took it straight away; it is in progress now. The two tickets on the shelf are inside their veto windows: [the Doom panel's raw numbers](https://linear.app/threadbare/issue/THR-2270/the-doom-panels-left-column-shows-raw-numbers-speed-modifier-090-doom) until 11:30Z and [the Rebuke card's words](https://linear.app/threadbare/issue/THR-2268/the-rebuke-card-says-it-answers-only-rival-gods-its-words-also-name) until 14:30Z.
Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (32 days; last touched 8 Nov, 13 days ago). No pushed branch or local worktree names it. It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching.

## Health

- **Tick cost is up, for the builder to check, not you:** "tick cost 222 ms/tick steady, 43% above the 7-day median (155, 140 rows since 3f7a04bf); top phase agent_decision, 638 agents. Name the merges between 3f7a04bf and 4118b0c2: git log --oneline --merges 3f7a04bf..4118b0c2". Last hour read 161 ms on the same commit, and two pickup sessions were running on this machine during this measurement, so this may be load rather than a slower engine. Next hour's reading will tell.
- Weekend and overnight quiet, not an ask: the lanes were silent for about 12 hours on Sunday 15 Nov (09:57 to 21:48), and overnight on 18–19 and 19–20 Nov. Per your ruling, that is normal.
- All green otherwise: the live site serves the latest main (4118b0c2); CI and scheduled jobs green; no PRs waiting to merge; every enabled lane on schedule; the worktree reaper ran within the hour. No UX contact sheet this week yet (the newest, 12 Nov, is over a week old; the next review runs Monday).
