# Briefing
**Generated:** 2026-10-31 21:58 local (20:58 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every lane stopped at about 02:57 Thursday morning and came back together at 19:12 Friday evening: 40 hours with nothing built. The worktree reaper, which runs on its own Windows timer, stopped at the same time, so the computer was probably off or asleep. Turning on "open at login" for the Claude app closes these gaps. Only you can change that setting. Say "done" and the next silence check confirms it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (8)

- **Your writing-checks conversation can start.** [The story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b) reviewed every writing check against real lines, which is what [Writing evals — with Christian](https://linear.app/threadbare/issue/THR-2106) needs. *— from the design lane*
- **Thursday 29 to Friday 30 Oct:** "The scheduled lanes went silent for 40.3h (2026-10-29T01:56:50.000Z → 2026-10-30T18:17:35.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." *— silence check*
- **Wednesday night to Friday night (21–23 Oct):** the lanes were silent for 48 hours and no pause was recorded. Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours and no pause was recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Art-led pass, slice 2 — every other Inspector page](https://linear.app/threadbare/issue/THR-2098/art-led-pass-slice-2-every-other-inspector-page-places-lands-factions) (new): towns and cities show their own landscape in the page header instead of today's placeholder mark (all 235 places in a seeded world have one). Veto line: "places keep the placeholder". Window closes about 06:45 tomorrow morning.
- Same ticket: the Mandate is the god page's one highlighted line, in words ("Rising." and the current objective); the progress bar stays on the god rail. Veto line: "put the Mandate bar on the god page".
- Same ticket: lists of strengths become chips ("Might · Strong"), one-fact rows become sentences ("Here you are Accepted."), and the bars beside single words drop. Veto line: "keep the bars".
- Same ticket: relics lying at a place or held by a faction show as painted tiles, like The First's carried relics. Veto line: "no relic gallery on places and factions".
- Same ticket: headings with no fitting icon draw none and join [your icon pick](https://linear.app/threadbare/issue/THR-2104) once the build merges, including the god page's own Overview tab. Veto line: "pick a near icon instead".
- [Story text, slice 1](https://linear.app/threadbare/issue/THR-2105/story-text-quality-in-encounters-read-the-prose-the-way-a-player-meets): the everyday board encounters get the full three-paragraph opening (who arrives where, what has gone wrong, the one problem), like the newer encounters. Where they can happen does not change. Veto line: "board encounters should stay short". Window closes about 03:50 tonight.
- Same ticket: the Swollen Ford example card lines, which you approved on 9 August under the older rules, lose "A small help." / "A real help." and the "You…". The newer rules ban both. The factory copies that example, so 121 card lines picked up the habit. Veto line: "keep the Swollen Ford cards as approved".
- Same ticket: the board's background people stay unnamed for now ("the trader"). Naming them needs proper cast slots across 168 encounters, so it would be its own job. Veto line: "name the board's people".

Say "veto <title>" to reverse any of these. *— from the design lane ([afternoon report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-31b.md), [evening report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-31c.md))*

## This week's screens

[Contact sheet — the twelve screens of the fixed journey](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-10-27/contact-sheet.jpg) — first week, so there is nothing to compare yet. The opening holds up. Opening a page brings two visible faults, and the mid-game cannot be reached because the seeded world ends after 41 ticks.

## Queue

**Thin — two tickets ready, both waiting on their veto windows.** [THR-2105](https://linear.app/threadbare/issue/THR-2105/story-text-quality-in-encounters-read-the-prose-the-way-a-player-meets) (story text, slice 1) becomes claimable about 03:47 tonight; [THR-2098](https://linear.app/threadbare/issue/THR-2098/art-led-pass-slice-2-every-other-inspector-page-places-lands-factions) (art-led Inspector pages, slice 2, new this evening) about 06:45 tomorrow. The builder's last ten runs (since 18:51) correctly stood down on these holds; that is idle by design, not a stall.

- **Next:** the veto window on the spirit, life and entropy cards ([THR-2090](https://linear.app/threadbare/issue/THR-2090/spirit-life-and-entropy-get-a-cheap-place-card-and-doom-wears-a-life)) closed at about 21:52 with no veto, so the orchestrator can move it to Ready for Dev on its next run (about 22:28).

Two items for agents, not you:
- **A finished fix is still waiting to be queued.** [THR-2091](https://linear.app/threadbare/issue/THR-2091/hex-cards-sphere-push-picks-the-nearest-place-on-the-wrong-hex-grid) (a god's push onto a hex can pick the wrong nearest place) is built on [branch `thr-2091-oddq`](https://github.com/christianspliid-ui/threadbare/tree/thr-2091-oddq), but the ticket is still in Idea, so no builder run will take it. With the queue held, this is the cheapest work on the board.
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (11 days). No branch or local worktree holds work for it. Agents can un-park it.

## Health

All green. The live site is current (126665db; later commits were docs only). The PR checks and the scheduled background jobs pass, no pull request is waiting, the worktree reaper ran at 21:54, the enabled scheduled tasks are on time, and engine speed is normal (152 ms/tick, 4% under the 7-day median).

The 40-hour silence on 29–30 Oct is on your list above.
