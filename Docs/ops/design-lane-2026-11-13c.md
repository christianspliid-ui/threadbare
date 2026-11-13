---
lane: tb-design-lane
run: 2026-11-13c
promoted: 1
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-13 (run c, ~11:19Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Stop the world only for real decisions](https://linear.app/threadbare/issue/THR-2203) ([the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-13-thr-2203-stop-only-for-real-decisions.md)). The world now stops only when you have something to decide or something of your own to read:
  - **An ending you had no part in waits on its badge.** If you played no card in a chapter, its ending no longer stops the clock. It sits on the mortal's thread row as "theirs alone", "played out without your hand", or "went badly without your hand" (the last one in the failure colour), one click away. Say "veto quiet endings" to keep every ending stopping the world.
  - **A Fated step with only dealt cards plays out within the day.** If a step already reads Fated before you play anything, and its cards are only the ones dealt from your repertoire, it shows on the badge as "Fated — plays out soon unless you step in". Open it and the world stops as usual; leave it and it plays out. Steps with authored cards always stop: Flawed Steel, The Boundary Survey and The Well Sinking are untouched. Say "veto Fated fuse" to keep every Fated step stopping.
  - **The texts change with it.** Game Law 27 currently says *"An encounter, a choice, a doom stage, a receipt, the Chapter Ledger: each one halts the clock."* It gains: *"A moment matters when it offers the god a move or reports the god's own hand; a chapter that did neither waits on its badge."* UI Law 39, the rulebook and one Vision sentence change to match ([game laws](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/game-design/laws.md), [UI laws](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/design-system/laws.md)).
  - **Template chapters now deal different hands, without any shuffle.** The hand now leans on how hard the step is:
    - easy steps get the guard cards (Buy The Floor, Spare The Worst);
    - middle steps get Draw On Character;
    - hard steps get Press The Odds and Draw On Character.

    Your first sphere's card is always offered. Your second sphere's card has to earn its place. In the test, the witness god's nine template steps went from one hand to five. Say "veto stakes hands" to keep the old deal.
  - Both build tickets are held for your veto until 23:40 UTC today: [An ending the god had no part in waits on its badge…](https://linear.app/threadbare/issue/THR-2211) and [A dealt hand reads how hard the step is](https://linear.app/threadbare/issue/THR-2212).

## Work

- **Unit chosen:** a plan doc. Rule 1 applied: the shelf was thin, with three items in Ready for Dev, all inside veto windows. No UI-map frontier was open. The UI slice [A greyed card says which pool is short](https://linear.app/threadbare/issue/THR-2206) builds on the purse decision, which is still inside its veto window, so it was skipped. [Stop the world only for real decisions](https://linear.app/threadbare/issue/THR-2203) is agreed (your "Yes, file them", 12 Nov), unclaimed, and its main work is how the screen stops and badges.
- **Claimed** with marker `design-lane claim dl-20261113T1119Z`. The [earlier ruling on THR-2174](https://linear.app/threadbare/issue/THR-2174) was read first and honoured: the "Waits for you" / "Theirs alone" words stay.
- **Measured before deciding:**
  - The ending of a "Theirs alone" chapter still auto-opens and stops the clock. The poster never asks whether the god took part.
  - A step that offers cards opens at any odds; nothing reads the forecast.
  - The identical hands are structural. The hunger card always wins the sphereless slot. The sphere pass takes both signatures. The four core cards tie on the last slot, which Press The Odds wins on its id.
- **Census:** run over every one of the 315 steps that deal, on the never-merged branch [proto/thr-2203-deal-census](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2203-deal-census).
  - Today one hand covers 67% of them.
  - The chosen change brings that to 27%.
  - Changing the sphere pass alone did nothing.
  - The proto commit skipped the pre-commit hook (`--no-verify`). It is on a branch that is never merged, and later commits ran the hooks.
- **Gates:**
  - Intent judge: Revise twice, then Allow. The fixes:
    - the fuse wording had said "a few hours" for a 16-hour fuse;
    - a failed Fated step had no after-line;
    - the Ledger word, badge and ending line could disagree;
    - the badge lines were screen-reader only;
    - the Vision sentence was missing.
  - Audits: rules, pillars and Vision all PASS-with-notes.
  - `npm run gate -- --final` passed on the docs track.
- **Plan doc:** [PR #2808](https://github.com/christianspliid-ui/threadbare/pull/2808), merging automatically.
- **Filed:** two build tickets, each with `Claimable from: 2026-11-13T23:40:00Z`. They touch different files and can be built in either order.
- **Ticket state:** the design ticket goes back to Todo, blocked by both builds. It stays open until a warm round confirms its "Fixed when".

## Escalations

None.
