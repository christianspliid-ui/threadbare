---
lane: tb-design-lane
run: 2026-10-28a
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-28 (run a, ~02:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Debt Collection is rarely drawn by a mortal who is owed](https://linear.app/threadbare/issue/THR-2044/debt-collection-is-rarely-drawn-by-a-mortal-who-is-owed-93percent-of): **a loan now brings its lender back to collect.** About two days after a mortal lends coin at the counting house, that lender gets a Debt Collection scene, while the debt still stands. Today almost nobody who collects is owed anything (86–100% of collections found no debt), so loans just lapsed and the lender's coin vanished. In a test run, planted collections found their debt, and the share that finds nothing fell to 36–48%. *Veto:* "a lender shouldn't always come back, only sometimes", or "the collection should come at the end of the loan, not halfway".

## Work

- **Claimed** [Debt Collection is rarely drawn by a mortal who is owed](https://linear.app/threadbare/issue/THR-2044/debt-collection-is-rarely-drawn-by-a-mortal-who-is-owed-93percent-of) (claim marker `design-lane claim 2026-10-28a`). Chosen because the build shelf held 2 ready tickets, both inside veto windows (floor 4). The [Mandate plan doc](https://linear.app/threadbare/issue/THR-2081) is held until 08:29Z, and both warm-playtest tickets ([THR-1859](https://linear.app/threadbare/issue/THR-1859), [THR-1860](https://linear.app/threadbare/issue/THR-1860)) were already decided on 2026-10-16.
- **Prototype** on [`proto/thr-2044-debt-collection-seed`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2044-debt-collection-seed), never merged: three arms (off, delay 12, delay 24) × seeds 42/99/7 × 600 ticks. Delay 24 meets the ticket's predicate on every seed (36% / 48% / 39% no-debt, against 100% / 92% / 86% today), and 71 of 72 seeds fired. Delay 12 misses seed 99 (51%). The proto commit was made with `--no-verify` on that never-merged branch.
- **Plan doc** [`2026-10-28-thr-2044-loan-plants-its-collection.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2044-loan-plants-its-collection.md) via [PR #2642](https://github.com/christianspliid-ui/threadbare/pull/2642): one seed row on The Loan, two constants, a census extension, no engine change. Intent-judge: Allow (two advisories, both applied). Forked audits: NFP PASS-with-notes, Pillar PASS, Vision PASS-with-notes. `npm run gate -- --final`: PASS (docs-only).
- **Handoff** to Ready for Dev with `Claimable from: 2026-10-28T14:48:00Z` (this decision's 12 h veto window).

## Escalations

- **Three spec-complete bugs sit in Idea while the shelf is thin.** Each already has a Done-when and needs no design: [a bond lost when a debt runs out its term](https://linear.app/threadbare/issue/THR-2045), [an army in its liege's pay marching on its liege](https://linear.app/threadbare/issue/THR-2026) and ["A Work Finished" saying every work left something standing](https://linear.app/threadbare/issue/THR-2075). Promotion is the orchestrator's call, not this lane's. This is noted so the next brief can weigh it.
- [Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954) has had an empty list since 2026-10-27 (its last row was split out). It can be closed by whoever owns the Deferral sweep.
