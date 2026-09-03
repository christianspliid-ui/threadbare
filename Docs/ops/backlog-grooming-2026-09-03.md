---
lane: daily-backlog-grooming
run: 2026-09-03
promoted: 0
filed: 0
resolved: 2
swept: 2
canceled: 0
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-09-03

## Needs Christian
**1. NEW — you asked for the incident-capture button on 16 August and nothing has moved since.** [Shareable game-state snapshot](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) — the one-button capture that lets you hand a weird-looking run to an agent instead of a screenshot and a sentence. You filed it yourself, it is High, and it has sat untouched in `Todo` for **18 days**, blocked by nothing; it just needs a design pass nobody ran. **Recommendation: say whether you still want it** — if yes it goes to the front of the design queue, if not it should be closed rather than kept warm.
**2. Retrofit Batch 2 still needs your yes** — carried, unchanged, and now the only thing that would refill the build queue. [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine): seven camp-and-devotion encounters, [brief written and merged](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md). **Recommendation: yes.**
**3. Traits wave 2 — same one-word question, one thing newly settled.** [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) has been in the design column **18 days**. Its description says it is blocked; **that blocker closed on 26 July** and I recorded so on the ticket. Only your intent holds it. **Recommendation: if you are not getting to it, say so and it gets set aside.**

## Work in flight
- [THR-1392](https://linear.app/threadbare/issue/THR-1392/undertakings-as-verb-object-type-replace-authored-kind-row-variants) (verb × object undertakings) — **healthy, claimed 07:13Z, minutes old.** Design pass, your three chat decisions and the four-slice handoff block all landed this morning; slice 1 not yet open. This is the entire executor WIP.
- THR-1300 · THR-1130 · THR-1133 · THR-1168 — `In Dev` but `Parked` and unassigned. Correctly parked, not stalled. No action.

## Technical gates resolved this run
- **THR-790** — verified its stated blocker THR-786 reached Done 2026-07-26 (PR #899). Recorded on the ticket as satisfied; the block line was stale by 5½ weeks.
- **THR-1002** — answered yesterday's stale-`In Design` sweep, which offered `Parked` or `Todo`. Took neither: `Todo` discards live T2 staging work, `Parked` buries an agreed director directive. Verdict recorded — the stall is design-session supply, not ticket hygiene.

## Counts by state
Idea 68 · Todo 45 · In Design 2 · Implementation Planning 0 · **Ready for Dev 0** · In Dev 5 (1 live, 4 Parked).

## Problems found and fixed
- **Zero orphans** — every issue across all six queried states carries a project. No project/priority contradictions: all six `Now` projects are High.
- **Two design tickets stalled on one missing input.** THR-790 (18.4 d) and THR-1002 (15.2 d) are both agreed, director-directed and undesigned. Not two problems but one: no attended `design-session` has been run. THR-1002 needs nothing from Christian — an attended session can simply claim it.
- **Empty shell project** — `Plan Cross-Linking Infrastructure` (Idea, Low) holds **zero** issues, last touched 2026-04-23. Not "all issues Done", so the close rule does not fire; flagged for the weekly retro to archive, not acted on.
- **Roadmap cross-reference: 0 filed.** Every `.planning/ROADMAP.md` Future Work strand maps to a live project or an existing Idea ticket (phases 3–5 → THR-54/55/56; M3, Social Systems, Codex → their own projects). Filing TB-095…099 from that hand-maintained prose would be the THR-614 green-field failure the file's own warning names.

## Materiality sweep
**In scope 2 · canceled 0 · consolidated 0.** Ready for Dev is empty, so scope was the two `Todo` items labelled `Infrastructure`/`Improvement` or in Continuous Improvement. THR-1256 (flip `check:guidance-freshness` to blocking) **stands** — it *is* the sunset review the throttle prescribes and its own review date is 2026-09-08, five days out; cancelling would delete the decision, not make it. THR-1134 **stands** — Christian's own request, not agent-minted process work, so the demotion rule does not reach it. Neither warrants a Rule-0 demotion to Idea. **The finding is that there was nothing to cut:** one cycle after the 2026-08-11 sweep cancelled nine tickets, 2 of 45 `Todo` items are even in scope. The throttle worked; today's problem is the opposite one.

## Pipeline status
**`Ready for Dev` is at zero for the second day** — known, carried from [orchestrator run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-02e.md), and not currently costing pickups because the single WIP slot holds THR-1392, a four-slice migration that will run a while. It self-clears only one ticket deep, and this run found no new promotable candidate — everything else in `Todo` is gated, a wayfinder question, or awaiting design. **Closest to Ready for Dev: THR-1222**, which needs one word and nothing else. **Recommended next pickup after THR-1392: THR-1222 if approved; otherwise the queue is genuinely empty and the fix is upstream — a design session on THR-1002 (needs no approval) or THR-1134.**
