---
lane: tb-orchestrator
run: 2026-09-12g
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-12 (run g, ~16:28Z)

## Needs Christian

**One thing is newly time-sensitive, and it is small.**

The detail-card work reached the piece where **clicking a content thing — an encounter template, an item template, a condition — opens the codex** as its full page. The plan asked for your veto on exactly that: should content open in the codex, or should content simply not have a full page at all? That piece just went to the front of the build queue this hour, so the window to say "no" is now rather than later. **Saying nothing means it ships as designed** (content opens the codex), which is a perfectly good answer — the veto is offered, not required. If you do veto, the change is one line: content gets a card and no deeper page, and nothing else moves.

**Still waiting, not being chased — unchanged from the last four hours.** The eight design questions on **fights**, **items** and **powers & spellcraft**. All the homework on those three efforts is finished; nothing further can be built on any of them until you answer. Seven of the eight are about fighting.

**Also still open, from this morning:** should an encounter's own consequences show on a stranger's character sheet — you watched the wound happen, but you have not earned the right to know her. Either answer is defensible; saying nothing leaves it as it is.

**What moved on its own this hour:** the detail-card router's first piece landed at 15:54, which unblocked two more. One went to the build queue; the other is waiting only because the queue is already full. The content-tag work is being built right now. No decision of yours is waiting on any of that.

## T1 — unblock sweep

Shelf at scan: **16** in `Ready for Dev`, **10** of them non-`Deferral` — unchanged in count from [run f](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12f.md), because run f's promotion (THR-1486) was claimed into `In Dev` at 16:02Z, giving back the slot it took. Still above the 15-item backed-up threshold, so the ceiling narrowed this run to at most one promotion. **This time it bound** — two candidates were promotable and one was held. Run f recorded an empty held-back list as "a measurement, not an omission"; this run is what a non-empty one looks like.

**33 `Todo` candidates read.** 15 carry a `wayfinder:*` label and were skipped unconditionally to T1.5. **18 were judged here.**

### Promoted — 1

**[THR-1491](https://linear.app/threadbare/issue/THR-1491) — one card, one router slice 2 (content cards, the codex overlay as the content sheet, anchor status derived from the registry).** `High`, unassigned, `Content Architecture`.

Both of its named blockers reached `Done` today, the second of them 34 minutes before this sweep:

- **[THR-1490](https://linear.app/threadbare/issue/THR-1490)** (router slice 1) — `completedAt: 2026-09-12T15:54:36.249Z`. This is the half run f declined on: at 15:30Z it was `In Dev` with `completedAt: null`.
- **[THR-1485](https://linear.app/threadbare/issue/THR-1485)** (content-model slice 1 — supplies `ContentObjectKindId` and the registry's `surface` column) — `completedAt: 2026-09-12T14:39:13.893Z`.

Checks that ran before the write, each recorded because a check that finds nothing is the only evidence it ran:

- **Plan-doc liveness:** `npm run check:plan-doc-liveness -- Docs/plans/2026-09-12-thr-1482-one-card-one-router.md` → `LIVE … resolves on origin/main`.
- **Standing retire verdict (THR-990):** latest comment read (`list_comments`, `createdAt`, limit 5). One comment on the thread — the filing coordination block, 10:28:08Z. No retire, do-not-build or superseded verdict.
- **Destination:** no "needs design finalization" sentence in the body; no `wayfinder:*` label.
- **Write then verify:** `save_issue(state:"Ready for Dev")` then `get_issue` → `status: "Ready for Dev"`, `startedAt: 16:28:52Z`, `stateHistory` showing `Todo` ended and `Ready for Dev` started at that timestamp, **no `assignee` key present** on the re-query. Priority untouched at `High`.
- **Coordination block posted** (16:29:18Z, corrected in place 16:31:47Z — see below) with the three lines, `Blocked by: nothing` naming both now-`Done` blockers so a later sweep does not re-parse the *"Blocked by slice 1 and THR-1481 slice 1"* prose and decline what it already promoted, plus the evidence shape and the open veto.

**The parallel-safety claim was re-measured, and it half-held — the correction is the finding of this run.** THR-1491's filing block asserts parallel-safety with THR-1486, which entered `In Dev` after that block was written. The first draft of the promotion comment asserted a mutex on `src/data/content-objects.ts` and **that was wrong**: THR-1481's slice list (`Docs/plans/2026-09-12-thr-1481-content-model.md` line 379) gives slice 2 as `content-tags.ts`, the tag-catalog generator, the `tag.*` tooltip prefix, the five-dialect migration, `sphereAffinity`, `censusTag`, `check:attachment`, the codex tag filter, attachment-sheet chips and the attachment-pipeline skill — no `content-objects.ts`. The same plan's line 372 says the `surface` column is filled by THR-1482 slice 2 *after* THR-1481 slice 1 lands, which is exactly the arrangement now in place.

The real seam is elsewhere and narrower: **`src/components/Codex/*`**. THR-1486 edits the codex tag filter there; THR-1491's router arm reaches `openCodexEntry` / `codexRegistry.ts` in the same tree. That is a rebase risk, not a blocking dependency, and it is now stated as such. The comment was **edited in place rather than superseded by a second one**, so the coordination block `pull-work` Step 3 validates stays the latest comment.

Recording the correction rather than only the corrected result: a mutex reason an executor cannot verify is worse than no mutex, because THR-688 rule B lets them reverse only a *verifiably inapplicable* reason — a plausible-but-false one is the shape that survives review.

### Held by the ceiling — 1

**[THR-1492](https://linear.app/threadbare/issue/THR-1492) — one card, one router slice 3 (sunset the duplicate cards).** `Medium`, unassigned, `Content Architecture`. **Promotable and deliberately not promoted.**

Its coordination block names exactly one blocker — **THR-1490, `Done` 15:54:36Z** — and not THR-1491, so the two slices are independent despite the numbering. It was held because the shelf sits at 16, above the 15-item backed-up threshold, and the ceiling allows one promotion per run. **The next run should promote it if the shelf has not grown**, subject to re-reading its latest comment.

Two things the next run should carry rather than re-derive: it is `sonnet`-suggested (deletions under re-verified zero-importer greps, one renderer migration, one `Section` swap), and its block carries a live mutex — **THR-1486, In Dev, both edit `src/components/Game/AttachmentDetailView.tsx`, with an explicit "let THR-1486 merge first"**. That mutex is a second, independent reason this was the right one of the two to hold.

### Declined — 16

**Three are the remaining content-model slices**, a strict chain (plan lines 379–382: *"Blocked by 1"*, *"Blocked by 2"*, *"Blocked by 3"*, *"Blocked by 4"*), so THR-1490 going `Done` moved none of them:

- **[THR-1487](https://linear.app/threadbare/issue/THR-1487)** (slice 3) — blocked by THR-1486, `In Dev`, `completedAt: null`. Next in line on that chain.
- **[THR-1488](https://linear.app/threadbare/issue/THR-1488)** (slice 4) — blocked by THR-1487 (`Todo`).
- **[THR-1489](https://linear.app/threadbare/issue/THR-1489)** (slice 5) — blocked by THR-1488 (`Todo`).

**One is assigned:** [THR-791](https://linear.app/threadbare/issue/THR-791) (traits wave 3), Christian.

**Twelve are the standing set** — nine need a design session, three are held by a dependency. Not restated; re-listing them hourly is the dump this lane forbids. Composition is unchanged from run f and no candidate's `updatedAt` moved, so nothing was re-verified by hand this run and none is reported as freshly checked.

## T1.5 — wayfinder sweep

**Three open maps. AFK tickets resolved: 0 — the pool is empty, not capped.**

Re-verified by label sweep across the whole team rather than inherited: **21 `wayfinder:research` tickets, all `Done`**; **5 `wayfinder:task` tickets, all `Done`**. The 15 open wayfinder issues in this run's `Todo` scan carry only `wayfinder:map`, `wayfinder:grilling` or `wayfinder:prototype`. `ORCH_WAYFINDER_AFK_MAX` (2) was not approached.

Frontier composition is unchanged from run f in every particular, and no wayfinder child's `updatedAt` has moved since 2026-08-26: [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) 10 open children → 7 frontier, 3 behind the two fight-loop prototypes; [Item Generator](https://linear.app/threadbare/issue/THR-1227) 1 frontier ([THR-1236](https://linear.app/threadbare/issue/THR-1236)); [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) 0 frontier ([THR-1232](https://linear.app/threadbare/issue/THR-1232) assigned to Christian, off the frontier by the assignee rule). Physical Conflict's frontier has now stood unchanged for **17 days**. Surfaced, not escalated — HITL waiting on a human is not a defect.

The terminal state runs a–f recorded still holds: **the wayfinder tier has no agent-resolvable work anywhere on the board.** Read a repeated "no AFK work" line as this known state, not as a detector that stopped finding things.

## T2 — design authoring

**Not triggered.** 10 non-`Deferral` items in `Ready for Dev` at scan (11 after this run's promotion) against `ORCH_PROGRAM_WORK_FLOOR` (2). The build shelf is not thin.

Recorded because T1 routes to it: **four `Todo` candidates are T2's input rather than T1's** — [THR-790](https://linear.app/threadbare/issue/THR-790), [THR-1274](https://linear.app/threadbare/issue/THR-1274), [THR-1348](https://linear.app/threadbare/issue/THR-1348), [THR-1381](https://linear.app/threadbare/issue/THR-1381). Unchanged from run f; none was staged, because the trigger did not fire. Named so the queue's design debt stays countable rather than only implied by a decline tally.

No read of `In Design` was performed this run — that measurement belongs to T3's standing sub-duty, and T3 is skipped below. Run b's reading (2 live against a bound of 1, neither staged by this lane) is the last measurement on record and is **not** restated as current.

## T3 — architecture health

**Skipped — already run today.** [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t3--architecture-health) executed the full sweep at ~10:29 local (08:29Z), past `ORCH_HEALTH_SWEEP_HOUR` (6), and its results stand: 7 LEAKED contracts unchanged, canon staleness 30, `sweep:rank-reach` PASS, `check:process` passed-with-gaps. **No detector was re-run this hour, and none is reported as clean on this run's authority.**

`__DEBUG.validateTraitRefs()` remains browser-only and unrunnable headless — not run, not reported clean.

**Redundancy: not assessed this sweep.** No judgement pass over `interface-map.md` / `systems-inventory.md` was performed and no coverage is claimed for it.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

One incidental observation from the `In Dev` read that T1 needed for its shelf arithmetic, recorded rather than presented as a T3 sweep result: **WIP is 1** ([THR-1486](https://linear.app/threadbare/issue/THR-1486), promoted by run f at 15:29Z and claimed at 16:02Z, 26 minutes old at scan). Its path through `Todo → Ready for Dev → In Dev` is on record from this lane's own promotion, so it is **not** a hand-created `In Dev` ticket. Nothing to surface under that duty this hour.

## Escalations

None. Nothing was parked and no question went to Discord. The single write verified on re-query.

**For the retro — the falsified-block observation gains a second failure mode, and this time the lane authored it.** Runs c, d and e each found a shelf ticket whose coordination block had been falsified by a sibling shipping the same day. Run f found one that held. This run found one that held *on the designer's terms* — and then wrote a false mutex reason of its own into the promotion comment before catching it against the plan doc's slice list. The pattern worth naming is not "blocks go stale"; it is that **the seam between two slices is asserted in three places** (each ticket's own block, the parent plan's parallel-safe note, the plan's per-slice file list) and only the third is checkable. The cheap discipline is to read the file list, not the prose claim, on either side. Still an impediment-log observation rather than process work, per the throttle: caught within two minutes, cost zero, materiality bar not met. **Not a ticket** — the weekly retro batches it.

**Product-vs-process ratio this week:** the shelf after this run holds 11 non-`Deferral` items, of which 2 carry `Improvement` and 1 `Infrastructure` — the rest are content, engine and UI feature or bug work. The one promotion this run is feature work (`Content` / `UI` / `Engine`). Nothing process-shaped was promoted, and nothing was filed.
