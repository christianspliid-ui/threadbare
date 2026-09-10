# Action Proposal — a hold is kept by working it (THR-1287)

## intent_quote

> "lets get some more design ready for development" — Christian, attended chat, 2026-09-09.

> The ticket (Christian's account, filed at THR-1286's closeout 2026-08-26): *"control is currently a timer, not a commitment. A player or agent cannot hold anything by attending to it, which is the fiction the surface promises"* · *"Design decision recorded first (this is a rules-of-play question, not a defect with one right answer). Then: an agent that acts on a control target it holds keeps that stance alive across a CLI run longer than the fixed grace+degradation window."*

> Standing rulings this plan works inside: THR-1392 (Christian, 2026-09-03) merged `hold` and `seize` into one `control` verb and its critic struck `hold` as a completion verb; THR-1303's executor kept the neglect loop for the grid (impediment #990); THR-1397's yield ruling made `use × Location` *"the active harvest of a held Location — holding court, taxing a market, drawing a tithe."*

> The prior verdict that pointed the other way, and the answer that settles it. THR-1280 (Christian, 2026-08-26): *"control upkeep removed — ownership becomes a worldly-belongings attachment category acquired and lost through projects and events, never tick maintenance"* (shipped as the UL's Freehold). Christian, attended chat 2026-09-10, asked *commitment or possession?* for a claimed town: *"it is a commitment and probably also a faction position?. it could open up specific encounters within that factions and influence what undertakings are prioritized."*

## scope (what this plan does)

Adds one pure function at one call site: when a mortal completes a `use` or `change:raise` cell on a Location they hold through an active stance, with a success band, the stance's neglect resets and a quarter of its degradation recovers. Extends the lifecycle trace with `renewed` and `seized`, adds one chronicle line on recovery, pins (or repairs) the loser's stance retirement on seize, and lands the rule in the rulebook, the canon page and the wiki page, plus a dated correction to the stale supersession line in THR-1292 §6. Hands off to Ready for Dev.

## scope (what this plan does NOT do — explicit non-goals)

- No new verb, variant, cell or execution mode (THR-1392's ruling stands).
- No change to the grace, the degradation rate, the collapse, `retireControl`, the re-claim cooldown, `claimControl` or the `controls` edge.
- No change to `drawYield`'s costs, cooldown or bands; renewal is a side effect of completion in the lifecycle, not inside the semantic.
- No player control; no new UI surface; no interaction with the ascendant's `controlEffects`.
- Does not decide THR-1348 (how often holders get to work anything); sequences with it either way.
- **Does not build the faction position** from the second half of Christian's answer — filed as THR-1448 and sequenced after this ticket; the stance record is left as the seam it will read.
- Does not touch the Freehold model (`owns`): a founded, bought or seized possession keeps no clock; only a *claimed* town is a hold.

## impact_class

Reversible — one function, four constants, two trace members, three doc paragraphs; the renewing set can be emptied to restore the timer.

## evidence cited

- **Linear issue:** THR-1287 (related THR-1286, THR-1303, THR-1442, THR-1392, THR-1439)
- **Vision premises invoked:** `Vision/02-non-negotiables.md` #1 (mortals exercise their sovereignty — a hold is something a mortal does), `Vision/00-north-star.md` (failure is plot — a grip that opens because it went unworked)
- **UL terms touched:** Undertaking, Location, Freehold (existing; used only to draw the line). **New term filed:** *hold* — a Location kept by a mortal's commitment, the `controls` stance — as THR-1449, because THR-1314 moved the ownership sense of "holding" to Freehold and nothing names the clock-based kind; the plan uses *hold* throughout and never *holding*
- **Canon pages consulted:** `Docs/canon/undertakings.md`, `Docs/canon/rulebook.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `2026-08-26-thr-1292-undertaking-substrate.md` (§6, corrected), `2026-09-03-thr-1392-verb-object-undertakings.md` (the `hold` ruling), `2026-09-08-thr-1439-yield-and-leverage.md` (the harvest cell)
- **Rejected approaches considered and dismissed:** **the Freehold route** — finish THR-1292 §6 by minting `control:claim × Location` as a Freehold (`owns`) and deleting the clock, the direction THR-1280 chose — declined because Christian ruled a claimed town a commitment on 2026-09-10, and because it would leave the grid's only sustained mode with no way to be lost but seizure; a `control:renew` variant (thirteen tables; the THR-1392 ruling); idempotent re-claim (unreachable from the board); an upkeep charge (a paid timer; the ascendant's model); renewal on any band (failing would be the cheapest hold); renewal through `isStepSuccess` (admits `near_miss`, leaves the constant decorative); full recovery per renewal (makes the ramp cosmetic); renewal inside `drawYield`

## load-bearing decisions touched

- *Relationships are edges, not property fields* — respected: the hold is the `controls` edge; the stance record carries only its own clock and health.
- *Additive over destructive* — respected: nothing in the loop changes.
- *Fail-soft* — every absent input is a no-op.

## high-impact files touched (from Codesight)

`src/types/trace.ts` (120 importers) — union members and three optional fields on an existing interface; the plan carries a `## Blast radius` line. Nothing else touched has ≥ 100 importers.

## kill criteria

- Holds never collapse on the census seeds once renewal lands → halve the recovery before touching the grace.
- A renewal fires on an `owns`-held Location → wrong record; only stances renew.
- Two active stances for one actor on one target → the claim guard regressed; fix there.

## explicit user sign-off

Not required by class (Reversible), but obtained because the first judge run found the fork was *whether*, not *how*. Christian, attended chat, 2026-09-10 (the session's clock rolled past midnight local; the answer followed the closing summary of 2026-09-09), verbatim:

> it is a commitment and probably also a faction position?. it could open up specific encounters within that factions and influence what undertakings are prioritized.

Recorded on THR-1287 as *human gate satisfied via chat review 2026-09-10*. The first clause is this plan's ruling; the second is filed as THR-1448 and excluded from this plan's scope.

## author notes for the judge

- The ticket's premise was re-verified rather than trusted, because THR-1303 (Done) had promised to make it moot; it did the opposite, and the plan says so with the commit and the impediment.
- The shape chosen is the one that respects two standing rulings that each closed a door (no `hold` verb; keep the loop) — the survey's cost count for a new variant is why option 1 is not taken.
- The seize question is deliberately left as *test first, repair if it fails* — asserting either way from a read would be inventing a fact.
- The UI pillar is present without a component edit, and the plan says what evidence replaces the capture and what happens if an edit turns out to be needed.
