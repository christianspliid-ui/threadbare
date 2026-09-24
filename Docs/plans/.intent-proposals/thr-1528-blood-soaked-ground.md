# Action Proposal — Blood-soaked ground (THR-1528)

## intent_quote

> take a look at the linear board and the wayfinder map and see how far we got last night, then lets finish off what wasn't done and progress the next designs

(Christian, chat, 2026-09-24 07:44 local.) Two sources make this ticket both "what wasn't done" and a "next design":
- **The Physical Conflict map** (THR-1258), charted with Christian, lists among the fight's six parts *"marks left behind: conditions, scars, Storied weapons, cleared or blood-soaked lairs"* (the THR-1263 resolution; Christian approved the direction on 2026-09-23). None of the six plans merged last night delivered *blood-soaked*.
- **THR-1528** itself was staged by the orchestrator as a waiting design (the briefing listed it), filed from traits wave 2 (THR-790), whose ticket named `#blood-soaked` and declined to fake it.

## scope (what this plan does)

The plan adds a record, one `event` node per battle (and, in slice 2, per fight), tied to its outer-tier place by `occurred_at`, with a last-tick stamp on the place. From those records it mints a fifth location trait, *Blood-soaked*: it enters at one battle or three fights inside a ten-day window, and lifts when the bloodshed ages out. Readers:
- the location page's existing condition row, through a movement-tax row;
- the encounter pool, through four tag rows;
- the place detail page's MEMORY section, which names the battle;
- a chronicle line on mint.

Slice 1 (battles) was blocked by THR-1563, the siege-deletion bug, which merged on 2026-09-24 (PR #2000), so slice 1 is unblocked. Slice 2 (fights) is blocked by slice 1 and by FB7, which ships the first fight.

## scope (what this plan does NOT do — explicit non-goals)

- It does not read `deathCount` (the ticket's falsifier).
- It does not surface war news in general. That is THR-1564, which may later read this record for its battle lines.
- It does not add a hex-map signifier for location traits.
- It does not add a step modifier for *Blood-soaked* (rejected: a feedback loop at lairs).
- It does not create a `battle` world-object kind.
- It does not fix THR-1563 (merged separately) or THR-1566 (a killed commander kept as deceased; the record handles both states).
- It does not backfill records for battles fought before it lands.

## impact_class

Reversible. It adds two event types, a trait and its rows, and two optional rule fields that the four existing rules do not set. Removing the rule stops the minting, and the records are inert history.

## evidence cited

- **Linear issue:** THR-1528 (and its parent THR-790, and the Physical Conflict map THR-1258 / THR-1263 for the fight half).
- **Vision premises invoked:** `Vision/00-north-star.md:43` ("a story the player can tell in prose"), `:57` ("consequences that do not reverse"), `Vision/02-non-negotiables.md:21` (narrative over mechanical perfection).
- **UL terms touched:** Location Trait (`Traits.md:37-49`, list extended); Event (world-objects Event row, `eventType` values added).
- **Canon pages consulted:** `Docs/canon/rulebook.md:421` (the "No blood-soaked" sentence this replaces), `Docs/canon/encounters.md` § The pool reads the place's traits, `Docs/canon/world-objects.md` (Event row), `Docs/canon/rulebook-quick-reference.md`.
- **Prior plan docs this builds on:** `Docs/plans/2026-09-21-thr-790-traits-wave-2.md` (the four minted rules; the declined word), `Docs/plans/2026-09-23-fight-block.md` (the dispatcher FB2 shipped), `Docs/plans/2026-09-21-thr-1479-appointment-primitive.md` (the event-writer precedent).
- **Rejected approaches considered and dismissed:** `deathCount`; a counter property; counting per-step fight events; a `battle` kind; an Iron step bonus.

## load-bearing decisions touched

- **"Everything is a graph node/edge"**: the record is an `event` node with `occurred_at` and `participated_in` edges. Faction names appear only in a display sentence, not as relationship properties.
- **"Agent position is a three-tier model"**: every record resolves to the outer-tier Location (`resolveToParentLocation`), unlike `deathCount`.
- **"The world graph is mutated in place"**: `touchWorld` after each write.
- **"No inventing node types"**: none. Two values of an existing discriminator.

## high-impact files touched (from Codesight)

`src/types/trace.ts` (≥100 importers): additive union members. The plan carries a Blast Radius section.

## kill criteria

- If `census:location-traits` reads UNMINTED on both seeds at 200 ticks after S1, battles are rarer than the window assumes. Widen `BLOOD_SOAKED_WINDOW_TICKS` or lower the enter threshold (constants), and report.
- If more than a quarter of a world's settlements carry it at once, the weights are too generous. Tune the constants.
- If tick cost rises more than 2% at medium, the stamp gate is not doing its job. Profile the rule.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- A research agent read the battle path end to end. It found the siege-deletion bug (THR-1563) and the trace-built war news (THR-1564); the design session verified both at runtime or in source and filed them.
- **The load-bearing ordering:** the battle record must be written after the aftermath (to know the result and severity) but before the battle node's removal (to know the place). `applyAftermath` returns a small summary to make that possible.
- **The chronicle significance is deliberately higher** than the other minted traits', because battles are otherwise invisible in normal play today. The brainstorm names the revisit trigger (THR-1564 landing).

## revision notes (second judge pass)

The first pass returned Revise (5 required, 6 advisory). All eleven are applied:
- **F1:** Interface impact now extends the two contracts that exist, `location-traits-shift-encounter-pool` (`:428`) and `location-condition-taxes-movement-and-gates-templates` (`:2179`); the Wiring section carries the Player controls and Prose lines.
- **F2:** a third optional rule field, `chronicleSignificance`, routes the mint line's significance (`phaseLocationTraits.ts:239`); a test pins the four rules at 0.4.
- **F3:** `mutual_destruction` has its own row in the outcome table (both commanders `lost`) and its own summary; the aftermath summary names no victor for it.
- **F4:** THR-1563 merged (PR #2000) and is Done; its commander item had already moved to THR-1566 before the build. The record writes a fallen commander's edge whenever the node survives, and the test covers both states.
- **F5:** Vision citations are now the premises the file states (`00-north-star.md:43`, `:57`).
- **F6:** a siege records at `bs.settlementId`.
- **F7:** the zero-clash rout exclusion and the "first in the list" trade-off are stated.
- **F8:** rulebook `:421`.
- **F9:** the MEMORY line is asserted headlessly in `detailPageGenerator.test.ts`; the exemption stands under THR-688 rule C.
- **F10:** the kill criteria are in the plan.
- **F11:** the chronicle significance goes back to 0.4 when THR-1564 lands, owned by THR-1564's executor; recorded in the plan and on THR-1564.
