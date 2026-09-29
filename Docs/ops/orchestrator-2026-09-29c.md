---
lane: tb-orchestrator
run: 2026-09-29c
promoted: 1
filed: 0
resolved: 0
newFindings: 1
needsChristian: false
---
# Orchestrator — 2026-09-29 (run c, ~04:30Z)

## Needs Christian

Nothing needs you. A bug you filed overnight is now queued: [THR-1674](https://linear.app/threadbare/issue/THR-1674/a-journeys-goal-follows-the-template-home-on-arrival-the-first-turns). When The First arrives for an encounter that has already gone, they turn round and walk back to the town they just left for another copy of it, then go quiet for 40 or more ticks.

## T1 — unblock sweep

- **Promoted THR-1674** (journey round trip; Thematic Pressure & Living World; Engine, Bug):
  - It is a bug, so it counts as agreed work. It has no native blockers and no prose gate. The filer's block already reads `Blocked by: nothing`.
  - No plan doc is named. The Done-when's artifacts (`scripts/first-encounter-gate.ts` and `journeyKeepsGoal.test.ts`) both exist on `origin/main`.
  - There is no retire verdict in the thread.
  - A re-query confirmed Ready for Dev with no assignee.
  - Coordination block posted: opus. Mutex with THR-1670, because both likely touch `phaseAgentDecision.ts`.
  - **Why now:** THR-1657 merged ([PR #2138](https://github.com/christianspliid-ui/threadbare/pull/2138)). By the ticket's own account, the seed-42 heavy test `journeyKeepsGoal.test.ts` now fails on `main` until this fix lands.
- **Declines unchanged from [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-29b.md):**
  - THR-1667 is blocked by THR-1666 (Ready for Dev).
  - THR-1664 is blocked by THR-1663 (Ready for Dev).
  - THR-1672 waits on THR-1572's plan.
  - THR-1658, THR-1660 and THR-1644 need design first.
  - THR-1572 is T2 input.
- **Shelf:** 6 in Ready for Dev after this promotion, none of them Deferrals. That is under the ceiling of 15. THR-1659 moved to In Dev and has since merged.
- **Product vs process this week:** all product.

## T1.5 — wayfinder sweep

No open maps. No `wayfinder:map` issue is in Todo.

## T2 — design authoring

**Not triggered.** 6 non-Deferral items are in Ready for Dev, which meets the floor of 2.

## T3 — architecture health

**Due and run.** This is the first run after 06:00 local. The detectors ran against `main` at `b5c3ac19`, the THR-1657 merge. It is compared against [09-28 run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-28d.md).

| Detector | Result | vs. 09-28 |
|---|---|---|
| `generate-interface-map:dry` | 8 LEAKED | +1: `congregation-sphere-reaches-faction-page`. It was registered LEAKED-with-ticket for THR-1659, whose PR #2139 merged at `12dae3b2` just after this sweep's base. It is expected to clear on the next regenerate, so it is not a finding |
| `sweep:rank-reach` | **FAIL**: 18 apex holders at t900, **20 of 60 gated templates blocked** | **Flipped from PASS** (13 apex, 0 blocked). See the finding below |
| `check:process` | exit 0: plans index, systems inventory, setting coverage and authoring brief are all up to date. Die-B floors VACUOUS | Unchanged. The Linear-keyed sub-checks need `LINEAR_API_KEY`, which is unset, so they are **not reported clean** |
| `check:canon-staleness` | 33 warnings | −4. It is the same mtime-drift class, with no new stale page class |

**New finding: the rank/reach sweep flipped from PASS to FAIL overnight.**

- **It is a real regression, not noise.** A controlled rerun of the same sweep on yesterday's `main` (`a5c41a3f`, the 09-28 run d base) still gives **PASS**: 13 apex holders at t900, 60 of 60 gated templates reachable.
- **What broke:** four faction families have members at t900, but none of them qualify for their senior or elite work. All 20 blocked templates are `ag.*`, `bf.*`, `cg.*` and `lk.*`, 5 each, for example `ag.elite.dragon_lair`, `cg.senior.defend_gate` and `lk.elite.forbidden_library`. The other eight families are unaffected.
- **The shape moved too:**
  - The evaluation pass covers 158 memberships (yesterday 410).
  - The t900 row reads `playing` (yesterday `twilight`).
  - Memberships decay from 377 at t0 to 29 at t900.
- **New fail-soft errors:** three `[EncounterEventNode] Duplicate node ID: evt_agent_mc_cmdr_1_<tick>_0` errors (ticks 587, 733 and 739). The control run has none. The tick loop logged them and carried on.
- **Suspects, not bisected** (one sweep costs about 25 minutes). About 28 merges landed between the two bases. The ones that touch faction membership or world seeding are:
  - THR-1640 (guild joins, PR #2126)
  - THR-1632 (faith and politics, S1; stamps town guilds `factionType: 'guild'`, PR #2124)
  - THR-1654 (seeded notables, PR #2133)
  - THR-1657 (the past feeds ambitions, PR #2138)
  - THR-1653 (graduation through the attention budget, PR #2112)
- **Cost:** the higher-rank faction jobs for a third of the factions can no longer be reached in a long game. This is a product defect, not process, so it is reported for the executor or the retro to pick up. This lane does not file it.

**Stalled work: 0.** Every Ready for Dev item is two days old or younger, and none has a repeated claim.

**In Design: 0 live, 0 excluded.** The column is empty, so T2 is free to stage when the shelf thins.

**Hand-created In Dev: none.** THR-1659 passed through Ready for Dev (2026-09-28T16:30Z) before its claim.

**Redundancy: not assessed this sweep.** `__DEBUG.validateTraitRefs()` is browser-only, so it was not run.

The weekly test-suite pass is not due (it runs on Mondays).

## Escalations

None.
