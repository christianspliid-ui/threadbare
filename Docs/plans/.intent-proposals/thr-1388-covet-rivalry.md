# Action Proposal — THR-1388 covet rivalry

## intent_quote

> (Christian, 2026-09-02, standing mandate for this session:) "can you also do 1385 and 1386 next so we can speed up testing, then you can continue with whatever you please on the board"

> (THR-1388 Done-when, authored 2026-09-02 from the THR-1383 acceptance run:) "Measured: per seed (42, 99, 123), how many harm-capable templates were *proposed*, *started*, and *completed* in 300 ticks under the live board, and which refusal (`motive_gate`, variety, cap, never proposed) removed them — from the `strategic_candidate_board` refusals trace, not inferred. A named decision: retune (a motive gate too tight now that grudges are the loop's *output* as well as its input; the variety penalty; a destroy-verb desire weight), or accept that harm is rare on quiet seeds and change the acceptance surface for the reactive loop to a seed that has it. If a retune lands: the THR-1383 acceptance re-run on seeds 42 and 99 (300 ticks, non-zero vendettas on both, share ≤ `GRIEVANCE_SHARE_CEILING`), replacing the zero baseline."

## scope (what this plan does)

Measures where harm-capable undertakings die on seeds 42, 99 and 123 (four probes on the real tick pipeline, corrected after a wrong trace key), names the retune — a covet rivalry: a mortal refused a destroy against the same owner `COVET_RIVALRY_THRESHOLD` boards running gains a `hostile_to` edge with cause `covets`, read by the existing motive gate as `rivalry` — plus one content reorder so the two destroys at the tail of `ambition_conquer_territory` are proposed at all. Specifies the acceptance re-run with one permitted threshold retry and a stop.

## scope (what this plan does NOT do — explicit non-goals)

- Does not widen the motive gate, add a motive kind, or touch `BOARD_VARIETY_PENALTY_WEIGHT` or the per-mortal cap — all three were measured as not the cause.
- Does not make a covet a grudge (no `GRUDGE_PROVENANCE` extension) — a covet cannot mint a vendetta by itself.
- Does not seed rivalries at world-gen, and does not escalate to faction-level rivalry.
- Does not move the reactive loop's acceptance surface to seed 123 (recorded as the fallback only).
- Does not touch THR-1300's files (`strategic-packs/factory/`, `strategicActionLifecycle.ts`).

## impact_class

Reversible — one engine rule behind three constants, one edge provenance value, one clause, one list reorder; removable by deleting the counter.

## evidence cited

- **Linear issue:** THR-1388 (and THR-1383, THR-1296 slice 2 for the gate, THR-1309 for the list-position measurement)
- **Vision premises invoked:** `Vision/02-non-negotiables.md` (mortal sovereignty), `Vision/01-core-loop.md` (aftermath rhythm), `Vision/03-design-tensions.md` §2
- **UL terms touched:** grudge, vendetta (existing). **rivalry** is the motive gate's word and is not yet in the UL; **covet rivalry** is new. Both filed as `UL-proposal` THR-1391 (with a Grudge carve-out for the non-injury reading).
- **Canon pages consulted:** `Docs/canon/undertakings.md`, `Docs/canon/rulebook.md` §10.7, `Docs/canon/systems-inventory.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-02-thr-1300-undertaking-factory.md`; the THR-1383 and THR-1296 plan docs
- **Rejected approaches considered and dismissed:** loosen `faction_war` (licenses raids on strangers); leader-as-owner (controlled arm: zero would pass); faction-level covet (escalates to war, moves the envelope); accept quiet seeds (fallback only)

## load-bearing decisions touched

- "Relationships between entities are graph edges, not property fields" — respected: the rivalry is a `hostile_to` edge; the counter that precedes it is a property because it is one mortal's internal bookkeeping, and the plan says so.
- "No inventing node types" — none invented; no new edge type either.

## high-impact files touched (from Codesight)

`src/types/trace.ts` (116 importers per `.codesight/graph.md`) — an additive trace category, the same shape every trace addition takes; the plan carries a `## Blast Radius` section with the row. No other ≥100-importer file.

## kill criteria

The acceptance re-run on seeds 42 and 99 stays at zero culprit-carrying harms after one threshold retry (12 → 6) → the constant is not the lever; stop, keep the reorder, reopen for design with the fallback (seed 123 as the acceptance surface) on the table. Or: vendetta share on either seed exceeds `GRIEVANCE_SHARE_CEILING` → the rule over-supplies; raise the threshold (or design a decay then, with its own phase and trace), never the ceiling.
