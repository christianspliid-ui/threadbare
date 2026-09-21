# Brainstorm companion — Attention follows ambition (THR-1348)

*Companion to `2026-09-21-thr-1348-attention-follows-ambition.md`. Alternatives, tensions, Vision premises.*

## Alternatives considered

**Reading 2 — notables carry undertakings at reduced cadence.** Declined by the ruling (2026-09-10) for its unmeasured per-tick cost and because it builds things nobody sees. Not re-litigated.

**Reading 3 — report only.** Declined by the ruling; the census already reports and the gap is real.

**Pull at the first board tick instead of at assignment.** Would fire only when a silenced holder would have generated a strategic candidate — more precise, but it needs the board to run over non-spotlight mortals to find out, which is reading 2's cost in disguise. Assignment is once-per-holder and deterministic.

**Flip the global `?? 'spotlight'` default to `'ambient'`.** One line, and it would silently drop worldgen-era fixtures and the seeded protagonists' paths out of the loop; eight readers and a named test pin the default. Stamping the two unstamped mint sites is the additive version.

**A runtime spotlight cap keyed on `AGENT_COUNT_BY_MAP_SIZE`.** The constant is a worldgen seeding range with one consumer; the measured population already exceeds its maximum. Introducing a cap would demote seeded deciders on tick 1. The swap keeps the population flat without a cap.

**Net-additive pulls with a large overflow.** Simplest budget. Rejected because `census:undertakings` divides starts by `meanAutonomousMortals` — a net-additive pull reds the acceptance gate mechanically — and because the tick-cost kill criterion (+25 % at medium) already fired once at +26 %. Overflow of two exists for the case where no demotion candidate exists.

**Demote by lowest `importance`.** Available, but `bumpImportance` no-ops on spotlight mortals, so every spotlight mortal's importance is frozen at promotion — it cannot order them. Witness recency first, importance second.

**Strip hydrated properties on demotion.** Destructive, and a re-promotion would re-roll a personality. Rejected under NFP #6.

**Fix `forge_legend` by adding a `master_smith` producer** (a mastery threshold that mints it). Would make the gate reachable rather than removing it — but the trait's only producer today is a tier-4 cursed artifact by design, and a second producer changes what `master_smith` *means*. Moving it to a boost keeps the meaning and opens the ambition.

## Tensions surfaced

- **Attention as a budget vs. attention as a reward.** The pull says a strategic ambition *earns* attention; the swap says attention is *finite*. Both are the north-star premise; the demotion order (least witnessed first) is where they meet.
- **Who gets demoted is a story decision the player never sees.** Demotion has no chronicle line by the parity rule. The ledger and the trace are where it is legible.
- **The god's card now pulls.** The Kindled Ambition card routes through the same helper, so a god who kindles a strategic ambition in an ambient mortal also pulls them into the spotlight — and displaces someone. That is consistent (attention follows ambition regardless of who lit it) and is recorded here so it is not read as a side effect.
- **The census measured only one of three template pools.** Widening it changes the baseline numbers on the ticket; the Done-when quotes the re-measured baseline (1 of 3) rather than the ticket's.

## Vision premises invoked

- `00-north-star.md` — a mortal has to be witnessed before their crisis lands; the builders become the watched.
- `02-non-negotiables.md` #1 — the god steers nothing here; the pull is the world's response to a mortal's own ambition.
- Failure is plot — a pull refused for budget is reported, not hidden; a demoted mortal keeps their life.
