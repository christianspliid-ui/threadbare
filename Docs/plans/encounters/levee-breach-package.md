# Package critic — The Levee Breach

templateId: encounter.town.levee_breach
packageVerdict: connected
packageLeaves: If the far bank breaks, the town (the mortal's current settlement) carries Blighted Harvest for the season — its fields failed, food short, travellers going round it — and thinks less of the mortal the warden blamed, while a held bank leaves the town thinking better of them; either way the mortal's thread to the god runs stronger or thinner.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND/SCAR `thread` (all five bands) | the thread edge `$ascendant` ↔ `$actor` | `thread` edge, named (`ui.thread` tooltip) | yes: "The thread to {actor}" | anchored |
| BOND `reputation with {location}` (critical success, success, success at cost) | the mortal's standing with this town | `$here` → `location`, linked | yes: `{location}` enriches to the town's name | anchored |
| SCAR `reputation with {location}` (failure, critical failure) | same | `$here` → `location`, linked | yes | anchored |
| SCAR `Blighted Harvest` (failure, critical failure) | the `harvest_blight` condition written on the town | `attachment` (condition template), linked | yes: the noun is the condition's own `name`, and "{location} will go short this winter" names the town; the P3 spine sets up the fields and the harvest | anchored |
| growth: iron reach (fallback, never rendered) | the iron reach | reach, named | yes | anchored (dead but harmless) |

The mill bank, the far bank, the sandbag line, the breach and the flooded field are prose only. None is a chip referent, so nothing needs a fold or a bind. **The warden** is the one named person on every beat, and no chip points at the warden. That is deliberate: the standing that moves is the town's, because the town is the party the warden's charge is made to. It also keeps every persistent write off a bind-only cast key (THR-1165).

**Fixed in this pass.** The success-at-cost band wrote `reputation_with $here +0.06` (step 2 succeeds on every success-at-cost path) but showed only a thread chip. A `BOND · reputation with {location}` chip was added ("Kept the far bank standing — {location} thinks well of {actor} now."). Every chip noun passes the cover-the-title test.

## Half B — what it leaves behind

This encounter leaves three pieces of state that other systems read and the player can see.

- **A place condition.** On a loss, Blighted Harvest sits on the town for 240 ticks. The Location Profile shows it, the movement tax routes travellers around the town, and location-condition gates read it. It is the batch's place-condition anchor.
- **A standing.** The mortal's reputation with the town moves both ways, and settlement standing and interactions read it.
- **A thread change.** It shows in the Threads panel, and it changes how strongly the god can reach this mortal.

One reaction also leaves an intelligence record, "The Levee's Weak Place", which appears in the agent's intelligence panel.

The player sees all of it: the chips name the town, the condition and the thread; the town's profile carries the blight; and the warden's charge, whether withdrawn or made public, is the reason the standing moved.

**Why `connected` and not `thin`.** Only one side of the fork changes the town as a place. The success side leaves the town's opinion and the thread, which are real and read, but no place state (see the systems pass §6; no honest location condition exists for "the levee held"). That asymmetry is acceptable. It is the fiction's own: a flood changes a town, and a flood averted does not.

PACKAGE PASS
