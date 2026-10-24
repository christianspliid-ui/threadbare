---
lane: tb-design-lane
run: 2026-10-24c
promoted: 1
filed: 3
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-24 (run c, ~19:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

All four are inside the [debts plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-24-thr-2023-encounter-debts.md) ([the ticket](https://linear.app/threadbare/issue/THR-2023)). Each one can be vetoed on its own, and a veto undoes only that row.

- **A collected debt is the oldest one owed to the collector.** When a mortal wins Debt Collection, their oldest debt is paid and the debtor is poorer for it. A lost collection writes that debt off. *Veto:* "the collector should pick the biggest or the newest debt".
- **The cathedral's treasury is the dean's own purse.** On a good roll the lenders lose a charge and the chapter keeps its plate. On a middling roll the chapter owes the lenders in tithes instead of plate. On a bad roll the lenders' factor carries the silver away. The coin moves between the dean and the factor, not through a temple faction's purse, because the scene has no way to reach that purse today. *Veto:* "the temple faction's treasury should pay".
- **In The Loan, your mortal is the lender.** A borrower now takes part in the scene and owes your mortal afterwards. Your mortal is out of pocket until they collect the debt at the counting house. *Veto:* "the mortal should only broker the loan".
- **A note from a house that has stopped paying is worthless.** When the debt arbitration fails, the banking-house master owes your mortal the third. When it fails badly, nobody owes anything. *Veto:* "the bad note should still count as a debt".

## Work

- **Why this unit.** No wayfinder map is open. The build shelf holds 10 ready items, so it is not thin. Every Todo plan or decision candidate already carried a lane decision. The money-encounter deferral list ([Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954)) was unblocked today when mortal wealth S3 shipped, and its own coordination block asks for each item to be split out. I split out its four debt rows as [Plan doc: debts in the money encounters](https://linear.app/threadbare/issue/THR-2023) and claimed it (`design-lane claim 2026-10-24c`). The briefing had no lines from you, so there were no vetoes to apply.
- **Measured on main @ 94e9b402:**
  - Before this plan, nothing could end a debt early. Debts ended only when their term ran out or the holder died.
  - Debt Collection paid the collector out of nowhere, and nothing happened when it failed.
  - The Loan had no borrower.
  - The arbitration's note and the toll-gate's toll book existed only in prose.
  - The cathedral loan moved no coin on any band.
- **Plan:**
  - It adds one general way to settle a debt (paid or written off).
  - It gives The Loan a borrower.
  - It writes the note and the toll-book debt.
  - It gives the cathedral loan a coin table for every band.
  - Sheets now say which way a debt runs: "Owes Odile Marrow" and "Is owed by Wenna Tull".
  - Four result chips name the new debts.
  - Favours are untouched. They already have their own ways to end.
- **Gates:**
  - The intent judge returned Revise three times and Allow on the fourth pass. Each finding was fixed in the plan, and all four verdicts are recorded in its tail.
  - The design audit passed: NFP and Vision with notes, the three pillars clean.
  - The docs gate passed, then [PR #2552](https://github.com/christianspliid-ui/threadbare/pull/2552) was opened with auto-merge.
- **Filed:**
  - [Plan doc: debts in the money encounters](https://linear.app/threadbare/issue/THR-2023), handed off to Ready for Dev.
  - [A simple encounter's result cannot name who it touched](https://linear.app/threadbare/issue/THR-2024). This is a deferral: Debt Collection's result line says "the debtor". The debtor's name shows on the collector's sheet instead.
  - [UL-proposal: Debt](https://linear.app/threadbare/issue/THR-2025). It makes debt the third kind of Agreement, alongside favour and mark, with the player words *Owes* and *Is owed by*.
- **One prose change:**
  - Debt Collection's failure used to say the debtor left town. It now says they hid the coin, because a debtor whose debt is written off stays on the map.
  - The stakes line changes to match.

## Escalations

None.
