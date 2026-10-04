---
lane: tb-design-lane
run: 2026-10-04c
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-04 (run c, ~12:15Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [A five-card hand doesn't fit 1080](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls): **the "Let fate decide" button is always on screen, however many cards you're dealt.** The cards stay at four per row, at the size you approved. When they wrap to a second row, the button, your essence left and the price · odds · setback key sit in a bar pinned to the bottom of the encounter screen. The second row slides under that bar, and you scroll to see the rest of it. [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1732-five-card-hand-fit.md).
  - **Why not make two rows fit, as you asked this morning:** it can't be done with the card you locked. Hands are dealt 4 to 8 cards. Two rows take two-thirds of the screen before the scene text is counted. On scenes with a picture, only three cards fit per row. What actually hurt was the button: it sat below the bottom edge, so after choosing your cards you had nothing to press.
  - *The call to veto:* if you'd rather five cards sit in one row when there is room, say **"five across"**. If you'd rather the hand always sit in a single row, with the screen widening for big hands, say **"one row"**. Either one changes your four-per-row rule, which is yours to change. The pinned button stays under both, because neither helps hands of six or more.

  Say "veto hand bar" to reverse it. It can be built from about 14:40 Monday your time.

## Work

- **Chosen:**
  - The build shelf has 5 jobs that are not deferrals, so a plan doc was not urgent.
  - No wayfinder map is open.
  - This was the one undesigned ticket whose inputs carry no lane decision still inside its veto window. It follows from your approved [layout pass](https://linear.app/threadbare/issue/THR-1724/encounter-screen-christians-2026-10-04-layout-pass-169-card-art-skill).
  - [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1713/recurs-after-fix-the-player-cant-read-what-they-spend-or-risk-round-2) was skipped again: it builds on [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice), which is in its window until ~20:45 today.
  - [A minimised encounter step plays out on its own](https://linear.app/threadbare/issue/THR-1730/a-minimised-encounter-step-plays-out-on-its-own-once-time-runs-should) was skipped: it builds on [The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her), which was still in its window when this run started.
- **Measured on the live site** ([Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge), 1920×1080, after the stakes line merged):
  - The encounter column is 986px tall and its content is 1255px.
  - The commit button sits at 1276–1325px, below the 1080 edge.
  - Five 210px cards in one row would need 1098px; the column's inner width is 1088px.
  - Hands are dealt 4–8 cards (`DEAL_HAND_MIN`/`DEAL_HAND_MAX`).
- **Gates:**
  - The intent judge returned **Allow** with two notes: the fail-soft guard named the wrong place, and the list of files that use the hand was wrong. Both were fixed before commit.
  - The NFP auditor returned **pass-with-notes**, the three-pillar auditor **pass**, and the Vision auditor **pass-with-notes**.
- **Merged:** [the plan doc via PR #2221](https://github.com/christianspliid-ui/threadbare/pull/2221), with its [brainstorm companion](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1732-five-card-hand-fit-brainstorm.md).
- **Handed off:**
  - [A five-card hand doesn't fit 1080](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls) is in Ready for Dev, held until its veto window closes.
  - It can't be built at the same time as [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice), because both edit the hand's commit block.

## Escalations

- None.
