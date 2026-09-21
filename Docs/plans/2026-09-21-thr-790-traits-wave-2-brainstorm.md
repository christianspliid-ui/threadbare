# Brainstorm companion — Traits wave 2 (THR-790)

*Companion to `2026-09-21-thr-790-traits-wave-2.md`. Alternatives, tensions, Vision premises.*

## Alternatives considered

**A new `place` trait subcategory for location traits.** Cleaner taxonomy. Rejected: the six shipped location traits are already `condition`-subcategory with three live readers and a page that filters on `subcategory === 'condition'`; a new subcategory would need every reader taught and the world-object row's discriminator widened. `bearerKind` on the definition gives the carve what it needs without moving the readers.

**Mint `#blood-soaked` from `deathCount`.** The ticket names the trait. Rejected: `deathCount` counts every death — plague, age, the lair — and no battle record exists. Calling a plague a massacre is the mismatch NFP #5 exists to catch. `deathCount` co-conditions `#haunted` instead, where it is the right fiction; the battle record is a deferral.

**Mint on the encounter aftermath path only (today's shape).** Zero new phases. Rejected: it is exactly the half-shipped state — a location trait exists only where an author remembered to plant one, and a town prosperous for a month is no more welcoming than one that is not.

**A single `#haunted` threshold on saturation alone.** Simpler. Rejected: saturation alone is *veil-thin*; *haunted* needs the dead. Two traits with a supersession order tell two stories.

**Pool term as a multiplier (like rarity).** Rejected: an additive term beside `economicContextBonus` composes with it and is bounded by its own table; a multiplier over a score that already carries three multipliers is the vacuity-or-runaway trap.

**Merchant routing and prose consumers in this slice.** Both are named in the ticket. Deferred: routing has no seam (`scoreRoutePairBalance` reads only `resources`), so a trait term there is a new scoring factor, not an extension; prose has a slot (`settlementGenomeResolver`) but is separable. Both are the natural fourth ticket if the census proves the pool term moves.

**Register the trait catalogs as content catalogs in slice 1.** Would let `check:attachment` see them now. Deferred to slice 2 because registration requires seating `#condition` / `#location` and the retrofit-pending list is empty and load-bearing — a seating pass belongs with the draw-path work, not the minting phase.

**Artifact traits as tags only.** Cheapest. Partially adopted: the property words THR-1481 already seated stay tags; only `#storied` (a climbing level) and `#cursed` (state the predicate system must see) earn edges.

## Tensions surfaced

- **Gate theatre vs. reach.** Every definition must ship with a producer *and* a reader in the same slice (THR-800, the 2026-09-12 ruling). That is why the plan has four traits, not the ticket's six-plus vocabulary.
- **The 45-recipe defect.** Adding location traits without the carve doubles a live blast. The carve is the first commit of the PR, with a falsification arm, because "fix it later" is how the 45 got there.
- **One phase more.** The tick loop gains a phase. It is one Location scan with four comparisons; the alternative (hooking each scalar writer) spreads the rule across three files and three phases.
- **Wiki and canon.** A place that earns a word is a rule of play; the rulebook sentence lands with the code.

## Vision premises invoked

- `00-north-star.md` — the world remembers; places that carry what happened to them are the living world the god watches.
- `02-non-negotiables.md` #3 — the page says *Haunted* and what it does in words; the number stays on the trace.
- THR-789's verdict — reactive traits on every object family, always visible on the object's own surface.
