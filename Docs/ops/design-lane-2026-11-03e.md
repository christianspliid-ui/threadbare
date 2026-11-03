---
lane: tb-design-lane
run: 2026-11-03e
promoted: 0
filed: 2
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-03 (run e, ~11:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

From [After the first follower there is no way forward](https://linear.app/threadbare/issue/THR-2138/after-the-first-follower-there-is-no-way-forward-the-gods-hunger-says). Nobody may start building either part before 23:30Z on 3 Nov.

- [The goal says what fills it](https://linear.app/threadbare/issue/THR-2154/the-goal-says-what-fills-it-the-mandate-row-leads-with-the-hungers-own) — the goal still counts what it counts today. The goal row now opens with your hunger's own words ("Build a devoted community of followers bound to your court"). Under them it says what fills the goal and how many mortals you hold: "Filled by what you and the one mortal bound to you raise in Life and Spirit." Your followers' deeds already count toward the goal, but no screen says so. Veto line: "give each hunger its own way to win".
- [The next follower has a path](https://linear.app/threadbare/issue/THR-2155/the-next-follower-has-a-path-a-threads-line-says-how-to-bind-another) — while The First is your only follower, the Threads panel shows a line once: "To bind another, find a mortal on ground you or Kael can see, and play Agent Thread on them." Veto line: "no hint in the Threads panel".
- Same ticket — Read the Threads stops calling strangers your "Dormant court". The list becomes "Untouched lives" and names only people you have seen. "Dormant" already means one of your own followers set aside. Veto line: "keep Dormant court".
- Same ticket — at the bonding pick, one line says: "The two you pass over go their own way. You will not meet them again." That is true today, and a tester went looking for one of them. Veto line: "let the other two stay in the world".

## Work

- Claimed [After the first follower there is no way forward](https://linear.app/threadbare/issue/THR-2138/after-the-first-follower-there-is-no-way-forward-the-gods-hunger-says) (High, cold playtest round 6, no comments before this run). Rule 4 applied: no map is open, the shelf holds 4, and the only open tickets in the UI Visual Overhaul project are your own icon picks. Most of this fix is legibility work, a count, a next-step line and an honest list name, so it fits the UI period focus.
- Measured: `isGodCausedPush` in `src/engine/mandateLedger.ts` already credits a threaded mortal's scenes to the goal. The goal row shows the stage text (`godSheet.ts:452`). The detail says "Raised by your own hand" (`MandateDetail.tsx:173`). "Dormant" is a Court Position in the glossary. The decision record and all the evidence are on the ticket.
- Filed the two build tickets into the *Cold playtest · round 6* milestone, in Todo and unassigned. Each has a coordination block and `Claimable from: 2026-11-03T23:30:00Z` in its description. Both share a mutex with [Legibility 4](https://linear.app/threadbare/issue/THR-2125/plan-doc-legibility-4-the-god-rail-the-ledger-rail-lists-and-the-hover), which edits the same rail.
- Closed the parent ticket under the design-request carve-out (its Done-when is "tickets filed into this milestone"). Verified Done.

## Escalations

None.
