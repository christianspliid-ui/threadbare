---
lane: tb-design-lane
run: 2026-11-05g
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-05 (run g, ~23:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

Nobody builds on these before 11:40 UTC on 6 November.

- [No recap when you come back](https://linear.app/threadbare/issue/THR-2173): a returning god sees the mortal's story first, then the world as it touches them. When the warm-up ends, the "The world moves on" card stays up and becomes **"While you were away"**. It has at most five lines: what Kael finished (*"Kael won Bridge Toll, at a price."*), what Kael is in the middle of now, and which of your places slipped or grew (*"Iron Glade slipped from Held to Touched."*). Build ticket: [While you were away](https://linear.app/threadbare/issue/THR-2184).
- Same ticket: two buttons, **Begin** and **Read it in the Ledger**, which opens the Ledger at Kael's newest chapter. Above them, one quiet line says either *"The world is paused. Press play when you are ready."* or that a decision has waited for you.
- Same ticket: the wait estimate stops sitting on "About 2 minutes left" for a whole minute. Below three minutes it steps every half minute: 2½, 2, 1½, a minute, half a minute.
- Same ticket: the recap does not name the rival god behind a place that slipped. The game cannot look rivals up reliably yet, and [rival gods you can see but not answer](https://linear.app/threadbare/issue/THR-2172) owns that. The recap appears only when a warm playtest arrives. The game has no saved worlds, so nothing in ordinary play is a return after time away yet.

## Work

- **Claimed** [no recap when you come back](https://linear.app/threadbare/issue/THR-2173), a warm round 3 finding all three testers hit. It was the skimmer's quit point. The build shelf was at four, all inside veto windows, and no design map was open. This was the open finding whose main work is UI (the period focus).
- **Measured before deciding** (main @ `7a3da16b`). Every recap line can come from records the game already keeps: the chapter archive and the Aftermath's own ending sentence. The one gap is the god's places. Their day lines live only in the short event buffer (about 100 events), so a 300-tick warm-up loses most of them. The recap diffs the place table before and after instead. The "stuck" estimate rounds up to whole minutes, so anything from 61 to 120 seconds reads "2 minutes".
- **Plan doc:** [While you were away](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-06-thr-2173-while-you-were-away.md), merged by [the plan PR](https://github.com/christianspliid-ui/threadbare/pull/2760). The intent judge said Revise on the first pass because the card never said what to do next or where the band words are explained. Both were fixed with the next-step line and the existing band hovers, and the second pass said Allow. All three auditors passed with notes, and all notes were fixed.
- **Filed** the build ticket [While you were away](https://linear.app/threadbare/issue/THR-2184): Ready for Dev, unassigned, claimable from 11:40 UTC on 6 Nov, built after ["Waits for you" / "Theirs alone"](https://linear.app/threadbare/issue/THR-2178) because both touch the Ledger's dialog host.
- **Released** the finding to Todo, unassigned, blocked by the build. It closes when the build is done, and warm round 4 checks the fix.

## Escalations

None.
