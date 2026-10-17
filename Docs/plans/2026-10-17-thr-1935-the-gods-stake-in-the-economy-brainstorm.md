> **Brainstorm companion** for `Docs/plans/2026-10-17-thr-1935-the-gods-stake-in-the-economy.md` (THR-1935). Design lane, unattended, run 2026-10-17b.

# The god's stake in the economy — brainstorm companion

The model itself is [THR-1871](https://linear.app/threadbare/issue/THR-1871)'s, kept by Christian in chat on 2026-10-15. This file records how the plan turned that decision into something buildable: the alternatives it weighed for each how-level choice, the tensions it found in the substrate, and the Vision premises it leaned on. The grill-me pass ran against evidence (canon, the decision record, the sibling plans, measured code) rather than a person, as the design lane does.

## Vision premises leaned on

- **The god works through the world, not on it.** A prayer is the world asking. The god cannot manufacture worship; it can only answer.
- **Mechanics surface through prose, never numbers.** Faith, prayers and receipts are words; the sanctity scalar never reaches the screen.
- **The world does not wait for the god.** An ignored prayer is answered by someone else.

## How-level choices and the alternatives

1. **Three slices** (prayers and the faithful · receipts · cards and promises).
   - *Alternative: one slice.* Rejected. The cards need mortal wealth's `economy_shift` and the undertakings plan's founded guilds, which are not built, while prayers need only hunger and unrest. One slice would hold the prayer behind two unrelated builds.
   - *Alternative: receipts first.* Possible, since S2 has no hard blocker. It was not made S1 because the ticket's heart is the prayer, and receipts already stand on their own as a parallel-safe slice.

2. **A prayer is an event node**, not a property bag on the town.
   - *Alternative: `prayer: { godId, … }` on the town.* Rejected. It stores a relationship as an id in a property (Vision non-negotiable #4), and the undertakings plan's Vision audit returned REVISE for exactly that shape on 2026-10-17.
   - *Alternative: a new `prays_to` edge type.* Rejected. A new edge type needs Christian (CLAUDE.md: no inventing node or edge types). `event` + `occurred_at` + `participated_in` already say "a thing happened at a place, and someone took part".

3. **Recovered = the Restless chip has released** (unrest below 15), not "unrest below 30".
   - *Alternative: the raw 30 line.* Rejected. A town at 25 still shows Restless (hysteresis), so the thanks line would contradict the chip the player can see (PC-6).

4. **Faith starts at the nurture ceiling (0.5) and lapses at 0.**
   - *The tension, measured:* source income reads sanctity only through the tier (`computeSourceIncome`, dormant ×1 below 0.6), and land nurture stops at 0.5. So "faith rides the bread" would move a number nothing reads.
   - *Alternative: scale faithful income by sanctity.* Rejected. It would add a second income rule for one kind and break THR-1761's one-channel ruling, since income already reads the band.
   - *Alternative: let the faithful flower.* Rejected. Flowering doubles income. With four faithful towns flowering, the § Measurement overlay re-run with them flowering puts the shepherd god at 13.5 and the rich god at 13.7 on day 90. Both are OUT of the trip-wire, about +0.3 over four non-flowering towns, and the rich god is already OUT at two.
   - *Chosen:* a lapse at 0, warned at 0.2. Hunger now has a consequence the player can see and act on (answer again).

5. **Sanctify cannot touch a faithful town.** This follows from 4: sanctifying would let a god buy flowering and leave the measured envelope. It also keeps the decision's meaning intact: faith comes from bread, not ritual.

6. **Cap of four faithful towns.** Measured, not guessed: six puts the richest god at the 13.5 ceiling. The decision's own "would change the call" line (10% of day-90 income) is not reached even at six (about 5%), so the cap binds on the trip-wire, not on that line.

7. **30-day durations kept, worded "a year".**
   - *Tension:* the game's season is 7.5 days (`TICKS_PER_SEASON` 90), but the decision wrote "once a season (`PRAYER_COOLDOWN_DAYS` 30)" and "for a season … `BLESS_HOLDING_DAYS` 30".
   - *Alternative: keep the word, use 7.5 days.* Rejected for prayers. A six-day window with a 7.5-day cooldown lets one hungry town pray almost every week, which is the flood the decision rejected ("prays to every hungry town … floods Needs you"). For Bless the Holding, a week would also be defensible. The plan keeps the decided number for consistency and invites a veto ("make the blessing last a season").
   - *Chosen:* the numbers, with the player-facing word that matches them. 30 days is exactly one game year.

8. **"Faithful", not "congregation".** UL: *Congregation* is the Temple of the Spheres faction (Agents.md). One word naming two things is PC-6 and Law 43. "The faithful of Millbrook" reads naturally and is free.

9. **Answering is a flag on the card**, with a two-way completeness test.
   - *Alternative: infer it at run time from the effects.* Rejected. Effects are op lists with several shapes (an op, `update_node`, a control spec), and inference would be a second, hidden classifier. The flag plus a test that checks the effects keeps one place to read and catches drift.

10. **Bless the Holding uses the declared `blessed` edge.** *Alternative: a `blessedUntilTick` property on the place.* That works, but the blessing is a god-to-place relationship and an edge type for it already exists unused.

## Smaller calls

- **Unbidden aid sets the town's prayer cooldown**, so Bless the Harvest spam on a Foreign town cannot mint Dominion every day.
- **The slighted town goes first without consuming the seeded draw**, so worlds with no slight replay exactly.
- **`LOC_OPEN_MARKETS_TRADE_RANGE_HEXES` is deleted**, because nothing in the decision reads it. The other two constants get their reader.
- **The thieves' guild is a board boost, not a forced founding.** The decision says the resident is *offered* the undertaking. A forced founding would take the mortal's choice away (Vision: a mortal is a person, not a unit).
- **The receipt fade clause "over the coming season"** belongs to the settlement economy's land shock. It is left as that plan wrote it, not reworded here.

## Fog left for later (not this plan)

- Prayers to a **rival** god on its own ground (the god's stake is the player's; rivals answer only through the raid list).
- Whether faith also **tends** a place's Dominion over time (the Dominion map's *Worship* fog; the decision left it open).
- A mortal's personal devotion to the god from a town's faith (threads already carry that).
