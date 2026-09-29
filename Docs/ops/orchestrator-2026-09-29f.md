---
lane: tb-orchestrator
run: 2026-09-29f
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-29 (run f, ~13:30Z)

## Needs Christian

Nothing needs you. The ruin-visit slice is now queued: [THR-1664](https://linear.app/threadbare/issue/THR-1664/the-visit-to-the-ruin-a-survey-arranges-a-visit-the-visits-dice-decide). A mortal who surveys a ruin they hold a lead on gets a real visit there, and the visit's dice decide whether they learn where it lies. The design lane cleared the way at 12:57Z. It decided that the "30% of leads reach deciders" target is reported rather than gated ([THR-1675](https://linear.app/threadbare/issue/THR-1675)). That decision is the design lane's to surface for your veto, and a veto would stop the slice at pickup.

## T1 — unblock sweep

- **Promoted THR-1664** (the visit to the ruin, S3; Thematic Pressure & Living World; Engine):
  - Native blocker THR-1663 went Done 06:06Z.
  - THR-1675 (the S2 kill-criterion re-plan) was decided by delegation at 12:57Z, and its blocked-by relation was removed.
  - The plan amendment [PR #2149](https://github.com/christianspliid-ui/threadbare/pull/2149) merged at `cf68929f`. `check:plan-doc-liveness` returns LIVE.
  - No retire verdict stands against it; the latest comment is the 05:41Z block notice, now void.
  - A re-query confirmed Ready for Dev with no assignee.
  - Coordination block posted: opus. The mutex with THR-1676 is conditional, on the encounter content catalog. There is a check-at-claim on `encounterAftermath.ts` and `clueLifecycle.ts`.
- **Declined THR-1675:** it has no build work. The design lane returned it to Todo for an attended session to close. It is not executor work.
- **Declined THR-1683** (new, a Hollow Crown deferral from THR-1670): its body is "What to design" (the per-cast modifier channel and the ally/enemy filter), so it needs design first. That makes it T2 input.
- **Declines unchanged from [run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-29e.md):**
  - THR-1677 through THR-1681 are a chain. It starts at THR-1676, which is now In Dev.
  - THR-1572 is T2 input. The design lane skipped it because it is inside the power-runtime veto window.
  - THR-1672 waits on THR-1572's plan.
  - THR-1658, THR-1660 and THR-1644 need design first.
- **Shelf:** 2 in Ready for Dev after this promotion (THR-1682, 1664), none of them Deferrals. Before the promotion it was 1. THR-1676 is In Dev.
- **Product vs process this week:** all product.

## T1.5 — wayfinder sweep

No open maps. No `wayfinder:map` issue is in Todo.

## T2 — design authoring

**Not triggered, but only just.** The shelf was 1 non-Deferral at scan and 2 after the THR-1664 promotion, which meets the floor of 2. In Design is empty: 0 live, 0 excluded. The next design inputs are:

- THR-1572, the spell generator. The design lane is holding it for the power-runtime veto window, which opens about 2026-09-30T00:52Z.
- THR-1683.

The design lane's own floor is 4, so it is already pulling.

## T3 — architecture health

Already ran today in [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-29c.md), so it is skipped here.

## Escalations

None.
