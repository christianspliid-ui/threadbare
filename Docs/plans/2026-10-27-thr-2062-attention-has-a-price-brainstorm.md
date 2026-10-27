> **companion to:** `Docs/plans/2026-10-27-thr-2062-attention-has-a-price.md`
> **author:** Claude Code (design lane, run 2026-10-27a)

# Attention has a price: brainstorm

## The question as filed

"What should attending a moment cost? Either wire a spend (and say what an empty pool does), or retire the pool." Filed from the THR-2058 plan, which hid the gauge because "nothing spends Attention".

## What the measurement changed

The premise was wrong in a useful way. The pool *is* spent, by the thread-pull badge (THR-665), but only through a UI-side write that bypasses `spendAttention`. The gauge sat still for three reasons that all show up in one census:

- The only threaded mortal in a cold game is The First. She is on *Asks you*, so her chapters reach the player with no pull, yet she still raised 15–37 pulls a month at half price.
- Two thirds of all pulls are livelihood pulls (a home's staple goes scarce or surplus). They open nothing, and a dedup bug re-raises them every three ticks while a famine lasts.
- At the April numbers (capacity 6, regen 0.4/tick), half-price pulls refill in one or two ticks.

So "wire a spend" was already done; what was missing was a spend that means something.

## Options considered

1. **Retire the pool.** Clean, and it would end a recurring tester complaint. But it removes the April design's scan-and-choose loop, which only bites once the court holds mortals on *Lives on*. With three such mortals the census shows real scarcity. Retiring is a change of direction, not a fix, so it is not taken here (and would be Christian's call).
2. **Charge for every chapter** (the April table's story-beat 2.0 + 0.5 per phase). This would make the gauge move in a cold game, but it charges for chapters that stop the world on their own. That is a tax, not a choice, and it would drain the god on the core loop with nothing to decide.
3. **Charge only where there is a choice** (taken). A pull on a *Lives on* mortal is an invitation to look in; that is the April design's core and the only real choice. Pause-mode mortals raise no pull, and livelihood news is free.
4. **Retune the curator cap.** The curator's per-tick cap (`ceil(6 × 1.4 / 12)` = 1) looked too loose. The prototype showed chapter pulls never reach it (3–5 a day with three retinue); the overflow was all livelihood. Not needed.

## Tensions

- **Hidden gauge for most of a cold game.** The player meets Attention only once they bind a second mortal and leave them on *Lives on*. That is late. It is honest, though: before then there is nothing to spend it on. The first-use caption carries the explanation at the moment it matters.
- **Seed 7 overflows hard** (99 unaffordable pulls a month with three retinue). The design wants overflow on busy days. If testers read it as punishing, the dial is `ATTENTION_BASE_REGEN`, not a new rule.
- **A mortal who moves into a famine town is not told.** Once-per-crossing is per place. The place's own sheet carries the famine, so nothing is hidden.

## Vision premises

Rulebook §2 *Scan*: "the choice of whose story to watch is yours". North star: the pleasure is witnessing. Both want Attention to price a choice of whom to watch, which is what Decision 1 keeps.
