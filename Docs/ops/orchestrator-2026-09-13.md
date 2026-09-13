---
lane: tb-orchestrator
run: 2026-09-13
promoted: 2
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-13 (run a, ~01:29Z)

## Needs Christian

**Two small repairs went into the build queue this hour, and both came out of last night's own finished work rather than from a plan.** Neither needs you. They are here because together they are the whole of what moved.

The first is a click that lies. In four places on screen — the champion badge in the top bar, the links inside a character sheet, the chapter ledger, and the pop-up that marks a big moment — clicking a person's name opens **the wrong person's sheet**: whoever you happened to have selected before. It has been that way everywhere; two of these surfaces were fixed in the last day, and the remaining four were measured and deliberately set aside so each could be proven separately. They are now queued as one job.

The second is smaller and stranger: a realm's court can change how it feels about a mortal, the game tells you so, and then the crown's name is the one thing on the card you cannot click. Guilds can be clicked. Only realms — the one faction whose name is actually drawn on your map — cannot. The fix is a single missing connection, and its twin (the same gap for *places*) is already sitting in the queue beside it. I have recommended in writing that whoever picks up one takes both in the same sitting, because they are the same repair twice.

**Nothing else is stuck on you for building.** One job is in progress with its pull request already open, and the queue holds fifteen pieces of work.

**All three design maps are still finished waiting — unchanged, and re-proved from the board rather than carried forward.** Every piece of homework an agent is allowed to do on **fights**, **items** and **powers & spellcraft** is done: all twenty-one research tickets and all five agent-doable tasks, closed. **Twelve questions remain and every one of them is yours.** Say **"work the map"** in a chat and they get worked one at a time.

- **[Fights](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — ten waiting. Six are questions: [do companies fight as units?](https://linear.app/threadbare/issue/THR-1271/companies-in-fights) · [how a fight sits inside an encounter](https://linear.app/threadbare/issue/THR-1269/embedding-the-fight-block-encounter-integration-contract) · [how much monster is enough monster](https://linear.app/threadbare/issue/THR-1268/monster-opponents-just-enough-monster) · [what starts a fight without you](https://linear.app/threadbare/issue/THR-1267/systemic-triggers-v1-walking-into-the-lair-grudges-boiling-over) · [what losing looks like when it isn't death](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum) · [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands). Four are mock-ups to react to rather than answer.
- **[Items](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)** — one waiting: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).
- **[Powers & spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)** — one waiting, already in your name: [twenty generated spells to react to](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to).

**The standing request for a design sitting is now four items deep and has not moved for five runs.** Four separate pieces of work are queued behind the same thing: a session where design decisions get made. They are [ambitions nothing can act on](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the), [beasts that cannot be cast in a scene](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor), [six kinds of content with no reference page](https://linear.app/threadbare/issue/THR-1495/six-content-kinds-have-no-codex-category-so-their-content-cards-can), and [which kind of work should stir which kind of trouble](https://linear.app/threadbare/issue/THR-1497/catalystquery-is-repaired-and-gated-but-unreachable-from-the-live). None is urgent on its own. All four want one afternoon.

## T1 — unblock sweep

Shelf at scan: **13** in `Ready for Dev`, **8** of them non-`Deferral`. Below the 15-item backed-up threshold, so the full `ORCH_PROMOTE_BATCH_MAX` ceiling of 5 was available this run — the first run in five to have headroom rather than a one-promotion throttle.

**32 `Todo` candidates read.** 15 carry a `wayfinder:*` label and were skipped unconditionally to T1.5. **17 were judged here.**

**Two arrived since the last published run** (run l, 21:29Z) and both were judged by hand; both promoted. The other fifteen are the standing set.

### Promoted — 2

**[THR-1500](https://linear.app/threadbare/issue/THR-1500/four-more-surfaces-still-open-the-sheet-with-openagentprofileforid-the) — four surfaces still open the wrong mortal's sheet.** `Medium`, unassigned, `Encounter Experience`, labels `Deferral` + `UI` + `Bug`. Created 01:13:03Z, promoted 15 minutes later.

- **Dependency:** none of the three forms. No `Blocked by` line, no prose gate, no time gate, and `get_issue(includeRelations:true)` returns an empty `blockedBy` set. The two ids in the body (THR-1477, THR-1461) are **shipped prerequisites, not open gates** — the primitive `openAgentSheetForId` and its test both landed on `main` before this ticket was filed. Recorded as `Blocked by: nothing` on the promotion comment precisely so a later sweep does not re-parse that prose and re-derive a gate from it.
- **Standing retire verdict (THR-990):** none. `list_comments(orderBy:createdAt, limit:5)` → one comment, the 01:13:21Z filing block. A coordination block is not a verdict.
- **Plan-doc liveness:** passes trivially — names no plan doc. The gate is about promised artifacts, not about requiring one.
- **Destination:** dev-ready. It carries two judgement calls, which is the shape that usually signals a design fork — but both are **written out in the description as the executor's to make**, with the non-obvious one (does site 5165 want to move the world's selection?) stated as a question to answer in the closeout rather than left to be rediscovered. That is the opposite of `Needs its own design finalization`.
- **Rule 0 / materiality:** not process work. `Deferral` in an active project → CLAUDE.md § Prioritization **rule 1**, which outranks that project's remaining queue.
- **Write then verify:** `get_issue` re-query reads `Ready for Dev`, `startedAt: 2026-09-13T01:28:43.313Z`, `stateHistory` with `Todo` ended and `Ready for Dev` started at that timestamp, **no `assignee` key present**. Priority untouched at `Medium`.
- **Coordination block posted** 01:29:12Z.

**[THR-1499](https://linear.app/threadbare/issue/THR-1499/dollarrealm-binds-effect-fields-but-is-not-a-chip-anchor-a-realm) — `$realm` binds effect fields but is not a chip anchor.** `Low`, unassigned, `Thematic Pressure & Living World`, labels `Deferral` + `Content` + `Engine`. Created 00:37:50Z at the THR-1454 closeout, by the first content to spend `$realm`.

- **Dependency:** its own `Blocked by:` line reads *nothing*; empty native `blockedBy`; no prose or time gate. Substrate (THR-1155) and the content that wants it (THR-1454) are both on `main`.
- **Standing retire verdict:** none — one comment, the 00:38:05Z filing block.
- **Plan-doc liveness:** trivial pass; no plan doc named.
- **Destination:** dev-ready, and this one is worth stating because it *could* have declined here. The question "what does the anchor resolve to when the scene's hex is unclaimed?" is exactly the kind of fork that routes to T2 — except the description **already settles it**, by analogy to the shape `$target` has: leave the chip `named`, fail-soft, never a dead link. A settled question in the body is not a design gate.
- **Write then verify:** `Ready for Dev`, `startedAt: 2026-09-13T01:29:16.710Z`, state history clean, **no `assignee` key**. Priority untouched at `Low`.
- **Coordination block posted** 01:29:42Z.

**One thing in THR-1499's promotion comment is new information rather than a restatement.** Its filing block named THR-1462 as a mutex and added an aside — *"worth doing them as one ticket if both are ever claimable at once."* As of this scan that condition is met: **THR-1462 is `Ready for Dev` and unclaimed**, so both halves of the same gap (`$here` and `$realm`) now sit adjacent on one shelf, both claimable, both adding a sibling branch to `classifyAnchorDeclaration` in the same file. The comment therefore recommends in writing that whoever claims either takes both in one branch — framed as a claim-time judgement open to reversal, not an instruction, since the mutex reason (THR-688 rule B) is stated and an executor may reverse it only on evidence.

THR-1500's block likewise carries a refreshed mutex: THR-1492 is still `Ready for Dev` and unclaimed, so its `GameView.tsx` collision is live rather than theoretical.

### Held by the ceiling — 0

The ceiling had headroom and nothing to hold: 5 available, 2 used. This is the **fifth consecutive run with zero held**, but for a different reason than the previous four — those were throttled to one promotion by a backed-up shelf and still had nothing else promotable; this one had full headroom. Of the seventeen judged, exactly two were promotable and the rest decline on grounds no ceiling would ever reach.

### Declined — 15

**Four are unblocked but are design input, not executor work** — the group that has now outnumbered promotable candidates for five consecutive runs. All four are `Blocked by: nothing` and will therefore keep passing the dependency check every hour until a design session takes them:

- **[THR-1497](https://linear.app/threadbare/issue/THR-1497/catalystquery-is-repaired-and-gated-but-unreachable-from-the-live)** (`catalystQuery` unreachable — 35 carriers all on the legacy pack arm) — wrong destination. Its first Done-when is *"A decision recorded on whether the catalyst belongs on a **cell** ... or whether the legacy pack arm is started deliberately"*, and the second is conditional on the first. Re-checked this run rather than carried forward: its `updatedAt` moved to 22:39Z after run l judged it, so `list_comments` was re-read — still **one** comment, the 20:43Z filing block, whose own `Suggested model` line reads *opus, the decision is a design one*. The decline stands unchanged and the touch was not a verdict.
- **[THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the)** (ambitions below the spotlight tier have no agency path) — wrong destination; its body heads the section *"The design question — this is the fork, and it is not the executor's to settle."*
- **[THR-1274](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)** (no non-human cast primitive) — wrong destination; *"This is a design ticket, not a patch."*
- **[THR-1495](https://linear.app/threadbare/issue/THR-1495/six-content-kinds-have-no-codex-category-so-their-content-cards-can)** (six content kinds have no codex category) — wrong destination, unchanged since run h.

**One is blocked and wrong-destination both:** [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (traits wave 2) — `blockedBy` THR-786, and the body says *"Needs its own design finalization before Ready for Dev."*

**One is assigned:** [THR-791](https://linear.app/threadbare/issue/THR-791/traits-wave-3-minting-identity-god-earned-traits-relationship-traits) (traits wave 3), Christian.

**Nine are the standing set** — design-gated, dependency-held, or container epics whose bodies state that no execution ticket files against them ([THR-1156](https://linear.app/threadbare/issue/THR-1156/typed-game-state-architecture-program-epic-claims-vs-reports-acted-on), [THR-789](https://linear.app/threadbare/issue/THR-789/traits-as-the-universal-trigger-layer-program-epic)). No candidate in this group has an `updatedAt` newer than run l's scan, so none was re-verified by hand this run and none is reported as freshly checked. Baseline enumeration with per-ticket evidence: [run a's decline table](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t1--unblock-sweep).

One of the nine is worth naming as *not* an orchestrator matter: [THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) (integrated slice checkpoint — *Christian plays all five encounters*) is `High` and unblocked, but it is a human play session by construction. It is not executor work and promoting it would put a task on the build queue that no builder can perform.

## T1.5 — wayfinder sweep

**Three open maps. Zero AFK-resolvable tickets, proved from labels this run rather than inherited.**

| Map | Open children | Research / AFK open | Grilling | Prototype | AFK resolvable |
|---|---|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) | 10 | **0** | 6 | 4 | **0** |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft) | 1 | **0** | 0 | 1 | **0** |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator) | 1 | **0** | 0 | 1 | **0** |

**AFK tickets resolved: 0, structurally.** `ORCH_WAYFINDER_AFK_MAX` is 2 and the budget went unspent because no ticket on any map is one this lane is permitted to resolve. Two label-scoped board reads this run, not a carried-forward table:

- `list_issues(label:"wayfinder:research")` → **21 of 21 `Done`**, workspace-wide, across every map ever charted.
- `list_issues(label:"wayfinder:task")` → **5 of 5 `Done`**.

All twelve open children therefore carry `wayfinder:grilling` or `wayfinder:prototype`, which are HITL by construction. An agent resolving one is the broken-HITL failure mode the wayfinder skill names, so none was touched.

Re-proving this hourly is deliberate: zero-resolved has two causes indistinguishable in a counter — a lane that found nothing it *could* do, and a lane whose AFK work is *finished*. This is the second, demonstrated by label query.

**No child's `updatedAt` has moved since 2026-08-26**, so no per-child native blocking relation was re-verified by hand and none is reported as freshly checked. The AFK verdict does not depend on that check — it falls out of labels alone.

The twelve HITL tickets are surfaced under **## Needs Christian** above, by name and in game terms.

## T2 — design staging

**Not triggered.** `ORCH_PROGRAM_WORK_FLOOR` is 2; the shelf holds **8** non-`Deferral` items in `Ready for Dev` — four times the floor. No item staged, no `In Design` budget consumed.

Both promotions this run were `Deferral`-labelled, so the non-`Deferral` count is unchanged at 8 while the shelf total rose 13 → 15. That is the measurement working as designed: the floor counts program work precisely so that a shelf topped up with deferrals cannot read as healthy when authored work has run dry. It has not run dry here.

**The staging backlog is unchanged at four and is now the lane's oldest standing finding.** THR-1348, THR-1274, THR-1495 and THR-1497 all decline on *destination*, not dependency — the one decline reason that no amount of upstream merging will ever clear. Five consecutive runs in which design-gated declines (4) outnumber promotable candidates (2 this run; 1 in each of the previous four). This tier cannot act on it: `ORCH_MAX_IN_DESIGN` is 1 and the remit is staging one item for an attended session, which has been surfaced and not yet picked up.

## T3 — architecture health

**Not due this run.** `ORCH_HEALTH_SWEEP_HOUR` is 6 local; the run fired at **03:27 local** (01:27Z), so the daily sweep has not yet come due today. The last full sweep was [2026-09-12 run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t3--architecture-health) at 08:29Z.

**No detector ran this hour and none is reported as clean on this run's authority.** Specifically not run: `generate-interface-map:dry`, `sweep:rank-reach`, `check:process`, `check:canon-staleness`. `__DEBUG.validateTraitRefs()` remains browser-only and unrunnable headless — not run, not reported clean. `newFindings: 0` in the frontmatter means **"no sweep ran"**, not "a sweep found nothing".

**Redundancy: not assessed this sweep.** No judgement pass over `interface-map.md` / `systems-inventory.md` was performed and no coverage is claimed.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Sunday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

One incidental observation from a board read T1 needed for its own arithmetic, recorded as such rather than as a sweep result — **and recorded because the first read of it was wrong:**

- **WIP is 1** — [THR-1494](https://linear.app/threadbare/issue/THR-1494/two-factor-lines-on-the-scene-screen-are-not-sentences-vara-is-oracle) (two factor lines on the scene screen are not sentences), assigned, with [#1927](https://github.com/christianspliid-ui/threadbare/pull/1927) open against it. Its `startedAt` reads `2026-09-12T13:30:57`, which at a glance says a **12-hour** claim and would clear any stalled-work threshold worth having. It is not: `startedAt` is the **`Ready for Dev`** start, and `stateHistory` shows a single `Ready for Dev → In Dev` transition at `23:02:24Z` — a **27-minute** claim at scan, with its PR already open. One transition, no repeats, so nothing meets `ORCH_STALLED_PICKUP_THRESHOLD`, and it was created into `Ready for Dev` rather than hand-created into `In Dev`. Worth writing down because `startedAt` on a Linear issue is not the claim time, and reading it as one manufactures a stalled-work finding out of a healthy ticket.

### Product vs process — the week

Two product promotions, nothing filed, no process ticket. The trailing-week ratio moves to roughly **35 product / 7 process (~83% product)**; the process-ticket budget (at most one per three runs) remains untouched, and nothing this run found rose above the materiality bar.

**Headline: the build queue is fed and the constraint is upstream of it, again.** Fifteen items on the shelf, one in flight with its PR open, and both of this hour's promotions were defects *discovered by last night's own shipped work* — which is the pipeline finding its own gaps rather than waiting to be told about them. Against that, four tickets have now declined on destination for five runs running, and twelve map questions are human-gated. The feature pipeline does not need more tickets. It needs an afternoon of its director's attention, and that finding is now old enough to be the headline rather than a footnote.

## Escalations

**None raised, none parked.** No question needed asking: agreed work was not exhausted (two promotions made from full ceiling headroom), no detector ran and so none failed, both writes matched their re-queries, and no candidate required a direction call this lane is not permitted to make. `ORCH_ESCALATION_CHANNEL` was not contacted.

One judgement call was made unilaterally and is recorded rather than escalated, per the standing delegation: **the recommendation that THR-1499 and THR-1462 be claimed as one branch** is a claim-time sequencing judgement — the *how* of an already-agreed repair — and is written into the coordination comment as a recommendation an executor may reverse on evidence, not as an instruction. No ticket was merged, re-scoped, or closed to effect it.
