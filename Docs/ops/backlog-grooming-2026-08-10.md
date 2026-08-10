---
lane: daily-backlog-grooming
run: 2026-08-10
promoted: 0
filed: 0
resolved: 2
newFindings: 2
needsChristian: true
---
# Backlog Grooming — 2026-08-10

## Needs Christian
- **Three verdict sessions are queued on you and nothing downstream moves without them.** [THR-907](https://linear.app/threadbare/issue/THR-907) (prose/firing/UI/game slice verdicts, idle since 08-06), [THR-974](https://linear.app/threadbare/issue/THR-974) (world-graph consequence visibility), [THR-986](https://linear.app/threadbare/issue/THR-986) (demo-ready checkpoint). All three are *your* calls by design, not stalled agent work. **Recommendation:** take THR-907 first — it is the oldest and the other two read as follow-ons to it.
- Nothing else. Your 08-09 Discord ruling on the four civic-seat encounters was applied to the board this run (below); it needed no further input.

## Work in flight
- **[THR-943](https://linear.app/threadbare/issue/THR-943)** (encounter badge reopen state) — claimed 07:03Z today by the hourly lane, commit `a4633d4f` on `claude/wizardly-mendel-65bd65` finds the affordance *tier-dependent, not broken*. Healthy, <1h old, untouched.
- In Dev is now **1**, restored to WIP=1 from 3.

## Technical gates resolved this run
- **THR-875 → Done.** Slot 1 is 40/40 across all eight reaches; PRs #1368/#1369/#1370 all merged, merge commits verified on `origin/main`. It had sat In Dev since 08-09 12:29Z on one unanswered question — may slot 2 move to THR-1062? Granted: that is bookkeeping (which ticket carries 24 templates), not design (what those templates say). Done-when amended, reasoning on the ticket. The closing commits carried no auto-close keyword, hence the manual close.
- **THR-860 → Todo, `Parked` removed, unassigned.** Its stated lift condition was met twice over — THR-883 Done 08-09 08:45Z, and Christian ruled option (b) at 15:11Z. It was holding a WIP slot against a decision already made. Placed in Todo with its seven WS5 sibling batches rather than promoted, since promotion is the orchestrator's T1 call.

## Counts by state
Idea 83 · Todo 30 · In Design 1 · Implementation Planning 0 · Ready for Dev 33 · In Dev 1.

## Problems found and fixed
- **THR-1064 was orphaned** (no project) → Encounter Experience, matching its parent THR-875.
- **PR [#1114](https://github.com/christianspliid-ui/threadbare/pull/1114) is open, `DIRTY`, and superseded** — Christian's (b) ruling means it must be *closed*, not merged, and its branch dropped. Grooming does not close PRs; left on THR-860 as step 1 for the next executor. Do not re-arm auto-merge and do not re-resolve the conflict.
- **Rule-0 minting bar holds on the new cohort.** Sampled 3 of the 5 process tickets filed since the 08-08 amendment (THR-1056, THR-1058, THR-1061) — all three carry the cost/benefit line, a coordination block and a Done-when. No demotions. I did **not** retroactively demote the pre-08-08 process backlog: that would be ~20 moves in one automated pass against tickets written before the rule existed, which is a retro's call, not a grooming run's.
- **Roadmap cross-reference: no gaps, nothing filed.** Every `.planning/ROADMAP.md` Future Work item resolves to a Linear issue — procedural-content Phases 3/4/5 → THR-54/55/56; rival activation → THR-66 (Done); party formation → THR-74 (Done); information economy → THR-724 (Done); chain reactions → THR-68; Codex → THR-52; onboarding → THR-72. Filing speculative duplicates here is the failure mode, so none were created.

## Pipeline status
Ready for Dev holds 33 — no starvation. But the **priority sort inverts the prioritization rule**: the only Medium items are process tickets (THR-1058, THR-1060, THR-1056), while every product deferral in the active Encounter Experience project sits at Low. A lane sorting purely by priority takes process work three runs running, against the ≤1-per-3 budget. This is [THR-871](https://linear.app/threadbare/issue/THR-871)'s exact finding, still sitting in Idea.

**Recommended next pickup: [THR-989](https://linear.app/threadbare/issue/THR-989)** — 13 templates carry aftermath variants with no fork, so every one renders fallback forever. Player-visible, content pillar, a Deferral in an active project, which CLAUDE.md ranks *above* new work by priority. Take a process ticket only if the next two runs have not.
