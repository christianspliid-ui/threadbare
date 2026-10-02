# Action proposal — found things in the reward draw (THR-1626)

## intent_quote

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, chat, 2026-09-25 (the design lane's mandate, THR-1611)

The ticket itself (THR-1626, filed by the design lane with the THR-1570 plan, 2026-09-26) carries the ruling verbatim:

> `GENERATED_REWARD_SHARE_BY_BAND = { 1: 0, 2: 0.5, 3: 0.5, 4: 0 }`: half of every Storied and Mythic reward draw is a freshly generated item (origin `found`, born with the Storied trait at `STORIED_START_LEVEL_FOUND_BY_BAND`); Mundane stays authored; Legendary stays authored until a generated Legendary has its own trait-graph design.

> Shape (to be designed): the draw site `drawSeededReward` → `assembleRewardPoolDetailed`, where tier is a weight (`tierCurve`), not a filter. The seam from THR-1234: generate → `graph.addNode` → `instantiateReward`. A generated template must not stay drawable after it is handed out. The nine `found`-only cores … are this point's content.

## scope (what this plan does)

Adds the second minting point of the shipped item generator: inside the one seeded reward draw (`drawSeededReward`), after the pool picks an authored Storied or Mythic artifact on a non-harmful draw, a seeded roll at the ruled share may hand the recipient a generated `found` item of the same band instead. The generator is asked for the recipe's tag filters (new optional `requiredTags`) and the substitution happens only when at least two found cores can carry them; otherwise the authored item stands. Adds one new found-origin knowledge core so the largest recipe family is not shut out by that floor. One trace, one debug lever, rulebook line.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change the share value ruled 2026-09-26 (reports the volume it implies instead).
- Does not change pool assembly, weights, roll order, recipes or their tag filters.
- No generated Mundane or Legendary rewards; no delve-loot, faction-gift or shop minting points.
- Does not touch the legacy encounter-progress reward block in `orchestrator.ts`.
- No new UI component; no change to the artifact sheet.
- No new node or edge type.

## impact_class

Reversible — every behaviour is behind `ITEM_GEN_REWARD_ENABLED` and the share constant; share 0 reproduces today exactly.

## evidence cited

- **Linear issue:** THR-1626 (blocked by THR-1570 — Done)
- **Vision premises invoked:** systemic over scripted; narrative over mechanical perfection
- **UL terms touched:** Rarity Band, Artifact Trait (no new terms)
- **Canon pages consulted:** `Docs/canon/content-objects.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/interface-map.md` (via `scripts/interface-contracts.ts`)
- **Prior plan docs this builds on:** `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md`
- **Census:** `Docs/audits/2026-09-25-living-world-data/readers/reward-minting.ts` + `reward-minting-cover.ts`, outputs `reward-minting-2026-10-02-thr1626.json`, `reward-minting-cover-2026-10-02-thr1626.txt`
- **Rejected approaches considered and dismissed:** a virtual candidate inside the pool; ignoring the tag filter; unconstrained generate-and-retry as the whole answer; a smooth core-count scaling of the share (see brainstorm companion)

## load-bearing decisions touched

- Everything is a graph node/edge — respected: generated rewards are `artifact` nodes with a `possesses` edge.
- No inventing node types — respected: none new.
- Determinism (NFP #3) — own hashed streams; the draw's `rng` not consumed.

## high-impact files touched (from Codesight)

`src/engine/rewardPool.ts` — 20 importers (grep). `src/types/trace.ts` — 121 importers (append-only category registration); the plan carries a Blast Radius section for it.

## kill criteria

- One core above a third of generated rewards in the census re-run → raise the floor to 3 before merge.
- `no_fit` above a quarter of passed rolls → tighten `coreTagReach`.
- The new knowledge core cannot pass the gate → drop it, ship the rest.
- Christian vetoes the share, the floor or the recipe rule → one constant or one clause each.
