---
lane: tb-orchestrator
run: 2026-09-12i
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-12 (run i, ~18:29Z)

## Needs Christian

**The window I flagged last hour has closed — it shipped.** The veto you were offered (*should clicking a piece of content open the codex, or should content simply have no deeper page?*) went from the build queue into the game at 17:54. You can still say no, and I want to be accurate about what that now costs rather than escalate it further: the plan wrote the veto's exit in advance, so reversing it means every content kind's "deeper page" is set to nothing and the small **open in codex ↗** link at the bottom of a content card disappears. The cards themselves stay, and nothing else changes. It is a smaller reversal than "it's already built" usually implies. Saying nothing still means it stands.

**Nothing new needs you this hour.** The question from last hour — [the six kinds of content with no reference page](https://linear.app/threadbare/issue/THR-1495) (encounters, omens, nudge cards, ambitions, companions, the legendary artifacts) — is unchanged and is not urgent. Neither are the eight design questions on **fights**, **items** and **powers & spellcraft**, all of which still have every piece of homework finished behind them and nothing further that can be built until you answer. Say **"work the map"** in a chat when you want them worked one at a time.

**What moved on its own this hour:** the content-card work landed and merged; the piece that lets any content hand out any other content is being built now; and the last waiting piece of the card work — deleting the three duplicate screens the new one replaces — went to the front of the build queue. No decision of yours is waiting on any of it.

## T1 — unblock sweep

Shelf at scan: **16** in `Ready for Dev`, **10** of them non-`Deferral`. Still above the 15-item backed-up threshold, so the ceiling narrowed this run to at most one promotion — **but it did not bind**, the first run today it has not: exactly one candidate on the board was promotable, so no candidate was held back and none is deferred to next run.

**32 `Todo` candidates read** (33 last run; THR-1487 left the column when run h promoted it). 15 carry a `wayfinder:*` label and were skipped unconditionally to T1.5. **17 were judged here.**

### Promoted — 1

**[THR-1492](https://linear.app/threadbare/issue/THR-1492) — one card, one router slice 3 (sunset the duplicate cards: delete the unmounted agent components, retire `EntityCard` after the attachment sheet migrates, shared `Section` in `FactionSheet`).** `Medium`, unassigned, `Content Architecture`, `UI`.

Its single named blocker:

- **[THR-1490](https://linear.app/threadbare/issue/THR-1490)** (slice 1 — the ref router, surface registry and the `item` page kind this ticket migrates `AttachmentDetailView` onto) — `completedAt: 2026-09-12T15:54:36.249Z`, shipped as PR [#1919](https://github.com/christianspliid-ui/threadbare/pull/1919) / commit `75bc2a3c`.

Checks that ran before the write, each recorded because a check that finds nothing is the only evidence it ran:

- **Plan-doc liveness:** `npm run check:plan-doc-liveness -- Docs/plans/2026-09-12-thr-1482-one-card-one-router.md` → `LIVE … resolves on origin/main`.
- **Standing retire verdict (THR-990):** latest comment read (`list_comments`, `orderBy:createdAt`, limit 5). One comment on the thread — the filing coordination block, 10:28:13Z. No retire, do-not-build or superseded verdict.
- **Destination:** no "needs design finalization" sentence in the body; no `wayfinder:*` label; the ticket carries its own scope and five Done-whens.
- **Write then verify:** `save_issue(state:"Ready for Dev")` → `get_issue` re-query shows `status: "Ready for Dev"`, `startedAt: 18:28:20.251Z`, `stateHistory` with `Todo` ended and `Ready for Dev` started at that timestamp, **no `assignee` key present**. Priority untouched at `Medium`.
- **Coordination block posted** 18:28:59Z: three lines, `Blocked by: nothing` naming the now-`Done` THR-1490 so a later sweep does not re-parse the description's *"Blocked by slice 1"* and decline what it already promoted, plus the evidence shape.

**This is the ticket runs g and h held, released on its third look — deliberately, not by default.** Run h recorded that a third hold would be starvation rather than throttling and asked the next run to make the call explicitly. The call did not need to be a hard one: the two content-model slices behind THR-1487 are still blocked (below), so THR-1492 was the only promotable candidate this hour and the ceiling had nothing to choose between.

**Two things in the promotion comment that are new information rather than a restatement of the filing block:**

- **The filing block's mutex is discharged.** It named THR-1486 (*both edit `src/components/Game/AttachmentDetailView.tsx` — let THR-1486 merge first*); THR-1486 went `Done` 17:01:10Z and merged as `c39280b4`. The live mutex is now files-while-`In Dev` only: `AttachmentDetailView.tsx`, `FactionSheet.tsx`, `shared/EntityCard.tsx`, `types/entityDetail.ts`, `StyleGuide/*`, `component-selection.md`, `primitives.md`.
- **No mutex against the running ticket, derived from file lists rather than either ticket's prose.** THR-1487 is `In Dev` and touches `contentQuery.ts`, `rewardPool.ts`, `nudgeGrantLiveness.ts`, `undertaking-objects.ts`, trace registration, `scripts/interface-contracts.ts` and the wiring guide. THR-1492 registers **no** interface-map row, so the append-to-list rebase seam that run h had to call out between THR-1487 and THR-1491 does not exist here. The sets are disjoint.

**One rebase note was written into the comment, as a note and not a blocker:** both sibling slices merged after this ticket was filed at 10:27 — THR-1490 (`75bc2a3c`) and THR-1491 (`868a60a3`). Scope item 4's *"if slice 1 has not already collapsed the table to one row"* is now a live conditional, and slice 1 extended `styleguideSync.test.ts` to `src/components/Game/` sheet components, so the two component deletions interact with that test rather than being invisible to it. THR-951's guardrail (re-run the importer greps before deleting; a component that has gained an importer is filed, not deleted) was restated in the same comment.

### Held by the ceiling — 0

The ceiling was in force and had nothing to hold. Recorded rather than omitted, because two consecutive runs did have something held and the difference is the point.

### Declined — 16

**Two are the remaining content-model slices**, a strict chain, unmoved this hour:

- **[THR-1488](https://linear.app/threadbare/issue/THR-1488)** (slice 4) — blocked by THR-1487, which is `In Dev` (claimed 17:29:40Z), not `Done`.
- **[THR-1489](https://linear.app/threadbare/issue/THR-1489)** (slice 5) — blocked by THR-1488 (`Todo`).

**One is T2's input, not T1's:** [THR-1495](https://linear.app/threadbare/issue/THR-1495) (six content kinds have no codex category) — **declined as wrong destination**, unchanged from run h's reading. Four of its six decisions are gameplay-meaning forks for the director; two are plain gaps a design pass dispatches in the same sitting. No blockers, so it will keep passing T1's dependency check every hour — the decline reason is the destination, and it will not change until a design session takes it.

**One is assigned:** [THR-791](https://linear.app/threadbare/issue/THR-791) (traits wave 3), Christian.

**Twelve are the standing set** — nine need a design session, three are held by a dependency. Not restated: re-listing them hourly is the dump this lane forbids. No candidate's `updatedAt` moved since run h, so none was re-verified by hand this run and none is reported as freshly checked. The baseline enumeration with per-ticket evidence is [run a's decline table](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t1--unblock-sweep).

## T1.5 — wayfinder sweep

**Three open maps. AFK tickets resolved: 0 — the pool is empty, not capped.**

Re-verified this run by label sweep across the whole team rather than inherited from run h: **21 `wayfinder:research` tickets, every one `Done`**; **5 `wayfinder:task` tickets, every one `Done`**. The 15 open wayfinder issues in this run's `Todo` scan carry only `wayfinder:map`, `wayfinder:grilling` or `wayfinder:prototype`. `ORCH_WAYFINDER_AFK_MAX` (2) was not approached.

Frontier composition unchanged in every particular, and **no wayfinder child's `updatedAt` has moved since 2026-08-26**: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) 10 open children → 7 frontier, 3 behind the two fight-loop prototypes; [Item Generator](https://linear.app/threadbare/issue/THR-1227) 1 frontier ([THR-1236](https://linear.app/threadbare/issue/THR-1236)); [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) 0 frontier ([THR-1232](https://linear.app/threadbare/issue/THR-1232) assigned to Christian, off the frontier by the assignee rule rather than absent). Physical Conflict's frontier has now stood unchanged for **17 days**. Surfaced, not escalated — HITL waiting on a human is not a defect.

The terminal state runs a–h recorded still holds: **the wayfinder tier has no agent-resolvable work anywhere on the board.** A repeated "no AFK work" line is this known state, not a detector that stopped finding things.

## T2 — design authoring

**Not triggered.** 10 non-`Deferral` items in `Ready for Dev` at scan (11 after this run's promotion) against `ORCH_PROGRAM_WORK_FLOOR` (2). The build shelf is not thin; the reverse.

Recorded because T1 routes to it: **five `Todo` candidates are T2's input rather than T1's** — [THR-790](https://linear.app/threadbare/issue/THR-790), [THR-1274](https://linear.app/threadbare/issue/THR-1274), [THR-1348](https://linear.app/threadbare/issue/THR-1348), [THR-1381](https://linear.app/threadbare/issue/THR-1381), [THR-1495](https://linear.app/threadbare/issue/THR-1495). Unchanged from run h — the list grew by one at 17:08 and has not grown again. None was staged, because the trigger did not fire.

No read of `In Design` was performed this run — that measurement belongs to T3's standing sub-duty, and T3 is skipped below. [Run a's](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t3--architecture-health) reading (2 live against a bound of 1, neither staged by this lane) is the last measurement on record and is **not** restated as current.

## T3 — architecture health

**Skipped — already run today.** [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t3--architecture-health) executed the full sweep at ~10:29 local (08:29Z), past `ORCH_HEALTH_SWEEP_HOUR` (6), and its results stand: 7 LEAKED contracts unchanged, canon staleness 30, `sweep:rank-reach` `PASS`, `check:process` `passed-with-gaps`. **No detector was re-run this hour, and none is reported as clean on this run's authority.** `newFindings: 0` in the frontmatter is therefore "no sweep ran", not "a sweep found nothing".

`__DEBUG.validateTraitRefs()` remains browser-only and unrunnable headless — not run, not reported clean.

**Redundancy: not assessed this sweep.** No judgement pass over `interface-map.md` / `systems-inventory.md` was performed and no coverage is claimed for it.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

Two incidental observations from the board reads T1 needed for its own arithmetic, recorded as such rather than presented as sweep results:

- **WIP is 1** — [THR-1487](https://linear.app/threadbare/issue/THR-1487), promoted by run h at 17:29:40Z and claimed at 17:29 (a same-minute pickup, against run g's 33-minute gap). `stateHistory` reads `Todo → Ready for Dev → In Dev`, so it is **not** a hand-created `In Dev` ticket. Nothing to surface under that duty this hour.
- **[THR-1491](https://linear.app/threadbare/issue/THR-1491) completed at 17:54:23Z**, merged as [#1921](https://github.com/christianspliid-ui/threadbare/pull/1921) / `868a60a3`. Claimed 17:02, done in 52 minutes. That is the third slice to land today and the reason the veto window in `## Needs Christian` has changed shape.

## Escalations

None. Nothing was parked, no question went to Discord, and agreed work is not exhausted. The single write verified on re-query.

**Product-vs-process ratio this week.** The shelf after this run holds 11 non-`Deferral` items, of which 2 carry `Improvement` and 1 `Infrastructure` — the rest are content, engine and UI feature or bug work. This run's promotion is feature work (`UI`). Nothing process-shaped was promoted and nothing was filed; the one-process-ticket-per-three-runs budget is untouched. Trailing week remains roughly **31 product / 7 process (~82% product)**.

**Headline: three slices landed today and the fourth is running, so the two-parent build chain is nearly spent — and design is still the constraint.** THR-1490, THR-1486 and THR-1491 all completed today; THR-1487 is in flight; THR-1492 was promoted here. What remains after those is two content-model slices in a strict chain and a design-input list of five that no lane may stage. The wayfinder tier stayed at zero agent-resolvable work across three maps for the eighth consecutive run. Execution is not the bottleneck and has not been all day.
