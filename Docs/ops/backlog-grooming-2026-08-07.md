---
lane: daily-backlog-grooming
run: 2026-08-07
promoted: 0
filed: 0
resolved: 0
newFindings: 3
needsChristian: true
---
# Backlog Grooming — 2026-08-07

## Needs Christian
**Delivery has been fully stopped for ~17 hours and no agent can restart it.** GitHub has not created a single Actions run from a `pull_request` event since 18:04Z yesterday. Six finished PRs are armed and waiting; nothing has reached `main` since 17:21Z on 08-06. The repo side is provably fine — public, Actions enabled, all four workflows active, scheduled and manual runs both green today — so this is a GitHub-side fault, not ours. **Recommendation:** check GitHub Status / open a support ticket. There is one untried in-repo recovery — closing and reopening a PR fires the `reopened` trigger that a re-push does not — but it disarms auto-merge on each PR, so I left that to an executor rather than doing it to six live PRs.

## Work in flight
- **THR-1013** (CI probe) — shipped as #1329, blocked. **THR-1008** (ThreadsPanel Law leaks) — shipped as #1326, blocked. **THR-993 / THR-994** (encounter card + context strip) — shipped as #1327/#1328, blocked. **THR-781** (faction event ids) — shipped as #1323, blocked. All five carry a line-anchored `Fixes THR-XX` in the PR body and will auto-close on merge.
- **THR-1005** (aftermath interrupt) — #1322 open, deliberately carries no close keyword ("this does NOT close THR-1005"); multi-PR ticket, correct as-is.
- **THR-860** (WS5 civic seats) — `Parked` 8 days behind THR-883's format lock, PR #1114 `DIRTY` and unarmed on purpose. Hold documented four times; correct, no action.

## Technical gates resolved this run
- **THR-1014** Medium → High, with the evidence comment its Rule 0 predicate requires. It qualifies "while any such PR exists"; four do right now, and the loss is now 17h/6 PRs rather than the 94min/2 PRs it was filed on. It is the top Ready-for-Dev item.

## Counts by state
In Dev 7 · Ready for Dev 36 · Todo 27 · In Design 2 · Implementation Planning 0 · Idea 50+

## Problems found and fixed
- **WIP=1 reads as violated (7 In Dev) but is not** — six are shipped-and-awaiting-merge, jammed by the outage above, not stalled sessions. Left In Dev deliberately; re-routing them to Ready for Dev would discard finished work.
- **No orphan issues** — every issue across all active states carries a project. Spot-check clean.
- **Roadmap cross-reference: nothing to file.** `.planning/ROADMAP.md` Future Work is fully tracked (Phases 3–5 → THR-54/55/56, all present; the TB-095…099 social sequence shipped under THR-74/THR-724).
- **Two projects sit in "Now" with zero issues in any active state** — *Encounter Format Migration* (Urgent) and *Agent Success Redesign*. Their only remaining items are Idea-state speculative follow-ups (THR-142/448, THR-64/65). Not closed, because "every issue Done" is not met — but they inflate the active-project count that "Finish Before You Start" rule 2 sorts on. Flagged for a status decision.
- **Deferrals in Ready for Dev left alone**, per the THR-968 correction — a `Deferral` there is the first place the executor looks, not a defect.

## Pipeline status
Queue is deep and healthy: 36 Ready for Dev, none blocked on a missing coordination block. **Recommended next pickup: THR-1014** (now the only High, and the Rule 0 qualifier). But note the executor cannot *land* anything while the outage holds — a pickup this hour will finish, open a PR, and join the six already waiting.
