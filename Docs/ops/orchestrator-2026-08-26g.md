---
lane: tb-orchestrator
run: 2026-08-26g
promoted: 0
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-26 (run g, ~11:31Z)

## Needs Christian

**The builder is about to run out of work, and only you can refill it.**

This is the change since the last hour and the reason this report exists. Two things shipped
in the last hour — [the control-claim churn fix](https://linear.app/threadbare/issue/THR-1286/control-claimdecayre-claim-churn-eats-40percent-of-agent-decisions)
and [the stale-claim sweep fix](https://linear.app/threadbare/issue/THR-1283/the-stale-claim-sweep-destroys-parks-it-can-see-are-parks-and-pull-work) —
which is good, and it took the ready-to-build shelf from three items down to **two**. Two is
the floor. When the builder picks up the next one, the shelf drops below it.

The reason that matters: **there is nothing behind those two.** I scanned all 41 waiting
items this hour and could promote none of them. Not because they are blocked by other work —
because nearly all of them say, in their own words, that they need a design decision before
anyone writes code. Nine of them. The build queue refills itself; the design queue does not,
and this lane deliberately does not write designs.

So the three asks below are, in order, the whole of what stands between the machine and idle.

**1. Approve the camp-seven brief — one minute, and it puts a batch on the queue.**

[Read the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md),
say yes, and [Run Retrofit Batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine)
goes onto the shelf immediately. One thing in it needs your answer specifically: it proposes
**seven** encounters rather than the six your batch-size ruling set, because the camp set is
one family living in one file and splitting the seventh off costs a whole factory cycle for
no variety gain. Yes to seven, or send it back to 6 + 1.

Unchanged since 08-24, and now the fourth day: `shrine_offering` is encounter #1 of
[the play session you asked for](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with),
and that session cannot invite you while it is below standard.

**2. Free the design slot — the card-grammar session has held it seven days.**

[Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) —
the "action cards are too verbose and hard to understand" problem you raised on 08-06 — has
been staged and waiting for an attended session since 08-19. It has not been touched since.
While it sits there, no other design can be staged, and three good candidates are queued
behind it: the [shared anchor machinery](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated)
(the strongest — it is the keystone of the typed-game-state program and unblocks two more
tickets), [beasts as real scene actors](https://linear.app/threadbare/issue/THR-1274/no-non-human-cast-primitive-a-beast-cannot-be-a-bound-scene-actor)
(without it every hunt encounter's monster is prose only), and
[control upkeep](https://linear.app/threadbare/issue/THR-1287/control-upkeep-is-structurally-impossible-nothing-ever-resets)
(right now a grip on a place always slips, no matter how hard its holder holds it — the
fiction says otherwise). Either sit the card-grammar session, or say to park it and let the
next one through.

**3. Your four maps are entirely down to you — eleven questions, none agent-answerable.**

Nothing moved on any of them this hour. Every survey and inventory an agent could do is done.

* **[Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** —
  seven questions. The two that open the rest:
  [how a fight against a monster runs](https://linear.app/threadbare/issue/THR-1263/npc-mode-fight-loop-the-stat-block-and-test-skeleton)
  and [how a fight between two people runs](https://linear.app/threadbare/issue/THR-1264/agent-mode-fight-loop-opposed-band-pairs).
* **[Proactive Agent Actions](https://linear.app/threadbare/issue/THR-1276/proactive-agent-actions-wayfinder-map)** —
  three. The keystone is [what agents can build, change and tear down](https://linear.app/threadbare/issue/THR-1281/the-action-library-grammar-crud-verbs-across-reaches-and-tiers),
  which your substrate ruling this morning widened to also cover what a person owns.
* **[Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)** —
  one: [thirty generated items to react to](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to).
  It is the last question on that map.
* **[Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)** —
  you already took [the twenty generated spells](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to)
  into your own name this morning; nothing else on that map is open.

## T1 — unblock sweep

Scanned **41** `Todo` issues against a `Ready for Dev` shelf of **2**. **Promoted 0.**

**The `Todo` set is byte-identical to run f's** — no issue was created, closed or moved into
`Todo` in the intervening hour, and the newest `updatedAt` on the whole set is still
THR-1287 at 10:25:20Z. So there is no new candidate to assess this run, and every decline
below is a re-check rather than a carry.

**The shelf moved, and that is this run's material fact.** Run f measured 3; this run measures
2. Both departures are completions, not stalls — [THR-1286](https://linear.app/threadbare/issue/THR-1286/control-claimdecayre-claim-churn-eats-40percent-of-agent-decisions)
`completedAt` 10:45:36Z and [THR-1283](https://linear.app/threadbare/issue/THR-1283/the-stale-claim-sweep-destroys-parks-it-can-see-are-parks-and-pull-work)
`completedAt` 11:27:34Z, four minutes before this scan. What remains is
[THR-1284](https://linear.app/threadbare/issue/THR-1284/balance-telemetry-reports-encounters-0-attempted-while-hundreds-resolve)
(balance telemetry reporting "Encounters: 0 attempted" while hundreds resolve) and
[THR-1285](https://linear.app/threadbare/issue/THR-1285/some-pursues-edges-point-at-ambition-nodes-with-no-templateid)
(`pursues` edges pointing at ambition nodes with no `templateId`). Both product bugs.

**Declines, each re-checked against this run's scan:**

* **Wrong destination (design-first) — nine, and this is the whole story of the sweep.**
  `THR-1212`, `THR-1213`, `THR-1155`, `THR-1156`, `THR-1274`, `THR-1287`, `THR-1189`,
  `THR-1114`, `THR-1148`. Each declines on its own text, not on a blocker: THR-1287's
  Done-when opens *"Design decision recorded first"*; THR-1274 says *"This is a design
  ticket, not a patch"*; THR-1189 says wiring the toll *"wants a design pass rather than an
  executor's judgement call"*; THR-1114 says *"There is no agreed outcome to test against"*;
  THR-1212's own Done-when is *"Plan doc in `Docs/plans/`… moved to Ready for Dev"*. Met
  blockers do not make any of these dev-ready — they make them T2's input.
* **Unmet blocker** — `THR-1213` (THR-1212 still `Todo`), `THR-1155` (native `blockedBy`
  THR-1213, itself `Todo`), `THR-1024` (THR-966 re-queried this run: still `Idea`,
  `updatedAt` 2026-08-10), `THR-1255` (needs THR-1222 to ship), `THR-1218` (needs THR-1043,
  still `Todo` and assigned), `THR-175` (DEFERRED trigger unmet).
* **Unmet time gate** — `THR-1256`, window opens **2026-09-08**; thirteen days out.
* **Human gate unmet** — `THR-1222`, re-read via `list_comments` this run: still exactly one
  comment, dated 2026-08-24T19:24:54Z, naming the blocker as *"Christian's chat approval of
  `Docs/plans/encounters/retrofit-batch-2-brief.md` (ruling 2) — a state gate, not a ticket."*
  `blockedBy` empty. No run of this lane can clear it. The brief itself is live on `main`
  (`git cat-file -e origin/main:Docs/plans/encounters/retrofit-batch-2-brief.md` → present),
  so the link in § Needs Christian resolves and nothing is stranded. Surfaced above, fourth
  day running.
* **Standing decline on record** — `THR-1195`, seventh time. `updatedAt` still
  2026-08-22T18:31:47Z, unmoved — it was promoted to `Ready for Dev` on 08-22 and demoted 84
  seconds later, and its own Done-when requires *"a recorded decision on what a Divine Herald
  is"*. None of its reversal conditions has occurred.
* **Not candidates** — `THR-1220` (never promotes; it is your play session),
  `THR-1043` / `THR-791` (carry an assignee), `THR-870` (parked), `THR-789` (program epic;
  its children carry the work), and the **twenty** `wayfinder:*` issues across four maps,
  skipped unconditionally per the T1 rule.

Promotion ceiling did not apply (shelf 2, far under 15). No latest-comment retire verdict
(THR-990 check) fired: the only candidate whose latest comment was read in full was THR-1222,
and its comment is a coordination block, not a verdict.

**Rule-0 / materiality.** Nothing was promoted, so the process throttle did not bind. Shelf
composition is now **2:0 product-to-process** — both remaining items are bugs. The
week's completion mix through this hour is the healthier reading: of the last two ships, one
was product (THR-1286) and one process (THR-1283), and neither was promoted by this lane.

## T1.5 — wayfinder sweep

**Four open maps. Frontier 11, all HITL. AFK tickets resolved: 0 — none were available.**

Measured this run, not inherited: a label scan across the team returns **zero** open
`wayfinder:research` and **zero** open `wayfinder:task` issues. All seventeen research tickets
and all three task tickets ever filed are `Done`. There was no AFK work to take, so
`ORCH_WAYFINDER_AFK_MAX` was never approached and nothing was claimed or touched.

Per-map, with native `blockedBy` relations checked per candidate this run:

* **[Physical Conflict](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)**
  — 10 open children, frontier **7**: THR-1263, THR-1264, THR-1266, THR-1267, THR-1268,
  THR-1270, THR-1271 (five `grilling`, two `prototype`, all unassigned, every blocker `Done`).
  THR-1265, THR-1269 and THR-1272 sit behind THR-1263 / THR-1264 and are correctly not
  frontier. Nothing on this map has moved since 06:54Z — six hours.
* **[Proactive Agent Actions](https://linear.app/threadbare/issue/THR-1276/proactive-agent-actions-wayfinder-map)**
  — frontier **3**: THR-1281 (blockers THR-1278 and THR-1280 both `Done`, the latter at
  10:14:50Z), THR-1282 (blocker THR-1277 `Done`), THR-1279 (no blockers).
* **[Item Generator](https://linear.app/threadbare/issue/THR-1227/wayfinder-map-item-generator)**
  — frontier **1**: THR-1236, all four blockers `Done`, unassigned.
* **[Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)**
  — frontier **0**, unchanged from run f. THR-1232 carries Christian as assignee, so it drops
  out of the frontier by definition. Reported as claimed, not as closed.

**Nothing on any map is waiting on an agent.** All four are agent-exhausted, and have been
since 09:26Z when the last research ticket closed.

## T2 — design staging

**Not triggered — and it missed by exactly one item.**

`Ready for Dev` holds **2** non-`Deferral` items against `ORCH_PROGRAM_WORK_FLOOR` of 2. The
trigger is *fewer than* 2, so it does not fire at 2. It will fire the moment the builder
claims either remaining item, which on this hour's cadence is likely within the hour.

**And when it fires it will be bound-blocked, as it was in runs b through e.**
`ORCH_MAX_IN_DESIGN` is 1 and [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card)
has held that slot since 2026-08-19T02:31:15Z — `updatedAt` unmoved, so **seven days and nine
hours** untouched, against a rule that says an item unpicked after 48h is *re-surfaced, not
re-staged*. Re-surfaced in § Needs Christian; nothing was written to the ticket. (`In Design`
also holds THR-790, which carries Christian as assignee and is not lane-staged, so it does not
count against the bound.)

**The staging queue behind that slot is three deep and unchanged from run f** — THR-1212
(strongest: unblocked, High, under the Urgent typed-game-state epic, and it blocks THR-1213),
THR-1274, THR-1287. None was staged.

**This is now the lane's standing finding, five runs old, and this hour is the first where it
has a cost rather than a shape.** The dev shelf refills itself; the design shelf does not.
Until today the dev shelf stayed above its floor on its own, so the deadlocked staging slot
was a queue that was not moving rather than a queue that was starving anything. At 2 and
falling, with nine design-first tickets behind it and zero promotable work, that stops being
true. The fix is upstream — an attended design session, or a ruling to park THR-1002 — and it
is not something this lane can take.

## T3 — architecture health

**Skipped — already discharged today.** Run b owned the daily sweep at 06:27 local (past
`ORCH_HEALTH_SWEEP_HOUR` of 6) and invoked all four detectors; this run fired at 13:31 local,
sixth past the gate. Results stand at
[`orchestrator-2026-08-26b.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-26b.md)
§ T3 and are deliberately not restated.

**Nothing in this section is a clean result.** No detector was invoked this sweep:
`generate-interface-map:dry`, `sweep:rank-reach`, `check:process` and `check:canon-staleness`
were **not run**. **Redundancy: not assessed this sweep.** `__DEBUG.validateTraitRefs()` is
browser-only and cannot run from a headless scheduled context — not run, and not reported as
clean.

**Stalled work: not a dedicated sweep, but T1's scan reached the relevant facts.** `In Dev`
holds **4**, down one from run f — the three long-standing parks (THR-1130, THR-1133,
THR-1168, all untouched since 09:22–09:24Z) and one live claim, THR-1275, whose
`stateHistory` shows a single `Ready for Dev → In Dev` transition at 08:30:43Z. THR-1286 left
`In Dev` by completing. Nothing crossed `ORCH_STALLED_PICKUP_THRESHOLD` and no new stall shape
appeared. Worth one line: THR-1283, the ticket filed *about* the stale-claim sweep destroying
parks, shipped at 11:27Z — the three parks survived this hour's sweep intact, which is the
first hour that has been true.

Weekly test-suite health does not apply: `ORCH_TESTHEALTH_DOW` is Monday (1); today is
**Wednesday**. Monday's result stands unchanged at
[`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md)
and is deliberately not restated.

## Escalations

**None asked, nothing parked, no Discord post made** — and the call was re-taken this run
rather than carried, because this is the run where it was closest to firing.

The escalation trigger is *agreed work exhausted*. For the **executor** it has not fired: two
product bugs remain on the shelf and the builder is working. For **this lane** it effectively
has — there was no promotable work, no AFK wayfinder work, and no staging slot to use — but
that is not the trigger as written, and the correct response to it is not a Discord question.
Every one of the three asks is already specific, already in § Needs Christian, and already
reaches Christian through the hourly briefing within the hour. A Discord post would add a
channel, not an ask. If the next run finds the shelf below floor with the staging slot still
held, that is a different situation and the ask changes from "here is what needs you" to "the
machine is idle" — worth escalating then, on evidence, rather than pre-emptively now.
