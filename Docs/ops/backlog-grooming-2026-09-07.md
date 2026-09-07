---
lane: daily-backlog-grooming
run: 2026-09-07
promoted: 0
filed: 0
resolved: 0
swept: 2
canceled: 0
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-09-07

## Needs Christian
**Linear is back** — Friday's connector fault cleared on its own; this run made reads and a write. Three asks are waiting, and they are not equal:

1. **Run the retrofit batch.** *"Batch 2, run the six"* on [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) puts content work on an empty shelf the same hour, with no design session in the way. It also carries one yes/no: is repair-in-place still right for the camp six, or has that band earned re-rolling from fresh premises? **Recommend: approve the brief, keep repair-in-place** — the encounters are structurally sound and a re-roll is a bigger ticket than the batch. This is the highest-value answer you can give today; the orchestrator reached the same conclusion independently at 06:34Z.
2. **The retirement list of the 64** — [THR-1392](https://linear.app/threadbare/issue/THR-1392/undertakings-as-verb-object-type-replace-authored-kind-row-variants) slice 4b waits on your review before anything is deleted. 60 absorbed by a cell, 4 retire outright.
3. **The division-rule mock** — [THR-1398](https://linear.app/threadbare/issue/THR-1398/the-division-rule-category-picks-the-verbs-reach-picks-the-objects) has a one-page artifact attached (two tables, three worked callings) posted this morning. **Note it may not reach your briefing:** it is `Todo` + assigned-to-you, which is not the park shape (`In Dev` ∧ unassigned ∧ `Parked`) the briefing matches. Flagged, not reshaped — it is a wayfinder grilling ticket and its state is correct.

**Correction my lane owes you:** the verdict standing on [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — *"unassigning it frees the slot"* — is wrong, as `tb-orchestrator` run g established. Only the `Parked` label frees it today. **I did not park it and did not comment on it:** a bot comment there resets its staleness clock and silences the one automated nudge, and the choice ("I'll take it" / "park it") is yours, not a technical verdict. Fixed at my source instead, so the lane stops repeating it.

## Work in flight
- **THR-1392** (Parked, unassigned) — slice 4a shipped: verbs renamed, registry redrawn on the world-object catalogue, the grid generated and gated. Slice 4b = the whole remainder, waiting on ask 2.
- **THR-1130** (Parked, unassigned) — batch-2 brief drafted and merged (PR #1811). Batch has not run; waiting on ask 1.
- Both parks correctly shaped and recently maintained. **Nothing is stalled** — no In Dev item is a dead session.

## Technical gates resolved this run
- None open. Both In Dev gates are Christian's, not agent calls; routed above rather than resolved.

## Counts by state
Idea 70 · Todo 52 · In Design 2 · Implementation Planning 0 · **Ready for Dev 0** · In Dev 2 (both Parked, zero live).

## Problems found and fixed
- **Fixed — THR-1222 named a superseded brief.** It pointed at `retrofit-batch-2-brief.md` (the 08-24 draft). **Both briefs exist on `main`**, so the stale path resolves and reads plausibly — the trap is that it predates three rulings the live brief is written to and scopes *seven* templates where the live one scopes *six*. Description repointed at `2026-09-04-retrofit-batch-2-brief.md`; write verified by re-query.
- **Fixed — stale `Docs/ops/tick-cost-trend.tsv` residue** in the home tree, four rows behind the `ops` copy. Deleted (ops is strictly ahead, so nothing was lost). Carried from 09-06's "no residue" line, which had gone stale.
- **Zero orphan deferrals** in `src/` — every `TODO`/`DEFERRED` carries a `THR-` id. **Zero orphan issues** — every open issue has a project. No state/priority contradictions; no In Design item past 7 days (both at 4d).
- **Not fixed, flagged third run running:** the "Plan Cross-Linking Infrastructure" project has **zero issues, ever, including archived**. Marking it Done would be a vacuous pass on an empty population; it wants deleting, which is not this lane's call.

## Materiality sweep
**Swept 2, canceled 0, consolidated 0** — the in-scope population is genuinely two tickets, because `Ready for Dev` is empty and only two `Todo` items carry `Infrastructure`/`Improvement` or sit in Continuous Improvement. Both stand:
- **THR-1256** (flip `check:guidance-freshness` to blocking) — **its review window opens tomorrow**. Kept, with the sunset rule attached: at that review it either cites a real catch or is deleted; the burden is on keeping.
- **THR-1134** (shareable game-state snapshot) — filed by Christian from an attended chat, three-pillar, concrete Done-whens. It has no literal cost/benefit line, and I am **declining to demote it to Idea** on that: it is a director-requested capability, not the process ticket the minting bar targets, and demotion here would be the rule obeyed against its own purpose.

Neither the queue nor the sweep is the problem this week — **32 of 35 Ready-for-Dev items were Low process work on 2026-08-10; today the count is zero.** The throttle worked.

## Pipeline status
**Ready for Dev hit zero because the executor lane cleared it, not because anything neglected it** — 19 issues completed since 09-04, 59 commits on `main`. This is a **supply** problem, and per the throttle the answer is never to prune harder.

Two things gate supply, and `tb-orchestrator` has both correctly diagnosed and needs no help from me:
- **T2 design staging is barred** — `ORCH_MAX_IN_DESIGN` is 1, and an *assigned* stale item counts toward it forever, so the tier that exists to refill an empty shelf has no automated path back. Logged for the weekly retro (scheduled lanes do not file process tickets). Cost line: *~one executor run to fix; not fixing costs the design-staging tier entirely, currently 23 days against an empty shelf.*
- **Everything else executable is behind a Christian gate.** 22 of 52 `Todo` items are `wayfinder:*` (HITL by rule); the two highest-priority non-wayfinder items, THR-1156 (Urgent) and THR-1155 (High), both self-declare design-first in their own bodies.

**Recommended next pickup: none promotable — and that is the finding.** The nearest buildable work is **THR-1222** (content, High, unblocked the moment ask 1 is answered). The nearest thing needing no answer at all is **THR-1402**, the two-seed cells census — engine measurement that produces the very picture asks 2 and 3 need, and it is `wayfinder:prototype`, so T1.5 owns whether it moves, not this lane.
