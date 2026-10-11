---
lane: tb-design-lane
run: 2026-10-10d
promoted: 1
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-10 (run d, ~20:15Z → 08:07Z 10-11)

## Needs Christian

Nothing needs you.

## Decided for you

- [The First's chapters end out of sight](https://linear.app/threadbare/issue/THR-1806/on-the-main-map-the-firsts-chapters-end-out-of-sight-the-player) — **a choice you make while the game is paused now stays on screen until it is answered.** Each step of a chapter needs a little world time (a few in-game hours) before it answers. Today, if the clock was paused, the chapter closed and left you on a silent map. Now it stays open and says "The world must turn before this answers." Click **Let the world turn** and time runs just long enough for the answer to appear, then pauses again. Or click **Back to the map** and the clock reads "paused · The Healer's Oath answers when time runs". Time never moves without your click, as you ruled on 27 Sept. Two of three round-3 testers hit this. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-11-thr-1806-chapter-answers-on-screen.md). *To veto, say:* **"a choice should be answered the instant I make it"** or **"just let time run after I choose"**. Building waits until about 10:05 Monday your time.

## Work

- **Unit chosen:** a plan doc. The build shelf held 1 job that is not a deferral (floor 4). The orchestrator staged this ticket for the lane at 19:30Z. Nothing it builds on is a lane decision still inside its veto window.
- **Resumed:** nothing. No `design-lane claim` or `checkpoint` was open.
- **Vetoes:** none in the briefing.
- **Reproduced live** (dev server, `?view=game&seeded&size=medium`, 1920×1080):
  - A chapter opened on a paused clock records "paused" as its return state.
  - Committing a step closes the chapter and leaves a paused map with nothing pending on screen.
  - With time moving, the next step opened after 1 and 3 ticks and the aftermath after 4 ticks, all by themselves. That is 2–4 s at normal speed.
  - The ticket's open question (an aftermath that never opens) did not reproduce once time moved.
- **Course correction while drafting:** the first draft let the clock run by itself after a commit. The rulebook's 2026-09-27 line, *"A god who paused to think stays paused"*, ruled that out, so the run now happens only on the player's click.
- **Plan merged:** [A chapter answers on screen](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-11-thr-1806-chapter-answers-on-screen.md), with its [brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-11-thr-1806-chapter-answers-on-screen-brainstorm.md), via [PR #2323](https://github.com/christianspliid-ui/threadbare/pull/2323) (docs-only; final gate PASS; liveness LIVE).
  - Intent judge: Allow on the fourth run. The first three said Revise, and each fix was folded in: exact player-facing words, string counts, a visible message when an answer is dropped, and proof on The First's own chapter.
  - NFP, pillar and Vision audits all pass.
- **Filed and handed off:** [A chapter step committed on a paused clock stays on screen](https://linear.app/threadbare/issue/THR-1812/a-chapter-step-committed-on-a-paused-clock-stays-on-screen-the-world). It is in the Cold playtest · round 3 milestone, Ready for Dev, with `Claimable from: 2026-10-12T08:05:00Z`. It must not be built alongside the [spend-and-risk](https://linear.app/threadbare/issue/THR-1807) or [no-direction](https://linear.app/threadbare/issue/THR-1808) work once those are planned.
- **Closed:** the design ticket, Done (verified), per its own Done-when.
- **Left for later runs:** two round-3 design tickets ([spend and risk](https://linear.app/threadbare/issue/THR-1807), [no direction after the bond](https://linear.app/threadbare/issue/THR-1808)), plus the open [Dominion map](https://linear.app/threadbare/issue/THR-1758/wayfinder-map-dominion-how-the-gods-power-grows-across-a-run).

## Escalations

- **A held build shipped inside its veto window.** [A ready opening gift waits for a quiet moment](https://linear.app/threadbare/issue/THR-1809/a-ready-opening-gift-waits-for-a-quiet-moment-never-opens-over-a) was handed off with `Claimable from: 2026-10-11T18:35:00Z`. It merged at 2026-10-10 21:08Z ([PR #2313](https://github.com/christianspliid-ui/threadbare/pull/2313)), about 21 h early, and the hold line is no longer in its description. Agent-side process defect for the pickup/retro lanes to trace. Not an ask for Christian; his veto on the gift decision still applies.
- **Worktree lost mid-run** (impediment #1174): this run's first worktree, a sibling of the home tree, was deleted with its branch about 15 minutes in, before anything was written. It was recreated under `.claude/worktrees/`; nothing was lost.
