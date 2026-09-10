---
lane: tb-orchestrator
run: 2026-09-10
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-10 (run a, ~01:27–01:35Z)

**A bug was filed at 01:28Z and was in the build queue by 01:32Z.** Three minutes, start to finish. On the way through, the promotion check found that the ticket points at the wrong two files — so the builder gets a corrected diagnosis instead of an afternoon spent in renderers that cannot produce the error.

## Needs Christian

**Nothing needs you.** Third consecutive run that says it without a caveat.

The two standing items are unchanged and **still deliberately not re-asked**: the [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) map's ten questions, and the [five scene images](https://linear.app/threadbare/issue/THR-876) awaiting a yes/no on credits. Saying **"rule on the backlog"** whenever you want them brings the ~14 short rulings in game terms, smallest first. Nothing joined that queue tonight.

## T1 — unblock sweep

**Promoted: 1. Filed: 0. Declined: the standing set, no evidence re-derived. Held: 0.** Ceiling never engaged — shelf was 3 at scan, far under the 15-item backed-up threshold; batch max 5, one used.

Board at scan (~01:28Z): **40 `Todo`** (15 carrying a `wayfinder:*` label, skipped unconditionally), **3 `Ready for Dev`**, **2 `In Dev`**, **2 `In Design`**. `origin/main` @ `26acd1dd`.

**Exactly one thing on the board is new since [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-09c.md) three hours ago**, and it is the thing this run acted on. THR-1002 also reached `Done` at 01:05Z, which vacated an `In Design` slot but changed no decision here.

### Promoted — [THR-1447](https://linear.app/threadbare/issue/THR-1447/duplicate-react-keys-on-the-aftermath-reaction-list-children) (duplicate React keys on the aftermath reaction list)

Filed 01:28:50Z as a found-in-passing deferral out of THR-1134's browser verification; promoted 01:31:56Z. **Unblocked on every reading**: native `relations.blockedBy` is `[]`, and the description carries no prose gate and no time gate — nothing to wait on, so the promotion turns on destination and shape rather than on a cleared dependency.

**Agreed under D2 without needing a judgement call:** it is a bug, and *"fixing bugs is within the remit"* is verbatim. No design fork, no new direction. State verified on a `get_issue` re-query rather than the write echo; the `assignee` key is absent on that re-query, so it enters the queue unassigned as `pull-work`'s candidate filter requires.

**The coordination block was mandatory here for the THR-836 reason.** The ticket carried a block **in its description body** — but `pull-work` Step 3 validates the *latest comment*, and this ticket had zero comments, so it would have been bounced or forced a derived block. [Block posted.](https://linear.app/threadbare/issue/THR-1447/duplicate-react-keys-on-the-aftermath-reaction-list-children)

#### The promotion check found the ticket has the wrong noun

The description's own *"Where to start"* asks that its hypothesis be confirmed before anything is changed. It was, against `origin/main` — and it does not hold. Three file reads, no inference:

| The ticket says | What `main` says |
| -- | -- |
| the colliding key is an aftermath **reaction** id, rendered at `EncounterVeil.tsx:1303` / `DivineReceiptModal.tsx:196` | both sites key on the bare `reaction.id` (`anchored_react_deepen_the_anchor`, authored at `the-comet-at-the-turning.ts:300`) — **neither can emit the quoted key** |
| ids are *"minted per template rather than per offer"* | the key is a **`TickEvent`** id: `` enc_after_${reaction.id}_${tick}_${nextRecentEvents.length} `` at `encounterAftermath.ts:1480` and `:1847` |
| — | the trailing `100` is `MAX_RECENT_EVENTS` (`gameState.ts:566`); `appendRecentEvent` is `slice(-100)`, so once the buffer saturates the mint's only uniqueness discriminator is **pinned at a constant** and same-reaction/same-tick events collide by construction |

**And the existing guard makes the failure worse rather than catching it.** `orchestrator.ts:3793-3799` already dedupes the feed on event id, with a comment naming THR-682 and this exact class. That filter cannot help two *different* events that share an id — it silently drops the second one. So React's *"duplicated and/or omitted"* is already resolved to **omitted**, upstream of any renderer, and a render-side `key={id + index}` would paper over a real event being lost.

**One correction that narrows the ticket rather than widening it:** the only site found keying an events array by a bare `evt.id` is `debug/RecentEventsView.tsx:47` — the debug panel. `NarrativeFeed.tsx:80` already defends with `${evt.id}_${idx}`. If that holds, the description's stake (*"a list the player chooses from"*) does not, and its UI-pillar browser-verify obligation is resting on a surface the player never opens. **The defect is still real** — a colliding event id losing a real aftermath event is worth fixing on engine grounds alone. The executor is asked to re-check the site rather than take this on trust, and to settle the pillar question before spending a capture.

*This is a technical verdict and is the lane's to make (THR-608). It is recorded on the ticket, not sent to Christian.*

### Declined — standing set, evidence deliberately not re-derived

Run a censused all of these on 2026-09-09; **nothing on the board moved to disturb one**, so re-deriving them would be the daily-dump failure this lane forbids. Six were spot-checked this run against their descriptions and all six held: THR-1446 · THR-1393 · THR-1348 · THR-1195 · THR-1114 (all *wrong destination* — each states in its own body that it needs a design call first) and THR-1024 (*unmet blocker* — THR-966 is `Idea`, not `Done`).

Full standing list, unchanged: THR-1301, THR-1380, THR-1088, THR-984, THR-1024, THR-175, THR-1287, THR-1195, THR-1114, THR-1189, THR-1315, THR-1348, THR-1424, THR-1426, THR-1148, THR-1318, THR-1393, THR-1446, THR-1218 · 15 `wayfinder:*` · THR-1220 (HITL by its own first line, *"never promote to Ready for Dev"*).

**[THR-1380](https://linear.app/threadbare/issue/THR-1380) was re-verified once and then left alone.** Its three UL entries are present on `main` (`Agents.md:582/598/614`) with the `Prose.md:60` See-Also — it is satisfied-upstream-with-no-closer. Two prior runs have already written that evidence onto the ticket in full; a third comment would be noise, so none was posted. It stays a decline and a retro item, not a promotion.

## T1.5 — wayfinder sweep

**Three open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — measured this run, not carried forward.**

```
list_issues(label:"wayfinder:research")  → 21 issues, all Done
list_issues(label:"wayfinder:task")      →  5 issues, all Done
```

**Fourth consecutive sweep finding no agent-doable decision ticket on any open map.** Twelve open children across the three maps, every one carrying `grilling` or `prototype` — HITL by label, untouchable by this lane by rule:

- **[THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict** — 10 open children (THR-1263 … THR-1272), all HITL, none assigned. All four of its research tickets `Done`. Largest HITL debt on the board with zero remaining legwork.
- **[THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft** — sole open child THR-1232, assigned to Christian.
- **[THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator** — one unassigned prototype, THR-1236.

No map body was edited — Decisions-so-far gains a line only for tickets this lane resolves, and it resolved none.

## T2 — design staging

**Not triggered, and it would have been barred anyway had it fired.**

Non-`Deferral` items in `Ready for Dev` at scan = **2** (THR-1443, THR-1444), against `ORCH_PROGRAM_WORK_FLOOR` of 2. The trigger is *fewer than* 2, so the floor is met on its exact boundary and the tier did not fire. THR-1447 makes it 3 after this run's promotion; THR-1255 is `Deferral`-labelled and correctly excluded throughout.

**The bound was full regardless.** `In Design` holds **2 live, 0 excluded** — THR-1287 (assigned, updated 20:49Z yesterday) and THR-790 (assigned, updated 09-08). Both assigned, both inside `ORCH_IN_DESIGN_STALE_DAYS`, so both count, against `ORCH_MAX_IN_DESIGN` of 1. Run b's date to watch has now resolved by a different route than predicted: THR-1002 reached `Done` at 01:05Z rather than aging out at 07:19Z, and — exactly as run c said it would — **it changed nothing**, because THR-790 sits at the ceiling of 1 on its own.

**Nothing was mutated in this tier.** No comment, no state change, no assignee touched.

**The T2 candidates are on record if the shelf drops.** Three tickets declined above are declined *to this tier*, and the strongest is [THR-1348](https://linear.app/threadbare/issue/THR-1348) — a measured finding that 11 of 12 seeds cannot reach the trade-route economy at all, with the design fork stated in three readings. THR-1446 and THR-1393 follow it. None can be staged while the bound is shut.

## T3 — architecture health

**Not due, on two independent counts — no detector was run, and none is reported.**

1. **Local time is 03:27**, before `ORCH_HEALTH_SWEEP_HOUR` (06:00).
2. **A full sweep already ran on 2026-09-09** — [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-09b.md) executed all four detectors at ~20:15Z. The duty is daily, once.

`newFindings: 0` in this report's frontmatter therefore means *not measured this run*, **not** *measured and clean*. Run b's standing set is unchanged and unrechecked: 7 LEAKED contracts (each with its ticket), 27 canon-staleness warnings, `sweep:rank-reach` PASS, `check:process` exit 0.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

**Redundancy: not assessed this sweep** — the tier did not run at all, so the judgement half did not either. Stated rather than left to inference.

### Standing sub-duty item, carried forward unchanged

**[THR-1130](https://linear.app/threadbare/issue/THR-1130)'s park remains stale, and this lane still does not lift it.** `In Dev` + `Parked` + unassigned, holding no executor slot and blocking nothing; its child THR-1222 is merged, so the park's condition is overtaken. **Deliberately untouched** — lifting a park on an inference about liveness is the shape that let a lane strip a running session's assignee twice (impediment #755). Flagged for whoever next touches the ticket.

### Product vs process — the week

Trailing-week measure **~27 product / 7 process (~79% product)**. THR-1002 (`Game Design`/`Content`/`UI`/`Engine`) closed at 01:05Z and moves the numerator by one. This run promoted one product bug and no process work.

**The build pipeline is healthy and the headline is unchanged from run c: what is starved is design.** Four jobs queued, the builder live on THR-1134, and one of tonight's four released by this lane. Against that: three wayfinder maps at zero remaining legwork, two `In Design` items at a ceiling of one, and three engine/content design questions declined to a tier that cannot open. Every one of those waits on the same input — Christian, or a session running Opus. Nothing this lane can do refills that side.

## Escalations

**None posted, and none warranted.** No item aged into an ask this run; run g's 2026-09-08 escalation was answered in chat at 19:55Z and closed by run b.

The lane did not fall through to un-agreed work. It promoted one bug whose diagnosis it checked against the merged tree and corrected, confirmed six standing declines still hold, measured the wayfinder frontier rather than carrying the count forward, and stopped.

**Sub-bar notes carried to the weekly retro, not filed** (unchanged from run c unless marked): the `In Design` liveness clock counting bot comments as human activity · `strategicControlChurn.test.ts`'s docblock advertising two guards THR-1303 deleted · `undertaking-objects.ts:1490`'s stale docblock caution · the four-instance *shipped-under-a-sibling-id* class (THR-1301, THR-1380, THR-1441, THR-1088) · the canon-staleness false-positive class where a page goes stale against the auto-generated `Docs/plans/INDEX.md` · **new this run:** a ticket filed with its coordination block in the *description* rather than as a comment still fails `pull-work` Step 3 — THR-1447 was authored carefully and correctly and would still have been bounced, which suggests the THR-836 convention is not reaching the sessions that file deferrals in passing.
