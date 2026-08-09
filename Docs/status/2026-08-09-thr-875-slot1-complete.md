# THR-875 — Meeting Batch A slot 1 is complete (40/40)

**2026-08-09** · Content pillar · `src/data/meeting-dilemma-library.ts`

Converted the remaining **twenty** slot-1 axiological dilemmas to formative tests, in one
pass across four reaches — heart (`loyalty_ambition`), eye (`revelation_discretion`), stone
(`preservation_transformation`) and star (`sacrifice_survival`). With the iron, gold, shadow
and veil sets already shipped, **every one of the eight reaches now draws a formative test
from slot 1 on every meeting**: 40 of 40 converted, no legacy choice scene reachable in that
slot for any reach.

Each template carries the shape the previous batches established — a 7-card hand (two free
sphere-less commons leaning opposite poles, five sphered across `mind`/`life`/`spirit`/`time`/
`matter`, one `floor_at_cost` rider), 3 factor lines, all five `bandProse` slots, difficulties
spread 0.35–0.6 rather than parked on the default.

## Three scenarios re-cut for the present-tense rule

- **AX-HEART-04** — "a role that was never meant for a younger child" made `{agent.name}` a
  child at the leader's deathbed. Now a second-born adult and a seat this settlement has never
  given one.
- **AX-EYE-05** — "the person who taught `{agent.name}` to read" dated the debt to childhood.
  The mentor now taught a craft: to read a field, to observe before judging.
- **AX-STAR-03** — the setup hung the possible plague immunity on a *younger sibling* while
  both authored choices are `{agent.name}`'s own act, so the sibling was a hook nothing pulled.
  The immunity is `{agent.name}`'s, which is what makes the choice `{agent.name}`'s to make.

No scenario needed killing — the same result as the three previous batches, so across all
forty the kill count is zero.

## The stone set is inverted against its own pair — filed, not silently fixed

The five stone templates read backwards against `preservation_transformation`. Pole `a` (the
`-` shift) is consistently the *self-changing* option — be taught, admit it, accept a limit —
and pole `b` the *self-preserving* one. AX-STONE-01's own choice text says it outright:
*"Pride preserved is a wall that keeps the world out — and keeps the self intact."* That is
pole `b`, labelled transformation. The axis is coherent as `humility_pride` and inverted by
the rename this file's header records.

Flipping the shift signs would change what the **legacy choice-scene path** writes into
`AxiologicalProfile` for every stone dilemma — live behaviour, and a design call rather than
a content-conversion drive-by. So the five tests are authored **to the shifts**, which is what
actually moves the profile, and each carries a comment saying so. Filed as
[THR-1064](https://linear.app/threadbare/issue/THR-1064/the-stone-sets-five-axiological-templates-are-inverted-against)
with three options and a coordination block; `REACH_VALUE_PAIR.stone` and the `RC-STONE-*`
set need the same audit.

## Two further authored inversions, commented in place

`AX-HEART-02` and `AX-HEART-03` both make pole `b` (ambition) a **refusal** rather than a grab
— refusing to perjure for the faction that fed your family, refusing to fund a friend's
collapse. The axis there is the group's claim on `{agent.name}` against `{agent.name}`'s own,
and neither pole abandons anyone. `AX-STAR-04` inverts the intuition about risk: burning the
bridge is pole `a` (sacrifice — it spends the north's winter) while holding it is pole `b`
(survival — it bets on this settlement's own capacity and is by far the bloodier option).

That brings the running count of pole inversions to **seven of forty**, every one carrying a
comment. The lesson from the previous checkpoint still holds and is worth restating: check
each scenario against its authored `axiologicalShifts` before assuming pole `a` is the
first-named pole's obvious reading.

## What remains on THR-875

**Slot 2 (24 templates) remains blocked** on
[THR-1062](https://linear.app/threadbare/issue/THR-1062), unchanged from the previous two
checkpoints — all 40 `reach_specific` templates leave `targetValuePair` undefined, which the
required `FormativeTest.valuePair` forbids. The standing recommendation is now overdue:
**amend this ticket's Done-when to the 40 slot-1 templates, which are done**, and let
THR-1062 carry slot 2. Otherwise THR-875 stays open on a blocker it does not own.
