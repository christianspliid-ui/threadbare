---
tags: [brainstorm, engine, decision-board]
aliases: [Decision Board Cutover Brainstorm]
status: complete
created: 2026-09-02
updated: 2026-09-02
---

# The decision-board cutover — Brainstorm Companion

> Companion to `Docs/plans/2026-09-02-thr-1349-decision-board-cutover.md`. Alternatives considered,
> tensions surfaced, Vision premises invoked. Written alongside the plan, in the same single-executor
> session that shipped THR-1299.

## How this started

THR-1349 had been through three executor passes in five days. Each pass shipped something real (the
variety term, the neutral-desire branch, a throughput gate) and each closed by saying the flip still
could not land, for a different reason than the pass before. The third pass's reason — *a live board
starts 36% fewer undertakings and the encounter family loses 44% of its share* — was the first one
that was not a mechanism but a balance judgement, and it sent the ticket to `Todo` for re-scoping.
That is where this design session picked it up, with the queue empty behind it.

## First-pass framing I considered

My first instinct was the one the ticket's title still carries: find the term the board is missing,
add it, re-measure. Reading the three passes killed that — the variety term is in, the desire fork is
settled, and the third pass had already measured that the idle share is real idleness, not busy
agents miscounted. The question that survived was narrower and better: **what is the 892-start
baseline made of?** Nobody had looked, because the census in `'shadow'` reports what the *board*
would prefer, not what contest B actually does. So the very first thing this session did was run
both arms and read the *legacy* verdict column of the comparison trace, which no pass had reported.

## What the measurement said (the load-bearing part)

Under the shipped path, contest B picks an undertaking on 46% (seed 42) and 42% (seed 99) of
spotlight decisions — the substrate plan's own envelope tops out at 35% — and a single mortal holds
up to 8 (seed 42) or 11 (seed 99) concurrent works at tick 150, because nothing but "same template
already running" gates a start. The live board picks undertakings on 21% / 28%, starts *more*
encounters in absolute terms (692 vs 472; 627 vs 389), idles the same or less (525 vs 571; 417 vs
847), and holds 5 / 8 concurrent works at the top. The "contraction" is mostly the removal of a
stacking artefact that contest B's clamp had been producing since the strategic path shipped.

## Alternatives considered

**A. Make undertakings occupy the mortal (busy-gate them).** Would end stacking at a stroke and is
how encounters already work. Rejected twice over: the substrate plan's addendum forbids adding
`strategicState.projects` to `busyAgentIds` "under any circumstances", with a contract test to make
the mistake loud, because an undertaking running beside encounters is what keeps the Three-Beat
encounter loop the player's stage while works happen off it. The plan respects that.

**B. Cap concurrent works per mortal in candidate generation.** Additive, one constant, one
rejection reason — and the right shape. But it changes the same throughput number the cutover is
being judged on, so folding it into the flip would make the flip's consequence unreadable again.
Filed as its own deferral with the measured histogram; the plan sequences it *after* the flip with
its own census run.

**C. Re-size `CENSUS_UNDERTAKING_START_FLOOR` to pass the live arm.** Named by two prior passes as
the trap and it is one: a floor placed to admit the proposal proves nothing. Rejected. What the plan
does instead is retire the aggregate floor (it was sized on a stacking artefact) and replace it with
a per-mortal rate that is derived from what the design says a spotlight mortal's life looks like —
one new work about every two days — rather than from either arm.

**D. Keep everything and never flip.** The honest option if the live world were worse. It is not:
inside the envelope on both seeds, more encounters, no more idling, fewer works per mortal. Keeping
contest B means keeping a comparison the plan describes as "one clamp and one constant are the entire
commensurability story", and the shadow channel has now been measured against for a week.

**E. Fix the two red tests by widening their windows.** `edgeIntegrity`'s own comment forbids the
reflex ("do not raise this number reflexively"). Both are organic-world vacuity guards on rare
families; the plan re-anchors them as constructed assertions that drive the real writers — the
standing rule that a cited organic trace is not a Done-when.

## Tensions surfaced

- **Systemic emergence vs authored moments (#2).** Undertakings are the emergence engine; encounters
  are the curated chapters. Contest B's clamp had quietly tilted the world toward emergence-by-volume
  — hundreds of works, a dozen per mortal — at the expense of chapters. The board's currency restores
  the encounter as the default beat and makes an undertaking something a mortal *chooses over* one.
  This plan leans toward authored moments and says so.
- **Portfolio breadth vs one story (#5).** A mortal carrying eleven concurrent works is the
  dashboard failure in miniature. Fewer, legible works per mortal is the direction; the concurrency
  cap is where that lands, and it is deferred only so the flip has one consequence.
- **Mechanical legibility vs mystery (#4).** Not engaged by this plan; nothing player-facing changes.

## Vision premises this plan leans on

- **Narrative over mechanical perfection.** A gate that protected "892 starts" was protecting a
  number, not a story. This plan's version: a spotlight mortal begins a new work about every two
  days and finishes what they start, which is a life a player can read.
- **The player is a god, not a protagonist.** Untouched — the board decides for mortals, the god
  nudges. The cutover changes how a mortal weighs their own options, never who decides.
- **Additive over destructive.** The only deletion is the one §4 wrote into the plan a week ago,
  in the commit it named. Everything else is a constant or a test.

## Taste profile touchpoints

- **Austere voice / no numbers to the player** — nothing here reaches the player as a number.
- No new soft pattern. One anti-pattern dodged: "size the gate to the arm you want to pass".

## Branches not taken

- Re-deriving the envelope itself. `[0.10, 0.35]` is Christian's-ruled substrate; measured live
  sits inside it on both seeds, so there was no reason to reopen it.
- Deleting `decision_board_comparison` after the flip. It stays: `legacyWinner` becomes the
  encounter scorer's own pick, and the agreement rate turns into a cheap drift signal between the
  encounter scorer and the board — reported, never gated.
- A `--mode` flag on the census. Tempting for exactly the measurement this session did by flipping
  the constant, but a runtime override of a shipped mode constant is a second source of truth for
  what the game does. The probe lives in `.cache`, unshipped, and says so.

## Open questions

- Whether the concurrency cap should be per kind (a builder can run two builds but one expedition)
  rather than flat. Doc 6's kind-row schema is the natural home; the deferral says so.
- Whether `CENSUS_DISTINCT_TEMPLATE_FLOOR` should remain an absolute count at all once the sample
  size it tracks has been shown to move by 2.7× between arms. The plan re-expresses it at a fixed
  start sample; the number is the agent's calibration and is open to veto.

## Brainstorm Status

Complete enough to hand off.

---
*captured 2026-09-02 — design session, Claude Code (single-executor session)*
