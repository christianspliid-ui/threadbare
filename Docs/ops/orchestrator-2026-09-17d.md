---
lane: tb-orchestrator
run: 2026-09-17d
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-09-17 (run d, ~20:30Z)

## Needs Christian

**The ask is unchanged and already on your briefing: one design chat.** Start with [THR-1448 — a held town is a faction position](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) (say "design THR-1448"), then [THR-1479 — the appointment primitive](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by). Nothing new to decide — this line is here so the standing ask keeps riding the briefing, not to nag you a fourth time today.

**One thing did change, and it makes the picture slightly worse rather than better.** The "someday" pile has been the reassuring number in all of this — dozens of items sitting in the Idea column, the implication being that there is plenty of work banked if the build machine ever runs dry. This run opened two of them at random. **Both turned out to have been fixed months ago**, by neighbouring jobs that quietly did the same work and never ticked the original off. One was a placeholder leaking into encounter prose, fixed 1 August; the other a percentage showing on a choice, fixed when the mechanic behind it was retired. Both still read as open work.

Two out of two is not a survey, and I have not claimed it is. But it means the pile is softer than its size suggests, and nobody should point at it and conclude there is a reserve of buildable work behind the current stall. There isn't one that anybody has verified. Nothing for you to do about this — it is grooming's to clean up, and I have written the evidence onto both tickets.

## T1 — unblock sweep

Shelf: **0** in `Ready for Dev`, **0** in `In Dev`. State names re-verified against `list_issue_statuses` before trusting two empty results — both states exist and are genuinely empty, not a name mismatch. `Implementation Planning`: also **0**. The executor has now been idle since THR-876 closed at 16:23Z — **~4 hours this run, ~22 hours of the last 24 with roughly 20 minutes of work in it.**

`Todo`: 29 candidates, **unchanged since run b** (most recently touched is still THR-1511 at 2026-09-16T16:08Z). Promotions: **0**; ceiling of 5 untouched, shelf far below the backed-up threshold of 15 — eligibility was the constraint, not the ceiling.

**Declines, with the destination each one routes to.** Re-derived this run rather than inherited, by reading the bodies (runs a–c established the pattern; with the executor fully idle, repeating an inherited verdict is the expensive mistake):

- **THR-1511** (undertaking catalysts wither where the actor stands) — body heads its fork *"The fork (design, not engine) … picking one is a design call."* Two repairs, both satisfying the stated predicate. Promoting it would put a ticket at the top of the queue that `pull-work` can read as design-gated and bounce hourly. → T2.
- **THR-1274** (no non-human cast primitive) — *"This is a design ticket, not a patch … needs its shape decided … before code, per the new-node-type rule."* → T2.
- **THR-1348** (ambitions below the spotlight tier) — *"this is the fork, and it is not the executor's to settle."* → T2.
- **THR-1503** (`processEncounterConditions` dead `category` gate) — *"that is a call for a design pass, not for the executor who found it."* → T2.
- **THR-1501** (six orphaned family tags) — *"it is a content-direction call, not a technical one."* → T2.
- **THR-1393** (the `intelligence` object type) — the graph-shape change it needs is *"a design decision, not an executor's call."* → T2.
- **THR-790** (Traits wave 2) — *"Needs its own design finalization before Ready for Dev"*, and blocked by THR-786. Already cycled through `In Design` 08-15 → 09-11 and came back out. → T2.
- **THR-175** (agent.sphere field) — explicitly **DEFERRED** behind an unmet trigger: *"not actively claimable … Do not start this work before the trigger."* Neither trigger condition has fired. → unmet gate.
- **THR-1381**, **THR-1218** — design-specification work by their own titles; THR-1218 additionally gated on factory content raising encounter density. → T2.
- **THR-1220** — Christian plays the five encounters. HITL by construction, not executor work.
- **THR-870** (sphere-governance pivot) — direction park. **THR-791** — assigned to Christian. **THR-789** — program epic container, not executable.
- `wayfinder:*` (15 issues) — skipped unconditionally to T1.5.

**Rule-0:** no process work promoted, none available. This week's closed work stays product-dominated. Headline finding remains **"feature pipeline needs a design session"**, not a process promotion.

## T1.5 — wayfinder sweep

Three open maps: [Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258).

**AFK frontier: 0.** Re-verified by label rather than inherited: all 21 `wayfinder:research` tickets and all 5 `wayfinder:task` tickets in the workspace are `Done`. Nothing to burn down until a map is extended.

HITL frontier: **12** tickets, all `wayfinder:grilling` / `wayfinder:prototype`, unchanged since 2026-08-26 and already carried on the briefing. Not touched — resolving one is the broken-HITL failure mode the wayfinder skill names.

Worth recording for whoever runs the next design chat: **Physical Conflict is fully researched and blocked purely on Christian.** Its four research tickets are all `Done` with substantive decisions recorded on the map (fight-block attachment point, quintessence-as-hit-points, monster/lair substrate, company ground truth), the charter decisions are settled, and all ten remaining children are HITL. That map is one grilling session away from producing plan docs.

## T2 — design authoring

**Triggered and barred**, fourth consecutive run.

Non-`Deferral` shelf is **0**, below the floor of 2. `In Design`: **2 live, 0 excluded** — THR-1448 (unassigned, 5.5d) and THR-1479 (unassigned, 4.8d). Neither carries `Parked`; both sit inside the 7-day window, so both count against the bound of 1. Nothing staged, no state changed, nothing mutated.

Run c's correction stands and is not re-litigated here: raising `ORCH_MAX_IN_DESIGN` would convert zero `Todo` tickets into buildable work, because staging is a *request* for a design chat, not the chat. The bound is not the constraint.

## T3 — architecture health

**Daily sweep not due** — it ran at [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-17b.md) (~15:55Z), the first run after 06:00 local. **No detectors were run this hour, and none is reported as clean.**

Weekly test-suite health: **not due** (Thursday; next Monday 2026-09-21).

**New finding 1 — two Idea-column Deferrals were already fixed under a sibling's id, verified by re-running their own Done-whens.**

Probing the Idea column for anything executable against an empty shelf, the first two candidates opened were both dead:

- **[THR-716](https://linear.app/threadbare/issue/THR-716)** (`{actor}` renders literally in encounter step prose) — THR-933 shipped *this ticket's own recommended option 1* on 2026-08-01 via [PR #1237](https://github.com/christianspliid-ui/threadbare/pull/1237). `proseEnrichment.ts:586-593` carries the alias. Verified by **re-running the ticket's own CLI evidence command**, not by grep (impediment: an upstream-shipped grep misses a partial ship): the step it quoted as leaking — `"{actor} listens more than talks…"` — now renders `"The Unchained listens more than talks…"`. All three Done-when items satisfied.
- **[THR-1088](https://linear.app/threadbare/issue/THR-1088)** (legacy intervention row renders `+3% success` — Law 13) — THR-1121 deleted the branch outright, with a source comment at `EncounterVeil.tsx:2659` naming the ticket and the reason (*"a choice no longer buys odds … printing a percentage beside one would be advertising a purchase the engine does not make"*). Swept `src/components/**`: every surviving `%` is a CSS bar width or a debug surface. Its whole sibling cluster — THR-1048, THR-1124, THR-1121, THR-1424, THR-1451 — is `Done`; THR-1088 is the last member still in `Idea`.

Evidence written onto both tickets as comments, with `Parked` (not `Canceled`) recommended: the work happened, it shipped under a sibling's id. **No state mutated** — this lane does not close issues outside the wayfinder carve-out.

**New finding 2 — the Idea column's depth is not a measure of available work, and three runs of "nothing to promote" have been read against it.**

Two probes, two already-resolved tickets. That is a 2-of-2 hit rate on a sample of two, which is a signal to check rather than a measurement — and it is stated that way on both tickets. But it undercuts the implicit reassurance that a 50+ item Idea column represents banked work behind the current stall. Nobody has verified that it does.

The cheap repair is a stale-shipped sweep over the Idea-column Deferrals — for each, resolve its `relatedTo` siblings' states and re-run its Done-when — which is grooming's remit, not this lane's. **Logged here, not filed as a ticket** (process-work throttle: scheduled lanes log, the weekly retro promotes). Cost to fix: roughly one grooming pass. Cost of not fixing: the backlog reports capacity it does not have, and every lane reasoning about supply — including this one — reasons off a number that is partly paperwork.

**Redundancy: not assessed this sweep.**

**Stalled work:** none. `In Dev` is empty.

**Hand-created `In Dev` tickets:** none — `In Dev` is empty.

**In Design: 2 live, 0 excluded** (THR-1448 unassigned 5.5d → counts; THR-1479 unassigned 4.8d → counts; both inside the 7-day window, neither `Parked`).

## Escalations

None opened. The one open question — when a design chat happens — is Christian's, is already on the briefing, and was deliberately not re-asked on Discord by run c; asking a fourth time in one day would be noise, not escalation.

Two tickets carry new evidence comments (THR-716, THR-1088) awaiting a grooming disposition. Neither is parked by this lane.
