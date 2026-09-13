---
lane: tb-orchestrator
run: 2026-09-13i
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Orchestrator — 2026-09-13 (run i, ~12:32Z)

## Needs Christian

**Nothing needs you.** No decision is blocking a builder, and nothing on your list changed.

What moved, in a sentence: **the game's quest boards were found to be empty at every guild hall for an entire run, and the fix is now queued.** Ruins are supposed to accumulate rumours until a guild posts a contract about them — but across a full 175-tick world, exactly one ruin out of 103 ever gathered a single rumour, and it sat too far from any hall to be posted. So the notice board a player walks up to has never once had anything on it. That was discovered half an hour ago by the ticket that was fixing the *other* half of the same board, which closed two minutes before this ran.

## T1 — unblock sweep

Shelf at scan: **12** in `Ready for Dev`, **3** of them non-`Deferral`. Well below the 15-item backed-up threshold, so the full `ORCH_PROMOTE_BATCH_MAX` ceiling of 5 was available; **1 was spent**, leaving the shelf at 13.

`In Dev` holds **one** issue, [THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) (scene-asset regeneration), claimed 10:03:14Z — **2h29m old, one clean `Ready for Dev` → `In Dev` transition, live, not touched.** Nothing meets `ORCH_STALLED_PICKUP_THRESHOLD`, and it was not hand-created into `In Dev`.

### The `Todo` slice: 30 candidates, 0 promotions — unchanged and deliberately not re-enumerated

15 carry a `wayfinder:*` label (skipped unconditionally to T1.5), one is assigned ([THR-791](https://linear.app/threadbare/issue/THR-791)), two are programme epics that are containers rather than work ([THR-1156](https://linear.app/threadbare/issue/THR-1156), [THR-789](https://linear.app/threadbare/issue/THR-789)). The remaining ten are the **same ten destination declines [run h](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13h.md#the-todo-slice-31-candidates-0-promotions) tabulated with the declining sentence quoted from each ticket** — THR-1503, THR-1501, THR-1348, THR-1274, THR-1393, THR-790, THR-1381, THR-1218, THR-175, THR-1220. Every one was re-read this run rather than assumed; not one has changed. The table is not reprinted, because re-listing an unchanged set hourly is what trains a reader to skip the section.

### The `Idea` slice — where the promotion came from

Exactly **one** item is new in `Idea` since run h's scan, and it was promotable.

**Promoted — 1.**

- **[THR-1506](https://linear.app/threadbare/issue/THR-1506/ruin-quest-hooks-never-fire-in-a-normal-run-1-of-103-ruins-has-any)** (Low, `Deferral`/`Engine`, *Encounter Experience*) — ruin quest hooks never fire in a normal run. Measured seed 42 / medium to tick 175: **103 ruins, 34 of them inside `GUILD_QUEST_RADIUS` of an adventurers' hall, 1 with any live `knows_clue_of` evidence, 0 meeting both, 0 ever stamped** — so all 26 settlements that render `GuildQuestPanel` show an empty board for the whole run. Proximity is not the constraint; clue evidence is.

  **Blocked by: nothing** — empty native `blockedBy`, no prose gate, no time gate. Promoted now rather than at filing because its parent, [THR-1026](https://linear.app/threadbare/issue/THR-1026), went `Done` at **12:30:10Z** (PR [#1939](https://github.com/christianspliid-ui/threadbare/pull/1939)) — **one minute before the write**, which both frees `src/engine/ruins/questHooks.ts` and settles the faction question the *other* way, leaving this ticket as the whole remaining substance rather than half an entangled pair.

  **Claims re-verified on `origin/main` before the write, not taken on the ticket's word.** All five named constants exist at the stated values in `src/engine/ruins/constants.ts` (`CLUE_MAX_AGE_TICKS_VAGUE = 20` :11, `CLUE_SPAWN_LIBRARY_BASE = 0.6` :47, `CLUE_SPAWN_TAVERN_BASE = 0.35` :49, `CLUE_QUEST_THRESHOLD = 0.5` :173, `GUILD_QUEST_RADIUS = 5` :191), and both named surfaces exist. So the *"one file, a tuning pass, not a rewrite"* premise the promotion rests on is measured, not quoted.

  **Why this is not an eleventh destination decline — the judgement call of the run.** The ticket carries a heading reading `## Open question for the design pass`, which on a fast read looks exactly like the ten above. It is not the same shape. Those ten each contain a sentence saying the decision is *not an executor's*; this one contains the opposite — its Engine pillar reads *"this is a tuning pass, not a rewrite (the tunability NFP is already satisfied)"*. It names three candidate constants, names the first suspect **with its arithmetic** (TTL 20 against a 30-tick posting interval, so evidence can expire between sweeps by construction), and states a runnable closure predicate. A numeric calibration with a stated acceptance measure is the executor's under `Docs/canon/process.md` § *User review interface* rule 4. Recorded at this length because the distinction is thin and a future run should be able to check the reasoning rather than re-derive it.

  Coordination block posted at promotion with the three required lines — `Mutex with: nothing` (THR-1026 merged at 12:30Z; no open issue touches `src/engine/ruins/`), parallel-safe with all twelve shelf items by file disjointness, and the evidence shape: **Engine + Content pillars, no UI pillar, so no browser-verify is owed** (THR-688 rule C). Two things added to the Done-when that the ticket does not ask for itself: **re-measure on a second seed** before calling it tuned — seed 42 is this repo's known-lucky seed, and THR-1348 measured 11 of 12 seeds unable to reach the trade-route kind at all, so a constant tuned until one seed cooperates is a failure already on record here — and **run `npm run test:heavy` locally**, since engine files are touched and `npm test` covers only the three fast vitest projects (THR-1384).

**Rule-0 discipline.** Product work, not process — a player-facing surface renders empty at 26 settlements for an entire run — so the materiality bar did not need applying and no process ticket was filed. **Week's product-vs-process ratio: strongly product**; the process-ticket budget (at most one per three runs) remains untouched, as it has all week.

### Held by the ceiling — 0

Thirteenth consecutive run with zero held, from real headroom (shelf 12 against a threshold of 15) rather than a throttle.

### One queue-hygiene check, since it costs nothing

[THR-1505](https://linear.app/threadbare/issue/THR-1505), filed **directly into `Ready for Dev`** at 11:14Z rather than promoted, was checked for the THR-836 failure — an issue born into the queue with no coordination block, which `pull-work` Step 3 must then reconstruct by guesswork. **It has one**, posted as its first comment in the same pass that filed it, carrying all three lines with the mutex reason stated inline. Filed correctly; nothing owed.

## T1.5 — wayfinder sweep

**Three open maps, zero AFK-resolvable tickets anywhere — re-proved this run rather than inherited.** Both AFK labels were queried workspace-wide rather than inferred from the `Todo` column:

- `label:"wayfinder:research"` → **21 issues, all 21 `Done`.**
- `label:"wayfinder:task"` → **5 issues, all 5 `Done`.**

So `ORCH_WAYFINDER_AFK_MAX` (2) went unspent for the **"AFK work is finished"** cause, not the "found nothing I could do" cause. Re-run rather than carried from [run h](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13h.md#t15--wayfinder-sweep) because it is the claim the whole tier turns on, and two hours is long enough for a map to grow a new research child.

The twelve open children of [Item Generator](https://linear.app/threadbare/issue/THR-1227), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) and [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) all carry `wayfinder:grilling` or `wayfinder:prototype` — HITL by construction, which this lane must not touch. Unchanged set, every child last touched 2026-08-26 or earlier; **not re-enumerated**, for the same reason as the `Todo` table above. Runs c and d carry them in full, and they are already on Christian's list via the briefing.

Worth one line on shape rather than membership: **Powers & Spellcraft is one ticket from cleared** — all four of its research children and all three of its grilling children are `Done`, leaving only the prototype sketch [THR-1232](https://linear.app/threadbare/issue/THR-1232), which is assigned to Christian and therefore outside the frontier by the tier's own rule.

## T2 — design authoring

**Not triggered.** The shelf holds **3** non-`Deferral` items against `ORCH_PROGRAM_WORK_FLOOR` of 2. (The promotion does not change this — THR-1506 is `Deferral`-labelled, so it deepens the shelf without lifting the programme count.)

Recorded because it would bar the tier independently: `In Design` holds **2 live, 0 excluded** — [THR-1479](https://linear.app/threadbare/issue/THR-1479) (appointment primitive, unassigned, touched 2026-09-12T22:26Z) and [THR-1448](https://linear.app/threadbare/issue/THR-1448) (a held town is a faction position, unassigned, touched 2026-09-12T07:23Z). Both sit inside `ORCH_IN_DESIGN_STALE_DAYS` (7) and neither carries `Parked`, so both count against `ORCH_MAX_IN_DESIGN` of 1. Over bound, unchanged, and **not by this lane's hand** — no state was mutated; the predicate is warn-only and the exit (`Parked`) is a human's.

The standing tension is unchanged and is [run h](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13h.md#t2--design-staging)'s to have named: T2 is barred twice over while ten `Todo` tickets each say they need a design pass. Not re-argued here; it is a weekly-retro input, not an hourly finding.

## T3 — architecture health

**Skipped — already run today.** [Run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-13c.md#t3--architecture-health) executed the full sweep at 04:27Z with four detectors. The tier is once-daily; **no detector ran this hour and none is reported as clean.** The redundancy judgement pass was likewise **not performed this run** — run c's result stands, and this line exists so the gap is not mistaken for coverage. `__DEBUG.validateTraitRefs()` remains browser-only and unrunnable headless: not run, not reported clean.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Sunday. Next pass tomorrow.

One check made outside the tier because the queue scan surfaced it directly: **hand-created `In Dev` tickets — none.** The single `In Dev` issue (THR-876) has a `Ready for Dev` state in its history, so the THR-1325 class is absent.

`newFindings: 0` is a consequence of the tier not running, not of a sweep that found nothing.

## Escalations

**None.** No question was asked, no item parked, Discord not used. Agreed work was not exhausted — one promotable item existed and was promoted.

One observation offered without a ticket, since it is the opposite of an impediment: **THR-1506 went from discovery to queued in 15 minutes** (filed 12:16Z at a sibling's closeout, promoted 12:31Z), and the ticket that discovered it closed at 12:30Z. The lane's usual complaint is that the `Todo` column cannot feed the executor. This hour it did not have to — the build queue fed itself from its own last hour's work, which is the pipeline finding its own gaps rather than waiting to be told about them, for the third time in a day.
