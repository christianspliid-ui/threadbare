---
lane: daily-backlog-grooming
run: 2026-08-15
promoted: 1
filed: 0
resolved: 1
swept: 4
canceled: 0
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-08-15

## Needs Christian

1. **The home tree has stopped updating and only you can restart it (~5 min).** Autosync has refused to sync for 14+ consecutive hours — it is now 27 commits behind and falling ~2 further behind every hour. Three edited files are in its way, and one of them holds a written-but-never-saved note (impediment row #582) that would be lost if anyone just ran the printed repair blind. Every automated lane is forbidden from touching that folder, so this cannot fix itself. Ticket, with the exact steps: [THR-1119](https://linear.app/threadbare/issue/THR-1119/autosync-has-been-stalled-12-consecutive-hours-on-three-modified). **Recommendation:** run it in an attended session today; the automated half (a watcher so this surfaces in an hour instead of by accident) is now queued for the lane and needs nothing from you.
2. **The work shelf is starved, and only new design unblocks it.** Ready for Dev holds three tickets, none of them feature or content work, and **two of the three cannot be done by the unattended lane at all** — they need a person at a browser. The lane's real claimable inventory is about one ticket. This is a supply problem upstream, not a queue that needs more tidying. The three things gated on your rulings: [THR-907 (slice verdicts — prose, firing, UI, game)](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game), [THR-974 (consequence visibility verdict)](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence), and [THR-1043 (The Encounter Factory, still In Design)](https://linear.app/threadbare/issue/THR-1043/the-encounter-factory-agentic-workflow-for-composition-complete). **Recommendation:** take THR-907 first — it unblocks the most downstream content work.

## Work in flight

- [THR-1108](https://linear.app/threadbare/issue/THR-1108/two-hover-delay-tooltip-timers-repeat-the-thr-1106-shape-setstate) — healthy, updated this morning; PR [#1468](https://github.com/christianspliid-ui/threadbare/pull/1468) open with full gate evidence. Nothing blocked.

## Technical gates resolved this run

- **THR-1102 → Canceled** (obsolete). The executor built it, measured that it feeds **zero** live consumers (0 word-pool tokens across all 683 templates after THR-1101 drained the corpus), and reverted. The ticket's own sequencing clause prescribed exactly this close. Confirmed no open PR carries `Fixes THR-1102` before setting a manual terminal state. In Dev slot released.

## Counts by state

Ready for Dev 3 · In Dev 1 · Todo 12 · In Design 1 · Implementation Planning 0 · Idea 82 · orphans (no project) 0

## Problems found and fixed

- **Prioritization inversion, fixed.** THR-1119 — High, Rule 0, with a quotable 14-hour loss — sat in `Todo` (unclaimable) while the entire Ready-for-Dev shelf was two Low-priority deferrals. Promoted to Ready for Dev with a comment splitting the lane-claimable half (containment + detector) from the attended-only half, so the executor ships the detector instead of bouncing the ticket.
- **Stall independently re-verified**, not taken on the ticket's word: this session's own precheck reported `freshness=behind:27` with the identical three files, and the log added three more `skip:` lines since filing.
- **Flagged, not changed:** [THR-1109](https://linear.app/threadbare/issue/THR-1109/companions-row-owes-its-19201080-pixel-pass-attended-session-thr-1096) is well-formed (Done-when + coordination block) but explicitly attended-only, so it will sit in Ready for Dev until a human session takes it. Not moved — the label rule forbids evicting deferrals from the queue.
- **Flagged:** projects *Attention Tier Model* and *Content Architecture* are status `Now` with zero issues in any active state (all remaining work is `Idea`). Not auto-closed — neither is fully Done, so the rule does not fire. Worth demoting to `Next` at your discretion.
- **Roadmap cross-reference: no gaps.** `.planning/ROADMAP.md` Future Work maps cleanly to Linear (TB-095→THR-74, TB-099→THR-724, Phases 3/4/5→THR-54/55/56, M3 and Codex both projected). Its per-phase prose lags Linear but that is doc drift — explicitly non-qualifying, so logged here rather than ticketed.

## Materiality sweep

Swept 4 in-scope tickets (Ready for Dev / Todo carrying `Infrastructure`/`Improvement` or in Continuous Improvement): THR-1119, THR-1117, THR-1118, THR-1114. **Canceled 0. Consolidated 0.** THR-1119 clears the bar decisively (14h lane stoppage, quotable from its own log). THR-1118 (raw internal keys rendered on a player surface) and THR-1114 (two action templates carrying a `sphereAffinity` that is not a Sphere) are player-facing correctness, out of scope for cancellation. **Doubt recorded:** THR-1117 is below the Rule-0 bar — prevention, no quotable loss — and carries no cost/benefit line, which by the letter of the minting bar invites demotion to Idea. Left standing: it is a concrete Engine correctness fix with a named five-line remedy, not delivery-machinery paperwork, and demoting it would cut an already-starved shelf to two. Flagging for the weekly retro rather than acting unilaterally.

## Pipeline status

The shelf is starved, not bloated — the inverse of the 2026-08-10/08-11 condition, and evidence the process-work throttle worked (35 Ready-for-Dev items then, 3 now). **Recommended next pickup: THR-1119's detector half** — highest priority on the board, unblocked, and it closes the blind spot that let this stall run 12 hours unseen. Then THR-1117. After those two the unattended lane has nothing it can claim, and the fix is upstream supply (see Needs Christian #2).
