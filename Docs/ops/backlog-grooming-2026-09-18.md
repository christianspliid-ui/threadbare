---
lane: daily-backlog-grooming
run: 2026-09-18
promoted: 2
filed: 0
resolved: 2
swept: 0
canceled: 0
newFindings: 1
needsChristian: false
---
# Backlog Grooming — 2026-09-18

## Needs Christian
Nothing blocks on you. Two calls made today can be vetoed; if you say nothing, they stand:
- **[THR-1501](https://linear.app/threadbare/issue/THR-1501/six-family-tags-are-now-orphaned-no-bearer-no-reader-sunset-or-author):** the six unused tags (military, supply, community, stewardship, contraband, blackmail evidence) will be **deleted**. Writing army-supply items for them would be new content work, and any of the tags can be restored with one line.
- **[THR-1511](https://linear.app/threadbare/issue/THR-1511/undertaking-catalysts-wither-where-the-actor-stands-every-cell):** when a mortal's work completes, its follow-up encounter will be **offered at the town the work touched**, not wherever the mortal happens to stand. Today 8 of 14 of these follow-ups vanish.

## Work in flight
In Dev: nothing blocked, because nothing is active. THR-876 merged 09-17 (PR #1958) and auto-closed to Done.

## Technical gates resolved this run
- THR-1501: sunset verdict recorded in a comment (rule 4, veto invited), then promoted to Ready for Dev.
- THR-1511: fork resolved (option 1: seed resolves at the created object's settlement, with the actor's location as fallback). Coordination block posted, then promoted to Ready for Dev.

## Counts by state
Ready for Dev 2 (after promotions) · In Dev 0 · Implementation Planning 0 · In Design 2 · Todo 27 · Idea 63

## Problems found and fixed
- **Pipeline gap:** Ready for Dev and In Dev were both empty (nine idle hourly slots per the briefing). Fixed by the two promotions above. Both writes were confirmed from the returned issue state.
- **Orphans:** THR-1329 and THR-1346 (both Done) had no project. Assigned them to Thematic Pressure & Living World and Engine Observability & Performance respectively.
- **Finding:** yesterday's grooming recommended promoting THR-1501, but tb-orchestrator's 01:31 sweep judged nothing startable without Christian. The orchestrator is treating rule-4 decidable forks as Christian-gated. That is one occurrence, so it goes in the retro log only; no ticket.
- Stale Todo map/epic holders are unchanged from 09-17 (Physical Conflict and Powers wayfinder children, THR-789/791/870). Flagged only.
- Now projects with no active-state work: Social Systems Expansion and Action System & Unlocks (Idea-only). Flagged only.
- ROADMAP Future Work is still covered. No project is fully Done while still open.

## Materiality sweep
Swept 0, canceled 0. Nothing is in scope: no Ready-for-Dev or Todo ticket carries an Infrastructure or Improvement label or belongs to Continuous Improvement.

## Pipeline status
Recommended next pickup: **THR-1511** (Medium, product, opus), then THR-1501 (Low, mechanical sunset). The two are parallel-safe.
Next closest: THR-1503 needs a design pass; THR-1348 needs a plan doc; THR-1448 and THR-1479 (In Design) need a design session.
