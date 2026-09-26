---
lane: tb-orchestrator
run: 2026-09-26f
promoted: 3
filed: 0
resolved: 1
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-26 (run f, ~14:30Z)

## Needs Christian

**The dice change has shipped.** [The dice re-fit](https://linear.app/threadbare/issue/THR-1581) merged at 14:21Z in [PR #2073](https://github.com/christianspliid-ui/threadbare/pull/2073). With it, a mortal's skill now counts when they roll, and mortals pick challenges they can win about half the time. Three follow-ups it was holding back are now queued for building:

- [The character sheet and the encounter skill line say the same word for a mortal's skill](https://linear.app/threadbare/issue/THR-1583). Today the sheet shows the top word in every skill for everyone.
- [Finishing a mentorship finally makes the mortal better](https://linear.app/threadbare/issue/THR-1584). Mastery is also made permanent, so mortals never lose skill over time.
- [The duel balance check is gated again on the new dice](https://linear.app/threadbare/issue/THR-1628). This is a test-harness job; no gameplay changes.

Nothing to decide on those.

**One question you kept for yourself is still waiting, unchanged.** [Faith and politics at game start](https://linear.app/threadbare/issue/THR-1596) is the last open question on [the "world that starts alive" map](https://linear.app/threadbare/issue/THR-1589). When you're ready, open a chat and say "work the map".

## T1 — unblock sweep

- **Shelf at scan:** 10 in `Ready for Dev` (5 non-Deferral). That is under the 15 ceiling, so up to 5 promotions were allowed. `In Dev`: THR-1528.
- **Blocker resolved:** THR-1581 went Done at 2026-09-26T14:21Z (PR #2073, merge 580ce6d9). THR-1582 (S4) closed on the same PR.
- **Promoted THR-1583** (forecast window S5, the sheet words). Its blocker is THR-1581, now Done. The plan doc `2026-09-24-thr-1575-forecast-window.md` is LIVE on main. The latest comment is the 09-24 coordination block, with no verdict. Verified: `Ready for Dev`, no assignee. Block posted: mutex THR-1573 (both touch the sheet surfaces).
- **Promoted THR-1584** (mastery permanent + rescale). Its blocker is THR-1581, now Done. The latest comment is the 09-24 coordination block, with no verdict. Verified. Block posted: mutex THR-1580 (`mentorshipOutcomes.ts`), which is still Todo.
- **Promoted THR-1628** (duel calibration re-gate; Deferral, filed 13:32Z). Its blocker is THR-1581, now Done. Its named mutex, THR-1556, is Done. Verified. Block posted: no live mutex.
- **Declined THR-1580** (non-dice capability re-fit). Blocker THR-1582 is now Done, but the ticket's own gate reads *"Not before … S3 and S4 have landed and the gauge is stable."* S3 and S4 landed 9 minutes before this scan, so there is no stability evidence yet. A later run should promote it once the post-merge gauge has run.
- **Not promoted: THR-1627** (the content half of the dice re-fit; journeyman+ content). Its blocker THR-1581 is Done, but this is a design ticket ("the design lane authors the plan"). That makes it design-lane input, not executor work (wrong destination). See T2.
- **Other declines stand as in [run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-26e.md):**
  - THR-1626 waits on THR-1570, which is in `Ready for Dev`.
  - THR-1574 waits on THR-1528, which is `In Dev`.
  - THR-1522 has an unmet census gate.
  - The design tickets are T2 input.
  - THR-1220 is HITL.
  - THR-175, THR-1393 and THR-870 are dormant deferrals.
- **Product vs process this week:** all product.

## T1.5 — wayfinder sweep

- **Map THR-1589:** unchanged, with 9 of 10 children Done.
- **Frontier:** THR-1596. It is reserved for Christian and surfaced above. There are no AFK tickets.

## T2 — design authoring

- **Not triggered:** 5 non-Deferral items at scan, against a floor of 2.
- **In Design: 0 live, 0 excluded.**
- **THR-1627 was not staged.** The shelf is not thin, and its Done-when is a plan-doc ruling, which the design lane's own Todo scan picks up. If it is still in Todo with no design-lane activity by 09-28, the next thin-shelf run should stage it: it is High priority and heads the content chain.

## T3 — architecture health

The daily sweep already ran today (run c) and was not re-run.

**Stalled-work flag from run e is cleared.** THR-1581 reached Done on its third claim, so the loop concern has resolved.

## Escalations

None.
