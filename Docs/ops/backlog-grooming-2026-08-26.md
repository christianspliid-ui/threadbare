---
lane: daily-backlog-grooming
run: 2026-08-26
promoted: 0
filed: 0
resolved: 0
swept: 3
canceled: 0
newFindings: 3
needsChristian: true
---
# Backlog Grooming — 2026-08-26

## Needs Christian

**The whole executor queue is empty behind three verdicts only you can give.** Ready for Dev is at zero; every High-priority item left is either waiting on you or still needs a design pass. In leverage order:

1. **[THR-1130](https://linear.app/threadbare/issue/THR-1130) — are these two encounters worth meeting twice?** The batch-1 2-of-6 sample (ruling 6). Play [The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) and [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge). *Recommendation: answer this one first.* A yes releases [THR-1222](https://linear.app/threadbare/issue/THR-1222) (the camp seven, the remaining 9 of 15) — it is the only unblocked High content work on the board, so this single answer is the difference between a full lane and an idle one. A no is equally useful: it tells us what the retrofit bar still misses before nine more are written against it.
2. **[THR-1168](https://linear.app/threadbare/issue/THR-1168) — should committing a hand of nudge cards carry ~1.6s of held breath before the outcome lands?** Yes or no, either answer closes the ticket. The other half (the registration cue) is already retired and shipped.
3. **[THR-1133](https://linear.app/threadbare/issue/THR-1133) — six owed 1920×1080 captures, one attended sitting.** All shipped on the jsdom substitution because unattended runs cannot start a dev server, so behaviour is proven and composition is not. Newest two: faction heraldry (does a subordinate charge at 0.42 scale read as *deliberately lesser* or as a broken asset?) and the tooltip focus ring around an inline word.

## Work in flight
- THR-1130, THR-1133, THR-1168 — all three In Dev, all correctly parked (`assignee: null` ∧ `In Dev` ∧ `Parked`), each with one live ask above. No stalls, no orphans, nothing to re-route.

## Technical gates resolved this run
- None open. The three parks are Christian-gated, not technically gated — THR-1130's three `blockedBy` relations are all Done and shipped.

## Counts by state
Idea 66 · Todo 35 · In Design 2 · Implementation Planning 0 · **Ready for Dev 0** · In Dev 3 (all parked)

## Problems found and fixed
- **Two orphan issues, both fixed** — THR-1232 (power generator sketch) and THR-1236 (item generator sketch) had no project; assigned to Powers & Item Generation, matching their wayfinder-map parents. *Both writes silently dropped on the first attempt* (impediment #48) — the project name contains `&` and an escaped ampersand no-ops without error. Re-issued against the project UUID and confirmed by re-query.
- **THR-1114 mislabelled `Improvement`, fixed to `Content`** — its own Pillars section says Content; the wrong label re-presented a cosmology defect to the § 2.5 cancellation sweep every day. Reason recorded as a comment.
- No completed-but-open projects: every started/planned project has open issues. No state/priority contradictions — all six `Now` projects are High.
- **Stale design work (flagged, not touched):** THR-1002 (7d) and THR-790 (11d), both In Design with no movement.
- Roadmap cross-reference: `.planning/ROADMAP.md` Future Work is fully covered in Linear — "rival activation" is THR-66 (Done), doom-with-teeth is THR-293 (Done), the rest map to live projects. **0 filed, deliberately** — the shelf is not short of ideas.

## Materiality sweep
In-scope tickets swept: **3** (Ready for Dev 0 + Todo 3 carrying `Infrastructure`/`Improvement` or project Continuous Improvement). **Canceled: 0. Consolidated: 0.** The 2026-08-11 purge held — this queue is no longer process-heavy, which is the finding.
- THR-1256 (flip guidance-freshness to blocking) — **kept.** No cost/benefit line, so the Rule-0 bar reads as a demote-to-Idea. Not applied: this is a dated review mandated by THR-1253's Done-when, with the date also encoded as `GUIDANCE_GATE_MODE.flipReviewAfter` in code precisely so the burn-in cannot become permanent by inattention. Demoting it would serve the rule's letter against its purpose. Doubt recorded rather than acted on; not due until 2026-09-08.
- THR-1134 (shareable game-state snapshot) — **kept.** In scope only via the Continuous Improvement project; it is Engine+UI work Christian filed himself for a capability that is currently nil. Product-shaped, so out of scope for cancellation.
- THR-1114 — **kept**, and removed from future sweeps via the relabel above.

## Pipeline status
**No design-complete, unblocked, executor-ready ticket exists.** Everything High is Christian-gated (THR-1130, THR-1220, THR-1222) or needs a design pass first (THR-1212, THR-1213, THR-1156 Urgent, THR-1134). Per CLAUDE.md § Prioritization, an empty shelf is an upstream-supply problem, not a licence to drain process work — and there is no process work left to drain. **Two unblocks, in order:** (1) Christian's THR-1130 verdict, which frees THR-1222 immediately; (2) a design session on THR-1212 / THR-1213 (Wave-1 plan docs, both High, both Content Architecture) to refill Ready for Dev behind it.
