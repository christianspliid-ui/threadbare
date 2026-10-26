# Action proposal — a bounty is collected in a duel (THR-2072)

## intent_quote

There is no live ask: this is the unattended design lane working agreed design. The chain of agreement:

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, chat, 2026-09-25 (THR-1611)

The [Mortal economy map](https://linear.app/threadbare/issue/THR-1863) was charted with Christian (destination: *"a basic 'kingdom' economy so factions have something to fight over"*, 2026-10-14). The mortal wealth plan (THR-1936, merged and built) put the row into its Deferral, [THR-1954](https://linear.app/threadbare/issue/THR-1954):

> "**A faction's quest or bounty pays its finisher from the purse** — the first faction → mortal write"

The commission plan (THR-2042, merged) took the quest half and kept the bounty on THR-1954 with this reason, which sets this plan's scope:

> "Bounties stay on the leftovers list. Collecting one means hunting a named mortal to a fight's end — the fight-end path, not a payout row."

THR-1954's latest comment: *"This list keeps: bounty collection, and the mill-lease row returned by THR-2048."* This plan is the bounty row.

## scope (what this plan does)

It gives a faction's posted bounty a way to be collected. While a bounty is open, a member of the issuing faction who shares a place with its target can come for them in a mortal duel, spawned by the existing grudge trigger with a second licence and its own chance (0.02/hour, courage-leaned, own seeded stream). If the hunter beats the target (yielded, spared, mauled or slain — the duel's own endings decide death), the bounty is collected: the held coin is paid out, a hunter who makes choices gains one Means step, `hunted` is lifted. A bounty nobody collects lapses at its existing expiry (or when its target dies otherwise) and refunds the purse. A faction no longer posts a second open bounty on the same target or one on the dead. Shows through a Blood-row line on the target's sheet, a chronicle line on collection, a Means-tooltip cause and two spawn-only duel templates; traced and inspectable by debug accessor. Touches: new `factionBounties.ts`, `fight-duel-bounty.ts`; edits in `phaseFactionActions.ts`, `grudgeDuelTrigger.ts`, `fightOutcome.ts`, types (`graph.ts` one edge, `edgeSchema.ts`, `trace.ts`, `fight-traces.ts`), `agentDetail.ts`, `personRows.ts`, word constants, debug bridge, CLI; rulebook lines.

## scope (what this plan does NOT do — explicit non-goals)

- **The three bounty scenes are not bound** to a bounty (drawn ~once a month; single-roller prose quarry).
- **No hunters from outside the issuing faction** (mercenaries, the Adventuring Guild).
- **No kill rule, no "dead or alive" choice.** Death is the existing duel's call.
- **No "hunt a mortal" undertaking.**
- **No change to what a bounty costs or how often a faction tries to post one.** The one exception is decision 5's guard: no second open bounty from the same faction on the same target, and none on the dead (census: 1–6 re-posts and 1–2 dead targets a month per world).
- **No bounty board or faction-sheet errand line**, no map signifier.
- The mill-lease row left on THR-1954.

## impact_class

Reversible. `FACTION_BOUNTIES_ENABLED = false` restores today's behaviour. New optional props, one new edge type; a missing `escrow` reads 0.

## evidence cited

- **Linear issue:** THR-2072 (split from THR-1954)
- **Vision premises invoked:** `Vision/01-core-loop.md` (consequences compound), `Vision/02-non-negotiables.md` (prose not numbers; one graph), `Vision/03-design-tensions.md` (death rare and caused)
- **UL terms touched:** Faction, Means, Bounty (world-object registry `bounty`), Duel, Grudge — no new term; "price on their head" is prose, not a concept
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/game-design/laws.md`, `Docs/canon/design-governance.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-25-thr-2042-faction-commission-pay.md` (the pay scale, decision 2; the escrow pattern), `Docs/plans/2026-09-23-mortal-duels.md` (agent-mode duel, grudge trigger, beaten-duellist fate), `Docs/plans/2026-09-23-defeat-and-victory.md` (death gate, guards), `Docs/plans/2026-10-15-thr-1936-mortal-wealth.md`, `Docs/plans/2026-10-15-thr-1931-faction-purse.md`
- **Rejected approaches considered and dismissed:** binding the scenes; a hunt-a-mortal undertaking; decider-only hunters; outside-guild hunters (all in the brainstorm companion)

## load-bearing decisions touched

- **Relationships are graph edges:** who collected a bounty is the new `collected` edge (agent → bounty), not a property.
- **No inventing node types without verification:** none — the existing `event` node (`eventType: 'bounty'`) gains properties.
- **Agent position is three-tier:** the trigger reads the colocation phase's existing `located_at` grouping unchanged.
- **The world graph is mutated in place:** writes go through `graph.updateNode` / `addEdge` as the existing writers do.

## high-impact files touched (from Codesight)

- `src/types/graph.ts` (329 importers) — one `EdgeType` member
- `src/types/trace.ts` (142 importers) — one union member and category

## kill criteria

The build's census on seeds 42/99/7 × 360 ticks must give 3–25 bounty duels a month on every seed. Above 25: halve the base chance once; still above → ship with the switch off and send the ticket back to Todo with the census. Below 3: double once; still below → the same. A death count above 3 a month is filed as a finding on the duel's kill draw.
