# Action proposal — The world remembers (THR-1813)

## intent_quote

Christian, chat, 2026-10-11, recorded verbatim on THR-1773 (comment "Christian's ruling (chat, 2026-10-11)"):

> 1. **What carries between runs: "World remembers + wider."** The god starts every run equally strong. What carries is in the world (Monuments, Legacy mortals' descendants, Relics, the World-Soul's tilt) and in the player's choices (each run's echoes unlock hungers, courts and cards for later runs). **No stat growth on the god.**
> 2. **The next run: "New world, shaped by echoes."** A fresh map and fresh mortals with the echoes seeded in (rulebook §11: *a response, not a sequel*). Today's in-tab "Begin Next Cycle", which continues the same world, changes.

Christian, 2026-09-25, delegating design to this lane (THR-1611): "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

THR-1813's description (filed 2026-10-11 by the attended session): "Build the cross-run layer Christian ruled on … **the world remembers + wider, no stat growth on the god; each run wakes in a new world shaped by echoes.**" with items 1–5 (account record, new world per run, echoes read against the next god, unlocks, the Remembrance surface).

## scope (what this plan does)

Designs the cross-run layer in three build slices: (1) a small versioned account record behind one browser-storage seam, a run-end fold that activates the dormant `blendFundaments` and echo degradation, divine echo picks at harvest, and a new world on a derived seed for every run, replacing the same-world "Begin Next Cycle"; (2) a post-worldgen pass that places each live echo as a monument (a lift in its host's sphere scores, sized so the new god reads the decided band), a descendant notable, or an unborne relic; (3) sealed hungers, courts and god cards that widen each run, and the new first Remembrance step *The world remembers*. Files two follow-on build tickets (slices 2 and 3) and one UL proposal.

## scope (what this plan does NOT do — explicit non-goals)

- No stat growth on the god: sphere points, essence, power, reaches, tiers and prices are unchanged.
- No full world save, no server account, no cloud sync.
- No change to the in-run economy, the offering (THR-1811) beyond one sealed-set filter, or Dominion's read.
- No new node type, edge type or tick phase.
- Does not write Resonance memories (no writer exists; THR-1381 owns Twilight authorship).
- Does not keep the same-world continuation (Christian ruled it changes).
- Does not add Twilight authored beats or change the harvest's types.

## impact_class

Reversible — a plan doc plus filed tickets. The build it specifies changes player-facing flow (the next run is a new world; run 1 offers four hungers after slice 3), which the veto lines cover.

## evidence cited

- **Linear issue:** THR-1813 (build), THR-1773 (ruling + decision record), THR-1811 (offering plan), THR-1794, THR-1749, THR-1748, THR-1763
- **Vision premises invoked:** vault `Vision/00-north-star.md`, `02-non-negotiables.md`, `03-design-tensions.md`, `taste-profile.md`
- **UL terms touched:** Dominion, Dominion Band, Opposing Dominion (Cosmology.md); new: Run, Echo, Memory word, Account record, World tilt → filed as UL-proposal THR-1845
- **Canon pages consulted:** `Docs/canon/rulebook.md` (§8 :393-395, §11 :603-605, :68), `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md` (+ generated :115)
- **Prior plan docs this builds on:** `Docs/plans/2026-10-13-thr-1811-god-card-progression-and-offerings.md`; decision record `Docs/audits/2026-10-11-thr-1773-cross-run-growth-prototype.md`
- **Rejected approaches considered and dismissed:** fixed monument lift; stored starting band; activating `seedWorld`'s global injection hooks; writing the tilt into `fundament.sphereWeights`; the record on `GameState` (all in the brainstorm companion with reasons)

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected: monuments are sublocations, heirs are notables with `relates_to` ties, relics are artifacts. The account record is not world state; it lives outside the graph and outside `GameState`.
- **No inventing node types without verification** — none invented; `locationSubtype: 'ruins'` exists.
- **Relationships are edges, not properties** — the heir's kin tie is an edge; `echoLineageOf` is a label (the echo's name), not a relationship to a node (the old mortal is in a different world).
- **Agent position three-tier** — the monument is a sublocation (`type: 'location'` + `parentLocationId`).
- **Graph mutated in place** — seeding happens before the first tick; no identity-keyed change detection.
- **Engine caches owned per session** — a new run remounts through `App`, getting a fresh runtime.

## high-impact files touched (from Codesight)

- `src/types/gameState.ts` — 723 importers (one optional field, slice 3)
- `src/types/trace.ts` — 127 importers (nine trace types)
Blast Radius section present.

## kill criteria

- The tilt adds more than 5 Touched-or-better places at tick 0 for a kin god (slice 2 census) → lower `FUNDAMENT_BLEND_PER_RUN`.
- Run-2 cold playtesters never notice a monument or read the opposed one as ordinary → rewrite the words.
- Run-1 testers find four hungers too narrow → surface Christian's veto line, do not widen quietly.

## explicit user sign-off

Not required (Reversible). The direction is Christian's ruling quoted above.

## author notes for the judge

- The main departure from the decision record's wording: it said a kin monument "starts Held (degradation < 0.3) or Touched (< 0.6)" and opposed "Hostile". I measured that no fixed lift delivers both (tables in § Measured substrate) and chose to size the lift to the new god through the one Dominion read. The words are kept; the mechanism is new. Please check that this is a *how* within the ruling, not a change of meaning.
- The hunger choice: the decision record says "earned at Twilight", its mock puts the choice on the Remembrance step. I followed the mock.
- Slice 1 alone delivers "new world each run" with the card echo carried; slices 2–3 are filed as Todo tickets blocked in order.
- The measurement script was not committed (a scratchpad bundle of `src/` modules); its numbers are in the plan.
