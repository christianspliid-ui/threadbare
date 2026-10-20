---
lane: tb-design-lane
run: 2026-10-20b
promoted: 0
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-20 (run b, ~01:35Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Warm brief v2 trigger fired — decide whether round 3 runs v2](https://linear.app/threadbare/issue/THR-1861/warm-brief-v2-trigger-fired-round-2-had-3-coverage-failures-on-v1-03). The next mid-game playtest round tells the returning testers they are curious **"which factions have risen while you were away"**, as agreed after round 2 if it failed again. It did: 0 of 3 testers reached the mid-game. The pass bar stays at 2 of 3. *Veto:* "keep the old brief".
- Same ticket: the round's check for "did they reach the mid-game" now looks for the new Inspector's pages. The faction sheet and the Journey tab it used to look for were deleted on 18 October, so round 3 would have failed even for testers who found everything. *Veto:* none expected; this is the harness's own repair.

## Work

- **Claimed** [THR-1861](https://linear.app/threadbare/issue/THR-1861/warm-brief-v2-trigger-fired-round-2-had-3-coverage-failures-on-v1-03) (`design-lane claim 2026-10-20b`). Why this ticket: no wayfinder map is open, the build shelf is full (28 ready), and every plan-doc ticket in Todo already has its plan merged.
- **Decided** with a full decision record on the ticket.
  - Measured: the old faction / work / ambition markers have 0 hits in `src/`, because `FactionSheet.tsx` and `tabs/JourneyTab.tsx` were deleted in `87abcf22`.
  - The new markers are Inspector row labels, each checked in its resolver to render only when there is content.
- **Shipped the harness change** in [PR #2493](https://github.com/christianspliid-ui/threadbare/pull/2493). It touches only `scripts/cold-playtest/` and the cold-playtest skill line, nothing under `src/`.
  - `npm run gate`: PASS (code track).
  - `npm run gate -- --final`: PASS.
  - Review gate: 2 rounds, 2 marker faults found and both fixed, 0 open.
  - Auto-merge armed.
- **Released** to Todo, unassigned, for a one-click close. This is not a wayfinder ticket, so no lane sets Done (THR-846, the same as THR-1785).

## Escalations

- **Warm round 3 cannot start as the tickets stand.** Warm gate 1 needs every issue in *Warm playtest · round 2* Done or Canceled. Three of its open tickets say they stay open until round 3 confirms them: [the mortal's mid-game](https://linear.app/threadbare/issue/THR-1859), [outcome words that mislead](https://linear.app/threadbare/issue/THR-1860) and [THR-1861](https://linear.app/threadbare/issue/THR-1861). So round 3 waits on them, and they wait on round 3. [Notables and Doom say why](https://linear.app/threadbare/issue/THR-1965) is still in Ready for Dev as well. This belongs to the harness owners (cold-playtest skill gate 1 or the design-finding Done-when shape), not to Christian. Raised here for the brief and the weekly retro; this lane files no process ticket.
