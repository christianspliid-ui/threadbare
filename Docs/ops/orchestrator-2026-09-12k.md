---
lane: tb-orchestrator
run: 2026-09-12k
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-09-12 (run k, ~20:29Z)

## Needs Christian

**Nothing is stuck on you for the building work — but all three design maps are now finished waiting.** Every piece of homework an agent could do on **fights**, **items** and **powers & spellcraft** is done. I checked all three this hour: nine research tickets across the three maps, nine of them closed. What is left on every one of them is a question only you can answer, and nothing further can be designed or built on any of the three until you do. Say **"work the map"** in a chat and they get worked one at a time.

The twelve open questions, by map:

- **[Fights](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — ten waiting. Six are questions: [do companies fight as units?](https://linear.app/threadbare/issue/THR-1271/companies-in-fights) · [how a fight sits inside an encounter](https://linear.app/threadbare/issue/THR-1269/embedding-the-fight-block-encounter-integration-contract) · [how much monster is enough monster](https://linear.app/threadbare/issue/THR-1268/monster-opponents-just-enough-monster) · [what starts a fight without you](https://linear.app/threadbare/issue/THR-1267/systemic-triggers-v1-walking-into-the-lair-grudges-boiling-over) · [what losing looks like when it isn't death](https://linear.app/threadbare/issue/THR-1266/defeat-wears-many-faces-the-outcome-spectrum) · [what winning leaves in your hands](https://linear.app/threadbare/issue/THR-1270/victory-yields-what-winning-leaves-in-your-hands). Four are mock-ups for you to react to rather than answer.
- **[Items](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)** — one waiting: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).
- **[Powers & spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)** — one waiting, already in your name: [twenty generated spells to react to](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to).

**One new thing reached the build queue this hour, and it is a promise the game is currently breaking.** Sixteen encounters tell the player they have been paid a reward and then hand over nothing — [the ticket is here](https://linear.app/threadbare/issue/THR-1496/sixteen-step-route-reward-recipes-promise-a-prize-and-draw-nothing-the). It surfaced because the content work that shipped at 19:01 widened a check that had been looking at one recipe in 482 and calling the whole corpus clean. Nine of the sixteen need a content author's judgment about what the scene *should* hand out; the other seven are plain authoring typos. No decision from you is needed — it is queued and a builder can take it.

**The standing question about [the six kinds of content with no reference page](https://linear.app/threadbare/issue/THR-1495/six-content-kinds-have-no-codex-category-so-their-content-cards-can) is unchanged and still not urgent.** It needs a design sitting, not a builder, which is why it does not move on its own.

## T1 — unblock sweep

Shelf at scan: **16** in `Ready for Dev`, **11** of them non-`Deferral`. Still above the 15-item backed-up threshold, so the ceiling narrowed this run to at most one promotion.

**31 `Todo` candidates read.** 15 carry a `wayfinder:*` label and were skipped unconditionally to T1.5. **16 were judged here.**

### Promoted — 1

**[THR-1496](https://linear.app/threadbare/issue/THR-1496) — sixteen step-route reward recipes promise a prize and draw nothing.** `Medium`, unassigned, `Encounter Experience`, labels `Deferral` + `Content` + `Bug`.

Ranked first under CLAUDE.md § Prioritization **rule 1** — a `Deferral` in a project with active work — over three other unblocked `Medium` candidates, all of which decline on destination (below).

Checks that ran before the write, each recorded because a check that finds nothing is the only evidence it ran:

- **Dependency:** no native `blockedBy` relation, no prose gate, no time gate. The parent work it was deferred out of — [THR-1487](https://linear.app/threadbare/issue/THR-1487) (slice 3: the content query and its one resolver under the reward pool and the step-route gate) — reached `completedAt: 2026-09-12T19:01:20.095Z`. That is the ticket that built the widened gate, the `CONTENT_QUERY_RETROFIT_PENDING` ratchet and the two-way test this one empties, so the artifact it acts on is not merely present, it shipped 88 minutes before the scan.
- **Plan-doc liveness:** the description names no plan doc, so the gate passes trivially. The sixteen sites are enumerated in the ticket body itself and in `src/data/content-eval/contentQueryRetrofitPending.ts`; there is no promised artifact to strand.
- **Standing retire verdict (THR-990):** latest comment read (`list_comments`, `orderBy:createdAt`, limit 5). One comment on the thread — the filing coordination block, 18:41:41Z. No retire, do-not-build or superseded verdict.
- **Destination:** no "needs design finalization" sentence; no `wayfinder:*` label. The judgment it asks for is per-site content authoring ("what should this scene hand out?"), which is an author's call inside an agreed shape, not a fork.
- **Rule 0 / materiality:** not process work. A player-facing content defect in an active program; the materiality bar governs process tickets and does not apply.
- **Write then verify:** `save_issue(state:"Ready for Dev")` → `get_issue` re-query shows `status: "Ready for Dev"`, `startedAt: 2026-09-12T20:29:10.364Z`, `stateHistory` with `Todo` ended and `Ready for Dev` started at that timestamp, **no `assignee` key present**. Priority untouched at `Medium`.
- **Coordination block posted** 20:29:35Z, carrying the promotion evidence, the three lines, `Blocked by: nothing` naming the now-`Done` THR-1487, and the evidence shape.

**Two things in the promotion comment are new information rather than a restatement of the filing block:**

- **A mutex the filing block could not have known about.** The filing block named file-level conflicts only. [THR-1489](https://linear.app/threadbare/issue/THR-1489) (slice 5) is now named with its reason inline: its scope item 2 *grandfathers* the legacy corpus through `CONTENT_QUERY_RETROFIT_PENDING`, while this ticket *empties and deletes* that file. Two tickets writing opposite futures for one file is the mutex most likely to be tested, because slice 5 becomes promotable the moment slice 4 merges.
- **A mutex deliberately *not* asserted, with its reason.** [THR-1488](https://linear.app/threadbare/issue/THR-1488) (slice 4) is `In Dev` right now and touches the same content corpus, but it is scoped to `encounter_seed.query` and `catalystQuery` while this ticket edits `successMetadata.rewardPool` — different fields, so the two are recorded as parallel-safe in practice rather than left ambiguous for the executor to adjudicate at claim time (THR-688 rule B).

### Held by the ceiling — 0

The ceiling was in force and had nothing to hold, for the **third consecutive run**. Recorded rather than omitted, because runs g and h did have something held and the difference is what distinguishes a throttled queue from an empty one. Of the sixteen judged, exactly one was promotable; the rest decline on grounds the ceiling never reached.

### Declined — 15

**Three are unblocked but are design input, not executor work** — the ceiling is not what stopped them, and would not have promoted them at any shelf depth:

- **[THR-1348](https://linear.app/threadbare/issue/THR-1348)** (ambitions below the spotlight tier have no agency path; 10 strategic templates unreachable on seed 99) — **wrong destination**. No blockers. Its own body heads the section *"The design question — this is the fork, and it is not the executor's to settle"* and offers three readings that are "genuinely different games"; its first Done-when is *"a verdict is recorded on which of the three readings holds"*. Met dependencies do not make that dev-ready. T2's input.
- **[THR-1274](https://linear.app/threadbare/issue/THR-1274)** (no non-human cast primitive — a beast cannot be bound cast, blocking `encounter.hunt.*`) — **wrong destination**. No blockers. Body: *"This is a design ticket, not a patch"*, and the shape it needs decided (a `CastRole` widening? a creature roster? persistence for an animal that survives) falls under the new-node-type rule, which forbids stub-and-decide-later.
- **[THR-1495](https://linear.app/threadbare/issue/THR-1495)** (six content kinds have no codex category) — **wrong destination**, unchanged from runs h, i and j. Four of its six decisions are gameplay-meaning forks; two are plain gaps. Carries no blockers, so it will keep passing the dependency check every hour — the decline reason is the destination and will not change until a design session takes it.

**One is the last content-model slice, and the chain did not move this hour:**

- **[THR-1489](https://linear.app/threadbare/issue/THR-1489)** (slice 5 — the harness closing sweep) — blocker [THR-1488](https://linear.app/threadbare/issue/THR-1488) is `In Dev`, claimed but not merged. Not `Done`, so not promotable. Verified against the board this run rather than carried forward: the `blockedBy` relation is native, and slice 4 sits `In Dev` with `completedAt: null`.

**One is blocked and wrong-destination both:** [THR-790](https://linear.app/threadbare/issue/THR-790) (traits wave 2) — `blockedBy` THR-786, and the body says in so many words *"Needs its own design finalization before Ready for Dev."* Either alone is disqualifying.

**One is assigned:** [THR-791](https://linear.app/threadbare/issue/THR-791) (traits wave 3), Christian.

**Nine are the standing set** — design-gated, dependency-held, or container epics whose bodies state that no execution ticket files against them ([THR-1156](https://linear.app/threadbare/issue/THR-1156), [THR-789](https://linear.app/threadbare/issue/THR-789)). Not restated: re-listing them hourly is the dump this lane forbids. The baseline enumeration with per-ticket evidence is [run a's decline table](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t1--unblock-sweep).

### One observation about this lane's own bucketing — logged, not filed

THR-1496 was created 18:34:48Z with its coordination block posted at 18:41:41Z, both **before** run j's 19:28Z scan. Run j's arithmetic accounts for it (32 read, 15 wayfinder, 17 judged) but its decline write-up swept it into *"thirteen are the standing set … no candidate's `updatedAt` moved since run i, so none was re-verified by hand"* — which is false for this one ticket, whose `updatedAt` was 47 minutes old at that moment. The "standing set, not restated" shortcut is the right instinct and should stay; it just needs to exclude arrivals newer than the previous run.

Cost: one hour of queue latency on one ticket, no work lost. That is far below the materiality bar (~1 hour lost, a corrupted artifact, or ≥3 recurrences in a week), so this is an observation in a run report, **not a ticket** — per the process-work throttle, a scheduled lane logs and moves on, and the weekly retro is the single promotion point if it recurs.

## T1.5 — wayfinder sweep

**Three open maps, and for the first time all three are entirely human-gated.**

| Map | Open children | Research / AFK | Grilling | Prototype | AFK resolvable |
|---|---|---|---|---|---|
| [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) | 10 | **0 open — 4 of 4 `Done`** | 6 | 4 | **0** |
| [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) | 1 | **0 open — 2 of 2 `Done`** | 0 (3 of 3 `Done`) | 1 | **0** |
| [Item Generator](https://linear.app/threadbare/issue/THR-1227) | 1 | **0 open — 2 of 2 `Done`** | 0 | 1 | **0** |

**AFK tickets resolved: 0 — and this is a structural result, not a failed attempt.** `ORCH_WAYFINDER_AFK_MAX` is 2 and the budget went unspent because **there is no ticket on any of the three maps this lane is permitted to resolve**: every `wayfinder:research` child across all three is already `Done` (nine of nine), and every open child carries `wayfinder:grilling` or `wayfinder:prototype`, which are HITL by construction. An agent resolving one of those is the broken-HITL failure the wayfinder skill names, so none was touched.

This is worth stating plainly because zero-resolved has two very different causes and they look identical in a counter: a lane that found nothing it could do, and a lane whose AFK work is *finished*. This is the second. The Physical Conflict map's `Decisions so far` section now carries four completed research findings — company ground truth, encounter attachment substrate, quintessence/Broken/death callability, and the monster-and-lair substrate — and its charter decisions were settled by Christian in live chat on 2026-08-26. The homework is done; the map is waiting on its author.

**No child's `updatedAt` has moved since 2026-08-26**, so no per-child blocking relation was re-verified by hand this run and none is reported as freshly checked. The AFK verdict does not depend on that check — it falls out of labels alone, which is why it is stated as certain while the HITL ordering is not.

The twelve HITL tickets are surfaced under **## Needs Christian** above, by name and in game terms.

## T2 — design staging

**Not triggered.** `ORCH_PROGRAM_WORK_FLOOR` is 2; the shelf holds **11** non-`Deferral` items in `Ready for Dev` — five and a half times the floor. No item was staged and no `In Design` budget was consumed.

Worth noting alongside the T1.5 result, because the two together describe the board's actual shape: **the build queue is deep and the design queue is empty of anything an agent may start.** Three of the four unblocked `Todo` candidates this run declined are design input (THR-1348, THR-1274, THR-1495), and all twelve open wayfinder tickets are human-gated. If the shelf ever does drop below the floor, what this tier would stage is already visible — and every candidate needs the same attended Opus sitting, not a second staging comment.

## T3 — architecture health

**Skipped — already run today.** [Run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-12.md#t3--architecture-health) executed the full sweep at ~10:29 local (08:29Z), past `ORCH_HEALTH_SWEEP_HOUR` (6), and its results stand: 7 LEAKED contracts unchanged by name, canon staleness 30, `sweep:rank-reach` `PASS`, `check:process` `passed-with-gaps`, zero stalled-pickup issues.

**No detector was run this hour and none is reported as clean on this run's authority.** Specifically not run: `generate-interface-map:dry`, `sweep:rank-reach`, `check:process`, `check:canon-staleness`. `__DEBUG.validateTraitRefs()` remains browser-only and unrunnable headless — not run, not reported clean.

**Redundancy: not assessed this sweep.** No judgement pass over `interface-map.md` / `systems-inventory.md` was performed this run and no coverage is claimed for it.

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Saturday. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

**Precheck:** `rg=no` `git=yes` `test=1.62s` `nm=session:healthy` `linear=nokey` `freshness=current`. `nokey` is the documented normal state on this machine and gates nothing — the board was read and written successfully throughout this run, which is the confirming board read that signal asks for.

### Product vs process — the week

One product promotion, nothing filed, no process ticket. The trailing-week ratio is materially unmoved at roughly **32 product / 7 process (~82% product)**; the process-ticket budget (at most one per three runs) remains untouched, and the one lane-hygiene observation this run surfaced was written into the T1 section as a log line rather than filed, per the process-work throttle.

**Headline: building is healthy and design is the only bottleneck left, now provably so.** Sixteen items on the shelf, eleven of them real program work, a fresh player-facing bug queued within two hours of being found, and the executor slot free. Against that, every one of the three chartered design maps has run out of agent-doable work in the same week — nine research tickets closed, twelve human questions open, zero of them advanceable by any lane. This is not a queue that needs more tickets; it needs an afternoon of its director's attention on three maps that have finished waiting for everything else.

## Escalations

None raised. No question was posted to `ORCH_ESCALATION_CHANNEL` this run: agreed work was not exhausted (one promotable candidate existed and was promoted), and the wayfinder frontier's HITL half routes through `## Needs Christian` and the hourly briefing by design, not through the escalation channel.

Nothing parked.
