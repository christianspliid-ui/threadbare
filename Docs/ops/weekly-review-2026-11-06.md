---
lane: tb-weekly-review
run: 2026-11-06
filed: 0
canceled: 0
tweaksShipped: 0
needsChristian: false
---
# Weekly review — 2026-11-06

Window 10-30 → 11-06. Inputs: [weekly-review-2026-10-30](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/weekly-review-2026-10-30.md), [cicd-metrics.tsv](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-metrics.tsv), [cicd-tweaks.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-tweaks.md), [impediments.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md) rows #1237–#1248. Next week's retro window starts at this report's date.

## Needs Christian
Nothing needs you. The warm playtest that was stuck waiting on two of its own old findings is unstuck by [#2739](https://github.com/christianspliid-ui/threadbare/pull/2739), so you don't need to close anything for it.

## Headline numbers
Row 10-30 → 11-06, compared with 10-23 → 10-30:
- Merges/day **9.6** (12.3). 68 ticket PRs opened, 67 merged. Open → merge median 5.9 min. The drop is supply: in the sampled 50 pickup runs, 44 were idle because every ready ticket was inside its veto window.
- Catch-up **38.2 %** (48.8). This is the pipelined pre-PR sync merge, not conflicts: DIRTY 0, peak open 2. No hot-spot tally needed.
- Slow > 60 min **3.0 %** (4.7). p90 32.6 min (29.4).
- CI PR median **5.1 min** (4.4), p90 6.9 (7.9). Failures **2.3 %** (8.8).
- Heavy tests red on main **3.1 %** (23.1). The flakes from last week did not repeat; no handoff.
- Pickup lane: 50 runs, 11-05 22:11Z → 11-06 15:44Z. 6 built and shipped (23–52 min each), 44 idle (~1 min), 0 failed. No overnight gap in the sample. No stuck PRs (`check:armed-prs` healthy, 0 open). wip-gate log: 1 deny, 0 fail-soft, `pipelinedBeside` ×18.

## Impediments and drift
12 rows (#1237–#1248), about 3 h lost, two-thirds of it in one row. Drift-scan issues: the four standing ones refreshed ([THR-915](https://linear.app/threadbare/issue/THR-915), [THR-1799](https://linear.app/threadbare/issue/THR-1799), [THR-747](https://linear.app/threadbare/issue/THR-747), [THR-911](https://linear.app/threadbare/issue/THR-911)), all `Idea`, no new red signal. Doctrine versions unchanged (prose@2, encounter-authoring@1, identity-vision@2, cosmology@1, rules-of-play@1, ui-laws@1, architecture@1, coordination-process@1), so no guidance audit.
- **#1239, ~2 h:** a review-gate park on THR-2094 cycled four times, each fix finding a new high. The 3-checkpoint rule ended it (ticket back to Todo with a split). One occurrence; stays a row. Watch for a second.
- **Playwright screenshots land in the home tree, ×3** (#1237, #1243, #1245, ~11 min). The rule already exists ([verification-gates.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/verification-gates.md) says to pass an absolute worktree path); more text would be accretion. Row.
- **#1241, ~15 min:** one more overlap of two pickup runs, no double ship. See Tweaks.
- **#1246** (warm playtest gate circular): fixed by [#2739](https://github.com/christianspliid-ui/threadbare/pull/2739).
- **Handoff, product-side:** the debug bridge has no way to list mortals or starter cards (#1242, #1244, a repeat of #1162), ~14 min this week. Ticket it only if it recurs.
- Rows only: #1238, #1240, #1247, #1248.

Filed: none. Nothing clears the bar.

## Tweaks
Ledger: [cicd-tweaks.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-tweaks.md).
- 10-25 looser gate test timeouts: **kept, closed** (week 2). No timeout rows at all this week.
- 10-25 resume path "recently active = alive": **kept, closed** (week 2, improved). Six off-slot runs in the sample all stood down, and each of the six builds shipped once. Duplicate work fell from four builds (~85 min) to one review cycle (#1241, ~15 min).
- **Shipped: none.** Nothing is moving the wrong way; the throughput drop is supply, not the harness. The open tweak ledger is now empty.

## Queue
- **Ready for Dev 3**, all product, all veto holds in the window: [THR-2187](https://linear.app/threadbare/issue/THR-2187), [THR-2186](https://linear.app/threadbare/issue/THR-2186), [THR-2182](https://linear.app/threadbare/issue/THR-2182). The shelf refilled since last week (0 then).
- In Dev 1: [THR-1947](https://linear.app/threadbare/issue/THR-1947), `Parked`, unassigned, last touched 11-01. Healthy park.
- Todo process tickets 6: THR-2063 to THR-2066 (freeze-compatible removals), [THR-1938](https://linear.app/threadbare/issue/THR-1938) (a real false-fail), [THR-1951](https://linear.app/threadbare/issue/THR-1951) (satisfied upstream by [#2535](https://github.com/christianspliid-ui/threadbare/pull/2535); park, never cancel). **0 canceled.** No orphans.

## Blocking hygiene
- Scheduler: every cron matches the [registry](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/scheduled-tasks-registry.md). The five folded lanes stay disabled.
- Worktrees 757 (664 last week). Not blocking yet. The reaper stays untouched unattended.
