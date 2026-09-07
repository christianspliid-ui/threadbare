---
lane: tb-orchestrator
run: 2026-09-07b
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-07 (run b, ~01:26–01:35Z)

**Nothing was promoted this run, and the reason is good news: the queue is moving.** [THR-1425](https://linear.app/threadbare/issue/THR-1425/five-more-player-facing-surfaces-render-a-raw-tick-count-the-elapsed) — promoted by [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07.md) an hour ago — was claimed by the executor at 01:25Z and is in flight. Three items remain queued behind it.

**The find this run is not a promotion.** A ticket that has been stuck since 2026-09-04 became unstuck at 23:28Z last night, and it is the one kind of work this lane cannot hand to a robot.

## Needs Christian

**The pixel sweep is unblocked. It is roughly twenty minutes and it needs you, because it needs a dev server.**

[THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) is the batch of screenshot checks the unattended lanes cannot do — they are not allowed to start a dev server, so every UI change that ships headlessly parks its "does this actually look right at full screen" check here. You ran six of its nine passes with me on 2026-09-04. **Three were impossible that day**, not because of the sweep but because the game had no way to reach the surfaces:

- **the companions row** — nothing could put a companion on a mortal
- **the premonition screen** — none appeared in about 280 ticks of trying
- **the character sheet's faction row** — every faction-carrying character read as a stranger, and the switch meant to reveal them did nothing

**All three of those holes are now filled**, the last one two hours before this run. There is now a lever that mints a companion, a lever that forces a premonition on demand, and the reveal switch was found to be genuinely broken and is fixed. I checked these are really in the shipped game rather than trusting the tickets that claim them.

Two more captures ride along: the debug panel's tab strip was rebuilt so its 43 tabs wrap and scroll instead of running off the edge — **that fix shipped without anyone ever seeing it at full size**, so it is guesswork until someone looks — and the faction heraldry comparison from [THR-854](https://linear.app/threadbare/issue/THR-854/three-faction-pairs-render-byte-identical-heraldry-asserting-a-kinship), which needs the same faction sheet the third pass unblocks.

**There is no decision in this for you — it is a session, not a question.** Say the word and we open the game at 1920×1080 and walk the five surfaces. The ticket carries exactly what to look at on each.

→ [THR-1133 — attended pixel-pass sweep](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

---

**One amendment to the question already on your desk — not a new question.** [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07.md) asked whether two stray percentages should simply be dropped. Since then a second ticket landed, [THR-1426](https://linear.app/threadbare/issue/THR-1426/tick-timestamps-and-per-tick-rates-are-the-two-tick-shapes-with-no), covering two more shapes with the same problem — timestamps like *t42*, and rates like *regen 1.5 per tick*.

**So the one answer now settles ten readouts instead of two.** That makes it worth more, not more urgent: it is the same fork, and the same recommendation stands — drop them rather than invent a new vocabulary. The rate half may not even need you; there is already a precedent for banding rates into words ([THR-1008](https://linear.app/threadbare/issue/THR-1008/threadspanel-leaks-raw-magnitudes-a-percentage-and-a-debug-meta-strip) did it for the sustain row), so if you say *drop the percentages*, I will apply the existing pattern to the rates and only bring back the timestamps, which genuinely have no precedent.

**Your other standing asks are unchanged and deliberately not restated** — the encounter batch, the design slot, and the ~15 map questions are as [run d](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-06d.md) left them.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Declined: 7 (6 standing, 1 new). Held: 0 — the ceiling never engaged.**

Board at scan: **54 `Todo`** (50 + 4), **3 `Ready for Dev`** (all non-`Deferral`), **3 `In Dev`** (1 live, 2 `Parked`). Todo count is flat against run a, which is arithmetic rather than stagnation: THR-1425 left for `In Dev`, THR-1426 arrived.

### Nothing promoted, and the one candidate that changed state is deliberately not a promotion

**[THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) is newly unblocked and is still the wrong thing to promote.** Its three native blockers are all `Done`:

| Blocker | Done | What it unblocks |
|---|---|---|
| [THR-1413](https://linear.app/threadbare/issue/THR-1413/no-route-puts-a-companion-on-a-mortal-from-the-browser-and-a-companion) | 2026-09-04T12:32:59Z | pass 1, companions row |
| [THR-1414](https://linear.app/threadbare/issue/THR-1414/no-premonition-surfaced-in-280-ticks-across-four-seeded-runs-verify) | 2026-09-04T13:35:01Z | pass 5, premonition header |
| [THR-1412](https://linear.app/threadbare/issue/THR-1412/debug-tooling-dead-ends-found-by-the-pixel-sweep-37-of-43-debug-panel) | **2026-09-06T23:28:08Z** | passes 6 and 7(a) |

**Verified against `origin/main`, not inferred from ticket state** (the levers are the whole claim, so ticket state is not evidence):

```
src/debug-bridge.d.ts:1052   forcePremonition(...): Promise<ForcePremonitionResult>;   ← THR-1414
src/debug-bridge.d.ts:1105   spawnCompanion(agentQuery, templateQuery, options?)        ← THR-1413
src/debug-bridge.d.ts:1097   "...an ascendant companion renders on AscendantSheet"      ← pass 1's exact gap
src/debug-bridge.ts:1066     toggleOmniscience / setOmniscience                         ← THR-1412 fault 3
```

THR-1412's closeout states the acceptance in its own words: *"**THR-1133 passes 6 and 7(a) capturable from an attended session** — met; the levers now work."* It also names the residue this run is surfacing: its tab-strip fix shipped on a jsdom substitution, and *"jsdom performs no layout, so nothing here re-measures that Tallies is on-screen. The rect evidence remains your measurement in the ticket."*

**Not promoted, on the ticket's own instruction.** Its coordination block reads *"Requires an **attended** session; the hourly unattended lane cannot discharge it (`preview_start` is refused there). That refusal is an approval gate, not a fault: do not route around it."* Promoting it would put an unclaimable item at the top of the executor's queue — which is the exact disease THR-1133 was consolidated to cure (its body cites impediments #611 and #604, where four unclaimable items made the queue read `healthy` while the executor had nothing to take). Routed to Christian above instead.

### Declined (7)

**New this run:**

| Issue | Reason | Evidence |
|---|---|---|
| [THR-1426](https://linear.app/threadbare/issue/THR-1426/tick-timestamps-and-per-tick-rates-are-the-two-tick-shapes-with-no) | **Blocked on a creative ruling** | Its own closing line: *"it is still a *what should the game mean* fork, not an executor call."* Filed 01:14Z, `Deferral`/`Game Design`/`UI`, native `blockedBy: []` — so the field alone would have passed it. Folded into the standing THR-1424 ask above rather than raised as a second question. |

**Standing, unchanged from [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07.md) — evidence there, not re-derived here:** [THR-1424](https://linear.app/threadbare/issue/THR-1424/two-player-facing-percentages-have-no-sanctioned-reading-strengthpct) (creative ruling), [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) (approval gate), [THR-1287](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets) · [THR-1195](https://linear.app/threadbare/issue/THR-1195/hexsend-heralds-divine-herald-has-no-actortype-so-it-is-located-but) · [THR-1114](https://linear.app/threadbare/issue/THR-1114/two-action-templates-carry-a-sphereaffinity-that-is-not-a-sphere) (design first), [THR-1256](https://linear.app/threadbare/issue/THR-1256/flip-checkguidance-freshness-from-advisory-to-blocking-after-its-burn) (time gate — **window opens tomorrow**, 2026-09-08; the first run after 00:00Z may promote it).

### The satisfied-upstream backlog is now three days old

[THR-1301](https://linear.app/threadbare/issue/THR-1301/cut-the-unified-decision-board-over-to-live-blocked-on-undertaking) was assessed on 2026-09-04 as **having nothing left to implement** — its remaining Done-when shipped under [THR-1349](https://linear.app/threadbare/issue/THR-1349/the-decision-board-cutover-re-derive-the-census-gates-on-what-the) on 2026-09-02, verified at `d8861ca6`. Re-checked this run: still `Todo`, unchanged since that comment.

**It is not idle paperwork.** [THR-1303](https://linear.app/threadbare/issue/THR-1303/delete-control-upkeep-thr-1292-6-gated-on-a-post-cutover-decision-mix) carries `blockedBy: THR-1301` and its own gate is evaluable today — it is held shut **only by THR-1301's state field**. This lane may not set `Done` outside the wayfinder carve-out, deliberately, so the close is somebody else's and has not happened for three days. Logged for the retro rather than filed (process-work throttle); it is one click, well under the materiality bar, but the pattern — *work ships upstream, the ticket cannot be closed by any lane, a downstream ticket stays shut* — is now on its third instance and worth a rule rather than three more log rows.

## T1.5 — wayfinder sweep

**Four open maps. Zero AFK tickets resolved — correctly, none exist. No claims taken.** Unchanged from run a; re-verified rather than inherited.

**No `wayfinder:research` ticket is open anywhere on the board** — a label sweep returns 20, all `Done`. The two `wayfinder:task` tickets remain unavailable for the same reasons:

- **[THR-1403](https://linear.app/threadbare/issue/THR-1403/task-migrate-the-64-retire-the-four-flip-the-model-to-cells)** — natively blocked by THR-1402 (itself a HITL prototype).
- **[THR-1405](https://linear.app/threadbare/issue/THR-1405/task-join-the-catalogue-to-the-systems-inventory-owningsystem-values)** — frontier, unblocked, unassigned, and **deliberately parked**. Its AFK half was discharged 2026-09-03; its code half is [THR-1407](https://linear.app/threadbare/issue/THR-1407/every-owningsystem-resolves-to-a-registry-subsystem-name-recase-remap), still in `Ready for Dev` this run. Its stated exit condition — *"stays open as the map-side tracker until THR-1407 lands"* — has not been met, so the park stands.

The ~15 HITL questions across [Undertakings](https://linear.app/threadbare/issue/THR-1396/undertakings-across-the-living-simulation-wayfinder-map), [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict), [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) and [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) are the standing set already in the briefing. Nothing new from the maps.

## T2 — design staging

**Not triggered.** Non-`Deferral` items in `Ready for Dev`: **3** ([THR-1407](https://linear.app/threadbare/issue/THR-1407/every-owningsystem-resolves-to-a-registry-subsystem-name-recase-remap), [THR-1415](https://linear.app/threadbare/issue/THR-1415/vite-dev-server-watches-claudeworktrees-every-lane-worktree-created-or), [THR-1422](https://linear.app/threadbare/issue/THR-1422/six-constants-are-defined-twice-with-no-shared-source-sea-level)) against a floor of 2. `In Design` bound not consulted — the trigger did not fire, so the tier did not run.

## T3 — architecture health

**Did not run, and nothing from it is reported.** The daily sweep gates on the first run after **06:00 local**; this run is **03:29 local** (RDT, UTC+2).

**No detector was executed** — `generate-interface-map:dry`, `sweep:rank-reach`, `check:process` and `check:canon-staleness` were all skipped and **none is being reported as clean**. Redundancy: **not assessed this sweep**. Today is Monday (`ORCH_TESTHEALTH_DOW`), so the first post-06:00 run owes the **weekly test-suite health pass** on top of the daily detectors.

**One observation available without a detector,** from the `In Dev` slice read for the promotion check: **3 `In Dev`, 1 live** ([THR-1425](https://linear.app/threadbare/issue/THR-1425/five-more-player-facing-surfaces-render-a-raw-tick-count-the-elapsed), claimed 01:25Z) **and 2 `Parked`** (THR-1392, THR-1130, both unassigned). WIP=1 respected. No issue showed 3+ `Ready for Dev → In Dev` transitions.

### Product vs process — the week

Unchanged from run a and not re-measured (the window has moved by one hour): roughly **20 product / 6 process, ~77% product**. The product pipeline is supplying itself. **No process ticket was promoted this run and none needed to be.**

## Escalations

**Nothing asked, nothing parked.** Discord was not contacted — agreed work is not exhausted (three items queued, one in flight), so the stop-and-ask condition did not arise.

**Logged for the retro rather than filed as tickets,** per the process-work throttle:

> **1. Satisfied-upstream tickets have no closer, and it now has a downstream cost.** Third instance in four days (THR-1301, THR-1380, and one before). THR-1301's work shipped 2026-09-02; the ticket is still `Todo` and is the sole thing holding THR-1303 shut. No lane may close on inference — correctly — but that means the only exit is a human click nobody is prompted to make. Worth the retro deciding whether the executor's closeout should close a ticket it has demonstrably subsumed, or whether these should surface in the briefing as a batch.
>
> **2. The unattended lanes' pixel debt has a collection problem, not an accrual problem.** THR-1412 shipped on `Browser-verify substitution: jsdom-render` — impediment **#546, 21st occurrence**. The substitution is working as designed and the debt correctly lands in THR-1133. What has no mechanism is *noticing when that debt becomes collectable*: THR-1133's last blocker cleared at 23:28Z and nothing surfaced it until this run's sweep read the relation states by hand. Run a did not catch it. Cheap to fix if T1 checks native `blockedBy` states on attended-only tickets as a standing pass, which is what this run did ad hoc.
