---
lane: tb-orchestrator
run: 2026-09-08e
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-08 (run e, ~20:27–20:35Z)

**The band program's second ticket landed, the ticket promoted an hour ago was claimed within four minutes of the promotion, and a proposal nobody has ever looked at turned out to be waiting on exactly the thing that just merged.**

[THR-1439](https://linear.app/threadbare/issue/THR-1439) — *yield and leverage* — reached `Done` at **20:07Z**, merged as PR #1858; `origin/main` is now at `1c68c7db`. That is the second of the three delivery tickets on the undertakings map, and it is the one that made the Bonds tab's **Agreements** section real rather than a placeholder.

Nothing was promoted this run, and that is the correct outcome rather than a quiet one: the single new candidate on the board is glossary work, and the rule against relieving a thin shelf with process work is explicit. The reasoning is recorded on the ticket rather than only here.

## Needs Christian

Three standing asks, unchanged and restated in full — the briefing builds its list from this section, so anything dropped here reads to you as "no longer wanted". Then one line about what happens if none of them move this week.

### 1. Approve the encounter batch — [Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

**Nearly five days waiting, and still the biggest single unblock on the board.** Saying *"Batch 2, run the six"* puts six encounters of content work into the build queue the same hour. The brief is here: [4 September retrofit brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md). The question inside it is whether the camp six should be **repaired in place or re-rolled from fresh premises** — they were written in July, under the old prose doctrine.

### 2. The fighting design waits entirely on you — [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)

Unchanged, and re-measured this run: **there is no legwork left anywhere on it.** All four research questions are answered and written up; all ten remaining questions are yours. What defeat should look like. How much monster is just enough. What winning leaves in your hands. Whether companies fight as units. When you have an evening, open a chat and say *"work the physical conflict map"*.

### 3. A yes or no on spending image credits — [regenerate five scene images](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)

Unchanged. Five Meet-The-First scene pictures carry defects — painted-in buttons, baked-in titles, individuated faces. Regenerating them spends image credits, which is the only reason it waits. Nothing is broken meanwhile; substitutes are standing in.

### The build queue runs dry in about two hours of work

Not a fourth ask — a consequence of the three above, stated once so it is not a surprise tomorrow. Two things remain to build: [the capability rider](https://linear.app/threadbare/issue/THR-1440) and [a gate flip](https://linear.app/threadbare/issue/THR-1256). One is being worked now. After those, the queue is empty, and nothing an agent can do refills it: the two designs closest to ready ([card grammar](https://linear.app/threadbare/issue/THR-1002), [traits wave 2](https://linear.app/threadbare/issue/THR-790)) both need an attended design session, and the largest block of content work needs ask 1. **An evening on any one of the three restarts the line.**

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. The ceiling never engaged** (shelf at scan was 2, far under the 15-item backed-up threshold; 0 against `ORCH_PROMOTE_BATCH_MAX` 5).

Board at scan (~20:28Z): **45 `Todo`** (16 carrying a `wayfinder:*` label, skipped unconditionally), **2 `Ready for Dev`**, **3 `In Dev`**, **2 `In Design`**.

**One live claim, and it is last hour's promotion.** [THR-1442](https://linear.app/threadbare/issue/THR-1442) moved `Ready for Dev` → `In Dev` at **19:32Z** — roughly four minutes after run d promoted it — assigned, and still active at 20:01Z. The other two `In Dev` issues ([THR-1392](https://linear.app/threadbare/issue/THR-1392), [THR-1130](https://linear.app/threadbare/issue/THR-1130)) both carry `Parked` with no assignee. The executor's WIP slot is occupied, so nothing promoted this hour would have been picked up before the next run anyway.

### Assessed for the first time — [THR-1441](https://linear.app/threadbare/issue/THR-1441), and deliberately not promoted

A UL proposal for two game words, **Agreement** (a favour owed, or a mark held as leverage) and **Means** (the tier word for wealth). Filed 16:46Z today by the intent judge working on THR-1439's plan doc; no run before this one had it in view.

**Its gate — implicit, but real — cleared 20 minutes before this scan.** It names no `Blocked by` line, but carries the same shape [THR-1380](https://linear.app/threadbare/issue/THR-1380) carried explicitly: the entries land with or after the implementation that gives the words their rules of play. Both implementations are now on `origin/main` @ `1c68c7db` — THR-1439 (`Done` 20:07Z) for Agreement, [THR-1428](https://linear.app/threadbare/issue/THR-1428) (`Done` 2026-09-07) for Means. Both words are live on player surfaces and neither is seated:

```
src/components/Game/tabs/BondsTab.tsx:261      <SectionHeading as="h2">Agreements</SectionHeading>
src/components/Game/tabs/OverviewTab.tsx:611   <SectionHeading as="h2">Means</SectionHeading>
src/components/Game/FactionSheet.tsx:340       <Section title="Means">
git grep "^### Agreement\|^### Means" origin/main -- Docs/ubiquitous-language/   → no matches
```

**Not promoted, on the materiality bar.** Glossary work with no quotable above-bar loss and no cost/benefit line does not enter `Ready for Dev` on this lane's initiative (CLAUDE.md § Prioritization; the 2026-08-10 process-work throttle). The shelf being thin is explicitly not grounds to relieve it with tidying — *a starved shelf is a shelf, not a license to binge* — and doing so would have spent the hour on a glossary PR while the actual constraint is design and approval capacity. **This is the discipline working, not a gap:** the one promotable-looking thing on the board this hour was process work, and it was declined for being process work.

The deliverable is two entries in `Docs/ubiquitous-language/Agents.md`, and the proposal body already contains them in seatable form. [Recorded on the ticket](https://linear.app/threadbare/issue/THR-1441) as ride-along work — seat them in the next PR that touches the Bonds/Overview surfaces or the undertaking object registry, which is exactly how THR-1380's three terms landed inside THR-1299's slice 6.

### Re-verified rather than assumed — [THR-1393](https://linear.app/threadbare/issue/THR-1393)'s premise survived both merges

THR-1393 is a standing decline (*wrong destination → T2*), and its first leg is a measurement that two large merges could plausibly have invalidated: *"`strategicIntelligence` is a write-only property bag — 15 writers, zero engine readers."* THR-1439 ships *stealing a secret* and THR-1438 ships *watching an army*, both of which write intelligence, so the premise was re-taken against `origin/main` rather than carried forward:

```
src/engine/strategicGraphOps.ts:452     writer  (record_intelligence)
src/debug-bridge.ts:2691                reader  — dev-only, tree-shaken in prod
```

Still zero **engine** readers. Worth one caution for whoever picks this up: a docblock at `src/data/undertaking-objects.ts:1490` says *"the war readout reads it back as `scoutedBy`"*, and the war readout is a `window.__DEBUG` accessor, not an engine consumer. Read as a claim that intelligence now has a reader, that sentence would retire this ticket's first leg incorrectly. The `observe × Army` cell itself is *not* decoration — it writes familiarity, which is read live — but the intelligence record half is still consumed only by the debug bridge.

### Declined — unchanged, evidence not re-derived

The standing declines ([THR-1222](https://linear.app/threadbare/issue/THR-1222) human-approval gate · [THR-1301](https://linear.app/threadbare/issue/THR-1301) nothing left to implement · [THR-1380](https://linear.app/threadbare/issue/THR-1380) shipped in full under THR-1299 · [THR-1348](https://linear.app/threadbare/issue/THR-1348), [THR-1393](https://linear.app/threadbare/issue/THR-1393) and [THR-1287](https://linear.app/threadbare/issue/THR-1287) wrong destination → T2 · 16 `wayfinder:*`) all hold on the evidence recorded by [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08.md#t1--unblock-sweep) and [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08d.md#t1--unblock-sweep). Nothing on any of them changed this hour.

*One note on THR-1287, since the deletion it was waiting on landed today:* [THR-1303](https://linear.app/threadbare/issue/THR-1303) merged at 17:45Z under the title *"the control family deletes, but not the machine underneath it"* — the templates retired, the neglect timer did not. `neglectTicks` still increments at `src/engine/strategicActionLifecycle.ts:1094` on `origin/main`. So the design question stands exactly as run d framed it for Christian, and the classification (T2, not the executor) is unchanged.

## T1.5 — wayfinder sweep

**Four open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — the queue is empty by measurement taken this run, not carried over.**

```
list_issues(label:"wayfinder:research", state:"Todo")  → 0
list_issues(label:"wayfinder:task",     state:"Todo")  → 0
```

No agent-doable decision ticket exists on any map. Every open child of every map carries `grilling` or `prototype` — HITL by label, untouchable by this lane by rule.

**[THR-1396](https://linear.app/threadbare/issue/THR-1396) — Undertakings: one ticket from delivered.** [THR-1438](https://linear.app/threadbare/issue/THR-1438) `Done`, [THR-1439](https://linear.app/threadbare/issue/THR-1439) `Done` 20:07Z, [THR-1440](https://linear.app/threadbare/issue/THR-1440) queued and unassigned. The map's design work has been finished for days; what remains is one build.

**The other three are unchanged:** [THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict (10 open, all HITL, none assigned — the largest HITL debt on the board, with zero remaining legwork), [THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft (sole open child assigned to Christian), [THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator (one unassigned `prototype`).

**No map body was edited** — Decisions-so-far gains a line only for tickets this lane resolved, and it resolved none.

## T2 — design staging

**Triggered on the floor. Barred by the bound. Both numbers below.**

**Trigger: fired.** Non-`Deferral` items in `Ready for Dev` = **1** ([THR-1440](https://linear.app/threadbare/issue/THR-1440); [THR-1256](https://linear.app/threadbare/issue/THR-1256) carries `Deferral`) against `ORCH_PROGRAM_WORK_FLOOR` of 2. Run d's promotion left the shelf at 3; THR-1442's 19:32Z claim took it back to 2.

**Bound: barred. `In Design` holds 2 live, 0 excluded** against `ORCH_MAX_IN_DESIGN` of 1 — measured on the `classifyInDesignItem` predicate (newest of *newest comment* and *newest state transition*, never `updatedAt`), not by column occupancy:

- **[THR-1002](https://linear.app/threadbare/issue/THR-1002)** — unassigned; newest comment 2026-09-03T07:19:42Z, the grooming lane's verdict → **5.6 days**, under the 7-day threshold → live, counts.
- **[THR-790](https://linear.app/threadbare/issue/THR-790)** — assigned → counts whatever its age.

**The date to watch is 2026-09-10 ~07:19Z**, when THR-1002 crosses seven days from that comment and stops counting — *unless something comments on it first*. That is the warn-only guard whose warning resets the clock it reads, and it has already looped once on this exact ticket (a 2026-09-02 staleness warning correctly excluded it at 14 days; the grooming lane's reasoned 2026-09-03 reply reset it to zero). Both lanes behaved correctly. The predicate still lost five days.

**Nothing was mutated.** Excluding is a count, not a state change; applying `Parked` is Christian's call.

**The reading is unchanged and getting sharper each hour:** the shelf is thin, the staging budget is full, and both items holding it are waiting on the same missing input — an attended design session. Staging a third would not produce a line of code.

## T3 — architecture health

**Not due. Skipped, and no detector result is reported.**

[Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08.md#t3--architecture-health) ran the full sweep at ~16:27Z today; the tier is daily on the first run after `ORCH_HEALTH_SWEEP_HOUR`, and that run was it.

**Explicitly not run and not claimed as clean:** `generate-interface-map:dry`, `check:canon-staleness`, `sweep:rank-reach`, `check:process`. Their last real results are run a's. **`__DEBUG.validateTraitRefs()` remains browser-only and unmeasurable headless.** **Redundancy: not assessed this sweep** — no judgement pass was run.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Tuesday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

**The one new finding is counted here but came out of T1, not a detector** — THR-1441's gate cleared with nothing that will pick it up, below. No detector produced it and none is claimed to have.

**Items standing open from earlier runs**, restated so a reader of the newest report does not conclude they were dropped: run a's Finding 1 (the `create` verb family losing the `occurred_at` edge that makes witnesses possible — 5 failures in 900 ticks, 100% correlated with `cell.create.*`), run c's note that `strategicControlChurn.test.ts`'s docblock still advertises two guards THR-1303 deleted, and this run's `undertaking-objects.ts:1490` docblock caution above. All three are sub-bar and go to the weekly retro under the scheduled-lane throttle, not to tickets from a lane.

### Product vs process — the week

Not re-derived; the trailing-week measure remains **~24 product / 6 process (~80% product)**. This run promoted nothing, so the ratio holds. The headline is unchanged and is explicitly not a call for more tidying: **the feature pipeline needs design and approval capacity**, which is why all three items in § Needs Christian are asks rather than reports — and why the one promotable candidate this hour was declined for being process work.

## Escalations

**No Discord escalation raised.** Agreed work is not exhausted — two items on the shelf, one live claim against them — so the escalation condition did not fire. The three Christian-facing asks travel by the briefing, which is the sanctioned channel.

**The no-mechanism-will-move-this set is now three, and the third is a different failure from the first two.**

- [THR-1301](https://linear.app/threadbare/issue/THR-1301) — scope shipped under THR-1349; complete, and **nothing can close it**.
- [THR-1380](https://linear.app/threadbare/issue/THR-1380) — every clause shipped under THR-1299; complete, and **nothing can close it**.
- [THR-1441](https://linear.app/threadbare/issue/THR-1441) — *not* complete: real work, gate met as of 20:07Z tonight, and **nothing will pick it up**. It is correctly barred from the queue by the materiality bar, and the only path that seats it is a future PR whose author happens to read this comment.

The first two are inert. The third is not: two words the player reads on the mortal sheet have no canonical definition, and the UL is the authority every other source defers to. The shared mechanism across all three is the same one run d named — **a real dependency between two tickets, stated in prose, that no machinery reads.** One line at the weekly retro, not a ticket from this lane.
