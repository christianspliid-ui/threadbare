---
lane: tb-orchestrator
run: 2026-09-07o
promoted: 0
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-07 (run o, ~16:26–16:40Z)

**Nothing on the board needed this lane's hand this hour, so the run spent its budget on the half of T3 that both of today's earlier sweeps declined: the redundancy judgement pass.** It found one thing, and it is the kind no detector can find — the generated file that Engine-pillar design work is *required* to grep before drafting tells its reader, about one subsystem, to add a registry row that already exists. Detail under § T3.

The queue itself is healthy and moving without intervention: one live claim, three items behind it, fourteen completions in two days.

## Needs Christian

**No new asks. The same three from last hour are still open, and none has moved** — restated here because this is the newest report and the briefing reads its list from this section, so anything dropped here disappears from your brief.

### 1. The census ran. It needs one decision — [the two-seed census](https://linear.app/threadbare/issue/THR-1402/prototype-the-two-seed-census-on-the-cells-model-which-callings)

Top of your list all day, and it is now built, run and narrowed to a single question. Of the **42 kinds of work** a mortal could take up, **23 never fired**, and they split cleanly: **18 the world has not grown into** (no rings, no standing agreements, nothing of that kind for a mortal to act on yet) and **5 nobody wants** — lowering a trade road, seizing a settlement by force, destroying an army, destroying an item, destroying a place.

**Your call is on those five**: leave them live and wait for the world to want them, retire them, or widen who can reach them. The recommendation on the table is to **retire the five nobody wants and keep the eighteen** — a world that has not filled out yet is a different thing from work that should not exist. Answering this unblocks the flip of the whole model, which is the last step of this stretch.

### 2. Approve the encounter batch — [Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)

Unchanged. Saying *"Batch 2, run the six"* puts six encounters of content work on the build queue the same hour. Brief: [4 September](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md).

### 3. A yes or no on spending image credits — [regenerate five scene images](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)

Unchanged. Five Meet-The-First scene pictures carry defects — painted-in buttons, baked-in titles, individuated faces. Regenerating them spends image credits, which is the only reason it waits. Nothing is broken meanwhile; substitutes are standing in.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0 — the ceiling never engaged.**

Board at scan: **49 `Todo`**, **3 `Ready for Dev`**, **3 `In Dev`** of which **one is live** — [THR-1430](https://linear.app/threadbare/issue/THR-1430) claimed 16:01Z; [THR-1392](https://linear.app/threadbare/issue/THR-1392) and [THR-1130](https://linear.app/threadbare/issue/THR-1130) both carry `Parked`.

**Exactly one thing changed on the board since [run n](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07n.md) closed, and it unblocks nothing.** [THR-1431](https://linear.app/threadbare/issue/THR-1431) went `Done` at 15:48Z — three minutes after that report was written — and [THR-1430](https://linear.app/threadbare/issue/THR-1430) moved `Ready for Dev` → `In Dev` at 16:01Z, which is the shelf being consumed, not blocked work clearing. Checked rather than assumed: THR-1431's `blocks` relation is **empty**, so no candidate's dependency half moved this hour. The shelf reading 4 → 3 is the executor doing its job.

**No decline was re-derived this run.** Every candidate's evidence was verified within the last two hours by runs j–n and none of it could have moved on a single completion that blocks nothing. The standing set — [THR-1301](https://linear.app/threadbare/issue/THR-1301) (satisfied-upstream verdict), [THR-1256](https://linear.app/threadbare/issue/THR-1256) (time gate, opens **2026-09-08**, so the first run after midnight UTC promotes it), [THR-1222](https://linear.app/threadbare/issue/THR-1222) (human-approval gate), [THR-1393](https://linear.app/threadbare/issue/THR-1393) and [THR-1348](https://linear.app/threadbare/issue/THR-1348) (both wrong destination — design forks their bodies say are not the executor's to settle) — keeps its evidence in [run n](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07n.md).

**Wayfinder issues skipped unconditionally:** **18** of the 49 `Todo` items carry a `wayfinder:*` label. (Run n reported 17 on a 48-item board; recounted by label this run rather than carried forward, and the recount is the figure above.)

## T1.5 — wayfinder sweep

**Four open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2) — the queue is genuinely empty, not skipped.**

The [undertakings map](https://linear.app/threadbare/issue/THR-1396) frontier is unchanged from run n at **2**, and both are untouchable by this lane for different reasons:

| ticket | type | why this lane leaves it |
|---|---|---|
| [THR-1402](https://linear.app/threadbare/issue/THR-1402) two-seed census | `wayfinder:prototype` | HITL by label — and now **assigned to Christian**, so it is out of the frontier on two counts |
| [THR-1403](https://linear.app/threadbare/issue/THR-1403) migrate the 64, flip to cells | `wayfinder:task` (AFK-eligible) | native `blockedBy` re-read this run: still names THR-1402 |

THR-1403 is the one AFK-doable ticket on any open map, and it stays blocked until the census question above is answered. **The other three maps** — Physical Conflict, Powers & Spellcraft, Item Generator — are unchanged: every open child of each is `grilling` or `prototype`, i.e. a decision for Christian, not legwork.

**Map bodies not edited.** This lane appends to a map's Decisions-so-far only for tickets it resolved, and it resolved none.

## T2 — design staging

**Not triggered. Shelf holds 3 non-`Deferral` items against `ORCH_PROGRAM_WORK_FLOOR` of 2.**

All three are program work in *Thematic Pressure & Living World* ([THR-1432](https://linear.app/threadbare/issue/THR-1432), [THR-1433](https://linear.app/threadbare/issue/THR-1433), [THR-1434](https://linear.app/threadbare/issue/THR-1434)); none carries `Deferral`, so the count is the honest one the floor was written to measure.

**Worth flagging without acting on it:** the shelf has gone 4 → 3 in forty minutes against an hourly executor, and its only supplier this week has been attended authoring sessions off the wayfinder map. The floor is not breached and this lane does not stage on anticipation — but if the census question stays unanswered, the next two runs are the ones that will trip it.

## T3 — architecture health

**Detector sweep skipped — already run today, and no detector was re-run.** [Run e](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-07e.md) (04:27–04:50Z) ran all four unpiped, plus the Monday weekly test-suite pass ([`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md)). **Nothing below is a detector result, and no detector is reported clean.** `__DEBUG.validateTraitRefs()` is browser-only and was not run.

**Two standing sub-duties that today's sweeps had not covered were run this hour instead:**

**Hand-created `In Dev` tickets: swept, none found.** All three `In Dev` issues passed through `Ready for Dev` — verified on `stateHistory`, not inferred. THR-1430's history is the only interesting one and it is clean: `Todo → In Design → Implementation Planning → Ready for Dev → In Dev → Ready for Dev → In Dev`, the double bounce being a claim at 15:01Z released 39 seconds later and re-taken at 16:01Z. Two claims, not three — below `ORCH_STALLED_PICKUP_THRESHOLD`, so not stalled.

**`In Design`: 2 live, 0 excluded** — [THR-790](https://linear.app/threadbare/issue/THR-790) (assigned, 4d) and [THR-1002](https://linear.app/threadbare/issue/THR-1002) (unassigned, 4d). Both under `ORCH_IN_DESIGN_STALE_DAYS`, so both count, and the column is over `ORCH_MAX_IN_DESIGN` — which barred nothing this run, because T2 never triggered. Note against run e's Finding 1: THR-1002 measuring 4 days is the reset-by-warning loop that finding describes, not four days of real movement.

**Redundancy: assessed this run** — the first time today, and the source of the finding below.

### Finding (new) — the anti-duplication instrument tells its reader to duplicate a row that already exists

No detector can see this. It is not a leaked contract, not a reachability failure, and not stale canon; the artifact is byte-fresh and its gate is green. It is the file being *wrong about itself*, which only a judgement pass catches.

`Docs/canon/systems-inventory.md` is the required Step-0 load for Engine-pillar design work, and it exists (THR-658) to stop agents green-fielding a system that already exists — the THR-614 failure. It renders a **Companies & Group Travel** row whose `Tick phases` column reads `—`, while phase `2.34 Companies` sits in the file's *Unclassified tick phases* list, under a header that instructs the reader: *"a new system has landed without a registry row — add it to `SUBSYSTEMS`."* Followed on that phase, that adds a **second** row for a subsystem that already has one.

**Cause, proven rather than inferred:**

```
scripts/subsystems-registry.ts:199   phaseMatch: /\bgroups?\b/i
src/engine/orchestrator.ts:3235      // Phase 2.34: Companies (THR-74) — dissolution/leave, cohesion, …

node -e "console.log(/\bgroups?\b/i.test('Companies'))"   →  false
```

`generate-systems-inventory.ts:369` claims a phase when the row's regex tests true against the phase's **name or tags**. Neither `"Companies"` nor `THR-74` matches. The row's own alias list contains `companies`.

**The general shape, which is the part worth carrying.** That drift list is name-matched, so it reports *naming* mismatches as *registration* gaps. Of the 7 phases on it, ~5 belong to rows that already exist — this one proven; `2a.61` Choice Resolution → Encounters & Dilemmas, `6.637` Unrest → Mortal Economy's prosperity damper, `end` Drift Decay → Personality & Emergent Traits, `6.625b` Companion expiry → Companies or Effects & Conditions, **those four attributed by judgement and labelled as such, not proven**. Two look genuinely unregistered and are the true positives the list exists to surface: **`2a` unified action progress** (`unified` domain, 4 modules, claimed by no subsystem row) and **`3b` Notable Agendas** (`notable` domain, 1 module, likewise). So a real unregistered system landing there is currently indistinguishable from five standing false positives — the drift signal is muted precisely where it should fire.

**This already has a ticket, and the ticket's diagnosis is wrong.** [THR-758](https://linear.app/threadbare/issue/THR-758) has sat in `Idea` since 2026-07-24 supposing *"either the registration didn't reach the generator's input or the generator wasn't re-run/committed."* Both are false: the registry row is present, the generator runs, the artifact is fresh, and all 15 `src/engine/groups/*` modules including `phaseGroups.ts` are in the domains table — so its Done-when reads as met on a literal grep while the substantive half is not. **The root cause above was posted as a comment on THR-758** — evidence only, no verdict, no state change, no promotion.

**Deliberately not filed and not promoted.** Delivery-machinery work with no quotable above-bar loss in the 45 days since filing, so it is below the materiality bar and the weekly retro is the promotion point, not this lane. Cost/benefit for the retro to quote: *costs roughly one short executor run — widen the regex and regenerate, or add an explicit phase-claim field if the mismatch is to be fixed generally; not fixing costs one wrong column on that row and a drift signal that cannot distinguish its two real gaps from five false ones.*

**Product-vs-process completion ratio:** unchanged from run n's measurement — of **46 completions since 2026-08-31, 38 product / 8 process**. No process ticket was promoted or filed this run. The pipeline's constraint remains answers and authoring throughput, not a shortage of sanctioned work.

## Escalations

**No Discord message.** `keep-work-flowing-cc` owns that doorbell, runs at :45, and reads `## Needs Christian` from the newest sibling report — this one. The three standing asks reach him through the owning lane within minutes; a second lane pinging the same channel ahead of it is a duplicate, not a faster path.

**The stop-and-ask condition is not triggered.** Agreed work is flowing and the queue is being consumed faster than this lane could promote into it.

**Nothing parked.**
