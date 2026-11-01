---
lane: tb-design-lane
run: 2026-11-01b
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-01 (run b, ~05:45Z)

## Needs Christian

Nothing needs you.

## Decided for you

All nine are from [Art-led pass, slice 5 — the dialogs](https://linear.app/threadbare/issue/THR-2101/art-led-pass-slice-5-the-dialogs-chapter-ledger-what-your-act-bought) ([plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-01-art-led-dialogs.md)). The window closes about 17:45 UTC today.

- A dialog about a mortal shows that mortal's face: the Chapter Ledger (each row and the open chapter), a choice, and a beat. Veto line: "no faces in the dialogs".
- What your act bought keeps the act's painting on top and adds the face (or place picture, or faction arms) of whoever it touched, before the sentence that names them. Veto line: "no target picture on the receipt".
- Your court's seats draw faces the same way as everywhere else, so an unknown or unpainted mortal gets the game's designed tile instead of a coloured smear. Veto line: "keep the court's old portraits".
- Your court speaks in sentences: "Moving them costs 12 heart essence." instead of "Cost: 12". A title's strengths and weaknesses show as words ("Sharper in their first reach", "Diminished social grace") instead of "2 bonuses". Veto line: "keep the court's labels".
- The court's two "Coming Soon" rows become quiet empty lines: "No sacred site is bound to your court yet." Veto line: "keep Coming Soon".
- World messages (a doom stage, a failed Mandate) stay as they are. Nothing sends them a picture today, and new art is out of scope. Veto line: "give world messages a picture".
- The warm-start wait shows the current season's carved shape beside the season words, and no face. Veto line: "show The First on the warm start".
- Settings stays plain. Its title gets the cog, and its two emoji (⏱ 📌) become carved shapes. Veto line: "leave settings alone".
- "Divine Court", "The First", "Apex", "Inner Circle", "Outer Reaches" and the beat's heading have no fitting carved shape, so they draw none and join [your icon pick](https://linear.app/threadbare/issue/THR-2104). Veto line: "pick a near icon instead".

## Work

- **Claimed** [Art-led pass, slice 5 — the dialogs](https://linear.app/threadbare/issue/THR-2101/art-led-pass-slice-5-the-dialogs-chapter-ledger-what-your-act-bought) under `design-lane claim 2026-11-01b`. The shelf was thin: 3 non-Deferral items in Ready for Dev, below the floor of 4. Its blocker, slice 1, is Done. No veto in the briefing; no lane claim to resume.
- **Plan doc:** [2026-11-01-art-led-dialogs.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-01-art-led-dialogs.md) (304 lines, under the 400 limit), with its [brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-01-art-led-dialogs-brainstorm.md). Merged by [PR #2673](https://github.com/christianspliid-ui/threadbare/pull/2673). `check:plan-doc-liveness` LIVE. `npm run gate -- --final` PASS (docs-only, after regenerating the plans index).
- **Gates:** the intent judge said Revise first. The player-text table lacked real rendered samples, and three new faces had no row. While fixing that, the lane found that a court title's bonus text is built as "+3.00 to primary_domain", so the bonus chips read words from a new table instead. Second pass: Allow. The NFP, three-pillar and Vision audits all passed with notes, and every note is folded in.
- **Handoff:** Ready for Dev, unassigned, `Claimable from: 2026-11-01T17:45:00Z` in the description. Handoff comment with coordination block (opus; owes the review gate; mutex with slice 4).
- **Left as is:** two of the court's structure-bonus lines keep a decimal ("+0.1 sphere influence bonus"). Rewriting authored data is outside a dressing slice. The plan says so.

## Escalations

None.
