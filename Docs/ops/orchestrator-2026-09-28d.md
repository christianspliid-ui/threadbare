---
lane: tb-orchestrator
run: 2026-09-28d
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: false
---
# Orchestrator — 2026-09-28 (run d, ~04:30Z)

## Needs Christian

Nothing needs you.

## T1 — unblock sweep

- **No change since [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-28c.md).**
  - THR-1638 went Done at 03:38Z. No ticket names it as a blocker, so nothing was released.
  - THR-1639 was claimed at 04:12Z. This is its first claim.
- **Declines are unchanged from run c:**
  - THR-1640 and THR-1641 wait on THR-1633.
  - THR-1654 waits on THR-1653, and THR-1655 waits on THR-1654.
  - THR-1646, THR-1647 and THR-1648 wait on THR-1605, which is In Design.
  - THR-1658 and THR-1644 need design first.
  - The carve-up and design tickets are T2 input.
- **Shelf:** 3 in Ready for Dev (THR-1653, THR-1656, THR-1657), none of them Deferrals. That is under the ceiling. THR-1639 is In Dev.
- **Product vs process this week:** all product.

## T1.5 — wayfinder sweep

No open maps.

## T2 — design authoring

- **Not triggered:** 3 non-Deferral items are in Ready for Dev, which meets the floor of 2.
- **In Design:** 5 live and 0 excluded. THR-1605 to THR-1609 are assigned to Christian and were active within 7 days.

## T3 — architecture health

**Due and run.** This is the first run after 06:00 local. It is compared against [09-27](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-27.md).

| Detector | Result | vs. 09-27 |
|---|---|---|
| `generate-interface-map:dry` | 7 LEAKED | The same seven rows |
| `sweep:rank-reach` | PASS: 13 apex holders at t900, 0 blocked, 60 gated templates reachable | Unchanged verdict. Wall time was ~36 min (yesterday ~10 min), partly because it shared the machine with the full test run. See the tick-cost finding below |
| `check:process` | exit 0: wiki, systems inventory, setting coverage, plans index and authoring brief are all up to date. Die-B floors VACUOUS | Unchanged. The Linear-keyed sub-checks need `LINEAR_API_KEY`, which is unset, so they are **not reported clean** |
| `check:canon-staleness` | 37 warnings | +2. Both are mtime drift from today's `Docs/plans/INDEX.md` and systemic wiring guide edits. There is no new stale page class |

**New finding 1: engine cost per tick rose ~15% overnight.**
- `measure:tick-cost` (seed 42, small, 200 ticks) was run back to back under the same load:
  - Yesterday's `main` (`64127257`, 09-27 04:25Z): **125 ms/tick** steady. `agent_decision` took 7.7s.
  - Today's `main` (`a5c41a3f`): **142–147 ms/tick**. `agent_decision` took 9.6–9.7s (+26%).
- Absolute figures are inflated by contention, but the two runs are comparable with each other.
- The longer trend is the bigger number. The last row in `Docs/ops/tick-cost-trend.tsv` reads **58–64 ms/tick on 2026-09-13**. That file is untracked in the home tree and nothing has appended to it since, so a ~2× rise over two weeks went unrecorded.
- The overnight merges that touch the decision path or world size are THR-1631 (world with a past), THR-1649 (avatar sight two hexes) and THR-1635/THR-1638 (culture and sphere openings). **Not bisected this run.**
- The loss is not yet above the materiality bar, so this is logged for the weekly retro, not filed. It costs slower sweeps and tests now, and in-game tick speed later if it continues.

**New finding 2: the weekly test pass has two contention-only timeouts.**
- `peopleThingsCells.test.ts` and `conceptTooltipIds.test.ts` timed out while `sweep:rank-reach` ran alongside the suite. Both pass in isolation.
- This is not a defect, but it is the same timeout-under-load shape as yesterday's `fightCalibration` CI flake. The retro can take both together.

**Resolved since yesterday:** the two stranded PRs (#2087 THR-1629, #2088 THR-1570) are gone, and there are 0 open PRs. The only CI reds since then were two in-branch runs on THR-1635, which later merged.

**Stalled work: 0.** THR-1639 has one claim.

**In Design: 5 live, 0 excluded.** THR-1605 to THR-1609 are assigned to Christian with activity on 09-27, so none are stale.

**Hand-created In Dev: none.**

**Redundancy: not assessed this sweep.** `__DEBUG.validateTraitRefs()` is browser-only, so it was not run.

**Weekly test-suite pass (Monday):** 1410 files and 22251 tests. There are 0 new dead-coverage candidates and 4 carried candidates, all unchanged. There are 2 new top-10 slow files: `engagementWindow.invariant` and today's `worldPast-generatedWorld`. Full report: [test-suite-health-2026-09-28](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-28.md).

## Escalations

None.
