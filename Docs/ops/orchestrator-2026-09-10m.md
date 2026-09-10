---
lane: tb-orchestrator
run: 2026-09-10m
promoted: 1
filed: 0
resolved: 1
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-10 (run m, ~16:31Z)

## Needs Christian

**One decision I made for you this hour — say no and I'll reverse it.**

The clock on the top bar has been lying. The game's own calendar counts a year as 360 ticks; the bar counts one as 120, so by the time the engine says year 1 the bar says year 4, and it drifts further forever. [The ticket](https://linear.app/threadbare/issue/THR-1452) was filed half an hour ago and it asked *you* to choose between two fixes: show the real year, or speed the seasons up threefold so the bar's number becomes true.

I read the code and the second option turns out not to exist — the dial it proposes turning isn't connected to anything. So I've queued the fix as "show the real year," which changes nothing about how fast the game moves; it just stops the number being wrong. **If you actually want a faster year — seasons turning three times as often — that's a genuine game-feel call and it's yours. Say so and I'll file it separately.** Otherwise ignore this; it's already moving.

---

**The thing that is still stuck is the same one as yesterday, and the day before, and it is still one yes/no.**

New design work cannot start. The lane may hand you one design job at a time, and that slot has been held since 15 August — **26 days** — by [Traits wave 2](https://linear.app/threadbare/issue/THR-790), which is assigned to you with no work on it. Four pieces of your own direction are queued behind it:

- [The `concepts` ruling](https://linear.app/threadbare/issue/THR-1053) — the only reason two finished encounters have been cut from **two** retrofit batches over three weeks, and they'll be cut from a third. The research is done; the decision is about a one-liner.
- [Nations and areas are drawn but not simulated](https://linear.app/threadbare/issue/THR-1155) — your direction, 17 August.
- [A held town makes you the faction's town-keeper](https://linear.app/threadbare/issue/THR-1448) — your direction, this morning.
- [Ambitions below the spotlight tier can never act](https://linear.app/threadbare/issue/THR-1348) — three readings that are, in the ticket's words, genuinely different games.

**Do you still intend to run the Traits wave 2 design pass yourself?** **Yes** → nothing changes and these keep waiting. **No** → say so, it gets unassigned, and the slot frees immediately. Four lanes have now asked without an answer.

---

**Your three design maps are unchanged** — nine questions waiting, none of them resolvable without you, all listed by name in [run k](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10k.md). Not re-listed here because nothing moved. The two best ways in are still the fight loops: [fighting a monster](https://linear.app/threadbare/issue/THR-1263) and [two people fighting](https://linear.app/threadbare/issue/THR-1264) — both come with mock transcripts to react to, and between them they unblock three more. Open a chat and say "work the map".

## T1 — unblock sweep

Scanned `Todo` (35) and `Ready for Dev` (1) — two state-filtered calls, sorted in memory. Board read confirmed live; the precheck's `linear=nokey` is the credential-free script probe and says nothing about the MCP connector (expected on the home machine, not a fault).

**Board delta since [run l](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10l.md) (15:35Z):** [THR-1426](https://linear.app/threadbare/issue/THR-1426) left the shelf for `In Dev`, and **THR-1452 is new** — filed 16:21Z by that same execution session as its deferral. Every other candidate is unchanged and its decline stands as recorded in run l; they are not re-argued here.

**Promoted — 1.**

`[orchestrator] T1 promote THR-1452: self-declared ruling gate discharged on evidence (option B unreachable: orchestrator.ts:2874 hardcodes 90/360; temporal.ts has zero live importers) → Ready for Dev (program: Encounter Experience)`

- **[THR-1452](https://linear.app/threadbare/issue/THR-1452)** — *The top bar's year disagrees with the engine's own clock by threefold.* Filed into `Todo` **with** a complete coordination block (THR-836 working as intended), but that block declared its own gate: *"Blocked on: a ruling on which clock is canonical. Both options are cheap; they differ in what they do to the pace of every seasonal system."*

  On the taxonomy that is a **wrong destination → T2** decline, and four such declines already stand on this board. **It was read rather than routed**, because the gate rests on a factual premise and the premise is checkable in one pass. It does not hold — see the finding below. With option B unavailable, the remaining arm is a pacing-neutral defect repair, which is executor work under the standing rule that unambiguous bug fixes and the *how* of an agreed outcome are the agent's to decide with a veto invited, not Christian's to unblock.

  Plan-doc liveness passes trivially (names no doc; evidence is inline per-file). THR-990 latest-comment check: the sole comment is the filing block, no standing verdict. Verified `Ready for Dev` with **no `assignee` key** on the `get_issue` re-query. [Coordination block posted](https://linear.app/threadbare/issue/THR-1452) — corrected evidence, scope pinned to option A, Done-when #4 struck with its reason, browser-verify evidence shape, and the `document.hidden` throttle restated so the executor uses `window.__DEBUG.tick(n)`.

**New finding — 1: an unreachable second tick implementation, kept green by its own tests.**

`[orchestrator] T1 finding: src/engine/simulation.ts has zero importers; TemporalController live only in tests; live season/year math is orchestrator.ts:2874-2875 with bare 90/360 literals`

Found while checking THR-1452's premise, and it is the reason that promotion could be made rather than deferred:

| Claim | Evidence |
|---|---|
| `src/engine/simulation.ts` is dead | Zero importers across `src/` and `scripts/`. The many `grep` hits are `simulationRuntime`, a different module |
| `TemporalController` is shipped nowhere | Constructed only by that dead class and by `temporal.test.ts` / `integration.test.ts`, which build it directly. **Tested but not shipped** |
| The live writer is elsewhere | `orchestrator.ts:2874-2875` — `Math.floor(s.tick / 90) % 4` and `Math.floor(s.tick / 360)`, as bare literals, not `TICKS_PER_SEASON` |
| So option B was a vacuous-green trap | Retuning `temporal.ts:12` changes nothing live, and `temporal.test.ts` goes green anyway because it exercises the dead class |
| And the CMS tunable is already decorative | `DEFAULT_TICKS_PER_SEASON` seeds `clock.ticksPerSeason`; nothing reads that field for the season math |
| But no behaviour is lost | The dead class's season-gated `processTraitDecay` is superseded — `orchestrator.ts:3557` calls it live, per agent. **Not** a missing-decay defect, and stated so rather than left implying one |

This is the **redundancy-not-reachability** class T3 owns, arrived at by judgement during candidate reading rather than by a detector — no detector would flag it, since both halves compile and one half is test-covered. **Nothing was filed and nothing was deleted:** dead-code pruning is named in CLAUDE.md § Prioritization as explicitly *not* clearing the Rule 0 materiality bar, and scheduled lanes do not file process tickets. It is recorded here and on the ticket for the weekly retro, with the deletion guardrail attached.

**Declined — 7**, unchanged from run l and not re-argued: [THR-1053](https://linear.app/threadbare/issue/THR-1053), [THR-1348](https://linear.app/threadbare/issue/THR-1348), [THR-1448](https://linear.app/threadbare/issue/THR-1448), [THR-1274](https://linear.app/threadbare/issue/THR-1274), [THR-1393](https://linear.app/threadbare/issue/THR-1393) (all wrong destination → T2); [THR-1024](https://linear.app/threadbare/issue/THR-1024) (unmet blocker THR-966, still `Idea`); [THR-1133](https://linear.app/threadbare/issue/THR-1133) (needs an attended session; unclaimable by this queue).

**[THR-1380](https://linear.app/threadbare/issue/THR-1380) still open** — run l posted the shipped-under-a-sibling evidence and routed it to grooming for a close-as-completed. Still `Todo` at this scan, 9 days open. Not re-promoted, not closed here (terminal states are outside this lane's remit except the `wayfinder:*` carve-out). Re-noted so the routing does not silently evaporate.

**Skipped unconditionally — 15** `wayfinder:*` issues (3 maps + 12 decision tickets). These never enter `Ready for Dev`; they are T1.5's input.

**Promotion ceiling: not reached.** Shelf held 1 at scan, far below `QUEUE_BACKED_UP_MIN` (15); 1 of `ORCH_PROMOTE_BATCH_MAX` (5) used. **No candidate was held back by the ceiling** — every non-promotion above is a stated decline.

**Shelf after this run: 2** — [THR-1451](https://linear.app/threadbare/issue/THR-1451) and [THR-1452](https://linear.app/threadbare/issue/THR-1452), both `Deferral`-labelled, mutually non-conflicting (percentage readouts vs the clock hook). Non-`Deferral` program work remains **0**, which is the number the T2 floor measures.

## T1.5 — wayfinder sweep

**Three open maps.** [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) · [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) · [Item Generator](https://linear.app/threadbare/issue/THR-1227).

**AFK burn-down: 0 resolved, 0 available.** Re-verified this run by label across all states rather than assumed from run l: **all 21 `wayfinder:research` issues and all 5 `wayfinder:task` issues in the team are `Done`.** There is no agent-doable wayfinder work anywhere on the board. `ORCH_WAYFINDER_AFK_MAX` (2) is not the constraint — supply is, and has been for several runs.

**Frontier: 9, all HITL, unchanged from run l** — 7 on Physical Conflict (THR-1263, THR-1264 prototype; THR-1266, THR-1267, THR-1268, THR-1270, THR-1271 grilling), 1 on Item Generator (THR-1236), 1 on Powers & Spellcraft (THR-1232). Run l checked all ten Physical Conflict children individually with `get_issue(includeRelations:true)` and every named blocker resolved to a `Done` research ticket; nothing on the board moved since, so that verification stands rather than being re-spent. **None was touched** — resolving a `grilling` / `prototype` ticket is the broken-HITL failure mode the wayfinder skill names.

Not re-listed in full under `## Needs Christian`: nothing changed, and repeating nine names hourly is the "trains the reader to skip it" pathology this lane's own reporting rule forbids. The two highest-leverage entry points are surfaced instead.

## T2 — design authoring

**Triggered, and barred — for the thirteenth consecutive run today.**

- **Trigger:** non-`Deferral` items in `Ready for Dev` = **0**, below `ORCH_PROGRAM_WORK_FLOOR` (2).
- **Bound:** `In Design` holds **1 live, 0 excluded** — at `ORCH_MAX_IN_DESIGN` (1). Nothing may be staged.

The occupant is **[THR-790](https://linear.app/threadbare/issue/THR-790)** (Traits wave 2), classified **live** on the THR-1382 predicate's third row — *assigned, stale → counts, warn only, exit is `Parked`, never demotion*. Measured this run: `startedAt` **2026-08-15T20:29:32Z = 26 days**, assigned to Christian, no `Parked` label, no plan doc, no design-session comment. Its `updatedAt` of 08:34Z today remains a relation-link artifact from THR-1448's creation, not design activity.

**Nothing was mutated.** Excluding an item from a count is not a state change, and applying `Parked` or unassigning is Christian's call and the grooming lane's remit.

**What the bar costs.** Four director-agreed items are staging-ready and cannot be staged — [THR-1053](https://linear.app/threadbare/issue/THR-1053) (quotable, rising: sole exclusion reason for two authored encounters across two retrofit batches / ~3 weeks, and the sole blocker on [THR-1130](https://linear.app/threadbare/issue/THR-1130)'s Done-when), [THR-1155](https://linear.app/threadbare/issue/THR-1155) (24 days), [THR-1448](https://linear.app/threadbare/issue/THR-1448) (freshest direction), [THR-1348](https://linear.app/threadbare/issue/THR-1348). Unchanged from run l except that THR-1348 is named explicitly this run, having been carried only in the decline table before.

**One item did *not* join that list this hour, and that is this run's substantive result.** [THR-1452](https://linear.app/threadbare/issue/THR-1452) arrived declaring itself blocked on a ruling — the exact shape of the four above. Reading its premise instead of routing it kept a fifth item off a queue that has not moved in thirteen runs, and put a fix on the executor's shelf in the same pass. **The generalisation is deliberately not drawn:** four of the five genuinely do need Christian, and a lane that started discharging design gates by argument would be choosing direction. The distinguishing test was narrow and mechanical — *is one arm of the fork unreachable in the code as written?* Where the answer is no, the item waits.

**Agreed work is not exhausted — it is budget-bound.** No Discord escalation on that basis; the prescribed interface is `## Needs Christian` → the hourly briefing, and `keep-work-flowing-cc` owns the doorbell.

## T3 — architecture health

**Not due. No detector was run this hour, and nothing below is reported as clean on an unrun check.**

- **The daily sweep already ran today** at 06:27 local by [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md); the duty is once per day. Run c's two findings stand unchanged and are deliberately not restated: `check:process` exiting 0 with three sub-checks dark, and canon-staleness 27 → 28.
- **`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, not reported as clean.**
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).
- **Redundancy: partially assessed, and it found something.** Not a scheduled judgement pass over the interface map — the dead-`simulation.ts` finding came out of reading one T1 candidate's premise. It is a genuine redundancy result (two tick implementations, one unreachable), not a reachability result dressed as one, and it is counted under T1 where it was found. No broader sweep was performed, and none is claimed.

The frontmatter's `newFindings: 1` refers to that finding. T3's scheduled detectors contributed none, because they did not run.

### Standing sub-duties

- **`In Design`: 1 live, 0 excluded** — [THR-790](https://linear.app/threadbare/issue/THR-790), assigned, 26d → warned, still counted. Printed rather than skipped: its absence is indistinguishable from a tier that did not run. Working in § T2.
- **Hand-created `In Dev` tickets / stalled work: not re-measured** (T3 not due). [Run j](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10j.md) did both and found the stalled-work detector's own scoping defect; that finding stands.
- **`In Dev` slice observed in passing** (for the shelf reading, not as a sub-duty measurement): **2** — [THR-1426](https://linear.app/threadbare/issue/THR-1426), claimed 06:57Z today and actively shipping (it filed THR-1452 at 16:21Z), and [THR-1130](https://linear.app/threadbare/issue/THR-1130), `Parked`, unassigned, started 2026-08-15. **This lane still does not lift that park** — lifting one on an inference about liveness is the shape that let a lane strip a running session's assignee twice (impediment #755). THR-1130 is the ticket THR-1053 blocks, so the park and the T2 bar remain the same stall seen from two sides.

### Product vs process — the week

This run promoted **one product ticket** ([THR-1452](https://linear.app/threadbare/issue/THR-1452), UI + Engine pillars) and **zero process tickets**; nothing was filed, and the dead-code finding was deliberately *not* converted into one. The process-ticket budget (at most one per three runs) remains untouched.

**Headline, as the throttle rule prescribes for an empty product shelf: the feature pipeline needs design, and design needs Christian.** Four of the five staging-ready items are his own recorded direction and none can move while the single staging slot is held. The fifth was dispatched by reading it.

## Escalations

- **Nothing asked on Discord this run.** The one open question — whether Christian runs the Traits wave 2 design pass himself — is Christian-facing and goes via `## Needs Christian` → the hourly briefing, the prescribed interface. Now carried by four lanes without an answer; recorded so the count stays visible rather than being re-asked from scratch each hour.
- **One agent-made call, veto surfaced rather than assumed.** Scoping [THR-1452](https://linear.app/threadbare/issue/THR-1452) to the pacing-neutral arm is a technical verdict on what the code can do, which is this lane's to make. Whether Christian wants a *faster* season is a game-feel question that is **not** foreclosed by it — it is named in `## Needs Christian` as a separate ticket he can ask for, and the promotion comment says the same on the ticket itself.
- **[THR-1380](https://linear.app/threadbare/issue/THR-1380) still awaiting grooming's close** — evidence attached by run l, no action taken since. Re-noted, not re-escalated.
- **No Linear errors this run.** Both writes (`save_issue` state, `save_comment`) returned clean and the state was verified on re-query, including the absent-`assignee` check.
