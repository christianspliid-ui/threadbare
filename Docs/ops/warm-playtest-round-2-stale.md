---
lane: cold-playtest
mode: warm
round: 2
kind: stale-round
date: 2026-11-04
needsChristian: true
---

# Warm playtest — round 2 still open (2026-11-04)

The tb-cold-playtest lane ran today. No round was played.

- **Cold series:** gate 3 (spacing) is shut. [Cold round 6](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-6.md) ran 2026-11-02. Round 7 can run from 2026-11-09, once its tickets have closed.
- **Warm series:** gate 1 is shut. [Warm round 2](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-2.md) started 2026-10-14T07:01Z. Today it passed the 21-day stale mark with two issues open:

| Issue | State | Its build tickets |
|---|---|---|
| [THR-1859 — the mortal's work and ambitions sit behind a button nobody presses](https://linear.app/threadbare/issue/THR-1859) | Todo | [THR-1962](https://linear.app/threadbare/issue/THR-1962) Done 10-16 · [THR-1963](https://linear.app/threadbare/issue/THR-1963) Done 10-17 |
| [THR-1860 — outcome words that mislead](https://linear.app/threadbare/issue/THR-1860) | Todo | [THR-1964](https://linear.app/threadbare/issue/THR-1964) Done 10-21 · [THR-1965](https://linear.app/threadbare/issue/THR-1965) Done 10-21 |

**Why it stalled:** each design ticket says it "stays open until warm round 3 checks" it, and round 3 was waiting for them to close. Neither side could move. All four build tickets shipped by 2026-10-21, so warm round 3 has been blocked about two weeks.

**Fix shipped by the lane:** [PR #2739](https://github.com/christianspliid-ui/threadbare/pull/2739) (auto-merge armed). Gate 1 now counts a design finding as closed once all its build tickets are done. The next round still checks the finding's "Fixed when" line. Logged as impediment #1246 in [the impediment log](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md).

## Needs Christian

- Nothing to do. The returning-player playtest (warm round 3) stalled for two weeks: two design tickets were waiting for round 3, and round 3 was waiting for them to close. Details: [THR-1859](https://linear.app/threadbare/issue/THR-1859), [THR-1860](https://linear.app/threadbare/issue/THR-1860).
- The rule fix is merging now ([PR #2739](https://github.com/christianspliid-ui/threadbare/pull/2739)). Warm round 3 should run on the next daily fire, after the tester-login check.
- The new-player series is on schedule. [Round 6](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-6.md) ran two days ago.
