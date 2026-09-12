---
lane: tb-orchestrator
run: 2026-09-12h
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-12 (run h, ~17:29Z)

## Needs Christian

**One window has changed shape since the last hour, and you should know it moved.** The veto you were offered — *should clicking a piece of content (an encounter template, an item, a condition) open the codex, or should content simply not have a deeper page at all?* — is **now being built**. It went from the queue into active development at 17:02. Saying nothing still means it ships as designed, which remains a perfectly good answer. But a "no" from here costs a small rework rather than a one-line change. If you were going to look at it, this hour is the last cheap one.

**One new question appeared this hour, and it is genuinely yours.** Building that same piece measured which kinds of content the player can actually look up, and found **six kinds with no reference page at all** — encounters, omens, nudge cards, ambitions, companions, and the three legendary artifacts. Two are plain oversights (the legendary artifacts already have a shelf they were never put on; the nudge deck you play from has no reference at all). Four are real questions about what a player *should* be able to browse:

- Should a player be able to leaf through all **557 encounters**? Or only the ones they have already lived — which is a different, better feature: a chronicle rather than a catalogue.
- Do **omens** lose something if you can look them up? They are meant to arrive, not be consulted.
- Is an **ambition** a thing with a definition page, or only something you read off the person carrying it?
- Same for **companions**.

Nothing is broken while these stay unanswered — the cards still open, they are just shallower. It is filed as [six content kinds have no codex category](https://linear.app/threadbare/issue/THR-1495) and is not urgent.

**Still waiting, unchanged, not being chased.** The eight design questions on **fights**, **items** and **powers & spellcraft**. Every piece of homework on all three is finished; nothing further can be built on any of them until you answer. Seven of the eight are about fighting. Say **"work the map"** in a chat when you want them worked one at a time.

**What moved on its own this hour:** the tag vocabulary landed at 17:01, which unblocked the content query — the piece that lets any content hand out any other content by one rule. It went straight to the front of the build queue. No decision of yours is waiting on it.

## T1 — unblock sweep

Shelf at scan: **16** in `Ready for Dev`, **10** of them non-`Deferral` — the same 16 [run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12g.md) saw, because run g's promotion (THR-1491) was claimed into `In Dev` at 17:02:13Z and gave back the slot it took. Still above the 15-item backed-up threshold, so the ceiling narrowed this run to at most one promotion. **It bound again** — two candidates were promotable, one was taken, one held.

**33 `Todo` candidates read.** 15 carry a `wayfinder:*` label and were skipped unconditionally to T1.5. **18 were judged here.**

### Promoted — 1

**[THR-1487](https://linear.app/threadbare/issue/THR-1487) — content model slice 3 (the content query and its one resolver under the reward pool, the step-route gate, the condition pool, traces and debug levers).** `High`, unassigned, `Content Architecture`.

Its single named blocker reached `Done` 28 minutes before this sweep:

- **[THR-1486](https://linear.app/threadbare/issue/THR-1486)** (content model slice 2 — the closed tag vocabulary this query filters on) — `completedAt: 2026-09-12T17:01:10.637Z`. Run g declined this candidate on exactly that half: at 16:28Z THR-1486 was `In Dev` with `completedAt: null`.

Checks that ran before the write, each recorded because a check that finds nothing is the only evidence it ran:

- **Plan-doc liveness:** `npm run check:plan-doc-liveness -- Docs/plans/2026-09-12-thr-1481-content-model.md` → `LIVE … resolves on origin/main`.
- **Standing retire verdict (THR-990):** latest comment read (`list_comments`, `createdAt`, limit 5). One comment on the thread — the filing coordination block, 10:27:57Z. No retire, do-not-build or superseded verdict.
- **Destination:** no "needs design finalization" sentence in the body; no `wayfinder:*` label; the ticket carries its own scope and Done-whens.
- **Write then verify:** `save_issue(state:"Ready for Dev")` then `get_issue` → `status: "Ready for Dev"`, `startedAt: 17:29:40.876Z`, `stateHistory` showing `Todo` ended and `Ready for Dev` started at that timestamp, **no `assignee` key present** on the re-query. Priority untouched at `High`.
- **Coordination block posted** 17:30:13Z with the three lines, `Blocked by: nothing` naming the now-`Done` THR-1486 so a later sweep does not re-parse the *"Blocked by slice 2 (needs the vocabulary)"* prose and decline what it already promoted, plus the evidence shape.

**The seam was derived from the two file lists, not from either ticket's prose claim — run g's lesson applied rather than restated.** THR-1487's filing block asserts parallel-safety with THR-1490 and THR-1492 and says nothing about THR-1491, which was filed the same morning and is now `In Dev`. Reading both scopes' file lists: THR-1491 item 7 registers the interface-map rows `content-ref-opens-codex-overlay` and `anchor-status-derived-from-surface-registry`; THR-1487 item 7 registers `content-query-one-resolver-engine-and-gate` plus two LEAKED rows. **Both edit `scripts/interface-contracts.ts` and the generated `Docs/canon/interface-map.md`.** That is an append-to-list rebase risk and was written into the promotion comment as exactly that — merge `origin/main` and regenerate rather than hand-merge — and deliberately **not** as a blocking mutex. Nothing else overlaps: THR-1487 is `contentQuery.ts`, `rewardPool.ts`, `nudgeGrantLiveness.ts`, `undertaking-objects.ts`, trace registration and the wiring guide; THR-1491 is `contentRef.ts`, the surface registry, the detail-page stack, the router arm and the anchor-catalog scripts.

**Why this one and not the other.** The ceiling allowed one, and two were promotable. THR-1487 is `High` against THR-1492's `Medium`, and it **unblocks three tickets** — THR-1488 (slice 4), THR-1489 (slice 5, behind 1488) and [THR-1479](https://linear.app/threadbare/issue/THR-1479) (the appointment primitive, whose stakes shape is a `ContentQuery`). THR-1492 blocks nothing. The priority field sequences the executor and the shelf currently holds no other `High` item, so this promotion goes to the front of the queue and moves a four-deep chain; the alternative would have moved one leaf.

### Held by the ceiling — 1, for the second consecutive run

**[THR-1492](https://linear.app/threadbare/issue/THR-1492) — one card, one router slice 3 (sunset the duplicate cards).** `Medium`, unassigned, `Content Architecture`. **Promotable, and now more cleanly promotable than it was an hour ago.**

Both reasons run g gave for holding it have been re-checked this run, and one of them is gone:

- Its named blocker **THR-1490** is still `Done` (15:54:36Z) — unchanged.
- Its **mutex has cleared.** Run g held it partly behind *"THR-1486, In Dev, both edit `src/components/Game/AttachmentDetailView.tsx` — let THR-1486 merge first"*. THR-1486 went `Done` at 17:01:10Z. That reason no longer applies; only the ceiling does.
- Latest comment re-read: one comment, the filing block of 10:28:13Z. No retire verdict, nothing new.

**Two holds is a throttle; three would be starvation, and the distinction should be countable rather than felt.** The shelf grows to **17** with this run's promotion, so next run's ceiling binds again by construction — and if next run also finds a fresher `High` candidate, THR-1492 loses a third time to a rule meant to slow planning down, not to bury a specific ticket. Recorded so the next run reads this as a decision it must make explicitly rather than a default it can repeat. Two things it should carry rather than re-derive: THR-1492 is `sonnet`-suggested (deletions under re-verified zero-importer greps, one renderer migration, one `Section` swap), and its remaining mutex list is files-while-`In Dev` only — `FactionSheet.tsx`, `EntityCard.tsx`, `entityDetail.ts`, `StyleGuide/*`, `component-selection.md`, `primitives.md`.

### Declined — 16

**Two are the remaining content-model slices**, a strict chain (plan lines 379–382: *"Blocked by 1"* … *"Blocked by 4"*), so this run's promotion moves neither of them yet:

- **[THR-1488](https://linear.app/threadbare/issue/THR-1488)** (slice 4) — blocked by THR-1487, which is now `Ready for Dev`, not `Done`. Next in line on the chain.
- **[THR-1489](https://linear.app/threadbare/issue/THR-1489)** (slice 5) — blocked by THR-1488 (`Todo`).

**One is new this hour and is T2's input, not T1's:** [THR-1495](https://linear.app/threadbare/issue/THR-1495) (six content kinds have no codex category), filed 17:08:18Z as a `Deferral` off THR-1491, no blockers. **Declined as wrong destination.** Four of its six decisions are gameplay-meaning forks — whether a player may browse 557 encounter templates or only a chronicle of those already met, whether an omen catalogue spoils more than it serves, whether an ambition and a companion have definition pages at all. Those are director calls, not executor work, and the ticket itself frames them as questions rather than tasks. The other two (`legendary_template`, `nudge_card`) are plain gaps a design pass dispatches in the same sitting. Routed to T2 and surfaced under `## Needs Christian` above.

**One is assigned:** [THR-791](https://linear.app/threadbare/issue/THR-791) (traits wave 3), Christian.

**Twelve are the standing set** — nine need a design session, three are held by a dependency. Not restated; re-listing them hourly is the dump this lane forbids. Composition is unchanged from run g and no candidate's `updatedAt` moved, so none was re-verified by hand this run and none is reported as freshly checked. The baseline enumeration with per-ticket evidence is [run a's decline table](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t1--unblock-sweep).

## T1.5 — wayfinder sweep

**Three open maps. AFK tickets resolved: 0 — the pool is empty, not capped.**

Re-verified by label sweep across the whole team rather than inherited from run g: **21 `wayfinder:research` tickets, every one `Done`**; **5 `wayfinder:task` tickets, every one `Done`**. The 15 open wayfinder issues in this run's `Todo` scan carry only `wayfinder:map`, `wayfinder:grilling` or `wayfinder:prototype`. `ORCH_WAYFINDER_AFK_MAX` (2) was not approached.

Frontier composition is unchanged in every particular, and no wayfinder child's `updatedAt` has moved since 2026-08-26: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) 10 open children → 7 frontier, 3 behind the two fight-loop prototypes; [Item Generator](https://linear.app/threadbare/issue/THR-1227) 1 frontier ([THR-1236](https://linear.app/threadbare/issue/THR-1236)); [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) 0 frontier ([THR-1232](https://linear.app/threadbare/issue/THR-1232) assigned to Christian, off the frontier by the assignee rule rather than absent). Physical Conflict's frontier has now stood unchanged for **17 days**. Surfaced, not escalated — HITL waiting on a human is not a defect.

The terminal state runs a–g recorded still holds: **the wayfinder tier has no agent-resolvable work anywhere on the board.** A repeated "no AFK work" line is this known state, not a detector that stopped finding things.

## T2 — design authoring

**Not triggered.** 10 non-`Deferral` items in `Ready for Dev` at scan (11 after this run's promotion) against `ORCH_PROGRAM_WORK_FLOOR` (2). The build shelf is not thin; the reverse.

Recorded because T1 routes to it: **five `Todo` candidates are T2's input rather than T1's** — [THR-790](https://linear.app/threadbare/issue/THR-790), [THR-1274](https://linear.app/threadbare/issue/THR-1274), [THR-1348](https://linear.app/threadbare/issue/THR-1348), [THR-1381](https://linear.app/threadbare/issue/THR-1381), and **new this hour** [THR-1495](https://linear.app/threadbare/issue/THR-1495). Four was the count from runs f and g; the fifth arrived at 17:08. None was staged, because the trigger did not fire. Named so the queue's design debt stays countable rather than only implied by a decline tally — and note the direction: the design-input list grew this hour while the build shelf held steady.

No read of `In Design` was performed this run — that measurement belongs to T3's standing sub-duty, and T3 is skipped below. [Run a's](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t3--architecture-health) reading (2 live against a bound of 1, neither staged by this lane) is the last measurement on record and is **not** restated as current.

## T3 — architecture health

**Skipped — already run today.** [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t3--architecture-health) executed the full sweep at ~10:29 local (08:29Z), past `ORCH_HEALTH_SWEEP_HOUR` (6), and its results stand: 7 LEAKED contracts unchanged, canon staleness 30, `sweep:rank-reach` `PASS`, `check:process` `passed-with-gaps`. **No detector was re-run this hour, and none is reported as clean on this run's authority.** `newFindings: 0` in the frontmatter is therefore "no sweep ran", not "a sweep found nothing".

`__DEBUG.validateTraitRefs()` remains browser-only and unrunnable headless — not run, not reported clean.

**Redundancy: not assessed this sweep.** No judgement pass over `interface-map.md` / `systems-inventory.md` was performed and no coverage is claimed for it.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

Two incidental observations from the board reads T1 needed for its own arithmetic, recorded as such rather than presented as sweep results:

- **WIP is 1** — [THR-1491](https://linear.app/threadbare/issue/THR-1491), promoted by run g at 16:28:52Z and claimed at 17:02:13Z, a 33-minute claim gap. Its `stateHistory` reads `Todo → Ready for Dev → In Dev`, so it is **not** a hand-created `In Dev` ticket. Nothing to surface under that duty this hour.
- **[THR-1486](https://linear.app/threadbare/issue/THR-1486) completed at 17:01:10Z** — promoted by run f, claimed 16:02Z, done in 59 minutes. That is the second slice of the content-model chain to land today and the reason this run had a promotable candidate at all.

## Escalations

None. Nothing was parked, no question went to Discord, and agreed work is not exhausted. The single write verified on re-query.

**Product-vs-process ratio this week.** The shelf after this run holds 11 non-`Deferral` items, of which 2 carry `Improvement` and 1 `Infrastructure` — the rest are content, engine and UI feature or bug work. This run's promotion is feature work (`Content` / `Engine`). Nothing process-shaped was promoted and nothing was filed; the one-process-ticket-per-three-runs budget is untouched. Trailing week remains roughly **31 product / 7 process (~82% product)**.

**Headline: execution is keeping up and design is not, and the gap widened by one this hour.** Two content-model slices landed today and a third was promoted within half an hour of its blocker clearing — the build chain is moving as fast as the executor's single slot allows. In the same hour the design-input list went from four items to five, the wayfinder tier stayed at zero agent-resolvable work across three maps, and a sixth question arrived that only Christian can answer. That is not a failure of any lane; it is the same constraint every run today has named, one notch tighter.
