---
lane: daily-backlog-grooming
run: 2026-08-19
promoted: 0
filed: 0
resolved: 0
swept: 2
canceled: 0
newFindings: 0
needsChristian: true
---
# Backlog Grooming — 2026-08-19

## Needs Christian
Two tickets are parked on your answer, both correctly shaped (`assignee: null` ∧ `In Dev`). Neither can move without you.
- **THR-1130** — *are The Grateful Kin and The Unsafe Bridge worth meeting a second time?* Asked 2026-08-17 19:05Z, **~60h unanswered**. Yes releases batch 2 (the remaining 9 of 15 encounters); no tells the retrofit what it still lacks. Play links are in the ticket's latest comment.
- **THR-1168** — one yes/no about feel: *should committing a hand of nudge cards carry ~1.6s of held breath before the outcome lands?* Asked 2026-08-18 01:08Z, **~30h unanswered**. Yes wires it, no deletes it; either closes the ticket.
- **Context:** you paused `tb-opus-pickup` and `tb-orchestrator` yesterday — both confirmed off, crons intact. Answering will not cause anything to *happen* until you re-enable them. **Recommendation:** answer THR-1168 whenever (30 seconds, closes a ticket); hold THR-1130 until you want batch 2 actually running.

## Work in flight
- **THR-1130** (High) — 6 of 15 encounters retrofitted and live; batch-1 re-pass merged (PR #1528) and deployed. Remaining: camp seven + sequels, gated on the verdict above.
- **THR-1168** (Low) — Member 2 (registration cue) shipped as a retirement, PR #1534. Member 1 is the parked feel question.

## Technical gates resolved this run
None — no ticket was parked on a technical decision.

## Counts by state
In Dev 2 (both parked) · Ready for Dev 4 · Todo 18 · In Design 2 · Implementation Planning 0 · Idea 71.

## Problems found and fixed
- **Nothing required a fix.** Zero orphans, zero completed-but-open projects, zero state/priority contradictions, zero stale In Design items, zero unclaimable deferrals — all four Ready-for-Dev items carry a full coordination block and a Done-when.
- Flagged only: **Plan Cross-Linking Infrastructure** holds zero issues (empty, not completed) — deletion candidate for the next hygiene sweep. Four `Next` projects (Encounter Format Migration, Agent Success Redesign, M3, Attention Tier Model) hold only `Idea` work, so "Next" overstates their readiness.
- Lane signal caveat: an orchestrator pass at ~02:30Z bumped `updatedAt` across the shelf without commenting, so the field overstates freshness — THR-1130 reads 11h but has been substantively silent ~60h. Staleness judged on last substantive comment, not `updatedAt`.
- Roadmap: every `.planning/ROADMAP.md` Future Work item is already tracked (THR-54/55/56, THR-52, THR-66/68/70/72, plus the Social Systems and M3 projects). Nothing to file.

## Materiality sweep
Swept **2** in-scope (THR-1114 `Improvement`; THR-1134 in Continuous Improvement). **Canceled 0, consolidated 0.**
- THR-1114 stands — labeled `Improvement` but it is product work: two templates carry a non-Sphere `sphereAffinity` that prerequisite checks and scoring read. Out of scope for cancellation.
- THR-1134 stands — Christian-requested from an attended session (High); a capability, not process tidying.
- **The pathology this step exists to catch is absent.** On 2026-08-11, 9 of 36 Ready-for-Dev tickets sat below the bar; today the shelf holds 4 and none is process work. The throttle is holding.

## Pipeline status
Thin but healthy: 4 claimable deferrals, all in active `Now` projects, correctly ahead of new work by priority (rule 1). Closest to pickup: **THR-1183** (sublocation mint-shape unification) or **THR-1184** (`sacred_route` has zero consumers) — both carry verified 2026-08-18 promotion evidence. **THR-1133** needs an *attended* session. The shelf holds no non-`Deferral` program work, and with `tb-orchestrator` paused nothing promotes Todo → Ready for Dev, so it will not refill until the lanes resume.
