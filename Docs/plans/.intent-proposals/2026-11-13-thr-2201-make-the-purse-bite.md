# Action proposal — 2026-11-13-thr-2201-make-the-purse-bite

## intent_quote

> "Yes, file them" — Christian, chat, 2026-11-12, approving the five-ticket direction "make the middle a game"; this is ticket 1.

Ticket body (THR-2201), the agreed brief:

> What makes essence scarce in ordinary play, measured on live play and not on authored prices? The plan decides between, or combines, the levers that already exist as data: card prices, pool caps, refill rate, upkeep (THR-1747), the sphere-match discount, and the things the god can spend on between chapters. It must keep Law 19 (the price is paid before the dice) and the Meet The First rule that every card is affordable when first offered.

> Done when: a plan doc names the scarcity target as a predicate a measurement can check … says how that predicate is measured on live play (Law 1) and which constants move … covers Engine, Content and UI … The UI pillar says, in the player's words, how the player learns a card is out of reach before committing (PC-1) … Implementation tickets are filed from the plan with their coordination blocks.

> The first step of the plan should be to confirm the numbers with a census (pool level at each attended step over several seeds).

## scope (what this plan does)

The plan confirms the playtest with a headless census over three seeds. It fixes two code paths that stop any price from binding: the sphere discount reaching unbought spheres, and sphere-less cards paying from all twelve pools. It then sets a four-part predicate (P1–P4) and tunes three existing constant groups toward it: a new card-price scale, the pool cap, and base and seat income. The measured starting values come from eight experiment runs. On the UI side, the greyed card names the short pool and its refill word, and price hovers explain where a price is drawn from.

## scope (what this plan does NOT do — explicit non-goals)

- No new between-chapter spends, and no repricing of Doom or rival answers. Those belong to THR-2202.
- No repricing of divine casts or offerings. They slow only through income.
- No change to Meet The First prices (they are exempt from the scale).
- No new resource, allowance or per-step budget concept.
- No change to Law 19's commit-refusal behaviour.

## impact_class

Reversible. Constants and two rule fixes, all behind named constants; nothing is deleted.

## evidence cited

- **Linear issue:** THR-2201
- **Vision premises invoked:** Vision `00-north-star.md` (small supply of divine essence), via Game Design Laws 30, 36 and 37
- **UL terms touched:** essence, sphere, pool (no new terms)
- **Canon pages consulted:** `Docs/canon/rulebook.md` §6 (economy) and §7 (discount, price before the dice, Meet The First affordability); `Docs/game-design/laws.md`; `Docs/ops/player-complaint-classes.md` (PC-1)
- **Prior plan docs this builds on:** `2026-10-05-thr-1745-player-power-progression-models.md`, `2026-10-06-thr-1747-divine-economy-shared-prerequisites.md`, `2026-10-11-thr-1748-dominion-core.md`
- **Rejected approaches considered and dismissed:** prices only (measured, never binds); a per-step allowance (Law 43, Law 30); cutting the unbought-sphere floor (THR-1745 H8)

## load-bearing decisions touched

Reaches and Spheres are orthogonal: respected, since only sphere pools are touched. No graph, node or edge changes.

## high-impact files touched (from Codesight)

None at ≥100 importers. Importer counts: `nudge-stage-content` 33, `nudge-constants` 27, `encounters/nudges` 18, `influence-content` 12, `nudgeCommit` 10, `buildNudgePhaseModel` 2.

## kill criteria

- The census cannot meet P1 and P2 together on all three seeds inside the stated ranges. The executor records every try, ships the rule fixes alone, and reports back. The design lane then re-plans with the THR-2202 spends as extra demand.
- A warm playtest round after the change finds testers starved, with cards greyed at most steps. The income constants step back up toward 1.0.
</content>
</invoke>
