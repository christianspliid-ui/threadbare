---
lane: daily-backlog-grooming
run: 2026-08-18
promoted: 0
filed: 0
resolved: 0
swept: 3
canceled: 0
newFindings: 2
needsChristian: true
---
# Backlog Grooming — 2026-08-18

## Needs Christian
1. **Two encounters, one yes/no — [THR-1130](https://linear.app/threadbare/issue/THR-1130).** Ask went live 2026-08-17 19:05, waiting ~12 h. Play [The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) and [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) — worth meeting twice? *Highest leverage on the board: 9 more encounters are sequenced behind it.*
2. **A feel call — [THR-1168](https://linear.app/threadbare/issue/THR-1168).** Should committing nudge cards carry ~1.6 s of held breath before the outcome? *Recommend no — unskippable on every commit turns tense into waiting; the timings get recorded so it's recoverable.*
3. **Shelf holds zero product work; the fix is upstream.** Ready for Dev is 2 Low deferrals. Every High/Urgent item sits in Todo needing a design pass. *Recommend giving a design session [THR-1156](https://linear.app/threadbare/issue/THR-1156) (Urgent) — tidying downstream cannot fill an empty shelf.*
4. **One attended session clears a growing debt — [THR-1133](https://linear.app/threadbare/issue/THR-1133).** 19 owed 1920×1080 captures, one `npm run dev` sitting. Cannot shrink unattended; grew from 5 passes to 9 since 08-16. *Recommend bundling into your next attended session.*
5. Linear's native GitHub auto-assign un-parked THR-1168 again overnight (impediment #657). Settings toggle already in `Design/user-actions.md`; noted only because it re-broke a park this run.

## Work in flight
- **THR-745** — claimed 07:12Z, active; filed THR-1169 as its excluded-scope deferral. Healthy.
- **THR-1130** — parked correctly (`assignee: null` ∧ `In Dev`). Batch-1 re-pass shipped and deployed ([PR #1528](https://github.com/christianspliid-ui/threadbare/pull/1528)); 6 of 15 retrofitted, camp seven + sequels remain, held on the verdict above.
- **THR-1168** — parked correctly. Registration cue retired and shipped ([PR #1534](https://github.com/christianspliid-ui/threadbare/pull/1534)); tension reveal held on the feel call above.

## Technical gates resolved this run
None. Both parks are correctly shaped and both asks are genuinely Christian's — a play verdict and a feel call, neither agent-resolvable — so neither was closed.

## Counts by state
In Dev 3 (1 active, 2 parked) · Ready for Dev 2 · Todo 17 · In Design 1 · Implementation Planning 0 · Idea 70.

## Problems found and fixed
- **Fixed:** project *Attention Tier Model* was `Now` with 17 of 18 issues Done and its remainder (THR-59) parked in Idea — no active work. Moved to `Next`, verified on the write. Only Now/Next project whose state contradicted its issues.
- **Flagged:** project *Plan Cross-Linking Infrastructure* (Idea, Low) holds **zero issues** since 2026-04-23. Harmless in Idea; delete at a retro, not by a lane.
- No orphans — every issue in every queried state carries a project. No stale design work — THR-790 is the only `In Design` item, 3 days old. Both Ready-for-Dev deferrals carry coordination blocks and Done-whens; neither moved.

## Materiality sweep
Swept 3 in-scope tickets (`Infrastructure`/`Improvement` or project Continuous Improvement, in Ready for Dev or Todo). **Canceled 0, consolidated 0** — the judgment ran and nothing failed on magnitude, which reads as the 2026-08-11 sweep of 9 having held.
- **THR-830** *(stands, doubt recorded)* — `EDGE_SCHEMA` declares `trades_with` actor→actor while the only production producer writes location→location; warnings on every route, and THR-619 nearly built against it. Q1 is a near-miss rather than a measured hour, so it sits close to the bar — but Q2 plainly fails to fire: producer-vs-fixture triage across 10 files plus a decide-first is not a fix-in-passing.
- **THR-1134** *(stands)* — not paperwork, not an N-th instrumentation layer. No state serialization exists anywhere and the debug bridge is stripped from prod, so today Christian can only send a screenshot of a wrong-looking run. A tool for the human, not the lanes inspecting themselves.
- **THR-1114** *(stands, doubt recorded)* — two templates carry a `sphereAffinity` outside the twelve. Zero player-visible harm today so Q1 is weak, but picking the replacement Sphere is a cosmology call read by prerequisites and scoring, not a rename. Fair future candidate for folding into an adjacent cosmology ticket.
- **Out of scope by the predicate, noted anyway:** THR-1133 reads as process work but carries neither label and sits in Encounter Experience. Its problem is reachability, not worth — see Needs Christian 4.

## Pipeline status
**Next pickup: THR-830** — the only Ready-for-Dev item the unattended lane can discharge (THR-1133 needs an attended session by its own block). After it merges the claimable shelf is **zero**. Closest behind: **THR-1155** and **THR-1134**, both High, both Todo with three-pillar scope already written — each needs a design pass and a coordination block, not new discovery. The `wayfinder:*` nodes under THR-1156 correctly never enter Ready for Dev.
