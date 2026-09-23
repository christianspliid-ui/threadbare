---
lane: tb-orchestrator
run: 2026-09-23e
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-23 (run e, ~21:30Z)

## Needs Christian

**One yes/no for the morning: [the odds shown are not the odds rolled](https://linear.app/threadbare/issue/THR-1535/the-odds-shown-are-not-the-odds-rolled-the-unified-road-never-reads-a).** Right now, a mortal's items, conditions and standing change the percentage the player sees. They do not change the actual dice on the main encounter path. So every item bonus is decorative, and the shown odds are wrong by exactly that amount. The fix makes the dice honour them. That shifts the odds on **every** ordinary encounter step at once, and that is why it was filed *held* rather than queued. **Are you OK with that global balance shift landing unattended?** A yes promotes it to the build queue, and the ticket already carries a stop-rule if success rates move by more than 10 points. Nothing else waits on it: the fight plan fixes the same gap for fights on its own.

**Still wanted (no change): a short design session for [sequel scenes that fire on their own](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the)**, staged 19:29Z.

## T1 — unblock sweep

- The shelf is `Ready for Dev` 1: THR-1536 (a killing's grief never reaches the victim's living bonds). It is a bug, unassigned, and its coordination block was posted 21:01Z by its filer. THR-1534 merged to Done at 21:29Z. `In Dev` has 1: THR-1529.
- **THR-1535 declined.** It has no blockers, but the filer's coordination comment (20:36Z) says *"Held in Todo for the morning, not Ready for Dev"*, pending acknowledgement of the global balance shift. That is an explicit hold, so it goes to Needs Christian above. When it is acknowledged, its block is already in place (opus; mutex with every Physical Conflict FB slice because they share `unifiedActionResolution.ts`).
- No other Todo item changed since run d.
- Product vs process this week: the shipped work is almost all product (THR-1534, THR-1525, and the Physical Conflict map decisions). One process item, THR-1529, is in flight.

## T1.5 — wayfinder sweep

THR-1226 and THR-1227 are still open. Their frontier is prototype-only (THR-1232, THR-1236), so the AFK frontier is 0 and no ticket was touched. THR-1258 was closed in run d.

## T2 — design authoring

The tier triggered: 1 non-`Deferral` item is in Ready for Dev, and the floor is 2. **Nothing was staged.** `In Design` holds 1 live item (THR-1526, unassigned, staged 2h ago), and the bound is 1.

## T3 — architecture health

The daily sweep already ran in run a. **In Design: 1 live, 0 excluded.**

## Escalations

None. There were no Linear writes this run.
