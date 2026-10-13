# Brainstorm companion — The world remembers (THR-1813)

Companion to [`2026-10-14-thr-1813-the-world-remembers.md`](2026-10-14-thr-1813-the-world-remembers.md). Design lane, run 2026-10-14a. The grill-me pass was answered against evidence (no person present): Christian's ruling and the decision record on THR-1773, the mock, the THR-1811 plan, and the shipped Dominion, echo, World-Soul and Remembrance code. The direction is Christian's; everything below is the *how*.

## Vision premises engaged

- **A response, not a sequel** (rulebook §11). Each run is a new map; the old god's marks are in it.
- **The god never grows between runs.** Every option that would have carried strength (a bigger start, carried essence, a carried card pool beyond the card echo) is out by ruling.
- **Prose carries mechanics.** Memory is a word; kin or against is a sentence.
- **The choice carries weight.** The opposed monument is shown before the god is chosen.

## Alternatives considered

### How big a monument's mark is
The decision record said a kin monument "starts Held (degradation < 0.3) or Touched (< 0.6)" and an opposed one "Hostile". The band is derived from the place's sphere scores, so the mark is a lift in the echo's spheres. Measured on seeds 42 / 99 / 7:

| Option | For | Against | Verdict |
|---|---|---|---|
| Fixed lift per memory word (e.g. +2 / +1) | Simplest; the world does not depend on the next god | +2 leaves opposed gods Foreign 98–99%; +3 makes kin gods Sovereign 51–71%. It cannot keep both promises | Rejected |
| Fixed large lift (+3 or +4) | Opposed gods read Hostile 52–85% | Kin gods start Sovereign at that place, a lead, not a landmark | Rejected |
| **Lift until the new god reads the decided band, through `dominionOf`** | Keeps both promises exactly (kin Held within +3, opposed Hostile within +6 in 8 of 9 cells); one read, no special case | The world depends on the god chosen in Remembrance — but Remembrance already runs before world creation, and the cosmology is already derived from that god | **Chosen** |
| Store a starting band on the place | Exact | The band is never stored (THR-1748: "No consumer reads the underlying number"); it would fork the one read | Rejected |

### Where a monument stands
The place that best matches the old god's spheres already reads Sovereign for a kin god on all three seeds, so a monument there changes nothing. The host is chosen among places that read Foreign for the new god, ranked by how much the echo's spheres already linger there.

### Whether an opposed monument fades
Neglect relaxes only the spheres the god bought. An opposed monument's lift is in the opposite poles, which the god did not buy, so it never fades on its own. That is the brake the decision record wanted, and the shipped remedy is Shift Dominion, which breaks the opposing pole. Making it fade would need a new decay rule; nothing asks for one.

### How the World-Soul's tilt reaches the new world
`blendFundaments` blends `fundament.sphereWeights`, but the per-tick aggregation overwrites that field every tick and at init. Three carriers:

| Option | Verdict |
|---|---|
| Write the blended weights into `worldSoul.fundament` | Rejected: gone after one tick; only the Foundation draw in culture generation would ever read it |
| **Multiply the derived cosmology profile by the tilt, and pass the blended fundament to culture generation** | Chosen: the cosmology profile is what shapes a world's spheres; the culture Foundation draw already reads the fundament |
| A new per-place bias pass | Rejected: a second way to shape place spheres beside the cosmology |

### Where the record lives
| Option | Verdict |
|---|---|
| A field on `GameState` | Rejected: 723 importers, and the tick loop has no reason to see it |
| **A separate record, one storage seam, read at world creation and written at run end** | Chosen (the decision record's "behind one read/write seam") |
| A server store now | Rejected for now: the seam lets it replace browser storage later |

### The dormant injection hooks in `seedWorld`
They exist (`worldSeed.ts:906,1803,2001`) and look like the obvious thing to activate. Read closely, each takes the first echo of its kind and applies it to every settlement, every mortal or every artifact. An echo is one thing in one place. A placed pass after world creation is the honest activation; the global hooks stay unused with a pointer comment.

### Which echoes the harvest keeps
Today `computeHarvest` counts divine slots and fills none (only the card echo), and its cosmic candidates take the cosmology's top two spheres. The earners in the decision record (a place held Sovereign, a mortal made Aspect or Champion, an artifact borne by the god's threaded) become a deterministic rotation. A kind with no candidate yields to the next, so a god who threaded no one still leaves a monument.

### Where the hunger choice happens
The decision record says "earned at Twilight"; the mock puts the choice on *The world remembers*. The plan follows the mock: the hungers stir at run end (recorded in the account), and the player chooses at the top of the next Remembrance, then meets that hunger a step later.

### How the next world's seed is chosen
Random would make a run unreplayable. Derived from the last seed and the cycle count, same account and choices give the same next world.

### Slicing
One plan, three build tickets in dependency order: the record and a new world (no blocker), echoes in the world (needs the record), choices that widen (needs the record and the THR-1811 offering). Slice 1 alone already delivers the ruling's second half: a new world each run, with the card echo carried.

## Tensions

- **The next world depends on the god you choose.** A monument's lift is sized in the Remembrance that picks the god. That is what makes "it wakes as ground already yours" and "it will stand against you" both true; the cost is that the world is a response to two gods, not one. Rulebook §11 already says the next world is a response.
- **Run 1 gets narrower.** Today every new player sees all twelve hungers; after slice 3 a first run offers four. It is the decision record's call with a veto line; a cold-playtest kill criterion watches it.
- **Width is content-bound.** Once every card is unsealed (about run 14), only new content keeps "wider" alive (decision record §2).
- **Browser storage is fragile.** A cleared browser is a fresh account. Accepted at this stage by the decision record.

## Veto lines offered

- *"Monuments should mark the world the same way whoever wakes"* — a fixed lift instead of one sized to the new god (measured above: kin Sovereign or opposed Foreign).
- *"Opposed monuments should fade like the others"* — a new decay rule for unbought spheres.
- *"Let me choose the hunger at the harvest, not in Remembrance."*
- Carried from THR-1773: *keep the same-world continuation as an option* · *opposed monuments should not stand against you* · *run 1 should offer all 12 hungers* · *unseal faster (4 a run)*.
