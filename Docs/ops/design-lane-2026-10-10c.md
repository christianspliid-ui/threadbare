---
lane: tb-design-lane
run: 2026-10-10c
promoted: 1
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-10 (run c, ~18:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The opening gifts open on top of whatever the player just clicked](https://linear.app/threadbare/issue/THR-1805/the-opening-gifts-open-on-top-of-whatever-the-player-just-clicked): **a gift from the opening now waits its turn.** It never opens over something you opened yourself (a mortal's profile, the cast drawer, the Chapter Ledger, the Codex), and never within 2 seconds of a click. Until then it waits as a small pill at the top of the screen: "✦ A GIFT WAITS — A Place to Stand · Open ▸". It opens by itself once your screen is clear, or straight away if you click the pill. "Reach Down" still opens at once, and the spacing between gifts does not change. All three round-3 testers hit this; for one it was the closest they came to quitting. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn.md). *To veto, say:* **"gifts should only open when I click them"** or **"gifts should open the moment they're ready"**. Building waits until about 20:35 Sunday your time.

## Work

- **Unit chosen:** a plan doc. The build shelf held 2 jobs that are not deferrals (floor 4). This was the oldest of the four round-3 cold-playtest design tickets. It builds on [the opening gifts wait for the player](https://linear.app/threadbare/issue/THR-1647/the-opening-gifts-wait-for-the-player-spine-beats-1-4-after-the-bond) (shipped), and on no decision of mine still inside its veto window. The Dominion plan docs were skipped because their decisions are all younger than 24 hours.
- **Resumed:** nothing. No `design-lane claim` or `checkpoint` was open.
- **Vetoes:** none in the briefing.
- **Measured** on `1a35e655`:
  - A cast counts as the player's act (`playerCastDispatch.ts:222-223`), and one act opens the gift gate (`ascendantBeat.ts:758-774`).
  - The gift modal then enters with no check of what is open (`GameView.tsx:3312-3314`).
  - The click that casts the spell summons the gift over its own result.
- **Plan merged:** [A gift waits its turn](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn.md), with its [brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-10-thr-1805-gift-waits-its-turn-brainstorm.md), via [PR #2310](https://github.com/christianspliid-ui/threadbare/pull/2310) (docs-only, final gate PASS). The intent judge said Allow; its two small gaps were fixed before the PR. The NFP, pillar and Vision audits all pass.
- **Filed and handed off:** [A ready opening gift waits for a quiet moment](https://linear.app/threadbare/issue/THR-1809/a-ready-opening-gift-waits-for-a-quiet-moment-never-opens-over-a), in the Cold playtest · round 3 milestone, Ready for Dev with `Claimable from: 2026-10-11T18:35:00Z`. It must not be built at the same time as the [chapter-result](https://linear.app/threadbare/issue/THR-1806/on-the-main-map-the-firsts-chapters-end-out-of-sight-the-player) or [no-direction](https://linear.app/threadbare/issue/THR-1808) work once those are planned, because all three change what opens after the bond.
- **Closed:** the design ticket, Done (verified), per its own Done-when.
- **Left for later runs:** three round-3 design tickets ([chapter results out of sight](https://linear.app/threadbare/issue/THR-1806/on-the-main-map-the-firsts-chapters-end-out-of-sight-the-player), [can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1807), [no direction after the bond](https://linear.app/threadbare/issue/THR-1808)), plus three open tickets on the [Dominion map](https://linear.app/threadbare/issue/THR-1758/wayfinder-map-dominion-how-the-gods-power-grows-across-a-run).

## Escalations

None. One process note: the branch was first pushed with the ticket id in its name. It was renamed before the PR opened, so nothing linked or closed early.
