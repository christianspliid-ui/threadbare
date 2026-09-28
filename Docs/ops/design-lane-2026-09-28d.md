---
lane: tb-design-lane
run: 2026-09-28d
promoted: 1
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-28 (run d, ~18:15Z)

## Needs Christian

Nothing needs you. No vetoes were waiting in the briefing.

## Decided for you

- [Finish the encounters the player actually meets](https://linear.app/threadbare/issue/THR-1634): **the plan is written, and step one is ready to build.** When a mortal succeeds at a cost, the game shows the plain success line today, because only 8% of what fires has an at-cost line. A crit reads like an ordinary result for the same reason, and the god's hand shows up on only 7% of encounters. The plan finishes the encounters that actually fire, most-fired first. Every outcome gets its own line, every step gets a hand dealt from your god's cards, and the few encounters that already have an ending learn how the scene went. Plan: [finish the encounters the player meets](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-28-thr-1634-finish-the-encounters-the-player-meets.md). Calls made:
  - **The list was re-drawn from today's game, not last week's.** The reach fixes flattened what fires: the ten most common encounters now make up 23% of everything (47% on 25 September). Six of the ten on the old list have dropped to 43rd or lower. Step one is now the everyday ten: bartering, reading old markings, stargazing, tending the weary, trading with travellers, local tales, the flawed-steel forge, pickpocketing, studying the surroundings and assessing holdings. Four of these are among The First's own draws.
  - **What happens to background mortals counts.** You can read any mortal's encounters on their Chapters tab, so their at-cost lines matter too. The First's own draws still come first; they are step two.
  - **No new "fire less often" rule.** The game's existing variety rule already keeps any one encounter under 4% (the top one sits at 3%).
  - **No new endings written from scratch.** An encounter without an ending keeps using its last line as the ending. Writing whole new endings is the Encounter Factory's job, with your 2-of-6 sample.
  - **You are not asked to sample this work.** Finishing existing encounters is the bulk path you left unvetoed on 25 September. Step one's closeout will carry two links to try, for information only.

Say "veto finish the encounters" to reverse this.

## Work

- **Claimed** [finish the encounters the player meets](https://linear.app/threadbare/issue/THR-1634), the next plan left from the [living-world map](https://linear.app/threadbare/issue/THR-1589). Why this ticket:
  - It was blocked until its sibling, [let written encounters land](https://linear.app/threadbare/issue/THR-1633), shipped its first step this morning.
  - Six jobs were ready to build and no map had open decisions.
  - Every input decision was more than a day old.
- **Measured on today's `main`** with two test worlds (seeds 42 and 99): one with The First bonded and the player not clicking (150 ticks), and one unattended (200 ticks):
  - 1,542 encounters fired across 185 different templates. The First fired 45 over 25 templates.
  - A new reader checked each fired template for what it is missing.
- **Found a real defect while designing.** The file that holds most everyday encounters silently drops a declared hand when it builds the game's templates. Nine of step one's ten encounters live there, so a hand written on them would never have reached the screen. Fixing it is step one's first item, with a test on the built encounter.
- **Gates:**
  - The intent judge **allowed** the plan. It re-checked the defect in the code and accepted the re-drawn list. Its one gap: the plan had coined "outcome prose" where the word list already says "afterimage". Fixed before merge.
  - The rules and completeness audits passed. The Vision audit passed with one note, also fixed.
- **Merged** via [PR #2128](https://github.com/christianspliid-ui/threadbare/pull/2128). The plan is live on `main`, and the ticket is Ready for Dev with its coordination block.
- **Filed** step two, [The First's other draws](https://linear.app/threadbare/issue/THR-1666), and step three, [the next ten most-fired](https://linear.app/threadbare/issue/THR-1667). Both are Todo and blocked in order, each with its coordination block. After step three the plan stops and re-measures. A fourth step is filed only if the next ten still carry at least 8% of what fires.

## Escalations

None.
