---
lane: tb-orchestrator
run: 2026-09-12c
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-12 (run c, ~11:30Z)

## Needs Christian

**Nothing new is asked of you.** The same eight questions are still the only things waiting, unchanged since this morning.

The bug you filed twenty minutes ago — [the town that keeps a door open](https://linear.app/threadbare/issue/THR-1493), where the sequel scene greets the traveler at whatever place they happened to wander to rather than the town that actually thinks well of them — is now in the build queue and needs nothing further from you. You left the choice of fix to whoever picks it up, and that instruction was carried into the queue with it.

**The eight questions, still waiting.** Seven are about fighting — what a fight feels like blow by blow, what a monster *is*, whether losing means dying or yielding or being spared, what winning leaves in your hands, when a fight starts on its own, and whether a whole company can fight together or only one person steps forward:

- [NPC-mode fight loop — the stat block and test skeleton](https://linear.app/threadbare/issue/THR-1263)
- [Agent-mode fight loop — opposed band-pairs](https://linear.app/threadbare/issue/THR-1264)
- [Monster opponents — just enough monster](https://linear.app/threadbare/issue/THR-1268)
- [Defeat wears many faces — the outcome spectrum](https://linear.app/threadbare/issue/THR-1266)
- [Victory yields — what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270)
- [Systemic triggers v1 — walking into the lair, grudges boiling over](https://linear.app/threadbare/issue/THR-1267)
- [Companies in fights?](https://linear.app/threadbare/issue/THR-1271)

The eighth is the item generator: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236) — a throwaway sketch built for you to say *cool* or *not cool* to. (The matching [twenty generated spells](https://linear.app/threadbare/issue/THR-1232) is already assigned to you.)

When the play-through sitting is finished, open a chat and say **"work the map"** and these get worked one at a time.

## T1 — unblock sweep

Shelf at scan: **18** in `Ready for Dev`, **14** of them non-`Deferral`. Above the 15-item backed-up threshold, so the ceiling again narrowed this run to **at most one promotion**, and again it bound on a real candidate.

**36 `Todo` candidates read.** 15 carry a `wayfinder:*` label and were skipped unconditionally to T1.5. **21 were judged here.**

### Promoted — 1

**[THR-1493](https://linear.app/threadbare/issue/THR-1493) — The Table That Holds opens with a return the engine never performs.**

| Check | Result |
|---|---|
| Native `blockedBy` | **empty** — [THR-1479](https://linear.app/threadbare/issue/THR-1479) is attached as `relatedTo`, not `blockedBy` |
| Description blockers | none. The body offers two fixes and says *"pick one at pickup"* |
| Plan-doc liveness | names no plan doc → passes trivially (the gate is about promised artifacts, not required ones) |
| Latest comment | **no comments existed** → no standing retire verdict (THR-990 check performed, passed) |
| Wayfinder label | none |
| Write verified | `get_issue` re-query: `status: Ready for Dev`, `stateHistory` shows `Todo → Ready for Dev` at 11:29:29.087Z, **no `assignee` key present** |
| Coordination block | [posted 11:30:01Z](https://linear.app/threadbare/issue/THR-1493) as the latest comment — all three lines present, so `pull-work` Step 3 will not bounce it |

No priority was set and no assignee was set; the promotion is a state transition only.

**Why this cleared the "wrong destination" bar when superficially similar tickets did not.** The body concedes that the cheap prose fix *"would delete the premise THR-1182 built the encounter around — which is a design change, not a truthfulness edit"*, which reads like a design fork, and this lane declines design forks. The distinguishing fact is who holds the fork. [THR-1348](https://linear.app/threadbare/issue/THR-1348) is declined because its author explicitly **withheld** it — *"this is the fork, and it is not the executor's to settle."* THR-1493's author explicitly **delegated** it — *"pick one at pickup"* — and then wrote an either/or Done-when that accepts both arms (*"either names the town the parent's standing is actually with, or stops claiming a return"*). Opposite signals on the same surface. Recorded because the two tickets will look alike to a future sweep.

The promotion comment carries the one caveat that follows from the fork: arm B is *"wait for THR-1479"*, and THR-1479 is still `In Design`. If the executor picks arm B it should comment and return the ticket to `Todo` rather than hold a claim against an unbuilt primitive.

### Coordination repair — the THR-1490 ↔ THR-1477 collision, now named on both sides

[Run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12b.md#t1--unblock-sweep) surfaced this hazard and left it as an instruction for *"whoever promotes THR-1490"*. **Nobody did** — see the correction below — so the instruction had no addressee and the hazard reached the shelf unrecorded. It is now written into both blocks.

The collision, verified this run by reading both blocks in full:

- **[THR-1490](https://linear.app/threadbare/issue/THR-1490)** (slice 1, `High`, unassigned) rewrites `EncounterVeil.openEntity` into an adapter of one ref router (scope item 5) and gives `EntityLink` a `ref` prop while deprecating `onOpenEntity` (item 6). Its block named the **files** but no ticket.
- **[THR-1477](https://linear.app/threadbare/issue/THR-1477)** (`High`, unassigned) *is* a request to fix that exact routing — *"clicking the agent's name on the encounter does nothing visible — route it to the character sheet."* Its block named `Mutex with: THR-1475, THR-1467` and could not have named THR-1490, which was created four hours later.

Two `High`, unassigned tickets on one shelf, rewriting the same code path, neither naming the other. If THR-1477 is claimed first its patch is rewritten by THR-1490; if THR-1490 lands first THR-1477 may be satisfied by construction. This is the shape of impediment #763 (~1 session lost to a concurrent double-implementation).

**What was written:** a complete coordination block posted as the latest comment on each, restating the original three lines verbatim and adding the ticket-level mutex with its reason inline (THR-688 rule B). **Complete, not a bare mutex line** — `pull-work` Step 3 validates the *latest* comment for all three lines, so a partial addendum would have bounced both tickets off the shelf. THR-1477's copy also tells a claiming session to check THR-1490's state first and close out as satisfied rather than re-patch if it has landed.

No state was changed on either issue: no claim, no assignee, no `In Dev`. This is coordination-block authoring (Step 4b), which is this lane's own work product.

### Correction to run b — THR-1490 was not held, it was already promoted

Run b reported THR-1490 as *"held solely by the backed-up-shelf ceiling"* and recommended the next run promote it. The board says otherwise: `stateHistory` shows `Todo → Ready for Dev` at **10:29:04.118Z**, thirteen seconds *before* run b posted its own promotion comment on THR-1485 at 10:29:17Z. The attended session promoted it mid-run, exactly as run b's own caveat predicted it might (*"may promote it itself within the hour — re-read before acting"*).

So run b's held-back list was stale at the moment of writing, not wrong when read. The practical consequence is the one repaired above: a ceiling deferral carries its follow-up instruction to the *next promoter*, and when the ticket is promoted by someone outside this lane, that instruction is addressed to nobody. **A future run should attach such follow-ups to the ticket as a comment at the moment it defers, not to the report.**

### Declined — 21, and the composition has shifted again

**Six are new this run and share one blocker shape:** the content-model and router slices filed at 10:24–10:27Z are blocked by their own chain, and the chain has not moved. [THR-1486](https://linear.app/threadbare/issue/THR-1486), [THR-1487](https://linear.app/threadbare/issue/THR-1487), [THR-1488](https://linear.app/threadbare/issue/THR-1488), [THR-1489](https://linear.app/threadbare/issue/THR-1489) are blocked by THR-1481 slice 1 ([THR-1485](https://linear.app/threadbare/issue/THR-1485)); [THR-1491](https://linear.app/threadbare/issue/THR-1491) and [THR-1492](https://linear.app/threadbare/issue/THR-1492) by router slice 1 ([THR-1490](https://linear.app/threadbare/issue/THR-1490)) — and THR-1491 additionally by THR-1481 slice 1. **Both slice 1s are `Ready for Dev`, not `Done`**, so every one is an unmet blocker. This is the healthy steady state of a sliced program, not a stall: the two first slices are on the shelf waiting for the executor, and six followers unblock behind them.

**Fifteen are unchanged from [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t1--unblock-sweep) and [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12b.md#t1--unblock-sweep)** — nine needing a design session, three held by a dependency, one parked on a director decision, one assigned to Christian, plus the two program epics. Every one was re-read in this run's scan and no evidence moved. Not restated; re-listing them hourly is the dump this lane forbids.

## T1.5 — wayfinder sweep

**Three open maps. Frontier: 8 tickets, every one HITL. AFK tickets resolved: 0 — the pool is empty, not capped.**

Re-verified this run rather than inherited from run b: a `wayfinder:research` label sweep across the whole team returns **21 tickets and every one is `Done`**. The 15 open wayfinder issues in this run's own `Todo` scan carry only `wayfinder:map`, `wayfinder:grilling` or `wayfinder:prototype`. `ORCH_WAYFINDER_AFK_MAX` (2) was not approached.

Unchanged in every particular: Physical Conflict 7 frontier / 3 blocked behind the two fight-loop prototypes; Item Generator 1 frontier ([THR-1236](https://linear.app/threadbare/issue/THR-1236)); Powers & Spellcraft 0 frontier ([THR-1232](https://linear.app/threadbare/issue/THR-1232) assigned to Christian, off the frontier by the assignee rule). Physical Conflict's frontier has now stood unchanged for **17 days**. Surfaced, not escalated — HITL waiting on a human is not a defect.

The terminal state runs a and b recorded still holds: **the wayfinder tier has no agent-resolvable work anywhere on the board.** Read a repeated "no AFK work" line as this known state, not as a detector that stopped finding things.

## T2 — design authoring

**Not triggered.** 14 non-`Deferral` items in `Ready for Dev` against `ORCH_PROGRAM_WORK_FLOOR` (2). The build shelf is not thin.

The `In Design` bound is moot while the tier is barred, and no read of that column was performed this run — T3 is skipped (below) and its standing sub-duty is where that measurement belongs. Run b's reading (2 live against a bound of 1, neither staged by this lane) is the last measurement on record and is **not** restated here as current.

## T3 — architecture health

**Skipped — already run today.** [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t3--architecture-health) executed the full sweep at ~08:29Z, past `ORCH_HEALTH_SWEEP_HOUR` (6), and its results stand: 7 LEAKED contracts unchanged by name, canon staleness 30 (the +1 resolved to a six-hour-old retro edit, not decay), `sweep:rank-reach` `PASS`, `check:process` `passed-with-gaps`, zero stalled-pickup issues.

**No detector was run this hour and none is reported as clean on this run's authority.** Specifically not run: `generate-interface-map:dry`, `sweep:rank-reach`, `check:process`, `check:canon-staleness`. `__DEBUG.validateTraitRefs()` remains browser-only and unrunnable headless — not run, not reported clean.

**Redundancy: not assessed this sweep.** No judgement pass over `interface-map.md` / `systems-inventory.md` was performed this run and no coverage is claimed for it.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

**Precheck:** `rg=no` `git=yes` `test=1.30s` `nm=session:healthy` `linear=nokey` `freshness=current`. `nokey` is the documented normal state on this machine and gates nothing — the board was read and written successfully throughout this run, which is the confirming board read the signal asks for.

### Product vs process — the week

One product promotion, nothing filed, no process ticket. The trailing-week ratio is materially unmoved at roughly **31 product / 7 process (~82% product)**; the process-ticket budget (at most one per three runs) remains untouched. The coordination hazard repaired this run was fixed **in place, as two comments**, rather than filed as process work — it is a line in a coordination block, which is this lane's own output, not a defect in the delivery machine needing a ticket.

**Headline: the queue is working as designed, and the only thing this run had to repair was a handoff between two runs of this lane.** The morning's design burst is converting: two slice-1 tickets on the shelf, six followers correctly blocked behind them, and a bug filed by the director twenty minutes ago already queued with its fork instruction intact. The one real risk on the board — two `High` tickets rewriting the same routing without naming each other — is now recorded on both, and the process gap that let it through (a ceiling deferral whose follow-up was addressed to the report instead of the ticket) is named above for the next run to avoid.

## Escalations

None raised. Nothing was parked, no question was posted to Discord, and agreed work is not exhausted.
