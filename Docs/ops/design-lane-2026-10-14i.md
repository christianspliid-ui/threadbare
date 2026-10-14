---
lane: tb-design-lane
run: 2026-10-14i
promoted: 0
filed: 1
resolved: 1
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-14 (run i, ~17:37Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Hunger and unrest](https://linear.app/threadbare/issue/THR-1869/hunger-and-unrest-what-scarcity-does-to-mortals-and-what-a-town-on-the) — **a hungry town now boils over instead of shrugging.** Today unrest drains away within a day: the four towns stuck in famine for weeks sit at 0 unrest. Now unrest climbs toward what the town lives through, mostly hunger and sieges, and passes four steps:
  - **Restless:** people pack up and move to a fed town nearby.
  - **Lawless:** theft and granary riots, and the lord's tax income halves.
  - **On the edge:** the town goes over to a better lord next door, and the old lord wants it back.
  - **Rising:** the townsfolk throw off their lord, become rebels the lord will march on, and burn their own finest building.

  Poor towns simmer but do not boil on poverty alone, so the map does not all look the same. In 50-day tests on three worlds, 7–12 towns turned Restless, 0–2 reached the edge, and none rose yet. A hungry town prays to the god whose land it stands on, and that can be a rival; what answering earns your god is decided next, on [the god's stake](https://linear.app/threadbare/issue/THR-1871/the-gods-stake-in-the-mortal-economy-what-a-god-gains-from-a-thriving). [The prototype branch (never merged)](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1869-hunger-unrest), [the test output, seed 42](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1869-hunger-unrest/scripts/proto/hunger-unrest-sketch.seed42.no-impulse.output.txt). *To veto, say:* **"poor towns should riot too"**, **"towns should never change hands without a war"**, or **"a rising should be its own kind of faction"**.

## Work

- **Claimed and decided** [Hunger and unrest](https://linear.app/threadbare/issue/THR-1869/hunger-and-unrest-what-scarcity-does-to-mortals-and-what-a-town-on-the), the next ticket in [the mortal economy map](https://linear.app/threadbare/issue/THR-1863/wayfinder-map-mortal-economy-making-wealth-and-want-drive-what-agents)'s stated order. Both blockers were Done.
  - **Evidence:** an observer sketch over unmodified 50-day worlds on seeds 42, 99 and 7 ([sketch](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1869-hunger-unrest/scripts/proto/hunger-unrest-sketch.ts); output for [seed 99](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1869-hunger-unrest/scripts/proto/hunger-unrest-sketch.seed99.no-impulse.output.txt) and [seed 7](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1869-hunger-unrest/scripts/proto/hunger-unrest-sketch.seed7.no-impulse.output.txt)), plus a code census of unrest, migration, births, prayer, theft and riot.
  - **Decision record:** on the ticket, which is closed Done.
  - **Map updated:** the map's Decisions line, a new *Not yet specified* entry (tax as an unrest input), and inputs posted to [the god's stake](https://linear.app/threadbare/issue/THR-1871/the-gods-stake-in-the-mortal-economy-what-a-god-gains-from-a-thriving) and [what the player sees of the economy](https://linear.app/threadbare/issue/THR-1870/what-the-player-sees-of-the-economy-prosperity-unrest-tolls-and).
  - **Question answered:** *Flee the Ravaged Land*'s hunger trigger, which [undertakings in the economy](https://linear.app/threadbare/issue/THR-1873/undertakings-in-the-economy-what-founding-building-and-trading-should) had handed to this ticket.
- **Filed** [Death-site unrest never stops](https://linear.app/threadbare/issue/THR-1925/death-site-unrest-never-stops-one-death-pins-a-town-at-99-unrest-for) (Bug, Todo). Under the Breach and Reckoning dooms, one death pins a town at 99 unrest for good. On seed 7, three towns spent 91 town-days at 90 or more with no hunger and no siege. It is harmless today only because unrest does nothing, and it must ship before the new unrest steps go live.

## Escalations

None.
