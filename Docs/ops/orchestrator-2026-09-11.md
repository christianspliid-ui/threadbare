---
lane: tb-orchestrator
run: 2026-09-11
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-11 (run a, ~02:32Z)

## Needs Christian

**One thing, still the same three words from last night — and they are now overdue rather than early.**

The realm work is being built right now: nations become real political things the world can act on, and the first realm content (a court summons, a border levy, a tithe) is queued directly behind it. Three naming decisions were written up yesterday evening and are still sitting untouched. Naming is always your call, never an agent's, so nothing can move them but you.

| The word | What it names | Where |
|---|---|---|
| **Realm** — or **Nation**, your pick | The political thing the red borders draw: a landed faction, seated at a capital, holding a territory of towns, with a court to climb | [THR-1453](https://linear.app/threadbare/issue/THR-1453) |
| **hold** | A town a mortal keeps by *working* it — your own ruling from yesterday morning | [THR-1449](https://linear.app/threadbare/issue/THR-1449) |
| **cast** and **Forecast tier** | A god playing a divine action card; and the odds-reading shown *before* the dice, as words rather than numbers | [THR-1445](https://linear.app/threadbare/issue/THR-1445) |

Only the first genuinely wants your taste — *Realm* over *Nation* on register grounds, and the write-up says outright you may veto the headword. The other two are already settled in substance and need a yes.

**Why this is repeated rather than dropped.** Your briefing only ever shows the newest of these reports, so an ask that is not restated disappears from view even though nothing has answered it. This one has gone unanswered for seven hours while the code it governs was being written. Repeating it is the lesser cost.

**Nothing else needs you this hour, and the build queue is in better shape than it was.** A small UI fix was promoted to the queue this run, so there is now real work waiting behind the realm build rather than an empty shelf.

## T1 — unblock sweep

Scanned `Todo` (**32**) and `Ready for Dev` (**1**) — two state-filtered calls, sorted in memory, never one unfiltered sweep (THR-686).

### Promoted — 1

**[THR-1455](https://linear.app/threadbare/issue/THR-1455) — the hex sidebar spells an Area's type as a raw enum and its size as a numeral (UI Laws 13 and 14).** `Todo` → `Ready for Dev`, verified on a `get_issue` re-query (impediment #48); [coordination block posted](https://linear.app/threadbare/issue/THR-1455) as the latest comment, without which `pull-work` Step 3 would refuse the candidate.

Evidence, in the order it was established:

| Check | Result |
|---|---|
| Blocked by | **Nothing.** No coordination line, no prose gate, no time gate. Its one cross-reference to [THR-1155](https://linear.app/threadbare/issue/THR-1155) is *provenance* ("found in passing while shipping slice 1"), not a dependency — and that slice is merged ([PR #1886](https://github.com/christianspliid-ui/threadbare/pull/1886)) |
| Latest comment (THR-990) | Zero comments — no standing retire / superseded verdict |
| Plan-doc liveness (THR-921) | Passes trivially — names no plan doc |
| Defect still real | **Re-verified against `origin/main` this run, not taken on trust.** `git show origin/main:src/components/Game/HexSidebar.tsx` still carries both lines verbatim at 219–220 |
| Ceiling | Not reached. Shelf **1** at scan, far below `QUEUE_BACKED_UP_MIN` (15); 1 of `ORCH_PROMOTE_BATCH_MAX` (5) used. **Nothing held back** |

### The judgement this run reversed, stated plainly so it can be overruled

[Run p](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10p.md) listed THR-1455 among "not candidates" on the ground that it **carried an assignee**. That reading was re-examined rather than inherited, and it does not survive:

- **The assignee was an artifact, not an intent.** [PR #1886](https://github.com/christianspliid-ui/threadbare/pull/1886) references this id, and a referencing PR repopulates an issue's assignee from the git author — the impediment #607 assignee-restore hazard, the same class as THR-845's create-path default. It is the only `Todo` deferral filed yesterday that carries one, while its siblings filed the same evening ([THR-1448](https://linear.app/threadbare/issue/THR-1448), [THR-1454](https://linear.app/threadbare/issue/THR-1454)) do not.
- **The work is definitionally not Christian's.** Its Done-when is a two-line render change plus a jsdom assertion. He is chat-only (THR-608); an issue whose acceptance is a unit test is executor work whoever the field names.
- **Leaving it assigned would have made the promotion a no-op** — `pull-work`'s candidate query is `assignee:null`.

So the assignee was cleared in a **separate** write (a create-path default survives being passed `null` inline — THR-859) and verified by the **absence of the key on a `get_issue` re-query**, which is the only place absence proves null. This is a clear, not an assign; non-negotiable #1 is untouched. It is one click to reverse and the promotion comment says so.

### Declined — 9, each re-derived this run

| Issue | Reason | Evidence |
|---|---|---|
| [THR-1454](https://linear.app/threadbare/issue/THR-1454) | **Unmet blocker** | *"Blocked by THR-1155 … pick up after its slice 3 is Done."* THR-1155 is `In Dev`; slices 1–2 merged (PRs #1886–#1890), slice 3 outstanding |
| [THR-1024](https://linear.app/threadbare/issue/THR-1024) | **Unmet blocker** | *"Do not start this before THR-966."* [THR-966](https://linear.app/threadbare/issue/THR-966) is still `Idea`, unchanged since 2026-08-10 |
| [THR-1218](https://linear.app/threadbare/issue/THR-1218) | **Unmet blocker** | Blocked on [THR-1043](https://linear.app/threadbare/issue/THR-1043) raising encounter density; THR-1043 is `Todo`. Body also says *"Not Ready for Dev — needs a design pass"* |
| [THR-175](https://linear.app/threadbare/issue/THR-175) | **Unmet trigger gate** | Unblocks only when creation-sphere content ships or a template needs `sphere` independent of `reach`; neither has happened |
| [THR-1448](https://linear.app/threadbare/issue/THR-1448) | **Wrong destination → T2** | Its gate *is* met ([THR-1287](https://linear.app/threadbare/issue/THR-1287) `Done` 2026-09-10T07:44:58Z) but its own Done-when is *"design handoff"* with four named questions to answer in a plan doc |
| [THR-1348](https://linear.app/threadbare/issue/THR-1348) | **Wrong destination → T2** | *"this is the fork, and it is not the executor's to settle"* — three readings that are *"genuinely different games"* |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274) | **Wrong destination → T2** | *"This is a design ticket, not a patch"*; a non-human cast primitive is a new-node-type call and the load-bearing rule binds |
| [THR-1393](https://linear.app/threadbare/issue/THR-1393) | **Wrong destination → T2** | Requires naming an engine reader and designing a `knows_of` successor: *"a design decision, not an executor's call"* |
| [THR-1381](https://linear.app/threadbare/issue/THR-1381) | **Wrong destination → T2** | Design-session work by its own Done-when, and it says explicitly it *"should not displace program work"* |

**Also not candidates.** [THR-1220](https://linear.app/threadbare/issue/THR-1220) and [THR-1133](https://linear.app/threadbare/issue/THR-1133) need Christian at the keyboard. [THR-1043](https://linear.app/threadbare/issue/THR-1043) and [THR-791](https://linear.app/threadbare/issue/THR-791) carry an assignee that — unlike THR-1455's — is plausibly real: both are program-scale items he owns. [THR-789](https://linear.app/threadbare/issue/THR-789) and [THR-1156](https://linear.app/threadbare/issue/THR-1156) are program epics, parents rather than executable work. [THR-870](https://linear.app/threadbare/issue/THR-870) is a parked pivot.

**Skipped unconditionally — 15** `wayfinder:*` issues (3 maps + 12 decision tickets). These never enter `Ready for Dev`; they are T1.5's input.

**The three UL-proposals stay in `Idea`, and the reasoning from run p stands unchanged.** [THR-1445](https://linear.app/threadbare/issue/THR-1445), [THR-1449](https://linear.app/threadbare/issue/THR-1449), [THR-1453](https://linear.app/threadbare/issue/THR-1453) are unblocked and docs-only and would refill the shelf cheaply — and promoting them would put work at the top of the queue whose first gate is an approval no executor can obtain (`Docs/ubiquitous-language/Process.md:133` — *"Approval is always human — no auto-merge"*). Re-recorded because the tempting shape recurs every run.

## T1.5 — wayfinder sweep

**Three open maps.** [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) · [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) · [Item Generator](https://linear.app/threadbare/issue/THR-1227).

**AFK burn-down: 0 resolved, 0 available — measured this run, not inherited.** Two all-state label queries: all **21** `wayfinder:research` and all **5** `wayfinder:task` issues in the team are `Done`. `ORCH_WAYFINDER_AFK_MAX` (2) is not the constraint; supply is zero. There is no agent-doable wayfinder work anywhere on the board.

**Frontier: 12 open decision tickets, all HITL** (`wayfinder:grilling` / `wayfinder:prototype`), matching this run's complete `Todo` scan exactly — no arrivals or departures since run p. **None touched**: resolving a grilling or prototype ticket is the broken-HITL failure mode the wayfinder skill exists to prevent.

**Deliberately not surfaced by name to Christian this hour.** These questions have stood in front of him for days and re-listing them hourly is how a standing ask stops being read. This run's single ask is the three words, which are genuinely time-sensitive. The maps keep.

## T2 — design authoring

**Triggered, and barred — by exactly one item, for the fourth consecutive run.**

- **Trigger:** non-`Deferral` items in `Ready for Dev` = **0** at scan, below `ORCH_PROGRAM_WORK_FLOOR` (2). Note this run's promotion does **not** clear it: THR-1455 also carries `Deferral`, so the predicate still reads 0 even though the shelf now holds two pieces of real work.
- **Bound:** `In Design` holds **1 live, 0 excluded** — at `ORCH_MAX_IN_DESIGN` (1). Nothing may be staged.

| Occupant | Classification (THR-1382 predicate) | Age |
|---|---|---|
| [THR-790](https://linear.app/threadbare/issue/THR-790) — Traits wave 2 | **assigned**, stale → **counts against the bound**; warn only, and the exit is `Parked`, never demotion | `startedAt` 2026-08-15T20:29Z = **27 days** |

**Nothing was mutated.** Excluding an item from a count is not a state change, and applying `Parked` or unassigning is Christian's call and the grooming lane's remit (impediment #755).

**What the bar defers, in order:** [THR-1348](https://linear.app/threadbare/issue/THR-1348) (director ruling on record, remaining unknowns enumerated, and the ruling invites this tier), then [THR-1448](https://linear.app/threadbare/issue/THR-1448) (director direction dated 2026-09-10, blocker met), then [THR-1274](https://linear.app/threadbare/issue/THR-1274).

**THR-790's disposition was not re-asked, and that is now a deliberate cost.** It was put to Christian at ~18:30Z by run n and held back by runs o and p. It is the sole bar on the design tier and has been for four runs. It is **not** in this run's ask because the three UL words are cheaper, newer and time-critical, and two asks in one briefing reliably produce zero answers. If it is still the sole bar after the words are settled, it becomes the next run's single ask — recorded here so that is a decision rather than a drift.

**Agreed work is not exhausted — it is budget-bound.** No Discord escalation on that basis; the prescribed interface is `## Needs Christian` → the hourly briefing.

## T3 — architecture health

**Not due, and nothing below is reported as clean on an unrun check.**

- **Local hour is 04**, below `ORCH_HEALTH_SWEEP_HOUR` (6). The daily sweep runs on the first run *after* 06:00 local; this run is before it. Yesterday's sweep ([run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md), 06:27 local) stands and is deliberately not restated.
- **Not run this hour:** `generate-interface-map:dry`, `sweep:rank-reach`, `check:process`, `check:canon-staleness`.
- **`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, not reported as clean.**
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).
- **Redundancy: not assessed this sweep.** No judgement pass over the interface map or systems inventory was performed, and none is claimed.

`newFindings: 0` is literal. The assignee reversal in § T1 is a **routing** judgement, recorded in that tier; it is not a detector result and is not counted as one.

### Standing sub-duties

- **`In Design`: 1 live, 0 excluded** — THR-790 (assigned, 27d → warned, still counted). Worked in § T2. Printed rather than skipped: a tier that did not run is indistinguishable from a tier with nothing to say.
- **Hand-created `In Dev` / stalled work: not re-measured** (T3 not due). [Run j](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10j.md) did both; those findings stand.
- **`In Dev` slice observed in passing** (for the shelf reading, not as a sub-duty measurement): **3** — [THR-1155](https://linear.app/threadbare/issue/THR-1155) (live, last touched 01:24Z, `stateHistory` confirms it passed through `Ready for Dev`, so not hand-created), [THR-1130](https://linear.app/threadbare/issue/THR-1130) (`Parked` since 2026-08-15), [THR-1380](https://linear.app/threadbare/issue/THR-1380) (parked by the executor, assignee cleared). **This lane lifts neither park.**

### Product vs process — the week

This run promoted **one product item and zero process items**, and filed nothing. The process-ticket budget (at most one per three runs) remains untouched, and the assignee-artifact finding was recorded in this report rather than converted into a ticket, per the throttle rule that scheduled lanes do not file process work.

**Headline: the shelf is no longer empty.** A build is in flight, two pieces of work are queued behind it, and the design tier is held by a single 27-day-old slot. The supply story that led most of yesterday's reports is not the binding constraint this hour — the naming approvals are.

## Escalations

- **Nothing asked on Discord this run.** The one ask is Christian-facing and low-stakes; it goes via `## Needs Christian` → the hourly briefing, which is the prescribed interface.
- **One prior-run judgement reversed** — THR-1455's assignee, reasoned in § T1 so it can be judged rather than merely asserted, and reversible in one click.
- **One standing ask deliberately deferred rather than dropped** — THR-790's disposition, with the reason it lost this hour's slot and the condition under which it takes the next one.
- **No Linear errors this run.** Three writes, all verified by re-query: one state change, one assignee clear, one comment.
