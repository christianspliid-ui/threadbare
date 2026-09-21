---
lane: daily-backlog-grooming
run: 2026-09-21
promoted: 0
filed: 0
resolved: 0
swept: 0
canceled: 0
newFindings: 1
needsChristian: true
---
# Backlog Grooming — 2026-09-21

## Needs Christian

**The delivery machine is idle, and no automated lane can restart it.** `Ready for Dev`, `In Dev` and `Implementation Planning` are all **0**. The executor lane has nothing to claim. This is not a supply problem — 26 `Todo` and 63 `Idea` items are waiting — it is a **single missing step: nobody is writing plan docs.**

`In Design` holds exactly two items, THR-1479 (High, appointment primitive) and THR-1448 (faction position), and neither has a plan doc after 9 and 10 days. Nothing on the board can advance them: the orchestrator stages design work but is forbidden from authoring it (your 2026-08-06 Sonnet ruling), and both Done-whens require a plan doc before `Ready for Dev`. The best-formed `Todo` item (THR-1348) says in its own body that its fork "is not the executor's to settle" — same shape.

**Recommendation: run one attended design session on [THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by).** Its two director rulings are settled, its blocker (THR-1487) cleared on 2026-09-12, and its connectivity table is already written — the plan doc is the only missing artifact. One session restarts the pipeline; nothing else on the board will.

## Work in flight

Nothing. `In Dev` is empty — no stalled claims, no orphaned branches, no re-routing needed. Last ships landed 2026-09-20 (THR-1516, THR-1517, THR-1326, THR-836).

## Technical gates resolved this run

- **THR-1479** — comment recorded: the queue beneath it is now empty (new since the 2026-09-19 blocker-cleared note, when it was still draining). Deliberately **not** moved: the stale-design sweep's two exits are both dishonest here — not `Parked` (no human decision pending; both rulings are settled), not `Todo` (intent is not cold; it is High and director-directed). It awaits design labour, and churning its state would clean the column while hiding the constraint.

## Counts by state

In Dev 0 · Ready for Dev 0 · Implementation Planning 0 · In Design 2 · Todo 26 · Idea 63 · open deferrals 0 in Ready for Dev (queue is empty), 3 in Todo.

## Problems found and fixed

- **Orphan issues: 0.** Every issue across all queried states carries a project.
- **Completed-but-open projects: 0.** Each of the six `Now` projects still holds open `Todo`/`Idea` work.
- **Unclaimable deferrals: 0** — `Ready for Dev` is empty, so the check is moot this run.
- **Not fixed, not a defect:** Physical Conflict and Powers & Item Generation are `Discovery` with No priority. That is the wayfinder convention (`wayfinder:map` / `prototype` / `grilling` tickets are deliberately unprioritised), not a contradiction. Left alone.
- **Roadmap cross-reference:** all `.planning/ROADMAP.md` Future Work items already have Linear counterparts (THR-54/55/56, Social Systems Expansion, M3, THR-52). Nothing to file.

## Materiality sweep

**In-scope tickets swept: 0. Canceled: 0. Consolidated: 0.** The scope predicate — `Ready for Dev`/`Todo` tickets labelled `Infrastructure` or `Improvement`, or in Continuous Improvement — matched **nothing**: `Ready for Dev` is empty, and none of the 26 `Todo` items carries either label or that project. Every open process ticket now sits in `Idea` (THR-758, THR-984, THR-871, THR-752, THR-882, THR-852, THR-893, THR-949), where it competes for no executor attention.

This is the throttle working, and it is worth stating against its baseline: on 2026-08-10, 32 of 35 `Ready-for-Dev` items were Low-priority process cleanup. Today the figure is 0 of 0. The 2026-08-10 rule (scheduled lanes do not file process tickets; the weekly retro is the single promotion point) has held. **No doubts let a ticket stand this run — there were none to judge.**

## Pipeline status

Closest to `Ready for Dev`: **THR-1479**, blocked solely on its plan doc. Second: **THR-1448**, same blocker. Neither is claimable by the executor lane today.

Recommended next pickup: **none available** — and the honest reading is that the executor lane should stay idle rather than be fed process work to look busy. The unblocking action is a design session, not a pickup.
