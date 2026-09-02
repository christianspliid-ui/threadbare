---
tags: [brainstorm, process, content, undertakings, factory]
aliases: [Undertaking Factory Brainstorm]
status: complete
created: 2026-09-02
updated: 2026-09-02
---

# The undertaking factory — Brainstorm Companion

> Companion to `Docs/plans/2026-09-02-thr-1300-undertaking-factory.md`. Alternatives considered,
> tensions surfaced, Vision premises invoked. Written alongside the plan in an unattended design
> session (Christian asleep; his standing ask: *"assess the linear board for work that can help
> progress or finish some of our wayfinder maps, then move it through design to ready for dev if
> you can without me being here"*).

## How this started

The Proactive Agent Actions map closed on 2026-08-26 with a six-doc carve-up. Five docs were
designed and executed by 2026-09-02; the sixth — this one — was the only design-session ticket
on the board whose blocker (doc 2's schema) was Done and which nobody had claimed. The board's
Ready-for-Dev shelf held two process tickets and no feature work. A plan doc that turns a
finished substrate into a supply line was the highest-leverage thing an unattended session
could hand to the executor lane.

## What the substrate looks like from the factory's side

Reading the shipped code rather than the earlier docs changed three things about the plan:

- **The Law 56 seam doc 2 designed (`completionChanges`) never shipped.** Doc 5 built the moment
  card's chips from engine writes instead (`momentCardModel.ts`), which is stronger — a chip
  cannot be prose by construction. So the factory's "Law 56 chip backing" gate had to invert:
  the hazard on undertakings is prose claiming a consequence no write carries. The plan's
  write-set rule is that inversion.
- **Three registrations, all by hand, one of them silent.** A template in no ambition
  `strategicProfile` is never generated and never refused (the THR-1348 shape). The compiler
  exists mostly so that registration cannot be forgotten.
- **`bandOverride` sits unused in `resolveStepCore`.** Doc 1 put it there for the debug pin and
  the encounter pin uses a different path; the undertaking pin is its first caller. No new seam.

## Alternatives considered

**A. One factory, two content types — extend `encounter-pipeline` with an undertaking mode.**
Rejected. The stages rhyme but every block differs: no hand, no setting envelope, no aftermath
variants; instead a kind grid, a write set, a board-value band table. Folding them would give
the encounter line's 31 rejection triggers a second meaning and the contract two shapes.
Copied structure, separate skill.

**B. Gate the write-set / prose check as a hard fail from day one.** Rejected. It is a lexicon
match — right most of the time, which THR-1224 fixed as the bar for a warning. It ships at
warn and is promoted on pilot evidence, the way the abstraction detector was demoted (THR-1092).

**C. A bespoke start path for the review lever.** Rejected. A lever that starts an undertaking
the board could never start proves nothing about the game; the THR-1030 pin placed itself at
the *end* of real resolution for the same reason. The lever uses the board's start path and
bypasses only generation gates, each traced.

**D. Let the lever spawn on `@hero` (the ascendant).** Rejected. Undertakings are mortal work;
the ascendant does not run the decision loop. The First is spotlight, bonded and followed by
default, so its moments interrupt without any extra flag.

**E. Compile factory output into the existing pack arrays.** Rejected. Idempotent edits inside
a hand-written array are fragile and make every batch a diff on a file an executor also edits
by hand. A `factory/` pack with its own aggregate is additive (NFP #6); the registry does not
care which array a template came from.

**F. Let the compiler create a kind row on any first template of that kind.** Rejected. The
registry's rule is that a row without a destroy is not a row; a tool that writes rows must
honor it, so the compiler creates a row only when the package is that kind's first destroy.

**G. A new trace category for review starts.** Rejected. Four registration sites per category;
an additive `startedBy` field on the existing start trace is enough for the census to exclude
review starts, which is the only consumer.

**H. Skip the pilot; hand off tooling only.** Rejected. The encounter factory's plan makes the
same point: the tooling is not what proves "same quality every time" — the director's sample
verdict is. And the two empty destroy cells (`sublocation`, `faction`) are the highest-value
content the line can produce first.

## Tensions surfaced

- **Supply vs THR-1388's measurement.** The pilot adds harm-capable templates; THR-1388 needs
  to measure why the existing ones do not complete before anyone retunes. The plan sequences
  the pilot after that measurement (or re-measures) and forbids the factory from touching the
  board's constants — mutex with reason, kill criterion 5.
- **A canon page that points at tooling that does not exist yet.** The carve-up names the page
  as Step 0; the plan lands it with slice 1 so no pointer is dead on arrival.
- **Vacuity, again.** Every stage of the encounter line has a named vacuity trap (`vacuous`
  live verdicts, ratchets that only shrink, gates falsified against fixtures). The undertaking
  line inherits all of them and adds one of its own: a review lever that can pass a proof on a
  path the board never takes. Kill criterion 4 exists for it.
- **Systemic emergence vs. authored moments (`Vision/03-design-tensions.md` §2).** The brief's
  slots are grid cells with a mechanical fix before a premise. That is the "game design first"
  ruling of 2026-08-24 applied to undertakings, and it is what keeps the factory from producing
  costume.

## Vision premises invoked

- `Vision/00-north-star.md` — *"The player who saw one mortal's full arc is having a better time
  than the player who touched fifty"*; *"a story the player can tell in prose"*. The map's own
  north star #2 (a region that has *"visibly changed hands"* with the chronicle naming who) is
  what the gap-weighted brief serves by pointing the first batch at the two rows that still
  cannot be taken back.
- `Vision/02-non-negotiables.md` §2 *"Narrative over mechanical perfection"* — the package
  critic's Half B and the director's ceiling sample; §6 *"Additive over destructive changes"* —
  the `factory/` pack and the additive trace fields.
- `Vision/03-design-tensions.md` §2 *"Systemic emergence vs. authored moments"* — the grid-first
  brief.

## What this session deliberately did not decide

- Whether the ambient tier should ever run undertakings (THR-1348) — the pilot assumes spotlight.
- Whether the motive gate or variety penalty is too tight (THR-1388) — the factory reports supply, it does not retune.
- The exact nouns in the consequence lexicon — the pilot is what tells us which nouns prose reaches for.
