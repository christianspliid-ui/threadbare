# Action proposal — 2026-10-13-thr-1757-master-work-reaches-masters

## intent_quote

THR-1757 was filed by the pickup lane from THR-1742's measurement (Christian's Linear user; the lane acts as him). Its own words:

> ## The decision (design lane)
> 1. **Content route** (THR-1627 D4 staging + stop rule). This means more master everyday encounters, batched 1 per reach (8 per batch) through the factory line, with a re-measure after each batch using the reader.
> 2. **Cap route**. Add a reserve phase in `capWithDiversity` for work in a band the decider stands in […] It is a structural shortlist reserve. It is not a difficulty floor and not actor-scaled difficulty (THR-1575 standing rule), but the design lane must rule whether it counts as "tuning to make the rung pass".

> ## Done when
> * The route is chosen, with its reason recorded on this ticket.
> * The skipped rung `masters attempt harder content than experts` […] is un-skipped with its condition unchanged (master mean attempted difficulty > expert's on seeds 42 and 99), **or** the content batches are filed with the reader as each batch's gauge.
> * Nothing is tuned to make the rung pass (no floors, no actor-scaled difficulty).

Christian's standing delegation for this lane, chat 2026-09-25:

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

## scope (what this plan does)

Chooses the content route (D1) and rules the cap reserve out as tuning-to-pass, citing THR-1687 plan D2. Re-measures the gap on today's `main` (it grew: q 0.215 → 0.157, on-board 19.5% → 13.9%) and a keep-all ceiling probe (53.4%). Stages up to three batches of eight master everyday encounters (K = 2, 3, 4) with a stop rule and guard rails, then a design checkpoint (S4) that decides whether to continue content or measure a band-neutral cap-size lever. S1 (this ticket's execution) adds a `measure:master-band` npm alias for the existing reader, authors batch 2, raises `EVERYDAY_FLOOR_BY_BAND.master` to 2, and adds a canon note on dilution under a fair draw. Files S2, S3 (batches 3, 4) and S4 (checkpoint) as tickets.

## scope (what this plan does NOT do — explicit non-goals)

- No change to `capWithDiversity`, its reserves, its hash draw, or any cap constant.
- No change to scoring, the top-five board, or the choice window.
- No difficulty floor and no actor-scaled difficulty.
- No commitment beyond K = 4; the 48–56 encounter projection is not adopted.
- No UI change; no new node, edge, trace or GameState field.
- Does not decide the band-neutral cap-size question; S4 may open it.

## impact_class

Reversible — docs now; later slices add content files and change one KPI constant, all revertable.

## evidence cited

- **Linear issue:** THR-1757 (from THR-1742)
- **Vision premises invoked:** `Vision/02-non-negotiables.md` (narrative over mechanics, nothing tuned to a KPI); the living-world north star (`game-design-direction`)
- **UL terms touched:** none new. "Window fit", "everyday board" stay KPI-internal labels.
- **Canon pages consulted:** `Docs/canon/encounters.md` (§ Picking a step's difficulty, coverage scoreboard), `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/process.md` rule 4
- **Prior plan docs this builds on:** `Docs/plans/2026-10-01-thr-1687-cap-local-order.md` (D2 rejects band-aware reserve; D4 flip), `Docs/plans/2026-09-29-thr-1627-content-above-novice.md` (D3 brief, D4 staging + stop rule), `Docs/audits/2026-10-06-thr-1742-master-band.md`, `Docs/plans/encounters/master-everyday-brief.md`
- **Rejected approaches considered and dismissed:** cap reserve for own band (THR-1687 D2; tuning-to-pass); rarity/instance weighting of the draw (preference by proxy); widening the top-five board (decision board's business); raising cap size (band-neutral but unmeasured perf bound — deferred to S4, not dismissed).

## load-bearing decisions touched

- "Engine caches are owned per session" — untouched.
- None of the CLAUDE.md load-bearing decisions changes. The THR-1687 D2 ruling (preference in scoring, never in the cap) is a plan-level ruling this plan preserves.

## high-impact files touched (from Codesight)

None ≥100 importers. Later slices touch `src/engine/kpi/kpiConstants.ts` (one value), new files under `src/data/encounters/`, the encounter registry, and one test.

## kill criteria

See plan § Kill criteria: measured on-board step under half the projected step → stop, run S4 early; guard-rail rung red or master success out of band → stop, S4; playtest reads new commissions as grind → Christian's call, series stops.

## explicit user sign-off

N/A — Reversible.

## author notes for the judge

- The ticket's Done-when bullet 3 says "no floors". This plan raises `EVERYDAY_FLOOR_BY_BAND.master`. That constant is the coverage scoreboard's per-reach content-count floor (how many master templates each reach must have), not a difficulty floor on rolls; the ticket's "no floors" means difficulty floors (THR-1575 standing rule). Please check that reading.
- The reader's `meanDiff` vs the invariant test's computation: same KPI, same world construction per the audit's Method; plan tells the executor to trust the test on disagreement.
- Seed 99 is 0.001 under the line today; a single batch may tip it, which is why the stop rule needs 42 and 99 both.
- I chose a checkpoint at K = 4 instead of pre-filing to K = 8 because the gap grew 27% in a week without any cap change; committing 56 encounters on a projection that moves under us seemed worse than a measured pause.
