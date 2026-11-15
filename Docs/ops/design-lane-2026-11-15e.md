---
lane: tb-design-lane
run: 2026-11-15e
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-15 (run e, ~23:20Z)

## Needs Christian

Nothing needs you. The open question from run b ([which chapters wait for your cards](https://linear.app/threadbare/issue/THR-2174/the-player-cant-tell-which-chapters-wait-for-their-cards-the-gallows)) is still yours and still in the briefing.

## Decided for you

- [The two clock-answer cards have two names each](https://linear.app/threadbare/issue/THR-2241/the-two-clock-answer-cards-have-two-names-each-the-hand-says-hold-the): the Doom card now shows **Stay the Unmaking** and the rival card shows **Rebuke**, everywhere. Until now your hand called them "Hold the Hour" and "The Turned Hand", while every Doom and rival line told you to use "Stay the Unmaking" and "Rebuke", so a player sent to find the card could not. Say "keep the spell names" to switch the lines over to the old names instead.

## Work

- **Decided and handed off** [The two clock-answer cards have two names each](https://linear.app/threadbare/issue/THR-2241/the-two-clock-answer-cards-have-two-names-each-the-hand-says-hold-the). It is in Ready for Dev now, with no hold.
  - **Why this unit:** the build shelf was empty, with 0 tickets in Ready for Dev. No map is open. Every other open playtest ticket already has a decision and is waiting on a build or a playtest round. This bug was filed at 22:42 UTC by the build run for [The answer to Doom is where Doom is](https://linear.app/threadbare/issue/THR-2240), and it is a UI-words fix (the period focus).
  - **Found while measuring:** the rival card has the same split, and it is already live. [The rival build's own screenshot](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/evidence/thr-2237/place-page-now-line-rebuke-first-1920.png) shows "Rebuke it here" above a card row offering "The Turned Hand". The ticket now covers both cards.
  - **Measured** on main @ `077dcb66`: the hand and the codex show a card's spell name when it has one. The two old spell names appear only on their two template lines, while the plain names appear in about 20 files and in [the word list proposal](https://linear.app/threadbare/issue/THR-2210). Neither card has art tied to its spell name.
  - **The build:** two data fields and one test that keeps the card face and the lines equal. Its Done-when is one 1920×1080 screenshot.
  - **No hold:** this is a bug fix and no plan doc builds on it, so it can be built at once (bug fixes need no approval wait).
  - **Steps:** claimed with the marker `design-lane claim dl-20261115T2320Z`, posted the decision and the coordination block, moved the ticket to Ready for Dev and unassigned it. Both are verified.

## Escalations

None.
