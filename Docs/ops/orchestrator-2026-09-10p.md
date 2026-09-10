---
lane: tb-orchestrator
run: 2026-09-10p
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-10 (run p, ~21:35Z)

## Needs Christian

**Three words are waiting on you, and they should take about a minute.**

Tonight the game is learning to actually *simulate* the kingdoms it has always drawn — the red borders on the map become real political things the world can act on. Slice one of that work is in a pull request right now. Alongside it, three naming decisions were written up and parked, because naming a thing in this project is always your call, never an agent's.

| The word | What it names | Where it came from |
|---|---|---|
| **Realm** — or **Nation**, your pick | The political thing the red borders draw: a landed faction, seated at a capital, holding a territory of towns, with a court to climb | [THR-1453](https://linear.app/threadbare/issue/THR-1453) |
| **hold** | A town a mortal keeps by *working* it — the thing you ruled on this morning ("it is a commitment") | [THR-1449](https://linear.app/threadbare/issue/THR-1449) |
| **cast** and **Forecast tier** | A god playing a divine action card; and the odds-reading the player sees *before* the dice, as words rather than numbers | [THR-1445](https://linear.app/threadbare/issue/THR-1445) |

**The one that genuinely wants your taste is the first.** The write-up proposes *Realm* over *Nation* on register grounds — a nation is a modern political word, a realm is what a fantasy map draws and what a court sits over — and it says outright that you may veto the headword. Either way it is the same object; only the word the player reads changes. The other two are already settled in substance (the second is literally your own ruling from this morning) and just need a yes.

**Why now rather than whenever.** The realm code is being written tonight and the first realm encounters — a court summons, a border levy, a tithe — are queued behind it. If the glossary does not have these words, that content gets authored against words nothing can check, which is precisely the drift the glossary exists to prevent. A yes now costs a minute; a yes next week means re-reading prose that already shipped.

**Nothing else needs you, and one correction is owed.** Several reports today led with the build queue running empty. **That is not the situation this hour** — the executor is mid-build on the realms work (slice 1 of 3), with another piece of real content work queued behind it, and it is working at its normal one-thing-at-a-time pace. No action needed; earlier framing was accurate when written and has since been overtaken.

## T1 — unblock sweep

Scanned `Todo` (**33**) and `Ready for Dev` (**1**) — two state-filtered calls, sorted in memory. Board read confirmed live: the precheck reported `linear=nokey`, which is reachability-only and never gates a run (CLAUDE.md), and the MCP connector answered on every call.

**Board delta since [run o](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10o.md) (19:33Z).**

| Issue | Moved | Consequence |
|---|---|---|
| [THR-1155](https://linear.app/threadbare/issue/THR-1155) | `In Design` → `Ready for Dev` 19:52Z → `In Dev` 20:02Z; [PR #1886](https://github.com/christianspliid-ui/threadbare/pull/1886) open (slice 1/3) | **Vacated an `In Design` slot** — the T2 bound is now held by one item, not two |
| [THR-1454](https://linear.app/threadbare/issue/THR-1454) | filed 19:49Z into `Todo` (realm encounters) | New T1 candidate; blocked |
| [THR-1455](https://linear.app/threadbare/issue/THR-1455) | filed 21:05Z into `Todo`, assigned | Not a queue candidate |
| [THR-1053](https://linear.app/threadbare/issue/THR-1053) | unchanged in `Ready for Dev` since run o promoted it | See the note below — **not** a bounce |

### Promoted — 0

No candidate met the bar. Every non-promotion below is a stated decline with its evidence, not a throttle.

### THR-1053 survived two executor windows unclaimed — checked, and it is healthy

Run o promoted it at 19:33Z. It has since sat through the 20:01 and 21:01 executor windows without being claimed, which is the exact shape of a promotion the executor silently refuses — so it was checked rather than assumed.

**It is not being refused.** `list_comments` shows the coordination block present and current as the latest comment, carrying all three required lines (`Suggested model`, `Parallel-safe with`, `Mutex with`), and **no bounce comment exists**. The cause is ordinary and correct: **WIP = 1.** The executor claimed [THR-1155](https://linear.app/threadbare/issue/THR-1155) at 20:02Z — one minute after the 20:01 window — and has held its single slot on it since. THR-1053 is queued behind a live build, which is the system working as designed.

Recorded because the *symptom* is indistinguishable from the failure mode this lane most needs to catch, and next hour's run should not have to re-derive it.

### Declined — 7, each re-derived this run

| Issue | Reason | Evidence |
|---|---|---|
| [THR-1454](https://linear.app/threadbare/issue/THR-1454) | **Unmet blocker** | Names `Blocked by THR-1155` and *"pick up after its slice 3 is Done"*. THR-1155 is `In Dev` with slice **1 of 3** in [PR #1886](https://github.com/christianspliid-ui/threadbare/pull/1886) — two slices short |
| [THR-1448](https://linear.app/threadbare/issue/THR-1448) | **Wrong destination → T2** | Its gate *is* met — [THR-1287](https://linear.app/threadbare/issue/THR-1287) went `Done` 2026-09-10T07:44:58Z — but its own Done-when is *"design handoff"* and it names four questions to be answered in a plan doc. A met blocker makes it T2's input, not dev-ready |
| [THR-1348](https://linear.app/threadbare/issue/THR-1348) | **Wrong destination → T2** | Body states the fork is *"not the executor's to settle"*; the 18:12Z ruling says it stays in `Todo` until a plan doc exists |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274) | **Wrong destination → T2** | *"This is a design ticket, not a patch"*; a non-human cast primitive is a new-node-type call, and the load-bearing rule binds |
| [THR-1393](https://linear.app/threadbare/issue/THR-1393) | **Wrong destination → T2** | Requires naming an engine reader and designing a `knows_of` successor: *"a design decision, not an executor's call"* |
| [THR-1024](https://linear.app/threadbare/issue/THR-1024) | **Unmet blocker** | *"Do not start this before THR-966"*; [THR-966](https://linear.app/threadbare/issue/THR-966) is still `Idea`, unchanged |
| [THR-175](https://linear.app/threadbare/issue/THR-175) | **Unmet trigger gate** | Unblocks only when creation-sphere content ships or a template needs `sphere` independent of `reach`; neither has happened. Also demands a design doc first |

Also not candidates: [THR-1220](https://linear.app/threadbare/issue/THR-1220) and [THR-1133](https://linear.app/threadbare/issue/THR-1133) need an attended session with Christian at the keyboard; [THR-1455](https://linear.app/threadbare/issue/THR-1455), [THR-1043](https://linear.app/threadbare/issue/THR-1043), [THR-791](https://linear.app/threadbare/issue/THR-791) carry an assignee. [THR-1381](https://linear.app/threadbare/issue/THR-1381) is design-session work by its own Done-when and says it should not displace program work.

**Skipped unconditionally — 15** `wayfinder:*` issues (3 maps + 12 decision tickets). These never enter `Ready for Dev`; they are T1.5's input.

**Promotion ceiling: not reached.** Shelf held **1** at scan, far below `QUEUE_BACKED_UP_MIN` (15); 0 of `ORCH_PROMOTE_BATCH_MAX` (5) used. **No candidate was held back.**

### One class deliberately not promoted, and why

Three `UL-proposal` issues sit in `Idea` — [THR-1445](https://linear.app/threadbare/issue/THR-1445), [THR-1449](https://linear.app/threadbare/issue/THR-1449), [THR-1453](https://linear.app/threadbare/issue/THR-1453) — all filed today at the THR-1155 and THR-1287 handoffs. They are docs-only, unblocked, and would have refilled the shelf, and a sibling UL-proposal ([THR-1380](https://linear.app/threadbare/issue/THR-1380)) travelled the executor queue today, so the precedent for promoting them looks solid.

**It is not.** `Docs/ubiquitous-language/Process.md:133` defines the label: *"Approval is always human — no auto-merge."* Both tickets repeat it in their own bodies, and THR-1453 explicitly invites a headword veto. Promoting them would put work at the top of the queue whose first gate is an approval no executor can obtain — and would silently convert Christian's naming call into mine. THR-1380 reached the queue *after* its terms were settled in an attended session; these three have not been.

Surfaced under `## Needs Christian` instead. Recorded here because "unblocked, docs-only, shelf is thin" is a genuinely tempting shape, and the next run should not have to re-litigate it.

## T1.5 — wayfinder sweep

**Three open maps.** [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) · [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) · [Item Generator](https://linear.app/threadbare/issue/THR-1227).

**AFK burn-down: 0 resolved, 0 available — measured this run, not inherited.** Two all-state label queries: all **21** `wayfinder:research` and all **5** `wayfinder:task` issues in the team are `Done`. `ORCH_WAYFINDER_AFK_MAX` (2) is not the constraint; supply is zero, as it has been for several runs. There is no agent-doable wayfinder work anywhere on the board.

**Frontier: 12 open decision tickets, all HITL** (`wayfinder:grilling` / `wayfinder:prototype`), confirmed against this run's own complete `Todo` scan — no new arrivals since run o. **None was touched**: resolving a grilling or prototype ticket is the broken-HITL failure mode the wayfinder skill exists to prevent.

**Not re-listed by name, and not surfaced to Christian this hour.** These nine-to-twelve questions have been in front of him for days and were put to him again by earlier runs; re-listing them hourly is exactly how a standing ask stops being read. This run's single ask is the three words above, which are new, cheap, and time-sensitive. The maps keep.

## T2 — design authoring

**Triggered, and barred — but the bar changed shape this hour.**

- **Trigger:** non-`Deferral` items in `Ready for Dev` = **0** at scan, below `ORCH_PROGRAM_WORK_FLOOR` (2). (The shelf's one item, [THR-1053](https://linear.app/threadbare/issue/THR-1053), carries `Deferral` — it is real product work, but the trigger predicate counts labels, so the tier fires.)
- **Bound:** `In Design` holds **1 live, 0 excluded** — at `ORCH_MAX_IN_DESIGN` (1). Staging anything would make it 2. Nothing may be staged.

| Occupant | Classification (THR-1382 predicate) | Age |
|---|---|---|
| [THR-790](https://linear.app/threadbare/issue/THR-790) — Traits wave 2 | assigned, stale → **counts, warn only**; the exit is `Parked`, never demotion | `startedAt` 2026-08-15T20:29Z = **26 days** |

**What changed:** run o recorded **2 live** here. [THR-1155](https://linear.app/threadbare/issue/THR-1155) left `In Design` at 19:52Z and is now being built. So the design tier is barred by **exactly one item** — the 26-day-old assigned one — where an hour ago it was barred by two, one of which was legitimately in flight.

**Nothing was mutated.** Excluding an item from a count is not a state change; applying `Parked` or unassigning is Christian's call and the grooming lane's remit (impediment #755).

**The standing ask is deliberately not re-asked.** Run n put THR-790's disposition to Christian at ~18:30Z and run o held it back on purpose. The fact has sharpened — it is now the sole bar — but a three-hour-old ask repeated for the third time is noise, not urgency. It will keep, and it is recorded here where the next run can see the delta.

**What the bar defers, in order:** [THR-1348](https://linear.app/threadbare/issue/THR-1348) (director ruling on record as of 18:12Z, remaining unknowns enumerated, and the ruling explicitly invites this tier), then [THR-1448](https://linear.app/threadbare/issue/THR-1448) (director direction dated today, blocker now met), then [THR-1274](https://linear.app/threadbare/issue/THR-1274).

**Agreed work is not exhausted — it is budget-bound.** No Discord escalation on that basis; the prescribed interface is `## Needs Christian` → the hourly briefing.

## T3 — architecture health

**Not due. No detector ran this hour, and nothing below is reported as clean on an unrun check.**

- **The daily sweep already ran today** at 06:27 local by [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md); the duty is once per day. Run c's findings stand and are deliberately not restated.
- **Not run this hour:** `generate-interface-map:dry`, `sweep:rank-reach`, `check:process`, `check:canon-staleness`.
- **`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, not reported as clean.**
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).
- **Redundancy: not assessed this sweep.** No judgement pass over the interface map or systems inventory was performed, and none is claimed.

`newFindings: 0` is literal: the two things this run learned — why THR-1053 is unclaimed, and why the UL-proposals must not be promoted — are **T1** routing facts, recorded in that tier. Neither is a T3 detector result, and neither is counted as one.

### Standing sub-duties

- **`In Design`: 1 live, 0 excluded** — THR-790 (assigned, 26d → warned, still counted). Worked in § T2. Printed rather than skipped: a tier that did not run is indistinguishable from a tier with nothing to say.
- **Hand-created `In Dev` / stalled work: not re-measured** (T3 not due). [Run j](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10j.md) did both; those findings stand.
- **`In Dev` slice observed in passing** (for the shelf reading, not as a sub-duty measurement): **3** — [THR-1155](https://linear.app/threadbare/issue/THR-1155) (live, claimed 20:02Z, `stateHistory` confirms it passed through `Ready for Dev`, so not a hand-created ticket), [THR-1380](https://linear.app/threadbare/issue/THR-1380) (parked by the executor 19:05Z, assignee cleared, one click from close), and [THR-1130](https://linear.app/threadbare/issue/THR-1130) (`Parked` since 2026-08-15, blocked by THR-1053). **This lane lifts neither park.**

### Product vs process — the week

This run promoted **zero of each** and filed nothing. The two findings above were recorded in this report rather than converted into process tickets, per the throttle rule that scheduled lanes do not file process work. The process-ticket budget (at most one per three runs) remains untouched.

**Headline: the pipeline is not starved this hour — it is single-threaded and busy.** A build is in flight, real content work is queued behind it, and the design tier is held by one stale slot. The supply story that led fifteen reports today is not the constraint right now, and saying so is worth more than repeating it a sixteenth time.

## Escalations

- **Nothing asked on Discord this run.** The one ask is Christian-facing and low-stakes; it goes via `## Needs Christian` → the hourly briefing, which is the prescribed interface.
- **One judgement recorded rather than acted on:** three unblocked docs-only tickets were left in `Idea` because promoting them would have converted a human naming call into an agent's. Reasoning is in § T1 so it can be judged rather than merely asserted.
- **Two standing asks deliberately not repeated** — THR-790's disposition (put to Christian ~18:30Z by run n) and the wayfinder HITL frontier (standing for days). Both are recorded above with their current state; neither was re-surfaced.
- **No Linear errors this run.** No writes were made — no `save_issue`, no `save_comment`, no state or assignee change on any issue.
