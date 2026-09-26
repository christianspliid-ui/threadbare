# Action proposal — the seeded item generator (THR-1570)

## intent_quote

The ticket (filed by the design session that closed the map, 2026-09-24, on Christian's account):

> This issue is its one plan doc. A design session writes it, and the map's decisions are settled input, not questions to reopen.

The THR-1236 rulings it carries (resolution comment, 2026-09-24):

> Items grow around **authored trope cores**, and world tables do the dressing. Each core gets **two or three mechanical signatures**. **Generate Storied and up.** Mundane gear stays in the hand catalog. **Free composition** (Appendix B) is valid but anonymous, and is **rejected as the default**. **An item never promises what the engine does not do.** The honest-vocabulary validator plus the engine read-back is the generator's required gate.

Christian's delegation for the map (attended chat, 2026-09-11, recorded on THR-1227):

> "you are approved to unblock everything here. none of it seems dangerous or problematic or requires an important verdict from me."

And for the design lane (chat, 2026-09-25, THR-1611):

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

The ticket's "Decisions this plan must make": the first minting point (masterworks), the review path, pool share per band as a named constant, art as a deterministic rule over the existing category keys, one UL ruling on *Storied*, and two small substrate changes (a `gen_` prefix; a level on the Storied stamp).

## scope (what this plan does)

Designs a seeded, deterministic runtime item generator (engine modules + authored trope cores + honest-vocabulary validator + plain-word describer) and wires it into its first minting point, masterworks, which are minted with no effects today. It extends `mintMasterwork` additively (optional options; fallback to today's empty item), teaches the completion christening seam (`christenCompletedWork`) to leave a generated item's name in place and report it (revision 1, after the judge's first Revise), excludes minted instances from the reward-template carve (fixing a measured leak), adds `gen_` to the Item content kind, adds an optional level to the artifact-trait stamp, and extends the artifact sheet with *Made by*, *What it does* and *The catch* for generated items. It rules the four decisions the ticket names and files the reward-draw minting point as a deferral (THR-1626) carrying the pool-share value.

## scope (what this plan does NOT do — explicit non-goals)

- No reward-draw, delve-loot or faction-gift minting (named; the first is THR-1626).
- No generated Legendary artifacts (separate content kind with its own trait graph).
- No shops, crafting, item lifecycle or visibility overhaul (the map's out-of-scope list).
- No *What it does* for authored catalog items.
- No per-form art; no new art assets.
- No new node or edge type; no edit to `src/engine/traits.ts`.
- No change to the dice, capability or the THR-1575 forecast window.

## impact_class

Reversible — every engine change is behind `ITEM_GEN_MASTERWORK_ENABLED` or is an optional parameter; the one behavioural change to existing code (the carve exclusion) removes a leak and is covered by a regression test.

## evidence cited

- **Linear issue:** THR-1570 (map THR-1227; inputs THR-1234, THR-1235, THR-1236; deferral THR-1626)
- **Vision premises invoked:** systemic over scripted; narrative over mechanical perfection (NFP #5); the THR-1236 honesty ruling
- **UL terms touched:** *Artifact Trait* (Traits.md:61, cross-linked); new entry **Rarity band** (Mundane / Storied / Mythic / Legendary — 0 hits in the UL today) carrying the *Storied* ruling; seated under the 2026-09-11 blanket delegation for UL seating
- **Canon pages consulted:** `content-objects.md`, `design-governance.md`, `rulebook.md` (§ near line 122), `systems-inventory.md`, `interface-map.md` + `.generated.md`
- **Prior plan docs this builds on:** `Docs/audits/2026-09-24-thirty-generated-items.md` (the prototype write-up); prototype source on branch `proto/thr-1570-item-generator`
- **Rejected approaches considered and dismissed:** free composition (THR-1236 ruling); a `generated_item` node type; shipping the pool-share constant without a reader; renaming the Storied trait or band; stored effect words

## load-bearing decisions touched

- *Everything is a graph node/edge* — respected: a generated item is an `artifact` node; the maker stays `craftedBy` + the existing `possesses` edge.
- *No inventing node types without verification* — respected: no new type.
- *Relationships are edges, not property fields* — `provenanceConcepts` is a display declaration for the sheet (UI Law clause b), not a traversed relationship; `craftedBy` predates this plan.
- *The world graph is mutated in place* — the mint happens inside completion paths that already touch the world.
- *Engine caches owned per session* — no new cache.

## high-impact files touched (from Codesight)

None ≥100 importers. Measured by import grep on 2026-09-26: `contentQuery.ts` 30, `strategicGraphOps.ts` 31, `content-objects.ts` 21, `artifactTraits.ts` 9, `ArtifactSheet.tsx` 2. `src/engine/traits.ts` (hundreds) is deliberately not edited. `src/lib/prng` (101) is imported, not edited.

## kill criteria

- The gate test cannot reach zero read-back failures for the ported cores → the vocabulary is shrunk to what reads back, and a core that cannot survive is dropped, not faked.
- A seeded 150-tick run shows any `item.generate_fallback` → a core or context bug; fix before ship.
- Christian vetoes the band rule, the Storied ruling or the pool-share value → each is one constant or one UL paragraph; revise on THR-1570 before build, or on THR-1626.
- Christian reads a generated sample and calls it flat → the review path (CLI, thirty items) exists precisely so cores are re-authored, not the machine.

## explicit user sign-off

Not required (Reversible). Delegations quoted above.

## author notes for the judge

- The lane chose masterworks' band from the final checkpoint band; the lifecycle path has it (THR-1428), the cell path may not, so it defaults to Storied. That asymmetry is intended and stated.
- "Pool share per band: a named constant" is honoured by ruling the value and shipping it with its reader (THR-1626), because no reader exists at the masterwork point. This is the plan's one knowing deviation from the ticket's literal wording; the brainstorm companion (decision 2) weighs the alternatives.
- The prototype's vocabulary table is stale by three shipped shapes; the plan makes the read-back authoritative rather than transcribing the table.
- Numbers quoted (3–4 masterworks per 150 ticks; 26 of 41 disguised conditionals; 38/38 clean read-back) come from the census file and the prototype write-up respectively, not from a fresh run.
