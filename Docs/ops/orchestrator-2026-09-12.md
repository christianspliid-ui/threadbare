---
lane: tb-orchestrator
run: 2026-09-12
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-09-12 (run a, ~08:29Z)

## Needs Christian

**Nothing new is asked of you while the sitting is running.** You are four batches into the five-encounter play-through and every batch has landed as a ticket — six so far today. No verdict yet, and none is being chased.

**One thing is queued behind it, so you know what "next" looks like.** Three of the big design efforts — **fights**, **items**, and **powers & spellcraft** — have run out of work that can be done without you. Every piece of homework on all three has been finished: twenty-one research questions answered, every one of them closed. What is left is **eight questions that only you can answer**, and until they are answered nothing further can be built on any of the three.

Seven of the eight are about fighting, and they are genuinely the game-shaping ones — what a fight feels like blow by blow, what a monster *is* as a thing in the world, whether losing means dying or yielding or being spared, what winning leaves in your hands, when a fight starts on its own, and whether a whole company can fight together or only one person steps forward:

- [NPC-mode fight loop — the stat block and test skeleton](https://linear.app/threadbare/issue/THR-1263)
- [Agent-mode fight loop — opposed band-pairs](https://linear.app/threadbare/issue/THR-1264)
- [Monster opponents — just enough monster](https://linear.app/threadbare/issue/THR-1268)
- [Defeat wears many faces — the outcome spectrum](https://linear.app/threadbare/issue/THR-1266)
- [Victory yields — what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270)
- [Systemic triggers v1 — walking into the lair, grudges boiling over](https://linear.app/threadbare/issue/THR-1267)
- [Companies in fights?](https://linear.app/threadbare/issue/THR-1271)

The eighth is the item generator: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236) — a throwaway sketch built for you to say *cool* or *not cool* to. (The matching [twenty generated spells](https://linear.app/threadbare/issue/THR-1232) is already assigned to you.)

When the sitting is finished, open a chat and say **"work the map"** and these get worked one at a time.

## T1 — unblock sweep

Shelf at scan: **19** in `Ready for Dev`, **15** of them non-`Deferral`. Above the 15-item backed-up threshold, so the ceiling narrowed this run to at most one promotion — **it never bound, because nothing was promotable.** No candidate was held back by the cap; the held-back list is empty and that is a measurement, not an omission.

**28 `Todo` candidates read.** 15 carry a `wayfinder:*` label and were skipped unconditionally to T1.5. **13 were judged here.**

### Promoted — 0

### Declined — 13, and the composition is the finding

| Issue | Reason | Evidence |
|---|---|---|
| [THR-1220](https://linear.app/threadbare/issue/THR-1220) | Wrong destination | *"attended chat only. Never promote to Ready for Dev; this is not executor work."* Live with Christian right now — four feedback batches today, checkpoint still open |
| [THR-1156](https://linear.app/threadbare/issue/THR-1156) | Wrong destination | Program epic: *"no execution ticket files directly against it"*; its own body recommends a wayfinder map, which only Christian may charter |
| [THR-789](https://linear.app/threadbare/issue/THR-789) | Wrong destination | Program epic: *"Each wave runs design finalization before Ready for Dev"* |
| [THR-790](https://linear.app/threadbare/issue/THR-790) | Wrong destination | *"Needs its own design finalization before Ready for Dev."* Returned `In Design → Todo` 2026-09-11T06:14:43Z |
| [THR-1274](https://linear.app/threadbare/issue/THR-1274) | Wrong destination | *"This is a design ticket, not a patch: a non-human cast primitive needs its shape decided… before code"* |
| [THR-1348](https://linear.app/threadbare/issue/THR-1348) | Wrong destination | *"The design question — this is the fork, and it is not the executor's to settle."* Three readings, *"genuinely different games"* |
| [THR-1393](https://linear.app/threadbare/issue/THR-1393) | Wrong destination | The `knows_of` schema change it needs is *"a design decision, not an executor's call"* |
| [THR-1381](https://linear.app/threadbare/issue/THR-1381) | Wrong destination | *"Design-session work, not execution — no code is owed by this ticket"* |
| [THR-870](https://linear.app/threadbare/issue/THR-870) | Wrong destination | *"parked by creative-director sequencing"* — activates only when Christian moves the Sphere-Governed Ascendant project out of Idea |
| [THR-1024](https://linear.app/threadbare/issue/THR-1024) | **Unmet blocker** | *"do not start this before THR-966"* — [THR-966](https://linear.app/threadbare/issue/THR-966) is `Idea`, not `Done` |
| [THR-1218](https://linear.app/threadbare/issue/THR-1218) | **Unmet blocker** + wrong destination | Blocked on [THR-1043](https://linear.app/threadbare/issue/THR-1043) raising encounter density; and *"Not Ready for Dev — needs a design pass when unblocked"* |
| [THR-175](https://linear.app/threadbare/issue/THR-175) | **Unmet trigger** | Neither trigger has fired (creation-sphere content shipping; a template needing `sphere` independent of `reach`). Also *"write a full design doc before coding"* |
| [THR-791](https://linear.app/threadbare/issue/THR-791) | Skipped — assigned | Assignee: Christian Spliid |

**Only 3 of 13 were held by a dependency. Nine were held because they need a design session, not a developer** — and the tenth is parked on a director decision. This is the same constraint every recent run has named, but this run can quantify it from its own scan: the `Todo` column is not a queue of blocked work waiting for its blockers, it is a queue of undesigned work waiting for a desk that already has two items on it.

## T1.5 — wayfinder sweep

**Three open maps. Frontier: 8 tickets, every one HITL. AFK tickets resolved: 0 — because none exist to resolve.**

| Map | Open children | Frontier (open, unblocked, unclaimed) | Blocked behind the frontier |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) | 10 | **7** — THR-1263, THR-1264, THR-1266, THR-1267, THR-1268, THR-1270, THR-1271 | 3 — THR-1265, THR-1269, THR-1272, all behind the two fight-loop prototypes |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227) | 1 | **1** — THR-1236 (all four blockers `Done`) | 0 |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) | 1 | **0** — THR-1232 is assigned to Christian, so it is off the frontier by the assignee rule rather than absent | 0 |

**The AFK burn-down is finished, workspace-wide.** A label sweep across the whole team returns **21 `wayfinder:research` and 5 `wayfinder:task` tickets, and every single one is `Done`.** `ORCH_WAYFINDER_AFK_MAX` (2) was not approached because the pool is empty, not because the cap bound.

This is **finding 1**, and it is a state this lane has not previously been in: the wayfinder tier has no remaining agent-resolvable work anywhere on the board. Every open map is 100% blocked on Christian. The tier will keep reporting "no AFK work" every run until he works a map or charts a new one — recorded here so a future run reads that as a known terminal state rather than a detector that stopped finding things.

Physical Conflict's frontier has also stood unchanged since the map was charted **2026-08-26 — 17 days**. Its four research tickets all closed in that window and the seven questions behind them have been answerable since. Surfaced, per the tier's rule; not escalated, because HITL waiting on a human is not a defect.

## T2 — design authoring

**Not triggered.** 15 non-`Deferral` items in `Ready for Dev`, against `ORCH_PROGRAM_WORK_FLOOR` (2). The build shelf is not thin; the reverse.

Recorded because it matters for the T1 finding above: T2 is the tier that would stage the nine undesigned `Todo` items, and it is correctly barred by a *healthy build shelf*. The two states are not in tension — there is plenty to build and plenty to design, and only the designing is single-threaded.

`In Design` already holds **2 live** against `ORCH_MAX_IN_DESIGN` (1), so the tier would have been bound twice over. Neither item was staged by this lane; both were created by attended sessions today and yesterday.

## T3 — architecture health

**Due and run in full.** Local hour at scan **10:29**, past `ORCH_HEALTH_SWEEP_HOUR` (6); no orchestrator report exists on `origin/ops` for 2026-09-12, so this is the day's first sweep. Baseline for the diff is [run b of 2026-09-11](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-11b.md#t3--architecture-health), the last sweep that executed detectors.

| Detector | Result | vs. 2026-09-11b |
|---|---|---|
| `generate-interface-map:dry` | **7 LEAKED**, each carrying a remediation ticket | **Unchanged** — the same seven, by name |
| `check:canon-staleness` | **30 warnings** | **29 → 30** (+1) — composition resolved below |
| `sweep:rank-reach` | **`PASS`** — 60 gated templates reachable, 0 blocked, 0 unowned | Verdict unchanged; apex holders at tick 900 **13 → 13** |
| `check:process` | **`passed-with-gaps`** — 1 warning, 3 sub-checks dark | **Unchanged** |

The seven LEAKED contracts are the same seven: `attachment-activated-effects` (THR-720) · `attachment-edge-modifiers` (THR-997) · `branch-decision-writes-archetype-drift` (THR-883) · `compulsion-card-plants-agent-decision-bias` (THR-883) · `nudge-card-cost-channels-detection-and-doom` (THR-883) · `trait-ref-authoring-vocabulary` (THR-800) · `undertow-card-drifts-mortal-values` (THR-1130).

**`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. Not run, and not reported as clean.**

**`check:process`'s three dark sub-checks are the same three:** `[WARN] linear-auth global LINEAR_API_KEY is unset; skipped Linear-backed checks (recent plan references, orphan issues, Ready-for-Dev handoff keywords)`, exit 0. This session's precheck independently reported `linear=nokey` from the same root. Not new.

**Redundancy: not assessed this sweep.** Run b did the judgement pass yesterday and its result stands; this run performed no new pass over `interface-map.md` / `systems-inventory.md` and claims no coverage for it.

### Finding 2 (new) — the stalled-pickup detector is clean for the first time

[THR-1130](https://linear.app/threadbare/issue/THR-1130) reached **`Done` at 2026-09-11T09:36:51Z**. It was the sole issue this detector has ever flagged — six `Ready for Dev → In Dev` cycles against `ORCH_STALLED_PICKUP_THRESHOLD` (3), and the subject of run b's Finding 2, where the repeated release-and-restore of a `Parked` label was poisoning the signal.

It did not stall out. It **completed**, through the factory line, three batches deep. Run g's reading — that the later cycles were the park discharging rather than thrash recurring — is now settled by the outcome rather than inferred from timing.

**Stalled work this sweep: zero.** Recorded explicitly, because a detector that has flagged exactly one issue for a month and now flags none is indistinguishable, in a report, from a detector that silently stopped running. It ran; the board is clean.

The seventh LEAKED contract still names THR-1130 as its remediation ticket, and that ticket is now closed. Not filed — a closed remediation reference on a LEAKED row is bookkeeping for the interface map's own gate to catch, and the weekly retro is the promotion point for process work (Christian's direction 2026-08-10). Logged here as its quotable evidence.

### The canon +1, resolved to its cause rather than left as a scalar

Run b enumerated its 29 rows precisely so this diff could be composition rather than a number. Today's 30, by page:

`attachments` ×1 · `consumption-ledger.generated` ×1† · `cosmology` ×2 · `design-governance` ×2 · `encounters` ×6 · `engine` ×1 · `interface-map.generated` ×1† · `interface-map` ×1 · **`process` ×3** · `prose` ×3 · `rulebook` ×1 · `setting-coverage.generated` ×1† · `systems-inventory` ×1† · `undertaking-grid.generated` ×1† · `undertakings` ×2 · `verification-gates` ×1 · `world-objects.generated` ×1† · `world-objects` ×1†

† = `missing last_reviewed`, structurally unclearable (7 of 30).

**Every page is identical to yesterday except `process`, which went 2 → 3.** The new row is `Docs/canon/process.md` stale vs `Docs/plans/2026-04-13-linear-coordination-protocol.md`, whose mtime is **2026-09-12T06:12:06Z** — commit `0b59f4c0 docs(retro): weekly retrospective 2026-09-12`. The weekly retro edited the coordination protocol this morning; the canon page that points at it has not been re-reviewed since. That is the detector doing its job on a six-hour-old edit, not decay. **Not counted as a finding.**

### Standing sub-duties — measured from this run's own board reads

- **`In Design`: 2 live, 0 excluded** — [THR-1479](https://linear.app/threadbare/issue/THR-1479) (unassigned, created today 07:27Z) and [THR-1448](https://linear.app/threadbare/issue/THR-1448) (unassigned, touched today 07:23Z). Both far inside `ORCH_IN_DESIGN_STALE_DAYS` (7), neither carries `Parked`, so both count. **2 live against a bound of 1** — over, but not by this lane's hand: both were created by attended sessions. No state was mutated; the predicate is warn-only.
- **`In Dev`: 1** — [THR-1480](https://linear.app/threadbare/issue/THR-1480), assigned, claimed 08:02:47Z, already carrying PR #1911. The executor slot is occupied and moving.
- **Hand-created `In Dev` (never in `Ready for Dev`): none.** Measured, not assumed — THR-1480's `stateHistory` shows `Ready for Dev` 07:31:40Z → `In Dev` 08:02:47Z, a 31-minute claim gap. It passed through the queue properly.
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).
- **Precheck:** `rg=no` `git=yes` `test=1.50s` `nm=session:healthy` `linear=nokey` `freshness=current`. All nominal; `nokey` is the documented normal state on this machine and gates nothing.

### Product vs process — the week

This run promoted nothing and filed nothing, so the ratio is unmoved at roughly **30 product / 7 process (~81% product)** on the trailing week. The process-ticket budget (at most one per three runs) is untouched; two candidates surfaced in T3 above were deliberately routed to the retro rather than filed.

**Headline: neither building nor verification is the constraint — design is, and it is now the constraint in two separate places at once.** The build shelf holds 15 non-`Deferral` items and the executor is working one. Nine `Todo` items need a design session and the desk already has two. And the wayfinder tier — the mechanism that exists precisely to chew through big design efforts in parallel — has finished every question it can answer alone and is now entirely waiting on Christian, across three maps. That is not a failure of any lane; it is the shape of the board this morning, and it is not this lane's to fix.

## Escalations

None raised. Nothing was parked, no question was posted to Discord, and agreed work is not exhausted — the T1 decline list is thirteen items that each have a correct next step that is simply not "promote".
