# Action proposal — a faction's commission pays the member who takes it up (THR-2042)

## intent_quote

There is no live ask: this is the unattended design lane working agreed design. The chain of agreement:

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, chat, 2026-09-25 (THR-1611)

The [Mortal economy map](https://linear.app/threadbare/issue/THR-1863) was charted with Christian. Its destination: *"a basic 'kingdom' economy so factions have something to fight over"* (Christian, 2026-10-14), and his priority ruling put the kingdom economy before individual wealth. The mortal wealth plan (THR-1936, merged and built) recorded, in its § Resolution 1:

> "the purse makes Commission Quest and Issue Bounty reachable, so a rich faction fills the boards with its errands and a broke one stops. No row in the research table pays a mortal out of a faction's purse, so this plan adds none; *a faction's quest or bounty pays its finisher from the purse* is listed in the Deferral (§ Slices) as the first faction-to-mortal write."

That Deferral is [THR-1954](https://linear.app/threadbare/issue/THR-1954). Its coordination block says *"each item is a small design … best split into its own ticket when picked up"*, and its list says:

> "**A faction's quest or bounty pays its finisher from the purse** — the first faction → mortal write (`FACTION_TREASURY_TRIBUTE_RATE`, `types/factionAction.ts:109`, unread)."

The same plan also states a boundary this plan keeps: *"Wages and patronage stay out (the map's *later efforts*)."*

## scope (what this plan does)

It gives Commission Quest postings a finisher and a payout. A posting holds the coin its faction already spends on it. The first member of that faction **who makes choices** (a spotlight decider) to complete one of the faction's existing faction-work encounters takes the oldest open posting and gains one Means step. A posting nobody takes lapses at its existing expiry, and its coin goes back to the purse. It shows through the existing aftermath `economy` change and a new Means-tooltip cause, plus a trace and a debug accessor. Touches: new `factionCommissions.ts`; edits in `phaseFactionActions.ts`, `factionReputation.ts` (return value), `unifiedActionResolution.ts`, `types/factionAction.ts`, `types/trace.ts`, `agentDetail.ts`, the debug bridge; rulebook lines.

## scope (what this plan does NOT do — explicit non-goals)

- **No bounty payout.** Collecting a bounty needs a hunt and a fight's end. It stays on THR-1954 with that reason.
- **No pay for unseen (ambient) members.** Their off-screen faction work keeps paying standing only.
- **No wages, dues or patronage.** The mortal wealth plan rules out dues, and wages are the map's later efforts. `FACTION_TREASURY_TRIBUTE_RATE` stays unread.
- **No change to how often factions post commissions** (gate and cost unchanged).
- **No new encounter, prose, board surface, chronicle line or faction-sheet line.**
- **No per-posting template pick.** Any of the faction's work takes the posting up.
- The other THR-1954 rows (place as holding, lane-bound writes, tribute oaths, salt, tolls, threatened lanes).

## impact_class

Reversible. A switch (`FACTION_COMMISSIONS_ENABLED`) restores today's behaviour. No save-shape break: new optional props, and a missing `escrow` reads 0.

## evidence cited

- **Linear issue:** THR-2042 (split from THR-1954)
- **Vision premises invoked:** the "world at work" premise as stated in `Docs/canon/rulebook-quick-reference.md` (factions act on the world through their own means); Law 36 (purses small on purpose), Law 45 (no promise the world will not keep)
- **UL terms touched:** Means (existing); no new term. "commission" appears only as plain English in a tooltip cause, so no UL proposal is owed.
- **Canon pages consulted:** `Docs/ubiquitous-language/README.md`, `Docs/ubiquitous-language/Agents.md` § Means, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/rulebook.md` §§ money encounters / faction purse, `Docs/game-design/laws.md` ch. VI–VII, `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-15-thr-1936-mortal-wealth.md`, `Docs/plans/2026-10-15-thr-1931-faction-purse.md`
- **Rejected approaches considered and dismissed:** any member takes it (unseen members hold no Means and would take every posting); pay from the purse at take-up (purses are often empty, p10 = 0); a per-posting template (needs a board surface and a reachability guarantee; Law 42); pay into the purse via the tribute rate (faction → faction, not the row's faction → mortal).

## load-bearing decisions touched

- **Everything is a graph node/edge** and **relationships are edges.** The posting stays an `event` node on the existing `commissions` edge; who took it is a new `took_up` edge (agent → posting) with an `EDGE_SCHEMA` row. An earlier draft stored it as a `takenBy` property; the judge blocked that on this rule, and the plan now uses the edge.
- **No inventing node types.** None invented.
- **The world graph is mutated in place.** Writes go through `updateNode` / props on the live graph, the same as `executeCommissionQuest`.

## high-impact files touched (from Codesight)

- `src/types/trace.ts`: 129 importers (grep on main @ 01cd21b6). One new union member. The plan carries a Blast Radius section.

## kill criteria

On any census seed no commission is taken: double `COMMISSION_QUEST_EXPIRY` once and re-run. If still none, ship with the switch off, set the ticket back to Todo and record the census. A tick-cost regression traced to the lapse sweep: move it to the faction-action interval.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- Every substrate claim was measured. The census is `scripts/commission-census.ts` on `proto/thr-2042-commission-census`, one seed per process. The grep that nothing reads a commission covers `faction_quest`, `'commissions'` and `claimed` in `src/` outside tests.
- I am least sure of decision 2's size (one `MEANS_STEP`). It mirrors the border levy in reverse; the plan names a veto line.
- Revision history: run 1 Revise (PC-2/PC-6 wording, `takenBy` undecided in the doc); run 2 Block (`takenBy` as a property breaks "relationships are edges"). Now: aftermath and tooltip share one constant phrase; the before-line is filed as THR-2043; the taker is a `took_up` edge.
