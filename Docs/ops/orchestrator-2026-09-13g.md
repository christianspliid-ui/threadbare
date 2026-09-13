---
lane: tb-orchestrator
run: 2026-09-13g
promoted: 2
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-13 (run g, ~08:32Z)

## Needs Christian

**Nothing needs you.** No decision is blocking a builder, and the two encounters waiting for your play session are unchanged from [the last run](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13f.md) — still clean, still the real thing.

One thing worth knowing in a sentence, because it is the whole of what moved: **two small repairs that had been filed into the wrong pile were found and put into the build queue.** Both were written down yesterday by sessions that noticed them while doing something else, and both landed in a holding column that no builder ever looks at — so they would have sat there indefinitely. One is a condition's countdown never showing on screen when it was granted by one of the two paths that grant conditions; the other is a name in the Gate Duty ending that you cannot click, on the one encounter that still draws its ending its own way. Neither needs a decision from you. They are queued with instructions.

Also cleared, and worth retiring from your list if it is still on it: **the glossary words that were waiting on your approval are all approved and seated.** Six of them had been waiting, the oldest for over two months, and nothing but this report could ever have reached you about them. They went in on 2026-09-11. There is no longer a backlog of words waiting on you.

## T1 — unblock sweep

Shelf at scan: **11** in `Ready for Dev`, **4** of them non-`Deferral`. Both counts are one lower than [run f](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13f.md)'s, and the difference is accounted for exactly: [THR-1471](https://linear.app/threadbare/issue/THR-1471/classifydiff-prints-the-browser-verify-route-reminder-for-ui-pillar) (the `classify:diff` browser-verify reminder, labelled `Improvement`) closed on merge at **08:20:57Z**, six minutes before this run started. Below the 15-item backed-up threshold, so the full `ORCH_PROMOTE_BATCH_MAX` ceiling of 5 was available; 2 were spent.

`In Dev` holds **zero** issues — a free WIP=1 slot against an 11-item shelf, so `tb-opus-pickup`'s next run has a full queue and nothing in its way.

### The `Todo` slice: 30 candidates, 0 promotions — unchanged set

**15 carry a `wayfinder:*` label** and were skipped unconditionally to T1.5. **15 were judged here, and the set is byte-for-byte the one run f judged**: the newest `Todo` item is still [THR-1501](https://linear.app/threadbare/issue/THR-1501/six-family-tags-are-now-orphaned-no-bearer-no-reader-sunset-or-author) at 04:19Z and nothing has been created or moved into `Todo` in the four hours since. No grounds moved on any of the fifteen. Per-ticket evidence stands in [run c's decline table](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13c.md#t1--unblock-sweep) and [run f's re-read](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13f.md#t1--unblock-sweep) of the three freshest, and is not restated a fifth time.

### The `Idea` slice was scanned — and held two promotable bugs

**This is where the run's work was.** The skill's § T1 step 1 issues exactly two `list_issues` calls (`Todo`, `Ready for Dev`) while step 2 of the same section judges *"each `Todo` / `Idea` candidate"* — so `Idea` is inside the judgement set and outside the scan. It is also where sessions file findings they will not fix in passing. Three such tickets were filed there on 2026-09-12 and had never been read by any lane; `pull-work` queries `Ready for Dev` only, so nothing downstream would ever have surfaced them.

**Promoted — 2.** Both have an empty native `blockedBy`, no prose gate, no time gate, no comments carrying a retire verdict, and no plan doc to strand. Both name only files that no open ticket touches. Each defect was **re-verified on `origin/main` before the write** rather than taken on the ticket's own word, and each carries a full coordination block:

- **[THR-1484](https://linear.app/threadbare/issue/THR-1484/two-condition-grant-paths-write-different-field-names-for-the-same)** (Medium, `UI`/`Engine`/`Bug`, *Encounter Experience*) — two condition-grant paths write different field names for the same total. Verified live: `src/engine/phaseEncounterTraits.ts:279` writes `totalTicks`; the single reader `readEdgeDuration` at `src/engine/agentAttachments.ts:120` reads `durationTicks` and exposes it to the view *as* `totalTicks`, which is what makes the collision hard to see. Consequence is a display gap, not a simulation one — the duration section and progress bar get no denominator for any condition granted through the phase path. The sibling it was found under, [THR-1475](https://linear.app/threadbare/issue/THR-1475/a-conditions-hover-and-click-through-never-say-what-it-does-tooltip), went `Done` 2026-09-12T10:49Z, so the surfaces it asserts against are shipped.
- **[THR-1498](https://linear.app/threadbare/issue/THR-1498/gate-dutys-bespoke-aftermath-highlights-render-entity-names-as-inert)** (Low, `UI`/`Bug`, *Encounter Experience*) — Gate Duty's bespoke aftermath highlights render entity names as inert text (Laws 1/17/21), the one surface [THR-1033](https://linear.app/threadbare/issue/THR-1033) did not reach because it fixed the *unified* path. Verified live: the adapter at `src/components/Game/encounter-stage/adapters/buildGateDutyEncounterStageModel.ts` interpolates `args.captainName` / `args.courierName` / `args.witnessName` straight into `detail` strings (~lines 867/873/879), and `EncounterVeil.tsx:1202` renders them as plain text behind the `!aftermath.consequences?.length` gate. Both context tickets are `Done`.

**Declined — 1, on destination.** [THR-1483](https://linear.app/threadbare/issue/THR-1483/three-location-conditions-have-no-live-mechanical-effect-under-watch) (three location conditions have no live mechanical effect) is unblocked, but two of its three arms ask what `under_watch` and `tended_shrine` should mechanically *do* — the ticket itself offers "a `shadow` step penalty … or a real `requiredTargetTraits` / scoring term" as candidate shapes. Choosing between authoring an effect and deleting the condition is a content fork with no agreed outcome, which is the same ground [THR-1501](https://linear.app/threadbare/issue/THR-1501) was declined on in runs c–f. Not promoted, not mutated, no comment posted — recording it here rather than on the ticket, so a decline does not become hourly thread noise.

**Observation, not a ticket:** THR-1483's *third* arm is not a design question at all — `standing_welcome` has had zero writers for three weeks and its retirement is already half-done by [THR-1206](https://linear.app/threadbare/issue/THR-1206). It is executor-shaped work trapped behind two design questions in the same ticket. Splitting someone else's ticket is not this lane's act, and the shelf does not need feeding, so this is left as input for the next design pass that touches conditions.

The rest of the `Idea` tail (~50 items, oldest 2026-07) is ungroomed and belongs to `daily-backlog-grooming`, not here.

### Two other states checked, nothing promotable

- **`Implementation Planning`** holds one issue, [THR-1482](https://linear.app/threadbare/issue/THR-1482/one-card-one-router-every-world-object-and-content-kind-opens-the-same) (one card, one router). It is a design-state parent whose slices are shipping on their own ids — [THR-1490](https://linear.app/threadbare/issue/THR-1490) and [THR-1492](https://linear.app/threadbare/issue/THR-1492) both closed in the last day. Not a T1 candidate.
- **`UL-proposal` label, workspace-wide: 25 of 25 are `Done`.** The six that [the 2026-09-10 sweep](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10h.md) found waiting on an approval only Christian can give — THR-1449, THR-1445, THR-1441, THR-1408, THR-1406, THR-633 — all cleared on 2026-09-11, seated by [THR-1457](https://linear.app/threadbare/issue/THR-1457/seat-the-six-delegated-glossary-words-hold-cast-forecast-tier-agreement). **That standing `## Needs Christian` item is closed** and should not be carried forward again.

### Held by the ceiling — 0

Eleventh consecutive run with zero held, from real headroom (shelf 11 against a threshold of 15) rather than a throttle.

## T1.5 — wayfinder sweep

**Three open maps, zero AFK-resolvable tickets** — re-proved from this run's own `Todo` scan, not carried. Of the fifteen `wayfinder:*` candidates, three are the maps ([Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)) and **all twelve open children carry `wayfinder:grilling` or `wayfinder:prototype`** — HITL by construction, which this lane must not touch. Zero `wayfinder:research` and zero `wayfinder:task` are open anywhere in the slice.

`ORCH_WAYFINDER_AFK_MAX` (2) went unspent for the **"AFK work is finished"** cause, not the "found nothing I could do" cause. No map or child has moved — maps last touched 2026-09-11T06:15–06:16Z, every child 2026-08-26 or earlier. The twelve HITL questions are deliberately **not** re-enumerated: they are unchanged, runs c and d carried them in full, and re-listing a static set hourly is what trains a reader to skip the section.

## T2 — design staging

**Not triggered.** The shelf holds **4** non-`Deferral` items against `ORCH_PROGRAM_WORK_FLOOR` of 2 — twice the floor.

Recorded because it would bar the tier independently: `In Design` holds **2 live, 0 excluded** — [THR-1479](https://linear.app/threadbare/issue/THR-1479) (appointment primitive, unassigned, touched 2026-09-12T22:26Z) and [THR-1448](https://linear.app/threadbare/issue/THR-1448) (a held town is a faction position, unassigned, touched 2026-09-12T07:23Z). Both sit well inside `ORCH_IN_DESIGN_STALE_DAYS` (7) and neither carries `Parked`, so both count against `ORCH_MAX_IN_DESIGN` of 1. Over bound, unchanged, and not by this lane's hand — no state was mutated; the predicate is warn-only and the exit (`Parked`) is a human's.

## T3 — architecture health

**Skipped — already run today.** [Run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13c.md#t3--architecture-health) executed the full sweep at 04:27Z with four detectors. The tier is once-daily; **no detector ran this hour and none is reported as clean.** The redundancy judgement pass was likewise **not** performed this run — run c's result stands, and this line exists so the gap is not mistaken for coverage.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Sunday. Next pass tomorrow.

`newFindings: 0` is therefore a consequence of the tier not running, not of a sweep that found nothing.

**One structural item carried, not re-filed:** the gap run e named — *"arm auto-merge and walk away" has no catcher when the check comes back red* — is unchanged as a mechanism. Its one live instance cleared by hand at 07:24Z after **7h57m** stranded; that figure is the retro's, and the process-work throttle keeps it an impediment-log row rather than a ticket.

## Escalations

**One question outstanding, unanswered, and not re-posted.** Run e asked the escalation channel whether some lane should own re-checking PRs that armed auto-merge and then went red, and if so which. Re-asking an open question hourly is noise, and its urgency fell when the instance behind it cleared. It stands as a process-shape question for the weekly retro — this lane is explicitly not the party that decides its own remit.

**Nothing parked.** No candidate this run was set aside for want of an answer.

**One gap logged rather than escalated:** the `Idea`-slice scan above is a hand-patch this lane performs every run because the skill's step 1 and step 2 disagree about the candidate set. Today that hand-patch was worth two promotions. It is a known impediment with a recorded history, and the process-work throttle routes it to the weekly retro as one amendment to the skill — not to a ticket filed from here.
