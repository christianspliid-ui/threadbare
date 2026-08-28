---
lane: tb-orchestrator
run: 2026-08-28i
promoted: 5
filed: 0
resolved: 0
newFindings: 3
needsChristian: true
---
# Orchestrator — 2026-08-28 (run i, ~18:38Z)

## Needs Christian

**The job shelf has real work on it again.** Two builds finished in the last hour and between them released five jobs that had been waiting on them. All five are now queued and ready. For the first time in about a day, the shelf is not just leftover tidying — it has a broken recruitment system, a founded faction that shows up on the map with no crest or colours, and a fix to the machinery that let one job get built twice last week.

**One thing still needs you, and it is the same one as the last few hours:** [approving the retrofit batch-2 brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) unlocks the camp-seven encounter work ([THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)). That is the single biggest lever on the content side and it costs you one yes or no.

**Two designs are still parked waiting for a person, and the design lane stays frozen until one moves:**

1. [The card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) — **9 days** waiting.
2. [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — **13 days** waiting.

Pick one up, or park it and say so. Less urgent than it was an hour ago — the builders now have five jobs in front of them — but nothing new can be *prepared* for them until one of these two moves.

**Three wayfinder maps are waiting entirely on you.** Every question on them that an agent could answer alone has been answered; what is left is only the kind that needs your judgement about how the game should feel:

- **[Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — ten open questions, including [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands), [how many faces defeat should wear](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum), [how much monster is just enough](https://linear.app/threadbare/issue/THR-1268/monster-opponents-just-enough-monster), and [whether companies fight as units](https://linear.app/threadbare/issue/THR-1271/companies-in-fights).
- **[Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)** — one left: [twenty generated spells to react to](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to).
- **[Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)** — one left: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).

Open a chat and say "work the map" when you have an hour. The two generator sketches are the cheapest — you look at a list and react.

Nothing else needs you.

## T1 — unblock sweep

**Promoted: 5 (the run cap). Held: 2. Filed: 0. Declined: no set re-derived.**

Board at the sweep: **3 `Ready for Dev`** (`hasNextPage: false`) — all three `Deferral`-labelled, so **non-`Deferral` program work on the shelf was zero**, unchanged from run h. **5 `In Dev`** (THR-1317 and THR-1336 live on PRs [#1703](https://github.com/christianspliid-ui/threadbare/pull/1703) / [#1704](https://github.com/christianspliid-ui/threadbare/pull/1704), plus the three `Parked` umbrellas THR-1130 / THR-1133 / THR-1168). **2 `In Design`.** `Todo` returned 50 with `hasNextPage: true`; **`Idea` was queried by hand** — the fourth consecutive run on which that state held live work, and two of this run's five promotions came from it.

### What changed: both gating PRs merged inside the hour

| PR | Ticket | Merged | Releases |
|---|---|---|---|
| [#1697](https://github.com/christianspliid-ui/threadbare/pull/1697) | THR-1307 | 17:39:32Z | THR-1330 |
| [#1690](https://github.com/christianspliid-ui/threadbare/pull/1690) | THR-1309 | 18:22:02Z | THR-1321, THR-1322, THR-1294, THR-1329 |

Run g and run h each set one of those gates as a native `blockedBy` relation rather than a prose note, specifically so the release would be mechanical. It was: `get_issue(includeRelations: true)` on THR-1309 returned its `blocks` set directly, and no membership had to be re-derived from ticket prose. That is the gate-setting discipline paying off on its first test.

### Promoted

Every state write was re-queried with `get_issue` (impediment #48) and every promotion carries a coordination block, without which `pull-work` Step 3 refuses the candidate.

| Issue | Evidence |
|---|---|
| [THR-1325](https://linear.app/threadbare/issue/THR-1325/pull-works-claim-predicates-miss-two-live-states-a-lane-resumes-a-live) — pull-work claim predicates (High) | Its filing block's only gate was *"land after [#1694] merges"*; #1694 merged **15:33:48Z**. Rule 0: impediment #763, THR-1245 *"implemented twice, concurrently, by two sessions"*, ~1 session lost; cost/benefit line present |
| [THR-1324](https://linear.app/threadbare/issue/THR-1324/prose-doctrine-v2-remediation-sweep-10-operative-surfaces-still-teach) — Prose Doctrine v2 remediation | No blocker ever named. Its one mutex (THR-1222) is explicitly **soft** and THR-1222 cannot move anyway. Rule 0: *"10 surfaces still teaching retired … v1 rules as live instruction"*, 4 of 5 `prose@2` stamps over-claiming; cost/benefit line present |
| [THR-1321](https://linear.app/threadbare/issue/THR-1321/a-cast-on-strategic-recruit-warband-halts-it-completely-13-completions) — cast halts `strategic_recruit_warband` | `blockedBy` THR-1309, `Done` 18:22:24Z. **The file mutex is spent** — the two named files are now on `main` with no armed PR holding them |
| [THR-1322](https://linear.app/threadbare/issue/THR-1322/a-run-founded-faction-renders-as-a-fallback-everywhere-in-the-ui) — founded faction renders as fallback | Same blocker. Its premise is now *live rather than predicted*: THR-1309 restored the `dynamicFactionDefinitions` producer, so the defect describes `main` as of 18:22Z rather than a world that did not exist |
| [THR-1330](https://linear.app/threadbare/issue/THR-1330/ascendant-bar-hook-chips-carry-a-tooltip-but-no-image-and-no-link-law) — hook chips, Law 1 | Run h's hold released **on the exact evidence it named**: `hooksBlockCarrier.test.tsx` is now on `origin/main` (it was absent at 17:29Z) and `HooksBlock` reads `has_trait` / `relates_to`. Owed the separate `assignee: null` write (THR-845) — done, verified by key-absence on `get_issue` |

### Held

| Issue | Evidence |
|---|---|
| [THR-1294](https://linear.app/threadbare/issue/THR-1294/requireslocation-defaults-off-undertakings-ignore-their-stage-until) — `requiresLocation` defaults off | Blocker met, **premise not**. See finding 2. Evidence posted to the ticket; deliberately no new `blockedBy` set |
| [THR-1329](https://linear.app/threadbare/issue/THR-1329/seed-99-mints-zero-trade-routes-in-150-ticks-so-the-trade-route-kind) — seed 99 mints zero trade routes | **Promotion ceiling only.** `blockedBy` THR-1309 is `Done`, so it is genuinely promotable; `ORCH_PROMOTE_BATCH_MAX` (5) was reached. Lowest priority of the six eligible (Low). **Next run should promote this first** — it needs no re-derivation |

### Declined

**Nothing re-derived, by design** — but see finding 1, which is about the cost of that rule. Runs c–h's classification of the `Todo` set stands and no member has moved: THR-1222 (unmet chat-approval gate), THR-1195 (standing verdict on record, 2026-08-22), THR-1256 (time gate, opens 2026-09-08), THR-1255 / THR-1218 (gated on content density), THR-1220 (HITL review session, never promotable), the design-gated tickets routed to T2 (THR-1155, THR-1274, THR-1287, THR-1114), and the program epics. All `wayfinder:*` items skipped unconditionally — T1.5's input, never `Ready for Dev`.

### Finding 1 — "do not re-derive the declined set" silently excludes tickets filed *after* the last derivation

Two of this run's five promotions, **THR-1324 and THR-1325**, were filed by the weekly retro at **15:31Z and 15:32Z**. Runs g (~16:29Z) and h (~17:29Z) both ran after that and neither classified them. Neither run erred against its own instructions: both correctly applied the rule that re-listing an already-classified `Todo` set with identical evidence is the dump this lane forbids. But that rule is written over *the set as last classified*, and nothing in it distinguishes a member that has not moved from a member that **did not exist** at the last classification.

Cost: two tickets — one `High`, both clearing the Rule 0 materiality bar with quotable above-bar loss — sat unread for **~3 hours** at the top of a shelf that runs g and h each reported as holding **zero** non-`Deferral` program work. Run h's `## Needs Christian` said *"every item left on it is a small cleanup"* while THR-1324 and THR-1325 were sitting in `Todo` unexamined.

The fix is one clause, not a new tier: **the no-re-derive rule applies to previously-classified members only; any candidate whose `createdAt` is later than the previous run's timestamp is new input and gets classified.** `createdAt` is already returned by the existing scan, so this costs no extra call.

**Not filed as a ticket.** Scheduled lanes do not file process tickets (CLAUDE.md § Process-work throttle), and the loss — ~3 hours of queue latency on two tickets, now recovered — sits below the materiality bar as a single instance. It belongs in the weekly retro's log, alongside the `Idea`-scan-gap amendment already carried by [#1694](https://github.com/christianspliid-ui/threadbare/pull/1694), which is the *same defect on a different axis*: that one is a state the scan never queries, this one is a time window the scan never re-reads. Both are "the sweep's coverage is narrower than its report implies".

### Finding 2 — a Done-when can name a capability, and a met `blockedBy` does not prove the capability exists

[THR-1294](https://linear.app/threadbare/issue/THR-1294/requireslocation-defaults-off-undertakings-ignore-their-stage-until) passes every check T1 performs. Native `blockedBy` → THR-1309, `Done`. No plan doc, so the THR-921 gate passes trivially. Latest comment is not a retire verdict. Four sibling tickets sharing that blocker were promoted this run.

It should not be, and the reason is in its own Done-when: *"doc 3's binder can bring an actor to a stage (or doc 5's board makes travel-to-stage a decision), and doc 2 authors `requiresLocation` per kind."* Resolved clause by clause against `origin/main`:

- **Doc 2 (THR-1297), `Done` 08-27T21:14Z — met.** Per-kind `requiresLocation` values are authored across five strategic packs.
- **Doc 5 (THR-1299) — `Todo`.** Alternative disjunct unmet.
- **Doc 3 (THR-1296), `Done` 08-27T11:44Z — the binder shipped, the *mover* did not.**

```
$ git grep -l 'stageLocationId\|moveTowardStage\|travelToStage\|isActorAtStage' origin/main -- src/engine
src/engine/__tests__/undertakingCheckpoints.test.ts
src/engine/__tests__/undertakingT3Kinds.test.ts
src/engine/undertakingCheckpoints.ts
```

`src/engine/binding/` exists and is substantial, so doc 3 landed — but nothing outside the checkpoint gate and its own tests references moving an actor to a stage. `remoteAnchor.ts` may be the shape that *replaces* the mover; that is a live possibility and precisely the judgement this ticket must make, but it is not the claim its Done-when asserts.

Worse for an executor claiming it today: `main` now carries **two tests pinning the opposite of a flip** — `undertakingT2Kinds.test.ts:431` (*"would starve its kind at true"*) and `undertakingT3Kinds.test.ts:156` — plus a post-THR-1310 re-measurement in `wandererStrategicPack.ts` recording *"0/115 and 0/31 rolled at `requiresLocation: true` — 100% `actor_absent`"* and concluding *"Re-measure when the binder lands, not before."* The ticket's Done-when does offer a compatible second branch (delete the default in favour of explicit per-template values), but nothing on the ticket says which branch is live.

**Two code comments are now stale and load-bearing:** both `UNDERTAKING_DEFAULT_REQUIRES_LOCATION`'s doc-block and `wandererStrategicPack.ts`'s header still say the binder *"has not shipped"*. It shipped 2026-08-27. They are the standing explanation for a constant, and they are wrong about the world.

**Action: held with evidence posted, and deliberately no new `blockedBy`.** Gating on THR-1299 would assert the doc-3 disjunct is dead, which is unread; a wrong mechanical gate is worse than a recorded hold because it releases on the wrong event. Three named routes back to the queue are on the ticket, the cheapest being a one-sentence answer from whoever shipped THR-1296.

This is the THR-1330 class from run h generalised: **that** trap was a ticket naming a source file not yet on `main`; **this** is a ticket naming a *capability* not on `main`. Neither is reachable by the plan-doc liveness gate, and both read clean on `blockedBy`.

### Finding 3 — an absorbed ticket's work shipped and the ticket stayed open

THR-1309's Done-when required *"THR-1295's Done-when satisfied **and that ticket closed against this one**"*. The first half landed; [THR-1295](https://linear.app/threadbare/issue/THR-1295/folded-found-order-undertaking-has-no-faction-payoff-create-group) is still `Idea`. Verified on `origin/main` rather than taken on THR-1309's word: `create_group` appears across `undertaking-kinds.ts`, three strategic packs, `groupFormation.ts`, `bandSpawner.ts` and five test files, and `strategicGraphOps.ts:1369` writes `dynamicFactionDefinitions` under a test named *"restores the producer `dynamicFactionDefinitions` never had"*.

An open ticket whose work has shipped is a duplicate-implementation candidate — impediment #763's class one layer up. **Evidence posted to the ticket; no state change made**, because closing on someone else's Done-when is outside this lane's remit (the `Done` carve-out covers `wayfinder:*` only). Low urgency: it sits in `Idea`, outside the executor's `Ready for Dev` pickup path. Recorded so a future T1 run does not promote already-shipped work.

## T1.5 — wayfinder sweep

Three open maps, unchanged in membership — and all three are now **entirely HITL**. Every `wayfinder:research` ticket across all three is `Done`.

| Map | Frontier | AFK resolved | HITL surfaced |
|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 open | **0 available** — all four research children (THR-1259, THR-1260, THR-1261, THR-1262) `Done` 08-26 | 6 `grilling` + 4 `prototype` |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 open | **0 available** — both research children `Done`; the three `grilling` children also `Done` | THR-1232 (`prototype`, assigned to Christian) |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 open | **0 available** — both research children `Done` | THR-1236 (`prototype`) |

**`ORCH_WAYFINDER_AFK_MAX` (2) was not reached because there was nothing to reach it with**, not because the cap bound. That distinction matters for reading this tier: zero AFK resolutions here is the *finished* state of the agent-doable half, not a stalled sweep. Grilling and prototype tickets are never touched by this lane — an agent resolving one is the broken-HITL failure mode the wayfinder skill names.

Surfaced by name under `## Needs Christian` above.

## T2 — design authoring

**Not triggered, on two independent grounds.**

- **Shelf count.** `ORCH_PROGRAM_WORK_FLOOR` is 2, and the trigger is *fewer than* 2 non-`Deferral` items in `Ready for Dev`. At the sweep the count was **0** — the trigger condition. After this run's promotions it is **2** (THR-1324, THR-1325), which is at the floor and not below it. The five promotions are the correct response to a starved shelf; staging design work on top of them would be planning ahead of an execution queue that just went from 3 to 8.
- **`In Design` bound.** `ORCH_MAX_IN_DESIGN` is 1 and `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (staged 08-19, **9 days**) and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (**13 days**). Over the bound, so T2 is barred regardless of shelf depth.

Both are past the 48h re-surface threshold and are **re-surfaced, not re-staged**, per the rule. Carried to `## Needs Christian` above.

**Product-vs-process ratio for the run, per the Rule 0 discipline.** Of five promotions: **three product** (THR-1321 engine defect, THR-1322 UI/engine defect, THR-1330 UI Law 1 defect) and **two process-adjacent** (THR-1325 infrastructure, THR-1324 content-doctrine — labelled `Content` and gating authored content quality, but a guidance sweep in substance). Both process items were promoted only after clearing the materiality bar with quotable above-bar loss *and* a cost/benefit line, per CLAUDE.md § Prioritization; a process ticket lacking either does not enter the queue from this lane.

**The headline finding is no longer "shelf empty".** It was for the previous ~21 hours and run h reported it correctly. This run it changed — not because the design pipeline unblocked, but because two long-running builds finished and released their dependants. **That is a one-off, not a supply fix.** The upstream constraint is unchanged: two designs frozen in `In Design` waiting on Christian, and the one High-priority content ticket (THR-1222) waiting on a chat approval. When these five drain, the shelf returns to deferrals unless one of those three moves.

## T3 — architecture health

**Not due — already run today.** Run b performed the daily sweep at 07:35 local, the first past `ORCH_HEALTH_SWEEP_HOUR` (6): [`…-28b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-28b.md). One sweep per day; this run does not repeat it. Its findings stand (8 LEAKED contracts unchanged in membership, canon staleness 22, `sweep:rank-reach` PASS, `check:process` exit 0).

**No detector ran this run, and none is reported as clean.** The `newFindings: 3` in this report's frontmatter is entirely § T1 — reached by reading tickets, four `git` queries against `origin/main`, and `gh pr view`. **None of it is detector output**, and it is named here explicitly so it cannot be mistaken for any. `__DEBUG.validateTraitRefs()` is browser-only and cannot run headless: **not run, not reported as clean.**

**Redundancy: not assessed this sweep.** Run b's judgement pass over the interface map and systems inventory stands. Nothing above amends it — findings 1 and 3 are coordination-protocol defects and finding 2 is a ticket-premise defect; none was reached by a pass over the interface map or systems inventory.

**Stalled work: assessed, and clean — with run g's standing caveat.** No `In Dev` issue meets `ORCH_STALLED_PICKUP_THRESHOLD` (3 `Ready for Dev → In Dev` transitions without a `Done`). THR-1321 and THR-1322 each recorded exactly **one** such transition today (the 14:05–14:08Z claim-and-release cycles honouring the THR-1309 mutex) and both have now been re-promoted, so neither is accumulating. THR-1130 remains at the threshold **by design**, as a `Parked` batch umbrella. Run g's caveat is unchanged and not re-filed: the detector counts re-claims, so a *first* claim that never lands stays invisible to it; that needs a duration signal and belongs to the weekly retro.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Friday. Monday's [`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) stands and is deliberately not re-reported.

**One observation, recorded not filed.** `git worktree list` in the home tree returns **~170** worktrees, the oldest dated 2026-07-31, the great majority `kwf-*` briefing runs. The reaper owns this and no work was lost, so it is not a finding against any lane — but the count is large enough to be worth a line in the weekly retro's log rather than a ticket, per the process-work throttle.

## Escalations

**None raised, nothing parked.** No Discord question was needed this run: agreed work was not exhausted — the opposite, five items were released and promoted — and no decision required Christian mid-run. The three items that need him are surfaced through the briefing under `## Needs Christian`, which is the designed path and not an escalation.

**Two open PRs inherited by the next run**, recorded so their state is read correctly rather than re-diagnosed: [#1704](https://github.com/christianspliid-ui/threadbare/pull/1704) (THR-1336, CLAUDE.md diet) is `DIRTY` — a merge conflict is the executor's own work (`git merge origin/main && git push`) and is not escalated; [#1703](https://github.com/christianspliid-ui/threadbare/pull/1703) (THR-1317) is `BLOCKED` on an in-flight required check, which is the healthy waiting state. #1704 is also the live mutex partner named in THR-1325's coordination block.
