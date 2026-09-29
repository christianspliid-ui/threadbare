---
lane: tb-orchestrator
run: 2026-09-29h
promoted: 2
filed: 0
resolved: 1
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-29 (run h, ~17:30Z)

## Needs Christian

Nothing needs you. Two things are queued:

- **The first expert batch:** [THR-1678](https://linear.app/threadbare/issue/THR-1678/content-above-novice-s4-expert-everyday-encounters-batch-1-6-reaches-1). It adds six everyday encounters hard enough for a skilled mortal in town.
  - Journeyman batch 2 ([PR #2152](https://github.com/christianspliid-ui/threadbare/pull/2152)) passed the plan's kill check. Journeymen now attempt harder things than novices, so expert work can start.
  - Experts still attempt *easier* things than journeymen, and this batch is meant to fix that rung.
  - You will get the usual 2-of-6 sample when it ships.
- **A display bug:** [THR-1685](https://linear.app/threadbare/issue/THR-1685/a-reputation-chip-about-a-person-names-the-town-in-its-tag-on-board). A chip about your standing with a *person* (the inspector, the buyer) shows the *town's* name instead.

## T1 — unblock sweep

- **Promoted THR-1678** (content above novice S4; Thematic Pressure & Living World; Content):
  - Native blocker THR-1677 went Done 2026-09-29T16:56Z via PR #2152.
  - THR-1677's closeout states the kill criterion is not tripped: journeyman 0.174 / 0.182 vs novice 0.115 / 0.111 on seeds 42 / 99.
  - Plan doc `Docs/plans/2026-09-29-thr-1627-content-above-novice.md` is LIVE.
  - No retire verdict stands against it.
  - A re-query confirmed Ready for Dev with no assignee.
  - Coordination block posted: opus.
    - Parallel-safe with THR-1685 and THR-1682.
    - Mutex with THR-1679, because both edit `engagementWindow.invariant.test.ts`.
    - Check-at-claim against THR-1664, whose PR #2151 touches the template catalog and census.
- **Promoted THR-1685** (a bug, so agreed work; UI):
  - Filed into Todo at 16:36Z by THR-1677's closeout. It has no blockers, native or prose, and names no plan doc.
  - A re-query confirmed Ready for Dev with no assignee.
  - Coordination block posted: opus.
    - Parallel-safe with THR-1678 and THR-1682.
    - Mutex scoped to `buildAftermathConsequences.ts`; no open ticket edits it.
    - Browser-verify evidence required.
- **Declined THR-1679 through THR-1681:** the chain now starts at THR-1678, which is Ready for Dev.
- **Declines unchanged from run g:**
  - THR-1675 has no build work. It waits for an attended close.
  - THR-1683 and THR-1572 are T2 input. THR-1572 is held for the power-runtime veto window.
  - THR-1672 waits on THR-1572.
  - THR-1658, THR-1660 and THR-1644 need design first.
- **Shelf:** it was 0 when the run started. THR-1677 shipped and THR-1682 was claimed. It holds 2 after the promotions (THR-1678, 1685), none of them Deferrals. THR-1682 and THR-1664 are In Dev.
- **Product vs process this week:** all product.

## T1.5 — wayfinder sweep

No open maps.

## T2 — design authoring

**Not triggered.** The shelf holds 2 non-Deferral items after the promotions, which meets the floor of 2. In Design has 1 live item and 0 excluded. That item is THR-1684: the lead climb's survey and visit rungs need a re-plan, it is unassigned, and it was last active today. So the staging bound is full in any case.

## T3 — architecture health

Already ran today in run c, so it is skipped here.

## Escalations

None.
