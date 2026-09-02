# Action Proposal — THR-1349 the decision-board cutover, re-scoped

## intent_quote

> I have paused our executor and orchestrator tasks. Can you please run a single thread agent on moving work forward on our linear board according to our normal way of working, except now it is just you as a single executor that can do both design and execution.

(Christian, this session, 2026-09-02. The ticket itself is the orchestrator lane's; the design-fork on it was ruled by Christian on Discord 2026-08-29 10:39 UTC, recorded on THR-1348: *"THR-1349 becomes a content/engine fix with a settled direction … It does not need Christian."*)

## scope (what this plan does)

Re-scopes THR-1349 from "the board has no variety term" (shipped, did not move the number) to the question its third pass left: **is the live board's throughput loss a contraction the world cannot afford, or an artefact of the baseline it was measured against?** The plan answers with a two-arm measurement on the current corpus (post-THR-1377), finds that the shipped baseline is contest B letting a spotlight mortal carry 8–11 concurrent undertakings and choosing an undertaking on 42–46% of decisions — outside the plan's own §4 envelope — and that the live board sits inside the envelope on both seeds while starting *more* encounters and idling no more. It then specifies: (1) the census gates re-derived from the design envelope and per-mortal properties instead of from the contest-B baseline; (2) the two organic-world vacuity guards (`edgeIntegrity` trade routes, `lairClearing` reinfestation) re-anchored as constructed assertions that drive the real writers; (3) the cutover commit exactly as §4 wrote it (mode → `'live'`, contest B + bridge + clamp deleted in that commit, liveness pin flipped); (4) a measured per-mortal concurrency finding filed as its own deferral rather than folded in; (5) **one board weight retuned**: `BOARD_VARIETY_PENALTY_WEIGHT` 0.18 → 0.5, on a sweep (0.18 / 0.35 / 0.5 / 0.7 on the live arm, both seeds) showing variety at a fixed start sample rises 27–32 → 36 and plateaus there while the envelope shares stay put — the one number in this plan that changes how the board ranks, stated here so the veto invitation shows every number that moves.

## scope (what this plan does NOT do — explicit non-goals)

- Does **not** widen the spotlight aperture or touch tiering — THR-1348 is ruled long-term by Christian.
- Does **not** add a desire floor for undertakings — settled and pinned in pass 2.
- Does **not** tune `UNDERTAKING_PAYOFF_SCALE`, `BOARD_SCORE_FLOOR`, or any weight *to move the family mix* — every prior pass records why. The one weight that is retuned (`BOARD_VARIETY_PENALTY_WEIGHT`, scope item 5) was swept precisely to show the mix does not move with it; it changes which undertakings a mortal repeats, not how often they choose one over an encounter.
- Does **not** ship a per-mortal concurrency cap in the cutover commit; it files it (measured) as a deferral so the flip stays one commit with one consequence.
- Does **not** gate on `trades_with > 0` — falsified on both seeds in three passes.
- Does **not** delete control upkeep (THR-1303) — gated on a post-cutover decision-mix floor, downstream.
- Does **not** change any player-facing surface, template, or prose.

## impact_class

Reversible. One constant flips a code path that has shipped inert for a week; the deleted contest is one block in one file, recoverable from git; the census gates are additive constants. No save-format change. Reverting is `git revert` of one commit.

## evidence cited

- **Linear issue:** THR-1349 (blocks THR-1301 → THR-1303); ruling on THR-1348 (2026-08-30T04:56Z).
- **Vision premises invoked:** `Vision/00-north-star.md` (cadence, one story at a time — a mortal juggling eleven undertakings is a spreadsheet, not a person), `Vision/02-non-negotiables.md` #2 (narrative over mechanical perfection), `Vision/03-design-tensions.md` #2 (systemic emergence vs authored moments) and #5 (portfolio breadth).
- **UL terms touched:** Undertaking, Encounter, Work — no new terms.
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/design-governance.md`, `Docs/canon/systems-inventory.md` (`decision` subsystem, `decisionBoard.ts`), `Docs/canon/interface-map.generated.md` (`decision-board-shadow-telemetry` 🟢 LIVE).
- **Prior plan docs this builds on:** `Docs/plans/2026-08-26-thr-1292-undertaking-substrate.md` §4 (the board, the envelope, the cutover commit contents, the busy-gate addendum).
- **Rejected approaches considered and dismissed:** busy-gating undertakings (the substrate plan's addendum forbids it, with a contract test); raising `CENSUS_DISTINCT_TEMPLATE_FLOOR` to separate the arms (the constant's own note refuses it); an 8× payoff bridge scale (THR-1301 swept it, saturates).

## load-bearing decisions touched

- **Everything is a graph node/edge** — untouched; no new node or edge types.
- **The world graph is mutated in place** — untouched.
- **Engine caches per session** — untouched.
- The plan respects the substrate plan's own addendum that `strategicState.projects` never joins `busyAgentIds`.

## high-impact files touched (from Codesight)

None with ≥100 importers. `phaseAgentDecision.ts` is imported by the phase registry only; `decisionBoard.ts` by the decision phase and its tests; `strategic-action-constants.ts` by the strategic subsystem (~20 importers). No Blast Radius section owed.

## kill criteria

The plan is wrong if, on the current corpus under `'live'`, either seed fails any re-derived gate at ≥150 ticks (envelope, per-mortal start rate, fixed-sample variety), or if `npm test` shows any red beyond the two re-anchored assertions. Then the flip does not land, the ticket records the measurement, and the concurrency deferral is promoted ahead of it — because the only remaining lever that is not tuning is occupancy.

## explicit user sign-off

Not required (Reversible). The gate/test calibration verdicts are the agent's per `process.md` § User review interface rule 4; a veto is invited in the handoff.

## author notes for the judge

Three prior passes each found the previous pass's blocker falsified and a new one beneath. This pass's claim is that the third blocker — "36% throughput loss" — was measured against a baseline that no gate had ever read directly: the census in `'shadow'` reports the *board's preference*, not what contest B actually did, so nobody had seen that the shipped world picks an undertaking on 46% of decisions and lets one mortal hold eleven at once. The uncertainty I carry: whether Christian would rather keep the busier, stackier world. The plan answers with the substrate plan's own envelope (his ruling) and invites the veto explicitly.
