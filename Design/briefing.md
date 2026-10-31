# Briefing
**Generated:** 2026-10-31 07:58 local (06:58 UTC) · keep-work-flowing-cc

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

*— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-30a.md)*

- [Only Mind has a cheap place card](https://linear.app/threadbare/issue/THR-2089/only-mind-has-a-cheap-place-card-under-the-god-caused-mandate-10-of-12): **cards, not a different Mandate price per Hunger.** Every sphere a Hunger can name gets a cheap card (2 essence) that a god can buy from the market at the start and cast on a town. Without one, a Reshape god cannot cast on its first sphere at all. A lower target for that Hunger would not change that. Veto: "price the Mandate per Hunger instead."
- Same ticket: **2 essence, not 1.** Mind's 1-essence Vision only looks; a card that changes the world costs what Dream and Kindle a Spark cost. Veto: "make them 1."
- Same ticket: **three new cards first.** *Steel the Walls* (force: a town's walls hold longer under siege), *Lay the Footings* (matter: the town's next building rises sooner) and *Keep the Stores* (time: the town's grain keeps for lean days). Spirit, life and entropy follow in [slice 2](https://linear.app/threadbare/issue/THR-2090/spirit-life-and-entropy-get-a-cheap-place-card-and-doom-wears-a-life). Veto any card by name.
- Same ticket: **Steel the Walls and Fortify do the same thing to different places.** Steel works on towns at 2; Fortify works on strongholds at 4. Today Fortify cannot be cast anywhere in the seeded world (it asks for keeps, and the world makes forts and towers), so it gains those two words. Veto: "leave Fortify as it is."

Say "veto <title>" to reverse any of these. The veto window closes at 08:03 local (07:03 UTC) today, a few minutes from now. After that, the builder starts on the ticket.

## This week's screens

[Contact sheet — the twelve screens of the fixed journey](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-10-27/contact-sheet.jpg) — first week, so there is nothing to compare yet. The opening holds up. Opening a page brings two visible faults, and the mid-game cannot be reached because the seeded world ends after 41 ticks.

## Queue

**Starved: one ticket ready, and it is held for a few more minutes.** [THR-2089](https://linear.app/threadbare/issue/THR-2089/only-mind-has-a-cheap-place-card-under-the-god-caused-mandate-10-of-12) (cheap place cards for force, matter and time) can be picked up from 07:03 UTC. The builder's runs since 03:51 UTC all stood down for exactly that reason, which is correct; the 07:11 UTC run should take it.

- **A finished fix is still waiting to be queued.** [THR-2091](https://linear.app/threadbare/issue/THR-2091/hex-cards-sphere-push-picks-the-nearest-place-on-the-wrong-hex-grid) (a god's push onto a hex can pick the wrong nearest place, because distance is measured on the wrong hex layout) is built, tested and reviewed on [branch `thr-2091-oddq`](https://github.com/christianspliid-ui/threadbare/tree/thr-2091-oddq), but the ticket is still in Idea, not Ready for Dev, so no builder run will take it. The orchestrator can move it; it is not your call.
- **The paperwork-cut ticket stays off your list.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has been parked with no owner since 20 Oct (11 days). Agents can un-park it.

## Health

- The lanes were silent for 40 hours (02:57 Thursday to 19:12 Friday local). That question is on your list above.

Everything else is green. The engine speed is normal (129 ms per tick, below the weekly median of 160). The live site is up to date (the only commits since the last publish are docs). CI and the background jobs pass, nothing is waiting to merge, the worktree reaper ran at 07:40, and all 9 enabled scheduled tasks are on time.
