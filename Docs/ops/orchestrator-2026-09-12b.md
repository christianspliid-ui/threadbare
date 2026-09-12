---
lane: tb-orchestrator
run: 2026-09-12b
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-12 (run b, ~10:29Z)

## Needs Christian

**Nothing new is asked of you.** The eight questions from this morning are still the only things waiting on you, unchanged.

**What happened since the morning note: your content direction from this morning's chat is now buildable.** You said you wanted any content to be able to hand out any other content by the same rule — an entropy-themed encounter drawing a random `#weapon #entropy` reward — and that everything should open the same card from wherever it is named. Both have been designed, written up, and cut into eight buildable pieces. **The first piece is now in the build queue and will be picked up by the next executor run.** Nothing about that needs your input; it is your ruling being carried out.

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

Shelf at scan: **17** in `Ready for Dev`, **13** of them non-`Deferral`. Above the 15-item backed-up threshold, so the ceiling narrowed this run to **at most one promotion — and this time it bound**, on a real candidate rather than an empty set.

**36 `Todo` candidates read**, up from 28 at run a. The increase is entirely the eight execution slices an attended session filed between 10:24Z and 10:27Z under the two design tickets it opened at 10:06Z: [THR-1481](https://linear.app/threadbare/issue/THR-1481) (content model) → slices THR-1485…THR-1489, and [THR-1482](https://linear.app/threadbare/issue/THR-1482) (one card, one router) → slices THR-1490…THR-1492. 15 carry a `wayfinder:*` label and were skipped unconditionally to T1.5.

### Promoted — 1

**[THR-1485](https://linear.app/threadbare/issue/THR-1485) — Content model slice 1: the content-object registry, its generator and contract test, the canon page, UL terms and CLI `content`.**

| Check | Result |
|---|---|
| Named gate | *"becomes Ready for Dev once the plan doc is live on `main`"* — its own coordination comment, 10:27:43Z |
| Plan-doc liveness | `LIVE Docs/plans/2026-09-12-thr-1481-content-model.md resolves on origin/main` (merged in [PR #1913](https://github.com/christianspliid-ui/threadbare/pull/1913)) |
| Native `blockedBy` | empty |
| Latest comment | the coordination block; **no retire verdict** (THR-990 check performed, passed) |
| Write verified | `get_issue` re-query: `status: Ready for Dev`, `stateHistory` shows `Todo → Ready for Dev` at 10:28:55.956Z, **no `assignee` key present** |
| Coordination block | [posted 10:29:17Z](https://linear.app/threadbare/issue/THR-1485) as the latest comment — all three lines present, so `pull-work` Step 3 will not bounce it |

No priority was set and no assignee was set; the promotion is a state transition only.

**This is the first T1 promotion in some days, and it is worth naming why it was possible.** Every recent run's decline list was undesigned work needing a design session. This candidate was *designed this morning*, sliced by the same session, and shipped with its plan doc already merged and its coordination block already written. The gate it named for itself was mechanical and this lane could check it. That is the shape T1 is built for.

### Held by the ceiling — 1, named with its evidence

**[THR-1490](https://linear.app/threadbare/issue/THR-1490) — One card, one router slice 1.** Equally promotable: plan doc `Docs/plans/2026-09-12-thr-1482-one-card-one-router.md` returns `LIVE` on `origin/main`, native `blockedBy` empty, coordination block posted 10:28:03Z naming the same *"live on `main`"* gate, latest comment carries no retire verdict. **Held solely by the backed-up-shelf ceiling** (17 > 15 → one promotion per run), not by any property of the ticket.

THR-1485 was chosen over it on file-set disjointness: THR-1485 touches `content-objects.ts`, its generator, canon and UL, and collides with nothing currently on the shelf. THR-1490 mounts a modal stack in `GameView`, rewrites three routers as adapters, and amends UI Law 21.

**Two things whoever promotes THR-1490 should carry into its promotion comment:**

1. **Its parent's description already calls it `Ready for Dev` while the board says `Todo`.** [THR-1482](https://linear.app/threadbare/issue/THR-1482)'s body reads *"THR-1490 (Ready for Dev)"*. The attended session was writing to the board throughout this run (10:06Z → 10:29:41Z) and may promote it itself within the hour — re-read before acting rather than assuming this run's reading still holds. If it has not, the next run promotes it; the ceiling defers it, it does not drop it.
2. **A mutex THR-1490's own block does not yet name: [THR-1477](https://linear.app/threadbare/issue/THR-1477)**, on the shelf at `High`, *"Clicking the agent's name on the encounter does nothing visible — route it to the character sheet"*. THR-1490 replaces exactly that routing — its scope item 5 rewrites `EncounterVeil.openEntity` and `toNavigationTarget` into adapters of one ref router. If the executor claims THR-1477 first, its patch is rewritten by THR-1490; if THR-1490 lands first, THR-1477 may be satisfied by construction. The block names the *files* (`EncounterVeil.tsx`, `useNotificationNavigation.ts`) but not the ticket, and a file-level mutex only fires for a session that already knows to look. **Add `Mutex with: THR-1477 (both rewrite the encounter's entity-open routing)` when promoting.** Not filed as its own ticket — it is a line in a coordination block, not process work, and the weekly retro is the promotion point for the latter.

### Declined — 13, unchanged from run a

Every decline from [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t1--unblock-sweep) was re-read in this run's scan and every one still holds; no evidence moved. Nine need a design session, three are held by a dependency, one is parked on a director decision, one is assigned to Christian. The list is not restated here — re-listing thirteen unchanged declines hourly is the dump this lane forbids.

One is worth a line because a promoted ticket touches it: **[THR-1024](https://linear.app/threadbare/issue/THR-1024)** stays declined on *"do not start this before THR-966"*, and [THR-966](https://linear.app/threadbare/issue/THR-966) is still open — but THR-1490 now **resolves THR-966 as mount** and its coordination block says *"do not pick THR-966 up separately"*. So THR-1024's blocker is scheduled to clear as a side effect of a ticket this run held back. Recorded so a future run reads the chain rather than re-deriving it.

**The composition has changed from every recent run, and that is the finding.** The `Todo` column is no longer only undesigned work: it now holds eight fully-specified execution slices with merged plan docs and pre-written coordination blocks, six of them blocked only by their own chain. The design constraint this lane has reported for days was relieved this morning by an attended session, in one sitting, for two programs at once.

## T1.5 — wayfinder sweep

**Three open maps. Frontier: 8 tickets, every one HITL. AFK tickets resolved: 0 — the pool is empty, not capped.**

Re-verified rather than inherited: a label sweep across the whole team returns **21 `wayfinder:research` tickets and every one is `Done`**, and this run's own `Todo` scan shows the 15 open wayfinder issues carry only `wayfinder:map`, `wayfinder:grilling` or `wayfinder:prototype` labels. `ORCH_WAYFINDER_AFK_MAX` (2) was not approached.

Unchanged from run a in every particular: Physical Conflict 7 frontier / 3 blocked behind the two fight-loop prototypes; Item Generator 1 frontier (THR-1236); Powers & Spellcraft 0 frontier (THR-1232 assigned to Christian, off the frontier by the assignee rule). Physical Conflict's frontier has now stood unchanged for **17 days**. Surfaced, not escalated — HITL waiting on a human is not a defect.

The terminal state run a recorded still holds: **the wayfinder tier has no agent-resolvable work anywhere on the board.** A future run should read a repeated "no AFK work" line as this known state, not as a detector that stopped finding things.

## T2 — design authoring

**Not triggered.** 13 non-`Deferral` items in `Ready for Dev` against `ORCH_PROGRAM_WORK_FLOOR` (2). The build shelf is not thin.

The bound is moot this run but its state is worth recording, because it moved during the run: `In Design` held THR-1481 and THR-1482 at the start of this sweep and **both advanced to `Implementation Planning`** at 10:28:58Z and 10:29:00Z respectively — seconds after this lane's promotion, and consistent with it (THR-1481's body was updated in the same breath to read *"THR-1485 is Ready for Dev"*). `In Design` now holds [THR-1479](https://linear.app/threadbare/issue/THR-1479) and [THR-1448](https://linear.app/threadbare/issue/THR-1448), both unassigned, both created within the last two days, both far inside `ORCH_IN_DESIGN_STALE_DAYS` (7): **2 live against a bound of 1** — over, but not by this lane's hand, and the predicate is warn-only. No state was mutated.

**One measurement caveat, recorded rather than treated as a finding.** `list_issues(state:"In Design")` at 10:29:41Z returned only THR-1479 and THR-1448, omitting THR-1481 which `get_issue` had reported as `In Design` fourteen minutes earlier. Both reads were correct for their instant — the issue moved between them — but the discrepancy is also the shape of the known `list_issues` stale-status trap. The `get_issue` reads are what this report's counts are built on.

## T3 — architecture health

**Skipped — already run today.** [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t3--architecture-health) executed the full sweep at ~10:29 local (08:29Z), past `ORCH_HEALTH_SWEEP_HOUR` (6), and its results stand: 7 LEAKED contracts unchanged, canon staleness 30 (the +1 resolved to a six-hour-old retro edit, not decay), `sweep:rank-reach` PASS, `check:process` passed-with-gaps. Zero stalled-pickup issues. No detector was re-run this hour and **none is reported as clean on this run's authority.**

`__DEBUG.validateTraitRefs()` remains browser-only and unrunnable headless — not run, not reported clean.

**Redundancy: not assessed this sweep.** No judgement pass over `interface-map.md` / `systems-inventory.md` was performed this run and no coverage is claimed for it.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

**Precheck:** `rg=no` `git=no` `test=1.37s` `nm=session:healthy` `linear=nokey` `freshness=behind:2`. `nokey` is the documented normal state on this machine and gates nothing — the board was read and written successfully throughout. `freshness=behind:2` is the home tree's autosync mirror trailing `main` by two commits; this lane does no code work and publishes by git plumbing, so it gates nothing here either.

### Product vs process — the week

One promotion, nothing filed, no process ticket. The trailing-week ratio is materially unmoved at roughly **30 product / 7 process (~81% product)**; the process-ticket budget (at most one per three runs) remains untouched, and the one coordination hazard this run surfaced (the THR-1490 ↔ THR-1477 overlap) was deliberately written into this report rather than filed as a ticket.

**Headline: the design constraint broke this morning, and the queue is now the healthiest it has been this week.** For days this lane reported that neither building nor verification was the bottleneck — design was, single-threaded, with nine `Todo` items waiting on a desk that already had two. An attended session cleared two whole programs in one sitting: two designs, two merged plan docs, eight specified slices, every one with its coordination block pre-written. The build shelf holds 13 non-`Deferral` items, the executor slot is free, and for the first time in days the top of the `Todo` column is work a developer can pick up rather than work a designer must still think about.

## Escalations

None raised. Nothing was parked, no question was posted to Discord, and agreed work is not exhausted — THR-1490 is a ceiling deferral with a named next step, not an exhausted queue.
