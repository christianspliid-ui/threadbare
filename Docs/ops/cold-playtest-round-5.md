---
lane: cold-playtest
round: 5
date: 2026-10-25
status: blocked-auth
briefVersion: 1
startUrl: https://threadbearer.co/
deployedCommit: f87d7afa
usable: 0/3
filed: 0
needsChristian: true
---

# Cold playtest round 5 — not run (tester login expired)

Round 5 is due: every [round 4](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-4.md) ticket is closed, the fixes are live on [threadbearer.co](https://threadbearer.co/) (commit f87d7afa), and seven days have passed. The run stopped at gate 4: the standalone `claude` CLI that the testers use answered `Failed to authenticate: OAuth session expired and could not be refreshed`. No tester started, nothing was filed. The lane retries on its next daily fire. Warm round 3 is not due: [warm round 2](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-2.md) still has open tickets.

## Needs Christian

- The cold tester's login expired. Run `claude` in a terminal, then `/login`. The next daily run then plays round 5 by itself.
