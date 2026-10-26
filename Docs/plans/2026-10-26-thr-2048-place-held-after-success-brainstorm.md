> **title:** Brainstorm companion — a place held after success — THR-2048
> **linear_issue:** THR-2048
> **author:** Claude Code (design lane, run 2026-10-26a, unattended)
> **created:** 2026-10-26

# Brainstorm companion — a place held after success

Companion to [the plan](2026-10-26-thr-2048-place-held-after-success.md). The alternatives weighed and why they lost.

## What "the forge is held" could mean

1. **The town's smithy, raised through the building economy.** The forge would be a real town building with upkeep and a trait. Lost because the smithy needs ore within reach and a free slot. Most towns where forge construction fires could not take one, so the scene's forge would usually not exist. It also overrides the town chooser that THR-1923 gave the town.
2. **A Great Work (`spawn_unique_location`).** Lost: that kind is Stone's run-unique legendary forge, a top-level location with its own hex. An everyday scene must not mint a wonder.
3. **A forge Place the builder holds (chosen).** It uses the shape the world already has (`sublocation-type.forge` exists, with art), and THR-1966's rule that a builder holds what they raise.

## Who holds it

- **The builder (chosen).** Every line of the scene is the mortal's work. The smiths only watch.
- **The smiths.** They are not bound. Making them a faction would need a cast and a faction-holds-a-place read.
- **The town's ruler.** That is `controls`, which taxes settlements, not Places.

## Caps

Without a cap, each success in the same town mints another forge, and each pays one Means a day forever: a farm. "One per type per place" is the simplest cap that the player can see. When the forge is held by someone else, the scene pays the mortal for the work instead, so success still means something.

## The mill lease

The lease is won *for the fellowship*. Three ways to write it were considered:
- **The mortal holds the mill.** This contradicts the stakes line and every step.
- **A faction holds the mill.** This needs a faction bound in the cast and a reader for a faction's `owns`. Holding income pays actors, and the purse reads `controls` of settlements. That is a new primitive, so it is out of this slice.
- **No holding (chosen for now).** The mortal is paid at the sealing already. The row returns to THR-1954.

## Failure

The research row read *"F holding with repair cost"*. The outcome band is encounter-wide, so a failure can come from the design step, where no forge exists yet. Only the assembly step's failure line implied a standing forge, so that one line changes and failure raises nothing. A costly success (`success_at_cost`) carries the repair cost instead.

## Later ideas (not filed)

- A held forge could raise the chance of smithing scenes at that town (a *likelier when* read).
- A mine claim could feed the town's ore and stone stock when a settlement stands nearby.
