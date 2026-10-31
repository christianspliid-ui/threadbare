# Briefing
**Generated:** 2026-10-31 13:58 local (12:58 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** It happened again: every lane stopped at about 02:57 Thursday morning and came back together at 19:12 Friday evening. That is 40 hours with nothing built. The worktree reaper, which runs on its own Windows timer, stopped at the same time, so the computer was probably off or asleep. Turning on "open at login" for the Claude app closes these gaps. Only you can change that setting. Say "done" and the next silence check confirms it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (7)

- **Thursday 29 to Friday 30 Oct:** "The scheduled lanes went silent for 40.3h (2026-10-29T01:56:50.000Z → 2026-10-30T18:17:35.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the computer off or the app closed, or was this a pause?
- **Wednesday night to Friday night (21–23 Oct):** the lanes were silent for 48 hours and no pause was recorded. Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours and no pause was recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Spirit, life and entropy get a cheap place card](https://linear.app/threadbare/issue/THR-2090/spirit-life-and-entropy-get-a-cheap-place-card-and-doom-wears-a-life): Doom's rising tide still darkens the whole world, but it no longer wipes a god's Mandate. Doom's own works and rivals still take back what the god built. Without this, a life god (Gather) could never fill its Mandate: 1.2 of 87 points, against 30 with the change. Veto line: "doom should wear a life god down everywhere".
- Same ticket: three cheap town cards at 2 essence. *Tend the Sick* (life) heals a town, *Let the Damp In* (entropy) slowly sickens one, *Keep the Vigil* (spirit) calms unrest by mourning the dead. *Stoke the Forges* drops from 3 to 2 essence, so every Hunger's sphere now has a cheap town card.

Say "veto <title>" to reverse any of these. The window closes about 21:52 tonight. *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-31a.md)*

## This week's screens

[Contact sheet — the twelve screens of the fixed journey](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-10-27/contact-sheet.jpg) — first week, so there is nothing to compare yet. The opening holds up. Opening a page brings two visible faults, and the mid-game cannot be reached because the seeded world ends after 41 ticks.

## Queue

**Starved — one ticket ready, and it is a repair for agents.** The builder took the art-led person page ([THR-2097](https://linear.app/threadbare/issue/THR-2097/art-led-pass-slice-1-inspector-art-and-icon-primitives-dressed-on-the), work on [branch `claude/thr-2097-art-led-person-page`](https://github.com/christianspliid-ui/threadbare/tree/claude/thr-2097-art-led-person-page)). The only ready ticket is this run's heavy-tests fix ([THR-2107](https://linear.app/threadbare/issue/THR-2107/heavy-simulation-tests-red-on-main-the-thr-2068-compelled-journey), see Health).

- **Next:** the spirit, life and entropy cards ([THR-2090](https://linear.app/threadbare/issue/THR-2090/spirit-life-and-entropy-get-a-cheap-place-card-and-doom-wears-a-life)) become ready when their veto window closes, about 21:52 tonight.

Two items for agents, not you:
- **A finished fix is still waiting to be queued.** [THR-2091](https://linear.app/threadbare/issue/THR-2091/hex-cards-sphere-push-picks-the-nearest-place-on-the-wrong-hex-grid) (a god's push onto a hex can pick the wrong nearest place) is built, tested and reviewed on [branch `thr-2091-oddq`](https://github.com/christianspliid-ui/threadbare/tree/thr-2091-oddq), but the ticket is still in Idea, so no builder run will take it.
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (11 days). No branch or local worktree names it. Agents can un-park it.

## Health

- **Heavy tests red on main since 12:37 local; ticket [THR-2107](https://linear.app/threadbare/issue/THR-2107/heavy-simulation-tests-red-on-main-the-thr-2068-compelled-journey) filed for the builder.** One test of 285 fails after the faction set-piece merge ([#2661](https://github.com/christianspliid-ui/threadbare/pull/2661)): a compelled journey no longer finds its forage scene ([run](https://github.com/christianspliid-ui/threadbare/actions/runs/41197611019)).
- **Engine speed:** tick cost 227 ms/tick steady, 42% above the 7-day median (160, 127 rows since 81dce35c); top phase agent_decision, 639 agents. Name the merges between 81dce35c and 4295d33d: git log --oneline --merges 81dce35c..4295d33d. (Last hour measured 142, so this one reading may be machine load; next hour's row will tell.)
- The lanes were silent for 40 hours (02:57 Thursday to 19:12 Friday local). That question is on your list above.

Everything else is green. The live site is current (only a plan doc since its last build, 3f35dd85). The PR checks pass, no pull request is waiting, the worktree reaper ran at 13:40, and the enabled scheduled tasks are on time.
