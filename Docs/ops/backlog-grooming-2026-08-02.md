---
lane: daily-backlog-grooming
run: 2026-08-02
promoted: 0
filed: 2
resolved: 1
newFindings: 2
needsChristian: true
---
# Backlog Grooming — 2026-08-02

## Needs Christian

**Four finished tickets are waiting on a click that only you can make.** Each is verified-shipped or deliberately held; no agent may set them Done. They are piling up in the In Dev column and making the board read as busier than it is.

- **THR-947** (move hourly exhaust off `main`) — shipped and measured: exhaust merges to `main` went 4 → 0 across matched four-hour windows, with the lanes proven still alive on the `ops` branch. All five acceptance criteria pass. **Recommend: close.**
- **THR-931** (make `Docs gates` a required check) — the change is live. I verified it directly this run rather than trusting the earlier note: ruleset `15479914` is active and lists `Docs gates` as required. The one leftover was a stale sentence in CLAUDE.md; I filed it as THR-967 so the lane can fix it without waiting on you. **Recommend: close.**
- **THR-792** (stale AGENTS.md claim in a task prompt) — the fix shipped six days ago under a sibling ticket's number, so nothing ever closed this one. **Recommend: close.**
- **THR-860** (four capital-cluster encounter templates) — finished, but its pull request is deliberately held behind THR-883 while you decide the encounter-writing format. **The decision is creative, not technical:** when the format is locked, do these four templates land as-is and get rewritten later alongside the other seven, or is the branch dropped and all four re-written from scratch under the new format? Either is cheap. **Recommend: fold into the THR-883 session; no action now.**

## Work in flight

- **THR-348** (text-to-speech for encounter prose) — genuinely active, worked within the hour; it spun off THR-966 as a deferral. Healthy, nothing blocked.
- The other four In Dev items are the parked pile above, all unassigned, so the executor's single work slot is free. **In Dev: nothing blocked.**

## Technical gates resolved this run

- **THR-931** — verified live via the GitHub rulesets API instead of the classic branch-protection rule, where it does not appear. Claim confirmed; remaining work extracted to THR-967. Close is Christian's, so not set from here.

## Counts by state

Idea 68 · Todo 24 · In Design 1 · Implementation Planning 0 · Ready for Dev 57 · In Dev 5 (1 active, 4 parked).

## Problems found and fixed

- **Orphan issue fixed.** THR-960 (duplicate tick-phase key `6.64`) had no project — assigned to *Engine Observability & Performance*, which already holds the sibling orchestrator-phase work. Write verified by re-query.
- **CLAUDE.md states the opposite of reality (filed THR-967, Medium).** Line 193 still says `Docs gates` is "not yet a required status check". It is. The line instructs sessions to manually read a check conclusion they no longer need to — a small cost paid on every docs-only closeout.
- **This lane's own prompt would gut the queue (filed THR-968, Medium).** Its "deferrals belong in Idea or Todo" rule directly contradicts CLAUDE.md's prioritization rule 1, which names Ready-for-Dev deferrals as the *first* place to look for work. Obeying it literally this morning would have moved **38 issues** — about 70% of the Ready-for-Dev queue — out of the executor's reach, each move looking individually justified. I did not act on the rule. Both new tickets carry coordination blocks per THR-836.
- **Prioritization inversion re-measured, not re-filed.** Every one of the 38 Ready-for-Dev deferrals is priority Low — 38 of 38, up from 25 of 25 when THR-871 first recorded it. Commented on THR-871 rather than filing a weekly duplicate (THR-756).
- **Flagged, not changed:** *Plan Cross-Linking Infrastructure* has zero issues in any state and has not moved since April — dead weight, but empty is not the same as complete, so closing it is a judgement call rather than hygiene. *Repo Health* sits in "Next" while holding Ready-for-Dev work; harmless, left alone.

## Pipeline status

No gap — 57 issues sit in Ready for Dev against one active claim. Cross-checked `.planning/ROADMAP.md`: every Future Work item already has a Linear counterpart (Phases 3–5 → THR-54/55/56, rival activation → THR-66 Done, Codex → THR-52), so nothing was filed from it.

**Recommended next pickup: THR-967** — verified, docs-only, one paragraph, and it removes a false instruction from the manual every session reads.
