---
lane: tb-orchestrator
run: 2026-09-10k
promoted: 1
filed: 0
resolved: 1
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-10 (run k, ~14:35Z)

## Needs Christian

**One thing is holding up new design work, and it has been holding it up for 26 days.**

Back on 15 August this lane put [Traits wave 2 — locations, artifacts, and draw-by-trait pools](https://linear.app/threadbare/issue/THR-790) into the design column and assigned it to you, because it was the longest-waiting piece of already-agreed work on the board. It has not moved since. No plan doc, no design notes, nothing.

That matters more than it sounds, because the lane is only allowed to hand you **one** design job at a time — and that one slot has been occupied by this since mid-August. So while it sits there, nothing new can be teed up for design, no matter how ready it is.

And two things are ready right now, both of them your own direction:

- [Nations and named areas are rendered, not simulated](https://linear.app/threadbare/issue/THR-1155) — the one you called "a flaw in the implementation" on 17 August. Countries and regions are drawn on the map but the game does not actually know they exist, so nothing in the story can point at them.
- [A held town is a faction position](https://linear.app/threadbare/issue/THR-1448) — this morning's direction, that holding a town should make you the faction's town-keeper and open faction encounters. The thing it was waiting on ([THR-1287](https://linear.app/threadbare/issue/THR-1287)) finished at 07:44 today, so it is genuinely unblocked as of a few hours ago.

**The question, and it is a yes/no:** do you still intend to run the Traits wave 2 design pass yourself? If yes, nothing changes and this keeps waiting for you. If no, say so and it gets unassigned — which frees the slot immediately and lets a design session pick up the held-town direction while it is fresh in your head.

The backlog grooming lane asked you this same question on 3 September and got no answer, so it is being put more plainly here.

---

**Separately — your three design maps have run out of work that does not need you.**

Physical Conflict, Powers & Spellcraft, and the Item Generator each got charted with a mix of "go find out" tickets an agent can do alone and "Christian has to react to this" tickets. **Every single one of the agent-doable ones is now finished** — all the research, all the surveys, across all three maps. What is left is nine questions and sketches that only you can settle. Nothing on these maps can move another inch without a session with you in it.

The seven waiting on **Physical Conflict** (the fight system):

- [NPC-mode fight loop](https://linear.app/threadbare/issue/THR-1263) — how a fight against a monster actually plays out, with mock transcripts to react to
- [Agent-mode fight loop](https://linear.app/threadbare/issue/THR-1264) — the same for two people fighting each other, with sample duels
- [Monster opponents — just enough monster](https://linear.app/threadbare/issue/THR-1268) — what a monster *is* as a thing in the world
- [Systemic triggers — walking into the lair, grudges boiling over](https://linear.app/threadbare/issue/THR-1267) — when fights start on their own
- [Defeat wears many faces](https://linear.app/threadbare/issue/THR-1266) — yield, rout, capture, humiliation, a scar and a grudge, death
- [Victory yields — what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270)
- [Companies in fights?](https://linear.app/threadbare/issue/THR-1271) — can a whole company fight together in v1, or is it strictly one-on-one? Worth knowing: you said you had never seen a company form in a live run, and the research answered that — they do form, 13 to 16 of them by tick 120. So this question is real rather than moot.

And one each on the other two maps: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236) and [twenty generated spells to react to](https://linear.app/threadbare/issue/THR-1232).

Open a chat and say "work the map" when you have an hour.

## T1 — unblock sweep

Scanned `Todo` (35 issues) and `Ready for Dev` (1 issue) — two state-filtered calls, sorted in memory. One Linear 502 on the first write, retried once and succeeded.

**Promoted — 1.**

`[orchestrator] T1 promote THR-1318: gate THR-1213 (Done 2026-08-28T08:36:24Z, content pass = slice 4 / PR #1686) → Ready for Dev (program: Content Architecture)`

- **[THR-1318](https://linear.app/threadbare/issue/THR-1318)** — *Lens overlay prose engine is authored, tested, and has no caller.* Its gate was a prose ordering line, restated as a hard mutex in the filing block: *"Do not claim this while THR-1213's content pass is outstanding."* [THR-1213](https://linear.app/threadbare/issue/THR-1213) is **Done since 2026-08-28T08:36:24Z**, and the content pass is specifically its slice 4 ([PR #1686](https://github.com/christianspliid-ui/threadbare/pull/1686), merged). The ticket was created 70 minutes *before* that completion, which is why it was filed looking blocked and has looked blocked ever since — **13 days unpromoted**. Plan-doc liveness: `check:plan-doc-liveness` → **LIVE** on `origin/main`. Latest comment before promotion was the filing coordination block; no retire verdict (THR-990 check applied). Verified `Ready for Dev` with no `assignee` key on `get_issue`. Coordination block posted, restating all three lines plus the discharged mutex and the per-arm evidence shape.

**Held — 1.**

`[orchestrator] T1 hold THR-1451: parent THR-1424 is In Dev and live (updated 14:31Z); mutex sibling THR-1426 unclaimed on the shelf`

- **[THR-1451](https://linear.app/threadbare/issue/THR-1451)** — *The rest of the percentage sweep.* Declares `Blocked by: nothing` and is genuinely actionable, so this is a sequencing hold, not a decline. Three facts decide it: it was created **14:26Z today, nine minutes before this scan**, by the session running its parent [THR-1424](https://linear.app/threadbare/issue/THR-1424) — which is **`In Dev` right now**, last touched 14:31Z. That same session moved sibling [THR-1426](https://linear.app/threadbare/issue/THR-1426) to `Ready for Dev` and left this one in `Todo`, which is an ordering the filing session expressed deliberately. Its own coordination block names THR-1426 as a mutex (*"same Law 13 family; take whichever is live first and record the reading it picks"*). Promoting it now would put a mutex pair on a two-deep shelf while the parent is mid-flight. **Promotable next run** once THR-1424 lands or THR-1426 is claimed. Named here with its evidence so the deferral is visible rather than silent.

**Declined — 6**, each naming what held it:

| Issue | Reason | Evidence |
|---|---|---|
| [THR-1024](https://linear.app/threadbare/issue/THR-1024) | Unmet blocker | *"do not start this before THR-966"* — THR-966 is `Idea`, not Done |
| [THR-1155](https://linear.app/threadbare/issue/THR-1155) | Wrong destination → T2 | No blockers, but it is a design ticket: Done-when is *"plan doc … moved to Ready for Dev with a coordination block"* |
| [THR-1448](https://linear.app/threadbare/issue/THR-1448) | Wrong destination → T2 | Gate met (THR-1287 Done 2026-09-10T07:44:58Z) but *"this is a design ticket; plan doc before code"* |
| [THR-1156](https://linear.app/threadbare/issue/THR-1156) | Wrong destination | Program epic, self-describing: *"no execution ticket files directly against this epic"*; its deliverable is a charter needing your explicit invocation |
| [THR-1393](https://linear.app/threadbare/issue/THR-1393) | Wrong destination | *"a design decision, not an executor's call"* |
| [THR-175](https://linear.app/threadbare/issue/THR-175) | Unresolvable gate | Trigger is a condition, not an issue (*"when Creation-sphere content starts shipping"*); says *"not actively claimable"* |

**Skipped unconditionally — 15** `wayfinder:*` issues (3 maps + 12 decision tickets). These never enter `Ready for Dev`; they are T1.5's input.

**Promotion ceiling: not reached.** Shelf held 1 item at scan, far below `QUEUE_BACKED_UP_MIN` (15); 1 of `ORCH_PROMOTE_BATCH_MAX` (5) used. No candidate was held back by the ceiling — the one hold above is a sequencing call, stated as such.

**Shelf after this run: 2** ([THR-1426](https://linear.app/threadbare/issue/THR-1426), [THR-1318](https://linear.app/threadbare/issue/THR-1318)), both `Deferral`-labelled, so **non-`Deferral` program work on the shelf is 0**. The executor is not starved this hour — it is busy on THR-1424 and has two items queued behind it — but the thing the floor measures is genuinely empty.

## T1.5 — wayfinder sweep

**Three open maps.** [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) · [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) · [Item Generator](https://linear.app/threadbare/issue/THR-1227).

**AFK burn-down: 0 resolved, and 0 available — the AFK supply across every map is exhausted.** Checked by label across all states rather than per-map: **every `wayfinder:research` issue (21) and every `wayfinder:task` issue (5) in the team is `Done`.** There is no agent-doable wayfinder work left anywhere on the board. `ORCH_WAYFINDER_AFK_MAX` (2) was not a constraint this run; supply was.

**Frontier: 9, all HITL.** Computed by dropping children with an assignee or an open native blocker; blockers verified with `get_issue(includeRelations:true)` per candidate, not inferred.

| Map | Frontier | Blocked behind a sibling |
|---|---|---|
| Physical Conflict | **7** — THR-1263, THR-1264 (prototype); THR-1266, THR-1267, THR-1268, THR-1270, THR-1271 (grilling) | 3 — THR-1265, THR-1269, THR-1272 (all wait on THR-1263 / THR-1264) |
| Item Generator | **1** — THR-1236 (prototype); all four blockers Done | 0 |
| Powers & Spellcraft | **1** — THR-1232 (prototype), already assigned to Christian | 0 |

Every frontier ticket is `wayfinder:grilling` or `wayfinder:prototype`. **None was touched** — resolving one is the broken-HITL failure mode the wayfinder skill names. All nine are surfaced under `## Needs Christian` above, by name and in game terms.

Worth recording against THR-1271 specifically: its premise (*"Christian has never seen a company form in a live run, and this decision must not be made on a possibly-false premise"*) was tested by the [company ground-truth research](https://linear.app/threadbare/issue/THR-1259) and came back **live, not dormant** — 13–16 companies by tick 120 across seeds. Its own escape hatch (*"if the research finds companies effectively dormant, the answer may instead be 1-v-1 only"*) therefore does **not** apply. The question is genuinely open and needs a human answer.

## T2 — design authoring

**Triggered, and barred. This is the run's finding.**

- **Trigger:** non-`Deferral` items in `Ready for Dev` = **0**, below `ORCH_PROGRAM_WORK_FLOOR` (2).
- **Bound:** `In Design` holds **1 live, 0 excluded** — at `ORCH_MAX_IN_DESIGN` (1). Nothing may be staged.

The occupant is **[THR-790](https://linear.app/threadbare/issue/THR-790)** (Traits wave 2), and it classifies as **live** on the THR-1382 predicate's third row: *assigned, stale → counts, warn only, exit is `Parked`, never demotion*. Measured: entered `In Design` **2026-08-15T20:29Z — 26 days** — staged by this lane's own run h that day; assigned to Christian; no plan doc, no design-session comment, no attachment since. Its today `updatedAt` (08:34Z) is a relation-link artifact from THR-1448's creation, not design activity.

It has already been warned twice and neither warning was answered: the stale-claim sweep on 2026-09-02 (*"17 days without activity … the right exit is the `Parked` label"*) and `daily-backlog-grooming` on 2026-09-03, which framed the same question this report now carries — *"whether Christian intends to run this design pass himself."*

**Nothing was mutated.** Excluding an item from a count is not a state change, and applying `Parked` or unassigning is Christian's call and the grooming lane's remit, not this lane's.

**What the bar is costing, measured rather than asserted.** Two director-directed design tickets are staging-ready and cannot be staged: [THR-1155](https://linear.app/threadbare/issue/THR-1155) (High, agreed verbatim 2026-08-17, undesigned, 24 days in `Todo`) and [THR-1448](https://linear.app/threadbare/issue/THR-1448) (Medium, agreed verbatim this morning, blocker cleared 07:44Z today). Both would otherwise be this run's T2 pick — THR-1448 on freshness, THR-1155 on priority and age.

**Recorded for the weekly retro, not filed as a ticket** (scheduled-lane process throttle, and it does not clear the materiality bar as a defect because it is working as designed): THR-1382 deliberately kept the *assigned*-stale arm counting, reasoning that *"a bound that silently stopped counting a person's staged work would let this lane stage a second item on top of it."* That reasoning still holds. What is now measurable is its cost — **26 days of a barred staging tier**, against a repair whose motivating incident was 21 barred runs. There is no timeout on the assigned arm and no lane may add one, so the only exit is a human answer. Whether that asymmetry wants a bounded escalation instead of an unbounded wait is a question for the retro with a real number attached, not a conclusion this run should draw alone.

**Agreed work is not exhausted** — it is budget-bound. No Discord escalation raised on that basis; the prescribed interface for this is `## Needs Christian` → the hourly briefing, and `keep-work-flowing-cc` owns the doorbell.

## T3 — architecture health

**Detectors not due, and none was run. Nothing below is reported as clean on an unrun check.**

- **The daily sweep already ran today** at 06:27 local by [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md). The duty is once per day. Run c's two findings stand unchanged and are not restated: `check:process` exiting 0 with three sub-checks dark, and canon-staleness 27 → 28.
- **`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, and not reported as clean.**
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).
- **Redundancy: not assessed this sweep.** [Run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10g.md) ran the judgement pass today and found the Companies `phaseMatch` regex defect; this run's judgement budget went to the T1.5 frontier computation and the T2 bar. Stated plainly — the pass did not happen here, and no reachability result is dressed as one.

**New findings this run: 0.** The T2 bar and the wayfinder AFK exhaustion are board facts from their own tiers, counted there and not as architecture findings.

### Standing sub-duties

- **`In Design`: 1 live, 0 excluded** — [THR-790](https://linear.app/threadbare/issue/THR-790), assigned, 26d → warned, still counted. Printed rather than skipped: its absence is indistinguishable from a tier that did not run. Full working in § T2.
- **Hand-created `In Dev` tickets / stalled work: not re-measured this run** (T3 not due). [Run j](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10j.md) did both an hour ago and found the stalled-work detector's own scoping defect; that finding stands and is not restated.
- **`In Dev` slice observed in passing** (for the shelf reading, not as a sub-duty measurement): 2 issues — THR-1424 (assigned, live, started 06:56Z today) and [THR-1130](https://linear.app/threadbare/issue/THR-1130) (`Parked`, unassigned). **THR-1130's park remains stale and this lane still does not lift it** — lifting a park on an inference about liveness is the shape that let a lane strip a running session's assignee twice (impediment #755).

### Product vs process — the week

This run promoted **one product ticket** (THR-1318, `Content`/`Engine` — a dead-code activate-or-retire call on shipped authored prose) and **zero process tickets**. Nothing was filed. The process-ticket budget (at most one per three runs) is untouched.

**The headline is the one the throttle rule prescribes for an empty product shelf: the feature pipeline needs design, and design needs Christian** — not another process promotion. Both staging-ready items are his own recorded direction; neither can move while the single staging slot is held.

## Escalations

- **Nothing asked on Discord this run.** The one open question — whether Christian runs the Traits wave 2 design pass himself — is Christian-facing and goes via `## Needs Christian` → the hourly briefing, which is the prescribed interface. It has now been carried by three separate lanes (this one repeatedly, the stale-claim sweep on 09-02, `daily-backlog-grooming` on 09-03) without an answer; recorded here so the count is visible rather than re-asked from scratch each hour.
- **[THR-1451](https://linear.app/threadbare/issue/THR-1451) parked one run** for sequencing behind its live parent THR-1424. Not an escalation to anyone — a note so the next run picks it up rather than re-deriving the hold.
- **One Linear 502** on the first `save_issue(THR-1318)`. Retried once per fail-soft, succeeded, and the state was verified on re-query. No impediment logged — a single transient 502 with a successful retry is below the materiality bar and is not a new limitation.
