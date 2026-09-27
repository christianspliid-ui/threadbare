> **companion_of:** `Docs/plans/2026-09-27-thr-1630-notables-and-ties.md`
> **linear_issue:** THR-1630
> **author:** Claude Code (design lane, run 2026-09-27d)
> **created:** 2026-09-27

# Brainstorm companion: notables and ties

The considered alternatives, tensions and Vision premises behind the plan. The plan is the contract; this is the reasoning.

## A. The re-measure changed the shape, not the decisions

The two research tickets ([Story in every settlement](https://linear.app/threadbare/issue/THR-1593), [The people web](https://linear.app/threadbare/issue/THR-1594)) were right about what to seed. The re-measure on `2bebc045` changed *how*:

- **Half the deciders live outside settlements.** Protagonists are placed over every Location, so "co-residents" is empty for half of them. The 6-hex same-culture fallback THR-1594 treated as an edge case carries half the ties.
- **THR-1620 shipped to a random Realm.** Standing exists now, but it is not "home". The re-point had to be designed, and it had to avoid the shared worldgen stream.
- **The graduation bypass is large** (spotlight 19 → 47 in 200 ticks on seed 42). Seeding 47 · 67 notables at t0 without closing it would turn a free liveness change into the most expensive thing THR-1592 measured.

## B. The shared worldgen stream: the trap that decides three sub-designs

`seedWorld` draws everything from one `mulberry32(seed + 7919)`. Any change to how many draws an early block consumes shifts every later draw, so a "small" change to ties would reshuffle artifacts, factions and ambitions. That makes every census diff unattributable. Three choices follow from it:

1. **Keep the legacy tie block's draws, skip its writes** (flagged). Considered and rejected: deleting the block (shifts the world) and replacing it in place (shifts the world differently).
2. **Home standing as a post-pass that re-points an existing edge,** not a change to the membership draw.
3. **New passes in `seedLivingWorld` with reserved primes,** the convention that file already set up for exactly this reason.

## C. Kin vs lineage: which word wins

- `kin` is what the ambition modifiers say, `lineage` is what the backstory tables and one milestone say, and nothing writes either.
- **Chosen: `kin`, with an alias table.** It is plain English, and it names the person rather than the descent line. The alias table means no authored template changes, so the milestone saying `lineage` starts matching the moment a kin edge exists.
- Rejected: rewriting every reader to one literal (destructive, and it would break the next author who writes `lineage`); a new edge type for kin (THR-1594 already showed `relates_to` carries it, and the load-bearing rule forbids a new edge type when an existing one serves).
- The alias table also pairs `spouse` with `romantic`, two readers that disagree with each other and have no writer. It seeds no lovers. It only makes sure that when a writer arrives, the two readers agree.

## D. Graduation: close or bound

The ticket offered both. Options weighed:

1. **Bound with a separate graduation cap** (for example 2 per day). Cheap, but it is a second door into the deciding tier, which Christian's THR-1348 ruling says is "not widened".
2. **Close through the one budget (chosen).** A qualifying notable swaps in for the least-recently-witnessed non-builder, or takes overflow, or waits. Same protections, same ledger, one invariant anyone can check.
3. **Stop graduation entirely.** Rejected: importance-earned notables becoming deciders is how the world grows its own protagonists, and the ruling is about headcount, not about who fills it.

**The real tension:** holding deciders flat lowers late-game encounter volume, and [let written encounters land](https://linear.app/threadbare/issue/THR-1633) measured its gates with the growth in place. The plan does not guess which effect wins. S3 re-runs the reach and attended readers and ships behind a flag, falling back to `false` if the reach gates regress. That fallback is then a real finding for a lane decision, with numbers.

## E. The notable's want: whose story is it?

The existing agenda families target the *nearest faction* thing: a claim on the nearest foreign-held Location, a feud with the nearest foreign leader. For a hamlet notable that would produce a feud with a king 20 hexes away. **Chosen: local agendas aim at the notable's own seeded story**: the quarrel partner, the partner's holding, the home settlement. The notable's want then *is* the quarrel and the holding the settlement page shows, so what the player reads and what the world does are the same thing.

Rejected: giving notables an ambition (0 of 10 templates pass eligibility, and the minted fallbacks assume a harm the player saw, so it would be a want nothing can move). Also rejected: more than three families. `campaign` and `succession` are ruler business.

## F. Who becomes the notable

A sort, not a draw: the resident with the wealthiest role. Alternatives: a random resident (a PRNG stream spent on a choice a sort makes more believably), or the oldest resident (no age reader worth trusting). The wealthiest role is the one most plausibly *holding* something, which is the first thing the package gives them.

## G. The UI: the settlement page is where "every settlement has someone" becomes visible

The map already icons a notable, and the sheet already has a Relationships section. What was missing:

1. **The bond word.** "Maren Dusk, trusts deeply" does not say sister or rival.
2. **The settlement page naming who matters there, and why,** in one state-built sentence.

The sentence is built from edges, not authored prose. If a quarrel ends, the clause goes, which is Law 56's logic applied to a page. The secret clause is fog-gated, because telling the player "she knows something about Kael" before they know her would leak intel the knowledge system withholds.

## H. Vision premises in play

- **North star:** "a handful of mortals they know by name … because they have watched these people *choose* things." Liveness at t0 gives choices something to be about from the first scan.
- **The player is a god, not a protagonist.** The plan adds no verb, only people worth watching.
- **Narrative over mechanics.** The old quarrel is history (rivalry), not a secret harm (grudge). THR-1383's seen-harm rule holds.
- **Expansive design, conservative implementation.** Every write reuses an existing writer, and nothing is added per tick.

## I. Kill criteria

- The S1 or S2 budget line fails (+10% steady-state, or deciders +10%) on both seeds → drop `NOTABLES_PER_SETTLEMENT` to 0 for hamlets and camps first, then re-measure. If ties alone break it, S1c's origin filter is leaking: find the unstamped writer.
- S3 regresses reach → ship with the flag `false` and report. The lane re-decides with numbers.
- Settlement pages read as a list of grudges → the sentence's clause order and verbs are copy, tunable without engine work. Christian's "not fun" call on it would stand, and the lane does not make that call.
