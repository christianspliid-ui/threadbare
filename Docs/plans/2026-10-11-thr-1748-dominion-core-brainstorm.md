# Brainstorm companion — Dominion core (THR-1748)

> Companion to `Docs/plans/2026-10-11-thr-1748-dominion-core.md`. Design lane run 2026-10-11d, unattended. The plan doc carries the decisions; this file carries what was weighed to get there and the tensions the build should keep in mind.

## Where the decisions came from

Almost nothing in this plan is decided fresh. The [Dominion map](https://linear.app/threadbare/issue/THR-1758) settled the formula, the band table, the writers, the erosion, the secondary actors and the god's growth across nine decision tickets, each with a measured audit under `Docs/audits/2026-10-0{6,9}-thr-17{59..65}-*.md`. Christian closed the map on 2026-10-11 with a carve-up that names this ticket as plan doc 1 of 4. The plan's job is to put those decisions into one buildable order, measure what has moved on `main` since they were taken (THR-1747, THR-1749, THR-1768, THR-1792 and THR-1798 all shipped in between), and settle the small seams the decisions left to "the core plan doc".

## The seams this plan settles, and the alternatives

### 1. One module or several

- **Chosen:** one pure read module (`src/engine/dominion.ts`) owning the match, the power factor and the band, plus one writer phase (`phaseDominion`) for the new per-tick terms (claim, seat, thread carry, neglect). Consumers import the band reader; nothing else imports the match number.
- **Weighed:** putting the band read inside `sphereAffinity.ts`. Rejected: that file is the score store and its seeding; the band is a read *about the god*, and keeping it apart keeps "who the god is" (bought points), "how strong" (power) and "what the object is" (scores) in one place where the formula can be read top to bottom.
- **Weighed:** caching bands per tick. Deferred to measurement. The read is a twelve-term sum; card cost and resolution call it once per card per target. The plan names a per-tick memo keyed on `worldVersion` as the first fix if the tick budget complains, not a default.

### 2. Who carries, and how the carry rule is written once

THR-1762 (claim, seat, threads), THR-1763 (tending absorbs a raid; neglect skips tended places) and THR-1764 (bestowed mortals one tier up; anointed factions tend) each described a part of "is this place tended this tick". The plan writes it as one function, `carriersAt(placeId)`, that every writer and the neglect pass reads. The alternative, each rule checking its own condition, was rejected because THR-1763 found tending working only through a rounding accident; three separate checks would make that class of bug three times as likely.

### 3. Hexes

The map treated hexes as read-only (terrain table, never written). Claim and Shift move from hex targets to place targets (THR-1762). The plan keeps a hex band read (for the THR-1750 overlay) but writes nothing to hexes. No new hex node: the load-bearing rule against inventing node types holds.

### 4. Seeding the god's score from its bought points

THR-1749 left it to this ticket; THR-1765 made it moot by defining power against the god's own seeded bought-sphere sum. The plan keeps THR-1768's 2 / 1 seed on the two largest buys and does **not** seed a third bought sphere. A third sphere then has score 0 but full weight in the match (THR-1760 sub-decision 1 keeps power outside the sum), so it still counts for turf. Rejected alternative: seed every bought sphere at its points — it would hand a spread buy a power baseline of 5 and change every census the map measured.

### 5. Effect magnitude

The ticket's description (2026-10-05) says effect magnitude reads the band through `spherePowerMultiplier`. THR-1761 overruled that: magnitude stays on the god's own power, the band moves price, odds and yield only ("each channel is read once"). The plan follows THR-1761 and records the description line as superseded. The Done-when line "lands a larger effect" is therefore met through **odds** (a Sovereign cast lands more often and at better outcome bands), not a magnitude multiplier — the plan rewrites that Done-when predicate accordingly and says so.

### 6. The combined economy run

THR-1762, THR-1763 and THR-1764 each asked the core to run neglect + raids + Claim upkeep + bestowed/anointed carriers together before the numbers freeze. THR-1765 ran neglect + raids together (11.8–12.0 at power 1, 12.2–12.6 with growth) but not Claim upkeep. The plan makes the combined run a **build-time gate** with two trip-wires inherited from the audits (below 10.5 a tick at day 90 → raid throttle 10 → 15; above 13.5 → neglect 0.01 → 0.015) rather than re-running it at design time. Reason: the run only means something against the built engine's numbers, and the model script already exists (`npm run model:power`).

### 7. What the substrate check overturned, and what the judge caught

- **God cards carry no flat sphere discount.** THR-1761 priced "band first, then the flat discounts"; measured, the flat discount is nudge-only, and the nudge hand is out of the map's scope. The price is now band × tier-scaled cost, floored at half.
- **The opposition weights were a comment, not a table.** They become a data table in the new content file rather than an edit to `cosmology.ts` (165 importers).
- **`sphereFactor` at line 439 serves every source** (intent judge, round 1). Only the player's casts read the band; a mortal must never roll on the god's turf.
- **Prices without a reason** (intent judge, round 1, PC-1). Two fixes were weighed: an interim band word on the cost line, or gating cost and odds until THR-1750's chip ships. The gate won: the interim word would be replaced within a cycle and no mock covers it, while the gate costs nothing but a constant THR-1750 flips.
- **Neglect's scope.** The draft narrowed neglect to friendly places; THR-1763 says every untended place. Restored — decay only ever touches scores above their seeded value, so it is a no-op where the god never pushed.

## Tensions to keep in mind

- **Thin turf for a god the terrain lacks** (mind/spirit). The seat as a standing Claim is the answer the map chose. If the build's census shows a mind/spirit god with no Touched place but its seat at day 10, that is the signal, not a bug in the cut.
- **The UL entries are now slightly wrong.** `Docs/ubiquitous-language/Cosmology.md` § Dominion says "weighted by the god's power in each sphere" and § Dominion Band lists "effect magnitude" among the consumers. Both were overruled on the map (THR-1760 sub-decision 1, THR-1761). The plan scopes a definition correction (no term change) into the build PR.
- **`sphereFactor` goes negative.** `ResolutionInput.sphereFactor` is documented 0.0–0.2; Hostile makes it −0.10. The comment and any clamp must widen, or Hostile silently reads as Foreign.
- **Rounding blunts Touched on cheap cards.** Known and intended (THR-1761): the felt price drop arrives at Held.
- **No headless thread edges.** The thread-carry rule cannot be exercised by the CLI; the plan's tests build the edge in a fixture and the browser `?seeded` world carries the live check.

## Vision premises touched

- *"Losing a thread should hurt"* — neglect and raids make turf something you can lose; the seat floor keeps the home (canon: no soft-loss).
- *Prose carries mechanics, numbers never reach the player* — every player surface is a band word or a chronicle line.
- *Attention is a spend* — tending is the defence; a god that cannot attend everywhere loses its edges.

No premise changes. The rulebook gains the Dominion paragraph the map's decisions imply (plan § Rulebook impact).
