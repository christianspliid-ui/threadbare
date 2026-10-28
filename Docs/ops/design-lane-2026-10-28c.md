---
lane: tb-design-lane
run: 2026-10-28c
promoted: 1
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-28 (run c, ~11:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Energy has no card a god can cast](https://linear.app/threadbare/issue/THR-2086/energy-has-no-card-a-god-can-cast-kindle-wander-and-illuminate-cannot): **energy gods get two cards of their own.** The world can now offer two new energy cards from the start of a run, paid in energy essence:
  - **Stoke the Forges** (3 essence, a town) heats a town's forges. It brings coin, makes the streets louder, and gives two of the town's people a boom-time scene.
  - **Kindle a Spark** (2 essence, a mortal) fans whatever the mortal already wants, hotly and briefly. A mortal who wants nothing either way gets "the spark finds nothing dry to catch".

  Until now Kindle, Wander and Illuminate gods earned energy essence and had nothing to spend it on. *Veto:* "an energy card shouldn't stir unrest", "Kindle a Spark should push mortals somewhere new, not deeper into what they are", or "two small cards isn't enough; give energy something bigger". Plan: [Energy gets cards a god can cast](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2086-energy-cards.md).

## Work

- **Claimed** [Energy has no card a god can cast](https://linear.app/threadbare/issue/THR-2086/energy-has-no-card-a-god-can-cast-kindle-wander-and-illuminate-cannot). The shelf was thin (two non-Deferral items ready, both held in veto windows) and no wayfinder maps were open. This was the one Todo ticket whose next step was design.
- **Measured before designing:** no castable card carries energy; the card check warned "no energy market card at tier 1". Four cards are priced in energy but push no energy. Tagging them would not help, because any card aimed at a hex drops its sphere push (finding 1 below). Inspire, which every god starts with, moves no choice at all (finding 2 below).
- **Plan doc:** [the energy cards plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2086-energy-cards.md) with its [brainstorm](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-28-thr-2086-energy-cards-brainstorm.md), merged through [PR #2646](https://github.com/christianspliid-ui/threadbare/pull/2646).
- **Gates:** the intent judge ruled Revise on run 1 because the player-facing words were not quoted. Those were fixed and run 2 ruled Allow. The design audits came back NFP PASS-with-notes, pillars PASS-with-notes (the missing UI lines were added) and Vision PASS-with-notes. The docs gate is green.
- **Handed off** to Ready for Dev with the coordination block. It is held until 12 hours after this decision, so a veto lands before anything is built.
- **Filed two bugs found on the way:**
  - [Hex cards' sphere pressure goes nowhere](https://linear.app/threadbare/issue/THR-2087/hex-cards-sphere-pressure-goes-nowhere-a-push-onto-a-hex-col-row). Every card aimed at a hex (Seed Life, Bestow Vision and others) grows no sphere, because its push lands on an id that is not in the world graph.
  - [Inspire changes nothing a mortal decides](https://linear.app/threadbare/issue/THR-2088/inspire-changes-nothing-a-mortal-decides-its-card-writes-an-influence). The card writes "Inspired" on the mortal's page with no pull behind it, so their choices stay the same.

## Escalations

None.
