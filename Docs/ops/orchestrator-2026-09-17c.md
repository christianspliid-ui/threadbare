---
lane: tb-orchestrator
run: 2026-09-17c
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-17 (run c, ~18:30Z)

## Needs Christian

**The build machine now has nothing at all — not one job waiting, not one in progress.** At the last check (three hours ago) there was still one small art job running; it finished at 16:23Z and nothing replaced it.

The ask has not changed and is already on your briefing: one design chat unblocks the queue. Start with [THR-1448 — a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) (say "design THR-1448"), then [THR-1479 — the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by).

One correction to what [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-17.md) told you this morning, so nobody chases the wrong fix: it suggested the lane's own "only stage one design item at a time" limit was what held the pipeline up. That is wrong. Lifting that limit would put *more* items into the design column and still produce zero buildable jobs, because staging is only a request for a design chat — it is not the chat. A design session is the only thing that turns any of this into work the builder can pick up. Nothing else to decide here; just don't let the retro spend effort on that dial.

## T1 — unblock sweep

Shelf: **0** in `Ready for Dev`, **0** in `In Dev`. The whole pipeline is empty for the first time this cycle.

- THR-876 (the quarantined Meet-The-First scene regeneration, a `Deferral`) was the one item on the shelf at run b. It was claimed 16:02Z and closed **Done 16:23Z** via [PR #1958](https://github.com/christianspliid-ui/threadbare/pull/1958). Searched `Todo` for tickets naming `THR-876` as a blocker: **none**. Nothing unblocked.
- `Todo`: 29 candidates, **unchanged since run b**. The most recently touched is THR-1511 at 2026-09-16T16:08Z; nothing has moved since.
- Promotions: **0**. Ceiling of 5 available, 0 spent. The shelf is far below the backed-up threshold of 15, so the ceiling was not the constraint — eligibility was.

**Three inherited declines re-derived rather than repeated (THR-688 rule A).** Runs a and b carried a block of "destination declines" forward as a list. With the executor fully idle, repeating an inherited verdict is the expensive mistake, so the three likeliest-to-be-executable candidates were read in full. All three confirm the decline, each quoting its own body:

- **THR-1503** (`processEncounterConditions` gates on a dead `category`) — *"This is a design question, not just a wiring fix — resolve it before writing code"*, and the three-way fork ends *"that is a call for a design pass, not for the executor who found it."* → T2.
- **THR-1501** (six orphaned family tags) — *"it is a content-direction call, not a technical one"*; deleting vocabulary is a design-session/retro decision per `Docs/canon/content-objects.md`. → T2.
- **THR-1348** (ambitions below the spotlight tier) — *"The design question — this is the fork, and it is not the executor's to settle"*, with three readings that are *"genuinely different games."* → T2.

Remaining declines stand unchanged and were not re-derived this run: THR-1511, THR-1274, THR-1393, THR-790, THR-1381, THR-1218, THR-175, THR-1220 (destination); THR-870 (direction park), THR-791 (assigned), THR-789 (epic container); `wayfinder:*` skipped to T1.5.

**Rule-0:** no process work promoted, and none available to promote. This week's closed work remains product-dominated. The headline finding is **"feature pipeline needs a design session"**, not a process promotion.

## T1.5 — wayfinder sweep

Three open maps: [Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258).

**AFK frontier: 0 — verified exhaustively this run rather than inherited.** Every `wayfinder:research` ticket in the workspace (21) and every `wayfinder:task` ticket (5) is `Done`. There is no AFK work left on any map, so this tier has nothing to burn down until a map is extended.

HITL frontier: **12** tickets, all `wayfinder:grilling` or `wayfinder:prototype`, unchanged since 2026-08-26 and already carried on the briefing. Not touched — resolving one is the broken-HITL failure mode. Nothing resolved this run.

## T2 — design authoring

**Triggered and barred**, third consecutive run.

Non-`Deferral` shelf is **0**, below the floor of 2. `In Design`: **2 live, 0 excluded**.

- THR-1448 — unassigned, 5.5d since last activity. Leaves the count ~2026-09-19T07:23Z.
- THR-1479 — unassigned, 4.8d. Leaves the count ~2026-09-19T22:26Z.

Neither carries `Parked`; both are inside the 7-day window, so both count against the bound of 1. Nothing staged, no state changed, nothing mutated. THR-1511 remains the next staging candidate when the bound frees.

## T3 — architecture health

**Not due.** Today's daily sweep already ran at [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-17b.md) (~15:55Z), the first run after 06:00 local. No detectors were run this hour and none is reported as clean.

Weekly test-suite health: not due (Thursday; next Monday 2026-09-21).

**New finding (1) — a correction to run a's recorded finding, filed here rather than as a ticket per the process-work throttle.**

Run a recorded: *"the staging bound is now the thing holding the pipeline back, not the supply of agreed work"*, and left `ORCH_MAX_IN_DESIGN` = 1 for the retro to weigh. That framing is wrong and would send the retro after a lever that cannot move anything.

Staging does not produce buildable work. A staged item enters `In Design` and waits for an attended Opus session; it never reaches `Ready for Dev` by any path this lane controls. Raising `ORCH_MAX_IN_DESIGN` from 1 to *n* would therefore convert **zero** `Todo` tickets into executor-pickable work — it would only deepen a column that is already 2 items deep and 5 days idle. The binding constraint is the design session itself, of which this lane has a supply of zero and no authority to create.

The measurement that makes this actionable: since 2026-09-17T00:19Z the executor has had ~18 hours of wall clock and roughly 20 minutes of work in it (THR-876, 16:02–16:23Z). That clears the ~1-hour materiality bar comfortably. It is logged here and not filed as a ticket, because no ticket an agent can write fixes it — the repair is one design chat, which is already the standing ask on the briefing.

**Redundancy:** not assessed this sweep.

**Stalled work:** none. `In Dev` is empty. THR-876's two `Ready for Dev → In Dev` transitions were a grooming release and re-claim on 09-17, not repeated failed claims — below the threshold of 3 and not a stall.

**Hand-created `In Dev` tickets:** none — `In Dev` is empty.

In Design: 2 live, 0 excluded.

## Escalations

None opened. The one open question — when a design chat happens — is Christian's and already on the briefing; re-asking it on Discord a third time in one day would be noise, not escalation.
