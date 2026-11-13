# Brainstorm companion — Make the purse bite (THR-2201)

Companion to `Docs/plans/2026-11-13-thr-2201-make-the-purse-bite.md`. The design lane wrote it (run
dl-20261113T0747Z). It is agreed work: Christian approved the five-ticket direction "make the middle a game"
in chat on 2026-11-12.

## Vision premises engaged

- **A small supply of divine essence** (Vision `00-north-star.md`, Law 36). This is the premise the playtest
  found broken.
- **One purse for both clocks** (Law 30). Tuning income also slows thread climbing and divine casts. That is
  intended, and P3 guards it.
- **Home ground is cheaper** (Law 37). Rule fix 1 makes the discount mean exactly that.

## Experiment record (seed 42 unless named, `--warm 300`, ticks after season 1 through ~t670, greedy god)

The experiment used a throwaway local patch: environment-switched constants, plus both rule fixes behind
`ESC_HOME=mind,spirit`. It was never committed, and `src/` was reverted after bundling.
Columns: home (Mind) pool at a step as a share of the cap, min / median; full hands affordable; median hand
cost; greedy spend of offered.

| Run | Rule fixes | Price scale | Cap | Base / seat income | Mind at step | Full hand | Hand cost | Spent / offered |
|---|---|---|---|---|---|---|---|---|
| baseline | no | 1 | 50 | 1.0 / 1.0 | 0.87 / 0.99 | 15/15 | 8 | 122 / 122 |
| A | yes | 1 | 50 | 1.0 / 1.0 | 0.87 / 0.98 | 12/12 | 8 | 91 / 91 |
| B | yes | 2 | 50 | 1.0 / 1.0 | 0.47 / 0.84 | 12/12 | 18 | 206 / 206 |
| C | yes | 2 | 30 | 1.0 / 1.0 | 0.60 / 0.92 | 12/12 | 18 | 201 / 201 |
| D | yes | 3 | 35 | 1.0 / 1.0 | 0.32 / 0.58 | 12/12 | 28 | 314 / 314 |
| **E** | yes | 3 | 35 | 0.5 / 0.5 | 0.01 / 0.12 | **5/13 (38%)** | 28 | 283 / 377 |
| E, seed 99 | yes | 3 | 35 | 0.5 / 0.5 | 0.00 / 0.03 | **2/19 (11%)** | 28 | 218 / 487 |
| F | yes | 3 | 35 | 0.3 / 0.3 | 0.00 / 0.09 | 3/10 (30%) | 28 | 192 / 258 |
| G | yes | 2 | 35 | 0.3 / 0.3 | 0.00 / 0.10 | 5/10 (50%) | 18 | 129 / 165 |

**What the table says.** An attended step comes about once every 40–48 ticks. Between two steps the god's
home pools earn far more than a hand costs, so raising prices, or a cap that only trims the bank, never makes a
full hand unaffordable (A–D). Only income moves it (E–G). In E, Mind runs near empty at steps while Spirit
stays near full. Mind is the primary sphere: it pays thread upkeep and is the first payer of sphere-less cards.
That is why P3 (upkeep still paid when the god plays nothing) is part of the predicate. The executor
instruments it before accepting E.

## Options weighed

- **Prices only:** rejected on measurement (A–D).
- **A per-step essence allowance** that empties at each chapter: rejected. It would be a new concept (Law 43),
  and it would cut the link between quiet stretches and spending that Law 30 depends on.
- **Cut the 4% income floor on unbought spheres:** rejected here. After rule fix 2 those pools no longer pay
  for sphere-less cards, and whether off-sphere essence should be a one-shot budget is Christian's open
  question H8 (THR-1745).
- **More things to buy between chapters:** right, but not this ticket. That demand is
  [give both clocks a verb](https://linear.app/threadbare/issue/THR-2202). It will tighten the purse further,
  so this plan leaves the predicate's upper bound (P2) with room.

## Decided under delegation (veto open 12 h)

The two rule fixes, the P1–P4 predicate and the tuning order with starting values. The ticket fixed the target's
shape and the levers. Nothing here changes what the game means.
</content>
</invoke>
