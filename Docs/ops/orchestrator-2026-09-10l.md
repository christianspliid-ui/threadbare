---
lane: tb-orchestrator
run: 2026-09-10l
promoted: 1
filed: 0
resolved: 1
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-10 (run l, ~15:35Z)

## Needs Christian

**The build queue is moving well right now — two things shipped in the last hour.** [The percentage cleanup](https://linear.app/threadbare/issue/THR-1424) landed at 14:39, and [a perception layer written for one god in twelve](https://linear.app/threadbare/issue/THR-1318) was picked up and deleted within twenty minutes of this lane queuing it. Nothing is stuck on the building side.

**One thing is still stuck, and it is the same thing as yesterday and the day before: new design work cannot start.**

The lane may hand you only **one** design job at a time. That slot has been held since 15 August — 26 days — by [Traits wave 2](https://linear.app/threadbare/issue/THR-790), which is assigned to you and has had no work on it. Nothing new can be teed up while it sits there.

**What is new this hour: a third piece of work is now waiting on that slot, and this one is actively costing content.** [The `concepts` ruling](https://linear.app/threadbare/issue/THR-1053) is a small question about how aftermath text names things — but it is the only reason two written encounters, *Snow on the Pass* and *Riders Behind the Caravan*, have been excluded from **two** retrofit batches running three weeks now, and it will exclude them from a third. The author's own words: *"if that ruling goes the other way, the work is thrown away. Those two need a design call, not an author."* The research behind it is already done, so the decision itself is now roughly a one-liner.

That joins the two already waiting, both of them your own direction: [nations and named areas are drawn but not simulated](https://linear.app/threadbare/issue/THR-1155) (17 August) and [a held town makes you the faction's town-keeper](https://linear.app/threadbare/issue/THR-1448) (this morning).

**The question is still one yes/no:** do you still intend to run the Traits wave 2 design pass yourself? **Yes** → nothing changes and these keep waiting. **No** → say so, it gets unassigned, and the slot frees immediately.

Three separate lanes have now asked this without an answer (this one repeatedly, the stale-claim sweep on 2 September, backlog grooming on 3 September).

---

**Your three design maps are still out of work that does not need you** — unchanged from [last hour](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10k.md), where all nine waiting questions are listed by name. Nothing new was added and nothing was resolved, so it is not re-listed here.

If you want a way in, the two that unblock the most are the fight loops: [how a fight against a monster plays out](https://linear.app/threadbare/issue/THR-1263) and [how two people fight each other](https://linear.app/threadbare/issue/THR-1264) — both come with mock transcripts for you to react to, and between them they unblock three of the other questions. Open a chat and say "work the map".

## T1 — unblock sweep

Scanned `Todo` (35) and `Ready for Dev` (1) — two state-filtered calls, sorted in memory. Board read confirmed live; the precheck's `linear=nokey` is the credential-free script probe and says nothing about the MCP connector (expected on the home machine, not a fault).

**Promoted — 1.**

`[orchestrator] T1 promote THR-1451: sequencing gate THR-1424 (Done 2026-09-10T14:39:45Z, PR #1880) → Ready for Dev (program: Encounter Experience)`

- **[THR-1451](https://linear.app/threadbare/issue/THR-1451)** — *The rest of the percentage sweep.* [Run k](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10k.md) held this one run for sequencing and named its discharge condition: *"promotable next run once THR-1424 lands or THR-1426 is claimed."* **THR-1424 reached `Done` at 14:39:45Z — four minutes after run k's scan** ([PR #1880](https://github.com/christianspliid-ui/threadbare/pull/1880)), so the Law 15 ruling this ticket builds on is merged and the filing session has finished. Plan-doc liveness passes trivially (names no doc; evidence is inline per-file). THR-990 latest-comment check: **zero comments**, so no standing verdict. Verified `Ready for Dev` with **no `assignee` key** on the `get_issue` re-query. [Coordination block posted](https://linear.app/threadbare/issue/THR-1451#comment-a2679150-9056-4fd4-9cee-103fa3f32d1f) — three lines, mutex reason inline, discharged gate recorded, browser-verify evidence shape, plus the `createPortal` vacuous-assertion trap restated so the executor does not rediscover it.

**New finding — 1: a satisfied ticket with no closer.**

`[orchestrator] T1 finding THR-1380: fully shipped under THR-1299 slice 6 (PR #1777, merged 2026-09-02); open 8 days with no closer`

- **[THR-1380](https://linear.app/threadbare/issue/THR-1380)** — *UL-proposal: calling, moment, follow.* Its sequencing line pointed at THR-1299, which is `Done` since 2026-09-02T17:17:47Z; that ticket's slice 6 PR is titled *"…rulebook §10.8, **glossary entries**, and the close"*, which made an already-shipped outcome plausible — so the shard was **read rather than the ticket trusted**. All six deliverables are on `origin/main`: the **Calling** / **Moment** / **Follow** entries (`Docs/ubiquitous-language/Agents.md:582/598/614`), both requested disambiguations (*Kindle a Calling*, *Defining Moment*), and the `Chronicle Entry → Moment` See-Also (`Prose.md:60`). Decisively, each entry **self-attributes to this ticket** — *"seated by THR-1380 with the THR-1299 implementation."* This is the shipped-under-a-sibling shape: the work landed inside another ticket's slice, so no commit ever carried a close keyword for this id, and it would have been re-scanned hourly forever. [Evidence comment posted](https://linear.app/threadbare/issue/THR-1380) recommending close-as-completed citing PR #1777. **Not closed here** — this lane does not set terminal states outside the `wayfinder:*` carve-out. Routed to `daily-backlog-grooming`.

**Declined — 7**, each naming what held it:

| Issue | Reason | Evidence |
|---|---|---|
| [THR-1053](https://linear.app/threadbare/issue/THR-1053) | Wrong destination → T2 | `Blocked by: nothing`, but the **latest comment** (grooming, today 07:19Z) rules it explicitly: *"Not promoted past `Todo`: it needs a design pass to write the ruling, not an executor."* Promoting would override a dated routing decision 8 hours old |
| [THR-1024](https://linear.app/threadbare/issue/THR-1024) | Unmet blocker | *"do not start this before THR-966"* — [THR-966](https://linear.app/threadbare/issue/THR-966) is `Idea`, not Done |
| [THR-1348](https://linear.app/threadbare/issue/THR-1348) | Wrong destination → T2 | *"this is the fork, and it is not the executor's to settle"* — three readings that are *"genuinely different games"* |
| [THR-1448](https://linear.app/threadbare/issue/THR-1448) | Wrong destination → T2 | Gate met (THR-1287 `Done` 07:44:58Z today) but *"a design ticket; plan doc before code"* |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274) | Wrong destination → T2 | *"This is a design ticket, not a patch"* — needs the new-node-type design first |
| [THR-1393](https://linear.app/threadbare/issue/THR-1393) | Wrong destination → T2 | *"a design decision, not an executor's call"* |
| [THR-1133](https://linear.app/threadbare/issue/THR-1133) | Unclaimable by this queue | *"Blocked by: nothing technical. Requires an **attended** session; the hourly unattended lane cannot discharge it."* Promoting it would seat an unclaimable item at the queue head — the exact pathology this ticket was consolidated to end. It was demoted out of `In Dev` on 2026-09-04 for this reason |

**Skipped unconditionally — 15** `wayfinder:*` issues (3 maps + 12 decision tickets). These never enter `Ready for Dev`; they are T1.5's input.

**Promotion ceiling: not reached.** Shelf held 1 at scan, far below `QUEUE_BACKED_UP_MIN` (15); 1 of `ORCH_PROMOTE_BATCH_MAX` (5) used. **No candidate was held back by the ceiling** — every non-promotion above is a stated decline, not a throttle.

**Run k's promotion worked end-to-end, which is worth recording as the lane's own evidence.** [THR-1318](https://linear.app/threadbare/issue/THR-1318) — unpromoted for 13 days because it was filed 70 minutes before its blocker completed — was promoted 14:31Z, claimed 15:02Z, and `Done` 15:23Z via [PR #1881](https://github.com/christianspliid-ui/threadbare/pull/1881), four minutes before this scan. From promotion to merged retirement: **52 minutes.**

**Shelf after this run: 2** ([THR-1426](https://linear.app/threadbare/issue/THR-1426), [THR-1451](https://linear.app/threadbare/issue/THR-1451)) — both `Deferral`-labelled, and they are **mutex with each other** (same Law 13/15 family). So non-`Deferral` program work on the shelf is **0**, and the executor's slot is free (`In Dev` holds only the `Parked` [THR-1130](https://linear.app/threadbare/issue/THR-1130)). The queue is not empty, but the thing the T2 floor measures is.

## T1.5 — wayfinder sweep

**Three open maps.** [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) · [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) · [Item Generator](https://linear.app/threadbare/issue/THR-1227).

**AFK burn-down: 0 resolved, 0 available.** Re-confirmed by label across all states rather than per-map: **every `wayfinder:research` issue (21) and every `wayfinder:task` issue (5) in the team is `Done`.** There is no agent-doable wayfinder work anywhere on the board. `ORCH_WAYFINDER_AFK_MAX` (2) was not the constraint — supply was.

**Frontier: 9, all HITL. Unchanged from run k**, re-verified rather than assumed:

| Map | Frontier | Blocked behind a sibling |
|---|---|---|
| Physical Conflict | **7** — THR-1263, THR-1264 (prototype); THR-1266, THR-1267, THR-1268, THR-1270, THR-1271 (grilling) | 3 — THR-1265, THR-1269, THR-1272 (all wait on THR-1263 / THR-1264) |
| Item Generator | **1** — THR-1236 (prototype) | 0 |
| Powers & Spellcraft | **1** — THR-1232 (prototype), assigned to Christian | 0 |

All ten Physical Conflict children were checked individually with `get_issue(includeRelations:true)`; every named blocker resolves to a `Done` research ticket, so the seven are genuinely unblocked and not merely unscanned. **None was touched** — resolving a `grilling`/`prototype` ticket is the broken-HITL failure mode the wayfinder skill names.

Not re-listed under `## Needs Christian` in full this run: run k carried all nine by name and nothing changed, so repeating the block hourly would be the "trains the reader to skip it" pathology this lane's own reporting rule forbids. The two entry points that unblock the most are surfaced instead.

## T2 — design authoring

**Triggered, and barred — for the twelfth consecutive run today.**

- **Trigger:** non-`Deferral` items in `Ready for Dev` = **0**, below `ORCH_PROGRAM_WORK_FLOOR` (2).
- **Bound:** `In Design` holds **1 live, 0 excluded** — at `ORCH_MAX_IN_DESIGN` (1). Nothing may be staged.

The occupant is **[THR-790](https://linear.app/threadbare/issue/THR-790)** (Traits wave 2), classified **live** on the THR-1382 predicate's third row — *assigned, stale → counts, warn only, exit is `Parked`, never demotion*. Measured this run: entered `In Design` **2026-08-15T20:29:32Z = 26 days**, assigned to Christian, no `Parked` label, no plan doc, no design-session comment. Its `updatedAt` of 08:34Z today is a relation-link artifact from THR-1448's creation, not design activity.

**Nothing was mutated.** Excluding an item from a count is not a state change, and applying `Parked` or unassigning is Christian's call and the grooming lane's remit.

**What the bar costs, and it went up this hour.** Three director-agreed items are staging-ready and cannot be staged:

| Candidate | Agreed | Waiting | Cost of the wait |
|---|---|---|---|
| [THR-1053](https://linear.app/threadbare/issue/THR-1053) | Reconciles two shipped decisions | Since 2026-08-09 | **Quotable and rising** — the sole exclusion reason for two authored encounters across **two retrofit batches / ~3 weeks**, and it will bar batch 3. Sole blocker on [THR-1130](https://linear.app/threadbare/issue/THR-1130)'s Done-when. The deciding fact is already researched and recorded |
| [THR-1155](https://linear.app/threadbare/issue/THR-1155) | Verbatim, 2026-08-17 | 24 days | Nations and areas stay unsimulatable; nothing in the fiction can point at them |
| [THR-1448](https://linear.app/threadbare/issue/THR-1448) | Verbatim, this morning | Blocker cleared 07:44Z | Freshest direction; would be this run's pick on recency |

**THR-1053 is new to this list** and is the strongest of the three on the materiality bar, because its cost is measured rather than asserted and it sits on a shipped content pipeline's critical path. Run k named only the other two.

**Recorded for the weekly retro, not filed** (scheduled-lane process throttle; it is working as designed, not a defect): the THR-1382 assigned-stale arm has **no timeout and no lane may add one**, so the only exit is a human answer. 26 days barred against a repair whose motivating incident was 21 barred runs. Whether that asymmetry wants a bounded escalation is a retro question with a real number attached, not a conclusion this run draws alone.

**Agreed work is not exhausted — it is budget-bound.** No Discord escalation on that basis; the prescribed interface is `## Needs Christian` → the hourly briefing, and `keep-work-flowing-cc` owns the doorbell.

## T3 — architecture health

**Not due. No detector was run this hour, and nothing below is reported as clean on an unrun check.**

- **The daily sweep already ran today** at 06:27 local by [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md); the duty is once per day. Run c's two findings stand unchanged and are deliberately not restated: `check:process` exiting 0 with three sub-checks dark, and canon-staleness 27 → 28.
- **`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, not reported as clean.**
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).
- **Redundancy: not assessed this sweep.** [Run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10g.md) ran the judgement pass today; this run's judgement budget went to the T1 candidate reads and the THR-1380 shard verification. Stated plainly — the pass did not happen here, and no reachability result is dressed as one.

The one new finding this run (**THR-1380**, satisfied with no closer) is a **T1 board finding, not an architecture-health finding**, and is counted and reported there. The frontmatter's `newFindings: 1` refers to it; T3 contributed none, because T3 did not run.

### Standing sub-duties

- **`In Design`: 1 live, 0 excluded** — [THR-790](https://linear.app/threadbare/issue/THR-790), assigned, 26d → warned, still counted. Printed rather than skipped: its absence is indistinguishable from a tier that did not run. Working in § T2.
- **Hand-created `In Dev` tickets / stalled work: not re-measured** (T3 not due). [Run j](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10j.md) did both and found the stalled-work detector's own scoping defect; that finding stands.
- **`In Dev` slice observed in passing** (for the shelf reading, not as a sub-duty measurement): **1** issue — [THR-1130](https://linear.app/threadbare/issue/THR-1130), `Parked`, unassigned, started 2026-08-15. **This lane still does not lift that park** — lifting one on an inference about liveness is the shape that let a lane strip a running session's assignee twice (impediment #755). Note it is the ticket THR-1053 is blocking, so the park and the T2 bar are the same stall seen from two sides.

### Product vs process — the week

This run promoted **one product ticket** ([THR-1451](https://linear.app/threadbare/issue/THR-1451), UI pillar) and **zero process tickets**; nothing was filed. The process-ticket budget (at most one per three runs) remains untouched.

**Headline, as the throttle rule prescribes for an empty product shelf: the feature pipeline needs design, and design needs Christian** — not another process promotion. All three staging-ready items are his own recorded direction, and none can move while the single staging slot is held.

## Escalations

- **Nothing asked on Discord this run.** The one open question — whether Christian runs the Traits wave 2 design pass himself — is Christian-facing and goes via `## Needs Christian` → the hourly briefing, the prescribed interface. Carried now by three lanes without an answer; recorded so the count stays visible rather than being re-asked from scratch each hour.
- **[THR-1380](https://linear.app/threadbare/issue/THR-1380) routed to grooming** for a close-as-completed, with the shard evidence attached. Not an escalation to Christian — a technical verdict, which is the agent's to make.
- **No Linear errors this run.** Both writes (`save_issue` state, `save_comment`) returned clean and the state was verified on re-query.
