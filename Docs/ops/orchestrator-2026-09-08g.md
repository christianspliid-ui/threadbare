---
lane: tb-orchestrator
run: 2026-09-08g
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-08 (run g, ~22:27–22:40Z)

**The build queue reached zero, the exhaustion condition fired on the terms run f set for it, and this run escalated on Discord rather than filling the shelf with process work.**

Run f wrote the trigger in advance: *"If THR-1440 lands and THR-1256 is claimed before an approval arrives, the exhaustion condition fires for real and the next run escalates."* Both legs happened inside the hour. [THR-1440](https://linear.app/threadbare/issue/THR-1440) reached `Done` at **21:45:55Z**, taking [THR-1396](https://linear.app/threadbare/issue/THR-1396) — the Undertakings wayfinder map — to `Done` one second behind it. [THR-1256](https://linear.app/threadbare/issue/THR-1256), the last item on the shelf, was claimed. **`Ready for Dev` now holds zero issues.**

The escalation is [posted](https://discord.com/channels/@me/1530183488333152287/1547011577885229106). The run also did the one thing no previous run had: it opened the `Idea` column, which every prior census skipped by state.

## Needs Christian

**The build queue is empty for the first time.** Not short — empty. One sentence from you refills it.

### 1. Say *"Batch 2, run the six"* — [the encounter retrofit batch](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

**Six days waiting, and it is now the only thing that puts work in the queue this hour.** Approving it releases six encounters of content work immediately, plus [the card-name tightening](https://linear.app/threadbare/issue/THR-1255) that has been queued invisibly behind it for two weeks.

The question inside it, if you want to answer both at once: the six camp encounters were written in July under the old prose doctrine — **repaired in place, or re-rolled from fresh premises?** The brief is here: [4 September retrofit brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md).

### 2. The fighting design is still entirely yours — [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)

Unchanged and re-measured: **ten open questions, all yours, none with any legwork left.** Every research question on that map was answered and written up days ago. What defeat should look like. How much monster is just enough. What winning leaves in your hands. Whether companies fight as units. When you have an evening: open a chat and say *"work the physical conflict map"*.

### 3. A yes or no on spending image credits — [regenerate five scene images](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)

Unchanged. Five Meet-The-First scene pictures carry defects — painted-in buttons, baked-in titles, individuated faces. Regenerating them spends image credits, which is the only reason it waits. Nothing is broken meanwhile.

### One thing finished cleanly, worth knowing

**The Undertakings map is complete.** Every question on it is answered, every task closed, and the last piece of engine work — a finished undertaking growing the mortal in the Reach it leaned on — shipped tonight at 21:45Z. That map took roughly a week and closed without needing you at any point. It is the shape the other three maps could have if their questions were answered.

### Why the queue emptying is not a supply problem

Forty-four things sit in the backlog. **Not one of them is blocked on effort.** Two full censuses now agree — run f read the `Todo` column, this run read the `Idea` column, and both found the same thing: the work is waiting on rulings, not on hands. Roughly thirteen of those rulings are one or two sentences each, and each releases a concrete piece of buildable work.

If it would help, say **"rule on the backlog"** and the next attended session will bring them to you in one sitting, in game terms, smallest first.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. The ceiling never engaged** (shelf 0, far under the 15-item backed-up threshold; 0 against `ORCH_PROMOTE_BATCH_MAX` 5).

Board at scan (~22:28Z): **44 `Todo`** (15 carrying a `wayfinder:*` label, skipped unconditionally — one fewer than run f, THR-1396 having closed), **0 `Ready for Dev`**, **3 `In Dev`**, **2 `In Design`**, **50+ `Idea`**. `origin/main` @ `c9d1e73f`.

**The executor's slot is occupied and the shelf behind it is bare.** [THR-1256](https://linear.app/threadbare/issue/THR-1256) is `In Dev` and assigned; the other two `In Dev` issues ([THR-1392](https://linear.app/threadbare/issue/THR-1392), [THR-1130](https://linear.app/threadbare/issue/THR-1130)) both carry `Parked` with no assignee and are not live work. No hand-created `In Dev` ticket: THR-1256 passed through `Ready for Dev`, where run f observed it at 21:28Z.

**Board deltas this hour** (`-PT2H` sweep, nine touched issues): THR-1440 `Done` 21:45:55Z · THR-1396 `Done` 21:45:56Z · THR-1442 `Done` 20:37:49Z · THR-1256 claimed. No new candidate was created, and no comment bearing a verdict was posted on any open ticket.

### The `Idea` census — the column no previous run had opened

Every census so far has read `Todo` and treated `Idea` as out of scope by state. With the shelf at zero that is no longer defensible: the skill's T1 scope is *"each `Todo` / `Idea` candidate"*, and if promotable work existed anywhere it would be there. So the plausible executor candidates in `Idea` were opened and read in full.

**None is promotable, and the failure mode is identical to the `Todo` column's** — a design fork stated in the ticket's own words:

| ticket | gate | quoted from the ticket |
|---|---|---|
| [THR-1026](https://linear.app/threadbare/issue/THR-1026) `findGuildLocations` hardcodes `adventuring_guild` | **Design fork, first Done-when** | *"A decision is recorded on which faction definitions post ruin quest hooks … and why, in game terms."* The body frames it as fiction: *"A `merchant_consortium` or `civic_guard` posting an expedition contract is a different fiction from the adventurers' guild doing it"* |
| [THR-984](https://linear.app/threadbare/issue/THR-984) `lint:plan-doc` lints zero files and reports a pass | **Barred by the materiality bar** | A genuine gate-passing-while-broken defect, fully specified with four named fix options. But it records **one** measured incident (impediment #409) and self-bounds its own blast radius — *"the pre-commit hook does lint, so a broken plan doc cannot reach `main`"*. No quotable above-bar loss, no cost/benefit line → stays `Idea`. See the note below on why the empty shelf does **not** change this |
| [THR-1088](https://linear.app/threadbare/issue/THR-1088) legacy intervention row prints `+3% success` | **Already shipped** | This run's one finding — below |

The rest of the column self-declares from its titles and was not re-opened: drift-scan reports (THR-911 / 912 / 913 / 915, THR-747), UL proposals awaiting arbitration (THR-1441, THR-1408, THR-1406, THR-633), attended-capture tickets (THR-1419), explicit settle-which-is-right forks (THR-1053, THR-964, THR-716), and the long tail of Social Systems design epics (THR-67, THR-68, THR-76, THR-77, THR-78, THR-38, THR-219).

**Why an empty shelf did not lower the bar.** The temptation this run had to refuse is precise and named in CLAUDE.md § *Process-work throttle*: *"when the product shelf is empty, the headline finding is 'feature pipeline needs supply', never more tidying."* THR-984 is exactly the ticket that would have been promoted to make this report look productive — real, well-specified, and the one thing on the board an executor could have started tonight. It is also process work with sub-bar loss, and promoting it would have converted a visible supply failure into an invisible one. The shelf stays at zero and says so.

### The finding — THR-1088 was fixed on 17 August and nobody closed it

[THR-1088](https://linear.app/threadbare/issue/THR-1088) reports the legacy intervention row rendering `+3% success` / `+15% success` — a Law 13 violation, filed 2026-08-11, still sitting in `Idea` with a live `Deferral` label. [THR-1048](https://linear.app/threadbare/issue/THR-1048) shipped **2026-08-17T17:36Z** (PR #1527, `20bd16ab`) and repaired exactly that surface.

Verified against `origin/main` @ `c9d1e73f` rather than inferred from the sibling's title — the [upstream-grep-false-positive](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md) trap is what this check exists to avoid:

- `EncounterVeil.tsx:2612` — `boostLabel` is now `'fate decides'` for `withdrawn` and `undefined` otherwise. **No code path produces a percentage for a choice card.**
- `formatSignedPercent` / `formatProbability` survive only at `EncounterVeil.tsx:2522` and `:2528`, inside the `ResolutionReadoutBlock` that THR-1124 gated to the designer view.
- Both adapters set `stanceLabel` through `interventionStanceWord()` (`buildSimpleEncounterStageModel.ts:315`, `buildUnifiedEncounterStageModel.ts:374`/`:396`); `ChoiceBlock` renders that word (`:2702-2712`), never the enum — THR-1088's Law 14 half.
- **The machine gate exists.** `src/components/Game/__tests__/encounterVeilChoiceLaws.test.tsx:148` — *"Law 13 — no percentage anywhere on the veil"* — asserts `not.toContain('%')` and is **falsified against boosts of `0.15` and `0.03`**, the exact two values THR-1088 reported. It carries an anti-vacuity arm requiring three `choice-stance` cards to render first, so it cannot pass on an empty surface.

Two of THR-1088's three Done-whens are met on `main`; the third (a 1920×1080 capture) is evidence for a change that no longer needs making. **The evidence is now recorded as a comment on the ticket** so a later sweep declines it in one read instead of re-deriving this. No state change was made — the orchestrator promotes and declines, it does not close.

**This is the fourth instance of one class, and that is now the interesting part.** THR-1301, THR-1380, THR-1441 and now THR-1088 are all real work that shipped (or became satisfiable) under a sibling id, with no machinery that will ever notice. Run d named the mechanism — *a real dependency between two tickets, stated in prose, that nothing reads*. Four instances is a pattern, not three one-offs. It goes to the weekly retro under the scheduled-lane throttle, not to a ticket from this lane.

### Standing declines — evidence not re-derived

[THR-1222](https://linear.app/threadbare/issue/THR-1222) (human-approval gate) · [THR-1301](https://linear.app/threadbare/issue/THR-1301) and [THR-1380](https://linear.app/threadbare/issue/THR-1380) (shipped, uncloseable) · [THR-1348](https://linear.app/threadbare/issue/THR-1348), [THR-1393](https://linear.app/threadbare/issue/THR-1393), [THR-1287](https://linear.app/threadbare/issue/THR-1287) (wrong destination → T2) · [THR-1195](https://linear.app/threadbare/issue/THR-1195), [THR-1114](https://linear.app/threadbare/issue/THR-1114), [THR-1189](https://linear.app/threadbare/issue/THR-1189), [THR-1315](https://linear.app/threadbare/issue/THR-1315), [THR-1024](https://linear.app/threadbare/issue/THR-1024), [THR-1255](https://linear.app/threadbare/issue/THR-1255), [THR-175](https://linear.app/threadbare/issue/THR-175), [THR-1424](https://linear.app/threadbare/issue/THR-1424), [THR-1426](https://linear.app/threadbare/issue/THR-1426) (run f's census) · 15 `wayfinder:*` (skipped unconditionally). Nothing on any of them changed this hour.

## T1.5 — wayfinder sweep

**Three open maps, down from four. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — the queue is empty by measurement taken this run, not carried over.**

```
list_issues(label:"wayfinder:research")  → 21 issues, all Done
list_issues(label:"wayfinder:task")      →  5 issues, all Done
```

No agent-doable decision ticket exists on any map. Every open child of every open map carries `grilling` or `prototype` — HITL by label, untouchable by this lane by rule.

**[THR-1396](https://linear.app/threadbare/issue/THR-1396) Undertakings — closed `Done` at 21:45:56Z**, one second after its last child. Both `wayfinder:task` children (THR-1403, THR-1405) and both research children (THR-1400, THR-1435) are `Done`. A complete map, delivered without a HITL block; surfaced above because it is the only good news on the board tonight.

**[THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict** — 10 open children, every one HITL, none assigned: THR-1263 through THR-1272. All four research tickets (THR-1259–1262) are `Done`. **Largest HITL debt on the board, zero remaining legwork** — surfaced as ask 2.

**[THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft** (sole open child THR-1232, assigned to Christian) and **[THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator** (one unassigned `prototype`, THR-1236) unchanged.

**No map body was edited** — Decisions-so-far gains a line only for tickets this lane resolved, and it resolved none.

## T2 — design staging

**Triggered on the floor. Barred by the bound. Both numbers below.**

**Trigger: fired at the floor's limit.** Non-`Deferral` items in `Ready for Dev` = **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2. There is no shelf left to measure — run e read 1, run f read 0-of-1, this run reads 0-of-0.

**Bound: barred. `In Design` holds 2 live, 0 excluded** against `ORCH_MAX_IN_DESIGN` of 1 — measured on the `classifyInDesignItem` predicate, not by column occupancy:

- **[THR-1002](https://linear.app/threadbare/issue/THR-1002)** — unassigned; newest comment 2026-09-03T07:19:42Z → **5.6 days**, under the 7-day threshold → live, counts.
- **[THR-790](https://linear.app/threadbare/issue/THR-790)** — assigned → counts whatever its age.

**The date to watch is unchanged: 2026-09-10 ~07:19Z**, when THR-1002 crosses seven days and stops counting — unless something comments on it first.

**Nothing was mutated.** Excluding is a count, not a state change; applying `Parked` is Christian's call.

**The reading, sharpened by the empty shelf:** the bound is not what is stopping this lane, and it is important not to let the number imply otherwise. Even at `ORCH_MAX_IN_DESIGN` of 3 this run would stage a third item that no lane can advance, because staging produces a *request for an attended session*, not a plan doc — this lane runs Sonnet by Christian's ruling and does not author. The constraint is design capacity, and it is now measurably the only constraint: 44 backlog items, 0 buildable, 13 rulings deep.

## T3 — architecture health

**Not due. Skipped, and no detector result is reported.**

Local time at scan is **00:27 on 2026-09-09**, before `ORCH_HEALTH_SWEEP_HOUR` (06:00). [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08.md#t3--architecture-health) ran the full sweep at ~16:27Z; the next is the first run after 06:00 local tomorrow.

**Explicitly not run and not claimed as clean:** `generate-interface-map:dry`, `check:canon-staleness`, `sweep:rank-reach`, `check:process`. **`__DEBUG.validateTraitRefs()` remains browser-only and unmeasurable headless.** **Redundancy: not assessed this sweep** — no judgement pass was run.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Wednesday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

**The one counted finding came out of T1's `Idea` census, not a detector** — THR-1088, above. No detector produced it and none is claimed to have.

**Items standing open from earlier runs**, restated so a reader of the newest report does not conclude they were dropped: run a's Finding 1 (the `create` verb family losing the `occurred_at` edge that makes witnesses possible — 5 failures in 900 ticks, 100% correlated with `cell.create.*`), run c's note that `strategicControlChurn.test.ts`'s docblock still advertises two guards THR-1303 deleted, and run e's `undertaking-objects.ts:1490` docblock caution. All three are sub-bar and go to the weekly retro under the scheduled-lane throttle.

### Product vs process — the week

Trailing-week measure holds at **~24 product / 6 process (~80% product)**; this run promoted nothing, so the ratio is unmoved. The headline is the one the throttle prescribes for an empty product shelf and is explicitly **not** a call for more tidying: **the feature pipeline needs design and approval capacity.** This run is the strongest evidence yet — it had a well-specified process ticket in hand (THR-984) and declined to promote it precisely because doing so would have disguised the supply failure as a productive hour.

## Escalations

**Escalation raised on Discord — the condition fired on the terms run f set.**

[Posted to `1530183488333152287`](https://discord.com/channels/@me/1530183488333152287/1547011577885229106) at ~22:33Z. Plain language, one ask (*"Batch 2, run the six"*), with the alternative (*"rule on the backlog"*) offered and an explicit note that it is a heads-up rather than a blocker — he should not feel summoned at midnight.

The condition is met without ambiguity: `Ready for Dev` = 0, the promotable pool = 0 across both `Todo` (run f) and `Idea` (this run), and the sole live claim is the last agreed item on the board. Per non-negotiable #3 the lane **stopped and asked**, and did not fall through to un-agreed work — nor to the sub-bar process work that was sitting right there.

**The uncloseable set is now four, and that is the change.**

- [THR-1301](https://linear.app/threadbare/issue/THR-1301) — scope shipped under THR-1349.
- [THR-1380](https://linear.app/threadbare/issue/THR-1380) — every clause shipped under THR-1299.
- [THR-1441](https://linear.app/threadbare/issue/THR-1441) — gate met 2026-09-07T20:07Z, correctly barred from the queue by the materiality bar.
- [THR-1088](https://linear.app/threadbare/issue/THR-1088) — **new this run**; shipped under THR-1048 on 2026-08-17 and unnoticed for 22 days.

Four instances of one mechanism, found in four consecutive runs, each by a different route. The weekly retro should look at it as a class. Still one line at the retro, not a ticket from this lane.
