---
lane: tb-design-lane
run: 2026-11-06b
promoted: 0
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-06 (run b, ~05:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

Nobody builds on this before 17:30 UTC on 6 November.

- [The mortal's own mid-game is behind a button nobody presses](https://linear.app/threadbare/issue/THR-1859) — "See the work →" on a work moment now really opens the mortal's sheet on the Journey tab, with "The work" as the first row. Before, it opened the sheet's front page, which read as "Kael's profile again". Build ticket: ["See the work" lands on the work](https://linear.app/threadbare/issue/THR-2186).
- Same ticket — on the sheet's front page, the "Their work" and "What they want most" hovers stop saying "Opens their sheet on the Journey tab" (you are already on the sheet, and nothing opens). They now end *"The Journey tab tells it in full."*
- Same ticket — the work gets no page of its own. If you want a mortal's work to have its own page, that is a new slice.

## Work

- **Claimed** [the mortal's own mid-game](https://linear.app/threadbare/issue/THR-1859) for its warm round-3 recurrence, which had a direction but no build ticket. The shelf holds four tickets (not thin), no design map is open, and the UI-focus candidate [rank words with no scale](https://linear.app/threadbare/issue/THR-2182) is held until 08:40 UTC by yesterday's lane decision. So this was the next agreed UI-led finding.
- **Measured before deciding** (main @ `d964339b`). The link already asks for the Journey tab, but the Inspector has no way to open on a tab, so the request is dropped and the sheet always opens on Overview. The same gap breaks every other "open on tab X" call. So the fix goes in the Inspector, not the moment card. The full trace with file and line refs is on the ticket.
- **Filed** the build ticket ["See the work" lands on the work](https://linear.app/threadbare/issue/THR-2186): Ready for Dev, unassigned, claimable from 17:30 UTC on 6 Nov, with a coordination block. I checked the four shelf plans, and none of them touch the Inspector's tab state.
- **Released** the finding to Todo, unassigned, blocked by the build. Warm round 4 checks the fix.
- **Not done this run:** [Plan which of the mortal's own chapters should give the god a hand](https://linear.app/threadbare/issue/THR-2179) is now unblocked (its build shipped at 00:37 UTC). It is a content plan, so the UI-focus finding went first. It is the next plan-doc candidate.

## Escalations

None.
