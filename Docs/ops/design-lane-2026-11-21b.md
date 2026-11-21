---
lane: tb-design-lane
run: 2026-11-21b
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-21 (run b, ~05:58Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The race forecast tells a chapters-only player the Mandate wins when Doom ends the age](https://linear.app/threadbare/issue/THR-2267/the-race-forecast-says-your-mandate-is-fulfilled-first-to-a-chapters): the "how the age ends" forecast now reads each of your Mandate's two spheres on its own.
  - The Mandate lands when the slower sphere fills. A climb that is slowing down is followed as it slows, and one that will stop short of full now reads "Doom comes first".
  - The forecast waits four days, not two, before it changes its mind.
  - A god who plays the whole game may now see "Doom first" for about a week mid-age when their climb stalls, before it turns back. The age still ends in their favour.
  - Veto in chat. The build waits until 17:56Z (18:56 local) for that.

## Work

- **Resumed** this lane's own claim on [the race-forecast fix](https://linear.app/threadbare/issue/THR-2267). Run `dl-20261120-1719` claimed it 12 hours ago and died with no checkpoint, branch or worktree. No vetoes were in the briefing, and no maps are open. The shelf was thin: 2 items in Ready for Dev, both on veto hold.
- **Measured** on main @ `af9c11c1`:
  - The cause is the Mandate's formula. Progress averages two capped sphere shares (`phaseMandate.ts:459`). On the chapters-only arm one sphere overshoots (end shares 1.42 / 2.45 / 0.91) while the other lags (0.83 / 0.88 / 0.60). The total then climbs at half speed and stops, but the straight-line forecast still carries the earlier, faster slope.
  - A fresh census (`census:agency --all --arms none,greedy,full --ticks 900 --snap-every 12`) printed **race predicate NOT MET**. The chapters-only arm named Doom 0/3, and seed 7 turned 6 times.
  - An offline replay of the forecast over those daily readings matched the census's shown state on all but 0–4 of ~70 days per run. Eight models were compared. The chosen one (per sphere, slowing climb, four-day hold) predicts: chapters-only names Doom 3/3, turns 0 / 2 / 0; full game 3 / 3 / 3; hands-off 0. Every clause passes.
- **Outputs:**
  - The decision is recorded on the ticket, with the options weighed and the table.
  - The description holds a six-item build spec, the Done-when (four tests; the census race line MET) and `Claimable from: 2026-11-21T17:56Z`.
  - The ticket is in Ready for Dev, unassigned, with a coordination block (opus; mutex with [the race names a place to tend](https://linear.app/threadbare/issue/THR-2254)).
  - The prototype is the unmerged branch [proto/thr-2267-race-per-sphere](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2267-race-per-sphere/proto/thr-2267): replay script, nine census files, full output.
- **After this:** no agreed design work is left, matching the orchestrator's note. [Which chapters wait for your cards](https://linear.app/threadbare/issue/THR-2174) is your open question and was left alone.

## Escalations

None.
