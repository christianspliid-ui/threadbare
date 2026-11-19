> **title:** Brainstorm companion — a well-played age can be won (THR-2245)
> **linear_issue:** THR-2245
> **author:** Claude Code (design lane, run dl-20261118T2318Z)
> **created:** 2026-11-19

# Brainstorm companion — a well-played age can be won

The considered alternatives, tensions and Vision premises behind
[the plan](2026-11-19-thr-2245-a-well-played-age-can-be-won.md). The plan carries the decision; this
file carries why the others lost.

## Tension 1 — "won" against Law 32

The ticket's title says *won*. Law 32 says the Mandate and Doom are two kinds of ending, not a win and a
loss, and the game never ranks the player. The two do not conflict once "won" is read as the ticket's
own Done-when reads it: **which clock ends the age depends on how the god played.** The plan keeps that
reading. It changes no rule and no ending word into a verdict on the player. The Mandate ending already
says "ends in triumph" (`twilight-content.ts:43`); that word was Christian's sweep, not this plan's.
What the plan adds is that the triumph names *what the god did* to earn it, and that a Doom ending
says how near the Mandate came. Both are "say what happened" (Law 32's own instruction), not ranking.

## Tension 2 — who the "full player" is

Options weighed for the full-player arm:

- **The answer arm as it is** (chapters + gifts + Stay + Rebuke). Rejected: it never spends on a place,
  and the place card is the Mandate's own named lever (`mandateFillLine`, THR-2236: "spend in its
  spheres on a bound mortal's chapter, or on a place"). A full player uses both levers the game names.
- **The godloc arm alone** (place cards only). Rejected: no tester plays like that, and it ignores
  the First, which is the game's centre.
- **The answer arm plus godloc place casts in both spheres every tick** ("naive full", run b). Measured
  and rejected: it pours essence into the second sphere long after its target is met (104 to 136
  against 23), which no player reading the fill line would do.
- **The answer arm plus place casts only in a sphere still short of its target** ("careful full") —
  chosen. It is every verb the game offers, cast where the Mandate's own fill line points.

The chapters-only arm is the existing `greedy` arm; no new arm is needed for it.

## Tension 3 — which lever moves the fit

Levers in reach, all existing constants (the ticket's "reuse before adding"):

- `MANDATE_PRIMARY_TARGET_POINTS` / `MANDATE_SECONDARY_TARGET_POINTS` — lowers the bar for every arm,
  including hands-off. Its risk is the hands-off arm finishing too; its floor is the hands-off ledger.
- `MANDATE_DEED_BASE_POINTS` — credits a mortal acting alone. Raising it helps hands-off as much as
  play; rejected as the main lever for exactly that reason (the 2026-11-13 "would change the call"
  line already asks whether it should exist at all).
- `MANDATE_DEED_POINTS_PER_ESSENCE` — credits only essence the god paid. The first run leaned on it.
  Run b ruled it out: once the census credits chapter spend, chapters-only already reaches 0.82 to 0.96
  by t800 and plays *more* chapter cards than the full player, so raising it moves chapters-only first
  and the two arms end the same way.
- Place-card credit weight — it is `entityAggregateWeight`, shared with world sphere aggregation.
  Raising it moves every sphere sum in the world, not only the Mandate. Rejected.

**What was chosen instead, and why it is not a new system.** A god's place cast in a Mandate sphere
credits the Mandate by its cost, through the same `mandateDeedCredits` pipe and band factors as a
chapter deed. It adds one constant and one writer to an existing reader. The reason the constants
cannot do it: every existing constant either moves chapters-only as much as the full player, or moves
the world. Only a credit tied to the place cast moves the full player alone, and it makes the fill
line's "or on a place" true at about the rate its "on a bound mortal's chapter" already is.

## Tension 4 — the purse must bite (Law 30)

If the full player can hold Stay all age, Rebuke every press, play every chapter card and still cast
places freely, the purse does not bite and the fit is too loose. The plan's predicate therefore has a
purse clause: the full arm must be turned away by the purse on a measurable share of its place-cast
attempts. Measured: 86 to 95% refused, and Stay held only 21 to 32 ticks, because place casts drained
the first-sphere purse below Stay's upkeep. Holding Doom back costs Mandate pace already; the fit keeps
it that way. A "Stay-first" arm that reserves its upkeep was considered for the predicate and left as a
census extension: the refusal share already shows the purse biting.

## Out of scope, named so nobody expects it

- A second journey after the Return (reserved for Christian, THR-2204 plan).
- The race on screen (THR-2246) and Doom's last stage (THR-2247): designed in parallel; they read this
  plan's constants for tuning only.
- Changing the god's cast curve (shared by every god card; the 2026-11-16 decision ruled it out).
