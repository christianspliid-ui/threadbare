---
lane: tb-orchestrator
run: 2026-09-12d
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-12 (run d, ~12:30Z)

## Needs Christian

**One question, and it came out of a fix that shipped an hour ago.**

You asked this morning for the encounter to let you click a mortal's name and see what the ending changed about them. That is built and on its way in. While building it the session found something it could not decide on its own, and it is a game question rather than a technical one, so it is yours.

**The character sheet hides what it knows about strangers.** If you barely know a mortal, their sheet says *"Vara carries no known possessions, conditions, powers, or agreements"* — even at the moment an encounter has just wounded and exhausted her. The wound is real and on the world's books; the sheet declines to show it to you because you do not know her well enough. For a mortal you are bonded to, everything shows normally.

That is the knowledge system working exactly as designed — you are not meant to be omniscient about strangers. But it sits awkwardly with what you asked for, because the whole point of clicking the name was *"show me what this encounter just did."* The session deliberately did not override it, since silently exempting the sheet would have been a design change nobody asked for.

**So: should an encounter's own consequences be visible on a stranger's sheet, exempt from the familiarity gate — because you were *there* and you watched it happen — or does the fog stay honest and you only see what you have earned the right to see?**

Either answer is defensible and the game means something different each way. Say which and it gets filed; say nothing and it stays as it is, which is also a real answer.

Nothing else needs you this hour. The eight design questions from yesterday's briefing are still waiting and are not being chased.

## T1 — unblock sweep

Shelf at scan: **18** in `Ready for Dev`, **13** of them non-`Deferral`. Above the 15-item backed-up threshold, so the ceiling narrowed this run to at most one promotion — **it never bound, because nothing was promotable.** The held-back list is empty and that is a measurement, not an omission.

**34 `Todo` candidates read**, down two from run c: [THR-1493](https://linear.app/threadbare/issue/THR-1493) was promoted by that run, and no new candidate arrived in the hour. 15 carry a `wayfinder:*` label and were skipped unconditionally to T1.5. **19 were judged here.**

### Promoted — 0

### Declined — 19, composition unchanged from [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12c.md#t1--unblock-sweep)

**Six are the content-model and router slices, all held by their own chain.** [THR-1486](https://linear.app/threadbare/issue/THR-1486), [THR-1487](https://linear.app/threadbare/issue/THR-1487), [THR-1488](https://linear.app/threadbare/issue/THR-1488), [THR-1489](https://linear.app/threadbare/issue/THR-1489) are blocked by [THR-1485](https://linear.app/threadbare/issue/THR-1485); [THR-1491](https://linear.app/threadbare/issue/THR-1491) and [THR-1492](https://linear.app/threadbare/issue/THR-1492) by [THR-1490](https://linear.app/threadbare/issue/THR-1490), with THR-1491 additionally by THR-1485. **Both slice 1s are still `Ready for Dev`, not `Done`** — verified in this run's own shelf scan — so every one is an unmet blocker. Neither slice 1 has been claimed in the hour since run c. This is the healthy steady state of a sliced program waiting on an executor, not a stall.

**Thirteen are the standing set.** Nine need a design session, three are held by a dependency, one is parked on a director decision, one is assigned to Christian. Not restated — re-listing them hourly is the dump this lane forbids. Their `updatedAt` values were checked against run c's scan and none moved except [THR-1024](https://linear.app/threadbare/issue/THR-1024), whose only change was run c's own comment at 11:30:15Z.

One was re-verified directly rather than inherited, because its blocker was scheduled to clear as a side effect: **THR-1024** stays declined on *"do not start this before THR-966"*. `get_issue` this run returns [THR-966](https://linear.app/threadbare/issue/THR-966) at **`Idea`**, `completedAt: null`, with a single `stateHistory` entry — it has never left `Idea` since creation on 2026-08-02. THR-1490 is still slated to resolve it as mount, and THR-1490 has not landed.

### Coordination repair — THR-1461's own fix prescription is the one that failed this morning

**This is the run's finding, and it is the same class as run c's repair one hour earlier.**

[THR-1461](https://linear.app/threadbare/issue/THR-1461) ("the premonition's subject-name control opens the previously selected mortal's sheet") sits on the shelf at `Medium`, unassigned. Its description's *Likely cause* section prescribes the fix: *"the fix is that the premonition passes its own `subjectId` to the sheet opener explicitly."*

**That exact fix was shipped and measured as insufficient at 12:21Z today**, on the sibling ticket [THR-1477](https://linear.app/threadbare/issue/THR-1477), whose closeout states it in full:

> `openAgentProfileForId` is a bare `setProfileModalAgentId` — but the card the modal renders, `agentInfoCard`, is memoised on **`selectedAgentId`**, and GameView gates the mount on `profileModalAgentId && agentInfoCard`. So setting only the profile id renders **nothing** (no agent selected) or the **previously selected agent's** sheet under the new id.
>
> I shipped the one-line version first and the browser said the sheet still did not open.

The same closeout names THR-1461 explicitly as sharing the root cause, says it built the working primitive `openAgentSheetForId` (sets both ids; deliberately does not open the ActionDrawer, for callers behind a full-screen interrupt) and deliberately left THR-1461's surface unrepointed so as not to close anything out from under it: *"that executor repoints its own surfaces and will find `openAgentSheetForId` waiting."*

**Nothing carried that to THR-1461.** Its latest comment was its filing block of 2026-09-11T07:09:17Z, whose mutex line read *"nothing — no open ticket touches `PremonitionModal.tsx` (checked 2026-09-11)"*. An executor claiming it would have read a prescription that reproduces the reported symptom, with no pointer to the primitive that fixes it — and on this surface a failed fix and a stale bundle look identical (nothing happens on click), which is precisely how THR-1477's session nearly mistook the dead one-liner for correct code needing a rewrite (impediment **#1027**).

**What was written:** a complete coordination block posted as the latest comment on THR-1461 — all three lines restated verbatim where unchanged, plus the corrected fix path, the primitive's location, the #1027 stale-transform warning, and one added soft mutex:

- **`Mutex with: THR-1490`** — its scope items 3 and 5 mount the detail-page stack in `GameView` and rewrite the `NavigationTarget` adapters into arms of one ref router, whose `sheet` mode *"calls the existing opener behind the `NavigationTarget` arm"*. That opener is the one THR-1461 repoints. `PremonitionModal.tsx` itself is untouched, so this is sequence-not-block; the original "nothing touches that file" reason is retained rather than discarded.

The comment states the primitive's availability honestly rather than assuming it: [PR #1916](https://github.com/christianspliid-ui/threadbare/pull/1916) is `OPEN` with auto-merge armed at 12:20:58Z and `mergeStateStatus: BLOCKED` — queued behind required checks, not conflicted — so a claiming session is told to check `main` first and to declare a duplicate in its closeout if it builds the same fix rather than waiting.

**Complete, not a bare addendum** — `pull-work` Step 3 validates the *latest* comment for all three lines, so a partial note would have bounced the ticket off the shelf. No state was changed: no claim, no assignee, no priority. This is Step 4b coordination-block authoring, which is this lane's own work product.

### Run c's repair is confirmed to have worked, within the hour

Recorded because a lane that only reports hazards and never reports catches cannot be evaluated. Run c added `Mutex with: THR-1490` to THR-1477 at 11:30:50Z. The session that claimed THR-1477 at ~12:21Z read it, and its closeout carries a **Scope note**: *"Per the coordination block I checked THR-1490 first — not landed — so this is deliberately minimal: one optional veil prop, one hook handler, no model-builder changes, nothing that makes that rewrite harder."*

A hazard surfaced by this lane at 11:30Z demonstrably changed the shape of shipped work fifty minutes later. Two `High` tickets rewriting one code path did not become impediment #763 a second time.

## T1.5 — wayfinder sweep

**Three open maps. Frontier: 8 tickets, every one HITL. AFK tickets resolved: 0 — the pool is empty, not capped.**

Re-verified this run rather than inherited: a `wayfinder:research` label sweep across the whole team returns **21 tickets and every one is `Done`**. The 15 open wayfinder issues in this run's own `Todo` scan carry only `wayfinder:map`, `wayfinder:grilling` or `wayfinder:prototype`, and none has a changed `updatedAt` since run c. `ORCH_WAYFINDER_AFK_MAX` (2) was not approached.

Unchanged in every particular: Physical Conflict 7 frontier / 3 blocked behind the two fight-loop prototypes; Item Generator 1 frontier ([THR-1236](https://linear.app/threadbare/issue/THR-1236)); Powers & Spellcraft 0 frontier ([THR-1232](https://linear.app/threadbare/issue/THR-1232) assigned to Christian, off the frontier by the assignee rule). Physical Conflict's frontier has now stood unchanged for **17 days**. Surfaced, not escalated — HITL waiting on a human is not a defect.

The terminal state runs a, b and c recorded still holds: **the wayfinder tier has no agent-resolvable work anywhere on the board.** Read a repeated "no AFK work" line as this known state, not as a detector that stopped finding things.

## T2 — design authoring

**Not triggered.** 13 non-`Deferral` items in `Ready for Dev` against `ORCH_PROGRAM_WORK_FLOOR` (2). The build shelf is not thin.

No read of `In Design` was performed this run — that measurement belongs to T3's standing sub-duty, and T3 is skipped below. Run b's reading (2 live against a bound of 1, neither staged by this lane) is the last measurement on record and is **not** restated here as current.

## T3 — architecture health

**Skipped — already run today.** [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t3--architecture-health) executed the full sweep at ~10:29 local (08:29Z), past `ORCH_HEALTH_SWEEP_HOUR` (6), and its results stand: 7 LEAKED contracts unchanged, canon staleness 30, `sweep:rank-reach` PASS, `check:process` passed-with-gaps. **No detector was re-run this hour and none is reported as clean on this run's authority.**

`__DEBUG.validateTraitRefs()` remains browser-only and unrunnable headless — not run, not reported clean.

**Redundancy: not assessed this sweep.** No judgement pass over `interface-map.md` / `systems-inventory.md` was performed this run and no coverage is claimed for it.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

## Escalations

None. Nothing was parked, no question went to Discord, and no write failed verification.

One observation held for the weekly retro rather than filed as a ticket, per the process-work throttle: **two consecutive runs have now found a shelf ticket whose coordination block was falsified by a sibling shipping in the same day** (THR-1477 ← THR-1490 at run c; THR-1461 ← THR-1477 at run d). Both were caught, both within the hour, and both repairs demonstrably landed — so this is not yet a loss, and under the materiality bar it is an impediment-log observation, not process work. What makes it worth a line is the shape: a block is written once at filing time and then silently decays as its neighbours ship, and the only thing currently re-reading blocks against a moving board is this lane's hourly sweep. Cost of leaving it: two re-derivations caught per day at roughly one comment each. Cost of formalising it: unmeasured. Not a ticket.

**Product-vs-process ratio this week:** the shelf this run holds 13 non-`Deferral` items, of which 2 carry `Improvement` and 1 `Infrastructure` — the rest are content, engine and UI feature or bug work. Nothing process-shaped was promoted this run, and nothing was filed.
