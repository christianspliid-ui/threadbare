> **title:** `The dormant kinds I — powers and conditions — Brainstorm Companion`
> **linear_issue:** THR-1429
> **author:** `Claude Code`
> **created:** 2026-09-07
> **status:** complete

# The dormant kinds I — powers and conditions — Brainstorm Companion

Companion to `Docs/plans/2026-09-07-thr-1429-dormant-kinds-powers-conditions.md`. The decisions live on the wayfinder map [THR-1396](https://linear.app/threadbare/issue/THR-1396) and the Powers map [THR-1226](https://linear.app/threadbare/issue/THR-1226); this records what was weighed in choosing the *how*.

## Where the plan came from

The map's band order (readers → dormant kinds → people-things → yield, THR-1399) and the readers band shipping the same afternoon (THR-1428). The dormant band is seven cells across four kinds; it was split in two because Powers/Conditions and Networks/Mortal share almost no code and a single executor ticket for all seven would be the size the coordination protocol calls a deferral factory. This half was chosen first because its readers are all live today (suppression, condition decay, effect predicates, the grievance funnel) and because it closes a gap the registry itself flags in a comment.

## Vision premises invoked

- **Mortal sovereignty.** The first cell whose object is a person is a mortal's act on a mortal. The god's only hand is the nudge over a caster's deliberate spells, which THR-1230 ruled and which this plan leaves to the encounter side.
- **Mechanics surface through prose, never numbers.** Known / wielded / sealed are words on the sheet; the slot cap reads as a phrase.
- **Hyperconnectivity** (Christian, 2026-09-07). A curse is not a stat penalty: it is read by encounter eligibility, by the test shapers, by the decay phase, and — new here — by the grievance funnel, so the cursed may come to hate. Four readers for one write.

## Alternatives considered

**The Power shape: a new node type, a `knows_spell`-only edge, or a trait class.** A `spell_template` / `power` node type is what the load-bearing rule forbids without a full design; the edge schema's own comment already picked `action_template` as the target and the plan honours it. A `knows_spell`-only design (no wielded node) would leave `use × Power` unable to enumerate a learned spell without rewriting its shape. The trait-node class is what the resolver already reads for a bestowal and what THR-1231's *wielded = slot-capped attachment* implies. Taken.

**Known vs wielded: one edge or two.** One edge with a `wielded` flag was considered; rejected because the slot-cap pass and every attachment reader key on `has_trait` / `possesses` presence, not on a flag, and a flag would need every one of them taught. Two edges reuse both systems unchanged.

**The sign: a parameter, a random roll, or a relation.** A parameter (the ambition's override says bless or curse) makes the cell two cells and moves the decision off the world. A roll is the thing the pillar says not to do to a person. Reading the relation makes the world's standing state the gate: friends get blessed, enemies get cursed, strangers get nothing. It also reuses the motive gate as-is.

**Curse harm: reuse `property_destroyed` or add `afflicted`.** Reusing would make the grievance prose call a curse "a thing they owned is rubble". A new class costs one union member, one label, one minting row, all guarded by totality. Added.

**Seal: remove the power or suppress it.** Removal is destruction of a biography (known spells are unlimited by THR-1231); suppression is what the effect vocabulary already has (`suppress`, THR-1242 wired it) and what curing can lift. Suppress, via a catalog condition, so the seal is a thing on the sheet rather than a hidden flag.

**A new Sealed entry, or the catalog's Null-Touched.** The first draft authored a Sealed condition; the intent judge found the catalog already carries Null-Touched with exactly the `suppress: spell` mechanism. Reuse it (two edits: the `#curse` tag, the suppress ticks aligned to the constant). A second suppressing condition would be a duplicate mechanism, and the Powers generator later matches whatever the catalog holds.

**The Power node: per bearer, or one definition per spell.** The first draft minted a node per bearer and cited THR-1395 — which in fact ruled the opposite (shared definitions, per-bearer state on the `has_trait` edge; the per-bearer id is deprecated in `traitShape.ts`). Corrected to one definition node per spell, minted at `gameInit`, with both `has_trait` (wielded) and `knows_spell` (known) pointing at it; the `knows_spell` schema row moves its target from `action_template` to `trait`, which is safe because the edge has no writer and no instances. The correction also removed the need to mint spell nodes as action templates.

## Tensions surfaced

- **Two maps touch the Power kind.** The Powers map owns the generator and the cast decision family; this map owns the undertaking that learns. The seam is the spell-template node: this plan creates it, the generator mints through it. Recorded as a mutex in the coordination block, not a dependency — nothing on the Powers map is In Dev.
- **A union change is a wide edit.** `TraitCategory` is dispatched in several places; the registry contract test and the totality of the label and minting tables are the guards, and the executor note names the greps.
- **The caster population is unmeasured.** How many mortals pass the caster predicate on a seeded world is unknown until the census runs; the kill criteria say what to move if it is too few.

## What the census should watch

- Casters completing `learn_spell` per 150 ticks on two seeds, and how many end known-only (cap full).
- Curses fired versus curses refused `no_sign` — the ratio says whether grievance supply or the sign rule is the limit.
- Seals that changed a cast outcome (a refused `power_suppressed`) — zero means the reader is loose.
