---
lane: tb-design-lane
run: 2026-11-03f
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-03 (run f, ~14:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

From [The chosen path steers by skill, not by story](https://linear.app/threadbare/issue/THR-2144/recurs-after-fix-the-chosen-path-steers-by-skill-not-by-story-the). Nobody may start building it before 02:24Z on 4 Nov.

- [The path pulls only scenes about the same thing](https://linear.app/threadbare/issue/THR-2156/the-path-pulls-only-scenes-about-the-same-thing-each-path-names-two) — the path you pick at the bond still pulls The First toward chapters in its two skills, but now only toward chapters that share the path's theme too. "Torch of the uprising" stops pulling "Enlist in the Civic Guard". Veto line: "the path should pull on skill alone".
- Same ticket — each of the 24 paths names two themes, picked from the game's existing values and read from the path's own picture text. For example, the Torch is about keeping or changing things, and about loyalty or ambition. Veto line: "let me pick the path themes".
- Same ticket — when a chapter that fits the path opens, its first step says so in one line, "Fits the reader of secrets.", the same line God's Will already shows. Veto line: "no fit line on the Stage".
- Same ticket — the honest Reader of secrets taking a night job stays possible. Your 23 Sep ruling says a scene's values name what it is about, not which side it takes. "Shadow in the Night" is a paid job to take back a stolen ledger, which is a secrets scene. The new line says why it is on her road. The mortal's own values are not checked against the scene. Veto line: "an honest mortal should never get a theft".

## Work

- Rule 4 again, outside the UI focus: the shelf holds 5, the [UI legibility map](https://linear.app/threadbare/issue/THR-2114/map-ui-legibility-and-usability-do-the-core-panels-read-the-way-people) is closed and its four plan docs are handed off, the only open UI Visual Overhaul tickets are your own icon picks, and the older warm-playtest UI tickets are already decided and waiting on a playtest. So no UI-focus unit could be worked this run. Claimed [the path ticket](https://linear.app/threadbare/issue/THR-2144/recurs-after-fix-the-chosen-path-steers-by-skill-not-by-story-the), the last open design ticket in cold playtest round 6.
- Measured on main (cceff13d): the pull matches on skill only (`firstPath.ts:188-190`). "Enlist in the Civic Guard" names mercy and courage, so the theme rule drops it for the Torch. A census over the 754 scenes with a skill and values shows each path still pulls 31 to 222 scenes, against 138 to 253 today. The decision record and the numbers are on the ticket.
- Filed [the build ticket](https://linear.app/threadbare/issue/THR-2156/the-path-pulls-only-scenes-about-the-same-thing-each-path-names-two) into *Cold playtest · round 6*, in Todo and unassigned. It carries a coordination block and `Claimable from: 2026-11-04T02:24:00Z`, and shares a mutex with [Legibility 3](https://linear.app/threadbare/issue/THR-2124/plan-doc-legibility-3-the-stage-and-the-dialogs-a-title-you-see-first) because both edit the Stage's opening header.
- Closed the path ticket under the design-request carve-out. Its Done-when asked for tickets filed into the milestone. Verified Done.

## Escalations

None.
