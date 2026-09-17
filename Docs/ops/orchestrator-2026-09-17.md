---
lane: tb-orchestrator
run: 2026-09-17
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-17 (run a, ~01:30Z)

## Needs Christian

**The build queue is empty.** Overnight the executor shipped every ready item (nine tickets closed between 09-16 15:25Z and 09-17 00:19Z), so it now has nothing left to pick up. Everything still waiting needs a design session first, and this lane may not stage more design work until one of the two already staged is picked up.

- If you have time for one design chat, start with [THR-1448 — a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) (say "design THR-1448"). Next is [THR-1479 — the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by). Both are already on the briefing. The only change is that the queue behind them is now empty.
- New since yesterday and **not** your call: [THR-1511 — undertaking follow-ups fizzle when the undertaking finishes somewhere other than a town](https://linear.app/threadbare/issue/THR-1511/undertaking-catalysts-wither-where-the-actor-stands-every-cell). It lists two ways to fix it: offer the follow-up at the town the new road, army or ring belongs to, or let some follow-ups happen anywhere. Both keep the same goal, so an Opus design session can pick one. This is only here so you know it is waiting.

## T1 — unblock sweep

Shelf: **0** in `Ready for Dev`, down from 9 at run 09-16b. The executor closed THR-1510, THR-1498, THR-1504, THR-1499, THR-1505, THR-1506, THR-1507, THR-1508, THR-1509 and THR-1502. Ceiling of 5 available, **0 spent**.

`Todo`: 29 candidates. One arrived since run 09-16b, and every other ticket is unchanged (none updated since 2026-09-13 except the three wayfinder maps, which were last touched 09-11).

- **Declined: THR-1511, wrong destination (→ T2).** It has no native blockers, no comments, and names no plan doc. The description ends on an explicit unresolved fork: *"picking one is a design call"*. Option 1 is a new `PendingEncounterSeed` resolution-location field. Option 2 widens the catalyst families with ungated members. Met blockers do not make it dev-ready, so it goes to T2.
- **Unchanged declines (not re-derived):**
  - Destination declines: THR-1503, THR-1501, THR-1348, THR-1274, THR-1393, THR-790, THR-1381, THR-1218, THR-175, THR-1220.
  - Other declines: THR-870 (direction park), THR-791 (assigned), THR-789 (epic container).
  - `wayfinder:*` issues skipped to T1.5.

**Rule-0:** no process work promoted. This week's closed work is almost all product (UI/engine/content deferrals); the only process item is THR-1470, which is `In Dev`. The headline is **"feature pipeline needs design"**, not a process promotion.

## T1.5 — wayfinder sweep

Three open maps: [Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) and [Physical Conflict](https://linear.app/threadbare/issue/THR-1258). None of their children was updated in the last 11h. AFK frontier: 0. The HITL frontier is unchanged and already on the briefing. Nothing resolved.

## T2 — design authoring

**Triggered and barred.** The non-`Deferral` shelf is 0, below the floor of 2. `In Design` has **2 live, 0 excluded**:
- THR-1479: unassigned, ~4.1d since last update.
- THR-1448: unassigned, ~4.8d since last update.

Both are inside the 7-day window and neither is `Parked`. The bound is 1, so nothing was staged and no state changed. THR-1511 is the next staging candidate once the bound frees. If neither staged item is picked up, THR-1448 leaves the count ~2026-09-19T07:23Z and THR-1479 ~2026-09-19T22:26Z.

## T3 — architecture health

Not due: local time is ~03:30, before the 06:00 sweep hour. Detectors were not run.

**New finding (1):** the executor drained the build shelf to zero while T2 was barred by two staged-but-unpicked design items. The staging bound is now the thing holding the pipeline back, not the supply of agreed work. Nothing was lost yet (the executor idles rather than doing wrong work), so this is below the materiality bar and not filed. It is recorded so the retro can weigh `ORCH_MAX_IN_DESIGN` = 1 against an empty shelf.

## Escalations

None.
