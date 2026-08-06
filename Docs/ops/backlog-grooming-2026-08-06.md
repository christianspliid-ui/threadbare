---
lane: daily-backlog-grooming
run: 2026-08-06
promoted: 1
filed: 1
resolved: 2
newFindings: 2
needsChristian: true
---
# Backlog Grooming — 2026-08-06

## Needs Christian

- **THR-883 is the whole content pipeline's cork, and it hasn't moved since 2026-08-02.** It is Urgent, In Design, and holds a hard block on eleven content tickets — every WS5 encounter batch plus Meeting Batch A. It needs one interactive session with Fable to write a single encounter end-to-end and sign off on the format. Nothing else unblocks it; no agent can decide it. **Recommendation: this is the highest-leverage hour available on the board.** Until it happens, roughly a third of the backlog is frozen by construction and the lanes will keep grooming around it.
- **THR-998 — action cards are telling players a risk that isn't real.** Each card reads "a steady / uncertain / perilous working", but for 85% of castable cards the underlying number can't move the odds at all: a "perilous" card and a "steady" card both land the same way. Two honest fixes. (a) Make the word track the odds the cast will actually roll. (b) Stop printing a risk word where the odds are flat, and say something else — what scale the working reaches, or what it costs. **Recommendation: (b).** If the danger genuinely doesn't vary, a danger word is the wrong thing on the card, and (a) buys truthfulness at the price of the same card reading differently for every god.

## Work in flight

- **THR-770** (company sphere-name pool) — claimed 07:03Z, PR #1314 open, CI running. Healthy, no action.
- **THR-769** (company card art) — shipped as PR #1313 at 06:19Z with auto-merge armed, but its required check went red and the merge could not fire. Diagnosed and unblocked this run (below).
- **THR-860** (WS5 capital cluster) — deliberately held behind THR-883, PR #1114 open with auto-merge off. Not stalled. Labelled `Parked` this run.

## Technical gates resolved this run

- **PR #1313's red check is a timeout, not a defect.** Sole failure was `playerCastBalance.test.ts > resolves the same probability across the whole difficulty range…`, `Test timed out in 5000ms` at a measured 5646ms. The same test passed on `main` at `34c4ff4d` — the commit that introduced it — 50 minutes earlier. The PR's diff (four JPEGs plus art wiring) touches nothing that test reads. Re-ran the failed job; verdict recorded on THR-1000.
- **THR-860 exempted from the stale-claim auto-release.** The sweep had it scheduled to return to Ready for Dev at 14:25Z today. Releasing it would have put a ticket with a live block into the claimable queue, where the hourly lane would have claimed it, read the block, and bounced — burning a WIP slot to rediscover a decision recorded three times since 07-30. Applied `Parked`, the sweep's own documented opt-out, and left everything else untouched.

## Counts by state

Idea 73 · Todo 27 · In Design 1 · Implementation Planning 0 · Ready for Dev 32 · In Dev 3

## Problems found and fixed

- **Orphan:** THR-998 had no project. Assigned to *Action System & Unlocks*, inherited from its parent THR-766 per CLAUDE.md's deferral rule. The first write returned 200 and silently dropped it — the project name was passed HTML-escaped (`&amp;`), which matches nothing; retried with the project UUID and verified via `get_issue`.
- **Filed + promoted THR-1000** — the flaky test above, at High into Ready for Dev with its coordination block as the first comment. Promoted rather than parked in Idea on the Rule 0 clause: it records an already-realised loss (a correct PR that could not merge, cleared only by manual intervention), which is the qualifying predicate. **Flagging the deviation explicitly — this lane does not normally promote**; noted on the ticket too so it is auditable either way.
- **No other orphans, no completed-project cleanup.** Every project in Now/Next/Discovery still holds open issues; every issue across all six non-Done states carries a project.
- **Roadmap cross-reference: nothing missing.** Every `.planning/ROADMAP.md` Future Work item resolves to a Linear issue (Phases 3–5 → THR-54/55/56; TB-095/098/099 → THR-74/400/724, all Done; rival activation → THR-66; Codex → THR-52; onboarding → THR-72). Drift runs the *other* way — the v1.2 section still presents shipped work as future. THR-763 added a freshness banner but scoped it to the effect-primitives list only. Reported, not filed: doc drift is explicitly non-qualifying for Rule 0 and does not earn a queue slot.

## Observation — this lane's own gap

No grooming report exists for 08-03, 08-04, or 08-05; the last was 08-02. 08-04 has zero reports from *any* lane, which reads as the machine being off rather than a lane defect, but 08-03 and 08-05 both have orchestrator output and no grooming output. `lastRunAt` only records the current run, so I cannot tell a no-op skip from a missed fire, and I am not filing on a hunch. Worth a look if the gap repeats.

## Pipeline status

Not starved — 32 items in Ready for Dev, 27 of them `Deferral`. But **31 of the 32 are priority Low**, so the lane's priority sort makes the "deferrals in active projects first" rule unreachable in practice. That inversion is already recorded as THR-871 (Idea, Medium) and is the single structural thing most worth fixing about how this board feeds the executor.

**Recommended next pickup: THR-1000** — now the only High item in the queue, small, test-only, and it stops the next correct PR from going red for a reason its author cannot act on.
