---
lane: daily-backlog-grooming
run: 2026-08-13
promoted: 0
filed: 0
resolved: 2
newFindings: 3
needsChristian: true
---
# Backlog Grooming — 2026-08-13

## Needs Christian

**One attended pixel pass unblocks two High-priority tickets and lands a built feature.** [THR-1082](https://linear.app/threadbare/issue/THR-1082) (consequence icon language) is fully implemented — [PR #1415](https://github.com/christianspliid-ui/threadbare/pull/1415) is open with tests, build, typecheck, freshness gates and the engine smoke all green. Its single outstanding Done-when is a 1920×1080 browser capture, and unattended runs cannot produce one (the Browser pane refuses to composite with no pane displayed — impediment #546, third occurrence). The executor deliberately declined a jsdom substitution because the change moves layout — new icon-tile column, tag column, right-aligned cluster, legend row — which is the case that rule says needs real pixels. The PR is held unarmed on purpose, so nothing will escalate it on its own.

Cost of the hold: [THR-1096](https://linear.app/threadbare/issue/THR-1096) (Companion attachments) and [THR-1097](https://linear.app/threadbare/issue/THR-1097) (consequence content pass) are both High, both `Todo`, and both natively blocked by it. **Recommendation:** in your next attended session, open the seeded build, look at two encounters across two outcome bands, and if it reads right, arm auto-merge. Your Law 13/15 ratification is already recorded — nothing else waits on you.

## Work in flight

- **THR-1082** — In Dev, unassigned (WIP slot free, correct). All three pillars built and merged-ready; only the pixel pass remains. Held ~13h, documented, not stalled.
- **THR-1099** — reported In Dev by `list_issues` but is actually **Done**; [PR #1419](https://github.com/christianspliid-ui/threadbare/pull/1419) merged 07:17 and auto-close fired correctly. The stale-status trap, confirmed with `get_issue`. No action needed.

## Technical gates resolved this run

- **THR-1099** — verified auto-closed rather than orphaned; no manual close required.
- **THR-949** → **Idea**. Process ticket with no quotable loss ("they still run and still pass"), naming two categories the materiality bar explicitly excludes (test tidying, prevention), no cost/benefit line, 12 days unclaimed. Reasoning posted to the issue.

## Counts by state

In Dev 1 · Ready for Dev 21 · Todo 13 · In Design 1 · Implementation Planning 0 · Idea 82.

## Problems found and fixed

- **Priority inversion on the demo checkpoint.** THR-1035, THR-1036 and THR-1037 — all `Bug`, all children of [THR-986](https://linear.app/threadbare/issue/THR-986), all in the active `Now` project — sat at **No priority**, which sorts *below* every Low chore in a queue the executor sorts by priority. Two are live Law 13/14/43 violations printing `success_at_cost` and raw `{adj}` tokens to the player. Raised to **Medium** (not High — that tier belongs to the design program they sit inside). Rationale posted to THR-986.
- **THR-1065 kept, not demoted.** It lacked the mandatory cost line, but THR-1082's closeout supplied the evidence a day later: its orphaned-payload class forced a typecheck baseline bump, with the executor recording *"the alternative was removing inspectability to satisfy a gate."* Cost line written onto the ticket. A genuine Rule-0 qualifier, not tidying.
- **THR-1089 left alone** despite having no cost line — Christian directed it personally on 2026-08-11 as a batched replacement for seven queue slots.
- **No orphans.** Every issue in every state carries a project. No completed-but-open projects; every `Now` project is High and has open work. No design work stale past 7 days (THR-1043 is 2 days old).

## Findings without tickets (process throttle — logged, not filed)

- **`.planning/ROADMAP.md` § Future Work is stale on social systems.** It lists TB-095 (Tavern & Party) and TB-099 (Information Economy) as pending; both shipped, as THR-74 and THR-724. The file carries its own drift warning from THR-763. Doc drift is explicitly non-qualifying — this is a row for the weekly retro, not a ticket.
- **THR-1093 is a ~1-minute job** — PR #1114 is still open and its issue was cancelled with an explicit "close it". Left for the executor: closing a GitHub PR is outside the groomer's remit.

## Pipeline status

Shelf is healthy and no longer process-dominated: **13 product / 8 process** across 21 items, versus the 32-of-35 process pileup on 2026-08-10. The throttle is working.

**Recommended next pickup: THR-1035** — Medium, player-visible Law 14 violation, blocks the demo checkpoint, and the correct display vocabulary already exists on the Aftermath screen for the same resolution, so it is a routing fix rather than a design question. Then THR-1036. Both are Encounter Experience, satisfying "finish active projects first".

Note the executor cannot start THR-1096 or THR-1097 until the pixel pass above clears THR-1082 — which is why that ask leads this report.
