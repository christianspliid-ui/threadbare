# Briefing
**Generated:** 2026-10-29 02:57 local (01:57 UTC) · keep-work-flowing-cc

## The one thing

**Set the Claude app to open when Windows starts.** Every recent silence began when the computer started or woke and the app did not come back by itself. The longest was two days, Wednesday 21 to Friday 23 Oct, with 20 jobs ready. Turning on "open at login" for the Claude app closes these gaps. Only you can change that setting. Say "done" and the next silence check confirms it. *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)*

## Also waiting (6)

- **Wednesday night to Friday night (21–23 Oct):** "The scheduled lanes went silent for 48.1h (2026-10-21T21:07:01.000Z → 2026-10-23T21:15:17.000Z) and have since resumed, with no pause marker covering that window. If that was a deliberate pause, nothing recorded it; if it was not, this is the outage no lane reported at the time." Was the app closed or the computer off, or was this a pause?
- **Sunday evening to Monday evening (18–19 Oct):** the lanes were silent for 23 hours and no pause was recorded. Was the app closed, or was this a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey. ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided))
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Decided for you

- [Hex cards' sphere pressure goes nowhere](https://linear.app/threadbare/issue/THR-2087/hex-cards-sphere-pressure-goes-nowhere-a-push-onto-a-hex-col-row) — **a hex card now grows the sphere of the place it falls on.** Today a god who casts Seed Life, Bestow Vision or any of 29 hex cards with a sphere pays essence and grows no sphere anywhere. After this, the cast lands on the place that hex holds, at the same strength as a card cast on a town. On an empty hex it lands on the nearest place within two hexes (that reaches 99% of land on the test world). The four energy-priced "flows" cards (Attune Leyline, Amplify Flow, Anchor the Sphere, Channel the Current) now grow energy too. *Veto:* "a hex card should touch every place on its hex", or "a cast in empty wilds should grow nothing". Plan: [A hex card grows the sphere of the place it falls on](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2087-hex-sphere-pressure.md). *— from [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-10-28d.md)* (veto window closes 02:39 UTC tonight, about 40 minutes from now)

Say "veto <title>" to reverse any of these.

## This week's screens

[Contact sheet — the twelve screens of the fixed journey](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-10-27/contact-sheet.jpg) — first week, so there is nothing to compare yet. The opening holds up. Opening a page brings two visible faults, and the mid-game cannot be reached because the seeded world ends after 41 ticks.

## Queue

**Starved: 1 ready, nothing in build.** The only ready job, the hex-card fix ([THR-2087](https://linear.app/threadbare/issue/THR-2087/hex-cards-sphere-pressure-goes-nowhere-a-push-onto-a-hex-col-row)), opens to the builder at 02:39 UTC when its veto window closes. The builder's three short runs since 01:11 UTC are correct: each one found that ticket still on hold and nothing else to claim. The design lane runs next at about 02:17 UTC and can refill the shelf.

- **The paperwork-cut question stays off your list.** [THR-1947](https://linear.app/threadbare/issue/THR-1947) has been parked with no owner since 15 Oct (14 days). No branch, open PR or local worktree holds work for it. Agents can un-park it.
- Warm playtest round 3 cannot start yet. Its gate waits on two round-2 tickets ([THR-1859](https://linear.app/threadbare/issue/THR-1859), [THR-1860](https://linear.app/threadbare/issue/THR-1860)). The playtest lane owns that gate.

## Health

All green. The live site serves the latest commit on main (9c6fc808). CI and the background jobs pass, and no PRs are waiting to merge. All 9 scheduled lanes are on time, with no silence over 6 hours in the last 7 days. The worktree reaper ran at 01:51 UTC. The engine runs at 127 ms/tick, 24% below the 7-day median (168).
