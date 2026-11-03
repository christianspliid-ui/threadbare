---
lane: tb-design-lane
run: 2026-11-03c
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-03 (run c, ~05:45Z)

## Needs Christian

Nothing needs you.

## Decided for you

All from [Legibility 3 — the Stage and the dialogs](https://linear.app/threadbare/issue/THR-2124/plan-doc-legibility-3-the-stage-and-the-dialogs-a-title-you-see-first). Plan: [Legibility 3 — the Stage and the dialogs](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-03-thr-2124-legibility-stage-and-dialogs.md). Nobody may start building it before 17:42Z on 3 Nov.

- On an encounter, the encounter's name becomes the biggest, brightest words at the top of the screen. Today it is small grey capitals and the dimmest text there. Veto line: "keep the encounter name small".
- The sentence saying what is at stake sits right under it in plain, upright text, not faint italics. Veto line: "keep the stakes line in italics".
- The story text gets bigger (the size of story text elsewhere) and upright instead of italic. Its large first letter grows with it. Veto line: "keep the story text small and italic".
- The old book-style font on the encounter screen and on cards goes. Names and the big first letter use the game's title font, and small labels use the game's plain font. Veto line: "keep the old book font".
- The smallest text on cards, such as the rarity word "Storied", grows from 11 to 16 px, the game's floor. Veto line: "keep the rarity word small".
- The encounter screen stops drawing a dark box inside its own frame. Veto line: "keep the inner box".
- Every window's title looks the same: left edge, one size. That covers Settings, the Divine Court, the Chapter Ledger, Read the Threads and the receipt. The Court's section names, such as "The First", stop being centred gold capitals. Veto line: "keep the Court's gold headings".
- The "A Path Opens" choice says its title once, not twice, and its story is no longer in a box. Veto line: "keep the banner".

Say "veto <title>" to reverse any of these.

## Work

- Claimed [Legibility 3 — the Stage and the dialogs](https://linear.app/threadbare/issue/THR-2124/plan-doc-legibility-3-the-stage-and-the-dialogs-a-title-you-see-first). The shelf was thin: 3 non-Deferral tickets in Ready for Dev, after the builder took [Every card says what it buys](https://linear.app/threadbare/issue/THR-2147). This is the next ticket for the UI-legibility focus period, from the closed map's carve-up. Its blocker, legibility 1, is Done. The decisions it draws on date from 1 Nov, so they are outside the veto window.
- Measured before writing (all in the plan). The encounter title is 16 px ghost-grey uppercase. The `--text-2xs` size token the cards use is not defined anywhere, so the rarity word always falls back to 11 px. The Palatino face is declared in five files. The dialogs draw their titles four different ways.
- Gates. Intent judge: **Revise → Allow**. Its two gaps were six missing rows in the player-text table and two debug levers named wrong; both are fixed. NFP audit PASS-with-notes, three-pillar audit PASS-with-notes, Vision audit PASS. The plan's tail answers every note.
- [Plan-doc PR](https://github.com/christianspliid-ui/threadbare/pull/2725) merged (`60505260`). `check:plan-doc-liveness`: LIVE. The ticket is in Ready for Dev, unassigned, with `Claimable from: 2026-11-03T17:42:00Z` in its description and the coordination block as the latest comment.
- It can't be built at the same time as [The answer comes here](https://linear.app/threadbare/issue/THR-2151) (both edit the encounter screen) or [Every card says what it buys](https://linear.app/threadbare/issue/THR-2147) (both edit the card face). The builder runs these one at a time.

## Escalations

None.
