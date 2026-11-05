---
lane: tb-design-lane
run: 2026-11-05e
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-05 (run e, ~17:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

Nobody builds on these before 05:30 UTC on 6 November.

- ["Fated" fails and nothing says why](https://linear.app/threadbare/issue/THR-2171/fated-fails-and-nothing-says-why-the-top-odds-word-reads-as-certain-a): "Fated" keeps its name and its odds. Fate still rolls, and now and then a Fated step still misses. When a step you saw as Fated or Favorable misses, the result now says so once: *"It looked Fated, but fate rolled against it."*
- Same ticket: the odds legend now ends *"Even Fated can miss."* The Fated hover says "nearly sure, never certain" where it used to say "all but cannot fail".
- Same ticket: a chapter won with one failed step now reads *"One step went wrong. The work on Heart failed, and your cards could not save that step."* Before, it ended "could not save it", which read as the whole chapter lost.
- Same ticket: no number is shown, and Fated's colour is not touched. Grey or gold is still your open question.

## Work

- **Claimed** ["Fated" fails and nothing says why](https://linear.app/threadbare/issue/THR-2171/fated-fails-and-nothing-says-why-the-top-odds-word-reads-as-certain-a), a warm round 3 finding that all three testers hit. The build shelf held two tickets, both inside their veto windows. [The UI legibility map](https://linear.app/threadbare/issue/THR-2114) and its four plans are done, and the other open UI-project tickets are your icon picks. So the next focus unit is this finding, whose main work is UI words.
- **Measured before deciding** (main @ `90221547`). Fated means odds above 80%, and every roll is capped at 95%, so a Fated step misses up to one time in five by design. The engine has the roll's odds in hand when it saves each step's record, but it keeps no odds word. That is why "Step 1 broke." could say nothing about the odds. The fix adds one saved field and needs no new system.
- **Filed** [A good-odds step that misses says so](https://linear.app/threadbare/issue/THR-2180/a-good-odds-step-that-misses-says-so-it-looked-fated-but-fate-rolled). It is in Ready for Dev, unassigned and claimable from 05:30 UTC on 6 Nov, with exact words, tests and a coordination block. The review gate applies because it touches the engine. It must not be built at the same time as ["Waits for you" / "Theirs alone"](https://linear.app/threadbare/issue/THR-2178), because both change the ending's first lines.
- **Recorded** the decision on the finding and released it to Todo, unassigned and blocked by the build. It closes when warm round 4 confirms the fix. All writes were verified.

## Escalations

None.
