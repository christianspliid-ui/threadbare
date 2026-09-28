# Action proposal — Finish the encounters the player actually meets (THR-1634)

## intent_quote

The originating agreement is Christian's, on the analysis the map was charted from (THR-1589, 2026-09-25):

> "I agree with your analysis. log it as a design map, and make sure you dont forget the details of this analysis"

The ticket this plan answers (THR-1634, filed at the map's close as carve-up plan 5 of 7):

> **Done when:** a plan doc in `Docs/plans/` is merged via a `docs/plan-*` PR, passes intent-judge and design-audit, covers all three pillars, and names slice 1 as Ready-for-Dev-sized work; the ticket is handed off to Ready for Dev with a coordination block.

> Re-rank on current `main` after that plan's first slice ships; do not author against the 2026-09-25 ranking.

The settled input it draws on, THR-1598's resolution (orchestrator T1.5, 2026-09-25, veto invited, not vetoed):

> Finish templates where the dice land. The order is top-10 (47%), then The First's other draws, then ranks 11–20, each getting at-cost prose and a dealt hand. This bulk work is unsampled. New templates go through the factory 2-of-6 sample after the reach fixes. Also make the top 5 fire less often.

And the THR-1633 closeout comment on this ticket (2026-09-27):

> Re-rank from a fresh `readers/attended.ts` + `readers/reach.ts` run after THR-1633's slices land, rather than from THR-1598's list.

## scope (what this plan does)

The plan re-ranks the fired encounter corpus on today's `main`. It then specifies three content slices, each a predicate with a snapshot, that complete fired templates:
- at-cost, critical-success and critical-failure afterimages on every step;
- a `deal` declaration on every step;
- losing-band endings on aftermaths that already exist.

It also adds three small engine-side pieces:
- E1, a converter passthrough so `deal` reaches templates built from `encounter-content.ts`. This is a real defect found while designing.
- E2, a dealing spike with render, determinism and tick-budget checks.
- E3, a growing ratchet test that pins what "complete" means.

This ticket carries S1 (ten templates). S2 and S3 are filed as blocked follow-ons.

## scope (what this plan does NOT do — explicit non-goals)

- No new encounter templates. The +40 hamlet/town and ruin families stay on the factory path, which is a separate brief.
- No new aftermath on templates that lack one. That is full-contract factory work.
- No new damper or weighting change. The existing world-wide novelty damper already holds the top template at 3%.
- No `nearMissAfterimage`. Near-miss is paid through dealt band fragments per the linear spec.
- No change to scoring, resolution, tick phases, graph or UI components.
- No change to the five `encounter.slice.*` templates under Christian's playthrough.
- No rewards-variety work. `starter_revelation` comes from a starter item, not an encounter.
- Christian samples nothing (THR-1598's bulk-path policy).

## impact_class

Reversible. Content fields on existing templates, one optional-field passthrough, and one new test file. Each can be reverted by PR, and absent fields reproduce today's behaviour.

## evidence cited

- **Linear issue:** THR-1634. Inputs THR-1598, THR-1590 and THR-1633. Map THR-1589.
- **Vision premises invoked:** every band pays off (five-band ladder, THR-772); influence, never authorship (nudge model); nomadic variety (encounter-priority feedback).
- **UL terms touched:** Dealt Hand, Deal Declaration, Band Fragment, Composition Contract, Aftermath (all existing, Encounters shard). No new term. The plan uses the UL's own word, *afterimage*, for the per-band step text.
- **Canon pages consulted:** `Docs/canon/encounters.md`, `Docs/canon/prose.md`, `Docs/canon/process.md`, the rulebook quick reference.
- **Prior plan docs this builds on:** `Docs/plans/2026-09-27-thr-1633-written-encounters-land.md`, `Docs/plans/2026-08-25-thr-1247-dealt-hands.md`, `Docs/plans/2026-08-08-encounter-factory-workflow.md`.
- **Rejected approaches considered and dismissed:** keeping THR-1598's list (stale); a top-five damper (already present); per-step near-miss prose; full bespoke hands; bringing 30 legacy templates up to the full contract. See the brainstorm companion.

## load-bearing decisions touched

- **Everything is a graph node/edge:** untouched. There are no new relationships.
- **Encounter awareness is hex-granular:** untouched.
- **The world graph is mutated in place:** untouched. No cache or selector.
- **Rejected: pure template-based prose / pure LLM content.** The prose is authored within the existing hybrid engine (templates plus enrichment tokens), by the doctrine.

## high-impact files touched (from Codesight)

None at 100 or more importers. `src/data/encounter-content.ts` has 89 importers (grep count), and E1 adds one optional field to a private raw type and one passthrough line. The plan names the shipped-object test that pins it.

## kill criteria

In the plan's § Kill criteria:
- E2 render fails: ship prose only and file the defect.
- E2 determinism fails: stop.
- E2 tick budget fails: ship prose only.
- Any template above 4% of attended firings, or a top-10 share above 0.30 after a slice: report before the next slice.
- A new register `fail`, or a critic flag of "reads like a clean win": rewrite before merge.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- **The ranking substitution is the main judgement call.** The ticket names THR-1598's slices, but the ticket body and the THR-1633 comment both say to re-rank first. The fresh ranking replaces six of ten slice-1 templates. The *rules* (order, content per slice, bulk path, stop after three) are carried over unchanged.
- **"Make the top five fire less"** is answered with no work, on measured evidence: the top template is at 3.0%, under the damper's 4% target. I would rather the judge check that reasoning than accept a second damper.
- **"Band endings" is narrower than it might read.** Only 1 of S1's ten templates (6 of the top 40) has an aftermath. For the rest, the ending is the afterimages. The alternative, minimal aftermaths, triggers the full contract, and the brainstorm companion explains why that is factory work.
- **Suggested model is fable,** on Christian's 2026-07-30 ruling that the doctrine-holding model authors prose.
- **All numbers come from readers run on `c077dd9a`.** `completion.ts` is new, and its first version under-counted branching steps; it was fixed before any number was quoted.
