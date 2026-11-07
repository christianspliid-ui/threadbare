# Action proposal — 2026-11-08-thr-2075-a-finished-work-says-what-was-done

## intent_quote

There is no live user ask; this is a bug ticket (agreed under the ways-of-working bug clause), filed by
tb-opus-pickup 2026-10-27. The originating words are the ticket's own:

> For a cell that makes nothing, the card says something false. … **"Kael Thornweaver has completed The Hollow
> Bell. It stands in the world now."** He picked up a relic; he did not build it.

> **Done when:** a completion card for a non-create cell shows the cell's completion line (or a verb-keyed
> consequence), not "It stands in the world now". A jsdom render test covers `claim × Item` (the echo line) and
> one `create` cell (unchanged).

The orchestrator's staging comment (2026-11-07 ~21:30Z) adds:

> Prefer reading what exists over authoring a parallel table (systems-inventory: extend before green-field).
> Keep `create` cells unchanged. Decide the fallback when a cell has no completion line.

## scope (what this plan does)

Adds one helper to the moment card's view model (`momentCardModel.ts`) that, for a completion record whose
template is a non-`create` cell, returns the record's own `label` (the cell's completion line, already written
by the lifecycle) as the card's consequence line, with a named verb-neutral fallback constant in
`moment-card-content.ts` when the label is empty. `create` cells and non-cell legacy works keep today's line.
Adds unit and jsdom render tests.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change the opening line or the title of the card.
- Does not author or edit per-cell completion prose.
- Does not change the lifecycle, the moment record type, or any engine write.
- Does not change `MomentCard.tsx` layout, type or colour.
- Does not change other moment classes (started, at_cost, complication, fork, abandoned, afflicted, peril).

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-2075
- **Vision premises invoked:** none changed; UI Laws `Docs/design-system/laws.md` (17, 21, 56)
- **UL terms touched:** none new (undertaking, cell, verb are existing terms)
- **Canon pages consulted:** `Docs/canon/undertakings.md`, `Docs/canon/prose.md` § Narrator mode, `Docs/design-system/laws.md`
- **Prior plan docs this builds on:** THR-1299 slice 3 (moment cards), THR-1937 (cell outcome lines), THR-1392 (cells)
- **Rejected approaches considered and dismissed:** verb-keyed table on the card (duplicates existing lines); engine-side `cellVariant` on the record (kept as kill-criteria fallback); rewording the opening (out of Done-when)

## load-bearing decisions touched

None. No graph, cache, position or awareness change.

## high-impact files touched (from Codesight)

None with ≥100 importers. `momentCardModel.ts` and `moment-card-content.ts` are narrow modules.

## kill criteria

Import cycle from `views/stage` to `strategicActionCandidates` → put an optional `cellVariant` on the moment
record at write time. Debug lever cannot start `cell.control_claim.item` → any non-create cell.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

Measured on `origin/main` `04ab1fb2`: the lifecycle writes `cellCompletionProse(...).text` into the moment's
`label` for every cell completion (`strategicActionLifecycle.ts:1228-1234`), and `buildMomentCardModel` never
reads `record.label`. The Done-when allows either "the cell's completion line" or "a verb-keyed consequence";
the plan takes the first. `change:raise` is routed to its own line too (one rule: only `create` keeps the
generic sentence) — a judgement call recorded in the brainstorm's Tensions.
