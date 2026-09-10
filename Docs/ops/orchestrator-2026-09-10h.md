---
lane: tb-orchestrator
run: 2026-09-10h
promoted: 0
filed: 0
resolved: 0
newFindings: 2
needsChristian: true
---
# Orchestrator — 2026-09-10 (run h, ~10:32–10:50Z)

**The builder is working and the board is healthy on the build side.** [THR-1446](https://linear.app/threadbare/issue/THR-1446) merged at 09:52Z ([PR #1875](https://github.com/christianspliid-ui/threadbare/pull/1875)) and [THR-1450](https://linear.app/threadbare/issue/THR-1450) was claimed at 10:02Z with [PR #1876](https://github.com/christianspliid-ui/threadbare/pull/1876) already open. Two moves in eighty minutes, both the healthy kind. This lane promoted nothing and staged nothing; its only Linear writes were **two evidence comments, no state changes**.

With promotion barred and staging barred for the eighth consecutive run, the judgement budget went to a column this lane's prescribed scan never reads — `Idea` — and it came back with two findings, both consequences of the same blind spot. One is a queue of Christian-gated decisions nobody has ever shown him. The other is two tickets that were finished weeks ago and never closed.

## Needs Christian

**Two asks. The first is one word; the second is new and clears a queue that has been silently filling since July.**

### 1. Does every aftermath line need its concept tags, or only some? *(unchanged, fifth hour)*

[THR-1053 — the Composition Contract's `concepts` rule](https://linear.app/threadbare/issue/THR-1053/the-composition-contract-requires-concepts-on-every-aftermath-change)

Two documents disagree. The content rulebook says every aftermath change must carry concept tags; the code that reads them treats them as optional. Somebody checked the shipped code and **the code is right** — the tags decorate a sentence that already links up fine without them. Fourteen of the sixteen retrofit encounters pass every gate; the last two — *Snow on the Pass* and *Riders Behind the Caravan* — wait only on this. **The recommendation on file is to narrow the rule.** Say *narrow it* and they finish.

### 2. Six words the game already uses that the glossary has never blessed — and a way to stop them queueing *(new)*

The glossary is the tie-breaker: when the code, the docs and an agent disagree about what a word means, the glossary wins. Six proposed words are waiting for your yes, and the rule is explicit that **only a human can approve one** — so they cannot clear themselves. Measured this run against the glossary files: **none of the six is seated.** Oldest has been waiting **67 days**; three arrived in the last three days, one this morning.

| The word | What it would mean | Waiting since |
|---|---|---|
| [**hold**](https://linear.app/threadbare/issue/THR-1449) | a town a mortal keeps by *working* it — as opposed to a **freehold**, which they simply own | today |
| [**cast**](https://linear.app/threadbare/issue/THR-1445) (the verb) + **forecast tier** | a god *playing* a divine action card; and the pre-roll read of how a step looks | 1 day |
| [**agreement**](https://linear.app/threadbare/issue/THR-1441) (favour · mark) + **means** | the bargains mortals strike, and what they have to strike them with | 2 days |
| [**motive gate**](https://linear.app/threadbare/issue/THR-1408) | the licence every destroy verb needs before it may harm | 6 days |
| [**composition contract**](https://linear.app/threadbare/issue/THR-1406) | the encounter line's authoring gate — canonical for undertakings, unnamed for encounters | 7 days |
| [**motive receipt**](https://linear.app/threadbare/issue/THR-633) | the record of *why* an agent chose, which the foreshadowing prose reads | 67 days |

**Why it is not merely tidy.** The first row is the live example: *hold* and *freehold* are the same word in ordinary English and mean two different things in the game, and its own proposal says the two "must never be used for each other in player-facing prose." That instruction is unenforceable while the word does not exist in the glossary — every agent is free to blur them, and the prose is where you would eventually notice.

**My recommendation is the second option, not the first.** Either:

- **(a) One sitting.** Six yes/no calls, batched — probably fifteen minutes.
- **(b) Stop being the gate.** Rule once that agents may seat a proposed word themselves, with you keeping a veto, the way you already delegated gate and test calibration. Then this queue drains itself and never re-forms. The glossary rule currently says human approval always, so **only you can change it** — but changing it is a smaller decision than the six it would replace, permanently.

Say **"delegate it"** and I will route that as a rule change; say **"send me the six"** and they go into the briefing as a batch.

**Run g's second question has dissolved, as predicted.** The batch-3 session asked whether to wait for a fix to land. [That fix](https://linear.app/threadbare/issue/THR-1446) merged at 09:52Z. Nothing needed from you.

**Nothing else needs you that did not already.** Two jobs turned out to be finished-but-never-closed; that is bookkeeping and it is handled — see § T3 finding 2. No decision of yours is involved.

**Still open, deliberately not re-asked:** the [Physical Conflict map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)'s ten questions (all the legwork finished a week ago), [THR-1198](https://linear.app/threadbare/issue/THR-1198) (whose story a run tells), the [five scene images](https://linear.app/threadbare/issue/THR-876) awaiting a yes/no, the [attended screenshot sweep](https://linear.app/threadbare/issue/THR-1133), and [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — whether you mean to run the traits-wave-2 design pass yourself. That last one has sat in the design column since 15 August and is still the single reason no new design job can be queued.

**Nothing was padded.** The same eight tidying jobs were left alone for the eighth run running.

## T1 — unblock sweep

**Promoted: 0. Filed: 0. Held: 0. Blockers cleared: 0.** Promotion ceiling never engaged — shelf at 5, far below the 15-item backed-up threshold.

Board at scan (~10:33Z): **34 `Todo`** (15 `wayfinder:*`, skipped unconditionally) · **5 `Ready for Dev`**, all five carrying `Deferral` · **2 `In Dev`** ([THR-1450](https://linear.app/threadbare/issue/THR-1450) claimed + assigned + PR open; [THR-1130](https://linear.app/threadbare/issue/THR-1130) `Parked`, unassigned) · **1 `In Design`** ([THR-790](https://linear.app/threadbare/issue/THR-790)) · **78 `Idea`** · **0 `Implementation Planning`**.

**Four state-filtered calls, not the prescribed two.** T1 § *Scan* names only `Todo` and `Ready for Dev`; `Idea` and `Implementation Planning` were added by hand, as the standing note on this gap requires. `Implementation Planning` came back empty, so nothing was missed there — but the `Idea` call is where both of this run's findings came from, and it is the call the skill does not make.

Precheck fingerprint: `rg=no git=yes test=1.62s cu=unknown nm=session:healthy linear=nokey freshness=current`. `nokey` is the credential-free probe reporting reachability, not a failure — and the MCP connector answered all twenty-two calls this run, so the board was never dark.

**The shelf lost one and gained none, by the healthy exit.** [THR-1450](https://linear.app/threadbare/issue/THR-1450) left `Ready for Dev` by being *claimed* at 10:02:26Z. The five that remain all carry `Deferral`, so **program work on the shelf is 0** for the third consecutive hour.

**A count correction, not a board move.** Run g recorded 35 `Todo`; this run measures 34. Only **two** issues in the entire team were touched in the last 80 minutes — THR-1446 and THR-1450 — and neither was in `Todo`, so nothing left that column between the two scans. The difference is in one of the two counts, not in the board.

### Candidates — carried, with one correction

Nine non-wayfinder `Todo` candidates were re-read in full. **Every verdict matches [run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10g.md)'s table**, which is not restated here. Seven of the nine still decline as *wrong destination* — the ticket wants a design pass, not an executor.

**One line in that table needs correcting.** [THR-1318](https://linear.app/threadbare/issue/THR-1318) (the lens overlay engine) was recorded as *"direction fork **+ soft gate**"*, the soft gate being its body's *"better decided after"* [THR-1213](https://linear.app/threadbare/issue/THR-1213)'s content pass. **That gate is discharged:** THR-1213 went `Done` on 2026-08-28T08:36Z, its slice 4 shipping *"157 scenes learn what they are about"* ([PR #1686](https://github.com/christianspliid-ui/threadbare/pull/1686)) — which is precisely the `emotionalRegister` sparsity the gate was waiting on. The **direction-fork half stands unchanged** and is the whole of the decline now: activating it *"changes what the player reads at the most load-bearing beat in the game."* Recorded so the next sweep does not carry a gate that cleared thirteen days ago.

**`Idea`-column candidates, by the standing predicate** (*a freshly-filed `Deferral` in an active project*, not the ~50-item ungroomed tail):

| Ticket | Verdict | Evidence |
|---|---|---|
| [THR-1293](https://linear.app/threadbare/issue/THR-1293) | **Already satisfied** — finding 2 | Contract row 🟢 LIVE, deferral dropped; evidence commented on the ticket |
| [THR-1295](https://linear.app/threadbare/issue/THR-1295) | **Already satisfied** — finding 2 | Absorbed by THR-1309 (`Done` 08-28); evidence commented on the ticket |
| [THR-1294](https://linear.app/threadbare/issue/THR-1294) | **Unmet dependency — correctly held** | Five live `TODO(THR-1294)` markers across the strategic packs; its own test note says *"nothing walks an agent to its stage yet"*. Waits on doc 3's binder |
| [THR-1419](https://linear.app/threadbare/issue/THR-1419) | **Attended** | An attended pixel pass; not executor work |
| Six `UL-proposal`s | **Human gate** — finding 1 | Approval is human-only by rule; surfaced in § Needs Christian |

**No prior run's own hold was found stranded in `Idea`.** Neither THR-1293 nor THR-1295 carries a native `blockedBy` with a now-cleared release condition — the pattern that cost ~3h32m on 2026-08-28 did not recur this run.

**Standing declines — carried, not re-derived:** THR-1380 (satisfied upstream; re-verified this run by reading the shard, evidence already on the ticket, no lane may close it) · THR-1301 · THR-1088 · THR-984 · THR-1189 · THR-1148 · THR-1218 (blocker THR-1043 still `Todo`) · THR-1026 · THR-964 · THR-1198 · THR-716 · THR-1381 · THR-1156 · THR-789 · THR-1155 · THR-1043 · THR-870 · THR-791 · 15 `wayfinder:*` · THR-1133 (attended).

### The eight tidying tickets — still not promoted

THR-984, THR-758, THR-871, THR-949, THR-882, THR-893, THR-852, THR-752. **Eighth consecutive run holding this line.** The shelf is 5, so the starvation clause does not apply; none of the eight carries a quotable above-bar loss or a cost/benefit line, so the materiality bar does not either.

## T1.5 — wayfinder sweep

**Three open maps. AFK resolved: 0 of `ORCH_WAYFINDER_AFK_MAX` (2).**

**Eleventh consecutive sweep finding no agent-doable decision ticket.** This run measured it **team-wide by label** rather than map-by-map, which is a stronger statement than previous runs could make: **every** `wayfinder:research` issue in the team (21) and **every** `wayfinder:task` issue (5) is `Done`. There is no agent-doable wayfinder work anywhere on the board, not merely none on the current frontiers.

| Map | Open children | Research/task remaining |
|---|---|---|
| [THR-1258](https://linear.app/threadbare/issue/THR-1258) Physical Conflict | **10**, all HITL (6 grilling, 4 prototype), none assigned | **0** — all four research tickets `Done`, last on 09-07 |
| [THR-1226](https://linear.app/threadbare/issue/THR-1226) Powers & Spellcraft | 1 — THR-1232, assigned to Christian | **0** |
| [THR-1227](https://linear.app/threadbare/issue/THR-1227) Item Generator | 1 — THR-1236, unassigned prototype | **0** |

**The agent-doable half of all three maps is finished.** Twelve HITL tickets remain and every one waits on Christian. No map body was edited — this lane resolved nothing, so Decisions-so-far gains no line.

## T2 — design staging

**Triggered, and barred by the bound. Nothing staged, nothing mutated.**

Non-`Deferral` items in `Ready for Dev` = **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2.

`In Design` holds **1 live, 0 excluded**, against `ORCH_MAX_IN_DESIGN` of 1 — exactly at the ceiling:

| Issue | Assignee | Classification |
|---|---|---|
| [THR-790](https://linear.app/threadbare/issue/THR-790) | Christian | **Live** — assigned, so it counts on both arms of the `classifyInDesignItem` predicate regardless of staleness |

**Twenty-six days in column.** Its `updatedAt` reads 08:34:46Z this morning, but `stateHistory` shows no state change since it entered on 2026-08-15 and the touch shares a timestamp with THR-1448 to within 200ms — a relation write, not design progress. The predicate reads *activity*, and activity is not the same thing. **Nothing was changed here**: applying `Parked` or demoting is the grooming lane's remit and Christian's call.

**T2's candidate queue, strongest first:** [THR-1053](https://linear.app/threadbare/issue/THR-1053) (unchanged at the top — the only candidate blocking finished work), then [THR-1448](https://linear.app/threadbare/issue/THR-1448) (director direction from this morning, sequencing gate discharged as of 07:44Z), THR-1274, THR-1393, THR-1348, THR-1026, THR-964.

## T3 — architecture health

**Detectors not due. Already run in full today at 06:27 local by [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md)**, past `ORCH_HEALTH_SWEEP_HOUR` (06:00). **No detector was run this run.** Run c's two findings stand unchanged and are not restated: `check:process` exiting 0 with three sub-checks dark, and canon-staleness 27 → 28.

**`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, and not reported as clean.**

**Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).

**Redundancy: not assessed this sweep.** [Run g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10g.md) ran the judgement pass an hour ago and found the Companies `phaseMatch` regex defect; re-running it this hour would re-list one finding, which is the dump this tier forbids. Stated plainly rather than implied — the pass did not happen, and no reachability result is being dressed as one.

**Both findings below come from one cause:** the `Idea` column is outside this lane's prescribed scan, so whatever lands there is unseen until the grooming lane promotes it — and grooming correctly does not promote either a proposal awaiting a human or a ticket that is already finished. Two different things therefore accumulate in the same blind spot.

### Finding 1 (new) — six Christian-gated decisions are queued where nothing can show them to him

**The gap is structural, in this lane's own procedure.** T1 § *Scan* prescribes exactly two calls — `Todo` and `Ready for Dev` — while T1 § *Parse* says *"for each `Todo` / `Idea` candidate."* The scan does not implement the second half.

**Measured, not asserted:**

- **Six `UL-proposal` issues sit in `Idea`**: [THR-1449](https://linear.app/threadbare/issue/THR-1449) (today), [THR-1445](https://linear.app/threadbare/issue/THR-1445) (09-09), [THR-1441](https://linear.app/threadbare/issue/THR-1441) (09-08), [THR-1408](https://linear.app/threadbare/issue/THR-1408) (09-04), [THR-1406](https://linear.app/threadbare/issue/THR-1406) (09-03), [THR-633](https://linear.app/threadbare/issue/THR-633) (**2026-07-05 — 67 days**).
- **Zero of their proposed terms are seated.** Checked by heading grep across all eight shards, not inferred from ticket state. The single hit — `### Cast` in `Encounters.md` — is the **noun** (`supportBindings` viewed as characters, `Status: canonical`); [THR-1445](https://linear.app/threadbare/issue/THR-1445) proposes `cast` as a **verb**, a different sense that would need a disambiguation note against exactly that entry. It is unseated, and the near-collision is the kind of thing the flow exists to arbitrate.
- **The gate is explicit and human-only.** `Docs/ubiquitous-language/README.md:223` — *"always human-approved, never auto-merged"* — and `Process.md:133` repeats it: *"Approval is always human — no auto-merge."*
- **Nothing routes them to him.** `Design/briefing.md` on `origin/ops` contains **zero** matches for `UL-proposal` or any of the six ids. `Design/user-actions.md` names THR-1449 once, inside a narration of yesterday's ruling — as a by-product, never as an ask.
- **This lane has seen them and set them aside.** [Run 09-08g](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-08g.md) listed four in one clause — *"UL proposals awaiting arbitration (THR-1441, THR-1408, THR-1406, THR-633) … was not re-opened"* — classifying them as self-declaring from their titles. They *do* self-declare; what nobody did was notice that the arbiter is the one person this report writes to.
- **A seventh loose end, same class:** the shards carry exactly one `Status: proposed` entry, `Rebuild Road` in `Encounters.md`, belonging to none of the six — a proposal parked in the glossary itself rather than as a ticket.

**Consequence.** The UL is the terminology authority that wins every disagreement (CLAUDE.md § Session Workflow). An unseated word is a word every agent may use differently, and [THR-1449](https://linear.app/threadbare/issue/THR-1449)'s own body states the live hazard: *hold* and *freehold* "must never be used for each other in player-facing prose" — unenforceable while one of them is not a term.

**Cost/benefit:** costs six yes/no calls in one sitting, or one standing delegation that retires the gate permanently; not fixing it leaves the project's tie-breaking authority accepting new words at roughly one every three days and clearing none, with the drift landing in player-facing prose where it is most expensive to find.

### Finding 2 (new) — two tickets are provably finished and were never closed, both with a closing clause that did not fire

Same column, opposite failure: not work waiting to start, but work that finished and left its ticket open. **Both were verified against `origin/main`, and in both cases the repo itself already says the ticket is satisfied** — so the evidence was not inferred from a sibling's PR title, which is the trap this check exists to avoid.

| Ticket | Satisfied by | The clause that did not fire |
|---|---|---|
| [THR-1293](https://linear.app/threadbare/issue/THR-1293) — undertaking checkpoints have no player-facing consumer | [THR-1299](https://linear.app/threadbare/issue/THR-1299) slice 3, 2026-09-02 ([PR #1774](https://github.com/christianspliid-ui/threadbare/pull/1774)) | `scripts/interface-contracts.ts:2444`: *"THR-1293's Done-when … is satisfied here and **the ticket is closed by reference in the closeout**."* **8 days open since.** |
| [THR-1295](https://linear.app/threadbare/issue/THR-1295) — folded found-order has no faction payoff | [THR-1309](https://linear.app/threadbare/issue/THR-1309), `Done` 2026-08-28 ([PR #1690](https://github.com/christianspliid-ui/threadbare/pull/1690)) | THR-1309's own Done-when: *"THR-1295's Done-when satisfied and **that ticket closed against this one**."* **13 days open since.** |

The machine-checkable halves: `undertaking-checkpoint-events` now reads **🟢 LIVE** with an empty remediation column at `Docs/canon/interface-map.generated.md:230` — which *is* THR-1293's third Done-when clause; and THR-1295's `create_group` op is live at `strategicActionLifecycle.ts:1810` with `chartFaction` at `strategicGraphOps.ts:1529`, its Done-when pinned by a named test section (`undertakingT3Kinds.test.ts:445`), and the one surviving `TODO(THR-1295)` string in the tree sitting *inside* the doc comment that narrates the closure.

**Action taken: the evidence is now a comment on each ticket, and no state was changed.** This lane promotes and declines; it does not close. Disposition is a groomer or executor call, and the comment gives whoever takes it a one-read decline instead of this re-derivation. Precedent: run 09-08g did exactly this on THR-1088.

**This is now a six-instance class, and the count is the interesting part.** THR-1301, THR-1380, THR-1441, THR-1088, and now THR-1293 and THR-1295 — all real work that shipped (or became satisfiable) under a sibling id, with no machinery that will ever notice. Run d named the mechanism: *a real dependency between two tickets, stated in prose, that nothing reads*. Both of today's additions sharpen it, because in each case the closing instruction was **written into an acceptance clause** and still did not fire — so the failure is not that nobody wrote the dependency down, it is that a Done-when clause naming another ticket has no executor and no checker. Routed to the weekly retro under the scheduled-lane throttle, not to a ticket from this lane.

### Standing sub-duties

- **Hand-created `In Dev` tickets: none.** [THR-1450](https://linear.app/threadbare/issue/THR-1450) verified on `stateHistory` this run — `Todo` 07:25 → `Ready for Dev` 07:31 → `In Dev` 10:02, so it passed through the claim step properly. THR-1130 carried from run d.
- **Stalled work: none.** Nothing at or above `ORCH_STALLED_PICKUP_THRESHOLD` (3). THR-1450 sits at one transition. THR-1130's 4-transition count is a park artifact, recorded by run e, and it is off the shelf.
- **[THR-1130](https://linear.app/threadbare/issue/THR-1130)'s park remains stale, and this lane still does not lift it.** `In Dev` + `Parked` + unassigned, holding no executor slot. **Deliberately untouched** — lifting a park on an inference about liveness is the shape that let a lane strip a running session's assignee twice (impediment #755).

### Product vs process — the week

Trailing-week measure **~32 product / 8 process (~80% product)**, up one on the product side: [THR-1446](https://linear.app/threadbare/issue/THR-1446) closed this hour and is engine/content work. This run promoted nothing, so it moves neither side by its own action. Note the measure is understated by at least two: THR-1293 and THR-1295 are completed product work that no `Done` transition records.

**The headline is unchanged and now has a second face.** Design is the starved tier: seven of nine `Todo` candidates want a design pass, and the tier that would give them one is held by a single item nobody is working. What this run adds is that the same starvation has a **Christian-gated twin** — six naming decisions no lane could even *show* him — and that the blind spot hiding them was also hiding two finished jobs. The build pipeline is fine; the builder claimed work cleanly and has a PR open. What is starved is decision throughput, on both the design and the arbitration side; and the bookkeeping around it is losing track in both directions at once.

## Escalations

**None raised, none parked.** Discord was not contacted: `keep-work-flowing-cc` owns the doorbell, and the one new ask is a question for Christian that the briefing carries within the hour. Agreed work is not exhausted — there is plenty of it, and it is design-blocked rather than direction-blocked — so the stop-and-ask clause does not fire.

For the retro rather than for Christian, two rows, related but distinct:

1. **T1's `Scan` step implements only half its own `Parse` step.** `Idea` is unread by prescription, which is what produced both of this run's findings. Fix is one additional state-filtered call (plus `Implementation Planning`, empty today but historically load-bearing). The standing session note already prescribes hand-adding both every run; the skill has not been amended.
2. **A Done-when clause that names another ticket has no executor.** Six instances now, two of them with the closing instruction written explicitly into an acceptance list. Whatever the fix is, it is not "write the dependency down" — that was already done and it still did not fire.
