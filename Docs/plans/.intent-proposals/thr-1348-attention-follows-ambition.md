# Action proposal — Attention follows ambition (THR-1348)

**Plan doc:** `Docs/plans/2026-09-21-thr-1348-attention-follows-ambition.md`
**Issue:** THR-1348

## intent_quote

Ruling recorded on the ticket (attended chat, 2026-09-10), the three readings put to Christian in game terms with a recommendation; he answered:

> ok lets go

Applied as (ticket comment, same day): *"Ruling: reading 1, in its 'attention follows ambition' form. The aperture (the spotlight tier's headcount) is the intended attention budget and is not widened; notable and ambient mortals do not run the autonomous decision loop. Instead, an ambition whose profile is strategic pulls its holder into the spotlight — the world's builders become the people the player can watch … Reading 2 … is declined for its unmeasured per-tick cost and because it would build things nobody sees; reading 3 … is declined because the instrument already reports it and the gap is real."*

Earlier direction (Discord, 2026-08-29): *"so i think in the longer term we want other gods competing and so having threaded agents that are not the players. those would be able to do stuff 'off-screen'."* — long-term; the 09-10 ruling is the near-term one this plan implements.

## scope (what this plan does)

At ambition assignment, a strategic-profiled ambition pulls a below-spotlight holder into the spotlight through the existing `hydrateToTier`, swapping out one least-recently-witnessed spotlight mortal with no strategic ambition (never a threaded one), with a small named overflow when no swap candidate exists. Routes `ambitionTick`'s two inline `pursues` writers (`:955`, `:1023`) through the extracted helper so every assignment passes the hook. Repairs `ambition_forge_legend`'s unreachable trait gate. Stamps two unstamped mint sites. Widens the census to all three template pools, excludes avatars, adds pull/demotion counters. One aggregate trace, a debug ledger, one chronicle line, one rulebook sentence.

## scope (what this plan does NOT do — explicit non-goals)

- Does not widen the decision loop to notable/ambient mortals (reading 2, declined).
- Does not introduce a runtime spotlight cap or flip the `?? 'spotlight'` default.
- Does not re-fix the lair-elite stamp (already shipped, THR-1403).
- Does not build rival-god threading (the 08-29 long-term direction).
- Does not touch the decision board, the strategic scorer, or any gate that would "make routes appear".

## impact_class

Reversible. One lever constant restores today's behaviour; demotion writes one property and strips nothing.

## evidence cited

- **Linear issue:** THR-1348 (+ THR-1329, THR-1403, THR-1437, THR-885, THR-815)
- **Vision premises invoked:** `Vision/00-north-star.md` (witnessed before the crisis lands), `Vision/02-non-negotiables.md` #1
- **UL terms touched:** Ambition, Retinue, The First; **new headword Spotlight tier** seated in `Agents.md` by the slice PR under delegated seating (no entry exists today — verified: the word appears once, inside the Calling entry)
- **Canon pages consulted:** `systems-inventory.md`, `design-governance.md`, `rulebook-quick-reference.md`, `undertakings.md`
- **Prior plan docs this builds on:** THR-1437's seeding plan (via `agent-behavior-constants.ts:560-581`), THR-1329's instrument, THR-885's helper extraction
- **Rejected approaches considered and dismissed:** brainstorm companion (nine)

## load-bearing decisions touched

- *Ascendants use the same prerequisite system as agents* — untouched; the avatar is excluded from the pull and the census.
- *The world graph is mutated in place* — the pull's property writes go through `updateNode`; no identity-keyed cache is affected.
- *Everything is a graph node/edge; relationships are edges* — the ledger is node-internal data (tick, id of the displaced), which is what properties are for; the relationship the pull creates (holder ↔ ambition) is the existing `pursues` edge.

## high-impact files touched (from Codesight)

`src/types/trace.ts` (125) — additive. `src/engine/gameInit.ts` (122) — one literal at `:966`. `ambition-templates.ts` (40), `agent-behavior-constants.ts` (59) below the cutoff. `graph.ts` (913) / `gameState.ts` (599) not edited. Blast Radius section present.

## kill criteria

Tick cost > +25 % at medium; `startsPerMortalPer100Ticks` reds after landing; a threaded mortal demoted; promote/demote churn in the ledger. Each names what moves first.

## explicit user sign-off

Not required (Reversible). The ruling is quoted verbatim.

## author notes for the judge

- The ticket's item (d) — lair elites unstamped — is recorded as already shipped; the residual (commanders, dev counterparties) is small and stamped explicitly. If the judge reads the ticket's comment record as still expecting an elite fix, the plan's substrate table is the evidence.
- The plan re-measured the baseline: merchant-expansion reachable on 1 of 3 seeds (42 yes; 99, 7 no). The ticket's "≥ 2 of 3" Done-when is kept against this baseline.
- "Least recently witnessed" has no field today (the curator's read is a thread-tug map, absent on every eligible demotion candidate; `lastSeenTick` is per hex). The plan commits the executor to writing `lastWitnessedTick` at encounter resolution and names the site.
- The `forge_legend` repair moves a gate to a boost and repoints two assertions that cite the old pairing. This is the one content decision with a UL edge; it is stated in full.
